import type { ToolDefinition } from '../types';

const mockDataGenerator: ToolDefinition = {
  id: 'mock-data-generator',
  name: 'Mock Data Generator',
  tagline: 'Generate realistic fake data',
  description:
    'Generate fake users, emails, addresses, companies and more as JSON, CSV or SQL for testing and prototypes.',
  category: 'Data',
  icon: 'dice',
  tags: ['Mock data', 'Fake', 'Test data'],
  status: 'available',
  load: () => import('./MockDataGeneratorPage'),
};

export default mockDataGenerator;
