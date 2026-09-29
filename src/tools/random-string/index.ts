import type { ToolDefinition } from '../types';

const randomString: ToolDefinition = {
  id: 'random-string',
  name: 'Random String Generator',
  tagline: 'Random tokens, IDs and keys',
  description:
    'Generate random strings from any character set: hex, Base64, alphanumeric or your own, in any length and quantity.',
  category: 'Security',
  icon: 'dice',
  tags: ['Random', 'Token', 'Hex', 'API key'],
  status: 'available',
  load: () => import('./RandomStringPage'),
};

export default randomString;
