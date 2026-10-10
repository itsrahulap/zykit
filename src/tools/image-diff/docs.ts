import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Drop, paste or choose **Image A** and **Image B**. Pasting or dropping two files at once fills both.',
    'If the sizes differ, choose **Align top-left** (the canvas grows to fit both) or **Scale B to A**.',
    'Pick a view: **Difference** heatmap, **Side by side**, **Slider**, **Onion skin** (opacity) or **Blink**.',
    'Raise **Tolerance** to ignore tiny colour changes such as JPEG noise, and turn on **Ignore anti-aliasing** to skip soft edge pixels.',
    'Read the changed pixel count, percentage and bounding box, then **Download diff PNG**.',
  ],
  howItWorks:
    'Both images are decoded by your browser with EXIF orientation applied, drawn onto a shared canvas and read as RGBA pixels. For every pixel the largest difference across the red, green, blue and alpha channels (0–255) is compared with your tolerance; anything above it is counted as changed.\n\n' +
    'With **Ignore anti-aliasing** on, a changed pixel is skipped when its brightness lies between a darker and a lighter neighbour (an edge blend) in both images. This is a simple heuristic, so it can miss or over-skip some pixels. When the browser supports `OffscreenCanvas` the diff runs in a Web Worker so the page stays responsive.',
  limits: [
    'Up to 50 MB and 100 megapixels per image, 16,384 pixels per side. Which formats open depends on your browser.',
    'Animated images are compared by their first frame.',
    'Top-left alignment fills the missing area with transparency, which counts as changed. Scaling stretches B to A’s size, ignoring aspect ratio.',
    'Colour is compared as stored in the canvas (sRGB), not perceptually. Differences in colour profile can show as small changes; use tolerance.',
  ],
  privacy: 'Images are decoded and compared entirely in your browser. They are never uploaded or saved to browser storage. The diff PNG exists only in memory until you download it.',
  faqs: [
    {
      question: 'Why do identical-looking images show differences?',
      answer: 'Lossy formats such as JPEG add small noise, and re-encoding or colour profiles shift values slightly. Increase the tolerance (10 to 20 is typical) to hide them.',
    },
    {
      question: 'What does the heatmap show?',
      answer: 'Red pixels changed beyond the tolerance, yellow pixels were skipped as anti-aliasing, and grey pixels are unchanged (a faded copy of A).',
    },
    {
      question: 'Which size option should I use?',
      answer: 'Use top-left alignment when one image is a cropped or extended version of the other. Use scale B to A when the images show the same content at different resolutions.',
    },
    {
      question: 'Can I compare screenshots in a test suite with this?',
      answer: 'It is meant for manual inspection. For automated visual regression use a library such as pixelmatch in your test runner.',
    },
  ],
};

export default docs;
