import type { ToolDefinition } from '../types';

const regexTester: ToolDefinition = {
  id: 'regex-tester',
  name: 'Regex Tester',
  tagline: 'Test regular expressions live',
  description: 'Write a JavaScript regex, see every match and capture group highlighted, try replacements and get flags explained.',
  category: 'Developer',
  icon: 'regex',
  tags: ['Regex', 'RegExp', 'Match', 'Replace'],
  status: 'available',
  load: () => import('./RegexTesterPage'),
};

export default regexTester;
