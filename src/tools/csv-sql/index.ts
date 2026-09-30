import type { ToolDefinition } from '../types';

const csvSql: ToolDefinition = {
  id: 'csv-sql',
  name: 'Query CSV with SQL',
  tagline: 'Run SQL queries on CSV files',
  description:
    'Load CSV files into an in-browser SQLite database and query, join and aggregate them with SQL. Nothing is uploaded.',
  category: 'Data',
  icon: 'database',
  tags: ['CSV', 'SQL', 'SQLite', 'Query'],
  status: 'available',
  load: () => import('./CsvSqlPage'),
};

export default csvSql;
