import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose **Generate**, type a password and pick a cost (4 to 15). Each step up doubles the work and the time.',
    'Press **Generate hash**. You get a 60-character hash plus its parts: version, cost, salt and hash.',
    'To check a password, switch to **Verify**, enter the password and paste an existing `$2a$`, `$2b$` or `$2y$` hash.',
    'Copy the hash. A new random salt is used on every run, so the same password gives a different hash each time.',
  ],
  howItWorks:
    'The page uses its own bcrypt (EksBlowfishSetup) implementation. The Blowfish tables come from the digits of pi. The key schedule runs 2^cost times with your password and the salt, then the text `OrpheanBeholderScryDoubt` is encrypted 64 times. The result is written in bcrypt’s own Base64 alphabet.\n\n' +
    'The work runs in a Web Worker so the page stays responsive. The 16-byte salt comes from `crypto.getRandomValues`. Verifying re-hashes with the salt and cost stored in the hash and compares in constant time. Time estimates come from a quick cost-4 run on your device, doubled per step.',
  limits: [
    'bcrypt reads only the first 72 bytes of the password, counting a trailing NUL byte, so at most 71 bytes of UTF-8 are used. Longer input is silently cut off; the page warns you.',
    'Cost is limited to 4–15. Cost 14 and 15 can take many seconds to minutes in a browser.',
    '`$2a$`, `$2b$` and `$2y$` are produced and accepted. They give identical hashes; only the prefix differs. `$2x$` (the old buggy PHP variant) is not supported.',
    'This is JavaScript, far slower than native bcrypt. Use it for testing and tooling, not as a production password service.',
  ],
  privacy:
    'Everything happens in your browser. Passwords and hashes are never uploaded and are not stored in the page, the URL or browser storage. Closing the tab forgets them.',
  faqs: [
    {
      question: 'Which cost should I pick?',
      answer: 'Pick the highest cost your servers can bear, aiming for roughly 250 ms to 1 s per hash. 10 to 12 is common today. Re-hash when hardware gets faster.',
    },
    {
      question: 'Why is the hash different every time?',
      answer: 'A random salt is generated per hash and stored inside it. Use **Verify** to check a password; comparing hash strings directly won’t work.',
    },
    {
      question: 'What are $2a$, $2b$ and $2y$?',
      answer: 'Version markers. `$2b$` is the current OpenBSD form; `$2y$` is PHP’s equivalent; `$2a$` is the older form. For passwords under 255 bytes they produce the same hash body.',
    },
    {
      question: 'Is it safe to type a real password here?',
      answer: 'Nothing leaves the page, but avoid pasting real production passwords into any website out of habit. This tool is best for test values.',
    },
  ],
};

export default docs;
