import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type or paste a number into **Unix timestamp**, or press **Use now** to load the current time in seconds. You can also drop a text file onto the field.',
    'Leave **Unit** on **Auto** to have seconds, milliseconds, microseconds or nanoseconds guessed from the number of digits, or pick `s`, `ms`, `µs` or `ns` yourself.',
    'Choose a **Time zone** to see the date there, alongside your local time and UTC, as ISO 8601, RFC 2822, a relative time, the day of the week, day of year and ISO week.',
    'To go the other way, set **Date and time** under **Date to timestamp** and pick **In time zone**. You get Unix seconds, milliseconds and the UTC ISO 8601 string.',
    'Use the copy buttons next to each value, or **Copy share link** to share the current inputs.',
  ],
  howItWorks:
    'The timestamp is read as a JavaScript number. Spaces, commas and underscores are ignored, and decimals, a sign and exponent notation (`1.7e9`) are accepted. In **Auto** mode the unit follows the size of the number: below 10^11 (up to 11 digits) it is seconds, below 10^14 milliseconds, below 10^17 microseconds, and anything larger nanoseconds. The value is then converted to milliseconds since 1970-01-01 UTC.\n\n' +
    'Dates in a time zone are worked out with the browser’s `Intl.DateTimeFormat`, so the time zone list and the daylight saving rules come from your browser. Offsets are shown next to each time, and ISO 8601 output uses `Z` when the offset is zero. The ISO week is the week containing that date’s Thursday, as ISO 8601 defines it.\n\n' +
    'For **Date to timestamp**, the wall-clock time is matched against the zone’s offsets. If a time happens twice because clocks went back, the earlier instant is used. If it doesn’t exist because clocks went forward, it is moved forward by the size of the gap.',
  limits: [
    'Dates must be within ±8.64e15 ms of 1970 (about ±275,760 years), the range of a JavaScript `Date`. Larger values are reported as out of range for the unit they were read as.',
    'The timestamp field only takes numbers. Date strings such as ISO 8601 or RFC 2822 are output formats here, not inputs; use **Date and time** to convert a date.',
    'Results are shown to the millisecond. Sub-millisecond digits of microsecond and nanosecond input aren’t displayed, and very long nanosecond values lose precision because they exceed the exact integer range of a JavaScript number.',
    '**Unix seconds** output is rounded down, so a fractional second is dropped.',
    'Auto-detection is a guess by size: a seconds value from after the year 5138, or a small millisecond value close to 1970, is read as the wrong unit. Pick the unit to override it.',
  ],
  privacy:
    'All conversions run in your browser with built-in date and `Intl` APIs. Nothing you enter is uploaded or saved. **Copy share link** puts your inputs, unit and time zones in the link’s `#` fragment, which browsers don’t send to servers, so anyone you give the link to can see them.',
  faqs: [
    {
      question: 'How does it tell seconds from milliseconds?',
      answer:
        'By the number of digits. Up to 11 digits is read as seconds, up to 14 as milliseconds, up to 17 as microseconds and longer values as nanoseconds. The status line says which unit was used, and the **Unit** buttons override the guess.',
    },
    {
      question: 'Can I convert negative timestamps?',
      answer: 'Yes. Negative values are dates before 1970-01-01 UTC and are converted the same way, back to the limit of the JavaScript date range.',
    },
    {
      question: 'What happens with a time skipped or repeated by daylight saving?',
      answer:
        'In **Date to timestamp**, a time that occurs twice when clocks go back gives the earlier instant. A time that doesn’t exist when clocks go forward is shifted forward by the size of the gap.',
    },
    {
      question: 'Why doesn’t the RFC 2822 date use my local time zone?',
      answer: 'It, the ISO 8601 (zone) row and the calendar details use the zone chosen in **Time zone**. Pick your own zone there to match your local time.',
    },
    {
      question: 'Where do the time zone rules come from?',
      answer:
        'From your browser’s built-in time zone data, through the `Intl` API. Historical offsets and future daylight saving changes are only as accurate as that data.',
    },
  ],
};

export default docs;
