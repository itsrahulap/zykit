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
  // Object children (type === 'object')
  properties: PropertyNode[];
  additionalProperties: boolean; // false = disallowed
  // Array items (type === 'array')
  items: PropertyNode | null;
  minItems: string;
  maxItems: string;
  uniqueItems: boolean;
  // Keywords the builder doesn't understand (preserved verbatim).
  unsupportedKeys: string[];
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
    properties: [],
    additionalProperties: true,
    items: null,
    minItems: '',
    maxItems: '',
    uniqueItems: false,
    unsupportedKeys: [],
  };
}

// ---------------------------------------------------------------------------
// JSON Schema → builder model

const SUPPORTED_KEYWORDS = new Set([
  '$schema', 'type', 'description', 'required', 'properties', 'additionalProperties',
  'items', 'minItems', 'maxItems', 'uniqueItems',
  'minLength', 'maxLength', 'pattern', 'format',
  'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
  'enum', 'const',
  'nullable', // OpenAPI-style; preserved when present
]);

type RawObj = Record<string, unknown>;
const isObj = (v: unknown): v is RawObj => typeof v === 'object' && v !== null && !Array.isArray(v);

function readType(schema: RawObj): { type: JsonType; nullable: boolean } {
  let raw = schema.type;
  let nullable = false;

  // Draft 2020-12 nullable is expressed as a type array including 'null',
  // or (OpenAPI 3.0) as the nullable:true keyword.
  if (schema.nullable === true) nullable = true;

  if (Array.isArray(raw)) {
    const filtered = raw.filter((t) => t !== 'null');
    nullable = nullable || raw.includes('null');
    raw = filtered.length === 1 ? filtered[0] : filtered[0] ?? 'string';
  }

  const TYPE_SET: JsonType[] = ['string', 'number', 'integer', 'boolean', 'null', 'object', 'array'];
  const type: JsonType = TYPE_SET.includes(raw as JsonType) ? (raw as JsonType) : 'string';
  return { type, nullable };
}

function fromRaw(schema: RawObj, name: string, requiredSet: Set<string>): PropertyNode {
  const node = emptyNode(name);
  const { type, nullable } = readType(schema);
  node.type = type;
  node.nullable = nullable;
  node.required = requiredSet.has(name);

  if (typeof schema.description === 'string') node.description = schema.description;

  // String constraints
  if (typeof schema.minLength === 'number') node.minLength = String(schema.minLength);
  if (typeof schema.maxLength === 'number') node.maxLength = String(schema.maxLength);
  if (typeof schema.pattern === 'string') node.pattern = schema.pattern;
  if (typeof schema.format === 'string') node.format = schema.format;

  // Number constraints
  if (typeof schema.minimum === 'number') node.minimum = String(schema.minimum);
  if (typeof schema.maximum === 'number') node.maximum = String(schema.maximum);
  if (typeof schema.exclusiveMinimum === 'number') node.exclusiveMinimum = String(schema.exclusiveMinimum);
  if (typeof schema.exclusiveMaximum === 'number') node.exclusiveMaximum = String(schema.exclusiveMaximum);
  if (typeof schema.multipleOf === 'number') node.multipleOf = String(schema.multipleOf);

  // Enum / const
  if (Array.isArray(schema.enum)) node.enumValues = schema.enum.map((v) => JSON.stringify(v)).join('\n');
  if (schema.const !== undefined) node.constValue = JSON.stringify(schema.const);

  // Object
  if (type === 'object' && isObj(schema.properties)) {
    const childRequired = new Set(Array.isArray(schema.required) ? (schema.required as string[]) : []);
    node.properties = Object.entries(schema.properties).map(([k, v]) =>
      fromRaw(isObj(v) ? v : {}, k, childRequired),
    );
  }
  if (schema.additionalProperties === false) node.additionalProperties = false;

  // Array
  if (type === 'array' && isObj(schema.items)) {
    node.items = fromRaw(schema.items, '', new Set());
  }
  if (typeof schema.minItems === 'number') node.minItems = String(schema.minItems);
  if (typeof schema.maxItems === 'number') node.maxItems = String(schema.maxItems);
  if (schema.uniqueItems === true) node.uniqueItems = true;

  // Track unsupported keys so we can warn the user and preserve them on export.
  node.unsupportedKeys = Object.keys(schema).filter((k) => !SUPPORTED_KEYWORDS.has(k));

  return node;
}

/**
 * Parse a JSON Schema draft 2020-12 document into the builder model.
 * Returns null when the schema has constructs the builder can't represent
 * at the root level (allOf, anyOf, oneOf, $ref, etc.).
 */
export interface LoadResult {
  root: PropertyNode;
  /** Keywords that exist in the raw schema but aren't editable in the builder. */
  unsupportedRootKeys: string[];
}

export function loadSchema(schema: unknown): LoadResult | null {
  if (!isObj(schema)) return null;
  // Bail out on composition keywords at the root — the builder can't represent them.
  const bail = ['allOf', 'anyOf', 'oneOf', '$ref', 'not', 'if', 'then', 'else', '$defs', 'definitions'];
  if (bail.some((k) => k in schema)) return null;

  const root = fromRaw(schema, '', new Set());
  root.required = false; // root has no parent, required flag is meaningless
  const unsupportedRootKeys = Object.keys(schema).filter((k) => !SUPPORTED_KEYWORDS.has(k) && k !== '$schema');
  return { root, unsupportedRootKeys };
}

// ---------------------------------------------------------------------------
// Builder model → JSON Schema

function num(s: string): number | undefined {
  const n = Number(s);
  return s.trim() !== '' && !Number.isNaN(n) ? n : undefined;
}

function toRaw(node: PropertyNode, isRoot = false): RawObj {
  const out: RawObj = {};

  // type (with nullable)
  const typeVal: string[] = [node.type];
  if (node.nullable && node.type !== 'null') typeVal.push('null');
  out.type = typeVal.length === 1 ? typeVal[0] : typeVal;

  if (node.description.trim()) out.description = node.description.trim();

  // String
  const minLen = num(node.minLength);
  if (minLen !== undefined) out.minLength = minLen;
  const maxLen = num(node.maxLength);
  if (maxLen !== undefined) out.maxLength = maxLen;
  if (node.pattern.trim()) out.pattern = node.pattern.trim();
  if (node.format.trim()) out.format = node.format.trim();

  // Number
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

  // Enum / const
  if (node.enumValues.trim()) {
    const lines = node.enumValues.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed = lines.flatMap((l) => {
      try { return [JSON.parse(l)]; } catch { return []; }
    });
    if (parsed.length > 0) out.enum = parsed;
  }
  if (node.constValue.trim()) {
    try { out.const = JSON.parse(node.constValue); } catch { /* leave unset */ }
  }

  // Object
  if (node.type === 'object') {
    const properties: RawObj = {};
    const required: string[] = [];
    for (const child of node.properties) {
      properties[child.name] = toRaw(child);
      if (child.required) required.push(child.name);
    }
    if (Object.keys(properties).length > 0) out.properties = properties;
    if (required.length > 0) out.required = required;
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

  // Preserve root-level $schema on export.
  if (isRoot) {
    return { $schema: 'https://json-schema.org/draft/2020-12/schema', ...out };
  }

  return out;
}

/** Serialize the builder model to a draft 2020-12 JSON Schema object. */
export function exportSchema(root: PropertyNode): RawObj {
  return toRaw(root, true);
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
