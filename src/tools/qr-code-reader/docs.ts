import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Click **Choose image**, drop an image onto the box, or paste one with Ctrl+V (or Cmd+V). Screenshots and photos both work.',
    'Read the **Result**: the content type (link, Wi-Fi, contact, email, text message, phone, location or plain text), its fields and any warnings.',
    'Check links before you use them. The address is shown as text and never opened for you; use **Copy** to take it elsewhere.',
    'Wi-Fi passwords are masked. Press **Show password** to reveal the password and the raw content.',
  ],
  howItWorks:
    'Your browser decodes the image with its EXIF rotation applied, then draws it to a canvas, downscaled so the longest side is at most 2,000 px. If your browser has the built-in `BarcodeDetector`, it is tried first.\n\n' +
    'Otherwise, or if it finds nothing, the site’s own decoder runs:\n\n' +
    '- Converts to greyscale and picks a black/white threshold (Otsu’s method).\n' +
    '- Finds the three square finder patterns by their 1:1:3:1:1 run ratio and samples the module grid from them.\n' +
    '- Reads the format information (tolerating a few flipped bits), removes the mask and collects the codewords.\n' +
    '- Repairs damaged codewords with Reed–Solomon error correction and decodes numeric, alphanumeric and byte segments (UTF-8, falling back to Latin-1).\n\n' +
    'Light-on-dark codes are tried too. The status line says which decoder was used and, for the built-in one, the version, error-correction level and how many codewords were repaired.\n\n' +
    'The text is then classified: `WIFI:` credentials, vCard contacts, `mailto:`, `sms:`/`SMSTO:`, `tel:`, `geo:` and links. Links are checked for non-http(s) schemes, bare IP addresses, `user:password@` tricks, and international (punycode, `xn--`) host names that can imitate well-known sites.',
  limits: [
    'The built-in decoder expects a clean, roughly straight-on code with a visible light border. Strong perspective, heavy blur, glare, curved surfaces and very small codes may fail; the browser’s `BarcodeDetector` copes better where it exists.',
    'The built-in decoder reads one code per image. It does not read mirrored codes or support Kanji, structured append, FNC1 or Micro QR. ECI markers are skipped and the text is read as UTF-8.',
    'Images are limited to 50 MB and 100 megapixels. There is no camera scanning; take a photo or screenshot and load it.',
    'Warnings are heuristics. A link with no warning can still be harmful, so only visit addresses you trust.',
  ],
  privacy:
    'The image is read entirely in your browser. It is never uploaded, and the result is not saved or put in a share link. Wi-Fi passwords stay masked until you choose to show them, and nothing you scan is opened or requested automatically.',
  faqs: [
    {
      question: 'Why does it say no QR code was found?',
      answer:
        'The code may be too small, blurred, cropped or at an angle. Try a larger, sharper image of the whole code with a light margin, and crop out other barcodes or busy patterns.',
    },
    {
      question: 'Is it safe to scan a code from an unknown source?',
      answer:
        'Reading is safe because nothing is opened for you, but the content may not be. Check the address and warnings, and be careful with Wi-Fi codes and contact cards from strangers.',
    },
    {
      question: 'What does the international-characters warning mean?',
      answer:
        'Some alphabets have letters that look identical to Latin ones, so a link can look like a trusted site but point elsewhere. The warning appears when the host name contains such characters or is written in punycode (`xn--…`).',
    },
    {
      question: 'Does it read barcodes other than QR codes?',
      answer: 'No, only QR codes. Use the barcode generator to make Code 128, EAN, UPC and similar barcodes.',
    },
  ],
};

export default docs;
