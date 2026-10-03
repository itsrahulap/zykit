import { describe, expect, it } from 'vitest';
import { check, imageTag, maskSecret, SAMPLE } from '../../../src/tools/kubernetes-yaml-checker/features/kubernetes-yaml-checker';

const ids = async (y: string) => (await check(y)).findings.map((f) => f.id);

const dep = (extra = '', tmpl = '') => `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      ${tmpl}
      containers:
        - name: c
          image: nginx:1.27
          ${extra}
`;

describe('structure', () => {
  it('reports missing basics and bad YAML', async () => {
    expect(await ids('kind: Pod\nmetadata: {}')).toEqual(expect.arrayContaining(['missing-apiVersion', 'missing-name']));
    expect(await ids('a: [')).toContain('yaml-syntax');
    expect(await ids('- 1\n- 2')).toContain('not-mapping');
  });
  it('flags removed apiVersions and a wrong version for a kind', async () => {
    const r = await check('apiVersion: extensions/v1beta1\nkind: Deployment\nmetadata:\n  name: a\n');
    expect(r.findings.find((f) => f.id === 'deprecated-api')?.fix).toContain('apps/v1');
    expect(await ids('apiVersion: v1\nkind: Deployment\nmetadata:\n  name: a\n')).toContain('wrong-apiVersion');
  });
  it('detects selector mismatch and duplicates', async () => {
    expect(await ids(dep().replace('app: web\n  template', 'app: other\n  template'))).toContain('selector-mismatch');
    expect(await ids(dep() + '---\n' + dep())).toContain('duplicate');
  });
  it('rejects too many aliases', async () => {
    const aliases = Array.from({ length: 150 }, (_, i) => `k${i}: *a`).join('\n');
    const r = await check(`a: &a [1]\n${aliases}\n`);
    expect(r.findings.some((f) => f.id === 'yaml-alias' || f.id === 'yaml-syntax')).toBe(true);
  });
});

describe('cross references', () => {
  const svc = (tp: string) => `---\napiVersion: v1\nkind: Service\nmetadata:\n  name: web\nspec:\n  selector:\n    app: web\n  ports:\n    - port: 80\n      targetPort: ${tp}\n`;
  it('compares targetPort with containerPort', async () => {
    const d = dep('ports:\n            - containerPort: 80\n              name: http');
    expect(await ids(d + svc('8080'))).toContain('target-port');
    expect(await ids(d + svc('80'))).not.toContain('target-port');
    expect(await ids(d + svc('http'))).not.toContain('target-port-name');
    expect(await ids(d + svc('nope'))).toContain('target-port-name');
  });
  it('flags a Service that selects nothing', async () => {
    expect(await ids(dep() + svc('80').replace('app: web\n  ports', 'app: zzz\n  ports'))).toContain('service-no-match');
  });
  it('checks Ingress backends', async () => {
    const ing = (n: string, p: number) => `---\napiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: i\nspec:\n  ingressClassName: x\n  rules:\n    - http:\n        paths:\n          - path: /\n            pathType: Prefix\n            backend:\n              service:\n                name: ${n}\n                port:\n                  number: ${p}\n`;
    expect(await ids(dep() + svc('80') + ing('missing', 80))).toContain('ingress-backend');
    expect(await ids(dep() + svc('80') + ing('web', 81))).toContain('ingress-port');
    const ok = await ids(dep() + svc('80') + ing('web', 80));
    expect(ok).not.toContain('ingress-backend');
    expect(ok).not.toContain('ingress-port');
  });
});

describe('best practices', () => {
  it('flags resources, images and probes', async () => {
    const r = await ids(dep().replace('nginx:1.27', 'nginx'));
    expect(r).toEqual(expect.arrayContaining(['no-requests', 'no-limits', 'image-latest', 'no-readiness', 'no-liveness', 'missing-pdb']));
    expect(await ids(dep().replace('nginx:1.27', 'nginx:latest'))).toContain('image-latest');
    expect(await ids(dep().replace('nginx:1.27', 'nginx@sha256:abc'))).not.toContain('image-latest');
  });
  it('checks the security context', async () => {
    const bad = await ids(dep('securityContext:\n            privileged: true'));
    expect(bad).toContain('privileged');
    const good = await ids(dep('securityContext:\n            runAsNonRoot: true\n            allowPrivilegeEscalation: false\n            readOnlyRootFilesystem: true\n            capabilities:\n              drop: [ALL]'));
    expect(good).not.toEqual(expect.arrayContaining(['run-as-root']));
    expect(good).not.toContain('priv-escalation');
    expect(good).not.toContain('caps-drop');
    expect(good).not.toContain('read-only-fs');
  });
  it('flags host access and plain env secrets', async () => {
    expect(await ids(dep('', 'hostNetwork: true'))).toContain('host-network');
    expect(await ids(dep('', 'volumes:\n        - name: v\n          hostPath:\n            path: /var'))).toContain('host-path');
    expect(await ids(dep('env:\n            - name: DB_PASSWORD\n              value: x'))).toContain('env-secret');
  });
  it('flags a single replica', async () => {
    expect(await ids(dep().replace('replicas: 2', 'replicas: 1'))).toContain('single-replica');
  });
});

describe('secrets and cron', () => {
  it('masks decoded secret values', async () => {
    const r = await check('apiVersion: v1\nkind: Secret\nmetadata:\n  name: s\ndata:\n  pw: aHVudGVyMg==\n');
    const f = r.findings.find((x) => x.id === 'secret-plain')!;
    expect(f.explain).toContain('hu•');
    expect(f.explain).not.toContain('hunter2');
    expect(maskSecret('%%%')).toBe('(not valid base64)');
  });
  it('explains cron schedules', async () => {
    const y = (s: string) => `apiVersion: batch/v1\nkind: CronJob\nmetadata:\n  name: j\nspec:\n  schedule: "${s}"\n  jobTemplate:\n    spec:\n      template:\n        spec:\n          restartPolicy: Never\n          containers:\n            - name: c\n              image: a:1\n`;
    const ok = await check(y('0 2 * * *'));
    expect(ok.findings.find((f) => f.id === 'cron-explained')?.title).toMatch(/02:00|2:00/);
    expect(await ids(y('99 * * * *'))).toContain('cron-schedule');
  });
});

describe('helpers and sample', () => {
  it('parses image tags', () => {
    expect(imageTag('nginx')).toEqual({ tag: null, pinned: false });
    expect(imageTag('localhost:5000/app')).toEqual({ tag: null, pinned: false });
    expect(imageTag('a/b:1')).toEqual({ tag: '1', pinned: false });
  });
  it('lists every resource in the sample and sorts errors first', async () => {
    const r = await check(SAMPLE);
    expect(r.resources.map((x) => x.kind)).toEqual(['Deployment', 'Service', 'Ingress', 'CronJob', 'Secret']);
    expect(r.findings[0].severity).toBe('error');
    expect(r.counts.error + r.counts.warning + r.counts.info).toBe(r.findings.length);
  });
  it('handles empty and oversized input', async () => {
    expect((await check('  ')).resources).toEqual([]);
    expect((await check('a'.repeat(1_000_001))).error).toMatch(/too large/);
  });
});
