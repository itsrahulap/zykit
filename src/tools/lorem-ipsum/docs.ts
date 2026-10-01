import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose the **Words**: **Lorem ipsum** for classic Latin-style filler or **English** for ordinary English words.',
    'Set **How many** and the **Unit**: **Paragraphs**, **Sentences**, **Words** or **List items**.',
    'Pick a **Format** (**Plain**, **HTML** or **Markdown**) and, for lorem ipsum, whether to **Start with “Lorem ipsum dolor sit amet…”**.',
    'Click **Regenerate** for new text, or type your own **Seed** to get the same text again later.',
    'Copy or download the **Generated text**, or open it in another tool with **Send to…**.',
  ],
  howItWorks:
    'Text is built from a fixed word list: 144 Latin-looking words for lorem ipsum, or 110 everyday English words. Words are picked at random, with most immediate repeats avoided. A sentence has 6 to 16 words, a capital letter and a full stop, and sentences of 8 or more words get a comma half of the time. A paragraph has 3 to 7 sentences, and a list item has 2 to 7 words with no full stop. In **Words** mode the words form one long sentence.\n\n' +
    'The randomness comes from a seeded generator (sfc32, seeded by hashing the **Seed** text with cyrb128), so the same seed and options always give exactly the same text in any browser. **Regenerate** just picks a new random seed using `crypto.getRandomValues`.\n\n' +
    '**HTML** wraps each paragraph in `<p>` or the list in `<ul>` and `<li>`. **Markdown** turns list items into `- ` bullets; paragraphs are separated by blank lines in both Plain and Markdown. Everything is generated in your browser.',
  limits: [
    'At most 500 paragraphs, 5,000 sentences, 50,000 words or 1,000 list items; larger numbers are capped.',
    'The text is randomly picked words, not real Latin or grammatical English.',
    'The classic opening is only available for the lorem ipsum word list.',
    'The word count in the status bar counts runs of the letters A–Z, ignoring HTML tags.',
  ],
  privacy:
    'Text is generated entirely in your browser and nothing is uploaded or stored. The **Share** button copies a link with your options and seed in its `#` fragment, which browsers don’t send to servers; whoever opens it sees the same text. **Send to…** passes the text to another tool through this tab’s session storage, and it is removed as soon as that tool reads it.',
  faqs: [
    {
      question: 'Can I get the same text again?',
      answer:
        'Yes. The output depends only on the options and the **Seed**, so reusing the seed, or sharing the link, reproduces the text exactly. Click **Regenerate** for a new seed.',
    },
    {
      question: 'When should I use English instead of lorem ipsum?',
      answer:
        'Use **English** when Latin would distract reviewers or when you want text that looks like real copy, for example to check how a layout handles ordinary word lengths.',
    },
    {
      question: 'Does the HTML output escape special characters?',
      answer:
        'Yes, `&`, `<` and `>` are escaped inside each tag, although the built-in word lists contain only plain letters.',
    },
    {
      question: 'Does Words mode start with “Lorem ipsum”?',
      answer:
        'It does when the classic opening is ticked: the first words become *lorem ipsum dolor sit amet consectetur adipiscing elit*, cut short if you asked for fewer than eight words.',
    },
  ],
};

export default docs;
