import type { ToolDefinition } from '../types';

const jwtGenerator: ToolDefinition = {
  id: 'jwt-generator',
  name: 'JWT Generator',
  tagline: 'Create and sign test JSON Web Tokens',
  description:
    'Build a JWT from a header and claims and sign it with HMAC, RSA or ECDSA using a key you provide or generate locally.',
  category: 'Security',
  icon: 'key',
  tags: ['JWT', 'Sign', 'HS256', 'RS256'],
  status: 'available',
  produces: ['jwt'],
  load: () => import('./JwtGeneratorPage'),
};

export default jwtGenerator;
