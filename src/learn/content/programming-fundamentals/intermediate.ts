import type { Topic } from "../../types/content";

export const programmingFundamentalsIntermediateTopics: Topic[] = [
  {
    id: "type-systems",
    title: "Type Systems",
    level: "intermediate",
    description: "How languages classify values and catch mismatches: static vs dynamic, strong vs weak, inference, nominal vs structural.",
    explanation: `
Every value has a **type**: a number, a string, a list, a \`User\`. A
**type system** is the set of rules a language uses to decide which
operations are allowed on which types, and when it checks those rules.

Four separate questions describe most type systems:

- **When are types checked?** **Static** languages (Java, Rust, TypeScript,
  C) check before the program runs. **Dynamic** languages (Python,
  JavaScript, Ruby) check while it runs.
- **How strict are conversions?** **Strong** typing refuses to silently mix
  unrelated types (\`"1" + 1\` is an error in Python). **Weak** typing
  converts quietly (\`"1" + 1\` is \`"11"\` in JavaScript).
- **Do you have to write the types?** With **type inference** the compiler
  works them out (\`let x = 5\` is an integer in Rust and TypeScript).
- **What makes two types compatible?** **Nominal** systems compare names
  (Java). **Structural** systems compare shapes (TypeScript, Go interfaces).

**Gradual typing** mixes both worlds: you add type annotations where they
help, and leave the rest dynamic (TypeScript over JavaScript, type hints
plus mypy over Python).
    `.trim(),
    analogy:
      "A static type system is a building inspector who checks the plans before construction starts. A dynamic one is an inspector who walks through the finished building and stops you at the broken stair. Strong vs weak is whether the inspector refuses a square peg in a round hole, or quietly shaves the peg down to fit.",
    examples: [
      {
        title: "Dynamic and strong (Python) vs dynamic and weak (JavaScript)",
        language: "python",
        code: `# Python: types are checked at run time, and mixing is refused
count = 3
label = "items: " + str(count)   # fine, explicit conversion
label = "items: " + count        # TypeError at run time

# JavaScript, for comparison (weak):
#   "items: " + 3   -> "items: 3"
#   "5" * 2         -> 10
#   [] + {}         -> "[object Object]"`,
        walkthrough: [
          { code: "count = 3", explanation: "The variable has no declared type; the value 3 is an int." },
          { code: 'label = "items: " + str(count)', explanation: "Converting explicitly with str() makes both sides strings." },
          { code: 'label = "items: " + count', explanation: "Python refuses to add a str and an int, and raises TypeError when this line runs." },
          { code: '"5" * 2 -> 10', explanation: "JavaScript silently converts the string to a number instead of failing." },
        ],
      },
      {
        title: "Static typing with inference and structural compatibility (TypeScript)",
        language: "typescript",
        code: `interface Point { x: number; y: number }

function length(p: Point): number {
  return Math.hypot(p.x, p.y);
}

const origin = { x: 0, y: 0, label: "O" }; // type inferred, no annotation
length(origin);           // OK: it has x and y, so it fits Point
length({ x: 1 });         // compile error: property 'y' is missing

let total = 10;           // inferred as number
total = "ten";            // compile error before the code ever runs`,
        explanation:
          "TypeScript never required `origin` to declare that it is a `Point`. It only checked that the shape matches. In Java, a class must explicitly `implements Point` to be accepted.",
      },
    ],
    howItWorks: `
A **static checker** (compiler or type checker) reads the source, assigns a
type to every expression and verifies each operation against the rules. If
something doesn't fit, you get an error before the program runs. Many
compilers then erase the types (TypeScript emits plain JavaScript) or use
them to generate faster code (Rust, C).

A **dynamic** language attaches a type tag to every value at run time. Each
operation inspects the tags first: Python's \`+\` checks whether both
operands support addition with each other, and raises \`TypeError\` if not.

**Type inference** works by propagating known facts: \`5\` is a number, so
\`let x = 5\` makes \`x\` a number, so \`x + 1\` is a number. Languages like
Rust and Haskell can infer almost everything inside a function, though
function signatures are usually written out.

**Nominal vs structural** is about compatibility. Nominal: a \`Celsius\` and
a \`Fahrenheit\` class are different even if both wrap one number.
Structural: any object with the right fields and methods fits.
    `.trim(),
    diagram: `
                 weak                       strong
            +---------------------+----------------------+
  static    | C                   | Java, Rust, Go,      |
            |                     | TypeScript*          |
            +---------------------+----------------------+
  dynamic   | JavaScript, PHP     | Python, Ruby         |
            +---------------------+----------------------+
  * TypeScript is static at compile time but runs as JavaScript.
  Strong/weak is a spectrum, not a clean yes/no.
    `.trim(),
    whyItExists: `
Types catch a whole class of bugs (calling a method that doesn't exist,
passing a string where a number is expected) and document what code
expects. Static checks find those bugs earlier and enable editor features
like autocomplete and safe renames. Dynamic typing trades those guarantees
for less ceremony and faster experimentation. Gradual typing exists because
many teams want both: quick scripts that can grow into checked code.
    `.trim(),
    whenToUse: `
Lean on static types for large codebases, long-lived code, shared libraries
and anything many people change: the checker becomes a safety net during
refactors. Dynamic typing shines for small scripts, notebooks, prototypes
and glue code. In Python or JavaScript projects that keep growing, adopt
gradual typing (type hints, TypeScript) at module boundaries first.
    `.trim(),
    whenNotToUse: `
Don't fight the type system with escape hatches (\`any\`, casts,
\`# type: ignore\`) everywhere; that keeps the cost and loses the benefit.
Don't treat static types as proof of correctness either: they check shapes,
not logic, and data from outside the program (JSON, user input) still needs
run-time validation.
    `.trim(),
    commonMistakes: [
      "Treating 'static vs dynamic' and 'strong vs weak' as the same thing. Python is dynamic but strong; C is static but fairly weak.",
      "Assuming TypeScript or Python type hints check data at run time. They are erased or ignored when the program runs, so parsed JSON must still be validated.",
      "Overusing `any` (TypeScript) or `Any` (Python), which silently switches checking off for everything that value touches.",
      "Expecting nominal behaviour in a structural system: two TypeScript interfaces with the same fields are interchangeable even if their names suggest otherwise.",
      "Believing inferred types are weaker than written ones. An inferred type is just as strictly checked; it is only not spelled out.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Predict the result of `'3' + 4`, `'3' * 4` and `3 + True` in both JavaScript and Python, then run them to check." },
      { difficulty: "Medium", prompt: "Add type hints to a small untyped Python module (3–4 functions) and run mypy on it. Fix every error it reports and write down which ones were real bugs." },
      { difficulty: "Hard", prompt: "In TypeScript, make `UserId` and `OrderId` (both strings at run time) incompatible with each other using a 'branded type', so passing one where the other is expected fails to compile." },
    ],
    interviewQuestions: [
      { question: "What is the difference between static and dynamic typing?", answer: "Static typing checks types before the program runs (at compile or check time), so type errors stop the build. Dynamic typing checks types while the program runs, so a type error surfaces only when the faulty line executes." },
      { question: "What is the difference between strong and weak typing?", answer: "It describes how willingly a language converts between unrelated types. Strong typing refuses implicit conversions that could lose meaning (Python raises on `'1' + 1`). Weak typing converts silently (JavaScript gives `'11'`). It is a spectrum, not a strict binary." },
      { question: "Is Python statically or dynamically typed? Strongly or weakly?", answer: "Dynamically and strongly typed. Variables have no fixed type, but values do, and Python refuses most implicit conversions between unrelated types." },
      { question: "What is type inference?", answer: "The compiler deducing types from how values are created and used, so you don't have to annotate them. `let x = 5` in Rust or TypeScript gives `x` a numeric type that is checked just as strictly as if you had written it." },
      { question: "What is the difference between nominal and structural typing?", answer: "Nominal typing considers types compatible only if they are declared related by name (Java classes must `implements` an interface). Structural typing considers them compatible if their shape matches: same fields and methods (TypeScript, Go interfaces)." },
      { question: "What is duck typing and how does it relate to structural typing?", answer: "Duck typing is structural compatibility checked at run time: if an object has the method you call, it works, whatever its class. Structural typing applies the same idea at compile time." },
      { question: "What is gradual typing?", answer: "A system where typed and untyped code coexist, so you can add annotations incrementally. TypeScript's `any` and Python's type hints checked by mypy or pyright are examples. Unannotated parts are treated as dynamic." },
      { question: "Do TypeScript types exist at run time?", answer: "No. The compiler erases them, so the emitted JavaScript has no type information. Run-time checks need explicit code such as `typeof`, `instanceof` or a schema validator." },
      { question: "What are the main trade-offs of static typing?", answer: "Benefits: earlier bug detection, safer refactoring, better tooling and self-documenting code. Costs: more upfront ceremony, a learning curve for advanced types, and occasionally fighting the checker over code you know is correct." },
      { question: "What is a 'sound' type system?", answer: "One where a program that type-checks can never hit a type error at run time. Few mainstream languages are fully sound; TypeScript deliberately is not, trading soundness for compatibility with existing JavaScript patterns." },
    ],
    prerequisites: ["data-types-and-values", "variables-and-assignment"],
    relatedTopics: ["how-compilers-work", "object-oriented-programming", "generics", "type-narrowing", "programming-paradigms"],
    keywords: ["static typing", "dynamic typing", "strong typing", "weak typing", "type inference", "nominal", "structural", "duck typing", "gradual typing", "type coercion"],
  },
  {
    id: "value-vs-reference",
    title: "Value vs Reference",
    level: "intermediate",
    description: "What actually gets copied when you assign a variable or pass an argument, and why shared objects cause aliasing bugs.",
    explanation: `
When you write \`b = a\` or call \`f(a)\`, something gets copied. The
question is **what**: the value itself, or a reference to where the value
lives?

- **Pass-by-value**: the function receives its own copy. Changing it inside
  the function doesn't affect the caller. C, and Java/JavaScript primitives,
  behave this way.
- **Pass-by-reference**: the function receives the caller's variable
  itself. Assigning to the parameter changes the caller's variable. C++
  \`int&\` and C# \`ref\` do this.
- **Pass-by-sharing** (also called "pass the reference by value"): the
  function receives a copy of a **reference** to the same object. Mutating
  the object is visible to the caller; re-assigning the parameter is not.
  Python, JavaScript objects, Java objects and Ruby all work this way.

When two names refer to the same object, they are **aliases**. Aliasing is
the source of a classic bug: you change "your copy" and someone else's
data changes too. Fixing it means making a real copy, either **shallow**
(new outer container, same inner objects) or **deep** (everything copied
recursively).
    `.trim(),
    analogy:
      "Passing by value is handing someone a photocopy of your document: they can scribble on it and your original is safe. Pass-by-sharing is handing them your house address: they can walk in and rearrange the furniture, but if they cross out the address and write a different one on their note, your house doesn't move.",
    examples: [
      {
        title: "Pass-by-sharing in Python: mutate vs re-assign",
        language: "python",
        code: `def add_item(items):
    items.append("new")      # mutates the shared list

def replace(items):
    items = ["x", "y"]       # re-binds the local name only

cart = ["a"]
add_item(cart)
print(cart)   # ['a', 'new']
replace(cart)
print(cart)   # ['a', 'new']  (unchanged)`,
        walkthrough: [
          { code: 'cart = ["a"]', explanation: "Creates a list object and binds the name cart to it." },
          { code: "add_item(cart)", explanation: "The parameter items now refers to the same list as cart." },
          { code: 'items.append("new")', explanation: "Mutates that one shared list, so the caller sees the change." },
          { code: 'items = ["x", "y"]', explanation: "Points the local name at a brand-new list. cart still points at the old one." },
        ],
      },
      {
        title: "Shallow vs deep copy (JavaScript)",
        language: "javascript",
        code: `const original = { name: "Ana", tags: ["admin"] };

const alias = original;                 // same object
const shallow = { ...original };        // new outer object, same tags array
const deep = structuredClone(original); // fully independent

shallow.name = "Bo";       // original.name still "Ana"
shallow.tags.push("dev");  // original.tags is now ["admin", "dev"]!
deep.tags.push("ops");     // original unaffected

console.log(alias === original);              // true
console.log(shallow.tags === original.tags);  // true`,
        explanation:
          "Spread, `Object.assign`, `slice()` and Python's `list.copy()` / `copy.copy()` are shallow. `structuredClone` (JS) and `copy.deepcopy` (Python) copy recursively.",
      },
      {
        title: "The classic aliasing bug: a list of lists",
        language: "python",
        code: `grid = [[0] * 3] * 3      # three references to ONE inner list
grid[0][0] = 1
print(grid)   # [[1, 0, 0], [1, 0, 0], [1, 0, 0]]

grid = [[0] * 3 for _ in range(3)]  # three separate inner lists
grid[0][0] = 1
print(grid)   # [[1, 0, 0], [0, 0, 0], [0, 0, 0]]`,
      },
    ],
    howItWorks: `
A variable holding a primitive (in many languages: numbers, booleans) holds
the value directly. A variable holding an object holds a **reference**: in
practice a memory address pointing to the object on the heap.

Assignment and argument passing copy whatever the variable holds. For a
primitive that is the value; for an object it is the reference. So after
\`b = a\` with an object, there is still exactly one object and now two
references to it.

In Python **everything** is an object and every name is a reference.
Integers and strings just *look* like values because they are immutable:
you can't change them in place, so sharing them is harmless.

True pass-by-reference is different: the parameter is an alias for the
caller's **variable**, not the object. That's why \`void swap(int& a, int& b)\`
can swap two caller variables in C++, but no function can do that in Python
or JavaScript.
    `.trim(),
    diagram: `
  cart = ["a"];  add_item(cart)

  caller frame          add_item frame
  +-------------+       +--------------+
  | cart  ---------+    | items  ----+ |
  +-------------+  |    +------------|-+
                   v                 v
                 +---------------------+
                 | list: ["a", "new"]  |   (one object on the heap)
                 +---------------------+
    `.trim(),
    whyItExists: `
Copying a large object on every assignment or function call would be slow
and memory-hungry, so most languages pass objects by sharing a reference.
The cost of that efficiency is that sharing is invisible in the syntax:
\`b = a\` looks the same whether it copies a number or shares a
10-million-element list.
    `.trim(),
    whenToUse: `
Think about value vs reference whenever a function receives a list, dict,
array or object and you need to know whether it may change it, when you
store objects passed in from outside (a constructor keeping a caller's list),
and when you return internal state to callers. Copy at those boundaries if
the data must stay independent.
    `.trim(),
    whenNotToUse: `
Don't deep-copy defensively everywhere "just in case": it costs time and
memory and can break things that should be shared (caches, connections,
objects with identity). Prefer immutable data or clear ownership so copies
are rarely needed.
    `.trim(),
    commonMistakes: [
      "Saying Python or JavaScript are 'pass-by-reference'. They pass references by value: mutation is shared, re-assignment is not.",
      "Using a shallow copy (spread, `slice()`, `list.copy()`) and expecting nested objects to be independent.",
      "Building a 2D list with `[[0] * n] * m` in Python, which creates m references to the same inner list.",
      "Using a mutable default argument in Python (`def f(items=[])`). The default list is created once and shared by every call.",
      "Comparing objects with `===` (JS) or `is` (Python) when you meant to compare contents.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a Python snippet showing that `b = a` for a list shares the object, then fix it so that changing `b` leaves `a` alone." },
      { difficulty: "Medium", prompt: "Write a function `withDiscount(order)` in JavaScript that returns a new order with every item's price reduced by 10%, without modifying the original order or its nested items." },
      { difficulty: "Hard", prompt: "Implement your own `deepCopy` for JSON-like data (objects, arrays, primitives) in either language, then extend it to handle cyclic references without infinite recursion." },
    ],
    interviewQuestions: [
      { question: "What is the difference between pass-by-value and pass-by-reference?", answer: "Pass-by-value gives the function its own copy of the argument, so changes inside don't affect the caller. Pass-by-reference gives the function an alias to the caller's variable, so even assigning to the parameter changes the caller's variable." },
      { question: "Is JavaScript pass-by-value or pass-by-reference?", answer: "Always pass-by-value, but for objects the value is a reference. This is often called pass-by-sharing: a function can mutate an object you passed, but assigning a new object to the parameter doesn't change the caller's variable." },
      { question: "Why can't you write a `swap(a, b)` function in Python that swaps the caller's variables?", answer: "Python passes references to objects, not access to the caller's variables. Re-binding the parameters only changes local names. You swap at the call site instead: `a, b = b, a`." },
      { question: "What is aliasing?", answer: "Two or more names referring to the same object. A change made through one name is visible through all the others, which causes bugs when code assumes it has its own copy." },
      { question: "What is the difference between a shallow and a deep copy?", answer: "A shallow copy creates a new outer container but reuses the same nested objects. A deep copy recursively copies everything, so the result shares nothing mutable with the original." },
      { question: "What does `[[0] * 3] * 3` produce in Python, and why is it a trap?", answer: "A list containing three references to one inner list. Setting `grid[0][0] = 1` changes every row. Use `[[0] * 3 for _ in range(3)]` to create separate rows." },
      { question: "What is the problem with `def f(items=[])` in Python?", answer: "Default values are evaluated once, when the function is defined, so every call without an argument shares and mutates the same list. Use `items=None` and create a new list inside the function." },
      { question: "How do you deep-copy an object in modern JavaScript?", answer: "`structuredClone(obj)`. It handles nested objects, arrays, Maps, Sets, Dates and cycles, but not functions, DOM nodes or class prototypes. `JSON.parse(JSON.stringify(obj))` is an older workaround that loses `undefined`, Dates, Maps and cycles." },
      { question: "Why is sharing immutable objects such as strings safe?", answer: "Nobody can change an immutable object in place, so aliases can never observe a surprise change. Any 'modification' creates a new object." },
      { question: "How does Java pass objects to methods?", answer: "By value, where the value is a reference to the object. The method can mutate the object, but assigning a new object to the parameter has no effect on the caller." },
    ],
    prerequisites: ["variables-and-assignment", "functions-and-parameters", "basic-data-structures"],
    relatedTopics: ["mutability-and-immutability", "pointers-and-references", "stack-and-heap", "memory-management", "closures"],
    keywords: ["pass by value", "pass by reference", "pass by sharing", "aliasing", "shallow copy", "deep copy", "structuredClone", "deepcopy", "mutable default argument"],
  },
  {
    id: "stack-and-heap",
    title: "Stack and Heap",
    level: "intermediate",
    description: "The two main regions of program memory: the call stack for function frames and the heap for longer-lived data.",
    explanation: `
A running program uses memory in two main ways.

The **call stack** tracks the functions currently running. Every call
pushes a **stack frame** holding that call's parameters, local variables
and the address to return to. When the function returns, its frame is
popped and that memory is instantly reused. Stack memory is fast, automatic
and limited in size (often 1–8 MB per thread).

The **heap** is a large pool for data whose size or lifetime isn't tied to
a single call: objects, lists, strings built at run time, anything that
must outlive the function that created it. Heap memory is allocated on
request and freed later, either by you (C's \`free\`), by ownership rules
(Rust), or by a garbage collector (Python, JavaScript, Java, Go).

If calls nest too deeply (usually through runaway recursion), the stack
runs out of room: a **stack overflow**.
    `.trim(),
    analogy:
      "The stack is a pile of sticky notes on your desk: each task you start puts a note on top, and you throw it away when the task is done. It's quick but the desk is small. The heap is a warehouse: you can store big things there for as long as you need, but you have to keep track of what's where and someone has to clean it out.",
    examples: [
      {
        title: "Frames on the call stack (Python)",
        language: "python",
        code: `def square(n):
    result = n * n       # 'n' and 'result' live in square's frame
    return result

def sum_of_squares(a, b):
    return square(a) + square(b)

print(sum_of_squares(2, 3))  # 13`,
        walkthrough: [
          { code: "sum_of_squares(2, 3)", explanation: "A frame for sum_of_squares is pushed, holding a=2 and b=3." },
          { code: "square(a)", explanation: "A second frame for square is pushed on top, holding n=2." },
          { code: "return result", explanation: "square returns 4 and its frame is popped." },
          { code: "square(b)", explanation: "A fresh frame for square is pushed (n=3), returns 9 and is popped." },
          { code: "return ... + ...", explanation: "sum_of_squares returns 13 and its frame is popped too." },
        ],
      },
      {
        title: "Stack overflow from unbounded recursion",
        language: "javascript",
        code: `function countDown(n) {
  return countDown(n - 1); // no base case: never stops
}

countDown(10);
// RangeError: Maximum call stack size exceeded

// Python's equivalent raises:
// RecursionError: maximum recursion depth exceeded`,
      },
      {
        title: "Stack vs heap made explicit (Rust)",
        language: "rust",
        code: `fn main() {
    let x: i32 = 42;               // 4 bytes, stored in main's stack frame
    let boxed = Box::new(42);      // pointer on the stack, the i32 on the heap
    let names = vec!["a", "b"];    // Vec header (ptr, len, cap) on the stack,
                                   // the elements on the heap
    println!("{} {} {:?}", x, boxed, names);
}   // frame popped; boxed and names free their heap memory here`,
        explanation:
          "Rust makes the split visible: fixed-size values live on the stack by default, and `Box`, `Vec` and `String` own heap memory that is freed when their owner goes out of scope.",
      },
    ],
    howItWorks: `
The stack is a contiguous block with a **stack pointer** marking the top.
Calling a function moves the pointer to reserve space for the new frame;
returning moves it back. That's why stack allocation is almost free and
locals vanish when their function returns.

The heap is managed by an **allocator** that finds a free block of the
requested size, hands back its address and later reclaims it. That
bookkeeping is slower than bumping a pointer, and freed blocks can leave
gaps (**fragmentation**).

What lives where depends on the language:

- **C / C++ / Rust**: locals and fixed-size values on the stack; \`malloc\`,
  \`new\`, \`Box\`, \`Vec\`, \`String\` contents on the heap.
- **Java**: primitive locals and references on the stack; every object
  (\`new ...\`) on the heap. The JIT may still place non-escaping objects on
  the stack as an optimisation.
- **Python**: every value is a heap-allocated object; frames hold only
  references to them.
- **JavaScript**: objects, arrays and closures' captured variables are on
  the heap; the engine decides where primitives go.
    `.trim(),
    diagram: `
  High addresses
  +---------------------------+
  | Stack (grows down)        |
  |  frame: square  n=2       |  <- top (stack pointer)
  |  frame: sum_of_squares    |
  |  frame: main              |
  |            |              |
  |            v              |
  |                           |
  |            ^              |
  |            |              |
  | Heap (grows up)           |
  |  [list]  [User]  [string] |
  +---------------------------+
  | Static data, code         |
  +---------------------------+
  Low addresses   (simplified; real layouts vary by OS)
    `.trim(),
    whyItExists: `
Most data is temporary and tied to a single function call, so a stack gives
it extremely cheap, automatic memory. But some data must outlive its
creator, be shared, or have a size only known at run time. The heap covers
those cases at the cost of slower allocation and the need to free memory
eventually.
    `.trim(),
    whenToUse: `
This model matters when you reason about recursion depth, performance of
hot loops (heap allocation and GC pressure), why a returned pointer to a
local is a bug in C, why closures keep variables alive, and how memory use
grows. In systems languages you choose stack or heap explicitly; in managed
languages you mostly need it to understand behaviour and performance.
    `.trim(),
    whenNotToUse: `
In Python or JavaScript, don't try to "force" values onto the stack or
micro-optimise allocation without measuring: the runtime decides and
usually decides well. Don't use deep recursion on unbounded input
(tree depth from user data, long linked lists); an explicit stack or a loop
avoids the overflow.
    `.trim(),
    commonMistakes: [
      "Returning a pointer or reference to a local variable in C/C++. The frame is gone after the return, so the pointer dangles.",
      "Recursing over input of unknown size (a deeply nested JSON document, a long linked list) and hitting a stack overflow in production.",
      "Assuming 'stack' and 'heap' here are the stack and heap data structures. The call stack is LIFO like the data structure, but the memory heap has nothing to do with a binary heap.",
      "Assuming primitives always live on the stack in every language. In Python everything is a heap object; in Java and JavaScript placement is an engine detail.",
      "Allocating huge arrays as local variables in C (`int big[10000000];`), which can overflow the stack immediately.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Draw the call stack, frame by frame, for computing `factorial(4)` recursively. Mark when each frame is pushed and popped." },
      { difficulty: "Medium", prompt: "Find the maximum recursion depth in your language (Python: `sys.getrecursionlimit()`; JavaScript: count until RangeError). Then rewrite a recursive tree depth function to use an explicit stack." },
      { difficulty: "Hard", prompt: "In C or Rust, write a function that returns a dynamically sized array built inside it. Explain why it must live on the heap and who is responsible for freeing it." },
    ],
    interviewQuestions: [
      { question: "What is the difference between the stack and the heap?", answer: "The stack holds function call frames (parameters, locals, return addresses); it's fast, automatically managed and limited in size. The heap holds dynamically allocated data with flexible size and lifetime; it's larger but slower to allocate and must be freed manually, by ownership rules or by a garbage collector." },
      { question: "What is a stack frame?", answer: "The block of stack memory for one function call. It typically holds the arguments, local variables, saved registers and the return address. It's pushed on call and popped on return." },
      { question: "What causes a stack overflow?", answer: "Using more stack memory than is available, almost always from recursion that is too deep or never terminates, and occasionally from very large local arrays." },
      { question: "Why is stack allocation faster than heap allocation?", answer: "Stack allocation just moves the stack pointer, and freeing happens automatically on return. Heap allocation has to search for a suitable free block, track it, and later reclaim it, possibly with a garbage collector." },
      { question: "Why is returning a pointer to a local variable a bug in C?", answer: "The local lives in the function's stack frame, which is released when the function returns. The pointer then refers to memory that will be reused by the next call: a dangling pointer and undefined behaviour." },
      { question: "In Java, where do objects and primitive locals live?", answer: "Objects are allocated on the heap. Primitive local variables and references to objects live in the method's stack frame. The JIT can use escape analysis to avoid heap allocation for objects that never leave a method." },
      { question: "Where do values live in Python?", answer: "Every value is an object on the heap, including integers. Variables and frames hold references to those objects, and CPython frees objects through reference counting plus a cycle collector." },
      { question: "How can you avoid a stack overflow in deep recursion?", answer: "Convert the recursion to a loop with an explicit stack (or queue) on the heap, bound the input depth, or use tail calls in a language that guarantees tail-call optimisation (Python and most JavaScript engines don't)." },
      { question: "Does each thread have its own stack?", answer: "Yes. Each thread has its own call stack, while the heap is shared by all threads in the process. That's why locals are thread-private but heap objects need synchronisation when shared." },
    ],
    prerequisites: ["functions-and-parameters", "how-code-runs"],
    relatedTopics: ["memory-management-and-garbage-collection", "pointers-and-references", "recursion", "value-vs-reference", "processes-and-threads", "memory-management"],
    keywords: ["call stack", "stack frame", "heap", "stack overflow", "allocation", "recursion depth", "RecursionError", "Maximum call stack size exceeded", "dangling pointer"],
  },
  {
    id: "scope-and-lifetime",
    title: "Scope and Lifetime",
    level: "intermediate",
    description: "Where a name is visible (scope) versus how long its value exists (lifetime), including lexical scoping, shadowing and closures.",
    explanation: `
Two related but different questions:

- **Scope**: *where* in the code can this name be used?
- **Lifetime**: *how long* does the value exist while the program runs?

Common scope levels:

- **Global**: visible everywhere in the file or program.
- **Function**: visible anywhere inside one function.
- **Block**: visible only inside one \`{ ... }\` block, such as an \`if\` or a
  loop body (JavaScript \`let\`/\`const\`, Java, C, Rust). Python has no block
  scope: a variable assigned inside an \`if\` is visible in the rest of the
  function.

Almost all modern languages use **lexical (static) scoping**: a name is
resolved by looking at where the code is **written**, searching outward
through the enclosing blocks and functions. Declaring a new variable with
the same name as an outer one **shadows** it inside the inner scope.

A **closure** is a function that remembers variables from the scope where
it was defined. Those variables live as long as the closure does, even
after the outer function has returned. That's where scope and lifetime
visibly diverge.
    `.trim(),
    analogy:
      "Scope is like who can hear you: a whisper in a meeting room is only heard there, an announcement over the building speakers is heard everywhere. Lifetime is how long a note stays pinned to the board. A closure is a backpack: a function leaves the room, but packs the notes it needs and carries them along.",
    examples: [
      {
        title: "Block scope, function scope and shadowing (JavaScript)",
        language: "javascript",
        code: `const level = "global";

function show() {
  const level = "function";   // shadows the global 'level'
  if (true) {
    const level = "block";    // shadows the function's 'level'
    console.log(level);       // "block"
  }
  console.log(level);         // "function"
}

show();
console.log(level);           // "global"`,
        walkthrough: [
          { code: 'const level = "global";', explanation: "Declared at the top level, visible everywhere unless shadowed." },
          { code: 'const level = "function";', explanation: "A new variable inside show() hides the global one for the whole function." },
          { code: 'const level = "block";', explanation: "Another new variable that exists only inside the if block." },
          { code: "console.log(level);  // \"function\"", explanation: "Outside the block, the block's variable is gone, so the function's one is found." },
        ],
      },
      {
        title: "Closures keep variables alive (Python)",
        language: "python",
        code: `def make_counter():
    count = 0                 # local to make_counter...
    def increment():
        nonlocal count        # ...but captured by increment
        count += 1
        return count
    return increment

counter = make_counter()      # make_counter has returned
print(counter())  # 1
print(counter())  # 2         'count' outlived its function call`,
        explanation:
          "`nonlocal` tells Python that `count` refers to the enclosing function's variable. Without it, `count += 1` would create a new local and raise `UnboundLocalError`.",
      },
      {
        title: "Late binding in loops (Python) vs per-iteration let (JavaScript)",
        language: "python",
        code: `funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])   # [2, 2, 2]  all share the same 'i'

funcs = [lambda i=i: i for i in range(3)]
print([f() for f in funcs])   # [0, 1, 2]  default captures the current value

# JavaScript: 'let' creates a fresh binding per iteration, so this logs 0 1 2.
# With 'var' (function-scoped) it would log 3 3 3.
# for (let i = 0; i < 3; i++) setTimeout(() => console.log(i));`,
      },
    ],
    howItWorks: `
Each function call and each block creates an **environment**: a table of
names to values, linked to the environment it was written inside. Looking
up a name walks this chain outward (local, then enclosing functions, then
global, then built-ins) until it finds a match. Python names this order
**LEGB**: Local, Enclosing, Global, Built-in.

Because the chain follows where code is **written**, not where it's
**called** from, scoping is "lexical". (Dynamic scoping, which follows the
call chain, survives mainly in shell scripts and Emacs Lisp.)

Lifetime is separate. A local is normally discarded when its function
returns. But if a closure still references the environment, the runtime
keeps it alive on the heap until nothing references it any more. Globals
live for the whole program. In languages without GC (C, Rust), lifetime is
tied to scope directly: a value is destroyed when its owning scope ends.
    `.trim(),
    diagram: `
  Name lookup walks outward (lexical scope chain)

  +-- global ------------------------------+
  |  level = "global"                      |
  |  +-- show() --------------------------+|
  |  |  level = "function"                ||
  |  |  +-- if block -------------------+ ||
  |  |  |  level = "block"   <- found    | ||
  |  |  |  console.log(level)           | ||
  |  |  +-------------------------------+ ||
  |  +------------------------------------+|
  +----------------------------------------+
    `.trim(),
    whyItExists: `
Scopes let you reuse short, natural names (\`i\`, \`result\`, \`user\`)
without colliding with code elsewhere, and keep each piece of state visible
only to the code that needs it. Lexical scoping makes code readable: you
can tell what a name refers to just by reading the surrounding text.
Closures give functions private, persistent state without classes or
globals.
    `.trim(),
    whenToUse: `
Declare every variable in the narrowest scope that works, as close as
possible to where it's used. Use closures for callbacks, event handlers,
factory functions, memoisation and small pieces of private state. Prefer
block-scoped declarations (\`let\`/\`const\` in JavaScript) over
function-scoped \`var\`.
    `.trim(),
    whenNotToUse: `
Avoid global mutable variables: any code can change them, which makes bugs
hard to trace and tests interfere with each other. Avoid shadowing names in
ways that confuse readers (an inner \`user\` hiding an outer \`user\` a few
lines up). Don't use closures to hold large data longer than needed; the
captured values can't be garbage-collected while the closure is reachable.
    `.trim(),
    commonMistakes: [
      "Assuming Python has block scope. A variable assigned inside an `if` or `for` is still visible after the block.",
      "Assigning to an outer variable inside a Python function without `global` or `nonlocal`, which creates a new local and often raises `UnboundLocalError`.",
      "Using `var` in a JavaScript loop with callbacks, so every callback sees the final loop value.",
      "Creating closures in a Python loop and expecting each to capture that iteration's value (they capture the variable, not the value).",
      "Accidentally keeping large objects alive through a long-lived closure or event listener, causing a memory leak.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a snippet with a global, a function-level and a block-level variable of the same name, and predict what each print/log statement outputs before running it." },
      { difficulty: "Medium", prompt: "Write `makeRateLimiter(maxCalls)` that returns a function which returns true for the first `maxCalls` calls and false afterwards, using a closure for the counter. Do it in both Python and JavaScript." },
      { difficulty: "Hard", prompt: "Implement a `memoize(fn)` higher-order function using a closure over a cache. Then add a way to clear the cache and explain how the closure affects the cache's lifetime." },
    ],
    interviewQuestions: [
      { question: "What is the difference between scope and lifetime?", answer: "Scope is the region of source code where a name can be referenced. Lifetime is the period during execution when the value actually exists in memory. A closure-captured variable is out of scope for the caller but its lifetime continues." },
      { question: "What is lexical scoping?", answer: "Resolving a name based on where the code is written: the lookup searches the enclosing blocks and functions in the source text, not the chain of callers at run time." },
      { question: "What is shadowing?", answer: "Declaring a variable in an inner scope with the same name as one in an outer scope. Inside the inner scope, the name refers to the new variable and the outer one is hidden." },
      { question: "Does Python have block scope?", answer: "No. Python has function, module (global), class and built-in scopes. Variables assigned inside `if`, `for` or `while` blocks remain visible in the rest of the function. Comprehensions do have their own scope." },
      { question: "What is a closure?", answer: "A function together with references to the variables of the scope it was defined in. It can read (and, with `nonlocal` in Python or directly in JS, modify) those variables even after the outer function has returned." },
      { question: "What is the difference between `var` and `let` in JavaScript scoping?", answer: "`var` is function-scoped and hoisted, so it's visible throughout the function. `let` and `const` are block-scoped and can't be used before their declaration (the temporal dead zone). In loops, `let` creates a new binding per iteration." },
      { question: "What does LEGB mean in Python?", answer: "The name lookup order: Local, Enclosing (outer functions), Global (module), Built-in. Python uses the first match it finds." },
      { question: "Why does this raise `UnboundLocalError`? `x = 1; def f(): print(x); x = 2`", answer: "Because `x` is assigned somewhere in `f`, Python treats it as local for the whole function. The `print(x)` runs before that local has a value. Use `global x` if you meant the module variable." },
      { question: "What is dynamic scoping and where is it still used?", answer: "Resolving names through the chain of active function calls instead of the source text. It's used in Bash and Emacs Lisp; most other languages use lexical scoping because it's easier to reason about." },
      { question: "How can closures cause memory leaks?", answer: "A closure keeps every variable it captures reachable. If the closure is stored somewhere long-lived (an event listener, a global cache, a timer) and captures large data, that data can never be collected until the closure itself is removed." },
    ],
    prerequisites: ["variables-and-assignment", "functions-and-parameters"],
    relatedTopics: ["closures", "stack-and-heap", "functional-programming", "memory-management-and-garbage-collection"],
    keywords: ["scope", "lifetime", "lexical scope", "block scope", "function scope", "global scope", "shadowing", "closure", "LEGB", "nonlocal", "var let const", "hoisting"],
  },
  {
    id: "mutability-and-immutability",
    title: "Mutability and Immutability",
    level: "intermediate",
    description: "Data that can change in place versus data that never changes, and why immutable data makes programs easier to reason about.",
    explanation: `
A **mutable** value can be changed after it's created: you can append to a
list, set a field on an object, or overwrite an array element. An
**immutable** value can't: any "change" produces a new value and leaves the
original untouched.

In Python, \`list\`, \`dict\` and \`set\` are mutable; \`int\`, \`float\`,
\`str\`, \`tuple\` and \`frozenset\` are immutable. In JavaScript, primitives
(numbers, strings, booleans) are immutable while objects and arrays are
mutable. Rust makes every variable immutable unless you write \`mut\`.

Note the difference between an immutable **binding** and an immutable
**value**. JavaScript's \`const\` and Java's \`final\` stop you from
re-assigning the variable, but the object it points to can still be
changed.

Immutable data removes a whole category of bugs: if nothing can change, no
other part of the program can surprise you by changing it.
    `.trim(),
    analogy:
      "A mutable value is a whiteboard: anyone with access can erase and rewrite it, so what you read depends on who was there last. An immutable value is a printed page: to change it you print a new edition, and anyone holding the old edition still sees exactly what they had.",
    examples: [
      {
        title: "Mutating vs creating new values (JavaScript)",
        language: "javascript",
        code: `const scores = [3, 1, 2];

// Mutating: changes the original array
scores.sort();              // scores is now [1, 2, 3]

// Non-mutating: returns a new array, original untouched
const original = [3, 1, 2];
const sorted = original.toSorted();     // [1, 2, 3]
const withFour = [...original, 4];      // [3, 1, 2, 4]
console.log(original);                  // [3, 1, 2]

const user = Object.freeze({ name: "Ana", tags: ["a"] });
user.name = "Bo";        // ignored (TypeError in strict mode)
user.tags.push("b");     // works! freeze is shallow`,
        walkthrough: [
          { code: "scores.sort();", explanation: "sort() reorders the array in place, so every reference to it sees the new order." },
          { code: "original.toSorted();", explanation: "toSorted() (ES2023) returns a sorted copy and leaves the original alone." },
          { code: "[...original, 4]", explanation: "Spread builds a new array instead of pushing onto the old one." },
          { code: "Object.freeze({...})", explanation: "Prevents changes to the object's own properties, but not to objects nested inside it." },
        ],
      },
      {
        title: "Immutable records in Python",
        language: "python",
        code: `from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Point:
    x: int
    y: int

p = Point(1, 2)
# p.x = 5             # FrozenInstanceError
moved = replace(p, x=5)   # a new Point(5, 2); p is still Point(1, 2)

name = "ana"
upper = name.upper()      # strings are immutable: a new string is returned
print(name, upper)        # ana ANA`,
      },
      {
        title: "Defensive copying at a boundary",
        language: "python",
        code: `class Team:
    def __init__(self, members):
        self._members = list(members)   # copy in: caller can't change our state

    @property
    def members(self):
        return tuple(self._members)     # copy out: caller gets a read-only view

names = ["ana", "bo"]
team = Team(names)
names.append("eve")       # does not affect team
print(team.members)       # ('ana', 'bo')`,
        explanation:
          "Defensive copying protects an object's internal state from callers who keep a reference to the data they passed in or got back.",
      },
    ],
    howItWorks: `
For an immutable value, every "update" operation allocates a new value.
Naively that means copying everything, which would be slow for large
collections. **Persistent data structures** solve this with **structural
sharing**: the new version reuses most of the old version's internal nodes
and only creates new nodes along the path that changed. Updating one
element of a persistent vector with a million items copies a handful of
small nodes, not a million elements. Clojure's collections, Immutable.js
and Scala's immutable collections work this way.

Language support varies:

- **Rust**: immutable by default; \`mut\` opts in. The borrow checker also
  forbids mutation while other references exist.
- **Python**: immutable built-in types, \`frozen=True\` dataclasses, tuples.
- **JavaScript**: \`Object.freeze\` (shallow), non-mutating array methods
  (\`map\`, \`filter\`, \`toSorted\`, \`with\`), spread syntax.
- **Java**: \`final\` fields, \`record\` classes, \`List.of(...)\` unmodifiable
  collections.
    `.trim(),
    diagram: `
  Structural sharing: update index 3 in a persistent tree

     old root               new root
       /   \\                  /   \\
     A       B    ------>   A      B'     only the path to the
    / \\     / \\            (shared) / \\     changed leaf is copied
   1   2   3   4                   3'  4  (4 is shared)
    `.trim(),
    whyItExists: `
Shared mutable state is the root of many bugs: an object changed by code
you didn't expect, a list modified while being iterated, data races between
threads. Immutable values can be shared freely, cached safely, used as
dictionary keys, compared cheaply by reference, and reasoned about locally.
They also make undo/redo, time-travel debugging and change detection (as in
React) straightforward: if the reference changed, the data changed.
    `.trim(),
    whenToUse: `
Prefer immutable data for configuration, values passed between modules,
state shared across threads, keys in hash maps, and application state in UI
frameworks that compare references. Use \`const\`/\`final\`/non-\`mut\`
bindings by default and make something mutable only when it needs to be.
    `.trim(),
    whenNotToUse: `
Inside a tight loop that builds up a large result (filling a buffer,
accumulating a big list), local mutation is simpler and faster than
creating a new collection each step. That mutation is safe as long as the
mutable object doesn't escape the function. Repeated string concatenation in
a loop is a classic case: build a list and \`join\` it instead.
    `.trim(),
    commonMistakes: [
      "Believing `const` in JavaScript makes an object immutable. It only prevents re-assigning the variable.",
      "Relying on `Object.freeze` for nested data. It's shallow: nested objects and arrays remain mutable.",
      "Mutating props or state directly in React (e.g. `state.items.push(x)`), so the reference doesn't change and the UI doesn't re-render.",
      "Using a mutable object (a list or dict) as a dictionary key or set member in Python, which raises `TypeError: unhashable type`.",
      "Building a large string with `+=` in a loop, creating a new string every iteration instead of joining a list once.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Rewrite a function that adds an item to a shopping cart by calling `cart.push(item)` so that it returns a new cart and leaves the original unchanged." },
      { difficulty: "Medium", prompt: "Write `deepFreeze(obj)` in JavaScript that recursively freezes an object and all nested objects and arrays. Test that nested mutations fail in strict mode." },
      { difficulty: "Hard", prompt: "Implement a persistent (immutable) singly linked list with `prepend`, `head` and `tail`. Show that prepending to a list of length n creates one new node and shares the rest." },
    ],
    interviewQuestions: [
      { question: "What is the difference between mutable and immutable data?", answer: "Mutable data can be modified in place after creation. Immutable data can't; every modification produces a new value and the original stays the same." },
      { question: "Does `const` make an object immutable in JavaScript?", answer: "No. `const` prevents re-assigning the variable, but the object it refers to can still be mutated. Use `Object.freeze` (shallow) or immutable update patterns for the value itself." },
      { question: "Which built-in Python types are immutable?", answer: "`int`, `float`, `complex`, `bool`, `str`, `bytes`, `tuple`, `frozenset` and `None`. A tuple is only as immutable as its contents: a tuple holding a list can't be re-pointed but the list can still change." },
      { question: "Why must dictionary keys be immutable in Python?", answer: "A dict stores keys by their hash. If a key's contents changed, its hash would change and the dict could no longer find it. So keys must be hashable, which for built-ins means immutable." },
      { question: "What are the main benefits of immutability?", answer: "No surprise changes from aliases, safe sharing between threads without locks, easy caching and memoisation, cheap change detection by reference comparison, and simpler reasoning and testing." },
      { question: "What is a persistent data structure?", answer: "An immutable data structure where an update returns a new version while keeping the old one intact, usually sharing most of the internal structure between versions so updates stay cheap (often O(log n))." },
      { question: "What is structural sharing?", answer: "Reusing the unchanged parts of an existing immutable structure in a new version. Only nodes on the path to the change are copied, so memory and time costs stay small." },
      { question: "What is defensive copying?", answer: "Copying mutable data when it enters or leaves an object, so callers can't change the object's internal state through a reference they kept or received." },
      { question: "Is immutability always slower?", answer: "Not necessarily. Allocating new values costs something, but structural sharing keeps it small, and immutability enables optimisations like skipping work when references are equal. For hot local loops, controlled mutation is usually faster." },
      { question: "How does Rust handle mutability?", answer: "Variables are immutable by default and need `mut` to change. The borrow checker allows either many shared (`&T`) references or one mutable (`&mut T`) reference at a time, which rules out data races at compile time." },
    ],
    prerequisites: ["value-vs-reference", "basic-data-structures"],
    relatedTopics: ["functional-programming", "concurrency-and-race-conditions", "value-vs-reference", "hash-tables"],
    keywords: ["mutable", "immutable", "immutability", "persistent data structure", "structural sharing", "defensive copy", "Object.freeze", "frozen dataclass", "const vs immutable", "final"],
  },
  {
    id: "object-oriented-programming",
    title: "Object-Oriented Programming",
    level: "intermediate",
    description: "Organising code around objects that bundle data with behaviour: classes, encapsulation, abstraction, inheritance, polymorphism and interfaces.",
    explanation: `
**Object-oriented programming (OOP)** organises code around **objects**:
bundles of data (fields) and the functions that operate on that data
(methods). A **class** is a blueprint; each object created from it is an
**instance** with its own data.

Four ideas are usually listed as the pillars of OOP:

- **Encapsulation**: keep an object's data private and expose only methods
  that keep it valid. A \`BankAccount\` lets you \`deposit\` and \`withdraw\`,
  not set \`balance\` to any number you like.
- **Abstraction**: expose *what* an object does and hide *how*. You call
  \`file.read()\` without knowing about disk sectors.
- **Inheritance**: a class can extend another, reusing and specialising its
  behaviour (\`SavingsAccount\` extends \`BankAccount\`).
- **Polymorphism**: code written against a general type works with any
  specific type. Calling \`shape.area()\` runs the right version for a
  circle or a square, chosen at run time (**dynamic dispatch**).

An **interface** describes a set of methods without implementing them.
Any class that provides those methods can be used wherever the interface is
expected.
    `.trim(),
    analogy:
      "A class is a cookie cutter and objects are the cookies. Encapsulation is a vending machine: you press buttons, you don't reach inside. Polymorphism is a universal remote's 'power' button: one button, but each device turns itself on its own way.",
    examples: [
      {
        title: "Encapsulation: a class that protects its invariants (Python)",
        language: "python",
        code: `class BankAccount:
    def __init__(self, owner: str):
        self.owner = owner
        self._balance = 0          # leading underscore: internal by convention

    def deposit(self, amount: int) -> None:
        if amount <= 0:
            raise ValueError("Deposit must be positive")
        self._balance += amount

    def withdraw(self, amount: int) -> None:
        if amount > self._balance:
            raise ValueError("Insufficient funds")
        self._balance -= amount

    @property
    def balance(self) -> int:      # read-only from outside
        return self._balance

account = BankAccount("Ana")
account.deposit(100)
account.withdraw(30)
print(account.balance)   # 70`,
        walkthrough: [
          { code: "class BankAccount:", explanation: "Defines the blueprint for account objects." },
          { code: "def __init__(self, owner):", explanation: "The constructor runs when an instance is created and sets its starting state." },
          { code: "self._balance = 0", explanation: "The balance is internal. Outside code should use the methods, which enforce the rules." },
          { code: "def withdraw(self, amount):", explanation: "Methods check the rules (no overdrafts) before changing state, so the balance can never become invalid." },
          { code: "@property def balance", explanation: "Exposes the balance for reading without allowing direct assignment." },
        ],
      },
      {
        title: "Polymorphism through an interface (TypeScript)",
        language: "typescript",
        code: `interface Shape {
  area(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  area() { return Math.PI * this.radius ** 2; }
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  area() { return this.width * this.height; }
}

function totalArea(shapes: Shape[]): number {
  // Doesn't know or care which concrete class each shape is
  return shapes.reduce((sum, shape) => sum + shape.area(), 0);
}

totalArea([new Circle(1), new Rectangle(2, 3)]); // ~9.14`,
        explanation:
          "`totalArea` depends only on the `Shape` interface. Adding a `Triangle` later requires no change to it: the right `area()` is chosen at run time for each object.",
      },
      {
        title: "Inheritance and overriding (Java)",
        language: "java",
        code: `abstract class Animal {
    abstract String sound();
    String describe() { return getClass().getSimpleName() + " says " + sound(); }
}

class Dog extends Animal {
    @Override String sound() { return "woof"; }
}

class Cat extends Animal {
    @Override String sound() { return "meow"; }
}

Animal pet = new Cat();
System.out.println(pet.describe()); // "Cat says meow"`,
      },
    ],
    howItWorks: `
An object is, roughly, a block of data plus a pointer to its class. When
you call \`obj.method()\`, the runtime looks the method up starting at the
object's **actual** class, not the declared type of the variable. In
compiled languages like C++ and Java this is often a **vtable**: a table of
function pointers per class, so the call is one indirect jump. In Python and
JavaScript, the lookup walks the class hierarchy (Python's method
resolution order) or the prototype chain at run time.

That lookup is **dynamic dispatch**, and it's what makes polymorphism work:
the same call site runs different code depending on the object.

Encapsulation is enforced differently per language: \`private\` in Java and
C# is checked by the compiler; TypeScript's \`private\` only at compile time
(\`#field\` is truly private at run time); Python relies on the \`_name\`
convention.
    `.trim(),
    diagram: `
  Dynamic dispatch: pet.describe() where pet is a Cat

  variable pet (declared Animal) --> [Cat object]
                                         |
                                         v
                                    Cat vtable
                                    sound()    -> Cat.sound     "meow"
                                    describe() -> Animal.describe (inherited)
    `.trim(),
    whyItExists: `
As programs grow, data and the code that changes it get scattered, and any
part can break any other part's assumptions. OOP groups them, puts rules
next to the data they protect, and lets you swap implementations behind a
stable interface. It also maps naturally onto many domains (users, orders,
documents, UI widgets) and onto GUI and simulation software where it first
became popular.
    `.trim(),
    whenToUse: `
Use classes when you have state with rules that must always hold
(invariants), several implementations of the same behaviour (payment
providers, storage backends, shapes), or long-lived entities with identity.
Use interfaces at module boundaries so callers depend on behaviour rather
than concrete classes.
    `.trim(),
    whenNotToUse: `
Don't wrap everything in a class. Stateless logic is often clearer as a
plain function, and plain data is often clearer as a record, dict or
struct. Avoid deep inheritance hierarchies; they become rigid and fragile.
Avoid classes that are only getters and setters around public data: that
adds ceremony without encapsulating anything.
    `.trim(),
    commonMistakes: [
      "Using inheritance just to reuse code when the subclass isn't truly a kind of the parent; composition is usually better.",
      "Exposing all fields with public setters, which defeats encapsulation because any code can put the object in an invalid state.",
      "Creating 'god objects' that know and do everything, instead of small classes with one clear responsibility.",
      "Confusing a class with an instance, for example storing per-instance data in a class-level attribute that all instances then share.",
      "Checking types with `if isinstance(...)` / `instanceof` chains instead of letting polymorphism pick the behaviour.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a `Rectangle` class with width and height, a method for area and perimeter, and a constructor that rejects non-positive sizes." },
      { difficulty: "Medium", prompt: "Define a `Notifier` interface with `send(message)`, and implement `EmailNotifier` and `SmsNotifier`. Write a function that sends a message through a list of notifiers without knowing their concrete types." },
      { difficulty: "Hard", prompt: "Model a library system (books, members, loans) with classes that enforce rules: a member can borrow at most 3 books, a book can't be lent twice. Write tests that try to break each rule." },
    ],
    interviewQuestions: [
      { question: "What are the four pillars of OOP?", answer: "Encapsulation (hiding internal state behind methods), abstraction (exposing what an object does, not how), inheritance (deriving a class from another to reuse and specialise behaviour), and polymorphism (one interface, many implementations chosen at run time)." },
      { question: "What is the difference between a class and an object?", answer: "A class is a definition or blueprint describing fields and methods. An object is a concrete instance of a class, with its own copy of the instance data." },
      { question: "What is encapsulation and why does it matter?", answer: "Bundling data with the methods that operate on it and restricting direct access to the data. It lets the class enforce invariants and change its internals without breaking callers." },
      { question: "What is the difference between abstraction and encapsulation?", answer: "Abstraction is about design: presenting a simple interface that hides complexity. Encapsulation is the mechanism: restricting access to internal state. Encapsulation is one way to achieve abstraction." },
      { question: "What is dynamic dispatch?", answer: "Choosing which method implementation to run based on the object's actual run-time class rather than the variable's declared type. It's how overridden methods get called through a base-class reference." },
      { question: "What is the difference between overriding and overloading?", answer: "Overriding is a subclass providing its own implementation of an inherited method, resolved at run time. Overloading is several methods with the same name but different parameter lists, resolved at compile time (Java, C#). Python and JavaScript don't support overloading directly." },
      { question: "What is the difference between an interface and an abstract class?", answer: "An interface declares methods a class must provide, usually without state, and a class can implement many. An abstract class can include fields and implemented methods, but a class can typically extend only one." },
      { question: "How does Python enforce private attributes?", answer: "It doesn't strictly. A single underscore (`_x`) is a convention meaning 'internal'. A double underscore (`__x`) triggers name mangling to `_ClassName__x`, which avoids accidental clashes in subclasses but is still accessible." },
      { question: "How do objects work in JavaScript without classes?", answer: "Through prototypes. Every object has a link to a prototype object, and property lookups that miss on the object continue up the prototype chain. The `class` syntax is sugar over this mechanism." },
      { question: "What is a common criticism of OOP?", answer: "Overuse leads to deep inheritance hierarchies, scattered mutable state and excess ceremony for simple problems. Many modern codebases mix OOP with functional techniques and prefer composition over inheritance." },
    ],
    prerequisites: ["functions-and-parameters", "basic-data-structures", "type-systems"],
    relatedTopics: ["inheritance-vs-composition", "design-patterns-overview", "programming-paradigms", "solid-principles", "prototypes", "coupling-and-cohesion"],
    keywords: ["OOP", "class", "object", "instance", "encapsulation", "abstraction", "inheritance", "polymorphism", "dynamic dispatch", "interface", "vtable", "method overriding"],
  },
  {
    id: "inheritance-vs-composition",
    title: "Inheritance vs Composition",
    level: "intermediate",
    description: "Two ways to reuse behaviour: extending a class (is-a) or holding other objects (has-a), and why composition is usually preferred.",
    explanation: `
There are two main ways to build a class from existing behaviour:

- **Inheritance** ("is-a"): \`class Dog extends Animal\`. The subclass gets
  all of the parent's fields and methods and can override some.
- **Composition** ("has-a"): \`class Car { engine: Engine }\`. The class
  holds other objects and **delegates** work to them.

Inheritance is tempting because it reuses code with one keyword, but it
couples the subclass tightly to the parent's internals. When the parent
changes, subclasses can break in surprising ways: the **fragile base class
problem**. Inheritance is also fixed when the code is written; you can't
swap a parent at run time.

Composition keeps parts independent and replaceable, so the common advice
from *Design Patterns* (1994) is **favour composition over inheritance**.

**Mixins** and **traits** sit in between: small reusable bundles of methods
you add to a class (Python mixin classes, Rust and Scala traits, PHP
traits), giving reuse without a deep hierarchy.
    `.trim(),
    analogy:
      "Inheritance is being born into a family: you get all the traits, wanted or not, and can't change parents later. Composition is assembling a team: you pick a driver, a navigator and a mechanic, and you can replace any of them if a better one comes along.",
    examples: [
      {
        title: "Fragile base class: a subclass broken by the parent's internals",
        language: "python",
        code: `class Collection:
    def __init__(self):
        self.items = []

    def add(self, item):
        self.items.append(item)

    def add_all(self, items):
        for item in items:
            self.add(item)          # internally calls add()


class CountingCollection(Collection):
    def __init__(self):
        super().__init__()
        self.added = 0

    def add(self, item):
        self.added += 1
        super().add(item)

    def add_all(self, items):
        self.added += len(items)
        super().add_all(items)      # which calls our add() again!

c = CountingCollection()
c.add_all(["a", "b", "c"])
print(c.added)   # 6, not 3`,
        walkthrough: [
          { code: "def add_all(self, items): ... self.add(item)", explanation: "The base class happens to implement add_all by calling add. That's an internal detail." },
          { code: "def add(self, item): self.added += 1", explanation: "The subclass counts in add..." },
          { code: "self.added += len(items)", explanation: "...and also in add_all, assuming add_all doesn't use add." },
          { code: "print(c.added)  # 6", explanation: "Each item is counted twice. If the base class later stops calling add, the count silently changes again." },
        ],
      },
      {
        title: "The same feature with composition",
        language: "python",
        code: `class CountingCollection:
    def __init__(self, inner):
        self._inner = inner          # has-a Collection
        self.added = 0

    def add(self, item):
        self.added += 1
        self._inner.add(item)

    def add_all(self, items):
        for item in items:
            self.add(item)           # only our own methods, no hidden coupling

c = CountingCollection(Collection())
c.add_all(["a", "b", "c"])
print(c.added)   # 3`,
        explanation:
          "The wrapper only uses the inner object's public methods, so changes to how `Collection` is implemented internally can't break its counting.",
      },
      {
        title: "Traits: shared behaviour without a hierarchy (Rust)",
        language: "rust",
        code: `trait Describe {
    fn name(&self) -> String;
    fn describe(&self) -> String {          // default method
        format!("This is {}", self.name())
    }
}

struct User { username: String }
struct Product { title: String }

impl Describe for User {
    fn name(&self) -> String { self.username.clone() }
}
impl Describe for Product {
    fn name(&self) -> String { self.title.clone() }
}`,
      },
    ],
    howItWorks: `
With inheritance, the subclass and parent share one object. The parent's
methods can call methods the subclass overrides, so the two are woven
together: the subclass depends on *when and how* the parent calls its own
methods, which is rarely documented and easy to change by accident.

With composition, the outer object holds a reference to the inner one and
forwards calls explicitly (**delegation**). The only contract is the inner
object's public interface. You can pass in a different implementation
(dependency injection), wrap it for testing, or combine several behaviours
without multiple inheritance.

Mixins and traits supply methods to a class without being its "parent" in
the domain sense. Python mixins rely on multiple inheritance and the method
resolution order (MRO); Rust traits are interfaces that can carry default
methods and are implemented separately for each type.
    `.trim(),
    diagram: `
  Inheritance (is-a)                 Composition (has-a)

     Animal                            Car
       ^                            +--------------+
       |  extends                   | engine  -----+--> Engine
     Dog                            | wheels  -----+--> Wheel[4]
                                    | radio   -----+--> Radio
  fixed at compile time,            +--------------+
  shares internals                  parts swappable, uses public APIs
    `.trim(),
    whyItExists: `
Inheritance was oversold in early OOP as the main tool for reuse, and large
hierarchies proved hard to change: a modification at the top rippled
through every subclass, and real-world categories rarely form a clean tree
(is a flying penguin-robot a Bird or a Machine?). Composition emerged as the
default because it keeps components loosely coupled and lets behaviour be
mixed and swapped freely.
    `.trim(),
    whenToUse: `
Use **inheritance** for a genuine, stable "is-a" relationship where the
subclass can be used anywhere the parent can (the Liskov substitution
principle), typically shallow, and especially when a framework is designed
for it (abstract base classes, UI component base classes). Use
**composition** for everything else: adding behaviour, swapping
implementations, wrapping for logging or caching, or combining features.
    `.trim(),
    whenNotToUse: `
Don't inherit just to reuse a few methods, and don't inherit from classes
not designed for extension (many standard library collections). Don't
compose blindly either: writing dozens of forwarding methods to imitate an
"is-a" relationship that really holds is just inheritance done the hard way.
    `.trim(),
    commonMistakes: [
      "Using inheritance for code reuse when there's no real is-a relationship (e.g. `Stack extends ArrayList`, which exposes methods that break stack behaviour).",
      "Building deep hierarchies (five or more levels) where understanding one class means reading all its ancestors.",
      "Overriding a method without knowing which other parent methods call it, causing double-counting or recursion bugs.",
      "Creating a subclass that can't honour the parent's contract (a `Square` that breaks `Rectangle`'s independent width and height), violating Liskov substitution.",
      "Mixing many Python mixins without understanding the MRO, so it's unclear which method actually runs.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "For each pair decide whether it's is-a or has-a: Car/Engine, Manager/Employee, Order/LineItem, Circle/Shape, Logger/FileWriter." },
      { difficulty: "Medium", prompt: "Refactor a `LoggingList extends list` (Python) or `LoggingArray extends Array` (JS) into a class that composes a list and logs every add and remove." },
      { difficulty: "Hard", prompt: "Design game characters that can fly, swim and/or attack in any combination, first with inheritance and then with composition (behaviour objects or traits). Compare how many classes each approach needs for 5 abilities." },
    ],
    interviewQuestions: [
      { question: "What is the difference between inheritance and composition?", answer: "Inheritance creates an is-a relationship where a subclass reuses and specialises a parent class. Composition creates a has-a relationship where a class holds other objects and delegates to them through their public interfaces." },
      { question: "What does 'favour composition over inheritance' mean?", answer: "Prefer building behaviour by combining objects rather than extending classes, because composition gives looser coupling, run-time flexibility and fewer surprises when parts change. Use inheritance only for real, stable is-a relationships." },
      { question: "What is the fragile base class problem?", answer: "Changes to a base class's implementation (not just its interface) can break subclasses, because subclasses depend on internal details like which methods call which. The parent can't safely evolve without knowing every subclass." },
      { question: "What is the Liskov substitution principle?", answer: "Objects of a subclass should be usable anywhere the parent type is expected without breaking correctness. A subclass must keep the parent's promises: no stronger preconditions, no weaker postconditions." },
      { question: "Why is Square extending Rectangle a classic problem?", answer: "A Rectangle lets you set width and height independently. A Square must keep them equal, so code that sets width then height on what it thinks is a Rectangle gets a wrong area. Square can't honour Rectangle's contract." },
      { question: "What is a mixin?", answer: "A small class that provides a specific set of methods to be combined into other classes, usually through multiple inheritance, without being a meaningful parent type. For example a `JsonSerializableMixin` adding `to_json()`." },
      { question: "What is a trait (in Rust or Scala)?", answer: "A named set of methods a type can implement, optionally with default implementations. Types gain shared behaviour by implementing traits, without a class hierarchy. Rust has no struct inheritance at all; traits are its main reuse mechanism." },
      { question: "What is delegation?", answer: "An object handling a request by forwarding it to another object it holds. It's the mechanism behind composition, and the basis of patterns like Decorator, Strategy and Proxy." },
      { question: "When is inheritance the right choice?", answer: "When there's a genuine is-a relationship that satisfies Liskov substitution, the hierarchy is shallow and stable, or a framework is explicitly designed for extension through subclassing (template methods, abstract base classes)." },
    ],
    prerequisites: ["object-oriented-programming"],
    relatedTopics: ["object-oriented-programming", "design-patterns-overview", "solid-principles", "coupling-and-cohesion", "dependency-inversion"],
    keywords: ["inheritance", "composition", "is-a", "has-a", "fragile base class", "composition over inheritance", "delegation", "mixin", "trait", "Liskov substitution"],
  },
  {
    id: "functional-programming",
    title: "Functional Programming",
    level: "intermediate",
    description: "Building programs from pure functions, first-class and higher-order functions, map/filter/reduce, immutability, currying and composition.",
    explanation: `
**Functional programming (FP)** builds programs by combining functions
rather than by changing state step by step. Its core ideas:

- **Pure functions**: the output depends only on the inputs, and calling
  the function has no side effects (no mutation, no I/O, no global
  changes). Same input, same output, every time.
- **First-class functions**: functions are values. You can store them in
  variables, pass them as arguments and return them.
- **Higher-order functions**: functions that take or return other
  functions, like \`map\`, \`filter\` and \`reduce\`.
- **Immutability**: instead of changing data, create new data.
- **Currying**: turning a function of several arguments into a chain of
  one-argument functions: \`add(a, b)\` becomes \`add(a)(b)\`.
- **Composition**: building a new function by chaining existing ones, so
  the output of one becomes the input of the next.

You don't need a "functional language" to use these ideas. JavaScript,
Python, Java, Rust and C# all support them, and most modern code mixes FP
with other styles.
    `.trim(),
    analogy:
      "A pure function is a vending machine that always gives the same snack for the same button, and doesn't secretly rearrange the shop. Composition is an assembly line: each station does one job and passes the result to the next.",
    examples: [
      {
        title: "Pure vs impure functions (JavaScript)",
        language: "javascript",
        code: `// Impure: depends on and changes outside state
let total = 0;
function addToTotal(amount) {
  total += amount;      // side effect
  return total;         // result depends on history
}

// Pure: same input, same output, no side effects
function add(a, b) {
  return a + b;
}

addToTotal(5); // 5
addToTotal(5); // 10  (same call, different result)
add(2, 3);     // 5, always`,
        walkthrough: [
          { code: "let total = 0;", explanation: "State that lives outside the function." },
          { code: "total += amount;", explanation: "Changing outside state is a side effect, so addToTotal is impure." },
          { code: "addToTotal(5); // then 10", explanation: "The same call gives different results depending on what happened before." },
          { code: "function add(a, b) { return a + b; }", explanation: "Uses only its inputs and changes nothing, so it's pure and trivially testable." },
        ],
      },
      {
        title: "map, filter and reduce instead of a loop",
        language: "python",
        code: `from functools import reduce

orders = [
    {"item": "book", "price": 12, "paid": True},
    {"item": "pen", "price": 2, "paid": False},
    {"item": "lamp", "price": 30, "paid": True},
]

paid = filter(lambda order: order["paid"], orders)
prices = map(lambda order: order["price"], paid)
revenue = reduce(lambda total, price: total + price, prices, 0)
print(revenue)   # 42

# Idiomatic Python often uses a comprehension for the same thing:
revenue = sum(order["price"] for order in orders if order["paid"])`,
      },
      {
        title: "Currying and composition (TypeScript)",
        language: "typescript",
        code: `const multiply = (factor: number) => (value: number) => value * factor;
const double = multiply(2);          // partially applied
const addTax = multiply(1.2);

const compose =
  <T>(...fns: Array<(input: T) => T>) =>
  (input: T): T =>
    fns.reduceRight((acc, fn) => fn(acc), input);

const doubleThenTax = compose(addTax, double); // runs right-to-left
doubleThenTax(10); // 24`,
        explanation:
          "`multiply` is curried, so `multiply(2)` returns a reusable function. `compose(f, g)(x)` means `f(g(x))`. A `pipe` helper does the same left-to-right, which many people find easier to read.",
      },
    ],
    howItWorks: `
Because pure functions don't depend on hidden state, a call can always be
replaced by its result: **referential transparency**. That makes code easy
to test (no setup, no mocks), safe to run in parallel, and easy to cache
(memoisation).

Higher-order functions capture common loop shapes once:

- \`map(f, xs)\`: transform every element.
- \`filter(pred, xs)\`: keep elements that pass a test.
- \`reduce(f, xs, init)\`: combine elements into one value.

Real programs need side effects (reading files, writing to databases,
printing). FP doesn't forbid them; it **pushes them to the edges**. A
common design is a "functional core, imperative shell": pure functions
compute decisions, and a thin outer layer performs the I/O.

Languages like Haskell enforce purity in the type system. Most mainstream
languages leave it as a discipline you follow.
    `.trim(),
    diagram: `
  [orders] --filter(paid)--> [book, lamp] --map(price)--> [12, 30] --reduce(+)--> 42

  compose(addTax, double)(10):
     10 --double--> 20 --addTax--> 24
    `.trim(),
    whyItExists: `
Shared mutable state and hidden side effects make code hard to reason
about, test and parallelise. FP, rooted in the lambda calculus and Lisp,
offers a style where each piece can be understood on its own. The rise of
multi-core CPUs, distributed data processing (MapReduce, Spark) and UI
frameworks built on immutable state (React, Redux) brought these ideas into
the mainstream.
    `.trim(),
    whenToUse: `
Use FP techniques for data transformations (lists of records, API
responses), business rules that should be easy to test, concurrent code
where shared state is risky, and callbacks or pipelines. Writing core logic
as pure functions and keeping I/O at the edges is valuable in almost any
codebase.
    `.trim(),
    whenNotToUse: `
Don't force point-free style or deep currying where a plain loop reads
better, especially in a team unfamiliar with it. Long chains of
\`map\`/\`filter\`/\`reduce\` over huge arrays can create many intermediate
collections; a single loop (or lazy iterators) may be faster. Some problems
(simulations, games, low-level performance code) are naturally stateful and
clearer with controlled mutation.
    `.trim(),
    commonMistakes: [
      "Using `map` for side effects (logging, pushing to another array) and ignoring the returned array; use `forEach` or a loop for side effects.",
      "Writing a `reduce` so clever nobody can read it, when `sum`, `filter` or a short loop would be clearer.",
      "Thinking a function is pure while it mutates its argument (e.g. `arr.sort()` inside a 'pure' helper).",
      "Forgetting the initial value in `reduce`, which crashes on an empty array in both JavaScript and Python.",
      "Treating FP as all-or-nothing instead of applying pure functions where they help and keeping I/O at the edges.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Given a list of words, use map and filter to return the uppercase versions of the words longer than 4 characters." },
      { difficulty: "Medium", prompt: "Implement your own `map`, `filter` and `reduce` as plain functions (no built-ins), then implement `map` and `filter` using only your `reduce`." },
      { difficulty: "Hard", prompt: "Write a generic `curry(fn)` in JavaScript that works for any number of arguments (using `fn.length`), so `curry((a, b, c) => a + b + c)(1)(2)(3)` and `curry(...)(1, 2)(3)` both return 6." },
    ],
    interviewQuestions: [
      { question: "What is a pure function?", answer: "A function whose result depends only on its arguments and which causes no observable side effects: no mutation of inputs or globals, no I/O. Calling it with the same arguments always returns the same result." },
      { question: "What is a side effect?", answer: "Any observable change a function makes beyond returning a value: modifying a variable outside its scope, mutating an argument, writing to a file, network or console, or throwing based on external state." },
      { question: "What does 'first-class functions' mean?", answer: "Functions are values like any other: they can be assigned to variables, passed as arguments, returned from functions and stored in data structures." },
      { question: "What is a higher-order function?", answer: "A function that takes one or more functions as arguments, returns a function, or both. `map`, `filter`, `reduce`, `sorted(key=...)` and decorators are examples." },
      { question: "What is referential transparency?", answer: "The property that an expression can be replaced by its value without changing the program's behaviour. Pure functions give you this, which enables reasoning by substitution and safe caching." },
      { question: "What is the difference between currying and partial application?", answer: "Currying transforms an n-argument function into n nested one-argument functions. Partial application fixes some arguments of a function and returns a function of the rest (e.g. Python's `functools.partial`). Curried functions make partial application easy." },
      { question: "What is function composition?", answer: "Combining functions so the output of one is the input of the next: `compose(f, g)(x) = f(g(x))`. `pipe` is the same idea applied left-to-right." },
      { question: "How do you handle side effects in a functional design?", answer: "Isolate them at the boundaries: keep business logic in pure functions and let a thin outer layer do I/O ('functional core, imperative shell'). Purely functional languages model effects explicitly in types (e.g. Haskell's IO)." },
      { question: "Why is FP well suited to concurrency?", answer: "Pure functions over immutable data share no mutable state, so there's nothing to race on and no need for locks. Work can be split across threads or machines and results combined safely." },
      { question: "What does `reduce` do, and why should you pass an initial value?", answer: "It folds a collection into a single value by applying a combining function to an accumulator and each element. Without an initial value it uses the first element and throws on an empty collection, and the accumulator type may not be what you intended." },
    ],
    prerequisites: ["functions-and-parameters", "scope-and-lifetime", "mutability-and-immutability"],
    relatedTopics: ["programming-paradigms", "mutability-and-immutability", "closures", "recursion", "scope-and-lifetime"],
    keywords: ["functional programming", "pure function", "side effect", "first-class function", "higher-order function", "map", "filter", "reduce", "currying", "partial application", "composition", "referential transparency"],
  },
  {
    id: "error-handling-strategies",
    title: "Error Handling Strategies",
    level: "intermediate",
    description: "Exceptions vs error values, checked vs unchecked errors, failing fast, and reliable cleanup with finally, defer and RAII.",
    explanation: `
Things go wrong: files are missing, networks drop, input is malformed.
Languages offer two main ways to report failure:

- **Exceptions** (Python, Java, JavaScript, C#): a failing function
  *throws*, normal execution stops, and control jumps up the call stack to
  the nearest matching \`catch\`/\`except\`. Code in between doesn't have to
  mention the error at all.
- **Error values** (Go, Rust, C): a failing function *returns* the error as
  part of its result. Go returns \`(value, err)\`; Rust returns
  \`Result<T, E>\`, which is either \`Ok(value)\` or \`Err(error)\`. The caller
  must deal with it explicitly.

Java adds a split between **checked** exceptions (declared in the method
signature, the compiler forces callers to handle them) and **unchecked**
ones (any \`RuntimeException\`, no declaration needed).

Two principles apply in every language. **Fail fast**: detect bad input or
state as early as possible and stop loudly, instead of carrying on with
corrupt data. And **always clean up**: release files, locks and connections
whether the code succeeded or failed, using \`finally\`, \`with\`, \`defer\`
or RAII.
    `.trim(),
    analogy:
      "An exception is a fire alarm: when it goes off, everyone stops what they're doing and the building's fire plan takes over somewhere else. An error value is a note left on your desk saying 'the delivery failed': nothing stops, but you're expected to read it and decide what to do.",
    examples: [
      {
        title: "Exceptions with cleanup (Python)",
        language: "python",
        code: `import json

def load_config(path: str) -> dict:
    try:
        with open(path, encoding="utf-8") as file:   # file closed automatically
            return json.load(file)
    except FileNotFoundError:
        return {}                                    # sensible default
    except json.JSONDecodeError as error:
        raise ValueError(f"Config {path} is not valid JSON: {error}") from error`,
        walkthrough: [
          { code: "with open(path) as file:", explanation: "A context manager: the file is closed when the block ends, even if an exception is raised." },
          { code: "except FileNotFoundError:", explanation: "Catches only the specific error we know how to handle." },
          { code: "return {}", explanation: "A missing config file is expected, so we recover with defaults." },
          { code: "raise ValueError(...) from error", explanation: "Broken JSON can't be fixed here, so we raise a clearer error and keep the original as its cause." },
        ],
      },
      {
        title: "Errors as values (Go and Rust)",
        language: "go",
        code: `// Go: errors are ordinary return values
func readPort(path string) (int, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return 0, fmt.Errorf("reading %s: %w", path, err)
    }
    defer log.Println("done reading", path) // runs when the function returns
    return strconv.Atoi(strings.TrimSpace(string(data)))
}

// Rust: Result<T, E> and the ? operator, which returns early on Err
// fn read_port(path: &str) -> Result<u16, Box<dyn std::error::Error>> {
//     let text = std::fs::read_to_string(path)?;
//     let port = text.trim().parse::<u16>()?;
//     Ok(port)
// }`,
        explanation:
          "Every failure point is visible in the code. Rust's `?` keeps that explicitness while removing the repetitive `if err != nil` boilerplate.",
      },
      {
        title: "Fail fast at the boundary (TypeScript)",
        language: "typescript",
        code: `function createUser(email: string, age: number) {
  if (!email.includes("@")) {
    throw new Error("Invalid email: " + email);
  }
  if (!Number.isInteger(age) || age < 0) {
    throw new RangeError("Age must be a non-negative integer");
  }
  // From here on, the data is known to be valid.
  return { email, age };
}`,
      },
    ],
    howItWorks: `
When an exception is thrown, the runtime **unwinds** the stack: it pops
frames one by one, running any \`finally\` blocks or destructors on the
way, until it finds a handler whose type matches. If none matches, the
program (or thread, or request) crashes with a stack trace.

Error values involve no special control flow. They're returned like any
other value, so the type system can force callers to look at them. Rust's
\`Result\` must be used (the compiler warns if you ignore it) and \`?\`
propagates it upward.

Cleanup mechanisms guarantee release of resources:

- \`try/finally\` (Java, JavaScript, Python): the \`finally\` block always runs.
- Context managers / try-with-resources (\`with\` in Python, Java's
  \`try (var r = ...)\`): cleanup tied to a block.
- \`defer\` (Go): schedule a call to run when the function returns.
- **RAII** (C++, Rust): a resource is owned by an object, and the object's
  destructor (Rust's \`Drop\`) releases it when it goes out of scope.
    `.trim(),
    diagram: `
  Exception propagation (unwinding)

  main()            <- catch (ValueError) handles it here
    load_app()      <- no handler: finally blocks run, frame popped
      load_config() <- raise ValueError
    `.trim(),
    whyItExists: `
Before structured error handling, C programs checked return codes by hand
and frequently forgot to, letting errors slip through silently. Exceptions
made it impossible to ignore failure accidentally and separated error
handling from the happy path. Error values came back (Go, Rust) because
exceptions make control flow invisible: any line might jump away. Both
approaches aim at the same goal: errors that can't be silently lost.
    `.trim(),
    whenToUse: `
Use exceptions (in exception-based languages) for conditions the immediate
caller usually can't fix: I/O failure, invalid state, programmer errors.
Use error values or a \`Result\` type for expected, recoverable outcomes
that callers should always consider, like "not found" or "validation
failed". Validate input where it enters the system. Wrap every resource in
a cleanup construct.
    `.trim(),
    whenNotToUse: `
Don't use exceptions for normal control flow (ending a loop, signalling
"not found" in a hot path); they're slower and obscure intent. Don't catch
exceptions you can't handle just to log and continue, and never swallow
them with an empty \`catch\`. Don't catch the broadest type (\`Exception\`,
\`Throwable\`) except at a top-level boundary such as a request handler.
    `.trim(),
    commonMistakes: [
      "Empty catch blocks (`except: pass`, `catch (e) {}`) that hide failures and leave the program in an unknown state.",
      "Catching overly broad exceptions (`except Exception`, `catch (Throwable t)`) deep in the code and accidentally handling bugs as if they were expected errors.",
      "Ignoring a returned error (`value, _ := f()` in Go) or calling `.unwrap()` everywhere in Rust.",
      "Forgetting cleanup on the error path, leaking file handles, locks or database connections.",
      "Re-throwing a new error without the original cause, losing the stack trace needed for debugging.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a function `parseAge(text)` that returns an integer or raises/throws a clear error for empty strings, non-numbers and negative values." },
      { difficulty: "Medium", prompt: "Implement a small `Result` type in TypeScript (`{ ok: true, value } | { ok: false, error }`) and rewrite a function that throws so it returns a Result instead. Compare the calling code." },
      { difficulty: "Hard", prompt: "Write a function that copies one file to another, guaranteeing both files are closed and a half-written output file is deleted if anything fails. Do it in Python with context managers and in Go with defer." },
    ],
    interviewQuestions: [
      { question: "What are the trade-offs between exceptions and error return values?", answer: "Exceptions keep the happy path clean and propagate automatically, but make control flow invisible and are easy to forget to handle at the right level. Error values make every failure explicit and checkable by the type system, at the cost of more verbose code (mitigated by things like Rust's `?`)." },
      { question: "What is the difference between checked and unchecked exceptions in Java?", answer: "Checked exceptions (subclasses of `Exception` but not `RuntimeException`) must be declared with `throws` or caught; the compiler enforces it. Unchecked exceptions (`RuntimeException` and `Error`) need no declaration and usually indicate programming errors." },
      { question: "What does 'fail fast' mean?", answer: "Detect invalid input or state as early as possible and stop immediately with a clear error, instead of continuing and failing later, far from the cause, or silently corrupting data." },
      { question: "What is RAII?", answer: "Resource Acquisition Is Initialisation: tying a resource's lifetime to an object's lifetime. The resource is acquired in the constructor and released in the destructor, so it's freed automatically when the object goes out of scope, even during unwinding. Used in C++ and Rust." },
      { question: "How does Go's `defer` work?", answer: "`defer` schedules a function call to run when the surrounding function returns, whether normally or via panic. Deferred calls run in last-in, first-out order, and their arguments are evaluated when `defer` executes." },
      { question: "What does Rust's `?` operator do?", answer: "On a `Result`, it unwraps `Ok(value)` to `value`, or returns early from the function with the `Err`, converting the error type via `From` if needed. It works similarly on `Option`." },
      { question: "When does a `finally` block run?", answer: "After the `try` block (and any matching `catch`), whether it completed normally, returned, or threw. It's used for cleanup. It won't run if the process is killed or exits abruptly." },
      { question: "Why is an empty catch block dangerous?", answer: "It silently discards the error, so the program continues in a possibly invalid state and the failure leaves no trace. Debugging becomes much harder because the symptom appears far from the cause." },
      { question: "What is exception chaining and why is it useful?", answer: "Raising a new, higher-level error while keeping the original as its cause (`raise X from e` in Python, `new Error(msg, { cause })` in JS, the `cause` constructor argument in Java). It gives a meaningful message without losing the root cause's stack trace." },
      { question: "Should you use exceptions for control flow?", answer: "Generally no. Exceptions are for exceptional conditions; using them for expected outcomes hides intent and is slower in most runtimes. Python is a partial exception, where EAFP style (try first, catch the error) is idiomatic for things like dictionary lookups." },
    ],
    prerequisites: ["functions-and-parameters", "control-flow", "debugging-basics"],
    relatedTopics: ["error-handling", "testing-fundamentals", "clean-code-and-refactoring", "stack-and-heap"],
    keywords: ["exceptions", "error handling", "try catch", "finally", "Result type", "error values", "checked exceptions", "unchecked exceptions", "fail fast", "defer", "RAII", "context manager", "stack unwinding"],
  },
  // __CONTINUE__
];
