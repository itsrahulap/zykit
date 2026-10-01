import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type or paste a title into the **Text** box, or drop a text file onto it. Each line becomes its own slug.',
    'Choose a **Separator**: **Hyphen -**, **Underscore _** or **Dot .**.',
    'Adjust the options: **Lowercase**, **& → “and”**, **Remove stop words** and an optional **Max length**.',
    'Click **Copy** (or **Copy all** for several lines), or use **Send to…** to open the slugs in another tool.',
  ],
  howItWorks:
    'Each line is normalised to Unicode NFKD, which splits accented letters into a base letter plus accent marks, and the marks are removed (`é` becomes `e`). Letters that don’t decompose this way are spelled out in ASCII: `ß` becomes `ss`, `æ` becomes `ae`, `ø` becomes `o`, `ł` becomes `l`, `þ` becomes `th`, and a few more. Letters from other scripts, such as Cyrillic or Greek, are kept rather than transliterated.\n\n' +
    'Apostrophes are removed so that `don’t` stays one word, `&` becomes `and` if that option is on, and the text is lowercased if **Lowercase** is on. Every run of characters that aren’t letters or digits then becomes a single separator, so there are never leading, trailing or doubled separators. With **Max length**, the slug is cut back to the last whole word that fits. Everything runs in your browser as you type.',
  limits: [
    'Letters from non-Latin scripts are kept, not transliterated, so the slug isn’t ASCII-only for Cyrillic, Greek, CJK and similar text.',
    'Accent marks are removed in every script, which can change letters elsewhere: Cyrillic `й` becomes `и`, and Japanese `が` becomes `か`.',
    'Emoji and symbols other than `&` are dropped. Lines with no letters or digits give an empty slug.',
    '**Remove stop words** uses a short English list (such as *a*, *the*, *of*, *and*, *to*). If every word is a stop word, they are all kept.',
    'If the first word alone is longer than **Max length**, it is cut mid-word. Length is counted in UTF-16 code units, so some non-Latin characters count as two.',
    'Dropped files are limited to 10 MB and must be text.',
  ],
  privacy:
    'Slugs are generated entirely in your browser; your text is never uploaded or stored. The **Share** button copies a link with your text and options in its `#` fragment, which browsers don’t send to servers. **Send to…** hands the slugs to another tool through this tab’s session storage, and they are removed as soon as that tool reads them.',
  faqs: [
    {
      question: 'Should I use hyphens or underscores in URLs?',
      answer:
        'Hyphens are the usual choice for web pages: search engines treat a hyphen as a word separator, while an underscore can join words. Underscores and dots are handy for file names and identifiers.',
    },
    {
      question: 'How are accented and special letters handled?',
      answer:
        'Accents are stripped (`Crème Brûlée` becomes `creme-brulee`) and letters such as `ß`, `æ`, `ø`, `ł` and `đ` are spelled out in ASCII (`Straße` becomes `strasse`).',
    },
    {
      question: 'Can I make slugs for many titles at once?',
      answer: 'Yes. Put one title per line. Each line gets its own slug, and empty lines stay empty so the output lines up with the input.',
    },
    {
      question: 'Does Max length cut words in half?',
      answer:
        'No, unless it has to. The slug is shortened to the last whole word that fits, so `the-quick-brown-fox` with a limit of 14 becomes `the-quick`. Only a single word longer than the limit is cut mid-word.',
    },
  ],
};

export default docs;
