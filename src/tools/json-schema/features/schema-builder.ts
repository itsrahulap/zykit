// Visual JSON Schema builder: an editable in-memory tree that maps to / from a
// JSON Schema draft 2020-12 document. Only a practical subset of the spec is
// covered — unsupported keywords are preserved as-is and shown as "edit as JSON
// only", so nothing is silently lost on a round-trip.
//
// Constraints:
//   - No eval / new Function.
//   - Pure TypeScript, unit-testable in Node without a DOM.

export type JsonType = 'string' | 'number' | 'integer' | 'boolean' | 'null' | 'object' | 'array';

/** All keywords the Builder understands and can edit. */
export interface PropertyNode {
  /** Stable id used as React key; never persisted to JSON. */
  id: string;
  name: string;
  /** Null when this node is the root (it has no property name). */
  required: boolean;
  description: string;
  type: JsonType;
  /** Whether nullable (type list includes "null"). */
  nullable: boolean;
  // String constraints
  minLength: string; // '' = unset
  maxLength: string;
  pattern: string;
  format: string;
  // Number / integer constraints
  minimum: string;
  maximum: string;
  exclusiveMinimum: string;
  exclusiveMaximum: string;
  multipleOf: string;
  // Enum / const
  enumValues: string; // newline-separated JSON values, '' = unset
  constValue: string; // JSON value, '' = unset
  defaultValue: string; // JSON value, '' = unset
  // Object children (type === 'object')
  properties: PropertyNode[];
  additionalProperties: boolean; // false = disallowed
  // Array items (type === 'array')
  items: PropertyNode | null;
  minItems: string;
  maxItems: string;
  uniqueItems: boolean;
  /** Keywords the builder doesn't edit, with their raw values, written back verbatim on export. */
  extra: Record<string, unknown>;
  /**
   * The raw subschema when the builder can't represent it (no single type, $ref,
   * anyOf, a schema-valued additionalProperties…): exported as-is, edit as JSON only.
   */
  opaqueSchema?: unknown;
}

let _counter = 0;
export function newId(): string {
  return `n${++_counter}`;
}

export function emptyNode(name = '', type: JsonType = 'string'): PropertyNode {
  return {
    id: newId(),
    name,
    required: false,
    description: '',
    type,
    nullable: false,
    minLength: '',
    maxLength: '',
    pattern: '',
    format: '',
    minimum: '',
    maximum: '',
    exclusiveMinimum: '',
    exclusiveMaximum: '',
    multipleOf: '',
    enumValues: '',
    constValue: '',
    defaultValue: '',
    properties: [],
    additionalProperties: true,
    items: null,
    minItems: '',
    maxItems: '',
    uniqueItems: false,
    extra: {},
  };
}

// ---------------------------------------------------------------------------
// JSON Schema → builder model

const JSON_TYPES: JsonType[] = ['string', 'number', 'integer', 'boolean', 'null', 'object', 'array'];

/** Keywords that make a subschema mean more than "one type plus constraints", so it's kept verbatim. */
const COMPOSITION_KEYWORDS = ['allOf', 'anyOf', 'oneOf', 'not', 'if', 'then', 'else', '$ref', '$dynamicRef'];

const COMMON_KEYWORDS = ['type', 'nullable', 'description', 'enum', 'const', 'default'];
const NUMBER_KEYWORDS = ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf'];
/** Keywords the builder edits, per type. Anything else stays in `extra`. */
const TYPE_KEYWORDS: Record<JsonType, string[]> = {
  string: ['minLength', 'maxLength', 'pattern', 'format'],
  number: NUMBER_KEYWORDS,
  integer: NUMBER_KEYWORDS,
  object: ['properties', 'required', 'additionalProperties'],
  array: ['items', 'minItems', 'maxItems', 'uniqueItems'],
  boolean: [],
  null: [],
};

type NumericField = 'minLength' | 'maxLength' | 'minimum' | 'maximum' | 'exclusiveMinimum' | 'exclusiveMaximum' | 'multipleOf' | 'minItems' | 'maxItems';
const NUMERIC_FIELDS: string[] = [...TYPE_KEYWORDS.string.slice(0, 2), ...NUMBER_KEYWORDS, 'minItems', 'maxItems'];

type RawObj = Record<string, unknown>;
const isObj = (v: unknown): v is RawObj => typeof v === 'object' && v !== null && !Array.isArray(v);

/** One editable type (plus optional null), or null when the schema has no type or several. */
function readType(schema: RawObj): { type: JsonType; nullable: boolean } | null {
  const types: unknown[] = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (types.length === 0 || !types.every((t) => JSON_TYPES.includes(t as JsonType))) return null;
  const nonNull = types.filter((t) => t !== 'null') as JsonType[];
  if (nonNull.length > 1) return null;
  // OpenAPI 3.0 `nullable: true` is read as a type list including 'null'.
  return { type: nonNull[0] ?? 'null', nullable: nonNull.length === 1 && (types.includes('null') || schema.nullable === true) };
}

/** Copies one editable keyword into the node; false when its value has an unexpected shape. */
function readKeyword(node: PropertyNode, key: string, value: unknown, schema: RawObj): boolean {
  switch (key) {
    case 'type':
      return true;
    case 'nullable':
      return typeof value === 'boolean';
    case 'description':
    case 'pattern':
    case 'format':
      if (typeof value !== 'string') return false;
      node[key] = value;
      return true;
    case 'enum':
      if (!Array.isArray(value)) return false;
      node.enumValues = value.map((v) => JSON.stringify(v)).join('\n');
      return true;
    case 'const':
      node.constValue = JSON.stringify(value);
      return true;
    case 'default':
      node.defaultValue = JSON.stringify(value);
      return true;
    case 'uniqueItems':
    case 'additionalProperties':
      if (typeof value !== 'boolean') return false;
      node[key] = value;
      return true;
    case 'items':
      node.items = fromRaw(value, '', false);
      return true;
    case 'properties': {
      if (!isObj(value)) return false;
      const required = Array.isArray(schema.required) ? schema.required : [];
      node.properties = Object.entries(value).map(([name, child]) => fromRaw(child, name, required.includes(name)));
      return true;
    }
    case 'required': {
      if (!Array.isArray(value) || !value.every((n) => typeof n === 'string')) return false;
      // Names without a matching property can't be toggled in the UI; keep them so they aren't dropped.
      const undefinedNames = value.filter((n) => !(isObj(schema.properties) && Object.hasOwn(schema.properties, n)));
      if (undefinedNames.length > 0) node.extra.required = undefinedNames;
      return true;
    }
    default:
      if (!NUMERIC_FIELDS.includes(key) || typeof value !== 'number') return false;
      node[key as NumericField] = String(value);
      return true;
  }
}

function fromRaw(schema: unknown, name: string, required: boolean): PropertyNode {
  const node = emptyNode(name);
  node.required = required;
  const typeInfo = isObj(schema) ? readType(schema) : null;
  if (
    !isObj(schema) ||
    !typeInfo ||
    COMPOSITION_KEYWORDS.some((k) => k in schema) ||
    ('additionalProperties' in schema && typeof schema.additionalProperties !== 'boolean')
  ) {
    node.opaqueSchema = schema;
    return node;
  }
  node.type = typeInfo.type;
  node.nullable = typeInfo.nullable;
  const editable = new Set([...COMMON_KEYWORDS, ...TYPE_KEYWORDS[node.type]]);
  for (const [key, value] of Object.entries(schema)) {
    if (!editable.has(key) || !readKeyword(node, key, value, schema)) node.extra[key] = value;
  }
  return node;
}

/**
 * Parse a JSON Schema draft 2020-12 document into the builder model.
 * Returns null when the root itself can't be edited (composition keywords,
 * $ref, no type or several types); nested ones are kept as opaque nodes.
 */
export interface LoadResult {
  root: PropertyNode;
  /** Keywords that exist in the raw schema but aren't editable in the builder. */
  unsupportedRootKeys: string[];
}

export function loadSchema(schema: unknown): LoadResult | null {
  const root = fromRaw(schema, '', false);
  if (root.opaqueSchema !== undefined) return null;
  delete root.extra.$schema; // re-added as draft 2020-12 on export
  return { root, unsupportedRootKeys: Object.keys(root.extra) };
}

// ---------------------------------------------------------------------------
// Validation of user-typed values

/** Parses a JSON value typed into a field: null when blank, else the value or an actionable error. */
function readJsonValue(text: string): { value: unknown } | { error: string } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return { value: JSON.parse(trimmed) };
  } catch (e) {
    if (!(e instanceof SyntaxError)) throw e;
    return { error: `${trimmed} isn't a JSON value. Put strings in double quotes, e.g. "red".` };
  }
}

export type FieldErrors = Partial<Record<'enumValues' | 'constValue' | 'defaultValue', string>>;

/** Errors for the JSON-valued fields; a field with an error is left out of the generated schema. */
export function fieldErrors(node: PropertyNode): FieldErrors {
  const errors: FieldErrors = {};
  for (const line of node.enumValues.split('\n')) {
    const parsed = readJsonValue(line);
    if (parsed && 'error' in parsed) {
      errors.enumValues = parsed.error;
      break;
    }
  }
  for (const field of ['constValue', 'defaultValue'] as const) {
    const parsed = readJsonValue(node[field]);
    if (parsed && 'error' in parsed) errors[field] = parsed.error;
  }
  return errors;
}

/** Errors keyed by node id for empty or repeated property names; those properties aren't exported. */
export function nameErrors(properties: PropertyNode[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const seen = new Set<string>();
  for (const p of properties) {
    if (!p.name) errors[p.id] = 'Give this property a name to include it in the schema.';
    else if (seen.has(p.name)) errors[p.id] = `Another property is already named "${p.name}"; only the first one is in the schema.`;
    seen.add(p.name);
  }
  return errors;
}

/** Every problem in the tree, prefixed with the property path, for a summary next to the output. */
export function collectProblems(node: PropertyNode, path = '(root)'): string[] {
  if (node.opaqueSchema !== undefined) return [];
  const problems = Object.values(fieldErrors(node)).map((m) => `${path}: ${m}`);
  if (node.type === 'object') {
    const names = nameErrors(node.properties);
    for (const child of node.properties) {
      if (names[child.id]) problems.push(`${path}: ${names[child.id]}`);
      else problems.push(...collectProblems(child, path === '(root)' ? child.name : `${path}.${child.name}`));
    }
  }
  if (node.type === 'array' && node.items) problems.push(...collectProblems(node.items, `${path}[]`));
  return problems;
}

// ---------------------------------------------------------------------------
// Builder model → JSON Schema

function num(s: string): number | undefined {
  const n = Number(s);
  return s.trim() !== '' && !Number.isNaN(n) ? n : undefined;
}

function toRaw(node: PropertyNode): unknown {
  if (node.opaqueSchema !== undefined) return node.opaqueSchema;
  // Unsupported keywords first, so a value edited in the builder wins over a stale raw one.
  const out: RawObj = { ...node.extra };

  // type (with nullable)
  out.type = node.nullable && node.type !== 'null' ? [node.type, 'null'] : node.type;

  if (node.description.trim()) out.description = node.description.trim();

  // Only constraints for the current type, so ones left over from a previous type aren't exported.
  if (node.type === 'string') {
    const minLen = num(node.minLength);
    if (minLen !== undefined) out.minLength = minLen;
    const maxLen = num(node.maxLength);
    if (maxLen !== undefined) out.maxLength = maxLen;
    if (node.pattern.trim()) out.pattern = node.pattern.trim();
    if (node.format.trim()) out.format = node.format.trim();
  }

  if (node.type === 'number' || node.type === 'integer') {
    const minimum = num(node.minimum);
    if (minimum !== undefined) out.minimum = minimum;
    const maximum = num(node.maximum);
    if (maximum !== undefined) out.maximum = maximum;
    const exMin = num(node.exclusiveMinimum);
    if (exMin !== undefined) out.exclusiveMinimum = exMin;
    const exMax = num(node.exclusiveMaximum);
    if (exMax !== undefined) out.exclusiveMaximum = exMax;
    const multipleOf = num(node.multipleOf);
    if (multipleOf !== undefined) out.multipleOf = multipleOf;
  }

  // Enum / const / default: invalid values are reported by fieldErrors and left out.
  const enumValues = node.enumValues.split('\n').flatMap((line) => {
    const parsed = readJsonValue(line);
    return parsed && 'value' in parsed ? [parsed.value] : [];
  });
  if (enumValues.length > 0) out.enum = enumValues;
  const constValue = readJsonValue(node.constValue);
  if (constValue && 'value' in constValue) out.const = constValue.value;
  const defaultValue = readJsonValue(node.defaultValue);
  if (defaultValue && 'value' in defaultValue) out.default = defaultValue.value;

  // Object
  if (node.type === 'object') {
    const properties: RawObj = {};
    const required = new Set<string>();
    const skipped = nameErrors(node.properties);
    for (const child of node.properties) {
      if (skipped[child.id]) continue;
      properties[child.name] = toRaw(child);
      if (child.required) required.add(child.name);
    }
    if (Array.isArray(node.extra.required)) for (const name of node.extra.required) required.add(name);
    if (Object.keys(properties).length > 0) out.properties = properties;
    if (required.size > 0) out.required = [...required];
    if (!node.additionalProperties) out.additionalProperties = false;
  }

  // Array
  if (node.type === 'array') {
    if (node.items) out.items = toRaw(node.items);
    const minIt = num(node.minItems);
    if (minIt !== undefined) out.minItems = minIt;
    const maxIt = num(node.maxItems);
    if (maxIt !== undefined) out.maxItems = maxIt;
    if (node.uniqueItems) out.uniqueItems = true;
  }

  return out;
}

/** Serialize the builder model to a draft 2020-12 JSON Schema object. */
export function exportSchema(root: PropertyNode): RawObj {
  return { $schema: 'https://json-schema.org/draft/2020-12/schema', ...(toRaw(root) as RawObj) };
}

// ---------------------------------------------------------------------------
// Tree mutation helpers (all return new arrays / nodes — no mutation in place).

export function addProperty(properties: PropertyNode[]): PropertyNode[] {
  return [...properties, emptyNode('')];
}

export function removeProperty(properties: PropertyNode[], id: string): PropertyNode[] {
  return properties.filter((p) => p.id !== id);
}

export function updateProperty(properties: PropertyNode[], id: string, patch: Partial<PropertyNode>): PropertyNode[] {
  return properties.map((p) => (p.id === id ? { ...p, ...patch } : p));
}

export function moveProperty(properties: PropertyNode[], id: string, direction: 'up' | 'down'): PropertyNode[] {
  const idx = properties.findIndex((p) => p.id === id);
  if (idx === -1) return properties;
  const next = direction === 'up' ? idx - 1 : idx + 1;
  if (next < 0 || next >= properties.length) return properties;
  const copy = [...properties];
  [copy[idx], copy[next]] = [copy[next], copy[idx]];
  return copy;
}
