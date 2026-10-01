import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a preset under **Characters**: hex, Base64, Base64URL, alphanumeric, numeric or letters, or **Custom** to type your own set under **Custom characters**.',
    'Set the **Length** of each string and **How many** to make. Add a fixed **Prefix** or **Suffix** if you need one, such as `sk_`.',
    'Choose an **Output format**: **One per line**, **Comma-separated** or **JSON array**.',
    'Copy the **Output**, download it, or pass it to another tool with **Send to…**. Click **Generate** for a fresh set.',
  ],
  howItWorks:
    'Each character is picked independently and uniformly from the chosen set using the browser’s secure random generator, `crypto.getRandomValues`. Random 32-bit values that would cause modulo bias are discarded and redrawn (rejection sampling), so no character is more likely than another.\n\n' +
    'A custom set is reduced to its unique characters (Unicode code points) in the order you typed them; tabs and newlines are dropped, but a plain space is kept. The entropy shown is `length × log2(set size)` per string. The prefix and suffix are fixed text, so they add nothing.',
  limits: [
    'Length is 1 to 4,096 characters and up to 1,000 strings can be made at once.',
    'Very large output is shown truncated on screen (first 200,000 characters); copy and download always get all of it.',
    'Length counts Unicode code points, not bytes. A custom emoji made of several code points (for example with skin tones or joiners) is split into its parts.',
    'The Base64 and Base64URL presets pick characters from those alphabets; the result isn’t padded and isn’t the encoding of a specific number of bytes.',
    '**Comma-separated** output doesn’t quote values, so a prefix, suffix or custom set containing a comma makes it ambiguous. Use **JSON array** instead.',
  ],
  privacy:
    'Strings are generated in your browser and never uploaded or stored; this tool doesn’t create share links. **Send to…** passes the output to the other tool through this tab’s session storage, where it is removed as soon as that tool reads it. **Download** saves a file made on your device.',
  faqs: [
    {
      question: 'How long should an API key or token be?',
      answer:
        'Aim for at least 128 bits of entropy, which the status line marks as good: 32 hex characters, 22 Base64URL characters or 22 alphanumeric characters all reach it.',
    },
    {
      question: 'Are these strings safe to use as secrets?',
      answer:
        'Yes, they come from the browser’s cryptographically secure generator with unbiased sampling. Treat them like any secret: they have been on screen and possibly in your clipboard.',
    },
    {
      question: 'Do repeated characters in a custom set make them more likely?',
      answer: 'No. Repeated characters are counted once, so `aabb` gives a two-character set with each character equally likely.',
    },
    {
      question: 'Does a prefix make the key stronger?',
      answer: 'No. A prefix like `sk_` is the same on every string, so it adds no entropy. Only the random part counts.',
    },
  ],
};

export default docs;
