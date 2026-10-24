// User docs for Mock API Generator, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Start from a sample (users, products or tasks), or press **Add endpoint**.',
    'For each endpoint, set the **Method**, **Path** (use `:id` or `{id}` for parameters), **Status** and the **Response body** as JSON. Problems are shown next to the field and marked “fix” in the list.',
    'Pick an export: **OpenAPI YAML** or **JSON** (serve it with Prism), or **json-server db.json**. Copy or download it, or download every response as **Fixtures (ZIP)** for your tests.',
    'Use **Export project** to save your endpoints as a file, and **Import project** to load it again. The current project is also kept in this browser.',
  ],
  howItWorks:
    'Each endpoint is checked before anything is exported: the path must use valid characters and name each parameter once, the status must be a real HTTP status, and the body must be valid JSON. Two endpoints with the same method and a path that differs only in parameter names (`/users/:id` and `/users/{userId}`) count as the same route.\n\n' +
    'The OpenAPI 3.1 export turns `:id` into `{id}`, declares every path parameter, and uses each body as the example response, which is what Prism returns when you run `prism mock openapi.yaml`. The json-server export collects every `GET /name` endpoint that returns a list into `db.json`; json-server then serves list, get, create, update and delete for those collections. Fixtures are one JSON file per endpoint, named after its method, path and status.',
  limits: [
    'This tool writes files; it doesn’t run a server or answer requests. Run Prism or json-server yourself to serve the mock.',
    'One response per method and path, with a fixed body: no request matching, custom headers, delays or generated data.',
    'json-server only understands collections, so endpoints other than `GET /name` returning a list are left out of `db.json` (the page says how many).',
    'The OpenAPI document contains examples but no schemas, and up to 500 endpoints can be imported.',
  ],
  privacy: 'Everything runs in your browser. Your project is saved only in this browser’s local storage, and nothing is uploaded or sent anywhere.',
  faqs: [
    {
      question: 'How do I serve the mock API?',
      answer:
        'Download the OpenAPI file and run `npx @stoplight/prism-cli mock openapi.yaml`, or download `db.json` and run `npx json-server db.json`. Both start a local server you can call from your app.',
    },
    {
      question: 'Prism or json-server: which should I use?',
      answer:
        'Prism returns exactly the examples you wrote for every route and status, which suits front-end work against a fixed contract. json-server gives you a writable fake database for simple collections, so created and deleted items persist while it runs.',
    },
    {
      question: 'Where is my project stored?',
      answer: 'In this browser’s local storage only. Use **Export project** to keep a copy or move it to another device; clearing site data removes it.',
    },
  ],
};

export default docs;
