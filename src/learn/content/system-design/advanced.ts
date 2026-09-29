import type { Topic } from "../../types/content";

export const systemDesignAdvancedTopics: Topic[] = [
  {
    id: "load-balancing",
    title: "Load Balancing",
    level: "advanced",
    description: "Spreading incoming requests across multiple servers so no single one gets overwhelmed.",
    explanation: `
A single server can only handle so many requests at once. Once traffic
grows beyond that, you need more than one server — but then, how does a
user's request know *which* server to go to? A **load balancer** sits in
front of a group of servers and decides, for every incoming request, which
one should handle it — spreading the work evenly so no single server gets
overloaded while others sit idle.
    `.trim(),
    analogy:
      "A load balancer is like the host at a busy restaurant who seats guests across all the available tables, instead of letting one table get 20 parties while the rest sit empty.",
    examples: [
      {
        title: "Conceptual round-robin balancing",
        code: `const servers = ["server-1", "server-2", "server-3"];
let next = 0;

function pickServer() {
  const server = servers[next];
  next = (next + 1) % servers.length; // cycle back to 0 after the last one
  return server;
}
// Requests get spread evenly: server-1, server-2, server-3, server-1, ...`,
        explanation:
          "This is a simplified version of 'round robin' — one of several strategies real load balancers use to distribute traffic.",
        walkthrough: [
          { code: "const servers = [...]; let next = 0;", explanation: "Keeps a list of servers and tracks which one is up next." },
          { code: "function pickServer() {", explanation: "Called once per incoming request to decide where it should go." },
          { code: "const server = servers[next];", explanation: "Picks the current server in the rotation." },
          { code: "next = (next + 1) % servers.length;", explanation: "Advances to the next server, wrapping back to the start after the last one." },
        ],
      },
    ],
    howItWorks: `
Every incoming request first reaches the load balancer instead of a
specific server directly. The load balancer picks a healthy server — using
a strategy like round robin (cycling through servers in a fixed order,
regardless of how busy each one currently is), **least-connections**
(send each new request to whichever server currently has the fewest
active requests still in progress), or based on server load — and
forwards the request there. It also continuously checks server health, and
stops sending traffic to any server that's down.
    `.trim(),
    diagram: `
          ┌─────────────┐
Requests →│Load Balancer│
          └──────┬──────┘
        ┌────────┼────────┐
        ▼        ▼        ▼
    Server 1  Server 2  Server 3
    `.trim(),
    whyItExists: `
Without load balancing, scaling up would mean building one enormous
server — expensive, and still a single point of failure. Load balancing
lets you add ordinary servers as traffic grows, and keeps the system
running even if one individual server fails.
    `.trim(),
    whenToUse: `
Reach for a load balancer the moment a single server can no longer handle
your traffic reliably, or when you want to survive one server failing
without the whole application going down.
    `.trim(),
    whenNotToUse: `
A single small server serving a low-traffic app doesn't need a load
balancer yet — it adds infrastructure and cost for a problem you don't
have. Add it when traffic or reliability requirements actually demand it,
not preemptively for hypothetical scale.
    `.trim(),
    commonMistakes: [
      "Treating the load balancer itself as unbreakable — it also needs redundancy, or it becomes a single point of failure.",
      "Ignoring 'sticky sessions' — where the load balancer deliberately keeps routing a given user's later requests back to the same server it used before — when that user's data is only stored on that specific server.",
      "Assuming load balancing alone solves scaling — the database or other shared resources behind it can still be the real bottleneck.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, why a single server isn't enough for a popular application." },
      { difficulty: "Medium", prompt: "Describe the difference between 'round robin' and 'least connections' as load balancing strategies." },
      { difficulty: "Hard", prompt: "Explain what could go wrong if a load balancer keeps sending traffic to a server that has crashed, and how health checks solve it." },
    ],
    interviewQuestions: [
      { question: "What problem does a load balancer solve?", answer: "It distributes incoming requests across multiple servers so no single server is overwhelmed, and traffic keeps flowing even if one server fails." },
      { question: "What is a health check in load balancing?", answer: "A periodic check the load balancer performs on each server to confirm it's still responsive, so it can stop routing traffic to unhealthy servers." },
      { question: "Can a load balancer itself be a single point of failure?", answer: "Yes — which is why production systems often run multiple load balancers with their own failover mechanism." },
    ],
    prerequisites: ["caching"],
    relatedTopics: ["scalability", "caching", "queues", "proxy-and-reverse-proxy", "api-gateway"],
    keywords: ["load balancer", "round robin", "health check", "scaling"],
  },
  {
    id: "queues",
    title: "Queues",
    level: "advanced",
    description: "Letting one part of a system hand off work to be done later, without waiting around for it.",
    explanation: `
Some tasks don't need to happen instantly while a user waits — sending a
confirmation email, resizing an uploaded image, generating a report. If a
server tried to do all of that immediately during the original request,
users would wait far longer than necessary. Instead, systems often use a
**message queue**: the server drops a description of the task into a
queue and responds to the user right away, while separate worker processes
pick up tasks from the queue and handle them in the background.
    `.trim(),
    analogy:
      "It's like dropping a form into an in-tray at an office instead of waiting at the counter until someone finishes processing it. You move on with your day; a clerk works through the tray in order, at their own pace.",
    examples: [
      {
        title: "Conceptual producer/consumer with a queue",
        code: `// Server (producer) — respond fast, queue the slow work
app.post("/signup", async (req, res) => {
  await createUser(req.body);
  await queue.push({ type: "welcome-email", userId: req.body.id });
  res.send("Signed up!"); // doesn't wait for the email to send
});

// Worker (consumer) — runs separately, processes queued jobs
queue.onMessage(async (job) => {
  if (job.type === "welcome-email") {
    await sendWelcomeEmail(job.userId);
  }
});`,
        walkthrough: [
          { code: 'app.post("/signup", async (req, res) => {', explanation: "Handles an incoming signup request." },
          { code: "await createUser(req.body);", explanation: "Does the essential work the user is actually waiting for." },
          { code: 'await queue.push({ type: "welcome-email", ... });', explanation: "Hands off the slow, non-essential part to the queue instead of doing it right now." },
          { code: 'res.send("Signed up!");', explanation: "Responds to the user immediately, without waiting for the email to send." },
          { code: "queue.onMessage(async (job) => {...})", explanation: "A separate worker picks up and processes that queued job whenever it's able to." },
        ],
      },
    ],
    howItWorks: `
A **producer** (like a web server) adds messages describing work to the
queue. One or more **consumers** (worker processes) continuously check the
queue and process messages, often removing each one only after it's
successfully handled — so if a worker crashes mid-task, the message isn't
lost and can be retried.
    `.trim(),
    diagram: `
Producer → [ queue: job1, job2, job3 ] → Consumer(s) process jobs
    `.trim(),
    whyItExists: `
Queues decouple "accepting a request" from "doing the (possibly slow)
work," which keeps user-facing responses fast, smooths out sudden spikes
in traffic, and makes it easier to retry failed work without affecting the
original request.
    `.trim(),
    whenToUse: `
Reach for a queue whenever a request triggers work that doesn't need to
finish before responding to the user — sending an email, processing an
upload, generating a report — especially work that's slow or occasionally
fails and needs retrying.
    `.trim(),
    whenNotToUse: `
Don't queue work the user is actively waiting to see the result of right
now — that just adds an unnecessary hop and delay. A queue also adds real
operational complexity (workers to run, failures to monitor), so it's not
worth reaching for until you actually have slow or bursty background work
to offload.
    `.trim(),
    commonMistakes: [
      "Putting time-sensitive, user-facing work into a queue when the user actually needs to see the result immediately.",
      "Not handling failures — a worker that crashes mid-task should allow the message to be retried, not silently lost.",
      "Letting the queue grow unbounded without enough workers to keep up, causing delays to pile up.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List three real tasks in a typical web app that are good candidates to run through a queue instead of immediately." },
      { difficulty: "Medium", prompt: "Explain, in your own words, why queues help a system handle sudden traffic spikes better." },
      { difficulty: "Hard", prompt: "Describe how you'd handle a job that fails repeatedly (e.g. a broken email address) so it doesn't get retried forever." },
    ],
    interviewQuestions: [
      { question: "What problem do message queues solve?", answer: "They let a system hand off slow or non-urgent work to be processed later, keeping the original request fast and smoothing out traffic spikes." },
      { question: "What are 'producers' and 'consumers' in a queue system?", answer: "Producers add messages/jobs to the queue; consumers (workers) read and process those messages, usually independently and in parallel." },
      { question: "Why are queues useful for reliability, not just speed?", answer: "Because a message can be safely retried if a worker fails partway through, instead of the work being lost entirely." },
    ],
    prerequisites: ["load-balancing"],
    relatedTopics: ["load-balancing", "scalability", "pub-sub"],
    keywords: ["message queue", "producer", "consumer", "worker", "async processing"],
  },
  {
    id: "cdn",
    title: "CDN",
    level: "advanced",
    description: "A network of servers around the world that deliver content from the location closest to each user.",
    explanation: `
The further data has to travel over the internet, the longer it takes to
arrive. If your only server is in one country, users on the other side of
the world will always experience a noticeable delay. A **CDN** (Content
Delivery Network) solves this by storing copies of your content — images,
videos, scripts, static files — on servers spread across many locations
worldwide, and serving each user from whichever copy is physically
closest to them.
    `.trim(),
    analogy:
      "It's like a chain of grocery stores instead of one giant warehouse. Rather than everyone driving across the country to the single warehouse, each town has a local store stocked with the same goods, so everyone gets what they need quickly.",
    examples: [
      {
        title: "Conceptual CDN request flow",
        code: `// Without a CDN:
// User in Tokyo → server in New York → slow round trip

// With a CDN:
// User in Tokyo → nearby CDN server in Tokyo (already has a copy) → fast`,
        walkthrough: [
          { code: "// User in Tokyo → server in New York", explanation: "Without a CDN, every request travels the full distance to the one origin server." },
          { code: "// User in Tokyo → nearby CDN server in Tokyo", explanation: "With a CDN, the request is served from a much closer copy instead — a shorter round trip." },
        ],
      },
    ],
    howItWorks: `
When content is published, it's copied ("cached") across many CDN
servers ("edge locations") around the world. When a user requests that
content, they're automatically routed to the nearest edge location, which
serves the cached copy directly — without needing to contact the original
server at all, unless the content is missing or has expired there.
    `.trim(),
    whyItExists: `
CDNs dramatically reduce load times for users far from the origin server,
and also reduce load on that origin server, since most requests are
served from edge locations instead. They're especially valuable for
content that doesn't change often, like images, videos, and static files.
    `.trim(),
    whenToUse: `
Reach for a CDN when you're serving static assets — images, videos,
JS/CSS bundles — to users spread across different geographic regions, and
you want those assets to load quickly no matter where the user is.
    `.trim(),
    whenNotToUse: `
Don't rely on a CDN for highly personalized or constantly-changing data —
that's not what it's built to cache well. And if your entire user base is
already geographically close to your one server, a CDN's main benefit
(proximity) doesn't buy you much.
    `.trim(),
    commonMistakes: [
      "Using a CDN for highly personalized, frequently-changing data that isn't a good fit for caching.",
      "Forgetting to invalidate CDN caches after updating content, so users keep seeing an old version.",
      "Assuming a CDN replaces the need for a fast origin server — it helps most with static content, not every kind of request.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, why a user in a different country might experience a slow-loading website without a CDN." },
      { difficulty: "Medium", prompt: "List which parts of a typical website (images, live account data, CSS files) are a good fit for a CDN, and which aren't." },
      { difficulty: "Hard", prompt: "Describe what could go wrong if you don't properly invalidate a CDN cache after deploying a new version of your website's images." },
    ],
    interviewQuestions: [
      { question: "What problem does a CDN solve?", answer: "It reduces the distance content has to travel by serving it from a location physically closer to each user, lowering latency and reducing load on the origin server." },
      { question: "What kind of content is best suited for a CDN?", answer: "Static, rarely-changing content like images, videos, stylesheets, and scripts — not highly personalized or constantly-changing data." },
      { question: "What is an 'edge location'?", answer: "One of many CDN servers distributed geographically, each holding cached copies of content to serve nearby users quickly." },
    ],
    prerequisites: ["caching"],
    relatedTopics: ["caching", "scalability"],
    keywords: ["CDN", "edge location", "latency", "static content"],
  },
  {
    id: "scalability",
    title: "Scalability",
    level: "advanced",
    description: "A system's ability to keep working well as usage grows — more users, more data, more requests.",
    explanation: `
A system that works fine with a hundred users might completely fail with
a million. **Scalability** is about designing a system so it can keep up
as demand grows, ideally by adding more resources rather than needing a
complete redesign.

There are two main strategies: **vertical scaling** (making a single
server more powerful — more CPU, more memory) and **horizontal scaling**
(adding more servers and spreading the work across them). Most large-scale
systems eventually lean on horizontal scaling, since there's always a
ceiling to how powerful one machine can get.
    `.trim(),
    analogy:
      "Vertical scaling is like hiring one super-employee who can work faster and faster. Horizontal scaling is like hiring more employees and splitting the work among them. At some point, no single employee — no matter how fast — can outpace hiring a team.",
    examples: [
      {
        title: "The idea, not literal code",
        code: `// Vertical scaling: same one server, upgraded hardware
// 4 CPU cores, 8GB RAM → 32 CPU cores, 256GB RAM

// Horizontal scaling: same modest servers, more of them
// 1 server → 10 servers, behind a load balancer`,
        walkthrough: [
          { code: "// Vertical scaling: same one server, upgraded hardware", explanation: "One machine gets more powerful over time." },
          { code: "// 4 CPU cores, 8GB RAM → 32 CPU cores, 256GB RAM", explanation: "A concrete example — same server, much bigger specs." },
          { code: "// Horizontal scaling: same modest servers, more of them", explanation: "Instead of one bigger machine, add more ordinary machines." },
          { code: "// 1 server → 10 servers, behind a load balancer", explanation: "Traffic gets spread across all ten by a load balancer." },
        ],
      },
    ],
    howItWorks: `
Scalable systems are usually designed so that individual pieces (servers,
in particular) don't hold irreplaceable state that only they know about —
so any of them can handle any request, and more can be added freely. This
often relies on other concepts working together: load balancers to
distribute traffic, caches to reduce repeated work, and databases designed
to handle growing data volumes.
    `.trim(),
    whyItExists: `
User growth is often the whole point of building a successful product —
but a system that can't scale becomes slow, unreliable, or simply falls
over exactly when it matters most: when it's finally popular. Designing
for scalability from the start avoids painful, risky rewrites later.
    `.trim(),
    whenToUse: `
Think about scalability deliberately once real growth is a realistic
near-term possibility — when you're designing a system you expect to
succeed and need to handle meaningfully more users, data, or traffic than
it does today.
    `.trim(),
    whenNotToUse: `
Don't over-invest in horizontal scaling, statelessness, and distributed
architecture for a prototype or an app with a small, known, stable user
base — that complexity has a real cost, and premature scaling work is a
common way projects get bogged down before they even ship.
    `.trim(),
    commonMistakes: [
      "Only ever scaling vertically, until hitting the hard ceiling of the most powerful single machine available.",
      "Storing important state on an individual server (like data in memory) that horizontal scaling then breaks, since other servers don't have access to it.",
      "Over-engineering for a scale the product doesn't remotely need yet, adding needless complexity too early.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, the difference between vertical and horizontal scaling." },
      { difficulty: "Medium", prompt: "Describe a design decision that would make horizontal scaling harder, and how you'd avoid it." },
      { difficulty: "Hard", prompt: "Sketch (in words) how load balancing, caching, and a scalable database work together to let a system handle 100x more users." },
    ],
    interviewQuestions: [
      { question: "What's the difference between vertical and horizontal scaling?", answer: "Vertical scaling adds more power to a single machine; horizontal scaling adds more machines and spreads the work across them." },
      { question: "Why do most large systems eventually favor horizontal scaling?", answer: "Because there's a physical and cost ceiling to how powerful a single machine can become, while adding more machines can, in principle, continue indefinitely." },
      { question: "Why is storing state only on one server a scalability problem?", answer: "Because other servers can't see that state, so requests must always be routed back to that specific server — breaking the flexibility that horizontal scaling relies on." },
    ],
    prerequisites: ["load-balancing", "queues"],
    relatedTopics: ["load-balancing", "caching", "databases"],
    keywords: ["scalability", "vertical scaling", "horizontal scaling", "stateless"],
  },
  {
    id: "cap-theorem",
    title: "CAP Theorem",
    level: "advanced",
    description: "A rule that says a distributed system can't fully guarantee consistency and availability at the same time during a network problem.",
    explanation: `
When a database's data is spread across multiple machines (for
reliability or scale), a real question arises: what happens if the
network connection between those machines breaks — a **partition**? The
**CAP theorem** states that, during a network partition, a distributed
system must choose between **consistency** (every node — each machine
holding a copy of the data — gives the exact same, most up-to-date
answer) and **availability** (every node keeps responding to requests
at all) — it cannot fully guarantee both at the same time.

Partition tolerance (surviving a network split at all, rather than the
whole system failing) is treated as mandatory for any real distributed
system — so in practice, CAP is really a choice between consistency and
availability specifically when a partition happens.
    `.trim(),
    analogy:
      "Imagine two branches of a bank that can no longer communicate with each other. If a customer tries to withdraw money at one branch, the bank has two choices: refuse the withdrawal until the branches can confirm with each other (choosing consistency over availability), or allow it based on local information and risk the two branches disagreeing later (choosing availability over consistency). It can't guarantee both a confirmed, agreed-upon answer and an instant response while the branches are cut off from each other.",
    examples: [
      {
        title: "Two systems, two different choices during a partition",
        code: `// CP system: refuses to answer rather than risk an inconsistent one
if (!canReachOtherNodes()) {
  throw new Error("Cannot guarantee consistency — refusing request");
}

// AP system: answers anyway, using whatever local data it has
if (!canReachOtherNodes()) {
  return localData; // might be stale, but still responds
}`,
        walkthrough: [
          { code: "throw new Error(...) (CP)", explanation: "Chooses to stop answering rather than risk giving an outdated or conflicting answer." },
          { code: "return localData; (AP)", explanation: "Chooses to keep answering, accepting the data might be temporarily stale or inconsistent with other nodes." },
        ],
      },
    ],
    howItWorks: `
During normal operation, with no network partition, a well-designed
distributed system can offer both strong consistency and full
availability. The CAP theorem only bites specifically when a partition
happens: at that moment, a node that can't confirm with the rest of the
system must decide whether to refuse to answer (protecting consistency)
or answer anyway using only what it has locally (protecting
availability).
    `.trim(),
    whyItExists: `
CAP theorem exists to make an unavoidable tradeoff explicit: distributed
systems that span multiple machines will eventually experience network
partitions, and designers must decide in advance which guarantee —
consistency or availability — matters more for their specific use case
when that happens.
    `.trim(),
    whenToUse: `
Use CAP thinking specifically when designing or choosing a distributed
database or system that spans multiple nodes — it tells you what
question to ask ("what should happen here during a network partition?")
rather than a specific answer, since the right choice depends entirely
on the application.
    `.trim(),
    whenNotToUse: `
Don't treat CAP as a strict, permanent label ("this database is CP" or
"this database is AP") for every situation — many real systems make
different tradeoffs for different operations, and the theorem is really
about behavior specifically during partitions, not all the time.
    `.trim(),
    commonMistakes: [
      "Treating CAP as 'pick 2 of 3 permanently' — partition tolerance isn't really optional for a real distributed system, so it's actually a choice between C and A specifically during a partition.",
      "Assuming a system must be either fully CP or fully AP for everything it does — many systems make different consistency/availability tradeoffs for different kinds of operations.",
      "Forgetting that CAP only matters during an actual network partition — most of the time, a well-designed system can offer strong guarantees on both fronts.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, what a 'network partition' is in the context of CAP." },
      { difficulty: "Medium", prompt: "Describe a real feature where you'd want a system to prioritize availability over consistency during a partition, and why." },
      { difficulty: "Hard", prompt: "Explain why partition tolerance is usually treated as mandatory rather than optional for a real distributed system." },
    ],
    interviewQuestions: [
      { question: "What does the CAP theorem state?", answer: "During a network partition, a distributed system must choose between consistency (every node agrees on the latest data) and availability (every node keeps responding), and can't fully guarantee both at once." },
      { question: "Why is partition tolerance usually considered mandatory?", answer: "Because network partitions are a real, unavoidable possibility in any system spread across multiple machines — a system that can't tolerate them at all isn't really distributed in practice." },
      { question: "Give an example of choosing availability over consistency.", answer: "A shopping cart service that keeps accepting additions during a partition, even if it means occasionally reconciling conflicting versions later, rather than blocking the user entirely." },
    ],
    prerequisites: ["consistency-models"],
    relatedTopics: ["consistency-models", "database-replication", "scalability"],
    keywords: ["CAP theorem", "consistency", "availability", "partition tolerance", "distributed systems"],
  },
  {
    id: "consistent-hashing",
    title: "Consistent Hashing",
    level: "advanced",
    description: "A hashing technique that keeps most data in place even when servers are added or removed.",
    explanation: `
A simple way to decide which server holds a piece of data is
\`hash(key) % numberOfServers\` — but there's a serious problem: the
moment the number of servers changes (one is added, or one fails),
that formula's result changes for nearly every key, meaning almost all
data would need to move at once. **Consistent hashing** is a technique
that avoids this: it arranges both servers and data on a conceptual
circle (a **hash ring**), so that adding or removing a server only
affects the small slice of data near it on the ring — not everything.
    `.trim(),
    analogy:
      "Imagine seats arranged in a circle, and guests are assigned to the nearest empty seat clockwise from wherever their name happens to land on that circle. If one seat is removed, only the guest who was sitting there needs to move to the next seat over — everyone else stays exactly where they were. Compare that to a rule like 'seat number = name length % total seats,' where adding or removing even one seat reshuffles almost everyone.",
    examples: [
      {
        title: "The core idea of a hash ring",
        code: `// Simplified: servers and keys both hashed onto the same circular range
const servers = [{ id: "server-A", position: 10 }, { id: "server-B", position: 200 }];

function getServerForKey(key) {
  const keyPosition = hash(key) % 360; // hash onto the same circle
  // find the first server at or after keyPosition, wrapping around
  return servers
    .sort((a, b) => a.position - b.position)
    .find((s) => s.position >= keyPosition) ?? servers[0];
}`,
        walkthrough: [
          { code: "hash(key) % 360", explanation: "Places this specific key at some position on the circle, the same way every server is placed." },
          { code: "find((s) => s.position >= keyPosition)", explanation: "Walks clockwise from the key's position to find the first server responsible for it." },
          { code: "?? servers[0]", explanation: "Wraps back around to the first server if nothing was found past the key's position." },
        ],
      },
    ],
    howItWorks: `
Both servers and data keys are hashed onto the same circular range of
values. Each key belongs to whichever server is the next one clockwise
from the key's position on the ring. When a server is added, it only
takes over the keys between itself and the previous server on the ring —
everything else stays exactly where it was. When a server is removed,
only its keys need to move, to the next server clockwise.
    `.trim(),
    whyItExists: `
Without consistent hashing, adding or removing even one server from a
sharded or distributed cache system would force nearly all data to be
relocated at once — an expensive, disruptive operation. Consistent
hashing makes scaling a distributed system up or down dramatically
cheaper by minimizing how much data actually needs to move.
    `.trim(),
    whenToUse: `
Reach for consistent hashing when building or choosing a distributed
cache or sharded data store that needs to grow or shrink its number of
servers over time without an expensive full data reshuffle — this is
exactly how systems like distributed caches and some NoSQL databases
decide where data lives.
    `.trim(),
    whenNotToUse: `
For a fixed, small number of servers that will essentially never change,
the simpler \`hash(key) % numberOfServers\` approach is easier to reason
about and implement — consistent hashing earns its complexity
specifically when server count changes over time.
    `.trim(),
    commonMistakes: [
      "Using simple modulo hashing (`hash(key) % n`) for a system expected to scale up or down, then being surprised by a massive, disruptive data reshuffle when the server count changes.",
      "Forgetting that a naive hash ring can distribute data unevenly if servers happen to land close together on the ring — real implementations add multiple 'virtual nodes' per server to smooth this out.",
      "Assuming consistent hashing eliminates all data movement on a server change — it minimizes it, but the affected slice still has to move somewhere.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, why `hash(key) % numberOfServers` causes almost all data to move when a server is added." },
      { difficulty: "Medium", prompt: "Describe how consistent hashing limits the amount of data that moves when a new server joins." },
      { difficulty: "Hard", prompt: "Explain what 'virtual nodes' are in consistent hashing and why they help distribute data more evenly." },
    ],
    interviewQuestions: [
      { question: "What problem does consistent hashing solve?", answer: "It minimizes how much data needs to move when the number of servers in a distributed system changes, compared to simple modulo-based hashing which reshuffles almost everything." },
      { question: "How does a hash ring decide which server owns a given key?", answer: "The key is hashed onto the same circular range as the servers, and it belongs to whichever server is next going clockwise from the key's position." },
      { question: "What are virtual nodes, and why are they used?", answer: "Multiple positions on the ring assigned to each real server, so data is spread more evenly instead of depending on the luck of where each server happens to land." },
    ],
    prerequisites: ["sharding"],
    relatedTopics: ["sharding", "caching", "scalability"],
    keywords: ["consistent hashing", "hash ring", "sharding", "virtual nodes"],
  },
  {
    id: "api-gateway",
    title: "API Gateway",
    level: "advanced",
    description: "A single entry point in front of many backend services, handling shared concerns so each service doesn't have to.",
    explanation: `
In a **microservices architecture** — a system built as many small,
independent services instead of one big application — a client might
need data from several different services to render one screen. Every
one of those services might need the same handful of things done first:
authentication checked, requests logged, a rate limit enforced. An
**API gateway** is a dedicated service that sits in front of all the
others, handling exactly those shared, repeated concerns once, in one
place, before forwarding each request to whichever backend service
should actually handle it.
    `.trim(),
    analogy:
      "It's like a hotel concierge desk. Guests don't wander the building looking for housekeeping, room service, or the gym directly — they go to one desk, which checks who they are, then directs (or handles) their request appropriately, whether that means calling housekeeping or handling it right there.",
    examples: [
      {
        title: "A gateway handling shared concerns before routing",
        code: `// Simplified API gateway middleware
async function handleRequest(req) {
  if (!isAuthenticated(req)) return { status: 401 };
  if (isRateLimited(req.userId)) return { status: 429 };

  logRequest(req);

  if (req.path.startsWith("/users")) return userService.handle(req);
  if (req.path.startsWith("/orders")) return orderService.handle(req);
}`,
        walkthrough: [
          { code: "isAuthenticated(req)", explanation: "Checked once, here, instead of separately inside every backend service." },
          { code: "isRateLimited(req.userId)", explanation: "Also enforced centrally, before the request ever reaches a backend." },
          { code: "userService.handle(req) / orderService.handle(req)", explanation: "Only after passing the shared checks does the gateway forward the request to the specific service responsible for it." },
        ],
      },
    ],
    howItWorks: `
Every client request goes to the gateway first, never directly to an
individual backend service. The gateway applies shared logic —
authentication, rate limiting, logging, sometimes combining data from
multiple services into one response — and then routes the request to the
correct backend, relaying its response back to the client.
    `.trim(),
    whyItExists: `
Without a gateway, every individual microservice would need to
reimplement the same authentication, rate limiting, and logging logic
itself — duplicated effort, and an easy place for inconsistencies and
security gaps to creep in. A gateway centralizes those shared concerns
in exactly one place.
    `.trim(),
    whenToUse: `
Introduce an API gateway once you have multiple backend services that
clients need to interact with, and repeated cross-cutting concerns
(auth, rate limiting, logging) that would otherwise need to be
duplicated across every one of them.
    `.trim(),
    whenNotToUse: `
For a single backend service (or a simple monolith), an API gateway is
an extra layer with no real benefit yet — it earns its place specifically
once there are multiple services to unify in front of.
    `.trim(),
    commonMistakes: [
      "Letting the gateway grow so much business logic that it becomes its own tangled monolith, defeating the purpose of splitting services in the first place.",
      "Treating the gateway as optional infrastructure — since every request flows through it, it also becomes a critical single point of failure that needs its own redundancy.",
      "Forgetting that a gateway adds an extra network hop and a small amount of latency to every single request.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, what problem an API gateway solves for a system with many microservices." },
      { difficulty: "Medium", prompt: "List three concerns that make sense to handle in an API gateway rather than in each individual backend service." },
      { difficulty: "Hard", prompt: "Explain why an API gateway itself needs to be highly available, given that every request passes through it." },
    ],
    interviewQuestions: [
      { question: "What is an API gateway?", answer: "A single entry point that sits in front of multiple backend services, handling shared concerns like authentication and rate limiting, then routing requests to the correct service." },
      { question: "Why not just handle authentication separately in each microservice?", answer: "That duplicates the same logic across every service, increasing the chance of inconsistencies or security gaps; centralizing it in a gateway keeps it in one well-tested place." },
      { question: "What's a risk of putting too much logic in an API gateway?", answer: "It can grow into its own overly complex monolith, undermining the benefit of having separate, independently maintainable services behind it." },
    ],
    prerequisites: ["proxy-and-reverse-proxy", "microservices-vs-monolith"],
    relatedTopics: ["proxy-and-reverse-proxy", "rate-limiting", "microservices-vs-monolith"],
    keywords: ["API gateway", "microservices", "routing", "cross-cutting concerns"],
  },
  {
    id: "websockets",
    title: "WebSockets & Real-Time Communication",
    level: "advanced",
    description: "A way for a server to push data to a client the moment something happens, instead of waiting for the client to ask.",
    explanation: `
A normal HTTP request only flows one way at a time: the client asks, the
server answers, and the connection closes. That's a poor fit for things
that need to feel instant and two-way — a chat message arriving, a live
sports score updating, a multiplayer game move. **WebSockets** solve this
by opening one long-lived connection between client and server that
both sides can send messages over, at any time, without needing to
start a new request each time.
    `.trim(),
    analogy:
      "A regular HTTP request is like sending a letter and waiting for a reply before you can say anything else. A WebSocket connection is like being on an open phone call — either person can speak up the instant they have something to say, without hanging up and redialing first.",
    examples: [
      {
        title: "A basic WebSocket exchange",
        code: `// Client
const socket = new WebSocket("wss://chat.example.com");

socket.onmessage = (event) => {
  console.log("New message:", event.data);
};

socket.send("Hello from the client!");

// Server (conceptually) can push a message at any time,
// without the client having asked for it first:
// socket.send("New message from another user!");`,
        walkthrough: [
          { code: 'new WebSocket("wss://...")', explanation: "Opens one persistent connection to the server, instead of a one-off request." },
          { code: "socket.onmessage", explanation: "Fires any time the server sends something, even without the client asking first." },
          { code: "socket.send(...)", explanation: "Either side can send a message over the open connection, at any moment." },
        ],
      },
    ],
    howItWorks: `
A WebSocket connection starts as a normal HTTP request that asks to be
"upgraded"; once the server agrees, the same underlying connection
switches to WebSocket mode and stays open. From then on, both the client
and the server can send messages over it at any time, in either
direction, without the overhead of starting a brand new HTTP request for
every single message.
    `.trim(),
    whyItExists: `
Some experiences need the server to notify the client the instant
something happens — a message arrives, a price changes, another player
moves — rather than the client having to repeatedly ask "anything new
yet?" WebSockets make that kind of real-time, two-way communication
efficient, instead of relying on constant polling.
    `.trim(),
    whenToUse: `
Reach for WebSockets when you need frequent, low-latency, two-way
communication — chat applications, live collaborative editing, real-time
dashboards, multiplayer games.
    `.trim(),
    whenNotToUse: `
For data that only changes occasionally, or where the client is fine
checking every so often, a WebSocket's always-open connection is
unnecessary overhead — a regular HTTP request (or an occasional poll) is
simpler and doesn't require the server to hold open a persistent
connection per client.
    `.trim(),
    commonMistakes: [
      "Reaching for WebSockets for data that barely changes, adding real infrastructure complexity (each open connection consumes server resources) with little benefit.",
      "Forgetting that a load balancer needs special configuration to keep a client's WebSocket connection routed to the same server for its whole lifetime.",
      "Not handling reconnection — a WebSocket connection can drop (network hiccup, server restart), and a robust client needs to detect that and reconnect.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, why a chat app benefits from WebSockets more than a news website does." },
      { difficulty: "Medium", prompt: "Describe what 'polling' is, and how it compares to WebSockets for getting near-real-time updates." },
      { difficulty: "Hard", prompt: "Explain why a load balancer routing WebSocket traffic needs to behave differently than one routing regular HTTP requests." },
    ],
    interviewQuestions: [
      { question: "What problem do WebSockets solve that plain HTTP doesn't?", answer: "They allow the server to push data to the client at any time over a single long-lived connection, instead of the client having to repeatedly ask for updates." },
      { question: "How does a WebSocket connection get established?", answer: "It starts as a normal HTTP request asking to 'upgrade' to a WebSocket; once the server agrees, the same connection switches to WebSocket mode and stays open." },
      { question: "When would a WebSocket be overkill?", answer: "For data that changes rarely, or where the client doesn't need updates instantly — a normal HTTP request (or occasional polling) is simpler and avoids holding open a persistent connection." },
    ],
    prerequisites: ["http"],
    relatedTopics: ["http", "load-balancing"],
    keywords: ["WebSocket", "real-time", "polling", "two-way communication"],
  },
  {
    id: "circuit-breaker",
    title: "Circuit Breaker & Retries",
    level: "advanced",
    description: "Protecting a system from a failing dependency, instead of letting that failure cascade everywhere.",
    explanation: `
When one service calls another (common in microservices), that other
service might be slow or down. Naively retrying the same failing call
over and over can make things worse — it piles on more load exactly
when the failing service can least handle it, and can even take down
the caller too, as it piles up requests waiting on a response that
never comes. A **circuit breaker** guards against this: after enough
failures, it "trips" and stops sending requests to the failing
dependency for a while, failing fast instead — giving the struggling
service room to recover.
    `.trim(),
    analogy:
      "It's like an electrical circuit breaker in a house: rather than let a dangerous surge keep flowing and risk starting a fire, the breaker trips and cuts the circuit entirely. After some time (or once it's safe), it can be reset and power flows again.",
    examples: [
      {
        title: "A simple circuit breaker wrapping a risky call",
        code: `let failureCount = 0;
let open = false;
let openedAt = null;

async function callWithBreaker(fn) {
  if (open) {
    if (Date.now() - openedAt < 30000) {
      throw new Error("Circuit open — failing fast");
    }
    open = false; // try again after the cooldown
  }

  try {
    const result = await fn();
    failureCount = 0; // success resets the count
    return result;
  } catch (error) {
    failureCount++;
    if (failureCount >= 5) {
      open = true;
      openedAt = Date.now();
    }
    throw error;
  }
}`,
        walkthrough: [
          { code: "if (open) { ... }", explanation: "Once tripped, requests fail immediately without even attempting the risky call." },
          { code: "Date.now() - openedAt < 30000", explanation: "After a cooldown period, the breaker allows a test attempt again." },
          { code: "failureCount >= 5", explanation: "After enough consecutive failures, the breaker trips open, protecting the caller and the struggling dependency alike." },
        ],
      },
    ],
    howItWorks: `
A circuit breaker tracks recent failures for a given dependency. While
failures stay below a threshold, it behaves normally (**closed** —
requests flow through). Once failures cross that threshold, it
**opens** — further calls fail immediately, without even attempting the
network call, for a cooldown period. After that cooldown, it allows a
small number of test requests through (**half-open**) to check if the
dependency has recovered, closing again if so.
    `.trim(),
    whyItExists: `
Blindly retrying a failing dependency wastes time and resources on calls
that are likely to fail anyway, and can pile up enough waiting requests
to bring down the calling service too. A circuit breaker fails fast
instead, protecting both the caller's own stability and giving the
failing dependency breathing room to recover.
    `.trim(),
    whenToUse: `
Use a circuit breaker around calls to any external dependency (another
microservice, a third-party API) whose failure shouldn't be allowed to
cascade into your own service failing too — especially in systems with
many service-to-service calls.
    `.trim(),
    whenNotToUse: `
For calls where a failure genuinely should just fail immediately and be
reported (no retrying makes sense, like a clearly invalid request), a
circuit breaker adds complexity without benefit — it's specifically
valuable for transient, recoverable failures.
    `.trim(),
    commonMistakes: [
      "Retrying a failing call immediately and indefinitely, without any backoff or circuit breaker, piling on load exactly when the dependency is already struggling.",
      "Setting the failure threshold or cooldown so aggressively that the breaker trips on ordinary, brief blips instead of genuine sustained failures.",
      "Forgetting to have a sensible fallback behavior for when the circuit is open, instead of just surfacing a confusing error to the end user.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, why blindly retrying a failing call can make an outage worse, not better." },
      { difficulty: "Medium", prompt: "Describe the three states of a circuit breaker (closed, open, half-open) and what triggers moving between them." },
      { difficulty: "Hard", prompt: "Explain what a good 'fallback' behavior might look like for a circuit breaker that's currently open, for a feature like showing product recommendations." },
    ],
    interviewQuestions: [
      { question: "What problem does a circuit breaker solve?", answer: "It stops a caller from continuing to hammer a failing dependency with requests, failing fast instead to protect both the caller's own stability and give the dependency room to recover." },
      { question: "What are the three states of a circuit breaker?", answer: "Closed (requests flow normally), open (requests fail immediately without attempting the call), and half-open (a few test requests are allowed through to check if the dependency has recovered)." },
      { question: "Why is blind, unlimited retrying dangerous?", answer: "It can pile up load on an already-struggling dependency and cause the caller itself to back up waiting on responses, potentially cascading the failure further." },
    ],
    prerequisites: ["microservices-vs-monolith"],
    relatedTopics: ["microservices-vs-monolith", "rate-limiting"],
    keywords: ["circuit breaker", "retries", "resilience", "cascading failure", "fault tolerance"],
  },
  {
    id: "idempotency",
    title: "Idempotency",
    level: "advanced",
    description: "Designing an operation so that doing it more than once has the exact same effect as doing it once.",
    explanation: `
Networks are unreliable — a request might time out even though the
server actually processed it successfully, leaving the client unsure
whether to retry. If retrying could cause the operation to happen twice
(charging a customer twice, sending a duplicate email), that's a real
problem. An operation is called **idempotent** if performing it multiple
times has the exact same effect as performing it once — making it safe
to retry without fear of duplicating the result.
    `.trim(),
    analogy:
      "Pressing an elevator call button is idempotent — pressing it five times doesn't summon five elevators, the outcome is the same as pressing it once. Compare that to shouting 'add one more pizza to my order' five times — that genuinely places five separate orders, since each shout is a new instruction, not a repeat of the same one.",
    examples: [
      {
        title: "A non-idempotent request made safely idempotent",
        code: `// Not idempotent: retrying this could charge the customer twice
// POST /payments  { amount: 50, userId: 123 }

// Made idempotent with a client-generated key
// POST /payments
// { amount: 50, userId: 123, idempotencyKey: "req-8f3a2b" }

// Server logic:
function handlePayment(request, alreadyProcessed, previousResult, processPayment) {
  if (alreadyProcessed(request.idempotencyKey)) {
    return previousResult(request.idempotencyKey); // don't redo the charge
  }
  return processPayment(request); // otherwise process normally, and remember this key's result
}`,
        walkthrough: [
          { code: 'idempotencyKey: "req-8f3a2b"', explanation: "A unique id the client generates once per logical attempt, sent along with every retry of that same attempt." },
          { code: "alreadyProcessed(request.idempotencyKey)", explanation: "Checks whether this exact request has already been handled." },
          { code: "return previousResult(request.idempotencyKey);", explanation: "If so, returns the original result instead of processing (and charging) again." },
        ],
      },
    ],
    howItWorks: `
The client generates a unique key for a given logical operation (not
per network attempt — the same key is reused for retries of the same
attempt) and sends it along with the request. The server remembers
which keys it has already processed and their results; if the same key
arrives again, it returns the stored result instead of repeating the
underlying effect.
    `.trim(),
    whyItExists: `
Without idempotency, a client that can't tell whether a request actually
succeeded (because the response was lost, not because the request
failed) has no safe way to retry — retrying risks duplicating the
effect, while not retrying risks leaving a legitimately failed operation
unresolved. Idempotency removes that dilemma by making retries harmless.
    `.trim(),
    whenToUse: `
Make an operation idempotent whenever it has a real-world effect that
would be harmful to duplicate — payments, sending a notification,
creating an order — especially for any operation a client might
reasonably retry after an uncertain failure.
    `.trim(),
    whenNotToUse: `
For an operation that's naturally already safe to repeat (checking a
status, reading data, updating a value to a fixed target state)
idempotency is often already free — no extra key or tracking is needed.
Reserve the extra idempotency-key machinery for operations that
genuinely aren't naturally idempotent, like "charge" or "send".
    `.trim(),
    commonMistakes: [
      "Assuming GET requests need idempotency protection — reads are naturally idempotent already, since reading the same thing twice changes nothing.",
      "Reusing a fresh idempotency key for every retry attempt instead of the same key for the same logical operation, which defeats the entire purpose.",
      "Forgetting to eventually expire stored idempotency keys, causing unbounded storage growth over time.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, why retrying a payment request without idempotency protection is risky." },
      { difficulty: "Medium", prompt: "Give one example of an operation that's naturally idempotent, and one that isn't, and explain the difference." },
      { difficulty: "Hard", prompt: "Explain why the idempotency key must be generated once per logical attempt by the client, rather than by the server." },
    ],
    interviewQuestions: [
      { question: "What does it mean for an operation to be idempotent?", answer: "Performing it multiple times has the exact same effect as performing it once, making it safe to retry without duplicating the result." },
      { question: "Why is idempotency especially important for payment APIs?", answer: "Because a client that isn't sure if a payment request succeeded needs a safe way to retry without risking charging the customer twice." },
      { question: "Is a GET request typically idempotent?", answer: "Yes — reading the same data multiple times doesn't change anything, so GET requests are naturally idempotent without any extra design work." },
    ],
    prerequisites: ["rest-apis"],
    relatedTopics: ["rest-apis", "circuit-breaker"],
    keywords: ["idempotency", "idempotency key", "retries", "duplicate requests"],
  },
  {
    id: "monitoring-and-observability",
    title: "Monitoring & Observability",
    level: "advanced",
    description: "Being able to tell what your system is actually doing, and why something went wrong, without guessing.",
    explanation: `
A system running in production will eventually behave unexpectedly —
slow down, throw errors, or fail outright — and when it does, someone
needs to figure out why, often under time pressure. **Monitoring** means
continuously tracking key signals about a system's health (like error
rates, response times, and resource usage) and alerting when something
looks wrong. **Observability** is the broader ability to actually
understand why, using tools like logs (a record of discrete events),
metrics (numeric measurements over time), and traces (the path a single
request took across multiple services).
    `.trim(),
    analogy:
      "Monitoring is like a car's dashboard warning lights — it tells you something is wrong (check engine, low oil) without necessarily telling you exactly why. Observability is like being able to pop the hood and actually trace the problem back to its source — a specific wire, a specific part — using the detailed information available, rather than just knowing a light came on.",
    examples: [
      {
        title: "The three pillars, applied to one slow request",
        code: `// A metric: how many requests are slow right now?
metrics.increment("api.requests.slow", { endpoint: "/checkout" });

// A log: what exactly happened for this one request?
logger.info("Checkout failed", { userId: 42, reason: "payment timeout" });

// A trace: which specific step, across multiple services, was slow?
// checkout-service (12ms) -> payment-service (4800ms) <- the slow one
//                         -> inventory-service (8ms)`,
        walkthrough: [
          { code: "metrics.increment(...)", explanation: 'Adds to a running count, useful for noticing "slow checkouts are up" at a glance, without any detail on a specific request.' },
          { code: "logger.info(...)", explanation: "Records a detailed, specific event, useful for investigating exactly what happened for one user's request." },
          { code: "The trace", explanation: "Shows exactly which service, out of several involved, was actually responsible for the slowness — here, payment-service." },
        ],
      },
    ],
    howItWorks: `
Metrics are lightweight numeric counters and measurements collected
continuously (requests per second, average latency, error rate) and are
cheap to store and graph over time, making them great for spotting
trends and triggering alerts. Logs capture detailed, timestamped records
of specific events, useful for digging into exactly what happened.
Traces follow one individual request as it moves through multiple
services, showing exactly where time was spent — essential once a
system is split across many services, where a single log or metric
alone can't show the full path.
    `.trim(),
    whyItExists: `
Without monitoring and observability, the only way to know something is
wrong is when a user complains — and even then, there'd be no good way
to figure out why. These tools let a team notice problems quickly (often
before users do) and diagnose the actual root cause instead of
guessing.
    `.trim(),
    whenToUse: `
Build in monitoring and observability from early on in any production
system — metrics and alerts for overall health, logs for debugging
specific incidents, and traces especially once a system involves
multiple services calling each other.
    `.trim(),
    whenNotToUse: `
For a small prototype or a personal project with no real users
depending on it, full observability tooling (dedicated tracing
infrastructure, alerting pipelines) is likely overkill — basic logging
is often enough until the system actually matters to someone besides
you.
    `.trim(),
    commonMistakes: [
      "Logging so much low-value detail that genuinely important log entries get lost in the noise.",
      "Having metrics and dashboards but no alerts, so problems are only noticed when someone happens to be looking at a graph.",
      "Relying only on logs in a multi-service system, where a single request touches several services and no one log tells the full story — that's exactly what tracing is for.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain, in your own words, the difference between a metric and a log." },
      { difficulty: "Medium", prompt: "Describe a scenario where a metric alone would tell you something is wrong, but you'd need a trace to find out why." },
      { difficulty: "Hard", prompt: "Explain why observability becomes significantly more important once a system moves from a monolith to microservices." },
    ],
    interviewQuestions: [
      { question: "What's the difference between monitoring and observability?", answer: "Monitoring tracks key signals and alerts when something looks wrong; observability is the broader ability to actually understand why, using logs, metrics, and traces together." },
      { question: "What are the three commonly cited 'pillars' of observability?", answer: "Logs (detailed records of specific events), metrics (numeric measurements over time), and traces (the path of a single request across multiple services)." },
      { question: "Why does tracing become especially important in a microservices architecture?", answer: "Because a single request can pass through many separate services, and no single log or metric can show the complete path — a trace ties all the pieces together." },
    ],
    prerequisites: ["microservices-vs-monolith"],
    relatedTopics: ["microservices-vs-monolith", "circuit-breaker"],
    keywords: ["monitoring", "observability", "logs", "metrics", "tracing", "alerting"],
  },
];
