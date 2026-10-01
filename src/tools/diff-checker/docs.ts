import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste the old version into **Original** and the new one into **Changed**, or drop a text file on either box. **Try an example** loads a sample pair.',
    'Read the result: removed lines are marked on the original side, added lines on the changed side, and the exact words that changed inside a modified line are highlighted.',
    'Tick **Ignore leading/trailing whitespace**, **Ignore all whitespace** or **Ignore case** to hide differences you don’t care about.',
    'Switch the **View** between **Side by side** and **Unified**, and use **Collapse unchanged lines** with **Context lines** to hide long unchanged stretches. **Swap sides** exchanges the two texts.',
    'Use **Copy unified diff** to get the changes in the standard `---` / `+++` / `@@` patch format.',
  ],
  howItWorks:
    'Both texts are split into lines, with CRLF and CR line endings normalised to LF first. The lines are compared with the Myers difference algorithm (linear-space variant), which finds the smallest set of removed and added lines that turns the original into the changed text. With the ignore options on, lines are compared after trimming, removing all whitespace or lower-casing, but they are shown as you typed them.\n\n' +
    'Inside each block of changes, removed and added lines are paired in order, and each pair is diffed again word by word (runs of letters, digits and underscores, runs of whitespace, and single punctuation characters) to highlight exactly what changed.\n\n' +
    'The comparison runs in a Web Worker in your browser, a quarter of a second after you stop typing, so large inputs don’t freeze the page. The unified diff uses 3 lines of context and marks a missing final newline with `\\ No newline at end of file`.',
  limits: [
    'Each side can be up to 2,000,000 characters (about 2 MB) and 50,000 lines. Dropped files can be up to 10 MB, but the 2 MB limit still applies to the text.',
    'The comparison is line-based: a change anywhere in a line marks the whole line as changed, with the changed words highlighted. Moved blocks show as a removal and an addition.',
    'Word highlights are skipped when a removed and an added line are together longer than 20,000 characters; the whole line is highlighted instead.',
    'If two texts are very different, the algorithm stops after a fixed amount of work and shows the remaining part as whole blocks replaced, with a note, rather than a minimal line-by-line match.',
    'A missing newline at the end of one text counts as a change to its last line, unless a whitespace option is on. Different line endings (CRLF vs LF) are normalised and only mentioned in a note.',
    'The result shows 2,000 rows at a time; **Show more lines** reveals the next ones. Phones always get the unified view.',
  ],
  privacy:
    'Both texts are compared in your browser and never uploaded or stored. The **Share** button (Copy share link) puts both texts and the options in the link’s `#` fragment, which browsers don’t send to servers; links are limited in size, so long texts show *Too large to share*. Text sent here from another tool with **Send to…** goes into **Original** through this tab’s session storage and is removed as soon as it is read.',
  faqs: [
    {
      question: 'Why does a line show as changed when it looks the same?',
      answer:
        'It usually differs in invisible characters, such as trailing spaces, tabs instead of spaces, or a missing newline at the end of the text. Turn on **Ignore leading/trailing whitespace** or **Ignore all whitespace** to check.',
    },
    {
      question: 'Do Windows (CRLF) and Unix (LF) line endings count as differences?',
      answer: 'No. Line endings are normalised to LF before comparing. If the two texts use different endings, a note above the result tells you.',
    },
    {
      question: 'Can I use the output as a patch?',
      answer:
        '**Copy unified diff** gives standard unified diff hunks with 3 lines of context, headed `--- original` and `+++ changed`. Rename the headers to real file paths if a patch tool needs them.',
    },
    {
      question: 'Why is a big section shown as replaced rather than matched line by line?',
      answer:
        'For very different inputs the diff stops after a fixed amount of work so the page stays responsive, and the rest is shown as one removed and one added block. The note *These texts are very different* tells you when this happened.',
    },
    {
      question: 'Does it understand code or JSON structure?',
      answer:
        'No. It compares plain text line by line and word by word, so reordered keys or reformatted code show as changes. For JSON documents, the JSON Diff tool compares the structure instead.',
    },
  ],
};

export default docs;
