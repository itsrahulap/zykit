import type { ToolDefinition } from '../types';

const textToSpeech: ToolDefinition = {
  id: 'text-to-speech',
  name: 'Text to Speech',
  tagline: 'Read text aloud with your browser\'s voices',
  description:
    'Have text read aloud using the voices built into your device, with speed, pitch and voice choice. The text stays in the page, but some voices are processed by your browser or OS vendor.',
  category: 'Text',
  icon: 'text',
  tags: ['TTS', 'Speech', 'Voice'],
  status: 'available',
  shareable: true,
  load: () => import('./TextToSpeechPage'),
  docs: () => import('./docs'),
};

export default textToSpeech;
