import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    "Paste a query, mutation, fragment or schema into **Input GraphQL**, drop a `.graphql` file on it, use **Open file**, or **Try an example**.",
    "**Format** pretty-prints with the **Indent** you choose (2 spaces, 4 spaces or tab). **Minify** removes everything that isn’t needed.",
    "If the input is invalid, the error shows its line and column with a caret, and **Jump to error in input** selects the spot.",
    "Copy the result, **Download** it or **Send to…** another tool.",
  ],
  howItWorks:
    "A lexer turns the text into tokens (names, numbers, strings, block strings, punctuators; commas and whitespace are insignificant) and a recursive-descent parser checks them against the GraphQL grammar for executable documents and schema definitions: operations, variables and defaults, aliases, arguments, fragments, inline fragments, directives, descriptions, type, interface, union, enum, input, scalar, schema and directive definitions, and `extend`. The printer then lays the document out again. Argument lists and unions that don’t fit in 80 columns are broken over several lines, and block-string descriptions are re-indented. Minify drops comments and commas and keeps a space only where two tokens would merge. Everything runs in your browser, with no GraphQL library.",
  limits: [
    "Input can be up to 5,000,000 characters (about 5 MB).",
    "Comments are kept before definitions, fields and members, and before a closing brace. Comments anywhere else (for example inside an argument list) are removed, and the page tells you how many.",
    "Syntax is checked, not meaning: unknown types, fields or fragments, and variables used where constants are required, aren’t reported.",
    "Minify keeps string and block-string contents exactly as written.",
  ],
  privacy:
    "Your GraphQL is formatted in your browser and never uploaded or stored. **Share** puts the input and options in the link’s `#` fragment, which browsers don’t send to servers; long inputs show *Too large to share*. Text sent here or from here with **Send to…** passes through this tab’s session storage and is removed as soon as the receiving tool reads it.",
  faqs: [
    { question: "Does it format schemas as well as queries?", answer: "Yes: type definitions, descriptions, directives definitions and `extend` are all supported, alone or mixed with operations." },
    { question: "Will formatting change what my query does?", answer: "No. Only whitespace, commas and the layout of descriptions change; names, values and strings are kept." },
    { question: "Why was a comment removed?", answer: "Comments are kept only where they sit before a definition, field or member. A notice shows how many couldn’t be placed." },
    { question: "How are errors reported?", answer: "With the message, line and column of the first problem, such as `Expected \"}\"` or an unterminated string." },
  ],
};

export default docs;
