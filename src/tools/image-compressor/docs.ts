import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Drop, paste or choose one or more images (up to 100 at a time).',
    'Pick a format: **Auto** keeps JPEG, WebP and AVIF in their own format and turns PNG, GIF, BMP and others into WebP. Or choose JPEG, WebP or AVIF yourself.',
    'Set the quality (1–100) and, if you want, a max width and height. Images are only ever scaled down, keeping their aspect ratio.',
    'Select an image to compare the original and compressed versions side by side.',
    'Download a single image, or **Download all (ZIP)** for the whole batch.',
  ],
  howItWorks:
    'Each image is decoded by your browser with `createImageBitmap` (EXIF orientation applied), drawn onto a canvas, optionally scaled down to fit the max size, and re-encoded with the browser’s own encoder at the quality you set. When the browser supports `OffscreenCanvas`, this runs in a Web Worker so the page stays responsive; otherwise it runs on the main thread.\n\n' +
    'Lower quality settings discard more fine detail, which is what makes lossy formats smaller. With **Keep the original if compressing makes it bigger** on, an image whose re-encoded file in the same format and size came out larger is kept as the original instead. The ZIP stores files as they are, without compressing them again.',
  limits: [
    'Up to 50 MB per file, 100 megapixels per image and 16,384 pixels on either side, and up to 100 images per batch.',
    'Which formats can be opened depends on your browser’s image decoder. WebP and AVIF output are only offered when your browser can encode them; JPEG is always available.',
    'Output is always lossy (JPEG, WebP or AVIF). Converting PNG to JPEG fills transparent areas with white.',
    'Animated images are not kept animated: the browser decodes a single frame.',
    'Re-encoding removes metadata such as EXIF and GPS. To remove metadata without re-encoding, use Clean Image.',
  ],
  privacy:
    'Images are decoded, compressed and zipped entirely in your browser. They are never uploaded or saved to browser storage; the compressed files exist only in memory until you download them or leave the page.',
  faqs: [
    {
      question: 'What quality setting should I use?',
      answer: 'For photos, 70–80 usually looks the same as the original at a much smaller size. Go lower for thumbnails, higher if you see blocky edges or banding.',
    },
    {
      question: 'Why did a file come out bigger than the original?',
      answer:
        'An image that is already well compressed can grow when re-encoded at a higher quality. With **Keep the original if compressing makes it bigger** on, the original is kept for same-format images that weren’t resized, and the list tells you.',
    },
    {
      question: 'Why isn’t AVIF offered?',
      answer: 'Your browser can’t encode AVIF. The option only appears in browsers whose canvas encoder supports it.',
    },
    {
      question: 'Does compressing remove EXIF and GPS data?',
      answer: 'Yes. Re-encoding writes a new file without the original metadata. Use Clean Image if you only want to remove metadata without changing the image itself.',
    },
    {
      question: 'Will my PNG stay a PNG?',
      answer:
        'No. PNG is lossless, so it can’t be made smaller with a quality setting. **Auto** converts it to WebP (or JPEG if your browser can’t encode WebP), which is usually much smaller. Use an image converter if you need to keep PNG.',
    },
  ],
};

export default docs;
