// Kubernetes manifest checks: structure, cross-resource references and best practices.
// Pure logic; the `yaml` package is imported lazily by `check`. Nothing is sent anywhere.

import { describeCron, parseCron } from '../../cron-builder/features/cron';

export type Severity = 'error' | 'warning' | 'info';

export interface Finding {
  id: string;
  severity: Severity;
  /** "Kind/name" of the resource, or "Document N" when it has none. */
  resource: string;
  title: string;
  explain: string;
  fix?: string;
}

export interface ResourceRow {
  doc: number;
  kind: string;
  apiVersion: string;
  name: string;
  namespace: string;
  summary: string;
}

export interface CheckResult {
  error: string | null;
  resources: ResourceRow[];
  findings: Finding[];
  counts: Record<Severity, number>;
}

export const MAX_INPUT_CHARS = 1_000_000;
export const MAX_DOCUMENTS = 300;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type A = any;

/** Kinds this checker recognises, with the apiVersions that are current for them. */
export const KNOWN_KINDS: Record<string, string[]> = {
  Deployment: ['apps/v1'],
  StatefulSet: ['apps/v1'],
  DaemonSet: ['apps/v1'],
  ReplicaSet: ['apps/v1'],
  Job: ['batch/v1'],
  CronJob: ['batch/v1'],
  Pod: ['v1'],
  ReplicationController: ['v1'],
  Service: ['v1'],
  Ingress: ['networking.k8s.io/v1'],
  IngressClass: ['networking.k8s.io/v1'],
  ConfigMap: ['v1'],
  Secret: ['v1'],
  Namespace: ['v1'],
  PersistentVolume: ['v1'],
  PersistentVolumeClaim: ['v1'],
  ServiceAccount: ['v1'],
  HorizontalPodAutoscaler: ['autoscaling/v2', 'autoscaling/v1'],
  PodDisruptionBudget: ['policy/v1'],
  NetworkPolicy: ['networking.k8s.io/v1'],
  Role: ['rbac.authorization.k8s.io/v1'],
  RoleBinding: ['rbac.authorization.k8s.io/v1'],
  ClusterRole: ['rbac.authorization.k8s.io/v1'],
  ClusterRoleBinding: ['rbac.authorization.k8s.io/v1'],
  ResourceQuota: ['v1'],
  LimitRange: ['v1'],
  StorageClass: ['storage.k8s.io/v1'],
  CustomResourceDefinition: ['apiextensions.k8s.io/v1'],
};

const DEPRECATED: Record<string, { removed: string; use: (kind: string) => string }> = {
  'extensions/v1beta1': { removed: '1.16 (Ingress: 1.22)', use: (k) => (k === 'Ingress' ? 'networking.k8s.io/v1' : k === 'NetworkPolicy' ? 'networking.k8s.io/v1' : 'apps/v1') },
  'apps/v1beta1': { removed: '1.16', use: () => 'apps/v1' },
  'apps/v1beta2': { removed: '1.16', use: () => 'apps/v1' },
  'networking.k8s.io/v1beta1': { removed: '1.22', use: () => 'networking.k8s.io/v1' },
  'batch/v1beta1': { removed: '1.25', use: () => 'batch/v1' },
  'policy/v1beta1': { removed: '1.25', use: () => 'policy/v1' },
  'autoscaling/v2beta1': { removed: '1.25', use: () => 'autoscaling/v2' },
  'autoscaling/v2beta2': { removed: '1.26', use: () => 'autoscaling/v2' },
  'rbac.authorization.k8s.io/v1beta1': { removed: '1.22', use: () => 'rbac.authorization.k8s.io/v1' },
  'rbac.authorization.k8s.io/v1alpha1': { removed: '1.22', use: () => 'rbac.authorization.k8s.io/v1' },
  'storage.k8s.io/v1beta1': { removed: '1.22 (most kinds)', use: () => 'storage.k8s.io/v1' },
  'apiextensions.k8s.io/v1beta1': { removed: '1.22', use: () => 'apiextensions.k8s.io/v1' },
};

const WORKLOADS = ['Deployment', 'StatefulSet', 'DaemonSet', 'ReplicaSet', 'ReplicationController', 'Job', 'CronJob', 'Pod'];
const LONG_RUNNING = ['Deployment', 'StatefulSet', 'DaemonSet', 'ReplicaSet', 'ReplicationController', 'Pod'];

const isObj = (v: unknown): v is Record<string, A> => typeof v === 'object' && v !== null && !Array.isArray(v);
const arr = (v: unknown): A[] => (Array.isArray(v) ? v : []);
const ind = (text: string, n: number) =>
  text
    .split('\n')
    .map((l) => ' '.repeat(n) + l)
    .join('\n');

interface Res {
  doc: number;
  kind: string;
  apiVersion: string;
  name: string;
  ns: string;
  ref: string;
  body: A;
  /** Pod spec and the template's labels, for workloads. */
  pod: A | null;
  labels: Record<string, string>;
  podPath: string;
}

export function podOf(kind: string, body: A): { pod: A; labels: Record<string, string>; path: string } | null {
  if (!WORKLOADS.includes(kind) || !isObj(body.spec)) return null;
  let pod: A;
  let meta: A;
  let path: string;
  if (kind === 'Pod') {
    pod = body.spec;
    meta = body.metadata;
    path = 'spec';
  } else if (kind === 'CronJob') {
    const t = body.spec.jobTemplate?.spec?.template;
    pod = t?.spec;
    meta = t?.metadata;
    path = 'spec.jobTemplate.spec.template.spec';
  } else {
    pod = body.spec.template?.spec;
    meta = body.spec.template?.metadata;
    path = 'spec.template.spec';
  }
  if (!isObj(pod)) return null;
  const labels: Record<string, string> = {};
  if (isObj(meta?.labels)) for (const [k, v] of Object.entries(meta.labels)) labels[k] = String(v);
  return { pod, labels, path };
}

/** Image reference parts: "nginx" has no tag, "nginx:1.27" has, "nginx@sha256:…" is pinned. */
export function imageTag(image: string): { tag: string | null; pinned: boolean } {
  if (image.includes('@')) return { tag: null, pinned: true };
  const last = image.slice(image.lastIndexOf('/') + 1);
  const i = last.indexOf(':');
  return { tag: i === -1 ? null : last.slice(i + 1), pinned: false };
}

export function maskSecret(b64: string): string {
  let plain = '';
  try {
    plain = new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s+/g, '')), (c) => c.charCodeAt(0)));
  } catch {
    return '(not valid base64)';
  }
  if (!plain) return '(empty)';
  return plain.length <= 4 ? '••••' : `${plain.slice(0, 2)}${'•'.repeat(Math.min(plain.length - 2, 8))} (${plain.length} chars)`;
}

const SECRET_NAME = /(pass(word|wd)?|secret|token|api[-_]?key|private[-_]?key|credential)/i;
const DANGEROUS_CAPS = ['SYS_ADMIN', 'NET_ADMIN', 'NET_RAW', 'SYS_PTRACE', 'SYS_MODULE', 'ALL'];

export async function check(text: string): Promise<CheckResult> {
  const empty: CheckResult = { error: null, resources: [], findings: [], counts: { error: 0, warning: 0, info: 0 } };
  if (!text.trim()) return empty;
  if (text.length > MAX_INPUT_CHARS) return { ...empty, error: 'This input is too large to check here (limit: about 1 MB).' };
  const { parseAllDocuments } = await import('yaml');
  const docs = parseAllDocuments(text, { prettyErrors: false });
  const findings: Finding[] = [];
  const resources: ResourceRow[] = [];
  const all: Res[] = [];
  const count = (r: CheckResult) => {
    for (const f of r.findings) r.counts[f.severity]++;
    return r;
  };

  const add = (resource: string, severity: Severity, id: string, title: string, explain: string, fix?: string) =>
    findings.push({ id, severity, resource, title, explain, fix });

  if (docs.length > MAX_DOCUMENTS) return { ...empty, error: `Too many YAML documents (limit: ${MAX_DOCUMENTS}).` };

  docs.forEach((d, i) => {
    const n = i + 1;
    const label = `Document ${n}`;
    if (d.errors.length) {
      for (const e of d.errors.slice(0, 3)) {
        const pos = e.linePos?.[0];
        add(label, 'error', 'yaml-syntax', 'YAML could not be parsed', `${e.message.split('\n')[0]}${pos ? ` (line ${pos.line}, column ${pos.col})` : ''}. Kubernetes rejects a manifest that is not valid YAML.`, 'Fix the indentation or quoting at that line; YAML uses spaces, never tabs.');
      }
      return;
    }
    let body: A;
    try {
      body = d.toJS({ maxAliasCount: 100 });
    } catch (e) {
      add(label, 'error', 'yaml-alias', 'Too many YAML aliases', `${(e as Error).message}. Large alias expansion is rejected to avoid "billion laughs" style input.`);
      return;
    }
    if (body === null || body === undefined) return; // empty document between ---
    if (!isObj(body)) {
      add(label, 'error', 'not-mapping', 'Document is not a mapping', 'A Kubernetes manifest must be a YAML mapping with apiVersion, kind and metadata.', 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: example');
      return;
    }
    if (body.kind === 'List' && Array.isArray(body.items)) {
      body.items.forEach((it: A, j: number) => register(it, `${n}.${j + 1}`, n));
      return;
    }
    register(body, String(n), n);
  });

  function register(body: A, tag: string, doc: number) {
    const label = `Document ${tag}`;
    if (!isObj(body)) return add(label, 'error', 'not-mapping', 'Item is not a mapping', 'Every item must be a mapping with apiVersion, kind and metadata.');
    const kind = typeof body.kind === 'string' ? body.kind : '';
    const apiVersion = typeof body.apiVersion === 'string' ? body.apiVersion : '';
    const name = typeof body.metadata?.name === 'string' ? body.metadata.name : '';
    const ns = typeof body.metadata?.namespace === 'string' ? body.metadata.namespace : 'default';
    const ref = kind && name ? `${kind}/${name}` : kind || label;
    if (!apiVersion) add(ref, 'error', 'missing-apiVersion', 'apiVersion is missing', 'Every object needs an apiVersion so the API server knows which schema to use.', `apiVersion: ${KNOWN_KINDS[kind]?.[0] ?? 'v1'}`);
    if (!kind) add(ref, 'error', 'missing-kind', 'kind is missing', 'Every object needs a kind such as Deployment or Service.', 'kind: Deployment');
    if (!name && !body.metadata?.generateName)
      add(ref, 'error', 'missing-name', 'metadata.name is missing', 'Objects must be named (or use metadata.generateName with kubectl create).', 'metadata:\n  name: my-app');
    else if (typeof name === 'string' && name && !/^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$/.test(name) && !['Role', 'ClusterRole', 'RoleBinding', 'ClusterRoleBinding'].includes(kind))
      add(ref, 'error', 'bad-name', `metadata.name "${name}" is not a valid name`, 'Most names must be lowercase letters, digits, "-" or ".", starting and ending with a letter or digit (max 253 characters).', `metadata:\n  name: ${name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-+|-+$/g, '')}`);

    const pod = podOf(kind, body);
    const r: Res = { doc, kind, apiVersion, name, ns, ref, body, pod: pod?.pod ?? null, labels: pod?.labels ?? {}, podPath: pod?.path ?? '' };
    if (kind && name && all.some((o) => o.kind === kind && o.name === name && o.ns === ns))
      add(ref, 'error', 'duplicate', 'Duplicate resource', `Another ${kind} named "${name}" in namespace "${ns}" is in this paste. The later one would overwrite the first on apply.`);
    all.push(r);

    if (kind && !KNOWN_KINDS[kind]) add(ref, 'info', 'unknown-kind', `Kind "${kind}" is not checked`, 'It may be a custom resource; only the basic structure was checked.');
    const dep = DEPRECATED[apiVersion];
    if (dep) {
      const use = dep.use(kind);
      add(ref, 'error', 'deprecated-api', `apiVersion ${apiVersion} was removed`, `${apiVersion} was removed in Kubernetes ${dep.removed}; current clusters reject it.`, `apiVersion: ${use}`);
    } else if (KNOWN_KINDS[kind] && apiVersion && !KNOWN_KINDS[kind].includes(apiVersion))
      add(ref, 'warning', 'wrong-apiVersion', `apiVersion ${apiVersion} does not match kind ${kind}`, `${kind} normally uses ${KNOWN_KINDS[kind].join(' or ')}.`, `apiVersion: ${KNOWN_KINDS[kind][0]}`);
  }

  // ---- per-resource checks ----
  for (const r of all) {
    const { kind, ref, body } = r;
    const spec = isObj(body.spec) ? body.spec : {};
    const row: string[] = [];
    if (typeof spec.replicas === 'number') row.push(`replicas ${spec.replicas}`);

    if (r.pod) {
      const containers = arr(r.pod.containers);
      const inits = arr(r.pod.initContainers);
      row.push(`${containers.length} container${containers.length === 1 ? '' : 's'}`);
      checkSelector(r);
      checkPod(r, containers, inits);
      if (kind === 'Deployment' && spec.replicas === 1)
        add(ref, 'info', 'single-replica', 'Only one replica', 'With replicas: 1 the app is unavailable during node drains, rollouts that fail readiness, and crashes.', 'spec:\n  replicas: 2');
      if (['Deployment', 'StatefulSet'].includes(kind) && (spec.replicas ?? 1) >= 2 && !all.some((o) => o.kind === 'PodDisruptionBudget' && o.ns === r.ns && matches(o.body.spec?.selector?.matchLabels, r.labels)))
        add(ref, 'info', 'missing-pdb', 'No PodDisruptionBudget in this paste', 'Without a PDB, a node drain or upgrade can evict every replica at once.', `apiVersion: policy/v1\nkind: PodDisruptionBudget\nmetadata:\n  name: ${r.name || 'app'}\nspec:\n  minAvailable: 1\n  selector:\n    matchLabels:\n${ind(Object.entries(r.labels).map(([k, v]) => `${k}: ${v}`).join('\n') || 'app: my-app', 6)}`);
    }
    if (kind === 'CronJob') checkCron(r, spec);
    if (kind === 'Service') checkService(r, spec, row);
    if (kind === 'Ingress') checkIngress(r, spec, row);
    if (kind === 'Secret') checkSecret(r, row);
    if (kind === 'HorizontalPodAutoscaler') {
      const t = spec.scaleTargetRef;
      if (!isObj(t) || !t.kind || !t.name) add(ref, 'error', 'hpa-target', 'scaleTargetRef is missing', 'An HPA needs spec.scaleTargetRef with apiVersion, kind and name.', 'spec:\n  scaleTargetRef:\n    apiVersion: apps/v1\n    kind: Deployment\n    name: my-app');
      else {
        row.push(`targets ${t.kind}/${t.name}`);
        if (!all.some((o) => o.kind === t.kind && o.name === t.name && o.ns === r.ns))
          add(ref, 'warning', 'hpa-target-missing', `Scale target ${t.kind}/${t.name} is not in this paste`, 'The HPA does nothing if the target does not exist in the same namespace.');
      }
    }
    if (kind === 'PodDisruptionBudget' && isObj(spec.selector?.matchLabels) && !all.some((o) => o.pod && o.ns === r.ns && matches(spec.selector.matchLabels, o.labels)))
      add(ref, 'warning', 'pdb-selector', 'PodDisruptionBudget selects no workload in this paste', 'Its selector.matchLabels do not match the pod labels of any workload here.');
    if (kind === 'NetworkPolicy' && !isObj(spec.podSelector)) add(ref, 'error', 'netpol-selector', 'podSelector is missing', 'A NetworkPolicy must have spec.podSelector ({} selects every pod in the namespace).', 'spec:\n  podSelector: {}');
    if (kind === 'RoleBinding' || kind === 'ClusterRoleBinding') {
      const rr = body.roleRef;
      if (!isObj(rr) || !rr.name) add(ref, 'error', 'roleref', 'roleRef is missing', 'A binding needs roleRef with apiGroup, kind and name.', 'roleRef:\n  apiGroup: rbac.authorization.k8s.io\n  kind: Role\n  name: my-role');
      else {
        row.push(`binds ${rr.kind}/${rr.name}`);
        if (rr.name === 'cluster-admin') add(ref, 'warning', 'cluster-admin', 'Binds cluster-admin', 'cluster-admin grants full control of the cluster. Prefer a role with only the verbs and resources the subject needs.');
      }
    }
    if (kind === 'Role' || kind === 'ClusterRole') {
      const rules = arr(body.rules);
      row.push(`${rules.length} rule${rules.length === 1 ? '' : 's'}`);
      if (rules.some((x) => arr(x?.verbs).includes('*') || arr(x?.resources).includes('*')))
        add(ref, 'warning', 'rbac-wildcard', 'Wildcard verbs or resources', 'A "*" in verbs or resources grants more than most workloads need and is hard to audit.', 'rules:\n  - apiGroups: [""]\n    resources: ["pods"]\n    verbs: ["get", "list", "watch"]');
    }
    if (r.kind === 'ServiceAccount' || kind === 'ConfigMap') row.push(`${Object.keys(body.data ?? {}).length} key(s)`);
    resources.push({ doc: r.doc, kind: r.kind || '?', apiVersion: r.apiVersion || '?', name: r.name || '?', namespace: r.ns, summary: row.join(' · ') });
  }

  // workloads that use a ServiceAccount missing from the paste (info)
  for (const r of all) {
    const sa = r.pod?.serviceAccountName;
    if (sa && sa !== 'default' && all.some((o) => o.kind === 'ServiceAccount') && !all.some((o) => o.kind === 'ServiceAccount' && o.name === sa && o.ns === r.ns))
      add(r.ref, 'info', 'sa-missing', `ServiceAccount "${sa}" is not in this paste`, 'The pod will fail to create if that ServiceAccount does not exist in the namespace.');
  }

  function matches(sel: A, labels: Record<string, string>): boolean {
    if (!isObj(sel) || Object.keys(sel).length === 0) return false;
    return Object.entries(sel).every(([k, v]) => labels[k] === String(v));
  }

  function checkSelector(r: Res) {
    if (!['Deployment', 'StatefulSet', 'DaemonSet', 'ReplicaSet'].includes(r.kind)) return;
    const sel = r.body.spec.selector;
    const labelsYaml = Object.entries(r.labels).map(([k, v]) => `${k}: ${v}`).join('\n');
    if (!isObj(sel) || (!isObj(sel.matchLabels) && !arr(sel.matchExpressions).length))
      return add(r.ref, 'error', 'selector-missing', 'spec.selector is missing', `In apps/v1 ${r.kind} requires a selector that matches the pod template labels.`, `spec:\n  selector:\n    matchLabels:\n${ind(labelsYaml || 'app: my-app', 6)}`);
    if (!Object.keys(r.labels).length) return add(r.ref, 'error', 'template-labels', 'Pod template has no labels', 'The selector can only match pods that carry labels; set spec.template.metadata.labels.', `spec:\n  template:\n    metadata:\n      labels:\n${ind(Object.entries(sel.matchLabels ?? {}).map(([k, v]) => `${k}: ${v}`).join('\n') || 'app: my-app', 8)}`);
    if (isObj(sel.matchLabels)) {
      const bad = Object.entries(sel.matchLabels).filter(([k, v]) => r.labels[k] !== String(v));
      if (bad.length)
        add(r.ref, 'error', 'selector-mismatch', 'Selector does not match the pod template labels', `selector.matchLabels has ${bad.map(([k, v]) => `${k}=${v}`).join(', ')} but the template labels are ${Object.entries(r.labels).map(([k, v]) => `${k}=${v}`).join(', ') || 'empty'}. The API server rejects this.`, `spec:\n  template:\n    metadata:\n      labels:\n${ind(Object.entries(sel.matchLabels).map(([k, v]) => `${k}: ${v}`).join('\n'), 8)}`);
    }
  }

  function checkPod(r: Res, containers: A[], inits: A[]) {
    const pod = r.pod;
    const p = r.podPath;
    if (!containers.length) add(r.ref, 'error', 'no-containers', 'No containers defined', `${p}.containers must list at least one container.`, `containers:\n  - name: app\n    image: my-app:1.0.0`);
    const seen = new Set<string>();
    if (pod.hostNetwork === true) add(r.ref, 'warning', 'host-network', 'hostNetwork is enabled', 'The pod shares the node network namespace, bypassing NetworkPolicy and risking port clashes.', 'hostNetwork: false');
    if (pod.hostPID === true || pod.hostIPC === true) add(r.ref, 'warning', 'host-pid', 'hostPID or hostIPC is enabled', 'The pod can see processes or IPC of the node and other pods.', 'hostPID: false\nhostIPC: false');
    for (const v of arr(pod.volumes))
      if (isObj(v?.hostPath)) add(r.ref, 'warning', 'host-path', `hostPath volume "${v.name}"`, `Mounting ${v.hostPath.path ?? 'a node path'} exposes the node filesystem and ties the pod to a node. Use a PersistentVolumeClaim, emptyDir or ConfigMap instead.`, `volumes:\n  - name: ${v.name}\n    emptyDir: {}`);
    if (LONG_RUNNING.includes(r.kind) && pod.restartPolicy && pod.restartPolicy !== 'Always' && r.kind !== 'Pod')
      add(r.ref, 'error', 'restart-policy', `restartPolicy ${pod.restartPolicy} is not allowed here`, `${r.kind} pods must use restartPolicy: Always.`, 'restartPolicy: Always');
    if (['Job', 'CronJob'].includes(r.kind) && pod.restartPolicy !== 'Never' && pod.restartPolicy !== 'OnFailure')
      add(r.ref, 'error', 'restart-policy', 'Job pods need restartPolicy Never or OnFailure', 'A Job must set restartPolicy to Never or OnFailure; Always (the default) is rejected.', 'restartPolicy: OnFailure');
    const podSc = isObj(pod.securityContext) ? pod.securityContext : {};
    const all2 = [...containers.map((c) => ({ c, init: false })), ...inits.map((c) => ({ c, init: true }))];
    for (const { c, init } of all2) {
      if (!isObj(c)) continue;
      const cn = String(c.name ?? '?');
      const tag = `${init ? 'init container' : 'container'} "${cn}"`;
      const key = `${init}:${cn}`;
      if (seen.has(key)) add(r.ref, 'error', 'dup-container', `Duplicate container name "${cn}"`, 'Container names must be unique within a pod.');
      seen.add(key);
      const image = typeof c.image === 'string' ? c.image : '';
      if (!image) add(r.ref, 'error', 'no-image', `${tag} has no image`, 'Every container needs an image.', `- name: ${cn}\n  image: my-app:1.0.0`);
      else {
        const t = imageTag(image);
        if (!t.pinned && (t.tag === null || t.tag === 'latest'))
          add(r.ref, 'warning', 'image-latest', `${tag} uses ${t.tag === null ? 'an untagged image' : 'the :latest tag'} (${image})`, 'Without a version tag the image can change underneath you, deployments are not reproducible and rollbacks do not restore the old code.', `image: ${image.replace(/:latest$/, '')}:1.2.3`);
      }
      if (init) continue;
      const res = isObj(c.resources) ? c.resources : {};
      if (!isObj(res.requests) || !Object.keys(res.requests).length)
        add(r.ref, 'warning', 'no-requests', `${tag} has no resource requests`, 'The scheduler uses requests to place pods. Without them pods are packed blindly and get evicted first under pressure.', 'resources:\n  requests:\n    cpu: 100m\n    memory: 128Mi');
      if (!isObj(res.limits) || !Object.keys(res.limits).length)
        add(r.ref, 'warning', 'no-limits', `${tag} has no resource limits`, 'A container without a memory limit can use all node memory and take other pods down with it.', 'resources:\n  limits:\n    memory: 256Mi');
      if (LONG_RUNNING.includes(r.kind)) {
        if (!c.readinessProbe) add(r.ref, 'warning', 'no-readiness', `${tag} has no readinessProbe`, 'Without a readiness probe traffic is sent to the pod as soon as the process starts, and rollouts cannot tell when it is ready.', 'readinessProbe:\n  httpGet:\n    path: /healthz\n    port: 8080\n  initialDelaySeconds: 5\n  periodSeconds: 10');
        if (!c.livenessProbe) add(r.ref, 'info', 'no-liveness', `${tag} has no livenessProbe`, 'A liveness probe lets the kubelet restart a container that is running but stuck.', 'livenessProbe:\n  httpGet:\n    path: /healthz\n    port: 8080\n  initialDelaySeconds: 15\n  periodSeconds: 20');
      }
      const sc = isObj(c.securityContext) ? c.securityContext : {};
      const nonRoot = sc.runAsNonRoot ?? podSc.runAsNonRoot;
      const uid = sc.runAsUser ?? podSc.runAsUser;
      if (sc.privileged === true) add(r.ref, 'error', 'privileged', `${tag} runs privileged`, 'A privileged container has nearly all the capabilities of the node and can escape the container.', 'securityContext:\n  privileged: false');
      if (nonRoot !== true && !(typeof uid === 'number' && uid > 0))
        add(r.ref, 'warning', 'run-as-root', `${tag} may run as root`, 'runAsNonRoot is not set to true, so the image decides the user; many images default to root.', 'securityContext:\n  runAsNonRoot: true\n  runAsUser: 10001');
      if (sc.allowPrivilegeEscalation !== false && sc.privileged !== true)
        add(r.ref, 'warning', 'priv-escalation', `${tag} allows privilege escalation`, 'allowPrivilegeEscalation defaults to true, which lets a process gain more privileges than its parent (setuid binaries).', 'securityContext:\n  allowPrivilegeEscalation: false');
      if (sc.readOnlyRootFilesystem !== true)
        add(r.ref, 'info', 'read-only-fs', `${tag} has a writable root filesystem`, 'A read-only root filesystem stops an attacker from modifying binaries or dropping tools. Mount emptyDir volumes for paths the app must write.', 'securityContext:\n  readOnlyRootFilesystem: true');
      const caps = isObj(sc.capabilities) ? sc.capabilities : {};
      const added = arr(caps.add).map(String).filter((x) => DANGEROUS_CAPS.includes(x.toUpperCase()));
      if (added.length) add(r.ref, 'warning', 'caps-add', `${tag} adds capabilities: ${added.join(', ')}`, 'These capabilities widen what a compromised process can do. Add only what is strictly needed.', 'securityContext:\n  capabilities:\n    drop: ["ALL"]');
      else if (!arr(caps.drop).map((x) => String(x).toUpperCase()).includes('ALL'))
        add(r.ref, 'info', 'caps-drop', `${tag} does not drop all capabilities`, 'Containers start with a default set of Linux capabilities. Drop them all and add back only what you need.', 'securityContext:\n  capabilities:\n    drop: ["ALL"]');
      for (const port of arr(c.ports)) if (isObj(port) && port.hostPort) add(r.ref, 'info', 'host-port', `${tag} uses hostPort ${port.hostPort}`, 'hostPort binds a port on the node, limiting scheduling to one pod per node per port. Use a Service instead.');
      for (const e of arr(c.env))
        if (isObj(e) && typeof e.name === 'string' && SECRET_NAME.test(e.name) && typeof e.value === 'string' && e.value && !e.valueFrom)
          add(r.ref, 'warning', 'env-secret', `${tag} sets ${e.name} as a plain env value`, 'Credentials in manifests end up in Git and in `kubectl get`. Read them from a Secret instead.', `env:\n  - name: ${e.name}\n    valueFrom:\n      secretKeyRef:\n        name: my-secret\n        key: ${String(e.name).toLowerCase().replace(/_/g, '-')}`);
    }
  }

  function containerPorts(sel: A, ns: string) {
    const ports: { number?: number; name?: string }[] = [];
    let found = false;
    for (const w of all) {
      if (!w.pod || w.ns !== ns || !matches(sel, w.labels)) continue;
      found = true;
      for (const c of arr(w.pod.containers)) for (const p of arr(c?.ports)) if (isObj(p)) ports.push({ number: p.containerPort, name: p.name });
    }
    return { found, ports };
  }

  function checkService(r: Res, spec: A, row: string[]) {
    const ports = arr(spec.ports);
    row.push(`${spec.type ?? 'ClusterIP'}`, ports.map((p) => `${p?.port}${p?.targetPort ? `→${p.targetPort}` : ''}`).join(', '));
    if (spec.type === 'LoadBalancer' || spec.type === 'NodePort') add(r.ref, 'info', 'service-exposed', `Service type ${spec.type}`, spec.type === 'NodePort' ? 'NodePort opens a port on every node. Prefer ClusterIP with an Ingress.' : 'LoadBalancer provisions a cloud load balancer (and cost) per Service. Consider an Ingress to share one.');
    if (spec.type === 'ExternalName') return;
    if (!ports.length) add(r.ref, 'error', 'service-ports', 'Service has no ports', 'spec.ports must list at least one port.', 'spec:\n  ports:\n    - port: 80\n      targetPort: 8080');
    if (!isObj(spec.selector) || !Object.keys(spec.selector).length) return add(r.ref, 'info', 'service-selector', 'Service has no selector', 'Without a selector no pods are selected automatically; you must create Endpoints yourself.');
    const { found, ports: cp } = containerPorts(spec.selector, r.ns);
    if (!found) {
      if (all.some((w) => w.pod)) add(r.ref, 'warning', 'service-no-match', 'Selector matches no workload in this paste', `selector ${Object.entries(spec.selector).map(([k, v]) => `${k}=${v}`).join(', ')} does not match the pod template labels of any workload here, so the Service would have no endpoints.`);
      return;
    }
    for (const p of ports) {
      const t = p?.targetPort ?? p?.port;
      if (typeof t === 'number' && cp.length && !cp.some((x) => x.number === t))
        add(r.ref, 'warning', 'target-port', `targetPort ${t} is not a containerPort`, `The selected pods declare ports ${cp.map((x) => x.number).join(', ')}. containerPort is informational, but a mismatch usually means traffic goes to a port nothing listens on.`, `ports:\n  - port: ${p.port}\n    targetPort: ${cp[0].number}`);
      else if (typeof t === 'string' && !cp.some((x) => x.name === t))
        add(r.ref, 'error', 'target-port-name', `targetPort "${t}" names no container port`, 'A named targetPort must match the name of a containerPort in the selected pods.', `ports:\n  - name: ${t}\n    containerPort: ${p?.port ?? 8080}`);
    }
  }

  function checkIngress(r: Res, spec: A, row: string[]) {
    const backends: { name: string; port: A; legacy: boolean }[] = [];
    const take = (b: A) => {
      if (!isObj(b)) return;
      if (b.service) backends.push({ name: String(b.service.name ?? ''), port: b.service.port?.number ?? b.service.port?.name, legacy: false });
      else if (b.serviceName) backends.push({ name: String(b.serviceName), port: b.servicePort, legacy: true });
    };
    take(spec.defaultBackend ?? spec.backend);
    for (const rule of arr(spec.rules)) for (const p of arr(rule?.http?.paths)) take(p?.backend);
    row.push(`${arr(spec.rules).map((x) => x?.host).filter(Boolean).join(', ') || 'no host'}`);
    if (!backends.length) add(r.ref, 'warning', 'ingress-empty', 'Ingress has no backends', 'No rule or defaultBackend points at a Service, so it routes nothing.');
    if (!spec.ingressClassName && !r.body.metadata?.annotations?.['kubernetes.io/ingress.class'])
      add(r.ref, 'info', 'ingress-class', 'No ingressClassName', 'Without a class the Ingress is handled only if the cluster has a default IngressClass.', 'spec:\n  ingressClassName: nginx');
    for (const b of backends) {
      const svc = all.find((s) => s.kind === 'Service' && s.name === b.name && s.ns === r.ns);
      if (!svc) {
        add(r.ref, 'warning', 'ingress-backend', `Backend Service "${b.name}" is not in this paste`, 'The Ingress routes to a Service in its own namespace. If it is defined elsewhere this is fine; otherwise the route returns 503.', `apiVersion: v1\nkind: Service\nmetadata:\n  name: ${b.name}\nspec:\n  selector:\n    app: my-app\n  ports:\n    - port: 80`);
        continue;
      }
      const sp = arr(svc.body.spec?.ports);
      if (b.port !== undefined && !sp.some((p) => p?.port === b.port || p?.name === b.port))
        add(r.ref, 'error', 'ingress-port', `Service "${b.name}" has no port ${b.port}`, `The Service exposes ${sp.map((p) => p?.port).join(', ') || 'no ports'}.`, `port:\n  number: ${sp[0]?.port ?? 80}`);
    }
  }

  function checkSecret(r: Res, row: string[]) {
    const data = isObj(r.body.data) ? r.body.data : {};
    const sdata = isObj(r.body.stringData) ? r.body.stringData : {};
    const keys = [...Object.keys(data), ...Object.keys(sdata)];
    row.push(`${r.body.type ?? 'Opaque'}`, `${keys.length} key(s)`);
    if (!keys.length) return;
    const lines = [
      ...Object.entries(data).map(([k, v]) => `${k}: ${typeof v === 'string' ? maskSecret(v) : '(not a string)'}`),
      ...Object.entries(sdata).map(([k, v]) => `${k}: ${String(v).slice(0, 2)}•••• (stringData)`),
    ];
    for (const [k, v] of Object.entries(data)) if (typeof v === 'string' && maskSecret(v) === '(not valid base64)') add(r.ref, 'error', 'secret-base64', `Secret data key "${k}" is not valid base64`, 'Values under data must be base64. Use stringData for plain text.', `stringData:\n  ${k}: <value>`);
    add(r.ref, 'warning', 'secret-plain', 'Secret values are stored in the manifest', `base64 is encoding, not encryption: anyone with this file can read the values. Decoded preview (masked): ${lines.join('; ')}.`, '# Keep the value out of Git: use Sealed Secrets, External Secrets or SOPS,\n# or create it with: kubectl create secret generic NAME --from-literal=KEY=VALUE');
  }

  function checkCron(r: Res, spec: A) {
    const s = spec.schedule;
    if (typeof s !== 'string' || !s.trim()) return add(r.ref, 'error', 'cron-schedule', 'schedule is missing', 'A CronJob needs spec.schedule in cron syntax.', 'spec:\n  schedule: "0 2 * * *"');
    const p = parseCron(s);
    if (!p.ok) add(r.ref, 'error', 'cron-schedule', `schedule "${s}" is not valid`, p.errors.map((e) => e.message).join(' '), 'schedule: "*/15 * * * *"');
    else if ('reboot' in p) add(r.ref, 'error', 'cron-schedule', '@reboot is not supported', 'Kubernetes CronJobs support the five-field syntax and macros such as @daily, not @reboot.');
    else add(r.ref, 'info', 'cron-explained', `Schedule "${s}" runs ${describeCron(p.cron)}`, 'Times are in the kube-controller-manager time zone (usually UTC) unless spec.timeZone is set.', spec.timeZone ? undefined : 'spec:\n  timeZone: "Etc/UTC"');
    if (!spec.concurrencyPolicy) add(r.ref, 'info', 'cron-concurrency', 'concurrencyPolicy is not set', 'The default (Allow) starts a new run even if the previous one is still going. Forbid skips it; Replace restarts it.', 'spec:\n  concurrencyPolicy: Forbid');
  }

  const result: CheckResult = { error: null, resources, findings: [], counts: { error: 0, warning: 0, info: 0 } };
  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  result.findings = findings.sort((a, b) => order[a.severity] - order[b.severity]);
  return count(result);
}

export const SAMPLE = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:latest
          ports:
            - containerPort: 80
          env:
            - name: DB_PASSWORD
              value: hunter2
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web
spec:
  rules:
    - host: example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-svc
                port:
                  number: 80
---
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: nightly
spec:
  schedule: "30 2 * * 1-5"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: job
              image: busybox:1.36
              command: ["sh", "-c", "echo hi"]
---
apiVersion: v1
kind: Secret
metadata:
  name: creds
data:
  password: aHVudGVyMg==
`;
