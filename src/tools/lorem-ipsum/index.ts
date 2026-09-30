import type { ToolDefinition } from '../types';

const loremIpsum: ToolDefinition = {
  id: 'lorem-ipsum',
  name: 'Lorem Ipsum Generator',
  tagline: 'Placeholder text in paragraphs, sentences or words',
  description:
    'Generate lorem ipsum or plain-English placeholder text by paragraphs, sentences or words, with HTML or Markdown output.',
  category: 'Text',
  icon: 'text',
  tags: ['Lorem ipsum', 'Placeholder', 'Dummy text'],
  status: 'available',
  produces: ['text'],
  shareable: true,
  load: () => import('./LoremIpsumPage'),
};

export default loremIpsum;
