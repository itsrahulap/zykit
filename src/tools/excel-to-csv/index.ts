import type { ToolDefinition } from '../types';

const excelToCsv: ToolDefinition = {
  id: 'excel-to-csv',
  name: 'Excel to CSV / JSON',
  tagline: 'Convert .xlsx sheets to CSV or JSON',
  description:
    'Open an Excel workbook, preview each sheet and export it as CSV, TSV or JSON, without uploading the file.',
  category: 'Data',
  icon: 'layers',
  tags: ['Excel', 'XLSX', 'CSV', 'JSON'],
  status: 'available',
  load: () => import('./ExcelToCsvPage'),
  docs: () => import('./docs'),
};

export default excelToCsv;
