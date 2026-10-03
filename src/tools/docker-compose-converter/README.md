# docker run ↔ Compose

## Purpose

Converts `docker run` commands into Compose service YAML and Compose files back into `docker run` commands, with warnings for anything that doesn't map. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['yaml']`, `produces: ['yaml', 'code']`, `shareable: true`) |
| `DockerComposeConverterPage.tsx` | Page: input, direction (auto-detect), -d / multiline options, output, warnings and notes, share state |
| `features/docker-compose-converter.ts` | `convert`, `detectDirection`, YAML writer (lazy `yaml` import, `Quoted` scalars → double-quoted) |
| `features/run.ts` | `dockerRunToCompose`: command splitting, flag table and parser, flag → service mapping |
| `features/compose.ts` | `composeToRun`: YAML parse (lazy), dependency order, service → flags, shell quoting |
| `../curl-converter/features/shell.ts` | `tokenizeShell`, `shellQuote`, reused, not copied |

## Core Logic

`splitCommands` cuts the token stream at operators and at each `docker`/`podman` word followed by a subcommand (dropping a preceding `sudo`). `parseArgs` walks the flags using the `FLAGS` table (short/long/takes-value), handling clusters, attached values and `--x=y`; unknown flags warn. `buildService` maps flags to a plain object tree in a fixed key order and records named volumes and networks; `Quoted` marks strings the writer must double-quote (ports, `no`, cpus). `composeToRun` parses with `merge: true`, orders services by `depends_on`, and emits flags per key (long-form ports and volumes included), quoting each word with `shellQuote`.

## Limits

- Input over 1,000,000 characters is refused. Only `docker run` is converted; flags/keys without a counterpart warn and are dropped.
- Networks become `external: true`; names are not project-prefixed. No `.env` interpolation.

## Tests

- Unit: `tests/tools/docker-compose-converter/docker-compose-converter.test.ts` (flag mapping, top-level volumes/networks, quoting, health/resources, `--mount`, multiple commands, errors, Compose → run, round trip). `npm test -- docker-compose-converter`
- E2E: `e2e/docker-compose-converter.spec.ts`. `npm run test:e2e -- docker-compose-converter`

## Known Gaps

- No `docker network create` / `docker volume create` / `docker build` conversion; `-P`, `--pids` style resource flags and `--label-file` are not mapped.
- No Compose `extends`, `include` or profile handling; `x-` extension keys are ignored.
- Environment `${VAR:-default}` is not expanded.
