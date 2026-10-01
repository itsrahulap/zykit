import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type or paste a cron expression, or start from one of the **Presets**.',
    'Read the plain-English explanation, or fix any field marked with an error.',
    'Edit a field with the visual builder: every value, specific values, a range or a step.',
    'Pick a **Time zone** to see the next 10 run times as wall-clock times there (your own zone is the default).',
    'Turn on **Include seconds (6 fields)** for schedulers such as Quartz or Spring that take a leading seconds field.',
  ],
  howItWorks:
    'The expression is parsed field by field: minute, hour, day of month, month and day of week, with an optional seconds field first. Each field can be `*`, numbers, names (`JAN`–`DEC`, `SUN`–`SAT`), lists, ranges and steps, plus Quartz-style `?`, `L`, `L-n`, `LW`, `nW`, `nL` and `n#k`. The macros `@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly` and `@reboot` are expanded.\n\n' +
    'Next run times are found by walking forward day by day from now, matching each field, and converting wall-clock times in the chosen time zone to real instants with the browser’s `Intl` time-zone data. As in classic cron, when both day-of-month and day-of-week are restricted, a day matches if either one does. A time skipped when clocks go forward doesn’t run, and a time repeated when clocks go back runs once.',
  limits: [
    'Five fields, or six with seconds first. A seventh (year) field is not supported.',
    'Day-of-week numbers follow standard cron (0 or 7 = Sunday, 1 = Monday), not Quartz, where 1 = Sunday.',
    'Run times are searched up to 8 years ahead. A schedule that never or rarely occurs, such as 30 February, is reported as having no or only some runs.',
    '`@reboot` has no schedule, so no run times are shown for it.',
    'The explanation and run times follow these rules; individual schedulers (for example cloud schedulers or systemd timers) have their own dialects and may differ.',
  ],
  privacy:
    'Parsing, explaining and run-time calculation all happen in your browser; nothing is sent to a server. **Copy share link** puts the expression, time zone and selected field in the link’s `#` fragment, which browsers don’t send to servers.',
  faqs: [
    {
      question: 'Is Sunday 0 or 7?',
      answer: 'Both. Like standard cron, 0 and 7 both mean Sunday, and you can also write `SUN`.',
    },
    {
      question: 'Why does `0 0 13 * 5` run on more days than Friday the 13th?',
      answer:
        'When both day-of-month and day-of-week are restricted, classic cron runs on days that match *either* one: every 13th and every Friday. This tool follows the same rule.',
    },
    {
      question: 'How do I run something on the last day of the month?',
      answer: 'Use `L` in the day-of-month field, for example `0 0 L * *`. `L-2` means two days before the last day, and `LW` means the last weekday.',
    },
    {
      question: 'What happens around daylight saving time changes?',
      answer:
        'Times are evaluated on the wall clock of the selected time zone. A time that doesn’t exist because clocks jump forward is skipped, and a time that happens twice because clocks go back runs once, at the first occurrence.',
    },
    {
      question: 'Does it work for Quartz or Spring cron expressions?',
      answer:
        'Mostly. Six-field expressions with seconds and the Quartz specials (`?`, `L`, `W`, `#`) are supported, but day-of-week numbers use standard cron numbering, and the optional year field is not supported.',
    },
  ],
};

export default docs;
