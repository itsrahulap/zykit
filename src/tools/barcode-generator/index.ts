import type { ToolDefinition } from '../types';

const barcodeGenerator: ToolDefinition = {
  id: 'barcode-generator',
  name: 'Barcode Generator',
  tagline: 'Create Code 128, EAN-13, UPC-A and more',
  description:
    'Generate barcodes in Code 128, Code 39, EAN-13, EAN-8, UPC-A and ITF with check digits, and download them as PNG or SVG.',
  category: 'Web',
  icon: 'grid',
  tags: ['Barcode', 'EAN-13', 'Code 128'],
  status: 'available',
  shareable: true,
  load: () => import('./BarcodeGeneratorPage'),
  docs: () => import('./docs'),
};

export default barcodeGenerator;
