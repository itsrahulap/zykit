import type { ToolDefinition } from '../types';

const httpHeaders: ToolDefinition = {
  id: 'http-headers',
  name: 'HTTP Headers Inspector',
  tagline: 'Paste response headers and get them explained',
  description:
    'Paste raw HTTP headers to see what each one does, check security and caching headers and spot common mistakes.',
  category: 'Network & HTTP',
  icon: 'server',
  tags: ['HTTP', 'Headers', 'Security', 'Cache'],
  status: 'available',
  accepts: ['headers'],
  load: () => import('./HttpHeadersPage'),
  docs: () => import('./docs'),
};

export default httpHeaders;
