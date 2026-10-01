import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type a pattern into **Pattern**, without the surrounding slashes, and tick the **Flags** you need (`g` is on by default). **Try an example** loads a date pattern with named groups.',
    'Paste text into **Test text**, drop a file on it or use **Open file**. Matches are highlighted in **Matches** as you type.',
    'Check the match table for each match’s index, text and capture groups, including named groups.',
    'Enter a **Replacement** such as `$1`, `$<name>`, `$&` or `$$` to preview the replaced text, then copy it or use **Send to…**.',
    'Read **Pattern explained** for a one-line description of each part of the pattern.',
  ],
  howItWorks:
    'The pattern is compiled with the browser’s own `RegExp`, so the syntax and behaviour are exactly those of JavaScript in your browser, including named groups, lookbehind and, with the `u` flag, `\\p{…}` Unicode properties. Matches are found with `RegExp.prototype.exec`, and the replacement preview uses `String.prototype.replace`, so it replaces every match with `g` and only the first without it.\n\n' +
    'Matching runs in a Web Worker, shortly after you stop typing. If it doesn’t finish within 1 second, the worker is terminated, which is the only way to stop a pattern that backtracks catastrophically, and a fresh one is used for the next try. Empty matches advance by one character (one code point with `u`), so patterns such as `a*` can’t loop forever.\n\n' +
    '**Pattern explained** is a best-effort tokenizer, not a full parser: it describes escapes, classes, groups, quantifiers, anchors and back-references one by one.',
  limits: [
    'JavaScript regex syntax only. PCRE, Python or .NET features such as possessive quantifiers, atomic groups, inline `(?i)` flags or `\\A` / `\\Z` aren’t supported unless your browser’s `RegExp` accepts them.',
    'Flags `g`, `i`, `m`, `s`, `u`, `y` and `d` are available; the `v` (unicodeSets) flag isn’t offered.',
    'Matching stops after 1 second and shows a backtracking warning instead of results.',
    'Up to 5,000 matches are found; the table lists the first 500. The test text can be up to 1,000,000 characters.',
    'Empty (zero-length) matches appear in the table but can’t be highlighted in the text.',
  ],
  privacy:
    'The pattern and text are processed in your browser and never uploaded or stored. The **Share** button (Copy share link) puts the pattern, flags, test text and replacement in the link’s `#` fragment, which browsers don’t send to servers; links are limited in size, so long texts show *Too large to share*. A pattern sent here with **Send to…**, or a result you send on, passes through this tab’s session storage and is removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Why does my pattern only find one match?',
      answer: 'Without the `g` (global) flag, a JavaScript regex stops after the first match. Tick `g` to find every match.',
    },
    {
      question: 'Do I need to escape slashes?',
      answer:
        'No. Type the pattern without the surrounding `/…/` and flags; a `/` inside is matched literally. If you paste the pattern into JavaScript code as a literal, escape it there as `\\/`.',
    },
    {
      question: 'What does “Stopped after 1 s” mean?',
      answer:
        'The pattern took too long, usually because of catastrophic backtracking: nested quantifiers like `(a+)+` can take exponential time on text that almost matches. Make the inner part more specific or remove the nesting.',
    },
    {
      question: 'Will a pattern that works here work in Python or Java?',
      answer:
        'Not always. This tool uses your browser’s JavaScript engine. Common syntax is shared, but named groups, lookbehind, Unicode classes and replacement syntax (`$1` here, `\\1` in Python) differ between languages.',
    },
    {
      question: 'How do I use a named group in the replacement?',
      answer: 'Name it with `(?<year>\\d{4})` in the pattern, then write `$<year>` in **Replacement**. Numbered groups are `$1`, `$2` and so on, `$&` is the whole match and `$$` a literal dollar sign.',
    },
  ],
};

export default docs;
