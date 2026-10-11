import type { ToolDefinition } from '../types';

const morseCode: ToolDefinition = {
  id: 'morse-code',
  name: 'Morse Code Translator',
  tagline: 'Text ↔ Morse code, with sound',
  description:
    'Translate text to Morse code and back, play it as audio or light at your chosen speed, and learn the alphabet.',
  category: 'Text',
  icon: 'text',
  tags: ['Morse', 'Translator', 'Audio'],
  status: 'available',
  shareable: true,
  load: () => import('./MorseCodePage'),
  docs: () => import('./docs'),
};

export default morseCode;
