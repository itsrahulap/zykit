import type { ToolDefinition } from '../types';

const sqlSchemaVisualizer: ToolDefinition = {
  id: 'sql-schema-visualizer',
  name: 'SQL Schema Visualizer',
  tagline: 'Turn PostgreSQL DDL into an ER diagram',
  description:
    'Paste CREATE TABLE statements to get an entity-relationship diagram with keys, foreign keys and indexes, plus SVG, PNG and Mermaid erDiagram export.',
  category: 'Data',
  icon: 'database',
  tags: ['sql', 'postgres', 'ddl', 'er diagram', 'erd', 'schema', 'mermaid'],
  status: 'available',
  load: () => import('./SqlSchemaVisualizerPage'),
  docs: () => import('./docs'),
};

export default sqlSchemaVisualizer;
