// Versioned JSON format for saving, exporting and importing diagrams. Imported files and the
// localStorage copy are untrusted: every field is checked and rebuilt, nothing is passed through.

import { AppError } from '../../../shared/lib/errors';
import { parseJsonText } from '../../../shared/lib/textpos';
import { clampLabel } from './diagram';
import { LIMITS, NODE_KINDS, type Diagram, type DiagramEdge, type DiagramGroup, type DiagramNode, type NodeKind } from './model';

export const FORMAT = 'zykit-architecture-diagram';
export const VERSION = 1;
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

export interface DiagramFile extends Diagram {
  format: typeof FORMAT;
  version: typeof VERSION;
}

export const toFile = (d: Diagram): DiagramFile => ({ format: FORMAT, version: VERSION, nodes: d.nodes, edges: d.edges, groups: d.groups });

export const serializeDiagram = (d: Diagram) => JSON.stringify(toFile(d), null, 2);

const ID = /^[A-Za-z0-9_-]{1,40}$/;

const fail = (message: string): never => {
  throw new AppError('VALIDATION_FAILED', message);
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function list(v: unknown, name: string, max: number): unknown[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) return fail(`"${name}" must be a list.`);
  if (v.length > max) return fail(`Too many ${name}: the limit is ${max}.`);
  return v;
}

function num(v: unknown, where: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fail(`${where} needs a numeric position and size.`);
  return Math.round(Math.min(LIMITS.coordinate, Math.max(-LIMITS.coordinate, v)));
}

function label(v: unknown, where: string): string {
  if (v === undefined) return '';
  if (typeof v !== 'string') return fail(`${where} has a label that isn't text.`);
  if (v.length > LIMITS.label) return fail(`${where} has a label longer than ${LIMITS.label} characters.`);
  return clampLabel(v);
}

function id(v: unknown, where: string, seen: Set<string>): string {
  if (typeof v !== 'string' || !ID.test(v)) return fail(`${where} needs an id of 1–40 letters, digits, "-" or "_".`);
  if (seen.has(v)) return fail(`The id "${v}" is used twice.`);
  seen.add(v);
  return v;
}

/** Validates a parsed value as a diagram file and returns a clean copy. Throws AppError on anything unexpected. */
export function parseDiagram(value: unknown): Diagram {
  if (!isRecord(value)) return fail('Not a diagram file: expected a JSON object.');
  if (value.format !== FORMAT) return fail(`Not a diagram file: "format" should be "${FORMAT}".`);
  if (value.version !== VERSION) return fail(`Unsupported diagram version: this tool reads version ${VERSION}.`);
  const seen = new Set<string>();

  const nodes: DiagramNode[] = list(value.nodes, 'nodes', LIMITS.nodes).map((raw, i) => {
    const where = `Node ${i + 1}`;
    if (!isRecord(raw)) return fail(`${where} isn't an object.`);
    if (!NODE_KINDS.includes(raw.kind as NodeKind)) return fail(`${where} has an unknown kind.`);
    return { id: id(raw.id, where, seen), kind: raw.kind as NodeKind, label: label(raw.label, where), x: num(raw.x, where), y: num(raw.y, where) };
  });
  const nodeIds = new Set(nodes.map((n) => n.id));

  const pairs = new Set<string>();
  const edges: DiagramEdge[] = list(value.edges, 'edges', LIMITS.edges).map((raw, i) => {
    const where = `Edge ${i + 1}`;
    if (!isRecord(raw)) return fail(`${where} isn't an object.`);
    const edgeId = id(raw.id, where, seen);
    if (typeof raw.from !== 'string' || typeof raw.to !== 'string' || !nodeIds.has(raw.from) || !nodeIds.has(raw.to))
      return fail(`${where} points at a node that doesn't exist.`);
    if (raw.from === raw.to) return fail(`${where} connects a node to itself.`);
    if (pairs.has(`${raw.from}\n${raw.to}`)) return fail(`${where} duplicates another edge.`);
    pairs.add(`${raw.from}\n${raw.to}`);
    return { id: edgeId, from: raw.from, to: raw.to, label: label(raw.label, where) };
  });

  const groups: DiagramGroup[] = list(value.groups, 'groups', LIMITS.groups).map((raw, i) => {
    const where = `Group ${i + 1}`;
    if (!isRecord(raw)) return fail(`${where} isn't an object.`);
    const width = num(raw.width, where);
    const height = num(raw.height, where);
    if (width < LIMITS.minGroupSize || height < LIMITS.minGroupSize || width > LIMITS.maxGroupSize || height > LIMITS.maxGroupSize)
      return fail(`${where} must be between ${LIMITS.minGroupSize} and ${LIMITS.maxGroupSize} px on each side.`);
    return { id: id(raw.id, where, seen), label: label(raw.label, where), x: num(raw.x, where), y: num(raw.y, where), width, height };
  });

  return { nodes, edges, groups };
}

/** Parses and validates the text of an imported file. */
export function importDiagram(text: string): Diagram {
  if (text.length > MAX_IMPORT_BYTES) return fail('The file is too large for a diagram (2 MB limit).');
  const parsed = parseJsonText(text);
  if (!parsed.ok) return fail(`Not valid JSON (line ${parsed.error.line}, column ${parsed.error.column}): ${parsed.error.message}`);
  return parseDiagram(parsed.value);
}
