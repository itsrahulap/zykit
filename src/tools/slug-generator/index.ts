import type { ToolDefinition } from '../types';

const slugGenerator: ToolDefinition = {
  id: 'slug-generator',
  name: 'Slug Generator',
  tagline: 'Turn titles into URL slugs',
  description:
    'Convert any text into a clean URL slug, with accents removed, a choice of separator and optional length limit.',
  category: 'Text',
  icon: 'link',
  tags: ['Slug', 'URL', 'SEO'],
  status: 'available',
  accepts: ['text'],
  produces: ['text'],
  shareable: true,
  load: () => import('./SlugGeneratorPage'),
  docs: () => import('./docs'),
};

export default slugGenerator;
