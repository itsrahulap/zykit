import type { ToolDefinition } from '../types';

const sitemapGenerator: ToolDefinition = {
  id: 'sitemap-generator',
  name: 'Sitemap Generator',
  tagline: 'Create an XML sitemap from a list of URLs',
  description:
    "Paste URLs to generate a valid sitemap.xml with lastmod, changefreq and priority, split into files when it's large.",
  category: 'Web',
  icon: 'layers',
  tags: ['Sitemap', 'XML', 'SEO'],
  status: 'available',
  load: () => import('./SitemapGeneratorPage'),
  docs: () => import('./docs'),
};

export default sitemapGenerator;
