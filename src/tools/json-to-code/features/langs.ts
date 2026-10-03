// Renders a Model as source code. One function per language; each returns the full file text.

import type { FieldModel, Model, StructModel, TypeRef } from './model';
import { applyCase, uniqueNames, type Casing } from './naming';

export type Lang = 'go' | 'python' | 'rust' | 'java' | 'csharp' | 'kotlin';
export type Naming = 'idiomatic' | 'original';

export interface CodeOptions {
  lang: Lang;
  rootName: string;
  naming: Naming;
  pyStyle: 'dataclass' | 'pydantic';
  javaStyle: 'record' | 'pojo';
  csStyle: 'record' | 'class';
}

export const LANGS: { id: Lang; label: string; ext: string; fence: string }[] = [
  { id: 'go', label: 'Go', ext: 'go', fence: 'go' },
  { id: 'python', label: 'Python', ext: 'py', fence: 'python' },
  { id: 'rust', label: 'Rust', ext: 'rs', fence: 'rust' },
  { id: 'java', label: 'Java', ext: 'java', fence: 'java' },
  { id: 'csharp', label: 'C#', ext: 'cs', fence: 'csharp' },
  { id: 'kotlin', label: 'Kotlin', ext: 'kt', fence: 'kotlin' },
];

const KEYWORDS: Record<Lang, string[]> = {
  go: [],
  python: ['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield', 'self', 'model_config', 'dict', 'list', 'str', 'int', 'float', 'bool'],
  rust: ['as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while', 'async', 'await', 'dyn', 'abstract', 'become', 'box', 'do', 'final', 'macro', 'override', 'priv', 'typeof', 'unsized', 'virtual', 'yield', 'try'],
  java: ['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false', 'null', 'var', 'record', 'yield', 'hashCode', 'toString', 'equals'],
  csharp: [],
  kotlin: ['as', 'break', 'class', 'continue', 'do', 'else', 'false', 'for', 'fun', 'if', 'in', 'interface', 'is', 'null', 'object', 'package', 'return', 'super', 'this', 'throw', 'true', 'try', 'typealias', 'typeof', 'val', 'var', 'when', 'while'],
};
const RESERVED = Object.fromEntries(Object.entries(KEYWORDS).map(([k, v]) => [k, new Set(v)])) as Record<Lang, Set<string>>;

const q = (s: string) => JSON.stringify(s);
/** Strings for Go struct tags and Python/Rust/Java/C#/Kotlin literals: JSON.stringify output is valid in all of them for ordinary keys. */
const lit = q;

interface Ctx {
  model: Model;
  o: CodeOptions;
}
interface Named {
  f: FieldModel;
  name: string;
}

function fieldNames(s: StructModel, lang: Lang, casing: Casing, o: CodeOptions, goInit = false): Named[] {
  const keys = s.fields.map((f) => f.key);
  const make = (k: string) => applyCase(k, o.naming === 'original' ? 'original' : casing, { goInitialisms: goInit });
  let names = uniqueNames(keys, lang === 'go' || lang === 'csharp' ? (k) => upperFirst(make(k)) : make, RESERVED[lang]);
  if (lang === 'csharp') names = names.map((n) => (n === s.name ? `${n}Value` : n));
  return s.fields.map((f, i) => ({ f, name: names[i] }));
}
const upperFirst = (s: string) => s[0].toUpperCase() + s.slice(1);
const rootFirst = (m: Model) => [...m.structs].reverse();
const join = (blocks: string[]) => blocks.join('\n\n') + '\n';

/* ---------------------------------------------------------------- Go */

function goType(t: TypeRef): string {
  switch (t.k) {
    case 'string': return 'string';
    case 'int': return 'int64';
    case 'float': return 'float64';
    case 'bool': return 'bool';
    case 'any': return 'any';
    case 'array': return `[]${goType(t.item)}`;
    case 'struct': return t.name;
  }
}

function genGo({ model, o }: Ctx): string {
  const out = ['package main'];
  const alias = aliasLine(model, (t) => `type ${model.rootName} ${goType(t)}`);
  if (alias) out.push(alias);
  for (const s of rootFirst(model)) {
    const names = fieldNames(s, 'go', 'pascal', o, true);
    const lines = names.map(({ f, name }) => {
      const pointer = f.nullable && f.type.k !== 'array' && f.type.k !== 'any';
      const type = `${pointer ? '*' : ''}${goType(f.type)}`;
      return { name, type, tag: `\`json:"${f.key.replace(/["\\]/g, '')}${f.optional ? ',omitempty' : ''}"\`` };
    });
    const w = Math.max(0, ...lines.map((l) => l.name.length));
    const wt = Math.max(0, ...lines.map((l) => l.type.length));
    out.push(`type ${s.name} struct {\n${lines.map((l) => `\t${l.name.padEnd(w)} ${l.type.padEnd(wt)} ${l.tag}`).join('\n')}${lines.length ? '\n' : ''}}`);
  }
  return join(out);
}

/** Root arrays and scalars have no struct of their own; languages with aliases emit one. */
function aliasLine(model: Model, make: (t: TypeRef) => string): string | null {
  return model.root.k === 'struct' ? null : make(model.root);
}

/* ---------------------------------------------------------------- Python */

function pyType(t: TypeRef): string {
  switch (t.k) {
    case 'string': return 'str';
    case 'int': return 'int';
    case 'float': return 'float';
    case 'bool': return 'bool';
    case 'any': return 'Any';
    case 'array': return `list[${pyType(t.item)}]`;
    case 'struct': return t.name;
  }
}

function genPython({ model, o }: Ctx): string {
  const pyd = o.pyStyle === 'pydantic';
  const uses = (pred: (f: FieldModel) => boolean) => model.structs.some((s) => s.fields.some(pred));
  const hasAny = (t: TypeRef): boolean => (t.k === 'any' ? true : t.k === 'array' ? hasAny(t.item) : false);
  const header = ['from __future__ import annotations', ''];
  if (!pyd) header.push('from dataclasses import dataclass');
  if (uses((f) => hasAny(f.type)) || hasAny(model.root)) header.push('from typing import Any');
  const needAlias = model.structs.some((s) => fieldNames(s, 'python', 'snake', o).some((n) => n.name !== n.f.key));
  if (pyd) header.push(`from pydantic import BaseModel${needAlias ? ', ConfigDict, Field' : ''}`);
  const out = [header.filter((l, i, a) => !(l === '' && i === a.length - 1)).join('\n')];
  for (const s of model.structs) {
    const names = fieldNames(s, 'python', 'snake', o);
    // Dataclass fields with defaults must come last.
    const sorted = pyd ? names : [...names.filter((n) => !n.f.optional), ...names.filter((n) => n.f.optional)];
    const body = sorted.map(({ f, name }) => {
      let type = pyType(f.type);
      if ((f.nullable || f.optional) && f.type.k !== 'any') type += ' | None';
      const def = f.optional ? ' = None' : '';
      if (pyd && name !== f.key) return `    ${name}: ${type} = Field(${f.optional ? 'default=None, ' : ''}alias=${lit(f.key)})`;
      const hint = !pyd && name !== f.key ? `  # JSON key: ${lit(f.key)}` : '';
      return `    ${name}: ${type}${def}${hint}`;
    });
    const cfg = pyd && sorted.some((n) => n.name !== n.f.key) ? ['    model_config = ConfigDict(populate_by_name=True)', ''] : [];
    const head = pyd ? `class ${s.name}(BaseModel):` : `@dataclass\nclass ${s.name}:`;
    out.push(`${head}\n${[...cfg, ...body].join('\n') || '    pass'}`.replace(/\n\n$/, '\n'));
  }
  const alias = aliasLine(model, (t) => `${model.rootName} = ${pyType(t)}`);
  if (alias) out.push(alias);
  return out.join('\n\n\n') + '\n';
}

/* ---------------------------------------------------------------- Rust */

function rustType(t: TypeRef): string {
  switch (t.k) {
    case 'string': return 'String';
    case 'int': return 'i64';
    case 'float': return 'f64';
    case 'bool': return 'bool';
    case 'any': return 'serde_json::Value';
    case 'array': return `Vec<${rustType(t.item)}>`;
    case 'struct': return t.name;
  }
}

function genRust({ model, o }: Ctx): string {
  const out = ['use serde::{Deserialize, Serialize};'];
  const alias = aliasLine(model, (t) => `pub type ${model.rootName} = ${rustType(t)};`);
  if (alias) out.push(alias);
  for (const s of rootFirst(model)) {
    const names = fieldNames(s, 'rust', 'snake', o);
    const lines = names.flatMap(({ f, name }) => {
      const id = ['self', 'Self', 'super', 'crate'].includes(name.replace(/_$/, '')) ? name : RAW.has(name.replace(/_$/, '')) && name.endsWith('_') ? `r#${name.slice(0, -1)}` : name;
      const plain = id.startsWith('r#') ? id.slice(2) : id;
      const attrs: string[] = [];
      if (plain !== f.key) attrs.push(`rename = ${lit(f.key)}`);
      if (f.optional) attrs.push('default', 'skip_serializing_if = "Option::is_none"');
      const type = f.nullable || f.optional ? `Option<${rustType(f.type)}>` : rustType(f.type);
      return [...(attrs.length ? [`    #[serde(${attrs.join(', ')})]`] : []), `    pub ${id}: ${type},`];
    });
    out.push(`#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct ${s.name} {\n${lines.join('\n')}${lines.length ? '\n' : ''}}`);
  }
  return join(out);
}
/** Keywords that can be written as raw identifiers (r#type). */
const RAW = new Set([...KEYWORDS.rust].filter((k) => !['self', 'Self', 'super', 'crate'].includes(k)));

/* ---------------------------------------------------------------- Java */

function javaType(t: TypeRef, boxed: boolean): string {
  switch (t.k) {
    case 'string': return 'String';
    case 'int': return boxed ? 'Long' : 'long';
    case 'float': return boxed ? 'Double' : 'double';
    case 'bool': return boxed ? 'Boolean' : 'boolean';
    case 'any': return 'Object';
    case 'array': return `List<${javaType(t.item, true)}>`;
    case 'struct': return t.name;
  }
}

function genJava({ model, o }: Ctx): string {
  const record = o.javaStyle === 'record';
  const anyOptional = model.structs.some((s) => s.fields.some((f) => f.optional));
  const usesList = (t: TypeRef): boolean => t.k === 'array';
  const imports = [
    'import com.fasterxml.jackson.annotation.JsonIgnoreProperties;',
    ...(anyOptional ? ['import com.fasterxml.jackson.annotation.JsonInclude;'] : []),
    'import com.fasterxml.jackson.annotation.JsonProperty;',
    ...(model.structs.some((s) => s.fields.some((f) => usesList(f.type))) ? ['import java.util.List;'] : []),
  ];
  const out = [imports.join('\n')];
  const rootStruct = model.root.k === 'struct' ? model.root.name : null;
  if (!rootStruct && model.structs.length === 0) out.push(`// The JSON root is ${model.root.k === 'array' ? 'an array' : 'a scalar'}; use ${javaType(model.root, true)} directly.`);
  else if (!rootStruct) out.push(`// The JSON root is an array: deserialize it as ${javaType(model.root, true)} (for example with a TypeReference).`);
  rootFirst(model).forEach((s, i) => {
    const names = fieldNames(s, 'java', 'camel', o);
    const vis = i === 0 ? 'public ' : '';
    const ann = `@JsonIgnoreProperties(ignoreUnknown = true)${anyOptional ? '\n@JsonInclude(JsonInclude.Include.NON_NULL)' : ''}`;
    const boxed = (f: FieldModel) => f.nullable || f.optional;
    if (record) {
      const comps = names.map(({ f, name }) => `    @JsonProperty(${lit(f.key)}) ${javaType(f.type, boxed(f))} ${name}`);
      out.push(`${ann}\n${vis}record ${s.name}(${comps.length ? `\n${comps.join(',\n')}\n` : ''}) {}`);
    } else {
      const fields = names.map(({ f, name }) => `    @JsonProperty(${lit(f.key)})\n    private ${javaType(f.type, boxed(f))} ${name};`);
      const acc = names.map(({ f, name }) => {
        const t = javaType(f.type, boxed(f));
        const cap = upperFirst(name);
        const get = f.type.k === 'bool' && !boxed(f) ? `is${cap}` : `get${cap}`;
        return `    public ${t} ${get}() {\n        return ${name};\n    }\n\n    public void set${cap}(${t} ${name}) {\n        this.${name} = ${name};\n    }`;
      });
      out.push(`${ann}\n${vis}class ${s.name} {\n${[...fields, ...acc].join('\n\n')}${names.length ? '\n' : ''}}`);
    }
  });
  return join(out);
}

/* ---------------------------------------------------------------- C# */

const CS_REF = new Set(['string', 'array', 'struct', 'any']);
function csType(t: TypeRef): string {
  switch (t.k) {
    case 'string': return 'string';
    case 'int': return 'long';
    case 'float': return 'double';
    case 'bool': return 'bool';
    case 'any': return 'object';
    case 'array': return `List<${csType(t.item)}>`;
    case 'struct': return t.name;
  }
}

function genCSharp({ model, o }: Ctx): string {
  const record = o.csStyle === 'record';
  const usesList = model.structs.some((s) => s.fields.some((f) => f.type.k === 'array'));
  const usings = [...(usesList ? ['using System.Collections.Generic;'] : []), 'using System.Text.Json.Serialization;'];
  const out = [usings.join('\n')];
  const alias = aliasLine(model, (t) => `// The JSON root is ${t.k === 'array' ? 'an array' : 'a scalar'}: deserialize it as ${csType(t)}.`);
  if (alias) out.push(alias);
  for (const s of rootFirst(model)) {
    const names = fieldNames(s, 'csharp', 'pascal', o);
    const props = names.map(({ f, name }) => {
      const nullable = f.nullable || f.optional;
      const type = csType(f.type) + (nullable ? '?' : '');
      const attrs = [`[JsonPropertyName(${lit(f.key)})]`];
      if (f.optional) attrs.push('[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]');
      const init = !nullable && CS_REF.has(f.type.k) ? ' = default!;' : '';
      return `${attrs.map((a) => `    ${a}`).join('\n')}\n    public ${type} ${name} { get; ${record ? 'init' : 'set'}; }${init}`;
    });
    out.push(`public ${record ? 'record' : 'class'} ${s.name}\n{\n${props.join('\n\n')}${props.length ? '\n' : ''}}`);
  }
  return join(out);
}

/* ---------------------------------------------------------------- Kotlin */

function ktType(t: TypeRef): string {
  switch (t.k) {
    case 'string': return 'String';
    case 'int': return 'Long';
    case 'float': return 'Double';
    case 'bool': return 'Boolean';
    case 'any': return 'JsonElement';
    case 'array': return `List<${ktType(t.item)}>`;
    case 'struct': return t.name;
  }
}

function genKotlin({ model, o }: Ctx): string {
  const hasAny = (t: TypeRef): boolean => (t.k === 'any' ? true : t.k === 'array' ? hasAny(t.item) : false);
  const needsRename = (s: StructModel) => fieldNames(s, 'kotlin', 'camel', o).some((n) => n.name !== n.f.key);
  const imports = [
    ...(model.structs.some(needsRename) ? ['import kotlinx.serialization.SerialName'] : []),
    'import kotlinx.serialization.Serializable',
    ...(model.structs.some((s) => s.fields.some((f) => hasAny(f.type))) || hasAny(model.root) ? ['import kotlinx.serialization.json.JsonElement'] : []),
  ];
  const out = [imports.join('\n')];
  const alias = aliasLine(model, (t) => `typealias ${model.rootName} = ${ktType(t)}`);
  if (alias) out.push(alias);
  for (const s of rootFirst(model)) {
    const names = fieldNames(s, 'kotlin', 'camel', o);
    if (!names.length) {
      out.push(`@Serializable\nclass ${s.name}`);
      continue;
    }
    const params = names.map(({ f, name }) => {
      const rename = name !== f.key ? `@SerialName(${lit(f.key)}) ` : '';
      const type = ktType(f.type) + (f.nullable || f.optional ? '?' : '');
      return `    ${rename}val ${name}: ${type}${f.optional ? ' = null' : ''},`;
    });
    out.push(`@Serializable\ndata class ${s.name}(\n${params.join('\n')}\n)`);
  }
  return join(out);
}

/* ---------------------------------------------------------------- entry */

const GENERATORS: Record<Lang, (c: Ctx) => string> = {
  go: genGo,
  python: genPython,
  rust: genRust,
  java: genJava,
  csharp: genCSharp,
  kotlin: genKotlin,
};

export function renderCode(model: Model, o: CodeOptions): string {
  return GENERATORS[o.lang]({ model, o });
}

/** File name for download; Java needs the public type's name. */
export function fileNameFor(model: Model, lang: Lang): string {
  const ext = LANGS.find((l) => l.id === lang)!.ext;
  if (lang === 'java') return `${model.root.k === 'struct' ? model.root.name : (model.structs.at(-1)?.name ?? model.rootName)}.${ext}`;
  const base = { go: 'models', python: 'models', rust: 'models', csharp: 'Models', kotlin: 'Models' }[lang];
  return `${base}.${ext}`;
}
