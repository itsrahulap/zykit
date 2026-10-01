import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Write Markdown in the editor, use **Open .md** or drop a file on it. **Example** loads a sample document that shows what is supported.',
    'Use the **Formatting** toolbar for bold, italic, inline code, links, headings, lists, quotes and tables, or press Ctrl/⌘ + B, I or K on a selection.',
    'Watch the preview update as you type. On narrow screens, switch between **Edit** and **Preview** with **View**.',
    'Export with **Copy HTML**, **Download .md** or **Download .html** (a standalone page with simple styling), or use **Send to…** to open the Markdown in another tool.',
  ],
  howItWorks:
    'Markdown is converted to HTML with the marked library in GitHub-flavoured mode: tables with column alignment, task lists, strikethrough and autolinks are supported, and every heading gets an anchor (prefixed with `md-`, so `[Jump](#what-works)` links to the heading “What works”). Single line breaks don’t become `<br>`, as in standard Markdown.\n\n' +
    'Raw HTML in the Markdown is allowed, but the result always goes through DOMPurify before it is shown or exported. Scripts, event handlers, iframes, forms, embedded objects, SVG, MathML and inline styles are removed, `javascript:`, `data:` and similar links are dropped, external links open in a new tab, and task-list checkboxes are read-only.\n\n' +
    'Rendering happens on the page in your browser. marked and DOMPurify are loaded from this site when you open the tool.',
  limits: [
    'Only images embedded as `data:` (or `blob:`) URLs show in the preview and HTML export. Images from other sites, or relative paths, aren’t loaded and appear as placeholders; the Markdown keeps the links.',
    'GitHub-flavoured Markdown only: footnotes, math, Mermaid diagrams, emoji shortcodes and syntax highlighting in code blocks aren’t supported.',
    'Inline `style` attributes and `<style>` elements are removed, so raw HTML can’t change colours or layout.',
    'Files you open can be up to 5 MB.',
  ],
  privacy:
    'Your Markdown is rendered in your browser and never uploaded. The draft is saved in this browser’s local storage shortly after you stop typing, so it is still there when you come back; **Clear** empties it. The **Share** button (Copy share link) puts the text in the link’s `#` fragment, which browsers don’t send to servers; links are limited in size, so long documents show *Too large to share*. Text sent here or from here with **Send to…** passes through this tab’s session storage and is removed as soon as the receiving tool reads it. Remote images are never fetched.',
  faqs: [
    {
      question: 'Is it safe to paste Markdown with HTML from someone else?',
      answer:
        'Yes. The rendered HTML is sanitized with DOMPurify before it reaches the page or an export: scripts, event handlers, iframes, forms and `javascript:` links are removed, and the site’s security policy blocks scripts and outside requests as a second layer.',
    },
    {
      question: 'Why don’t my images show?',
      answer:
        'The site blocks requests to other servers, so remote images aren’t loaded and a notice says how many were skipped. Images embedded as `data:` URLs do show. The links stay in your Markdown, so they work wherever you publish it.',
    },
    {
      question: 'Where is my draft saved?',
      answer:
        'In this browser’s local storage, on this device only. It is not synced or uploaded. Clearing site data or using a private window removes it, so download a `.md` copy of anything you want to keep.',
    },
    {
      question: 'Why doesn’t a single line break show in the preview?',
      answer: 'In Markdown, a single line break joins the lines into one paragraph. Leave a blank line for a new paragraph, or end a line with two spaces or a backslash for a line break.',
    },
    {
      question: 'What does the exported HTML file contain?',
      answer:
        'A complete page with the sanitized HTML, a title taken from the first heading, and a small built-in stylesheet that also follows the reader’s dark mode. It doesn’t load any external files.',
    },
  ],
};

export default docs;
