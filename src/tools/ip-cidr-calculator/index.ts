import type { ToolDefinition } from '../types';

const ipCidrCalculator: ToolDefinition = {
  id: 'ip-cidr-calculator',
  name: 'IP / CIDR Calculator',
  tagline: 'Subnets, masks and IP ranges for IPv4 and IPv6',
  description:
    'Calculate network and broadcast addresses, masks, host ranges and counts for any CIDR, and check whether an IP is in a range.',
  category: 'Network & HTTP',
  icon: 'network',
  tags: ['IP', 'CIDR', 'Subnet', 'IPv6'],
  status: 'available',
  shareable: true,
  load: () => import('./IpCidrCalculatorPage'),
  docs: () => import('./docs'),
};

export default ipCidrCalculator;
