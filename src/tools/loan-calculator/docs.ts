import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Enter the **Loan amount**, the **Annual interest rate**, the tenure in years (plus extra months), the payment frequency (monthly, weekly, fortnightly or quarterly) and a start date.',
    'Read the EMI, total interest, total paid and the date of the last payment in the result box. The chart shows the principal and interest split and how the balance falls.',
    'To model prepayments, add a one-off amount with a date and/or an extra amount paid with every instalment, then choose whether to **Reduce tenure** (keep the EMI) or **Reduce EMI** (keep the tenure). The result shows the interest saved.',
    'Tick **Compare with a second loan** to see two loans side by side with the difference in EMI, interest and total paid, and switch which one the schedule shows.',
    'Browse the yearly summary and the paged schedule, or use **Download CSV** to save the schedule. Pick a currency (INR uses lakh grouping, 10,00,000) and copy a share link to send the setup.',
  ],
  howItWorks:
    'The payment is the standard EMI formula `P × r × (1 + r)^n ÷ ((1 + r)^n − 1)`, where `r` is the annual rate divided by the payments per year (12, 52, 26 or 4) and `n` is the number of payments. At a 0% rate the principal is simply divided by `n`. For 10,00,000 at 8.5% over 20 years the EMI is 8,678.23.\n\n' +
    'The schedule is built in whole minor units (paise or cents). Each period the interest on the opening balance is rounded to a minor unit, the rest of the EMI repays principal, and the last payment is set to the exact remaining balance plus interest, so the balance always ends at exactly 0 and the final instalment can differ from the EMI by a few minor units.\n\n' +
    'A one-off prepayment is applied with the first instalment on or after its date. With **Reduce tenure** the EMI stays and the loan finishes sooner; with **Reduce EMI** the payment is recalculated for the remaining payments after each prepayment. Interest saved is the total interest of the same loan with no prepayments minus the total interest with them. Monthly and quarterly dates keep the day of the month, falling back to the last day of shorter months.\n\n' +
    'Everything is calculated in your browser, and amounts are formatted with the browser’s `Intl.NumberFormat`.',
  limits: [
    'Interest is a fixed rate compounded once per payment period; variable rates, fees, insurance, moratoriums and part-month first periods are not modelled.',
    'Amounts must be positive and up to 1 trillion; the annual rate must be 0 to 100%; the tenure is whole years and months, at most 6,000 payments.',
    'Only one one-off prepayment per loan; use the extra amount for regular ones. A prepayment larger than the balance simply clears the loan.',
    'Weekly (52 a year) and fortnightly (26 a year) loans use 7- and 14-day steps from the start date, so a year of payments is not exactly one calendar year.',
    'Your bank’s own EMI may differ by a few units because of its rounding rules and day-count conventions.',
    'The schedule shows 24 payments per page; the CSV contains every payment.',
  ],
  privacy:
    'All calculations run in your browser and nothing is uploaded or stored; the site’s Content Security Policy blocks requests to other servers. **Copy share link** puts the loan details in the link’s `#` fragment, which browsers don’t send to servers. The CSV is created on your device.',
  faqs: [
    {
      question: 'How is the EMI calculated?',
      answer: 'With `P × r × (1 + r)^n ÷ ((1 + r)^n − 1)`, rounded to the nearest minor unit. The first payments are mostly interest and later ones mostly principal.',
    },
    {
      question: 'Should I reduce the tenure or the EMI after a prepayment?',
      answer: 'Reducing the tenure normally saves more interest because every later payment keeps paying principal at the original pace. Reducing the EMI lowers your monthly outgo but keeps you in debt for the full term. Try both and compare the interest saved.',
    },
    {
      question: 'Why is my last payment slightly different?',
      answer: 'Each period’s interest is rounded to a minor unit, so the last payment is adjusted to clear the balance exactly at zero.',
    },
    {
      question: 'Can I get the schedule in a spreadsheet?',
      answer: 'Yes: **Download CSV** saves period, date, payment, principal, interest, extra payment and balance as plain numbers that open in any spreadsheet.',
    },
  ],
};

export default docs;
