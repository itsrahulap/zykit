import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'In **Draw** mode, sign in the box with a mouse, finger or pen. Use **Undo** to remove the last stroke or **Clear** to start again.',
    'Pick the **Colour** and **Pen width**. Keep **Trim whitespace** on to crop the export tightly around your signature.',
    'To sign with the keyboard, switch to **Type** mode, enter your name, and choose a **Style** and **Size (px)**.',
    'Download a transparent **PNG** or an **SVG**, or **Copy SVG**, then place it on your document.',
  ],
  howItWorks:
    'Pointer events (mouse, touch and pen) are recorded as points, skipping any closer than 1.5 units to the last one. The stroke is smoothed with quadratic curves between the midpoints of consecutive points, using each point as the control point, so it is continuous and doesn’t overshoot.\n\n' +
    'If your pen reports pressure, line width varies from half to one and a half times the chosen width; a mouse or finger gives a constant width. The same path is drawn on the canvas and written to the SVG.\n\n' +
    'Trim finds the bounding box of all strokes (including half of the widest line), adds 8 units of padding and clips it to the drawing area. The PNG is drawn at twice the drawing size with no background fill, so it is transparent.\n\n' +
    'Typed signatures use the first installed font from a system cursive stack (for example Snell Roundhand, Segoe Script, Bradley Hand); no fonts are downloaded. The typed export is sized from the measured text.',
  limits: [
    'The drawing area is 600×240 units and can’t be resized. The PNG is at most twice that size (1200×480 px untrimmed).',
    'Drawing needs a pointing device; there is no keyboard drawing, so use Type mode instead. A typed signature is a font, not your handwriting.',
    'Typed styles depend on your device’s installed fonts; with none of the listed fonts, the generic cursive font is used. A typed **SVG** stores font names, not outlines, so it only looks the same on devices with the same font. Use PNG to keep the exact look.',
    'Typed names are limited to 60 characters and sizes of 24–160 px. Undo removes whole strokes only, and there is no redo.',
    'A signature image is not a legally binding digital signature on its own; many contracts require a specific e-signature process.',
  ],
  privacy:
    'The signature is drawn, measured and exported entirely in your browser. It is never uploaded, saved to browser storage or put in a link, and this tool has no share link. Clearing or reloading the page discards it.',
  faqs: [
    {
      question: 'How do I put my signature on a PDF or Word document?',
      answer: 'Download the transparent PNG and insert it as an image in your document or PDF editor. The transparent background lets it sit cleanly over text and lines.',
    },
    {
      question: 'Why is my line a constant width?',
      answer: 'Mouse and touch input don’t report pressure. A pressure-sensitive pen (or tablet) varies the width automatically.',
    },
    {
      question: 'Why does my typed signature look different on another computer?',
      answer: 'Each device picks the first installed font from the style’s list. PNG exports capture the look on your device; SVG exports use the viewer’s fonts.',
    },
    {
      question: 'Can I use a white or light signature?',
      answer: 'Yes, choose a light colour. The drawing box is always white, so light pens are hard to see while drawing, but the exported file is transparent.',
    },
  ],
};

export default docs;
