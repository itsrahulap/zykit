import type { ToolDefinition } from '../types';

const userAgentParser: ToolDefinition = {
  id: 'user-agent-parser',
  name: 'User-Agent Parser',
  tagline: 'Identify browser, OS and device from a user agent',
  description:
    'Parse a User-Agent string into browser, engine, operating system and device, including bots and crawlers.',
  category: 'Network & HTTP',
  icon: 'globe',
  tags: ['User-Agent', 'Browser', 'Bot'],
  status: 'available',
  load: () => import('./UserAgentParserPage'),
  docs: () => import('./docs'),
};

export default userAgentParser;
