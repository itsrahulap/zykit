// User docs for PostgreSQL EXPLAIN Visualizer, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'In PostgreSQL, run your query with `EXPLAIN (ANALYZE, BUFFERS)` in front of it (or `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`). Plain `EXPLAIN` works too but has estimates only.',
    'Paste the whole output into **EXPLAIN output**, drop a file on it, or press **Try an example**.',
    'Read the highlighted findings first, then walk the **Plan tree**: each step shows estimated and actual rows, cost, time and its share of the total. Click a step to fold it.',
  ],
  howItWorks:
    'The tool reads both the text and the JSON formats. In the text format, each `->` starts a step, and its indentation says which step it feeds into. Lines like `Filter:` or `Rows Removed by Filter:` belong to the step above them.\n\n' +
    'With ANALYZE, PostgreSQL reports times per loop, so a step’s total time is its time × loops. Its **own time** is that total minus the time of the steps below it, which shows where the work really happens. Steps that take at least 20% of the time on their own are highlighted, as are row estimates off by 10× or more (often a sign of stale statistics) and sorts that spilled to disk (often a sign that work_mem is too small).\n\n' +
    'Each common step type (Seq Scan, Index Scan, Hash Join, Nested Loop, Sort, Aggregate…) has a short explanation. None of them is bad in itself: a sequential scan is the right choice for a small table.',
  limits: [
    'Without ANALYZE there are no actual times or rows, so they show as “n/a” and no time-based findings are made.',
    'For parallel plans (under Gather), PostgreSQL averages times across workers, so own time for those steps is approximate.',
    'Only PostgreSQL output is supported, and only the first plan if several are pasted.',
  ],
  privacy: 'The plan is read entirely in your browser. Nothing is uploaded or stored, and the tool never connects to a database. Plans can contain table names and literal values from your query, so they stay on your device.',
  faqs: [
    {
      question: 'Why is the own time of a step different from its total time?',
      answer: 'The total includes everything below it in the tree. Own time subtracts the children’s time, so it shows the work done by that step alone.',
    },
    {
      question: 'The planner’s row estimate is way off. What can I do?',
      answer:
        'Run ANALYZE on the tables involved so PostgreSQL refreshes its statistics. If estimates stay wrong for correlated columns, extended statistics (CREATE STATISTICS) can help.',
    },
    {
      question: 'Is a Seq Scan always a problem?',
      answer: 'No. For small tables, or queries that need most of the rows, reading the whole table is faster than using an index. It matters when a big table is scanned to return only a few rows.',
    },
  ],
};

export default docs;
