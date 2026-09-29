import { createSampler, entropyBits, randomFrom, type Sampler } from '../../../shared/lib/random';

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';

export const PRESETS = {
  'hex-lower': { label: 'Hex (lowercase)', chars: '0123456789abcdef' },
  'hex-upper': { label: 'Hex (uppercase)', chars: '0123456789ABCDEF' },
  base64: { label: 'Base64', chars: UPPER + LOWER + DIGITS + '+/' },
  base64url: { label: 'Base64URL', chars: UPPER + LOWER + DIGITS + '-_' },
  alphanumeric: { label: 'Alphanumeric', chars: UPPER + LOWER + DIGITS },
  numeric: { label: 'Numeric', chars: DIGITS },
  letters: { label: 'Letters', chars: UPPER + LOWER },
  custom: { label: 'Custom', chars: '' },
} as const;
export type PresetId = keyof typeof PRESETS;

export const MAX_LENGTH = 4096;
export const MAX_COUNT = 1000;

export type OutputFormat = 'lines' | 'comma' | 'json';

/** Unique code points of `text`, in first-seen order. Whitespace like newlines is dropped; a plain space is kept. */
export function dedupeCharset(text: string): string[] {
  return [...new Set([...text].filter((c) => c === ' ' || !/\s/.test(c)))];
}

export function alphabetFor(preset: PresetId, custom: string): string[] {
  return preset === 'custom' ? dedupeCharset(custom) : [...PRESETS[preset].chars];
}

export interface GenerateOptions {
  alphabet: string[];
  length: number;
  count: number;
  prefix: string;
  suffix: string;
}

export function generateStrings(o: GenerateOptions, sampler: Sampler = createSampler()): string[] {
  const out: string[] = [];
  for (let i = 0; i < o.count; i++) out.push(o.prefix + randomFrom(o.alphabet, o.length, sampler) + o.suffix);
  return out;
}

export function formatOutput(values: string[], format: OutputFormat): string {
  if (format === 'json') return JSON.stringify(values, null, 2);
  return values.join(format === 'comma' ? ',' : '\n');
}

/** Entropy per string (prefix and suffix are fixed, so they add nothing). */
export function stringBits(alphabetSize: number, length: number): number {
  return entropyBits(alphabetSize, length);
}

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}
