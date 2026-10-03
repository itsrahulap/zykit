import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type or paste a password into **Password to check**. It is masked; press **Show** to reveal it and see which parts were matched.',
    'Read the **score** (0 to 4), the **warning and suggestions**, and the **time to crack** under four attack scenarios.',
    'Optionally add **your own words** (names, pets, towns, dates) to see how much easier the password is for someone who knows you.',
    'Try a few variations. Adding another unrelated word usually helps far more than swapping letters for symbols.',
  ],
  howItWorks:
    'The estimator is modelled on zxcvbn. It looks for patterns in the password: entries in a list of common passwords, common English words and first names (also with capital letters, reversed, or l33t substitutions like `@` for `a`), keyboard walks on QWERTY, AZERTY and number-pad layouts, repeats like `abcabc`, sequences like `abc` or `9876`, recent years, and dates. It then finds the cheapest way to build the whole password from those patterns plus brute-forced leftovers, and multiplies out the number of guesses an attacker would need.\n\n' +
    'Guesses are converted to time at four rates: 100 per hour (a rate-limited login), 10 per second (an unthrottled login), 10,000 per second (offline attack on a slow hash such as bcrypt or Argon2) and 10 billion per second (offline attack on a fast hash such as MD5 on GPUs). The score is 0 below 1,000 guesses, 1 below a million, 2 below 100 million, 3 below 10 billion and 4 above that. Everything runs in your browser.',
  limits: [
    'Only the first 100 characters are analysed.',
    'The word lists are compact (about a thousand common passwords, a few thousand common words and about 1,300 first names), so unusual-but-known passwords and non-English words can be rated stronger than a real cracker would rate them. Use the estimate as a guide, not a guarantee.',
    'Word rank is the position in the list, which is only roughly by popularity for the general word list.',
    'Crack times assume the attacker knows how the password was built and make no allowance for faster hardware over time.',
  ],
  privacy:
    'The password is analysed in your browser and is never stored, logged or sent anywhere. The word lists are bundled with this site and loaded from it, with no third-party requests. The password is not part of "Copy share link" (sharing is off for this tool) and nothing is kept after you close the tab. Still, avoid typing a password you currently use.',
  faqs: [
    {
      question: 'Is it safe to type my real password here?',
      answer:
        'Nothing is sent or saved, and you can confirm that in your browser’s network tab. As a habit, though, it is wiser to test a similar password than one you use today.',
    },
    {
      question: 'Why is a long phrase of simple words rated strong?',
      answer:
        'Each extra unrelated word multiplies the guesses needed. Four random common words is roughly 2^44 possibilities, far more than a short password with symbols, and easier to remember.',
    },
    {
      question: 'Why does adding a "!" or swapping a for @ not help?',
      answer: 'Attackers try those predictable substitutions and endings early, so they add only a small factor to the guesses. Length and randomness matter much more.',
    },
    {
      question: 'What do the four crack-time scenarios mean?',
      answer:
        'Online throttled and unthrottled model guessing through a login form. Offline scenarios assume the attacker stole a database of hashes: slow hashes (bcrypt, scrypt, Argon2) resist well, fast hashes (MD5, SHA-1, unsalted SHA-256) do not.',
    },
  ],
};

export default docs;
