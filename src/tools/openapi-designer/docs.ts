// User docs for OpenAPI Designer, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Start from the example, click Start blank, or paste an existing OpenAPI 3.0/3.1 document (JSON or YAML) into the import box and click Import.',
    'Fill in Info, Servers and Tags, then add paths under Paths and operations and use "Add operation to …" to add GET, POST and other methods.',
    'For each operation set parameters, the request body and responses, picking a type or a component schema ($ref) in each Schema menu.',
    'Define reusable models under Component schemas as JSON Schema, and fix anything listed under Validation.',
    'Copy or download openapi.yaml or openapi.json, check the Docs preview, or click Map dependencies to open the spec in the OpenAPI Dependency Mapper.',
  ],
  howItWorks:
    'The document is kept as plain JSON in the page. Each form edits one field of it, so anything the forms don’t cover (webhooks, security schemes, x- extensions, custom schemas) is carried through unchanged. After every edit the document is validated (required info fields, path parameters versus the path template, response descriptions and status codes, duplicate operationIds, and every local $ref is resolved as a JSON Pointer), then written out as JSON and as YAML with the yaml library, loaded on first use. The docs preview builds example values from each schema’s example, default or enum, or a placeholder per type and format, and turns each operation into a curl command. Everything runs on the main thread in your browser.',
  limits: [
    'Imports up to 2 MB of text, nested at most 64 levels; YAML alias expansion is capped to stop "billion laughs" documents.',
    'OpenAPI 3.0.x and 3.1.x only. Swagger 2.0 is refused; 3.0 documents keep their version and 3.0-only keywords such as nullable are not converted.',
    'External $refs (other files or URLs) are kept in the output and flagged, but never fetched or resolved.',
    'The forms edit info, servers, tags, paths, operations, parameters, request bodies, responses and component schemas. Other constructs are listed on import and kept as is, but can only be changed by re-importing an edited document.',
    'The docs preview shows the first 100 endpoints, and example values stop 8 levels into nested or recursive schemas.',
  ],
  privacy:
    'Your spec never leaves the browser: parsing, validation and conversion run locally and nothing is uploaded. The current document is saved in this browser’s localStorage so it survives a reload. Map dependencies passes the JSON to the OpenAPI Dependency Mapper through sessionStorage, which it reads once and removes.',
  faqs: [
    {
      question: 'Will importing my spec lose fields the forms don’t support?',
      answer:
        'No. The tool edits the imported document in place, so unsupported parts such as webhooks, security schemes, callbacks or x- extensions stay in the JSON and YAML output exactly as imported. They are listed after import so you know they can’t be edited in the forms.',
    },
    {
      question: 'Does it download schemas from remote $ref URLs?',
      answer: 'Never. Only local references that start with # are resolved. A reference to another file or URL is kept in the output and shown as a warning under Validation.',
    },
    {
      question: 'How do I reuse a model in several operations?',
      answer:
        'Add it under Component schemas, then choose "$ref Name" (or "array of Name") in a parameter, request body or response Schema menu. The output uses $ref: "#/components/schemas/Name".',
    },
    {
      question: 'Where do the examples in the docs preview come from?',
      answer:
        'From your schemas: an example, examples, const, default or the first enum value wins, otherwise a placeholder based on the type and format (for example a UUID or an email address). Server URLs come from the first server.',
    },
  ],
};

export default docs;
