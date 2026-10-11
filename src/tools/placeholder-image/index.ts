import type { ToolDefinition } from '../types';

const placeholderImage: ToolDefinition = {
  id: 'placeholder-image',
  name: 'Placeholder Image Generator',
  tagline: 'Make placeholder images of any size',
  description:
    'Create placeholder images with custom size, colours and text, and download them as PNG, JPEG, WebP or SVG.',
  category: 'Images',
  icon: 'image',
  tags: ['Placeholder', 'Mockup', 'SVG'],
  status: 'available',
  shareable: true,
  load: () => import('./PlaceholderImagePage'),
  docs: () => import('./docs'),
};

export default placeholderImage;
