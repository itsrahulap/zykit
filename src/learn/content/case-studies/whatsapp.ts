import type { CaseStudy } from "../../types/caseStudy";

export const whatsappCaseStudy: CaseStudy = {
  id: "whatsapp",
  title: "WhatsApp",
  difficulty: "Hard",
  summary:
    "Design real-time messaging: one-to-one and group chats with reliable delivery, read receipts, and end-to-end encryption.",
  problemStatement: `
Two people, or a group, exchange text, photos, and voice notes. They
expect messages to arrive within about a second, even on flaky mobile
connections, with the app closed, or fully offline. When someone comes
back online, every missed message should be waiting, in order, exactly
once.

The design problem is making "send a message" mean "deliver it reliably,
in order, and privately" at billions of messages a day. Three things make
this hard:

- **Delivery must work whether or not the recipient is connected.** The
  system holds messages durably and pushes them the instant the recipient
  reconnects. That means tracking who's online across billions of users
  and keeping a persistent connection (not just request/response) to
  each.
- **End-to-end encryption.** Even the server can't read message content.
  That changes how storage, search, and multi-device sync work, because
  "decrypt on the server" is off the table.
- **Groups** fan one message out to possibly hundreds of recipients, each
  with their own delivery tracking, without duplicating the one-to-one
  logic.

A database schema alone doesn't solve this. You need a persistent
connection per online user, a durable per-recipient inbox for offline
delivery, and a delivery-state machine (sent → delivered → read) per
message per recipient.
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
    "Concurrent connections shape this design more than message throughput. Hundreds of millions of persistent, mostly idle sockets stay open at once. That's a different problem from 'requests per second': it's about how many long-lived connections one server can hold in memory, not how fast it responds. So the architecture uses a dedicated, horizontally scaled fleet of connection servers, separate from the stateless logic that handles messages.",
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
Every online client holds a persistent connection (WebSocket or similar)
to a **connection server**. Its only job is routing: matching a
\`user_id\` to the server and socket serving that user. With hundreds of
millions of connections, this fleet is scaled separately from the rest of
the backend. It must hold many idle sockets cheaply in memory, a very
different profile from a stateless app server.

When a client sends a message:

- Its connection server hands it to a messaging service, which stores it
  durably as opaque ciphertext.
- The service finds the recipient(s) and looks up where each is connected
  in a presence/routing registry (often Redis mapping
  \`user_id -> connection server\`).
- Online recipients get an immediate push. Offline ones get it in their
  durable \`pending_inbox\`, pushed the moment they reconnect.

Either way, the server acks the sender only once the message is durably
stored. The "sent" checkmark means durability, not delivery.

Groups reuse the same per-recipient pipeline. A group message fans out to
each member's delivery path (live push or pending inbox), like a batch of
one-to-one sends. Status is tracked per member, so the sender's checkmarks
reflect the slowest member.

Media (photos, voice notes) takes a separate path. It's encrypted and
uploaded to object storage, and only a pointer and the encryption key go
through the messaging pipeline. Socket traffic stays light whatever the
attachment size.
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
End-to-end encryption (e.g. the Signal Protocol, which WhatsApp uses)
means each message is encrypted on the sender's device with a key the
server never has, and decrypted only on the recipient's device. This
reshapes features that would otherwise be simple on the server:

- **No server-side search of message content.** The server can't search
  ciphertext. Search runs on-device, over messages already decrypted and
  stored locally.
- **No server-side moderation of message text.** Abuse prevention must
  use metadata (who messages whom, how often, recipient reports), not
  content.
- **Multi-device is genuinely hard.** If a user's key lives on one phone,
  a newly linked device (say, a laptop) needs its own way to receive
  messages. Usually each device gets its own keys, and the sender's
  device encrypts the message separately for each of the recipient's
  active devices. The server never fans out a decrypted copy.
- **Key exchange is a core flow.** Before messaging, devices fetch each
  other's public key bundle from the server and set up a session. The
  server is only a public-key directory, never part of the conversation.

Encryption isn't a checkbox added at the end. It limits what the server
is *allowed* to do, and features that would be one-line queries elsewhere
(search, moderation) move to the client.
      `.trim(),
    },
    {
      title: "Reliable, ordered, exactly-once-feeling delivery",
      explanation: `
The transport is realistically at-least-once (a network can retry a send
that already succeeded). Users still need it to feel exactly-once and in
order:

- Each message carries a \`client_message_id\`, generated on the sending
  device. If the client retries, the server sees the duplicate id and
  doesn't re-deliver or double-count it. This is the standard idempotency
  pattern for retried writes.
- Order within a conversation comes from a sequence number (or one
  ordered queue per conversation). The recipient's client can spot a gap
  and wait for or request the missing message instead of showing messages
  out of order.
- The **sent / delivered / read** state is tracked per message per
  recipient. "Sent" means the server stored it durably, "delivered" means
  it reached the recipient's device, and "read" means the recipient's
  client confirmed it was opened. Each transition is a small message back
  through the same pipeline. That's why groups can show partial delivery
  (delivered to 3 of 5 members) instead of a single yes/no.
      `.trim(),
    },
    {
      title: "Offline delivery and the pending inbox",
      explanation: `
An offline recipient must not mean "the message is lost" or "the sender
retries forever." The server holds the message until it can deliver it:

- If the presence/routing registry shows no connection for a recipient,
  the message goes into their \`pending_inbox\` instead of a live push.
  This is a durable per-recipient queue, not a best-effort cache. Losing
  it would lose real, undelivered messages.
- When the recipient's device reconnects, the connection server (or the
  messaging service, notified of the connection) drains their
  \`pending_inbox\` in order and pushes everything. The client then acks
  each message through the delivery-status pipeline.
- The queue only holds messages while a device is offline: hours to a few
  days, with a bounded retention policy after which delivery counts as
  failed. It isn't a long-term store, so it stays small compared to total
  message volume.
      `.trim(),
    },
    {
      title: "Group messaging as fan-out over the same per-recipient pipeline",
      explanation: `
Don't build a separate code path for groups. A group message is just N
individual deliveries sharing one piece of ciphertext logic:

- On send, the messaging service gets the group's current members and
  makes the same routing decision (push live, or land in
  \`pending_inbox\`) for each one. An offline member doesn't block
  delivery to online ones.
- With end-to-end encryption, fan-out has a real cost. The sending device
  must encrypt separately for each recipient (or each recipient device,
  with multi-device), since there's no shared key the server could use
  once for everyone. Group size is a visible cost for the sender, not
  just a server scaling concern.
- Delivery status is per member (the same \`delivery_status\` table as 1:1
  chats). That lets the UI show "delivered to all," "delivered to some,"
  or "read by 3" with no group-specific schema.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
The connection fleet strains first. Hundreds of millions of concurrent,
mostly idle sockets is a memory and file-descriptor problem more than a
CPU or bandwidth one. Connection servers scale by adding machines. The
presence/routing registry (\`user_id\` to connection server) is sharded
and replicated so lookups stay fast as the fleet grows.

This layer must be sized for a reconnection storm, such as a regional
outage ending or a New Year spike. That briefly multiplies both new
connections and pending-inbox drains.

Beyond that, the messaging service and message/inbox stores shard by
conversation or recipient id. Each conversation's ordering and delivery
state stays on one shard, and throughput grows by adding shards. Media
uses the separate object storage + CDN path, so large attachments never
compete with the latency-sensitive text pipeline.
  `.trim(),
  tradeOffs: [
    {
      decision: "Persistent connections (WebSockets) vs. polling for message delivery",
      explanation:
        "Use persistent connections for near-real-time delivery and low per-message overhead. The cost is a different, expensive capacity problem: holding hundreds of millions of idle sockets open, which needs a dedicated connection-server fleet. Polling avoids that, but can't reach sub-second latency at this scale without polling so often it costs about the same.",
    },
    {
      decision: "End-to-end encryption vs. server-side (transport-only) encryption",
      explanation:
        "Use end-to-end encryption for real privacy: the operator can't read content even under compulsion or breach. The cost is losing server-side search, text moderation, and simple single-copy fan-out for groups and multi-device. Those must be rebuilt as client-side or metadata-only features.",
    },
    {
      decision: "Transient server-side message storage vs. treating the server as a permanent archive",
      explanation:
        "Delete messages from the server once delivered (or after a bounded retention window). This fits end-to-end encryption's privacy goal and keeps the pending-inbox store small. The cost: history lives only on the user's devices, so losing every device can mean losing history a server archive would have kept.",
    },
    {
      decision: "At-least-once delivery with client-side deduplication vs. exactly-once transport",
      explanation:
        "Accept an at-least-once transport (simpler, and the reality of unreliable networks) and get an exactly-once experience from client-generated idempotency ids. A transport that guarantees exactly-once end to end is much harder to build and still needs a fallback for edge cases.",
    },
  ],
  interviewTips: [
    "Lead with persistent connections and presence tracking. They set this apart from a generic CRUD/feed system.",
    "Raise end-to-end encryption's implications unprompted (no server-side search, multi-device fan-out cost). This most sets a strong answer apart.",
    "Explain the sent/delivered/read state machine as per-recipient, and use it to explain group delivery status instead of treating groups as a separate problem.",
    "Explain why messages don't need to live forever on the server. Tie it to end-to-end encryption and the pending inbox's bounded retention.",
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
