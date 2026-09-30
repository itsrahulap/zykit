import type { ToolDefinition } from '../types';

const dateCalculator: ToolDefinition = {
  id: 'date-calculator',
  name: 'Date Calculator',
  tagline: 'Date differences, business days and durations',
  description:
    'Find the time between two dates, add or subtract durations, and count business days with optional holidays.',
  category: 'Developer',
  icon: 'clock',
  tags: ['Date', 'Duration', 'Business days'],
  status: 'available',
  shareable: true,
  load: () => import('./DateCalculatorPage'),
};

export default dateCalculator;
