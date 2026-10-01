import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste text into **Input text**, drop a text file onto it, or use **Open file**. **Try an example** loads a messy sample.',
    'Tick the cleaning steps you want. **Trim lines**, **Remove empty lines** and **Remove duplicate lines** are on to start with.',
    'Adjust a step’s options next to it, such as **Keep first** or **Keep last** for duplicates, or the **Order** for **Sort lines**, and use the arrows to change the order steps run in.',
    'Check **Lines before**, **Lines after** and **Characters** below the result, then copy or download the **Cleaned** text, or open it in another tool with **Send to…**.',
  ],
  howItWorks:
    'The text is split into lines at LF, CRLF or a lone CR, and each ticked step runs on the lines in the order shown, top to bottom. **Trim lines** removes whitespace from either or both ends, including non-breaking spaces. **Collapse inner whitespace** turns runs of two or more spaces, tabs or non-breaking spaces into one space but keeps leading indentation. **Remove empty lines** also removes lines that contain only whitespace. **Remove duplicate lines** compares whole lines, optionally ignoring case, and keeps the first or last copy in its place.\n\n' +
    '**Sort lines** sorts A → Z or Z → A with the browser’s English collation, which can ignore case; **Natural (numbers by value)** puts `item2` before `item10`; **By length** counts characters; and **Random** shuffles with a seeded generator so the order stays put while you edit, until you click **Shuffle again**. **Convert tabs ↔ spaces** expands tabs to the next tab stop, or turns leading spaces into tabs. **Strip non-printable and zero-width characters** removes control characters (keeping tabs and line breaks), soft hyphens, zero-width spaces and joiners, direction marks and bidi controls, and byte order marks.\n\n' +
    'The original line endings and any final newline are kept, unless **Normalise line endings** converts them to LF or CRLF. Everything runs in your browser as you type.',
  limits: [
    '**Strip non-printable and zero-width characters** also removes the zero-width joiner, which breaks joined emoji such as family or profession emoji into separate pictures.',
    '**Leading spaces → tabs** converts only indentation at the start of a line, not spaces inside it.',
    'Sorting uses English collation rules, so other languages may not sort in their own alphabetical order.',
    'Filtering is a plain substring match; regular expressions aren’t supported.',
    'The **Characters** count is in UTF-16 code units, so an emoji can count as two.',
    'Dropped or opened files are limited to 10 MB and must be text.',
  ],
  privacy:
    'Cleaning happens entirely in your browser; your text is never uploaded or stored. The **Share** button copies a link with your text and steps in its `#` fragment, which browsers don’t send to servers, but anyone you give the link to can read it. **Send to…** passes text between tools through this tab’s session storage, and it is removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Does the order of the steps matter?',
      answer:
        'Yes. Steps run top to bottom, each on the result of the ones above. For example, trimming before removing duplicates makes `apple` and `  apple` count as the same line. Use the arrows to reorder steps, or **Reset steps** to go back to the default order.',
    },
    {
      question: 'How do I remove duplicates but keep the original order?',
      answer:
        'Turn on **Remove duplicate lines** and leave **Sort lines** off. The first copy of each line stays where it was, or the last copy with **Keep last**.',
    },
    {
      question: 'Can I find invisible characters in pasted text?',
      answer:
        'Turn on **Strip non-printable and zero-width characters** and watch the **Characters** count: if it drops, the text contained hidden characters such as zero-width spaces or byte order marks. Use Unicode Inspector to see exactly which ones.',
    },
    {
      question: 'Is the random shuffle repeatable?',
      answer:
        'Yes. The shuffle is seeded, so it stays the same while you edit, and a share link includes the seed. **Shuffle again** picks the next seed for a new order.',
    },
  ],
};

export default docs;
