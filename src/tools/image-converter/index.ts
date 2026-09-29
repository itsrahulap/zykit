import type { ToolDefinition } from '../types';

const imageConverter: ToolDefinition = {
  id: 'image-converter',
  name: 'Image Converter',
  tagline: 'Convert between PNG, JPEG, WebP and AVIF',
  description:
    'Convert images between PNG, JPEG, WebP and AVIF, with a background colour for transparent areas and a quality setting. Reads any format your browser can open. Batch and ZIP download.',
  category: 'Images',
  icon: 'swap',
  tags: ['PNG', 'JPEG', 'WebP', 'AVIF', 'Convert', 'Batch'],
  status: 'available',
  load: () => import('./ImageConverterPage'),
};

export default imageConverter;
