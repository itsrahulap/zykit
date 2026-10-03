// Identifier casing and keyword handling shared by the language renderers.

export type Casing = 'camel' | 'pascal' | 'snake' | 'original';

/** Splits "userID", "user_id", "user-id" and "UserId" into lower-case words. */
export function words(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

const upper = (w: string) => w[0].toUpperCase() + w.slice(1);

/** Initialisms Go style keeps upper-case ("ID", "URL"). */
const INITIALISMS = new Set(['id', 'url', 'uri', 'api', 'http', 'https', 'html', 'json', 'xml', 'sql', 'ip', 'uuid', 'ui', 'cpu', 'ssh', 'tcp', 'udp', 'tls', 'ttl', 'uid', 'os', 'dns', 'css', 'rpc']);

export function applyCase(key: string, casing: Casing, opts: { goInitialisms?: boolean } = {}): string {
  const ws = words(key);
  let name: string;
  if (casing === 'original') name = key.replace(/[^A-Za-z0-9_]/g, '_');
  else if (!ws.length) name = 'field';
  else if (casing === 'snake') name = ws.join('_');
  else {
    const part = (w: string) => (opts.goInitialisms && INITIALISMS.has(w) ? w.toUpperCase() : upper(w));
    name = casing === 'pascal' ? ws.map(part).join('') : ws[0] + ws.slice(1).map(upper).join('');
  }
  return /^\d/.test(name) ? `_${name}` : name || 'field';
}

/** Appends `_` to a reserved word, and numbers duplicates so every field in a struct is unique. */
export function uniqueNames(keys: string[], make: (key: string) => string, reserved: Set<string>): string[] {
  const seen = new Set<string>();
  return keys.map((key) => {
    let name = make(key);
    if (reserved.has(name)) name += '_';
    const base = name;
    for (let n = 2; seen.has(name); n++) name = `${base}${n}`;
    seen.add(name);
    return name;
  });
}
