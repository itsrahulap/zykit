import type { ToolDefinition } from '../types';

const pdfMetadataCleaner: ToolDefinition = {
  id: 'pdf-metadata-cleaner',
  name: 'PDF Metadata Cleaner',
  tagline: 'See and remove hidden PDF metadata',
  description:
    'Inspect a PDF\'s author, software, dates and XMP metadata, then remove it without changing the pages. Nothing is uploaded.',
  category: 'Documents',
  icon: 'shield',
  tags: ['PDF', 'Metadata', 'Privacy'],
  status: 'available',
  shareable: false,
  load: () => import('./PdfMetadataCleanerPage'),
  docs: () => import('./docs'),
};

export default pdfMetadataCleaner;
