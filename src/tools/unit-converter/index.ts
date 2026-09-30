import type { ToolDefinition } from '../types';

const unitConverter: ToolDefinition = {
  id: 'unit-converter',
  name: 'Unit Converter',
  tagline: 'Convert bytes, lengths, weights, temperatures and more',
  description:
    'Convert between units of data size (KB/KiB), length, mass, temperature, time, speed, area and more.',
  category: 'Developer',
  icon: 'swap',
  tags: ['Units', 'Bytes', 'Convert'],
  status: 'available',
  load: () => import('./UnitConverterPage'),
};

export default unitConverter;
