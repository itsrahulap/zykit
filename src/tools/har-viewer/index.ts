import type { ToolDefinition } from '../types';

const harViewer: ToolDefinition = {
  id: 'har-viewer',
  name: 'HAR Viewer',
  tagline: 'Inspect browser network recordings (HAR)',
  description:
    'Open a HAR file to see every request with timing waterfall, sizes, status codes and headers, and find the slowest calls, all locally.',
  category: 'Network & HTTP',
  icon: 'chart',
  tags: ['HAR', 'Network', 'Waterfall', 'Performance'],
  status: 'available',
  shareable: false,
  load: () => import('./HarViewerPage'),
  docs: () => import('./docs'),
};

export default harViewer;
