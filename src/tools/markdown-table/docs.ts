import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    "Pick the **Input**: **CSV / TSV** (the delimiter is detected), **JSON** (an array of objects or arrays), **Grid** (type into cells) or **Format table** (clean up a Markdown table you already have).",
    "Paste or open your data, or use **Try an example**. In **Grid** mode, **Add row** / **Add column** grow the table; the first row is the header. **Edit in grid** moves parsed data into the grid.",
    "Set each column’s alignment under **Column alignment**. Tick or clear **Pad columns to equal width** for aligned or compact output.",
    "Copy the table, **Download .md** or **Send to…** another tool.",
  ],
  howItWorks:
    "CSV and TSV go through the shared RFC 4180 parser (quotes, embedded line breaks, delimiter detection). JSON arrays of objects use the union of their keys as the header; arrays of arrays use the first row as the header; a plain array gets one `value` column. Cells are escaped (`|` becomes `\\|`, line breaks become `<br>`), then every column is padded to its widest cell. Width is measured in display columns, so CJK characters and emoji count as two and combining marks as zero, which keeps the pipes aligned in a monospace font. Alignment becomes `:---`, `:-:` or `---:` in the delimiter row. **Format table** finds the first table in your text, reads its alignment and rewrites it padded without escaping its cells a second time.",
  limits: [
    "Input can be up to 5,000,000 characters (about 5 MB); CSV is limited to 20,000 rows.",
    "The first row is always the header, because GFM tables require one.",
    "Padding is exact only in monospace fonts; some emoji sequences and fonts render at other widths.",
    "Nested JSON values are written as compact JSON text.",
    "**Format table** handles the first table in the text and drops everything around it.",
  ],
  privacy:
    "Your data is converted in your browser and never uploaded or stored. **Share** puts the input, grid and options in the link’s `#` fragment, which browsers don’t send to servers; large tables show *Too large to share*. Text sent here or from here with **Send to…** passes through this tab’s session storage and is removed as soon as the receiving tool reads it.",
  faqs: [
    { question: "How do I get a table out of a spreadsheet?", answer: "Copy the cells and paste them into **CSV / TSV**: spreadsheets copy as tab-separated text, which is detected automatically." },
    { question: "Why does my pipe character show as `\\|`?", answer: "A bare `|` would end the cell, so it is escaped. Markdown renderers show it as `|`." },
    { question: "Can a column be centered?", answer: "Yes: choose Center for it under **Column alignment**." },
    { question: "Why compact output?", answer: "Clear **Pad columns to equal width** to get `| a | b |` with no extra spaces, which is smaller and renders the same." },
  ],
};

export default docs;
