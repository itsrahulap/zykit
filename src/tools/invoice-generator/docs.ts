// User docs for Invoice Generator, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Fill in **From** (your name, address, tax ID, and an optional PNG or JPEG logo), **Bill to**, the invoice number, dates and currency.',
    'Add **line items**: description, quantity, unit price, tax % and discount %. The amount per line and the totals (subtotal, discount, tax per rate, total) update as you type.',
    'Add payment details, notes and terms, then press **Download PDF**, or **Print** to use the preview below the form.',
    'Use **Export JSON** to keep a copy of the draft or move it to another device, and **Import JSON** to load it. **New invoice** starts over.',
  ],
  howItWorks:
    'Money never uses floating-point numbers. Prices are read as decimal text and stored as integers in the currency’s minor units (cents for USD, none for JPY, three digits for KWD, from `Intl.NumberFormat`). Quantity is held in thousandths, percentages in hundredths of a percent, and products use big integers.\n\n' +
    'For each line: amount = quantity × price, rounded half up to a minor unit; discount = amount × discount %, rounded; tax = (amount − discount) × tax %, rounded. Tax is added up per rate, so a mixed 5% and 20% invoice shows two tax rows.\n\n' +
    'The PDF is written with `pdf-lib` (loaded only when you press the button) on an A4 page with the standard Helvetica fonts. Descriptions wrap, and the table header repeats if the invoice runs onto more pages. Amounts use the currency code (for example `EUR 1,234.50`) so every currency prints correctly.',
  limits: [
    'The PDF uses standard fonts, which cover Latin text (Western European languages, € and common punctuation). Other scripts, such as Cyrillic, Greek, Arabic, Hindi or Chinese, can’t be drawn; those characters appear as `?` in the PDF, and a warning lists them before you download.',
    'Quantity allows up to 3 decimals, tax and discount up to 2 decimals (0 to 100), and the unit price as many decimals as the currency has. Anything else is flagged on the line and the PDF is not created until it is fixed.',
    'Up to 200 line items. The logo must be PNG or JPEG, up to 1 MB. Discount is a percentage per line, not a fixed amount; there is no invoice-level discount, shipping line or tax-inclusive pricing.',
    'Tax is rounded per line, then added up. Some jurisdictions require rounding on the invoice total instead, so the cents can differ by a small amount from your accounting software.',
    'The currency list is fixed to 20 common codes. This tool produces a document, not a legally validated e-invoice (no e-invoice XML, numbering sequence or tax rules).',
    'The draft is saved in this browser’s local storage; it can be lost if you clear site data or use a private window, so export JSON for anything you need to keep. **Print** uses the browser’s print dialog and may include parts of the page around the preview; the PDF button gives the cleaner result.',
  ],
  privacy:
    'Everything happens in your browser. Your invoice and logo are never uploaded. The draft is stored in this browser’s local storage under `zykit-invoice` so it survives a reload; **New invoice** replaces it, and clearing site data removes it. Exported JSON and PDFs are files you save yourself.',
  faqs: [
    { question: 'Why are some characters shown as question marks in the PDF?', answer: 'Standard PDF fonts only contain Western European (Windows-1252) characters. Text in other scripts needs a font embedded in the file, which this tool does not include. The warning above the form tells you which characters are affected.' },
    { question: 'How is tax calculated when I have different rates?', answer: 'Each line’s tax is rounded to the currency’s smallest unit, then the taxes are added up per rate. The totals show one tax row per rate with its taxable amount.' },
    { question: 'Why are prices shown with the currency code in the PDF?', answer: 'Symbols such as ₹ or ₫ aren’t in the standard fonts. The three-letter code is plain Latin text and unambiguous. The form on screen uses your browser’s usual currency symbols.' },
    { question: 'Can I reuse an invoice?', answer: 'Yes. Export the JSON, or just change the invoice number and dates on the saved draft and download again.' },
  ],
};

export default docs;
