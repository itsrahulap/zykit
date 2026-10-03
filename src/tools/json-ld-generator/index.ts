import type { ToolDefinition } from '../types';

const jsonLdGenerator: ToolDefinition = {
  id: 'json-ld-generator',
  name: 'JSON-LD Generator',
  tagline: 'Create schema.org structured data',
  description:
    'Generate JSON-LD structured data for articles, products, FAQs, organisations, events, breadcrumbs and more, ready to paste into a page.',
  category: 'Web',
  icon: 'braces',
  tags: ['JSON-LD', 'Schema.org', 'SEO', 'Rich results', 'Structured data'],
  status: 'available',
  shareable: true,
  produces: ['json'],
  load: () => import('./JsonLdGeneratorPage'),
  docs: () => import('./docs'),
};

export default jsonLdGenerator;
