import type { Topic } from "../../types/content";

export const typescriptBeginnerTopics: Topic[] = [
  {
    id: "what-is-typescript",
    title: "What is TypeScript?",
    level: "beginner",
    description:
      "JavaScript with an extra layer that checks the *shape* of your data before your code ever runs.",
    explanation: `
Here is a plain JavaScript function that adds two numbers:

\`function add(a, b) { return a + b; }\`

Nothing stops you from calling \`add("5", 10)\` by mistake. JavaScript
quietly turns \`"5" + 10\` into the string \`"510"\`. You only find the bug
later, maybe in production.

Now imagine a tool that reads your code *before* it runs and says: "\`add\`
expects two numbers, but you're passing a string." You describe what
*kind* of value each variable, parameter and return value should be, and
the tool checks that your code matches. This is called **static typing**:
"static" because the check happens by reading the code, not running it.

That tool is **TypeScript**. It's not a separate language. It's JavaScript
plus optional type annotations. Browsers and Node.js don't understand those
annotations, so a **compiler** strips them out of your \`.ts\` file and
produces plain JavaScript (\`.js\`), the same code you'd write by hand, just
checked first.
    `.trim(),
    analogy:
      "It's like a spell-checker for your code's data. You can write what you want, but it underlines what doesn't make sense, like a phone number where an email was expected, so you can fix it before anyone sees it.",
    examples: [
      {
        title: "A mistake JavaScript won't catch",
        code: `// plain JavaScript
function add(a, b) {
  return a + b;
}

add("5", 10); // returns "510", no error, no warning`,
        explanation:
          "JavaScript runs this without complaint. The bug is silent: you just get a weird result.",
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
          "The `: number` after each parameter is a type annotation. TypeScript flags the call as invalid before anything runs, right in your editor, often as you type.",
        walkthrough: [
          { code: "function add(a: number, b: number): number {", explanation: "Both parameters must be numbers, and the function returns a number." },
          { code: "return a + b;", explanation: "Ordinary JavaScript. TypeScript changes how code is checked, not how it runs." },
          { code: 'add("5", 10);', explanation: "A string where a number is expected. TypeScript catches this before the code runs." },
        ],
      },
    ],
    howItWorks: `
TypeScript code lives in \`.ts\` files. The TypeScript compiler (\`tsc\`)
checks every type annotation against how the values are used and reports
mismatches as errors.

Then it strips the annotations out and writes plain \`.js\` files that any
browser or Node.js can run. Types never exist at runtime. That's why
TypeScript is called a "compile-time" layer: it does its job before the
program runs, then gets out of the way.
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
As JavaScript projects grow to hundreds of thousands of lines, small
mistakes become more common and harder to track down: passing the wrong
kind of value, misspelling a property, forgetting a value might be missing.
JavaScript can't describe what a function expects, so these mistakes only
show up when the code runs, sometimes in front of users.

Microsoft created TypeScript (first released in 2012) so large codebases
could state those expectations. Tools can then catch violations right away
instead of relying only on tests and code review.
    `.trim(),
    whenToUse: `
Use TypeScript on any project that will grow, have more than one
developer, or live long enough that "what does this function expect?" gets
hard to remember. It pays off most in teams, in libraries other code
depends on, and wherever refactoring needs to feel safe.
    `.trim(),
    whenNotToUse: `
For a throwaway script, a quick experiment or a tiny snippet, plain
JavaScript is often faster. TypeScript also adds a build step. If that
overhead doesn't pay for itself, skip it.
    `.trim(),
    commonMistakes: [
      "Thinking TypeScript is a different language. It's JavaScript plus type annotations that are removed before the code runs.",
      "Believing TypeScript makes code faster. It has no effect on runtime performance; it only catches mistakes earlier.",
      "Assuming type errors stop the program from running. By default the compiler still outputs JavaScript, unless you configure it not to.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a JavaScript function `multiply(a, b)` with no types. Then rewrite it in TypeScript with `: number` annotations on both parameters and the return value." },
      { difficulty: "Medium", prompt: "Call your TypeScript function with a string argument and read the error. Write down in your own words what it's telling you." },
      { difficulty: "Hard", prompt: "Without using the word \"TypeScript\", explain what problem static typing solves that plain JavaScript can't, as if to someone who has never programmed." },
    ],
    interviewQuestions: [
      { question: "What is TypeScript, in relation to JavaScript?", answer: "A superset of JavaScript that adds optional static type annotations. A compiler checks them before the code runs, then strips them and outputs plain JavaScript." },
      { question: "Does TypeScript code run directly in the browser?", answer: "No. It's compiled to plain JavaScript first. Browsers and Node.js only run the resulting JavaScript." },
      { question: "What is static typing, and what problem does it solve?", answer: "Checking that values match their expected types by reading the code, before it runs. It catches mistakes like passing the wrong kind of value to a function at compile time instead of at runtime." },
      { question: "Why is TypeScript called a *superset* of JavaScript rather than a separate language?", answer: "Every valid JavaScript program is already valid TypeScript. TypeScript only adds optional type syntax on top; it doesn't remove or replace any JavaScript feature." },
      { question: "Does using TypeScript make your code run faster at runtime?", answer: "No. By the time the code runs, it's plain JavaScript with all types stripped out. TypeScript only helps you catch mistakes earlier." },
      { question: "If your TypeScript file has type errors, does `tsc` still produce a `.js` file by default?", answer: "Yes. By default it reports the errors but still emits JavaScript. You must opt in (for example with `noEmitOnError`) to make errors block the build." },
      { question: "What are the TypeScript compiler's two main jobs?", answer: "First, it checks every type annotation against how values are used and reports mismatches. Second, whether or not it found errors, it strips the annotations and writes plain JavaScript that any browser or Node.js can run." },
      { question: "Why is TypeScript's checking described as happening \"at compile time\" instead of \"at runtime\"?", answer: "The compiler finds mismatches just by reading your code; it never runs it. That's what \"compile time\" means, as opposed to a bug that only appears while the program runs." },
      { question: "Since type annotations are erased before the code runs, can you check a variable's declared TypeScript type at runtime with `typeof`?", answer: "No. `typeof` only tells you the actual JavaScript value's type (`\"string\"`, `\"number\"`, and so on). The TypeScript annotation no longer exists at runtime, so there's nothing to inspect." },
      { question: "What is *type erasure*, in the context of TypeScript?", answer: "The compiler removing every type annotation, interface and type alias before producing JavaScript. It's why you can never inspect or rely on TypeScript types at runtime." },
      { question: "A function like `function add(a, b) { return a + b; }` in plain JavaScript accepts `add(\"5\", 10)` without complaint. What does it actually do, and why doesn't TypeScript's equivalent have the same problem?", answer: "JavaScript silently coerces the string and returns `\"510\"`. In the TypeScript version, `function add(a: number, b: number): number`, the compiler checks the call against the annotations and flags the string argument before the code runs." },
      { question: "Is it accurate to say TypeScript is a completely different language from JavaScript that has to be learned from scratch?", answer: "No, this is a common misconception. TypeScript is JavaScript with an optional layer of type annotations. If you know JavaScript, you already know most of TypeScript; the new part is the type syntax." },
      { question: "Why might static typing catch bugs \"while you're still typing,\" rather than only when you run `tsc` from the command line?", answer: "Editors run the TypeScript checker in the background and underline mismatches as you write. You don't need to run a separate command to see the error." },
      { question: "Why does static typing tend to matter more as a JavaScript project grows from a few hundred lines to hundreds of thousands?", answer: "In a small script you can remember what every function expects. As the codebase and team grow, that stops being reliable, and mistakes like passing the wrong shape of value become more likely and harder to trace. Compiler-checked types prevent exactly that." },
      { question: "For a five-minute throwaway script, why might plain JavaScript be a better choice than TypeScript?", answer: "TypeScript adds a build step and needs type annotations. For code you'll run once and throw away, that overhead can cost more than it saves, since there's no future maintenance or team to protect." },
      { question: "A teammate suggests annotating every single variable in a codebase explicitly, even ones like `let count = 0`. Is that necessary?", answer: "No. TypeScript infers the type from the initializer, so `let count = 0` is already `number`. Annotations matter most where the type isn't obvious, such as function parameters." },
    ],
    relatedTopics: ["basic-types", "interfaces", "type-aliases"],
    keywords: ["typescript", "static typing", "compiler", "tsc", "superset of javascript"],
  },
  {
    id: "basic-types",
    title: "Basic Types",
    level: "beginner",
    description:
      "The built-in labels TypeScript uses for strings, numbers, booleans, arrays and fixed-shape lists.",
    explanation: `
TypeScript has a few basic type labels that match the values JavaScript
already has:

- \`string\` for text.
- \`number\` for any number. There's no separate "integer" or "float" type.
- \`boolean\` for \`true\`/\`false\`.
- An **array** (a list) is written \`string[]\` or \`Array<string>\`. Both mean the same thing.

Sometimes you know exactly how many items a list has and what type sits at
each position, like a pair that's always "a name, then an age." That
fixed-length, fixed-order array is a **tuple**, written \`[string, number]\`.

Finally, \`any\` tells TypeScript "stop checking this, it could be
anything." It's tempting when you're unsure of a type, but it switches off
the safety net for that value and lets mistakes slip through. Treat it as
an escape hatch for rare cases, not a default.
    `.trim(),
    analogy:
      "Basic types are like labels on storage bins: \"text only,\" \"numbers only,\" \"exactly one name and one age, in that order.\" The `any` bin has no label, so anything can go in. Convenient, but nothing stops you from adding something that doesn't belong.",
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
          "Each variable is annotated with the type it may hold. TypeScript enforces that on every later assignment.",
        walkthrough: [
          { code: "let username: string = \"amara\";", explanation: "`: string` means this variable may only hold text." },
          { code: "let age: number = 29;", explanation: "`: number` covers whole numbers and decimals. TypeScript has one numeric type." },
          { code: "age = \"twenty-nine\";", explanation: "A string in a `number` variable breaks its annotation, so TypeScript reports an error." },
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
          "Arrays hold any number of same-typed items. A tuple fixes the number of items and each one's type by position. `any` turns off type checking for a value: powerful but risky.",
      },
    ],
    howItWorks: `
When you write \`let age: number = 29\`, the compiler records that \`age\` is
a \`number\`. It checks every later use against that: reassignments,
function calls, comparisons. It does this by reading the code (hence
"static"). It never runs \`age = "twenty-nine"\` to find the mismatch.

\`any\` tells the compiler to skip that record for a value, so no checks run
against it and mismatches slip through silently.
    `.trim(),
    whyItExists: `
JavaScript already has strings, numbers, booleans and arrays at runtime.
It just can't *declare in advance* which one a variable should hold. Basic
types give you that vocabulary, so the compiler has something to check
against.
    `.trim(),
    whenToUse: `
Add explicit types when a value's type isn't obvious: function parameters,
empty arrays you'll fill later, and tuples where position matters (like an
\`[x, y]\` coordinate). For something like \`let count = 0\`, TypeScript
infers the type, so an annotation is just noise.
    `.trim(),
    whenNotToUse: `
Don't use \`any\` as a default when you're unsure of a type. It silently
turns off the checking you wanted. Work out the real type, or use
\`unknown\` when you truly don't know yet. \`unknown\` is safer because it
forces you to check the value before using it.
    `.trim(),
    commonMistakes: [
      "Using `any` whenever a type is inconvenient, which turns off checking for that value and everything derived from it.",
      "Confusing a tuple with an array. `[string, number]` is exactly two items in that order; `(string | number)[]` allows any number of items in any order.",
      "Over-annotating obvious values, like `let count: number = 0`, when TypeScript infers `number` from the `0`.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Declare three typed variables: a `string` for a city name, a `number` for its population and a `boolean` for whether it's a capital." },
      { difficulty: "Medium", prompt: "Create a tuple type for an RGB color, `[number, number, number]`, and a variable of that type. Then try adding a fourth number and read the error." },
      { difficulty: "Hard", prompt: "Write a function `describe(value: any)` that logs `value.length`. Call it with a number and notice TypeScript doesn't catch the runtime error. Then change the parameter to `unknown` and see what TypeScript requires before you can access `.length`." },
    ],
    interviewQuestions: [
      { question: "What's the difference between `string[]` and `[string, number]`?", answer: "`string[]` is an array of any length where every element is a string. `[string, number]` is a tuple: exactly two elements, a string then a number, checked by position." },
      { question: "Why is overusing `any` considered bad practice?", answer: "It turns off type checking for that value, so mistakes pass silently. That defeats the point of TypeScript for that code." },
      { question: "Does TypeScript have separate types for integers and floating-point numbers?", answer: "No. One `number` type covers all numeric values, matching how JavaScript represents numbers." },
      { question: "What's the key difference between `any` and `unknown`?", answer: "Both can hold any value. `any` turns off checking completely. `unknown` makes you narrow the value first (with a type guard, `typeof` check or assertion) before you can use it. It's the safe version of \"could be anything.\"" },
      { question: "Given `let x: unknown = getValue(); x.trim();`, does this compile?", answer: "No. `x` might hold a string at runtime, but its declared type is `unknown`, so TypeScript won't allow `.trim()` until you narrow it, for example with `if (typeof x === \"string\") { x.trim(); }`." },
      { question: "What type does TypeScript infer for `let count = 0;` when no annotation is written?", answer: "`number`. For a `let` (or `var`), TypeScript infers the broader type of the initializer, since the variable may be reassigned later." },
      { question: "What type does TypeScript infer for `const count = 0;`, and how is that different from the `let` case?", answer: "The literal type `0`, not `number`. A `const` can't be reassigned, so its value is always exactly `0` and TypeScript keeps the more precise type." },
      { question: "Why does `let age: number = 29; age = \"twenty-nine\";` get rejected by TypeScript, even though the equivalent plain JavaScript runs fine?", answer: "JavaScript lets a variable hold any type at any time. TypeScript locks it: once `age` is annotated (or inferred) as `number`, every later assignment is checked, and a `string` fails." },
      { question: "Can you append a fourth item to a variable typed as `let profile: [string, number]` using `.push()`?", answer: "Surprisingly, often yes. `push` on a tuple is loosely checked and won't always error, even though reading a fourth element or assigning a longer tuple would be rejected. It's a well-known sharp edge with tuples and mutating array methods." },
      { question: "At runtime, is there any difference between an array declared as `string[]` and one declared as `Array<string>`?", answer: "No. They're two ways to write the same type. Both compile to an ordinary JavaScript array and are checked the same way." },
      { question: "Why does `let profile: [string, number] = [34, \"Priya\"];` fail to compile?", answer: "A tuple checks each position: the first slot must be `string`, the second `number`. The values are in the wrong order, so the assignment doesn't match even though both types are present." },
      { question: "What's the practical downside of writing `let scores = [];` instead of `let scores: number[] = [];`?", answer: "With nothing to infer from, TypeScript often infers `any[]`, so nothing pushed into `scores` is checked. Declaring the element type keeps the contents checked from the start." },
      { question: "If you get back a JSON payload from an API and you don't yet know its exact shape, should you type it as `any` or `unknown`?", answer: "`unknown`. It holds any shape just as well, but forces you to check the value before using it. `any` would let wrong assumptions about the payload go unchecked." },
      { question: "Can a `boolean`-typed variable hold values like `0`, `\"\"`, or `null` the way a JavaScript `if` condition treats them as falsy?", answer: "No. `boolean` accepts only `true` and `false`. Falsy values behave like `false` in a runtime condition, but they aren't `boolean`." },
      { question: "When would a tuple be a better fit than an interface for representing two related values, like a name and an age?", answer: "A tuple fits when position alone carries the meaning, like a function that always returns `[value, error]`. Use an interface when named fields help or there are more than a couple of values, since names are clearer than indexes." },
      { question: "Why is `any` sometimes called an \"escape hatch,\" and why is it risky when it flows into other code?", answer: "It's for rare cases where you can't express a type. The risk is that `any` spreads: anything derived from it, like a property access or return value, is also `any`, so the loss of checking flows through the code that touches it." },
      { question: "What is *type widening*, and where does it show up with basic types?", answer: "TypeScript inferring a broader type for a mutable variable than its value. For example, `let x = 5` is inferred as `number`, not the literal type `5`, because `x` could later hold another number." },
      { question: "Why doesn't declaring `let count: number = 0;` gain you anything over just writing `let count = 0;`?", answer: "TypeScript already infers `number` from `0`. The annotation adds noise but no safety." },
      { question: "Is `unknown` a subtype of every other type, the way `any` is often loosely described?", answer: "Not quite. `any` works in both directions: it can be assigned to anything and anything can be assigned to it. `unknown` accepts any value, but can't be assigned to a more specific type without narrowing first. That asymmetry is what makes it safer." },
      { question: "If a function parameter is typed `any`, does TypeScript check calls to methods on that parameter, like `param.whatever.you.want()`?", answer: "No. On an `any` value, TypeScript checks no property accesses, method calls or arguments, so that call compiles even if it would throw at runtime." },
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
      "A named description of the properties an object must have and the type of each.",
    explanation: `
Most real data is an object with several properties, like a user with a
name, email and age. Writing that shape out inline everywhere gets
repetitive, and nothing ties the copies together as "the same shape."

An **interface** gives the shape a name, once. You list the properties and
their types, then reuse the name everywhere. If an object is missing a
required property, has one with the wrong type, or doesn't match where the
shape is expected, TypeScript flags it immediately.
    `.trim(),
    analogy:
      "An interface is like a form with labeled blanks: \"Name: ___, Email: ___, Age: ___.\" You must fill every required blank with the right kind of answer. You can't skip the email, or write your age as \"twenty\" instead of a number.",
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
          "`User` describes the shape once. The `user` variable and the `greet` function both reuse it, so every `User` is checked against the same definition.",
        walkthrough: [
          { code: "interface User {", explanation: "Declares a named shape called User." },
          { code: "  name: string;\n  email: string;\n  age: number;", explanation: "Each line is a required property and its type." },
          { code: "const user: User = {...}", explanation: "The object is checked against User. A missing property or wrong type would be an error here." },
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
          "A `?` after a property name makes it optional, so objects without it are still valid. `readonly` lets a property be set once but never reassigned.",
      },
    ],
    howItWorks: `
An interface produces no JavaScript. It exists only at compile time, as a
description the compiler checks objects, parameters and variables against.

When you annotate a value with an interface, TypeScript compares its
properties to the ones the interface requires and flags anything missing or
mismatched. After compiling, the interface is discarded and leaves no trace
in the \`.js\` output.
    `.trim(),
    whyItExists: `
Without a name, every function expecting "an object with a name, email and
age" would spell the shape out inline, with no guarantee two copies mean
the same thing. An interface gives the shape one reusable, checkable name,
so intent is clearer and mistakes are caught consistently.
    `.trim(),
    whenToUse: `
Use an interface whenever you describe an object's shape: object
parameters, API responses, component props, or any structure you reuse.
    `.trim(),
    whenNotToUse: `
For something that isn't an object shape, like a union of strings, a
function type or a primitive alias, a type alias (covered next) usually
fits better. Interfaces are for "objects with named properties."
    `.trim(),
    commonMistakes: [
      "Forgetting the `?` on a property that's really optional, forcing every object to include it.",
      "Assuming `readonly` protects the object at runtime. It's a compile-time check only; plain JavaScript or an unsafe cast can still change the value.",
      "Repeating the same object shape inline in several places instead of naming it once as an interface.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write an interface `Book` with `title: string`, `author: string` and `pages: number`, then create an object that satisfies it." },
      { difficulty: "Medium", prompt: "Add an optional property `isbn?: string` to `Book`, then create two valid `Book` objects: one with an ISBN and one without." },
      { difficulty: "Hard", prompt: "Write a function `printSummary(book: Book): string` that returns a formatted string. Add a `readonly` property to `Book` that would cause a compiler error if the function tried to change it." },
    ],
    interviewQuestions: [
      { question: "What is an interface used for in TypeScript?", answer: "Naming and reusing an object's shape (its required properties and their types) so the compiler can check objects against it consistently." },
      { question: "Does an optional property (`prop?: type`) allow the property to be `undefined`, or does it allow the property to be omitted entirely?", answer: "Both. It can be left out of the object, or included and set to `undefined`." },
      { question: "Do interfaces exist at runtime in the compiled JavaScript?", answer: "No. Interfaces are compile-time only and produce no runtime code." },
      { question: "What is *structural typing*, and how does it relate to how interfaces are checked?", answer: "TypeScript compares types by shape (which properties exist and their types), not by name. Any object with the right properties satisfies an interface, whether or not it was ever annotated with that interface's name." },
      { question: "Given `interface User { name: string } const obj = { name: \"Kai\", age: 5 }; const u: User = obj;`, does this compile, even though `obj` has an extra `age` property?", answer: "Yes. `obj` is an existing variable, not a fresh object literal, so TypeScript only checks that it has at least the properties `User` requires. Extra properties are allowed." },
      { question: "Why does `const u: User = { name: \"Kai\", age: 5 };` fail to compile, when assigning the equivalent object through a variable (as in the previous question) does not?", answer: "This is the excess property check. Object literals written right at the assignment are checked more strictly, because an extra property there is usually a typo or a misunderstanding of the shape. The check doesn't apply to an object already stored in another variable." },
      { question: "Does marking a property `readonly` on an interface prevent it from ever being changed, even by plain JavaScript or a type assertion?", answer: "No. `readonly` is compile-time only. TypeScript rejects direct reassignment, but a type assertion or unchecked code can still change it at runtime, since nothing of the restriction remains in the compiled JavaScript." },
      { question: "If `discountCode?: string` is declared on an interface, what is its type inside code that has already confirmed the object has it?", answer: "`string`. Optional means \"`string`, or absent/`undefined`\", and once you check (for example `if (item.discountCode)`) TypeScript narrows `string | undefined` to `string`." },
      { question: "Can two objects that were never declared with the same interface name still both satisfy that interface?", answer: "Yes. Interfaces check structure, not identity, so any object with matching property names and types satisfies it, however it was created or annotated." },
      { question: "What happens if you declare `interface User { name: string }` a second time later in the same scope, adding `interface User { age: number }`?", answer: "TypeScript merges them into one interface with both `name` and `age`. This is *declaration merging*, and only interfaces support it. A duplicate `type` alias name is a compile error." },
      { question: "How would you make one interface build on another, like an `Admin` that has everything a `User` has plus a `permissions` field?", answer: "`interface Admin extends User { permissions: string[] }`. `extends` copies in every property from `User`, so an `Admin` must satisfy all of `User` plus the new field." },
      { question: "Can an interface describe a property whose key names aren't known in advance, like an object being used as a dictionary?", answer: "Yes, with an index signature: `interface Scores { [username: string]: number }` describes an object where every key is a string and every value a number, however many keys there are." },
      { question: "Can an interface property hold a function, and if so, how is it typed?", answer: "Yes. `interface Logger { log: (message: string) => void }` requires `log` to be a function taking a `string` and returning nothing. Any function assigned to `log` is checked against that signature." },
      { question: "If an interface property's type is itself another interface, like `interface Order { customer: User }`, how deep does TypeScript's checking go?", answer: "All the way down. Nested shapes are checked recursively, so `customer` must satisfy every requirement of `User`, not just be present." },
      { question: "Why does defining the same object shape inline in several different function signatures tend to cause problems over time?", answer: "Nothing ties the copies together. If the shape changes, say a new required field, you must update every copy by hand, and they easily drift apart. A named interface gives you one place to update." },
      { question: "Is it valid to have a required property listed after an optional one in an interface, like `interface Item { discount?: number; name: string }`?", answer: "Yes. Unlike function parameters, interface properties are matched by name, not position, so order doesn't matter." },
      { question: "What would happen if you forgot the `?` on a property that's genuinely sometimes absent, like writing `discountCode: string` instead of `discountCode?: string`?", answer: "Every object would have to include `discountCode`. Objects that legitimately have none would fail, forcing callers to invent placeholder values just to satisfy the compiler." },
      { question: "When would a type alias be a more natural fit than an interface for describing something?", answer: "When the thing isn't \"an object with named properties\": a union of allowed values, a tuple or a function signature. A type alias can express those directly; an interface can't." },
      { question: "Does an interface itself appear anywhere in the compiled `.js` output?", answer: "No. It's only used for checking during compilation, then discarded. No runtime object, class or value corresponds to it." },
      { question: "If a function parameter is typed with an interface, what happens if you call the function with an object missing one required property?", answer: "TypeScript reports a compile error at the call site naming the missing property. The mismatch is caught before the code runs." },
      { question: "Scenario: you want a `Config` interface where `apiUrl` is required but `timeout` should fall back to a sensible number if the caller doesn't provide it. Does the interface itself supply that fallback?", answer: "No. `timeout?: number` only says the property may be absent. You still write the fallback yourself where the object is used, such as `config.timeout ?? 5000`." },
      { question: "Why are interfaces particularly well suited to describing the props a UI component accepts?", answer: "Props are almost always a plain object with a fixed set of named fields, some required and some optional. That's exactly what interfaces describe, so a missing or mistyped prop is caught at the call site instead of at render time." },
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
      "Give any type, not just an object shape, a reusable name.",
    explanation: `
Not every type you want to reuse is an object. It might be a set of
allowed strings like \`"pending" | "shipped" | "delivered"\`, a function
signature, or just a long type you don't want to repeat.

A **type alias**, written with the \`type\` keyword, gives *any* type a
name: an object shape, a union of values, a tuple, a function signature.
Then you use the name everywhere instead of the full definition.
    `.trim(),
    analogy:
      "A type alias is a nickname for a phrase you keep repeating. Instead of saying \"the delivery status, which is pending, shipped or delivered\" every time, you just say \"OrderStatus\" and everyone knows what you mean.",
    examples: [
      {
        title: "Naming a union of specific values",
        code: `type OrderStatus = "pending" | "shipped" | "delivered";

let status: OrderStatus = "shipped";

status = "cancelled";
// Error: Type '"cancelled"' is not assignable to type 'OrderStatus'.`,
        explanation:
          "`OrderStatus` isn't an object shape; it's a fixed set of allowed strings. Type aliases can name this kind of type. Interfaces can't.",
        walkthrough: [
          { code: 'type OrderStatus = "pending" | "shipped" | "delivered";', explanation: "Names the union of these three strings OrderStatus." },
          { code: 'let status: OrderStatus = "shipped";', explanation: "status may only hold one of the three values." },
          { code: 'status = "cancelled";', explanation: "\"cancelled\" isn't allowed, so TypeScript rejects it." },
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
          "For plain object shapes, `type` and `interface` do almost the same job. The differences show up in advanced cases: interfaces can be reopened to add properties (declaration merging), and type aliases can describe unions, tuples and other non-object types.",
      },
    ],
    howItWorks: `
Like an interface, a type alias exists only at compile time. The compiler
substitutes it wherever it's used, and it leaves no trace in the compiled
JavaScript.

The difference is what it can name. An interface only describes object
shapes. A type alias can name any type: unions, tuples, function
signatures, primitives and object shapes.
    `.trim(),
    whyItExists: `
Object shapes aren't the only types worth reusing. Sets of allowed strings,
function signatures and combinations of types all benefit from one readable
name. Type aliases cover everything an interface can't express.
    `.trim(),
    whenToUse: `
Use a type alias to name a union (like a fixed set of strings), a tuple, a
function signature, or anything that isn't strictly "an object with these
properties." It's also fine for object shapes if your team prefers
**type** over **interface** for consistency.
    `.trim(),
    whenNotToUse: `
If an object shape may need more properties merged in from elsewhere later
(common in libraries), use an interface: it supports declaration merging
and a type alias doesn't. For everyday object shapes, either works.
    `.trim(),
    commonMistakes: [
      "Thinking `type` and `interface` are fully interchangeable. Type aliases can express unions and other non-object types that interfaces can't.",
      "Trying to \"reopen\" a type alias to add properties, as you can with an interface. Type aliases can't be merged.",
      "Giving a type alias the same name as an existing variable or type in the same scope, causing a naming collision.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Create a type alias `Direction` that can only be \"up\", \"down\", \"left\" or \"right\", and declare a variable of that type." },
      { difficulty: "Medium", prompt: "Create a type alias `Coordinate` for a `[number, number]` tuple. Write a function `move(point: Coordinate, direction: Direction): Coordinate` that returns a new coordinate." },
      { difficulty: "Hard", prompt: "Write a type alias `Comparator` for a function that takes two numbers and returns a number. Then write `sortNumbers(nums: number[], compare: Comparator): number[]` that uses it." },
    ],
    interviewQuestions: [
      { question: "What can a type alias describe that an interface cannot?", answer: "Unions, tuples, function signatures and primitive types. A type alias can name any type; an interface only describes object shapes." },
      { question: "What is declaration merging, and which of `type` or `interface` supports it?", answer: "Declaring the same named shape more than once and having TypeScript combine them into one. Only `interface` supports it; declaring a `type` alias name twice is an error." },
      { question: "For a simple object shape, does it matter whether you use `type` or `interface`?", answer: "Usually not. Both check objects the same way. It comes down to team convention, unless you need a feature only one supports." },
      { question: "Does writing `type ID = string;` create a genuinely new type distinct from `string`?", answer: "No. It's another name for the same type. An `ID` works anywhere a `string` does and vice versa, unlike \"branded\" or \"nominal\" types in some languages." },
      { question: "Given `type ID = string | number; let id: ID = \"abc123\"; id = 42;`, does the second assignment compile?", answer: "Yes. `42` is a `number`, which the union allows. `id = true;` would fail, since `boolean` isn't in the union." },
      { question: "Can a type alias reference itself, like `type Tree = { value: number; children: Tree[] };`?", answer: "Yes, for object shapes. It's a recursive type alias. TypeScript resolves it lazily instead of expanding it forever, which lets you model nested structures like trees or JSON with one named type." },
      { question: "What happens if you declare `type Status = \"active\" | \"inactive\";` twice in the same scope?", answer: "A compile error. Unlike `interface`, a `type` alias can't be declared twice; there's no merging." },
      { question: "How would you type a variable that holds a function signature, like a comparator used for sorting?", answer: "With a type alias for the function shape: `type Comparator = (a: number, b: number) => number;`. Any function assigned to a variable of that type is checked against those parameters and return type." },
      { question: "Given `type Status = \"active\" | \"inactive\"; function setStatus(s: Status) {}`, why does `setStatus(\"Active\")` fail to compile?", answer: "`Status` allows only the exact strings `\"active\"` and `\"inactive\"`. String literal types are case-sensitive, so `\"Active\"` isn't allowed." },
      { question: "How would you express \"a `User` extended with an extra `permissions` field\" using type aliases instead of `interface extends`?", answer: "With an intersection: `type Admin = User & { permissions: string[] };`. The `&` combines both shapes, requiring everything from `User` plus the new field. It's the type-alias equivalent of `extends`." },
      { question: "You need to model a value that's always either a `User` object or a `Guest` object, distinguished by a shared `kind` field. Would you reach for `interface` or `type` here, and why?", answer: "A `type` alias, because the value is a union (`User | Guest`). An interface can only describe a single object shape. Each branch can still be an interface; only the union needs `type`." },
      { question: "Why can a type alias name \"literally any type,\" while an interface is limited to object shapes?", answer: "A type alias is a name bound to any type expression: a union, tuple, function signature, primitive or object shape. Interface syntax only declares named properties, so it can't represent something like a union of strings." },
      { question: "If you write `type Point = { x: number; y: number };` and separately `interface PointInterface { x: number; y: number }`, are values typed as one assignable to the other?", answer: "Yes. TypeScript checks structurally and both describe the same shape, so each is assignable to the other." },
      { question: "What's the main practical trade-off a team gives up by adopting \"always use `type`, never `interface`\" as a blanket style rule?", answer: "Declaration merging: reopening a declared shape to add properties later, which some patterns (especially library type definitions) rely on. In most application code it rarely matters." },
      { question: "Can a tuple type be given a name with a type alias, and why would you want that?", answer: "Yes, for example `type Coordinate = [number, number];`. Every function can then use `Coordinate` instead of repeating `[number, number]`, and there's one definition to change." },
      { question: "Why can't an interface be used to name a type like `type Direction = \"up\" | \"down\" | \"left\" | \"right\";`?", answer: "Interface syntax only declares named properties on an object. There's no way to say \"one of these four strings\" with it, because an interface describes an object's shape, not a value." },
      { question: "Naming a type alias the same as an existing variable in the same scope — is that allowed?", answer: "Technically yes: types and values live in separate namespaces, so `type User = {...}` and `let User = ...` can coexist. It's confusing, so avoid it. Two types with the same name are still an error." },
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
      "Annotate a function's parameters and return value so TypeScript can check every call.",
    explanation: `
A function is a contract: "give me these inputs and I'll give you this
output." In plain JavaScript that contract lives only in comments or your
head. Nothing stops a caller passing the wrong kind of argument, or too
few.

TypeScript writes the contract into the signature. Each parameter gets a
type, and so does the return value, so both inputs and output are checked.
Mark a parameter **optional** with \`?\` and callers may leave it out; if
they do, its value inside the function is \`undefined\`.
    `.trim(),
    analogy:
      "A typed function signature is like a vending machine's coin slot: shaped for one coin size and labeled with what it dispenses. The wrong object simply won't go in, so you find out right away, not after the machine jams.",
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
          "TypeScript checks the types passed in and the type returned. If the body tried to `return \"total\"` instead of a number, that would be an error too.",
        walkthrough: [
          { code: "function calculateTotal(price: number, taxRate: number): number {", explanation: "Both parameters must be numbers, and the function must return a number." },
          { code: "return price + price * taxRate;", explanation: "Ordinary arithmetic, unaffected by the annotations." },
          { code: 'calculateTotal("100", 0.07);', explanation: "A string for price breaks the parameter type, so TypeScript flags the call before it runs." },
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
          "The `?` after `greeting` lets callers omit it, in which case it's `undefined` inside the function. A default value also makes a parameter omittable, and supplies a fallback automatically.",
      },
    ],
    howItWorks: `
For each call, the compiler matches each argument to its parameter, in
order, and flags any type mismatch, including too many or too few
arguments. It also checks every \`return\` statement against the declared
return type.

Optional parameters (\`?\`) must come after all required ones, because
arguments are matched to parameters by position.
    `.trim(),
    whyItExists: `
Function calls are a common source of bugs: arguments in the wrong order,
a missing argument, or assuming a function returns something it doesn't.
With an explicit, checkable contract, TypeScript catches these at the call
site right away instead of when the function runs with bad data.
    `.trim(),
    whenToUse: `
Type the parameters of almost every function, especially ones used in
several places or by other parts of the codebase. Return types are optional
(TypeScript can usually infer them), but writing them documents intent and
catches a body that accidentally returns the wrong type.
    `.trim(),
    whenNotToUse: `
For a small inline callback like \`array.map(x => x * 2)\`, TypeScript
usually infers the parameter type from context, so an annotation is just
noise.
    `.trim(),
    commonMistakes: [
      "Putting an optional parameter before a required one. TypeScript doesn't allow it; optional parameters come last.",
      "Confusing an optional parameter (`name?: string`) with a default value (`name: string = \"Guest\"`). The first can be `undefined` inside the function; the second never is.",
      "Thinking a return type annotation changes what the function returns at runtime. It's only a compile-time check; the function's logic decides the value.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a function `square(n: number): number` that returns `n` squared. Call it correctly and incorrectly to see the error." },
      { difficulty: "Medium", prompt: "Write a function `formatName(first: string, last: string, middle?: string): string` that combines the names and handles a missing `middle`." },
      { difficulty: "Hard", prompt: "Write a function `createUser(name: string, role: string = \"member\")` that returns an object matching a `User` interface you define. Explain why `role` doesn't need a `?` even though callers can omit it." },
    ],
    interviewQuestions: [
      { question: "What happens if you call a TypeScript function with the wrong number of arguments?", answer: "The compiler reports an error at the call site. Too few required arguments and too many are both caught before the code runs." },
      { question: "What's the difference between an optional parameter and one with a default value?", answer: "An optional parameter (`x?: T`) can be omitted and is then `undefined` inside the function. A parameter with a default (`x: T = val`) can also be omitted, but then takes the default value instead." },
      { question: "Is a function's return type annotation required?", answer: "No. TypeScript can usually infer it from the body. Writing it is optional, but adds clarity and an extra safety check." },
      { question: "Why must optional parameters come after all required ones in a function signature?", answer: "Arguments are matched by position, not name. If an optional parameter came first, there'd be no way to tell whether a single argument was meant for the optional slot or the required one after it." },
      { question: "Given `function greet(name: string, greeting?: string) { return greeting ?? \"Hi\"; }`, what is the declared type of `greeting` inside the function body?", answer: "`string | undefined`. Marking a parameter `?` also adds `undefined` to its type inside the function, which is why `greeting ?? \"Hi\"` is needed." },
      { question: "Is `function f(a?: number, b: number) {}` valid TypeScript?", answer: "No, it's a compile error. Optional `a` comes before required `b`, and optional parameters must come after all required ones." },
      { question: "Can a parameter have both a `?` and a default value, like `function f(x?: number = 5) {}`?", answer: "No, it's a compile error. A default already makes the parameter optional, so TypeScript doesn't allow adding `?` as well." },
      { question: "How do you type a function that accepts any number of arguments, like `sum(1, 2, 3, 4)`?", answer: "With a rest parameter: `function sum(...nums: number[]): number`. Arguments after any fixed parameters are collected into the `nums` array, and each is checked against the element type." },
      { question: "How would you type a variable meant to hold a function, rather than a function declaration itself — for example, a variable that should only ever be assigned an operation on two numbers?", answer: "With a function type: `let op: (a: number, b: number) => number;`. Any function assigned to `op` is checked against those parameters and return type." },
      { question: "Why does TypeScript usually let you skip annotating the parameter type inside a callback like `array.map(x => x * 2)`?", answer: "*Contextual typing*: TypeScript knows the array's element type, so it infers `x` from context. An annotation would just repeat what it already knows." },
      { question: "If `calculateTotal(price: number, taxRate: number): number` is called as `calculateTotal(100)`, what happens?", answer: "A compile error. Every parameter without `?` or a default must be supplied, and `taxRate` is required." },
      { question: "Given `function createUser(name: string, role: string = \"member\") {}`, does a caller have to know or write anything different from calling a required-parameter function?", answer: "No. For callers, `role` works like an optional parameter, so `createUser(\"Kai\")` is valid. Inside the function `role` is plain `string`, never `undefined`, because the default always provides a value." },
      { question: "What does annotating a function's return type as `: void` communicate, versus `: undefined`?", answer: "`void` means the return value isn't meant to be used; it's the usual annotation for functions run for side effects. `undefined` is a narrower claim that the function returns exactly `undefined`, which is rarely what you mean." },
      { question: "If a function's body has a `return \"done\";` statement but its signature declares `: number`, what happens?", answer: "A compile error on that `return`, because the value doesn't match the declared return type. The body is checked against its own signature, just as calls are checked against parameter types." },
      { question: "Does an explicit return type annotation change what value a function actually returns at runtime?", answer: "No. It only checks at compile time that the `return` statements match. The function's logic decides the real value; the annotation can't change or coerce it." },
      { question: "You pass an object literal directly into a function parameter typed with an interface, and it has one extra property the interface doesn't list. Does this behave differently than passing a variable holding the same object?", answer: "Yes. A fresh object literal at the call site triggers the excess property check and errors on the extra property. A variable holding the same object doesn't, because the stricter check only applies where the literal is written." },
      { question: "Why is a typed function signature sometimes compared to a vending machine's coin slot?", answer: "The slot (parameter types) only accepts specific inputs, and what comes out (the return type) is known in advance. The wrong input is rejected immediately instead of causing a jam (a runtime error) later." },
      { question: "Between annotating every function parameter and every function's return type, which matters more for catching call-site mistakes, and why?", answer: "Parameters. Most call-site mistakes, like a wrong type or wrong argument count, are caught when arguments are checked against parameter types. Return types can usually be inferred, though writing them still documents intent and catches an accidental wrong-type return." },
    ],
    prerequisites: ["type-aliases"],
    relatedTopics: ["interfaces", "type-aliases", "generics"],
    keywords: ["function types", "parameters", "return type", "optional parameter", "default value"],
  },
];
