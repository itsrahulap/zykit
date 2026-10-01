import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick **JavaScript** or **TypeScript**, then type or paste code into the editor, load one with **Example**, or use **Open file**. Tab indents; press Esc then Tab to move focus out of the editor.',
    'Press **Run** or Ctrl/⌘ + Enter. Output from `console.log`, `console.table`, `console.group` and the other console methods appears in the **Console** below.',
    'Choose a **Time limit** (5, 10, 30 or 60 s). Press **Stop** at any time, for example to end an infinite loop or a `setInterval`.',
    'For TypeScript, tick **Show compiled JS** to see the JavaScript that actually runs.',
    'Turn on **Timestamps** to see when each entry was logged, and use **Copy output**, **Send to…** or **Clear output** on the console.',
  ],
  howItWorks:
    'Each run starts a fresh Web Worker, created from your code, and terminates it when the run is over, so nothing carries over between runs and the worker can’t read or change the page. Your code is wrapped in an `async` function, which is why top-level `await` works. A small runtime replaces `console` so output is captured and pretty-printed, and keeps track of timers and `fetch` calls so the run only counts as finished when your code and everything it scheduled are done.\n\n' +
    'TypeScript is turned into JavaScript with Sucrase, which strips type annotations without type-checking and keeps every line where it was, so error line numbers match your code. Errors and stack traces are mapped back to lines in the editor. Sucrase is downloaded from this site the first time you run TypeScript.\n\n' +
    'The site’s Content Security Policy also applies inside the worker: requests to other servers are blocked, and `eval` and `new Function` don’t work.',
  limits: [
    'Runs as a plain script in a worker: there is no DOM, so `document`, `window` and `alert` don’t exist.',
    'Static `import` and `export` statements aren’t supported, and npm packages aren’t available; paste the code you need instead.',
    'Network requests to other sites are blocked, and `eval` and `new Function` are blocked.',
    'TypeScript types are removed but not checked, so type errors don’t stop the code from running; only syntax errors do.',
    'Output stops after 2,000 console entries or 1 MB of text, and the run is then stopped. Objects are printed 4 levels deep and with up to 100 items per collection; `console.table` shows the first 1,000 rows.',
  ],
  privacy:
    'Your code runs only in your browser, in an isolated worker, and is never uploaded. The editor contents, language and time limit are saved in this browser’s local storage so they are still there when you come back. Code sent here from another tool or a Learn page with **Send to…** arrives through this tab’s session storage and is removed as soon as it is read; the same applies to console output you send on. This tool doesn’t offer share links.',
  faqs: [
    {
      question: 'Why does `document` or `window` say it is not defined?',
      answer:
        'Code runs in a Web Worker, which has no page to work with, so DOM APIs don’t exist there. Use the console methods to see results. Worker APIs such as `setTimeout`, `Promise`, `crypto` and `TextEncoder` are available.',
    },
    {
      question: 'Can I fetch data from an API?',
      answer:
        'Not from other sites. The site’s security policy blocks requests to any server except this one, so a `fetch` to an external URL fails with a network error. Paste the data into your code instead.',
    },
    {
      question: 'Does it type-check my TypeScript?',
      answer:
        'No. Types are stripped with Sucrase without checking them, so the code runs even if it has type errors. Syntax errors are reported with their line and column before anything runs.',
    },
    {
      question: 'What happens if my code has an infinite loop?',
      answer:
        'The page stays responsive because the code runs in a separate worker. Press **Stop**, or wait for the time limit, and the worker is terminated.',
    },
    {
      question: 'When does a run finish?',
      answer:
        'When your code has finished and no timers or `fetch` calls it started are still pending. A `setInterval` that is never cleared keeps the run going until you press **Stop** or the time limit is reached.',
    },
    {
      question: 'Why can’t I use `import`?',
      answer:
        'Code runs as a classic script, not a module, and there is no network access to download packages. Static `import` and `export` statements are detected before running and explained instead.',
    },
  ],
};

export default docs;
