import type { Topic } from "../../types/content";

export const typescriptAdvancedTopics: Topic[] = [
  {
    id: "mapped-types",
    title: "Mapped Types",
    level: "advanced",
    description:
      "Building a brand-new type by looping over every property of an existing type and transforming each one the same way.",
    explanation: `
You've already used utility types like \`Partial<T>\` and \`Record<K, V>\` —
built-in helpers that take a type and produce a related one. Have you
wondered how something like \`Partial<T>\` is actually implemented? It's
not a compiler special case; it's built using a feature you can use
yourself, called a **mapped type**.

A mapped type looks like an object type, but instead of listing properties
by name, it loops over the keys of another type using a syntax similar to
a \`for...in\` loop: \`{ [K in keyof T]: ... }\`. \`keyof T\` gives you a
union of all of \`T\`'s property names, and the mapped type then produces a
new property for *each* of those names, letting you transform the type of
every property the same way — add \`?\` to make them optional, wrap them,
change their type, or even change whether they're \`readonly\`.
    `.trim(),
    analogy:
      "A mapped type is like running every item on a checklist through the same rubber stamp. Whatever properties the original type has, the stamp visits each one in turn and applies the same transformation — \"make it optional,\" \"make it read-only,\" \"wrap it in a box\" — without you ever having to name the properties by hand.",
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
          "`[K in keyof T]` loops over every key of `Task` (`\"title\"` and `\"done\"`), and `T[K]` looks up that property's original type. Adding `?` or `readonly` in front applies that modifier to every generated property at once.",
        walkthrough: [
          { code: "type MyPartial<T> = {", explanation: "Declares a generic mapped type that will transform any type T passed in." },
          { code: "  [K in keyof T]?: T[K];", explanation: "For each key K of T, produce an optional property of the same name, with T's original type for that key." },
          { code: "type PartialTask = MyPartial<Task>;", explanation: "Substituting Task for T expands the mapped type into { title?: string; done?: boolean }." },
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
          "Mapped types can also rename keys (using an `as` clause) and change each property's type entirely — here, every original property becomes a zero-argument function returning that property's type, with a renamed \"getX\" key.",
      },
    ],
    howItWorks: `
When the compiler encounters \`{ [K in keyof T]: ... }\`, it first resolves
\`keyof T\` to the union of \`T\`'s literal property-name types (for
\`Task\`, that's \`"title" | "done"\`). It then iterates that union once per
member, binding \`K\` to each individual key in turn, and generates one
property per iteration using whatever expression appears after the colon
(often \`T[K]\`, an **indexed access type** that looks up the type of that
specific property on \`T\`). The optional \`as\` clause lets each iteration
rename the resulting key instead of keeping the original name. All of this
happens purely at compile time — the result is a fully expanded object
type with no loop or runtime cost involved.
    `.trim(),
    whyItExists: `
Without mapped types, transforming every property of a type the same way
(making them all optional, all readonly, all wrapped in a function) would
require manually rewriting the type by hand every time the original
changed, or hard-coding a small set of transformations directly into the
compiler. Mapped types let library authors and everyday developers alike
express "apply this transformation to every property" once, generically,
for any type — which is exactly how built-in utility types like
\`Partial\`, \`Readonly\`, and \`Record\` are themselves implemented.
    `.trim(),
    whenToUse: `
Reach for a mapped type when none of the built-in utility types quite do
what you need — for example, turning every property into a getter
function, deeply changing property names in a predictable pattern, or
building a domain-specific transformation (like a "validators" object
mirroring a form's fields) that you'll reuse across multiple types.
    `.trim(),
    whenNotToUse: `
If a built-in utility type (\`Partial\`, \`Pick\`, \`Omit\`, \`Record\`,
\`Readonly\`) already does what you need, use that directly instead of
reinventing it — it's clearer to readers already familiar with the
standard set. Save custom mapped types for transformations those built-ins
genuinely don't cover.
    `.trim(),
    commonMistakes: [
      "Forgetting that `keyof T` produces a union of T's key names, not an array — you can't use array methods on it, only union-style operations.",
      "Writing `[K in keyof T]: T` instead of `[K in keyof T]: T[K]`, which repeats the same whole type for every property instead of looking up each individual property's own type.",
      "Not realizing that renaming keys requires the `as` clause — writing `[K in keyof T]: ...` alone can transform values but never changes the key names themselves.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a mapped type `Nullable<T>` that turns every property of T into `T[K] | null`, keeping the property required." },
      { difficulty: "Medium", prompt: "Write a mapped type `Stringify<T>` that turns every property of T into a `string`, regardless of its original type." },
      { difficulty: "Hard", prompt: "Write a mapped type `EventHandlers<T>` that, for an object type T describing event names mapped to payload types, produces a new type where each key is renamed to `on\\${Capitalize<key>}` and each value is a function taking that payload and returning void." },
    ],
    interviewQuestions: [
      { question: "What is a mapped type?", answer: "A type that generates a new object type by iterating over the keys of an existing type (via `[K in keyof T]`) and applying the same transformation to each resulting property." },
      { question: "What does `keyof T` produce?", answer: "A union type made up of the literal names of every property on T." },
      { question: "How are built-in utility types like `Partial<T>` implemented?", answer: "They are themselves ordinary mapped types defined in TypeScript's standard type definitions — for example, Partial<T> is `{ [K in keyof T]?: T[K] }`." },
      { question: "What does the `as` clause inside a mapped type let you do that you can't do without it?", answer: "It lets each iteration rename the resulting property key using a computed expression — for example, renaming a key `title` to `getTitle` by building the new name with `Capitalize` and a template literal type inside the `as` clause. Without `as`, a mapped type can only transform the *value* of each property — the key name is always copied straight from the union being iterated." },
      { question: "What do the `+` and `-` modifier prefixes mean in a mapped type, and what does no prefix default to?", answer: "`-readonly` and `-?` explicitly *strip* that modifier from every generated property, while `+readonly` and `+?` explicitly *add* it. Omitting the sign (just writing `readonly` or `?`) is shorthand for `+readonly`/`+?` — a bare mapped type can only add modifiers, never remove them, without an explicit `-`." },
      { question: "Given `type Req<T> = { [K in keyof T]-?: T[K] }`, what does `Req<{ a?: string; b: number }>` resolve to?", answer: "`{ a: string; b: number }` — the `-?` strips optionality from every property, turning the optional `a` into a required one; `b` was already required, so it's unaffected. This is exactly how the built-in `Required<T>` is implemented." },
      { question: "What makes a mapped type \"homomorphic,\" and why does it matter?", answer: "A mapped type is homomorphic when it maps directly over `[K in keyof T]` for some generic `T` — the compiler treats it as structurally mirroring `T`, so it automatically copies over `T`'s existing `readonly`/`?` modifiers (unless overridden with `+`/`-`) and preserves array/tuple shapes instead of collapsing them into a plain object. A mapped type iterating some other key union (not `keyof T` itself) isn't homomorphic and gets none of that automatic copying." },
      { question: "Given `interface Point { readonly x: number; y?: number }`, what does `type Copy<T> = { [K in keyof T]: T[K] }` produce for `Copy<Point>`, even though the mapped type never mentions `readonly` or `?`?", answer: "`{ readonly x: number; y?: number }` — identical to `Point`. Because the mapping is homomorphic (it iterates `keyof T` directly), TypeScript preserves each property's original modifiers automatically; they'd only change if the mapped type wrote an explicit `+`/`-readonly` or `?` itself." },
      { question: "A mapped type written as `{ [K in keyof T]: T }` compiles but produces the wrong result — what's the mistake, and what's the fix?", answer: "It reuses the whole type `T` as the value for every property instead of looking up each property's own type — every generated property ends up typed as the entire object `T`, not its original field type. The fix is `T[K]` (an indexed access into `T` at key `K`), giving each property back its actual original type." },
      { question: "How does a mapped type differ from `Record<K, V>`?", answer: "`Record<K, V>` is itself a mapped type, defined as `{ [P in K]: V }` — it applies one fixed value type `V` to every key in `K`. A custom mapped type over `keyof T` can instead look up each property's *own* original type via `T[K]`, so different properties end up with different resulting types, which `Record` alone can't express." },
      { question: "Why does `Capitalize<string & K>` include the `string &` intersection instead of just `Capitalize<K>`?", answer: "`Capitalize` requires its type argument to be assignable to `string`, but `K` (bound from `keyof T`) is typed as `string | number | symbol` in general, since object keys aren't restricted to strings. Intersecting with `string` narrows `K` down to only its string-compatible part for each iteration, satisfying `Capitalize`'s constraint." },
      { question: "Name the built-in string-manipulation utility types mapped types commonly combine with `as`.", answer: "`Uppercase<S>`, `Lowercase<S>`, `Capitalize<S>`, and `Uncapitalize<S>` — they transform a string literal type's casing at compile time the same way their runtime namesakes would transform an actual string value." },
      { question: "How would you write a mapped type `PickByType<T, V>` that keeps only the properties of T whose value type extends V?", answer: "`type PickByType<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] }` — the `as` clause runs a conditional per key; a key whose value doesn't extend `V` maps to `never`, and mapping a key to `never` inside `as` drops that property from the result entirely." },
      { question: "What does `{ [K in keyof T as never]: T[K] }` produce for any T, and why?", answer: "The empty object type `{}` — mapping every key's `as` expression to `never` tells the compiler to omit that property from the output, so doing it unconditionally for every key removes all of them, regardless of what T originally contained." },
      { question: "How is a mapped type different from an index signature like `{ [key: string]: number }`?", answer: "An index signature describes an *open-ended* object — any string key maps to `number`, and the property names aren't known ahead of time. A mapped type instead enumerates a *specific, known* set of keys (typically `keyof T`) and produces exactly one property per key it iterates — the resulting property names are fixed and visible in the type." },
      { question: "Can the `in` clause of a mapped type iterate over a union of string literals that isn't derived from `keyof`? Give an example.", answer: "Yes — `type Flags = { [K in \"draft\" | \"published\" | \"archived\"]: boolean }` produces `{ draft: boolean; published: boolean; archived: boolean }`. The `in` clause accepts any union of key-like literal types, not only one produced by `keyof T`." },
      { question: "How would you write a mapped type that wraps every property's value in `T[K] | null`, without disturbing whatever `readonly`/`?` modifiers the original type already had?", answer: "`type Nullable<T> = { [K in keyof T]: T[K] | null }` — leaving off any `+`/`-`/`readonly`/`?` means the modifiers are simply inherited from T, since iterating `keyof T` directly makes the mapping homomorphic; only the value type expression after the colon needs to change." },
      { question: "Why does writing `{ [K in SomeObjectType]: ... }` fail, if `SomeObjectType` is an interface rather than a union of key names?", answer: "The `in` clause needs a union of key-like literal types (string, number, or symbol literals) to iterate over — an object type itself isn't one. You have to convert it first with `keyof SomeObjectType`, which produces the union of its property names, before the mapped type can loop over it." },
      { question: "You wrote a mapped type to rename every key with a `get` prefix but forgot the `as` clause, writing `{ [K in keyof T]: () => T[K] }` instead. What's wrong with the output, and would TypeScript catch it?", answer: "It compiles fine and does wrap every value in a function — but the keys are never renamed; you get `{ title: () => string }`, not `{ getTitle: () => string }`. TypeScript won't flag this as an error, since transforming values without renaming keys is perfectly valid; the missing `as` clause is a silent logic gap, not a type error." },
      { question: "Is there really a difference between `Partial<T>` and a hand-written `{ [K in keyof T]?: T[K] }`?", answer: "No — they're not just similar, they're identical: `Partial<T>` is defined in TypeScript's own standard library exactly as `{ [K in keyof T]?: T[K] }`, so writing that mapped type yourself produces the same type the compiler generates from `Partial<T>`." },
      { question: "Does adding `readonly` inside a mapped type do anything to the object at runtime?", answer: "No. `readonly`, `?`, and the `+`/`-` modifiers are purely compile-time constraints checked by the type system — they affect what the compiler lets you write, but generate no runtime code and don't freeze, seal, or otherwise change the actual JavaScript object produced when the code runs." },
      { question: "You need a type where every property becomes a validator function `(value: OriginalType) => boolean`, but the property names stay exactly the same. Do you need the `as` clause?", answer: "No — `as` is only needed to change the *keys*. Here only the value type changes, so `{ [K in keyof T]: (value: T[K]) => boolean }` is enough; adding an `as` clause without actually renaming anything would be pointless." },
      { question: "Can a homomorphic mapped type preserve an array or tuple type instead of turning it into a plain object?", answer: "Yes — because a homomorphic mapped type (one written as `[K in keyof T]` over generic T) structurally mirrors whatever T actually is, passing an array or tuple type as T produces a new array/tuple of the same shape with each element type transformed, rather than collapsing into an object type keyed by numeric-looking indices." },
      { question: "How does combining a mapped type with a conditional in the `as` clause differ from just using `Pick<T, K>`?", answer: "`Pick<T, K>` requires you to already know and name the specific keys K you want. A mapped type with a conditional `as` clause (`[K in keyof T as T[K] extends Cond ? K : never]`) instead selects keys *dynamically*, based on a structural test against each property's value type, without enumerating them by name." },
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
      "A type that resolves to one of two different types, chosen based on a check performed entirely at compile time.",
    explanation: `
Normal code can branch based on a runtime condition — an \`if\` statement
picks one path or another depending on a value known while the program is
running. Types can branch too, just at a different time: while the
compiler is checking your code, before anything runs.

A **conditional type** looks like a ternary expression, but written with
types instead of values: \`T extends U ? X : Y\`. It reads as: "if type
\`T\` is assignable to type \`U\`, resolve to type \`X\`; otherwise, resolve
to type \`Y\`." This lets a type alias produce a different result depending
on what type it's given — for example, a type that resolves to \`true\` or
\`false\` depending on whether the input is a string.

Conditional types become especially powerful combined with \`infer\`,
which lets you *extract* and name a piece of a type inside the \`extends\`
check, instead of just testing it. \`infer\` is how TypeScript can express
things like "give me the return type of this function" or "give me the
type inside this array," purely as a type-level computation.
    `.trim(),
    analogy:
      "A conditional type is like a sorting machine on an assembly line: each item that comes down the belt (a type) gets tested against a gauge, and depending on whether it fits, it's routed onto one of two different output belts — all decided automatically, before the item ever reaches the end of the line, based purely on its shape.",
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
          "`IsString<T>` checks, purely at the type level, whether `T` is assignable to `string`, and resolves to the literal type `true` or `false` accordingly. `NonNullableCustom` uses the same mechanism to strip `null`/`undefined` out of a type.",
        walkthrough: [
          { code: "type IsString<T> = T extends string ? true : false;", explanation: "Declares a conditional type: if T extends (is assignable to) string, resolve to true, otherwise false." },
          { code: 'type A = IsString<"hello">;', explanation: "The literal type \"hello\" is assignable to string, so A resolves to true." },
          { code: "type B = IsString<42>;", explanation: "The literal type 42 is not assignable to string, so B resolves to false instead." },
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
          "`infer U` introduces a new type variable, U, that TypeScript fills in by matching the shape of `Promise<infer U>` against the actual type — effectively pulling out whatever was inside the Promise. The same trick, applied to a function's return position, is how the built-in `ReturnType<T>` is implemented.",
      },
    ],
    howItWorks: `
When the compiler evaluates \`T extends U ? X : Y\`, it checks — purely
structurally, at compile time — whether every value of type \`T\` would
also be a valid value of type \`U\`. If so, the whole expression resolves
to \`X\`; if not, it resolves to \`Y\`. When \`infer\` appears inside the
\`extends\` clause, the compiler doesn't just check a yes/no match — it
tries to match the overall shape (like \`Promise<...>\` or a function
signature) against \`T\`, and whatever type lines up with the \`infer\`
placeholder gets bound to that new type variable, which then becomes
available to use in the \`X\` branch. If \`T\` is itself a union, the
conditional type is checked against *each member of the union
separately* and the results are combined back into a union — this
behavior is called a **distributive conditional type**.
    `.trim(),
    whyItExists: `
Some type-level logic genuinely needs to branch on what kind of type it's
looking at — extracting the awaited value out of a Promise type, pulling a
function's return type out of its signature, or filtering a union down to
just the members that match a pattern. Conditional types (with **infer**)
give the type system a way to express that branching and extraction
directly, without which those transformations would be impossible to
describe generically.
    `.trim(),
    whenToUse: `
Reach for a conditional type when you're building a reusable, generic type
transformation whose result genuinely depends on the shape of its input —
extracting a piece of a wrapped type, building type-level utilities beyond
what's built in, or filtering a union type down based on some structural
test.
    `.trim(),
    whenNotToUse: `
For everyday application code, conditional types are rarely necessary —
they mostly show up inside library and utility-type code. If a simple
union, mapped type, or one of the built-in utility types already expresses
what you need, prefer that; conditional types (especially with **infer**)
are noticeably harder for other developers to read at a glance.
    `.trim(),
    commonMistakes: [
      "Writing a conditional type expecting it to run once, without realizing that when T is a union, the condition is checked separately against each member (distributive conditional types), which can produce a broader union than expected.",
      "Using `infer` outside of an `extends` clause, where it isn't valid — `infer` can only appear as part of a conditional type's structural check.",
      "Overusing conditional types for logic that would be clearer and easier to read as a plain union or a simpler mapped type.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a conditional type `IsArray<T>` that resolves to `true` if T is an array type, and `false` otherwise." },
      { difficulty: "Medium", prompt: "Write a conditional type `ElementType<T>` that, given an array type T, uses `infer` to extract and return the type of its elements (e.g. `ElementType<string[]>` is `string`)." },
      { difficulty: "Hard", prompt: "Write a conditional type `Flatten<T>` that, given either `T` or `T[]`, always resolves to `T` — flattening away one level of array wrapping if present, and leaving non-array types unchanged." },
    ],
    interviewQuestions: [
      { question: "What is a conditional type?", answer: "A type-level expression of the form `T extends U ? X : Y` that resolves to X if T is assignable to U, and to Y otherwise, evaluated entirely at compile time." },
      { question: "What does the `infer` keyword do inside a conditional type?", answer: "It introduces a new type variable that the compiler fills in by structurally matching the surrounding pattern (like `Promise<infer U>`) against the actual type, letting you extract a piece of that type for use in the result." },
      { question: "What is a distributive conditional type?", answer: "The behavior where, if the type being checked in a conditional type is a union, the condition is applied separately to each member of the union and the results are combined back into a union, rather than being checked once against the whole union." },
      { question: "Does a conditional type always distribute whenever T is a union, or is there a requirement for that to happen?", answer: "Distribution only happens when the type being tested is a *naked* type parameter — referenced directly, with nothing wrapped around it — in the extends position. Wrapping it, e.g. `[T] extends [U] ? X : Y`, suppresses distribution, so the union is checked as a whole in a single pass instead of member-by-member." },
      { question: "How do you deliberately prevent a conditional type from distributing over a union?", answer: "Wrap both sides of `extends` in a one-tuple: `[T] extends [U] ? X : Y`. Wrapping T in `[T]` makes it something other than a naked type parameter, so the compiler checks the whole union against U at once instead of distributing member-by-member." },
      { question: "Given `type ToArray<T> = T extends any ? T[] : never;`, what does `ToArray<string | number>` resolve to?", answer: "`string[] | number[]` — because T is naked, the conditional distributes: it's evaluated separately as `string extends any ? string[] : never` (giving `string[]`) and `number extends any ? number[] : never` (giving `number[]`), and the two results are unioned back together." },
      { question: "Given `type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;`, what does `ToArrayNonDist<string | number>` resolve to, and how does that differ from the distributive version?", answer: "`(string | number)[]` — wrapping in `[T] extends [any]` suppresses distribution, so the whole union `string | number` is checked and transformed as one unit, producing a single array type of the union rather than a union of two separate array types." },
      { question: "What happens when `infer` sits in a position where multiple union members could each match a different candidate, e.g. inferring the return type from `(() => string) | (() => number)`?", answer: "TypeScript infers a union of all the candidate types it finds — here `string | number` — because when the constraint appears in a covariant (output) position, multiple matches combine with a union." },
      { question: "How does inference differ when `infer` appears in a contravariant position (a function parameter) versus a covariant position (a return type)?", answer: "In a covariant position, multiple candidates combine into a **union**. In a contravariant position, they instead combine into an **intersection** — because narrowing a function's parameter type safely, so it still accepts everything the wider type accepted, requires satisfying every candidate at once, not just one of them." },
      { question: "Write the conditional type that reimplements the built-in `Parameters<T>`.", answer: "`type MyParameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;` — `infer P` captures the entire parameter list as a tuple type, matched against the `...args` rest position." },
      { question: "Why can't a simple, non-recursive conditional type like `T extends Promise<infer U> ? U : T` fully unwrap `Promise<Promise<Promise<string>>>` down to `string`?", answer: "It only checks and unwraps one layer per evaluation — the inferred `U` is returned exactly as matched, without re-running the same check against it. Fully unwrapping nested Promises needs recursion: `type Await<T> = T extends Promise<infer U> ? Await<U> : T;`, re-applying itself to whatever U was inferred as, until T is no longer a Promise." },
      { question: "What does the recursive `type Await<T> = T extends Promise<infer U> ? Await<U> : T;` resolve to for `Await<Promise<Promise<string>>>`, and how does the recursion terminate?", answer: "`string` — each evaluation strips one layer of Promise and recurses on what's left (`Promise<string>`, then `string`); recursion stops once T no longer extends `Promise<infer U>`, so the conditional falls to the `: T` branch and returns the final non-Promise type." },
      { question: "What limit does TypeScript impose on recursive conditional types, and what happens if you exceed it?", answer: "The compiler caps how deep a conditional type can recurse; exceeding it produces a compile error (\"Type instantiation is excessively deep and possibly infinite\") rather than looping forever, since it can't always tell a genuinely deep-but-finite recursion apart from one that truly never terminates." },
      { question: "How is a conditional type with `infer` different from a function overload for expressing \"the return type depends on the input\"?", answer: "An overload lists a fixed, finite number of concrete input/output signature pairs, resolved at the call site based on which one matches. A conditional type instead expresses the relationship generically, as one reusable type-level rule that works for any input satisfying the pattern — including inputs the author never explicitly enumerated — rather than a fixed list of cases." },
      { question: "How would you write a conditional type `Flatten<T>` that turns `string[]` into `string` but leaves plain `string` unchanged?", answer: "`type Flatten<T> = T extends (infer U)[] ? U : T;` — if T matches the shape \"array of something,\" `infer U` captures that element type and the result is U; otherwise the `: T` branch returns T unchanged." },
      { question: "`type ElementType<T> = T extends Array<infer U> ? U : never;` applied as `ElementType<string | number[]>` produces `number`, not something involving `string`. Is that a bug?", answer: "No — it's correct distributive behavior. Because T is naked, the conditional runs separately per union member: `string extends Array<infer U> ? U : never` fails to match and resolves to `never`, while `number[] extends Array<infer U> ? U : never` matches and resolves to `number`. The results union as `never | number`, and since `never` disappears from a union, only `number` is visible." },
      { question: "Why does `type IsNever<T> = [T] extends [never] ? true : false;` need the tuple-wrapping trick instead of `T extends never ? true : false`?", answer: "`never` is the \"empty union\" — a conditional type distributing over a naked `never` type parameter doesn't run its branches at all; it resolves straight to `never` itself before any comparison happens. Wrapping in `[T] extends [never]` prevents distribution, so the check actually runs and can correctly return `true` or `false`." },
      { question: "How could a conditional type detect whether a given type is specifically `any`?", answer: "`type IsAny<T> = 0 extends 1 & T ? true : false;` exploits the fact that `any` is the one type where `1 & T` collapses back to `any` (making `0 extends any` true); for every other type, `1 & T` becomes either `1` or `never`, and `0` doesn't extend either, so it resolves to `false`." },
      { question: "How is checking `T extends unknown` different from checking `T extends any` in a conditional type?", answer: "`T extends unknown` is always true for every T (everything is assignable to `unknown`) and, being a naked check, still distributes normally over unions — often used as a distribution-triggering no-op. `T extends any` is a genuinely special case, since `any` disables most normal type-system rules, so conditional checks against it can behave inconsistently and are generally avoided as a real type-level test." },
      { question: "Write a conditional type `NonFunctionKeys<T>` that resolves to a union of just the property names of T whose values are not functions.", answer: "`type NonFunctionKeys<T> = { [K in keyof T]: T[K] extends (...args: any) => any ? never : K }[keyof T];` — the inner mapped type turns function-valued keys into `never` and keeps the rest as themselves, and indexing the whole mapped type with `[keyof T]` collects the surviving values into one union." },
      { question: "Why do conditional types need to exist — couldn't the same transformations be written as separate, non-generic type aliases for each case?", answer: "Because the point is reusability across arbitrary, not-yet-known input types — a conditional type expresses \"if whatever type you give me has this shape, produce this related type\" once, generically, so it keeps working for user-defined types the author never saw. Hardcoding separate aliases per case would mean rewriting the logic for every new type that comes along." },
      { question: "`type Includes<T, U> = T extends U ? true : false;` called as `Includes<string | number, string>` produces `boolean` instead of the expected `true`. Why?", answer: "Distribution: because T is naked, the check runs separately per union member — `string extends string` is `true`, `number extends string` is `false` — and the two results union into `true | false`, which TypeScript displays as `boolean`. Testing \"does the whole union match\" requires suppressing distribution with `[T] extends [U] ? true : false` instead." },
      { question: "Is a conditional type computed once globally, or re-evaluated per use?", answer: "The compiler evaluates (instantiates) a conditional type separately for each distinct combination of type arguments it's actually used with — it isn't computed once globally. Repeated instantiations with identical arguments are typically cached internally for performance, but semantically each concrete substitution is evaluated on its own." },
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
      "A file that describes the shape of existing JavaScript code, without containing any actual implementation, so TypeScript can check code that uses it.",
    explanation: `
Not all code you use is written in TypeScript. A huge amount of the
JavaScript ecosystem — older libraries, many npm packages, code your team
wrote years ago — is plain \`.js\`, with no type annotations at all. If you
import one of those into a TypeScript project, the compiler has no way to
know what shape its functions, objects, and exports actually have, so
every value coming from it effectively becomes \`any\`.

A **declaration file**, ending in \`.d.ts\`, solves this by describing the
*shape* of that JavaScript — every exported function's signature, every
exported object's structure — without containing any real logic at all.
It's pure type information, describing what's already there, so the
compiler can check code that uses that library the same way it would check
a fully-typed TypeScript module.

You'll encounter these in two common ways: many popular libraries ship
their own \`.d.ts\` files describing themselves, and for libraries that
don't, the community-maintained \`DefinitelyTyped\` project publishes
separate \`@types/<package-name>\` packages containing hand-written
declaration files for them.
    `.trim(),
    analogy:
      "A declaration file is like an appliance's spec sheet, sold separately from the appliance itself. The spec sheet tells you exactly what buttons exist, what each one accepts, and what it outputs — without containing any of the actual wiring inside. TypeScript reads the spec sheet to check that you're using the appliance correctly, even though the real appliance was built by someone else in a completely different factory.",
    examples: [
      {
        title: "Describing an existing JavaScript module",
        code: `// mathUtils.js — a plain JavaScript file, no types
function double(x) {
  return x * 2;
}

module.exports = { double };`,
        explanation:
          "This is ordinary, untyped JavaScript. Imported directly into a TypeScript project with no declaration file, `double` would be typed as `any`, and TypeScript couldn't catch a mistaken call like `double(\"5\")`.",
      },
      {
        title: "A matching declaration file",
        code: `// mathUtils.d.ts — describes mathUtils.js, contains no implementation
declare function double(x: number): number;

export { double };`,
        explanation:
          "Placing this file alongside `mathUtils.js` gives TypeScript enough information to type-check every import of `mathUtils`, as if it had been written in TypeScript from the start — even though the actual logic still lives entirely in the `.js` file.",
        walkthrough: [
          { code: "// mathUtils.d.ts", explanation: "The .d.ts extension marks this as a declaration-only file — TypeScript expects no runtime code inside it." },
          { code: "declare function double(x: number): number;", explanation: "declare tells TypeScript \"trust that this function exists somewhere at runtime, with exactly this signature\" — it does not generate or require any implementation here." },
          { code: "export { double };", explanation: "Exports the described function so other TypeScript files importing mathUtils get full type checking on it." },
        ],
      },
    ],
    howItWorks: `
A \`.d.ts\` file uses the \`declare\` keyword to describe things that exist
elsewhere at runtime — functions, variables, classes, whole modules —
without providing their actual implementation. When you import from a
\`.js\` file that has a matching \`.d.ts\` file nearby (or a separately
installed \`@types/<package>\` package), the TypeScript compiler reads
the declaration file to learn the shapes involved, and checks all your
usage against those shapes. At compile time, the \`.d.ts\` file is purely
informational for the type checker; it produces no JavaScript output of
its own, and the actual code that runs is still whatever is in the real
\`.js\` file.
    `.trim(),
    whyItExists: `
TypeScript's whole benefit — catching type mismatches before code runs —
would stop at the boundary of any untyped JavaScript dependency, forcing
every import from such a library to fall back to **any** and lose all
checking. Declaration files let type information be attached to existing
JavaScript after the fact, without rewriting that JavaScript, so
TypeScript's checking can extend across the entire dependency graph, not
just the code written in TypeScript directly.
    `.trim(),
    whenToUse: `
Write a declaration file when you're using a JavaScript library that has
no types of its own and no **@types/** package available for it — you write
a **.d.ts** describing just enough of its shape for your code to be checked
against it. You'll also encounter (and occasionally need to read or tweak)
generated declaration files when publishing your own TypeScript library,
so consumers get type checking without needing your original source.
    `.trim(),
    whenNotToUse: `
Don't hand-write a declaration file for a library that already ships its
own types or has a well-maintained **@types/** package — check first,
since duplicating or conflicting with an existing declaration causes
confusing errors. Also avoid writing one just to silence errors on code
you actually intend to migrate to TypeScript directly — converting the
source is usually better long-term than perpetually describing it from
the outside.
    `.trim(),
    commonMistakes: [
      "Writing actual implementation logic inside a `.d.ts` file — declaration files are type-only, and any executable code inside them is not what actually runs.",
      "Not realizing a library already ships its own types (check its `package.json` for a `types` or `typings` field) before writing or installing a redundant declaration.",
      "Letting a hand-written `.d.ts` drift out of sync with the real JavaScript it describes, so TypeScript ends up confidently checking against an inaccurate shape.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Given a plain JavaScript function `function add(a, b) { return a + b; }`, write a `.d.ts` declaration describing it as taking two numbers and returning a number." },
      { difficulty: "Medium", prompt: "Look up (or imagine) a small npm package with no built-in types, and write out what installing its `@types/` package via npm would look like, and why it would let you import the package with full type checking." },
      { difficulty: "Hard", prompt: "Write a declaration file describing a small JavaScript module that exports an object with a nested method (e.g. `logger.info(msg)` and `logger.error(msg)`), using a `declare module` or `declare namespace` structure." },
    ],
    interviewQuestions: [
      { question: "What is a `.d.ts` file?", answer: "A declaration file that describes the type shape of existing JavaScript code — functions, variables, classes, modules — without containing any actual implementation, so TypeScript can type-check code that uses it." },
      { question: "What is DefinitelyTyped, and what are `@types/` packages?", answer: "DefinitelyTyped is a community-maintained repository of declaration files for JavaScript libraries that don't ship their own types; those declarations are published as separate `@types/<package-name>` npm packages you can install alongside the library." },
      { question: "Does a `.d.ts` file produce any JavaScript when compiled?", answer: "No. It's purely type information for the compiler — it contains no runtime logic and produces no JavaScript output of its own." },
      { question: "What does `declare module \"some-module\"` do, and when would you reach for it?", answer: "It creates an ambient module declaration — a block describing the shape of an entire module by name, used for a library with no `.d.ts` of its own and no file structure to attach declarations to directly. Anything declared inside it becomes the type of whatever gets imported using that exact module specifier." },
      { question: "How would you give TypeScript a type for `import logo from \"./logo.png\"` in a project that doesn't natively understand image imports?", answer: "A wildcard ambient module declaration: `declare module \"*.png\" { const src: string; export default src; }`. The `*` wildcard matches any specifier ending in `.png`, and the declaration says a default import from one resolves to a `string` (the asset URL a bundler produces at build time)." },
      { question: "What makes a `.d.ts` file a global (ambient) script versus a module?", answer: "Presence of a top-level `import` or `export` statement. A file with at least one of those is treated as a module — its declarations are scoped to that file and must be explicitly imported elsewhere. A file with neither is a global script, and everything it declares becomes available ambiently, project-wide, with no import needed." },
      { question: "You added a global-style `declare const API_URL: string;` inside a file that also has an `export` statement elsewhere, and now other files can't see `API_URL` without importing it. Why?", answer: "Adding any top-level `export` (or `import`) anywhere in the file turns the whole file into a module, which scopes every declaration inside it to that module instead of leaving it ambient. To keep `API_URL` truly global, it needs to live in a file with no top-level import/export, or be wrapped in a `declare global { ... }` block." },
      { question: "How do you add ambient/global declarations from inside a file that's otherwise a module?", answer: "Wrap them in a `declare global { ... }` block. This lets a single file be a module for its own exports while still contributing declarations to the global scope — commonly used to augment things like the global `Window` interface." },
      { question: "How does TypeScript find the `.d.ts` files for a third-party package that doesn't ship its own types?", answer: "It looks for a separately installed `@types/<package-name>` package under `node_modules/@types`, installed like any other dependency (e.g. `npm install --save-dev @types/lodash`). TypeScript automatically includes everything under `@types` by default, without needing to import it directly." },
      { question: "If a package ships its own types, how does TypeScript know which file to load?", answer: "It checks the package's `package.json` for a `types` (or the older `typings`) field pointing at the entry `.d.ts` file; if that's absent, TypeScript falls back to looking for a `.d.ts` file matching the package's main entry point by name." },
      { question: "You install a package whose `@types/<name>` version doesn't match the actual installed package version — what problems can that cause?", answer: "The declaration file can describe a signature, option, or export that either doesn't exist in the version you actually installed, or is missing one that does — causing either false compile errors on perfectly fine code, or, worse, code that compiles but crashes at runtime because the real API doesn't match what the mismatched types promised." },
      { question: "What is a triple-slash reference directive, and when is it still needed?", answer: "A special comment, valid only at the top of a file — `/// <reference path=\"...\" />` or `/// <reference types=\"...\" />` — that tells the compiler to include another declaration file or an `@types` package before checking the current file. It's used to wire together older-style global `.d.ts` files that don't use import/export, or to pull in ambient types not otherwise picked up automatically." },
      { question: "What does `export = ` mean inside a declaration file?", answer: "It describes a CommonJS-style module whose entire export is a single value, matching `module.exports = something` in the real JavaScript. It lets TypeScript correctly type an import written as `import foo = require(\"foo\")` (or, with `esModuleInterop`, a default import), which plain `export default` syntax can't accurately represent for that shape." },
      { question: "What's the difference between `declare namespace Foo { ... }` and `declare module \"foo\" { ... }`?", answer: "`declare module \"foo\"` describes an importable module resolved by that exact string specifier, accessed via `import`. `declare namespace Foo` instead declares an ambient global grouping (`Foo.Bar`, `Foo.Baz`) accessed directly by name with no import — used for older global-script-style libraries rather than modern module imports." },
      { question: "How would you describe a JS module that exports an object with nested methods, like `logger.info(msg)` and `logger.error(msg)`?", answer: "An interface describing the shape, exported as the module's export: `interface Logger { info(msg: string): void; error(msg: string): void; } declare const logger: Logger; export default logger;` — mirroring however the real module actually structures and exports that object." },
      { question: "What does the `skipLibCheck` compiler option do, and why do many projects enable it?", answer: "It skips type-checking the contents of all `.d.ts` files (your own and dependencies'), only reading them for the shapes they describe. It's commonly enabled because a project has no control over errors inside third-party declaration files, and checking every dependency's types on every build is slow and pointless if you can't fix them anyway." },
      { question: "A hand-written `.d.ts` for an internal JS module has fallen out of sync with the real implementation — what's the actual risk, versus a `.ts` file being wrong?", answer: "In a real `.ts` file, the compiler checks the implementation against its own declared types, so a mismatch is usually caught immediately. A hand-written `.d.ts` has no such cross-check against the JS it describes — the compiler simply trusts it, so callers get confidently wrong type information that only surfaces as a runtime bug." },
      { question: "How does `declare function double(x: number): number;` differ from writing that same signature with a real function body in a `.ts` file?", answer: "The `declare` version has no function body and isn't allowed one — it's a pure assertion that a function with this exact signature exists somewhere at runtime, typically in a paired `.js` file. The plain `.ts` version both declares the type and provides the actual implementation that gets compiled to real JavaScript." },
      { question: "Why can a `.d.ts` file for a library be written and published independently from that library's actual source code?", answer: "Declaration files carry no logic — they're a pure description of shape the compiler only needs at type-checking time, never at runtime. That separation is exactly what lets a different party, like DefinitelyTyped contributors, author and maintain accurate types for a library's public API without needing write access to its real source." },
      { question: "If a library ships its own `.d.ts` files and an outdated `@types/<name>` package also exists for it, which does TypeScript actually use?", answer: "TypeScript prefers the types the package itself ships (via its `package.json` `types` field) over a separate `@types/<name>` package. Having both installed is usually just a stale leftover — it's worth removing the redundant `@types` package to avoid confusion or, more rarely, genuine declaration conflicts." },
      { question: "If a `.d.ts` file's `declare function double(x: number): number;` doesn't match what the real `mathUtils.js` actually does at runtime (say it really returns a string), what will TypeScript report?", answer: "Nothing — TypeScript never inspects the real runtime behavior of `mathUtils.js`; it only ever sees and trusts the declaration file. Callers get type-checked against the promised `number` return type, so this failure mode is entirely silent at compile time and only shows up as a runtime mismatch." },
      { question: "How does an `@types` package differ from a library shipping types in its own package alongside its code?", answer: "An `@types` package is maintained completely separately (usually by DefinitelyTyped contributors, not the library's authors) and installed as its own dependency, so it can drift from the real library's version. Types shipped directly inside the library's own package are maintained by the same people writing the implementation and versioned together with it, so they're generally more likely to stay accurate." },
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
      "The configuration file that controls how the TypeScript compiler behaves, and the single setting that turns on its strongest safety checks.",
    explanation: `
Every setting you've relied on so far — which files to check, which
JavaScript version to compile down to, how strict the checking should be —
has to be configured somewhere. That somewhere is a file called
\`tsconfig.json\`, placed at the root of a TypeScript project. It tells the
compiler (and your editor) which files belong to the project, where to put
the compiled output, and dozens of individual options controlling exactly
how picky the type checker should be.

Among those dozens of options, one deserves special attention: \`strict\`.
Setting \`"strict": true\` doesn't add one check — it's a single switch
that turns on a whole bundle of stricter individual settings at once
(things like requiring every variable's type to be known rather than
silently falling back to \`any\`, and requiring you to explicitly handle
the possibility that a value might be \`null\` or \`undefined\`). Most
new TypeScript projects enable it from day one, because retrofitting
strictness onto a large, already-loose codebase later is far more painful
than starting strict.
    `.trim(),
    analogy:
      "tsconfig.json is like the rulebook for a referee before a match starts — it decides which parts of the field are in play and how strictly fouls get called. `strict: true` is like telling that referee \"call every single foul, no exceptions\" instead of only stepping in for the obvious ones — it catches far more, but it also means the game gets paused more often until everyone's actually playing by the rules.",
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
          "`target` sets which JavaScript version the output is compiled to. `module` sets the module system used in the output. `outDir`/`rootDir` control where compiled files go. `include` tells the compiler which files are part of this project. `strict` turns on the full bundle of stricter checks.",
        walkthrough: [
          { code: '"target": "ES2020",', explanation: "Determines how modern the generated JavaScript syntax is allowed to be — older targets produce more compatible, but sometimes more verbose, output." },
          { code: '"strict": true,', explanation: "Enables the full set of stricter type-checking rules bundled under strict mode, rather than each one individually." },
          { code: '"include": ["src/**/*"],', explanation: "Tells the compiler exactly which files belong to this project, rather than scanning the entire filesystem." },
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
          "Without strict mode's `strictNullChecks`, `null` can silently masquerade as a `string`, leading to a runtime crash. With strict mode, TypeScript forces you to acknowledge and handle the possibility of `null` before using the value, at compile time instead of at a crash site in production.",
      },
    ],
    howItWorks: `
When you run the TypeScript compiler (or start your editor's TypeScript
integration), it looks for a \`tsconfig.json\` in the project and reads
every option under \`compilerOptions\` to decide how to behave — which
files to include, what JavaScript features to allow or compile away, and
which categories of type errors to report. \`"strict": true\` is
implemented as a shorthand that turns on a specific list of individual
flags together, including \`noImplicitAny\` (errors on variables the
compiler can't infer a type for, instead of quietly treating them as
\`any\`), \`strictNullChecks\` (treats \`null\` and \`undefined\` as
distinct from every other type, rather than assignable to anything), and
several others. Each of those flags can still be set individually if you
want strictness in some areas but not others, but \`strict\` is the
common, all-at-once starting point.
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
Without a shared configuration file, every developer and every editor
touching a project could apply different rules about what counts as a type
error, making the project's guarantees inconsistent from machine to
machine. **tsconfig.json** centralizes that decision once, for the whole
project. **strict** exists on top of that because TypeScript's individual
strictness flags were added gradually over time, for backward
compatibility — bundling them under one flag gives new projects an easy,
well-tested way to opt into the full, intended level of safety at once,
rather than having to discover and enable each flag separately.
    `.trim(),
    whenToUse: `
Enable **"strict": true** on essentially every new TypeScript project — the
extra rigor pays for itself many times over by catching real bugs (like
unhandled **null** values) at compile time. Reach into individual flags
inside **compilerOptions** (like customizing **target** for the environments
you support, or **paths** for import aliases) whenever a project's specific
needs call for it.
    `.trim(),
    whenNotToUse: `
Turning on **strict** partway through a large, long-running, loosely-typed
codebase all at once will likely surface a large number of pre-existing
errors simultaneously, which can be overwhelming. In that situation it's
often more practical to enable the individual strict flags one at a time,
fixing each category of error before moving to the next, rather than
flipping the single switch and being buried in errors immediately.
    `.trim(),
    commonMistakes: [
      "Assuming `strict: true` is just one check — it's a bundle of several distinct flags (`noImplicitAny`, `strictNullChecks`, and others), each catching a different category of mistake.",
      "Starting a brand-new project with `strict` turned off \"for now,\" intending to turn it on later — retrofitting strictness onto code already written loosely is far more work than starting strict.",
      "Not realizing that changes to `tsconfig.json` may need the editor's TypeScript server restarted to take effect, leading to confusion about why new errors aren't showing up immediately.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a minimal `tsconfig.json` for a new project targeting ES2020, with `strict` enabled and source files under `src/`." },
      { difficulty: "Medium", prompt: "Write a function that assigns `null` to a `string`-typed variable, and explain what error appears once `strictNullChecks` (part of `strict`) is enabled, and how to fix it properly." },
      { difficulty: "Hard", prompt: "List three individual flags that `strict: true` turns on, and for each one, write a short code example of a mistake it would catch that plain (non-strict) TypeScript would allow through." },
    ],
    interviewQuestions: [
      { question: "What is `tsconfig.json` for?", answer: "It's the configuration file, placed at a project's root, that controls how the TypeScript compiler behaves — which files to include, what JavaScript version to compile to, and which type-checking rules to enforce." },
      { question: "What does `\"strict\": true` actually do?", answer: "It's a shorthand that enables a whole bundle of individual stricter compiler flags at once — including noImplicitAny and strictNullChecks — rather than being a single check itself." },
      { question: "What does `strictNullChecks` specifically catch?", answer: "It stops `null` and `undefined` from being silently treated as assignable to every other type, forcing code to explicitly handle the possibility that a value might be missing before using it." },
      { question: "List the individual compiler flags that `strict: true` bundles together.", answer: "`noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`, and `useUnknownInCatchVariables` — enabling `strict` turns on all of these at once, and each can also be toggled individually." },
      { question: "What does `noImplicitAny` specifically do, separate from `strictNullChecks`?", answer: "It errors whenever the compiler can't infer a type for something (an untyped function parameter, for instance) and would otherwise silently fall back to `any`. It's about forcing every value to have some known type; it doesn't by itself change how `null`/`undefined` are treated — that's `strictNullChecks`'s job." },
      { question: "What does `strictFunctionTypes` change about how function parameter types are checked?", answer: "It makes function parameter types checked contravariantly instead of bivariantly — a function expecting a narrower parameter type can no longer be substituted where one expecting a wider parameter type is required, since that substitution could let it be called with an argument it doesn't know how to handle. Without it, some unsound parameter substitutions were allowed for backward compatibility." },
      { question: "What does `strictPropertyInitialization` require of class fields, and how does it depend on `strictNullChecks`?", answer: "It requires every class property with a non-optional, non-undefined type to be definitely assigned by the end of the constructor (or have an initializer), since an uninitialized field would silently be `undefined` at runtime despite its declared type. It only takes effect together with `strictNullChecks` — without that flag, `undefined` is already assignable to everything, so there'd be nothing to flag." },
      { question: "What does `useUnknownInCatchVariables` change about `catch` blocks?", answer: "It types a caught error as `unknown` instead of `any`. Since JavaScript lets you `throw` any value, not just `Error` objects, typing it as `unknown` forces you to narrow it (e.g. check `err instanceof Error`) before accessing any property on it, rather than letting `any` silently allow anything through unchecked." },
      { question: "What does `alwaysStrict` do, and how is it different from the other strict-family flags?", answer: "It's not a type-checking flag at all — it emits JavaScript output with a leading `\"use strict\";` and parses the input as strict-mode JS. The other flags under `strict` govern the type checker; `alwaysStrict` governs emitted code and parsing behavior, catching legacy sloppy-mode pitfalls like silent global variable creation rather than type mismatches." },
      { question: "What does `strictBindCallApply` add on top of the other strict flags?", answer: "It makes `.bind()`, `.call()`, and `.apply()` type-check the arguments passed against the original function's actual parameter types, instead of accepting anything. Without it, those three methods were typed loosely enough to let mismatched argument types through without an error." },
      { question: "A large, several-year-old codebase currently has `strict: false`. What's the recommended migration approach, rather than flipping `strict: true` directly?", answer: "Enable the individual flags one at a time — commonly starting with `noImplicitAny`, then `strictNullChecks` — fixing the errors each one surfaces before turning on the next, rather than flipping the single `strict` switch and being confronted with every category of error across the whole codebase at once." },
      { question: "Are `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` included when you turn on `strict: true`?", answer: "No — despite sounding like strictness flags, both are opt-in separately and are not part of the `strict` bundle. You have to enable each individually; enabling `strict` alone won't turn them on." },
      { question: "What does `noUncheckedIndexedAccess` do, and why isn't it part of the default `strict` bundle?", answer: "It changes indexing into an object via a string/number index signature to include `| undefined` in the result type, reflecting that the key might not actually exist at runtime. It's excluded from `strict` largely for adoption reasons — it can be very noisy on existing code that assumes every indexed key is always present, so it's left as an explicit, separate opt-in." },
      { question: "After enabling `strict: true` on an existing project, dozens of pre-existing null/undefined errors appear across files nobody's touching right now. What's a practical way to manage that without turning strict back off?", answer: "Suppress the specific pre-existing errors you're not ready to fix (e.g. a narrow `// @ts-expect-error`) while still catching new code that introduces the same class of bug — or migrate flag-by-flag instead of adopting the whole bundle in one step, so the error surface stays manageable." },
      { question: "Besides `compilerOptions`, what does the `include`/`exclude`/`files` section of `tsconfig.json` control?", answer: "Which files the compiler treats as part of the project at all — `include` (often a glob like `\"src/**/*\"`) lists what should be checked, `exclude` removes matches from that set (commonly `node_modules`, build output), and `files` lists an explicit, exact set of entry files instead of a glob. None of this affects how strict the checking is — only which files get checked." },
      { question: "What's the difference between `target` and `lib` in `compilerOptions`?", answer: "`target` controls what JavaScript syntax version the compiler emits. `lib` controls which built-in type declarations are available to check against (whether `Promise`, newer `Array` methods, or DOM types like `document` are recognized) — the two are often set together, but changing one doesn't automatically change the other." },
      { question: "A Node.js backend project that never runs in a browser still has DOM types available by default, and code referencing `document` doesn't error as expected. What setting controls this?", answer: "The `lib` option — by default it's inferred from `target` and typically includes `\"dom\"`. Explicitly setting `lib` to something like `[\"ES2020\"]` (omitting `\"dom\"`) removes the ambient DOM globals, so referencing `document` or `window` would then correctly error." },
      { question: "What does `esModuleInterop` do, and what problem does it fix?", answer: "It changes how default imports from CommonJS modules are handled, letting `import foo from \"some-cjs-package\"` work correctly even when that package has no real ES-module default export — without it, you'd often need the more awkward `import * as foo from \"...\"` to interoperate with a CommonJS module using `module.exports = ...`." },
      { question: "Why does TypeScript centralize configuration in a single `tsconfig.json` rather than letting each file specify its own compiler options?", answer: "Because type-checking guarantees are only meaningful if every file is held to the same rules — if one file could opt into looser checking than another, callers couldn't trust that a value typed as `string` in one file is really guaranteed to be a `string` once it flows into another. A single shared config keeps the project's safety guarantees consistent across every file and contributor." },
      { question: "What does `noEmitOnError` do, and why might a project want it enabled?", answer: "It stops the compiler from producing any JavaScript output at all if there are type errors, rather than emitting output anyway alongside the reported errors. Projects enable it to guarantee that code containing type errors can never accidentally get built and shipped, treating type errors as hard build failures instead of warnings." },
      { question: "Two developers run `tsc` on the same code with the same `strict: true` config and get different errors. What's a likely non-strict-related explanation?", answer: "They're likely running different TypeScript compiler versions — `tsconfig.json` controls options, not which version of `tsc` reads them, and newer compiler versions add checks or tighten inference in ways that can surface different errors on identical code and settings. Pinning TypeScript as a project dependency, rather than relying on a globally installed copy, avoids this." },
      { question: "You added a new strict flag to `tsconfig.json`, but your editor still isn't reporting the new errors it should. What's the likely fix?", answer: "The editor's TypeScript language server usually needs to be restarted (or the project reopened) to pick up a changed `tsconfig.json` — it doesn't necessarily re-read the config automatically on every save, so new compiler-option-driven errors can silently fail to appear in the editor until it's restarted, even though a fresh `tsc` run would catch them immediately." },
    ],
    prerequisites: ["declaration-files", "union-intersection-types"],
    relatedTopics: ["declaration-files", "type-narrowing"],
    keywords: ["tsconfig", "strict mode", "noImplicitAny", "strictNullChecks", "compiler options"],
  },
];
