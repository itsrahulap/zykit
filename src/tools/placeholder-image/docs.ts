import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Enter a **Width** and **Height** (1 to 8000 pixels), choose the background and text colours, and optionally type your own text. The default is the size, such as 800×600.',
    'Pick a format (PNG, JPEG, WebP or SVG) and press **Download**. A warning appears if the two colours have low contrast.',
    'Press **Copy SVG data URI** to paste the image straight into CSS or HTML, or copy the SVG source.',
    'For many sizes at once, list them under **Batch to ZIP** (for example `1200x630, 400x300, 150`) and download one ZIP with an image for each.',
  ],
  howItWorks:
    'The preview and SVG output are a small SVG document: a full-size rectangle in the background colour and one centred text element, with the text escaped for XML. The SVG data URI is that document URL-encoded after `data:image/svg+xml,`.\n\n' +
    'PNG, JPEG and WebP are drawn on an HTML canvas of exactly the chosen size and encoded by the browser (JPEG and WebP at quality 0.92). Auto font size picks the largest size that fits within 90% of the width and 30% of the height, assuming an average glyph width of 0.58 em, with a minimum of 8 px.\n\n' +
    'The ZIP is built in your browser with an uncompressed (stored) ZIP writer. Contrast is the WCAG ratio between the two colours.',
  limits: [
    'Width and height are whole numbers from 1 to 8000. Very large canvases (above about 16 million pixels) may fail to encode in some browsers, especially Safari and mobile browsers.',
    'Not every browser can encode WebP. If yours can’t, you’ll see an error; choose PNG or JPEG instead.',
    'JPEG has no transparency, which doesn’t matter here because the background is always opaque.',
    'The text is one line using your system’s default sans-serif font. Long text with a fixed font size can overflow the image, and PNG/JPEG/WebP text may look slightly different from the SVG because each uses its own font rendering.',
    'A ZIP holds at most 30 sizes. Colours must be hex (`#rgb` or `#rrggbb`).',
  ],
  privacy:
    'Images are generated in your browser; nothing is uploaded or stored. **Copy share link** puts the size, colours, text and format in the link’s `#` fragment, which browsers don’t send to servers.',
  faqs: [
    {
      question: 'How do I use the data URI?',
      answer: 'Paste it as an image source, for example `<img src="data:image/svg+xml,…">` or `background-image: url("…")`. It needs no separate file or network request.',
    },
    {
      question: 'Why does the text look different in PNG and SVG?',
      answer: 'An SVG is drawn by whoever displays it, using that device’s fonts, while PNG, JPEG and WebP are drawn once here with your browser’s font. Sizes and colours match, but glyph shapes can differ.',
    },
    {
      question: 'What contrast should I use?',
      answer: 'WCAG asks for at least 4.5:1 for normal text. The tool warns below that. Placeholders are often decorative, so it is a hint, not a block.',
    },
    {
      question: 'Can I use a transparent background?',
      answer: 'Not currently. The background is always an opaque colour.',
    },
  ],
};

export default docs;
