// Plain-English explanations for common HTTP headers, keyed by lower-case name.

export type HeaderCategory = 'Security' | 'Caching' | 'CORS' | 'Content' | 'Cookies' | 'Connection' | 'Request' | 'Info' | 'Other';

export interface HeaderInfo {
  name: string;
  category: HeaderCategory;
  description: string;
  /** Where it normally appears. */
  on: 'response' | 'request' | 'both';
  deprecated?: boolean;
}

const h = (name: string, category: HeaderCategory, on: HeaderInfo['on'], description: string, deprecated?: boolean): [string, HeaderInfo] => [
  name.toLowerCase(),
  { name, category, on, description, deprecated },
];

export const HEADERS: Record<string, HeaderInfo> = Object.fromEntries([
  // Security
  h('Strict-Transport-Security', 'Security', 'response', 'HSTS: tells browsers to use HTTPS only for this host (and optionally subdomains) for max-age seconds.'),
  h('Content-Security-Policy', 'Security', 'response', 'Restricts where scripts, styles, images, frames and connections may load from. The main defence against XSS.'),
  h('Content-Security-Policy-Report-Only', 'Security', 'response', 'A CSP that only reports violations without blocking anything. Useful for testing a policy.'),
  h('X-Content-Type-Options', 'Security', 'response', '"nosniff" stops browsers guessing a different content type than the one declared.'),
  h('X-Frame-Options', 'Security', 'response', 'Controls whether the page may be shown in a frame (DENY / SAMEORIGIN). Superseded by CSP frame-ancestors.'),
  h('X-XSS-Protection', 'Security', 'response', "Controlled a legacy XSS filter that modern browsers removed. Best set to 0 or omitted.", true),
  h('Referrer-Policy', 'Security', 'response', 'How much of the current URL is sent in the Referer header when following links or loading resources.'),
  h('Permissions-Policy', 'Security', 'response', 'Turns browser features (camera, geolocation, microphone…) on or off for this page and its frames.'),
  h('Feature-Policy', 'Security', 'response', 'Old name of Permissions-Policy.', true),
  h('Cross-Origin-Opener-Policy', 'Security', 'response', 'COOP: isolates this window from cross-origin popups and openers.'),
  h('Cross-Origin-Embedder-Policy', 'Security', 'response', 'COEP: only allow cross-origin resources that explicitly opt in. Needed (with COOP) for cross-origin isolation.'),
  h('Cross-Origin-Resource-Policy', 'Security', 'response', 'CORP: which origins may embed this resource (same-origin, same-site, cross-origin).'),
  h('Expect-CT', 'Security', 'response', 'Asked browsers to enforce Certificate Transparency. Obsolete: CT is now always enforced.', true),
  h('Public-Key-Pins', 'Security', 'response', 'HTTP Public Key Pinning. Removed from browsers because a mistake could lock users out.', true),
  h('X-Permitted-Cross-Domain-Policies', 'Security', 'response', 'Controls whether Adobe Flash/Acrobat may load cross-domain policy files. Usually "none".'),
  h('Origin-Agent-Cluster', 'Security', 'response', 'Asks the browser to put this origin in its own agent cluster (process isolation hint).'),
  h('Clear-Site-Data', 'Security', 'response', 'Tells the browser to clear cookies, storage or cache for this site, e.g. on logout.'),
  h('WWW-Authenticate', 'Security', 'response', 'Sent with 401: says which authentication scheme to use (Basic, Bearer…).'),
  h('Authorization', 'Request', 'request', 'Credentials for the request (Basic, Bearer token…). Treat as a secret.'),
  h('Proxy-Authenticate', 'Security', 'response', 'Sent with 407: authentication scheme required by a proxy.'),
  h('Proxy-Authorization', 'Request', 'request', 'Credentials for a proxy.'),
  // Caching
  h('Cache-Control', 'Caching', 'both', 'Caching rules: who may store the response (private/public), for how long (max-age, s-maxage) and when to revalidate.'),
  h('Expires', 'Caching', 'response', 'Date after which the response is stale. Ignored when Cache-Control max-age is present.'),
  h('ETag', 'Caching', 'response', 'An identifier for this version of the resource, used to revalidate with If-None-Match.'),
  h('Last-Modified', 'Caching', 'response', 'When the resource last changed, used to revalidate with If-Modified-Since.'),
  h('Age', 'Caching', 'response', 'Seconds the response has been in a shared cache (CDN/proxy).'),
  h('Vary', 'Caching', 'response', 'Request headers that change the response; caches store a separate copy per value.'),
  h('Pragma', 'Caching', 'both', 'HTTP/1.0 cache control ("no-cache"). Superseded by Cache-Control.', true),
  h('If-None-Match', 'Request', 'request', 'Conditional request: only send the body if the ETag differs.'),
  h('If-Modified-Since', 'Request', 'request', 'Conditional request: only send the body if it changed after this date.'),
  h('If-Match', 'Request', 'request', 'Only perform the request if the ETag matches (prevents lost updates).'),
  h('If-Unmodified-Since', 'Request', 'request', 'Only perform the request if unchanged since this date.'),
  h('Surrogate-Control', 'Caching', 'response', 'Caching rules aimed only at CDNs / reverse proxies.'),
  h('CDN-Cache-Control', 'Caching', 'response', 'Cache-Control for CDNs only (RFC 9213), ignored by browsers.'),
  h('X-Cache', 'Info', 'response', 'Set by many CDNs: whether this response was a cache HIT or MISS.'),
  h('CF-Cache-Status', 'Info', 'response', 'Cloudflare cache result (HIT, MISS, DYNAMIC, BYPASS…).'),
  // CORS
  h('Access-Control-Allow-Origin', 'CORS', 'response', 'Which origin may read this response from JavaScript. "*" means any origin (but then no credentials).'),
  h('Access-Control-Allow-Credentials', 'CORS', 'response', '"true" lets cross-origin JavaScript read the response when cookies or auth were sent.'),
  h('Access-Control-Allow-Methods', 'CORS', 'response', 'Methods allowed for cross-origin requests (preflight response).'),
  h('Access-Control-Allow-Headers', 'CORS', 'response', 'Request headers allowed in cross-origin requests (preflight response).'),
  h('Access-Control-Expose-Headers', 'CORS', 'response', 'Response headers cross-origin JavaScript may read.'),
  h('Access-Control-Max-Age', 'CORS', 'response', 'How long (seconds) the browser may cache a preflight result.'),
  h('Access-Control-Request-Method', 'CORS', 'request', 'Sent in a preflight: the method the real request will use.'),
  h('Access-Control-Request-Headers', 'CORS', 'request', 'Sent in a preflight: the headers the real request will send.'),
  h('Origin', 'Request', 'request', 'The origin (scheme, host, port) that started the request.'),
  h('Timing-Allow-Origin', 'CORS', 'response', 'Origins allowed to see detailed Resource Timing data.'),
  // Content
  h('Content-Type', 'Content', 'both', 'Media type of the body (e.g. text/html) plus parameters such as charset.'),
  h('Content-Length', 'Content', 'both', 'Size of the body in bytes.'),
  h('Content-Encoding', 'Content', 'response', 'Compression applied to the body (gzip, br, zstd).'),
  h('Content-Language', 'Content', 'response', 'Natural language of the content.'),
  h('Content-Disposition', 'Content', 'response', 'Whether to show the body inline or download it as a file, and the file name.'),
  h('Content-Range', 'Content', 'response', 'Which part of the resource a 206 Partial Content response contains.'),
  h('Content-Location', 'Content', 'response', 'The direct URL of the returned representation.'),
  h('Accept-Ranges', 'Content', 'response', 'Whether range requests (resuming downloads) are supported: "bytes" or "none".'),
  h('Transfer-Encoding', 'Connection', 'response', 'How the body is framed on the wire (e.g. chunked). HTTP/1.1 only.'),
  h('Link', 'Content', 'response', 'Related resources: preload hints, canonical URL, pagination (rel="next").'),
  h('Location', 'Content', 'response', 'Where to go next: the redirect target (3xx) or the created resource (201).'),
  h('Refresh', 'Content', 'response', 'Reloads or redirects after a delay. Non-standard but widely supported.'),
  h('Retry-After', 'Content', 'response', 'How long to wait before retrying (503, 429) or following a redirect.'),
  h('Allow', 'Content', 'response', 'Methods the resource supports (sent with 405).'),
  h('Date', 'Info', 'response', 'When the response was generated.'),
  h('Accept', 'Request', 'request', 'Media types the client can handle.'),
  h('Accept-Encoding', 'Request', 'request', 'Compression the client supports.'),
  h('Accept-Language', 'Request', 'request', 'Preferred languages.'),
  h('Range', 'Request', 'request', 'Requests only part of a resource.'),
  // Cookies
  h('Set-Cookie', 'Cookies', 'response', 'Stores a cookie. Attributes control lifetime, scope and security (Secure, HttpOnly, SameSite).'),
  h('Cookie', 'Cookies', 'request', 'Cookies sent by the browser. Often contains session identifiers.'),
  // Connection
  h('Connection', 'Connection', 'both', 'Connection options for this hop (keep-alive, close, upgrade). Not used in HTTP/2+.'),
  h('Keep-Alive', 'Connection', 'both', 'Timeout and maximum requests for a persistent HTTP/1.1 connection.'),
  h('Upgrade', 'Connection', 'both', 'Switches protocol, e.g. to WebSocket.'),
  h('Alt-Svc', 'Connection', 'response', 'Advertises the same service on another protocol or port, e.g. HTTP/3 (h3).'),
  h('Host', 'Request', 'request', 'The host name (and port) being requested.'),
  h('User-Agent', 'Request', 'request', 'Identifies the client software.'),
  h('Referer', 'Request', 'request', 'The page that linked to this request (spelling is historic).'),
  h('Via', 'Info', 'both', 'Proxies the message passed through.'),
  h('Forwarded', 'Request', 'request', 'Original client address and protocol as seen by proxies (standard form of X-Forwarded-*).'),
  h('X-Forwarded-For', 'Request', 'request', 'Client IP chain added by proxies and load balancers.'),
  h('X-Forwarded-Proto', 'Request', 'request', 'The protocol (http/https) the client used to reach the proxy.'),
  h('X-Forwarded-Host', 'Request', 'request', 'The Host the client originally requested.'),
  // Info / fingerprinting
  h('Server', 'Info', 'response', 'Server software. Version numbers help attackers find known vulnerabilities.'),
  h('X-Powered-By', 'Info', 'response', 'Framework or language behind the site. Safe to remove; versions leak useful information.'),
  h('X-AspNet-Version', 'Info', 'response', 'ASP.NET version. Remove it to avoid advertising the framework version.'),
  h('X-AspNetMvc-Version', 'Info', 'response', 'ASP.NET MVC version. Remove it to avoid advertising the framework version.'),
  h('X-Generator', 'Info', 'response', 'The CMS or generator that built the page.'),
  h('X-Request-Id', 'Info', 'both', 'Correlation ID for tracing a request through logs.'),
  h('X-Robots-Tag', 'Other', 'response', 'Search engine directives (noindex, nofollow) for this response, like the robots meta tag.'),
  h('Server-Timing', 'Info', 'response', 'Server-side timing metrics shown in DevTools.'),
  h('NEL', 'Other', 'response', 'Network Error Logging: asks the browser to report network failures.'),
  h('Report-To', 'Other', 'response', 'Reporting endpoints (legacy Reporting API v0).'),
  h('Reporting-Endpoints', 'Other', 'response', 'Named endpoints for CSP and other browser reports.'),
  h('Accept-CH', 'Other', 'response', 'Client hints the server wants in later requests.'),
  h('Priority', 'Connection', 'both', 'Request priority hints for HTTP/2 and HTTP/3 (RFC 9218).'),
  h('Sec-Fetch-Site', 'Request', 'request', 'Fetch metadata: whether the request is same-origin, same-site or cross-site.'),
  h('Sec-Fetch-Mode', 'Request', 'request', 'Fetch metadata: navigate, cors, no-cors, same-origin or websocket.'),
  h('Sec-Fetch-Dest', 'Request', 'request', 'Fetch metadata: what the response will be used for (document, image, script…).'),
  h('Sec-Fetch-User', 'Request', 'request', 'Fetch metadata: ?1 when the navigation was triggered by the user.'),
]);

export const headerInfo = (name: string): HeaderInfo | undefined => HEADERS[name.toLowerCase()];
