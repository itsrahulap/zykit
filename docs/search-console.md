# Getting Zykit into Google Search

What the site already does, and the steps that have to happen in Google Search Console after a deploy.

## Already in place

| What | Where |
|---|---|
| A static HTML page per URL (home, every tool, Learn page and blog post) with its own title, description, canonical URL, Open Graph tags, JSON-LD and readable text | `scripts/seo-plugin.ts`, run by `npm run build` |
| `sitemap.xml` listing every page | written to `dist/` by the same build step |
| `robots.txt` that allows crawling and points at the sitemap | `public/robots.txt` |
| `noindex` on not-found pages, so mistyped URLs stay out of the index | `src/app/Layout.tsx`, `src/shared/hooks/useDocumentMeta.ts` |
| Search Console ownership file, served at `/google63042b236bf4b635.html` | `public/google63042b236bf4b635.html` |

Search Console’s file verification **does not follow redirects**, so `vercel.json` doesn’t use `cleanUrls` (which would redirect `*.html` URLs). Instead, rewrites serve `/tools/jwt-decoder` from `tools/jwt-decoder.html`, and anything without a matching file falls back to `index.html`. Keep the verification file in `public/` for as long as the property exists: Google re-checks it periodically.

## After deploying

1. **Check the file is served without a redirect.** This should print `200` and the file’s one line:
   ```bash
   curl -si https://zykit.vercel.app/google63042b236bf4b635.html | head -1
   curl -s  https://zykit.vercel.app/google63042b236bf4b635.html
   ```
   Also check that a clean URL still works: `curl -sI https://zykit.vercel.app/tools/jwt-decoder` should return `200`.
2. **Verify ownership.** In [Search Console](https://search.google.com/search-console), add a **URL prefix** property for `https://zykit.vercel.app/`, choose **HTML file**, and click **Verify**.
3. **Submit the sitemap.** Open **Sitemaps**, enter `sitemap.xml`, and submit.
4. **Request indexing for key pages.** Use **URL inspection** on the home page, `/blog`, `/learn` and a few tools, then **Request indexing**.
5. **Check back after a few days.** The **Pages** report shows what is indexed and why anything isn’t.

Bing Webmaster Tools can import the property straight from Search Console, which also covers DuckDuckGo and other engines that use Bing’s index.

## If the domain changes

Update `SITE.url` in `src/config/site.ts`, the canonical and `og:url` tags in `index.html`, and the `Sitemap:` line in `public/robots.txt`. Then add the new domain as a new Search Console property; the verification file keeps working as long as it stays in `public/`.
