// User docs for Duplicate File Finder, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose **Add files** (several at once), **Add folder** (every file inside, subfolders included), or drop files and folders onto the page.',
    'Press **Find duplicates**. A progress bar shows the bytes hashed, and **Cancel** stops the scan.',
    'Each group lists the files with identical content, their size and the space wasted (size × extra copies). Files in a folder show their relative path.',
    'Download a **CSV** or **JSON** report, then delete the extra copies yourself in your file manager.',
  ],
  howItWorks:
    'Files are first grouped by size, because files of different sizes can never be identical; a file with a unique size is never read. Only the remaining candidates are hashed with SHA-256 (`crypto.subtle.digest`) in a background worker, one file at a time, and files with the same size and hash are reported as duplicates. The browser’s hashing API can’t stream, so each file is read into memory whole while it is hashed. The hash is a content fingerprint: two files with the same SHA-256 are, for all practical purposes, byte-for-byte identical.',
  limits: [
    'Up to 20,000 files per scan, and each file can be at most 2 GB. Larger files are skipped and counted in a note.',
    'At most 8 GB of candidate files is hashed in one scan; groups beyond that are skipped (smaller files are compared first).',
    'Empty files are ignored. Files are compared by content only; names, dates and folders are not considered.',
    'A browser tab can’t delete, move or rename your files, so the tool only reports. The same file added twice (same path) is counted once.',
    'Dropping a folder works in Chromium, Safari and Firefox; if yours doesn’t accept it, use **Add folder**. Very large files can fail to load on low-memory devices; such files are listed as unreadable.',
  ],
  privacy: 'Files are read and hashed in your browser, in a worker in this tab. Nothing is uploaded and nothing is stored; the report is only created when you press a download button.',
  faqs: [
    { question: 'Can it delete the duplicates for me?', answer: 'No. Web pages can’t delete files on your computer. Use the report to find the extra copies and remove them in Finder, Explorer or your file manager.' },
    { question: 'Why are some files never hashed?', answer: 'Only files that share a size with another file can be duplicates, so the rest are skipped, which makes big folders much faster.' },
    { question: 'Is a matching hash a guarantee?', answer: 'A SHA-256 match combined with an equal size is for all practical purposes proof that the content is identical. Accidental collisions are not realistic.' },
    { question: 'Which copy should I keep?', answer: 'The tool doesn’t decide. Keep the one in the place you expect (for example the original folder) and remove the rest. Paths in each group help you tell them apart.' },
  ],
};

export default docs;
