import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Add cities or IANA time zones with the search box (about 230 major cities are built in, and any zone such as `America/Chicago` can be found by name). The first city is the **base** and sets the date you see; use **Make base** to change it.',
    'Pick the date, and set each city’s working hours with **Works from** and **to** (default 09:00 to 17:00). Hours outside that range are grey, and slots where every city is working are outlined in green.',
    'Click a slot in the **Day planner** (or move with the arrow keys and press Enter). The **Selected time** panel shows that moment in every city.',
    'Copy the one-line summary, or set a title and length and **Download .ics** to add the meeting to any calendar app.',
  ],
  howItWorks:
    'The grid has one column per hour of the chosen date in the base city, starting at its local midnight. For each city the hour is converted with the browser’s `Intl.DateTimeFormat` time zone data (the same helpers the Timestamp Converter uses), so daylight saving is handled by your browser: on a clock-change day the grid has 23 or 25 columns, and a city whose clocks change that day is marked.\n\n' +
    'A slot counts as working time for a city when the slot’s start is at or after the start hour and before the end hour in that city’s local time (windows that cross midnight, such as 22:00 to 06:00, work too). Cities on half-hour offsets, such as India, show slots at :30. The overlap is the set of slots where every city is working.\n\n' +
    'The `.ics` file is written by this page: one `VEVENT` with start and end in UTC, the title, and the multi-city text as the description, with `\\`, `;`, `,` and line breaks escaped, lines folded at 75 bytes and CRLF line endings, as RFC 5545 requires.',
  limits: [
    'Slots are one hour wide, so meeting times on the half hour are not offered; zones with :30 or :45 offsets show their own minutes.',
    'Up to 12 cities. Working hours are whole hours, and the same hours apply every day (no weekends or holidays).',
    'The city list is a bundled selection, not every place. Any IANA zone your browser knows can be added instead; zone data comes from the browser, so very old browsers may be missing recent rule changes.',
    'The date is the calendar day in the base city. Slots of the selected moment from another day stay selected, but are not highlighted in the grid.',
    'The `.ics` event is a plain UTC event: no reminders, attendees or recurrence.',
  ],
  privacy:
    'Everything runs in your browser; the city list is bundled and no request is made for time data. Nothing is stored. **Share** copies a link with your cities, working hours, date and selected time in the URL’s `#` fragment, which browsers do not send to servers, though anyone with the link can read it.',
  faqs: [
    {
      question: 'Why does the grid have 23 or 25 columns on some days?',
      answer: 'On the day clocks change in the base city, that day is an hour shorter or longer. The planner counts real hours between local midnights, so no slot is skipped or doubled.',
    },
    {
      question: 'What does “everyone free” mean?',
      answer: 'Every city on the list is inside its own working hours for that slot. Change the hours per city if someone starts early or finishes late.',
    },
    {
      question: 'Which time does the .ics file use?',
      answer: 'The event is stored in UTC, so every calendar app shows it in the viewer’s own time zone. The description lists the time in each city.',
    },
    {
      question: 'Can I plan across a date line or a week boundary?',
      answer: 'Yes. A city whose local date differs from the base is marked in the grid at local midnight and in the selected-time text, for example “01:00 Tokyo (Wed 4 Oct)”.',
    },
  ],
};

export default docs;
