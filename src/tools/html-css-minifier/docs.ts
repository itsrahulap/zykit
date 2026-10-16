import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose **HTML** or **CSS**, then paste your code into **Input**, drop a file on it, or use **Open file** or **Try an example**.',
    'Pick **Minify** to shrink it or **Beautify** to re-indent it (2 spaces, 4 spaces or a tab). For HTML you can also tick **Remove attribute quotes where safe**, which is off by default.',
    'Read the **Size** card for bytes and an estimated gzip size, before and after, then copy the result or download it.',
  ],
  howItWorks:
    'Both minifiers are small scanners that leave anything risky untouched.\n\n' +
    'In CSS, strings, `url(...)` and comments are recognised first, so text like `"/* not a comment */"` is never touched. Comments are removed (except those starting with `/*!`), whitespace is collapsed, and spaces are removed only next to `{ } ; , > ~` and after `:`. Inside parentheses, such as `calc(1px + 2px)`, spaces around operators are kept. The last `;` before `}` is dropped.\n\n' +
    'In HTML, comments are removed except conditional comments (`<!--[if IE]>`). The content of `<pre>`, `<textarea>`, `<script>` and `<style>` is copied exactly. Elsewhere, runs of whitespace become one space. Whitespace is removed only next to block-level tags (such as `div`, `p`, `li`, `td`), so `<b>a</b> <i>b</i>` keeps its space. Attribute values are never changed.\n\n' +
    'The gzip size comes from your browser’s `CompressionStream`. Everything runs on the page.',
  limits: [
    'Input over 5,000,000 characters is not processed.',
    'The minifiers are conservative on purpose: no shortening of colours, units or selectors, no merging of rules, no removal of empty rules, and no minifying of JavaScript or of CSS inside `<style>` or `style=""` attributes.',
    'Optional end tags are not added or removed, and HTML is not validated: broken markup is passed through as is. Beautifying HTML with omitted end tags (like `<li>` without `</li>`) may indent unusually.',
    'Beautify keeps `<pre>`, `<textarea>` and `<script>` content exactly as written, so scripts are not re-indented; CSS inside `<style>` is formatted.',
    'The gzip figure is an estimate (this browser’s compressor at its default level) and shows n/a if the browser has no `CompressionStream`.',
  ],
  privacy:
    'Your code is processed in your browser and is never uploaded or stored. **Copy share link** puts the input and options in the link’s `#` fragment, which browsers don’t send to servers; large inputs show *Too large to share*.',
  faqs: [
    {
      question: 'Will minifying break my page?',
      answer:
        'It is designed not to. Strings, urls, `<pre>` blocks, scripts and attribute values are left alone, and whitespace between inline elements is kept as a single space. As with any minifier, test the result before deploying.',
    },
    {
      question: 'Why is the saving smaller than other minifiers?',
      answer:
        'Other tools also rewrite colours and numbers, merge rules or remove optional tags and quotes. This one only removes comments and whitespace (and optional quotes if you ask), the safest part. After gzip the difference is usually small.',
    },
    {
      question: 'Are my license comments kept?',
      answer: 'In CSS, comments starting with `/*!` are kept. In HTML, only conditional comments are kept; all other comments are removed.',
    },
    {
      question: 'What does “Remove attribute quotes where safe” do?',
      answer:
        'It turns `class="box"` into `class=box` when the value has no spaces, quotes or `=`, `<`, `>`, backticks and does not end with `/`. It is valid HTML5 but off by default because some tools and templates expect quotes.',
    },
    {
      question: 'Does Beautify restore my original formatting?',
      answer: 'No. Minifying removes the original layout, so Beautify produces a fresh, consistent one.',
    },
  ],
};

export default docs;
