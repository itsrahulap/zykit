import type { ToolDefinition } from '../types';

const metaTagInspector: ToolDefinition = {
  id: 'meta-tag-inspector',
  name: 'Meta Tag Inspector',
  tagline: "Check a page's SEO and social tags",
  description:
    "Paste a page's HTML to review its title, description, canonical, Open Graph and Twitter tags, with preview cards.",
  category: 'Web',
  icon: 'search',
  tags: ['SEO', 'Open Graph', 'Meta tags'],
  status: 'available',
  load: () => import('./MetaTagInspectorPage'),
};

export default metaTagInspector;
