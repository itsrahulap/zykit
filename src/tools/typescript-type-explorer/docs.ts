// User docs for TypeScript Type Explorer, shown under the tool and in its SEO page. Write them from the code:
// real limits, formats and privacy behaviour only. tests/tools/docs.test.ts rejects any TODO left here.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a topic from the Example menu, such as keyof, Conditional types & infer or Mapped types, and read its explanation.',
    'Wait for "Loading the TypeScript compiler…" to finish the first time; later checks take milliseconds.',
    'Read Resolved types: every top-level type alias, variable and function with the type the compiler gives it. The names under "Look at" are highlighted.',
    'Edit the TypeScript code. Types and diagnostics update as you type, and errors show their line:column.',
    'Use Reset example to get the original code back, or the share button to copy a link with your code.',
  ],
  howItWorks:
    'The page starts a Web Worker that downloads the official TypeScript compiler (the same typescript package the site is built with) and the es2015 standard library declarations. Your code becomes an in-memory file in a compiler Program with strict mode on; the worker collects its syntax and semantic diagnostics and asks the type checker to print the type of each top-level type alias (expanded one level, the way the editor hover does), variable and function. The code is only type-checked: it is never emitted or run. A check that takes over 20 seconds stops the worker and a new one starts on the next edit.',
  limits: [
    'Code is capped at 20,000 characters.',
    'One file only: imports of other modules report "Cannot find module", and only the es2015 library (no DOM, no Node types) is available.',
    'Compiler options are fixed: strict mode, target ES2022; there is no tsconfig to change.',
    'The compiler download is about 1 MB compressed, fetched from this site once and then cached by the browser.',
    'Only top-level declarations are listed; interfaces and classes appear by name inside other types.',
  ],
  privacy:
    'Your code is type-checked inside your browser by a Web Worker and is never uploaded; the compiler itself is served from this site, not a third party. Nothing is stored. A share link puts the example and code in the URL # fragment, which browsers do not send to the server.',
  faqs: [
    {
      question: 'Is this the real TypeScript compiler or an imitation?',
      answer: 'It is the real compiler: the official typescript package, whose version is shown next to the Example menu, running in your browser. Diagnostics and types are exactly what it reports.',
    },
    {
      question: 'Why does a type show as its expanded shape instead of Partial<User>?',
      answer: 'Type aliases are printed one level expanded, like the editor hover, so you see the properties a utility type produces rather than the name you wrote.',
    },
    {
      question: 'Does my code run?',
      answer: 'No. The compiler only parses and type-checks it. Nothing is emitted or executed, so console.log or side effects never happen.',
    },
    {
      question: 'Why is the first check slow?',
      answer: 'The compiler is a few megabytes of JavaScript that loads only when you open this tool. After it loads, each check of an example takes a few milliseconds.',
    },
  ],
};

export default docs;
