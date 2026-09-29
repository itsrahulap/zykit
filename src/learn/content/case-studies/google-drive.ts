import type { CaseStudy } from "../../types/caseStudy";

export const googleDriveCaseStudy: CaseStudy = {
  id: "google-drive",
  title: "Google Drive",
  difficulty: "Medium",
  summary:
    "Design a cloud file storage and sync service: upload any file, access it from any device, share it with others, and have edits stay consistent even when made offline or from multiple places at once.",
  problemStatement: `
Someone drags a folder of files into a desktop sync client. Those files
should show up, unchanged, on their phone and in their browser a moment
later. They edit a document on their laptop while offline, and a
collaborator edits the same document on the web at the same time — when
both come back online, neither person's work should silently disappear. They
share a file with a coworker, who should be able to view or edit it
according to permissions the owner set, without ever seeing files that
weren't shared with them.

The part that looks simple — "store a file, let people access it" — is not
actually the hard part; object storage solves that. The hard parts are
everything around it: a file might be huge, so uploading and syncing it
needs to survive a flaky connection and not resend the whole thing after a
tiny edit. The same file often exists, byte-for-byte, across huge numbers of
different users' accounts (a popular PDF, a common template), so storing it
redundantly for every uploader would be enormously wasteful. And multiple
devices or people editing related content concurrently need a defined,
predictable way to reconcile conflicting changes rather than one silently
overwriting the other.

So the real design problem is: how do you upload and sync large files
efficiently and resumably, avoid storing duplicate content, reconcile
concurrent edits sanely, and layer a flexible sharing/permissions model on
top of all of it — while every one of those pieces still needs to feel
instant to the end user.
  `.trim(),
  requirements: {
    functional: [
      "A user can upload files and folders, which then sync automatically across all of that user's devices.",
      "A user can edit a file offline; changes sync and reconcile once the device is back online.",
      "A user can share a file or folder with specific other users, at either view or edit permission level.",
      "Users can see version history for a file and restore an earlier version.",
      "Large files upload/download in a way that can pause and resume rather than restarting from scratch on failure.",
      "Identical file content uploaded by different users (or the same user twice) is not stored redundantly.",
    ],
    nonFunctional: [
      "Sync should feel close to real-time — changes on one device should appear on another within seconds.",
      "The system must tolerate unreliable, low-bandwidth, or intermittent connections gracefully (mobile networks, spotty Wi-Fi).",
      "Storage costs matter enormously at this scale, so deduplication and efficient storage of small edits both matter.",
      "Permissions must be strictly enforced — a shared-with-view-only user must never be able to write, and an unrelated user must never see the file at all.",
      "The system is read-heavy for file access but the sync/upload path is a meaningful and latency-sensitive write path too, unlike a typical read-dominated system.",
      "Availability matters more than perfect real-time consistency for sync — a device seeing a slightly-stale folder state briefly is acceptable; losing data is not.",
    ],
  },
  capacityEstimation: [
    {
      label: "Active users",
      value: "~1 billion",
      note: "An assumption for a large-scale consumer cloud storage service, used to anchor the other estimates.",
    },
    {
      label: "Average storage per user",
      value: "~5-15 GB used (of a larger quota)",
      note: "Most users store far less than their quota allows; total footprint is dominated by a smaller set of heavy users and shared/duplicated common files.",
    },
    {
      label: "Total raw storage demand",
      value: "Many exabytes",
      note: "~1 billion users * several GB average — an enormous number that makes deduplication and tiered/cheap storage not optional but load-bearing to the business.",
    },
    {
      label: "Deduplication savings",
      value: "Meaningful double-digit percentage of raw uploads",
      note: "Common files (popular templates, shared attachments, OS/app files people back up) are uploaded independently by huge numbers of unrelated users; content-hash-based dedup avoids storing each of those more than once.",
    },
    {
      label: "Sync/upload events per second",
      value: "Hundreds of thousands to low millions/second at peak",
      note: "Every file/folder change on any synced device (across ~1 billion users, many devices each) generates a sync event; batched around active-hours peaks worldwide.",
    },
    {
      label: "Metadata operations vs. actual byte storage",
      value: "Metadata ops far exceed byte-storage ops",
      note: "Checking 'has this file changed?' and updating folder/version metadata happens far more often than actually transferring file bytes, since most sync checks find nothing new to transfer — this is what pushes metadata into its own fast, separately-scaled store from the file bytes themselves.",
    },
  ],
  capacityNotes:
    "The dominant cost here is storage at exabyte scale, which makes content-based deduplication a first-class architectural concern rather than an optimization to bolt on later, and pushes cold/rarely-accessed files toward cheaper storage tiers. Just as important, metadata operations vastly outnumber actual file-content transfers, since most sync activity is 'checking if anything changed' — so file metadata (small, hot, extremely frequently read/written) needs to live in a fast store that's architecturally separate from the file bytes themselves (large, comparatively cold, cheap-storage-friendly).",
  apiDesign: [
    { method: "POST", path: "/api/v1/files/upload-init", description: "Starts a chunked upload session for a file; returns an upload id and chunk size to use." },
    { method: "PUT", path: "/api/v1/files/upload/{uploadId}/chunk/{n}", description: "Uploads one chunk of a file; supports resuming after a dropped connection." },
    { method: "GET", path: "/api/v1/files/{fileId}/metadata", description: "Returns file metadata: name, size, owner, folder, version, content hash." },
    { method: "GET", path: "/api/v1/files/{fileId}/download", description: "Downloads the file content (or a specific chunk range, for partial/resumed downloads)." },
    { method: "GET", path: "/api/v1/sync/changes?since=", description: "Returns the set of file/folder changes since a given sync cursor, for a device to apply locally." },
    { method: "POST", path: "/api/v1/files/{fileId}/share", description: "Body: { userId or email, role: viewer|editor }. Grants access to another user." },
    { method: "GET", path: "/api/v1/files/{fileId}/versions", description: "Lists prior versions of a file with timestamps, for restore." },
    { method: "POST", path: "/api/v1/files/{fileId}/versions/{versionId}/restore", description: "Restores a file to a previous version, creating a new version rather than deleting history." },
  ],
  dataModel: `
Metadata and file bytes are deliberately two different systems:

- **files** (metadata store): \`file_id\`, \`owner_id\`, \`name\`, \`folder_id\`,
  \`size\`, \`content_hash\`, \`current_version_id\`, \`updated_at\`. Small rows,
  read and written constantly by sync clients checking for changes — this is
  the table that has to be fast above all else.
- **file_versions**: \`version_id\`, \`file_id\`, \`content_hash\`,
  \`created_at\`, \`created_by\` — one row per saved version, letting version
  history and restore work without ever mutating or losing older content.
- **blocks** (content-addressed blob storage): the actual file bytes,
  chunked and stored keyed by a **hash of their content**, not by file id.
  Two different \`files\` rows (even owned by different users) that happen to
  contain identical bytes point at the very same stored blocks — this hash-
  keyed indirection is exactly what makes deduplication possible.
- **permissions**: \`file_id\` (or \`folder_id\`), \`user_id\`, \`role\`
  (viewer/editor/owner) — checked on every access, and inherited down a
  folder tree so sharing a folder implicitly shares its contents without
  writing a row per descendant file.
- **sync_cursor / change_log**: an append-only log of changes per user/
  workspace that sync clients can page through incrementally ("give me
  everything since cursor X") rather than re-scanning the entire file tree
  on every sync check.

The key structural decision is that \`files\` rows never store file bytes
directly — they store a \`content_hash\` that points into content-addressed
block storage, so uploading a file whose content already exists anywhere in
the system (even under someone else's account) requires no new bytes to be
transferred or stored at all, only a new \`files\`/\`file_versions\` row.
  `.trim(),
  highLevelDesign: `
A sync client (desktop app, mobile app, or browser) watches for local file
changes and, for anything new or modified, splits the file into fixed-size
**chunks** and computes a content hash for each chunk before uploading
anything. It first asks the server which of those chunk hashes it doesn't
already have; only genuinely new chunks are actually transferred, and the
server assembles/records the file by referencing existing blocks for
anything that matched. This is what makes both small edits to large files and
duplicate content across different users cheap: a one-line edit to a huge
document only needs to send the changed chunk(s), not the whole file.

Once uploaded, a change is written to a small, fast **metadata and change-log
store**, decoupled entirely from the (much larger, comparatively cold)
**block storage** holding actual bytes. Every other device belonging to that
user (and any other users the file is shared with) is either notified in
real time (a push over a persistent connection) or discovers the change on
its next periodic poll of the change log, and pulls down just the changed
chunks it's missing.

Sharing and permissions sit as a layer that every read/write path checks
against: a **permissions table**, checked (and inherited down folder
hierarchies) before any metadata or content is returned, so an unshared file
is invisible rather than merely access-denied, and a viewer-only share can
read but never successfully write a new version. This separation —
sync/dedup engine, metadata store, block storage, permissions layer — lets
each piece scale and fail independently rather than as one monolith.
  `.trim(),
  highLevelDiagram: `
                        ┌──────────────┐
   Sync Client  ──────▶ │ Sync/API      │
  (desktop/mobile/web)  │ Service       │
                        └──────┬───────┘
                                │
                 ┌──────────────┼───────────────┐
                 ▼               ▼                ▼
         ┌──────────────┐ ┌──────────────┐ ┌───────────────┐
         │  Metadata /   │ │ Permissions  │ │  Change Log /  │
         │  files store  │ │  Service     │ │  Sync Cursor   │
         │ (fast, hot)   │ │              │ │                │
         └──────┬───────┘ └──────────────┘ └───────┬────────┘
                │ content_hash pointers                     │ notify other
                ▼                                            ▼ devices/shares
         ┌───────────────────────────┐              ┌───────────────┐
         │  Content-Addressed Block   │              │  Other Synced  │
         │  Storage (dedup'd bytes,   │              │  Devices /     │
         │  chunked, cheap/cold tier) │              │  Shared Users  │
         └───────────────────────────┘              └───────────────┘
  `,
  deepDives: [
    {
      title: "Chunked upload and sync for large, flaky connections",
      explanation: `
Treating a file as one indivisible blob to upload works fine on a fast,
stable connection and badly everywhere else — a dropped connection at 95%
of a large upload would mean starting over, and any small edit to a huge
file would require re-sending the entire thing.

- Files are split into **fixed-size chunks** (e.g. a few MB each) before
  upload, each identified by a hash of its own content.
- The client uploads chunks independently and can **resume** after a
  failure by simply asking "which chunks do you still need?" rather than
  restarting the whole transfer.
- When only part of a file changes (a paragraph added to a long document),
  only the chunk(s) containing that changed region need to be re-uploaded —
  the rest of the file's chunks are untouched and already stored.
- The same chunking scheme underlies **efficient sync checks**: a device can
  compare chunk hashes for a file against what the server has, and pull down
  only the chunks it's missing, rather than re-downloading whole files on
  every sync.

This is the same principle a video platform's chunked upload uses for
resumability, applied more aggressively here because Drive's files are
edited incrementally far more often than a video is re-uploaded.
      `.trim(),
    },
    {
      title: "Deduplication via content hashing",
      explanation: `
An enormous fraction of files uploaded to a service like this are not
unique — a popular PDF, a standard corporate template, a common OS or app
file people back up — uploaded independently by huge numbers of unrelated
users. Storing every one of those copies separately would be a massive,
avoidable storage cost.

- Every chunk (and often the whole file) is identified by a **hash of its
  content**, not by who uploaded it or when.
- Before actually transferring a chunk's bytes, the client checks whether
  the server already has a block with that hash — if so, the upload for that
  chunk is skipped entirely, and the new file simply **references** the
  existing block.
- This works **across users**, not just across a single user's own history —
  two unrelated users uploading the identical file both end up pointing at
  the same underlying blocks, with no cross-user visibility of each other's
  files implied (permissions are enforced entirely at the metadata/
  permissions layer, never by the shared blocks themselves).
- Deleting a file must **decrement a reference count** on its blocks rather
  than deleting the bytes outright — a block is only actually reclaimed once
  no file, for any user, still references it.

The trade this introduces is real: deduplication adds complexity (reference
counting, hash computation on every upload, a lookup before every transfer)
in exchange for a large, direct reduction in storage cost at a scale where
that cost is one of the business's largest line items.
      `.trim(),
    },
    {
      title: "Conflict resolution for concurrent edits",
      explanation: `
Two devices (or two collaborators) can modify the same file while
disconnected from each other, and when both changes reach the server, the
system has to decide what happens — silently discarding one person's edit
is never acceptable.

- The simplest, most common approach: track a **version/revision number**
  (or a last-write timestamp) per file. If a client tries to save a change
  based on a version that's no longer current, the server detects the
  conflict rather than blindly overwriting.
- On conflict, rather than losing data, the system typically **keeps both**:
  the incoming change is saved as a new file (a "conflicted copy") alongside
  the version already on the server, and the user resolves it manually — a
  deliberately conservative choice that favors never losing data over
  automatically picking a winner.
- For documents actually designed for live collaborative editing (as opposed
  to file-level sync), a different, finer-grained technique — operational
  transforms or CRDTs that merge concurrent edits at the level of individual
  characters/operations — avoids conflicts altogether by making concurrent
  edits mathematically mergeable. That's a materially harder problem than
  file-level sync and is usually treated as a distinct sub-system (the
  editing app itself) layered on top of, rather than replacing, file-level
  sync and storage.
- Folder-level conflicts (a file renamed on one device while deleted on
  another) are resolved with similar conservative defaults: prefer keeping
  data over automatically discarding either side's action.

The general principle: at the file-sync layer, correctness means never
silently losing a user's change, even if that means occasionally asking the
user to manually reconcile two versions.
      `.trim(),
    },
    {
      title: "Sharing and the permissions model",
      explanation: `
Sharing needs to support both "share one file with one person" and "share an
entire folder tree with a team," and permission checks have to be fast
enough to run on every single file access without becoming the bottleneck.

- Permissions are stored per file **and** per folder, with folder
  permissions **inheriting down** the tree by default — sharing a folder
  doesn't require writing a permission row for every file inside it, and
  moving a file into a shared folder should extend that folder's
  permissions to it automatically.
- Roles (viewer, editor, owner) are checked at the metadata layer before any
  content is served — an unauthorized user's request for a file id they
  don't have access to should behave the same whether the file exists or
  not, so as to avoid leaking the existence of files that weren't shared
  with them.
- Because permission checks happen on effectively every read and write,
  they're cached aggressively per (user, file/folder) pair, invalidated
  whenever the permission set for that resource changes — a classic
  read-heavy, write-rare caching pattern.
- Public/link-based sharing ("anyone with the link can view") is modeled as
  its own special-cased permission entry rather than requiring a row per
  potential visitor, since the set of "anyone with the link" isn't
  enumerable in advance.

Getting this wrong in either direction is costly: too strict and
legitimate collaborators get blocked; too loose and a private file becomes
accidentally discoverable — so permission checks are treated as a hard
requirement on the critical path, not an optional feature layered on
afterward.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
The first bottleneck at real scale is the metadata store, not the (far
larger but comparatively cold) block storage — because every sync check,
every permission lookup, and every small edit touches metadata, while
actual byte transfer only happens when content genuinely changes. The
metadata store therefore needs to be sharded (commonly by user or workspace,
since almost all activity is scoped to one user's or team's own files) and
cached aggressively for hot paths like permission checks and change-log
polling, well before block storage capacity becomes a concern.

Block storage scales differently: it's enormous in raw size but low in
request rate relative to metadata, so it scales by adding cheap, cold
storage capacity and tiering rarely-accessed blocks onto slower/cheaper
media, while keeping deduplication reference-counting correct as files are
added and removed across the whole system. The other place this design
strains is real-time sync notification at scale — maintaining persistent
push connections to every active device for every user is a genuinely large
connection-management problem in its own right, typically solved by
dedicated, horizontally-sharded connection-handling infrastructure separate
from the metadata/storage services entirely.
  `.trim(),
  tradeOffs: [
    {
      decision: "Content-addressed, chunked storage vs. storing whole files per upload",
      explanation:
        "Content-addressed chunk storage was chosen: it enables both cross-user deduplication and efficient incremental sync/upload, at the cost of real complexity — reference counting for deletes, hash computation on every write, and reassembly logic on read. Storing whole files per upload is simpler to implement and reason about, but wastes enormous amounts of storage on duplicate content and forces full re-uploads for any edit, which doesn't hold up at this scale.",
    },
    {
      decision: "Conservative conflict handling (keep both copies) vs. automatic last-write-wins",
      explanation:
        "On a detected conflict, the system keeps both versions rather than silently letting the later write overwrite the earlier one, trading a small amount of user confusion (occasionally having to manually reconcile a 'conflicted copy') for the much stronger guarantee that a user's work is never silently destroyed. Last-write-wins is simpler and conflict-free from the system's point of view, but is unacceptable for a file storage product where data loss is the worst possible failure mode.",
    },
    {
      decision: "Separating metadata store from block storage vs. one unified storage system",
      explanation:
        "Metadata (small, hot, extremely frequently read/written) and file bytes (large, comparatively cold) are kept in two architecturally separate systems, each tuned to its own access pattern, at the cost of added complexity in keeping them consistent (a metadata row pointing at blocks that must actually exist, reference counts that must stay accurate). A single unified store would be simpler to keep consistent but would force one system to serve two very different workloads well, which usually means serving neither optimally.",
    },
  ],
  interviewTips: [
    "Lead with chunking and content hashing — they solve resumable upload, efficient sync, and deduplication all at once, and interviewers want to see you connect those three problems to one mechanism.",
    "Be explicit that conflict resolution favors never losing data over picking an automatic winner, and explain why that's the right default for a file storage product specifically.",
    "Separate the 'file-level sync' problem from 'live collaborative document editing' (OTs/CRDTs) explicitly — conflating them is a common mistake, and interviewers often probe this distinction.",
    "Justify splitting metadata storage from block storage by access-pattern frequency (metadata operations vastly outnumber byte transfers), not just as a generic 'microservices' gesture.",
    "Mention permission inheritance down folder trees — a naive per-file permission model doesn't scale to how people actually organize and share folders.",
  ],
  relatedTopics: ["consistent-hashing", "caching", "sharding", "consistency-models", "cap-theorem", "databases", "sql-vs-nosql"],
  keywords: ["google drive", "cloud storage", "file sync", "deduplication", "content hashing", "conflict resolution", "system design interview"],
};
