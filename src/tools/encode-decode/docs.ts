import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Codec**: Base64, Base64URL, URL component, Full URL, HTML entities or Hex.',
    'Choose **Encode** or **Decode**, then type or paste text into **Input**, or use **Open file** or drop a text file on it.',
    'The **Output** updates as you type. If the input can’t be decoded, an error under the output says why.',
    'Use **Swap** to move the output back into the input and flip the direction, for example to check a round trip.',
    'Copy the result with **Copy output**, or open it in another tool with **Send to…**.',
  ],
  howItWorks:
    'Text is first turned into UTF-8 bytes, so any Unicode text, including emoji, round-trips. Base64 uses the standard RFC 4648 alphabet with `=` padding; Base64URL uses `-` and `_` and no padding. Hex writes each UTF-8 byte as two lowercase hex digits. When decoding Base64, Base64URL and Hex, the resulting bytes must be valid UTF-8, or you get an error instead of garbled text.\n\n' +
    '**URL component** and **Full URL** use the browser’s `encodeURIComponent` / `decodeURIComponent` and `encodeURI` / `decodeURI`. The component variant escapes everything except letters, digits and `- _ . ! ~ * \' ( )`, while the full-URL variant keeps characters such as `: / ? # & =` intact.\n\n' +
    '**HTML entities** escapes `&`, `<`, `>`, `"` and `\'`, and with **Also escape all non-ASCII characters** every character above `~` as a hex reference such as `&#xE9;`. Decoding handles decimal and hex references and a built-in set of common named entities, without using the page’s HTML parser.',
  limits: [
    'Input and output are text: decoded bytes that aren’t valid UTF-8 (for example a Base64-encoded image) are rejected rather than shown.',
    'Base64 decoding ignores whitespace; padding is optional but must be correct when present. Characters from the other Base64 alphabet are rejected, with a hint to switch codec.',
    'Hex decoding ignores spaces, colons, commas, dashes and `0x` prefixes, and needs an even number of digits.',
    'HTML decoding knows only a common subset of named entities (such as `&amp;`, `&nbsp;`, `&copy;`, `&eacute;`); unknown names and entities without a closing `;` are left as they are. Invalid numeric references become `�`.',
    'Files opened or dropped must be text, up to 10 MB.',
  ],
  privacy:
    'All conversions run in your browser as you type; nothing is uploaded or stored. If you use **Send to…** to pass text between tools, it is handed over through this tab’s session storage and removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'What is the difference between Base64 and Base64URL?',
      answer:
        'Base64URL replaces `+` and `/` with `-` and `_` and drops the `=` padding, so the result is safe in URLs and file names. JWTs use Base64URL.',
    },
    {
      question: 'Should I use URL component or Full URL?',
      answer:
        'Use **URL component** for a single query value or path segment, since it also escapes `/`, `?`, `&` and `=`. Use **Full URL** for a whole address you want to keep working as a URL.',
    },
    {
      question: 'Why do I get “not valid UTF-8 text” when decoding?',
      answer:
        'The input decoded to bytes that aren’t text, for example an image or compressed data. This tool only shows text output, so binary data can’t be displayed.',
    },
    {
      question: 'Why is my Base64 rejected with a hint about the other codec?',
      answer:
        'It contains `-` or `_` (Base64URL characters) while **Base64** is selected, or `+` or `/` while **Base64URL** is selected. Switch to the codec the hint names.',
    },
    {
      question: 'What happens when I send a JWT here?',
      answer: 'The tool switches to Base64URL decoding and puts the token’s middle segment, the payload, in the input, so you see its JSON.',
    },
  ],
};

export default docs;
