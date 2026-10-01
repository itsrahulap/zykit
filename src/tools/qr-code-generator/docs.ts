import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Content type**: **Text / URL**, **Wi-Fi**, **Email**, **Phone**, **SMS**, **Contact** or **Location**, and fill in its fields.',
    'Under **Appearance**, choose the **Error correction** level, the **Foreground** and **Background** colours, the **Quiet zone** and the **Size (px)**.',
    'Optionally **Add logo** to place an image in the centre. Error correction is then fixed at H.',
    'Check the **Preview** and any warnings about contrast or the quiet zone, then download a **PNG** or **SVG**, or **Copy SVG**.',
  ],
  howItWorks:
    'The QR code is made by the site’s own encoder, written to ISO/IEC 18004 (QR Code model 2). It uses the most compact single mode the text fits: numeric for digits only, alphanumeric for upper-case letters, digits and ` $%*+-./:`, otherwise byte mode with the text as UTF-8. It then picks the smallest version (1–40) that holds the data at the chosen error-correction level, adds Reed–Solomon error correction, tries all eight mask patterns and keeps the one with the lowest penalty score under the standard’s rules. The status line shows the version, level, mode and mask.\n\n' +
    'The other content types are turned into the text formats scanners recognise: `WIFI:T:…;S:…;P:…;;` with special characters escaped, `mailto:` with an encoded subject and body, `tel:`, `SMSTO:number:message`, a vCard 3.0 contact card and `geo:latitude,longitude`. Open **Encoded text** under the preview to see exactly what is stored (Wi-Fi passwords are masked there).\n\n' +
    'The SVG is a single path with the dark modules merged into horizontal runs. The PNG is drawn on a canvas with each module scaled to a whole number of pixels so edges stay sharp. A logo is drawn over a background-coloured square covering about 22% of the code’s width; the H level’s error correction lets scanners recover the hidden modules.',
  limits: [
    'Maximum data at version 40: 2,953 bytes at level L, 2,331 at M, 1,663 at Q and 1,273 at H. Non-ASCII characters take 2–4 bytes each in UTF-8.',
    'Each code uses a single encoding mode; mixed-mode segments, Kanji mode, ECI, Structured Append and Micro QR are not supported.',
    'The PNG is the largest whole multiple of the module count that fits the chosen size, so its width can differ slightly from the **Size (px)** you entered (the SVG uses the exact size). Size is 64–4,096 px and the quiet zone 0–16 modules.',
    'Logos must be PNG, JPEG, GIF, WebP or SVG and under 1 MB. Always test-scan a code with a logo before printing.',
    'Latitude must be between -90 and 90 and longitude between -180 and 180. Phone numbers keep only digits, `+`, `*` and `#`.',
  ],
  privacy:
    'The code is encoded and drawn entirely in your browser; nothing is sent to a server or saved to browser storage. **Copy share link** puts the content type, the text, the Wi-Fi network name and security type and the appearance settings in the link’s `#` fragment, which browsers don’t send to servers. Wi-Fi passwords, email, phone, SMS, contact and location details and logos are never included. Text sent here from another tool with **Send to…** is passed through `sessionStorage` and removed as soon as this page reads it.',
  faqs: [
    {
      question: 'Which error correction level should I choose?',
      answer:
        'L (about 7% recoverable) gives the smallest code, M (15%) is a good default, Q (25%) and H (30%) survive more damage or dirt but need a larger symbol for the same data. With a logo, H is used automatically.',
    },
    {
      question: 'Does the QR code expire or track scans?',
      answer:
        'No. The content is stored directly in the code, not behind a redirect, so it works for as long as the content itself (for example the URL) does, and nobody is notified when it is scanned.',
    },
    {
      question: 'Why does my code look denser than another generator’s?',
      answer:
        'Density depends on how much data there is, the error-correction level and the mode. Lower-case URLs need byte mode, which takes more space than the alphanumeric mode used for upper-case text and digits.',
    },
    {
      question: 'Will light colours or an inverted code scan?',
      answer:
        'Not reliably. The tool warns when the foreground and background contrast is below 4:1, and when the foreground is lighter than the background, because many scanners expect dark modules on a light background.',
    },
    {
      question: 'Should I download PNG or SVG?',
      answer: 'SVG scales to any size without blurring, which suits print and design tools. PNG is a fixed-size image that works everywhere, including in documents and chat apps.',
    },
  ],
};

export default docs;
