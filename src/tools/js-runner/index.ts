import type { ToolDefinition } from '../types';

const jsRunner: ToolDefinition = {
  id: 'js-runner',
  name: 'JS Runner',
  tagline: 'Run JavaScript and TypeScript in your browser',
  description:
    'Write or paste code and run it in an isolated worker with console output, a time limit and no network access.',
  category: 'Code',
  icon: 'code',
  tags: ['JavaScript', 'TypeScript', 'Console', 'Playground'],
  status: 'available',
  accepts: ['code'],
  load: () => import('./JsRunnerPage'),
  docs: () => import('./docs'),
};

export default jsRunner;
