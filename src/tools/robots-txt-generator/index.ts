import type { ToolDefinition } from '../types';

const robotsTxtGenerator: ToolDefinition = {
  id: 'robots-txt-generator',
  name: 'Robots.txt Generator',
  tagline: 'Create and test a robots.txt file',
  description:
    'Build a robots.txt with rules per crawler, test whether a URL is allowed, and block AI crawlers if you want.',
  category: 'Web',
  icon: 'file',
  tags: ['robots.txt', 'SEO', 'Crawlers'],
  status: 'available',
  load: () => import('./RobotsTxtGeneratorPage'),
  docs: () => import('./docs'),
};

export default robotsTxtGenerator;
