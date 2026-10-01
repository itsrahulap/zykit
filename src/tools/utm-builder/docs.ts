import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose a **Mode**: **Single URL** for one link, or **Bulk** to tag a list of base URLs (one per line) with the same campaign.',
    'Enter the **Website URL** (or the **Base URLs**). Optionally fill in **Your site’s domain** so links to your own site are flagged.',
    'Fill in the **Campaign** fields: **Source**, **Medium** and **Campaign** are required, **Term** and **Content** are optional. Pick a **Preset** to fill in a common source and medium, or click **Show more fields** for the GA4 parameters `utm_id`, `utm_source_platform`, `utm_creative_format` and `utm_marketing_tactic`.',
    'Set the formatting: **Lowercase values** and how **Spaces** are written (`-`, `_` or `%20`).',
    'Copy the **Tagged URL** (or **Copy all** in bulk mode), or use **Send to…**. Copied links, and links you **Save**, appear in **History**.',
  ],
  howItWorks:
    'The base URL is parsed with the browser’s `URL` API. If it has no scheme, `https://` is added; anything other than `http` or `https`, or a host without a dot (except `localhost`), is rejected.\n\n' +
    'Each value is trimmed, optionally lower-cased, and runs of whitespace are replaced with `-`, `_` or a single space depending on the **Spaces** setting. The non-empty values are then appended in a fixed order (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, then the GA4 fields) and encoded with `encodeURIComponent`, so a space becomes `%20`. Existing query parameters are kept exactly as written, except UTM parameters you are setting, which are replaced instead of duplicated. The `#fragment` stays at the end.\n\n' +
    'Warnings appear for a missing required field, values that mix upper and lower case (analytics tools treat `Email` and `email` as different), a scheme that was added, replaced UTM parameters, and links whose host matches your site’s domain or one of its subdomains, because UTM tags on internal links start a new session and overwrite the original traffic source.',
  limits: [
    'Only `http` and `https` URLs are accepted, and a URL can’t contain spaces.',
    'A link is still built when a required field is missing; it gets a warning instead of being blocked.',
    'History keeps the 50 most recent links, without duplicates.',
    'Presets only fill in source and medium. They follow common conventions; check them against the channel definitions your analytics tool uses.',
    'The tool builds links only. It can’t check that the destination page exists or that your analytics records the visit.',
  ],
  privacy:
    'Links are built entirely in your browser, and the site’s Content Security Policy blocks requests to other servers. Links you copy or **Save** are kept in this browser’s local storage under **History**, never uploaded; click **Clear history** to delete them. Nothing else is stored, and there is no share link. If you use **Send to…**, the link is handed over through this tab’s session storage and removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Which UTM parameters are required?',
      answer:
        '`utm_source`, `utm_medium` and `utm_campaign`. Without them, analytics tools may file the visit under the wrong channel or campaign. `utm_term` and `utm_content` are optional, and the GA4 fields are only needed if you use them in reports or data import.',
    },
    {
      question: 'Should I add UTM tags to links within my own site?',
      answer:
        'No. A UTM-tagged click starts a new session in analytics, which replaces the visitor’s real source (such as search or email). Enter **Your site’s domain** and the tool warns when a link points to it.',
    },
    {
      question: 'Why are my values lower-cased?',
      answer:
        'Because **Lowercase values** is on by default. Analytics tools treat `Facebook` and `facebook` as different sources, so consistent lower case keeps reports clean. Untick it to keep your capitalisation; a warning then flags mixed case.',
    },
    {
      question: 'What happens to UTM parameters already in the URL?',
      answer:
        'A UTM parameter you fill in replaces the one in the URL, and a warning says so. UTM parameters you leave empty and all other parameters stay as they were.',
    },
    {
      question: 'Do I need UTM tags for Google Ads?',
      answer:
        'Often not. Google Ads auto-tagging adds a `gclid` that Google Analytics uses, which usually makes manual UTM tags unnecessary there. The **Google Ads** preset shows this note.',
    },
  ],
};

export default docs;
