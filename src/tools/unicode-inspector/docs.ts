import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste text into the **Text** box, drop a text file onto it, or use **Open file**. **Try an example** loads text with emoji, hidden characters and look-alike letters.',
    'Read the summary: counts of characters, code points, UTF-8 bytes and UTF-16 units, and a warning listing any invisible, bidi-control or look-alike characters found.',
    'Scan **Characters (grapheme clusters)** for highlighted characters, then click a character in the **Code points** table to see its name, category, script, block and HTML, JavaScript, CSS and URL escapes.',
    'Check **Scripts and look-alikes** for words that mix scripts, and **Normalization** to compare the NFC, NFD, NFKC and NFKD forms and copy one.',
    'Under **Cleaned text**, choose **Turn unusual spaces into normal spaces** and **Replace look-alike letters**, then **Copy**, **Send to…**, or **Clean the input**.',
  ],
  howItWorks:
    'The browser’s `Intl.Segmenter` splits the text into characters as you see them (grapheme clusters), so an emoji family or a letter with combining accents counts as one. Each cluster is then split into code points. For each code point you get the `U+` value, UTF-8 bytes, UTF-16 units, general category (such as *Lu* or *Cf*) and script. Category and script come from your browser’s Unicode data via regex property escapes.\n\n' +
    'Block and character names come from a built-in table of common blocks. CJK ideographs, Hangul syllables, variation selectors, tags, regional indicators and many accented Latin letters get algorithmic names.\n\n' +
    'Each code point is checked for suspicious characters:\n\n' +
    '- bidirectional controls used in *Trojan Source* attacks\n' +
    '- invisible characters such as zero-width spaces and the byte order mark\n' +
    '- unusual spaces such as the no-break space, and control characters\n' +
    '- tag characters that can hide text, and stray variation selectors\n' +
    '- private-use, unassigned and lone surrogate code points, and the replacement character\n\n' +
    'Zero-width joiners, variation selectors and tags inside an emoji sequence are expected and only noted. Look-alikes come from a small hand-picked list of Cyrillic, Greek and Latin letters that imitate Latin ones, plus fullwidth forms. Words that mix scripts are listed with the Latin text they imitate.\n\n' +
    '**Normalization** runs `String.prototype.normalize` for all four forms and says whether each differs from your text. **Cleaned text** removes invisible, bidi-control, tag, stray variation selector, control and lone surrogate characters but keeps emoji sequences intact. It can also replace unusual spaces and look-alikes. Everything runs in your browser.',
  limits: [
    'Text over 1,000,000 characters isn’t inspected.',
    'The **Code points** table lists the first 2,000 code points and the character chips show up to 1,000 characters from the first 20,000; the counts and warnings cover the whole text.',
    'Character names come from a built-in table for common blocks; other characters show their block instead of a name.',
    'Look-alike detection uses a short hand-picked list, not Unicode’s full confusables data, so many look-alikes aren’t caught.',
    'Categories and scripts depend on your browser’s Unicode version, so very new characters may show as unassigned. Scripts outside a built-in list of 36 show as *Other*.',
    'Dropped or opened files are limited to 10 MB and must be text.',
  ],
  privacy:
    'Your text is analysed in your browser and never uploaded or stored. **Share** copies a link with your text in its `#` fragment; browsers don’t send that to servers, but anyone you give the link to can read it. **Send to…** passes text through this tab’s session storage, removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Why is the character count different from the length in my code?',
      answer:
        'The tool counts what you see as one character (a grapheme cluster). JavaScript’s `length` counts UTF-16 units, so `👍🏽` is one character, two code points and four UTF-16 units. All three counts, plus the UTF-8 byte count, are shown at the top.',
    },
    {
      question: 'What is a Trojan Source attack?',
      answer:
        'Bidirectional control characters such as U+202E RIGHT-TO-LEFT OVERRIDE can make source code display in a different order than the compiler reads it, so code can look like a comment but still run. These characters are flagged in red.',
    },
    {
      question: 'How can I tell if a domain or word uses look-alike letters?',
      answer:
        'Paste it in. Letters such as Cyrillic `а` in `pаypal.com` are flagged as look-alikes, and **Scripts and look-alikes** lists words that mix scripts together with the Latin text they imitate.',
    },
    {
      question: 'Which normalization form should I use?',
      answer:
        'NFC is the usual choice for storing and comparing text: it composes `e` plus a combining accent into `é`. NFD splits them apart. NFKC and NFKD also fold compatibility characters, such as `ﬁ` to `fi` and `①` to `1`, which helps with searching but changes how text looks.',
    },
  ],
};

export default docs;
