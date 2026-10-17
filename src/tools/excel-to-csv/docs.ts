// User docs for Excel to CSV / JSON, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose an Excel .xlsx file.',
    'Pick the sheet you want and check the preview.',
    'Choose CSV, TSV or JSON (for JSON, say whether the first row is the header).',
    'Download the sheet, or download every sheet at once as a ZIP.',
  ],
  howItWorks:
    'An .xlsx file is a ZIP of XML files. The tool unzips it in your browser and reads the sheet list, the shared text table and the cell styles.\n\n' +
    'Each cell becomes text: shared and inline strings, numbers, TRUE/FALSE, error codes, and dates (cells with a date format) as ISO dates. Merged cells are filled with their value, and empty trailing rows and columns are dropped.',
  limits: [
    'Only .xlsx and .xlsm files; legacy .xls and password-protected workbooks are rejected.',
    'Files up to 100 MB and 5 million cells.',
    'Shows stored values, not number formatting (currency symbols, thousands separators or rounding as shown in Excel).',
    'Formulas are exported as their last calculated value; charts, images and comments are ignored.',
  ],
  privacy: 'The workbook is read entirely in your browser. Nothing is uploaded, stored or put in the page address.',
  faqs: [
    {
      question: 'Why does a date show as 2024-01-31 instead of 31/01/2024?',
      answer: 'Dates are exported in the ISO format (year-month-day) so they sort correctly and import into any tool without ambiguity.',
    },
    {
      question: 'Can I convert an old .xls file?',
      answer: 'Not directly. Open it in Excel, LibreOffice or Google Sheets, save it as .xlsx, then convert that file.',
    },
    {
      question: 'What happens to merged cells?',
      answer: 'Every cell in a merged range gets the merged value, so each row of the export is complete.',
    },
  ],
};

export default docs;
