import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Direction**: **XML → JSON** or **JSON → XML**.',
    'Paste into the input, drop a file on it, or use **Open file**. Opening a `.json` file switches to JSON → XML, and `.xml`, `.svg`, `.rss` and similar files switch to XML → JSON. **Try an example** fills in a sample.',
    'For XML → JSON, choose the **JSON indent** and options such as **Always use arrays**, **Trim text**, **Numbers and booleans** and **Keep comments**.',
    'For JSON → XML, choose the **XML indent** (**2 spaces**, **4 spaces**, **Tab** or **Compact**) and whether to add the **XML declaration**.',
    'Copy or download the result, or press **Swap** to turn the output into the new input and convert it back.',
  ],
  howItWorks:
    'XML is read by a small, strict parser built into the tool, not the browser’s DOM parser. Tags must be properly nested and closed, attribute values must be quoted, and there must be exactly one root element. Text is decoded for the five predefined entities (`&amp;` `&lt;` `&gt;` `&quot;` `&apos;`) and numeric references such as `&#169;`. CDATA sections are read as plain text. A DOCTYPE is skipped and never interpreted, so entities it declares are not expanded and external DTDs are never loaded.\n\n' +
    'In the JSON, attributes become keys starting with `@` (`@id`), and repeated sibling elements become an array. An element with only text becomes a plain string. Text next to attributes or child elements goes under `#text`, and comments go under `#comment` when kept. The XML declaration becomes `?xml`, and other processing instructions at the top level become `?target` keys. Namespace prefixes stay part of the name (`dc:title`), and `xmlns` declarations are ordinary `@xmlns:…` attributes. With **Numbers and booleans**, `true`, `false` and JSON-style numbers in text and attributes become JSON values. Integers too large to store exactly, and values like `007`, stay strings.\n\n' +
    'JSON → XML follows the same conventions in reverse. `@` keys become attributes, `#text` text, `#cdata` a CDATA section and `#comment` comments, and an array becomes one element per item. `null` and empty strings become empty elements (`<tag/>`). If the JSON doesn’t have exactly one top-level key, the content is wrapped in `<root>`. A top-level array becomes `<root>` with one `<item>` per entry. Conversion runs in the page as you type.',
  limits: [
    'Input is limited to about 20 MB (20 million characters); opened or dropped files to 10 MB.',
    'Only the five predefined entities and numeric character references are supported. Other named entities, such as `&nbsp;`, are reported as errors.',
    'Elements can be nested up to 1,000 levels deep.',
    'XML → JSON doesn’t keep the order between text, comments and child elements. Mixed text is joined into one `#text` value, CDATA is not marked, and processing instructions inside elements are dropped.',
    'Namespaces are not resolved: prefixes are kept as written and not mapped to their URIs.',
    'JSON → XML reads JSON with the browser’s standard parser, so integers beyond 2^53 lose precision. Keys that aren’t valid XML names (for example ones with spaces or starting with a digit) are rejected with the path of the bad key.',
    'Output longer than 1 million characters is only partly shown on screen; copy or download to get all of it.',
  ],
  privacy:
    'Conversion happens entirely in your browser and files are read locally. Nothing is uploaded or stored, and the parser never fetches DTDs or external entities. **Share** copies a link with your input and options in the URL’s `#` fragment, which browsers don’t send to servers, though anyone with the link can read it. If you use **Send to…** to open the result in another tool, it is handed over through this tab’s session storage and removed as soon as that tool reads it.',
  faqs: [
    {
      question: 'How are XML attributes represented in JSON?',
      answer:
        'As keys starting with `@`, next to the element’s children. `<price currency="EUR">12.50</price>` becomes `{"price": {"@currency": "EUR", "#text": "12.50"}}`. The same keys turn back into attributes when converting JSON to XML.',
    },
    {
      question: 'Why is one element an object and another an array?',
      answer:
        'An element that appears once becomes a single value, and one that repeats becomes an array. If your code expects the same shape every time, turn on **Always use arrays** so every child element is an array, even with one item.',
    },
    {
      question: 'Is it safe to convert XML with a DOCTYPE?',
      answer:
        'Yes. The DOCTYPE is skipped and a notice says so. Entities it declares are never expanded and external DTDs are never loaded, which protects against XXE and “billion laughs” files. References to those entities in the document are then reported as unknown.',
    },
    {
      question: 'What happens to namespaces?',
      answer:
        'Prefixed names are kept as written, so `<dc:title>` becomes a `dc:title` key, and `xmlns:dc` becomes an `@xmlns:dc` attribute. Prefixes aren’t resolved to their namespace URIs.',
    },
    {
      question: 'Why are my numbers strings in the JSON?',
      answer:
        'XML has no types, so all text stays a string by default. Turn on **Numbers and booleans** to turn values like `42`, `12.5` and `true` into JSON numbers and booleans. Values with leading zeros and very large integers stay strings so nothing is lost.',
    },
  ],
};

export default docs;
