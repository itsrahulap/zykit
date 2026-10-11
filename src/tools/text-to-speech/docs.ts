// User docs for Text to Speech, shown under the tool and in its SEO page. Write them from the code:
// real limits, formats and privacy behaviour only. tests/tools/docs.test.ts rejects any TODO left here.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: ['TODO: first step', 'TODO: second step', 'TODO: third step'],
  howItWorks: 'TODO: what actually happens when Text to Speech runs: the algorithm, standard or browser API, and where it runs.',
  limits: ['TODO: real input limits, unsupported formats and edge cases'],
  privacy: 'TODO: where data is processed, and whether anything is stored or leaves the device.',
  faqs: [
    { question: 'TODO: first question?', answer: 'TODO' },
    { question: 'TODO: second question?', answer: 'TODO' },
    { question: 'TODO: third question?', answer: 'TODO' },
  ],
};

export default docs;
