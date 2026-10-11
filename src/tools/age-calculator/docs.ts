// User docs for Age Calculator, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick your date of birth.',
    'Leave "Age at" as today, or pick another date to see your age on that day.',
    'Read your age in years, months and days, the totals, and the countdown to your next birthday.',
  ],
  howItWorks:
    'Both dates are treated as calendar days in UTC, so time zones and daylight saving never move a day. Years and months are counted first; leftover days are counted from your birth day in the previous month, clamped to that month’s length (31 January to 1 March is 1 month 1 day). Totals come from the exact number of days between the dates.',
  limits: [
    'Works with whole calendar days; times of day and time zones are not used.',
    'People born on 29 February have their birthday counted on 28 February in non-leap years.',
    'The date of birth must be on or before the "Age at" date.',
  ],
  privacy: 'Everything is calculated in your browser. The dates you enter are not stored, sent anywhere or put in the page address.',
  faqs: [
    {
      question: 'How are months with different lengths handled?',
      answer: 'Days are counted from your birth day in the previous month, using that month’s real length. If your birth day doesn’t exist in that month (for example the 31st), the last day of the month is used.',
    },
    {
      question: 'When does someone born on 29 February have a birthday?',
      answer: 'On 29 February in leap years and on 28 February in other years, which is the most common legal convention.',
    },
    {
      question: 'Can I find my age on a past or future date?',
      answer: 'Yes. Change the "Age at" date to any day on or after your date of birth.',
    },
  ],
};

export default docs;
