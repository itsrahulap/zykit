import type { ToolDefinition } from '../types';

const sqlFormatter: ToolDefinition = {
  id: 'sql-formatter',
  name: 'SQL Formatter',
  tagline: 'Format and beautify SQL queries',
  description:
    'Format SQL for PostgreSQL, MySQL, SQLite, SQL Server, BigQuery and more, with keyword case and indentation options.',
  category: 'Code',
  icon: 'database',
  tags: ['SQL', 'Format', 'PostgreSQL', 'MySQL'],
  status: 'available',
  accepts: ['sql'],
  produces: ['sql'],
  shareable: true,
  load: () => import('./SqlFormatterPage'),
  docs: () => import('./docs'),
};

export default sqlFormatter;
