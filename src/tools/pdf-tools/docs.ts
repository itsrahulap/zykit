import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Click **Add PDF files** or drop PDFs onto the box. Reorder them in the file list by dragging or with the arrows; this is the merge order.',
    'To combine them, choose **Merge** and click **Merge into one PDF** (needs at least two files).',
    'To split one, choose **Split**, pick the **File**, then **Every page** or **Page ranges** (for example `1-3, 5, 8-`, one output file per part), and click **Split** or **Split to ZIP**.',
    'To edit pages, choose **Pages**: click tiles to select them, then **Rotate left**, **Rotate right**, **Rotate 180°** or **Delete selected**, and drag tiles or use the arrows to reorder.',
    'Click **Save edited PDF** or **Extract** the selected pages. Tick **Remove metadata** first if you want the title, author and dates left out.',
  ],
  howItWorks:
    'PDFs are opened and written with the open-source pdf-lib library in a Web Worker, so the page stays responsive. Each file is parsed into memory once when you add it; the page then only keeps a list of page numbers, order and extra rotation for each file.\n\n' +
    'When you merge, split, extract or save, a new PDF is created and the chosen pages are copied into it in order, together with the fonts, images and other resources they use. Rotation is added to each page’s existing rotation, in steps of 90°, so the page content itself is not redrawn. Page edits made in the Pages tab also apply to merges and splits. A split into more than one file is packed into a ZIP.\n\n' +
    'By default the title, author, subject, keywords, creator and creation date of the first file are copied to the result, and pdf-lib records itself as the producer with a new modification date. With **Remove metadata** on, the document information is left empty.',
  limits: [
    'Up to 200 MB per file, 500 MB across all open files, and 5,000 pages per file.',
    'Encrypted PDFs (password-protected or with usage restrictions) can’t be opened. Remove the protection in the app that made them first.',
    'Page tiles show the page number, size and rotation, not a preview of the content.',
    'Only pages are copied into the new file, so document-level parts such as bookmarks are not kept.',
    'A PDF must keep at least one page, so you can’t delete every page. Page ranges are numbered by the current page order and must not run backwards (write `3-5`, not `5-3`).',
  ],
  privacy:
    'PDFs are read and written entirely in your browser, in a Web Worker. They are never uploaded or saved to browser storage, and stay in memory only until you remove them or leave the page. The tool has no share link.',
  faqs: [
    {
      question: 'Can I merge only some pages of each file?',
      answer:
        'Yes. Use the **Pages** tab on each file to delete, reorder or rotate pages first; **Merge** uses those edits, in the file order shown in the list.',
    },
    {
      question: 'How do I write page ranges?',
      answer:
        'Separate parts with commas: `4` is one page, `1-3` is a range, `8-` runs to the last page and `-3` starts at the first. Each part becomes its own file, so `1-3, 5` gives two PDFs in a ZIP.',
    },
    {
      question: 'Why can’t it open my PDF?',
      answer:
        'Either the file is encrypted (password-protected or restricted), which is labelled **Encrypted**, or it couldn’t be parsed as a PDF, labelled **Unreadable**. Very large files can also exceed what the device’s memory allows.',
    },
    {
      question: 'Does rotating reduce quality?',
      answer: 'No. Rotation is stored as a page setting in the PDF, so text and images are not re-rendered or recompressed.',
    },
    {
      question: 'What does Remove metadata remove?',
      answer:
        'The document information: title, author, subject, keywords, creator, producer and dates. It does not change anything inside the pages themselves.',
    },
  ],
};

export default docs;
