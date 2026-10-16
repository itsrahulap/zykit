import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Direction**: **TOML → JSON** or **JSON → TOML**.',
    'Paste into the input, drop a file on it, or use **Open file**. A `.toml` or `.json` file picks the direction for you. **Try an example** fills in a sample.',
    'For TOML → JSON, choose the **JSON indent**. Errors show the line and column, and **Jump to error in input** moves the cursor there.',
    'Copy or download the result, or press **Swap** to turn the output into the new input and convert it back.',
  ],
  howItWorks:
    'TOML is read by this site’s own TOML 1.0 parser. It supports tables, array tables (`[[x]]`), inline tables, dotted keys, bare and quoted keys, basic, literal and multi-line strings with all escapes, integers (decimal, `0x`, `0o`, `0b`, with `_` separators), floats including `inf` and `nan`, booleans, dates, times, datetimes and mixed-type arrays.\n\n' +
    'It rejects what the spec rejects: duplicate keys, redefined tables, extending inline tables or static arrays, leading zeros, invalid dates and bad escapes.\n\n' +
    'JSON has no date type, so dates and times become strings with their original text (`1979-05-27T07:32:00Z`). JSON → TOML writes scalar keys first, then `[tables]` and `[[arrays of tables]]`. Arrays of objects become array tables; other arrays are written inline. Keys that aren’t bare are quoted.',
  limits: [
    'Input is limited to about 5 MB; opened or dropped files to 10 MB.',
    'TOML 1.0 only: TOML 1.1 additions (optional seconds in times, newlines in inline tables, `\\e` and `\\xHH` escapes) are reported as errors.',
    'Integers beyond 2^53 lose precision in JSON (a notice says so); integers outside 64 bits are an error. `inf` and `nan` become `null` in JSON.',
    'JSON → TOML needs an object at the top level. `null` values are left out, because TOML has no null. Whole numbers such as `1.0` become integers, since JSON does not tell them apart.',
    'Comments and formatting are not kept.',
  ],
  privacy:
    'Conversion runs in your browser and files are read locally. Nothing is uploaded or stored. **Share** copies a link with your input and options in the URL’s `#` fragment; browsers don’t send that to servers, but anyone with the link can read it. **Send to…** passes the result through this tab’s session storage, removed as soon as the other tool reads it.',
  faqs: [
    {
      question: 'Why do dates come out as strings?',
      answer: 'JSON has no date type, so the original TOML text is kept as a string. Offset datetimes, local datetimes, local dates and local times are all supported.',
    },
    {
      question: 'Why was my null value dropped?',
      answer: 'TOML has no null. Keys with `null` are left out, and nulls inside arrays are removed; a notice tells you how many.',
    },
    {
      question: 'What does “Table is already defined” mean?',
      answer: 'TOML forbids writing the same `[table]` twice, or reopening a table made by an inline table or dotted keys. Merge the two into one section.',
    },
  ],
};

export default docs;
