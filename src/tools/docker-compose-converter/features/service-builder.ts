// Visual Compose Service Builder: data models, templates, validation, .env.example generation,
// and bidirectional serialization with Docker Compose YAML.

import { Quoted, type Obj, type ComposeDoc } from './run';
import { composeYaml } from './docker-compose-converter';
import { AppError } from '../../../shared/lib/errors';

export interface ServiceDependency {
  service: string;
  condition?: 'service_started' | 'service_healthy' | 'service_completed_successfully';
}

export interface ServiceHealthcheck {
  /** A string runs in a shell (CMD-SHELL); an array is the exact Compose form, e.g. ["CMD", …] or ["NONE"]. */
  test: string | string[];
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
  /** An array is exec form and is exported unchanged; joining it would change its meaning. */
  command?: string | string[];
  ports: string[];
  volumes: string[];
  /** A null value passes the variable through from the host (`KEY` with no `=`); '' sets it empty. */
  environment: [string, string | null][];
  networks: string[];
  restart: 'no' | 'always' | 'on-failure' | `on-failure:${number}` | 'unless-stopped' | '';
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
  hostIp?: string;
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

export function parsePort(raw: string): { hostIp?: string; hostPort: string; containerPort: string; protocol?: string } | null {
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
    // Container port only: Docker picks a random host port, so nothing to conflict with.
    return { hostPort: '', containerPort: parts[0], protocol };
  }
  if (parts.length === 2) {
    return { hostPort: parts[0], containerPort: parts[1], protocol };
  }
  if (parts.length >= 3) {
    // ip:hostPort:containerPort
    return { hostIp: parts.slice(0, -2).join(':'), hostPort: parts[parts.length - 2], containerPort: parts[parts.length - 1], protocol };
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

  // Names as exported: an empty name becomes "app", and a repeated name overwrites the earlier service.
  const exportedNames = state.services.map((s) => s.name.trim() || 'app');
  if (state.services.some((s) => !s.name.trim())) warnings.push('A service has no name; it is exported as "app". Give it a name.');
  for (const name of new Set(exportedNames.filter((n, i) => exportedNames.indexOf(n) !== i))) {
    warnings.push(`Service name "${name}" is used by more than one service; only the last one is exported. Rename the others.`);
  }

  // "hostPort/protocol" -> bindings, so a host IP can be compared within the same port.
  const hostPortMap = new Map<string, { ip: string; service: string }[]>();

  for (const svc of state.services) {
    const sName = svc.name.trim() || 'unnamed';

    // Ports
    for (const p of svc.ports) {
      const parsed = parsePort(p);
      if (parsed) {
        ports.push({
          service: sName,
          hostIp: parsed.hostIp,
          hostPort: parsed.hostPort,
          containerPort: parsed.containerPort,
          protocol: parsed.protocol,
          raw: p,
        });

        // Check for duplicate host port bindings
        if (parsed.hostPort) {
          const key = `${parsed.hostPort}/${parsed.protocol || 'tcp'}`;
          const current = hostPortMap.get(key) || [];
          current.push({ ip: parsed.hostIp || '', service: sName });
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
      } else if (dep.condition === 'service_healthy') {
        const target = state.services.find((s) => s.name.trim() === targetName);
        const test = target?.healthcheck?.test;
        if (!test || !test.length || (Array.isArray(test) && test[0] === 'NONE')) {
          warnings.push(
            `Service "${sName}" waits for "${targetName}" to be service_healthy, but "${targetName}" has no healthcheck here. Add one, or use service_started, unless its image defines a HEALTHCHECK.`,
          );
        }
      }
    }
  }

  // Detect port conflicts
  const anyIp = (ip: string) => ip === '' || ip === '0.0.0.0' || ip === '::' || ip === '[::]';
  for (const [key, bindings] of hostPortMap.entries()) {
    const clashing = bindings.filter((b, i) => bindings.some((o, j) => i !== j && (o.ip === b.ip || anyIp(o.ip) || anyIp(b.ip))));
    if (clashing.length > 1) {
      const port = key.endsWith('/tcp') ? key.slice(0, -4) : key;
      warnings.push(`Host port ${port} is bound by multiple services: ${[...new Set(clashing.map((b) => b.service))].join(', ')}.`);
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

/** Renames a service and points other services' depends_on at the new name. */
export function renameService(state: ComposeBuilderState, id: string, name: string): ComposeBuilderState {
  const oldName = state.services.find((s) => s.id === id)?.name.trim();
  return {
    ...state,
    services: state.services.map((s) =>
      s.id === id
        ? { ...s, name }
        : oldName && name.trim() && s.dependsOn.some((d) => d.service.trim() === oldName)
          ? { ...s, dependsOn: s.dependsOn.map((d) => (d.service.trim() === oldName ? { ...d, service: name.trim() } : d)) }
          : s,
    ),
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
      const val = /pass|secret|key|token|credential|auth/i.test(key) ? 'change_me' : (v ?? '').trim();
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

    if (Array.isArray(svc.command) ? svc.command.length : svc.command?.trim()) {
      sDef.command = Array.isArray(svc.command) ? svc.command : svc.command!.trim();
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
          envObj[k.trim()] = v;
        }
      }
      if (Object.keys(envObj).length > 0) {
        sDef.environment = envObj;
      }
    }

    if (svc.networks.length > 0) {
      sDef.networks = svc.networks.map((n) => n.trim()).filter(Boolean);
    }

    const test = svc.healthcheck?.test;
    if (svc.healthcheck && (Array.isArray(test) ? test.length : test?.trim())) {
      const hc: Obj = {
        test: Array.isArray(test) ? test : ['CMD-SHELL', test!.trim()],
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

const SERVICE_KEYS = ['image', 'build', 'container_name', 'command', 'ports', 'volumes', 'environment', 'networks', 'restart', 'healthcheck', 'depends_on'];
const DEPENDENCY_CONDITIONS = ['service_started', 'service_healthy', 'service_completed_successfully'];

export async function importComposeYaml(yamlText: string): Promise<{ state: ComposeBuilderState; warnings: string[] }> {
  const warnings: string[] = [];
  // The builder can't represent every Compose key; say so instead of dropping it silently.
  const notImported = (where: string, obj: Obj, known: string[]) => {
    for (const k of Object.keys(obj)) if (!known.includes(k)) warnings.push(`${where}: "${k}" isn't supported by the builder and was not imported.`);
  };
  const { parse } = await import('yaml');

  let parsed: unknown;
  try {
    parsed = parse(yamlText, { merge: true, maxAliasCount: 100 });
  } catch (e) {
    throw new AppError('CORRUPT', `YAML syntax error: ${(e as Error).message.split('\n')[0]}. Fix the YAML and try again.`);
  }

  if (!isObj(parsed)) {
    throw new AppError('VALIDATION_FAILED', 'Expected a Docker Compose YAML document with a "services:" section.');
  }

  const services: ServiceDef[] = [];

  let servicesObj: Record<string, unknown> = {};
  if (isObj(parsed.services)) {
    servicesObj = parsed.services as Record<string, unknown>;
    notImported('Compose file', parsed, ['services', 'volumes', 'networks', 'version', 'name']);
  } else if (parsed.image !== undefined || parsed.build !== undefined) {
    servicesObj = { app: parsed };
  } else {
    throw new AppError('VALIDATION_FAILED', 'No "services:" section found in the Compose file. Paste a Compose file or a single service definition.');
  }

  for (const [name, rawDef] of Object.entries(servicesObj)) {
    if (!isObj(rawDef)) {
      warnings.push(`Service "${name}" is empty and was ignored.`);
      continue;
    }
    notImported(`Service "${name}"`, rawDef, SERVICE_KEYS);

    const restart = rawDef.restart === undefined ? '' : str(rawDef.restart);
    const restartOk = /^(no|always|on-failure(:\d+)?|unless-stopped)$/.test(restart);
    if (restart && !restartOk) warnings.push(`Service "${name}": restart "${restart}" isn't a valid policy and was not imported.`);

    const svc: ServiceDef = {
      id: createId(),
      name,
      image: rawDef.image ? str(rawDef.image) : '',
      containerName: rawDef.container_name ? str(rawDef.container_name) : undefined,
      command: Array.isArray(rawDef.command) ? rawDef.command.map(str) : rawDef.command ? str(rawDef.command) : undefined,
      ports: [],
      volumes: [],
      environment: [],
      networks: [],
      restart: restartOk ? (restart as ServiceDef['restart']) : '',
      dependsOn: [],
    };

    // Build context
    if (typeof rawDef.build === 'string') {
      svc.buildContext = rawDef.build;
    } else if (isObj(rawDef.build)) {
      if (rawDef.build.context) svc.buildContext = str(rawDef.build.context);
      if (rawDef.build.dockerfile) svc.dockerfile = str(rawDef.build.dockerfile);
      notImported(`Service "${name}" build`, rawDef.build, ['context', 'dockerfile']);
    }

    // Ports
    if (Array.isArray(rawDef.ports)) {
      svc.ports = rawDef.ports.map((p) => {
        if (typeof p === 'number' || typeof p === 'string') return String(p);
        if (isObj(p)) {
          notImported(`Service "${name}" port ${str(p.target)}`, p, ['target', 'published', 'host_ip', 'protocol']);
          const hostIp = p.host_ip ? `${str(p.host_ip)}:` : '';
          const published = p.published !== undefined ? `${p.published}:` : hostIp ? ':' : '';
          const proto = p.protocol ? `/${p.protocol}` : '';
          return `${hostIp}${published}${p.target}${proto}`;
        }
        return str(p);
      });
    }

    // Volumes
    if (Array.isArray(rawDef.volumes)) {
      for (const v of rawDef.volumes) {
        if (!isObj(v)) {
          svc.volumes.push(str(v));
          continue;
        }
        const type = v.type === undefined ? 'volume' : str(v.type);
        if ((type !== 'volume' && type !== 'bind') || !v.target) {
          warnings.push(`Service "${name}": the ${type} mount at ${str(v.target ?? '?')} has no short form and was not imported.`);
          continue;
        }
        notImported(`Service "${name}" volume ${str(v.target)}`, v, ['type', 'source', 'target', 'read_only']);
        const ro = v.read_only ? ':ro' : '';
        if (!v.source && ro) warnings.push(`Service "${name}": read_only on the anonymous volume ${str(v.target)} was not imported.`);
        svc.volumes.push(v.source ? `${str(v.source)}:${str(v.target)}${ro}` : str(v.target));
      }
    }

    // Environment
    if (isObj(rawDef.environment)) {
      for (const [k, val] of Object.entries(rawDef.environment)) {
        svc.environment.push([k, val === null || val === undefined ? null : str(val)]);
      }
    } else if (Array.isArray(rawDef.environment)) {
      for (const entry of rawDef.environment) {
        const s = str(entry);
        const eqIdx = s.indexOf('=');
        if (eqIdx === -1) {
          svc.environment.push([s, null]);
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
      for (const [net, cfg] of Object.entries(rawDef.networks)) {
        if (isObj(cfg)) notImported(`Service "${name}" network ${net}`, cfg, []);
      }
    }

    // Healthcheck
    if (isObj(rawDef.healthcheck)) {
      const hc = rawDef.healthcheck;
      notImported(`Service "${name}" healthcheck`, hc, ['test', 'interval', 'timeout', 'retries', 'start_period']);
      let test: string | string[] = '';
      if (typeof hc.test === 'string') {
        test = hc.test;
      } else if (Array.isArray(hc.test)) {
        // CMD-SHELL stays editable as one command; CMD and NONE keep their exact form.
        const parts = hc.test.map(str);
        test = parts[0] === 'CMD-SHELL' ? parts.slice(1).join(' ') : parts;
      }
      if (test.length) {
        svc.healthcheck = {
          test,
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
        let cond = isObj(depCfg) && depCfg.condition ? str(depCfg.condition) : 'service_started';
        if (isObj(depCfg)) notImported(`Service "${name}" depends_on ${depName}`, depCfg, ['condition']);
        if (!DEPENDENCY_CONDITIONS.includes(cond)) {
          warnings.push(`Service "${name}" depends_on ${depName}: condition "${cond}" isn't valid; service_started was used.`);
          cond = 'service_started';
        }
        svc.dependsOn.push({
          service: depName,
          condition: cond as ServiceDependency['condition'],
        });
      }
    }

    services.push(svc);
  }

  // Top-level named volumes and networks; their settings (driver, external, …) aren't kept.
  const namedVolumes: string[] = [];
  if (isObj(parsed.volumes)) {
    namedVolumes.push(...Object.keys(parsed.volumes));
    for (const [vol, cfg] of Object.entries(parsed.volumes)) if (isObj(cfg)) notImported(`Volume ${vol}`, cfg, []);
  }

  const networks: string[] = [];
  if (isObj(parsed.networks)) {
    networks.push(...Object.keys(parsed.networks));
    for (const [net, cfg] of Object.entries(parsed.networks)) if (isObj(cfg)) notImported(`Network ${net}`, cfg, []);
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
