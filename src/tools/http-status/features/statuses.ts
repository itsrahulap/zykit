// Standard HTTP status codes from the IANA "HTTP Status Code Registry", plus 418.
// "Cacheable" means cacheable by default (heuristically, without explicit freshness) per RFC 9111 / RFC 9110 §15.1.

export type StatusClass = '1xx' | '2xx' | '3xx' | '4xx' | '5xx';

export interface HttpStatus {
  code: number;
  name: string;
  meaning: string;
  usage: string;
  cacheable: boolean;
  /** 'yes' = safe to retry (maybe after waiting), 'no' = retrying the same request won't help, 'maybe' = depends. */
  retry: 'yes' | 'no' | 'maybe' | 'n/a';
  headers: string[];
  rfc: string;
  deprecated?: boolean;
}

export const CLASS_INFO: Record<StatusClass, { label: string; summary: string }> = {
  '1xx': { label: 'Informational', summary: 'The request was received and the process is continuing.' },
  '2xx': { label: 'Success', summary: 'The request was received, understood and accepted.' },
  '3xx': { label: 'Redirection', summary: 'Further action is needed to complete the request.' },
  '4xx': { label: 'Client error', summary: 'The request is wrong or cannot be fulfilled as sent.' },
  '5xx': { label: 'Server error', summary: 'The server failed to fulfil an apparently valid request.' },
};

export function classOf(code: number): StatusClass {
  return `${Math.floor(code / 100)}xx` as StatusClass;
}

const R9110 = 'RFC 9110 (HTTP Semantics)';

export const STATUSES: HttpStatus[] = [
  { code: 100, name: 'Continue', meaning: 'The server has received the request headers and the client should send the body.', usage: 'Sent in reply to "Expect: 100-continue" so a client can check a large upload will be accepted before sending it.', cacheable: false, retry: 'n/a', headers: ['Expect'], rfc: `${R9110} §15.2.1` },
  { code: 101, name: 'Switching Protocols', meaning: 'The server is switching to the protocol the client asked for.', usage: 'WebSocket handshakes and HTTP/1.1 Upgrade requests.', cacheable: false, retry: 'n/a', headers: ['Upgrade', 'Connection'], rfc: `${R9110} §15.2.2` },
  { code: 102, name: 'Processing', meaning: 'The server accepted the request but has not finished it yet.', usage: 'WebDAV servers keeping a long request alive. Rarely used and deprecated in later WebDAV specs.', cacheable: false, retry: 'n/a', headers: [], rfc: 'RFC 2518 (WebDAV)', deprecated: true },
  { code: 103, name: 'Early Hints', meaning: 'A preview of headers the final response will probably include.', usage: 'Lets browsers start preloading CSS, fonts or scripts (Link: rel=preload) while the server is still building the page.', cacheable: false, retry: 'n/a', headers: ['Link'], rfc: 'RFC 8297' },

  { code: 200, name: 'OK', meaning: 'The request succeeded and the response contains the result.', usage: 'The normal answer for a successful GET, or a POST/PUT that returns a body.', cacheable: true, retry: 'n/a', headers: ['Content-Type', 'Cache-Control', 'ETag'], rfc: `${R9110} §15.3.1` },
  { code: 201, name: 'Created', meaning: 'The request succeeded and created a new resource.', usage: 'After a POST (or PUT) creates something. Point to it with the Location header.', cacheable: false, retry: 'n/a', headers: ['Location', 'ETag'], rfc: `${R9110} §15.3.2` },
  { code: 202, name: 'Accepted', meaning: 'The request was accepted for processing, but the work is not done yet.', usage: 'Queued or asynchronous jobs. Return a link where the client can check progress.', cacheable: false, retry: 'n/a', headers: ['Location', 'Retry-After'], rfc: `${R9110} §15.3.3` },
  { code: 203, name: 'Non-Authoritative Information', meaning: 'Success, but a proxy modified the response from the origin.', usage: 'Transforming proxies that changed the content. Rare.', cacheable: true, retry: 'n/a', headers: [], rfc: `${R9110} §15.3.4` },
  { code: 204, name: 'No Content', meaning: 'The request succeeded and there is nothing to send back.', usage: 'Successful DELETE, or a PUT/PATCH that returns no body. Must not have a body.', cacheable: true, retry: 'n/a', headers: ['ETag'], rfc: `${R9110} §15.3.5` },
  { code: 205, name: 'Reset Content', meaning: 'Success; the client should reset the form or view that sent the request.', usage: 'Clearing a form after submission. Rarely used.', cacheable: false, retry: 'n/a', headers: [], rfc: `${R9110} §15.3.6` },
  { code: 206, name: 'Partial Content', meaning: 'Only the requested byte range(s) of the resource are being sent.', usage: 'Replies to Range requests: resumable downloads, video seeking.', cacheable: true, retry: 'n/a', headers: ['Content-Range', 'Accept-Ranges', 'Range'], rfc: `${R9110} §15.3.7` },
  { code: 207, name: 'Multi-Status', meaning: 'The body holds separate status codes for several sub-operations.', usage: 'WebDAV operations that touch many resources at once.', cacheable: false, retry: 'n/a', headers: [], rfc: 'RFC 4918 (WebDAV)' },
  { code: 208, name: 'Already Reported', meaning: 'Members of this collection were already listed earlier in the same response.', usage: 'WebDAV bindings, to avoid repeating resources inside a 207 body.', cacheable: false, retry: 'n/a', headers: [], rfc: 'RFC 5842 (WebDAV)' },
  { code: 226, name: 'IM Used', meaning: 'The response is the result of instance manipulations (for example a delta) applied to the resource.', usage: 'Delta encoding for HTTP. Very rare.', cacheable: false, retry: 'n/a', headers: ['IM', 'A-IM'], rfc: 'RFC 3229' },

  { code: 300, name: 'Multiple Choices', meaning: 'There are several representations and the client should pick one.', usage: 'Content negotiation with a list of alternatives. Rare in practice.', cacheable: true, retry: 'n/a', headers: ['Location'], rfc: `${R9110} §15.4.1` },
  { code: 301, name: 'Moved Permanently', meaning: 'The resource has a new permanent URL.', usage: 'Permanent URL changes and HTTP→HTTPS moves. Browsers may change POST to GET; use 308 to keep the method.', cacheable: true, retry: 'n/a', headers: ['Location'], rfc: `${R9110} §15.4.2` },
  { code: 302, name: 'Found', meaning: 'The resource is temporarily at another URL.', usage: 'Temporary redirects, e.g. after login. Clients often switch POST to GET; use 307 to keep the method.', cacheable: false, retry: 'n/a', headers: ['Location'], rfc: `${R9110} §15.4.3` },
  { code: 303, name: 'See Other', meaning: 'Get the result from another URL with a GET request.', usage: 'Post/Redirect/Get: after a form POST, send the browser to a results page.', cacheable: false, retry: 'n/a', headers: ['Location'], rfc: `${R9110} §15.4.4` },
  { code: 304, name: 'Not Modified', meaning: 'The cached copy is still valid; no body is sent.', usage: 'Replies to conditional requests (If-None-Match / If-Modified-Since) when nothing changed.', cacheable: false, retry: 'n/a', headers: ['ETag', 'Last-Modified', 'If-None-Match', 'If-Modified-Since', 'Cache-Control'], rfc: `${R9110} §15.4.5` },
  { code: 305, name: 'Use Proxy', meaning: 'The resource must be accessed through a proxy.', usage: 'Deprecated for security reasons; clients ignore it.', cacheable: false, retry: 'n/a', headers: ['Location'], rfc: `${R9110} §15.4.6`, deprecated: true },
  { code: 306, name: '(Unused)', meaning: 'Reserved. It was used in an earlier draft and no longer has a meaning.', usage: 'Do not use.', cacheable: false, retry: 'n/a', headers: [], rfc: `${R9110} §15.4.7`, deprecated: true },
  { code: 307, name: 'Temporary Redirect', meaning: 'The resource is temporarily at another URL; repeat the same method and body there.', usage: 'Temporary redirects where a POST must stay a POST. Also used internally by browsers for HSTS upgrades.', cacheable: false, retry: 'n/a', headers: ['Location'], rfc: `${R9110} §15.4.8` },
  { code: 308, name: 'Permanent Redirect', meaning: 'The resource has a new permanent URL; repeat the same method and body there.', usage: 'Permanent moves of APIs or form endpoints where the method must not change.', cacheable: true, retry: 'n/a', headers: ['Location'], rfc: `${R9110} §15.4.9` },

  { code: 400, name: 'Bad Request', meaning: 'The server cannot process the request because it is malformed.', usage: 'Invalid JSON, missing required fields, bad query parameters, oversized cookies.', cacheable: false, retry: 'no', headers: [], rfc: `${R9110} §15.5.1` },
  { code: 401, name: 'Unauthorized', meaning: 'Authentication is required or the credentials sent are invalid.', usage: 'Missing, expired or wrong token or password. Really means "unauthenticated". Must include WWW-Authenticate.', cacheable: false, retry: 'maybe', headers: ['WWW-Authenticate', 'Authorization'], rfc: `${R9110} §15.5.2` },
  { code: 402, name: 'Payment Required', meaning: 'Reserved for future use; sometimes used when payment or a paid plan is needed.', usage: 'Some APIs use it for exhausted credits or failed billing. No standard behaviour.', cacheable: false, retry: 'no', headers: [], rfc: `${R9110} §15.5.3` },
  { code: 403, name: 'Forbidden', meaning: 'The server understood the request but refuses to allow it.', usage: 'Logged in but lacking permission, blocked IP, directory listing disabled. Re-authenticating will not help.', cacheable: false, retry: 'no', headers: [], rfc: `${R9110} §15.5.4` },
  { code: 404, name: 'Not Found', meaning: 'The server has nothing at this URL.', usage: 'Wrong or outdated links, deleted resources, typos. Also used to hide resources the client may not see.', cacheable: true, retry: 'no', headers: [], rfc: `${R9110} §15.5.5` },
  { code: 405, name: 'Method Not Allowed', meaning: 'The URL exists but does not support this HTTP method.', usage: 'POST to a read-only endpoint, DELETE where it is not allowed. Must list supported methods in Allow.', cacheable: true, retry: 'no', headers: ['Allow'], rfc: `${R9110} §15.5.6` },
  { code: 406, name: 'Not Acceptable', meaning: 'No representation matches the Accept headers the client sent.', usage: 'Client asks for Accept: application/xml but the server only produces JSON.', cacheable: false, retry: 'no', headers: ['Accept', 'Accept-Language', 'Accept-Encoding'], rfc: `${R9110} §15.5.7` },
  { code: 407, name: 'Proxy Authentication Required', meaning: 'The client must authenticate with the proxy first.', usage: 'Corporate proxies that need credentials.', cacheable: false, retry: 'maybe', headers: ['Proxy-Authenticate', 'Proxy-Authorization'], rfc: `${R9110} §15.5.8` },
  { code: 408, name: 'Request Timeout', meaning: 'The server gave up waiting for the client to finish sending the request.', usage: 'Slow or stalled uploads, idle keep-alive connections being closed.', cacheable: false, retry: 'yes', headers: ['Connection'], rfc: `${R9110} §15.5.9` },
  { code: 409, name: 'Conflict', meaning: 'The request conflicts with the current state of the resource.', usage: 'Editing a stale version, creating something that already exists, concurrent updates.', cacheable: false, retry: 'maybe', headers: [], rfc: `${R9110} §15.5.10` },
  { code: 410, name: 'Gone', meaning: 'The resource was here but has been removed permanently.', usage: 'Deliberately deleted content or retired API versions. Tells crawlers to drop the URL.', cacheable: true, retry: 'no', headers: [], rfc: `${R9110} §15.5.11` },
  { code: 411, name: 'Length Required', meaning: 'The server requires a Content-Length header.', usage: 'Uploads sent without a length (and without chunked encoding the server accepts).', cacheable: false, retry: 'no', headers: ['Content-Length'], rfc: `${R9110} §15.5.12` },
  { code: 412, name: 'Precondition Failed', meaning: 'A condition in the request headers was not met.', usage: 'If-Match / If-Unmodified-Since failed: someone else changed the resource first (optimistic locking).', cacheable: false, retry: 'no', headers: ['If-Match', 'If-None-Match', 'If-Unmodified-Since', 'ETag'], rfc: `${R9110} §15.5.13` },
  { code: 413, name: 'Content Too Large', meaning: 'The request body is larger than the server will accept.', usage: 'Upload size limits (nginx client_max_body_size and similar). Formerly "Payload Too Large".', cacheable: false, retry: 'maybe', headers: ['Retry-After'], rfc: `${R9110} §15.5.14` },
  { code: 414, name: 'URI Too Long', meaning: 'The URL is longer than the server will process.', usage: 'Huge query strings, often a GET that should have been a POST, or a redirect loop adding parameters.', cacheable: true, retry: 'no', headers: [], rfc: `${R9110} §15.5.15` },
  { code: 415, name: 'Unsupported Media Type', meaning: 'The server does not support the format of the request body.', usage: 'Wrong or missing Content-Type, e.g. sending form data to a JSON-only API.', cacheable: false, retry: 'no', headers: ['Content-Type', 'Content-Encoding', 'Accept', 'Accept-Encoding'], rfc: `${R9110} §15.5.16` },
  { code: 416, name: 'Range Not Satisfiable', meaning: 'The requested byte range is outside the resource.', usage: 'Resuming a download past the end of a file that has since shrunk.', cacheable: false, retry: 'no', headers: ['Content-Range', 'Range'], rfc: `${R9110} §15.5.17` },
  { code: 417, name: 'Expectation Failed', meaning: 'The server cannot meet the Expect header in the request.', usage: 'Servers or proxies that do not support "Expect: 100-continue".', cacheable: false, retry: 'maybe', headers: ['Expect'], rfc: `${R9110} §15.5.18` },
  { code: 418, name: "I'm a teapot", meaning: 'The server refuses to brew coffee because it is a teapot.', usage: 'An April Fools’ joke from the Hyper Text Coffee Pot Control Protocol. Reserved (unused) in the IANA registry, but some servers return it for requests they want to reject.', cacheable: false, retry: 'no', headers: [], rfc: 'RFC 2324, RFC 7168; reserved by RFC 9110 §15.5.19' },
  { code: 421, name: 'Misdirected Request', meaning: 'The request reached a server that cannot answer for this host.', usage: 'Reused HTTP/2 or HTTP/3 connections sent to the wrong origin, TLS certificate/SNI mismatches.', cacheable: false, retry: 'yes', headers: [], rfc: `${R9110} §15.5.20` },
  { code: 422, name: 'Unprocessable Content', meaning: 'The request is well-formed but its content is semantically invalid.', usage: 'Validation errors: the JSON parses, but a field value is not allowed.', cacheable: false, retry: 'no', headers: [], rfc: `${R9110} §15.5.21` },
  { code: 423, name: 'Locked', meaning: 'The resource is locked.', usage: 'WebDAV files locked by another user.', cacheable: false, retry: 'maybe', headers: [], rfc: 'RFC 4918 (WebDAV)' },
  { code: 424, name: 'Failed Dependency', meaning: 'The request failed because an earlier request it depended on failed.', usage: 'WebDAV batch operations.', cacheable: false, retry: 'maybe', headers: [], rfc: 'RFC 4918 (WebDAV)' },
  { code: 425, name: 'Too Early', meaning: 'The server will not process a request that might be replayed.', usage: 'TLS 1.3 early data (0-RTT): retry after the handshake completes.', cacheable: false, retry: 'yes', headers: ['Early-Data'], rfc: 'RFC 8470' },
  { code: 426, name: 'Upgrade Required', meaning: 'The server requires a different protocol.', usage: 'Endpoints that only accept a newer protocol, e.g. requiring TLS or a WebSocket upgrade.', cacheable: false, retry: 'no', headers: ['Upgrade'], rfc: `${R9110} §15.5.22` },
  { code: 428, name: 'Precondition Required', meaning: 'The server requires the request to be conditional.', usage: 'APIs that insist on If-Match to prevent lost updates.', cacheable: false, retry: 'no', headers: ['If-Match'], rfc: 'RFC 6585' },
  { code: 429, name: 'Too Many Requests', meaning: 'The client has sent too many requests in a given time (rate limiting).', usage: 'API rate limits and abuse protection. Back off and retry after the Retry-After delay.', cacheable: false, retry: 'yes', headers: ['Retry-After', 'RateLimit', 'RateLimit-Policy'], rfc: 'RFC 6585' },
  { code: 431, name: 'Request Header Fields Too Large', meaning: 'The request headers, or one header, are too large.', usage: 'Too many or too large cookies, very long Referer or Authorization headers.', cacheable: false, retry: 'no', headers: ['Cookie'], rfc: 'RFC 6585' },
  { code: 451, name: 'Unavailable For Legal Reasons', meaning: 'The resource is blocked for legal reasons.', usage: 'Court orders, government censorship or geo-blocking for legal compliance.', cacheable: true, retry: 'no', headers: ['Link'], rfc: 'RFC 7725' },

  { code: 500, name: 'Internal Server Error', meaning: 'The server hit an unexpected condition.', usage: 'Unhandled exceptions and bugs. Check the server logs.', cacheable: false, retry: 'maybe', headers: [], rfc: `${R9110} §15.6.1` },
  { code: 501, name: 'Not Implemented', meaning: 'The server does not support the functionality needed.', usage: 'Unknown HTTP methods, or features that are not built yet.', cacheable: true, retry: 'no', headers: [], rfc: `${R9110} §15.6.2` },
  { code: 502, name: 'Bad Gateway', meaning: 'A gateway or proxy got an invalid response from the server behind it.', usage: 'App server crashed or is restarting behind nginx, a load balancer or a CDN.', cacheable: false, retry: 'yes', headers: [], rfc: `${R9110} §15.6.3` },
  { code: 503, name: 'Service Unavailable', meaning: 'The server is temporarily unable to handle the request.', usage: 'Maintenance, overload, deploys. Include Retry-After if you know when it will be back.', cacheable: false, retry: 'yes', headers: ['Retry-After'], rfc: `${R9110} §15.6.4` },
  { code: 504, name: 'Gateway Timeout', meaning: 'A gateway or proxy did not get a response in time from the server behind it.', usage: 'Slow database queries or upstream APIs exceeding the proxy timeout.', cacheable: false, retry: 'yes', headers: [], rfc: `${R9110} §15.6.5` },
  { code: 505, name: 'HTTP Version Not Supported', meaning: 'The server does not support the HTTP version used in the request.', usage: 'Very old or unusual clients.', cacheable: false, retry: 'no', headers: [], rfc: `${R9110} §15.6.6` },
  { code: 506, name: 'Variant Also Negotiates', meaning: 'The server has a content negotiation configuration error.', usage: 'Circular references in transparent content negotiation. Very rare.', cacheable: false, retry: 'no', headers: [], rfc: 'RFC 2295' },
  { code: 507, name: 'Insufficient Storage', meaning: 'The server cannot store what is needed to complete the request.', usage: 'WebDAV or storage servers with a full disk or exceeded quota.', cacheable: false, retry: 'maybe', headers: [], rfc: 'RFC 4918 (WebDAV)' },
  { code: 508, name: 'Loop Detected', meaning: 'The server found an infinite loop while processing the request.', usage: 'WebDAV bindings with Depth: infinity that loop back on themselves.', cacheable: false, retry: 'no', headers: [], rfc: 'RFC 5842 (WebDAV)' },
  { code: 510, name: 'Not Extended', meaning: 'Further extensions to the request are required.', usage: 'HTTP Extension Framework. Obsoleted; do not use.', cacheable: false, retry: 'no', headers: [], rfc: 'RFC 2774 (historic)', deprecated: true },
  { code: 511, name: 'Network Authentication Required', meaning: 'The client needs to sign in to the network.', usage: 'Captive portals on hotel, airport or café Wi-Fi.', cacheable: false, retry: 'maybe', headers: [], rfc: 'RFC 6585' },
];

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Matches a code ("404", "4" prefix, "4xx"), name, or all words anywhere in the text. */
export function searchStatuses(query: string, list: HttpStatus[] = STATUSES): HttpStatus[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  const cls = /^([1-5])xx$/.exec(q);
  if (cls) return list.filter((s) => String(s.code)[0] === cls[1]);
  if (/^\d{1,3}$/.test(q)) return list.filter((s) => String(s.code).startsWith(q));
  const words = norm(q).split(' ').filter(Boolean);
  const scored = list
    .map((s) => {
      const name = norm(s.name);
      const hay = `${s.code} ${name} ${norm(s.meaning)} ${norm(s.usage)} ${s.headers.join(' ').toLowerCase()}`;
      if (!words.every((w) => hay.includes(w))) return null;
      const score = name === norm(q) ? 0 : words.every((w) => name.includes(w)) ? 1 : 2;
      return { s, score };
    })
    .filter((x) => x !== null);
  return scored.sort((a, b) => a.score - b.score || a.s.code - b.s.code).map((x) => x.s);
}
