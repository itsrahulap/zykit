import type { ToolDefinition } from '../types';

const percentageCalculator: ToolDefinition = {
  id: 'percentage-calculator',
  name: 'Percentage Calculator',
  tagline: 'Percent of, change, discounts and tax',
  description:
    'Work out percentages, percentage change, discounts, margins and markups, and add or remove GST/VAT.',
  category: 'Calculators',
  icon: 'hash',
  tags: ['Percentage', 'Discount', 'GST', 'VAT'],
  status: 'available',
  shareable: true,
  load: () => import('./PercentageCalculatorPage'),
  docs: () => import('./docs'),
};

export default percentageCalculator;
