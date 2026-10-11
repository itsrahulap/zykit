import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Mode**. For **Pick winners**, **Shuffle** and **Teams**, type or paste names, one per line.',
    'Optionally tick **Remove duplicates** to ignore repeated names (case does not matter), or **Weights** and write `Ana*3` to make Ana three times as likely to be picked.',
    'Set how many winners, or split into a number of teams or teams of a given size, then press the button at the top (**Pick**, **Shuffle** or **Make teams**).',
    'In **Coin** mode, **Flip** keeps a history with heads and tails counts and streaks. In **Dice** mode, enter notation like `d20`, `3d6` or `2d6+3`. In **Number** mode, set a minimum and maximum (both included).',
    'Use **Copy result** to copy the result as text.',
  ],
  howItWorks:
    'Randomness comes from `crypto.getRandomValues`, the browser’s secure random generator, turned into whole numbers with rejection sampling so every outcome is exactly equally likely (no modulo bias). Winners are drawn one at a time without putting anyone back; with weights, each draw is proportional to the weights of the names still left. Shuffle is a Fisher–Yates shuffle. Teams are made by shuffling and then dealing names out one by one to each team in turn, so team sizes never differ by more than one; with “team size S” the number of teams is the list length divided by S, rounded up. The coin is a fair 50/50 draw, and streaks are counted over the flips since you opened or cleared the history. Dice notation is `NdM` with an optional `+K` or `-K`: N dice with M sides are rolled and added together with the modifier. The brief spin animation is only decoration, runs after the result is already chosen, and is skipped when your system asks for reduced motion.',
  limits: [
    'Up to 10,000 names; extra lines are ignored. Blank lines are skipped and names are trimmed.',
    'Weights must be a number above 0 up to 1000 and are only read when **Weights** is ticked; otherwise `*3` stays part of the name.',
    'Dice: 1 to 100 dice, 2 to 1000 sides, modifier up to 10,000. Only a single `NdM±K` expression is supported, not things like `2d6+1d4` or keep-highest.',
    'Number mode gives whole numbers between -1,000,000,000 and 1,000,000,000, both ends included.',
    'Results and the coin history live in the page only. They are lost on reload and are never included in a share link.',
  ],
  privacy:
    'Everything runs in your browser and nothing is stored. **Copy share link** puts only your list of names in the link’s `#` fragment, which browsers do not send to servers; results, weights settings and history are not included. Anyone you give the link to can read the names, so avoid sharing lists with private data.',
  faqs: [
    {
      question: 'Is it really random and fair?',
      answer: 'Yes. It uses your browser’s cryptographic random generator and removes modulo bias, so each name, coin side or die face is equally likely unless you set weights.',
    },
    {
      question: 'Can the same name win twice?',
      answer: 'No. Winners in one draw are all different. If the same name appears on two lines it counts as two entries, so tick **Remove duplicates** to avoid that.',
    },
    {
      question: 'How do weights work?',
      answer: 'Write `name*3` and that name gets three times the chance of a name with no weight. Decimals work, so `name*0.5` is half as likely.',
    },
    {
      question: 'Are the teams always the same size?',
      answer: 'They differ by at most one person. Splitting 11 people into 4 teams gives teams of 3, 3, 3 and 2.',
    },
    {
      question: 'What does 2d6+3 mean?',
      answer: 'Roll two six-sided dice, add them up, and add 3. The result shows each die and the total.',
    },
  ],
};

export default docs;
