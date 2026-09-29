import type { Topic } from "../../types/content";

export const softwareArchitectureIntermediateTopics: Topic[] = [
  {
    id: "solid-principles",
    title: "SOLID Principles",
    level: "intermediate",
    description:
      "Five plain-language guidelines for keeping object-oriented code flexible and easy to change, bundled together under one acronym.",
    explanation: `
Once you've internalized separation of concerns and low coupling/high
cohesion, a natural question is: what does that actually look like in
day-to-day object-oriented code? In the late 1990s and 2000s, engineers
noticed the same five kinds of design problems showing up again and
again, and gave each one a name and a guideline for avoiding it. Bundled
together, they're remembered by the acronym **SOLID**.

- **Single Responsibility Principle (SRP)** — a class or module should
  have only one reason to change. If a \`ReportGenerator\` class both
  calculates report data *and* formats it as PDF, it has two reasons to
  change: a math bug and a formatting request. Split it.

- **Open/Closed Principle (OCP)** — code should be open for extension
  but closed for modification. You should be able to add new behavior
  (say, a new payment method) without editing the existing, already-
  tested code for the old ones — typically by adding a new
  implementation of a shared interface instead of adding another
  \`if/else\` branch to an existing function.

- **Liskov Substitution Principle (LSP)** — if code works with a base
  type (like \`Bird\`), it should keep working correctly if you swap in
  any subtype (like \`Penguin\`), without surprising breakage. A classic
  violation: a \`Penguin extends Bird\` where \`Bird\` has a \`fly()\`
  method that \`Penguin\` can't honestly implement.

- **Interface Segregation Principle (ISP)** — don't force a class to
  implement methods it doesn't need just because they're bundled into
  one big interface. Many small, focused interfaces beat one giant one
  that every implementer has to partially fake.

- **Dependency Inversion Principle (DIP)** — high-level logic should
  depend on an abstraction, not on a concrete low-level detail (this one
  is important enough to get its own dedicated topic next).

None of these are laws of physics — they're guidelines distilled from
repeatedly seeing what makes object-oriented code brittle, and each one
is really just a specific, concrete application of "low coupling, high
cohesion" you already know.
  `.trim(),
    analogy:
      "Think of SOLID like five separate pieces of advice from a woodworking mentor: 'each tool has one job,' 'add new attachments instead of modifying the tool,' 'a replacement blade should fit the same slot,' 'don't bundle unrelated tools into one handle,' and 'design your workbench around the *kind* of tool, not one specific brand.'",
    examples: [
      {
        title: "SRP: one class, one reason to change",
        code: `// Violates SRP: two reasons to change (data logic + formatting)
class Invoice {
  calculateTotal() { /* math */ }
  printAsPdf() { /* formatting */ }
}

// Follows SRP: split by responsibility
class Invoice {
  calculateTotal() { /* math */ }
}
class InvoicePdfPrinter {
  print(invoice) { /* formatting */ }
}`,
        explanation:
          "A bug in PDF layout no longer risks touching invoice math, and vice versa — each class has exactly one reason to change.",
      },
      {
        title: "OCP: adding behavior without editing existing code",
        code: `// Violates OCP: every new payment method edits this function
function pay(method, amount) {
  if (method === "card") return payWithCard(amount);
  if (method === "paypal") return payWithPaypal(amount);
  // adding "crypto" means editing this function again
}

// Follows OCP: new methods extend, don't modify
const paymentMethods = {
  card: payWithCard,
  paypal: payWithPaypal,
};
function pay(method, amount) {
  return paymentMethods[method](amount);
}
// Adding crypto: paymentMethods.crypto = payWithCrypto; — no edits above`,
        explanation:
          "The pay function's own code never needs to change again to support a new method — new behavior is added alongside it, not by editing it.",
        walkthrough: [
          {
            code: 'if (method === "card") return payWithCard(amount);',
            explanation: "Every new payment method means adding another branch here and re-testing the whole function.",
          },
          {
            code: "const paymentMethods = { card: payWithCard, paypal: payWithPaypal };",
            explanation: "New behavior is registered as data, so the function that uses it doesn't need to change to support more cases.",
          },
        ],
      },
    ],
    howItWorks: `
SOLID works less like a checklist to run through mechanically, and more
like five lenses to view a design through. Faced with a class or
module, ask: Does it have one reason to change (SRP)? Could I add a new
case without editing it (OCP)? Would any of its subtypes break code
written against the base type (LSP)? Is any implementer forced to
support methods it doesn't need (ISP)? Does it depend on a concrete
detail it could instead depend on an abstraction for (DIP)? Most
real-world design smells map cleanly onto one of these five questions.
  `.trim(),
    whyItExists: `
These principles were named and collected because, without them,
object-oriented codebases tend to develop the same recurring diseases:
god classes that do everything (violates SRP), functions with
ever-growing if/else chains that break something every time a new case
is added (violates OCP), subclasses that quietly break assumptions the
rest of the code relies on (violates LSP), bloated interfaces nobody
fully implements (violates ISP), and business logic hard-wired to one
specific database or library (violates DIP). Giving each disease a name
made them easier to spot and discuss.
  `.trim(),
    whenToUse: `
Reach for these as a design review lens on any object-oriented code
that's expected to grow — especially before adding "just one more"
branch to a function that already has several, or before subclassing
something. They're most valuable exactly at the moment you're deciding
how to extend existing code.
  `.trim(),
    whenNotToUse: `
Applying all five principles rigidly to every tiny class, including
ones that will never grow or vary, produces needless abstraction —
interfaces and extension points for cases that will never arise. SOLID
is a response to anticipated change; where there's truly no anticipated
change, simple, direct code beats principled over-engineering.
  `.trim(),
    commonMistakes: [
      "Treating SOLID as five independent rules to satisfy in isolation, rather than five facets of the same underlying goal: code that's easy to change safely.",
      "Applying Open/Closed so aggressively that every function is wrapped in an interface 'just in case,' even where no second implementation will ever exist.",
      "Confusing Liskov Substitution with 'subclasses must override every method' — LSP is about behavioral compatibility, not just having matching method signatures.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Take a class that both validates user input and saves it to a database, and split it to satisfy the Single Responsibility Principle.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Refactor an if/else chain that picks a shipping-cost calculation based on a 'carrier' string into a design that follows the Open/Closed Principle.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Given a `Rectangle` class with `setWidth`/`setHeight`, and a `Square` class that extends it by keeping width and height equal, explain why this violates the Liskov Substitution Principle, and propose an alternative design.",
      },
    ],
    interviewQuestions: [
      {
        question: "What does the 'S' in SOLID stand for, and what does it mean?",
        answer:
          "Single Responsibility Principle — a class or module should have only one reason to change, meaning it should have one clearly-defined job.",
      },
      {
        question: "What's the difference between the Open/Closed Principle and just writing flexible code?",
        answer:
          "OCP specifically means you can add new behavior by adding new code (e.g., a new class implementing a shared interface) without modifying and re-testing existing, already-working code.",
      },
      {
        question: "Can you give an example of a Liskov Substitution Principle violation?",
        answer:
          "A Square class extending a Rectangle class that has independent setWidth/setHeight methods — because setting a Square's width must also change its height to stay square, code written to work with any Rectangle can behave unexpectedly when given a Square.",
      },
    ],
    prerequisites: ["coupling-and-cohesion", "layered-architecture"],
    relatedTopics: ["dependency-inversion", "clean-architecture", "coupling-and-cohesion"],
    keywords: ["SOLID", "single responsibility", "open closed principle", "liskov substitution", "interface segregation", "dependency inversion principle"],
  },

  {
    id: "dependency-inversion",
    title: "Dependency Inversion",
    level: "intermediate",
    description:
      "Making important code depend on an abstraction — an interface describing what it needs — instead of on one specific, concrete implementation.",
    explanation: `
Imagine an \`OrderService\` class that, deep inside one of its methods,
creates a \`new PostgresDatabase()\` and calls \`.save()\` on it directly.
That looks harmless, but it means \`OrderService\` is now permanently
welded to Postgres. Want to write a fast unit test for the order logic?
You can't, without a real Postgres connection. Want to switch to a
different database, or mock storage for a test? You have to go edit
\`OrderService\` itself, even though none of its actual logic changed.

**Dependency inversion** flips this relationship around. Instead of
\`OrderService\` depending directly on the concrete \`PostgresDatabase\`
class, it depends on an abstraction — an interface like \`OrderRepository\`
that just describes "something with a \`.save(order)\` method." The
concrete \`PostgresDatabase\` class then *implements* that interface. Now
\`OrderService\` doesn't know or care whether it's talking to Postgres, an
in-memory fake, or something else entirely — it only knows about the
shape it depends on.

The word "inversion" refers to which direction the dependency points:
normally you'd think the high-level business logic depends on the
low-level database detail. Dependency inversion makes *both* the
high-level logic and the low-level detail depend on a shared
abstraction sitting between them, instead of the high-level logic
depending directly on the low-level one.
  `.trim(),
    analogy:
      "A lamp doesn't need to know whether it's plugged into a coal power plant, a solar panel, or a wind turbine — it just needs a standard wall socket. The socket is the abstraction; any power source that fits it can be swapped in without rewiring the lamp.",
    examples: [
      {
        title: "Before: business logic depends on a concrete class",
        code: `class PostgresDatabase {
  save(order) {
    // real SQL insert
  }
}

class OrderService {
  constructor() {
    this.db = new PostgresDatabase(); // hard-wired to one concrete class
  }
  placeOrder(order) {
    // ...business rules...
    this.db.save(order);
  }
}

// Testing this requires a real (or heavily mocked) Postgres connection.
const service = new OrderService();`,
        explanation:
          "OrderService creates and depends on PostgresDatabase directly. There's no way to substitute a fake for testing without editing OrderService's source code.",
      },
      {
        title: "After: business logic depends on an abstraction",
        code: `// The abstraction both sides depend on
class OrderRepository {
  save(order) { throw new Error("not implemented"); }
}

class PostgresOrderRepository extends OrderRepository {
  save(order) { /* real SQL insert */ }
}

class InMemoryOrderRepository extends OrderRepository {
  constructor() { super(); this.orders = []; }
  save(order) { this.orders.push(order); }
}

class OrderService {
  constructor(repository) {
    this.repository = repository; // depends on the abstraction, injected from outside
  }
  placeOrder(order) {
    // ...business rules...
    this.repository.save(order);
  }
}

// Production
const service = new OrderService(new PostgresOrderRepository());

// Test — no real database needed
const testService = new OrderService(new InMemoryOrderRepository());`,
        explanation:
          "OrderService no longer knows Postgres exists. In tests, an InMemoryOrderRepository is swapped in with no changes to OrderService itself, and the business logic can be verified in isolation.",
        walkthrough: [
          {
            code: "class OrderRepository { save(order) { throw new Error(...); } }",
            explanation: "The abstraction: a description of 'something that can save an order,' with no real implementation of its own.",
          },
          {
            code: "class PostgresOrderRepository extends OrderRepository { ... }",
            explanation: "One concrete implementation of the abstraction — this is a low-level detail, and it depends on (implements) the abstraction, not the other way around.",
          },
          {
            code: "constructor(repository) { this.repository = repository; }",
            explanation: "OrderService receives its dependency from outside ('injected') instead of constructing it internally — this is what makes swapping implementations possible.",
          },
          {
            code: "const testService = new OrderService(new InMemoryOrderRepository());",
            explanation: "A test can now exercise real business logic against a fake, in-memory repository, with no database involved at all.",
          },
        ],
      },
    ],
    howItWorks: `
Dependency inversion has two halves that are easy to conflate but worth
separating: (1) defining an abstraction (an interface, or in JavaScript
often just an agreed-upon set of methods) that captures only what the
high-level code actually needs, and (2) **injecting** the concrete
implementation from outside, typically through a constructor or
function parameter, rather than having the high-level code instantiate
it itself. That second half — injection — is what actually makes the
swap possible; defining an abstraction alone doesn't help if the code
still hard-codes which implementation to construct.
  `.trim(),
    whyItExists: `
It exists to solve two costly problems at once: untestable business
logic (because it's welded to a real database, real network calls, or
real filesystem access) and rigid systems (because switching a storage
engine, a payment provider, or a third-party library means rewriting
the core logic that used it directly, instead of just writing a new
implementation of an existing abstraction).
  `.trim(),
    whenToUse: `
Apply it at the boundaries where your core logic meets something
volatile, slow, or hard to test in isolation — databases, third-party
APIs, the filesystem, the current time, randomness. Anywhere you find
yourself wanting to write a test but being blocked by "well, that would
need a real X" is a strong signal dependency inversion belongs there.
  `.trim(),
    whenNotToUse: `
Introducing an abstraction and injected dependency for something that
will only ever have one implementation, and isn't a pain point for
testing (e.g., a pure math utility), adds a layer of indirection that
buys nothing. Reserve it for genuine seams — places where substitution
is plausible or testing is otherwise blocked.
  `.trim(),
    commonMistakes: [
      "Creating an interface for every single class 'for flexibility,' even ones that will only ever have one implementation and don't need to be swapped.",
      "Defining the abstraction from the low-level implementation's point of view (mirroring exactly what Postgres offers) instead of from what the high-level logic actually needs.",
      "Still constructing the concrete dependency inside the high-level class (e.g., `new PostgresOrderRepository()` inside `OrderService`'s constructor) — which recreates the original tight coupling even though an interface now exists.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Take a class that directly calls `fetch()` to get weather data, and change it to depend on an injected `WeatherClient` abstraction instead.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Write a fake, in-memory implementation of an `EmailSender` abstraction so that a `NotificationService`'s logic can be unit tested without sending real emails.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Design an abstraction for a `PaymentGateway` used by a checkout service, so that swapping between two real payment providers (and a test fake) requires zero changes to the checkout service's code. List the methods your abstraction needs.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is dependency inversion?",
        answer:
          "A principle where high-level code depends on an abstraction (like an interface) rather than a concrete, low-level implementation — and the concrete implementation also depends on that same abstraction, inverting the naive direct dependency.",
      },
      {
        question: "How does dependency inversion improve testability?",
        answer:
          "By letting a test substitute a fake or in-memory implementation of the abstraction in place of the real one (e.g., a real database), so business logic can be exercised in isolation, quickly and deterministically.",
      },
      {
        question: "What's the difference between dependency inversion and dependency injection?",
        answer:
          "Dependency inversion is the design principle (depend on abstractions, not concretions); dependency injection is the specific technique of supplying a dependency from outside — like through a constructor parameter — which is what makes the inversion practically possible.",
      },
    ],
    prerequisites: ["solid-principles"],
    relatedTopics: ["solid-principles", "clean-architecture", "coupling-and-cohesion"],
    keywords: ["dependency inversion", "dependency injection", "DIP", "abstraction", "testability"],
  },

  {
    id: "clean-architecture",
    title: "Clean Architecture / Hexagonal Architecture",
    level: "intermediate",
    description:
      "Keeping business logic independent of frameworks, databases, and UI, so any of those can be swapped without touching the core logic.",
    explanation: `
You already know layered architecture: presentation, business logic,
data access, stacked so each one talks to its neighbor. Clean
Architecture (and its close cousin, Hexagonal Architecture, also called
"ports and adapters") takes the same underlying idea — keep concerns
separated, keep dependencies pointing one direction — and makes one
thing explicit and non-negotiable: the business logic sits at the
**center**, and absolutely nothing about frameworks, databases, or the
UI is allowed to leak into it. Every dependency has to point *inward*,
toward the business logic, never outward from it.

Concretely: your core logic defines abstractions for what it needs
(often called **ports** — "I need something that can save an order," "I
need something that can look up a user"). Outside that core, you write
**adapters** that implement those ports using real technology — a
Postgres adapter, a REST API adapter, a command-line adapter. The web
framework, the database driver, the UI toolkit — all of that lives in
the adapters, not the core. If you swapped your entire web framework for
a different one, or moved from REST to a CLI, the business logic in the
center wouldn't need to change at all, because it never depended on any
of that in the first place.

This is dependency inversion (which you've already learned) applied
consistently as an organizing principle for an entire application, not
just one class.
  `.trim(),
    analogy:
      "Think of a board game's rules booklet: the rules (business logic) don't care whether you're playing with a physical board, an app, or over video call reading moves aloud. Each of those is just a different 'adapter' for playing the same underlying game.",
    examples: [
      {
        title: "Business logic entangled with a framework",
        code: `// Express-specific request/response objects leak into the core logic
app.post("/orders", async (req, res) => {
  if (!req.body.items || req.body.items.length === 0) {
    return res.status(400).json({ error: "Order must have items" }); // business rule, tangled with HTTP
  }
  const total = req.body.items.reduce((s, i) => s + i.price, 0);
  await pgPool.query("INSERT INTO orders (total) VALUES ($1)", [total]); // tangled with Postgres
  res.json({ total });
});`,
        explanation:
          "The rule 'an order must have items' and the pricing calculation are stuck inside an Express route handler, directly wired to a specific database client. None of this logic could run outside a live HTTP + Postgres setup.",
      },
      {
        title: "Business logic isolated behind ports",
        code: `// core/placeOrder.js — no Express, no Postgres, no imports from either
export function placeOrder(items, orderRepository) {
  if (!items || items.length === 0) {
    throw new Error("Order must have items");
  }
  const total = items.reduce((s, i) => s + i.price, 0);
  orderRepository.save({ items, total });
  return { total };
}

// adapters/expressOrderController.js — the HTTP adapter
app.post("/orders", async (req, res) => {
  try {
    const result = placeOrder(req.body.items, pgOrderRepository);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});`,
        explanation:
          "placeOrder is plain JavaScript with no knowledge of HTTP or Postgres — it could run behind a CLI, a message queue, or a test with equal ease. The Express handler is now just a thin adapter translating HTTP into a call to the core.",
        walkthrough: [
          {
            code: "export function placeOrder(items, orderRepository) { ... }",
            explanation: "The core business rule, expressed with no dependency on any framework — it takes plain data and an abstraction (orderRepository), nothing else.",
          },
          {
            code: 'app.post("/orders", async (req, res) => { ... }',
            explanation: "An adapter whose only job is translating an HTTP request into a call to the core, and the core's result back into an HTTP response.",
          },
        ],
      },
    ],
    howItWorks: `
Picture concentric circles: business rules (often called **entities**)
at the very center, application-specific logic (**use cases**) around
them, and everything volatile — web frameworks, databases, external
APIs, the UI — on the outside, in the **adapters**. The strict rule is
the **Dependency Rule**: source code dependencies can only point
inward. Outer layers know about inner layers; inner layers know nothing
about outer ones. The core defines the interfaces (ports) it needs; the
outer adapters implement them — dependency inversion, applied at the
scale of the whole application.
  `.trim(),
    diagram: `
   ┌─────────────────────────────────────┐
   │        Adapters (web, DB, CLI)       │
   │   ┌───────────────────────────────┐ │
   │   │   Use Cases (application logic)│ │
   │   │   ┌─────────────────────────┐  │ │
   │   │   │  Entities (core rules)  │  │ │
   │   │   └─────────────────────────┘  │ │
   │   └───────────────────────────────┘ │
   └─────────────────────────────────────┘
        Dependencies always point inward →
  `.trim(),
    whyItExists: `
It exists because business logic is usually the most valuable, longest-
lived, and most-tested part of a system, while frameworks, databases,
and UI technologies churn constantly — a web framework might be
replaced in three years, but the rule "an order needs at least one item"
probably won't change. Entangling the durable part with the disposable
parts means every framework upgrade or database migration risks the one
part of the system you can least afford to break, and makes the core
logic nearly impossible to test without spinning up the whole stack.
  `.trim(),
    whenToUse: `
It earns its cost in systems with real, evolving business logic that
outlives any particular framework or database choice — the kinds of
systems expected to be maintained for years, ported across
technologies, or tested extensively at the logic level without spinning
up a full stack.
  `.trim(),
    whenNotToUse: `
For a small CRUD app or an internal tool where the 'business logic' is
close to nonexistent — mostly just moving data in and out of a
database — imposing a full ports-and-adapters structure adds
significant ceremony (interfaces, adapters, wiring) for very little
actual protection, since there's barely any core logic to protect.
  `.trim(),
    commonMistakes: [
      "Adding the ports-and-adapters structure but still importing a framework type (like an Express `Request`) into the core logic, quietly breaking the Dependency Rule.",
      "Treating this as identical to plain layered architecture and missing the key difference: the strict inward-only dependency direction and the framework-independence of the center.",
      "Over-applying it to simple applications, producing many interfaces and adapter classes that wrap almost no real logic.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Take an Express route handler that both validates a request body and contains a business rule, and extract the business rule into a plain function with no Express dependency.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Design the ports (interfaces) a 'library book checkout' use case would need — e.g., looking up a book, checking a member's borrowing limit, recording the checkout — without referencing any specific database or framework.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Take a small existing project (or a hypothetical to-do app with a REST API and a database) and describe how you'd restructure it into entities, use cases, and adapters, explaining what would need to change if you replaced the database.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is the core idea behind Clean Architecture / Hexagonal Architecture?",
        answer:
          "Business logic sits at the center of the application and has zero dependency on frameworks, databases, or UI; those volatile pieces live in outer 'adapters' that depend inward on the core, never the reverse.",
      },
      {
        question: "What is a 'port' and what is an 'adapter' in this style of architecture?",
        answer:
          "A port is an abstraction the core logic defines describing what it needs (e.g., 'something that can save an order'); an adapter is a concrete implementation of a port using real technology (e.g., a Postgres-backed order repository, or an HTTP controller).",
      },
      {
        question: "Why keep business logic independent of the web framework?",
        answer:
          "So the business logic can be tested and evolved without a live framework or server running, and so the framework can be upgraded or replaced without risking changes to the core rules of the application.",
      },
    ],
    prerequisites: ["dependency-inversion", "layered-architecture"],
    relatedTopics: ["dependency-inversion", "layered-architecture", "anti-corruption-layer", "domain-driven-design-basics"],
    keywords: ["clean architecture", "hexagonal architecture", "ports and adapters", "dependency rule"],
  },

  {
    id: "domain-driven-design-basics",
    title: "Domain-Driven Design (DDD) Basics",
    level: "intermediate",
    description:
      "Organizing code around the real-world business concepts it models — entities, value objects, and a shared vocabulary with domain experts — rather than around technical convenience.",
    explanation: `
Here's a common failure mode: a team builds a shipping feature, and in
conversation with the warehouse manager they talk about "packages,"
"shipments," and "carriers." But in the code, all of that becomes
generic \`Record\` objects passed around with string fields and \`type\`
flags, structured however was easiest to persist to the database. Six
months later, a new engineer reads the code and has no idea which
fields matter, what a "shipment" is actually allowed to do, or how it
differs from a "package." The business concepts got lost in translation
on the way into the code.

**Domain-Driven Design** starts from the opposite direction: model the
code around the real business concepts (the "domain"), using the exact
same words the business experts use, and keep using those words
consistently everywhere — in conversations, in code, in documentation.
That shared vocabulary is called the **ubiquitous language**, and the
discipline of using it consistently is meant to eliminate the
translation gap between what the business means and what the code
says.

Two building blocks show up constantly in DDD:

- An **entity** is something with a distinct identity that persists over
  time even as its attributes change — a specific \`Order\` with an ID
  is still "the same order" even after its status changes from
  "pending" to "shipped."
- A **value object** has no identity of its own — it's defined entirely
  by its values, and two value objects with the same values are
  considered equal and interchangeable. A \`Money\` object representing
  "$20.00 USD" doesn't have an identity; another \`Money\` object with the
  same amount and currency is simply the same value.

DDD is a large, deep topic in full — this is a starting foothold, not
the whole picture.
  `.trim(),
    analogy:
      "A doctor and a patient need to use the same words for the same things — 'the left knee,' not 'that joint thing.' Domain-Driven Design is insisting the code use the same precise vocabulary as the people who actually understand the business, instead of inventing its own generic, disconnected terms.",
    examples: [
      {
        title: "Before: generic, technically-convenient shapes",
        code: `// Everything is a loosely-typed record with string flags
const shipment = {
  type: "shipment",
  status: "pending",
  amount: 1999, // cents? dollars? unclear
  currency: "USD",
};

function process(record) {
  if (record.type === "shipment" && record.status === "pending") {
    // ...
  }
}`,
        explanation:
          "Nothing here reflects the domain's real concepts. 'amount' as a bare number invites bugs (cents vs. dollars), and there's no code that expresses what a Shipment is actually allowed to do.",
      },
      {
        title: "After: entities and value objects modeling the domain",
        code: `class Money {
  constructor(amountCents, currency) {
    this.amountCents = amountCents;
    this.currency = currency;
  }
  equals(other) {
    return this.amountCents === other.amountCents && this.currency === other.currency;
  }
}

class Shipment {
  constructor(id, cost) {
    this.id = id; // gives this object identity — two Shipments are only "the same" if the ID matches
    this.cost = cost; // a Money value object, not a bare number
    this.status = "pending";
  }
  markDispatched() {
    if (this.status !== "pending") throw new Error("Only a pending shipment can be dispatched");
    this.status = "dispatched";
  }
}`,
        explanation:
          "Money is a value object — two Money instances with the same amount and currency are interchangeable. Shipment is an entity — its identity (id) is what makes it 'the same shipment' even as its status changes, and its own method enforces the domain rule about when it can be dispatched.",
        walkthrough: [
          {
            code: "class Money { constructor(amountCents, currency) { ... } equals(other) { ... } }",
            explanation: "A value object: defined entirely by its data, with no identity of its own, and equality based on its values.",
          },
          {
            code: "class Shipment { constructor(id, cost) { this.id = id; ... } }",
            explanation: "An entity: has a distinct identity (id) that persists across changes to its other attributes.",
          },
          {
            code: "markDispatched() { if (this.status !== \"pending\") throw new Error(...); ... }",
            explanation: "A domain rule lives directly on the entity itself, in the same vocabulary ('dispatched') the business uses — instead of a scattered if-check somewhere else in the codebase.",
          },
        ],
      },
    ],
    howItWorks: `
DDD starts with conversations, not code: engineers and domain experts
work out the precise meaning of terms ("what exactly counts as a
'dispatched' shipment?") and agree to use those exact terms everywhere.
Those terms then become the names of classes, methods, and fields in
the code — an entity for each concept with a real identity, a value
object for each concept defined purely by its data, and methods on
those objects that enforce the actual business rules, rather than rules
scattered across service functions as loose if-checks.
  `.trim(),
    whyItExists: `
It exists to close the gap between what a business genuinely means and
what a codebase actually expresses — a gap that, left unaddressed,
causes constant miscommunication (an engineer builds the wrong thing
because "order" meant something subtly different to them than to the
business) and code that's hard to trust, because business rules are
scattered as ad-hoc checks instead of living in one clear, named place
that matches how the business actually talks about the rule.
  `.trim(),
    whenToUse: `
DDD earns its investment in the parts of a system with genuinely
complex, valuable business logic — the "core domain" a business
actually differentiates on. It's most worth it when you have real
access to domain experts to build the shared vocabulary with, and when
the logic is complicated enough that getting the concepts precisely
right matters.
  `.trim(),
    whenNotToUse: `
For a simple CRUD screen with little real business logic — where the
"domain" is basically "store this form and display it back" — the
ceremony of entities, value objects, and a curated ubiquitous language
is overhead with no real business complexity to justify it. Reserve
full DDD for the parts of a system where the domain genuinely is
complex.
  `.trim(),
    commonMistakes: [
      "Letting the code's vocabulary drift from the business's vocabulary over time (e.g., the business starts saying 'return' but the code still says 'refund') instead of treating the ubiquitous language as something to actively maintain.",
      "Making every object an entity with an ID, even ones that are naturally value objects (like an amount of money or an address), which adds needless identity-tracking complexity.",
      "Putting business rules in generic service functions instead of on the entities and value objects themselves, missing much of DDD's benefit even while using its vocabulary.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "For an online bookstore, decide whether 'Book' (a specific physical copy tracked in inventory) and 'ISBN' should be modeled as entities or value objects, and justify each choice.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Take the loosely-typed 'shipment' example above and design a small ubiquitous-language glossary (5-6 terms) that a warehouse team and engineering team would agree on.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Model a 'hotel room booking' domain with at least one entity and one value object, including one business rule enforced as a method on the entity (e.g., a booking can't be modified within 24 hours of check-in).",
      },
    ],
    interviewQuestions: [
      {
        question: "What is the 'ubiquitous language' in Domain-Driven Design?",
        answer:
          "A shared vocabulary, developed together by engineers and domain experts, that's used consistently in conversations, documentation, and the code itself — eliminating translation gaps between how the business talks and how the code is written.",
      },
      {
        question: "What's the difference between an entity and a value object?",
        answer:
          "An entity has a distinct identity that persists across changes to its attributes (two entities are 'the same' only if their identity matches); a value object has no identity of its own and is defined entirely by its data (two value objects with the same data are considered equal).",
      },
      {
        question: "Why does DDD emphasize putting business rules on the domain objects themselves rather than in separate service functions?",
        answer:
          "So the rule lives in one place, named using the same vocabulary the business uses, and is enforced consistently wherever the object is used — rather than being reimplemented or forgotten in scattered if-checks across the codebase.",
      },
    ],
    prerequisites: ["clean-architecture"],
    relatedTopics: ["clean-architecture", "anti-corruption-layer", "solid-principles"],
    keywords: ["domain-driven design", "DDD", "entity", "value object", "ubiquitous language", "domain model"],
  },

  {
    id: "monorepo-vs-polyrepo",
    title: "Monorepo vs Polyrepo",
    level: "intermediate",
    description:
      "Deciding whether to keep multiple projects or packages in one shared repository, or spread across separate repositories, and weighing the tradeoffs.",
    explanation: `
Once a system grows past a single application — say, a web frontend, a
backend API, and a couple of shared libraries — you face a structural
question that has nothing to do with classes or layers: how many git
repositories should all of this live in?

Put everything — every app and every shared package — into **one single
repository**, and you have a **monorepo**. A change that touches both
the frontend and a shared library can be made and reviewed in one
commit, one pull request. Every project always sees the very latest
version of every shared package, because there's only one copy of it.
The tradeoff is that the repository grows large, tooling (build
systems, CI) has to be taught to handle multiple projects efficiently,
and it's easier for teams to accidentally step on each other's code.

Split each project into its **own separate repository**, and you have a
**polyrepo**. Each team or project gets a clean, focused, independently
versioned space with clear ownership boundaries — nobody's unrelated
change shows up in your pull request history. The tradeoff is that
sharing code between repos requires publishing and versioning packages
(instead of just importing a local file), and a change that spans
multiple repos means coordinating multiple pull requests, multiple
reviews, and multiple release timings, which is significantly more
overhead.

Neither is universally "correct" — it's a genuine tradeoff, and large
companies run successfully with both approaches (and some run a mix).
  `.trim(),
    analogy:
      "A monorepo is like one large shared office where every team sits in the same building — easy to walk over and coordinate, but you need clear floor plans (tooling) so teams don't clutter each other's space. A polyrepo is like separate office buildings for each team — cleaner boundaries, but scheduling a meeting between two buildings takes more coordination.",
    examples: [
      {
        title: "Polyrepo: sharing code requires publishing a package",
        code: `// In repo "shared-utils" (its own repository, its own version)
// package.json: { "name": "@acme/shared-utils", "version": "1.4.0" }
export function formatCurrency(cents) { /* ... */ }

// In repo "web-app" (a separate repository)
// package.json: "dependencies": { "@acme/shared-utils": "^1.4.0" }
import { formatCurrency } from "@acme/shared-utils";
// To pick up a bugfix in formatCurrency, web-app must bump its
// dependency version and go through its own release process.`,
        explanation:
          "A fix to formatCurrency has to be released as a new package version before web-app can use it — two separate steps, two separate repos, two separate review processes.",
      },
      {
        title: "Monorepo: sharing code is a direct import",
        code: `// One repository, multiple folders
// packages/shared-utils/formatCurrency.js
export function formatCurrency(cents) { /* ... */ }

// apps/web-app/checkout.js
import { formatCurrency } from "../../packages/shared-utils/formatCurrency";
// A fix to formatCurrency is visible to web-app immediately,
// in the very same pull request if needed.`,
        explanation:
          "The fix and its usage can be reviewed and merged together, atomically, with no separate release step — at the cost of both projects now living in, and being built by tooling for, one shared repository.",
      },
    ],
    howItWorks: `
The practical difference comes down to how code crosses a project
boundary. In a polyrepo, crossing that boundary always means going
through a published, versioned package — which adds process but also
adds a deliberate checkpoint (you choose when to upgrade). In a
monorepo, crossing that boundary is just an import statement — which
removes that checkpoint (everyone is always on the latest version) but
requires tooling that can figure out which parts of a huge repository
actually need to be rebuilt or retested for a given change, since
naively rebuilding everything on every commit doesn't scale.
  `.trim(),
    whyItExists: `
This is a genuinely open tradeoff, not a solved problem, because the
two costs it balances — coordination overhead across repos vs. tooling
and organizational overhead within one giant repo — both scale with the
size of an organization, but in opposite directions. Small,
tightly-coordinated teams tend to feel the coordination overhead more;
large organizations with many independent teams tend to feel the
"everyone touches one giant repo" overhead more, which is why both
models remain in active, successful use at scale.
  `.trim(),
    whenToUse: `
A monorepo tends to fit well when multiple projects share a lot of code
and evolve together, when you want atomic changes across project
boundaries, and when you're willing to invest in tooling to keep builds
and tests fast as the repository grows. It also removes the "which
version of the shared library is everyone on" drift that polyrepos can
suffer from.
  `.trim(),
    whenNotToUse: `
A polyrepo tends to fit better when projects are genuinely independent
(different release cycles, different teams with little overlap, or
even different companies/open-source consumers), where a monorepo's
shared tooling and shared access would add coordination cost without a
matching benefit, or where you specifically want strict, deliberate
version boundaries between components.
  `.trim(),
    commonMistakes: [
      "Adopting a monorepo without investing in the tooling (like build caching or affected-project detection) needed to keep it fast, leading to painfully slow CI as it grows.",
      "Adopting a polyrepo for tightly-coupled projects that change together constantly, resulting in a stream of synchronized, multi-repo pull requests for nearly every feature.",
      "Treating the choice as permanent and unquestionable, rather than revisiting it as the number of teams, projects, and their degree of shared code changes over time.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "List two concrete costs and two concrete benefits of a monorepo, and two of each for a polyrepo, from the explanation above, in your own words.",
      },
      {
        difficulty: "Medium",
        prompt:
          "A company has one web frontend, one mobile app, and one shared design-system package that both consume, all built by the same small team. Argue for whether a monorepo or polyrepo fits better, and why.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Describe what tooling problem a very large monorepo (thousands of projects) needs to solve that a small one doesn't, and outline (at a high level) one strategy for solving it.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is the core tradeoff between a monorepo and a polyrepo?",
        answer:
          "A monorepo makes cross-project changes atomic and keeps everyone on the same version of shared code, at the cost of needing tooling to scale and clearer internal boundaries; a polyrepo gives each project a clean, independently-versioned, independently-owned space, at the cost of needing package publishing and multi-repo coordination for shared changes.",
      },
      {
        question: "Why does a monorepo need special build tooling as it grows?",
        answer:
          "Because rebuilding and re-testing every project on every commit doesn't scale — tooling needs to determine which projects were actually affected by a given change and only rebuild/retest those.",
      },
      {
        question: "In a polyrepo setup, how does one project pick up a bugfix made in a shared library?",
        answer:
          "The shared library publishes a new version of its package, and the consuming project updates its dependency version and goes through its own release process — it's not automatic the way a local import would be.",
      },
    ],
    relatedTopics: ["layered-architecture", "clean-architecture"],
    keywords: ["monorepo", "polyrepo", "multi-repo", "repository structure", "package management"],
  },
];
