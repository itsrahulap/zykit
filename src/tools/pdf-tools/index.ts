import type { ToolDefinition } from '../types';

const pdfTools: ToolDefinition = {
  id: 'pdf-tools',
  name: 'PDF Merge & Split',
  tagline: 'Merge, split, reorder and rotate PDFs',
  description:
    'Combine PDFs, split or extract pages, reorder and rotate them, all in your browser without uploading.',
  category: 'Documents',
  icon: 'file',
  tags: ['PDF', 'Merge', 'Split', 'Rotate', 'Extract pages', 'Privacy'],
  status: 'available',
  shareable: false,
  load: () => import('./PdfToolsPage'),
  docs: () => import('./docs'),
};

export default pdfTools;
