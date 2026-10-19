import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Content type** (**Text / URL**, **Wi-Fi**, **Email**, **Phone**, **SMS**, **Contact** or **Location**) and fill in its fields.',
    'Under **Appearance**, set the **Error correction** level, **Foreground** and **Background** colours, **Quiet zone** and **Size (px)**.',
    'Optionally **Add logo** to place an image in the centre. Error correction is then fixed at H.',
    'Check the **Preview** and any contrast or quiet-zone warnings, then download a **PNG** or **SVG**, or **Copy SVG**.',
  ],
  howItWorks:
    'The site’s own encoder builds the code, following ISO/IEC 18004 (QR Code model 2). It uses the most compact single mode the text fits: numeric for digits only, alphanumeric for upper-case letters, digits and ` $%*+-./:`, otherwise byte mode with UTF-8 text.\n\n' +
    'It picks the smallest version (1–40) that holds the data at the chosen error-correction level and adds Reed–Solomon error correction. It then tries all eight mask patterns and keeps the one with the lowest penalty score under the standard’s rules. The status line shows the version, level, mode and mask.\n\n' +
    'Other content types become the text formats scanners recognise: `WIFI:T:…;S:…;P:…;;` with special characters escaped, `mailto:` with an encoded subject and body, `tel:`, `SMSTO:number:message`, a vCard 3.0 contact and `geo:latitude,longitude`. Open **Encoded text** under the preview to see exactly what is stored (Wi-Fi passwords are masked there).\n\n' +
    'The SVG is a single path, with dark modules merged into horizontal runs. The PNG is drawn on a canvas with each module scaled to a whole number of pixels, so edges stay sharp. A logo sits on a background-coloured square about 22% of the code’s width; level H error correction lets scanners recover the hidden modules.',
  limits: [
    'Maximum data at version 40: 2,953 bytes at level L, 2,331 at M, 1,663 at Q and 1,273 at H. Non-ASCII characters take 2–4 bytes each in UTF-8.',
    'Each code uses a single encoding mode. Mixed-mode segments, Kanji mode, ECI, Structured Append and Micro QR are not supported.',
    'The PNG is the largest whole multiple of the module count that fits the chosen size, so its width can differ slightly from the **Size (px)** you entered (the SVG uses the exact size). Size is 64–4,096 px; the quiet zone is 0–16 modules.',
    'Logos must be PNG, JPEG, GIF, WebP or SVG and under 1 MB. Always test-scan a code with a logo before printing.',
    'Latitude must be between -90 and 90, and longitude between -180 and 180. Phone numbers keep only digits, `+`, `*` and `#`.',
  ],
  privacy:
    'The code is encoded and drawn entirely in your browser. Nothing is sent to a server or saved to browser storage. ' +
    '**Copy share link** puts the content type, text, Wi-Fi network name and security type, and appearance settings in the link’s `#` fragment, which browsers don’t send to servers. Wi-Fi passwords, email, phone, SMS, contact and location details, and logos are never included. ' +
    'Text sent here from another tool with **Send to…** is passed through `sessionStorage` and removed as soon as this page reads it.',
  faqs: [
    {
      question: 'Which error correction level should I choose?',
      answer:
        'L (about 7% recoverable) gives the smallest code. M (15%) is a good default. Q (25%) and H (30%) survive more damage or dirt but need a larger symbol for the same data. With a logo, H is used automatically.',
    },
    {
      question: 'Does the QR code expire or track scans?',
      answer:
        'No. The content is stored in the code itself, not behind a redirect. It works as long as the content (for example the URL) does, and nobody is notified when it is scanned.',
    },
    {
      question: 'Why does my code look denser than another generator’s?',
      answer:
        'Density depends on the amount of data, the error-correction level and the mode. Lower-case URLs need byte mode, which takes more space than the alphanumeric mode used for upper-case text and digits.',
    },
    {
      question: 'Will light colours or an inverted code scan?',
      answer:
        'Not reliably. Many scanners expect dark modules on a light background, so the tool warns when contrast is below 4:1 or the foreground is lighter than the background.',
    },
    {
      question: 'Should I download PNG or SVG?',
      answer: 'SVG scales to any size without blurring, so it suits print and design tools. PNG is a fixed-size image that works everywhere, including documents and chat apps.',
    },
  ],
};

export default docs;
