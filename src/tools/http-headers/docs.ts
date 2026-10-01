import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Copy raw headers, for example from `curl -sI https://example.com` or DevTools (Network → select the request → Headers → Response Headers → Raw), and paste them into **Raw headers**. The status line is optional.',
    'You can also drop a text file on the box or use **Open file**. **Load sample** fills in an example response.',
    'For response headers, read the **Security review** grade and its checks, and the **Caching** summary of who may store the response and for how long.',
    'Scroll through the **Headers** list: each known header is explained, and values such as `Cache-Control`, `Content-Security-Policy`, `Set-Cookie` and `Strict-Transport-Security` are broken down directive by directive.',
  ],
  howItWorks:
    'The text is split into lines and parsed in your browser. It understands plain `curl -I` output, `curl -v` output (lines starting with `<`, `>` and `*`), DevTools copies where a value sits on the line after its name, HTTP/2 pseudo headers such as `:status`, and obsolete folded lines. If several responses are present, as with `curl -IL` following redirects, the last one is shown. Lines that aren’t valid `name: value` headers are listed as skipped.\n\n' +
    'Each header name is looked up in a built-in list of about 95 common headers, with its category and whether it is deprecated. Request and response headers are told apart by the start line or, without one, by typical header names. Only response headers get the security review and caching summary.\n\n' +
    'The security review checks HSTS, CSP (script sources, `unsafe-inline`, `unsafe-eval`, wildcards, `object-src`, `base-uri`, `frame-ancestors`), `X-Content-Type-Options`, clickjacking protection, `Referrer-Policy`, `Permissions-Policy`, COOP/COEP/CORP, cookie attributes, CORS, version leaks and obsolete headers. The score starts at 100 and loses 20 points per problem and 7 per warning, which maps to a grade from A+ to F. The caching summary works out freshness from `max-age`, `s-maxage` or `Expires` minus `Date`, and reports validators, `Vary`, `Age` and common mistakes.',
  limits: [
    'Input over 512 KB is cut off and only the start is read. Files opened or dropped are limited to 10 MB.',
    'Headers aren’t fetched for you: paste them from curl or DevTools. The site can’t make requests to other servers.',
    'The grade is based on the headers alone. A CSP set in a `<meta>` tag isn’t visible, and HSTS only matters over HTTPS.',
    'Headers outside the built-in list are shown as “Custom / uncommon” without an explanation.',
    'Request headers are listed and explained but not graded or checked for caching.',
  ],
  privacy:
    'Headers are parsed and reviewed entirely in your browser; nothing is uploaded or stored. Cookies and tokens in the pasted headers may be sensitive, but they never leave the page. If another tool sends headers here with **Send to…**, they are handed over through this tab’s session storage and removed as soon as this tool reads them.',
  faqs: [
    {
      question: 'Can it fetch the headers of a URL for me?',
      answer:
        'No. The site only talks to its own server, so it can’t request other websites. Run `curl -sI https://example.com` (add `-L` to follow redirects) or copy the response headers from your browser’s DevTools, then paste them.',
    },
    {
      question: 'How is the security grade calculated?',
      answer:
        'Every check is rated good, info, warning or problem. Starting from 100, each problem costs 20 points and each warning 7. A score of 100 is A+, 90 or more is A, 75 B, 60 C, 45 D and anything lower F.',
    },
    {
      question: 'I pasted curl -v output with both request and response. Which one is analysed?',
      answer:
        'The response. Lines starting with `*` are ignored, and when several responses appear (redirects), the last one is shown with a notice.',
    },
    {
      question: 'Why is there no security review for my headers?',
      answer:
        'The headers look like request headers, either because of a request line such as `GET / HTTP/1.1` or because names like `Host`, `Accept` or `Cookie` outnumber response-only ones. The review only applies to responses.',
    },
    {
      question: 'Why does the caching summary say a cookie could be shared?',
      answer:
        'The response sets a cookie but its `Cache-Control` lets shared caches such as CDNs store it, so another user could receive the same cookie. Add `private` or don’t set cookies on cacheable responses.',
    },
  ],
};

export default docs;
