import type { Topic } from "../../types/content";

export const javascriptAdvancedTopics: Topic[] = [
  {
    id: "promises",
    title: "Promises",
    level: "advanced",
    description: "An object that represents a value you'll get later, not right now.",
    explanation: `
Some tasks take time: fetching data, reading a file, waiting a few seconds.
JavaScript can't just stop and wait, because that would freeze the page.
It needs a way to say "start this, and tell me when it's done."

A **Promise** is an object for a value that isn't ready yet. It ends up
either **resolved** (success) or **rejected** (failure). You say what to do
in each case with \`.then()\` and \`.catch()\`.
    `.trim(),
    analogy:
      "A promise is like a food delivery tracking number. You don't have the food yet, but you have something that stands for it, and you get told when it arrives or if the order fails.",
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
          { code: "return new Promise((resolve) => {", explanation: "Creates a pending promise. Call resolve when the work succeeds." },
          { code: 'setTimeout(() => { resolve("Done waiting!"); }, 1000);', explanation: "After 1 second, calls resolve with the result, so the promise is fulfilled." },
          { code: "waitOneSecond().then((message) => ...)", explanation: "Runs once the promise resolves, with the resolved value." },
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
          "`reject(...)` marks the promise as failed. Control jumps straight to `.catch()` and skips `.then()`.",
      },
    ],
    howItWorks: `
A promise starts out "pending". When the task finishes, it calls one of:

- \`resolve(value)\`: the promise becomes "fulfilled" and \`.then()\` callbacks run.
- \`reject(error)\`: the promise becomes "rejected" and \`.catch()\` runs.

Once settled, the outcome never changes.
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
Before promises, running async steps in order ("fetch a user, then their
orders, then the order details") meant deeply nested callbacks that were
hard to read and easy to get wrong. Promises give async code one consistent
shape and let you handle errors in one place.
    `.trim(),
    whenToUse: `
Use a promise for anything that finishes later (fetching data, reading a
file, waiting on a timer) when you want a clear way to handle success and
failure.
    `.trim(),
    whenNotToUse: `
Don't wrap work that finishes instantly in a promise; it only adds overhead.
In modern code you'll rarely write \`.then()\` chains by hand. Use
\`async/await\` instead, and write raw promises mainly when building the
underlying async function.
    `.trim(),
    commonMistakes: [
      "Forgetting to add a `.catch()`, so errors disappear silently.",
      "Nesting `.then()` calls instead of chaining them, which brings back the mess promises were meant to fix.",
      "Forgetting to `return` a value inside a `.then()`, so the next `.then()` gets nothing.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Create a promise that resolves with your name after 500ms, and log it with `.then()`." },
      { difficulty: "Medium", prompt: "Create a promise that randomly resolves or rejects, and handle both cases." },
      { difficulty: "Hard", prompt: "Chain three promises together, each depending on the previous result, using `.then()`." },
    ],
    interviewQuestions: [
      { question: "What are the three states a promise can be in, and can it move backward between them?", answer: "Pending, fulfilled and rejected. A promise only moves forward: pending to fulfilled, or pending to rejected. Once settled it stays there; it can't go back to pending or flip to the other outcome." },
      { question: "What's the difference between `.then()` and `.catch()`?", answer: "`.then(onFulfilled, onRejected)` can handle both outcomes. `.catch(onRejected)` is shorthand for `.then(undefined, onRejected)` and handles only rejection. `.catch()` is preferred because it also catches rejections and thrown errors from earlier `.then()` callbacks in the chain, not just the original promise." },
      { question: "What does `Promise.all()` do, and how does it behave if one promise rejects?", answer: "It takes an iterable of promises and returns one promise that fulfills with an array of all results, once every promise fulfills. If any promise rejects, `Promise.all()` rejects right away with that reason. It doesn't wait for the others, but their work keeps running because promises can't be cancelled." },
      { question: "What does `Promise.allSettled()` do, and how does it differ from `Promise.all()`?", answer: "It waits for every promise to settle and always resolves (never rejects) with an array of objects like `{status: 'fulfilled', value}` or `{status: 'rejected', reason}`. Unlike `Promise.all()`, one failure doesn't stop it; you get a report of every outcome." },
      { question: "What does `Promise.race()` do?", answer: "It returns a promise that settles as soon as the first input promise settles, with that promise's outcome, fulfilled or rejected. The rest are ignored." },
      { question: "What does `Promise.any()` do, and how is it different from `Promise.race()`?", answer: "It resolves as soon as the first promise fulfills and ignores rejections along the way. Unlike `Promise.race()`, one rejection doesn't end it. It only rejects if every promise rejects, with an `AggregateError` holding all the reasons." },
      { question: "You need to run four independent API calls and proceed only if all succeed, failing fast if any fails. Which combinator fits, and why not the others?", answer: "`Promise.all()`. It gives you all four results and rejects on the first failure, which matches 'all must succeed'. `Promise.allSettled()` doesn't fail fast because it waits for every call. `Promise.race()` and `Promise.any()` only care about one winner, not all four." },
      { question: "Once a promise has settled, can calling `resolve()` again change its value?", answer: "No. A promise settles only once. After the first `resolve` or `reject` call in the executor, later calls are silently ignored, so the outcome can't change." },
      { question: "What is a 'thenable', and why does it matter for promises?", answer: "Any object with a `.then(onFulfilled, onRejected)` method, even if it isn't a real `Promise`. `Promise.resolve(thenable)` and returning a thenable from a `.then()` callback both wait for it to settle instead of treating it as a plain value. That is how other libraries work with native promises." },
      { question: "What happens if you `return` a promise from inside a `.then()` callback?", answer: "The chain waits for the returned promise to settle, then passes its resolved value (not the promise) to the next `.then()`. This flattening lets you chain async steps instead of nesting promises." },
      { question: "Predict the output: a chain starts with `Promise.resolve(1)`, then adds 1, then throws inside the next `.then()`, then has a final `.then()` that logs, then a `.catch()` that logs the error message. What actually logs?", answer: "Only the `.catch()` log runs. The error thrown in the second `.then()` rejects the chain there. Every later `.then()` is skipped, since they only run on fulfillment, until the `.catch()` handles the rejection." },
      { question: "If you forget to add a `.catch()` to a chain that ends up rejecting, what actually happens?", answer: "It becomes an 'unhandled promise rejection'. In a browser this fires an `unhandledrejection` event and usually logs a warning. In Node.js it logs a warning by default and, depending on version and configuration, can crash the process. It is meant to surface as a bug, not be silently swallowed." },
      { question: "Can a `.catch()` handler catch an error thrown by an earlier `.then()` in the same chain?", answer: "Yes. A rejection or thrown error anywhere in a chain skips past every `.then()` until it reaches the next rejection handler (an `onRejected` argument or a `.catch()`). So one `.catch()` at the end can catch failures from any earlier step." },
      { question: "What does `.finally()` do, and does its callback receive the resolved value or rejection reason?", answer: "It runs after the promise settles, whatever the outcome, which is useful for cleanup like hiding a spinner. Its callback gets no arguments, and `.finally()` passes the original outcome through unchanged. The exception: if the callback throws or returns a rejected promise, that overrides it." },
      { question: "What's the difference between `Promise.resolve(x)` when `x` is a plain value versus when `x` is already a promise?", answer: "If `x` is a plain value, you get a new promise already fulfilled with it. If `x` is a promise or thenable, `Promise.resolve(x)` doesn't add another layer; it returns a promise that follows `x`'s state. You never get a 'promise of a promise'." },
      { question: "Does the executor function passed to `new Promise((resolve, reject) => {...})` run immediately, or only once something calls `.then()`?", answer: "Immediately and synchronously, when the promise is constructed. Promises are eager, not lazy. `.then()` only controls when you hear about the result; it doesn't start the work." },
      { question: "Predict the output: a synchronous log, then constructing a `new Promise` whose executor logs synchronously before resolving, with a `.then()` attached, then a final synchronous log after the constructor call.", answer: "The order is: the first log, the executor's log, the final log, then the `.then()` log. The executor runs synchronously when the promise is created, but the `.then()` callback is queued as a microtask and runs after the current synchronous code finishes." },
      { question: "If the executor function passed to `new Promise()` throws synchronously, what happens to the promise?", answer: "The throw is caught automatically and treated like `reject(error)`, so the promise is rejected with that error. You don't need a try/catch in the executor just to turn a synchronous throw into a rejection." },
      { question: "What happens if a `.then()` callback itself throws an error?", answer: "The promise returned by that `.then()` rejects with the error. It then travels down the chain like an explicit `reject()` until something catches it." },
      { question: "You call `.then()` twice on the same promise from two separate variables, instead of chaining them. Does the second `.then()` see the value transformed by the first?", answer: "No. Two `.then()` calls on the same promise create two independent branches, and both get the original resolved value. Only chaining, `promise.then(...).then(...)`, passes a value from one step to the next." },
      { question: "How would you convert an older callback-style function into one that returns a promise?", answer: "Wrap the call in `new Promise((resolve, reject) => {...})`. The executor calls the original function, and its error-first callback calls `reject` on error or `resolve` otherwise. Node's built-in `util.promisify` does exactly this." },
      { question: "How would you add a timeout to a promise-based operation that might hang forever?", answer: "Use `Promise.race()` with the real operation and a promise that rejects after a `setTimeout` delay. Whichever settles first decides the outcome. The loser keeps running in the background because it can't be cancelled." },
      { question: "Since regular JavaScript promises can't be cancelled, how do people typically stop unneeded async work early anyway?", answer: "With a separate cancellation signal, usually `AbortController`/`AbortSignal`. The operation (like `fetch`) checks the signal and stops or rejects when told to abort. The promise itself never gets a real 'cancel' method." },
      { question: "What does `Promise.all()` resolve with when the input array mixes real promises with plain, non-promise values?", answer: "A plain value is treated as already resolved with itself. It appears in the results array next to the resolved values of the real promises, in the same position it was given." },
      { question: "Why does `Promise.any()` reject with an `AggregateError` instead of a single error?", answer: "It only fails when every input promise has rejected, so no single reason explains the failure. An `AggregateError` keeps all the rejection reasons in its `.errors` array, so nothing is lost." },
      { question: "You have three independent, unrelated async calls that don't depend on each other's results. What's wrong with awaiting them one at a time instead of using `Promise.all()`?", answer: "Awaiting them one at a time runs them in sequence, so the total time is roughly the sum of all three. Starting them together, for example with `Promise.all()`, runs them concurrently, so the total is closer to the slowest one." },
      { question: "What's the difference in behavior between attaching two separate `.then()` calls to the same promise versus chaining them?", answer: "Two separate `.then()` calls are independent listeners that both get the original resolved value. Chained, the second runs only after the first finishes and gets whatever the first returned." },
      { question: "Why is nesting `.then()` calls inside other `.then()` calls considered bad practice, even when it reaches the same result as a flat chain?", answer: "Nesting brings back the deeply indented, hard-to-follow code promises were meant to fix. Returning a promise from `.then()` and keeping the chain flat gives the same order, and keeps error handling in one `.catch()` instead of spread across nested blocks." },
      { question: "Does an error thrown inside a `.catch()` handler get caught by that same `.catch()`, or does it propagate further?", answer: "It propagates further down the chain. Like any `.then()` handler, `.catch()` returns a new promise. If its code throws, that promise rejects and needs its own later `.catch()`." },
      { question: "How can you make sure an expensive async setup operation only actually runs once, even if multiple parts of the code request it around the same time?", answer: "Cache the promise itself the first time, not just its value, and give that same promise to every caller. A promise remembers its settled value and can have any number of `.then()` listeners, so every caller gets the one result and the work runs only once." },
      { question: "What does it mean, from the promise API's own perspective, that `.then()`/`.catch()`/`.finally()` callbacks always run as microtasks?", answer: "These callbacks never run synchronously, even for an already-settled promise. They always wait until the current code finishes, but run before anything else queued after that. That's why they run 'soon' but never in the middle of other running code." },
      { question: "Predict the output: two already-resolved promises each get a `.then(console.log)` attached, followed by a plain synchronous `console.log`.", answer: "The synchronous log runs first, then the two `.then()` callbacks in the order they were scheduled. Both are deferred as microtasks; being already resolved doesn't make `.then()` run synchronously." },
      { question: "You need to run a list of async tasks one at a time, in order, without async/await. How do you chain them dynamically using only promises?", answer: "Fold the array into one chain with `reduce`, starting from an already-resolved promise. Each step's `.then()` waits for the previous task before starting the next, giving a sequential chain for a list of any length." },
      { question: "Is there any meaningful difference between `Promise.resolve('done')` and manually writing `new Promise(resolve => resolve('done'))`?", answer: "Almost none: both give an already-fulfilled promise with the value `'done'`. `Promise.resolve()` is just a shorter way to wrap a known value or existing thenable without writing an executor." },
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
Promises fixed the "callback mess", but long \`.then()\` chains can still be
hard to read. **async/await** is syntax built on promises that lets async
code *look* synchronous, reading top to bottom, without blocking the rest of
the program.

Mark a function \`async\`. Inside it, put \`await\` before a promise to pause
that function (and only that function) until the promise settles.
    `.trim(),
    analogy:
      "It's like a recipe written as a checklist instead of a tangle of arrows: 'wait for the water to boil, then add pasta, then wait 10 minutes.' Each step waits for the one before, in plain order.",
    examples: [
      {
        title: "Using async/await",
        code: `async function getUserData() {
  const response = await fetch("/api/user");
  const data = await response.json();
  return data;
}`,
        walkthrough: [
          { code: "async function getUserData() {", explanation: "Marks the function async, so it can use await and always returns a promise." },
          { code: 'const response = await fetch("/api/user");', explanation: "Pauses this function only (not the whole program) until the network request settles." },
          { code: "const data = await response.json();", explanation: "Pauses again while the response body is parsed as JSON." },
          { code: "return data;", explanation: "Returns the parsed data to whoever awaited getUserData()." },
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
At \`await somePromise\`, JavaScript pauses that async function while the
rest of the program keeps running. When the promise settles, the function
resumes where it left off with the resolved value (or throws the error if
it was rejected).
    `.trim(),
    whyItExists: `
async/await makes promise-based code easier to read. It doesn't replace
promises (it's built on them), but it removes most of the \`.then()\`
boilerplate.
    `.trim(),
    whenToUse: `
Use async/await for async steps that depend on each other (fetch a user,
then their orders, then show them) when you want them to read top to bottom
like normal code.
    `.trim(),
    whenNotToUse: `
Skip it for synchronous code that never waits; \`async\` gains you nothing
there. When async tasks don't depend on each other, awaiting them one at a
time is slower than starting them together with \`Promise.all\`.
    `.trim(),
    commonMistakes: [
      "Forgetting the `async` keyword on a function that uses `await` inside it.",
      "Forgetting to wrap `await` calls in `try/catch`, so rejected promises crash the function silently.",
      "Using `await` in a loop when the calls don't depend on each other. Running them in parallel with `Promise.all` is faster.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Convert a `.then()`-based promise chain into an `async/await` function." },
      { difficulty: "Medium", prompt: "Write an async function that fetches data and handles errors with `try/catch`." },
      { difficulty: "Hard", prompt: "Write an async function that runs three independent async tasks in parallel using `Promise.all`, instead of `await`-ing them one by one." },
    ],
    interviewQuestions: [
      { question: "How does `async/await` relate to promises?", answer: "It's syntax sugar on top of promises. An `async` function always returns a promise, and `await` pauses that function until the given promise settles, then resumes with the value (or throws the rejection)." },
      { question: "Does an `async` function always return a promise, even if you `return` a plain, non-promise value?", answer: "Yes. Whatever you `return` is wrapped in a resolved promise if it isn't one already. Callers always get a promise, never the raw value, even if the function never awaits anything." },
      { question: "How do you handle errors in async/await code, and how does that compare to `.catch()` on a promise chain?", answer: "Wrap the `await` calls in `try/catch`, like a synchronous throw. A rejected awaited promise becomes a thrown error at that line, so `try/catch` catches it just as `.catch()` would in a chain. Same mechanism, different syntax." },
      { question: "Does `await` block the entire program?", answer: "No. It only pauses the current `async` function. Control returns to the caller, and the rest of the program, including the browser UI, keeps running until the promise settles and the function resumes." },
      { question: "What does `await` actually do, mechanically, when it hits a promise?", answer: "It suspends the `async` function, registers a continuation on the promise (like a `.then()`), and returns control to the caller. When the promise settles, the rest of the function is scheduled as a microtask and picks up where it left off." },
      { question: "What happens if you `await` a value that isn't a promise at all, like a plain number?", answer: "It works. `await` treats it as already resolved, as if via `Promise.resolve()`. The function still yields briefly (resuming as a microtask) and then continues with that value." },
      { question: "What happens if you use `await` inside a function that isn't marked `async`?", answer: "It's a syntax error. `await` is only valid inside an `async` function (or at the top level of a module). Add `async` first." },
      { question: "Can you use `await` at the top level of a file, outside any function?", answer: "Yes, in an ES module. This is 'top-level await'. It lets a module do async setup before its exports are ready. The cost: any module that imports it must also wait for that `await` before it finishes loading." },
      { question: "Why is putting `await` inside a `for` loop for several independent async tasks often a performance mistake?", answer: "Each iteration waits for the previous call to finish before starting the next, so the tasks run one after another. If they're independent, start them all first and await them together (for example with `Promise.all`). That takes about as long as the slowest one, not the sum." },
      { question: "How do you run several independent async calls in parallel while still writing await-based code?", answer: "Start all the calls without awaiting each one, keep the promises, then await them together, usually with `await Promise.all([...])`. They all run at once instead of one after another." },
      { question: "Predict the output: an `async` function logs 'A', then awaits a resolved promise, then logs 'B'; right after calling that function (without awaiting it), the calling code logs 'C'.", answer: "'A', 'C', 'B'. Code before the first `await` runs synchronously when the function is called, so 'A' logs first. The function then suspends and the caller logs 'C'. Once the current synchronous code finishes, the function resumes and logs 'B'." },
      { question: "If an `async` function has no `await` inside it at all, does calling it still behave asynchronously in any way?", answer: "Yes. Its return value is still wrapped in a promise, and any `.then()` on it runs as a microtask, not synchronously. Callers can't rely on the result being ready when the call returns." },
      { question: "What happens to an error thrown inside an `async` function if there's no `try/catch` around it?", answer: "It doesn't crash the program synchronously. It becomes a rejection of the promise the function returns. The caller must handle it, with `try/catch` around an `await` or with `.catch()`, or it becomes an unhandled promise rejection." },
      { question: "Is an unhandled rejection from an async function any different, mechanically, from one that comes out of a raw `.then()` chain?", answer: "No, they're the same thing. An `async` function's promise rejecting with no handler is the same 'unhandled promise rejection' as any other rejected promise with no `.catch()` or awaiting `try/catch`." },
      { question: "Does `Array.prototype.forEach` wait for an `async` callback to finish before moving to the next item?", answer: "No. `forEach` ignores the promise its callback returns and fires every call back to back. All the callbacks start almost at once and finish in whatever order their work completes, not array order." },
      { question: "Given that `forEach` doesn't await async callbacks, how would you process an array's items one at a time, waiting for each before starting the next?", answer: "Use `for...of` with `await` inside: `for (const item of items) { await process(item); }`. A `for` loop really pauses at each `await`, so items are processed in order, unlike `forEach`." },
      { question: "How would you process every item in an array concurrently and collect all the results with async/await?", answer: "Call the async function on each item without awaiting, which gives an array of promises, then await them all with `Promise.all`, for example `await Promise.all(items.map(process))`. All the work starts together instead of one by one." },
      { question: "Inside a `try` block, is there a meaningful difference between `return await somePromise;` and `return somePromise;`?", answer: "Outside a try/catch, usually no; the caller gets the same value. Inside a try/catch, `return await` matters: the function waits for the promise, so a rejection is caught by that `catch` block. A bare `return somePromise` hands back the pending promise right away, so a later rejection isn't caught locally." },
      { question: "Debugging: a teammate wrote `items.forEach(async (item) => { await save(item); })` expecting the items to be saved one at a time, in order — what's actually happening, and how would you fix it?", answer: "`forEach` ignores the promise its callback returns, so all the `save()` calls start together, and `forEach` returns without waiting for any of them. Use a `for...of` loop with `await save(item)` for strict order, or `Promise.all(items.map(save))` for concurrency, depending on what was intended." },
      { question: "Why is code written with async/await generally easier to debug with breakpoints than an equivalent `.then()` chain?", answer: "It steps like ordinary sequential code. You can set a breakpoint on any line and step over each `await` while local variables stay in scope. With a `.then()` chain you jump between separate callbacks, each with its own scope and stack frame." },
      { question: "Is it valid to use `await` inside a `.then()` callback? Is that a normal pattern to write?", answer: "Only if that callback is itself `async`. It works, but mixing the two styles in one piece of code is discouraged. Pick one style (usually async/await) for a block of logic." },
      { question: "If an `async` function throws before reaching its first `await`, is that throw synchronous, or does it still produce a rejected promise?", answer: "It still produces a rejected promise, not a synchronous throw that a plain `try/catch` around the call could catch. An `async` function always wraps its outcome, success or failure, in a promise, even before any `await`." },
      { question: "How would you retry a flaky async operation up to a fixed number of times using async/await?", answer: "Put the attempt in a loop with `try/catch`. On success, `return` the result. On failure, catch the error and loop again, or once the retry limit is reached, rethrow (or return a failure value)." },
      { question: "What's the benefit of using `Promise.allSettled()` together with async/await over wrapping each individual `await` in its own `try/catch`?", answer: "`Promise.allSettled()` runs independent operations concurrently and reports every outcome, so one failure doesn't hide the others. Wrapping each `await` in its own try/catch is more verbose, and done naively in a loop it also loses the concurrency." },
      { question: "Predict the output: an `async` IIFE logs 'start', awaits a `setTimeout`-based promise, then logs 'end'; right after invoking it, the outer code logs 'after call'.", answer: "'start', 'after call', then 'end'. 'start' runs synchronously when the IIFE begins. The `await` suspends it and returns control, so 'after call' logs next. Only when the timer fires and its promise resolves does the IIFE resume and log 'end'." },
      { question: "Can an `async` function be combined with generator syntax, and is that something typical application code reaches for?", answer: "Yes. An `async generator function` (`async function*`) yields values over time, and the consumer reads them with `for await...of`. It's a specialized tool for async streams of values (like paginated API results) and much less common than a plain `async function`." },
      { question: "Why does wrapping every single `await` in the codebase in its own try/catch, versus one try/catch around several sequential awaits, matter for how precisely you can respond to failures?", answer: "One try/catch around several awaits catches a failure from any of them, but doesn't tell you which step failed unless you inspect the error. Wrapping each await (or tagging errors) lets you respond per step, like retrying just that step or using a specific fallback, instead of treating the block as all-or-nothing." },
      { question: "If two unrelated `await` calls are written back-to-back in an `async` function without `Promise.all`, does the second one start only after the first fully resolves, or do they overlap at all?", answer: "No overlap at all. The second call's promise isn't even created until the function resumes after the first `await`, so they run strictly one after the other." },
      { question: "What determines whether the code immediately after calling an `async` function (without awaiting the call) runs before or after the code inside that function?", answer: "Code inside the async function up to its first `await` runs synchronously before control returns to the caller, so it runs first. Everything after that first `await` is deferred, so the caller's next code usually runs before the function resumes." },
      { question: "Why doesn't marking a function `async` change how long its non-async internal work takes to execute?", answer: "`async` only changes how the *result* is delivered (wrapped in a promise, with pauses at `await`). It doesn't speed up the function's synchronous work or move it to another thread. A slow synchronous loop in an async function still blocks everything, just like in a regular function." },
      { question: "You need to fetch a user, then, only once you have their ID, fetch their orders. Why can't you simply start both fetches at the same time with `Promise.all`?", answer: "The second request needs the user's ID, which only exists after the first one finishes. That's a real dependency, so awaiting the first call before starting the second is correct. `Promise.all` only helps when the calls are truly independent." },
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
JavaScript does one thing at a time: it has a single "thread". Yet it
handles timers, network requests and clicks seemingly "at once" without
freezing the page. The **event loop** makes this possible.

It separates "run this now" from "run this later, once something finishes",
and keeps checking whether any waiting code is ready to run.
    `.trim(),
    analogy:
      "Picture one chef who cooks one dish at a time but has an oven timer for things in the background. The chef finishes the current dish, checks whether any timers went off, handles those, then moves on. Never two things at once, but never idle.",
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
          "Even with a 0ms delay, the timeout callback runs after all the regular code, because it waits for the main code to finish.",
        walkthrough: [
          { code: 'console.log("1: start");', explanation: "Runs immediately, as the first line on the call stack." },
          { code: "setTimeout(() => {...}, 0);", explanation: "Hands the callback to the browser to run later, even with a 0ms delay. JavaScript doesn't wait here." },
          { code: 'console.log("3: end");', explanation: "Also runs immediately; it doesn't wait for the timer." },
          { code: "// 2: timeout callback", explanation: "Runs only once the current code finishes and the call stack is empty." },
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
          "Promise callbacks (microtasks) always run before the next timer callback (a macrotask), even if both were scheduled at about the same time.",
      },
    ],
    howItWorks: `
JavaScript runs your main code on the **call stack**. Async work (like
\`setTimeout\` or a network request) is handed to the browser, and
JavaScript keeps running the rest of the code. When the async task
finishes, its callback goes into one of two queues:

- **Microtask queue**: promise callbacks.
- **Macrotask queue**: timers, network events and clicks.

Once the call stack is empty, the event loop drains the *entire* microtask
queue, including microtasks added while draining. Only then does it run a
single macrotask, and then it checks the microtask queue again.
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
Without it, any slow task (like a network request) would freeze the page
until it finished. The event loop lets JavaScript start slow tasks, move on,
and handle the result later, so the page stays responsive.
    `.trim(),
    whenToUse: `
Use this mental model when debugging surprising order: why a
\`console.log\` ran before a network response, why \`setTimeout(fn, 0)\`
didn't run immediately, or why the page froze during a long calculation.
    `.trim(),
    whenNotToUse: `
You never manage the event loop directly; there's no API to configure it.
You don't "use" it. You understand it so that promises, timers and events
make sense instead of feeling random.
    `.trim(),
    commonMistakes: [
      "Assuming `setTimeout(fn, 0)` runs immediately. It still waits for the current code to finish.",
      "Not realizing a long synchronous loop can freeze the page, since nothing else runs until the call stack is clear.",
      "Mixing up the order of promise callbacks (microtasks) and timer callbacks (macrotasks). Microtasks always finish draining before the next macrotask runs; it's a rule, not a tendency.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Predict, then verify, the console output order of a mix of `console.log` and `setTimeout` calls." },
      { difficulty: "Medium", prompt: "Write a small snippet mixing a `Promise.resolve().then()` and a `setTimeout`, and explain which runs first and why." },
      { difficulty: "Hard", prompt: "Explain, in your own words, why a `for` loop with a billion iterations would freeze a webpage." },
    ],
    interviewQuestions: [
      { question: "Is JavaScript single-threaded?", answer: "Yes. It runs one piece of code at a time on a single call stack. The browser or Node.js does slow work (timers, network, file I/O) in the background and hands results back to that thread through the event loop." },
      { question: "What is the difference between the call stack and the task queue(s)?", answer: "The call stack is where code is running right now, one function frame at a time. The task queues hold waiting callbacks (from timers, promises, DOM events) that can only run once the stack is completely empty." },
      { question: "Do microtasks (promises) or macrotasks (`setTimeout`) run first?", answer: "Microtasks. Every time the call stack empties, the event loop drains the *entire* microtask queue, including microtasks added while draining, before running a single macrotask." },
      { question: "What concretely counts as a macrotask versus a microtask?", answer: "Macrotasks are tasks from the host environment: `setTimeout`/`setInterval` callbacks, DOM events (clicks, keypresses) and network callbacks. Microtasks are jobs scheduled by the JavaScript engine: promise `.then()`/`.catch()`/`.finally()` callbacks and `queueMicrotask()` callbacks. Microtasks always run before the next macrotask." },
      { question: "Where does `queueMicrotask()` fit relative to promise callbacks?", answer: "It uses the same microtask queue as promise callbacks, so the same rule applies: it runs after the current synchronous code and before the next macrotask, in the order it was queued among other microtasks." },
      { question: "Predict the output: `console.log(1); setTimeout(() => console.log(2), 0); Promise.resolve().then(() => console.log(3)); console.log(4);`", answer: "`1, 4, 3, 2`. The two synchronous logs run first. Once the stack is empty, the microtask queue drains, so the promise logs `3`. Only then does the event loop run the timer macrotask and log `2`." },
      { question: "What does it actually mean that 'the call stack must be empty' before the event loop can act?", answer: "The event loop never interrupts running JavaScript to run a queued callback. It only checks the queues once every function on the stack has returned. So a long synchronous operation delays every pending timer, promise callback and UI event, however long they've waited." },
      { question: "Why doesn't `setTimeout(fn, 0)` run its callback immediately?", answer: "A timer callback is a macrotask, so it waits for the current synchronous code to finish and for the microtask queue to drain. `0` means 'as soon as possible after that', not 'right now'. Browsers also clamp very short or deeply nested timeouts to a small minimum delay." },
      { question: "Does the event loop run through the entire macrotask queue in one go, the way it drains the whole microtask queue?", answer: "No. It takes one macrotask per pass, then drains the whole microtask queue again before the next macrotask. The microtask queue is always fully emptied; the macrotask queue is not." },
      { question: "Predict the output: two `setTimeout(fn, 0)` calls are scheduled, and inside the first timer's callback a `Promise.resolve().then()` is scheduled. Does that promise callback run before or after the second timer's callback?", answer: "Before the second timer. When the first timer (a macrotask) finishes, the event loop drains the microtask queue, including the promise callback just scheduled, before moving on to the second timer, even though that timer was scheduled earlier." },
      { question: "If a microtask callback schedules another microtask, does the event loop wait for that one too before moving to the next macrotask?", answer: "Yes. The rule is 'drain the microtask queue until it's empty', not 'run what was there at the start'. Microtasks added while draining run in the same pass, before any macrotask." },
      { question: "Why can a chain of promises that keeps scheduling new microtasks prevent timers from ever firing, a phenomenon sometimes called 'microtask starvation'?", answer: "The event loop only moves to a macrotask once the microtask queue is empty. A promise chain that keeps re-scheduling itself (each `.then()` queuing another) never lets it empty. Pending `setTimeout` callbacks, UI events and network callbacks are starved forever, even though nothing is 'blocking' in the synchronous sense." },
      { question: "Where do browser rendering and repaints happen relative to microtasks and macrotasks?", answer: "A browser usually repaints after the microtask queue drains and before the next macrotask (though not necessarily every cycle). That's why an endless stream of microtasks can freeze rendering too, not just logic." },
      { question: "What is `requestAnimationFrame`, and how does its timing differ from a macrotask like `setTimeout`?", answer: "It runs a callback right before the browser's next repaint, in sync with the display's refresh rate, instead of after a delay like `setTimeout`. It's meant for visual updates, so the browser can time them correctly. A generic timer has no link to the paint cycle." },
      { question: "Predict the output: a script logs 'start', calls `queueMicrotask` to log 'micro', calls `setTimeout(fn, 0)` to log 'macro', then logs 'end'.", answer: "'start', 'end', 'micro', 'macro'. The synchronous logs run first. Once the stack empties, the microtask queue drains ('micro'), and only then does the timer macrotask log 'macro'." },
      { question: "What does 'blocking the event loop' mean, concretely?", answer: "Running synchronous JavaScript that takes a long time, so the call stack never empties. No timers fire, no promise callbacks run, and the page can't respond to clicks, scrolls or repaints, because the single thread is busy with that code." },
      { question: "Why can one very expensive synchronous computation freeze an entire web page, including things seemingly unrelated to it like scrolling?", answer: "Scrolling, clicks and rendering all need the same single thread to be free to run their queued callbacks. While a synchronous loop keeps the stack busy, none of them run, whatever feature they belong to, because the event loop can't interrupt running code." },
      { question: "Do Web Workers get around JavaScript's single-threaded limitation, and how do they relate to the main thread's event loop?", answer: "Yes. A Web Worker runs on a separate thread with its own call stack and event loop, so heavy work there doesn't block the main thread. It talks to the main thread only through messages (`postMessage`), which arrive as macrotask-like events on the main thread's queue. They don't share memory and state directly." },
      { question: "Conceptually, how does Node.js's event loop differ from a browser's?", answer: "Same core idea: one thread, a call stack, and queues drained when the stack is empty. But Node.js splits macrotasks into phases (timers, I/O callbacks, `setImmediate`, close callbacks, and so on) that run in a fixed order each loop. A browser's model is simpler and doesn't expose phases." },
      { question: "Predict the output: an `async` function awaits an already-resolved value and logs after the `await`; a `setTimeout(fn, 0)` is scheduled right before calling that async function; a synchronous log happens right after calling it.", answer: "The synchronous log after the call runs first, then the async function's post-await log, then the timer's log. Resuming after `await` is a microtask, so it runs before the timer's macrotask, even though the timer was scheduled earlier." },
      { question: "Why does resuming after an `await` behave, timing-wise, just like a promise `.then()` callback?", answer: "Because that's what it is. `await` registers a continuation on a promise, and that continuation goes into the microtask queue like any `.then()` callback. So async/await follows the same microtask-before-macrotask rules." },
      { question: "Predict the output: `console.log(1); Promise.resolve().then(() => console.log(2)); Promise.resolve().then(() => console.log(3)).then(() => console.log(4)); console.log(5);`", answer: "`1, 5, 2, 3, 4`. The synchronous logs run first. Then microtasks run in the order they were queued: `2`, then `3`. The `.then()` that logs `4` is only queued once `3` finishes, so `4` runs last." },
      { question: "A `setTimeout` callback with a 100ms delay ends up running noticeably later than 100ms after it was scheduled. What event-loop-related reasons could explain that?", answer: "After 100ms the timer only becomes *eligible* to run. It still waits for the call stack to empty and for the microtask queue to drain. Long-running synchronous code, or a microtask queue that keeps refilling, can delay it well past 100ms." },
      { question: "Why is it more accurate to think of `setTimeout`'s delay as a minimum rather than a guarantee?", answer: "The delay only guarantees the callback won't run *before* that time. It says nothing about how soon after, because the callback still waits behind the running code, the microtask queue and any earlier macrotasks." },
      { question: "Why doesn't calling `Promise.all()` to wait on several promises block the event loop while they're pending?", answer: "`Promise.all()` doesn't loop or poll. It registers callbacks on each promise and returns immediately, so the stack clears. Nothing runs again until a promise settles and its callback is scheduled, so the thread is free for other work meanwhile." },
      { question: "Mechanically, why is a UI click handler just another item competing for the same queue as a `setTimeout` callback?", answer: "The browser detects the click outside JavaScript. Instead of interrupting running code, it queues the handler as a macrotask, just like a timer firing. So a page busy with a long synchronous script won't respond to a click until that script finishes." },
      { question: "If a piece of code schedules two `setTimeout(fn, 0)` calls back to back, does the one scheduled first always fire before the second?", answer: "Usually yes, since equal-delay timers fire in the order they became eligible. It's not absolute: browsers clamp very short or deeply nested timeouts to a small minimum delay (historically about 4ms), and other queued work can affect order in edge cases." },
      { question: "What's the difference, in terms of end effect versus root cause, between starving the main thread with an infinite chain of microtasks versus with one long synchronous loop?", answer: "From outside, both freeze the page: nothing else gets a turn. A synchronous loop keeps the call stack busy. A runaway microtask chain keeps emptying and refilling the microtask queue, so the stack briefly empties between each one, but the event loop never reaches the next macrotask because that queue is never finished." },
      { question: "Why is JavaScript's split into 'run this now' and 'run this later, once something else finishes' the whole reason the event loop needs to exist at all?", answer: "With only one thread, JavaScript can't wait for a slow operation without freezing everything. Splitting work into synchronous code plus deferred callbacks lets the thread start slow work, move on, and handle results later. The event loop manages when 'later' arrives." },
      { question: "What is the difference between a task and a microtask job in loose spec terms, and why does the distinction matter in practice?", answer: "A 'task' (macrotask) is host work like a timer firing or a network event. A 'microtask' (a 'job' in the spec, mostly from promises) is follow-up work scheduled by the engine. The engine always drains all pending jobs before letting the host run the next task, which is why promise callbacks beat timer callbacks with the same nominal delay." },
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
When you call \`"hello".toUpperCase()\`, you use a method you never wrote.
Where does it come from? Every object has a hidden link to another object it
"falls back to" when it doesn't have a property itself. That fallback object
is its **prototype**.

If a property isn't on the object, JavaScript checks its prototype, then
that prototype's prototype, and so on, until it finds the property or runs
out of links. This is the **prototype chain**.
    `.trim(),
    analogy:
      "Imagine asking a coworker a question. If they don't know, they ask their manager, who asks theirs. Each object checks itself first, then passes the question up the chain until someone knows.",
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
          { code: "const dog = Object.create(animal);", explanation: "Creates a new, empty object whose prototype is animal." },
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
          "`speak` is defined once, on `Animal.prototype`. Every instance made with `new Animal(...)` shares it through the prototype chain; it isn't copied per instance. Note: `Animal.prototype` is a property only functions and classes have. It's the template object that becomes each instance's internal link (what `Object.getPrototypeOf` returns). The two are closely related, not the same thing.",
      },
    ],
    howItWorks: `
Every object has an internal link (read it with \`Object.getPrototypeOf\`)
to another object. Property lookup checks the object first, then walks up
the chain. Arrays and functions are objects too, and they get built-in
methods (like \`.map()\` or \`.call()\`) the same way, from their prototypes.

Don't confuse this link with the \`.prototype\` **property** on functions and
classes (like \`Animal.prototype\`). That property is just a template object
used to set the internal link on each instance created with \`new\`. Plain
objects (like \`{}\`) have no \`.prototype\` property, but they still have an
internal prototype link.
    `.trim(),
    whyItExists: `
Prototypes let many objects share methods without each storing its own
copy. That saves memory and lets you change shared behavior in one place.
It's the mechanism under classes and built-in types like arrays and
strings.
    `.trim(),
    whenToUse: `
You use prototypes, often without noticing, whenever you call a built-in
method (\`.map()\`, \`.toUpperCase()\`). Use them directly when several objects
should share behavior without duplicating it. Today that's usually written
with \`class\` rather than \`Object.create\`.
    `.trim(),
    whenNotToUse: `
Most application code doesn't need to touch prototypes directly; \`class\`
covers the common cases more clearly. Use raw prototype code only when
building a library, working with older code, or needing something \`class\`
doesn't offer.
    `.trim(),
    commonMistakes: [
      "Confusing an object's own properties with properties it only has access to through its prototype.",
      "Modifying a shared prototype directly and accidentally affecting every object that relies on it.",
      "Assuming `class` is a completely different system. It's mostly a friendlier way to write prototype-based code.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use `Object.getPrototypeOf()` on an array and on a plain object, and compare the results." },
      { difficulty: "Medium", prompt: "Create an object `vehicle` with a `honk` method, then use `Object.create()` to make a `car` object that inherits it." },
      { difficulty: "Hard", prompt: "Explain, using the prototype chain, why `[].toString()` works even though arrays don't define `toString` themselves." },
    ],
    interviewQuestions: [
      { question: "What is the prototype chain?", answer: "The series of linked objects JavaScript walks when a property isn't on the object itself: first the object's prototype, then that prototype's prototype, and so on, until the property is found or the chain ends at `null`." },
      { question: "What actually triggers JavaScript to look at an object's prototype at all?", answer: "A property lookup that doesn't find the property as an own property of the object. The prototype is only a fallback, checked after the object itself." },
      { question: "What's the difference between `.prototype` and `__proto__`?", answer: "`.prototype` is a normal property that only functions and classes have: the template object given to every instance created with `new`. `__proto__` is the legacy, informal way to reach any object's actual internal prototype link (the one `Object.getPrototypeOf` reads). They aren't interchangeable: a function has both, while a plain object has only the internal link, no `.prototype` property." },
      { question: "How does `class` relate to prototypes under the hood?", answer: "Classes are mostly syntax sugar over the same prototype system. Methods in a class body become properties on the class's `.prototype` object, shared by every instance, just like assigning to `Ctor.prototype` by hand." },
      { question: "What does `Object.create(proto)` do?", answer: "It creates a new, empty object whose internal prototype link is `proto`. The new object can reach everything on `proto` through the chain, without copying any of its properties." },
      { question: "How does `new Ctor()` set up an instance's prototype link, compared to `Object.create(Ctor.prototype)`?", answer: "Both give the new object the prototype `Ctor.prototype`. `new Ctor()` then also runs `Ctor` with `this` bound to the new object. `Object.create(Ctor.prototype)` skips the constructor, so its setup logic (like assigning instance properties) never runs." },
      { question: "Predict the output: `const dog = Object.create(animal); dog.name = \"Rex\"; console.log(dog.hasOwnProperty(\"name\"), dog.hasOwnProperty(\"speak\"));` (where `animal` has a `speak` method).", answer: "`true false`. `name` was assigned directly on `dog`, so it's an own property. `speak` is only reachable through the prototype chain; `dog` can use it but doesn't own it." },
      { question: "What's the difference between `hasOwnProperty(key)` and the `in` operator?", answer: "`obj.hasOwnProperty(key)` checks only the object's own properties and ignores inherited ones. `key in obj` checks the whole chain, so it's true for own and inherited properties." },
      { question: "Why does a `for...in` loop sometimes iterate over more keys than you expect, and how do you guard against it?", answer: "`for...in` walks the whole prototype chain and includes inherited *enumerable* properties, not just own keys. Guard with `if (obj.hasOwnProperty(key))` inside the loop, or use `Object.keys(obj)`, which returns only own enumerable keys." },
      { question: "Is `__proto__` still the recommended way to read or change an object's prototype?", answer: "No. It's a legacy accessor kept for backward compatibility. Use `Object.getPrototypeOf(obj)` to read the link and `Object.setPrototypeOf(obj, proto)` to change it." },
      { question: "Why would you deliberately create an object with `Object.create(null)` instead of `{}`?", answer: "`Object.create(null)` makes an object with no prototype at all, not even `Object.prototype`, so it has no inherited methods like `toString` or `hasOwnProperty`. That gives you a clean dictionary-like object where no inherited name can collide with a key you store." },
      { question: "If you modify a shared prototype after some instances already exist, do those existing instances see the change?", answer: "Yes. Property lookup happens live, each time you access a property, not once when the object is created. All instances link to the same prototype object, so a new or changed method is visible to every instance immediately, old and new." },
      { question: "What's a risk of assigning a brand-new object to `Ctor.prototype` wholesale (`Ctor.prototype = {...}`) instead of adding methods individually?", answer: "The new object has no `constructor` property pointing back to `Ctor`, unlike the original auto-created `.prototype`. Code that relies on `instance.constructor` can silently break, so you'd need to set `constructor` on the replacement yourself." },
      { question: "How does `instanceof` actually work, mechanically?", answer: "`obj instanceof Ctor` walks `obj`'s prototype chain and checks whether any link is the exact object `Ctor.prototype`. It returns true at the first match and false if the chain ends without one." },
      { question: "Why do plain arrays have access to methods like `.map()` and `.forEach()` that you never defined yourself?", answer: "Every array's prototype link points to `Array.prototype`, where those built-in methods live, shared by all arrays. It's the same mechanism as a custom object inheriting from a hand-written prototype." },
      { question: "What's the risk of adding a method directly onto `Array.prototype` (\"monkey-patching\" a built-in)?", answer: "The method appears on every array in the program, including other libraries' arrays. It can silently clash with a method of the same name added by a future JS version or another library. You're changing global shared state, not just your own code." },
      { question: "What is \"prototype pollution\", and why is it treated as a security concern?", answer: "Untrusted input sets a property like `__proto__` on an object being built (often through a naive recursive merge of user-supplied JSON), and that actually modifies `Object.prototype`. It silently changes behavior for every plain object in the program, including ones with no obvious link to the attacker's input." },
      { question: "Predict the output: two different objects are both created with `new Animal(\"x\")`. Is `animalOne.speak === animalTwo.speak`?", answer: "`true`. Both instances share the same function through their common prototype, `Animal.prototype`. The method isn't copied per instance, so the references are equal." },
      { question: "If a constructor assigns `this.name = name` inside itself, does `name` end up on the instance or on the prototype?", answer: "On the instance, as an own property of that object. Only things defined on `Ctor.prototype` (like class-body methods) are shared; anything assigned to `this` in the constructor is per instance." },
      { question: "How does `Object.keys(obj)` differ from a `for...in` loop in terms of what it returns?", answer: "`Object.keys(obj)` returns only own enumerable property names and ignores the prototype chain. `for...in` includes own and inherited enumerable properties, which is why it can return more keys than you expect." },
      { question: "Predict the output: `const bare = Object.create(null); console.log(bare.toString);`", answer: "`undefined`. `bare` has no prototype, so it doesn't inherit `toString` (or anything else) from `Object.prototype` like a normal `{}` does." },
      { question: "In a class, where do `static` methods actually live — on the prototype, alongside instance methods?", answer: "No. `static` methods live on the class (the constructor function) itself, not on `Ctor.prototype`. That's why you call them on the class, like `MyClass.staticMethod()`, and instances can't reach them." },
      { question: "Can getters and setters be shared across instances the same way regular methods are?", answer: "Yes. A `get`/`set` accessor in a class body is installed on the class's prototype like a regular method, so every instance shares the logic while each instance's data can differ." },
      { question: "Conceptually, how does JavaScript's prototypal inheritance differ from classical, class-based inheritance in languages like Java?", answer: "Classical inheritance fixes a class hierarchy at compile time, and each instance is stamped from that blueprint. Prototypal inheritance links live objects to other live objects at runtime. There's no separate 'class' concept underneath; JS `class` syntax is a friendlier way to set up those object-to-object links." },
      { question: "When a subclass method calls `super.method()`, where does that lookup actually go?", answer: "It looks up `method` starting at the parent class's prototype, skipping the subclass's own prototype (even if the subclass overrides `method`). This lets an override call the original without infinite recursion." },
      { question: "Why is repeatedly calling `Object.setPrototypeOf(obj, newProto)` on already-existing objects generally discouraged, beyond just being unusual?", answer: "Changing a prototype after creation is slow in most engines. It can de-optimize code compiled on the assumption that the object's 'shape' (including its prototype) stays stable. Setting the prototype once up front, with `Object.create` or a constructor, is much cheaper." },
      { question: "Predict the output: `console.log(Object.getPrototypeOf(Object.getPrototypeOf({})));`", answer: "`null`. A plain object's prototype is `Object.prototype`, and `Object.prototype`'s prototype is `null`, the end of the chain." },
      { question: "What sits at the very top of a normal object's prototype chain, and what comes after it?", answer: "`Object.prototype`, which supplies things like `toString` and `hasOwnProperty`. Its prototype is `null`, which ends the chain: lookup stops there and returns `undefined`." },
      { question: "Does an arrow function have a `.prototype` property the way a regular function does?", answer: "No. Arrow functions never get a `.prototype` property. That's one reason, along with having no own `this`, that they can't be used with `new`." },
      { question: "If you declare a regular function but never call it with `new`, does it still have a `.prototype` property?", answer: "Yes. Every regular (non-arrow) function gets a `.prototype` property when it's created, whether or not it's ever used as a constructor. It just sits unused if you never call `new`." },
      { question: "If an object has its own property shadowing a prototype property of the same name, and you `delete` the own property, does the prototype's version reappear?", answer: "Yes. `delete` only removes the own property. The prototype link is untouched, so the next lookup of that key falls through to the prototype's property, as if the own property had never existed." },
      { question: "Why is `obj.hasOwnProperty(key)` sometimes considered risky to call directly, and what's the safer alternative?", answer: "It assumes `obj` inherited `hasOwnProperty` from `Object.prototype`. That fails for an object made with `Object.create(null)`, or one where `hasOwnProperty` was overwritten as an own property. `Object.prototype.hasOwnProperty.call(obj, key)`, or the newer `Object.hasOwn(obj, key)`, calls the real check directly." },
      { question: "How does `Object.assign(target, source)` differ from having `target` inherit from `source` via the prototype chain?", answer: "`Object.assign` copies `source`'s own enumerable properties onto `target` once. After that the objects are independent, and later changes to `source` don't affect `target`. Prototypal inheritance is a live link: later changes to the prototype are visible to everything that inherits from it." },
      { question: "Debugging: a teammate adds a new method to a shared prototype partway through the program's execution, expecting only future instances to be able to use it. What actually happens?", answer: "Every existing instance gets the new method too, because prototype lookup happens live at call time, not when the instance was created. You can't add a prototype method that only affects future instances." },
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
Code in a function sometimes needs to refer to "the object I belong to"
without naming it, so the same code works for many objects. The keyword
\`this\` refers to that object.

The tricky part: \`this\` doesn't depend on where a function is *written*,
but on how it's *called*. Call the same function a different way and you can
get a different \`this\`.
    `.trim(),
    analogy:
      "Think of \"this\" like the word \"I\" in a sentence. The word never changes, but who \"I\" means depends on who's speaking.",
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
          "Calling `user.greet()` sets `this` to `user`. Detach the function and call it on its own, and `this` no longer points to `user`.",
        walkthrough: [
          { code: "const user = { name: ..., greet() {...} };", explanation: "Defines an object with a method, greet." },
          { code: "user.greet();", explanation: "Called as user.greet(), so this inside greet is set to user." },
          { code: "const greetFn = user.greet;", explanation: "Copies just the function, detached from user." },
          { code: "greetFn();", explanation: "Called plainly, so this is no longer user and this.name is undefined." },
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
          "Arrow functions deliberately have no `this` of their own. They use `this` from the code around where they were written, which usually isn't what you want for object methods.",
      },
    ],
    howItWorks: `
For a regular function, JavaScript picks \`this\` based on *how* it's called:

- \`obj.method()\` sets \`this\` to \`obj\`.
- A plain call, \`fn()\`, sets \`this\` to \`undefined\` (in strict mode) or the global object.
- \`.call()\`, \`.apply()\` and \`.bind()\` set \`this\` explicitly.

Arrow functions skip all this and borrow \`this\` from the enclosing scope.
    `.trim(),
    whyItExists: `
\`this\` lets one method definition work for many objects. A single \`greet\`
method can be shared by every user object, each referring to itself, instead
of a hardcoded copy per object.
    `.trim(),
    whenToUse: `
Think about \`this\` whenever you write an object method, use a class, or pass
a function as a callback. Knowing what \`this\` will be tells you whether the
code works when it's called.
    `.trim(),
    whenNotToUse: `
Functions that don't depend on an object's data often don't need \`this\`; a
regular parameter is clearer. For object methods used as callbacks, use an
arrow function or \`.bind()\` instead of trusting the caller to keep \`this\`
right.
    `.trim(),
    commonMistakes: [
      "Passing an object method as a callback (e.g. to `setTimeout`) and losing its intended `this`.",
      "Using a regular function for an object method that's called as a plain callback, instead of binding it or using an arrow function.",
      "Assuming `this` refers to where a function is defined rather than how it's called.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Create an object with a method that logs `this.name`, and call it normally to confirm it works." },
      { difficulty: "Medium", prompt: "Detach that method into its own variable, call it directly, and explain why `this` breaks." },
      { difficulty: "Hard", prompt: "Fix the broken example using `.bind()`, and explain what `.bind()` actually does." },
    ],
    interviewQuestions: [
      { question: "What determines the value of `this` inside a regular function?", answer: "How the function is called, not where it was defined. `obj.method()` sets `this` to `obj`. A standalone `fn()` gives a different `this`. `new fn()` and `.call`/`.apply`/`.bind` each set it differently again." },
      { question: "What does `this` become when a regular function is called completely standalone, like `fn()`, with no object in front of it?", answer: "In strict mode, `undefined`. In non-strict ('sloppy') mode, the global object (`window` in a browser). Strict mode changed this partly because accidental access to the global object is rarely wanted." },
      { question: "What is `this` set to inside a method called as `obj.method()`?", answer: "`obj`: the object directly left of the dot at the moment of the call." },
      { question: "Where does an arrow function get its `this` from?", answer: "It has no `this` of its own. It uses the `this` of the surrounding (lexical) scope where it was written, and that never changes, however the arrow function is called later." },
      { question: "If you copy a method off an object into a plain variable and call it from there, what happens to `this`?", answer: "The link to the object is lost. Calling the copy standalone follows the standalone rule (`undefined` in strict mode, otherwise the global object), not the object it came from." },
      { question: "What does `fn.call(thisValue, arg1, arg2)` do?", answer: "It calls `fn` immediately with `this` set to `thisValue` for that one call, passing `arg1`, `arg2`, ... as separate arguments." },
      { question: "How does `.apply()` differ from `.call()`?", answer: "Both call the function immediately with an explicit `this`. `.apply()` takes the arguments as one array (or array-like); `.call()` takes them as a comma-separated list." },
      { question: "What does `.bind()` do, and when is the `this` you pass to it actually locked in — immediately, or only once the bound function is finally called?", answer: "It returns a new function with `this` permanently fixed to the value you passed. The binding happens immediately, when `.bind()` is called, not later when the new function runs." },
      { question: "Once a function has been bound with `.bind()`, can a later `.call()` or `.apply()` on the resulting function override its `this`?", answer: "No. A bound function's `this` is locked. Any `this` passed through a later `.call()`/`.apply()` is ignored." },
      { question: "What happens to a bound function's `this` if it's called with `new` instead of as a plain function?", answer: "`new` wins. It ignores the bound `this` and creates a fresh object for `this`, like calling the original function with `new`. Any pre-supplied bound arguments are still used." },
      { question: "What's the actual priority order JavaScript uses when several of these rules could apply at once — `new`, explicit binding (`call`/`apply`/`bind`), an object method call, and the plain default?", answer: "Highest to lowest: `new`; then explicit `this` from `call`/`apply`/`bind`; then implicit `this` from a method call (`obj.method()`); and finally the default (`undefined` in strict mode, otherwise the global object)." },
      { question: "If you pass an object's method directly to `setTimeout(obj.method, 1000)` instead of wrapping it, what is `this` when it eventually runs?", answer: "Not `obj`. `setTimeout` calls the function standalone, so `this` is the default (`undefined` in strict mode). It's the same problem as detaching any method into a variable and calling it later." },
      { question: "What are two idiomatic ways to fix a callback that's losing its intended `this`?", answer: "Wrap it in an arrow function at the call site, `setTimeout(() => obj.method(), 1000)`, so it's still called as a method. Or bind it once, `setTimeout(obj.method.bind(obj), 1000)`, which locks `this` however it's called." },
      { question: "If a plain (non-arrow) function is defined inside an object's method and called from inside that method, does it inherit the method's `this`?", answer: "No. A plain nested function called on its own gets its own default `this`, unrelated to the method's `this`. It's a classic, easy-to-miss gotcha. An arrow function in the same spot would inherit the method's `this`." },
      { question: "Inside a DOM event handler written as a regular function, what does `this` refer to?", answer: "The element the listener was attached to. The browser calls the handler as if it were a method on that element, effectively `element.handler(event)`." },
      { question: "If that same event handler is written as an arrow function instead, does `this` still refer to the element?", answer: "No. An arrow function ignores the element `this` the browser supplies and uses the `this` from where it was written, which usually isn't the element." },
      { question: "If a class method is passed around as a callback (e.g. `<button onClick={instance.method}>`) without binding it first, what typically goes wrong?", answer: "It loses its link to `instance` like any detached method. When it's later called as a plain callback, `this` isn't `instance`, so code using `this.someProperty` breaks." },
      { question: "How does the \"class field arrow function\" pattern (`method = () => { ... }` instead of `method() { ... }`) fix the lost-`this` callback problem?", answer: "It's an arrow function, so it captures `this` from where it's defined: the constructor scope, where `this` is the new instance. It's assigned per instance (not shared on the prototype), so each instance gets its own already-bound version that's safe to pass as a callback." },
      { question: "What is `this` set to inside a constructor function invoked with `new`?", answer: "The new object that `new` is building. Assignments like `this.name = name` add properties directly to that instance." },
      { question: "What does `this` refer to inside a `static` method of a class?", answer: "The class (constructor function) itself, not an instance, since `static` methods are called on the class, like `MyClass.staticMethod()`." },
      { question: "What does `this` refer to inside a getter or setter defined in a class?", answer: "The instance it's accessed through, just like `this` in a regular instance method, so the accessor can read or change that instance's data." },
      { question: "Does `this` behave any differently inside a generator function's body compared to a regular method?", answer: "No. A generator method follows the same call-site rules for `this` as any method. Being a generator only changes how it produces values (with `yield`)." },
      { question: "What is `this` at the very top level of an ES module, outside any function?", answer: "`undefined`. In a classic script, top-level `this` is the global object, but modules are implicitly strict mode and have no ambient global `this`." },
      { question: "Does writing `\"use strict\"` change what `this` is inside a method call like `obj.method()`?", answer: "No. It only changes the standalone-call case. In `obj.method()`, `this` is `obj` either way. Strict mode changes a plain `fn()` call's fallback from the global object to `undefined`." },
      { question: "Why did some older codebases write `const self = this;` at the top of a method, before arrow functions were common?", answer: "So a nested plain function (which would get its own `this`) could reach the outer method's `this` through the closed-over `self` variable. It was a manual workaround for the problem arrow functions later solved by inheriting `this` lexically." },
      { question: "Predict the output: `function show() { console.log(this.id); } const a = { id: 1, show }; const b = { id: 2 }; show.call(b);`", answer: "`2`. `.call(b)` sets `this` to `b` for that call. It doesn't matter that `show` is also `a.show`, because it's called through `.call`, not through `a`." },
      { question: "Predict the output: `function sum(a, b) { return this.multiplier * (a + b); } console.log(sum.apply({ multiplier: 10 }, [2, 3]));`", answer: "`50`. `.apply()` sets `this` to `{ multiplier: 10 }` and spreads `[2, 3]` into `a` and `b`, giving `10 * (2 + 3)`." },
      { question: "Predict the output: `function greet(greeting) { console.log(greeting + \", \" + this.name); } const hi = greet.bind({ name: \"Amara\" }, \"Hi\"); hi();`", answer: "`\"Hi, Amara\"`. `.bind()` locks in both `this` (`{ name: \"Amara\" }`) and the first argument (`\"Hi\"`). Calling `hi()` needs no arguments and always uses that `this`." },
      { question: "What is `this` inside an IIFE (immediately invoked function expression) written as a plain function, called with no object?", answer: "The same as any standalone call: `undefined` in strict mode, otherwise the global object. An IIFE is still a regular function call with nothing to its left." },
      { question: "If an arrow function is defined directly inside a regular method, does it correctly inherit that method's `this`?", answer: "Yes. This is a main reason arrow functions exist. With no `this` of their own, an arrow function inside a method picks up the method's `this`, which is usually what you want for a nested helper or callback." },
      { question: "Can you reassign `this` inside a function body the way you would a normal variable, like `this = someObject;`?", answer: "No. `this` isn't a variable; it's set by how the function was called. Assigning to it is a syntax error." },
      { question: "Does calling `.call()` or `.apply()` on an arrow function actually change what `this` resolves to inside it?", answer: "No. Arrow functions ignore any `this` passed via `.call`, `.apply` or `.bind`. Other arguments are still passed normally." },
      { question: "If you pass an object's method directly as the callback to `array.map(obj.method)`, what typically goes wrong with `this` inside it?", answer: "The same detached-method problem: `map` calls it as a plain function, not `obj.method()`, so `this` isn't `obj`. Fix it with an arrow wrapper (`array.map(x => obj.method(x))`), pre-binding (`array.map(obj.method.bind(obj))`), or by passing `obj` as `map`'s optional second argument, `thisArg`." },
      { question: "Debugging: an event listener written as `element.addEventListener(\"click\", instance.handleClick)` logs `this.state` as `undefined` instead of the expected instance data. What's the fix?", answer: "Passing `instance.handleClick` as a bare reference detaches it from `instance`. When the browser calls it, `this` is the element, not `instance`. Bind it, `instance.handleClick.bind(instance)`, or define it as a class field arrow function, so `this` stays `instance` however the browser calls it." },
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
JavaScript mostly behaves as you'd expect. But it has a few well-known
quirks, left over from decades-old design decisions, that surprise even
experienced developers. Knowing them ahead of time turns a confusing bug
into "oh, that's just how it works."
    `.trim(),
    analogy:
      "Think of the odd exceptions in English spelling. 'i before e except after c' has plenty of exceptions, but once you've been warned, they stop being surprises and become 'the known weird parts.'",
    examples: [
      {
        title: "A handful of classic surprises",
        code: `console.log(0.1 + 0.2);        // 0.30000000000000004
console.log(NaN === NaN);      // false
console.log(typeof null);      // "object"
console.log([] + []);          // "" (empty string)
console.log([1, 2] + [3, 4]);  // "1,23,4"`,
        walkthrough: [
          { code: "0.1 + 0.2", explanation: "Floating-point numbers can't store 0.1 or 0.2 exactly, so tiny rounding errors show up in the result." },
          { code: "NaN === NaN", explanation: "NaN never equals anything, even itself. Use Number.isNaN() to check for it." },
          { code: "typeof null", explanation: "A decades-old bug kept for backward compatibility. null is not actually an object." },
          { code: "[] + []", explanation: "+ converts arrays to strings, and an empty array becomes an empty string." },
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
          "With `var`, every callback closes over the same variable, and the loop has already finished by the time they run. Switching to `let` fixes it, because each iteration gets its own binding.",
      },
    ],
    howItWorks: `
Each one comes from a specific rule:

- Floating-point numbers are stored in binary and can't represent every decimal exactly.
- \`NaN\` is defined to be unequal to everything, including itself.
- \`typeof null\` returning "object" is a bug from JavaScript's first version, never fixed so existing code keeps working.
- \`+\` on non-numbers converts its operands to primitives (often strings) before combining them.
    `.trim(),
    whyItExists: `
These aren't bugs in your program. They're decisions (or accidents) built
into the language decades ago, and changing them would break the web. Learn
them once and you'll spot the pattern instantly instead of losing an hour.
    `.trim(),
    whenToUse: `
Remember this list whenever a result looks "obviously wrong": comparing
floating-point numbers for exact equality, checking for NaN, or using typeof
for a null check.
    `.trim(),
    whenNotToUse: `
Don't add workarounds everywhere up front; most code never hits float
precision or NaN in a way that matters. Add the specific safeguard
(Number.isNaN, rounding, an explicit null check) only where the code depends
on it.
    `.trim(),
    commonMistakes: [
      "Comparing floating-point calculations with `===` instead of checking they're 'close enough' (within a small tolerance).",
      "Using `someValue === NaN` to check for NaN. It's always false; use `Number.isNaN(someValue)` instead.",
      "Checking `typeof value === \"object\"` to detect an object and forgetting that `null` passes that check too.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Predict, then verify, the result of `0.1 + 0.2 === 0.3`." },
      { difficulty: "Medium", prompt: "Write a function `isNullOrObject(value)` that correctly distinguishes `null` from a real object." },
      { difficulty: "Hard", prompt: "Write a function `safeEquals(a, b)` that correctly returns true for `NaN, NaN` while behaving like `===` for everything else." },
    ],
    interviewQuestions: [
      { question: "Why doesn't `0.1 + 0.2` equal `0.3` exactly in JavaScript?", answer: "Numbers are stored as binary floating-point, and most decimal fractions (including 0.1 and 0.2) can't be stored exactly in binary. The tiny rounding error makes the sum `0.30000000000000004` instead of `0.3`." },
      { question: "Given floating-point imprecision, how should you actually compare two computed decimal numbers for \"equality\"?", answer: "Check that their difference is below a small tolerance (an 'epsilon'), like `Math.abs(a - b) < 0.00001`, instead of using `===` on results of floating-point math." },
      { question: "Why is `NaN === NaN` false, and how do you correctly check whether a value is `NaN`?", answer: "`NaN` is defined to be unequal to every value, including itself, so `===` can never confirm it. Use `Number.isNaN(value)`, which doesn't rely on equality." },
      { question: "Why does `typeof null` return `\"object\"` even though `null` isn't really an object?", answer: "It's a bug from JavaScript's first version: `null` and objects happened to share an internal type tag. It was never fixed because too much existing code would break." },
      { question: "Given that `typeof anArray` also returns `\"object\"`, how do you actually detect whether a value is specifically an array?", answer: "Use `Array.isArray(value)`. `typeof` can't tell an array from a plain object or any other non-primitive; they're all `\"object\"` to it." },
      { question: "Why does `typeof someFunction` return `\"function\"` instead of `\"object\"`, given that functions are technically objects too?", answer: "`typeof` reports anything callable as `\"function\"` for convenience, even though a function really is an object (with extra internal behavior for being called)." },
      { question: "Predict the output: `console.log([] + []);`", answer: "`\"\"` (an empty string). When neither operand is a number, `+` converts both to primitives. An empty array becomes `\"\"`, and two empty strings joined are still `\"\"`." },
      { question: "Predict the output: `console.log([1, 2] + [3, 4]);`", answer: "`\"1,23,4\"`. Each array becomes a string (`\"1,2\"` and `\"3,4\"`), and `+` joins them with no separator." },
      { question: "Predict the output: `console.log([] == false);`", answer: "`true`. Comparing an object with a boolean, `==` coerces both toward numbers: `false` becomes `0`, and the array becomes the string `\"\"`, then the number `0`. So `0 == 0` is true." },
      { question: "What's the difference between `null == undefined` and `null === undefined`?", answer: "`null == undefined` is `true`: they're defined to loosely equal each other and nothing else. `null === undefined` is `false`, because `===` never coerces and they're different types." },
      { question: "Predict the output: `console.log(\"0\" == false);` versus `console.log(\"0\" === false);`", answer: "`==` gives `true`: both sides become numbers, `false` to `0` and `\"0\"` to `0`. `===` gives `false`, because a string and a boolean are never strictly equal." },
      { question: "Predict the output: `console.log([1] == 1);`", answer: "`true`. `[1]` becomes the string `\"1\"`, then the number `1`, which equals `1`." },
      { question: "Why is `{} === {}` always false, even when both object literals look identical?", answer: "`===` on objects compares identity (the same object in memory), not contents. Two separately created objects are always different references, however alike they look." },
      { question: "Predict the output: `console.log([25, 1, 10, 2].sort());`", answer: "`[1, 10, 2, 25]`. The default `.sort()` converts elements to strings and compares them character by character, so `\"10\"` comes before `\"2\"` because `\"1\"` comes before `\"2\"`. Use a numeric compare function like `(a, b) => a - b` to sort numbers." },
      { question: "Does `Array.prototype.sort()` mutate the original array, or return a new one?", answer: "It sorts in place, mutating the original, and returns that same array. To keep the original order, copy first, e.g. `[...arr].sort()`." },
      { question: "Why does `[NaN].indexOf(NaN)` return `-1`, and what should you use instead?", answer: "`.indexOf()` compares with `===`, and `NaN === NaN` is always false, so it never finds `NaN`. `.includes()` uses SameValueZero, which treats `NaN` as equal to itself, so `[NaN].includes(NaN)` returns `true`." },
      { question: "Predict the output: `for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }` versus the same loop with `let` instead of `var`.", answer: "With `var`: `3, 3, 3`. All three callbacks share one `i`, which is already 3 when the loop ends and they run. With `let`: `0, 1, 2`, because `let` creates a new `i` for each iteration, so each callback captures its own value." },
      { question: "What is the \"temporal dead zone\" for `let` and `const`?", answer: "The stretch of code from the start of a scope to the `let`/`const` declaration line. The variable exists (it's hoisted), but accessing it throws a `ReferenceError` instead of giving `undefined`. A `var` is set to `undefined` immediately." },
      { question: "Predict the output: `console.log(x); let x = 5;`", answer: "It throws a `ReferenceError` (\"Cannot access 'x' before initialization\"). `x` is in the temporal dead zone until its declaration runs, so it fails loudly instead of returning `undefined` like a `var` would." },
      { question: "How can forgetting `var`/`let`/`const` before an assignment accidentally create a global variable?", answer: "In non-strict ('sloppy') mode, assigning to a name that was never declared creates a new property on the global object instead of throwing. Strict mode (and modules, which are strict by default) throws a `ReferenceError` instead." },
      { question: "Predict the output: `console.log(\"5\" - 2); console.log(\"5\" + 2);`", answer: "`3` and `\"52\"`. `-` is only numeric, so it converts both sides to numbers: `5 - 2 = 3`. `+` also means string concatenation, so when either side is a string it joins them: `\"5\" + \"2\" = \"52\"`." },
      { question: "Why are `[]` and `{}` both truthy in an `if` check, even though they're both \"empty\"?", answer: "The falsy values are a fixed list: `false`, `0`, `-0`, `\"\"`, `null`, `undefined` and `NaN`. Every object, including empty arrays and plain objects, is truthy no matter what it holds." },
      { question: "Predict the output: `console.log(new Array(3).length); console.log(new Array(3));`", answer: "`3` for the length, but the array is `[ <3 empty items> ]`: three holes, not three `undefined` elements. `.forEach()` and `.map()` skip holes, unlike an array actually filled with `undefined` (like `Array(3).fill(undefined)`)." },
      { question: "Predict the output: `function f() { return\n{ ok: true }; } console.log(f());`", answer: "`undefined`. Automatic semicolon insertion adds a semicolon right after `return` when a newline follows it, making it `return;`. The object literal on the next line is unreachable." },
      { question: "Predict the output: `console.log(Object.keys({ b: 1, 2: \"x\", a: 3, 1: \"y\" }));`", answer: "`[\"1\", \"2\", \"b\", \"a\"]`. Keys that look like non-negative integers always come first, in ascending numeric order. The other string keys follow in insertion order." },
      { question: "Why has it historically been important to always pass an explicit radix to `parseInt`, like `parseInt(str, 10)`?", answer: "Without a radix, older engines guessed the base from the string. A leading `0` could make `parseInt(\"08\")` parse as octal (base 8), where `8` isn't even a valid digit. Modern engines default to base 10 unless there's a leading `0x`, but passing the radix removes any doubt." },
      { question: "Predict the output: `console.log(\"10\" < \"9\");`", answer: "`true`. Two strings are compared character by character, not by numeric value. `\"1\"` comes before `\"9\"`, so `\"10\"` is 'less than' `\"9\"` as text." },
      { question: "Why can you call a function before its definition appears later in the same scope, if it's a function declaration but not if it's a function expression assigned to a `var`?", answer: "A function declaration is hoisted with its body, so it works from the top of its scope. A `var` holding a function expression is hoisted only as a name set to `undefined`; the function isn't assigned until that line runs. Calling it earlier throws ('is not a function') because the value is still `undefined`." },
      { question: "Why doesn't `typeof someUndeclaredVariable` throw an error, while directly referencing `someUndeclaredVariable` does?", answer: "`typeof` is designed to return `\"undefined\"` for a name that was never declared, a legacy safety net for checking whether a global exists. Using that name in any other expression throws a `ReferenceError`." },
      { question: "Why might `delete obj.someProperty` silently do nothing instead of removing the property or throwing?", answer: "If the property is non-configurable (as many built-in and some explicitly defined properties are), `delete` fails without throwing in non-strict mode. It returns `false`, but code that ignores the return value never notices, and the property stays." },
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
Sometimes code can't do its job: a network request fails, a file is
missing, a value isn't what you expected. That throws an **error**, and if
nothing handles it, the program crashes. \`try/catch\` lets you say "try
this, and if it fails, run this instead of crashing."
    `.trim(),
    analogy:
      "It's like a safety net under a tightrope walker. You still attempt the risky move (the try), but if it goes wrong, the net (the catch) stops it becoming a disaster.",
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
          { code: 'throw new Error("Age must be a number");', explanation: "Throws an error yourself if the parsed value is the wrong type." },
          { code: "} catch (error) {", explanation: "Runs only if something in try threw. error holds the thrown value." },
          { code: "} finally {", explanation: "Always runs, whether try succeeded or catch ran." },
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
          "Custom error classes let a `catch` block tell kinds of failure apart with `instanceof` instead of treating every error the same.",
      },
    ],
    howItWorks: `
When code in \`try\` throws (on its own from a failing operation, or via
\`throw\`), JavaScript stops that block and jumps to \`catch\`, skipping the
rest of \`try\`. The optional \`finally\` block runs afterward whatever
happened, which suits cleanup that must always run.
    `.trim(),
    whyItExists: `
Without it, one unexpected failure anywhere would crash the whole program.
try/catch keeps a failure contained to the operation that caused it, lets you
respond sensibly (retry, show a message, use a default), and keeps the rest
running.
    `.trim(),
    whenToUse: `
Use try/catch around operations that can realistically fail and that you
want to handle gracefully: parsing untrusted data, network requests (often
with async/await), or anything whose failure shouldn't crash the app.
    `.trim(),
    whenNotToUse: `
Don't add try/catch "just in case" when there's no realistic failure or
nothing sensible to do in the catch. Silently swallowing errors hides real
bugs. And don't use exceptions for normal control flow (like checking if a
key exists) when a simple \`if\` will do.
    `.trim(),
    commonMistakes: [
      "Catching an error and doing nothing with it (an empty catch block), which hides bugs instead of fixing them.",
      "Forgetting that `catch` only catches errors thrown synchronously inside the try. A callback or an unawaited promise inside it can still fail unnoticed.",
      "Throwing plain strings or objects instead of an `Error` (or subclass), losing useful information like a stack trace.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a function that safely divides two numbers, throwing an error if the divisor is 0, and catching it to return `null` instead of crashing." },
      { difficulty: "Medium", prompt: "Create a custom error class `ValidationError extends Error` and throw/catch an instance of it." },
      { difficulty: "Hard", prompt: "Write an async function that retries a failing operation up to 3 times before giving up, using try/catch inside a loop." },
    ],
    interviewQuestions: [
      { question: "Does `finally` still run if the `try` block contains a `return` statement?", answer: "Yes. `finally` always runs before the function returns, whether `try` finished normally, threw an error that was caught, or hit a `return`. Only a crash of the whole process can skip it." },
      { question: "Predict the output: `function f() { try { return 1; } finally { return 2; } } console.log(f());`", answer: "`2`. A `return` in `finally` overrides whatever `try` (or `catch`) was about to return, and even an error that was about to propagate. It's a known footgun, so avoid returning from `finally`." },
      { question: "If an error is already propagating out of a `catch` block, and the paired `finally` block also throws, which error wins?", answer: "The one from `finally`. Like a `return` in `finally`, a `throw` there replaces the error already on its way out. The original error is lost unless you saved it first." },
      { question: "Can you write `try { ... } finally { ... }` with no `catch` at all? What happens to an error thrown inside `try` in that case?", answer: "Yes. `finally` still runs for cleanup, but with no `catch` the error keeps propagating upward afterward. `try/finally` guarantees cleanup; it doesn't contain the error." },
      { question: "What is the \"optional catch binding\" syntax (`catch { ... }` with no parameter), and when is it useful?", answer: "It lets you write `catch` without naming the error, for when you only need to know something failed, not what. It avoids an unused variable that the older syntax required." },
      { question: "Why is throwing a plain string or plain object considered worse practice than throwing an `Error` instance?", answer: "An `Error` captures a stack trace and a consistent `message`/`name` shape when it's created, which is invaluable for finding where and why something failed. A thrown string or plain object has none of that, so the call-site information is lost." },
      { question: "What is `error.stack`, and where does its content actually come from?", answer: "A string filled in automatically when an `Error` (or subclass) is constructed, showing the function calls active at that moment (the call stack). That's why creating the `Error`, not throwing it, is what captures the trace." },
      { question: "What does the `cause` option in `new Error(message, { cause: originalError })` let you do?", answer: "It attaches an underlying error to a new, higher-level one. For example, wrap a low-level network error in a clearer 'Failed to load user' error and keep the original available via `.cause` instead of discarding it." },
      { question: "Inside an `async` function's `try` block, does `catch` reliably handle a promise that's created but never `await`ed?", answer: "No. `try/catch` only catches a rejection where you `await` that promise. A promise started without being awaited (or returned) can reject later, outside the `try/catch`, and becomes an unhandled rejection." },
      { question: "Why doesn't a `try/catch` wrapped around `setTimeout(() => { throw new Error(\"boom\"); }, 0)` catch that thrown error?", answer: "The `try/catch` has already finished running long before the timer callback runs on a later turn of the event loop. When the error is thrown, no `try/catch` is still active. Catch it inside the callback itself." },
      { question: "How do you correctly handle an error from an older, callback-style asynchronous function (not one that returns a promise)?", answer: "Check the error argument inside the callback (the 'error-first callback' convention). A `try/catch` around the outer call can't catch an error raised later, in a callback that runs on a different turn of the event loop." },
      { question: "What's the danger of an empty `catch` block that does nothing with the error it caught?", answer: "It silently swallows real failures. The program carries on as if nothing went wrong, hiding bugs that would otherwise show up as a crash or a log, and making the eventual symptom much harder to trace to its cause." },
      { question: "How do you handle several different kinds of errors differently inside a single `catch` block?", answer: "Check the error's type with `instanceof`, from most to least specific (a subclass is also an instance of its parent), and branch. JavaScript has no multiple typed `catch` clauses, so this is the idiomatic replacement." },
      { question: "What are some of JavaScript's built-in `Error` subtypes, and what typically triggers each one?", answer: "`TypeError`: using a value in a way its type doesn't support (calling something that isn't a function, or reading a property of `null`/`undefined`). `RangeError`: a value outside the allowed range (like an invalid array length). `ReferenceError`: a name that doesn't exist. `SyntaxError`: malformed code, or malformed input to something like `JSON.parse`." },
      { question: "Predict what each of these throws: `null.foo`, referencing an undeclared variable, and `JSON.parse(\"{bad\")`.", answer: "`null.foo` throws a `TypeError` (you can't read a property of `null`). An undeclared variable throws a `ReferenceError`. `JSON.parse(\"{bad\")` throws a `SyntaxError` because the text isn't valid JSON. Knowing which is which lets a `catch` respond appropriately." },
      { question: "When should you rethrow an error you just caught, instead of handling it right there?", answer: "When the current code can't do anything useful about the failure. Logging and swallowing it would hide the problem from the layer that could handle it, so let it keep propagating." },
      { question: "When is throwing an exception the right call for invalid input, versus just returning early with an `if` check or an error code?", answer: "Throw for unexpected situations the caller can't easily check for ahead of time (a network failure, a corrupt file). For normal, expected conditions the caller should check routinely (an empty search result, a missing optional field), a return value or early `if`/return is clearer and cheaper." },
      { question: "How does extending `Error` correctly (`class ValidationError extends Error { constructor(msg) { super(msg); ... } }`) preserve `instanceof` checks?", answer: "`super(message)` runs `Error`'s constructor, which sets up the prototype chain through `Error.prototype`. Then `error instanceof ValidationError` and `error instanceof Error` both return `true`. Skipping `super()` (or not extending `Error`) breaks that chain." },
      { question: "Is it possible for `error instanceof MyCustomError` to fail even when the error really was thrown as `new MyCustomError(...)`?", answer: "Yes, in some unusual setups. For example, transpiling class syntax to an older JS target without special handling for extending built-ins can break the prototype chain, because native `Error` extension relies on engine behavior a naive transpile doesn't reproduce." },
      { question: "What's an \"unhandled promise rejection\", and how is it different from an uncaught synchronous exception?", answer: "A promise that rejected with no `.catch()` (or awaiting `try/catch`) attached. An uncaught synchronous exception usually stops execution right there. An unhandled rejection is detected asynchronously, and the browser or Node reports it separately, sometimes well after it happened." },
      { question: "How would you set up a last-resort handler to catch errors that slipped past every other `try/catch` in an app?", answer: "In a browser, listen for the global `error` event (or set `window.onerror`) for uncaught exceptions, and `unhandledrejection` for unhandled promise rejections. In Node.js, use `process.on(\"uncaughtException\", ...)` and `process.on(\"unhandledRejection\", ...)`. These are a last-resort net for logging and cleanup, not a substitute for handling errors near where they happen." },
      { question: "If every code path inside a `try` block ends in a `return`, does the paired `finally` block still get a chance to run before the function actually returns?", answer: "Yes. `finally` always runs right before control leaves the function, whichever `return` was taken in `try`. Guaranteeing cleanup however the block exits is its whole purpose." },
      { question: "What's the tradeoff between wrapping a `try/catch` around each iteration of a loop individually versus wrapping the entire loop in one `try/catch`?", answer: "Per-iteration catching lets the loop keep processing the other items when one fails, for slightly more code. Wrapping the whole loop is simpler but stops everything at the first failure, so one bad item can block all the rest." },
      { question: "Why is it risky to rely on one giant `try/catch` around an entire application as the main error-handling strategy?", answer: "It catches and quietly swallows many unrelated failures in one place, far from where they happened and with little context to respond. Real bugs hide behind a generic 'something went wrong' instead of being handled or surfaced near their source." },
      { question: "Can a single `try` block have multiple `catch` clauses for different error types, the way some other languages allow?", answer: "No. JavaScript allows one `catch` per `try`. Tell error types apart inside that `catch`, usually with `instanceof`." },
      { question: "What happens if the code inside a `catch` block itself throws a new error?", answer: "The new error propagates upward like any thrown error. The same `catch` doesn't catch it; you need an enclosing `try/catch` to handle failures during error handling." },
      { question: "Is there a meaningful runtime performance penalty to wrapping code in `try/catch` in modern JavaScript engines?", answer: "Not really, in the common case. Modern engines optimize `try/catch` well, and the old advice to avoid it for speed is outdated. Use it where it adds clarity and safety." },
      { question: "Why should error messages meant for logging or debugging often be different from what's shown directly to an end user?", answer: "A log message can include technical detail (stack traces, internal IDs, exact reasons) that helps diagnosis but is meaningless or risky (it can leak internals) to show users. Users need a simpler, actionable message." },
      { question: "What's the benefit of a function throwing early (\"failing fast\") on invalid input, instead of letting bad data quietly propagate deeper into the program?", answer: "It surfaces the problem at its source, with a clear message and a stack trace pointing at the real cause. Otherwise the program keeps going with bad data and fails confusingly much later, somewhere unrelated to the original problem." },
      { question: "How would you write a function that retries a flaky operation up to a fixed number of times before finally giving up?", answer: "Loop up to the retry limit with `try/catch` around each attempt. On success, return right away. On failure, catch and try again, or once the limit is reached, rethrow the last error (or return an explicit failure) instead of giving up silently." },
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
Real apps quickly outgrow one file. **Modules** let you split code into
files that each do one thing, and control what they share: \`export\` makes
something available to other files, and \`import\` brings it in.
    `.trim(),
    analogy:
      "Think of departments in a company. Each department (file) works on its own and shares only specific documents (exports) with departments that ask for them (imports). Nobody has to see everything.",
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
          { code: "export const PI = 3.14159;", explanation: "Makes PI available too. A module can export several things." },
          { code: 'import { add, PI } from "./math.js";', explanation: "Brings both named exports into app.js." },
          { code: "add(2, 3);", explanation: "Uses the imported function just like a local one." },
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
          "A module can have at most one default export, and the importer can name it anything. Named exports must be imported by their exact name.",
      },
    ],
    howItWorks: `
Each file is a module with its own private scope. Nothing in it is visible
elsewhere unless exported. When a file imports from another, JavaScript
loads that module (once, even if many files import it), runs it, and hands
over the exported bindings you asked for.
    `.trim(),
    whyItExists: `
Without modules, all files share one global scope. Names collide, and you
can't tell what depends on what by reading a file. Modules give each file
its own scope and make dependencies explicit.
    `.trim(),
    whenToUse: `
Split code into modules once a file covers more than one clear job: a set
of utility functions, a component, a group of related constants. Import only
what each file needs.
    `.trim(),
    whenNotToUse: `
For a tiny script, splitting into modules can add more overhead (import
paths to manage) than it saves. Avoid circular imports (A imports B, which
imports A); they're a common source of confusing bugs.
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
Every variable, object and function takes up some memory. If nothing
cleaned it up, a long-running program would keep growing until it crashed.
JavaScript handles this automatically with **garbage collection**: it
periodically finds data your program can no longer reach and frees it.
    `.trim(),
    analogy:
      "Think of memory as a warehouse and garbage collection as a janitor who checks for boxes nobody holds a claim ticket for. If nobody can reach a box, it's safe to throw out and reuse the space.",
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
          { code: "// user is reachable", explanation: "While some variable can reach it, JavaScript keeps it in memory." },
          { code: "user = null;", explanation: "Removes the only reference to that object." },
          { code: "// eligible for garbage collection", explanation: "Nothing points to it now, so it can be cleaned up." },
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
          "While `setInterval` runs, its callback (and everything it closes over, including `element`) stays reachable. Forgetting `clearInterval` is one of the most common real-world memory leaks.",
      },
    ],
    howItWorks: `
The garbage collector uses "mark and sweep". It starts from things that are
always reachable (like global variables and anything currently running),
follows every reference it can find, and marks each object it reaches.
Anything left unmarked can't be reached by your code, so it's swept away
and its memory reused.
    `.trim(),
    whyItExists: `
Tracking and freeing memory by hand (as some languages require) is tedious
and causes serious bugs: using memory after freeing it, or never freeing it.
Garbage collection removes that whole class of mistakes from everyday
JavaScript.
    `.trim(),
    whenToUse: `
You never trigger garbage collection yourself. It matters when you clear
references to large objects you no longer need (setting a variable to
\`null\`), or when you're diagnosing a "memory leak" where memory keeps
climbing.
    `.trim(),
    whenNotToUse: `
Don't null out every local variable "just in case". Locals are freed once
the function returns and nothing else references them. Focus on real leaks:
forgotten event listeners, timers never cleared, and references held in
long-lived caches or closures.
    `.trim(),
    commonMistakes: [
      "Leaving event listeners or timers (`setInterval`) running on elements or objects you're done with, keeping them reachable forever.",
      "Storing ever-growing data in a long-lived cache or array with no eviction, so memory keeps growing.",
      "Assuming memory is freed the instant a variable goes out of scope. Garbage collection runs periodically, not necessarily right away.",
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
Reading a nested property like \`user.address.city\` throws an error if
\`user\` or \`address\` is missing. The old fix was a chain of checks:
\`if (user && user.address && user.address.city)\`. **Optional chaining**
(\`?.\`) does this for you: it stops and returns \`undefined\` as soon as it
hits something missing, instead of throwing.

Its partner, **nullish coalescing** (\`??\`), gives a default only when a
value is \`null\` or \`undefined\`. Unlike \`||\`, it won't replace valid values
like \`0\` or \`""\`.
    `.trim(),
    analogy:
      "Optional chaining is like checking each door is unlocked before walking through, instead of crashing into a locked one. Nullish coalescing is a backup plan, 'if there's truly nothing here, use this', that won't override an answer you gave on purpose, like zero.",
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
          { code: "user.address?.city", explanation: "Checks user.address before reading .city. It's null, so the expression short-circuits to undefined." },
          { code: 'user.address?.city ?? "Unknown city";', explanation: "If the left side is null or undefined, falls back to the right side." },
          { code: "count || 10", explanation: "Replaces count with 10 because 0 is falsy. Often not what you want." },
          { code: "count ?? 10", explanation: "Keeps 0, because ?? only falls back on null or undefined, not every falsy value." },
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
          "`?.()` guards a function call that might not exist, and `?.[...]` guards bracket access, just as `?.` guards a plain property.",
      },
    ],
    howItWorks: `
\`?.\` checks whether the value just to its left is \`null\` or \`undefined\`.
If so, the whole chain short-circuits to \`undefined\` without running the
rest.

\`??\` checks only its left side. If it's \`null\` or \`undefined\`, you get
the right side. Otherwise you keep the left value, even if it's \`0\`, \`""\`
or \`false\`.
    `.trim(),
    whyItExists: `
Nested data that might be missing (like optional API fields) used to need
long chains of \`&&\` checks to avoid crashing. These two operators handle
that common need directly, so code is safer and shorter.
    `.trim(),
    whenToUse: `
Use \`?.\` when reading a property that might be missing at some level:
optional API fields, optional config, DOM elements that may not exist. Use
\`??\` for a default for missing values when valid values can be falsy, like
\`0\` or \`""\`.
    `.trim(),
    whenNotToUse: `
Don't add \`?.\` everywhere on data you know is always there. It can hide a
bug that should have thrown and warned you. Use \`||\` instead of \`??\` when
you really want to replace any falsy value, not just null/undefined.
    `.trim(),
    commonMistakes: [
      "Using `?.` so freely that a truly broken or missing value is silently turned into `undefined` instead of raising a helpful error.",
      "Using `||` for defaults when `0`, `\"\"`, or `false` are valid values you want to keep. `??` is usually safer.",
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
When two programs share data (say, a browser and a server), they need a
common text format, because JavaScript objects only exist inside a running
JavaScript program. **JSON** (JavaScript Object Notation) is that format:
plain text that looks like a JavaScript object or array, and that almost
every language can read and write.
    `.trim(),
    analogy:
      "JSON is like a standard recipe card format. Any chef (any language) can read a card in that format, even if their kitchen is completely different from the one that wrote it.",
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
          "`localStorage` only stores strings, so JSON is the standard way to save an object there and get a real object back later.",
      },
    ],
    howItWorks: `
\`JSON.stringify\` walks an object or array and produces text that follows
JSON's strict rules (double-quoted keys, no functions, no \`undefined\`).
\`JSON.parse\` does the reverse and rebuilds the JavaScript value from the
text. Both are pure text transformations. JSON's syntax was inspired by
JavaScript object literals, but the format itself isn't tied to JavaScript.
    `.trim(),
    whyItExists: `
Before JSON, systems exchanging structured data (especially over the web)
often used wordier formats like XML, or made up their own. JSON's simplicity
and likeness to JavaScript objects made it the main format for APIs and
configuration.
    `.trim(),
    whenToUse: `
Use JSON to send structured data between client and server (most API
responses are JSON), to save structured data to a file or localStorage, or
to pass data between programs in different languages.
    `.trim(),
    whenNotToUse: `
JSON can't represent every JavaScript value. Functions and \`undefined\` are
silently dropped, and circular references cause an error. For data that
needs those, or that's very large and performance-sensitive, another format
may fit better.
    `.trim(),
    commonMistakes: [
      "Trying to `JSON.stringify` an object containing functions or `undefined` values and being surprised they're silently dropped.",
      "Forgetting that `JSON.parse` throws on invalid JSON, and not wrapping it in try/catch when the input might be invalid.",
      "Assuming JSON allows comments or trailing commas. It doesn't; it's stricter than a JavaScript object literal.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Convert a small object to a JSON string with `JSON.stringify`, then back with `JSON.parse`, and confirm the values match." },
      { difficulty: "Medium", prompt: "Store an object in `localStorage` as a JSON string, then read and parse it back on page load." },
      { difficulty: "Hard", prompt: "Write a function that safely parses possibly-invalid JSON text, returning `null` instead of throwing if it's malformed." },
    ],
    interviewQuestions: [
      { question: "What does `JSON.stringify` do?", answer: "Converts a JavaScript value into a JSON-formatted text string." },
      { question: "What happens to functions and `undefined` values when you stringify an object containing them?", answer: "They're left out of the JSON string entirely. JSON has no way to represent them." },
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
You've used plain objects as key-value stores and arrays as ordered lists.
**Map** and **Set** are built-in collections that fix some rough edges:

- A \`Map\` accepts any value (not just strings) as a key and tracks its own size.
- A \`Set\` holds values with duplicates removed automatically.
    `.trim(),
    analogy:
      "A Map is like a proper dictionary with tabs for any kind of entry, not just words. A Set is like a guest list where the bouncer refuses to add the same name twice, however often you try.",
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
          { code: 'scores.set("amara", 90);', explanation: "Stores a key-value pair. Unlike an object, the key can be any type, not just a string." },
          { code: 'scores.get("amara");', explanation: "Reads back the value for that key." },
          { code: "scores.size", explanation: "A real property that always gives the current number of entries." },
          { code: "new Set([1, 2, 2, 3, 3, 3]);", explanation: "Drops duplicates, keeping each value once." },
        ],
      },
      {
        title: "Removing duplicates from an array with Set",
        code: `const numbers = [1, 2, 2, 3, 1, 4];

const unique = [...new Set(numbers)];
console.log(unique); // [1, 2, 3, 4]`,
        explanation:
          "Spreading a Set back into an array is a common one-liner to remove duplicates while keeping the first occurrence of each value.",
      },
    ],
    howItWorks: `
A \`Map\` keeps entries in insertion order and uses fast key-based lookup,
like a hash table, without a plain object's quirks (keys turned into
strings, inherited properties getting in the way). A \`Set\` is essentially a
\`Map\` that only cares about keys: adding a value that's already there does
nothing.
    `.trim(),
    whyItExists: `
Plain objects weren't designed as general-purpose maps: keys are always
converted to strings, there's no built-in size, and inherited properties can
sneak in. Map and Set are purpose-built collections without that baggage.
    `.trim(),
    whenToUse: `
Use a \`Map\` when keys aren't simple strings, when you need a reliable
\`.size\`, or when insertion order must be kept. Use a \`Set\` when you need
unique values: removing duplicates from an array, or tracking a group of
unique items.
    `.trim(),
    whenNotToUse: `
For a small collection of string keys, especially one you'll serialize with
\`JSON.stringify\` (which doesn't support Map/Set directly), a plain object
or array is often simpler.
    `.trim(),
    commonMistakes: [
      "Trying to `JSON.stringify` a Map or Set directly and being surprised it doesn't serialize the way a plain object or array does.",
      "Using `.length` on a Map or Set instead of the correct property, `.size`.",
      "Forgetting that a Set only removes duplicates. It doesn't otherwise change the order or type of the data.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use a `Set` to remove duplicate values from an array of numbers." },
      { difficulty: "Medium", prompt: "Use a `Map` to count how many times each word appears in a sentence, and log the results." },
      { difficulty: "Hard", prompt: "Write a function that returns the intersection (common values) of two arrays, using Sets." },
    ],
    interviewQuestions: [
      { question: "What's the main advantage of Map over a plain object for key-value storage?", answer: "Map allows any value as a key (not just strings), maintains a reliable `.size`, and doesn't risk inherited properties interfering with lookups." },
      { question: "How does Set handle duplicate values?", answer: "Adding a value that's already there is silently ignored. A Set only ever holds unique values." },
      { question: "Can you iterate over a Map in insertion order?", answer: "Yes. Maps (and Sets) always iterate in the order entries were inserted." },
    ],
    prerequisites: ["objects"],
    relatedTopics: ["objects", "arrays"],
    keywords: ["Map", "Set", "size", "unique values", "key-value"],
  },
];
