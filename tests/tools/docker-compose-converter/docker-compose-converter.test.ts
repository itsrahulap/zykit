import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { composeToRun, convert, detectDirection, dockerRunToCompose } from '../../../src/tools/docker-compose-converter/features/docker-compose-converter';

const toCompose = async (cmd: string) => {
  const r = await convert(cmd, 'run-to-compose');
  return { ...r, doc: r.output ? (parse(r.output) as { services: Record<string, Record<string, any>>; volumes?: Record<string, unknown>; networks?: Record<string, unknown> }) : null };
};

describe('docker run → Compose', () => {
  it('maps the common flags', async () => {
    const { doc, warnings } = await toCompose(
      'docker run -d --name web -p 8080:80 -p 443:443 -e FOO=bar -e BAZ --env-file .env -v data:/var/lib/x -v ./html:/usr/share/nginx/html:ro ' +
        '--network backend --restart unless-stopped -w /app -u 1000:1000 --entrypoint /entry.sh --hostname h1 --label a=b --label c ' +
        '--add-host db:10.0.0.1 --cap-add NET_ADMIN --cap-drop ALL --privileged -it nginx:1.27 nginx -g "daemon off;"',
    );
    const web = doc!.services.web;
    expect(web).toMatchObject({
      image: 'nginx:1.27',
      container_name: 'web',
      command: ['nginx', '-g', 'daemon off;'],
      entrypoint: ['/entry.sh'],
      working_dir: '/app',
      user: '1000:1000',
      hostname: 'h1',
      restart: 'unless-stopped',
      ports: ['8080:80', '443:443'],
      environment: { FOO: 'bar', BAZ: null },
      env_file: ['.env'],
      labels: { a: 'b', c: '' },
      volumes: ['data:/var/lib/x', './html:/usr/share/nginx/html:ro'],
      networks: ['backend'],
      extra_hosts: ['db:10.0.0.1'],
      cap_add: ['NET_ADMIN'],
      cap_drop: ['ALL'],
      privileged: true,
      stdin_open: true,
      tty: true,
    });
    expect(warnings).toEqual([]);
  });

  it('declares named volumes and networks at the top level only', async () => {
    const { doc } = await toCompose('docker run -v data:/d -v /abs:/a -v ./rel:/r --network n1 -v db:/x img');
    expect(Object.keys(doc!.volumes!)).toEqual(['data', 'db']);
    expect(doc!.networks).toEqual({ n1: { external: true } });
  });

  it('quotes ports and "no" so YAML keeps them as strings', async () => {
    const { output } = await toCompose('docker run -p 8080:80 --restart no img');
    expect(output).toContain('- "8080:80"');
    expect(output).toContain('restart: "no"');
  });

  it('writes health checks and resources', async () => {
    const { doc } = await toCompose(
      'docker run --health-cmd "curl -f localhost" --health-interval 30s --health-timeout 5s --health-retries 3 --health-start-period 10s --cpus 1.5 --memory 1g --memory-reservation 512m img',
    );
    expect(doc!.services.img.healthcheck).toEqual({ test: ['CMD-SHELL', 'curl -f localhost'], interval: '30s', timeout: '5s', retries: 3, start_period: '10s' });
    expect(doc!.services.img.deploy).toEqual({ resources: { limits: { cpus: '1.5', memory: '1g' }, reservations: { memory: '512m' } } });
  });

  it('converts --mount to long syntax', async () => {
    const { doc } = await toCompose('docker run --mount type=volume,src=pg,dst=/data,readonly --mount type=bind,source=/a,target=/b img');
    expect(doc!.services.img.volumes).toEqual([
      { type: 'volume', source: 'pg', target: '/data', read_only: true },
      { type: 'bind', source: '/a', target: '/b' },
    ]);
    expect(Object.keys(doc!.volumes!)).toEqual(['pg']);
  });

  it('turns several commands into several services', async () => {
    const { doc, services } = await toCompose('docker run -d --name db postgres:16 && sudo docker run -d -p 80:80 nginx\ndocker container run -d nginx');
    expect(services).toBe(3);
    expect(Object.keys(doc!.services)).toEqual(['db', 'nginx', 'nginx-2']);
  });

  it('handles line continuations, attached values and clustered flags', async () => {
    const { doc } = await toCompose('docker run -dit -p8080:80 \\\n  -eA=1 --name=x \\\n  alpine sleep 10');
    expect(doc!.services.x).toMatchObject({ image: 'alpine', ports: ['8080:80'], environment: { A: '1' }, tty: true, command: ['sleep', '10'] });
  });

  it('notes -d and --rm and warns about unsupported flags', () => {
    const r = dockerRunToCompose('docker run -d --rm -P --kernel-memory 10m --bogus img');
    expect(r.notes.some((n) => n.includes('-d'))).toBe(true);
    expect(r.notes.some((n) => n.includes('--rm') && n.includes('docker compose run --rm'))).toBe(true);
    expect(r.warnings.join('\n')).toMatch(/-P/);
    expect(r.warnings.join('\n')).toMatch(/--kernel-memory/);
    expect(r.warnings.join('\n')).toMatch(/--bogus/);
  });

  it('maps host networking, gpus and ulimits', async () => {
    const { doc } = await toCompose('docker run --network host --gpus all --ulimit nofile=1024:2048 --shm-size 1g --stop-timeout 30 img');
    const s = doc!.services.img;
    expect(s.network_mode).toBe('host');
    expect(s.deploy.resources.reservations.devices).toEqual([{ capabilities: ['gpu'], count: 'all' }]);
    expect(s.ulimits).toEqual({ nofile: { soft: 1024, hard: 2048 } });
    expect(s.shm_size).toBe('1g');
    expect(s.stop_grace_period).toBe('30s');
  });

  it('reports errors', () => {
    expect(dockerRunToCompose('docker run -d').error).toMatch(/No image/);
    expect(dockerRunToCompose('docker run -e').error).toMatch(/needs a value/);
    expect(dockerRunToCompose('docker run "nginx').error).toMatch(/Unterminated/);
    expect(dockerRunToCompose('ls -la').error).toMatch(/No docker run/);
  });
});

const COMPOSE = `
services:
  web:
    image: nginx:1.27
    depends_on: [db]
    ports: ["8080:80", { target: 443, published: 8443, protocol: tcp }]
    environment:
      MODE: prod
      EMPTY:
    volumes:
      - data:/var/www
      - type: bind
        source: /srv
        target: /srv
        read_only: true
    networks: [backend]
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
    deploy:
      resources:
        limits: { cpus: "0.5", memory: 256M }
    command: nginx -g "daemon off;"
  db:
    image: postgres:16
    container_name: pg
    environment: ["POSTGRES_PASSWORD=secret pw"]
    tmpfs: /tmp
    labels: { tier: data }
volumes:
  data:
networks:
  backend:
`;

describe('Compose → docker run', () => {
  it('writes one command per service, dependencies first', async () => {
    const r = await composeToRun(COMPOSE);
    expect(r.error).toBeUndefined();
    expect(r.services).toBe(2);
    expect(r.commands.indexOf('# db')).toBeLessThan(r.commands.indexOf('# web'));
    expect(r.commands).toContain('docker network create backend');
    expect(r.commands).toContain('docker run -d \\\n  --name pg \\\n  -e \'POSTGRES_PASSWORD=secret pw\' \\\n  -l tier=data \\\n  --tmpfs /tmp \\\n  postgres:16');
    expect(r.notes.join(' ')).toMatch(/dependency order/);
  });

  it('maps ports, volumes, health checks, resources and commands', async () => {
    const { commands } = await composeToRun(COMPOSE);
    for (const part of [
      '--name web',
      '-p 8080:80',
      '-p 8443:443',
      '-e MODE=prod',
      '-e EMPTY',
      '-v data:/var/www',
      '--mount type=bind,source=/srv,target=/srv,readonly',
      '--network backend',
      '--restart always',
      '--health-cmd \'curl -f http://localhost\'',
      '--health-interval 30s',
      '--cpus 0.5',
      '--memory 256M',
      'nginx:1.27 \\\n  nginx \\\n  -g \\\n  \'daemon off;\'',
    ])
      expect(commands).toContain(part);
  });

  it('supports single-line output without -d', async () => {
    const r = await composeToRun('services:\n  a:\n    image: alpine\n    command: [sleep, "10"]', { detach: false, multiline: false });
    expect(r.commands).toBe('docker run --name a alpine sleep 10\n');
  });

  it('accepts a single service and warns about unsupported keys', async () => {
    const r = await composeToRun('image: redis\ncontainer_name: cache\nprofiles: [x]\nbuild: .\ndeploy:\n  replicas: 3');
    expect(r.commands).toContain('--name cache');
    expect(r.warnings.join('\n')).toMatch(/profiles/);
    expect(r.warnings.join('\n')).toMatch(/deploy\.replicas/);
    expect(r.warnings.join('\n')).toMatch(/build was ignored/);
  });

  it('warns about relative bind paths and interpolation', async () => {
    const r = await composeToRun('services:\n  a:\n    image: x\n    volumes: ["./src:/src"]\n    environment:\n      K: ${HOME}/x');
    expect(r.warnings.join('\n')).toMatch(/absolute/);
    expect(r.notes.join('\n')).toMatch(/interpolation/);
  });

  it('reports bad input', async () => {
    expect((await composeToRun('services: [')).error).toMatch(/Invalid YAML/);
    expect((await composeToRun('foo: bar')).error).toMatch(/No `services:`/);
    expect((await composeToRun('- a\n- b')).error).toMatch(/Expected/);
  });
});

describe('round trip and detection', () => {
  it('detects direction', () => {
    expect(detectDirection('docker run nginx')).toBe('run-to-compose');
    expect(detectDirection('  $ sudo docker run nginx')).toBe('run-to-compose');
    expect(detectDirection('services:\n  a:')).toBe('compose-to-run');
  });

  it('converts a command to Compose and back', async () => {
    const yaml = (await convert('docker run -d --name web -p 8080:80 -e A=1 -v data:/d nginx:alpine', 'run-to-compose')).output;
    const back = (await convert(yaml, 'compose-to-run')).output;
    expect(back).toContain('docker run -d \\\n  --name web \\\n  -p 8080:80 \\\n  -e A=1 \\\n  -v data:/d \\\n  nginx:alpine');
  });
});
