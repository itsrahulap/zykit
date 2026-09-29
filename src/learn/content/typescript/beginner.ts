import type { Topic } from "../../types/content";

export const typescriptBeginnerTopics: Topic[] = [
  {
    id: "what-is-typescript",
    title: "What is TypeScript?",
    level: "beginner",
    description:
      "JavaScript with an extra layer that checks the *shape* of your data before your code ever runs.",
    explanation: `
Picture a normal JavaScript function that adds two numbers:

\`function add(a, b) { return a + b; }\`

Nothing stops you from calling \`add("5", 10)\` by mistake. JavaScript won't
complain — it will just quietly turn \`"5" + 10\` into the string \`"510"\`,
and you won't find out something went wrong until the bug shows up
somewhere far downstream, maybe in production, maybe hours later.

Now imagine a tool that reads your code *before* you ever run it, and
says: "Hold on — \`add\` expects two numbers, but you're passing a string
here. This is almost certainly a mistake." That's the core idea. A layer
sits on top of JavaScript, lets you describe what *kind* of value each
variable, parameter, and return value is supposed to be, and then checks
that every part of your code is consistent with those descriptions —
catching an entire category of bugs while you're still typing, instead of
after the program runs. This is called **static typing** — "static"
because the checking happens by reading the code, not by running it.

That extra layer is **TypeScript**. It's not a separate language that
replaces JavaScript — it's JavaScript plus optional type annotations.
Because browsers and Node.js don't understand those annotations, a
TypeScript file (\`.ts\`) is run through a **compiler** that strips the
types back out and produces plain, ordinary JavaScript (\`.js\`) — the
exact same JavaScript you'd have written by hand, just checked for
mistakes first.
    `.trim(),
    analogy:
      "It's like a spell-checker for your code's data. You can still write whatever you want, but before you hit send, it underlines the parts that don't make sense — like passing a phone number where an email address was expected — so you can fix it before anyone else sees it.",
    examples: [
      {
        title: "A mistake JavaScript won't catch",
        code: `// plain JavaScript
function add(a, b) {
  return a + b;
}

add("5", 10); // returns "510", no error, no warning`,
        explanation:
          "JavaScript happily runs this. The bug is silent — it just produces a weird result and moves on.",
      },
      {
        title: "The same mistake in TypeScript",
        code: `// TypeScript
function add(a: number, b: number): number {
  return a + b;
}

add("5", 10);
// Error: Argument of type 'string' is not assignable
// to parameter of type 'number'.`,
        explanation:
          "The `: number` after each parameter is a type annotation. TypeScript reads this before running anything and flags the call as invalid — right in your editor, often as you type.",
        walkthrough: [
          { code: "function add(a: number, b: number): number {", explanation: "Declares that both parameters must be numbers, and that the function returns a number too." },
          { code: "return a + b;", explanation: "Ordinary JavaScript — TypeScript doesn't change how the code runs, only how it's checked." },
          { code: 'add("5", 10);', explanation: "Passing a string where a number is expected — TypeScript catches this mismatch before the code is ever executed." },
        ],
      },
    ],
    howItWorks: `
TypeScript code lives in \`.ts\` files. A program called the TypeScript
compiler (\`tsc\`) reads those files, checks every type annotation against
how the values are actually used, and reports any mismatches as errors.

If there are no errors (or you choose to ignore them), the compiler then
strips all the type annotations out and writes plain \`.js\` files — the
kind any browser or Node.js can run directly. The types themselves never
exist at runtime; they're purely a tool for catching mistakes ahead of
time. This is why people describe TypeScript as a "compile-time" layer: it
does its job before the program runs, then gets out of the way.
    `.trim(),
    diagram: `
you write:      app.ts (JavaScript + type annotations)
                     ↓
TypeScript compiler checks types, reports errors
                     ↓
                strips the types out
                     ↓
you get:        app.js (plain JavaScript)
                     ↓
              runs in browser / Node.js
    `.trim(),
    whyItExists: `
As JavaScript projects grow from a few hundred lines to hundreds of
thousands, small mistakes — passing the wrong kind of value, misspelling a
property name, forgetting that a value might be missing — become far more
common and far more expensive to track down. JavaScript itself has no way
to describe what a function or variable expects, so those mistakes only
surface when the code actually runs, sometimes in front of real users.

TypeScript was created (by Microsoft, first released in 2012) to let
large codebases describe those expectations explicitly, so tools and
compilers can catch violations immediately, instead of relying entirely on
tests and manual review to find them.
    `.trim(),
    whenToUse: `
Reach for TypeScript on any project that's going to grow, be touched by
more than one person, or live long enough that "what shape of data does
this function expect?" becomes hard to remember. It pays off especially in
teams, libraries other code depends on, and codebases where refactoring
needs to feel safe.
    `.trim(),
    whenNotToUse: `
For a five-minute throwaway script, a quick experiment, or a tiny snippet
where adding type annotations would take longer than writing the code
itself, plain JavaScript is often simpler and faster. TypeScript also adds
a build step — if that overhead genuinely doesn't pay for itself, it's
fine to skip it.
    `.trim(),
    commonMistakes: [
      "Thinking TypeScript is a completely different language from JavaScript — it's JavaScript with an added layer of type annotations that gets removed before the code runs.",
      "Believing TypeScript makes code run faster. It doesn't change runtime performance at all — it only catches mistakes earlier, before the code runs.",
      "Assuming type errors will stop the program from ever running. By default the compiler still produces JavaScript output even with errors, unless you configure it to refuse.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a JavaScript function `multiply(a, b)` with no types, then rewrite it in TypeScript adding `: number` annotations to both parameters and the return value." },
      { difficulty: "Medium", prompt: "In your rewritten TypeScript function, try calling it with a string argument and read the exact error TypeScript reports. Write down, in your own words, what the error is telling you." },
      { difficulty: "Hard", prompt: "Explain, without using the word \"TypeScript\", what problem static typing solves that plain JavaScript can't — as if explaining it to someone who has never programmed." },
    ],
    interviewQuestions: [
      { question: "What is TypeScript, in relation to JavaScript?", answer: "A superset of JavaScript that adds optional static type annotations, checked by a compiler before the code runs, which then strips those annotations and outputs plain JavaScript." },
      { question: "Does TypeScript code run directly in the browser?", answer: "No. It's compiled to plain JavaScript first; browsers and Node.js only ever run the resulting JavaScript, never the TypeScript source directly." },
      { question: "What is static typing, and what problem does it solve?", answer: "Checking that values match their expected types by reading the code, before it runs. It catches a whole class of mistakes — like passing the wrong kind of value to a function — at compile time instead of at runtime." },
      { question: "Why is TypeScript called a *superset* of JavaScript rather than a separate language?", answer: "Every valid JavaScript program is already valid TypeScript — TypeScript only adds optional syntax (type annotations) on top. It doesn't remove or replace any JavaScript feature, it just layers extra checking on top of the language you already know." },
      { question: "Does using TypeScript make your code run faster at runtime?", answer: "No. TypeScript has zero effect on runtime performance — by the time the code runs, it's plain JavaScript with all type information stripped out. TypeScript only helps you catch mistakes earlier, before that JavaScript is even produced." },
      { question: "If your TypeScript file has type errors, does `tsc` still produce a `.js` file by default?", answer: "Yes. By default the compiler reports the errors but still emits JavaScript output — it doesn't refuse to compile. You have to explicitly opt in (for example, a `noEmitOnError` setting) to make errors block the build." },
      { question: "What are the TypeScript compiler's two main jobs?", answer: "First, it reads every type annotation and checks it against how values are actually used, reporting mismatches as errors. Second, regardless of whether errors were found, it strips all the type annotations out and writes plain JavaScript that any browser or Node.js can run." },
      { question: "Why is TypeScript's checking described as happening \"at compile time\" instead of \"at runtime\"?", answer: "The compiler finds mismatches purely by reading your code's structure — it never actually executes the call to discover the problem. That analysis-without-running is what \"compile time\" means, as opposed to a bug that only surfaces once the program is actually executing." },
      { question: "Since type annotations are erased before the code runs, can you check a variable's declared TypeScript type at runtime with `typeof`?", answer: "No — `typeof` at runtime only tells you the actual JavaScript value's type (`\"string\"`, `\"number\"`, and so on), because the TypeScript annotation no longer exists by then. The declared type is a compile-time-only concept; it has no runtime representation to inspect." },
      { question: "What is *type erasure*, in the context of TypeScript?", answer: "The process by which the compiler removes every type annotation, interface, and type alias from the code before producing JavaScript output. It's why TypeScript's types can never be inspected or relied on at runtime — they simply don't exist anymore by then." },
      { question: "A function like `function add(a, b) { return a + b; }` in plain JavaScript accepts `add(\"5\", 10)` without complaint. What does it actually do, and why doesn't TypeScript's equivalent have the same problem?", answer: "Plain JavaScript coerces the string, producing `\"510\"`, silently. The TypeScript version, `function add(a: number, b: number): number`, has type annotations the compiler checks the call against — it flags the string argument as an error before the code ever runs, rather than letting it execute and produce a wrong result." },
      { question: "Is it accurate to say TypeScript is a completely different language from JavaScript that has to be learned from scratch?", answer: "No — this is a common beginner misconception. TypeScript is JavaScript with an added, optional layer of type annotations. Anyone who knows JavaScript already knows the vast majority of TypeScript; the new material is the type syntax on top." },
      { question: "Why might static typing catch bugs \"while you're still typing,\" rather than only when you run `tsc` from the command line?", answer: "Editors integrate the TypeScript compiler to run its type-checking continuously in the background, underlining mismatches as you write code — you don't have to finish the file and run a separate command to see the error." },
      { question: "Why does static typing tend to matter more as a JavaScript project grows from a few hundred lines to hundreds of thousands?", answer: "In a small script, it's easy to hold every function's expected inputs in your head. As a codebase grows and is touched by more people, that mental bookkeeping becomes unreliable — mistakes like passing the wrong shape of value become both more likely and more expensive to trace back, which is exactly what explicit, compiler-checked types are designed to prevent." },
      { question: "For a five-minute throwaway script, why might plain JavaScript be a better choice than TypeScript?", answer: "TypeScript adds a build step (compiling before you can run the code) and requires writing type annotations. For code you'll run once and discard, that overhead can cost more time than it saves, since there's no future maintenance or team of collaborators for the type safety to protect." },
      { question: "A teammate suggests annotating every single variable in a codebase explicitly, even ones like `let count = 0`. Is that necessary?", answer: "No — TypeScript infers the type of a variable from its initializer, so `let count = 0` is already understood as `number` without an annotation. Explicit annotations are most valuable where the type isn't obvious from context, such as function parameters." },
    ],
    relatedTopics: ["basic-types", "interfaces", "type-aliases"],
    keywords: ["typescript", "static typing", "compiler", "tsc", "superset of javascript"],
  },
  {
    id: "basic-types",
    title: "Basic Types",
    level: "beginner",
    description:
      "The small set of built-in labels TypeScript uses to describe strings, numbers, booleans, arrays, and fixed-shape lists.",
    explanation: `
Once you accept that TypeScript lets you describe what kind of value a
variable holds, the next question is: what are the actual labels you use
to describe it? TypeScript ships with a handful of basic ones that map
directly onto the values JavaScript already has.

\`string\` describes text, \`number\` describes any numeric value (there's
no separate "integer" or "float" — just one number type), and \`boolean\`
describes \`true\`/\`false\`. Beyond single values, you'll often have a list
of things — an **array** — written either as \`string[]\` (an array of
strings) or \`Array<string>\` (the same thing, different notation).

Sometimes you know not just that something is a list, but exactly how
many items it has and what type each specific position holds — for
example, a pair that's always "a name, then an age." That fixed-length,
fixed-order array is called a **tuple**, written like \`[string, number]\`.

Finally, there's a type called \`any\`, which tells TypeScript "stop
checking this — it could be anything." It's tempting to reach for when
you're unsure what type something is, but doing so switches off the exact
safety net TypeScript exists to provide for that value, letting mistakes
slip through unnoticed. It's best treated as an escape hatch for rare
cases, not a default.
    `.trim(),
    analogy:
      "Think of basic types like labels on storage bins — one bin is labeled \"text only,\" another \"numbers only,\" another \"exactly one name and one age, in that order.\" The `any` bin has no label at all, so anything can go in — which is convenient, but it also means nothing stops you from mixing in something that doesn't belong.",
    examples: [
      {
        title: "The core primitive types",
        code: `let username: string = "amara";
let age: number = 29;
let isActive: boolean = true;

// TypeScript catches mismatches immediately:
age = "twenty-nine";
// Error: Type 'string' is not assignable to type 'number'.`,
        explanation:
          "Each variable is annotated with the type of value it's allowed to hold. Once declared, TypeScript enforces that annotation on every later assignment.",
        walkthrough: [
          { code: "let username: string = \"amara\";", explanation: "The `: string` annotation says this variable may only ever hold text." },
          { code: "let age: number = 29;", explanation: "`: number` covers whole numbers and decimals alike — TypeScript has just one numeric type." },
          { code: "age = \"twenty-nine\";", explanation: "Reassigning a string to a `number` variable violates its annotation, so TypeScript reports an error here." },
        ],
      },
      {
        title: "Arrays, tuples, and any",
        code: `let scores: number[] = [90, 85, 76];
let names: Array<string> = ["Sam", "Lee"];

// A tuple: always exactly [name, age], in that order
let profile: [string, number] = ["Priya", 34];

// any turns off checking for this value entirely — use sparingly
let response: any = fetchLegacyApi();
response.whatever.you.want(); // no error, even if this is wrong`,
        explanation:
          "Arrays hold any number of same-typed items. A tuple locks in both the number of items and each one's type by position. `any` opts a value out of type checking altogether, which is powerful but risky.",
      },
    ],
    howItWorks: `
When you write \`let age: number = 29\`, the compiler records that
\`age\`'s type is \`number\` and checks every later use of \`age\` against
that record — every reassignment, every place it's passed to a function,
every comparison. This checking happens purely by reading your code
(hence "static"); the compiler never actually runs \`age = "twenty-nine"\`
to discover it's wrong, it infers the mismatch just from the code's
structure.

\`any\` works by telling the compiler to skip building that record for a
given value — so no checks are ever run against it, and any mismatch
involving it slips through silently.
    `.trim(),
    whyItExists: `
JavaScript already has these kinds of values at runtime (strings, numbers,
booleans, arrays) — it just has no way to *declare in advance* which one a
variable is supposed to hold. Basic types give you that vocabulary, so the
compiler has something concrete to check your code against.
    `.trim(),
    whenToUse: `
Use explicit basic types whenever a value's type isn't obvious from
context — function parameters, empty arrays you're about to fill, and
tuples where position genuinely matters (like an \`[x, y]\` coordinate pair).
For a value initialized immediately with an obvious literal, like
\`let count = 0\`, TypeScript infers the type automatically and an
annotation is often just extra noise.
    `.trim(),
    whenNotToUse: `
Avoid reaching for \`any\` as a default whenever you're unsure of a type —
it silently disables the exact checking you added TypeScript to get.
Prefer figuring out the real type, or using \`unknown\` (a safer
alternative that still forces you to check the value before using it) when
you truly don't know what you're dealing with yet.
    `.trim(),
    commonMistakes: [
      "Reaching for `any` whenever a type is inconvenient to figure out, which quietly turns off type checking for that value and everything derived from it.",
      "Confusing a tuple with a regular array — `[string, number]` locks in exactly two items in that exact order, while `(string | number)[]` allows any number of items in any order.",
      "Over-annotating obvious values, like writing `let count: number = 0` when TypeScript would infer `number` automatically from the `0`.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Declare three variables with explicit types: a `string` for a city name, a `number` for a population, and a `boolean` for whether it's a capital city." },
      { difficulty: "Medium", prompt: "Create a tuple type representing an RGB color as `[number, number, number]`, and write a variable of that type. Then try adding a fourth number and observe the error." },
      { difficulty: "Hard", prompt: "Write a function `describe(value: any)` that logs `value.length`. Call it with a number and observe that TypeScript does not catch the runtime error. Then change the parameter type to `unknown` and see what TypeScript now requires you to do before accessing `.length`." },
    ],
    interviewQuestions: [
      { question: "What's the difference between `string[]` and `[string, number]`?", answer: "`string[]` is an array of any length where every element is a string. `[string, number]` is a tuple: exactly two elements, the first a string and the second a number, checked by position." },
      { question: "Why is overusing `any` considered bad practice?", answer: "It disables type checking for that value entirely, letting mismatches and mistakes pass through silently — defeating the purpose of using TypeScript for that part of the code." },
      { question: "Does TypeScript have separate types for integers and floating-point numbers?", answer: "No, there is just one `number` type covering all numeric values, matching how JavaScript itself represents numbers." },
      { question: "What's the key difference between `any` and `unknown`?", answer: "Both can hold a value of any type, but `any` turns off type checking completely, while `unknown` still forces you to narrow the value (with a type guard, `typeof` check, or assertion) before you're allowed to use it in any specific way — it's a safe version of \"could be anything.\"" },
      { question: "Given `let x: unknown = getValue(); x.trim();`, does this compile?", answer: "No. Even though `x` might genuinely hold a string at runtime, TypeScript doesn't know that from its declared type `unknown`, so it refuses to let you call `.trim()` until you narrow `x` — for example with `if (typeof x === \"string\") { x.trim(); }`." },
      { question: "What type does TypeScript infer for `let count = 0;` when no annotation is written?", answer: "`number`. TypeScript looks at the initializer's value and infers the broader type it belongs to for a `let` (or `var`) variable, since the variable is expected to be reassigned later." },
      { question: "What type does TypeScript infer for `const count = 0;`, and how is that different from the `let` case?", answer: "For a `const`, TypeScript infers the narrower literal type `0`, not the general `number` — because a `const` can never be reassigned, the compiler knows its value will always be exactly `0`, so it keeps the more precise type." },
      { question: "Why does `let age: number = 29; age = \"twenty-nine\";` get rejected by TypeScript, even though the equivalent plain JavaScript runs fine?", answer: "JavaScript happily reassigns a variable to any type at runtime — it has no concept of a variable being locked to one type. TypeScript adds that concept: once `age` is annotated (or inferred) as `number`, every later assignment is checked against that annotation, and a `string` violates it, regardless of what JavaScript itself would allow." },
      { question: "Can you append a fourth item to a variable typed as `let profile: [string, number]` using `.push()`?", answer: "Surprisingly, yes in many TypeScript configurations — `push` on a tuple type is loosely checked and won't always error, even though reading a fourth element or reassigning the whole tuple with an extra item would be rejected. This is a well-known sharp edge in how tuples interact with mutating array methods." },
      { question: "At runtime, is there any difference between an array declared as `string[]` and one declared as `Array<string>`?", answer: "No — they're two notations for the exact same type, purely a stylistic choice. Both compile away to an ordinary JavaScript array; TypeScript treats them identically for checking purposes." },
      { question: "Why does `let profile: [string, number] = [34, \"Priya\"];` fail to compile?", answer: "A tuple checks not just the types present but their exact position — the first slot must be `string` and the second `number`. Here the values are in the wrong order, so even though both a `string` and a `number` are present, the assignment doesn't match the tuple's declared shape." },
      { question: "What's the practical downside of writing `let scores = [];` instead of `let scores: number[] = [];`?", answer: "Without an annotation or an initial value to infer from, TypeScript often infers the near-useless type `any[]`, which means every element pushed into `scores` later goes unchecked. Declaring the intended element type up front keeps the array's contents checked from the start." },
      { question: "If you get back a JSON payload from an API and you don't yet know its exact shape, should you type it as `any` or `unknown`?", answer: "`unknown` — it's just as flexible for holding a value of unknown shape, but it forces you to check or narrow the value before doing anything with it, whereas `any` would let bad assumptions about the payload's shape pass through completely unchecked." },
      { question: "Can a `boolean`-typed variable hold values like `0`, `\"\"`, or `null` the way a JavaScript `if` condition treats them as falsy?", answer: "No. The `boolean` type accepts only the two literal values `true` and `false` — TypeScript doesn't extend it to cover JavaScript's broader notion of \"falsy\" values, even though those values behave like `false` inside a runtime condition." },
      { question: "When would a tuple be a better fit than an interface for representing two related values, like a name and an age?", answer: "A tuple is a good fit when position alone conveys meaning and you don't need named fields — for example, a function that always returns `[value, error]`. An interface is better once the values benefit from named properties, or when there might be more than a couple of fields, since accessing by index is far less self-documenting than accessing by name." },
      { question: "Why is `any` sometimes called an \"escape hatch,\" and why is it risky when it flows into other code?", answer: "It's meant for rare cases where you genuinely can't or don't want to express a type. The risk is that `any` is contagious: any value derived from an `any` — a property access, a function's return value — also becomes `any` by default, silently spreading the loss of checking outward through the rest of the code that touches it." },
      { question: "What is *type widening*, and where does it show up with basic types?", answer: "Type widening is TypeScript generalizing a specific value to a broader type when it infers a mutable variable's type — for example, inferring `let x = 5` as `number` rather than the literal type `5`, because `x` could later be reassigned to any other number." },
      { question: "Why doesn't declaring `let count: number = 0;` gain you anything over just writing `let count = 0;`?", answer: "TypeScript already infers `number` from the literal `0` on its own, so the explicit annotation states nothing the compiler didn't already know — it's redundant, adding visual noise without adding any new type safety." },
      { question: "Is `unknown` a subtype of every other type, the way `any` is often loosely described?", answer: "Not quite — `any` is compatible in both directions (it can be assigned to anything, and anything can be assigned to it, bypassing checks). `unknown` can accept any value being assigned into it, but a plain `unknown` cannot be assigned out to a more specific type without narrowing first — that asymmetry is exactly what makes it safer." },
      { question: "If a function parameter is typed `any`, does TypeScript check calls to methods on that parameter, like `param.whatever.you.want()`?", answer: "No — once a value's type is `any`, TypeScript stops checking property accesses, method calls, and arguments on it entirely, so a call like that will compile even if it would throw at runtime." },
    ],
    prerequisites: ["what-is-typescript"],
    relatedTopics: ["what-is-typescript", "interfaces", "type-aliases"],
    keywords: ["types", "string", "number", "boolean", "array", "tuple", "any"],
  },
  {
    id: "interfaces",
    title: "Interfaces",
    level: "beginner",
    description:
      "A named description of what properties an object must have, and what type each one holds.",
    explanation: `
A single \`string\` or \`number\` type is enough for a simple value, but
most real data is an object with several properties — a user with a name,
an email, and an age, say. Writing that shape out inline everywhere you
use it gets repetitive fast, and there's nothing tying separate inline
descriptions together as "the same shape."

An **interface** solves this by giving a shape a name, once, in one place.
You declare what properties an object of this shape must have and what
type each one is, and then you reuse that name everywhere instead of
repeating the shape. If an object is missing a required property, has one
with the wrong type, or is passed somewhere expecting that shape when it
doesn't match, TypeScript flags it immediately.
    `.trim(),
    analogy:
      "An interface is like a form template with labeled blanks: \"Name: ___, Email: ___, Age: ___.\" Anyone filling it out must provide all the required blanks with the right kind of answer — you can't hand in a form missing the email field, or write your age as \"twenty\" instead of a number.",
    examples: [
      {
        title: "Defining and using an interface",
        code: `interface User {
  name: string;
  email: string;
  age: number;
}

const user: User = {
  name: "Kai",
  email: "kai@example.com",
  age: 27,
};

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}`,
        explanation:
          "The `User` interface describes the required shape once. Both the `user` variable and the `greet` function reuse it, so any object claimed to be a `User` is checked against the exact same definition.",
        walkthrough: [
          { code: "interface User {", explanation: "Declares a new named shape called User." },
          { code: "  name: string;\n  email: string;\n  age: number;", explanation: "Each line lists a required property and the type it must hold." },
          { code: "const user: User = {...}", explanation: "This object literal is checked against User — missing a property, or giving one the wrong type, would be an error here." },
        ],
      },
      {
        title: "Optional properties and readonly",
        code: `interface Product {
  readonly id: string;
  name: string;
  discountCode?: string; // optional — may or may not be present
}

const item: Product = { id: "p-1", name: "Mug" }; // valid, discountCode omitted

item.id = "p-2";
// Error: Cannot assign to 'id' because it is a read-only property.`,
        explanation:
          "A `?` after a property name marks it optional, so objects without it are still valid. `readonly` allows a property to be set once but never reassigned afterward.",
      },
    ],
    howItWorks: `
An interface itself produces no JavaScript at all — it exists purely at
compile time, as a description the compiler checks object literals,
function parameters, and variables against. When you annotate something
with an interface name, TypeScript compares every property on the actual
value to every property the interface requires, flags anything missing or
mismatched, and then discards the interface entirely once compilation
finishes — it leaves no trace in the compiled \`.js\` output.
    `.trim(),
    whyItExists: `
Without a name for a shape, every function that expects "an object with a
name, email, and age" would have to spell that shape out inline, and
there'd be no guarantee that two inline descriptions actually mean the
same thing. Interfaces give a shape a single, reusable, checkable name,
which makes intent clearer and mistakes far easier to catch consistently
across a whole codebase.
    `.trim(),
    whenToUse: `
Use an interface any time you're describing the shape of an object —
function parameters that are objects, the data returned from an API, the
props a component accepts, or any structure you'll reuse in more than one
place.
    `.trim(),
    whenNotToUse: `
For a type that isn't fundamentally an object shape — a union of specific
string values, a function type, or a primitive alias — a type alias
(covered next) is usually the more natural fit. Interfaces are specifically
suited to describing "objects with named properties."
    `.trim(),
    commonMistakes: [
      "Forgetting the `?` on a property that's genuinely optional, forcing every object to include it even when it isn't always relevant.",
      "Assuming `readonly` protects the object at runtime — it's a compile-time-only check; plain JavaScript (or a type-unsafe cast) can still change the value.",
      "Defining the same object shape inline in multiple places instead of naming it once as an interface and reusing it.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write an interface `Book` with `title: string`, `author: string`, and `pages: number`, then create one object that satisfies it." },
      { difficulty: "Medium", prompt: "Add an optional property `isbn?: string` to `Book`, and create two valid `Book` objects — one with an ISBN and one without." },
      { difficulty: "Hard", prompt: "Write a function `printSummary(book: Book): string` that returns a formatted string, and add a `readonly` property to `Book` that would trigger a compiler error if the function tried to modify it." },
    ],
    interviewQuestions: [
      { question: "What is an interface used for in TypeScript?", answer: "Naming and reusing the description of an object's shape — which properties it must have and what type each one is — so the compiler can check objects against it consistently." },
      { question: "Does an optional property (`prop?: type`) allow the property to be `undefined`, or does it allow the property to be omitted entirely?", answer: "Both — it can be omitted from the object altogether, or included and explicitly set to `undefined`." },
      { question: "Do interfaces exist at runtime in the compiled JavaScript?", answer: "No. Interfaces are purely a compile-time construct used for type checking; they produce no runtime code at all." },
      { question: "What is *structural typing*, and how does it relate to how interfaces are checked?", answer: "TypeScript compares types by their shape (which properties exist and what types they are), not by name or declared intent. An interface is checked structurally: any object with the right properties satisfies it, whether or not that object was ever explicitly annotated with the interface's name." },
      { question: "Given `interface User { name: string } const obj = { name: \"Kai\", age: 5 }; const u: User = obj;`, does this compile, even though `obj` has an extra `age` property?", answer: "Yes. Because `obj` is assigned through an existing variable rather than written as a fresh object literal at the assignment site, TypeScript only checks that it has at least the properties `User` requires — extra properties on an already-existing object are allowed." },
      { question: "Why does `const u: User = { name: \"Kai\", age: 5 };` fail to compile, when assigning the equivalent object through a variable (as in the previous question) does not?", answer: "This is TypeScript's excess property check: object literals written directly at the point of assignment are checked more strictly, because an extra property on a fresh literal is very often a typo or a misunderstanding of the target shape. That stricter check doesn't apply once the object has already been assigned to a differently-typed variable first." },
      { question: "Does marking a property `readonly` on an interface prevent it from ever being changed, even by plain JavaScript or a type assertion?", answer: "No — `readonly` is a compile-time-only check. TypeScript refuses to compile code that reassigns the property directly, but a type assertion or code that isn't type-checked at all can still mutate it at runtime, since the restriction leaves no trace in the compiled JavaScript." },
      { question: "If `discountCode?: string` is declared on an interface, what is its type inside code that has already confirmed the object has it?", answer: "`string` — TypeScript narrows `string | undefined` down to `string` once you've checked (for example with `if (item.discountCode)`) that the property is actually present, since the optional marker really means \"`string`, or absent/`undefined`.\"" },
      { question: "Can two objects that were never declared with the same interface name still both satisfy that interface?", answer: "Yes — because interfaces check structure, not declared identity, any object with matching property names and types satisfies the interface regardless of how it was created or what (if anything) it was originally annotated as." },
      { question: "What happens if you declare `interface User { name: string }` a second time later in the same scope, adding `interface User { age: number }`?", answer: "TypeScript merges the two declarations into a single interface with both `name` and `age` — this is called *declaration merging*, and it's a feature unique to interfaces; a `type` alias with a duplicate name would instead be a compile error." },
      { question: "How would you make one interface build on another, like an `Admin` that has everything a `User` has plus a `permissions` field?", answer: "With `interface Admin extends User { permissions: string[] }` — `extends` copies in every property from `User`, and any object satisfying `Admin` must then satisfy all of `User`'s requirements plus the new one." },
      { question: "Can an interface describe a property whose key names aren't known in advance, like an object being used as a dictionary?", answer: "Yes, with an index signature: `interface Scores { [username: string]: number }` describes an object where every key is a string and every value is a number, regardless of how many keys exist or what they're named." },
      { question: "Can an interface property hold a function, and if so, how is it typed?", answer: "Yes — for example `interface Logger { log: (message: string) => void }` describes a property that must be a function accepting a `string` and returning nothing. TypeScript checks any function assigned to `log` against that exact signature." },
      { question: "If an interface property's type is itself another interface, like `interface Order { customer: User }`, how deep does TypeScript's checking go?", answer: "All the way down — TypeScript recursively checks nested object shapes, so an `Order` object's `customer` property must itself satisfy every requirement of `User`, not just be present." },
      { question: "Why does defining the same object shape inline in several different function signatures tend to cause problems over time?", answer: "There's nothing tying the separate inline descriptions together — if the shape needs to change, such as adding a required field, you have to find and update every inline occurrence by hand, and it's easy to miss one or let them silently drift out of sync. Naming the shape once as an interface and reusing it means there's exactly one place to update." },
      { question: "Is it valid to have a required property listed after an optional one in an interface, like `interface Item { discount?: number; name: string }`?", answer: "Yes — unlike function parameters, interface property order doesn't matter for validity. Properties are matched by name, not position, so optional and required properties can be declared in any order." },
      { question: "What would happen if you forgot the `?` on a property that's genuinely sometimes absent, like writing `discountCode: string` instead of `discountCode?: string`?", answer: "Every object typed as that interface would be required to include `discountCode`, so any real object that legitimately doesn't have a discount code would fail to satisfy the interface — forcing callers to invent a placeholder value just to satisfy the compiler." },
      { question: "When would a type alias be a more natural fit than an interface for describing something?", answer: "When the thing you're naming isn't fundamentally \"an object with named properties\" — a union of specific allowed values, a tuple, or a function signature are all things a type alias can express directly that an interface cannot." },
      { question: "Does an interface itself appear anywhere in the compiled `.js` output?", answer: "No — like all TypeScript-only constructs, an interface is used purely to check code during compilation and is discarded entirely once compilation finishes; there is no runtime object, class, or value corresponding to it." },
      { question: "If a function parameter is typed with an interface, what happens if you call the function with an object missing one required property?", answer: "TypeScript reports a compile error at the call site, naming the missing property — the function is never actually invoked with the incomplete object, since the mismatch is caught before the code runs." },
      { question: "Scenario: you want a `Config` interface where `apiUrl` is required but `timeout` should fall back to a sensible number if the caller doesn't provide it. Does the interface itself supply that fallback?", answer: "No — an interface (with `timeout?: number`) only describes that the property may be absent; it doesn't supply a default value. Supplying the fallback, such as `config.timeout ?? 5000`, is separate logic you still have to write in the code that consumes the object." },
      { question: "Why are interfaces particularly well suited to describing the props a UI component accepts?", answer: "Component props are almost always a plain object with a fixed, named set of fields, some required and some optional — exactly the shape interfaces are designed to describe and enforce, catching a missing or mistyped prop at the call site instead of at render time." },
    ],
    prerequisites: ["basic-types"],
    relatedTopics: ["basic-types", "type-aliases", "functions-with-types"],
    keywords: ["interface", "object shape", "optional property", "readonly"],
  },
  {
    id: "type-aliases",
    title: "Type Aliases",
    level: "beginner",
    description:
      "Giving any type — not just object shapes — a reusable name.",
    explanation: `
Interfaces are great for naming object shapes, but not every type you want
to reuse is an object. Maybe it's a specific set of allowed strings, like
\`"pending" | "shipped" | "delivered"\`. Maybe it's a function's signature.
Maybe it's just a shorthand for a long, awkward-to-repeat type. Writing
that out in full every time it's needed is just as repetitive as repeating
an object shape.

A **type alias**, written with the \`type\` keyword, gives *any* type a
name — an object shape, a union of specific values, a tuple, a function
signature, anything. Once named, you refer to it by that name everywhere
instead of repeating the full definition.
    `.trim(),
    analogy:
      "A type alias is like giving a nickname to a long phrase you keep repeating. Instead of writing \"the delivery status, which is one of pending, shipped, or delivered\" every single time, you agree to just say \"OrderStatus\" and everyone knows exactly what that means.",
    examples: [
      {
        title: "Naming a union of specific values",
        code: `type OrderStatus = "pending" | "shipped" | "delivered";

let status: OrderStatus = "shipped";

status = "cancelled";
// Error: Type '"cancelled"' is not assignable to type 'OrderStatus'.`,
        explanation:
          "`OrderStatus` isn't an object shape at all — it's a fixed set of allowed string values. Type aliases can name this kind of type, which interfaces cannot.",
        walkthrough: [
          { code: 'type OrderStatus = "pending" | "shipped" | "delivered";', explanation: "Names the union of exactly these three string values as OrderStatus." },
          { code: 'let status: OrderStatus = "shipped";', explanation: "status may only ever hold one of the three named values." },
          { code: 'status = "cancelled";', explanation: "\"cancelled\" isn't one of the allowed values, so TypeScript rejects the assignment." },
        ],
      },
      {
        title: "A type alias for an object shape (like an interface)",
        code: `type Point = {
  x: number;
  y: number;
};

function distanceFromOrigin(p: Point): number {
  return Math.sqrt(p.x ** 2 + p.y ** 2);
}

// interface vs type, for an object shape, are nearly interchangeable:
interface PointInterface {
  x: number;
  y: number;
}`,
        explanation:
          "For plain object shapes, `type` and `interface` do almost the same job. The practical differences show up in more advanced cases: interfaces can be re-opened later to add more properties (declaration merging), and type aliases can describe unions, tuples, and other non-object types that interfaces can't.",
      },
    ],
    howItWorks: `
Like an interface, a type alias exists purely at compile time — it's a
label the compiler substitutes in wherever it's used when checking your
code, and it leaves no trace in the compiled JavaScript. The difference
from an interface is what it's allowed to name: an interface can only
describe object shapes, while a type alias can name literally any type —
including unions, tuples, function signatures, and primitives — as well
as object shapes.
    `.trim(),
    whyItExists: `
Object shapes aren't the only kind of type worth reusing — restricted sets
of string values, function signatures, and combinations of other types all
benefit from having a single readable name instead of being repeated or
inlined everywhere. Type aliases fill that gap for anything an interface
can't express.
    `.trim(),
    whenToUse: `
Reach for a type alias when you're naming a union (like a fixed set of
allowed strings), a tuple, a function signature, or any type that isn't
strictly "an object with these properties." It's also fine to use for
plain object shapes if your team's convention prefers **type** over
**interface** for consistency.
    `.trim(),
    whenNotToUse: `
If you're describing an object shape that might need to be extended later
by merging in more properties from elsewhere (common in libraries), an
interface supports that (declaration merging) and a type alias does not.
For everyday object shapes without that need, either works.
    `.trim(),
    commonMistakes: [
      "Thinking `type` and `interface` are totally interchangeable — type aliases can express unions and other non-object types that interfaces cannot.",
      "Trying to \"reopen\" a type alias later to add more properties, the way you can with an interface — type aliases can't be merged like that.",
      "Naming a type alias the same as an existing variable or another type in the same scope, causing a naming collision.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Create a type alias `Direction` that can only be \"up\", \"down\", \"left\", or \"right\", and declare a variable of that type." },
      { difficulty: "Medium", prompt: "Create a type alias `Coordinate` for a `[number, number]` tuple, and write a function `move(point: Coordinate, direction: Direction): Coordinate` that returns a new coordinate." },
      { difficulty: "Hard", prompt: "Write a type alias for a function signature, `Comparator`, that takes two numbers and returns a number, and write a function `sortNumbers(nums: number[], compare: Comparator): number[]` that uses it." },
    ],
    interviewQuestions: [
      { question: "What can a type alias describe that an interface cannot?", answer: "A type alias can name unions, tuples, function signatures, and primitive types — anything, not just object shapes, which is all an interface can describe." },
      { question: "What is declaration merging, and which of `type` or `interface` supports it?", answer: "Declaration merging is the ability to declare the same named shape more than once and have TypeScript combine the declarations into one. Only `interface` supports this; a `type` alias with the same name declared twice is an error." },
      { question: "For a simple object shape, does it matter whether you use `type` or `interface`?", answer: "In most everyday cases, no — both check objects the same way. The choice mostly comes down to team convention, unless you specifically need a feature only one of them supports." },
      { question: "Does writing `type ID = string;` create a genuinely new type distinct from `string`?", answer: "No — it just creates an alternate name for the exact same type. Anywhere a `string` is expected, an `ID` works and vice versa; TypeScript treats them as fully interchangeable, unlike some languages' \"branded\" or \"nominal\" type features." },
      { question: "Given `type ID = string | number; let id: ID = \"abc123\"; id = 42;`, does the second assignment compile?", answer: "Yes — `42` is a `number`, which is one of the two types the union `ID` allows. Assigning `id = true;` would fail, though, since `boolean` isn't part of the union." },
      { question: "Can a type alias reference itself, like `type Tree = { value: number; children: Tree[] };`?", answer: "Yes, for object shapes — this is a recursive type alias, and TypeScript resolves it lazily rather than trying to expand it infinitely, which is exactly what lets you model nested structures like trees or JSON with a single named type." },
      { question: "What happens if you declare `type Status = \"active\" | \"inactive\";` twice in the same scope?", answer: "It's a compile error — unlike `interface`, a `type` alias cannot be declared more than once with the same name; there's no merging mechanism for type aliases." },
      { question: "How would you type a variable that holds a function signature, like a comparator used for sorting?", answer: "With a type alias for the function shape: `type Comparator = (a: number, b: number) => number;`. Any function assigned to a variable of that type is then checked against exactly that parameter and return signature." },
      { question: "Given `type Status = \"active\" | \"inactive\"; function setStatus(s: Status) {}`, why does `setStatus(\"Active\")` fail to compile?", answer: "The union `Status` only allows the exact literal strings `\"active\"` and `\"inactive\"` — string literal types are case-sensitive, so `\"Active\"` isn't one of the allowed values, even though it looks similar." },
      { question: "How would you express \"a `User` extended with an extra `permissions` field\" using type aliases instead of `interface extends`?", answer: "With an intersection: `type Admin = User & { permissions: string[] };`. The `&` combines both shapes into one type that requires everything from `User` plus the new field — it's the type-alias equivalent of `extends`, just via a different operator." },
      { question: "You need to model a value that's always either a `User` object or a `Guest` object, distinguished by a shared `kind` field. Would you reach for `interface` or `type` here, and why?", answer: "A `type` alias, since the overall value is a union (`User | Guest`) — interfaces can't directly express \"one of these two shapes,\" only a single object shape. Each branch of the union could still individually be an interface; only the union itself needs `type`." },
      { question: "Why can a type alias name \"literally any type,\" while an interface is limited to object shapes?", answer: "A type alias is just a name bound to a type expression, and that expression can be a union, a tuple, a function signature, a primitive, or an object shape — an interface's syntax, by contrast, is specifically built to declare a set of named properties, so it has no way to represent something like a union of strings." },
      { question: "If you write `type Point = { x: number; y: number };` and separately `interface PointInterface { x: number; y: number }`, are values typed as one assignable to the other?", answer: "Yes — because TypeScript checks structurally, both describe the identical shape, so a `Point` value is assignable wherever a `PointInterface` is expected and vice versa, regardless of which one was used to declare it." },
      { question: "What's the main practical trade-off a team gives up by adopting \"always use `type`, never `interface`\" as a blanket style rule?", answer: "They lose declaration merging — the ability to reopen an already-declared shape and add more properties to it later, which some patterns, especially in library type definitions, rely on. For most everyday application code that trade-off rarely matters." },
      { question: "Can a tuple type be given a name with a type alias, and why would you want that?", answer: "Yes — for example `type Coordinate = [number, number];`. Naming it means every function that takes or returns a coordinate pair can refer to `Coordinate` instead of repeating `[number, number]`, and if the shape ever needs to change, there's one definition to update." },
      { question: "Why can't an interface be used to name a type like `type Direction = \"up\" | \"down\" | \"left\" | \"right\";`?", answer: "An interface's syntax only supports declaring named properties on an object — there's no way to write \"this interface is one of these four exact strings\" using interface syntax, since an interface isn't describing a value directly, it's describing an object's shape." },
      { question: "Naming a type alias the same as an existing variable in the same scope — is that allowed?", answer: "It's allowed in the sense that types and values live in separate namespaces in TypeScript, so `type User = {...}` and `let User = ...` can technically coexist — but it's confusing in practice and best avoided, and naming collisions between two types with the same name are still errors." },
    ],
    prerequisites: ["interfaces"],
    relatedTopics: ["interfaces", "union-intersection-types", "functions-with-types"],
    keywords: ["type alias", "type keyword", "union", "interface vs type"],
  },
  {
    id: "functions-with-types",
    title: "Functions with Types",
    level: "beginner",
    description:
      "Annotating a function's parameters and return value so TypeScript can check every call against them.",
    explanation: `
A function is really a contract: "give me these inputs, and I'll give you
this output." In plain JavaScript, that contract only exists in comments
or in your head — nothing stops a caller from breaking it by passing the
wrong kind of argument, or too few of them.

TypeScript lets you write that contract directly into the function
signature. Each parameter gets a type annotation, and the function itself
gets a return type annotation, so both what goes in and what comes out are
checked. You can also mark a parameter **optional** with a \`?\`, meaning
callers may leave it out — and if they do, its value inside the function
is \`undefined\`.
    `.trim(),
    analogy:
      "A typed function signature is like a vending machine's slot: it's shaped to accept coins of a specific size, and clearly labeled with what it dispenses. Try to push in the wrong shaped object and it simply won't go in — you find out immediately, not after the machine jams.",
    examples: [
      {
        title: "Typed parameters and return value",
        code: `function calculateTotal(price: number, taxRate: number): number {
  return price + price * taxRate;
}

calculateTotal(100, 0.07); // 107
calculateTotal("100", 0.07);
// Error: Argument of type 'string' is not assignable to parameter of type 'number'.`,
        explanation:
          "TypeScript checks both the types passed in and the type returned. If the function's body tried to `return \"total\"` instead of a number, that would also be flagged as an error.",
        walkthrough: [
          { code: "function calculateTotal(price: number, taxRate: number): number {", explanation: "Both parameters must be numbers, and the function is promised to return a number." },
          { code: "return price + price * taxRate;", explanation: "The actual computation — ordinary arithmetic, unaffected by the type annotations." },
          { code: 'calculateTotal("100", 0.07);', explanation: "Passing a string for price violates the parameter's type, so TypeScript flags this call before it ever runs." },
        ],
      },
      {
        title: "Optional parameters and default values",
        code: `function greet(name: string, greeting?: string): string {
  return \`\${greeting ?? "Hello"}, \${name}!\`;
}

greet("Mina");              // "Hello, Mina!"
greet("Mina", "Welcome");   // "Welcome, Mina!"

// A default value makes a parameter optional automatically:
function greetWithDefault(name: string, greeting: string = "Hello"): string {
  return \`\${greeting}, \${name}!\`;
}`,
        explanation:
          "The `?` after `greeting` means callers may omit it entirely, in which case it's `undefined` inside the function. Giving a parameter a default value achieves a similar effect, while also supplying a fallback automatically.",
      },
    ],
    howItWorks: `
When the compiler checks a function call, it lines up each argument you
pass against the corresponding parameter's declared type, in order, and
flags any mismatch — including passing too many required arguments or too
few. It does the same for the return value: every \`return\` statement
inside the function body is checked against the declared return type.
Optional parameters (marked with \`?\`) must come after all required ones,
since position is how arguments are matched to parameters.
    `.trim(),
    whyItExists: `
Function signatures are one of the most common places bugs sneak in —
passing arguments in the wrong order, forgetting one, or assuming a
function returns something it doesn't. By making the contract explicit and
checkable, TypeScript catches those mistakes at the call site, immediately,
instead of only when the function actually runs with bad data.
    `.trim(),
    whenToUse: `
Annotate parameter types on essentially every function you write,
especially ones used in more than one place or exposed to other parts of a
codebase. Return type annotations are optional (TypeScript can usually
infer them), but adding them explicitly is useful for documenting intent
and catching a case where the function body accidentally returns the wrong
type.
    `.trim(),
    whenNotToUse: `
For a tiny, throwaway inline callback (like the anonymous function passed
to \`array.map(x => x * 2)\`), TypeScript is usually smart enough to infer
the parameter type from context, so an explicit annotation would just be
unnecessary noise.
    `.trim(),
    commonMistakes: [
      "Placing an optional parameter before a required one, which TypeScript doesn't allow — optional parameters must come last.",
      "Confusing an optional parameter (`name?: string`) with a parameter that has a default value (`name: string = \"Guest\"`) — the former can be `undefined` inside the function, the latter never is.",
      "Assuming a return type annotation changes what the function actually returns at runtime — it only adds a compile-time check; the function's logic still determines the real value.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a function `square(n: number): number` that returns `n` squared, and call it correctly and incorrectly to see the error." },
      { difficulty: "Medium", prompt: "Write a function `formatName(first: string, last: string, middle?: string): string` that combines the names, handling the case where `middle` is omitted." },
      { difficulty: "Hard", prompt: "Write a function `createUser(name: string, role: string = \"member\")` that returns an object matching a `User` interface you define, and explain why the `role` parameter doesn't need a `?` even though it's optional to callers." },
    ],
    interviewQuestions: [
      { question: "What happens if you call a TypeScript function with the wrong number of arguments?", answer: "The compiler reports an error at the call site — too few required arguments, or too many, are both caught before the code runs." },
      { question: "What's the difference between an optional parameter and one with a default value?", answer: "An optional parameter (`x?: T`) may be omitted, and is `undefined` inside the function if it is. A parameter with a default value (`x: T = val`) may also be omitted, but then automatically takes on the default value instead of being `undefined`." },
      { question: "Is a function's return type annotation required?", answer: "No — TypeScript can usually infer the return type from the function body. Writing it explicitly is optional but often used for clarity and as an extra safety check." },
      { question: "Why must optional parameters come after all required ones in a function signature?", answer: "Arguments are matched to parameters by position, not by name. If an optional parameter came first, TypeScript (and JavaScript) would have no way to tell whether a single argument passed in was meant to fill the optional slot or the required one after it." },
      { question: "Given `function greet(name: string, greeting?: string) { return greeting ?? \"Hi\"; }`, what is the declared type of `greeting` inside the function body?", answer: "`string | undefined` — marking a parameter optional with `?` doesn't just make it omittable, it also adds `undefined` as a possible type for it inside the function, which is exactly why `greeting ?? \"Hi\"` is needed to handle the omitted case." },
      { question: "Is `function f(a?: number, b: number) {}` valid TypeScript?", answer: "No — it's a compile error. Optional parameters must come after all required parameters, and here `a` is optional while `b`, which comes after it, is required, which TypeScript rejects outright." },
      { question: "Can a parameter have both a `?` and a default value, like `function f(x?: number = 5) {}`?", answer: "No — this is a compile error. A default value already implies the parameter is optional, since callers can omit it and get the default, so adding `?` on top is redundant and TypeScript disallows combining the two." },
      { question: "How do you type a function that accepts any number of arguments, like `sum(1, 2, 3, 4)`?", answer: "With a rest parameter: `function sum(...nums: number[]): number`. Every argument passed after the fixed parameters, if any, is collected into `nums` as an array, and each one is checked against the declared element type." },
      { question: "How would you type a variable meant to hold a function, rather than a function declaration itself — for example, a variable that should only ever be assigned an operation on two numbers?", answer: "With a function type annotation: `let op: (a: number, b: number) => number;`. Any function later assigned to `op` is checked against that exact parameter and return signature, just as if it were a parameter typed the same way." },
      { question: "Why does TypeScript usually let you skip annotating the parameter type inside a callback like `array.map(x => x * 2)`?", answer: "This is *contextual typing*: TypeScript already knows the array's element type, and infers that `map`'s callback parameter `x` must be that same element type from the surrounding context, so an explicit annotation would just repeat what the compiler already knows." },
      { question: "If `calculateTotal(price: number, taxRate: number): number` is called as `calculateTotal(100)`, what happens?", answer: "A compile error — TypeScript requires every parameter without a `?` or default value to be supplied. Since `taxRate` isn't optional here, calling with only one argument doesn't satisfy the function's declared signature." },
      { question: "Given `function createUser(name: string, role: string = \"member\") {}`, does a caller have to know or write anything different from calling a required-parameter function?", answer: "No — from the caller's side, omitting `role` is exactly like an optional parameter, so `createUser(\"Kai\")` is valid. Inside the function, though, `role` is typed as plain `string`, never `undefined`, because the default guarantees it always has a real value by the time the body runs." },
      { question: "What does annotating a function's return type as `: void` communicate, versus `: undefined`?", answer: "`void` means the function's return value isn't meant to be used at all — it signals that nothing useful comes back, and is the conventional annotation for functions run purely for their side effects. `undefined` as a return type is a narrower, more literal claim that the function returns exactly the value `undefined`, which is rarely what you actually want to express." },
      { question: "If a function's body has a `return \"done\";` statement but its signature declares `: number`, what happens?", answer: "TypeScript reports a compile error on that `return` statement, since the value returned doesn't match the declared return type — the mismatch is caught by checking the function body against its own signature, the same way call sites are checked against parameter types." },
      { question: "Does an explicit return type annotation change what value a function actually returns at runtime?", answer: "No — it only adds a compile-time check that the function body's `return` statements match the declared type. The function's logic is what actually determines the real returned value; the annotation can't alter or coerce it." },
      { question: "You pass an object literal directly into a function parameter typed with an interface, and it has one extra property the interface doesn't list. Does this behave differently than passing a variable holding the same object?", answer: "Yes — passing a fresh object literal directly at the call site triggers TypeScript's excess property check and errors on the extra property, while passing a variable that was assigned the same object earlier does not, because the stricter literal check only applies right where an object literal is written." },
      { question: "Why is a typed function signature sometimes compared to a vending machine's coin slot?", answer: "The slot, meaning the parameter types, is shaped to accept only specific inputs, and what comes out, the return type, is fixed and known in advance — feeding in the wrong shape of input is rejected immediately, rather than being accepted and causing a jam (a runtime error) later." },
      { question: "Between annotating every function parameter and every function's return type, which matters more for catching call-site mistakes, and why?", answer: "Annotating parameters matters more day-to-day, since most call-site mistakes, such as a wrong type or wrong argument count, are caught right there when arguments are checked against parameter types. Return type annotations are more optional because TypeScript can usually infer them correctly from the function body anyway, though writing them explicitly still documents intent and catches an accidental wrong-type return." },
    ],
    prerequisites: ["type-aliases"],
    relatedTopics: ["interfaces", "type-aliases", "generics"],
    keywords: ["function types", "parameters", "return type", "optional parameter", "default value"],
  },
];
