import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Barcode type**: **Code 128**, **Code 39**, **EAN-13**, **EAN-8**, **UPC-A** or **ITF-14**, and enter the **Text or number**. The line under the field says what that type accepts.',
    'For EAN, UPC and ITF, leave off the last digit to have the check digit added, or enter it to have it verified. For Code 128 you can force code set **A**, **B** or **C**. For Code 39 you can add a mod-43 check character.',
    'Under **Appearance**, set the **Bar width**, **Height**, **Quiet zone**, the **Bars** and **Background** colours, and whether to **Show text under the bars**.',
    'Check the **Preview**, then download a **PNG** or **SVG**, or **Copy SVG**. Always test-scan a printed barcode.',
  ],
  howItWorks:
    'Each barcode is made by the site’s own encoder:\n\n' +
    '- **Code 128** picks the shortest sequence of symbols across code sets A (upper case and control characters), B (upper and lower case) and C (digit pairs), then adds a weighted modulo-103 check symbol and the stop pattern.\n' +
    '- **Code 39** uses the 43-character set with `*` start and stop characters and a 1:3 narrow-to-wide ratio.\n' +
    '- **EAN-13** encodes its first digit in the L/G parity pattern of the left half. **EAN-8** and **UPC-A** (an EAN-13 with a leading 0) use the same digit patterns. The check digit is the GS1 modulo-10 digit.\n' +
    '- **ITF-14** interleaves digit pairs (bars carry one digit, spaces the next) with a 1:3 ratio.\n\n' +
    'The bars are laid out once, on whole pixels, and both outputs use that layout. The SVG is a single path of merged bars plus text. The PNG is drawn on a canvas at the same size, so one bar-width unit is one pixel. The status line shows the data actually encoded and the check digit.',
  limits: [
    'Text is limited to 200 characters. Code 128 handles ASCII only; function characters (FNC1–FNC4) and the shift symbol are not used. Code 39 handles A–Z, 0–9, space and `- . $ / + %`; lower case is converted to upper case, and Full ASCII mode is not supported.',
    'EAN-13, EAN-8, UPC-A and ITF-14 take digits only (spaces and hyphens are ignored); a wrong check digit is rejected. UPC-E, EAN add-ons and ITF-14 bearer bars are not drawn, and EAN/UPC guard bars are not lengthened.',
    'Bar width is 1–10 px, height 20–400 px and the quiet zone 0–20 modules. Very narrow bars may print too fine to scan, and a quiet zone under 10 modules can stop scanners reading the code.',
    'The human-readable text uses your system’s monospace font, not OCR-B. Colours must be `#rrggbb`; low-contrast pairs may not scan.',
  ],
  privacy:
    'Barcodes are made entirely in your browser; nothing is sent to a server or saved. **Copy share link** puts the type, text and appearance settings in the link’s `#` fragment, which browsers do not send to servers. Anyone with the link can read the text, so don’t share links for private text.',
  faqs: [
    {
      question: 'Which barcode type should I use?',
      answer:
        'Use EAN-13 or UPC-A for retail products (the number comes from GS1), ITF-14 for outer cartons, Code 128 for general text, serial numbers and shipping labels, and Code 39 for older systems and simple upper-case labels.',
    },
    {
      question: 'Why is my EAN or UPC rejected?',
      answer:
        'It has something other than digits, the wrong length, or a wrong check digit (the last digit). Enter one digit fewer and the correct check digit is added for you.',
    },
    {
      question: 'What is the quiet zone?',
      answer: 'The blank margin on each side of the bars. Scanners need it to find where the code starts and ends, so leave at least 10 modules.',
    },
    {
      question: 'Should I download PNG or SVG?',
      answer: 'SVG stays sharp at any size, which suits print. PNG is a fixed-size image that works everywhere; raise the bar width for a larger one.',
    },
  ],
};

export default docs;
