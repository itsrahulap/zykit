import type { ToolDefinition } from '../types';

const invoiceGenerator: ToolDefinition = {
  id: 'invoice-generator',
  name: 'Invoice Generator',
  tagline: 'Create PDF invoices in your browser',
  description:
    'Fill in your business, client and line items to produce a clean PDF invoice with taxes and totals. Nothing is uploaded.',
  category: 'Documents',
  icon: 'file',
  tags: ['Invoice', 'PDF', 'Billing'],
  status: 'available',
  shareable: false,
  load: () => import('./InvoiceGeneratorPage'),
  docs: () => import('./docs'),
};

export default invoiceGenerator;
