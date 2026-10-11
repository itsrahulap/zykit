import type { ToolDefinition } from '../types';

const loanCalculator: ToolDefinition = {
  id: 'loan-calculator',
  name: 'Loan / EMI Calculator',
  tagline: 'Monthly payments, interest and schedule',
  description:
    'Calculate the monthly EMI, total interest and full repayment schedule for a loan, and see how prepayments save interest.',
  category: 'Calculators',
  icon: 'chart',
  tags: ['Loan', 'EMI', 'Mortgage', 'Interest'],
  status: 'available',
  shareable: true,
  load: () => import('./LoanCalculatorPage'),
  docs: () => import('./docs'),
};

export default loanCalculator;
