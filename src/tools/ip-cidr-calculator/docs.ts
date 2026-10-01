import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type an address into **IP / CIDR**: a CIDR such as `192.168.1.10/24` or `2001:db8::/32`, an IPv4 address with a netmask (`10.1.2.3 255.255.255.0` or `10.1.2.3/255.255.255.0`), or a bare IP. Press **Try IPv6** for an IPv6 example.',
    'Read the network details: network, broadcast, netmask and wildcard (for IPv6, the last address), first and last host, usable hosts and total addresses, the class (IPv4) or compressed and expanded forms (IPv6), plus the binary form with the network bits highlighted, the integer and hex value and the reverse DNS name. **Copy CIDR** copies the network.',
    'Check the badge: **Public** or **Special-purpose**, with the range’s name and RFC, for example private (RFC 1918), loopback, documentation or multicast.',
    'Under **Is this IP in the range?**, enter an **IP or CIDR to check** to see whether it lies inside the network.',
    'Use **Split into subnets** by **New prefix** or **Number of subnets**, and **Summarise a list of CIDRs** to merge a list of CIDRs or IPs (one per line) into the fewest covering blocks.',
  ],
  howItWorks:
    'Addresses are converted to integers with JavaScript `BigInt`, so IPv4 (32 bits) and IPv6 (128 bits) use the same exact maths. The network is the address with the host bits cleared by the netmask, and the broadcast or last address has them all set. For IPv4, the network and broadcast addresses don’t count as hosts, except in a `/31` (point-to-point, RFC 3021) or `/32`. IPv6 has no broadcast, so every address in the block is counted.\n\n' +
    'IPv6 input accepts `::` compression, leading zeros, an embedded IPv4 tail (`::ffff:192.0.2.1`), square brackets and a `%zone` suffix, which is ignored. Output is the RFC 5952 canonical form, and the expanded form shows all eight groups. The classification picks the most specific matching block from a built-in table of IANA special-purpose ranges; a block that only partly overlaps them is reported as mixed.\n\n' +
    'Splitting steps through the network in equal blocks. **Number of subnets** rounds up to the next power of two. Summarising sorts the blocks, merges any that overlap or touch, and writes each merged range as the largest aligned CIDR blocks that cover it exactly.',
  limits: [
    'Netmasks are accepted only for IPv4; IPv6 takes a prefix length (0–128). Non-contiguous masks are rejected, and a wildcard mask such as `0.0.0.255` is recognised and the matching netmask suggested.',
    'IPv4 must be four dotted decimal numbers from 0 to 255. Shorthand like `10.1` and hex or octal parts aren’t accepted, and leading zeros are read as decimal.',
    'A split lists up to 256 subnets on the page; larger splits still show the total count.',
    'The summary takes lines, commas or semicolons as separators and ignores text after `#`. Up to 10 invalid entries are listed.',
    'There is no input for an address range written as start–end, and nothing is looked up on the network: reverse DNS is only the name to query, not its result.',
  ],
  privacy:
    'All calculations run in your browser, and nothing is uploaded or saved; the site’s Content Security Policy blocks requests to other servers, so no DNS or WHOIS lookups happen. **Copy share link** puts the address, the IP to check, the split settings and the summary list in the link’s `#` fragment, which browsers don’t send to servers.',
  faqs: [
    {
      question: 'Why does a /24 have 254 usable hosts and not 256?',
      answer:
        'In IPv4 the first address is the network and the last is the broadcast address, so neither can be given to a host. A `/31` and a `/32` are the exceptions, where every address counts.',
    },
    {
      question: 'What does “host bits set” mean?',
      answer:
        'The address you typed isn’t the start of its network, for example `192.168.1.10/24`. The tool still calculates the network (`192.168.1.0/24`) and tells you which one it used.',
    },
    {
      question: 'What is a wildcard mask?',
      answer:
        'The inverse of the netmask, used by Cisco ACLs and OSPF: `0.0.0.255` for a `/24`. It is shown for every IPv4 network, and if you type one where a netmask is expected, the tool suggests the matching netmask.',
    },
    {
      question: 'Why does IPv6 show no broadcast address?',
      answer:
        'IPv6 has no broadcast; it uses multicast instead. The tool shows the **Last address** of the block, and all addresses count as usable.',
    },
    {
      question: 'How does summarising work?',
      answer:
        'Overlapping and adjacent blocks are merged, then each merged range is written as the fewest CIDR blocks that cover exactly those addresses. `192.168.0.0/24` and `192.168.1.0/24` become `192.168.0.0/23`. IPv4 and IPv6 are summarised separately.',
    },
    {
      question: 'Is the IP class still meaningful?',
      answer:
        'Classes A to E are historical; routing has used CIDR prefixes since 1993. The class is shown for reference only, and the network is always worked out from the prefix or netmask you enter.',
    },
  ],
};

export default docs;
