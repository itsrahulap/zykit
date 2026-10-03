// Compose → docker run: parse a docker-compose.yml (or a single service) and write one
// `docker run` command per service, in dependency order.

import { shellQuote, tokenizeShell } from '../../curl-converter/features/shell';
import type { Obj } from './run';

export interface ComposeToRunOptions {
  /** Add -d. */
  detach: boolean;
  /** One option per line with trailing backslashes. */
  multiline: boolean;
}

export const DEFAULT_RUN_OPTIONS: ComposeToRunOptions = { detach: true, multiline: true };

export interface ToRunResult {
  commands: string;
  warnings: string[];
  notes: string[];
  services: number;
  error?: string;
}

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v : String(v));
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]);

/** Compose key=value maps and ["k=v"] lists, normalised to [key, value|null] pairs. */
function pairs(v: unknown): [string, string | null][] {
  if (isObj(v)) return Object.entries(v).map(([k, val]) => [k, val === null || val === undefined ? null : str(val)]);
  return list(v).map((x): [string, string | null] => {
    const s = str(x);
    const i = s.indexOf('=');
    return i === -1 ? [s, null] : [s.slice(0, i), s.slice(i + 1)];
  });
}

/** "1m30s" / "10s" / "5" → seconds. */
function toSeconds(v: string): number | null {
  if (/^\d+$/.test(v)) return Number(v);
  const re = /(\d+(?:\.\d+)?)(ms|h|m|s)/g;
  let total = 0;
  let matched = '';
  for (let m = re.exec(v); m; m = re.exec(v)) {
    matched += m[0];
    total += Number(m[1]) * { h: 3600, m: 60, s: 1, ms: 0.001 }[m[2] as 'h' | 'm' | 's' | 'ms'];
  }
  return matched === v && v ? Math.round(total) : null;
}

const HANDLED = new Set([
  'image', 'build', 'container_name', 'command', 'entrypoint', 'working_dir', 'user', 'hostname', 'domainname', 'stdin_open', 'tty', 'privileged', 'init', 'read_only',
  'restart', 'ports', 'expose', 'environment', 'env_file', 'labels', 'volumes', 'tmpfs', 'volumes_from', 'network_mode', 'networks', 'mac_address', 'extra_hosts', 'dns',
  'dns_search', 'dns_opt', 'links', 'cap_add', 'cap_drop', 'devices', 'group_add', 'security_opt', 'sysctls', 'ulimits', 'shm_size', 'pid', 'ipc', 'uts', 'runtime',
  'platform', 'stop_signal', 'cgroup_parent', 'userns_mode', 'cpuset', 'memswap_limit', 'stop_grace_period', 'pids_limit', 'oom_score_adj', 'cpu_shares', 'pull_policy',
  'logging', 'healthcheck', 'deploy', 'cpus', 'mem_limit', 'mem_reservation', 'depends_on',
]);

interface Svc {
  name: string;
  def: Obj;
}

/** Orders services so each comes after the ones it depends_on (stable for the rest; cycles keep file order). */
function order(services: Svc[]): Svc[] {
  const byName = new Map(services.map((s) => [s.name, s]));
  const out: Svc[] = [];
  const state = new Map<string, 1 | 2>();
  const visit = (s: Svc) => {
    if (state.get(s.name)) return;
    state.set(s.name, 1);
    const deps = isObj(s.def.depends_on) ? Object.keys(s.def.depends_on) : list(s.def.depends_on).map(str);
    for (const d of deps) {
      const dep = byName.get(d);
      if (dep) visit(dep);
    }
    state.set(s.name, 2);
    out.push(s);
  };
  services.forEach(visit);
  return out;
}

type Arg = [string, string?];

function serviceArgs(
  name: string,
  s: Obj,
  top: { networks: Obj },
  warn: (m: string) => void,
  note: (m: string) => void,
  opts: ComposeToRunOptions,
): { args: Arg[]; image: string; command: string[]; networks: string[] } {
  const args: Arg[] = [];
  const opt = (flagName: string, value?: unknown) => args.push([flagName, value === undefined ? undefined : str(value)]);
  const networks: string[] = [];

  if (opts.detach) opt('-d');
  opt('--name', s.container_name ?? name);
  if (s.hostname) opt('--hostname', s.hostname);
  if (s.domainname) opt('--domainname', s.domainname);
  if (s.stdin_open) opt('-i');
  if (s.tty) opt('-t');
  if (s.restart && str(s.restart) !== 'no') opt('--restart', s.restart);
  for (const p of list(s.ports)) {
    if (isObj(p)) {
      const proto = p.protocol && p.protocol !== 'tcp' ? `/${str(p.protocol)}` : '';
      const target = `${str(p.target)}${proto}`;
      const pub = p.published !== undefined ? `${p.host_ip ? `${str(p.host_ip)}:` : ''}${str(p.published)}:` : '';
      opt('-p', pub + target);
    } else opt('-p', p);
  }
  for (const e of list(s.expose)) opt('--expose', e);
  let interpolated = false;
  for (const [k, v] of pairs(s.environment)) {
    if (v !== null && v.includes('${')) interpolated = true;
    opt('-e', v === null ? k : `${k}=${v}`);
  }
  if (interpolated) note('Some values use ${VAR} interpolation. Compose fills these from your shell or .env file; in a docker run command, replace them with real values.');
  for (const f of list(s.env_file)) opt('--env-file', isObj(f) ? f.path : f);
  for (const [k, v] of pairs(s.labels)) opt('-l', v === null ? k : `${k}=${v}`);
  if (s.working_dir) opt('--workdir', s.working_dir);
  if (s.user) opt('--user', s.user);

  for (const v of list(s.volumes)) {
    if (isObj(v)) {
      const type = str(v.type ?? 'volume');
      if (type === 'tmpfs') opt('--tmpfs', v.target);
      else if (type !== 'volume' && type !== 'bind') warn(`Volume type "${type}" for ${str(v.target)} is not supported by docker run and was skipped.`);
      else {
        const parts = [`type=${type}`, ...(v.source ? [`source=${str(v.source)}`] : []), `target=${str(v.target)}`, ...(v.read_only ? ['readonly'] : [])];
        opt('--mount', parts.join(','));
      }
    } else {
      if (/^(\.\.?\/|~)/.test(str(v))) warn(`${name}: the relative path in "${str(v)}" must be absolute for docker run (for example $(pwd)/…).`);
      opt('-v', v);
    }
  }
  for (const t of list(s.tmpfs)) opt('--tmpfs', t);
  for (const v of list(s.volumes_from)) opt('--volumes-from', v);

  if (s.network_mode) opt('--network', s.network_mode);
  else if (s.networks !== undefined) {
    const names = isObj(s.networks) ? Object.keys(s.networks) : list(s.networks).map(str);
    for (const n of names) {
      const cfg = isObj(s.networks) && isObj(s.networks[n]) ? s.networks[n] : {};
      const topCfg = top.networks[n];
      const real = isObj(topCfg) && topCfg.name ? str(topCfg.name) : n;
      if (n !== 'default') networks.push(n);
      opt('--network', real);
      for (const a of list(cfg.aliases)) opt('--network-alias', a);
      if (cfg.ipv4_address) opt('--ip', cfg.ipv4_address);
    }
    if (names.length > 1) note('Several --network flags need Docker 25 or newer (older versions attach only one network at run time).');
  }
  if (s.mac_address) opt('--mac-address', s.mac_address);
  for (const [k, v] of pairs(s.extra_hosts)) opt('--add-host', v === null ? k : `${k}:${v}`);
  for (const d of list(s.dns)) opt('--dns', d);
  for (const d of list(s.dns_search)) opt('--dns-search', d);
  for (const d of list(s.dns_opt)) opt('--dns-option', d);
  for (const l of list(s.links)) opt('--link', l);
  for (const c of list(s.cap_add)) opt('--cap-add', c);
  for (const c of list(s.cap_drop)) opt('--cap-drop', c);
  if (s.privileged) opt('--privileged');
  for (const d of list(s.devices)) opt('--device', isObj(d) ? `${str(d.source)}:${str(d.target ?? d.source)}` : d);
  for (const g of list(s.group_add)) opt('--group-add', g);
  for (const g of list(s.security_opt)) opt('--security-opt', g);
  for (const [k, v] of pairs(s.sysctls)) opt('--sysctl', `${k}=${v ?? ''}`);
  if (isObj(s.ulimits))
    for (const [k, v] of Object.entries(s.ulimits)) opt('--ulimit', isObj(v) ? `${k}=${str(v.soft)}:${str(v.hard)}` : `${k}=${str(v)}`);
  if (s.shm_size) opt('--shm-size', s.shm_size);
  if (s.pid) opt('--pid', s.pid);
  if (s.ipc) opt('--ipc', s.ipc);
  if (s.uts) opt('--uts', s.uts);
  if (s.runtime) opt('--runtime', s.runtime);
  if (s.platform) opt('--platform', s.platform);
  if (s.stop_signal) opt('--stop-signal', s.stop_signal);
  if (s.stop_grace_period) {
    const secs = toSeconds(str(s.stop_grace_period));
    if (secs === null) warn(`${name}: stop_grace_period "${str(s.stop_grace_period)}" couldn't be read and was skipped.`);
    else opt('--stop-timeout', secs);
  }
  if (s.cgroup_parent) opt('--cgroup-parent', s.cgroup_parent);
  if (s.userns_mode) opt('--userns', s.userns_mode);
  if (s.cpuset) opt('--cpuset-cpus', s.cpuset);
  if (s.memswap_limit) opt('--memory-swap', s.memswap_limit);
  if (s.pids_limit) opt('--pids-limit', s.pids_limit);
  if (s.oom_score_adj) opt('--oom-score-adj', s.oom_score_adj);
  if (s.cpu_shares) opt('--cpu-shares', s.cpu_shares);
  if (s.pull_policy) {
    const pol = str(s.pull_policy);
    if (['always', 'missing', 'never'].includes(pol)) opt('--pull', pol);
    else if (pol === 'if_not_present') opt('--pull', 'missing');
    else warn(`${name}: pull_policy "${pol}" has no docker run equivalent and was skipped.`);
  }
  if (s.init) opt('--init');
  if (s.read_only) opt('--read-only');
  if (isObj(s.logging)) {
    if (s.logging.driver) opt('--log-driver', s.logging.driver);
    for (const [k, v] of pairs(s.logging.options)) opt('--log-opt', `${k}=${v ?? ''}`);
  }

  // Health check.
  if (isObj(s.healthcheck)) {
    const h = s.healthcheck;
    const test = h.test;
    if (h.disable || (Array.isArray(test) && test[0] === 'NONE')) opt('--no-healthcheck');
    else {
      if (Array.isArray(test)) {
        const [kind, ...rest] = test.map(str);
        opt('--health-cmd', kind === 'CMD-SHELL' ? rest.join(' ') : kind === 'CMD' ? rest.map(shellQuote).join(' ') : test.map(str).join(' '));
      } else if (test !== undefined) opt('--health-cmd', test);
      if (h.interval) opt('--health-interval', h.interval);
      if (h.timeout) opt('--health-timeout', h.timeout);
      if (h.retries !== undefined) opt('--health-retries', h.retries);
      if (h.start_period) opt('--health-start-period', h.start_period);
      if (h.start_interval) opt('--health-start-interval', h.start_interval);
    }
  }

  // Resources: deploy.resources wins over the older service-level keys.
  const deploy = isObj(s.deploy) ? s.deploy : {};
  const res = isObj(deploy.resources) ? deploy.resources : {};
  const limits = isObj(res.limits) ? res.limits : {};
  const reservations = isObj(res.reservations) ? res.reservations : {};
  const cpus = limits.cpus ?? s.cpus;
  if (cpus !== undefined) opt('--cpus', cpus);
  const memory = limits.memory ?? s.mem_limit;
  if (memory !== undefined) opt('--memory', memory);
  const reserved = reservations.memory ?? s.mem_reservation;
  if (reserved !== undefined) opt('--memory-reservation', reserved);
  for (const d of list(reservations.devices)) {
    if (isObj(d) && list(d.capabilities).includes('gpu')) opt('--gpus', d.device_ids ? `"device=${list(d.device_ids).map(str).join(',')}"` : (d.count ?? 'all'));
  }
  if (limits.pids !== undefined) opt('--pids-limit', limits.pids);
  for (const k of Object.keys(deploy)) if (k !== 'resources') warn(`${name}: deploy.${k} only applies to Swarm or Compose scaling and was ignored.`);

  // Image, entrypoint and command.
  let image = typeof s.image === 'string' ? s.image : '';
  if (!image) {
    image = name;
    if (s.build !== undefined) warn(`${name}: this service uses build. Build it first (docker build -t ${name} <context>); the command below runs the image under that name.`);
    else warn(`${name}: no image is set.`);
  } else if (s.build !== undefined) warn(`${name}: build was ignored; the command runs the image ${image}.`);

  const words = (v: unknown): string[] =>
    Array.isArray(v) ? v.map(str) : typeof v === 'string' ? tokenizeShell(v).words.filter((w) => !w.operator).map((w) => w.value) : [];
  const command: string[] = [];
  if (s.entrypoint !== undefined) {
    const ep = words(s.entrypoint);
    if (!ep.length) opt('--entrypoint', '');
    else {
      opt('--entrypoint', ep[0]);
      command.push(...ep.slice(1));
    }
  }
  command.push(...words(s.command));

  for (const k of Object.keys(s)) if (!HANDLED.has(k) && !k.startsWith('x-')) warn(`${name}: "${k}" has no docker run equivalent and was ignored.`);
  if (s.depends_on !== undefined) note('depends_on only controls start order. The commands are listed in that order, but docker run does not wait for a service to be healthy.');
  return { args, image, command, networks };
}

export async function composeToRun(input: string, opts: ComposeToRunOptions = DEFAULT_RUN_OPTIONS): Promise<ToRunResult> {
  const warnings: string[] = [];
  const notes: string[] = [];
  const warn = (m: string) => !warnings.includes(m) && warnings.push(m);
  const note = (m: string) => !notes.includes(m) && notes.push(m);
  const fail = (error: string): ToRunResult => ({ commands: '', warnings, notes, services: 0, error });
  if (!input.trim()) return { commands: '', warnings, notes, services: 0 };

  const { parse } = await import('yaml');
  let doc: unknown;
  try {
    doc = parse(input, { merge: true, maxAliasCount: 100 });
  } catch (e) {
    return fail(`Invalid YAML: ${(e as Error).message.split('\n')[0]}`);
  }
  if (!isObj(doc)) return fail('Expected a Compose file with a `services:` section (or a single service).');

  let services: Svc[];
  if (isObj(doc.services)) {
    services = Object.entries(doc.services).flatMap(([name, def]): Svc[] => {
      if (!isObj(def)) {
        warn(`Service "${name}" is empty and was skipped.`);
        return [];
      }
      return [{ name, def }];
    });
  } else if (doc.image !== undefined || doc.build !== undefined) services = [{ name: str(doc.container_name ?? 'app'), def: doc }];
  else return fail('No `services:` section found. Paste a Compose file or a single service definition.');
  if (!services.length) return fail('The Compose file has no services.');

  const top = { networks: isObj(doc.networks) ? doc.networks : {} };
  const ordered = order(services);
  if (ordered.some((s, i) => s.name !== services[i].name)) note('Services are listed in dependency order, which differs from the file order.');
  const blocks: string[] = [];
  const toCreate = new Set<string>();
  for (const svc of ordered) {
    const { args, image, command, networks } = serviceArgs(svc.name, svc.def, top, warn, note, opts);
    for (const n of networks) {
      const cfg = top.networks[n];
      if (!(isObj(cfg) && cfg.external)) toCreate.add(isObj(cfg) && cfg.name ? str(cfg.name) : n);
    }
    const parts = [...args.map((a) => (a[1] === undefined ? a[0] : `${a[0]} ${shellQuote(a[1])}`)), shellQuote(image), ...command.map(shellQuote)];
    const text = opts.multiline && parts.length > 1 ? `docker run ${parts[0]} \\\n  ${parts.slice(1).join(' \\\n  ')}` : `docker run ${parts.join(' ')}`;
    blocks.push(`${ordered.length > 1 ? `# ${svc.name}\n` : ''}${text}`);
  }
  const prefix = [...toCreate].map((n) => `docker network create ${shellQuote(n)}`);
  return { commands: [...(prefix.length ? [prefix.join('\n')] : []), ...blocks].join('\n\n') + '\n', warnings, notes, services: ordered.length };
}
