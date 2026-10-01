import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type or paste into **Your text**, drop a text file onto it, or use **Open file**. **Try an example** fills in a sample.',
    'The summary shows **Words**, **Characters**, **Sentences** and **Reading time**, updating as you type.',
    'See **Details** for characters without spaces, UTF-16 code units, paragraphs, lines, size in UTF-8, average and longest word, and reading and speaking time.',
    'Check **Most frequent words** for the top 10 words; untick **Ignore common words (the, and, of…)** to include words like *the* and *and*.',
  ],
  howItWorks:
    'Words are found with the browser’s `Intl.Segmenter` in word mode, which follows Unicode word-boundary rules and also splits languages written without spaces, such as Chinese and Japanese. Only word-like segments count, so punctuation and emoji aren’t words. **Characters** counts grapheme clusters, what you see as one character, so an emoji or an accented letter counts once. **UTF-16 code units** is the JavaScript string length, and **Size (UTF-8)** is the encoded byte size.\n\n' +
    'A sentence ends at `.`, `!`, `?`, `…` or the CJK `。！？`, optionally followed by a closing quote or bracket, and then a space or the end of the text; text after the last one still counts if it contains a letter or digit. Paragraphs are separated by a blank line, and lines are counted at every line break.\n\n' +
    'Reading time assumes 238 words per minute and speaking time 150, rounded up to the second and shown in minutes after the first minute. Most frequent words are compared in lowercase; common words are skipped using a built-in English list of 126 words. Counting runs in your browser on a deferred copy of the text, so typing stays responsive.',
  limits: [
    'Abbreviations such as `e.g.` or `Dr.` followed by a space count as the end of a sentence.',
    '**Characters (no spaces)** is counted in UTF-16 code units, so an emoji counts as two there, unlike in **Characters**.',
    'The common-word list is English only.',
    'Markdown or HTML is counted as plain text: symbols aren’t words, but tag names and link URLs can be.',
    'Reading and speaking times are averages and don’t account for text difficulty.',
    'Dropped or opened files are limited to 10 MB and must be text.',
  ],
  privacy:
    'Counting happens entirely in your browser; your text is never uploaded or stored. The **Share** button copies a link with your text in its `#` fragment, which browsers don’t send to servers, but anyone you give the link to can read it. Text sent here from another tool with **Send to…** passes through this tab’s session storage and is removed as soon as this page reads it.',
  faqs: [
    {
      question: 'How is reading time calculated?',
      answer:
        'The word count is divided by 238 words per minute, a common average for silent reading of English. Speaking time uses 150 words per minute.',
    },
    {
      question: 'Why does an emoji count as one character?',
      answer:
        '**Characters** counts grapheme clusters, the characters you see. An emoji with a skin tone is several code points and four UTF-16 code units, but one character. The UTF-16 count is shown separately under **Details**.',
    },
    {
      question: 'Does it count Chinese or Japanese words?',
      answer:
        'Yes. Word boundaries come from the browser’s `Intl.Segmenter`, which splits text written without spaces into words using its own dictionaries, so results can differ slightly between browsers.',
    },
    {
      question: 'Are hyphenated words and contractions one word?',
      answer:
        'Contractions such as `it’s` are one word. Hyphenated words such as `well-known` are usually split into two by the browser’s word rules.',
    },
  ],
};

export default docs;
