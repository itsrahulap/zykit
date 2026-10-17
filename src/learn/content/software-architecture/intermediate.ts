import type { Topic } from "../../types/content";

export const softwareArchitectureIntermediateTopics: Topic[] = [
  {
    id: "solid-principles",
    title: "SOLID Principles",
    level: "intermediate",
    description:
      "Five guidelines, grouped under one acronym, for keeping object-oriented code flexible and easy to change.",
    explanation: `
What do separation of concerns and low coupling/high cohesion look like
in everyday object-oriented code? In the late 1990s and 2000s,
engineers kept seeing the same five design problems, and named a
guideline for each. Together they spell **SOLID**.

- **Single Responsibility Principle (SRP)**: a class or module should
  have only one reason to change. A \`ReportGenerator\` that calculates
  data *and* formats it as PDF has two: a math bug and a formatting
  request. Split it.

- **Open/Closed Principle (OCP)**: code should be open for extension
  but closed for modification. You add new behavior (say, a new payment
  method) without editing tested code for the old ones, usually by
  adding a new implementation of a shared interface instead of another
  \`if/else\` branch.

- **Liskov Substitution Principle (LSP)**: code that works with a base
  type (like \`Bird\`) should keep working with any subtype (like
  \`Penguin\`). A classic violation: \`Penguin extends Bird\` where
  \`Bird\` has a \`fly()\` method \`Penguin\` can't honestly implement.

- **Interface Segregation Principle (ISP)**: don't force a class to
  implement methods it doesn't need because they're bundled into one big
  interface. Many small, focused interfaces beat one giant one that
  every implementer partly fakes.

- **Dependency Inversion Principle (DIP)**: high-level logic should
  depend on an abstraction, not a concrete low-level detail. It gets its
  own topic next.

These aren't laws. They're guidelines drawn from what makes
object-oriented code brittle, and each is a concrete case of "low
coupling, high cohesion".
  `.trim(),
    analogy:
      "SOLID is like five tips from a woodworking mentor: 'each tool has one job', 'add attachments instead of modifying the tool', 'a replacement blade should fit the same slot', 'don't bundle unrelated tools into one handle', and 'design your workbench around the *kind* of tool, not one brand.'",
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
          "A PDF layout fix no longer risks the invoice math, and vice versa. Each class has exactly one reason to change.",
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
          "The pay function never changes again to support a new method. New behavior is added next to it, not by editing it.",
        walkthrough: [
          {
            code: 'if (method === "card") return payWithCard(amount);',
            explanation: "Each new payment method means another branch here and re-testing the whole function.",
          },
          {
            code: "const paymentMethods = { card: payWithCard, paypal: payWithPaypal };",
            explanation: "New behavior is registered as data, so the function using it doesn't change to support more cases.",
          },
        ],
      },
    ],
    howItWorks: `
SOLID is less a checklist than five lenses. For any class or module,
ask:

- Does it have one reason to change (SRP)?
- Could I add a new case without editing it (OCP)?
- Would a subtype break code written for the base type (LSP)?
- Is any implementer forced to support methods it doesn't need (ISP)?
- Does it depend on a concrete detail instead of an abstraction (DIP)?

Most real design smells map onto one of these questions.
  `.trim(),
    whyItExists: `
Without these principles, object-oriented codebases develop the same
recurring problems:

- God classes that do everything (SRP).
- Growing if/else chains that break something with each new case (OCP).
- Subclasses that quietly break assumptions other code relies on (LSP).
- Bloated interfaces nobody fully implements (ISP).
- Business logic hard-wired to one database or library (DIP).

Naming each problem made it easier to spot and discuss.
  `.trim(),
    whenToUse: `
Use them as a design review lens on object-oriented code that will
grow, especially before adding "just one more" branch to a function
that already has several, or before subclassing. They matter most when
you're deciding how to extend existing code.
  `.trim(),
    whenNotToUse: `
Applying all five rigidly to every tiny class, even ones that will
never grow or vary, creates needless abstraction: interfaces and
extension points for cases that never come. SOLID answers expected
change. Where none is expected, simple direct code wins.
  `.trim(),
    commonMistakes: [
      "Treating SOLID as five separate rules instead of five sides of one goal: code that's easy to change safely.",
      "Applying Open/Closed so hard that every function gets an interface 'just in case', even with no second implementation ever.",
      "Thinking Liskov Substitution means 'subclasses must override every method'. LSP is about behavioral compatibility, not just matching method signatures.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Split a class that validates user input and saves it to a database so it follows the Single Responsibility Principle.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Refactor an if/else chain that picks a shipping-cost calculation from a 'carrier' string into a design that follows the Open/Closed Principle.",
      },
      {
        difficulty: "Hard",
        prompt:
          "A `Rectangle` class has `setWidth`/`setHeight`, and a `Square` class extends it by keeping width and height equal. Explain why this violates the Liskov Substitution Principle, and propose another design.",
      },
    ],
    interviewQuestions: [
      {
        question: "What does the 'S' in SOLID stand for, and what does it mean?",
        answer:
          "Single Responsibility Principle: a class or module should have only one reason to change, meaning one clearly defined job.",
      },
      {
        question: "What's the difference between the Open/Closed Principle and just writing flexible code?",
        answer:
          "OCP specifically means you add new behavior by adding new code (e.g., a new class implementing a shared interface), without modifying and re-testing existing working code.",
      },
      {
        question: "Can you give an example of a Liskov Substitution Principle violation?",
        answer:
          "A Square extending a Rectangle with independent setWidth/setHeight. Setting a Square's width must also change its height, so code written for any Rectangle can behave unexpectedly when given a Square.",
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
      "Make important code depend on an abstraction (an interface describing what it needs) instead of one concrete implementation.",
    explanation: `
Imagine an \`OrderService\` that, deep in one method, creates a
\`new PostgresDatabase()\` and calls \`.save()\` on it. Harmless-looking,
but \`OrderService\` is now welded to Postgres. A fast unit test of the
order logic needs a real Postgres connection. Switching databases or
mocking storage means editing \`OrderService\`, even though its logic
didn't change.

**Dependency inversion** flips this. \`OrderService\` depends on an
abstraction, like an \`OrderRepository\` interface that just means
"something with a \`.save(order)\` method". The concrete
\`PostgresDatabase\` *implements* that interface. Now \`OrderService\`
doesn't care whether it talks to Postgres, an in-memory fake, or
anything else. It only knows the shape it depends on.

"Inversion" is about which way the dependency points. Normally the
high-level business logic depends on the low-level database detail.
Here, *both* depend on a shared abstraction between them.
  `.trim(),
    analogy:
      "A lamp doesn't care whether its power comes from coal, solar, or wind. It just needs a standard wall socket. The socket is the abstraction: any source that fits can be swapped in without rewiring the lamp.",
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
          "OrderService creates and depends on PostgresDatabase directly. You can't swap in a fake for testing without editing OrderService.",
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
          "OrderService no longer knows Postgres exists. Tests swap in an InMemoryOrderRepository without changing OrderService, so the business logic is checked in isolation.",
        walkthrough: [
          {
            code: "class OrderRepository { save(order) { throw new Error(...); } }",
            explanation: "The abstraction: 'something that can save an order', with no real implementation of its own.",
          },
          {
            code: "class PostgresOrderRepository extends OrderRepository { ... }",
            explanation: "One concrete implementation. This low-level detail depends on (implements) the abstraction, not the other way around.",
          },
          {
            code: "constructor(repository) { this.repository = repository; }",
            explanation: "OrderService receives its dependency from outside ('injected') instead of building it. That's what makes swapping possible.",
          },
          {
            code: "const testService = new OrderService(new InMemoryOrderRepository());",
            explanation: "A test runs the real business logic against an in-memory fake, with no database at all.",
          },
        ],
      },
    ],
    howItWorks: `
Dependency inversion has two halves that are easy to mix up:

- Define an abstraction (an interface, or in JavaScript often just an
  agreed set of methods) that captures only what the high-level code
  needs.
- **Inject** the concrete implementation from outside, usually through
  a constructor or function parameter, instead of letting the
  high-level code create it.

Injection is what makes the swap possible. An abstraction alone doesn't
help if the code still hard-codes which implementation to build.
  `.trim(),
    whyItExists: `
It solves two costly problems at once:

- Untestable business logic, welded to a real database, network, or
  filesystem.
- Rigid systems, where switching a storage engine, payment provider, or
  library means rewriting core logic instead of writing a new
  implementation of an existing abstraction.
  `.trim(),
    whenToUse: `
Apply it where core logic meets something volatile, slow, or hard to
test alone: databases, third-party APIs, the filesystem, the current
time, randomness. If a test is blocked by "that would need a real X",
dependency inversion probably belongs there.
  `.trim(),
    whenNotToUse: `
An abstraction plus injection for something with only one
implementation that's easy to test (e.g., a pure math utility) adds
indirection that buys nothing. Save it for real seams, where
substitution is plausible or testing is otherwise blocked.
  `.trim(),
    commonMistakes: [
      "Creating an interface for every class 'for flexibility', even ones with only one implementation that never needs swapping.",
      "Designing the abstraction around the low-level implementation (mirroring what Postgres offers) instead of what the high-level logic needs.",
      "Still constructing the concrete dependency inside the high-level class (e.g., `new PostgresOrderRepository()` in `OrderService`'s constructor). That recreates the tight coupling even though an interface exists.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Change a class that calls `fetch()` directly for weather data so it depends on an injected `WeatherClient` abstraction instead.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Write an in-memory fake of an `EmailSender` abstraction so you can unit test a `NotificationService` without sending real emails.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Design a `PaymentGateway` abstraction for a checkout service so that swapping between two real payment providers (and a test fake) needs zero changes to the checkout service. List the methods it needs.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is dependency inversion?",
        answer:
          "A principle where high-level code depends on an abstraction (like an interface) instead of a concrete low-level implementation. The implementation also depends on that abstraction, inverting the naive direct dependency.",
      },
      {
        question: "How does dependency inversion improve testability?",
        answer:
          "A test can swap a fake or in-memory implementation in for the real one (e.g., a real database), so business logic runs in isolation, quickly and deterministically.",
      },
      {
        question: "What's the difference between dependency inversion and dependency injection?",
        answer:
          "Dependency inversion is the principle (depend on abstractions, not concretions). Dependency injection is the technique of supplying a dependency from outside, like a constructor parameter, which makes the inversion possible in practice.",
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
      "Keep business logic independent of frameworks, databases, and UI, so you can swap any of them without touching the core.",
    explanation: `
Layered architecture stacks presentation, business logic, and data
access so each talks to its neighbor. Clean Architecture (and its close
cousin, Hexagonal Architecture, also called "ports and adapters") keeps
the same idea but adds one strict rule: business logic sits at the
**center**, and nothing about frameworks, databases, or UI may leak into
it. Every dependency points *inward*, toward the business logic.

Your core logic defines abstractions for what it needs, called
**ports** ("I need something that can save an order", "I need something
that can look up a user"). Outside the core, **adapters** implement
those ports with real technology: a Postgres adapter, a REST API
adapter, a command-line adapter.

The web framework, database driver, and UI toolkit all live in
adapters. Swap the web framework, or move from REST to a CLI, and the
core doesn't change, because it never depended on them.

This is dependency inversion applied to a whole application, not just
one class.
  `.trim(),
    analogy:
      "A board game's rules don't care whether you play on a physical board, in an app, or by reading moves aloud over a video call. Each is just a different 'adapter' for the same game.",
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
          "The rule 'an order must have items' and the pricing calculation are stuck in an Express route handler, wired to one database client. None of it can run without a live HTTP + Postgres setup.",
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
          "placeOrder is plain JavaScript that knows nothing of HTTP or Postgres. It runs just as easily behind a CLI, a message queue, or a test. The Express handler is now a thin adapter that turns HTTP into a call to the core.",
        walkthrough: [
          {
            code: "export function placeOrder(items, orderRepository) { ... }",
            explanation: "The core business rule, with no framework dependency. It takes plain data and an abstraction (orderRepository), nothing else.",
          },
          {
            code: 'app.post("/orders", async (req, res) => { ... }',
            explanation: "An adapter that only turns an HTTP request into a call to the core, and the result back into an HTTP response.",
          },
        ],
      },
    ],
    howItWorks: `
Picture concentric circles:

- Business rules (**entities**) at the center.
- Application-specific logic (**use cases**) around them.
- Everything volatile (web frameworks, databases, external APIs, UI) on
  the outside, in **adapters**.

The **Dependency Rule**: source code dependencies only point inward.
Outer layers know about inner ones; inner layers know nothing of outer
ones. The core defines the interfaces (ports) it needs, and the
adapters implement them.
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
Business logic is usually the most valuable, longest-lived, and
most-tested part of a system. Frameworks, databases, and UI technology
churn constantly. A web framework may be replaced in three years, but
"an order needs at least one item" probably won't change.

Tangling the durable part with the disposable parts means every
framework upgrade or database migration risks the part you can least
afford to break. It also makes the core nearly impossible to test
without running the whole stack.
  `.trim(),
    whenToUse: `
It earns its cost in systems with real, evolving business logic that
outlives any framework or database: systems maintained for years,
ported across technologies, or tested heavily at the logic level
without a full stack.
  `.trim(),
    whenNotToUse: `
In a small CRUD app or internal tool that mostly moves data in and out
of a database, a full ports-and-adapters setup adds a lot of ceremony
(interfaces, adapters, wiring) while protecting almost nothing, since
there's barely any core logic.
  `.trim(),
    commonMistakes: [
      "Adding ports and adapters but still importing a framework type (like an Express `Request`) into the core, quietly breaking the Dependency Rule.",
      "Treating it as plain layered architecture and missing the key difference: the strict inward-only dependency direction and a framework-free center.",
      "Over-applying it to simple apps, producing many interfaces and adapters that wrap almost no real logic.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "An Express route handler validates a request body and contains a business rule. Extract the business rule into a plain function with no Express dependency.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Design the ports (interfaces) a 'library book checkout' use case needs, e.g., looking up a book, checking a member's borrowing limit, recording the checkout, without referencing any database or framework.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Take a small project (or an imagined to-do app with a REST API and a database). Describe how you'd restructure it into entities, use cases, and adapters, and what would change if you replaced the database.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is the core idea behind Clean Architecture / Hexagonal Architecture?",
        answer:
          "Business logic sits at the center with zero dependency on frameworks, databases, or UI. Those volatile pieces live in outer 'adapters' that depend inward on the core, never the reverse.",
      },
      {
        question: "What is a 'port' and what is an 'adapter' in this style of architecture?",
        answer:
          "A port is an abstraction the core defines for what it needs (e.g., 'something that can save an order'). An adapter implements a port with real technology (e.g., a Postgres-backed order repository, or an HTTP controller).",
      },
      {
        question: "Why keep business logic independent of the web framework?",
        answer:
          "So you can test and evolve the business logic without a running framework or server, and upgrade or replace the framework without risking the app's core rules.",
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
      "Organize code around the real business concepts it models, with entities, value objects, and a vocabulary shared with domain experts, not around technical convenience.",
    explanation: `
A common failure: a team builds a shipping feature. With the warehouse
manager they talk about "packages", "shipments", and "carriers". In the
code, it all becomes generic \`Record\` objects with string fields and
\`type\` flags, shaped however was easiest to store.

Six months later, a new engineer can't tell which fields matter, what a
"shipment" may do, or how it differs from a "package". The business
concepts got lost in translation.

**Domain-Driven Design** works the other way. Model the code around the
real business concepts (the "domain"), using the exact words the
business experts use, everywhere: in conversations, code, and docs.
That shared vocabulary is the **ubiquitous language**. Using it
consistently closes the gap between what the business means and what
the code says.

Two building blocks show up constantly:

- An **entity** has a distinct identity that lasts even as its
  attributes change. An \`Order\` with an ID is still "the same order"
  after its status goes from "pending" to "shipped".
- A **value object** has no identity. It's defined entirely by its
  values, and two with the same values are equal and interchangeable. A
  \`Money\` of "$20.00 USD" is simply the same value as any other
  \`Money\` with that amount and currency.

DDD is a large topic. This is a starting foothold, not the whole
picture.
  `.trim(),
    analogy:
      "A doctor and patient need the same words for the same things: 'the left knee', not 'that joint thing'. DDD insists the code uses the same precise vocabulary as the people who understand the business, not its own generic terms.",
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
          "Nothing here reflects the domain's real concepts. A bare 'amount' number invites bugs (cents vs. dollars), and no code says what a Shipment is allowed to do.",
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
          "Money is a value object: two with the same amount and currency are interchangeable. Shipment is an entity: its id makes it 'the same shipment' as its status changes, and its own method enforces the rule about when it can be dispatched.",
        walkthrough: [
          {
            code: "class Money { constructor(amountCents, currency) { ... } equals(other) { ... } }",
            explanation: "A value object: defined entirely by its data, with no identity, and equality based on its values.",
          },
          {
            code: "class Shipment { constructor(id, cost) { this.id = id; ... } }",
            explanation: "An entity: its identity (id) lasts as its other attributes change.",
          },
          {
            code: "markDispatched() { if (this.status !== \"pending\") throw new Error(...); ... }",
            explanation: "The domain rule lives on the entity, in the business's own word ('dispatched'), not in a stray if-check elsewhere.",
          },
        ],
      },
    ],
    howItWorks: `
DDD starts with conversations, not code. Engineers and domain experts
pin down the exact meaning of terms ("what counts as a 'dispatched'
shipment?") and agree to use them everywhere.

Those terms become the names of classes, methods, and fields:

- An entity for each concept with a real identity.
- A value object for each concept defined purely by its data.
- Methods on those objects that enforce the business rules, instead of
  loose if-checks scattered across service functions.
  `.trim(),
    whyItExists: `
It closes the gap between what the business means and what the code
says. Left open, that gap causes:

- Miscommunication: an engineer builds the wrong thing because "order"
  meant something subtly different to them.
- Code that's hard to trust: business rules are scattered as ad-hoc
  checks instead of living in one clearly named place that matches how
  the business describes them.
  `.trim(),
    whenToUse: `
DDD pays off in parts of a system with complex, valuable business
logic: the "core domain" the business competes on. It's most worth it
when you have real access to domain experts and the logic is
complicated enough that getting concepts exactly right matters.
  `.trim(),
    whenNotToUse: `
For a simple CRUD screen where the "domain" is "store this form and show
it back", entities, value objects, and a curated ubiquitous language
are overhead with nothing to justify them. Save full DDD for parts of
the system where the domain really is complex.
  `.trim(),
    commonMistakes: [
      "Letting the code's vocabulary drift from the business's (e.g., the business now says 'return' but the code still says 'refund') instead of actively maintaining the ubiquitous language.",
      "Making every object an entity with an ID, even natural value objects (like an amount of money or an address), which adds needless identity tracking.",
      "Putting business rules in generic service functions instead of on the entities and value objects, losing much of DDD's benefit while still using its vocabulary.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "For an online bookstore, decide whether 'Book' (a specific physical copy tracked in inventory) and 'ISBN' should be entities or value objects. Justify each choice.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Using the loosely typed 'shipment' example above, write a small ubiquitous-language glossary (5-6 terms) that the warehouse and engineering teams would agree on.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Model a 'hotel room booking' domain with at least one entity and one value object. Include one business rule enforced as a method on the entity (e.g., a booking can't be modified within 24 hours of check-in).",
      },
    ],
    interviewQuestions: [
      {
        question: "What is the 'ubiquitous language' in Domain-Driven Design?",
        answer:
          "A shared vocabulary that engineers and domain experts build together and use consistently in conversations, docs, and code. It removes the translation gap between how the business talks and how the code is written.",
      },
      {
        question: "What's the difference between an entity and a value object?",
        answer:
          "An entity has a distinct identity that lasts as its attributes change; two entities are 'the same' only if their identity matches. A value object has no identity and is defined entirely by its data; two with the same data are equal.",
      },
      {
        question: "Why does DDD emphasize putting business rules on the domain objects themselves rather than in separate service functions?",
        answer:
          "So each rule lives in one place, named in the business's vocabulary, and is enforced wherever the object is used, instead of being reimplemented or forgotten in scattered if-checks.",
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
      "Choosing whether to keep multiple projects or packages in one shared repository or in separate ones, and the tradeoffs of each.",
    explanation: `
Once a system grows past one app (say, a web frontend, a backend API,
and a couple of shared libraries), you face a structural question that
has nothing to do with classes or layers: how many git repositories
should it all live in?

Put every app and shared package into **one repository** and you have a
**monorepo**:

- A change to both the frontend and a shared library is one commit and
  one pull request.
- Every project always sees the latest version of every shared package,
  since there's only one copy.
- But the repo grows large, build systems and CI must be taught to
  handle many projects efficiently, and teams can more easily step on
  each other's code.

Give each project **its own repository** and you have a **polyrepo**:

- Each team gets a clean, independently versioned space with clear
  ownership. Unrelated changes never show up in your history.
- But sharing code means publishing and versioning packages instead of
  importing a local file.
- A change across repos means coordinating several pull requests,
  reviews, and release timings, which is much more overhead.

Neither is universally "correct". Large companies succeed with both,
and some run a mix.
  `.trim(),
    analogy:
      "A monorepo is one big shared office building: easy to walk over and coordinate, but you need clear floor plans (tooling) so teams don't clutter each other's space. A polyrepo is a separate building per team: cleaner boundaries, but meetings between buildings take more coordination.",
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
          "A formatCurrency fix must be released as a new package version before web-app can use it: two steps, two repos, two reviews.",
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
          "The fix and its usage are reviewed and merged together, atomically, with no separate release step. The cost: both projects now live in one shared repository, built by shared tooling.",
      },
    ],
    howItWorks: `
The key difference is how code crosses a project boundary.

In a polyrepo, it always goes through a published, versioned package.
That adds process, but also a deliberate checkpoint: you choose when to
upgrade.

In a monorepo, it's just an import. There's no checkpoint (everyone is
always on the latest version), and you need tooling that works out
which parts of a huge repo to rebuild or retest for each change, since
rebuilding everything on every commit doesn't scale.
  `.trim(),
    whyItExists: `
It's an open tradeoff, not a solved problem. The two costs (coordination
across repos vs. tooling and organizational overhead in one giant repo)
both grow with organization size, but in opposite directions.

Small, tightly coordinated teams feel the coordination cost more. Large
organizations with many independent teams feel the "everyone in one
giant repo" cost more. That's why both models succeed at scale.
  `.trim(),
    whenToUse: `
A monorepo fits when projects share a lot of code and evolve together,
you want atomic changes across projects, and you'll invest in tooling
to keep builds and tests fast as it grows. It also avoids polyrepo
drift over "which version of the shared library is everyone on".
  `.trim(),
    whenNotToUse: `
A polyrepo fits better when:

- Projects are truly independent (different release cycles, teams with
  little overlap, or even other companies or open-source consumers).
- A monorepo's shared tooling and access would add coordination cost
  with no matching benefit.
- You want strict, deliberate version boundaries between components.
  `.trim(),
    commonMistakes: [
      "Adopting a monorepo without investing in tooling (like build caching or affected-project detection), so CI gets painfully slow as it grows.",
      "Using a polyrepo for tightly coupled projects that always change together, causing a stream of synchronized multi-repo pull requests for nearly every feature.",
      "Treating the choice as permanent instead of revisiting it as the number of teams, projects, and shared code changes.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "In your own words, list two concrete costs and two concrete benefits of a monorepo, and the same for a polyrepo, based on the explanation above.",
      },
      {
        difficulty: "Medium",
        prompt:
          "One small team builds a web frontend, a mobile app, and a shared design-system package both use. Argue whether a monorepo or polyrepo fits better, and why.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Describe a tooling problem a very large monorepo (thousands of projects) must solve that a small one doesn't, and outline one high-level strategy for solving it.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is the core tradeoff between a monorepo and a polyrepo?",
        answer:
          "A monorepo makes cross-project changes atomic and keeps everyone on the same version of shared code, but needs tooling to scale and clearer internal boundaries. A polyrepo gives each project a clean, independently versioned and owned space, but needs package publishing and multi-repo coordination for shared changes.",
      },
      {
        question: "Why does a monorepo need special build tooling as it grows?",
        answer:
          "Rebuilding and retesting every project on every commit doesn't scale. Tooling must work out which projects a change actually affects and only rebuild and retest those.",
      },
      {
        question: "In a polyrepo setup, how does one project pick up a bugfix made in a shared library?",
        answer:
          "The library publishes a new package version. The consuming project then updates its dependency and goes through its own release process. It's not automatic like a local import.",
      },
    ],
    relatedTopics: ["layered-architecture", "clean-architecture"],
    keywords: ["monorepo", "polyrepo", "multi-repo", "repository structure", "package management"],
  },
];
