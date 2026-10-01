import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste text into the **Text** box, drop a text file onto it, or use **Open file**. **Try an example** loads sample text with two regex rules.',
    'Type what to look for in **Find** and the new text in **Replace with**. Matches are highlighted under **Matches**; step through them with the previous and next arrows.',
    'Set the **Options**: **Regular expression**, **Case sensitive**, **Whole word**, **Multiline (^ and $ per line)**, and **Replace all** or **Replace first**.',
    'Click **+ Add rule** to chain more find/replace pairs. They run top to bottom, and each rule’s **On** box switches it off without deleting it.',
    'Copy or download the **Result**, send it to another tool with **Send to…**, or click **Use result as the new text** to keep editing it.',
  ],
  howItWorks:
    'Every rule becomes a JavaScript regular expression. In plain-text mode your search is escaped so that characters like `.` or `(` match literally, and the replacement is literal too, so `$` is just a dollar sign. With **Regular expression** on, the pattern uses the browser’s own `RegExp` syntax, and the replacement understands `$1`, `$<name>` for named groups, `$&` for the whole match and `$$` for a dollar sign. Matching is case-insensitive unless **Case sensitive** is on, and **Multiline** makes `^` and `$` match at each line.\n\n' +
    '**Whole word** wraps the pattern so it only matches when no letter, digit or underscore touches it on either side. In plain-text mode that check covers Unicode letters, so it works for words like `café`; in regex mode it uses `\\w`, which only knows ASCII letters.\n\n' +
    'Rules are applied in order, each to the result of the ones above it, and each shows its match count. The work runs in a background worker a moment after you stop typing. If it takes more than 1 second, usually because a pattern backtracks catastrophically, the worker is stopped and you are told to simplify the pattern.',
  limits: [
    'At most 5,000 matches per rule are highlighted and counted; replacing still covers every match.',
    'Only the first 200,000 characters of the text are highlighted on screen; replacing uses all of it.',
    'Matching that takes longer than 1 second is stopped, and no result is produced for that input.',
    'Regex mode has no `s` (dotAll) or `u` (Unicode) flag, so `.` doesn’t match line breaks and `\\p{…}` property escapes aren’t available.',
    'The options apply to every rule; you can’t mix plain-text and regex rules.',
    'Dropped or opened files are limited to 10 MB and must be text.',
  ],
  privacy:
    'Searching and replacing happen entirely in your browser, in a background worker; your text is never uploaded or stored. The **Share** button copies a link with your text, rules and options in its `#` fragment, which browsers don’t send to servers, but anyone you give the link to can read it. **Send to…** passes text between tools through this tab’s session storage, and it is removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'How do I reuse part of the match in the replacement?',
      answer:
        'Turn on **Regular expression**, put the part in a capture group and refer to it as `$1`, `$2` and so on, or name it with `(?<name>…)` and use `$<name>`. For example, `(\\d{4})-(\\d{2})-(\\d{2})` with `$3/$2/$1` turns `2026-09-14` into `14/09/2026`.',
    },
    {
      question: 'Why doesn’t `$1` work in my replacement?',
      answer:
        'In plain-text mode the replacement is inserted exactly as typed, so `$1` stays `$1`. Turn on **Regular expression** to use group references.',
    },
    {
      question: 'What happens when I add more than one rule?',
      answer:
        'Rules run in order and each one works on the output of the rules above it, so a later rule can match text an earlier rule inserted. The highlights show the rule you last clicked into.',
    },
    {
      question: 'Why was my search stopped?',
      answer:
        'Some patterns, such as nested repeats like `(a+)+`, can take exponentially long on certain text. Matching runs in a worker that is stopped after 1 second so the page doesn’t freeze; simplify the pattern and try again.',
    },
  ],
};

export default docs;
