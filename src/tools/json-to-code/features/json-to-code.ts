// Turns a parsed JSON sample into Go, Python, Rust, Java, C# or Kotlin type definitions.
// Pure logic: the shape inference lives in json-to-typescript and is reused here.

import type { JsonNode } from '../../json-formatter/features/json';
import { fileNameFor, renderCode, type CodeOptions } from './langs';
import { buildModel } from './model';

export { LANGS, type CodeOptions, type Lang, type Naming } from './langs';

export const DEFAULT_OPTIONS: CodeOptions = {
  lang: 'go',
  rootName: 'Root',
  naming: 'idiomatic',
  pyStyle: 'dataclass',
  javaStyle: 'record',
  csStyle: 'record',
};

export interface CodeResult {
  code: string;
  fileName: string;
  /** Named types emitted. */
  declarations: number;
}

export function generateCode(root: JsonNode, options: CodeOptions): CodeResult {
  const model = buildModel(root, options.rootName);
  return { code: renderCode(model, options), fileName: fileNameFor(model, options.lang), declarations: model.structs.length };
}
