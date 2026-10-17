import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type text in the **Text** box to see International Morse in the **Morse** box, or paste dots and dashes into the Morse box to decode them.',
    'Choose how words are separated: three spaces, or a slash (`/`). Letters are always separated by one space.',
    'Set the speed (5–40 WPM), an optional slower Farnsworth overall speed, and the tone pitch, then press **Play**. Press **Stop** at any time.',
    'Tick **Flash the light** to see a lamp light up with each tone. Use the reference table for letters, digits, punctuation and prosigns.',
  ],
  howItWorks:
    'Text is upper-cased, accents are stripped (é becomes E), and each character is looked up in the ITU International Morse table: A–Z, 0–9 and common punctuation. Type prosigns in angle brackets, such as `<SOS>`, `<AR>` or `<SK>`; each is sent as one unbroken character.\n\n' +
    'Decoding is tolerant. Dots and dashes written as `·`, `•`, `–` or `—` are accepted, and words may be separated by `/`, `|`, a new line or three or more spaces. A group that isn’t valid Morse shows as �.\n\n' +
    'Playback uses the Web Audio API: one sine oscillator, scheduled ahead with short fades to avoid clicks. Timing follows the PARIS standard: a dit lasts 1200 ÷ WPM milliseconds, a dah is three dits, and gaps are one, three and seven units. With Farnsworth spacing, characters keep their speed while letter and word gaps stretch to match the slower overall speed. Everything runs locally.',
  limits: [
    'Only International Morse is supported, with no Cyrillic, Arabic, Japanese or other national alphabets. Unsupported characters are skipped and listed.',
    'The shared patterns for `+` and `<AR>`, `=` and `<BT>`, and `(` and `<KN>` decode as the punctuation character.',
    'Playback is limited to 2000 Morse characters. Audio may need a click first, because browsers block sound until you interact with the page.',
    'The light flash runs on a timer, so it can drift a few milliseconds from the audio. It is off when your system asks to reduce motion; a static “Playing…” indicator shows instead.',
  ],
  privacy:
    'Translation and playback happen in your browser; nothing is sent to a server and no sound is recorded. **Copy share link** puts your text or Morse and the separator in the link’s `#` fragment, which browsers don’t send to servers.',
  faqs: [
    {
      question: 'What is Farnsworth timing?',
      answer: 'Letters are sent at full speed but with longer pauses between letters and words. This helps learners recognise each character as a sound while practising at a slow overall speed.',
    },
    {
      question: 'Why do I need three spaces between words?',
      answer: 'One space separates letters, so a longer gap is needed for words. You can switch to the slash separator, which is easier to read and survives copy and paste.',
    },
    {
      question: 'How do I send SOS as a single signal?',
      answer: 'Type `<SOS>`. It is sent as `...---...` with no gaps between the letters, unlike `S O S`.',
    },
    {
      question: 'Why does the speed say WPM?',
      answer: 'Words per minute is measured with the word PARIS, which is 50 timing units long. At 20 WPM a dit lasts 60 ms.',
    },
  ],
};

export default docs;
