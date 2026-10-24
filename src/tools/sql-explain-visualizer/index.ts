import type { ToolDefinition } from '../types';

const sqlExplainVisualizer: ToolDefinition = {
  id: 'sql-explain-visualizer',
  name: 'PostgreSQL EXPLAIN Visualizer',
  tagline: 'See where a PostgreSQL query plan spends its time',
  description:
    'Paste EXPLAIN or EXPLAIN ANALYZE output (text or JSON) to see the plan as a tree with costs, actual times, row estimates and plain-English explanations of each step.',
  category: 'Data',
  icon: 'database',
  tags: ['postgres', 'postgresql', 'explain', 'analyze', 'query plan', 'sql', 'performance'],
  status: 'available',
  load: () => import('./SqlExplainVisualizerPage'),
  docs: () => import('./docs'),
};

export default sqlExplainVisualizer;
