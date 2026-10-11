import type { ToolDefinition } from '../types';

const ageCalculator: ToolDefinition = {
  id: 'age-calculator',
  name: 'Age Calculator',
  tagline: 'Exact age in years, months and days',
  description:
    'Find your exact age in years, months, days and more, the day you were born and how long until your next birthday.',
  category: 'Calculators',
  icon: 'clock',
  tags: ['Age', 'Birthday', 'Date'],
  status: 'available',
  load: () => import('./AgeCalculatorPage'),
  docs: () => import('./docs'),
};

export default ageCalculator;
