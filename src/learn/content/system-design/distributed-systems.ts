import type { Topic } from "../../types/content";

export const systemDesignDistributedTopics: Topic[] = [
  {
    id: "consensus-and-leader-election",
    title: "Consensus and Leader Election",
    level: "advanced",
    description: "How a group of machines agrees on one value or one leader, even when some of them crash or the network misbehaves.",
    explanation: `
Many systems need several machines to **agree** on something: who the
current leader is, which config is live, or the order of writes in a log.
Agreeing sounds easy until you remember that machines crash, messages get
delayed or lost, and nobody can tell a dead machine from a slow one.

**Consensus** is the problem of getting a group of nodes to decide on a
single value so that:

- **Agreement**: every node that decides, decides the same value.
- **Validity**: the decided value was actually proposed by someone.
- **Termination**: every node that doesn't crash eventually decides.

The first two are **safety** properties (nothing bad happens). The third
is **liveness** (something good eventually happens).

**Why it's hard.** The **FLP result** (Fischer, Lynch and Paterson, 1985)
proves that in a fully asynchronous network, where messages can take
arbitrarily long, no deterministic algorithm can guarantee consensus if
even one node might crash. The intuition: when a node goes quiet, you
can never be sure whether it crashed or is just slow, so you can always
get stuck waiting or decide too early.

Real systems sidestep FLP by assuming the network is *usually* timely
(partial synchrony). Algorithms like **Raft** and **Paxos** never break
safety, even during chaos, and use **timeouts** to make progress once
the network calms down. They give up guaranteed liveness, not
correctness.

The workhorse idea behind all of them is the **majority quorum**. With
N = 2f + 1 nodes, any two majorities (f + 1 nodes each) overlap in at
least one node, so two conflicting decisions can't both win. That's why
clusters have odd sizes: 3 nodes tolerate 1 failure, 5 tolerate 2, and 4
still tolerates only 1.
    `.trim(),
    analogy:
      "Picture five friends picking a restaurant by text message, where some phones die and texts arrive late. They agree that a choice only counts once at least three of them confirm it. Since any two groups of three share at least one person, two different restaurants can never both get three confirmations.",
    examples: [
      {
        title: "Majority quorum math",
        language: "ts",
        code: `// A cluster of n voting members needs a strict majority to decide anything.
function quorumSize(clusterSize: number): number {
  return Math.floor(clusterSize / 2) + 1;
}

function toleratedFailures(clusterSize: number): number {
  return clusterSize - quorumSize(clusterSize);
}

quorumSize(3);        // 2
toleratedFailures(3); // 1
quorumSize(4);        // 3
toleratedFailures(4); // 1  (no better than 3 nodes, and more to coordinate)
quorumSize(5);        // 3
toleratedFailures(5); // 2`,
        explanation:
          "Adding a fourth node raises the quorum without raising fault tolerance, which is why consensus clusters run 3 or 5 voters.",
        walkthrough: [
          { code: "Math.floor(clusterSize / 2) + 1", explanation: "A strict majority: more than half of the voters." },
          { code: "clusterSize - quorumSize(clusterSize)", explanation: "How many nodes can be down while a majority is still reachable." },
          { code: "toleratedFailures(4); // 1", explanation: "Even sizes add cost and latency but no extra fault tolerance." },
        ],
      },
      {
        title: "Raft's two core RPCs (simplified)",
        language: "ts",
        code: `// Candidate asks for votes. A node grants at most one vote per term,
// and only if the candidate's log is at least as up to date as its own.
interface RequestVote {
  term: number;
  candidateId: string;
  lastLogIndex: number;
  lastLogTerm: number;
}

// Leader replicates entries (an empty entries array is a heartbeat).
interface AppendEntries {
  term: number;
  leaderId: string;
  prevLogIndex: number; // follower must already have this entry...
  prevLogTerm: number;  // ...with this term, or it rejects the call
  entries: { term: number; command: string }[];
  leaderCommit: number; // highest index the leader knows is committed
}

function onRequestVote(node: NodeState, request: RequestVote): boolean {
  if (request.term < node.currentTerm) return false;
  if (request.term > node.currentTerm) node.stepDownTo(request.term);
  const alreadyVotedForSomeoneElse =
    node.votedFor !== null && node.votedFor !== request.candidateId;
  const candidateLogIsUpToDate =
    request.lastLogTerm > node.lastLogTerm ||
    (request.lastLogTerm === node.lastLogTerm &&
      request.lastLogIndex >= node.lastLogIndex);
  if (alreadyVotedForSomeoneElse || !candidateLogIsUpToDate) return false;
  node.votedFor = request.candidateId; // persisted to disk before replying
  return true;
}`,
        explanation:
          "The 'up to date' check is what guarantees a newly elected leader already holds every committed entry.",
      },
    ],
    howItWorks: `
**Raft** (Ongaro and Ousterhout, 2014) was designed to be easier to
understand than Paxos. It splits consensus into three parts.

**1. Terms and roles.** Time is divided into numbered **terms**. Each
node is a **follower**, **candidate** or **leader**. A term has at most
one leader. Any message carrying a higher term makes the receiver update
its term and step down to follower, so stale leaders get demoted
automatically.

**2. Leader election.** Followers expect regular heartbeats from the
leader. If a follower hears nothing for its **election timeout**
(randomized, e.g. 150 to 300 ms in the paper), it increments its term,
becomes a candidate, votes for itself and sends RequestVote to everyone.
It wins with votes from a majority. Randomized timeouts make it unlikely
that two candidates split the vote over and over.

**3. Log replication.** Clients send commands to the leader. The leader
appends each command to its log and sends AppendEntries to followers.
Each AppendEntries includes the index and term of the previous entry; a
follower rejects it if its log doesn't match there, and the leader backs
up until the logs agree, then overwrites the follower's conflicting
suffix. Once an entry from the leader's **current term** is stored on a
majority, the leader advances its **commit index**. Committed entries
(and everything before them) are applied to the state machine on every
node, in the same order. This is **state machine replication**.

**Paxos** (Lamport) reaches the same guarantee with different framing.
Single-decree Paxos has proposers, acceptors and learners in two phases:

- **Prepare/Promise**: a proposer picks a proposal number n and asks
  acceptors to promise to ignore anything numbered below n. They reply
  with any value they've already accepted.
- **Accept/Accepted**: if a majority promised, the proposer sends
  accept(n, v), where v must be the highest-numbered value already
  accepted by those acceptors, or its own if there is none.

Running Paxos once per log slot, with a stable leader skipping phase 1,
is **Multi-Paxos**, which is roughly what Raft is in practice.

**Split brain** is two nodes both believing they're leader and both
accepting writes. Quorums prevent two leaders *in the same term*, but
an old leader cut off by a partition may not know it has been replaced.
It can't commit anything (it can't reach a majority), yet it may still
serve stale reads or act on external systems. Fixes: reads go through
the quorum (Raft's ReadIndex) or rely on leader leases with bounded
clock drift, and side effects carry **fencing tokens** such as the term.

**In practice**, few teams implement consensus themselves. They use a
coordination service built on it:

- **etcd** (Raft): Kubernetes stores all cluster state there.
- **ZooKeeper** (ZAB, a Paxos-like atomic broadcast): used by HBase,
  older Kafka and many Hadoop-era systems.
- **Consul** (Raft), and Raft inside databases such as CockroachDB and
  TiKV, and in Kafka's KRaft mode.
    `.trim(),
    diagram: `
Raft roles and transitions

                 timeout, start election
   ┌──────────┐ ─────────────────────────► ┌───────────┐
   │ Follower │                            │ Candidate │──┐ timeout:
   └──────────┘ ◄───────────────────────── └───────────┘◄─┘ new election
        ▲        sees current leader or        │
        │        higher term                   │ wins majority of votes
        │                                      ▼
        │        sees higher term         ┌──────────┐
        └──────────────────────────────── │  Leader  │
                                          └──────────┘

Log replication (5 nodes, majority = 3)

  Leader  [1:x][1:y][2:z]   ← entry 3 stored on 3 of 5 → committed
  F1      [1:x][1:y][2:z]
  F2      [1:x][1:y][2:z]
  F3      [1:x][1:y]          (lagging, will catch up)
  F4      [1:x]               (lagging, will catch up)
    `.trim(),
    whyItExists: `
Replication alone doesn't tell replicas what order to apply writes in
or who's in charge after a crash. Without consensus you get two leaders,
diverging replicas and lost acknowledged writes. Consensus gives you a
single, fault-tolerant source of truth for the small but critical facts
everything else depends on: leadership, membership, configuration, locks
and the order of a replicated log.
    `.trim(),
    whenToUse: `
- Electing a single leader or primary among replicas.
- Storing cluster metadata and configuration that must never diverge
  (service registry, shard maps, feature flags that gate correctness).
- Building a strongly consistent (linearizable) replicated store or log.
- Coordination primitives: distributed locks, leases, barriers.

Almost always via etcd, ZooKeeper, Consul or a database that embeds Raft
or Paxos, not a hand-written implementation.
    `.trim(),
    whenNotToUse: `
- High-volume data paths where every write needn't go through a single
  ordered log. Consensus costs at least one majority round trip per
  write, and the leader is a throughput ceiling.
- Data that tolerates eventual consistency (counters, likes, caches):
  leaderless replication or CRDTs scale further and stay available
  during partitions.
- Across distant regions for every request, unless you accept the
  cross-region round trip on every commit.
- Don't put large blobs or hot application data in etcd/ZooKeeper; they
  are built for small, critical metadata.
    `.trim(),
    commonMistakes: [
      "Running an even number of voters (2 or 4). It raises the quorum size without adding fault tolerance, and a 2-node cluster can't survive any failure.",
      "Reading from a Raft follower or a possibly deposed leader and assuming the result is linearizable. Use quorum reads (ReadIndex) or a leader lease if you need the latest value.",
      "Treating 'I am leader' as a permanent fact. A paused or partitioned leader can be replaced at any moment, so external side effects need fencing tokens.",
      "Committing an entry from an earlier term just because it's on a majority. Raft only commits by counting replicas for entries from the leader's current term; older entries commit indirectly.",
      "Writing your own consensus algorithm instead of using a proven library or service. The edge cases (log divergence, membership changes, disk fsync) are where real bugs live.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "A 5-node etcd cluster loses 2 nodes. Can it still accept writes? What about after losing a third? Explain using quorum sizes." },
      { difficulty: "Medium", prompt: "Walk through a Raft election where two followers time out at almost the same moment. Explain how split votes happen and why randomized election timeouts make them rare." },
      { difficulty: "Hard", prompt: "A leader in a 5-node Raft cluster is partitioned with one follower while the other three elect a new leader. Describe what each side can and can't do, what happens to writes the old leader accepted, and how the logs reconcile when the partition heals." },
    ],
    interviewQuestions: [
      { question: "What is the consensus problem?", answer: "Getting a group of nodes to agree on a single value (or a sequence of values) so that all deciding nodes choose the same value, the value was actually proposed, and non-faulty nodes eventually decide, despite crashes and message delays." },
      { question: "Why do consensus clusters usually have an odd number of nodes?", answer: "A decision needs a strict majority. N = 2f + 1 nodes tolerate f failures; adding one more node to make it even raises the quorum by one but tolerates no extra failure, so it only adds cost and latency." },
      { question: "What does the FLP result say, and why do Raft and Paxos still work?", answer: "FLP proves no deterministic algorithm can guarantee consensus in a fully asynchronous system if even one process can crash. Raft and Paxos always keep safety and rely on timeouts for liveness, so they make progress whenever the network is timely enough, but can stall during sustained instability." },
      { question: "What is a term in Raft?", answer: "A monotonically increasing logical epoch. Each term has at most one leader. Nodes reject messages with older terms and step down when they see a newer one, which demotes stale leaders." },
      { question: "When is a Raft log entry committed?", answer: "When the leader has replicated an entry from its current term to a majority of nodes. That entry and all earlier ones are then committed and can be applied to the state machine." },
      { question: "How does Raft ensure a new leader doesn't lose committed entries?", answer: "Voters only grant a vote to a candidate whose log is at least as up to date (higher last term, or same last term and at least as long). Since a committed entry is on a majority and a winner needs a majority of votes, at least one voter holds the entry and blocks any candidate missing it." },
      { question: "What is split brain, and how do you prevent it?", answer: "Two nodes acting as leader at once, typically after a partition. Majority quorums prevent two leaders from committing in the same term. To stop a stale leader's side effects you route reads through the quorum or use leases with bounded clock drift, and attach fencing tokens (like the term) to writes in external systems." },
      { question: "How do Paxos and Raft relate?", answer: "Both are majority-quorum consensus protocols with the same fault tolerance. Basic Paxos decides one value via prepare/promise and accept/accepted phases; Multi-Paxos with a stable leader decides a log. Raft is essentially a leader-based Multi-Paxos with a stricter structure (strong leader, log-matching rules, explicit elections) designed for understandability." },
      { question: "How would you serve linearizable reads from a Raft cluster without writing to the log?", answer: "ReadIndex: the leader records its commit index, confirms it's still leader with a heartbeat round to a majority, waits until that index is applied, then serves the read. Alternatively, a leader lease skips the round trip but depends on bounded clock drift, trading safety assumptions for latency." },
      { question: "Why is changing cluster membership tricky, and how does Raft handle it?", answer: "If nodes switch from the old to the new configuration at different times, the old and new majorities might not overlap, allowing two leaders. Raft uses joint consensus (decisions need majorities of both configurations) or adds/removes one server at a time, which guarantees overlap." },
    ],
    prerequisites: ["database-replication", "cap-theorem", "consistency-models"],
    relatedTopics: ["distributed-locks-and-fencing", "gossip-and-failure-detection", "database-replication", "cap-theorem", "consistency-models", "service-discovery", "distributed-transactions"],
    keywords: ["consensus", "Raft", "Paxos", "Multi-Paxos", "FLP", "quorum", "leader election", "split brain", "etcd", "ZooKeeper", "ZAB", "commit index", "state machine replication"],
  },
  {
    id: "distributed-transactions",
    title: "Distributed Transactions",
    level: "advanced",
    description: "Keeping data consistent when one business operation spans several databases or services.",
    explanation: `
Inside one database, a transaction is easy to reason about: either all
of its changes happen, or none do. Once an operation touches **several**
databases or services (charge a card, reserve stock, create a shipment),
there's no single database to guarantee that. One step can succeed while
another fails, leaving the system half-done.

There are two broad answers:

- **Atomic commit across participants**, mainly **two-phase commit
  (2PC)**. All participants commit or all abort, at the cost of
  coordination and blocking.
- **Sagas**: run a sequence of local transactions, and if a later step
  fails, run **compensating actions** to undo the earlier ones. You give
  up isolation and immediate consistency in exchange for availability
  and loose coupling.

Both need a reliable way to say "my local data changed, tell others",
which is where the **transactional outbox** and **change data capture
(CDC)** come in. They solve the **dual-write problem**: writing to a
database and publishing a message are two separate operations, and
either can fail without the other.
    `.trim(),
    analogy:
      "2PC is a wedding: the officiant asks each person 'do you?', and only after both say yes does anyone get married. If the officiant faints between the vows and the announcement, everyone stands frozen. A saga is booking a trip yourself: you book the flight, then the hotel, and if the hotel is full you cancel the flight. Briefly, you held a flight with no hotel.",
    examples: [
      {
        title: "Orchestrated saga with compensations",
        language: "ts",
        code: `interface SagaStep {
  name: string;
  run: (order: Order) => Promise<void>;
  compensate: (order: Order) => Promise<void>;
}

const placeOrderSaga: SagaStep[] = [
  { name: "reserve-stock", run: reserveStock, compensate: releaseStock },
  { name: "charge-card",   run: chargeCard,   compensate: refundCard },
  { name: "ship",          run: createShipment, compensate: cancelShipment },
];

async function runSaga(order: Order, steps: SagaStep[]): Promise<void> {
  const completedSteps: SagaStep[] = [];
  for (const step of steps) {
    try {
      await step.run(order); // each step is a local transaction, idempotent
      completedSteps.push(step);
      await sagaLog.record(order.id, step.name, "done"); // survives restarts
    } catch (error) {
      // Undo in reverse order. Compensations must be idempotent and retried
      // until they succeed; they can't simply "fail".
      for (const done of completedSteps.reverse()) {
        await retryForever(() => done.compensate(order));
      }
      throw error;
    }
  }
}`,
        explanation:
          "A real orchestrator persists the saga state so it can resume after a crash; the in-memory list here only shows the control flow.",
        walkthrough: [
          { code: "{ name: \"charge-card\", run: chargeCard, compensate: refundCard }", explanation: "Every forward step is paired with a semantic undo. A refund is not a rollback: the charge really happened." },
          { code: "await step.run(order);", explanation: "Each step commits in its own service's database." },
          { code: "await sagaLog.record(...)", explanation: "The orchestrator records progress so a restart knows where it was." },
          { code: "completedSteps.reverse()", explanation: "On failure, completed steps are compensated newest first." },
        ],
      },
      {
        title: "Transactional outbox",
        language: "sql",
        code: `BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 42;
  INSERT INTO outbox (id, aggregate_id, event_type, payload)
  VALUES ('evt-9f1c', 42, 'AccountDebited', '{"amount":100}');
COMMIT;

-- A separate relay (a poller, or CDC reading the WAL/binlog) publishes
-- outbox rows to the broker, then marks them sent or lets them be pruned.
-- If it crashes after publishing but before marking, it publishes again:
-- delivery is at-least-once, so consumers dedupe on the event id.`,
        explanation:
          "The business change and the event either both commit or neither does, because they share one local transaction.",
      },
    ],
    howItWorks: `
**Two-phase commit (2PC).** A **coordinator** drives the participants:

1. **Prepare**: the coordinator asks every participant "can you commit?"
   Each participant does the work, writes it durably (including locks)
   and votes **yes** or **no**. A yes vote is a promise: "I will commit
   if told to, even after a crash."
2. **Commit/Abort**: if all voted yes, the coordinator durably logs the
   decision and sends commit; otherwise it sends abort.

**The blocking problem.** After voting yes, a participant may not decide
on its own. If the coordinator crashes before sending the decision, the
participant is **in doubt**: it can't commit (others may have voted no)
or abort (the coordinator may have decided commit). It must hold its
locks and wait for the coordinator to recover. 2PC also adds latency
(two round trips plus forced disk writes) and needs every participant
to support it (XA in many databases and brokers). Running the
coordinator itself on consensus, as Spanner does with Paxos groups,
removes the single point of failure.

**Sagas** (Garcia-Molina and Salem, 1987) replace one big transaction
with a sequence of local transactions T1..Tn, each with a compensation
C1..Cn. If Tk fails, run Ck-1..C1. Two ways to coordinate:

- **Choreography**: each service listens for events and reacts
  ("OrderCreated" → inventory reserves → "StockReserved" → payment
  charges). No central brain, but the flow is spread across services and
  hard to see, test and change; cycles are easy to create.
- **Orchestration**: a saga orchestrator (a service or workflow engine
  such as Temporal or AWS Step Functions) tells each participant what to
  do and tracks state. The flow is explicit in one place, at the cost of
  a component that knows about everyone.

Sagas are **ACD without I**: other transactions can see intermediate
states (stock reserved but payment not yet taken). Countermeasures
include semantic locks (a "PENDING" status), commutative updates, and
ordering steps so the ones most likely to fail, or impossible to undo
(sending an email), run last or are made pivots.

**Transactional outbox.** Instead of "write DB, then publish to Kafka"
(which loses or duplicates events when one side fails), write the event
to an outbox table in the same local transaction. A relay publishes
from the outbox afterwards.

**Change data capture (CDC)** reads the database's own replication log
(PostgreSQL logical decoding, MySQL binlog) and streams every committed
change as an event. Tools like Debezium do this. CDC is often the relay
for an outbox, or used directly to feed caches, search indexes and
warehouses with changes in commit order.
    `.trim(),
    diagram: `
Two-phase commit

 Coordinator             Participant A          Participant B
     │ ── prepare ─────────►  │                      │
     │ ── prepare ────────────┼────────────────────► │
     │ ◄───────────── yes ─── │                      │
     │ ◄──────────────────────┼─────────────── yes ──│
  log "commit"                │                      │
     │ ── commit ──────────►  │                      │
     │ ── commit ─────────────┼────────────────────► │

  If the coordinator dies after the yes votes and before "commit"
  reaches A and B, both are stuck in doubt, holding locks.

Outbox + CDC

  Service ──(one local tx)──► [orders table] + [outbox table]
                                         │ WAL / binlog
                                         ▼
                                    CDC relay ──► Kafka ──► consumers
    `.trim(),
    whyItExists: `
Microservices and partitioned databases split data that one business
operation needs to change together. Without a deliberate strategy you
get charged customers with no order, or orders with no payment. 2PC
gives atomicity when you control all participants and can tolerate
blocking; sagas give a workable model when participants are independent
services; the outbox and CDC make "change data and notify others"
reliable.
    `.trim(),
    whenToUse: `
- **2PC**: a few participants inside one trust and ops boundary, strong
  atomicity required, low contention (e.g. a sharded database committing
  across shards, often handled for you by the database).
- **Sagas**: long-running business processes across services (orders,
  bookings, onboarding) where each step has a sensible undo.
- **Outbox/CDC**: any time a service must update its database and emit
  an event reliably, or feed downstream stores from a source of truth.
    `.trim(),
    whenNotToUse: `
- Don't reach for distributed transactions if you can redraw service
  boundaries so the data that changes together lives in one database.
- Avoid 2PC across services owned by different teams, third-party APIs
  or high-latency links: it couples availability and holds locks.
- Sagas are a poor fit when intermediate states must never be visible,
  or steps can't be undone or compensated (a released wire transfer).
- Don't use the outbox for data that doesn't need guaranteed delivery;
  a fire-and-forget publish may be fine for metrics.
    `.trim(),
    commonMistakes: [
      "Writing to the database and then publishing to a broker as two separate calls (the dual-write problem), so a crash in between loses the event or publishes one for a rolled-back change.",
      "Assuming a compensation is a rollback. It's a new business action (a refund, a cancellation) that others may already have observed, and it can fail too, so it must be retried and idempotent.",
      "Forgetting that sagas lack isolation, so concurrent sagas read each other's half-finished state and produce anomalies like overselling.",
      "Making saga steps or outbox consumers non-idempotent, even though both rely on at-least-once delivery and retries.",
      "Treating 2PC's coordinator as optional infrastructure. If it isn't highly available, its crash blocks every in-doubt transaction and their locks.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain the dual-write problem with a concrete example, and show how an outbox table fixes it." },
      { difficulty: "Medium", prompt: "Design a hotel + flight + car booking saga. List each step's compensation, choose choreography or orchestration, and justify the order of steps." },
      { difficulty: "Hard", prompt: "In 2PC, a participant voted yes and the coordinator crashed. Explain exactly why the participant can't decide alone, what it must keep holding, and how running the coordinator on a consensus group changes the picture." },
    ],
    interviewQuestions: [
      { question: "What problem do distributed transactions solve?", answer: "Keeping changes atomic and consistent when a single logical operation spans multiple databases or services, so you don't end up with some steps applied and others not." },
      { question: "How does two-phase commit work?", answer: "A coordinator asks all participants to prepare; each durably prepares and votes yes or no. If all vote yes, the coordinator logs commit and tells everyone to commit; otherwise it tells everyone to abort." },
      { question: "Why is 2PC called a blocking protocol?", answer: "A participant that voted yes can't decide unilaterally. If the coordinator fails before delivering the decision, the participant stays in doubt, holding locks, until the coordinator recovers." },
      { question: "What is a saga?", answer: "A sequence of local transactions, each with a compensating action. If a step fails, the compensations for completed steps run in reverse order to semantically undo the work." },
      { question: "Choreography vs orchestration for sagas?", answer: "Choreography: services react to each other's events, with no central controller; loosely coupled but the flow is implicit and hard to trace. Orchestration: a central orchestrator commands each step and tracks state; explicit, easier to monitor and change, but adds a coordinating component." },
      { question: "What isolation problems do sagas have and how do you mitigate them?", answer: "Intermediate states are visible to other transactions, causing lost updates, dirty reads or overselling. Mitigations: semantic locks (PENDING status), commutative updates, re-reading values before acting, and ordering steps so non-compensatable steps come last." },
      { question: "What is the transactional outbox pattern?", answer: "Writing an event into an outbox table in the same local transaction as the business change, then having a relay publish outbox rows to a broker. The event exists if and only if the change committed; delivery is at-least-once." },
      { question: "What is change data capture?", answer: "Streaming committed changes from a database's replication log (WAL, binlog) as events, in commit order, without changing application code. Debezium is a common implementation." },
      { question: "Your outbox relay can publish the same event twice. How do you make the system correct?", answer: "Give each event a unique id and make consumers idempotent: record processed ids in the same transaction as their own state change, or use naturally idempotent operations like upserts with version checks." },
      { question: "When would you accept 2PC in a modern design?", answer: "When participants are few, under one operational control, and need atomicity, typically inside a distributed database (e.g. Spanner or CockroachDB committing across ranges) where the coordinator is itself replicated by consensus, so the blocking problem is mitigated." },
    ],
    prerequisites: ["microservices-vs-monolith", "databases", "queues", "idempotency"],
    relatedTopics: ["consensus-and-leader-election", "event-streaming", "idempotency", "message-delivery-semantics", "microservices-vs-monolith", "pub-sub", "stream-and-batch-processing"],
    keywords: ["2PC", "two-phase commit", "XA", "saga", "compensating transaction", "choreography", "orchestration", "transactional outbox", "dual write", "CDC", "change data capture", "Debezium"],
  },
  {
    id: "conflict-resolution-and-crdts",
    title: "Conflict Resolution and CRDTs",
    level: "advanced",
    description: "What happens when two replicas accept different writes to the same data at the same time, and how to merge them safely.",
    explanation: `
In a **single-leader** system, all writes for a key go through one node,
which puts them in order. **Multi-leader** (one leader per region) and
**leaderless** (Dynamo-style: Cassandra, Riak, DynamoDB's ancestor)
systems let several replicas accept writes independently. That keeps
writes fast and available during partitions, but two clients can now
update the same key on different replicas at the same time. Those writes
are **concurrent**: neither one knew about the other.

Someone must decide what the final value is. The options:

- **Last-write-wins (LWW)**: attach a timestamp and keep the highest.
  Simple, but it **silently discards** the other writes, and with
  skewed clocks the "last" write may not even be the latest in real time.
- **Detect and keep siblings**: track causality (with **version vectors**)
  so the database knows two values are concurrent and returns both,
  letting the application merge them.
- **Merge automatically**: use data types whose merge is mathematically
  guaranteed to converge, called **CRDTs** (conflict-free replicated
  data types).

Leaderless systems also need rules for reads and writes across replicas:
**quorums** (R + W > N), plus **read repair** and **hinted handoff** to
bring stragglers back in sync.
    `.trim(),
    analogy:
      "Two siblings edit the same shopping list on paper copies while apart. Last-write-wins means you throw away whichever list was written earlier, losing items. A CRDT shopping list is like each person only ever adding stickers with their initials; merging is just combining all the stickers, and nothing gets lost no matter who merges first.",
    examples: [
      {
        title: "G-counter: a grow-only counter CRDT",
        language: "ts",
        code: `// Each replica only increments its own slot.
type GCounter = Record<string, number>; // replicaId -> count

function increment(counter: GCounter, replicaId: string): GCounter {
  return { ...counter, [replicaId]: (counter[replicaId] ?? 0) + 1 };
}

function value(counter: GCounter): number {
  return Object.values(counter).reduce((sum, count) => sum + count, 0);
}

// Merge takes the max per replica: commutative, associative, idempotent.
function merge(a: GCounter, b: GCounter): GCounter {
  const merged: GCounter = { ...a };
  for (const [replicaId, count] of Object.entries(b)) {
    merged[replicaId] = Math.max(merged[replicaId] ?? 0, count);
  }
  return merged;
}

// Replica A sees 3 likes, replica B sees 2, concurrently:
// a = { A: 3 }, b = { B: 2 }  →  merge = { A: 3, B: 2 }, value = 5
// Merging the same state twice changes nothing.`,
        explanation:
          "Summing raw counts on merge would double-count when states are re-merged; taking the max per replica makes merging safe to repeat. A PN-counter (supports decrement) is two G-counters: increments minus decrements.",
        walkthrough: [
          { code: "type GCounter = Record<string, number>;", explanation: "One count per replica instead of one shared number." },
          { code: "[replicaId]: (counter[replicaId] ?? 0) + 1", explanation: "A replica only ever touches its own entry, so replicas never conflict." },
          { code: "Math.max(merged[replicaId] ?? 0, count)", explanation: "Each entry only grows, so the larger one is always the newer one." },
          { code: "reduce((sum, count) => sum + count, 0)", explanation: "The counter's value is the total across replicas." },
        ],
      },
      {
        title: "Comparing vector clocks",
        language: "ts",
        code: `type VectorClock = Record<string, number>;

function compare(a: VectorClock, b: VectorClock):
  "before" | "after" | "equal" | "concurrent" {
  const replicaIds = new Set([...Object.keys(a), ...Object.keys(b)]);
  let aHasGreater = false;
  let bHasGreater = false;
  for (const id of replicaIds) {
    const countA = a[id] ?? 0;
    const countB = b[id] ?? 0;
    if (countA > countB) aHasGreater = true;
    if (countB > countA) bHasGreater = true;
  }
  if (aHasGreater && bHasGreater) return "concurrent"; // a real conflict
  if (aHasGreater) return "after";
  if (bHasGreater) return "before";
  return "equal";
}

compare({ A: 2, B: 1 }, { A: 1, B: 1 }); // "after": safe to overwrite
compare({ A: 2, B: 0 }, { A: 1, B: 1 }); // "concurrent": keep both`,
        explanation:
          "Unlike a timestamp, a vector clock can tell 'newer' apart from 'happened independently'.",
      },
    ],
    howItWorks: `
**Lamport clocks.** Each node keeps a counter. Increment it on every
local event; send it with every message; on receive, set
counter = max(local, received) + 1. Ties are broken by node id, giving a
**total order consistent with causality**: if A happened before B, then
L(A) < L(B). The converse doesn't hold, so Lamport timestamps can't tell
you whether two events were concurrent.

**Vector clocks / version vectors.** Each node keeps one counter per
node. A version V1 **happened before** V2 if every entry of V1 is ≤ the
matching entry in V2 and at least one is smaller. If neither dominates,
the versions are **concurrent**, which is exactly a conflict. Amazon's
Dynamo paper used vector clocks and returned concurrent siblings to the
client to merge; Riak uses dotted version vectors, a refinement that
avoids sibling explosion.

**Last-write-wins.** Cassandra resolves per column using write
timestamps (highest wins). It's cheap and convergent, but concurrent
writes are dropped, and a node whose clock runs ahead can make its
writes "win" over later ones. Safe only for immutable data or keys
written by one writer at a time.

**CRDTs** come in two flavours. **State-based** CRDTs ship whole states
and merge with a function that is commutative, associative and
idempotent (a join semilattice), so replicas converge regardless of
delivery order or duplication. **Operation-based** CRDTs ship
operations that must commute, and need reliable, causally ordered
delivery. Common types:

- **G-counter / PN-counter**: counters (likes, views).
- **G-set / 2P-set**: add-only set; set with a remove tombstone that
  can't be re-added.
- **OR-set (observed-remove set)**: each add gets a unique tag; a remove
  deletes only the tags it has *observed*. A concurrent add has a new
  tag, so it survives: **add wins**.
- **LWW-register, MV-register (keeps concurrent values), sequence CRDTs**
  for collaborative text (RGA, Yjs and Automerge's data types).

**Quorums in leaderless stores.** Data lives on N replicas. A write
waits for W acknowledgements; a read queries R replicas and takes the
newest version. If **R + W > N**, every read set overlaps every write
set in at least one replica, so a read sees the latest successful write.
With N = 3, W = 2, R = 2 is the classic choice. W = 1/R = 1 maximizes
speed and availability at the cost of stale reads. Even with R + W > N
you don't get linearizability: concurrent writes, writes that failed
on some replicas but succeeded on others, and sloppy quorums all leak
anomalies.

**Read repair.** When a read sees replicas returning different versions,
the coordinator writes the newest version back to the stale ones. It
only fixes keys that get read.

**Anti-entropy.** A background process compares replicas (Cassandra and
Dynamo use **Merkle trees** so they can compare hashes of ranges instead
of every key) and copies missing data, fixing keys that are rarely read.

**Hinted handoff and sloppy quorums.** If a replica for a key is down,
the coordinator writes to another healthy node, along with a **hint**
naming the intended owner. When the owner returns, the hint is replayed
to it. This keeps writes available, but a "quorum" that includes
stand-in nodes no longer guarantees overlap with a later read quorum.
    `.trim(),
    diagram: `
Concurrent writes in a leaderless store (N = 3, W = 2, R = 2)

  Client 1: put(cart, [milk])    → R1 ✓  R2 ✓        version {R1:1}
  Client 2: put(cart, [eggs])    →       R2 ✓  R3 ✓  version {R3:1}
                                   (neither saw the other: concurrent)

  Read with R = 2 hits R1 and R3:
     R1 → [milk]  {R1:1}
     R3 → [eggs]  {R3:1}
     LWW:            keep one by timestamp, lose the other
     Version vector: return both siblings, app merges → [milk, eggs]
     CRDT (OR-set):  merge automatically             → {milk, eggs}

  Read repair then writes the merged value back to stale replicas.
    `.trim(),
    whyItExists: `
Coordinating every write through one leader costs latency (cross-region
round trips) and availability (no writes while the leader is
unreachable). Systems that accept writes anywhere, such as multi-region
databases, offline-first apps and collaborative editors, must handle the
resulting conflicts. Clocks and CRDTs make conflicts detectable or
impossible, and quorum tricks keep replicas converging.
    `.trim(),
    whenToUse: `
- Multi-region active-active writes where local latency matters more than
  global ordering.
- Offline-first and collaborative apps (notes, docs, whiteboards) that
  sync later: CRDTs are the natural fit.
- High-write, availability-first data such as counters, carts, presence,
  feature usage, where merges have obvious meaning.
- Tunable consistency stores (Cassandra, Riak, DynamoDB) where you pick
  R and W per use case.
    `.trim(),
    whenNotToUse: `
- Invariants that need coordination: unique usernames, account balances
  that must never go negative, seat reservations. No merge function can
  enforce "at most one" without coordination; use a single leader or
  consensus for those keys.
- When stale reads are unacceptable and you need linearizability; quorum
  tuning alone doesn't provide it.
- Don't use LWW on data that multiple clients update concurrently unless
  losing writes is acceptable.
    `.trim(),
    commonMistakes: [
      "Using last-write-wins on mutable shared data and not noticing the lost updates, especially with wall-clock timestamps from skewed machines.",
      "Believing R + W > N gives strong consistency. Sloppy quorums, partial write failures and concurrent writes still produce stale or non-linearizable reads.",
      "Writing a 'CRDT' whose merge isn't idempotent (e.g. summing counters on merge), so retries and re-syncs inflate values.",
      "Expecting a CRDT to preserve business invariants. An OR-set converges, but it can't stop two regions from both selling the last item.",
      "Ignoring tombstones and metadata growth: deleted items, version vectors and CRDT tags pile up and need garbage collection.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Given N = 5, list three (R, W) combinations that satisfy R + W > N, and describe the latency and availability trade-off of each." },
      { difficulty: "Medium", prompt: "Implement a PN-counter using two G-counters, with increment, decrement, value and merge. Show that merging in any order gives the same result." },
      { difficulty: "Hard", prompt: "Two replicas of an OR-set start with {apple}. Replica A removes apple while replica B concurrently adds apple again. Walk through the tags each replica holds and show why the merged result contains apple. Then design how you'd garbage-collect the tags." },
    ],
    interviewQuestions: [
      { question: "When do write conflicts happen?", answer: "When more than one replica can accept writes for the same key (multi-leader or leaderless replication) and two writes happen concurrently, meaning neither was aware of the other." },
      { question: "What's wrong with last-write-wins?", answer: "It resolves conflicts by keeping the highest timestamp and silently discarding the rest, so concurrent updates are lost. With wall-clock timestamps, clock skew can also make an older write win." },
      { question: "What is a Lamport clock and what can't it do?", answer: "A logical counter incremented on each event and set to max(local, received) + 1 on receive. It guarantees that causally earlier events get smaller timestamps, but a smaller timestamp doesn't imply causality, so it can't detect concurrency." },
      { question: "How do vector clocks detect concurrency?", answer: "Each version carries a counter per node. If one vector is less than or equal in every entry, it happened before the other. If each is greater in some entry, the versions are concurrent and conflict." },
      { question: "What is a CRDT?", answer: "A replicated data type whose updates or merge function are commutative, associative and idempotent, so replicas that have seen the same updates converge to the same state without coordination." },
      { question: "How does an OR-set decide between a concurrent add and remove?", answer: "Every add creates a unique tag; a remove deletes only the tags it has observed. A concurrent add's tag wasn't observed, so it survives and the element remains: add wins." },
      { question: "What does R + W > N guarantee?", answer: "That every read quorum overlaps every write quorum in at least one replica, so a read can see the most recent successfully acknowledged write. It doesn't guarantee linearizability." },
      { question: "Explain read repair vs anti-entropy.", answer: "Read repair fixes stale replicas when a read notices divergent versions, so it only repairs keys that are read. Anti-entropy is a background comparison (often using Merkle trees) that repairs all data, including cold keys." },
      { question: "What is hinted handoff, and what does it cost?", answer: "When an owner replica is down, another node accepts the write plus a hint and forwards it when the owner recovers. It keeps writes available, but the resulting sloppy quorum may not overlap a later read quorum, so reads can be stale." },
      { question: "A product team wants active-active multi-region inventory with no oversells. How do you approach it?", answer: "Inventory decrements have a global invariant, so pure CRDTs or LWW can't prevent oversells. Options: route each SKU's writes to a home region (single leader per key), use consensus across regions for scarce items, or pre-allocate stock quotas to each region (escrow) so regions decrement locally within their quota and rebalance asynchronously." },
    ],
    prerequisites: ["database-replication", "consistency-models", "cap-theorem"],
    relatedTopics: ["consensus-and-leader-election", "gossip-and-failure-detection", "database-replication", "consistency-models", "consistent-hashing", "multi-region-and-disaster-recovery", "storage-engines"],
    keywords: ["conflict resolution", "last write wins", "LWW", "vector clock", "version vector", "Lamport clock", "CRDT", "G-counter", "PN-counter", "OR-set", "quorum", "R + W > N", "read repair", "anti-entropy", "Merkle tree", "hinted handoff", "sloppy quorum", "Dynamo"],
  },
  {
    id: "gossip-and-failure-detection",
    title: "Gossip and Failure Detection",
    level: "advanced",
    description: "How nodes in a large cluster figure out who is alive and spread information without a central coordinator.",
    explanation: `
In a cluster of hundreds or thousands of nodes, everyone needs a rough
answer to two questions: **who is in the cluster** (membership) and
**who is alive** (failure detection). A central server answering these
becomes a bottleneck and a single point of failure, and having every
node ping every other node costs O(N²) messages.

**Failure detection** is fundamentally uncertain. Over a network you
can't distinguish a crashed node from a slow one or a lost message. A
failure detector is therefore a **guess** that trades two errors:

- **Detection time**: how long a dead node goes unnoticed.
- **False positives**: how often a healthy but slow node is declared dead.

**Gossip** (or epidemic) protocols spread information the way rumours
spread: every node periodically shares what it knows with a few random
peers, who pass it on. Information reaches the whole cluster in about
O(log N) rounds with no central coordinator, and keeps working as nodes
come and go.
    `.trim(),
    analogy:
      "Gossip is office news: you tell two coworkers at the coffee machine, they each tell two more, and by lunch everybody knows, without a company-wide email. Failure detection is noticing a coworker hasn't replied: after five minutes you wonder, after a day you assume they're out, and asking a colleague to check helps you avoid a false alarm.",
    examples: [
      {
        title: "Simple heartbeat timeout detector",
        language: "ts",
        code: `const lastHeartbeatAt = new Map<string, number>(); // nodeId -> ms timestamp
const FAILURE_TIMEOUT_MS = 5_000;

function onHeartbeat(nodeId: string): void {
  lastHeartbeatAt.set(nodeId, Date.now());
}

function suspectedNodes(now = Date.now()): string[] {
  return [...lastHeartbeatAt]
    .filter(([, lastSeen]) => now - lastSeen > FAILURE_TIMEOUT_MS)
    .map(([nodeId]) => nodeId);
}`,
        explanation:
          "A fixed timeout is easy, but it's tuned for one network condition: too short gives false alarms during GC pauses or congestion, too long delays failover.",
        walkthrough: [
          { code: "lastHeartbeatAt.set(nodeId, Date.now());", explanation: "Every heartbeat refreshes when we last heard from that node." },
          { code: "now - lastSeen > FAILURE_TIMEOUT_MS", explanation: "A node is suspected once it's been silent longer than the timeout." },
          { code: "FAILURE_TIMEOUT_MS = 5_000", explanation: "This one number fixes the trade-off between fast detection and false positives." },
        ],
      },
      {
        title: "Phi-accrual detector (idea)",
        language: "ts",
        code: `// Track recent inter-arrival times of heartbeats from one node,
// model them (e.g. as a normal distribution), and compute how surprising
// the current silence is.
function phi(millisSinceLastHeartbeat: number, history: number[]): number {
  const mean = average(history);
  const stdDev = Math.max(standardDeviation(history), MIN_STD_DEV_MS);
  // Probability a heartbeat would arrive even later than this.
  const probabilityLater = 1 - normalCdf(millisSinceLastHeartbeat, mean, stdDev);
  return -Math.log10(probabilityLater);
}

// phi = 1 → ~10% chance we're wrong to suspect it
// phi = 2 → ~1%;  phi = 8 → ~0.000001%
// Cassandra's default conviction threshold (phi_convict_threshold) is 8.
const isSuspected = phi(elapsed, history) > 8;`,
        explanation:
          "Instead of a yes/no timeout, the detector outputs a suspicion level that adapts to how jittery that particular link normally is.",
      },
    ],
    howItWorks: `
**Heartbeats and timeouts.** Each node sends periodic "I'm alive"
messages (push) or is polled (pull). If nothing arrives within a
timeout, it's suspected. Choosing the timeout is the whole game; the
right value depends on network jitter, GC pauses and load.

**Phi-accrual failure detector** (Hayashibara et al., 2004). Rather than
a boolean, it outputs **phi**, a continuously rising suspicion level
computed from the history of heartbeat inter-arrival times:
phi = -log10(probability that the next heartbeat arrives later than
now). Applications pick a threshold. Because it learns the normal
distribution of arrivals, a link that's usually jittery needs a longer
silence before phi gets high. Cassandra and Akka use it.

**Gossip / epidemic dissemination.** Every gossip interval (say, 1 s),
each node picks one or a few random peers and exchanges state:

- **Push**: send my updates. **Pull**: ask for theirs. **Push-pull**
  does both and converges fastest.
- Each piece of state carries a **version** (e.g. a heartbeat counter
  plus a generation number that changes on restart), so newer state
  replaces older and duplicates are harmless.
- Because the number of informed nodes roughly doubles each round,
  an update reaches all N nodes in about O(log N) rounds with high
  probability, and per-node load stays constant as the cluster grows.

Cassandra gossips endpoint state (heartbeat version, status, tokens,
load) this way, feeding the phi detector with the observed heartbeat
version updates.

**SWIM** (Das, Gupta and Motivala, 2002) separates failure detection
from dissemination:

1. Every protocol period, node M pings one random member J.
2. If J doesn't ack in time, M asks **k other members to ping J
   indirectly** (ping-req). If any of them gets an ack, J is fine and the
   problem was likely the path between M and J.
3. Otherwise J is marked **suspect**, not dead. J can refute the
   suspicion by gossiping a higher incarnation number. If it doesn't
   within a timeout, J is declared **dead**.
4. Membership changes (join, suspect, alive, dead) are **piggybacked**
   on the ping and ack messages, so dissemination costs no extra
   messages.

Load per node is constant, and detection time doesn't grow with cluster
size. HashiCorp's memberlist library (used by Consul and Serf) implements
SWIM plus "Lifeguard" extensions that reduce false positives when the
*detecting* node is the one that's slow.

**Membership.** Gossip-based membership is **eventually consistent**:
nodes can briefly disagree about who's in the cluster. That's fine for
routing hints, but decisions that must be unique (who owns a lease, who
is leader) belong in a consensus system.
    `.trim(),
    diagram: `
Gossip spreading (each node tells 1 random peer per round)

  round 0:  ●○○○○○○○○○○○○○○○      1 knows
  round 1:  ●●○○○○○○○○○○○○○○      2
  round 2:  ●●●●○○○○○○○○○○○○      4
  round 3:  ●●●●●●●●○○○○○○○○      8
  round 4:  ●●●●●●●●●●●●●●●○     ~all   (≈ log2 N rounds, plus a tail)

SWIM probe

  M ── ping ──► J          (no ack within timeout)
  M ── ping-req(J) ──► K1 ── ping ──► J
  M ── ping-req(J) ──► K2 ── ping ──► J
     any ack relayed back to M → J alive
     none → J "suspect" → (no refutation) → J "dead", gossiped to all
    `.trim(),
    whyItExists: `
Large clusters can't afford a central membership server or all-to-all
heartbeats. Gossip scales to thousands of nodes, has no single point of
failure, and tolerates message loss by repetition. Adaptive detectors
like phi-accrual and SWIM's indirect probing cut false positives, which
matter because declaring a healthy node dead triggers expensive
rebalancing, failovers and data streaming.
    `.trim(),
    whenToUse: `
- Peer-to-peer databases and caches (Cassandra, ScyllaDB, Riak) for
  membership, ring/token ownership and load info.
- Service meshes and discovery agents (Consul, Serf) to track node
  health across many hosts.
- Spreading low-stakes, eventually consistent metadata: config hints,
  load stats, schema versions.
- Any failure detector that must adapt to variable latency: prefer
  phi-accrual or SWIM-style probing over a fixed timeout.
    `.trim(),
    whenNotToUse: `
- Small clusters (a handful of nodes) where simple heartbeats to a
  coordinator or a load balancer's health checks are enough.
- Decisions requiring agreement: leader election, lock ownership,
  exactly-one assignment. Gossip disseminates; it doesn't agree. Use
  consensus (etcd, ZooKeeper).
- Latency-critical propagation with strict deadlines; gossip converges
  probabilistically, with a tail.
    `.trim(),
    commonMistakes: [
      "Treating a timeout as proof of death. It only means 'not heard from yet', so anything acting on it (failover, lock release) must handle the node coming back.",
      "Using an aggressive fixed timeout, so GC pauses or brief congestion trigger false failovers and rebalancing storms.",
      "Using gossip-based membership to pick a unique leader or owner, then getting two owners while views disagree.",
      "Not versioning gossiped state (heartbeat counters, generation numbers on restart), so stale information overwrites fresh information.",
      "Having every node health-check every other node directly, which is O(N²) traffic and collapses at scale.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain why a node that stops sending heartbeats might still be alive. List three real causes." },
      { difficulty: "Medium", prompt: "In a 1,000-node cluster where each node gossips to 2 random peers per second, roughly how many rounds until a new fact reaches everyone? Explain why per-node load doesn't grow with cluster size." },
      { difficulty: "Hard", prompt: "Compare a fixed-timeout detector, phi-accrual and SWIM on detection time, false-positive rate and network cost. Which would you pick for a 2,000-node cache cluster in a noisy cloud network, and why?" },
    ],
    interviewQuestions: [
      { question: "What does a failure detector do?", answer: "It decides which nodes to suspect have failed, usually from missing heartbeats or probe responses. Because networks are asynchronous, it can only suspect, never know for sure." },
      { question: "What is the core trade-off in choosing a heartbeat timeout?", answer: "Short timeouts detect failures fast but declare healthy, momentarily slow nodes dead (false positives). Long timeouts avoid false alarms but leave real failures unnoticed longer." },
      { question: "What is gossip in distributed systems?", answer: "A protocol where each node periodically exchanges state with a few randomly chosen peers. Information spreads like an epidemic, reaching all nodes in about O(log N) rounds with constant per-node load and no coordinator." },
      { question: "Push vs pull vs push-pull gossip?", answer: "Push sends my state to a peer; pull asks a peer for theirs; push-pull exchanges both ways. Push spreads fast early, pull finishes the last uninformed nodes faster, and push-pull combines both for the quickest convergence." },
      { question: "How does a phi-accrual detector work?", answer: "It records heartbeat inter-arrival times, models their distribution, and computes phi = -log10(probability the next heartbeat arrives later than the current silence). The application suspects a node once phi crosses a threshold, so detection adapts to each link's normal jitter." },
      { question: "What does SWIM add over plain heartbeating?", answer: "Randomized probing with constant per-node load, indirect pings through k other members to rule out a bad link, a suspect state that nodes can refute with incarnation numbers, and membership updates piggybacked on probe messages instead of separate broadcasts." },
      { question: "Why does SWIM use indirect probes?", answer: "A missed ack might be caused by the path between the prober and target, not the target itself. Asking several other members to probe it reduces false positives caused by a single bad link or an overloaded prober." },
      { question: "Why do gossiped records carry version or generation numbers?", answer: "Messages arrive out of order and get repeated. Versions let nodes keep only the newest state; a generation number that changes on restart lets a rebooted node's state supersede its pre-crash entries." },
      { question: "Can you use gossip-based membership to elect a leader?", answer: "Not safely. Gossip views are eventually consistent, so two nodes can simultaneously believe they're the lowest-id live node. Use a consensus system for leader election, and gossip for disseminating hints." },
      { question: "A cluster keeps flapping: nodes are declared dead and rejoin every few minutes during peak load. How do you debug and fix it?", answer: "Correlate flaps with GC pauses, CPU saturation and network drops on both the suspected and the detecting nodes. Fixes: raise the conviction threshold or timeout, use adaptive detection (phi-accrual, SWIM with Lifeguard), send heartbeats on a dedicated, prioritized thread, and add hysteresis so rejoin and rebalancing aren't triggered by a single blip." },
    ],
    prerequisites: ["load-balancing", "consistent-hashing", "cap-theorem"],
    relatedTopics: ["consensus-and-leader-election", "conflict-resolution-and-crdts", "service-discovery", "consistent-hashing", "timeouts-retries-and-backoff", "monitoring-and-observability"],
    keywords: ["gossip protocol", "epidemic protocol", "failure detection", "heartbeat", "timeout", "phi accrual", "SWIM", "membership", "memberlist", "Lifeguard", "incarnation number", "Cassandra gossip"],
  },
  {
    id: "distributed-locks-and-fencing",
    title: "Distributed Locks and Fencing Tokens",
    level: "advanced",
    description: "Making sure only one process at a time does something across many machines, and staying safe when that guarantee breaks.",
    explanation: `
On one machine, a mutex guarantees that only one thread enters a
critical section. Across machines you want the same thing: only one
worker processes a given job, only one node runs the nightly billing
run, only one process writes a given file.

That's much harder in a distributed system, because:

- **The lock holder can die** while holding the lock. So locks must
  expire, usually as **leases** with a time limit.
- **The lock holder can pause** without dying: a long GC pause, a VM
  migration, a swapped-out process. Its lease expires, someone else gets
  the lock, then the first process wakes up and carries on, believing it
  still holds the lock.
- **Clocks and networks lie.** Messages are delayed and clocks drift,
  so "my lease has 2 seconds left" may be false.

So a distributed lock is best treated as an **efficiency** tool (avoid
doing work twice) unless the resource being protected also checks a
**fencing token**: a number that increases every time the lock is
granted, so the resource can reject writes from a holder whose lease
has already been superseded.
    `.trim(),
    analogy:
      "A lease is a meeting-room booking that expires after an hour. If you fall asleep in the room, the booking ends and someone else is given the room. Fencing is the receptionist stamping each booking with an increasing number, and the room's door only opening for the highest number it has seen: when you wake up holding booking #33, the door already saw #34 and stays shut.",
    examples: [
      {
        title: "Single-node Redis lease lock",
        language: "ts",
        code: `// Acquire: set only if absent (NX), with an expiry (PX) so a dead
// holder doesn't block everyone forever. The random value identifies us.
const ownerToken = crypto.randomUUID();
const acquired = await redis.set("lock:invoice-run", ownerToken, {
  NX: true,
  PX: 30_000,
});
if (!acquired) return; // someone else holds it

try {
  await runInvoiceBatch();
} finally {
  // Release only if we still own it. Check-and-delete must be atomic,
  // otherwise we might delete a lock that expired and was re-acquired.
  await redis.eval(
    "if redis.call('get', KEYS[1]) == ARGV[1] then " +
      "return redis.call('del', KEYS[1]) else return 0 end",
    { keys: ["lock:invoice-run"], arguments: [ownerToken] },
  );
}`,
        explanation:
          "Fine for avoiding duplicate work. It's not safe for correctness: if runInvoiceBatch takes longer than 30 s (or the process pauses), a second worker can get the lock while the first is still running.",
        walkthrough: [
          { code: "crypto.randomUUID()", explanation: "A unique value proves which client owns the lock when releasing it." },
          { code: "NX: true, PX: 30_000", explanation: "Only set the key if it doesn't exist, and expire it after 30 seconds." },
          { code: "if (!acquired) return;", explanation: "Another worker holds the lock, so skip the work." },
          { code: "redis.eval(\"if redis.call('get'...\")", explanation: "Deletes the key only if it still holds our value, in one atomic step." },
        ],
      },
      {
        title: "Fencing tokens at the storage layer",
        language: "ts",
        code: `// The lock service returns a monotonically increasing token with each grant
// (e.g. ZooKeeper zxid / znode version, etcd revision).
const { token } = await lockService.acquire("report-file");

await storage.write("report.csv", data, { fencingToken: token });

// Inside the storage service:
let highestTokenSeen = 0;

function write(path: string, data: Buffer, fencingToken: number): void {
  if (fencingToken < highestTokenSeen) {
    throw new AppError("STALE_LOCK", "Write rejected: lock was superseded");
  }
  highestTokenSeen = fencingToken;
  persist(path, data);
}`,
        explanation:
          "A paused client with token 33 is rejected once a newer holder has written with token 34, no matter what the client believes about its lease. (In a real store, highestTokenSeen is persisted per resource and checked atomically with the write.)",
      },
    ],
    howItWorks: `
**Lease-based locks.** The lock service grants a lock with a **TTL**.
The holder must finish, or renew, before the TTL runs out. If it
crashes, the lease expires and the lock frees itself. The danger is the
holder that's *alive but late*: a stop-the-world GC pause or a slow
network can stretch past the TTL without the holder knowing.

**Redis locks.** A single Redis instance with SET key value NX PX ttl
and an atomic compare-and-delete release is a reasonable lock for
efficiency. Its weaknesses: if that Redis fails over to a replica that
hadn't received the key (replication is asynchronous), two clients can
hold the lock.

**Redlock** (proposed by Redis's author) acquires the lock on a majority
of N independent Redis masters (typically 5) within a time budget, and
treats the remaining validity as TTL minus the time spent acquiring.
Martin Kleppmann's 2016 critique, "How to do distributed locking",
argued that:

- It depends on timing assumptions (bounded network delay, bounded
  process pauses, clocks that don't jump), which real systems violate.
- It produces no fencing token, so a paused client can still corrupt
  the resource after its lease expired.
- So it's heavier than needed for efficiency, and not safe enough for
  correctness.

Redis's author published a rebuttal; the debate is a good illustration
that the hard part is the **resource's** protection, not lock acquisition.

**Fencing tokens.** Every successful acquisition returns a number
strictly greater than any previous one. The client passes it with every
operation on the protected resource, and the resource **rejects any
token lower than the highest it has seen**. Safety no longer depends on
timing; it only requires the resource to be able to check the token
(a conditional write, a version column, a compare-and-set).

**ZooKeeper locks.** Clients create an **ephemeral sequential** znode
under a lock path (e.g. /locks/job-0000000042). Ephemeral nodes vanish
when the client's session ends, so crashes release the lock. The client
with the lowest sequence number holds the lock; each other client
watches only the node immediately before its own, avoiding a thundering
herd when the lock is released. The zxid or the sequence number can act
as a fencing token. ZooKeeper's session timeout still means a paused
client can lose its lock without noticing, which is why fencing matters.

**etcd locks.** Clients attach keys to a **lease** that they keep alive.
The etcd concurrency API creates a key per contender and grants the
lock to the one with the lowest creation revision. Every key carries a
**revision** (create_revision, mod_revision) that increases cluster-wide
and works as a fencing token. Because etcd and ZooKeeper run on
consensus, their lock state survives node failures without split
grants, unlike asynchronously replicated Redis.
    `.trim(),
    diagram: `
Why leases alone are unsafe

 Client 1   ──acquire(lease 30s)──►┐
            write ✓                │ lock service
            [ GC pause 40s ......] │
                                   │ lease expires
 Client 2   ──acquire ────────────►│ granted
            write ✓
 Client 1   (wakes) write ✓  ← corrupts data: thinks it still holds the lock

With fencing tokens

 Client 1   acquire → token 33,  write(33) ✓
            [ GC pause ]
 Client 2   acquire → token 34,  write(34) ✓   storage: highest = 34
 Client 1   write(33) ✗ rejected (33 < 34)
    `.trim(),
    whyItExists: `
Leader-only jobs, exclusive access to external resources and
"process each thing once" all need mutual exclusion across machines.
Naive locks either deadlock when holders die or let two holders overlap
when holders pause. Leases solve the first problem; fencing tokens solve
the second by moving the final safety check to the resource itself.
    `.trim(),
    whenToUse: `
- **Efficiency locks** (avoid duplicate work, where an occasional
  double run is harmless): a single Redis instance with TTL is fine.
- **Correctness locks** (double execution corrupts data or moves money):
  use a consensus-backed service (etcd, ZooKeeper, Consul) **and** have
  the protected resource enforce fencing tokens.
- Leader election for singleton workers (schedulers, compaction jobs),
  usually via the same lease mechanism.
    `.trim(),
    whenNotToUse: `
- If the database can enforce the invariant itself, prefer that: unique
  constraints, conditional updates (UPDATE ... WHERE version = ?),
  SELECT ... FOR UPDATE, or idempotency keys.
- When work can be partitioned so each item has exactly one owner
  (Kafka partitions, consistent hashing), you often don't need a lock at
  all.
- Don't use Redlock for correctness-critical mutual exclusion; it has
  neither consensus-backed state nor fencing.
- Avoid locks on hot paths with high contention: they serialize work
  and add round trips.
    `.trim(),
    commonMistakes: [
      "Releasing a lock with a plain DEL, which can delete a lock that already expired and was acquired by someone else. Release must check ownership atomically.",
      "Assuming a lease means mutual exclusion. Process pauses and clock jumps let two holders overlap, so correctness needs fencing at the resource.",
      "Setting no TTL, so a crashed holder blocks everyone forever, or a TTL shorter than the work's realistic worst case without renewal.",
      "Renewing a lease from a background timer without checking it succeeded, then carrying on after the renewal silently failed.",
      "Using a lock where an idempotent or conditional write would have enforced the same rule more simply and safely.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain why a distributed lock needs an expiry, and what goes wrong if the expiry is too short or too long." },
      { difficulty: "Medium", prompt: "Write the release logic for a Redis lock so that a client can never delete a lock it doesn't own. Explain why the check and delete must be atomic." },
      { difficulty: "Hard", prompt: "A cron-like scheduler runs on 3 nodes and must send each customer's monthly invoice exactly once. Design it with etcd: leader election, fencing, and what the invoicing database must check. Describe what happens if the leader pauses for 60 seconds mid-run." },
    ],
    interviewQuestions: [
      { question: "Why is a distributed lock harder than a local mutex?", answer: "The holder can crash or pause without the others knowing, messages and clocks are unreliable, and the lock service itself can fail. You need expiry to survive crashes, which then allows overlapping holders when a holder is merely slow." },
      { question: "What is a lease?", answer: "A lock granted for a limited time. The holder must finish or renew before it expires; if the holder crashes, the lock becomes available again automatically." },
      { question: "How do you safely release a Redis lock?", answer: "Store a unique random value when acquiring, and release with an atomic script that deletes the key only if its value still matches. A plain DEL could remove a lock now owned by someone else." },
      { question: "Why isn't a single Redis instance with replication safe for correctness locks?", answer: "Replication is asynchronous. If the primary fails after granting a lock but before replicating it, the promoted replica doesn't know about it and can grant the same lock to another client." },
      { question: "What is Redlock and what's the main criticism?", answer: "Acquiring a lock on a majority of independent Redis masters within a time budget. Kleppmann argued its safety depends on bounded pauses, network delays and clock drift, and it issues no fencing token, so a paused client can still act after its lock expired." },
      { question: "What is a fencing token?", answer: "A strictly increasing number issued with each lock grant. The client sends it with every operation, and the protected resource rejects tokens lower than the highest it has seen, so a stale lock holder can't do damage." },
      { question: "How do you implement a lock in ZooKeeper?", answer: "Create an ephemeral sequential znode under a lock path. The lowest sequence number holds the lock; each other client watches only its predecessor. The ephemeral node disappears when the session dies, releasing the lock." },
      { question: "What can serve as a fencing token in etcd?", answer: "The key's revision numbers (e.g. create_revision or mod_revision), which increase monotonically across the cluster, so a newer lock holder always has a larger revision." },
      { question: "When should you avoid a distributed lock entirely?", answer: "When the storage can enforce the rule (unique constraints, conditional writes, compare-and-set, idempotency keys) or when you can partition work so each item has a single owner. Both avoid the timing hazards of locks." },
      { question: "Your external resource (e.g. a third-party API) can't check fencing tokens. How do you stay safe?", answer: "You can't get strict mutual exclusion from the lock alone. Make the operation idempotent with a deterministic idempotency key, check the lease's remaining time before each side effect and abort if it's short, keep critical sections short, and reconcile afterwards to detect and fix duplicates." },
    ],
    prerequisites: ["consistency-models", "idempotency", "caching"],
    relatedTopics: ["consensus-and-leader-election", "gossip-and-failure-detection", "idempotency", "timeouts-retries-and-backoff", "distributed-transactions", "hot-keys-and-thundering-herd"],
    keywords: ["distributed lock", "lease", "TTL", "Redis lock", "SET NX PX", "Redlock", "Kleppmann", "fencing token", "ZooKeeper", "ephemeral sequential znode", "etcd lease", "revision", "mutual exclusion", "GC pause"],
  },
  {
    id: "storage-engines",
    title: "Storage Engines: B-Trees vs LSM-Trees",
    level: "advanced",
    description: "How databases actually lay data out on disk, and why that choice decides whether they're better at reads or writes.",
    explanation: `
Under every database's query layer sits a **storage engine**: the code
that decides how bytes are arranged on disk, how a key is found, and
how data survives a crash. Two designs dominate:

- **B-trees** keep data in fixed-size **pages** arranged as a balanced
  tree and **update pages in place**. Reads are fast and predictable.
  This is the classic relational database design.
- **LSM-trees** (log-structured merge-trees) never modify files in
  place. Writes go to memory, then are flushed as **immutable sorted
  files** that are merged in the background. Writes are fast and
  sequential; reads may have to check several files.

Both rely on a **write-ahead log (WAL)**: before changing data
structures, append the change to a sequential log and flush it to disk.
After a crash, replaying the log restores everything that was
acknowledged.

Choosing between them is mostly about three costs, the
**amplification factors**: how many bytes are written to disk per byte
the application writes (**write amplification**), how much work a read
does (**read amplification**), and how much disk is used compared to
the live data (**space amplification**). No engine minimizes all three.
    `.trim(),
    analogy:
      "A B-tree is a well-organized filing cabinet: to change a document you find its folder and edit it in place, so finding things is quick, but every edit means walking to the right drawer. An LSM-tree is an in-tray: you drop new notes on top instantly and once in a while sort the pile into the cabinet. Writing is effortless, but to find something you may have to check the tray and several sorted stacks.",
    examples: [
      {
        title: "A toy LSM-tree write and read path",
        language: "ts",
        code: `class TinyLsm {
  private memtable = new Map<string, string | null>(); // null = tombstone
  private sstables: Map<string, string | null>[] = []; // newest first, immutable
  private readonly memtableLimit = 1_000;

  put(key: string, value: string | null): void {
    wal.append(key, value);            // 1. durable first (sequential write)
    this.memtable.set(key, value);     // 2. then in memory
    if (this.memtable.size >= this.memtableLimit) this.flush();
  }

  delete(key: string): void {
    this.put(key, null); // deletes are writes too: a tombstone
  }

  get(key: string): string | undefined {
    if (this.memtable.has(key)) return this.memtable.get(key) ?? undefined;
    for (const table of this.sstables) {           // newest to oldest
      // Real engines skip most tables via per-table Bloom filters.
      if (table.has(key)) return table.get(key) ?? undefined;
    }
    return undefined;
  }

  private flush(): void {
    const sorted = new Map([...this.memtable].sort(([a], [b]) => a.localeCompare(b)));
    this.sstables.unshift(sorted);     // written once, never modified
    this.memtable = new Map();
    wal.truncate();                    // flushed data no longer needs the log
  }
}`,
        explanation:
          "Real engines keep the memtable as a sorted structure (often a skip list), store SSTables on disk with a sparse index, and compact them in the background.",
        walkthrough: [
          { code: "wal.append(key, value);", explanation: "Durability: the change is on disk before we acknowledge it." },
          { code: "this.memtable.set(key, value);", explanation: "The write itself is just an in-memory update, which is why LSM writes are fast." },
          { code: "this.put(key, null);", explanation: "Deleting writes a tombstone that hides older values until compaction removes both." },
          { code: "for (const table of this.sstables)", explanation: "A read may check several files, newest first. That's read amplification." },
          { code: "this.sstables.unshift(sorted);", explanation: "Flushing produces a new immutable sorted file instead of editing old ones." },
        ],
      },
      {
        title: "Where amplification comes from",
        language: "text",
        code: `B-tree, update one 100-byte row:
  WAL record (~100+ bytes) + rewrite the whole page (e.g. 8 KB in PostgreSQL,
  16 KB in InnoDB) when it's flushed
  → high write amplification for small random updates
  → reads: ~tree height page lookups (3–4 for huge tables, mostly cached)

LSM-tree, same update:
  WAL record + memtable, later written to an SSTable at flush,
  then rewritten again each time compaction merges it into a lower level
  → total write amplification depends on compaction strategy
  → reads: memtable + possibly one SSTable per level (Bloom filters help)
  → space: old versions and tombstones linger until compacted`,
        explanation:
          "Amplification numbers depend heavily on configuration and workload; benchmark your own access pattern rather than relying on rules of thumb.",
      },
    ],
    howItWorks: `
**Write-ahead log.** Every change is appended to the WAL and fsynced
before it's acknowledged. Sequential appends are cheap even on spinning
disks. On restart, the engine replays the log from the last checkpoint.
The WAL also feeds replication and CDC in many databases (PostgreSQL's
WAL, MySQL's binlog is a separate logical log).

**B-trees.**
- Data lives in fixed-size pages. Interior pages hold keys and pointers
  to child pages; leaf pages hold rows (or pointers to them). The tree
  stays balanced, so lookups touch O(log n) pages, typically 3–4 levels
  even for very large tables, with upper levels cached in memory.
- Updates modify the leaf page in place. If a page is full it **splits**,
  and the split propagates upward as needed.
- Page writes aren't atomic at the disk level, so engines use the WAL
  plus mechanisms like full-page writes (PostgreSQL) or a doublewrite
  buffer (InnoDB) to recover torn pages.
- Pages gain free space as rows are deleted or moved, so B-trees carry
  some fragmentation.

**LSM-trees.**
- **Memtable**: an in-memory sorted structure (e.g. a skip list)
  receiving writes after the WAL.
- **Flush**: when the memtable fills, it's written to disk as an
  **SSTable** (sorted string table): an immutable file of sorted
  key-value pairs with a sparse index and usually a **Bloom filter**.
- **Reads**: check the memtable, then SSTables from newest to oldest.
  Bloom filters let most SSTables be skipped for keys they don't contain.
- **Deletes** write **tombstones**, which shadow older values until
  compaction drops both.
- **Compaction** merges SSTables, keeping only the newest version of each
  key, to bound read cost and reclaim space:
  - **Size-tiered** (Cassandra's default): merge several similar-sized
    tables into a bigger one. Lower write amplification, but higher
    space amplification and temporary space spikes.
  - **Leveled** (LevelDB, RocksDB's default): levels of non-overlapping
    key ranges, each roughly 10x bigger than the last. Lower read and
    space amplification, higher write amplification.

**The trade-off (the RUM conjecture).** You can optimize two of Read,
Update and Memory/space overhead, not all three. B-trees favour reads
and point updates with predictable latency. LSM-trees favour write
throughput and compression (immutable files compress well), at the
cost of compaction I/O that can cause latency spikes if it falls behind.

**Who uses what.**
- **B-tree**: PostgreSQL, MySQL InnoDB, SQL Server, Oracle, SQLite,
  MongoDB's WiredTiger (B-tree by default).
- **LSM**: LevelDB, RocksDB, Cassandra, ScyllaDB, HBase, Bigtable,
  CockroachDB (Pebble), TiKV (RocksDB), MyRocks (MySQL on RocksDB).
    `.trim(),
    diagram: `
B-tree (update in place)                LSM-tree (append, then merge)

         [ 30 | 60 ]                   write → WAL (append)
        /     |     \                        → memtable (sorted, in RAM)
  [10|20] [40|50] [70|80]                         │ full → flush
     leaf pages edited                            ▼
     in place, split when full          L0: [SST][SST][SST]   (may overlap)
                                                  │ compaction
                                        L1: [SST a–f][SST g–p][SST q–z]
                                                  │ compaction
                                        L2: [  ~10x larger, sorted runs  ]

  read: walk root → leaf               read: memtable → L0 → L1 → L2 …
        (3–4 pages)                          (Bloom filters skip most files)
    `.trim(),
    whyItExists: `
Disks (and SSDs) are far faster at sequential I/O than small random
writes, and memory is much faster than either. B-trees optimize for
finding any key in a few page reads; LSM-trees turn random writes into
sequential ones to sustain very high ingest. Knowing which engine sits
under a database explains its strengths, its tuning knobs and its
failure modes, like compaction storms or page bloat.
    `.trim(),
    whenToUse: `
- **B-tree engines** for read-heavy or mixed OLTP workloads, range scans
  with predictable latency, and transactional systems with lots of
  in-place updates.
- **LSM engines** for write-heavy workloads: event logs, time series,
  metrics, messaging, IoT ingest, large key-value stores, and when
  compression and SSD wear matter.
- Use the amplification lens when tuning: compaction strategy, page or
  block size, Bloom filter bits per key, cache size.
    `.trim(),
    whenNotToUse: `
- Don't pick an LSM store for read-latency-critical point lookups on
  data that's updated constantly unless you've sized compaction and
  caches; read amplification and compaction stalls show up at p99.
- Don't pick a B-tree store for firehose ingest of append-only data;
  random page writes and page splits limit throughput.
- For analytical scans over a few columns of huge tables, neither
  row-oriented engine is ideal: use a columnar store.
    `.trim(),
    commonMistakes: [
      "Assuming LSM databases are 'faster' in general. They're faster at writes; reads and space use depend on compaction keeping up.",
      "Deleting lots of data in an LSM store and expecting space back immediately. Tombstones take space and slow reads until compaction (and, in Cassandra, gc_grace_seconds) removes them.",
      "Ignoring write amplification on SSDs, which drives throughput limits and device wear for both B-trees (full-page writes) and leveled LSM compaction.",
      "Disabling fsync on the WAL for speed without realizing acknowledged writes can now be lost on power failure.",
      "Using random UUIDv4 primary keys in a clustered B-tree index, spreading inserts across all pages and causing page splits and cache misses; time-ordered ids insert near the right edge.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain what a write-ahead log is and why a database writes to it before changing its data files." },
      { difficulty: "Medium", prompt: "Trace a read for a key that was written, then updated, then deleted in an LSM-tree, where each change landed in a different SSTable. What does the read return and why? When does the data finally leave the disk?" },
      { difficulty: "Hard", prompt: "You're storing 200k writes/s of sensor readings with rare reads by (sensor, time range). Compare a B-tree store and an LSM store with size-tiered vs leveled compaction on write, read and space amplification, and recommend one with tuning choices." },
    ],
    interviewQuestions: [
      { question: "What is a write-ahead log?", answer: "An append-only file where every change is recorded and flushed before it's applied to the main data structures, so the database can replay it after a crash to recover acknowledged writes." },
      { question: "How does a B-tree handle an insert into a full page?", answer: "It splits the page into two half-full pages and inserts a new separator key into the parent, which may itself split, propagating up to the root and occasionally increasing the tree's height." },
      { question: "Describe the LSM-tree write path.", answer: "Append to the WAL, insert into the in-memory sorted memtable, and acknowledge. When the memtable fills, it's flushed as an immutable sorted SSTable; background compaction later merges SSTables." },
      { question: "How does an LSM-tree serve a read efficiently?", answer: "It checks the memtable, then SSTables from newest to oldest, stopping at the first hit. Per-SSTable Bloom filters skip files that definitely don't have the key, and sparse indexes find the right block within a file." },
      { question: "Define write, read and space amplification.", answer: "Write amplification: bytes written to storage per byte written by the application. Read amplification: storage reads per logical read. Space amplification: disk space used relative to the size of the live data." },
      { question: "Size-tiered vs leveled compaction?", answer: "Size-tiered merges similarly sized SSTables: low write amplification, but high space amplification and more files to check on reads. Leveled keeps non-overlapping files per level with ~10x growth: lower read and space amplification, higher write amplification." },
      { question: "How are deletes handled in an LSM-tree?", answer: "By writing a tombstone that shadows older versions. Compaction eventually removes the tombstone and the data it covers, once it's safe (e.g. after all replicas have seen it, in Cassandra's case gc_grace_seconds)." },
      { question: "Name databases using each engine type.", answer: "B-tree: PostgreSQL, MySQL InnoDB, SQL Server, Oracle, SQLite, MongoDB WiredTiger. LSM: RocksDB, LevelDB, Cassandra, ScyllaDB, HBase, Bigtable, CockroachDB's Pebble, TiKV." },
      { question: "Why do B-trees tend to have more predictable read latency than LSM-trees?", answer: "A key lives in exactly one place reached by a fixed number of page reads. In an LSM-tree, a read may check several levels, and background compaction competes for I/O, which shows up as tail-latency spikes." },
      { question: "Your Cassandra cluster's read latency degrades over weeks on a delete-heavy table. What's happening and what do you do?", answer: "Tombstones are accumulating, so reads scan many shadowed entries, and possibly compaction is falling behind. Inspect SSTable counts and tombstone warnings; consider a data model that avoids range deletes (e.g. time-bucketed partitions with TTLs and time-window compaction), tune gc_grace_seconds alongside repair schedules, and ensure compaction throughput is sufficient." },
    ],
    prerequisites: ["databases", "sql-vs-nosql", "database-replication"],
    relatedTopics: ["bloom-filters-and-probabilistic-structures", "database-replication", "sharding", "event-streaming", "data-warehouses-and-olap", "conflict-resolution-and-crdts"],
    keywords: ["storage engine", "write-ahead log", "WAL", "B-tree", "B+ tree", "LSM-tree", "memtable", "SSTable", "compaction", "size-tiered", "leveled", "tombstone", "write amplification", "read amplification", "space amplification", "RocksDB", "InnoDB"],
  },
  {
    id: "event-streaming",
    title: "Event Streaming and Log-Based Brokers",
    level: "advanced",
    description: "Kafka-style brokers that store events in an ordered, replayable log instead of deleting them once delivered.",
    explanation: `
A traditional message queue (RabbitMQ, SQS) works like a to-do list:
a consumer takes a message, processes it, acknowledges it, and the
broker **deletes** it. Once handled, it's gone.

A **log-based broker** such as **Apache Kafka** (also Pulsar, Redpanda,
Amazon Kinesis) works like an append-only ledger. Producers **append**
events to the end of a log; the broker **keeps** them for a retention
period; each consumer tracks its own position (**offset**) and reads
forward. Reading doesn't delete anything, so:

- Many independent consumers can read the same events at their own
  pace (analytics, search indexing, notifications).
- A consumer can **rewind** and replay history, e.g. to rebuild a
  database after fixing a bug.
- Events within one partition keep a strict **order**.

The core concepts are **topics** (named streams), **partitions** (the
unit of ordering and parallelism), **offsets** (positions in a
partition), **consumer groups** (how consumers share work), and
**retention** (how long events are kept).
    `.trim(),
    analogy:
      "A queue is a stack of letters on a desk: whoever picks one up deals with it and throws it away. A log is a newspaper archive: each day's edition is added to the end, nobody removes it, and every reader keeps their own bookmark. A new reader can even start from last month's edition.",
    examples: [
      {
        title: "Producer with a key, consumer in a group (kafkajs-style)",
        language: "ts",
        code: `// Producer: same key → same partition → per-key ordering.
await producer.send({
  topic: "orders",
  messages: [{ key: order.customerId, value: JSON.stringify(order) }],
});

// Consumer: every instance with groupId "billing" shares the partitions.
const consumer = kafka.consumer({ groupId: "billing" });
await consumer.subscribe({ topics: ["orders"], fromBeginning: false });

await consumer.run({
  autoCommit: false,
  eachMessage: async ({ topic, partition, message }) => {
    await chargeOrderIdempotently(JSON.parse(message.value!.toString()));
    // Commit AFTER processing: a crash before this line means the message
    // is redelivered (at-least-once), never skipped.
    await consumer.commitOffsets([
      { topic, partition, offset: (BigInt(message.offset) + 1n).toString() },
    ]);
  },
});`,
        explanation:
          "The committed offset is the next one to read, hence +1. Committing per message is shown for clarity; real consumers usually commit in batches.",
        walkthrough: [
          { code: "key: order.customerId", explanation: "The key is hashed to choose a partition, so all of one customer's orders stay in order." },
          { code: "groupId: \"billing\"", explanation: "Consumers sharing a group split the topic's partitions among themselves." },
          { code: "await chargeOrderIdempotently(...)", explanation: "Processing must tolerate redelivery, because at-least-once is the default." },
          { code: "consumer.commitOffsets(...)", explanation: "Records progress so a restarted consumer resumes after this message." },
        ],
      },
      {
        title: "Compacted topic as a changelog",
        language: "text",
        code: `Topic: user-profiles  (cleanup.policy=compact)

Before compaction (offset: key=value)
  0: u1={name:"Ana"}
  1: u2={name:"Bo"}
  2: u1={name:"Ana P."}
  3: u3={name:"Cy"}
  4: u2=null               ← tombstone: delete u2

After compaction (latest value per key; tombstones removed later)
  2: u1={name:"Ana P."}
  3: u3={name:"Cy"}

A new service can read this topic from offset 0 to build a full,
current snapshot of profiles, then keep consuming live updates.`,
        explanation:
          "Offsets never change; compaction only removes records that a newer record with the same key has superseded.",
      },
    ],
    howItWorks: `
**Topics and partitions.** A topic is split into **partitions**, each an
ordered, append-only sequence of records stored as segment files on a
broker. Producers choose a partition by hashing the record's **key**
(Kafka's default partitioner uses murmur2), so records with the same key
land in the same partition. Without a key, records are spread across
partitions.

**Offsets.** Each record in a partition gets a sequential **offset**.
Ordering is guaranteed **only within a partition**, not across a whole
topic. If you need all events of an entity in order, give them the same
key.

**Consumer groups.** Consumers with the same group id divide the
partitions: each partition is read by **at most one consumer in the
group** at a time. So a group's parallelism is capped at the number of
partitions; extra consumers sit idle. Different groups each get every
record independently. When consumers join or leave, the group
**rebalances** partitions. Groups store their progress as committed
offsets (in Kafka, an internal compacted topic).

**Replication.** Each partition has one **leader** and follower replicas
on other brokers. Followers that are caught up form the **in-sync
replica set (ISR)**. With **acks=all** and **min.insync.replicas=2**
(replication factor 3), a write is acknowledged only after enough
replicas have it, so losing one broker loses no acknowledged data.

**Retention.** Kafka keeps records by time (log.retention.hours defaults
to 168, i.e. 7 days) or size, regardless of whether anyone consumed them.
**Compacted topics** instead keep at least the latest record per key,
making a topic a durable changelog or table snapshot. A null value is a
**tombstone** that deletes the key after compaction.

**Delivery semantics.** Committing offsets after processing gives
at-least-once; before processing gives at-most-once. Kafka's
**idempotent producer** removes duplicates caused by producer retries,
and **transactions** let a consume-transform-produce app atomically
write output records and its input offsets, giving exactly-once within
Kafka. Side effects outside Kafka still need idempotency.

**Log vs traditional queue.**

| | Log (Kafka) | Queue (RabbitMQ, SQS) |
|---|---|---|
| After consume | Kept until retention | Deleted after ack |
| Ordering | Per partition | Per queue (weakened by redelivery and parallel consumers) |
| Parallelism | Up to #partitions per group | Add consumers freely |
| Replay | Yes, seek to any offset | No (once acked, gone) |
| Slow message | Blocks its partition (head-of-line) | Others proceed; per-message ack, retry, DLQ |
| Best for | Event streams, CDC, fan-out, high throughput | Task/job distribution, per-message routing |
    `.trim(),
    diagram: `
Topic "orders", 3 partitions, two consumer groups

  P0: [0][1][2][3][4][5]          group "billing"     group "analytics"
  P1: [0][1][2][3]                  consumer A ← P0     consumer X ← P0,P1,P2
  P2: [0][1][2][3][4]               consumer B ← P1
            ▲                       consumer C ← P2
     producers append to the end   (a 4th billing consumer would be idle)

  Each group tracks its own committed offset per partition:
     billing:   P0=4  P1=3  P2=5
     analytics: P0=1  P1=0  P2=2   ← lagging, but nothing is lost
    `.trim(),
    whyItExists: `
Modern systems need the same events in many places: databases, caches,
search indexes, warehouses, ML features, notifications. A durable,
ordered, replayable log decouples producers from any number of
consumers, absorbs bursts, lets new consumers backfill from history, and
turns "what happened" into a source of truth that derived data can be
rebuilt from. Partitioning makes it scale horizontally to millions of
events per second.
    `.trim(),
    whenToUse: `
- Event-driven architectures where several services react to the same
  events.
- Change data capture pipelines and keeping derived stores (search,
  caches, warehouse) in sync.
- High-throughput ingest: clickstreams, logs, metrics, IoT.
- Stream processing (Kafka Streams, Flink) and event sourcing, where
  replay and ordering per entity matter.
    `.trim(),
    whenNotToUse: `
- Simple background job queues with per-message retries, delays,
  priorities or dead-lettering: a traditional queue (SQS, RabbitMQ) is
  simpler and doesn't block on one slow message.
- Request/response interactions that need an immediate answer.
- Small systems where running and tuning a Kafka cluster outweighs the
  benefit; a managed queue or pub/sub service may be enough.
- When you need global ordering across all events at high throughput;
  a single partition gives order but no parallelism.
    `.trim(),
    commonMistakes: [
      "Expecting ordering across a whole topic. Kafka orders only within a partition, so related events must share a key.",
      "Adding more consumers than partitions and expecting more throughput; the extras sit idle. Plan partition counts for future parallelism.",
      "Committing offsets before processing (or with auto-commit), so a crash silently skips messages; or committing after but processing non-idempotently, so redeliveries double-apply.",
      "Increasing a topic's partition count later without realizing it changes which partition each key maps to, breaking per-key ordering for in-flight data.",
      "Using a skewed key (e.g. one huge tenant) so one partition becomes a hot spot while others are idle.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain the difference between a topic, a partition and an offset, using a 'payments' topic as an example." },
      { difficulty: "Medium", prompt: "A topic has 6 partitions and a consumer group has 4 consumers. How are partitions assigned? What happens when one consumer crashes, and when you scale to 8 consumers?" },
      { difficulty: "Hard", prompt: "Design a pipeline that keeps a search index in sync with a PostgreSQL orders table using CDC and Kafka. Address ordering per order, schema changes, reprocessing after an indexing bug, and how you'd handle duplicates." },
    ],
    interviewQuestions: [
      { question: "How does a log-based broker differ from a traditional queue?", answer: "A log appends records and retains them for a configured period regardless of consumption; consumers track their own offsets and can replay. A traditional queue deletes each message once a consumer acknowledges it." },
      { question: "What is a partition and why does it matter?", answer: "An ordered, append-only shard of a topic. It's the unit of ordering (order is guaranteed only within a partition), of parallelism (one consumer per partition per group) and of distribution across brokers." },
      { question: "How do keys affect partitioning?", answer: "The producer hashes the key to pick a partition, so all records with the same key go to the same partition and stay in order. Records without keys are spread across partitions." },
      { question: "What is a consumer group?", answer: "A set of consumers sharing a group id that divide a topic's partitions among themselves, each partition read by exactly one member. Different groups consume independently, each receiving every record." },
      { question: "What happens during a consumer group rebalance?", answer: "Partitions are reassigned among the current members after a join, leave or failure. Consumers must commit progress before losing partitions; otherwise the new owner reprocesses from the last committed offset." },
      { question: "What is a compacted topic?", answer: "A topic whose cleanup keeps at least the latest record for each key and discards superseded ones. It acts as a durable changelog from which you can rebuild current state; a null-valued record is a tombstone that deletes the key." },
      { question: "How does Kafka avoid losing acknowledged writes?", answer: "Each partition is replicated; with acks=all the leader acknowledges only once all in-sync replicas have the record, and min.insync.replicas sets how many must be in sync for writes to be accepted at all." },
      { question: "Can Kafka provide exactly-once processing?", answer: "Within Kafka, yes: the idempotent producer removes retry duplicates and transactions atomically commit output records together with consumer offsets. Effects on external systems still need idempotency or transactional sinks." },
      { question: "When would you choose SQS or RabbitMQ over Kafka?", answer: "For job or task distribution where each message is handled independently and needs per-message ack, retries, delays, priorities or dead-letter queues, and where you don't need replay or strict per-key ordering. A slow message doesn't block others." },
      { question: "One partition's consumer lag keeps growing while others are fine. What could cause it and how do you fix it?", answer: "A hot key funnelling disproportionate traffic to one partition, or a 'poison' record that the consumer keeps failing on. Fix skew by salting or re-keying (if per-key ordering allows) or giving the hot entity a dedicated topic; for poison records, route failures to a dead-letter topic after bounded retries so the partition keeps moving." },
    ],
    prerequisites: ["queues", "pub-sub", "sharding"],
    relatedTopics: ["stream-and-batch-processing", "distributed-transactions", "message-delivery-semantics", "pub-sub", "queues", "backpressure-and-load-shedding", "storage-engines"],
    keywords: ["Kafka", "event streaming", "log-based broker", "topic", "partition", "offset", "consumer group", "rebalance", "retention", "log compaction", "compacted topic", "ISR", "acks=all", "Kinesis", "Pulsar", "RabbitMQ vs Kafka"],
  },
  {
    id: "stream-and-batch-processing",
    title: "Stream and Batch Processing",
    level: "advanced",
    description: "Processing large datasets all at once (batch) or continuously as events arrive (stream), and the time and correctness problems each brings.",
    explanation: `
Two ways to compute over large amounts of data:

- **Batch processing** takes a **bounded** input (yesterday's logs, a
  full table snapshot), runs a job over all of it, and produces output.
  It has high latency (minutes to hours) but is simple to reason about:
  if the job fails, rerun it on the same input.
- **Stream processing** handles an **unbounded** input that never ends
  (clicks, payments, sensor readings) and produces results continuously,
  often within seconds.

Streams raise questions batch never had to answer. "Count clicks per
minute" needs **windows** to cut an endless stream into finite chunks.
Events arrive **late and out of order** (a phone was offline), so you
must decide whether a "minute" means when the event **happened**
(**event time**) or when you **saw** it (**processing time**), and how
long to wait for stragglers (**watermarks**). And if a processor crashes
mid-stream, you need to recover without double-counting (**exactly-once**
state).

Architecturally, teams have combined the two (**Lambda architecture**)
or used streaming for everything, with replay instead of batch
(**Kappa architecture**).
    `.trim(),
    analogy:
      "Batch is counting all the votes after the polls close: slow, but you see every ballot. Streaming is a live tally on election night: fast, but some ballots arrive late by mail, so you announce provisional results and say 'we'll treat this district as complete once mail-in ballots stop arriving'. That cut-off is a watermark.",
    examples: [
      {
        title: "Word count as MapReduce",
        language: "ts",
        code: `// map: called once per input record, emits (key, value) pairs
function map(line: string, emit: (word: string, count: number) => void): void {
  for (const word of line.toLowerCase().split(/\\W+/).filter(Boolean)) {
    emit(word, 1);
  }
}

// The framework shuffles: all pairs with the same key go to one reducer,
// grouped and sorted by key.

// reduce: called once per key with all its values
function reduce(word: string, counts: number[], emit: (word: string, total: number) => void): void {
  emit(word, counts.reduce((sum, count) => sum + count, 0));
}

// "to be or not to be" → map emits (to,1)(be,1)(or,1)(not,1)(to,1)(be,1)
// shuffle → to:[1,1] be:[1,1] or:[1] not:[1]
// reduce  → to:2 be:2 or:1 not:1`,
        explanation:
          "Map and reduce are pure functions over partitions of data, so the framework can run thousands in parallel and simply rerun any that fail.",
        walkthrough: [
          { code: "function map(line, emit)", explanation: "Runs independently on each chunk of input, in parallel across machines." },
          { code: "emit(word, 1);", explanation: "Outputs a key-value pair for every word seen." },
          { code: "// The framework shuffles", explanation: "Pairs are routed by key over the network so each reducer sees all values for its keys." },
          { code: "function reduce(word, counts, emit)", explanation: "Combines all values for one key into a final result." },
        ],
      },
      {
        title: "Event-time tumbling window with a watermark (Flink-style pseudo-code)",
        language: "ts",
        code: `clicks
  // Use the timestamp inside the event, not the arrival time. Allow events
  // to arrive up to 30 s out of order before the watermark passes them.
  .assignTimestampsAndWatermarks(
    WatermarkStrategy.forBoundedOutOfOrderness(Duration.ofSeconds(30))
      .withTimestampAssigner((click) => click.occurredAt),
  )
  .keyBy((click) => click.pageId)
  .window(TumblingEventTimeWindows.of(Duration.ofMinutes(1)))
  .allowedLateness(Duration.ofMinutes(5))      // update results for late events
  .sideOutputLateData(tooLateClicksTag)        // after that, divert, don't drop silently
  .aggregate(countClicks);

// The [12:00, 12:01) window fires once the watermark passes 12:01,
// i.e. after seeing an event with occurredAt ≥ 12:01:30.`,
        explanation:
          "The watermark trades latency for completeness: a bigger bound waits longer but misses fewer late events.",
      },
    ],
    howItWorks: `
**MapReduce** (Google, 2004; open-sourced as Hadoop) runs batch jobs as:

1. **Map**: read input splits in parallel, emit key-value pairs.
2. **Shuffle**: partition pairs by key, sort them and send each key's
   values to one reducer.
3. **Reduce**: combine each key's values into output.

Fault tolerance comes from determinism: a failed task is just rerun on
the same input. Intermediate results go to disk between stages, which
made multi-step jobs slow. **Spark** generalised this into a DAG of
operators with in-memory intermediate data, and is now the common batch
engine.

**Stream processing** engines (Flink, Kafka Streams, Spark Structured
Streaming, Google Dataflow / Apache Beam) run long-lived operators that
consume a stream, keep **state** (counts, joins, aggregates) and emit
results continuously.

**Windowing** turns an unbounded stream into finite groups:
- **Tumbling**: fixed size, non-overlapping (every 1 minute).
- **Sliding / hopping**: fixed size, overlapping, advancing by a smaller
  step (a 5-minute window every 1 minute), so each event belongs to
  several windows.
- **Session**: per key, closed after a **gap** of inactivity (a user's
  visit ends after 30 minutes without clicks). Sizes vary.

**Event time vs processing time.** Event time is when something
happened (a timestamp in the event); processing time is when the
operator sees it. They diverge because of network delays, offline
devices, backlogs and replays. Windows by processing time are simple
but give different results when you replay data; event-time windows are
reproducible but must cope with out-of-order events.

**Watermarks.** A watermark with time T is the system's assertion that
"no more events with event time < T are expected". When the watermark
passes a window's end, the window can fire. Watermarks are heuristic:
too aggressive and late events are missed; too conservative and results
are delayed. Late events can update already-emitted results within an
**allowed lateness**, or be sent to a side output.

**Lambda architecture** (Nathan Marz) runs a **batch layer** that
periodically recomputes accurate results from all raw data, a **speed
layer** that streams approximate recent results, and a **serving layer**
that merges them. Downside: the same logic is written and maintained
twice in two systems.

**Kappa architecture** (Jay Kreps, 2014) keeps only the streaming path.
The raw events live in a replayable log (e.g. Kafka with long
retention). To fix a bug or change logic, start a new version of the
job reading from the beginning of the log, let it catch up, then switch
readers to its output.

**Exactly-once in stream processors** really means **effectively-once
effects on state and output**: events may be *processed* more than once
after a failure, but the results reflect each exactly once.
- **Flink** takes periodic consistent snapshots of all operator state
  and source offsets using checkpoint barriers (asynchronous barrier
  snapshotting, inspired by Chandy-Lamport). On failure it restores the
  latest checkpoint and replays sources from the saved offsets. Sinks
  must be transactional (two-phase commit tied to checkpoints) or
  idempotent for the output to be exactly-once too.
- **Kafka Streams** uses Kafka transactions to commit state-store
  changelog writes, output records and input offsets atomically.
    `.trim(),
    diagram: `
Windows over one key's events (time →)

 events:      x  x    x         x x   x              x   x
 tumbling:  |----1----|----2----|----3----|----4----|----5----|
 sliding:   |------A------|
                 |------B------|
                      |------C------|
 session:   |--x--x----x--|  gap  |-x-x---x-|   gap    |-x---x-|

Event time vs processing time

 processing time ─►
 event time     12:00:05  12:00:20  11:59:58  12:00:40  12:01:31
 (arrival order)                       ▲ late, out of order
 watermark (max seen − 30s) reaches 12:01:01 → window [12:00,12:01) fires

Lambda vs Kappa

 Lambda:  raw data ─┬─► batch layer (recompute all) ─┐
                    └─► speed layer (recent, approx) ┴─► serving layer
 Kappa:   log (replayable) ─► stream job v1 ─► output
                          └─► stream job v2 (replays from 0) ─► switch over
    `.trim(),
    whyItExists: `
Data volumes outgrew single machines, so computation had to be split
across clusters with automatic retry. Batch frameworks made that
practical for large, finite datasets. Businesses then wanted results in
seconds (fraud detection, live dashboards, alerting, personalization),
which batch can't deliver, so stream processors added stateful,
fault-tolerant computation over unbounded data, with explicit models of
time to keep results correct despite late and out-of-order events.
    `.trim(),
    whenToUse: `
- **Batch**: periodic reports, training data, backfills, large joins
  and reprocessing where hours of latency are acceptable and
  simplicity and cost matter.
- **Stream**: fraud and anomaly detection, real-time metrics and
  dashboards, alerting, keeping materialized views and search indexes
  fresh, sessionization, enriching events in flight.
- **Kappa** when your raw events are already in a replayable log and
  you can afford to replay for corrections; **Lambda** mostly in legacy
  systems or when batch recomputation is the only practical way to get
  exact results.
    `.trim(),
    whenNotToUse: `
- Don't build a streaming pipeline when a nightly batch meets the
  requirement; streaming adds state management, watermark tuning and
  24/7 operations.
- Don't rely on processing-time windows when results must be
  reproducible or correct per real-world time (billing, compliance).
- Avoid Lambda architecture for new systems unless necessary; keeping
  two codebases producing identical results is a known pain point.
- For small data that fits on one machine, a single SQL query or script
  beats any cluster framework.
    `.trim(),
    commonMistakes: [
      "Windowing by processing time and then being surprised that replays or backlogs produce different numbers than the original run.",
      "Setting watermarks too tight and silently dropping late events, or too loose and delaying every result. Measure real lateness distributions and send late data to a side output.",
      "Claiming end-to-end exactly-once while writing to a non-idempotent external sink (sending emails, calling APIs) from inside the stream job.",
      "Letting state grow without bound (per-user state with no TTL, session windows with no expiry), eventually exhausting memory or checkpoint storage.",
      "Ignoring data skew in batch jobs: one hot key makes a single reducer run for hours while the rest finish in minutes.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Classify each as batch or stream and justify: monthly invoices, credit-card fraud detection, nightly ML training data, a live 'users online' counter." },
      { difficulty: "Medium", prompt: "Events: user A clicks at 10:00, 10:10, 10:50 and 11:05. Group them into tumbling 30-minute windows and into session windows with a 30-minute gap. Explain how the results differ." },
      { difficulty: "Hard", prompt: "Design a pipeline computing per-merchant revenue per minute from a Kafka payments topic, with exactly-once results written to a database. Cover event time, watermarks, late events, checkpointing and the sink, and explain what happens if a worker crashes mid-window." },
    ],
    interviewQuestions: [
      { question: "What's the difference between batch and stream processing?", answer: "Batch processes a bounded dataset in one job and produces output when it finishes, with high latency. Stream processing handles an unbounded, continuously arriving dataset and emits results incrementally with low latency." },
      { question: "Explain the phases of MapReduce.", answer: "Map runs in parallel over input splits, emitting key-value pairs. Shuffle partitions, sorts and moves the pairs so each key's values reach one reducer. Reduce aggregates each key's values into output." },
      { question: "How does MapReduce tolerate failures?", answer: "Tasks are deterministic functions of their input, and inputs and intermediate outputs are stored durably, so the framework reruns failed tasks on another machine without affecting the result." },
      { question: "Tumbling vs sliding vs session windows?", answer: "Tumbling: fixed-size, non-overlapping. Sliding (hopping): fixed size, overlapping, advancing by a step, so an event can belong to several windows. Session: per key, bounded by gaps of inactivity, with variable length." },
      { question: "Event time vs processing time?", answer: "Event time is when the event actually occurred, carried in the event. Processing time is when the system processes it. Event-time results are correct and reproducible despite delays and replays; processing-time results are simpler but depend on when data happened to arrive." },
      { question: "What is a watermark?", answer: "A marker asserting that events with event time earlier than T are not expected anymore. It lets the system decide when an event-time window is complete enough to emit, trading latency against completeness." },
      { question: "How do you handle late events?", answer: "Allow a lateness period during which late events update already-emitted results (emitting corrections), and send events later than that to a side output or dead-letter store for reconciliation instead of dropping them silently." },
      { question: "Lambda vs Kappa architecture?", answer: "Lambda runs a batch layer for accurate recomputation and a speed layer for recent results, merged in a serving layer, which means maintaining logic twice. Kappa uses only a streaming pipeline over a replayable log and reprocesses by replaying the log into a new job version." },
      { question: "How does Flink achieve exactly-once state?", answer: "It periodically injects checkpoint barriers into the streams; each operator snapshots its state when barriers align, along with source offsets. On failure it restores the last complete checkpoint and replays from those offsets, so state reflects each event once." },
      { question: "Is exactly-once end-to-end possible when writing to an external database?", answer: "Yes, if the sink participates: either a transactional sink whose commits are tied to checkpoints (two-phase commit, pre-commit on checkpoint and commit when it completes), or an idempotent sink keyed by deterministic ids so replays overwrite rather than duplicate. Non-idempotent side effects like emails can't be made exactly-once by the processor." },
    ],
    prerequisites: ["queues", "pub-sub", "scalability"],
    relatedTopics: ["event-streaming", "distributed-transactions", "data-warehouses-and-olap", "message-delivery-semantics", "backpressure-and-load-shedding", "storage-engines"],
    keywords: ["batch processing", "stream processing", "MapReduce", "Hadoop", "Spark", "Flink", "Kafka Streams", "windowing", "tumbling window", "sliding window", "session window", "event time", "processing time", "watermark", "late data", "Lambda architecture", "Kappa architecture", "exactly-once", "checkpoint"],
  },
];
