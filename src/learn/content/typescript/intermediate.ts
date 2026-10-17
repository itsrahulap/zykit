import type { Topic } from "../../types/content";

export const typescriptIntermediateTopics: Topic[] = [
  {
    id: "union-intersection-types",
    title: "Union & Intersection Types",
    level: "intermediate",
    description:
      "Combine types with `|` for \"one of these\" and with `&` for \"all of these, merged.\"",
    explanation: `
Some values can take more than one shape. A lookup function might accept
an \`id\` (a number) *or* a \`slug\` (a string). No single basic type
describes that.

A **union type**, written \`A | B\`, is a value that is one of several
types. \`string | number\` means "a string or a number." Before doing
something that only works for one of them, you must check which one you
have (this is narrowing, covered in a later topic).

An **intersection type**, written \`A & B\`, goes the other way: the value
must satisfy *all* the shapes **at once**. If \`A\` has \`name\` and \`B\`
has \`age\`, then \`A & B\` is one object with both \`name\` and \`age\`.
    `.trim(),
    analogy:
      "A union is a form field that accepts \"a phone number or an email\": either one. An intersection is a job application that needs a resume AND a cover letter: every piece, in one submission.",
    examples: [
      {
        title: "A union type for flexible input",
        code: `function lookup(idOrSlug: number | string): void {
  console.log(\`Looking up: \${idOrSlug}\`);
}

lookup(42);        // OK — it's a number
lookup("my-post"); // OK — it's a string
lookup(true);
// Error: Argument of type 'boolean' is not assignable
// to parameter of type 'string | number'.`,
        explanation:
          "`idOrSlug` may be a number or a string, nothing else. Any other value is rejected.",
        walkthrough: [
          { code: "function lookup(idOrSlug: number | string): void {", explanation: "The parameter must be one of these two types." },
          { code: "lookup(42);", explanation: "A number matches the union, so this is valid." },
          { code: "lookup(true);", explanation: "A boolean is neither, so it's rejected." },
        ],
      },
      {
        title: "An intersection type combining two shapes",
        code: `interface HasName {
  name: string;
}

interface HasAge {
  age: number;
}

type Person = HasName & HasAge;

const p: Person = { name: "Tariq", age: 41 }; // must have both

const invalid: Person = { name: "Tariq" };
// Error: Property 'age' is missing in type
// '{ name: string; }' but required in type 'HasAge'.`,
        explanation:
          "`Person` is the intersection of `HasName` and `HasAge`, so a `Person` needs every property from both.",
      },
    ],
    howItWorks: `
For a union \`A | B\`, the compiler only allows operations that are safe
for *both* \`A\` and \`B\`. Anything specific to one needs narrowing first
(checking which one you have at runtime).

For an intersection \`A & B\`, the compiler merges the members of both and
requires an object to have all of them. So it combines the
*requirements*, even though it's called an intersection.
    `.trim(),
    whyItExists: `
Real data often varies in shape. An API response might be a success or an
error object; a function might accept a couple of input forms. Unions
describe that precisely, instead of falling back to **any** and losing all
checking.

Intersections let you build a bigger shape from smaller reusable pieces
instead of repeating properties across similar interfaces.
    `.trim(),
    whenToUse: `
Use a union when a value can really be more than one type: a result that
can succeed or fail, a parameter that accepts a few related shapes, or
data from an unpredictable external source.

Use an intersection to combine smaller, independently useful shapes into
one, especially if those shapes are reused on their own.
    `.trim(),
    whenNotToUse: `
Don't pile more than a handful of types into one union. Code handling
every case gets hard to read, and it may mean the values should share a
common structure (see discriminated unions).

Don't intersect incompatible types (like **string & number**, which gives
the unusable **never** type). Intersections only make sense between
compatible object shapes.
    `.trim(),
    commonMistakes: [
      "Accessing a property that exists on only one branch of a union before narrowing.",
      "Confusing `|` and `&`. A union (`|`) means \"could be either\"; an intersection (`&`) means \"must be both, combined.\"",
      "Intersecting types that share a property name with conflicting types (like `string` and `number`), which silently turns that property into `never`.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a type alias `Id` as `string | number` and a function `printId(id: Id): void` that logs it." },
      { difficulty: "Medium", prompt: "Define interfaces `Timestamped` (`createdAt: Date`) and `Named` (`name: string`). Combine them into an intersection type `NamedEvent` and create a valid object of that type." },
      { difficulty: "Hard", prompt: "Write a function that accepts `string | string[]` and always returns a `string[]`: wrap a single string in an array, or return the array as-is." },
    ],
    interviewQuestions: [
      { question: "What can you safely do with a value typed `string | number` before narrowing it?", answer: "Only operations valid for both branches. Anything specific to one type is refused until you check which one you have." },
      { question: "What does `A & B` require of a value, in terms of properties?", answer: "Every member of both `A` and `B` at once. An intersection combines requirements instead of offering a choice." },
      { question: "Why does intersecting two incompatible primitive types, like `string & number`, produce the `never` type?", answer: "No value can be both a `string` and a `number`, so the set of valid values is empty. TypeScript calls that empty set `never`." },
      { question: "Given `function f(x: string | number) { x.toUpperCase(); }`, why does this fail to compile even though `x` might genuinely be a string at runtime?", answer: "TypeScript checks the type, not the actual value. `x` could be a `number`, which has no `toUpperCase`, so the call isn't safe for every case the union allows." },
      { question: "If `HasName` and `HasAge` both declare `id: string` with the same type, what happens when you intersect them?", answer: "They merge into one `id: string` requirement. A conflict only happens when the same property has *incompatible* types." },
      { question: "What happens to a property that two intersected types declare with conflicting, incompatible types (e.g. `string` in one, `number` in the other)?", answer: "It becomes `never`, since no value can be both types. The resulting type is effectively impossible to construct." },
      { question: "In what sense does an intersection type `A & B` combine \"requirements\" rather than combine \"possibilities\"?", answer: "A union widens what's acceptable (either type qualifies). An intersection narrows it to values that meet every requirement of both types at once." },
      { question: "How would you type a function that accepts either a single `string` or an array of strings?", answer: "As `string | string[]`. You then narrow it (for example with `Array.isArray`) before treating it as one or the other." },
      { question: "Why does TypeScript reject calling a method that exists on only one branch of a union, without an explicit runtime check first?", answer: "The compiler can't prove which branch you have there, so it only allows operations valid for every branch until a check narrows the type." },
      { question: "What's the practical difference between typing a parameter as `string | number` versus typing it as `any`?", answer: "`string | number` still requires one of those two types and narrowing before type-specific use. `any` turns off checking, allowing any value and any operation." },
      { question: "Is `{ name: \"Tariq\" }` assignable to `type Person = HasName & HasAge`?", answer: "No. The intersection needs every property from both, so an object missing `age` fails, even though it satisfies `HasName`." },
      { question: "Why are intersection types useful for building up a type from smaller, reusable pieces?", answer: "You define small interfaces once and combine them with `&` where needed, instead of repeating the same properties in several similar interfaces." },
      { question: "Why should you avoid piling more than a handful of types into a single union?", answer: "Handling every branch gets hard to read past a few cases, and it often means the values share a structure better expressed as a discriminated union." },
      { question: "What's a cleaner alternative to a large union of many related object shapes?", answer: "A discriminated union: give each shape a shared \"tag\" property with a distinct literal value, so checking that one property narrows cleanly to the right branch." },
      { question: "Can a union mix primitive and object types, like `string | { id: number }`? What's the implication for using it?", answer: "Yes, a union can contain any kinds of types. But each branch still needs its own narrowing check (like `typeof` for the string) before you use anything specific to it." },
      { question: "Why does `lookup(42)` succeed and `lookup(true)` fail for a parameter typed `number | string`?", answer: "`42` matches one of the union's types. `boolean` isn't in `number | string`, so it matches neither branch." },
      { question: "If `A` and `B` each declare a method with the same name but different, incompatible parameter types, what tends to happen when you intersect them?", answer: "TypeScript intersects the two function types. In practice that usually accepts only arguments valid for both signatures at once, often too strict to call usefully." },
      { question: "Why is a union type's *value space* the combination of its branches' values, while an intersection type's *value space* is narrower than either type alone?", answer: "A union accepts a value matching any branch, so each branch added grows the set. An intersection requires a value to meet every type's requirements at once, so adding types only shrinks the set (or leaves it the same)." },
    ],
    prerequisites: ["interfaces", "type-aliases"],
    relatedTopics: ["type-narrowing", "generics", "enums"],
    keywords: ["union type", "intersection type", "or", "and", "combining types"],
  },
  {
    id: "generics",
    title: "Generics",
    level: "intermediate",
    description:
      "Write a function or type once so it works with any type, while keeping that type checked.",
    explanation: `
Here's a function that returns whatever you give it:

\`function identity(value: number): number { return value; }\`

It works for numbers but not strings. You'd need a near-copy for every
type, or you'd use \`any\`, which drops all checking (a caller could pass a
number and treat the result as a string with no error).

What you want is "whatever type goes in, the same type comes out." You
express that with a **type variable**, usually named \`T\`, in angle
brackets before the parameters:

\`function identity<T>(value: T): T { return value; }\`

Now \`identity(5)\` returns a \`number\` and \`identity("hi")\` returns a
\`string\`. TypeScript works out \`T\` for each call from what you passed.
Code written once that works for many types, with each use fully checked,
is called a **generic**.
    `.trim(),
    analogy:
      "A generic function is like an adjustable box mold. Put in a small ball, get a small box; put in a big book, get a big box. One mold, but it never mixes up sizes: the box always fits what went in.",
    examples: [
      {
        title: "A generic identity function",
        code: `function identity<T>(value: T): T {
  return value;
}

const num = identity(5);        // T is inferred as number
const str = identity("hello");  // T is inferred as string

const wrong: string = identity(5);
// Error: Type 'number' is not assignable to type 'string'.`,
        explanation:
          "`T` stands for \"whatever type is passed in.\" TypeScript works out `T` for each call and uses it to check both the argument and how the result is used.",
        walkthrough: [
          { code: "function identity<T>(value: T): T {", explanation: "`<T>` declares a type variable. `value: T` and the return type `T` are the same, not-yet-known type." },
          { code: 'const num = identity(5);', explanation: "TypeScript infers T as number from the argument 5, so `num` is a number." },
          { code: "const wrong: string = identity(5);", explanation: "identity(5) returns a number, so assigning it to a string variable is an error." },
        ],
      },
      {
        title: "A generic function over arrays",
        code: `function firstItem<T>(items: T[]): T | undefined {
  return items[0];
}

const firstNum = firstItem([1, 2, 3]);         // number | undefined
const firstName = firstItem(["Ana", "Bo"]);    // string | undefined

// Generics can also be constrained:
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

longest("hi", "hello"); // works — strings have .length
longest(3, 4);
// Error: number doesn't satisfy the constraint '{ length: number }'.`,
        explanation:
          "`firstItem` works for an array of any type. The `extends` clause on `longest` limits T to types with a `.length` property, so plain numbers are rejected.",
      },
    ],
    howItWorks: `
When you call a generic function, the compiler looks at the arguments and
works out what \`T\` must be. This is **type inference**. It then puts that
type everywhere \`T\` appears and checks the call as if you'd written the
type by hand.

You can also set \`T\` yourself, like \`identity<string>("hi")\`, to be
precise or when inference can't work it out. A **constraint**
(\`T extends SomeShape\`) limits what \`T\` can be, so the function body can
rely on \`T\` having certain properties.
    `.trim(),
    whyItExists: `
Without generics you must either duplicate logic for every type
(**numberIdentity**, **stringIdentity** and so on) or use **any** and lose
checking. Generics let you write the logic once and still get specific type
checking on every call.
    `.trim(),
    whenToUse: `
Use generics when the logic doesn't depend on a specific type: functions
that store, return, wrap or transform what they're given (arrays,
containers, caches, API wrappers). They also suit reusable interfaces, like
an \`ApiResponse<T>\` that wraps different kinds of data.
    `.trim(),
    whenNotToUse: `
If a function only ever works with one type, a type variable is needless
complexity. Write the concrete type. Generics are for type-independent
logic, not something to add to every function.
    `.trim(),
    commonMistakes: [
      "Adding `<T>` to a function that never uses `T` in its parameters or return type. If `T` isn't tied to anything, it checks nothing.",
      "Using `any` when you mean \"any type, but the same type throughout.\" A generic captures that; `any` doesn't.",
      "Skipping a constraint (`extends`) and then using a property in the body that not every `T` has.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a generic function `wrapInArray<T>(value: T): T[]` that returns a one-element array containing the value." },
      { difficulty: "Medium", prompt: "Write a generic function `pluck<T>(items: T[], index: number): T | undefined` that safely returns the item at an index." },
      { difficulty: "Hard", prompt: "Write a generic function `merge<T extends object, U extends object>(a: T, b: U): T & U` that merges two objects and returns their intersection type." },
    ],
    interviewQuestions: [
      { question: "What problem do generics solve that writing a separate function per type would also solve, but worse?", answer: "You write the logic once and still get type-specific checking on every call, instead of near-identical copies like `numberIdentity` and `stringIdentity`." },
      { question: "Why is `any` a worse alternative to a generic for a function like `identity`?", answer: "`any` turns off checking, so a caller could pass a `number` and treat the result as a `string` with no error. A generic ties the return type to the type passed in." },
      { question: "Given `function identity<T>(value: T): T { return value; }`, what type is inferred for `identity(5)`, and how does TypeScript arrive at it?", answer: "`number`. TypeScript works out `T` from the argument `5`, then uses `number` everywhere `T` appears in the signature." },
      { question: "Why does `const wrong: string = identity(5);` fail to compile?", answer: "`T` is inferred as `number`, so `identity(5)` returns a `number`, which can't be assigned to a `string` variable." },
      { question: "How does TypeScript infer a generic type variable when you call the function without specifying it explicitly?", answer: "From the arguments at the call site. It picks the most specific type that makes the call valid and uses it as `T` for that call only." },
      { question: "How do you explicitly specify a generic type argument instead of relying on inference, and when might you need to?", answer: "In angle brackets at the call site, like `identity<string>(\"hi\")`. Use it when inference can't find a specific enough type, or for clarity." },
      { question: "What does adding a constraint like `T extends { length: number }` do to a generic type parameter?", answer: "It limits `T` to types that have a `.length` property. The body can then safely use `.length`, and any type with it is still accepted." },
      { question: "Why does `longest(3, 4)` fail to compile when `longest` is declared as `function longest<T extends { length: number }>(a: T, b: T): T`?", answer: "`number` has no `.length` property, so it doesn't satisfy the constraint." },
      { question: "What's wrong with a generic function whose type parameter `T` never actually appears in its parameters or return type?", answer: "With no input or output tied to `T`, there's nothing to infer it from and nothing to check. It's generic in name only." },
      { question: "Given `function firstItem<T>(items: T[]): T | undefined`, what's the inferred type of `firstItem([\"Ana\", \"Bo\"])`?", answer: "`string | undefined`. `T` is inferred as `string`, and the declared `| undefined` covers an empty array." },
      { question: "Why does `firstItem`'s return type include `| undefined` even though the function body doesn't check the array's length before indexing?", answer: "By default, array indexing doesn't add `undefined` for out-of-bounds access. The `| undefined` is written by hand to honestly represent the empty-array case; the compiler wouldn't infer it." },
      { question: "What's the difference between constraining a generic with `T extends SomeShape` and simply typing a parameter as a union?", answer: "A constraint limits which types `T` may be but keeps and returns the caller's exact type. A union parameter accepts a fixed set of types, and any related return value is only known as that wide union." },
      { question: "Can generics be used on interfaces and type aliases, not just functions?", answer: "Yes. `interface ApiResponse<T> { data: T; error?: string }` describes a wrapper whose contents vary by use while its own shape stays the same." },
      { question: "Why doesn't `any` capture the idea of \"any type, but the same type consistently throughout one call\" the way a generic does?", answer: "`any` turns off checking for each use separately, so nothing keeps the input and output the same type. A generic ties every `T` in a call to one inferred type." },
      { question: "What could go wrong with `function merge<T, U>(a: T, b: U): T & U` if it's called with two primitives, like `merge(1, \"a\")`?", answer: "Without constraints `T` and `U` can be anything. `number & string` is `never`, so the return type is unusable for that call even though it compiles." },
      { question: "How does adding `T extends object, U extends object` to `merge` prevent that problem?", answer: "It rules out primitives, so `T & U` is always an intersection of two object shapes that can be merged sensibly." },
      { question: "When would you prefer a generic function over writing several function overloads, one per accepted type?", answer: "When the logic is the same for every type. Generics express that with one implementation; overloads suit different behavior or return types per input type." },
      { question: "Why is the minimal `identity<T>(value: T): T` function a useful example for understanding generics, despite doing so little?", answer: "It shows the core mechanism alone: a type variable flowing from parameter to return type, inferred per call and preserved through the signature." },
      { question: "What happens if you call `identity<string>(5)`, explicitly specifying `T` as `string`?", answer: "A compile error. Setting `T` doesn't change the argument's type; it fixes what `T` must be, and `5` (a `number`) isn't assignable to `string`." },
      { question: "Does specifying a generic type argument explicitly skip the compiler's checking of the argument against it?", answer: "No. It fixes `T` for that call, but each argument is still checked against the resulting parameter types." },
      { question: "Why might inference occasionally fail to pin down a specific-enough type, forcing you to specify `T` explicitly?", answer: "Some calls are ambiguous. An empty array literal, for example, gives no element to infer from, so the compiler may fall back to an overly wide type." },
      { question: "Does `T extends { length: number }` require the argument to be declared as implementing some specific interface, or just to structurally have a `.length` property?", answer: "Just structurally. Any type with a compatible `.length: number` property satisfies it, whatever its name or origin." },
      { question: "What does a generic type parameter default, like `interface Box<T = string>`, do?", answer: "It gives `T` a fallback when no type argument is supplied: plain `Box` acts like `Box<string>`. You can still write `Box<number>` or any other type." },
      { question: "Compare `function f<T extends string | number>(x: T): T` with `function f(x: string | number): string | number` — what's the key behavioral difference?", answer: "The generic version returns the caller's *exact* type (pass a `string`, get a `string`). The union version always returns `string | number`, losing that detail." },
      { question: "Why does using a generic parameter preserve a value's specific type through a function call, where widening to a union or `any` would lose it?", answer: "A generic ties the return type to the `T` inferred for that call, so the exact type carries through. A union or `any` return type is the same for every call, discarding the specific type." },
      { question: "How would you write a generic function that reverses an array while keeping full type safety?", answer: "`function reverse<T>(items: T[]): T[]`. A `number[]` gives back `number[]` and a `string[]` gives back `string[]`." },
      { question: "Why is a generic container type, like a `Box<T>` that stores and later returns a value, preferable to using `any` for the stored value?", answer: "With `any`, you can store one type and read it back as another. `Box<T>` remembers the type it was created with and enforces it on every read." },
      { question: "What's the relationship between a generic function's type parameter and the concept of type inference specifically?", answer: "Inference is how TypeScript decides what the type parameter is for each call, from the arguments. Without it, you'd have to write the type argument by hand on every call." },
    ],
    prerequisites: ["functions-with-types", "union-intersection-types"],
    relatedTopics: ["union-intersection-types", "utility-types", "mapped-types"],
    keywords: ["generics", "type variable", "type inference", "constraint", "extends"],
  },
  {
    id: "enums",
    title: "Enums",
    level: "intermediate",
    description:
      "A named set of related constants under one type, so you refer to them by name instead of a raw value.",
    explanation: `
Some values are one of a small, fixed set of options: a direction, a
status, a day of the week. You could use plain strings or numbers (\`"UP"\`,
\`0\`, \`1\`) throughout your code, but nothing groups them, and typos like
\`"Up"\` instead of \`"UP"\` are easy to make and hard to catch.

An **enum** ("enumeration") groups related named constants under one type.
You declare the names once. TypeScript accepts each name as a valid value
and rejects any string or number that isn't one of them.
    `.trim(),
    analogy:
      "An enum is like a washing machine dial: Delicate, Normal, Heavy Duty. No in-between settings and no typing your own; you pick one of the fixed, labeled positions.",
    examples: [
      {
        title: "A basic numeric enum",
        code: `enum Direction {
  Up,
  Down,
  Left,
  Right,
}

let move: Direction = Direction.Up;
console.log(move); // 0 — enum members auto-number from 0 by default

function walk(direction: Direction) {
  console.log(\`Walking \${Direction[direction]}\`);
}

walk(Direction.Left);`,
        explanation:
          "Each `Direction` member gets a number automatically, starting at 0. `Direction[direction]` looks the name up from its number, which only numeric enums support.",
        walkthrough: [
          { code: "enum Direction {\n  Up,\n  Down,\n  Left,\n  Right,\n}", explanation: "Four named constants in one type, numbered 0 to 3 by default." },
          { code: "let move: Direction = Direction.Up;", explanation: "move can only hold one of the four Direction values." },
          { code: "walk(Direction.Left);", explanation: "A named member instead of a raw number makes the call self-explanatory." },
        ],
      },
      {
        title: "A string enum",
        code: `enum OrderStatus {
  Pending = "PENDING",
  Shipped = "SHIPPED",
  Delivered = "DELIVERED",
}

function ship(status: OrderStatus) {
  if (status === OrderStatus.Pending) {
    console.log("Preparing shipment...");
  }
}

ship(OrderStatus.Pending);
ship("PENDING" as OrderStatus); // works, but requires an explicit cast`,
        explanation:
          "A string enum gives each member a readable string instead of an auto-incrementing number, so logs and debugging output are much clearer.",
      },
    ],
    howItWorks: `
Unlike an interface or type alias, an enum generates real JavaScript: an
object mapping each member name to its value (and, for numeric enums,
values back to names too). \`Direction.Up\` compiles to reading a property
off that object at runtime.

That makes enums one of the few TypeScript-only features that produce
runtime code.
    `.trim(),
    whyItExists: `
Enums name each option in a small, fixed set. Code reads clearly
(**OrderStatus.Shipped** instead of a bare **"SHIPPED"** string everywhere),
and the compiler catches typos instead of them becoming silent runtime bugs.
    `.trim(),
    whenToUse: `
Use an enum for a small, fixed set of related options that code refers to
by name: status codes, categories, directions, modes. Prefer string enums
over numeric ones when the value may be logged, displayed or sent over the
network, since the string explains itself.
    `.trim(),
    whenNotToUse: `
For a simple set of strings, many teams prefer a union of string literal
types (\`type Status = "pending" | "shipped" | "delivered"\`). It needs no
import, generates no runtime code and works naturally with plain values
from APIs. Use an enum when you want its grouping and reverse lookup.
    `.trim(),
    commonMistakes: [
      "Forgetting numeric enum members auto-increment from 0, so inserting a member in the middle shifts the number of every member after it.",
      "Assuming an enum is compile-time only like an interface. It generates a real JavaScript object at runtime.",
      "Habitually casting raw strings to a string enum (`\"PENDING\" as OrderStatus`) instead of using the member, which undoes some of the safety enums provide.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Create a numeric enum `TrafficLight` with `Red`, `Yellow` and `Green`, and write a function that logs a message for each value." },
      { difficulty: "Medium", prompt: "Convert `TrafficLight` to a string enum with explicit values (\"RED\", \"YELLOW\", \"GREEN\"). In a comment, explain why that may be better for logging." },
      { difficulty: "Hard", prompt: "Rewrite the `TrafficLight` string enum as a union of string literal types, and write a function that works the same with both versions. Note what changes at the call sites and what doesn't." },
    ],
    interviewQuestions: [
      { question: "What problem does an enum solve compared to scattering raw string or number literals like `\"UP\"` or `0` through the code?", answer: "It groups a fixed set of values under one named type, so the compiler catches typos (like `\"Up\"` instead of `\"UP\"`) that would otherwise be silent runtime bugs." },
      { question: "Do TypeScript enums exist at runtime, unlike interfaces and type aliases?", answer: "Yes. An enum compiles to a real JavaScript object mapping names to values, so `Direction.Up` reads a property off that object at runtime." },
      { question: "What does `Direction.Up` compile down to at runtime?", answer: "A property lookup on the generated enum object, reading the number (or string) stored under the `Up` key." },
      { question: "Why does `Direction[direction]` work to look up a member's name from its value for a numeric enum?", answer: "For numeric enums only, TypeScript generates a reverse mapping: the object maps names to numbers *and* numbers back to names." },
      { question: "Given `enum Direction { Up, Down, Left, Right }`, what is the runtime value of `Direction.Down`?", answer: "`1`. Members auto-number from `0` in declaration order: `Up` is `0`, `Down` is `1`, and so on." },
      { question: "What happens to the values of later members if you insert a new member in the middle of a numeric enum's declaration?", answer: "Every member after it silently gets a new number, which can break code or stored data that relied on the old values." },
      { question: "How do string enums avoid the member-reordering pitfall numeric enums have?", answer: "Each member has an explicit, fixed string value, so reordering the declarations changes nothing." },
      { question: "What does `console.log(move)` print given `let move: Direction = Direction.Up;` with `Direction` declared as a plain numeric enum?", answer: "`0`. `Direction.Up` is the first member, and numbering starts at `0`." },
      { question: "Why does `ship(\"PENDING\" as OrderStatus)` need an explicit cast rather than being assignable directly?", answer: "A string literal like `\"PENDING\"` isn't treated as the enum member `OrderStatus.Pending`, even with the same value. TypeScript needs an explicit assertion to accept it as an `OrderStatus`." },
      { question: "What's a common alternative to an enum for representing a small, fixed set of string options, and what does it trade away?", answer: "A union of string literals, like `type Status = \"pending\" | \"shipped\"`. It needs no import and generates no runtime code, but loses the enum's grouping under one named value and (for numeric enums) reverse lookup." },
      { question: "Between an enum and a union of string literals, which one leaves compiled JavaScript output behind, and which is fully erased?", answer: "An enum generates a runtime object. A union of string literals is compile-time only and fully erased." },
      { question: "Why might a string enum be preferable to a numeric enum specifically when the value will be logged, displayed, or sent over a network?", answer: "Its runtime value is a readable string like `\"SHIPPED\"`. A numeric enum's value is a bare number, meaningless unless you know the declaration order." },
      { question: "What breaks if you treat an enum as a purely compile-time construct, the same way you'd treat an interface?", answer: "Interfaces are erased, but an enum produces a runtime JavaScript object. Forgetting that can cause surprises around bundle size, reverse lookups, or the enum object being inspectable at runtime." },
      { question: "What changes at the call sites if you convert a numeric `TrafficLight` enum to a string enum with explicit values?", answer: "Nothing: `TrafficLight.Red` works the same. Only each member's runtime value changes, from an auto-numbered integer to the string you assigned." },
      { question: "A function expects `status: OrderStatus`, but a caller has a plain string `\"PENDING\"` from a JSON API response. Why does passing it directly fail, and what are two ways to fix it?", answer: "A plain string isn't typed as the enum, even if the value matches. Either cast it (`\"PENDING\" as OrderStatus`) or, often better, model the field as a union of string literals so API strings are assignable without a cast." },
      { question: "Why can generating a real runtime object for every enum be a downside compared to a union of string literals, from a bundle-size perspective?", answer: "The enum object (plus reverse-mapping entries for numeric enums) ships to the client as real code. A union of string literals is erased and adds nothing." },
      { question: "TypeScript numeric enums are known to accept any number as assignable to the enum type, not just its declared members — why is this a notable safety gap compared to string enums?", answer: "Numeric enums are just numbers underneath, so for backward compatibility TypeScript lets a `number` be assigned without error. String enum members are checked against their declared strings, so string enums are stricter about invalid values." },
      { question: "Why is `OrderStatus.Pending === OrderStatus.Shipped` guaranteed to be `false`?", answer: "Each member gets its own distinct value (a unique auto-number or a unique explicit string), so no two members share a runtime value." },
    ],
    prerequisites: ["union-intersection-types"],
    relatedTopics: ["union-intersection-types", "type-narrowing"],
    keywords: ["enum", "enumeration", "string enum", "numeric enum", "constants"],
  },
  {
    id: "type-narrowing",
    title: "Type Narrowing",
    level: "intermediate",
    description:
      "How TypeScript works out which branch of a union you're holding at each point in the code.",
    explanation: `
With a union like \`string | number\`, TypeScript won't let you treat the
value as one or the other. \`.toUpperCase()\` is rejected, because the value
might be a number.

But once you write a check like \`typeof value === "string"\`, TypeScript
notices. Inside the block where the check passed, \`value\` is a
\`string\`, and string methods work with no cast or annotation. This is
called **type narrowing**.

TypeScript recognizes these common checks:

- \`typeof\`, for primitives like \`string\`, \`number\` and \`boolean\`.
- \`instanceof\`, for instances of a class.
- Truthy/falsy checks, like \`if (value)\`.
- Checking a property that only exists on one branch of the union.
    `.trim(),
    analogy:
      "It's like sorting mail. You don't know what's inside until you look at the envelope, but once you see it's the electric bill, you know exactly what's in it and can act without guessing.",
    examples: [
      {
        title: "Narrowing with typeof",
        code: `function printLength(value: string | number) {
  if (typeof value === "string") {
    console.log(value.toUpperCase()); // value is narrowed to string here
  } else {
    console.log(value.toFixed(2));    // value is narrowed to number here
  }
}`,
        explanation:
          "Inside the `if`, `value` is a `string`, the only way the `typeof` check could pass. In the `else`, it's `number`, the only possibility left.",
        walkthrough: [
          { code: "function printLength(value: string | number) {", explanation: "value starts as the full union: string or number." },
          { code: 'if (typeof value === "string") {', explanation: "A runtime check TypeScript recognizes for narrowing." },
          { code: "console.log(value.toUpperCase());", explanation: "Here value is a string, so string methods are allowed." },
        ],
      },
      {
        title: "Narrowing with instanceof and property checks",
        code: `class Dog {
  bark() { console.log("Woof!"); }
}

class Cat {
  meow() { console.log("Meow!"); }
}

function speak(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark(); // narrowed to Dog
  } else {
    animal.meow(); // narrowed to Cat
  }
}

interface Success {
  ok: true;
  data: string;
}
interface Failure {
  ok: false;
  error: string;
}

function handle(result: Success | Failure) {
  if (result.ok) {
    console.log(result.data);  // narrowed to Success
  } else {
    console.log(result.error); // narrowed to Failure
  }
}`,
        explanation:
          "`instanceof` narrows between classes. Checking a shared property with a distinct literal value (`ok: true` vs. `ok: false`) narrows between interfaces. This pattern is called a discriminated union.",
      },
    ],
    howItWorks: `
At every point in your code, the compiler tracks the narrowest type it can
prove a variable has. This is **control flow analysis**.

When it sees a recognized check (\`typeof\`, \`instanceof\`, a truthy
check, comparing a shared "tag" property to a value, and a few others), it
narrows the type inside the branch where the check is true, and narrows it
differently, or not at all, outside it. This is pure code analysis; no
runtime type information is added beyond the check you wrote.
    `.trim(),
    whyItExists: `
Unions are only useful if you can narrow them to act on a specific branch.
Narrowing rewards the runtime checks you'd write anyway (an **if**, a
**typeof**) with more precise types, so you don't write anything extra just
for the type checker.
    `.trim(),
    whenToUse: `
When you need to do something specific to one branch of a union, write the
check first (**typeof**, **instanceof**, a property check), then use the
branch-specific feature. Discriminated unions (interfaces sharing one "tag"
property with distinct literal values) are a clean, common way to model
success/failure or variant states.
    `.trim(),
    whenNotToUse: `
You don't opt in or out of narrowing; it happens whenever you write a
recognized check. What to avoid is a manual cast (\`as SomeType\`) instead
of a real runtime check. A cast tells the compiler to trust you without
verifying anything at runtime.
    `.trim(),
    commonMistakes: [
      "Using a cast (`as string`) to silence an error instead of a real runtime check. It gives no safety and can be wrong.",
      "Expecting narrowing to survive a function call between the check and the use. TypeScript can lose a narrowed type there, since the function could in theory change the value.",
      "Forgetting `instanceof` only narrows between classes, not interface shapes. Those need a discriminant property check.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Using typeof narrowing, write `formatValue(value: string | boolean)` that uppercases a string, or returns \"YES\"/\"NO\" for a boolean." },
      { difficulty: "Medium", prompt: "Define interfaces `Circle { kind: \"circle\", radius: number }` and `Square { kind: \"square\", side: number }`. Write `area(shape: Circle | Square): number` using a discriminated union check on `kind`." },
      { difficulty: "Hard", prompt: "Write a function that accepts `unknown` and narrows it step by step (it's an object, then it has a specific property of the right type) before using it, with no `as` casts." },
    ],
    interviewQuestions: [
      { question: "What is type narrowing?", answer: "TypeScript refining a value's type to something more specific inside a branch, based on a runtime check like `typeof`, `instanceof` or a property comparison." },
      { question: "Why does TypeScript disallow calling `.toUpperCase()` on a value typed `string | number` before any check?", answer: "The value could be a `number`, which has no `.toUpperCase()`, so the call isn't valid for every case. Narrowing first proves which branch you have." },
      { question: "Inside `if (typeof value === \"string\") { ... } else { ... }` for a `value: string | number`, what is `value`'s type in each branch?", answer: "`string` in the `if`, the only way the check could pass. `number` in the `else`, the only branch left." },
      { question: "What can `instanceof` narrow between, and what can't it narrow between?", answer: "It narrows between classes. It can't narrow between interface shapes, because interfaces have no runtime class to check against." },
      { question: "What is a discriminated union, and what property makes narrowing on it reliable?", answer: "A union of object types that share one property (the discriminant) with a distinct literal value per type. Checking that property narrows to the matching branch." },
      { question: "Given `Success { ok: true; ... }` and `Failure { ok: false; ... }`, why does `if (result.ok)` narrow `result` to `Success`?", answer: "Only `Success` has `ok` typed as literal `true`, so a truthy `ok` means `result` must be a `Success`." },
      { question: "What is control flow analysis, and how does it relate to narrowing?", answer: "The compiler tracking the narrowest type it can prove a variable has at every point in the code. Narrowing is the visible result when it recognizes a check like `typeof` or `instanceof`." },
      { question: "How does a plain truthy check like `if (value)` act as a narrowing mechanism?", answer: "It removes falsy values (`null`, `undefined`, `0`, `\"\"`, `NaN`, `false`) inside the `if`, so `string | null` narrows to `string`." },
      { question: "Why is a type cast like `value as string` considered less safe than proper narrowing?", answer: "A cast makes the compiler trust your claim without checking. Narrowing is based on a real runtime check the compiler can see." },
      { question: "Why can narrowing be \"lost\" if you call another function between the check and the use of the narrowed value?", answer: "TypeScript can't be sure the call didn't change the value (for example through a shared mutable variable), so it falls back to the wider original type." },
      { question: "How would you safely narrow a value typed `unknown` down to a specific shape without using `as` casts?", answer: "Step by step. First confirm it's a non-null object with `typeof value === \"object\" && value !== null`, then check the property you need with `in` or a `typeof` check on it, narrowing further each time." },
      { question: "When would you reach for `typeof` versus `instanceof` to narrow a union?", answer: "`typeof` for primitives like `string`, `number` and `boolean`. `instanceof` for instances of different classes." },
      { question: "Why doesn't `instanceof` work to narrow between two plain interfaces with no classes involved?", answer: "`instanceof` checks against a runtime constructor, and interfaces don't exist at runtime. Use a distinguishing property instead, as in a discriminated union." },
      { question: "What's the classic trap with using `typeof value === \"object\"` to narrow a union that might include `null`?", answer: "`typeof null` is `\"object\"` in JavaScript, so the check doesn't rule out `null`. Add an explicit `value !== null`." },
      { question: "How does checking for a property with the `in` operator (e.g. `\"bark\" in animal`) act as a narrowing check?", answer: "If only one branch of the union declares that property, a passing `in` check proves the value is from that branch." },
      { question: "Given `function handle(x: string[] | undefined) { if (x) { ... } }`, what's `x`'s narrowed type inside the `if`, and what does that check *not* guarantee?", answer: "`string[]`, since the truthy check rules out `undefined`. It doesn't guarantee the array is non-empty; an empty array is still truthy." },
      { question: "Why is control flow analysis purely a compile-time, static process, adding no runtime type information beyond what you actually wrote?", answer: "The compiler only reasons about which checks appear in the code and where. It adds no runtime checks or metadata; narrowing just interprets your existing checks more precisely." },
      { question: "What breaks if two branches of an intended discriminated union accidentally use the same literal value for their shared tag property?", answer: "A check for that value no longer tells you which branch you have, so narrowing on the tag stops working." },
      { question: "If a narrowed variable is reassigned to a wider value inside the same branch, does the narrowed type persist for the rest of that branch?", answer: "No. Control flow analysis re-evaluates the type after every assignment, so a wider value widens the type again from that point on." },
      { question: "How does a truthy check like `if (value)` differ in behavior from an explicit `if (value !== undefined)` when narrowing `string | undefined`?", answer: "A truthy check also excludes the empty string `\"\"`, even though it's a valid `string`. `!== undefined` only rules out `undefined`, so `\"\"` stays in the `string` branch." },
      { question: "Why doesn't calling an arbitrary custom function like `isString(value)` automatically narrow a union the way `typeof value === \"string\"` does?", answer: "TypeScript only recognizes a fixed set of built-in check patterns. A plain function's return type doesn't tell the compiler which branch was proven, unless the function is declared as a type guard." },
      { question: "What is a user-defined type guard, and how does it let a custom function participate in narrowing?", answer: "A function whose return type is a type predicate, like `value is string`. A truthy return tells the compiler the argument is a `string`, so the custom check narrows just like `typeof`." },
      { question: "For `animal: Dog | Cat`, why does `else` alone (after `if (animal instanceof Dog)`) safely narrow to `Cat` without a second `instanceof` check?", answer: "Once `Dog` is ruled out, `Cat` is the only possibility left, so the `else` narrows to it by elimination." },
      { question: "Can narrowing be lost inside a closure or callback defined within an already-narrowed branch, such as inside a `setTimeout` callback?", answer: "Yes. TypeScript can't be sure the outer variable wasn't reassigned before the callback runs, so it widens the type back inside the callback." },
      { question: "When is a discriminated union preferable to an `instanceof` check for distinguishing variants?", answer: "For plain data shapes (interfaces) with no classes, which are also easy to serialize. `instanceof` fits when the variants are real classes with their own methods." },
      { question: "What guarantee do you lose by using an `as` cast instead of a genuine narrowing check?", answer: "The check that the value really is what you claim. A wrong cast compiles cleanly but can fail at runtime, where a real check would have caught it." },
      { question: "Given `function printLength(value: string | number) { if (typeof value !== \"string\") { value.toFixed(2); } }`, is calling `.toFixed(2)` inside the `if` valid, and why?", answer: "Yes. Negated checks narrow too: the branch only runs when `value` is *not* a `string`, so it must be a `number`." },
      { question: "Why is narrowing described as something you don't opt into or out of, and what does that imply about how to write runtime checks generally?", answer: "It happens automatically whenever the compiler recognizes a supported check. Writing the checks you'd write anyway (an `if`, a `typeof`) is enough; no extra annotation is needed." },
    ],
    prerequisites: ["union-intersection-types"],
    relatedTopics: ["union-intersection-types", "enums", "conditional-types"],
    keywords: ["type narrowing", "typeof", "instanceof", "discriminated union", "control flow analysis"],
  },
  {
    id: "utility-types",
    title: "Utility Types",
    level: "intermediate",
    description:
      "Built-in generic types that turn an existing type into a new one, so you don't redefine similar shapes by hand.",
    explanation: `
Once you have an interface like \`User\`, you often need variations: every
field optional (for an update form), only a few fields (for a preview
card), or one sensitive field removed (before sending to the client).
Writing a near-copy for each is repetitive, and the copies drift out of
sync as \`User\` changes.

TypeScript's built-in **utility types** are generic types that transform an
existing type into a new one. Four of the most used:

- \`Partial<T>\` makes every property optional.
- \`Pick<T, Keys>\` keeps only the listed properties.
- \`Omit<T, Keys>\` keeps everything *except* the listed properties.
- \`Record<Keys, ValueType>\` builds an object type mapping each key to the same value type.
    `.trim(),
    analogy:
      "Utility types are like photocopier settings for a type. Instead of retyping a document with some fields blanked out, you pick a setting (\"make every field optional,\" \"keep only these two,\" \"drop that one\") and get a related copy, without touching the original.",
    examples: [
      {
        title: "Partial, Pick, and Omit",
        code: `interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

// Every property becomes optional — handy for an "update" function
type UserUpdate = Partial<User>;
const update: UserUpdate = { name: "New Name" }; // valid, other fields omitted

// Keep only name and email
type UserPreview = Pick<User, "name" | "email">;
const preview: UserPreview = { name: "Kai", email: "kai@example.com" };

// Keep everything except id (e.g. before the id is assigned)
type NewUser = Omit<User, "id">;
const draft: NewUser = { name: "Sam", email: "sam@example.com", age: 22 };`,
        explanation:
          "Each utility type derives a new shape from `User` without copying it. If `User` gains or loses a field, `UserUpdate`, `UserPreview` and `NewUser` stay in sync automatically.",
        walkthrough: [
          { code: "type UserUpdate = Partial<User>;", explanation: "Partial<T> makes every property of User optional (?), so any subset, even none, is valid." },
          { code: 'type UserPreview = Pick<User, "name" | "email">;', explanation: "Pick<T, Keys> keeps only the named properties and drops the rest." },
          { code: "type NewUser = Omit<User, \"id\">;", explanation: "Omit<T, Keys> is the opposite of Pick: it keeps every property except the named ones." },
        ],
      },
      {
        title: "Record for building object types",
        code: `type Role = "admin" | "editor" | "viewer";

// An object type with exactly these three keys, each mapping to a boolean
type RolePermissions = Record<Role, boolean>;

const permissions: RolePermissions = {
  admin: true,
  editor: true,
  viewer: false,
};

// Missing a key is an error:
const incomplete: RolePermissions = { admin: true, editor: true };
// Error: Property 'viewer' is missing.`,
        explanation:
          "`Record<Keys, ValueType>` builds an object type where every key in `Keys` maps to `ValueType`. It's great for lookup tables keyed by a union of specific strings.",
      },
    ],
    howItWorks: `
Utility types aren't special syntax. They're ordinary generic types, built
with features like mapped types (covered later), that ship in TypeScript's
standard type definitions.

For example, \`Partial<T>\` is a mapped type that goes through every key in
\`T\` and re-adds it with a \`?\`. When you write \`Partial<User>\`, the
compiler expands it with \`User\` in place of \`T\`. Like interfaces and type
aliases, utility types only affect compile-time checking and leave no trace
in the compiled JavaScript.
    `.trim(),
    whyItExists: `
Deriving a related type from an existing one is very common. Utility types
cover the usual patterns (optional versions, subsets, everything-except,
lookup tables), so you don't maintain near-duplicate interfaces that
silently drift from the original.
    `.trim(),
    whenToUse: `
- \`Partial\` for update or patch functions where any subset of fields may be given.
- \`Pick\`/\`Omit\` for a narrower or almost-complete view of an existing type.
- \`Record\` for a lookup table keyed by a known, fixed set of values.
    `.trim(),
    whenNotToUse: `
If the new type differs a lot from the original (different property names,
unrelated structure), a fresh interface is clearer. Utility types shine
when the new type is a *direct derivative* of an existing one.
    `.trim(),
    commonMistakes: [
      "Assuming `Partial<T>` lets properties be `null`. It only makes them optional (may be omitted), not nullable.",
      "Passing `Pick` a key that doesn't exist on the source type. TypeScript flags it as an error instead of ignoring it (`Omit` doesn't check, as explained below).",
      "Using `Record<string, T>` when the keys are a known, fixed set. Using the specific key union gives much better checking (catching missing or misspelled keys).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Given `Product { id: string; name: string; price: number; }`, create a `Partial<Product>` type and an object of it that only sets `price`." },
      { difficulty: "Medium", prompt: "Using `Product`, create a `ProductSummary` type with `Pick` that keeps only `name` and `price`, and a `ProductWithoutId` type with `Omit` that drops `id`." },
      { difficulty: "Hard", prompt: "Create a `Weekday` type as a union of the five weekday names. Use `Record<Weekday, number>` to type the hours worked each day, and build a valid object of that type." },
    ],
    interviewQuestions: [
      { question: "What does `Partial<T>` do to each property of T, mechanically?", answer: "It's a mapped type that goes through every key `K` in `keyof T` and re-adds it with `?`. Each property may be omitted, but if present it must still match its original type." },
      { question: "How would you implement `Partial<T>` yourself as a mapped type?", answer: "`type MyPartial<T> = { [K in keyof T]?: T[K] };`. Copy every key of T with `?` added, leaving the value type unchanged." },
      { question: "What is `Required<T>`, and how does it invert what `Partial<T>` does?", answer: "`Required<T>` makes every property of T mandatory, even originally optional ones. It's the opposite of `Partial<T>`, which adds optionality." },
      { question: "How is `Required<T>` implemented under the hood, and what does the `-?` syntax do?", answer: "`type Required<T> = { [K in keyof T]-?: T[K] };`. The `-?` modifier removes any existing `?`, forcing each property to be present." },
      { question: "Given `type Foo = Required<Partial<User>>;`, what shape does `Foo` end up with?", answer: "The same as `User`, with every property required. `Partial` makes them optional, then `Required` removes that, so the two cancel out." },
      { question: "Does `Partial<T>` make a property nullable, i.e. assignable to `null`?", answer: "No. `?` only means the property may be omitted. A `string` property becomes optional `string`, not `string | null`, unless `null` was already in the original type." },
      { question: "What does `Pick<T, K>` do?", answer: "It builds a type with only the properties named in `K`, dropping the rest of T." },
      { question: "What does `Omit<T, K>` do, and how does it relate to `Pick`?", answer: "It keeps every property of T except those named in `K`. It's the opposite of `Pick`, which keeps only the named ones." },
      { question: "How is `Omit<T, K>` actually implemented internally in terms of `Pick` and `Exclude`?", answer: "As `Pick<T, Exclude<keyof T, K>>`. `Exclude` removes `K` from `keyof T`, and `Pick` keeps the remaining keys. So Omit is Pick applied to the leftover keys." },
      { question: "Why does passing a key that doesn't exist on T produce a compile error with `Pick<T, K>` but not with `Omit<T, K>`?", answer: "`Pick` constrains `K extends keyof T`, so an unknown key fails. `Omit` only constrains `K extends keyof any` (any property key), so an unknown key is accepted; `Exclude<keyof T, K>` just has nothing to remove." },
      { question: "What does \"distributive\" mean for a conditional type like `Exclude`, and why does `Omit` depend on it?", answer: "`Exclude<A, B>` is `A extends B ? never : A`. When `A` is a union, TypeScript checks the condition against each member separately, not the union as a whole. That's \"distributive.\" `Omit` relies on it so `Exclude<keyof T, K>` removes exactly the matching keys from `keyof T`." },
      { question: "You need a type with every field of `User` except `id`. Would `Omit<User, \"id\">` or `Pick<User, \"name\"|\"email\"|\"age\">` be the better choice if `User` later gains a new field?", answer: "`Omit<User, \"id\">`. It only names what to remove, so new fields are included automatically. The `Pick` list would silently leave the new field out until someone adds it by hand." },
      { question: "What does `Record<K, V>` do?", answer: "It builds an object type where every key in the union `K` maps to the same value type `V`: a lookup table with a fixed set of keys." },
      { question: "Given `Record<Role, boolean>` for `Role = \"admin\"|\"editor\"|\"viewer\"`, why does an object missing the `viewer` key fail to compile?", answer: "`Record` expands to a mapped type with every literal in `Role` as a required key, like an interface requiring all three. Leaving one out is a missing-property error." },
      { question: "Why is `Record<string, T>` a weaker choice than `Record<SpecificKeyUnion, T>` when the keys are actually a small, fixed set?", answer: "`Record<string, T>` becomes an index signature (`{ [key: string]: T }`) that accepts any string key. Misspelled or extra keys go unnoticed and no key is guaranteed present. A literal key union requires each exact key." },
      { question: "How is `Record<K, V>` implemented as a mapped type?", answer: "`type Record<K extends keyof any, V> = { [P in K]: V };`. It goes through each member of `K` and gives it the value type `V`." },
      { question: "What does `Readonly<T>` do?", answer: "It's a mapped type that adds `readonly` to every property of T, so none can be reassigned after creation." },
      { question: "Does `Readonly<T>` enforce that immutability at runtime?", answer: "No. Like every utility type, it's compile-time only. The compiler rejects reassignments, but the JavaScript object itself can still be changed, for example by code that bypasses the type checker." },
      { question: "Given `const u: Readonly<User> = {...}; u.name = \"New\";`, why does the assignment fail to compile?", answer: "`Readonly<User>` makes `name` `readonly`, and assigning to a `readonly` property after creation is rejected, even with a valid `string`." },
      { question: "Is `Readonly<T>`'s restriction \"deep\" — does it also make properties of a nested object property read-only?", answer: "No, it's shallow. It only protects T's top-level properties. A nested object's properties stay mutable unless you write a recursive deep-readonly type." },
      { question: "What does `ReturnType<T>` extract, and from what kind of type?", answer: "From a function type, it extracts the return type: `ReturnType<() => string>` is `string`." },
      { question: "How is `ReturnType<T>` implemented, and what role does `infer` play?", answer: "`type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;`. The conditional checks that T is callable, and `infer R` captures its return type as the result." },
      { question: "Does `ReturnType<T>` distribute when T is a union of function types, e.g. `ReturnType<(() => string) | (() => number)>`?", answer: "Yes. `T` appears bare in the conditional's check, making it distributive. Each union member is checked separately and the results are unioned, giving `string | number`." },
      { question: "Does `Partial<T>` distribute the same way over a union type, e.g. `Partial<A | B>`?", answer: "No. `Partial` is a mapped type over `keyof T`, not a conditional type, so it doesn't distribute. `keyof (A | B)` only has keys common to both, so `Partial<A | B>` is built from those shared keys, which differs from `Partial<A> | Partial<B>`." },
      { question: "Why would you write `ReturnType<typeof someFunction>` instead of naming the return type directly?", answer: "When the return shape has no named type (for example an inline object literal), this lets you reference it without retyping it, and it stays in sync if the function changes." },
      { question: "What type does `Pick<Partial<User>, \"name\">` produce?", answer: "`{ name?: string }`. `Partial` makes every property optional, then `Pick` keeps only `name`, which stays optional." },
      { question: "Are `Partial<Pick<User, \"name\">>` and `Pick<Partial<User>, \"name\">` equivalent here?", answer: "Yes, both give `{ name?: string }`. Picking a key then making it optional equals making everything optional then picking it, since unrelated keys don't interact." },
      { question: "Why do utility types exist as TypeScript built-ins instead of being something every project defines from scratch?", answer: "Deriving related shapes (optional versions, subsets, everything-except, lookup tables) is needed in almost every codebase. A shared built-in vocabulary saves each project from reinventing the same mapped and conditional types." },
      { question: "Do utility types like `Partial` and `Pick` leave any trace in the compiled JavaScript output?", answer: "No. Like interfaces and type aliases, they only affect type checking and are fully erased." },
      { question: "You need a type for a PATCH endpoint that accepts any subset of `User`'s fields except `id`, which should never be updatable. How would you compose utility types to express that?", answer: "`Partial<Omit<User, \"id\">>`. `Omit` removes `id`, then `Partial` makes the remaining fields optional, so callers can send any subset of updatable fields but never `id`." },
      { question: "What's the downside of hand-writing a separate interface `UserPreview { name: string; email: string }` instead of `Pick<User, \"name\"|\"email\">`?", answer: "It has no link to `User`. If `name` or `email` changes type in `User`, the hand-written copy silently goes stale. `Pick<User, ...>` always re-derives from `User`." },
    ],
    prerequisites: ["generics", "interfaces"],
    relatedTopics: ["generics", "mapped-types", "interfaces"],
    keywords: ["utility types", "Partial", "Pick", "Omit", "Record"],
  },
  {
    id: "classes-access-modifiers",
    title: "Classes & Access Modifiers",
    level: "intermediate",
    description:
      "Mark class properties and methods `public`, `private` or `protected` to control what outside code can touch.",
    explanation: `
In a plain JavaScript class, every property and method is reachable from
outside. Nothing stops other code reading or overwriting an internal
detail, like a bank account's raw balance.

TypeScript adds three **access modifiers** for class members:

- \`public\` (the default): reachable from anywhere, like plain JavaScript.
- \`private\`: reachable only from inside the class.
- \`protected\`: reachable from the class and any class that extends it, but not from outside.

The compiler enforces these. Accessing a \`private\` member from outside the
class is an error before the code runs.
    `.trim(),
    analogy:
      "Think of a class as a house. `public` is the front porch: anyone can walk up. `private` is a locked room only the owner can open. `protected` is the family room: the owner's kids (subclasses) can use it, but a stranger off the street can't.",
    examples: [
      {
        title: "public, private, and enforcement",
        code: `class BankAccount {
  public accountHolder: string;
  private balance: number;

  constructor(accountHolder: string, startingBalance: number) {
    this.accountHolder = accountHolder;
    this.balance = startingBalance;
  }

  public deposit(amount: number): void {
    this.balance += amount; // fine — inside the class
  }

  public getBalance(): number {
    return this.balance;
  }
}

const account = new BankAccount("Lena", 100);
account.deposit(50);
console.log(account.balance);
// Error: Property 'balance' is private and only accessible within class 'BankAccount'.`,
        explanation:
          "`balance` can only be read or changed by methods inside `BankAccount`. Outside code must use `deposit` and `getBalance`.",
        walkthrough: [
          { code: "private balance: number;", explanation: "balance is accessible only from this class's own methods." },
          { code: "public deposit(amount: number): void {", explanation: "public is the default, but writing it makes the intent clear: this is the approved way to change balance." },
          { code: "console.log(account.balance);", explanation: "Reading balance from outside breaks its private modifier, so the compiler rejects this line." },
        ],
      },
      {
        title: "protected and inheritance",
        code: `class Animal {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }
}

class Dog extends Animal {
  bark(): string {
    return \`\${this.name} says woof!\`; // OK — protected is visible in subclasses
  }
}

const dog = new Dog("Rex");
console.log(dog.name);
// Error: Property 'name' is protected and only accessible
// within class 'Animal' and its subclasses.

// A shorthand: declaring and assigning a parameter in one step
class Cat {
  constructor(private lives: number = 9) {}
  loseLife(): number {
    return --this.lives;
  }
}`,
        explanation:
          "`Dog` can use `this.name` because `protected` includes subclasses, but code outside the class hierarchy still can't. The `Cat` example shows a shorthand: a modifier on a constructor parameter both declares and assigns the property.",
      },
    ],
    howItWorks: `
Access modifiers are checked only at compile time. For each member, the
compiler knows its modifier and where the accessing code is (same class,
subclass or outside), and reports any access the rule doesn't allow.

After compiling, the checks are gone. JavaScript has no concept of this
"private" (its newer \`#private\` field syntax is a separate feature), so
at runtime the property is still reachable by code that bypasses the type
checker, such as plain untyped JavaScript calling the compiled code.
    `.trim(),
    whyItExists: `
Classes often hold internal state: a cache, a counter, a raw value that
should only change through a method that keeps it valid. Access modifiers
enforce that boundary, steering other code to the public methods instead of
changing internal state directly, so the class's guarantees hold.
    `.trim(),
    whenToUse: `
Make a member \`private\` when outside code has no good reason to touch
it: raw internal state, or helper methods that are just steps of a larger
public method. Use \`protected\` when subclasses need access but outside
code shouldn't have it.
    `.trim(),
    whenNotToUse: `
Don't make things private out of habit. If a property is meant to be read
or set freely (like a simple data holder with no rules to protect),
**public** (the default) is simpler. Over-restricting forces callers into
awkward workarounds.
    `.trim(),
    commonMistakes: [
      "Assuming `private` blocks access at runtime. It's compile-time only, unless you use JavaScript's own `#field` private syntax.",
      "Making every property `private` by reflex, even ones meant to be read from outside, which forces pointless getter methods.",
      "Using `protected` when you meant `private`, letting subclasses depend on internal details that were never part of the contract.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a class `Counter` with a `private count: number` field and public `increment()` and `getCount()` methods. Try accessing `count` from outside to see the error." },
      { difficulty: "Medium", prompt: "Write a base class `Vehicle` with `protected speed: number` and a subclass `Car` with a method that uses `this.speed`. Then access `speed` from outside both classes to confirm it's blocked." },
      { difficulty: "Hard", prompt: "Rewrite `Counter` using constructor-parameter shorthand (`constructor(private count: number = 0) {}`). In a comment, explain what changed compared to declaring the field separately." },
    ],
    interviewQuestions: [
      { question: "What do `public`, `private`, and `protected` each allow, in terms of what code can access the member?", answer: "`public` (the default): anywhere. `private`: only inside the declaring class. `protected`: the declaring class and any class that extends it, but not outside code." },
      { question: "What access modifier does a class member get if you don't write one explicitly?", answer: "`public`. It's the default and behaves like a plain JavaScript class member, with no restriction." },
      { question: "How does the compiler decide whether a given piece of code is allowed to access a class member?", answer: "It checks the member's modifier against where the accessing code is (the declaring class, a subclass, or outside) and flags any access the modifier doesn't allow from there." },
      { question: "Do access modifiers like `private` and `protected` exist as a runtime concept in the compiled JavaScript?", answer: "No, the check is compile-time only. After compiling, it's an ordinary property with no restriction, unless you use JavaScript's native `#field` syntax." },
      { question: "Given `class BankAccount { private balance: number; ... }` and `const account = new BankAccount(...); console.log(account.balance);`, why does this fail to compile?", answer: "`balance` is `private`, so only methods inside `BankAccount` can access it. The `console.log` is outside the class." },
      { question: "Why does `BankAccount` expose `deposit()` and `getBalance()` as public methods instead of just making `balance` public directly?", answer: "Keeping `balance` private forces changes through `deposit`, which can enforce rules (like never going negative). Outside code can't overwrite the raw value and leave it invalid." },
      { question: "What problem do access modifiers solve that a plain JavaScript class doesn't address on its own?", answer: "In plain JavaScript every member is reachable from outside, so other code can read or overwrite internal details. Access modifiers make TypeScript flag that as a compile-time error." },
      { question: "What's the difference between `private` and `protected`?", answer: "`private` members are reachable only inside the declaring class. `protected` members are also reachable from subclasses. Both block unrelated outside code." },
      { question: "Given `class Animal { protected name: string; ... }` and `class Dog extends Animal { bark() { return this.name; } }`, why does `this.name` compile fine inside `bark()`?", answer: "`protected` includes subclasses, and `Dog extends Animal`, so `Dog`'s methods can read `this.name`." },
      { question: "Using the same `Animal`/`Dog` classes, why does `dog.name` fail when accessed from completely outside both classes?", answer: "`protected` only allows the declaring class and its subclasses' own code. A plain `dog.name` outside that hierarchy is rejected, just as `private` would reject it." },
      { question: "The topic's analogy describes `protected` as being open to \"the family\" but not \"a visitor off the street\" — concretely, whose code counts as family here?", answer: "Code inside the declaring class, and code inside any class that extends it, however many levels deep. Everything else is an outside visitor." },
      { question: "You have a `Vehicle` base class with an internal `speed` field that only `Vehicle` and its subclasses should touch. Which modifier fits, and why not the other two?", answer: "`protected`. `private` would block subclasses from using `speed`, and `public` would let any outside code touch it. Only `protected` means \"the class and its subclasses, nothing else.\"" },
      { question: "What is constructor-parameter shorthand, and what two things does writing `constructor(private lives: number = 9) {}` do at once?", answer: "A modifier on a constructor parameter both declares `lives` as a class property and assigns it from the argument. One line replaces a field declaration plus `this.lives = lives;` in the constructor." },
      { question: "Compare `constructor(private lives: number = 9) {}` to declaring `private lives: number;` as a field and assigning it with `this.lives = lives;` in the constructor body. What's actually different?", answer: "Nothing in access or runtime behavior. Both give the same private `lives` property. The shorthand is just a shorter way to write it." },
      { question: "Why doesn't marking every class property `private` reflexively make a class \"safer\" in every case?", answer: "If a property is meant to be read or set freely (a simple data holder with no rules), making it private only forces pointless getters and setters. It adds friction without preventing misuse." },
      { question: "When is `public` (the default) actually the right, deliberate choice rather than an oversight?", answer: "When the property has no rule to protect and is meant to be read or set from outside. Hiding it behind `private` plus getters just adds ceremony." },
      { question: "What mistake does using `protected` risk that using `private` wouldn't?", answer: "Any subclass, including ones written later by someone unfamiliar with the design, can depend on an internal detail that was never meant to be part of the contract." },
      { question: "A colleague uses `as any` to bypass a `private` field's type error and reads the value successfully at runtime. Does this reveal a flaw in TypeScript's `private`?", answer: "No, that's expected. `private` is compile-time only, so any code that gets past the type checker (a cast, or untyped JavaScript) can reach what is an ordinary property underneath." },
      { question: "The content notes JavaScript has its own native `#field` private syntax, calling it \"unrelated\" to TypeScript's `private` keyword. What's actually different about it?", answer: "TypeScript's `private` is a compile-time annotation; the compiled property is ordinary. JavaScript's `#field` is enforced by the engine at runtime: outside access is actually blocked, regardless of any type checking." },
      { question: "Untyped, plain JavaScript code calls into your compiled TypeScript class and directly reads a property you'd marked `private`. Does this throw at runtime?", answer: "No. `private` adds no runtime restriction, so plain JavaScript callers can read or write the property without error." },
      { question: "Why are access modifiers described as being about \"guiding\" other code toward intended public methods rather than about airtight runtime security?", answer: "The restriction only exists at compile time. It stops type-checked code from accidentally reaching in, but not determined or untyped code at runtime. It's a design tool, not a security boundary." },
      { question: "Given `class Cat { constructor(private lives: number = 9) {} loseLife(): number { return --this.lives; } }`, can code outside `Cat` call `cat.loseLife()`? Can it read `cat.lives` directly?", answer: "Yes to the first: `loseLife` has no modifier, so it's `public`. No to the second: `lives` is `private` through the shorthand, so `cat.lives` from outside is a compile error, even though the method that changes it is public." },
      { question: "If you wanted `lives` in the `Cat` example to be readable from outside but never directly writable, would `private` alone achieve that?", answer: "No. `private` blocks reading and writing from outside equally. Keep `lives` private and add a public getter method, the same pattern `getBalance()` uses in `BankAccount`." },
      { question: "Between the `BankAccount.balance` example and the `Cat.lives` example, what stays the same in terms of enforced access, and what differs?", answer: "Both are `private` and blocked from outside in the same way. Only the declaration differs: `BankAccount` uses a separate field plus an assignment in the constructor; `Cat` uses constructor-parameter shorthand." },
    ],
    prerequisites: ["interfaces", "functions-with-types"],
    relatedTopics: ["interfaces", "generics"],
    keywords: ["classes", "public", "private", "protected", "access modifiers", "inheritance"],
  },
];
