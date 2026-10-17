import type { Topic } from "../../types/content";

export const javascriptBeginnerTopics: Topic[] = [
  {
    id: "what-is-javascript",
    title: "What is JavaScript?",
    level: "beginner",
    description:
      "The programming language that makes websites interactive.",
    explanation: `
HTML and CSS give you a page of text and images. But on their own, nothing
on the page *reacts* to you when you click, type or scroll.

JavaScript adds that behavior. It's a programming language that runs in your
browser and lets a page respond to you: show a menu, check a form, update a
price, or load new content without reloading.

It also runs outside the browser: on servers (with Node.js), in mobile apps
and even on some hardware. But it's still best known as "the language of the
web."
    `.trim(),
    analogy:
      "If HTML is the skeleton of a page and CSS is its clothing, JavaScript is the muscles — it's what makes things actually move.",
    examples: [
      {
        title: "A tiny piece of JavaScript",
        code: `alert("Hello! This popped up because of JavaScript.");`,
        explanation:
          "Put this one line in a webpage and it shows a popup box. It's just an instruction the browser understands and runs.",
        walkthrough: [
          { code: "alert(...)", explanation: "Calls a built-in browser function that shows a small popup box." },
          { code: '"Hello! This popped up..."', explanation: "The text in quotes is what appears in the popup." },
          { code: ";", explanation: "The semicolon ends the instruction, like a period ends a sentence." },
        ],
      },
      {
        title: "Reacting to a click",
        code: `const button = document.querySelector("button");

button.addEventListener("click", () => {
  alert("You clicked the button!");
});`,
        explanation:
          "This is closer to everyday JavaScript: find a piece of the page, then tell it what to do when the user interacts with it.",
      },
    ],
    howItWorks: `
Every browser (Chrome, Firefox, Safari, Edge) has a built-in JavaScript
engine. When a page loads, the browser hands the page's JavaScript to this
engine, which runs it line by line.
    `.trim(),
    diagram: `
Browser loads page
       ↓
Finds JavaScript code
       ↓
Hands it to the JS engine
       ↓
Engine runs the instructions
       ↓
Page updates / responds
    `.trim(),
    whyItExists: `
Early websites were static: you could read them, but not interact with
them. JavaScript lets pages respond to the user right in the browser,
without asking a server and reloading the whole page for every small change.
    `.trim(),
    whenToUse: `
Use JavaScript for anything that runs in a browser and reacts to the user
right away: checking a form as someone types, updating a page without
reloading, or building a whole single-page app. It's also a good fit for
the server (via Node.js) if you want one language for client and server.
    `.trim(),
    whenNotToUse: `
For CPU-heavy work (video processing, machine learning, low-level system
code), languages built for raw speed like C++, Rust or Go usually fit
better. A purely informational page with no interactivity may need little
or no JavaScript.
    `.trim(),
    commonMistakes: [
      "Thinking JavaScript and Java are related — they only share part of a name.",
      "Assuming JavaScript can only run in a browser. It can also run on servers, in tools, and in scripts.",
      "Expecting code changes to show up without saving the file or refreshing the page.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Open your browser's developer console and run: console.log(\"Hello, JavaScript\")." },
      { difficulty: "Medium", prompt: "Use alert() to show a popup, and console.log() to print a message, and explain the difference you notice." },
      { difficulty: "Hard", prompt: "Find one real website feature (autocomplete, a dropdown, a live counter) and describe, in your own words, why it needs JavaScript to work." },
    ],
    interviewQuestions: [
      {
        question: "What is JavaScript used for?",
        answer:
          "Making web pages interactive (checking forms, updating content, responding to clicks). Via Node.js, it also builds servers, command-line tools and scripts outside the browser.",
      },
      {
        question: "Is JavaScript the same as Java?",
        answer:
          "No. They're unrelated languages with different creators, syntax and uses. Netscape picked the similar name in the 90s as marketing, to ride Java's popularity.",
      },
      {
        question: "Where does JavaScript code run?",
        answer:
          "Mostly in a browser's built-in JavaScript engine, but also on servers and in tools via Node.js, and in other runtimes (Deno, Bun, some IoT devices). The language is the same everywhere. What differs is which extra APIs (DOM, file system, etc.) the environment provides.",
      },
      {
        question: "Is JavaScript compiled or interpreted?",
        answer:
          "Neither, strictly. Modern engines like V8 use just-in-time (JIT) compilation: code first runs through an interpreter, and code that runs often (\"hot\" code) is compiled to optimized machine code on the fly. It isn't compiled ahead of time like C++, nor purely interpreted line by line.",
      },
      {
        question: "What is the relationship between JavaScript and ECMAScript?",
        answer:
          "ECMAScript is the standard (maintained by the TC39 committee) that defines the language's syntax and behavior. JavaScript is its most common implementation, and the two names are used almost interchangeably. Names like ES6/ES2015 refer to specific yearly releases of the spec.",
      },
      {
        question: "What is a JavaScript engine? Can you name one?",
        answer:
          "A program in a browser or runtime that parses and runs JavaScript according to the ECMAScript spec, with its own performance optimizations. The major ones are V8 (Chrome, Node.js), SpiderMonkey (Firefox) and JavaScriptCore (Safari).",
      },
      {
        question: "Is JavaScript single-threaded?",
        answer:
          "Yes. The language runs one operation at a time on a single call stack. Apparent concurrency (timers, network requests, clicks) comes from the runtime (the browser's Web APIs, or Node's libuv), which hands finished work back to that one thread through the event loop.",
      },
      {
        question: "What does it mean that JavaScript is dynamically typed?",
        answer:
          "A variable's type isn't declared ahead of time and can change while the program runs: `let x = 5; x = \"now text\";` is legal. The type belongs to the value, not the variable.",
      },
      {
        question: "What does it mean that JavaScript is weakly typed?",
        answer:
          "Many operations convert values between types automatically instead of raising an error. For example, `\"5\" - 1` becomes `4` because `-` turns the string into a number first. Handy at times, but a common source of subtle bugs, which is part of why TypeScript exists.",
      },
      {
        question: "What is Node.js, and how does it differ from JavaScript in a browser?",
        answer:
          "Node.js runs JavaScript outside the browser. It's built on the V8 engine and adds its own APIs (file system, networking, process control) instead of browser APIs like the DOM. The core language is identical; only the built-in objects around it differ.",
      },
      {
        question: "What is `\"use strict\"`, and why would you use it?",
        answer:
          "A directive that switches a script or function into strict mode. Common mistakes, like assigning to an undeclared variable, then throw errors instead of silently doing the wrong thing. Modules and class bodies are always strict, even without it.",
      },
      {
        question: "Why is JavaScript described as a multi-paradigm language?",
        answer:
          "It supports procedural, object-oriented (prototypes and classes) and functional styles (first-class and higher-order functions) without forcing one. A single program can mix all three.",
      },
      {
        question: "What's the difference between client-side and server-side JavaScript?",
        answer:
          "Client-side JavaScript runs in the user's browser, changing the page and reacting to user events. Server-side JavaScript (via Node.js) runs on a server and handles databases, files and APIs. Same language; different jobs and available APIs.",
      },
      {
        question: "Why do teams use tools like Babel or TypeScript alongside plain JavaScript?",
        answer:
          "Babel converts newer syntax into older JavaScript so it runs in browsers that lack the newest features. TypeScript adds static types checked before the code runs, then compiles to plain JavaScript. Neither replaces JavaScript; both build on it.",
      },
      {
        question:
          "Output-prediction: what does `console.log(typeof undeclaredVar)` print if `undeclaredVar` was never declared anywhere?",
        answer:
          "It logs `\"undefined\"` instead of throwing a `ReferenceError`. `typeof` is designed to be safe on names that don't exist, one of the few operations that doesn't throw on a missing variable.",
      },
      {
        question: "Is JavaScript case-sensitive?",
        answer:
          "Yes. `myVariable` and `myvariable` are different names, and keywords must use their exact casing.",
      },
      {
        question: "Why do some JavaScript files use semicolons and others don't?",
        answer:
          "Automatic Semicolon Insertion (ASI) adds missing semicolons at line breaks under certain rules, so code without them usually still works. But ASI has edge cases: a line starting with `(` or `[` can merge with the previous line and silently change meaning. That's why many style guides still write semicolons.",
      },
      {
        question: "Who created JavaScript, and why does that history come up in interviews?",
        answer:
          "Brendan Eich created it at Netscape in 1995, reportedly in about ten days. That rush explains several odd design choices (like `typeof null` being `\"object\"`) that remain today only for backward compatibility.",
      },
      {
        question: "What's the difference between \"JavaScript\" and \"ES6\"/\"ES2015+\"?",
        answer:
          "ES6 (ES2015) is one yearly release of the ECMAScript spec. It added major features like `let`/`const`, arrow functions, classes and promises. \"JavaScript\" means the language as a whole, across all yearly releases.",
      },
      {
        question: "Can JavaScript run without a browser?",
        answer:
          "Yes. Node.js, Deno, Bun and various embedded engines all run JavaScript outside a browser.",
      },
      {
        question: "What's the difference between the DOM and JavaScript itself?",
        answer:
          "The DOM is the browser's object version of a page's HTML; JavaScript is the language you use to read and change it. The language itself knows nothing about webpages. The browser adds the DOM API on top.",
      },
      {
        question:
          "Scenario: a team is choosing between vanilla JavaScript and a framework like React. What does JavaScript itself provide, and what does the framework add?",
        answer:
          "JavaScript gives you the core language (variables, functions, control flow) and, in the browser, DOM APIs for finding and changing elements by hand. A framework adds a structured way to build UI from reusable components and a more efficient way to update the DOM as data changes. Underneath, it's still plain JavaScript.",
      },
      {
        question: "Why can the same JavaScript code sometimes behave slightly differently across browsers?",
        answer:
          "Each browser ships its own engine and its own Web APIs (DOM, `fetch`, storage). The shared ECMAScript spec keeps core behavior nearly identical, but performance quirks, timing details or missing newer syntax can still cause visible differences.",
      },
      {
        question: "What is JSON's relationship to JavaScript, given the name?",
        answer:
          "JSON's syntax comes from JavaScript's object and array literals, but JSON is a language-independent text data format used by nearly every language. It isn't JavaScript code, and parsing it never runs anything.",
      },
      {
        question: "How does JavaScript's execution model compare to a language like Python's?",
        answer:
          "Both usually run through an interpreter/JIT rather than full ahead-of-time compilation. But JavaScript was designed to be embedded in a host (a browser or Node.js) and relies entirely on that host for I/O. The spec itself has no built-in way to read a file or make a network request.",
      },
    ],
    relatedTopics: ["variables", "functions"],
    keywords: ["javascript", "intro", "browser", "engine", "history"],
  },
  {
    id: "variables",
    title: "Variables",
    level: "beginner",
    description: "A named container for storing a value your program can reuse.",
    explanation: `
Programs need to remember things: a username, a score, a price. A variable
is a name for a piece of information, so you can reuse it without retyping
the value.

In JavaScript, you create a variable with \`let\` or \`const\`:

- Use **let** when the value might change later.
- Use **const** when the value should stay the same after it's set.

There's also an older keyword, \`var\`. Modern code mostly avoids it, because
\`let\` and \`const\` behave more predictably.
    `.trim(),
    analogy:
      "A variable is like a labeled jar. You write a label on it (the variable name) and put something inside (the value). Later, you just read the label to find what's inside.",
    examples: [
      {
        title: "Declaring variables",
        code: `let score = 0;
score = score + 10; // score is now 10

const username = "amara";
// username = "someone-else"; // ❌ this would cause an error`,
        explanation:
          "`score` can change because it's declared with `let`. `username` cannot be reassigned because it's declared with `const`.",
        walkthrough: [
          { code: "let score = 0;", explanation: "Creates score, starting at 0. It can change later." },
          { code: "score = score + 10;", explanation: "Reads score, adds 10, and stores the result back in score." },
          { code: 'const username = "amara";', explanation: "Creates a variable that can't be reassigned after this line." },
          { code: "// username = ...", explanation: "Commented out. Uncommenting it would throw an error, since const variables can't be reassigned." },
        ],
      },
      {
        title: "Using a variable to avoid repeating a value",
        code: `const taxRate = 0.08;

const price1 = 20;
const total1 = price1 + price1 * taxRate;

const price2 = 45;
const total2 = price2 + price2 * taxRate;`,
        explanation:
          "`taxRate` is defined once and used in both calculations. If the rate changes, you update it in one place.",
      },
    ],
    howItWorks: `
When JavaScript sees \`let score = 0\`, it sets aside a space in memory,
labels it "score" and stores 0 there. Whenever your code later uses
\`score\`, JavaScript looks up that space and uses its current value.
    `.trim(),
    whyItExists: `
Without variables, you'd repeat the same values everywhere, and you couldn't
store anything that changes while the program runs, like a running total or
the current user's name.
    `.trim(),
    whenToUse: `
Use a variable whenever you need to store a value to use again: a running
total, user input, a flag that tracks whether something happened. Use
\`const\` by default, and switch to \`let\` only when the value really needs
to change.
    `.trim(),
    whenNotToUse: `
A value you use exactly once may be clearer written directly where it's
needed. And avoid \`var\` in new code: it's never better than
\`let\`/\`const\` in modern JavaScript.
    `.trim(),
    commonMistakes: [
      "Trying to reassign a `const` variable — it will throw an error.",
      "Using a variable before declaring it.",
      "Picking unclear names like `x` or `data1` instead of descriptive ones like `cartTotal`.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Declare a `const` variable called `age` and log it to the console." },
      { difficulty: "Medium", prompt: "Declare a `let` variable called `count`, then write code that increases it by 1 three times." },
      { difficulty: "Hard", prompt: "Write a small script that stores a product's `price` and `quantity` in variables and logs the total cost." },
    ],
    interviewQuestions: [
      { question: "What's the difference between `var`, `let`, and `const`?", answer: "`var` is function-scoped (or global) and can be redeclared and reassigned. `let` is block-scoped and can be reassigned but not redeclared in the same scope. `const` is block-scoped and can't be reassigned after it's set. They differ in scope and in what reassignment/redeclaration they allow, not in what values they can hold." },
      { question: "Can you declare the same variable name twice in the same scope with `let`?", answer: "No. Redeclaring a `let` (or `const`) in the same scope throws a `SyntaxError` (\"Identifier has already been declared\"). `var` allows it with no error." },
      { question: "What happens if you try to reassign a `const` variable?", answer: "JavaScript throws `TypeError: Assignment to constant variable.` when the reassignment runs. `const` locks the binding itself." },
      { question: "What's the difference between declaring a variable and initializing it?", answer: "Declaring tells the engine a name exists in a scope (`let x`). Initializing gives it its first value (`x = 5`, or both at once: `let x = 5`). For `var` and `let` these can be on separate lines. A `var` is `undefined` until then, while a `let`/`const` is inaccessible (in the TDZ) until its declaration line runs." },
      { question: "What is variable scope, in plain terms?", answer: "Scope is the region of code where a variable name is visible. Code outside it either can't see the variable, or sees a different variable with the same name." },
      { question: "What is function scope, and which keyword creates it?", answer: "A function-scoped variable is visible anywhere in the function it was declared in, through any nested blocks (`if`, `for`, etc.). `var` is function-scoped, so a `var` declared inside an `if` is visible in the rest of the function." },
      { question: "What is block scope, and which keywords create it?", answer: "A block-scoped variable is only visible inside the nearest `{ }` it was declared in: an `if` block, a `for` loop body or a standalone `{ }`. `let` and `const` are block-scoped." },
      { question: "What is global scope?", answer: "The outermost scope, outside any function or block. A variable declared there is visible everywhere in the file. In non-module scripts, a `var` or implicit global also becomes a property of the global object." },
      { question: "What happens if you try to use a variable that was never declared anywhere?", answer: "JavaScript throws `ReferenceError: x is not defined` when that line runs. There's no fallback, unlike a declared-but-unassigned variable, which is just `undefined`." },
      { question: "What does a `ReferenceError` actually indicate?", answer: "The code used a name that doesn't exist in any visible scope. Either it was never declared, or it's a `let`/`const` accessed before its declaration ran (the TDZ case), which throws the same error type." },
      { question: "Are `let` and `const` hoisted the same way `var` is?", answer: "Partly. The engine registers the name at the top of the scope, but unlike `var` it isn't set to `undefined`. It stays uninitialized in the Temporal Dead Zone until the declaration line runs, so earlier access throws instead of returning `undefined`." },
      { question: "What is the Temporal Dead Zone (TDZ)?", answer: "The stretch between the start of a scope and the line that declares a `let`/`const`. The variable exists (it's hoisted) but can't be read or written there; any access throws a `ReferenceError`." },
      { question: "If `var`, `let`, and `const` are all hoisted, why does only `var` let you access the variable before its declaration line?", answer: "A hoisted `var` is set to `undefined` right away, so an early read gets `undefined`. A hoisted `let`/`const` only reserves the name and stays uninitialized until its declaration runs, so an early read hits the TDZ and throws." },
      { question: "What's the difference between reassignment and mutation?", answer: "Reassignment points the variable at a new value (`x = newValue`). Mutation changes the contents of the value it already points to (`arr.push(1)`, `obj.key = 2`). `const` blocks reassignment but not mutation." },
      { question: "Can you change a property on an object declared with `const`? Can you reassign the variable to a different object?", answer: "You can change, add or delete its properties (`obj.name = \"new\"`), because that's mutation. You can't do `obj = { other: \"object\" }`: that reassigns the binding, which `const` forbids." },
      { question: "Can you `.push()` to a `const` array? Can you reassign it to a new array?", answer: "Yes to pushing (and `.pop()`, `.splice()`, index assignment, etc.), which change the array in place. No to reassigning it (`arr = [1, 2]`). `const` locks the binding, not the array's contents." },
      { question: "What is variable shadowing?", answer: "When an inner-scope variable has the same name as an outer one, the inner one hides (shadows) the outer one inside that scope. The outer variable is unaffected and is visible again once the inner scope ends." },
      { question: "What happens when you declare a `var` inside an `if` block?", answer: "It isn't scoped to the block. `var` is function-scoped, so it's hoisted to the top of the enclosing function (or global scope) and is usable outside and after the `if`. This often surprises people who expect block scoping." },
      { question: "What is lexical scope?", answer: "Scope set by where code is written, not where it's called from. A function can use variables from the scopes it was nested in when defined, wherever it's later called." },
      { question: "What does it mean for scopes to be nested?", answer: "An inner scope (a function or block) sits inside an outer one and can read variables from every surrounding scope, out to global. The reverse isn't true: an outer scope can't see an inner scope's variables." },
      { question: "If you declare a variable with `let` inside a function, can code outside that function access it?", answer: "No. Outside the function (or block), the variable is out of scope. The only way to reach its value is for the function to return or expose it." },
      { question: "What happens if you assign to a name with no `let`, `const`, or `var` at all, like `total = 5;`?", answer: "In non-strict mode, JavaScript silently creates a global variable. No error, but it pollutes the global scope. In strict mode (`\"use strict\"`, or inside any ES module or class), the same line throws a `ReferenceError`." },
      { question: "Why is relying on implicit globals (assigning without a declaration keyword) considered risky?", answer: "It creates a variable outside any controlled scope, easy to miss when reading the function, and it can silently collide with a same-named variable elsewhere in a large codebase. Strict mode throws a `ReferenceError` on undeclared assignment to catch exactly these bugs early." },
      { question: "Explain the TDZ in terms of lexical environments.", answer: "On entering a scope, the engine creates a lexical environment and registers every `let`/`const` name in it, marked uninitialized. Only when execution reaches the declaration does the binding become initialized and get its value. A lookup before that finds an uninitialized binding and throws. That's the TDZ." },
      { question: "Why does JavaScript bother having a TDZ instead of just initializing `let`/`const` to `undefined` like `var`?", answer: "It turns reading a variable before its setup line into an immediate error, instead of a silent `undefined` that causes problems later. It also keeps `const` consistent: a `const` that started as `undefined` and later got its real value would effectively be reassigned, which `const` doesn't allow." },
      { question: "What's the key hoisting difference between a function declaration and a `let`/`var` declaration?", answer: "A function declaration is hoisted with its whole body, so you can call it before the line it's on. A `var` is hoisted as `undefined`, and a `let`/`const` is hoisted but uninitialized (TDZ). Only the function works early; the others just reserve the name." },
      { question: "Why does using `let` instead of `var` fix the classic loop-and-`setTimeout` bug?", answer: "With `var`, the whole loop shares one binding, so when the callbacks run they all see its final value. With `let`, each iteration gets a new binding, so each callback closes over its own copy with that iteration's value." },
      { question: "Can two variables with the same name coexist in nested scopes at the same moment?", answer: "Yes. Each scope has its own binding, so an inner `let x` and an outer `let x` are two separate variables with the same name. The engine looks up a name from the current scope outward and stops at the first match, so the innermost one wins." },
      { question: "Output-prediction: what does `console.log(x); var x = 5;` print, and why not a `ReferenceError`?", answer: "It logs `undefined`. `var x` is hoisted and set to `undefined` right away, and the assignment `x = 5` hasn't run yet when `console.log` reads it." },
      { question: "Output-prediction: what does `console.log(y); let y = 5;` do?", answer: "It throws `ReferenceError: Cannot access 'y' before initialization`. `y` is hoisted but stays in the Temporal Dead Zone until its declaration runs, so reading it earlier throws." },
      { question: "Output-prediction: what does `let count = 1; { let count = 2; console.log(count); } console.log(count);` log?", answer: "It logs `2`, then `1`. The `{ }` block is a new scope where `let count = 2` shadows the outer `count`. After the block, the last `console.log` sees the untouched outer `count`, still `1`." },
      { question: "Output-prediction: what does `for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }` log?", answer: "It logs `3, 3, 3`. All three callbacks share the one function-scoped `var i`, and by the time they run (after the loop ends), `i` is already `3`." },
      { question: "Output-prediction: if you replace `var i` with `let i` in the same loop, `for (let i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }`, what does it log now, and why?", answer: "It logs `0, 1, 2`. `let` in a `for` header creates a new binding per iteration, so each arrow function captures its own `i` with that iteration's value." },
      { question: "Output-prediction: why does `const point = { x: 1 }; point = { x: 2 };` throw, and what's the exact error?", answer: "It throws `TypeError: Assignment to constant variable.` `point =` reassigns the binding, which `const` forbids, even though the new object looks the same. `point.x = 2` would work, since it mutates the existing object." },
      { question: "Trap: a teammate declares a loop counter with `const i` in a classic `for` loop and it immediately throws. Why?", answer: "`for (const i = 0; i < 3; i++)` throws a `TypeError` after the first iteration, when `i++` tries to reassign `i`. `const` only works as a loop variable in `for...of`/`for...in`, where each iteration gets a fresh binding instead of reassigning one." },
    ],
    prerequisites: ["what-is-javascript"],
    relatedTopics: ["data-types", "scope"],
    keywords: ["let", "const", "var", "declaration"],
  },
  {
    id: "data-types",
    title: "Data Types",
    level: "beginner",
    description: "The different kinds of values JavaScript can store and work with.",
    explanation: `
The number 5, the word "hello" and a true/false answer all behave
differently. JavaScript groups values into a small set of **data types** so
it knows how to handle each one.

The ones you'll use most:

- **String** — text, written in quotes: \`"hello"\`
- **Number** — any number: \`42\`, \`3.14\`
- **Boolean** — true or false: \`true\`, \`false\`
- **Undefined** — a variable that has been declared but has no value yet
- **Null** — a value that's intentionally empty
- **Object** — a collection of related data (including arrays and functions)
    `.trim(),
    analogy:
      "Think of a toolbox with compartments for screws, nails and tape. Data types are those compartments: they tell you what you're holding, so you know what you can do with it.",
    examples: [
      {
        title: "Checking a value's type",
        code: `console.log(typeof "hello");   // "string"
console.log(typeof 42);        // "number"
console.log(typeof true);      // "boolean"
console.log(typeof undefined); // "undefined"`,
        explanation: "`typeof` is a built-in operator that tells you the data type of any value.",
        walkthrough: [
          { code: 'typeof "hello"', explanation: '"hello" is text, so typeof reports "string".' },
          { code: "typeof 42", explanation: '42 is a number, so typeof reports "number".' },
          { code: "typeof true", explanation: 'true/false values report "boolean".' },
          { code: "typeof undefined", explanation: 'A variable with no value yet reports "undefined".' },
        ],
      },
      {
        title: "The same operator, different types, different behavior",
        code: `console.log(2 + 3);       // 5   — both numbers, so + adds them
console.log("2" + "3");   // "23" — both strings, so + joins them
console.log("2" + 3);     // "23" — mixed, so the number becomes a string first`,
        explanation:
          "`+` behaves differently depending on the types of its two values. That's why knowing a value's type matters.",
      },
    ],
    howItWorks: `
JavaScript tags every value with a type. The type decides what operations
do: you can do math on numbers, but adding two strings joins them ("2" + "3"
becomes "23", not 5). Know the type, and you know how a value behaves.
    `.trim(),
    whyItExists: `
Different data needs different rules. Text is joined and searched; numbers
are added and compared; true/false values drive decisions. Types let the
language apply the right rules automatically.
    `.trim(),
    whenToUse: `
Think about types when you're unsure what kind of value you have: checking
user input, debugging an odd result, or deciding whether two values can be
safely compared or combined. \`typeof\` is the quick way to check.
    `.trim(),
    whenNotToUse: `
Don't check the type of values you created yourself and already know.
\`typeof\` checks everywhere just add noise. Save them for boundaries: user
input, API responses and arguments from code you don't control.
    `.trim(),
    commonMistakes: [
      "Mixing up a number and a string that looks like a number, e.g. `\"5\" + 1` gives `\"51\"`, not `6`.",
      "Confusing `undefined` (nothing assigned yet) with `null` (intentionally empty).",
      "Forgetting that arrays and functions are technically objects too.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use `typeof` to check the type of a string, a number, and a boolean." },
      { difficulty: "Medium", prompt: "Predict the output of `\"3\" + 3` and `3 + 3`, then check by running it." },
      { difficulty: "Hard", prompt: "Write a function `describeType(value)` that returns a friendly sentence describing the value's type." },
    ],
    interviewQuestions: [
      { question: "What are the basic data types built into JavaScript?", answer: "Seven primitive types (String, Number, Boolean, Undefined, Null, Symbol and BigInt) plus Object, which covers everything else: plain objects, arrays, functions, dates and more." },
      { question: "What's the difference between a primitive and an object?", answer: "A primitive holds its value directly and is compared and copied by value: two strings with the same characters are equal. An object is held by reference, so it's compared and copied by reference: two separately created objects with identical contents are not `===` equal." },
      { question: "What does `typeof` return for a string, a number, and a boolean?", answer: "`\"string\"`, `\"number\"` and `\"boolean\"`. `typeof` returns a string naming the value's type, handy for quick runtime checks." },
      { question: "What's the difference between `null` and `undefined`?", answer: "JavaScript gives you `undefined` automatically for a declared-but-unassigned variable, a missing argument or a missing property: nothing has been set yet. `null` is assigned deliberately by a developer to mean \"intentionally empty\"." },
      { question: "What is `NaN`, and what does the name stand for?", answer: "\"Not a Number\": the value numeric operations return when the result isn't a valid number, like `0 / 0` or `Number(\"abc\")`. Despite the name, `typeof NaN` is `\"number\"`, since it belongs to the Number type." },
      { question: "Is an array its own separate data type in JavaScript?", answer: "No. Arrays are a special kind of object (with numeric-like indices and a `length` property). `typeof []` returns `\"object\"`; to check for an array, use `Array.isArray()`." },
      { question: "Is a function a data type in JavaScript?", answer: "Functions are callable objects. `typeof` returns `\"function\"` for them instead of `\"object\"`, the one case where it tells a callable object apart from a plain one." },
      { question: "What does `typeof null` return, and why is that surprising?", answer: "It returns `\"object\"`, though `null` is a primitive. It's a bug from the original 1995 implementation (`null` shared the internal type tag used for objects), kept only for backward compatibility." },
      { question: "What does `typeof` return for an array, and how would you actually check for one?", answer: "`typeof []` returns `\"object\"`, like any plain object, so `typeof` can't spot arrays. Use `Array.isArray(value)` instead." },
      { question: "What does `typeof` return for a function?", answer: "`\"function\"`. It's the one case where `typeof` is more specific than `\"object\"` for something that is an object underneath." },
      { question: "What is type coercion?", answer: "JavaScript automatically converting a value to another type when an operation expects a different type. For example, turning a number into a string so `+` can join it to a string." },
      { question: "Why does `\"2\" + 3` produce `\"23\"` while `\"2\" - 1` produces `1`?", answer: "`+` has a special rule: if either operand is a string, it turns the other into a string and joins them. Other arithmetic operators, including `-`, can't join strings, so they convert both operands to numbers: `\"2\"` becomes `2`, and `2 - 1` is `1`." },
      { question: "What's the difference between implicit and explicit type conversion?", answer: "Implicit conversion (coercion) happens automatically during an operation, like `\"5\" * 2` silently becoming `10`. Explicit conversion is done on purpose in code, like `Number(\"5\")` or `String(5)`, so the intent is visible." },
      { question: "How would you explicitly convert a string to a number?", answer: "`Number(\"42\")`, `parseInt(\"42\")` / `parseFloat(\"42.5\")`, or unary `+\"42\"`. `Number()` and unary `+` need the whole string to be numeric or they return `NaN`. `parseInt`/`parseFloat` read as much of the leading number as they can and ignore the rest." },
      { question: "How would you explicitly convert a number to a string?", answer: "`String(42)`, `(42).toString()`, or `42 + \"\"` (which relies on coercion, so it's less explicit). All produce `\"42\"`." },
      { question: "What is `BigInt`, and why does it exist?", answer: "A primitive for whole numbers larger than `Number` can safely hold (`Number.MAX_SAFE_INTEGER`, 2^53 - 1), without losing precision. Add `n` to an integer literal to create one, e.g. `123n`. You can't mix `BigInt` and regular numbers in arithmetic without converting explicitly." },
      { question: "What is `Symbol`, and what is it typically used for?", answer: "A primitive that is unique every time you create one (`Symbol(\"id\") !== Symbol(\"id\")`). It's often used as an object property key that can't collide with any string key or other symbol, which is useful for adding metadata to objects safely." },
      { question: "Why is `NaN === NaN` false?", answer: "The IEEE 754 floating-point spec (which JavaScript numbers follow) defines `NaN` as never equal to anything, including itself. It means \"not a valid numeric result\", not a specific value." },
      { question: "How do you correctly check whether a value is `NaN`?", answer: "`Number.isNaN(value)`, which returns `true` only for `NaN` itself. The older global `isNaN(value)` converts its argument to a number first, so `isNaN(\"hello\")` is also `true`." },
      { question: "What's the difference between `Number.isNaN()` and the global `isNaN()`?", answer: "`Number.isNaN()` is strict: `true` only if the value is exactly `NaN`, with no conversion. The global `isNaN()` converts its argument to a number first, so `isNaN(\"abc\")` is also `true`, though `\"abc\"` was never `NaN`." },
      { question: "Is JavaScript strongly or weakly typed, and what does that mean in practice?", answer: "Weakly typed. Operators convert between types instead of throwing when types don't match: `\"5\" * 2` silently becomes `10`. That's forgiving, but a common source of subtle bugs when a conversion happens where you didn't expect it." },
      { question: "Is JavaScript statically or dynamically typed?", answer: "Dynamically typed. Types aren't fixed or checked at compile time; they belong to the current value and are only checked as the code runs. TypeScript's static types are added on top to address this." },
      { question: "Can a variable's type change after it's declared?", answer: "Yes. A variable is just a name for whatever value it currently holds, so `let x = 5; x = \"now text\";` is legal. Only the value has a type, not the variable." },
      { question: "Why are primitives compared by value while objects are compared by reference?", answer: "Primitives are stored directly, so comparing them compares their contents: `\"cat\" === \"cat\"` is `true`. Objects are stored as references, so `===` checks whether both variables point to the same object. Two separate objects with identical properties are still `!==`." },
      { question: "What happens when you access a property on a primitive, like `\"hello\".length`?", answer: "JavaScript briefly wraps the primitive in its object type (here a `String` object), reads the property, then throws the wrapper away. The primitive never becomes an object; this \"auto-boxing\" just lets primitives use properties and methods." },
      { question: "Output-prediction: what does `typeof typeof 1` evaluate to?", answer: "`\"string\"`. The inner `typeof 1` returns the string `\"number\"`, and the type of any string is `\"string\"`." },
      { question: "Output-prediction: what does `console.log(1 + \"1\"); console.log(1 - \"1\");` log?", answer: "It logs `\"11\"` then `0`. `+` sees a string, so it turns the number into a string and joins them. `-` can't join strings, so it turns `\"1\"` into `1`, giving `1 - 1 = 0`." },
      { question: "Output-prediction: what does `console.log([1, 2, 3] + [4, 5, 6])` log?", answer: "The string `\"1,2,34,5,6\"`. `+` converts both arrays to strings first (arrays join their elements with commas), giving `\"1,2,3\"` and `\"4,5,6\"`, which are then joined." },
      { question: "Output-prediction: what does `null == undefined` evaluate to? What about `null === undefined`?", answer: "`null == undefined` is `true`: the spec makes loose equality treat them as equal to each other (and to nothing else). `null === undefined` is `false`, because strict equality also needs the same type." },
      { question: "Output-prediction: what does `typeof NaN` return?", answer: "`\"number\"`. Despite its name, `NaN` belongs to the Number type: it's an invalid numeric result, not a missing number." },
    ],
    prerequisites: ["variables"],
    relatedTopics: ["variables", "operators", "js-gotchas"],
    keywords: ["types", "string", "number", "boolean", "typeof"],
  },
  {
    id: "operators",
    title: "Operators",
    level: "beginner",
    description: "Symbols that perform actions on values, like math or comparisons.",
    explanation: `
You often need to do things with values: add two numbers, check which is
bigger, or combine two conditions into one decision. **Operators** are the
symbols that do this. Each takes one or more values and produces a result.

The groups you'll use daily:

- **Arithmetic**: \`+ - * / %\` for math
- **Comparison**: \`=== !== > < >= <=\` for comparing two values
- **Logical**: \`&& || !\` for combining true/false conditions
- **Assignment**: \`= += -=\` for storing or updating a value
    `.trim(),
    analogy:
      "Operators are like calculator buttons: each one does a specific, predictable action with the numbers you've entered.",
    examples: [
      {
        title: "Arithmetic and comparison",
        code: `const total = 10 + 5;      // 15
const isEqual = 10 === 10; // true
const isBigger = 10 > 20;  // false`,
        walkthrough: [
          { code: "const total = 10 + 5;", explanation: "Adds 10 and 5, storing 15 in total." },
          { code: "const isEqual = 10 === 10;", explanation: "Compares 10 to 10 with strict equality, storing true." },
          { code: "const isBigger = 10 > 20;", explanation: "Checks whether 10 is greater than 20, storing false." },
        ],
      },
      {
        title: "Logical operators combining conditions",
        code: `const age = 20;
const hasTicket = true;

const canEnter = age >= 18 && hasTicket;
console.log(canEnter); // true

const skipLine = age < 12 || age > 65;
console.log(skipLine); // false`,
        explanation:
          "`&&` needs both sides to be true; `||` needs only one. Both combine several conditions into one decision.",
      },
    ],
    howItWorks: `
Each operator takes one or two values (operands) and produces a result. \`+\`
turns two numbers into their sum. \`===\` turns two values into a boolean:
true if they match exactly, false otherwise.
    `.trim(),
    whyItExists: `
Programs constantly calculate, compare and combine values to make decisions.
Operators are the building blocks for that logic.
    `.trim(),
    whenToUse: `
Use arithmetic operators to calculate and comparison operators to decide.
Use logical operators (\`&&\`, \`||\`) when a decision depends on more than one
condition.
    `.trim(),
    whenNotToUse: `
Avoid \`==\` in new code: its type conversions cause more bugs than they
prevent, so make \`===\` your default. And if a condition chains too many
logical operators to read at a glance, move it into a well-named variable.
    `.trim(),
    commonMistakes: [
      "Using `=` (assignment) when you meant `===` (comparison).",
      "Using `==` instead of `===` — `==` converts types before comparing, which can cause surprising results like `\"5\" == 5` being `true`.",
      "Forgetting operator precedence, e.g. assuming `2 + 3 * 4` equals `20` instead of `14`.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write an expression that adds two numbers and multiplies the result by 2." },
      { difficulty: "Medium", prompt: "Use `===` to compare two values of different types and explain the result." },
      { difficulty: "Hard", prompt: "Write a one-line expression using `&&` and `||` that checks if a user is either an admin or (a member and over 18)." },
    ],
    interviewQuestions: [
      { question: "What's the difference between `==` and `===`?", answer: "`==` (loose equality) converts differing types to a common type before comparing, which gives surprises like `\"5\" == 5`. `===` (strict equality) compares value and type with no conversion, so different types are never equal. It's the safer default almost always." },
      { question: "What does the `%` (modulo) operator do?", answer: "It returns the remainder after division: `10 % 3` is `1`, since 3 goes into 10 three times with 1 left over. It's the standard way to check divisibility (`n % 2 === 0` for even) or wrap a number into a fixed range." },
      { question: "What's the difference between `=`, `==`, and `===`?", answer: "`=` is assignment: it stores a value in a variable. `==` and `===` are comparisons that produce a boolean; `==` converts types first, `===` doesn't. Writing `=` in a condition by mistake is a classic bug: `if (x = 5)` assigns 5 to x and the condition is truthy." },
      { question: "What do `&&` and `||` do?", answer: "`&&` (AND) is truthy only if both operands are truthy; `||` (OR) needs at least one. Both combine conditions into one true/false decision." },
      { question: "What does the `!` operator do?", answer: "Logical NOT: it converts its operand to a boolean and flips it, so `!true` is `false` and `!0` is `true` (`0` is falsy). `!!value` is a common shorthand to turn any value into its boolean equivalent." },
      { question: "What is short-circuit evaluation?", answer: "JavaScript stops evaluating a logical expression once the result is decided. In `a || b`, if `a` is truthy the result is already truthy, so `b` is never evaluated." },
      { question: "Why does `a || b` sometimes not evaluate `b` at all?", answer: "`||` needs only one truthy operand. Once `a` is truthy, `b` can't change the answer, so it's skipped. This matters if `b` is a function call with side effects: they won't happen." },
      { question: "If both operands of `&&` are truthy, what does the expression actually evaluate to?", answer: "Not `true`. If the first operand is truthy, `&&` returns the second operand's value, so `\"a\" && \"b\"` is `\"b\"`. It only looks boolean when the operands are booleans." },
      { question: "If the first operand of `||` is truthy, what does the expression evaluate to?", answer: "That operand's own value, not `true`. `||` returns the first truthy operand, so `\"hello\" || \"fallback\"` is `\"hello\"`. Default-value patterns like `const name = input || \"Guest\";` rely on this." },
      { question: "What is operator precedence, and how does it explain the result of `2 + 3 * 4`?", answer: "Precedence is the fixed order JavaScript evaluates mixed operators in, regardless of left-to-right order. Multiplication binds tighter than addition, so `3 * 4` (`12`) comes first, then `2 + 12` gives `14`, not `20`." },
      { question: "What's the difference between `x += 1` and `x = x + 1`?", answer: "Nothing in practice. `+=` is shorthand: it reads `x`, adds `1` and stores the result back in `x`, exactly like the longer form." },
      { question: "What is the nullish coalescing operator (`??`), and how does it differ from `||`?", answer: "`a ?? b` gives `b` only when `a` is `null` or `undefined`. Other falsy values like `0`, `\"\"` or `false` are returned as-is. `||` falls back for any falsy `a`, which wrongly overrides valid values like `0` or an empty string." },
      { question: "What is optional chaining (`?.`), and what problem does it solve?", answer: "It returns `undefined` instead of throwing when a value partway down a chain is `null` or `undefined`. `user?.address?.city` safely gives `undefined` if `user` or `address` is missing, instead of throwing `TypeError: Cannot read properties of undefined`." },
      { question: "What's the difference between `++x` (prefix) and `x++` (postfix)?", answer: "Both add 1 to `x`, but the expression's value differs: `++x` increments first and gives the new value; `x++` gives the old value, then increments. This only matters inside a larger expression: `arr[i++]` indexes with the current `i`, then increments it." },
      { question: "Why do `&&` and `||` return one of their actual operand values instead of a plain boolean?", answer: "It's deliberate, and it enables useful patterns: default values (`input || \"default\"`), guarded property access (`user && user.name`) and conditional calls (`isReady && doThing()`). All rely on getting a real value back, not just `true`/`false`." },
      { question: "What does `NaN == NaN` evaluate to? What about `NaN === NaN`?", answer: "Both are `false`. Under the IEEE 754 spec, `NaN` never equals any value, including itself, whichever equality operator you use." },
      { question: "Why does `0.1 + 0.2 === 0.3` evaluate to `false`?", answer: "JavaScript numbers are IEEE 754 double-precision floats, which can't store most decimal fractions exactly in binary. `0.1 + 0.2` is actually about `0.30000000000000004`, not exactly `0.3`. Exact equality on floats is unreliable in every language that uses this format, not just JavaScript." },
      { question: "Output-prediction: what does `console.log(1 < 2 < 3)` log?", answer: "`true`, but not for the obvious reason. `<` runs left to right, so it's `(1 < 2) < 3`: `1 < 2` is `true`, then `true < 3` turns `true` into `1`, and `1 < 3` is `true`. The same pattern gives a misleading `true` for `3 < 2 < 1`, since it becomes `false < 1` → `0 < 1`." },
      { question: "Output-prediction: what do `console.log(\"5\" == 5)` and `console.log(\"5\" === 5)` log?", answer: "`true` then `false`. `==` converts `\"5\"` to the number `5` first, so they match. `===` never converts types, and a string is never strictly equal to a number." },
      { question: "Output-prediction: what do `console.log(null ?? \"default\")` and `console.log(0 ?? \"default\")` log?", answer: "`\"default\"` then `0`. `??` only falls back for `null` or `undefined`. `0` isn't nullish, so it's returned even though it's falsy." },
      { question: "Output-prediction: what does `let x = 5; console.log(x++ + ++x);` log?", answer: "It logs `12`. `x++` gives `5` (then `x` becomes `6`); `++x` makes `x` `7` and gives `7`. So it's `5 + 7` = `12`, and `x` ends up `7`." },
    ],
    prerequisites: ["data-types"],
    relatedTopics: ["data-types", "conditions"],
    keywords: ["arithmetic", "comparison", "logical", "equality"],
  },
  {
    id: "conditions",
    title: "Conditions",
    level: "beginner",
    description: "Making your code choose between different paths based on a test.",
    explanation: `
Programs make decisions: "if the user is logged in, show their name;
otherwise, show a login button." Conditions are how you write that in code.

The main tool is the \`if\` statement. It runs a block only when a test is
true, and offers alternatives with \`else if\` and \`else\`.
    `.trim(),
    analogy:
      "It's like a fork in the road with a sign: 'If it's raining, take the covered path. Otherwise, take the shortcut.' Your code reads the sign and picks a path.",
    examples: [
      {
        title: "if / else if / else",
        code: `const hour = 14;

if (hour < 12) {
  console.log("Good morning");
} else if (hour < 18) {
  console.log("Good afternoon");
} else {
  console.log("Good evening");
}
// logs: "Good afternoon"`,
        walkthrough: [
          { code: "const hour = 14;", explanation: "Stores the current hour." },
          { code: "if (hour < 12)", explanation: "Is it before noon? No, so this block is skipped." },
          { code: "} else if (hour < 18) {", explanation: "Checked only because the first test failed. Is it before 6pm? Yes, so this block runs." },
          { code: "} else {", explanation: "Runs only if neither test above matched." },
        ],
      },
      {
        title: "A ternary expression for a simple either/or",
        code: `const age = 20;

const message = age >= 18 ? "You can vote" : "You can't vote yet";
console.log(message); // "You can vote"`,
        explanation:
          "For a simple choice between two values, a ternary (`condition ? ifTrue : ifFalse`) is a one-line alternative to if/else.",
      },
    ],
    howItWorks: `
JavaScript checks the condition in the parentheses. If it's **truthy**
(anything except the "falsy" values \`false\`, \`0\`, \`""\`, \`null\`,
\`undefined\` and \`NaN\`), it runs that block and skips the rest.

Otherwise it moves to the next \`else if\` and checks again, finally falling
into \`else\` if nothing matched.
    `.trim(),
    diagram: `
Check condition
       ↓
 true?  ──yes──▶ run this block ──▶ done
   │
   no
   ↓
check next condition (repeat)
    `.trim(),
    whyItExists: `
A program that always does the same thing, whatever the input, isn't very
useful. Conditions let code adapt to the current data or situation.
    `.trim(),
    whenToUse: `
Use conditions when the next step depends on data you don't know in
advance: user input, an API value, the current time. If you can describe
your logic with "if," it's a condition.
    `.trim(),
    whenNotToUse: `
If every branch does almost the same thing, a simpler solution like a
lookup object or a default value may avoid the repetition. A \`switch\` (or
a lookup) also reads better than five or more \`else if\` blocks checking
the same variable.
    `.trim(),
    commonMistakes: [
      "Forgetting the `else` and assuming a variable is always set inside the `if` block.",
      "Using `=` instead of `===` inside a condition by accident.",
      "Writing deeply nested if/else chains instead of simplifying the logic.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write an `if/else` that logs \"even\" or \"odd\" for a given number." },
      { difficulty: "Medium", prompt: "Write a grading function that returns a letter grade (A/B/C/D/F) from a numeric score using `if/else if`." },
      { difficulty: "Hard", prompt: "Rewrite a chain of 4 `else if` checks using a `switch` statement instead." },
    ],
    interviewQuestions: [
      { question: "What counts as a 'falsy' value in JavaScript, and how does that affect an `if` condition?", answer: "`false`, `0`, `-0`, `0n`, `\"\"` (empty string), `null`, `undefined` and `NaN` are the only falsy values. Everything else, including `\"0\"`, `[]` and `{}`, is truthy. An `if` doesn't need a real boolean; it converts its condition to `true`/`false` with these rules." },
      { question: "What is a ternary operator?", answer: "A one-expression conditional: `condition ? valueIfTrue : valueIfFalse`. Unlike `if/else`, it produces a value, so you can use it directly in an assignment, a function argument or a template string." },
      { question: "When would you reach for `switch` instead of `if/else`?", answer: "When you compare one value against several known possibilities: a status code, a day of the week, a menu option. It often reads better than a long `else if` chain repeating the same variable. For a few branches, either is fine." },
      { question: "What's the difference between chaining `else if` and writing separate standalone `if` statements?", answer: "In an `else if` chain, only one branch runs; once a condition matches, the rest are skipped. Separate `if`s are each checked and can all run, even if an earlier one matched, which is usually not what you want when conditions overlap." },
      { question: "What happens if an `if` condition isn't a literal `true` or `false`, like `if (user)`?", answer: "JavaScript converts the value to a boolean using the truthy/falsy rules. `if (user)` runs when `user` is truthy (an object, a non-empty string, a non-zero number) and skips for any falsy value. No `=== true` needed." },
      { question: "Does `switch` compare its cases with `==` or `===`?", answer: "Strict equality (`===`). `switch` never converts types, so `switch (1) { case \"1\": ... }` won't match, even though `1 == \"1\"` is `true`." },
      { question: "What is 'fallthrough' in a `switch` statement, and why does `break` matter?", answer: "Without a `break`, execution doesn't stop after a matching case: it falls into the next case's code and runs it too, until a `break` or the end of the `switch`. `break` makes each case an isolated branch." },
      { question: "Can you chain multiple `else if` blocks indefinitely? What decides which one actually runs?", answer: "Yes, there's no limit. JavaScript checks conditions top to bottom, runs the first truthy one and skips the rest of the chain, even if a later condition would also match." },
      { question: "What's the practical difference between nesting `if` statements and chaining them with `else if`?", answer: "Nested `if`s check conditions that depend on each other (the inner check only matters once the outer one passed). An `else if` chain checks mutually exclusive alternatives for one decision. Deep nesting for what are really alternatives is harder to read than a flat chain." },
      { question: "Why might a lookup object be a better choice than a long `else if` chain?", answer: "When each branch just maps one input to one output (e.g. a status code to a message), a lookup object (`messages[code]`) replaces the chain with one property access. It's shorter, doesn't repeat the variable, and you extend it by adding a key." },
      { question: "Why does `if (0)` skip its block, but `if (\"0\")` run it?", answer: "The number `0` is falsy. The string `\"0\"` is non-empty, and every non-empty string is truthy, whatever its characters. String truthiness depends only on length." },
      { question: "Can a `switch` statement handle range checks or complex boolean conditions directly, like `age > 18`?", answer: "Not directly; `switch` matches fixed values with strict equality. A workaround is `switch (true) { case age > 18: ... }`, which compares each `case` expression with `true`. But an `if/else if` chain is usually clearer." },
      { question: "Beyond syntax, what's a real difference between a ternary and an `if/else` statement?", answer: "A ternary is an expression: it produces a value you can assign, pass as an argument or put in a string. An `if/else` is a statement that produces no value, so choosing a value with it means declaring a variable and assigning it in each branch." },
      { question: "Output-prediction: does `if ([]) console.log(\"truthy\"); else console.log(\"falsy\");` log \"truthy\" or \"falsy\", and why does that surprise people?", answer: "It logs `\"truthy\"`. An empty array is an object, and every object (including `[]` and `{}`) is truthy, even when empty. Only the fixed falsy values (`false`, `0`, `\"\"`, `null`, `undefined`, `NaN`) are falsy." },
      { question: "Output-prediction: what does `switch (1) { case \"1\": console.log(\"string one\"); break; case 1: console.log(\"number one\"); break; default: console.log(\"none\"); }` log?", answer: "It logs `\"number one\"`. `switch` uses strict equality, so `1` doesn't match `\"1\"` (different types) but does match `case 1`." },
      { question: "Output-prediction: what does `let result; if (false) { result = \"a\"; } console.log(result);` log?", answer: "It logs `undefined`. The `if` body never runs and there's no `else`, so `result` is never assigned and stays `undefined`." },
      { question: "Trap: what's the bug in `switch (color) { case \"red\": console.log(\"stop\"); case \"green\": console.log(\"go\"); break; }`, and what does it print for `color = \"red\"`?", answer: "It prints `\"stop\"` and `\"go\"`. The `\"red\"` case has no `break`, so execution falls through into the `\"green\"` code, even though `color` isn't `\"green\"`." },
      { question: "Output-prediction: what does `age >= 18 ? \"adult\" : age >= 13 ? \"teen\" : \"child\"` evaluate to when `age` is `15`?", answer: "`\"teen\"`. Nested ternaries work like chained `else if`s: `age >= 18` is `false`, so it moves to the second ternary, where `age >= 13` is `true`, giving `\"teen\"`." },
    ],
    prerequisites: ["operators"],
    relatedTopics: ["operators", "loops"],
    keywords: ["if", "else", "switch", "ternary", "truthy", "falsy"],
  },
  {
    id: "loops",
    title: "Loops",
    level: "beginner",
    description: "Repeating an action multiple times without copy-pasting code.",
    explanation: `
Often you need to do the same thing many times: print every item in a list,
check every user, count from 1 to 100. Writing that out by hand is tedious
and error-prone. A **loop** repeats a block of code for you, either a fixed
number of times or until a condition is no longer true.

The two you'll use most:

- **for** — when you know how many times to repeat (or you're going through a list)
- **while** — when you want to repeat until some condition becomes false
    `.trim(),
    analogy:
      "A loop is like telling someone: 'Keep folding laundry until the basket is empty.' One instruction, repeated, instead of a new one for every item.",
    examples: [
      {
        title: "A basic for loop",
        code: `for (let i = 1; i <= 5; i++) {
  console.log(i);
}
// logs 1, 2, 3, 4, 5`,
        explanation:
          "`i = 1` sets the start, `i <= 5` is the condition checked before each run, and `i++` increases `i` after each run.",
        walkthrough: [
          { code: "let i = 1", explanation: "Runs once, before the loop starts: creates a counter at 1." },
          { code: "i <= 5", explanation: "Checked before every pass. The loop continues while this is true." },
          { code: "console.log(i);", explanation: "The part that repeats: prints the current i." },
          { code: "i++", explanation: "Runs after every pass, adding 1 to i before the next check." },
        ],
      },
      {
        title: "A while loop",
        code: `let count = 3;
while (count > 0) {
  console.log(count);
  count = count - 1;
}
// logs 3, 2, 1`,
      },
      {
        title: "A for...of loop — looping over an array directly",
        code: `const fruits = ["apple", "banana", "cherry"];

for (const fruit of fruits) {
  console.log(fruit);
}
// logs apple, banana, cherry`,
        explanation:
          "`for...of` loops over the values in an array (or any iterable), so there's no counter to manage and no off-by-one risk.",
      },
    ],
    howItWorks: `
Before each pass, JavaScript checks the condition. If it's true, it runs the
loop body and checks again. When the condition becomes false, the loop stops
and the program continues after it.
    `.trim(),
    diagram: `
Check condition
       ↓
  true? ──yes──▶ run loop body ──▶ back to check condition
    │
    no
    ↓
 exit loop
    `.trim(),
    whyItExists: `
Loops let you write one block of logic and apply it to many items or
repetitions, instead of duplicating code that's tedious to write and hard to
change.
    `.trim(),
    whenToUse: `
Use a loop to repeat an action for every item in a collection, or to repeat
something until a condition is met: processing a list, retrying a request,
counting down a timer.
    `.trim(),
    whenNotToUse: `
For a small, fixed number of repeats, a couple of plain statements can be
clearer than a loop. And to transform or filter every item in an array,
\`.map()\` and \`.filter()\` usually read better than a manual loop.
    `.trim(),
    commonMistakes: [
      "Forgetting to update the loop variable, causing an infinite loop (e.g. forgetting `i++`).",
      "Using `<=` vs `<` incorrectly and running one extra or one fewer time than intended (an 'off-by-one' error).",
      "Modifying an array while looping over it, which can skip or repeat items.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use a `for` loop to print the numbers 1 through 10." },
      { difficulty: "Medium", prompt: "Use a `while` loop to add up all numbers from 1 to 100." },
      { difficulty: "Hard", prompt: "Use a nested loop to print a 5x5 grid of `*` characters." },
    ],
    interviewQuestions: [
      { question: "What's the difference between `for` and `while`?", answer: "A `for` loop puts the counter's setup, condition and update on one line, so it fits when you know how many times (or over what range) to repeat. A `while` loop has only a condition, checked before each pass, so it fits when repetition depends on something other than a simple counter." },
      { question: "What causes an infinite loop?", answer: "A condition that never becomes false. Usually the code that should change the tested value (like `i++`, or updating a flag in a `while`) is missing, runs on the wrong branch, or moves the value the wrong way." },
      { question: "What do `break` and `continue` do?", answer: "`break` exits the loop immediately; no more iterations run. `continue` skips the rest of the current iteration and jumps to the next condition check, without leaving the loop." },
      { question: "What is a `for...of` loop, and what does it iterate over?", answer: "A loop over the values of any iterable (arrays, strings, Maps, Sets) with no index variable, so there's no counter to manage and no off-by-one risk." },
      { question: "What's the difference between `for...of` and `for...in`?", answer: "`for...of` loops over an iterable's values (an array's elements, a string's characters). `for...in` loops over an object's enumerable property keys, as strings. On an array it gives indices as strings (`\"0\"`, `\"1\"`, ...), not values, so it's generally kept for plain objects." },
      { question: "What is a `do...while` loop, and how does it differ from a regular `while` loop?", answer: "It runs the body once before the first condition check, then checks before each later pass like a normal `while`. So the body always runs at least once, even if the condition is false from the start." },
      { question: "What is an 'off-by-one' error, and how does it typically happen in a loop?", answer: "Running a loop one time too many or too few, usually by using `<=` instead of `<` (or the reverse). For example, looping `i <= array.length` reads one index past the end of the array." },
      { question: "Why does modifying an array's length while looping over it with a classic indexed `for` loop cause bugs?", answer: "Adding or removing elements shifts the indexes of everything after them, while the loop index keeps advancing. So the loop can skip an element or process one twice, with no error to warn you." },
      { question: "Inside a nested loop, does a plain `break` exit both loops or just the inner one?", answer: "Just the inner one; a bare `break` exits only the nearest loop. To exit an outer loop from inside, use a label, like `outer: for (...) { for (...) { break outer; } } `." },
      { question: "Can you use `continue` inside a `for...of` loop?", answer: "Yes. It works as in any loop: it skips the rest of the current iteration and moves to the next value." },
      { question: "Why is `for...of` generally preferred over a classic indexed `for` loop when you just need each value?", answer: "It removes the bugs that come with managing an index by hand (off-by-one errors, wrong comparisons, forgetting to increment), and it reads directly as \"for each value in this collection.\"" },
      { question: "What's a key behavior difference between a classic `for` loop and `.forEach()`?", answer: "`.forEach()` calls a callback once per element, so each call has its own function scope, which works naturally with `let`/`const` closures. But `break`/`continue`/`return` can't control the iteration the way they do in a real loop: you can't stop a `.forEach()` early." },
      { question: "Can `break` be used inside `.forEach()`? Why or why not?", answer: "No. `break` only works inside real loops (`for`, `while`, `do...while`). `.forEach()` is a function called repeatedly, not loop syntax, so `break` in its callback is a `SyntaxError`. To stop early, use `for...of` with `break`, or a method like `.some()`/`.find()` that stops once satisfied." },
      { question: "Why does a `let` counter in a `for` loop create a new binding on every iteration, and why does that matter for closures?", answer: "The spec defines `for (let i ...)` to create a fresh `i` for each iteration (carrying over the previous value), instead of one shared binding. That lets a closure in the loop body, like a `setTimeout` callback, capture that iteration's own `i`, instead of all callbacks sharing one final value as with `var`." },
      { question: "Output-prediction: what does `for (let i = 0; i < 3; i++) { if (i === 1) continue; console.log(i); }` log?", answer: "It logs `0` then `2`. When `i` is `1`, `continue` skips the `console.log` and the loop moves on to `i = 2`." },
      { question: "Output-prediction: what does `outer: for (let i = 0; i < 2; i++) { for (let j = 0; j < 2; j++) { if (j === 1) continue outer; console.log(i, j); } } ` log?", answer: "It logs `0 0` then `1 0`. When `j` is `1`, `continue outer` jumps to the next outer iteration before the inner `console.log` runs, so each outer pass only logs `j = 0`." },
      { question: "Trap: what's wrong with `let i = 0; while (i < 5) { console.log(i); }`, and what actually happens when it runs?", answer: "It's an infinite loop that logs `0` forever. Nothing in the body changes `i`, so `i < 5` stays true. It needs something like `i++;` inside the block." },
      { question: "Output-prediction: what does `const arr = [\"a\", \"b\", \"c\"]; for (const index in arr) { console.log(typeof index); }` log?", answer: "It logs `\"string\"` three times. `for...in` gives an array's property keys, and indices come as strings (`\"0\"`, `\"1\"`, `\"2\"`). That's one reason to prefer `for...of` or indexed access for arrays." },
    ],
    prerequisites: ["conditions"],
    relatedTopics: ["conditions", "functions", "arrays"],
    keywords: ["for", "while", "iteration", "break", "continue"],
  },
  {
    id: "functions",
    title: "Functions",
    level: "beginner",
    description: "A reusable, named block of code that performs a specific task.",
    explanation: `
As programs grow, you need the same task in several places: calculate a
total, check an email, format a date. Instead of repeating that logic, wrap
it in a **function**: a named block of code you can "call" whenever you
need it.

A function can take inputs (**parameters**) and send back a result (with
\`return\`).
    `.trim(),
    analogy:
      "A function is like a recipe. You give it ingredients (parameters), it follows the steps, and it hands back a finished dish (the return value). You can reuse it as often as you like.",
    examples: [
      {
        title: "Declaring and calling a function",
        code: `function add(a, b) {
  return a + b;
}

const result = add(2, 3);
console.log(result); // 5`,
        explanation:
          "`add` takes two parameters, `a` and `b`, and returns their sum. Calling `add(2, 3)` runs that code with `a = 2` and `b = 3`.",
        walkthrough: [
          { code: "function add(a, b) {", explanation: "Defines a function named add that takes two inputs, a and b." },
          { code: "return a + b;", explanation: "Sends the sum back to wherever add was called." },
          { code: "}", explanation: "Ends the function's code." },
          { code: "const result = add(2, 3);", explanation: "Calls add with 2 and 3 and stores the returned 5 in result." },
        ],
      },
      {
        title: "Arrow function shorthand",
        code: `const add = (a, b) => a + b;`,
        explanation: "Arrow functions are a shorter way to write simple functions, common in modern JavaScript.",
      },
    ],
    howItWorks: `
When you call a function, JavaScript pauses the current line, runs the
function's code with the arguments you passed, and, if there's a
\`return\`, sends a value back to where it was called. Execution then
continues from there.
    `.trim(),
    whyItExists: `
Functions let you name a piece of logic once and reuse it anywhere. Code
stays shorter, easier to test and easier to change: you fix a bug in one
place instead of every copy.
    `.trim(),
    whenToUse: `
Write a function when you're about to repeat the same few lines, or when a
chunk of code does one clear, nameable thing: checking an email,
calculating a total, formatting a date.
    `.trim(),
    whenNotToUse: `
Don't wrap a one-off single line in a function just because you can; it
adds indirection with no benefit. And a function doing five unrelated
things should usually be split into smaller, focused ones.
    `.trim(),
    commonMistakes: [
      "Forgetting to `return` a value and expecting the function to give one back automatically.",
      "Confusing a function's parameters (the placeholders) with arguments (the actual values passed in).",
      "Writing functions that try to do too many unrelated things at once.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a function `square(n)` that returns `n * n`." },
      { difficulty: "Medium", prompt: "Write a function `isEven(n)` that returns `true` or `false`." },
      { difficulty: "Hard", prompt: "Write a function `average(numbers)` that takes an array and returns the average value." },
    ],
    interviewQuestions: [
      { question: "What's the difference between a parameter and an argument?", answer: "A parameter is the placeholder name in the function's definition (`function add(a, b)`: `a` and `b`). An argument is the actual value passed at the call (`add(2, 3)`: `2` and `3`)." },
      { question: "What happens if a function has no `return` statement?", answer: "It returns `undefined` when it reaches the end. Calling it doesn't throw, but any code using its \"result\" gets `undefined`." },
      { question: "What's the difference between a function declaration and an arrow function?", answer: "Besides shorter syntax, arrow functions have no own `this`, `arguments` or `super`, and can't be used with `new`. They take `this` from the surrounding scope. Regular functions get their own `this` (set by how they're called) and their own `arguments` object." },
      { question: "What's the difference between a function declaration and a function expression?", answer: "A declaration (`function foo() {}`) is hoisted with its full body, so you can call it before the line it's on. An expression (`const foo = function () {}`) is part of an assignment; the variable follows normal `let`/`const`/`var` hoisting, so the function isn't callable until that line runs." },
      { question: "Can a function have more than one `return` statement?", answer: "Yes, often one per `if/else` branch. The first one that runs ends the function; code after it doesn't run." },
      { question: "What happens if you call a function with fewer arguments than it has parameters?", answer: "The missing parameters are `undefined` (or their default value, if set). JavaScript doesn't complain about the count, unlike many statically typed languages." },
      { question: "What happens if you call a function with more arguments than it has declared parameters?", answer: "The extras are accepted without error but aren't bound to a named parameter. You can still reach them through the `arguments` object (in a regular function) or with a rest parameter (`...args`)." },
      { question: "What is a default parameter, and when does its default value actually kick in?", answer: "A value set in the signature (`function greet(name = \"Guest\")`), used only when the argument is `undefined`, whether omitted or passed as `undefined`. Other falsy values like `null` or `0` don't trigger it." },
      { question: "What is a rest parameter, and how does it differ from the old `arguments` object?", answer: "`...args` as the last parameter collects remaining arguments into a real array (`function sum(...nums) { ... }`), so `.map()` and `.reduce()` work directly. The older `arguments` object exists automatically in every regular function, but it's only array-like (no array methods) and doesn't exist in arrow functions." },
      { question: "Are function declarations hoisted? What about function expressions?", answer: "Declarations are hoisted fully, body included, so they work before their line. Function expressions (and arrow functions) aren't: only their variable is hoisted, by its own rules (`undefined` for `var`, TDZ for `let`/`const`). Calling one early gives `undefined is not a function` or a TDZ `ReferenceError`." },
      { question: "What is a callback function?", answer: "A function passed into another function to be called later, often when an operation finishes or an event happens. Examples: the click handler given to `addEventListener`, or the function given to `.map()` that runs once per element." },
      { question: "What is a higher-order function?", answer: "A function that takes a function as an argument, returns one, or both. `.map()`, `.filter()` and `.reduce()` are higher-order because each takes a callback." },
      { question: "What is a closure, in plain terms?", answer: "A function that remembers the variables of the scope it was defined in, even after that scope has finished. A function returned from another function can keep reading and updating variables from a call that already ended." },
      { question: "What is recursion, and what must a recursive function have to avoid infinite recursion?", answer: "A function that calls itself on a smaller version of the problem until it reaches a base case it can answer directly. Without a base case, it calls itself until the call stack overflows and throws `RangeError: Maximum call stack size exceeded`." },
      { question: "What is an IIFE (Immediately Invoked Function Expression), and why would you use one?", answer: "A function expression defined and called in one statement, usually `(function () { ... })();`. It creates a private scope that runs once. Before `let`/`const`/modules, it was used to avoid leaking variables into the global scope; today it's rarer, but still used for one-off setup code." },
      { question: "Can a function be assigned to a variable, passed as an argument, or returned from another function? What does that make functions in JavaScript?", answer: "Yes to all three. That makes functions \"first-class citizens\" (first-class values): you can store, pass and return them like any number, string or object. This is what makes callbacks, higher-order functions and closures possible." },
      { question: "What's the practical difference between `function foo() {}` and `const foo = function () {}`?", answer: "Both create an equivalent function. The first is a hoisted declaration usable before its line; the second is bound to a `const` and unusable until that line runs. Also, a declaration always has the name `foo` in stack traces, while an anonymous expression only gets a name inferred from the variable it's first assigned to." },
      { question: "Why don't arrow functions have their own `this`? Where do they get it from instead?", answer: "They were designed without their own `this`. Instead they look `this` up like any variable: from the nearest enclosing non-arrow function (or the module/global scope) where the arrow was defined, not where it's called." },
      { question: "Why can't arrow functions be used as constructors with `new`?", answer: "`new` needs the function to create a fresh `this` bound to the new object. Arrow functions never create their own `this`, so JavaScript throws `TypeError: X is not a constructor`." },
      { question: "What is a pure function? Why are pure functions easier to test and reason about?", answer: "A function that always returns the same output for the same inputs and has no side effects: no mutating arguments, no global state, no I/O. You can test it in isolation (call it, check the output, no setup) and reason about it from its inputs alone." },
      { question: "What does it mean for JavaScript functions to be 'first-class citizens'?", answer: "Functions are regular values, not a special category. You can store them in variables, arrays or object properties, pass them as arguments and return them, just like numbers or strings." },
      { question: "What's the difference between a function's arity and the number of arguments it's actually called with?", answer: "Arity is the number of parameters a function declares (`function add(a, b) {}` has arity 2). The number of arguments is set per call and can be more, fewer or equal; JavaScript doesn't enforce a match." },
      { question: "Are extra arguments passed beyond a function's declared parameters lost?", answer: "No. They're not assigned to a named parameter, but you can reach them through the `arguments` object in a regular function, or capture them with a rest parameter (`...rest`)." },
      { question: "What is currying, and how does it relate to closures?", answer: "Turning a multi-argument function into a chain of one-argument functions, e.g. `add(a)(b)(c)` instead of `add(a, b, c)`. It relies on closures: each returned function keeps access to the arguments already given to the outer ones." },
      { question: "Why can't arrow functions have their own `arguments` object?", answer: "Same design as `this`: arrow functions don't bind their own `arguments`, so using it inside one looks it up from the nearest enclosing regular function. With no enclosing regular function, it throws a `ReferenceError`." },
      { question: "Output-prediction: what does `function outer() { let count = 0; return function () { count++; return count; }; } const counter = outer(); console.log(counter()); console.log(counter());` log?", answer: "It logs `1` then `2`. `outer()` runs once and returns the inner function, which keeps a closure over that call's `count`. Each `counter()` call updates the same `count` instead of starting fresh." },
      { question: "Output-prediction: what does `sayHi(); function sayHi() { console.log(\"hi\"); }` do?", answer: "It logs `\"hi\"`. Function declarations are hoisted with their whole body, so `sayHi` is callable before its line." },
      { question: "Output-prediction: what does `sayBye(); const sayBye = function () { console.log(\"bye\"); };` do?", answer: "It throws `ReferenceError: Cannot access 'sayBye' before initialization`. `sayBye` is a `const`, so it's in the Temporal Dead Zone until its line runs. Assigning a function doesn't change `const` hoisting." },
      { question: "Output-prediction: given `const obj = { name: \"Ana\", greet() { console.log(this.name); }, greetArrow: () => console.log(this.name) };`, what does `obj.greet()` log compared to `obj.greetArrow()`?", answer: "`obj.greet()` logs `\"Ana\"`: a regular method's `this` comes from the call, and `obj.greet()` sets `this` to `obj`. `obj.greetArrow()` doesn't log `\"Ana\"`: an arrow function takes `this` from the scope around the object literal, never `obj`, however it's called." },
      { question: "Output-prediction: given `function add(a, b = 10) { return a + b; }`, what do `add(5)`, `add(5, undefined)`, and `add(5, null)` each return?", answer: "`15`, `15`, then `5`. The default applies only when the argument is `undefined`, whether omitted or passed explicitly. `null` is a real value, so `b` stays `null`, and `5 + null` treats `null` as `0`, giving `5`." },
    ],
    prerequisites: ["loops"],
    relatedTopics: ["arrays", "scope", "callbacks", "higher-order-functions"],
    keywords: ["parameters", "arguments", "return", "arrow function"],
  },
];
