import type { ToolDefinition } from '../types';

const passwordStrengthChecker: ToolDefinition = {
  id: 'password-strength-checker',
  name: 'Password Strength Checker',
  tagline: 'How long would your password take to crack?',
  description:
    'Estimate a password\'s strength and crack time, and spot weak patterns like dictionary words, dates and keyboard runs, without it leaving your browser.',
  category: 'Security',
  icon: 'lock',
  tags: ['Password', 'Strength', 'Entropy'],
  status: 'available',
  shareable: false,
  load: () => import('./PasswordStrengthCheckerPage'),
  docs: () => import('./docs'),
};

export default passwordStrengthChecker;
