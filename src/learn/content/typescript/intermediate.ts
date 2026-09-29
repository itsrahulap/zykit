import type { Topic } from "../../types/content";

export const typescriptIntermediateTopics: Topic[] = [
  {
    id: "union-intersection-types",
    title: "Union & Intersection Types",
    level: "intermediate",
    description:
      "Combining types with `|` to mean \"one of these\" and with `&` to mean \"all of these, merged.\"",
    explanation: `
So far, every type you've seen describes one specific shape. But plenty of
real values are more flexible than that. A function that accepts either an
\`id\` (a number) or a \`slug\` (a string) to look up a record can't be
described by a single basic type — it genuinely accepts *either* one.

A **union type**, written \`A | B\`, describes exactly that: a value that
is one of several possible types. \`string | number\` means "a string, or
a number — could be either." TypeScript then requires you to check *which*
one you actually got before doing something that only makes sense for one
of them (this checking is covered in the next topic, narrowing).

Going the other direction, sometimes you want a value that satisfies
*multiple* shapes **at once** — it has to combine all of their properties
together, not just be one or the other. That's an **intersection type**,
written \`A & B\`. If \`A\` has a \`name\` property and \`B\` has an \`age\`
property, then \`A & B\` requires *both* — a single object with both
\`name\` and \`age\`.
    `.trim(),
    analogy:
      "A union is like a form field that accepts \"either a phone number or an email\" — one or the other, your choice. An intersection is like a job application that requires both a resume AND a cover letter — you need every piece, combined into one submission, not just one of them.",
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
          "`idOrSlug` may be a number or a string — nothing else. TypeScript accepts either, but rejects any value that's neither.",
        walkthrough: [
          { code: "function lookup(idOrSlug: number | string): void {", explanation: "The union `number | string` means this parameter must be one of exactly these two types." },
          { code: "lookup(42);", explanation: "A number matches the union, so this call is valid." },
          { code: "lookup(true);", explanation: "A boolean is neither a number nor a string, so it fails to satisfy the union and is rejected." },
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
          "`Person` is the intersection of `HasName` and `HasAge`, so a valid `Person` must satisfy both interfaces at once — it needs every property from each.",
      },
    ],
    howItWorks: `
For a union type \`A | B\`, the compiler only lets you do things with the
value that are safe for *both* \`A\` and \`B\` — anything specific to just
one of them requires narrowing the type first (checking which one you
actually have at runtime).

For an intersection type \`A & B\`, the compiler merges the member lists of
both types and requires an object to satisfy every member from both —
effectively unioning the *requirements*, even though the type itself is
called an intersection.
    `.trim(),
    whyItExists: `
Real-world data often genuinely varies in shape — an API response might be
a success object or an error object, a function might accept a couple of
different input forms. Union types let you describe that variability
precisely, instead of falling back to **any** and losing all checking.
Intersection types let you build up a bigger shape by combining smaller,
reusable pieces instead of repeating properties across several similar
interfaces.
    `.trim(),
    whenToUse: `
Use a union whenever a value can genuinely be more than one type — the
result of an operation that can succeed or fail, a parameter accepting a
couple of related input shapes, or a value read from an external, less
predictable source. Use an intersection when you want to combine several
smaller, independently useful shapes into one composite type, especially
if those shapes are reused elsewhere on their own.
    `.trim(),
    whenNotToUse: `
Avoid piling more than a handful of types into a single union — beyond
that, the code handling every case tends to get unreadable, and it may be
a sign the values should share a common structure instead (see
discriminated unions). Avoid intersections that combine incompatible
types (like **string & number**, which produces the unusable **never** type)
— intersections only make sense between compatible object shapes.
    `.trim(),
    commonMistakes: [
      "Trying to access a property on a union type that only exists on one branch of it, before narrowing which branch you actually have.",
      "Confusing `|` and `&` — a union (`|`) means \"could be either,\" while an intersection (`&`) means \"must be both, combined.\"",
      "Intersecting two types that have the same property name with conflicting types (like `string` in one and `number` in the other), which silently collapses that property to `never`.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a type alias `Id` as `string | number`, and a function `printId(id: Id): void` that logs it." },
      { difficulty: "Medium", prompt: "Define two interfaces, `Timestamped` (`createdAt: Date`) and `Named` (`name: string`), and create an intersection type `NamedEvent` combining both. Create a valid object of that type." },
      { difficulty: "Hard", prompt: "Write a function that accepts `string | string[]` and always returns a `string[]` — wrapping a single string in an array, or returning the array as-is." },
    ],
    interviewQuestions: [
      { question: "What can you safely do with a value typed `string | number` before narrowing it?", answer: "Only operations that are valid for both branches — TypeScript refuses anything specific to just one type until you check, at runtime, which one you actually have." },
      { question: "What does `A & B` require of a value, in terms of properties?", answer: "The value must satisfy every member of both `A` and `B` at once — an intersection combines requirements rather than offering a choice between them." },
      { question: "Why does intersecting two incompatible primitive types, like `string & number`, produce the `never` type?", answer: "No value can simultaneously be a `string` and a `number`, so the set of values satisfying both constraints is empty — TypeScript represents that impossible, empty set as `never`." },
      { question: "Given `function f(x: string | number) { x.toUpperCase(); }`, why does this fail to compile even though `x` might genuinely be a string at runtime?", answer: "TypeScript checks the *type*, not a specific call's actual value — since `x` could also be a `number` at that point, and `toUpperCase` doesn't exist on `number`, the call isn't safe for every possibility the union allows." },
      { question: "If `HasName` and `HasAge` both declare `id: string` with the same type, what happens when you intersect them?", answer: "The shared property merges cleanly into one `id: string` requirement — a conflict only arises when the same property name has *incompatible* types across the intersected types." },
      { question: "What happens to a property that two intersected types declare with conflicting, incompatible types (e.g. `string` in one, `number` in the other)?", answer: "That property's type collapses to `never`, since no value could satisfy both declared types at once — making the resulting type effectively impossible to construct." },
      { question: "In what sense does an intersection type `A & B` combine \"requirements\" rather than combine \"possibilities\"?", answer: "A union expands which values are acceptable (either type qualifies), while an intersection shrinks the set of acceptable values down to only those satisfying every required property from both types simultaneously." },
      { question: "How would you type a function that accepts either a single `string` or an array of strings?", answer: "As `string | string[]` — a union expressing that the parameter may genuinely be either shape, which then must be narrowed (e.g. with `Array.isArray`) before treating it as one or the other." },
      { question: "Why does TypeScript reject calling a method that exists on only one branch of a union, without an explicit runtime check first?", answer: "The compiler can't prove which branch you actually have at that point in the code, so it only allows operations that are valid across every branch until a check narrows the type." },
      { question: "What's the practical difference between typing a parameter as `string | number` versus typing it as `any`?", answer: "`string | number` still enforces that the value is one of exactly those two types and requires narrowing before type-specific use, while `any` disables checking entirely, silently allowing any value and any operation on it." },
      { question: "Is `{ name: \"Tariq\" }` assignable to `type Person = HasName & HasAge`?", answer: "No — the intersection requires every property from both `HasName` and `HasAge`, so an object missing `age` fails the structural check even though it fully satisfies `HasName` on its own." },
      { question: "Why are intersection types useful for building up a type from smaller, reusable pieces?", answer: "You can define small, independently useful interfaces once and combine them with `&` wherever needed, instead of repeating the same properties across several similar, hand-written interfaces." },
      { question: "Why should you avoid piling more than a handful of types into a single union?", answer: "Code that has to handle every possible branch tends to become unreadable past a few cases, and it's often a sign the values actually share a common structure better expressed as a discriminated union." },
      { question: "What's a cleaner alternative to a large union of many related object shapes?", answer: "Giving each shape a shared \"tag\" property with a distinct literal value (a discriminated union), so the branches are represented as one family of related types that narrow cleanly by checking that one property." },
      { question: "Can a union mix primitive and object types, like `string | { id: number }`? What's the implication for using it?", answer: "Yes — a union places no restriction on what kinds of types can appear in it, but every branch still needs its own narrowing check (e.g. `typeof` for the string case) before you can use anything specific to that branch." },
      { question: "Why does `lookup(42)` succeed and `lookup(true)` fail for a parameter typed `number | string`?", answer: "`42` matches one of the union's listed types, but `boolean` isn't a member of `number | string` at all, so it fails to satisfy either branch." },
      { question: "If `A` and `B` each declare a method with the same name but different, incompatible parameter types, what tends to happen when you intersect them?", answer: "TypeScript combines the two signatures as an intersection of function types, which in practice usually only accepts arguments valid under both signatures at once — often collapsing to a signature too strict to call in any useful way." },
      { question: "Why is a union type's *value space* the combination of its branches' values, while an intersection type's *value space* is narrower than either type alone?", answer: "A union accepts a value matching any one branch, so its space of valid values grows with each branch added; an intersection demands a value satisfy every combined type's requirements at once, so its space of valid values only shrinks (or stays the same) as more types are combined." },
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
      "Writing a function or type once so it works with whatever type you feed it, while still keeping that type checked.",
    explanation: `
Suppose you write a function that just hands back whatever you gave it:

\`function identity(value: number): number { return value; }\`

That works for numbers, but not for strings — you'd have to write a nearly
identical \`identity\` function for every type you want to support, or give
up and type the parameter as \`any\`, which throws away all type checking
in the process (a caller could pass a number in and get a string out, and
TypeScript wouldn't complain).

What you actually want is: "whatever type you pass in, give me that exact
same type back" — without giving up checking altogether. TypeScript lets
you express that with a **type variable**, conventionally named \`T\`,
written in angle brackets before the parameter list:

\`function identity<T>(value: T): T { return value; }\`

Now \`identity(5)\` is known to return a \`number\`, and \`identity("hi")\`
is known to return a \`string\` — TypeScript figures out \`T\` fresh for
each call, based on what you actually passed in. This pattern — writing
code once that works across many types while keeping each specific use
fully checked — is called a **generic**.
    `.trim(),
    analogy:
      "A generic function is like a mold for making boxes that's adjustable to whatever you put in it — put in a small ball, get a small box back; put in a large book, get a large box back. It's one mold, but it never mixes up sizes: you always get back a box that fits exactly what went in.",
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
          "`T` is a placeholder for \"whatever type is passed in.\" TypeScript figures out `T` separately for each call and uses it to check both the argument and how the result is used.",
        walkthrough: [
          { code: "function identity<T>(value: T): T {", explanation: "`<T>` declares a type variable; `value: T` and the return type `T` both refer to the same, yet-to-be-determined type." },
          { code: 'const num = identity(5);', explanation: "TypeScript infers T as number here, purely from the argument 5, so `num` is known to be a number." },
          { code: "const wrong: string = identity(5);", explanation: "identity(5) returns a number, so assigning it to a string-typed variable is an error." },
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
          "`firstItem` works for an array of any type. The `extends` clause on `longest` restricts T to types that actually have a `.length` property, so calling it with plain numbers is rejected.",
      },
    ],
    howItWorks: `
When you call a generic function, the compiler looks at the actual
argument(s) you pass and works backward to figure out what \`T\` must be —
this is called **type inference** for generics. It then substitutes that
inferred type everywhere \`T\` appears in the signature, and checks the
rest of the call as if you'd written that specific type by hand. You can
also specify \`T\` explicitly, like \`identity<string>("hi")\`, if you want
to be precise or if inference can't figure it out on its own. A
**constraint** (\`T extends SomeShape\`) narrows what \`T\` is allowed to be,
so the function body can safely rely on \`T\` having certain properties.
    `.trim(),
    whyItExists: `
Without generics, you'd face a trade-off: either duplicate the same logic
for every type you need to support (a **numberIdentity**, **stringIdentity**,
and so on), or use **any** and lose type checking entirely. Generics let you
write the logic exactly once, while still getting full, specific type
checking for every individual call.
    `.trim(),
    whenToUse: `
Reach for generics whenever a function or type's logic doesn't actually
depend on a specific type — a function that stores, returns, wraps, or
transforms whatever it's given (arrays, containers, caches, API wrappers)
is a natural fit. Also reach for them when writing a reusable interface,
like a generic \`ApiResponse<T>\` that wraps different kinds of data.
    `.trim(),
    whenNotToUse: `
If a function only ever needs to work with one specific type, adding a
type variable is unnecessary complexity — just write the concrete type
directly. Generics are for genuinely type-independent logic, not a default
to sprinkle onto every function.
    `.trim(),
    commonMistakes: [
      "Adding a generic `<T>` to a function that never actually uses `T` in its parameters or return type — if `T` isn't tied to anything, it isn't doing any useful checking.",
      "Reaching for `any` instead of a generic when the goal is really \"any type, but consistently the same type throughout,\" which a generic captures and `any` doesn't.",
      "Forgetting a constraint (`extends`) and then trying to use a property inside the function body that not every possible `T` actually has.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a generic function `wrapInArray<T>(value: T): T[]` that returns a one-element array containing the value." },
      { difficulty: "Medium", prompt: "Write a generic function `pluck<T>(items: T[], index: number): T | undefined` that safely returns the item at a given index." },
      { difficulty: "Hard", prompt: "Write a generic function `merge<T extends object, U extends object>(a: T, b: U): T & U` that merges two objects and returns their intersection type." },
    ],
    interviewQuestions: [
      { question: "What problem do generics solve that writing a separate function per type would also solve, but worse?", answer: "They let you write the logic exactly once while still getting full, type-specific checking for every call, instead of duplicating nearly identical functions like `numberIdentity` and `stringIdentity` for each type you need to support." },
      { question: "Why is `any` a worse alternative to a generic for a function like `identity`?", answer: "`any` disables checking entirely — a caller could pass a `number` and treat the result as a `string` with no error — whereas a generic ties the return type to whatever specific type was actually passed in." },
      { question: "Given `function identity<T>(value: T): T { return value; }`, what type is inferred for `identity(5)`, and how does TypeScript arrive at it?", answer: "`number` — TypeScript works backward from the actual argument `5` to figure out what `T` must be for that specific call, then substitutes `number` everywhere `T` appears in the signature." },
      { question: "Why does `const wrong: string = identity(5);` fail to compile?", answer: "`T` is inferred as `number` from the argument `5`, so `identity(5)` returns `number`, which isn't assignable to a variable explicitly typed `string`." },
      { question: "How does TypeScript infer a generic type variable when you call the function without specifying it explicitly?", answer: "It looks at the actual argument(s) supplied at the call site and works out the most specific type that makes the call valid, using that as `T` for just that call." },
      { question: "How do you explicitly specify a generic type argument instead of relying on inference, and when might you need to?", answer: "By writing it in angle brackets at the call site, like `identity<string>(\"hi\")` — useful when inference can't determine a specific-enough type on its own, or when you want to be explicit for clarity." },
      { question: "What does adding a constraint like `T extends { length: number }` do to a generic type parameter?", answer: "It narrows the set of types `T` is allowed to be to only those that structurally have a `.length` property, letting the function body safely use `.length` while still accepting any type that qualifies." },
      { question: "Why does `longest(3, 4)` fail to compile when `longest` is declared as `function longest<T extends { length: number }>(a: T, b: T): T`?", answer: "`number` doesn't have a `.length` property, so it doesn't satisfy the constraint — the constraint restricts `T` to types with `.length`, and plain numbers aren't one of them." },
      { question: "What's wrong with a generic function whose type parameter `T` never actually appears in its parameters or return type?", answer: "If `T` isn't tied to any input or output, the compiler has no argument to infer it from and no way to check anything against it, so it isn't doing any useful type checking — it's generic in name only." },
      { question: "Given `function firstItem<T>(items: T[]): T | undefined`, what's the inferred type of `firstItem([\"Ana\", \"Bo\"])`?", answer: "`string | undefined` — `T` is inferred as `string` from the array's element type, and the `| undefined` in the declared return type accounts for the case where the array is empty." },
      { question: "Why does `firstItem`'s return type include `| undefined` even though the function body doesn't check the array's length before indexing?", answer: "TypeScript's array indexing doesn't automatically add `undefined` for out-of-bounds access by default, so `| undefined` here is a deliberate, hand-written part of the signature to represent the empty-array case honestly, rather than something the compiler infers on its own." },
      { question: "What's the difference between constraining a generic with `T extends SomeShape` and simply typing a parameter as a union?", answer: "A constraint restricts *which types `T` may be* while still preserving and returning that exact specific type per call; a union parameter widens the parameter to a fixed set of types and any return value tied to it is only known as that same wide union, not the caller's specific type." },
      { question: "Can generics be used on interfaces and type aliases, not just functions?", answer: "Yes — a reusable shape like `interface ApiResponse<T> { data: T; error?: string }` uses the same type-variable mechanism to describe a wrapper whose contents vary by use, while the wrapper's own shape stays consistent." },
      { question: "Why doesn't `any` capture the idea of \"any type, but the same type consistently throughout one call\" the way a generic does?", answer: "`any` disables checking for every use of that value independently, so nothing enforces that, say, the input and output stay the same type — a generic ties every occurrence of `T` in one call to a single, consistent, inferred type." },
      { question: "What could go wrong with `function merge<T, U>(a: T, b: U): T & U` if it's called with two primitives, like `merge(1, \"a\")`?", answer: "Without constraints, `T` and `U` can be anything, including incompatible primitives — intersecting `number & string` produces `never`, so the function's return type becomes unusable for that call even though it compiles." },
      { question: "How does adding `T extends object, U extends object` to `merge` prevent that problem?", answer: "It restricts both type parameters to object types, ruling out primitives entirely, so the intersection `T & U` is always between two object shapes that can be sensibly merged." },
      { question: "When would you prefer a generic function over writing several function overloads, one per accepted type?", answer: "When the logic itself doesn't change based on the type — generics express that once with a single implementation, while overloads are better suited to genuinely different behavior or return types per input type." },
      { question: "Why is the minimal `identity<T>(value: T): T` function a useful example for understanding generics, despite doing so little?", answer: "It isolates the core mechanism — a type variable flowing from parameter to return type — without any other logic getting in the way, making it clear that `T` is inferred per call and preserved through the signature." },
      { question: "What happens if you call `identity<string>(5)`, explicitly specifying `T` as `string`?", answer: "It's a compile error — explicitly specifying `T` doesn't override the argument's actual type, it just fixes what `T` is expected to be, and the compiler still checks that `5` (a `number`) is assignable to that fixed `T`." },
      { question: "Does specifying a generic type argument explicitly skip the compiler's checking of the argument against it?", answer: "No — explicit type arguments fix `T` for that call, but the compiler still verifies that each actual argument is assignable to the resulting, now-concrete parameter types." },
      { question: "Why might inference occasionally fail to pin down a specific-enough type, forcing you to specify `T` explicitly?", answer: "Some call sites are ambiguous on their own — for example, calling a generic function with an empty array literal gives the compiler no element to infer an element type from, so it may fall back to an overly wide or unhelpful inferred type." },
      { question: "Does `T extends { length: number }` require the argument to be declared as implementing some specific interface, or just to structurally have a `.length` property?", answer: "Just structurally — TypeScript's structural typing means any type with a compatible `.length: number` property satisfies the constraint, regardless of its name or where it's declared." },
      { question: "What does a generic type parameter default, like `interface Box<T = string>`, do?", answer: "It supplies a fallback type to use for `T` when the type is referenced without an explicit type argument (e.g. plain `Box` behaves like `Box<string>`), while still allowing `Box<number>` or any other type to be specified." },
      { question: "Compare `function f<T extends string | number>(x: T): T` with `function f(x: string | number): string | number` — what's the key behavioral difference?", answer: "The generic version returns the caller's *exact* specific type (passing in a `string` gives back a `string`), while the union version always returns the wide `string | number` type regardless of what was actually passed in, losing that specificity." },
      { question: "Why does using a generic parameter preserve a value's specific type through a function call, where widening to a union or `any` would lose it?", answer: "A generic ties the return type directly to the inferred `T` from that particular call's argument, so the compiler carries the exact type through; a union or `any` return type is fixed and identical for every call, discarding whatever specific type came in." },
      { question: "How would you write a generic function that reverses an array while keeping full type safety?", answer: "As `function reverse<T>(items: T[]): T[]`, so calling it with `number[]` returns `number[]` and calling it with `string[]` returns `string[]` — the element type flows through instead of being widened or lost." },
      { question: "Why is a generic container type, like a `Box<T>` that stores and later returns a value, preferable to using `any` for the stored value?", answer: "With `any`, nothing stops storing one type and retrieving it as another; with `Box<T>`, the type used when constructing the box is remembered and enforced consistently every time the value is read back out." },
      { question: "What's the relationship between a generic function's type parameter and the concept of type inference specifically?", answer: "Type inference is the mechanism that determines what a generic's type parameter actually is for a given call, based on the arguments passed — without inference, every generic call would require tediously specifying the type argument by hand." },
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
      "A named set of related constant values, grouped under one type so you can refer to them by name instead of a raw value.",
    explanation: `
Sometimes a value is really one of a small, fixed set of related options —
a direction, a status, a day of the week. You could represent each option
as a plain string or number scattered through your code (\`"UP"\`, \`0\`,
\`1\`), but then nothing groups those related values together, and typos
like \`"Up"\` instead of \`"UP"\` are easy to make and hard to catch.

An **enum** (short for "enumeration") groups a related set of named
constants under one type. You declare the names once, and TypeScript
treats each name as a distinct, valid value of that enum — while rejecting
any string or number that isn't one of them.
    `.trim(),
    analogy:
      "An enum is like the settings on a washing machine dial — Delicate, Normal, Heavy Duty. There's no in-between setting and no typing your own; you pick one of the fixed, clearly labeled positions the dial actually has.",
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
          "Each member of `Direction` automatically gets a number, starting at 0. `Direction[direction]` looks the name back up from its numeric value — a feature specific to numeric enums.",
        walkthrough: [
          { code: "enum Direction {\n  Up,\n  Down,\n  Left,\n  Right,\n}", explanation: "Declares four related named constants as one type, numbered 0 through 3 by default." },
          { code: "let move: Direction = Direction.Up;", explanation: "move can only hold one of the four Direction values — nothing else is valid." },
          { code: "walk(Direction.Left);", explanation: "Passing a named member instead of a raw number makes the call self-explanatory at the call site." },
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
          "A string enum assigns an explicit, readable string to each member instead of an auto-incrementing number, which makes debugging output and logs much clearer than seeing a bare number.",
      },
    ],
    howItWorks: `
Unlike an interface or type alias, an enum is not purely a compile-time
construct — it actually generates real JavaScript code, typically an
object mapping each member name to its value (and, for numeric enums,
back the other way too). When you write \`Direction.Up\`, that compiles
down to reading a property off that generated object at runtime. This is
why enums are one of the few TypeScript-only features that produce actual
runtime code, unlike interfaces and type aliases.
    `.trim(),
    whyItExists: `
Enums give a name to each option in a small, fixed set of related values,
so code that uses them reads clearly (**OrderStatus.Shipped** instead of a
bare **"SHIPPED"** string scattered everywhere) and typos are caught by the
compiler instead of only showing up as a silent bug at runtime.
    `.trim(),
    whenToUse: `
Use an enum when you have a genuinely fixed, small set of related named
options that the rest of the code will refer to by name — status codes,
categories, directions, modes. String enums are usually preferable to
numeric ones when the value might be logged, displayed, or sent over the
network, since the string is self-explanatory on its own.
    `.trim(),
    whenNotToUse: `
For a simple set of string literals, many teams prefer a union of string
literal types (\`type Status = "pending" | "shipped" | "delivered"\`)
instead of an enum — it needs no import, generates no runtime code, and
works more naturally with plain JavaScript values coming from APIs. Reach
for an enum specifically when you want the grouping and reverse lookup
behavior an enum provides.
    `.trim(),
    commonMistakes: [
      "Forgetting that numeric enum members auto-increment starting at 0, and being surprised when inserting a new member in the middle shifts every later member's underlying number.",
      "Assuming an enum is purely a compile-time construct like an interface — it actually generates a real JavaScript object at runtime.",
      "Casting a raw string to a string enum (`\"PENDING\" as OrderStatus`) as a habit, instead of using the enum member directly, which defeats some of the safety enums are meant to provide.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Create a numeric enum `TrafficLight` with `Red`, `Yellow`, and `Green`, and write a function that logs a message for each value." },
      { difficulty: "Medium", prompt: "Convert `TrafficLight` into a string enum with explicit values (\"RED\", \"YELLOW\", \"GREEN\"), and explain in a comment why that might be preferable for logging." },
      { difficulty: "Hard", prompt: "Rewrite the `TrafficLight` string enum as a union of string literal types instead, and write a function that works identically with both versions. Note what changes and what stays the same at the call sites." },
    ],
    interviewQuestions: [
      { question: "What problem does an enum solve compared to scattering raw string or number literals like `\"UP\"` or `0` through the code?", answer: "It groups a fixed set of related values under one named type, so the compiler can catch typos (like `\"Up\"` instead of `\"UP\"`) that would otherwise only surface as a silent bug at runtime." },
      { question: "Do TypeScript enums exist at runtime, unlike interfaces and type aliases?", answer: "Yes — an enum compiles down to a real JavaScript object mapping member names to values, so referencing `Direction.Up` at runtime is actually reading a property off that generated object." },
      { question: "What does `Direction.Up` compile down to at runtime?", answer: "A property lookup on the generated JavaScript object TypeScript creates for the enum — accessing the numeric (or string) value stored under the `Up` key." },
      { question: "Why does `Direction[direction]` work to look up a member's name from its value for a numeric enum?", answer: "TypeScript generates a reverse mapping for numeric enums specifically — the compiled object maps names to numbers *and* numbers back to names — which is why this reverse lookup pattern works only for numeric enums." },
      { question: "Given `enum Direction { Up, Down, Left, Right }`, what is the runtime value of `Direction.Down`?", answer: "`1` — numeric enum members auto-number starting at `0` in declaration order, so `Up` is `0`, `Down` is `1`, and so on." },
      { question: "What happens to the values of later members if you insert a new member in the middle of a numeric enum's declaration?", answer: "Every member declared after the insertion point silently shifts to a new auto-assigned number, which can break any code or stored data that depended on the old numeric values." },
      { question: "How do string enums avoid the member-reordering pitfall numeric enums have?", answer: "Each string enum member is assigned an explicit, fixed string value rather than an auto-incrementing number, so reordering the declarations doesn't change any member's actual value." },
      { question: "What does `console.log(move)` print given `let move: Direction = Direction.Up;` with `Direction` declared as a plain numeric enum?", answer: "`0` — `Direction.Up` is the first member of a numeric enum that starts auto-numbering at `0`." },
      { question: "Why does `ship(\"PENDING\" as OrderStatus)` need an explicit cast rather than being assignable directly?", answer: "A raw string literal like `\"PENDING\"` is not automatically considered the same type as the enum member `OrderStatus.Pending`, even though it has the same underlying value, so TypeScript requires an explicit assertion to accept it where an `OrderStatus` is expected." },
      { question: "What's a common alternative to an enum for representing a small, fixed set of string options, and what does it trade away?", answer: "A union of string literal types, like `type Status = \"pending\" | \"shipped\"` — it needs no import and generates no runtime code, but it loses the enum's grouping under one named value and its (for numeric enums) reverse lookup." },
      { question: "Between an enum and a union of string literals, which one leaves compiled JavaScript output behind, and which is fully erased?", answer: "An enum generates a real runtime object; a union of string literal types is a purely compile-time construct that's completely erased, leaving no trace in the compiled JavaScript." },
      { question: "Why might a string enum be preferable to a numeric enum specifically when the value will be logged, displayed, or sent over a network?", answer: "A string enum's runtime value is a self-explanatory string like `\"SHIPPED\"`, whereas a numeric enum's runtime value is just a bare number, which is meaningless without also knowing the enum's declaration order." },
      { question: "What breaks if you treat an enum as a purely compile-time construct, the same way you'd treat an interface?", answer: "Interfaces are fully erased and leave nothing behind, but an enum actually generates a JavaScript object at runtime — assuming otherwise can lead to surprises around bundle size, reverse lookups, or the enum object being inspectable at runtime." },
      { question: "What changes at the call sites if you convert a numeric `TrafficLight` enum to a string enum with explicit values?", answer: "Nothing about how consumers reference members changes (`TrafficLight.Red` still works the same way) — what changes is the underlying runtime value of each member, from an auto-numbered integer to the explicit string you assigned." },
      { question: "A function expects `status: OrderStatus`, but a caller has a plain string `\"PENDING\"` from a JSON API response. Why does passing it directly fail, and what are two ways to fix it?", answer: "A bare string literal isn't automatically typed as the enum, even if the value matches — you can either cast it explicitly (`\"PENDING\" as OrderStatus`) or, often better, model the field as a union of string literals in the first place so plain API strings are assignable without a cast." },
      { question: "Why can generating a real runtime object for every enum be a downside compared to a union of string literals, from a bundle-size perspective?", answer: "The enum's object and its reverse-mapping entries (for numeric enums) become actual code shipped to the client, whereas a union of string literals is erased entirely and adds nothing to the compiled bundle." },
      { question: "TypeScript numeric enums are known to accept any number as assignable to the enum type, not just its declared members — why is this a notable safety gap compared to string enums?", answer: "Because numeric enums are structurally just numbers under the hood, TypeScript allows any `number` to be assigned without an error for backward-compatibility reasons, whereas string enum members are checked against their specific declared string values, giving string enums stricter safety against invalid values." },
      { question: "Why is `OrderStatus.Pending === OrderStatus.Shipped` guaranteed to be `false`?", answer: "Each enum member is assigned its own distinct underlying value at compile time (a unique auto-number or an explicit unique string), so no two members ever share the same runtime value." },
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
      "How TypeScript figures out, step by step, which specific branch of a union type you're actually holding at a given point in the code.",
    explanation: `
When a value has a union type like \`string | number\`, TypeScript won't
let you use it as if it were definitely one or the other — calling
\`.toUpperCase()\` on it is rejected, because that method only exists on
strings, and the value might be a number.

But once you write a runtime check that only makes sense for one branch —
like \`typeof value === "string"\` — TypeScript is smart enough to notice,
and inside the block where that check passed, it treats \`value\` as
definitely a \`string\`, unlocking string-only methods without any extra
casting or annotation. This automatic, check-by-check narrowing of a wider
type down to a more specific one is called **type narrowing**.

TypeScript recognizes several common narrowing checks: \`typeof\` (for
primitives like \`string\`, \`number\`, \`boolean\`), \`instanceof\` (for
checking if something is an instance of a particular class), plain
truthy/falsy checks (\`if (value)\`), and checking for a specific property
that only exists on one branch of the union.
    `.trim(),
    analogy:
      "It's like sorting mail before opening it. You can't read a letter's contents until you check what kind of envelope it's in — but once you notice it's the 'electric bill' envelope specifically, you now know exactly what's inside and can act on it directly, without guessing.",
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
          "Inside the `if` block, TypeScript treats `value` as a `string` because that's the only way the `typeof` check could have passed. Inside the `else`, it's narrowed to `number` instead — the only remaining possibility.",
        walkthrough: [
          { code: "function printLength(value: string | number) {", explanation: "value starts out as the full union — string or number, unknown which." },
          { code: 'if (typeof value === "string") {', explanation: "This runtime check is one TypeScript specifically recognizes for narrowing a union." },
          { code: "console.log(value.toUpperCase());", explanation: "Inside this block, value is narrowed to string, so calling a string-only method is now allowed." },
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
          "`instanceof` narrows between classes. Checking a shared property with a distinct literal value (like `ok: true` vs. `ok: false`) narrows between interfaces — this pattern is called a discriminated union.",
      },
    ],
    howItWorks: `
The compiler tracks, at every point in your code, the narrowest type it
can prove a variable has based on everything it's seen so far — this is
called **control flow analysis**. When it sees a recognized check
(\`typeof\`, \`instanceof\`, a truthy check, comparing a shared "tag"
property to a specific value, and a few others), it narrows the variable's
type within the branch where that check is known to be true, and narrows
it differently — or back to the original type — outside that branch. This
happens purely by analyzing the code's structure; no runtime type
information is added or checked beyond the check you actually wrote.
    `.trim(),
    whyItExists: `
Union types are only useful if you can eventually narrow them down to act
on a specific branch — otherwise you'd be stuck being unable to use any
branch-specific behavior at all. Narrowing lets TypeScript recognize the
same runtime checks you'd write anyway (an **if**, a **typeof**) and reward
them with more precise types, without requiring you to write anything
extra just for the type checker's benefit.
    `.trim(),
    whenToUse: `
Whenever you're working with a union type and need to do something
specific to one branch of it, write the narrowing check first (**typeof**,
**instanceof**, a property check) before accessing anything specific to that
branch. Discriminated unions (interfaces sharing one "tag" property with
distinct literal values) are a particularly clean, common pattern for
representing success/failure or variant states.
    `.trim(),
    whenNotToUse: `
Narrowing isn't something you opt in or out of — it happens automatically
whenever you write a recognized check. The mistake to avoid isn't using
narrowing, but reaching for a manual type cast (\`as SomeType\`) instead of
a proper runtime check, which tells the compiler to trust you without
actually verifying anything at runtime.
    `.trim(),
    commonMistakes: [
      "Using a type cast (`as string`) to silence an error instead of writing an actual runtime check, which provides no real safety and can be wrong.",
      "Expecting narrowing to persist after calling another function in between — TypeScript can lose track of a narrowed type if a function call happens between the check and the use, since the function could theoretically change the value.",
      "Forgetting that `instanceof` only works for narrowing between classes, not plain object shapes defined with interfaces — those need a discriminant property check instead.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a function `formatValue(value: string | boolean)` that uppercases the value if it's a string, and returns \"YES\"/\"NO\" if it's a boolean, using typeof narrowing." },
      { difficulty: "Medium", prompt: "Define two interfaces, `Circle { kind: \"circle\", radius: number }` and `Square { kind: \"square\", side: number }`, then write a function `area(shape: Circle | Square): number` using a discriminated union check on `kind`." },
      { difficulty: "Hard", prompt: "Write a function that accepts `unknown` and safely narrows it down step by step (checking it's an object, then that it has a specific property with the right type) before using it — without any `as` casts." },
    ],
    interviewQuestions: [
      { question: "What is type narrowing?", answer: "The process by which TypeScript refines a value's type to something more specific within a particular branch of code, based on a runtime check like `typeof`, `instanceof`, or a property comparison." },
      { question: "Why does TypeScript disallow calling `.toUpperCase()` on a value typed `string | number` before any check?", answer: "Since the value could be a `number` at that point, and `.toUpperCase()` doesn't exist on numbers, the call isn't valid for every possibility the union allows — narrowing first proves which branch you actually have." },
      { question: "Inside `if (typeof value === \"string\") { ... } else { ... }` for a `value: string | number`, what is `value`'s type in each branch?", answer: "`string` inside the `if` block, since that's the only way the check could have passed, and `number` inside the `else`, since it's the only branch left once `string` is ruled out." },
      { question: "What can `instanceof` narrow between, and what can't it narrow between?", answer: "It narrows between classes, checking whether a value is an instance of a particular one — it doesn't work for narrowing between plain object shapes defined with interfaces, since those have no runtime class to check against." },
      { question: "What is a discriminated union, and what property makes narrowing on it reliable?", answer: "A union of object types that all share one common property (the discriminant) holding a distinct literal value per type — checking that one property's value lets TypeScript narrow to the exact matching branch." },
      { question: "Given `Success { ok: true; ... }` and `Failure { ok: false; ... }`, why does `if (result.ok)` narrow `result` to `Success`?", answer: "Only the `Success` branch has `ok` typed as the literal `true`, so a check that `ok` is truthy can only pass when `result` is actually a `Success`, and TypeScript narrows accordingly." },
      { question: "What is control flow analysis, and how does it relate to narrowing?", answer: "It's the compiler tracking, at every point in the code, the narrowest type it can prove a variable has based on everything seen so far — narrowing is the visible effect of that analysis when it recognizes a check like `typeof` or `instanceof`." },
      { question: "How does a plain truthy check like `if (value)` act as a narrowing mechanism?", answer: "It rules out falsy values (`null`, `undefined`, `0`, `\"\"`, `NaN`, `false`) from the type within the `if` block, narrowing a type like `string | null` down to just `string`." },
      { question: "Why is a type cast like `value as string` considered less safe than proper narrowing?", answer: "A cast tells the compiler to trust your claim about the value's type without verifying anything, whereas narrowing is based on an actual runtime check the compiler can confirm was performed before allowing type-specific use." },
      { question: "Why can narrowing be \"lost\" if you call another function between the check and the use of the narrowed value?", answer: "TypeScript can't guarantee the function call didn't change the value in the meantime (e.g. through a shared mutable variable), so it conservatively falls back to the wider, original type rather than assuming the narrowing still holds." },
      { question: "How would you safely narrow a value typed `unknown` down to a specific shape without using `as` casts?", answer: "Step by step with runtime checks — first confirm it's an object (and not `null`) with `typeof value === \"object\" && value !== null`, then check for the specific property you need with an `in` check or a `typeof` check on that property, narrowing further at each step." },
      { question: "When would you reach for `typeof` versus `instanceof` to narrow a union?", answer: "`typeof` for primitives like `string`, `number`, and `boolean`; `instanceof` for distinguishing between values that are instances of different classes." },
      { question: "Why doesn't `instanceof` work to narrow between two plain interfaces with no classes involved?", answer: "`instanceof` checks against a runtime class/constructor, but interfaces produce no such runtime construct — narrowing between interfaces instead requires checking a distinguishing property, as in a discriminated union." },
      { question: "What's the classic trap with using `typeof value === \"object\"` to narrow a union that might include `null`?", answer: "`typeof null` evaluates to `\"object\"` in JavaScript, so this check alone doesn't rule out `null` — you'd still need an explicit `value !== null` check alongside it." },
      { question: "How does checking for a property with the `in` operator (e.g. `\"bark\" in animal`) act as a narrowing check?", answer: "If only one branch of a union declares that property, TypeScript recognizes that a passing `in` check proves the value must be from the branch that actually has it, narrowing accordingly." },
      { question: "Given `function handle(x: string[] | undefined) { if (x) { ... } }`, what's `x`'s narrowed type inside the `if`, and what does that check *not* guarantee?", answer: "It narrows to `string[]` inside the block, since the truthy check rules out `undefined` — but it does not guarantee the array is non-empty, since an empty array is still truthy." },
      { question: "Why is control flow analysis purely a compile-time, static process, adding no runtime type information beyond what you actually wrote?", answer: "The compiler only reasons about which checks appear in the code's structure and where — it doesn't inject any extra runtime checks or metadata; narrowing purely reflects the *existing* checks you wrote, interpreted more precisely." },
      { question: "What breaks if two branches of an intended discriminated union accidentally use the same literal value for their shared tag property?", answer: "TypeScript can no longer distinguish the branches by that property, since a passing check for the shared value no longer implies which specific branch you have — narrowing on that tag stops working correctly." },
      { question: "If a narrowed variable is reassigned to a wider value inside the same branch, does the narrowed type persist for the rest of that branch?", answer: "No — control flow analysis re-evaluates the type after every assignment, so assigning a wider value widens the tracked type again from that point forward, regardless of the earlier narrowing check." },
      { question: "How does a truthy check like `if (value)` differ in behavior from an explicit `if (value !== undefined)` when narrowing `string | undefined`?", answer: "A truthy check also excludes an empty string `\"\"` from the narrowed branch even though `\"\"` is a valid, defined `string`, whereas the explicit `!== undefined` check only rules out `undefined` and leaves `\"\"` in the narrowed `string` branch." },
      { question: "Why doesn't calling an arbitrary custom function like `isString(value)` automatically narrow a union the way `typeof value === \"string\"` does?", answer: "TypeScript only recognizes a fixed set of built-in check patterns for narrowing by default — a plain function call's return type doesn't inform the compiler which branch was proven true unless the function is specifically declared as a type guard." },
      { question: "What is a user-defined type guard, and how does it let a custom function participate in narrowing?", answer: "A function whose return type is a type predicate, written as `value is string`, which tells the compiler that a truthy return specifically proves the argument is a `string`, letting a custom check narrow a union just like a built-in `typeof` check does." },
      { question: "For `animal: Dog | Cat`, why does `else` alone (after `if (animal instanceof Dog)`) safely narrow to `Cat` without a second `instanceof` check?", answer: "Once the `if` branch's check for `Dog` is ruled out, `Cat` is the only remaining possibility in the union, so control flow analysis narrows the `else` branch to it by elimination, without needing an explicit check for `Cat`." },
      { question: "Can narrowing be lost inside a closure or callback defined within an already-narrowed branch, such as inside a `setTimeout` callback?", answer: "Yes, for the same reason narrowing can be lost across a function call — TypeScript can't guarantee the outer variable wasn't reassigned by the time the callback actually runs, so it conservatively widens the type back inside the callback." },
      { question: "When is a discriminated union preferable to an `instanceof` check for distinguishing variants?", answer: "Discriminated unions work for plain data shapes (interfaces) with no classes involved and are easy to serialize, while `instanceof` is the natural choice when the variants are actual classes carrying their own behavior (methods)." },
      { question: "What guarantee do you lose by using an `as` cast instead of a genuine narrowing check?", answer: "You lose the compiler's verification that the value actually is what you claim — a mistaken cast compiles cleanly but can fail at runtime in a way a real narrowing check, tied to an actual runtime test, would have caught." },
      { question: "Given `function printLength(value: string | number) { if (typeof value !== \"string\") { value.toFixed(2); } }`, is calling `.toFixed(2)` inside the `if` valid, and why?", answer: "Yes — a negated `typeof` check also narrows: since the branch is entered only when `value` is *not* a `string`, and the only other possibility in the union is `number`, TypeScript narrows `value` to `number` there." },
      { question: "Why is narrowing described as something you don't opt into or out of, and what does that imply about how to write runtime checks generally?", answer: "It happens automatically whenever the compiler recognizes a supported check pattern, so writing the runtime checks you'd naturally write anyway (an `if`, a `typeof`) is enough — there's no separate, type-checker-only annotation needed to unlock the narrower type." },
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
      "Built-in generic types that transform an existing type into a new one, so you don't have to redefine similar shapes by hand.",
    explanation: `
Once you have an interface like \`User\`, you'll often need slightly
different versions of it in different situations — a version where every
field is optional (for an update form), a version with only a couple of
fields (for a preview card), a version missing one sensitive field (to
send to the client). Rewriting a near-duplicate interface for each of
these is repetitive, and the copies can drift out of sync as the original
changes.

TypeScript ships a set of built-in **utility types** — generic types that
take an existing type and transform it into a new one — to cover these
common transformations without hand-written duplication. Four of the most
used are: \`Partial<T>\` (makes every property optional), \`Pick<T, Keys>\`
(keeps only the listed properties), \`Omit<T, Keys>\` (keeps everything
*except* the listed properties), and \`Record<Keys, ValueType>\` (builds an
object type mapping each key to the same value type).
    `.trim(),
    analogy:
      "Utility types are like photocopier settings for a type. Instead of retyping a document by hand with a few fields blanked out, you run the original through a setting — \"make every field optional,\" \"keep only these two fields,\" \"drop that one field\" — and get a related but different copy out, without ever hand-editing the original.",
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
          "Each utility type derives a new shape from `User` without duplicating its definition. If `User` gains or loses a field later, `UserUpdate`, `UserPreview`, and `NewUser` all stay automatically in sync.",
        walkthrough: [
          { code: "type UserUpdate = Partial<User>;", explanation: "Partial<T> wraps every property of User in optional (?), so any subset — including none — is valid." },
          { code: 'type UserPreview = Pick<User, "name" | "email">;', explanation: "Pick<T, Keys> keeps only the named properties from User and drops the rest entirely." },
          { code: "type NewUser = Omit<User, \"id\">;", explanation: "Omit<T, Keys> is the mirror image of Pick — it keeps every property except the ones named." },
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
          "`Record<Keys, ValueType>` builds an object type where every key in `Keys` maps to `ValueType`. It's especially useful for lookup tables keyed by a union of specific string values.",
      },
    ],
    howItWorks: `
Utility types aren't special syntax — they're ordinary generic types
defined using features like mapped types (covered later) that ship
built into TypeScript's standard library of type definitions. For
example, \`Partial<T>\` is implemented internally as a mapped type that
iterates over every property key in \`T\` and re-adds it with a \`?\`. When
you write \`Partial<User>\`, the compiler expands that definition using
\`User\` in place of \`T\`, producing the equivalent optional-everything
type. They only affect compile-time checking — like interfaces and type
aliases, they leave no trace in the compiled JavaScript.
    `.trim(),
    whyItExists: `
Deriving a related-but-different type from an existing one is an
extremely common need, and utility types cover the most frequent patterns
(optional versions, subsets, everything-except, lookup tables) so you
don't have to hand-write and maintain nearly-duplicate interfaces that can
silently drift apart from the original over time.
    `.trim(),
    whenToUse: `
Reach for \`Partial\` when building update or patch functions where any
subset of fields may be provided, \`Pick\`/\`Omit\` when you need a narrower
or almost-complete view of an existing type, and \`Record\` when building a
lookup table or map keyed by a known, fixed set of values.
    `.trim(),
    whenNotToUse: `
If the derived type's shape is meant to diverge significantly from the
original — different property names, genuinely unrelated structure — a
fresh interface is clearer than forcing a utility type transformation onto
an unrelated shape. Utility types shine specifically when the new type is
a *direct derivative* of an existing one.
    `.trim(),
    commonMistakes: [
      "Using `Partial<T>` and assuming it makes properties allowed to be `null` — it only makes them optional (possibly omitted), not nullable.",
      "Passing a key to `Pick` or `Omit` that doesn't actually exist on the source type, which TypeScript flags as an error rather than silently ignoring.",
      "Reaching for `Record<string, T>` when the keys are actually a known, fixed set — using the specific union of keys instead gives you far better checking (catching missing or misspelled keys).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Given an interface `Product { id: string; name: string; price: number; }`, create a `Partial<Product>` type and an object using it that only sets `price`." },
      { difficulty: "Medium", prompt: "Using the same `Product` interface, create a `ProductSummary` type with `Pick` that keeps only `name` and `price`, and a `ProductWithoutId` type with `Omit` that drops `id`." },
      { difficulty: "Hard", prompt: "Create a type `Weekday` as a union of the five weekday names, then use `Record<Weekday, number>` to build a type representing hours worked each day, and construct a valid object of that type." },
    ],
    interviewQuestions: [
      { question: "What does `Partial<T>` do to each property of T, mechanically?", answer: "It's a mapped type that iterates every key `K` in `keyof T` and re-adds it with a `?` modifier, so each property becomes optional — the object may omit it entirely, but any property that IS present must still match its original type." },
      { question: "How would you implement `Partial<T>` yourself as a mapped type?", answer: "`type MyPartial<T> = { [K in keyof T]?: T[K] };` — iterate every key of T and copy it back with `?` added, leaving the value type itself untouched." },
      { question: "What is `Required<T>`, and how does it invert what `Partial<T>` does?", answer: "`Required<T>` produces a version of T where every property is mandatory, even ones that were originally optional — it's the mirror image of `Partial<T>`, which adds optionality instead of removing it." },
      { question: "How is `Required<T>` implemented under the hood, and what does the `-?` syntax do?", answer: "`type Required<T> = { [K in keyof T]-?: T[K] };` — the `-?` modifier explicitly strips any existing `?` from each property, forcing it to be present, the opposite of the `?` that `Partial` adds." },
      { question: "Given `type Foo = Required<Partial<User>>;`, what shape does `Foo` end up with?", answer: "The same shape as `User` with every property required again — `Partial` first makes every property optional, then `Required` strips that optionality back off, so the two operations cancel out." },
      { question: "Does `Partial<T>` make a property nullable, i.e. assignable to `null`?", answer: "No — `?` only means the property may be omitted from the object entirely; it says nothing about the property's value type accepting `null`. A property typed `string` under `Partial` becomes optional `string`, not `string | null`, unless `null` was already part of the original type." },
      { question: "What does `Pick<T, K>` do?", answer: "It builds a new type containing only the properties named in `K`, dropping every other property that T has." },
      { question: "What does `Omit<T, K>` do, and how does it relate to `Pick`?", answer: "It keeps every property of T except the ones named in `K` — the mirror image of `Pick`, which keeps only the named ones." },
      { question: "How is `Omit<T, K>` actually implemented internally in terms of `Pick` and `Exclude`?", answer: "As `Pick<T, Exclude<keyof T, K>>` — it first computes the remaining keys by removing `K` from `keyof T` using `Exclude`, then hands that leftover key union to `Pick`, which is why Omit is really just Pick applied to a computed complement of keys." },
      { question: "Why does passing a key that doesn't exist on T produce a compile error with `Pick<T, K>` but not with `Omit<T, K>`?", answer: "`Pick`'s type parameter is constrained as `K extends keyof T`, so an unknown key fails that constraint outright. `Omit`'s type parameter is only constrained as `K extends keyof any` (any property key at all), not `keyof T`, so passing a key T doesn't have is accepted — `Exclude<keyof T, K>` simply has nothing to remove for that key, with no effect and no error." },
      { question: "What does \"distributive\" mean for a conditional type like `Exclude`, and why does `Omit` depend on it?", answer: "`Exclude<A, B>` is defined as `A extends B ? never : A`; when `A` is a union (like a union of keys), TypeScript checks the condition separately against each member of that union rather than the union as a whole — that per-member checking is what \"distributive\" means. `Omit` relies on this: `Exclude<keyof T, K>` must remove exactly the matching keys one at a time out of potentially many keys in `keyof T`." },
      { question: "You need a type with every field of `User` except `id`. Would `Omit<User, \"id\">` or `Pick<User, \"name\"|\"email\"|\"age\">` be the better choice if `User` later gains a new field?", answer: "`Omit<User, \"id\">` — it automatically includes any newly added field on `User` since it only names what to remove. `Pick` with an explicit key list would silently leave the new field out until someone remembers to add it to the list by hand." },
      { question: "What does `Record<K, V>` do?", answer: "It builds an object type where every key in the union `K` maps to the same value type `V` — effectively a lookup table with a known, fixed set of keys." },
      { question: "Given `Record<Role, boolean>` for `Role = \"admin\"|\"editor\"|\"viewer\"`, why does an object missing the `viewer` key fail to compile?", answer: "`Record` expands to a mapped type that enumerates every literal in the `Role` union as a required key, so it behaves exactly like a hand-written interface requiring all three keys — omitting any one of them is a missing-property error, the same as it would be for a plain interface." },
      { question: "Why is `Record<string, T>` a weaker choice than `Record<SpecificKeyUnion, T>` when the keys are actually a small, fixed set?", answer: "`Record<string, T>` expands to an index signature (`{ [key: string]: T }`) rather than a set of enumerated required keys, so it accepts any string key at all — misspelled or extra keys go unnoticed, and no specific key is ever actually guaranteed present, unlike `Record` over a literal union, which enumerates and requires each exact key." },
      { question: "How is `Record<K, V>` implemented as a mapped type?", answer: "`type Record<K extends keyof any, V> = { [P in K]: V };` — it iterates every member of the key union `K` and assigns each one the same value type `V`." },
      { question: "What does `Readonly<T>` do?", answer: "It's a mapped type that adds the `readonly` modifier to every property of T, so none of them can be reassigned after the object is created." },
      { question: "Does `Readonly<T>` enforce that immutability at runtime?", answer: "No — like every utility type, it's a compile-time-only check. The compiler blocks a reassignment expression from type-checking, but nothing about the compiled JavaScript object itself prevents its properties from being changed, e.g. by code that bypasses the type checker." },
      { question: "Given `const u: Readonly<User> = {...}; u.name = \"New\";`, why does the assignment fail to compile?", answer: "`Readonly<User>` marks `name` (and every other property) `readonly`, and assigning to a `readonly` property outside of its initial object literal is rejected regardless of the fact that the value being assigned is a valid `string`." },
      { question: "Is `Readonly<T>`'s restriction \"deep\" — does it also make properties of a nested object property read-only?", answer: "No — `Readonly<T>` is shallow. It only stops reassigning T's own top-level properties; if one of those properties is itself an object, that nested object's own properties remain fully mutable unless you write a separate, recursive deep-readonly type." },
      { question: "What does `ReturnType<T>` extract, and from what kind of type?", answer: "Given a function type, it extracts that function's return type as a standalone type — `ReturnType<() => string>` is `string`." },
      { question: "How is `ReturnType<T>` implemented, and what role does `infer` play?", answer: "`type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;` — the conditional type checks that T is callable, and `infer R` captures whatever return type that call signature has, making R available as the result on the true branch." },
      { question: "Does `ReturnType<T>` distribute when T is a union of function types, e.g. `ReturnType<(() => string) | (() => number)>`?", answer: "Yes — `T` appears bare (not wrapped in something else) in the conditional's check, which makes it a distributive conditional type; TypeScript checks each union member separately and unions the results, giving `string | number` here rather than computing one merged return type." },
      { question: "Does `Partial<T>` distribute the same way over a union type, e.g. `Partial<A | B>`?", answer: "No — `Partial` is a mapped type over `keyof T`, not a conditional type with T appearing bare in an `extends` check, so it doesn't distribute. `keyof (A | B)` only includes keys common to every member of the union, so `Partial<A | B>` ends up built from just those shared keys — a different, narrower result than `Partial<A> | Partial<B>`." },
      { question: "Why would you write `ReturnType<typeof someFunction>` instead of naming the return type directly?", answer: "When the function's return value's shape isn't given its own named type (e.g. it returns an inline object literal type), `ReturnType<typeof someFunction>` lets you reference that shape without retyping it by hand, and it stays automatically in sync if the function's return type ever changes." },
      { question: "What type does `Pick<Partial<User>, \"name\">` produce?", answer: "`{ name?: string }` — `Partial<User>` first makes every property of `User` optional, and `Pick` then keeps only `name` from that already-optional version, so the result stays optional." },
      { question: "Are `Partial<Pick<User, \"name\">>` and `Pick<Partial<User>, \"name\">` equivalent here?", answer: "Yes — both end up as `{ name?: string }`. Picking a single key and then making it optional produces the same result as making everything optional and then picking that one key, since there's no interaction between unrelated keys for either order to disturb." },
      { question: "Why do utility types exist as TypeScript built-ins instead of being something every project defines from scratch?", answer: "Deriving a related-but-different shape from an existing type (an optional version, a subset, an everything-except version, a lookup table) is an extremely common need across virtually every codebase, so shipping these as a shared standard vocabulary avoids each project re-inventing (and subtly re-implementing) the same handful of mapped/conditional types." },
      { question: "Do utility types like `Partial` and `Pick` leave any trace in the compiled JavaScript output?", answer: "No — like interfaces and type aliases, they only affect compile-time type checking. They're expanded and erased entirely by the compiler; nothing about `Partial` or `Pick` exists in the emitted JavaScript." },
      { question: "You need a type for a PATCH endpoint that accepts any subset of `User`'s fields except `id`, which should never be updatable. How would you compose utility types to express that?", answer: "`Partial<Omit<User, \"id\">>` — `Omit` first removes `id` from the allowed shape entirely, and `Partial` then makes every one of the remaining fields optional, so callers may supply any subset of the updatable fields and can never supply `id` at all." },
      { question: "What's the downside of hand-writing a separate interface `UserPreview { name: string; email: string }` instead of `Pick<User, \"name\"|\"email\">`?", answer: "The hand-written version has no structural connection to `User` — if `User`'s `name` or `email` field ever changes type, `UserPreview` silently keeps its old, now-inconsistent definition, whereas `Pick<User, ...>` re-derives itself from `User` automatically every time it's used." },
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
      "Marking a class's properties and methods as `public`, `private`, or `protected` to control what code outside the class is allowed to touch.",
    explanation: `
A JavaScript class can have properties and methods, but every one of them
is reachable from outside the class by default — nothing stops other code
from reading or overwriting a property that was only ever meant to be an
internal implementation detail, like a bank account's raw balance field.

TypeScript adds three **access modifiers** you can put in front of a
class member: \`public\` (the default — reachable from anywhere, same as
plain JavaScript), \`private\` (only reachable from inside the class
itself), and \`protected\` (reachable from inside the class and any class
that extends it, but not from outside). These are enforced by the
compiler at compile time — trying to access a \`private\` member from
outside the class is flagged as an error before the code ever runs.
    `.trim(),
    analogy:
      "Think of a class like a house. `public` is the front porch — anyone can walk up to it. `private` is a locked room only the homeowner has a key to. `protected` is like a family room — the homeowner's kids (subclasses) can use it too, but a random visitor off the street cannot.",
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
          "`balance` can only be read or changed from methods defined inside `BankAccount`. Outside code must go through `deposit` and `getBalance` instead of touching the field directly.",
        walkthrough: [
          { code: "private balance: number;", explanation: "Marks balance as accessible only from within this class's own methods." },
          { code: "public deposit(amount: number): void {", explanation: "public is the default, but writing it explicitly makes the intent clear — this method is the sanctioned way to change balance." },
          { code: "console.log(account.balance);", explanation: "Accessing balance from outside the class violates its private modifier, so the compiler rejects this line." },
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
          "`Dog` can use `this.name` because `protected` extends visibility to subclasses, but code outside the class hierarchy still can't reach it. The `Cat` example shows a shorthand where adding a modifier directly to a constructor parameter both declares and assigns the property.",
      },
    ],
    howItWorks: `
Access modifiers are checked entirely at compile time — the compiler
tracks, for every property and method, which modifier it has and where
the accessing code is located (inside the same class, inside a subclass,
or fully outside), and reports an error for any access that violates the
rule. Once compiled to plain JavaScript, these checks disappear —
JavaScript itself (outside of its own newer, unrelated \`#private\` field
syntax) has no concept of "private," so at runtime, without extra
protection, the property is technically still reachable if someone bypasses
the type checker entirely (for example from plain, untyped JavaScript
calling into the compiled code).
    `.trim(),
    whyItExists: `
As a class grows, it usually ends up with some state that's purely an
internal implementation detail — a cache, a counter, a raw value that
should only ever be changed through a specific method that keeps it valid.
Access modifiers let the class enforce that boundary, so other code is
guided toward the intended public methods instead of reaching in and
manipulating internal state directly, which keeps the class's guarantees
about its own state reliable.
    `.trim(),
    whenToUse: `
Mark a property or method \`private\` whenever it's purely an internal
detail that outside code has no legitimate reason to touch directly — raw
internal state, helper methods that only make sense as steps within a
larger public method. Use \`protected\` specifically when subclasses need
that access too, but unrelated outside code still shouldn't have it.
    `.trim(),
    whenNotToUse: `
Don't mark something private just out of habit — if a property is
genuinely meant to be read or set freely from outside the class (like a
simple data holder with no invariants to protect), **public** (the default)
is the right, simpler choice. Over-restricting access can force callers to
write awkward workarounds for legitimate uses.
    `.trim(),
    commonMistakes: [
      "Assuming `private` blocks access at runtime in the compiled JavaScript, the same way it's blocked at compile time — it's a compile-time-only check unless you use JavaScript's own `#field` private syntax.",
      "Marking every single property `private` reflexively, even ones meant to be freely read from outside, forcing unnecessary getter methods for no real benefit.",
      "Using `protected` when `private` was actually intended, allowing an unrelated subclass to reach in and depend on internal details that were never meant to be part of its contract.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a class `Counter` with a `private count: number` field, and `increment()` and `getCount()` public methods, then try accessing `count` directly from outside to see the error." },
      { difficulty: "Medium", prompt: "Write a base class `Vehicle` with a `protected speed: number`, and a subclass `Car` with a method that uses `this.speed`. Then try accessing `speed` from outside both classes to confirm it's blocked." },
      { difficulty: "Hard", prompt: "Rewrite the `Counter` class using constructor-parameter shorthand (`constructor(private count: number = 0) {}`), and explain in a comment what changed compared to declaring the field separately." },
    ],
    interviewQuestions: [
      { question: "What do `public`, `private`, and `protected` each allow, in terms of what code can access the member?", answer: "`public` (the default) is reachable from anywhere; `private` is reachable only from inside the class where it's declared; `protected` is reachable from that class and any class that extends it, but not from unrelated outside code." },
      { question: "What access modifier does a class member get if you don't write one explicitly?", answer: "`public` — it's the default, identical to how a plain JavaScript class member behaves with no restriction at all." },
      { question: "How does the compiler decide whether a given piece of code is allowed to access a class member?", answer: "It tracks each member's declared modifier and checks where the accessing code lives relative to the class — inside the declaring class itself, inside a subclass, or fully outside — and flags any access that the member's modifier doesn't permit from that location." },
      { question: "Do access modifiers like `private` and `protected` exist as a runtime concept in the compiled JavaScript?", answer: "No — the check is entirely compile-time. Once compiled, the property is a completely ordinary JavaScript property with no built-in restriction, unless the code separately uses JavaScript's own native `#field` syntax." },
      { question: "Given `class BankAccount { private balance: number; ... }` and `const account = new BankAccount(...); console.log(account.balance);`, why does this fail to compile?", answer: "`balance` is marked `private`, so it's only accessible from methods declared inside `BankAccount` itself — the `console.log` call is outside the class entirely, which the `private` modifier doesn't permit regardless of what value `balance` actually holds." },
      { question: "Why does `BankAccount` expose `deposit()` and `getBalance()` as public methods instead of just making `balance` public directly?", answer: "Keeping `balance` private forces every change to go through `deposit`, which can enforce whatever rules the class needs (e.g. never letting the balance go negative), rather than letting outside code overwrite the raw value directly and possibly leave it in an invalid state." },
      { question: "What problem do access modifiers solve that a plain JavaScript class doesn't address on its own?", answer: "In plain JavaScript every class member is reachable from outside by default, with nothing stopping other code from reading or overwriting internal state that was only ever meant to be an implementation detail — access modifiers let TypeScript flag that kind of access as a compile-time error." },
      { question: "What's the difference between `private` and `protected`?", answer: "`private` members are reachable only from inside the exact class that declares them; `protected` members are additionally reachable from any subclass that extends that class, while both still block access from unrelated outside code." },
      { question: "Given `class Animal { protected name: string; ... }` and `class Dog extends Animal { bark() { return this.name; } }`, why does `this.name` compile fine inside `bark()`?", answer: "`protected` extends visibility to the declaring class and any class that extends it — `Dog extends Animal`, so code inside `Dog`'s own methods is allowed to read `this.name`." },
      { question: "Using the same `Animal`/`Dog` classes, why does `dog.name` fail when accessed from completely outside both classes?", answer: "`protected` only opens access to the declaring class and its subclasses' own code — accessing `name` from outside that hierarchy entirely, like a plain `dog.name` at the top level, isn't covered by that rule and is rejected the same way `private` would reject it." },
      { question: "The topic's analogy describes `protected` as being open to \"the family\" but not \"a visitor off the street\" — concretely, whose code counts as family here?", answer: "Code written inside the declaring class itself, and code inside any class that extends it (however many levels deep) — anything else, no matter how closely related it seems otherwise, counts as an outside visitor." },
      { question: "You have a `Vehicle` base class with an internal `speed` field that only `Vehicle` and its subclasses should touch. Which modifier fits, and why not the other two?", answer: "`protected` — `private` would block `Vehicle`'s own subclasses from using `speed` at all, while `public` would let unrelated, external code touch it too; `protected` is the one modifier that matches exactly \"the class and its subclasses, nothing else.\"" },
      { question: "What is constructor-parameter shorthand, and what two things does writing `constructor(private lives: number = 9) {}` do at once?", answer: "Adding an access modifier directly to a constructor parameter both declares `lives` as a property on the class and assigns it from the argument passed in — a single line replaces what would otherwise be a separate field declaration plus an explicit `this.lives = lives;` in the constructor body." },
      { question: "Compare `constructor(private lives: number = 9) {}` to declaring `private lives: number;` as a field and assigning it with `this.lives = lives;` in the constructor body. What's actually different?", answer: "Nothing about access or runtime behavior differs — both end up with the same private `lives` property, enforced the same way. The shorthand form is purely a more concise way to write the exact same declaration-plus-assignment, saving a redundant field line." },
      { question: "Why doesn't marking every class property `private` reflexively make a class \"safer\" in every case?", answer: "If a property is genuinely meant to be read or set freely from outside — a simple data holder with no rules to protect — making it private just forces callers into unnecessary getter/setter methods for no real benefit, adding friction without preventing any actual misuse." },
      { question: "When is `public` (the default) actually the right, deliberate choice rather than an oversight?", answer: "When a property has no invariant that needs protecting and is genuinely meant to be read or set freely from outside the class — forcing it behind `private` plus getter methods in that case only adds ceremony without protecting anything real." },
      { question: "What mistake does using `protected` risk that using `private` wouldn't?", answer: "It lets any subclass — including ones written later, by someone unfamiliar with the original design — reach in and depend on an internal detail that was never meant to be part of the class's contract, since `protected` deliberately opens that door to every subclass." },
      { question: "A colleague uses `as any` to bypass a `private` field's type error and reads the value successfully at runtime. Does this reveal a flaw in TypeScript's `private`?", answer: "No — it's expected and consistent with how the topic describes enforcement: `private` is a compile-time-only check with no runtime concept behind it, so any code that gets past the type checker (a cast, or plain untyped JavaScript) can still reach the property, since it's an ordinary property underneath." },
      { question: "The content notes JavaScript has its own native `#field` private syntax, calling it \"unrelated\" to TypeScript's `private` keyword. What's actually different about it?", answer: "TypeScript's `private` is purely a compile-time annotation — the compiled property is completely ordinary at runtime. JavaScript's native `#field` syntax is enforced by the language itself at runtime: accessing a `#field` from outside the class isn't just discouraged, it's an actual restriction the engine enforces regardless of TypeScript or any type checking at all." },
      { question: "Untyped, plain JavaScript code calls into your compiled TypeScript class and directly reads a property you'd marked `private`. Does this throw at runtime?", answer: "No — since `private` produces no runtime restriction, the compiled property is just a normal, readable JavaScript property, so plain JavaScript callers (which never went through TypeScript's checking in the first place) can read or write it without any error at all." },
      { question: "Why are access modifiers described as being about \"guiding\" other code toward intended public methods rather than about airtight runtime security?", answer: "Because the restriction only exists at compile time — it stops other TypeScript code from accidentally reaching in during normal, type-checked development, but it can't stop determined or untyped code from bypassing it at runtime, so it's a design/discipline tool rather than a genuine security boundary." },
      { question: "Given `class Cat { constructor(private lives: number = 9) {} loseLife(): number { return --this.lives; } }`, can code outside `Cat` call `cat.loseLife()`? Can it read `cat.lives` directly?", answer: "Yes to the first — `loseLife` has no modifier, so it defaults to `public` and is callable from anywhere. No to the second — `lives` is `private` via the constructor shorthand, so reading `cat.lives` from outside the class is a compile error even though the method that changes it is fully public." },
      { question: "If you wanted `lives` in the `Cat` example to be readable from outside but never directly writable, would `private` alone achieve that?", answer: "No — `private` blocks both reading and writing from outside equally; there's no separate modifier for \"read from anywhere, write only from inside.\" Achieving that would mean keeping `lives` private and adding a public getter method (the same pattern `getBalance()` already shows for `BankAccount`), rather than changing which modifier is used." },
      { question: "Between the `BankAccount.balance` example and the `Cat.lives` example, what stays the same in terms of enforced access, and what differs?", answer: "Both properties are equally `private` and equally blocked from outside access — that enforcement is identical. What differs is only how the property gets declared and assigned: `BankAccount` writes a separate field declaration plus an explicit assignment in the constructor body, while `Cat` uses constructor-parameter shorthand to do both in the parameter list itself." },
    ],
    prerequisites: ["interfaces", "functions-with-types"],
    relatedTopics: ["interfaces", "generics"],
    keywords: ["classes", "public", "private", "protected", "access modifiers", "inheritance"],
  },
];
