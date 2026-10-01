import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste the original document into **Left JSON** and the changed one into **Right JSON**, or drop a file on either box. **Try an example** loads a sample pair.',
    'Read the summary badges (added, removed, changed, unchanged) and browse the differences in the **Tree** view, or switch to **List** for one line per changed path.',
    'Tick **Ignore array order** to match array items by content, **Compare numbers by value (1 = 1.0)** to treat equal numbers as the same, and list keys to skip in **Ignore keys**, separated by commas.',
    'Use **Copy as JSON** for a list of the changes, or **Copy JSON Patch** for an RFC 6902 patch that turns the left document into the right one.',
  ],
  howItWorks:
    'Both documents are parsed with the same strict parser as the JSON Formatter, which keeps numbers and strings exactly as written, then compared as trees. Objects are matched key by key, so key order and whitespace never count as differences, and strings are compared after their escapes are decoded.\n\n' +
    'Arrays are compared in order by default. Equal items at the start and end are matched first, then the rest is aligned with a longest-common-subsequence match on each item’s content, so inserting one item doesn’t make every later item look changed. Unmatched items at the same spot are paired up and diffed, so an edited object inside an array shows as a change to its fields. With **Ignore array order**, items are matched by content wherever they are.\n\n' +
    'Each change is shown with its JSONPath, such as `$.users[2].name`. The JSON Patch uses JSON Pointer paths (RFC 6901) and `add`, `remove` and `replace` operations. Everything runs on the page in your browser.',
  limits: [
    'Each side can be up to 5,000,000 characters (about 5 MB).',
    'Strict JSON only: comments, trailing commas and other JSON5 features are reported as parse errors, with line and column, for the side they’re on.',
    'For very long arrays (when the differing middle parts multiplied together exceed 4,000,000 items), items are compared by position instead of being aligned.',
    'The **List** view shows the first 1,000 changes and the tree shows 300 children at a time (**Show more** loads the next ones). **Copy as JSON** always includes every change.',
    'If an object has duplicate keys, only the last value is compared, as with `JSON.parse`. Extremely deeply nested documents can’t be compared and show an error.',
    'With **Ignore array order**, the JSON Patch keeps the left document’s item order, so applying it gives an equivalent document rather than one with the right side’s order.',
  ],
  privacy:
    'Both documents are compared in your browser and never uploaded or stored. **Copy share link** puts both documents and the options in the link’s `#` fragment, which browsers don’t send to servers; links are limited in size, so large documents show *Too large to share*. JSON sent here from another tool with **Send to…** goes into the left side through this tab’s session storage and is removed as soon as it is read.',
  faqs: [
    {
      question: 'Why is `1.0` reported as different from `1`?',
      answer:
        'By default numbers are compared by their exact text, so formatting changes are visible. Turn on **Compare numbers by value (1 = 1.0)** to compare them as numbers instead. This is exact for any size, so `1e2` equals `100` and big IDs aren’t rounded.',
    },
    {
      question: 'How do I skip timestamps or other fields that always change?',
      answer: 'Type their key names in **Ignore keys**, for example `updatedAt, etag`. Matching keys are skipped at every depth.',
    },
    {
      question: 'What does the JSON Patch do?',
      answer:
        'It is a list of RFC 6902 operations that, applied to the left document, produce the right one. You can use it with any JSON Patch library, for example to send only the changes to an API that accepts `application/json-patch+json`.',
    },
    {
      question: 'Does key order or indentation matter?',
      answer: 'No. Objects are compared key by key and whitespace is ignored, so reordering keys or reformatting a document produces no differences.',
    },
    {
      question: 'Why did a removed array item show up as a change?',
      answer:
        'When items are removed and added at the same spot, they are paired and compared, so an edited object or array shows only the parts that changed. Paired plain values, or values of different types, show as one changed value.',
    },
  ],
};

export default docs;
