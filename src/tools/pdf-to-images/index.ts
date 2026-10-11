import type { ToolDefinition } from '../types';

const pdfToImages: ToolDefinition = {
  id: 'pdf-to-images',
  name: 'PDF to Images',
  tagline: 'Convert PDF pages to JPG or PNG',
  description:
    'Turn every page of a PDF into JPG, PNG or WebP images at the resolution you choose, and download them as a ZIP. Nothing is uploaded.',
  category: 'Documents',
  icon: 'image',
  tags: ['PDF', 'JPG', 'PNG', 'Convert'],
  status: 'available',
  load: () => import('./PdfToImagesPage'),
  docs: () => import('./docs'),
};

export default pdfToImages;
