import type { ToolDefinition } from '../types';

const wordCounter: ToolDefinition = {
  id: 'word-counter',
  name: 'Word Counter',
  tagline: 'Count words, characters and reading time',
  description:
    'Count words, characters, sentences, paragraphs and lines, with reading time and the most frequent words.',
  category: 'Text',
  icon: 'text',
  tags: ['Words', 'Characters', 'Reading time'],
  status: 'available',
  load: () => import('./WordCounterPage'),
};

export default wordCounter;
