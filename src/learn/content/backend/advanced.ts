import type { Topic } from "../../types/content";

export const backendAdvancedTopics: Topic[] = [
  {
    id: "api-versioning",
    title: "API Versioning",
    level: "advanced",
    description: "How to change an API over time without breaking the apps and clients that already use it.",
    explanation: `
Once an API is live, you rarely control everything that calls it. A
mobile app may be on thousands of phones, some not updated for months. A
partner may have built an integration against your endpoints. If you
rename a field, change what a status code means, or remove something you
thought was unused, those callers can break the moment you deploy.

**API versioning** lets you change an API while existing clients keep
working as before, usually by running several versions of an endpoint
side by side, at least for a while. Two common approaches:

- **URL versioning**: \`/v1/users\` vs. \`/v2/users\`.
- **Header versioning**: the same URL, with the client naming a version in a request header.
    `.trim(),
    analogy:
      "Think of a road under construction. You don't close the only bridge into town overnight. You build a new bridge next to the old one, run both for a while, and remove the old one only when you're sure nobody needs it.",
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
        explanation: "Old clients keep calling /v1/users and get the same response shape as always. New clients can opt into /v2/users for the improved shape.",
        walkthrough: [
          { code: 'app.get("/v1/users/:id", ...)', explanation: "The original contract, kept unchanged as long as any client depends on it." },
          { code: '{ id: req.params.id, name: "Ada Lovelace" }', explanation: "v1's response shape is frozen. Changing it would break every caller relying on a single 'name' field." },
          { code: 'app.get("/v2/users/:id", ...)', explanation: "A separate route, free to make a breaking change (splitting name into two fields) because v1's callers aren't affected." },
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
        explanation: "The URL never changes. The version the client sends in a header decides the response shape.",
      },
    ],
    howItWorks: `
Instead of changing an endpoint in place, you add a new version next to
it. That can be a new URL prefix (\`/v2/...\`), or a version read from a
header (sometimes a query parameter) that the code branches on.

Clients that send no version, or ask for the old one, keep the original
behavior indefinitely (or until an announced deprecation date). New
clients adopt the new version when they're ready.
    `.trim(),
    whyItExists: `
An API is a contract: callers trust that its shape and behavior won't
change under them. But software must evolve: fields get renamed,
responses improve, concepts get restructured. Versioning lets you
improve the design without being stuck with every past decision, and
without breaking clients you don't control or can't force to update.
    `.trim(),
    whenToUse: `
Add a new version when you need a **breaking** change (removing a field,
changing a field's type or meaning, changing what a status code means)
to an API that has external or independently deployed consumers.
    `.trim(),
    whenNotToUse: `
Purely additive changes, like a new optional field or a new endpoint,
usually don't need a new version: well-behaved clients ignore fields
they don't recognize. Versioning non-breaking changes just adds
maintenance.
    `.trim(),
    commonMistakes: [
      "Treating every change as breaking and creating new versions far more often than needed.",
      "Adding new versions but never retiring old ones, leaving an ever-growing pile to maintain.",
      "Changing an existing version's behavior 'just this once' instead of creating a new version, breaking clients who trusted it to stay stable.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain the difference between a breaking and a non-breaking API change, with one example of each." },
      { difficulty: "Medium", prompt: "Design /v1/ and /v2/ routes for a `/products/:id` endpoint where v2 adds a new required field that v1 didn't have." },
      { difficulty: "Hard", prompt: "Propose a plan for retiring an old API version: how would you warn existing clients, and how would you decide when it's safe to remove it?" },
    ],
    interviewQuestions: [
      { question: "Why is API versioning necessary?", answer: "An API is a contract other systems depend on, and breaking it can silently break clients you don't control. Versioning lets the API evolve while existing consumers keep working." },
      { question: "What's the difference between URL versioning and header versioning?", answer: "URL versioning puts the version in the path (like `/v2/users`), so it's visible and cacheable. Header versioning keeps one URL and the client names a version in a request header, so URLs stay stable." },
      { question: "Does every change to an API require a new version?", answer: "No. Usually only breaking changes (removing or restructuring fields, changing behavior clients rely on) need one. Purely additive changes usually don't." },
      { question: "What generally counts as a breaking change to an API?", answer: "Removing or renaming a field, changing a field's type or meaning, changing what a status code means, adding a new *required* request parameter, or restructuring the URL. Anything an existing, well-behaved client can't just ignore." },
      { question: "Give an example of a change that looks risky but usually isn't breaking.", answer: "Adding a new optional field to a response. Well-behaved clients only read fields they know and ignore the rest, so it doesn't need a new version." },
      { question: "Why is URL versioning considered more visible than header versioning?", answer: "The version is in the path, so it shows up in address bars, server logs, proxy config and cache keys. Nothing is hidden in request headers." },
      { question: "What's a downside of URL versioning?", answer: "You maintain two or more full sets of routes for one resource (`/v1/users` and `/v2/users`), which means duplicated route logic and more to keep working as versions pile up." },
      { question: "What's a downside of header versioning?", answer: "It's less discoverable: you can't paste a URL into a browser to see a version. Caching is trickier too, since one URL can return different bodies depending on a header a cache may not vary on by default." },
      { question: "In the header-versioning example, what version does a request get if it sends no `api-version` header at all?", answer: "Version 1. The handler reads `req.headers[\"api-version\"] || \"1\"`, so a missing header falls back to the original behavior instead of failing or using the newest version." },
      { question: "Why does defaulting a missing version header to the original version matter for backward compatibility?", answer: "Clients built before versioning existed keep working with no changes, instead of having to opt into 'version 1' explicitly to avoid breaking." },
      { question: "What's an alternative to a custom header for expressing an API version, using a standard HTTP mechanism?", answer: "Content negotiation with the `Accept` header, e.g. `Accept: application/vnd.myapi.v2+json`. The version uses HTTP's existing mechanism for choosing a response format instead of a custom header." },
      { question: "Why doesn't API versioning map cleanly onto semantic versioning (major.minor.patch)?", answer: "Semantic versioning tracks every release, including non-breaking additions. API versions usually only change for breaking changes, so a long run of additive changes may never need a new API version." },
      { question: "What is a deprecation window (or sunset period)?", answer: "An announced period when an old API version still works as before but is marked for removal, giving clients time to migrate." },
      { question: "How might a server communicate an upcoming version retirement to its clients?", answer: "With a `Sunset` or `Deprecation` response header, a warning field in the response body, changelog and docs entries, or direct contact with known API consumers." },
      { question: "Why is silently changing an existing version's behavior worse than releasing a proper new version?", answer: "It breaks the contract clients trusted, with no warning and no way to opt out or prepare. A new version keeps the old behavior running and makes the new one opt-in." },
      { question: "Scenario: you need to change a live endpoint's field from a string to a number. What's the safe way to do it?", answer: "Don't change the field's type in place. Either make the change in a new version, or add a new field next to the old one and deprecate the old field. Either way, clients relying on the current type keep working." },
      { question: "Why can adding a new *required* field to a request body be breaking, even though adding fields sounds additive?", answer: "Existing clients don't send the new field, so their requests fail validation as soon as it's required. Additive changes are only safe in responses, where unknown fields are ignored; a new required request field is something old clients can't provide." },
      { question: "What's the practical risk of letting old API versions pile up indefinitely?", answer: "Each version adds maintenance, testing and security-patching work, plus more room for subtle bugs. The mistake isn't adding versions; it's never retiring unused ones." },
      { question: "Debugging: a client explicitly requesting version 1 via the header is receiving the version 2 response shape. What's a likely bug?", answer: "The version check is probably wrong: comparing against the wrong type or string, or branching so the v2 path runs before the version check happens." },
      { question: "Why does API versioning usually require maintaining separate documentation per version?", answer: "Docs must describe each version's actual contract. Docs for the current shape would be wrong for a client still calling an older, differently shaped version." },
      { question: "Trap: a team assumes a breaking change to a GET endpoint is low-risk because 'nobody really uses GET responses directly.' Why is that reasoning unsafe?", answer: "Base versioning decisions on the resource's contract, not guesses about usage. Any independently deployed consumer could be parsing that GET response's exact shape, and you can't be sure none are." },
      { question: "How does API versioning differ from a feature flag, given that both can change server behavior for some requests but not others?", answer: "A feature flag toggles internal behavior in code you fully control, often for gradual rollout. Versioning keeps a stable, documented contract for external or independently deployed clients that can't be made to flip a flag on your schedule." },
      { question: "Follow-up: once traffic to an old version has dropped to nearly zero, is it safe to delete it immediately?", answer: "Not necessarily. 'Nearly zero' isn't zero, and a caller may still quietly rely on it. Confirm with logs and metrics, announce a firm removal date, and remove it only after that grace period." },
      { question: "Advanced: how can an API gateway reduce the internal cost of supporting multiple externally-visible versions?", answer: "The gateway can translate older-version requests and responses into what the current internal implementation expects. The backend keeps fewer diverging code paths while still exposing several versions externally." },
    ],
    prerequisites: ["routing", "error-handling-apis"],
    relatedTopics: ["testing-backend-code", "deployment-and-cicd"],
    keywords: ["api versioning", "breaking changes", "backward compatibility"],
  },
  {
    id: "dependency-injection",
    title: "Dependency Injection",
    level: "advanced",
    description: "Give a function or class the things it needs from outside, instead of letting it create them, so they're easy to swap or test.",
    explanation: `
Imagine a function that sends a welcome email and creates its own
connection to a real email service. That's fine until you test it:
every test run sends a real email over a real network and needs the
third-party service up and configured. You can't swap in a fake,
because the choice of service is buried inside the function.

**Dependency injection** flips this. Instead of creating its
dependencies, a function or class receives them from outside, usually
as parameters, so the caller controls what's used. A test passes a
fake, predictable email service; production passes the real one.
    `.trim(),
    analogy:
      "A kitchen that grows its own vegetables, raises its own chickens and mines its own salt is nearly impossible to inspect or adjust. A kitchen that gets ingredients from suppliers can swap one supplier for another, including, for a health inspection, ingredients prepared specially for testing.",
    examples: [
      {
        title: "Without dependency injection — hard to test",
        code: `const realEmailService = require("./realEmailService");

async function sendWelcomeEmail(user) {
  // The function decides, internally, exactly which service to use
  await realEmailService.send(user.email, "Welcome!");
}`,
        explanation: "This function can only use the real email service. You can't substitute anything without editing this file.",
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
        explanation: "The function no longer chooses the email service; it uses whatever is passed in. A test can supply a fake it can observe, without touching anything real.",
        walkthrough: [
          { code: "async function sendWelcomeEmail(user, emailService) {", explanation: "emailService arrives as a parameter instead of being created or imported inside the function." },
          { code: "await sendWelcomeEmail(user, realEmailService);", explanation: "In production, the caller passes the real dependency. The function's code never changes." },
          { code: "const fakeEmailService = { send: jest.fn() };", explanation: "In a test, a lightweight fake stands in: no network calls, no real emails, and its calls can be inspected." },
        ],
      },
    ],
    howItWorks: `
A function or class that needs something (a database connection, email
service, clock or logger) declares it as a parameter, or a constructor
argument in object-oriented code, instead of creating or importing it
inside its body.

Whoever calls it (production code, a test, or wiring set up at app
startup) decides which implementation to pass. Large apps may use a
**dependency injection container** to automate that wiring, but the
idea is the same at any scale: the dependency comes from outside.
    `.trim(),
    whyItExists: `
Code that builds its own dependencies is rigid: it can only run and be
tested against the real ones, which is often slow, flaky or impossible
in tests (you don't want tests charging real credit cards). Dependency
injection separates *what* code needs from *which implementation*
provides it, so code is much easier to test in isolation and to
reconfigure without editing its internals.
    `.trim(),
    whenToUse: `
Use it for anything that talks to the outside world (databases,
external APIs, the filesystem, the current time), especially in code you
want to unit test without those real dependencies.
    `.trim(),
    whenNotToUse: `
Small, self-contained functions with no external dependencies (like a
pure function that formats a date) have nothing to inject. Adding
indirection there is just noise.
    `.trim(),
    commonMistakes: [
      "Importing a real dependency directly inside a function, then finding it impossible to test in isolation.",
      "Over-engineering injection for simple, pure logic with no external dependencies to swap.",
      "Injecting a dependency but still using a global or imported copy elsewhere in the same code path, defeating the purpose.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Rewrite a function that calls `Date.now()` internally so the current time is passed in as a parameter instead." },
      { difficulty: "Medium", prompt: "Refactor a function that imports and uses a real database client so it accepts the client as a parameter instead." },
      { difficulty: "Hard", prompt: "Write a test for `chargeCustomer(order, paymentService)` using a fake `paymentService`, and explain what real-world problems that avoids compared with testing against the real payment provider." },
    ],
    interviewQuestions: [
      { question: "What is dependency injection?", answer: "A design approach where a function or class receives what it depends on from outside (usually as parameters or constructor arguments) instead of creating or importing it internally." },
      { question: "Why does dependency injection make code easier to test?", answer: "A test can pass a fake, predictable version of a dependency (like a fake email service or database) instead of the real one, avoiding slow, flaky or unsafe real side effects." },
      { question: "Give an example of a dependency worth injecting rather than hardcoding.", answer: "An external service client (email, payments, a database connection), or even the current time: anything a test would want to replace with a controlled fake." },
      { question: "What's the difference between constructor injection and parameter injection?", answer: "Constructor injection passes dependencies when an object is created and stores them on the instance (e.g. `this.db`) for every method. Parameter injection passes a dependency into one function call only." },
      { question: "Why might constructor injection suit a class better than parameter injection, if many of its methods all need the same database connection?", answer: "It avoids threading the same parameter through every method's signature. The dependency is supplied once at construction, and every method uses `this.db`." },
      { question: "What is inversion of control, and how does dependency injection relate to it?", answer: "Inversion of control is the principle that a component shouldn't decide how its dependencies are built or found. Dependency injection is one way to achieve it: the choice of *which* implementation to use moves outward, to whoever wires the component up." },
      { question: "What problem does a dependency injection container solve as an application grows?", answer: "It builds and wires a whole graph of dependencies from registered rules, so you don't thread every dependency through every layer by hand." },
      { question: "How does NestJS build dependency injection into the framework itself?", answer: "A NestJS class lists what it needs as constructor parameters, and NestJS's container builds and supplies matching instances at runtime. You rarely construct a dependency by hand." },
      { question: "In FastAPI, how does `Depends()` implement dependency injection for a route handler?", answer: "A route parameter's default is set to `Depends(some_function)`. FastAPI calls `some_function` and injects its return value as the argument, so the handler never builds that dependency itself." },
      { question: "What's the difference between a stub, a mock, and a fake, as types of test doubles?", answer: "A stub returns preset values and doesn't check how it was called. A mock records calls so a test can assert specific interactions. A fake is a simplified but working implementation, like an in-memory database in place of a real one." },
      { question: "In the sendWelcomeEmail example, why is `jest.fn()` specifically useful as the fake `emailService.send`?", answer: "`jest.fn()` creates a mock function that records every call, so the test can assert exactly which arguments were passed. A plain stub that just returns a value can't check that." },
      { question: "What is the service locator pattern, and why is it often considered worse than dependency injection?", answer: "A class asks a central registry for its dependencies by name or type at runtime, instead of receiving them as parameters. That hides the class's real dependencies in its body and makes testing harder, since a test must configure the shared locator instead of just passing a fake." },
      { question: "Why does dependency injection often go hand-in-hand with depending on an interface rather than a concrete class?", answer: "The consumer only needs the shape it depends on (e.g. 'something with a `.send()` method'), not which class provides it. That's what lets you swap a real service for a fake without touching the consumer's code." },
      { question: "Debugging: a test injects a fake database, but the function under test still hits the real one. What's a likely cause?", answer: "The function probably still imports and uses the real database client somewhere in its body, besides the injected parameter. Injecting one copy while using a global or imported one elsewhere defeats the point." },
      { question: "Given `async function sendWelcomeEmail(user, emailService) { await emailService.send(...) }`, what happens if it's called as `sendWelcomeEmail(user)` with no second argument?", answer: "`emailService` is `undefined`, so calling `.send(...)` throws a TypeError at runtime. Dependency injection makes the caller responsible for passing a valid dependency; this is what happens when it forgets." },
      { question: "Trap: a developer adds dependency injection to a pure function like `add(a, b)`. What's wrong with that?", answer: "There's nothing to swap or fake. A pure function with no external dependencies gains no testability from injection, only an extra parameter and indirection." },
      { question: "What is a singleton dependency lifetime in a DI container, and when is it appropriate?", answer: "The container builds the dependency once and gives the same shared instance to every consumer. Use it for something stateless or expensive to build, like a database connection pool, where creating a new one per use would be wasteful or wrong." },
      { question: "How does a transient lifetime differ from a singleton one?", answer: "A transient dependency is built new every time it's requested, not shared. Use it when instances must not carry state between uses, at the cost of paying construction overhead each time." },
      { question: "Why is dependency injection considered especially important for code that talks to the outside world, like databases or the filesystem?", answer: "Those dependencies are slow, non-deterministic, stateful, or unsafe to use for real in automated tests. Swapping in a controlled fake is what makes that code testable at all." },
      { question: "Scenario: you need to test a function that checks 'is this coupon still valid?' based on the current time. How does injecting the clock help?", answer: "The test passes a fixed, known timestamp instead of the real current time, so it's deterministic and repeatable whenever it runs, including at a boundary like midnight that a real clock can't reliably reproduce." },
      { question: "What's a real cost of taking 'program to an interface' too far when applying dependency injection?", answer: "Adding an interface and injection point for a dependency that will only ever have one implementation adds boilerplate and indirection with no real testability or flexibility gain." },
      { question: "How does dependency injection support the single responsibility principle?", answer: "A class that builds its own dependencies does two jobs: its own logic, and deciding how to build or configure a collaborator. Injection removes the second job, so the class focuses on its logic." },
      { question: "Why inject a logger instance instead of importing a global logger directly?", answer: "A test can inject a no-op or in-memory logger to keep output clean and assert on what was logged. Different environments (production, a CLI tool, a test run) can get different logging without changing the function's code." },
      { question: "How is dependency injection different from just passing plain configuration values, like a port number, as parameters?", answer: "Dependency injection means supplying behavior: an object with methods the code calls, like a service or client. Passing plain data, like a config value, isn't usually what 'dependency injection' means on its own." },
      { question: "Follow-up: once a database dependency is injected into a function, how do you avoid every caller having to explicitly pass it at every call site?", answer: "Wire the real dependency once at the app's composition root at startup, or let a DI container manage it, so it flows through from one place instead of being passed by hand at every layer." },
      { question: "What real-world problem does injecting a fake payment service avoid, compared to testing against a real payment provider?", answer: "It avoids charging a real card, needing network access to a third party, and slow or flaky test runs caused by that service's availability or rate limits." },
      { question: "How does a module-mocking tool like `jest.mock()` achieve a similar benefit to dependency injection without changing a function's signature?", answer: "It intercepts module resolution and swaps a module's real implementation for a mock wherever it's imported. You get a similar testing benefit by replacing the import, without the function taking the dependency as a parameter." },
      { question: "Trap: a test's fake service has a different method signature than the real service it replaces. What risk does this create?", answer: "The test can keep passing while the fake quietly drifts from the real dependency's contract, giving false confidence. Keep fakes honest against the real interface, for example by having both implement a shared, typed interface." },
      { question: "Why is dependency injection often described as a form of loose coupling?", answer: "The consumer depends only on an abstract need ('something that can send an email'), not the specific module that provides it. The two are connected only by what's passed in at the call site, so either can change independently." },
    ],
    prerequisites: ["error-handling-apis"],
    relatedTopics: ["testing-backend-code"],
    keywords: ["dependency injection", "testability", "inversion of control", "mocking"],
  },
  {
    id: "testing-backend-code",
    title: "Testing Backend Code",
    level: "advanced",
    description: "Checking one small piece of logic on its own versus checking that a real request flows correctly through the whole app.",
    explanation: `
As a backend grows, checking by hand (clicking around or sending
requests yourself) gets slower and less reliable with each feature.
Automated tests do that checking quickly and repeatedly. But tests
differ in what they check and how much of the app they cover.

A **unit test** checks one small piece of logic, usually a single
function, on its own. It often replaces dependencies with fakes (see
dependency injection) so it tests only that function.

An **integration test** sends a real request through the running app
(routing, middleware, and often a real or realistic test database) and
checks that the whole chain gives the right result.
    `.trim(),
    analogy:
      "A unit test is like testing one car part on a bench: does this brake pad grip under pressure? An integration test is a test drive of the assembled car: you check that the brakes, engine and steering work together as a system.",
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
        explanation: "This test never starts a server or touches a network. It calls the function and checks the result, so it's very fast and focused.",
        walkthrough: [
          { code: "function calculateDiscount(price, percentOff) {", explanation: "Small, self-contained logic with no external dependencies: ideal for a unit test." },
          { code: 'expect(calculateDiscount(100, 20)).toBe(80);', explanation: "Calls the function with known input and checks the exact expected output. Nothing else is involved." },
          { code: 'expect(() => calculateDiscount(100, 150)).toThrow();', explanation: "Also checks the failure path: invalid input is rejected as the function promises." },
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
        explanation: "This test sends a real HTTP request through the app's routing and middleware and checks the full response as a client would see it, not just one internal function.",
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
        explanation: "TestClient wraps a FastAPI app the way supertest wraps an Express app. It sends real requests through routing, dependencies and validation, and lets you assert on the real response, without a live server.",
      },
    ],
    howItWorks: `
Unit tests call a function or method directly, usually with fake
dependencies (see dependency injection), so the test stays fast,
isolated and unaffected by anything outside that function.

Integration tests run through the app as a whole, usually by simulating
an HTTP request against the real routing and middleware, often with a
real but test-only database. They check that the pieces really work
together.
    `.trim(),
    whyItExists: `
Unit tests alone can all pass while the app is broken: if two correct
functions are wired together wrongly, no unit test catches it.
Integration tests alone are slower, and a failure may not tell you which
function is at fault.

The two catch different problems at different speeds. A healthy suite
has many fast unit tests plus fewer integration tests for the critical
paths.
    `.trim(),
    whenToUse: `
Write unit tests for business logic, especially logic with several
branches or edge cases (like a discount calculation or validation rule).
Write integration tests for critical paths users actually take end to
end, like signing up, logging in or placing an order.
    `.trim(),
    whenNotToUse: `
Don't write an integration test for something a unit test checks just
as well, faster and more reliably. Starting the whole app to check that
a pure calculation returns the right number is wasted overhead.
    `.trim(),
    commonMistakes: [
      "Writing only unit tests and never checking that the pieces work when wired together.",
      "Writing only integration tests, giving a slow suite where a failure is hard to trace to its cause.",
      "Letting integration tests call real external services (a real payment provider or third-party API) instead of test doubles, making the suite flaky and slow.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a unit test for an `isValidEmail(email)` function, covering a valid and an invalid case." },
      { difficulty: "Medium", prompt: "Write an integration test for a POST /login route that checks it returns 200 with valid credentials and 401 with invalid ones." },
      { difficulty: "Hard", prompt: "Describe a case where all unit tests pass but an integration test fails, and what that reveals about where the bug lives." },
    ],
    interviewQuestions: [
      { question: "What's the difference between a unit test and an integration test?", answer: "A unit test checks one isolated piece of logic, usually with fake dependencies. An integration test checks that several real parts of the app (routing, middleware, often a database) work together." },
      { question: "Why might all unit tests pass while the app is still broken?", answer: "Unit tests check pieces in isolation. If the pieces are wired together wrongly, no single unit test catches it, because no single piece is broken." },
      { question: "Why do integration tests typically run slower than unit tests?", answer: "They run more of the real system (routing, middleware, often a real or realistic database) instead of one function, so each test does more work." },
      { question: "What is a test double, and what are the main kinds?", answer: "Anything that stands in for a real dependency in a test. The main kinds: stubs (return canned values), mocks (record calls so you can assert on them), fakes (simplified but working implementations), and spies (wrap a real function and observe calls)." },
      { question: "What's the difference between a stub and a mock?", answer: "A stub returns preset responses and doesn't check how it was called. A mock records calls so the test can assert on them, like 'was called exactly once with these arguments.'" },
      { question: "What is a spy, as distinct from a mock?", answer: "A spy wraps a real function and records how it was called, optionally still running the real implementation. A mock usually replaces the real implementation entirely." },
      { question: "What does supertest actually do when you call `request(app).get(...)`?", answer: "It runs the real Express app in memory and sends a real HTTP request through its routing and middleware, then returns the actual response, without binding to a network port." },
      { question: "In the FastAPI example, what does `TestClient(app)` let you do that hitting a live server wouldn't?", answer: "Send requests straight to the app object in-process, exercising its real routing, dependency injection and validation, with no live server process or open port." },
      { question: "In the FastAPI test, why does `test_get_missing_product_returns_404` assert on a status code instead of expecting an exception?", answer: "The handler is expected to handle 'not found' itself and return a 404 response, not let an exception escape. The test checks the API's documented failure-path contract." },
      { question: "What is the test pyramid, and what shape does it describe for a healthy test suite?", answer: "A large base of fast, cheap unit tests, a smaller middle layer of integration tests, and very few slow end-to-end tests. Bugs are usually cheaper and faster to catch lower down the pyramid." },
      { question: "Why is `calculateDiscount` from the example a good candidate for a unit test specifically?", answer: "It's pure: the same input always gives the same output, with no network or database. Calling it directly fully checks its behavior with no setup." },
      { question: "What makes a test flaky, and why is that a serious problem?", answer: "A flaky test sometimes passes and sometimes fails on the same code, usually because it depends on something non-deterministic like real timing or network calls. It erodes trust in the suite, so failures get re-run instead of investigated." },
      { question: "Why do integration tests typically run against a real but test-only database, rather than the production one?", answer: "Tests can create, change and delete data without corrupting real user data, and the suite can start from a known, resettable state every run." },
      { question: "What is test isolation, and why does it matter across a suite?", answer: "Each test is independent of side effects from other tests, so tests can run in any order, in parallel, or alone. One failure shouldn't cause unrelated failures elsewhere." },
      { question: "Scenario: a signup endpoint's test suite starts failing whenever the tests run in a different order. What does that suggest?", answer: "The tests probably share state, e.g. relying on a row an earlier test inserted, or not cleaning the database between runs. That's a test isolation problem, not necessarily a bug in signup." },
      { question: "What is arrange-act-assert, as a structure for writing a test?", answer: "Arrange sets up inputs, fakes or state. Act calls the function or makes the request. Assert checks the outcome against what's expected. It keeps tests readable and focused." },
      { question: "Why is `expect(() => calculateDiscount(100, 150)).toThrow()` written with a wrapping function instead of calling `calculateDiscount(100, 150)` directly inside `expect`?", answer: "Calling it directly would throw on that line, before the test framework can catch it. Wrapping it lets the framework call it and catch the expected exception." },
      { question: "What is code coverage, and what's a common misconception about it?", answer: "The percentage of code the test suite runs. The misconception is that high coverage proves correctness. A line can run without its output ever being asserted, so coverage measures exposure to tests, not how well they check." },
      { question: "Why test a login route's 401 response, rather than only its success case?", answer: "Rejecting bad credentials is as much a part of the endpoint's contract as accepting good ones. Untested failure paths are a common source of security and correctness bugs." },
      { question: "What's a mocking library's role when testing code that calls an external HTTP API?", answer: "It intercepts the outgoing call and returns a controlled, preset response instead of using the network. The test stays fast, deterministic, and independent of the third party's availability." },
      { question: "Trap: a test mocks every database call so it always returns success, and the test passes — but the real integration is broken. What does this reveal?", answer: "Over-mocking, even in a test meant to be an integration test, can hide real wiring or contract mismatches. Some tests must use the real (or a realistic) dependency to prove things integrate correctly." },
      { question: "Why does FastAPI's `TestClient` behave 'the same way supertest wraps an Express app'?", answer: "Both send a simulated HTTP request straight into the real app object in-process, exercising the real routing, middleware and validation, without starting a network server." },
      { question: "What is a snapshot test, and what's a risk of relying on it too heavily?", answer: "It saves some output on the first run, and later runs compare against it. The risk is developers 'updating the snapshot' whenever it changes without checking the new output is correct, turning the test into a rubber stamp." },
      { question: "How would you unit test a function that checks 'has this session expired?' without it being flaky?", answer: "Pass the current time in as a parameter instead of calling `Date.now()` inside (see dependency injection). The test can then use a fixed timestamp and assert deterministic behavior around it." },
      { question: "What's the practical tradeoff of writing an integration test for something a unit test could verify just as well?", answer: "It runs slower and needs more setup, like a running app and test database. When it fails, a broken piece buried in a long request/response chain is harder to find than with a focused unit test." },
      { question: "Why is a suite with many end-to-end tests and almost no unit tests usually a sign of a problem?", answer: "It inverts the test pyramid. The suite is slow, and a failing test only shows that something in a long chain broke, not which piece, so failures are much harder to pinpoint." },
      { question: "Debugging: an integration test for `GET /products/:id` passes locally but fails in CI with a connection error. What's a likely cause?", answer: "Something the test needs isn't available in CI as it is locally: e.g. no test database is running or seeded, or the app under test was never started before the request was sent." },
      { question: "Beyond speed, what does letting integration tests depend on real external services cost a suite?", answer: "The suite's pass/fail result then depends on that service's uptime, rate limits and data, which adds nondeterminism. It can also cause real side effects, like charging a card or sending a real email, just by running tests." },
      { question: "Why might you choose an in-memory fake database over a plain mock for testing a repository layer?", answer: "A fake really implements query and storage behavior, even if simplified, so it can catch bugs in how the repository queries or filters data. A mock returning canned values doesn't exercise that logic." },
      { question: "Follow-up: after adding dependency injection to `chargeCustomer(order, paymentService)`, what specifically becomes testable that wasn't before?", answer: "The function's own logic (what to charge, how to handle the service's responses and errors) can be tested with a fake payment service, without a real charge or the real provider being reachable." },
    ],
    prerequisites: ["dependency-injection"],
    relatedTopics: ["dependency-injection", "api-versioning", "deployment-and-cicd", "python-web-frameworks"],
    keywords: ["unit testing", "integration testing", "test doubles", "supertest"],
  },
  {
    id: "deployment-and-cicd",
    title: "Deployment & CI/CD Basics",
    level: "advanced",
    description: "What happens between pushing a code change and that change running live for real users.",
    explanation: `
Code that works on your laptop still has to reach a real server that
users can access, without breaking what already works. Doing that by
hand (copying files, restarting things, hoping nothing was forgotten)
is slow and error-prone, especially as a team grows.

**CI/CD** stands for **Continuous Integration** and **Continuous
Deployment** (or **Delivery**):

- Continuous integration: every change is built and tested automatically when it's pushed, so problems are caught early instead of piling up.
- Continuous deployment (or delivery): once a change passes those checks, it ships to production automatically (or with one click), using the same repeatable steps every time.
    `.trim(),
    analogy:
      "Think of a factory assembly line versus one craftsperson building each product by hand. The line runs the same checks and steps on every item (the same inspection, the same packaging), catching defects early and shipping consistently, instead of relying on someone to remember every step each time.",
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
        explanation: "On every push, this pipeline installs dependencies, builds the project and runs the tests, so nobody has to remember to.",
        walkthrough: [
          { code: "on: [push]", explanation: "The trigger: the pipeline runs automatically on every push, with no manual step." },
          { code: "- run: npm test", explanation: "If any test fails, the pipeline stops and reports failure, catching a broken change before it reaches production." },
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
        explanation: "The deploy job only runs if the test job succeeds, so broken code never reaches production.",
      },
    ],
    howItWorks: `
On each push, a CI/CD system runs a defined sequence: install
dependencies, build the project (if needed), run the tests, and
sometimes extra checks like linting or security scanning.

If every step passes, a deploy step can run: package the app (often as
a container image), push it to a hosting platform or server, and switch
live traffic to the new version. Ideally there's a quick way to roll
back if something still goes wrong once it's live.
    `.trim(),
    whyItExists: `
Manual deployment is slow, inconsistent, and depends on someone
remembering every step every time, which fails as a team and codebase
grow. CI/CD makes shipping repeatable, automated and verified: every
change gets the same checks, and getting a fix live becomes fast and
low-risk instead of a stressful manual ritual.
    `.trim(),
    whenToUse: `
Set up CI at the start of any real project; even one automated test run
per push catches obvious mistakes early. Add continuous deployment once
your tests give you confidence that a passing pipeline means the change
is safe to ship.
    `.trim(),
    whenNotToUse: `
For a throwaway prototype or a script you'll run once by hand, a full
pipeline is unnecessary ceremony. It pays off when code is deployed and
changed repeatedly.
    `.trim(),
    commonMistakes: [
      "Deploying automatically even when tests fail, which defeats the point of tests gating the pipeline.",
      "Having no quick way to roll back a bad deployment once it's live.",
      "Treating a green pipeline as proof everything is fine, when the tests don't cover the part that broke.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Describe, in order, the steps you'd expect a CI pipeline to run for a typical Node.js backend." },
      { difficulty: "Medium", prompt: "Explain why a deploy step should only run after the test step succeeds, and what could go wrong otherwise." },
      { difficulty: "Hard", prompt: "Describe a rollback strategy for a deployment whose serious bug is found only after it reached production." },
    ],
    interviewQuestions: [
      { question: "What does CI/CD stand for, and what does each part mean?", answer: "Continuous Integration: automatically building and testing every change as it's pushed. Continuous Deployment/Delivery: automatically or reliably shipping a change that passes those checks to production." },
      { question: "Why is it important that deployment only happens after tests pass?", answer: "It stops broken or untested code from reaching production automatically. The test suite is a gate every change must pass." },
      { question: "Why is manual deployment risky as a team or codebase grows?", answer: "It relies on a person doing every step correctly every time, which gets more error-prone and inconsistent as complexity and team size grow." },
      { question: "What is a blue-green deployment?", answer: "Two identical production environments: 'blue' (live) and 'green' (the new version). Green is deployed and checked while blue serves all traffic, then traffic switches to green at once, leaving blue as an instant rollback target." },
      { question: "What is a rolling deployment?", answer: "New instances come up and old ones go down a few at a time, instead of switching everything at once. During the rollout, old and new versions both serve live traffic." },
      { question: "What's a key tradeoff between blue-green and rolling deployment?", answer: "Blue-green needs double the infrastructure at once but gives instant, clean rollback with no mixed-version traffic. Rolling needs less extra infrastructure but runs old and new side by side, which is a problem if they aren't compatible." },
      { question: "What is a canary deployment?", answer: "The new version goes to a small share of real traffic or users first and is monitored, then rolled out further once it looks healthy. This limits the damage of a bad deploy compared with shipping to everyone." },
      { question: "Why does a database migration need special care during a rolling or blue-green deployment?", answer: "Old and new code use the same database during the rollout. A migration that removes or renames a column the old code still uses breaks the old instances before they're retired." },
      { question: "What is a CI pipeline's build step generally responsible for, beyond installing dependencies?", answer: "Compiling or transpiling code, bundling assets, or otherwise producing the runnable artifact that is then tested and deployed, e.g. type-checking plus bundling for a TypeScript project." },
      { question: "Why does `needs: test` on the deploy job matter mechanically, not just as convention?", answer: "It tells the CI system not to start the deploy job until the test job has finished and succeeded. If tests fail, deploy is actually skipped, not just expected to be." },
      { question: "What's the difference between continuous delivery and continuous deployment?", answer: "Continuous delivery makes every passing change ready to release, usually with one manual approval to ship. Continuous deployment ships it to production automatically, with no manual step." },
      { question: "Why is a build artifact often packaged as a container image?", answer: "A container image bundles the app with its exact runtime and dependencies, so it runs the same everywhere and the tested environment matches the one it runs in." },
      { question: "Why should the same build artifact that passed CI be the one deployed, rather than rebuilding from source at deploy time?", answer: "Rebuilding risks a different result (a dependency resolving differently, an environment difference), so what ships was never what was tested. Reusing the same artifact guarantees what was tested is what ships." },
      { question: "What does rollback mean in a deployment context, and why does it need to be fast?", answer: "Reverting production to the last known-good version after a bad deploy is found. The longer a broken version is live, the more users and requests it affects, so slow rollback extends the damage." },
      { question: "How does blue-green deployment make rollback close to instant?", answer: "The previous version, blue, is still running and untouched after the switch. Rolling back just routes traffic back to blue, with no rebuild or redeploy." },
      { question: "Scenario: a deploy passes CI, ships, and real users then hit errors no test caught. What does this reveal?", answer: "A green pipeline only proves the existing tests passed. It says nothing about behavior they never exercised, so this points to a coverage gap for that code path, not a broken pipeline." },
      { question: "What is a health check, and what role does it play during a deployment?", answer: "An endpoint or process that reports whether an instance is healthy and ready for traffic. The deployment system uses it to decide whether new instances can take traffic, or to halt a rollout automatically if they keep failing." },
      { question: "Why might a CI pipeline include a linting step in addition to tests?", answer: "Linting catches problems tests don't check directly (style inconsistencies, unused variables, some likely bugs) by analyzing the code without running it." },
      { question: "Trap: a team's CI pipeline is green, but they still deploy manually by copying files to a server 'for now.' What risk does this defeat?", answer: "A passing pipeline isn't a safety guarantee if deployment isn't the same automated, repeatable process every time. Manual deployment brings back exactly the human error CI/CD exists to remove, however solid the CI checks are." },
      { question: "What secrets-related concern is specific to CI/CD pipelines?", answer: "Pipelines often need credentials (deploy keys, API tokens) to deploy. Store them securely, e.g. as encrypted pipeline secrets, not in the pipeline definition file, which anyone with repo access can often see." },
      { question: "Why run the same test suite on every pull request, not just on the main branch after merging?", answer: "Catching a problem before merge means a broken change never lands on the branch others build on, instead of being found and reverted later." },
      { question: "What does it mean for a deployment pipeline to be idempotent, and why does that matter?", answer: "Running the same deploy step twice (e.g. after a retry) gives the same end result instead of compounding the effect. It matters because pipelines sometimes retry steps after transient failures, like a flaky network call." },
      { question: "Follow-up: is a fast rollback path alone enough to guarantee a bad deploy is safe?", answer: "No. You also need monitoring and alerting to detect the bad deploy quickly. A fast rollback that only happens after users have been affected for hours limits far less damage than it could." },
      { question: "How does a canary deployment differ from A/B testing, even though both route a subset of traffic differently?", answer: "A canary is about deployment safety: checking the new version works before a full rollout, usually briefly. A/B testing compares two versions' real-world outcomes, often over longer, to decide which is better, not to safety-check a release." },
      { question: "Advanced: why might a rolling deployment be a poor fit for a breaking database schema change, even with careful ordering?", answer: "Old and new code must both work with whatever schema exists during the rollout. Some schema changes have no safe intermediate state that satisfies both, so you need another strategy, like a multi-step expand-and-contract migration." },
    ],
    prerequisites: ["testing-backend-code", "background-jobs"],
    relatedTopics: ["testing-backend-code", "env-vars-and-config"],
    keywords: ["ci/cd", "continuous integration", "continuous deployment", "deployment pipeline"],
  },
  {
    id: "websockets-in-practice",
    title: "Building with WebSockets",
    level: "advanced",
    description: "What changes on the server when a connection stays open: handling events, pushing messages, broadcasting, and handling clients that drop.",
    explanation: `
A WebSocket connection is a real-time, two-way upgrade of a normal HTTP
request. Working with one mostly means understanding what differs from a
normal request handler:

- The connection stays open instead of closing after one response.
- Either side can send a message at any moment.
- To reach more than one client, your server must track who's connected.

So a WebSocket route isn't shaped like \`(req, res) => ...\`. It's shaped
like: "a connection opened; here's what to do with each message; here's
what to do when it closes."
    `.trim(),
    analogy:
      "A normal API route is a phone call: dial, ask one question, get one answer, hang up. A WebSocket is a walkie-talkie left on: it stays open, either person can talk at any time, and to reach a whole group you must keep a list of everyone whose walkie-talkie is on.",
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
        explanation: "The whole lifecycle in one place: 'connection' fires once when a client connects, 'message' fires each time that client sends something, and 'close' fires when the connection ends. There's no single request/response pair.",
        walkthrough: [
          { code: 'wss.on("connection", (socket) => {', explanation: "Runs once per client and gives you a socket for that one connection. Everything inside is specific to this client." },
          { code: 'socket.on("message", (data) => {', explanation: "Fires whenever this client sends anything, unprompted. Unlike a route handler, it isn't triggered by 'a request coming in' in the usual sense." },
          { code: 'socket.on("close", () => {', explanation: "Fires when the connection ends, whether the client closed it, lost network, or crashed. Clean up anything tracked for that client here." },
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
        explanation: "A socket only knows about itself. To reach every client (like a chat room), the server keeps its own list of open connections, loops over it, and adds or removes entries as clients connect and disconnect.",
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
        explanation: "await websocket.accept() completes the upgrade. The while True loop plays the role of Node's 'message' event, waiting for each message in turn. WebSocketDisconnect is FastAPI's equivalent of the 'close' event.",
      },
    ],
    howItWorks: `
Once a WebSocket connection is accepted, the server keeps it open and
both sides talk through events instead of one request/response pair: a
"connected" event, repeated "message" events in either direction, and a
"closed" event. The connection has no idea of "everyone in this chat
room", so broadcasting is the server's job: it keeps an in-memory
collection of open connections and loops over it.

**Reconnection** is the client's job, not the server's. A dropped
connection (a phone losing signal, a laptop sleeping) just closes the
socket. A well-behaved client notices and calls \`new WebSocket(...)\`
again, usually after a short backoff delay. The server doesn't "resume"
the old connection; it just sees a new one arrive.

**Scaling** is where WebSockets get harder than a stateless HTTP API. If
each server keeps its client list only in memory and you run several
instances behind a load balancer, a message from a client on server A
can't reach a client on server B by looping over A's local list.

Broadcasting becomes a distribution problem: every instance must hear
every message. Typically each instance publishes incoming messages to a
shared message broker (like Redis pub/sub) that all instances subscribe
to, and each re-sends them to its own connected clients.
    `.trim(),
    whyItExists: `
Polling an HTTP endpoint every few seconds ("did anything change?")
wastes requests on "no" answers and still isn't fast enough for things
that must feel instant. WebSockets let the server push a message the
moment something happens, instead of waiting for the client to ask.
    `.trim(),
    whenToUse: `
Use a WebSocket for chat, live notifications, collaborative editing,
live dashboards or multiplayer features: anywhere the server often has
something to say before the client asks.
    `.trim(),
    whenNotToUse: `
For data that changes rarely, or where a few seconds of staleness is
fine, a normal request (or occasional polling) is far simpler to build,
test and scale. Don't use a persistent connection just because
"real-time" sounds appealing.
    `.trim(),
    commonMistakes: [
      "Not removing a client from the tracked list on 'close'/WebSocketDisconnect. This leaks references to dead connections and eventually crashes when the server sends to one.",
      "Assuming the server handles reconnection. It doesn't: a dropped connection is gone, and the client must detect that and open a new one.",
      "Keeping the client list only in one server's memory and expecting broadcasts to reach clients on other instances behind a load balancer.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Using the ws library, write the 'connection' and 'close' handlers to log when clients connect and disconnect." },
      { difficulty: "Medium", prompt: "Extend the broadcasting example so a message is echoed to every connected client, including the sender." },
      { difficulty: "Hard", prompt: "Explain step by step why running three instances of a WebSocket server behind a load balancer breaks naive in-memory broadcasting, and what you'd change to fix it." },
    ],
    interviewQuestions: [
      { question: "Why does broadcasting a message to all connected clients require extra work on the server, when a socket already exists for each client?", answer: "Each socket only knows its own connection. To reach every client, the server must keep its own collection of open connections and loop over it." },
      { question: "Whose responsibility is reconnection — the client's or the server's?", answer: "The client's. A dropped connection just closes, and a well-behaved client notices and opens a new connection, usually after a short backoff delay." },
      { question: "Why does scaling WebSockets across multiple server instances complicate broadcasting?", answer: "Each instance only knows the clients connected to it. A message from a client on one instance can't reach a client on another without a shared mechanism, like a pub/sub broker every instance subscribes to." },
      { question: "What actually happens during the handshake that upgrades a connection from HTTP to a WebSocket?", answer: "The client sends a normal HTTP request with an `Upgrade: websocket` header. If the server agrees, it replies with status 101, and both sides switch the same TCP connection to the WebSocket protocol, which then stays open for two-way messages." },
      { question: "Why can't a WebSocket route be shaped like a typical `(req, res) => ...` handler?", answer: "There's no single request producing one response. The connection fires separate events over its life (opened, each message, closed), so the code is organized around those events." },
      { question: "In the ws library example, what does the `'connection'` event handler run for?", answer: "It runs once per new client and gives you a socket for that client. Any `'message'`/`'close'` listeners registered inside apply only to that connection." },
      { question: "In the broadcasting example, why does the loop check `client !== socket`?", answer: "So the message goes to every other client but not back to the sender. Without it, the sender would get its own message echoed back." },
      { question: "Why does the broadcasting loop also check `client.readyState === client.OPEN`?", answer: "A socket can still be in the collection while it's closing or already closed. Sending to it would throw or silently fail, so this check guards against writing to a stale connection." },
      { question: "What would happen if a server never removed a socket from its tracked clients collection on close?", answer: "The collection would keep growing with dead connections that never receive anything: a memory leak. Eventually, sending to one of them could throw an error that needs handling." },
      { question: "Debugging: a client disconnects and reconnects, but messages meant for them stop arriving even though the new connection succeeded. What's a likely bug?", answer: "The server is probably still tracking the old, closed socket as 'this client' instead of the new socket from the fresh connection. A reconnect is a new connection, not a resumed one." },
      { question: "Why is detecting a dropped connection and reconnecting the client's job, not the server's?", answer: "The server can't tell 'still there but quiet' from 'connection quietly died' unless the client notices its own socket closed and acts. The server just sees a close event, or nothing." },
      { question: "Why do reconnection strategies typically use a backoff delay instead of retrying immediately in a tight loop?", answer: "Instant, repeated retries, especially from many clients at once (e.g. right after a server restart), could flood the server. A backoff, often growing between tries, spreads the load and gives the server room to recover." },
      { question: "What is a heartbeat (ping/pong) mechanism used for in long-lived WebSocket connections?", answer: "Sending a small ping periodically and expecting a pong lets either side detect a silently dead connection (e.g. the network dropped without a clean close), instead of waiting for a TCP timeout." },
      { question: "Why can't a server's in-memory list of connected clients be used directly to reach clients connected to a different server instance?", answer: "Each instance's list only holds sockets for connections made to it. A socket object can't be reached from another process or machine, so other instances can't look it up or send to it." },
      { question: "How does a message broker like Redis pub/sub solve the multi-instance broadcasting problem?", answer: "Every instance publishes incoming messages to a shared channel and subscribes to it. When any instance publishes, every subscriber, including itself, receives the message and forwards it to the right locally connected clients." },
      { question: "Scenario: with three server instances sharing state via Redis pub/sub, a client on instance A sends a chat message. Trace how a client on instance C receives it.", answer: "Instance A publishes the message to the shared channel. Instance C, subscribed to it, receives it, then loops over its own connected sockets and sends it to that client, just like a local broadcast." },
      { question: "Why does a load balancer typically need sticky sessions (session affinity) for WebSocket traffic specifically?", answer: "A WebSocket is one long-lived TCP connection to one instance. Unlike stateless HTTP requests that can be routed individually, all its messages must keep reaching that same instance for the connection's life, or it breaks." },
      { question: "What's a practical reason to prefer a normal HTTP endpoint over a WebSocket for data that only changes occasionally?", answer: "A WebSocket needs a persistent connection per client plus code to track and clean up connection state. When a few seconds of staleness is fine, a plain request solves it more simply." },
      { question: "Trap: a developer assumes that because a connection is 'always open,' incoming messages don't need their own validation beyond the initial handshake. Why is this risky?", answer: "An open connection doesn't make every message trustworthy. Unexpected or malicious content can arrive in any message after connecting, so messages still need their own validation and authorization checks, not just a one-time check at connect." },
      { question: "Why does the FastAPI example use a `while True` loop instead of a `'message'` event listener like the Node.js version?", answer: "FastAPI's WebSocket handling uses async/await, not events. `await websocket.receive_text()` waits for the next message, so the loop handles messages one after another, like a repeatedly firing 'message' event." },
      { question: "What does `WebSocketDisconnect` represent in the FastAPI example, and why catch it with try/except rather than checking a return value?", answer: "It's an exception FastAPI raises when the connection closes, e.g. when the client disconnects during `receive_text()`. Otherwise `receive_text()` would wait for a message that never comes, so catching it is how the code detects the end and cleans up." },
      { question: "How is a WebSocket connection's statefulness fundamentally different from a typical REST request, beyond just staying open longer?", answer: "A REST request is stateless, so in principle any server can handle each request. A WebSocket has real in-memory state tied to one server process for its whole life, which is what makes horizontal scaling harder." },
      { question: "Why would broadcasting via a shared database table be a poor choice for real-time messages, compared to pub/sub?", answer: "A database is built for durable storage and queries, not instantly pushing new data to subscribers. Every instance would have to poll the table for new rows, adding latency and load. Pub/sub pushes messages the moment they're published." },
      { question: "Advanced: what additional problem does horizontal scaling introduce for tracking who's currently connected, beyond message delivery?", answer: "A client's connected status only lives in the memory of the instance they're connected to. Knowing whether a user is online anywhere means checking all instances or keeping a shared, cross-instance record." },
      { question: "Follow-up: if a WebSocket connection requires authentication, at what point should that be checked?", answer: "Once, during the initial handshake, e.g. with a token in the connection request, since the connection's identity lasts its whole life. You don't re-authenticate every message, but you still need a plan for when that identity's permissions change while the connection is open." },
    ],
    prerequisites: ["routing", "background-jobs"],
    relatedTopics: ["routing", "middleware", "background-jobs"],
    keywords: ["WebSocket", "real-time", "broadcasting", "reconnection", "scaling", "pub/sub", "ws", "connection lifecycle"],
  },
];
