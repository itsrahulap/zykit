// User docs for OpenAPI Dependency Mapper, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste an OpenAPI 3.0 or 3.1 document (JSON or YAML) into the input, open a file, or click Try an example.',
    'Read the graph: operations on the left, the components they reference to the right, with arrows following each $ref.',
    'Narrow it down with the Tag, Method, Path or operationId and Schema name filters, and select a node to see its details.',
    'Check the warnings for unresolved or external $refs, then copy or download the summary as Markdown or JSON.',
  ],
  howItWorks:
    'The document is parsed with the same parser as the OpenAPI Designer (JSON.parse, or the yaml library loaded on first use). Every $ref inside each operation, including path-level parameters, request bodies and responses, is collected and resolved as a local JSON Pointer. Each resolved target becomes a component node, and its own $refs are followed breadth-first with a visited set, so nested and recursive schemas terminate; cycles are detected by checking whether a component can reach itself. The graph is laid out in columns by reference depth and drawn as plain SVG. Everything runs in your browser on the main thread.',
  limits: [
    'Input up to 2 MB, nested at most 64 levels; YAML alias expansion is capped.',
    'OpenAPI 3.0.x and 3.1.x only; Swagger 2.0 is refused.',
    'External $refs (other files or URLs) are reported but never fetched. Webhooks and path-item $refs are not mapped.',
    'Maps up to 2,000 operations and 3,000 components; the graph is drawn for up to 400 visible nodes, so use the filters on large APIs.',
  ],
  privacy:
    'Your document is processed locally and never uploaded. Nothing is stored except a spec handed over from the OpenAPI Designer, which passes through sessionStorage and is removed as soon as this page reads it.',
  faqs: [
    {
      question: 'Which schemas count as used by an operation?',
      answer:
        'Every component reachable through $refs from the operation’s parameters, request body and responses, directly or through other components. The details panel lists direct request and response references separately from the full set.',
    },
    {
      question: 'What happens with recursive schemas?',
      answer: 'They are followed once and marked with a "cycle" badge, for example a Category whose parent property refers to Category again. The map never loops.',
    },
    {
      question: 'Why is a component shown as unused?',
      answer: 'No operation reaches it through $refs. It may be dead code in the spec, or used only by webhooks or other constructs the map doesn’t follow.',
    },
    {
      question: 'Can it load $refs from other files?',
      answer: 'No. Remote references are listed as external and left unresolved, because the tool never makes network requests. Bundle the spec into one file first.',
    },
  ],
};

export default docs;
