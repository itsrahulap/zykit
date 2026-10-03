import type { ToolDefinition } from '../types';

const emailDnsRecords: ToolDefinition = {
  id: 'email-dns-records',
  name: 'SPF / DKIM / DMARC Checker',
  tagline: 'Validate and explain email DNS records',
  description:
    'Paste SPF, DKIM, DMARC, MTA-STS or BIMI TXT records to validate them, spot mistakes and see what each part means.',
  category: 'Network & HTTP',
  icon: 'shield',
  tags: ['SPF', 'DKIM', 'DMARC', 'DNS', 'Email'],
  status: 'available',
  accepts: ['text'],
  produces: ['text'],
  shareable: true,
  load: () => import('./EmailDnsRecordsPage'),
  docs: () => import('./docs'),
};

export default emailDnsRecords;
