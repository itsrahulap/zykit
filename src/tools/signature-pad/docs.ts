import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'In **Draw** mode, sign in the box with a mouse, finger or pen. Use **Undo** to remove the last stroke or **Clear** to start again.',
    'Pick the **Colour**, the **Pen width**, and keep **Trim whitespace** on to crop the export tightly around your signature.',
    'To sign with the keyboard, switch to **Type** mode, enter your name, choose a **Style** and a **Size (px)**.',
    'Download a transparent **PNG** or an **SVG**, or **Copy SVG**, then place it on your document.',
  ],
  howItWorks:
    'Pointer events (mouse, touch and pen) are recorded as points, ignoring any closer than 1.5 units to the last one. The stroke is smoothed by drawing quadratic curves between the midpoints of consecutive points, using each point as a control point, so it is continuous and does not overshoot. If your pen reports pressure, line width varies from half to one and a half times the chosen width; a mouse or finger gives a constant width. The same path text is drawn on the canvas and written to the SVG.\n\n' +
    'Trim finds the bounding box of all strokes, including half of the widest line, adds 8 units of padding and clips it to the drawing area. The PNG is drawn at twice the drawing size with no background fill, so it is transparent. Typed signatures use the first installed font from a system cursive stack (for example Snell Roundhand, Segoe Script, Bradley Hand); no fonts are downloaded. The typed export is sized from the measured text.',
  limits: [
    'The drawing area is 600×240 units and cannot be resized; the PNG is exported at twice that size at most (1200×480 px untrimmed).',
    'Drawing needs a pointing device. There is no keyboard drawing; use Type mode instead. A typed signature is a font, not your handwriting.',
    'The available typed styles depend on your device’s installed fonts, and on devices with none of the listed fonts the generic cursive font is used. A typed **SVG** stores the font names rather than outlines, so it only looks the same on devices with the same font; use PNG to keep the exact look.',
    'Typed names are limited to 60 characters and sizes of 24–160 px. Undo removes whole strokes only, and there is no redo.',
    'A signature image is not a legally binding digital signature on its own; many contracts require a specific e-signature process.',
  ],
  privacy:
    'The signature is drawn, measured and exported entirely in your browser. It is never uploaded, saved to browser storage or placed in a link, and there is no share link for this tool. Clearing the page or reloading discards it.',
  faqs: [
    {
      question: 'How do I put my signature on a PDF or Word document?',
      answer: 'Download the transparent PNG and insert it as an image in your document or PDF editor. Because the background is transparent, it sits cleanly over text and lines.',
    },
    {
      question: 'Why is my line a constant width?',
      answer: 'Mouse and touch input do not report pressure. A pressure-sensitive pen (or tablet) varies the width automatically.',
    },
    {
      question: 'Why does my typed signature look different on another computer?',
      answer: 'Each device picks the first installed font from the style’s list. PNG exports capture the look on your device; SVG exports are drawn with the viewer’s fonts.',
    },
    {
      question: 'Can I use a white or light signature?',
      answer: 'Yes, choose a light colour. The drawing box is always white so light pens are hard to see while drawing, but the exported file is transparent.',
    },
  ],
};

export default docs;
