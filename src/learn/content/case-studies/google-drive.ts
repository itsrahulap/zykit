import type { CaseStudy } from "../../types/caseStudy";

export const googleDriveCaseStudy: CaseStudy = {
  id: "google-drive",
  title: "Google Drive",
  difficulty: "Medium",
  summary:
    "Design cloud file storage and sync: upload any file, access it from any device, share it, and keep edits consistent even when made offline or from several places at once.",
  problemStatement: `
A user drags a folder into a desktop sync client. The files should appear,
unchanged, on their phone and in their browser a moment later. They edit a
document offline while a collaborator edits it on the web. When both
reconnect, neither person's work should silently disappear. A coworker they
share with can view or edit according to the owner's permissions, and never
sees files that weren't shared.

"Store a file, let people access it" isn't the hard part; object storage
solves that. The hard parts are around it:

- Files can be huge. Upload and sync must survive flaky connections and
  not resend the whole file after a tiny edit.
- The same bytes often exist in huge numbers of accounts (a popular PDF, a
  common template). Storing a copy per uploader would be very wasteful.
- Concurrent edits from several devices or people need a predictable way
  to reconcile, not one silently overwriting the other.

So the design must upload and sync large files efficiently and resumably,
avoid duplicate storage, reconcile concurrent edits sanely, and add a
flexible sharing/permissions model, while all of it feels instant.
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
    "Storage at exabyte scale is the main cost. That makes content-based deduplication a core design concern, not a later optimization, and pushes rarely accessed files to cheaper tiers. Metadata operations also far outnumber content transfers, since most sync activity is 'did anything change?'. So metadata (small, hot, constantly read/written) lives in a fast store separate from file bytes (large, colder, fine on cheap storage).",
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
A sync client (desktop, mobile, or browser) watches for local changes. For
each new or modified file, it splits the file into fixed-size **chunks** and
hashes each one. It asks the server which hashes it doesn't have yet, and
uploads only those chunks. The server records the file by referencing
existing blocks for the rest. So a one-line edit to a huge document sends
only the changed chunk(s), and duplicate content across users costs almost
nothing.

The change is written to a small, fast **metadata and change-log store**,
separate from the much larger, colder **block storage** holding the bytes.
The user's other devices (and users the file is shared with) either get a
real-time push over a persistent connection or find the change on their
next poll of the change log. They then pull only the chunks they're
missing.

Every read and write checks a **permissions table** (inherited down folder
trees) before returning metadata or content. An unshared file is invisible,
not just access-denied, and a viewer-only share can never write a new
version.

Keeping the sync/dedup engine, metadata store, block storage, and
permissions layer separate lets each scale and fail independently.
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
Uploading a file as one blob works on a fast, stable connection and badly
everywhere else. A drop at 95% means starting over, and a small edit to a
huge file means re-sending all of it.

- Files are split into **fixed-size chunks** (e.g. a few MB each), each
  identified by a hash of its content.
- Chunks upload independently. After a failure, the client **resumes** by
  asking "which chunks do you still need?"
- When part of a file changes (a paragraph added to a long document), only
  the affected chunk(s) are re-uploaded.
- The same chunks power **efficient sync checks**. A device compares chunk
  hashes with the server and pulls only the chunks it's missing.

Video platforms use chunked upload for resumability too. Drive leans on it
harder, because files are edited incrementally far more often than videos
are re-uploaded.
      `.trim(),
    },
    {
      title: "Deduplication via content hashing",
      explanation: `
A huge share of uploads aren't unique: a popular PDF, a standard template,
a common OS or app file people back up. Storing each copy separately would
be a massive, avoidable cost.

- Every chunk (and often the whole file) is identified by a **hash of its
  content**, not by who uploaded it or when.
- Before sending a chunk, the client checks whether the server already has
  that hash. If so, the upload is skipped and the new file just
  **references** the existing block.
- This works **across users**. Two unrelated users uploading the same file
  point at the same blocks. That doesn't let them see each other's files:
  permissions are enforced at the metadata/permissions layer, never by the
  shared blocks.
- Deleting a file **decrements a reference count** on its blocks instead
  of deleting bytes. A block is reclaimed only when no file, for any user,
  references it.

The trade is real. Dedup adds reference counting, hashing on every upload,
and a lookup before every transfer. In return it cuts storage cost, one of
the business's largest line items at this scale.
      `.trim(),
    },
    {
      title: "Conflict resolution for concurrent edits",
      explanation: `
Two devices (or collaborators) can change the same file while disconnected.
When both changes reach the server, it must decide what happens. Silently
discarding someone's edit is never acceptable.

- The common approach: track a **version/revision number** (or last-write
  timestamp) per file. If a client saves a change based on an outdated
  version, the server detects the conflict instead of overwriting.
- On conflict, the system usually **keeps both**. The incoming change is
  saved as a new file (a "conflicted copy") next to the server's version,
  and the user resolves it. This deliberately favors never losing data
  over picking a winner automatically.
- Documents built for live collaborative editing use a finer-grained
  technique: operational transforms or CRDTs, which merge concurrent edits
  per character/operation so they never conflict. That's a much harder
  problem, usually a separate subsystem (the editing app) layered on top
  of file-level sync and storage, not replacing it.
- Folder conflicts (a file renamed on one device and deleted on another)
  use similar conservative defaults: keep data rather than discard either
  side's action.

At the file-sync layer, correctness means never silently losing a change,
even if the user occasionally has to reconcile two versions.
      `.trim(),
    },
    {
      title: "Sharing and the permissions model",
      explanation: `
Sharing must support "one file with one person" and "a whole folder tree
with a team." Permission checks must be fast enough to run on every access
without becoming the bottleneck.

- Permissions are stored per file **and** per folder. Folder permissions
  **inherit down** the tree by default, so sharing a folder doesn't need a
  row per file, and a file moved into a shared folder picks up its
  permissions automatically.
- Roles (viewer, editor, owner) are checked at the metadata layer before
  any content is served. An unauthorized request must behave the same
  whether the file exists or not, so it doesn't leak the existence of
  unshared files.
- Since checks run on nearly every read and write, they're cached per
  (user, file/folder) pair and invalidated when that resource's
  permissions change. A classic read-heavy, write-rare cache.
- Link sharing ("anyone with the link can view") is a special permission
  entry, not a row per visitor, since "anyone with the link" can't be
  listed in advance.

Errors either way are costly. Too strict blocks real collaborators; too
loose makes private files discoverable. So permission checks are a hard
requirement on the critical path, not an add-on.
      `.trim(),
    },
  ],
  bottlenecksAndScaling: `
The metadata store is the first bottleneck, not the far larger but colder
block storage. Every sync check, permission lookup, and small edit touches
metadata, while bytes move only when content really changes. So shard the
metadata store (usually by user or workspace, since most activity stays
within one user's or team's files) and cache hot paths like permission
checks and change-log polling, long before block capacity matters.

Block storage is huge but gets far fewer requests. It scales by adding
cheap, cold capacity and moving rarely accessed blocks to cheaper media,
while keeping dedup reference counts correct as files come and go.

Real-time sync notification also strains at scale. Holding push
connections to every active device is a large connection-management
problem of its own. It's usually handled by dedicated, horizontally
sharded connection infrastructure, separate from metadata and storage.
  `.trim(),
  tradeOffs: [
    {
      decision: "Content-addressed, chunked storage vs. storing whole files per upload",
      explanation:
        "Use content-addressed chunk storage. It enables cross-user dedup and efficient incremental sync/upload, at the cost of real complexity: reference counting for deletes, hashing on every write, and reassembly on read. Storing whole files is simpler, but wastes huge amounts of storage on duplicates and forces full re-uploads for any edit. That doesn't hold up at this scale.",
    },
    {
      decision: "Conservative conflict handling (keep both copies) vs. automatic last-write-wins",
      explanation:
        "On conflict, keep both versions instead of letting the later write overwrite the earlier one. Users occasionally have to reconcile a 'conflicted copy', but their work is never silently destroyed. Last-write-wins is simpler for the system, but unacceptable for file storage, where data loss is the worst failure.",
    },
    {
      decision: "Separating metadata store from block storage vs. one unified storage system",
      explanation:
        "Keep metadata (small, hot, constantly read/written) and file bytes (large, colder) in separate systems, each tuned to its access pattern. The cost is keeping them consistent: metadata must point at blocks that exist, and reference counts must stay accurate. One unified store is easier to keep consistent but must serve two very different workloads, and usually serves neither well.",
    },
  ],
  interviewTips: [
    "Lead with chunking and content hashing. One mechanism solves resumable upload, efficient sync, and dedup, and interviewers want to see you connect them.",
    "Say that conflict resolution favors never losing data over picking a winner automatically, and why that's the right default for file storage.",
    "Separate file-level sync from live collaborative editing (OTs/CRDTs). Mixing them up is a common mistake, and interviewers often probe it.",
    "Justify splitting metadata from block storage by access frequency (metadata operations far outnumber byte transfers), not as a generic 'microservices' move.",
    "Mention permission inheritance down folder trees. Per-file permissions alone don't scale to how people organize and share folders.",
  ],
  relatedTopics: ["consistent-hashing", "caching", "sharding", "consistency-models", "cap-theorem", "databases", "sql-vs-nosql"],
  keywords: ["google drive", "cloud storage", "file sync", "deduplication", "content hashing", "conflict resolution", "system design interview"],
};
