import type { ToolDefinition } from '../types';

const csvJson: ToolDefinition = {
  id: 'csv-json',
  name: 'CSV ↔ JSON',
  tagline: 'Convert between CSV and JSON',
  description:
    'Convert CSV or TSV to JSON and JSON arrays to CSV, with delimiter detection, quoted fields, headers and type inference.',
  category: 'Data',
  icon: 'swap',
  tags: ['CSV', 'TSV', 'JSON', 'Convert'],
  status: 'available',
  load: () => import('./CsvJsonPage'),
};

export default csvJson;
