// User docs for Code Complexity Analyzer, shown under the tool and in its SEO page. Write them from the code:
// real limits, formats and privacy behaviour only. tests/tools/docs.test.ts rejects any TODO left here.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste JavaScript or TypeScript into Code, drop a file on it, or use Open file (.js, .jsx, .ts, .tsx and their .mjs/.cjs/.mts/.cts variants pick the language automatically).',
    'Choose the Language if needed: TypeScript + JSX (the default) also reads plain JavaScript, but old-style <Type>value casts need plain TypeScript.',
    'Set the thresholds (Complexity above, Nesting above, Lines above; defaults 10, 4 and 50). Functions over any of them are flagged in red with the metric named.',
    'Read the Top 10 list, then pick a function name to see its source with every decision point that added to its complexity marked.',
    'Use the All functions table to review every function in source order.',
  ],
  howItWorks:
    'The code is parsed by the TypeScript compiler (createSourceFile, the same parser the TypeScript language service uses) inside a Web Worker; the compiler is downloaded once from this site when you first analyze something. The analyzer walks the syntax tree and measures every function, method, getter, setter, constructor, arrow function and class property arrow on its own: nested functions get their own row and add nothing to the enclosing one. Cyclomatic complexity is 1 plus one for each if, ?: ternary, case (default is not counted), for, for…in, for…of, while, do…while, catch, &&, ||, ?? and the logical assignments &&=, ||= and ??=. else, try, finally and optional chaining (?.) are not counted. Nesting depth follows ESLint\'s max-depth rule: if, loops, switch and try each add a level, and an else if stays at its parent\'s level. Lines run from the signature to the closing brace. Comments and strings are never counted because only syntax nodes are inspected.',
  limits: [
    'Up to 500,000 characters of code. Parsing stops after 5 seconds, and loading the parser on first use is given 30 seconds.',
    'The first analysis downloads the TypeScript parser (about 1 MB compressed) from this site; later runs reuse it.',
    'Top-level code outside functions is not measured. Class static blocks and field initializers that aren\'t functions belong to no function.',
    'Up to 50 syntax errors are listed with line:column. The parser recovers and still measures what it could read, so numbers for broken code are approximate.',
    'These are structural counts, not a verdict: a high number points at code worth reading, and a low one doesn\'t prove the code is good.',
  ],
  privacy:
    'Your code is parsed in a Web Worker in your browser and never leaves the device. The only network request is the one-time download of the parser script from this site; nothing is stored.',
  faqs: [
    {
      question: 'How is cyclomatic complexity counted here?',
      answer:
        'It starts at 1 for each function and adds 1 for every if, ternary ?:, non-default case, loop (for, for…in, for…of, while, do…while), catch, &&, ||, ?? and logical assignment (&&=, ||=, ??=). else, default, try, finally and optional chaining are not counted. Other tools differ on details such as counting && or default, so numbers may not match exactly.',
    },
    {
      question: 'Why isn\'t the code inside a callback added to the outer function?',
      answer:
        'Each function is a separate unit you can read and refactor on its own, so nested functions and arrow callbacks get their own row. The outer function only counts its own branches.',
    },
    {
      question: 'Is this a code quality score?',
      answer:
        'No. It reports three structural measurements per function: complexity, nesting depth and length. They help find code that is hard to test or follow, but they say nothing about correctness, naming or design.',
    },
    {
      question: 'What happens with a syntax error?',
      answer:
        'The errors are listed with line and column, and the parser recovers to keep going, so functions it could read are still measured. Fix the errors for exact numbers.',
    },
  ],
};

export default docs;
