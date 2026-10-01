import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste CSV into **CSV input**, drop a file on it, or use **Open file**. **Try an example** loads a 2,000-row sample.',
    'In **Table options**, set the **Delimiter** (or leave it on **Detect**) and choose whether the **First row is a header**.',
    'Click a column header to sort it ascending, then descending, then back to the original order. Type in **Search all columns…** or in a column’s **Filter…** box to narrow the rows. Hide columns under **Columns**.',
    'Pick a column under **Column stats** to see its type, empty and unique counts, and min, max and mean for numbers.',
    'Use the copy button on a row to copy it, or **Export view** (Ctrl/⌘ + S) to download the visible columns and filtered rows in their current order.',
  ],
  howItWorks:
    'The text is parsed in a background worker with the same RFC 4180 parser as the CSV ↔ JSON tool. It handles quoted fields with delimiters, `""` and line breaks inside them, and skips blank lines. **Detect** tries comma, semicolon, tab and pipe on up to the first 30 lines and picks the one that splits them most consistently. Opening a `.tsv` file switches the delimiter to tab. Short rows are padded with empty cells. Blank header names become `Column 1`, `Column 2`…, and repeated names get ` (2)`, ` (3)`…\n\n' +
    'Each column gets a type from all of its non-empty values. It is **number** if every value is a plain decimal or exponent number, **boolean** if every value is `true`, `false`, `yes` or `no`, and **date** if every value is an ISO date such as `2024-03-01` or `2024-03-01T10:00:00Z`. Anything else is **text**. Number columns are right-aligned, sorted by value, and get min, max and mean. Text and date columns show their first and last value in A→Z order.\n\n' +
    'Searching and filtering are case-insensitive “contains” matches. The global search only looks in visible columns, and a row must match every column filter. Text sorting is case-insensitive and orders embedded numbers naturally (`item2` before `item10`). Empty cells always sort last. Only the rows on screen are drawn, so large tables stay responsive.',
  limits: [
    'Opened or dropped files can be up to 200 MB. Input over 1,000,000 characters isn’t shown in the text box, only its name and size.',
    'At most 1,000,000 data rows are loaded. A notice says when the rest were cut off.',
    'Delimiters are comma, semicolon, tab and pipe only. Values are read as text, so numbers with thousands separators or decimal commas (`1.234,5`) count as text.',
    'Only ISO-style dates (`YYYY-MM-DD`, optionally with a time) are recognised as dates.',
    'The first 3 parse problems are listed, such as an unclosed quote or text after a closing quote. The table is still shown.',
    'Column stats always cover every row, not just the filtered view. This is a viewer: cells can’t be edited.',
  ],
  privacy:
    'Files are read and parsed in your browser, in a background worker, and never uploaded. The site’s security policy blocks requests to other servers. Nothing is stored and there is no share link. CSV sent here from another tool with **Send to…** is passed through this tab’s session storage and removed as soon as it is read.',
  faqs: [
    {
      question: 'Can it open very large CSV files?',
      answer:
        'Yes, up to 200 MB and 1,000,000 data rows. Parsing happens in a background worker, and only the rows on screen are drawn, so scrolling stays smooth even with hundreds of thousands of rows.',
    },
    {
      question: 'Why is a numeric column sorted like text?',
      answer:
        'A column is only treated as numbers when every non-empty value is a plain number. One value such as `N/A`, `12%` or `1,200` makes it a text column. Text still sorts embedded numbers naturally, so `9` comes before `10`.',
    },
    {
      question: 'What does Export view include?',
      answer:
        'The visible columns and the rows that match your search and filters, in the current sort order, with a header row. It uses the table’s delimiter and downloads as `<name>-filtered.csv`, or `.tsv` for tab-separated data.',
    },
    {
      question: 'Do the column stats follow my filters?',
      answer: 'No. **Column stats** always cover every row of the column, so filtering doesn’t change the min, max, mean or counts.',
    },
    {
      question: 'Can I view a file without a header row?',
      answer: 'Yes. Untick **First row is a header** and the columns are named `Column 1`, `Column 2`… with the first line shown as data.',
    },
  ],
};

export default docs;
