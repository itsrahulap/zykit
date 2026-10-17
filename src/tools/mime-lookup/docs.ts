import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type an extension (`png` or `.png`), a MIME type or part of one (`image/`, `json`), or a whole file name (`report.final.pdf`) into **Extension, MIME type or file name**.',
    'Each match shows the MIME type, its usual extensions, a category and whether it is worth compressing. Click **Show all** if there are more than 60 results.',
    'Use **Copy MIME** or **Copy ext** to copy a value.',
    'To check a real file, use **Choose a file** or drop one on **Check a file**. It compares the type for its extension with the one your browser reports.',
  ],
  howItWorks:
    'Lookups use a built-in table of 376 MIME types and 483 extensions, compiled from the IANA media type registry and the mappings used by Apache, nginx and mime-db. Each type has a category and a *compressible* flag saying whether gzip or Brotli usually makes it smaller.\n\n' +
    'A query containing `/` is matched against MIME types, prefix matches first. Anything else is treated as an extension or file name, in this order: an exact extension match, other types listing that extension, then extensions and MIME parts starting with your text. A file name with a known extension shows just that type.\n\n' +
    'The extension is the last part after a dot, except for `.tar.gz`, `.tar.bz2`, `.tar.xz` and `.d.ts`. Dotfiles like `.gitignore` have none.\n\n' +
    '**Check a file** uses only the file’s name and the `type` your browser reports, which the browser derives from the extension using the operating system’s own table.',
  limits: [
    'The table covers common types, not the full IANA registry, and has no `charset` or other parameters.',
    'When two types share an extension, the first listed wins for lookups. For example `.ts` resolves to MPEG transport stream video (`video/mp2t`); `text/typescript` is still shown among the matches.',
    'Types come from the name only. The contents aren’t read, so a renamed or mislabelled file isn’t detected.',
  ],
  privacy:
    'Everything runs in your browser from a built-in table, and nothing you type is stored. When you check a file, only its name and browser-reported type are read, never its contents, and it isn’t uploaded; the site’s Content Security Policy blocks requests to other servers.',
  faqs: [
    {
      question: 'Why does my browser report a different type?',
      answer:
        'Browsers guess the type from the extension using the operating system’s table, which may use an older or alternative name, such as `image/x-icon` instead of `image/vnd.microsoft.icon`. Both are often valid aliases. If the browser reports an empty type, it has no mapping for that extension.',
    },
    {
      question: 'What does compressible mean?',
      answer:
        'Serving it with gzip or Brotli usually makes it noticeably smaller, as with text, JSON, SVG and fonts like TTF. Already-compressed formats such as PNG, JPEG, MP4 or ZIP gain nothing, so servers usually skip them.',
    },
    {
      question: 'Which type should I use for an unknown binary file?',
      answer:
        '`application/octet-stream`. It tells browsers the content is arbitrary binary data, so they offer to download it instead of trying to display it.',
    },
    {
      question: 'Does it detect a file type from its contents?',
      answer:
        'No, only at the name. That would mean reading the file’s magic bytes, which this tool doesn’t do.',
    },
  ],
};

export default docs;
