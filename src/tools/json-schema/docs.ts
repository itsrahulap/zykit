import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste a schema into **JSON Schema** and the data to check into **JSON document**, or load files with **Open schema** and **Open JSON**. **Try an example** loads a schema with a document that breaks several rules.',
    'Pick the **Draft**: **Auto ($schema)** reads the schema’s `$schema`, or force **2020-12** or **Draft-07**. Untick **Check formats (date-time, email, ipv4, uuid, uri…)** to treat `format` as a hint only.',
    'Read the result: the status line says whether the document is valid, and each error lists the failing location in the document, a message and the schema path. **Copy errors** copies the list.',
    'No schema yet? Paste a sample document and press **Generate schema from JSON**, then edit the generated schema and use **Copy schema**.',
  ],
  howItWorks:
    'Validation is done by a validator built into the tool, running in a background worker. It supports draft 2020-12 and draft-07 (draft-04 and draft-06 schemas are checked with draft-07 rules, and 2019-09 with 2020-12). Supported keywords include `type`, `enum`, `const`, number and string limits, `pattern`, `items`/`prefixItems`/`additionalItems`, `contains` with `minContains`/`maxContains`, `uniqueItems`, `properties`, `patternProperties`, `additionalProperties`, `propertyNames`, `required`, `dependentRequired`, `dependentSchemas` and `dependencies`, `allOf`, `anyOf`, `oneOf`, `not` and `if`/`then`/`else`. Every error is reported, not just the first.\n\n' +
    '`$ref` resolves inside the same schema: JSON Pointers such as `#/$defs/address`, `$defs` and `definitions`, `$anchor`, and `$id`-based references. In draft-07, keywords next to a `$ref` are ignored, as the spec says. String lengths count Unicode characters, so an emoji counts as one, and `pattern` uses JavaScript regular expressions with Unicode support and is not anchored. With format checking on, `date-time`, `date`, `time`, `email`, `ipv4`, `ipv6`, `uuid` and `uri` are checked; other formats are ignored.\n\n' +
    '**Generate schema from JSON** infers a schema that your sample passes. It records the types it finds, nested object properties, and array items merged across all elements. Keys present in every object are marked `required`, and string formats such as `date-time`, `email` or `uuid` are added when every value matches. Mixed types become a `type` list, or `anyOf` when objects or arrays are involved.',
  limits: [
    'Remote schemas are never fetched. A `$ref` to another URL or file is reported as unresolvable.',
    '`unevaluatedProperties` and `unevaluatedItems` aren’t supported and are ignored with a notice. `$dynamicRef` is resolved like a plain `$ref`.',
    'Validation is stopped after 3 seconds, for example when a `pattern` backtracks catastrophically.',
    'At most 500 errors are listed. Schemas that recurse more than 300 levels, such as a `$ref` loop, report an error instead of hanging.',
    'Both inputs are read with the browser’s standard JSON parser for validation, so integers beyond 2^53 are compared after rounding. Opened or dropped files are limited to 10 MB.',
    'The generated schema only reflects your sample. It never adds `additionalProperties: false`, `enum`, number ranges or string lengths.',
  ],
  privacy:
    'Validation and schema generation run entirely in your browser, in a background worker; nothing is uploaded or stored, and remote `$ref`s are never fetched. **Share** copies a link with both inputs and the options in the URL’s `#` fragment, which browsers don’t send to servers, though anyone with the link can read it. JSON sent here from another tool with **Send to…** goes into the document box through this tab’s session storage and is removed as soon as it is read.',
  faqs: [
    {
      question: 'Which JSON Schema drafts are supported?',
      answer:
        'Draft 2020-12 and draft-07. With **Auto ($schema)**, the draft is read from the schema’s `$schema` and defaults to 2020-12. Draft-04 and draft-06 schemas are checked with draft-07 rules and 2019-09 with 2020-12 rules, with a notice.',
    },
    {
      question: 'Why does an invalid email pass validation?',
      answer:
        'Only when **Check formats** is off. The JSON Schema spec treats `format` as an annotation by default, so many validators skip it. With the option on, the tool checks `email`, `date-time`, `date`, `time`, `ipv4`, `ipv6`, `uuid` and `uri`.',
    },
    {
      question: 'Can my schema reference another schema file?',
      answer:
        'Not yet. `$ref` resolves within the pasted schema only, using `$defs`, `definitions`, JSON Pointers, `$anchor` or `$id`. References to other URLs are reported as unresolvable and are never downloaded. Copy the referenced definitions into `$defs` instead.',
    },
    {
      question: 'Why did validation stop after a few seconds?',
      answer:
        'A `pattern` like `^(a+)+$` can take exponential time on some strings. The validator runs in a worker and is stopped after 3 seconds so the page stays responsive. Simplify the pattern and validation resumes as you type.',
    },
    {
      question: 'How do I read the error paths?',
      answer:
        'The first path is a JSON Pointer into your document, such as `/address/zip`, or *(root)* for the whole document. The second is the schema keyword that failed, such as `#/$defs/address/properties/zip/pattern`. With `$ref`, it points at the referenced definition.',
    },
  ],
};

export default docs;
