# PostgreSQL EXPLAIN Visualizer

## Purpose

Turns PostgreSQL `EXPLAIN` / `EXPLAIN ANALYZE` output (text or `FORMAT JSON`, with or without `BUFFERS`) into a collapsible tree with estimates, actual times and rows, each node's own share of the time, and plain-English explanations. It never connects to a database. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `SqlExplainVisualizerPage.tsx` | Input, findings, plan tree (`NodeRow` with native `<details>`) |
| `features/sql-explain-visualizer.ts` | `parseExplain` (text and JSON), `inclusiveTime` / `exclusiveTime`, `misestimate`, `findings`, `NODE_INFO` |

## Core Logic

JSON input (it starts with `[` or `{`) maps the documented keys (`Node Type`, `Actual Total Time`, `Plans`…). Text input is read line by line: psql's header, separator, `(N rows)` footer, `+` wrap markers and surrounding quotes are dropped; the first line is the root, each `->` line is a node whose parent is the nearest earlier node with a smaller `->` column (a stack), and other lines are details of the latest node (`Rows Removed by Filter`, `Buffers`, `Sort Method: external`/`Disk:` are parsed, the rest kept as text). Node labels are split into type, index, relation and alias, with join types (`Hash Left Join` → `Hash Join` + `Left`) named as in the JSON format.

Actual times are per loop, so inclusive time is `Actual Total Time × loops` and a node's own time is its inclusive time minus its children's (floored at 0). `findings` reports nodes using at least 20% of the root's time on their own, estimates off by 10× or more (per-loop rows, never-executed nodes skipped) and sorts that spilled to disk. Values a plan doesn't contain are shown as "n/a", never 0.

## Limits

- Parallel plans: worker times are averaged by PostgreSQL, so own time for nodes under `Gather` is approximate.
- Only the first plan of multi-statement output is read.
- Other databases' EXPLAIN formats (MySQL, SQLite) aren't supported.

## Tests

- Unit: `tests/tools/sql-explain-visualizer/sql-explain-visualizer.test.ts` (psql text with header/footer, tree shape from indentation, costs/actuals/details/buffers/never executed, own time, misestimates and disk sorts, estimates-only and COSTS OFF plans, wrap markers, JSON format with loops, error messages, node explanations). `npm test -- sql-explain-visualizer`
- E2E: `e2e/sql-explain-visualizer.spec.ts`. `npm run test:e2e -- sql-explain-visualizer`

## Known Gaps

- No side-by-side comparison of two plans.
- No flame-graph view.
