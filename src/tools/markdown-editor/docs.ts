import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Write Markdown in the editor, use **Open .md**, or drop a file on it. **Example** loads a sample showing what is supported.',
    'Use the **Formatting** toolbar for bold, italic, inline code, links, headings, lists, quotes and tables, or press Ctrl/⌘ + B, I or K on a selection.',
    'The preview updates as you type. On narrow screens, switch between **Edit** and **Preview** with **View**.',
    'Export with **Copy HTML**, **Download .md** or **Download .html** (a standalone page with simple styling), or use **Send to…** to open the Markdown in another tool.',
  ],
  howItWorks:
    'The marked library converts Markdown to HTML in GitHub-flavoured mode. It supports tables with column alignment, task lists, strikethrough and autolinks. Every heading gets an anchor prefixed with `md-`, so `[Jump](#what-works)` links to the heading “What works”. As in standard Markdown, single line breaks don’t become `<br>`.\n\n' +
    'Raw HTML is allowed, but the result always goes through DOMPurify before it is shown or exported:\n\n' +
    '- Scripts, event handlers, iframes, forms, embedded objects, SVG, MathML and inline styles are removed.\n' +
    '- `javascript:`, `data:` and similar links are dropped.\n' +
    '- External links open in a new tab.\n' +
    '- Task-list checkboxes are read-only.\n\n' +
    'Rendering happens in your browser. marked and DOMPurify are loaded from this site when you open the tool.',
  limits: [
    'Only images embedded as `data:` (or `blob:`) URLs show in the preview and HTML export. Images from other sites, or relative paths, aren’t loaded and appear as placeholders; the Markdown keeps the links.',
    'GitHub-flavoured Markdown only: no footnotes, math, Mermaid diagrams, emoji shortcodes or syntax highlighting in code blocks.',
    'Inline `style` attributes and `<style>` elements are removed, so raw HTML can’t change colours or layout.',
    'Files you open can be up to 5 MB.',
  ],
  privacy:
    'Your Markdown is rendered in your browser and never uploaded. The draft is saved to this browser’s local storage shortly after you stop typing, so it is there when you come back; **Clear** empties it. The **Share** button (Copy share link) puts the text in the link’s `#` fragment, which browsers don’t send to servers. Links are limited in size, so long documents show *Too large to share*. Text passed with **Send to…** goes through this tab’s session storage and is removed as soon as the receiving tool reads it. Remote images are never fetched.',
  faqs: [
    {
      question: 'Is it safe to paste Markdown with HTML from someone else?',
      answer:
        'Yes. DOMPurify sanitizes the rendered HTML before it reaches the page or an export, removing scripts, event handlers, iframes, forms and `javascript:` links. The site’s security policy also blocks scripts and outside requests as a second layer.',
    },
    {
      question: 'Why don’t my images show?',
      answer:
        'The site blocks requests to other servers, so remote images aren’t loaded; a notice says how many were skipped. Images embedded as `data:` URLs do show. The links stay in your Markdown, so they work wherever you publish it.',
    },
    {
      question: 'Where is my draft saved?',
      answer:
        'In this browser’s local storage, on this device only. It isn’t synced or uploaded. Clearing site data or using a private window removes it, so download a `.md` copy of anything you want to keep.',
    },
    {
      question: 'Why doesn’t a single line break show in the preview?',
      answer: 'In Markdown, a single line break joins the lines into one paragraph. Leave a blank line for a new paragraph, or end a line with two spaces or a backslash for a line break.',
    },
    {
      question: 'What does the exported HTML file contain?',
      answer:
        'A complete page with the sanitized HTML, a title taken from the first heading, and a small built-in stylesheet that follows the reader’s dark mode. It loads no external files.',
    },
  ],
};

export default docs;
