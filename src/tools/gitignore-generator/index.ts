import type { ToolDefinition } from '../types';

const gitignoreGenerator: ToolDefinition = {
  id: 'gitignore-generator',
  name: '.gitignore Generator',
  tagline: 'Build a .gitignore from presets',
  description:
    'Combine presets for languages, frameworks, editors and operating systems into one clean .gitignore, and test paths against it.',
  category: 'DevOps & Config',
  icon: 'file',
  tags: ['gitignore', 'Git'],
  status: 'available',
  accepts: ['text'],
  produces: ['text'],
  shareable: true,
  load: () => import('./GitignoreGeneratorPage'),
  docs: () => import('./docs'),
};

export default gitignoreGenerator;
