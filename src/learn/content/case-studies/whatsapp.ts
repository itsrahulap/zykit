import type { CaseStudy } from "../../types/caseStudy";

export const whatsappCaseStudy: CaseStudy = {
  id: "whatsapp",
  title: "WhatsApp",
  difficulty: "Hard",
  summary:
    "Design a real-time messaging system: one-to-one and group chats with reliable delivery, delivery/read receipts, and end-to-end encryption.",
  problemStatement: `
Two people (or a group of them) exchange text messages, photos, and voice
notes, and expect them to arrive in something close to real time —
generally within a second — even though either side might be on a flaky
mobile connection, might have the app closed, or might be offline
entirely. When someone comes back online, every message they missed should
be waiting for them, in order, exactly once. That's the product; the system
design problem is almost entirely about the machinery needed to make "send
a message" actually mean "deliver it reliably, ordered, and privately" at a
scale of billions of messages a day.

Three things make this harder than it looks. First, delivery has to work
regardless of whether the recipient is currently connected — the system
needs to hold a message durably and push it the instant the recipient
reconnects, which means tracking who's online right now across billions of
users and maintaining a persistent connection (not just request/response)
to each of them. Second, messages need end-to-end encryption, meaning even
the server operating the system cannot read message content — which
changes how storage, search, and multi-device sync all have to work,
since the usual trick of "decrypt on the server to do something useful
with the data" is off the table by design. Third, groups fan a single
message out to potentially hundreds of recipients, each of whom needs
their own delivery/ack tracking, without the group case degrading into a
mess of duplicated logic from the one-to-one case.

None of this is solved by a database schema alone — it requires a real
notion of a persistent connection per online user, a durable per-recipient
inbox for offline delivery, and a delivery-state machine (sent → delivered
→ read) tracked per message per recipient.
  `.trim(),
  requirements: {
    functional: [
      "A user can send a text message, photo, or voice note to another user or to a group.",
      "A message is delivered to the recipient in near-real-time if they're online, and held durably for delivery when they next come online.",
      "The sender sees delivery status per message: sent, delivered, and read.",
      "Users can create groups and send messages that fan out to every group member.",
      "Message content is end-to-end encrypted: only the sender and recipient(s) can read it, not the server.",
      "A user can see which of their contacts are currently online ('last seen' / presence).",
    ],
    nonFunctional: [
      "Message delivery must be low-latency (sub-second) when both parties are online.",
      "No message should ever be silently lost — durability and at-least-once delivery matter more than raw throughput.",
      "Messages must arrive in the correct order within a conversation, and not be delivered more than once from the user's point of view (effectively-once, even if the transport is at-least-once).",
      "The system must hold a persistent, mostly-idle connection open for every currently-online user — hundreds of millions of them at once.",
      "End-to-end encryption means the server must be designed to do its job (route, queue, fan out) without ever needing plaintext content.",
    ],
  },
  capacityEstimation: [
    {
      label: "Daily active users",
      value: "~500 million",
      note: "A reasonable order-of-magnitude assumption for a large global messaging platform.",
    },
    {
      label: "Messages sent per day",
      value: "~50 billion",
      note: "Assume each active user sends/participates in an average of ~100 messages/day (including group chat fan-out counted per recipient): 500M * 100.",
    },
    {
      label: "Messages per second (average)",
      value: "~580,000 msg/s",
      note: "50 billion / 86,400 seconds in a day — with sharp spikes around global events (New Year's Eve is the industry's classic stress-test case).",
    },
    {
      label: "Concurrent open connections",
      value: "~150-300 million",
      note: "A meaningful fraction of daily active users have the app open/backgrounded with a live connection at any given moment — this, not message throughput, is what dictates how many connection-handling servers are needed.",
    },
    {
      label: "Storage for undelivered messages",
      value: "Small relative to total volume",
      note: "Only messages awaiting delivery to an offline recipient need to sit in durable storage at any moment; once delivered and acked, a message can be deleted from the server (consistent with true end-to-end encryption, where the server isn't the system of record for message history at all).",
    },
    {
      label: "Median message size",
      value: "~1-2 KB (text); much larger for media",
      note: "Text messages are tiny; photos/voice notes are handled like the media pipeline in a photo-sharing product (object storage + CDN) rather than pushed through the same low-latency messaging path as text.",
    },
  ],
  capacityNotes:
    "The number that shapes this design more than raw message throughput is concurrent connections: hundreds of millions of persistent, mostly-idle sockets need to be held open simultaneously, which is a fundamentally different capacity problem than 'requests per second' — it's about how many long-lived connections one connection-handling server can hold in memory, not how fast it can respond. That pushes the architecture toward a dedicated, horizontally-scaled fleet of connection servers, separate from the stateless application logic that decides what to do with a message once it arrives.",
  apiDesign: [
    { method: "WS", path: "/ws/connect", description: "Establishes a persistent WebSocket connection for the authenticated user; used for both sending and receiving messages in real time." },
    { method: "POST", path: "/api/v1/messages", description: "Fallback/HTTP path to send a message when a live socket isn't used (e.g. from a server-to-server client); body: { recipientId or groupId, ciphertext, clientMessageId }." },
    { method: "POST", path: "/api/v1/messages/{messageId}/ack", description: "Recipient acknowledges delivery or read status for a message, advancing its state machine." },
    { method: "POST", path: "/api/v1/groups", description: "Creates a group with an initial member list." },
    { method: "POST", path: "/api/v1/groups/{groupId}/messages", description: "Sends a message to a group; server fans it out to each current member's inbox/connection." },
    { method: "GET", path: "/api/v1/users/{userId}/presence", description: "Returns whether a contact is currently online, or their last-seen timestamp." },
    { method: "GET", path: "/api/v1/keys/{userId}", description: "Returns a user's current public key bundle, used by senders to establish/rotate end-to-end encryption sessions." },
  ],
  dataModel: `
Because content is end-to-end encrypted, the server's data model is
deliberately shaped around routing and delivery state, not around
readable message content:

- **users**: \`user_id\`, \`phone_number\`, \`public_key_bundle\` (for
  establishing encrypted sessions), \`last_seen_at\`.
- **conversations**: \`conversation_id\`, \`type\` (1:1 or group),
  \`member_ids\` (for groups).
- **messages**: \`message_id\`, \`conversation_id\`, \`sender_id\`,
  \`ciphertext\` (opaque to the server — it cannot decrypt this),
  \`created_at\`, \`client_message_id\` (set by the sending device, used to
  deduplicate retries so at-least-once delivery doesn't become
  visibly-more-than-once).
- **delivery_status**: \`message_id\`, \`recipient_id\`, \`state\` (sent /
  delivered / read), \`updated_at\` — one row per recipient per message, so
  a group message naturally tracks delivery independently for each of its
  members without any special-casing.
- **pending_inbox** (per-recipient durable queue, in a key-value or
  wide-column store): \`recipient_id\` -> list of not-yet-delivered
  \`message_id\`s. This is what makes offline delivery work: a message
  lands here the instant it can't be pushed live, and is drained the
  instant that recipient's connection comes back.

Notably, once a message reaches the \`read\` state on all recipients (or
after a bounded retention window), the server has no product reason to
keep the ciphertext around at all — unlike a social feed, where old
content stays valuable indefinitely, a true end-to-end-encrypted
messenger's server-side storage is meant to be transient by design, not an
archive.
  `.trim(),
  highLevelDesign: `
Every online client holds a persistent connection (WebSocket, or a similar
long-lived protocol) to a **connection server**, whose only job is routing:
matching a \`user_id\` to the specific server and socket currently serving
that user, out of a large horizontally-scaled fleet. Because there are
hundreds of millions of these connections at once, this fleet is scaled
and reasoned about separately from the rest of the backend — a connection
server needs to hold many idle sockets cheaply in memory, which is a very
different resource profile than a stateless request-handling app server.

When a client sends a message, its connection server hands it to a
messaging service, which writes the message (as opaque ciphertext) durably,
determines the recipient(s) from the conversation, and looks up where each
recipient is currently connected (via a presence/routing registry, often
backed by something like Redis mapping \`user_id -> connection server\`).
If the recipient is online, the message is pushed immediately over their
socket; if not, it's placed in their durable \`pending_inbox\` and pushed
the moment they reconnect. Either way, the server acks the sender only once
the message is durably stored — durability, not delivery, is what the
sender's "sent" checkmark actually represents.

Group messaging reuses this exact same per-recipient pipeline rather than
inventing a separate mechanism: a group message is simply fanned out to
each member's individual delivery path (live push or pending inbox),
exactly like a batch of one-to-one sends, with delivery-status tracked per
member so the sender's checkmarks reflect the slowest member to receive
it. Media (photos, voice notes) rides a separate path — encrypted, then
uploaded to object storage, with only a pointer and encryption key sent
through the low-latency messaging pipeline itself, keeping the socket
traffic light regardless of attachment size.
  `.trim(),
  highLevelDiagram: `
   Client A                                          Client B
 (persistent  ─┐                                  ┌─  (persistent
  connection)  │                                  │    connection)
               ▼                                  ▼
        ┌───────────────┐                  ┌───────────────┐
        │ Connection     │                  │ Connection     │
        │ Server (fleet) │                  │ Server (fleet) │
        └───────┬────────┘                  └───────┬────────┘
                │                                    ▲
                ▼                                    │ push if online
        ┌────────────────┐                  ┌────────┴────────┐
        │ Messaging       │ ───────────────▶ │ Presence /       │
        │ Service         │                  │ Routing Registry │
        └───────┬────────┘                  └─────────────────┘
                │
      ┌─────────┼───────────────┐
      ▼                         ▼
┌──────────────┐        ┌──────────────────┐
│  Message      │        │  pending_inbox    │
│  Store        │        │ (per-recipient,   │
│ (ciphertext)  │        │  durable queue)   │
└──────────────┘        └──────────────────┘
  `,
  deepDives: [
    {
      title: "End-to-end encryption and what it removes from the server's job",
      explanation: `
End-to-end encryption (e.g. via the Signal Protocol, which WhatsApp is
built on) means every message is encrypted on the sender's device with a
key the server never has, and decrypted only on the recipient's device.
This one property reshapes several parts of the design that would
otherwise be simple server-side features:

- **No server-side search over message content** — the server can't grep
  ciphertext. Search has to happen entirely on-device, over messages the
  device has already decrypted and stored locally.
- **No server-side content moderation of message text** — whatever
  abuse-prevention exists has to work on metadata (who's messaging whom,
  how often, reports from recipients) rather than content inspection.
- **Multi-device support is a genuine hard problem**, not an
  afterthought: if a user's key lives only on one phone, a new linked
  device (a laptop, say) needs its own way to receive messages, which
  typically means each device gets its own keys and the sender's device
  encrypts the same message separately for each of the recipient's active
  devices, rather than the server ever fanning out one decrypted copy.
- **Key exchange is a first-class flow**: before two users can message
  encrypted, their devices need to fetch each other's public key bundle
  from the server and establish a session — the server's role here is
  purely as a directory for public keys, never a party to the actual
  encrypted conversation.

The upshot: encryption isn't a checkbox added at the end, it constrains
what the server is *allowed* to be useful for, and several features that
would be one-line database queries in a non-encrypted system (search,
content moderation) simply move to the client instead.
      `.trim(),
    },
    {
      title: "Reliable, ordered, exactly-once-feeling delivery",
      explanation: `
The underlying transport is realistically at-least-once (a network can
retry a send that actually succeeded), but users need the experience to
feel exactly-once, and ordered:

- Each message carries a \`client_message_id\` generated on the sending
  device before it's sent. If the network causes the client to retry, the
  server recognizes the duplicate id and does not re-deliver or double-count
  it — this is the same idempotency pattern used anywhere a client might
  retry a write it's unsure succeeded.
- Ordering within a single conversation is preserved by attaching a
  sequence number (or relying on a single ordered queue per conversation)
  so a recipient's client can detect a gap and know to wait for or request
  a missing message, rather than rendering messages out of order.
- The **sent / delivered / read** state machine is tracked per message per
  recipient: "sent" means the server has durably stored it, "delivered"
  means it reached the recipient's device, "read" means the recipient's
  client has explicitly acknowledged it was opened. Each transition is
  itself a small message flowing back through the same pipeline, which is
  why group chats can show a partial-delivery state (delivered to 3 of 5
  members) instead of a single boolean.
      `.trim(),
    },
    {
      title: "Offline delivery and the pending inbox",
      explanation: `
A recipient being offline can't be allowed to mean "the message is lost"
or "the sender has to keep retrying forever" — the server takes
responsibility for holding the message until it can be delivered:

- When the presence/routing registry shows no active connection for a
  recipient, the message is written into that recipient's
  \`pending_inbox\` instead of attempting a live push. This is a durable,
  per-recipient queue, not a best-effort cache — losing it would mean
  losing a real, undelivered message.
- The moment that recipient's device establishes a new connection, the
  connection server (or the messaging service, notified of the new
  connection) drains their \`pending_inbox\` in order and pushes everything
  waiting, then the client acks each one back through the delivery-status
  pipeline.
- This queue only needs to hold messages for however long a device is
  realistically offline (hours to a few days, with a bounded retention
  policy after which delivery is considered to have failed) — it is not
  a long-term store, which keeps it small relative to the platform's total
  message volume even though total volume is enormous.
      `.trim(),
    },
    {
      title: "Group messaging as fan-out over the same per-recipient pipeline",
      explanation: `
A naive group chat implementation might be tempted to build an entirely
separate code path from one-to-one messaging; a cleaner design recognizes
that a group message is just N individual deliveries sharing one piece of
ciphertext logic:

- On send, the messaging service resolves the group's current member list
  and performs the exact same per-recipient routing decision (push live,
  or land in \`pending_inbox\`) for each member independently — a member
  who's offline doesn't block delivery to members who are online.
- With end-to-end encryption, this fan-out has a real cost: the sending
  device must encrypt the message separately for each recipient (or each
  recipient device, under multi-device), since there's no single shared
  key the server could use to encrypt once for everyone — group size is
  therefore a real, visible cost on the sender's side, not just a server
  scaling concern.
- Delivery-status tracking is naturally per-member (via the same
  \`delivery_status\` table used for 1:1 chats), which is what lets the
  UI show "delivered to all," "delivered to some," or "read by 3" without
  any group-specific schema.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
The first thing to strain in this design is the connection-handling fleet
itself: hundreds of millions of concurrent, mostly-idle sockets is a
memory and file-descriptor problem more than a CPU or bandwidth one, so
connection servers scale by adding more machines to hold more sockets, with
the presence/routing registry (mapping \`user_id\` to connection server)
sharded and replicated so that lookup stays fast as the fleet grows. A
sudden reconnection storm — a regional network outage ending, or a
new-year spike — is the specific event this layer has to be provisioned to
absorb, since it can momentarily multiply both new connections and
pending-inbox drains at once.

Past that, the messaging service and message/inbox stores scale
horizontally by sharding on conversation or recipient id, so any one
conversation's ordering and delivery-state tracking stays on one shard
while overall throughput scales by adding shards; media rides an entirely
separate, already-horizontally-scaled object storage + CDN path so large
attachments never compete with the latency-sensitive text-message
pipeline for capacity.
  `.trim(),
  tradeOffs: [
    {
      decision: "Persistent connections (WebSockets) vs. polling for message delivery",
      explanation:
        "Persistent connections were chosen to get near-real-time delivery and low per-message overhead, at the cost of a fundamentally different (and expensive) capacity problem: holding hundreds of millions of concurrent idle sockets open, which requires a dedicated connection-server fleet. Polling would avoid that operational burden but couldn't deliver sub-second latency at this scale without polling so frequently it recreates most of the same cost anyway.",
    },
    {
      decision: "End-to-end encryption vs. server-side (transport-only) encryption",
      explanation:
        "End-to-end encryption was chosen for genuine message privacy — the server operator cannot read content even under compulsion or breach — at the real cost of giving up server-side search, content moderation on text, and simple single-copy fan-out for groups and multi-device, all of which have to be rebuilt as client-side or metadata-only features instead.",
    },
    {
      decision: "Transient server-side message storage vs. treating the server as a permanent archive",
      explanation:
        "Messages are deleted from server storage once delivered (or after a bounded retention window) rather than kept indefinitely, consistent with end-to-end encryption's privacy goal and keeping the durable pending-inbox store small. The cost is that a user's message history lives only on their own devices — losing every device can mean losing history that a server-as-archive design would have preserved centrally.",
    },
    {
      decision: "At-least-once delivery with client-side deduplication vs. exactly-once transport",
      explanation:
        "The system accepts an at-least-once transport (simpler, and the honest reality of unreliable networks) and achieves an exactly-once user experience via client-generated idempotency ids, rather than trying to build a transport that guarantees exactly-once end to end, which is significantly harder to get right and still needs a fallback for edge cases anyway.",
    },
  ],
  interviewTips: [
    "Lead with persistent connections and presence tracking — it's the piece that most distinguishes this from a generic CRUD/feed system and shows you're not just reusing a feed-design template.",
    "Bring up end-to-end encryption's implications unprompted (no server-side search, multi-device fan-out cost) — it's the detail that most differentiates a strong answer here.",
    "Explain the sent/delivered/read state machine as tracked per-recipient, and use that to explain group chat delivery status naturally, rather than treating groups as a separate problem.",
    "Justify why messages don't need to live forever on the server — tie it back to end-to-end encryption and the pending-inbox's bounded retention.",
    "If pressed on scale, name concurrent connections (not messages/second) as the number that most shapes the architecture.",
  ],
  relatedTopics: [
    "websockets",
    "queues",
    "pub-sub",
    "idempotency",
    "consistency-models",
    "sharding",
    "load-balancing",
    "authentication-and-sessions",
  ],
  keywords: [
    "whatsapp",
    "messaging",
    "end-to-end encryption",
    "websockets",
    "presence",
    "delivery receipts",
    "group chat",
    "system design interview",
  ],
};
