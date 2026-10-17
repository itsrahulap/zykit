import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Find the card for your question: X% of Y, X is what % of Y, percentage change, add or subtract X%, reverse percentage, discount, margin vs markup, GST / VAT, or percentage points.',
    'Type your numbers into that card. The result updates as you type, with the formula shown under it.',
    'For a stacked discount, list the percentages separated by commas, such as `20, 10`. For GST or VAT, choose whether your amount includes tax, then pick a rate preset (5, 12, 18, 28) or type your own.',
    'Switch the GST card to **CGST + SGST** to see the tax split into two equal halves.',
    'Use **Copy share link** to send the current values of every card to someone else.',
  ],
  howItWorks:
    'Each card is a one-line formula using ordinary floating-point numbers, for example `Y × X ÷ 100` or `(B − A) ÷ |A| × 100`. Results are rounded for display only: to 2 decimal places (4 for the plain percent cards), with halves rounded away from zero, so `1.005` shows as `1.01`.\n\n' +
    'Stacked discounts apply one after another, each to the already-reduced price, so `20, 10` is 28% off overall, not 30%.\n\n' +
    'Margin is profit divided by the selling price; markup is profit divided by cost. So 25% markup is 20% margin.\n\n' +
    'For GST or VAT, the tax is rounded to 2 decimals and the net or gross follows from it. CGST and SGST are each half of the tax, with any odd paisa going to SGST.\n\n' +
    'Everything runs in your browser.',
  limits: [
    'Inputs are plain decimals with an optional sign. Thousands commas are ignored, but exponent notation such as `1e5` isn’t accepted.',
    'Percent change from 0, X is what % of 0, a margin of 100% or more, and reversing a 100% decrease are undefined and show a message instead of a number.',
    'Percent change divides by the absolute value of the starting number, so changes from negative numbers read in the direction of the move.',
    'Results use floating-point arithmetic, so extremely large values lose precision beyond about 15 digits.',
    'The GST card rounds to 2 decimals (currency units); it doesn’t apply country-specific rounding rules or tax slabs.',
  ],
  privacy:
    'Calculations run in your browser; nothing is uploaded or stored, and the site’s Content Security Policy blocks requests to other servers. **Copy share link** puts the values in the link’s `#` fragment, which browsers don’t send to servers.',
  faqs: [
    {
      question: 'What is the difference between margin and markup?',
      answer: 'Markup is profit as a percentage of cost; margin is profit as a percentage of the selling price. Buying at 80 and selling at 100 is a 25% markup but a 20% margin.',
    },
    {
      question: 'Why are two discounts of 20% and 10% not 30% off?',
      answer: 'The second discount applies to the price after the first, so 1000 becomes 800 and then 720: a 28% saving overall. Use the discount card with `20, 10` to see it.',
    },
    {
      question: 'How do I remove GST from a price that already includes it?',
      answer: 'Choose **Including tax** on the GST / VAT card. The net price is the amount divided by 1 plus the rate (1180 at 18% gives 1000), not the amount minus 18%.',
    },
    {
      question: 'What are percentage points?',
      answer: 'The plain difference between two percentages. A rate rising from 10% to 12% is 2 percentage points, but a 20% relative increase.',
    },
  ],
};

export default docs;
