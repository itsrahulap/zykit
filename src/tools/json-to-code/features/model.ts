// Language-neutral model of a JSON sample: named structs with typed fields. Built from the shape
// inference json-to-typescript already does (imported, not copied); each language renders from it.

import type { JsonNode } from '../../json-formatter/features/json';
import { inferShape, pascalCase, singularize, type Field, type Shape } from '../../json-to-typescript/features/typegen';

export type TypeRef =
  | { k: 'string' | 'int' | 'float' | 'bool' | 'any' }
  | { k: 'array'; item: TypeRef }
  | { k: 'struct'; name: string };

export interface FieldModel {
  /** The JSON key. */
  key: string;
  type: TypeRef;
  /** Missing from some objects at this position. */
  optional: boolean;
  /** `null` was seen as a value. */
  nullable: boolean;
}

export interface StructModel {
  name: string;
  fields: FieldModel[];
}

export interface Model {
  /** The root value's type (a struct for objects; an array or scalar otherwise). */
  root: TypeRef;
  /** Root name used for the top-level declaration or alias. */
  rootName: string;
  /** Children before parents; the root struct (if any) is last. */
  structs: StructModel[];
}

const refKey = (t: TypeRef): string => (t.k === 'array' ? `[${refKey(t.item)}]` : t.k === 'struct' ? `#${t.name}` : t.k);

/** Names that would collide with common standard-library types in the target languages. */
const RESERVED = new Set(['String', 'Object', 'Object', 'List', 'Map', 'Any', 'Int', 'Long', 'Double', 'Boolean', 'Date', 'Error', 'Exception', 'Type', 'None', 'Option', 'Vec', 'Result', 'Box']);

export function buildModel(root: JsonNode, rootNameInput: string): Model {
  const shape = inferShape(root);
  const rootName = pascalCase(rootNameInput.trim() || 'Root');
  const used = new Set<string>([rootName]);
  const bySignature = new Map<string, string>();
  const structs: StructModel[] = [];

  const unique = (hint: string) => {
    let base = pascalCase(hint);
    if (RESERVED.has(base)) base = `${base}Model`;
    let name = base;
    for (let n = 2; used.has(name); n++) name = `${base}${n}`;
    used.add(name);
    return name;
  };

  const struct = (obj: Map<string, Field>, hint: string, forced?: string): string => {
    const fields: FieldModel[] = [...obj].map(([key, f]) => {
      const { type, nullable } = typeOf(f.shape, key);
      return { key, type, optional: f.optional, nullable };
    });
    const sig = [...fields]
      .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
      .map((f) => `${f.key}:${refKey(f.type)}:${f.optional ? '?' : ''}${f.nullable ? 'n' : ''}`)
      .join('|');
    if (!forced) {
      const existing = bySignature.get(sig);
      if (existing) return existing;
    }
    const name = forced ?? unique(hint);
    bySignature.set(sig, name);
    structs.push({ name, fields });
    return name;
  };

  function typeOf(s: Shape, hint: string): { type: TypeRef; nullable: boolean } {
    const nullable = s.prims.has('null');
    const scalars = [...s.prims].filter((p) => p !== 'null');
    const kinds = scalars.length + (s.obj ? 1 : 0) + (s.arr ? 1 : 0);
    if (s.unknown || kinds !== 1) return { type: { k: 'any' }, nullable };
    if (s.obj) return { type: { k: 'struct', name: struct(s.obj, hint) }, nullable };
    if (s.arr) {
      const item = s.arr.item ? typeOf(s.arr.item, singularize(hint) === hint ? `${hint}Item` : singularize(hint)) : null;
      // Arrays of nullable items lose the nullability: each language renders the item type as-is.
      return { type: { k: 'array', item: item?.type ?? { k: 'any' } }, nullable };
    }
    const p = scalars[0];
    return { type: { k: p === 'number' ? (s.float ? 'float' : 'int') : p === 'boolean' ? 'bool' : 'string' }, nullable };
  }

  let rootType: TypeRef;
  if (shape.obj && !shape.arr && shape.prims.size === 0 && !shape.unknown) rootType = { k: 'struct', name: struct(shape.obj, rootName, rootName) };
  else rootType = typeOf(shape, rootName).type;
  return { root: rootType, rootName, structs };
}
