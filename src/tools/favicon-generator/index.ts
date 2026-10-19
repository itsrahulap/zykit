import type { ToolDefinition } from '../types';

const faviconGenerator: ToolDefinition = {
  id: 'favicon-generator',
  name: 'Favicon Generator',
  tagline: 'Make favicon.ico, Apple and Android icons from an image or emoji',
  description:
    'Make favicon.ico, PNG favicons, Apple touch and Android icons, a web manifest and HTML link tags from an image, text or emoji, as one ZIP.',
  category: 'Images',
  icon: 'globe',
  tags: ['Favicon', 'ICO', 'PNG', 'Emoji', 'Manifest'],
  status: 'available',
  load: () => import('./FaviconGeneratorPage'),
  docs: () => import('./docs'),
};

export default faviconGenerator;
