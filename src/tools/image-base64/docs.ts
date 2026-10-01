import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'To encode, stay on **Image → Base64** and drop, paste or choose an image.',
    'Pick **Output as**: **Data URI**, plain **Base64**, a **CSS** `background-image` rule or an **HTML** `<img>` tag. Then copy it or download it as a text file.',
    'To decode, switch to **Base64 → Image** and paste raw Base64, a data URI, or CSS or HTML that contains one.',
    'Check the preview and the detected type, then click **Download** to save the image.',
  ],
  howItWorks:
    'Encoding reads the file’s bytes and writes them as standard Base64, four characters for every three bytes, which makes the text about a third bigger than the image. The type in the data URI comes from the file’s first bytes (its magic number), not its name or extension.\n\n' +
    'Decoding first pulls a `data:` URI out of any surrounding CSS `url(…)`, `<img>` tag or quotes. Base64 is decoded strictly: whitespace and line breaks are ignored, but any other invalid character, bad padding or truncated length is reported. Base64URL (with `-` and `_`) is recognised automatically, and non-Base64 data URIs such as percent-encoded SVG are decoded too. The decoded bytes are identified by their magic number; if that disagrees with the data URI’s declared type, you’re warned and the detected type is used.',
  limits: [
    'Images up to 10 MB can be encoded, and up to 20 MB of image data can be decoded.',
    'Recognised formats: PNG, JPEG, GIF, WebP, AVIF, HEIC, BMP, ICO, TIFF, JPEG XL and SVG. Files that aren’t recognised as images can’t be encoded.',
    'Decoded data that isn’t a known image format gets no preview, but can still be downloaded as a `.bin` file.',
    'Whether a preview shows depends on your browser: HEIC, TIFF or JPEG XL, for example, are recognised but may not display.',
    'Very long output is shown shortened on the page; copy or download gets all of it.',
  ],
  privacy:
    'Encoding and decoding run entirely in your browser. Images and Base64 text are never uploaded or saved to browser storage. Decoded SVGs are shown as images, so scripts inside them can’t run.',
  faqs: [
    {
      question: 'When should I inline an image as a data URI?',
      answer:
        'Only for small images such as icons of a few KB. Base64 is about 33% bigger than the file, and an inlined image can’t be cached on its own, so large data URIs slow pages down. The tool warns you above 32 KB of Base64.',
    },
    {
      question: 'What’s the difference between Base64 and a data URI?',
      answer: 'Base64 is just the encoded bytes. A data URI adds a prefix such as `data:image/png;base64,` so browsers know the type and can use it directly in `src` or `url(…)`.',
    },
    {
      question: 'Why does it say the declared type doesn’t match?',
      answer:
        'The data URI claims one type (for example `image/png`), but the bytes are another format. The type detected from the bytes is the real one, so it’s used for the preview and the download name.',
    },
    {
      question: 'Can I paste a whole CSS rule or `<img>` tag?',
      answer: 'Yes. The decoder finds the `data:` URI inside CSS `url(…)`, an HTML attribute or a JSON string and ignores the rest.',
    },
    {
      question: 'Does it accept Base64URL?',
      answer: 'Yes. Input that uses `-` and `_` instead of `+` and `/` is decoded as Base64URL automatically, with or without padding.',
    },
  ],
};

export default docs;
