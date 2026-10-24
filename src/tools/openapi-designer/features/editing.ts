// Form helpers: the schema picker's choices and the immutable document updates behind the forms.

import { asObject, isMethod, isObject, type HttpMethod, type JsonObject } from './openapi';

const PRIMITIVES = ['string', 'integer', 'number', 'boolean', 'object'] as const;

/**
 * What the schema picker shows: a primitive type, a component `$ref` ("ref:Pet"), a list of either
 * ("array:ref:Pet"), "none" (no content), or "custom" for anything richer, which is left untouched.
 */
export type SchemaChoice = string;

export const schemaRef = (name: string) => `#/components/schemas/${name}`;

export function schemaToChoice(schema: unknown): SchemaChoice {
  if (schema === undefined) return 'none';
  if (!isObject(schema)) return 'custom';
  const keys = Object.keys(schema);
  if (keys.length === 1 && typeof schema.$ref === 'string' && schema.$ref.startsWith('#/components/schemas/') && !schema.$ref.slice(21).includes('/'))
    return `ref:${schema.$ref.slice(21)}`;
  if (keys.length === 1 && (PRIMITIVES as readonly unknown[]).includes(schema.type)) return String(schema.type);
  if (keys.length === 2 && schema.type === 'array' && 'items' in schema) {
    const inner = schemaToChoice(schema.items);
    if (inner !== 'none' && inner !== 'custom' && !inner.startsWith('array:')) return `array:${inner}`;
  }
  return 'custom';
}

/** Inverse of schemaToChoice; undefined for "none". "custom" must not be passed (the caller keeps the schema). */
export function choiceToSchema(choice: SchemaChoice): JsonObject | undefined {
  if (choice === 'none') return undefined;
  if (choice.startsWith('array:')) return { type: 'array', items: choiceToSchema(choice.slice(6)) };
  if (choice.startsWith('ref:')) return { $ref: schemaRef(choice.slice(4)) };
  return { type: choice };
}

export function schemaChoices(schemaNames: string[], current: SchemaChoice, allowNone: boolean): { value: SchemaChoice; label: string }[] {
  const options = [
    ...(allowNone ? [{ value: 'none', label: 'No content' }] : []),
    ...PRIMITIVES.map((t) => ({ value: t, label: t })),
    ...schemaNames.map((n) => ({ value: `ref:${n}`, label: `$ref ${n}` })),
    ...PRIMITIVES.filter((t) => t !== 'object').map((t) => ({ value: `array:${t}`, label: `array of ${t}` })),
    ...schemaNames.map((n) => ({ value: `array:ref:${n}`, label: `array of ${n}` })),
  ];
  if (!options.some((o) => o.value === current)) options.unshift({ value: current, label: current === 'custom' ? 'Custom (kept as imported)' : current.replace(/^(array:)?ref:/, '$1$ref ') });
  return options;
}

/** Copy-on-write update: the recipe mutates a deep clone, so React sees a new document. */
export function produce(doc: JsonObject, recipe: (draft: JsonObject) => void): JsonObject {
  const draft = structuredClone(doc);
  recipe(draft);
  return draft;
}

/** The object at `obj[key]`, created when missing or not an object. */
export function child(obj: JsonObject, key: string): JsonObject {
  if (!isObject(obj[key])) obj[key] = {};
  return obj[key] as JsonObject;
}

/** The list at `obj[key]`, created when missing or not a list. */
export function list(obj: JsonObject, key: string): unknown[] {
  if (!Array.isArray(obj[key])) obj[key] = [];
  return obj[key] as unknown[];
}

/** Removes item `index` of the list at `obj[key]`, dropping the key once the list is empty. */
export function removeAt(obj: JsonObject, key: string, index: number) {
  const items = list(obj, key);
  items.splice(index, 1);
  if (!items.length) delete obj[key];
}

/** Sets `obj[key]`, deleting it for undefined or an empty string so the output stays minimal. */
export function setField(obj: JsonObject, key: string, value: unknown) {
  if (value === undefined || value === '') delete obj[key];
  else obj[key] = value;
}

export interface OperationRef {
  path: string;
  method: HttpMethod;
  operation: JsonObject;
}

export function listOperations(doc: JsonObject): OperationRef[] {
  const out: OperationRef[] = [];
  for (const [path, item] of Object.entries(asObject(doc.paths)))
    for (const [method, operation] of Object.entries(asObject(item))) if (isMethod(method) && isObject(operation)) out.push({ path, method, operation });
  return out;
}

/** Normalises a typed path: leading slash, no trailing slash (except "/"), no whitespace. */
export function normalizePath(raw: string): string {
  const p = raw.trim().replace(/\s+/g, '');
  if (!p) return '';
  const withSlash = p.startsWith('/') ? p : `/${p}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash;
}
