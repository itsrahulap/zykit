import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Direction**: **CSV → JSON** or **JSON → CSV**.',
    'Paste your data, drop a file on the input, or use **Open file**. **Try an example** fills in a sample.',
    'For CSV → JSON, choose the **Delimiter** (or leave it on **Detect**), **Objects** or **Arrays** output, and options such as **First row is a header** and **Detect numbers and booleans**.',
    'For JSON → CSV, choose the output **Delimiter** and whether to include a **Header row**, **Flatten nested objects (a.b)**, **Quote every field** or use **Windows line endings (CRLF)**.',
    'Copy or download the result, or press **Swap** to turn the output into the new input and convert it back.',
  ],
  howItWorks:
    'CSV is read with an RFC 4180 parser in a single pass: fields can be quoted, `""` inside quotes is a literal quote, and quoted fields may contain delimiters and line breaks. Line endings can be LF, CRLF or a lone CR, and a leading byte-order mark is ignored. **Detect** tries comma, semicolon, tab and pipe on up to the first 30 lines and picks the one that splits them most consistently.\n\n' +
    'With a header, each row becomes an object keyed by column name. Blank column names become `column_1`, `column_2`…, and repeated names get a suffix (`name_2`). With **Detect numbers and booleans** on, `true`/`false` (also `TRUE`, `True`…) become booleans, `null`/`NULL` becomes null, and JSON-style numbers become numbers.\n\n' +
    'JSON → CSV takes an array of objects, an array of arrays, an array of plain values or a single object. For objects, the columns are every key that appears, in the order first seen. Nested objects become `a.b` columns when flattening, and arrays (or nested objects when not flattening) are written as JSON text. Fields are quoted only when they contain the delimiter, a quote, a line break or leading or trailing whitespace. Conversion runs in the page as you type.',
  limits: [
    'Pasted input is limited to about 25 MB (25 million characters); opened or dropped files to 10 MB.',
    'Delimiters are comma, semicolon, tab and pipe only. Values are taken as text, so there is no locale handling such as decimal commas.',
    'Numbers keep their exact text if they can’t round-trip: integers beyond 2^53 (long IDs) stay strings, and so do values with leading zeros (`007`), a leading `+` or a bare decimal point (`.5`).',
    'An unclosed quote or text after a closing quote is reported but still converted. Only the first 3 problems are listed, and rows with a different number of fields than the header are counted.',
    'Output longer than 1 million characters is only partly shown on screen; copy or download to get all of it.',
  ],
  privacy:
    'Conversion happens entirely in your browser and files are read locally; nothing is uploaded or stored. **Share** copies a link with your input and options in the URL’s `#` fragment, which browsers don’t send to servers, though anyone with the link can read it. If you use **Send to…** to open the result in another tool, it is handed over through this tab’s session storage and removed as soon as that tool reads it.',
  faqs: [
    {
      question: 'Why did my ID column stay as strings?',
      answer:
        'Integers larger than 2^53 can’t be represented exactly as JSON numbers in JavaScript, so they are kept as strings instead of being silently rounded. Values like `007` also stay strings so the leading zero isn’t lost.',
    },
    {
      question: 'How are nested objects written to CSV?',
      answer:
        'With **Flatten nested objects (a.b)** on, `{"address": {"city": "Lisbon"}}` becomes an `address.city` column. With it off, or for arrays, the value is written as JSON text in a single cell.',
    },
    {
      question: 'What happens to rows with missing or extra fields?',
      answer:
        'In **Objects** output, missing fields are filled with an empty string (or null with **Empty cells as null**), and extra fields get generated column names. A notice tells you how many rows had a different number of fields than the header.',
    },
    {
      question: 'Can it convert TSV or semicolon-separated files?',
      answer: 'Yes. **Detect** recognises tab, semicolon and pipe as well as comma, or you can choose the delimiter yourself. JSON → CSV with **Tab** downloads as a `.tsv` file.',
    },
    {
      question: 'Can I open the CSV in Excel afterwards?',
      answer:
        'Yes. Turn on **Windows line endings (CRLF)** if your tools expect them. The output is plain text without a byte-order mark, so Excel may need to be told the file is UTF-8 when it contains non-ASCII characters.',
    },
  ],
};

export default docs;
