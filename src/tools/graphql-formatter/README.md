# GraphQL Formatter

## Purpose

Formats and minifies GraphQL executable documents and SDL with its own lexer and parser; errors carry line and column. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `GraphqlFormatterPage.tsx` | Page: options, input, output, share state |
| `features/graphql-formatter.ts` | Pure logic |

## Core Logic

`features/graphql-formatter.ts`: `lex()` produces tokens (comments ride on the next token); the `Parser` class builds generic `Node`s (`head(args) tail { body }`) with values, types and directives as normalized strings; `printNode` lays them out (80 columns); `minifyGraphql` re-joins validated tokens.

## Limits

Input 5 MB. Comments are kept only before definitions, members and closing braces; others are counted and reported. Syntax only, no schema validation.

## Tests

- Unit: `tests/tools/graphql-formatter/graphql-formatter.test.ts`. `npm test -- graphql-formatter`
- E2E: `e2e/graphql-formatter.spec.ts`. `npm run test:e2e -- graphql-formatter`

## Known Gaps

Comments in argument lists, blank-line preservation inside selection sets, descriptions on variable definitions.
