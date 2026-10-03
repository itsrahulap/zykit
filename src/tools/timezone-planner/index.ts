import type { ToolDefinition } from '../types';

const timezonePlanner: ToolDefinition = {
  id: 'timezone-planner',
  name: 'Time Zone Meeting Planner',
  tagline: 'Find meeting times across time zones',
  description:
    'Compare cities side by side, see overlapping working hours and pick a meeting time that works for everyone, with DST handled.',
  category: 'Converters',
  icon: 'clock',
  tags: ['Time zone', 'Meeting', 'World clock'],
  status: 'available',
  produces: ['text'],
  shareable: true,
  load: () => import('./TimezonePlannerPage'),
  docs: () => import('./docs'),
};

export default timezonePlanner;
