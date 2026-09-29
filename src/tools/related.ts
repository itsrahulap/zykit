// Hand-picked "Related tools" shown under every tool page. Tools missing from this map (e.g. newly
// added ones) fall back to others in the same category, so every page still gets suggestions.

import { TOOLS } from './registry';
import type { ToolDefinition } from './types';

export const RELATED_TOOLS: Record<string, string[]> = {
  'case-converter': ['slug-generator', 'text-cleaner', 'find-replace', 'word-counter'],
  'certificate-inspector': ['encode-decode', 'hash-generator', 'jwt-decoder', 'http-headers'],
  'clean-image': ['mime-lookup', 'hash-generator', 'meta-tag-inspector'],
  'cron-builder': ['timestamp-converter', 'regex-tester', 'uuid-generator'],
  'csv-json': ['csv-viewer', 'json-formatter', 'json-to-sql', 'yaml-json'],
  'csv-viewer': ['csv-json', 'json-to-sql', 'find-replace'],
  'curl-converter': ['http-headers', 'http-status', 'url-parser', 'json-formatter'],
  'diff-checker': ['json-diff', 'text-cleaner', 'find-replace', 'word-counter'],
  'encode-decode': ['hash-generator', 'jwt-decoder', 'url-parser', 'url-cleaner'],
  'find-replace': ['regex-tester', 'text-cleaner', 'case-converter', 'diff-checker'],
  'hash-generator': ['encode-decode', 'random-string', 'password-generator', 'uuid-generator'],
  'http-headers': ['http-status', 'curl-converter', 'mime-lookup', 'user-agent-parser'],
  'http-status': ['http-headers', 'curl-converter', 'mime-lookup'],
  'js-runner': ['json-formatter', 'regex-tester', 'json-to-typescript', 'diff-checker'],
  'json-diff': ['json-formatter', 'diff-checker', 'json-to-typescript'],
  'json-formatter': ['json-diff', 'json-to-typescript', 'yaml-json', 'csv-json'],
  'json-to-sql': ['sql-formatter', 'csv-json', 'json-formatter', 'uuid-generator'],
  'json-to-typescript': ['json-formatter', 'json-diff', 'js-runner'],
  'jwt-decoder': ['jwt-generator', 'encode-decode', 'timestamp-converter', 'hash-generator'],
  'jwt-generator': ['jwt-decoder', 'random-string', 'hash-generator', 'timestamp-converter'],
  'markdown-editor': ['word-counter', 'text-cleaner', 'slug-generator', 'meta-tag-inspector'],
  'meta-tag-inspector': ['sitemap-generator', 'robots-txt-generator', 'utm-builder', 'url-cleaner'],
  'mime-lookup': ['http-headers', 'http-status', 'clean-image'],
  'password-generator': ['random-string', 'hash-generator', 'uuid-generator'],
  'random-string': ['password-generator', 'uuid-generator', 'hash-generator'],
  'regex-tester': ['find-replace', 'text-cleaner', 'js-runner', 'cron-builder'],
  'robots-txt-generator': ['sitemap-generator', 'meta-tag-inspector', 'url-parser'],
  'sitemap-generator': ['robots-txt-generator', 'meta-tag-inspector', 'url-cleaner'],
  'slug-generator': ['case-converter', 'url-parser', 'text-cleaner'],
  'sql-formatter': ['json-to-sql', 'json-formatter', 'diff-checker'],
  'text-cleaner': ['find-replace', 'case-converter', 'word-counter', 'diff-checker'],
  'timestamp-converter': ['cron-builder', 'jwt-decoder', 'uuid-generator'],
  'url-cleaner': ['url-parser', 'utm-builder', 'encode-decode'],
  'url-parser': ['url-cleaner', 'encode-decode', 'utm-builder', 'curl-converter'],
  'user-agent-parser': ['http-headers', 'meta-tag-inspector', 'url-parser'],
  'utm-builder': ['url-cleaner', 'url-parser', 'meta-tag-inspector'],
  'uuid-generator': ['random-string', 'hash-generator', 'timestamp-converter', 'password-generator'],
  'word-counter': ['text-cleaner', 'case-converter', 'markdown-editor'],
  'xml-json': ['json-formatter', 'yaml-json', 'csv-json'],
  'yaml-json': ['json-formatter', 'xml-json', 'csv-json', 'json-diff'],
};

const MAX_RELATED = 5;
const listed = (t: ToolDefinition) => t.status !== 'coming-soon';

/** Curated related tools for `id`, topped up (or replaced) with same-category tools. At most 5, never itself. */
export function relatedTools(id: string, tools: readonly ToolDefinition[] = TOOLS, map: Record<string, string[]> = RELATED_TOOLS): ToolDefinition[] {
  const self = tools.find((t) => t.id === id);
  const picked = (map[id] ?? []).map((rid) => tools.find((t) => t.id === rid)).filter((t): t is ToolDefinition => !!t && listed(t) && t.id !== id);
  if (picked.length >= 3 || !self) return picked.slice(0, MAX_RELATED);
  const extra = tools.filter((t) => t.category === self.category && t.id !== id && listed(t) && !picked.includes(t));
  return [...picked, ...extra].slice(0, 4);
}
