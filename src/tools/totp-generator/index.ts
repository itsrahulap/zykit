import type { ToolDefinition } from '../types';

const totpGenerator: ToolDefinition = {
  id: 'totp-generator',
  name: 'TOTP Generator',
  tagline: 'Generate and verify 2FA codes',
  description:
    'Generate time-based one-time passwords (TOTP/HOTP) from a secret or otpauth:// URI to test two-factor authentication.',
  category: 'Security',
  icon: 'key',
  tags: ['TOTP', '2FA', 'OTP', 'Authenticator'],
  status: 'available',
  shareable: false,
  load: () => import('./TotpGeneratorPage'),
};

export default totpGenerator;
