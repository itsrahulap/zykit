// User docs for the SIP & Compound Interest Calculator, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose Monthly SIP or Lump sum.',
    'Enter the amount, expected yearly return and number of years.',
    'For a SIP, optionally add a yearly step-up and choose whether you invest at the start or end of each month. For a lump sum, choose how often interest compounds.',
    'Read the total value, invested amount and returns, and the year-by-year table.',
  ],
  howItWorks:
    'A SIP is simulated month by month. The yearly return is divided by 12, each instalment is added at the start (or end) of the month, and the balance grows by that monthly rate. A step-up raises the instalment after every 12 payments.\n\n' +
    'A lump sum uses the compound interest formula P × (1 + r/n)^(n × years). Inflation divides the final value by (1 + inflation)^years.',
  limits: [
    'Assumes the same return every year; real returns vary and can be negative.',
    'Ignores taxes, fees, exit loads and expense ratios.',
    'Years must be a whole number from 1 to 100.',
  ],
  privacy: 'All calculations run in your browser. Nothing you enter is stored or sent anywhere.',
  faqs: [
    {
      question: 'Why does investing at the start of the month give a higher value?',
      answer: 'Each instalment earns one extra month of returns. Most SIP calculators use the start-of-month convention; switch to "End of each month" to compare.',
    },
    {
      question: 'What is a step-up SIP?',
      answer: 'You raise your monthly instalment by a fixed percentage every year, for example 10% as your income grows.',
    },
    {
      question: 'Is this financial advice?',
      answer: 'No. It is an estimate based on a constant return you choose. Actual returns, taxes and fees will change the result.',
    },
  ],
};

export default docs;
