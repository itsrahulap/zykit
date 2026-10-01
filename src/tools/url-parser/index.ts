import type { ToolDefinition } from '../types';

const urlParser: ToolDefinition = {
  id: 'url-parser',
  name: 'URL Parser',
  tagline: 'Break a URL into its parts',
  description: 'Inspect protocol, host, path, query parameters and fragment, edit parameters and rebuild the URL.',
  category: 'Network & HTTP',
  icon: 'link',
  tags: ['URL', 'Query string', 'Params'],
  status: 'available',
  accepts: ['url'],
  shareable: true,
  load: () => import('./UrlParserPage'),
  docs: () => import('./docs'),
};

export default urlParser;
