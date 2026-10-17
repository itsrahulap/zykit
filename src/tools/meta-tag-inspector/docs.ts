import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste the page’s HTML source into **Page HTML**, for example from View Source or `curl -sL https://example.com`. If the page adds tags with JavaScript, copy the rendered DOM from DevTools (Elements → Copy outerHTML) instead.',
    'You can also drop an `.html` file on the box or use **Open file**. **Load sample** fills in an example page.',
    'Work through the checklist: **Errors**, **Warnings**, **Suggestions** and **Passed** checks for the title, description, canonical, robots, mobile viewport, charset, language, hreflang, icons, Open Graph, X / Twitter, structured data, headings and images.',
    'Check the **Previews** of a Google result, a Facebook / LinkedIn card and an X card. The **Basics**, **Open Graph**, **X / Twitter**, **Structured data** and **Headings outline** panels show the raw values.',
  ],
  howItWorks:
    'The browser’s `DOMParser` turns the HTML into an inert document: scripts don’t run, images and stylesheets aren’t loaded, and the document is never added to the page. The tool reads the `<title>`, `<meta>` and `<link rel>` tags, the `lang` attribute, `<base href>`, `application/ld+json` scripts, headings and images, then runs its checks.\n\n' +
    'Titles of 30–60 characters and descriptions of 70–160 characters count as in range. Other checks look for:\n\n' +
    '- a single absolute canonical URL\n' +
    '- `noindex` or `nofollow` in the `robots` or `googlebot` meta tags\n' +
    '- a viewport with `width=device-width` that doesn’t block zooming, and a UTF-8 charset\n' +
    '- valid hreflang codes with an `x-default` and a self-reference\n' +
    '- `og:title`, `og:type`, `og:image` (absolute, with width and height) and `og:url`, and a known `twitter:card` type\n' +
    '- JSON-LD that parses as JSON (its `@type` values are listed)\n' +
    '- one `<h1>` without skipped heading levels, and images without an `alt` attribute\n\n' +
    'Relative URLs are resolved against the canonical URL or `og:url` when one is absolute, taking `<base href>` into account. The previews use `og:` and `twitter:` values first, fall back to the title and description, and truncate to roughly what each platform shows.',
  limits: [
    'Pages aren’t fetched: the site can’t contact other servers, so paste the HTML or open a saved file.',
    'Only the first 5 MB of input is analysed. At most 500 meta tags, links and headings and 50 JSON-LD blocks are read, and long values are shortened.',
    'Tags added by JavaScript after the page loads aren’t in the View Source HTML; paste the rendered DOM to see them.',
    'HTTP headers such as `X-Robots-Tag` or a `Link` canonical aren’t in the HTML, so they aren’t checked.',
    'Previews are approximate and images are never loaded, so image size, format and reachability aren’t checked. JSON-LD is checked for valid JSON only, not against schema.org or Google’s rich result rules.',
  ],
  privacy:
    'The HTML is parsed in your browser without running scripts or loading the page’s images, styles or other resources. Nothing you paste or open is uploaded or stored, and the site’s Content Security Policy blocks requests to other servers.',
  faqs: [
    {
      question: 'Can I enter a URL instead of pasting HTML?',
      answer:
        'No. The site can only talk to its own server, so it can’t download other websites. Use View Source, or run `curl -sL https://example.com -o page.html` and open the saved file.',
    },
    {
      question: 'Why does the tool say a tag is missing when I can see it in DevTools?',
      answer:
        'It is probably added by JavaScript. View Source and curl show the HTML the server sends, which is what many crawlers and link preview bots read. Paste the rendered DOM (DevTools → Elements → right-click `<html>` → Copy outerHTML) to check the final tags.',
    },
    {
      question: 'Why don’t the preview cards show my image?',
      answer:
        'Images are deliberately not loaded, for privacy and because the site can’t contact other servers. The card shows the resolved image URL and alt text instead.',
    },
    {
      question: 'Are the title and description length limits exact?',
      answer:
        'No. Search engines truncate by pixel width, not characters. The 30–60 and 70–160 character ranges are common guidelines, and the previews cut text at roughly the same points.',
    },
    {
      question: 'Does it validate my structured data?',
      answer:
        'Only that each JSON-LD block is valid JSON. It lists the `@type` values it finds but doesn’t check required properties or rich result eligibility.',
    },
  ],
};

export default docs;
