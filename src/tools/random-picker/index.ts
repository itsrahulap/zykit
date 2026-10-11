import type { ToolDefinition } from '../types';

const randomPicker: ToolDefinition = {
  id: 'random-picker',
  name: 'Random Picker',
  tagline: 'Pick names, make teams, flip coins',
  description:
    'Pick random names, split a list into teams, shuffle, flip a coin or roll dice, using fair randomness.',
  category: 'Productivity',
  icon: 'dice',
  tags: ['Random', 'Picker', 'Teams', 'Dice'],
  status: 'available',
  shareable: true,
  load: () => import('./RandomPickerPage'),
  docs: () => import('./docs'),
};

export default randomPicker;
