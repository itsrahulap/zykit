import type { ToolDefinition } from '../types';

const jsonTreeViewer: ToolDefinition = {
  id: 'json-tree-viewer',
  name: 'JSON Tree Viewer',
  tagline: 'Explore large JSON as a collapsible tree',
  description:
    'Browse big JSON files as an expandable tree with search, path copy, type badges and array counts, without uploading them.',
  category: 'Data',
  icon: 'braces',
  tags: ['JSON', 'Tree', 'Viewer'],
  status: 'available',
  load: () => import('./JsonTreeViewerPage'),
  docs: () => import('./docs'),
};

export default jsonTreeViewer;
