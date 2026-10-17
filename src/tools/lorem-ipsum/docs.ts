import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose the **Words**: **Lorem ipsum** for classic Latin-style filler or **English** for everyday English words.',
    'Set **How many** and the **Unit**: **Paragraphs**, **Sentences**, **Words** or **List items**.',
    'Pick a **Format** (**Plain**, **HTML** or **Markdown**). For lorem ipsum, choose whether to **Start with “Lorem ipsum dolor sit amet…”**.',
    'Click **Regenerate** for new text, or type a **Seed** to get the same text again later.',
    'Copy or download the **Generated text**, or open it in another tool with **Send to…**.',
  ],
  howItWorks:
    'Words are picked at random from a fixed list: 144 Latin-looking words for lorem ipsum, or 110 everyday English words. Most immediate repeats are avoided.\n\n' +
    '- A sentence has 6 to 16 words, a capital letter and a full stop. Sentences of 8 or more words get a comma half of the time.\n' +
    '- A paragraph has 3 to 7 sentences.\n' +
    '- A list item has 2 to 7 words and no full stop.\n' +
    '- In **Words** mode, the words form one long sentence.\n\n' +
    'The randomness comes from a seeded generator (sfc32, seeded by hashing the **Seed** text with cyrb128). The same seed and options always give exactly the same text in any browser. **Regenerate** just picks a new random seed with `crypto.getRandomValues`.\n\n' +
    '**HTML** wraps each paragraph in `<p>`, or the list in `<ul>` and `<li>`. **Markdown** turns list items into `- ` bullets. Plain and Markdown separate paragraphs with blank lines. Everything is generated in your browser.',
  limits: [
    'At most 500 paragraphs, 5,000 sentences, 50,000 words or 1,000 list items; larger numbers are capped.',
    'The text is random words, not real Latin or grammatical English.',
    'The classic opening is only available for the lorem ipsum word list.',
    'The status bar word count counts runs of the letters A–Z and ignores HTML tags.',
  ],
  privacy:
    'Text is generated in your browser; nothing is uploaded or stored. **Share** copies a link with your options and seed in its `#` fragment, which browsers don’t send to servers, so whoever opens it sees the same text. **Send to…** passes the text to another tool through this tab’s session storage, and removes it as soon as that tool reads it.',
  faqs: [
    {
      question: 'Can I get the same text again?',
      answer:
        'Yes. The output depends only on the options and the **Seed**, so reusing the seed or sharing the link reproduces it exactly. Click **Regenerate** for a new seed.',
    },
    {
      question: 'When should I use English instead of lorem ipsum?',
      answer:
        'When Latin would distract reviewers, or when you want text that looks like real copy, for example to test how a layout handles ordinary word lengths.',
    },
    {
      question: 'Does the HTML output escape special characters?',
      answer:
        'Yes, `&`, `<` and `>` are escaped inside each tag, although the built-in word lists contain only plain letters.',
    },
    {
      question: 'Does Words mode start with “Lorem ipsum”?',
      answer:
        'Yes, when the classic opening is ticked: the first words become *lorem ipsum dolor sit amet consectetur adipiscing elit*, cut short if you asked for fewer than eight words.',
    },
  ],
};

export default docs;
