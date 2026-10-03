import type { ToolDefinition } from '../types';

const cssGenerator: ToolDefinition = {
  id: 'css-generator',
  name: 'CSS Generator',
  tagline: 'Gradients, shadows, clamp() and more',
  description:
    'Visually build CSS gradients, box and text shadows, border radius, clamp() fluid sizes and cubic-bezier easings, and copy the code.',
  category: 'Code',
  icon: 'code',
  tags: ['CSS', 'Gradient', 'Shadow', 'clamp', 'Easing', 'Tailwind'],
  status: 'available',
  shareable: true,
  produces: ['code'],
  load: () => import('./CssGeneratorPage'),
  docs: () => import('./docs'),
};

export default cssGenerator;
