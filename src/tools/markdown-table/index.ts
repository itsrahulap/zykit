import type { ToolDefinition } from '../types';

const markdownTable: ToolDefinition = {
  id: 'markdown-table',
  name: 'Markdown Table Generator',
  tagline: 'Build and format Markdown tables',
  description:
    'Create Markdown tables from CSV, JSON or a grid editor, align columns and pretty-print existing tables.',
  category: 'Text',
  icon: 'layers',
  tags: ['Markdown', 'Table', 'CSV'],
  status: 'available',
  load: () => import('./MarkdownTablePage'),
  docs: () => import('./docs'),
};

export default markdownTable;
