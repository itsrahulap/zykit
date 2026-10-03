import type { ToolDefinition } from '../types';

const sshKeyGenerator: ToolDefinition = {
  id: 'ssh-key-generator',
  name: 'SSH Key Generator',
  tagline: 'Generate Ed25519 and RSA SSH keys locally',
  description:
    'Create Ed25519, ECDSA or RSA key pairs in OpenSSH format in your browser, with fingerprints and an authorized_keys line.',
  category: 'Security',
  icon: 'key',
  tags: ['SSH', 'Ed25519', 'RSA', 'OpenSSH'],
  status: 'available',
  // Only the public key line goes to "Send to…"; private keys are never handed off.
  produces: ['text'],
  shareable: false,
  load: () => import('./SshKeyGeneratorPage'),
  docs: () => import('./docs'),
};

export default sshKeyGenerator;
