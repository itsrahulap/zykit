import type { ToolDefinition } from '../types';

const httpStatus: ToolDefinition = {
  id: 'http-status',
  name: 'HTTP Status Codes',
  tagline: 'Look up any HTTP status code',
  description:
    'Search every standard HTTP status code with a plain-language explanation of what it means and when to use it.',
  category: 'Network & HTTP',
  icon: 'info',
  tags: ['HTTP', '404', '500', 'REST'],
  status: 'available',
  shareable: true,
  load: () => import('./HttpStatusPage'),
  docs: () => import('./docs'),
};

export default httpStatus;
