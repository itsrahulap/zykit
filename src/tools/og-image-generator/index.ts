import type { ToolDefinition } from '../types';

const ogImageGenerator: ToolDefinition = {
  id: 'og-image-generator',
  name: 'Open Graph Image Generator',
  tagline: 'Make 1200×630 social preview images',
  description:
    'Design Open Graph and Twitter card images from a title, colours and an optional logo, and download them as PNG.',
  category: 'Web',
  icon: 'image',
  tags: ['Open Graph', 'Social', 'PNG', 'Twitter card', 'Canvas'],
  status: 'available',
  load: () => import('./OgImageGeneratorPage'),
  docs: () => import('./docs'),
};

export default ogImageGenerator;
