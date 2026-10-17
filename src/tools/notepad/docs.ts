import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Press **New note** and start typing. Edit the **Title** field to rename a note. Notes save automatically a moment after you stop typing.',
    'Pick a note from the list to open it. **Pin** keeps a note at the top, **Delete** asks for confirmation, and **Search notes** filters the list by title or text.',
    'Switch **View** to **Markdown preview** to see the note rendered as formatted text.',
    'Choose **.md** or **.txt**, then **Export note** to download the open note, or **All (.zip)** to download every note in one archive.',
    '**Import** adds one or more `.txt`, `.md` or `.markdown` files as new notes.',
  ],
  howItWorks:
    'All notes are kept in one JSON entry in your browser’s `localStorage`, under the key `zykit-notepad`. It is written about 0.4 seconds after your last change. The status bar shows the word and character count and when the open note was last edited. If another tab of this page changes the notes, this tab picks up the change through the browser’s `storage` event.\n\n' +
    'As in the Markdown Editor, the preview is rendered with `marked` and sanitized with DOMPurify: scripts, iframes, forms, inline styles and event handlers are removed, and remote images are blocked.\n\n' +
    'The .zip is built in the browser. Duplicate note titles get `(2)`, `(3)` suffixes.',
  limits: [
    'Notes live only in this browser on this device. They aren’t uploaded, synced or backed up. Clearing site data, private browsing or switching browsers loses or hides them, so export regularly.',
    'Browsers typically allow about 5 MB of `localStorage` per site. When it is full, a message appears and new changes aren’t saved until you free space.',
    'Up to 500 notes, each up to 1,000,000 characters; titles up to 200 characters. Imported files must be text and up to 10 MB.',
    'If you edit the same notes in two tabs at once, the most recently saved tab wins.',
    'Markdown preview supports standard Markdown plus GitHub-style tables and task lists, as rendered by `marked`. It is only a preview and isn’t saved separately.',
  ],
  privacy:
    'Nothing is uploaded: notes are stored only in your browser. This page has no share link, because sharing would put your notes in a URL. Anyone using this browser profile can read the notes, so don’t keep secrets here on a shared computer.',
  faqs: [
    {
      question: 'Where are my notes stored?',
      answer: 'In your browser’s local storage for this site, in one entry called `zykit-notepad`. They aren’t sent to any server.',
    },
    {
      question: 'Why did my notes disappear?',
      answer: 'Local storage is cleared when you clear site data, use a private window, or switch browser or device. Export your notes as a .zip to keep a copy.',
    },
    {
      question: 'Does it sync between tabs?',
      answer: 'Yes. Open it in two tabs and a change saved in one appears in the other. If both are edited at the same time, the last save wins.',
    },
    {
      question: 'Is the Markdown preview safe?',
      answer: 'Yes. The rendered HTML is sanitized, so scripts, embedded frames and forms never run, and remote images are blocked.',
    },
    {
      question: 'Can I move notes to another browser?',
      answer: 'Export all as a .zip, unzip it, and use **Import** in the other browser. Titles come from the file names; pinning and edit times aren’t carried over.',
    },
  ],
};

export default docs;
