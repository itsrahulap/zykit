import type { Topic } from "../../types/content";

export const backendAdvancedTopics: Topic[] = [
  {
    id: "api-versioning",
    title: "API Versioning",
    level: "advanced",
    description: "How to change an API's shape over time without breaking the other applications and clients already relying on it.",
    explanation: `
Once an API is live, you rarely control every single thing that calls
it. A mobile app might be installed on thousands of phones, some of
which won't update for months. A partner company might have built
their own integration against your endpoints. If you change how an
endpoint behaves — renaming a field, changing what a status code means,
removing something you thought nobody used — every one of those
existing callers can break the moment you deploy, with no warning.

**API versioning** is a strategy for making changes to an API while
still letting existing clients keep working exactly as before,
typically by letting multiple versions of an endpoint exist side by
side, at least for a transition period. Two common approaches are
**URL versioning** (\`/v1/users\` vs. \`/v2/users\`) and **header
versioning** (the same URL, but the client specifies a version in a
request header).
    `.trim(),
    analogy:
      "Think of a road under construction. You don't close the only bridge into town overnight and strand everyone driving toward it — you build a new bridge alongside the old one, let both operate for a while, and only remove the old one once you're confident nobody still needs it.",
    examples: [
      {
        title: "URL versioning",
        code: `// v1: returns a flat "name" field
app.get("/v1/users/:id", (req, res) => {
  res.json({ id: req.params.id, name: "Ada Lovelace" });
});

// v2: splits name into first/last, without touching v1's contract at all
app.get("/v2/users/:id", (req, res) => {
  res.json({ id: req.params.id, firstName: "Ada", lastName: "Lovelace" });
});`,
        explanation: "Old clients keep calling /v1/users and get exactly the response shape they always have, while new clients can opt into /v2/users for the improved shape.",
        walkthrough: [
          { code: 'app.get("/v1/users/:id", ...)', explanation: "The original contract, kept running unchanged for as long as any client still depends on it." },
          { code: '{ id: req.params.id, name: "Ada Lovelace" }', explanation: "v1's response shape is frozen — changing it here would break every existing caller relying on a single 'name' field." },
          { code: 'app.get("/v2/users/:id", ...)', explanation: "A separate route entirely, free to introduce a breaking change (splitting name into two fields) because it doesn't affect v1's callers at all." },
        ],
      },
      {
        title: "Header-based versioning",
        code: `app.get("/users/:id", (req, res) => {
  const version = req.headers["api-version"] || "1";

  const user = { id: req.params.id, name: "Ada Lovelace" };

  if (version === "2") {
    const [firstName, lastName] = user.name.split(" ");
    return res.json({ id: user.id, firstName, lastName });
  }
  res.json(user);
});`,
        explanation: "The URL never changes, but the client's requested version — sent as a header — determines the exact shape of the response.",
      },
    ],
    howItWorks: `
Rather than changing an existing endpoint's behavior in place, a new
version is introduced alongside it — either as a distinct URL prefix
(\`/v2/...\`) or by reading a version identifier from a header (or
sometimes a query parameter) and branching internally. Existing clients
that don't specify a version, or that explicitly ask for the old one,
keep getting the original behavior indefinitely (or until a
communicated deprecation date), while new clients can adopt the new
version whenever they're ready.
    `.trim(),
    whyItExists: `
An API is a contract: whoever calls it is trusting that its shape and
behavior won't shift unexpectedly under them. But software still needs
to evolve — fields get renamed, response shapes improve, entire
concepts get restructured. Versioning exists to let evolution and
backward compatibility coexist, so an API owner can improve their
design without holding every past decision hostage forever, and without
breaking clients they don't control or can't instantly force to update.
    `.trim(),
    whenToUse: `
Introduce a new version when you need to make a **breaking** change —
removing a field, changing a field's type or meaning, changing what a
status code represents — to an API that already has external or
independently-deployed consumers.
    `.trim(),
    whenNotToUse: `
Purely additive changes — adding a new optional field, adding a brand
new endpoint — generally don't require a new version at all, since
well-behaved existing clients simply ignore fields they don't recognize.
Versioning everything, even non-breaking changes, adds unnecessary
maintenance overhead.
    `.trim(),
    commonMistakes: [
      "Treating every single change as breaking and creating a new version far more often than necessary.",
      "Introducing a new version but never actually retiring old ones, leaving an ever-growing pile of versions to maintain forever.",
      "Changing an existing version's behavior 'just this once' instead of creating a proper new version, breaking clients who trusted that version to stay stable.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain the difference between a breaking change and a non-breaking change to an API, with one example of each." },
      { difficulty: "Medium", prompt: "Design a /v1/ and /v2/ pair of routes for a `/products/:id` endpoint where v2 adds a new required field that v1 didn't have." },
      { difficulty: "Hard", prompt: "Propose a deprecation plan for retiring an old API version: how would you warn existing clients, and how would you decide when it's finally safe to remove it?" },
    ],
    interviewQuestions: [
      { question: "Why is API versioning necessary?", answer: "Because an API is a contract other systems depend on, and breaking changes to that contract can silently break clients you don't control — versioning lets you evolve the API while keeping existing consumers working." },
      { question: "What's the difference between URL versioning and header versioning?", answer: "URL versioning encodes the version directly in the path (like `/v2/users`), making it visible and cacheable; header versioning keeps one URL and lets the client specify a version via a request header, keeping URLs stable over time." },
      { question: "Does every change to an API require a new version?", answer: "No — only breaking changes (removing or restructuring existing fields, changing behavior clients rely on) typically require a new version; purely additive changes usually don't." },
      { question: "What generally counts as a breaking change to an API?", answer: "Removing or renaming a field, changing a field's type or meaning, changing what a status code represents, adding a new *required* request parameter, or restructuring the URL itself — any change an existing, well-behaved client couldn't simply ignore." },
      { question: "Give an example of a change that looks risky but usually isn't breaking.", answer: "Adding a brand-new optional field to a response. A well-behaved client only reads the fields it already knows about and ignores anything unfamiliar, so an additive field doesn't require a new version." },
      { question: "Why is URL versioning considered more visible than header versioning?", answer: "The version appears directly in the path itself, so it shows up in browser address bars, server logs, proxy configuration, and cache keys — there's nothing hidden that only shows up by inspecting request headers." },
      { question: "What's a downside of URL versioning?", answer: "Maintaining two (or more) full sets of routes for the same resource — `/v1/users` and `/v2/users` — means duplicated route logic and a growing surface area to keep working as more versions accumulate." },
      { question: "What's a downside of header versioning?", answer: "It's less discoverable — you can't just paste a URL into a browser to see a given version's response — and caching gets trickier, since the same URL can now return different bodies depending on a header a cache may not vary by default." },
      { question: "In the header-versioning example, what version does a request get if it sends no `api-version` header at all?", answer: "Version 1. The handler reads `req.headers[\"api-version\"] || \"1\"`, so a missing header falls back to the original behavior rather than failing or defaulting to the newest version." },
      { question: "Why does defaulting a missing version header to the original version matter for backward compatibility?", answer: "It means clients that were built before versioning even existed keep working exactly as before, with zero changes required on their end, rather than being forced to explicitly opt into 'version 1' to avoid breaking." },
      { question: "What's an alternative to a custom header for expressing an API version, using a standard HTTP mechanism?", answer: "Content negotiation via the `Accept` header, e.g. `Accept: application/vnd.myapi.v2+json` — the version rides on a mechanism HTTP already defines for negotiating response format, instead of a bespoke header name." },
      { question: "Why doesn't API versioning map cleanly onto semantic versioning (major.minor.patch)?", answer: "Semantic versioning tracks every release's granularity, including non-breaking additions; API versions typically only bump when a change is actually breaking for consumers, so a long stretch of purely additive changes might never need a new API version at all." },
      { question: "What is a deprecation window (or sunset period)?", answer: "A communicated span of time during which an old API version keeps working exactly as before but is explicitly marked for future removal, giving existing clients time to migrate before it's actually taken away." },
      { question: "How might a server communicate an upcoming version retirement to its clients?", answer: "Through mechanisms like a `Sunset` or `Deprecation` response header, a warning field in the response body, published changelog/documentation entries, or direct outreach to known API consumers." },
      { question: "Why is silently changing an existing version's behavior worse than releasing a proper new version?", answer: "It violates the contract clients trusted was stable, breaking them with no warning and no way to opt out or prepare — whereas a new version lets old behavior keep running untouched while new behavior is opt-in." },
      { question: "Scenario: you need to change a live endpoint's field from a string to a number. What's the safe way to do it?", answer: "Don't mutate the existing field's type in place. Either introduce a new version where the change is made, or add a new field alongside the old one and deprecate the old field — either way, existing clients relying on the current type keep working." },
      { question: "Why can adding a new *required* field to a request body be breaking, even though adding fields sounds additive?", answer: "Existing clients don't know to send that new required field, so their requests start failing validation the moment it's required — additive is only safe on the response side, where unfamiliar fields can be ignored; on the request side, a new required field is something old clients literally cannot satisfy." },
      { question: "What's the practical risk of letting old API versions pile up indefinitely?", answer: "Every version adds ongoing maintenance, testing, and security-patching burden, and more surface area for subtle bugs — the common mistake isn't introducing versions, it's never retiring the ones nobody needs anymore." },
      { question: "Debugging: a client explicitly requesting version 1 via the header is receiving the version 2 response shape. What's a likely bug?", answer: "The version comparison itself is probably wrong — e.g. comparing the header value against the wrong type, checking equality against the wrong string, or branching logic ordered so the v2 path runs before the version check happens at all." },
      { question: "Why does API versioning usually require maintaining separate documentation per version?", answer: "Documentation has to accurately describe each version's actual contract; docs describing the current version's shape would be actively wrong for a client still calling an older, differently-shaped version." },
      { question: "Trap: a team assumes a breaking change to a GET endpoint is low-risk because 'nobody really uses GET responses directly.' Why is that reasoning unsafe?", answer: "Versioning decisions should be based on the resource's actual contract, not assumptions about who's using it — any independently-deployed consumer could be parsing that GET response's exact shape, and there's no way to be sure none are." },
      { question: "How does API versioning differ from a feature flag, given that both can change server behavior for some requests but not others?", answer: "A feature flag toggles internal behavior for a codebase you control end-to-end, often for gradual rollout; versioning specifically exists to preserve a stable, documented contract for external or independently-deployed clients that can't simply be forced to flip a flag on your schedule." },
      { question: "Follow-up: once traffic to an old version has dropped to nearly zero, is it safe to delete it immediately?", answer: "Not necessarily — 'nearly zero' isn't zero, and a caller can still be quietly relying on it. It's safer to confirm via logs/metrics, announce a firm removal date, and only remove it after that grace period has actually passed." },
      { question: "Advanced: how can an API gateway reduce the internal cost of supporting multiple externally-visible versions?", answer: "The gateway can translate or adapt requests/responses for older versions into whatever the current internal implementation actually expects, so the backend itself maintains fewer diverging code paths even while still exposing several versions to the outside world." },
    ],
    prerequisites: ["routing", "error-handling-apis"],
    relatedTopics: ["testing-backend-code", "deployment-and-cicd"],
    keywords: ["api versioning", "breaking changes", "backward compatibility"],
  },
  {
    id: "dependency-injection",
    title: "Dependency Injection",
    level: "advanced",
    description: "Handing a function or class the things it needs from outside, rather than letting it create those things itself — making it far easier to swap or test.",
    explanation: `
Imagine a function that sends a welcome email, and inside that function
it directly creates a connection to a real email-sending service. That
seems fine, until you try to write a test for it: every single test run
would actually try to send a real email, hit a real network, and depend
on a real third-party service being up and configured correctly. You
can't easily swap in a fake version, because the function decided, all
by itself, exactly which email service to talk to — and that decision
is buried inside it.

**Dependency injection** flips that: instead of a function or class
creating the things it depends on, those dependencies are handed to it
from the outside — usually as parameters — so whoever is calling it
controls what gets used. In a test, you can hand it a fake, predictable
version of the email service instead of the real one; in production,
you hand it the real one.
    `.trim(),
    analogy:
      "A restaurant kitchen that insists on growing its own vegetables, raising its own chickens, and mining its own salt would be nearly impossible to inspect or adjust. A kitchen that instead receives its ingredients from outside suppliers can easily swap one supplier for another — including, for a health inspection, temporarily swapping in ingredients specifically prepared for testing.",
    examples: [
      {
        title: "Without dependency injection — hard to test",
        code: `const realEmailService = require("./realEmailService");

async function sendWelcomeEmail(user) {
  // The function decides, internally, exactly which service to use
  await realEmailService.send(user.email, "Welcome!");
}`,
        explanation: "This function can only ever use the real email service — there's no way to substitute anything else without editing this file itself.",
      },
      {
        title: "With dependency injection — swappable and testable",
        code: `async function sendWelcomeEmail(user, emailService) {
  await emailService.send(user.email, "Welcome!");
}

// Production
await sendWelcomeEmail(user, realEmailService);

// Test
const fakeEmailService = { send: jest.fn() };
await sendWelcomeEmail(user, fakeEmailService);
expect(fakeEmailService.send).toHaveBeenCalledWith(user.email, "Welcome!");`,
        explanation: "The function no longer decides which email service to use — it just uses whatever is passed in, letting a test supply a fake, observable version instead of touching anything real.",
        walkthrough: [
          { code: "async function sendWelcomeEmail(user, emailService) {", explanation: "emailService arrives as a parameter instead of being created or imported directly inside the function." },
          { code: "await sendWelcomeEmail(user, realEmailService);", explanation: "In production, the caller supplies the real dependency — the function's own code never changes." },
          { code: "const fakeEmailService = { send: jest.fn() };", explanation: "In a test, a lightweight fake stands in for the real service — no network calls, no real emails sent, and its calls can be inspected." },
        ],
      },
    ],
    howItWorks: `
A function or class that needs something (a database connection, an
email service, a clock, a logger) declares that need as a parameter (or
a constructor argument, in an object-oriented style) instead of
constructing or importing it directly inside its own body. Whoever
calls the function — production code, a test, or a wiring layer set up
at app startup — decides what concrete implementation to supply. In
larger applications, a **dependency injection container** can
automate that wiring, but the core idea is the same at any scale: the
dependency comes from outside, not from within.
    `.trim(),
    whyItExists: `
Code that constructs its own dependencies internally is rigid: it can
only ever be tested and run against those exact, real dependencies,
which is often slow, flaky, or outright impossible in a test
environment (you don't want tests actually charging real credit cards).
Dependency injection exists to decouple *what* a piece of code needs
from *which specific implementation* satisfies that need, making code
dramatically easier to test in isolation and to reconfigure without
editing its internals.
    `.trim(),
    whenToUse: `
Reach for dependency injection for anything that talks to the outside
world — databases, external APIs, the filesystem, the current time —
especially in code you want to unit test without those real
dependencies being involved.
    `.trim(),
    whenNotToUse: `
For small, self-contained utility functions with no external
dependencies at all (like a pure function that formats a date), there's
nothing to inject — adding indirection here just adds noise without any
testability benefit.
    `.trim(),
    commonMistakes: [
      "Importing and using a real dependency directly inside a function, then being surprised it's impossible to test in isolation.",
      "Over-engineering dependency injection for simple, pure logic that has no external dependencies to swap in the first place.",
      "Injecting a dependency but still reaching for a global or imported version of it somewhere else in the same code path, defeating the purpose.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Rewrite a function that directly calls `Date.now()` internally so that the current time is instead passed in as a parameter." },
      { difficulty: "Medium", prompt: "Take a function that directly imports and uses a real database client, and refactor it to accept the database client as a parameter instead." },
      { difficulty: "Hard", prompt: "Write a test for a `chargeCustomer(order, paymentService)` function using a fake `paymentService`, and explain what real-world problems that avoids compared to testing against the real payment provider." },
    ],
    interviewQuestions: [
      { question: "What is dependency injection?", answer: "A design approach where a function or class receives the things it depends on from outside — usually as parameters or constructor arguments — instead of creating or importing them internally." },
      { question: "Why does dependency injection make code easier to test?", answer: "Because a test can supply a fake, predictable version of a dependency (like a fake email service or database) instead of the real one, avoiding slow, flaky, or unsafe real-world side effects." },
      { question: "Give an example of a dependency worth injecting rather than hardcoding.", answer: "An external service client (email, payments, a database connection) or even something like the current time — anything that a test would want to replace with a controlled, fake version." },
      { question: "What's the difference between constructor injection and parameter injection?", answer: "Constructor injection passes dependencies in when an object is created and stores them on the instance (e.g. `this.db`), available to every method; parameter injection passes a dependency directly into one function call, scoped only to that call." },
      { question: "Why might constructor injection suit a class better than parameter injection, if many of its methods all need the same database connection?", answer: "It avoids threading the same parameter through every single method's signature — the dependency is supplied once, at construction time, and every method can simply reach for `this.db` afterward." },
      { question: "What is inversion of control, and how does dependency injection relate to it?", answer: "Inversion of control is the broader principle that a component shouldn't decide how its own dependencies get constructed or located. Dependency injection is one concrete technique for achieving that — the decision of *which* implementation to use is inverted outward, to whoever wires the component up." },
      { question: "What problem does a dependency injection container solve as an application grows?", answer: "It automatically constructs and wires together an entire graph of dependencies based on registered rules, so you don't have to manually thread every dependency down through every layer of the app by hand." },
      { question: "How does NestJS build dependency injection into the framework itself?", answer: "A NestJS class declares what it needs as constructor parameters, and NestJS's own container automatically constructs and supplies matching instances at runtime — you rarely construct a dependency by hand at all." },
      { question: "In FastAPI, how does `Depends()` implement dependency injection for a route handler?", answer: "A route parameter's default value is set to `Depends(some_function)`; FastAPI calls `some_function` itself and injects its return value as the argument, so the route handler never constructs that dependency directly." },
      { question: "What's the difference between a stub, a mock, and a fake, as types of test doubles?", answer: "A stub just returns preprogrammed values with no checks on how it was called; a mock records calls so a test can assert specific interactions happened; a fake is a simplified but genuinely working implementation, like an in-memory database standing in for a real one." },
      { question: "In the sendWelcomeEmail example, why is `jest.fn()` specifically useful as the fake `emailService.send`?", answer: "`jest.fn()` creates a mock function that records every call made to it, so the test can assert exactly what arguments it was called with — a plain stub that just returns a value couldn't verify that." },
      { question: "What is the service locator pattern, and why is it often considered worse than dependency injection?", answer: "A class asks a central registry for its dependencies by name or type at runtime, instead of receiving them as parameters. This hides the class's real dependencies inside its body and still complicates testing, since a test must configure the shared locator rather than simply passing in a fake directly." },
      { question: "Why does dependency injection often go hand-in-hand with depending on an interface rather than a concrete class?", answer: "The consumer only needs to know the shape it depends on — e.g. 'something with a `.send()` method' — not which concrete implementation satisfies it, and that's exactly what makes swapping a real service for a fake possible without touching the consumer's code." },
      { question: "Debugging: a test injects a fake database, but the function under test still hits the real one. What's a likely cause?", answer: "The function is probably still importing and using the real database client directly somewhere in its body, alongside the injected parameter — injecting one dependency while still reaching for a global or imported version elsewhere defeats the point." },
      { question: "Given `async function sendWelcomeEmail(user, emailService) { await emailService.send(...) }`, what happens if it's called as `sendWelcomeEmail(user)` with no second argument?", answer: "`emailService` is `undefined`, so calling `.send(...)` on it throws a TypeError at runtime. Dependency injection shifts responsibility for supplying a valid dependency onto the caller, and this is what happens when a caller forgets to." },
      { question: "Trap: a developer adds dependency injection to a pure function like `add(a, b)`. What's wrong with that?", answer: "There's nothing to swap or fake in the first place — a pure function with no external dependencies gains no testability from injection, just an extra parameter and indirection with no real benefit." },
      { question: "What is a singleton dependency lifetime in a DI container, and when is it appropriate?", answer: "The container constructs the dependency once and hands the same shared instance to every consumer that asks for it — appropriate for something stateless or expensive to build, like a database connection pool, where constructing a fresh one per use would be wasteful or incorrect." },
      { question: "How does a transient lifetime differ from a singleton one?", answer: "A transient dependency is constructed brand-new every single time it's requested, rather than shared — appropriate when instances must not carry over state between uses, at the cost of paying construction overhead repeatedly." },
      { question: "Why is dependency injection considered especially important for code that talks to the outside world, like databases or the filesystem?", answer: "Those are exactly the dependencies that are slow, non-deterministic, stateful, or unsafe to exercise for real inside an automated test — being able to substitute a controlled fake for them is what makes that code testable at all." },
      { question: "Scenario: you need to test a function that checks 'is this coupon still valid?' based on the current time. How does injecting the clock help?", answer: "The test can pass a fixed, known timestamp instead of calling the real current time, making the test deterministic and repeatable no matter when it actually runs — including right at a boundary like midnight, which a real clock couldn't reliably reproduce." },
      { question: "What's a real cost of taking 'program to an interface' too far when applying dependency injection?", answer: "Introducing an interface and an injection point for a dependency that will realistically only ever have one implementation adds boilerplate and indirection without any real testability or flexibility payoff." },
      { question: "How does dependency injection support the single responsibility principle?", answer: "A class that constructs its own dependencies is doing two jobs — its actual logic, and deciding how to build or configure a collaborator. Injecting the dependency removes that second job, letting the class focus purely on its own logic." },
      { question: "Why inject a logger instance instead of importing a global logger directly?", answer: "A test can inject a no-op or in-memory logger to keep test output clean and assert on what was logged, and different environments — production, a CLI tool, a test run — can be wired with different logging behavior without changing the function's own code." },
      { question: "How is dependency injection different from just passing plain configuration values, like a port number, as parameters?", answer: "Dependency injection specifically refers to supplying behavior — an object with methods the code actually calls, like a service or client — not plain data. Passing a config value as a parameter isn't usually what's meant by 'dependency injection' on its own." },
      { question: "Follow-up: once a database dependency is injected into a function, how do you avoid every caller having to explicitly pass it at every call site?", answer: "Wire the real dependency once at the application's composition root at startup — or let a DI container manage it — so it's threaded through automatically from one place, rather than manually re-passed at every layer of the app." },
      { question: "What real-world problem does injecting a fake payment service avoid, compared to testing against a real payment provider?", answer: "It avoids actually charging a real card, needing network access to a third party, and test runs becoming slow or flaky because of that external service's availability or rate limits." },
      { question: "How does a module-mocking tool like `jest.mock()` achieve a similar benefit to dependency injection without changing a function's signature?", answer: "It intercepts module resolution and swaps a module's real implementation for a mock version wherever it's imported, achieving a similar testing benefit to DI but by replacing the import itself rather than requiring the function to accept the dependency as an explicit parameter." },
      { question: "Trap: a test's fake service has a different method signature than the real service it replaces. What risk does this create?", answer: "The test can keep passing while the fake has silently drifted from the real dependency's actual contract, giving false confidence — a fake needs to be kept honest against the real interface it stands in for, e.g. by having both implement a shared, typed interface." },
      { question: "Why is dependency injection often described as a form of loose coupling?", answer: "The consuming code depends only on an abstract need — 'something that can send an email' — not on the specific concrete module that fulfills it. The two sides are connected only by whatever gets passed in at the call site, so either can change independently." },
    ],
    prerequisites: ["error-handling-apis"],
    relatedTopics: ["testing-backend-code"],
    keywords: ["dependency injection", "testability", "inversion of control", "mocking"],
  },
  {
    id: "testing-backend-code",
    title: "Testing Backend Code",
    level: "advanced",
    description: "The difference between checking one small piece of logic in isolation and checking that a real request flows correctly through the whole app.",
    explanation: `
As a backend grows, manually clicking through the app (or firing off
requests by hand) to check that everything still works becomes slower
and less reliable with every new feature. Automated tests exist to do
that checking for you, quickly and repeatedly — but not all tests check
the same thing, or at the same scope.

A **unit test** checks one small, isolated piece of logic — usually a
single function — on its own, often replacing its dependencies with
fakes (see dependency injection) so the test focuses purely on that
one function's behavior. An **integration test** goes further: it
sends a real request through the actual running app — through routing,
middleware, and often a real (or realistic test) database — and checks
that the whole chain produces the right result together.
    `.trim(),
    analogy:
      "A unit test is like testing a single car part on a bench — does this brake pad grip correctly under pressure — in isolation from the rest of the car. An integration test is like taking the whole assembled car out for a test drive: you're no longer checking one part alone, you're checking that the brakes, engine, and steering all work together correctly as a system.",
    examples: [
      {
        title: "A unit test — one function, in isolation",
        code: `function calculateDiscount(price, percentOff) {
  if (percentOff < 0 || percentOff > 100) {
    throw new Error("Invalid discount percentage");
  }
  return price - (price * percentOff) / 100;
}

test("applies a 20% discount correctly", () => {
  expect(calculateDiscount(100, 20)).toBe(80);
});

test("rejects an invalid discount percentage", () => {
  expect(() => calculateDiscount(100, 150)).toThrow();
});`,
        explanation: "This test never starts a server or touches a network — it calls the function directly and checks its return value, making it extremely fast and focused.",
        walkthrough: [
          { code: "function calculateDiscount(price, percentOff) {", explanation: "A small, self-contained piece of logic with no external dependencies — an ideal candidate for a unit test." },
          { code: 'expect(calculateDiscount(100, 20)).toBe(80);', explanation: "Calls the function directly with known input and checks the exact expected output, with nothing else involved." },
          { code: 'expect(() => calculateDiscount(100, 150)).toThrow();', explanation: "Also checks the failure path — that invalid input is rejected the way the function promises to." },
        ],
      },
      {
        title: "An integration test — a real request through the app",
        code: `const request = require("supertest");
const app = require("../app");

test("GET /products/:id returns the requested product", async () => {
  const res = await request(app).get("/products/42");

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ id: "42" });
});

test("GET /products/:id returns 404 for a missing product", async () => {
  const res = await request(app).get("/products/does-not-exist");
  expect(res.status).toBe(404);
});`,
        explanation: "This test sends an actual HTTP request through the app's real routing and middleware, checking the full response the way a real client would see it — not just one internal function.",
      },
      {
        title: "The same integration test, in FastAPI with pytest",
        code: `from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_existing_product():
    response = client.get("/products/42")
    assert response.status_code == 200
    assert response.json()["id"] == 42

def test_get_missing_product_returns_404():
    response = client.get("/products/does-not-exist")
    assert response.status_code == 404`,
        language: "python",
        explanation: "TestClient wraps the actual FastAPI app the same way supertest wraps an Express app — it sends real requests through routing, dependencies, and validation, and lets you assert on the real response, without needing a live server running somewhere.",
      },
    ],
    howItWorks: `
Unit tests call a function or method directly, typically supplying
fake versions of any dependencies (see dependency injection) so the
test stays fast, isolated, and unaffected by anything outside that one
function. Integration tests instead run through the app as a whole —
usually by simulating an actual HTTP request against the app's real
routing and middleware, often against a real (but test-only) database —
verifying that all the pieces genuinely work together, not just in
isolation.
    `.trim(),
    whyItExists: `
Unit tests alone can all pass while the app as a whole is still broken
— if two individually-correct functions are wired together incorrectly,
no unit test would catch that. Integration tests alone, meanwhile, are
slower and harder to pinpoint failures in — a single failing integration
test might not tell you exactly which function is at fault. Having both
kinds of tests exists because they catch different classes of problems,
at different speeds, and a healthy test suite typically leans on many
fast unit tests plus a smaller number of integration tests for the
critical paths.
    `.trim(),
    whenToUse: `
Write unit tests for individual pieces of business logic, especially
ones with several branches or edge cases (like a discount calculation
or validation rule). Write integration tests for the critical paths a
real user or client actually exercises end-to-end, like signing up,
logging in, or placing an order.
    `.trim(),
    whenNotToUse: `
Don't write an integration test for something a unit test could check
just as well, more quickly and reliably — spinning up the whole app to
test that a pure calculation function returns the right number is
unnecessary overhead.
    `.trim(),
    commonMistakes: [
      "Writing only unit tests and never verifying that the pieces actually work correctly wired together.",
      "Writing only integration tests, resulting in a slow test suite where a single failure is hard to trace back to its root cause.",
      "Letting integration tests depend on real external services (a real payment provider, a real third-party API) instead of test doubles, making the suite flaky and slow.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a unit test for a `isValidEmail(email)` function, covering both a valid and an invalid case." },
      { difficulty: "Medium", prompt: "Write an integration test for a POST /login route that checks it returns a 200 with valid credentials and a 401 with invalid ones." },
      { difficulty: "Hard", prompt: "Explain a scenario where all unit tests pass but an integration test still fails, and what that reveals about where the bug actually lives." },
    ],
    interviewQuestions: [
      { question: "What's the difference between a unit test and an integration test?", answer: "A unit test checks one isolated piece of logic, usually with fake dependencies; an integration test checks that multiple real pieces of the app — routing, middleware, and often a database — work correctly together." },
      { question: "Why might all unit tests pass while the app is still broken?", answer: "Because unit tests check pieces in isolation — if those pieces are wired together incorrectly, no individual unit test would necessarily catch that, since it isn't a problem with any one piece in isolation." },
      { question: "Why do integration tests typically run slower than unit tests?", answer: "They exercise more of the real system — routing, middleware, and often a real or realistic database — rather than a single function in isolation, so there's more work happening per test." },
      { question: "What is a test double, and what are the main kinds?", answer: "A generic term for anything substituted for a real dependency in a test. The main kinds are stubs (return canned values), mocks (record and let you assert on calls), fakes (simplified but working implementations), and spies (wrap a real function while observing calls to it)." },
      { question: "What's the difference between a stub and a mock?", answer: "A stub just returns preprogrammed responses with no verification of how it was called; a mock records the calls made to it so the test can assert on specific interactions, like 'was called exactly once with these arguments.'" },
      { question: "What is a spy, as distinct from a mock?", answer: "A spy wraps a real function or method and records how it was called while optionally still letting the real implementation run, whereas a mock typically replaces the real implementation entirely with a fake one." },
      { question: "What does supertest actually do when you call `request(app).get(...)`?", answer: "It runs the actual Express app in-memory and fires a real HTTP request through its routing and middleware stack, then hands back the genuine response — without needing to bind to an actual network port." },
      { question: "In the FastAPI example, what does `TestClient(app)` let you do that hitting a live server wouldn't?", answer: "Send requests directly against the app object in-process, exercising its real routing, dependency injection, and validation, without needing a live server process or an open network port running anywhere." },
      { question: "In the FastAPI test, why does `test_get_missing_product_returns_404` assert on a status code instead of expecting an exception?", answer: "The route handler is expected to catch the 'not found' case internally and return a 404 response, not let an unhandled exception propagate — the test is verifying the API's documented failure-path contract." },
      { question: "What is the test pyramid, and what shape does it describe for a healthy test suite?", answer: "A large base of many fast, cheap unit tests, a smaller middle layer of integration tests, and very few slow end-to-end tests — reflecting that most bugs are cheaper and faster to catch the lower down that pyramid you can find them." },
      { question: "Why is `calculateDiscount` from the example a good candidate for a unit test specifically?", answer: "It's pure — the same input always produces the same output, with no external dependency like a network or database — so calling it directly, in isolation, fully verifies its behavior with no setup overhead." },
      { question: "What makes a test flaky, and why is that a serious problem?", answer: "A flaky test sometimes passes and sometimes fails for the same code, typically because it depends on something non-deterministic like real timing or network calls. It erodes trust in the suite, since failures start getting reflexively re-run instead of investigated." },
      { question: "Why do integration tests typically run against a real but test-only database, rather than the production one?", answer: "So tests can freely create, modify, and delete data without corrupting real user data, and so the suite can run repeatably against a known, resettable starting state each time." },
      { question: "What is test isolation, and why does it matter across a suite?", answer: "Each test should be independent of side effects left by any other test, so tests can run in any order, in parallel, or individually — a failure in one test shouldn't cascade into unrelated failures elsewhere in the suite." },
      { question: "Scenario: a signup endpoint's test suite starts failing whenever the tests run in a different order. What does that suggest?", answer: "The tests are likely sharing state — e.g. relying on a row inserted by an earlier test, or not cleaning up the database between runs — a test isolation problem, not necessarily a bug in the signup logic itself." },
      { question: "What is arrange-act-assert, as a structure for writing a test?", answer: "Arrange sets up the inputs, fakes, or state a test needs; act calls the function or makes the request under test; assert checks the actual outcome against what's expected — a structure that keeps individual tests readable and focused." },
      { question: "Why is `expect(() => calculateDiscount(100, 150)).toThrow()` written with a wrapping function instead of calling `calculateDiscount(100, 150)` directly inside `expect`?", answer: "Calling it directly would throw immediately at that line, before the test framework gets a chance to catch it. Wrapping it in a function lets the framework invoke it internally and catch the exception it expects to happen." },
      { question: "What is code coverage, and what's a common misconception about it?", answer: "The percentage of code actually executed by the test suite. The misconception is treating high coverage as proof of correctness — a line can run without its output ever being asserted on, so coverage measures exposure to tests, not the quality of what those tests check." },
      { question: "Why test a login route's 401 response, rather than only its success case?", answer: "Rejecting bad credentials is just as much a part of the endpoint's real contract as accepting good ones — untested failure paths are a common source of security and correctness bugs." },
      { question: "What's a mocking library's role when testing code that calls an external HTTP API?", answer: "It intercepts the outgoing HTTP call and returns a controlled, predetermined response instead of actually hitting the network, keeping the test fast, deterministic, and independent of that third-party service's availability." },
      { question: "Trap: a test mocks every database call so it always returns success, and the test passes — but the real integration is broken. What does this reveal?", answer: "Mocking too aggressively, even in something meant to be an integration test, can hide real wiring or contract mismatches between components — some tests need to exercise the real, or a realistic, dependency to actually verify things integrate correctly." },
      { question: "Why does FastAPI's `TestClient` behave 'the same way supertest wraps an Express app'?", answer: "Both let a test send a simulated HTTP request straight into the actual application object in-process — exercising the real routing, middleware, and validation stack — without starting a real network server." },
      { question: "What is a snapshot test, and what's a risk of relying on it too heavily?", answer: "It captures a piece of output the first time a test runs, and later runs compare against that saved snapshot. The risk is developers reflexively 'updating the snapshot' whenever it changes rather than checking the new output is actually correct, turning the test into a rubber stamp." },
      { question: "How would you unit test a function that checks 'has this session expired?' without it being flaky?", answer: "Inject the current time as a parameter instead of calling `Date.now()` internally (see dependency injection), so the test can pass a fixed, known timestamp and assert deterministic behavior around it." },
      { question: "What's the practical tradeoff of writing an integration test for something a unit test could verify just as well?", answer: "The integration test takes longer to run and needs more setup — like a running app and test database — and when it fails, a broken piece buried inside a longer request/response chain is usually harder to pinpoint than a focused unit test failure." },
      { question: "Why is a suite with many end-to-end tests and almost no unit tests usually a sign of a problem?", answer: "That shape inverts the test pyramid — the suite becomes slow to run, and a failing integration test only reveals that something in a long chain broke, not which specific piece, making failures much harder to pinpoint." },
      { question: "Debugging: an integration test for `GET /products/:id` passes locally but fails in CI with a connection error. What's a likely cause?", answer: "Something the test depends on isn't available in CI the way it is locally — e.g. no test database is running or seeded there, or the app under test was never actually started before the request was fired." },
      { question: "Beyond speed, what does letting integration tests depend on real external services cost a suite?", answer: "It makes the suite's pass/fail signal depend on that external service's uptime, rate limits, and data, introduces nondeterminism, and can cause real-world side effects — like actually charging a card or sending a real email — purely as a byproduct of running tests." },
      { question: "Why might you choose an in-memory fake database over a plain mock for testing a repository layer?", answer: "A fake actually implements real query and storage behavior, even if simplified, so it can catch logic bugs in how the repository queries or filters data — a mock that just returns canned values wouldn't exercise that logic at all." },
      { question: "Follow-up: after adding dependency injection to `chargeCustomer(order, paymentService)`, what specifically becomes testable that wasn't before?", answer: "The function's own logic — deciding what to charge, handling the service's response and errors — can now be verified with a fake payment service standing in, without ever making a real charge or depending on the real provider being reachable." },
    ],
    prerequisites: ["dependency-injection"],
    relatedTopics: ["dependency-injection", "api-versioning", "deployment-and-cicd", "python-web-frameworks"],
    keywords: ["unit testing", "integration testing", "test doubles", "supertest"],
  },
  {
    id: "deployment-and-cicd",
    title: "Deployment & CI/CD Basics",
    level: "advanced",
    description: "What actually happens between pushing a code change and that change running live for real users, at a conceptual level.",
    explanation: `
Writing code that works on your own laptop is only part of the job — it
still needs to get onto a real server somewhere, running in a way real
users can reach, without breaking whatever was already working. Doing
that by hand each time (manually copying files to a server, restarting
things, hoping nothing was forgotten) is slow and error-prone,
especially as a team grows.

**CI/CD** stands for **Continuous Integration** and **Continuous
Deployment** (or **Delivery**). Continuous integration means every code
change is automatically built and tested the moment it's pushed, to
catch problems early rather than after they've piled up. Continuous
deployment (or delivery) means that once a change passes those checks,
it's automatically (or with one click) shipped out to run in
production, following the same repeatable steps every single time.
    `.trim(),
    analogy:
      "Think of an assembly line at a factory versus a single craftsperson manually building one product at a time by hand. The assembly line runs the exact same checks and steps on every single item — the same quality inspection, the same packaging process — every time, catching defects early and shipping consistently, instead of relying on a person to remember every step correctly by hand each time.",
    examples: [
      {
        title: "A CI pipeline definition",
        code: `# .github/workflows/ci.yml (conceptual)
name: CI
on: [push]
jobs:
  test:
    steps:
      - run: npm install
      - run: npm run build
      - run: npm test`,
        language: "yaml",
        explanation: "Every time code is pushed, this pipeline automatically installs dependencies, builds the project, and runs the test suite — without anyone needing to remember to do it manually.",
        walkthrough: [
          { code: "on: [push]", explanation: "Defines the trigger: this pipeline runs automatically every time new code is pushed, with no manual step needed to kick it off." },
          { code: "- run: npm test", explanation: "If any test fails here, the pipeline stops and reports failure — catching a broken change before it ever reaches production." },
        ],
      },
      {
        title: "A deployment step that only runs after tests pass",
        code: `jobs:
  test:
    steps:
      - run: npm test

  deploy:
    needs: test   # only runs if the "test" job succeeded
    steps:
      - run: ./deploy.sh production`,
        language: "yaml",
        explanation: "The deploy job is deliberately gated on the test job succeeding first, so broken code never gets a chance to reach production.",
      },
    ],
    howItWorks: `
When code is pushed, a CI/CD system automatically runs a defined
sequence of steps: installing dependencies, building the project (if
it needs a build step), running the automated test suite, and
sometimes additional checks like linting or security scanning. If every
step succeeds, a deployment step can run: packaging the app (often as a
container image), pushing it to a hosting platform or server, and
switching live traffic over to the new version — ideally with a way to
quickly roll back if something still goes wrong once it's live.
    `.trim(),
    whyItExists: `
Manual deployment is slow, inconsistent, and entirely dependent on a
human remembering every step correctly, every single time — which
inevitably fails as a team and codebase grow. CI/CD exists to make
shipping code a repeatable, automated, and verified process: every
change gets the same checks applied to it, and getting a fix or feature
live becomes fast and low-risk instead of a stressful, manual ritual.
    `.trim(),
    whenToUse: `
Set up CI from the very start of a real project — even a single
automated test run on every push catches obvious mistakes early. Add
continuous deployment once you have enough test coverage and confidence
that a passing pipeline genuinely means the change is safe to ship.
    `.trim(),
    whenNotToUse: `
For a throwaway prototype or a script that will only ever run once,
manually, setting up a full pipeline is unnecessary ceremony — the
investment pays off once code is going to be deployed and iterated on
repeatedly, not for one-off work.
    `.trim(),
    commonMistakes: [
      "Deploying automatically even when tests fail, defeating the entire purpose of having tests gate the pipeline.",
      "Having no way to quickly roll back a bad deployment once it's already live.",
      "Treating a green CI pipeline as proof that everything is fine, when the test suite itself doesn't actually cover the part of the app that broke.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Describe, in order, the steps you'd expect a CI pipeline to run for a typical Node.js backend project." },
      { difficulty: "Medium", prompt: "Explain why a deployment step should be configured to run only after the test step succeeds, and what could go wrong if it wasn't." },
      { difficulty: "Hard", prompt: "Describe a rollback strategy for a deployment that turns out to have a serious bug discovered only after it reached production." },
    ],
    interviewQuestions: [
      { question: "What does CI/CD stand for, and what does each part mean?", answer: "Continuous Integration (automatically building and testing every code change as it's pushed) and Continuous Deployment/Delivery (automatically or reliably shipping a change that passes those checks out to production)." },
      { question: "Why is it important that deployment only happens after tests pass?", answer: "Because it prevents broken or untested code from ever reaching production automatically — the test suite acts as a gate the change must pass first." },
      { question: "Why is manual deployment risky as a team or codebase grows?", answer: "It relies on a person correctly remembering and performing every step every time, which becomes increasingly error-prone and inconsistent as complexity and team size increase." },
      { question: "What is a blue-green deployment?", answer: "Two identical production environments exist — 'blue,' the currently live one, and 'green,' the new version. Green is deployed and verified while blue keeps serving all real traffic, then traffic is switched to green all at once, leaving blue in place as an instant rollback target." },
      { question: "What is a rolling deployment?", answer: "New-version instances are brought up and old ones taken down gradually, a few at a time, rather than switching everything over at once — so at any moment during the rollout, both old and new versions are simultaneously serving live traffic." },
      { question: "What's a key tradeoff between blue-green and rolling deployment?", answer: "Blue-green needs double the infrastructure running at once but gives instant, clean rollback with no mixed-version traffic; rolling deployment uses less extra infrastructure but runs old and new versions side by side during the rollout, which is a problem if they aren't compatible." },
      { question: "What is a canary deployment?", answer: "The new version is rolled out to a small subset of real traffic or users first and monitored for problems, only being rolled out further once it looks healthy — limiting the blast radius of a bad deploy compared to shipping to everyone at once." },
      { question: "Why does a database migration need special care during a rolling or blue-green deployment?", answer: "Old and new application code query the same database at the same time during the rollout, so a migration that removes or renames a column the old code still expects would break the still-running old instances before they're fully retired." },
      { question: "What is a CI pipeline's build step generally responsible for, beyond installing dependencies?", answer: "Compiling or transpiling source code, bundling assets, or otherwise producing the actual runnable artifact that will later be tested and deployed — e.g. type-checking plus bundling for a TypeScript project." },
      { question: "Why does `needs: test` on the deploy job matter mechanically, not just as convention?", answer: "It tells the CI system the deploy job must not even start until the test job has finished and succeeded — if tests fail, deploy is skipped entirely rather than merely expected to be skipped." },
      { question: "What's the difference between continuous delivery and continuous deployment?", answer: "Continuous delivery verifies every change that passes the pipeline is ready to release, typically requiring one manual approval to actually ship it; continuous deployment goes further and ships it to production automatically, with no manual step at all." },
      { question: "Why is a build artifact often packaged as a container image?", answer: "A container image bundles the app together with its exact runtime and dependencies, so it runs identically wherever it's deployed, avoiding mismatches between the environment it was tested in and the one it actually runs in." },
      { question: "Why should the same build artifact that passed CI be the one deployed, rather than rebuilding from source at deploy time?", answer: "Rebuilding separately risks a different result — a dependency resolving differently, an environment difference — so what actually gets deployed was never the exact thing that was tested. Reusing the same artifact guarantees what was tested is what ships." },
      { question: "What does rollback mean in a deployment context, and why does it need to be fast?", answer: "Reverting production back to the last known-good version after a bad deploy is discovered live. The longer a broken version stays live, the more real users and requests are affected, so a slow rollback process extends that damage window." },
      { question: "How does blue-green deployment make rollback close to instant?", answer: "The previous version, blue, is still fully running and untouched after the switch to green — rolling back just means routing traffic back to blue, rather than rebuilding or redeploying the old version from scratch." },
      { question: "Scenario: a deploy passes CI, ships, and real users then hit errors no test caught. What does this reveal?", answer: "A green pipeline only proves the tests that exist all passed — it says nothing about behavior the suite never exercised, so this points to a gap in test coverage for that code path, not the pipeline itself misbehaving." },
      { question: "What is a health check, and what role does it play during a deployment?", answer: "An endpoint or process reporting whether a running instance is actually healthy and ready for traffic. A deployment system uses it to decide whether new instances are safe to receive traffic, or to automatically halt a rollout if new instances keep failing." },
      { question: "Why might a CI pipeline include a linting step in addition to tests?", answer: "Linting catches a class of problems tests don't check for directly — style inconsistencies, unused variables, certain likely bugs — using static analysis of the code rather than executing it." },
      { question: "Trap: a team's CI pipeline is green, but they still deploy manually by copying files to a server 'for now.' What risk does this defeat?", answer: "A passing pipeline is worthless as a safety guarantee if the deployment step itself isn't the same automated, repeatable process every time — manual deployment reintroduces exactly the human-error risk CI/CD exists to remove, regardless of how solid the CI checks are." },
      { question: "What secrets-related concern is specific to CI/CD pipelines?", answer: "A pipeline often needs credentials — deploy keys, API tokens — to actually push a deployment. These need secure storage, e.g. as encrypted pipeline secrets, rather than being committed in the pipeline definition file itself, which is often visible to anyone with repo access." },
      { question: "Why run the same test suite on every pull request, not just on the main branch after merging?", answer: "Catching a problem before it's merged means a broken change never lands on the branch other people build on top of, rather than needing to be found and reverted after the fact." },
      { question: "What does it mean for a deployment pipeline to be idempotent, and why does that matter?", answer: "Running the same deployment step twice in a row, e.g. after a retry, produces the same end result rather than compounding an effect. This matters because pipelines sometimes do need to retry a step after a transient failure, like a flaky network call." },
      { question: "Follow-up: is a fast rollback path alone enough to guarantee a bad deploy is safe?", answer: "Not by itself — you also need monitoring and alerting to actually detect the bad deploy quickly. A fast rollback that isn't triggered until users have already been affected for hours limits the damage far less than it could." },
      { question: "How does a canary deployment differ from A/B testing, even though both route a subset of traffic differently?", answer: "A canary is purely about deployment safety — verifying the new version behaves correctly before a full rollout, usually briefly. A/B testing deliberately compares two versions' real-world outcomes, often over a longer period, to decide which is better, not to safety-check a release." },
      { question: "Advanced: why might a rolling deployment be a poor fit for a breaking database schema change, even with careful ordering?", answer: "Old and new code must both work correctly against whatever schema state exists during the rollout window. Some schema changes have no safe intermediate state satisfying both versions' expectations at once, forcing a different strategy, like a multi-step expand-and-contract migration." },
    ],
    prerequisites: ["testing-backend-code", "background-jobs"],
    relatedTopics: ["testing-backend-code", "env-vars-and-config"],
    keywords: ["ci/cd", "continuous integration", "continuous deployment", "deployment pipeline"],
  },
  {
    id: "websockets-in-practice",
    title: "Building with WebSockets",
    level: "advanced",
    description: "What actually changes on the server when a connection stays open — handling events, pushing messages, broadcasting, and what happens when a client drops.",
    explanation: `
A WebSocket connection is a real-time, two-way upgrade on top of a
normal HTTP request. You don't need a whole separate subject to work
with one — just a clear picture of a few things that are genuinely
different from a normal request handler: the connection sticks around
instead of closing after one response, either side can send a message
at any moment, and your server code needs to actively track who's
currently connected if it wants to reach more than one client at once.

That means a WebSocket route isn't shaped like \`(req, res) => ...\`
anymore — it's shaped like "a connection just opened, here's what to do
each time a message arrives on it, and here's what to do when it
closes."
    `.trim(),
    analogy:
      "A normal API route is a phone call where you dial, ask one question, get one answer, and hang up. A WebSocket connection is more like a walkie-talkie left on: it stays open, either person can key in and speak whenever they want, and if you want to reach a whole group at once, you have to actually keep a list of everyone whose walkie-talkie is currently on.",
    examples: [
      {
        title: "Connection lifecycle and messages (Node.js, the ws library)",
        code: `const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (socket) => {
  console.log("client connected");

  socket.on("message", (data) => {
    console.log("received:", data.toString());
    socket.send("ack: " + data.toString());
  });

  socket.on("close", () => {
    console.log("client disconnected");
  });
});`,
        explanation: "This is the whole lifecycle in one place: 'connection' fires once when a client connects, 'message' fires every time that specific client sends something, and 'close' fires once the connection ends — there's no single request/response pair to reason about anymore.",
        walkthrough: [
          { code: 'wss.on("connection", (socket) => {', explanation: "Runs once per client, handing you a socket object scoped to that one connection — everything below is specific to this one client." },
          { code: 'socket.on("message", (data) => {', explanation: "Fires every time this client sends anything, at any point, unprompted — unlike a route handler, this isn't triggered by 'a request coming in' in the usual sense." },
          { code: 'socket.on("close", () => {', explanation: "Fires when the connection ends, whether the client closed it deliberately, lost network access, or crashed — this is where you'd clean up anything tracked for that client." },
        ],
      },
      {
        title: "Broadcasting to every connected client",
        code: `const clients = new Set();

wss.on("connection", (socket) => {
  clients.add(socket);

  socket.on("close", () => clients.delete(socket));

  socket.on("message", (data) => {
    // send this message out to everyone else connected
    for (const client of clients) {
      if (client !== socket && client.readyState === client.OPEN) {
        client.send(data.toString());
      }
    }
  });
});`,
        explanation: "A single socket only knows about itself — reaching every connected client (like a chat room) means the server has to keep its own list of open connections and loop over it, adding and removing entries as clients connect and disconnect.",
      },
      {
        title: "The same lifecycle in FastAPI",
        code: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()

@app.websocket("/ws")
async def chat(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"ack: {data}")
    except WebSocketDisconnect:
        print("client disconnected")`,
        language: "python",
        explanation: "await websocket.accept() completes the upgrade, the while True loop plays the same role as the 'message' event in Node (it just runs until the client sends something, over and over), and WebSocketDisconnect is FastAPI's way of surfacing the equivalent of the 'close' event.",
      },
    ],
    howItWorks: `
Once a WebSocket connection is accepted, the server holds it open and
both sides communicate through events rather than a single
request/response pair: a "connected" event, repeated "message" events
in either direction, and a "closed" event. Because the connection has
no built-in concept of "everyone in this chat room," broadcasting is
entirely the server's own responsibility — it has to keep some
in-memory collection of currently-open connections and iterate over it
to reach more than one client.

**Reconnection** is the client's responsibility, not the server's: a
dropped connection (a phone losing signal, a laptop sleeping) just
closes the socket, and a well-behaved client detects that and calls
\`new WebSocket(...)\` again, usually with a short backoff delay, to
reconnect on its own. The server doesn't "resume" an old connection —
it just sees a brand-new one arrive.

**Scaling** is where WebSockets get genuinely harder than a stateless
HTTP API: if a server keeps its list of connected clients only in its
own memory, and you run more than one server instance behind a load
balancer, a message from a client on server A can't reach a client
connected to server B just by looping over server A's local list. That
turns broadcasting into a distribution problem — every server instance
needs to hear about every message, typically by having each instance
publish incoming messages to a shared message broker (like Redis
pub/sub) that every other instance is also subscribed to, and re-send
them to its own locally connected clients.
    `.trim(),
    whyItExists: `
Polling an HTTP endpoint every few seconds to check "did anything
change?" wastes requests on "no" answers and still isn't fast enough for
things that genuinely need to feel instant. WebSockets exist so a
server can push a message the moment something happens, instead of
waiting for the client to ask again.
    `.trim(),
    whenToUse: `
Reach for a WebSocket for chat, live notifications, collaborative
editing, live dashboards, or multiplayer interactions — anything where
the server frequently has something to say before the client asks.
    `.trim(),
    whenNotToUse: `
For data that only changes occasionally, or where a few seconds of
staleness is fine, a normal request (or occasional polling) is far
simpler to build, test, and scale than a WebSocket — don't reach for a
persistent connection just because "real-time" sounds appealing.
    `.trim(),
    commonMistakes: [
      "Forgetting to remove a client from the tracked connections list on 'close'/WebSocketDisconnect, leaking references to dead connections and eventually crashing when the server tries to send to one.",
      "Assuming the server needs to handle reconnection — it doesn't; a dropped connection is just gone, and it's the client's job to detect that and open a new one.",
      "Keeping the list of connected clients only in one server's memory and expecting broadcasts to reach clients connected to a different server instance behind a load balancer.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Using the ws library, write the 'connection' and 'close' handlers needed to log when clients connect and disconnect." },
      { difficulty: "Medium", prompt: "Extend the broadcasting example so a message is echoed back to every connected client, including the sender." },
      { difficulty: "Hard", prompt: "Explain, step by step, why running three instances of the same WebSocket server behind a load balancer breaks naive in-memory broadcasting, and what changes would be needed to fix it." },
    ],
    interviewQuestions: [
      { question: "Why does broadcasting a message to all connected clients require extra work on the server, when a socket already exists for each client?", answer: "Each socket only knows about its own single connection — reaching every client requires the server to maintain its own collection of currently-open connections and iterate over it." },
      { question: "Whose responsibility is reconnection — the client's or the server's?", answer: "The client's — a dropped connection simply closes, and a well-behaved client detects that and opens a brand-new connection, typically with a short backoff delay." },
      { question: "Why does scaling WebSockets across multiple server instances complicate broadcasting?", answer: "Because each instance only knows about the clients connected directly to it, a message from a client on one instance can't reach a client on another instance without some shared mechanism (like a pub/sub message broker) that every instance subscribes to." },
      { question: "What actually happens during the handshake that upgrades a connection from HTTP to a WebSocket?", answer: "The client sends a normal HTTP request carrying an `Upgrade: websocket` header; if the server agrees, it responds with a 101 status code and both sides switch the same underlying TCP connection over to the WebSocket protocol, after which it stays open for two-way messages." },
      { question: "Why can't a WebSocket route be shaped like a typical `(req, res) => ...` handler?", answer: "There's no single request that produces one response — the connection instead triggers separate events over its lifetime (opened, each message, closed), so the code has to be organized around those events rather than a single call-and-return." },
      { question: "In the ws library example, what does the `'connection'` event handler run for?", answer: "It runs once per new client that connects, handing back a socket object scoped to that specific client — any `'message'`/`'close'` listeners registered inside it apply only to that one connection." },
      { question: "In the broadcasting example, why does the loop check `client !== socket`?", answer: "So a message is echoed to every other connected client but not back to the very client that just sent it — without that check, a sender would receive its own message echoed back to itself." },
      { question: "Why does the broadcasting loop also check `client.readyState === client.OPEN`?", answer: "A client's socket can still sit in the tracked collection while it's closing or already closed. Sending to a socket that isn't actually open anymore would throw or silently fail, so this guards against writing to a stale connection." },
      { question: "What would happen if a server never removed a socket from its tracked clients collection on close?", answer: "The collection would keep growing with references to dead connections that will never receive anything again — a memory leak, and eventually attempting to send to one of those dead sockets could throw an error that needs handling." },
      { question: "Debugging: a client disconnects and reconnects, but messages meant for them stop arriving even though the new connection succeeded. What's a likely bug?", answer: "The server is probably still tracking the old, closed socket object as 'this client' somewhere, instead of updating its tracking to the new socket object created by the fresh connection — a reconnect is a brand-new connection, not a resumed old one." },
      { question: "Why is detecting a dropped connection and reconnecting the client's job, not the server's?", answer: "The server has no way to distinguish 'this client is still there but silent for a while' from 'this client's connection quietly died' without the client itself noticing its own socket closed and acting on it — the server just sees a close event, or nothing at all." },
      { question: "Why do reconnection strategies typically use a backoff delay instead of retrying immediately in a tight loop?", answer: "Retrying instantly and repeatedly, especially from many clients at once (e.g. right after a server restart), could overwhelm the server with a flood of reconnect attempts — a backoff, often increasing between tries, spreads that load out and gives the server room to recover." },
      { question: "What is a heartbeat (ping/pong) mechanism used for in long-lived WebSocket connections?", answer: "Periodically sending a small ping and expecting a pong back lets either side detect a connection that's silently dead — e.g. the network dropped without a clean close — rather than waiting indefinitely for an underlying TCP timeout." },
      { question: "Why can't a server's in-memory list of connected clients be used directly to reach clients connected to a different server instance?", answer: "Each instance's list only contains the socket objects for connections made directly to it — a socket object simply can't be reached from a different process or machine, so another instance has no way to look up or send to it." },
      { question: "How does a message broker like Redis pub/sub solve the multi-instance broadcasting problem?", answer: "Every instance publishes incoming messages to a shared channel and subscribes to that same channel. When any instance publishes, every subscribed instance — including itself — receives it and forwards it to whichever of its own locally-connected clients should get it." },
      { question: "Scenario: with three server instances sharing state via Redis pub/sub, a client on instance A sends a chat message. Trace how a client on instance C receives it.", answer: "Instance A publishes the message to the shared channel; instance C, subscribed to that channel, receives it; instance C then loops over its own locally-connected sockets and sends the message directly to the client in question, the same way it would for a purely local broadcast." },
      { question: "Why does a load balancer typically need sticky sessions (session affinity) for WebSocket traffic specifically?", answer: "A WebSocket connection is one long-lived TCP connection to one specific instance — unlike stateless HTTP requests that can be freely routed per-request, all of a WebSocket's messages need to keep reaching that same instance for the life of the connection, or it breaks." },
      { question: "What's a practical reason to prefer a normal HTTP endpoint over a WebSocket for data that only changes occasionally?", answer: "A WebSocket requires holding a persistent connection open per client plus code to track and clean up connection state — for data where a few seconds of staleness is fine, that ongoing cost and complexity isn't justified when a plain request already solves it more simply." },
      { question: "Trap: a developer assumes that because a connection is 'always open,' incoming messages don't need their own validation beyond the initial handshake. Why is this risky?", answer: "A connection staying open doesn't mean every message on it should be trusted by default — unexpected or malicious content can arrive in any message at any point after connecting, so messages generally still need their own validation and authorization checks, not just a one-time check at connect time." },
      { question: "Why does the FastAPI example use a `while True` loop instead of a `'message'` event listener like the Node.js version?", answer: "FastAPI's WebSocket handling is built around async/await rather than events — `await websocket.receive_text()` blocks that handler until the next message arrives, so looping is what lets it keep handling messages one after another, functionally equivalent to a repeatedly-firing 'message' event." },
      { question: "What does `WebSocketDisconnect` represent in the FastAPI example, and why catch it with try/except rather than checking a return value?", answer: "It's an exception FastAPI raises when the connection closes, e.g. because the client disconnected mid-`receive_text()` call. Since `receive_text()` would otherwise hang waiting for a message that'll never come, catching this exception is how the code detects the connection ended and runs cleanup." },
      { question: "How is a WebSocket connection's statefulness fundamentally different from a typical REST request, beyond just staying open longer?", answer: "A REST request is stateless — the server handling it can, in principle, be swapped or scaled per-request with no memory required. A WebSocket connection has real, memory-resident state tied to one specific server process for its entire duration, which is exactly what makes horizontal scaling structurally harder." },
      { question: "Why would broadcasting via a shared database table be a poor choice for real-time messages, compared to pub/sub?", answer: "A database is built for durable storage and querying, not pushing new data to subscribers instantly. Every instance would need to continuously poll the table for new rows, adding latency and load, rather than being pushed a message the moment it's published, which pub/sub is specifically designed to do." },
      { question: "Advanced: what additional problem does horizontal scaling introduce for tracking who's currently connected, beyond message delivery?", answer: "A client's connected status now only lives in the memory of whichever specific instance they're connected to — answering whether a given user is online anywhere in the system requires checking across all instances or maintaining a shared, cross-instance record, not just consulting one instance's local list." },
      { question: "Follow-up: if a WebSocket connection requires authentication, at what point should that be checked?", answer: "Once, during the initial connection handshake, e.g. via a token in the connection request — matching how the connection's identity persists for its whole lifetime, rather than re-authenticating on every single message, though the app still needs a plan for what happens if that identity's permissions change while the connection stays open." },
    ],
    prerequisites: ["routing", "background-jobs"],
    relatedTopics: ["routing", "middleware", "background-jobs"],
    keywords: ["WebSocket", "real-time", "broadcasting", "reconnection", "scaling", "pub/sub", "ws", "connection lifecycle"],
  },
];
