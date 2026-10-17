import type { Topic } from "../../types/content";

export const backendIntermediateTopics: Topic[] = [
  {
    id: "env-vars-and-config",
    title: "Environment Variables & Config",
    level: "intermediate",
    description: "Keep secrets and per-environment settings out of your code, so the same code runs safely in development, testing, and production.",
    explanation: `
A backend needs to know things like which database to use, which API
key sends emails, and whether it's in development or production.
Writing those values into the code causes problems. A secret key in a
file gets committed to version control for anyone with repo access to
see. A database address hardcoded for your laptop breaks on a
production server.

**Environment variables** are values set outside the code, in the
environment the program runs in, and read at startup. Your code asks
"what does the environment say this value is?", and each environment
(your laptop, staging, production) can give a different answer.
    `.trim(),
    analogy:
      "Think of a recipe that says 'add the number of servings you need' instead of 'serves 4.' The same card works for 2 people or 20. You supply a different number without editing the recipe.",
    examples: [
      {
        title: "Reading configuration from the environment",
        code: `// .env file (never committed to version control)
DATABASE_URL=postgres://localhost:5432/myapp_dev
STRIPE_SECRET_KEY=sk_test_abc123
PORT=3000

// app.js
require("dotenv").config();

const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;

app.listen(port, () => console.log(\`Listening on \${port}\`));`,
        explanation: "The secret values live in a .env file excluded from version control. The code only refers to process.env.DATABASE_URL by name.",
        walkthrough: [
          { code: 'require("dotenv").config();', explanation: "Loads key-value pairs from .env into process.env at startup, so local development can simulate real environment variables." },
          { code: "process.env.PORT || 3000", explanation: "Reads PORT from the environment, with a default if it isn't set." },
          { code: "process.env.DATABASE_URL", explanation: "The connection string lives outside the codebase. Each environment supplies its own value." },
        ],
      },
      {
        title: "Switching behavior per environment",
        code: `const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  app.use(compressionMiddleware());
  logger.level = "warn";
} else {
  logger.level = "debug";
}`,
        explanation: "One variable, NODE_ENV, lets the same code behave differently depending on where it's deployed.",
      },
    ],
    howItWorks: `
Environment variables are set at the operating system or process level,
outside your source code. In production, a hosting platform usually
lets you set them in a dashboard or config file separate from the
codebase.

Locally, a \`.env\` file plus a small library (like \`dotenv\`) does the
same job by loading values into \`process.env\` at startup. Your code
reads from \`process.env\` instead of containing the values.
    `.trim(),
    whyItExists: `
Secrets committed to source control stay in the repo's history forever,
even if you delete them later. That's a serious risk if the repo is ever
exposed. The same code also needs different settings in different
places, like a local database versus a production one.

Environment variables solve both: secrets stay out of the codebase, and
config changes per environment without touching the code.
    `.trim(),
    whenToUse: `
Use environment variables for anything sensitive (API keys, database
credentials, tokens) or anything that differs between environments (a
port, a feature flag, which environment the app is in).
    `.trim(),
    whenNotToUse: `
Values that never change and aren't sensitive, like a constant used in
one calculation, don't need to be environment variables. That only adds
indirection. Keep real constants in code.
    `.trim(),
    commonMistakes: [
      "Committing a real `.env` file (with actual secrets) instead of adding it to `.gitignore`.",
      "Forgetting to set a required variable in production, so the app crashes or quietly misbehaves.",
      "Hardcoding a fallback secret in code 'just for now' and forgetting to remove it before shipping.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Move a hardcoded database URL out of a source file into a `.env` file, and read it via `process.env`." },
      { difficulty: "Medium", prompt: "Use `NODE_ENV` to log at 'debug' level in development and 'error' level in production." },
      { difficulty: "Hard", prompt: "Explain what could go wrong if a required environment variable is missing in production, and how you'd make the app fail loudly at startup instead of silently." },
    ],
    interviewQuestions: [
      { question: "What are environment variables and why are they used?", answer: "Config values supplied by the environment a program runs in, not hardcoded in source. They keep secrets out of the codebase and let the same code adapt to different environments." },
      { question: "Why shouldn't secrets be committed to version control?", answer: "They stay in the repo's history even after you remove them, and anyone with repo access, now or later, can see them." },
      { question: "What's the role of a `.env` file in local development?", answer: "It simulates real environment variables locally. A library like dotenv loads its key-value pairs into process.env at startup, so the secrets don't live in the source code." },
      { question: "What data type is a value read from `process.env`?", answer: "Always a string. `PORT=3000` becomes the string \"3000\", so numbers and booleans need explicit conversion, like `Number(process.env.PORT)`." },
      { question: "What's the difference between `.env` and `.env.example`?", answer: "`.env` holds real, often secret values and is not committed. `.env.example` lists the variable names the app expects, with placeholders or no values, and is committed so new developers know what to set up without seeing a real secret." },
      { question: "Why is it good practice to make an app fail immediately at startup if a required environment variable is missing, instead of defaulting silently?", answer: "Failing at startup shows the misconfiguration right away, in an obvious place. A silent default (say, an empty string) lets the app look healthy, then fail confusingly much later, deep in unrelated code, when the value is finally used." },
      { question: "What does `NODE_ENV` typically control in a Node.js app?", answer: "It's a convention that many libraries and your own code check. For example: verbose logging and no caching in development, compression and minimal logging in production." },
      { question: "If a variable is set both in the actual shell environment and in a `.env` file, which one takes effect?", answer: "The shell value. Most `.env` loaders, like dotenv, only set a key in process.env if it isn't already there, so the real OS/shell environment wins over the `.env` file." },
      { question: "Why is it risky to let a database URL or private API key end up in frontend/client-side code, even unintentionally?", answer: "Anything shipped to the browser is visible in dev tools or the page source. A backend-only secret becomes public as soon as it's bundled into client-side JavaScript." },
      { question: "What's the difference between a build-time and a runtime environment variable in a typical deployment?", answer: "A build-time variable is baked into the compiled output, so changing it needs a rebuild. A runtime variable is read each time the process starts, so a restart with a new value is enough." },
      { question: "Why do frontend build tools like Vite require a special prefix (e.g. `VITE_`) before exposing an environment variable to client code?", answer: "Only variables that opt in with the prefix get bundled into client code. This stops the rest of the environment, including backend-only secrets, from being shipped to the browser by accident." },
      { question: "If you edit a value in `.env` while the app is already running, does the change take effect immediately?", answer: "No. Environment variables are read into process.env once, at startup. The running process keeps the old value until you restart it." },
      { question: "What's a feature flag, and how does it typically relate to environment variables?", answer: "A toggle that turns a feature on or off without a code change. It's often an environment variable the code checks, so a feature can be on in staging and off in production with the same code." },
      { question: "Why might a production system use a dedicated secrets manager (like AWS Secrets Manager or HashiCorp Vault) instead of plain environment variables?", answer: "It adds what plain environment variables lack: encryption at rest, fine-grained access control, audit logs of who read a secret and when, and rotating a credential without redeploying every service that uses it." },
      { question: "What does the \"12-factor app\" methodology say about configuration?", answer: "Store config in the environment, strictly separate from code. The same build should deploy to any environment just by supplying different environment variable values, with no code changes." },
      { question: "What's wrong with code like `if (process.env.DEBUG) { ... }` when the intent is to check a boolean flag?", answer: "Every process.env value is a string, so any non-empty string is truthy, including \"false\". `DEBUG=false` still enters the debug branch. Compare explicitly: `process.env.DEBUG === \"true\"`." },
      { question: "Why should different environments (development, staging, production) generally use different actual secret values, not just structurally similar ones?", answer: "If one credential is reused everywhere, a leak in a less-protected environment like staging exposes production too. Separate values limit the damage to the environment that leaked." },
      { question: "What's a practical way to validate that all of an app's required environment variables are present and well-formed, rather than checking each one individually wherever it's used?", answer: "Define a schema (with zod, envalid, or by hand) listing each variable, its type, and whether it's required. Validate `process.env` against it once at startup, so a missing or malformed variable crashes the app right away with one clear error." },
    ],
    prerequisites: ["request-response-lifecycle"],
    relatedTopics: ["error-handling-apis", "deployment-and-cicd"],
    keywords: ["environment variables", "dotenv", "process.env", "configuration", "secrets"],
  },
  {
    id: "error-handling-apis",
    title: "Error Handling in APIs",
    level: "intermediate",
    description: "Catch errors in one central place and return consistent, safe responses, instead of crashing the server or leaking internal details.",
    explanation: `
Things go wrong all the time in a running backend. A database is briefly
unreachable, a client sends malformed data, or a bug throws deep inside
some function. If nothing catches these:

- The whole server process can crash, taking down every other request it was handling.
- The raw error, maybe with a stack trace or internal file paths, can leak back to the caller. That's unhelpful and a security risk.

**Centralized error handling** means one place, usually a special
middleware, catches errors from anywhere in the app and turns them into
a consistent, safe response. Routes don't each repeat that logic.
    `.trim(),
    analogy:
      "It's like one customer service desk in a large store, instead of every cashier handling every complaint. Whatever goes wrong, it's routed to that desk, which responds consistently and politely without exposing the store's internal problems.",
    examples: [
      {
        title: "A route that forwards its errors instead of crashing",
        code: `app.get("/users/:id", async (req, res, next) => {
  try {
    const user = await db.users.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    next(err); // hand off to centralized error-handling middleware
  }
});`,
        explanation: "Instead of letting a database error crash the process, the route catches it and passes it to a dedicated error handler.",
        walkthrough: [
          { code: "try {", explanation: "Wraps work that might throw, like a database call, so failures don't escape uncontrolled." },
          { code: 'return res.status(404).json({ error: "User not found" });', explanation: "A known failure (no such user) gets a clear, expected response right here." },
          { code: "next(err);", explanation: "An unknown failure (a thrown exception) is passed on to Express's error-handling middleware instead of being handled here." },
        ],
      },
      {
        title: "Centralized error-handling middleware",
        code: `app.use((err, req, res, next) => {
  console.error(err); // log the full details internally
  res.status(err.statusCode || 500).json({
    error: "Something went wrong. Please try again.",
  });
});`,
        explanation: "Express treats this four-argument middleware as its error handler. It catches errors passed via next(err) from anywhere in the app, logs the full detail internally, and sends a safe, generic message to the caller.",
      },
    ],
    howItWorks: `
Express tells middleware apart by the number of arguments. Normal
middleware takes \`(req, res, next)\`. Error-handling middleware takes
four: \`(err, req, res, next)\`.

When any route or middleware calls \`next(err)\`, Express skips all
remaining normal middleware and routes and jumps to the nearest
error-handling middleware. There you decide what to log internally and
what safe message to send back.
    `.trim(),
    whyItExists: `
Without it, every route needs its own copy of the logic for catching
errors, picking status codes, and hiding internal details. It's easy to
miss one spot and leave a crash or a leak waiting to happen.

Centralizing it applies one policy everywhere and makes it much harder
to expose a stack trace to a real user by accident.
    `.trim(),
    whenToUse: `
Add it to almost every real backend, from the start. It's cheap to set
up early and expensive to retrofit once dozens of routes handle errors
inconsistently.
    `.trim(),
    whenNotToUse: `
It doesn't replace handling *expected* failures where they happen. A
missing record (404) or invalid input (400) usually deserves its own
specific response, not the generic handler meant for unexpected
failures.
    `.trim(),
    commonMistakes: [
      "Sending the raw error object (with its stack trace) to the client in production.",
      "Forgetting to call `next(err)` in an async route, so a thrown error is never caught and the process may crash.",
      "Treating every failure the same, instead of separating expected failures (bad input, missing resource) from unexpected ones (a bug, a downed dependency).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a route that catches a thrown error and forwards it to `next(err)` instead of crashing the server." },
      { difficulty: "Medium", prompt: "Write error-handling middleware that logs the full error internally but returns only a generic message and status code to the client." },
      { difficulty: "Hard", prompt: "Design an error-handling scheme that separates 'expected' errors (like validation failures, with a custom `statusCode`) from unexpected ones, and returns a different level of detail for each." },
    ],
    interviewQuestions: [
      { question: "Why is centralized error handling important in an API?", answer: "It handles errors consistently everywhere, stops unhandled exceptions from crashing the server, and avoids leaking internal details like stack traces to clients." },
      { question: "How does Express know a middleware function is meant for error handling?", answer: "By its signature. Error-handling middleware takes four arguments, (err, req, res, next), instead of three." },
      { question: "What's the difference between an expected error and an unexpected one in API design?", answer: "An expected error (invalid input, a missing resource) is handled explicitly with a clear status and message. An unexpected error (a bug or crash) is caught generically, logged in detail, and reported to the client with a safe, vague message." },
      { question: "What happens if an `async` route handler throws in Express 4, but nothing catches it or forwards it with `next(err)`?", answer: "Express 4 doesn't catch a rejected promise from an async handler. It becomes an unhandled promise rejection that Express never sees, which can crash the process or leave the request hanging. (Express 5 fixes this by forwarding errors from async handlers to the error middleware automatically.)" },
      { question: "How can you avoid manually wrapping every async route handler in its own try/catch?", answer: "Wrap each handler in a small helper (often called an async handler) that calls it and attaches `.catch(next)` to the returned promise. Any rejection then goes to `next(err)` without a try/catch in every route." },
      { question: "Why must error-handling middleware be registered last, after all other routes and middleware?", answer: "Express runs middleware in registration order. When something calls `next(err)`, Express skips forward to the next error-handling middleware defined *after* that point. One placed earlier never sees errors from routes registered after it." },
      { question: "What's the difference between an operational error and a programmer error?", answer: "An operational error is an expected run-time problem in a working system, like a failed network request or invalid input, and can be handled gracefully. A programmer error is a bug, like calling a function with the wrong type. It generally shouldn't be caught and swallowed, since the program may be in an unknown state." },
      { question: "Why might letting the process crash on a programmer error be safer than catching it and returning a generic 500?", answer: "If a bug leaves the process in an undefined state, serving more requests risks further corruption or odd behavior. Crashing (with a process manager that restarts it) resets to a known-good state. Catching and continuing hides the bug." },
      { question: "What are `process.on(\"uncaughtException\")` and `process.on(\"unhandledRejection\")` for, and why don't they replace centralized Express error handling?", answer: "They're last-resort, process-wide safety nets for errors that escape everything else, usually used to log and exit cleanly. They run outside any request, so they can't send an HTTP response. Express's error middleware is tied to a request/response pair, so it's what actually replies to the caller." },
      { question: "How would you create a custom error class that carries an HTTP status code?", answer: "Extend `Error` and add a `statusCode` property, e.g. `class ApiError extends Error { constructor(statusCode, message) { super(message); this.statusCode = statusCode; } }`, then `throw new ApiError(404, \"Not found\")` and read `err.statusCode` in the error middleware." },
      { question: "Why is distinguishing a custom `ApiError` (with an explicit `statusCode`) from a plain `Error` useful inside centralized middleware?", answer: "Checking `err.statusCode` tells a deliberate failure (respond with its code and message) apart from an unexpected exception, which gets a generic 500 so a message never meant for users isn't exposed." },
      { question: "What HTTP status code should malformed or missing input receive, and why not 500?", answer: "400 Bad Request. The request is invalid, not the server's fault. A 500 signals the server failed, which blames the wrong side and can mislead monitoring that treats 500s as server-health incidents." },
      { question: "Why is returning a consistent JSON error shape across every endpoint valuable?", answer: "Callers (frontend code, other services, API consumers) can write one error-handling routine that works for every endpoint, with no special cases per route." },
      { question: "What's the risk of including the raw `err.message` from an unexpected exception directly in the response body?", answer: "An internal message can include sensitive detail, like a database error naming a table or part of a query. Send a generic message to the client and only log the real `err.message` internally." },
      { question: "Why does throwing synchronously inside a non-async route handler get caught automatically, while an async one doesn't in Express 4?", answer: "Express runs a handler inside its own try/catch, so a direct throw is caught and forwarded. A rejected promise from an async function happens after that call has already returned, outside Express's try/catch, so it's missed unless you forward it with `.catch(next)`." },
      { question: "What does calling `next()` with no argument mean to Express, versus calling `next(err)`?", answer: "`next()` moves on to the next matching middleware or route as normal. `next(err)` signals a failure, so Express skips all remaining normal middleware and goes straight to error-handling middleware." },
      { question: "What's the difference between a 401 and a 403 status code?", answer: "401 Unauthorized means the caller hasn't proven who they are (missing or invalid credentials). 403 Forbidden means they're known but not allowed to do this action. Despite its name, 401 is about authentication, not authorization." },
      { question: "What's a correlation or request ID, and how does it help with error handling in production?", answer: "A unique ID attached to each request and included in every log line and error report for it. It lets you tie together scattered log entries across services or middleware when debugging one failed request." },
      { question: "Why might returning different error detail in development versus production be a good practice?", answer: "In development, the full stack trace and message speed up debugging. In production, that detail in the hands of a caller (or attacker) is a liability. A check like `NODE_ENV` can control how much the error handler includes." },
      { question: "If a route's `catch` block calls `next(err)` without a `return`, what happens to any code written after that call in the same handler?", answer: "It still runs. `next(err)` doesn't stop control flow by itself. Without `return next(err)`, the handler can carry on and call `res.json()` a second time for the same request." },
      { question: "What does Express do if a handler calls `res.json()` (or similar) more than once for the same request?", answer: "It throws an error, usually \"Cannot set headers after they are sent to the client\". HTTP allows only one response per request. This often happens when a handler forgets to `return` after responding in one branch and then responds again." },
      { question: "How would you test that centralized error-handling middleware hides a raw error message from an unexpected exception?", answer: "Make a route throw a plain error (e.g. force a dependency to throw in a test). Assert the response has only the safe generic message and status code, never the original message or stack trace, and separately assert the full error was logged." },
      { question: "Why isn't it always safe to automatically retry a failed operation inside error-handling logic?", answer: "Retrying is only safe for idempotent operations, which give the same result however many times they run, like a GET. Retrying a non-idempotent one, like a payment charge or an INSERT with no deduplication, can perform the action more than once." },
      { question: "What's the difference between a synchronously thrown error and an error passed to a callback's error argument in older Node-style async code?", answer: "A synchronous throw travels up the call stack immediately and must be caught with try/catch at or above that point. An error-first callback's error argument doesn't throw at all. You must check it (`if (err) { ... }`) when the callback runs, long after the original try/catch is gone." },
      { question: "What's the value of a `notFoundHandler` middleware placed after all defined routes but before the error handler?", answer: "It catches requests that matched no route, so the app returns a consistent 404 JSON response for unknown endpoints instead of Express's default plain-text \"Cannot GET /whatever\" page." },
      { question: "Why still log the full error object, including its stack trace, inside error middleware even while returning a generic response to the client?", answer: "The stack trace and full message are what you need to find and fix the bug. Hiding them from the client is about not leaking internals to an untrusted caller, not throwing the information away. Capture it where the team looks, like logs or an error-tracking service." },
    ],
    prerequisites: ["middleware", "env-vars-and-config"],
    relatedTopics: ["middleware", "validation-and-sanitization", "logging"],
    keywords: ["error handling", "next(err)", "status codes", "try/catch"],
  },
  {
    id: "validation-and-sanitization",
    title: "Validation & Sanitization",
    level: "intermediate",
    description: "Check that incoming data has the shape you expect before your code uses it, and clean out anything unsafe.",
    explanation: `
A backend can never fully trust request data, even from your own
frontend. Anyone can send a request, with any tool, not just your app.
A number field might arrive as text, a required field might be missing,
or a name field might hide HTML or a database command.

**Validation** checks that incoming data matches what your code
expects: the right fields are present, with the right type and shape.
**Sanitization** goes further. It cleans or transforms data to remove
anything unsafe (like stripping HTML tags from a comment) instead of
rejecting it.
    `.trim(),
    analogy:
      "Validation is a bouncer checking IDs at the door and turning away anyone who doesn't qualify. Sanitization is a coat check that removes anything dangerous from a bag before letting it in, instead of turning it away.",
    examples: [
      {
        title: "Manual validation before using data",
        code: `app.post("/signup", (req, res) => {
  const { email, age } = req.body;

  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }
  if (typeof age !== "number" || age < 13) {
    return res.status(400).json({ error: "Invalid age" });
  }

  createUser({ email, age });
  res.status(201).json({ ok: true });
});`,
        explanation: "The route won't create a user until it has confirmed the data looks right.",
        walkthrough: [
          { code: '!email.includes("@")', explanation: "A deliberately basic check. Real apps usually use a proper email rule or library, but the idea is the same: reject shapes that can't be right." },
          { code: "typeof age !== \"number\"", explanation: "Confirms the field is the type the rest of the code assumes, before doing arithmetic or comparisons." },
          { code: 'return res.status(400).json({ error: "Invalid age" });', explanation: "Stops right away and tells the caller what was wrong, instead of carrying on with bad data." },
        ],
      },
      {
        title: "Using a validation library for a declarative schema",
        code: `const { z } = require("zod");

const signupSchema = z.object({
  email: z.string().email(),
  age: z.number().min(13),
});

app.post("/signup", (req, res) => {
  const result = signupSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues });
  }
  createUser(result.data);
  res.status(201).json({ ok: true });
});`,
        explanation: "Instead of hand-writing every check, you declare the expected shape once as a schema, and the library validates the data against it in one call.",
      },
    ],
    howItWorks: `
Validation usually runs early, often as middleware before the route's
main logic. It checks the body, query string, or route parameters
against rules: is the field present, is it the right type, is it within
an allowed range or set of values?

If the data fails, the request is rejected right away with a clear
error, before any database call or business logic. Sanitization also
runs early, but it transforms the data (trimming whitespace, escaping
special characters, removing disallowed HTML) instead of rejecting it.
    `.trim(),
    whyItExists: `
Trusting incoming data blindly causes two kinds of problems:

- Ordinary bugs, like a function crashing because a number field was actually text.
- Security holes, like an attacker sending crafted data to manipulate a database query or inject a script other users will see.

Validation and sanitization catch both at the door, before bad data can
do damage deeper in the system.
    `.trim(),
    whenToUse: `
Validate and sanitize any data from outside your trusted backend code:
request bodies, query strings, route parameters, uploaded file names.
This matters most before the data touches a database, is rendered into
a page, or is used to build a file path.
    `.trim(),
    whenNotToUse: `
Data your backend generated itself and never exposed to outside input
doesn't need the same checks. Re-validating data you fully control adds
overhead with no safety benefit.
    `.trim(),
    commonMistakes: [
      "Validating only on the frontend and assuming the backend doesn't need to check again.",
      "Checking only that a field exists, not its type or shape, so malformed data slips through.",
      "Confusing validation (rejecting bad data) with sanitization (cleaning it up) and using only one when you need both.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write validation for a POST /login route that requires both `username` and `password` to be non-empty strings." },
      { difficulty: "Medium", prompt: "Reject a `signup` request if the `age` field is present but not a positive number." },
      { difficulty: "Hard", prompt: "Explain the difference between rejecting a comment that contains HTML tags (validation) and stripping the tags before saving it (sanitization). Describe a situation where each is the right choice." },
    ],
    interviewQuestions: [
      { question: "What's the difference between validation and sanitization?", answer: "Validation checks data against expected rules and rejects it if it fails. Sanitization cleans or transforms data to remove unsafe parts instead of rejecting it." },
      { question: "Why can't you rely solely on frontend validation?", answer: "Anything can send a request, not just your frontend. A malicious or buggy client can skip frontend checks entirely, so the backend must validate on its own." },
      { question: "Why is validating data early in the request lifecycle useful?", answer: "It stops bad data before it reaches business logic or a database, preventing crashes and security issues instead of finding them deeper in the system." },
      { question: "What does a schema-based validation library (like zod or Joi) buy you over hand-written `if` checks?", answer: "You declare the expected shape once and get consistent parsing, type coercion, and error messages automatically. Hand-written checks get scattered across routes and drift out of sync." },
      { question: "What's the difference between a validation library that throws on failure and one that returns a result object, like zod's `safeParse`?", answer: "A throwing API means wrapping every call in try/catch. A result object like `{ success, data | error }` lets you check `.success` without exceptions. That fits validation well, since invalid input is a common, expected outcome, not an exceptional one." },
      { question: "Why does type coercion, like converting a query-string \"42\" into the number 42, matter for validation?", answer: "Query strings and route parameters always arrive as strings, even when they represent numbers or booleans. A schema that wants a number must convert the value, not just check `typeof`, or every correct numeric query param would fail." },
      { question: "What's an object-injection risk validation should guard against beyond type checks, e.g. in a MongoDB query built from `req.body`?", answer: "A field like `{ password: { \"$ne\": null } }` sent as JSON can be read as a MongoDB query operator instead of a literal value, which can bypass an equality check. Validating that the field is a plain string, not an object, before using it in a query closes this off." },
      { question: "What is HTML/script sanitization specifically protecting against?", answer: "Cross-site scripting (XSS). If user text containing `<script>` tags or event handlers is stored and later rendered into a page without sanitizing or escaping, that script runs in other users' browsers as if it were part of the trusted site." },
      { question: "What's the difference between escaping and stripping when sanitizing user input meant to be displayed as HTML?", answer: "Escaping converts special characters, like `<` to `&lt;`, so they show as literal text instead of markup. The content looks the same. Stripping removes disallowed tags or characters, which changes the content." },
      { question: "Why doesn't `typeof age !== \"number\"` alone fully validate a numeric field?", answer: "It only rules out non-numeric types. `NaN` and `Infinity` are both of type \"number\" in JavaScript, so you also need a check like `Number.isFinite(age)` to get a usable number." },
      { question: "What's mass assignment, and how does validation help prevent it?", answer: "Passing all of `req.body` into a database create or update lets a client set fields it shouldn't control, like `role: \"admin\"`. Validating against a schema that allows only specific fields, and ignores or rejects the rest, stops extra fields from getting through." },
      { question: "Why should validation happen before any database call, rather than letting the database reject bad data on its own?", answer: "A failing database constraint, like a NOT NULL violation, still wastes a round trip and often shows up as a vague database error. Validating first avoids the wasted work and gives the caller a clear, actionable message." },
      { question: "What does it mean to validate at the boundary of a system?", answer: "Checking data as it enters the system, e.g. when a request arrives. Everything past that point (business logic, database calls) can then assume the data has the right shape, without re-checking it everywhere." },
      { question: "Why might you sanitize a filename before using it to write a file to disk?", answer: "Path traversal. A filename like `../../etc/passwd` can escape the upload directory if used directly. Sanitize it (remove path separators, resolve to a safe base directory) before building a real file path." },
      { question: "What's the risk of trusting a simple email-format check, like a string containing `@`, as proof an email address is real and reachable?", answer: "It only shows the format looks plausible, not that the address exists or belongs to the person. Proving a real, owned address needs a step like sending a verification email." },
      { question: "How should a validation error response differ from a plain 500, in terms of what it tells the caller?", answer: "It should say which field failed and why, e.g. \"email must be a valid email address\", because the caller can fix the request. A 500 means a server-side problem the caller can't do anything about." },
      { question: "Why is it important to validate the contents of array and object fields, not just that the field itself is an array or object?", answer: "Being 'an array' says nothing about what's inside. An endpoint expecting numeric ids could get strings, objects, or a huge number of items. The schema must check each element, not just the outer shape." },
      { question: "What's a practical reason to enforce limits, like max string length or max array size, during validation beyond checking type and shape?", answer: "Without limits, a request with the right types and shape could still send an enormous string or array to burn memory or CPU, a form of denial-of-service. Validation should also cap the size of what it accepts." },
    ],
    prerequisites: ["error-handling-apis"],
    relatedTopics: ["error-handling-apis", "file-uploads"],
    keywords: ["validation", "sanitization", "schema validation", "input validation"],
  },
  {
    id: "file-uploads",
    title: "File Uploads",
    level: "intermediate",
    description: "How a server receives a file sent from a form or client, and what happens to it once it arrives.",
    explanation: `
Most data a backend receives is simple text: JSON with strings and
numbers. Sometimes a client needs to send a real file, like a profile
picture, a PDF, or a spreadsheet. Files are binary, often large, and
usually come with regular form fields (a caption, a category) in the
same request. Raw JSON isn't well suited to carrying binary content
alongside those fields.

Browsers and servers use a request format called **multipart form
data** for this. It packs one or more files and regular fields into a
single request, each part separated and labeled.

On the server, a small library (like \`multer\` in Node.js) unpacks the
request. It saves each file somewhere (disk, memory, or straight to
cloud storage) and gives your route handler its details.
    `.trim(),
    analogy:
      "A multipart request is like a padded envelope with several separately wrapped, labeled items: a letter (a text field), a photo (a file), and a receipt (another field). The person opening it (the server) can tell what each piece is, instead of getting one unlabeled blob.",
    examples: [
      {
        title: "Accepting a single file upload with multer",
        code: `const multer = require("multer");
const upload = multer({ dest: "uploads/" });

app.post("/profile-picture", upload.single("avatar"), (req, res) => {
  console.log(req.file);   // { filename, path, size, mimetype, ... }
  console.log(req.body);   // any other regular form fields sent alongside it
  res.json({ url: \`/uploads/\${req.file.filename}\` });
});`,
        explanation: "multer runs as middleware. It intercepts the multipart request, saves the file to disk, and attaches its details to req.file before your route handler runs.",
        walkthrough: [
          { code: 'multer({ dest: "uploads/" })', explanation: "Sets where uploaded files are stored on disk, temporarily or permanently." },
          { code: 'upload.single("avatar")', explanation: "Middleware that expects exactly one file under the field name 'avatar', matching the name the client's form used." },
          { code: "req.file", explanation: "After the middleware runs, the handler can read the file's details: saved path, size, and original name." },
        ],
      },
      {
        title: "Validating an upload before accepting it",
        code: `const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg"];
    cb(null, allowed.includes(file.mimetype));
  },
});`,
        explanation: "Limiting file size and type at the upload layer keeps huge or unexpected files away from your app logic and storage.",
      },
    ],
    howItWorks: `
When a form with a file is submitted, the browser encodes the body as
\`multipart/form-data\` instead of JSON. The body is split into sections,
each with a small header saying whether it's a regular field or a file.
File parts also carry their original name and content type.

On the server, an upload library reads that body and extracts each
file's bytes. It writes them somewhere (a temp folder, then often on to
permanent or cloud storage) and fills \`req.file\` (or \`req.files\`) with
metadata. Regular fields land in \`req.body\` as usual.
    `.trim(),
    whyItExists: `
JSON bodies are text and aren't built to carry large binary data
efficiently alongside other fields. Multipart form data is the standard
way to bundle files and fields in one request. Libraries like multer
save every project from writing multipart parsing by hand.
    `.trim(),
    whenToUse: `
Use multipart uploads whenever a user needs to send an actual file
(images, documents, videos) rather than structured text.
    `.trim(),
    whenNotToUse: `
If the client only references a file hosted elsewhere (a URL), or sends
a small amount of binary data, plain JSON with a base64-encoded string
can be simpler. It's less efficient for large files, though.
    `.trim(),
    commonMistakes: [
      "Not limiting file size or type, so huge or unexpected files can exhaust disk space or memory.",
      "Storing uploads inside the app's codebase directory instead of separate, dedicated storage.",
      "Trusting the client-reported file extension or MIME type as proof of what the file contains.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Set up a route that accepts a single file under the field name 'document' and returns its saved filename." },
      { difficulty: "Medium", prompt: "Add a 5MB file size limit and reject larger uploads with a clear error message." },
      { difficulty: "Hard", prompt: "Explain why a file's declared MIME type alone doesn't prove it's a safe image, and describe one extra check you could add." },
    ],
    interviewQuestions: [
      { question: "What is multipart form data and why is it used for file uploads?", answer: "A request format that bundles files and regular form fields together, each part separated and labeled. Plain JSON isn't well suited to carrying large binary content alongside text fields." },
      { question: "What role does a library like multer play in handling uploads?", answer: "It parses the multipart request, extracts the files, saves them (to disk, memory, or on to cloud storage), and exposes their metadata to the route via req.file or req.files." },
      { question: "Why should you limit file size and validate file type on the server, not just the frontend?", answer: "A request can skip the frontend entirely, so limits enforced only there give no real protection against oversized or malicious uploads." },
      { question: "What's the difference between multer's `memoryStorage` and `diskStorage`?", answer: "`memoryStorage` keeps the whole file in RAM, via `req.file.buffer`. It's simple but risky for large files or many concurrent uploads, since it can exhaust memory. `diskStorage` streams the file to a temp location on disk, using less memory per upload, but you must clean up those temp files." },
      { question: "Why is streaming an uploaded file directly to storage preferable to fully loading it into memory first, for large files?", answer: "Streaming handles the file in small chunks as they arrive, so memory use stays roughly constant whatever the file size. Loading the whole file first makes memory grow with file size, which can exhaust the server under concurrent large uploads." },
      { question: "What's the security risk of trusting a file's client-reported MIME type or extension?", answer: "Both are metadata the client supplies and can be forged. A file named photo.jpg claiming image/jpeg could be a completely different format. Verify the real content on the server, e.g. by inspecting the file's byte signature." },
      { question: "Why store uploaded files outside the application's own served codebase directory, or in dedicated object storage like S3?", answer: "Uploads inside the codebase risk being served or executed as part of the app. They also complicate deployments that replace the whole codebase, and don't scale across multiple server instances the way shared storage does." },
      { question: "What happens if `upload.single(fieldName)` receives a request where the client used a different field name than expected?", answer: "`req.file` isn't set at all. The middleware only looks under that exact field name, so the route should check that `req.file` exists instead of assuming it." },
      { question: "Why should an uploaded file be given a new, generated filename on the server rather than keeping the client-supplied original filename?", answer: "The original name is attacker-controlled. It can contain path traversal sequences or odd characters, or clash with another user's file. A server-generated unique name, like a UUID, avoids both the security risk and accidental overwrites." },
      { question: "How does `upload.array(fieldName, maxCount)` differ from `upload.single(fieldName)`?", answer: "`.single()` expects exactly one file under that field name and fills `req.file`. `.array()` accepts several files under the same field name, up to `maxCount`, and fills `req.files` as an array." },
      { question: "Why might you validate an image upload's actual pixel dimensions or re-encode it server-side, beyond checking its MIME type and size?", answer: "A file can pass type and size checks and still be a crafted image that exploits a bug in an image library, or a small file with enormous decoded dimensions. Re-encoding through a trusted image library normalizes the format and neutralizes most such attacks." },
      { question: "What HTTP status code would you typically return if an upload exceeds the configured size limit?", answer: "413 Payload Too Large. Multer's fileSize limit raises an error that the route or error middleware should catch and turn into this response, instead of a generic crash." },
      { question: "Why is `multipart/form-data` less efficient than raw binary transfer, and when is that trade-off still worth it?", answer: "Multipart adds boundary markers and headers around each part, which makes the payload somewhat larger than raw bytes. It's worth it whenever a file must travel with other form fields in one request, which a raw binary body can't do." },
      { question: "Why check a file's extension or magic-byte signature, in addition to its declared MIME type?", answer: "A MIME type is one header value that's easy to spoof. An extension or byte-signature check adds an independent check an attacker must also get right, so one forged value isn't enough to slip a disguised file through." },
      { question: "Why does an upload route usually need both a `fileFilter` and a size limit?", answer: "A size limit still lets any small file type through. `fileFilter` runs during parsing and rejects unwanted MIME types before the file is written to storage. They guard against different problems, so you need both." },
      { question: "What happens to `req.body` fields sent alongside a file in the same multipart request?", answer: "They're parsed onto `req.body` as usual. Multer puts the file parts in req.file/req.files and leaves text fields on req.body, so the route gets both." },
    ],
    prerequisites: ["validation-and-sanitization"],
    relatedTopics: ["validation-and-sanitization", "logging"],
    keywords: ["file upload", "multipart form data", "multer", "binary data"],
  },
  {
    id: "logging",
    title: "Logging",
    level: "intermediate",
    description: "Record what a running server does in a structured, searchable way, so you can understand problems after the fact.",
    explanation: `
During development, a stray \`console.log\` is often enough because
you're watching the terminal. A production server runs unattended, often
on several machines, for weeks, handling requests nobody watches. When
something breaks at 3 AM, you need a record of what the server was
doing then.

**Logging** means deliberately recording events as the server runs: a
request came in, a database call took 400ms, a payment failed. Entries
are usually structured and timestamped, with a **severity level** (like
\`debug\`, \`info\`, \`warn\`, \`error\`). They're often sent somewhere
searchable, not just printed to a terminal that disappears when the
process restarts.
    `.trim(),
    analogy:
      "console.log is like shouting in an empty room: useful only if someone is listening right then. Structured logging is like a ship's logbook: every entry is timestamped, labeled by importance, and kept in a permanent, searchable record anyone can review later.",
    examples: [
      {
        title: "Ad-hoc console.log vs. structured logging",
        code: `// Ad-hoc — fine for local debugging, poor for production
console.log("user logged in", userId);

// Structured — with a logging library like winston or pino
logger.info("user_login", { userId, ip: req.ip, timestamp: Date.now() });`,
        explanation: "The structured version adds a severity level, a machine-readable event name, and consistent fields, so you can filter and search logs later instead of parsing free-form text.",
        walkthrough: [
          { code: 'console.log("user logged in", userId);', explanation: "Only visible in whatever terminal the process is attached to, as inconsistent, hard-to-search text." },
          { code: 'logger.info("user_login", { userId, ip: req.ip, ... })', explanation: "Uses a named level (info), so you can later filter to only warnings and errors and skip routine noise." },
          { code: "{ userId, ip: req.ip, timestamp: Date.now() }", explanation: "Consistent fields, not a free-form sentence, let you search or aggregate logs, e.g. 'show me all logins from this IP.'" },
        ],
      },
      {
        title: "Logging at different severity levels",
        code: `logger.debug("cache lookup", { key: cacheKey });      // routine, verbose detail
logger.info("order created", { orderId });             // normal operation
logger.warn("payment retry", { orderId, attempt: 2 });  // recoverable issue
logger.error("payment failed", { orderId, err });       // needs attention`,
        explanation: "Severity levels let you turn verbosity up or down per environment (full detail in development, only warnings and errors in production) without changing the logging calls.",
      },
    ],
    howItWorks: `
A logging library gives you a method per severity level (\`debug\`,
\`info\`, \`warn\`, \`error\`) instead of one flat \`console.log\`. Each call
records a structured entry, usually with a timestamp, the level, a
message, and any extra data you attach.

Entries go to one or more destinations: the terminal in development,
and often a file or external logging service in production, where logs
from many server instances can be searched together. A configured
minimum level (like "info and above") decides which calls get recorded
in each environment.
    `.trim(),
    whyItExists: `
Production problems are almost never diagnosed live. Someone
investigates later, often much later, without having watched it happen.
Logging leaves a durable, searchable trail of what the system was doing,
so it can answer questions nobody thought to ask at the time.
    `.trim(),
    whenToUse: `
Log meaningful events: requests, errors, retries, and decision points
that help explain behavior later. This matters most around payments,
authentication, and external services that can fail.
    `.trim(),
    whenNotToUse: `
Don't log very frequent, low-value events at a verbose level in
production (like every cache hit). It drowns out the signal you need and
can become a performance or cost problem itself.
    `.trim(),
    commonMistakes: [
      "Logging sensitive data (passwords, full card numbers, tokens) where it can be seen or leaked.",
      "Using one level for everything (usually `console.log`), so you can't filter noise from real problems.",
      "Keeping logs only in a terminal or on one server's disk, so they vanish when that process or machine goes away.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Replace three `console.log` calls in a small Express app with structured `logger.info` calls that include useful context." },
      { difficulty: "Medium", prompt: "Add a `logger.error` call in a catch block that records the error and the request path, without leaking the raw error in the client's response." },
      { difficulty: "Hard", prompt: "Explain why logging a user's raw password is a serious mistake even if the log file is 'internal only,' and describe a safer alternative." },
    ],
    interviewQuestions: [
      { question: "Why is structured logging preferred over ad-hoc console.log statements in production?", answer: "Structured logs are timestamped, leveled, and machine-readable, so you can search and filter them later. They also outlive a single terminal session." },
      { question: "What are severity levels in logging, and why do they matter?", answer: "Levels like debug, info, warn, and error mark how important an entry is. They let you control verbosity per environment, e.g. full detail in development but only warnings and errors in production." },
      { question: "What kind of data should never be written to logs?", answer: "Sensitive data like passwords, full payment card numbers, or authentication tokens. Logs can be read by more people and systems than the original data was meant for." },
      { question: "Why can excessive logging itself become a performance problem in production?", answer: "Every log call costs something: serializing data and writing it to disk or the network. At high volume, logging every routine event verbosely can add real latency and storage cost, competing with the server's actual work." },
      { question: "What does it mean to set a minimum log level in production, e.g. only warn and above?", answer: "Calls below that threshold, like debug or info, are dropped and never written. The same code gives quiet output in production and full detail in development by changing one config value." },
      { question: "Why is including a request or correlation ID in every log line tied to a single incoming request useful?", answer: "With concurrent traffic, log lines from many requests interleave. A shared id on every line for one request lets you filter out that request's full story afterward, even among thousands of others." },
      { question: "Why do production systems typically send logs to a centralized aggregation service instead of just writing to a local file?", answer: "It collects logs from every instance into one searchable place. A log on one instance's local disk is lost if that instance is replaced or scaled down, and you can't search across instances without a central destination." },
      { question: "Why might a team choose JSON as the on-the-wire format for log entries rather than a human-readable sentence?", answer: "Log tools can parse JSON reliably and filter, aggregate, and query its fields directly. A free-form sentence needs pattern matching or regex, which is brittle and breaks when the wording changes slightly." },
      { question: "What's the risk of logging an entire request or response body indiscriminately?", answer: "Bodies often contain exactly the sensitive data that shouldn't be logged, and can be large. Logging them wholesale creates a security or privacy liability and bloats log storage." },
      { question: "Why should error logs typically include the full stack trace, not just the error's message string?", answer: "The message often says what went wrong but not where. The stack trace shows the call chain that led to the failure, which is usually what you need to find and fix the bug." },
      { question: "What's the difference between logging and monitoring or alerting?", answer: "Logging records events for later inspection. Monitoring and alerting watch metrics or log patterns continuously and notify someone when a threshold is crossed. Logs are often the raw material alerting watches, but the two serve different purposes." },
      { question: "Why is `console.log` particularly unsuitable for a production Node.js server handling concurrent requests?", answer: "It writes synchronously to standard output by default, which can block the event loop under heavy load. Its output is also unstructured, untimestamped, and unleveled, so it doesn't fit aggregation or filtering tools." },
      { question: "Why might you log at the `warn` level for a recoverable failure, like a successful retry after one failed attempt, instead of `error`?", answer: "Keeping `error` for events that need attention keeps that level meaningful. Logging every recovered hiccup as an error causes alert fatigue and buries the urgent ones." },
      { question: "How would you redact a sensitive field, like a password or token, from a log entry while still logging the rest of the object it's part of?", answer: "Explicitly remove or mask that field before logging, e.g. by destructuring it out, instead of logging the raw object and hoping nothing sensitive is in it." },
      { question: "Why might logging configuration differ between local development and production, beyond just the minimum level?", answer: "Development often wants colorized, readable console output for a person. Production usually wants machine-parseable JSON sent to an aggregation service, maybe to other destinations too. The logging calls stay the same; only the configured format and destinations change." },
    ],
    prerequisites: ["error-handling-apis"],
    relatedTopics: ["error-handling-apis", "background-jobs"],
    keywords: ["logging", "log levels", "structured logging", "observability"],
  },
  {
    id: "background-jobs",
    title: "Background Jobs",
    level: "intermediate",
    description: "Run work outside the normal request/response cycle, so users don't wait for slow tasks to finish.",
    explanation: `
Some work doesn't fit in the short window of a single request. Sending
a confirmation email, resizing an image, generating a large report, or
a nightly cleanup can take seconds, minutes, or longer. That's far too
long for a user to stare at a spinner.

**Background jobs** run outside the normal request/response cycle. The
server quickly acknowledges the request and hands the slow work off to
run separately:

- right away in the background,
- on a **queue** processed by separate worker processes, or
- later on a **schedule** (like "every night at 2 AM").
    `.trim(),
    analogy:
      "A restaurant doesn't make you stand at the counter until your food is ready. It takes your order, hands you a buzzer, and the kitchen (a background worker) cooks while you sit. You get an immediate 'order received' without waiting on the slower work.",
    examples: [
      {
        title: "Handing off slow work to a queue",
        code: `app.post("/signup", async (req, res) => {
  const user = await createUser(req.body);

  // Instead of sending the email right here and making the user wait...
  await emailQueue.add("welcome-email", { userId: user.id });

  res.status(201).json({ ok: true }); // responds immediately
});

// Elsewhere: a separate worker process consumes the queue
emailQueue.process("welcome-email", async (job) => {
  const user = await db.users.findById(job.data.userId);
  await sendEmail(user.email, "Welcome!");
});`,
        explanation: "The handler stays fast because it only enqueues the job. The slow email sending happens in a separate worker process, so the user never waits for it.",
        walkthrough: [
          { code: 'await emailQueue.add("welcome-email", { userId: user.id });', explanation: "Puts a small description of the work on a queue almost instantly. It doesn't send the email itself." },
          { code: "res.status(201).json({ ok: true });", explanation: "The response goes out right away, since the slow part was handed off." },
          { code: 'emailQueue.process("welcome-email", async (job) => {', explanation: "A separate worker, independent of the web server, picks up queued jobs and does the slow work when it gets to them." },
        ],
      },
      {
        title: "A scheduled background job",
        code: `const cron = require("node-cron");

// Runs automatically every day at 2:00 AM, with no request involved at all
cron.schedule("0 2 * * *", async () => {
  await deleteExpiredSessions();
  logger.info("cleanup_complete");
});`,
        explanation: "No user request triggers this job. It runs on a fixed schedule, independent of the request/response cycle.",
      },
    ],
    howItWorks: `
Instead of doing slow work inline, the request handler records that the
work needs doing, often by pushing a small message describing the job
onto a **queue** (backed by something like Redis). Then it responds
right away.

One or more separate **worker** processes watch the queue, pick up jobs
as they arrive, and do the work, independent of any web request.
Scheduled jobs are similar but are triggered by a timer (a cron
schedule) instead of an event, so they run whether or not any request
happens.
    `.trim(),
    whyItExists: `
If every request had to finish all related work before responding, slow
operations would make the app feel unresponsive. A spike in slow work
(like a burst of signups all needing welcome emails) could overwhelm the
web server itself.

Background jobs separate "acknowledge the request quickly" from "get the
slow work done." That work can then be scaled, retried, and monitored
separately from the web servers handling live traffic.
    `.trim(),
    whenToUse: `
Use background jobs for anything slow, not needed for the immediate
response, or safe to retry: sending emails, processing images,
generating reports, syncing with third-party services, or recurring
scheduled maintenance.
    `.trim(),
    whenNotToUse: `
If you need the result before you can respond meaningfully, do the work
inline. For example, a login endpoint must confirm the password matches
before saying 'success'.
    `.trim(),
    commonMistakes: [
      "Putting time-sensitive work (like checking a password) into a background job when the request can't respond correctly without its result.",
      "Not handling job failures. A job that fails silently with no retry or alert quietly drops real work, like an email that's never sent.",
      "Assuming a job that worked once always will, without planning retries for when a dependency (like an email provider) is briefly down.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Decide which of these belongs in a background job and which inline in a request: validating a login password, sending a password-reset email, resizing a profile photo." },
      { difficulty: "Medium", prompt: "Sketch a signup endpoint that enqueues a welcome email job instead of sending the email inline, and explain why that keeps the endpoint fast." },
      { difficulty: "Hard", prompt: "Describe what should happen if a job that sends a confirmation email fails partway through, and how you'd make sure the email still gets sent eventually." },
    ],
    interviewQuestions: [
      { question: "What is a background job and why would you use one?", answer: "Work done outside the normal request/response cycle. It's used for slow or non-essential tasks so the user doesn't wait for them before getting a response." },
      { question: "What's the difference between a queued job and a scheduled job?", answer: "A queued job is triggered by an event (like a signup) and processed by a worker as soon as possible. A scheduled job runs automatically on a fixed timer, independent of any request." },
      { question: "Why shouldn't login password verification be handled as a background job?", answer: "The request needs the result right away to decide how to respond. Deferring it would leave the server unable to tell the user whether login succeeded." },
      { question: "Why does a job queue typically need a separate worker process rather than running jobs inside the same process that handles web requests?", answer: "Slow jobs in the same process would compete with incoming HTTP requests for CPU and memory, defeating the point of offloading. A separate worker can be scaled, deployed, and monitored independently of the web servers." },
      { question: "What happens to a queued job if the worker processing it crashes partway through?", answer: "A well-configured queue only marks a job done after the worker confirms success. A crash leaves the job unacknowledged, so it becomes available for another worker to retry instead of being silently lost." },
      { question: "Why does a background job need to tolerate being run more than once, i.e. be idempotent, given retry behavior?", answer: "A queue can redeliver a job that seems to have failed, e.g. if a worker crashes right after finishing but before acknowledging. So a job may run twice. An idempotent job checks whether its effect already happened, so it gives the same correct result either way, instead of double-charging a card or sending a duplicate email." },
      { question: "What's a dead-letter queue, and why is it useful?", answer: "A separate place a job moves to after failing past a retry limit, instead of retrying forever or being dropped. The team can inspect and handle stuck jobs by hand, without endless retries eating worker capacity." },
      { question: "Why use exponential backoff between retries of a failed background job instead of retrying immediately and repeatedly?", answer: "If a dependency is overloaded or down, instant repeated retries add load when it can least handle it. Spacing retries out with growing delays gives it time to recover and makes it less likely the retries worsen the outage." },
      { question: "What's the difference between a job queue backed by Redis, like BullMQ, and one backed by a relational database table?", answer: "A Redis-backed queue is usually faster and comes with delayed jobs, priorities, and retries built in. A database-table queue needs no new infrastructure if you already use a relational database, but it's usually slower and you implement more of the queue logic yourself." },
      { question: "Why is it important to monitor background job failure rates separately from the web server's own error rate?", answer: "A failed job produces no HTTP error anyone notices, since the user already got a success response. Without separate monitoring of the job system, a job that always fails could go unnoticed indefinitely." },
      { question: "How could a cron-scheduled job unintentionally run more than once at the same scheduled time?", answer: "If several app instances each run their own in-process scheduler, each fires the same cron job at the same time, duplicating work meant to happen once. Guard against it with a distributed lock or by running the scheduler on one designated instance." },
      { question: "Why does image resizing make sense as a background job, but validating a signup form's fields typically doesn't?", answer: "Resizing is slow and its result isn't needed to respond, so the response can say 'upload received' right away. Validation decides whether the request succeeds at all, so the caller needs that result before any response." },
      { question: "What does a job typically carry on a queue, versus what the worker does with it?", answer: "The job usually carries just enough to identify the work, like an id and a job type, not the full state. The worker uses that id to fetch current data when it runs, instead of trusting possibly stale data captured earlier." },
      { question: "Why might a background job re-fetch data from the database at the time it runs, instead of using the data captured when it was enqueued?", answer: "Time can pass between queueing and processing. Re-fetching means the job acts on current state (e.g. confirming the user hasn't deleted their account since), not a stale snapshot." },
      { question: "What's a concurrency limit on a worker, and why would you configure one?", answer: "The maximum number of jobs a worker runs at once. It stops a burst of jobs from overwhelming a limited resource, like memory, CPU, or a downstream API's rate limit, by controlling how much runs in parallel." },
      { question: "Why does a worker process need to handle graceful shutdown — finishing or safely stopping in-progress jobs before exiting — during a deployment?", answer: "A worker killed mid-job during a deploy or restart can leave the job half-done or lost, depending on the queue's guarantees. Handling shutdown signals to finish or cleanly abandon in-progress work, so it can be retried later, avoids that during routine deploys." },
    ],
    prerequisites: ["logging"],
    relatedTopics: ["logging", "deployment-and-cicd"],
    keywords: ["background jobs", "queue", "worker", "cron", "async processing"],
  },
  {
    id: "connecting-to-a-database",
    title: "Connecting to a Database",
    level: "intermediate",
    description: "The ways backend code talks to a database (raw drivers, query builders, and ORMs) and how a connection is made.",
    explanation: `
Your app and your database are separate programs. They talk over a
network connection (even on the same machine), using a **connection
string** with everything needed to reach the database: host, port,
username, password, and database name. For example:
\`postgres://user:pass@localhost:5432/mydb\`.

On top of that connection, you choose how directly you write SQL:

- A **driver** (like \`pg\` in Node or \`psycopg2\` in Python) sends SQL strings and returns rows. Full control.
- A **query builder** (like Knex, or SQLAlchemy Core) builds queries with function calls that still map closely to SQL.
- An **ORM** (like Prisma, Sequelize, or SQLAlchemy's ORM layer) lets you work with rows as objects and generates the SQL for you.
    `.trim(),
    analogy:
      "A raw driver is like talking to a bank teller in exact banking terms. A query builder is like filling in a structured form that asks for the same details. An ORM is like the bank's app: you tap 'send money' and it handles the paperwork. Convenient, but you control less of what happens.",
    examples: [
      {
        title: "A connection string and a raw query",
        code: `const { Pool } = require("pg");

// postgres://user:password@localhost:5432/mydb
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const result = await pool.query(
  "SELECT * FROM users WHERE id = $1",
  [userId]
);
console.log(result.rows);`,
        explanation: "The connection string tells the driver where and how to connect. The query is plain SQL, with $1 as a safe placeholder for the value.",
        walkthrough: [
          { code: "new Pool({ connectionString: ... })", explanation: "Opens and manages the network connection(s) to the database, with credentials from an environment variable, not hardcoded." },
          { code: 'pool.query("SELECT * FROM users WHERE id = $1", [userId])', explanation: "Sends the SQL and the value separately. The driver substitutes $1 safely, so you never build SQL by string concatenation." },
          { code: "result.rows", explanation: "The driver turns the database's raw response into plain JavaScript objects." },
        ],
      },
      {
        title: "The same query at three levels of abstraction",
        code: `// Raw driver
await pool.query("SELECT * FROM users WHERE active = $1", [true]);

// Query builder (Knex)
await knex("users").where({ active: true });

// ORM (Prisma)
await prisma.user.findMany({ where: { active: true } });`,
        explanation: "All three run equivalent SQL. They differ only in how much SQL you write by hand and how much the library generates.",
      },
      {
        title: "Full CRUD through a raw driver, inside route handlers",
        code: `// Create
app.post("/users", async (req, res) => {
  const result = await pool.query(
    "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
    [req.body.name, req.body.email]
  );
  res.status(201).json(result.rows[0]);
});

// Read
app.get("/users/:id", async (req, res) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "not found" });
  res.json(result.rows[0]);
});

// Update
app.put("/users/:id", async (req, res) => {
  const result = await pool.query(
    "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *",
    [req.body.name, req.body.email, req.params.id]
  );
  res.json(result.rows[0]);
});

// Delete
app.delete("/users/:id", async (req, res) => {
  await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
  res.status(204).end();
});`,
        explanation: "The four basic CRUD operations, each wired to the matching HTTP method and route. This is what 'connecting to a database' looks like end to end in a real API, not just one SELECT.",
        walkthrough: [
          { code: "INSERT INTO users (...) VALUES (...) RETURNING *", explanation: "RETURNING * returns the new row (including any auto-generated id) in the same round trip, so you don't need a second SELECT." },
          { code: 'if (result.rows.length === 0) return res.status(404)', explanation: "A SELECT that matches nothing isn't an error. It returns zero rows, so the route must check for that and respond." },
          { code: "UPDATE users SET ... WHERE id = $3 RETURNING *", explanation: "The WHERE clause limits the update to one row, and RETURNING * gives back the row after the change." },
        ],
      },
      {
        title: "Wrapping multiple queries in a transaction",
        code: `app.post("/transfer", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
      [req.body.amount, req.body.fromId]
    );
    await client.query(
      "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
      [req.body.amount, req.body.toId]
    );
    await client.query("COMMIT");
    res.status(204).end();
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});`,
        explanation: "A money transfer needs both updates to happen together or not at all. This checks out one dedicated connection from the pool, runs both queries as one transaction, and rolls back entirely if either fails. Money can't leave one account without arriving in the other.",
        walkthrough: [
          { code: "const client = await pool.connect();", explanation: "A transaction must run on one specific connection, not 'the pool' in general. Every query in it uses this same checked-out client." },
          { code: 'await client.query("BEGIN");', explanation: "Starts the transaction. Nothing that follows is permanent until COMMIT runs." },
          { code: 'catch (err) { await client.query("ROLLBACK"); ... }', explanation: "If anything throws partway through, ROLLBACK undoes every change since BEGIN, leaving both accounts as they were." },
          { code: "client.release();", explanation: "Always returns the connection to the pool, whether the transaction succeeded or failed. Otherwise pooled connections quietly leak away." },
        ],
      },
    ],
    howItWorks: `
The app reads connection details (usually from an environment variable,
never hardcoded) and passes them to a driver. The driver opens a TCP
connection to the database and authenticates. Real apps don't open a
new connection per query. They keep a small pool of open connections to
reuse (see connection pooling).

A query builder or ORM sits on top of that same driver. In the end,
everything becomes SQL text sent over the connection. The abstraction
only decides how much SQL you write and how much it generates.
    `.trim(),
    whyItExists: `
A database speaks its own wire protocol, not JavaScript or Python.
Without a driver to translate between your language's data types and
that protocol, your code couldn't talk to it at all.

Query builders and ORMs add productivity on top: they generate
repetitive SQL, map rows to familiar objects, and provide tools like
migrations that a raw driver doesn't include.
    `.trim(),
    whenToUse: `
- **Raw driver:** when you need full control, or run a few simple, performance-sensitive queries.
- **Query builder:** when you want dynamic, composable queries that are safer than hand-built SQL strings.
- **ORM:** for typical CRUD-heavy apps, where models, relations, and built-in migrations are worth giving up some fine-grained SQL control.
    `.trim(),
    whenNotToUse: `
Don't force complex analytical or reporting queries through an ORM's
query API. It often produces slower, harder-to-read SQL than writing it
yourself, and most ORMs let you drop down to raw SQL for exactly this.
For a tiny script with one or two queries, a full ORM is usually more
setup than the task needs.
    `.trim(),
    commonMistakes: [
      "Hardcoding database credentials in source code instead of reading them from environment variables.",
      "Building SQL by concatenating strings with user input, which opens the door to SQL injection, instead of using parameterized placeholders.",
      "Opening a new database connection for every request instead of reusing a pool. It's slow and can exhaust the database's connection limit under load.",
      "Forgetting to call client.release() after a transaction in every code path, including failures. This leaks a connection from the pool until it runs dry.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Break the connection string postgres://app:secret@db.internal:5432/orders into its host, port, user, password, and database name." },
      { difficulty: "Medium", prompt: "Rewrite this unsafe query to use a parameterized placeholder instead of string concatenation: db.query(\"SELECT * FROM users WHERE email = '\" + email + \"'\")." },
      { difficulty: "Hard", prompt: "Explain what would go wrong, and why, if every HTTP request opened and closed its own database connection instead of borrowing one from a pool." },
    ],
    interviewQuestions: [
      { question: "What's the difference between a database driver, a query builder, and an ORM?", answer: "A driver sends raw SQL and returns rows, with no abstraction. A query builder builds SQL through function calls that still map closely to it. An ORM maps rows to objects and generates the SQL for you, trading some control for productivity." },
      { question: "What does a database connection string typically contain?", answer: "The protocol, host, port, username, password, and database name needed to connect." },
      { question: "Why should database queries use parameterized placeholders instead of string concatenation?", answer: "To prevent SQL injection. The driver substitutes values safely instead of treating attacker-controlled input as part of the SQL." },
      { question: "What is connection pooling, and why is it used instead of opening a new connection per request?", answer: "A pool keeps a set of open database connections ready to reuse. Opening a TCP connection and authenticating for every request is slow and, under load, can exhaust the database's connection limit. Borrowing a connection and returning it avoids both costs." },
      { question: "What determines an appropriate pool size for an application?", answer: "A balance between the app's expected concurrency and the database's connection limit, which is shared with every other service using it. Too small, and requests queue for a free connection under load. Too large, and you risk exhausting the database's capacity, especially with several app instances each running their own pool." },
      { question: "Why does `pool.query()` work fine for single, independent queries but not for a transaction spanning multiple queries?", answer: "`pool.query()` borrows any free connection for one call and returns it right after. BEGIN/COMMIT are connection-scoped, so every statement in a transaction must run on the same connection. You check out one client with `pool.connect()` and reuse it for the whole transaction." },
      { question: "What are the four ACID properties a transaction is meant to provide?", answer: "Atomicity: all operations succeed together or none do. Consistency: the database moves from one valid state to another, respecting its constraints. Isolation: concurrent transactions don't see each other's uncommitted changes. Durability: once committed, a change survives even a crash right after." },
      { question: "What does ROLLBACK actually undo, and what does it leave unaffected?", answer: "It undoes every change since the matching BEGIN in that transaction. It doesn't affect transactions committed before, or anything outside the database, like an email already sent by the same request." },
      { question: "Why is forgetting `client.release()` in every code path, including a thrown error, a serious bug rather than a minor cleanup oversight?", answer: "A client checked out with `pool.connect()` and never released stays unavailable forever. Repeated leaks shrink the pool until no connections remain, and every request that needs one hangs or times out. It usually shows up much later and far from the code that caused it." },
      { question: "Why is `client.release()` typically placed in a `finally` block rather than just at the end of the `try`?", answer: "`finally` runs whether the try succeeds or throws, so the connection always goes back to the pool. At the end of try, it would be skipped whenever an error occurs." },
      { question: "What's a deadlock in the context of database transactions, and how can it happen with two concurrent transfers?", answer: "Two transactions each hold a lock the other needs and both wait. E.g. transaction A locks account 1 then tries account 2, while B locks account 2 then tries account 1. Neither can proceed, so the database usually detects this and aborts one so the other can continue." },
      { question: "How would you reduce the risk of that kind of deadlock between two concurrent transfers?", answer: "Acquire locks (e.g. update rows) in the same agreed order in every transaction, such as always locking the lower account id first, whichever is sender or receiver. Then two transactions can never wait on each other in a circle." },
      { question: "What is the N+1 query problem, and how does it commonly happen when using an ORM?", answer: "You fetch a list of N records, then run a separate query per record for related data, like each order's customer. That's 1 + N queries instead of a couple. It often happens by accident with ORM lazy loading, where touching a relation inside a loop quietly runs a new query each time." },
      { question: "How do ORMs typically let you avoid the N+1 problem?", answer: "Eager loading. You tell the ORM up front to fetch the related data in the same query, or one extra batched query, with something like `.include()`, instead of a lazy query per access." },
      { question: "What's the difference between an ORM's lazy loading and eager loading for a related record?", answer: "Lazy loading fetches a related record only when code accesses it. It defers the query but risks N+1 in a loop. Eager loading fetches related data up front with the original query, trading one possibly larger query for many small ones later." },
      { question: "What's a database migration, and why do ORMs typically include tooling for them?", answer: "A versioned, incremental schema change, like adding a column, applied in order so every environment's schema matches what the code expects. ORMs include tooling because schema changes must happen safely alongside code changes, and tracking raw ALTER TABLE scripts by hand across environments is error-prone." },
      { question: "Why is a database index useful, and what's the tradeoff of adding one?", answer: "An index lets the database find matching rows without scanning the whole table, which speeds up reads on large tables a lot. The tradeoff: every index must be updated on each INSERT/UPDATE/DELETE of the indexed column, so more indexes mean slower writes and more storage." },
      { question: "What's a prepared statement, and how does it relate to preventing SQL injection?", answer: "The SQL structure and the parameter values are sent separately. The database compiles the template once and substitutes values strictly as data, never as SQL syntax. That's why placeholders like `$1` are immune to injection and string concatenation isn't." },
      { question: "Why can't a column name or table name be parameterized the same way as a value, like `$1`?", answer: "Placeholders like `$1` are only allowed where the SQL grammar expects a value, not an identifier like a column or table name. A dynamic identifier, such as a user-chosen sort column, must be checked against an allow-list of known-safe names instead." },
      { question: "Give an example of an app that uses parameterized queries but is still vulnerable to SQL injection.", answer: "One that concatenates a user-supplied string into an ORDER BY clause or dynamic sort column, since placeholders can't parameterize identifiers. The WHERE clause uses `$1` safely, but that one concatenated fragment still lets an attacker inject arbitrary SQL." },
      { question: "What's the difference between a foreign key constraint and just remembering an id in application code without one?", answer: "The database enforces a foreign key. It refuses to insert a row pointing to a missing parent, and refuses to delete a parent that's still referenced unless a cascade is set. Relying only on app code leaves consistency open to bugs, direct database edits, or another service bypassing the app." },
      { question: "What does `ON DELETE CASCADE` do on a foreign key, and what's a risk of using it without thinking it through?", answer: "It deletes dependent rows automatically when the parent is deleted, e.g. deleting a user also deletes their orders. The risk: one delete can silently cascade through much more data than intended, especially several relationships deep, with no confirmation of what it removes." },
      { question: "What's the difference between optimistic and pessimistic locking when two requests might update the same row concurrently?", answer: "Pessimistic locking takes a real database lock on the row before reading it, like `SELECT ... FOR UPDATE`, blocking other transactions until it finishes. Optimistic locking reads a version number or timestamp, and the update only succeeds if it hasn't changed since; otherwise it fails and the caller retries. It trades upfront blocking for detecting conflicts afterward." },
      { question: "Why might an ORM's default behavior of committing each save or query as its own separate transaction be insufficient for a multi-step operation?", answer: "If both steps must succeed or fail together, like moving money between two records, committing each step separately means a failure partway through leaves the operation half-done. You have to tell the ORM explicitly to wrap the whole sequence in one transaction." },
      { question: "What's a connection timeout, and why does a pool need one?", answer: "A limit on how long to wait for a free connection, or for the database to respond, before raising an error instead of hanging. Without one, a request waiting on a connection could tie up server resources forever if none is ever freed." },
      { question: "Why isn't retry logic for a failed database query something you'd blindly apply to every query?", answer: "Retrying is only safe for read-only or idempotent operations. A write may have succeeded on the database but failed to acknowledge because of a network blip. Retrying it can apply it twice, like a duplicate INSERT." },
      { question: "Why would a health-check endpoint run a trivial query, like SELECT 1, against the database rather than just returning 200 OK unconditionally?", answer: "It checks that the app can actually reach and use the database right now, not just that the web process is alive. A server that lost its database connection or exhausted its pool would otherwise report healthy while every real request fails." },
      { question: "Why should you close or drain a connection pool gracefully during app shutdown, rather than letting the process exit abruptly?", answer: "An abrupt exit can cut off in-flight queries or transactions, and the database may treat those connections as open until it notices they're gone. Ending the pool explicitly lets in-flight work finish (or stop cleanly) and closes connections properly, freeing them on the database right away." },
      { question: "What's the tradeoff between choosing a UUID versus an auto-incrementing integer as a primary key, from a database-connection perspective?", answer: "An auto-incrementing integer is smaller and slightly faster to index and join, but reveals roughly how many rows exist and can collide if generated in two places. A UUID is larger and a bit slower to index, but the app can generate it safely before inserting, with no round trip to get an id." },
      { question: "How does a query builder like Knex offer more safety against SQL injection than hand-built string concatenation, while still allowing dynamic queries?", answer: "It builds the parameterized query from function calls like `.where({ active: true })`, using placeholders for every value you pass. You can build conditions in code without ever concatenating a value into the SQL string." },
      { question: "What's a downside of letting an ORM generate the SQL for a complex reporting or analytical query, compared to writing that SQL directly?", answer: "ORM query APIs are designed for common CRUD patterns. For something like a multi-table aggregation with custom grouping, they may generate needlessly complex, slow, or hard-to-read SQL. Most ORMs let you drop to raw SQL for these cases." },
      { question: "What does `RETURNING *` save you from having to do after an INSERT?", answer: "A second SELECT. Without it, getting the new row's full data, including any auto-generated id, needs a separate query. `RETURNING *` returns the row in the same round trip." },
      { question: "Why can't every incoming HTTP request simply open and close its own fresh database connection instead of using a pool?", answer: "Opening a TCP connection and authenticating has real overhead, and doing it per request repeats that cost every time. Databases also cap total simultaneous connections, and a busy app opening one per concurrent request can easily hit that cap, so new connections, and requests, start failing." },
      { question: "What's a read replica, and what kind of query would you route to one instead of the primary database?", answer: "A copy of the database kept continuously updated from the primary and used to serve read-only queries, taking read load off the primary. Route SELECT-only queries that can tolerate slightly stale data to it. All writes still go to the primary." },
    ],
    prerequisites: ["env-vars-and-config"],
    relatedTopics: ["env-vars-and-config", "error-handling-apis"],
    keywords: ["database driver", "connection string", "query builder", "ORM", "pg", "psycopg2", "SQL injection", "parameterized queries"],
  },
  {
    id: "python-web-frameworks",
    title: "FastAPI & Python Web Frameworks",
    level: "intermediate",
    description: "How routing and middleware look in Python, using FastAPI, a modern async, type-driven framework.",
    explanation: `
Routing, middleware, and the request/response lifecycle aren't specific
to Node.js or Express. They're how backend frameworks work in general.
In Python, Flask and Django are the older, synchronous-first options.
**FastAPI** is a newer framework built around type hints and
\`async\`/\`await\`.

FastAPI's key feature: ordinary type hints do double duty. A
**Pydantic** model describing a request body validates incoming data
(rejecting mismatches with a clear error) *and* generates interactive
API docs. You don't write either by hand.
    `.trim(),
    analogy:
      "It's the same directory board from routing, installed in a different building. The idea (map a method and path to a function) is identical. Only the syntax and a few conveniences differ.",
    examples: [
      {
        title: "A route with a path parameter and a request body",
        code: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.get("/items/{item_id}")
async def get_item(item_id: int):
    return {"item_id": item_id}

@app.post("/items")
async def create_item(item: Item):
    return {"created": item.name, "price": item.price}`,
        language: "python",
        explanation: "Declaring item_id: int makes FastAPI convert and validate it. The Item Pydantic model does the same for the whole body, rejecting requests missing name or price with a 422 error before your function runs.",
        walkthrough: [
          { code: '@app.get("/items/{item_id}")', explanation: "A decorator-based route, like app.get(\"/items/:id\", ...) in Express. {item_id} is a path parameter." },
          { code: "async def get_item(item_id: int):", explanation: "The int type hint isn't just documentation. FastAPI validates and converts the path segment, and returns an error if it isn't a valid integer." },
          { code: "class Item(BaseModel): ...", explanation: "A Pydantic model describing the expected request body. The same declaration powers the generated /docs page." },
        ],
      },
      {
        title: "Dependencies — FastAPI's take on shared, cross-cutting logic",
        code: `from fastapi import Depends, FastAPI, HTTPException

app = FastAPI()

def get_current_user(token: str):
    if token != "valid-token":
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"user": "alice"}

@app.get("/profile")
async def profile(user: dict = Depends(get_current_user)):
    return user`,
        language: "python",
        explanation: "Depends() is FastAPI's answer to Express middleware for things like auth checks. Instead of running before the handler in a chain, it's declared as a parameter the handler needs, and FastAPI resolves it before calling the route.",
      },
      {
        title: "Real middleware — running for every request, unconditionally",
        code: `import time
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    response.headers["X-Process-Time"] = str(duration)
    return response`,
        language: "python",
        explanation: "This is FastAPI's real middleware, closer to Express's (req, res, next) chain than Depends() is. It runs for every request, whichever route matches. call_next(request) works like next() in Express: it passes control on and lets you act again once the response comes back.",
      },
    ],
    howItWorks: `
FastAPI is built on **Starlette** for the async web layer (an ASGI
application, run by a server like Uvicorn) and **Pydantic** for data
validation.

When a request arrives, FastAPI matches the path to a decorated
function. It uses the function's type hints and Pydantic models to
validate and parse path parameters, query strings, and the body before
calling your function. Then it serializes whatever you return to JSON.
The same type hints generate an OpenAPI schema, which powers the
interactive docs at \`/docs\`.
    `.trim(),
    whyItExists: `
Flask and Django predate widespread async support in Python, and you
write validation by hand. FastAPI brings Node-style non-blocking I/O to
Python. It uses type hints, which Python developers already write, to
remove most of the boilerplate for validating requests and documenting
an API.
    `.trim(),
    whenToUse: `
FastAPI is a strong choice for teams already using Python (common
alongside data or ML work) that want async performance, strict request
validation, and free interactive API docs without extra tooling.
    `.trim(),
    whenNotToUse: `
If the team and its libraries are committed to Node, or the app is a
simple, mostly synchronous CRUD site where Flask or Django's simpler,
batteries-included conventions are enough, FastAPI's async model and
Pydantic layer add needless complexity.
    `.trim(),
    commonMistakes: [
      "Calling a blocking library (like an old synchronous database driver) inside an async def route instead of awaiting an async-compatible alternative. It stalls the whole event loop for every other concurrent request.",
      "Skipping Pydantic models and accepting a raw, untyped body, which loses both automatic validation and the generated docs.",
      "Treating Depends() as identical to Express middleware. It's closer to an injectable parameter the handler asks for than a step that always runs before the handler in a fixed chain.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write the FastAPI equivalent of an Express route: GET /ping returning {\"status\": \"ok\"}." },
      { difficulty: "Medium", prompt: "Define a Pydantic model CreateUser with a name (str) and age (int), and a POST /users route that accepts it and returns the values." },
      { difficulty: "Hard", prompt: "Explain why a blocking, synchronous database call inside an async def route can slow down every other concurrent request in FastAPI, not just the one making the call." },
    ],
    interviewQuestions: [
      { question: "What is FastAPI built on?", answer: "Starlette (an ASGI framework) for the async web layer, and Pydantic for data validation and serialization." },
      { question: "How does FastAPI generate interactive API documentation automatically?", answer: "It builds an OpenAPI schema from the same type hints and Pydantic models it uses for validation, and serves an interactive UI from that schema at /docs." },
      { question: "What's the risk of a blocking call inside an async route handler?", answer: "It holds the single event loop thread and delays every other concurrent request, just as a CPU-heavy synchronous operation blocks Node.js." },
      { question: "What's the difference between Flask/Django and FastAPI in terms of built-in async support?", answer: "Flask and Django came before async/await was standard in Python and are synchronous-first. FastAPI was built around ASGI and async/await from the start, so async request handling is native, not an add-on." },
      { question: "What is ASGI, and how does it differ from WSGI, which Flask and Django traditionally use?", answer: "WSGI is a synchronous interface between Python web apps and servers, handling one request at a time per worker. ASGI adds async/await and long-lived connections like WebSockets, so one worker can handle many concurrent requests without blocking on I/O." },
      { question: "What does declaring a path parameter as `item_id: int` actually cause FastAPI to do, beyond documentation?", answer: "FastAPI converts the incoming string segment to a Python int before calling the route, and returns a 422 error if it can't. The type hint is enforced, not just a comment." },
      { question: "What is a Pydantic model, and what two things does defining one for a request body give you at once?", answer: "A Python class declaring expected fields and types. As a request body parameter, it validates and parses incoming JSON against that shape (rejecting mismatches with a 422), and the same declaration feeds the generated OpenAPI docs." },
      { question: "What's the difference between `Depends()` and Express-style middleware, conceptually?", answer: "Express middleware runs in a fixed chain before every matching route, whatever that route needs. `Depends()` is a parameter a specific route asks for, and FastAPI resolves only the dependencies that route declares. It's closer to dependency injection than a universal pipeline stage." },
      { question: "How does FastAPI's real `@app.middleware(\"http\")` differ from `Depends()`?", answer: "It runs for every request regardless of route, and wraps the next stage via `call_next(request)`, so it can act before and after the response. That's much closer to Express's (req, res, next) chain. Depends() only applies to routes that declare it." },
      { question: "What does declaring a route function `async def` do if the code inside never actually uses `await`?", answer: "Nothing useful by itself. It doesn't make the route non-blocking. Any synchronous, blocking work inside still ties up the event loop as if it weren't async." },
      { question: "Why can a single blocking, non-async database call inside an `async def` route stall other, unrelated concurrent requests in FastAPI?", answer: "Each worker runs one event loop that switches between requests only at await points. A blocking call has no await point and runs to completion on that thread, so the loop can't serve any other request until it finishes." },
      { question: "What's one way to run a genuinely blocking library inside a FastAPI route without stalling the event loop?", answer: "Run it in a thread pool with something like `run_in_threadpool` or `asyncio.to_thread`. The blocking call runs off the event loop thread, and the route awaits its result without freezing other requests." },
      { question: "What HTTP status code does FastAPI return by default when a request body fails Pydantic validation, and why that code specifically?", answer: "422 Unprocessable Entity. The request is valid HTTP/JSON (so not a malformed 400), but its content breaks the endpoint's rules, which is exactly what 422 means." },
      { question: "How would you raise a custom error response, like a 404, from inside a FastAPI route function?", answer: "Raise `HTTPException(status_code=404, detail=\"...\")`. FastAPI catches this exception type and turns it into the matching HTTP response, with no central middleware needed." },
      { question: "Why might a dependency declared with `Depends()` be reused across multiple different routes?", answer: "It's a regular Python callable, so one function like `get_current_user` can be declared by any number of routes without duplicating it. FastAPI resolves it separately for each route that asks for it." },
      { question: "What's a benefit of typing a query parameter, e.g. `q: str | None = None`, rather than manually reading `request.query_params`?", answer: "FastAPI parses, validates, and converts it by type, applies the default when it's missing, and includes it in the docs. Reading request.query_params means writing that conversion, default handling, and validation yourself." },
      { question: "What's the relationship between a FastAPI `APIRouter` and the main `app`, when a project splits routes into separate files?", answer: "An APIRouter defines a group of related routes in a separate module, which you attach to the main app with `app.include_router(...)`. It's like mounting a sub-router in Express, and keeps every route out of the main app file." },
      { question: "Why might a team choose Flask or Django over FastAPI for a simple, mostly synchronous CRUD app?", answer: "Their simpler, batteries-included, synchronous conventions are enough. FastAPI's async model and Pydantic validation layer would add complexity with no matching benefit if the app never needs high concurrency or that kind of request validation." },
    ],
    prerequisites: ["servers-and-web-frameworks", "routing"],
    relatedTopics: ["servers-and-web-frameworks", "routing", "middleware", "validation-and-sanitization"],
    keywords: ["FastAPI", "Python", "Pydantic", "ASGI", "Starlette", "async", "Flask", "Django", "Uvicorn"],
  },
  {
    id: "authentication-and-passwords",
    title: "Authentication & Password Hashing",
    level: "intermediate",
    description: "How a backend verifies who's making a request, without storing raw passwords, and keeps recognizing a logged-in user on later requests.",
    explanation: `
A backend often needs to know "who sent this request, and are they
allowed to do this?" **Authentication** is proving identity, usually by
checking a password at login.

The most important rule: **never store a user's actual password.**
Store a **hash** instead: the output of a one-way function (like bcrypt
or argon2) that scrambles the password so it can't be reversed, even if
the whole database leaks. At login, you hash the submitted password the
same way and compare the two *hashes*. The plaintext password is never
stored or compared directly.

HTTP doesn't remember anything between requests, so after login the
backend needs a way to keep recognizing the user:

- a **session**: the server remembers who's logged in and gives the browser a cookie holding just an id to look it up, or
- a **token** like a JWT: a small, signed packet of data the client holds and resends, which the server can verify without storing anything.
    `.trim(),
    analogy:
      "Hashing a password is like a paper shredder: you get confetti out, and you can't feed it back in to rebuild the page. To check a password later, you shred the newly typed one the same way and compare the confetti. You never keep the original page.",
    examples: [
      {
        title: "Hashing on signup, comparing on login (bcrypt)",
        code: `const bcrypt = require("bcrypt");

// Signup: hash before storing anything
const passwordHash = await bcrypt.hash(plainPassword, 10);
await pool.query(
  "INSERT INTO users (email, password_hash) VALUES ($1, $2)",
  [email, passwordHash]
);

// Login: compare against the stored hash
const user = await findUserByEmail(email);
const isValid = user && (await bcrypt.compare(submittedPassword, user.password_hash));
if (!isValid) return res.status(401).json({ error: "invalid credentials" });`,
        explanation: "The plaintext password only exists briefly in memory. The database stores password_hash, never the password, and login compares hashes instead of 'unhashing' anything.",
        walkthrough: [
          { code: "bcrypt.hash(plainPassword, 10)", explanation: "Produces an irreversible, automatically salted hash. The 10 sets how expensive it is: deliberately slow, to resist brute-force guessing." },
          { code: "password_hash", explanation: "The only thing written to the database. Even a full database leak doesn't give away usable passwords." },
          { code: "bcrypt.compare(submittedPassword, user.password_hash)", explanation: "Hashes the submitted password the same way and checks for a match. The stored hash is never reversed." },
        ],
      },
      {
        title: "Protecting a route with an auth middleware",
        code: `function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token || !isValidToken(token)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  req.user = decodeToken(token);
  next();
}

app.get("/profile", requireAuth, (req, res) => {
  res.json(req.user);
});`,
        explanation: "This is the requireAuth middleware from the middleware topic. It runs before the route handler and only calls next() once it has confirmed who the caller is.",
      },
      {
        title: "The same idea in FastAPI — a dependency instead of middleware",
        code: `from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import OAuth2PasswordBearer
import jwt

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="invalid token")
    return payload

@app.get("/profile")
async def profile(user: dict = Depends(get_current_user)):
    return user`,
        language: "python",
        explanation: "OAuth2PasswordBearer tells FastAPI where to find the token (an Authorization: Bearer <token> header) and passes it to get_current_user, which decodes the JWT and verifies its signature. Same protection as requireAuth, written as a dependency instead of a middleware step.",
      },
    ],
    howItWorks: `
Password-hashing algorithms (bcrypt, scrypt, argon2) are deliberately
slow and mix a random **salt** into every password. Two users with the
same password get different hashes, so an attacker can't precompute one
shared table of hashes to crack many accounts at once (a "rainbow
table").

After login, there are two ways to stay recognized on later requests:

- A **session** stores the logged-in state on the server and gives the browser a cookie holding just an id to look it up.
- A **token** like a JWT carries the identity data itself, signed so the server can verify it wasn't tampered with, without storing anything server-side.
    `.trim(),
    whyItExists: `
If a database stored passwords directly, any breach, backup leak, or
careless insider would expose every user's real password at once. People
reuse passwords across sites, so the damage spreads beyond your app.
Hashing makes stored passwords useless to an attacker even if the whole
database is exposed.

Authentication as a whole exists because otherwise a server can't tell a
returning, legitimate user from anyone sending a similar request.
    `.trim(),
    whenToUse: `
Any system with real user accounts needs authentication. Hash wherever a
password is stored, and use a session or token wherever the backend must
keep recognizing a logged-in user across requests.
    `.trim(),
    whenNotToUse: `
Don't hand-roll password hashing or session handling for anything real.
Use a well-audited library (bcrypt, argon2) or a full auth
framework/service. Subtle cryptographic mistakes are easy to make and
very costly. Internal tools with no real user accounts may not need full
authentication at all.
    `.trim(),
    commonMistakes: [
      "Storing passwords in plaintext, or hashing them with a fast general-purpose hash (like MD5 or SHA-256) instead of a slow, purpose-built one like bcrypt.",
      "Hashing manually without a salt and comparing with simple equality, so identical passwords produce identical hashes and rainbow-table attacks work.",
      "Confusing authentication ('who are you?') with authorization ('what are you allowed to do?'). Being logged in doesn't mean access to every resource.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain why a database breach is far less damaging if passwords were hashed with bcrypt instead of stored as plaintext." },
      { difficulty: "Medium", prompt: "Write a signup and login flow using bcrypt.hash and bcrypt.compare, including the SQL to store and look up a user's password_hash." },
      { difficulty: "Hard", prompt: "Explain the difference between session-based and token-based (JWT) authentication, including exactly where the 'you're logged in' state lives in each." },
    ],
    interviewQuestions: [
      { question: "Why shouldn't passwords ever be stored in plaintext?", answer: "Anyone who gets into the database (through a breach, an insider, or a leaked backup) gets every user's real password at once. People reuse passwords, so the damage spreads beyond your app." },
      { question: "What's the difference between hashing and encryption for storing passwords?", answer: "Encryption is reversible with the right key. Hashing is designed to be irreversible, which is what you want for passwords: you only need to verify a match, never recover the original." },
      { question: "What's the difference between authentication and authorization?", answer: "Authentication confirms who a user is. Authorization decides what that authenticated user is allowed to do." },
      { question: "What is a salt, and what specific attack does it defeat that hashing alone doesn't?", answer: "Random data, unique per user, mixed into a password before hashing. Without it, users with the same password get identical hashes, so an attacker can precompute one table of hashes for common passwords (a rainbow table) and crack every matching account at once. A per-user salt makes each hash unique, so no precomputed table works." },
      { question: "With bcrypt, where is the salt actually stored, and why doesn't that make it useless?", answer: "It's embedded in the hash string itself, so no separate column is needed. That's safe because a salt doesn't need to be secret, only unique per password. It forces an attacker to redo the expensive hashing for each user instead of reusing one precomputed table." },
      { question: "What does the cost factor passed to bcrypt, like the 10 in `bcrypt.hash(password, 10)`, actually control?", answer: "How many times the algorithm iterates internally. Each increment roughly doubles the time per hash. A real login pays that cost once, but an attacker pays it for every guess, which makes large-scale guessing impractical." },
      { question: "Why can't you simply use a fast, general-purpose hash like SHA-256 for passwords, even though it's cryptographically secure?", answer: "SHA-256 is built to be fast, which is exactly wrong here. An attacker with a stolen hash can try billions of guesses per second on cheap hardware, especially GPUs. bcrypt, scrypt, and argon2 are deliberately slow and tunable to make brute-forcing expensive." },
      { question: "What's a pepper, and how does it differ from a salt?", answer: "A single secret value (a salt is per-user) applied to every password before hashing and kept outside the database, e.g. in an environment variable or secrets manager. A database leak alone then isn't enough to brute-force any password, since the attacker also needs the pepper." },
      { question: "How does `bcrypt.compare(submittedPassword, storedHash)` work without ever reversing the stored hash back into the original password?", answer: "It takes the salt embedded in storedHash, hashes submittedPassword with that salt and cost factor, and checks the two hash strings for equality. It compares two hashes; it never decrypts the stored one." },
      { question: "What's a timing attack in the context of comparing a submitted password's hash to a stored one, and how do hashing libraries defend against it?", answer: "A naive comparison stops at the first mismatched character, so its timing can leak how many leading characters were right. Good libraries use a constant-time comparison that takes the same time wherever, or whether, a mismatch occurs, so timing reveals nothing." },
      { question: "What are the three parts of a JWT, separated by dots, and what does each contain?", answer: "A header (token type and signing algorithm), a payload (claims like a user id and expiration), and a signature computed over the header and payload with a secret or private key. Written as header.payload.signature, each part base64url-encoded." },
      { question: "Is the payload of a JWT encrypted — can anyone read it just by decoding it?", answer: "No. A standard JWT payload is only base64url-encoded, so anyone holding the token can decode and read it. The signature proves the payload wasn't tampered with but doesn't hide it, so don't put sensitive data in a JWT payload." },
      { question: "What does verifying a JWT's signature actually protect against, if the payload itself isn't secret?", answer: "Tampering. If someone changes the payload, like a role claim from \"user\" to \"admin\", they can't compute a valid signature without the server's secret key. Verification recomputes the expected signature and rejects any token changed after issue." },
      { question: "What's the `alg: none` JWT vulnerability, and how is it typically prevented?", answer: "Some poorly written verification code trusted the token's own alg header, including \"none\" (no signature), and skipped verification. An attacker could craft a token with alg: none and any claims and have it accepted. The fix: the verifier specifies and enforces which algorithm it accepts, ignoring what the token claims." },
      { question: "Why is it a mistake to let JWT verification accept whatever algorithm the token specifies, rather than pinning to one expected algorithm?", answer: "An attacker can confuse asymmetric signing (like RS256, verified with a public key) with symmetric signing (like HS256, verified with a shared secret), e.g. getting a public key treated as an HMAC secret. A forged token is then accepted as valid. Requiring one known algorithm closes this off." },
      { question: "What claim in a JWT controls when it expires, and what happens if verification code forgets to check it?", answer: "The `exp` claim, a Unix timestamp. If it isn't checked, a token stays 'valid' forever, which defeats the point of expiration." },
      { question: "Why can't a JWT be 'logged out' or revoked the same simple way a session can?", answer: "A session is looked up on the server each request, so deleting its record invalidates it right away. A JWT is self-contained and checked only by its signature, with nothing to look up. Without a separate server-side revocation list, the server can't invalidate an issued token before it expires." },
      { question: "What's a common approach to work around the difficulty of revoking JWTs immediately?", answer: "Keep JWT lifetimes short (minutes, not days) and pair them with a longer-lived refresh token tracked server-side, which can be revoked. Revoking it stops new access tokens from being issued, though any already-issued short-lived token still works until it expires soon after." },
      { question: "What's a refresh token, and how does its lifecycle typically differ from an access token's?", answer: "A longer-lived credential, stored server-side so it can be revoked, used only to get a new short-lived access token when the old one expires. The access token goes with every API request. The refresh token is used rarely, so the more sensitive credential is sent less often." },
      { question: "What's the security tradeoff of storing a JWT in localStorage versus in an httpOnly cookie?", answer: "Any JavaScript on the page can read localStorage, so an XSS bug can steal the token. JavaScript can't read an httpOnly cookie, which protects against XSS. But the browser sends cookies automatically on matching requests, which opens a different risk, CSRF, needing its own defenses like a SameSite attribute or a CSRF token." },
      { question: "What is session fixation, and how does it differ from simply stealing a session cookie?", answer: "Instead of stealing a session, the attacker gets the victim to log in with a session id the attacker already knows (e.g. by pre-setting it before login). Once authenticated, the attacker uses that same id. The standard defense: generate a new session id at successful login, invalidating the old one." },
      { question: "Why should a login endpoint return the same generic error message whether the email doesn't exist or the password is wrong, rather than distinguishing the two?", answer: "Different messages for 'no such user' and 'wrong password' let an attacker find out which emails have accounts, one guess at a time. One generic message reveals nothing about which part was wrong." },
      { question: "Why should login attempts be rate-limited per account or per IP?", answer: "Without a limit, an attacker can automate unlimited password guesses. Rate limiting (locking out or slowing down after several failures) makes large-scale guessing impractical, on top of the per-guess cost the hashing algorithm already adds." },
      { question: "What's a secure way to implement a 'forgot password' flow, at a high level?", answer: "Generate a single-use, random, unguessable token unrelated to the password. Store its hash server-side with a short expiration, and email a link with the token to the account's address. Only allow a new password if a matching, unexpired token is presented. Never email the existing password; if you could, it wasn't properly hashed." },
      { question: "Why should a password-reset token be single-use and short-lived?", answer: "A token that works after use, or never expires, can take over the account indefinitely if it's ever intercepted, e.g. from a compromised email account or logged browser history. Single use and short expiry shrink the window an intercepted token would work." },
      { question: "What does multi-factor authentication add on top of a password, and why does it meaningfully raise security even if the password is compromised?", answer: "It requires a second, independent proof of identity, often a time-based one-time code from an authenticator app or a hardware key. A leaked or guessed password alone isn't enough. The attacker also needs the second factor, which the same breach usually doesn't expose." },
      { question: "Why is serving a login form and its endpoint only over HTTPS essential, regardless of how well passwords are hashed server-side?", answer: "Hashing only protects the stored password. Over plain HTTP, the submitted password, and any session cookie or token sent afterward, crosses the network unencrypted and can be read by anyone watching the traffic. HTTPS protects credentials in transit; hashing at rest doesn't." },
      { question: "What's the difference between authentication middleware reading a token from an Authorization: Bearer header versus from a cookie?", answer: "With a Bearer header, the client attaches the token to every request itself, which is common for non-browser API clients or SPAs managing their own tokens. A cookie is attached by the browser automatically, which is convenient but is exactly what enables CSRF unless mitigated." },
      { question: "In a `requireAuth` middleware pattern, why does it call `next()` only after successfully decoding the token, rather than always calling it?", answer: "Calling next() unconditionally would run the route whether or not the caller is authenticated. Calling it only after the token check passes means the protected handler never runs for an invalid request. A 401 is returned instead and the chain stops." },
      { question: "Why must the same secret, or key pair, used to sign a JWT also be available wherever it needs to be verified?", answer: "The verifier recomputes the expected signature with that secret or key and compares it to the token's signature. Without the right secret (or the matching public key for asymmetric signing), it can't confirm authenticity. So the secret needs protecting just like a password." },
      { question: "What's the practical effect of rotating the secret key used to sign JWTs?", answer: "Every existing token was signed with the old key. Once the app verifies only with the new key, all of them fail verification and are effectively invalidated. That's useful to force a universal logout after a suspected key leak, but it logs out every user at once, not just a targeted few." },
      { question: "Why does the column name `password_hash` matter beyond just being descriptive?", answer: "It helps prevent a costly mistake: writing or logging a raw `password` field in code that assumes the column holds the real password. The name makes it explicit everywhere that the stored value is a hash." },
      { question: "What's argon2's relationship to bcrypt, and why might a newer system choose it instead?", answer: "Argon2 is a newer password-hashing algorithm that won the 2015 Password Hashing Competition. Unlike bcrypt, it lets you tune memory use as well as compute cost, requiring lots of RAM per hash. That makes it more resistant to GPUs and custom hardware built for fast computation but not large memory." },
      { question: "Where does the boundary sit between what 'authentication' implementation covers, like hashing and JWTs, and the broader conceptual question of sessions vs. tokens as an architectural choice?", answer: "How passwords are hashed and verified, and how a JWT is structured, signed, and checked, are details of the login step itself. Whether to keep users recognized with server-side sessions or client-held tokens is a wider architectural tradeoff (statelessness, scaling, revocation) that goes beyond password login, and is covered in its own system-design topic." },
    ],
    prerequisites: ["middleware", "validation-and-sanitization"],
    relatedTopics: ["middleware", "error-handling-apis", "connecting-to-a-database", "python-web-frameworks"],
    keywords: ["authentication", "password hashing", "bcrypt", "JWT", "session", "authorization", "salt"],
  },
  {
    id: "fastapi-database-and-crud",
    title: "FastAPI Project Structure & Database CRUD",
    level: "intermediate",
    description: "How a real FastAPI project is split into files, connects to a database with SQLAlchemy, and exposes full CRUD endpoints.",
    explanation: `
One \`main.py\` is fine for a two-route demo. A real FastAPI project
splits the work across files, much like a layered Node.js app:

- \`database.py\` sets up the database connection.
- \`models.py\` defines the database tables as Python classes.
- \`schemas.py\` defines the Pydantic models for what the API accepts and returns.
- Router files group related endpoints.
- \`main.py\` wires it all together.

**SQLAlchemy** is Python's most common tool for working with a
relational database. Used as an ORM, it maps each row to a Python
object, like Prisma or Sequelize in Node.
    `.trim(),
    analogy:
      "It's the same layered kitchen from backend project structure, relabeled for Python: routers are the host seating guests, path functions are the server taking the order, and SQLAlchemy models are the pantry holding the ingredients.",
    examples: [
      {
        title: "Project layout and the database connection",
        code: `myapp/
├── main.py           # creates the app, includes routers
├── database.py        # engine + session setup
├── models.py           # SQLAlchemy table definitions
├── schemas.py          # Pydantic request/response shapes
└── routers/
    └── items.py         # /items endpoints

# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine("postgresql://user:password@localhost/mydb")
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()`,
        explanation: "get_db is a FastAPI dependency. Because it uses yield, FastAPI runs the code before the yield, hands the session to the route, then runs the code after the yield (closing it) when the request finishes, even if the route raised an error.",
        walkthrough: [
          { code: 'create_engine("postgresql://...")', explanation: "Sets up the connection from a connection string. It's SQLAlchemy's version of pg.Pool in Node." },
          { code: "SessionLocal = sessionmaker(bind=engine)", explanation: "A factory for scoped 'unit of work' sessions, instead of sharing one connection across unrelated requests." },
          { code: "def get_db(): ... yield db ... finally: db.close()", explanation: "Each request gets its own session, and it's always cleaned up afterward, success or failure." },
        ],
      },
      {
        title: "Full CRUD endpoints using that session",
        code: `# routers/items.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.post("/items", response_model=schemas.Item)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    db_item = models.Item(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/items/{item_id}", response_model=schemas.Item)
def read_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.put("/items/{item_id}", response_model=schemas.Item)
def update_item(item_id: int, updated: schemas.ItemCreate, db: Session = Depends(get_db)):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in updated.dict().items():
        setattr(item, key, value)
    db.commit()
    return item

@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db.query(models.Item).filter(models.Item.id == item_id).delete()
    db.commit()
    return {"deleted": item_id}`,
        language: "python",
        explanation: "The four CRUD operations (Create, Read, Update, Delete) written with SQLAlchemy's query API instead of raw SQL, each wired to its own route.",
      },
      {
        title: "Wrapping multiple changes in a transaction",
        code: `@router.post("/transfer")
def transfer(from_id: int, to_id: int, amount: int, db: Session = Depends(get_db)):
    try:
        sender = db.query(models.Account).filter(models.Account.id == from_id).one()
        receiver = db.query(models.Account).filter(models.Account.id == to_id).one()
        sender.balance -= amount
        receiver.balance += amount
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"status": "ok"}`,
        language: "python",
        explanation: "Both balance changes must succeed or fail together. Nothing is written until db.commit() runs. If anything raises before that, db.rollback() discards both pending changes, so the accounts are never half-updated.",
        walkthrough: [
          { code: "sender.balance -= amount", explanation: "SQLAlchemy tracks this change on the in-memory object, but doesn't write it yet. It stays pending until the session is committed." },
          { code: "db.commit()", explanation: "Where both changes become permanent, together, in one transaction." },
          { code: "except Exception: db.rollback()", explanation: "If anything fails before commit (even the second query, after the first change was staged), this discards every pending change in the session, just like a SQL ROLLBACK." },
        ],
      },
    ],
    howItWorks: `
\`db: Session = Depends(get_db)\` uses FastAPI's dependency injection to
call \`get_db\` for every request. Each request gets its own fresh
session, used only for its queries, then closed.

Calls like \`db.add\`, \`db.commit\`, \`db.query\`, and \`.delete()\` map to
INSERT, UPDATE/COMMIT, SELECT, and DELETE statements. SQLAlchemy
generates them and sends them over the database connection, just as the
\`pg\` driver does in Node.

To run the app, start an ASGI server pointed at it:
\`uvicorn main:app --reload\`. It's the Python equivalent of
\`node server.js\`, with \`--reload\` watching for changes during
development.
    `.trim(),
    whyItExists: `
It's the same reason a Node backend is split into
routes/controllers/services/models. As endpoints and tables multiply,
keeping setup, data shapes, and database logic each in one place keeps
the project easy to navigate, instead of one tangled, growing file.
    `.trim(),
    whenToUse: `
Use this structure once a FastAPI project has more than a couple of
endpoints or more than one table. It's the same point where you'd reach
for a layered structure in Node.
    `.trim(),
    whenNotToUse: `
For a two-endpoint script or quick prototype, separate
database.py/models.py/schemas.py/router files are more scaffolding than
you need. One main.py is easier to follow at that size.
    `.trim(),
    commonMistakes: [
      "Forgetting db.commit() after db.add() or a change, so it stays staged in the session and never reaches the database.",
      "Reusing one global session for every request instead of a fresh one per request via Depends(get_db). It can leak stale data or connections between unrelated requests.",
      "Returning a raw SQLAlchemy model instead of going through a Pydantic response_model, which exposes internal fields (like a password hash) to the client.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Which file (database.py, models.py, schemas.py, or a router) should a new 'orders' table definition go in?" },
      { difficulty: "Medium", prompt: "Write a DELETE /items/{item_id} endpoint that returns a 404 if the item doesn't exist before deleting it." },
      { difficulty: "Hard", prompt: "Explain what would go wrong if one database session, created at app startup, were reused for every request instead of one session per request." },
    ],
    interviewQuestions: [
      { question: "What does Depends(get_db) provide to a FastAPI route?", answer: "A fresh, request-scoped SQLAlchemy session that's closed automatically afterward. It's similar to Express middleware attaching something to the request object." },
      { question: "What command actually runs a FastAPI app?", answer: "uvicorn main:app --reload. That's an ASGI server pointed at the FastAPI instance, with --reload restarting it on code changes during development." },
      { question: "Why use a Pydantic response_model instead of returning the raw database object?", answer: "It controls exactly which fields reach the client, so internal-only fields don't leak into the response." },
      { question: "Why is `get_db` written as a generator function using `yield` instead of just returning a session directly?", answer: "FastAPI treats a dependency that uses yield as needing cleanup. It runs the code before yield to create the session and hands it to the route. When the route finishes, whether it succeeds or raises, FastAPI resumes the generator to run the code after yield. So `db.close()` always runs exactly once per request." },
      { question: "What would happen if `db.close()` were forgotten inside get_db's finally block?", answer: "The session and its database connection would never go back to the pool. Since get_db runs per request, the leak grows with every request until the pool is exhausted, just like forgetting client.release() with a raw Node driver." },
      { question: "In the create_item example, why is `db.refresh(db_item)` called after `db.commit()`?", answer: "After commit, the in-memory db_item may not include values the database generated or defaulted during the insert, like an auto-incrementing id. db.refresh() reloads the row into the same object so the response includes them." },
      { question: "What happens if `db.commit()` is never called after `db.add()` or after mutating an already-loaded object's attributes?", answer: "The change stays staged in the session's memory and is never written to the database. No error is raised, so the request seems to succeed while the data silently isn't saved. That's a confusing bug to track down." },
      { question: "Why does update_item use `setattr(item, key, value)` in a loop instead of just assigning `item = updated`?", answer: "item is a model instance SQLAlchemy is tracking, tied to a specific row in the session. Replacing it with updated, a plain Pydantic object, loses that tracking, so SQLAlchemy can't tell what changed. Setting attributes on the tracked object lets SQLAlchemy detect which fields changed and generate the right UPDATE." },
      { question: "What's the purpose of the response_model argument in a route decorator, like `@router.post(\"/items\", response_model=schemas.Item)`?", answer: "FastAPI validates and shapes whatever the route returns against that Pydantic model before responding, dropping any field not declared on it. Even if the route returns a raw SQLAlchemy object with extra internal fields, only the declared fields reach the client." },
      { question: "Why does the example define separate schemas.Item and schemas.ItemCreate models, rather than one shared model for both input and output?", answer: "Input and output often need different shapes. Creating an item may not need or allow a client-supplied id, while reading one back should include the database-generated id. Separate schemas let each direction declare exactly the right fields." },
      { question: "What SQL statement does `db.query(models.Item).filter(models.Item.id == item_id).first()` correspond to?", answer: "Roughly SELECT * FROM items WHERE id = :item_id LIMIT 1. SQLAlchemy builds that SQL from the chained calls. .first() returns at most one row, or None if nothing matches, instead of raising." },
      { question: "Why does read_item explicitly check `if not item: raise HTTPException(status_code=404, ...)` instead of just returning whatever .first() produced?", answer: ".first() returns None when nothing matches instead of raising. Without the check, a request for a missing item would try to return None through the response_model and produce a confusing validation error instead of a clear 404." },
      { question: "What's the SQLAlchemy equivalent of the raw-SQL transaction pattern of BEGIN, commit, and ROLLBACK shown for the money-transfer example?", answer: "Changes to tracked objects in the same session, like sender.balance and receiver.balance, stay pending until one db.commit() writes them together. db.rollback() in an except block discards every pending change if anything fails first. That mirrors BEGIN/COMMIT/ROLLBACK without writing the SQL." },
      { question: "Why is a fresh Session created per request via Depends(get_db), rather than one shared session reused across the whole app's lifetime?", answer: "A long-lived shared session collects every object it has loaded or changed in its identity map, can leak state between unrelated requests, and isn't safe to use from several requests at once. A fresh session per request keeps each request's work isolated." },
      { question: "What does `uvicorn main:app --reload` mean, piece by piece?", answer: "uvicorn is the ASGI server running the app. main:app tells it to import the app object from the main module. --reload watches source files and restarts the server on changes; it's for development only, not production." },
      { question: "Why does splitting a FastAPI project into database.py, models.py, schemas.py, and router files mirror the layered structure of a typical Node backend?", answer: "Each file isolates one concern, like a Node app's routes/controllers/services/models split. database.py matches a db config module, models.py matches ORM model files, schemas.py plays the role of validation schemas, and routers match Express route files." },
      { question: "What's the risk of returning a raw SQLAlchemy model instance directly from a route with no response_model declared at all?", answer: "FastAPI would try to serialize the ORM object's attributes to JSON, possibly exposing every column, including ones never meant for clients, like a password_hash or internal audit fields. No schema limits what goes out." },
      { question: "Why does the delete_item example return `{\"deleted\": item_id}` rather than a 204 No Content response?", answer: "A JSON body confirming which id was deleted gives the caller explicit confirmation, which can be handier than a body-less 204. Either is fine. What matters is picking one convention for delete endpoints and sticking to it." },
    ],
    prerequisites: ["python-web-frameworks", "connecting-to-a-database"],
    relatedTopics: ["python-web-frameworks", "connecting-to-a-database", "project-structure"],
    keywords: ["FastAPI", "SQLAlchemy", "CRUD", "Pydantic", "dependency injection", "uvicorn", "Python ORM"],
  },
];
