import type { ToolDefinition } from '../types';

const cspBuilder: ToolDefinition = {
  id: 'csp-builder',
  name: 'CSP Builder',
  tagline: 'Build and check a Content-Security-Policy',
  description:
    'Build a Content-Security-Policy header directive by directive, get warnings for risky settings, and copy it for your server or meta tag.',
  category: 'Security',
  icon: 'shield',
  tags: ['CSP', 'Security headers', 'XSS'],
  status: 'available',
  accepts: ['text'],
  produces: ['text'],
  shareable: true,
  load: () => import('./CspBuilderPage'),
  docs: () => import('./docs'),
};

export default cspBuilder;
