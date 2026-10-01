import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste the reference file (for example `.env.example`) into **File A** and the file to check (for example `.env`) into **File B**. You can also use **Open file A** / **Open file B**, drop a file on either box, or press **Try an example**.',
    'Read the problems listed under each file: syntax errors, unclosed quotes, unquoted values with `#` or spaces, and keys set more than once.',
    'In the differences table, use **Show** to filter to **Missing** (in A but not B), **Extra** (only in B), **Changed** or **Same** keys. Values are masked; press **Reveal** on a row to see them and **Hide all** to mask them again.',
    'Check the **Looks secret** badges, which flag values that appear to be passwords, tokens or keys.',
    'Under **Generate .env.example from**, pick **File A** or **File B** to get the same file with every value removed, then copy or download it.',
  ],
  howItWorks:
    'Each file is parsed with dotenv’s rules. Blank lines and lines starting with `#` are skipped, an optional `export ` prefix is accepted, and each line is `KEY=value` (or `KEY: value`). Keys start with a letter or `_` and may contain letters, digits, `_`, `.` and `-`. Double-, single- and backtick-quoted values may span several lines. In double quotes `\\n`, `\\r`, `\\t`, `\\"`, `\\\\` and `\\$` are unescaped; single-quoted values are taken literally. In an unquoted value everything from `#` on is a comment and surrounding spaces are trimmed. When a key appears more than once, the last value wins, as in dotenv.\n\n' +
    'The comparison uses each file’s final parsed values, so `A="x"` and `A=x` count as the same. `${VAR}` and `$VAR` references are listed, not expanded. A key is flagged as secret-looking when its name contains words such as SECRET, TOKEN, PASSWORD, API_KEY or PRIVATE, when its value matches a known token format (Stripe, GitHub, Slack, AWS, Google, GitLab, npm, JWTs, PEM private keys), when it is a URL with a password, or when it is a long, random-looking string.',
  limits: [
    'Variable references are never expanded, and there is no support for dotenv-expand defaults or command substitution.',
    'Lines that aren’t valid assignments (no `=`, invalid key names, quotes that are never closed) are reported and left out of the comparison and the generated `.env.example`.',
    'Secret detection is a heuristic based on names, known token prefixes and randomness. It can miss secrets and flag harmless values.',
    'Masked values show between 4 and 12 dots, so a masked value still gives a rough idea of its length.',
    'Opened or dropped files must be text and at most 10 MB.',
  ],
  privacy:
    'Both files are parsed and compared entirely in your browser; nothing is uploaded or saved, and the site’s Content Security Policy blocks requests to other servers. Values stay masked on screen until you reveal them. This tool has no share links, so your files never end up in a URL. Only the generated `.env.example`, which contains keys and comments but no values, can be copied, downloaded or passed on with **Send to…**, which hands it over through this tab’s session storage and removes it as soon as the other tool reads it.',
  faqs: [
    {
      question: 'Is it safe to paste a real .env file here?',
      answer:
        'The files are processed only in your browser and never sent anywhere or stored, and values stay masked unless you reveal them. As with any secret, avoid revealing values while sharing your screen.',
    },
    {
      question: 'Which file should be A and which B?',
      answer:
        'Put the reference in **File A**, usually `.env.example`, and the file you are checking in **File B**. **Missing** then means a key your app expects but B doesn’t set, and **Extra** means a key only B has.',
    },
    {
      question: 'Why is part of my value missing?',
      answer:
        'In an unquoted value, dotenv treats everything from `#` on as a comment. The tool warns when a `#` touches the value, as in `abc#123`. Wrap the value in quotes to keep the `#`.',
    },
    {
      question: 'What happens when a key is defined twice?',
      answer:
        'The last assignment wins, as in dotenv. The tool lists every duplicate with its line numbers, and the comparison uses the final value.',
    },
    {
      question: 'Are ${VAR} references resolved?',
      answer:
        'No. They are listed under the value as references, but the text is compared as written. Two files that reference the same variable compare as the same even if it would expand differently.',
    },
    {
      question: 'How is the .env.example generated?',
      answer:
        'Every valid assignment becomes `KEY=` with its value removed, keeping `export`, comments and blank lines. Multiline values collapse to a single `KEY=` line, a key set twice appears twice, and lines that couldn’t be parsed are dropped.',
    },
  ],
};

export default docs;
