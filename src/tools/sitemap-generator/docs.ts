import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste your page URLs into **URLs**, one per line, or open or drop a text file. After each URL you can add a date (`YYYY-MM-DD`), a priority (`0.0`–`1.0`) and a changefreq such as `weekly`, in any order. Turn on **Find URLs in text** to pull every http(s) URL out of any text instead.',
    'Optionally set default **lastmod**, **changefreq** and **priority** values for URLs that don’t set their own.',
    'Check the notices for skipped lines, removed duplicates and URLs from more than one host.',
    'Copy or download `sitemap.xml`. For very large lists, set **Where the files will live**, then download each `sitemap-N.xml` file and the `sitemap-index.xml`.',
    'To check an existing file, switch to **Validate a sitemap** and paste or open the XML.',
  ],
  howItWorks:
    'Each line is checked with the browser’s URL parser. Only absolute `http` and `https` URLs are accepted, `#fragments` are dropped, and the URL is written in normalised form (for example, non-ASCII characters are percent-encoded). Exact duplicates are removed.\n\n' +
    'The output is a UTF-8 `<urlset>` in the sitemaps.org 0.9 namespace, with `&`, `<`, `>`, `"` and `\'` escaped.\n\n' +
    'One sitemap may hold at most 50,000 URLs and 50 MB uncompressed. Above either limit, the list is split into `sitemap-1.xml`, `sitemap-2.xml` and so on. A `sitemap-index.xml` points to each file under the base URL you give (by default the origin of the first URL), with today’s date as `lastmod`.\n\n' +
    'The validator uses a small built-in XML parser that checks well-formedness and reports the line of the first error. It then checks for:\n\n' +
    '- a `<urlset>` or `<sitemapindex>` root with the right namespace\n' +
    '- a valid `<loc>` in every entry, and duplicates\n' +
    '- W3C-format `lastmod` dates and valid `changefreq` and `priority` values\n' +
    '- URLs from several hosts\n' +
    '- the 50,000-entry and 50 MB limits',
  limits: [
    'Only absolute http(s) URLs. Relative paths such as `/about` are reported and skipped.',
    'Only the core sitemap tags are written. Image, video and news extensions and hreflang alternates (`xhtml:link`) are not generated; the validator accepts prefixed extension elements but doesn’t check them.',
    'The validator rejects DOCTYPE declarations and doesn’t validate against the XSD schema. Decompress gzipped `.xml.gz` sitemaps first.',
    'The validator lists at most 200 issues. The generator lists the first 20 skipped lines individually.',
    'Duplicates are found by exact URL after normalisation; URLs that differ only in a trailing slash or query order count as different pages.',
  ],
  privacy:
    'Generating and validating run entirely in your browser. URLs and XML are never uploaded or stored, and the site’s Content Security Policy blocks requests to other servers. If you use **Send to…** to open the output in another tool, it passes through this tab’s session storage and is removed as soon as that tool reads it.',
  faqs: [
    {
      question: 'Do changefreq and priority matter?',
      answer:
        'Google ignores both. It does use `lastmod` when it is consistently accurate, so set it to when a page’s content really changed, not today’s date for every page.',
    },
    {
      question: 'Can I include URLs from another domain?',
      answer:
        'Normally no. A sitemap should list only URLs on the host it is served from. Cross-host sitemaps work only when you have verified ownership of both sites (for example in Search Console), so the tool warns when URLs span several hosts.',
    },
    {
      question: 'What happens with more than 50,000 URLs?',
      answer:
        'The list is split into several sitemap files of up to 50,000 URLs (and 50 MB) each, plus a sitemap index that lists them. Upload all files to the location you entered and submit just the index.',
    },
    {
      question: 'How do search engines find my sitemap?',
      answer:
        'Submit it in Google Search Console or Bing Webmaster Tools, and add a `Sitemap: https://example.com/sitemap.xml` line to your robots.txt so other crawlers find it too.',
    },
    {
      question: 'Why are ampersands changed to &amp;?',
      answer:
        'Sitemaps are XML, where a bare `&` is invalid. Escaping it as `&amp;` keeps the file well-formed; crawlers read it back as `&`, so the URL is unchanged.',
    },
  ],
};

export default docs;
