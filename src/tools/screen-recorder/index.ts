import type { ToolDefinition } from '../types';

const screenRecorder: ToolDefinition = {
  id: 'screen-recorder',
  name: 'Screen Recorder',
  tagline: 'Record your screen, a window or a tab',
  description:
    'Record your screen, an app window or a browser tab to a WebM video, with optional tab or system audio. The video never leaves your device.',
  category: 'Media',
  icon: 'play',
  tags: ['Screen recording', 'WebM', 'Capture'],
  status: 'available',
  load: () => import('./ScreenRecorderPage'),
  docs: () => import('./docs'),
};

export default screenRecorder;
