import type { Topic } from "../../types/content";

export const softwareArchitectureBeginnerTopics: Topic[] = [
  {
    id: "what-is-software-architecture",
    title: "What is Software Architecture?",
    level: "beginner",
    description:
      "The big decisions about how a codebase is organized and how its pieces fit together.",
    explanation: `
Before anyone builds a house, someone decides the big things: how many
floors, where the plumbing runs, which walls hold up the roof. Get those
wrong and no paint can fix it. You'd have to tear out walls.

Software has the same two levels. Writing a function or naming a
variable is like picking the paint. The bigger decisions come first:

- How is the codebase split into folders and modules?
- Which parts may talk to which?
- Where does data enter the system, and where is it stored?
- How do we add a feature next year without rewriting everything?

Those structural decisions, which are expensive to change and shape
everything built on top, are **software architecture**. It's not a tool
or a diagram. It's the set of choices that let a system be built,
understood, changed, and grown.

A simple test: a coding decision is easy to undo (rename a variable,
refactor one function). An architectural decision is expensive to undo
(split one codebase into many services, or change how every feature is
laid out).
  `.trim(),
    analogy:
      "A city planner deciding where roads, water lines, and zoning go is doing architecture. A homeowner placing a bookshelf is not, even though both decide things about the same city.",
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
          "Renaming formatPrice takes five minutes. Reversing the database rule after fifty files write their own SQL could take weeks.",
        walkthrough: [
          {
            code: "function formatPrice(cents) { ... }",
            explanation:
              "A small, local decision. If it's wrong, you fix one function and move on.",
          },
          {
            code: "// All database access goes through a data-access layer.",
            explanation:
              "A structural rule many files depend on. Changing it later means touching every file that relies on it.",
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
          "Both structures can deliver the same feature. Choosing between them is architectural: it doesn't change what the app does, only how easy it is to change, test, and understand.",
      },
    ],
    howItWorks: `
Architecture isn't something you produce once. It's a set of ongoing
decisions and constraints:

- **Boundaries**: which parts of the code may know about which others.
- **Structure**: how the codebase is split into folders, modules, or
  services.
- **Data flow**: where information enters, how it moves, and where it
  ends up.
- **Consistency**: shared conventions that let any engineer guess where
  logic lives before opening the folder.

You can't see these in any single function, only in the codebase as a
whole. That's why architecture is a separate skill from writing code.
  `.trim(),
    whyItExists: `
Without structural decisions, a codebase grows into whatever shape is
fastest in the moment, which is rarely easy to work with a year later.

The real cost of a codebase isn't "does it work today" but "how much
does every future change cost." Good early decisions keep that cost
low. Bad ones, or none, compound until every small feature means
understanding (and risking) everything else.
  `.trim(),
    whenToUse: `
All software has *some* architecture, even if nobody chose it. A
200-line script still has an implicit structure. So the question is
whether to make those decisions on purpose.

Do it deliberately once a codebase will have more than one contributor,
live longer than a few weeks, or grow too big to hold in your head.
  `.trim(),
    whenNotToUse: `
For a one-off script or a throwaway weekend prototype, designing layers
and boundaries is wasted effort. Quick and messy is fine, even correct,
when the code is disposable. The skill is knowing which case you're in.
  `.trim(),
    commonMistakes: [
      "Treating architecture as something only senior engineers or diagram tools produce, when every contributor makes and reinforces these decisions daily.",
      "Confusing architecture with technology choices (\"we use React\"). The framework is a detail; how you organize logic around it is the architecture.",
      "Over-architecting a throwaway script, or under-architecting a system that will clearly grow. Both come from not asking 'how long will this live, and who else will touch it?'",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "In two sentences, explain the difference between a 'coding decision' and an 'architectural decision'. Give an example of each from your own project.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Take a small script you've written (or imagine one that reads a CSV, transforms it, and writes a report). List three structural decisions you made, even ones you didn't notice at the time.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Describe a real or imagined codebase with no deliberate architecture. Explain concretely what went wrong (e.g., a one-hour change took a week).",
      },
    ],
    interviewQuestions: [
      {
        question: "How would you explain software architecture to someone new to the field?",
        answer:
          "It's the set of big, structural decisions about how a codebase is organized and how its parts interact. They're expensive to change later, unlike everyday coding decisions, which are cheap to change.",
      },
      {
        question: "Does every piece of software have an architecture, even a small script?",
        answer:
          "Yes. Even an unstructured script has an implicit structure (e.g., everything in one file, in one order). Architecture as a discipline means making those decisions on purpose, not by accident.",
      },
      {
        question: "How is an architectural decision different from an everyday coding decision?",
        answer:
          "An architectural decision is expensive and risky to reverse once other code depends on it (e.g., how modules may talk to each other). A coding decision, like a variable name or one function's implementation, is cheap and low-risk to change.",
      },
      {
        question: "What actually makes an architectural decision 'expensive' to reverse, mechanically?",
        answer:
          "How much depends on it. Nothing but its own function depends on a variable name. Every later feature depends on a rule like 'all database access goes through one layer', so undoing it means finding and rewriting every place that assumed it.",
      },
      {
        question: "Is software architecture the same thing as choosing a framework or technology stack?",
        answer:
          "No. Picking React or Postgres is a technology choice, often reversible with effort. Architecture is how you organize logic *around* that technology: the boundaries, layers, and data flow. A bad architecture on a great framework is still bad.",
      },
      {
        question: "What's a practical heuristic for telling whether a decision you're about to make is architectural?",
        answer:
          "Ask how much would need to change if you reversed it next month. 'Just this function' means a coding decision. 'Every feature that touched this area since' means it's architectural.",
      },
      {
        question: "Is architecture something you decide once at the start of a project and then move on from?",
        answer:
          "No. It's an ongoing set of decisions that every pull request reinforces or erodes. A codebase's architecture in year two is the sum of every structural choice along the way, not just the day-one whiteboard.",
      },
      {
        question: "What goes wrong when a team treats architecture as something only senior engineers do?",
        answer:
          "Everyone still makes structural decisions daily, like where to put a new module or whether to call another layer directly. If only seniors are expected to think about it, those decisions get made without discipline, and the architecture erodes one convenient shortcut at a time.",
      },
      {
        question: "Can you give an example of over-architecting, and explain why it's a real cost even if the code works?",
        answer:
          "Building a plugin system with several abstraction layers for a script that only ever runs one fixed way. It works, but every reader must trace through interfaces and indirection for flexibility the project will never use. That's an ongoing comprehension cost for a benefit that never arrives.",
      },
      {
        question: "Can you give an example of under-architecting, and what symptom would show up in the codebase?",
        answer:
          "A growing app where every screen's component queries the database directly. The symptom: one schema change means touching dozens of unrelated UI files, and nobody can predict what a change will break, because no boundary contains the effect.",
      },
      {
        question: "How would you decide whether a two-week prototype needs deliberate architecture?",
        answer:
          "Ask whether it will be thrown away or become the real product. If it's truly disposable, layers and boundaries are wasted effort. If it may live on (prototypes often do), make at least the cheapest structural decisions, like keeping concerns separated, from the start.",
      },
      {
        question: "Two teams build the exact same feature with different internal structures. Are both making architectural decisions?",
        answer:
          "Yes. Architecture isn't about what the software does (both shipped identical behavior) but how the code is organized to produce it. That structural choice is the architecture, even if users never see it.",
      },
      {
        question: "What's the relationship between architecture and the total cost of a system over its lifetime?",
        answer:
          "Architecture sets the cost of every future change, not just the first build. A system built fast with no structure may look cheaper on day one. But if every later feature means understanding and risking the whole codebase, it costs far more over the years than one with deliberate boundaries.",
      },
      {
        question: "Why do boundaries — who's allowed to call whom — matter more than which specific technologies are used?",
        answer:
          "Boundaries control blast radius: how far a change's effect can spread. You can usually swap technologies behind a boundary without touching the rest. Without boundaries, no technology choice will contain a bad change.",
      },
      {
        question: "How does architecture show up differently in a 200-line script versus a codebase worked on by 50 engineers?",
        answer:
          "In a 200-line script, the architecture may just be the order statements run in. That's implicit and low-stakes, since one person holds it all in their head. With 50 engineers, nobody can hold the whole system, so explicit boundaries and conventions are the only way people can predict where logic lives and change it safely.",
      },
      {
        question: "What's a red flag in a pull request that suggests an architectural decision is being made informally?",
        answer:
          "A change that quietly adds a new way for one part to reach into another, like a UI component importing a database client 'just this once'. It looks like a small local fix, but it sets a precedent other changes will copy.",
      },
      {
        question: "If you joined a new team, how would you go about learning the architecture of an existing codebase?",
        answer:
          "Look for the real boundaries, not a diagram: which modules are only imported in one direction, where business rules actually live versus where they should, and what a typical feature touches. Reading a few real pull requests often shows the lived architecture faster than any document.",
      },
      {
        question: "Why might a technically correct implementation still represent bad architecture?",
        answer:
          "'Correct' only measures whether today's output matches the requirement. Architecture is judged by how well the system absorbs the *next* change. A correct feature built by copy-pasting business logic into five files is bad architecture, because the next change to that logic must be made five times.",
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
      "Keep different jobs, like fetching, validating, and displaying data, in separate places instead of tangled together.",
    explanation: `
Picture one function that runs when a user submits a form. It checks
the email, sends the data to the server, formats the response as HTML,
and updates the page. It works.

Now you need to reuse the validation, or test it, or the designer wants
a different success message. Each small request means wading through
the whole function without breaking the other three things it does.

The fix is to give each responsibility, or **concern**, its own place:
one piece validates the email, one sends the request, one updates the
screen. This is **separation of concerns**. Each piece is small enough
to read in one sitting, test alone, and reuse without dragging the
others along.

Where you draw the lines varies by project. What matters is drawing
them at all, so "validate this", "fetch that", and "display this" don't
share the same block of code.
  `.trim(),
    analogy:
      "A restaurant kitchen has separate stations for chopping, grilling, and plating, not one cook doing everything at one counter. Each station has one job, so the kitchen can scale and one mistake doesn't ruin every dish.",
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
          "Validation, the network request, and the UI update are mixed in one function. You can't test validation without also making a real network call.",
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
          "Now you can unit-test isValidEmail with no network, reuse signup from another form, and change how showStatus renders without touching the other two.",
        walkthrough: [
          {
            code: "function isValidEmail(email) { ... }",
            explanation:
              "A pure function with one job: answer 'is this a valid email?'. No network, no DOM.",
          },
          {
            code: "function signup(email, password) { ... }",
            explanation:
              "Only talks to the server. It doesn't know or care how the result is displayed.",
          },
          {
            code: "function showStatus(message) { ... }",
            explanation:
              "Owns updating the page. It doesn't know why the message was chosen.",
          },
          {
            code: "async function submitForm(email, password) { ... }",
            explanation:
              "Runs the three concerns in order but hands the real work to each. It's the only place that knows the overall flow.",
          },
        ],
      },
    ],
    howItWorks: `
For each piece of logic, ask: "what is the one reason this code would
change?"

- Validation rules change when the business redefines what's valid.
- Network logic changes when the API changes.
- Display logic changes when the designer wants new wording.

When code with several reasons to change lives in one place, a change
for one reason risks breaking the others. Split by concern, and each
piece only changes for its own reason.
  `.trim(),
    whyItExists: `
Tangled code is expensive in predictable ways:

- Hard to test: you can't isolate one concern.
- Hard to reuse: you'd copy the whole tangle to reuse one part.
- Hard to change safely: touching one concern can break its neighbor.

Separating concerns costs a little organization up front and greatly
lowers the cost of every later change.
  `.trim(),
    whenToUse: `
Apply it once code does more than one distinct job, especially the
classic trio: getting data, validating or transforming it, and
displaying it. It pays off most in code you'll test, reuse, or revisit.
  `.trim(),
    whenNotToUse: `
For a tiny one-off, like a five-line script you'll run once, splitting
it up can cost more than the code itself. If the code won't be read,
tested, or changed again, some tangling is harmless.
  `.trim(),
    commonMistakes: [
      "Splitting code into more functions without separating concerns, e.g., three functions that each still mix validation and network calls.",
      "Over-separating trivial code into a maze of tiny functions that's harder to follow than the original.",
      "Leaving business logic in the 'coordinator' function instead of having it only delegate to the separated pieces.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Split a function that validates a phone number and formats it for display into two separate functions.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Refactor a function that fetches users from an API, filters out inactive ones, and renders them to the DOM into three separate pieces.",
      },
      {
        difficulty: "Hard",
        prompt:
          "A 40-line function reads a file, parses CSV rows, validates each row, and writes valid rows to a database. Redesign it into separate concerns and explain what you'd unit test in each piece.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is separation of concerns?",
        answer:
          "Keeping a program's different responsibilities, such as data access, business rules, and presentation, in separate, independent parts of the code instead of mixed together.",
      },
      {
        question: "Why does mixing concerns together make code harder to test?",
        answer:
          "You can't run one concern (like a validation rule) alone. Running it also triggers whatever it's tangled with, like a network call or a UI update.",
      },
      {
        question: "How do you decide where to draw the line between two concerns?",
        answer:
          "Ask whether they'd change for different reasons. If validation rules and network error handling change independently, they're different concerns and belong in different places.",
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
      "How much pieces of code depend on each other (coupling) versus how well one piece focuses on one clear job (cohesion).",
    explanation: `
Two different questions help you judge whether code is well organized.

First: if you change this module, how many *other* modules break or
need changes? If many do, they're **tightly coupled**. They know too
much about each other's internals, so a ripple in one becomes a wave
everywhere. If changes rarely spread, they're **loosely coupled**. That's
what you want: you can change one part and know what won't break.

Second: does this module do one related job, or is it a grab-bag of
logic stuffed together for convenience? If everything inside serves
one purpose, it has **high cohesion**. A "utils.js" that formats dates,
sends emails, and calculates taxes has **low cohesion**.

You want **low coupling between modules** (so they're independent) and
**high cohesion within each module** (so each is focused and easy to
understand). Loose on the outside, tight on the inside.
  `.trim(),
    analogy:
      "Think of company departments. High cohesion means accounting only does accounting, not IT support and marketing too. Low coupling means accounting can change its internal process without a meeting with every other department.",
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
          "notifyCustomer silently depends on the order createOrder pushed to a shared array. Change how orders are stored, or call notifyCustomer before an order exists, and it breaks. The two modules are tightly and invisibly coupled.",
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
          "notifyCustomer no longer assumes anything about how or where orders are stored. It just needs an order passed in. Each function can now be changed, tested, or reused on its own.",
        walkthrough: [
          {
            code: "export function createOrder(cart) { ... }",
            explanation: "Does one job, building an order from a cart, and returns it instead of reaching into shared state.",
          },
          {
            code: "export function notifyCustomer(customer, order) { ... }",
            explanation: "Takes exactly what it needs as parameters, so it has no hidden dependency on how orders are created or stored.",
          },
        ],
      },
    ],
    howItWorks: `
Ask two questions of any module:

- **Coupling check**: "If I rewrote this module's internals but kept
  its inputs and outputs, would anything else need to change?" If yes,
  something is leaking: shared global state, a hidden assumption about
  call order, or a dependency on another module's private details.
- **Cohesion check**: "Can I describe this module's job in one short
  sentence without 'and'?" If you need "and" ("validates users *and*
  sends emails *and* logs analytics"), it does too many unrelated things.
  `.trim(),
    whyItExists: `
These are the two biggest predictors of how expensive a codebase is to
change. High coupling means small changes cause wide, unpredictable
breakage. Low cohesion means you can't find where a behavior lives,
because related logic is scattered and unrelated logic is jammed
together.

Naming them gives engineers a shared vocabulary to critique a design
before it's built, not only after it causes pain.
  `.trim(),
    whenToUse: `
Use them as a lens when splitting code into modules, reviewing a pull
request, or explaining why code feels hard to work with. If a small
change keeps needing edits in unrelated files, that's almost always a
coupling problem.
  `.trim(),
    whenNotToUse: `
Zero coupling is neither possible nor useful: modules must call each
other to form a working system. The goal is coupling through clear,
stable, minimal interfaces, not through shared internals and hidden
assumptions.
  `.trim(),
    commonMistakes: [
      "Believing all coupling is bad. The real problem is coupling to internals instead of through a stable, well-defined interface.",
      "Letting a 'utils' or 'helpers' file become a low-cohesion dumping ground for anything without an obvious home.",
      "Reducing coupling by passing one giant shared object around 'just in case'. That just moves the tight coupling into the object's shape.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "Open a 'utils.js' or 'helpers.js' file from one of your projects. List its functions and note which are unrelated to each other. That's a cohesion problem.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Rewrite the tightly coupled order/email example above so notifyCustomer knows nothing about how orders are stored internally, beyond the fields it uses.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Describe a module you've seen with low cohesion (many unrelated jobs). Propose how you'd split it into two or more high-cohesion modules, and what interface each would expose.",
      },
    ],
    interviewQuestions: [
      {
        question: "What's the difference between coupling and cohesion?",
        answer:
          "Coupling measures how much modules depend on each other's internals; you want it low. Cohesion measures how focused one module's responsibilities are; you want it high.",
      },
      {
        question: "Why is 'low coupling, high cohesion' considered good design?",
        answer:
          "Low coupling lets you change one module knowing unrelated modules won't break. High cohesion makes each module easy to understand, test, and find, because it does one related job.",
      },
      {
        question: "Give an example of tight coupling that isn't obvious from reading a single function.",
        answer:
          "Two modules that communicate through a shared global or shared mutable state, where one assumes the other already ran and set it up. The dependency is invisible until something breaks.",
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
      "Organize code into layers, like presentation, business logic, and data access, where each layer only talks to the one next to it.",
    explanation: `
A growing app does three broad kinds of work:

- Showing things to the user (screens, API responses).
- Applying business rules (is this order allowed? what's the discount?).
- Reading and writing data (a database, a file, another service).

If these can call each other in any direction, like a screen running SQL
or a database function holding pricing rules, the codebase becomes a
web. Nobody can change one thing without tracing the whole system.

**Layered architecture** stacks the code into layers, commonly:

- A **presentation layer** (UI or API endpoints).
- A **business logic layer** (the app's rules and decisions, also called
  the domain or service layer).
- A **data access layer** (reading and writing storage).

Each layer only talks to the layer directly next to it. The
presentation layer never touches the database. It goes through business
logic, which goes through data access.

This is more than a filing convention. To change how data is stored
(switch databases, add caching), you only touch the data access layer,
since nothing above depends on storage details. To change the display,
you can't break a business rule, because the presentation layer holds
none.
  `.trim(),
    analogy:
      "A company org chart: front-desk staff (presentation) don't set policy or handle the filing cabinets. They escalate to managers (business logic), who decide what should happen and ask records staff (data access) to look something up or file it.",
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
          "The presentation layer queries the database directly and holds a business rule (the VIP discount). A schema change and a discount change both mean editing this same file.",
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
          "The API handler no longer knows SQL exists, and the repository doesn't know what a 'discount' is. You can swap the database or change the discount rule without touching the other layers.",
        walkthrough: [
          {
            code: "export async function getUserById(id) { ... }",
            explanation: "The data access layer's only job: fetch a row. It knows nothing about discounts or HTTP.",
          },
          {
            code: "export async function getUserProfile(id) { ... }",
            explanation: "The business logic layer applies the rule (VIP discount) to data from the layer below.",
          },
          {
            code: 'app.get("/profile/:id", async (req, res) => { ... }',
            explanation: "The presentation layer just turns an HTTP request into a business logic call, and the result into an HTTP response.",
          },
        ],
      },
    ],
    howItWorks: `
Dependencies flow one way: presentation depends on business logic, and
business logic depends on data access. Never the reverse, and never
skipping a layer.

A quick check: if data access code would change because the *UI*
changed, or presentation code contains a business rule, a layer has
been skipped or a responsibility has leaked into the wrong place.
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
Layering keeps each kind of change (a UI redesign, a new business rule,
a database migration) inside one part of the codebase. Without layers,
these changes smear across the same files, and every change risks
touching unrelated logic.

It also makes the codebase predictable: any engineer can guess where
logic lives just from what kind of concern it is.
  `.trim(),
    whenToUse: `
Layering pays off once an app has real business logic worth
protecting, anything beyond simple CRUD passthroughs. It's one of the
first structural decisions to make on purpose in a growing codebase. It
scales down (three folders and a convention) and up (formal boundaries
enforced by tooling).
  `.trim(),
    whenNotToUse: `
In a trivial CRUD script where the 'business logic' is just "call the
database and return the result", a full business logic layer is
ceremony with no payoff.

You can also over-layer: forcing a rigid three-layer split on a tiny
module adds indirection without real protection against change.
  `.trim(),
    commonMistakes: [
      "Letting the presentation layer skip business logic and call data access directly 'just this once'. These exceptions pile up until the layering means nothing.",
      "Putting business rules in the data access layer (e.g., a repository function that applies a discount) because it was convenient.",
      "Creating layers in name only: three folders that still import each other in every direction, with the look of structure but none of the benefit.",
    ],
    exercises: [
      {
        difficulty: "Easy",
        prompt:
          "A function fetches a product from a database and calculates its sale price in the same block. Split it into a data access function and a business logic function.",
      },
      {
        difficulty: "Medium",
        prompt:
          "Design the three layers (presentation, business logic, data access) for a 'submit a support ticket' feature. List what each layer does and what it must not do.",
      },
      {
        difficulty: "Hard",
        prompt:
          "Review a real API endpoint, yours or from an open-source project. Find any place a layer is skipped or a responsibility has leaked into the wrong layer, and propose a fix.",
      },
    ],
    interviewQuestions: [
      {
        question: "What is layered architecture?",
        answer:
          "Organizing a codebase into layers, commonly presentation, business logic, and data access. Each layer has a distinct job and only talks to the adjacent layer, so dependencies flow one way.",
      },
      {
        question: "Why shouldn't the presentation layer talk directly to the database?",
        answer:
          "It couples the UI or API to storage details and skips the layer where business rules belong. Business logic then leaks into presentation code, and database changes ripple into unrelated places.",
      },
      {
        question: "What's a sign that a layered architecture isn't actually being respected?",
        answer:
          "Business rules inside the data access layer, or the presentation layer querying storage directly. Either way, a layer boundary is being bypassed even though the folders exist.",
      },
    ],
    prerequisites: ["separation-of-concerns", "coupling-and-cohesion"],
    relatedTopics: ["separation-of-concerns", "coupling-and-cohesion", "dependency-inversion", "clean-architecture"],
    keywords: ["layered architecture", "presentation layer", "business logic layer", "data access layer", "n-tier"],
  },
];
