import type { ToolDefinition } from '../types';

const emailHeaderAnalyzer: ToolDefinition = {
  id: 'email-header-analyzer',
  name: 'Email Header Analyzer',
  tagline: 'Trace an email\'s path and check SPF, DKIM and DMARC',
  description:
    'Paste raw email headers to see every hop and delay, the SPF, DKIM and DMARC results, and warning signs of spoofing.',
  category: 'Security',
  icon: 'search',
  tags: ['Email', 'SPF', 'DKIM', 'DMARC', 'Phishing'],
  status: 'available',
  accepts: ['text'],
  shareable: false,
  load: () => import('./EmailHeaderAnalyzerPage'),
  docs: () => import('./docs'),
};

export default emailHeaderAnalyzer;
