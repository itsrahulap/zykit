import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Enter a **Width** and **Height**. The simplified ratio, its decimal value and the nearest common ratio appear straight away.',
    'Pick a preset such as 16:9 or 4:3, or turn on **Lock ratio** and edit one side: the other side is solved for you.',
    'Use **Scale (%)** to get smaller or larger dimensions with the same ratio, then press **Use** to adopt them.',
    'Click a common resolution that matches the ratio to load it, and copy the CSS `aspect-ratio` line for your stylesheet.',
  ],
  howItWorks:
    'The ratio is width : height divided by their greatest common divisor (Euclid’s algorithm). Decimal sides are first scaled by a power of ten to make them whole numbers. The decimal value is width ÷ height. The nearest common ratio is the closest entry, on a logarithmic scale, in a built-in list (1:1, 5:4, 4:3, 3:2, 16:10, 16:9, 21:9, 32:9 and a few more).\n\n' +
    'A missing side is solved with the locked ratio and rounded to a whole unit, so it can be off by up to half a unit. Scaling multiplies both sides by the percentage and rounds each. The A-paper and golden presets use 1.4142:1 and 1.6180:1, rounded from √2 and φ. Everything is plain arithmetic in your browser.',
  limits: [
    'Sides must be greater than 0 and at most 100000; decimals are accepted but the exact ratio of a decimal like 1.3333 is large (13333:10000).',
    'Solved and scaled sizes are rounded to whole numbers, so scaling back and forth can drift by a unit.',
    'The A-paper and golden ratios are rounded approximations, not exact irrational values.',
    'The resolution list is a fixed set of about 20 common sizes and only shows those within 1% of your ratio.',
  ],
  privacy:
    'All calculations happen in your browser; nothing is uploaded or stored. **Copy share link** puts the width, height, lock and scale in the link’s `#` fragment, which browsers don’t send to servers.',
  faqs: [
    {
      question: 'Why does 1366×768 say “approximate”?',
      answer: '1366:768 reduces to 683:384, which is very close to 16:9 but not equal to it. The tool shows the exact reduced ratio and the nearest common one separately.',
    },
    {
      question: 'How do I keep an image’s ratio when resizing?',
      answer: 'Enter its current size, turn on Lock ratio, then change the width or height. The other side follows, rounded to a whole pixel.',
    },
    {
      question: 'What does the CSS line do?',
      answer: '`aspect-ratio: 16 / 9;` makes an element keep that width-to-height proportion when only one dimension is set. All current browsers support it.',
    },
    {
      question: 'What is the A-paper ratio?',
      answer: 'A-series paper (A4, A3 and so on) has a long side √2 (about 1.4142) times the short side, so folding a sheet in half keeps the ratio.',
    },
  ],
};

export default docs;
