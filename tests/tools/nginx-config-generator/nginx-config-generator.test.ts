import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS, generate, lintConfig, validServerName, validUpstream, type NginxOptions } from '../../../src/tools/nginx-config-generator/features/nginx-config-generator';

const gen = (o: Partial<NginxOptions>) => generate({ ...DEFAULT_OPTIONS, ...o });

describe('nginx Config Generator', () => {
  it('static site with TLS, HSTS, gzip, caching and headers', () => {
    const { config, warnings } = gen({});
    expect(warnings).toEqual([]);
    expect(config).toContain('server_name example.com www.example.com;');
    expect(config).toContain('listen 443 ssl;');
    expect(config).toContain('http2 on;');
    expect(config).toContain('ssl_protocols TLSv1.2 TLSv1.3;');
    expect(config).toContain('Strict-Transport-Security');
    expect(config).toContain('gzip on;');
    expect(config).toContain('try_files $uri $uri/ =404;');
    expect(config).toContain('expires 30d;');
    expect(config).toContain('X-Content-Type-Options');
    expect(config).toContain('return 301 https://$host$request_uri;');
    expect(config).toContain('CSP Builder');
  });

  it('plain HTTP static site has no TLS directives', () => {
    const { config } = gen({ tls: false });
    expect(config).toContain('listen 80;');
    expect(config).not.toContain('ssl_certificate');
    expect(config).not.toContain('Strict-Transport-Security');
  });

  it('SPA falls back to index.html', () => {
    expect(gen({ preset: 'spa' }).config).toContain('try_files $uri $uri/ /index.html;');
  });

  it('reverse proxy with load balancing, websockets and rate limit', () => {
    const { config } = gen({ preset: 'proxy', upstreams: '10.0.0.1:3000\n10.0.0.2:3000', lbMethod: 'least_conn', websocket: true, rateLimit: true, rateLimitRate: 5 });
    expect(config).toContain('upstream example_com_backend {');
    expect(config).toContain('least_conn;');
    expect(config).toContain('server 10.0.0.2:3000;');
    expect(config).toContain('proxy_pass http://example_com_backend;');
    expect(config).toContain('proxy_set_header Upgrade $http_upgrade;');
    expect(config).toContain('map $http_upgrade $connection_upgrade');
    expect(config).toContain('limit_req_zone $binary_remote_addr zone=example_com_limit:10m rate=5r/s;');
    expect(config).toContain('limit_req zone=example_com_limit burst=10 nodelay;');
  });

  it('PHP-FPM passes .php to the socket', () => {
    const { config } = gen({ preset: 'php' });
    expect(config).toContain('fastcgi_pass unix:/run/php/php8.3-fpm.sock;');
    expect(config).toContain('index index.php index.html;');
  });

  it('redirect presets', () => {
    expect(gen({ preset: 'redirect', redirectMode: 'https' }).config).toContain('return 301 https://$host$request_uri;');
    const www = gen({ preset: 'redirect', redirectMode: 'to-www', tls: false }).config;
    expect(www).toContain('server_name example.com;');
    expect(www).toContain('return 301 $scheme://www.example.com$request_uri;');
    expect(gen({ preset: 'redirect', redirectMode: 'from-www' }).config).toContain('server_name www.example.com;');
    expect(gen({ preset: 'redirect', redirectMode: 'domain', redirectDomain: 'https://new.test' }).config).toContain('return 301 https://new.test$request_uri;');
  });

  it('refuses values that could inject directives', () => {
    const { config, warnings } = gen({ serverName: 'a.com; } server { listen 1', root: '/x;}', maxBody: '1m;' });
    expect(warnings.length).toBeGreaterThanOrEqual(3);
    expect(config).not.toContain('} server {');
    expect(config).not.toContain('/x;}');
    expect(config).toContain('server_name server listen 1;');
  });
});

describe('input validation', () => {
  it('accepts real hostnames and rejects junk', () => {
    for (const n of ['example.com', 'www.example.com', '*.example.com', 'example.*', '_', '~^(www\\.)?ex\\.com$', 'localhost', '[::1]']) expect(validServerName(n), n).toBe(true);
    for (const n of ['-bad.com', 'a..b', 'ex/ample', 'user@host']) expect(validServerName(n), n).toBe(false);
    expect(gen({ serverName: 'example.com user@host' }).warnings.join(' ')).toMatch(/Ignored server name "user@host"/);
  });
  it('checks upstream host:port', () => {
    for (const u of ['127.0.0.1:3000', 'api.internal:8080', 'backend', '[::1]:9000', 'unix:/run/app.sock']) expect(validUpstream(u), u).toBe(true);
    for (const u of ['127.0.0.1:0', 'host:70000', 'host:abc', 'unix:', 'a:b:c', 'http://x:1']) expect(validUpstream(u), u).toBe(false);
    const r = gen({ preset: 'proxy', upstreams: '127.0.0.1:3000\nhost:99999' });
    expect(r.warnings.join(' ')).toMatch(/Ignored upstream "host:99999"/);
    expect(r.config).not.toContain('99999');
  });
  it('never lets a value inject a directive', () => {
    const r = gen({ preset: 'proxy', serverName: 'a.com;evil', upstreams: '1.2.3.4:80; include /etc/passwd', root: '/x;y', maxBody: '1m; return 200' });
    expect(r.config).not.toMatch(/evil|passwd|return 200/);
  });
});

describe('lintConfig', () => {
  it('finds nothing wrong in any generated config', () => {
    const presets = ['static', 'spa', 'proxy', 'php', 'redirect'] as const;
    for (const preset of presets)
      for (const tls of [true, false])
        for (const extra of [{}, { websocket: true, rateLimit: true, http3: true }, { redirectMode: 'to-www' as const }]) {
          const { config } = gen({ preset, tls, ...extra });
          expect(lintConfig(config), `${preset} tls=${tls} ${JSON.stringify(extra)}`).toEqual([]);
        }
  });
  it('flags common mistakes with line numbers', () => {
    const msgs = (t: string) => lintConfig(t).map((i) => `${i.line}: ${i.message}`).join('\n');
    expect(msgs('server {\n  listen 80\n}')).toMatch(/^2: .*semicolon/);
    expect(msgs('server {\n  listen 80;\n')).toMatch(/never closed/);
    expect(msgs('}\n')).toMatch(/no matching/);
    expect(msgs('server {\n  location / {\n    proxy_pass http://b;\n  }\n}')).toMatch(/^2: .*proxy_set_header Host/);
    expect(msgs('server {\n  location /api {\n    proxy_pass http://b;\n    proxy_set_header Host $host;\n    expires 30d;\n  }\n}')).toMatch(/caches responses from a backend/);
    expect(msgs('server {\n  ssl_protocols TLSv1 TLSv1.2;\n}')).toMatch(/insecure/);
    expect(msgs('server {\n  ssl_protocols TLSv1.2 TLSv1.3;\n}')).toBe('');
    expect(msgs('server {\n  root /srv;\n  index index.html;\n  location / {\n    expires 1h;\n  }\n}')).toMatch(/^4: .*try_files/);
  });
});
