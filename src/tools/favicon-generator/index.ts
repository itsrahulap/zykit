import type { ToolDefinition } from '../types';

const faviconGenerator: ToolDefinition = {
  id: 'favicon-generator',
  name: 'Favicon Generator',
  tagline: 'Make favicon.ico, Apple and Android icons from an image or emoji',
  description:
    'Generate a multi-size favicon.ico, PNG favicons, an Apple touch icon, Android icons, a web manifest and the HTML link tags from an image, text or emoji. Download everything as a ZIP.',
  category: 'Images',
  icon: 'globe',
  tags: ['Favicon', 'ICO', 'PNG', 'Emoji', 'Manifest'],
  status: 'available',
  load: () => import('./FaviconGeneratorPage'),
  docs: () => import('./docs'),
};

export default faviconGenerator;
