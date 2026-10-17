import type { Topic } from "../../types/content";

export const systemDesignAdvancedTopics: Topic[] = [
  {
    id: "load-balancing",
    title: "Load Balancing",
    level: "advanced",
    description: "Spreading requests across several servers so no single one gets overwhelmed.",
    explanation: `
One server can only handle so many requests at once. Past that, you need
more servers, but then which server should each request go to?

A **load balancer** sits in front of a group of servers and picks one for
every incoming request. It spreads the work so no server is overloaded
while others sit idle.
    `.trim(),
    analogy:
      "A load balancer is like the host at a busy restaurant who seats guests across all the tables, instead of giving one table 20 parties while the rest sit empty.",
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
          "A simplified 'round robin', one of several strategies real load balancers use.",
        walkthrough: [
          { code: "const servers = [...]; let next = 0;", explanation: "Keeps a list of servers and tracks which one is next." },
          { code: "function pickServer() {", explanation: "Called once per request to decide where it goes." },
          { code: "const server = servers[next];", explanation: "Picks the current server in the rotation." },
          { code: "next = (next + 1) % servers.length;", explanation: "Moves to the next server, wrapping to the start after the last one." },
        ],
      },
    ],
    howItWorks: `
Every request reaches the load balancer first. It picks a healthy server
and forwards the request there, using a strategy such as:

- **Round robin**: cycle through servers in a fixed order, however busy each one is.
- **Least-connections**: send each new request to the server with the fewest requests still in progress.
- Server load.

It also keeps checking server health and stops sending traffic to any
server that's down.
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
Without it, scaling means one huge server: expensive, and still a single
point of failure. Load balancing lets you add ordinary servers as traffic
grows and keeps the system running if one server fails.
    `.trim(),
    whenToUse: `
Use one as soon as a single server can't handle your traffic reliably,
or when the app must survive one server failing.
    `.trim(),
    whenNotToUse: `
A small, low-traffic app on one server doesn't need one yet. It adds
infrastructure and cost for a problem you don't have. Add it when
traffic or reliability needs demand it, not for imagined scale.
    `.trim(),
    commonMistakes: [
      "Treating the load balancer as unbreakable. It needs redundancy too, or it becomes a single point of failure.",
      "Ignoring 'sticky sessions' (routing a user's later requests back to the same server) when that user's data lives only on that server.",
      "Assuming load balancing alone solves scaling. The database or other shared resources behind it can still be the bottleneck.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain in your own words why a single server isn't enough for a popular application." },
      { difficulty: "Medium", prompt: "Describe the difference between 'round robin' and 'least connections' as load balancing strategies." },
      { difficulty: "Hard", prompt: "Explain what could go wrong if a load balancer keeps sending traffic to a crashed server, and how health checks fix it." },
    ],
    interviewQuestions: [
      { question: "What problem does a load balancer solve?", answer: "It spreads requests across several servers so none is overwhelmed, and traffic keeps flowing if one fails." },
      { question: "What is a health check in load balancing?", answer: "A regular check the load balancer runs on each server to confirm it still responds, so it can stop routing to unhealthy ones." },
      { question: "Can a load balancer itself be a single point of failure?", answer: "Yes. That's why production systems often run several load balancers with their own failover." },
    ],
    prerequisites: ["caching"],
    relatedTopics: ["scalability", "caching", "queues", "proxy-and-reverse-proxy", "api-gateway"],
    keywords: ["load balancer", "round robin", "health check", "scaling"],
  },
  {
    id: "queues",
    title: "Queues",
    level: "advanced",
    description: "Handing off work to be done later, without waiting for it.",
    explanation: `
Some tasks don't need to happen while the user waits: sending a
confirmation email, resizing an uploaded image, generating a report.
Doing them during the request makes users wait longer than needed.

With a **message queue**, the server drops a description of the task
into a queue and responds right away. Separate worker processes pick up
tasks from the queue and handle them in the background.
    `.trim(),
    analogy:
      "It's like dropping a form in an office in-tray instead of waiting at the counter while it's processed. You get on with your day; a clerk works through the tray in order, at their own pace.",
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
          { code: "await createUser(req.body);", explanation: "Does the essential work the user is waiting for." },
          { code: 'await queue.push({ type: "welcome-email", ... });', explanation: "Hands the slow, non-essential part to the queue instead of doing it now." },
          { code: 'res.send("Signed up!");', explanation: "Responds right away, without waiting for the email." },
          { code: "queue.onMessage(async (job) => {...})", explanation: "A separate worker picks up and processes the queued job when it can." },
        ],
      },
    ],
    howItWorks: `
A **producer** (like a web server) adds messages describing work to the
queue. One or more **consumers** (worker processes) keep reading the
queue and processing messages.

A message is often removed only after it's handled successfully, so if a
worker crashes mid-task, the message isn't lost and can be retried.
    `.trim(),
    diagram: `
Producer → [ queue: job1, job2, job3 ] → Consumer(s) process jobs
    `.trim(),
    whyItExists: `
Queues separate "accepting a request" from "doing the (possibly slow)
work". That keeps responses fast, smooths out traffic spikes, and makes
it easy to retry failed work without touching the original request.
    `.trim(),
    whenToUse: `
Use a queue when a request triggers work that doesn't need to finish
before you respond (sending an email, processing an upload, generating a
report), especially work that's slow or sometimes fails and needs
retrying.
    `.trim(),
    whenNotToUse: `
Don't queue work whose result the user is waiting to see right now. That
just adds a hop and delay. Queues also add operational work (workers to
run, failures to monitor), so wait until you have slow or bursty
background work to offload.
    `.trim(),
    commonMistakes: [
      "Queuing time-sensitive work when the user needs to see the result immediately.",
      "Not handling failures. If a worker crashes mid-task, the message should be retried, not silently lost.",
      "Letting the queue grow without limit and without enough workers to keep up, so delays pile up.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List three real tasks in a typical web app that are good candidates to run through a queue instead of immediately." },
      { difficulty: "Medium", prompt: "Explain in your own words why queues help a system handle sudden traffic spikes." },
      { difficulty: "Hard", prompt: "Describe how you'd handle a job that fails repeatedly (e.g. a broken email address) so it isn't retried forever." },
    ],
    interviewQuestions: [
      { question: "What problem do message queues solve?", answer: "They let a system hand off slow or non-urgent work for later, keeping the original request fast and smoothing out traffic spikes." },
      { question: "What are 'producers' and 'consumers' in a queue system?", answer: "Producers add messages (jobs) to the queue. Consumers (workers) read and process them, usually independently and in parallel." },
      { question: "Why are queues useful for reliability, not just speed?", answer: "If a worker fails partway through, the message can be safely retried instead of the work being lost." },
    ],
    prerequisites: ["load-balancing"],
    relatedTopics: ["load-balancing", "scalability", "pub-sub"],
    keywords: ["message queue", "producer", "consumer", "worker", "async processing"],
  },
  {
    id: "cdn",
    title: "CDN",
    level: "advanced",
    description: "Servers around the world that deliver content from the location closest to each user.",
    explanation: `
The farther data travels, the longer it takes. If your only server is in
one country, users on the other side of the world always notice a delay.

A **CDN** (Content Delivery Network) stores copies of your content
(images, videos, scripts, static files) on servers in many places
worldwide, and serves each user from the closest copy.
    `.trim(),
    analogy:
      "It's like a chain of grocery stores instead of one giant warehouse. Nobody drives across the country; each town has a local store with the same goods, so everyone gets what they need quickly.",
    examples: [
      {
        title: "Conceptual CDN request flow",
        code: `// Without a CDN:
// User in Tokyo → server in New York → slow round trip

// With a CDN:
// User in Tokyo → nearby CDN server in Tokyo (already has a copy) → fast`,
        walkthrough: [
          { code: "// User in Tokyo → server in New York", explanation: "Without a CDN, every request travels all the way to the one origin server." },
          { code: "// User in Tokyo → nearby CDN server in Tokyo", explanation: "With a CDN, a much closer copy answers, so the round trip is shorter." },
        ],
      },
    ],
    howItWorks: `
Content is copied ("cached") to many CDN servers ("edge locations")
around the world. Each user is routed to the nearest edge location, which
serves its cached copy without contacting the origin server, unless the
content is missing or expired there.
    `.trim(),
    whyItExists: `
CDNs cut load times for users far from the origin server and take load
off that server, since edge locations answer most requests. They help
most with content that rarely changes, like images, videos, and static
files.
    `.trim(),
    whenToUse: `
Use a CDN to serve static assets (images, videos, JS/CSS bundles) to
users in different regions, so they load quickly wherever the user is.
    `.trim(),
    whenNotToUse: `
Don't rely on a CDN for highly personalized or constantly changing data;
it doesn't cache that well. If all your users are already close to your
one server, a CDN's main benefit (proximity) doesn't add much.
    `.trim(),
    commonMistakes: [
      "Using a CDN for highly personalized, frequently changing data that doesn't cache well.",
      "Forgetting to invalidate CDN caches after updating content, so users keep seeing the old version.",
      "Assuming a CDN removes the need for a fast origin server. It helps most with static content, not every request.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain in your own words why a website might load slowly for a user in another country without a CDN." },
      { difficulty: "Medium", prompt: "List which parts of a typical website (images, live account data, CSS files) are a good fit for a CDN, and which aren't." },
      { difficulty: "Hard", prompt: "Describe what could go wrong if you don't invalidate a CDN cache after deploying new versions of your website's images." },
    ],
    interviewQuestions: [
      { question: "What problem does a CDN solve?", answer: "It serves content from a location closer to each user, cutting latency and load on the origin server." },
      { question: "What kind of content is best suited for a CDN?", answer: "Static, rarely changing content like images, videos, stylesheets, and scripts. Not highly personalized or constantly changing data." },
      { question: "What is an 'edge location'?", answer: "One of many geographically spread CDN servers, each holding cached copies of content to serve nearby users quickly." },
    ],
    prerequisites: ["caching"],
    relatedTopics: ["caching", "scalability"],
    keywords: ["CDN", "edge location", "latency", "static content"],
  },
  {
    id: "scalability",
    title: "Scalability",
    level: "advanced",
    description: "A system's ability to keep working well as usage grows: more users, data, and requests.",
    explanation: `
A system that works with a hundred users might fail with a million.
**Scalability** means designing it to keep up as demand grows, ideally by
adding resources rather than redesigning.

There are two main strategies:

- **Vertical scaling**: make one server more powerful (more CPU, more memory).
- **Horizontal scaling**: add more servers and spread the work across them.

Most large systems end up relying on horizontal scaling, because one
machine can only get so powerful.
    `.trim(),
    analogy:
      "Vertical scaling is like hiring one super-employee who works ever faster. Horizontal scaling is hiring more employees and splitting the work. Eventually no single employee, however fast, can outpace a team.",
    examples: [
      {
        title: "The idea, not literal code",
        code: `// Vertical scaling: same one server, upgraded hardware
// 4 CPU cores, 8GB RAM → 32 CPU cores, 256GB RAM

// Horizontal scaling: same modest servers, more of them
// 1 server → 10 servers, behind a load balancer`,
        walkthrough: [
          { code: "// Vertical scaling: same one server, upgraded hardware", explanation: "One machine gets more powerful over time." },
          { code: "// 4 CPU cores, 8GB RAM → 32 CPU cores, 256GB RAM", explanation: "A concrete example: same server, much bigger specs." },
          { code: "// Horizontal scaling: same modest servers, more of them", explanation: "Instead of one bigger machine, add more ordinary ones." },
          { code: "// 1 server → 10 servers, behind a load balancer", explanation: "A load balancer spreads traffic across all ten." },
        ],
      },
    ],
    howItWorks: `
Scalable systems keep individual servers from holding state only they
know about. Then any server can handle any request, and you can add more
freely.

This relies on other pieces working together: load balancers to spread
traffic, caches to avoid repeated work, and databases built for growing
data.
    `.trim(),
    whyItExists: `
Growth is often the whole point of a product. A system that can't scale
becomes slow or falls over exactly when it finally gets popular.
Designing for scale early avoids painful, risky rewrites later.
    `.trim(),
    whenToUse: `
Plan for scalability once real growth is likely soon: when you expect
the system to handle meaningfully more users, data, or traffic than it
does today.
    `.trim(),
    whenNotToUse: `
Don't over-invest in horizontal scaling, statelessness, and distributed
architecture for a prototype or an app with a small, stable user base.
That complexity costs real effort, and early scaling work often bogs
projects down before they ship.
    `.trim(),
    commonMistakes: [
      "Only scaling vertically until you hit the ceiling of the biggest machine available.",
      "Keeping important state on one server (like data in memory), which breaks horizontal scaling because other servers can't see it.",
      "Over-engineering for scale the product doesn't need yet, adding complexity too early.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain in your own words the difference between vertical and horizontal scaling." },
      { difficulty: "Medium", prompt: "Describe a design decision that would make horizontal scaling harder, and how you'd avoid it." },
      { difficulty: "Hard", prompt: "Sketch (in words) how load balancing, caching, and a scalable database work together to let a system handle 100x more users." },
    ],
    interviewQuestions: [
      { question: "What's the difference between vertical and horizontal scaling?", answer: "Vertical scaling adds power to one machine. Horizontal scaling adds machines and spreads the work across them." },
      { question: "Why do most large systems eventually favor horizontal scaling?", answer: "A single machine has a physical and cost ceiling, while adding machines can, in principle, go on indefinitely." },
      { question: "Why is storing state only on one server a scalability problem?", answer: "Other servers can't see it, so requests must always go back to that server, which breaks the flexibility horizontal scaling depends on." },
    ],
    prerequisites: ["load-balancing", "queues"],
    relatedTopics: ["load-balancing", "caching", "databases"],
    keywords: ["scalability", "vertical scaling", "horizontal scaling", "stateless"],
  },
  {
    id: "cap-theorem",
    title: "CAP Theorem",
    level: "advanced",
    description: "A distributed system can't fully guarantee both consistency and availability during a network failure.",
    explanation: `
When data is spread across several machines (for reliability or scale),
what happens if the network between them breaks? That break is a
**partition**.

The **CAP theorem** says that during a partition, a distributed system
must choose between:

- **Consistency**: every node (each machine holding a copy of the data) gives the same, most up-to-date answer.
- **Availability**: every node keeps responding to requests.

It can't fully guarantee both at once.

Partition tolerance (surviving a network split instead of the whole
system failing) is treated as mandatory for any real distributed system.
So in practice, CAP is a choice between consistency and availability
when a partition happens.
    `.trim(),
    analogy:
      "Picture two bank branches that can no longer talk to each other. A customer wants to withdraw money at one. The bank can refuse until the branches can confirm with each other (consistency over availability), or allow it using local information and risk the branches disagreeing later (availability over consistency). While they're cut off, it can't give both an agreed answer and an instant one.",
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
          { code: "throw new Error(...) (CP)", explanation: "Stops answering rather than risk an outdated or conflicting answer." },
          { code: "return localData; (AP)", explanation: "Keeps answering, accepting the data may be briefly stale or out of step with other nodes." },
        ],
      },
    ],
    howItWorks: `
With no partition, a well-designed distributed system can offer both
strong consistency and full availability. CAP only bites when a
partition happens.

Then a node that can't confirm with the rest must choose: refuse to
answer (protecting consistency) or answer from its local data
(protecting availability).
    `.trim(),
    whyItExists: `
It makes an unavoidable trade-off explicit. Systems spread across
machines will eventually hit network partitions, so designers must
decide in advance whether consistency or availability matters more for
their use case when that happens.
    `.trim(),
    whenToUse: `
Use CAP thinking when designing or choosing a distributed database or
multi-node system. It gives you the question to ask ("what should happen
here during a partition?"), not the answer, which depends on the
application.
    `.trim(),
    whenNotToUse: `
Don't treat CAP as a permanent label ("this database is CP" or "AP") for
every situation. Many systems make different trade-offs for different
operations, and the theorem is about behavior during partitions, not all
the time.
    `.trim(),
    commonMistakes: [
      "Treating CAP as 'pick 2 of 3 permanently'. Partition tolerance isn't optional for a real distributed system, so it's a choice between C and A during a partition.",
      "Assuming a system must be fully CP or fully AP for everything. Many systems make different trade-offs for different kinds of operations.",
      "Forgetting CAP only matters during an actual partition. Most of the time, a well-designed system can offer strong guarantees on both.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain in your own words what a 'network partition' is in the context of CAP." },
      { difficulty: "Medium", prompt: "Describe a real feature where a system should favor availability over consistency during a partition, and why." },
      { difficulty: "Hard", prompt: "Explain why partition tolerance is usually treated as mandatory rather than optional for a real distributed system." },
    ],
    interviewQuestions: [
      { question: "What does the CAP theorem state?", answer: "During a network partition, a distributed system must choose between consistency (every node agrees on the latest data) and availability (every node keeps responding). It can't fully guarantee both at once." },
      { question: "Why is partition tolerance usually considered mandatory?", answer: "Partitions are a real, unavoidable risk for any system spread across machines. A system that can't tolerate them isn't really distributed in practice." },
      { question: "Give an example of choosing availability over consistency.", answer: "A shopping cart service that keeps accepting additions during a partition, reconciling conflicting versions later if needed, instead of blocking the user." },
    ],
    prerequisites: ["consistency-models"],
    relatedTopics: ["consistency-models", "database-replication", "scalability"],
    keywords: ["CAP theorem", "consistency", "availability", "partition tolerance", "distributed systems"],
  },
  {
    id: "consistent-hashing",
    title: "Consistent Hashing",
    level: "advanced",
    description: "A hashing technique that keeps most data in place when servers are added or removed.",
    explanation: `
A simple way to pick which server holds a piece of data is
\`hash(key) % numberOfServers\`. The problem: when the number of servers
changes (one is added or fails), the result changes for nearly every
key, so almost all data must move at once.

**Consistent hashing** avoids this. It places both servers and data on a
circle (a **hash ring**), so adding or removing a server only affects
the small slice of data next to it.
    `.trim(),
    analogy:
      "Picture seats in a circle. Each guest takes the nearest seat clockwise from where their name lands. Remove one seat and only its guest moves to the next seat; everyone else stays put. Compare a rule like 'seat number = name length % total seats', where adding or removing one seat reshuffles almost everyone.",
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
          { code: "hash(key) % 360", explanation: "Places this key on the circle, the same way every server is placed." },
          { code: "find((s) => s.position >= keyPosition)", explanation: "Walks clockwise from the key to the first server, which owns it." },
          { code: "?? servers[0]", explanation: "Wraps around to the first server if none comes after the key." },
        ],
      },
    ],
    howItWorks: `
Servers and keys are hashed onto the same circular range. Each key
belongs to the next server clockwise from it.

When a server is added, it only takes the keys between itself and the
previous server; everything else stays. When a server is removed, only
its keys move, to the next server clockwise.
    `.trim(),
    whyItExists: `
Without it, adding or removing one server from a sharded store or
distributed cache would force nearly all data to move at once, which is
expensive and disruptive. Consistent hashing makes scaling up or down
far cheaper by moving as little data as possible.
    `.trim(),
    whenToUse: `
Use it for a distributed cache or sharded data store whose server count
will grow or shrink over time, to avoid a full data reshuffle. This is
how distributed caches and some NoSQL databases decide where data lives.
    `.trim(),
    whenNotToUse: `
For a small, fixed number of servers that will basically never change,
plain \`hash(key) % numberOfServers\` is easier to reason about and
build. Consistent hashing pays off when the server count changes.
    `.trim(),
    commonMistakes: [
      "Using simple modulo hashing (`hash(key) % n`) in a system that will scale up or down, then getting a massive, disruptive reshuffle when the server count changes.",
      "Forgetting a naive hash ring can spread data unevenly if servers land close together. Real implementations give each server several 'virtual nodes' to smooth this out.",
      "Assuming consistent hashing removes all data movement. It minimizes it, but the affected slice still has to move.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain in your own words why `hash(key) % numberOfServers` makes almost all data move when a server is added." },
      { difficulty: "Medium", prompt: "Describe how consistent hashing limits how much data moves when a new server joins." },
      { difficulty: "Hard", prompt: "Explain what 'virtual nodes' are in consistent hashing and why they spread data more evenly." },
    ],
    interviewQuestions: [
      { question: "What problem does consistent hashing solve?", answer: "It minimizes how much data moves when the number of servers changes, unlike simple modulo hashing, which reshuffles almost everything." },
      { question: "How does a hash ring decide which server owns a given key?", answer: "The key is hashed onto the same circle as the servers and belongs to the next server clockwise from it." },
      { question: "What are virtual nodes, and why are they used?", answer: "Several ring positions for each real server, so data spreads evenly instead of depending on where each server happens to land." },
    ],
    prerequisites: ["sharding"],
    relatedTopics: ["sharding", "caching", "scalability"],
    keywords: ["consistent hashing", "hash ring", "sharding", "virtual nodes"],
  },
  {
    id: "api-gateway",
    title: "API Gateway",
    level: "advanced",
    description: "One entry point in front of many backend services that handles shared concerns for all of them.",
    explanation: `
In a **microservices architecture** (a system built as many small,
independent services instead of one big app), a client may need data
from several services to render one screen. Each service may need the
same things done first: check authentication, log the request, enforce
a rate limit.

An **API gateway** sits in front of all of them and handles those shared
concerns once, in one place. Then it forwards each request to the right
backend service.
    `.trim(),
    analogy:
      "It's like a hotel concierge desk. Guests don't wander the building looking for housekeeping, room service, or the gym. They go to one desk, which checks who they are and then passes the request on or handles it right there.",
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
          { code: "isAuthenticated(req)", explanation: "Checked once here, not separately in every backend service." },
          { code: "isRateLimited(req.userId)", explanation: "Also enforced centrally, before the request reaches a backend." },
          { code: "userService.handle(req) / orderService.handle(req)", explanation: "Only after the shared checks pass does the gateway forward the request to the service responsible for it." },
        ],
      },
    ],
    howItWorks: `
Every client request goes to the gateway first, never straight to a
backend service. The gateway applies shared logic (authentication, rate
limiting, logging, sometimes combining data from several services into
one response), routes the request to the right backend, and relays the
response back.
    `.trim(),
    whyItExists: `
Without a gateway, every microservice would reimplement the same
authentication, rate limiting, and logging. That's duplicated work and
an easy way for inconsistencies and security gaps to creep in. A gateway
keeps those concerns in one place.
    `.trim(),
    whenToUse: `
Add one when clients talk to several backend services and shared
concerns (auth, rate limiting, logging) would otherwise be duplicated in
each.
    `.trim(),
    whenNotToUse: `
For a single backend service or a simple monolith, a gateway is an extra
layer with no real benefit yet. It pays off once there are several
services to put behind it.
    `.trim(),
    commonMistakes: [
      "Piling so much business logic into the gateway that it becomes its own tangled monolith, defeating the point of splitting services.",
      "Treating the gateway as optional. Every request flows through it, so it's a critical single point of failure that needs its own redundancy.",
      "Forgetting the gateway adds an extra network hop and a little latency to every request.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain in your own words what problem an API gateway solves for a system with many microservices." },
      { difficulty: "Medium", prompt: "List three concerns that make sense to handle in an API gateway rather than in each backend service." },
      { difficulty: "Hard", prompt: "Explain why an API gateway itself must be highly available, given that every request passes through it." },
    ],
    interviewQuestions: [
      { question: "What is an API gateway?", answer: "A single entry point in front of several backend services. It handles shared concerns like authentication and rate limiting, then routes requests to the right service." },
      { question: "Why not just handle authentication separately in each microservice?", answer: "That duplicates the same logic in every service and raises the risk of inconsistencies or security gaps. A gateway keeps it in one well-tested place." },
      { question: "What's a risk of putting too much logic in an API gateway?", answer: "It can become an overly complex monolith of its own, undermining the benefit of separate, independently maintained services behind it." },
    ],
    prerequisites: ["proxy-and-reverse-proxy", "microservices-vs-monolith"],
    relatedTopics: ["proxy-and-reverse-proxy", "rate-limiting", "microservices-vs-monolith"],
    keywords: ["API gateway", "microservices", "routing", "cross-cutting concerns"],
  },
  {
    id: "websockets",
    title: "WebSockets & Real-Time Communication",
    level: "advanced",
    description: "Lets a server push data to a client the moment something happens, without waiting to be asked.",
    explanation: `
A normal HTTP request flows one way at a time: the client asks, the
server answers, and the exchange is over. That's a poor fit for things
that must feel instant and two-way, like a chat message arriving, a live
score updating, or a multiplayer game move.

**WebSockets** open one long-lived connection that both client and
server can send messages over at any time, with no new request each
time.
    `.trim(),
    analogy:
      "A regular HTTP request is like sending a letter and waiting for the reply before you can say anything else. A WebSocket is like an open phone call: either person can speak the moment they have something to say, without hanging up and redialing.",
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
          { code: 'new WebSocket("wss://...")', explanation: "Opens one persistent connection to the server, not a one-off request." },
          { code: "socket.onmessage", explanation: "Fires whenever the server sends something, even if the client didn't ask." },
          { code: "socket.send(...)", explanation: "Either side can send a message over the open connection at any moment." },
        ],
      },
    ],
    howItWorks: `
A WebSocket starts as a normal HTTP request asking to be "upgraded".
Once the server agrees, the same connection switches to WebSocket mode
and stays open.

From then on, client and server can send messages either way at any
time, without the overhead of a new HTTP request per message.
    `.trim(),
    whyItExists: `
Some experiences need the server to tell the client the instant
something happens (a message arrives, a price changes, another player
moves), instead of the client asking "anything new yet?" over and over.
WebSockets make that real-time, two-way communication efficient without
constant polling.
    `.trim(),
    whenToUse: `
Use WebSockets for frequent, low-latency, two-way communication: chat
apps, live collaborative editing, real-time dashboards, multiplayer
games.
    `.trim(),
    whenNotToUse: `
For data that changes only now and then, or when checking every so
often is fine, an always-open connection is unneeded overhead. A regular
HTTP request (or an occasional poll) is simpler and doesn't make the
server hold a connection open per client.
    `.trim(),
    commonMistakes: [
      "Using WebSockets for data that barely changes, adding real infrastructure cost (each open connection uses server resources) for little benefit.",
      "Forgetting a load balancer needs special configuration to keep a client's WebSocket on the same server for the connection's whole life.",
      "Not handling reconnection. Connections drop (network hiccup, server restart), so a robust client must detect that and reconnect.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain in your own words why a chat app benefits from WebSockets more than a news website does." },
      { difficulty: "Medium", prompt: "Describe what 'polling' is, and how it compares to WebSockets for near-real-time updates." },
      { difficulty: "Hard", prompt: "Explain why a load balancer routing WebSocket traffic must behave differently from one routing regular HTTP requests." },
    ],
    interviewQuestions: [
      { question: "What problem do WebSockets solve that plain HTTP doesn't?", answer: "The server can push data to the client at any time over one long-lived connection, so the client doesn't have to keep asking for updates." },
      { question: "How does a WebSocket connection get established?", answer: "It starts as a normal HTTP request asking to 'upgrade'. Once the server agrees, the same connection switches to WebSocket mode and stays open." },
      { question: "When would a WebSocket be overkill?", answer: "When data changes rarely or the client doesn't need instant updates. A normal HTTP request (or occasional polling) is simpler and avoids holding a connection open." },
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
