import type { ToolDefinition } from '../types';

const officeMetadataCleaner: ToolDefinition = {
  id: 'office-metadata-cleaner',
  name: 'Office Metadata Cleaner',
  tagline: 'Remove author and revision data from Word, Excel and PowerPoint',
  description:
    'Inspect and remove author, company, revision, comments and custom properties from .docx, .xlsx and .pptx files, locally.',
  category: 'Documents',
  icon: 'shield',
  tags: ['DOCX', 'XLSX', 'PPTX', 'Metadata', 'Privacy'],
  status: 'available',
  shareable: false,
  load: () => import('./OfficeMetadataCleanerPage'),
  docs: () => import('./docs'),
};

export default officeMetadataCleaner;
