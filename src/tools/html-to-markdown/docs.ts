import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    "Paste HTML into **Input HTML**, drop a `.html` file on it, use **Open file**, or **Try an example**.",
    "To bring in formatted text from a web page or document, tick **Show paste area**, click it and paste (Ctrl/⌘+V): the HTML on the clipboard is captured into the input.",
    "Pick the **Heading style** (`#` or underlined), the **Bullet** character and how **Code blocks** are written (backtick fence, tilde fence or indented).",
    "Copy the Markdown, **Download .md** or **Send to…** another tool.",
  ],
  howItWorks:
    "The HTML is parsed with the browser’s `DOMParser` into a detached document, which is never added to the page: scripts don’t run and images and stylesheets aren’t fetched. A converter then walks that tree. Block elements become Markdown blocks separated by blank lines, inline elements become emphasis, code spans, links and images, and `<pre><code class=\"language-x\">` becomes a fenced block with its language. Tables become GFM tables (alignment is read from `align` or `text-align`), nested lists keep their depth, and `<script>`, `<style>`, `<head>` and comments are dropped. Text that would otherwise turn into Markdown syntax (`*`, `_`, a leading `#`, and so on) is escaped.",
  limits: [
    "Input can be up to 5,000,000 characters (about 5 MB).",
    "Markdown can’t express everything: colors, classes, inline styles, `colspan`/`rowspan` (spanned cells become empty cells) and block content inside table cells (it is flattened, with `<br>` for line breaks) are lost.",
    "Setext (underlined) headings exist only for levels 1 and 2; levels 3 to 6 always use `#`.",
    "`javascript:` and `vbscript:` links are written as plain text.",
    "Lists are written tight (no blank line between items).",
  ],
  privacy:
    "Your HTML is converted in your browser and never uploaded or stored. **Share** puts the input and options in the link’s `#` fragment, which browsers don’t send to servers; long inputs show *Too large to share*. Text sent here or from here with **Send to…** passes through this tab’s session storage and is removed as soon as the receiving tool reads it.",
  faqs: [
    { question: "Why paste into a special area?", answer: "A plain text box receives only the plain text of what you copy. The paste area reads the `text/html` version of the clipboard, which keeps headings, links and tables." },
    { question: "Is it safe to paste untrusted HTML?", answer: "Yes for the page: the HTML is parsed into a detached document, so scripts don’t run and nothing is loaded. The Markdown it produces is just text, but check any links before you publish it." },
    { question: "Does it handle GitHub-style tables and task lists?", answer: "Tables become GFM tables, and checkbox inputs inside list items become `[ ]` / `[x]`." },
    { question: "Can I convert a whole page?", answer: "Yes. Paste the full document; only the `<body>` is converted." },
  ],
};

export default docs;
