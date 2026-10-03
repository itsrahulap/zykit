// User docs for PDF Metadata Cleaner, shown under the tool and in its SEO page. Written from the code:
// real limits, formats and privacy behaviour only.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: ["Add one or more PDFs with the button, by dropping them on the page or by pasting.", "Read what each file reveals: Info fields, XMP metadata, document ID, and warnings for attachments, JavaScript and forms.", "Choose what to remove and press Clean. The tool re-reads the result and shows before and after.", "Download each cleaned file as name-clean.pdf, or all of them as one ZIP."],
  howItWorks:
    "The PDF is opened with pdf-lib in a web worker. The Info dictionary (title, author, subject, keywords, creator, producer, dates and any custom keys), the XMP packet in the catalog, the trailer document ID and Adobe-style private data (PieceInfo) are read directly from the PDF objects. XMP is shown re-indented, with person, software, date and ID fields flagged, and AI tool names such as ChatGPT, DALL-E, Midjourney or Firefly marked.\n\nCleaning deletes the chosen objects and their references, then writes a new file. The old values are not left behind as unused objects. The output is opened again and compared with the original, and the page count is checked. Pages, fonts, images, attachments and forms are rewritten unchanged.",
  limits: ["Up to 200 MB per file, 500 MB in total and 50 files at once.", "Encrypted PDFs (password or permission restrictions) cannot be read; remove the protection in the app that made them first.", "Removing the document ID is optional because some workflows use it to match revisions of a file.", "Embedded files, JavaScript and form values are reported but kept; they can carry their own metadata.", "Page content is not touched, so text, visible names and watermarks stay. PDFs with damaged structure may not open.", "The file is rewritten without object streams, so it can be somewhat larger than the original."],
  privacy:
    "Files are read and rewritten in your browser tab. Nothing is uploaded, stored or logged, and the page makes no network requests with your files.",
  faqs: [
    { question: "What metadata does a PDF carry?", answer: "Typically the author, the program that made it (Creator and Producer), creation and modification dates, a title, keywords, an XMP packet repeating this and more, and a document ID. Tools like Word, Acrobat and image editors add these automatically." },
    { question: "Does cleaning change how the PDF looks?", answer: "No. Only metadata objects are removed. Pages, text, images and forms are written out unchanged, and the tool checks the page count of the result." },
    { question: "Is a PDF still traceable after cleaning?", answer: "Metadata is only part of it. Visible text, embedded files, fonts, form values, annotations and image content can still identify you. The warnings list the ones the tool detects but does not remove." },
    { question: "Why does it say the PDF is encrypted?", answer: "Password-protected or permission-restricted PDFs cannot be rewritten without the key. Remove the protection in the app that created the file, then add it again." },
    { question: "Should I remove the document ID?", answer: "Leave it if you share revisions of the same file. Remove it if you want to prevent two copies from being matched as the same document." },
  ],
};

export default docs;
