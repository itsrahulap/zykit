import type { Topic } from "../../types/content";

export const javascriptAdvancedTopics: Topic[] = [
  {
    id: "promises",
    title: "Promises",
    level: "advanced",
    description: "An object that represents a value you'll get later, not right now.",
    explanation: `
Some tasks don't finish instantly — fetching data from a server, reading a
file, waiting a few seconds. JavaScript can't just pause and wait around,
because that would freeze the whole page. Instead, it needs a way to say
"start this task, and let me know when it's done."

A **Promise** is an object that represents a value that isn't ready yet, but
will be — either successfully (**resolved**) or unsuccessfully (**rejected**).
You attach instructions for what to do in each case using \`.then()\` and
\`.catch()\`.
    `.trim(),
    analogy:
      "A promise is like a food delivery tracking number. You don't have the food yet, but you have something that represents it — and you can be notified the moment it arrives, or if the order fails.",
    examples: [
      {
        title: "Creating and using a promise",
        code: `function waitOneSecond() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Done waiting!");
    }, 1000);
  });
}

waitOneSecond()
  .then((message) => console.log(message)) // logs "Done waiting!" after 1s
  .catch((error) => console.log("Something went wrong:", error));`,
        walkthrough: [
          { code: "function waitOneSecond() {", explanation: "Defines a function that returns a promise instead of an immediate value." },
          { code: "return new Promise((resolve) => {", explanation: "Creates a new pending promise; resolve is a function to call once the work succeeds." },
          { code: 'setTimeout(() => { resolve("Done waiting!"); }, 1000);', explanation: "After 1 second, calls resolve with the result, settling the promise as fulfilled." },
          { code: "waitOneSecond().then((message) => ...)", explanation: "Runs this callback once the promise resolves, receiving the resolved value." },
          { code: ".catch((error) => ...)", explanation: "Runs only if the promise is rejected instead of resolved." },
        ],
      },
      {
        title: "A promise that can reject",
        code: `function fetchUser(id) {
  return new Promise((resolve, reject) => {
    if (id <= 0) {
      reject(new Error("Invalid user id"));
      return;
    }
    resolve({ id, name: "Amara" });
  });
}

fetchUser(-1)
  .then((user) => console.log(user))
  .catch((error) => console.log("Failed:", error.message)); // "Failed: Invalid user id"`,
        explanation:
          "`reject(...)` settles the promise as failed instead of successful, and control jumps straight to `.catch()`, skipping `.then()` entirely.",
      },
    ],
    howItWorks: `
A promise starts in a "pending" state. When the task finishes, it either
calls \`resolve(value)\` — moving the promise to "fulfilled" and triggering any
\`.then()\` callbacks — or calls \`reject(error)\`, moving it to "rejected" and
triggering \`.catch()\`. Once settled, a promise's outcome never changes again.
    `.trim(),
    diagram: `
Promise created (pending)
       ↓
Task runs in the background
       ↓
   ┌───────┴───────┐
success           failure
   ↓                 ↓
resolve(value)   reject(error)
   ↓                 ↓
.then() runs     .catch() runs
    `.trim(),
    whyItExists: `
Before promises, handling multiple sequential async tasks (like "fetch a
user, then fetch their orders, then fetch order details") led to deeply
nested callbacks that were hard to read and error-prone. Promises give
asynchronous code a consistent shape and let errors be handled in one place.
    `.trim(),
    whenToUse: `
Reach for a promise anytime you're doing something that finishes later,
not immediately — fetching data, reading a file, waiting on a timer — and
you want a clean way to say what happens on success versus failure.
    `.trim(),
    whenNotToUse: `
You don't need a promise for something that finishes instantly — wrapping
simple, immediate work in one just adds overhead. And in most modern code
you'll rarely write \`.then()\` chains by hand; reach for \`async/await\` on top
of promises instead, and use raw promises mainly when building the
underlying async function itself.
    `.trim(),
    commonMistakes: [
      "Forgetting to add a `.catch()`, so errors disappear silently.",
      "Nesting `.then()` calls instead of chaining them, recreating the exact mess promises were meant to fix.",
      "Forgetting to `return` a value inside a `.then()`, breaking the chain for the next `.then()`.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Create a promise that resolves with your name after 500ms, and log it with `.then()`." },
      { difficulty: "Medium", prompt: "Create a promise that randomly resolves or rejects, and handle both cases." },
      { difficulty: "Hard", prompt: "Chain three promises together, each depending on the previous result, using `.then()`." },
    ],
    interviewQuestions: [
      { question: "What are the three states a promise can be in, and can it move backward between them?", answer: "Pending, fulfilled, and rejected. A promise can only move forward — pending to fulfilled, or pending to rejected — and once it lands on either settled state it stays there forever; nothing can move it back to pending or flip it to the other outcome." },
      { question: "What's the difference between `.then()` and `.catch()`?", answer: "`.then(onFulfilled, onRejected)` can handle both outcomes directly; `.catch(onRejected)` is really just shorthand for `.then(undefined, onRejected)`, handling only the rejection path. `.catch()` is preferred for readability because it also catches rejections and thrown errors from earlier `.then()` callbacks in the chain, not just the original promise." },
      { question: "What does `Promise.all()` do, and how does it behave if one promise rejects?", answer: "It takes an iterable of promises and returns a single promise that fulfills with an array of all the results, but only once every one of them fulfills. If any single promise rejects, `Promise.all()` immediately rejects with that same reason — it doesn't wait for the others to settle, though their work keeps running in the background since promises can't be cancelled." },
      { question: "What does `Promise.allSettled()` do, and how does it differ from `Promise.all()`?", answer: "It waits for every promise to settle, whether fulfilled or rejected, and always resolves (never rejects) with an array of result objects like `{status: 'fulfilled', value}` or `{status: 'rejected', reason}`. Unlike `Promise.all()`, one failure doesn't short-circuit the whole thing — you get a full report of every outcome." },
      { question: "What does `Promise.race()` do?", answer: "It returns a promise that settles as soon as the first of the input promises settles, adopting that one's outcome — fulfilled or rejected — whichever gets there first wins, and the rest are simply ignored once that happens." },
      { question: "What does `Promise.any()` do, and how is it different from `Promise.race()`?", answer: "It resolves as soon as the first promise fulfills, ignoring rejections along the way. Unlike `Promise.race()`, a single rejection doesn't end things early — `Promise.any()` only rejects if every promise in the input rejects, and it does so with an `AggregateError` bundling all the individual reasons." },
      { question: "You need to run four independent API calls and proceed only if all succeed, failing fast if any fails. Which combinator fits, and why not the others?", answer: "`Promise.all()` — it gives you all four results together and rejects immediately on the first failure, matching 'all must succeed.' `Promise.allSettled()` wouldn't fail fast, since it always waits for every one to finish; `Promise.race()`/`Promise.any()` only care about a single winner, not all four." },
      { question: "Once a promise has settled, can calling `resolve()` again change its value?", answer: "No. A promise can only settle once — after the first call to `resolve` or `reject` inside the executor, every later call to either is silently ignored. This is what makes a promise's outcome immutable once decided." },
      { question: "What is a 'thenable', and why does it matter for promises?", answer: "Any object with a `.then(onFulfilled, onRejected)` method, even if it isn't a real `Promise` instance. Promise machinery treats thenables specially — `Promise.resolve(thenable)` and returning a thenable from a `.then()` callback both 'unwrap' it by waiting for it to settle, rather than treating it as a plain value, which is how other libraries interoperate with native promises." },
      { question: "What happens if you `return` a promise from inside a `.then()` callback?", answer: "The outer chain waits for that returned promise to settle before moving on, and its resolved value — not the promise itself — is passed to the next `.then()`. This automatic flattening is what lets you chain sequential async steps instead of ending up with nested promises." },
      { question: "Predict the output: a chain starts with `Promise.resolve(1)`, then adds 1, then throws inside the next `.then()`, then has a final `.then()` that logs, then a `.catch()` that logs the error message. What actually logs?", answer: "Only the `.catch()` handler's log runs. The thrown error inside the second `.then()` rejects the chain at that point, which skips every following `.then()` — they only run on fulfillment — until it reaches the first handler that can deal with a rejection, the `.catch()`." },
      { question: "If you forget to add a `.catch()` to a chain that ends up rejecting, what actually happens?", answer: "It becomes an 'unhandled promise rejection.' In a browser this fires an `unhandledrejection` event and typically logs a warning; in Node.js it logs a warning by default and, depending on version and configuration, can crash the process. It isn't silently swallowed — it's meant to surface as a bug." },
      { question: "Can a `.catch()` handler catch an error thrown by an earlier `.then()` in the same chain?", answer: "Yes — a rejection or thrown error at any point in a chain skips forward past every `.then()` until it finds the next rejection handler, whether that's the `onRejected` argument to `.then()` or a `.catch()`. A single `.catch()` at the end of a chain can therefore catch failures from any step before it." },
      { question: "What does `.finally()` do, and does its callback receive the resolved value or rejection reason?", answer: "It runs after the promise settles regardless of outcome, useful for cleanup like hiding a loading spinner. Its callback receives no arguments at all, and `.finally()` passes the original outcome through unchanged to the next link in the chain — unless the `.finally()` callback itself throws or returns a rejected promise, which overrides it." },
      { question: "What's the difference between `Promise.resolve(x)` when `x` is a plain value versus when `x` is already a promise?", answer: "If `x` is a plain value, you get a new promise already fulfilled with it. If `x` is already a promise or thenable, `Promise.resolve(x)` doesn't wrap it in another layer — it returns a promise that follows `x`'s own eventual state, so you never end up with a 'promise of a promise.'" },
      { question: "Does the executor function passed to `new Promise((resolve, reject) => {...})` run immediately, or only once something calls `.then()`?", answer: "Immediately, synchronously, the moment the promise is constructed — promises are eager, not lazy. `.then()` only controls when you're notified of the result; it doesn't trigger the work to start." },
      { question: "Predict the output: a synchronous log, then constructing a `new Promise` whose executor logs synchronously before resolving, with a `.then()` attached, then a final synchronous log after the constructor call.", answer: "The order is: the first log, the executor's own log, the final log, then the `.then()` callback's log last. The executor body runs synchronously the instant the promise is constructed, but the `.then()` callback is queued as a microtask and only runs after all the current synchronous code finishes." },
      { question: "If the executor function passed to `new Promise()` throws synchronously, what happens to the promise?", answer: "It's automatically caught and treated the same as calling `reject(error)` — the promise settles as rejected with that thrown error. You don't need a manual try/catch inside the executor purely to convert a synchronous throw into a rejection." },
      { question: "What happens if a `.then()` callback itself throws an error?", answer: "The promise returned by that `.then()` call rejects with the thrown error, which then propagates down the chain the same way an explicit `reject()` would, until something catches it." },
      { question: "You call `.then()` twice on the same promise from two separate variables, instead of chaining them. Does the second `.then()` see the value transformed by the first?", answer: "No — calling `.then()` twice on the same promise creates two independent branches that both receive the original promise's resolved value, not each other's return values. Only chaining, `promise.then(...).then(...)`, passes a value from one step into the next." },
      { question: "How would you convert an older callback-style function into one that returns a promise?", answer: "Wrap the call in `new Promise((resolve, reject) => {...})`, where the executor calls the original function and its error-first callback drives `resolve`/`reject` based on whether an error came back. Node's built-in `util.promisify` automates exactly this pattern." },
      { question: "How would you add a timeout to a promise-based operation that might hang forever?", answer: "Race it against a promise that rejects after a delay, using `Promise.race()` on an array containing both the real operation and a `setTimeout`-based rejection. Whichever settles first — the real result or the timeout — determines the outcome, though the loser keeps running in the background since it can't be cancelled." },
      { question: "Since regular JavaScript promises can't be cancelled, how do people typically stop unneeded async work early anyway?", answer: "By using a separate cooperative-cancellation signal, most commonly `AbortController`/`AbortSignal` — the promise-producing operation (like `fetch`) checks the signal and rejects or stops on its own when told to abort; the promise object itself never gains a real 'cancel' method." },
      { question: "What does `Promise.all()` resolve with when the input array mixes real promises with plain, non-promise values?", answer: "A plain, non-promise value is treated as already-resolved with itself, so it passes straight through in the results array alongside the resolved values of the actual promises, in the same positions they were given." },
      { question: "Why does `Promise.any()` reject with an `AggregateError` instead of a single error?", answer: "Because it only fails when every input promise has rejected, and no single reason fully explains the failure — an `AggregateError` bundles all the individual rejection reasons into one object, via its `.errors` array, so none of that information is lost." },
      { question: "You have three independent, unrelated async calls that don't depend on each other's results. What's wrong with awaiting them one at a time instead of using `Promise.all()`?", answer: "Awaiting them sequentially runs them one after another, so the total time is roughly the sum of all three durations. Starting them together, or wrapping them in `Promise.all()`, lets them run concurrently, so the total time is closer to the slowest single one, not the sum." },
      { question: "What's the difference in behavior between attaching two separate `.then()` calls to the same promise versus chaining them?", answer: "Attaching two separate `.then()` calls creates two independent listeners that both receive the same original resolved value. Chaining them makes the second one run only after the first finishes, and it receives whatever the first one returned, not the original value." },
      { question: "Why is nesting `.then()` calls inside other `.then()` calls considered bad practice, even when it reaches the same result as a flat chain?", answer: "Nesting recreates the same deeply indented, hard-to-follow shape that promises were introduced to fix in the first place. Returning a promise from a `.then()` and continuing the chain flat achieves the same sequencing without the nesting, and keeps error handling centralized in one `.catch()` instead of scattered across nested blocks." },
      { question: "Does an error thrown inside a `.catch()` handler get caught by that same `.catch()`, or does it propagate further?", answer: "It propagates further down the chain — a `.catch()` block, like any `.then()` handler, produces a new promise, and if the code inside it throws, that new promise rejects and needs its own downstream `.catch()` to handle it." },
      { question: "How can you make sure an expensive async setup operation only actually runs once, even if multiple parts of the code request it around the same time?", answer: "Cache the promise itself the first time it's created, not just its eventual value, and hand that same promise out to every caller. Since a promise remembers its settled value and can have any number of `.then()` listeners, every caller gets the one real result once it resolves, and the underlying work only runs once." },
      { question: "What does it mean, from the promise API's own perspective, that `.then()`/`.catch()`/`.finally()` callbacks always run as microtasks?", answer: "It means those callbacks are never invoked synchronously, even for an already-settled promise — they're always deferred to run after the currently executing code finishes, but before anything else the engine has queued afterward, which is why they reliably run 'soon' but never in the middle of other running code." },
      { question: "Predict the output: two already-resolved promises each get a `.then(console.log)` attached, followed by a plain synchronous `console.log`.", answer: "The synchronous log runs first, then the two `.then()` callbacks run in the order they were scheduled. Both callbacks are deferred as microtasks regardless of the fact that both promises are already resolved — being 'already resolved' doesn't make `.then()` run synchronously." },
      { question: "You need to run a list of async tasks one at a time, in order, without async/await. How do you chain them dynamically using only promises?", answer: "Fold the array into a single chain with `reduce`: each step's `.then()` waits for the previous task's promise before starting the next one, seeded with an already-resolved promise as the starting point — building a fully sequential chain from a list of tasks of any length." },
      { question: "Is there any meaningful difference between `Promise.resolve('done')` and manually writing `new Promise(resolve => resolve('done'))`?", answer: "Functionally almost none — both give you an already-fulfilled promise with the value `'done'`. `Promise.resolve()` is just a shorter, more direct way to wrap an already-known value or existing thenable, without the ceremony of writing out an executor function." },
    ],
    prerequisites: ["functions"],
    relatedTopics: ["async-await", "event-loop", "error-handling"],
    keywords: ["promise", "resolve", "reject", "then", "catch", "async"],
  },
  {
    id: "async-await",
    title: "Async/Await",
    level: "advanced",
    description: "A cleaner way to write asynchronous code so it reads like normal, step-by-step code.",
    explanation: `
Promises solved the "callback mess" problem, but chaining many \`.then()\`
calls can still be hard to read. **async/await** is newer syntax built on
top of promises that lets you write asynchronous code that *looks*
synchronous — top to bottom, like normal steps — while still not blocking
the rest of the program.

You mark a function as \`async\`, and inside it you use \`await\` before a
promise to pause that function (and only that function) until the promise
settles.
    `.trim(),
    analogy:
      "It's like a recipe written as a checklist instead of a tangle of arrows: 'wait for the water to boil, then add pasta, then wait 10 minutes.' Each step waits for the previous one, written in plain, readable order.",
    examples: [
      {
        title: "Using async/await",
        code: `async function getUserData() {
  const response = await fetch("/api/user");
  const data = await response.json();
  return data;
}`,
        walkthrough: [
          { code: "async function getUserData() {", explanation: "Marks this function as async, allowing await inside it and making it always return a promise." },
          { code: 'const response = await fetch("/api/user");', explanation: "Pauses this function only (not the whole program) until the network request settles." },
          { code: "const data = await response.json();", explanation: "Pauses again while the response body is parsed as JSON." },
          { code: "return data;", explanation: "Sends the parsed data back to whoever called and awaited getUserData()." },
        ],
      },
      {
        title: "Handling errors with try/catch",
        code: `async function getUserData() {
  try {
    const response = await fetch("/api/user");
    const data = await response.json();
    return data;
  } catch (error) {
    console.log("Failed to load user:", error);
  }
}`,
      },
    ],
    howItWorks: `
When JavaScript hits \`await somePromise\`, it pauses that async function's
progress right there — without freezing the rest of the program — and lets
other code keep running. Once the promise settles, the function resumes
exactly where it left off, with the resolved value in hand (or an error, if
it was rejected).
    `.trim(),
    whyItExists: `
async/await exists purely to make promise-based code easier to read and
reason about. It doesn't replace promises — it's built entirely on top of
them — but it removes a lot of the \`.then()\` chaining boilerplate.
    `.trim(),
    whenToUse: `
Use async/await whenever you have a sequence of asynchronous steps that
depend on each other — fetch a user, then fetch their orders, then display
them — and you want that sequence to read top-to-bottom like ordinary
code.
    `.trim(),
    whenNotToUse: `
Skip async/await for synchronous code that never needs to wait on
anything — adding \`async\` gains you nothing there. And when several async
tasks don't depend on each other, awaiting them one at a time is slower
than starting them together with \`Promise.all\`.
    `.trim(),
    commonMistakes: [
      "Forgetting the `async` keyword on a function that uses `await` inside it.",
      "Forgetting to wrap `await` calls in `try/catch`, so rejected promises crash the function silently.",
      "Using `await` in a loop when the calls don't actually depend on each other, making things slower than necessary (running them in parallel with `Promise.all` would be faster).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Convert a `.then()`-based promise chain into an `async/await` function." },
      { difficulty: "Medium", prompt: "Write an async function that fetches data and handles errors with `try/catch`." },
      { difficulty: "Hard", prompt: "Write an async function that runs three independent async tasks in parallel using `Promise.all`, instead of `await`-ing them one by one." },
    ],
    interviewQuestions: [
      { question: "How does `async/await` relate to promises?", answer: "It's syntax sugar built entirely over promises — an `async` function always returns a promise, and `await` pauses that function's own progress until the promise it's given settles, then resumes with the resolved value (or throws the rejection)." },
      { question: "Does an `async` function always return a promise, even if you `return` a plain, non-promise value?", answer: "Yes. Whatever you `return` from an `async` function is automatically wrapped in a resolved promise if it isn't already one — callers always get a promise back, never the raw value directly, even for a function that never awaits anything." },
      { question: "How do you handle errors in async/await code, and how does that compare to `.catch()` on a promise chain?", answer: "Wrap the `await` calls in a `try/catch` block, the same way you'd handle a synchronous throw. A rejected awaited promise is converted into a thrown error at that point, so `try/catch` catches it exactly like `.catch()` would catch a rejection further down a promise chain — it's the same underlying mechanism with different syntax." },
      { question: "Does `await` block the entire program?", answer: "No — it only pauses the current `async` function's own execution. Control returns to whatever called it, and the rest of the program, including the browser's UI, keeps running normally until the awaited promise settles and the function resumes." },
      { question: "What does `await` actually do, mechanically, when it hits a promise?", answer: "It suspends the `async` function at that point, registers a continuation on the promise (conceptually like a `.then()`), and immediately returns control to the caller. Once the promise settles, the rest of the function's body is scheduled to resume as a microtask, picking up exactly where it left off." },
      { question: "What happens if you `await` a value that isn't a promise at all, like a plain number?", answer: "It works fine — `await` treats a non-promise value as already resolved, wraps it as if via `Promise.resolve()`, and the function still yields control briefly (the resumption is still scheduled as a microtask) before continuing with that same value." },
      { question: "What happens if you use `await` inside a function that isn't marked `async`?", answer: "It's a syntax error — `await` is only valid syntax inside an `async` function (or, in modules, at the top level). The engine won't let you write it in a plain function; you have to add `async` first." },
      { question: "Can you use `await` at the top level of a file, outside any function?", answer: "Yes, in an ES module — this is 'top-level await.' It lets a module perform asynchronous setup before its exports are considered ready, but it comes with a cost: any module that imports it also has to wait for that `await` to resolve before it finishes loading." },
      { question: "Why is putting `await` inside a `for` loop for several independent async tasks often a performance mistake?", answer: "Each iteration waits for the previous call to fully settle before even starting the next one, so the tasks run strictly one after another instead of concurrently. If the tasks don't depend on each other's results, starting them all first and awaiting them together (for example with `Promise.all`) finishes in roughly the time of the slowest one instead of the sum of all of them." },
      { question: "How do you run several independent async calls in parallel while still writing await-based code?", answer: "Start all the calls first without awaiting each one immediately, collecting the returned promises, and then await them together — typically with `await Promise.all([...])` — so they all begin running concurrently instead of one only starting after the previous one finishes." },
      { question: "Predict the output: an `async` function logs 'A', then awaits a resolved promise, then logs 'B'; right after calling that function (without awaiting it), the calling code logs 'C'.", answer: "The order is 'A', 'C', 'B'. Everything before the first `await` inside an async function runs synchronously the moment it's called, so 'A' logs immediately. The function then suspends at the `await`, control returns to the caller, which logs 'C' next; only once the current synchronous code finishes does the suspended function resume and log 'B'." },
      { question: "If an `async` function has no `await` inside it at all, does calling it still behave asynchronously in any way?", answer: "Yes — even with zero `await`s, an `async` function's return value is always wrapped in a promise, and any `.then()` attached to that promise still runs as a microtask rather than synchronously, so callers can never rely on the result being available the instant the call returns." },
      { question: "What happens to an error thrown inside an `async` function if there's no `try/catch` around it?", answer: "It doesn't crash the program synchronously — it's converted into a rejection of the promise the `async` function returns. Whoever called that function needs to handle the rejection, either by awaiting it inside their own `try/catch` or attaching a `.catch()`, or it becomes an unhandled promise rejection." },
      { question: "Is an unhandled rejection from an async function any different, mechanically, from one that comes out of a raw `.then()` chain?", answer: "No — under the hood they're the same thing. An `async` function's returned promise rejecting with no handler produces exactly the same 'unhandled promise rejection' as any other rejected promise nobody attached a `.catch()` (or awaiting `try/catch`) to." },
      { question: "Does `Array.prototype.forEach` wait for an `async` callback to finish before moving to the next item?", answer: "No — `forEach` doesn't know or care that its callback returns a promise; it fires off every call back-to-back without waiting, so all the async callbacks effectively start almost simultaneously and finish in whatever order their own work completes, not in array order." },
      { question: "Given that `forEach` doesn't await async callbacks, how would you process an array's items one at a time, waiting for each before starting the next?", answer: "Use a `for...of` loop with `await` inside it: `for (const item of items) { await process(item); }`. Because a `for` loop's body genuinely pauses on each `await`, this processes strictly in order, unlike `forEach`." },
      { question: "How would you process every item in an array concurrently and collect all the results with async/await?", answer: "Map the array to an array of promises by calling the async function on each item without awaiting individually, then await the whole array at once with `Promise.all`, for example `await Promise.all(items.map(process))` — this starts all the work together instead of serially." },
      { question: "Inside a `try` block, is there a meaningful difference between `return await somePromise;` and `return somePromise;`?", answer: "Outside a try/catch, generally no — both eventually resolve to the same value from the caller's perspective. Inside a try/catch, though, `return await` matters: it keeps the function running long enough for a rejection to be caught by that same `catch` block, whereas a bare `return somePromise` immediately hands the (still-pending) promise back to the caller, so any later rejection is no longer caught locally." },
      { question: "Debugging: a teammate wrote `items.forEach(async (item) => { await save(item); })` expecting the items to be saved one at a time, in order — what's actually happening, and how would you fix it?", answer: "Because `forEach` ignores the promise its callback returns, all the `save()` calls are effectively kicked off together rather than sequentially, and `forEach` itself doesn't wait for any of them to finish before returning. Replacing it with a `for...of` loop containing `await save(item)` (for strict order) or `Promise.all(items.map(save))` (for concurrency) fixes it, depending on which behavior was actually intended." },
      { question: "Why is code written with async/await generally easier to debug with breakpoints than an equivalent `.then()` chain?", answer: "Because it reads and steps like ordinary sequential code — you can set a breakpoint on any line and step over each `await` one at a time, watching local variables persist naturally, instead of jumping between separate callback functions that each have their own scope and appear as new stack frames in a `.then()` chain." },
      { question: "Is it valid to use `await` inside a `.then()` callback? Is that a normal pattern to write?", answer: "It's only valid if that callback itself is an `async` function, and while it works, mixing the two styles in the same piece of code is generally discouraged — it's clearer to commit to one style (usually async/await) for a given block of logic rather than switching back and forth." },
      { question: "If an `async` function throws before reaching its first `await`, is that throw synchronous, or does it still produce a rejected promise?", answer: "It still produces a rejected promise, not a synchronous throw the immediate caller can catch with a plain `try/catch` around the call. Because the function is `async`, JavaScript always wraps its outcome — success or failure — in a promise, even for a throw that happens before any `await` is reached." },
      { question: "How would you retry a flaky async operation up to a fixed number of times using async/await?", answer: "Wrap the attempt in a loop with a `try/catch`: on success, `return` the result immediately; on failure, catch the error, and either continue to the next loop iteration to retry or, once the retry limit is reached, rethrow (or return a failure value) instead of retrying again." },
      { question: "What's the benefit of using `Promise.allSettled()` together with async/await over wrapping each individual `await` in its own `try/catch`?", answer: "`Promise.allSettled()` lets several independent async operations run concurrently and reports every outcome — success or failure — without one failure preventing you from seeing the others' results, whereas awaiting each one in its own try/catch (especially sequentially) is more verbose and, if done naively in a loop, can also lose the concurrency benefit." },
      { question: "Predict the output: an `async` IIFE logs 'start', awaits a `setTimeout`-based promise, then logs 'end'; right after invoking it, the outer code logs 'after call'.", answer: "'start', 'after call', then 'end' last. 'start' runs synchronously as soon as the IIFE begins; hitting the `await` suspends it and hands control back, so 'after call' logs next; only once the timer fires and its promise resolves does the IIFE resume and log 'end'." },
      { question: "Can an `async` function be combined with generator syntax, and is that something typical application code reaches for?", answer: "Yes — an `async generator function` (`async function*`) combines both, yielding values over time with `for await...of` on the consuming side. It's a more specialized tool, mainly useful for consuming asynchronous streams of values (like paginated API results), and much less common in everyday code than a plain `async function`." },
      { question: "Why does wrapping every single `await` in the codebase in its own try/catch, versus one try/catch around several sequential awaits, matter for how precisely you can respond to failures?", answer: "A single try/catch around several awaits catches a failure from any of them but loses information about which specific step failed unless you inspect the error itself; wrapping each await individually (or tagging errors) lets you respond differently — retry just the failed step, supply a specific fallback — instead of treating the whole block as one all-or-nothing unit." },
      { question: "If two unrelated `await` calls are written back-to-back in an `async` function without `Promise.all`, does the second one start only after the first fully resolves, or do they overlap at all?", answer: "The second call's own async work doesn't even begin — the expression that creates its promise isn't evaluated — until the function resumes after the first `await`, so there's no overlap at all; they run strictly one after the other in real time." },
      { question: "What determines whether the code immediately after calling an `async` function (without awaiting the call) runs before or after the code inside that function?", answer: "Everything inside the async function up to its first `await` runs synchronously before control ever returns to the caller, so any code in the async function before its first `await` runs first; everything after that first `await` is deferred, so the caller's subsequent code generally runs before the async function resumes." },
      { question: "Why doesn't marking a function `async` change how long its non-async internal work takes to execute?", answer: "`async` only changes how the function's *result* is delivered — wrapped in a promise, with pauses at `await` points — it doesn't make any of the function's own synchronous computation faster or run on a separate thread; a slow synchronous loop inside an async function still blocks everything else exactly as it would in a regular function." },
      { question: "You need to fetch a user, then, only once you have their ID, fetch their orders. Why can't you simply start both fetches at the same time with `Promise.all`?", answer: "Because the second request genuinely depends on data (the user's ID) that only exists after the first one completes — there's a real sequential dependency, so `await`ing the first call before starting the second is correct here; `Promise.all` is only a win when the calls are truly independent of each other." },
    ],
    prerequisites: ["promises"],
    relatedTopics: ["promises", "event-loop", "error-handling"],
    keywords: ["async", "await", "try catch", "asynchronous"],
  },
  {
    id: "event-loop",
    title: "Event Loop",
    level: "advanced",
    description: "The mechanism that lets JavaScript handle many tasks without ever running two at once.",
    explanation: `
JavaScript can only do one thing at a time — it has a single "thread" of
execution. And yet it can handle things like timers, network requests, and
user clicks all seemingly "at once" without freezing the page. The
**event loop** is the mechanism that makes this possible.

It works by separating "run this code right now" from "run this code later,
once something else finishes" — and constantly checking whether it's time
to run any of that waiting code.
    `.trim(),
    analogy:
      "Imagine a single chef in a kitchen who can only cook one dish at a time, but has an oven timer for things in the background. The chef finishes the current dish, checks if any timers have gone off, handles those, then moves to the next task — never doing two things simultaneously, but never sitting idle either.",
    examples: [
      {
        title: "Order of execution",
        code: `console.log("1: start");

setTimeout(() => {
  console.log("2: timeout callback");
}, 0);

console.log("3: end");

// Output order:
// 1: start
// 3: end
// 2: timeout callback`,
        explanation:
          "Even with a 0ms delay, the timeout callback runs after all the regular code — because it has to wait for the main code to finish first.",
        walkthrough: [
          { code: 'console.log("1: start");', explanation: "Runs immediately — the first line on the call stack." },
          { code: "setTimeout(() => {...}, 0);", explanation: "Hands the callback to the browser to run later, even with a 0ms delay — JavaScript doesn't wait here." },
          { code: 'console.log("3: end");', explanation: "Also runs immediately, since it doesn't wait on the timer at all." },
          { code: "// 2: timeout callback", explanation: "Only runs once the current code finishes and the call stack is completely empty." },
        ],
      },
      {
        title: "Promises run before timers",
        code: `console.log("1: start");

setTimeout(() => console.log("2: setTimeout"), 0);

Promise.resolve().then(() => console.log("3: promise"));

console.log("4: end");

// Output order: 1, 4, 3, 2`,
        explanation:
          "Promise callbacks (microtasks) are always drained before the next timer callback (a macrotask) runs, even if both were scheduled at roughly the same time.",
      },
    ],
    howItWorks: `
JavaScript runs your main code on something called the **call stack**. When
it encounters something asynchronous (like \`setTimeout\` or a network
request), that task is handed off to the browser, and JavaScript keeps
running the rest of the main code. Once the async task finishes, its
callback is placed in a queue — but there are actually two of them, checked
in a strict order. Promise callbacks go into the **microtask queue**;
timers, network events, and clicks go into the **macrotask queue**. The
event loop's job is: once the call stack is empty, drain the *entire*
microtask queue first — running every waiting promise callback, even ones
added while draining — and only once it's completely empty does it run a
single macrotask, before checking the microtask queue again.
    `.trim(),
    diagram: `
Call stack (running now)
       ↓ empty?
Event loop checks the queue
       ↓
Queue has a waiting callback? ──▶ run it on the call stack
       ↓ no
keep checking
    `.trim(),
    whyItExists: `
Without the event loop, any slow task (like a network request) would
freeze the entire page until it finished. The event loop lets JavaScript
start slow tasks, move on immediately, and come back to handle the result
later — keeping the page responsive the whole time.
    `.trim(),
    whenToUse: `
You reach for this mental model any time you're debugging unexpected
ordering — why a \`console.log\` ran before a network response, why a
\`setTimeout(fn, 0)\` didn't run immediately, or why the page froze during a
long calculation.
    `.trim(),
    whenNotToUse: `
Day-to-day, you don't manage the event loop directly — there's no API to
configure it. It's not something you "use"; it's something you understand
so that async code (promises, timers, events) makes sense instead of
feeling random.
    `.trim(),
    commonMistakes: [
      "Assuming `setTimeout(fn, 0)` runs immediately — it still waits for the current code to finish first.",
      "Not realizing that a long-running synchronous loop can freeze the page, since nothing else can run until the call stack is clear.",
      "Confusing the order of promise callbacks (microtasks) and timer callbacks (macrotasks) — microtasks always finish draining before the next macrotask runs, it's not just a usual tendency.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Predict, then verify, the console output order of a mix of `console.log` and `setTimeout` calls." },
      { difficulty: "Medium", prompt: "Write a small snippet mixing a `Promise.resolve().then()` and a `setTimeout`, and explain which runs first and why." },
      { difficulty: "Hard", prompt: "Explain, in your own words, why a `for` loop with a billion iterations would freeze a webpage." },
    ],
    interviewQuestions: [
      { question: "Is JavaScript single-threaded?", answer: "Yes — it runs one line of code at a time on a single call stack, but the browser or Node.js provides separate mechanisms (timers, network APIs, file I/O) that do slow work in the background and only hand results back to that single thread through the event loop." },
      { question: "What is the difference between the call stack and the task queue(s)?", answer: "The call stack is where code is actually executing right now, one function frame at a time. The task queues just hold callbacks — from timers, promises, DOM events — that are waiting for the stack to be completely empty before the event loop is allowed to run any of them." },
      { question: "Do microtasks (promises) or macrotasks (`setTimeout`) run first?", answer: "Microtasks run first — every time the call stack empties, the event loop drains the *entire* microtask queue, including any new microtasks scheduled while draining, before it's allowed to run even a single macrotask." },
      { question: "What concretely counts as a macrotask versus a microtask?", answer: "Macrotasks include `setTimeout`/`setInterval` callbacks, DOM events (clicks, keypresses), and network callbacks — each 'task' from the host environment. Microtasks include promise `.then()`/`.catch()`/`.finally()` callbacks and `queueMicrotask()` callbacks — jobs scheduled by the JavaScript engine itself, which are always given priority over the next macrotask." },
      { question: "Where does `queueMicrotask()` fit relative to promise callbacks?", answer: "It schedules a callback into the exact same microtask queue that promise callbacks use, so it follows the identical ordering rule: it runs after the current synchronous code finishes, and before the next macrotask, in the order it was queued relative to other microtasks." },
      { question: "Predict the output: `console.log(1); setTimeout(() => console.log(2), 0); Promise.resolve().then(() => console.log(3)); console.log(4);`", answer: "`1, 4, 3, 2`. The two synchronous logs run first. Then, once the stack is empty, the entire microtask queue drains, so the promise's `3` runs next. Only after that, with the microtask queue empty, does the event loop pick up the timer's macrotask and log `2`." },
      { question: "What does it actually mean that 'the call stack must be empty' before the event loop can act?", answer: "It means the event loop never interrupts running JavaScript mid-function to run a queued callback — it only checks the queues at the exact moment every function on the stack has returned. This is why a long synchronous operation delays every pending timer, promise callback, and UI event, no matter how long they've been waiting." },
      { question: "Why doesn't `setTimeout(fn, 0)` run its callback immediately?", answer: "Because a timer callback is a macrotask, and macrotasks always have to wait for the current synchronous code to finish and for the entire microtask queue to drain first — `0` just means 'as soon as possible after that,' not 'right now,' and browsers additionally clamp very short or deeply nested timeouts to a small minimum delay." },
      { question: "Does the event loop run through the entire macrotask queue in one go, the way it drains the whole microtask queue?", answer: "No — it takes exactly one macrotask per pass, then drains the microtask queue completely again before taking the next single macrotask. This alternation (one macrotask, then all microtasks, repeat) is different from how the microtask queue itself is always fully emptied each time." },
      { question: "Predict the output: two `setTimeout(fn, 0)` calls are scheduled, and inside the first timer's callback a `Promise.resolve().then()` is scheduled. Does that promise callback run before or after the second timer's callback?", answer: "It runs before the second timer's callback. Once the first timer (a macrotask) finishes running, the event loop drains the microtask queue completely — including the promise callback just scheduled inside it — before it's allowed to move on to the second timer, even though the second timer was scheduled earlier." },
      { question: "If a microtask callback schedules another microtask, does the event loop wait for that one too before moving to the next macrotask?", answer: "Yes — the rule is 'drain the microtask queue until it's completely empty,' not 'run whatever was in it at the start.' Any microtask added while draining still gets processed in the same pass, before a single macrotask is allowed to run." },
      { question: "Why can a chain of promises that keeps scheduling new microtasks prevent timers from ever firing, a phenomenon sometimes called 'microtask starvation'?", answer: "Because the event loop only ever moves to a macrotask once the microtask queue is completely empty, and a promise chain that keeps re-scheduling itself (each `.then()` queuing another) never lets that queue empty out — so pending `setTimeout` callbacks, UI events, and network callbacks all get starved indefinitely, even though nothing is technically 'blocking' in the synchronous sense." },
      { question: "Where do browser rendering and repaints happen relative to microtasks and macrotasks?", answer: "A browser generally tries to repaint after the microtask queue has drained and before running the next macrotask (though it doesn't have to repaint on every single cycle) — which is why microtasks that never finish accumulating can also visibly freeze the page's rendering, not just its logic." },
      { question: "What is `requestAnimationFrame`, and how does its timing differ from a macrotask like `setTimeout`?", answer: "It schedules a callback to run right before the browser's next repaint, synced to the display's refresh rate, rather than after an arbitrary delay like `setTimeout`. It's specifically meant for visual updates, so the browser can batch and time it correctly, unlike a generic timer which has no relationship to the paint cycle." },
      { question: "Predict the output: a script logs 'start', calls `queueMicrotask` to log 'micro', calls `setTimeout(fn, 0)` to log 'macro', then logs 'end'.", answer: "'start', 'end', 'micro', 'macro'. The two synchronous logs run first; once the stack empties, the microtask queue is drained (logging 'micro'), and only then does the event loop pick up the timer macrotask and log 'macro'." },
      { question: "What does 'blocking the event loop' mean, concretely?", answer: "It means running synchronous JavaScript that takes a long time to finish, during which the call stack is never empty — so no timers can fire, no promise callbacks can run, and the page can't respond to clicks, scrolls, or repaints, because the single thread is entirely occupied by that one piece of code." },
      { question: "Why can one very expensive synchronous computation freeze an entire web page, including things seemingly unrelated to it like scrolling?", answer: "Scrolling, click handling, and rendering all rely on the same single thread being free to process their queued callbacks. As long as a synchronous loop keeps the call stack occupied, none of those queued items — regardless of what feature they belong to — get a chance to run, because the event loop can't interrupt already-running code." },
      { question: "Do Web Workers get around JavaScript's single-threaded limitation, and how do they relate to the main thread's event loop?", answer: "Yes — a Web Worker runs on a genuinely separate thread with its own call stack and its own event loop, so heavy computation there doesn't block the main thread. It communicates back to the main thread only via message passing (`postMessage`), which itself arrives as a macrotask-like event on the main thread's queue, rather than sharing memory and state directly." },
      { question: "Conceptually, how does Node.js's event loop differ from a browser's?", answer: "Both share the same core idea — one thread, a call stack, and callback queues drained once the stack is empty — but Node.js organizes its macrotasks into distinct phases (timers, I/O callbacks, `setImmediate`, close callbacks, and so on) that run in a fixed order each loop iteration, whereas a browser's model is comparatively simpler and doesn't expose those phases directly." },
      { question: "Predict the output: an `async` function awaits an already-resolved value and logs after the `await`; a `setTimeout(fn, 0)` is scheduled right before calling that async function; a synchronous log happens right after calling it.", answer: "The synchronous log after the call runs first, then the async function's post-await log, then the timer's log last. Resuming after an `await` is scheduled as a microtask, so it's still prioritized ahead of the macrotask queue that the timer's callback sits in, even though the timer was scheduled earlier in the source." },
      { question: "Why does resuming after an `await` behave, timing-wise, just like a promise `.then()` callback?", answer: "Because that's exactly what it is under the hood — `await` desugars to registering a continuation on a promise, and that continuation is scheduled into the microtask queue the same way any `.then()` callback would be, which is why async/await follows the identical microtask-before-macrotask ordering rules." },
      { question: "Predict the output: `console.log(1); Promise.resolve().then(() => console.log(2)); Promise.resolve().then(() => console.log(3)).then(() => console.log(4)); console.log(5);`", answer: "`1, 5, 2, 3, 4`. Both synchronous logs run first. Then the microtask queue is processed in the order things were scheduled: `2` was queued first and runs; `3` was queued right alongside it and runs next; `3`'s own `.then()` for `4` is only scheduled once `3` finishes running, so `4` runs last, after `2` and `3`." },
      { question: "A `setTimeout` callback with a 100ms delay ends up running noticeably later than 100ms after it was scheduled. What event-loop-related reasons could explain that?", answer: "The timer only becomes *eligible* to run after 100ms — it still has to wait for the call stack to be empty and, on each pass, for the entire microtask queue to drain first. If other synchronous code is still running, or a long-running or continuously-refilled microtask queue is monopolizing every gap, the timer callback can be delayed well beyond its nominal delay." },
      { question: "Why is it more accurate to think of `setTimeout`'s delay as a minimum rather than a guarantee?", answer: "The delay only guarantees the callback won't run *before* that time has elapsed — it says nothing about how soon after that it will actually execute, since it still has to wait its turn behind the currently running code, the microtask queue, and any macrotasks ahead of it in the queue." },
      { question: "Why doesn't calling `Promise.all()` to wait on several promises block the event loop while they're pending?", answer: "`Promise.all()` doesn't loop or poll waiting for its inputs — it just registers callbacks on each promise and returns immediately, letting the call stack clear. The actual waiting happens passively; nothing runs again until one of the underlying promises settles and its callback is scheduled, so the thread is free to do other work in the meantime." },
      { question: "Mechanically, why is a UI click handler just another item competing for the same queue as a `setTimeout` callback?", answer: "A click is detected by the browser outside of JavaScript, and instead of interrupting whatever's currently running, it queues the registered handler as a macrotask, exactly like a timer firing — so a page busy running a long synchronous script won't respond to a click until that script finishes and the event loop gets around to that queued task." },
      { question: "If a piece of code schedules two `setTimeout(fn, 0)` calls back to back, does the one scheduled first always fire before the second?", answer: "Generally yes, since timers of equal delay fire in the order they became eligible — but it's not an absolute guarantee: browsers clamp very short or deeply nested timeout chains to a small minimum delay (historically around 4ms), and other queued work in between can affect exact ordering in edge cases." },
      { question: "What's the difference, in terms of end effect versus root cause, between starving the main thread with an infinite chain of microtasks versus with one long synchronous loop?", answer: "Both freeze the page identically from the outside — nothing else gets a turn to run. The difference is in the mechanism: a synchronous loop keeps the call stack itself continuously busy, while a runaway microtask chain repeatedly empties and refills the microtask queue, so the call stack does briefly empty between each one, but the event loop is never allowed to reach the next macrotask because that queue is never truly finished." },
      { question: "Why is JavaScript's split into 'run this now' and 'run this later, once something else finishes' the whole reason the event loop needs to exist at all?", answer: "Because JavaScript only has one thread, it has no way to genuinely wait for a slow operation without freezing everything else. Splitting work into synchronous code plus deferred callbacks lets that single thread start slow operations, immediately move on to other work, and come back to handle results later — the event loop is simply the mechanism that manages when 'later' actually arrives." },
      { question: "What is the difference between a task and a microtask job in loose spec terms, and why does the distinction matter in practice?", answer: "A 'task' (macrotask) is host-defined work like a timer firing or a network event arriving; a 'microtask' (often called a 'job' in the spec, largely driven by promises) is engine-scheduled follow-up work. The distinction matters because the engine always fully drains all pending jobs before yielding to the host to run the next task, which is the entire reason promise callbacks consistently beat timer callbacks of the same nominal delay." },
    ],
    prerequisites: ["async-await"],
    relatedTopics: ["promises", "async-await"],
    keywords: ["event loop", "call stack", "queue", "single-threaded", "microtask"],
  },
  {
    id: "prototypes",
    title: "Prototypes",
    level: "advanced",
    description: "How JavaScript objects share behavior with each other behind the scenes.",
    explanation: `
When you call \`"hello".toUpperCase()\`, you're using a method you never
defined yourself. Where did it come from? Every object in JavaScript has a
hidden link to another object it can "fall back to" when it doesn't have a
property itself — that fallback object is called its **prototype**.

If JavaScript can't find a property directly on an object, it checks the
object's prototype, then that prototype's prototype, and so on, until it
finds the property or runs out of links. This chain is called the
**prototype chain**.
    `.trim(),
    analogy:
      "Imagine asking a coworker a question. If they don't know the answer, they ask their manager. If the manager doesn't know, they ask their manager. Each object checks its own knowledge first, then defers up a chain until someone has the answer.",
    examples: [
      {
        title: "Objects sharing behavior via a prototype",
        code: `const animal = {
  speak() {
    console.log(this.name + " makes a sound.");
  },
};

const dog = Object.create(animal);
dog.name = "Rex";

dog.speak(); // "Rex makes a sound."
// dog doesn't have its own "speak" method — it found it on "animal"`,
        walkthrough: [
          { code: "const animal = { speak() {...} };", explanation: "A plain object with one method, speak." },
          { code: "const dog = Object.create(animal);", explanation: "Creates a new, empty object whose prototype is set to animal." },
          { code: 'dog.name = "Rex";', explanation: "Adds an own property, name, directly on dog." },
          { code: "dog.speak();", explanation: "dog has no speak of its own, so JavaScript finds it on animal via the prototype chain." },
        ],
      },
      {
        title: "class syntax uses prototypes underneath",
        code: `class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    console.log(this.name + " makes a sound.");
  }
}

const cat = new Animal("Whiskers");
cat.speak(); // "Whiskers makes a sound."

console.log(Object.getPrototypeOf(cat) === Animal.prototype); // true`,
        explanation:
          "`speak` is defined once, on `Animal.prototype`, and every instance created with `new Animal(...)` shares that same method through the prototype chain — it isn't copied per instance. Note: `Animal.prototype` is a special property that only functions and classes have — it's the template object that becomes the internal fallback link (what `Object.getPrototypeOf` reads back) for every instance created with `new Animal(...)`. They're two names for closely related things, not the same thing.",
      },
    ],
    howItWorks: `
Every object has an internal link (accessible via \`Object.getPrototypeOf\`)
pointing to another object. Property lookup checks the object itself first;
if not found, it walks up this chain of prototypes. Arrays and functions
are also objects, and they get useful built-in methods (like \`.map()\` or
\`.call()\`) this exact same way — from their own prototypes.

Don't confuse this internal link with the \`.prototype\` **property** you see
on functions and classes (like \`Animal.prototype\`) — that property is only
a template object, used to set up the internal link on every instance
created with \`new\`. Plain objects (like \`{}\`) don't have a \`.prototype\`
property at all, even though they still have an internal prototype link.
    `.trim(),
    whyItExists: `
Prototypes let many objects share the same methods without each one storing
its own separate copy — saving memory and letting you update shared
behavior in one place. It's the mechanism underneath JavaScript's classes
and built-in types like arrays and strings.
    `.trim(),
    whenToUse: `
You lean on prototypes — often without realizing it — any time you call a
built-in method on a value (\`.map()\`, \`.toUpperCase()\`). You reach for them
directly when you want several objects to share the same behavior without
duplicating it, which today is usually written with \`class\` rather than
\`Object.create\` by hand.
    `.trim(),
    whenNotToUse: `
For most everyday application code, you don't need to manipulate
prototypes directly — \`class\` syntax covers the common cases more clearly.
Reach for raw prototype manipulation only when you're building a library,
working with older code, or need behavior \`class\` doesn't offer directly.
    `.trim(),
    commonMistakes: [
      "Confusing an object's own properties with properties it only has access to through its prototype.",
      "Modifying a shared prototype directly and accidentally affecting every object that relies on it.",
      "Assuming JavaScript's `class` syntax is a completely different system — it's mostly a friendlier way to write prototype-based code.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use `Object.getPrototypeOf()` on an array and on a plain object, and compare the results." },
      { difficulty: "Medium", prompt: "Create an object `vehicle` with a `honk` method, then use `Object.create()` to make a `car` object that inherits it." },
      { difficulty: "Hard", prompt: "Explain, using the prototype chain, why `[].toString()` works even though arrays don't define `toString` themselves." },
    ],
    interviewQuestions: [
      { question: "What is the prototype chain?", answer: "A series of linked objects that JavaScript walks through when a property lookup fails on the object itself — first checking the object's own prototype, then that prototype's own prototype, and so on, until the property is found or the chain ends at `null`." },
      { question: "What actually triggers JavaScript to look at an object's prototype at all?", answer: "A property lookup that fails to find the property directly on the object — as an own property. Prototype lookup is a fallback that only kicks in after checking the object itself comes up empty." },
      { question: "What's the difference between `.prototype` and `__proto__`?", answer: "`.prototype` is a regular property that only functions and classes have — it's the template object handed to every instance created with `new`. `__proto__` is the (legacy, informal) way to access any object's actual internal prototype link — the one `Object.getPrototypeOf` reads. They're related but not interchangeable: a function has both, while a plain object only has the internal link, not a `.prototype` property." },
      { question: "How does `class` relate to prototypes under the hood?", answer: "JavaScript classes are largely syntax sugar over the same prototype-based system that existed before them — methods written in a class body end up as properties on the class's `.prototype` object, shared by every instance, exactly the way manually assigning to `Ctor.prototype` would work." },
      { question: "What does `Object.create(proto)` do?", answer: "It creates a brand-new, empty object whose internal prototype link is set directly to `proto`, giving that new object access to everything on `proto` through the chain — without copying any of `proto`'s properties onto it." },
      { question: "How does `new Ctor()` set up an instance's prototype link, compared to `Object.create(Ctor.prototype)`?", answer: "They end up doing almost the same thing to the link — `new Ctor()` creates a new object whose prototype is `Ctor.prototype`, then runs `Ctor` with `this` bound to that new object. `Object.create(Ctor.prototype)` only does the first part; it skips running the constructor function entirely, so any setup logic inside it (like assigning instance properties) never happens." },
      { question: "Predict the output: `const dog = Object.create(animal); dog.name = \"Rex\"; console.log(dog.hasOwnProperty(\"name\"), dog.hasOwnProperty(\"speak\"));` (where `animal` has a `speak` method).", answer: "`true false`. `name` was assigned directly onto `dog`, so it's an own property. `speak` is only reachable through the prototype chain — `dog` doesn't own it, it just has access to it." },
      { question: "What's the difference between `hasOwnProperty(key)` and the `in` operator?", answer: "`obj.hasOwnProperty(key)` only checks the object's own properties, ignoring anything it merely inherits through the chain. `key in obj` checks the entire chain — it returns true for both own properties and inherited ones." },
      { question: "Why does a `for...in` loop sometimes iterate over more keys than you expect, and how do you guard against it?", answer: "`for...in` walks the whole prototype chain and includes any inherited *enumerable* property, not just the object's own keys. Guarding with `if (obj.hasOwnProperty(key))` inside the loop (or just using `Object.keys(obj)` instead, which only returns own enumerable keys) avoids picking up inherited ones accidentally." },
      { question: "Is `__proto__` still the recommended way to read or change an object's prototype?", answer: "No — it's a legacy accessor kept mainly for backward compatibility. The standard, recommended equivalents are `Object.getPrototypeOf(obj)` to read the link and `Object.setPrototypeOf(obj, proto)` to change it." },
      { question: "Why would you deliberately create an object with `Object.create(null)` instead of `{}`?", answer: "`Object.create(null)` produces an object with no prototype at all — not even `Object.prototype` — so it has none of the usual inherited methods like `toString` or `hasOwnProperty`. That's useful when you want a truly clean dictionary/map-like object with zero risk of an inherited property name colliding with a key you store in it." },
      { question: "If you modify a shared prototype after some instances already exist, do those existing instances see the change?", answer: "Yes — property lookup happens live, at the moment you access a property, not once at object-creation time. Since every instance's prototype link points to the very same prototype object, adding or changing a method on it becomes visible to every instance immediately, past and future." },
      { question: "What's a risk of assigning a brand-new object to `Ctor.prototype` wholesale (`Ctor.prototype = {...}`) instead of adding methods individually?", answer: "The new object doesn't automatically get a `constructor` property pointing back to `Ctor` the way the original auto-generated `.prototype` object did, which can silently break code that relies on `instance.constructor` to identify what created the object — you'd need to manually reassign `constructor` on the replacement object." },
      { question: "How does `instanceof` actually work, mechanically?", answer: "`obj instanceof Ctor` walks `obj`'s prototype chain, checking at each link whether it's the exact same object as `Ctor.prototype` — it returns true the moment it finds a match, and false if it reaches the end of the chain without one." },
      { question: "Why do plain arrays have access to methods like `.map()` and `.forEach()` that you never defined yourself?", answer: "Every array's internal prototype link points to `Array.prototype`, which is where all of those built-in methods actually live, shared by every array. It's the exact same mechanism as a custom object inheriting a method from a hand-written prototype." },
      { question: "What's the risk of adding a method directly onto `Array.prototype` (\"monkey-patching\" a built-in)?", answer: "The new method becomes visible on every array in the entire program, including ones from other libraries, and can silently collide with a method a future JS version or another library adds with the same name — it affects global, shared state rather than being scoped to your own code." },
      { question: "What is \"prototype pollution\", and why is it treated as a security concern?", answer: "It's when untrusted input is used to set a property like `__proto__` on an object being built (often through a naive recursive merge of user-supplied JSON), which actually reaches into and modifies `Object.prototype` itself — silently changing behavior for every plain object in the whole program, including ones with no obvious connection to the attacker's input." },
      { question: "Predict the output: two different objects are both created with `new Animal(\"x\")`. Is `animalOne.speak === animalTwo.speak`?", answer: "`true` — both instances share the exact same function reference through their common prototype, `Animal.prototype`; the method isn't copied per instance, so comparing it by reference across two different instances gives equality." },
      { question: "If a constructor assigns `this.name = name` inside itself, does `name` end up on the instance or on the prototype?", answer: "On the instance — it becomes an own property of that specific object. Only things defined directly on `Ctor.prototype` (like methods in a class body) are shared through the chain; anything assigned to `this` inside the constructor is unique per instance." },
      { question: "How does `Object.keys(obj)` differ from a `for...in` loop in terms of what it returns?", answer: "`Object.keys(obj)` returns only the object's own enumerable property names, ignoring the entire prototype chain. `for...in` includes both own and inherited enumerable properties, which is why it's easy to get more keys back than you expected." },
      { question: "Predict the output: `const bare = Object.create(null); console.log(bare.toString);`", answer: "`undefined` — `bare` has no prototype at all, so it doesn't inherit `toString` (or anything else) from `Object.prototype` the way a normal `{}` would." },
      { question: "In a class, where do `static` methods actually live — on the prototype, alongside instance methods?", answer: "No — `static` methods are attached directly to the class (constructor function) itself, not to `Ctor.prototype`. That's why they're called on the class, like `MyClass.staticMethod()`, and are never accessible on an individual instance." },
      { question: "Can getters and setters be shared across instances the same way regular methods are?", answer: "Yes — a getter/setter defined in a class body (with `get`/`set`) is installed on the class's prototype just like a regular method, so every instance shares the same accessor logic, even though each instance's underlying data can differ." },
      { question: "Conceptually, how does JavaScript's prototypal inheritance differ from classical, class-based inheritance in languages like Java?", answer: "Classical inheritance defines a fixed class hierarchy at compile time, and every instance is a stamped-out copy following that blueprint. Prototypal inheritance links live objects directly to other live objects at runtime — there's no separate \"class\" concept underneath; `class` syntax in JS is just a friendlier way to set up those same object-to-object links." },
      { question: "When a subclass method calls `super.method()`, where does that lookup actually go?", answer: "It looks up `method` starting from the parent class's prototype specifically, skipping the subclass's own prototype (even if the subclass overrode `method`) — this lets an overriding method call the original version it's replacing without infinite recursion." },
      { question: "Why is repeatedly calling `Object.setPrototypeOf(obj, newProto)` on already-existing objects generally discouraged, beyond just being unusual?", answer: "Changing an object's prototype after creation is a slow operation in most JS engines — it can de-optimize code that was compiled assuming that object's \"shape\" (including its prototype) would stay stable, hurting performance far more than setting the prototype once up front via `Object.create` or a constructor." },
      { question: "Predict the output: `console.log(Object.getPrototypeOf(Object.getPrototypeOf({})));`", answer: "`null`. A plain object's prototype is `Object.prototype`, and `Object.prototype`'s own prototype is `null` — the very end of the chain." },
      { question: "What sits at the very top of a normal object's prototype chain, and what comes after it?", answer: "`Object.prototype` sits at the top of most chains, supplying things like `toString` and `hasOwnProperty`. Its own prototype is `null`, which is what actually stops the chain — property lookup gives up and returns `undefined` once it reaches `null`." },
      { question: "Does an arrow function have a `.prototype` property the way a regular function does?", answer: "No — arrow functions never get an automatically-created `.prototype` property, which is one reason (along with not having their own `this`) that they can't be used as constructors with `new`." },
      { question: "If you declare a regular function but never call it with `new`, does it still have a `.prototype` property?", answer: "Yes — every regular (non-arrow) function automatically gets a `.prototype` property the moment it's created, whether or not it's ever actually used as a constructor; it just sits there unused if `new` is never applied to that function." },
      { question: "If an object has its own property shadowing a prototype property of the same name, and you `delete` the own property, does the prototype's version reappear?", answer: "Yes — `delete` only removes the object's own property. Since the prototype link itself was never touched, the next lookup of that same key falls through to the (never-removed) property on the prototype, exactly as if the own property had never been added." },
      { question: "Why is `obj.hasOwnProperty(key)` sometimes considered risky to call directly, and what's the safer alternative?", answer: "It relies on `obj` having actually inherited `hasOwnProperty` from `Object.prototype` — which fails on an object created with `Object.create(null)`, or one where `hasOwnProperty` was itself overwritten as an own property. `Object.prototype.hasOwnProperty.call(obj, key)`, or the newer `Object.hasOwn(obj, key)`, calls the real check directly without depending on what `obj` happens to have inherited." },
      { question: "How does `Object.assign(target, source)` differ from having `target` inherit from `source` via the prototype chain?", answer: "`Object.assign` performs a one-time copy of `source`'s own enumerable properties onto `target` — after that copy, the two objects are completely independent, and a later change to `source` has no effect on `target`. Prototypal inheritance instead creates a live, ongoing link: a later change to the prototype is immediately visible to everything that inherits from it." },
      { question: "Debugging: a teammate adds a new method to a shared prototype partway through the program's execution, expecting only future instances to be able to use it. What actually happens?", answer: "Every existing instance gains access to the new method too, since prototype lookup is resolved live at call time rather than copied in when the instance was originally created — there's no way to add a prototype method that only affects instances created afterward." },
    ],
    prerequisites: ["objects"],
    relatedTopics: ["objects", "this"],
    keywords: ["prototype", "prototype chain", "inheritance", "Object.create"],
  },
  {
    id: "this",
    title: "this",
    level: "advanced",
    description: "A special keyword that refers to whatever object is currently 'in charge' of the running code.",
    explanation: `
Sometimes code inside a function needs to refer to "the object I belong
to" without naming that object directly — so the same code can work for
many different objects. JavaScript provides a special keyword, \`this\`, that
refers to that object.

The tricky part: \`this\` isn't fixed to where a function is *written* — it
depends on how the function is *called*. The same function can have a
different \`this\` each time you call it differently.
    `.trim(),
    analogy:
      "Think of \"this\" like the word \"I\" in a sentence. The word itself doesn't change, but who \"I\" refers to depends entirely on who's speaking at the time.",
    examples: [
      {
        title: "`this` depends on how a function is called",
        code: `const user = {
  name: "Amara",
  greet() {
    console.log("Hi, I'm " + this.name);
  },
};

user.greet(); // "Hi, I'm Amara" — this = user, because user.greet() called it

const greetFn = user.greet;
greetFn(); // "Hi, I'm undefined" — this is no longer "user" here`,
        explanation:
          "Calling `user.greet()` sets `this` to `user`. But once the function is detached from `user` and called on its own, `this` no longer points to `user`.",
        walkthrough: [
          { code: "const user = { name: ..., greet() {...} };", explanation: "Defines an object with a method, greet." },
          { code: "user.greet();", explanation: "Called as user.greet(), so this inside greet is set to user." },
          { code: "const greetFn = user.greet;", explanation: "Copies just the function itself, detached from user." },
          { code: "greetFn();", explanation: "Called plainly, so this is no longer user — this.name is undefined." },
        ],
      },
      {
        title: "Arrow functions and `this`",
        code: `const user = {
  name: "Amara",
  greet: () => {
    console.log("Hi, I'm " + this.name); // ❌ arrow functions don't have their own "this"
  },
};`,
        explanation:
          "Arrow functions intentionally don't have their own `this` — they use `this` from the surrounding code where they were written, which is usually not what you want for object methods.",
      },
    ],
    howItWorks: `
When a regular function is called, JavaScript looks at *how* it was called
to decide what \`this\` should be: calling it as \`obj.method()\` sets \`this\` to
\`obj\`; calling it plain, like \`fn()\`, sets \`this\` to \`undefined\` (in strict
mode) or the global object; and \`.call()\`/\`.apply()\`/\`.bind()\` let you set
\`this\` explicitly. Arrow functions skip this process entirely and just
borrow \`this\` from their enclosing scope.
    `.trim(),
    whyItExists: `
\`this\` lets the same method definition work correctly for many different
objects — one \`greet\` method can be shared by every user object, each
correctly referring to itself, instead of needing a separate hardcoded copy
per object.
    `.trim(),
    whenToUse: `
You need to reason about \`this\` any time you write a method on an object,
use a class, or pass a function around as a callback — knowing what \`this\`
will be tells you whether that code will actually work when it's called.
    `.trim(),
    whenNotToUse: `
In plain or arrow functions that don't depend on an object's own data, you
often don't need \`this\` at all — a regular parameter is clearer. And inside
object methods that get used as callbacks, prefer an arrow function or
\`.bind()\` over relying on the caller to preserve \`this\` correctly.
    `.trim(),
    commonMistakes: [
      "Passing an object method as a callback (e.g. to `setTimeout`) and losing its intended `this`.",
      "Using a regular function for an object method that's called as a plain callback, instead of binding it or using an arrow function appropriately.",
      "Assuming `this` refers to where a function is defined rather than how it's called.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Create an object with a method that logs `this.name`, and call it normally to confirm it works." },
      { difficulty: "Medium", prompt: "Detach that method into its own variable, call it directly, and explain why `this` breaks." },
      { difficulty: "Hard", prompt: "Fix the broken example using `.bind()`, and explain what `.bind()` actually does." },
    ],
    interviewQuestions: [
      { question: "What determines the value of `this` inside a regular function?", answer: "How the function is actually called at the call site — not where it was defined. Calling it as `obj.method()` sets `this` to `obj`; calling it standalone as `fn()` gives a different `this` entirely; `new fn()` and `.call`/`.apply`/`.bind` each set it differently again." },
      { question: "What does `this` become when a regular function is called completely standalone, like `fn()`, with no object in front of it?", answer: "In strict mode, `this` is `undefined`. In non-strict (\"sloppy\") mode, it falls back to the global object (`window` in a browser) instead — a long-standing default that strict mode was introduced partly to avoid, since accidentally leaking global-object access is rarely what anyone wants." },
      { question: "What is `this` set to inside a method called as `obj.method()`?", answer: "`obj` itself — whatever object appears directly to the left of the dot at the moment of the call is what `this` is bound to for that invocation." },
      { question: "Where does an arrow function get its `this` from?", answer: "It doesn't have its own `this` binding at all — it looks outward to whatever `this` is in the surrounding (lexical) scope where the arrow function was written, and that value never changes no matter how the arrow function itself is later called." },
      { question: "If you copy a method off an object into a plain variable and call it from there, what happens to `this`?", answer: "The connection to the original object is lost — calling the copied function standalone triggers the same rule as any other standalone call (`undefined` in strict mode, or the global object otherwise), not the object it came from." },
      { question: "What does `fn.call(thisValue, arg1, arg2)` do?", answer: "It immediately invokes `fn`, explicitly setting `this` to `thisValue` for that one call, passing `arg1`, `arg2`, ... as individual arguments." },
      { question: "How does `.apply()` differ from `.call()`?", answer: "They do the exact same thing — invoke immediately with an explicit `this` — but `.apply()` takes its arguments bundled as a single array (or array-like), while `.call()` takes them as a comma-separated list." },
      { question: "What does `.bind()` do, and when is the `this` you pass to it actually locked in — immediately, or only once the bound function is finally called?", answer: "It returns a brand-new function with `this` permanently fixed to whatever you passed, and that binding happens immediately, at the moment `.bind()` is called — not deferred until the new function is eventually invoked." },
      { question: "Once a function has been bound with `.bind()`, can a later `.call()` or `.apply()` on the resulting function override its `this`?", answer: "No — a bound function's `this` is permanently locked in; any `this` you try to pass via a later `.call()`/`.apply()` on it is simply ignored." },
      { question: "What happens to a bound function's `this` if it's called with `new` instead of as a plain function?", answer: "`new` wins — calling a bound function with `new` ignores the bound `this` entirely and instead creates a fresh object for `this`, the same as calling the original unbound function with `new` would. The bound arguments (if any were pre-supplied) are still used, but not the bound `this`." },
      { question: "What's the actual priority order JavaScript uses when several of these rules could apply at once — `new`, explicit binding (`call`/`apply`/`bind`), an object method call, and the plain default?", answer: "From highest to lowest priority: calling with `new` always wins; then an explicit `this` set via `call`/`apply`/`bind`; then an implicit `this` from a method call (`obj.method()`); and only if none of those apply does it fall back to the default (`undefined` in strict mode, or the global object otherwise)." },
      { question: "If you pass an object's method directly to `setTimeout(obj.method, 1000)` instead of wrapping it, what is `this` when it eventually runs?", answer: "Not `obj` — `setTimeout` calls the function standalone with no object in front of it, so `this` falls back to the default (`undefined` in strict mode), the same problem as detaching any method into a plain variable and calling it later." },
      { question: "What are two idiomatic ways to fix a callback that's losing its intended `this`?", answer: "Either wrap the call in an arrow function at the call site (`setTimeout(() => obj.method(), 1000)`, so `obj.method()` is still called as a method), or pre-bind it once with `.bind()` (`setTimeout(obj.method.bind(obj), 1000)`), locking in `this` regardless of how it's later invoked." },
      { question: "If a plain (non-arrow) function is defined inside an object's method and called from inside that method, does it inherit the method's `this`?", answer: "No — a plain nested function called on its own gets its own default `this`, completely independent of the outer method's `this`, which is a classic and easy-to-miss gotcha; an arrow function defined in the same spot would correctly inherit the outer method's `this` instead." },
      { question: "Inside a DOM event handler written as a regular function, what does `this` refer to?", answer: "The element the listener was attached to — the browser calls the handler as if it were a method on that element, effectively `element.handler(event)`, which is why `this` inside it points to the element." },
      { question: "If that same event handler is written as an arrow function instead, does `this` still refer to the element?", answer: "No — an arrow function ignores the element-based `this` the browser would otherwise supply, and instead uses whatever `this` was in scope where the arrow function was originally written, which is usually not the element at all." },
      { question: "If a class method is passed around as a callback (e.g. `<button onClick={instance.method}>`) without binding it first, what typically goes wrong?", answer: "The method loses its connection to `instance` the same way any detached method does — when it's later called as a plain callback, `this` inside it is no longer `instance`, so any code inside relying on `this.someProperty` breaks." },
      { question: "How does the \"class field arrow function\" pattern (`method = () => { ... }` instead of `method() { ... }`) fix the lost-`this` callback problem?", answer: "Because it's an arrow function, it doesn't get its own `this` — it captures `this` lexically from where it's defined, which is inside the constructor's scope, where `this` is the instance being built. Since it's assigned per-instance as an instance property (not shared on the prototype), each instance gets its own already-bound version, safe to pass around as a callback without ever losing track of `this`." },
      { question: "What is `this` set to inside a constructor function invoked with `new`?", answer: "The brand-new, freshly created object that `new` is in the process of building — assignments like `this.name = name` inside the constructor attach properties directly onto that new instance." },
      { question: "What does `this` refer to inside a `static` method of a class?", answer: "The class (constructor function) itself, not any particular instance — since `static` methods are called directly on the class, like `MyClass.staticMethod()`, not on an instance." },
      { question: "What does `this` refer to inside a getter or setter defined in a class?", answer: "The specific instance the getter/setter is being accessed through — exactly the same as `this` inside a regular instance method, letting the accessor read or modify that instance's own data." },
      { question: "Does `this` behave any differently inside a generator function's body compared to a regular method?", answer: "No — a generator method still follows the exact same call-site rules for `this` as any other method; being a generator only changes how it produces values (via `yield`), not how `this` is determined." },
      { question: "What is `this` at the very top level of an ES module, outside any function?", answer: "`undefined` — unlike a classic non-module script, where top-level `this` refers to the global object, an ES module's top-level `this` is deliberately `undefined`, since modules are implicitly in strict mode and don't have an ambient global `this`." },
      { question: "Does writing `\"use strict\"` change what `this` is inside a method call like `obj.method()`?", answer: "No — it only changes the default, standalone-call case. `this` inside `obj.method()` is `obj` either way; strict mode's effect on `this` specifically matters for a plain `fn()` call, changing the fallback from the global object to `undefined`." },
      { question: "Why did some older codebases write `const self = this;` at the top of a method, before arrow functions were common?", answer: "So that a nested plain function (which would otherwise get its own, different `this`) could reference the outer method's `this` indirectly through the closed-over `self` variable instead — a manual workaround for the exact problem arrow functions later solved automatically by inheriting `this` lexically." },
      { question: "Predict the output: `function show() { console.log(this.id); } const a = { id: 1, show }; const b = { id: 2 }; show.call(b);`", answer: "`2` — `.call(b)` explicitly sets `this` to `b` for that one invocation, completely overriding whatever `this` would otherwise have been (even though `show` also happens to exist as `a.show`, that's irrelevant here since it's being called through `.call`, not through `a`)." },
      { question: "Predict the output: `function sum(a, b) { return this.multiplier * (a + b); } console.log(sum.apply({ multiplier: 10 }, [2, 3]));`", answer: "`50` — `.apply()` sets `this` to `{ multiplier: 10 }` and unpacks the array `[2, 3]` as the individual arguments `a` and `b`, giving `10 * (2 + 3)`." },
      { question: "Predict the output: `function greet(greeting) { console.log(greeting + \", \" + this.name); } const hi = greet.bind({ name: \"Amara\" }, \"Hi\"); hi();`", answer: "`\"Hi, Amara\"` — `.bind()` locks in both `this` (`{ name: \"Amara\" }`) and the first argument (`\"Hi\"`) at bind time; calling `hi()` later needs no further arguments and always uses that fixed `this`." },
      { question: "What is `this` inside an IIFE (immediately invoked function expression) written as a plain function, called with no object?", answer: "The same as any other standalone call — `undefined` in strict mode, or the global object otherwise — since an IIFE is still just a regular function invocation, with nothing to its left setting an implicit `this`." },
      { question: "If an arrow function is defined directly inside a regular method, does it correctly inherit that method's `this`?", answer: "Yes — this is one of the main reasons arrow functions exist: since they don't have their own `this`, an arrow function written inside a method automatically picks up the method's own `this`, which is usually exactly what you want for a nested helper or callback." },
      { question: "Can you reassign `this` inside a function body the way you would a normal variable, like `this = someObject;`?", answer: "No — `this` isn't a regular variable at all; it's determined entirely by how the function was called, and attempting to assign directly to it is a syntax error." },
      { question: "Does calling `.call()` or `.apply()` on an arrow function actually change what `this` resolves to inside it?", answer: "No — arrow functions permanently ignore any `this` argument passed via `.call`, `.apply`, or `.bind`; those methods still pass through any other arguments normally, but the `this` portion has no effect on an arrow function's body." },
      { question: "If you pass an object's method directly as the callback to `array.map(obj.method)`, what typically goes wrong with `this` inside it?", answer: "The same detached-method problem as anywhere else — `map` calls the callback as a plain function, not as `obj.method()`, so `this` inside it is no longer `obj`. Fixing it means either using an arrow function wrapper (`array.map(x => obj.method(x))`), pre-binding (`array.map(obj.method.bind(obj))`), or passing `obj` as `map`'s optional `thisArg` second argument." },
      { question: "Debugging: an event listener written as `element.addEventListener(\"click\", instance.handleClick)` logs `this.state` as `undefined` instead of the expected instance data. What's the fix?", answer: "`instance.handleClick` is detached from `instance` the moment it's passed as a bare reference, so when the browser calls it, `this` is the element (or `undefined` in a class method, since class bodies are strict mode), not `instance`. Binding it explicitly — `instance.handleClick.bind(instance)`, or defining it as a class field arrow function in the first place — keeps `this` pointing at `instance` regardless of how the browser invokes it." },
    ],
    prerequisites: ["functions", "objects"],
    relatedTopics: ["functions", "prototypes", "closures"],
    keywords: ["this", "bind", "call", "apply", "context"],
  },
  {
    id: "js-gotchas",
    title: "Common JavaScript Confusions",
    level: "advanced",
    description: "A collection of surprising JavaScript behaviors that trip up almost everyone at some point.",
    explanation: `
Most of the time JavaScript behaves the way you'd expect. But it has a
handful of well-known quirks — leftover design decisions from decades
ago — that surprise even experienced developers the first time they hit
them. Knowing them in advance turns a confusing bug into "oh, that's
just how this works."
    `.trim(),
    analogy:
      "Think of these like the weird exceptions in English spelling — 'i before e except after c' has plenty of exceptions, and once you've been warned about them, they stop being confusing surprises and just become 'the known weird parts.'",
    examples: [
      {
        title: "A handful of classic surprises",
        code: `console.log(0.1 + 0.2);        // 0.30000000000000004
console.log(NaN === NaN);      // false
console.log(typeof null);      // "object"
console.log([] + []);          // "" (empty string)
console.log([1, 2] + [3, 4]);  // "1,23,4"`,
        walkthrough: [
          { code: "0.1 + 0.2", explanation: "Floating-point numbers can't represent 0.1 or 0.2 exactly, so tiny rounding errors leak into the result." },
          { code: "NaN === NaN", explanation: "NaN is defined to never equal anything, even itself — use Number.isNaN() to check for it instead." },
          { code: "typeof null", explanation: "A decades-old bug kept for backward compatibility — null is not actually an object." },
          { code: "[] + []", explanation: "Arrays get converted to strings for +, and an empty array becomes an empty string." },
        ],
      },
      {
        title: "More surprises: closures in loops, and array holes",
        code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// logs: 3, 3, 3 — not 0, 1, 2 (all three closures share the same "var i")

console.log([1, , 3].length); // 3 — the missing middle slot still counts`,
        explanation:
          "Using `var` in the loop means every callback closes over the exact same variable, which has already finished looping by the time the callbacks run — switching to `let` fixes it, since each iteration gets its own binding.",
      },
    ],
    howItWorks: `
Each of these traces back to a specific rule: floating-point numbers are
stored in binary and can't represent every decimal exactly; \`NaN\` is
specified to compare unequal to everything including itself;
\`typeof null\` returning "object" is a bug from JavaScript's very first
version that was never fixed, to avoid breaking existing code; and \`+\` on
non-numbers tries to convert its operands to primitives (often strings)
before combining them.
    `.trim(),
    whyItExists: `
These aren't bugs introduced by any particular program — they're
consequences of decisions (or accidents) baked into the language itself,
decades ago, that can't be changed without breaking the entire web.
Learning them once means you recognize the pattern instantly instead of
losing an hour to it in the future.
    `.trim(),
    whenToUse: `
Keep this list in mind whenever a result looks "obviously wrong" at a
glance — comparing floating-point numbers for exact equality, checking
for NaN, or relying on typeof for a null check. Recognizing these
patterns is what turns a mysterious bug into an instant diagnosis.
    `.trim(),
    whenNotToUse: `
You don't need to work around these preemptively everywhere — most code
never touches floating-point precision or NaN in a way that matters. Add
the specific safeguard (Number.isNaN, rounding, an explicit null check)
only where the code actually depends on getting it right.
    `.trim(),
    commonMistakes: [
      "Comparing floating-point calculations with `===` instead of checking they're 'close enough' (within a small tolerance).",
      "Using `someValue === NaN` to check for NaN — it will always be false; use `Number.isNaN(someValue)` instead.",
      "Checking `typeof value === \"object\"` to detect an object and forgetting that `null` passes that check too.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Predict, then verify, the result of `0.1 + 0.2 === 0.3`." },
      { difficulty: "Medium", prompt: "Write a function `isNullOrObject(value)` that correctly distinguishes `null` from a real object." },
      { difficulty: "Hard", prompt: "Write a function `safeEquals(a, b)` that correctly returns true for `NaN, NaN` while behaving like `===` for everything else." },
    ],
    interviewQuestions: [
      { question: "Why doesn't `0.1 + 0.2` equal `0.3` exactly in JavaScript?", answer: "Numbers are stored as binary floating-point, and most decimal fractions (including 0.1 and 0.2) can't be represented exactly in binary — the tiny rounding error that results is why the sum comes out as `0.30000000000000004` instead of a clean `0.3`." },
      { question: "Given floating-point imprecision, how should you actually compare two computed decimal numbers for \"equality\"?", answer: "Check that the difference between them is smaller than a small tolerance value (an \"epsilon\"), like `Math.abs(a - b) < 0.00001`, instead of using `===` directly on values that came from floating-point arithmetic." },
      { question: "Why is `NaN === NaN` false, and how do you correctly check whether a value is `NaN`?", answer: "`NaN` is specified to compare unequal to every value, including itself, so `===` can never confirm it. `Number.isNaN(value)` is the correct check — it doesn't rely on equality at all." },
      { question: "Why does `typeof null` return `\"object\"` even though `null` isn't really an object?", answer: "It's a bug baked into the very first version of JavaScript — an implementation detail where `null` and objects happened to share an internal type tag — that was never fixed because too much existing code would break if it changed." },
      { question: "Given that `typeof anArray` also returns `\"object\"`, how do you actually detect whether a value is specifically an array?", answer: "Use `Array.isArray(value)` — `typeof` can't tell an array apart from a plain object or any other non-primitive, since they're all `\"object\"` to it." },
      { question: "Why does `typeof someFunction` return `\"function\"` instead of `\"object\"`, given that functions are technically objects too?", answer: "`typeof` special-cases anything callable and reports it as `\"function\"` specifically, as a convenience, even though under the hood a function really is an object (with extra internal behavior for being invoked)." },
      { question: "Predict the output: `console.log([] + []);`", answer: "`\"\"` (an empty string) — the `+` operator converts both operands to primitives when neither is a number, and converting an empty array to a string gives `\"\"`; concatenating two empty strings is still `\"\"`." },
      { question: "Predict the output: `console.log([1, 2] + [3, 4]);`", answer: "`\"1,23,4\"` — each array is converted to a string first (`\"1,2\"` and `\"3,4\"`), and `+` then concatenates those two strings directly, with no space or separator inserted between them." },
      { question: "Predict the output: `console.log([] == false);`", answer: "`true` — `==` coerces both sides toward numbers when comparing an object and a boolean: `false` becomes `0`, and the array is first converted to a primitive string `\"\"`, then to the number `0`, so `0 == 0` is true." },
      { question: "What's the difference between `null == undefined` and `null === undefined`?", answer: "`null == undefined` is `true` — they're specifically defined to loosely equal each other and nothing else. `null === undefined` is `false`, since `===` never coerces types, and `null` and `undefined` are different types." },
      { question: "Predict the output: `console.log(\"0\" == false);` versus `console.log(\"0\" === false);`", answer: "The `==` version is `true`: both sides get coerced toward numbers, `false` becomes `0` and `\"0\"` becomes `0`, so they match. The `===` version is `false`, since a string and a boolean are never equal under strict equality regardless of their coerced values." },
      { question: "Predict the output: `console.log([1] == 1);`", answer: "`true` — `[1]` is first converted to a primitive, which stringifies to `\"1\"`, and that's then converted to the number `1` for the numeric comparison against `1`, so they end up equal." },
      { question: "Why is `{} === {}` always false, even when both object literals look identical?", answer: "`===` on objects compares identity — whether both sides are literally the exact same object in memory — not the contents. Two separately created objects are always different references, no matter how identical their properties look." },
      { question: "Predict the output: `console.log([25, 1, 10, 2].sort());`", answer: "`[1, 10, 2, 25]` — the default `.sort()` converts every element to a string first and compares them lexicographically (character by character), not numerically, so `\"10\"` sorts before `\"2\"` because `\"1\"` comes before `\"2\"` as a character; a numeric compare function like `(a, b) => a - b` is needed to sort numbers correctly." },
      { question: "Does `Array.prototype.sort()` mutate the original array, or return a new one?", answer: "It sorts in place and mutates the original array, while also returning that same array — it doesn't create a copy, so code that needs to preserve the original order should copy first, e.g. `[...arr].sort()`." },
      { question: "Why does `[NaN].indexOf(NaN)` return `-1`, and what should you use instead?", answer: "`.indexOf()` uses strict equality (`===`) internally to compare elements, and `NaN === NaN` is always false, so it can never \"find\" a `NaN` this way. `.includes()` uses a different comparison algorithm (SameValueZero) that treats `NaN` as equal to itself, so `[NaN].includes(NaN)` correctly returns `true`." },
      { question: "Predict the output: `for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }` versus the same loop with `let` instead of `var`.", answer: "With `var`, it logs `3, 3, 3` — all three callbacks close over the exact same single `i`, which has already finished the loop (ending at 3) by the time any of them run. With `let`, it logs `0, 1, 2`, because `let` creates a fresh binding of `i` for each iteration, so each callback captures its own separate value." },
      { question: "What is the \"temporal dead zone\" for `let` and `const`?", answer: "The span of code between the start of a scope and the actual `let`/`const` declaration line, during which the variable technically exists (it's been hoisted) but accessing it throws a `ReferenceError` instead of returning `undefined` — unlike `var`, which is initialized to `undefined` immediately." },
      { question: "Predict the output: `console.log(x); let x = 5;`", answer: "It throws a `ReferenceError` (\"Cannot access 'x' before initialization\") — `x` is in the temporal dead zone until its declaration line runs, so referencing it earlier fails loudly instead of silently returning `undefined` the way an equivalent `var` would." },
      { question: "How can forgetting `var`/`let`/`const` before an assignment accidentally create a global variable?", answer: "In non-strict (\"sloppy\") mode, assigning to a name that was never declared anywhere creates a brand-new property on the global object instead of throwing an error — silently leaking a variable into global scope, which strict mode (and modules, which are strict by default) disallows by throwing a `ReferenceError` instead." },
      { question: "Predict the output: `console.log(\"5\" - 2); console.log(\"5\" + 2);`", answer: "`3` and `\"52\"` — `-` only makes sense numerically, so it always coerces both sides to numbers first, giving `5 - 2 = 3`. `+` is overloaded for string concatenation, so when either side is a string, it concatenates instead of subtracting numerically, giving `\"5\" + \"2\" = \"52\"`." },
      { question: "Why are `[]` and `{}` both truthy in an `if` check, even though they're both \"empty\"?", answer: "JavaScript's falsy values are a fixed, specific list — `false`, `0`, `-0`, `\"\"`, `null`, `undefined`, and `NaN` — and every object (arrays and plain objects included, empty or not) is truthy by definition, regardless of how much or how little data it actually holds." },
      { question: "Predict the output: `console.log(new Array(3).length); console.log(new Array(3));`", answer: "`3` for the length, but the array itself is `[ <3 empty items> ]` — three actual holes, not three elements set to `undefined`. Methods like `.forEach()` and `.map()` skip holes entirely, which is a common surprise compared to an array explicitly filled with `undefined` (like `Array(3).fill(undefined)`)." },
      { question: "Predict the output: `function f() { return\n{ ok: true }; } console.log(f());`", answer: "`undefined` — JavaScript's automatic semicolon insertion silently inserts a semicolon right after `return` when it's immediately followed by a newline, turning it into `return;` on its own line, with the object literal on the next line becoming unreachable dead code." },
      { question: "Predict the output: `console.log(Object.keys({ b: 1, 2: \"x\", a: 3, 1: \"y\" }));`", answer: "`[\"1\", \"2\", \"b\", \"a\"]` — property keys that look like non-negative integers are always iterated first, in ascending numeric order, regardless of insertion order; only after those do the remaining string keys appear, in their original insertion order." },
      { question: "Why has it historically been important to always pass an explicit radix to `parseInt`, like `parseInt(str, 10)`?", answer: "Without a radix, older JavaScript engines would guess the base from the string's format — a leading `0` could make `parseInt(\"08\")` get interpreted as octal (base 8), where `8` isn't even a valid octal digit, producing surprising results. Modern engines default to base 10 without a leading `0x`, but always passing the radix explicitly removes any ambiguity or reliance on that default." },
      { question: "Predict the output: `console.log(\"10\" < \"9\");`", answer: "`true` — comparing two strings uses lexicographic (character-by-character) ordering, not numeric value, and the character `\"1\"` sorts before `\"9\"`, so `\"10\"` is considered \"less than\" `\"9\"` as text, even though 10 is numerically larger." },
      { question: "Why can you call a function before its definition appears later in the same scope, if it's a function declaration but not if it's a function expression assigned to a `var`?", answer: "A function declaration is hoisted completely, body and all, so it's fully usable from the very top of its scope. A `var` holding a function expression is only hoisted as a name initialized to `undefined` — the actual function value isn't assigned until execution reaches that line, so calling it earlier throws (\"is not a function\"), not because the name is undefined but because it hasn't been assigned yet at that point." },
      { question: "Why doesn't `typeof someUndeclaredVariable` throw an error, while directly referencing `someUndeclaredVariable` does?", answer: "`typeof` is specifically designed to safely report `\"undefined\"` for a name that was never declared at all, as a legacy safety net for checking whether a global exists without risking a crash — but actually using that undeclared name in any other expression throws a `ReferenceError` immediately." },
      { question: "Why might `delete obj.someProperty` silently do nothing instead of removing the property or throwing?", answer: "If the property was defined as non-configurable (which many built-in and some explicitly-defined properties are), `delete` simply fails without throwing in non-strict mode — it returns `false` to signal failure, but code that ignores that return value never notices, and the property just stays put." },
    ],
    prerequisites: ["data-types", "operators"],
    relatedTopics: ["data-types", "operators"],
    keywords: ["NaN", "floating point", "typeof null", "gotchas", "quirks", "confusions"],
  },
  {
    id: "error-handling",
    title: "Error Handling",
    level: "advanced",
    description: "Dealing with things that go wrong in your code on purpose, instead of letting the program crash.",
    explanation: `
Sometimes code can't do what it was asked — a network request fails, a
file doesn't exist, a value isn't what was expected. Left alone, this
throws an **error**, and unless something handles it, the program
crashes. JavaScript's \`try/catch\` lets you say: "attempt this, and if it
fails, run this other code instead of crashing."
    `.trim(),
    analogy:
      "It's like a safety net under a tightrope walker. You still attempt the risky move (the try), but if something goes wrong, the net (the catch) stops it from becoming a disaster.",
    examples: [
      {
        title: "try / catch / finally",
        code: `function parseUserAge(input) {
  try {
    const age = JSON.parse(input);
    if (typeof age !== "number") {
      throw new Error("Age must be a number");
    }
    return age;
  } catch (error) {
    console.log("Invalid input:", error.message);
    return null;
  } finally {
    console.log("Finished attempting to parse.");
  }
}`,
        walkthrough: [
          { code: "try {", explanation: "Marks the code that might fail." },
          { code: "const age = JSON.parse(input);", explanation: "If input isn't valid JSON, this throws automatically." },
          { code: 'throw new Error("Age must be a number");', explanation: "Manually throws an error if the parsed value isn't the right type." },
          { code: "} catch (error) {", explanation: "Runs only if something inside try threw — error holds the thrown value." },
          { code: "} finally {", explanation: "Runs no matter what — whether try succeeded or catch ran." },
        ],
      },
      {
        title: "A custom error class",
        code: `class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function setAge(age) {
  if (age < 0) {
    throw new ValidationError("Age can't be negative");
  }
  return age;
}

try {
  setAge(-5);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("Validation failed:", error.message);
  } else {
    throw error; // an error we didn't expect — let it propagate
  }
}`,
        explanation:
          "Custom error classes let a `catch` block tell different kinds of failures apart with `instanceof`, instead of treating every error the same way.",
      },
    ],
    howItWorks: `
When code inside \`try\` throws (either automatically, from a failing
operation, or manually via \`throw\`), JavaScript immediately stops
executing that block and jumps to the matching \`catch\`, skipping any
remaining lines in \`try\`. The optional \`finally\` block runs afterward no
matter what happened, useful for cleanup that must always happen.
    `.trim(),
    whyItExists: `
Without error handling, one unexpected failure anywhere would crash the
entire program. try/catch lets you contain failures to the specific
operation that caused them, respond sensibly (retry, show a message, use
a default), and keep the rest of the program running.
    `.trim(),
    whenToUse: `
Wrap code in try/catch around operations that can realistically fail in
ways you want to handle gracefully — parsing untrusted data, network
requests (often alongside async/await), or any operation whose failure
shouldn't crash the whole app.
    `.trim(),
    whenNotToUse: `
Don't wrap code in try/catch just out of caution when there's no
realistic failure to handle, or nothing sensible to do in the catch
block — silently swallowing errors that way can hide real bugs instead
of fixing them. And don't use exceptions for ordinary control flow (like
checking if a key exists) when a simple \`if\` would do.
    `.trim(),
    commonMistakes: [
      "Catching an error and doing nothing with it (an empty catch block), which hides bugs instead of fixing them.",
      "Forgetting that `catch` only catches errors thrown synchronously inside the try — a callback or an unawaited promise inside it can still throw unnoticed.",
      "Throwing plain strings or objects instead of an `Error` (or subclass), losing useful information like a stack trace.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a function that safely divides two numbers, throwing an error if the divisor is 0, and catching it to return `null` instead of crashing." },
      { difficulty: "Medium", prompt: "Create a custom error class `ValidationError extends Error` and throw/catch an instance of it." },
      { difficulty: "Hard", prompt: "Write an async function that retries a failing operation up to 3 times before giving up, using try/catch inside a loop." },
    ],
    interviewQuestions: [
      { question: "Does `finally` still run if the `try` block contains a `return` statement?", answer: "Yes — `finally` always runs before the function actually returns, no matter whether `try` completed normally, threw an error that got caught, or hit a `return` directly; there's no way to skip it short of the whole process crashing." },
      { question: "Predict the output: `function f() { try { return 1; } finally { return 2; } } console.log(f());`", answer: "`2` — a `return` inside `finally` completely overrides whatever `try` (or `catch`) was about to return, or even an error that was about to propagate. This is a well-known footgun, which is why returning from inside `finally` is generally avoided." },
      { question: "If an error is already propagating out of a `catch` block, and the paired `finally` block also throws, which error wins?", answer: "The one from `finally` — just like a `return` inside `finally` overrides an earlier one, a `throw` inside `finally` replaces whatever error was already on its way out, and the original error is lost entirely unless it was explicitly captured beforehand." },
      { question: "Can you write `try { ... } finally { ... }` with no `catch` at all? What happens to an error thrown inside `try` in that case?", answer: "Yes, that's valid syntax. `finally` still runs for cleanup, but since there's no `catch` to actually handle the error, it continues propagating upward afterward, exactly as if the `try/finally` wrapper weren't there for error-handling purposes — it only guarantees the cleanup code runs, not that the error is contained." },
      { question: "What is the \"optional catch binding\" syntax (`catch { ... }` with no parameter), and when is it useful?", answer: "It lets you write a `catch` block without capturing the error into a named variable, for cases where you genuinely don't need any information about what went wrong — just that something did — avoiding an unused variable purely to satisfy the older, mandatory syntax." },
      { question: "Why is throwing a plain string or plain object considered worse practice than throwing an `Error` instance?", answer: "An `Error` object automatically captures a stack trace and a consistent `message`/`name` shape the moment it's created, which is invaluable for debugging where and why something failed. A thrown string or plain object carries none of that — you lose the call-site information entirely." },
      { question: "What is `error.stack`, and where does its content actually come from?", answer: "It's a string, automatically populated when an `Error` (or subclass) is constructed, showing the sequence of function calls that were active at that moment — the call stack — which is why creating the `Error` object itself (not just throwing it) is what captures the trace." },
      { question: "What does the `cause` option in `new Error(message, { cause: originalError })` let you do?", answer: "It lets you attach an earlier, underlying error onto a new, higher-level one you're throwing instead — for example wrapping a low-level network error inside a more descriptive \"Failed to load user\" error — while preserving the original error (accessible via `.cause`) instead of discarding it." },
      { question: "Inside an `async` function's `try` block, does `catch` reliably handle a promise that's created but never `await`ed?", answer: "No — `try/catch` only catches a rejection at the exact point where `await` is used on that promise. A promise that's fired off without being awaited (or returned) inside the `try` can still reject later, completely outside the `try/catch`'s control, becoming an unhandled rejection instead of being caught there." },
      { question: "Why doesn't a `try/catch` wrapped around `setTimeout(() => { throw new Error(\"boom\"); }, 0)` catch that thrown error?", answer: "The `try/catch` block has already finished executing (its synchronous code ran and returned) long before the timer callback actually runs later, on its own turn through the event loop — by the time the error is thrown, there's no `try/catch` still \"active\" to catch it; the error has to be caught inside the callback itself." },
      { question: "How do you correctly handle an error from an older, callback-style asynchronous function (not one that returns a promise)?", answer: "Check for the error argument inside the callback itself (the common \"error-first callback\" convention), since a `try/catch` wrapped around the outer call can't reach into an error thrown later, inside a callback that runs on a different turn of the event loop." },
      { question: "What's the danger of an empty `catch` block that does nothing with the error it caught?", answer: "It silently swallows real failures — the program keeps running as if nothing went wrong, hiding bugs that would otherwise have been visible (via a crash or a log), often making the eventual symptom much harder to trace back to its actual cause." },
      { question: "How do you handle several different kinds of errors differently inside a single `catch` block?", answer: "Check the caught error's type with `instanceof`, from most specific to least specific (since a subclass is also an instance of its parent class), branching your handling logic accordingly — JavaScript doesn't support multiple typed `catch` clauses the way some other languages do, so this manual branching is the idiomatic replacement." },
      { question: "What are some of JavaScript's built-in `Error` subtypes, and what typically triggers each one?", answer: "`TypeError` for using a value in a way its type doesn't support (like calling a property that isn't a function, or reading a property off `null`/`undefined`); `RangeError` for a value outside an allowed range (like an invalid array length); `ReferenceError` for referencing a name that doesn't exist; and `SyntaxError` for malformed code or malformed input to something like `JSON.parse`." },
      { question: "Predict what each of these throws: `null.foo`, referencing an undeclared variable, and `JSON.parse(\"{bad\")`.", answer: "`null.foo` throws a `TypeError` (you can't read a property off `null`). Referencing an undeclared variable throws a `ReferenceError`. `JSON.parse(\"{bad\")` throws a `SyntaxError`, since the text isn't valid JSON. Knowing which is which lets a `catch` block respond appropriately instead of treating every failure identically." },
      { question: "When should you rethrow an error you just caught, instead of handling it right there?", answer: "When the current code doesn't actually have enough context or ability to do anything meaningful about the failure — logging it and swallowing it would just hide the problem from whoever (or whatever layer) actually could handle it correctly, so letting it keep propagating upward is the more honest response." },
      { question: "When is throwing an exception the right call for invalid input, versus just returning early with an `if` check or an error code?", answer: "Exceptions fit exceptional, unexpected situations that the immediate caller likely didn't anticipate and can't just check for beforehand (a network failure, a corrupt file). For ordinary, expected conditions a caller should routinely check (an empty search result, a missing optional field), a plain return value or early `if`/return is usually clearer and cheaper than throwing." },
      { question: "How does extending `Error` correctly (`class ValidationError extends Error { constructor(msg) { super(msg); ... } }`) preserve `instanceof` checks?", answer: "Calling `super(message)` runs `Error`'s own constructor logic, which properly wires up the new object's prototype chain back through `Error.prototype`, so `error instanceof ValidationError` and `error instanceof Error` both correctly return `true` — skipping `super()` (or not extending `Error` at all) breaks that chain." },
      { question: "Is it possible for `error instanceof MyCustomError` to fail even when the error really was thrown as `new MyCustomError(...)`?", answer: "Yes, in some unusual setups — for example transpiling class syntax down to an older JS target without special handling for built-in extension can break the prototype chain, since natively extending `Error` relies on engine behavior that a naive transpilation doesn't always replicate correctly." },
      { question: "What's an \"unhandled promise rejection\", and how is it different from an uncaught synchronous exception?", answer: "It's a promise that rejected with no `.catch()` (or awaiting `try/catch`) ever attached to observe the failure. Unlike a synchronous uncaught exception, which typically halts execution immediately at that point, an unhandled rejection is detected asynchronously — the environment (browser or Node) reports it separately, sometimes well after the rejection actually happened." },
      { question: "How would you set up a last-resort handler to catch errors that slipped past every other `try/catch` in an app?", answer: "In a browser, listen for the global `error` event (or set `window.onerror`) for uncaught synchronous exceptions, and the `unhandledrejection` event for unhandled promise rejections. In Node.js, `process.on(\"uncaughtException\", ...)` and `process.on(\"unhandledRejection\", ...)` serve the same purpose — though these are meant as a last-resort safety net for logging/cleanup, not a substitute for handling errors closer to where they happen." },
      { question: "If every code path inside a `try` block ends in a `return`, does the paired `finally` block still get a chance to run before the function actually returns?", answer: "Yes — `finally` always runs immediately before control actually leaves the function, regardless of which `return` path was taken inside `try`, since `finally`'s entire purpose is to guarantee cleanup runs no matter how the try/catch is exited." },
      { question: "What's the tradeoff between wrapping a `try/catch` around each iteration of a loop individually versus wrapping the entire loop in one `try/catch`?", answer: "Catching per-iteration lets the loop continue processing the remaining items even if one fails, at the cost of slightly more code; wrapping the whole loop stops everything the moment any single iteration fails, which is simpler but means one bad item can prevent all the others from ever being processed." },
      { question: "Why is it risky to rely on one giant `try/catch` around an entire application as the main error-handling strategy?", answer: "It tends to catch and quietly swallow a huge variety of unrelated failures in one place, far from where each actually happened and with little context to respond appropriately — real bugs get hidden behind a generic \"something went wrong\" instead of being handled (or at least surfaced clearly) close to their source." },
      { question: "Can a single `try` block have multiple `catch` clauses for different error types, the way some other languages allow?", answer: "No — JavaScript only supports one `catch` block per `try`. Distinguishing between error types has to happen manually inside that one `catch`, typically with `instanceof` checks." },
      { question: "What happens if the code inside a `catch` block itself throws a new error?", answer: "That new error propagates upward from the `catch` block exactly like any other thrown error would — it isn't caught by the very same `catch` block that produced it; you'd need an enclosing `try/catch` around the whole thing to handle a failure that happens during error handling itself." },
      { question: "Is there a meaningful runtime performance penalty to wrapping code in `try/catch` in modern JavaScript engines?", answer: "Not really, for the common case — modern engines optimize `try/catch` blocks well, and the old advice to avoid them for performance reasons is largely outdated; the far more important consideration is using them where they add clarity and safety, not micro-optimizing them away." },
      { question: "Why should error messages meant for logging or debugging often be different from what's shown directly to an end user?", answer: "A log-facing message can safely include technical detail (stack traces, internal identifiers, exact failure reasons) that's useful for diagnosing the problem but meaningless or even risky (leaking internals) to show a user, who generally needs a simpler, actionable message instead." },
      { question: "What's the benefit of a function throwing early (\"failing fast\") on invalid input, instead of letting bad data quietly propagate deeper into the program?", answer: "It surfaces the problem at its actual source, with a clear, specific error message and a stack trace pointing at the real cause — instead of the program continuing on with corrupted data and failing confusingly much later, somewhere that has no direct connection to where things actually went wrong." },
      { question: "How would you write a function that retries a flaky operation up to a fixed number of times before finally giving up?", answer: "Loop up to the retry limit, wrapping the attempt in `try/catch` each time: on success, return immediately; on failure, catch the error and either continue to the next attempt, or, once the limit is reached, rethrow the last error (or return an explicit failure) instead of silently giving up." },
    ],
    prerequisites: ["functions"],
    relatedTopics: ["promises", "async-await"],
    keywords: ["try", "catch", "finally", "throw", "Error", "exception"],
  },
  {
    id: "modules",
    title: "Modules",
    level: "advanced",
    description: "Splitting code across multiple files, and sharing pieces between them deliberately.",
    explanation: `
A real application quickly grows beyond a single file. **Modules** let
you split code into separate files, each responsible for one thing, and
explicitly control what's shared between them using \`export\` (to make
something available to other files) and \`import\` (to bring it in).
    `.trim(),
    analogy:
      "Think of modules like separate departments in a company. Each department (file) does its own work internally, but only shares specific documents (exports) with other departments that specifically ask for them (imports) — nobody has to see everything happening everywhere.",
    examples: [
      {
        title: "Exporting and importing",
        code: `// math.js
export function add(a, b) {
  return a + b;
}
export const PI = 3.14159;

// app.js
import { add, PI } from "./math.js";

console.log(add(2, 3)); // 5
console.log(PI);        // 3.14159`,
        walkthrough: [
          { code: "export function add(a, b) {...}", explanation: "Makes the add function available to other files." },
          { code: "export const PI = 3.14159;", explanation: "Makes PI available too — a module can export multiple things." },
          { code: 'import { add, PI } from "./math.js";', explanation: "Brings both named exports into app.js." },
          { code: "add(2, 3);", explanation: "Uses the imported function exactly like a locally defined one." },
        ],
      },
      {
        title: "A default export",
        code: `// user.js
export default class User {
  constructor(name) {
    this.name = name;
  }
}

// app.js
import User from "./user.js"; // any name works for a default import

const amara = new User("Amara");`,
        explanation:
          "A module can have at most one default export, and the importer is free to name it whatever they like — unlike named exports, which must be imported by their exact name.",
      },
    ],
    howItWorks: `
Each file is its own module with its own private scope — nothing inside
it is visible elsewhere unless explicitly exported. When a file imports
from another, JavaScript loads that module (once, even if imported from
many places), runs it, and hands over exactly the exported bindings that
were requested.
    `.trim(),
    whyItExists: `
Without modules, every file's code shares one giant global scope — names
collide, and there's no way to tell what depends on what just by looking
at a file. Modules give every file its own scope and make dependencies
explicit and traceable.
    `.trim(),
    whenToUse: `
Split code into modules as soon as a single file starts covering more
than one clear responsibility — a set of utility functions, a component,
a set of related constants. Import only the specific pieces a file
actually needs.
    `.trim(),
    whenNotToUse: `
For a truly tiny script, splitting into multiple files and modules can
add more overhead (import paths to manage) than it saves. And avoid
modules that import from each other in a circular way (A imports B,
which imports A) — it's a common source of confusing bugs.
    `.trim(),
    commonMistakes: [
      "Forgetting the file extension or path in an import in environments that require it.",
      "Exporting far more than a module actually needs to share, making its real public surface unclear.",
      "Creating circular imports between two modules that depend on each other.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Create a module that exports a `greet(name)` function, and import it into another file to use it." },
      { difficulty: "Medium", prompt: "Create a module with both a default export and a couple of named exports, and import all of them correctly." },
      { difficulty: "Hard", prompt: "Split a small script's logic into three modules with clear, single responsibilities, importing only what each one needs." },
    ],
    interviewQuestions: [
      { question: "What's the difference between a named export and a default export?", answer: "A module can have many named exports (imported with exact names in `{}`) but only one default export (imported under any name you choose)." },
      { question: "Why are modules better than one giant global script?", answer: "They keep variables scoped to their own file by default, and make what's shared between files explicit and traceable through imports." },
      { question: "What is a circular dependency?", answer: "When two modules import from each other, directly or indirectly, which can cause one of them to receive an incomplete, partially-loaded version of the other." },
    ],
    prerequisites: ["functions"],
    relatedTopics: ["scope"],
    keywords: ["import", "export", "module", "default export", "named export"],
  },
  {
    id: "memory-management",
    title: "Memory Management",
    level: "advanced",
    description: "How JavaScript decides when a piece of data is no longer needed and can be cleaned up.",
    explanation: `
Every variable, object, and function your program creates takes up a
little bit of memory. If nothing ever cleaned that memory up, a
long-running program would eventually use more and more memory until it
crashed. JavaScript handles this automatically using a process called
**garbage collection**: it periodically looks for data that nothing in
your program can reach anymore, and frees that memory.
    `.trim(),
    analogy:
      "Think of memory like a warehouse, and garbage collection like a janitor who periodically checks for boxes with no one holding the claim ticket anymore — if nobody can reach a box, it's safe to throw out and reuse the space.",
    examples: [
      {
        title: "Reachability determines what stays in memory",
        code: `let user = { name: "Amara" };
// user is reachable — the object stays in memory

user = null;
// nothing references the { name: "Amara" } object anymore
// it becomes eligible for garbage collection`,
        walkthrough: [
          { code: 'let user = { name: "Amara" };', explanation: "Creates an object and stores a reference to it in user." },
          { code: "// user is reachable", explanation: "As long as some variable can reach it, JavaScript keeps it in memory." },
          { code: "user = null;", explanation: "Removes the only reference to that object." },
          { code: "// eligible for garbage collection", explanation: "With nothing left pointing to it, the object can be safely cleaned up." },
        ],
      },
      {
        title: "A common leak: a forgotten timer",
        code: `function startPolling(element) {
  const id = setInterval(() => {
    element.textContent = new Date().toLocaleTimeString();
  }, 1000);

  return () => clearInterval(id); // caller must call this to stop it
}

const stopPolling = startPolling(document.querySelector("#clock"));
// ...later, when the clock is no longer needed:
stopPolling();`,
        explanation:
          "As long as `setInterval` keeps running, its callback (and everything it closes over, including `element`) stays reachable — forgetting to call `clearInterval` is one of the most common real-world memory leaks.",
      },
    ],
    howItWorks: `
JavaScript's garbage collector uses a strategy called "mark and sweep":
starting from things it knows are always reachable (like global
variables and anything currently running), it walks through every
reference it can find, marking each reachable object. Anything left
unmarked afterward — unreachable from anywhere your code could still get
to — gets swept away and its memory reused.
    `.trim(),
    whyItExists: `
Manually tracking and freeing memory (as some other languages require)
is tedious and a common source of serious bugs — using memory after it's
freed, or forgetting to free it at all. Automatic garbage collection
removes that entire category of mistakes from everyday JavaScript code.
    `.trim(),
    whenToUse: `
You don't manually trigger garbage collection — it's automatic. Where
this becomes actively relevant is when you're deliberately clearing
references to large objects you no longer need (setting a variable to
\`null\`), or diagnosing a "memory leak" where memory usage keeps climbing
over time.
    `.trim(),
    whenNotToUse: `
Don't obsessively null out every local variable "just in case" — local
variables are automatically freed once a function returns and nothing
else references them. Focus on real leaks: forgotten event listeners,
timers that are never cleared, and references held in long-lived caches
or closures.
    `.trim(),
    commonMistakes: [
      "Leaving event listeners or timers (`setInterval`) running on elements/objects that are otherwise done being used, keeping them reachable forever.",
      "Storing ever-growing data in a long-lived cache or array with no eviction, slowly consuming more and more memory.",
      "Assuming JavaScript frees memory the instant a variable goes out of scope — garbage collection runs periodically, not necessarily immediately.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, why setting a variable to `null` can help release memory." },
      { difficulty: "Medium", prompt: "Describe a scenario where a forgotten `setInterval` could cause a memory leak, and how you'd fix it." },
      { difficulty: "Hard", prompt: "Explain why a closure that captures a large object can unintentionally keep that object in memory long after it's needed." },
    ],
    interviewQuestions: [
      { question: "What is garbage collection?", answer: "The automatic process JavaScript uses to find and free memory used by objects that are no longer reachable by the program." },
      { question: "What makes an object eligible for garbage collection?", answer: "Nothing in the program can reach it anymore — no variable, closure, or reachable structure still holds a reference to it." },
      { question: "What is a memory leak in JavaScript, given it has garbage collection?", answer: "Memory that's technically still reachable (so it won't be collected) but is no longer actually needed — commonly caused by forgotten timers, event listeners, or ever-growing caches." },
    ],
    prerequisites: ["closures"],
    relatedTopics: ["closures", "event-loop"],
    keywords: ["garbage collection", "memory leak", "reachability", "mark and sweep"],
  },
  {
    id: "optional-chaining",
    title: "Optional Chaining & Nullish Coalescing",
    level: "advanced",
    description: "Safely reading deeply nested properties, and providing defaults, without a pile of manual checks.",
    explanation: `
Reading a property that's nested a few levels deep — \`user.address.city\`
— crashes the whole program if \`user\` or \`address\` happens to be
missing. Before modern JavaScript, safely handling that meant a chain of
manual checks: \`if (user && user.address && user.address.city)\`.
**Optional chaining** (\`?.\`) does this automatically: it stops and
returns \`undefined\` the moment it hits something missing, instead of
throwing an error.

Its common partner, **nullish coalescing** (\`??\`), lets you supply a
default value specifically for when something is \`null\` or \`undefined\` —
without accidentally overriding valid values like \`0\` or \`""\` the way
\`||\` would.
    `.trim(),
    analogy:
      "Optional chaining is like carefully checking each door is unlocked before walking through it, instead of just barreling into a locked door and getting hurt. Nullish coalescing is a backup plan — 'if there's truly nothing here, use this instead' — that's careful not to override an answer you deliberately gave, like zero.",
    examples: [
      {
        title: "Optional chaining and nullish coalescing together",
        code: `const user = { name: "Amara", address: null };

console.log(user.address.city);   // ❌ throws: Cannot read properties of null
console.log(user.address?.city);  // undefined — no crash

const city = user.address?.city ?? "Unknown city";
console.log(city); // "Unknown city"

const count = 0;
console.log(count || 10); // 10 — wrong! 0 is falsy, so || replaces it
console.log(count ?? 10); // 0 — right! ?? only replaces null/undefined`,
        walkthrough: [
          { code: "user.address?.city", explanation: "Checks if user.address exists before trying to read .city; since it's null, the expression short-circuits to undefined." },
          { code: 'user.address?.city ?? "Unknown city";', explanation: "If the left side is null or undefined, falls back to the right side." },
          { code: "count || 10", explanation: "Replaces count with 10 because 0 is falsy — often not what you want." },
          { code: "count ?? 10", explanation: "Keeps 0, because ?? only falls back on null or undefined, not on every falsy value." },
        ],
      },
      {
        title: "Optional chaining with function calls and arrays",
        code: `const api = {
  getUser: null, // maybe not loaded yet
};

api.getUser?.(1);      // undefined — skipped, doesn't throw

const users = null;
console.log(users?.[0]); // undefined — safe even though users isn't an object at all`,
        explanation:
          "`?.()` guards a function call that might not exist, and `?.[...]` guards array/bracket access the same way `?.` guards a plain property.",
      },
    ],
    howItWorks: `
\`?.\` checks whether the value immediately to its left is \`null\` or
\`undefined\` before continuing; if so, the entire chain short-circuits and
evaluates to \`undefined\` without attempting the rest. \`??\` checks only
its left-hand side: if it's \`null\` or \`undefined\`, it evaluates to the
right-hand side; otherwise, it keeps the left-hand value — even if that
value is \`0\`, \`""\`, or \`false\`.
    `.trim(),
    whyItExists: `
Deeply nested, possibly-missing data (like optional fields from an API)
used to require long chains of manual \`&&\` checks just to avoid
crashing. These two operators cover that extremely common need directly,
making the code both safer and shorter.
    `.trim(),
    whenToUse: `
Use \`?.\` whenever you're reading a property that might not exist at some
level — optional API fields, optional configuration, DOM elements that
might not be present. Use \`??\` whenever you want a default specifically
for missing values, and your valid values might include falsy-but-real
ones like \`0\` or \`""\`.
    `.trim(),
    whenNotToUse: `
Don't sprinkle \`?.\` everywhere defensively on data you actually know is
always present — it can silently hide a bug that should have thrown an
error and alerted you to a real problem. And use \`||\` instead of \`??\`
when you genuinely want to replace any falsy value, not just
null/undefined.
    `.trim(),
    commonMistakes: [
      "Using `?.` so liberally that a genuinely broken/missing value is silently swallowed as `undefined` instead of surfacing a helpful error.",
      "Using `||` for defaults when `0`, `\"\"`, or `false` are valid values you don't want replaced — `??` is usually the safer choice.",
      "Forgetting that `?.` only guards against `null`/`undefined`, not against other unexpected types.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use optional chaining to safely read `user.profile.bio` when `profile` might be missing." },
      { difficulty: "Medium", prompt: "Use `??` to provide a default page size of 10 when a `pageSize` variable might be `0`, `null`, or `undefined` — and explain why `||` would behave differently." },
      { difficulty: "Hard", prompt: "Rewrite a function that used several `&&` checks to safely access nested data, using optional chaining and nullish coalescing instead." },
    ],
    interviewQuestions: [
      { question: "What does `?.` do?", answer: "It safely accesses a property, only continuing if the value to its left isn't null or undefined, otherwise short-circuiting to undefined instead of throwing." },
      { question: "How is `??` different from `||`?", answer: "`??` only falls back when the left side is null or undefined; `||` falls back for any falsy value, including 0, \"\", and false." },
      { question: "Can you call a function with optional chaining?", answer: "Yes — `obj.method?.()` calls method only if it exists, otherwise evaluates to undefined." },
    ],
    prerequisites: ["objects", "operators"],
    relatedTopics: ["objects", "operators"],
    keywords: ["optional chaining", "nullish coalescing", "?.", "??"],
  },
  {
    id: "json",
    title: "JSON",
    level: "advanced",
    description: "A simple, text-based format for representing data, used constantly to send information between programs.",
    explanation: `
When two different programs need to share data — a browser and a
server, for example — they need a shared, text-based way to represent
it, since raw JavaScript objects only exist inside a running JavaScript
program. **JSON** (JavaScript Object Notation) is that shared format:
plain text that looks a lot like a JavaScript object or array, that
virtually every programming language knows how to read and write.
    `.trim(),
    analogy:
      "JSON is like a universally understood recipe card format. Any chef (any programming language) can read a recipe written in that standard format, even if their own kitchen (their own language) is completely different from the one that wrote it.",
    examples: [
      {
        title: "Converting between objects and JSON text",
        code: `const user = { name: "Amara", age: 28 };

const json = JSON.stringify(user);
console.log(json); // '{"name":"Amara","age":28}' — now just text

const parsed = JSON.parse(json);
console.log(parsed.name); // "Amara" — back to a real object`,
        walkthrough: [
          { code: 'const user = { name: "Amara", age: 28 };', explanation: "A regular JavaScript object, only usable inside this program." },
          { code: "JSON.stringify(user);", explanation: "Converts it into a plain text string in JSON format." },
          { code: "console.log(json);", explanation: "That text can now be sent over a network or saved to a file." },
          { code: "JSON.parse(json);", explanation: "Converts JSON text back into a real JavaScript object." },
        ],
      },
      {
        title: "Saving and restoring data with localStorage",
        code: `const settings = { theme: "dark", fontSize: 16 };

localStorage.setItem("settings", JSON.stringify(settings));

// ...later, maybe after a page reload:
const saved = JSON.parse(localStorage.getItem("settings"));
console.log(saved.theme); // "dark"`,
        explanation:
          "`localStorage` can only store strings, so JSON is the standard way to save a structured object into it and read a real object back out later.",
      },
    ],
    howItWorks: `
\`JSON.stringify\` walks through an object or array and produces a text
representation following JSON's strict rules (double-quoted keys, no
functions, no \`undefined\`). \`JSON.parse\` does the reverse: it reads that
text and reconstructs the equivalent JavaScript value. Both are pure
text transformations — nothing about JSON itself is JavaScript-specific,
even though its syntax was inspired by JavaScript object literals.
    `.trim(),
    whyItExists: `
Before JSON became standard, exchanging structured data between
different systems (especially over the web) often meant using more
verbose formats like XML, or inventing custom ones. JSON's simplicity
and close resemblance to JavaScript objects made it the dominant format
for APIs and configuration.
    `.trim(),
    whenToUse: `
Use JSON whenever you need to send structured data between a client and
a server (most API responses are JSON), save structured data to a file
or localStorage, or pass data between programs written in different
languages.
    `.trim(),
    whenNotToUse: `
JSON can't represent everything a JavaScript value can — functions,
\`undefined\`, and circular references are all silently dropped or cause
an error. For data that needs those things, or that's extremely large
and performance-sensitive, other formats or approaches might fit better.
    `.trim(),
    commonMistakes: [
      "Trying to `JSON.stringify` an object containing functions or `undefined` values and being surprised they're silently dropped.",
      "Forgetting that `JSON.parse` throws an error on invalid JSON text, and not wrapping it in a try/catch when the input isn't guaranteed to be valid.",
      "Assuming JSON supports comments or trailing commas — it doesn't; it's stricter than a plain JavaScript object literal.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Convert a small object to a JSON string with `JSON.stringify`, then back with `JSON.parse`, and confirm the values match." },
      { difficulty: "Medium", prompt: "Store an object in `localStorage` as a JSON string, then read and parse it back on page load." },
      { difficulty: "Hard", prompt: "Write a function that safely parses possibly-invalid JSON text, returning `null` instead of throwing if it's malformed." },
    ],
    interviewQuestions: [
      { question: "What does `JSON.stringify` do?", answer: "Converts a JavaScript value into a JSON-formatted text string." },
      { question: "What happens to functions and `undefined` values when you stringify an object containing them?", answer: "They're omitted entirely from the resulting JSON string — JSON has no way to represent them." },
      { question: "Why is JSON so commonly used for APIs?", answer: "It's simple, lightweight, human-readable, and supported natively or via libraries in virtually every programming language." },
    ],
    prerequisites: ["objects", "arrays"],
    relatedTopics: ["objects", "arrays"],
    keywords: ["JSON", "stringify", "parse", "serialization"],
  },
  {
    id: "map-and-set",
    title: "Map and Set",
    level: "advanced",
    description: "Two built-in collections — Map for key-value pairs, Set for unique values — that improve on what plain objects and arrays can do.",
    explanation: `
You've already used plain objects as key-value stores, and arrays as
ordered lists. **Map** and **Set** are more specialized built-in
collections that fix a few rough edges: a \`Map\` lets you use any value
(not just strings) as a key and keeps track of its own size; a \`Set\`
stores a collection of values with no duplicates allowed, automatically.
    `.trim(),
    analogy:
      "A Map is like a proper dictionary with tabs for any kind of entry — not just word-shaped ones. A Set is like a guest list where the bouncer automatically refuses to add the same name twice, no matter how many times you try.",
    examples: [
      {
        title: "Map and Set basics",
        code: `const scores = new Map();
scores.set("amara", 90);
scores.set("diego", 85);

console.log(scores.get("amara")); // 90
console.log(scores.size);         // 2

const uniqueNumbers = new Set([1, 2, 2, 3, 3, 3]);
console.log(uniqueNumbers.size);   // 3
console.log(uniqueNumbers.has(2)); // true`,
        walkthrough: [
          { code: "const scores = new Map();", explanation: "Creates an empty Map." },
          { code: 'scores.set("amara", 90);', explanation: "Stores a key-value pair; unlike an object, the key could be any type, not just a string." },
          { code: 'scores.get("amara");', explanation: "Reads back the value for that key." },
          { code: "scores.size", explanation: "A real property that always reflects the current number of entries." },
          { code: "new Set([1, 2, 2, 3, 3, 3]);", explanation: "Automatically drops duplicate values, keeping each unique value only once." },
        ],
      },
      {
        title: "Removing duplicates from an array with Set",
        code: `const numbers = [1, 2, 2, 3, 1, 4];

const unique = [...new Set(numbers)];
console.log(unique); // [1, 2, 3, 4]`,
        explanation:
          "Spreading a Set back into an array is a common one-line pattern for deduplicating an array while preserving the first occurrence of each value.",
      },
    ],
    howItWorks: `
A \`Map\` stores entries in insertion order and, internally, uses the same
kind of fast key-based lookup a hash table does — but without a plain
object's quirks (string-coerced keys, inherited properties getting in
the way). A \`Set\` is really just a \`Map\` that only cares about the
keys — adding a value that's already present is simply a no-op.
    `.trim(),
    whyItExists: `
Plain objects were never really designed to be general-purpose maps —
keys are always converted to strings, there's no built-in size, and
inherited properties can sneak in unexpectedly. Map and Set exist
specifically to be clean, purpose-built collections without that
historical baggage.
    `.trim(),
    whenToUse: `
Reach for a \`Map\` when your keys aren't simple strings, when you need a
reliable \`.size\`, or when insertion order matters and must be preserved.
Reach for a \`Set\` whenever you need a collection of values with
automatic deduplication — removing duplicates from an array, or tracking
a group of unique items.
    `.trim(),
    whenNotToUse: `
For a simple, small collection of string keys — especially one that's
going to be serialized with \`JSON.stringify\` (which doesn't support
Map/Set directly) — a plain object or array is often simpler and more
familiar.
    `.trim(),
    commonMistakes: [
      "Trying to `JSON.stringify` a Map or Set directly and being surprised it doesn't serialize the way a plain object or array does.",
      "Using `.length` on a Map or Set instead of the correct property, `.size`.",
      "Forgetting that Set only removes duplicate values — it doesn't otherwise change the order or type of the data.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use a `Set` to remove duplicate values from an array of numbers." },
      { difficulty: "Medium", prompt: "Use a `Map` to count how many times each word appears in a sentence, and log the results." },
      { difficulty: "Hard", prompt: "Write a function that returns the intersection (common values) of two arrays, using Sets." },
    ],
    interviewQuestions: [
      { question: "What's the main advantage of Map over a plain object for key-value storage?", answer: "Map allows any value as a key (not just strings), maintains a reliable `.size`, and doesn't risk inherited properties interfering with lookups." },
      { question: "How does Set handle duplicate values?", answer: "It silently ignores an attempt to add a value that's already present — a Set can only ever contain unique values." },
      { question: "Can you iterate over a Map in insertion order?", answer: "Yes — Maps (and Sets) always iterate in the order entries were inserted." },
    ],
    prerequisites: ["objects"],
    relatedTopics: ["objects", "arrays"],
    keywords: ["Map", "Set", "size", "unique values", "key-value"],
  },
];
