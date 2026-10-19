import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Preset** to start from (Allow all, Disallow all, Block AI crawlers or WordPress), or edit the default group.',
    'In each group, list the **User-agents** one per line (`*` means all crawlers), add **Allow** or **Disallow** rules with **+ Add rule**, and optionally set a **Crawl-delay**. Use **+ Add group** for crawlers that need different rules.',
    'Add your sitemap URLs under **Sitemaps**, one absolute URL per line.',
    'Under **Test a URL**, enter a **User-agent** and a **URL or path** to see whether it is allowed and which rule decided. Switch to **Paste a robots.txt** to test and lint an existing file instead.',
    'Copy the result or click **Download robots.txt**, then upload it to the root of your site (`/robots.txt`).',
  ],
  howItWorks:
    'The generator writes one block per group: its `User-agent` lines, its `Allow` and `Disallow` rules, then `Crawl-delay` if set. Your `Sitemap` lines follow. A group without rules gets an empty `Disallow:`, which allows everything.\n\n' +
    'The tester parses the file and matches as described in RFC 9309:\n\n' +
    '- The group for the most specific matching user-agent product token applies (for example `Googlebot-News` falls back to a `Googlebot` group). Groups with the same user agent are merged. If none matches, the `*` group is used.\n' +
    '- Within the group, the longest matching path wins, and `Allow` wins a tie.\n' +
    '- `*` matches any sequence of characters, and a trailing `$` anchors the end of the path.\n' +
    '- Paths are compared after normalising percent-encoding, and `/robots.txt` itself is always allowed.\n\n' +
    'For a pasted file, a linter reports missing colons, rules before any `User-agent`, paths that don’t start with `/` or `*`, invalid `Sitemap` URLs and `Crawl-delay` values, unknown or non-standard directives such as `Host` and `Noindex`, and files over 500 KiB.',
  limits: [
    'The tester answers what RFC 9309 rules say. Individual crawlers can differ: Google ignores `Crawl-delay` (Bing and Yandex honour it), and non-standard directives like `Host` or `Clean-param` are not evaluated.',
    'Google reads only the first 500 KiB of a robots.txt; the linter warns about larger files but tests the whole file.',
    'The **Block AI crawlers** preset lists 28 known AI user agents. New crawlers appear regularly, and a crawler can ignore robots.txt or use an undeclared user agent.',
    'Only the path and query of a tested URL are used; the host is not checked against the site the file belongs to.',
    'The generated file is not linted, so values such as a non-numeric Crawl-delay are written as typed. The linter runs on pasted files.',
  ],
  privacy:
    'Generating, testing and linting run entirely in your browser. Nothing you type or paste is uploaded or stored, and the site’s Content Security Policy blocks requests to other servers. If you use **Send to…** to open the file in another tool, it passes through this tab’s session storage and is removed as soon as that tool reads it.',
  faqs: [
    {
      question: 'Does Disallow keep a page out of search results?',
      answer:
        'No. It asks crawlers not to fetch the page, but a blocked URL can still be indexed if other sites link to it. To keep a page out of results, allow crawling and use a `noindex` meta robots tag or `X-Robots-Tag` header. Google doesn’t support `Noindex` in robots.txt.',
    },
    {
      question: 'Which rule wins when Allow and Disallow both match?',
      answer:
        'The one with the longest matching path. If both are the same length, `Allow` wins. For example, `Allow: /wp-admin/admin-ajax.php` beats `Disallow: /wp-admin/` for that one file.',
    },
    {
      question: 'Why does my crawler use the * group even though I listed it?',
      answer:
        'A crawler follows only the most specific group that names it and ignores `*` entirely; it uses `*` only if it matches nothing. Check the spelling of the product token. Matching is case-insensitive but must use the crawler’s token (letters, `_` and `-`), not its full user-agent string.',
    },
    {
      question: 'Does blocking AI crawlers stop my content being used for AI?',
      answer:
        'Only for crawlers that respect robots.txt and identify themselves. Tokens like `Google-Extended` and `Applebot-Extended` control AI training use without affecting normal search crawling. Content already collected, or fetched by crawlers that ignore the file, is not affected.',
    },
    {
      question: 'Is robots.txt a security measure?',
      answer:
        'No. It is a public request that well-behaved crawlers honour; anyone can read it and ignore it. Protect private pages with authentication, and don’t list secret paths, since the file itself reveals them.',
    },
  ],
};

export default docs;
