import type { ToolDefinition } from '../types';

const numberBaseConverter: ToolDefinition = {
  id: 'number-base-converter',
  name: 'Number Base Converter',
  tagline: 'Binary, octal, decimal, hex and float bits',
  description:
    'Convert numbers between bases, see two\'s complement and IEEE-754 float bits, and run bitwise operations.',
  category: 'Developer',
  icon: 'hash',
  tags: ['Binary', 'Hex', 'Bitwise', 'IEEE-754'],
  status: 'available',
  load: () => import('./NumberBaseConverterPage'),
};

export default numberBaseConverter;
