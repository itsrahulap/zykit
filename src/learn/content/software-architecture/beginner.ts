import type { Topic } from "../../types/content";

export const softwareArchitectureBeginnerTopics: Topic[] = [
  {
    id: "what-is-software-architecture",
    title: "What is Software Architecture?",
    level: "beginner",
    description:
      "The high-level decisions about how a codebase is organized and how its pieces fit together — decided before a single function gets written.",
    explanation: `
Imagine you're about to build a house. Before anyone picks a paint color
or a doorknob, someone has to decide much bigger things first: how many
floors, where the plumbing runs, which walls are load-bearing, where the
electrical panel lives. Get those wrong, and no amount of nice paint
fixes it later — you'd have to tear out walls.

Building software has the same two levels. There's the moment-to-moment
work of writing a function, naming a variable, fixing a bug — that's
like picking the paint color. And then there's a bigger, earlier set of
decisions: How is the codebase split into folders and modules? Which
parts are allowed to talk to which other parts? Where does data enter
the system, and where does it get stored? How do we add a new feature
next year without rewriting everything?

Those big, structural decisions — the ones that are expensive to change
later and that shape everything built on top of them — are what
**software architecture** is about. It's not a single tool or a
diagram; it's the set of choices about how a system is organized so
that it can be built, understood, changed, and grown over time.

A useful way to tell architecture apart from ordinary coding: a coding
decision is usually easy to undo (rename a variable, refactor one
function). An architectural decision is expensive to undo (switch your
whole app from one big codebase to many services, or restructure how
every feature is laid out). Architecture is about the decisions that
are hard to walk back.
  `.trim(),
    analogy:
      "A city planner deciding where roads, water lines, and zoning districts go is doing 'architecture' for the city. A homeowner deciding where to put a bookshelf is not — even though both are decisions about the same city.",
    examples: [
      {
        title: "A structural decision vs. a coding decision",
        code: `// Coding decision: easy to change later, low risk
function formatPrice(cents) {
  return "$" + (cents / 100).toFixed(2);
}

// Architectural decision: hard to change later, high risk
// "All database access goes through a data-access layer.
//  No other part of the app is allowed to write SQL directly."`,
        explanation:
          "Renaming formatPrice or tweaking its formatting is a five-minute change. Reversing the rule about database access — after fifty files have started writing their own SQL — could take weeks.",
        walkthrough: [
          {
            code: "function formatPrice(cents) { ... }",
            explanation:
              "A small, local decision. If it's wrong, you fix one function and move on.",
          },
          {
            code: "// All database access goes through a data-access layer.",
            explanation:
              "A structural rule that many files depend on. Changing it later means touching every place that broke the rule.",
          },
        ],
      },
      {
        title: "The same feature, two different structures",
        code: `// Structure A: everything in one file
// order.js handles validation, pricing, saving to DB, and sending email

// Structure B: split by responsibility
// validateOrder.js
// calculatePrice.js
// saveOrder.js
// sendConfirmationEmail.js`,
        explanation:
          "Both structures can implement the exact same feature. The choice between them is an architectural one — it doesn't change what the app does, only how easy it is to change, test, and understand later.",
      },
    ],
    howItWorks: `
Architecture isn't a single artifact you produce once — it shows up as a
set of ongoing decisions and constraints:

- **Boundaries**: which parts of the code are allowed to know about
  which other parts.
- **Structure**: how the codebase is split into folders, modules, or
  services.
- **Data flow**: where information enters the system, how it moves
  through it, and where it ends up.
- **Consistency**: the shared conventions that let any engineer predict
  where a piece of logic will live before they even open the folder.

None of these decisions are visible in any single function. You only
see them by looking at the codebase as a whole — which is exactly why
architecture is a separate skill from writing individual pieces of
code.
  `.trim(),
    whyItExists: `
Without any structural decisions, a codebase tends to grow into
whatever shape is fastest at each individual moment — and that shape is
rarely the one that's easiest to work with a year later. Architecture
exists because the cost of a codebase isn't just "does it work today,"
it's "how much does every future change cost." Good architectural
decisions made early keep that future cost low; bad ones (or none at
all) compound into a codebase where every small feature requires
understanding — and risks breaking — everything else.
  `.trim(),
    whenToUse: `
Every piece of software has *some* architecture, even if nobody chose
it deliberately — even a single 200-line script has an implicit
structure. The real question isn't "should I do architecture," it's
"should I make these structural decisions on purpose." Do that
deliberately as soon as a codebase is going to be worked on by more
than one person, live longer than a few weeks, or grow past the size
you can hold entirely in your head.
  `.trim(),
    whenNotToUse: `
For a genuine one-off script or a weekend prototype you'll throw away,
spending time designing layers and boundaries is wasted effort — you're
optimizing for a future the code will never have. It's fine, even
correct, to write something quick and messy when you know it's
disposable. The skill is recognizing which situation you're in.
  `.trim(),
    commonMistakes: [
      "Treating architecture as something only 'senior' engineers or a diagram tool produce, rather than a set of decisions every contributor makes and reinforces daily.",
      "Confusing architecture with technology choices (\"we use React\") — the framework you pick is a detail; how you organize logic around it is the architecture.",
      "Over-architecting a throwaway script, or under-architecting a system that's clearly going to grow — both come from not asking 'how long will this live, and who else will touch it?'",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Write two sentences distinguishing a 'coding decision' from an 'architectural decision', using an example from a project you've worked on for each.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Take a small script you've written (or imagine one that reads a CSV, transforms it, and writes a report). List three structural decisions you made, even if you didn't realize you were making them at the time.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Describe a real or hypothetical situation where a codebase had no deliberate architecture, and explain concretely what went wrong as a result (e.g., a change that should have taken an hour took a week).",
      },
    ],
    interviewQuestions: [
      {
        question: "How would you explain software architecture to someone new to the field?",
        answer:
          "It's the set of high-level, structural decisions about how a codebase is organized and how its parts interact — decisions that are expensive to change later, as opposed to routine coding decisions that are cheap to change.",
      },
      {
        question: "Does every piece of software have an architecture, even a small script?",
        answer:
          "Yes — even an unstructured script has an implicit structure (e.g., everything in one file, in one order). Architecture as a discipline is about making those structural decisions deliberately rather than by accident.",
      },
      {
        question: "How is an architectural decision different from an everyday coding decision?",
        answer:
          "An architectural decision is expensive and risky to reverse once other code depends on it (e.g., how modules are allowed to talk to each other); a coding decision, like a variable name or a single function's implementation, is cheap and low-risk to change.",
      },
      {
        question: "What actually makes an architectural decision 'expensive' to reverse, mechanically?",
        answer:
          "The number of other things that have come to depend on it. A variable name is depended on by nothing but its own function. A rule like 'all database access goes through one layer' gets depended on by every feature written after it, so undoing it means finding and rewriting every place that assumed it held.",
      },
      {
        question: "Is software architecture the same thing as choosing a framework or technology stack?",
        answer:
          "No. Picking React or Postgres is a technology choice, and it's often reversible with enough effort. Architecture is how you organize logic *around* whatever technology you picked — the boundaries, layers, and data flow — and a bad architecture built on a great framework is still a bad architecture.",
      },
      {
        question: "What's a practical heuristic for telling whether a decision you're about to make is architectural?",
        answer:
          "Ask how many other parts of the system would need to change if you reversed this decision next month. If the answer is 'just this function,' it's a coding decision. If the answer is 'every feature that touched this area since,' it's architectural.",
      },
      {
        question: "Is architecture something you decide once at the start of a project and then move on from?",
        answer:
          "No — it's an ongoing set of decisions and constraints that get reinforced (or eroded) with every pull request. A codebase's architecture at year two is the sum of every structural choice made along the way, not just whatever was drawn on a whiteboard on day one.",
      },
      {
        question: "What goes wrong when a team treats architecture as something only senior engineers do?",
        answer:
          "Every contributor is still making structural decisions daily — where to put a new module, whether to call another layer directly — whether or not they're labeled as 'architecture.' If only seniors are expected to think about it, those everyday decisions get made without the discipline that keeps the system coherent, and the architecture erodes one convenient shortcut at a time.",
      },
      {
        question: "Can you give an example of over-architecting, and explain why it's a real cost even if the code works?",
        answer:
          "Building a plugin system with multiple abstraction layers for a script that will only ever have one, fixed way of running is over-architecting. It works, but every future reader has to trace through interfaces and indirection that exist for a flexibility the project will never use — that's ongoing comprehension cost paid for a benefit that never arrives.",
      },
      {
        question: "Can you give an example of under-architecting, and what symptom would show up in the codebase?",
        answer:
          "A growing app where every screen's component directly queries the database is under-architected. The symptom is that a single schema change requires touching dozens of unrelated UI files, and no one can safely predict what a change will break, because there's no boundary containing the effect.",
      },
      {
        question: "How would you decide whether a two-week prototype needs deliberate architecture?",
        answer:
          "Ask whether it will be thrown away or whether it's likely to become the actual product. If it's genuinely disposable, spending time on layers and boundaries optimizes for a future the code will never have; if there's real risk it becomes long-lived (which prototypes often do), it's worth at least the cheapest structural decisions — like keeping concerns separated — from the start.",
      },
      {
        question: "Two teams build the exact same feature with different internal structures. Are both making architectural decisions?",
        answer:
          "Yes. Architecture isn't about what the software does — both teams shipped identical behavior — it's about how the code is organized to produce that behavior. The structural choice itself, even if invisible to the end user, is the architecture.",
      },
      {
        question: "What's the relationship between architecture and the total cost of a system over its lifetime?",
        answer:
          "Architecture determines how much every future change costs, not just how much the initial build costs. A system built quickly with no structural thought might look cheaper on day one, but if every subsequent feature requires understanding and risking the entire codebase, the cumulative cost over years is far higher than a system with deliberate boundaries.",
      },
      {
        question: "Why do boundaries — who's allowed to call whom — matter more than which specific technologies are used?",
        answer:
          "Because boundaries control blast radius: they determine how far the effect of a change can spread. Technology choices are usually swappable behind those boundaries without touching the rest of the system, but if the boundaries themselves don't exist, no technology choice will contain the damage of a bad change.",
      },
      {
        question: "How does architecture show up differently in a 200-line script versus a codebase worked on by 50 engineers?",
        answer:
          "In a 200-line script, the 'architecture' might just be the order statements run in — implicit and low-stakes, since one person holds it all in their head. At 50-engineer scale, the same lack of deliberate structure means no one can hold the whole system in their head, so explicit boundaries and conventions become the only way multiple people can predict where logic lives and change it safely.",
      },
      {
        question: "What's a red flag in a pull request that suggests an architectural decision is being made informally?",
        answer:
          "A change that quietly introduces a new way for one part of the system to reach into another — like a UI component importing a database client directly for 'just this one case.' It looks like a small, local fix, but it sets a structural precedent that other changes will copy.",
      },
      {
        question: "If you joined a new team, how would you go about learning the architecture of an existing codebase?",
        answer:
          "Look for the boundaries in practice rather than a diagram: which folders or modules only get imported in one direction, where business rules actually live versus where they're supposed to live, and where a typical feature touches code across the system. Reading a few real pull requests often reveals the actual, lived architecture faster than any document.",
      },
      {
        question: "Why might a technically correct implementation still represent bad architecture?",
        answer:
          "Because 'correct' usually only measures whether the output matches the requirement today. Architecture is judged by how well the system can absorb the *next* change — a correct feature built by copy-pasting business logic into five files is bad architecture even though it currently works, because the next change to that logic now has to be made five times.",
      },
    ],
    relatedTopics: ["separation-of-concerns", "coupling-and-cohesion", "layered-architecture"],
    keywords: ["software architecture", "system design", "structural decisions", "codebase organization"],
  },

  {
    id: "separation-of-concerns",
    title: "Separation of Concerns",
    level: "beginner",
    description:
      "Keeping different responsibilities — like displaying data, fetching it, and validating it — in different places instead of tangled together.",
    explanation: `
Picture a single function that, when a user submits a form, checks that
the email address looks valid, sends the data to the server, formats
the response into HTML, and updates the page — all in one block of
code. It works. But now imagine you need to reuse that validation logic
somewhere else, or you need to test it, or the designer wants the
success message to look different. Every one of those small requests
forces you to wade through the whole tangled function, being careful
not to break the other three things it's also doing.

The fix is to give each responsibility — each **concern** — its own
place: one piece of code whose only job is validating the email, one
whose only job is sending the request, one whose only job is updating
what's on screen. This is called **separation of concerns**. Each piece
becomes small enough to read in one sitting, test on its own, and reuse
in a different context without dragging the other concerns along with
it.

It's less about *where* you draw the lines (that varies by project) and
more about the discipline of *drawing lines at all* — refusing to let
"validate this," "fetch that," and "display this" live in the same
breath of code.
  `.trim(),
    analogy:
      "A restaurant kitchen has a station for chopping vegetables, a station for grilling, and a station for plating — not one cook doing everything at once at a single counter. Each station focuses on one job, so the kitchen can scale, and one person's mistake doesn't ruin every dish.",
    examples: [
      {
        title: "Before: everything tangled together",
        code: `function submitForm(email, password) {
  // validation
  if (!email.includes("@")) {
    alert("Invalid email");
    return;
  }

  // network call
  fetch("/api/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }).then((res) => {
    // updating the UI
    document.getElementById("status").innerText = "Signed up!";
  });
}`,
        explanation:
          "Validation, the network request, and the UI update are all interleaved in one function. You can't test the validation without also triggering a real network call.",
      },
      {
        title: "After: each concern separated",
        code: `function isValidEmail(email) {
  return email.includes("@");
}

function signup(email, password) {
  return fetch("/api/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

function showStatus(message) {
  document.getElementById("status").innerText = message;
}

async function submitForm(email, password) {
  if (!isValidEmail(email)) return showStatus("Invalid email");
  await signup(email, password);
  showStatus("Signed up!");
}`,
        explanation:
          "Now isValidEmail can be unit-tested with no network involved, signup can be reused from a different form, and showStatus can change its rendering without touching the other two.",
        walkthrough: [
          {
            code: "function isValidEmail(email) { ... }",
            explanation:
              "A pure function with one job: answer 'is this a valid email?'. No network, no DOM.",
          },
          {
            code: "function signup(email, password) { ... }",
            explanation:
              "Handles talking to the server, and nothing else — it doesn't know or care how the result is displayed.",
          },
          {
            code: "function showStatus(message) { ... }",
            explanation:
              "Owns updating the page. It doesn't know why the message was chosen.",
          },
          {
            code: "async function submitForm(email, password) { ... }",
            explanation:
              "Coordinates the three concerns in order, but delegates the actual work to each — this is the only place that knows the overall flow.",
          },
        ],
      },
    ],
    howItWorks: `
Separation of concerns works by asking, for every piece of logic, "what
is the single reason this code would need to change?" Validation rules
change for one reason (the business decides what counts as valid).
Network logic changes for another reason (the API changes). Display
logic changes for a third (the designer wants different wording). When
code for multiple reasons-to-change is mixed into one place, a change
driven by any one of those reasons risks breaking the others. Splitting
by concern means each piece only ever changes for its own reason.
  `.trim(),
    whyItExists: `
It exists because tangled code is expensive in very predictable ways:
it's hard to test (you can't isolate one concern), hard to reuse (you'd
have to copy the whole tangle to reuse one part), and hard to change
safely (touching one concern risks breaking another that happens to sit
next to it). Separating concerns trades a small amount of upfront
organization for a large, ongoing reduction in the cost of change.
  `.trim(),
    whenToUse: `
Apply it as soon as a piece of code is doing more than one
identifiably-different job — especially the classic trio of getting
data, transforming or validating it, and displaying or outputting it.
It's most valuable in code you expect to test, reuse, or revisit.
  `.trim(),
    whenNotToUse: `
For a genuinely tiny, one-off piece of code — a five-line script you'll
run once — splitting it into multiple functions across multiple
concerns can be more overhead than the code itself. The judgment call
is whether the code will be read, tested, or changed again; if not,
some tangling is harmless.
  `.trim(),
    commonMistakes: [
      "Splitting code into more functions without actually separating concerns — e.g., three functions that each still mix validation and network calls.",
      "Over-separating trivial code, creating a maze of tiny functions that's harder to follow than the original tangle.",
      "Leaving a 'coordinator' function that itself contains business logic, instead of having it purely delegate to the separated pieces.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Take a function that both validates a phone number and formats it for display, and split it into two separate functions.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Refactor a function that fetches a list of users from an API, filters out inactive ones, and renders them to the DOM, into three separated pieces.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Given a single 40-line function that reads a file, parses CSV rows, validates each row, and writes valid rows to a database, redesign it into separated concerns and explain what you'd unit test on each piece.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is separation of concerns?",
        answer:
          "The practice of keeping different responsibilities of a program — such as data access, business rules, and presentation — in separate, independent parts of the code rather than mixed together.",
      },
      {
        question: "Why does mixing concerns together make code harder to test?",
        answer:
          "Because you can't exercise one concern (like a validation rule) in isolation — running it also triggers the other concerns it's tangled with, like a network call or a UI update.",
      },
      {
        question: "How do you decide where to draw the line between two concerns?",
        answer:
          "Ask whether the two pieces of logic would change for different reasons — if validation rules and network error handling change independently of each other, they're different concerns and belong in different places.",
      },
    ],
    prerequisites: ["what-is-software-architecture"],
    relatedTopics: ["what-is-software-architecture", "coupling-and-cohesion", "layered-architecture"],
    keywords: ["separation of concerns", "single responsibility", "code organization"],
  },

  {
    id: "coupling-and-cohesion",
    title: "Coupling & Cohesion",
    level: "beginner",
    description:
      "How tightly pieces of code depend on each other (coupling) versus how well a single piece of code focuses on one clear job (cohesion).",
    explanation: `
Two related but different questions come up constantly when judging
whether code is well organized.

The first: if you change this module, how many *other* modules break or
need to change too? If the answer is "a lot," those modules are
**tightly coupled** — they know too much about each other's internals,
so a ripple in one becomes a wave everywhere else. If changing one
module rarely forces changes elsewhere, they're **loosely coupled** —
which is what you want, because it means you can change one part of the
system with confidence about what won't break.

The second, different question: does this one module do a single,
clearly-related job, or is it a grab-bag of unrelated logic stuffed
together because it was convenient? A module where everything inside it
is closely related and works toward one purpose has **high cohesion**.
A module that mixes unrelated responsibilities — say, a "utils.js" that
formats dates, sends emails, and calculates taxes — has **low
cohesion**.

The two ideas work together: you want **low coupling between modules**
(so they're independent) and **high cohesion within each module** (so
each one is focused and easy to understand). It's easy to remember
which is good: low coupling, high cohesion — loose on the outside,
tight on the inside.
  `.trim(),
    analogy:
      "Think of departments in a company. High cohesion means the accounting department only does accounting — not also handling IT support and marketing. Low coupling means accounting can change its internal process without having to call a meeting with every other department first.",
    examples: [
      {
        title: "Tight coupling: two modules reaching into each other's internals",
        code: `// orderService.js
export function createOrder(cart) {
  const order = { items: cart.items, total: cart.items.reduce((s, i) => s + i.price, 0) };
  db.orders.push(order); // reaches directly into a shared global array
  return order;
}

// emailService.js
export function notifyCustomer(customer) {
  const lastOrder = db.orders[db.orders.length - 1]; // assumes it was just created
  send(customer.email, \`Your order total is \${lastOrder.total}\`);
}`,
        explanation:
          "notifyCustomer silently depends on the exact order createOrder pushed to a shared array. Change how orders are stored, or call notifyCustomer before an order exists, and it breaks — the two modules are tightly, invisibly coupled.",
      },
      {
        title: "Loose coupling: passing what's needed explicitly",
        code: `// orderService.js
export function createOrder(cart) {
  return { items: cart.items, total: cart.items.reduce((s, i) => s + i.price, 0) };
}

// emailService.js
export function notifyCustomer(customer, order) {
  send(customer.email, \`Your order total is \${order.total}\`);
}

// calling code
const order = createOrder(cart);
notifyCustomer(customer, order);`,
        explanation:
          "notifyCustomer no longer assumes anything about how or where orders are stored — it just needs an order object passed in. Either function can be changed, tested, or reused independently.",
        walkthrough: [
          {
            code: "export function createOrder(cart) { ... }",
            explanation: "Does one focused job — builds an order from a cart — and returns the result rather than reaching into shared state.",
          },
          {
            code: "export function notifyCustomer(customer, order) { ... }",
            explanation: "Takes exactly what it needs as parameters, so it has no hidden dependency on how orders are created or stored.",
          },
        ],
      },
    ],
    howItWorks: `
You can spot coupling and cohesion by asking two concrete questions of
any module:

- **Coupling check**: "If I rewrote this module's internals but kept
  its inputs/outputs the same, would anything else need to change?" If
  yes, something is leaking through — shared global state, a hidden
  assumption about call order, or a dependency on another module's
  private details.
- **Cohesion check**: "Can I describe this module's job in one short
  sentence, without using the word 'and'?" If you need "and" ("this
  module validates users *and* sends emails *and* logs analytics"),
  it's doing too many unrelated things.
  `.trim(),
    whyItExists: `
These two properties exist as named concepts because they're the two
biggest predictors of how expensive a codebase is to change over time.
High coupling means small changes cause wide, unpredictable breakage.
Low cohesion means you can never find where a given behavior lives,
because related logic is scattered and unrelated logic is jammed
together. Naming them gives engineers a shared vocabulary to critique a
design before it's built, not just after it's caused pain.
  `.trim(),
    whenToUse: `
Use these as a lens any time you're deciding how to split code into
modules, reviewing a pull request, or trying to explain why a piece of
code feels hard to work with. They're especially useful when a
seemingly small change keeps requiring edits in unrelated files — that
is almost always a coupling problem.
  `.trim(),
    whenNotToUse: `
Chasing perfectly zero coupling is neither possible nor useful — modules
have to call each other to form a working system. The goal isn't zero
coupling; it's coupling through clear, stable, minimal interfaces
rather than through shared internals and hidden assumptions.
  `.trim(),
    commonMistakes: [
      "Believing coupling is inherently bad, when the real problem is coupling to internals rather than coupling through a stable, well-defined interface.",
      "Creating a 'utils' or 'helpers' file that becomes a low-cohesion dumping ground for anything that didn't obviously belong elsewhere.",
      "Reducing coupling by passing around one giant shared object 'just in case' — which just moves the tight coupling into that object's shape.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Look at a 'utils.js' or 'helpers.js' file in a project you've worked on. List its functions and note which ones are unrelated to each other — that's a cohesion problem.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Rewrite the tightly-coupled order/email example above so that notifyCustomer no longer needs to know anything about how orders are represented internally, beyond the fields it actually uses.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Describe a module you've encountered with low cohesion (many unrelated responsibilities). Propose how you'd split it into two or more high-cohesion modules, and explain what interface each would expose.",
      },
    ],
    interviewQuestions: [
      {
        question: "What's the difference between coupling and cohesion?",
        answer:
          "Coupling measures how dependent modules are on each other's internals — you want this low. Cohesion measures how focused a single module's responsibilities are — you want this high.",
      },
      {
        question: "Why is 'low coupling, high cohesion' considered good design?",
        answer:
          "Low coupling means you can change one module with confidence that unrelated modules won't break. High cohesion means each module is easy to understand, test, and locate, because it does one clearly-related job.",
      },
      {
        question: "Give an example of tight coupling that isn't obvious from reading a single function.",
        answer:
          "Two modules that communicate through a shared global variable or shared mutable state, where one module assumes the other has already run and set that state up — the dependency is invisible until something breaks.",
      },
    ],
    prerequisites: ["separation-of-concerns"],
    relatedTopics: ["separation-of-concerns", "layered-architecture", "dependency-inversion"],
    keywords: ["coupling", "cohesion", "loose coupling", "high cohesion", "modularity"],
  },

  {
    id: "layered-architecture",
    title: "Layered Architecture",
    level: "beginner",
    description:
      "Organizing code into layers — like presentation, business logic, and data access — where each layer only talks to the one next to it.",
    explanation: `
As an app grows, it typically ends up doing three broad kinds of work:
showing things to the user (screens, API responses), deciding what
should happen based on business rules (is this order allowed? what's
the discount?), and reading or writing data somewhere durable (a
database, a file, another service). If those three kinds of work are
free to call each other in any direction — a screen component directly
running a SQL query, a database function containing pricing rules — the
codebase turns into a web where nobody can change one thing without
tracing through the entire system.

**Layered architecture** organizes the codebase into a stack of layers,
commonly: a **presentation layer** (UI or API endpoints), a **business
logic layer** (the actual rules and decisions of the application, also
called the domain or service layer), and a **data access layer**
(reading and writing to storage). The core rule is that each layer only
talks to the layer directly below (or above) it — the presentation
layer never touches the database directly; it goes through business
logic, which goes through data access.

This isn't just a filing convention. It means if you need to change how
data is stored — switch databases, add caching — you only need to touch
the data access layer, because nothing above it depends on the
storage details. And if you need to change how something is displayed,
you never risk breaking a business rule, because the presentation layer
doesn't contain any.
  `.trim(),
    analogy:
      "A company's org chart: the front-desk staff (presentation) don't decide company policy or personally handle the filing cabinets — they escalate to managers (business logic), who decide what should happen and instruct records staff (data access) to look something up or file something.",
    examples: [
      {
        title: "Before: layers bypassed",
        code: `// api/getUserProfile.js  (presentation layer)
app.get("/profile/:id", async (req, res) => {
  const row = await db.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
  const discount = row.isVip ? 0.2 : 0; // business rule, sitting in the API handler
  res.json({ name: row.name, discount });
});`,
        explanation:
          "The presentation layer talks directly to the database and contains a business rule (the VIP discount). Changing the database schema or the discount rule both require editing this same file.",
      },
      {
        title: "After: layers respected",
        code: `// dataAccess/userRepository.js
export async function getUserById(id) {
  return db.query("SELECT * FROM users WHERE id = ?", [id]);
}

// business/userService.js
export async function getUserProfile(id) {
  const user = await getUserById(id);
  const discount = user.isVip ? 0.2 : 0;
  return { name: user.name, discount };
}

// api/getUserProfile.js  (presentation layer)
app.get("/profile/:id", async (req, res) => {
  const profile = await getUserProfile(req.params.id);
  res.json(profile);
});`,
        explanation:
          "The API handler no longer knows SQL exists, and the repository no longer knows what a 'discount' is. Each layer can change independently — swap the database, or change the discount rule — without touching the other two.",
        walkthrough: [
          {
            code: "export async function getUserById(id) { ... }",
            explanation: "The data access layer's only job: fetch a row. It knows nothing about discounts or HTTP.",
          },
          {
            code: "export async function getUserProfile(id) { ... }",
            explanation: "The business logic layer applies the actual rule (VIP discount) using data it asked the layer below for.",
          },
          {
            code: 'app.get("/profile/:id", async (req, res) => { ... }',
            explanation: "The presentation layer just translates an HTTP request into a call to business logic, and the result into an HTTP response.",
          },
        ],
      },
    ],
    howItWorks: `
Layers are typically arranged so that dependencies flow in one
direction: presentation depends on business logic, business logic
depends on data access — but never the reverse, and never skipping a
layer. A useful mental check: if you can point to code in the data
access layer that would need to change because the *UI* changed, or
code in the presentation layer that contains a business rule, a layer
has been skipped or its responsibility has leaked into the wrong place.
  `.trim(),
    diagram: `
  Presentation Layer   (API routes / UI)
          |
          v
  Business Logic Layer (rules, decisions)
          |
          v
  Data Access Layer    (database, files, external APIs)
  `.trim(),
    whyItExists: `
Layering exists so that a change with one kind of cause — a UI redesign,
a new business rule, a database migration — stays contained to one part
of the codebase. Without layers, those three kinds of change get
smeared across the same files, and every change risks touching logic it
has nothing to do with. It also makes the codebase predictable: any
engineer can guess where a given piece of logic lives just from knowing
what kind of concern it is.
  `.trim(),
    whenToUse: `
Layering pays off once an application has any real business logic
worth protecting — anything beyond the simplest CRUD passthroughs. It's
one of the first structural decisions worth making deliberately in a
growing codebase, and it scales down easily (three folders and a
convention) as well as up (formal boundaries enforced by tooling).
  `.trim(),
    whenNotToUse: `
For a trivial CRUD script with no real business rules — where the
'business logic' would just be 'call the database and return the
result' — inserting a full business logic layer adds ceremony with no
payoff. It's also possible to over-layer: forcing a rigid three-layer
split on a tiny module can add indirection without adding any real
protection against change.
  `.trim(),
    commonMistakes: [
      "Letting the presentation layer skip business logic and call the data access layer directly 'just this once' — these exceptions accumulate until the layering is meaningless.",
      "Putting business rules inside the data access layer (e.g., a repository function that applies a discount) because it was convenient at the time.",
      "Creating layers in name only — three folders that still freely import each other in every direction, giving the appearance of structure without its benefit.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Take a function that fetches a product from a database and applies a sale-price calculation in the same block, and split it into a data access function and a business logic function.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Design the three layers (presentation, business logic, data access) for a 'submit a support ticket' feature. List what each layer is responsible for and what it's explicitly not allowed to do.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Review a real API endpoint you've written or can find in an open-source project. Identify any place a layer is being skipped or a responsibility has leaked into the wrong layer, and propose a fix.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is layered architecture?",
        answer:
          "An approach to organizing a codebase into layers — commonly presentation, business logic, and data access — where each layer has a distinct responsibility and only communicates with the adjacent layer, keeping dependencies flowing in one direction.",
      },
      {
        question: "Why shouldn't the presentation layer talk directly to the database?",
        answer:
          "Because it couples the UI or API to storage details and skips wherever business rules are supposed to live, making it easy for business logic to leak into presentation code and for database changes to ripple into unrelated places.",
      },
      {
        question: "What's a sign that a layered architecture isn't actually being respected?",
        answer:
          "Business rules appearing inside the data access layer, or the presentation layer directly querying storage — both mean a layer's boundary is being bypassed even though the folders exist.",
      },
    ],
    prerequisites: ["separation-of-concerns", "coupling-and-cohesion"],
    relatedTopics: ["separation-of-concerns", "coupling-and-cohesion", "dependency-inversion", "clean-architecture"],
    keywords: ["layered architecture", "presentation layer", "business logic layer", "data access layer", "n-tier"],
  },
];
