import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Time zone** at the top. Dates and times you enter are read as wall-clock time in that zone.',
    'Choose **Difference** and set **Start** and **End** to see the time between them in years, months, days, hours, minutes and seconds, plus exact totals. **Swap dates** reverses them.',
    'Choose **Add / subtract**, set **Start**, pick **Add** or **Subtract** and fill in any of **Years**, **Months**, **Weeks**, **Days**, **Hours**, **Minutes** and **Seconds**.',
    'Choose **Business days**, set **Start date** and **End date**, pick a **Weekend** and optionally list **Holidays** to count working days. Enter a number under **Add business days** to find the working day that many days later or, if negative, earlier.',
    'Use **Copy share link** to share the calculation, including the holiday list.',
  ],
  howItWorks:
    'Times are converted to instants with the browser’s `Intl` time zone data, so daylight saving changes in the chosen zone are taken into account. A **Difference** is broken down on the wall clock: whole months are counted first, then the remaining days, hours, minutes and seconds. The totals (days, weeks, hours, minutes, seconds) are exact elapsed time. If a daylight saving change falls in the range, a note shows how much the two differ.\n\n' +
    '**Add / subtract** works like the upcoming JavaScript Temporal API. Years and months move the calendar date, and if the day doesn’t exist in the target month it is clamped to the month’s last day (31 January + 1 month is 28 or 29 February). Weeks and days move whole calendar days and keep the same clock time, even across a daylight saving change. Hours, minutes and seconds are added as exact elapsed time. If the result lands in a daylight saving gap, it is moved later and a note says so.\n\n' +
    '**Business days** uses dates only. The count includes both the start and end date, like a spreadsheet’s `NETWORKDAYS`, and skips weekend days and holidays. **Add business days** works like `WORKDAY`: the start date itself doesn’t count, and 0 returns the start date.',
  limits: [
    'Duration fields take whole numbers only, up to 1,000,000 each. Results of **Add / subtract** must fall in the years 1–9999.',
    'Business day counts are limited to ranges of 366,000 days (about 1,000 years), and **Add business days** to ±100,000 working days.',
    'Holidays must be written as `YYYY-MM-DD`, one per line or separated by commas or semicolons. Text after a date is ignored, as are lines starting with `#`. Other lines are listed as invalid and skipped.',
    'There are no built-in public holiday calendars; only the dates you enter are skipped. Weekends can be Sat–Sun, Fri–Sat, Sun only or none.',
    'Time zone names and daylight saving rules come from your browser, so very old or future rule changes are only as accurate as its data.',
  ],
  privacy:
    'All calculations run in your browser. Nothing you enter is uploaded or saved. **Copy share link** puts your dates, durations, settings and holiday list in the link’s `#` fragment, which browsers don’t send to servers, so anyone you give the link to can see them.',
  faqs: [
    {
      question: 'Why does adding 1 month to 31 January give the end of February?',
      answer:
        'February has no 31st, so the day is clamped to the last day of February. That is also why adding a month and then subtracting one doesn’t always bring you back to the start date.',
    },
    {
      question: 'Is 1 day the same as 24 hours?',
      answer:
        'Not across a daylight saving change. Adding 1 day keeps the same clock time on the next day, which can be 23 or 25 real hours. Adding 24 hours adds exactly 24 hours of elapsed time.',
    },
    {
      question: 'Are the start and end dates included in the business day count?',
      answer:
        'Yes, both are counted, like `NETWORKDAYS` in a spreadsheet. **Add business days** is different: like `WORKDAY`, it starts counting from the day after the start date.',
    },
    {
      question: 'Does it know public holidays?',
      answer: 'No. Paste your own holiday dates as `YYYY-MM-DD`, for example `2025-12-25 Christmas`, one per line. Holidays that fall on a weekend aren’t counted twice.',
    },
    {
      question: 'Why does the difference say 1 month and 1 day from 31 January to 1 March?',
      answer:
        'Months are counted first by moving the start date forward a month at a time, with month-end clamping. 31 January plus 1 month is the end of February, and 1 March is one day after that.',
    },
  ],
};

export default docs;
