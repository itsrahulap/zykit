import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Drop, paste or choose one or more images (up to 100 at a time).',
    'Under **Resize by**, pick **Pixels** (width and/or height, with **Lock aspect ratio**), **Percentage** (1–200%) or **Fit to a box**.',
    'For a box, set the width and height or choose a **Preset** (1080p, 4K, social media sizes, favicons), then pick **Fit inside**, **Cover (crop)** or **Stretch**.',
    'Under **Output settings**, keep **Same as input** or choose PNG, JPEG, WebP or AVIF, and set the **Quality** for lossy formats.',
    'Download a single image, or **Download all (ZIP)** for the whole batch.',
  ],
  howItWorks:
    'Each image is decoded by your browser with `createImageBitmap` (EXIF orientation applied), and the new size is worked out from the mode. With the lock on, the side you typed last sets the size and the other follows each image’s own aspect ratio. **Fit inside** scales the image to fit within the box, **Cover (crop)** fills the box and crops the overflow from the centre, and **Stretch** uses the box size exactly.\n\n' +
    'When shrinking, the browser’s high-quality resampler is used; if that isn’t available, the image is halved step by step before the final draw so edges don’t go jagged. The result is re-encoded with the browser’s own encoder. When the browser supports `OffscreenCanvas`, this runs in a Web Worker so the page stays responsive; otherwise it runs on the main thread. Changing a setting resizes the whole batch again.',
  limits: [
    'Up to 50 MB per file, 100 megapixels and 16,384 pixels on either side, for both the original and the resized image, and up to 100 images per batch.',
    'Width and height fields accept 1–16,384 pixels. Images can be enlarged as well as shrunk, but enlarging can’t add detail.',
    '**Same as input** keeps PNG, JPEG, WebP and AVIF when your browser can write them; GIF, BMP, ICO, SVG and other formats become PNG.',
    'Saving as JPEG fills transparent areas with white. Animated images are resized from their first frame only.',
    'Re-encoding removes metadata such as EXIF and GPS.',
  ],
  privacy:
    'Images are decoded, resized and zipped entirely in your browser. They are never uploaded or saved to browser storage; the resized files exist only in memory until you download them or leave the page.',
  faqs: [
    {
      question: 'How do I resize a batch of images with different shapes?',
      answer:
        'Use **Pixels** with **Lock aspect ratio** on and set only the width (or height). Each image keeps its own proportions. The other side shown in the form is calculated from the first image.',
    },
    {
      question: 'What is the difference between Fit inside, Cover and Stretch?',
      answer:
        '**Fit inside** keeps the whole image and may leave it smaller than the box on one side. **Cover (crop)** fills the box exactly and trims the edges from the centre. **Stretch** fills the box exactly by distorting the image.',
    },
    {
      question: 'Why is my GIF saved as a PNG?',
      answer: 'Browsers can’t write GIF, BMP or ICO files, so **Same as input** saves those as PNG. Animated GIFs are resized from their first frame.',
    },
    {
      question: 'How are the files named?',
      answer: 'The new size is added to the original name, for example `cat.jpeg` resized to 800 × 600 becomes `cat-800x600.jpg`.',
    },
  ],
};

export default docs;
