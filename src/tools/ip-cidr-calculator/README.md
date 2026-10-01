# IP / CIDR Calculator

## Purpose

Calculates IPv4 and IPv6 network details from a CIDR, address + netmask or bare IP, classifies special-purpose ranges, checks membership, splits networks and summarises CIDR lists. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `IpCidrCalculatorPage.tsx` | Page: address input and binary view, network details, membership check, split panel (`SHOWN_SUBNETS = 256`), summary panel, share state, copy shortcut (network CIDR) |
| `features/ip-cidr-calculator.ts` | Pure `BigInt` logic, no DOM: `parseIPv4` / `parseIPv6` / `parseCidr`, `maskToPrefix` / `prefixToMask`, `compressIPv6` / `expandIPv6` / `toBinary` / `binarySplit`, `RANGES` + `classify`, `ipv4Class`, `cidrInfo`, `contains`, `splitByPrefix` / `splitInto`, `rangeToCidrs`, `summarise`, `reverseDns` |

## Core Logic

Both families are plain `bigint` values with a bit width of 32 or 128, so every calculation is shared. `parseCidr` splits on `/` or whitespace; the second part is a prefix (digits) or, for IPv4 only, a dotted netmask checked for contiguity (and diagnosed as a wildcard if its inverse is contiguous). `cidrInfo` derives network / broadcast / hosts, with no network/broadcast exclusion for IPv4 `/31`–`/32` or for IPv6. `classify` picks the longest matching prefix from `RANGES`, or reports the ranges a broader block contains. `summarise` sorts and merges `[start, end]` pairs per family, then `rangeToCidrs` emits the largest aligned blocks greedily.

## Limits

- `splitByPrefix` materialises at most `MAX_SUBNETS = 4096`; the page renders 256.
- `summarise` errors are shown up to 10.
- No start–end range input in the UI (`rangeToCidrs` is only used by `summarise`).

## Tests

- Unit: `tests/tools/ip-cidr-calculator/ip-cidr-calculator.test.ts` (IPv4 CIDR / netmask / bare IP, error messages, IPv6 notations, RFC 5952 compression and expansion, IPv4 and IPv6 network details, `/31` `/32` `/0`, binary split, class and reverse DNS, special-purpose and mixed ranges, membership, split by prefix and count, range → CIDRs, summarising). `npm test -- ip-cidr-calculator`
- E2E: `e2e/ip-cidr-calculator.spec.ts` (netmask input, details and RFC 1918 label, in-range yes/no, split into /26, summary merge, IPv6 compression and documentation range, no off-origin requests, phone layout). `npm run test:e2e -- ip-cidr-calculator`

## Known Gaps

- The membership check answers "No" when the two inputs are different IP versions, without saying why.
- No IPv6 netmask input and no start–end range to CIDR conversion in the UI.
