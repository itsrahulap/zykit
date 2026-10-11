import type { ToolDefinition } from '../types';

const sipCalculator: ToolDefinition = {
  id: 'sip-calculator',
  name: 'SIP & Compound Interest Calculator',
  tagline: 'See how investments grow over time',
  description:
    'Calculate SIP returns, lump-sum compound growth and step-up SIPs, with a year-by-year table and chart.',
  category: 'Calculators',
  icon: 'chart',
  tags: ['SIP', 'Compound interest', 'Investment'],
  status: 'available',
  load: () => import('./SipCalculatorPage'),
  docs: () => import('./docs'),
};

export default sipCalculator;
