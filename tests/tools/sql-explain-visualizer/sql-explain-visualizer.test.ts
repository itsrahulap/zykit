import { describe, expect, it } from 'vitest';
import { exclusiveTime, ExplainError, findings, inclusiveTime, label, misestimate, nodeInfo, parseExplain, walk } from '../../../src/tools/sql-explain-visualizer/features/sql-explain-visualizer';

// Shaped like real psql output of EXPLAIN (ANALYZE, BUFFERS), including the header and footer.
const TEXT = `                                                        QUERY PLAN
---------------------------------------------------------------------------------------------------------------------------
 Sort  (cost=1100.50..1103.00 rows=1000 width=44) (actual time=95.100..120.400 rows=50000 loops=1)
   Sort Key: o.created_at DESC
   Sort Method: external merge  Disk: 2048kB
   Buffers: shared hit=120 read=880
   ->  Hash Left Join  (cost=30.50..1050.00 rows=1000 width=44) (actual time=1.200..60.000 rows=50000 loops=1)
         Hash Cond: (o.user_id = u.id)
         ->  Seq Scan on orders o  (cost=0.00..900.00 rows=1000 width=36) (actual time=0.010..40.000 rows=50000 loops=1)
               Filter: (status = 'paid'::text)
               Rows Removed by Filter: 150000
         ->  Hash  (cost=18.00..18.00 rows=1000 width=12) (actual time=1.100..1.100 rows=1000 loops=1)
               Buckets: 1024  Batches: 1  Memory Usage: 52kB
               ->  Index Only Scan using users_pkey on users u  (cost=0.28..18.00 rows=1000 width=12) (actual time=0.020..0.700 rows=1000 loops=1)
                     Heap Fetches: 0
   ->  Nested Loop Left Join  (cost=0.29..8.31 rows=1 width=8) (never executed)
 Planning Time: 0.250 ms
 Execution Time: 125.000 ms
(15 rows)`;

const JSON_PLAN = JSON.stringify([
  {
    Plan: {
      'Node Type': 'Nested Loop',
      'Join Type': 'Inner',
      'Startup Cost': 0.29,
      'Total Cost': 16.6,
      'Plan Rows': 1,
      'Plan Width': 40,
      'Actual Startup Time': 0.02,
      'Actual Total Time': 0.5,
      'Actual Rows': 10,
      'Actual Loops': 1,
      Plans: [
        { 'Node Type': 'Seq Scan', 'Relation Name': 'orders', Alias: 'o', 'Total Cost': 1, 'Plan Rows': 1, 'Actual Total Time': 0.1, 'Actual Rows': 10, 'Actual Loops': 1, Filter: '(id < 10)' },
        { 'Node Type': 'Index Scan', 'Index Name': 'users_pkey', 'Relation Name': 'users', 'Total Cost': 8, 'Plan Rows': 1, 'Actual Total Time': 0.03, 'Actual Rows': 1, 'Actual Loops': 10, 'Shared Hit Blocks': 30 },
      ],
    },
    'Planning Time': 0.1,
    'Execution Time': 0.6,
  },
]);

describe('text format', () => {
  const plan = parseExplain(TEXT);
  const nodes = walk(plan.root);

  it('builds the tree from the -> indentation', () => {
    expect(plan.format).toBe('text');
    expect(plan.analyzed).toBe(true);
    expect(nodes.map(label)).toEqual(['Sort', 'Hash Join (Left)', 'Seq Scan on orders', 'Hash', 'Index Only Scan on users', 'Nested Loop (Left)']);
    expect(plan.root.children.map((c) => c.type)).toEqual(['Hash Join', 'Nested Loop']);
    expect(nodes[1].children.map((c) => c.type)).toEqual(['Seq Scan', 'Hash']);
  });
  it('reads costs, actuals, details and timings', () => {
    const scan = nodes[2];
    expect(scan).toMatchObject({ relation: 'orders', alias: 'o', startupCost: 0, totalCost: 900, planRows: 1000, actualTotal: 40, actualRows: 50000, loops: 1, rowsRemovedByFilter: 150000 });
    expect(scan.details).toEqual(["Filter: (status = 'paid'::text)"]);
    expect(nodes[4]).toMatchObject({ index: 'users_pkey', relation: 'users', alias: 'u' });
    expect(plan.root).toMatchObject({ sharedHit: 120, sharedRead: 880, sortSpillsToDisk: true });
    expect(nodes[5].neverExecuted).toBe(true);
    expect([plan.planningTime, plan.executionTime]).toEqual([0.25, 125]);
  });
  it('computes own time and flags the expensive, misestimated and spilling nodes', () => {
    expect(exclusiveTime(plan.root)).toBeCloseTo(60.4);
    expect(exclusiveTime(nodes[1])).toBeCloseTo(18.9);
    expect(misestimate(nodes[2])).toBe(50);
    expect(misestimate(nodes[5])).toBeUndefined();
    const f = findings(plan).map((x) => x.message);
    expect(f.some((m) => /^Sort takes 50% of the time/.test(m))).toBe(true);
    expect(f.some((m) => /Seq Scan on orders: the planner expected 1,000 rows but got 50,000 \(50× off\)/.test(m))).toBe(true);
    expect(f.some((m) => /Sort spilled to disk/.test(m))).toBe(true);
  });
  it('accepts plain EXPLAIN without ANALYZE and COSTS OFF output', () => {
    const p = parseExplain('Seq Scan on t  (cost=0.00..1.01 rows=1 width=4)');
    expect(p.analyzed).toBe(false);
    expect(inclusiveTime(p.root)).toBeUndefined();
    expect(findings(p)).toEqual([]);
    const off = parseExplain('Hash Join\n  Hash Cond: (a.id = b.id)\n  ->  Seq Scan on a\n  ->  Hash\n        ->  Seq Scan on b');
    expect(walk(off.root).map(label)).toEqual(['Hash Join', 'Seq Scan on a', 'Hash', 'Seq Scan on b']);
  });
  it('strips psql wrap markers and quoted lines', () => {
    const p = parseExplain('"Limit  (cost=0.00..0.10 rows=1 width=4)" +\n"  ->  Seq Scan on t  (cost=0.00..1.00 rows=10 width=4)"');
    expect(walk(p.root).map(label)).toEqual(['Limit', 'Seq Scan on t']);
  });
});

describe('JSON format', () => {
  const plan = parseExplain(JSON_PLAN);
  it('reads nodes, loops and buffers', () => {
    expect(plan.format).toBe('json');
    expect(walk(plan.root).map(label)).toEqual(['Nested Loop (Inner)', 'Seq Scan on orders', 'Index Scan on users']);
    expect(plan.root.children[1]).toMatchObject({ index: 'users_pkey', loops: 10, sharedHit: 30 });
    expect(plan.root.children[0].details).toEqual(['Filter: (id < 10)']);
    expect(inclusiveTime(plan.root.children[1])).toBeCloseTo(0.3);
    expect(exclusiveTime(plan.root)).toBeCloseTo(0.1);
  });
});

describe('errors and explanations', () => {
  it('reports unusable input clearly', () => {
    expect(() => parseExplain('')).toThrow(ExplainError);
    expect(() => parseExplain('[{"nope":1}]')).toThrow(/no "Plan"/);
    expect(() => parseExplain('[{"Plan": ')).toThrow(/Not valid JSON/);
    expect(() => parseExplain('  ->  Seq Scan on t')).toThrow(/top node/);
  });
  it('explains common node types without calling them bad', () => {
    for (const t of ['Seq Scan', 'Index Scan', 'Index Only Scan', 'Bitmap Heap Scan', 'Nested Loop', 'Hash Join', 'Merge Join', 'Sort', 'Aggregate']) {
      expect(nodeInfo({ type: t, details: [], children: [] }), t).toBeTruthy();
    }
    expect(nodeInfo({ type: 'Parallel Seq Scan', details: [], children: [] })).toBeTruthy();
    expect(nodeInfo({ type: 'Index Scan Backward', details: [], children: [] })).toBeTruthy();
  });
});
