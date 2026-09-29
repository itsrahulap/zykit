// YAML ↔ JSON using the `yaml` package, loaded on first use so it ships as its own chunk.

import { parseJsonText, textError, type TextError } from '../../../shared/lib/textpos';

export type JsonIndent = 2 | 4 | 'tab' | 'min';
export type QuoteStyle = 'plain' | 'single' | 'double';

export interface YamlToJsonOptions {
  indent: JsonIndent;
  /** Several `---` documents become one JSON array; otherwise only the first is converted. */
  allDocuments: boolean;
}

export interface JsonToYamlOptions {
  indent: 2 | 4;
  /** 0 disables folding of long strings. */
  lineWidth: number;
  quote: QuoteStyle;
}

export type ConvertResult =
  | { ok: true; output: string; warnings: string[]; documents: number; aliases: number }
  | { ok: false; error: TextError };

/** Aliases may expand to at most this many nodes (yaml's guard against "billion laughs"). */
export const MAX_ALIAS_COUNT = 100;

const CORE_TAGS = new Set(['str', 'int', 'float', 'bool', 'null', 'map', 'seq'].map((t) => `tag:yaml.org,2002:${t}`));

let yamlModule: Promise<typeof import('yaml')> | null = null;
const loadYaml = () => (yamlModule ??= import('yaml'));

function jsonText(value: unknown, indent: JsonIndent): string {
  const space = indent === 'min' ? undefined : indent === 'tab' ? '\t' : indent;
  return JSON.stringify(value, null, space) ?? 'null';
}

function describeKey(v: unknown): string {
  if (v === null) return 'null';
  if (typeof v === 'string') return JSON.stringify(v);
  return String(v);
}

export async function yamlToJson(text: string, options: YamlToJsonOptions): Promise<ConvertResult> {
  const YAML = await loadYaml();
  const docs = YAML.parseAllDocuments(text, { prettyErrors: false, merge: true, uniqueKeys: true, logLevel: 'error' });
  const list = Array.isArray(docs) ? docs : [];
  for (const doc of list) {
    const err = doc.errors[0];
    if (err) return { ok: false, error: textError(text, err.pos[0], err.message) };
  }
  if (!Array.isArray(docs) && docs.errors[0]) return { ok: false, error: textError(text, docs.errors[0].pos[0], docs.errors[0].message) };

  const warnings = new Set<string>();
  const nonStringKeys: string[] = [];
  const customTags = new Set<string>();
  let complexKeys = 0;
  let nonFinite = 0;
  let aliases = 0;

  for (const doc of list) {
    for (const w of doc.warnings) if (w.code !== 'TAG_RESOLVE_FAILED') warnings.add(w.message);
    YAML.visit(doc, {
      Pair(_, pair) {
        const key = pair.key;
        if (key === null) nonStringKeys.push('(empty key)');
        else if (YAML.isScalar(key)) {
          if (typeof key.value !== 'string') nonStringKeys.push(describeKey(key.value));
        } else if (YAML.isCollection(key)) complexKeys++;
      },
      Alias() {
        aliases++;
      },
      Node(_, node) {
        if (node.tag && !CORE_TAGS.has(node.tag)) customTags.add(node.tag);
        if (YAML.isScalar(node) && typeof node.value === 'number' && !Number.isFinite(node.value)) nonFinite++;
      },
    });
  }

  let values: unknown[];
  try {
    values = list.map((doc) => doc.toJS({ maxAliasCount: MAX_ALIAS_COUNT }) as unknown);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Conversion failed';
    return {
      ok: false,
      error: textError(text, 0, /alias/i.test(msg) ? `Too many alias expansions (${msg}). This looks like a "billion laughs" document.` : msg),
    };
  }

  if (nonStringKeys.length) {
    const sample = [...new Set(nonStringKeys)].slice(0, 5).join(', ');
    warnings.add(`${nonStringKeys.length} non-string key${nonStringKeys.length === 1 ? '' : 's'} became JSON strings (${sample}).`);
  }
  if (complexKeys) warnings.add(`${complexKeys} map or list key${complexKeys === 1 ? ' was' : 's were'} turned into a string; JSON keys can only be strings.`);
  if (customTags.size) warnings.add(`Custom tags have no JSON equivalent and were ignored: ${[...customTags].slice(0, 5).join(', ')}.`);
  if (nonFinite) warnings.add(`${nonFinite} value${nonFinite === 1 ? '' : 's'} like .inf or .nan became null; JSON has no infinity or NaN.`);

  let output: string;
  if (values.length === 0) output = 'null';
  else if (values.length === 1) output = jsonText(values[0], options.indent);
  else if (options.allDocuments) output = jsonText(values, options.indent);
  else {
    warnings.add(`The input has ${values.length} documents; only the first was converted.`);
    output = jsonText(values[0], options.indent);
  }
  return { ok: true, output, warnings: [...warnings], documents: values.length, aliases };
}

export async function jsonToYaml(text: string, options: JsonToYamlOptions): Promise<ConvertResult> {
  const parsed = parseJsonText(text);
  if (!parsed.ok) return parsed;
  const YAML = await loadYaml();
  const type = options.quote === 'single' ? 'QUOTE_SINGLE' : options.quote === 'double' ? 'QUOTE_DOUBLE' : 'PLAIN';
  // Written with YAML 1.1 rules so strings like "yes", "on" or "no" are quoted: 1.1 readers
  // (PyYAML, Ruby, many CI tools) would otherwise read them as booleans.
  const output = YAML.stringify(parsed.value, {
    version: '1.1',
    indent: options.indent,
    lineWidth: options.lineWidth,
    minContentWidth: options.lineWidth === 0 ? 0 : 20,
    defaultStringType: type,
    defaultKeyType: 'PLAIN',
    aliasDuplicateObjects: false,
  });
  return { ok: true, output, warnings: [], documents: 1, aliases: 0 };
}
