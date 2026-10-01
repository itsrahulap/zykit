import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose a **Mode**: **Password** for random characters or **Passphrase** for random words.',
    'For a password, set the **Length** and tick the **Characters** to use. Optionally turn on **Exclude look-alikes (0 O 1 l I |)** or **At least one of each chosen set**, and list any other characters under **Also exclude**.',
    'For a passphrase, set the number of **Words**, pick a **Separator**, and optionally turn on **Capitalise words** or **Add a number**.',
    'Set **How many** to generate, then read the strength, entropy and estimated time to crack. Click **Generate** for a fresh set.',
    'Copy one value with its copy button, or every value (one per line) with **Copy all**.',
  ],
  howItWorks:
    'Every random choice comes from the browser’s secure random generator, `crypto.getRandomValues`. To avoid modulo bias, random 32-bit values that fall in the incomplete top slice of the range are thrown away and drawn again (rejection sampling), so each character or word is equally likely.\n\n' +
    'A password picks each character independently from the pool of ticked sets, minus look-alikes and anything under **Also exclude**. With **At least one of each chosen set**, a password missing a set is discarded and redrawn, which keeps the result uniform over all valid passwords; only if 200 attempts fail is one character from each set placed and the rest shuffled in.\n\n' +
    'A passphrase picks each word independently from a built-in list of 2,494 short, common, lowercase English words. **Add a number** appends one random digit to one random word.\n\n' +
    'Entropy is `length × log2(pool size)` for passwords and `words × log2(2,494)` for passphrases, plus `log2(10 × words)` when a number is added. The time to crack is the average time to search half of that space at 100 billion guesses per second, roughly a GPU rig attacking a leaked, fast hash offline.',
  limits: [
    'Passwords are 8 to 128 characters; passphrases are 3 to 12 words; up to 50 can be generated at once.',
    'Symbols are limited to `!@#$%^&*()-_=+[]{};:,.<>/?~|`. Characters outside the four sets can’t be added.',
    'With **At least one of each chosen set**, the length must be at least the number of sets, and the shown entropy slightly overestimates the true value.',
    'Entropy assumes an attacker knows your settings and the word list. **Capitalise words** and the separator add no entropy, and the strength labels are rough guides.',
    'The word list is English only and can’t be replaced with your own.',
  ],
  privacy:
    'Passwords and passphrases are generated in your browser and never uploaded or stored; reloading the page clears them. This tool doesn’t create share links. Copied values stay in your clipboard until you replace them.',
  faqs: [
    {
      question: 'Is a passphrase as strong as a password?',
      answer:
        'It can be. Each word adds about 11.3 bits, so 5 words give about 56 bits and 8 words about 90. A 20-character password from all four sets gives about 130 bits. Compare the entropy shown for your settings.',
    },
    {
      question: 'What does “At least one of each chosen set” do?',
      answer:
        'It guarantees every ticked set appears, which many sites require. Passwords that miss a set are redrawn rather than patched, so no position is predictable.',
    },
    {
      question: 'Why does excluding look-alikes lower the entropy?',
      answer: 'It removes `0`, `O`, `1`, `l`, `I` and `|` from the pool, so each character has fewer possibilities. Add a character or two to the length to make up for it.',
    },
    {
      question: 'How is the time to crack worked out?',
      answer:
        'It assumes an attacker making 100 billion guesses per second, finding the password on average after trying half the possibilities. Slow password hashes such as bcrypt or Argon2 make real attacks far slower.',
    },
  ],
};

export default docs;
