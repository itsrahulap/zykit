import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Drop, paste or choose one or more images (up to 100 at a time).',
    'Under **Convert to**, pick PNG, JPEG, WebP or AVIF. Only formats your browser can write are listed.',
    'For JPEG, WebP and AVIF, set the **Quality** (1–100). PNG is lossless, so the slider is disabled.',
    'Choose a **Background** colour. JPEG always uses it for transparent areas; for PNG, WebP and AVIF, tick **Fill transparent areas with the background** to use it too.',
    'Download a single file, or **Download all (ZIP)** for the whole batch.',
  ],
  howItWorks:
    'Each image is decoded by your browser with `createImageBitmap` (EXIF orientation applied), drawn onto a canvas at its original size and re-encoded in the chosen format with the browser’s own encoder. SVG files can’t be decoded that way, so they are rendered through an image element on the main thread; an SVG without a set size is drawn at 512 × 512. When the browser supports `OffscreenCanvas`, the work runs in a Web Worker so the page stays responsive; otherwise it runs on the main thread.\n\n' +
    'Before converting, the browser is tested once to see which of PNG, JPEG, WebP and AVIF its canvas can actually encode, and only those are offered. Changing a setting converts the whole batch again. The ZIP stores files as they are, without compressing them again.',
  limits: [
    'Up to 50 MB per file, 100 megapixels per image and 16,384 pixels on either side, and up to 100 images per batch.',
    'Reading depends on your browser’s image decoder: PNG, JPEG, WebP, GIF, BMP, ICO and SVG generally work; AVIF, HEIC and JPEG XL only where the browser can decode them. Files it can’t decode are flagged in the list.',
    'Output is PNG, JPEG, WebP or AVIF only. GIF, BMP, ICO, SVG and TIFF can’t be written.',
    'Animated GIFs and WebPs are converted from their first frame only.',
    'Images are not resized, and re-encoding removes metadata such as EXIF and GPS.',
  ],
  privacy:
    'Images are decoded, converted and zipped entirely in your browser. They are never uploaded or saved to browser storage; the converted files exist only in memory until you download them or leave the page.',
  faqs: [
    {
      question: 'Why isn’t AVIF (or WebP) offered?',
      answer: 'Your browser’s canvas can’t encode it. The tool tests each format when the page opens and only lists the ones that work.',
    },
    {
      question: 'Why did my transparent PNG get a white background?',
      answer:
        'JPEG has no transparency, so transparent pixels are filled with the **Background** colour, which is white by default. Pick another colour, or convert to PNG, WebP or AVIF to keep transparency.',
    },
    {
      question: 'Can I convert HEIC photos from an iPhone?',
      answer: 'Only in browsers that can decode HEIC, such as Safari. In Chrome and Firefox the file is flagged as one the browser can’t decode.',
    },
    {
      question: 'Is converting to PNG lossless?',
      answer:
        'PNG stores the decoded pixels exactly, so nothing more is lost in the conversion. But if the source was a JPEG or other lossy file, its earlier compression artefacts stay, and the PNG is usually much larger.',
    },
    {
      question: 'Does converting keep EXIF data?',
      answer: 'No. The image is re-encoded from its pixels, so metadata such as EXIF and GPS is not copied. Use Clean Image to remove metadata without re-encoding.',
    },
  ],
};

export default docs;
