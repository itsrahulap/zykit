import type { ToolDefinition } from '../types';

const imagesToPdf: ToolDefinition = {
  id: 'images-to-pdf',
  name: 'Images to PDF',
  tagline: 'Combine images into one PDF',
  description:
    'Turn photos or scans into a single PDF with page size, margins, orientation and order you choose, all in your browser.',
  category: 'Documents',
  icon: 'file',
  tags: ['PDF', 'JPEG', 'PNG', 'Scan'],
  status: 'available',
  shareable: false,
  load: () => import('./ImagesToPdfPage'),
  docs: () => import('./docs'),
};

export default imagesToPdf;
