# Zykit tool roadmap: prompts for upcoming work

This roadmap reviews the 23 tools proposed in `dokit-new-tool-prompts.md` against what Zykit already ships (115 tools, October 2026). For each one it says whether it's **new**, an **improvement** to an existing tool, or **already covered**, and gives a ready-to-paste prompt.

Work through it one item per session. Each item is sized to finish, test and review in one run.

## How to use this file

1. Open the repo in Claude Code.
2. Paste the **Shared instructions** below, then exactly one item's prompt.
3. When it's done, tick the item's checkbox in the status table and commit.

## Shared instructions (paste with every prompt)

> You're working in **Zykit** (this repo): a React 19 + Vite + Tailwind v4 + TypeScript site of private, in-browser tools. Read `docs/adding-a-tool.md` first and follow it.
>
> - **New tool:** scaffold it with `npm run new:tool -- <id> --name "<Name>" --category "<Category>" --icon <icon>`. Use an existing category from `CATEGORY_ORDER` in `src/tools/registry.ts`, and an icon name from `src/shared/ui/ui.tsx`. **Improvement:** edit the existing folder `src/tools/<id>/` only.
> - **Docs:** fill in `docs.ts` (3–5 how-to steps, how it works, real limits, privacy, at least 3 FAQs) and `README.md` (Purpose, File Structure, Core Logic, Limits, Tests, Known Gaps) from the actual code. `tests/tools/docs.test.ts` rejects any leftover TODO.
> - **Reuse before writing:**
>   - shared UI: `src/shared/ui/*` (`Select` instead of a native `<select>`, `Segmented`, `CodeArea`, `CopyButton`, the `convert.tsx` panels, `ImageBatch` file pickers);
>   - shared libraries: `src/shared/lib/*` (`csv`, `zip`, `base64`, `textpos` for line/column errors, `random`, `store`, `currency`);
>   - other tools' `features/` code (import it, don't copy it).
>   - Don't add a dependency for something a few lines can do. If one is truly needed, check `npm audit` and that it doesn't use `eval`, load it lazily (`import()`), and list it in the README's "Third-party code" table.
> - **Constraints:**
>   - Content Security Policy: no `eval` or `new Function`, no requests to other sites (`connect-src 'self'`), no WebAssembly outside the SQL worker.
>   - `tsconfig` sets `erasableSyntaxOnly`: no enums and no constructor parameter properties.
>   - Render untrusted input as text, never as HTML.
>   - Anything that can hang on user input (regexes, big parses) runs in a worker with a time limit.
> - **Design and accessibility:**
>   - Match existing pages (Breadcrumb, `Headline` with an accent word, rounded-3xl cards).
>   - Dark variants everywhere. Result cards use the standard card, not `bg-primary` with dark-mode text.
>   - No sideways scrolling at 320 px; touch targets `pointer-coarse:min-h-11`.
>   - Scrollable boxes get `tabIndex={0} role="region" aria-label`.
>   - Labelled inputs; live results use `aria-live="polite"`.
> - **Tests:**
>   - Unit tests for the logic in `tests/tools/<id>/`.
>   - Complete `e2e/<id>.spec.ts`: main flow, no off-origin or non-GET requests, no console errors, no sideways scrolling at 320 px.
>   - Run `npx tsc -b`, `npm run lint`, `npx vitest run`, and the tool's e2e spec plus `e2e/a11y.spec.ts -g "<id>"` against a build. Report the real results.
> - **Finishing:**
>   - Run `npm run generate:readme`.
>   - Don't touch unrelated tools.
>   - Report: route, files changed, dependencies added (and why), features, test results, known gaps.
>   - If the scope is too big, ship a complete core first and list what's deferred.

---

## Status of the 23 proposed tools

| # | Proposed tool | Status in Zykit | Action |
|---|---|---|---|
| 1 | Environment File Validator | **Exists** as `.env Diff` (`env-diff`) | Improve: [I-1](#i-1-env-diff--validator-features) |
| 2 | Gitignore Generator | **Exists** (`gitignore-generator`) | Improve: [I-2](#i-2-gitignore-generator--editable-output) |
| 3 | Git Command Builder | New | [N-1](#n-1-git-command-builder) |
| 4 | Dockerfile Generator | New | [N-2](#n-2-dockerfile-generator) |
| 5 | JSON to Zod / Valibot | Partly exists (`json-to-typescript`, `json-to-code`) | Improve: [I-3](#i-3-json-to-code--zod-and-valibot-output) |
| 6 | TypeScript Playground Utilities | Partly covered: JS Runner runs TypeScript; Learn has a TypeScript subject | Low priority: [N-9](#n-9-typescript-type-explorer-low-priority) |
| 7 | Semantic Versioning Calculator | **Exists** (`semver-checker`: compare, sort, ranges, bumps) | Verify only: [C-1](#already-covered) |
| 8 | Webhook Payload Builder | New | [N-3](#n-3-webhook-payload-builder) |
| 9 | Nginx Configuration Generator | **Exists** (`nginx-config-generator`) | Small improvement: [I-4](#i-4-nginx-config-generator--editable-output-and-value-checks) |
| 10 | Code Complexity Analyzer | New | [N-7](#n-7-code-complexity-analyzer) |
| 11 | SQL EXPLAIN Plan Visualizer | New | [N-5](#n-5-postgresql-explain-visualizer) |
| 12 | Local Mock API Generator | New (related: `mock-data-generator`) | [N-4](#n-4-mock-api-generator) |
| 13 | API Dependency Mapper | New (do after OpenAPI Designer) | [N-8](#n-8-openapi-dependency-mapper) |
| 14 | JSON Path Explorer | **Mostly exists**: `json-tree-viewer` (tree, copy JSONPath) + `jsonpath-query` | Improve: [I-5](#i-5-json-tree-viewer--path-formats-and-go-to-path) |
| 15 | Architecture Diagram Builder | New (large) | [N-10](#n-10-architecture-diagram-builder-large) |
| 16 | Regex Visual Explainer | Partly exists: Regex Tester lists tokens | Improve: [I-6](#i-6-regex-tester--structure-tree-explainer) |
| 17 | Web Performance Trace Viewer | **Exists** as `HAR Viewer` (`har-viewer`) | Improve: [I-7](#i-7-har-viewer--redaction-and-redacted-export) |
| 18 | Visual PostgreSQL Query Builder | **Scaffold only** (`postgres-query-builder`, placeholder page; docs test fails) | Build: [N-6](#n-6-visual-postgresql-query-builder) |
| 19 | OpenAPI / Swagger Designer | New | [N-11](#n-11-openapi-designer) |
| 20 | JSON Schema Builder | Partly exists: `json-schema` validates and infers | Improve: [I-8](#i-8-json-schema--visual-builder-tab) |
| 21 | Docker Compose Generator | Partly exists: `docker-compose-converter` (docker run ↔ Compose) | Improve: [I-9](#i-9-docker-run--compose--service-builder-and-templates) |
| 22 | API Request Builder | Partly exists: `curl-converter` (cURL ↔ fetch/axios/Node/Python) | Improve: [I-10](#i-10-curl--fetch--request-builder-form) |
| 23 | SQL Schema Visualizer | New (pairs with N-6) | [N-12](#n-12-sql-schema-visualizer) |

### Suggested order

**Quick wins first** (small, contained):

- [x] I-2 Gitignore: editable output
- [x] I-1 .env Diff: validator features
- [x] I-5 JSON Tree Viewer: path formats
- [x] I-3 JSON to Code: Zod and Valibot
- [x] I-7 HAR Viewer: redaction
- [x] I-4 nginx: editable output
- [x] N-1 Git Command Builder
- [x] N-2 Dockerfile Generator
- [x] N-3 Webhook Payload Builder

**Medium:**

- [x] I-6 Regex Tester: structure tree
- [x] I-8 JSON Schema: builder tab
- [x] I-9 Compose: service builder
- [x] I-10 cURL: request builder
- [x] N-4 Mock API Generator
- [x] N-5 EXPLAIN Visualizer
- [x] N-6 PostgreSQL Query Builder (built by another session; e2e + a11y verified)

**Large:**

- [x] N-11 OpenAPI Designer
- [x] N-8 OpenAPI Dependency Mapper
- [x] N-12 SQL Schema Visualizer
- [ ] N-7 Code Complexity Analyzer
- [x] N-10 Architecture Diagram Builder
- [ ] N-9 TypeScript Type Explorer

**Playgrounds** (hands-on practice; see [Playgrounds](#playgrounds)):

- [x] P-1 Git Playground
- [ ] P-2 SQL Playground
- [ ] P-3 Linux Shell Playground
- [ ] P-4 Docker Playground
- [ ] P-5 CSS Flexbox & Grid Playground
- [ ] P-6 Kubernetes (kubectl) Playground
- [ ] P-7 HTTP / REST API Playground
- [ ] P-8 Redis Playground

---

## Improvements to existing tools

### I-1. .env Diff: validator features

Extend `src/tools/env-diff/` (rename the tool to ".env Validator & Diff" if it reads better; keep the id `env-diff`). First read what it already does: parsing, syntax errors, duplicates, masked diff, secret hints, `.env.example` generation. Then add only what's missing:

- **Required keys:** paste a required-key list, or use a template `.env.example`, to report missing required variables with their line numbers.
- **Key names only:** compares keys without reading or showing any value.
- **Lint warnings with line numbers:** empty key, whitespace around `=`, an unquoted value with a trailing space, an unclosed quote, `export` mixed with plain lines, a value that looks like an accidental second assignment (`A=B=C`).
- **Normalized file download:** sorted keys optional, consistent quoting. Show a diff of what changed and never silently change a value.
- **Sanitized report:** copy or export, with values masked.
- **Honest limits:** say clearly that syntax checks can't prove a value is right for an app, and which dotenv features aren't emulated (variable expansion, multiline edge cases).
- **Tests:** comments, quoting, duplicates, blank values, malformed lines, required keys, key-only mode.

### I-2. Gitignore Generator: editable output

Extend `src/tools/gitignore-generator/`:

- **Editable output:** the generated `.gitignore` becomes an editable `CodeArea` with a Reset button.
- **Grouped list:** show patterns by section, with a short explanation per group and a remove button per entry.
- **Updates keep edits:** keep the user's edits when presets change. Either merge, or warn before regenerating.
- **Starter preset combinations:** e.g. "React + Node + VS Code + macOS".
- **Help tip:** `.gitignore` only affects untracked files. Optionally show `git rm -r --cached <path>` with a clear warning that it changes the index.
- **Tests:** combining presets, deduplication, preserving comments and headings, editing then regenerating.

### I-3. JSON to Code: Zod and Valibot output

Extend `src/tools/json-to-code/`, which already reuses the shape inference from `json-to-typescript`:

- **New output languages:** **Zod** and **Valibot**, with no new dependency (generate source text only).
- **Options:**
  - Schema name and exported const/type (`z.infer` / `v.InferOutput`).
  - Optional fields, from keys missing in some array items, editable.
  - Nullable fields.
  - Strict objects (`z.strictObject` / `v.strictObject`).
- **Valid API calls only:** check the generated code against the libraries' current APIs, and pin which major version you target in the docs.
- **No execution:** never run the generated code. Explain that one sample can't capture every optional field or union.
- **Tests:** nested objects, arrays, null, empty arrays/objects, names that need quoting, and both libraries.

### I-4. nginx Config Generator: editable output and value checks

Read `src/tools/nginx-config-generator/` first (it already has presets and a testing checklist). Add:

- **Editable output:** the generated config becomes editable, with Copy and Download keeping the edits.
- **Input validation:**
  - domain names;
  - upstream `host:port`;
  - paths, with no spaces or `;`;
  - body size format.
  - Reject characters that would break or inject directives, and add tests for this escaping.
- **Common-mistake warnings:** SPA fallback without `try_files`, missing `proxy_set_header Host`, caching on dynamic locations, `ssl_protocols` below TLS 1.2.

### I-5. JSON Tree Viewer: path formats and go-to-path

Extend `src/tools/json-tree-viewer/` instead of adding a separate JSON Path Explorer:

- **Path formats for the selected node:**
  - JSONPath (`$.users[0].email`, using bracket notation for awkward keys);
  - JSON Pointer (`/users/0/email`, RFC 6901 with `~0` and `~1` escaping);
  - JavaScript optional chaining (`data?.users?.[0]?.["first name"]`).
- **Copy buttons:** for each format and for the value.
- **Go to path:** accept any of the three formats, then expand and scroll to the node.
- **Search toggle:** search keys, values, or both.
- **Tests:** escaping keys with dots, spaces, quotes, `/`, `~`, and unicode; arrays; empty containers; round trip from path to node.

### I-6. Regex Tester: structure tree explainer

Extend `src/tools/regex-tester/`, which already lists tokens, with an **Explain** tab:

- **A real parser:** your own recursive-descent parser for JavaScript regex syntax, honouring the `u` and `v` flags. Cover literals, escapes, character classes (including nested `v`-mode sets), groups (capturing, named, non-capturing), lookarounds, backreferences, quantifiers (greedy, lazy), anchors, alternation and flags.
- **Display:** a collapsible tree plus a plain-English explanation per node.
- **Errors:** precise error positions using `textpos`.
- **Hints:** short greedy vs lazy and capture examples.
- **Scope:** state clearly that this is JavaScript's flavour of regex only.
- **Tests:** escaped characters, nested groups, classes with `]` and `-`, lookarounds, quantifier edge cases, malformed patterns.

### I-7. HAR Viewer: redaction and redacted export

Extend `src/tools/har-viewer/`:

- **Hidden by default:** `Cookie`, `Set-Cookie`, `Authorization`, `Proxy-Authorization`, API-key-like headers, token-like query parameters, and post bodies. Add a per-field reveal toggle and a global "Show sensitive values" switch.
- **Redacted export:** a deliberate "Download redacted HAR" that replaces those values with `[REDACTED]`, keeping the file valid HAR, so it's safe to share with support.
- **Missing metrics:** mark them as "n/a" (`-1` timings, missing sizes) rather than 0.
- **Tests:** redaction (headers, cookies, query parameters, `postData`), missing timings, failed requests (status 0), summary totals.

### I-8. JSON Schema: visual builder tab

Extend `src/tools/json-schema/`, which already validates and infers schemas, with a **Builder** tab:

- **Property tree:** add, rename, delete and reorder properties.
- **Per property:**
  - type (string, number, integer, boolean, null, object, array);
  - required, description, default;
  - enum and const;
  - constraints: min/max, length, pattern, format;
  - `items` for arrays, and `additionalProperties`.
- **Live sync:** keep the generated schema in sync both ways. Builder edits update the JSON, and pasted JSON is loaded into the builder where it fits; show "edit as JSON only" for unsupported keywords.
- **Starting point:** infer an initial builder state from a pasted example. The validator already supports this.
- **Draft:** target draft 2020-12, and never mix in draft-07-only keywords.
- **Tests:** nested objects, arrays, required fields, constraints, unsupported keywords that are preserved, round trips.

### I-9. docker run ↔ Compose: service builder and templates

Extend `src/tools/docker-compose-converter/`, or add a "Builder" mode to it:

- **Visual service list:** image or build context, ports, volumes, environment variables, networks, restart policy, healthcheck, `depends_on` (with `condition: service_healthy`).
- **Templates:**
  - frontend + API;
  - API + PostgreSQL;
  - API + Redis;
  - full development stack.
  - Use placeholder credentials marked "local development only".
- **`.env.example`:** generate one for the variables used, never with real secrets.
- **Summary:** a table of ports, volumes and dependencies, with warnings for duplicate host ports, a missing `depends_on` target, or a named volume that isn't declared.
- **Import:** reuse the existing YAML parsing. Say clearly that validation here doesn't guarantee Docker will accept or run the file.
- **Tests:** serialization, port conflicts, dependencies, volumes, round trip through import.

### I-10. cURL ↔ Fetch: request builder form

Extend `src/tools/curl-converter/` with a **Request builder** form:

- **Inputs:** method, URL with a query-parameter table, a headers table, and auth helpers (Bearer, Basic, API key in a header or the query).
- **Body:** JSON (validated), text, URL-encoded form, or multipart (files are placeholders).
- **Two-way sync:** the form and the cURL/fetch/axios/Python outputs stay in sync. A pasted cURL fills the form, and unsupported flags are listed, never dropped silently.
- **Hidden secrets:** token and auth values are hidden by default.
- **No Send button:** the site's security policy (`connect-src 'self'`) blocks requests to other sites anyway. Say this plainly in the docs instead of offering a button that can't work.
- **Tests:** query encoding, header names, building auth headers, round trip from cURL to form to cURL.

---

## New tools

### N-1. Git Command Builder

Category **DevOps & Config**, id `git-command-builder`.

- **Command areas:** status/log, branches, commits, remotes, stash, merge/rebase, cherry-pick, tags, undo/recovery, and cleanup.
- **Forms with validation:** branch names (Git's ref-name rules), commit hashes, remotes and messages.
- **Output:** the command, a part-by-part plain-English explanation, the expected effect, and a badge: Read-only / Changes working files / Rewrites history / Destructive.
- **Destructive commands:** `reset --hard`, `push --force`, `clean -fdx`, `branch -D` and similar get a prominent warning and safer alternatives (`--force-with-lease`, `git stash` first, `clean -n` dry run, `reflog` recovery).
- **Quoting:** shell-quote arguments conservatively, and note the differences between POSIX shells and PowerShell.
- **Scenarios:** "Undo my last commit but keep changes", "Rename a branch everywhere", "Recover a deleted branch".
- **Never runs anything.**
- **Tests:** command building per area, required fields, quoting, risk classification.

### N-2. Dockerfile Generator

Category **DevOps & Config**, id `dockerfile-generator`.

- **Presets:** Node.js API, React/Vite SPA (built, then served by nginx), Angular SPA, Python, FastAPI, Django, Java (Maven/Gradle), Go (static binary in a minimal image), and static sites.
- **Questions per preset:** only the relevant ones: runtime version, package manager, build and start commands, port, working directory, multi-stage yes/no.
- **Output:**
  - layers ordered for caching;
  - a non-root user;
  - `HEALTHCHECK` (optional);
  - `.dockerignore` as a second output.
  - Each instruction gets an explanation, and assumptions are clearly marked.
- **Versions:** keep runtime versions in one data file with a "last reviewed" date, and never claim they're the latest.
- **No secrets:** never bake secrets into the image. Use `ARG`/`ENV` placeholders and explain runtime injection and BuildKit secrets.
- **Tests:** one per template family, and how user values flow into the output.

### N-3. Webhook Payload Builder

Category **Network & HTTP**, id `webhook-payload-builder`.

- **Request parts:** event name, method, headers table, content type and JSON body. Presets: user.created, payment.succeeded, order.updated, and a custom event. Use fictional data, reusing `mock-data-generator` features if they fit.
- **Signature header (optional):** HMAC-SHA256 of the body with a test secret via WebCrypto (Stripe/GitHub style). Show the exact string that was signed.
- **Outputs:** JSON validation with `textpos` errors, a cURL command (reuse `curl-converter`'s generators), and a fixture JSON download.
- **No sending:** the security policy blocks it, and the docs should say so.
- **Tests:** payload validation, header formatting, signature against a known vector, cURL output.

### N-4. Mock API Generator

Category **Data**, id `mock-api-generator`.

- **Collections:** a collection of endpoints, each with method, path (with `:param` / `{param}` support), status, headers and a JSON response. Sample collections: users, products and tasks.
- **Validation:** paths, JSON bodies, and duplicate method + path pairs.
- **Exports, only formats you've checked against their docs:**
  - fixture JSON files (ZIP);
  - a `json-server` `db.json` for collection-style APIs;
  - an OpenAPI 3.1 document that Prism can serve.
- **Projects:** save to `localStorage` through `shared/lib/store.ts`; import/export the tool's own versioned JSON.
- **Honest scope:** no live server. Say clearly that the tool exports configuration and doesn't host anything.
- **Tests:** route validation, duplicate detection, every export format, the project round trip.

### N-5. PostgreSQL EXPLAIN Visualizer

Category **Data**, id `sql-explain-visualizer`.

- **Input:** PostgreSQL `EXPLAIN` text format and `EXPLAIN (FORMAT JSON)` (with ANALYZE and BUFFERS when present).
- **Plan view:** a collapsible tree with node type, relation and index, estimated cost and rows, actual time, rows and loops, rows removed by filter, and buffers. Estimates and actuals are clearly separated, and missing metrics show "n/a".
- **Highlights:** the most expensive nodes (exclusive time = total minus children), large estimate-vs-actual row misestimates, and sorts spilling to disk.
- **Node explanations:** Seq Scan, Index Scan, Index Only Scan, Bitmap Heap Scan, Nested Loop, Hash Join, Merge Join, Sort, Aggregate, and so on, without calling any of them inherently bad.
- **Never connects to a database.**
- **Tests:** fixtures for text and JSON, nested plans, missing ANALYZE data, malformed input.

### N-6. Visual PostgreSQL Query Builder

Category **Data**, id `postgres-query-builder`. **The scaffold already exists:** replace the placeholder page, docs and README.

**Core version first:**

- **Schema editor:** tables, columns, PostgreSQL types, PK/FK/unique/not-null/default, with stable ids. It can be a form-based editor with a relationship list; a draggable canvas is optional later.
- **SELECT builder:** columns and aliases; INNER/LEFT/RIGHT/FULL joins with conditions; WHERE with nested AND/OR groups; DISTINCT; GROUP BY; HAVING; aggregates; ORDER BY; LIMIT and OFFSET.
- **Generator:** a pure SQL generator with correct identifier quoting and literal escaping (reuse `json-to-sql`'s PostgreSQL escaping). Note that applications should use parameterized queries.
- **DDL mode:** CREATE TABLE, constraints, indexes, and FKs ordered by dependency (circular FKs become `ALTER TABLE` at the end).
- **Projects:** sample schemas (e-commerce, blog, clinic, projects). Save/load locally and import/export versioned JSON.

**Never executes SQL.**

**Tests:** joins, nested filters, quoting, aggregates, DDL ordering, circular FKs, invalid configurations.

### N-7. Code Complexity Analyzer

Category **Code**, id `code-complexity-analyzer`.

- **Languages:** JavaScript and TypeScript.
- **Parser:** a real parser. Check whether an existing dependency can produce an AST (sucrase can't). Otherwise add the smallest maintained parser, such as `acorn` + `acorn-typescript` or `@babel/parser`: justify the choice, run `npm audit`, and load it lazily.
- **Per function:** lines, nesting depth, and cyclomatic complexity (clearly defined: `if`, `?:`, `case`, loops, `catch`, `&&`, `||`, `??`).
- **Display:** highlight the responsible ranges, with configurable thresholds and a top-10 list.
- **Syntax errors:** show them without crashing. Run parsing in a worker with a time limit.
- **Never call it a quality score.**
- **Tests:** branches, loops, `switch`, logical operators, nested and arrow functions, classes, comments, malformed code.

### N-8. OpenAPI Dependency Mapper

Category **Network & HTTP**, id `openapi-dependency-mapper`. Do this after N-11 and reuse its parser.

- **Input:** OpenAPI 3.x JSON/YAML (the `yaml` package is installed).
- **Extract:** paths, operations, tags, operation ids, parameters, request and response schemas, and `$ref` links.
- **Graph:** an SVG graph (no heavy graph library unless justified) or a grouped map of operations to schemas, with filters (tag, method, path, schema), search and a details panel.
- **Reports:** unresolved `$ref`s and unsupported constructs. Never fetch remote `$ref`s.
- **Export:** the summary as Markdown/JSON.
- **Tests:** shared schemas, nested refs, missing refs, invalid input.

### N-9. TypeScript Type Explorer (low priority)

Category **Code**. Consider this as Learn content in the TypeScript subject first: the guided lessons there may cover it.

If it's built as a tool:

- **Guided, editable examples:** `keyof`, `typeof`, indexed access, unions and intersections, generics, conditional, mapped and template-literal types, and the built-in utility types.
- **Real type checking:** only via a lazily loaded TypeScript compiler (large, so measure the bundle first). Otherwise label every output as an illustration, not compiler output.

### N-10. Architecture Diagram Builder (large)

Category **Code** or **Productivity**, id `architecture-diagram-builder`.

- **Editor:** an SVG canvas with draggable nodes (frontend, service, database, cache, queue, external API, generic), labelled directional edges, groups/boundaries, undo/redo, zoom/pan and fit-to-view.
- **Keyboard support:** move the selected node with the arrow keys, Delete removes it, plus a properties panel.
- **Saving:** a versioned JSON format kept in `localStorage`, with import validation. Never inject imported SVG or HTML.
- **Export:** Mermaid flowchart (escape labels correctly), plus SVG/PNG (built from the internal model, not from user markup).
- **Samples:** web app, queue-based system, frontend/API/database.
- **Tests:** serialization, import validation, Mermaid escaping, undo/redo.

### N-11. OpenAPI Designer

Category **Network & HTTP**, id `openapi-designer`.

- **Forms:** info, servers, tags, paths, operations, parameters, request bodies, responses, headers, reusable component schemas, and `$ref`. Reuse the JSON Schema builder from I-8 for schemas.
- **Live document:** an OpenAPI 3.1 document in JSON and YAML (the `yaml` package). Import with validation, listing the constructs that aren't supported.
- **Preview:** per-endpoint documentation with example requests and responses (reuse `mock-data-generator` for examples).
- **Hands off N-8:** a "Map dependencies" link sends the spec to the dependency mapper.
- **Never fetches remote refs.**
- **Tests:** serialization, refs, required fields, round trips, invalid specs.

### N-12. SQL Schema Visualizer

Category **Data**, id `sql-schema-visualizer`. Pairs with N-6, so share its schema model.

- **Input:** PostgreSQL DDL: `CREATE TABLE`, column constraints, `PRIMARY KEY`/`FOREIGN KEY`/`UNIQUE`, `CREATE INDEX`, and `ALTER TABLE … ADD CONSTRAINT`.
- **Parser:** your own tokenizer-based parser for that subset. List what's supported, and report unsupported statements with line numbers instead of guessing.
- **Diagram:** an SVG entity-relationship diagram with pan/zoom, fit, search, and highlighting of connected tables.
- **Relationships:** only explicit foreign keys are confirmed. Name-based guesses are optional and labelled "suggestion".
- **Export:** SVG/PNG, plus Mermaid `erDiagram`. "Open in Query Builder" reuses the schema model.
- **Tests:** common DDL, quoted identifiers, composite keys, multiple statements, unsupported syntax.

---

## Playgrounds

Hands-on sandboxes where people type real commands and see what happens, with nothing to install and nothing that can break. They teach better than reference pages, and they pair with the Learn section (link each one from the matching Learn topics, and back).

**Rules for every playground** (add to the shared instructions):

- **Build on P-1.** `src/tools/git-playground/` is the reference: a pure `run(state, line) → { state, lines }` engine where a failed command leaves the state untouched, a `Terminal` component (prompt, ↑/↓ history, quick-command buttons, colour-coded output, a plain-English tip after each command), guided **challenges** (setup script, goal `check`, hints, a clickable solution, solved state in `localStorage`) and **free play**. The second playground to need the terminal moves `Terminal` into `src/shared/ui/` (per AGENTS.md: promote shared code when a second tool needs it).
- **Be honest about simulation.** Real containers, clusters and servers can't run in a browser. Say "simulated" on the page and in the docs, model the behaviour people actually rely on, and list what's simplified in Limits. Never claim a command ran somewhere real.
- **Real errors teach.** Refuse what the real tool refuses, with its real message plus a plain-English line on why and what to do.
- **Tests:** unit-test the engine, and run **every challenge's solution** in a test to prove it passes its own `check` (see `tests/tools/git-playground/`). E2E: solve one challenge by typing, free play, no network, 320 px.

### P-1. Git Playground ✅ done

Category **DevOps & Config**, id `git-playground`. A simulated repository with a live commit graph, a Files panel (edit, stage, create), 8 challenges (first commit, branch and merge, undo a commit, merge conflict, rebase, stash, revert a pushed commit, cherry-pick) and free play. Supports `init, status, add, rm, commit, log, diff, show, branch, switch, checkout, restore, merge, rebase, reset, revert, cherry-pick, stash, tag` and a pretend remote (`push`, `pull`, `fetch`). Known gaps: whole-file merges, no interactive rebase.

### P-2. SQL Playground (recommended next)

Category **Data**, id `sql-playground`. The only playground that can run the **real thing**: SQLite through the existing SQL worker (`src/tools/csv-sql/workers/sql.worker.ts`, sql.js: the one WebAssembly exception in the security policy), so reuse it rather than adding an engine.

- **Sample databases:** a small shop (customers, products, orders, order_items), a school and a movies set, each loadable in one click and resettable. Show the schema as a table list with columns and keys (reuse `sql-schema-visualizer`'s model if it fits).
- **Editor + results:** run the statement under the cursor or all; result grid with row counts and timing; errors with line/column via `textpos`. `INSERT/UPDATE/DELETE` show "N rows affected"; a **Reset database** button undoes everything.
- **Challenges:** SELECT and WHERE, sorting and LIMIT, JOINs (inner vs left), GROUP BY and HAVING, subqueries, a window function, an UPDATE with a safe WHERE. `check` compares the learner's result set to the expected one (order-insensitive unless the task says "sort").
- **Honest scope:** it's SQLite; note where PostgreSQL/MySQL differ (types, `ILIKE`, `LIMIT/OFFSET` vs `TOP`). Link "Format" to `sql-formatter` and "Build visually" to `postgres-query-builder`.
- **Tests:** each challenge's solution passes its check; reset restores the sample data; errors carry positions.

### P-3. Linux Shell Playground

Category **DevOps & Config**, id `linux-playground`. A simulated filesystem and shell for the commands every developer needs.

- **Filesystem:** an in-memory tree with a home folder of sample files (logs, a CSV, a config, a script). Paths: absolute, relative, `~`, `.`, `..`.
- **Commands:** `pwd, ls (-l, -a), cd, mkdir (-p), touch, cat, head, tail, cp, mv, rm (-r), echo, wc, grep (-i, -n, -r), find (-name), sort, uniq, cut, chmod, which, history, clear`, redirects (`>`, `>>`) and pipes (`|`). `chmod` shows the permission bits (link to `chmod-calculator`).
- **Safety lesson:** `rm -rf /` and `sudo` are refused with an explanation of why they're dangerous.
- **Challenges:** find your way around, create a project folder structure, find errors in a log with `grep`, count lines, move and rename files, fix a script's permissions, a pipe that finds the top 3 IPs in an access log.
- **Tests:** path resolution, each command's flags, pipes and redirects, every challenge solution.

### P-4. Docker Playground

Category **DevOps & Config**, id `docker-playground`. A simulated Docker host (no real containers: say so).

- **State:** images (a small catalog: nginx, node, postgres, redis, python, alpine with tags), containers (id, name, image, status, ports, env, mounts, restart policy), volumes and networks.
- **Commands:** `docker pull, images, run (-d, -p, -e, -v, --name, --rm, --network), ps (-a), stop, start, restart, rm (-f), logs (-f shows canned output), exec (simulated shell for a few commands), inspect, rmi, volume create/ls/rm, network create/ls/connect, system prune`, plus `docker build` from a Dockerfile written in the page.
- **Visuals:** a host diagram (containers as boxes with status colour, port arrows from host to container, volumes as cylinders, network groupings), and for `build`, the Dockerfile's layers with which ones were cached and why one changed line rebuilds everything after it.
- **Teaching moments:** port already in use, removing a running container, data lost without a volume, containers on different networks can't reach each other, `latest` isn't a version.
- **Challenges:** run nginx on port 8080, keep Postgres data with a volume, connect an app container to a database by name on a network, fix a slow build by reordering the Dockerfile, clean up stopped containers. Link "Generate" to `dockerfile-generator` and Compose to `docker-compose-converter`.
- **Tests:** run-option parsing, port conflicts, volume persistence across `rm`, layer cache invalidation, every challenge solution.

### P-5. CSS Flexbox & Grid Playground

Category **Web**, id `css-layout-playground`. Visual, not a terminal: edit container and item properties and watch boxes move.

- **Flexbox:** direction, wrap, justify-content, align-items, align-content, gap; per item grow, shrink, basis, order, align-self.
- **Grid:** template columns/rows (`repeat`, `fr`, `minmax`, `auto-fit/auto-fill`), gap, areas, per-item placement and spans; grid lines and area names drawn on top.
- **Output:** the generated CSS, updated live, with a one-line explanation of each property; copy button. Add/remove items, resize the container to see responsive behaviour.
- **Challenges:** centre a box, a navbar with the logo left and links right, a card grid that fills the row, a holy-grail layout with areas. `check` compares computed item positions to the target.
- **Tests:** CSS generation from state, challenge checks; e2e verifies layouts by bounding boxes.

### P-6. Kubernetes (kubectl) Playground

Category **DevOps & Config**, id `kubernetes-playground`. A simulated cluster (a small, honest model: no scheduler details, no real networking).

- **Objects:** Deployments, ReplicaSets, Pods, Services, ConfigMaps, Namespaces.
- **Commands:** `kubectl get / describe / apply -f / delete / scale / rollout status / rollout undo / logs / create namespace`, plus `-n` and `-o yaml`. `apply` takes YAML written in the page and validates it with `kubernetes-yaml-checker`'s features.
- **Visuals:** Deployment → ReplicaSet → Pods tree with pod status, and a Service pointing at the pods its selector matches (mismatched labels show zero endpoints, the classic bug).
- **Teaching moments:** delete a pod and watch it come back; a bad image tag gives `ImagePullBackOff`; a rolling update replaces pods gradually; `rollout undo`.
- **Challenges:** deploy nginx with 3 replicas, expose it with a Service, fix a Service whose selector doesn't match, roll out a new version and roll it back.
- **Tests:** apply/update semantics, selector matching, rollout history, every challenge solution.

### P-7. HTTP / REST API Playground

Category **Network & HTTP**, id `api-playground`. Learn HTTP by calling a **fake API that runs inside the page** (the security policy blocks real requests, and that's the point: nothing leaves the browser).

- **Mock server:** in-page handlers for a small REST API (users, todos) with real behaviour: CRUD, validation errors (400/422), auth with a fake token (401/403), not found (404), conflicts (409), rate limiting (429), pagination and filtering. Reuse `mock-api-generator`'s collection model where it fits.
- **Request builder:** method, URL with query params, headers, JSON body; the response shows status (linked to `http-status`), headers, body and timing. Every request also shows the equivalent `curl` (reuse `curl-converter`'s generators).
- **Challenges:** list users, create one, handle a validation error, log in and call a protected endpoint, update with PATCH vs PUT, page through results, respect `Retry-After` on 429.
- **Tests:** the mock server's status codes and validation, every challenge solution.

### P-8. Redis Playground

Category **Data**, id `redis-playground`. A simulated Redis with a command line and a live key browser.

- **Types and commands:** strings (`SET` with `EX/NX`, `GET, INCR, DECR, APPEND`), keys (`DEL, EXISTS, EXPIRE, TTL, PERSIST, KEYS, SCAN, TYPE, RENAME`), lists (`LPUSH, RPUSH, LPOP, RPOP, LRANGE, LLEN`), hashes (`HSET, HGET, HGETALL, HDEL, HINCRBY`), sets (`SADD, SMEMBERS, SISMEMBER, SINTER, SUNION`), sorted sets (`ZADD, ZRANGE … WITHSCORES, ZRANK, ZINCRBY`), `MULTI/EXEC`, `FLUSHALL`.
- **Expiry:** TTLs count down in real time in the key browser. Real Redis error messages (`WRONGTYPE …`).
- **Challenges:** cache a value for 60 s, a page-view counter, a queue with lists, a leaderboard with sorted sets, a rate limiter with `INCR` + `EXPIRE`, a transaction. Link to the caching topic in Learn.
- **Tests:** each command's semantics and errors, expiry with a fake clock, every challenge solution.

**Also considered, already covered:** Regex (`regex-tester`), JavaScript/TypeScript (`js-runner`), JSONPath (`jsonpath-query`), cron (`cron-builder`). They're interactive already; at most they could gain challenges later.

---

## Already covered

- **C-1 Semver Checker** (`semver-checker`) already parses SemVer 2.0.0 (with prerelease and build metadata), checks npm ranges with reasons, sorts/compares, finds max-satisfying versions and previews bumps. **Action:** only verify that prerelease bumps (`premajor`, `preminor`, `prepatch`, `prerelease` with an identifier) exist. If not, add them with tests. No new tool.
