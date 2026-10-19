import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick an **Image size**: 1200×630 (Facebook, LinkedIn, Slack), 1200×600 (X / Twitter) or 1080×1080 (square).',
    'Type the **Title**, **Subtitle**, **Eyebrow** and **Site name**, optionally add an **Emoji** or upload a logo. Then choose a **Theme**, background, alignment and font.',
    'Turn on **Safe-area guides** to keep important content away from the edges. The **Link previews** show roughly how Facebook, X, LinkedIn and Slack will crop it.',
    'Press **Download PNG** (sharp text, larger file) or **Download JPEG** (smaller file).',
    'Upload the image to your site, put its public address in **Image URL**, and copy the **Meta tags** into the page\'s `<head>`.',
  ],
  howItWorks:
    'The image is drawn on a 2D canvas at its real pixel size and shown scaled down. The title wraps word by word, and its font size drops in 2 px steps until it fits the available space: at most 5 lines, between 34 and 96 px (up to 128 px for the square). Only if it still doesn’t fit at the minimum size is it cut with an ellipsis. The subtitle is fitted the same way into at most 3 lines.\n\n' +
    'Text, logo and emoji are stacked and centred vertically between the margins (72 px, or 90 px for the square), with the site name at the bottom.\n\n' +
    'Backgrounds are a solid colour, a two-colour linear gradient with an angle, or a base colour with a dots, grid or stripes overlay. Themes are colour presets, including three based on the Zykit palette. Fonts are system font stacks only (sans, serif, monospace, rounded). No font is downloaded, so the image uses whichever font your device has for each stack.\n\n' +
    'Downloads use the browser\'s canvas encoder (`toBlob`): PNG, or JPEG at 92% quality. The guides and link-preview cards aren\'t part of the file. The meta tags use Open Graph (`og:*`) and X (`twitter:*`) properties, with the selected size\'s width and height and `summary_large_image` (or `summary` for the square).',
  limits: [
    'Only the three preset sizes are available; there is no custom size.',
    'Logos are decoded by your browser (PNG, JPEG, WebP, GIF, SVG and others it supports; up to 50 MB and 100 megapixels). Animated images use their first frame.',
    'The emoji field keeps at most two characters; how an emoji looks depends on your device\'s emoji font.',
    'Link-preview cards are approximations. Platforms crop, cache and restyle cards on their own schedule, and X may show a small square card for the 1080×1080 size.',
    'Facebook and LinkedIn cache images by URL: after replacing a hosted image, give it a new file name or clear their cache with their debugger tools.',
  ],
  privacy:
    'The image is drawn and encoded in your browser. A logo you pick is read locally and never uploaded, and nothing is stored. The Image URL and Page URL fields only fill in the meta tags and are never requested.',
  faqs: [
    {
      question: 'Which size should I use?',
      answer: '1200×630 works for Facebook, LinkedIn, Slack, Discord and most others, and X crops it well to its 2:1 card. Use 1200×600 if X is your main audience. Keep text inside the safe-area guides either way.',
    },
    {
      question: 'Why does my title get smaller as I type more?',
      answer: 'The title is auto-fitted: the font shrinks until the wrapped text fits. If it still can\'t fit at the smallest size, the end is replaced with an ellipsis, so shorten the title.',
    },
    {
      question: 'Can I use a Google Font or my brand font?',
      answer: 'Not here. This site never loads remote fonts, so only system font stacks are offered. For a brand font, design in another tool, or use the exported file as a base.',
    },
    {
      question: 'Do I need both the Open Graph and Twitter tags?',
      answer: 'X falls back to the Open Graph tags when `twitter:*` tags are missing, but `twitter:card` is still needed to get the large image card. The generated snippet includes both.',
    },
  ],
};

export default docs;
