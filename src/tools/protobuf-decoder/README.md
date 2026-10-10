# Protobuf Decoder

## Purpose

Schema-less decoder for protobuf wire format from hex, Base64, Base64URL or a binary file, with optional gRPC framing. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `ProtobufDecoderPage.tsx` | Page: options, input, output, share state |
| `features/protobuf-decoder.ts` | Pure logic |

## Core Logic

`features/protobuf-decoder.ts`: `bytesFromText`, `decodeMessage` (recursive `parse` with BigInt varints, nested-message trial with rollback, string/bytes fallbacks, packed alternatives), `decodeGrpc`, `fieldsToText`. Limits are in `LIMITS`. The page renders the tree with native `<details>`.

## Limits

Depth 16, 50,000 fields, 8 MB file, 10 MB text. Groups unsupported; compressed gRPC frames are not inflated.

## Tests

- Unit: `tests/tools/protobuf-decoder/protobuf-decoder.test.ts`. `npm test -- protobuf-decoder`
- E2E: `e2e/protobuf-decoder.spec.ts`. `npm run test:e2e -- protobuf-decoder`

## Known Gaps

No `.proto` import, no map/enum naming, no gzip frame decompression.
