import type { CsvDelimiter } from '../../../shared/lib/csv';
import type { Table } from '../features/table';

export interface CsvRequest {
  id: number;
  text: string;
  delimiter: CsvDelimiter | 'auto';
  header: boolean;
}

export type CsvResponse = { id: number; type: 'done'; table: Table } | { id: number; type: 'error'; message: string };
