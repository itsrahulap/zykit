// What kind of text an output is, for "Send to…" (see ToolDefinition.accepts / produces).

import { TOOLS } from '../../tools/registry';
import type { DataKind, ToolDefinition } from '../../tools/types';

/** Best guess at what an output is from its MIME type, for "Send to…". */
export function kindFromMime(mime: string): DataKind | undefined {
  const m = mime.toLowerCase();
  if (m.includes('svg')) return undefined;
  if (m.includes('json')) return 'json';
  if (m.includes('csv') || m.includes('tab-separated')) return 'csv';
  if (m.includes('yaml')) return 'yaml';
  if (m.includes('xml')) return 'xml';
  if (m.includes('sql')) return 'sql';
  if (m.includes('markdown')) return 'markdown';
  if (m.includes('typescript') || m.includes('javascript')) return 'code';
  if (m.startsWith('text/plain')) return 'text';
  return undefined;
}

/** Tools that take `kind` as input, in registry order, excluding `exclude`. */
export function sendTargets(kind: DataKind, exclude?: string): ToolDefinition[] {
  return TOOLS.filter((t) => t.status !== 'coming-soon' && t.id !== exclude && t.accepts?.includes(kind));
}
