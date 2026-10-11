import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS, generate, type NginxOptions } from '../../../src/tools/nginx-config-generator/features/nginx-config-generator';

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
