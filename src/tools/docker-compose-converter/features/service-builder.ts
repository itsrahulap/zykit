// Visual Compose Service Builder: data models, templates, validation, .env.example generation,
// and bidirectional serialization with Docker Compose YAML.

import { Quoted, type Obj, type ComposeDoc } from './run';
import { composeYaml } from './docker-compose-converter';

export interface ServiceDependency {
  service: string;
  condition?: 'service_started' | 'service_healthy' | 'service_completed_successfully';
}

export interface ServiceHealthcheck {
  test: string;
  interval?: string;
  timeout?: string;
  retries?: number;
  startPeriod?: string;
}

export interface ServiceDef {
  id: string;
  name: string;
  image: string;
  buildContext?: string;
  dockerfile?: string;
  containerName?: string;
  command?: string;
  ports: string[];
  volumes: string[];
  environment: [string, string][];
  networks: string[];
  restart: 'no' | 'always' | 'on-failure' | 'unless-stopped' | '';
  healthcheck?: ServiceHealthcheck;
  dependsOn: ServiceDependency[];
}

export interface ComposeBuilderState {
  services: ServiceDef[];
  namedVolumes: string[];
  networks: string[];
}

export type TemplateId = 'frontend-api' | 'api-postgres' | 'api-redis' | 'full-stack';

let nextIdCounter = 1;
export function createId(): string {
  return `svc_${Date.now()}_${nextIdCounter++}`;
}

export function emptyService(name = 'web'): ServiceDef {
  return {
    id: createId(),
    name,
    image: '',
    ports: [],
    volumes: [],
    environment: [],
    networks: [],
    restart: 'unless-stopped',
    dependsOn: [],
  };
}

export function emptyBuilderState(): ComposeBuilderState {
  return {
    services: [emptyService('web')],
    namedVolumes: [],
    networks: [],
  };
}

// ---------------------------------------------------------------------------
// Templates (Credentials marked local development only)

export const TEMPLATES: Record<TemplateId, { name: string; description: string; state: () => ComposeBuilderState }> = {
  'frontend-api': {
    name: 'Frontend + API',
    description: 'Nginx frontend proxying to a Node.js/Go backend API',
    state: () => ({
      services: [
        {
          id: createId(),
          name: 'frontend',
          image: 'nginx:alpine',
          ports: ['80:80'],
          volumes: ['./frontend/dist:/usr/share/nginx/html:ro'],
          environment: [],
          networks: ['app-net'],
          restart: 'unless-stopped',
          dependsOn: [{ service: 'api', condition: 'service_started' }],
        },
        {
          id: createId(),
          name: 'api',
          image: 'node:20-alpine',
          buildContext: './api',
          ports: ['3000:3000'],
          volumes: ['./api:/app'],
          environment: [
            ['PORT', '3000'],
            ['NODE_ENV', 'development'],
          ],
          networks: ['app-net'],
          restart: 'unless-stopped',
          command: 'npm run dev',
          dependsOn: [],
        },
      ],
      namedVolumes: [],
      networks: ['app-net'],
    }),
  },
  'api-postgres': {
    name: 'API + PostgreSQL',
    description: 'Backend service with PostgreSQL database, healthcheck, and persistent volume',
    state: () => ({
      services: [
        {
          id: createId(),
          name: 'api',
          image: 'node:20-alpine',
          buildContext: './api',
          ports: ['8000:8000'],
          volumes: ['./api:/app'],
          environment: [
            ['PORT', '8000'],
            ['NODE_ENV', 'development'],
            ['DATABASE_URL', 'postgres://postgres:local_dev_password@db:5432/app_db'],
          ],
          networks: ['backend'],
          restart: 'unless-stopped',
          dependsOn: [{ service: 'db', condition: 'service_healthy' }],
        },
        {
          id: createId(),
          name: 'db',
          image: 'postgres:16-alpine',
          ports: ['5432:5432'],
          volumes: ['pgdata:/var/lib/postgresql/data'],
          environment: [
            ['POSTGRES_USER', 'postgres'],
            ['POSTGRES_PASSWORD', 'local_dev_password'], // local development only
            ['POSTGRES_DB', 'app_db'],
          ],
          networks: ['backend'],
          restart: 'unless-stopped',
          healthcheck: {
            test: 'pg_isready -U postgres -d app_db',
            interval: '10s',
            timeout: '5s',
            retries: 5,
            startPeriod: '10s',
          },
          dependsOn: [],
        },
      ],
      namedVolumes: ['pgdata'],
      networks: ['backend'],
    }),
  },
  'api-redis': {
    name: 'API + Redis',
    description: 'Backend service with Redis cache, healthcheck, and persistent volume',
    state: () => ({
      services: [
        {
          id: createId(),
          name: 'api',
          image: 'node:20-alpine',
          buildContext: './api',
          ports: ['8080:8080'],
          volumes: ['./api:/app'],
          environment: [
            ['PORT', '8080'],
            ['REDIS_URL', 'redis://redis:6379'],
          ],
          networks: ['backend'],
          restart: 'unless-stopped',
          dependsOn: [{ service: 'redis', condition: 'service_healthy' }],
        },
        {
          id: createId(),
          name: 'redis',
          image: 'redis:7-alpine',
          ports: ['6379:6379'],
          volumes: ['redisdata:/data'],
          environment: [],
          networks: ['backend'],
          restart: 'unless-stopped',
          healthcheck: {
            test: 'redis-cli ping',
            interval: '10s',
            timeout: '5s',
            retries: 3,
            startPeriod: '5s',
          },
          dependsOn: [],
        },
      ],
      namedVolumes: ['redisdata'],
      networks: ['backend'],
    }),
  },
  'full-stack': {
    name: 'Full Development Stack',
    description: 'Frontend, backend API, PostgreSQL database, and Redis cache with health checks',
    state: () => ({
      services: [
        {
          id: createId(),
          name: 'frontend',
          image: 'nginx:alpine',
          ports: ['3000:80'],
          volumes: ['./frontend/dist:/usr/share/nginx/html:ro'],
          environment: [],
          networks: ['app-net'],
          restart: 'unless-stopped',
          dependsOn: [{ service: 'api', condition: 'service_started' }],
        },
        {
          id: createId(),
          name: 'api',
          image: 'node:20-alpine',
          buildContext: './api',
          ports: ['8000:8000'],
          volumes: ['./api:/app'],
          environment: [
            ['PORT', '8000'],
            ['NODE_ENV', 'development'],
            ['DATABASE_URL', 'postgres://postgres:local_dev_password@db:5432/app_db'],
            ['REDIS_URL', 'redis://redis:6379'],
          ],
          networks: ['app-net'],
          restart: 'unless-stopped',
          dependsOn: [
            { service: 'db', condition: 'service_healthy' },
            { service: 'redis', condition: 'service_healthy' },
          ],
        },
        {
          id: createId(),
          name: 'db',
          image: 'postgres:16-alpine',
          ports: ['5432:5432'],
          volumes: ['pgdata:/var/lib/postgresql/data'],
          environment: [
            ['POSTGRES_USER', 'postgres'],
            ['POSTGRES_PASSWORD', 'local_dev_password'], // local development only
            ['POSTGRES_DB', 'app_db'],
          ],
          networks: ['app-net'],
          restart: 'unless-stopped',
          healthcheck: {
            test: 'pg_isready -U postgres -d app_db',
            interval: '10s',
            timeout: '5s',
            retries: 5,
            startPeriod: '10s',
          },
          dependsOn: [],
        },
        {
          id: createId(),
          name: 'redis',
          image: 'redis:7-alpine',
          ports: ['6379:6379'],
          volumes: ['redisdata:/data'],
          environment: [],
          networks: ['app-net'],
          restart: 'unless-stopped',
          healthcheck: {
            test: 'redis-cli ping',
            interval: '10s',
            timeout: '5s',
            retries: 3,
            startPeriod: '5s',
          },
          dependsOn: [],
        },
      ],
      namedVolumes: ['pgdata', 'redisdata'],
      networks: ['app-net'],
    }),
  },
};

// ---------------------------------------------------------------------------
// Conflict & Dependency Analysis

export interface PortEntry {
  service: string;
  hostPort: string;
  containerPort: string;
  protocol?: string;
  raw: string;
}

export interface VolumeEntry {
  service: string;
  source: string;
  target: string;
  type: 'named' | 'bind';
  mode?: string;
  raw: string;
}

export interface DependencyEntry {
  from: string;
  to: string;
  condition: string;
}

export interface AnalysisResult {
  warnings: string[];
  ports: PortEntry[];
  volumes: VolumeEntry[];
  dependencies: DependencyEntry[];
  hasConflicts: boolean;
}

export function isNamedVolume(source: string): boolean {
  if (!source) return false;
  // Bind mounts start with ., /, ~, or windows drive like C:\
  if (source.startsWith('.') || source.startsWith('/') || source.startsWith('~')) return false;
  if (/^[a-zA-Z]:[\\/]/.test(source)) return false;
  return true;
}

export function parsePort(raw: string): { hostPort: string; containerPort: string; protocol?: string } | null {
  const clean = raw.trim().replace(/^["']|["']$/g, '');
  if (!clean) return null;

  let protocol: string | undefined;
  let withoutProto = clean;
  const slashIdx = clean.lastIndexOf('/');
  if (slashIdx !== -1) {
    protocol = clean.slice(slashIdx + 1);
    withoutProto = clean.slice(0, slashIdx);
  }

  const parts = withoutProto.split(':');
  if (parts.length === 1) {
    return { hostPort: parts[0], containerPort: parts[0], protocol };
  }
  if (parts.length === 2) {
    return { hostPort: parts[0], containerPort: parts[1], protocol };
  }
  if (parts.length >= 3) {
    // ip:hostPort:containerPort
    return { hostPort: parts[parts.length - 2], containerPort: parts[parts.length - 1], protocol };
  }
  return null;
}

export function parseVolume(raw: string): { source: string; target: string; mode?: string } | null {
  const clean = raw.trim().replace(/^["']|["']$/g, '');
  if (!clean) return null;
  const parts = clean.split(':');
  if (parts.length === 1) {
    return { source: parts[0], target: parts[0] };
  }
  if (parts.length === 2) {
    return { source: parts[0], target: parts[1] };
  }
  return { source: parts[0], target: parts[1], mode: parts[2] };
}

export function analyzeCompose(state: ComposeBuilderState): AnalysisResult {
  const warnings: string[] = [];
  const ports: PortEntry[] = [];
  const volumes: VolumeEntry[] = [];
  const dependencies: DependencyEntry[] = [];

  const serviceNames = new Set(state.services.map((s) => s.name.trim()).filter(Boolean));
  const declaredVolumes = new Set(state.namedVolumes.map((v) => v.trim()).filter(Boolean));

  // Map to track host port bindings: hostPort -> list of service names
  const hostPortMap = new Map<string, string[]>();

  for (const svc of state.services) {
    const sName = svc.name.trim() || 'unnamed';

    // Ports
    for (const p of svc.ports) {
      const parsed = parsePort(p);
      if (parsed) {
        ports.push({
          service: sName,
          hostPort: parsed.hostPort,
          containerPort: parsed.containerPort,
          protocol: parsed.protocol,
          raw: p,
        });

        // Check for duplicate host port bindings
        if (parsed.hostPort) {
          const key = parsed.protocol ? `${parsed.hostPort}/${parsed.protocol}` : parsed.hostPort;
          const current = hostPortMap.get(key) || [];
          current.push(sName);
          hostPortMap.set(key, current);
        }
      }
    }

    // Volumes
    for (const v of svc.volumes) {
      const parsed = parseVolume(v);
      if (parsed) {
        const type = isNamedVolume(parsed.source) ? 'named' : 'bind';
        volumes.push({
          service: sName,
          source: parsed.source,
          target: parsed.target,
          type,
          mode: parsed.mode,
          raw: v,
        });

        // Check if named volume is declared
        if (type === 'named' && !declaredVolumes.has(parsed.source)) {
          warnings.push(`Named volume "${parsed.source}" used by service "${sName}" is not declared in top-level volumes.`);
        }
      }
    }

    // Dependencies
    for (const dep of svc.dependsOn) {
      const targetName = dep.service.trim();
      if (!targetName) continue;
      dependencies.push({
        from: sName,
        to: targetName,
        condition: dep.condition || 'service_started',
      });

      if (!serviceNames.has(targetName)) {
        warnings.push(`Service "${sName}" depends on "${targetName}", but "${targetName}" is not defined in services.`);
      }
    }
  }

  // Detect port conflicts
  for (const [port, svcs] of hostPortMap.entries()) {
    if (svcs.length > 1) {
      warnings.push(`Host port ${port} is bound by multiple services: ${[...new Set(svcs)].join(', ')}.`);
    }
  }

  return {
    warnings,
    ports,
    volumes,
    dependencies,
    hasConflicts: warnings.length > 0,
  };
}

// ---------------------------------------------------------------------------
// .env.example Generation

export function generateEnvExample(state: ComposeBuilderState): string {
  const lines: string[] = [
    '# .env.example (local development only)',
    '# Copy this file to .env and adjust variables for your local environment.',
    '',
  ];

  let hasAny = false;

  for (const svc of state.services) {
    const validPairs = svc.environment.filter(([k]) => k.trim());
    if (validPairs.length === 0) continue;

    hasAny = true;
    lines.push(`# ${(svc.name || 'service').replace(/[\r\n]+/g, ' ')}`);
    for (const [k, v] of validPairs) {
      const key = k.trim();
      // A key with spaces, "=" or line breaks could inject extra variables into the file.
      if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(key)) {
        lines.push(`# skipped a variable whose name isn't valid in a .env file`);
        continue;
      }
      // Never copy a real secret into an example file.
      const val = /pass|secret|key|token|credential|auth/i.test(key) ? 'change_me' : v.trim();
      lines.push(`${key}=${/^[\w.,:/@%+=-]*$/.test(val) ? val : JSON.stringify(val)}`);
    }
    lines.push('');
  }

  if (!hasAny) {
    return '# No environment variables defined in any service.\n';
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Export to ComposeDoc & YAML

export function exportComposeDoc(state: ComposeBuilderState): ComposeDoc {
  const doc: ComposeDoc = {
    services: {},
  };

  // Collect auto-detected named volumes
  const allNamedVolumes = new Set(state.namedVolumes);

  for (const svc of state.services) {
    const sName = svc.name.trim() || 'app';
    const sDef: Obj = {};

    if (svc.image.trim()) {
      sDef.image = svc.image.trim();
    }

    if (svc.buildContext?.trim()) {
      if (svc.dockerfile?.trim()) {
        sDef.build = {
          context: svc.buildContext.trim(),
          dockerfile: svc.dockerfile.trim(),
        };
      } else {
        sDef.build = svc.buildContext.trim();
      }
    }

    if (svc.containerName?.trim()) {
      sDef.container_name = svc.containerName.trim();
    }

    if (svc.command?.trim()) {
      sDef.command = svc.command.trim();
    }

    if (svc.restart) {
      sDef.restart = svc.restart === 'no' ? new Quoted('no') : svc.restart;
    }

    if (svc.ports.length > 0) {
      sDef.ports = svc.ports.map((p) => new Quoted(p.trim()));
    }

    if (svc.volumes.length > 0) {
      sDef.volumes = svc.volumes.map((v) => {
        const parsed = parseVolume(v);
        if (parsed && isNamedVolume(parsed.source)) {
          allNamedVolumes.add(parsed.source);
        }
        return v.trim();
      });
    }

    if (svc.environment.length > 0) {
      const envObj: Record<string, string | null> = {};
      for (const [k, v] of svc.environment) {
        if (k.trim()) {
          envObj[k.trim()] = v === '' ? null : v;
        }
      }
      if (Object.keys(envObj).length > 0) {
        sDef.environment = envObj;
      }
    }

    if (svc.networks.length > 0) {
      sDef.networks = svc.networks.map((n) => n.trim()).filter(Boolean);
    }

    if (svc.healthcheck && svc.healthcheck.test.trim()) {
      const hc: Obj = {
        test: ['CMD-SHELL', svc.healthcheck.test.trim()],
      };
      if (svc.healthcheck.interval) hc.interval = svc.healthcheck.interval;
      if (svc.healthcheck.timeout) hc.timeout = svc.healthcheck.timeout;
      if (svc.healthcheck.retries !== undefined) hc.retries = svc.healthcheck.retries;
      if (svc.healthcheck.startPeriod) hc.start_period = svc.healthcheck.startPeriod;
      sDef.healthcheck = hc;
    }

    if (svc.dependsOn.length > 0) {
      const hasConditions = svc.dependsOn.some((d) => d.condition && d.condition !== 'service_started');
      if (hasConditions) {
        const depObj: Record<string, Obj> = {};
        for (const dep of svc.dependsOn) {
          if (dep.service.trim()) {
            depObj[dep.service.trim()] = {
              condition: dep.condition || 'service_started',
            };
          }
        }
        sDef.depends_on = depObj;
      } else {
        sDef.depends_on = svc.dependsOn.map((d) => d.service.trim()).filter(Boolean);
      }
    }

    doc.services[sName] = sDef;
  }

  // Top-level volumes
  if (allNamedVolumes.size > 0) {
    doc.volumes = {};
    for (const v of allNamedVolumes) {
      if (v.trim()) doc.volumes[v.trim()] = {};
    }
  }

  // Top-level networks
  const allNetworks = new Set(state.networks);
  for (const svc of state.services) {
    for (const n of svc.networks) {
      if (n.trim()) allNetworks.add(n.trim());
    }
  }
  if (allNetworks.size > 0) {
    doc.networks = {};
    for (const n of allNetworks) {
      doc.networks[n.trim()] = {};
    }
  }

  return doc;
}

export async function serializeBuilderState(state: ComposeBuilderState): Promise<string> {
  const doc = exportComposeDoc(state);
  return composeYaml(doc);
}

// ---------------------------------------------------------------------------
// Import from Compose YAML

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v : String(v));

export async function importComposeYaml(yamlText: string): Promise<{ state: ComposeBuilderState; warnings: string[] }> {
  const warnings: string[] = [];
  const { parse } = await import('yaml');

  let parsed: unknown;
  try {
    parsed = parse(yamlText, { merge: true, maxAliasCount: 100 });
  } catch (e) {
    throw new Error(`YAML syntax error: ${(e as Error).message.split('\n')[0]}`);
  }

  if (!isObj(parsed)) {
    throw new Error('Expected a Docker Compose YAML document with a "services:" section.');
  }

  const services: ServiceDef[] = [];

  let servicesObj: Record<string, unknown> = {};
  if (isObj(parsed.services)) {
    servicesObj = parsed.services as Record<string, unknown>;
  } else if (parsed.image !== undefined || parsed.build !== undefined) {
    servicesObj = { app: parsed };
  } else {
    throw new Error('No "services:" section found in the Compose file.');
  }

  for (const [name, rawDef] of Object.entries(servicesObj)) {
    if (!isObj(rawDef)) {
      warnings.push(`Service "${name}" is empty and was ignored.`);
      continue;
    }

    const svc: ServiceDef = {
      id: createId(),
      name,
      image: rawDef.image ? str(rawDef.image) : '',
      containerName: rawDef.container_name ? str(rawDef.container_name) : undefined,
      command: Array.isArray(rawDef.command) ? rawDef.command.map(str).join(' ') : rawDef.command ? str(rawDef.command) : undefined,
      ports: [],
      volumes: [],
      environment: [],
      networks: [],
      restart: (['no', 'always', 'on-failure', 'unless-stopped'].includes(str(rawDef.restart))
        ? (str(rawDef.restart) as ServiceDef['restart'])
        : '') || '',
      dependsOn: [],
    };

    // Build context
    if (typeof rawDef.build === 'string') {
      svc.buildContext = rawDef.build;
    } else if (isObj(rawDef.build)) {
      if (rawDef.build.context) svc.buildContext = str(rawDef.build.context);
      if (rawDef.build.dockerfile) svc.dockerfile = str(rawDef.build.dockerfile);
    }

    // Ports
    if (Array.isArray(rawDef.ports)) {
      svc.ports = rawDef.ports.map((p) => {
        if (typeof p === 'number' || typeof p === 'string') return String(p);
        if (isObj(p)) {
          const target = p.target;
          const published = p.published ? `${p.published}:` : '';
          const proto = p.protocol ? `/${p.protocol}` : '';
          return `${published}${target}${proto}`;
        }
        return str(p);
      });
    }

    // Volumes
    if (Array.isArray(rawDef.volumes)) {
      svc.volumes = rawDef.volumes.map((v) => {
        if (typeof v === 'string') return v;
        if (isObj(v)) {
          const source = v.source || '';
          const target = v.target || '';
          const ro = v.read_only ? ':ro' : '';
          return `${source}:${target}${ro}`;
        }
        return str(v);
      });
    }

    // Environment
    if (isObj(rawDef.environment)) {
      for (const [k, val] of Object.entries(rawDef.environment)) {
        svc.environment.push([k, val === null || val === undefined ? '' : str(val)]);
      }
    } else if (Array.isArray(rawDef.environment)) {
      for (const entry of rawDef.environment) {
        const s = str(entry);
        const eqIdx = s.indexOf('=');
        if (eqIdx === -1) {
          svc.environment.push([s, '']);
        } else {
          svc.environment.push([s.slice(0, eqIdx), s.slice(eqIdx + 1)]);
        }
      }
    }

    // Networks
    if (Array.isArray(rawDef.networks)) {
      svc.networks = rawDef.networks.map(str);
    } else if (isObj(rawDef.networks)) {
      svc.networks = Object.keys(rawDef.networks);
    }

    // Healthcheck
    if (isObj(rawDef.healthcheck)) {
      const hc = rawDef.healthcheck;
      let testCmd = '';
      if (typeof hc.test === 'string') {
        testCmd = hc.test;
      } else if (Array.isArray(hc.test)) {
        // e.g. ["CMD", "curl", "-f", "localhost"] or ["CMD-SHELL", "curl -f localhost"]
        const nonHeader = hc.test.filter((t) => !['CMD', 'CMD-SHELL'].includes(str(t)));
        testCmd = nonHeader.map(str).join(' ');
      }
      if (testCmd) {
        svc.healthcheck = {
          test: testCmd,
          interval: hc.interval ? str(hc.interval) : undefined,
          timeout: hc.timeout ? str(hc.timeout) : undefined,
          retries: typeof hc.retries === 'number' ? hc.retries : undefined,
          startPeriod: hc.start_period ? str(hc.start_period) : undefined,
        };
      }
    }

    // Depends_on
    if (Array.isArray(rawDef.depends_on)) {
      svc.dependsOn = rawDef.depends_on.map((d) => ({
        service: str(d),
        condition: 'service_started',
      }));
    } else if (isObj(rawDef.depends_on)) {
      for (const [depName, depCfg] of Object.entries(rawDef.depends_on)) {
        const cond = isObj(depCfg) && depCfg.condition ? str(depCfg.condition) : 'service_started';
        svc.dependsOn.push({
          service: depName,
          condition: cond as ServiceDependency['condition'],
        });
      }
    }

    services.push(svc);
  }

  // Top-level named volumes
  const namedVolumes: string[] = [];
  if (isObj(parsed.volumes)) {
    namedVolumes.push(...Object.keys(parsed.volumes));
  }

  // Top-level networks
  const networks: string[] = [];
  if (isObj(parsed.networks)) {
    networks.push(...Object.keys(parsed.networks));
  }

  return {
    state: {
      services: services.length ? services : [emptyService('web')],
      namedVolumes,
      networks,
    },
    warnings,
  };
}
