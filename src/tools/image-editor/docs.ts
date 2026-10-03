// User docs for Image Editor, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Drop, paste or choose an image. It opens with its EXIF orientation applied.',
    'Use **Crop** (drag the box and handles, use the arrow keys, or type X, Y, Width and Height; pick Free, 1:1, 4:3, 16:9 or 3:2), **Rotate & resize** (quarter turns, flips, **Straighten**, a new width and height), **Adjust** (exposure, brightness, contrast, saturation, vibrance, temperature, tint) and **Effects** (sharpen, blur, denoise, sepia, black and white).',
    'Use **Undo** and **Redo** (Ctrl/⌘+Z and Ctrl/⌘+Shift+Z), **Reset all**, or **Show original** to compare with the untouched picture.',
    'Under **Export**, choose PNG, JPEG or WebP, set the quality for lossy formats and press **Download**.',
  ],
  howItWorks:
    'The editor never changes your original. The edits are a small list of settings applied to the decoded image in a fixed order: quarter turn, flip, straighten, then crop, resize, and finally the pixel adjustments. Geometry is drawn in one canvas pass with high-quality scaling, so the image is resampled only once. Straightening grows the canvas to fit the turned picture, leaving transparent corners (white in JPEG).\n\n' +
    'Pixel adjustments run in this order: denoise (median filter, 3×3 or 5×5), blur (box blur), then tone and colour. Exposure works in linear light, brightness adds to the value, contrast stretches around mid grey, temperature and tint scale the red, green and blue channels, saturation and vibrance blend each pixel with its grey value (vibrance favours muted colours), and sepia mixes in a sepia matrix. Sharpen is an unsharp mask applied last. When your browser supports `OffscreenCanvas` and Web Workers, all of this runs in a background worker so the page stays responsive; otherwise it runs on the main thread. The preview is a reduced copy (up to 1400 pixels) and export re-renders from the full-size original.',
  limits: [
    'Up to 50 MB per file, 100 megapixels and 16,384 pixels on either side, for both the original and the edited image. Only one image is open at a time.',
    'The edit stack keeps the last 100 steps. Rotating by a quarter turn or flipping keeps your crop; straightening clears the crop and resize.',
    'Denoise and blur on very large images can take several seconds at export time. Blur and sharpen radii are applied to the final image, and scaled for the preview.',
    'WebP export needs a browser that can write WebP; JPEG has no transparency, so transparent areas become white. Animated images are edited from their first frame.',
    'Exporting writes a new file and removes metadata such as EXIF, GPS and colour profiles. Colours are exported as sRGB.',
  ],
  privacy:
    'Images are decoded, edited and encoded entirely in your browser. They are never uploaded or saved to browser storage; the edited file exists only in memory until you download it or leave the page.',
  faqs: [
    {
      question: 'Is my original file changed?',
      answer:
        'No. Edits are settings applied to a copy in memory, and the download is a new file. That is also why undo is exact: nothing is baked in until you export.',
    },
    {
      question: 'Why does my crop disappear when I straighten the image?',
      answer:
        'Straightening changes the size of the canvas, so an old crop rectangle would point at different pixels. Set the angle first, then crop. Quarter turns and flips keep the crop and move it with the picture.',
    },
    {
      question: 'Does exporting remove EXIF and GPS data?',
      answer:
        'Yes. The image is re-encoded from pixels, so camera, location and other metadata are not carried over. The orientation from the original EXIF is applied to the pixels first, so the picture still looks right.',
    },
    {
      question: 'How do I crop to an exact size?',
      answer:
        'Open **Crop**, type the **Width** and **Height** (with an aspect ratio selected the other side follows), and move the box with X and Y or the arrow keys. To scale the result, use **Resize** under **Rotate & resize**.',
    },
  ],
};

export default docs;
