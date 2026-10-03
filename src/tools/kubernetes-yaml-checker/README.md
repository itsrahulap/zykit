# Kubernetes YAML Checker

## Purpose

Checks pasted Kubernetes manifests (multi-document YAML) for structural mistakes, broken cross-references and best-practice gaps, with an explanation and a fix snippet per finding. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (accepts `yaml`, shareable) |
| `KubernetesYamlCheckerPage.tsx` | Page: input, resource table, filtered findings |
| `features/kubernetes-yaml-checker.ts` | Pure logic: parsing, checks, sample |

## Core Logic

`check(text)` lazily imports `yaml`, parses with `parseAllDocuments` (`maxAliasCount: 100`), registers each object (unpacking `List`), then runs per-resource checks. Cross-resource checks (selectors, Service ports, Ingress backends, HPA targets, PDBs) look only at the other resources in the same paste and namespace. CronJob schedules use `parseCron`/`describeCron` from `cron-builder`.

## Limits

1 MB input, 300 documents, alias count 100. Not schema-validated; custom resources get structure checks only.

## Tests

- Unit: `tests/tools/kubernetes-yaml-checker/kubernetes-yaml-checker.test.ts`. `npm test -- kubernetes-yaml-checker`
- E2E: `e2e/kubernetes-yaml-checker.spec.ts`. `npm run test:e2e -- kubernetes-yaml-checker`

## Known Gaps

No Helm/Kustomize rendering, no OpenAPI field validation, no Pod Security Admission profiles.
