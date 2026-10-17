import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type or paste text (up to 30,000 characters).',
    'Pick a **Voice**. Voices are grouped by language, and each is marked “on this device” or “online”. Leave it on **Browser default** if unsure.',
    'Adjust **Rate**, **Pitch** and **Volume**, then press **Play**.',
    'Use **Pause**, **Resume** and **Stop** as needed. The word being spoken is highlighted when your browser reports word positions.',
  ],
  howItWorks:
    'The tool uses the browser’s Web Speech API (`speechSynthesis`). Your text is split into sentence-sized chunks of at most 200 characters. Each chunk is queued as a `SpeechSynthesisUtterance` with the chosen voice, rate, pitch and volume. Splitting keeps long text working in browsers that stop long utterances after a while, and lets Stop and Pause react quickly.\n\n' +
    'The voice list comes from `getVoices()` and refreshes when the browser fires `voiceschanged`. Word highlighting uses the utterance’s `boundary` events, which only some browser and voice combinations send. This site synthesises no speech itself: the voices belong to your browser or operating system.',
  limits: [
    'Which voices exist, and how good they sound, depends on your browser and operating system. Some browsers list none until a voice is installed.',
    'Word highlighting needs boundary events. Many online voices, and some browsers, do not send them, so no word is highlighted; speech still works.',
    'Rate, pitch and volume changes apply from the next chunk, not mid-sentence. Pause and Resume are unreliable in a few browsers.',
    'You cannot save the speech as an audio file: the Web Speech API does not expose the audio.',
    'Text is limited to 30,000 characters.',
  ],
  privacy:
    'This site never sends your text anywhere and stores nothing. But your browser or operating system produces the speech, and “online” (not local) voices may send the text to the vendor’s speech service, such as Google, Microsoft or Apple. Voices marked “on this device” run locally, so choose one if the text is sensitive. **Copy share link** puts the text in the link’s `#` fragment, which browsers don’t send to servers, but anyone with the link can read it.',
  faqs: [
    {
      question: 'Why is the voice list empty?',
      answer: 'Some browsers load voices a moment after the page opens, and some systems have none installed. The list updates by itself when voices appear. Installing a system voice or trying another browser usually helps.',
    },
    {
      question: 'What does “online” mean next to a voice?',
      answer: 'The browser reports the voice as not local (`localService` is false), so audio may be generated on the vendor’s servers and the text sent there. This tool cannot see where it is processed.',
    },
    {
      question: 'Why is no word highlighted?',
      answer: 'Highlighting relies on word boundary events that not every browser or voice provides. Try an on-device voice or another browser.',
    },
    {
      question: 'Can I download the audio?',
      answer: 'No. The Web Speech API only plays sound and does not give access to the audio data.',
    },
  ],
};

export default docs;
