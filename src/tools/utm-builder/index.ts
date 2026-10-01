import type { ToolDefinition } from '../types';

const utmBuilder: ToolDefinition = {
  id: 'utm-builder',
  name: 'UTM Builder',
  tagline: 'Build campaign URLs with UTM parameters',
  description:
    'Add utm_source, utm_medium, utm_campaign and more to a URL, with presets and consistent formatting.',
  category: 'Web',
  icon: 'link',
  tags: ['UTM', 'Campaign', 'Analytics'],
  status: 'available',
  produces: ['url'],
  load: () => import('./UtmBuilderPage'),
  docs: () => import('./docs'),
};

export default utmBuilder;
