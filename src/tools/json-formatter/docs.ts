import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste JSON into **Input JSON**, drop a file on it, or use **Open file** or **Try an example**.',
    'Pick an **Action**: **Format** to pretty-print, **Minify** to remove all whitespace, or **Validate** to only check the syntax.',
    'For Format, choose an **Indent** of 2 spaces, 4 spaces or a tab. Tick **Sort keys (recursively)** to order every object’s properties.',
    'If the JSON is invalid, read the message with its line and column, and use **Jump to error in input** to select the spot.',
    'Copy the result, **Download .json**, or use **Send to…** to open it in another tool.',
  ],
  howItWorks:
    'The input is checked by a strict JSON parser (RFC 8259) written for this tool. It reads the text in one pass without recursion, so very deeply nested documents can’t overflow the stack, and it stops at the first error with a specific message, such as a trailing comma, single quotes, a comment or a missing comma, plus its line and column.\n\n' +
    'Numbers and strings keep the exact text they were written with. A long ID such as `12345678901234567890` isn’t rounded the way `JSON.parse` would round it, and escapes like `\\u00fc` stay as escapes. Formatting rewrites only the whitespace between values, and sorting reorders properties by key, comparing the keys character by character (so uppercase letters come before lowercase). Everything runs on the page, on a deferred copy of the input so typing stays responsive.',
  limits: [
    'Strict JSON only: comments, trailing commas, single quotes, unquoted keys, `NaN` and `Infinity` are reported as errors. JSON5, JSONC and JSON Lines aren’t supported.',
    'Input over 20,000,000 characters (about 20 MB) isn’t processed. Opened or dropped files can be up to 10 MB.',
    'Output longer than 1,000,000 characters is cut short on screen; **Copy** and **Download .json** still give all of it.',
    'Duplicate keys are kept in the output and flagged (the first five are named), because most other parsers keep only the last value.',
    'Numbers with more than 15 significant digits are flagged: they are kept exactly here, but `JSON.parse` in other programs may round them.',
  ],
  privacy:
    'Your JSON is parsed and formatted in your browser and never uploaded or stored. **Copy share link** puts the input and options in the link’s `#` fragment, which browsers don’t send to servers; links are limited in size, so large documents show *Too large to share*. If you use **Send to…**, the output is handed over through this tab’s session storage and removed as soon as the other tool reads it.',
  faqs: [
    {
      question: 'Why does the formatter accept my big numbers when other tools round them?',
      answer:
        'JavaScript numbers hold about 15–17 significant digits. This tool never converts numbers; it keeps the digits you wrote, so `12345678901234567890` comes out unchanged. It warns you because other parsers may still round it.',
    },
    {
      question: 'Can it fix JSON with comments or trailing commas?',
      answer:
        'No. It validates strict JSON and points at the first problem, with a hint such as *trailing comma?* or *Comments aren’t allowed in JSON*. Remove those parts and the rest is formatted.',
    },
    {
      question: 'Does sorting keys change arrays?',
      answer: 'No. Only object properties are reordered, at every level. Array items keep their order.',
    },
    {
      question: 'What happens to duplicate keys?',
      answer:
        'They are kept, in their original order, and listed in a warning. JSON allows them, but most parsers keep only the last value, so it is usually worth removing them.',
    },
    {
      question: 'Is a single value like `"hello"` or `42` valid JSON?',
      answer: 'Yes. Any JSON value can be the whole document, not just an object or array, and it is formatted as is.',
    },
  ],
};

export default docs;
