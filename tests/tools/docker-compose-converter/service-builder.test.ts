import { describe, expect, it } from 'vitest';
import {
  analyzeCompose,
  emptyBuilderState,
  emptyService,
  generateEnvExample,
  importComposeYaml,
  isNamedVolume,
  parsePort,
  parseVolume,
  renameService,
  serializeBuilderState,
  TEMPLATES,
  type ComposeBuilderState,
} from '../../../src/tools/docker-compose-converter/features/service-builder';
import { AppError } from '../../../src/shared/lib/errors';

describe('Compose Service Builder: utilities & analysis', () => {
  it('correctly distinguishes named volumes from bind mounts', () => {
    expect(isNamedVolume('pgdata')).toBe(true);
    expect(isNamedVolume('my_volume')).toBe(true);
    expect(isNamedVolume('redis-data')).toBe(true);

    expect(isNamedVolume('./data')).toBe(false);
    expect(isNamedVolume('/var/data')).toBe(false);
    expect(isNamedVolume('~/data')).toBe(false);
    expect(isNamedVolume('C:\\data')).toBe(false);
  });

  it('parses port strings accurately', () => {
    expect(parsePort('8080:80')).toEqual({ hostPort: '8080', containerPort: '80', protocol: undefined });
    expect(parsePort('127.0.0.1:3000:3000')).toEqual({ hostIp: '127.0.0.1', hostPort: '3000', containerPort: '3000', protocol: undefined });
    expect(parsePort('53:53/udp')).toEqual({ hostPort: '53', containerPort: '53', protocol: 'udp' });
    expect(parsePort('80')).toEqual({ hostPort: '', containerPort: '80', protocol: undefined });
    expect(parsePort('')).toBeNull();
  });

  it('parses volume strings accurately', () => {
    expect(parseVolume('pgdata:/var/lib/postgresql/data')).toEqual({
      source: 'pgdata',
      target: '/var/lib/postgresql/data',
    });
    expect(parseVolume('./html:/usr/share/nginx/html:ro')).toEqual({
      source: './html',
      target: '/usr/share/nginx/html',
      mode: 'ro',
    });
  });

  it('detects duplicate host port conflicts across services', () => {
    const state: ComposeBuilderState = {
      services: [
        {
          ...emptyService('web'),
          ports: ['8080:80'],
        },
        {
          ...emptyService('api'),
          ports: ['8080:3000'],
        },
      ],
      namedVolumes: [],
      networks: [],
    };

    const analysis = analyzeCompose(state);
    expect(analysis.hasConflicts).toBe(true);
    expect(analysis.warnings.some((w) => w.includes('Host port 8080 is bound by multiple services'))).toBe(true);
  });

  it('detects missing dependency targets', () => {
    const state: ComposeBuilderState = {
      services: [
        {
          ...emptyService('web'),
          dependsOn: [{ service: 'cache', condition: 'service_healthy' }],
        },
      ],
      namedVolumes: [],
      networks: [],
    };

    const analysis = analyzeCompose(state);
    expect(analysis.hasConflicts).toBe(true);
    expect(analysis.warnings.some((w) => w.includes('depends on "cache", but "cache" is not defined'))).toBe(true);
  });

  it('detects undeclared named volumes', () => {
    const state: ComposeBuilderState = {
      services: [
        {
          ...emptyService('db'),
          volumes: ['pgdata:/var/lib/postgresql/data'],
        },
      ],
      namedVolumes: [], // not declared
      networks: [],
    };

    const analysis = analyzeCompose(state);
    expect(analysis.hasConflicts).toBe(true);
    expect(analysis.warnings.some((w) => w.includes('Named volume "pgdata" used by service "db" is not declared'))).toBe(true);
  });

  it('passes cleanly when all ports, dependencies, and volumes are declared', () => {
    const state = TEMPLATES['api-postgres'].state();
    const analysis = analyzeCompose(state);
    expect(analysis.warnings).toEqual([]);
    expect(analysis.hasConflicts).toBe(false);
    expect(analysis.ports.length).toBe(2);
    expect(analysis.volumes.length).toBe(2);
    expect(analysis.dependencies.length).toBe(1);
  });
});

describe('Compose Service Builder: templates', () => {
  it('loads the Frontend + API template', () => {
    const state = TEMPLATES['frontend-api'].state();
    expect(state.services).toHaveLength(2);
    expect(state.services.map((s) => s.name)).toEqual(['frontend', 'api']);
    expect(state.services[0].dependsOn[0].service).toBe('api');
  });

  it('loads the API + PostgreSQL template with health checks and placeholder credentials', () => {
    const state = TEMPLATES['api-postgres'].state();
    const db = state.services.find((s) => s.name === 'db');
    expect(db).toBeDefined();
    expect(db?.image).toContain('postgres');
    expect(db?.healthcheck?.test).toContain('pg_isready');
    expect(db?.environment.some(([k, v]) => k === 'POSTGRES_PASSWORD' && v.includes('local_dev'))).toBe(true);
    expect(state.namedVolumes).toContain('pgdata');
  });

  it('loads the API + Redis template with healthcheck', () => {
    const state = TEMPLATES['api-redis'].state();
    const redis = state.services.find((s) => s.name === 'redis');
    expect(redis).toBeDefined();
    expect(redis?.healthcheck?.test).toContain('redis-cli ping');
    expect(state.namedVolumes).toContain('redisdata');
  });

  it('loads the Full Development Stack template', () => {
    const state = TEMPLATES['full-stack'].state();
    expect(state.services).toHaveLength(4);
    expect(state.namedVolumes).toContain('pgdata');
    expect(state.namedVolumes).toContain('redisdata');
  });
});

describe('Compose Service Builder: .env.example generator', () => {
  it('generates a clean .env.example from service environment variables', () => {
    const state = TEMPLATES['api-postgres'].state();
    const envText = generateEnvExample(state);

    expect(envText).toContain('# .env.example (local development only)');
    expect(envText).toContain('# api');
    expect(envText).toContain('PORT=8000');
    expect(envText).toContain('# db');
    expect(envText).toContain('POSTGRES_USER=postgres');
    expect(envText).toContain('POSTGRES_PASSWORD=change_me');
  });

  it('never copies secret values and can’t be used to inject variables', () => {
    const state = emptyBuilderState();
    state.services = [
      {
        ...TEMPLATES['api-postgres'].state().services[0],
        name: 'api\nEVIL=1',
        environment: [
          ['DB_PASSWORD', 'hunter2'],
          ['API_TOKEN', 'tok_live_123'],
          ['MULTI', 'a\nINJECTED=1'],
          ['HASH', 'a #b'],
          ['BAD KEY', 'x'],
          ['PLAIN', 'ok'],
        ],
      },
    ];
    const text = generateEnvExample(state);
    expect(text).not.toMatch(/hunter2|tok_live_123/);
    expect(text).toContain('DB_PASSWORD=change_me');
    expect(text).toContain('MULTI="a\\nINJECTED=1"');
    expect(text).toContain('HASH="a #b"');
    expect(text).toContain('PLAIN=ok');
    expect(text).not.toMatch(/^(EVIL|INJECTED|BAD KEY)/m);
  });

  it('returns a placeholder note if no environment variables are defined', () => {
    const state = emptyBuilderState();
    const envText = generateEnvExample(state);
    expect(envText).toContain('# No environment variables defined in any service.');
  });
});

describe('Compose Service Builder: serialization & round-trip import', () => {
  it('serializes a multi-service state to valid Compose YAML', async () => {
    const state = TEMPLATES['api-postgres'].state();
    const yaml = await serializeBuilderState(state);

    expect(yaml).toContain('services:');
    expect(yaml).toContain('api:');
    expect(yaml).toContain('db:');
    expect(yaml).toContain('"5432:5432"');
    expect(yaml).toContain('condition: service_healthy');
    expect(yaml).toContain('volumes:');
    expect(yaml).toContain('pgdata:');
  });

  it('imports Compose YAML into builder state and preserves structure', async () => {
    const sampleYaml = `services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    restart: unless-stopped
    depends_on:
      api:
        condition: service_healthy
  api:
    image: node:20-alpine
    ports:
      - "3000:3000"
    environment:
      PORT: "3000"
      DATABASE_URL: "postgres://localhost/db"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
volumes:
  mydata:
networks:
  app-net:
`;

    const { state, warnings } = await importComposeYaml(sampleYaml);
    expect(warnings).toEqual([]);
    expect(state.services).toHaveLength(2);

    const web = state.services.find((s) => s.name === 'web');
    expect(web).toBeDefined();
    expect(web?.image).toBe('nginx:alpine');
    expect(web?.ports).toEqual(['80:80']);
    expect(web?.restart).toBe('unless-stopped');
    expect(web?.dependsOn).toEqual([{ service: 'api', condition: 'service_healthy' }]);

    const api = state.services.find((s) => s.name === 'api');
    expect(api).toBeDefined();
    expect(api?.healthcheck?.test).toBe('curl -f http://localhost:3000/health || exit 1');
    expect(api?.healthcheck?.interval).toBe('10s');
    expect(api?.environment).toEqual([
      ['PORT', '3000'],
      ['DATABASE_URL', 'postgres://localhost/db'],
    ]);

    expect(state.namedVolumes).toContain('mydata');
    expect(state.networks).toContain('app-net');
  });

  it('handles invalid YAML gracefully during import', async () => {
    await expect(importComposeYaml('invalid: [broken')).rejects.toThrow(/YAML syntax error/);
  });

  it('rejects YAML without services', async () => {
    await expect(importComposeYaml('version: "3.8"\nfoo: bar')).rejects.toThrow(/No "services:" section found/);
  });
});

describe('Compose Service Builder: lossless round trip', () => {
  const roundTrip = async (yaml: string) => {
    const imported = await importComposeYaml(yaml);
    const { parse } = await import('yaml');
    return { ...imported, doc: parse(await serializeBuilderState(imported.state)) };
  };

  it('keeps command arrays as arrays', async () => {
    const { doc } = await roundTrip(`services:\n  app:\n    image: busybox\n    command: ["sh", "-c", "echo hi && sleep 1"]\n`);
    expect(doc.services.app.command).toEqual(['sh', '-c', 'echo hi && sleep 1']);
  });

  it('keeps healthcheck CMD form, its arguments, and NONE', async () => {
    const { doc } = await roundTrip(`services:
  a:
    image: distroless
    healthcheck:
      test: ["CMD", "/bin/check", "--url", "http://x/a b"]
  b:
    image: busybox
    healthcheck:
      test: ["NONE"]
  c:
    image: busybox
    healthcheck:
      test: ["CMD-SHELL", "curl -f localhost || exit 1"]
`);
    expect(doc.services.a.healthcheck.test).toEqual(['CMD', '/bin/check', '--url', 'http://x/a b']);
    expect(doc.services.b.healthcheck.test).toEqual(['NONE']);
    expect(doc.services.c.healthcheck.test).toEqual(['CMD-SHELL', 'curl -f localhost || exit 1']);
  });

  it('keeps empty env values distinct from pass-through variables', async () => {
    const { doc } = await roundTrip(`services:\n  app:\n    image: x\n    environment:\n      - EMPTY=\n      - FROM_HOST\n      - SET=1\n`);
    expect(doc.services.app.environment).toEqual({ EMPTY: '', FROM_HOST: null, SET: '1' });
  });

  it('keeps on-failure:N and long-form ports with host_ip, and warns about what it cannot represent', async () => {
    const { doc, warnings } = await roundTrip(`services:
  app:
    image: x
    restart: on-failure:3
    user: "1000"
    ports:
      - target: 80
        published: 8080
        host_ip: 127.0.0.1
        protocol: udp
    volumes:
      - type: tmpfs
        target: /tmp
      - type: volume
        source: data
        target: /data
        read_only: true
    depends_on:
      db:
        condition: service_started
        restart: true
  db:
    image: postgres
`);
    expect(doc.services.app.restart).toBe('on-failure:3');
    expect(doc.services.app.ports).toEqual(['127.0.0.1:8080:80/udp']);
    expect(doc.services.app.volumes).toEqual(['data:/data:ro']);
    expect(warnings.some((w) => w.includes('"user"'))).toBe(true);
    expect(warnings.some((w) => w.includes('tmpfs'))).toBe(true);
    expect(warnings.some((w) => w.includes('"restart"') && w.includes('db'))).toBe(true);
  });

  it('throws an AppError for broken YAML', async () => {
    await expect(importComposeYaml('services: [broken')).rejects.toBeInstanceOf(AppError);
  });
});

describe('Compose Service Builder: names, renames and dependencies', () => {
  const state = (...services: ComposeBuilderState['services']): ComposeBuilderState => ({ services, namedVolumes: [], networks: [] });

  it('warns about duplicate and empty service names', () => {
    const { warnings } = analyzeCompose(state(emptyService('web'), emptyService('web'), emptyService(''), emptyService('app')));
    expect(warnings.some((w) => w.includes('"web"') && w.includes('more than one'))).toBe(true);
    expect(warnings.some((w) => w.includes('no name'))).toBe(true);
    expect(warnings.some((w) => w.includes('"app"') && w.includes('more than one'))).toBe(true);
  });

  it('updates other services’ depends_on when a service is renamed', () => {
    const db = emptyService('db');
    const api = { ...emptyService('api'), dependsOn: [{ service: 'db', condition: 'service_started' as const }] };
    const next = renameService(state(db, api), db.id, 'postgres');
    expect(next.services[0].name).toBe('postgres');
    expect(next.services[1].dependsOn).toEqual([{ service: 'postgres', condition: 'service_started' }]);
  });

  it('warns when service_healthy targets a service without a healthcheck', () => {
    const { warnings } = analyzeCompose(state({ ...emptyService('api'), dependsOn: [{ service: 'db', condition: 'service_healthy' }] }, emptyService('db')));
    expect(warnings.some((w) => w.includes('service_healthy') && w.includes('"db"'))).toBe(true);
  });
});

describe('Compose Service Builder: port conflicts', () => {
  const ports = (...lists: string[][]) =>
    analyzeCompose({ services: lists.map((p, i) => ({ ...emptyService(`s${i}`), ports: p })), namedVolumes: [], networks: [] }).warnings;

  it('ignores container-only ports', () => {
    expect(ports(['3000'], ['3000'])).toEqual([]);
  });

  it('treats a missing protocol as tcp', () => {
    expect(ports(['8080:80'], ['8080:80/tcp']).some((w) => w.includes('8080'))).toBe(true);
    expect(ports(['53:53'], ['53:53/udp'])).toEqual([]);
  });

  it('only flags the same host port on overlapping IPs', () => {
    expect(ports(['127.0.0.1:80:80'], ['192.168.1.2:80:80'])).toEqual([]);
    expect(ports(['127.0.0.1:80:80'], ['80:80']).some((w) => w.includes('80'))).toBe(true);
  });
});
