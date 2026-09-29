import {
  CATEGORY_ORDER,
  type ImageMetadataReport,
  type MetadataCategory,
  type MetadataEntry,
} from '../metadata/metadata.types';

export interface MetadataDiff {
  removed: MetadataEntry[];
  retained: MetadataEntry[];
  added: MetadataEntry[];
}

const entryId = (e: MetadataEntry) => `${e.category}\u0000${e.key}\u0000${e.value}`;

/** removed = original − cleaned, retained = original ∩ cleaned, added = cleaned − original */
export function diffMetadata(original: MetadataEntry[], cleaned: MetadataEntry[]): MetadataDiff {
  const cleanedIds = new Set(cleaned.map(entryId));
  const originalIds = new Set(original.map(entryId));
  return {
    removed: original.filter((e) => !cleanedIds.has(entryId(e))),
    retained: original.filter((e) => cleanedIds.has(entryId(e))),
    added: cleaned.filter((e) => !originalIds.has(entryId(e))),
  };
}

export type CategoryOutcome = 'removed' | 'kept' | 'partial' | 'added';

export interface CategoryComparison {
  category: MetadataCategory;
  before: number;
  after: number;
  beforeBlocks: number;
  afterBlocks: number;
  outcome: CategoryOutcome;
}

/** Per-category before/after counts for every category present in either file. */
export function compareCategories(original: ImageMetadataReport, cleaned: ImageMetadataReport): CategoryComparison[] {
  const rows: CategoryComparison[] = [];
  for (const category of CATEGORY_ORDER) {
    const beforeBlocks = original.blocks.filter((b) => b.category === category && b.action !== 'keep').length;
    const afterBlocks = cleaned.blocks.filter((b) => b.category === category && b.action !== 'keep').length;
    if (!beforeBlocks && !afterBlocks) continue;
    const before = original.entries.filter((e) => e.category === category && e.removable).length;
    const after = cleaned.entries.filter((e) => e.category === category && e.removable).length;
    let outcome: CategoryOutcome;
    if (!beforeBlocks) outcome = 'added';
    else if (!afterBlocks) outcome = 'removed';
    else if (after >= before) outcome = 'kept';
    else outcome = 'partial';
    rows.push({ category, before, after, beforeBlocks, afterBlocks, outcome });
  }
  return rows;
}
