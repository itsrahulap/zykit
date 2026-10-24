// Parses PostgreSQL EXPLAIN output (text or FORMAT JSON, with or without ANALYZE/BUFFERS) into a
// tree, works out each node's own time, and flags the usual suspects. Pure; nothing connects to a database.

import { parseJsonText } from '../../../shared/lib/textpos';

export interface PlanNode {
  type: string;
  relation?: string;
  alias?: string;
  index?: string;
  joinType?: string;
  /** Estimated (planner) values. */
  startupCost?: number;
  totalCost?: number;
  planRows?: number;
  width?: number;
  /** Measured values (ANALYZE only). Times are per loop, in ms. */
  actualStartup?: number;
  actualTotal?: number;
  actualRows?: number;
  loops?: number;
  neverExecuted?: boolean;
  rowsRemovedByFilter?: number;
  sharedHit?: number;
  sharedRead?: number;
  sortSpillsToDisk?: boolean;
  /** Other detail lines (Filter, Index Cond, Hash Cond, Sort Key…), as written. */
  details: string[];
  children: PlanNode[];
}

export interface Plan {
  root: PlanNode;
  planningTime?: number;
  executionTime?: number;
  format: 'text' | 'json';
  analyzed: boolean;
}

export class ExplainError extends Error {
  line?: number;
  constructor(message: string, line?: number) {
    super(message);
    this.line = line;
  }
}

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

// ---------- JSON format ----------

function fromJson(n: Record<string, unknown>, depth = 0): PlanNode {
  if (depth > 500) throw new ExplainError('The plan is nested too deeply to show.');
  const details: string[] = [];
  for (const k of ['Filter', 'Index Cond', 'Recheck Cond', 'Hash Cond', 'Merge Cond', 'Join Filter', 'Sort Key', 'Group Key', 'Output']) {
    const v = n[k];
    if (typeof v === 'string') details.push(`${k}: ${v}`);
    else if (Array.isArray(v)) details.push(`${k}: ${v.join(', ')}`);
  }
  const loops = num(n['Actual Loops']);
  return {
    type: typeof n['Node Type'] === 'string' ? (n['Node Type'] as string) : 'Unknown',
    relation: typeof n['Relation Name'] === 'string' ? (n['Relation Name'] as string) : undefined,
    alias: typeof n.Alias === 'string' ? (n.Alias as string) : undefined,
    index: typeof n['Index Name'] === 'string' ? (n['Index Name'] as string) : undefined,
    joinType: typeof n['Join Type'] === 'string' ? (n['Join Type'] as string) : undefined,
    startupCost: num(n['Startup Cost']),
    totalCost: num(n['Total Cost']),
    planRows: num(n['Plan Rows']),
    width: num(n['Plan Width']),
    actualStartup: num(n['Actual Startup Time']),
    actualTotal: num(n['Actual Total Time']),
    actualRows: num(n['Actual Rows']),
    loops,
    neverExecuted: loops === 0,
    rowsRemovedByFilter: num(n['Rows Removed by Filter']),
    sharedHit: num(n['Shared Hit Blocks']),
    sharedRead: num(n['Shared Read Blocks']),
    sortSpillsToDisk: n['Sort Space Type'] === 'Disk' || (typeof n['Sort Method'] === 'string' && /external/i.test(n['Sort Method'] as string)),
    details,
    children: Array.isArray(n.Plans) ? (n.Plans as Record<string, unknown>[]).map((c) => fromJson(c, depth + 1)) : [],
  };
}

function parseJsonPlan(text: string): Plan {
  const parsed = parseJsonText(text);
  if (!parsed.ok) throw new ExplainError(`Not valid JSON: ${parsed.error.message}`, parsed.error.line);
  const first = (Array.isArray(parsed.value) ? parsed.value[0] : parsed.value) as Record<string, unknown> | undefined;
  const plan = first && typeof first === 'object' ? (first.Plan as Record<string, unknown> | undefined) : undefined;
  if (!plan || typeof plan !== 'object') throw new ExplainError('This JSON has no "Plan". Use EXPLAIN (FORMAT JSON) output.');
  const root = fromJson(plan);
  return { root, planningTime: num(first!['Planning Time']), executionTime: num(first!['Execution Time']), format: 'json', analyzed: root.actualTotal !== undefined || root.neverExecuted === true };
}

// ---------- text format ----------

const NUM = '(\\d+(?:\\.\\d+)?)';
const COST = new RegExp(`\\(cost=${NUM}\\.\\.${NUM} rows=${NUM} width=(\\d+)\\)`);
const ACTUAL = new RegExp(`\\(actual time=${NUM}\\.\\.${NUM} rows=${NUM} loops=(\\d+)\\)`);
const ACTUAL_NO_TIMING = new RegExp(`\\(actual rows=${NUM} loops=(\\d+)\\)`);

/** "Index Scan using users_pkey on users u" → type, index, relation, alias. */
function parseLabel(label: string): Pick<PlanNode, 'type' | 'relation' | 'alias' | 'index' | 'joinType'> {
  const using = /^(.*?) using (\S+)(?: on (\S+)(?: (\S+))?)?$/.exec(label);
  if (using) return { type: using[1], index: using[2], relation: using[3], alias: using[4] };
  const on = /^(.*?) on (\S+)(?: (\S+))?$/.exec(label);
  if (on) return { type: on[1], relation: on[2], alias: on[3] };
  const join = /^(Hash|Merge|Nested Loop)(?: (Left|Right|Full|Semi|Anti|Right Semi|Right Anti))? ?(Join)?$/.exec(label);
  // Same names as FORMAT JSON: "Hash Join" / "Merge Join", but plain "Nested Loop".
  if (join && join[2]) return { type: join[1] === 'Nested Loop' ? 'Nested Loop' : `${join[1]} Join`, joinType: join[2] };
  return { type: label };
}

function parseTextPlan(text: string): Plan {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s*\+$/, '')); // psql's "+" wrap markers
  const stack: { indent: number; node: PlanNode }[] = [];
  let root: PlanNode | null = null;
  let planningTime: number | undefined;
  let executionTime: number | undefined;
  lines.forEach((raw, i) => {
    const line = raw.replace(/^\s*"|"\s*$/g, '');
    const trimmed = line.trim();
    if (!trimmed || /^QUERY PLAN$/i.test(trimmed) || /^-+$/.test(trimmed) || /^\(\d+ rows?\)$/.test(trimmed)) return;
    const timing = /^(Planning|Execution) [Tt]ime: ([\d.]+) ms$/.exec(trimmed);
    if (timing) {
      if (timing[1] === 'Planning') planningTime = Number(timing[2]);
      else executionTime = Number(timing[2]);
      return;
    }
    const arrow = line.indexOf('->');
    const isNode = arrow >= 0 && /^\s*->/.test(line);
    if (isNode || !root) {
      const body = isNode ? line.slice(arrow + 2).trim() : trimmed;
      const cost = COST.exec(body);
      const actual = ACTUAL.exec(body);
      const noTiming = ACTUAL_NO_TIMING.exec(body);
      const labelEnd = body.search(/\s+\((cost=|actual |never executed)/);
      const node: PlanNode = {
        ...parseLabel(labelEnd >= 0 ? body.slice(0, labelEnd).trim() : body),
        startupCost: cost ? Number(cost[1]) : undefined,
        totalCost: cost ? Number(cost[2]) : undefined,
        planRows: cost ? Number(cost[3]) : undefined,
        width: cost ? Number(cost[4]) : undefined,
        actualStartup: actual ? Number(actual[1]) : undefined,
        actualTotal: actual ? Number(actual[2]) : undefined,
        actualRows: actual ? Number(actual[3]) : noTiming ? Number(noTiming[1]) : undefined,
        loops: actual ? Number(actual[4]) : noTiming ? Number(noTiming[2]) : undefined,
        neverExecuted: /\(never executed\)/.test(body),
        details: [],
        children: [],
      };
      const indent = isNode ? arrow : -1;
      if (!root) {
        if (isNode) throw new ExplainError('The plan should start with its top node (a line without “->”).', i + 1);
        root = node;
        stack.push({ indent: -1, node });
        return;
      }
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
      stack[stack.length - 1].node.children.push(node);
      stack.push({ indent, node });
      return;
    }
    // A detail line belongs to the most recent node.
    const node = stack[stack.length - 1].node;
    const removed = /^Rows Removed by Filter: (\d+)/.exec(trimmed);
    if (removed) node.rowsRemovedByFilter = Number(removed[1]);
    const buffers = /^Buffers: shared(?: hit=(\d+))?(?: read=(\d+))?/.exec(trimmed);
    if (buffers) {
      node.sharedHit = buffers[1] ? Number(buffers[1]) : undefined;
      node.sharedRead = buffers[2] ? Number(buffers[2]) : undefined;
    }
    if (/^Sort Method: external|Disk: \d+kB/.test(trimmed)) node.sortSpillsToDisk = true;
    if (!removed && !buffers) node.details.push(trimmed);
  });
  if (!root) throw new ExplainError('No plan found. Paste the output of EXPLAIN or EXPLAIN ANALYZE.');
  const r: PlanNode = root;
  return { root: r, planningTime, executionTime, format: 'text', analyzed: r.actualTotal !== undefined || r.actualRows !== undefined || r.neverExecuted === true };
}

export function parseExplain(text: string): Plan {
  const t = text.trim();
  if (!t) throw new ExplainError('Paste the output of EXPLAIN or EXPLAIN ANALYZE.');
  return /^[[{]/.test(t) ? parseJsonPlan(t) : parseTextPlan(t);
}

// ---------- analysis ----------

/** Time spent in a node across all loops, including its children (ms), or undefined without ANALYZE timing. */
export const inclusiveTime = (n: PlanNode) => (n.actualTotal !== undefined ? n.actualTotal * (n.loops ?? 1) : undefined);

/** Time spent in the node itself: its inclusive time minus its children's (never below 0). */
export function exclusiveTime(n: PlanNode): number | undefined {
  const own = inclusiveTime(n);
  if (own === undefined) return undefined;
  const kids = n.children.reduce((s, c) => s + (inclusiveTime(c) ?? 0), 0);
  return Math.max(0, own - kids);
}

/** How far the row estimate was off, as a factor ≥ 1 (both per loop), or undefined if unknown. */
export function misestimate(n: PlanNode): number | undefined {
  if (n.planRows === undefined || n.actualRows === undefined || n.neverExecuted) return undefined;
  const a = Math.max(n.actualRows, 1);
  const p = Math.max(n.planRows, 1);
  return Math.max(a / p, p / a);
}

export interface Finding {
  node: PlanNode;
  message: string;
}

export function walk(n: PlanNode, out: PlanNode[] = []): PlanNode[] {
  out.push(n);
  n.children.forEach((c) => walk(c, out));
  return out;
}

/** The nodes worth a look: biggest own time, large misestimates, sorts spilling to disk. */
export function findings(plan: Plan): Finding[] {
  const nodes = walk(plan.root);
  const out: Finding[] = [];
  const total = inclusiveTime(plan.root);
  if (total) {
    for (const n of [...nodes].sort((a, b) => (exclusiveTime(b) ?? 0) - (exclusiveTime(a) ?? 0)).slice(0, 3)) {
      const t = exclusiveTime(n) ?? 0;
      if (t / total >= 0.2) out.push({ node: n, message: `${label(n)} takes ${Math.round((t / total) * 100)}% of the time on its own (${fmtMs(t)}).` });
    }
  }
  for (const n of nodes) {
    const m = misestimate(n);
    if (m !== undefined && m >= 10)
      out.push({ node: n, message: `${label(n)}: the planner expected ${n.planRows!.toLocaleString('en-US')} rows but got ${n.actualRows!.toLocaleString('en-US')} (${Math.round(m)}× off). Stale statistics? Try ANALYZE on the table.` });
    if (n.sortSpillsToDisk) out.push({ node: n, message: `${label(n)} spilled to disk. Raising work_mem for this query may keep it in memory.` });
  }
  return out;
}

export const label = (n: PlanNode) => `${n.joinType ? `${n.type} (${n.joinType})` : n.type}${n.relation ? ` on ${n.relation}` : ''}`;
export const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms < 10 ? ms.toFixed(3) : ms.toFixed(1)} ms`);

/** Plain-English descriptions of common plan nodes. */
export const NODE_INFO: Record<string, string> = {
  'Seq Scan': 'Reads every row of the table. Normal for small tables or when most rows are needed; on a big table with a selective filter, an index may help.',
  'Parallel Seq Scan': 'Several workers each read part of the table.',
  'Index Scan': 'Finds rows through an index, then reads each matching row from the table.',
  'Index Only Scan': 'Answers from the index alone, without visiting the table (when the visibility map allows).',
  'Bitmap Index Scan': 'Collects the locations of matching rows from an index into a bitmap.',
  'Bitmap Heap Scan': 'Reads the table pages listed in a bitmap, in physical order, rechecking the condition.',
  'Nested Loop': 'For each row from the outer side, looks up matches on the inner side. Fast when the outer side is small and the inner side is indexed.',
  'Hash Join': 'Builds a hash table from one input, then probes it with each row of the other. Good for larger, unsorted inputs.',
  'Merge Join': 'Walks two inputs sorted on the join key side by side.',
  Hash: 'Builds the in-memory hash table used by a Hash Join.',
  Sort: 'Sorts its input. Uses memory up to work_mem, then spills to disk.',
  'Incremental Sort': 'Sorts input that is already sorted on a prefix of the keys, in small groups.',
  Aggregate: 'Computes aggregates such as count() or sum().',
  HashAggregate: 'Groups rows using a hash table.',
  GroupAggregate: 'Groups rows that arrive sorted by the group key.',
  Limit: 'Stops after the requested number of rows.',
  Materialize: 'Keeps its input’s rows in memory so they can be read again (often under a Nested Loop).',
  Memoize: 'Caches inner-side results of a Nested Loop by key.',
  Gather: 'Collects rows from parallel workers.',
  'Gather Merge': 'Collects sorted rows from parallel workers, keeping the order.',
  Append: 'Returns the rows of several inputs one after another (UNION ALL, partitions).',
  'CTE Scan': 'Reads the result of a WITH query.',
  'Subquery Scan': 'Reads the result of a subquery.',
  'Function Scan': 'Reads rows produced by a function.',
  Result: 'Computes values without reading a table (or filters with a constant condition).',
  Unique: 'Removes duplicate rows from sorted input.',
  WindowAgg: 'Computes window functions.',
  LockRows: 'Locks the selected rows (SELECT … FOR UPDATE).',
  ModifyTable: 'Inserts, updates or deletes rows.',
};

export function nodeInfo(n: PlanNode): string | undefined {
  return NODE_INFO[n.type] ?? NODE_INFO[n.type.replace(/^Parallel | Backward$/g, '')];
}
