import type { Topic } from "../../types/content";

export const javascriptIntermediateTopics: Topic[] = [
  {
    id: "arrays",
    title: "Arrays",
    level: "intermediate",
    description: "An ordered list of values, stored in a single variable.",
    explanation: `
Often you don't just have one value to track — you have many: a list of
names, scores, or products. Instead of creating a separate variable for
each one, JavaScript gives you an **array**: a single container that holds
an ordered list of values, each accessible by its position (its "index").

Indexes start at 0, so the first item is at position 0, the second at
position 1, and so on.
    `.trim(),
    analogy:
      "An array is like a row of numbered lockers. Locker 0 holds the first item, locker 1 the second, and so on. You can look inside any locker directly if you know its number.",
    examples: [
      {
        title: "Creating and using an array",
        code: `const fruits = ["apple", "banana", "cherry"];

console.log(fruits[0]); // "apple"
console.log(fruits.length); // 3

fruits.push("date"); // adds to the end
fruits.pop();        // removes the last item`,
        walkthrough: [
          { code: 'const fruits = ["apple", ...]', explanation: "Creates an array holding three strings, in order." },
          { code: "fruits[0]", explanation: 'Reads the item at index 0 — the first item, "apple".' },
          { code: "fruits.length", explanation: "Reports how many items are in the array right now." },
          { code: 'fruits.push("date");', explanation: 'Adds "date" to the end of the array.' },
          { code: "fruits.pop();", explanation: "Removes and returns the last item in the array." },
        ],
      },
      {
        title: "Looping over an array",
        code: `const scores = [10, 20, 30];

scores.forEach((score) => {
  console.log(score);
});`,
      },
    ],
    howItWorks: `
Internally, an array stores its items in order and keeps track of how many
there are (its \`length\`). Accessing \`fruits[0]\` jumps straight to the item
at position 0 without needing to check the others.
    `.trim(),
    whyItExists: `
Almost every real program deals with collections of things — a list of
users, a shopping cart, search results. Arrays give you a consistent,
built-in way to store, access, and process ordered groups of data.
    `.trim(),
    whenToUse: `
Reach for an array whenever you have more than one related value with a
natural order — a list of to-dos, a set of scores, the results of a
search. If you catch yourself naming variables \`item1\`, \`item2\`, \`item3\`,
that's a sign you want an array instead.
    `.trim(),
    whenNotToUse: `
If your values aren't really a sequence but a set of named attributes
about one thing (a person's name, age, and email), an object is a better
fit than an array. And if you need fast lookups by a unique key rather
than by position, a \`Map\` or object usually serves you better than
searching through an array.
    `.trim(),
    commonMistakes: [
      "Forgetting that array indexes start at 0, not 1.",
      "Trying to access an index that doesn't exist (returns `undefined` instead of an error).",
      "Using `for...in` on an array instead of `for...of` or `.forEach()`, which can produce unexpected results.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Create an array of 5 numbers and log the third one." },
      { difficulty: "Medium", prompt: "Use `.map()` to create a new array where every number is doubled." },
      { difficulty: "Hard", prompt: "Use `.filter()` and `.reduce()` together to sum only the even numbers in an array." },
    ],
    interviewQuestions: [
      { question: "What is an array in JavaScript?", answer: "An ordered, list-like structure that stores multiple values in a single variable, where each value is accessed by a numeric position (its index) rather than a name." },
      { question: "Why do array indexes start at 0 instead of 1?", answer: "An index isn't a count of position, it's an offset from the start of the array's internal storage — the first item is 0 elements away from the start, the second is 1 element away, and so on." },
      { question: "Does `array.length` update automatically as you add or remove items?", answer: "Yes — `length` is a live property tracked internally by the array, so it's always in sync after `push`, `pop`, `splice`, or a direct assignment like `arr[10] = \"x\"`." },
      { question: "What's the difference between `push()`/`pop()` and `unshift()`/`shift()`?", answer: "`push`/`pop` add and remove at the end; `unshift`/`shift` do the same at the beginning. Because array indexes are contiguous, adding or removing at the front means every other element has to be re-indexed, making `unshift`/`shift` slower than `push`/`pop` on large arrays." },
      { question: "What does accessing an index beyond an array's length return?", answer: "`undefined`, not an error — reading `arr[i]` is just an object-style property lookup, and a missing key resolves to `undefined` rather than throwing." },
      { question: "What's the difference between `slice()` and `splice()`?", answer: "`slice(start, end)` returns a new array copying out a range and leaves the original untouched; `splice(start, deleteCount, ...items)` mutates the original array in place, removing and/or inserting items and returning the removed ones." },
      { question: "What does this log? `const a = [1, 2, 3]; const b = a; b.push(4); console.log(a);`", answer: "`[1, 2, 3, 4]`. Arrays are reference types — `b = a` copies the reference, not the array, so `a` and `b` point at the same underlying array, and mutating one is visible through the other." },
      { question: "Why does `typeof []` return `\"object\"` instead of `\"array\"`?", answer: "JavaScript has no separate array primitive — an array is a specialized kind of object with numeric keys and an auto-updating `length`, so `typeof` reports it the same as any other object." },
      { question: "How do you reliably check whether a value is an array?", answer: "`Array.isArray(value)` — since `typeof` can't distinguish an array from a plain object, this dedicated check inspects the value's internal class instead." },
      { question: "What does this log, and why? `console.log([10, 1, 2].sort());`", answer: "`[1, 10, 2]`. Without a comparator, `sort()` converts every element to a string and compares them lexicographically, so `\"10\"` sorts before `\"2\"`. Numeric sorting needs an explicit comparator like `(a, b) => a - b`." },
      { question: "Does `.sort()` mutate the original array?", answer: "Yes — `sort()` (like `reverse()`, `splice()`, and `fill()`) reorders the elements in place and returns the same array reference, rather than producing a new one." },
      { question: "How do you copy an array without mutating the original?", answer: "Spread it into a new array literal (`[...arr]`), use `arr.slice()` with no arguments, or `Array.from(arr)` — all three build a brand-new array, but only one level deep." },
      { question: "What does this log? `const original = [{ id: 1 }]; const copy = [...original]; copy[0].id = 2; console.log(original[0].id);`", answer: "`2`. Spread only copies the array's top-level slots; the object stored at index 0 is still the same reference in both arrays, so mutating it through `copy` is visible through `original` too." },
      { question: "What happens when you set `array.length = 0`?", answer: "It truncates the array to zero elements in place — a fast way to empty an array while keeping the same reference, which matters if other code already holds onto that same array." },
      { question: "What is a 'sparse' array, and how do you accidentally create one?", answer: "An array with gaps — empty slots that aren't actually `undefined` values but simply missing indexes. Writing `[1, , 3]` or `new Array(3)` both produce one; `length` counts the gaps, but some iteration methods treat them differently from a real value." },
      { question: "What does this log? `const arr = [1, , 3]; console.log(arr.length); arr.forEach((n) => console.log(n));`", answer: "First `3` (length includes the hole), then just `1` and `3` — `forEach` (like `map` and `filter`) skips empty slots entirely rather than calling the callback with `undefined`." },
      { question: "What does the `delete` operator do to an array element, and why is it rarely what you want?", answer: "`delete arr[1]` removes the value at that index but leaves a hole — `length` stays the same and later indexes aren't shifted down. `splice(1, 1)` is almost always the operation you actually meant." },
      { question: "How does `for...in` differ from `for...of` when looping over an array?", answer: "`for...in` iterates enumerable property keys as strings — including any non-index properties someone added to the array — in no guaranteed order; `for...of` iterates the actual values in index order, which is what you almost always want for an array." },
      { question: "What does this log? `console.log([NaN].indexOf(NaN)); console.log([NaN].includes(NaN));`", answer: "`-1` then `true`. `indexOf` compares with strict equality, and `NaN !== NaN`, so it can never find it; `includes` uses the SameValueZero algorithm, which treats `NaN` as equal to itself." },
      { question: "How do you convert an array-like object, like `arguments`, into a real array?", answer: "`Array.from(arguments)` or `[...arguments]` — both build a genuine array with all the array methods, which the original array-like object (which only has indexes and `length`) doesn't have." },
      { question: "What's the difference between `Array.from()` and `Array.of()`?", answer: "`Array.from(source, mapFn?)` builds an array from an iterable or array-like value, optionally mapping each item; `Array.of(...items)` builds an array directly from its arguments, which exists specifically to sidestep the `new Array(n)` ambiguity." },
      { question: "What's confusing about `new Array(7)`?", answer: "With a single numeric argument, `Array` constructs a sparse array of length 7 with no elements, not an array containing the value `7`. `Array.of(7)` or the literal `[7]` avoid the ambiguity." },
      { question: "What's the difference between `.flat()` and `.flatMap()`?", answer: "`flat(depth)` flattens nested arrays by the given depth (default 1); `flatMap(fn)` maps every item and then flattens the result by one level in a single pass, more efficient than chaining `.map().flat()` separately." },
      { question: "How do you access the last item of an array?", answer: "Traditionally `arr[arr.length - 1]`; `arr.at(-1)` does the same thing more directly, since `.at()` accepts negative indexes counting back from the end." },
      { question: "What does this log? `function addItem(arr) { arr.push(\"new\"); } const list = [\"a\", \"b\"]; addItem(list); console.log(list);`", answer: "`[\"a\", \"b\", \"new\"]`. Arrays are passed by reference-copy — `arr` inside the function points at the same array as `list`, so a mutating method called on it is visible to the caller." },
      { question: "What does this log? `function replace(arr) { arr = [\"x\", \"y\"]; } const list = [\"a\", \"b\"]; replace(list); console.log(list);`", answer: "`[\"a\", \"b\"]`, unchanged. `arr = [\"x\", \"y\"]` only repoints the local parameter `arr` to a brand-new array — it doesn't affect what `list` points to in the caller, because the reference itself was passed by value." },
      { question: "Why does `[] === []` evaluate to `false`?", answer: "`===` on arrays (and objects) compares reference identity, not contents — two separate array literals create two separate objects in memory, even if their elements are identical." },
      { question: "How would you compare two arrays for equality by content?", answer: "There's no built-in deep-equality check. A shallow comparison is typically `a.length === b.length && a.every((v, i) => v === b[i])`; `JSON.stringify(a) === JSON.stringify(b)` works for simple data but breaks down with nested objects, `undefined`, functions, or differing key order." },
      { question: "Why are `push`/`pop` generally faster than `unshift`/`shift`?", answer: "`push`/`pop` only touch the end of the array, an O(1) operation; `unshift`/`shift` have to shift every remaining element's index up or down by one, making them O(n)." },
      { question: "What does this log, and why? `const arr = [1, 2, 3]; arr.forEach((item, i) => { if (i === 0) arr.splice(1, 1); console.log(item); });`", answer: "`1` then `3` — `2` is skipped. Removing index 1 shifts `3` down into that slot, but `forEach`'s internal counter has already moved on to index 1, which now holds a different element, effectively skipping one. Mutating an array while iterating it is a common source of subtle bugs." },
      { question: "What does this log? `const [a = 5] = [null];`", answer: "`a` is `null`, not `5` — a destructuring default only kicks in when the corresponding value is `undefined` (missing), not for other falsy values like `null`, `0`, or `\"\"`." },
      { question: "How would you remove duplicate values from an array of numbers or strings in one line?", answer: "`[...new Set(array)]` — a `Set` only ever stores unique values (using SameValueZero equality), so building one from the array and spreading it back removes duplicates without writing a manual loop." },
      { question: "When would you reach for `.find()` instead of `.filter()[0]`?", answer: "`find()` stops iterating and returns the element itself the moment it finds a match (or `undefined` if none exists); `filter()` always scans the entire array and builds a whole new array, only for you to immediately discard everything but index 0 — more work for the same result." },
      { question: "Why is chaining several array methods like `.filter().map().reduce()` sometimes worth avoiding on very large arrays?", answer: "Each chained call is a full pass over the array producing an intermediate array; combining the logic into a single `.reduce()` (or a plain loop) does the same work in one pass, trading a bit of readability for avoiding the extra intermediate allocations." },
    ],
    prerequisites: ["functions"],
    relatedTopics: ["objects", "loops", "array-methods"],
    keywords: ["array", "index", "push", "pop", "map", "filter", "reduce"],
  },
  {
    id: "objects",
    title: "Objects",
    level: "intermediate",
    description: "A collection of related values, stored as named properties.",
    explanation: `
An array is great when your data is an ordered list, but a lot of real data
isn't a list — it's a group of related details, like a person's name, age,
and email. An **object** stores values under named keys instead of numbered
positions, so you can describe something with multiple properties in one
place.
    `.trim(),
    analogy:
      "If an array is a row of numbered lockers, an object is a labeled filing cabinet — each drawer has a name on it (like \"name\" or \"age\"), and you open the one you need by its label, not its position.",
    examples: [
      {
        title: "Creating and using an object",
        code: `const user = {
  name: "Amara",
  age: 28,
  isAdmin: false,
};

console.log(user.name);      // "Amara"
console.log(user["age"]);    // 28

user.age = 29; // update a property`,
        explanation:
          "Properties can be read with dot notation (`user.name`) or bracket notation (`user[\"age\"]`), which is useful when the key is dynamic.",
        walkthrough: [
          { code: "const user = { name: ..., age: ..., isAdmin: ... };", explanation: "Creates an object with three named properties." },
          { code: "user.name", explanation: "Dot notation reads the value stored under the name key." },
          { code: 'user["age"]', explanation: "Bracket notation does the same thing, and is useful when the key is stored in a variable." },
          { code: "user.age = 29;", explanation: "Updates the existing age property to a new value." },
        ],
      },
      {
        title: "Objects with methods",
        code: `const user = {
  name: "Amara",
  greet() {
    console.log("Hi, I'm " + this.name);
  },
};

user.greet(); // "Hi, I'm Amara"`,
        explanation:
          "A function stored as a property is called a method. Inside it, `this` refers back to the object it was called on.",
      },
    ],
    howItWorks: `
An object stores each value under a key. When you write \`user.name\`,
JavaScript looks up the key \`"name"\` inside the object and returns whatever
value is stored there. Unlike arrays, there's no guaranteed numeric order —
you access things by name, not position.

One important detail: a variable holding an object doesn't hold the object
itself, it holds a **reference** — directions to where the object actually
lives. So copying that variable with \`=\` only copies the directions, not
the object: both variables end up pointing at the exact same object, and
changing one is visible through the other.
    `.trim(),
    whyItExists: `
Real-world things usually have multiple attributes at once — a product has
a name, price, and stock count; a user has an email and a role. Objects let
you group all of that related data together instead of tracking it in
several separate, disconnected variables.
    `.trim(),
    whenToUse: `
Use an object whenever you're describing one thing with several named
attributes — a user, a product, a settings config. If you'd naturally
answer "what properties does it have?" rather than "what position is it
at?", it's an object.
    `.trim(),
    whenNotToUse: `
If your data is really a sequence of similar items, an array (or an array
of objects) fits better than a single object with numbered-looking keys.
And for very large collections you need to search by key constantly, a
\`Map\` can be a better fit than a plain object.
    `.trim(),
    commonMistakes: [
      "Trying to access a property that doesn't exist and being surprised it returns `undefined` instead of an error.",
      "Confusing objects with arrays — using numeric indexes on an object won't work the way you expect.",
      "Forgetting that copying an object with `=` copies a reference, not a brand-new independent object.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Create an object representing a book with `title`, `author`, and `pages` properties." },
      { difficulty: "Medium", prompt: "Write a function that takes a `user` object and returns a greeting string using its `name` property." },
      { difficulty: "Hard", prompt: "Write a function that takes an array of objects (e.g. products) and returns only the ones where `inStock` is true." },
    ],
    interviewQuestions: [
      { question: "What is an object in JavaScript, and how is it different from an array?", answer: "A collection of values stored under named keys (properties) rather than numeric positions — you retrieve a value by its key, not by where it sits in a sequence, which fits data that's a set of attributes rather than an ordered list." },
      { question: "When is bracket notation required instead of dot notation?", answer: "When the key is stored in a variable (`user[key]`), computed at runtime, or isn't a valid identifier — for example `user[\"first-name\"]` can't be written as `user.first-name`, since that would parse as subtraction." },
      { question: "How do you check whether a key exists on an object?", answer: "`\"name\" in user` checks own and inherited keys; `Object.hasOwn(user, \"name\")` checks only the object's own properties. Checking `user.name !== undefined` is unreliable, since a key can exist with the value `undefined`." },
      { question: "What does this log? `const obj = {}; console.log(\"toString\" in obj); console.log(Object.hasOwn(obj, \"toString\"));`", answer: "`true` then `false` — every object inherits `toString` from `Object.prototype`, so `in` (which checks the whole prototype chain) finds it, but `Object.hasOwn` only looks at properties defined directly on `obj` itself." },
      { question: "What do `Object.keys()`, `Object.values()`, and `Object.entries()` each return?", answer: "`Object.keys(obj)` returns an array of the object's own enumerable property names; `Object.values(obj)` returns the corresponding values; `Object.entries(obj)` returns `[key, value]` pairs, which is what you loop over with `for...of` to get both at once." },
      { question: "What does this log? `const a = {}; const b = a; b.x = 1; console.log(a.x);`", answer: "`1` — like arrays, objects are reference types. `b = a` copies the reference, so `a` and `b` point to the exact same object, and a mutation through `b` is visible through `a`." },
      { question: "Why does `{} === {}` evaluate to `false`?", answer: "`===` compares object references, not structural content — two separate object literals are two separate allocations in memory, so they're never `===` to each other even with identical properties." },
      { question: "How do you make a shallow copy of an object?", answer: "Object spread (`{ ...obj }`) or `Object.assign({}, obj)` — both copy each top-level property into a new object, but any nested object or array values are still shared references with the original." },
      { question: "What does this log? `const original = { info: { age: 20 } }; const copy = { ...original }; copy.info.age = 21; console.log(original.info.age);`", answer: "`21`. Spread only copies one level deep — `copy.info` and `original.info` are still the same nested object, so mutating it through one is visible through the other." },
      { question: "How would you actually deep-clone an object, and what are the trade-offs?", answer: "`structuredClone(obj)` handles most values (including dates, nested objects/arrays, and cycles) natively; `JSON.parse(JSON.stringify(obj))` also deep-clones but silently drops functions and `undefined` values, converts dates to strings, and throws on circular references." },
      { question: "What determines what `this` refers to inside an object method?", answer: "How the method is called, not where it's defined — calling it as `obj.method()` binds `this` to `obj` for that call; the same function called any other way (assigned to a variable, passed as a callback) gets a different `this`, or none at all." },
      { question: "What does this log? `const user = { name: \"Amara\", greet() { console.log(this.name); } }; const greet = user.greet; greet();`", answer: "`undefined` (or a `TypeError` in strict mode/modules). Assigning `user.greet` to a bare variable detaches it from `user` — called as a plain function, `this` is no longer bound to `user`, so `this.name` isn't `user.name` anymore." },
      { question: "What does this log, and why is it a common mistake? `const obj = { name: \"Amara\", greet: () => console.log(this.name) };` then calling `obj.greet()`", answer: "It logs `undefined`. Arrow functions don't have their own `this` — they capture `this` lexically from the surrounding scope where the object literal was written (typically module or global scope), never from the object they're attached to." },
      { question: "What is a computed property name, and when do you need one?", answer: "`{ [key]: value }` syntax lets you use the value of an expression as a property key when building an object literal, instead of only static, hand-typed key names — useful when the key comes from a variable or function argument." },
      { question: "What is object shorthand syntax?", answer: "When a property's key and the variable providing its value share the same name, you can write just `{ name }` instead of `{ name: name }`; method shorthand similarly lets you write `greet() {}` instead of `greet: function () {}`." },
      { question: "What does this log? `const user = {}; console.log(user.address?.city);`", answer: "`undefined`, without throwing. `?.` short-circuits the moment it hits a nullish (`null`/`undefined`) link in the chain — since `user.address` is `undefined`, the whole expression short-circuits to `undefined` instead of trying `undefined.city` and throwing." },
      { question: "What's the difference between `??` and `||` when supplying a default value?", answer: "`||` falls back whenever the left side is any falsy value (`0`, `\"\"`, `false`, `null`, `undefined`); `??` (nullish coalescing) falls back only for `null` or `undefined`, so a legitimately falsy value like `0` or `\"\"` is preserved." },
      { question: "What does `Object.freeze()` do, and what's a common misconception about it?", answer: "It prevents adding, removing, or reassigning an object's own top-level properties. The misconception is that it deep-freezes — it doesn't: nested objects inside a frozen object are completely unaffected and remain fully mutable." },
      { question: "What does this log? `const obj = Object.freeze({ a: { b: 1 } }); obj.a.b = 2; console.log(obj.a.b);`", answer: "`2`. `Object.freeze` only locks the object it's called on directly — the nested object at `obj.a` was never frozen, so its own property can still be reassigned." },
      { question: "What's the difference between declaring an object with `const` and freezing it with `Object.freeze()`?", answer: "`const` only prevents the *variable* from being reassigned to a different value — the object it points to can still be mutated freely. `Object.freeze()` is what actually stops the object's own properties from changing; the two solve different problems and are often used together." },
      { question: "What's the difference between the `in` operator/`for...in` and `Object.keys()` for checking or iterating properties?", answer: "Both `in` and `for...in` walk the entire prototype chain, so they can surface inherited properties you didn't intend to include; `Object.keys()` (and `Object.entries()`) only returns the object's own enumerable properties, which is almost always what you actually want." },
      { question: "Why can't you call `.map()` or `.filter()` directly on a plain object?", answer: "Those are array methods — a plain object has no built-in iteration protocol or index-based structure for them to operate on. To transform an object's data with array methods, convert it first with `Object.entries()`, run `.map()`/`.filter()` on the resulting pairs, then rebuild it with `Object.fromEntries()`." },
      { question: "What does this log? `const a = { x: 1, y: 2 }; const b = { y: 3, z: 4 }; console.log({ ...a, ...b });`", answer: "`{ x: 1, y: 3, z: 4 }` — when spreading multiple sources into one object literal, later properties overwrite earlier ones with the same key, so `b`'s `y` wins over `a`'s." },
      { question: "What's the difference between `Object.assign(target, source)` and `{ ...source }`?", answer: "`Object.assign` mutates and returns its first argument (`target`), copying `source`'s properties into it; object spread always produces a brand-new object, leaving every argument untouched — passing `{}` as the target to `Object.assign` is what makes it behave non-mutating, like spread." },
      { question: "How do you rename a property while destructuring it out of an object?", answer: "`const { name: userName } = user;` pulls the `name` property out but binds it to a local variable called `userName` instead — useful for avoiding naming collisions or matching a more descriptive local name." },
      { question: "What does this log? `function updateAge(person) { person.age = 30; } const p = { age: 20 }; updateAge(p); console.log(p.age);`", answer: "`30`. Objects passed as function arguments are references — `person` inside the function points to the same object as `p`, so mutating a property through it is visible to the caller, the same way it is with arrays." },
      { question: "If reassigning a function parameter to a new object doesn't affect the caller, but mutating it does, what's actually being copied when an object is passed to a function?", answer: "The reference itself is copied by value — the function gets its own copy of the *pointer* to the object, not the object. Reassigning that local pointer to something else doesn't touch the original object or the caller's variable; changing a property on the object it still points to does, because both pointers refer to the same object." },
      { question: "Why does using `JSON.stringify()` to compare two objects for equality sometimes give a false negative?", answer: "`JSON.stringify` preserves key insertion order, so two objects with the same properties added in a different order produce different strings even though they're logically equal; it also can't represent `undefined` values, functions, or symbols consistently." },
      { question: "Why does a plain object literal like `{}` already have methods such as `toString()` that you never defined?", answer: "Every plain object literal automatically inherits from `Object.prototype` unless created otherwise (e.g. `Object.create(null)`), which is why methods like `toString()` and `hasOwnProperty()` work on it even though you never wrote them yourself." },
      { question: "What's a practical use for a `Symbol` as an object property key?", answer: "A `Symbol` key is guaranteed unique and is skipped by `Object.keys()`, `for...in`, and `JSON.stringify()` — useful for attaching metadata or 'hidden' internal state to an object without risking a name collision with its regular, visible properties." },
      { question: "How would you loop over both the keys and values of an object at once?", answer: "`for (const [key, value] of Object.entries(obj)) { ... }` — `Object.entries()` turns the object into an array of `[key, value]` pairs, which `for...of` can destructure directly on each pass." },
      { question: "What happens if you try to use an object as a property key on another plain object?", answer: "The key gets coerced to a string first — since a plain object's keys are always strings (or symbols) — so any object used as a key becomes the literal string `\"[object Object]\"`, meaning different objects used as keys can silently collide into the same property. A `Map` is the right tool when you need actual objects as keys." },
      { question: "What happens if you destructure a property that doesn't exist on the object, and no default is given?", answer: "The resulting variable is simply `undefined` — destructuring a missing key behaves exactly like accessing a missing property directly (`obj.missing`), it doesn't throw." },
      { question: "Can an object property's default value in destructuring reference another property being destructured in the same pattern?", answer: "No — each default expression is evaluated independently and can only see variables already in scope outside the pattern (or earlier parameters, in a function signature); it can't reference a sibling property from the same destructuring pattern." },
    ],
    prerequisites: ["arrays"],
    relatedTopics: ["arrays", "scope", "prototypes", "destructuring-and-spread", "map-and-set", "json"],
    keywords: ["object", "property", "key", "value", "dot notation"],
  },
  {
    id: "scope",
    title: "Scope",
    level: "intermediate",
    description: "The rules that decide where a variable can be used in your code.",
    explanation: `
A variable can't always be used everywhere in your program — there are
places where a given variable simply doesn't exist as far as the code is
concerned. This area where a variable is usable is called its **scope**.

JavaScript decides scope based on where in the code a variable was
declared — this is called **lexical scope**. A variable declared inside a
function is only usable inside that function (and anything nested within
it); it disappears once the function finishes.
    `.trim(),
    analogy:
      "Think of scope like rooms in a house. Something you leave in the kitchen is only reachable while you're in the kitchen or in rooms that connect to it — it's not automatically available in every room of the house.",
    examples: [
      {
        title: "Function scope",
        code: `function greet() {
  const message = "Hello!";
  console.log(message); // works fine, "message" is in scope here
}

greet();
console.log(message); // ❌ Error: message is not defined out here`,
        walkthrough: [
          { code: "function greet() {", explanation: "Starts a new function scope." },
          { code: 'const message = "Hello!";', explanation: "message only exists inside this function's scope." },
          { code: "console.log(message);", explanation: "Works because message is in scope right here, inside greet." },
          { code: "console.log(message); // outside", explanation: "Fails — message's scope ended the moment the function finished running." },
        ],
      },
      {
        title: "Block scope with let/const",
        code: `if (true) {
  const secret = "hidden";
  console.log(secret); // works
}
console.log(secret); // ❌ Error: secret is not defined`,
      },
    ],
    howItWorks: `
When JavaScript looks up a variable, it checks the current block first,
then the block that contains it, and so on outward — this chain is called
the **scope chain**. If it reaches the outermost level without finding the
variable, it throws an error. This lookup is based entirely on where the
code was written, not on the order things happen to run in.
    `.trim(),
    diagram: `
Global scope
  └── Function scope
        └── Block scope (if/for/while)

Lookup direction: inner → outer, never outer → inner
    `.trim(),
    whyItExists: `
Without scope, every variable in a program would be visible everywhere,
which would make large programs a mess — names would collide constantly,
and it would be impossible to tell what any given piece of code depends on.
Scope keeps variables contained to where they're actually relevant.
    `.trim(),
    whenToUse: `
You're actively reasoning about scope any time you're deciding where to
declare a variable, debugging a "not defined" error, or trying to
understand why a variable inside a function isn't visible outside it.
    `.trim(),
    whenNotToUse: `
You don't need to think hard about scope for a variable used in one
small, self-contained block — it only becomes a source of confusion (and
bugs) once a program grows large enough that the same name gets reused in
multiple places.
    `.trim(),
    commonMistakes: [
      "Assuming a variable declared inside an `if` block is available outside of it.",
      "Accidentally creating a global variable by forgetting `let`/`const`/`var`.",
      "Being surprised that two functions can each have their own separate variable with the same name, with no conflict.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Declare a variable inside a function and try (and fail) to log it outside the function. Observe the error." },
      { difficulty: "Medium", prompt: "Write two functions that each declare a local variable with the same name, and show they don't interfere with each other." },
      { difficulty: "Hard", prompt: "Explain, in writing, why a variable declared with `let` inside a `for` loop is not accessible after the loop ends." },
    ],
    interviewQuestions: [
      { question: "What is scope in JavaScript?", answer: "The set of rules that determines where in your code a given variable is accessible — declared inside a function, it's usable there and in anything nested within it, but not outside." },
      { question: "What does it mean that JavaScript uses lexical scope?", answer: "A variable's accessibility is determined by where it's physically written in the source code, at the time it's defined — not by which function happens to call which, or the order code runs in at runtime." },
      { question: "What's the difference between global scope, function scope, and block scope?", answer: "Global scope is visible everywhere; function scope is limited to inside a function (and anything nested in it); block scope, introduced by `let`/`const`, is limited to the nearest enclosing `{}` — an `if`, `for`, or bare block." },
      { question: "What is the 'scope chain', and how does variable lookup use it?", answer: "When code references a variable, the engine checks the current scope first; if it's not found there, it checks the scope that contains it, and so on outward until it either finds the variable or reaches the global scope and throws a `ReferenceError`. It only ever searches outward, never inward." },
      { question: "What does this log? `const a = 1; function outer() { const a = 2; function inner() { console.log(a); } inner(); } outer();`", answer: "`2`. `inner` has no `a` of its own, so the lookup walks outward along the scope chain to `outer`'s scope, finds `a = 2` there, and stops — it never continues out to the global `a`." },
      { question: "What does this log? `console.log(x); var x = 5;`", answer: "`undefined`, not a `ReferenceError`. `var` declarations are hoisted to the top of their enclosing function (or global) scope and initialized to `undefined` immediately; only the assignment (`x = 5`) stays in place, so reading `x` before that line sees the hoisted-but-unassigned value." },
      { question: "What does this log? `console.log(y); let y = 5;`", answer: "It throws `ReferenceError: Cannot access 'y' before initialization`. `let`/`const` are hoisted too, but unlike `var` they aren't initialized to `undefined` — they sit in a 'temporal dead zone' from the top of the block until their declaration actually runs, and touching them there is an error." },
      { question: "What's the practical difference between `var` being function-scoped and `let`/`const` being block-scoped?", answer: "A `var` declared inside an `if` or `for` block leaks out and is accessible anywhere in the enclosing function; a `let`/`const` declared the same way only exists inside that specific `{}` block and disappears once it ends." },
      { question: "What does this log? `for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }`", answer: "`3`, `3`, `3`. `var` is function/global scoped, so there's only ever one `i` shared by every iteration; by the time the deferred callbacks actually run, the loop has already finished and `i` is `3`." },
      { question: "What does this log, and why does it differ from the `var` version? `for (let i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }`", answer: "`0`, `1`, `2`. `let` creates a fresh binding of `i` scoped to each loop iteration, so each closure captures a different variable holding a different value, instead of all of them sharing one." },
      { question: "What happens if you forget `let`/`const`/`var` when assigning to a new variable name inside a function?", answer: "In non-strict mode, JavaScript silently creates an accidental global variable rather than erroring — the assignment succeeds, but the variable is now visible everywhere, not just inside that function." },
      { question: "What does this log? `function foo() { bar = 5; } foo(); console.log(bar);`", answer: "`5` in non-strict, non-module code — `bar` was never declared, so the assignment creates it as a global. In strict mode or an ES module, this instead throws a `ReferenceError`, which is one reason strict mode/modules are considered a safer default." },
      { question: "What does this log? `if (true) { const secret = \"hidden\"; } console.log(secret);`", answer: "`ReferenceError: secret is not defined` — `const` (and `let`) are block-scoped, so `secret` only exists inside the `if` block's `{}` and is gone the moment execution leaves it." },
      { question: "What is variable shadowing?", answer: "Declaring a variable with the same name as one in an outer scope. Inside the inner scope, the new declaration takes over and hides (shadows) the outer one entirely, without modifying or being affected by it." },
      { question: "What does this log? `let x = \"outer\"; function show() { let x = \"inner\"; console.log(x); } show(); console.log(x);`", answer: "`\"inner\"` then `\"outer\"` — the `x` inside `show` shadows the outer `x` for the duration of the function, but the outer `x` is completely untouched once `show` returns." },
      { question: "Does an ES module's top-level scope behave like the classic global scope from a `<script>` tag?", answer: "No — each module has its own private, file-level scope. A top-level `const`/`let`/`function` in a module isn't visible in other files unless explicitly exported, unlike a classic script where top-level `var`/function declarations become properties of the shared global object." },
      { question: "What was an IIFE used for before `let`/`const` existed, and why is it less necessary now?", answer: "An Immediately Invoked Function Expression created a private function scope on demand, faking the block-scoping that `var` couldn't provide — used to keep helper variables from leaking into the global scope. `let`/`const` now give you real block scope directly, without wrapping code in a function." },
      { question: "What does this log? `(function () { var secret = \"hidden\"; })(); console.log(typeof secret);`", answer: "`\"undefined\"` — `secret` is scoped entirely to the IIFE's own function scope and ceases to exist once that function finishes running; it was never visible outside." },
      { question: "How is 'scope' different from 'execution context'?", answer: "Scope is a static property of the code — which variables a piece of code can see, fixed by where it's written. Execution context is the runtime state of a specific function call — its `this` binding, its arguments, and the variable environment created fresh for that call." },
      { question: "Does JavaScript use lexical scoping or dynamic scoping?", answer: "Lexical scoping — a function's variable scope is fixed by where the function is *defined* in the source code, and never changes based on where or how it's later *called*." },
      { question: "What does this log? `let value = \"global\"; function a() { console.log(value); } function b() { let value = \"local\"; a(); } b();`", answer: "`\"global\"`. Even though `a()` is called from inside `b`, where a *local* `value` exists, `a`'s scope was fixed when it was defined — at the top level, where it can only see the global `value`. If JavaScript used dynamic scoping, it would print `\"local\"` instead." },
      { question: "Is a caught error in a `catch` block scoped like a regular `let` declaration?", answer: "Yes — the parameter in `catch (err) { ... }` is block-scoped to that `catch` block alone, so it doesn't exist before the `catch` or after it, and doesn't collide with an outer variable of the same name." },
      { question: "What does this log? `function greet(name, greeting = \"Hello, \" + name) { console.log(greeting); } greet(\"Amara\");`", answer: "`\"Hello, Amara\"` — default parameter expressions are evaluated in their own scope that can see parameters declared before them, so `greeting`'s default can reference `name`." },
      { question: "Why does scope matter more as a codebase grows, even though a single small function rarely needs to think about it?", answer: "Without scoping, every variable name would have to be unique across the entire program to avoid collisions; scope lets the same short, obvious name (`i`, `result`, `data`) be reused safely in many unrelated functions, because each one only sees its own copy." },
      { question: "Why is it usually a bad sign to see a variable declared far from where it's used, at a broader scope than necessary?", answer: "The wider its scope, the more code can accidentally read or overwrite it, and the harder it becomes to reason about what value it holds at any given point — keeping declarations as narrowly scoped as possible limits how much code you need to check when debugging it." },
      { question: "What does this log? `console.log(typeof undeclaredVar); console.log(undeclaredVar);`", answer: "`\"undefined\"`, then a `ReferenceError`. `typeof` is specially safe on an undeclared identifier and just reports `\"undefined\"`; actually evaluating the identifier by referencing it directly throws, because it was never declared in any accessible scope." },
      { question: "What is the relationship between scope and closures?", answer: "A closure is what you get when a function is defined inside another and keeps access to that outer function's scope even after the outer function has returned — it's the scope chain persisting longer than the call that created it, rather than a separate mechanism." },
      { question: "How would you debug a `ReferenceError: x is not defined`?", answer: "Check that `x` is actually declared somewhere in a scope that contains the line where it's used — a typo in the name, a `let`/`const` declared inside a block or later in the same block (temporal dead zone), or a variable meant to be a parameter or import that was never wired up, are the usual causes." },
      { question: "Can two completely separate functions each declare a local variable with the same name without conflict?", answer: "Yes — each function call gets its own fresh scope, so a `let total` inside one function and a `let total` inside a totally unrelated function are different bindings that never interact, even though they share a name." },
      { question: "Why can't you use `const` for a traditional counting `for` loop like `for (const i = 0; i < 10; i++)`?", answer: "The loop's increment step (`i++`) reassigns `i` on every pass, and `const` forbids reassigning the variable it's bound to — so this throws a `TypeError` immediately on the first increment. `for...of` loops can use `const` because a new binding is created for each iteration rather than reassigning one." },
      { question: "Are function declarations hoisted the same way `var` is?", answer: "Further than `var` — a function declaration is hoisted with its entire definition already attached, so it can be called before the line it's written on. `var` is hoisted but only initialized to `undefined`, so calling it early would fail." },
      { question: "Does declaring the same `var` name twice in the same scope cause an error?", answer: "No — redeclaring a `var` in the same scope is simply ignored (it's treated as the same variable, keeping its current value); doing the same with `let`/`const` throws a `SyntaxError` for an illegal redeclaration." },
      { question: "What's the scope of a function's parameters relative to its body?", answer: "Parameters live in their own scope level that wraps the function body — the body can read and reassign them freely, and a `let`/`const`/`var` inside the body with the same name as a parameter shadows it within that inner scope." },
    ],
    prerequisites: ["functions"],
    relatedTopics: ["functions", "closures", "modules"],
    keywords: ["lexical scope", "block scope", "scope chain", "global"],
  },
  {
    id: "closures",
    title: "Closures",
    level: "intermediate",
    description: "A function that remembers the variables from where it was created, even after that outer code has finished running.",
    explanation: `
Normally, when a function finishes running, the variables it created are
thrown away — there's nothing left to hold onto them. But if that function
creates another function *inside* it, and hands that inner function back
out, something interesting happens: the inner function keeps access to the
outer variables, even though the outer function has already finished.

This "memory" is called a **closure**. It's not a special feature you turn
on — it happens automatically, any time a function is defined inside
another function and used outside of it.
    `.trim(),
    analogy:
      "Imagine a box that remembers what you put inside it. You seal it up and hand it to a friend. Weeks later, they can still open the box and find exactly what was placed inside — even though you're long gone.",
    examples: [
      {
        title: "A simple closure",
        code: `function makeCounter() {
  let count = 0;

  return function () {
    count = count + 1;
    return count;
  };
}

const counter = makeCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3`,
        explanation:
          "`makeCounter` finishes running immediately, but the inner function it returns still remembers and can update `count` every time it's called.",
        walkthrough: [
          { code: "function makeCounter() {", explanation: "Defines a function whose job is to build and return a counter." },
          { code: "let count = 0;", explanation: "A variable private to this one call of makeCounter." },
          { code: "return function () {", explanation: "Returns a brand-new function that closes over count." },
          { code: "count = count + 1; return count;", explanation: "Each call updates and returns the same shared count, remembered between calls." },
          { code: "const counter = makeCounter();", explanation: "Runs makeCounter once, getting back the inner function with its own private count." },
        ],
      },
      {
        title: "A private bank balance",
        code: `function makeAccount(startingBalance) {
  let balance = startingBalance;

  return {
    deposit(amount) {
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      balance -= amount;
      return balance;
    },
  };
}

const account = makeAccount(100);
account.deposit(50);   // 150
account.withdraw(30);  // 120
// there is no way to read or set "balance" directly from outside`,
        explanation:
          "This time the closure is shared by two returned functions instead of one, and `balance` is completely private — the only way to affect it is through `deposit`/`withdraw`.",
      },
    ],
    howItWorks: `
When a function is created, it keeps a hidden link to the scope it was
created in — not just the scope it's called from. So even after
\`makeCounter\` returns, the inner function still has a live connection to
the \`count\` variable, and can read and update it on every call.
    `.trim(),
    diagram: `
Function created
       ↓
Variables available
       ↓
Function returned
       ↓
Function remembers variables
       ↓
Function called later
    `.trim(),
    whyItExists: `
Closures let you create private state — data that only one function (or a
small group of functions) can access and update, without exposing it as a
global variable anyone could accidentally change. They're the foundation
for patterns like counters, caches, and event handlers with private data.
    `.trim(),
    whenToUse: `
Reach for a closure whenever you want a piece of state that only one
function (or a small group of related functions) can touch — a counter, a
cache, a toggle, a configuration value set up once and reused on every
call.
    `.trim(),
    whenNotToUse: `
If the state genuinely needs to be shared, modified from many unrelated
places, or inspected from outside, a closure's privacy works against you —
a plain object or a class is usually clearer. And don't reach for a
closure just to avoid passing one extra parameter.
    `.trim(),
    commonMistakes: [
      "Creating closures inside a loop and expecting each one to capture a different value of the loop variable when using `var` (they all share the same one — `let` fixes this).",
      "Thinking a closure copies the outer variable's value — it actually keeps a live reference, so if the value changes later, the closure sees the new value.",
      "Overusing closures for state that would be simpler as a regular object or class.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Create a counter using a closure, similar to the example above, but that can also be reset back to 0." },
      { difficulty: "Medium", prompt: "Create a private bank balance: a function that returns `deposit` and `withdraw` functions sharing one hidden `balance` variable." },
      { difficulty: "Hard", prompt: "Build a reusable closure-based utility, `once(fn)`, that only lets a given function run one time no matter how many times it's called." },
    ],
    interviewQuestions: [
      { question: "What is a closure?", answer: "A function that keeps access to the variables from the scope it was defined in, even after that outer scope has finished executing — the function carries its birthplace with it wherever it's used." },
      { question: "Mechanically, how does a closure keep a variable alive after its outer function has returned?", answer: "When a function is created, it keeps an internal link to the lexical environment (the set of variable bindings) it was defined in. As long as any function still holds that link, the engine can't garbage-collect those variables, even though the function call that created them has long finished." },
      { question: "What does this log? `function makeCounter() { let count = 0; return () => ++count; } const counter = makeCounter(); console.log(counter()); console.log(counter());`", answer: "`1` then `2` — each call to the returned function reads and updates the very same closed-over `count` variable, which persists across calls instead of resetting." },
      { question: "What does this log? `function makeCounter() { let count = 0; return () => ++count; } const a = makeCounter(); const b = makeCounter(); a(); a(); console.log(a(), b());`", answer: "`3 1` — every call to `makeCounter()` creates a brand-new, independent `count` variable and a new closure over it, so `a` and `b` never share state even though they came from the same function." },
      { question: "What does this log? `function createFns() { const fns = []; for (var i = 0; i < 3; i++) { fns.push(() => console.log(i)); } return fns; } createFns().forEach((fn) => fn());`", answer: "`3`, `3`, `3` — all three closures capture the same `var i`, which has finished looping and equals `3` by the time any of them actually runs." },
      { question: "How does swapping `var i` for `let i` change the previous example's output, and why?", answer: "It logs `0`, `1`, `2` instead — `let` gives each loop iteration its own fresh binding of `i`, so each pushed closure captures a distinct variable holding a distinct value, rather than all three sharing one." },
      { question: "Before `let` existed, how did developers fix the closure-in-a-loop problem with `var`?", answer: "By wrapping the loop body in an IIFE that took the current value as a parameter — `(function (j) { fns.push(() => console.log(j)); })(i);` — creating a new function scope, and therefore a new variable, on every iteration." },
      { question: "Does a closure capture a variable's value at the time it's created, or a live reference to the variable itself?", answer: "A live reference — the closure doesn't snapshot the value, it keeps a connection to the actual binding, so if that variable changes later, every closure over it sees the new value on its next read." },
      { question: "What does this log? `function makeGetter() { let value = \"first\"; const getter = () => value; value = \"second\"; return getter; } console.log(makeGetter()());`", answer: "`\"second\"` — the closure reads `value` live at call time, not at the moment it was defined, so the reassignment that happens before `getter` is even returned is fully visible." },
      { question: "How do closures enable private state?", answer: "A variable declared inside a function is only reachable from code with access to that function's scope. If the only way to read or change it is through functions returned from that scope (like `deposit`/`withdraw`), the variable is effectively private — nothing outside can reach it directly, unlike a property on a plain object." },
      { question: "What does this log? `function makeAccount() { let balance = 0; return { add: (n) => (balance += n), get: () => balance }; } const acc = makeAccount(); acc.add(5); acc.add(3); console.log(acc.get());`", answer: "`8` — `add` and `get` are two different functions, but they both close over the exact same `balance` variable from the single call to `makeAccount()`, so changes made through one are visible through the other." },
      { question: "What is currying, and how do closures make it work?", answer: "Currying transforms a function that takes multiple arguments into a chain of functions that each take one argument and return the next function in the chain. Each returned function closes over the arguments already supplied, so by the time the last one runs, it has access to all of them." },
      { question: "What does this log? `const add = (a) => (b) => (c) => a + b + c; console.log(add(1)(2)(3));`", answer: "`6` — each call returns a new function that closes over the argument just supplied; by the innermost call, closures over `a`, `b`, and `c` are all still reachable, so they can be added together." },
      { question: "How does memoization rely on closures?", answer: "A memoized function wraps the real computation together with a cache object captured in a closure. Every call checks that shared cache first — since the cache is a variable closed over by the returned function, it persists across calls instead of being recreated each time." },
      { question: "How do `debounce` and `throttle` use closures?", answer: "Both return a new function that closes over state that needs to persist between calls — typically a timer id or a 'last run' timestamp — so that each invocation of the wrapped function can check and update the same piece of state left behind by the previous call." },
      { question: "What does this log? `const obj = { name: \"Amara\", greetLater() { setTimeout(() => console.log(this.name), 0); } }; obj.greetLater();`", answer: "`\"Amara\"` — the arrow function has no `this` of its own, so it closes over `this` from `greetLater`'s scope the same way it would close over any other variable; since `greetLater` was called as `obj.greetLater()`, its `this` is `obj`, and the arrow function inherits that." },
      { question: "What does this log, and how does it differ from the arrow-function version? `const obj = { name: \"Amara\", greetLater() { setTimeout(function () { console.log(this.name); }, 0); } }; obj.greetLater();`", answer: "`undefined` (or a `TypeError` in strict mode). A regular `function` gets its own `this`, determined by how it's called — `setTimeout` calls it as a plain function with no receiver, so `this` isn't `obj` here, unlike the arrow function, which has no `this` of its own to override." },
      { question: "Can closures cause memory leaks, and how?", answer: "Yes — as long as a closure is reachable (say, still registered as an event listener), every variable it closes over stays alive too, even if nothing else needs them. Holding onto a closure that references a large object (cached DOM nodes, big data) longer than necessary keeps that memory from being freed." },
      { question: "Do modern JS engines keep an entire outer scope alive just because one closure references it?", answer: "Not necessarily — many engines optimize by keeping alive only the specific variables actually referenced by the inner function, not the whole enclosing scope, though this is an implementation detail and shouldn't be relied on for correctness." },
      { question: "What's the difference between 'a function has its own scope' and 'a function is a closure'?", answer: "Every function has its own scope by default — that's just normal function scoping. It only becomes meaningfully a closure when the function is used *after* the scope that created it would otherwise have been destroyed, i.e. it outlives the call that defined it." },
      { question: "Why is the module pattern (an IIFE returning an object) considered an application of closures?", answer: "The IIFE's local variables become private state, and the object it returns exposes only the specific functions meant to be public — those functions close over the private variables, giving controlled access without ever exposing the variables themselves globally." },
      { question: "If two functions are returned from the same outer function call, do they share one closure or have two separate ones?", answer: "They share access to the same single lexical environment — there's one set of outer variables, and both returned functions hold a link to it, so a change either one makes to a shared variable is visible to the other." },
      { question: "How would you fix a closure that's holding onto more memory than it needs?", answer: "Avoid capturing more from the outer scope than the inner function actually uses, set references you no longer need to `null` once you're done with them, and remove event listeners or timers (and the closures they hold) when they're no longer needed." },
      { question: "Is it possible to create a closure without ever returning the inner function?", answer: "A closure technically forms any time a nested function is defined, but it's only observably useful once that inner function is called after, or independently of, the outer function's own execution — calling it purely from inside the outer function doesn't demonstrate anything a closure gives you that plain scope wouldn't." },
      { question: "How does the `once(fn)` pattern use a closure?", answer: "It returns a wrapper function that closes over a hidden flag (and often a cached result). The first call runs `fn` and flips the flag; every subsequent call checks that same closed-over flag and skips running `fn` again, returning the cached result instead." },
      { question: "What does this log? `function once(fn) { let called = false, result; return (...args) => { if (!called) { result = fn(...args); called = true; } return result; }; } const init = once(() => { console.log(\"running\"); return 42; }); console.log(init()); console.log(init());`", answer: "`\"running\"` then `42`, then just `42` again — the second call to `init()` finds `called` already `true` (from the shared closure) and skips re-running `fn`, returning the cached `result` instead." },
      { question: "Why can't code outside a closure directly read or set the variable it closes over?", answer: "The variable was never exposed as a global or as a property on any accessible object — it only exists inside the function scope where it was declared, and the only references to it are held internally by the closures created there." },
      { question: "What's the difference between a closure and simply passing a value as a function argument on every call?", answer: "A closure lets a function 'remember' state between separate calls without the caller having to keep re-supplying it — a parameter only lives for the duration of one call and has to be passed in again every time." },
      { question: "How would you use a closure to implement a simple in-memory cache for an expensive function?", answer: "Wrap the function in a closure holding a cache object (often keyed by `JSON.stringify(args)` or a `Map`); before computing, check whether the cache already has an entry for these arguments, and only call the real function and store the result if it doesn't." },
      { question: "Why does inspecting a closure in browser devtools show a 'Closure' section in the scope panel?", answer: "It's showing you exactly the outer variables that function actually references and has retained access to — a direct, visible confirmation of which bindings from an enclosing scope the closure is keeping alive." },
      { question: "Does a closure re-create the outer function's variables every time the inner function is called, or just once?", answer: "Once — the variables are created when the outer function runs and the closure forms at that point; every subsequent call to the inner function reads and writes that same, single set of variables rather than getting a fresh copy." },
      { question: "How is a closure different from a global variable, if both let multiple functions share state?", answer: "A global variable is reachable and mutable from literally anywhere in the program; a closure's variables are only reachable through the specific functions that were created with access to them, which is what makes closures useful for encapsulation and globals a common source of bugs." },
    ],
    prerequisites: ["scope"],
    relatedTopics: ["scope", "functions", "this", "higher-order-functions"],
    keywords: ["closure", "lexical scope", "private state", "counter"],
  },
  {
    id: "array-methods",
    title: "Array Methods (forEach, map, filter, reduce...)",
    level: "intermediate",
    description: "The built-in tools for looping over, transforming, and summarizing arrays without writing manual loops.",
    explanation: `
You already know you can loop over an array with a \`for\` loop. But most of
the time, what you're doing with that loop falls into one of a few common
patterns: doing something with every item, building a new array from each
item, keeping only some items, or combining everything into a single
result. JavaScript gives you a built-in method for each of these patterns,
so you don't have to write the loop by hand every time — and anyone
reading your code recognizes the pattern from the method name alone.

The core ones you'll use constantly:

- **forEach** — run some code for every item (no new array)
- **map** — build a new array by transforming every item
- **filter** — build a new array keeping only items that pass a test
- **find** — get the first item that passes a test
- **some / every** — check if any / all items pass a test
- **reduce** — combine every item into a single value
    `.trim(),
    analogy:
      "Think of an assembly line. forEach is a worker who inspects every item and does something with it but hands nothing back. map is a worker who replaces every item with a new one. filter is a worker who only lets some items through. reduce is the worker at the very end who melts everything down into one final product.",
    examples: [
      {
        title: "forEach — run code for every item",
        code: `const fruits = ["apple", "banana", "cherry"];

fruits.forEach((fruit) => {
  console.log(fruit);
});
// logs: apple, banana, cherry`,
        explanation:
          "`forEach` runs the callback once per item and returns `undefined` — it's for side effects (like logging), not for building a new value.",
      },
      {
        title: "forEach — using the index and outer variables",
        code: `const scores = [70, 85, 90];
let total = 0;

scores.forEach((score, index) => {
  console.log(\`Test \${index + 1}: \${score}\`);
  total += score;
});

console.log("Total:", total); // 245`,
        explanation:
          "The callback also receives the index as a second argument, and can freely read and update variables from the surrounding scope — forEach itself still returns undefined either way.",
      },
      {
        title: "map — transform every item into something new",
        code: `const prices = [10, 20, 30];

const withTax = prices.map((price) => price * 1.1);
console.log(withTax); // [11, 22, 33]`,
      },
      {
        title: "filter — keep only the items that pass a test",
        code: `const ages = [12, 18, 25, 16, 30];

const adults = ages.filter((age) => age >= 18);
console.log(adults); // [18, 25, 30]`,
      },
      {
        title: "find, some, and every — testing items",
        code: `const inventory = [
  { name: "widget", stock: 0 },
  { name: "gadget", stock: 5 },
];

const outOfStock = inventory.find((item) => item.stock === 0);
console.log(outOfStock); // { name: "widget", stock: 0 }

console.log(inventory.some((item) => item.stock === 0)); // true
console.log(inventory.every((item) => item.stock > 0));  // false`,
      },
      {
        title: "reduce — combine every item into a single value",
        code: `const numbers = [1, 2, 3, 4, 5];

const total = numbers.reduce((sum, n) => sum + n, 0);
console.log(total); // 15`,
        walkthrough: [
          { code: "numbers.reduce((sum, n) => sum + n, 0)", explanation: "Starts the accumulator (sum) at 0, then adds each number to it in turn." },
          { code: "(sum, n) => sum + n", explanation: "Whatever this callback returns becomes the accumulator for the next item." },
          { code: "0", explanation: "The starting value — reduce would throw on an empty array without one." },
        ],
      },
      {
        title: "reduce — building an object (counting occurrences)",
        code: `const words = ["apple", "banana", "apple", "cherry", "banana", "apple"];

const counts = words.reduce((tally, word) => {
  tally[word] = (tally[word] || 0) + 1;
  return tally;
}, {});

console.log(counts); // { apple: 3, banana: 2, cherry: 1 }`,
        explanation:
          "reduce isn't just for sums — the accumulator can be any value, including an object you build up piece by piece.",
        walkthrough: [
          { code: "tally[word] = (tally[word] || 0) + 1;", explanation: "Reads the current count for this word (or 0 the first time), adds 1, and stores it back." },
          { code: "return tally;", explanation: "Every reduce callback must return the accumulator — even here, where it's the same object being mutated and handed back each time." },
          { code: "{}", explanation: "The starting accumulator: an empty object to build counts into." },
        ],
      },
    ],
    howItWorks: `
Every one of these methods takes a callback function and calls it once
per item, passing in the current item (and its index, and the whole
array, if you need them). What differs is what each method does with the
callback's return value: \`map\` collects it into a new array, \`filter\`
uses it as a yes/no test, \`reduce\` feeds it back in as the accumulator
for the next call, and \`forEach\` just throws it away.
    `.trim(),
    diagram: `
[1, 2, 3].map(n => n * 2)

  1 → callback(1) → 2  ┐
  2 → callback(2) → 4  ├─▶ [2, 4, 6]
  3 → callback(3) → 6  ┘
    `.trim(),
    whyItExists: `
Loops are flexible, but that flexibility is also a liability — a plain
\`for\` loop can accidentally skip items, mutate things it shouldn't, or
hide what it's really doing under a pile of bookkeeping (\`let i = 0\`,
\`i++\`...). Naming the pattern (map, filter, reduce) makes the intent of
the code obvious at a glance, and removes an entire category of
off-by-one and indexing bugs.
    `.trim(),
    whenToUse: `
Reach for these whenever you're processing an array and your goal
matches one of the patterns directly: transform every item (map), keep
some of them (filter), summarize them into one value (reduce), or just
do something with each one (forEach).
    `.trim(),
    whenNotToUse: `
If you need to stop partway through for a more complex reason than
"found it," or you need to loop over two arrays in lockstep, a plain
\`for\`/\`for...of\` loop can be clearer than forcing it into one of these
methods. And chaining many of these on a huge array does multiple full
passes over the data — sometimes a single loop doing everything in one
pass is more efficient.
    `.trim(),
    commonMistakes: [
      "Using `forEach` when you actually wanted `map` — `forEach` always returns `undefined`, so `const result = arr.forEach(...)` is a common bug.",
      "Forgetting to provide a starting value to `reduce`, which can throw or misbehave on an empty array.",
      "Assuming `filter`/`map` modify the original array — they always return a brand-new array, leaving the original untouched.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use `.map()` to turn an array of strings into an array of their lengths." },
      { difficulty: "Medium", prompt: "Use `.filter()` and `.map()` together to get the names of all users older than 18 from an array of user objects." },
      { difficulty: "Hard", prompt: "Reimplement `.map()` yourself as a function `myMap(array, callback)` using a plain `for` loop." },
    ],
    interviewQuestions: [
      { question: "What's the core difference between `map()` and `forEach()`?", answer: "`map()` collects the return value of the callback for every item into a brand-new array; `forEach()` calls the callback for its side effects and always returns `undefined`, so assigning its result to a variable is a common mistake." },
      { question: "What's the difference between `filter()` and `find()`?", answer: "`filter()` returns a new array containing every element that passes the test, even if that's zero or many; `find()` returns just the first matching element itself (not wrapped in an array), or `undefined` if nothing matches, and stops iterating as soon as it finds one." },
      { question: "How do `some()` and `every()` differ, and how do they short-circuit?", answer: "`some()` returns `true` as soon as any element passes the test (short-circuiting on the first success); `every()` returns `false` as soon as any element fails (short-circuiting on the first failure). If neither triggers early, `some` finishes as `false` and `every` finishes as `true`." },
      { question: "How does `reduce()` work?", answer: "It calls the callback once per element with an accumulator and the current element; whatever the callback returns becomes the accumulator passed into the next call, and after the last element, that final accumulator is `reduce`'s own return value." },
      { question: "What does `[].reduce((sum, n) => sum + n);` do, and why?", answer: "It throws `TypeError: Reduce of empty array with no initial value`. With no initial value, `reduce` uses the array's first element as the starting accumulator and starts calling the callback from the second — on an empty array there's no first element to start from." },
      { question: "Why does providing an initial value to `reduce()` matter even on a non-empty array?", answer: "Without one, the first callback call is skipped and the first element is used as the starting accumulator instead — which silently changes both the type the accumulator starts as and how many times the callback actually runs, which can matter if the callback has side effects or expects a specific accumulator shape." },
      { question: "Which common array methods mutate the array in place, and which don't?", answer: "Mutating: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`. Non-mutating, returning a new array or value: `map`, `filter`, `slice`, `concat`, `reduce`, `find`, `some`, `every`, `includes`." },
      { question: "What does this log? `const nums = [1, 2, 3, 4, 5]; console.log(nums.filter((n) => n % 2 === 0).map((n) => n * 10));`", answer: "`[20, 40]` — `filter` first narrows the array down to the even numbers (`[2, 4]`), and `map` then transforms just those into `[20, 40]`; each method in the chain works on the array the previous one returned." },
      { question: "What does this log, and why? `console.log([\"1\", \"2\", \"3\"].map(parseInt));`", answer: "`[1, NaN, NaN]`. `map` calls its callback with `(element, index, array)`, and `parseInt(string, radix)` treats that second argument as a radix — so it actually runs `parseInt(\"1\", 0)` (radix 0 defaults to base 10, giving `1`), `parseInt(\"2\", 1)` (radix 1 is invalid, giving `NaN`), and `parseInt(\"3\", 2)` (`\"3\"` isn't a valid binary digit, giving `NaN`)." },
      { question: "How would you fix the `array.map(parseInt)` bug?", answer: "Use `array.map(Number)` if there's no radix concern, or wrap it explicitly: `array.map((str) => parseInt(str, 10))` — either avoids accidentally passing `map`'s index argument through as `parseInt`'s radix." },
      { question: "Why doesn't this same class of bug usually show up with `array.map(String)` or `array.map(Boolean)`?", answer: "Those functions only look at their first argument and ignore any extra ones `map` passes in (index, array) — `parseInt` is the classic trap specifically because its second parameter happens to have a meaning that changes the result." },
      { question: "What does this log? `const nums = [5, 1, 4, 2, 3]; nums.sort((a, b) => b - a); console.log(nums);`", answer: "`[5, 4, 3, 2, 1]` — a comparator returning a negative number means 'a comes first', positive means 'b comes first'; `b - a` puts larger numbers first, producing descending order, and `sort` mutates `nums` directly." },
      { question: "What is `reduceRight()`, and how does it differ from `reduce()`?", answer: "It runs the same accumulator pattern as `reduce()`, but processes the array from the last element to the first instead of first to last — useful when the order of combination matters, like right-associative operations." },
      { question: "What does this log? `const orders = [{ amount: 10 }, { amount: 25 }, { amount: 5 }]; const total = orders.filter((o) => o.amount > 8).map((o) => o.amount).reduce((sum, n) => sum + n, 0); console.log(total);`", answer: "`35` — `filter` keeps the orders over 8 (`10` and `25`), `map` extracts just their `amount`s, and `reduce` sums them: `10 + 25`." },
      { question: "Can you `break` or `continue` out of a `forEach()` loop early?", answer: "No — `forEach` always runs its callback for every element with no way to stop it partway through; a `return` inside the callback only skips the rest of that one call, it doesn't end the loop. Use a plain `for`/`for...of` loop (which supports `break`) if you need to exit early." },
      { question: "What does this log? `[1, 2, 3].forEach((n) => { if (n === 2) return; console.log(n); });`", answer: "`1` then `3` — `return` inside the callback only ends that single invocation for `n === 2`, skipping its `console.log`; it does not break out of the overall `forEach` loop, which continues on to `3`." },
      { question: "What does this log? `console.log([].every((x) => x > 0)); console.log([].some((x) => x > 0));`", answer: "`true` then `false`. `every` on an empty array is vacuously true — there's no element to fail the test — while `some` is `false` because there's no element to satisfy it either." },
      { question: "Why can't `.includes()` find an object by one of its property values?", answer: "`includes()` compares each element to the search value using SameValueZero equality — for objects, that means reference identity, not structural content. To find an object by a property value, you need `find()` with a predicate, e.g. `arr.find((o) => o.id === 5)`." },
      { question: "Why should `map()` always return the same number of items as the input array?", answer: "That's the contract callers rely on — `map` is meant to transform, not filter. Returning `undefined` for some items to 'skip' them still leaves those slots in the output array (now holding `undefined`), which is a misuse; `filter` (possibly chained with `map`) is the correct tool for dropping items." },
      { question: "How would you implement your own version of `map()` using a plain loop, to understand what it's actually doing?", answer: "Create a new empty array, loop over the input with a `for` loop, call the callback with `(element, index, array)` on each pass, and push its return value into the new array — which is exactly what the built-in `map` does internally." },
      { question: "What's the difference between `Array.prototype.flat()` and `Array.prototype.flatMap()`?", answer: "`flat(depth)` just flattens an already-built nested array by the given depth; `flatMap()` runs a mapping callback and flattens the results by one level in the same pass, which is more efficient than calling `.map()` and then `.flat()` separately when the mapping itself produces nested arrays." },
      { question: "What is `Array.prototype.at()` useful for that bracket notation isn't?", answer: "`arr.at(-1)` accesses from the end using a negative index directly; bracket notation has no negative-index support (`arr[-1]` just looks up a nonexistent property named `\"-1\"` and returns `undefined`), so without `.at()` you'd need `arr[arr.length - 1]`." },
      { question: "Why might chaining `.filter().map()` be less efficient than a single `.reduce()` on a very large array?", answer: "Each chained method is a separate full pass over the array, building and discarding an intermediate array in between; a single `reduce()` (or a hand-written loop) can filter and transform in one pass, avoiding the extra intermediate allocation — a trade worth making only when the array is genuinely large and this is a measured bottleneck." },
      { question: "Does `.sort()` guarantee a stable sort — that equal elements keep their relative order?", answer: "Yes, as of the modern ECMAScript specification, `Array.prototype.sort()` is required to be stable — elements that compare as equal retain their original relative order, which matters when sorting by one key while wanting a previous ordering by another key preserved." },
      { question: "How would you count how many times each value appears in an array using `reduce()`?", answer: "Build an object accumulator, incrementing a per-value counter on each pass: `arr.reduce((tally, v) => { tally[v] = (tally[v] || 0) + 1; return tally; }, {})`." },
      { question: "What's a scenario where `.some()` is a better choice than `.filter().length > 0`?", answer: "`.some()` stops as soon as it finds one match; `.filter()` always scans the whole array and builds a full result array just to check its length, doing unnecessary work when you only care whether at least one match exists." },
    ],
    prerequisites: ["arrays", "functions"],
    relatedTopics: ["arrays", "higher-order-functions", "callbacks"],
    keywords: ["forEach", "map", "filter", "reduce", "find", "some", "every", "length", "array methods"],
  },
  {
    id: "string-methods",
    title: "String Methods",
    level: "intermediate",
    description: "The built-in tools for reading, searching, and reshaping text.",
    explanation: `
Text shows up everywhere in a program — a name, a message, a URL — and
you constantly need to answer small questions about it: how long is it?
does it contain this word? what does it look like in uppercase?
JavaScript strings come with a large set of built-in methods that answer
exactly these kinds of questions, so you rarely need to process text
character-by-character yourself.

A few you'll reach for constantly: \`length\` (a property, not a method,
but just as essential), \`slice\`, \`includes\`, \`split\`, \`trim\`, \`replace\`,
and template literals for building strings out of pieces.
    `.trim(),
    analogy:
      "If a string is a train of connected train cars, string methods are the tools a train inspector carries — one to count the cars (length), one to pull out a section (slice), one to check if a car of a certain type exists (includes), one to uncouple the whole train into individual cars (split).",
    examples: [
      {
        title: "Common string operations",
        code: `const message = "  Hello, World!  ";

console.log(message.length);            // 18 (includes the spaces)
console.log(message.trim());            // "Hello, World!"
console.log(message.includes("World")); // true
console.log(message.toLowerCase());     // "  hello, world!  "

const name = "Amara";
console.log(\`Hi, \${name}!\`);             // "Hi, Amara!" — a template literal

const parts = "2026-08-29".split("-");  // ["2026", "08", "29"]`,
        walkthrough: [
          { code: "message.length", explanation: "Counts every character, including the spaces at the start and end." },
          { code: "message.trim()", explanation: "Returns a new string with whitespace removed from both ends." },
          { code: 'message.includes("World")', explanation: 'Checks whether "World" appears anywhere inside the string.' },
          { code: "`Hi, ${name}!`", explanation: "A template literal — the ${...} slot is replaced with the value of name." },
          { code: '"2026-08-29".split("-")', explanation: 'Breaks the string into an array wherever a "-" appears.' },
        ],
      },
      {
        title: "Searching and replacing within a string",
        code: `const sentence = "The cat sat on the mat";

console.log(sentence.indexOf("cat"));         // 4
console.log(sentence.replace("cat", "dog"));  // "The dog sat on the mat"
console.log(sentence.startsWith("The"));      // true
console.log(sentence.slice(4, 7));            // "cat"`,
        explanation:
          "`indexOf` finds a position, `replace` swaps text, `startsWith` checks the beginning, and `slice` pulls out a substring by position — all without touching the original string.",
      },
    ],
    howItWorks: `
Because strings are immutable in JavaScript, every one of these methods
returns a brand-new string (or array) rather than modifying the
original — \`trim()\` doesn't change \`message\`, it hands you back a new,
trimmed copy. \`length\` is different: it's a property, not a method, so
you read it without parentheses.
    `.trim(),
    whyItExists: `
Handling text by hand — walking character by character to search or
reshape it — is slow to write and easy to get wrong. Built-in string
methods cover the overwhelming majority of everyday text tasks with one
clear, well-tested call.
    `.trim(),
    whenToUse: `
Reach for these whenever you're validating, searching, formatting, or
reshaping text — checking a username's length, confirming an email
contains "@", splitting a comma-separated list, or building a message
from variables with a template literal.
    `.trim(),
    whenNotToUse: `
For very heavy text processing — parsing a complex format, matching
flexible patterns — plain string methods can get unwieldy; that's when a
regular expression is worth reaching for instead. And building a large
string through many small concatenations in a loop is slower than
assembling an array of pieces and joining it once.
    `.trim(),
    commonMistakes: [
      "Forgetting that string methods don't mutate — `str.trim()` does nothing unless you use or store its return value.",
      "Using `+` to build long strings piece by piece inside a loop instead of a template literal or joining an array.",
      "Forgetting that `.length` counts UTF-16 code units, which can differ from the number of visible characters for some emoji and special characters.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use `.toUpperCase()` and `.length` to print a name in all caps along with its length." },
      { difficulty: "Medium", prompt: "Use `.split()` and `.join()` to reverse the order of words in a sentence." },
      { difficulty: "Hard", prompt: "Write a function that checks whether a string is a valid-looking email (contains exactly one \"@\" and at least one \".\" after it) using only string methods." },
    ],
    interviewQuestions: [
      { question: "Why do string methods like `trim()` or `toUpperCase()` never modify the original string?", answer: "Strings are immutable in JavaScript — every string method returns a brand-new string; there's no way to change the characters of an existing string value in place." },
      { question: "What does this log? `let str = \"hello\"; str.toUpperCase(); console.log(str);`", answer: "`\"hello\"`, unchanged — `toUpperCase()` returns a new uppercase string but doesn't alter `str` itself; the return value is thrown away because it was never assigned back, e.g. `str = str.toUpperCase();`." },
      { question: "What's the difference between `slice()` and `substring()` on a string?", answer: "Both extract a range, but `slice()` accepts negative indexes to count from the end of the string, while `substring()` treats a negative argument as `0` and automatically swaps the two arguments if the start is greater than the end." },
      { question: "What does this log? `const s = \"Hello, World!\"; console.log(s.slice(-6));`", answer: "`\"World!\"` — a negative index in `slice()` counts backward from the end of the string, so `-6` starts six characters before the end." },
      { question: "Are string comparisons with `includes()`, `startsWith()`, and `endsWith()` case-sensitive?", answer: "Yes, all of them compare exact character codes — `\"Hello\".includes(\"hello\")` is `false`. A case-insensitive check needs an explicit `.toLowerCase()` (or `.toUpperCase()`) on both sides first." },
      { question: "What does this log? `console.log(\"Hello\".includes(\"hello\"));`", answer: "`false` — string methods compare characters exactly as written; `\"H\"` and `\"h\"` are different code points, so nothing about `includes()` normalizes case automatically." },
      { question: "What can a template literal do that regular quoted strings can't?", answer: "It can span multiple lines without escape characters, and it can embed any JavaScript expression directly inside a `${...}` placeholder, which gets evaluated and converted to a string — replacing manual concatenation with `+`." },
      { question: "What does `String(null)` return, compared to `null + \"\"`?", answer: "Both produce `\"null\"` — explicit `String()` conversion and implicit coercion via `+` follow the same underlying string-conversion rules for primitives, unlike `JSON.stringify(null)`, which also returns `\"null\"` but for the unrelated reason of serializing the JSON value `null`." },
      { question: "What is a tagged template literal?", answer: "A function call written directly in front of a template literal — instead of interpolating automatically, the tag function receives the literal string pieces and the interpolated values as separate arguments, letting it process or escape them however it wants before building the final string." },
      { question: "What does this log, and why? `console.log(\"2\" > \"10\");`", answer: "`true`. Comparing strings with `>`/`<` is lexicographic (character by character, by Unicode code point), not numeric — the first character `\"2\"` is greater than `\"1\"`, so the comparison stops there and returns `true`, regardless of what follows." },
      { question: "What does this log? `console.log(1 + \"1\"); console.log(\"1\" + 1); console.log(1 + 1 + \"1\"); console.log(\"1\" + 1 + 1);`", answer: "`\"11\"`, `\"11\"`, `\"21\"`, `\"111\"`. `+` evaluates left to right; the moment either operand of a given `+` is a string, that operation becomes concatenation. `1 + 1 + \"1\"` adds the two numbers first (`2`), then concatenates with `\"1\"`; `\"1\" + 1 + 1` concatenates immediately at the first `+`, so every following `+` is string concatenation too." },
      { question: "What do `padStart()` and `padEnd()` do?", answer: "They pad a string to a target length by adding a given fill string at the start or end (repeated as needed) until it reaches that length — commonly used to zero-pad numbers or align text in columns." },
      { question: "What does this log? `console.log(\"5\".padStart(3, \"0\"));`", answer: "`\"005\"` — `padStart` adds copies of `\"0\"` to the front until the string reaches a total length of 3." },
      { question: "Why might `.length` not match the number of visible characters in a string?", answer: "`.length` counts UTF-16 code units, not visible characters (grapheme clusters). Characters outside the Basic Multilingual Plane — many emoji included — are represented as a pair of code units (a surrogate pair), so they count as 2 even though they display as one character." },
      { question: "What does `console.log(\"😀\".length);` log, and why isn't it `1`?", answer: "`2` — that emoji falls outside the Basic Multilingual Plane and is stored internally as a UTF-16 surrogate pair (two 16-bit code units), and `.length` counts code units, not the single visual character they represent together." },
      { question: "What's the difference between `trim()`, `trimStart()`, and `trimEnd()`?", answer: "`trim()` removes whitespace from both ends of a string; `trimStart()` removes it only from the beginning, and `trimEnd()` only from the end." },
      { question: "What does this log? `console.log(\"abc\".split(\"\"));`", answer: "`[\"a\", \"b\", \"c\"]` — splitting on an empty string separator breaks the string apart between every character, producing an array of individual characters." },
      { question: "What's the difference between `replace()` and `replaceAll()`?", answer: "`replace(search, value)` with a plain string only replaces the first match; to replace every occurrence with `replace`, you'd need a regex with the global flag. `replaceAll()` replaces every occurrence directly, even with a plain string search term." },
      { question: "What does this log? `console.log(\"cat cat cat\".replace(\"cat\", \"dog\"));`", answer: "`\"dog cat cat\"` — with a plain string (not a global regex), `replace()` stops after the first match and leaves the rest of the string untouched." },
      { question: "Why is repeatedly concatenating strings with `+=` inside a large loop considered inefficient?", answer: "Because strings are immutable, every `+=` creates an entirely new string and copies all the previous characters into it — for `n` concatenations that's roughly O(n squared) total copying. Pushing pieces into an array and calling `.join(\"\")` once at the end avoids the repeated copying." },
      { question: "Why can you safely compare two string primitives with `===`, unlike two objects?", answer: "Strings are primitive values compared by their actual content, not by reference — two variables holding the identical sequence of characters are `===`, whereas two objects (even with identical contents) are only `===` if they're literally the same object in memory." },
      { question: "What does this log? `const a = \"hi\"; const b = \"hi\"; console.log(a === b);`", answer: "`true` — string literals with the same characters are equal by value, since strings are primitives, not reference types like arrays or objects." },
      { question: "What's the difference between `charAt(i)`, `str[i]`, and `str.at(i)` for reading a character?", answer: "All three read the character at index `i` for a valid index. Out of range, `charAt` returns an empty string `\"\"`, while bracket notation and `.at()` return `undefined`; `.at()` additionally supports negative indexes to count from the end, which neither of the other two does." },
      { question: "How would you check if a string is a palindrome using only built-in string and array methods?", answer: "Split it into characters (`str.split(\"\")`), reverse that array (`.reverse()`), join it back into a string (`.join(\"\")`), and compare the result to the original — strings don't have their own `.reverse()`, so this detour through an array is the standard approach." },
      { question: "What does `split(separator, limit)`'s second argument do?", answer: "It caps how many pieces the resulting array can contain — the string is still split at every occurrence of the separator, but the array is truncated to at most `limit` entries, discarding anything past that." },
      { question: "Can `split()` take a regular expression as its separator?", answer: "Yes — splitting on a regex lets you break a string apart on a pattern rather than a fixed substring, for example splitting on any run of whitespace with `str.split(/\\s+/)`." },
      { question: "Why is the risk with using `+` to build a dynamic string versus a template literal more than just readability?", answer: "Beyond being harder to read with many pieces, `+` chains are easy to get wrong around operator precedence and type coercion — numbers sliding into unintended string concatenation, as with `1 + 1 + \"1\"` — while a template literal makes every interpolated value's boundary explicit and evaluates each `${...}` independently." },
    ],
    prerequisites: ["data-types"],
    relatedTopics: ["data-types", "array-methods"],
    keywords: ["string", "length", "slice", "split", "template literal", "includes", "trim"],
  },
  {
    id: "callbacks",
    title: "Callbacks",
    level: "intermediate",
    description: "A function you pass into another function, to be called later — often once some work finishes.",
    explanation: `
Functions are values in JavaScript, which means you can hand one function
to another as an argument. A **callback** is exactly that: a function you
pass into another function, with the expectation that it will be called
at the right moment — after a click, after a timer finishes, after every
item in an array.

You've already been using callbacks without necessarily naming them — the
function you pass to \`.map()\`, \`addEventListener()\`, or \`setTimeout()\` is
a callback.
    `.trim(),
    analogy:
      "It's like leaving a note with a restaurant host: 'Call this number when our table is ready.' You don't wait at the counter — you hand over instructions (the callback) and get on with your day, trusting it'll be used at the right moment.",
    examples: [
      {
        title: "A function that accepts a callback",
        code: `function greetUser(name, onDone) {
  const message = "Hi, " + name + "!";
  onDone(message); // calling the callback with the result
}

greetUser("Amara", (message) => {
  console.log(message); // "Hi, Amara!"
});`,
        walkthrough: [
          { code: "function greetUser(name, onDone) {", explanation: "Accepts a callback, onDone, as its second parameter." },
          { code: 'const message = "Hi, " + name + "!";', explanation: "Builds the greeting." },
          { code: "onDone(message);", explanation: "Calls the callback, handing it the result." },
          { code: 'greetUser("Amara", (message) => {...});', explanation: "Passes an arrow function as the callback, which runs once greetUser calls it." },
        ],
      },
      {
        title: "Two different callbacks for success and failure",
        code: `function checkAge(age, onAllowed, onDenied) {
  if (age >= 18) {
    onAllowed();
  } else {
    onDenied();
  }
}

checkAge(
  20,
  () => console.log("Access granted"),
  () => console.log("Access denied")
);
// logs "Access granted"`,
        explanation:
          "A function can accept more than one callback — here, exactly one of the two runs, depending on the outcome.",
      },
    ],
    howItWorks: `
Nothing special happens under the hood — a callback is just a regular
function value, stored in a parameter and called like any other
function, whenever the code inside decides to call it. The only thing
that makes it a "callback" is the role it's playing: being called back
later, by someone else's code, instead of being called directly by
yours.
    `.trim(),
    whyItExists: `
Callbacks let a function's behavior stay flexible without knowing the
details in advance — \`.map()\` doesn't know what transformation you want,
\`addEventListener\` doesn't know what should happen on click. The callback
is how you supply that missing piece.
    `.trim(),
    whenToUse: `
Use a callback whenever you want to customize what happens at a specific
point inside another function's logic — reacting to an event, running
code once per array item, or defining what should happen once an
asynchronous task finishes.
    `.trim(),
    whenNotToUse: `
If you're nesting many callbacks inside each other for a sequence of
asynchronous steps, that's exactly the pattern promises and async/await
were built to replace — reach for those instead of deeply nested
callbacks.
    `.trim(),
    commonMistakes: [
      "Confusing `callback` with `callback()` — passing the function itself, not the result of calling it.",
      "Forgetting that a callback might run asynchronously, and expecting code after it to have access to its result immediately.",
      "Nesting many callbacks inside each other, producing hard-to-read 'callback hell'.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a function `runTwice(fn)` that calls the given function twice in a row." },
      { difficulty: "Medium", prompt: "Write a function `processArray(arr, callback)` that calls callback once for every item (essentially rebuilding forEach)." },
      { difficulty: "Hard", prompt: "Write a function that takes a callback and calls it after a 1-second delay, using `setTimeout`." },
    ],
    interviewQuestions: [
      { question: "What is a callback function?", answer: "A function passed as an argument into another function, with the expectation that the receiving function will call it at the appropriate moment — after an event, after a delay, or once per item in a collection." },
      { question: "Are all callbacks asynchronous?", answer: "No — a callback just describes the role a function plays (being called by someone else's code), not when it runs. Callbacks passed to array methods like `map`/`forEach` run synchronously, immediately, during the call; callbacks passed to `setTimeout` or event listeners run later, asynchronously." },
      { question: "What does this log, in order? `console.log(\"start\"); [1, 2, 3].forEach((n) => console.log(n)); console.log(\"end\");`", answer: "`start`, `1`, `2`, `3`, `end` — `forEach`'s callback runs synchronously and completes entirely before the line after it executes; there's nothing asynchronous about it." },
      { question: "What does this log, in order? `console.log(\"start\"); setTimeout(() => console.log(\"timeout\"), 0); console.log(\"end\");`", answer: "`start`, `end`, `timeout` — even a `0`ms delay doesn't run the callback immediately; it's deferred to the event loop's task queue and only runs after all currently queued synchronous code (including `console.log(\"end\")`) has finished." },
      { question: "What is the 'error-first callback' convention?", answer: "A pattern (common in Node.js-style APIs) where a callback's first parameter is reserved for an error object (`null` if none occurred) and the actual result comes second — `(err, data) => {}` — so callers check `err` before trusting `data`, and every callback handles errors the same consistent way." },
      { question: "What is 'callback hell', and what causes it?", answer: "A pyramid of deeply nested callbacks, each one representing the next step of a sequence of asynchronous operations. It happens because each step can only run inside the previous step's callback, and error handling has to be duplicated at every level — promises and `async`/`await` exist largely to flatten this back out." },
      { question: "What's the difference between passing `fn` and `fn()` as a callback?", answer: "`fn` passes the function itself, to be called later by the receiving code; `fn()` calls it immediately and passes whatever it returns instead — a very common bug when the intent was to defer the call." },
      { question: "What does this log? `function greet() { console.log(\"hi\"); } setTimeout(greet(), 1000);`", answer: "`\"hi\"` is logged immediately, synchronously — `greet()` calls the function right there while building the arguments for `setTimeout`, and whatever it returns (`undefined`) is what actually gets scheduled, which does nothing a second later." },
      { question: "What's the bug here? `const counter = { count: 0, increment() { this.count++; } }; setTimeout(counter.increment, 0);`", answer: "Passing `counter.increment` hands over the bare function, detached from `counter` — when `setTimeout` calls it later, it's called as a plain function with no receiver, so `this` inside it isn't `counter` and `this.count++` doesn't update what you expect. Fixing it needs `.bind(counter)` or wrapping it in an arrow function: `() => counter.increment()`." },
      { question: "How do promises address the problems that deeply nested callbacks create?", answer: "A promise represents a single eventual result and lets you chain `.then()` calls at the same nesting level instead of inside one another, with errors propagating to a single `.catch()` instead of needing to be checked manually at every level." },
      { question: "How would you write a function that accepts an optional callback safely?", answer: "Check that it's actually a function before calling it — `if (typeof callback === \"function\") callback(result);` — or give the parameter a no-op default function, so calling the function without providing a callback doesn't throw." },
      { question: "What happens here? `function fetchData(callback) { const data = { id: 1 }; callback(data); } fetchData();`", answer: "It throws `TypeError: callback is not a function`. No argument was passed for `callback`, so it's `undefined` inside the function, and `undefined` can't be invoked — the function needed to guard against a missing callback before calling it." },
      { question: "Does a callback's return value always matter to the code that calls it?", answer: "It depends entirely on the caller. `Array.prototype.map`'s callback return value builds the new array, and `reduce`'s becomes the next accumulator — but a callback passed to `forEach`, `addEventListener`, or `setTimeout` has its return value completely ignored." },
      { question: "What's the difference between a 'callback' and an 'event handler'?", answer: "An event handler is really just a callback used in a specific role — a function registered to be called when a particular event (a click, a message, a timer) occurs. 'Callback' is the general term for any function handed to other code to be called later; 'event handler' names that specific use case." },
      { question: "Why does naming a callback function instead of passing it as an inline anonymous function sometimes help debugging?", answer: "A named function shows up by that name in stack traces and profiler output, and can be reused or tested independently — an anonymous inline callback just shows as `<anonymous>` in a trace, which makes tracking down which callback threw an error harder in code with many similar-looking inline callbacks." },
      { question: "If a function accepts multiple callbacks, like `onSuccess` and `onError`, what determines which one runs?", answer: "Whatever logic the function itself contains — the two callbacks are just ordinary parameters, and the function's own code decides, based on some condition it checks, which one (if any) it calls." },
    ],
    prerequisites: ["functions"],
    relatedTopics: ["higher-order-functions", "array-methods", "promises"],
    keywords: ["callback", "function as value", "callback hell"],
  },
  {
    id: "higher-order-functions",
    title: "Higher-Order Functions",
    level: "intermediate",
    description: "A function that takes another function as input, returns one as output, or both.",
    explanation: `
In JavaScript, functions are values — you can store them in variables,
put them in arrays, and pass them around just like a number or a string.
A **higher-order function** is simply a function that takes advantage of
this: it either accepts another function as a parameter, returns a
function as its result, or does both.

You've already met several: \`.map()\`, \`.filter()\`, and \`.reduce()\` are all
higher-order functions, because each one accepts a callback function as
an argument.
    `.trim(),
    analogy:
      "A higher-order function is like a manager who doesn't do the specific task themselves — they take instructions (a function) from you and apply them, or they hand you back a customized set of instructions (a function) built for a specific situation.",
    examples: [
      {
        title: "A function that returns a function",
        code: `function multiplyBy(factor) {
  return function (n) {
    return n * factor;
  };
}

const double = multiplyBy(2);
const triple = multiplyBy(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15`,
        walkthrough: [
          { code: "function multiplyBy(factor) {", explanation: "A function that will build and return another function." },
          { code: "return function (n) { return n * factor; };", explanation: "Returns a new function, customized with whatever factor was passed in." },
          { code: "const double = multiplyBy(2);", explanation: "double is now a function that always multiplies by 2." },
          { code: "double(5);", explanation: "Calls that customized function, giving 10." },
        ],
      },
      {
        title: "A function that takes a function as a parameter",
        code: `function applyTwice(fn, value) {
  return fn(fn(value));
}

const addOne = (n) => n + 1;

console.log(applyTwice(addOne, 5)); // 7 — addOne(addOne(5))`,
        explanation:
          "`applyTwice` doesn't know or care what `fn` actually does — it just applies whatever function it's given, twice. That flexibility is the whole point of accepting a function as a parameter.",
      },
    ],
    howItWorks: `
Because functions are ordinary values, returning one from another
function works exactly like returning a number or a string — the
returned function just happens to be callable, and (thanks to closures)
it remembers the variables from where it was created, like \`factor\`
above.
    `.trim(),
    whyItExists: `
Higher-order functions let you write general-purpose logic once (like
"multiply by some factor") and customize it on demand, instead of
writing a separate, nearly-identical function for every specific case.
    `.trim(),
    whenToUse: `
Reach for a higher-order function when you want to generate specialized
functions from a general pattern (like \`multiplyBy\`), or when you're
designing an API where the caller should supply custom behavior (like
\`.map()\` accepting any transformation).
    `.trim(),
    whenNotToUse: `
If a plain function with a couple of parameters would do the same job
just as clearly, wrapping it in another layer of functions-returning-
functions just adds indirection without benefit.
    `.trim(),
    commonMistakes: [
      "Confusing a higher-order function with a callback — a higher-order function is the one accepting/returning functions; a callback is the function being passed in.",
      "Forgetting to actually call the returned function — `const double = multiplyBy(2)` gives you a function, not a number.",
      "Overusing function factories for cases that don't actually need customization.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a higher-order function `add(a)` that returns a function which adds `a` to whatever number it's given." },
      { difficulty: "Medium", prompt: "Write a function `compose(f, g)` that returns a new function applying `g` then `f` to its input." },
      { difficulty: "Hard", prompt: "Write a function `debounce(fn, delay)` that returns a version of `fn` which only runs after it hasn't been called for `delay` milliseconds." },
    ],
    interviewQuestions: [
      { question: "What makes a function 'higher-order'?", answer: "It accepts another function as an argument, returns a function as its result, or both — treating functions the same way as any other value, like a number or string, rather than needing a special mechanism to work with them." },
      { question: "What's the difference between a higher-order function and a callback?", answer: "They're two ends of the same relationship: the higher-order function is the one that accepts or returns a function; the callback is the function being passed in to it. In `arr.map(fn)`, `map` is the higher-order function, and `fn` is the callback." },
      { question: "Besides array methods, what are some built-in higher-order functions?", answer: "`setTimeout`/`setInterval` (accept a function to run later), `addEventListener` (accepts a handler function), and promise methods like `.then()` (accept functions to run on resolution/rejection) are all higher-order — they take a function as one of their arguments." },
      { question: "What does this log? `function greaterThan(n) { return (m) => m > n; } const greaterThan10 = greaterThan(10); console.log(greaterThan10(15)); console.log([5, 12, 8, 20].filter(greaterThan10));`", answer: "`true` then `[12, 20]` — `greaterThan(10)` returns a specialized function that closes over `n = 10`; that returned function is then reused both standalone and as a `filter` callback." },
      { question: "What is function composition, and what does `compose(f, g)` typically mean?", answer: "Combining two (or more) functions so the output of one feeds directly into the input of the next. `compose(f, g)` conventionally means 'apply `g` first, then feed its result into `f`' — right to left — as opposed to `pipe(f, g)`, which usually runs them left to right." },
      { question: "What does this log? `const compose = (f, g) => (x) => f(g(x)); const double = (n) => n * 2; const increment = (n) => n + 1; const doubleThenIncrement = compose(increment, double); console.log(doubleThenIncrement(3));`", answer: "`7` — `compose(increment, double)` applies `double` first (`3 * 2 = 6`), then feeds that into `increment` (`6 + 1 = 7`); despite the name `doubleThenIncrement`, the order inside `compose` runs right-to-left, which is exactly what happened." },
      { question: "What is currying, and how is it different from ordinary partial application?", answer: "Currying transforms a function of several arguments into a chain of functions that each take exactly one argument. Partial application is more general — fixing some arguments ahead of time and returning a function that still takes the rest, whether one at a time or several at once." },
      { question: "What does this log? `const add = (a) => (b) => (c) => a + b + c; console.log(add(1)(2)(3));`", answer: "`6` — each call is itself a higher-order function returning the next function in the chain, closing over the argument it was just given, until the final call has all three available to add together." },
      { question: "Why do higher-order functions that return other functions rely on closures to be useful?", answer: "The returned function usually needs to remember something from the call that created it, like a fixed multiplier or a running cache. Without a closure over that outer scope, the returned function would have no way to access those values once the outer call finished." },
      { question: "What is a decorator/wrapper pattern implemented as a higher-order function?", answer: "A function that takes another function and returns a new function with extra behavior layered around it — for example, `withLogging(fn)` returning a function that logs the arguments and then calls `fn(...args)` — the original function's behavior is preserved but wrapped with logging on every call." },
      { question: "How does memoization work as a higher-order function?", answer: "`memoize(fn)` returns a new function that checks a cache (closed over between calls) for the given arguments before calling `fn` — if a cached result exists it's returned directly, otherwise `fn` runs once, its result is stored in the cache, and then returned." },
      { question: "Why are higher-order functions considered a core building block of functional programming?", answer: "Functional programming treats functions as regular, first-class values that can be composed, passed around, and generated dynamically — higher-order functions are exactly the mechanism that makes composing small, reusable functions into bigger behavior possible." },
      { question: "What's the practical difference between `return fn;` and `return fn();` inside a higher-order function?", answer: "`return fn;` hands back the function itself, to be called later by whoever receives it; `return fn();` calls it immediately and hands back its result instead — mixing these up is a common source of 'why is this a function instead of a value' (or vice versa) bugs." },
      { question: "How would you build a `debounce(fn, delay)` higher-order function?", answer: "Return a new function that, on every call, clears any previously scheduled timer (stored in a variable closed over between calls) and starts a fresh `setTimeout` to call `fn` after `delay` — so `fn` only actually runs once the calls stop coming for that long." },
      { question: "What does it mean for JavaScript to have 'first-class functions', and why does that matter for higher-order functions?", answer: "It means functions can be stored in variables, put in data structures, passed as arguments, and returned from other functions — exactly like any other value. Higher-order functions couldn't exist at all in a language where functions were treated specially and couldn't be passed around this way." },
      { question: "How would you implement a `once(fn)` higher-order function that only lets `fn` run a single time?", answer: "Close over a flag (and optionally a cached result) in the returned function; on the first call, run `fn`, store its result, and flip the flag; every call after that skips calling `fn` again and just returns the stored result." },
      { question: "Is a callback ever itself a higher-order function?", answer: "Yes, whenever the callback being passed in itself accepts or returns a function — a callback built by `greaterThan(10)` is a callback in relation to `filter`, but it's also higher-order in its own right, since those two classifications describe independent things about it." },
    ],
    prerequisites: ["callbacks", "closures"],
    relatedTopics: ["callbacks", "closures", "array-methods"],
    keywords: ["higher-order function", "function factory", "compose"],
  },
  {
    id: "destructuring-and-spread",
    title: "Destructuring & Spread/Rest",
    level: "intermediate",
    description: "Quick ways to pull values out of arrays/objects, and to expand or collect values using ...",
    explanation: `
Reading a few properties out of an object, or the first couple of items
from an array, usually meant writing \`const name = user.name; const age =
user.age;\` one line at a time. **Destructuring** lets you pull multiple
values out in a single line, matching the shape of what you're reading
from. Its close relative, the **spread/rest** operator (\`...\`), lets you
expand a collection into individual values, or collect several
individual values back into one.
    `.trim(),
    analogy:
      "Destructuring is like unpacking a delivery box by naming exactly which items you want handed to you directly, instead of carrying the whole box around. Spread is like dumping the entire contents of one box into a bigger one; rest is the opposite — sweeping up 'everything else' into a single box of leftovers.",
    examples: [
      {
        title: "Destructuring objects and arrays",
        code: `const user = { name: "Amara", age: 28, country: "Kenya" };
const { name, age } = user;
console.log(name, age); // "Amara" 28

const numbers = [10, 20, 30];
const [first, second] = numbers;
console.log(first, second); // 10 20

function greet({ name, age }) {
  console.log(\`Hi \${name}, age \${age}\`);
}
greet(user); // "Hi Amara, age 28"`,
        walkthrough: [
          { code: "const { name, age } = user;", explanation: "Pulls out just the name and age properties, matching them by key name." },
          { code: "const [first, second] = numbers;", explanation: "Pulls out array items by position instead of by name." },
          { code: "function greet({ name, age }) {...}", explanation: "Destructures directly in the parameter list, extracting exactly what the function needs." },
        ],
      },
      {
        title: "Spread and rest",
        code: `const base = { name: "Amara", age: 28 };
const withCountry = { ...base, country: "Kenya" }; // spread: expand base's properties in

function sum(...numbers) { // rest: collect all arguments into an array
  return numbers.reduce((total, n) => total + n, 0);
}
console.log(sum(1, 2, 3, 4)); // 10`,
      },
    ],
    howItWorks: `
Destructuring is really just special syntax for a series of individual
assignments, matched by object key or array position, done all at once.
Spread (\`...\` used when producing a new value) copies each
element/property out one at a time into the new array/object. Rest
(\`...\` used in a parameter list or destructuring pattern) does the
opposite — it gathers up any remaining values into a single array.
    `.trim(),
    whyItExists: `
Both features exist to remove repetitive, line-by-line extraction and
combination code. Destructuring makes "give me these specific pieces" a
single readable line; spread/rest make "combine everything" or "gather
the rest" equally short, especially common when copying objects/arrays
immutably or writing flexible functions.
    `.trim(),
    whenToUse: `
Use destructuring anytime you only need a few named pieces out of an
object or array — especially in function parameters. Use spread whenever
you want to copy or merge objects/arrays without mutating the originals.
Use rest whenever a function should accept any number of arguments, or
you want "everything else" from an object/array.
    `.trim(),
    whenNotToUse: `
Deeply nested destructuring patterns can become harder to read than a
couple of plain property accesses — don't force it if it hurts clarity.
And remember spread only makes a shallow copy — for nested objects,
those nested values are still shared references, not fully cloned.
    `.trim(),
    commonMistakes: [
      "Assuming spread makes a deep copy — it only copies one level; nested objects/arrays are still shared.",
      "Mixing up destructuring order for arrays (position-based) with objects (name-based).",
      "Forgetting that rest parameters must come last in a function's parameter list.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Destructure `name` and `email` out of a `user` object in one line." },
      { difficulty: "Medium", prompt: "Use spread to create a copy of an array with one extra item added, without mutating the original." },
      { difficulty: "Hard", prompt: "Write a function `sum(...numbers)` using rest parameters that adds any number of arguments together." },
    ],
    interviewQuestions: [
      { question: "What's the difference between destructuring an array and destructuring an object?", answer: "Array destructuring matches by position — `const [a, b] = arr` always takes the first two elements regardless of name; object destructuring matches by property name — `const { x, y } = obj` pulls out whichever keys are named, in any order." },
      { question: "What does this log? `const { count = 10 } = { count: undefined }; const { total = 10 } = { total: null }; console.log(count, total);`", answer: "`10` then `null` — a destructuring default only applies when the corresponding value is exactly `undefined` (missing or explicitly `undefined`); any other falsy value, including `null`, is used as-is." },
      { question: "How do you rename a variable while destructuring an object?", answer: "`const { name: userName } = user;` extracts the `name` property but binds it locally as `userName` instead of `name` — useful for avoiding a naming collision or for a clearer local name." },
      { question: "How does nested destructuring work?", answer: "The pattern mirrors the shape of the data being pulled apart — `const { address: { city } } = user;` reaches into `user.address` and pulls out just its `city` property, without needing an intermediate `const address = user.address;` step." },
      { question: "What does this log? `const { id, ...details } = { id: 1, name: \"Amara\", age: 28 }; console.log(id, details);`", answer: "`1` then `{ name: \"Amara\", age: 28 }` — `id` is pulled out individually, and the rest pattern (`...details`) collects every remaining property into a new object." },
      { question: "What does this log? `let a = 1, b = 2; [a, b] = [b, a]; console.log(a, b);`", answer: "`2` then `1` — the right side builds a temporary array `[b, a]` (i.e. `[2, 1]`) first, and array destructuring then assigns its elements back to `a` and `b` in order, swapping them without a manual temporary variable." },
      { question: "Why is destructuring especially useful in function parameters?", answer: "It lets a function declare exactly which named properties it needs from an object argument right in the signature — `function greet({ name, age }) {}` — making the function's dependencies visible at a glance instead of buried in `user.name`/`user.age` lookups inside the body." },
      { question: "Does spreading an object or array make a deep copy?", answer: "No — spread only copies one level. Any nested object or array inside is still the exact same reference in both the original and the copy, so mutating a nested value through the copy is visible through the original too." },
      { question: "If spread only makes a shallow copy, how would you actually deep-clone a value?", answer: "`structuredClone(value)` deep-clones most data (objects, arrays, dates, even circular references) natively; `JSON.parse(JSON.stringify(value))` is an older alternative but silently drops functions and `undefined`, and throws on circular references." },
      { question: "What does spreading an array into a function call do?", answer: "It expands the array's elements into individual arguments — `Math.max(...numbers)` calls `Math.max` with each number as its own argument, which is otherwise impossible to do with an array in one call since `Math.max` doesn't accept an array directly." },
      { question: "What does this log? `const nums = [4, 2, 9, 1]; console.log(Math.max(...nums));`", answer: "`9` — spreading `nums` passes `4, 2, 9, 1` as four separate arguments to `Math.max`, which then returns the largest of them." },
      { question: "What's the difference between rest parameters and the old `arguments` object?", answer: "A rest parameter (`function f(...args)`) collects extra arguments into a genuine array with every array method available; `arguments` is only array-like (it has indexes and `length` but no `map`/`filter`/etc.), and arrow functions don't have their own `arguments` at all, unlike rest parameters which work in any function." },
      { question: "What does this log? `function outer() { const inner = () => console.log(arguments[0]); inner(); } outer(\"hi\");`", answer: "`\"hi\"` — the arrow function `inner` has no `arguments` object of its own, so referencing `arguments` inside it looks outward along the scope chain to `outer`'s `arguments`, the same lexical lookup mechanism a closure uses for any other variable." },
      { question: "Where must a rest parameter appear in a function's parameter list?", answer: "Last — `function f(a, ...rest)` is valid, but `function f(...rest, a)` is a `SyntaxError`, because a rest parameter has to be able to greedily collect every remaining argument, which only makes sense as the final parameter." },
      { question: "How would you split an array into its first element and 'everything else' using destructuring?", answer: "`const [first, ...rest] = arr;` — `first` gets the element at index 0, and the rest pattern collects every remaining element into a new array called `rest`." },
      { question: "When merging two objects with spread, which properties win if both objects share a key?", answer: "Whichever object is spread later — `{ ...a, ...b }` lets `b`'s properties overwrite any matching keys from `a`, since each spread is applied left to right and later assignments to the same key simply replace earlier ones." },
      { question: "What's the difference between `Object.assign(target, source)` and object spread `{ ...source }`?", answer: "`Object.assign` mutates and returns its first argument, copying `source`'s properties directly into it; spread always produces a brand-new object and leaves every input completely untouched — passing `{}` as `Object.assign`'s target is what makes it behave non-destructively, like spread." },
      { question: "Can a destructuring pattern's default value reference another variable being destructured in the very same pattern?", answer: "No — each default expression can only see variables already established in an outer scope (or earlier parameters in a function signature); it can't reach across to a sibling property being destructured alongside it in the same pattern." },
    ],
    prerequisites: ["objects", "arrays"],
    relatedTopics: ["objects", "arrays", "functions"],
    keywords: ["destructuring", "spread", "rest", "..."],
  },
];
