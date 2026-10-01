import type { ToolDefinition } from '../types';

const imageResizer: ToolDefinition = {
  id: 'image-resizer',
  name: 'Image Resizer',
  tagline: 'Resize images by pixels, percentage or to fit a box',
  description:
    'Resize one image or a batch with the aspect ratio locked, by percentage, or to fit, fill or cover a size. Presets for 1080p, 4K, Instagram, Twitter headers and favicons.',
  category: 'Images',
  icon: 'grid',
  tags: ['Resize', 'Scale', 'JPEG', 'PNG', 'WebP', 'Batch'],
  status: 'available',
  load: () => import('./ImageResizerPage'),
  docs: () => import('./docs'),
};

export default imageResizer;
