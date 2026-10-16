import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste JSON into **Input JSON**, drop a file on it, or use **Open file** or **Try an example**. The tree appears as soon as the JSON is valid.',
    'Click the arrow, or press the Right and Left arrow keys, to open and close a node. Use **Expand to depth** with a number, or **Collapse all**.',
    'Type in **Search** to find keys and values. Matches are highlighted and their parents open automatically; use **Next** and **Prev** (or Enter and Shift+Enter in the box) to step through them.',
    'Click a node, or press Enter on it, to copy its JSONPath such as `$.a[0].b`. Use **Copy value** to copy the value itself. Long strings show a **Show all** link.',
  ],
  howItWorks:
    'The text is parsed by the same strict, non-recursive RFC 8259 parser the JSON Formatter uses, so very deep documents don’t overflow the stack and numbers keep the digits you wrote (`12345678901234567890` is not rounded). Input over 1,000,000 characters is parsed in a background worker so the page stays responsive.\n\n' +
    'The tree is virtualised: only the rows on screen (plus a few above and below) are in the page, so hundreds of thousands of rows scroll smoothly.\n\n' +
    'Search scans the whole document once for keys and decoded string, number and literal values, ignoring case, and reports up to 10,000 matches. Paths use dot notation for plain names and `[\'name\']` for keys with spaces or symbols. The tree follows the WAI-ARIA tree pattern, so screen readers announce levels and expanded state.',
  limits: [
    'Files up to 100 MB can be opened. Files over 1,000,000 characters are loaded without showing them in a text box, and need enough free memory to hold the parsed tree, which is several times the file size.',
    'Strict JSON only: comments, trailing commas, single quotes and `NaN` are reported as errors with a line and column (pasted input). JSON5 and JSON Lines are not supported.',
    'At most 1,000,000 rows are shown at once, and the first 10,000 search matches. Collapse nodes or narrow the search to see more.',
    'Strings are shown cut at 120 characters until you choose **Show all**, which displays up to 100,000 characters; **Copy value** always copies the whole string.',
    'Duplicate keys are shown as separate rows in their original order.',
  ],
  privacy:
    'Your JSON is parsed and displayed in your browser, in a background worker for large files, and is never uploaded or stored. There is no share link for this tool, because documents are usually too large for one. Copying a path or value uses your clipboard only when you click.',
  faqs: [
    {
      question: 'How big a file can it open?',
      answer:
        'Up to 100 MB. The practical limit is your device’s memory: the parsed tree takes several times the file size. If a very large file fails to load, try a smaller one or a browser with more memory.',
    },
    {
      question: 'What does clicking a node copy?',
      answer:
        'Its JSONPath, for example `$.users[2].name`. The **Path** line under the tree always shows the selected node’s path, and **Copy value** copies the decoded string, the number as written, or a formatted object or array.',
    },
    {
      question: 'Does search open collapsed nodes?',
      answer:
        'Yes. Every parent of a match is opened, and the first match is scrolled into view. If you collapse nodes afterwards, they stay collapsed until you search again or press Next.',
    },
    {
      question: 'Why does a long number look different in other tools?',
      answer:
        'JavaScript rounds numbers beyond about 15 digits. This viewer shows the digits exactly as in your file and warns you when a number has more than 15 digits.',
    },
    {
      question: 'Can I use the keyboard?',
      answer:
        'Yes. Tab to the tree, then use Up and Down, Page Up and Page Down, Home and End to move, Right to open or step into a node, Left to close it or go to its parent, and Enter to copy the path.',
    },
  ],
};

export default docs;
