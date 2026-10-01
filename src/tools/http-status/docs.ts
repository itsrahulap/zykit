import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type in **Search**: a code (`404`), the start of one (`4` or `42`), a class (`5xx`), a name (`teapot`) or any words from the explanation or a header name (`rate limit`, `Retry-After`).',
    'Narrow the list with the **Class** buttons: All, 1xx, 2xx, 3xx, 4xx or 5xx.',
    'Read each card: what the code means, when to use it, whether it is cacheable by default, whether a retry can help, related headers and the RFC that defines it.',
    'Click a code to link straight to it: an address ending in `#404` scrolls to and highlights that card.',
  ],
  howItWorks:
    'The list is built into the page: 63 codes, covering the IANA HTTP Status Code Registry plus 418 I’m a teapot, each with the RFC section that defines it (mostly RFC 9110, HTTP Semantics). Obsolete codes such as 305 Use Proxy and 306 are marked **Deprecated**.\n\n' +
    'Search runs as you type. A one- to three-digit number matches codes starting with it, `4xx` matches a whole class, and other text matches when every word appears in the code’s name, meaning, usage notes or headers. Exact and name matches are listed first.\n\n' +
    '“Cacheable by default” follows RFC 9110 and RFC 9111: caches may store these responses without explicit freshness headers. The retry hint says whether repeating the same request can succeed (yes, no or depends).',
  limits: [
    'Only registered codes (and 418) are listed. Vendor-specific codes such as nginx’s 499 or Cloudflare’s 52x aren’t included.',
    'Search is English-only and matches whole words or word fragments; it doesn’t correct typos.',
    'The retry and caching hints are general guidance; a specific server or API can behave differently.',
  ],
  privacy:
    'Everything is built into the page and searched in your browser; nothing is sent or stored. **Copy share link** puts your search, class filter and highlighted code in the link after the `#`, which browsers don’t send to servers.',
  faqs: [
    {
      question: 'What is the difference between 401 and 403?',
      answer:
        '401 Unauthorized means the request has no valid credentials, so signing in may help; it comes with `WWW-Authenticate`. 403 Forbidden means the server knows who you are (or doesn’t care) and still refuses.',
    },
    {
      question: 'Should I use 301 or 308 for a permanent redirect?',
      answer:
        'Both mean “moved permanently”. With 301, clients may change a POST into a GET at the new URL; 308 requires them to repeat the same method and body. Use 308 for APIs and form endpoints, 301 is fine for page moves.',
    },
    {
      question: 'What does “Cacheable by default” mean?',
      answer:
        'Caches may store the response and reuse it even when it has no `Cache-Control` or `Expires` header, using a heuristic lifetime. Examples are 200, 301, 404 and 410. Other codes are only cached when headers allow it.',
    },
    {
      question: 'How do I link to a specific status code?',
      answer: 'Add the code after a `#` in the address, for example `/tools/http-status#429`, or click the code on its card. The page scrolls to it and highlights it.',
    },
    {
      question: 'Is 418 I’m a teapot a real status code?',
      answer:
        'It comes from an April Fools’ RFC (the Hyper Text Coffee Pot Control Protocol) and is reserved (unused) in the IANA registry, so it has no standard meaning. Some servers still return it for requests they want to reject.',
    },
  ],
};

export default docs;
