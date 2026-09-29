import type { ToolDefinition } from '../types';

const csvViewer: ToolDefinition = {
  id: 'csv-viewer',
  name: 'CSV Viewer',
  tagline: 'View, sort and filter CSV files',
  description:
    'Open a CSV or TSV file as a table, sort and filter columns, and see column statistics, all on your device.',
  category: 'Data',
  icon: 'layers',
  tags: ['CSV', 'TSV', 'Table', 'Spreadsheet'],
  status: 'available',
  load: () => import('./CsvViewerPage'),
};

export default csvViewer;
