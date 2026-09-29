import type { ToolDefinition } from '../types';

const passwordGenerator: ToolDefinition = {
  id: 'password-generator',
  name: 'Password Generator',
  tagline: 'Strong random passwords and passphrases',
  description:
    "Generate passwords or passphrases with the browser's secure random generator, and see how strong they are.",
  category: 'Security',
  icon: 'lock',
  tags: ['Password', 'Passphrase', 'Entropy'],
  status: 'available',
  load: () => import('./PasswordGeneratorPage'),
};

export default passwordGenerator;
