import type { ToolDefinition } from '../types';

const textToSpeech: ToolDefinition = {
  id: 'text-to-speech',
  name: 'Text to Speech',
  tagline: 'Read text aloud with your browser\'s voices',
  description:
    'Read text aloud with your device’s built-in voices and choose voice, speed and pitch. Online voices may send text to your browser or OS vendor.',
  category: 'Text',
  icon: 'text',
  tags: ['TTS', 'Speech', 'Voice'],
  status: 'available',
  shareable: true,
  load: () => import('./TextToSpeechPage'),
  docs: () => import('./docs'),
};

export default textToSpeech;
