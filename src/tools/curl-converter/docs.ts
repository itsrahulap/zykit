import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose a **Direction**: **cURL → code** or **fetch → cURL**.',
    'Paste a cURL command (for example from DevTools → Network → Copy as cURL, bash or cmd) or a `fetch()` call into the input. You can also drop a file on the box, use **Open file**, or click **Try an example**.',
    'For cURL → code, pick a **Language**: **JavaScript fetch**, **Node.js fetch**, **axios** or **Python requests**.',
    'Copy the result, or use **Send to…** to open it in another tool. The **Request headers** panel lists the headers on their own, ready to copy or send to the headers inspector.',
    'Read the **Warnings** and **Notes** under the output: they list options that were ignored, local files that became placeholders and things the target can’t reproduce.',
  ],
  howItWorks:
    'A cURL command is split into arguments with POSIX shell quoting rules: single and double quotes, `$\'…\'` strings, backslash escapes, line continuations and `#` comments. Windows cmd syntax (`^` line ends and `^"` quoting, as in Chrome’s “Copy as cURL (cmd)”) is detected automatically. Only the first command is used; anything after `|`, `;`, `&&` or a redirect is dropped with a warning.\n\n' +
    'The arguments are read like curl reads them: bundled short options such as `-sSL`, attached values such as `-XPOST`, and `--name=value`. The method follows curl’s defaults (POST when there is a body, PUT for `-T`, HEAD for `-I`, GET with `-G`, which moves the data into the query string). The resulting request is then written as code. JSON bodies become an object literal (`JSON.stringify(…)`, axios `data` or Python `json=`) only if re-serialising gives back exactly the same text; otherwise the body stays a string. `-F` fields become `FormData` (or Python `files=`), and `-u` becomes a Basic `Authorization` header for fetch, or `auth` for axios and requests.\n\n' +
    'The fetch → cURL direction never runs your code. A small parser reads the literal parts of the first `fetch(url, options)` call: string literals and `+` concatenation, object and array literals, `new Headers(…)`, `new URLSearchParams(…)` and `JSON.stringify(…)` of literal values. Anything it can’t work out, such as a variable, becomes a placeholder with a warning. The cURL command is quoted so a POSIX shell reads it back exactly.',
  limits: [
    'Recognised cURL options: `-X`, `-H`, `-d`/`--data`, `--data-raw`, `--data-binary`, `--data-urlencode`, `--json`, `-F`, `--form-string`, `-u`, `-b`, `-A`, `-e`, `--url`, `--oauth2-bearer`, `-T`, `-G`, `-I`, `-L`, `-k` and `--compressed`. Output, logging and protocol options such as `-s`, `-v`, `-o` and `--http2` are ignored; others such as `--proxy`, `--max-time` or `--cert` are noted as skipped, and unknown options are listed as warnings.',
    'Files referenced with `@file` or `<file` (in `-d`, `--data-binary`, `--json`, `-F`, `-T`, `-H @file`) can’t be read, so the code contains a placeholder such as `<contents of file>`. `-b` with a cookie file instead of `name=value` can’t be converted.',
    'Only the first URL in a command is used. A URL without a scheme gets `http://`, as curl does.',
    'In the browser fetch output, headers such as `Cookie`, `Host`, `Origin` and `Referer` are silently dropped by the browser, CORS applies, and `-k` can’t be reproduced. Node fetch has no per-request equivalent of `-k` either.',
    'fetch → cURL needs a string literal URL and an object literal for the options. Template literals keep `${…}` as literal text, computed values become placeholders, and only `method`, `headers`, `body`, `referrer` and `redirect` change the command (`credentials` only adds a warning).',
  ],
  privacy:
    'Parsing and code generation run entirely in your browser. The request is never sent, pasted code is parsed rather than executed, and the site’s Content Security Policy blocks requests to other servers. Nothing is stored, and there is no share link, because commands often contain tokens or cookies; a **Contains credentials** notice appears when they do. If you use **Send to…**, the output is handed over through this tab’s session storage and removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Does it send the request to see if it works?',
      answer:
        'No. It only translates the command. The site can’t contact other servers, so run the generated code or the cURL command yourself.',
    },
    {
      question: 'Why does the fetch code have notes about Cookie or CORS?',
      answer:
        'Browsers don’t let scripts set some headers, including `Cookie`, `Host`, `Origin` and `Referer`, and they block cross-origin responses unless the server allows your page’s origin. Use **Node.js fetch** to send those headers as they are, or `credentials: \'include\'` to send the browser’s own cookies.',
    },
    {
      question: 'Why is my JSON body a string instead of an object?',
      answer:
        'The body is only turned into an object literal when the `Content-Type` is JSON and parsing then re-serialising gives back exactly the same text. Numbers too large for JavaScript, `1.0`, unusual escapes or duplicate keys would otherwise change silently, so such bodies are kept as written.',
    },
    {
      question: 'Can I paste a “Copy as cURL (cmd)” command from Windows?',
      answer:
        'Yes. Commands with `^` line continuations or `^"` quoting are parsed with cmd.exe rules automatically.',
    },
    {
      question: 'Is the fetch code I paste executed?',
      answer:
        'No. It is read by a small parser that understands literals only. Variables, function calls and other expressions are replaced with placeholders and listed in the warnings.',
    },
  ],
};

export default docs;
