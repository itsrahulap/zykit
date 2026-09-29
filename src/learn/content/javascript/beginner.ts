import type { Topic } from "../../types/content";

export const javascriptBeginnerTopics: Topic[] = [
  {
    id: "what-is-javascript",
    title: "What is JavaScript?",
    level: "beginner",
    description:
      "The programming language that makes websites interactive.",
    explanation: `
A website starts as plain text and images — that's what HTML and CSS give you.
But nothing on the page can *react* to you. Nothing changes when you click a
button, type in a form, or scroll down.

JavaScript is the piece that adds that behavior. It's a programming language
that runs inside your web browser and lets a page respond to what you do:
show a menu, validate a form, update a price, load new content without
reloading the page.

It also runs outside the browser now — on servers (using Node.js), in mobile
apps, and even on some hardware. But it started, and is still mostly known,
as "the language of the web."
    `.trim(),
    analogy:
      "If HTML is the skeleton of a page and CSS is its clothing, JavaScript is the muscles — it's what makes things actually move.",
    examples: [
      {
        title: "A tiny piece of JavaScript",
        code: `alert("Hello! This popped up because of JavaScript.");`,
        explanation:
          "This one line, placed in a webpage, would show a popup box. Nothing complicated — just an instruction the browser understands and runs.",
        walkthrough: [
          { code: "alert(...)", explanation: "Calls a function built into every browser that shows a small popup box on screen." },
          { code: '"Hello! This popped up..."', explanation: "The text inside the quotes is exactly what appears in that popup." },
          { code: ";", explanation: "The semicolon marks the end of this instruction, the same way a period ends a sentence." },
        ],
      },
      {
        title: "Reacting to a click",
        code: `const button = document.querySelector("button");

button.addEventListener("click", () => {
  alert("You clicked the button!");
});`,
        explanation:
          "This is closer to what JavaScript is actually used for day to day: finding a piece of the page, then telling it what to do when the user interacts with it.",
      },
    ],
    howItWorks: `
Every browser (Chrome, Firefox, Safari, Edge) has a built-in program called a
JavaScript engine. When a webpage loads, the browser reads any JavaScript
code on the page and hands it to this engine, which runs it line by line.
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
Early websites were static — you could read them, but not interact with
them. JavaScript was created to let pages respond to the user directly, in
the browser, without needing to ask a server and reload the whole page for
every small change.
    `.trim(),
    whenToUse: `
Reach for JavaScript when you're building something that needs to run in a
web browser and react to the user right away — validating a form as someone
types, updating a page without reloading it, or building an entire
single-page app. It's also a reasonable choice for the server side (via
Node.js) if you'd rather use one language for both the client and the
server.
    `.trim(),
    whenNotToUse: `
If you're building something CPU-heavy — video processing, machine
learning, low-level system code — JavaScript usually isn't the first
choice; languages built for that kind of raw performance (C++, Rust, Go)
fit better. And a purely informational page with no interactivity at all
may not need JavaScript beyond a tiny script, if any.
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
          "Making web pages interactive in the browser — validating forms, updating content, responding to clicks — and, via Node.js, building servers, command-line tools, and scripts outside the browser too.",
      },
      {
        question: "Is JavaScript the same as Java?",
        answer:
          "No. They're unrelated languages with different creators, syntax, and use cases. The similar name was a marketing decision by Netscape in the 90s to ride Java's popularity, not a sign of shared heritage.",
      },
      {
        question: "Where does JavaScript code run?",
        answer:
          "Primarily inside a browser's built-in JavaScript engine, but also on servers and in tools via Node.js, and in other embedded runtimes (Deno, Bun, some IoT devices) — the language is the same everywhere; what differs is which extra APIs (DOM, file system, etc.) the environment provides.",
      },
      {
        question: "Is JavaScript compiled or interpreted?",
        answer:
          "Neither in the traditional sense — modern engines like V8 use just-in-time (JIT) compilation: code is parsed and initially run through an interpreter, and any code path that runs often (\"hot\" code) gets compiled to optimized machine code on the fly. It's not compiled ahead of time like C++, but it's not purely line-by-line interpreted either.",
      },
      {
        question: "What is the relationship between JavaScript and ECMAScript?",
        answer:
          "ECMAScript is the standardized specification (maintained by the TC39 committee) that defines the language's syntax and behavior. JavaScript is the most common implementation of that spec — in practice the two names are used almost interchangeably, and version names like ES6/ES2015 refer to specific yearly releases of the spec.",
      },
      {
        question: "What is a JavaScript engine? Can you name one?",
        answer:
          "A program built into a browser or runtime that parses and executes JavaScript code according to the ECMAScript spec, plus its own performance optimizations. V8 (Chrome, Node.js), SpiderMonkey (Firefox), and JavaScriptCore (Safari) are the major ones.",
      },
      {
        question: "Is JavaScript single-threaded?",
        answer:
          "Yes — the language itself runs one operation at a time on a single call stack. Apparent concurrency (timers, network requests, click handling) comes from the surrounding runtime (the browser's Web APIs, or Node's libuv), which hands finished work back to that one thread through the event loop.",
      },
      {
        question: "What does it mean that JavaScript is dynamically typed?",
        answer:
          "A variable's type isn't declared ahead of time and can change as the program runs — `let x = 5; x = \"now text\";` is perfectly legal. The type lives with the value at any given moment, not with the variable itself.",
      },
      {
        question: "What does it mean that JavaScript is weakly typed?",
        answer:
          "Many operations automatically convert values between types instead of raising an error — e.g. `\"5\" - 1` becomes `4` because `-` coerces the string to a number first. This is convenient in small cases but a frequent source of subtle bugs, which is part of why TypeScript exists.",
      },
      {
        question: "What is Node.js, and how does it differ from JavaScript in a browser?",
        answer:
          "Node.js is a runtime for executing JavaScript outside the browser, built on the V8 engine plus its own APIs — file system access, networking, process control — instead of browser APIs like the DOM. The core language is identical; only the surrounding built-in objects differ.",
      },
      {
        question: "What is `\"use strict\"`, and why would you use it?",
        answer:
          "A directive that opts a script or function into a stricter mode of JavaScript, turning common mistakes — like assigning to an undeclared variable — into thrown errors instead of silently doing something unintended. Modules and class bodies are strict mode automatically, even without writing it explicitly.",
      },
      {
        question: "Why is JavaScript described as a multi-paradigm language?",
        answer:
          "It supports procedural code, object-oriented code (via prototypes and classes), and functional-style code (functions as first-class values, higher-order functions) without forcing any single style — a single program can freely mix all three.",
      },
      {
        question: "What's the difference between client-side and server-side JavaScript?",
        answer:
          "Client-side JavaScript runs in the user's browser, manipulating the page and reacting to user events. Server-side JavaScript (via Node.js) runs on a server, handling things like databases, file access, and APIs. The language is the same; the responsibilities and available APIs differ.",
      },
      {
        question: "Why do teams use tools like Babel or TypeScript alongside plain JavaScript?",
        answer:
          "Babel transpiles newer JavaScript syntax down to an older version so it runs in browsers that don't yet support the newest features. TypeScript adds a static type system checked before the code ever runs, then compiles down to plain JavaScript — neither replaces JavaScript, both build on top of it.",
      },
      {
        question:
          "Output-prediction: what does `console.log(typeof undeclaredVar)` print if `undeclaredVar` was never declared anywhere?",
        answer:
          "It logs `\"undefined\"` rather than throwing a `ReferenceError`. `typeof` is specifically designed to be safe on identifiers that don't exist at all — one of the very few operations in JavaScript that doesn't throw on a missing variable.",
      },
      {
        question: "Is JavaScript case-sensitive?",
        answer:
          "Yes — `myVariable` and `myvariable` are two completely different identifiers, and every keyword must be written in its exact casing.",
      },
      {
        question: "Why do some JavaScript files use semicolons and others don't?",
        answer:
          "JavaScript has Automatic Semicolon Insertion (ASI), which inserts missing semicolons for you at line breaks under certain rules, so code without explicit semicolons often still runs correctly. ASI has edge cases — like a line starting with `(` or `[` merging with the previous line — that can silently change meaning, which is why many style guides still write semicolons explicitly.",
      },
      {
        question: "Who created JavaScript, and why does that history come up in interviews?",
        answer:
          "Brendan Eich created it at Netscape in 1995, reportedly in about ten days. That rushed origin explains several of the language's inconsistent design choices (like `typeof null` being `\"object\"`) that persist today purely for backward compatibility.",
      },
      {
        question: "What's the difference between \"JavaScript\" and \"ES6\"/\"ES2015+\"?",
        answer:
          "ES6 (also called ES2015) is one specific yearly release of the ECMAScript spec that introduced major features like `let`/`const`, arrow functions, classes, and promises. \"JavaScript\" refers to the language as a whole across every one of these yearly spec updates, past and future.",
      },
      {
        question: "Can JavaScript run without a browser?",
        answer:
          "Yes — Node.js, Deno, Bun, and various embedded scripting engines all run JavaScript entirely outside any browser context.",
      },
      {
        question: "What's the difference between the DOM and JavaScript itself?",
        answer:
          "The DOM is a browser-provided object representation of a page's HTML structure; JavaScript is the language used to read and change it. The language itself has no built-in idea of a webpage — the DOM API is something the browser environment adds on top.",
      },
      {
        question:
          "Scenario: a team is choosing between vanilla JavaScript and a framework like React. What does JavaScript itself provide, and what does the framework add?",
        answer:
          "JavaScript provides the core language — variables, functions, control flow, and, in the browser, direct DOM APIs for finding and changing elements by hand. A framework adds a structured way to build UI out of reusable components and a more efficient system for updating the DOM as data changes — but it's still generating and running plain JavaScript underneath.",
      },
      {
        question: "Why can the same JavaScript code sometimes behave slightly differently across browsers?",
        answer:
          "Each browser ships its own engine and its own implementation of Web APIs (DOM, `fetch`, storage). Core language behavior is nearly identical thanks to the shared ECMAScript spec, but engine-specific performance quirks, timing details, or not-yet-implemented newer syntax can still cause visible differences.",
      },
      {
        question: "What is JSON's relationship to JavaScript, given the name?",
        answer:
          "JSON's syntax was inspired by JavaScript's object and array literals, but JSON is a language-independent, text-based data format used across nearly every programming language — it isn't JavaScript code, and parsing it never executes anything.",
      },
      {
        question: "How does JavaScript's execution model compare to a language like Python's?",
        answer:
          "Both are typically run by an interpreter/JIT rather than compiled fully ahead of time, but JavaScript was designed specifically to be embedded in a host environment (a browser or Node.js) and relies entirely on that host for I/O — the language spec itself defines no built-in way to read a file or make a network request.",
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
Programs need to remember things — a username, a score, an item price. A
variable is simply a name you give to a piece of information so you can use
it again later, without retyping the value every time.

In JavaScript, you create a variable with \`let\` or \`const\`:

- Use **let** when the value might change later.
- Use **const** when the value should stay the same after it's set.

There's also an older keyword, \`var\`, but modern JavaScript mostly avoids it
in favor of \`let\` and \`const\`, which behave more predictably.
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
          { code: "let score = 0;", explanation: "Creates a variable named score, starting at 0, that's allowed to change later." },
          { code: "score = score + 10;", explanation: "Reads the current value of score, adds 10, and stores the result back in score." },
          { code: 'const username = "amara";', explanation: "Creates a variable that cannot be reassigned after this line." },
          { code: "// username = ...", explanation: "Commented out — uncommenting it would throw an error, since const variables can't be reassigned." },
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
          "`taxRate` is defined once and reused in both calculations — if the tax rate ever changes, there's exactly one place to update it.",
      },
    ],
    howItWorks: `
When JavaScript sees \`let score = 0\`, it sets aside a small space in memory,
labels that space "score", and stores the value 0 there. Whenever your code
uses the word \`score\` afterward, JavaScript looks up that labeled space and
uses whatever value currently lives there.
    `.trim(),
    whyItExists: `
Without variables, you'd have to write the same literal values everywhere,
and you'd have no way to store something that changes while the program
runs — like a running total or the current user's name.
    `.trim(),
    whenToUse: `
Use a variable any time you need to store a value so you can use it again
later — a running total, a piece of user input, a flag that tracks whether
something happened. Reach for \`const\` by default, and switch to \`let\` only
once you know the value genuinely needs to change.
    `.trim(),
    whenNotToUse: `
You don't need a variable for a value you use exactly once and never refer
to again — sometimes it's clearer to just write the value directly where
it's needed. And avoid \`var\` in new code: there's no situation in modern
JavaScript where \`var\` behaves better than \`let\`/\`const\`.
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
      { question: "What's the difference between `var`, `let`, and `const`?", answer: "`var` is function-scoped (or global) and can be redeclared and reassigned; `let` is block-scoped and can be reassigned but not redeclared in the same scope; `const` is block-scoped like `let` but cannot be reassigned after its initial value is set. All three differ mainly in scope and whether reassignment/redeclaration is allowed — not in what kinds of values they can hold." },
      { question: "Can you declare the same variable name twice in the same scope with `let`?", answer: "No — redeclaring a `let` (or `const`) binding in the same scope throws a `SyntaxError` (\"Identifier has already been declared\"). `var`, by contrast, allows redeclaring the same name in the same scope with no error at all." },
      { question: "What happens if you try to reassign a `const` variable?", answer: "JavaScript throws a `TypeError: Assignment to constant variable.` at the moment the reassignment runs — `const` locks the binding itself, not just discourages changing it." },
      { question: "What's the difference between declaring a variable and initializing it?", answer: "Declaration is telling the engine a name exists in a scope (e.g. `let x`); initialization is giving it its first value (e.g. `x = 5`, or combined as `let x = 5`). The two can happen on separate lines for `var` and `let` — a `var` starts as `undefined` between declaration and initialization, while a `let`/`const` stays inaccessible (in the TDZ) until the initialization line actually runs." },
      { question: "What is variable scope, in plain terms?", answer: "Scope is the region of code where a given variable name is visible and usable. Code outside that region either can't see the variable at all, or sees a different variable that happens to share the name." },
      { question: "What is function scope, and which keyword creates it?", answer: "Function scope means a variable is visible anywhere inside the function it was declared in, regardless of how many nested blocks (`if`, `for`, etc.) it passes through — `var` is function-scoped, so a `var` declared inside an `if` block is still visible for the rest of the whole function." },
      { question: "What is block scope, and which keywords create it?", answer: "Block scope means a variable is only visible inside the nearest pair of curly braces `{ }` it was declared in — an `if` block, a `for` loop body, or any standalone `{ }`. `let` and `const` are block-scoped." },
      { question: "What is global scope?", answer: "The outermost scope, not nested inside any function or block — a variable declared there is visible from anywhere else in the file (and, for `var` or an implicit global, becomes a property of the global object in non-module scripts)." },
      { question: "What happens if you try to use a variable that was never declared anywhere?", answer: "JavaScript throws a `ReferenceError: x is not defined` the moment that line runs — there's no fallback value, unlike a declared-but-unassigned variable which is simply `undefined`." },
      { question: "What does a `ReferenceError` actually indicate?", answer: "That the code referenced a name that doesn't exist as a binding in any scope currently visible to it — either it was never declared, or it's a `let`/`const` being accessed before its declaration has run (the TDZ case), which throws this same error type." },
      { question: "Are `let` and `const` hoisted the same way `var` is?", answer: "They're hoisted in the sense that the engine registers the binding at the top of the scope during compilation, but unlike `var` they are not initialized to `undefined` at that point — they stay uninitialized in the Temporal Dead Zone until the actual declaration line executes, so accessing them earlier throws instead of returning `undefined`." },
      { question: "What is the Temporal Dead Zone (TDZ)?", answer: "The span of code between the start of a scope and the line where a `let`/`const` variable is actually declared, during which the variable exists (it's hoisted) but cannot be read or written — any access in that window throws a `ReferenceError`." },
      { question: "If `var`, `let`, and `const` are all hoisted, why does only `var` let you access the variable before its declaration line?", answer: "Hoisting for `var` initializes the binding to `undefined` immediately, so an early read just gets `undefined`. Hoisting for `let`/`const` only reserves the name — it deliberately leaves it uninitialized until the declaration line runs, so an early read hits the TDZ and throws instead." },
      { question: "What's the difference between reassignment and mutation?", answer: "Reassignment replaces what a variable points to entirely (`x = newValue`); mutation changes the contents of the value a variable already points to, without changing which value that is (e.g. `arr.push(1)` or `obj.key = 2`). `const` blocks reassignment but has no say over mutation." },
      { question: "Can you change a property on an object declared with `const`? Can you reassign the variable to a different object?", answer: "You can freely change, add, or delete its properties (`obj.name = \"new\"`) because that's mutation, not reassignment. You cannot do `obj = { other: \"object\" }` — that's a reassignment of the binding itself, which `const` forbids." },
      { question: "Can you `.push()` to a `const` array? Can you reassign it to a new array?", answer: "Yes to pushing (and `.pop()`, `.splice()`, index assignment, etc.) — those mutate the existing array in place. No to reassigning it to a different array or a new literal (`arr = [1, 2]`) — `const` only ever locks the binding, not the array's contents." },
      { question: "What is variable shadowing?", answer: "When a variable declared in an inner scope has the same name as one in an outer scope, the inner one shadows the outer one for the rest of that inner scope — code inside sees only the inner variable, and the outer one is unaffected and reappears once the inner scope ends." },
      { question: "What happens when you declare a `var` inside an `if` block?", answer: "It's not scoped to that block at all — because `var` is function-scoped, the declaration is hoisted to the top of the nearest enclosing function (or the global scope), so the variable is accessible even outside and after the `if` block, which frequently surprises people expecting block scoping." },
      { question: "What is lexical scope?", answer: "Scope determined by where code is physically written in the source, not by how or from where it's called — a function can access variables from the scopes it was literally nested inside when it was defined, regardless of where it's later invoked from." },
      { question: "What does it mean for scopes to be nested?", answer: "An inner scope (a function or block) sits inside an outer one and can read variables from every scope surrounding it, out to the global scope — but the reverse isn't true: an outer scope can't see variables declared inside an inner one." },
      { question: "If you declare a variable with `let` inside a function, can code outside that function access it?", answer: "No — once the function (or block) ends, that variable is out of scope and inaccessible from the outside; there is no way to reach it except by the function explicitly returning or exposing its value." },
      { question: "What happens if you assign to a name with no `let`, `const`, or `var` at all, like `total = 5;`?", answer: "In non-strict mode, JavaScript silently creates an undeclared global variable — no error, but a variable that pollutes the global scope and wasn't intentionally declared anywhere. In strict mode (`\"use strict\"`, or inside any ES module or class), the same line throws a `ReferenceError` instead." },
      { question: "Why is relying on implicit globals (assigning without a declaration keyword) considered risky?", answer: "It creates a variable outside of any controlled scope, invisible at a glance to anyone reading the surrounding function, and it can silently collide with a same-named variable elsewhere in a large codebase — bugs from this are exactly what strict mode's `ReferenceError` behavior for undeclared assignment is designed to catch early." },
      { question: "Explain the TDZ in terms of lexical environments.", answer: "When the engine enters a scope, it creates a lexical environment and immediately registers every `let`/`const` name declared anywhere in that scope, but marks each one's binding as uninitialized rather than giving it a value. Only when execution actually reaches the declaration statement does the binding get marked initialized and receive its value — any lookup of that name before that point finds an uninitialized binding and throws, which is the TDZ in mechanical terms." },
      { question: "Why does JavaScript bother having a TDZ instead of just initializing `let`/`const` to `undefined` like `var`?", answer: "It turns a class of bugs — reading a variable before the line that's supposed to set it up — into an immediate, loud error instead of a silent `undefined` that might not surface a problem until much later. It also keeps `const` semantically consistent: a `const` implicitly initialized to `undefined` and then \"assigned\" its real value later would effectively be reassigned, which `const` isn't supposed to allow." },
      { question: "What's the key hoisting difference between a function declaration and a `let`/`var` declaration?", answer: "A function declaration is hoisted along with its entire body, so it can be called before the line it's written on. A `var` declaration is hoisted but only initialized to `undefined`, and a `let`/`const` declaration is hoisted but left uninitialized (TDZ) — only the function declaration gives you working behavior early; the others just give you the name reserved." },
      { question: "Why does using `let` instead of `var` fix the classic loop-and-`setTimeout` bug?", answer: "With `var`, there's a single shared binding for the whole loop, so by the time any callback runs, every one of them sees the loop variable's final value. With `let`, the loop creates a brand-new binding scoped to each individual iteration, so each callback closes over its own separate copy holding that iteration's value." },
      { question: "Can two variables with the same name coexist in nested scopes at the same moment?", answer: "Yes — each scope has its own independent binding, so an inner `let x` and an outer `let x` are genuinely two different storage locations that happen to share a name. Which one a piece of code sees is resolved lexically: the engine looks for the name starting in the current scope and works outward, stopping at the first match — the innermost one wins for any code inside it." },
      { question: "Output-prediction: what does `console.log(x); var x = 5;` print, and why not a `ReferenceError`?", answer: "It logs `undefined`, not a `ReferenceError`. `var x` is hoisted to the top of the scope and initialized to `undefined` immediately, so the `console.log` sees that placeholder value — the assignment `x = 5` hasn't run yet at that point." },
      { question: "Output-prediction: what does `console.log(y); let y = 5;` do?", answer: "It throws `ReferenceError: Cannot access 'y' before initialization`. `y` is hoisted but stays in the Temporal Dead Zone until its declaration line runs, so reading it one line earlier hits the TDZ instead of returning `undefined`." },
      { question: "Output-prediction: what does `let count = 1; { let count = 2; console.log(count); } console.log(count);` log?", answer: "It logs `2`, then `1`. The `{ }` block creates a new scope, and `let count = 2` inside it shadows the outer `count` for the duration of that block; once the block ends, that inner binding is gone and the final `console.log` sees the untouched outer `count`, still `1`." },
      { question: "Output-prediction: what does `for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }` log?", answer: "It logs `3, 3, 3`. All three callbacks close over the same single `var i` binding (function-scoped, shared across every iteration), and by the time any of them actually runs — after the loop has finished — `i` has already reached `3`." },
      { question: "Output-prediction: if you replace `var i` with `let i` in the same loop, `for (let i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }`, what does it log now, and why?", answer: "It logs `0, 1, 2`. `let` in a `for` loop's header creates a fresh binding for each iteration, so each arrow function captures a separate `i` holding that iteration's own value at the time it was created." },
      { question: "Output-prediction: why does `const point = { x: 1 }; point = { x: 2 };` throw, and what's the exact error?", answer: "It throws `TypeError: Assignment to constant variable.` — `point =` is a reassignment of the binding itself, which `const` forbids, regardless of the fact that the new value is a similarly-shaped object. Writing `point.x = 2` instead would work fine, since that mutates the existing object rather than reassigning the binding." },
      { question: "Trap: a teammate declares a loop counter with `const i` in a classic `for` loop and it immediately throws. Why?", answer: "A standard `for (const i = 0; i < 3; i++)` throws a `TypeError` on the very first iteration, because `i++` tries to reassign `i`, which `const` doesn't allow. `const` only works as a `for` loop variable in a `for...of`/`for...in` loop, where a fresh, separately-initialized binding is created for each iteration rather than being reassigned in place." },
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
Not all values are the same kind of thing. The number 5, the word "hello",
and a true/false answer all behave differently. JavaScript groups values
into a small set of **data types** so it knows how to handle each one.

The most common ones you'll use constantly:

- **String** — text, written in quotes: \`"hello"\`
- **Number** — any number: \`42\`, \`3.14\`
- **Boolean** — true or false: \`true\`, \`false\`
- **Undefined** — a variable that has been declared but has no value yet
- **Null** — a value that's intentionally empty
- **Object** — a collection of related data (including arrays and functions)
    `.trim(),
    analogy:
      "Think of a toolbox with different compartments — one for screws, one for nails, one for tape. Data types are those compartments; they tell you what kind of thing you're holding so you know what you can do with it.",
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
          "The `+` operator behaves differently depending on the types of its two values — this is exactly why knowing a value's type matters.",
      },
    ],
    howItWorks: `
When JavaScript stores a value, it tags it internally with a type. This tag
determines which operations are allowed — you can do math on numbers, but
adding two strings joins them together instead ("2" + "3" becomes "23", not
5). Knowing the type of a value tells you how it will behave.
    `.trim(),
    whyItExists: `
Different kinds of data need different rules. Text needs to be joined and
searched; numbers need to be added and compared; true/false values need to
drive decisions. Types let the language apply the right rules automatically.
    `.trim(),
    whenToUse: `
You actively think about data types whenever you're not sure what kind of
value you're dealing with — checking user input, debugging an unexpected
result, or deciding whether two values can be safely compared or combined.
\`typeof\` is the quick way to check.
    `.trim(),
    whenNotToUse: `
You don't need to manually check the type of a value you created yourself
and already know the shape of — sprinkling \`typeof\` checks everywhere just
adds noise. Save type-checking for boundaries: user input, API responses,
and function arguments coming from code you don't control.
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
      { question: "What are the basic data types built into JavaScript?", answer: "Seven primitive types — String, Number, Boolean, Undefined, Null, Symbol, and BigInt — plus Object, which covers everything else: plain objects, arrays, functions, dates, and more." },
      { question: "What's the difference between a primitive and an object?", answer: "A primitive holds its actual value directly and is compared/copied by value — two strings with the same characters are equal. An object holds a reference to a location in memory, and variables pointing to it are compared/copied by that reference — two separately created objects with identical contents are not `===` equal." },
      { question: "What does `typeof` return for a string, a number, and a boolean?", answer: "`\"string\"`, `\"number\"`, and `\"boolean\"` respectively — `typeof` returns a string naming the value's type, which is useful for quick checks at runtime." },
      { question: "What's the difference between `null` and `undefined`?", answer: "`undefined` is what JavaScript itself assigns automatically — a declared-but-unassigned variable, a missing function argument, a missing object property — it means nothing has been set here yet. `null` is a value a developer assigns deliberately to represent intentionally empty or no value." },
      { question: "What is `NaN`, and what does the name stand for?", answer: "\"Not a Number\" — it's the special value returned by numeric operations that don't produce a valid number, like `0 / 0` or `Number(\"abc\")`. Despite the name, `typeof NaN` is `\"number\"`, since it's still technically a member of the Number type." },
      { question: "Is an array its own separate data type in JavaScript?", answer: "No — arrays are a specialized kind of object (with numeric-like indices and a `length` property), not a distinct primitive type. `typeof []` returns `\"object\"`, and checking for an array specifically requires `Array.isArray()`." },
      { question: "Is a function a data type in JavaScript?", answer: "Functions are objects too — technically callable objects. `typeof` treats them specially and returns `\"function\"` rather than `\"object\"`, which is the one case where `typeof` distinguishes a callable object from a plain one." },
      { question: "What does `typeof null` return, and why is that surprising?", answer: "It returns `\"object\"`, even though `null` is one of the primitive types, not an object. It's a long-standing bug from the original 1995 implementation — `null` was represented internally with the same type tag as objects — and it's been kept ever since purely for backward compatibility." },
      { question: "What does `typeof` return for an array, and how would you actually check for one?", answer: "`typeof []` returns `\"object\"`, same as for any plain object — `typeof` can't tell arrays apart from other objects. Use `Array.isArray(value)` instead, which checks specifically for array-ness." },
      { question: "What does `typeof` return for a function?", answer: "`\"function\"` — the one case where `typeof` gives a more specific answer than `\"object\"` for something that's technically an object under the hood." },
      { question: "What is type coercion?", answer: "The automatic conversion of a value from one type to another that JavaScript performs when an operation expects a different type than what it was given — e.g. converting a number to a string so `+` can join it with an existing string." },
      { question: "Why does `\"2\" + 3` produce `\"23\"` while `\"2\" - 1` produces `1`?", answer: "`+` has a special rule: if either operand is a string, it converts the other operand to a string and concatenates. Every other arithmetic operator, including `-`, has no string-joining behavior at all, so it instead converts both operands to numbers first — `\"2\"` becomes `2`, and `2 - 1` is `1`." },
      { question: "What's the difference between implicit and explicit type conversion?", answer: "Implicit conversion (coercion) happens automatically as a side effect of an operation, like `\"5\" * 2` silently becoming `10`. Explicit conversion is when the code deliberately converts a value, like `Number(\"5\")` or `String(5)`, making the intent visible instead of relying on an operator's built-in rules." },
      { question: "How would you explicitly convert a string to a number?", answer: "`Number(\"42\")`, `parseInt(\"42\")` / `parseFloat(\"42.5\")`, or the unary `+\"42\"` shorthand all work — `Number()` and unary `+` require the whole string to be numeric or they return `NaN`, while `parseInt`/`parseFloat` parse as much of a leading numeric portion as they can and ignore the rest." },
      { question: "How would you explicitly convert a number to a string?", answer: "`String(42)`, `(42).toString()`, or concatenating with an empty string like `42 + \"\"` (which relies on implicit coercion rather than being truly explicit) all produce `\"42\"`." },
      { question: "What is `BigInt`, and why does it exist?", answer: "A primitive type for representing whole numbers larger than `Number` can safely hold (`Number.MAX_SAFE_INTEGER`, 2^53 - 1) without losing precision. You create one by appending `n` to an integer literal, e.g. `123n`, and `BigInt` values can't be mixed with regular numbers in arithmetic without an explicit conversion." },
      { question: "What is `Symbol`, and what is it typically used for?", answer: "A primitive type that produces a guaranteed-unique value every time it's created (`Symbol(\"id\") !== Symbol(\"id\")`), commonly used as an object property key that won't collide with any string key or another symbol — useful for adding metadata to objects without risking a name clash." },
      { question: "Why is `NaN === NaN` false?", answer: "By the IEEE 754 floating-point specification (which JavaScript's Number type follows), `NaN` is defined to never equal anything, including itself — it represents \"not a valid numeric result\" rather than any specific value that could be compared." },
      { question: "How do you correctly check whether a value is `NaN`?", answer: "`Number.isNaN(value)`, which only returns `true` for the actual `NaN` value. The older global `isNaN(value)` first coerces its argument to a number, so `isNaN(\"hello\")` also returns `true` even though `\"hello\"` isn't literally `NaN`." },
      { question: "What's the difference between `Number.isNaN()` and the global `isNaN()`?", answer: "`Number.isNaN()` checks strictly — it returns `true` only if the value is exactly `NaN`, no conversion involved. The global `isNaN()` coerces its argument to a number first, which means non-numeric values like `isNaN(\"abc\")` also return `true`, even though `\"abc\"` was never `NaN` to begin with." },
      { question: "Is JavaScript strongly or weakly typed, and what does that mean in practice?", answer: "Weakly typed — operators freely convert between types instead of raising errors when types don't match, e.g. `\"5\" * 2` silently becomes `10` rather than throwing. This makes some code more forgiving to write but is a common source of subtle bugs when a conversion happens somewhere the developer didn't intend." },
      { question: "Is JavaScript statically or dynamically typed?", answer: "Dynamically typed — a variable's type isn't checked or fixed at compile time; the type lives with the current value and is only known and checked while the code actually runs. This is what TypeScript's static type system is layered on top to address." },
      { question: "Can a variable's type change after it's declared?", answer: "Yes — since JavaScript is dynamically typed, a variable is just a name bound to whatever value it currently holds. `let x = 5; x = \"now text\";` is completely legal; the variable itself has no fixed type, only the value assigned to it at any given moment does." },
      { question: "Why are primitives compared by value while objects are compared by reference?", answer: "Primitives are stored directly, so comparing two of them means comparing their actual contents — `\"cat\" === \"cat\"` is `true` because the characters match. Objects are stored as a reference to a location in memory, so `===` compares whether two variables point to the exact same object, not whether their contents look the same — two separately created objects with identical properties are still `!==`." },
      { question: "What happens when you access a property on a primitive, like `\"hello\".length`?", answer: "JavaScript temporarily wraps the primitive in its corresponding object type (a `String` object, here), reads the property off that wrapper, and then discards the wrapper immediately — the primitive itself never actually becomes an object; this \"auto-boxing\" just makes property/method access on primitives work transparently." },
      { question: "Output-prediction: what does `typeof typeof 1` evaluate to?", answer: "`\"string\"`. The inner `typeof 1` evaluates first and returns the string `\"number\"`; the outer `typeof` then runs on that string value, and the type of any string is `\"string\"`." },
      { question: "Output-prediction: what does `console.log(1 + \"1\"); console.log(1 - \"1\");` log?", answer: "It logs `\"11\"` then `0`. `+` sees a string operand and coerces the number to a string, concatenating them. `-` has no string-joining behavior, so it coerces the string `\"1\"` to the number `1` instead, giving `1 - 1 = 0`." },
      { question: "Output-prediction: what does `console.log([1, 2, 3] + [4, 5, 6])` log?", answer: "It logs the string `\"1,2,34,5,6\"`. `+` on two objects (arrays are objects) coerces both to strings first — an array's default string conversion joins its elements with commas — producing `\"1,2,3\"` and `\"4,5,6\"`, which are then concatenated." },
      { question: "Output-prediction: what does `null == undefined` evaluate to? What about `null === undefined`?", answer: "`null == undefined` is `true` — the specification special-cases loose equality between `null` and `undefined` to treat them as equal to each other (but to nothing else). `null === undefined` is `false`, because strict equality also requires the same type, and Null and Undefined are different types." },
      { question: "Output-prediction: what does `typeof NaN` return?", answer: "`\"number\"`. Despite meaning \"not a number,\" `NaN` is a special value that still belongs to the Number type — it represents an invalid numeric result, not an absence of a number." },
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
You constantly need to do things with values — add two numbers together,
check which of two is bigger, or combine two conditions into one decision.
JavaScript gives you a set of symbols, called **operators**, that do exactly
that: each one takes one or more values and produces a result.

A few groups you'll use daily:

- **Arithmetic**: \`+ - * / %\` for math
- **Comparison**: \`=== !== > < >= <=\` for comparing two values
- **Logical**: \`&& || !\` for combining true/false conditions
- **Assignment**: \`= += -=\` for storing or updating a value
    `.trim(),
    analogy:
      "Operators are like the buttons on a calculator — each one takes the numbers you've entered and does a specific, predictable action with them.",
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
          "`&&` requires both sides to be true; `||` only needs one side to be true. Both are common ways to combine multiple conditions into one decision.",
      },
    ],
    howItWorks: `
Each operator takes one or two values (called operands) and produces a
result. \`+\` takes two numbers and produces their sum. \`===\` takes two values
and produces a boolean — true if they match exactly, false otherwise.
    `.trim(),
    whyItExists: `
Programs constantly need to calculate, compare, and combine values to make
decisions. Operators are the basic building blocks for all of that logic.
    `.trim(),
    whenToUse: `
Use arithmetic operators whenever your code needs to calculate something,
and comparison operators whenever it needs to make a decision. Logical
operators (\`&&\`, \`||\`) come in whenever that decision depends on more than
one condition at once.
    `.trim(),
    whenNotToUse: `
Avoid \`==\` in new code — its type-converting comparisons cause more bugs
than they prevent; \`===\` should be your default. And don't chain more
logical operators into one expression than a reader can parse at a glance —
split a complex condition into a well-named variable instead.
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
      { question: "What's the difference between `==` and `===`?", answer: "`==` (loose equality) converts operands to a common type before comparing if they differ, which can produce surprising matches like `\"5\" == 5`. `===` (strict equality) compares both value and type with no conversion, so mismatched types are never equal — it's the safer default in almost every case." },
      { question: "What does the `%` (modulo) operator do?", answer: "It returns the remainder left over after dividing the left operand by the right one — `10 % 3` is `1`, because 3 goes into 10 three times with 1 left over. It's the standard way to check divisibility (`n % 2 === 0` for even) or wrap a number into a fixed range." },
      { question: "What's the difference between `=`, `==`, and `===`?", answer: "`=` is assignment — it stores a value into a variable and isn't a comparison at all. `==` and `===` are both comparisons that produce a boolean; `==` allows type conversion before comparing, `===` doesn't. Accidentally writing `=` inside a condition where `==`/`===` was intended is a classic bug, since `if (x = 5)` assigns 5 to x and then evaluates the condition as truthy." },
      { question: "What do `&&` and `||` do?", answer: "`&&` (logical AND) requires both operands to be truthy for the overall expression to be truthy; `||` (logical OR) only needs at least one operand to be truthy. Both are used to combine multiple conditions into a single true/false decision." },
      { question: "What does the `!` operator do?", answer: "It's logical NOT — it converts its operand to a boolean and flips it, so `!true` is `false` and `!0` is `true` (since `0` is falsy). Doubling it, `!!value`, is a common shorthand for converting any value to its boolean truthy/falsy equivalent." },
      { question: "What is short-circuit evaluation?", answer: "JavaScript stops evaluating a logical expression as soon as the overall result is already determined by the operands it's seen so far, instead of always evaluating every operand — in `a || b`, if `a` is truthy the result is already known to be truthy, so `b` is never evaluated at all." },
      { question: "Why does `a || b` sometimes not evaluate `b` at all?", answer: "Because `||` only needs one truthy operand to know the whole expression is truthy — once `a` turns out truthy, evaluating `b` couldn't change the answer, so the engine skips it entirely. This matters if `b` is a function call with side effects: those side effects simply won't happen." },
      { question: "If both operands of `&&` are truthy, what does the expression actually evaluate to?", answer: "Not `true` — `&&` returns the second operand's actual value if the first is truthy (since the first no longer determines the result), so `\"a\" && \"b\"` evaluates to `\"b\"`, not `true`. It only looks like a boolean when the operands themselves happen to be booleans." },
      { question: "If the first operand of `||` is truthy, what does the expression evaluate to?", answer: "The first operand's own value, not `true` — `||` returns as soon as it finds a truthy operand, so `\"hello\" || \"fallback\"` evaluates to `\"hello\"`. This is exactly the mechanism default-value patterns like `const name = input || \"Guest\";` rely on." },
      { question: "What is operator precedence, and how does it explain the result of `2 + 3 * 4`?", answer: "Precedence is the fixed order in which JavaScript evaluates operators when an expression mixes several of them, independent of left-to-right reading order. Multiplication binds tighter than addition, so `3 * 4` is computed first (`12`), then `2 + 12` gives `14`, not `20`." },
      { question: "What's the difference between `x += 1` and `x = x + 1`?", answer: "Functionally nothing — `+=` is shorthand that reads `x`, adds `1`, and reassigns the result back to `x`, exactly what the longer form does explicitly. It exists purely for brevity when updating a variable based on its own current value." },
      { question: "What is the nullish coalescing operator (`??`), and how does it differ from `||`?", answer: "`a ?? b` evaluates to `b` only when `a` is specifically `null` or `undefined` — any other falsy value like `0`, `\"\"`, or `false` is left alone and returned as-is. `||` falls back to `b` for any falsy `a`, which incorrectly overrides legitimate values like `0` or an empty string that were never meant to trigger a default." },
      { question: "What is optional chaining (`?.`), and what problem does it solve?", answer: "It short-circuits to `undefined` instead of throwing when you try to access a property through a `null` or `undefined` value partway down a chain — `user?.address?.city` returns `undefined` safely if `user` or `address` is missing, instead of throwing `TypeError: Cannot read properties of undefined`." },
      { question: "What's the difference between `++x` (prefix) and `x++` (postfix)?", answer: "Both increment `x` by 1, but they differ in what the expression itself evaluates to: `++x` increments first and evaluates to the new value; `x++` evaluates to the old value first, and the increment happens after. This only matters when the increment is used inline as part of a larger expression, e.g. `arr[i++]` uses the current `i` for indexing, then increments it." },
      { question: "Why do `&&` and `||` return one of their actual operand values instead of a plain boolean?", answer: "It's a deliberate design choice that enables patterns beyond pure boolean logic — default values (`input || \"default\"`), guarded property access (`user && user.name`), and conditionally running a function (`isReady && doThing()`) all rely on these operators passing through a real value rather than collapsing everything to `true`/`false`." },
      { question: "What does `NaN == NaN` evaluate to? What about `NaN === NaN`?", answer: "Both are `false`. Neither loose nor strict equality special-cases `NaN` — per the IEEE 754 spec its underlying floats follow, `NaN` is defined to never equal any value, including itself, regardless of which equality operator is used." },
      { question: "Why does `0.1 + 0.2 === 0.3` evaluate to `false`?", answer: "JavaScript numbers are stored as IEEE 754 double-precision floats, which can't represent most decimal fractions exactly in binary. `0.1 + 0.2` actually computes to something like `0.30000000000000004`, which is not bit-for-bit equal to the literal `0.3` — comparing floating-point numbers for exact equality is unreliable in any language that uses this representation, not just JavaScript." },
      { question: "Output-prediction: what does `console.log(1 < 2 < 3)` log?", answer: "`true`, but not for the reason it looks like. `<` is left-associative, so it evaluates as `(1 < 2) < 3` — `1 < 2` is `true`, and then `true < 3` coerces `true` to `1`, and `1 < 3` is `true`. It happens to give the mathematically \"correct\" answer here, but the same pattern with different numbers, e.g. `3 < 2 < 1`, gives a misleading `true` too, since it becomes `false < 1` → `0 < 1`." },
      { question: "Output-prediction: what do `console.log(\"5\" == 5)` and `console.log(\"5\" === 5)` log?", answer: "`true` then `false`. `==` converts the string `\"5\"` to the number `5` before comparing, so they match. `===` refuses to convert types at all, and a string is never strictly equal to a number regardless of its content." },
      { question: "Output-prediction: what do `console.log(null ?? \"default\")` and `console.log(0 ?? \"default\")` log?", answer: "`\"default\"` then `0`. `??` only falls back when the left side is `null` or `undefined` — `null` qualifies, but `0` is a perfectly valid, non-nullish value, so it's returned as-is even though it's falsy." },
      { question: "Output-prediction: what does `let x = 5; console.log(x++ + ++x);` log?", answer: "It logs `12`. `x++` evaluates to the current value `5` (then bumps `x` to `6`); `++x` then bumps `x` to `7` first and evaluates to `7`. The expression becomes `5 + 7`, which is `12`, and `x` ends up `7`." },
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
Most real programs need to make decisions: "if the user is logged in, show
their name; otherwise, show a login button." Conditions are how you write
that decision in code.

The main tool is the \`if\` statement — it runs a block of code only when a
test is true, and can offer alternatives with \`else if\` and \`else\`.
    `.trim(),
    analogy:
      "It's like a fork in a road with a sign: 'If it's raining, take the covered path. Otherwise, take the shortcut.' Your code reads the sign and picks a path.",
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
          { code: "if (hour < 12)", explanation: "Checks whether it's before noon — it isn't, so this block is skipped." },
          { code: "} else if (hour < 18) {", explanation: "Only checked because the first condition was false; checks whether it's before 6pm — it is, so this block runs." },
          { code: "} else {", explanation: "Would run only if neither condition above matched." },
        ],
      },
      {
        title: "A ternary expression for a simple either/or",
        code: `const age = 20;

const message = age >= 18 ? "You can vote" : "You can't vote yet";
console.log(message); // "You can vote"`,
        explanation:
          "For a simple choice between two values, a ternary (`condition ? ifTrue : ifFalse`) is a compact one-line alternative to a full if/else.",
      },
    ],
    howItWorks: `
JavaScript checks the condition inside the parentheses. If it evaluates to
a **truthy** value — basically, anything except \`false\`, \`0\`, \`""\`, \`null\`,
\`undefined\`, or \`NaN\` (those are the "falsy" values) — it runs that block and
skips the rest. Otherwise, it moves to the next \`else if\` and repeats the
check, finally falling into \`else\` if nothing else matched.
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
A program that always does the exact same thing regardless of input isn't
very useful. Conditions let code adapt its behavior to the current data or
situation.
    `.trim(),
    whenToUse: `
Use conditions whenever your program's next step depends on data you don't
know in advance — a user's input, a value from an API, the current time.
Anytime you can describe your logic with the word "if," you're describing
a condition.
    `.trim(),
    whenNotToUse: `
If every branch of an \`if/else\` ends up doing almost the same thing, a
condition may be hiding a simpler solution — like a lookup object or a
default value — that avoids repeating yourself. And a \`switch\` (or a
lookup) usually reads better than five or more chained \`else if\` blocks
checking the same variable.
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
      { question: "What counts as a 'falsy' value in JavaScript, and how does that affect an `if` condition?", answer: "`false`, `0`, `-0`, `0n`, `\"\"` (empty string), `null`, `undefined`, and `NaN` are the only falsy values — every other value, including `\"0\"`, `[]`, and `{}`, is truthy. An `if` condition doesn't require a literal boolean; it converts whatever it's given to `true`/`false` using these rules before deciding which branch to run." },
      { question: "What is a ternary operator?", answer: "A compact, single-expression conditional: `condition ? valueIfTrue : valueIfFalse`. Unlike `if/else`, it's an expression that produces a value, so it can be used directly inside an assignment, a function argument, or a template string, not just as a standalone statement." },
      { question: "When would you reach for `switch` instead of `if/else`?", answer: "When you're comparing one single value against several specific, known possibilities — a status code, a day of the week, a menu option. It often reads more clearly than a long `else if` chain that keeps repeating the same variable, though for a small number of branches either works fine." },
      { question: "What's the difference between chaining `else if` and writing separate standalone `if` statements?", answer: "In an `else if` chain, only one branch ever runs — once a condition matches, the rest are skipped entirely. With separate `if` statements, every single one is checked independently and can run, even if an earlier one already matched, which usually isn't what's intended when the conditions overlap." },
      { question: "What happens if an `if` condition isn't a literal `true` or `false`, like `if (user)`?", answer: "JavaScript coerces whatever value the condition evaluates to into a boolean before deciding, using the truthy/falsy rules — `if (user)` runs its block whenever `user` is any truthy value (an object, a non-empty string, a non-zero number), and skips it for any falsy value, without ever needing an explicit `=== true`." },
      { question: "Does `switch` compare its cases with `==` or `===`?", answer: "Strict equality (`===`) — a `switch` never coerces types when matching, so `switch (1) { case \"1\": ... }` will not match, even though `1 == \"1\"` is `true` with loose equality." },
      { question: "What is 'fallthrough' in a `switch` statement, and why does `break` matter?", answer: "Without a `break`, execution doesn't stop after a matching case's code runs — it keeps falling into the code of the next case(s) below it, executing them too, until it hits a `break` or the end of the `switch`. `break` is what stops that and makes each case behave like an isolated branch." },
      { question: "Can you chain multiple `else if` blocks indefinitely? What decides which one actually runs?", answer: "Yes, there's no limit — JavaScript checks each condition top to bottom and runs the code for the very first one that evaluates truthy, then skips every remaining `else if`/`else` in that chain, even if a later condition would also have matched." },
      { question: "What's the practical difference between nesting `if` statements and chaining them with `else if`?", answer: "Nested `if`s check conditions that depend on each other (an inner check only makes sense once an outer one already passed), while an `else if` chain checks a series of mutually exclusive alternatives for the same overall decision. Using deep nesting for what's really a set of alternatives makes code harder to read than a flat `else if` chain would." },
      { question: "Why might a lookup object be a better choice than a long `else if` chain?", answer: "When every branch just maps one specific input to one specific output (e.g. a status code to a message), a plain object used as a lookup table (`messages[code]`) replaces the whole chain with a single property access — it's shorter, avoids repeating the same variable name in every condition, and is easy to extend by just adding a key." },
      { question: "Why does `if (0)` skip its block, but `if (\"0\")` run it?", answer: "The number `0` is one of the fixed falsy values, so it coerces to `false`. The string `\"0\"` is a non-empty string, and every non-empty string is truthy regardless of its content — string truthiness depends only on length, not on what characters are inside." },
      { question: "Can a `switch` statement handle range checks or complex boolean conditions directly, like `age > 18`?", answer: "Not directly, since `switch` matches by strict equality against a fixed set of values. A common workaround is `switch (true) { case age > 18: ... }`, which works because each `case` expression is evaluated and compared against `true` — but at that point an `if/else if` chain is usually clearer." },
      { question: "Beyond syntax, what's a real difference between a ternary and an `if/else` statement?", answer: "A ternary is an expression — it always produces a value that can be used directly (assigned, passed as an argument, interpolated into a string). An `if/else` is a statement — it doesn't produce a usable value itself, so using it to choose a value requires first declaring a variable and assigning to it inside each branch." },
      { question: "Output-prediction: does `if ([]) console.log(\"truthy\"); else console.log(\"falsy\");` log \"truthy\" or \"falsy\", and why does that surprise people?", answer: "It logs `\"truthy\"`. An empty array is an object, and every object — including `[]` and `{}` — is truthy regardless of whether it has any contents; only the specific fixed list of falsy values (`false`, `0`, `\"\"`, `null`, `undefined`, `NaN`) is falsy, and an empty array isn't on that list." },
      { question: "Output-prediction: what does `switch (1) { case \"1\": console.log(\"string one\"); break; case 1: console.log(\"number one\"); break; default: console.log(\"none\"); }` log?", answer: "It logs `\"number one\"`. `switch` compares with strict equality, so the number `1` doesn't match the case `\"1\"` (different types) and falls through to check `case 1`, which matches exactly." },
      { question: "Output-prediction: what does `let result; if (false) { result = \"a\"; } console.log(result);` log?", answer: "It logs `undefined`. `result` is declared but never assigned, since the `if` block's condition is `false` and its body never runs — there's no `else` to give it a value either, so it keeps its default `undefined`." },
      { question: "Trap: what's the bug in `switch (color) { case \"red\": console.log(\"stop\"); case \"green\": console.log(\"go\"); break; }`, and what does it print for `color = \"red\"`?", answer: "It prints both `\"stop\"` and `\"go\"`. The `\"red\"` case is missing a `break`, so after running its own code, execution falls through into the next case's code unconditionally, regardless of whether `color` actually matched `\"green\"`." },
      { question: "Output-prediction: what does `age >= 18 ? \"adult\" : age >= 13 ? \"teen\" : \"child\"` evaluate to when `age` is `15`?", answer: "`\"teen\"`. Nested ternaries evaluate like chained `else if`s: `age >= 18` is `false`, so the expression falls to the part after the first `:`, which is itself another ternary — `age >= 13` is `true` for `15`, so that inner ternary evaluates to `\"teen\"`." },
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
Sometimes you need to do the same thing many times — print every item in a
list, check every user, count from 1 to 100. Writing that out by hand would
be tedious and error-prone. A **loop** repeats a block of code automatically,
either a fixed number of times or until a condition is no longer true.

The two you'll use most:

- **for** — when you know how many times to repeat (or you're going through a list)
- **while** — when you want to repeat until some condition becomes false
    `.trim(),
    analogy:
      "A loop is like giving someone instructions: 'Keep folding laundry until the basket is empty.' They don't need a new instruction for every item — just one instruction repeated.",
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
          { code: "let i = 1", explanation: "Runs once, before the loop starts: creates a counter starting at 1." },
          { code: "i <= 5", explanation: "Checked before every pass — the loop keeps going as long as this is true." },
          { code: "console.log(i);", explanation: "The part that actually repeats — prints the current value of i." },
          { code: "i++", explanation: "Runs after every pass, increasing i by 1 before the condition is checked again." },
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
          "`for...of` loops directly over the values in an array (or any other iterable), so there's no counter to manage and no risk of an off-by-one error.",
      },
    ],
    howItWorks: `
Before each pass through the loop, JavaScript checks the condition. If it's
true, it runs the loop's body, then checks again. This repeats until the
condition becomes false, at which point the loop stops and the program
continues after it.
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
Loops let you write one small block of logic and apply it to many items or
many repetitions, instead of duplicating code — which would be both tedious
and hard to change later.
    `.trim(),
    whenToUse: `
Use a loop whenever you need to repeat the same action for every item in a
collection, or repeat something an unknown number of times until a
condition is met — processing a list, retrying a request, counting down a
timer.
    `.trim(),
    whenNotToUse: `
If you already know you only need to do something a fixed, small number of
times, a loop can be overkill — a couple of plain repeated statements are
sometimes clearer. And for common patterns like transforming every item in
an array, methods like \`.map()\` and \`.filter()\` are usually more readable
than a manual loop.
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
      { question: "What's the difference between `for` and `while`?", answer: "A `for` loop bundles the counter's setup, condition, and update into one line, which makes it the natural fit when you know in advance how many times (or over what range) you need to repeat. A `while` loop only has a condition, checked before each pass, making it the natural fit when repetition depends on something that isn't a simple counter — no fixed number of iterations known ahead of time." },
      { question: "What causes an infinite loop?", answer: "A loop whose condition never becomes false — most often because the code that's supposed to change the value being tested (like `i++` in a `for` loop, or updating a flag in a `while` loop) is missing, runs on the wrong branch, or accidentally moves the value in the wrong direction." },
      { question: "What do `break` and `continue` do?", answer: "`break` immediately exits the loop entirely — no further iterations run. `continue` skips only the rest of the current iteration's body and jumps straight to the next iteration's condition check, without exiting the loop." },
      { question: "What is a `for...of` loop, and what does it iterate over?", answer: "A loop that iterates directly over the values of any iterable — arrays, strings, Maps, Sets — without needing an index variable at all, so there's no counter to manage and no risk of an off-by-one mistake." },
      { question: "What's the difference between `for...of` and `for...in`?", answer: "`for...of` iterates over the values of an iterable (an array's elements, a string's characters). `for...in` iterates over the enumerable property keys of an object, given back as strings — using it on an array gives you the indices as strings (`\"0\"`, `\"1\"`, ...) rather than the values, and it's generally reserved for plain objects, not arrays." },
      { question: "What is a `do...while` loop, and how does it differ from a regular `while` loop?", answer: "It runs the loop body once before checking the condition for the first time, then continues checking before each subsequent pass, like a normal `while`. That guarantees at least one execution of the body even if the condition is false from the start, which a regular `while` loop never does." },
      { question: "What is an 'off-by-one' error, and how does it typically happen in a loop?", answer: "Running a loop one time too many or too few — usually from using `<=` when `<` was intended (or vice versa) in the condition, causing the loop to include or skip one extra element at a boundary, like looping `i <= array.length` and reading one index past the end of the array." },
      { question: "Why does modifying an array's length while looping over it with a classic indexed `for` loop cause bugs?", answer: "The loop's index keeps advancing based on the array's current length and contents at each check, but removing or adding elements shifts every subsequent element's index — so the loop can skip an element that shifted into an already-visited position, or process the same element twice, without ever throwing an error to flag it." },
      { question: "Inside a nested loop, does a plain `break` exit both loops or just the inner one?", answer: "Just the inner loop — a bare `break` only exits the nearest enclosing loop. To exit an outer loop from inside a nested one, you need a labeled statement, like `outer: for (...) { for (...) { break outer; } } `." },
      { question: "Can you use `continue` inside a `for...of` loop?", answer: "Yes — it works exactly like in any other loop, skipping the rest of the current iteration's body and moving on to the next value in the iterable." },
      { question: "Why is `for...of` generally preferred over a classic indexed `for` loop when you just need each value?", answer: "It removes an entire category of bugs tied to manually managing an index — off-by-one errors, wrong comparison operators, forgetting to increment — and it reads more directly as 'for each value in this collection,' since there's no counter variable cluttering the intent." },
      { question: "What's a key behavior difference between a classic `for` loop and `.forEach()`?", answer: "`.forEach()` calls a callback function once per element, which means it has its own function scope per call and works well with `let`/`const` closures naturally, but it also means `break`/`continue`/`return` don't affect the overall iteration the way they do in a real loop — you can't stop a `.forEach()` early." },
      { question: "Can `break` be used inside `.forEach()`? Why or why not?", answer: "No — `break` is a loop-control statement that only works inside actual loop constructs (`for`, `while`, `do...while`). `.forEach()` is a regular function that happens to be called repeatedly, not a loop syntactically, so `break` inside its callback is a `SyntaxError`. To stop early, you need a real loop, `for...of` with `break`, or a method like `.some()`/`.find()` that stops itself once satisfied." },
      { question: "Why does a `let` counter in a `for` loop create a new binding on every iteration, and why does that matter for closures?", answer: "The language spec specifically defines `for (let i ...)` to re-create and re-initialize a fresh `i` binding for each iteration (copying forward the previous value), rather than reusing one shared binding for the whole loop. This is exactly what lets a closure created inside the loop body — like a `setTimeout` callback — capture that iteration's own separate value of `i`, instead of every callback sharing one final value the way they would with `var`." },
      { question: "Output-prediction: what does `for (let i = 0; i < 3; i++) { if (i === 1) continue; console.log(i); }` log?", answer: "It logs `0` then `2`. When `i` is `1`, `continue` skips the rest of that iteration's body — the `console.log` never runs for `i = 1` — and the loop moves straight on to `i = 2`." },
      { question: "Output-prediction: what does `outer: for (let i = 0; i < 2; i++) { for (let j = 0; j < 2; j++) { if (j === 1) continue outer; console.log(i, j); } } ` log?", answer: "It logs `0 0` then `1 0`. `continue outer` skips straight to the next iteration of the labeled outer loop as soon as `j` is `1`, before the inner loop's `console.log` for `j = 1` ever runs — so each outer pass only ever gets to log its `j = 0` case." },
      { question: "Trap: what's wrong with `let i = 0; while (i < 5) { console.log(i); }`, and what actually happens when it runs?", answer: "It's an infinite loop that logs `0` forever — nothing inside the loop body ever changes `i`, so the condition `i < 5` stays true on every check. It's missing something like `i++;` inside the block to make progress toward the loop eventually ending." },
      { question: "Output-prediction: what does `const arr = [\"a\", \"b\", \"c\"]; for (const index in arr) { console.log(typeof index); }` log?", answer: "It logs `\"string\"` three times. `for...in` enumerates an array's property keys, and array indices — even though you'd normally think of them as numbers — are handed over as strings (`\"0\"`, `\"1\"`, `\"2\"`), which is one reason `for...in` is discouraged for arrays in favor of `for...of` or indexed access." },
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
As programs grow, you end up needing to do the same task in multiple
places — calculate a total, validate an email, format a date. Instead of
repeating that logic everywhere, you wrap it in a **function**: a named
block of code you can "call" whenever you need it.

A function can accept inputs (called **parameters**) and can send back a
result (using \`return\`).
    `.trim(),
    analogy:
      "A function is like a recipe. You give it ingredients (parameters), it follows a set of steps, and it hands you back a finished dish (the return value). You can reuse the same recipe as many times as you want.",
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
          { code: "function add(a, b) {", explanation: "Defines a function named add that expects two inputs, a and b." },
          { code: "return a + b;", explanation: "Sends the sum of a and b back to wherever add was called." },
          { code: "}", explanation: "Marks the end of the function's code." },
          { code: "const result = add(2, 3);", explanation: "Calls add with 2 and 3, storing the returned value (5) in result." },
        ],
      },
      {
        title: "Arrow function shorthand",
        code: `const add = (a, b) => a + b;`,
        explanation: "Arrow functions are a shorter way to write simple functions, especially common in modern JavaScript.",
      },
    ],
    howItWorks: `
When you call a function, JavaScript pauses the current line, jumps into
the function's code, runs it with the arguments you passed in, and — if
there's a \`return\` statement — sends a value back to exactly where the
function was called from. Execution then continues from there.
    `.trim(),
    whyItExists: `
Functions let you name a piece of logic once and reuse it anywhere, which
keeps code shorter, easier to test, and easier to change — you only fix a
bug in one place instead of everywhere it was copy-pasted.
    `.trim(),
    whenToUse: `
Write a function any time you find yourself about to write the same few
lines of logic more than once, or whenever a chunk of code does one clear,
nameable thing — validating an email, calculating a total, formatting a
date.
    `.trim(),
    whenNotToUse: `
Don't wrap a single line you only use once in its own function just for
the sake of it — that can add an extra layer of indirection without any
real benefit. And if a function is trying to do five unrelated things,
that's usually a sign it should be split into several smaller, focused
functions instead.
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
      { question: "What's the difference between a parameter and an argument?", answer: "A parameter is the placeholder name written in the function's own definition (`function add(a, b)` — `a` and `b` are parameters). An argument is the actual value supplied at the call site (`add(2, 3)` — `2` and `3` are arguments)." },
      { question: "What happens if a function has no `return` statement?", answer: "It implicitly returns `undefined` once execution reaches the end of the function body — calling it never throws, but any code that tries to use its \"result\" will be working with `undefined`." },
      { question: "What's the difference between a function declaration and an arrow function?", answer: "Beyond the shorter syntax, arrow functions don't have their own `this`, `arguments` object, or `super`, and can't be used as constructors with `new` — they inherit `this` from the surrounding scope instead of getting a new one based on how they're called. Function declarations get their own `this` (determined by the call) and their own `arguments` object." },
      { question: "What's the difference between a function declaration and a function expression?", answer: "A function declaration (`function foo() {}`) is a standalone statement that's hoisted along with its full body, so it can be called earlier in the code than where it's written. A function expression (`const foo = function () {}`) creates the function as part of an assignment; the variable follows normal `let`/`const`/`var` hoisting rules, so the function itself isn't callable until that assignment line has actually run." },
      { question: "Can a function have more than one `return` statement?", answer: "Yes — a function can contain as many `return` statements as needed, often one per branch of an `if/else`. Whichever one actually executes first ends the function immediately at that point; any code after it in the function body doesn't run." },
      { question: "What happens if you call a function with fewer arguments than it has parameters?", answer: "The missing parameters are simply set to `undefined` (or to their default value, if one is specified) — JavaScript doesn't throw an error or complain about a mismatched argument count, unlike many statically typed languages." },
      { question: "What happens if you call a function with more arguments than it has declared parameters?", answer: "The extra arguments are accepted without error; they're just not bound to any named parameter. They're still accessible inside the function through the `arguments` object (in a regular function) or by declaring a rest parameter (`...args`) to collect them explicitly." },
      { question: "What is a default parameter, and when does its default value actually kick in?", answer: "A value specified in the function signature (`function greet(name = \"Guest\")`) that's used only when the corresponding argument is `undefined` — either because it was omitted entirely, or explicitly passed as `undefined`. Passing any other falsy value, like `null` or `0`, does not trigger the default." },
      { question: "What is a rest parameter, and how does it differ from the old `arguments` object?", answer: "`...args` as the last parameter collects any remaining arguments into a real array (`function sum(...nums) { ... }`), so array methods like `.map()` and `.reduce()` work on it directly. The older `arguments` object is available in every regular function automatically without declaring anything, but it's only array-like — it lacks array methods, and it isn't available at all inside arrow functions." },
      { question: "Are function declarations hoisted? What about function expressions?", answer: "Function declarations are hoisted completely, body included, so they can be called before the line they're written on. Function expressions (and arrow functions) are not hoisted as callable functions — only the variable they're assigned to follows its own declaration's hoisting rules (`undefined` for `var`, or the TDZ for `let`/`const`), so calling one before its assignment line either gets `undefined is not a function` or a TDZ `ReferenceError`." },
      { question: "What is a callback function?", answer: "A function passed as an argument into another function, to be invoked later — usually once some operation finishes or some event occurs, like the click handler passed to `addEventListener`, or the function passed to `.map()` that's run once per array element." },
      { question: "What is a higher-order function?", answer: "A function that either takes another function as an argument, returns a function as its result, or both — array methods like `.map()`, `.filter()`, and `.reduce()` are all higher-order functions because each one accepts a callback." },
      { question: "What is a closure, in plain terms?", answer: "A function that remembers the variables from the scope it was defined in, even after that outer scope has finished running — so a function returned from another function can keep reading and updating variables that technically belong to a call that's already completed." },
      { question: "What is recursion, and what must a recursive function have to avoid infinite recursion?", answer: "A function that calls itself to solve a smaller version of the same problem, repeating until it reaches a base case simple enough to answer directly without recursing further. Without that base case — a condition that stops the recursive calls — the function keeps calling itself indefinitely until it exceeds the call stack size and throws a `RangeError: Maximum call stack size exceeded`." },
      { question: "What is an IIFE (Immediately Invoked Function Expression), and why would you use one?", answer: "A function expression that's defined and called in the same statement, typically written as `(function () { ... })();`. It creates a private scope that runs once immediately — historically used before `let`/`const`/modules existed to avoid leaking variables into the global scope; it's much less necessary today but still shows up for one-off setup code." },
      { question: "Can a function be assigned to a variable, passed as an argument, or returned from another function? What does that make functions in JavaScript?", answer: "Yes to all three — this makes functions \"first-class citizens\" (or first-class values): they can be treated exactly like any other value (a number, a string, an object), stored, passed around, and returned, which is what makes patterns like callbacks, higher-order functions, and closures possible in the first place." },
      { question: "What's the practical difference between `function foo() {}` and `const foo = function () {}`?", answer: "Both create an equivalent function, but the first is a hoisted declaration usable before its line runs, while the second is an expression bound to a `const`, unusable until that assignment line executes. A subtler difference: the declaration's function always has the name `foo` for stack traces even if reassigned elsewhere, while a truly anonymous expression only gets an inferred name from the variable it's assigned to at creation time." },
      { question: "Why don't arrow functions have their own `this`? Where do they get it from instead?", answer: "Arrow functions were deliberately designed without their own `this` binding — they don't create a new `this` when called, but instead look up `this` lexically, exactly like any other variable: from the nearest enclosing non-arrow function (or the module/global scope) at the point where the arrow function was defined, not where it's called from." },
      { question: "Why can't arrow functions be used as constructors with `new`?", answer: "Using `new` relies on the function creating its own fresh `this` bound to the newly constructed object — arrow functions never create their own `this` at all, so there's nothing for `new` to bind, and JavaScript throws a `TypeError: X is not a constructor` if you try." },
      { question: "What is a pure function? Why are pure functions easier to test and reason about?", answer: "A function that, given the same inputs, always returns the same output and causes no observable side effects — it doesn't modify anything outside itself (no mutating arguments, no touching global state, no I/O). That makes it trivial to test in isolation (call it, check the output, no setup or teardown needed) and safe to reason about without tracking any state beyond its own inputs." },
      { question: "What does it mean for JavaScript functions to be 'first-class citizens'?", answer: "It means functions are treated as regular values rather than a special separate category — they can be stored in variables, put into arrays or object properties, passed as arguments, and returned from other functions, just like any number or string could be." },
      { question: "What's the difference between a function's arity and the number of arguments it's actually called with?", answer: "Arity is a fixed property of the function's own definition — the number of parameters it declares (`function add(a, b) {}` has an arity of 2). The number of arguments is decided per call site and can be more, fewer, or exactly equal to the arity; JavaScript doesn't enforce that the two match." },
      { question: "Are extra arguments passed beyond a function's declared parameters lost?", answer: "No — they're simply not assigned to a named parameter, but they still exist and are reachable, either through the `arguments` object in a regular function, or by explicitly capturing them with a rest parameter (`...rest`)." },
      { question: "What is currying, and how does it relate to closures?", answer: "Transforming a function that takes multiple arguments into a sequence of functions that each take one argument and return the next function in the chain, e.g. `add(a)(b)(c)` instead of `add(a, b, c)`. It relies entirely on closures — each returned inner function keeps access to the arguments already supplied to the outer functions that produced it." },
      { question: "Why can't arrow functions have their own `arguments` object?", answer: "It follows the same design as `this` — arrow functions don't create their own execution context binding for `arguments` either, so referencing `arguments` inside one looks it up lexically from the nearest enclosing regular function instead. Referencing `arguments` inside an arrow function with no enclosing regular function throws a `ReferenceError`." },
      { question: "Output-prediction: what does `function outer() { let count = 0; return function () { count++; return count; }; } const counter = outer(); console.log(counter()); console.log(counter());` log?", answer: "It logs `1` then `2`. `outer()` runs once and returns the inner function, but that inner function keeps a closure over `count` from that specific call — each time `counter()` is invoked afterward, it reads and updates that same remembered `count` rather than starting fresh." },
      { question: "Output-prediction: what does `sayHi(); function sayHi() { console.log(\"hi\"); }` do?", answer: "It logs `\"hi\"` successfully. Function declarations are hoisted along with their entire body, so `sayHi` is already fully defined and callable before execution even reaches the line where it's written." },
      { question: "Output-prediction: what does `sayBye(); const sayBye = function () { console.log(\"bye\"); };` do?", answer: "It throws `ReferenceError: Cannot access 'sayBye' before initialization`. `sayBye` is a `const` binding, so it's hoisted but left in the Temporal Dead Zone until its declaration line runs — the fact that the value being assigned is a function doesn't change how `const` hoisting works." },
      { question: "Output-prediction: given `const obj = { name: \"Ana\", greet() { console.log(this.name); }, greetArrow: () => console.log(this.name) };`, what does `obj.greet()` log compared to `obj.greetArrow()`?", answer: "`obj.greet()` logs `\"Ana\"` — a regular method's `this` is determined by its call-site, and calling it as `obj.greet()` binds `this` to `obj`. `obj.greetArrow()` does not log `\"Ana\"` — since arrow functions inherit `this` lexically from their surrounding scope rather than from how they're called, `this` here is whatever `this` was outside the object literal, never `obj`, regardless of how `greetArrow` is invoked." },
      { question: "Output-prediction: given `function add(a, b = 10) { return a + b; }`, what do `add(5)`, `add(5, undefined)`, and `add(5, null)` each return?", answer: "`15`, `15`, then `5`. The default parameter only applies when the argument is exactly `undefined` — both omitting it and passing `undefined` explicitly trigger the default `10`. Passing `null`, however, is a real, present value, so the default is skipped and `b` stays `null`; `5 + null` then coerces `null` to `0` in numeric addition, giving `5`." },
    ],
    prerequisites: ["loops"],
    relatedTopics: ["arrays", "scope", "callbacks", "higher-order-functions"],
    keywords: ["parameters", "arguments", "return", "arrow function"],
  },
];
