import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type or paste text into the **Text** box, or drop a text file onto it. **Try an example** fills in a sample.',
    'Every format appears at once, from `camelCase` and `snake_case` to **Title Case** and **Sentence case**.',
    'Put one identifier or phrase per line to convert a whole list: each line is converted separately.',
    'Click **Copy** on a format’s card to copy its full result.',
  ],
  howItWorks:
    'For the programming formats (camelCase, PascalCase, snake_case, CONSTANT_CASE, kebab-case, Train-Case, dot.case and path/case), each line is first split into words. Words break at spaces and punctuation, at camel humps (`fooBar`), at acronym boundaries (`XMLHttpRequest` becomes `XML`, `Http`, `Request`) and between letters and digits (`version2` becomes `version`, `2`). The words are then joined with the format’s separator and capitalisation. Unicode letters such as `é` or `ß` count as letters.\n\n' +
    '**Title Case** and **Sentence case** keep your spacing and punctuation and change only letter case. Title Case capitalises each word but keeps short words such as *a*, *and*, *of*, *the* and *to* lowercase unless they are first or last. Sentence case lowercases everything, then capitalises the first letter and the first letter after `.`, `!` or `?`. Lower, upper, alternating and inverse case change letters one by one. Conversion runs in your browser as you type.',
  limits: [
    'In the word-based formats, symbols and emoji are dropped and apostrophes inside words are removed (`don’t` becomes `dont`).',
    'Title Case and Sentence case lowercase the rest of each word, so acronyms and names lose their capitals (`NASA` becomes `Nasa`, `Paris` becomes `paris` mid-sentence in Sentence case).',
    'The small-word list for Title Case is English only and doesn’t follow a specific style guide such as AP or Chicago.',
    'Case mapping uses the browser’s locale-independent rules, so language-specific cases like the Turkish dotted and dotless *i* aren’t handled.',
    'Results longer than 20,000 characters are cut short on screen; **Copy** still copies the whole result.',
    'Dropped files are limited to 10 MB and must be text.',
  ],
  privacy:
    'Conversion happens entirely in your browser; your text is never uploaded or stored. The **Share** button copies a link with your text in its `#` fragment, which browsers don’t send to servers, but anyone you give the link to can read it. Text sent here from another tool with **Send to…** passes through this tab’s session storage and is removed as soon as this page reads it.',
  faqs: [
    {
      question: 'How are acronyms like `XMLHttpRequest` split?',
      answer:
        'A run of capitals followed by a capitalised word is treated as an acronym, so `XMLHttpRequest` becomes `xml_http_request` in snake_case and `xmlHttpRequest` in camelCase. The acronym is lowercased after the first letter in camelCase and PascalCase.',
    },
    {
      question: 'Can I convert many variable names at once?',
      answer: 'Yes. Put one name per line. Each line is converted on its own, so the output keeps the same lines in the same order.',
    },
    {
      question: 'Why does Title Case leave “of” and “the” lowercase?',
      answer:
        'Short articles, conjunctions and prepositions (such as *a*, *an*, *and*, *for*, *in*, *of*, *on*, *the*, *to*) stay lowercase in the middle of a title. The first and last word are always capitalised.',
    },
    {
      question: 'Are numbers kept?',
      answer: 'Yes. Digits are kept as their own word, so `HTML5 parser` becomes `html_5_parser` in snake_case.',
    },
  ],
};

export default docs;
