import type { ToolDefinition } from '../types';

const jwtDecoder: ToolDefinition = {
  id: 'jwt-decoder',
  name: 'JWT Decoder',
  tagline: 'Decode and verify JSON Web Tokens',
  description:
    "Read a JWT's header, payload and claims, check expiry, and verify HMAC, RSA or ECDSA signatures with your key.",
  category: 'Developer',
  icon: 'key',
  tags: ['JWT', 'JWS', 'HS256', 'RS256', 'ES256'],
  status: 'available',
  accepts: ['jwt'],
  load: () => import('./JwtDecoderPage'),
  docs: () => import('./docs'),
};

export default jwtDecoder;
