import type { ToolDefinition } from '../types';

const imageConverter: ToolDefinition = {
  id: 'image-converter',
  name: 'Image Converter',
  tagline: 'Convert between PNG, JPEG, WebP and AVIF',
  description:
    'Convert images to PNG, JPEG, WebP or AVIF from any format your browser can open, with quality and background settings. Batch and ZIP download.',
  category: 'Images',
  icon: 'swap',
  tags: ['PNG', 'JPEG', 'WebP', 'AVIF', 'Convert', 'Batch'],
  status: 'available',
  load: () => import('./ImageConverterPage'),
  docs: () => import('./docs'),
};

export default imageConverter;
