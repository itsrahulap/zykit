// User docs for Office Metadata Cleaner, shown under the tool and in its SEO page. Written from the code:
// real limits, formats and privacy behaviour only.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: ["Add .docx, .xlsx, .pptx, .odt, .ods or .odp files by button, drop or paste.", "Review the properties, custom properties, reviewers, thumbnails and warnings for hidden sheets, slides and tracked changes.", "Choose what to blank and press Clean; the output is re-read to verify and shown before and after.", "Download name-clean.docx (or the matching extension), or all files as a ZIP."],
  howItWorks:
    "Office files are ZIP archives. A built-in ZIP reader parses the central directory, refuses unsafe part names (parent folders, absolute paths, backslashes), duplicate names and oversized parts, and inflates only the XML parts it needs, with a hard size cap. docProps/core.xml (author, last modified by, dates, revision, title), docProps/app.xml (company, manager, application, template, editing time) and docProps/custom.xml are read with a small XML parser that ignores DOCTYPEs and never expands entities. Comments, tracked changes, reviewer lists, hidden sheets and slides, and thumbnails are located in the matching parts. OpenDocument files use meta.xml, content.xml and Thumbnails/.\n\nCleaning removes the chosen metadata elements, replaces reviewer names on comments and tracked changes with a generic name, and drops the thumbnail together with its relationship or manifest entry. All other parts are copied byte for byte. The new archive is opened again and checked for anything the options asked to remove.",
  limits: ["Up to 200 MB per file, 500 MB in total, 50 files and 5000 parts per file; a single XML part may inflate to at most 64 MB.", "Supports .docx, .xlsx, .pptx, their macro-enabled forms, and .odt, .ods, .odp. Old .doc, .xls and .ppt files and password-protected files are not supported.", "Document content is not changed: text, comments, tracked changes, hidden sheets and slides, macros and printer settings stay and are listed as warnings.", "Cell values, headers, footers and text in the body can still contain names.", "Custom properties are removed entirely, which also drops sensitivity-label identifiers stored there.", "ZIP64 archives are not supported."],
  privacy:
    "Documents are read and rewritten in your browser tab. Nothing is uploaded or stored, and no network requests are made with your files.",
  faqs: [
    { question: "What does Word or Excel save about me?", answer: "The author and last editor, creation and modification times, revision number, total editing time, company and manager from the Office profile, the template, the application version and often a small thumbnail of the first page." },
    { question: "Will the document still open?", answer: "Yes. Metadata elements are removed or blanked and the thumbnail relationship is removed with its file. The tool opens the output again to check it, and unchanged parts are copied byte for byte." },
    { question: "Are comments and tracked changes removed?", answer: "No. Only the names and dates attached to them are replaced. Accept or reject changes and delete comments in your Office app to remove their content." },
    { question: "Why was my file refused?", answer: "It may be password-protected, an old binary format, damaged, or contain unsafe part names. The message says which." },
    { question: "Does it work for OpenDocument files?", answer: "Yes: .odt, .ods and .odp metadata in meta.xml, annotation and change authors in content.xml, and the thumbnail are handled." },
  ],
};

export default docs;
