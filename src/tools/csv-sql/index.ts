import type { ToolDefinition } from '../types';

const csvSql: ToolDefinition = {
  id: 'csv-sql',
  name: 'Query CSV with SQL',
  tagline: 'Run SQL queries on CSV files',
  description:
    'Load CSV files into an in-browser SQLite database and query, join and aggregate them with SQL. Nothing is uploaded.',
  category: 'Data',
  icon: 'database',
  tags: ['CSV', 'TSV', 'SQL', 'SQLite', 'Query', 'Join'],
  status: 'available',
  accepts: ['csv'],
  shareable: false,
  load: () => import('./CsvSqlPage'),
  docs: () => import('./docs'),
};

export default csvSql;
