import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste XML into **Input XML**, drop a file on it, or use **Open file** or **Try an example**.',
    'Pick an **Action**: **Format** to indent, **Minify** to remove the whitespace between elements, or **Validate** to only check it. For Format, choose 2 spaces, 4 spaces or a tab, and whether to tick **Keep comments**.',
    'If the XML is invalid, the error shows its line and column; use **Jump to error in input** to select the spot. Copy or download the result, or use **Send to…**.',
    'To query the XML, type an expression such as `//book[price > 10]/@id` in **XPath tester**. Matches are listed with their node path and text, with a count. For namespaced elements, map a prefix in **Namespace prefixes**, one `prefix=uri` per line.',
  ],
  howItWorks:
    'The text is read by this site’s own strict XML parser (also used by the XML ↔ JSON converter). It checks names, quotes, nesting, duplicate attributes and character references, and reports the first error with its line and column. A DOCTYPE is skipped and never interpreted. Only the five predefined entities and numeric references are decoded, so external entities and "billion laughs" files can’t do anything.\n\n' +
    'Formatting changes only the whitespace between elements. Elements that contain text, or have `xml:space="preserve"`, are written exactly as they are, and CDATA sections stay CDATA. The XPath tester re-serialises the checked XML (without the DOCTYPE), loads it into your browser’s `DOMParser` and runs your expression with `document.evaluate` (XPath 1.0). Everything runs in the page.',
  limits: [
    'Well-formedness only: there is no DTD or XML Schema validation, and the DOCTYPE is dropped from the output, with a note.',
    'Input over 20,000,000 characters is not processed; the XPath tester handles up to about 5 MB. Elements can be nested at most 1,000 levels deep.',
    'XPath is the browser’s XPath 1.0: no `fn:` functions from 2.0 or later. At most 1,000 matches are listed; the count shows the total.',
    'Attribute quote style and entity spelling are normalised (for example `&#65;` comes out as `A`), and attributes always use double quotes.',
    'Matched node paths describe the checked document, with whitespace between elements removed, so positions of text nodes can differ from your original.',
  ],
  privacy:
    'Your XML is parsed, formatted and queried in your browser and never uploaded or stored. **Copy share link** puts the input, options and XPath in the link’s `#` fragment, which browsers don’t send to servers; large documents show *Too large to share*. **Send to…** passes the output through this tab’s session storage, removed as soon as the other tool reads it.',
  faqs: [
    {
      question: 'Why does my XPath return nothing for an element that is clearly there?',
      answer:
        'Most often the document uses a default namespace (`xmlns="…"`). XPath 1.0 can’t match it without a prefix. Add a line such as `a=http://example.com/ns` under **Namespace prefixes** and query `//a:item`.',
    },
    {
      question: 'Does it change my text content when formatting?',
      answer:
        'No. Only whitespace between elements is added or removed. Elements that contain text keep every character, so `<p>Hello <b>big</b> world</p>` is left on one line.',
    },
    {
      question: 'Is it safe to paste a file with a DOCTYPE or entities?',
      answer:
        'Yes. The DOCTYPE is ignored and nothing is fetched or expanded. An entity such as `&custom;` is reported as an error instead of being resolved.',
    },
    {
      question: 'Can it validate against a schema?',
      answer: 'No. It checks that the XML is well-formed. Schema (XSD) and DTD validation are not supported.',
    },
    {
      question: 'What can XPath return besides nodes?',
      answer:
        'Numbers, strings and booleans. An expression like `count(//book)` or `string(//title)` shows its value instead of a list of nodes.',
    },
  ],
};

export default docs;
