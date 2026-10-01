import type { ToolDefinition } from '../types';

const timestampConverter: ToolDefinition = {
  id: 'timestamp-converter',
  name: 'Timestamp Converter',
  tagline: 'Unix time ↔ human dates',
  description: 'Convert Unix seconds or milliseconds to dates in any time zone and back, with ISO 8601, RFC 2822 and relative times.',
  category: 'Developer',
  icon: 'clock',
  tags: ['Unix', 'Epoch', 'ISO 8601', 'Time zone'],
  status: 'available',
  shareable: true,
  load: () => import('./TimestampConverterPage'),
  docs: () => import('./docs'),
};

export default timestampConverter;
