import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Under **Source**, pick **Text or emoji** and type up to four characters, or pick **Image** and choose, drop or paste a picture. A square PNG or SVG of at least 512 px works best.',
    'Style the icon: text colour, font and **Bold** for text, **Fit** or **Fill (crop)** for images, plus **Background** (or **Transparent background**), **Shape** and **Padding**.',
    'Check the browser tab and home screen previews, and fill in **Site details**: site name, short name, theme colour and the **Path** where the files will live.',
    'Click **Download all (ZIP)**, or download single files from the list.',
    'Upload the files to your site and paste the tags from **Add to your <head>** into your pages.',
  ],
  howItWorks:
    'Each icon is drawn on a canvas in your browser at its exact size. Text is scaled to fill the space inside the padding and centred on its visible ink. Images are scaled to fit or cropped to fill, downscaled in high quality, with EXIF orientation applied. Each size is encoded as a PNG.\n\n' +
    '`favicon.ico` packs 16, 32 and 48 px PNGs into one ICO file, which Windows and every modern browser understand. The Apple touch icon is always a solid square (transparent areas become white), because iOS rounds the corners itself.\n\n' +
    'The ZIP also holds `site.webmanifest` with the 192 and 512 px Android icons, and `favicon-tags.html` with the link tags, both using the path you set.',
  limits: [
    'Images up to 50 MB and 100 megapixels. Which formats open depends on your browser’s image decoder; HEIC, for example, only opens in Safari.',
    'Text is limited to four characters; anything longer is cut off. Emoji are drawn with your system’s emoji font, so they look different on Windows, macOS and Android.',
    'Output sizes are fixed: ICO with 16, 32 and 48 px, PNGs at 16, 32, 180, 192 and 512 px. No SVG favicon or maskable icon is generated.',
    'The path only allows letters, digits and `- _ . / ~`; other characters are removed. The short name is limited to 30 characters.',
    'Animated images are not kept animated; one frame is used.',
  ],
  privacy:
    'Icons are drawn entirely in your browser. Nothing is uploaded or saved to browser storage; the files exist only in memory until you download them or leave the page.',
  faqs: [
    {
      question: 'Which files do I actually need?',
      answer:
        'For most sites, `favicon.ico`, `apple-touch-icon.png` and the two PNG favicons cover every browser. Add `site.webmanifest` and the Android icons for a proper icon when people install your site or add it to their home screen.',
    },
    {
      question: 'Where do I put the files?',
      answer:
        'In your site’s root, or the folder you typed into **Path**. The link tags and manifest point at that path, so upload the files there.',
    },
    {
      question: 'Why does the Apple touch icon ignore my transparent background and shape?',
      answer: 'iOS shows transparency as black and applies its own rounded corners, so the Apple icon is always a full square with a solid background: your background colour, or white when the background is transparent.',
    },
    {
      question: 'Why does my emoji look different on another computer?',
      answer: 'The emoji is drawn with the emoji font installed on your device, such as Apple Color Emoji or Segoe UI Emoji. The downloaded PNGs keep the look you saw here.',
    },
    {
      question: 'Does the ICO file contain PNG images?',
      answer: 'Yes. Each size is stored as a 32-bit PNG inside the ICO, a layout supported since Windows Vista and by all modern browsers. This keeps the file small and supports transparency.',
    },
  ],
};

export default docs;
