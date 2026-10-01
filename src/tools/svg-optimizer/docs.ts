import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste SVG code into **SVG input**, drop an `.svg` file anywhere on the page, or click **Open SVG**.',
    'Adjust the **Optimizer options**: all cleaning passes are on by default, and **Decimals** (0–6, default 3) sets how far numbers are rounded.',
    'Compare the **Original** and **Optimized** previews and the size change, and check **What changed** and any security notices.',
    'Copy the optimized SVG or click **Download .svg** to save it as `name.min.svg`.',
  ],
  howItWorks:
    'The SVG is parsed with the tool’s own XML parser, which reports syntax errors with a line and column, and then cleaned by a series of conservative passes. Nothing is changed that the optimizer doesn’t fully understand; for example, CSS inside `<style>` is left as it is.\n\n' +
    'The passes remove comments; `<metadata>`, the DOCTYPE and the XML declaration; editor data from Inkscape, Sodipodi, Illustrator, Sketch, Serif and others, plus namespace declarations nothing uses; empty groups and `<defs>`, unwrapping groups with no attributes; attributes set to their default value and identity transforms, shortening colours such as `#ffffff` to `#fff`; and IDs that nothing references. Inherited defaults are kept when a stylesheet, an ancestor or a `<use>` reference could depend on them. Rounding applies to path data, `viewBox`, `points`, transforms and numeric attributes. In path data, relative coordinates are rounded against the already-rounded position, so long relative paths don’t drift.\n\n' +
    '**Sanitize** removes `<script>`, `<foreignObject>`, `<iframe>` and similar elements, `on…` event handlers, `javascript:` and non-image `data:` links, animations that change links or handlers, external file references (except ordinary `<a>` links), and styles that import or load external URLs. Each removal is listed. The previews are shown as images, so scripts in the file never run. Everything happens on the page as you type.',
  limits: [
    'Files up to 10 MB. The input must be well-formed XML with a single root `<svg>` element.',
    'This is a conservative optimizer, not a full minifier: it doesn’t merge paths, convert shapes to paths, rewrite path commands or minify CSS, so the savings can be smaller than with more aggressive tools.',
    'Rounding to too few decimals can visibly change small icons with fine detail; raise **Decimals** if the optimized preview looks different.',
    'IDs on `<symbol>` and `<view>` elements and on the root `<svg>` are always kept, since other files may point at them.',
    'Sanitizing makes an SVG safer to embed but is not a guarantee; treat untrusted SVGs with care in your own app as well.',
  ],
  privacy:
    'Your SVG is parsed, optimized and previewed entirely in your browser; nothing is uploaded or saved to browser storage. The tool has no share link.',
  faqs: [
    {
      question: 'Is it safe to paste an SVG I don’t trust?',
      answer:
        'Yes. The input is only parsed as text, and both previews are shown as images, where browsers never run scripts. Keep **Sanitize** on to remove scripts, event handlers and external references from the output too.',
    },
    {
      question: 'Why did my SVG change appearance after optimizing?',
      answer:
        'Usually because of rounding. Increase **Decimals** or turn off **Round numbers**. If it still differs, turn passes off one at a time to find the cause; **What changed** shows what each pass did.',
    },
    {
      question: 'Why was an ID removed?',
      answer:
        'IDs that nothing in the file references (through `url(#…)`, `href="#…"`, ARIA attributes, animation timing, or the text of a `<style>` or `<script>`) are removed. If your CSS or JavaScript elsewhere targets an ID, turn off **Remove unused IDs**.',
    },
    {
      question: 'Does it work with files from Illustrator and Inkscape?',
      answer:
        'Yes. It removes the editor-specific namespaces, attributes and elements these apps (and Sketch, Serif and others) add, and it expands the DOCTYPE entities Illustrator uses for namespace declarations.',
    },
  ],
};

export default docs;
