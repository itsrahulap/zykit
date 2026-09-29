import type { ToolDefinition } from '../types';

const uuidGenerator: ToolDefinition = {
  id: 'uuid-generator',
  name: 'UUID Generator',
  tagline: 'Generate UUID v4 and v7 in bulk',
  description: 'Create random (v4) or time-ordered (v7) UUIDs, one or thousands at a time, and validate or inspect any UUID.',
  category: 'Developer',
  icon: 'dice',
  tags: ['UUID', 'v4', 'v7', 'GUID'],
  status: 'available',
  load: () => import('./UuidGeneratorPage'),
};

export default uuidGenerator;
