import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Drop, paste or choose an image. It is decoded with its EXIF orientation applied.',
    'Pick a **Method** (**k-means (OKLab)** or **Median cut**) and set how many **Colours** you want, from 3 to 12. With k-means, **Try another seed** gives a different but equally valid result.',
    'Each swatch shows its share of the image, its HEX, RGB, HSL and OKLCH values (click one to copy) and the WCAG contrast of white and black text on it. Click the swatch itself to open that colour in the Color Converter.',
    'Under **Export**, choose CSS variables, SCSS, a Tailwind theme or JSON, set a **Name**, then copy or download it.',
  ],
  howItWorks:
    'The image is decoded in your browser and shrunk to at most 128 pixels on its longest side. Pixels that are mostly transparent are ignored, and the rest are grouped into 5-bit-per-channel buckets, each keeping its exact average colour and pixel count, so a few thousand weighted points stand in for the whole image.\n\n' +
    '**k-means** converts those points to OKLab, a perceptually uniform colour space, picks starting colours with k-means++ using a seeded random generator (the same image and seed always give the same palette), then repeats assign-and-average steps until nothing changes (at most 40 rounds). **Median cut** works in sRGB: it keeps splitting the box with the most pixels and widest colour range at its weighted median until there are as many boxes as colours, and averages each box. A swatch’s share is the fraction of opaque pixels in its cluster. Contrast is the WCAG 2.1 ratio against white and black, graded AAA (7:1), AA (4.5:1), AA large (3:1) or Fail.',
  limits: [
    'Images up to 50 MB and 100 megapixels, as in the other image tools. Only one image is read at a time; an animated image uses its first frame.',
    'The image is sampled at 128 pixels, so tiny details such as a small logo on a large photo may not form their own colour.',
    'Fewer colours than requested are returned when the image has fewer distinct colours. Mostly transparent pixels (alpha below 50%) are ignored.',
    'k-means results depend on the seed: neighbouring shades may swap between runs. Median cut is deterministic.',
    'Colours are shown as sRGB; the OKLCH value is for the same colour.',
  ],
  privacy:
    'The image is decoded and analysed entirely in your browser. It is never uploaded and never saved to browser storage. Clicking a swatch opens the Color Converter with just that colour in the link’s `#` fragment, which stays in your browser.',
  faqs: [
    {
      question: 'Which method should I use?',
      answer:
        'k-means in OKLab groups colours the way people see them, so it usually gives the most natural palette. Median cut is fast and deterministic and tends to pick out vivid, well-spread colours.',
    },
    {
      question: 'Why do the colours change when I click “Try another seed”?',
      answer:
        'k-means starts from randomly chosen colours. A seed makes that choice repeatable; a new seed explores another starting point, which can settle on a slightly different set of colours.',
    },
    {
      question: 'What do the contrast badges mean?',
      answer:
        'They show the WCAG contrast ratio of white text and of black text on that colour. AA needs 4.5:1 for normal text and 3:1 for large text; AAA needs 7:1.',
    },
    {
      question: 'How do I use the Tailwind export?',
      answer:
        'It writes an `@theme` block with `--color-<name>-<n>` variables for Tailwind CSS v4. Paste it into your main stylesheet and use classes such as `bg-palette-1`.',
    },
  ],
};

export default docs;
