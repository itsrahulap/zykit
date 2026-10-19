import type { Topic } from "../../types/content";

export const javascriptIntermediateTopics: Topic[] = [
  {
    id: "arrays",
    title: "Arrays",
    level: "intermediate",
    description: "An ordered list of values, stored in a single variable.",
    explanation: `
Often you have many values to track: a list of names, scores or products.
Instead of a separate variable for each, use an **array**: one container
holding an ordered list of values, each reachable by its position (its
"index").

Indexes start at 0, so the first item is at 0, the second at 1, and so on.
    `.trim(),
    analogy:
      "An array is like a row of numbered lockers. Locker 0 holds the first item, locker 1 the second, and so on. If you know the number, you can open any locker directly.",
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
          { code: "fruits[0]", explanation: 'Reads the item at index 0: the first item, "apple".' },
          { code: "fruits.length", explanation: "How many items the array has right now." },
          { code: 'fruits.push("date");', explanation: 'Adds "date" to the end.' },
          { code: "fruits.pop();", explanation: "Removes and returns the last item." },
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
An array stores its items in order and tracks how many there are (its
\`length\`). \`fruits[0]\` jumps straight to the item at position 0 without
checking the others.
    `.trim(),
    whyItExists: `
Almost every program handles collections: a list of users, a shopping cart,
search results. Arrays are the built-in way to store, access and process
ordered groups of data.
    `.trim(),
    whenToUse: `
Use an array for several related values with a natural order: to-dos,
scores, search results. If you're naming variables \`item1\`, \`item2\`,
\`item3\`, you want an array.
    `.trim(),
    whenNotToUse: `
If the values are named attributes of one thing (a person's name, age and
email), use an object. If you need fast lookups by a unique key instead of
by position, a \`Map\` or object beats searching an array.
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
      { question: "What is an array in JavaScript?", answer: "An ordered list of values in a single variable. Each value is accessed by its numeric position (index), not a name." },
      { question: "Why do array indexes start at 0 instead of 1?", answer: "An index is an offset from the start, not a count. The first item is 0 steps from the start, the second is 1 step away, and so on." },
      { question: "Does `array.length` update automatically as you add or remove items?", answer: "Yes. `length` is kept in sync after `push`, `pop`, `splice`, or a direct assignment like `arr[10] = \"x\"`." },
      { question: "What's the difference between `push()`/`pop()` and `unshift()`/`shift()`?", answer: "`push`/`pop` add and remove at the end; `unshift`/`shift` do it at the start. Changing the front means re-indexing every other element, so `unshift`/`shift` are slower on large arrays." },
      { question: "What does accessing an index beyond an array's length return?", answer: "`undefined`, not an error. `arr[i]` is a property lookup, and a missing key gives `undefined`." },
      { question: "What's the difference between `slice()` and `splice()`?", answer: "`slice(start, end)` returns a new array with a copied range and leaves the original alone. `splice(start, deleteCount, ...items)` changes the original in place, removing and/or inserting items, and returns the removed ones." },
      { question: "What does this log? `const a = [1, 2, 3]; const b = a; b.push(4); console.log(a);`", answer: "`[1, 2, 3, 4]`. `b = a` copies the reference, not the array, so both point to the same array and a change through one shows through the other." },
      { question: "Why does `typeof []` return `\"object\"` instead of `\"array\"`?", answer: "There's no separate array type. An array is a special object with numeric keys and an auto-updating `length`, so `typeof` reports `\"object\"`." },
      { question: "How do you reliably check whether a value is an array?", answer: "`Array.isArray(value)`. `typeof` can't tell an array from a plain object, but this check inspects the value's internal class." },
      { question: "What does this log, and why? `console.log([10, 1, 2].sort());`", answer: "`[1, 10, 2]`. Without a comparator, `sort()` turns elements into strings and compares them alphabetically, so `\"10\"` comes before `\"2\"`. For numbers, pass a comparator like `(a, b) => a - b`." },
      { question: "Does `.sort()` mutate the original array?", answer: "Yes. `sort()` (like `reverse()`, `splice()` and `fill()`) reorders in place and returns the same array, not a new one." },
      { question: "How do you copy an array without mutating the original?", answer: "Spread it (`[...arr]`), call `arr.slice()` with no arguments, or use `Array.from(arr)`. All three create a new array, but only one level deep." },
      { question: "What does this log? `const original = [{ id: 1 }]; const copy = [...original]; copy[0].id = 2; console.log(original[0].id);`", answer: "`2`. Spread copies only the top-level slots. Both arrays hold the same object at index 0, so changing it through `copy` shows through `original`." },
      { question: "What happens when you set `array.length = 0`?", answer: "It empties the array in place. This keeps the same reference, which matters if other code holds that array." },
      { question: "What is a 'sparse' array, and how do you accidentally create one?", answer: "An array with gaps: missing indexes, not actual `undefined` values. `[1, , 3]` and `new Array(3)` both create one. `length` counts the gaps, but some iteration methods treat them differently from real values." },
      { question: "What does this log? `const arr = [1, , 3]; console.log(arr.length); arr.forEach((n) => console.log(n));`", answer: "`3` (length counts the hole), then `1` and `3`. `forEach` (like `map` and `filter`) skips empty slots instead of passing `undefined`." },
      { question: "What does the `delete` operator do to an array element, and why is it rarely what you want?", answer: "`delete arr[1]` removes the value but leaves a hole: `length` stays the same and later items don't shift down. You almost always want `splice(1, 1)`." },
      { question: "How does `for...in` differ from `for...of` when looping over an array?", answer: "`for...in` loops over enumerable keys as strings, including any non-index properties added to the array, in no guaranteed order. `for...of` loops over the values in index order, which is almost always what you want." },
      { question: "What does this log? `console.log([NaN].indexOf(NaN)); console.log([NaN].includes(NaN));`", answer: "`-1` then `true`. `indexOf` uses strict equality and `NaN !== NaN`, so it never finds it. `includes` uses SameValueZero, which treats `NaN` as equal to itself." },
      { question: "How do you convert an array-like object, like `arguments`, into a real array?", answer: "`Array.from(arguments)` or `[...arguments]`. Both build a real array with array methods, which the array-like (just indexes and `length`) lacks." },
      { question: "What's the difference between `Array.from()` and `Array.of()`?", answer: "`Array.from(source, mapFn?)` builds an array from an iterable or array-like, optionally mapping each item. `Array.of(...items)` builds an array from its arguments, avoiding the `new Array(n)` ambiguity." },
      { question: "What's confusing about `new Array(7)`?", answer: "With one numeric argument, it creates an empty sparse array of length 7, not an array containing `7`. Use `Array.of(7)` or `[7]` instead." },
      { question: "What's the difference between `.flat()` and `.flatMap()`?", answer: "`flat(depth)` flattens nested arrays by the given depth (default 1). `flatMap(fn)` maps each item and flattens one level in a single pass, more efficient than `.map().flat()`." },
      { question: "How do you access the last item of an array?", answer: "`arr[arr.length - 1]`, or more directly `arr.at(-1)`, since `.at()` accepts negative indexes counted from the end." },
      { question: "What does this log? `function addItem(arr) { arr.push(\"new\"); } const list = [\"a\", \"b\"]; addItem(list); console.log(list);`", answer: "`[\"a\", \"b\", \"new\"]`. The function gets a copy of the reference, so `arr` points to the same array as `list`, and changes through it are visible to the caller." },
      { question: "What does this log? `function replace(arr) { arr = [\"x\", \"y\"]; } const list = [\"a\", \"b\"]; replace(list); console.log(list);`", answer: "`[\"a\", \"b\"]`, unchanged. `arr = [\"x\", \"y\"]` only points the local parameter at a new array. The reference was passed by value, so `list` is unaffected." },
      { question: "Why does `[] === []` evaluate to `false`?", answer: "`===` on arrays (and objects) compares references, not contents. Two array literals are two separate objects, even with identical elements." },
      { question: "How would you compare two arrays for equality by content?", answer: "There's no built-in deep check. A shallow one is `a.length === b.length && a.every((v, i) => v === b[i])`. `JSON.stringify(a) === JSON.stringify(b)` works for simple data but breaks with nested objects, `undefined`, functions or different key order." },
      { question: "Why are `push`/`pop` generally faster than `unshift`/`shift`?", answer: "`push`/`pop` only touch the end: O(1). `unshift`/`shift` must move every other element's index by one: O(n)." },
      { question: "What does this log, and why? `const arr = [1, 2, 3]; arr.forEach((item, i) => { if (i === 0) arr.splice(1, 1); console.log(item); });`", answer: "`1` then `3`; `2` is skipped. Removing index 1 moves `3` into that slot, and `forEach` moves on to index 1, which now holds `3`. Changing an array while looping over it is a common source of subtle bugs." },
      { question: "What does this log? `const [a = 5] = [null];`", answer: "`a` is `null`, not `5`. A destructuring default applies only when the value is `undefined`, not for other falsy values like `null`, `0` or `\"\"`." },
      { question: "How would you remove duplicate values from an array of numbers or strings in one line?", answer: "`[...new Set(array)]`. A `Set` keeps only unique values (by SameValueZero), so spreading it back gives the array without duplicates." },
      { question: "When would you reach for `.find()` instead of `.filter()[0]`?", answer: "`find()` stops at the first match and returns it (or `undefined`). `filter()` scans the whole array and builds a new one, only for you to throw away all but index 0." },
      { question: "Why is chaining several array methods like `.filter().map().reduce()` sometimes worth avoiding on very large arrays?", answer: "Each call is a full pass that creates an intermediate array. One `.reduce()` (or a plain loop) does it in a single pass, trading some readability for fewer allocations." },
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
Arrays suit ordered lists, but a lot of data is a group of related details
instead, like a person's name, age and email. An **object** stores values
under named keys instead of numbered positions, so you can describe one
thing with several properties in one place.
    `.trim(),
    analogy:
      "If an array is a row of numbered lockers, an object is a filing cabinet with labeled drawers (like \"name\" or \"age\"). You open a drawer by its label, not its position.",
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
          "Read properties with dot notation (`user.name`) or bracket notation (`user[\"age\"]`). Brackets are useful when the key is dynamic.",
        walkthrough: [
          { code: "const user = { name: ..., age: ..., isAdmin: ... };", explanation: "Creates an object with three named properties." },
          { code: "user.name", explanation: "Dot notation reads the value under the name key." },
          { code: 'user["age"]', explanation: "Bracket notation does the same, and works when the key is in a variable." },
          { code: "user.age = 29;", explanation: "Updates the age property." },
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
          "A function stored as a property is a method. Inside it, `this` refers to the object it was called on.",
      },
    ],
    howItWorks: `
An object stores each value under a key. \`user.name\` looks up the key
\`"name"\` and returns its value. Unlike arrays, there's no numeric order:
you access things by name, not position.

A variable holding an object actually holds a **reference**: directions to
where the object lives. Copying the variable with \`=\` copies only the
directions, so both variables point at the same object, and a change
through one shows through the other.
    `.trim(),
    whyItExists: `
Real things have several attributes at once: a product has a name, price
and stock count; a user has an email and a role. Objects group that data
together instead of spreading it across separate variables.
    `.trim(),
    whenToUse: `
Use an object to describe one thing with several named attributes: a user,
a product, a settings config. If you'd ask "what properties does it have?"
rather than "what position is it at?", it's an object.
    `.trim(),
    whenNotToUse: `
If your data is a sequence of similar items, use an array (or an array of
objects), not an object with numbered-looking keys. For very large
collections you search by key constantly, a \`Map\` can fit better than a
plain object.
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
      { question: "What is an object in JavaScript, and how is it different from an array?", answer: "A collection of values stored under named keys (properties) instead of numeric positions. You get a value by its key, not its place in a sequence, which suits a set of attributes rather than an ordered list." },
      { question: "When is bracket notation required instead of dot notation?", answer: "When the key is in a variable (`user[key]`), computed at runtime, or isn't a valid identifier. `user[\"first-name\"]` can't be written `user.first-name`, which would parse as subtraction." },
      { question: "How do you check whether a key exists on an object?", answer: "`\"name\" in user` checks own and inherited keys; `Object.hasOwn(user, \"name\")` checks only own properties. `user.name !== undefined` is unreliable, since a key can exist with the value `undefined`." },
      { question: "What does this log? `const obj = {}; console.log(\"toString\" in obj); console.log(Object.hasOwn(obj, \"toString\"));`", answer: "`true` then `false`. Every object inherits `toString` from `Object.prototype`, so `in` (which checks the prototype chain) finds it, but `Object.hasOwn` only checks properties on `obj` itself." },
      { question: "What do `Object.keys()`, `Object.values()`, and `Object.entries()` each return?", answer: "`Object.keys(obj)` returns the object's own enumerable property names; `Object.values(obj)` returns their values; `Object.entries(obj)` returns `[key, value]` pairs, which you loop over with `for...of` to get both." },
      { question: "What does this log? `const a = {}; const b = a; b.x = 1; console.log(a.x);`", answer: "`1`. Like arrays, objects are reference types: `b = a` copies the reference, so both point to the same object and a change through `b` shows through `a`." },
      { question: "Why does `{} === {}` evaluate to `false`?", answer: "`===` compares references, not contents. Two object literals are two separate objects, so they're never `===`, even with identical properties." },
      { question: "How do you make a shallow copy of an object?", answer: "Object spread (`{ ...obj }`) or `Object.assign({}, obj)`. Both copy top-level properties into a new object, but nested objects and arrays are still shared with the original." },
      { question: "What does this log? `const original = { info: { age: 20 } }; const copy = { ...original }; copy.info.age = 21; console.log(original.info.age);`", answer: "`21`. Spread copies one level deep, so `copy.info` and `original.info` are the same nested object." },
      { question: "How would you actually deep-clone an object, and what are the trade-offs?", answer: "`structuredClone(obj)` handles most values natively, including dates, nested objects/arrays and cycles. `JSON.parse(JSON.stringify(obj))` also deep-clones, but silently drops functions and `undefined`, turns dates into strings, and throws on circular references." },
      { question: "What determines what `this` refers to inside an object method?", answer: "How it's called, not where it's defined. `obj.method()` sets `this` to `obj` for that call. Called any other way (stored in a variable, passed as a callback), the same function gets a different `this`, or none." },
      { question: "What does this log? `const user = { name: \"Amara\", greet() { console.log(this.name); } }; const greet = user.greet; greet();`", answer: "`undefined` (or a `TypeError` in strict mode/modules). Storing `user.greet` in a plain variable detaches it from `user`, so when called as a plain function, `this` is no longer `user`." },
      { question: "What does this log, and why is it a common mistake? `const obj = { name: \"Amara\", greet: () => console.log(this.name) };` then calling `obj.greet()`", answer: "It logs `undefined`. Arrow functions have no own `this`; they take it from the scope where the object literal was written (usually module or global scope), never from the object." },
      { question: "What is a computed property name, and when do you need one?", answer: "`{ [key]: value }` uses an expression's value as a key in an object literal, instead of a fixed, typed-out name. Useful when the key comes from a variable or argument." },
      { question: "What is object shorthand syntax?", answer: "When a key and its value's variable have the same name, write `{ name }` instead of `{ name: name }`. Method shorthand lets you write `greet() {}` instead of `greet: function () {}`." },
      { question: "What does this log? `const user = {}; console.log(user.address?.city);`", answer: "`undefined`, without throwing. `?.` stops at the first `null`/`undefined` link. `user.address` is `undefined`, so the whole expression is `undefined` instead of throwing on `undefined.city`." },
      { question: "What's the difference between `??` and `||` when supplying a default value?", answer: "`||` falls back for any falsy value (`0`, `\"\"`, `false`, `null`, `undefined`). `??` (nullish coalescing) falls back only for `null` or `undefined`, so valid falsy values like `0` or `\"\"` are kept." },
      { question: "What does `Object.freeze()` do, and what's a common misconception about it?", answer: "It stops adding, removing or reassigning an object's own top-level properties. The misconception is that it freezes deeply. It doesn't: nested objects stay fully mutable." },
      { question: "What does this log? `const obj = Object.freeze({ a: { b: 1 } }); obj.a.b = 2; console.log(obj.a.b);`", answer: "`2`. `Object.freeze` only locks the object it's called on. The nested object at `obj.a` was never frozen." },
      { question: "What's the difference between declaring an object with `const` and freezing it with `Object.freeze()`?", answer: "`const` only stops the *variable* from being reassigned; the object can still be changed. `Object.freeze()` stops the object's own properties from changing. They solve different problems and are often used together." },
      { question: "What's the difference between the `in` operator/`for...in` and `Object.keys()` for checking or iterating properties?", answer: "`in` and `for...in` walk the whole prototype chain, so they can include inherited properties. `Object.keys()` (and `Object.entries()`) return only the object's own enumerable properties, which is almost always what you want." },
      { question: "Why can't you call `.map()` or `.filter()` directly on a plain object?", answer: "They're array methods, and a plain object isn't an array. Convert with `Object.entries()`, run `.map()`/`.filter()` on the pairs, then rebuild with `Object.fromEntries()`." },
      { question: "What does this log? `const a = { x: 1, y: 2 }; const b = { y: 3, z: 4 }; console.log({ ...a, ...b });`", answer: "`{ x: 1, y: 3, z: 4 }`. When spreading several objects, later keys overwrite earlier ones, so `b`'s `y` wins." },
      { question: "What's the difference between `Object.assign(target, source)` and `{ ...source }`?", answer: "`Object.assign` copies `source`'s properties into `target`, mutating and returning it. Spread always creates a new object and changes nothing. Passing `{}` as the target makes `Object.assign` non-mutating, like spread." },
      { question: "How do you rename a property while destructuring it out of an object?", answer: "`const { name: userName } = user;` takes the `name` property and stores it in a local variable `userName`. Useful to avoid name clashes or use a clearer name." },
      { question: "What does this log? `function updateAge(person) { person.age = 30; } const p = { age: 20 }; updateAge(p); console.log(p.age);`", answer: "`30`. `person` points to the same object as `p`, so changing a property through it is visible to the caller, just like with arrays." },
      { question: "If reassigning a function parameter to a new object doesn't affect the caller, but mutating it does, what's actually being copied when an object is passed to a function?", answer: "The reference, copied by value. The function gets its own copy of the *pointer*, not the object. Repointing that copy doesn't affect the caller; changing a property does, because both pointers lead to the same object." },
      { question: "Why does using `JSON.stringify()` to compare two objects for equality sometimes give a false negative?", answer: "`JSON.stringify` keeps key insertion order, so equal objects whose keys were added in a different order give different strings. It also can't represent `undefined`, functions or symbols consistently." },
      { question: "Why does a plain object literal like `{}` already have methods such as `toString()` that you never defined?", answer: "Plain objects inherit from `Object.prototype` (unless created with something like `Object.create(null)`), so methods like `toString()` and `hasOwnProperty()` are available without writing them." },
      { question: "What's a practical use for a `Symbol` as an object property key?", answer: "A `Symbol` key is unique and is skipped by `Object.keys()`, `for...in` and `JSON.stringify()`. That makes it handy for attaching metadata or \"hidden\" internal state without clashing with regular properties." },
      { question: "How would you loop over both the keys and values of an object at once?", answer: "`for (const [key, value] of Object.entries(obj)) { ... }`. `Object.entries()` gives `[key, value]` pairs, which `for...of` destructures on each pass." },
      { question: "What happens if you try to use an object as a property key on another plain object?", answer: "Plain object keys are strings (or symbols), so the object is converted to the string `\"[object Object]\"`. Different objects used as keys silently collide on the same property. Use a `Map` when you need real objects as keys." },
      { question: "What happens if you destructure a property that doesn't exist on the object, and no default is given?", answer: "The variable is `undefined`, just like reading a missing property (`obj.missing`). It doesn't throw." },
      { question: "Can an object property's default value in destructuring reference another property being destructured in the same pattern?", answer: "Yes, if that property comes earlier in the pattern. Defaults run left to right, so `const { a = 1, b = a } = {}` gives `b === 1`. Referring to a later one (`const { b = a, a = 1 } = {}`) throws a `ReferenceError`, because `a` isn't initialized yet." },
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
A variable can't be used everywhere in your program. The area where it's
usable is its **scope**.

JavaScript decides scope by where a variable is declared in the code. This
is **lexical scope**. A variable declared inside a function is only usable
in that function (and anything nested in it), and disappears when the
function finishes.
    `.trim(),
    analogy:
      "Scope is like rooms in a house. Something you leave in the kitchen is only reachable from the kitchen or rooms inside it, not from every room in the house.",
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
          { code: "console.log(message);", explanation: "Works, because message is in scope here, inside greet." },
          { code: "console.log(message); // outside", explanation: "Fails: message's scope ended when the function finished." },
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
To find a variable, JavaScript checks the current block, then the block
around it, and so on outward. This is the **scope chain**. If it reaches the
outermost level without finding the variable, it throws an error.

The lookup depends only on where the code was written, not the order it
runs in.
    `.trim(),
    diagram: `
Global scope
  └── Function scope
        └── Block scope (if/for/while)

Lookup direction: inner → outer, never outer → inner
    `.trim(),
    whyItExists: `
Without scope, every variable would be visible everywhere. In large
programs, names would collide and you couldn't tell what any piece of code
depends on. Scope keeps variables where they're relevant.
    `.trim(),
    whenToUse: `
You reason about scope when deciding where to declare a variable, debugging
a "not defined" error, or working out why a variable inside a function isn't
visible outside it.
    `.trim(),
    whenNotToUse: `
For a variable used in one small, self-contained block, scope needs little
thought. It becomes a source of confusion (and bugs) once a program is big
enough to reuse the same names in many places.
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
      { question: "What is scope in JavaScript?", answer: "The rules for where a variable can be used. A variable declared inside a function is usable there and in anything nested in it, but not outside." },
      { question: "What does it mean that JavaScript uses lexical scope?", answer: "Where a variable is visible depends on where it's written in the source, not on which function calls which or the order code runs in." },
      { question: "What's the difference between global scope, function scope, and block scope?", answer: "Global scope is visible everywhere. Function scope covers a function and anything nested in it. Block scope, from `let`/`const`, covers the nearest `{}`: an `if`, a `for` or a bare block." },
      { question: "What is the 'scope chain', and how does variable lookup use it?", answer: "The engine looks for a variable in the current scope, then the scope around it, and so on outward until it finds it, or reaches global scope and throws a `ReferenceError`. It only searches outward, never inward." },
      { question: "What does this log? `const a = 1; function outer() { const a = 2; function inner() { console.log(a); } inner(); } outer();`", answer: "`2`. `inner` has no `a`, so the lookup moves out to `outer`'s scope, finds `a = 2` and stops before reaching the global `a`." },
      { question: "What does this log? `console.log(x); var x = 5;`", answer: "`undefined`, not a `ReferenceError`. `var` is hoisted to the top of its function (or global) scope and set to `undefined`. Only the assignment `x = 5` stays in place, so reading `x` earlier gives `undefined`." },
      { question: "What does this log? `console.log(y); let y = 5;`", answer: "It throws `ReferenceError: Cannot access 'y' before initialization`. `let`/`const` are hoisted but not set to `undefined`; they're in the \"temporal dead zone\" until their declaration runs, and touching them there is an error." },
      { question: "What's the practical difference between `var` being function-scoped and `let`/`const` being block-scoped?", answer: "A `var` declared in an `if` or `for` block leaks out to the whole enclosing function. A `let`/`const` only exists inside that `{}` block." },
      { question: "What does this log? `for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }`", answer: "`3`, `3`, `3`. `var` gives one shared `i` for all iterations, and by the time the callbacks run, the loop is done and `i` is `3`." },
      { question: "What does this log, and why does it differ from the `var` version? `for (let i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }`", answer: "`0`, `1`, `2`. `let` creates a new `i` for each iteration, so each closure captures its own value." },
      { question: "What happens if you forget `let`/`const`/`var` when assigning to a new variable name inside a function?", answer: "In non-strict mode, JavaScript silently creates a global variable. The assignment works, but the variable is now visible everywhere." },
      { question: "What does this log? `function foo() { bar = 5; } foo(); console.log(bar);`", answer: "`5` in non-strict, non-module code: the undeclared assignment creates a global. In strict mode or an ES module it throws a `ReferenceError`, one reason those are a safer default." },
      { question: "What does this log? `if (true) { const secret = \"hidden\"; } console.log(secret);`", answer: "`ReferenceError: secret is not defined`. `const` (like `let`) is block-scoped, so `secret` only exists inside the `if` block." },
      { question: "What is variable shadowing?", answer: "Declaring a variable with the same name as one in an outer scope. Inside the inner scope, the new one hides (shadows) the outer one, without changing it." },
      { question: "What does this log? `let x = \"outer\"; function show() { let x = \"inner\"; console.log(x); } show(); console.log(x);`", answer: "`\"inner\"` then `\"outer\"`. The inner `x` shadows the outer one inside `show`; the outer `x` is untouched." },
      { question: "Does an ES module's top-level scope behave like the classic global scope from a `<script>` tag?", answer: "No. Each module has its own file-level scope, and its top-level `const`/`let`/`function` aren't visible to other files unless exported. In a classic script, top-level `var`/function declarations become properties of the shared global object." },
      { question: "What was an IIFE used for before `let`/`const` existed, and why is it less necessary now?", answer: "An Immediately Invoked Function Expression created a private function scope on demand, faking the block scope `var` lacked, to keep helper variables out of the global scope. `let`/`const` now give real block scope without wrapping code in a function." },
      { question: "What does this log? `(function () { var secret = \"hidden\"; })(); console.log(typeof secret);`", answer: "`\"undefined\"`. `secret` exists only inside the IIFE's function scope and was never visible outside." },
      { question: "How is 'scope' different from 'execution context'?", answer: "Scope is static: which variables code can see, fixed by where it's written. An execution context is the runtime state of one function call: its `this`, its arguments and the variables created for that call." },
      { question: "Does JavaScript use lexical scoping or dynamic scoping?", answer: "Lexical. A function's scope is fixed by where it's *defined*, never by where or how it's *called*." },
      { question: "What does this log? `let value = \"global\"; function a() { console.log(value); } function b() { let value = \"local\"; a(); } b();`", answer: "`\"global\"`. `a` is called inside `b`, but its scope was fixed where it was defined, at the top level, where only the global `value` is visible. With dynamic scoping it would print `\"local\"`." },
      { question: "Is a caught error in a `catch` block scoped like a regular `let` declaration?", answer: "Yes. The `err` in `catch (err) { ... }` exists only in that `catch` block and doesn't clash with an outer variable of the same name." },
      { question: "What does this log? `function greet(name, greeting = \"Hello, \" + name) { console.log(greeting); } greet(\"Amara\");`", answer: "`\"Hello, Amara\"`. Default parameter expressions can see parameters declared before them, so `greeting`'s default can use `name`." },
      { question: "Why does scope matter more as a codebase grows, even though a single small function rarely needs to think about it?", answer: "Without scope, every name would need to be unique across the whole program. Scope lets short, obvious names (`i`, `result`, `data`) be reused safely in unrelated functions, since each sees only its own." },
      { question: "Why is it usually a bad sign to see a variable declared far from where it's used, at a broader scope than necessary?", answer: "The wider the scope, the more code can accidentally read or overwrite it, and the harder it is to know its value at any point. Narrow scopes limit how much code you must check when debugging." },
      { question: "What does this log? `console.log(typeof undeclaredVar); console.log(undeclaredVar);`", answer: "`\"undefined\"`, then a `ReferenceError`. `typeof` is safe on undeclared names, but reading the name directly throws, since it isn't declared in any visible scope." },
      { question: "What is the relationship between scope and closures?", answer: "A closure is a function defined inside another that keeps access to the outer scope after the outer function returns. It's the scope chain outliving the call that created it, not a separate mechanism." },
      { question: "How would you debug a `ReferenceError: x is not defined`?", answer: "Check that `x` is declared in a scope that contains the line using it. Usual causes: a typo, a `let`/`const` declared inside a block or later in the same block (temporal dead zone), or a parameter or import that was never wired up." },
      { question: "Can two completely separate functions each declare a local variable with the same name without conflict?", answer: "Yes. Each call gets its own scope, so `let total` in two unrelated functions are separate variables that never interact." },
      { question: "Why can't you use `const` for a traditional counting `for` loop like `for (const i = 0; i < 10; i++)`?", answer: "`i++` reassigns `i`, which `const` forbids, so it throws a `TypeError` on the first increment. `for...of` can use `const` because each iteration gets a new binding instead of reassigning one." },
      { question: "Are function declarations hoisted the same way `var` is?", answer: "Further. A function declaration is hoisted with its whole definition, so it can be called before its line. A `var` is hoisted only as `undefined`, so calling it early would fail." },
      { question: "Does declaring the same `var` name twice in the same scope cause an error?", answer: "No. The redeclaration is ignored and the variable keeps its value. With `let`/`const` it throws a `SyntaxError`." },
      { question: "What's the scope of a function's parameters relative to its body?", answer: "Parameters have their own scope wrapping the body. The body can read and reassign them, and a `let`/`const`/`var` in the body with the same name shadows the parameter." },
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
Normally, when a function finishes, its variables are thrown away. But if
it creates a function *inside* itself and hands it back out, that inner
function keeps access to the outer variables, even after the outer function
has finished.

This "memory" is a **closure**. You don't turn it on; it happens
automatically whenever a function defined inside another is used outside
it.
    `.trim(),
    analogy:
      "Imagine sealing some items in a box and handing it to a friend. Weeks later, they can still open it and find exactly what you put inside, even though you're long gone.",
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
          "`makeCounter` finishes right away, but the function it returns still remembers `count` and updates it on every call.",
        walkthrough: [
          { code: "function makeCounter() {", explanation: "Defines a function that builds and returns a counter." },
          { code: "let count = 0;", explanation: "A variable private to this call of makeCounter." },
          { code: "return function () {", explanation: "Returns a new function that closes over count." },
          { code: "count = count + 1; return count;", explanation: "Each call updates and returns the same count, remembered between calls." },
          { code: "const counter = makeCounter();", explanation: "Runs makeCounter once and gets back the inner function, with its own private count." },
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
          "Here two returned functions share the closure, and `balance` is fully private: only `deposit`/`withdraw` can change it.",
      },
    ],
    howItWorks: `
A function keeps a hidden link to the scope it was created in, not just the
one it's called from. So after \`makeCounter\` returns, the inner function
is still connected to \`count\` and can read and update it on every call.
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
Closures create private state: data only one function (or a small group)
can read and update, instead of a global anyone could change by accident.
They power patterns like counters, caches and event handlers with private
data.
    `.trim(),
    whenToUse: `
Use a closure for state that only one function (or a few related ones)
should touch: a counter, a cache, a toggle, or a config value set once and
reused on every call.
    `.trim(),
    whenNotToUse: `
If the state must be shared, changed from many unrelated places, or
inspected from outside, a closure's privacy gets in the way; a plain object
or class is usually clearer. And don't use a closure just to avoid passing
one extra parameter.
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
      { question: "What is a closure?", answer: "A function that keeps access to the variables of the scope it was defined in, even after that scope has finished. It carries its birthplace with it wherever it's used." },
      { question: "Mechanically, how does a closure keep a variable alive after its outer function has returned?", answer: "A function keeps an internal link to the lexical environment (the variable bindings) it was defined in. While any function holds that link, the engine can't garbage-collect those variables, even though the call that created them has ended." },
      { question: "What does this log? `function makeCounter() { let count = 0; return () => ++count; } const counter = makeCounter(); console.log(counter()); console.log(counter());`", answer: "`1` then `2`. Each call updates the same closed-over `count`, which persists instead of resetting." },
      { question: "What does this log? `function makeCounter() { let count = 0; return () => ++count; } const a = makeCounter(); const b = makeCounter(); a(); a(); console.log(a(), b());`", answer: "`3 1`. Each `makeCounter()` call creates a new, independent `count` and closure, so `a` and `b` never share state." },
      { question: "What does this log? `function createFns() { const fns = []; for (var i = 0; i < 3; i++) { fns.push(() => console.log(i)); } return fns; } createFns().forEach((fn) => fn());`", answer: "`3`, `3`, `3`. All three closures share the same `var i`, which is `3` when they run." },
      { question: "How does swapping `var i` for `let i` change the previous example's output, and why?", answer: "It logs `0`, `1`, `2`. `let` gives each iteration its own `i`, so each closure captures a separate variable." },
      { question: "Before `let` existed, how did developers fix the closure-in-a-loop problem with `var`?", answer: "By wrapping the loop body in an IIFE that took the current value as a parameter: `(function (j) { fns.push(() => console.log(j)); })(i);`. This creates a new function scope, and a new variable, each iteration." },
      { question: "Does a closure capture a variable's value at the time it's created, or a live reference to the variable itself?", answer: "A live reference. The closure doesn't snapshot the value, so if the variable changes later, every closure over it sees the new value." },
      { question: "What does this log? `function makeGetter() { let value = \"first\"; const getter = () => value; value = \"second\"; return getter; } console.log(makeGetter()());`", answer: "`\"second\"`. The closure reads `value` when it's called, not when it was defined, so the later reassignment is visible." },
      { question: "How do closures enable private state?", answer: "A variable inside a function is only reachable by code with access to that scope. If the only way to read or change it is through returned functions (like `deposit`/`withdraw`), it's effectively private, unlike a property on a plain object." },
      { question: "What does this log? `function makeAccount() { let balance = 0; return { add: (n) => (balance += n), get: () => balance }; } const acc = makeAccount(); acc.add(5); acc.add(3); console.log(acc.get());`", answer: "`8`. `add` and `get` both close over the same `balance` from one `makeAccount()` call, so changes through one show through the other." },
      { question: "What is currying, and how do closures make it work?", answer: "Currying turns a multi-argument function into a chain of one-argument functions, each returning the next. Each returned function closes over the arguments already given, so the last one has access to all of them." },
      { question: "What does this log? `const add = (a) => (b) => (c) => a + b + c; console.log(add(1)(2)(3));`", answer: "`6`. Each call returns a function that closes over the argument just given, so the innermost call can still reach `a`, `b` and `c`." },
      { question: "How does memoization rely on closures?", answer: "A memoized function pairs the real computation with a cache object held in a closure. Each call checks the cache first, and because the cache is closed over, it persists across calls instead of being recreated." },
      { question: "How do `debounce` and `throttle` use closures?", answer: "Both return a function that closes over state that must persist between calls, usually a timer id or a \"last run\" timestamp. Each call checks and updates the state the previous call left behind." },
      { question: "What does this log? `const obj = { name: \"Amara\", greetLater() { setTimeout(() => console.log(this.name), 0); } }; obj.greetLater();`", answer: "`\"Amara\"`. The arrow function has no own `this`, so it closes over `greetLater`'s `this` like any other variable. `greetLater` was called as `obj.greetLater()`, so that `this` is `obj`." },
      { question: "What does this log, and how does it differ from the arrow-function version? `const obj = { name: \"Amara\", greetLater() { setTimeout(function () { console.log(this.name); }, 0); } }; obj.greetLater();`", answer: "Not `\"Amara\"`. A regular `function` gets its own `this` from how it's called, and `setTimeout` doesn't call it on `obj`. In a browser `this` is `window`, so it logs `window.name` (usually `\"\"`); in Node.js `this` is the timer object, so it logs `undefined`. The arrow version has no `this` of its own, so it uses `greetLater`'s `this`, which is `obj`." },
      { question: "Can closures cause memory leaks, and how?", answer: "Yes. While a closure is reachable (say, still registered as an event listener), every variable it closes over stays alive. A closure holding a large object (cached DOM nodes, big data) longer than needed keeps that memory from being freed." },
      { question: "Do modern JS engines keep an entire outer scope alive just because one closure references it?", answer: "Not necessarily. Many engines keep only the variables the inner function actually uses. But that's an implementation detail; don't rely on it for correctness." },
      { question: "What's the difference between 'a function has its own scope' and 'a function is a closure'?", answer: "Every function has its own scope; that's normal. It becomes a meaningful closure when it's used *after* the scope that created it would otherwise be gone, i.e. it outlives the call that defined it." },
      { question: "Why is the module pattern (an IIFE returning an object) considered an application of closures?", answer: "The IIFE's local variables become private state, and the returned object exposes only the public functions. Those functions close over the private variables, giving controlled access without exposing them globally." },
      { question: "If two functions are returned from the same outer function call, do they share one closure or have two separate ones?", answer: "They share one lexical environment: one set of outer variables, linked from both functions. A change made by either is visible to the other." },
      { question: "How would you fix a closure that's holding onto more memory than it needs?", answer: "Don't capture more of the outer scope than the inner function uses, set references you're done with to `null`, and remove event listeners or timers (and their closures) when no longer needed." },
      { question: "Is it possible to create a closure without ever returning the inner function?", answer: "Technically a closure forms whenever a nested function is defined. But it only matters once the inner function is called after, or independently of, the outer function's run. Calling it only from inside the outer function shows nothing that plain scope wouldn't." },
      { question: "How does the `once(fn)` pattern use a closure?", answer: "It returns a wrapper that closes over a hidden flag (and often a cached result). The first call runs `fn` and flips the flag; later calls see the flag, skip `fn` and return the cached result." },
      { question: "What does this log? `function once(fn) { let called = false, result; return (...args) => { if (!called) { result = fn(...args); called = true; } return result; }; } const init = once(() => { console.log(\"running\"); return 42; }); console.log(init()); console.log(init());`", answer: "`\"running\"`, `42`, then just `42`. The second `init()` finds `called` already `true` in the shared closure, skips `fn` and returns the cached `result`." },
      { question: "Why can't code outside a closure directly read or set the variable it closes over?", answer: "The variable was never exposed as a global or as a property of any reachable object. It exists only in the function scope where it was declared, and only the closures created there reference it." },
      { question: "What's the difference between a closure and simply passing a value as a function argument on every call?", answer: "A closure lets a function remember state between calls without the caller passing it again. A parameter lives only for one call and must be passed every time." },
      { question: "How would you use a closure to implement a simple in-memory cache for an expensive function?", answer: "Wrap the function in a closure holding a cache (often keyed by `JSON.stringify(args)`, or a `Map`). Before computing, check the cache for these arguments; only call the real function and store the result on a miss." },
      { question: "Why does inspecting a closure in browser devtools show a 'Closure' section in the scope panel?", answer: "It shows the outer variables the function references and keeps alive: a visible confirmation of which enclosing bindings the closure retains." },
      { question: "Does a closure re-create the outer function's variables every time the inner function is called, or just once?", answer: "Once. The variables are created when the outer function runs. Every later call to the inner function uses that same set, not a fresh copy." },
      { question: "How is a closure different from a global variable, if both let multiple functions share state?", answer: "A global can be read and changed from anywhere. A closure's variables are reachable only through the functions created with access to them. That's why closures are good for encapsulation and globals are a common source of bugs." },
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
You can loop over an array with \`for\`, but most loops follow a few
patterns: do something with every item, build a new array from each item,
keep only some items, or combine everything into one result.

JavaScript has a built-in method for each pattern, so you don't write the
loop by hand, and readers recognize the pattern from the method name.

The core ones:

- **forEach** — run some code for every item (no new array)
- **map** — build a new array by transforming every item
- **filter** — build a new array keeping only items that pass a test
- **find** — get the first item that passes a test
- **some / every** — check if any / all items pass a test
- **reduce** — combine every item into a single value
    `.trim(),
    analogy:
      "Think of an assembly line. forEach is a worker who handles every item but hands nothing back. map replaces every item with a new one. filter lets only some items through. reduce, at the end, melts everything into one final product.",
    examples: [
      {
        title: "forEach — run code for every item",
        code: `const fruits = ["apple", "banana", "cherry"];

fruits.forEach((fruit) => {
  console.log(fruit);
});
// logs: apple, banana, cherry`,
        explanation:
          "`forEach` runs the callback once per item and returns `undefined`. It's for side effects (like logging), not for building a new value.",
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
          "The callback also gets the index as a second argument, and can read and update variables from the surrounding scope. forEach still returns undefined.",
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
          { code: "numbers.reduce((sum, n) => sum + n, 0)", explanation: "Starts the accumulator (sum) at 0, then adds each number in turn." },
          { code: "(sum, n) => sum + n", explanation: "What this returns becomes the accumulator for the next item." },
          { code: "0", explanation: "The starting value. Without it, reduce throws on an empty array." },
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
          "reduce isn't just for sums. The accumulator can be any value, including an object you build up piece by piece.",
        walkthrough: [
          { code: "tally[word] = (tally[word] || 0) + 1;", explanation: "Reads this word's count (or 0 the first time), adds 1 and stores it." },
          { code: "return tally;", explanation: "A reduce callback must always return the accumulator, even when it's the same object, mutated and handed back." },
          { code: "{}", explanation: "The starting accumulator: an empty object to collect counts." },
        ],
      },
    ],
    howItWorks: `
Each method takes a callback and calls it once per item, passing the item
(plus its index and the whole array, if you need them).

They differ in what they do with the callback's return value: \`map\`
collects it into a new array, \`filter\` uses it as a yes/no test, \`reduce\`
feeds it into the next call as the accumulator, and \`forEach\` ignores it.
    `.trim(),
    diagram: `
[1, 2, 3].map(n => n * 2)

  1 → callback(1) → 2  ┐
  2 → callback(2) → 4  ├─▶ [2, 4, 6]
  3 → callback(3) → 6  ┘
    `.trim(),
    whyItExists: `
A plain \`for\` loop is flexible, but it can skip items, change things it
shouldn't, or bury its purpose under bookkeeping (\`let i = 0\`, \`i++\`...).
Naming the pattern (map, filter, reduce) makes the intent obvious and
removes a whole class of off-by-one and indexing bugs.
    `.trim(),
    whenToUse: `
Use them when your goal matches a pattern: transform every item (map), keep
some (filter), summarize into one value (reduce), or do something with each
(forEach).
    `.trim(),
    whenNotToUse: `
If you need to stop partway for a reason more complex than "found it," or
walk two arrays in lockstep, a plain \`for\`/\`for...of\` loop can be
clearer. And chaining many of these on a huge array makes several full
passes; one loop that does everything in a single pass can be faster.
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
      { question: "What's the core difference between `map()` and `forEach()`?", answer: "`map()` collects each callback's return value into a new array. `forEach()` runs the callback for side effects and always returns `undefined`, so assigning its result is a common mistake." },
      { question: "What's the difference between `filter()` and `find()`?", answer: "`filter()` returns a new array of every element that passes (zero or many). `find()` returns the first match itself (not in an array), or `undefined`, and stops as soon as it finds one." },
      { question: "How do `some()` and `every()` differ, and how do they short-circuit?", answer: "`some()` returns `true` at the first element that passes; `every()` returns `false` at the first that fails. If neither stops early, `some` ends `false` and `every` ends `true`." },
      { question: "How does `reduce()` work?", answer: "It calls the callback once per element with an accumulator and the current element. The callback's return value becomes the next accumulator, and the final accumulator is what `reduce` returns." },
      { question: "What does `[].reduce((sum, n) => sum + n);` do, and why?", answer: "It throws `TypeError: Reduce of empty array with no initial value`. Without an initial value, `reduce` uses the first element as the accumulator and starts from the second, and an empty array has no first element." },
      { question: "Why does providing an initial value to `reduce()` matter even on a non-empty array?", answer: "Without one, the first element becomes the starting accumulator and the callback runs one time fewer. That silently changes the accumulator's starting type and the call count, which matters if the callback has side effects or expects a certain accumulator shape." },
      { question: "Which common array methods mutate the array in place, and which don't?", answer: "Mutating: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`. Non-mutating (return a new array or value): `map`, `filter`, `slice`, `concat`, `reduce`, `find`, `some`, `every`, `includes`." },
      { question: "What does this log? `const nums = [1, 2, 3, 4, 5]; console.log(nums.filter((n) => n % 2 === 0).map((n) => n * 10));`", answer: "`[20, 40]`. `filter` keeps the even numbers (`[2, 4]`), then `map` turns those into `[20, 40]`. Each method works on the array the previous one returned." },
      { question: "What does this log, and why? `console.log([\"1\", \"2\", \"3\"].map(parseInt));`", answer: "`[1, NaN, NaN]`. `map` passes `(element, index, array)`, and `parseInt(string, radix)` treats the index as a radix. So it runs `parseInt(\"1\", 0)` (radix 0 means base 10: `1`), `parseInt(\"2\", 1)` (radix 1 is invalid: `NaN`) and `parseInt(\"3\", 2)` (`\"3\"` isn't a binary digit: `NaN`)." },
      { question: "How would you fix the `array.map(parseInt)` bug?", answer: "Use `array.map(Number)` if radix doesn't matter, or `array.map((str) => parseInt(str, 10))`. Both stop `map`'s index from being passed as the radix." },
      { question: "Why doesn't this same class of bug usually show up with `array.map(String)` or `array.map(Boolean)`?", answer: "They only use their first argument and ignore the extras `map` passes (index, array). `parseInt` is the classic trap because its second parameter changes the result." },
      { question: "What does this log? `const nums = [5, 1, 4, 2, 3]; nums.sort((a, b) => b - a); console.log(nums);`", answer: "`[5, 4, 3, 2, 1]`. A negative comparator result puts `a` first, positive puts `b` first, so `b - a` sorts descending. `sort` changes `nums` directly." },
      { question: "What is `reduceRight()`, and how does it differ from `reduce()`?", answer: "Same accumulator pattern as `reduce()`, but from the last element to the first. Useful when combination order matters, like right-associative operations." },
      { question: "What does this log? `const orders = [{ amount: 10 }, { amount: 25 }, { amount: 5 }]; const total = orders.filter((o) => o.amount > 8).map((o) => o.amount).reduce((sum, n) => sum + n, 0); console.log(total);`", answer: "`35`. `filter` keeps orders over 8 (`10` and `25`), `map` extracts their `amount`s, and `reduce` sums them: `10 + 25`." },
      { question: "Can you `break` or `continue` out of a `forEach()` loop early?", answer: "No. `forEach` always runs for every element; a `return` in the callback only ends that one call. Use `for`/`for...of` (which supports `break`) to exit early." },
      { question: "What does this log? `[1, 2, 3].forEach((n) => { if (n === 2) return; console.log(n); });`", answer: "`1` then `3`. `return` only ends the call for `n === 2`, skipping its `console.log`; `forEach` continues to `3`." },
      { question: "What does this log? `console.log([].every((x) => x > 0)); console.log([].some((x) => x > 0));`", answer: "`true` then `false`. On an empty array, `every` is vacuously true (no element fails), and `some` is `false` (no element passes)." },
      { question: "Why can't `.includes()` find an object by one of its property values?", answer: "`includes()` uses SameValueZero equality, which for objects means same reference, not same contents. To find an object by a property, use `find()`, e.g. `arr.find((o) => o.id === 5)`." },
      { question: "Why should `map()` always return the same number of items as the input array?", answer: "Callers rely on `map` transforming, not filtering. Returning `undefined` to \"skip\" items still leaves those slots (holding `undefined`). To drop items, use `filter` (possibly chained with `map`)." },
      { question: "How would you implement your own version of `map()` using a plain loop, to understand what it's actually doing?", answer: "Create an empty array, loop over the input with `for`, call the callback with `(element, index, array)` each time and push its return value. That's what the built-in `map` does." },
      { question: "What's the difference between `Array.prototype.flat()` and `Array.prototype.flatMap()`?", answer: "`flat(depth)` flattens an existing nested array by the given depth. `flatMap()` maps and flattens one level in the same pass, more efficient than `.map()` then `.flat()` when the mapping produces nested arrays." },
      { question: "What is `Array.prototype.at()` useful for that bracket notation isn't?", answer: "`arr.at(-1)` reads from the end with a negative index. Brackets don't support that: `arr[-1]` looks up a property named `\"-1\"` and returns `undefined`, so you'd need `arr[arr.length - 1]`." },
      { question: "Why might chaining `.filter().map()` be less efficient than a single `.reduce()` on a very large array?", answer: "Each chained method is a full pass that builds and discards an intermediate array. One `reduce()` (or a loop) can filter and transform in one pass. Only worth it when the array is truly large and this is a measured bottleneck." },
      { question: "Does `.sort()` guarantee a stable sort — that equal elements keep their relative order?", answer: "Yes. The modern ECMAScript spec requires `Array.prototype.sort()` to be stable: equal elements keep their original order. That matters when sorting by one key while keeping an earlier order by another." },
      { question: "How would you count how many times each value appears in an array using `reduce()`?", answer: "Use an object accumulator and increment a counter per value: `arr.reduce((tally, v) => { tally[v] = (tally[v] || 0) + 1; return tally; }, {})`." },
      { question: "What's a scenario where `.some()` is a better choice than `.filter().length > 0`?", answer: "When you only need to know if at least one match exists. `.some()` stops at the first match; `.filter()` scans everything and builds a full array just to check its length." },
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
Text is everywhere in a program: a name, a message, a URL. You often need
to ask small questions about it. How long is it? Does it contain this word?
What does it look like in uppercase? Strings have built-in methods for
these, so you rarely process text character by character.

The ones you'll use most: \`length\` (a property, not a method), \`slice\`,
\`includes\`, \`split\`, \`trim\`, \`replace\`, and template literals for
building strings from pieces.
    `.trim(),
    analogy:
      "If a string is a train of cars, string methods are the inspector's tools: one counts the cars (length), one pulls out a section (slice), one checks whether a certain car exists (includes), one uncouples the train into single cars (split).",
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
          { code: "message.length", explanation: "Counts every character, including the spaces at both ends." },
          { code: "message.trim()", explanation: "Returns a new string with whitespace removed from both ends." },
          { code: 'message.includes("World")', explanation: 'Checks whether "World" appears anywhere in the string.' },
          { code: "`Hi, ${name}!`", explanation: "A template literal: the ${...} slot is replaced with the value of name." },
          { code: '"2026-08-29".split("-")', explanation: 'Splits the string into an array at every "-".' },
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
          "`indexOf` finds a position, `replace` swaps text, `startsWith` checks the beginning, and `slice` pulls out a substring by position. None of them change the original string.",
      },
    ],
    howItWorks: `
Strings are immutable, so every method returns a new string (or array)
instead of changing the original. \`trim()\` doesn't change \`message\`; it
returns a trimmed copy. \`length\` is a property, not a method, so you read
it without parentheses.
    `.trim(),
    whyItExists: `
Walking through text character by character to search or reshape it is
slow to write and easy to get wrong. Built-in methods handle most everyday
text tasks in one clear, well-tested call.
    `.trim(),
    whenToUse: `
Use them to validate, search, format or reshape text: checking a
username's length, confirming an email contains "@", splitting a
comma-separated list, or building a message with a template literal.
    `.trim(),
    whenNotToUse: `
For heavy text processing (parsing complex formats, matching flexible
patterns), plain string methods get unwieldy; use a regular expression.
And building a large string from many small concatenations in a loop is
slower than collecting pieces in an array and joining once.
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
      { question: "Why do string methods like `trim()` or `toUpperCase()` never modify the original string?", answer: "Strings are immutable. Every string method returns a new string; you can't change an existing string's characters in place." },
      { question: "What does this log? `let str = \"hello\"; str.toUpperCase(); console.log(str);`", answer: "`\"hello\"`, unchanged. `toUpperCase()` returns a new string, but its result is thrown away. You'd need `str = str.toUpperCase();`." },
      { question: "What's the difference between `slice()` and `substring()` on a string?", answer: "Both extract a range. `slice()` accepts negative indexes, counting from the end. `substring()` treats negatives as `0` and swaps the arguments if start is greater than end." },
      { question: "What does this log? `const s = \"Hello, World!\"; console.log(s.slice(-6));`", answer: "`\"World!\"`. A negative index in `slice()` counts back from the end, so `-6` starts six characters before the end." },
      { question: "Are string comparisons with `includes()`, `startsWith()`, and `endsWith()` case-sensitive?", answer: "Yes; they compare exact characters, so `\"Hello\".includes(\"hello\")` is `false`. For a case-insensitive check, call `.toLowerCase()` (or `.toUpperCase()`) on both sides first." },
      { question: "What does this log? `console.log(\"Hello\".includes(\"hello\"));`", answer: "`false`. `\"H\"` and `\"h\"` are different code points, and `includes()` doesn't normalize case." },
      { question: "What can a template literal do that regular quoted strings can't?", answer: "It can span multiple lines without escapes, and it can embed any expression in a `${...}` placeholder, which is evaluated and turned into a string. That replaces manual `+` concatenation." },
      { question: "What does `String(null)` return, compared to `null + \"\"`?", answer: "Both give `\"null\"`: `String()` and `+` coercion use the same conversion rules for primitives. `JSON.stringify(null)` also returns `\"null\"`, but for an unrelated reason: it serializes the JSON value `null`." },
      { question: "What is a tagged template literal?", answer: "A function written directly before a template literal. Instead of interpolating automatically, the tag function receives the literal string pieces and the interpolated values separately, so it can process or escape them before building the final string." },
      { question: "What does this log, and why? `console.log(\"2\" > \"10\");`", answer: "`true`. Comparing strings with `>`/`<` goes character by character by Unicode code point, not numerically. `\"2\"` is greater than `\"1\"`, so the comparison stops there." },
      { question: "What does this log? `console.log(1 + \"1\"); console.log(\"1\" + 1); console.log(1 + 1 + \"1\"); console.log(\"1\" + 1 + 1);`", answer: "`\"11\"`, `\"11\"`, `\"21\"`, `\"111\"`. `+` runs left to right, and any `+` with a string operand concatenates. `1 + 1 + \"1\"` adds first (`2`), then joins `\"1\"`. `\"1\" + 1 + 1` concatenates from the first `+`, so every following `+` does too." },
      { question: "What do `padStart()` and `padEnd()` do?", answer: "They add a fill string (repeated as needed) to the start or end until the string reaches a target length. Common for zero-padding numbers or aligning text in columns." },
      { question: "What does this log? `console.log(\"5\".padStart(3, \"0\"));`", answer: "`\"005\"`. `padStart` adds `\"0\"`s to the front until the length is 3." },
      { question: "Why might `.length` not match the number of visible characters in a string?", answer: "`.length` counts UTF-16 code units, not visible characters (grapheme clusters). Characters outside the Basic Multilingual Plane, including many emoji, use two code units (a surrogate pair), so they count as 2 but display as one." },
      { question: "What does `console.log(\"😀\".length);` log, and why isn't it `1`?", answer: "`2`. That emoji is outside the Basic Multilingual Plane and is stored as a UTF-16 surrogate pair (two 16-bit code units). `.length` counts code units, not visible characters." },
      { question: "What's the difference between `trim()`, `trimStart()`, and `trimEnd()`?", answer: "`trim()` removes whitespace from both ends; `trimStart()` only from the start; `trimEnd()` only from the end." },
      { question: "What does this log? `console.log(\"abc\".split(\"\"));`", answer: "`[\"a\", \"b\", \"c\"]`. Splitting on an empty string splits between every character." },
      { question: "What's the difference between `replace()` and `replaceAll()`?", answer: "`replace(search, value)` with a plain string replaces only the first match; to replace all with `replace`, you need a regex with the global flag. `replaceAll()` replaces every match, even with a plain string." },
      { question: "What does this log? `console.log(\"cat cat cat\".replace(\"cat\", \"dog\"));`", answer: "`\"dog cat cat\"`. With a plain string (not a global regex), `replace()` stops after the first match." },
      { question: "Why is repeatedly concatenating strings with `+=` inside a large loop considered inefficient?", answer: "Strings are immutable, so each `+=` creates a new string and copies all previous characters: roughly O(n squared) copying for `n` concatenations. Pushing pieces into an array and calling `.join(\"\")` once avoids that." },
      { question: "Why can you safely compare two string primitives with `===`, unlike two objects?", answer: "Strings are primitives compared by content, so two identical character sequences are `===`. Two objects are only `===` if they're the same object, even with identical contents." },
      { question: "What does this log? `const a = \"hi\"; const b = \"hi\"; console.log(a === b);`", answer: "`true`. Strings are primitives, so the same characters mean equal values." },
      { question: "What's the difference between `charAt(i)`, `str[i]`, and `str.at(i)` for reading a character?", answer: "For a valid index, all three return the character. Out of range, `charAt` returns `\"\"`, while brackets and `.at()` return `undefined`. Only `.at()` supports negative indexes counted from the end." },
      { question: "How would you check if a string is a palindrome using only built-in string and array methods?", answer: "Split into characters (`str.split(\"\")`), reverse the array (`.reverse()`), join it back (`.join(\"\")`) and compare with the original. Strings have no `.reverse()`, so the detour through an array is the standard approach." },
      { question: "What does `split(separator, limit)`'s second argument do?", answer: "It caps the number of pieces in the result. The array is cut to at most `limit` entries, and anything after that is dropped." },
      { question: "Can `split()` take a regular expression as its separator?", answer: "Yes. A regex splits on a pattern instead of a fixed substring, e.g. any run of whitespace with `str.split(/\\s+/)`." },
      { question: "Why is the risk with using `+` to build a dynamic string versus a template literal more than just readability?", answer: "`+` chains are easy to get wrong with precedence and type coercion, e.g. numbers adding before concatenation in `1 + 1 + \"1\"`. A template literal makes each value's boundary explicit and evaluates each `${...}` on its own." },
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
Functions are values, so you can pass one function to another as an
argument. A **callback** is a function you pass in to be called at the
right moment: after a click, after a timer, or for every item in an array.

You've already used callbacks: the function you pass to \`.map()\`,
\`addEventListener()\` or \`setTimeout()\` is one.
    `.trim(),
    analogy:
      "It's like telling a restaurant host: 'Call this number when our table is ready.' You don't wait at the counter. You hand over instructions (the callback) and get on with your day.",
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
          { code: "function greetUser(name, onDone) {", explanation: "Takes a callback, onDone, as its second parameter." },
          { code: 'const message = "Hi, " + name + "!";', explanation: "Builds the greeting." },
          { code: "onDone(message);", explanation: "Calls the callback with the result." },
          { code: 'greetUser("Amara", (message) => {...});', explanation: "Passes an arrow function as the callback; it runs when greetUser calls it." },
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
          "A function can take more than one callback. Here exactly one of the two runs, depending on the outcome.",
      },
    ],
    howItWorks: `
Nothing special happens underneath. A callback is a regular function
value, stored in a parameter and called whenever the receiving code
decides. What makes it a "callback" is its role: someone else's code calls
it back later, instead of your code calling it directly.
    `.trim(),
    whyItExists: `
Callbacks keep a function flexible without it knowing the details in
advance. \`.map()\` doesn't know what transformation you want;
\`addEventListener\` doesn't know what should happen on click. The callback
supplies that missing piece.
    `.trim(),
    whenToUse: `
Use a callback to customize what happens at a point inside another
function: reacting to an event, running code for each array item, or
deciding what happens when an async task finishes.
    `.trim(),
    whenNotToUse: `
If you're nesting many callbacks for a sequence of async steps, use
promises and async/await instead. They were built to replace exactly that
pattern.
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
      { question: "What is a callback function?", answer: "A function passed into another function, which calls it at the right moment: after an event, after a delay, or once per item in a collection." },
      { question: "Are all callbacks asynchronous?", answer: "No. \"Callback\" describes a role (being called by other code), not timing. Callbacks for array methods like `map`/`forEach` run synchronously during the call; callbacks for `setTimeout` or event listeners run later, asynchronously." },
      { question: "What does this log, in order? `console.log(\"start\"); [1, 2, 3].forEach((n) => console.log(n)); console.log(\"end\");`", answer: "`start`, `1`, `2`, `3`, `end`. `forEach`'s callback runs synchronously and finishes before the next line runs." },
      { question: "What does this log, in order? `console.log(\"start\"); setTimeout(() => console.log(\"timeout\"), 0); console.log(\"end\");`", answer: "`start`, `end`, `timeout`. Even a `0`ms delay doesn't run immediately: the callback goes to the event loop's task queue and runs only after the current synchronous code (including `console.log(\"end\")`) finishes." },
      { question: "What is the 'error-first callback' convention?", answer: "A pattern (common in Node.js-style APIs) where the callback's first parameter is an error (`null` if none) and the result comes second: `(err, data) => {}`. Callers check `err` before trusting `data`, so every callback handles errors the same way." },
      { question: "What is 'callback hell', and what causes it?", answer: "A pyramid of deeply nested callbacks, one per step of an async sequence. Each step can only run inside the previous step's callback, and error handling is repeated at every level. Promises and `async`/`await` exist largely to flatten this." },
      { question: "What's the difference between passing `fn` and `fn()` as a callback?", answer: "`fn` passes the function itself, to be called later. `fn()` calls it now and passes its return value instead, a very common bug when you meant to defer the call." },
      { question: "What does this log? `function greet() { console.log(\"hi\"); } setTimeout(greet(), 1000);`", answer: "`\"hi\"` logs immediately. `greet()` runs while building `setTimeout`'s arguments, and its return value (`undefined`) is what gets scheduled, which does nothing a second later." },
      { question: "What's the bug here? `const counter = { count: 0, increment() { this.count++; } }; setTimeout(counter.increment, 0);`", answer: "`counter.increment` passes the bare function, detached from `counter`. `setTimeout` calls it with no receiver, so `this` isn't `counter` and `this.count++` doesn't update it. Fix with `.bind(counter)` or an arrow function: `() => counter.increment()`." },
      { question: "How do promises address the problems that deeply nested callbacks create?", answer: "A promise represents one eventual result. You chain `.then()` calls at the same level instead of nesting them, and errors flow to a single `.catch()` instead of being checked at every level." },
      { question: "How would you write a function that accepts an optional callback safely?", answer: "Check it's a function before calling it (`if (typeof callback === \"function\") callback(result);`), or give the parameter a no-op default, so calling without a callback doesn't throw." },
      { question: "What happens here? `function fetchData(callback) { const data = { id: 1 }; callback(data); } fetchData();`", answer: "It throws `TypeError: callback is not a function`. No callback was passed, so it's `undefined`, which can't be called. The function should guard against a missing callback." },
      { question: "Does a callback's return value always matter to the code that calls it?", answer: "It depends on the caller. `map`'s callback return values build the new array, and `reduce`'s becomes the next accumulator. Callbacks passed to `forEach`, `addEventListener` or `setTimeout` have their return values ignored." },
      { question: "What's the difference between a 'callback' and an 'event handler'?", answer: "An event handler is a callback in a specific role: registered to run when an event (a click, a message, a timer) occurs. \"Callback\" is the general term for any function handed to other code to call later." },
      { question: "Why does naming a callback function instead of passing it as an inline anonymous function sometimes help debugging?", answer: "A named function appears by name in stack traces and profiler output, and can be reused or tested on its own. An anonymous inline callback shows as `<anonymous>`, making it harder to find which one threw among many similar callbacks." },
      { question: "If a function accepts multiple callbacks, like `onSuccess` and `onError`, what determines which one runs?", answer: "The function's own logic. The callbacks are ordinary parameters, and the function's code decides, based on a condition it checks, which one (if any) to call." },
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
Functions are values: you can store them in variables, put them in arrays
and pass them around like numbers or strings. A **higher-order function**
uses this: it takes a function as a parameter, returns a function, or both.

You've met several already. \`.map()\`, \`.filter()\` and \`.reduce()\` are
higher-order because each takes a callback.
    `.trim(),
    analogy:
      "A higher-order function is like a manager who doesn't do the task directly. They take your instructions (a function) and apply them, or hand you back custom instructions (a function) built for a specific situation.",
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
          { code: "function multiplyBy(factor) {", explanation: "A function that builds and returns another function." },
          { code: "return function (n) { return n * factor; };", explanation: "Returns a new function, customized with the factor passed in." },
          { code: "const double = multiplyBy(2);", explanation: "double is now a function that multiplies by 2." },
          { code: "double(5);", explanation: "Calls the customized function, giving 10." },
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
          "`applyTwice` doesn't care what `fn` does; it applies whatever function it gets, twice. That flexibility is the point of taking a function as a parameter.",
      },
    ],
    howItWorks: `
Functions are ordinary values, so returning one works like returning a
number or string. The returned function is callable, and (thanks to
closures) it remembers the variables from where it was created, like
\`factor\` above.
    `.trim(),
    whyItExists: `
Higher-order functions let you write general logic once (like "multiply by
some factor") and customize it on demand, instead of writing a nearly
identical function for every case.
    `.trim(),
    whenToUse: `
Use one to generate specialized functions from a general pattern (like
\`multiplyBy\`), or when designing an API where the caller supplies custom
behavior (like \`.map()\` accepting any transformation).
    `.trim(),
    whenNotToUse: `
If a plain function with a couple of parameters does the job just as
clearly, an extra layer of functions returning functions only adds
indirection.
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
      { question: "What makes a function 'higher-order'?", answer: "It takes a function as an argument, returns a function, or both, treating functions like any other value." },
      { question: "What's the difference between a higher-order function and a callback?", answer: "They're two sides of one relationship. The higher-order function accepts or returns a function; the callback is the function passed in. In `arr.map(fn)`, `map` is higher-order and `fn` is the callback." },
      { question: "Besides array methods, what are some built-in higher-order functions?", answer: "`setTimeout`/`setInterval` (take a function to run later), `addEventListener` (takes a handler) and promise methods like `.then()` (take functions to run on resolve/reject). Each takes a function as an argument." },
      { question: "What does this log? `function greaterThan(n) { return (m) => m > n; } const greaterThan10 = greaterThan(10); console.log(greaterThan10(15)); console.log([5, 12, 8, 20].filter(greaterThan10));`", answer: "`true` then `[12, 20]`. `greaterThan(10)` returns a function that closes over `n = 10`, used both on its own and as a `filter` callback." },
      { question: "What is function composition, and what does `compose(f, g)` typically mean?", answer: "Combining functions so one's output feeds the next one's input. `compose(f, g)` usually means \"apply `g`, then `f`\" (right to left), while `pipe(f, g)` usually runs left to right." },
      { question: "What does this log? `const compose = (f, g) => (x) => f(g(x)); const double = (n) => n * 2; const increment = (n) => n + 1; const doubleThenIncrement = compose(increment, double); console.log(doubleThenIncrement(3));`", answer: "`7`. `compose(increment, double)` applies `double` first (`3 * 2 = 6`), then `increment` (`6 + 1 = 7`). `compose` runs right to left, which matches the name `doubleThenIncrement`." },
      { question: "What is currying, and how is it different from ordinary partial application?", answer: "Currying turns a multi-argument function into a chain of functions that each take exactly one argument. Partial application is more general: fix some arguments now and return a function that takes the rest, one at a time or several at once." },
      { question: "What does this log? `const add = (a) => (b) => (c) => a + b + c; console.log(add(1)(2)(3));`", answer: "`6`. Each call returns the next function in the chain, closing over the argument just given, so the last call has all three to add." },
      { question: "Why do higher-order functions that return other functions rely on closures to be useful?", answer: "The returned function usually needs to remember something from the call that created it, like a multiplier or a cache. Without a closure, it couldn't reach those values once the outer call ended." },
      { question: "What is a decorator/wrapper pattern implemented as a higher-order function?", answer: "A function that takes a function and returns a new one with extra behavior around it. For example, `withLogging(fn)` returns a function that logs the arguments and then calls `fn(...args)`, keeping the original behavior but adding logging." },
      { question: "How does memoization work as a higher-order function?", answer: "`memoize(fn)` returns a function that checks a closed-over cache for the arguments before calling `fn`. On a hit it returns the cached result; otherwise it runs `fn`, stores the result and returns it." },
      { question: "Why are higher-order functions considered a core building block of functional programming?", answer: "Functional programming treats functions as first-class values to compose, pass around and generate. Higher-order functions are the mechanism for combining small, reusable functions into bigger behavior." },
      { question: "What's the practical difference between `return fn;` and `return fn();` inside a higher-order function?", answer: "`return fn;` returns the function itself, to be called later. `return fn();` calls it now and returns its result. Mixing them up causes \"why is this a function instead of a value\" bugs (or the reverse)." },
      { question: "How would you build a `debounce(fn, delay)` higher-order function?", answer: "Return a function that, on every call, clears the previous timer (kept in a closed-over variable) and starts a new `setTimeout` to call `fn` after `delay`. So `fn` runs only once calls have stopped for that long." },
      { question: "What does it mean for JavaScript to have 'first-class functions', and why does that matter for higher-order functions?", answer: "Functions can be stored in variables and data structures, passed as arguments and returned, like any value. Without that, higher-order functions couldn't exist." },
      { question: "How would you implement a `once(fn)` higher-order function that only lets `fn` run a single time?", answer: "Close over a flag (and optionally a cached result) in the returned function. The first call runs `fn`, stores the result and flips the flag; later calls skip `fn` and return the stored result." },
      { question: "Is a callback ever itself a higher-order function?", answer: "Yes, when the callback itself takes or returns a function, for example passing `memoize` or `compose` as an argument. Being a callback and being higher-order are independent. Note that the function returned by `greaterThan(10)` is not higher-order: `(m) => m > n` takes a number and returns a boolean. `greaterThan` is the higher-order one." },
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
Reading a few properties from an object used to mean one line each:
\`const name = user.name; const age = user.age;\`. **Destructuring** pulls
several values out in one line, matching the shape of the data.

Its relative, the **spread/rest** operator (\`...\`), expands a collection
into individual values, or collects individual values into one.
    `.trim(),
    analogy:
      "Destructuring is like unpacking a delivery box by naming exactly the items you want, instead of carrying the whole box. Spread empties one box into a bigger one; rest does the opposite, sweeping up \"everything else\" into one box of leftovers.",
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
          { code: "const { name, age } = user;", explanation: "Pulls out the name and age properties, matched by key." },
          { code: "const [first, second] = numbers;", explanation: "Pulls out array items by position, not name." },
          { code: "function greet({ name, age }) {...}", explanation: "Destructures in the parameter list, taking exactly what the function needs." },
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
Destructuring is shorthand for several assignments at once, matched by
object key or array position.

Spread (\`...\` when building a new value) copies each element or property
into the new array or object. Rest (\`...\` in a parameter list or
destructuring pattern) does the opposite: it gathers the remaining values
into one array (or object).
    `.trim(),
    whyItExists: `
Both remove repetitive line-by-line code. Destructuring makes "give me
these pieces" one readable line; spread/rest make "combine everything" or
"gather the rest" just as short. They're common when copying objects and
arrays without mutation, and in flexible functions.
    `.trim(),
    whenToUse: `
- Destructuring: when you need a few named pieces from an object or array, especially in function parameters.
- Spread: to copy or merge objects/arrays without changing the originals.
- Rest: when a function should take any number of arguments, or you want "everything else" from an object/array.
    `.trim(),
    whenNotToUse: `
Deeply nested destructuring can be harder to read than a couple of plain
property reads, so don't force it. And spread makes only a shallow copy:
nested values are still shared, not cloned.
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
      { question: "What's the difference between destructuring an array and destructuring an object?", answer: "Array destructuring matches by position: `const [a, b] = arr` takes the first two elements. Object destructuring matches by name: `const { x, y } = obj` takes those keys, in any order." },
      { question: "What does this log? `const { count = 10 } = { count: undefined }; const { total = 10 } = { total: null }; console.log(count, total);`", answer: "`10` then `null`. A default applies only when the value is `undefined` (missing or explicit). Other falsy values, including `null`, are used as-is." },
      { question: "How do you rename a variable while destructuring an object?", answer: "`const { name: userName } = user;` takes the `name` property and stores it as `userName`. Useful to avoid a name clash or use a clearer name." },
      { question: "How does nested destructuring work?", answer: "The pattern mirrors the data's shape. `const { address: { city } } = user;` reaches into `user.address` and takes its `city`, with no intermediate `const address = user.address;`." },
      { question: "What does this log? `const { id, ...details } = { id: 1, name: \"Amara\", age: 28 }; console.log(id, details);`", answer: "`1` then `{ name: \"Amara\", age: 28 }`. `id` is pulled out, and the rest pattern (`...details`) collects the remaining properties into a new object." },
      { question: "What does this log? `let a = 1, b = 2; [a, b] = [b, a]; console.log(a, b);`", answer: "`2` then `1`. The right side builds a temporary array `[2, 1]`, then destructuring assigns it back to `a` and `b`, swapping them without a temp variable." },
      { question: "Why is destructuring especially useful in function parameters?", answer: "The signature lists exactly which properties the function needs (`function greet({ name, age }) {}`), so its dependencies are visible at a glance instead of buried in `user.name`/`user.age` reads in the body." },
      { question: "Does spreading an object or array make a deep copy?", answer: "No, only one level. Nested objects and arrays are the same references in the original and the copy, so changing one through the copy shows in the original." },
      { question: "If spread only makes a shallow copy, how would you actually deep-clone a value?", answer: "`structuredClone(value)` deep-clones most data natively (objects, arrays, dates, even circular references). `JSON.parse(JSON.stringify(value))` is older; it silently drops functions and `undefined`, and throws on circular references." },
      { question: "What does spreading an array into a function call do?", answer: "It passes each element as its own argument. `Math.max(...numbers)` works even though `Math.max` doesn't accept an array directly." },
      { question: "What does this log? `const nums = [4, 2, 9, 1]; console.log(Math.max(...nums));`", answer: "`9`. Spread passes `4, 2, 9, 1` as four arguments, and `Math.max` returns the largest." },
      { question: "What's the difference between rest parameters and the old `arguments` object?", answer: "A rest parameter (`function f(...args)`) collects extra arguments into a real array with all array methods, and works in any function. `arguments` is only array-like (indexes and `length`, no `map`/`filter`/etc.), and arrow functions don't have their own." },
      { question: "What does this log? `function outer() { const inner = () => console.log(arguments[0]); inner(); } outer(\"hi\");`", answer: "`\"hi\"`. The arrow function has no `arguments` of its own, so the lookup goes out to `outer`'s `arguments`, the same lexical lookup closures use for any variable." },
      { question: "Where must a rest parameter appear in a function's parameter list?", answer: "Last. `function f(a, ...rest)` is valid; `function f(...rest, a)` is a `SyntaxError`, since rest collects every remaining argument." },
      { question: "How would you split an array into its first element and 'everything else' using destructuring?", answer: "`const [first, ...rest] = arr;`. `first` gets index 0, and `rest` gets a new array of the remaining elements." },
      { question: "When merging two objects with spread, which properties win if both objects share a key?", answer: "The one spread later. In `{ ...a, ...b }`, `b`'s values overwrite matching keys from `a`, since spreads apply left to right." },
      { question: "What's the difference between `Object.assign(target, source)` and object spread `{ ...source }`?", answer: "`Object.assign` copies `source`'s properties into its first argument, mutating and returning it. Spread always creates a new object and changes nothing. Passing `{}` as the target makes `Object.assign` non-mutating, like spread." },
      { question: "Can a destructuring pattern's default value reference another variable being destructured in the very same pattern?", answer: "Yes, as long as that variable comes earlier in the pattern. Defaults are evaluated left to right, so `const [x = 1, y = x] = []` gives `y === 1`. Referring to a later one throws a `ReferenceError` (temporal dead zone)." },
    ],
    prerequisites: ["objects", "arrays"],
    relatedTopics: ["objects", "arrays", "functions"],
    keywords: ["destructuring", "spread", "rest", "..."],
  },
];
