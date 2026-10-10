import type { ToolDefinition } from '../types';

const logViewer: ToolDefinition = {
  id: 'log-viewer',
  name: 'Log Viewer',
  tagline: 'Filter and search JSON log files',
  description:
    'Open NDJSON or plain log files to filter by level, field and text, sort by time and inspect each entry, without uploading.',
  category: 'Data',
  icon: 'search',
  tags: ['Logs', 'NDJSON', 'JSON Lines'],
  status: 'available',
  load: () => import('./LogViewerPage'),
  docs: () => import('./docs'),
};

export default logViewer;
