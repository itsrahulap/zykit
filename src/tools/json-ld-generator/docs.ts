import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'In **Build**, choose a **Schema type** (Article, Product, FAQPage, HowTo, Organization / LocalBusiness, Person, Event, BreadcrumbList, WebSite, SoftwareApplication, Recipe, JobPosting or VideoObject). Where there are variants, pick the exact `@type`.',
    'Fill in the form. Each field is marked **Required**, **Recommended** or **Optional** following Google rich-result guidance, and **Load example** shows a filled-in version.',
    'Watch the **Rich results check** panel for missing required or recommended properties and for malformed URLs, dates, durations, prices or currencies.',
    'Press **Copy snippet** and paste the `<script type="application/ld+json">` block into your page.',
    'To review markup you already have, switch to **Validate existing**, paste the JSON-LD (or the page snippet that contains it) and read which type was detected and what is missing.',
  ],
  howItWorks:
    'Each type is described by a list of fields with a dotted path (for example `offers.price`), a format and a level taken from Google\'s structured-data documentation. The form values are assembled into a nested object: the first time a path enters a nested object it gets the right schema.org `@type` (`Offer`, `PostalAddress`, `Person`...), numbers and booleans are written as JSON numbers and booleans, and repeating items such as FAQ questions, steps, reviews or opening hours become arrays. Empty fields are left out.\n\n' +
    'Validation is plain pattern checking: http(s) URLs, ISO 8601 dates (checked against the real calendar), date-times with optional zone, durations like `PT1H30M`, prices with a dot decimal and no symbol, three-letter capital currency codes, 24-hour times and weekday names.\n\n' +
    'The snippet is `JSON.stringify` with two-space indentation, with every `<` written as `\\u003c`, so text such as `</script>` inside a value cannot end the script element early. **Validate existing** parses your text as JSON (or pulls the `ld+json` script blocks out of HTML), follows `@graph` and arrays, finds each object\'s `@type` and runs the same checks, reading nested values whether they are objects, arrays or plain strings.',
  limits: [
    'Only the 14 listed type families are checked. Other `@type` values are listed as "not checked".',
    'Requirements follow Google\'s rich-result documentation, not the full schema.org vocabulary, so a property marked Optional here can still be valid and useful.',
    'Google no longer shows FAQ rich results for most sites, HowTo rich results at all, or the sitelinks search box; the markup is still valid schema.org.',
    'The checks cannot tell whether a URL exists, whether the image meets Google\'s size rules, or whether the markup matches what is visible on the page. Use Google\'s Rich Results Test for the final word.',
    'Entries in lists are limited to 50 and each field to 5,000 characters in a share link. Event offers, aggregate ratings and other deep structures are covered; arbitrary extra properties are not.',
  ],
  privacy:
    'Everything is built and checked in your browser. Nothing is sent anywhere, no URL you enter is fetched, and the pasted text in Validate existing is only parsed as data. A share link stores the form in the URL fragment, which browsers do not send to a server.',
  faqs: [
    {
      question: 'Where do I put the JSON-LD on my page?',
      answer: 'Anywhere in the `<head>` or `<body>`. Google reads it in both places. Add one script block per page type, or several blocks on the same page.',
    },
    {
      question: 'Why is my price flagged as invalid?',
      answer: 'The price must be a plain number with a dot decimal, like `19.99`. Put the currency in its own field as a three-letter code such as `USD`, and leave out symbols and thousands separators.',
    },
    {
      question: 'What is the difference between Required and Recommended?',
      answer: 'Required properties must be present for the page to be eligible for the rich result. Recommended ones are optional but give Google more to show. "Required if used" means the property is needed once you fill in any other field of the same group, such as an offer.',
    },
    {
      question: 'Can I paste a whole HTML page into Validate existing?',
      answer: 'Yes. If the text contains `<script type="application/ld+json">` blocks, each one is extracted and checked. Otherwise the text is treated as raw JSON.',
    },
  ],
};

export default docs;
