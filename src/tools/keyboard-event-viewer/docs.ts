import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Click the dashed box (or Tab to it) and press any key. The big display shows the key and its physical code.',
    'Read the full details of the latest event, and scan the history table: every keydown and keyup, newest first, up to 50.',
    'Turn on **Capture keys anywhere on the page** to log keys without focusing the box. Turn on **preventDefault** to stop the browser acting on them (for example, scrolling on Space).',
    'Use **Copy JSON** or **Copy Markdown** to paste the history into a bug report, then **Clear**.',
  ],
  howItWorks:
    'The page listens for `keydown` and `keyup` events and reads `key`, `code`, the legacy `keyCode` and `which`, `location` (standard, left, right or numpad), the Ctrl, Shift, Alt and Meta flags, `repeat`, `isComposing` and `timeStamp`. `getModifierState` gives the Caps Lock and Num Lock state, which the plain modifier flags don’t include.\n\n' +
    '`key` is the value the layout produces and changes with Shift, Caps Lock and the keyboard layout; `code` is the physical key and doesn’t. Screen readers hear a polite announcement for each new keypress, but not for every auto-repeat of a held key.',
  limits: [
    'Only the last 50 events are kept.',
    'Browsers and operating systems reserve some shortcuts (Ctrl+W, Ctrl+T, Ctrl+N, Cmd+Q, Alt+F4, the Windows/Super key, media keys) and never send them to the page. `preventDefault` can’t change that.',
    'Tab is never blocked, so you can always leave the capture box.',
    'Input-method (IME) typing sends `isComposing` events and often `key: "Process"`. `keyCode` is `229` while composing.',
    '`keyCode` and `which` are deprecated and can differ between browsers and layouts; some keys report `0` or `Unidentified`. Caps Lock and Num Lock state may read `false` on some platforms.',
  ],
  privacy: 'Key events are read in your browser only. Nothing is uploaded, and the history is not saved anywhere; reloading the page clears it. Do not type passwords into the box if you will copy the history.',
  faqs: [
    {
      question: 'What is the difference between key and code?',
      answer: '`key` is what the key means on the current layout (`a`, `A`, `Enter`). `code` is where the key physically is (`KeyA`). On a French AZERTY keyboard the key labelled A reports `code: "KeyQ"`.',
    },
    {
      question: 'Why do I not see Ctrl+W or the Windows key?',
      answer: 'The browser or OS handles them first and never sends them to the page. No web page can capture them.',
    },
    {
      question: 'Why is keyCode crossed out in docs?',
      answer: 'It is deprecated. Use `key` for characters and `code` for physical keys. It is shown here so you can debug old code.',
    },
    {
      question: 'Why do held keys show many events?',
      answer: 'Holding a key repeats `keydown` with `repeat: true`. Those rows are logged but not announced to screen readers.',
    },
  ],
};

export default docs;
