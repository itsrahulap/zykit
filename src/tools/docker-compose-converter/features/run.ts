// docker run → Compose: split the pasted text into commands, parse each one's flags and map them
// to a Compose service. The result is a plain object tree; docker-compose-converter.ts turns it into YAML.

import { tokenizeShell } from '../../curl-converter/features/shell';

/** A string the YAML writer must double-quote (ports, "no", cpu counts). */
export class Quoted {
  value: string;
  constructor(value: string) {
    this.value = value;
  }
}

export type Obj = Record<string, unknown>;

export interface ComposeDoc {
  services: Record<string, Obj>;
  volumes?: Record<string, Obj>;
  networks?: Record<string, Obj>;
}

export interface RunResult {
  doc: ComposeDoc | null;
  /** Flags that were ignored or only partly converted. */
  warnings: string[];
  /** Differences worth knowing that aren't problems (-d, --rm). */
  notes: string[];
  error?: string;
}

/* ---------------------------------------------------------------- flag table */

// [short, long, takesValue]
const FLAGS: [string, string, boolean][] = [
  ['d', 'detach', false], ['i', 'interactive', false], ['t', 'tty', false], ['P', 'publish-all', false], ['q', 'quiet', false],
  ['p', 'publish', true], ['e', 'env', true], ['v', 'volume', true], ['w', 'workdir', true], ['u', 'user', true], ['h', 'hostname', true],
  ['l', 'label', true], ['m', 'memory', true], ['c', 'cpu-shares', true], ['a', 'attach', true],
  ['', 'rm', false], ['', 'privileged', false], ['', 'init', false], ['', 'read-only', false], ['', 'no-healthcheck', false],
  ['', 'oom-kill-disable', false], ['', 'sig-proxy', false], ['', 'disable-content-trust', false],
  ...[
    'name', 'expose', 'env-file', 'mount', 'network', 'network-alias', 'restart', 'entrypoint', 'label-file', 'health-cmd', 'health-interval',
    'health-timeout', 'health-retries', 'health-start-period', 'health-start-interval', 'cpus', 'memory-reservation', 'memory-swap', 'add-host',
    'cap-add', 'cap-drop', 'device', 'dns', 'dns-search', 'dns-option', 'group-add', 'ulimit', 'sysctl', 'tmpfs', 'shm-size', 'pid', 'ipc', 'uts',
    'log-driver', 'log-opt', 'security-opt', 'stop-signal', 'stop-timeout', 'platform', 'pull', 'runtime', 'cgroup-parent', 'ip', 'ip6', 'mac-address',
    'link', 'volumes-from', 'gpus', 'userns', 'domainname', 'oom-score-adj', 'cpuset-cpus', 'cpuset-mems', 'pids-limit', 'storage-opt', 'annotation',
    'detach-keys', 'cidfile', 'isolation', 'kernel-memory', 'cpu-period', 'cpu-quota', 'cpu-rt-period', 'cpu-rt-runtime', 'blkio-weight', 'device-read-bps',
    'device-write-bps', 'link-local-ip', 'hooks', 'pids', 'env-file-secrets', 'volume-driver', 'expose-range', 'cgroupns',
  ].map((l): [string, string, boolean] => ['', l, true]),
];
const ALIASES: Record<string, string> = { net: 'network' };
const BY_SHORT = new Map(FLAGS.filter((f) => f[0]).map((f) => [f[0], f] as const));
const BY_LONG = new Map(FLAGS.map((f) => [f[1], f] as const));

interface Parsed {
  /** Canonical long option → values in order (booleans are ['true']). */
  opts: Map<string, string[]>;
  image: string;
  command: string[];
}

function parseArgs(args: string[], warn: (m: string) => void): Parsed | string {
  const opts = new Map<string, string[]>();
  const add = (k: string, v: string) => opts.set(k, [...(opts.get(k) ?? []), v]);
  let i = 0;
  for (; i < args.length; i++) {
    const a = args[i];
    if (a === '--') {
      i++;
      break;
    }
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      const raw = eq === -1 ? a.slice(2) : a.slice(2, eq);
      const name = ALIASES[raw] ?? raw;
      const f = BY_LONG.get(name);
      if (!f) {
        warn(`Unknown flag --${raw} was ignored.`);
        continue;
      }
      if (f[2]) {
        const value = eq === -1 ? args[++i] : a.slice(eq + 1);
        if (value === undefined) return `Flag --${raw} needs a value.`;
        add(name, value);
      } else if (eq === -1 || !/^(false|0)$/i.test(a.slice(eq + 1))) add(name, 'true');
      continue;
    }
    if (a.startsWith('-') && a.length > 1) {
      // A cluster such as -dit, or a flag with its value attached (-p8080:80).
      for (let j = 1; j < a.length; j++) {
        const f = BY_SHORT.get(a[j]);
        if (!f) {
          warn(`Unknown flag -${a[j]} was ignored.`);
          continue;
        }
        if (!f[2]) {
          add(f[1], 'true');
          continue;
        }
        let value = a.slice(j + 1).replace(/^=/, '');
        if (!value) {
          value = args[++i];
          if (value === undefined) return `Flag -${a[j]} needs a value.`;
        }
        add(f[1], value);
        break;
      }
      continue;
    }
    break; // the image
  }
  if (i >= args.length) return 'No image found: a docker run command needs an image after its options.';
  return { opts, image: args[i], command: args.slice(i + 1) };
}

/* ---------------------------------------------------------------- helpers */

const flag = (p: Parsed, k: string) => p.opts.get(k)?.at(-1) === 'true';
const last = (p: Parsed, k: string) => p.opts.get(k)?.at(-1);
const all = (p: Parsed, k: string) => p.opts.get(k) ?? [];

/** "ghcr.io/org/app:1.2@sha256:…" → "app"; a valid Compose service name. */
export function serviceNameFor(image: string): string {
  const noDigest = image.split('@')[0];
  const lastSeg = noDigest.slice(noDigest.lastIndexOf('/') + 1).split(':')[0];
  return lastSeg.toLowerCase().replace(/[^a-z0-9_.-]/g, '-').replace(/^[^a-z0-9]+/, '') || 'app';
}

const isNamedVolume = (src: string) => /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(src) && !/^[A-Za-z]:$/.test(src);

function splitEq(s: string): [string, string | null] {
  const i = s.indexOf('=');
  return i === -1 ? [s, null] : [s.slice(0, i), s.slice(i + 1)];
}

function seconds(v: string): string {
  return /^\d+$/.test(v) ? `${v}s` : v;
}

/* ---------------------------------------------------------------- mapping */

function buildService(p: Parsed, ctx: { volumes: Set<string>; networks: Set<string>; warn: (m: string) => void; note: (m: string) => void }, name: string): Obj {
  const { warn, note } = ctx;
  const s: Obj = { image: p.image };
  const containerName = last(p, 'name');
  if (containerName) s.container_name = containerName;
  if (p.command.length) s.command = p.command;
  const entrypoint = last(p, 'entrypoint');
  if (entrypoint !== undefined) s.entrypoint = entrypoint === '' ? [] : [entrypoint];
  if (last(p, 'workdir')) s.working_dir = last(p, 'workdir');
  if (last(p, 'user')) s.user = last(p, 'user');
  if (last(p, 'hostname')) s.hostname = last(p, 'hostname');
  if (last(p, 'domainname')) s.domainname = last(p, 'domainname');
  if (flag(p, 'interactive')) s.stdin_open = true;
  if (flag(p, 'tty')) s.tty = true;
  if (flag(p, 'privileged')) s.privileged = true;
  if (flag(p, 'init')) s.init = true;
  if (flag(p, 'read-only')) s.read_only = true;

  const restart = last(p, 'restart');
  if (restart) s.restart = restart === 'no' ? new Quoted('no') : restart;

  const publish = all(p, 'publish');
  if (publish.length) s.ports = publish.map((x) => new Quoted(x));
  const expose = all(p, 'expose');
  if (expose.length) s.expose = expose.map((x) => new Quoted(x));

  const env = all(p, 'env');
  if (env.length) {
    const map: Obj = {};
    for (const e of env) {
      const [k, v] = splitEq(e);
      map[k] = v;
    }
    s.environment = map;
  }
  const envFiles = all(p, 'env-file');
  if (envFiles.length) s.env_file = envFiles;
  if (p.opts.has('label-file')) warn('--label-file has no Compose equivalent; add the labels under `labels:` yourself.');
  const labels = all(p, 'label');
  if (labels.length) {
    const map: Obj = {};
    for (const l of labels) {
      const [k, v] = splitEq(l);
      map[k] = v ?? '';
    }
    s.labels = map;
  }

  // Volumes: -v short syntax and --mount long syntax.
  const volumes: unknown[] = [];
  for (const v of all(p, 'volume')) {
    volumes.push(v);
    const parts = v.split(':');
    if (parts.length > 1 && !/^[A-Za-z]:[\\/]/.test(v) && isNamedVolume(parts[0])) ctx.volumes.add(parts[0]);
  }
  for (const m of all(p, 'mount')) {
    const f: Record<string, string> = {};
    for (const part of m.split(',')) {
      const [k, v] = splitEq(part.trim());
      f[k] = v ?? 'true';
    }
    const type = f.type ?? 'volume';
    const source = f.source ?? f.src;
    const target = f.target ?? f.destination ?? f.dst;
    if (!target) {
      warn(`--mount "${m}" has no target and was skipped.`);
      continue;
    }
    const entry: Obj = { type };
    if (source) entry.source = source;
    entry.target = target;
    if (f.readonly === 'true' || f.ro === 'true' || f.readonly === '1') entry.read_only = true;
    if (f['bind-propagation']) entry.bind = { propagation: f['bind-propagation'] };
    if (type === 'tmpfs' && f['tmpfs-size']) entry.tmpfs = { size: f['tmpfs-size'] };
    for (const k of Object.keys(f)) if (!['type', 'source', 'src', 'target', 'destination', 'dst', 'readonly', 'ro', 'bind-propagation', 'tmpfs-size'].includes(k)) warn(`--mount option "${k}" was ignored.`);
    if (type === 'volume' && source && isNamedVolume(source)) ctx.volumes.add(source);
    volumes.push(entry);
  }
  if (volumes.length) s.volumes = volumes;
  const tmpfs = all(p, 'tmpfs');
  if (tmpfs.length) s.tmpfs = tmpfs;
  if (all(p, 'volumes-from').length) s.volumes_from = all(p, 'volumes-from');
  if (all(p, 'volume-driver').length) warn('--volume-driver was ignored; set `driver:` on the top-level volume instead.');

  // Networking.
  const network = last(p, 'network');
  const aliases = all(p, 'network-alias');
  const ip = last(p, 'ip');
  if (network) {
    if (['host', 'none', 'bridge'].includes(network) || network.startsWith('container:') || network.startsWith('service:')) {
      s.network_mode = network;
      if (aliases.length) warn('--network-alias only works on user-defined networks and was ignored.');
    } else {
      ctx.networks.add(network);
      if (aliases.length || ip) {
        const cfg: Obj = {};
        if (aliases.length) cfg.aliases = aliases;
        if (ip) cfg.ipv4_address = ip;
        s.networks = { [network]: cfg };
      } else s.networks = [network];
    }
  } else if (aliases.length) warn('--network-alias needs --network and was ignored.');
  else if (ip) warn('--ip needs a user-defined --network and was ignored.');
  if (last(p, 'mac-address')) s.mac_address = last(p, 'mac-address');
  const hosts = all(p, 'add-host');
  if (hosts.length) s.extra_hosts = hosts;
  for (const [flagName, key] of [['dns', 'dns'], ['dns-search', 'dns_search'], ['dns-option', 'dns_opt']] as const)
    if (all(p, flagName).length) s[key] = all(p, flagName);
  if (all(p, 'link').length) s.links = all(p, 'link');

  // Security and runtime.
  for (const [flagName, key] of [['cap-add', 'cap_add'], ['cap-drop', 'cap_drop'], ['device', 'devices'], ['group-add', 'group_add'], ['security-opt', 'security_opt']] as const)
    if (all(p, flagName).length) s[key] = all(p, flagName);
  const sysctls = all(p, 'sysctl');
  if (sysctls.length) s.sysctls = Object.fromEntries(sysctls.map((x) => splitEq(x)));
  const ulimits = all(p, 'ulimit');
  if (ulimits.length) {
    const map: Obj = {};
    for (const u of ulimits) {
      const [k, v] = splitEq(u);
      const [soft, hard] = (v ?? '').split(':');
      map[k] = hard !== undefined ? { soft: Number(soft), hard: Number(hard) } : Number(soft);
    }
    s.ulimits = map;
  }
  if (last(p, 'shm-size')) s.shm_size = last(p, 'shm-size');
  for (const [flagName, key] of [['pid', 'pid'], ['ipc', 'ipc'], ['uts', 'uts'], ['runtime', 'runtime'], ['platform', 'platform'], ['stop-signal', 'stop_signal'], ['cgroup-parent', 'cgroup_parent'], ['userns', 'userns_mode'], ['cpuset-cpus', 'cpuset'], ['memory-swap', 'memswap_limit']] as const)
    if (last(p, flagName)) s[key] = last(p, flagName);
  if (last(p, 'stop-timeout')) s.stop_grace_period = seconds(last(p, 'stop-timeout')!);
  if (last(p, 'pids-limit')) s.pids_limit = Number(last(p, 'pids-limit'));
  if (last(p, 'oom-score-adj')) s.oom_score_adj = Number(last(p, 'oom-score-adj'));
  if (last(p, 'cpu-shares')) s.cpu_shares = Number(last(p, 'cpu-shares'));
  if (last(p, 'pull')) {
    const pull = last(p, 'pull')!;
    if (['always', 'missing', 'never'].includes(pull)) s.pull_policy = pull;
    else warn(`--pull ${pull} has no Compose equivalent and was ignored.`);
  }
  if (last(p, 'log-driver') || all(p, 'log-opt').length) {
    const logging: Obj = {};
    if (last(p, 'log-driver')) logging.driver = last(p, 'log-driver');
    if (all(p, 'log-opt').length) logging.options = Object.fromEntries(all(p, 'log-opt').map((x) => splitEq(x)));
    s.logging = logging;
  }

  // Health check.
  if (flag(p, 'no-healthcheck')) s.healthcheck = { disable: true };
  else if (last(p, 'health-cmd') || last(p, 'health-interval') || last(p, 'health-timeout') || last(p, 'health-retries') || last(p, 'health-start-period') || last(p, 'health-start-interval')) {
    const h: Obj = {};
    if (last(p, 'health-cmd')) h.test = ['CMD-SHELL', last(p, 'health-cmd')];
    if (last(p, 'health-interval')) h.interval = last(p, 'health-interval');
    if (last(p, 'health-timeout')) h.timeout = last(p, 'health-timeout');
    if (last(p, 'health-retries')) h.retries = Number(last(p, 'health-retries'));
    if (last(p, 'health-start-period')) h.start_period = last(p, 'health-start-period');
    if (last(p, 'health-start-interval')) h.start_interval = last(p, 'health-start-interval');
    s.healthcheck = h;
  }

  // Resources → deploy.resources.
  const limits: Obj = {};
  const reservations: Obj = {};
  if (last(p, 'cpus')) limits.cpus = new Quoted(last(p, 'cpus')!);
  if (last(p, 'memory')) limits.memory = last(p, 'memory');
  if (last(p, 'memory-reservation')) reservations.memory = last(p, 'memory-reservation');
  const gpus = last(p, 'gpus');
  if (gpus) {
    const device: Obj = { capabilities: ['gpu'] };
    const ids = /^"?device=(.+?)"?$/.exec(gpus)?.[1];
    if (ids) device.device_ids = ids.split(',');
    else device.count = /^\d+$/.test(gpus) ? Number(gpus) : 'all';
    reservations.devices = [device];
  }
  if (Object.keys(limits).length || Object.keys(reservations).length) {
    const resources: Obj = {};
    if (Object.keys(limits).length) resources.limits = limits;
    if (Object.keys(reservations).length) resources.reservations = reservations;
    s.deploy = { resources };
  }

  // Things with no service-level equivalent.
  if (flag(p, 'detach')) note(`-d: Compose services run in the background with \`docker compose up -d\`, so it isn't written to the file.`);
  if (flag(p, 'rm')) note('--rm: Compose services have no auto-remove option; use `docker compose run --rm ' + name + '` for a one-off container.');
  if (flag(p, 'publish-all')) warn('-P (publish all exposed ports) has no Compose equivalent; list the ports under `ports:`.');
  for (const k of ['kernel-memory', 'cpu-period', 'cpu-quota', 'cpu-rt-period', 'cpu-rt-runtime', 'blkio-weight', 'device-read-bps', 'device-write-bps', 'storage-opt', 'annotation', 'isolation', 'cidfile', 'cpuset-mems', 'ip6', 'link-local-ip', 'oom-kill-disable', 'attach', 'detach-keys', 'sig-proxy', 'disable-content-trust', 'quiet', 'hooks', 'cgroupns', 'pids', 'env-file-secrets', 'expose-range'])
    if (p.opts.has(k)) warn(`--${k} has no direct Compose equivalent and was ignored.`);
  return s;
}

/* ---------------------------------------------------------------- entry */

const SUBCOMMANDS = /^(run|container|network|volume|compose|build|pull|push|exec|ps|images|start|stop|rm|create|logs|image|system|tag|login)$/;

/** Splits tokenized input into one argv per `docker …` command (also on ; && | and newlines). */
function splitCommands(words: { value: string; operator?: boolean }[]): string[][] {
  const out: string[][] = [];
  let cur: string[] = [];
  const flush = () => {
    if (cur.length) out.push(cur);
    cur = [];
  };
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.operator) {
      flush();
      continue;
    }
    if ((w.value === 'docker' || w.value === 'podman') && words[i + 1] && !words[i + 1].operator && (SUBCOMMANDS.test(words[i + 1].value) || cur.length === 0)) {
      if (cur.at(-1) === 'sudo') cur.pop();
      flush();
    }
    if (w.value === '$' && cur.length === 0) continue; // pasted prompt
    cur.push(w.value);
  }
  flush();
  return out;
}

export function dockerRunToCompose(input: string): RunResult {
  const warnings: string[] = [];
  const notes: string[] = [];
  const warn = (m: string) => !warnings.includes(m) && warnings.push(m);
  const note = (m: string) => !notes.includes(m) && notes.push(m);
  if (!input.trim()) return { doc: null, warnings, notes };
  const tok = tokenizeShell(input);
  if (tok.error) return { doc: null, warnings, notes, error: tok.error };

  const services: Record<string, Obj> = {};
  const ctx = { volumes: new Set<string>(), networks: new Set<string>(), warn, note };
  let count = 0;
  for (const argv of splitCommands(tok.words)) {
    let a = argv;
    if (a[0] === 'sudo') a = a.slice(1);
    if (!['docker', 'podman'].includes(a[0])) {
      warn(`Skipped "${a.slice(0, 3).join(' ')}…": it doesn't start with docker run.`);
      continue;
    }
    a = a.slice(1);
    if (a[0] === 'container') a = a.slice(1);
    if (a[0] !== 'run') {
      warn(`Skipped "docker ${a.slice(0, 2).join(' ')}": only docker run is converted.`);
      continue;
    }
    const parsed = parseArgs(a.slice(1), warn);
    if (typeof parsed === 'string') return { doc: null, warnings, notes, error: parsed };
    let name = serviceNameFor(last(parsed, 'name') ? last(parsed, 'name')! : parsed.image);
    for (let n = 2; services[name]; n++) name = `${serviceNameFor(parsed.image)}-${n}`;
    services[name] = buildService(parsed, ctx, name);
    count++;
  }
  if (!count) return { doc: null, warnings, notes, error: 'No docker run command found. Paste a command that starts with docker run.' };
  const doc: ComposeDoc = { services };
  if (ctx.volumes.size) doc.volumes = Object.fromEntries([...ctx.volumes].map((v) => [v, {}]));
  if (ctx.networks.size) {
    doc.networks = Object.fromEntries([...ctx.networks].map((n) => [n, { external: true }]));
    note('Networks are marked `external: true` because docker run needs them to exist already. Remove that line to let Compose create the network.');
  }
  return { doc, warnings, notes };
}
