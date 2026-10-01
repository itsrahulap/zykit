import type { ToolDefinition } from '../types';

const chmodCalculator: ToolDefinition = {
  id: 'chmod-calculator',
  name: 'chmod Calculator',
  tagline: 'Unix permissions: rwx ↔ octal',
  description:
    'Convert Unix file permissions between symbolic (rwxr-xr-x) and octal (755), including setuid, setgid and sticky bits.',
  category: 'Developer',
  icon: 'lock',
  tags: ['chmod', 'Unix', 'Permissions'],
  status: 'available',
  shareable: true,
  load: () => import('./ChmodCalculatorPage'),
  docs: () => import('./docs'),
};

export default chmodCalculator;
