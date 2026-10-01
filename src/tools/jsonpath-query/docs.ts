import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste a document into **JSON**, drop a file on it or use **Open file**. **Try an example** loads a sample bookstore document and query.',
    'Type a query into **JSONPath query**, starting with `$`, for example `$.store.book[*].author`. Results update as you type. **Examples** has more queries to try.',
    'Read the matches: each one shows its value and its normalized path, such as `$[\'store\'][\'book\'][0]`.',
    'Use **Copy values** for a JSON array of the matched values, **Copy paths** for one path per line, **Download .json**, or **Send to…** another tool.',
  ],
  howItWorks:
    'Queries follow RFC 9535, the standard JSONPath syntax: `$` for the root, `.name` and `[\'name\']` for members, `*` for all children, `..` for all descendants, `[0]` and `[-1]` for indexes, `[start:end:step]` for slices, several selectors in one bracket such as `[0,2]`, and filters such as `[?@.price < 10 && @.category == \'fiction\']`. Filters support `==`, `!=`, `<`, `<=`, `>`, `>=`, `&&`, `||`, `!`, parentheses, existence tests like `[?@.isbn]`, and the standard functions `length()`, `count()`, `match()`, `search()` and `value()`.\n\n' +
    'The query is parsed and type-checked first, so mistakes are reported with their column before anything runs. Filters are interpreted from the parsed query and never executed as code. The JSON is checked with the same strict parser as the JSON Formatter, so syntax errors show their line and column.\n\n' +
    'Evaluation runs in a Web Worker in your browser, shortly after you stop typing, and is stopped if it takes longer than 3 seconds.',
  limits: [
    'Only RFC 9535 syntax is supported. Non-standard extensions found in other JSONPath libraries, such as script expressions `(...)`, `@.length` for an array’s length or extra operators like `in` and `=~`, aren’t; use `length(@)` or `match()` instead.',
    '`match()` and `search()` take I-Regexp patterns (RFC 9485), run with the browser’s regular expression engine; an invalid pattern simply doesn’t match.',
    'A query is stopped after 3 seconds, or when it produces more than 1,000,000 nodes (for example `$..*` on a huge document).',
    'The page shows the first 300 matches, and long values are cut after 4,000 characters. Copy and download include up to the first 2,000 matches; the match count is always exact.',
    'Values are read with `JSON.parse`, so integers beyond 2^53 lose precision, duplicate keys keep the last value, and numeric-looking keys are listed first in an object.',
  ],
  privacy:
    'The JSON and the query are processed in your browser and never uploaded or stored. The **Share** button (Copy share link) puts the JSON and the query in the link’s `#` fragment, which browsers don’t send to servers; links are limited in size, so large documents show *Too large to share*. JSON sent here or from here with **Send to…** passes through this tab’s session storage and is removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Which JSONPath syntax does it use?',
      answer:
        'RFC 9535, the IETF standard published in 2024. It is close to the original Goessner JSONPath for basic paths, but filters are written `[?@.price < 10]` (parentheses are optional), strings can use single or double quotes, and only the five standard functions exist.',
    },
    {
      question: 'Why does my query from another library give an error?',
      answer:
        'Many older JSONPath libraries support non-standard extensions, like script expressions, `.length` on arrays or extra operators. Rewrite them in RFC 9535 form, for example `length(@.items) > 2` instead of `@.items.length > 2`.',
    },
    {
      question: 'What is the difference between `match()` and `search()`?',
      answer:
        '`match()` tests whether the whole string matches the pattern, `search()` whether any part of it does. So `match(@.author, \'.*Tolkien\')` and `search(@.author, \'Tolkien\')` find the same books.',
    },
    {
      question: 'Why can’t I compare `@.items[*]` in a filter?',
      answer:
        'Comparisons need a single value, so only singular queries made of names and indexes can be compared. To test a list, use `count()`, `length()` or a nested filter.',
    },
    {
      question: 'Why did my query stop after 3 seconds?',
      answer:
        'A `match()` or `search()` pattern with heavy backtracking, or a very broad query on a large document, can take a long time. The worker is stopped so the page stays responsive; narrow the query or simplify the pattern.',
    },
  ],
};

export default docs;
