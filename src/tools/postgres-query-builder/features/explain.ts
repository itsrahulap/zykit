// Plain-language description of a (valid) query, from local rules. No AI service involved.

import { findColumn, findTable, type ColRef, type Condition, type ConditionGroup, type Query, type Schema } from './model';
import { sourceName } from './query';

const JOIN_WORDS = {
  INNER: 'keeping only rows that match in both',
  LEFT: 'keeping every row from the tables before it, even without a match',
  RIGHT: 'keeping every row from this table, even without a match',
  FULL: 'keeping unmatched rows from both sides',
} as const;

export function explainQuery(schema: Schema, q: Query): string[] {
  const col = (ref: ColRef) => {
    const src = q.sources.find((s) => s.id === ref.sourceId);
    const c = findColumn(findTable(schema, src?.tableId ?? ''), ref.columnId);
    return src && c ? (q.sources.length > 1 ? `${sourceName(schema, src)}.${c.name}` : c.name) : '?';
  };
  const cond = (c: Condition): string => {
    const left = c.target.kind === 'column' ? col(c.target.ref) : `${c.target.fn}(${c.target.ref ? col(c.target.ref) : '*'})`;
    const vals = c.values.filter((v) => v.trim() !== '');
    switch (c.op) {
      case 'IS NULL':
        return `${left} is empty (NULL)`;
      case 'IS NOT NULL':
        return `${left} has a value`;
      case 'BETWEEN':
        return `${left} is between ${vals[0]} and ${vals[1]} (inclusive)`;
      case 'IN':
        return `${left} is one of ${vals.join(', ')}`;
      case 'NOT IN':
        return `${left} is none of ${vals.join(', ')}`;
      case 'LIKE':
        return `${left} matches the pattern "${vals[0]}" (case-sensitive; % is any text, _ is one character)`;
      case 'ILIKE':
        return `${left} matches the pattern "${vals[0]}" (ignoring case)`;
      default:
        return `${left} ${c.op} ${vals[0]}`;
    }
  };
  const group = (g: ConditionGroup): string =>
    g.children.map((ch) => (ch.kind === 'group' ? `(${group(ch)})` : cond(ch))).join(g.op === 'AND' ? ' and ' : ' or ');

  const out: string[] = [];
  const cols = q.select.map((s) =>
    s.kind === 'all' ? (s.sourceId ? `every column of ${sourceName(schema, q.sources.find((x) => x.id === s.sourceId)!)}` : 'every column') : s.kind === 'column' ? col(s.ref) : `${s.fn === 'COUNT' && !s.ref ? 'the number of rows' : `${s.fn.toLowerCase()} of ${col(s.ref!)}`}${s.alias ? ` (as ${s.alias})` : ''}`,
  );
  const [first, ...joins] = q.sources;
  out.push(`${q.distinct ? 'Returns distinct rows of' : 'Returns'} ${cols.join(', ')} from ${findTable(schema, first.tableId)?.name}${first.alias ? ` (called ${first.alias})` : ''}.`);
  for (const j of joins) {
    out.push(`Joins ${findTable(schema, j.tableId)?.name}${j.alias ? ` (called ${j.alias})` : ''} where ${j.on.map((o) => `${col({ sourceId: j.id, columnId: o.rightColumnId })} equals ${col(o.left)}`).join(' and ')}, ${JOIN_WORDS[j.join]}.`);
  }
  if (q.where.children.length) out.push(`Only rows where ${group(q.where)}.`);
  if (q.groupBy.length) out.push(`Groups rows that share the same ${q.groupBy.map(col).join(', ')}, so aggregates are calculated per group.`);
  if (q.having.children.length) out.push(`Keeps only groups where ${group(q.having)}.`);
  if (q.orderBy.length)
    out.push(
      `Sorted by ${q.orderBy
        .map((o) => {
          const name = o.target.kind === 'column' ? col(o.target.ref) : (q.select.find((s) => s.id === (o.target as { selectId: string }).selectId) as { alias?: string } | undefined)?.alias;
          return `${name} ${o.dir === 'ASC' ? 'ascending' : 'descending'}`;
        })
        .join(', then ')}.`,
    );
  if (q.limit.trim()) out.push(`Returns at most ${q.limit.trim()} rows${q.offset.trim() ? `, after skipping the first ${q.offset.trim()}` : ''}.`);
  else if (q.offset.trim()) out.push(`Skips the first ${q.offset.trim()} rows.`);
  return out;
}
