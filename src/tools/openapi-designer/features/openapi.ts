// OpenAPI 3.x document parsing, validation, $ref resolution and serialization. Pure (no DOM), and
// shared with the OpenAPI Dependency Mapper. The document is kept as plain JSON, so fields the
// forms don't know about survive every edit and round trip untouched.

import { parseJsonText, textError, type TextError } from '../../../shared/lib/textpos';
import { jsonToYaml, yamlToJson } from '../../yaml-json/features/convert';

/** Input text larger than this is refused before parsing. */
export const MAX_SPEC_CHARS = 2 * 1024 * 1024;
/** Deeper nesting than this is refused, so recursive walkers can't blow the stack. */
export const MAX_DEPTH = 64;

export type JsonObject = { [key: string]: unknown };

export const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];
export const PARAMETER_LOCATIONS = ['query', 'header', 'path', 'cookie'] as const;
/** Component names allowed by the OpenAPI spec (`^[a-zA-Z0-9.\-_]+$`). */
export const COMPONENT_NAME = /^[A-Za-z0-9._-]+$/;

export const isObject = (v: unknown): v is JsonObject => typeof v === 'object' && v !== null && !Array.isArray(v);
export const asObject = (v: unknown): JsonObject => (isObject(v) ? v : {});
export const isMethod = (k: string): k is HttpMethod => (HTTP_METHODS as readonly string[]).includes(k);

export type ParseResult = { ok: true; doc: JsonObject; format: 'json' | 'yaml'; warnings: string[] } | { ok: false; error: TextError };

/** Deepest nesting of objects/arrays in `value`, counted iteratively; stops early past `limit`. */
export function nestingDepth(value: unknown, limit = MAX_DEPTH): number {
  let max = 0;
  const stack: [unknown, number][] = [[value, 0]];
  while (stack.length) {
    const [v, d] = stack.pop()!;
    if (typeof v !== 'object' || v === null) continue;
    if (d + 1 > max) max = d + 1;
    if (max > limit) return max;
    for (const child of Object.values(v)) stack.push([child, d + 1]);
  }
  return max;
}

/** Parses an OpenAPI 3.x document from JSON or YAML. Never fetches anything. */
export async function parseSpec(text: string): Promise<ParseResult> {
  if (!text.trim()) return { ok: false, error: textError(text, 0, 'The document is empty.') };
  if (text.length > MAX_SPEC_CHARS) return { ok: false, error: textError(text, 0, `The document is larger than ${MAX_SPEC_CHARS / 1024 / 1024} MB.`) };

  let value: unknown;
  let format: 'json' | 'yaml';
  const warnings: string[] = [];
  if (/^\s*[{[]/.test(text)) {
    format = 'json';
    const parsed = parseJsonText(text);
    if (!parsed.ok) return parsed;
    value = parsed.value;
  } else {
    format = 'yaml';
    // yamlToJson caps alias expansion (billion laughs) and reports located syntax errors.
    const converted = await yamlToJson(text, { indent: 'min', allDocuments: false });
    if (!converted.ok) return converted;
    warnings.push(...converted.warnings);
    value = JSON.parse(converted.output) as unknown;
  }

  const fail = (message: string): ParseResult => ({ ok: false, error: textError(text, 0, message) });
  if (!isObject(value)) return fail('Not an OpenAPI document: the top level must be an object.');
  if (nestingDepth(value) > MAX_DEPTH) return fail(`The document is nested deeper than ${MAX_DEPTH} levels.`);
  if ('swagger' in value) return fail('Swagger 2.0 isn’t supported. Convert it to OpenAPI 3 first.');
  if (typeof value.openapi !== 'string' || !/^3\.[01]\.\d+/.test(value.openapi))
    return fail('Not an OpenAPI 3.0 or 3.1 document: the "openapi" field must be a version like "3.1.0".');
  return { ok: true, doc: value, format, warnings };
}

// ---------- $ref handling ----------

export const isLocalRef = (ref: string) => ref === '#' || ref.startsWith('#/');

/** Resolves a local JSON Pointer `$ref` (`#/components/schemas/Pet`) inside `doc`; undefined if missing or remote. */
export function resolveRef(doc: unknown, ref: string): unknown {
  if (!isLocalRef(ref)) return undefined;
  let node: unknown = doc;
  for (const raw of ref.slice(2).split('/').filter((_, i, all) => ref !== '#' || all.length > 1 || i > 0)) {
    let key: string;
    try {
      key = decodeURIComponent(raw).replace(/~1/g, '/').replace(/~0/g, '~');
    } catch (err) {
      if (err instanceof URIError) return undefined;
      throw err;
    }
    if (Array.isArray(node) && /^\d+$/.test(key)) node = node[Number(key)];
    else if (isObject(node) && Object.hasOwn(node, key)) node = node[key];
    else return undefined;
  }
  return node;
}

/** JSON Pointer escaping for one path segment. */
export const pointerSegment = (key: string) => key.replace(/~/g, '~0').replace(/\//g, '~1');

export interface RefUse {
  ref: string;
  /** JSON Pointer of the object holding the `$ref`. */
  at: string;
}

/** Every `$ref` string inside `value` (not following them). Iterative, so depth can't overflow the stack. */
export function collectRefs(value: unknown, at = '#'): RefUse[] {
  const out: RefUse[] = [];
  const stack: [unknown, string][] = [[value, at]];
  while (stack.length) {
    const [v, path] = stack.pop()!;
    if (typeof v !== 'object' || v === null) continue;
    if (!Array.isArray(v) && typeof (v as JsonObject).$ref === 'string') out.push({ ref: (v as JsonObject).$ref as string, at: path });
    const entries = Object.entries(v);
    for (let i = entries.length - 1; i >= 0; i--) stack.push([entries[i][1], `${path}/${pointerSegment(entries[i][0])}`]);
  }
  return out;
}

// ---------- validation ----------

export interface Issue {
  level: 'error' | 'warning';
  /** JSON Pointer of the offending node. */
  at: string;
  message: string;
}

/** `{name}` placeholders of a path template, in order. */
export const pathParams = (path: string) => [...path.matchAll(/\{([^{}]+)\}/g)].map((m) => m[1]);

/** Structural checks for the parts the designer edits, plus every `$ref` in the document. */
export function validateSpec(doc: JsonObject): Issue[] {
  const issues: Issue[] = [];
  const err = (at: string, message: string) => issues.push({ level: 'error', at, message });
  const warn = (at: string, message: string) => issues.push({ level: 'warning', at, message });
  const deref = (v: unknown) => (isObject(v) && typeof v.$ref === 'string' ? resolveRef(doc, v.$ref) : v);

  const info = doc.info;
  if (!isObject(info)) err('#/info', 'info is required.');
  else {
    if (typeof info.title !== 'string' || !info.title.trim()) err('#/info/title', 'info.title is required.');
    if (typeof info.version !== 'string' || !info.version.trim()) err('#/info/version', 'info.version is required.');
  }

  if (doc.servers !== undefined) {
    if (!Array.isArray(doc.servers)) err('#/servers', 'servers must be a list.');
    else doc.servers.forEach((s, i) => (!isObject(s) || typeof s.url !== 'string' || !s.url.trim()) && err(`#/servers/${i}`, `Server ${i + 1} needs a URL.`));
  }

  if (doc.tags !== undefined) {
    if (!Array.isArray(doc.tags)) err('#/tags', 'tags must be a list.');
    else {
      const seen = new Set<string>();
      doc.tags.forEach((t, i) => {
        const name = isObject(t) ? t.name : undefined;
        if (typeof name !== 'string' || !name.trim()) err(`#/tags/${i}`, `Tag ${i + 1} needs a name.`);
        else if (seen.has(name)) err(`#/tags/${i}`, `Tag "${name}" is listed twice.`);
        else seen.add(name);
      });
    }
  }

  const operationIds = new Map<string, string>();
  if (doc.paths !== undefined && !isObject(doc.paths)) err('#/paths', 'paths must be an object.');
  for (const [path, item] of Object.entries(asObject(doc.paths))) {
    const itemAt = `#/paths/${pointerSegment(path)}`;
    if (!path.startsWith('/')) err(itemAt, `Path "${path}" must start with "/".`);
    if (!isObject(item)) {
      err(itemAt, `Path "${path}" must be an object.`);
      continue;
    }
    const sharedParams = Array.isArray(item.parameters) ? item.parameters : [];
    const templateParams = pathParams(path);
    for (const [method, operation] of Object.entries(item)) {
      if (!isMethod(method)) continue;
      const at = `${itemAt}/${method}`;
      const label = `${method.toUpperCase()} ${path}`;
      if (!isObject(operation)) {
        err(at, `${label} must be an object.`);
        continue;
      }
      if (typeof operation.operationId === 'string') {
        const other = operationIds.get(operation.operationId);
        if (other) err(`${at}/operationId`, `operationId "${operation.operationId}" is used by both ${other} and ${label}.`);
        else operationIds.set(operation.operationId, label);
      }

      const params = [...sharedParams, ...(Array.isArray(operation.parameters) ? operation.parameters : [])];
      const declared = new Set<string>();
      params.forEach((p, i) => {
        const param = deref(p);
        const pAt = `${at}/parameters/${i}`;
        if (!isObject(param)) return;
        if (typeof param.name !== 'string' || !param.name.trim()) err(pAt, `${label}: a parameter has no name.`);
        if (!(PARAMETER_LOCATIONS as readonly unknown[]).includes(param.in)) err(pAt, `${label}: parameter "${String(param.name)}" needs "in" (query, header, path or cookie).`);
        if (param.in === 'path') {
          declared.add(String(param.name));
          if (param.required !== true) err(pAt, `${label}: path parameter "${String(param.name)}" must be required.`);
          if (!templateParams.includes(String(param.name))) err(pAt, `${label}: path parameter "${String(param.name)}" isn’t in the path.`);
        }
        if (param.schema === undefined && param.content === undefined) warn(pAt, `${label}: parameter "${String(param.name)}" has no schema.`);
      });
      for (const name of templateParams) if (!declared.has(name)) err(`${at}/parameters`, `${label}: path parameter "${name}" isn’t declared.`);

      const body = deref(operation.requestBody);
      if (operation.requestBody !== undefined && isObject(body) && !isObject(body.content)) err(`${at}/requestBody`, `${label}: the request body needs content.`);

      if (operation.responses === undefined) {
        if (String(doc.openapi).startsWith('3.0')) err(`${at}/responses`, `${label}: responses are required in OpenAPI 3.0.`);
        else warn(`${at}/responses`, `${label} has no responses.`);
      } else if (!isObject(operation.responses)) err(`${at}/responses`, `${label}: responses must be an object.`);
      else
        for (const [status, response] of Object.entries(operation.responses)) {
          if (status !== 'default' && !/^[1-5](\d\d|XX)$/.test(status)) err(`${at}/responses/${pointerSegment(status)}`, `${label}: "${status}" isn’t a status code.`);
          const r = deref(response);
          if (isObject(r) && (typeof r.description !== 'string' || !r.description.trim()))
            err(`${at}/responses/${pointerSegment(status)}`, `${label}: response ${status} needs a description.`);
        }
    }
  }

  for (const name of Object.keys(asObject(asObject(doc.components).schemas)))
    if (!COMPONENT_NAME.test(name)) err(`#/components/schemas/${pointerSegment(name)}`, `Schema name "${name}" may only use letters, digits, ".", "-" and "_".`);

  for (const { ref, at } of collectRefs(doc)) {
    if (!isLocalRef(ref)) warn(at, `External $ref "${ref}" is kept but never fetched.`);
    else if (resolveRef(doc, ref) === undefined) err(at, `$ref "${ref}" doesn’t resolve.`);
  }
  return issues;
}

// ---------- unsupported constructs ----------

const TOP_LEVEL = new Set(['openapi', 'info', 'servers', 'tags', 'paths', 'components']);
const PATH_ITEM = new Set([...HTTP_METHODS, 'parameters', 'summary', 'description']);
const OPERATION = new Set(['tags', 'summary', 'description', 'operationId', 'parameters', 'requestBody', 'responses', 'deprecated']);

/**
 * Constructs the forms can't edit. They are kept in the document and its output exactly as
 * imported; this list tells the user which ones exist. `x-` extensions are only counted.
 */
export function findUnsupported(doc: JsonObject): string[] {
  const out: string[] = [];
  let extensions = 0;
  for (const key of Object.keys(doc)) {
    if (key.startsWith('x-')) extensions++;
    else if (!TOP_LEVEL.has(key)) out.push(`Top-level "${key}"`);
  }
  for (const key of Object.keys(asObject(doc.components))) if (key !== 'schemas') out.push(`components.${key}`);
  for (const [path, item] of Object.entries(asObject(doc.paths))) {
    for (const [key, operation] of Object.entries(asObject(item))) {
      if (key.startsWith('x-')) extensions++;
      else if (!PATH_ITEM.has(key)) out.push(`"${key}" on path ${path}`);
      if (!isMethod(key)) continue;
      for (const opKey of Object.keys(asObject(operation))) {
        if (opKey.startsWith('x-')) extensions++;
        else if (!OPERATION.has(opKey)) out.push(`"${opKey}" on ${key.toUpperCase()} ${path}`);
      }
    }
  }
  if (extensions) out.push(`${extensions} x- extension field${extensions === 1 ? '' : 's'}`);
  return out;
}

// ---------- serialization ----------

export const toJsonText = (doc: JsonObject) => JSON.stringify(doc, null, 2);

export async function toYamlText(doc: JsonObject): Promise<string> {
  const result = await jsonToYaml(JSON.stringify(doc), { indent: 2, lineWidth: 0, quote: 'plain' });
  if (!result.ok) throw new Error(result.error.message);
  return result.output;
}

export function newDocument(): JsonObject {
  return { openapi: '3.1.0', info: { title: 'My API', version: '1.0.0' }, paths: {} };
}
