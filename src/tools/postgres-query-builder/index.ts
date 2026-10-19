import type { ToolDefinition } from '../types';

const postgresQueryBuilder: ToolDefinition = {
  id: 'postgres-query-builder',
  name: 'PostgreSQL Query Builder',
  tagline: 'Design tables and build PostgreSQL queries visually',
  description:
    'Draw tables and relationships, build SELECT queries with joins, filters and grouping without writing SQL, and generate PostgreSQL CREATE TABLE statements.',
  category: 'Data',
  icon: 'database',
  tags: ['PostgreSQL', 'SQL', 'Query builder', 'Schema', 'ERD'],
  status: 'available',
  load: () => import('./PostgresQueryBuilderPage'),
  docs: () => import('./docs'),
};

export default postgresQueryBuilder;
