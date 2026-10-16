import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste or drop a URL into **URL**, or click **Try an example**.',
    'For a relative URL such as `../img/logo.png` or `?page=2`, enter a **Base URL** to resolve it against.',
    'Read the **Parts** panel (origin, protocol, username, password, host, port, path, query and hash) and the decoded **Path segments**. Each value has its own copy button; the password stays hidden until you click **Show**.',
    'Under **Query parameters**, edit keys and values, remove rows or use **+ Add parameter**. The **Rebuilt URL** updates as you type: copy it, send it to another tool with **Send to…**, or click **Use as input** to parse it again.',
  ],
  howItWorks:
    'The URL is parsed with your browser’s built-in `URL` API (the WHATWG URL Standard), so you see exactly what `fetch()` and links would use. The host is lower-cased and converted to punycode, default ports are dropped, `.` and `..` path segments are resolved, and characters that need escaping are percent-encoded. If parsing fails and a base URL is given, the input is resolved against it, as a browser resolves a link on a page.\n\n' +
    'Path segments, username, password and hash are shown percent-decoded. A punycode host name (`xn--…`) is also decoded to Unicode with an RFC 3492 decoder. If the port is omitted, the default for `http`, `https`, `ws`, `wss` or `ftp` is shown.\n\n' +
    'Query parameters are read with `URLSearchParams`, which decodes `%XX` escapes and turns `+` into a space. Order and repeated keys are kept. The rebuilt URL encodes the rows the same way: spaces become `+` and other reserved characters are percent-encoded. Rows with an empty key and value are left out.',
  limits: [
    'Input longer than 100,000 characters is rejected.',
    'A relative URL can’t be parsed without a base URL, and a base must itself be an absolute URL with a scheme.',
    'The rebuilt URL re-encodes the whole query string with `URLSearchParams` rules, so it can differ from the original (for example `%20` becomes `+`) even if you change nothing.',
    'Only the query string can be edited; change other parts in the **URL** box.',
    'The tool only parses the URL. It doesn’t check that the host exists or that the page can be reached.',
  ],
  privacy:
    'Parsing runs in your browser. Nothing is requested, uploaded or stored, and the site’s Content Security Policy blocks requests to other servers. **Copy share link** puts the URL and base URL, including any username and password, in the link’s `#` fragment. Browsers don’t send that to servers, but anyone you give the link to can read it. Query edits aren’t included. **Send to…** passes the rebuilt URL through this tab’s session storage, removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Why does the parsed URL look different from what I pasted?',
      answer:
        'The browser normalises URLs: it lower-cases the scheme and host, converts international host names to punycode, removes a default port such as `:443`, resolves `.` and `..` in the path and percent-encodes characters such as spaces. The **Full URL** shows the result.',
    },
    {
      question: 'How do I parse a relative URL?',
      answer:
        'Enter the page it appears on as the **Base URL**, for example `https://example.com/docs/`. The relative URL is then resolved as a browser would resolve a link on that page.',
    },
    {
      question: 'Why did %20 turn into + in the rebuilt URL?',
      answer:
        'The query is rebuilt with `URLSearchParams`, which writes spaces as `+` (the form-encoding convention). Servers that decode query strings as forms treat both the same.',
    },
    {
      question: 'What happens to repeated parameters like tag=a&tag=b?',
      answer:
        'Each occurrence gets its own row, in the original order, and the rebuilt URL keeps them all.',
    },
  ],
};

export default docs;
