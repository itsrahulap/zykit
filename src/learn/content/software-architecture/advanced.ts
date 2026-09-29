import type { Topic } from "../../types/content";

export const softwareArchitectureAdvancedTopics: Topic[] = [
  {
    id: "event-sourcing-and-cqrs",
    title: "Event Sourcing & CQRS",
    level: "advanced",
    description:
      "Storing every change that happened instead of just the current state, and separating the model used to write data from the model used to read it.",
    explanation: `
Most applications store only the *current* state: a \`bankAccount\` row
with a \`balance\` column. Every deposit or withdrawal just overwrites
that number. This works fine until someone asks: "how did this account
end up at $340? What was the sequence of transactions?" With only the
current balance saved, that history is simply gone — you'd have to have
been logging it separately from the start, and even then, reconstructing
"what the account looked like at 3pm last Tuesday" from an ad-hoc log is
painful.

**Event sourcing** solves this by flipping what gets saved: instead of
storing the current balance, you store the full sequence of things that
happened — \`AccountOpened\`, \`Deposited($100)\`, \`Withdrew($40)\` — as an
ordered list of **events**. The current balance is never stored
directly; it's calculated by replaying all the events from the
beginning (or from a saved checkpoint). This gives you a complete,
trustworthy history for free, the ability to see the state at any point
in time, and the ability to fix a bug in your calculation logic and
*replay* history to get corrected current state.

A separate but often-paired problem: in many real systems, the shape of
data you want when *writing* (validate this transaction, apply business
rules, ensure consistency) is very different from the shape you want
when *reading* (a denormalized, pre-joined view optimized for a
dashboard, searchable and fast). Forcing both to go through the exact
same model is often either slow for reads or awkward for writes.
**CQRS (Command Query Responsibility Segregation)** addresses this by
using a different model for writes ("commands," which change state)
than for reads ("queries," which just fetch data) — they can even live
in entirely different databases, optimized independently.

Event sourcing and CQRS are frequently used together — events are the
natural "write model," and a read-optimized view is built by projecting
those events into whatever shape reads need — but they're separate
ideas that solve separate problems, and either can be adopted without
the other.
  `.trim(),
    analogy:
      "Event sourcing is like a bank keeping every transaction slip ever issued, rather than just a whiteboard with today's balance — the balance can always be recomputed, and you can answer 'what happened on March 3rd?' CQRS is like that same bank having a fast teller window for withdrawals (optimized for correctness) and a completely separate printed monthly statement (optimized for readability) — both describe the same account, built differently for different purposes.",
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
          "Both approaches agree the balance is 60, but only the event-sourced version can answer 'what was the balance right after the deposit?' or 'replay history with a corrected fee calculation.'",
        walkthrough: [
          {
            code: 'const events = [{ type: "AccountOpened", ... }, ...]',
            explanation: "Every meaningful change is captured as an immutable, ordered event — nothing is ever overwritten or deleted.",
          },
          {
            code: "function currentBalance(events) { return events.reduce(...); }",
            explanation: "The 'current state' isn't stored anywhere directly — it's derived on demand by replaying the events from the start.",
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
          "Withdrawing money goes through strict validation against the event history (the write/command side). Displaying a dashboard reads from a separate, pre-computed, denormalized store built by 'projecting' events as they happen (the read/query side) — each side is optimized for its own job.",
      },
    ],
    howItWorks: `
In an event-sourced, CQRS system, a **command** (like "withdraw $40")
first passes through validation against the current state — reconstructed
by replaying events (often from a periodic **snapshot** so you don't
replay the entire history every time). If valid, a new event is appended
to an append-only **event store**. Separately, one or more **projections**
listen for new events and update whatever read-optimized views they're
responsible for — a search index, a dashboard table, a cache. Reads never
go through the command path at all; they query the projection directly.
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
information many systems eventually need — audit trails, debugging
("how did we get into this bad state?"), and the ability to fix
calculation bugs retroactively by replaying corrected logic over
history. CQRS exists because forcing reads and writes through one
shared model creates a lose-lose compromise: either the model is
normalized and safe for writes but slow and awkward for the complex
reads a UI wants, or it's denormalized and fast for reads but risks
inconsistency for writes. Splitting them lets each side be optimized
for what it actually needs to do.
  `.trim(),
    whenToUse: `
Reach for event sourcing when a full audit history is a real business
requirement (financial ledgers, inventory changes, anything regulators
or support teams need to reconstruct), or when "what happened, and in
what order" is itself valuable data. Reach for CQRS when read and write
patterns have genuinely diverged — heavy, complex reads (dashboards,
search, reports) alongside a write side that needs strict, careful
validation.
  `.trim(),
    whenNotToUse: `
Both add substantial complexity: event sourcing means every query for
"current state" needs replay logic (or snapshotting infrastructure) and
schema changes to events must be handled carefully since old events
never disappear; CQRS means running and keeping two models in sync,
often with eventual consistency between them. For a typical CRUD
application with straightforward, aligned read/write needs and no
audit requirement, this is significant overhead for no real benefit —
plain current-state storage is simpler and should be the default.
  `.trim(),
    commonMistakes: [
      "Adopting event sourcing without a plan for handling changes to event schemas over time — old events were recorded under an old shape and can't be rewritten, only accommodated.",
      "Assuming CQRS requires two separate databases and heavy infrastructure from day one, when a simpler version (two different query paths against related tables) can capture much of the benefit at far lower cost.",
      "Using event sourcing purely 'because it's interesting' on a system with no real audit or replay need, rather than as a response to an actual requirement.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Given a list of events (`ItemAdded`, `ItemRemoved`) for a shopping cart, write a function that computes the current cart contents by replaying them.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Design the events (names and payloads) you'd need to fully event-source a simple task-tracking app's task lifecycle (created, assigned, completed, reopened).",
      },
      {
        difficulty: "Hard",
        prompt:
          "For an e-commerce order system, describe how you'd split the write model (placing/cancelling orders) from a read model (a customer-facing order history page), including what a projection would need to do to keep the read model updated.",
      },
    ],
    interviewQuestions: [
      {
        question: "What problem does event sourcing solve that traditional current-state storage doesn't?",
        answer:
          "It preserves the complete history of how a system reached its current state, rather than only the final value — enabling audit trails, point-in-time reconstruction, and the ability to replay history with corrected logic.",
      },
      {
        question: "What does CQRS stand for, and what does it actually separate?",
        answer:
          "Command Query Responsibility Segregation — it separates the model used to change state (commands, which enforce business rules) from the model used to read state (queries, which can be denormalized and optimized purely for fast, convenient reads).",
      },
      {
        question: "Why are event sourcing and CQRS often used together, even though they're separate concepts?",
        answer:
          "Because the stream of events from an event-sourced write model is a natural source to build one or more read-optimized projections from, giving CQRS's read side a ready-made, complete feed of everything that changed.",
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
      "Writing down significant architecture decisions and the reasoning behind them, so future maintainers understand why a choice was made, not just what was chosen.",
    explanation: `
Six months after a team decides to use a message queue instead of
direct API calls between two services, a new engineer joins, looks at
the code, and wonders: "why is this so much more complicated than just
calling the other service directly?" Nobody left a trace of the
reasoning — maybe there was a good reason (the other service was
unreliable and needed to be decoupled), or maybe it was a mistake that's
now safe to undo. Without a record, both possibilities look identical,
and the team either lives with a decision they don't understand or
risks reverting something that was actually load-bearing.

An **Architectural Decision Record (ADR)** is a short, standalone
document — usually just one file per decision — that captures a single
significant architectural choice: the problem or context that prompted
it, the options that were considered, the decision that was made, and
the consequences (including tradeoffs accepted). ADRs are typically kept
right in the codebase (often a folder like \`docs/adr/\`), numbered in
order, and treated as immutable history — if a decision is later
reversed, you write a *new* ADR that supersedes the old one rather than
editing the old one out of existence, so the historical reasoning is
never lost.

The key shift in mindset: most documentation describes the system *as
it is now*. An ADR deliberately preserves a snapshot of reasoning *at
the moment a decision was made*, including the constraints and
alternatives that no longer apply today — because that context is
exactly what's needed to judge whether the decision is still right, or
safe to revisit.
  `.trim(),
    analogy:
      "A doctor's chart doesn't just record a patient's current medication — it records why a medication was prescribed and what alternatives were ruled out at the time, so a different doctor later can tell whether circumstances have changed enough to reconsider it.",
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
          "Notice this isn't just 'what' (use a queue) — it records the actual problem, the alternatives that were seriously considered and why they were rejected, and the honest tradeoffs accepted (a small delay is now introduced).",
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
          "ADRs are numbered and kept permanently, even after being superseded, so the history of *why* the architecture evolved the way it did is never lost — only added to.",
      },
    ],
    howItWorks: `
An ADR is written at the moment a significant, hard-to-reverse decision
is made — typically as part of the same pull request or discussion that
implements it, while the context is fresh. It follows a small, consistent
template (context, decision, alternatives, consequences) so any team
member can write and read one quickly. Crucially, once written, an ADR
is not edited to reflect new information — if the decision changes later,
a new ADR is written that references and supersedes the old one, so the
full history of reasoning stays intact and in order.
  `.trim(),
    whyItExists: `
It exists because the *reasoning* behind a decision decays far faster
than the decision's effects in the code — the code stays, but the
constraints, alternatives, and tradeoffs that justified it live only in
people's memories, which fade or leave the company. Without a record,
every future engineer either has to blindly trust past decisions
forever, or risk re-litigating (and possibly reverting) decisions that
were actually correct given context they can no longer see.
  `.trim(),
    whenToUse: `
Write an ADR for decisions that are expensive to reverse, affect
multiple teams or a large part of the codebase, or involved real
tradeoffs between competing options — choice of a database, a major
architectural pattern, a significant third-party dependency, a
cross-service communication style.
  `.trim(),
    whenNotToUse: `
Don't write an ADR for routine, easily-reversible implementation
decisions (a function's internal algorithm, a variable naming
convention) — that's what code comments or regular documentation are
for. Writing an ADR for every small decision buries the genuinely
important ones in noise and makes the practice feel like bureaucratic
overhead instead of a useful record.
  `.trim(),
    commonMistakes: [
      "Writing an ADR that only states the decision without the context and rejected alternatives — losing exactly the information that makes ADRs valuable later.",
      "Editing or deleting old ADRs to 'keep them up to date' instead of writing a new ADR that supersedes the old one, destroying the historical trail.",
      "Writing ADRs so long and formal that nobody keeps up the practice — the format should stay lightweight enough to actually get used consistently.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Write a short ADR for a real or hypothetical decision to use TypeScript instead of plain JavaScript for a new project, including at least one rejected alternative.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Find (or recall) a significant technical decision made on a project you've worked on that was never documented. Reconstruct an ADR for it as best you can, noting what context you had to guess at.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Write two linked ADRs: one deciding to build a feature as a monolith module, and a second, later ADR that supersedes it by deciding to extract that module into a separate service, referencing what changed to justify the reversal.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is an Architectural Decision Record?",
        answer:
          "A short document capturing one significant architectural decision — the context that prompted it, the alternatives considered, the decision made, and its consequences — kept as a permanent record for future maintainers.",
      },
      {
        question: "Why shouldn't an old ADR be edited when a decision is later reversed?",
        answer:
          "Because the old ADR preserves the reasoning and constraints that were true at the time the original decision was made; editing it destroys that historical context. Instead, a new ADR is written that explicitly supersedes the old one.",
      },
      {
        question: "What kinds of decisions are worth writing an ADR for?",
        answer:
          "Decisions that are expensive or risky to reverse, affect a significant part of the system or multiple teams, and involved real tradeoffs between alternatives — not routine, easily-reversible implementation details.",
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
