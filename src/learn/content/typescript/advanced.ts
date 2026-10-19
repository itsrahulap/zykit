import type { Topic } from "../../types/content";

export const typescriptAdvancedTopics: Topic[] = [
  {
    id: "mapped-types",
    title: "Mapped Types",
    level: "advanced",
    description:
      "Build a new type by looping over every property of an existing type and transforming each one the same way.",
    explanation: `
Utility types like \`Partial<T>\` and \`Record<K, V>\` aren't compiler
special cases. They're built with a feature you can use yourself: the
**mapped type**.

A mapped type looks like an object type, but instead of listing properties
it loops over another type's keys, a bit like \`for...in\`:
\`{ [K in keyof T]: ... }\`. \`keyof T\` is a union of \`T\`'s property
names, and the mapped type creates one property for *each* name.

That lets you transform every property the same way: add \`?\` to make it
optional, wrap it, change its type, or change whether it's \`readonly\`.
    `.trim(),
    analogy:
      "A mapped type is like running every item on a checklist through the same rubber stamp. The stamp visits each property in turn and applies the same change (\"make it optional,\" \"make it read-only,\" \"wrap it in a box\") without you naming the properties by hand.",
    examples: [
      {
        title: "Reimplementing Partial and Readonly by hand",
        code: `interface Task {
  title: string;
  done: boolean;
}

// This is essentially how the built-in Partial<T> works internally
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// And how Readonly<T> works
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

type PartialTask = MyPartial<Task>;   // { title?: string; done?: boolean }
type ReadonlyTask = MyReadonly<Task>; // { readonly title: string; readonly done: boolean }`,
        explanation:
          "`[K in keyof T]` loops over every key of `Task` (`\"title\"` and `\"done\"`), and `T[K]` looks up that property's original type. A `?` or `readonly` applies that modifier to every generated property at once.",
        walkthrough: [
          { code: "type MyPartial<T> = {", explanation: "A generic mapped type that transforms any type T." },
          { code: "  [K in keyof T]?: T[K];", explanation: "For each key K of T, make an optional property with the same name and T's original type for it." },
          { code: "type PartialTask = MyPartial<Task>;", explanation: "With Task as T, this expands to { title?: string; done?: boolean }." },
        ],
      },
      {
        title: "Transforming property types, not just modifiers",
        code: `interface Config {
  host: string;
  port: number;
  debug: boolean;
}

// Turn every property into a function that returns its original type
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};

type ConfigGetters = Getters<Config>;
// {
//   getHost: () => string;
//   getPort: () => number;
//   getDebug: () => boolean;
// }`,
        explanation:
          "Mapped types can also rename keys (with an `as` clause) and change each property's type entirely. Here every property becomes a zero-argument function returning its original type, under a renamed \"getX\" key.",
      },
    ],
    howItWorks: `
For \`{ [K in keyof T]: ... }\`, the compiler first resolves \`keyof T\` to
the union of \`T\`'s property names (for \`Task\`, \`"title" | "done"\`).

It then goes through that union, binding \`K\` to each key in turn, and
creates one property per key from the expression after the colon. That's
often \`T[K]\`, an **indexed access type** that looks up that property's
type on \`T\`. The optional \`as\` clause renames each key.

It all happens at compile time. The result is a fully expanded object type
with no loop and no runtime cost.
    `.trim(),
    whyItExists: `
Without mapped types, applying the same change to every property (all
optional, all readonly, all wrapped in a function) would mean rewriting the
type by hand whenever the original changed, or building a few fixed
transformations into the compiler.

Mapped types let anyone write "apply this to every property" once, for any
type. That's exactly how \`Partial\`, \`Readonly\` and \`Record\` are built.
    `.trim(),
    whenToUse: `
Use a mapped type when no built-in utility type fits: turning every
property into a getter, renaming properties in a predictable pattern, or a
reusable domain-specific transformation (like a "validators" object that
mirrors a form's fields).
    `.trim(),
    whenNotToUse: `
If a built-in utility type (\`Partial\`, \`Pick\`, \`Omit\`, \`Record\`,
\`Readonly\`) already does the job, use it. Readers already know it. Save
custom mapped types for what the built-ins don't cover.
    `.trim(),
    commonMistakes: [
      "Treating `keyof T` as an array. It's a union of key names, so only union-style operations work on it.",
      "Writing `[K in keyof T]: T` instead of `[K in keyof T]: T[K]`, which gives every property the whole type instead of its own type.",
      "Forgetting that renaming keys needs the `as` clause. Without it, `[K in keyof T]: ...` can change values but never key names.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a mapped type `Nullable<T>` that turns every property of T into `T[K] | null`, keeping it required." },
      { difficulty: "Medium", prompt: "Write a mapped type `Stringify<T>` that turns every property of T into a `string`, whatever its original type." },
      { difficulty: "Hard", prompt: "Write a mapped type `EventHandlers<T>`. T maps event names to payload types. Rename each key to `on\\${Capitalize<key>}` and make each value a function that takes that payload and returns void." },
    ],
    interviewQuestions: [
      { question: "What is a mapped type?", answer: "A type that builds a new object type by looping over an existing type's keys (with `[K in keyof T]`) and applying the same transformation to each property." },
      { question: "What does `keyof T` produce?", answer: "A union of the literal names of every property on T." },
      { question: "How are built-in utility types like `Partial<T>` implemented?", answer: "As ordinary mapped types in TypeScript's standard type definitions. For example, Partial<T> is `{ [K in keyof T]?: T[K] }`." },
      { question: "What does the `as` clause inside a mapped type let you do that you can't do without it?", answer: "Rename each key with a computed expression, for example turning `title` into `getTitle` with `Capitalize` and a template literal type. Without `as`, a mapped type can only change each property's *value*; the key is copied straight from the union." },
      { question: "What do the `+` and `-` modifier prefixes mean in a mapped type, and what does no prefix default to?", answer: "`-readonly` and `-?` *remove* that modifier from every property; `+readonly` and `+?` *add* it. No sign (`readonly` or `?`) means `+`. You can only remove modifiers with an explicit `-`." },
      { question: "Given `type Req<T> = { [K in keyof T]-?: T[K] }`, what does `Req<{ a?: string; b: number }>` resolve to?", answer: "`{ a: string; b: number }`. `-?` removes optionality, so `a` becomes required; `b` already was. This is exactly how `Required<T>` is implemented." },
      { question: "What makes a mapped type \"homomorphic,\" and why does it matter?", answer: "It maps directly over `[K in keyof T]` for a generic `T`. The compiler treats it as mirroring `T`: it copies `T`'s existing `readonly`/`?` modifiers (unless overridden with `+`/`-`) and keeps array/tuple shapes instead of turning them into plain objects. A mapped type over some other key union gets none of that." },
      { question: "Given `interface Point { readonly x: number; y?: number }`, what does `type Copy<T> = { [K in keyof T]: T[K] }` produce for `Copy<Point>`, even though the mapped type never mentions `readonly` or `?`?", answer: "`{ readonly x: number; y?: number }`, identical to `Point`. The mapping is homomorphic, so original modifiers are preserved unless the mapped type explicitly writes `+`/`-readonly` or `?`." },
      { question: "A mapped type written as `{ [K in keyof T]: T }` compiles but produces the wrong result — what's the mistake, and what's the fix?", answer: "Every property gets the whole type `T` instead of its own type. Use `T[K]` (an indexed access into `T` at key `K`) to give each property its original type." },
      { question: "How does a mapped type differ from `Record<K, V>`?", answer: "`Record<K, V>` is itself a mapped type, `{ [P in K]: V }`, giving every key the same value type `V`. A custom mapped type over `keyof T` can use each property's own type via `T[K]`, so properties can end up with different types." },
      { question: "Why does `Capitalize<string & K>` include the `string &` intersection instead of just `Capitalize<K>`?", answer: "`Capitalize` needs a `string`, but `K` from `keyof T` is generally `string | number | symbol`, since keys aren't only strings. `string & K` keeps just the string part, satisfying the constraint." },
      { question: "Name the built-in string-manipulation utility types mapped types commonly combine with `as`.", answer: "`Uppercase<S>`, `Lowercase<S>`, `Capitalize<S>` and `Uncapitalize<S>`. They change a string literal type's casing at compile time, like their runtime namesakes do to real strings." },
      { question: "How would you write a mapped type `PickByType<T, V>` that keeps only the properties of T whose value type extends V?", answer: "`type PickByType<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] }`. The `as` clause tests each key; keys whose value doesn't extend `V` map to `never`, which drops them from the result." },
      { question: "What does `{ [K in keyof T as never]: T[K] }` produce for any T, and why?", answer: "The empty object type `{}`. Mapping a key to `never` in `as` removes it, so doing that for every key removes all of them." },
      { question: "How is a mapped type different from an index signature like `{ [key: string]: number }`?", answer: "An index signature is *open-ended*: any string key maps to `number`, and names aren't known ahead of time. A mapped type goes through a *specific, known* set of keys (usually `keyof T`) and creates exactly one property per key, with fixed, visible names." },
      { question: "Can the `in` clause of a mapped type iterate over a union of string literals that isn't derived from `keyof`? Give an example.", answer: "Yes. `type Flags = { [K in \"draft\" | \"published\" | \"archived\"]: boolean }` gives `{ draft: boolean; published: boolean; archived: boolean }`. `in` accepts any union of key-like literal types." },
      { question: "How would you write a mapped type that wraps every property's value in `T[K] | null`, without disturbing whatever `readonly`/`?` modifiers the original type already had?", answer: "`type Nullable<T> = { [K in keyof T]: T[K] | null }`. With no `+`/`-`/`readonly`/`?`, modifiers are inherited from T because the mapping is homomorphic. Only the value type changes." },
      { question: "Why does writing `{ [K in SomeObjectType]: ... }` fail, if `SomeObjectType` is an interface rather than a union of key names?", answer: "`in` needs a union of key-like literal types (string, number or symbol literals), and an object type isn't one. Use `keyof SomeObjectType` to get the union of its property names first." },
      { question: "You wrote a mapped type to rename every key with a `get` prefix but forgot the `as` clause, writing `{ [K in keyof T]: () => T[K] }` instead. What's wrong with the output, and would TypeScript catch it?", answer: "It compiles and wraps every value in a function, but the keys aren't renamed: you get `{ title: () => string }`, not `{ getTitle: () => string }`. TypeScript won't flag it, since that's valid. It's a silent logic bug, not a type error." },
      { question: "Is there really a difference between `Partial<T>` and a hand-written `{ [K in keyof T]?: T[K] }`?", answer: "No, they're identical. `Partial<T>` is defined in the standard library exactly as `{ [K in keyof T]?: T[K] }`." },
      { question: "Does adding `readonly` inside a mapped type do anything to the object at runtime?", answer: "No. `readonly`, `?` and the `+`/`-` modifiers are compile-time only. They generate no runtime code and don't freeze, seal or otherwise change the JavaScript object." },
      { question: "You need a type where every property becomes a validator function `(value: OriginalType) => boolean`, but the property names stay exactly the same. Do you need the `as` clause?", answer: "No. `as` is only for changing *keys*. Here only the value changes, so `{ [K in keyof T]: (value: T[K]) => boolean }` is enough." },
      { question: "Can a homomorphic mapped type preserve an array or tuple type instead of turning it into a plain object?", answer: "Yes. A homomorphic mapped type (`[K in keyof T]` over generic T) mirrors whatever T is, so an array or tuple T produces an array/tuple of the same shape with each element type transformed, not an object keyed by indexes." },
      { question: "How does combining a mapped type with a conditional in the `as` clause differ from just using `Pick<T, K>`?", answer: "`Pick<T, K>` needs you to name the keys. A conditional `as` clause (`[K in keyof T as T[K] extends Cond ? K : never]`) picks keys *dynamically* by testing each property's value type, without naming them." },
    ],
    prerequisites: ["generics", "utility-types"],
    relatedTopics: ["utility-types", "conditional-types", "generics"],
    keywords: ["mapped types", "keyof", "indexed access type", "Partial implementation", "as clause"],
  },
  {
    id: "conditional-types",
    title: "Conditional Types",
    level: "advanced",
    description:
      "A type that resolves to one of two types, chosen by a check done at compile time.",
    explanation: `
An \`if\` statement branches on a value while the program runs. Types can
branch too, but while the compiler checks your code, before anything runs.

A **conditional type** looks like a ternary, written with types:
\`T extends U ? X : Y\`. It reads: "if \`T\` is assignable to \`U\`, the
result is \`X\`; otherwise it's \`Y\`." So a type alias can give different
results for different inputs, like \`true\` or \`false\` depending on
whether the input is a string.

Combined with \`infer\`, conditional types get much more powerful. \`infer\`
lets you *extract* and name part of a type inside the \`extends\` check,
not just test it. That's how TypeScript expresses "the return type of this
function" or "the type inside this array" as a type-level computation.
    `.trim(),
    analogy:
      "A conditional type is like a sorting machine on an assembly line. Each item (a type) is tested against a gauge and sent to one of two output belts depending on whether it fits, all decided by its shape before it reaches the end of the line.",
    examples: [
      {
        title: "A basic conditional type",
        code: `type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<42>;      // false

// Conditional types are often used to build safer utility types:
type NonNullableCustom<T> = T extends null | undefined ? never : T;

type C = NonNullableCustom<string | null>; // string`,
        explanation:
          "`IsString<T>` checks at the type level whether `T` is assignable to `string` and resolves to the literal type `true` or `false`. `NonNullableCustom` uses the same idea to remove `null`/`undefined` from a type.",
        walkthrough: [
          { code: "type IsString<T> = T extends string ? true : false;", explanation: "If T extends (is assignable to) string, the result is true, otherwise false." },
          { code: 'type A = IsString<"hello">;', explanation: "\"hello\" is assignable to string, so A is true." },
          { code: "type B = IsString<42>;", explanation: "42 isn't assignable to string, so B is false." },
        ],
      },
      {
        title: "Extracting a type with infer",
        code: `type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type A = UnwrapPromise<Promise<string>>; // string
type B = UnwrapPromise<number>;          // number (unchanged — not a Promise)

// TypeScript's own built-in ReturnType<T> works the same way:
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getUser() {
  return { id: 1, name: "Ana" };
}

type User = MyReturnType<typeof getUser>; // { id: number; name: string }`,
        explanation:
          "`infer U` adds a new type variable, U, which TypeScript fills in by matching `Promise<infer U>` against the actual type. That pulls out whatever is inside the Promise. Applied to a function's return position, the same trick is how the built-in `ReturnType<T>` works.",
      },
    ],
    howItWorks: `
For \`T extends U ? X : Y\`, the compiler checks structurally, at compile
time, whether every value of \`T\` is also a valid \`U\`. If so, the result
is \`X\`; if not, \`Y\`.

With \`infer\` inside the \`extends\` clause, the compiler matches the whole
shape (like \`Promise<...>\` or a function signature) against \`T\`.
Whatever lines up with the \`infer\` placeholder is bound to the new type
variable, which you can use in the \`X\` branch.

If \`T\` is a union, the check runs against *each member separately* and
the results are combined into a union. This is a **distributive
conditional type**.
    `.trim(),
    whyItExists: `
Some type logic must branch on what kind of type it sees: getting the value
out of a Promise type, pulling a function's return type from its
signature, or filtering a union to members that match a pattern.
Conditional types (with **infer**) express that branching and extraction
directly. Without them, these transformations couldn't be written
generically.
    `.trim(),
    whenToUse: `
Use a conditional type for a reusable, generic transformation whose result
depends on the input's shape: extracting part of a wrapped type, building
utilities beyond the built-ins, or filtering a union with a structural
test.
    `.trim(),
    whenNotToUse: `
Everyday application code rarely needs them; they mostly live in library
and utility-type code. If a union, mapped type or built-in utility type
does the job, use that. Conditional types (especially with **infer**) are
much harder to read at a glance.
    `.trim(),
    commonMistakes: [
      "Expecting a conditional type to run once. When T is a union, it's checked against each member separately (distributive conditional types), which can produce a broader union than expected.",
      "Using `infer` outside an `extends` clause. It's only valid inside a conditional type's check.",
      "Using conditional types for logic that would read more clearly as a plain union or a simpler mapped type.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a conditional type `IsArray<T>` that resolves to `true` if T is an array type, and `false` otherwise." },
      { difficulty: "Medium", prompt: "Write a conditional type `ElementType<T>` that uses `infer` to extract an array type's element type (e.g. `ElementType<string[]>` is `string`)." },
      { difficulty: "Hard", prompt: "Write a conditional type `Flatten<T>` that, given `T` or `T[]`, always resolves to `T`: it removes one level of array wrapping if present and leaves non-array types unchanged." },
    ],
    interviewQuestions: [
      { question: "What is a conditional type?", answer: "A type expression `T extends U ? X : Y` that resolves to X if T is assignable to U, and to Y otherwise, evaluated at compile time." },
      { question: "What does the `infer` keyword do inside a conditional type?", answer: "It adds a new type variable that the compiler fills in by matching the pattern (like `Promise<infer U>`) against the actual type, so you can extract part of it for the result." },
      { question: "What is a distributive conditional type?", answer: "When the checked type is a union, the condition is applied to each member separately and the results are combined into a union, instead of checking the whole union once." },
      { question: "Does a conditional type always distribute whenever T is a union, or is there a requirement for that to happen?", answer: "Only when the checked type is a *naked* type parameter, used directly with nothing around it. Wrapping it, as in `[T] extends [U] ? X : Y`, stops distribution, so the union is checked as a whole." },
      { question: "How do you deliberately prevent a conditional type from distributing over a union?", answer: "Wrap both sides of `extends` in a one-element tuple: `[T] extends [U] ? X : Y`. `[T]` is no longer a naked type parameter, so the whole union is checked against U at once." },
      { question: "Given `type ToArray<T> = T extends any ? T[] : never;`, what does `ToArray<string | number>` resolve to?", answer: "`string[] | number[]`. T is naked, so it distributes: `string` gives `string[]`, `number` gives `number[]`, and the results are unioned." },
      { question: "Given `type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;`, what does `ToArrayNonDist<string | number>` resolve to, and how does that differ from the distributive version?", answer: "`(string | number)[]`. The tuple wrapping stops distribution, so the whole union becomes one array type instead of a union of two array types." },
      { question: "What happens when `infer` sits in a position where multiple union members could each match a different candidate, e.g. inferring the return type from `(() => string) | (() => number)`?", answer: "TypeScript infers a union of the candidates, here `string | number`, because in a covariant (output) position multiple matches combine as a union." },
      { question: "How does inference differ when `infer` appears in a contravariant position (a function parameter) versus a covariant position (a return type)?", answer: "In a covariant position, candidates combine into a **union**. In a contravariant position, they combine into an **intersection**, because a parameter type that still accepts everything the wider type did must satisfy every candidate at once." },
      { question: "Write the conditional type that reimplements the built-in `Parameters<T>`.", answer: "`type MyParameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;`. `infer P` captures the whole parameter list as a tuple from the `...args` rest position." },
      { question: "Why can't a simple, non-recursive conditional type like `T extends Promise<infer U> ? U : T` fully unwrap `Promise<Promise<Promise<string>>>` down to `string`?", answer: "It unwraps one layer per evaluation and returns `U` as matched, without checking it again. Full unwrapping needs recursion: `type Await<T> = T extends Promise<infer U> ? Await<U> : T;` reapplies itself until T is no longer a Promise." },
      { question: "What does the recursive `type Await<T> = T extends Promise<infer U> ? Await<U> : T;` resolve to for `Await<Promise<Promise<string>>>`, and how does the recursion terminate?", answer: "`string`. Each step strips one Promise layer (`Promise<string>`, then `string`). Once T no longer extends `Promise<infer U>`, the `: T` branch returns the final non-Promise type." },
      { question: "What limit does TypeScript impose on recursive conditional types, and what happens if you exceed it?", answer: "There's a cap on recursion depth. Exceeding it gives a compile error (\"Type instantiation is excessively deep and possibly infinite\") instead of looping forever, since the compiler can't always tell deep-but-finite recursion from infinite recursion." },
      { question: "How is a conditional type with `infer` different from a function overload for expressing \"the return type depends on the input\"?", answer: "An overload lists a fixed set of input/output signatures, picked at the call site. A conditional type is one reusable rule that works for any input matching the pattern, including inputs the author never listed." },
      { question: "How would you write a conditional type `Flatten<T>` that turns `string[]` into `string` but leaves plain `string` unchanged?", answer: "`type Flatten<T> = T extends (infer U)[] ? U : T;`. If T is an array, `infer U` captures the element type and the result is U; otherwise `: T` returns T unchanged." },
      { question: "`type ElementType<T> = T extends Array<infer U> ? U : never;` applied as `ElementType<string | number[]>` produces `number`, not something involving `string`. Is that a bug?", answer: "No, it's distribution. T is naked, so each member is checked separately: `string` doesn't match and gives `never`; `number[]` matches and gives `number`. `never | number` is just `number`, since `never` disappears from a union." },
      { question: "Why does `type IsNever<T> = [T] extends [never] ? true : false;` need the tuple-wrapping trick instead of `T extends never ? true : false`?", answer: "`never` is the \"empty union.\" Distributing over a naked `never` runs no branches and resolves straight to `never`. Wrapping in `[T] extends [never]` stops distribution, so the check runs and returns `true` or `false`." },
      { question: "How could a conditional type detect whether a given type is specifically `any`?", answer: "`type IsAny<T> = 0 extends 1 & T ? true : false;`. Only for `any` does `1 & T` collapse to `any`, making `0 extends any` true. For every other type, `1 & T` is `1` or `never`, which `0` doesn't extend, so the result is `false`." },
      { question: "How is checking `T extends unknown` different from checking `T extends any` in a conditional type?", answer: "`T extends unknown` is always true and, as a naked check, still distributes over unions, so it's often used as a no-op that triggers distribution. `T extends any` is a special case: `any` bypasses most type rules, so checks against it can behave inconsistently and are usually avoided as a real test." },
      { question: "Write a conditional type `NonFunctionKeys<T>` that resolves to a union of just the property names of T whose values are not functions.", answer: "`type NonFunctionKeys<T> = { [K in keyof T]: T[K] extends (...args: any) => any ? never : K }[keyof T];`. The mapped type turns function-valued keys into `never` and keeps the rest as themselves; indexing with `[keyof T]` collects the survivors into one union." },
      { question: "Why do conditional types need to exist — couldn't the same transformations be written as separate, non-generic type aliases for each case?", answer: "The point is reuse across types not known in advance. A conditional type says \"if the type you give me has this shape, produce this related type\" once, so it works for user types the author never saw. Separate aliases would mean rewriting the logic for every new type." },
      { question: "`type Includes<T, U> = T extends U ? true : false;` called as `Includes<string | number, string>` produces `boolean` instead of the expected `true`. Why?", answer: "Distribution. T is naked, so each member is checked: `string extends string` is `true`, `number extends string` is `false`, and `true | false` displays as `boolean`. To test the whole union, use `[T] extends [U] ? true : false`." },
      { question: "Is a conditional type computed once globally, or re-evaluated per use?", answer: "It's evaluated separately for each distinct set of type arguments it's used with. Identical instantiations are usually cached for performance, but each concrete substitution is evaluated on its own." },
    ],
    prerequisites: ["generics", "mapped-types"],
    relatedTopics: ["mapped-types", "utility-types", "type-narrowing"],
    keywords: ["conditional types", "extends", "infer", "distributive conditional types", "ReturnType"],
  },
  {
    id: "declaration-files",
    title: "Declaration Files (.d.ts)",
    level: "advanced",
    description:
      "A file that describes the shape of existing JavaScript code, with no implementation, so TypeScript can check code that uses it.",
    explanation: `
Much of the JavaScript ecosystem (older libraries, many npm packages, your
team's old code) is plain \`.js\` with no types. Import it into a
TypeScript project and the compiler can't know the shape of its functions,
objects and exports, so everything from it is effectively \`any\`.

A **declaration file**, ending in \`.d.ts\`, describes the *shape* of that
JavaScript (each exported function's signature, each exported object's
structure) with no logic at all. It's pure type information, so the
compiler can check code using the library as if it were a typed TypeScript
module.

You'll see them in two ways:

- Many popular libraries ship their own \`.d.ts\` files.
- For libraries that don't, the community-maintained \`DefinitelyTyped\` project publishes separate \`@types/<package-name>\` packages with hand-written declarations.
    `.trim(),
    analogy:
      "A declaration file is like an appliance's spec sheet, sold separately. It lists every button, what each accepts and what it outputs, but none of the wiring. TypeScript reads the spec sheet to check you're using the appliance correctly, even though someone else built it in a different factory.",
    examples: [
      {
        title: "Describing an existing JavaScript module",
        code: `// mathUtils.js — a plain JavaScript file, no types
function double(x) {
  return x * 2;
}

module.exports = { double };`,
        explanation:
          "Ordinary untyped JavaScript. Imported into TypeScript with no declaration file, `double` is `any`, so a mistaken call like `double(\"5\")` isn't caught.",
      },
      {
        title: "A matching declaration file",
        code: `// mathUtils.d.ts — describes mathUtils.js, contains no implementation
declare function double(x: number): number;

export { double };`,
        explanation:
          "With this file next to `mathUtils.js`, TypeScript can type-check every import of `mathUtils` as if it were written in TypeScript, while the logic stays in the `.js` file.",
        walkthrough: [
          { code: "// mathUtils.d.ts", explanation: "The .d.ts extension marks a declaration-only file. TypeScript expects no runtime code in it." },
          { code: "declare function double(x: number): number;", explanation: "declare means \"trust that this function exists at runtime with exactly this signature.\" No implementation is generated or needed here." },
          { code: "export { double };", explanation: "Exports the described function, so TypeScript files importing mathUtils get full type checking." },
        ],
      },
    ],
    howItWorks: `
A \`.d.ts\` file uses \`declare\` to describe things that exist elsewhere at
runtime (functions, variables, classes, whole modules) without
implementing them.

When you import a \`.js\` file with a matching \`.d.ts\` nearby (or an
installed \`@types/<package>\` package), the compiler reads the declaration
file and checks your usage against it. The \`.d.ts\` file produces no
JavaScript; the code that runs is still the real \`.js\` file.
    `.trim(),
    whyItExists: `
Without declarations, TypeScript's checking would stop at every untyped
JavaScript dependency, and every import from it would be **any**.
Declaration files attach types to existing JavaScript without rewriting
it, so checking reaches the whole dependency graph, not just your
TypeScript code.
    `.trim(),
    whenToUse: `
Write a declaration file for a JavaScript library that has no types and no
**@types/** package. Describe just enough of its shape for your code to be
checked.

You'll also see (and sometimes read or tweak) generated declaration files
when publishing your own TypeScript library, so users get type checking
without your original source.
    `.trim(),
    whenNotToUse: `
Don't hand-write one for a library that already ships types or has a
well-maintained **@types/** package. Check first: duplicate or conflicting
declarations cause confusing errors.

Also don't write one just to silence errors in code you plan to migrate to
TypeScript. Converting the source is usually better long-term than
describing it from the outside forever.
    `.trim(),
    commonMistakes: [
      "Putting implementation logic in a `.d.ts` file. Declaration files are type-only; any code in them is not what runs.",
      "Not checking whether a library already ships types (look for a `types` or `typings` field in its `package.json`) before writing or installing a redundant declaration.",
      "Letting a hand-written `.d.ts` drift from the real JavaScript, so TypeScript confidently checks against the wrong shape.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Given `function add(a, b) { return a + b; }` in plain JavaScript, write a `.d.ts` declaration that takes two numbers and returns a number." },
      { difficulty: "Medium", prompt: "Pick (or imagine) a small npm package with no built-in types. Write out how you'd install its `@types/` package with npm, and why that gives you full type checking on import." },
      { difficulty: "Hard", prompt: "Write a declaration file for a small JavaScript module that exports an object with nested methods (e.g. `logger.info(msg)` and `logger.error(msg)`), using `declare module` or `declare namespace`." },
    ],
    interviewQuestions: [
      { question: "What is a `.d.ts` file?", answer: "A declaration file describing the types of existing JavaScript (functions, variables, classes, modules) with no implementation, so TypeScript can check code that uses it." },
      { question: "What is DefinitelyTyped, and what are `@types/` packages?", answer: "DefinitelyTyped is a community-maintained repository of declaration files for JavaScript libraries without their own types. They're published as separate `@types/<package-name>` npm packages you install alongside the library." },
      { question: "Does a `.d.ts` file produce any JavaScript when compiled?", answer: "No. It's type information only, with no runtime logic and no JavaScript output." },
      { question: "What does `declare module \"some-module\"` do, and when would you reach for it?", answer: "It's an ambient module declaration: it describes a whole module by name. Use it for a library with no `.d.ts` and no file to attach declarations to. Whatever is declared inside becomes the type of imports using that exact specifier." },
      { question: "How would you give TypeScript a type for `import logo from \"./logo.png\"` in a project that doesn't natively understand image imports?", answer: "A wildcard ambient module: `declare module \"*.png\" { const src: string; export default src; }`. `*` matches any specifier ending in `.png`, and the default import is a `string` (the asset URL the bundler produces at build time)." },
      { question: "What makes a `.d.ts` file a global (ambient) script versus a module?", answer: "A top-level `import` or `export`. With one, the file is a module: its declarations are scoped to it and must be imported. With neither, it's a global script and everything it declares is available project-wide with no import." },
      { question: "You added a global-style `declare const API_URL: string;` inside a file that also has an `export` statement elsewhere, and now other files can't see `API_URL` without importing it. Why?", answer: "Any top-level `export` (or `import`) makes the whole file a module, scoping every declaration to it. To keep `API_URL` global, put it in a file with no top-level import/export, or wrap it in `declare global { ... }`." },
      { question: "How do you add ambient/global declarations from inside a file that's otherwise a module?", answer: "Wrap them in `declare global { ... }`. The file stays a module for its exports but also adds to the global scope. It's often used to extend the global `Window` interface." },
      { question: "How does TypeScript find the `.d.ts` files for a third-party package that doesn't ship its own types?", answer: "From a separately installed `@types/<package-name>` package under `node_modules/@types` (e.g. `npm install --save-dev @types/lodash`). By default TypeScript includes everything under `@types` automatically, with no import needed." },
      { question: "If a package ships its own types, how does TypeScript know which file to load?", answer: "It reads the `types` (or older `typings`) field in the package's `package.json`. If that's missing, it looks for a `.d.ts` file named after the package's main entry point." },
      { question: "You install a package whose `@types/<name>` version doesn't match the actual installed package version — what problems can that cause?", answer: "The types may describe signatures, options or exports that don't exist in your version, or miss ones that do. You get false compile errors on fine code, or worse, code that compiles but crashes at runtime because the real API differs." },
      { question: "What is a triple-slash reference directive, and when is it still needed?", answer: "A special comment at the top of a file, `/// <reference path=\"...\" />` or `/// <reference types=\"...\" />`, that tells the compiler to include another declaration file or `@types` package first. It's used to connect older global `.d.ts` files without import/export, or to pull in ambient types not picked up automatically." },
      { question: "What does `export = ` mean inside a declaration file?", answer: "It describes a CommonJS module whose whole export is a single value, like `module.exports = something`. It lets TypeScript type `import foo = require(\"foo\")` (or a default import with `esModuleInterop`) correctly, which `export default` can't represent for that shape." },
      { question: "What's the difference between `declare namespace Foo { ... }` and `declare module \"foo\" { ... }`?", answer: "`declare module \"foo\"` describes a module you `import` by that exact specifier. `declare namespace Foo` declares a global grouping (`Foo.Bar`, `Foo.Baz`) used by name with no import, for older global-script libraries." },
      { question: "How would you describe a JS module that exports an object with nested methods, like `logger.info(msg)` and `logger.error(msg)`?", answer: "An interface for the shape, exported as the module's export: `interface Logger { info(msg: string): void; error(msg: string): void; } declare const logger: Logger; export default logger;`, matching how the real module exports it." },
      { question: "What does the `skipLibCheck` compiler option do, and why do many projects enable it?", answer: "It skips type-checking inside all `.d.ts` files (yours and dependencies'), only reading the shapes they describe. Projects enable it because they can't fix errors in third-party declarations, and checking them on every build is slow." },
      { question: "A hand-written `.d.ts` for an internal JS module has fallen out of sync with the real implementation — what's the actual risk, versus a `.ts` file being wrong?", answer: "In a `.ts` file, the compiler checks the implementation against its types, so mismatches are caught. A hand-written `.d.ts` has no such check; the compiler just trusts it, so callers get wrong types that only show up as runtime bugs." },
      { question: "How does `declare function double(x: number): number;` differ from writing that same signature with a real function body in a `.ts` file?", answer: "The `declare` version has no body and can't have one. It only asserts that a function with this signature exists at runtime, usually in a paired `.js` file. The `.ts` version declares the type and provides the implementation compiled to JavaScript." },
      { question: "Why can a `.d.ts` file for a library be written and published independently from that library's actual source code?", answer: "Declaration files have no logic; the compiler only needs them for type checking, never at runtime. So others, like DefinitelyTyped contributors, can write and maintain types for a library's public API without access to its source." },
      { question: "If a library ships its own `.d.ts` files and an outdated `@types/<name>` package also exists for it, which does TypeScript actually use?", answer: "The package's own types (via the `types` field in its `package.json`). A leftover `@types` package is usually stale; remove it to avoid confusion or, more rarely, real declaration conflicts." },
      { question: "If a `.d.ts` file's `declare function double(x: number): number;` doesn't match what the real `mathUtils.js` actually does at runtime (say it really returns a string), what will TypeScript report?", answer: "Nothing. TypeScript never looks at what `mathUtils.js` really does; it trusts the declaration. Callers are checked against the promised `number`, so the problem is silent at compile time and only appears at runtime." },
      { question: "How does an `@types` package differ from a library shipping types in its own package alongside its code?", answer: "An `@types` package is maintained separately (usually by DefinitelyTyped contributors, not the library's authors) and installed on its own, so it can drift from the library's version. Types shipped inside the library are maintained by its authors and versioned with the code, so they're usually more accurate." },
    ],
    prerequisites: ["interfaces", "functions-with-types"],
    relatedTopics: ["interfaces", "tsconfig-strict-mode"],
    keywords: ["declaration files", "d.ts", "declare", "DefinitelyTyped", "@types", "ambient types"],
  },
  {
    id: "tsconfig-strict-mode",
    title: "tsconfig & Strict Mode",
    level: "advanced",
    description:
      "The file that configures the TypeScript compiler, and the one setting that turns on its strongest safety checks.",
    explanation: `
Which files to check, which JavaScript version to output, how strict to be:
all of this lives in \`tsconfig.json\` at the root of a TypeScript project.
It tells the compiler (and your editor) which files belong to the project,
where compiled output goes, and dozens of options for how picky the type
checker is.

One option stands out: \`strict\`. \`"strict": true\` isn't one check; it
turns on a bundle of stricter settings at once. For example, every
variable's type must be known instead of silently becoming \`any\`, and you
must handle values that might be \`null\` or \`undefined\`.

Most new projects enable it from day one, because adding strictness to a
large, loose codebase later is far more painful.
    `.trim(),
    analogy:
      "tsconfig.json is the referee's rulebook: which parts of the field are in play and how strictly fouls are called. `strict: true` tells the referee \"call every foul\" instead of only the obvious ones. It catches far more, but play stops more often until everyone follows the rules.",
    examples: [
      {
        title: "A minimal tsconfig.json",
        code: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}`,
        explanation:
          "`target` sets the JavaScript version of the output. `module` sets the output's module system. `outDir`/`rootDir` control where compiled files go. `include` lists the project's files. `strict` turns on the full bundle of stricter checks.",
        walkthrough: [
          { code: '"target": "ES2020",', explanation: "How modern the generated JavaScript can be. Older targets are more compatible but sometimes more verbose." },
          { code: '"strict": true,', explanation: "Turns on all the strict-mode checks at once instead of one by one." },
          { code: '"include": ["src/**/*"],', explanation: "Tells the compiler exactly which files belong to the project, instead of scanning the whole filesystem." },
        ],
      },
      {
        title: "What strict mode actually catches",
        code: `// with "strict": false (or strictNullChecks off)
function getLength(text: string) {
  return text.length;
}
let input: string = null; // allowed without strict — a silent trap
getLength(input);          // crashes at runtime: "Cannot read properties of null"

// with "strict": true
let strictInput: string = null;
// Error: Type 'null' is not assignable to type 'string'.
// You are now forced to handle it explicitly:
let safeInput: string | null = null;
if (safeInput !== null) {
  getLength(safeInput); // only reachable once null has been ruled out
}`,
        explanation:
          "Without `strictNullChecks` (part of strict mode), `null` can silently pass as a `string` and crash at runtime. With strict mode, TypeScript makes you handle `null` before using the value, at compile time instead of in production.",
      },
    ],
    howItWorks: `
When the compiler (or your editor's TypeScript integration) starts, it
finds the project's \`tsconfig.json\` and reads \`compilerOptions\`: which
files to include, which JavaScript features to allow or compile away, and
which kinds of type errors to report.

\`"strict": true\` is shorthand for a list of individual flags, including:

- \`noImplicitAny\`: errors when the compiler can't infer a type, instead of quietly using \`any\`.
- \`strictNullChecks\`: treats \`null\` and \`undefined\` as separate types, not assignable to everything.
- Several others (see the diagram).

You can still set each flag individually for strictness in some areas but
not others, but \`strict\` is the usual all-at-once starting point.
    `.trim(),
    diagram: `
tsconfig.json
     ↓
compilerOptions read by tsc / editor
     ↓
strict: true expands into:
  - noImplicitAny
  - strictNullChecks
  - strictFunctionTypes
  - strictBindCallApply
  - strictPropertyInitialization
  - noImplicitThis
  - alwaysStrict
  - useUnknownInCatchVariables
     ↓
every one of those checks applied while compiling
    `.trim(),
    whyItExists: `
Without a shared config, each developer and editor could apply different
rules about what counts as an error, so the project's guarantees would vary
by machine. **tsconfig.json** sets those rules once for the whole project.

**strict** exists because TypeScript's strictness flags were added
gradually, off by default for backward compatibility. Bundling them under
one flag gives new projects an easy, well-tested way to get the full
intended safety without finding and enabling each flag.
    `.trim(),
    whenToUse: `
Turn on **"strict": true** for almost every new project. It pays for
itself many times over by catching real bugs (like unhandled **null**
values) at compile time. Adjust individual **compilerOptions** (like
**target** for the environments you support, or **paths** for import
aliases) when a project needs it.
    `.trim(),
    whenNotToUse: `
Turning on **strict** all at once in a large, loosely typed codebase can
surface a flood of existing errors. There it's often more practical to
enable the individual strict flags one at a time, fixing each category of
error before the next.
    `.trim(),
    commonMistakes: [
      "Thinking `strict: true` is one check. It's a bundle of flags (`noImplicitAny`, `strictNullChecks` and others), each catching a different kind of mistake.",
      "Starting a new project with `strict` off \"for now.\" Adding strictness to loosely written code later is far more work than starting strict.",
      "Not realizing the editor's TypeScript server may need a restart after `tsconfig.json` changes, then wondering why new errors don't appear.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a minimal `tsconfig.json` for a new project targeting ES2020, with `strict` enabled and source files under `src/`." },
      { difficulty: "Medium", prompt: "Write a function that assigns `null` to a `string`-typed variable. Explain the error you get once `strictNullChecks` (part of `strict`) is on, and how to fix it properly." },
      { difficulty: "Hard", prompt: "List three flags that `strict: true` turns on. For each, write a short example of a mistake it catches that non-strict TypeScript allows." },
    ],
    interviewQuestions: [
      { question: "What is `tsconfig.json` for?", answer: "It's the config file at a project's root that controls the TypeScript compiler: which files to include, which JavaScript version to output, and which type-checking rules to enforce." },
      { question: "What does `\"strict\": true` actually do?", answer: "It's shorthand that turns on a bundle of stricter compiler flags at once, including noImplicitAny and strictNullChecks. It isn't a single check itself." },
      { question: "What does `strictNullChecks` specifically catch?", answer: "It stops `null` and `undefined` from being assignable to every other type, so you must handle a possibly missing value before using it." },
      { question: "List the individual compiler flags that `strict: true` bundles together.", answer: "`noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict` and `useUnknownInCatchVariables`. `strict` turns them all on, and each can also be set individually." },
      { question: "What does `noImplicitAny` specifically do, separate from `strictNullChecks`?", answer: "It errors when the compiler can't infer a type (an untyped function parameter, for instance) and would otherwise fall back to `any`. It makes every value have a known type; how `null`/`undefined` are treated is `strictNullChecks`'s job." },
      { question: "What does `strictFunctionTypes` change about how function parameter types are checked?", answer: "Parameters are checked contravariantly instead of bivariantly. A function expecting a narrower parameter type can't be used where one expecting a wider type is required, since it could be called with an argument it can't handle. Without it, some unsound substitutions were allowed for backward compatibility." },
      { question: "What does `strictPropertyInitialization` require of class fields, and how does it depend on `strictNullChecks`?", answer: "Every class property whose type isn't optional or undefined must be assigned by the end of the constructor (or have an initializer); otherwise it would be `undefined` at runtime despite its type. It only works with `strictNullChecks`; without it, `undefined` is assignable to everything, so there's nothing to flag." },
      { question: "What does `useUnknownInCatchVariables` change about `catch` blocks?", answer: "The caught error is typed `unknown` instead of `any`. JavaScript can `throw` any value, not just `Error` objects, so you must narrow it (e.g. `err instanceof Error`) before accessing its properties." },
      { question: "What does `alwaysStrict` do, and how is it different from the other strict-family flags?", answer: "It's not a type-checking flag. It emits `\"use strict\";` in the output and parses input as strict-mode JS. The other flags govern the type checker; `alwaysStrict` governs emitted code and parsing, catching sloppy-mode pitfalls like accidental globals." },
      { question: "What does `strictBindCallApply` add on top of the other strict flags?", answer: "It checks arguments to `.bind()`, `.call()` and `.apply()` against the original function's parameter types. Without it, those methods were typed loosely and let mismatched arguments through." },
      { question: "A large, several-year-old codebase currently has `strict: false`. What's the recommended migration approach, rather than flipping `strict: true` directly?", answer: "Enable the flags one at a time, often `noImplicitAny` first, then `strictNullChecks`, fixing each flag's errors before the next. That avoids facing every category of error across the codebase at once." },
      { question: "Are `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` included when you turn on `strict: true`?", answer: "No. Despite the names, both are separate opt-ins and not part of the `strict` bundle. You must enable each yourself." },
      { question: "What does `noUncheckedIndexedAccess` do, and why isn't it part of the default `strict` bundle?", answer: "It adds `| undefined` to the result of indexing through a string/number index signature, since the key might not exist at runtime. It's left out of `strict` mainly because it's very noisy on existing code that assumes every key is present." },
      { question: "After enabling `strict: true` on an existing project, dozens of pre-existing null/undefined errors appear across files nobody's touching right now. What's a practical way to manage that without turning strict back off?", answer: "Suppress the specific existing errors you're not ready to fix (e.g. a narrow `// @ts-expect-error`) while new code is still checked. Or migrate flag by flag instead of adopting the whole bundle at once, to keep the errors manageable." },
      { question: "Besides `compilerOptions`, what does the `include`/`exclude`/`files` section of `tsconfig.json` control?", answer: "Which files are part of the project. `include` (often a glob like `\"src/**/*\"`) lists what to check, `exclude` removes matches (commonly `node_modules` and build output), and `files` lists exact entry files instead of a glob. None of this affects strictness, only which files are checked." },
      { question: "What's the difference between `target` and `lib` in `compilerOptions`?", answer: "`target` sets the JavaScript syntax version the compiler emits. `lib` sets which built-in type declarations are available (whether `Promise`, newer `Array` methods or DOM types like `document` are known). They're often set together, but changing one doesn't change the other." },
      { question: "A Node.js backend project that never runs in a browser still has DOM types available by default, and code referencing `document` doesn't error as expected. What setting controls this?", answer: "`lib`. By default it's inferred from `target` and usually includes `\"dom\"`. Setting `lib` to something like `[\"ES2020\"]` (without `\"dom\"`) removes the DOM globals, so `document` or `window` correctly error." },
      { question: "What does `esModuleInterop` do, and what problem does it fix?", answer: "It changes how default imports from CommonJS modules work, so `import foo from \"some-cjs-package\"` works even without a real ES-module default export. Without it, you often need the awkward `import * as foo from \"...\"` for a module using `module.exports = ...`." },
      { question: "Why does TypeScript centralize configuration in a single `tsconfig.json` rather than letting each file specify its own compiler options?", answer: "Type guarantees only mean something if every file follows the same rules. If one file could check more loosely, a value typed `string` there might not really be a `string` when it reaches another file. One shared config keeps guarantees consistent for every file and contributor." },
      { question: "What does `noEmitOnError` do, and why might a project want it enabled?", answer: "It stops the compiler emitting any JavaScript when there are type errors, instead of emitting anyway. Projects use it so code with type errors can never be built and shipped by accident, making type errors hard build failures." },
      { question: "Two developers run `tsc` on the same code with the same `strict: true` config and get different errors. What's a likely non-strict-related explanation?", answer: "Different TypeScript versions. `tsconfig.json` sets options, not the compiler version, and newer versions add checks or tighten inference. Pin TypeScript as a project dependency instead of relying on a global install." },
      { question: "You added a new strict flag to `tsconfig.json`, but your editor still isn't reporting the new errors it should. What's the likely fix?", answer: "Restart the editor's TypeScript language server (or reopen the project). It doesn't always re-read `tsconfig.json` on save, so new errors may not appear in the editor until a restart, even though a fresh `tsc` run catches them." },
    ],
    prerequisites: ["declaration-files", "union-intersection-types"],
    relatedTopics: ["declaration-files", "type-narrowing"],
    keywords: ["tsconfig", "strict mode", "noImplicitAny", "strictNullChecks", "compiler options"],
  },
];
