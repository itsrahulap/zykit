// Example values and requests for the docs preview, built from the schemas themselves:
// `example`/`default`/`enum` win, otherwise a placeholder per type and format. Local refs only,
// with a depth cap and a seen-set so recursive schemas terminate.

import { asObject, isObject, resolveRef, type HttpMethod, type JsonObject } from './openapi';

const MAX_EXAMPLE_DEPTH = 8;
const MAX_PROPERTIES = 50;

const STRING_FORMATS: Record<string, string> = {
  'date-time': '2024-01-01T12:00:00Z',
  date: '2024-01-01',
  time: '12:00:00',
  email: 'user@example.com',
  uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  uri: 'https://example.com',
  url: 'https://example.com',
  hostname: 'example.com',
  ipv4: '192.0.2.1',
  ipv6: '2001:db8::1',
  byte: 'U3dhZ2dlcg==',
  password: '********',
};

export function exampleFromSchema(schema: unknown, doc: JsonObject, depth = 0, seen: ReadonlySet<string> = new Set()): unknown {
  if (!isObject(schema) || depth > MAX_EXAMPLE_DEPTH) return null;
  if (typeof schema.$ref === 'string') {
    if (seen.has(schema.$ref)) return null;
    return exampleFromSchema(resolveRef(doc, schema.$ref), doc, depth + 1, new Set([...seen, schema.$ref]));
  }
  if ('example' in schema) return schema.example;
  if (Array.isArray(schema.examples) && schema.examples.length) return schema.examples[0];
  if ('const' in schema) return schema.const;
  if ('default' in schema) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  if (Array.isArray(schema.allOf)) {
    const parts = schema.allOf.map((s) => exampleFromSchema(s, doc, depth + 1, seen));
    return parts.every(isObject) ? Object.assign({}, ...parts) : (parts[0] ?? null);
  }
  for (const key of ['oneOf', 'anyOf'] as const)
    if (Array.isArray(schema[key]) && schema[key].length) return exampleFromSchema(schema[key][0], doc, depth + 1, seen);

  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const type = types.find((t) => t !== 'null') ?? (schema.properties ? 'object' : schema.items ? 'array' : undefined);
  switch (type) {
    case 'object': {
      const out: JsonObject = {};
      for (const [name, prop] of Object.entries(asObject(schema.properties)).slice(0, MAX_PROPERTIES)) out[name] = exampleFromSchema(prop, doc, depth + 1, seen);
      return out;
    }
    case 'array':
      return [exampleFromSchema(schema.items, doc, depth + 1, seen)];
    case 'string':
      return STRING_FORMATS[String(schema.format)] ?? 'string';
    case 'integer':
    case 'number':
      return typeof schema.minimum === 'number' ? schema.minimum : 0;
    case 'boolean':
      return true;
    default:
      return null;
  }
}

/** Follows a `$ref` on a parameter/body/response object, or returns it as is. */
export function deref(doc: JsonObject, value: unknown): JsonObject {
  return asObject(isObject(value) && typeof value.$ref === 'string' ? resolveRef(doc, value.$ref) : value);
}

const shellQuote = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

/** The first media type of a `content` map and its schema. */
export function firstMedia(content: unknown): { type: string; schema: unknown } | null {
  const entry = Object.entries(asObject(content))[0];
  return entry ? { type: entry[0], schema: asObject(entry[1]).schema } : null;
}

const scalar = (v: unknown) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));

/** A curl command for one operation, with example values for path, query and header parameters and the body. */
export function exampleCurl(doc: JsonObject, path: string, method: HttpMethod, pathItem: JsonObject, operation: JsonObject): string {
  const server = Array.isArray(doc.servers) && isObject(doc.servers[0]) && typeof doc.servers[0].url === 'string' ? doc.servers[0].url.replace(/\/+$/, '') : 'https://api.example.com';
  const params = [...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []), ...(Array.isArray(operation.parameters) ? operation.parameters : [])].map((p) => deref(doc, p));
  const value = (p: JsonObject) => scalar(p.example ?? exampleFromSchema(p.schema, doc) ?? p.name);

  let url = path;
  for (const p of params) if (p.in === 'path') url = url.replaceAll(`{${String(p.name)}}`, encodeURIComponent(value(p)));
  const query = params.filter((p) => p.in === 'query').map((p) => `${encodeURIComponent(String(p.name))}=${encodeURIComponent(value(p))}`);
  const lines = [`curl -X ${method.toUpperCase()} ${shellQuote(server + url + (query.length ? `?${query.join('&')}` : ''))}`];
  for (const p of params) if (p.in === 'header') lines.push(`  -H ${shellQuote(`${String(p.name)}: ${value(p)}`)}`);

  const media = firstMedia(deref(doc, operation.requestBody).content);
  if (media) {
    lines.push(`  -H ${shellQuote(`Content-Type: ${media.type}`)}`);
    const body = exampleFromSchema(media.schema, doc);
    lines.push(`  -d ${shellQuote(typeof body === 'string' ? body : JSON.stringify(body, null, 2))}`);
  }
  return lines.join(' \\\n');
}

export interface ResponseExample {
  status: string;
  description: string;
  contentType?: string;
  body?: string;
}

export function exampleResponses(doc: JsonObject, operation: JsonObject): ResponseExample[] {
  return Object.entries(asObject(operation.responses)).map(([status, raw]) => {
    const response = deref(doc, raw);
    const media = firstMedia(response.content);
    return {
      status,
      description: typeof response.description === 'string' ? response.description : '',
      ...(media ? { contentType: media.type, body: JSON.stringify(exampleFromSchema(media.schema, doc), null, 2) } : {}),
    };
  });
}
