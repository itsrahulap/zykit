// Mock API definitions: endpoints with a method, path, status and JSON response, validated and
// exported as fixture files, a json-server db.json, or an OpenAPI 3.1 document Prism can serve.
// Pure logic; the page does the downloads.

import { parseJsonText, type TextError } from '../../../shared/lib/textpos';

export const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type Method = (typeof METHODS)[number];

export interface Endpoint {
  id: string;
  method: Method;
  /** `/users/:id` or `/users/{id}`. */
  path: string;
  status: number;
  description: string;
  /** JSON response body as text (may be empty for 204). */
  body: string;
}

export interface Project {
  name: string;
  endpoints: Endpoint[];
}

export const FORMAT = 'zykit-mock-api';
export const VERSION = 1;
export const MAX_ENDPOINTS = 500;

let counter = 0;
export const newId = () => `ep${Date.now().toString(36)}${(counter++).toString(36)}`;

const ep = (method: Method, path: string, status: number, description: string, body: unknown): Endpoint => ({
  id: newId(),
  method,
  path,
  status,
  description,
  body: body === undefined ? '' : JSON.stringify(body, null, 2),
});

const USERS = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin' },
  { id: 2, name: 'Alan Turing', email: 'alan@example.com', role: 'member' },
];
const PRODUCTS = [
  { id: 1, name: 'Coffee beans', price: 12.5, inStock: true },
  { id: 2, name: 'Tea leaves', price: 8, inStock: false },
];
const TASKS = [
  { id: 1, title: 'Write docs', done: false, assigneeId: 1 },
  { id: 2, title: 'Fix login bug', done: true, assigneeId: 2 },
];

export const SAMPLES: Record<'users' | 'products' | 'tasks', () => Project> = {
  users: () => ({
    name: 'Users API',
    endpoints: [
      ep('GET', '/users', 200, 'List users', USERS),
      ep('GET', '/users/:id', 200, 'Get one user', USERS[0]),
      ep('POST', '/users', 201, 'Create a user', { id: 3, name: 'Grace Hopper', email: 'grace@example.com', role: 'member' }),
      ep('DELETE', '/users/:id', 204, 'Delete a user', undefined),
      ep('GET', '/users/:id/missing', 404, 'Not found example', { error: 'not_found', message: 'User not found' }),
    ],
  }),
  products: () => ({
    name: 'Products API',
    endpoints: [ep('GET', '/products', 200, 'List products', PRODUCTS), ep('GET', '/products/{id}', 200, 'Get one product', PRODUCTS[0]), ep('PATCH', '/products/{id}', 200, 'Update a product', { ...PRODUCTS[1], inStock: true })],
  }),
  tasks: () => ({
    name: 'Tasks API',
    endpoints: [ep('GET', '/tasks', 200, 'List tasks', TASKS), ep('POST', '/tasks', 201, 'Create a task', { id: 3, title: 'New task', done: false, assigneeId: 1 }), ep('PUT', '/tasks/:id', 200, 'Replace a task', { ...TASKS[0], done: true })],
  }),
};

// ---------- validation ----------

const SEGMENT = /^(?:[A-Za-z0-9._~-]+|:[A-Za-z_]\w*|\{[A-Za-z_]\w*\})$/;

/** Path parameter names in order (`:id` and `{id}` both count). */
export function pathParams(path: string): string[] {
  return path
    .split('/')
    .filter((s) => /^:|^\{/.test(s))
    .map((s) => s.replace(/^:|^\{|\}$/g, ''));
}

/** The route with parameters written as `{name}` (OpenAPI style). */
export const openApiPath = (path: string) => path.replace(/\/:([A-Za-z_]\w*)/g, '/{$1}');

/** Two routes clash when they differ only in parameter names. */
const routeKey = (e: Endpoint) => `${e.method} ${openApiPath(e.path).replace(/\{[^}]+\}/g, '{}')}`;

export interface EndpointProblems {
  path?: string;
  status?: string;
  body?: TextError | { message: string };
  duplicate?: string;
}

export function pathError(path: string): string | null {
  if (!path.startsWith('/')) return 'Start the path with /.';
  if (path === '/') return null;
  const segs = path.slice(1).split('/');
  if (segs.some((s) => !s)) return 'No empty segments (// or a trailing /).';
  const bad = segs.find((s) => !SEGMENT.test(s));
  if (bad) return `“${bad}” isn’t a valid segment: use letters, digits, . _ ~ - or a parameter like :id or {id}.`;
  const names = pathParams(path);
  if (new Set(names).size !== names.length) return 'Each parameter name can appear only once.';
  return null;
}

export function validateProject(p: Project): Map<string, EndpointProblems> {
  const out = new Map<string, EndpointProblems>();
  const seen = new Map<string, Endpoint>();
  for (const e of p.endpoints) {
    const probs: EndpointProblems = {};
    const pe = pathError(e.path);
    if (pe) probs.path = pe;
    if (!Number.isInteger(e.status) || e.status < 100 || e.status > 599) probs.status = 'Use an HTTP status from 100 to 599.';
    // An empty body is allowed (204, DELETE…); anything else must be JSON.
    if (e.body.trim()) {
      const parsed = parseJsonText(e.body);
      if (!parsed.ok) probs.body = parsed.error;
    }
    const key = routeKey(e);
    const first = seen.get(key);
    if (first && !pe) probs.duplicate = `Same route as another ${e.method} ${first.path}.`;
    else seen.set(key, e);
    if (Object.keys(probs).length) out.set(e.id, probs);
  }
  return out;
}

const bodyValue = (e: Endpoint): unknown => (e.body.trim() ? JSON.parse(e.body) : undefined);

// ---------- exports ----------

/** One fixture file per endpoint, named after its method and path. */
export function fixtureFiles(p: Project): { name: string; text: string }[] {
  return p.endpoints.map((e) => {
    const slug = openApiPath(e.path).replace(/[{}]/g, '').replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'root';
    return { name: `${e.method.toLowerCase()}_${slug}_${e.status}.json`, text: `${e.body.trim() ? JSON.stringify(bodyValue(e), null, 2) : 'null'}\n` };
  });
}

/**
 * json-server's db.json: one top-level key per collection, taken from `GET /<name>` endpoints whose
 * response is an array. json-server then serves list, get-by-id, create, update and delete itself.
 */
export function jsonServerDb(p: Project): { text: string; collections: string[]; skipped: number } {
  const db: Record<string, unknown> = {};
  for (const e of p.endpoints) {
    const m = /^\/([A-Za-z0-9_-]+)$/.exec(e.path);
    const value = e.body.trim() ? bodyValue(e) : undefined;
    if (e.method === 'GET' && m && Array.isArray(value) && !(m[1] in db)) db[m[1]] = value;
  }
  const collections = Object.keys(db);
  return { text: `${JSON.stringify(db, null, 2)}\n`, collections, skipped: p.endpoints.length - collections.length };
}

const REASON: Record<number, string> = { 200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 409: 'Conflict', 422: 'Unprocessable Content', 500: 'Internal Server Error' };

/** An OpenAPI 3.1 document with each endpoint's body as the example response. */
export function openApiDocument(p: Project): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const e of p.endpoints) {
    const path = openApiPath(e.path);
    const item = (paths[path] ??= {});
    const params = pathParams(e.path);
    if (params.length && !item.parameters) item.parameters = params.map((name) => ({ name, in: 'path', required: true, schema: { type: 'string' } }));
    const value = e.body.trim() ? bodyValue(e) : undefined;
    const response: Record<string, unknown> = { description: e.description || REASON[e.status] || `Status ${e.status}` };
    if (value !== undefined) response.content = { 'application/json': { example: value } };
    const op: Record<string, unknown> = { responses: { [String(e.status)]: response } };
    if (e.description) op.summary = e.description;
    item[e.method.toLowerCase()] = op;
  }
  return { openapi: '3.1.0', info: { title: p.name || 'Mock API', version: '1.0.0' }, paths };
}

// ---------- project files ----------

export function exportProject(p: Project): string {
  return `${JSON.stringify({ format: FORMAT, version: VERSION, name: p.name, endpoints: p.endpoints.map(({ method, path, status, description, body }) => ({ method, path, status, description, body })) }, null, 2)}\n`;
}

/** Reads a project file written by `exportProject`, checking every field (the file is untrusted). */
export function importProject(text: string): Project {
  const parsed = parseJsonText(text);
  if (!parsed.ok) throw new Error(`Not valid JSON: ${parsed.error.message}`);
  const v = parsed.value as Record<string, unknown> | null;
  if (!v || typeof v !== 'object' || v.format !== FORMAT) throw new Error('This isn’t a Mock API Generator project file.');
  if (v.version !== VERSION) throw new Error(`Unsupported project version ${String(v.version)}.`);
  if (!Array.isArray(v.endpoints)) throw new Error('The project has no endpoints list.');
  if (v.endpoints.length > MAX_ENDPOINTS) throw new Error(`At most ${MAX_ENDPOINTS} endpoints can be imported.`);
  const endpoints = v.endpoints.map((raw, i): Endpoint => {
    const e = raw as Record<string, unknown>;
    if (!e || typeof e !== 'object' || !METHODS.includes(e.method as Method) || typeof e.path !== 'string' || typeof e.status !== 'number')
      throw new Error(`Endpoint ${i + 1} needs a method (${METHODS.join(', ')}), a path and a numeric status.`);
    return { id: newId(), method: e.method as Method, path: e.path, status: e.status, description: typeof e.description === 'string' ? e.description : '', body: typeof e.body === 'string' ? e.body : '' };
  });
  return { name: typeof v.name === 'string' ? v.name : 'Imported API', endpoints };
}
