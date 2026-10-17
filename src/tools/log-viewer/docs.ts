import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste logs, drop a file on the page, or use **Open file**. **Try an example** loads a sample.',
    'Toggle **level** chips to show only those levels; each chip shows how many entries have it.',
    'Narrow the list with **Contains text**, **field filters** such as `user.id=3 path=/api` (all must match), and a **From / To** time range.',
    'Click a row to expand it as pretty-printed JSON (or the full text of a multi-line entry), then use **Export filtered NDJSON** to download what matches.',
  ],
  howItWorks:
    'A line that starts with `{` and parses as a JSON object is a JSON entry:\n\n' +
    '- Level comes from `level`, `lvl`, `severity` or `loglevel` (text, or numbers 10 to 60 as used by pino).\n- Time comes from `time`, `timestamp`, `ts`, `@timestamp` and similar (ISO text, or epoch seconds or milliseconds).\n- Message comes from `msg` or `message`.\n\n' +
    'Any other line is plain text: an ISO timestamp (with `T` or a space, `.` or `,` fractions) followed by an optional level such as `INFO`, `[ERROR]` or `WARN:`. A line that starts with just a level is also understood. Indented lines with no timestamp join the entry above, so stack traces stay together.\n\n' +
    'Field filters match flattened paths (`user.name`) exactly, ignoring case. Only the rows in view are drawn. Exported plain-text lines become `{time, level, message}` objects so the result is valid NDJSON.',
  limits: [
    'Files up to 50 MB can be opened; larger ones are refused.',
    'Logs are parsed on the page itself, so very large files can pause it briefly.',
    'Nested JSON fields are searchable to 3 levels deep; arrays are matched as their JSON text.',
    'The time range uses your local time zone and leaves out entries without a readable timestamp.',
    'Level names beyond trace, debug, info, warn, error and fatal (and common aliases) are shown as “other”.',
  ],
  privacy:
    'Logs are read and filtered entirely in your browser; nothing is uploaded or stored. Logs often contain user data or tokens, so this tool has no share link. If you use **Send to…** elsewhere, text is passed through this tab’s session storage and removed as soon as the other tool reads it.',
  faqs: [
    {
      question: 'Why is an entry’s level “other”?',
      answer: 'No level field or level word was found, or its value isn’t one of the common names (trace, debug, info, warn/warning, error/err, fatal/critical).',
    },
    {
      question: 'How do I filter on a nested field?',
      answer: 'Use a dotted path such as `request.status=500`. The **Detected fields** list shows the paths found in your logs.',
    },
    {
      question: 'Can I export plain-text logs?',
      answer: 'Yes. Each text line is written as a JSON object with `time`, `level` and `message`, so the file is valid NDJSON.',
    },
  ],
};

export default docs;
