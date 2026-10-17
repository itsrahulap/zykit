import type { Topic } from "../../types/content";

export const softwareArchitectureAdvancedTopics: Topic[] = [
  {
    id: "event-sourcing-and-cqrs",
    title: "Event Sourcing & CQRS",
    level: "advanced",
    description:
      "Store every change that happened instead of just the current state, and use separate models for writing and reading data.",
    explanation: `
Most apps store only the *current* state: a \`bankAccount\` row with a
\`balance\` column that each deposit or withdrawal overwrites. Then
someone asks: "how did this account reach $340? What were the
transactions?" That history is gone. You'd need a separate log from day
one, and even then, rebuilding "the account at 3pm last Tuesday" from
it is painful.

**Event sourcing** flips what you save. Instead of the balance, you
store the ordered list of **events** that happened: \`AccountOpened\`,
\`Deposited($100)\`, \`Withdrew($40)\`. The balance is never stored. It's
calculated by replaying the events from the start (or from a saved
checkpoint). You get:

- A complete, trustworthy history for free.
- The state at any point in time.
- The ability to fix a calculation bug and *replay* history to get the
  corrected current state.

A separate, often-paired problem: the data shape you want for
*writing* (validate a transaction, apply rules, stay consistent) is
very different from the shape for *reading* (a denormalized, pre-joined,
fast, searchable dashboard view). One shared model is often slow for
reads or awkward for writes.

**CQRS (Command Query Responsibility Segregation)** uses one model for
writes ("commands", which change state) and another for reads
("queries", which just fetch data). They can even live in different
databases, each optimized on its own.

The two often go together: events are a natural write model, and read
views are built by projecting events into whatever shape reads need.
But they're separate ideas solving separate problems, and you can adopt
either one alone.
  `.trim(),
    analogy:
      "Event sourcing is a bank keeping every transaction slip instead of a whiteboard with today's balance: the balance can always be recomputed, and you can answer 'what happened on March 3rd?' CQRS is that bank having a teller window for withdrawals (built for correctness) and a separate printed monthly statement (built for readability): same account, built differently for different jobs.",
    examples: [
      {
        title: "Traditional state storage vs. event sourcing",
        code: `// Traditional: only the current state is stored
// accounts table: { id: 1, balance: 60 }
// The history of how it got to 60 is gone.

// Event sourced: every change is stored, in order
const events = [
  { type: "AccountOpened", amount: 0 },
  { type: "Deposited", amount: 100 },
  { type: "Withdrew", amount: 40 },
];

function currentBalance(events) {
  return events.reduce((balance, event) => {
    if (event.type === "Deposited") return balance + event.amount;
    if (event.type === "Withdrew") return balance - event.amount;
    return balance;
  }, 0);
}

currentBalance(events); // 60 — same answer, but the full history is preserved`,
        explanation:
          "Both agree the balance is 60, but only the event-sourced version can answer 'what was the balance right after the deposit?' or 'replay history with a corrected fee calculation.'",
        walkthrough: [
          {
            code: 'const events = [{ type: "AccountOpened", ... }, ...]',
            explanation: "Every meaningful change is an immutable, ordered event. Nothing is ever overwritten or deleted.",
          },
          {
            code: "function currentBalance(events) { return events.reduce(...); }",
            explanation: "The current state isn't stored anywhere. It's derived on demand by replaying the events from the start.",
          },
        ],
      },
      {
        title: "CQRS: separate models for writing and reading",
        code: `// Write model (command side): enforces business rules, one account at a time
class AccountCommandHandler {
  withdraw(accountId, amount) {
    const events = eventStore.load(accountId);
    const balance = currentBalance(events);
    if (balance < amount) throw new Error("Insufficient funds");
    eventStore.append(accountId, { type: "Withdrew", amount });
  }
}

// Read model (query side): a denormalized view, rebuilt from events,
// optimized for a dashboard showing every account at once
class AccountSummaryProjection {
  onEvent(event) {
    if (event.type === "Withdrew") {
      dashboardDb.updateBalance(event.accountId, -event.amount);
    }
  }
}
// A dashboard query just reads dashboardDb directly — fast, pre-computed,
// and never touches the event store or the write-side business rules.`,
        explanation:
          "A withdrawal is strictly validated against the event history (the write/command side). The dashboard reads from a separate, pre-computed, denormalized store built by 'projecting' events as they happen (the read/query side). Each side is optimized for its own job.",
      },
    ],
    howItWorks: `
A **command** (like "withdraw $40") is validated against the current
state, rebuilt by replaying events (often from a periodic **snapshot**,
so you don't replay all of history each time). If valid, a new event is
appended to an append-only **event store**.

Separately, **projections** listen for new events and update their
read-optimized views: a search index, a dashboard table, a cache. Reads
never touch the command path; they query the projection directly.
  `.trim(),
    diagram: `
  Command  --> [ validate against replayed state ] --> Event Store (append-only)
                                                             |
                                                             v
                                                     Projection(s) update
                                                     read-optimized views
                                                             |
  Query    <--------------------------------------- Read Model(s)
  `.trim(),
    whyItExists: `
Event sourcing exists because "just the current state" throws away
what many systems eventually need: audit trails, debugging ("how did we
get into this bad state?"), and fixing calculation bugs retroactively
by replaying corrected logic over history.

CQRS exists because one shared model for reads and writes is a
lose-lose compromise. Normalized, it's safe for writes but slow and
awkward for the complex reads a UI wants. Denormalized, it's fast for
reads but risks inconsistent writes. Splitting them lets each side be
optimized for its own job.
  `.trim(),
    whenToUse: `
Use event sourcing when a full audit history is a real business
requirement (financial ledgers, inventory changes, anything regulators
or support teams must reconstruct), or when "what happened, and in what
order" is valuable data itself.

Use CQRS when read and write patterns have truly diverged: heavy,
complex reads (dashboards, search, reports) alongside a write side that
needs strict validation.
  `.trim(),
    whenNotToUse: `
Both add a lot of complexity:

- Event sourcing: every "current state" query needs replay logic (or
  snapshot infrastructure), and event schema changes need care, since
  old events never disappear.
- CQRS: you run two models and keep them in sync, often with eventual
  consistency between them.

For a typical CRUD app with aligned read/write needs and no audit
requirement, that's heavy overhead for no real benefit. Plain
current-state storage is simpler and should be the default.
  `.trim(),
    commonMistakes: [
      "Adopting event sourcing with no plan for event schema changes. Old events were recorded in an old shape and can't be rewritten, only accommodated.",
      "Assuming CQRS needs two databases and heavy infrastructure from day one, when a simpler version (two query paths against related tables) captures much of the benefit far more cheaply.",
      "Using event sourcing 'because it's interesting' on a system with no real audit or replay need.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Given a shopping cart's events (`ItemAdded`, `ItemRemoved`), write a function that computes the current cart contents by replaying them.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Design the events (names and payloads) needed to fully event-source a simple task tracker's task lifecycle (created, assigned, completed, reopened).",
      },
      {
        difficulty: "Hard",
        prompt:
          "For an e-commerce order system, describe how you'd split the write model (placing/cancelling orders) from a read model (a customer-facing order history page), including what a projection must do to keep the read model updated.",
      },
    ],
    interviewQuestions: [
      {
        question: "What problem does event sourcing solve that traditional current-state storage doesn't?",
        answer:
          "It keeps the full history of how the system reached its current state, not just the final value. That enables audit trails, point-in-time reconstruction, and replaying history with corrected logic.",
      },
      {
        question: "What does CQRS stand for, and what does it actually separate?",
        answer:
          "Command Query Responsibility Segregation. It separates the model that changes state (commands, which enforce business rules) from the model that reads state (queries, which can be denormalized and optimized for fast, convenient reads).",
      },
      {
        question: "Why are event sourcing and CQRS often used together, even though they're separate concepts?",
        answer:
          "An event-sourced write model produces a stream of events, which is a natural source for building read-optimized projections. It gives CQRS's read side a complete, ready-made feed of every change.",
      },
    ],
    prerequisites: ["clean-architecture", "domain-driven-design-basics"],
    relatedTopics: ["domain-driven-design-basics", "technical-debt"],
    keywords: ["event sourcing", "CQRS", "command query responsibility segregation", "event store", "projections"],
  },

  {
    id: "architectural-decision-records",
    title: "Architectural Decision Records (ADRs)",
    level: "advanced",
    description:
      "Write down major architecture decisions and the reasons behind them, so future maintainers know why a choice was made, not just what it was.",
    explanation: `
A team picks a message queue over direct API calls between two
services. Six months later, a new engineer asks: "why is this so much
more complicated than calling the other service directly?"

Nobody recorded the reasoning. Maybe there was a good reason (the other
service was unreliable and needed decoupling), or maybe it was a
mistake that's now safe to undo. Without a record, both look the same.
The team either lives with a decision it doesn't understand or risks
reverting something load-bearing.

An **Architectural Decision Record (ADR)** is a short document, usually
one file per decision, that captures one significant choice:

- The context or problem that prompted it.
- The options considered.
- The decision made.
- The consequences, including tradeoffs accepted.

ADRs usually live in the codebase (often \`docs/adr/\`), numbered in
order, and are treated as immutable history. If a decision is reversed,
you write a *new* ADR that supersedes the old one instead of editing
it away, so the original reasoning is never lost.

Most documentation describes the system *as it is now*. An ADR keeps a
snapshot of reasoning *at the moment of the decision*, including
constraints and alternatives that no longer apply. That context is
what you need to judge whether the decision is still right or safe to
revisit.
  `.trim(),
    analogy:
      "A doctor's chart records not just current medication but why it was prescribed and which alternatives were ruled out, so a later doctor can tell whether things have changed enough to reconsider.",
    examples: [
      {
        title: "A minimal ADR",
        code: `# ADR-0007: Use a message queue between OrderService and ShippingService

## Status
Accepted

## Context
ShippingService has intermittent downtime during deploys (roughly
weekly). OrderService currently calls it synchronously via HTTP, so
those deploys cause order placement to fail for end users.

## Decision
Introduce a message queue (SQS) between the two services. OrderService
publishes an "OrderPlaced" event and returns immediately; ShippingService
consumes it whenever it's available.

## Alternatives considered
- Retrying the HTTP call with backoff — rejected, still fails if the
  outage outlasts the retry window.
- Making ShippingService's deploys zero-downtime — rejected for now,
  would require infra work outside this team's control.

## Consequences
- Order placement no longer fails due to ShippingService downtime.
- Order and shipment creation are no longer strictly synchronous —
  there's a small delay, and OrderService needs a way to show
  "processing" status to the user in the meantime.`,
        explanation:
          "It's not just 'what' (use a queue). It records the real problem, the alternatives considered and why they were rejected, and the honest tradeoffs accepted (a small delay).",
      },
      {
        title: "Structuring ADRs as they accumulate",
        code: `docs/adr/
  0001-use-postgres-for-primary-storage.md
  0002-adopt-monorepo-for-frontend-and-backend.md
  0007-use-message-queue-between-order-and-shipping.md
  0012-supersede-0007-move-to-synchronous-calls-with-circuit-breaker.md
    // ^ ADR-0007 is not deleted or edited — 0012 references and
    //   supersedes it once circumstances changed, keeping the
    //   original reasoning intact for anyone looking back.`,
        explanation:
          "ADRs are numbered and kept forever, even when superseded, so the history of *why* the architecture evolved is never lost, only added to.",
      },
    ],
    howItWorks: `
Write an ADR when a significant, hard-to-reverse decision is made,
usually in the same pull request or discussion, while the context is
fresh. A small, consistent template (context, decision, alternatives,
consequences) makes it quick for anyone to write and read.

Once written, an ADR is never edited for new information. If the
decision changes, a new ADR references and supersedes it, keeping the
full history of reasoning intact and in order.
  `.trim(),
    whyItExists: `
The *reasoning* behind a decision fades much faster than its effects in
the code. The code stays, but the constraints, alternatives, and
tradeoffs live only in people's memories, which fade or leave the
company.

Without a record, future engineers must either trust past decisions
blindly or risk re-arguing (and maybe reverting) decisions that were
right given context they can no longer see.
  `.trim(),
    whenToUse: `
Write an ADR for decisions that are expensive to reverse, affect
several teams or much of the codebase, or involved real tradeoffs: a
database choice, a major architectural pattern, a significant
third-party dependency, a cross-service communication style.
  `.trim(),
    whenNotToUse: `
Skip ADRs for routine, easily reversed implementation choices (a
function's internal algorithm, a naming convention). Code comments and
regular docs cover those. An ADR for every small decision buries the
important ones and makes the practice feel like bureaucracy.
  `.trim(),
    commonMistakes: [
      "Stating only the decision, without the context and rejected alternatives, which is exactly the information that makes ADRs valuable later.",
      "Editing or deleting old ADRs to 'keep them up to date' instead of writing a new one that supersedes them, destroying the historical trail.",
      "Making ADRs so long and formal that nobody keeps writing them. Keep the format light enough to use consistently.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Write a short ADR for a real or imagined decision to use TypeScript instead of plain JavaScript for a new project. Include at least one rejected alternative.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Think of a significant technical decision on one of your projects that was never documented. Reconstruct an ADR for it as best you can, noting which context you had to guess.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Write two linked ADRs: one deciding to build a feature as a monolith module, and a later one that supersedes it by extracting the module into a separate service, citing what changed to justify the reversal.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is an Architectural Decision Record?",
        answer:
          "A short document that captures one significant architectural decision (its context, the alternatives considered, the decision, and its consequences) and is kept as a permanent record for future maintainers.",
      },
      {
        question: "Why shouldn't an old ADR be edited when a decision is later reversed?",
        answer:
          "The old ADR preserves the reasoning and constraints that were true when the decision was made. Editing it destroys that context. Instead, write a new ADR that explicitly supersedes it.",
      },
      {
        question: "What kinds of decisions are worth writing an ADR for?",
        answer:
          "Decisions that are expensive or risky to reverse, affect a large part of the system or several teams, and involved real tradeoffs between alternatives. Not routine, easily reversed implementation details.",
      },
    ],
    relatedTopics: ["technical-debt"],
    keywords: ["ADR", "architectural decision record", "documentation", "decision log"],
  },

  {
    id: "technical-debt",
    title: "Technical Debt",
    level: "advanced",
    description:
      "The tradeoff between shipping a faster, less-ideal solution now and the ongoing cost of maintaining or fixing it later — much like financial debt.",
    explanation: `
Sometimes a team deliberately ships the quick, hacky version of a
feature to hit a deadline, fully intending to come back and do it
properly later. Sometimes a team doesn't even realize the shortcut is a
shortcut until much later, when a "simple" change turns out to be
surprisingly hard because of decisions made months ago. Both situations
are examples of the same underlying idea, borrowed directly from
finance: **technical debt**.

Just like financial debt, taking on technical debt isn't inherently
bad — borrowing money to seize a real opportunity can be the right call.
The shortcut that ships a feature two weeks earlier than the "proper"
version might win you a customer, validate an idea, or hit a deadline
that genuinely matters. The debt itself is often a reasonable trade.

The part that has to be taken seriously is the **interest**: the
ongoing extra cost that accrues for as long as the debt is unpaid. A
messy, hastily-built module doesn't just cost what it cost to build —
every future change that touches it takes longer, every bug in it is
harder to track down, and every new engineer takes longer to understand
it. Left alone indefinitely, that interest compounds: the mess makes
the next shortcut more tempting (because doing it properly next to
existing mess feels pointless), which makes the codebase harder to work
in, which makes rushed shortcuts more likely — a debt spiral.

The discipline isn't "never take on technical debt." It's *knowing you
took it on*, being deliberate about it, and having a real plan — and
ideally a written record, like an ADR — for paying it down before the
interest outweighs whatever the shortcut bought you.
  `.trim(),
    analogy:
      "Financial debt: borrowing money to open a store sooner (a reasonable trade) still means paying interest every month until it's paid off. Ignore the debt for years and the interest payments alone can exceed what you originally borrowed — the same dynamic hits a codebase's 'quick and hacky' shortcuts left unaddressed.",
    examples: [
      {
        title: "Taking on technical debt deliberately, and marking it",
        code: `// TECH DEBT: hard-coded to a single currency (USD) to hit the launch
// deadline. Proper fix: support the Money value object with currency
// conversion once international launch is scheduled. Tracked in JIRA-482.
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.priceInCents, 0);
}`,
        explanation:
          "The shortcut is real (no multi-currency support), but it's explicit, explained, and linked to a tracked follow-up — the team knows exactly what was borrowed and has a plan to pay it back.",
      },
      {
        title: "The same shortcut, left as invisible debt",
        code: `// No comment, no ticket — just a plain-looking function
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.priceInCents, 0);
}
// Six months later, "add support for EUR customers" turns into a much
// bigger project than expected, because nobody remembered — or ever
// knew — that currency was hard-coded everywhere this function is used.`,
        explanation:
          "Identical code, but with no acknowledgment that a shortcut was taken. The 'interest' here isn't just the cost of the eventual fix — it's the extra cost of first rediscovering that debt exists at all.",
      },
    ],
    howItWorks: `
Technical debt accrues "interest" in very concrete ways: slower feature
development in and around the affected code, a higher bug rate because
the shortcut didn't account for edge cases properly, and a steeper
learning curve for anyone new touching that part of the system. Paying
down the debt (refactoring, rewriting, adding the missing tests) is the
"principal payment" — it costs real time up front but removes the
ongoing interest. Deciding *when* to pay it down is a genuine
engineering-management tradeoff: pay too early and you might rework
something that ends up not mattering; pay too late and the interest
may have already outweighed the benefit the shortcut bought.
  `.trim(),
    whyItExists: `
The term exists because "just write it properly the first time, always"
is not a realistic option in a world with real deadlines, uncertain
requirements, and limited time — sometimes a fast, imperfect solution is
legitimately the right call. Naming the tradeoff as "debt" gives teams a
shared, honest vocabulary for discussing shortcuts without either
pretending they don't exist or treating every shortcut as an
unforgivable mistake — it reframes the conversation as a financial
tradeoff to be managed, not a moral failing to be denied.
  `.trim(),
    whenToUse: `
Taking on technical debt deliberately makes sense when the short-term
gain (hitting a real deadline, validating an uncertain idea before
investing further, unblocking a critical launch) clearly outweighs the
interest you'll pay until it's addressed — and especially when you have
a genuine, realistic plan to pay it down. It's also reasonable to accept
some debt permanently on code that's genuinely low-stakes or likely to
be thrown away soon anyway.
  `.trim(),
    whenNotToUse: `
Avoid taking on debt silently, without acknowledging it, tracking it, or
telling anyone — that turns manageable debt into an invisible trap for
whoever encounters it next. Also avoid taking on new debt in an area
that's already deep in unaddressed debt with high interest — that's the
point where a deliberate repayment effort, not another shortcut, is what's
actually needed.
  `.trim(),
    commonMistakes: [
      "Treating all technical debt as universally bad, and refusing any shortcut even when the situation genuinely calls for shipping something imperfect quickly.",
      "Taking on debt without recording it anywhere (a comment, a ticket, an ADR), so it becomes invisible and gets rediscovered the hard way later.",
      "Letting debt accumulate indefinitely with no repayment plan, until the 'interest' — slower development, more bugs — becomes the team's biggest ongoing cost.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Describe a shortcut you've taken (or seen taken) in real code, and identify what the ongoing 'interest' on that shortcut has been.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Write a short technical-debt tracking note (like the comment example above) for a hypothetical shortcut: a search feature that only does exact string matching instead of fuzzy search, taken to hit a launch date.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Propose a lightweight process a small team could adopt to make sure technical debt is recorded and periodically revisited, rather than silently accumulating. Consider how it would connect to sprint planning or code review.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is technical debt, in your own words?",
        answer:
          "The ongoing extra cost incurred by choosing a faster, less-ideal solution now instead of the more thorough one — similar to financial debt, where the shortcut is the 'principal' and the extra cost of working around or fixing it later is the 'interest'.",
      },
      {
        question: "Is taking on technical debt always a bad decision?",
        answer:
          "No — it can be a reasonable tradeoff, such as shipping a simpler solution to hit a real deadline or validate an idea, as long as the debt is acknowledged, tracked, and there's a realistic plan to address it before its ongoing cost outweighs the benefit it bought.",
      },
      {
        question: "What's the danger of undocumented technical debt specifically?",
        answer:
          "It becomes invisible — future engineers don't know a shortcut was taken at all, so they can't factor it into their plans, and it tends to be rediscovered only when it causes an unexpectedly difficult bug or feature.",
      },
    ],
    relatedTopics: ["architectural-decision-records"],
    keywords: ["technical debt", "tech debt", "refactoring", "maintenance cost", "debt and interest"],
  },

  {
    id: "anti-corruption-layer",
    title: "Anti-Corruption Layer",
    level: "advanced",
    description:
      "A translation layer that protects your system's clean internal model from a messy or incompatible external system, so its quirks don't leak inward.",
    explanation: `
Suppose your system needs to integrate with an old, external partner
API that represents money as raw floating-point numbers, uses cryptic
three-letter status codes like \`"PND"\` and \`"CMP"\`, and occasionally
returns a customer's name in an inconsistent format. It would be fast
to just use that data structure directly throughout your own codebase —
but doing so means every part of your system that touches customer or
payment data now has to understand the partner API's quirks, and if you
ever integrate a second partner (or that partner changes their API),
the mess spreads even further.

An **anti-corruption layer** is a deliberate boundary — a small set of
translation code — placed exactly at the seam where your system meets
that external one. Its only job is to convert the external system's
messy, foreign model into your own clean, well-defined internal model
(using proper \`Money\` value objects, a clear \`PaymentStatus\` enum, a
normalized customer name) — and to convert your outgoing data back into
whatever shape the external system expects. Nothing outside that
boundary ever sees the partner API's raw shapes at all.

The name is deliberately vivid: without this layer, the external
system's design decisions — its bad naming, its inconsistent shapes, its
legacy quirks — literally "corrupt" your own model by leaking into it.
The anti-corruption layer is the thing standing in the way of that
corruption spreading inward.
  `.trim(),
    analogy:
      "A country's customs and immigration checkpoint doesn't let foreign currency, foreign paperwork formats, or foreign legal standards flow straight into the domestic system untranslated — everything gets converted (currency exchanged, forms translated, standards checked) right at the border, so the mess of every different country doesn't leak into everyday domestic life.",
    examples: [
      {
        title: "Without an anti-corruption layer: the external shape leaks everywhere",
        code: `// Partner API returns: { amt: 19.99, stat: "PND", cust_nm: "SMITH, JOHN" }
async function displayOrderStatus(orderId) {
  const raw = await partnerApi.getOrder(orderId);
  const isPending = raw.stat === "PND"; // magic string, understood everywhere it's used
  const dollars = raw.amt; // a float, error-prone for money math
  const name = raw.cust_nm.split(", ").reverse().join(" "); // parsing logic scattered wherever it's needed
  return { isPending, dollars, name };
}`,
        explanation:
          "Every function that needs order status, amount, or customer name has to independently know the partner's cryptic codes and inconsistent formats — and duplicate the parsing logic to deal with them.",
      },
      {
        title: "With an anti-corruption layer: one place absorbs the mess",
        code: `// acl/partnerOrderTranslator.js — the ONLY file that knows the partner's raw shape
function translatePartnerOrder(raw) {
  return {
    amount: new Money(Math.round(raw.amt * 100), "USD"), // proper value object
    status: raw.stat === "PND" ? "pending" : raw.stat === "CMP" ? "completed" : "unknown",
    customerName: normalizeName(raw.cust_nm), // "SMITH, JOHN" -> "John Smith"
  };
}

// Everywhere else in the app
async function displayOrderStatus(orderId) {
  const raw = await partnerApi.getOrder(orderId);
  const order = translatePartnerOrder(raw); // clean internal model from here on
  return order.status === "pending";
}`,
        explanation:
          "Only translatePartnerOrder knows the partner's raw field names and quirky codes. Every other part of the app works with a clean, self-consistent internal model (Money, a readable status string, a normalized name) regardless of how messy the source was.",
        walkthrough: [
          {
            code: "function translatePartnerOrder(raw) { ... }",
            explanation: "The anti-corruption layer: the single, isolated place responsible for understanding the external system's quirks.",
          },
          {
            code: 'status: raw.stat === "PND" ? "pending" : ...',
            explanation: "Cryptic external codes are translated into a clear internal vocabulary right at the boundary, never leaking further in.",
          },
          {
            code: "const order = translatePartnerOrder(raw);",
            explanation: "Application code downstream only ever touches the clean internal model — it's fully insulated from the partner API's shape.",
          },
        ],
      },
    ],
    howItWorks: `
An anti-corruption layer sits at the exact boundary between your system
and the external one, exposing an interface shaped entirely around your
internal model. Internally, it does whatever translation is required —
renaming fields, converting units, mapping status codes, reformatting
data, even reconciling structural differences (e.g., the external
system splits into two calls what your model treats as one concept). If
the external system changes its API, or you swap in a second, different
external partner, only this translation layer needs to change — the
rest of your codebase, which only ever spoke your internal model,
doesn't need to know anything happened.
  `.trim(),
    whyItExists: `
It exists because integrating with external systems — especially legacy
ones, third-party vendors, or systems you don't control — inevitably
means dealing with modeling decisions you'd never choose yourself.
Without a deliberate boundary, those decisions creep into your own
domain model piece by piece, until your "clean" internal model is
quietly shaped by someone else's legacy constraints, and every future
integration or vendor change becomes a wide, unpredictable blast radius
instead of a contained one.
  `.trim(),
    whenToUse: `
Use one wherever your system integrates with an external API, legacy
system, or another team's service whose model doesn't match — or you
don't want to be permanently bound to — your own domain model.
It's especially valuable when you might switch or add vendors later, or
when the external system is known to be inconsistent, poorly designed,
or likely to change.
  `.trim(),
    whenNotToUse: `
If the external system's model is already clean, stable, and a
reasonably good match for your own needs, adding a full translation
layer is unnecessary indirection. It's also overkill for a quick
prototype or a one-off integration you know won't be maintained or
extended — the insulation an anti-corruption layer buys isn't worth
much if there's nothing to protect long-term.
  `.trim(),
    commonMistakes: [
      "Letting the external system's raw response objects leak past the translation layer 'just this once,' which reintroduces the exact coupling the layer exists to prevent.",
      "Building the translation layer but shaping your internal model to closely mirror the external one anyway, gaining little real insulation.",
      "Skipping the anti-corruption layer for a 'temporary' integration that ends up living in production for years, by which point removing the coupling is far more expensive.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Given a legacy API that returns dates as US-formatted strings ('MM/DD/YYYY'), write a small translation function that converts them into your internal model's Date objects.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Design an anti-corruption layer for integrating with a third-party shipping API that uses different status codes and a different address format than your internal Order and Address models. List the fields you'd translate.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Your company is switching from one payment processor to another, each with a completely different API shape. Explain how having an anti-corruption layer in place for the first processor changes the amount of work required to add the second one.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is an anti-corruption layer?",
        answer:
          "A translation boundary placed between your system and an external system, converting the external system's model into your own clean internal model (and vice versa), so the external system's quirks and inconsistencies never leak into your core code.",
      },
      {
        question: "Why not just use the external API's data shapes directly throughout your codebase to save time?",
        answer:
          "Because then every part of your codebase that touches that data has to understand the external system's quirks, and any change to the external API or a switch to a different provider forces changes throughout the entire codebase instead of in one isolated place.",
      },
      {
        question: "How does an anti-corruption layer relate to dependency inversion?",
        answer:
          "Both isolate your core logic from a volatile external detail by placing a boundary between them; an anti-corruption layer is essentially dependency inversion and translation applied specifically at the seam with an external or legacy system whose model you don't control.",
      },
    ],
    prerequisites: ["clean-architecture", "domain-driven-design-basics"],
    relatedTopics: ["clean-architecture", "domain-driven-design-basics", "dependency-inversion"],
    keywords: ["anti-corruption layer", "ACL", "legacy integration", "translation layer", "bounded context"],
  },
];
