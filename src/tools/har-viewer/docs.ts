import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Export a HAR from your browser’s DevTools Network tab (“Save all as HAR”), then drop it on the page or use **Open file**. **Try an example** loads a sample.',
    'Use the filter box to narrow requests by URL, method, status or type, and click a column heading to sort (click again to reverse, a third time to clear).',
    'Read the **Waterfall** column: each bar starts when the request started and is split into blocked, DNS, connect, SSL, send, wait and receive time.',
    'Click a URL to see its headers, query string, post data and a text preview of the response. Cookies, authorization headers, token-like parameters and post data are hidden: press **Reveal** on one value, or tick **Show sensitive values** for all of them. The **Summary** lists totals, the slowest 10 requests and counts by domain and type.',
    'To share a recording (for example with support), use **Download redacted HAR**. It replaces secrets with `[REDACTED]` and, with **Also remove response bodies** ticked, drops the bodies too.',
  ],
  howItWorks:
    'The file is parsed as JSON in a background worker, which keeps the full entries; only a small row per request reaches the page. Only the rows on screen are drawn, so large recordings stay responsive.\n\n' +
    'Size uses the transfer size if the HAR has one, otherwise the body size, otherwise the content size. Start times are measured from the first request. HAR’s `connect` time includes SSL, so SSL is shown separately and subtracted from connect.\n\n' +
    'Sensitive names are matched by pattern: the `Cookie`, `Set-Cookie`, `Authorization` and `Proxy-Authorization` headers, and any header or parameter whose name contains token, secret, API key, session, password, signature or auth (plus `code`, `key`, `sig`, `state` and `nonce` parameters). The redacted file is a copy of the whole HAR with those values, every cookie, every request body, passwords in URLs and sensitive parameters inside URLs (including `Referer`, `Location` and the `#` fragment) replaced. It is still valid HAR, so it opens in DevTools and other viewers.\n\n' +
    'Response bodies are shown as plain text only. Text, JSON, XML, JavaScript and similar types are decoded (base64 too); images and other binary content are not rendered.',
  limits: [
    'Files up to 200 MB can be opened.',
    'The response preview shows at most the first 100,000 characters of a body, and only when the HAR saved the body at all.',
    'Only the first sort key can be active, and the filter is a plain text match, not a query language.',
    'Pages and WebSocket messages in the HAR are not shown; only the request entries are.',
    'Entries that have no timing data are drawn as one “wait” bar covering their total time. A size or total time the HAR didn’t record (`-1` or missing) is shown as “n/a”.',
    'Redaction works on names, not values: a secret in a header or parameter with an ordinary name, inside a response body you keep, or in browser-specific fields (such as `_initiator`) is not caught. Check a redacted file before sharing it.',
  ],
  privacy:
    'HAR files can contain cookies, authorization headers, tokens, form data and response bodies. The file is parsed in your browser, in a worker, and is never uploaded or stored. Be careful sharing a HAR file itself; for that reason this tool has no share link. Sensitive values stay hidden on screen until you reveal them, and the redacted download is built in your browser too.',
  faqs: [
    {
      question: 'Why is a request shown as “failed”?',
      answer: 'The HAR recorded status 0, which browsers use when the request was blocked, aborted or never got a response.',
    },
    {
      question: 'Why is a response preview empty?',
      answer: 'Many browsers leave out bodies when exporting a HAR, and binary bodies such as images are never shown. The note under the preview says which case applies.',
    },
    {
      question: 'Is it safe to open a HAR with secrets in it?',
      answer: 'Yes for viewing: nothing leaves your browser. The risk is in sharing the file, because cookies and tokens inside it can be used to sign in as you.',
    },
  ],
};

export default docs;
