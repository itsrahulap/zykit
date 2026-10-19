// Pure logic for nginx Config Generator: builds an nginx.conf from options. No DOM, so it is unit-testable in Node.

export type Preset = 'static' | 'spa' | 'proxy' | 'php' | 'redirect';
export type RedirectMode = 'https' | 'to-www' | 'from-www' | 'domain';
export type LbMethod = 'round-robin' | 'least_conn' | 'ip_hash';

export interface NginxOptions {
  preset: Preset;
  serverName: string;
  root: string;
  tls: boolean;
  http2: boolean;
  http3: boolean;
  certPath: string;
  keyPath: string;
  hsts: boolean;
  gzip: boolean;
  cache: boolean;
  maxBody: string;
  securityHeaders: boolean;
  rateLimit: boolean;
  rateLimitRate: number;
  websocket: boolean;
  logs: boolean;
  /** One upstream per line, as `host:port` or `unix:/path`. */
  upstreams: string;
  lbMethod: LbMethod;
  phpSocket: string;
  redirectMode: RedirectMode;
  redirectDomain: string;
}

export const DEFAULT_OPTIONS: NginxOptions = {
  preset: 'static',
  serverName: 'example.com www.example.com',
  root: '/var/www/example.com/html',
  tls: true,
  http2: true,
  http3: false,
  certPath: '/etc/letsencrypt/live/example.com/fullchain.pem',
  keyPath: '/etc/letsencrypt/live/example.com/privkey.pem',
  hsts: true,
  gzip: true,
  cache: true,
  maxBody: '10m',
  securityHeaders: true,
  rateLimit: false,
  rateLimitRate: 10,
  websocket: false,
  logs: true,
  upstreams: '127.0.0.1:3000',
  lbMethod: 'round-robin',
  phpSocket: 'unix:/run/php/php8.3-fpm.sock',
  redirectMode: 'https',
  redirectDomain: 'https://new.example.com',
};

export interface NginxResult {
  config: string;
  warnings: string[];
}

// Values go straight into the config, so anything that could end a directive or open a block is refused.
const SAFE = /^[A-Za-z0-9_.:\-/*~@%+=[\]]+$/;
const SIZE = /^\d+[kKmMgG]?$/;
const isSafe = (v: string) => SAFE.test(v);

/** `server_name` list: space-separated names; wildcard/regex characters allowed, nothing that breaks the directive. */
export function splitNames(v: string): string[] {
  return v.split(/\s+/).filter(Boolean);
}

const HOST = /^(\*\.)?[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*(\.\*)?$/;

/** A server_name entry nginx accepts: a hostname (optionally with a leading `*.` or trailing `.*`), an IP, `_`, or a `~regex`. */
export function validServerName(n: string): boolean {
  return n === '_' || n.startsWith('~') || HOST.test(n) || /^\[[0-9a-fA-F:.]+\]$/.test(n);
}

/** An upstream address: `unix:/path`, or a host / IPv4 / [IPv6] with an optional port from 1 to 65535. */
export function validUpstream(u: string): boolean {
  if (u.startsWith('unix:')) return /^unix:\/\S+$/.test(u);
  const m = /^(\[[0-9a-fA-F:.]+\]|[^:\s]+)(?::(\d{1,5}))?$/.exec(u);
  if (!m || !(m[1].startsWith('[') || HOST.test(m[1]))) return false;
  return m[2] === undefined || (Number(m[2]) >= 1 && Number(m[2]) <= 65535);
}

export function parseUpstreams(v: string): string[] {
  return v.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
}

const slug = (name: string) => name.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'app';

const SEC_HEADERS = [
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'SAMEORIGIN'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
] as const;

export function generate(o: NginxOptions): NginxResult {
  const warnings: string[] = [];
  const names = splitNames(o.serverName).filter((n) => {
    if (!isSafe(n)) warnings.push(`Ignored server name "${n}": it contains characters nginx would read as syntax.`);
    else if (!validServerName(n)) warnings.push(`Ignored server name "${n}": use a hostname such as example.com, *.example.com or a ~regex.`);
    else return true;
    return false;
  });
  if (!names.length) names.push('_');
  const primary = names[0] === '_' ? 'app' : names[0];
  const sn = names.join(' ');
  const needRoot = o.preset === 'static' || o.preset === 'spa' || o.preset === 'php';
  let root = o.root.trim();
  if (needRoot && !(root.startsWith('/') && isSafe(root))) {
    warnings.push('The document root must be an absolute path without spaces or quotes; /var/www/html was used.');
    root = '/var/www/html';
  }
  const tls = o.tls;
  let cert = o.certPath.trim();
  let key = o.keyPath.trim();
  if (tls && o.preset !== 'redirect' && !(isSafe(cert) && isSafe(key) && cert && key)) {
    warnings.push('Certificate and key paths must be set and contain no spaces or quotes; placeholders were used.');
    cert = '/etc/ssl/certs/example.pem';
    key = '/etc/ssl/private/example.key';
  }
  let maxBody = o.maxBody.trim();
  if (maxBody && !SIZE.test(maxBody)) {
    warnings.push('client_max_body_size must look like 10m, 512k, 1g or 0; it was left out.');
    maxBody = '';
  }
  const ups = parseUpstreams(o.upstreams).filter((u) => {
    const ok = isSafe(u) && validUpstream(u);
    if (!ok) warnings.push(`Ignored upstream "${u}": use host:port (port 1–65535), [IPv6]:port or unix:/path.`);
    return ok;
  });
  if (o.preset === 'proxy' && !ups.length) {
    warnings.push('Add at least one upstream; 127.0.0.1:3000 was used.');
    ups.push('127.0.0.1:3000');
  }
  const up = `${slug(primary)}_backend`;
  const zone = `${slug(primary)}_limit`;
  const out: string[] = ['# nginx.conf (http context): generated by Zykit nginx Config Generator.', '# Save as /etc/nginx/conf.d/' + primary + '.conf, then run: nginx -t && nginx -s reload', ''];
  const add = (...l: string[]) => out.push(...l);
  const loc = (path: string, body: string[], indent = '    ') => {
    add(`${indent}location ${path} {`, ...body.map((b) => (b ? `${indent}    ${b}` : b)), `${indent}}`);
  };

  if (o.preset === 'proxy') {
    add('# Backends. Add "weight=3" or "backup" after an address to tune the balancing.');
    add(`upstream ${up} {`);
    if (o.lbMethod !== 'round-robin' && ups.length > 1) add(`    ${o.lbMethod};`);
    for (const u of ups) add(`    server ${u};`);
    if (ups.length === 1) add('    keepalive 16;');
    add('}', '');
  }
  if (o.websocket && o.preset === 'proxy') {
    add('# Sends "Connection: upgrade" only when the client asked for a WebSocket.', 'map $http_upgrade $connection_upgrade {', '    default upgrade;', "    ''      close;", '}', '');
  }
  if (o.rateLimit && o.preset !== 'redirect') {
    add(`# Allow ${o.rateLimitRate} requests per second per client IP (bursts are handled below).`, `limit_req_zone $binary_remote_addr zone=${zone}:10m rate=${Math.max(1, Math.round(o.rateLimitRate))}r/s;`, '');
  }

  // Redirect-only preset: one or two small server blocks.
  if (o.preset === 'redirect') {
    const target = o.redirectDomain.trim();
    const listenTls = o.tls && o.redirectMode !== 'https';
    const base = names.find((n) => !n.startsWith('www.')) ?? primary.replace(/^www\./, '');
    let from = sn;
    let to = '$scheme://$host$request_uri';
    if (o.redirectMode === 'https') to = 'https://$host$request_uri';
    if (o.redirectMode === 'to-www') {
      from = base;
      to = `${listenTls ? 'https' : '$scheme'}://www.${base}$request_uri`;
    }
    if (o.redirectMode === 'from-www') {
      from = `www.${base}`;
      to = `${listenTls ? 'https' : '$scheme'}://${base}$request_uri`;
    }
    if (o.redirectMode === 'domain') {
      if (!/^https?:\/\/[A-Za-z0-9.\-:]+$/.test(target)) {
        warnings.push('The target must look like https://new.example.com (no path); it was left as a placeholder.');
        to = 'https://new.example.com$request_uri';
      } else to = `${target}$request_uri`;
      from = sn;
    }
    add(`# Permanent (301) redirect: ${{ https: 'HTTP to HTTPS', 'to-www': 'bare domain to www', 'from-www': 'www to bare domain', domain: 'to another domain' }[o.redirectMode]}.`);
    add('server {', '    listen 80;', '    listen [::]:80;', `    server_name ${from};`, `    return 301 ${to};`, '}');
    if (listenTls) {
      add('', 'server {', `    listen 443 ssl;`, '    listen [::]:443 ssl;');
      if (o.http2) add('    http2 on;');
      add(`    server_name ${from};`, `    ssl_certificate ${cert};`, `    ssl_certificate_key ${key};`, `    return 301 ${to};`, '}');
    }
    return { config: out.join('\n') + '\n', warnings };
  }

  if (tls) {
    add('# Plain HTTP: ACME challenges stay open, everything else goes to HTTPS.', 'server {', '    listen 80;', '    listen [::]:80;', `    server_name ${sn};`, '');
    loc('/.well-known/acme-challenge/', [`root ${root || '/var/www/html'};`]);
    add('', '    location / {', '        return 301 https://$host$request_uri;', '    }', '}', '');
  }

  add('server {');
  if (tls) {
    add('    listen 443 ssl;', '    listen [::]:443 ssl;');
    if (o.http2) add('    http2 on;');
    if (o.http3) add('    listen 443 quic reuseport;', '    listen [::]:443 quic reuseport;', '    add_header Alt-Svc \'h3=":443"; ma=86400\' always;');
  } else add('    listen 80;', '    listen [::]:80;');
  add(`    server_name ${sn};`);
  if (needRoot) add(`    root ${root};`, `    index ${o.preset === 'php' ? 'index.php index.html' : 'index.html'};`);
  if (tls) {
    add('', `    ssl_certificate ${cert};`, `    ssl_certificate_key ${key};`, '    ssl_protocols TLSv1.2 TLSv1.3;', '    ssl_prefer_server_ciphers off;', '    ssl_session_cache shared:SSL:10m;', '    ssl_session_timeout 1d;', '    ssl_session_tickets off;');
    if (o.hsts) add('    # HSTS: browsers will refuse plain HTTP for a year. Test with a short max-age first.', '    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;');
  }
  if (o.securityHeaders) {
    add('', '    # Security headers. A Content-Security-Policy is site-specific: build one with the CSP Builder tool.');
    for (const [k, v] of SEC_HEADERS) add(`    add_header ${k} "${v}" always;`);
  }
  if (maxBody) add('', `    client_max_body_size ${maxBody};`);
  if (o.gzip) {
    add('', '    gzip on;', '    gzip_comp_level 5;', '    gzip_min_length 1024;', '    gzip_vary on;', '    gzip_proxied any;', '    gzip_types text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml;', '    # Brotli needs the ngx_brotli module; if installed, add "brotli on;" and "brotli_types ...;" here.');
  }
  if (o.logs) add('', `    access_log /var/log/nginx/${slug(primary)}.access.log;`, `    error_log /var/log/nginx/${slug(primary)}.error.log warn;`);
  add('');
  const limit = o.rateLimit ? [`limit_req zone=${zone} burst=${Math.max(1, Math.round(o.rateLimitRate)) * 2} nodelay;`] : [];

  if (o.preset === 'static' || o.preset === 'spa') {
    if (o.cache) {
      loc('~* \\.(?:css|js|mjs|woff2?|ttf|svg|ico|png|jpe?g|gif|webp|avif)$', ['expires 30d;', 'add_header Cache-Control "public, immutable";', ...(o.securityHeaders ? ['# add_header in a location replaces the server-level ones; repeat them here if needed.'] : []), 'access_log off;']);
      add('');
    }
    loc('/', [o.preset === 'spa' ? 'try_files $uri $uri/ /index.html;' : 'try_files $uri $uri/ =404;', ...limit]);
    if (o.preset === 'spa' && o.cache) add('    # index.html is not matched by the cache rule above, so new deploys show up at once.');
  }
  if (o.preset === 'php') {
    loc('/', ['try_files $uri $uri/ /index.php?$query_string;', ...limit]);
    add('');
    loc('~ \\.php$', ['include fastcgi_params;', 'fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;', `fastcgi_pass ${isSafe(o.phpSocket.trim()) ? o.phpSocket.trim() : 'unix:/run/php/php-fpm.sock'};`, 'fastcgi_index index.php;']);
    add('');
    loc('~ /\\.(?!well-known)', ['deny all;']);
    if (o.cache) {
      add('');
      loc('~* \\.(?:css|js|woff2?|svg|ico|png|jpe?g|gif|webp|avif)$', ['expires 30d;', 'access_log off;']);
    }
  }
  if (o.preset === 'proxy') {
    const ws = o.websocket;
    loc('/', [
      `proxy_pass http://${up};`,
      'proxy_http_version 1.1;',
      'proxy_set_header Host $host;',
      'proxy_set_header X-Real-IP $remote_addr;',
      'proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
      'proxy_set_header X-Forwarded-Proto $scheme;',
      ...(ws ? ['proxy_set_header Upgrade $http_upgrade;', 'proxy_set_header Connection $connection_upgrade;', 'proxy_read_timeout 3600s; # keep idle WebSockets open'] : ['proxy_set_header Connection "";']),
      ...limit,
    ]);
  }
  add('}');
  return { config: out.join('\n') + '\n', warnings };
}

export interface LintIssue {
  /** 1-based line, or 0 for the whole file. */
  line: number;
  message: string;
}

/**
 * Quick checks for common mistakes in a config (generated or edited by hand). Not a parser: it
 * reads lines and braces, so it can miss problems; `nginx -t` is the real test.
 */
export function lintConfig(text: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = text.split(/\r?\n/);
  // Each open block: its header line and the directives seen in it.
  const stack: { head: string; line: number; body: string[] }[] = [];
  const blocks: { head: string; line: number; body: string[] }[] = [];
  lines.forEach((raw, i) => {
    const line = raw.replace(/(^|\s)#.*$/, '').trim();
    if (!line) return;
    if (!/[;{}]$/.test(line)) issues.push({ line: i + 1, message: 'This line doesn’t end with “;”, “{” or “}”. A missing semicolon makes nginx read the next line as part of this directive.' });
    for (const part of line.split(/(?<=[{};])/)) {
      const t = part.trim();
      if (t.endsWith('{')) stack.push({ head: t.slice(0, -1).trim(), line: i + 1, body: [] });
      else if (t === '}') {
        const b = stack.pop();
        if (!b) issues.push({ line: i + 1, message: 'This “}” has no matching “{”.' });
        else blocks.push(b);
      } else if (t) stack.at(-1)?.body.push(t);
    }
  });
  for (const b of stack) issues.push({ line: b.line, message: `The block “${b.head}” is never closed with “}”.` });

  for (const b of blocks) {
    const has = (re: RegExp) => b.body.some((d) => re.test(d));
    if (has(/^proxy_pass\s/) && !has(/^proxy_set_header\s+Host\s/i)) {
      issues.push({ line: b.line, message: `“${b.head}” proxies without “proxy_set_header Host $host;”, so the backend sees the upstream name instead of the site’s hostname.` });
    }
    if (has(/^(proxy_pass|fastcgi_pass)\s/) && has(/^expires\s|immutable/)) {
      issues.push({ line: b.line, message: `“${b.head}” caches responses from a backend for a long time. Dynamic pages usually shouldn’t be cached like static files.` });
    }
    if (b.head.startsWith('server') && has(/^ssl_protocols\s.*\b(SSLv[23]|TLSv1|TLSv1\.1)\b(?!\.)/)) {
      issues.push({ line: b.line, message: 'ssl_protocols allows SSL or TLS 1.0/1.1, which are insecure and disabled by modern browsers. Use “TLSv1.2 TLSv1.3”.' });
    }
    if (b.head.startsWith('server') && has(/^index\s.*index\.html/) && !has(/^(proxy_pass|fastcgi_pass)\s/)) {
      const root = blocks.find((x) => x.head === 'location /' && x.line > b.line);
      if (root && !root.body.some((d) => /^(try_files|return|proxy_pass)\s/.test(d))) {
        issues.push({ line: root.line, message: '“location /” has no try_files. For a single-page app, add “try_files $uri $uri/ /index.html;” or client-side routes will 404 on reload.' });
      }
    }
  }
  return issues.sort((a, b) => a.line - b.line);
}
