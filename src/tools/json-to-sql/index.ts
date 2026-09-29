import type { ToolDefinition } from '../types';

const jsonToSql: ToolDefinition = {
  id: 'json-to-sql',
  name: 'JSON to SQL',
  tagline: 'Turn JSON arrays into SQL inserts',
  description:
    'Convert an array of JSON objects into CREATE TABLE and INSERT statements for PostgreSQL, MySQL, SQLite or SQL Server.',
  category: 'Data',
  icon: 'database',
  tags: ['JSON', 'SQL', 'INSERT', 'CREATE TABLE'],
  status: 'available',
  load: () => import('./JsonToSqlPage'),
};

export default jsonToSql;
