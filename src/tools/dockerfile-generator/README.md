# Dockerfile Generator

## Purpose

Generates a Dockerfile and a `.dockerignore` for common stacks (Node.js API, React/Vite and Angular SPAs, Python, FastAPI, Django, Java with Maven or Gradle, Go, static sites), with a reason for every instruction and a list of assumptions to check. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `DockerfileGeneratorPage.tsx` | Stack picker, preset-specific fields with inline errors, Dockerfile output, `.dockerignore` card, notes, line-by-line table |
| `features/dockerfile-generator.ts` | `VERSIONS` (+ review date), `PRESETS`, `defaultsFor`, `validate`, `generate` |

## Core Logic

`generate` validates first (version number, port 1–65535, absolute workdir, single-line commands, safe folder and health paths) and returns no Dockerfile while any field is invalid, so a newline can't inject an instruction. Each preset family appends `Line`s (`text` + `why`): dependency manifests are copied and installed before the source for layer caching; Node and Python use a build stage and a fresh final stage; SPAs build with Node and serve with `nginx-unprivileged` plus a heredoc `default.conf` with a `try_files` fallback; Java builds with Maven/Gradle and runs on a Temurin JRE; Go builds a `CGO_ENABLED=0` binary for `distroless/static:nonroot`. Every final stage runs as a non-root user. Start commands become exec form (`JSON.stringify` of the words) unless they contain shell syntax, in which case shell form is used and a note explains why. Health checks use what the image has (`node -e fetch`, `python -c urllib`, busybox `wget`); Java and Go get a note instead. With `comments`, each `why` is written above its line.

## Limits

- Default runtime versions live in `VERSIONS` with `VERSIONS_REVIEWED`; they are not fetched or checked against registries.
- The output was checked by unit tests, not by running `docker build`.
- Python assumes `requirements.txt`; Java assumes one jar in the output folder.

## Tests

- Unit: `tests/tools/dockerfile-generator/dockerfile-generator.test.ts` (every preset generates with reasons, final stages are non-root, `.dockerignore` excludes secrets, notes on secrets and versions, per-template checks, shell-form fallback, comments, validation and newline injection). `npm test -- dockerfile-generator`
- E2E: `e2e/dockerfile-generator.spec.ts`. `npm run test:e2e -- dockerfile-generator`

## Known Gaps

- No Ruby, PHP, .NET or Rust presets.
- No docker-compose output (see the docker run ↔ Compose tool).
