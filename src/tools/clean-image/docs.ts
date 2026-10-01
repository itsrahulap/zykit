import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Drop a JPEG, PNG or WebP image, or click **Choose a file**.',
    'Review what the file contains: privacy-sensitive fields such as GPS and camera details, generator information and C2PA Content Credentials.',
    'Choose **Clean privacy metadata** (keeps the color profile) or **Remove all supported metadata**, and decide whether to keep the image orientation.',
    'Click **Clean image**, check the validation report, and download the cleaned copy. Your original file is never changed.',
  ],
  howItWorks:
    'The file is read in a background Web Worker. A structure walker for each format (JPEG segments, PNG chunks, WebP RIFF chunks) classifies every container as metadata or image data, and parsers read EXIF, XMP, IPTC, ICC and C2PA from the metadata containers.\n\n' +
    'Cleaning removes containers instead of re-encoding: the new file is rebuilt from the original’s kept byte ranges, so the compressed pixel data is copied unchanged and there is no quality loss. The result is then parsed again and validated: its image-data containers must be byte-identical to the original’s, and the remaining metadata must match what was asked for. If validation fails, the output is discarded and you see an error. If the original EXIF orientation isn’t 1, a minimal EXIF block containing only the Orientation tag can be written so the image still displays the right way up (for WebP, only when the file already uses the extended VP8X format).',
  limits: [
    'JPEG, PNG and WebP only. HEIC/HEIF, AVIF and TIFF are not supported yet.',
    'Up to 50 MB and 100 megapixels per file. For images over 60 megapixels, the check that your browser can decode the cleaned file is skipped to limit memory use; the other validation checks still run.',
    'Compressed text and profile chunks are decompressed up to 4 MB each, at most 5,000 metadata entries are listed, and values longer than 2,000 characters are truncated.',
    'C2PA manifests are detected and removed, but their signatures are not validated, and removing them doesn’t remove provenance records the issuer may keep elsewhere.',
    'Data needed to decode the image is always kept, such as JPEG quantization and Huffman tables, PNG `IHDR`/`PLTE`/`tRNS` and APNG animation chunks, and WebP `VP8X`/`ALPH`/`ANIM` chunks.',
  ],
  privacy:
    'Images are processed in a Web Worker in your browser that contains no network code, and the site’s Content Security Policy blocks requests to other servers. No image, file name or metadata value is uploaded or written to browser storage, and preview and download URLs are released when you start over or load another image.',
  faqs: [
    {
      question: 'Why are some details missing?',
      answer:
        'Only what the file actually contains can be shown. Messaging apps like WhatsApp, and most social networks, already strip EXIF, GPS and camera data when you send an image, so a forwarded photo often has little more than a basic JFIF header left.',
    },
    {
      question: 'Does this upload my file?',
      answer:
        'No. The file is read and processed by your browser in a background worker. Nothing is sent to a server, and the page keeps working if you go offline after it has loaded.',
    },
    {
      question: 'What gets removed when I clean an image?',
      answer:
        'EXIF (camera, GPS, dates, thumbnails), XMP, IPTC, comments, PNG text chunks, C2PA Content Credentials and data appended after the image. The compressed pixel data is copied unchanged, so there is no quality loss. By default the color profile is kept so colors look the same.',
    },
    {
      question: 'Can this remove AI watermarks?',
      answer:
        'No. It removes AI and provenance information stored as metadata, such as Content Credentials, IPTC digital-source-type labels and generator parameters. Invisible watermarks like Google’s SynthID are embedded in the pixels themselves, and AI detectors analyze pixels, so cleaning metadata does not change a detector’s result. The image content is not altered.',
    },
    {
      question: 'Why is the cleaned file smaller?',
      answer:
        'Metadata takes up space. Embedded thumbnails, color profiles and editing history can add tens or hundreds of kilobytes. Only that data is removed; the image itself is untouched.',
    },
    {
      question: 'Should I remove the color profile?',
      answer:
        'Usually not. Removing the ICC profile can make colors look different, especially for wide-gamut images such as Display P3 photos. **Remove all supported metadata** removes it; **Clean privacy metadata** keeps it.',
    },
  ],
};

export default docs;
