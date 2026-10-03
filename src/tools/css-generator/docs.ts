import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a generator with the buttons at the top: **Gradient**, **Box shadow**, **Text shadow**, **Border radius**, **clamp()** or **Easing**.',
    'Change the controls and watch the live preview. Shadows take several layers (up to 8); gradients take 2 to 10 colour stops.',
    'In **clamp()**, enter the smallest and largest size, the viewport widths they apply at and your rem base, then read the maths under **The maths**.',
    'In **Easing**, drag the two dots (or focus one and use the arrow keys), type a `cubic-bezier()`, or choose a preset.',
    'Press **Copy CSS** or **Copy Tailwind** under the preview. Use **Copy share link** to send your settings to someone else.',
  ],
  howItWorks:
    'Each generator builds a plain CSS string from its controls with pure functions, and the preview applies that same value through a React style object, so what you see is what you copy.\n\n' +
    'Gradients sort their stops by position and emit `linear-gradient()`, `radial-gradient()` or `conic-gradient()` (with the `repeating-` prefix when repeat is on). Border radius collapses to the shortest 1 to 4 value shorthand and adds `/ vertical values` only when a corner is elliptical.\n\n' +
    'The fluid calculator uses a straight line through (min viewport, min size) and (max viewport, max size): slope = (max - min) / (maxVw - minVw) and intercept = min - slope x minVw. The preferred value is `intercept + slope x 100vw`, with the intercept converted to rem using your rem base, and the result is wrapped in `clamp(min, preferred, max)`. When the minimum is larger than the maximum the bounds are swapped so the value still shrinks smoothly.\n\n' +
    'The easing editor keeps x values between 0 and 1 (CSS requires it) and lets y overshoot between -2 and 3. The preview uses the Web Animations API with the same timing function, and is paused when your system asks for reduced motion.',
  limits: [
    'Colours are chosen with the browser colour picker, so output is `#rrggbb`, or `rgba()` when opacity is below 1.',
    'At most 8 shadow layers and 10 gradient stops. Gradient stop positions are percentages.',
    'Gradients are emitted as `background-image`; hard stops and colour hints are not generated, though two stops at the same position make a hard edge.',
    'Tailwind output uses arbitrary values (spaces become underscores) and is a convenience, not a substitute for your theme. Text shadow uses the `[text-shadow:...]` arbitrary property.',
    'The clamp() calculator works in px inputs and outputs rem; `vw` includes the scrollbar width on some browsers, so sizes can differ by a few pixels.',
  ],
  privacy:
    'Everything runs in your browser. Nothing you enter is uploaded or stored. A share link carries your settings in the URL fragment (the part after #), which browsers never send to a server.',
  faqs: [
    {
      question: 'Why does my clamp() have a negative value in it?',
      answer:
        'When the sloped line would be below zero at a viewport width of 0 (for example 16px at 400px up to 48px at 800px), the rem part is negative, so the preferred value is written as `8vw - 1.6rem`. That is valid inside `clamp()`.',
    },
    {
      question: 'Why can the easing curve go above 1 or below 0 but not left or right of the box?',
      answer: 'CSS requires the x coordinates of a cubic-bezier() to be between 0 and 1 (time), but the y coordinates (progress) may overshoot, which produces bounce and anticipation effects.',
    },
    {
      question: 'How do I get a hard colour edge in a gradient?',
      answer: 'Give two neighbouring stops the same position, for example one at 50% and another at 50%. The browser switches colour at that line without blending.',
    },
    {
      question: 'Does the preview respect reduced motion?',
      answer: 'Yes. If your operating system is set to reduce motion, the easing preview stays still and a note explains why; the curve and the CSS output still work.',
    },
  ],
};

export default docs;
