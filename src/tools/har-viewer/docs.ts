import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Export a HAR from your browser’s DevTools Network tab (“Save all as HAR”), then drop it on the page or use **Open file**. **Try an example** loads a sample.',
    'Use the filter box to narrow requests by URL, method, status or type, and click a column heading to sort (click again to reverse, a third time to clear).',
    'Read the **Waterfall** column: each bar starts when the request started and is split into blocked, DNS, connect, SSL, send, wait and receive time.',
    'Click a URL to see its headers, query string, post data and a text preview of the response. The **Summary** lists totals, the slowest 10 requests and counts by domain and type.',
  ],
  howItWorks:
    'The file is parsed as JSON in a background worker, which keeps the full entries; only a small row per request reaches the page. Only the rows on screen are drawn, so large recordings stay responsive.\n\n' +
    'Size uses the transfer size if the HAR has one, otherwise the body size, otherwise the content size. Start times are measured from the first request. HAR’s `connect` time includes SSL, so SSL is shown separately and subtracted from connect.\n\n' +
    'Response bodies are shown as plain text only. Text, JSON, XML, JavaScript and similar types are decoded (base64 too); images and other binary content are not rendered.',
  limits: [
    'Files up to 200 MB can be opened.',
    'The response preview shows at most the first 100,000 characters of a body, and only when the HAR saved the body at all.',
    'Only the first sort key can be active, and the filter is a plain text match, not a query language.',
    'Pages and WebSocket messages in the HAR are not shown; only the request entries are.',
    'Entries that have no timing data are drawn as one “wait” bar covering their total time.',
  ],
  privacy:
    'HAR files can contain cookies, authorization headers, tokens, form data and response bodies. The file is parsed in your browser, in a worker, and is never uploaded or stored. Be careful sharing a HAR file itself; for that reason this tool has no share link.',
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
