import type { ToolDefinition } from '../types';

const urlCleaner: ToolDefinition = {
  id: 'url-cleaner',
  name: 'URL Cleaner',
  tagline: 'Strip tracking parameters from links',
  description:
    'Remove utm_*, fbclid, gclid and other tracking parameters from URLs, one or many at a time.',
  category: 'Web',
  icon: 'link',
  tags: ['Tracking', 'Privacy', 'URL'],
  status: 'available',
  accepts: ['url'],
  produces: ['url'],
  load: () => import('./UrlCleanerPage'),
  docs: () => import('./docs'),
};

export default urlCleaner;
