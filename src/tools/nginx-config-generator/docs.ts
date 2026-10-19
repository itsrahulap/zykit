// User docs for nginx Config Generator, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose a **preset**: Static site, SPA (unknown paths fall back to `index.html`), Reverse proxy, PHP-FPM, or Redirect.',
    'Fill in the `server_name`, the document root or upstreams, and turn on the options you want: HTTPS with HTTP/2 or HTTP/3, HSTS, gzip, asset caching, security headers, rate limiting, WebSocket headers and logs.',
    'Read any **warnings** and **Possible problems** under the output. Edit the config right in the output box if you need to (**Reset to generated** undoes your edits), then copy it or download it as `nginx.conf`.',
    'Put it in `/etc/nginx/conf.d/` (or `sites-available`), run `nginx -t` to check it, then `nginx -s reload`.',
  ],
  howItWorks:
    'A small function in the page builds the config as plain text from your options, so it updates as you type. Each preset has its own `location` blocks:\n\n' +
    '- Static sites use `try_files $uri $uri/ =404`.\n' +
    '- SPAs fall back to `/index.html`.\n' +
    '- PHP passes `.php` to `fastcgi_pass`.\n' +
    '- The reverse proxy writes an `upstream` block (round robin, `least_conn` or `ip_hash`) and the usual `Host`, `X-Real-IP`, `X-Forwarded-For` and `X-Forwarded-Proto` headers.\n\n' +
    'With HTTPS on, a separate port-80 server keeps the ACME challenge path open and redirects everything else with a 301. TLS is limited to TLSv1.2 and TLSv1.3.\n\n' +
    'Values you type are checked before they are written, so a quote, semicolon or brace can’t end a directive or open a new block. Server names must be hostnames (`*.example.com`, `example.*`, an IP, `_` or a `~regex`), and upstreams must be `host:port` with a port from 1 to 65535, `[IPv6]:port` or `unix:/path`.\n\n' +
    'Whatever is in the output box, generated or edited, is checked for common mistakes: a line missing its semicolon, unbalanced braces, a `proxy_pass` without `proxy_set_header Host`, long caching on a location that passes to a backend, `ssl_protocols` allowing SSL or TLS 1.0/1.1, and a site with `index.html` whose `location /` has no `try_files` (needed for single-page apps).',
  limits: [
    'The config is generated, not tested: nginx never runs here. The mistake checks read lines and braces, not nginx’s full grammar, so they can miss problems. Always check the config with `nginx -t` on your server.',
    'Edits you make in the output box are kept when you change options, but they aren’t merged with the new output: press **Reset to generated** to start again. Edits aren’t included in share links.',
    'Output is one `server` block (plus an optional `upstream`, `map` and `limit_req_zone` in the `http` context), meant for `conf.d`, not a complete `nginx.conf` with `events` and `http`.',
    'Brotli needs the `ngx_brotli` module, so only a comment is written. HTTP/3 needs nginx 1.25 or newer built with QUIC, and UDP port 443 open.',
    '`http2 on;` needs nginx 1.25.1 or newer; on older versions put `http2` after `ssl` on the `listen` line.',
    'Values containing spaces or characters nginx treats as syntax (quotes, `;`, `{`, `}`, `$`) are refused with a warning. No Content-Security-Policy is generated; use the CSP Builder.',
  ],
  privacy: 'Everything is generated in your browser; nothing you type is uploaded or stored. **Share** copies a link with your options in the URL’s `#` fragment, which browsers don’t send to servers.',
  faqs: [
    { question: 'Why is there a second server block on port 80?', answer: 'With HTTPS on, port 80 only serves the Let’s Encrypt challenge path and sends everything else to HTTPS with a 301 redirect.' },
    { question: 'Why are security headers missing inside my asset location?', answer: 'In nginx, `add_header` in a `location` replaces the ones inherited from the server block. Repeat the headers there if you need them on cached assets.' },
    { question: 'Should I turn HSTS on?', answer: 'Only once HTTPS works for the whole site. Browsers remember HSTS for a year (the generated `max-age`), so a broken certificate cannot be bypassed.' },
    { question: 'How do WebSocket headers work?', answer: 'The proxy sends `Upgrade` and a `Connection` value from a `map` block, so normal requests keep their connection handling and WebSocket requests are upgraded. The read timeout is raised to one hour.' },
  ],
};

export default docs;
