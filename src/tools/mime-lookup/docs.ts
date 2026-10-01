import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type an extension (`png` or `.png`), a MIME type or part of one (`image/`, `json`), or a whole file name (`report.final.pdf`) into **Extension, MIME type or file name**.',
    'Read the matches: each shows the MIME type, its usual extensions, a category and whether it is worth compressing. Click **Show all** if there are more than 60 results.',
    'Use **Copy MIME** or **Copy ext** to copy a value.',
    'To check a real file, use **Choose a file** or drop one on **Check a file**. It compares the type for its extension with the type your browser reports.',
  ],
  howItWorks:
    'Lookups use a built-in table of 376 MIME types and 483 extensions, compiled from the IANA media type registry and the mappings used by Apache, nginx and mime-db. Each type has a category and a *compressible* flag that says whether gzip or Brotli usually makes it smaller.\n\n' +
    'A query containing `/` is matched against MIME types, with prefix matches first. Anything else is treated as an extension or file name: an exact extension match comes first, then other types listing that extension, then extensions and MIME parts that start with your text. A file name with a known extension shows just that type. The last part after a dot is the extension, except for `.tar.gz`, `.tar.bz2`, `.tar.xz` and `.d.ts`, and dotfiles like `.gitignore` have none.\n\n' +
    'For **Check a file**, only the file’s name and the `type` your browser reports for it are used. The browser derives that type from the extension using the operating system’s own table.',
  limits: [
    'The table covers common types, not the full IANA registry, and has no `charset` or other parameters.',
    'When two types share an extension, the first listed wins for lookups. For example `.ts` resolves to MPEG transport stream video (`video/mp2t`); `text/typescript` is still shown among the matches.',
    'Types are found from the name only. The file’s contents are not read, so a renamed or mislabelled file is not detected.',
  ],
  privacy:
    'Everything runs in your browser from a table built into the page, and nothing you type is stored. When you check a file, only its name and browser-reported type are read, never its contents, and the file isn’t uploaded; the site’s Content Security Policy blocks requests to other servers.',
  faqs: [
    {
      question: 'Why does my browser report a different type?',
      answer:
        'Browsers guess a file’s type from its extension using the operating system’s own table, which may use an older or alternative name, such as `image/x-icon` instead of `image/vnd.microsoft.icon`. Both are often valid aliases. If the browser reports an empty type, it has no mapping for that extension.',
    },
    {
      question: 'What does compressible mean?',
      answer:
        'That serving the file with gzip or Brotli usually makes it noticeably smaller, as with text, JSON, SVG and fonts like TTF. Formats that are already compressed, such as PNG, JPEG, MP4 or ZIP, gain nothing, so servers usually skip them.',
    },
    {
      question: 'Which type should I use for an unknown binary file?',
      answer:
        '`application/octet-stream`. It tells browsers the content is arbitrary binary data, so they offer to download it instead of trying to display it.',
    },
    {
      question: 'Does it detect a file type from its contents?',
      answer:
        'No. It looks only at the name. Detecting a type from contents would mean reading the file’s magic bytes, which this tool doesn’t do.',
    },
  ],
};

export default docs;
