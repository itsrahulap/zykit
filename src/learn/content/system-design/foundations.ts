import type { Topic } from "../../types/content";

export const systemDesignFoundationsTopics: Topic[] = [
  {
    id: "networking-basics",
    title: "Networking Basics",
    level: "beginner",
    description: "IP addresses, packets, ports, TCP vs UDP and the layers that move data between machines.",
    explanation: `
Every distributed system is just computers sending bytes to each other.
To do that, the network needs answers to three questions: **which
machine** (an **IP address**), **which program on that machine** (a
**port**), and **how carefully to deliver the data** (a transport
protocol such as **TCP** or **UDP**).

Data doesn't travel as one big blob. It is cut into small **packets**
(typically up to about 1,500 bytes on Ethernet), each carrying the source
and destination address. Routers forward each packet hop by hop toward
its destination, and the receiver puts them back together.

- **TCP** gives you a reliable, ordered stream of bytes. Lost packets are
  resent, duplicates are dropped, and the sender slows down if the
  network is congested. HTTP/1.1, HTTP/2, SSH and database protocols use
  it.
- **UDP** just sends individual datagrams with no guarantee of delivery
  or order. It's faster to start and has less overhead, so it's used for
  DNS lookups, video calls, games and QUIC (the transport under HTTP/3).
    `.trim(),
    analogy:
      "An IP address is a building's street address, the port is the apartment number, TCP is registered mail (signed for, resent if lost, delivered in order), and UDP is dropping postcards in a mailbox: cheap and fast, but some may never arrive.",
    examples: [
      {
        title: "Inspecting connections from a shell",
        language: "bash",
        code: `# Which IP does this hostname resolve to?
dig +short example.com

# Is anything listening on port 443 there? (TCP handshake test)
nc -vz example.com 443

# Which hops do packets take to get there?
traceroute example.com

# Which ports is my own machine listening on?
lsof -iTCP -sTCP:LISTEN -n -P`,
        walkthrough: [
          { code: "dig +short example.com", explanation: "Turns the name into an IP address. Machines route by IP, not by name." },
          { code: "nc -vz example.com 443", explanation: "Tries to open a TCP connection to port 443 (HTTPS). Success means the three-way handshake completed." },
          { code: "traceroute example.com", explanation: "Lists the routers a packet passes through. Each line is one hop with its round-trip time." },
          { code: "lsof -iTCP -sTCP:LISTEN -n -P", explanation: "Shows the local programs waiting for incoming TCP connections and the ports they own." },
        ],
      },
      {
        title: "TCP vs UDP in Node.js",
        language: "ts",
        code: `import net from "node:net";
import dgram from "node:dgram";

// TCP: open a connection first, then stream bytes in order.
const socket = net.connect(5000, "10.0.0.5", () => {
  socket.write("hello over TCP");
});

// UDP: no connection, just fire a datagram at an address.
const udp = dgram.createSocket("udp4");
udp.send("hello over UDP", 5001, "10.0.0.5", () => udp.close());`,
        explanation:
          "The TCP client must complete a handshake before sending anything. The UDP client sends immediately and never learns whether the datagram arrived.",
      },
    ],
    howItWorks: `
Networking is organised in **layers**. Each layer solves one problem and
relies on the one below it. The OSI model has seven layers, but the
practical **TCP/IP model** has four:

1. **Link** (Ethernet, Wi-Fi): moves frames between machines on the same
   local network using MAC addresses.
2. **Internet** (IP): gives every host an address and routes packets
   across networks. IPv4 addresses are 32 bits (about 4.3 billion, e.g.
   \`203.0.113.7\`); IPv6 addresses are 128 bits (e.g. \`2001:db8::1\`). IP is
   "best effort": packets can be lost, duplicated or reordered.
3. **Transport** (TCP, UDP): adds **ports** (16-bit numbers, 0–65535) so
   many programs can share one IP. TCP adds reliability, ordering and
   congestion control on top of IP; UDP adds almost nothing.
4. **Application** (HTTP, DNS, SMTP, gRPC): the protocol your code
   speaks.

A connection is identified by the 4-tuple **(source IP, source port,
destination IP, destination port)**. Servers listen on well-known ports
(80 HTTP, 443 HTTPS, 22 SSH, 53 DNS, 5432 Postgres); clients get a
temporary **ephemeral port** from the OS.

**The TCP three-way handshake** sets up a connection before any data
flows: the client sends **SYN**, the server replies **SYN-ACK**, the
client answers **ACK**. That costs one full round trip, and TLS on top
adds one more (TLS 1.3) or two (TLS 1.2). This is why reusing
connections (keep-alive, connection pools) matters so much for latency.
Closing uses FIN/ACK, and the side that closes first sits in
**TIME_WAIT** for a while so stray packets from the old connection can't
confuse a new one.
    `.trim(),
    diagram: `
Client                               Server (port 443)
  │ ── SYN (seq=x) ──────────────────▶ │
  │ ◀── SYN-ACK (seq=y, ack=x+1) ───── │   1 round trip
  │ ── ACK (ack=y+1) ────────────────▶ │
  │ ── data (e.g. TLS ClientHello) ──▶ │   connection is open

Layers on the way out:
  HTTP request        (application)
   └ TCP segment      (transport: ports, sequence numbers)
      └ IP packet     (internet: source/destination IP)
         └ Ethernet   (link: MAC addresses)
    `.trim(),
    whyItExists: `
The underlying network is unreliable: links drop packets, routers queue
and reorder them, and paths change. Layering lets each problem be solved
once. IP handles addressing and routing, TCP turns lossy packets into a
reliable stream, and applications can ignore all of that and just read
and write bytes.
    `.trim(),
    whenToUse: `
You use this knowledge whenever you reason about latency (how many round
trips a request needs), choose a protocol (TCP for correctness, UDP when
late data is useless), configure firewalls and security groups (which
ports are open), debug "connection refused" vs "connection timed out",
or size connection pools.
    `.trim(),
    whenNotToUse: `
Don't build your own reliability layer on raw UDP unless you really need
it; QUIC or TCP already solve retransmission and congestion control
correctly. And don't drop down to raw sockets when an application
protocol like HTTP or gRPC already fits; you'd be re-inventing framing,
errors and timeouts.
    `.trim(),
    commonMistakes: [
      "Assuming TCP guarantees the other application processed your message. It only guarantees the bytes reached the remote kernel's buffer; you still need application-level acknowledgements.",
      "Treating TCP as message-based. It is a byte stream, so one write can arrive as several reads (or several writes as one), and you need your own framing (length prefixes or delimiters).",
      "Opening a new connection per request and paying the TCP + TLS handshake every time instead of reusing connections.",
      "Confusing 'connection refused' (host reachable, nothing listening on the port) with a timeout (packets dropped, often by a firewall or a dead host).",
      "Forgetting that private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) are not reachable from the internet without NAT or a load balancer.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Run `nc -vz` against port 443 and port 81 of a public website. Explain the difference in the results." },
      { difficulty: "Medium", prompt: "A client in Mumbai talks to a server in Virginia with a 200 ms round-trip time. How long before the first byte of an HTTPS response arrives on a fresh connection using TLS 1.3, ignoring server processing and DNS? What if the connection is reused?" },
      { difficulty: "Hard", prompt: "Design a framing format for sending variable-length JSON messages over a raw TCP socket, and explain how the receiver handles a message split across two reads." },
    ],
    interviewQuestions: [
      { question: "What's the difference between TCP and UDP?", answer: "TCP is connection-oriented and gives a reliable, ordered byte stream with retransmission, flow control and congestion control. UDP is connectionless and sends independent datagrams with no delivery or ordering guarantees, but with less overhead and no handshake." },
      { question: "What is a port, and why do we need one if we have an IP address?", answer: "An IP address identifies a host; a port (0–65535) identifies a specific program on it. Ports let many services share one IP, and the 4-tuple of IPs and ports identifies each connection." },
      { question: "Walk through the TCP three-way handshake.", answer: "Client sends SYN with its initial sequence number. Server replies SYN-ACK with its own sequence number and acknowledges the client's. Client sends ACK. Both sides now agree on sequence numbers and the connection is open; it costs one round trip." },
      { question: "Why do video calls and games often use UDP?", answer: "For real-time media, a late packet is useless. TCP would stall the whole stream waiting to resend a lost packet (head-of-line blocking). With UDP the app skips or conceals the loss and keeps going." },
      { question: "What are the layers of the TCP/IP model, and what does each do?", answer: "Link (frames on a local network), Internet (IP addressing and routing), Transport (ports, plus reliability for TCP), Application (HTTP, DNS, etc.). Each layer wraps the data from the layer above in its own header." },
      { question: "What is the difference between 'connection refused' and 'connection timed out'?", answer: "Refused means the host answered with a TCP RST because nothing is listening on that port. Timed out means no answer at all: the host is down, unreachable, or a firewall silently drops the packets." },
      { question: "Why is connection reuse so important for latency?", answer: "A new HTTPS connection costs a TCP round trip plus one or two TLS round trips before any data moves. On a 100 ms RTT link that's 200–300 ms of pure setup. Keep-alive and pooling pay it once." },
      { question: "What is head-of-line blocking at the TCP level, and how does HTTP/3 address it?", answer: "TCP delivers bytes strictly in order, so one lost packet stalls all data behind it, even for unrelated HTTP/2 streams sharing the connection. HTTP/3 runs over QUIC (on UDP), which handles loss per stream so other streams keep flowing." },
      { question: "What is TIME_WAIT, and when does it become a problem?", answer: "After actively closing a connection, a socket stays in TIME_WAIT (typically 2×MSL, often 60 s on Linux) so delayed packets can't corrupt a new connection with the same 4-tuple. A client opening many short-lived connections to one destination can exhaust ephemeral ports; the fix is connection reuse." },
      { question: "A load balancer handles 100,000 concurrent connections to one backend IP and port. What limit might it hit?", answer: "Each outbound connection needs a unique 4-tuple, and with fixed source IP, destination IP and port, only the source port varies, giving roughly 28,000–64,000 usable ephemeral ports. Fixes: multiple source IPs, more backend IPs/ports, or connection pooling/multiplexing." },
    ],
    prerequisites: ["client-and-server"],
    relatedTopics: ["dns", "http", "proxy-and-reverse-proxy", "load-balancing", "realtime-communication", "timeouts-retries-and-backoff"],
    keywords: ["ip address", "ipv4", "ipv6", "tcp", "udp", "port", "packet", "three-way handshake", "osi model", "tcp/ip", "quic", "time_wait"],
  },
  {
    id: "dns",
    title: "DNS",
    level: "beginner",
    description: "How human-readable names like example.com are turned into IP addresses, and how that can steer traffic.",
    explanation: `
Computers connect to IP addresses, but people remember names. The
**Domain Name System (DNS)** is the internet's distributed phone book: it
turns a name like \`api.example.com\` into an address like \`203.0.113.7\`.

No single server knows every name. DNS is a **hierarchy**: root servers
know who runs \`.com\`, the \`.com\` servers know who runs \`example.com\`, and
\`example.com\`'s **authoritative** name servers hold the actual records.
Answers are **cached** at every step for a time set by the record's
**TTL** (time to live), so most lookups never leave your machine or your
ISP's resolver.

Because DNS decides which IP a client connects to, it's also a simple
traffic-steering tool: return different IPs to different users to spread
load or send them to the nearest region.
    `.trim(),
    analogy:
      "Asking for directions in a new city: you ask a local guide (the resolver). If they don't know, they ask the tourist office (root), which points them to the district office (.com), which points them to the building manager (authoritative server), who gives the exact address. The guide remembers it for a while so the next person gets an instant answer.",
    examples: [
      {
        title: "Looking up records with dig",
        language: "bash",
        code: `dig +short example.com A        # IPv4 address(es)
dig +short example.com AAAA     # IPv6 address(es)
dig +short www.example.com CNAME
dig +short example.com MX       # mail servers, with priority
dig +short example.com TXT      # SPF, domain verification, etc.

# Follow the full chain from the root servers down:
dig +trace example.com`,
        walkthrough: [
          { code: "dig +short example.com A", explanation: "Asks for the IPv4 address record. Several lines mean several servers the client can pick from." },
          { code: "dig +short example.com AAAA", explanation: "Same question for IPv6." },
          { code: "dig +short www.example.com CNAME", explanation: "An alias: 'www' points to another name, which must then be resolved itself." },
          { code: "dig +short example.com MX", explanation: "Mail exchangers. Lower priority numbers are tried first." },
          { code: "dig +trace example.com", explanation: "Shows each step: root, then .com, then the domain's own name servers." },
        ],
      },
      {
        title: "A zone file for a small service",
        language: "text",
        code: `; name            TTL    type   value
example.com.      300    A      203.0.113.10
example.com.      300    A      203.0.113.11
example.com.      300    AAAA   2001:db8::10
www               3600   CNAME  example.com.
api               60     CNAME  my-lb-123.elb.amazonaws.com.
example.com.      3600   MX     10 mail1.example.com.
example.com.      3600   MX     20 mail2.example.com.
example.com.      3600   TXT    "v=spf1 include:_spf.google.com ~all"`,
        explanation:
          "Two A records give simple round-robin across two servers. The api name has a short 60-second TTL so it can be repointed quickly; stable names like www use an hour.",
      },
    ],
    howItWorks: `
**The resolution chain** for \`api.example.com\`, on a cold cache:

1. The app asks the OS **stub resolver**, which checks its own cache and
   \`/etc/hosts\`.
2. On a miss it asks a **recursive resolver** (your ISP's, or a public one
   like 1.1.1.1 or 8.8.8.8), usually over UDP port 53.
3. The recursive resolver asks a **root server** (13 named root server
   identities, a–m, each served by many anycast instances worldwide). The
   root replies with the name servers for \`.com\`.
4. It asks a \`.com\` **TLD server**, which replies with \`example.com\`'s
   name servers (NS records).
5. It asks the **authoritative server**, which returns the actual record.
6. The resolver caches every answer for its TTL and returns the IP.

**Common record types**
- **A**: name → IPv4 address. **AAAA**: name → IPv6 address.
- **CNAME**: name → another name (an alias). A CNAME can't coexist with
  other records at the same name, so it can't sit at the zone apex
  (\`example.com\` itself); providers offer ALIAS/ANAME or "CNAME
  flattening" for that.
- **MX**: mail servers for the domain, with a priority.
- **TXT**: free text, used for SPF, DKIM, DMARC and domain-ownership
  verification.
- Also: **NS** (delegation), **SOA** (zone metadata), **PTR** (reverse
  lookup), **SRV** (host and port of a service), **CAA** (which CAs may
  issue certificates).

**TTL** is how many seconds a resolver may cache an answer. Short TTLs
(30–60 s) let you fail over quickly but cause more queries; long TTLs
(hours) are cheap and fast but changes propagate slowly. Some resolvers
and clients (notably some JVM configurations) ignore or extend TTLs.

**DNS-based load balancing**: return several A records (round-robin), or
use **GeoDNS / latency-based routing** where the authoritative server
picks the answer based on the resolver's location (or the client subnet
via EDNS Client Subnet) and health checks. It's coarse: clients cache
answers, so traffic shifts only as TTLs expire.
    `.trim(),
    diagram: `
 App ──▶ Stub resolver (OS cache)
              │ miss
              ▼
        Recursive resolver ──1──▶ Root server     "ask .com servers"
        (ISP / 1.1.1.1)    ──2──▶ .com TLD server "ask ns1.example.com"
              │            ──3──▶ Authoritative   "api = 203.0.113.7, TTL 60"
              │ caches answer for TTL
              ▼
 App connects to 203.0.113.7
    `.trim(),
    whyItExists: `
A single central list of every hostname could never handle the
internet's query volume or the rate of changes. DNS splits ownership by
delegation, so each organisation runs its own zone, and caches
aggressively so the root and TLD servers see only a tiny share of
lookups. It also decouples names from addresses: you can move a service
to new machines without changing what users type.
    `.trim(),
    whenToUse: `
Every public service needs DNS. In design work, reach for it to point a
domain at a load balancer or CDN, to fail over between regions, to route
users to their nearest region with GeoDNS, and to do internal service
discovery in simple setups (e.g. Kubernetes cluster DNS).
    `.trim(),
    whenNotToUse: `
Don't rely on DNS alone for fast failover or fine-grained load balancing:
cached answers mean some clients keep hitting a dead IP for minutes. Put
a load balancer behind a stable DNS name for per-request balancing and
health checks, and use anycast or a global load balancer when you need
sub-minute failover.
    `.trim(),
    commonMistakes: [
      "Lowering a TTL at the moment of a migration. Resolvers still hold the old answer for the old TTL, so lower it at least one old-TTL period before the change.",
      "Putting a CNAME at the zone apex, which the DNS spec doesn't allow alongside the required SOA and NS records.",
      "Treating multiple A records as real load balancing. Clients pick and cache unevenly, and there are no health checks unless the DNS provider adds them.",
      "Forgetting that DNS lookups add latency on a cold cache (often tens of milliseconds, sometimes more), and not reusing resolved connections.",
      "Ignoring negative caching: a lookup for a record that doesn't exist yet (NXDOMAIN) is also cached, based on the SOA, so creating it a moment later may not be visible right away.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use `dig +trace` on a domain you use daily and identify the root, TLD and authoritative servers in the output." },
      { difficulty: "Medium", prompt: "You're moving api.example.com from one load balancer to another next Tuesday. The record's TTL is currently 86400. Write a step-by-step plan, with timings, that avoids users hitting the old one for a day." },
      { difficulty: "Hard", prompt: "Design DNS for a service running in us-east, eu-west and ap-south so users reach the nearest healthy region. Explain what happens to a European user when eu-west fails, and how long it takes." },
    ],
    interviewQuestions: [
      { question: "What does DNS do?", answer: "It translates human-readable domain names into records such as IP addresses, through a distributed, hierarchical, heavily cached database." },
      { question: "What's the difference between an A record and a CNAME?", answer: "An A record maps a name directly to an IPv4 address. A CNAME maps a name to another name, which is then resolved; it's an alias and can't coexist with other records at the same name." },
      { question: "Describe the DNS resolution chain for a name not in any cache.", answer: "Stub resolver → recursive resolver → root server (returns .com NS) → TLD server (returns the domain's NS) → authoritative server (returns the record). The recursive resolver caches each step for its TTL." },
      { question: "What is TTL, and what's the trade-off in choosing it?", answer: "The number of seconds a resolver may cache an answer. Short TTLs allow fast changes and failover but increase query load and lookup latency; long TTLs are efficient but make changes slow to propagate." },
      { question: "What are MX and TXT records used for?", answer: "MX lists the mail servers for a domain with priorities (lower is tried first). TXT holds arbitrary text, commonly SPF, DKIM and DMARC email policies and domain-ownership verification tokens." },
      { question: "Why does DNS mostly use UDP, and when does it use TCP?", answer: "Most queries and answers are small and fit in one datagram, so UDP avoids a handshake. TCP is used when a response is too large (truncated flag set), for zone transfers, and by DNS-over-TLS." },
      { question: "How does GeoDNS route users to the nearest region?", answer: "The authoritative server looks at the source of the query (the resolver's IP, or the client subnet if EDNS Client Subnet is sent), maps it to a location, and returns the IP of the closest healthy region." },
      { question: "Why is DNS failover slower than load-balancer failover?", answer: "Clients, resolvers and sometimes application runtimes cache the old answer until its TTL expires, and some ignore TTLs. A load balancer health-checks backends and stops sending traffic within seconds, per request." },
      { question: "How would you migrate a domain to new infrastructure with no downtime?", answer: "Lower the TTL well ahead (at least one old-TTL period), run old and new side by side, switch the record, watch traffic drain from the old setup, keep the old one alive until the max TTL has passed, then raise the TTL again." },
      { question: "What's the difference between GeoDNS and anycast for global routing?", answer: "GeoDNS returns different IPs per location, so routing happens at lookup time and is subject to caching. Anycast announces the same IP from many locations via BGP, so the network routes each packet to the nearest site and failover happens at routing speed without DNS changes." },
    ],
    prerequisites: ["networking-basics"],
    relatedTopics: ["load-balancing", "cdn", "service-discovery", "multi-region-and-disaster-recovery", "caching"],
    keywords: ["dns", "domain name system", "a record", "aaaa", "cname", "mx", "txt", "ttl", "resolver", "authoritative", "geodns", "round robin dns", "anycast"],
  },
  {
    id: "back-of-the-envelope-estimation",
    title: "Back-of-the-Envelope Estimation",
    level: "beginner",
    description: "Quick, rough math for traffic, storage and bandwidth that tells you which parts of a design will strain.",
    explanation: `
Before choosing a database or adding a cache, you need a feel for the
**size** of the problem. Is it 10 requests per second or 100,000? 1 GB of
data or 1 PB? These numbers decide the design: one Postgres box handles
the first; the second needs sharding.

**Back-of-the-envelope estimation** is quick, rounded math to get the
**order of magnitude** right. You don't need exact answers. You need to
know whether something fits on one machine, in memory, or in a single
network link. Round aggressively (a day is about 100,000 seconds), state
your assumptions out loud, and sanity-check the result.
    `.trim(),
    analogy:
      "Before a road trip, you don't calculate fuel to the millilitre. You think: 'about 600 km, the car does about 15 km per litre, so about 40 litres; one tank is 50, so no refuel stop needed.' Good enough to make the decision.",
    examples: [
      {
        title: "Worked example: a photo-sharing app",
        language: "text",
        code: `Assumptions
  100M daily active users (DAU)
  Each user views 50 photos/day, uploads 0.1 photos/day
  Average photo: 500 KB (after compression)
  Keep photos for 10 years

Requests per second (1 day ≈ 86,400 s ≈ 10^5 s)
  Reads:  100M × 50  / 10^5 = 5×10^9 / 10^5 = 50,000 QPS
  Writes: 100M × 0.1 / 10^5 = 10^7  / 10^5 = 100 QPS
  Peak ≈ 2–3× average → ~150,000 read QPS, ~300 write QPS
  Read:write ratio ≈ 500:1  → read-heavy: cache + CDN

Storage
  New per day:  10M photos × 500 KB = 5 TB/day
  Per year:     5 TB × 365 ≈ 1.8 PB/year
  10 years:     ≈ 18 PB  (×3 replicas ≈ 55 PB raw) → object storage

Bandwidth
  Egress: 50,000 views/s × 500 KB = 25 GB/s ≈ 200 Gbps → must be a CDN
  Ingress: 100 uploads/s × 500 KB = 50 MB/s ≈ 400 Mbps`,
        walkthrough: [
          { code: "1 day ≈ 86,400 s ≈ 10^5 s", explanation: "The single most useful rounding. 1 million requests/day ≈ 12 per second." },
          { code: "Reads: 100M × 50 / 10^5 = 50,000 QPS", explanation: "Daily total divided by seconds in a day gives the average rate." },
          { code: "Peak ≈ 2–3× average", explanation: "Traffic isn't flat. Design for the peak, not the average." },
          { code: "5 TB × 365 ≈ 1.8 PB/year", explanation: "Storage grows forever unless you delete, so multiply by the retention period and replication factor." },
          { code: "25 GB/s ≈ 200 Gbps → must be a CDN", explanation: "Multiply bytes by 8 for bits. That's far beyond a handful of servers' network cards, so the design needs a CDN." },
        ],
      },
      {
        title: "Handy conversions as code",
        language: "ts",
        code: `const SECONDS_PER_DAY = 86_400; // round to 1e5 in your head

function averageQps(dailyActiveUsers: number, actionsPerUserPerDay: number) {
  return (dailyActiveUsers * actionsPerUserPerDay) / SECONDS_PER_DAY;
}

function bytesPerSecondToGbps(bytesPerSecond: number) {
  return (bytesPerSecond * 8) / 1e9;
}

averageQps(10_000_000, 20);          // ≈ 2,315 QPS
bytesPerSecondToGbps(2_315 * 20_000); // 20 KB responses ≈ 0.37 Gbps`,
      },
    ],
    howItWorks: `
**1. Powers of two (data sizes)**
- 2^10 ≈ 1 thousand → KB
- 2^20 ≈ 1 million → MB
- 2^30 ≈ 1 billion → GB
- 2^40 ≈ 1 trillion → TB
- 2^50 → PB
- Handy sizes: a char ≈ 1 byte (ASCII), an int ≈ 4 bytes, a long or
  timestamp ≈ 8 bytes, a UUID = 16 bytes (36 as text), a tweet-sized row
  ≈ a few hundred bytes, a compressed photo ≈ hundreds of KB, a minute of
  HD video ≈ tens of MB.

**2. Latency numbers every engineer should know** (classic figures
popularised by Jeff Dean and Peter Norvig; exact values vary by hardware,
but the ratios are what matter):
- L1 cache reference: ~1 ns
- Main memory reference: ~100 ns
- Compress 1 KB (fast codec): ~2–3 µs
- Read 4 KB randomly from SSD: ~16–150 µs
- Read 1 MB sequentially from memory: ~10–250 µs
- Round trip within a datacenter: ~0.5 ms
- Read 1 MB sequentially from SSD: ~0.05–1 ms
- Disk (HDD) seek: ~10 ms
- Read 1 MB sequentially from HDD: ~5–20 ms
- Round trip California ↔ Netherlands: ~150 ms

Takeaways: memory is ~1,000× faster than a network hop, disk seeks are
slow, cross-continent round trips are very slow, and sequential reads
beat random ones.

**3. Rates**
- 1 day ≈ 10^5 seconds, 1 month ≈ 2.5 × 10^6 s, 1 year ≈ 3 × 10^7 s.
- 1 million per day ≈ 12/s; 1 billion per day ≈ 12,000/s.
- Peak traffic ≈ 2–10× average depending on the product.

**4. Rough machine capacity** (orders of magnitude, workload-dependent)
- A single app server: hundreds to a few thousand simple requests/s.
- A well-tuned relational DB on one node: thousands to tens of thousands
  of simple queries/s.
- An in-memory cache node (Redis): on the order of 100,000 ops/s.
- A server NIC: 10–25 Gbps is common; 1 Gbps ≈ 125 MB/s.

**The method**: write down assumptions → compute QPS (average and peak)
→ storage (per item × items per day × retention × replication) →
bandwidth (QPS × payload size × 8) → compare against capacity → note
what each number implies for the design.
    `.trim(),
    whyItExists: `
Design choices are driven by scale. Without numbers, people either
over-engineer (sharding a database that would fit in RAM) or
under-engineer (a single server for 200 Gbps of traffic). A few minutes
of rough math catches both, and it gives you a shared, checkable basis
for decisions.
    `.trim(),
    whenToUse: `
At the start of any design, in capacity planning, when reviewing a
proposal ("will this fit in one Redis?"), when estimating cloud cost,
and early in a system design interview, right after requirements.
    `.trim(),
    whenNotToUse: `
It doesn't replace load testing or production metrics. Once the system
exists, measure. And don't spend half an interview on precise
arithmetic: get the order of magnitude, say what it implies, and move on.
    `.trim(),
    commonMistakes: [
      "Designing for average traffic and forgetting peak (often 2–10× higher) and growth.",
      "Mixing up bits and bytes: network links are quoted in bits per second, storage in bytes. Multiply by 8.",
      "Forgetting replication, indexes and backups, which can multiply raw storage by 3× or more.",
      "Doing precise arithmetic (86,400 × 37) instead of rounding (10^5 × 40) and losing time and clarity.",
      "Producing numbers and never saying what they mean for the design (e.g. '50k read QPS, so we need a cache').",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "A service gets 500 million requests per day. Estimate average QPS and a plausible peak QPS." },
      { difficulty: "Medium", prompt: "Estimate storage for a chat app with 50M DAU sending 40 messages a day, 200 bytes each, kept for 5 years with 3× replication." },
      { difficulty: "Hard", prompt: "Estimate the egress bandwidth and number of edge servers a video platform needs if 10M concurrent viewers watch at 5 Mbps, and each edge server can push 40 Gbps. What does this tell you about the design?" },
    ],
    interviewQuestions: [
      { question: "Why do back-of-the-envelope estimates in a design discussion?", answer: "To get the order of magnitude of traffic, storage and bandwidth, which decides the architecture: whether data fits on one machine or in memory, whether you need a cache, a CDN or sharding." },
      { question: "How do you convert daily requests into QPS quickly?", answer: "Divide by about 10^5 (seconds in a day, 86,400). So 1M/day ≈ 12 QPS and 1B/day ≈ 12,000 QPS. Then multiply by a peak factor of 2–10×." },
      { question: "Roughly how much slower is a datacenter network round trip than a main memory read?", answer: "About 5,000×: ~100 ns for memory versus ~0.5 ms for a round trip within a datacenter. That's why caching in process memory, and batching network calls, matter." },
      { question: "What is 2^30 bytes, and why do powers of two matter?", answer: "About 1 GB (a billion bytes). Powers of two map quickly to KB/MB/GB/TB/PB (2^10, 2^20, 2^30, 2^40, 2^50), which makes size math fast." },
      { question: "A service returns 100 KB responses at 20,000 QPS. What bandwidth does it need?", answer: "20,000 × 100 KB = 2 GB/s, × 8 = 16 Gbps. That's more than one typical server NIC, so you'd spread it across machines or put a CDN in front." },
      { question: "How do you estimate storage for a system?", answer: "Size per item × items per day × days of retention × replication factor, plus overhead for indexes and metadata. Then check whether it fits on one node or needs sharding or object storage." },
      { question: "Why do you need to distinguish read and write QPS?", answer: "They scale differently. Reads can be absorbed by caches, CDNs and replicas; writes must reach the primary store, so write-heavy systems need partitioning or queues instead." },
      { question: "Why is sequential disk I/O so much faster than random I/O, and how does that influence design?", answer: "Random reads pay a seek (≈10 ms on HDD) or per-request overhead (SSD) for each block, while sequential reads stream. Designs like log-structured storage, append-only logs and batch writes exploit that." },
      { question: "Your estimate shows 3 TB of hot data that needs sub-millisecond reads. What does that imply?", answer: "It won't fit in one machine's RAM cheaply, so you'd shard an in-memory cache across nodes (e.g. ~30 nodes with 128 GB usable each, plus replicas) or decide which subset is actually hot and cache only that." },
      { question: "How would you sanity-check an estimate?", answer: "Compare with known reference points (a single Postgres can do thousands of QPS; a 10 Gbps NIC moves ~1.25 GB/s), check units (bits vs bytes, per day vs per second), and see whether the result agrees with any real product numbers you know." },
    ],
    prerequisites: ["what-is-system-design"],
    relatedTopics: ["scalability", "caching", "cdn", "sharding", "system-design-interview-framework", "storage-engines"],
    keywords: ["estimation", "back of the envelope", "capacity planning", "qps", "latency numbers", "powers of two", "bandwidth", "storage math"],
  },
  {
    id: "availability-and-slas",
    title: "Availability, SLIs, SLOs and SLAs",
    level: "beginner",
    description: "How to measure uptime, what 'the nines' mean, error budgets, and how dependencies multiply availability.",
    explanation: `
**Availability** is the fraction of time (or of requests) a system works
correctly for its users. It's usually written as a percentage and
nicknamed by its "nines": 99.9% is "three nines".

Three terms come up constantly:
- **SLI** (Service Level Indicator): a measured number, e.g. "the share
  of HTTP requests that returned a non-5xx response in under 300 ms".
- **SLO** (Service Level Objective): the internal target for that SLI,
  e.g. "99.9% over a rolling 30 days".
- **SLA** (Service Level Agreement): a contract with customers that
  promises a level of service and states the penalty (usually service
  credits) if it's missed. SLAs are set looser than SLOs so you get a
  warning before you owe money.

The gap between 100% and the SLO is the **error budget**: the amount of
failure you are allowed. Teams spend it on deploys and experiments, and
slow down when it runs out.
    `.trim(),
    analogy:
      "A bus company measures how many buses leave on time (SLI), aims internally for 99% (SLO), and promises passengers a refund if fewer than 95% are on time (SLA). The 1% of late buses they're allowed is their error budget: they can spend it on road works, but not much more.",
    examples: [
      {
        title: "The nines and allowed downtime",
        language: "text",
        code: `Availability   Downtime per year   per 30-day month
99%            3.65 days           7.2 hours
99.9%          8.76 hours          43.2 minutes
99.95%         4.38 hours          21.6 minutes
99.99%         52.6 minutes        4.32 minutes
99.999%        5.26 minutes        25.9 seconds`,
        walkthrough: [
          { code: "99%            3.65 days", explanation: "1% of 365 days. Fine for an internal tool, painful for a product." },
          { code: "99.9%          8.76 hours", explanation: "A common SLA tier for cloud services and SaaS." },
          { code: "99.99%         52.6 minutes", explanation: "Less than an hour a year: needs redundancy everywhere and automated failover." },
          { code: "99.999%        5.26 minutes", explanation: "Each extra nine cuts downtime by 10×, and usually costs far more than 10× the effort." },
        ],
      },
      {
        title: "Availability in series and in parallel",
        language: "ts",
        code: `// Series: every component must be up (a request goes through all of them).
function seriesAvailability(components: number[]) {
  return components.reduce((total, availability) => total * availability, 1);
}

// Parallel: the system is up if at least one replica is up
// (assumes failures are independent).
function parallelAvailability(replicaAvailability: number, replicaCount: number) {
  return 1 - Math.pow(1 - replicaAvailability, replicaCount);
}

seriesAvailability([0.999, 0.999, 0.999]); // 0.997   → about 26 h down/year
parallelAvailability(0.99, 2);             // 0.9999  → two 99% boxes give 99.99%
seriesAvailability([parallelAvailability(0.999, 2), 0.9995]); // ≈ 0.9995`,
        explanation:
          "Chaining dependencies multiplies availabilities, so the result is worse than the weakest link. Redundancy multiplies the *unavailabilities*, so it improves quickly, but only if replicas fail independently.",
      },
    ],
    howItWorks: `
**Measuring.** Availability can be time-based (uptime ÷ total time) or
request-based (good requests ÷ valid requests). Request-based is usually
better for services because it reflects what users actually saw. An SLI
should be measured as close to the user as practical (load balancer logs
or synthetic probes, not just "the process is running").

**Error budgets.** With a 99.9% SLO over 30 days, the budget is 0.1% =
43.2 minutes of full outage, or the equivalent in failed requests (1 in
1,000). If a bad deploy burns half the budget in a day, the team pauses
risky launches and invests in reliability until the budget recovers.
Alerting on **burn rate** (how fast the budget is being consumed) catches
problems faster than alerting on raw error counts.

**Series.** If a request needs components A, B and C, all must be up:
A_total = A_a × A_b × A_c. Three 99.9% services in a row give
0.999³ ≈ 99.7%. This is why a long chain of synchronous microservice calls
erodes availability.

**Parallel.** If any one of n independent replicas can serve the request:
A_total = 1 − (1 − A)^n. Two 99.9% replicas: 1 − 0.001² = 99.9999%. The
big caveat is **independence**: replicas in the same rack, zone, region,
or sharing a bad config or deploy can fail together, so real gains are
smaller.

**Downtime is also MTBF and MTTR.** Availability ≈ MTBF ÷ (MTBF + MTTR),
where MTBF is mean time between failures and MTTR is mean time to
recovery. Reducing MTTR (fast detection, quick rollback, automated
failover) is often the cheapest way to add a nine.
    `.trim(),
    diagram: `
Series: all must work
  Client ─▶ [LB 99.99%] ─▶ [App 99.9%] ─▶ [DB 99.95%]
  Total ≈ 0.9999 × 0.999 × 0.9995 ≈ 99.84%

Parallel: any one is enough
              ┌─▶ [App replica 99%] ─┐
  Client ─▶ LB│                      │  1 − (0.01 × 0.01) = 99.99%
              └─▶ [App replica 99%] ─┘
    `.trim(),
    whyItExists: `
"Always up" is impossible and "as reliable as possible" has no end:
every extra nine costs much more. SLOs turn reliability into an explicit,
measurable target that balances users' needs against the speed of
shipping features. SLAs turn that target into a business promise.
    `.trim(),
    whenToUse: `
Define SLIs and SLOs for any service other people depend on. Use the
series/parallel math when deciding whether to add a dependency, a
replica, or a second zone or region, and when checking whether a
promised SLA is even achievable given your dependencies' SLAs.
    `.trim(),
    whenNotToUse: `
Don't chase extra nines where users won't notice: a batch report that's
down for an hour overnight doesn't need 99.99%. And don't promise an SLA
tighter than the product of your critical dependencies' availability;
you can't be more available than a dependency you can't work without.
    `.trim(),
    commonMistakes: [
      "Setting the SLO at 100%. It leaves no error budget, blocks every change, and is impossible anyway.",
      "Assuming replicas fail independently when they share a zone, a network, a config system or a deploy pipeline.",
      "Measuring availability as 'the server process is running' instead of what users experience (successful, fast-enough responses).",
      "Forgetting that each synchronous dependency in the request path multiplies down availability.",
      "Making the SLA equal to the SLO, so there's no warning margin before contractual penalties.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "How many minutes of downtime per 30-day month does a 99.95% SLO allow?" },
      { difficulty: "Medium", prompt: "A request goes through a load balancer (99.99%), an API service (99.9%), and a database (99.95%). What's the overall availability? What single change would improve it the most?" },
      { difficulty: "Hard", prompt: "Your product must offer a 99.99% SLA, but it depends on a payment provider with a 99.9% SLA. Propose a design that still meets the SLA for the parts of the product that matter, and explain what you'd exclude or degrade." },
    ],
    interviewQuestions: [
      { question: "What's the difference between an SLI, an SLO and an SLA?", answer: "An SLI is a measurement (e.g. % of successful requests). An SLO is the internal target for it (99.9% over 30 days). An SLA is a contract with customers with penalties if a level, usually looser than the SLO, is missed." },
      { question: "How much downtime per year does 99.9% allow? 99.99%?", answer: "99.9% allows about 8.76 hours per year (~43 minutes a month). 99.99% allows about 52.6 minutes per year (~4.3 minutes a month)." },
      { question: "What is an error budget?", answer: "The allowed unreliability: 100% minus the SLO. With 99.9%, 0.1% of requests can fail. Teams spend it on releases and experiments, and freeze risky changes when it's exhausted." },
      { question: "Three services each at 99.9% are called in sequence. What's the combined availability?", answer: "0.999³ ≈ 99.7%, which is about 26 hours of downtime per year: worse than any single component." },
      { question: "Two independent replicas each at 99% availability sit behind a load balancer. What's the availability of the pair?", answer: "1 − (0.01)² = 99.99%, ignoring the load balancer itself. Redundancy multiplies the failure probabilities together." },
      { question: "Why don't real systems get the full benefit of the parallel formula?", answer: "It assumes independent failures. Replicas often share failure modes: the same zone, network, dependency, configuration or bad deploy. That's why you spread replicas across zones and roll out changes gradually." },
      { question: "Is request-based or time-based availability better?", answer: "Request-based (good requests ÷ total) usually reflects user experience better: a 5-minute outage at peak hurts more than one at 3 a.m., and partial failures (5% of requests erroring) show up properly." },
      { question: "How do MTBF and MTTR relate to availability, and which is usually easier to improve?", answer: "Availability ≈ MTBF ÷ (MTBF + MTTR). Cutting MTTR through fast detection, automated failover and quick rollbacks is often cheaper than making failures rarer." },
      { question: "Why is alerting on error budget burn rate better than alerting on error rate thresholds?", answer: "Burn rate ties alerts to user-impacting SLO risk: a fast burn (e.g. 14× normal over an hour) pages immediately, a slow burn opens a ticket. It cuts noisy alerts for brief blips while still catching slow, steady degradation." },
      { question: "Your service has a hard dependency at 99.9%, but you need 99.99%. What can you do?", answer: "Remove it from the critical path: cache its responses, make the call asynchronous via a queue, degrade gracefully when it's down, add a fallback provider in parallel, or exclude that feature from the SLA scope." },
    ],
    prerequisites: ["what-is-system-design"],
    relatedTopics: ["monitoring-and-observability", "circuit-breaker", "database-replication", "multi-region-and-disaster-recovery", "deployment-strategies", "load-balancing"],
    keywords: ["availability", "sla", "slo", "sli", "nines", "uptime", "downtime", "error budget", "mtbf", "mttr", "burn rate", "redundancy"],
  },
  {
    id: "stateless-vs-stateful-services",
    title: "Stateless vs Stateful Services",
    level: "beginner",
    description: "Why keeping app servers stateless lets you scale them freely, and where the state goes instead.",
    explanation: `
**State** is any data a server remembers between requests: a logged-in
user's session, a shopping cart, an uploaded file sitting on local disk,
an in-memory counter.

A **stateful** service keeps that data inside a specific server, so the
next request must reach the *same* server. A **stateless** service keeps
nothing between requests: each request carries what it needs (like a
token), and any shared data lives in an external store such as a
database or cache. With stateless servers, **any** instance can handle
**any** request.

That property is what makes horizontal scaling easy: add servers, remove
servers, or lose a server, and users don't notice. The state still
exists; it has just moved to systems built to manage it.
    `.trim(),
    analogy:
      "A stateful service is a shop where only the cashier who started your order can finish it, because the order is in their head. A stateless service is a shop where the order is written on a ticket you carry (or in a shared system), so any cashier can help you, and a cashier going home doesn't lose anything.",
    examples: [
      {
        title: "Stateful vs stateless session handling (Express)",
        language: "ts",
        code: `// Stateful: sessions live in this process's memory.
const sessions = new Map<string, { userId: string }>();
app.get("/me", (request, response) => {
  const session = sessions.get(request.cookies.sid); // lost on restart,
  response.json(session);                            // missing on other servers
});

// Stateless: the session lives in a shared store (Redis).
app.get("/me", async (request, response) => {
  const raw = await redis.get("session:" + request.cookies.sid);
  response.json(raw ? JSON.parse(raw) : null);       // any server can answer
});`,
        walkthrough: [
          { code: "const sessions = new Map<...>();", explanation: "State inside one process. A second server has its own, different Map." },
          { code: "sessions.get(request.cookies.sid)", explanation: "Works only if the load balancer sends this user back to the same server, and the server hasn't restarted." },
          { code: 'await redis.get("session:" + request.cookies.sid)', explanation: "State moved to an external store that every server reads, so the app server holds nothing." },
          { code: "// any server can answer", explanation: "Now servers can be added, removed or replaced freely." },
        ],
      },
      {
        title: "Fully stateless auth with a signed token",
        language: "ts",
        code: `import { jwtVerify } from "jose";

app.get("/me", async (request, response) => {
  const token = request.headers.authorization?.replace("Bearer ", "") ?? "";
  // The token carries the user id and is signed, so no lookup is needed.
  const { payload } = await jwtVerify(token, signingKey);
  response.json({ userId: payload.sub });
});`,
        explanation:
          "No session store at all, but you can't revoke a token before it expires without adding a denylist (which is state again). That's why such tokens are kept short-lived.",
      },
    ],
    howItWorks: `
**Where state goes in a stateless design**
- **Database**: durable business data (users, orders). The source of
  truth.
- **Distributed cache / session store** (Redis, Memcached): sessions,
  rate-limit counters, short-lived data that must be fast and shared.
- **Object storage** (S3-style): uploaded files, instead of the app
  server's local disk.
- **The client**: signed tokens (JWTs) or signed cookies that carry
  identity and small claims.
- **Queues / streams**: in-progress background work, so a crashed worker
  doesn't lose a job.

**Sticky sessions** are the halfway option: the load balancer pins each
user to one server (via a cookie or IP hash), so in-memory sessions keep
working. It's simple, but:
- Load becomes uneven (one server collects heavy users).
- When that server dies or is drained for a deploy, its users lose their
  session.
- Autoscaling down means cutting off pinned users.

**Stateful services are still needed**, and they're scaled differently.
Databases, caches, Kafka brokers, and WebSocket or game servers hold
state by nature. They scale with **replication** (copies for reads and
failover) and **partitioning/sharding** (each node owns part of the
data), plus careful routing so requests reach the node that owns the
data. These are harder to operate, which is exactly why you push state
*out* of the many app servers and *into* a few specialised systems.
    `.trim(),
    diagram: `
Stateless app tier (any server, any request)
                 ┌──▶ App 1 ─┐
  Users ─▶ LB ───┼──▶ App 2 ─┼──▶ Redis (sessions, counters)
                 └──▶ App 3 ─┘──▶ Database (source of truth)
                               ──▶ Object storage (files)

Sticky sessions (stateful app tier)
  User A ─▶ LB ─▶ always App 1   (App 1 dies → User A logged out)
  User B ─▶ LB ─▶ always App 2
    `.trim(),
    whyItExists: `
Horizontal scaling, autoscaling, rolling deploys and surviving server
crashes all require that servers be interchangeable. If a server holds
unique data, every one of those operations risks losing it. Moving state
to dedicated stores concentrates the hard problems (durability,
replication, consistency) in a few systems designed for them.
    `.trim(),
    whenToUse: `
Make web and API servers, background workers and serverless functions
stateless by default. That's the standard for anything behind a load
balancer that needs to scale out, autoscale or deploy without downtime.
    `.trim(),
    whenNotToUse: `
Some workloads are inherently stateful and fighting that costs too much:
long-lived WebSocket connections, multiplayer game rooms, collaborative
editing sessions, and in-memory stream processing. Keep the state, but
route users consistently (e.g. by room id with consistent hashing) and
plan for handover when a node fails. And a single-server app with no
scaling needs can keep in-memory state.
    `.trim(),
    commonMistakes: [
      "Writing uploaded files to the app server's local disk, then losing them (or not finding them) when the next request hits a different server.",
      "Keeping caches or counters in process memory and expecting them to be consistent across servers (e.g. an in-memory rate limiter that lets N× the limit through with N servers).",
      "Relying on sticky sessions as the scaling strategy, then losing sessions on every deploy or crash.",
      "Calling a service 'stateless' while it secretly depends on local scheduled jobs or local temp files.",
      "Putting large or sensitive data into client-side tokens, making every request heavy or leaking data (JWT payloads are encoded, not encrypted).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "List every piece of state a typical login + shopping cart flow needs, and say where each should live in a stateless design." },
      { difficulty: "Medium", prompt: "A team's rate limiter keeps counts in a per-process Map, and they just went from 1 to 8 servers. Explain what breaks and redesign it." },
      { difficulty: "Hard", prompt: "Design a chat service where each user holds a WebSocket connection to one server. How does a message from a user on server A reach a user on server B, and what happens when server B crashes?" },
    ],
    interviewQuestions: [
      { question: "What does it mean for a service to be stateless?", answer: "It keeps no client-specific data between requests. Each request contains everything needed (e.g. a token), and shared data lives in external stores, so any instance can serve any request." },
      { question: "Why do stateless services scale horizontally more easily?", answer: "Instances are interchangeable, so a load balancer can send any request anywhere, and you can add, remove or replace instances without moving data or losing user sessions." },
      { question: "If app servers are stateless, where does the state go?", answer: "Into the database (durable data), a distributed cache like Redis (sessions, counters), object storage (files), the client (signed tokens), and queues (pending work)." },
      { question: "What are sticky sessions, and what are their downsides?", answer: "The load balancer pins a user to one server so in-memory state works. Downsides: uneven load, users lose state when that server fails or is drained, and autoscaling or deploys become disruptive." },
      { question: "JWT vs server-side sessions: what's the trade-off?", answer: "JWTs need no lookup per request and scale trivially, but can't be revoked before expiry without a denylist and grow request size. Server-side sessions are easy to revoke and keep data private, but need a fast shared store." },
      { question: "Why is an in-memory cache on each app server risky?", answer: "Each server has its own copy, so they can disagree, and invalidation must reach every server. It's fine for immutable or slightly stale data; for shared mutable data use a central cache or short TTLs." },
      { question: "How do you scale a stateful service like a database?", answer: "Replication for read scaling and failover, and partitioning/sharding so each node owns a subset of data, with routing that sends each request to the owner. Both bring consistency and rebalancing challenges." },
      { question: "How would you scale WebSocket servers, which are inherently stateful?", answer: "Keep connection state on the server but route consistently, store durable state elsewhere, and use pub/sub (e.g. Redis or Kafka) so a message published anywhere reaches the server holding the recipient's connection. Clients reconnect to another node on failure." },
      { question: "How does statelessness affect deployments?", answer: "Rolling and blue-green deploys become safe: drain an instance, replace it, and no user data is lost. With stateful instances you must migrate or drain state first, or users lose it." },
      { question: "Can a 'stateless' tier become a bottleneck because of state?", answer: "Yes. The state moved to the shared store, so that store's throughput and availability now cap the whole tier. You then scale it (replicas, sharding, caching) and treat it as a critical dependency." },
    ],
    prerequisites: ["client-and-server", "load-balancing"],
    relatedTopics: ["authentication-and-sessions", "scalability", "caching", "websockets", "consistent-hashing", "object-storage", "deployment-strategies"],
    keywords: ["stateless", "stateful", "sticky sessions", "session affinity", "horizontal scaling", "session store", "jwt", "redis sessions"],
  },
  {
    id: "object-storage",
    title: "Object Storage",
    level: "beginner",
    description: "S3-style storage for files and blobs: buckets, keys, presigned URLs, and how it compares to block and file storage.",
    explanation: `
Apps need to store large, unstructured files: images, videos, PDFs,
backups, logs. Putting them in a database bloats it, and putting them on
an app server's disk ties them to one machine.

**Object storage** (Amazon S3, Google Cloud Storage, Azure Blob Storage,
and S3-compatible systems like MinIO or Cloudflare R2) is a service built
for this. You store an **object** (the bytes plus some metadata) under a
**key** inside a **bucket**, and read it back by that key over HTTP. It
scales to effectively unlimited size, is replicated for very high
durability, and is cheap per gigabyte.

The usual pattern: **the file goes in object storage, and a row in your
database stores its key and metadata** (owner, size, content type,
created date), so you can query and authorise access.
    `.trim(),
    analogy:
      "Object storage is a giant coat check. You hand over a coat (the file), get a ticket number (the key), and later hand the ticket back to get the coat. You can't alter one sleeve in place; you swap the whole coat. The venue's guest list (your database) records which ticket belongs to which guest.",
    examples: [
      {
        title: "Upload and download with the AWS CLI",
        language: "bash",
        code: `aws s3 mb s3://acme-user-uploads                     # create a bucket
aws s3 cp avatar.png s3://acme-user-uploads/users/42/avatar.png
aws s3 ls s3://acme-user-uploads/users/42/             # list by prefix
aws s3 cp s3://acme-user-uploads/users/42/avatar.png ./copy.png
aws s3 presign s3://acme-user-uploads/users/42/avatar.png --expires-in 300`,
        walkthrough: [
          { code: "aws s3 mb s3://acme-user-uploads", explanation: "Creates a bucket. S3 bucket names are globally unique." },
          { code: "aws s3 cp avatar.png s3://.../users/42/avatar.png", explanation: "Stores the file under the key 'users/42/avatar.png'. The slashes are part of the key, not real folders." },
          { code: "aws s3 ls s3://acme-user-uploads/users/42/", explanation: "Lists keys that start with a prefix, which is how 'folders' are simulated." },
          { code: "aws s3 presign ... --expires-in 300", explanation: "Produces a temporary signed URL that lets anyone holding it download the object for 5 minutes." },
        ],
      },
      {
        title: "Direct browser upload with a presigned URL",
        language: "ts",
        code: `import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "us-east-1" });

// API server: authorise the user, record metadata, hand back an upload URL.
export async function createUpload(userId: string, contentType: string) {
  const key = "uploads/" + userId + "/" + crypto.randomUUID();
  await db.files.insert({ key, ownerId: userId, contentType, status: "pending" });
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: "acme-user-uploads", Key: key, ContentType: contentType }),
    { expiresIn: 300 },
  );
  return { key, uploadUrl }; // browser PUTs the file straight to S3
}`,
        explanation:
          "The file bytes never pass through your servers, so they don't spend bandwidth or memory on uploads. An event notification (or a follow-up 'complete' call) then marks the row as uploaded.",
      },
    ],
    howItWorks: `
**The model.** A flat namespace: bucket + key → object. An object is
immutable bytes plus metadata (content type, custom headers). You
**replace** objects rather than editing them in place; there's no
"append" or "seek and write" in the S3 API. Operations are HTTP verbs:
PUT, GET (including byte-range GETs), DELETE, LIST by prefix, HEAD.

**Durability and consistency.** Objects are stored redundantly across
multiple devices and facilities. S3 Standard is designed for 99.999999999%
("11 nines") durability and 99.99% availability. Since December 2020, S3
provides strong read-after-write consistency for PUTs and DELETEs, and
LIST reflects writes immediately. Other providers vary, so check.

**Limits worth knowing (S3).** A single object can be up to 5 TB. A
single PUT can upload up to 5 GB; larger files use **multipart upload**
(recommended above ~100 MB), with parts of 5 MB–5 GB and up to 10,000
parts, uploaded in parallel and retried individually.

**Block vs file vs object storage**
- **Block storage** (EBS, local SSD): a raw disk attached to one machine.
  Lowest latency, supports in-place writes; used for databases and OS
  disks. Usually attached to one instance at a time.
- **File storage** (NFS, EFS): a shared filesystem with directories,
  locks and in-place edits, mounted by many machines. Good for legacy
  apps expecting a POSIX filesystem.
- **Object storage**: HTTP API, flat keys, whole-object writes, massive
  scale, cheapest per GB, higher per-request latency (tens of ms).

**Presigned URLs.** Your server signs a URL with its credentials,
granting one specific operation (GET or PUT) on one key until an expiry
time (up to 7 days with SigV4). Clients upload or download directly,
the bucket stays private, and your servers stay out of the data path.

**Typical setup.** Private bucket → CDN in front for public reads →
lifecycle rules move old objects to cheaper tiers (infrequent access,
archive) or delete them → event notifications trigger processing (e.g.
thumbnail generation via a queue).
    `.trim(),
    diagram: `
 1. POST /uploads ─────────▶ API server ──▶ DB: files(key, owner, status=pending)
                               │ signs URL
 2. ◀──── presigned PUT URL ───┘
 3. Browser ── PUT bytes ─────────────────▶ Object storage (bucket/key)
 4.                                           │ event notification
                                              ▼
                                Queue ──▶ Worker: thumbnail, status=ready
 5. Reads:  Browser ─▶ CDN ─▶ Object storage
    `.trim(),
    whyItExists: `
File systems and block devices don't scale to billions of files across
many machines, and they're expensive to make highly durable. Object
storage gives up in-place edits and directory semantics in exchange for
near-unlimited scale, very high durability, simple HTTP access and low
cost, which is exactly what media, backups and data lakes need.
    `.trim(),
    whenToUse: `
User uploads (images, video, documents), static website assets, backups
and database snapshots, logs and analytics data (data lakes queried by
engines like Athena, Spark or Trino), ML datasets and model artifacts,
and anything served through a CDN.
    `.trim(),
    whenNotToUse: `
Not for data that needs low-latency, small, in-place updates or
transactions: use a database or block storage. Not for workloads needing
a real shared filesystem with locking (use file storage). And avoid huge
numbers of tiny objects read individually and frequently, since per-
request latency and cost add up; batch them or use a database.
    `.trim(),
    commonMistakes: [
      "Storing large files as blobs inside the relational database, which bloats backups, replication and the buffer cache.",
      "Proxying every upload and download through the app servers instead of using presigned URLs, wasting bandwidth and memory.",
      "Making a bucket public to serve files, then exposing private user data. Keep buckets private and use presigned URLs or a CDN with origin access control.",
      "Using guessable keys (users/42/avatar.png) for private content without access checks, and trusting client-provided content types or filenames.",
      "Not keeping metadata in a database, then having to LIST millions of keys to answer simple questions like 'which files does this user own?'.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Explain the difference between block, file and object storage, and give one workload that fits each." },
      { difficulty: "Medium", prompt: "Design the upload flow for profile pictures: API calls, presigned URL, database schema for metadata, and how you validate size and type." },
      { difficulty: "Hard", prompt: "Design storage for a video platform receiving 2 GB uploads over unreliable mobile networks, including resumable uploads, transcoding to several resolutions, CDN delivery, and lifecycle rules for old originals." },
    ],
    interviewQuestions: [
      { question: "What is object storage?", answer: "A service that stores immutable blobs (objects) with metadata under keys in buckets, accessed over an HTTP API. It's highly durable, effectively unlimited in scale and cheap per GB, e.g. Amazon S3 or Google Cloud Storage." },
      { question: "How does object storage differ from block and file storage?", answer: "Block storage is a raw disk for one machine with in-place writes (databases). File storage is a shared POSIX filesystem (NFS). Object storage has a flat key namespace, whole-object writes, HTTP access, and scales furthest at the lowest cost." },
      { question: "Why store files in object storage and metadata in a database?", answer: "Object storage is great at bytes but poor at queries. The database row (key, owner, size, type, status) supports lookups, permissions and joins, while the bytes live where they're cheap and durable." },
      { question: "What is a presigned URL, and why use one?", answer: "A URL signed with server credentials that grants one operation on one object until it expires. Clients upload or download directly, so the bucket stays private and your servers don't carry the file traffic." },
      { question: "Are there 'folders' in S3?", answer: "No. The namespace is flat; slashes in keys are just characters. Consoles and LIST with a prefix and delimiter make keys look like folders." },
      { question: "How do you upload a very large file reliably?", answer: "Multipart upload: split it into parts (5 MB–5 GB each in S3, up to 10,000), upload them in parallel, retry failed parts individually, then complete the upload. Clean up abandoned uploads with a lifecycle rule." },
      { question: "What durability and consistency does S3 offer?", answer: "S3 Standard is designed for 11 nines of durability by storing data redundantly across multiple facilities. Since December 2020 it gives strong read-after-write consistency for PUTs, DELETEs and LISTs." },
      { question: "How would you serve user-uploaded images globally with low latency?", answer: "Keep the bucket private, put a CDN in front with origin access control, use immutable content-addressed or versioned keys with long cache TTLs, and generate resized variants on upload or on demand." },
      { question: "How do you keep the database and object storage consistent when an upload might fail midway?", answer: "Create a 'pending' row first, upload, then mark it 'ready' on the storage event notification or a completion call. A periodic job removes stale pending rows and orphaned objects; lifecycle rules abort incomplete multipart uploads." },
      { question: "What security risks come with user uploads to object storage?", answer: "Public buckets leaking data, guessable keys, malicious files (malware, HTML/SVG served with an executable content type), oversized uploads, and long-lived presigned URLs. Mitigate with private buckets, random keys, presigned PUT limits on type and size, scanning, safe Content-Type/Content-Disposition headers, and short expiries." },
    ],
    prerequisites: ["databases"],
    relatedTopics: ["cdn", "databases", "stateless-vs-stateful-services", "security-in-system-design", "queues", "data-warehouses-and-olap", "storage-engines"],
    keywords: ["object storage", "blob storage", "s3", "bucket", "key", "presigned url", "multipart upload", "block storage", "file storage", "gcs", "azure blob"],
  },
  {
    id: "system-design-interview-framework",
    title: "System Design Interview Framework",
    level: "beginner",
    description: "A step-by-step approach for a 45–60 minute design interview, and the pitfalls that sink candidates.",
    explanation: `
A system design interview asks you to design something large ("design a
URL shortener", "design a news feed") in under an hour. There's no single
right answer. The interviewer is judging **how you think**: do you
clarify the problem, reason with numbers, make sensible trade-offs, and
communicate clearly?

A repeatable framework keeps you from freezing or wandering:

1. **Requirements**: functional and non-functional, plus scope.
2. **Estimates**: traffic, storage, bandwidth.
3. **API**: the main endpoints or operations.
4. **Data model**: entities, keys, and the storage choice.
5. **High-level design**: boxes and arrows for the main flows.
6. **Deep dives**: the one or two hardest parts, in detail.
7. **Bottlenecks and failures**: what breaks at scale or on failure.
8. **Trade-offs and wrap-up**: what you chose, what you gave up, what's
   next.
    `.trim(),
    analogy:
      "It's like an architect meeting a client. They don't start drawing a skyscraper. They ask how many people, what budget, what the building is for, then sketch the floor plan, then zoom into the tricky parts like the foundations and fire exits, and explain why they made each choice.",
    examples: [
      {
        title: "Applying the framework to a URL shortener (condensed)",
        language: "text",
        code: `1. Requirements
   Functional: create short link for a long URL; redirect short → long;
               optional custom alias and expiry.
   Non-functional: redirects very fast (p99 < 50 ms), highly available,
               short codes not guessable in sequence. Read-heavy.
   Out of scope: analytics dashboard, user accounts.

2. Estimates
   100M new links/month ≈ 40 writes/s; 100:1 reads → ~4,000 reads/s avg.
   500 bytes/link × 100M × 12 × 5 years ≈ 3 TB.

3. API
   POST /links { longUrl, customAlias?, expiresAt? } → { code }
   GET  /{code} → 301/302 redirect

4. Data model
   links(code PK, long_url, created_at, expires_at)  → key-value lookup

5. High-level
   Client → LB → stateless API → cache (code → URL) → DB

6. Deep dive
   Code generation: base62 of a unique id (7 chars = 62^7 ≈ 3.5 trillion)
   vs random + collision check. Cache hot codes; CDN for redirects.

7. Bottlenecks
   DB reads → cache; id generator → pre-allocated ranges;
   hot links → CDN; region failure → replicate across regions.

8. Trade-offs
   301 is cached by browsers (less load, loses click counts) vs 302.`,
        walkthrough: [
          { code: "1. Requirements", explanation: "Agree what to build and what not to. Non-functional needs (latency, availability, read-heavy) drive everything after." },
          { code: "2. Estimates", explanation: "40 writes/s and 4,000 reads/s fit modest hardware, but the 100:1 ratio says caching matters most." },
          { code: "3. API / 4. Data model", explanation: "Pinning down the interface and the main table makes the rest concrete." },
          { code: "5. High-level", explanation: "A simple end-to-end path first, before any optimisation." },
          { code: "6. Deep dive", explanation: "Spend real time on the hardest problem: here, generating short unique codes." },
          { code: "8. Trade-offs", explanation: "Name the choice and what it costs. Interviewers look for this explicitly." },
        ],
      },
    ],
    howItWorks: `
A rough time budget for a 45-minute interview:

**1. Requirements (~5 min).** Ask about core features, users, scale,
read/write ratio, latency, consistency needs, and what's out of scope.
Write down 3–5 functional requirements and the key non-functional ones.
Confirm with the interviewer.

**2. Estimates (~3–5 min).** QPS (average and peak), storage over the
retention period, bandwidth. Only as precise as needed to make a
decision, and say what each number implies.

**3. API (~3–5 min).** List the main operations with inputs and outputs:
REST endpoints, RPCs, or events. Include pagination and idempotency where
relevant.

**4. Data model (~3–5 min).** Core entities, primary keys, access
patterns, and a storage choice justified by those patterns (relational
for relations and transactions, key-value for simple lookups at scale,
etc.).

**5. High-level design (~10 min).** Draw clients, load balancer,
services, databases, caches, queues, object storage, CDN. Walk through
each main flow (write path and read path) end to end.

**6. Deep dives (~10–15 min).** Pick the parts that are hardest or that
the interviewer steers you to: feed fan-out, ID generation, consistency,
hot keys, search. Compare at least two options and choose one.

**7. Bottlenecks and failures (~5 min).** Single points of failure,
scaling limits, what happens when a node, zone or dependency dies;
monitoring and alerting.

**8. Wrap-up (~2 min).** Summarise the design, the main trade-offs, and
what you'd do with more time.

Throughout: **think out loud**, check in with the interviewer, keep the
diagram up to date, and adapt when they redirect you.
    `.trim(),
    diagram: `
 Requirements ─▶ Estimates ─▶ API ─▶ Data model ─▶ High-level design
                                                        │
          Wrap-up ◀── Bottlenecks & failures ◀── Deep dives
     (trade-offs, next steps)

 Generic starting skeleton:
   Client ─▶ DNS/CDN ─▶ Load balancer ─▶ Stateless services ─┬─▶ Cache
                                                             ├─▶ Database
                                                             ├─▶ Object storage
                                                             └─▶ Queue ─▶ Workers
    `.trim(),
    whyItExists: `
Open-ended design problems are easy to get lost in: it's tempting to
start drawing Kafka clusters before knowing what the system does. A
framework ensures you cover what interviewers look for (scoping,
quantitative reasoning, sound components, trade-offs) and leaves time for
depth. It's also how real design reviews work, just compressed.
    `.trim(),
    whenToUse: `
In system design interviews, in design docs and architecture reviews,
and when estimating a new project. The same order (requirements →
numbers → interfaces → data → architecture → risks) works for real work.
    `.trim(),
    whenNotToUse: `
Don't apply it rigidly. If the interviewer wants to skip estimates or go
straight to one component, follow them. For a narrow question ("how would
you design a rate limiter's algorithm?"), go deep immediately instead of
drawing the whole system.
    `.trim(),
    commonMistakes: [
      "Jumping into components and technologies before clarifying requirements and scale.",
      "Spending too long on estimates or the high-level diagram and never reaching a real deep dive.",
      "Name-dropping technologies (Kafka, Cassandra, Kubernetes) without explaining why they fit this problem better than simpler options.",
      "Presenting one design as if it were the only option, without stating trade-offs or alternatives.",
      "Designing in silence, or ignoring the interviewer's hints and questions instead of treating it as a collaboration.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "For 'design a pastebin', write 4 functional and 3 non-functional requirements, and list 2 things you'd declare out of scope." },
      { difficulty: "Medium", prompt: "Run steps 1–5 of the framework for a 'design a rate-limited public API for weather data' prompt in 20 minutes, with a timer." },
      { difficulty: "Hard", prompt: "Do a full 45-minute mock for 'design a news feed' with a friend acting as interviewer. Afterwards, list where you lost time and which trade-offs you failed to state." },
    ],
    interviewQuestions: [
      { question: "What's the first thing you do in a system design interview?", answer: "Clarify requirements: core features, users and scale, read/write patterns, latency and consistency needs, and what's out of scope. Then confirm the list with the interviewer before designing." },
      { question: "What's the difference between functional and non-functional requirements? Give examples.", answer: "Functional: what the system does ('users can post photos', 'users see a feed'). Non-functional: how well ('p99 feed load < 200 ms', '99.99% available', 'eventual consistency acceptable', '100M DAU')." },
      { question: "Why do estimates before the high-level design?", answer: "The numbers determine the architecture: whether one database suffices, whether a cache or CDN is needed, whether to shard, and which path (reads or writes) needs optimising." },
      { question: "Why define the API and data model before drawing the architecture?", answer: "They make the problem concrete. The access patterns (which queries, by which keys, how often) drive the storage choice, indexes, partitioning keys and caching strategy." },
      { question: "How do you choose what to deep dive into?", answer: "Pick the part that's hardest or most specific to the problem (fan-out for a feed, ID generation for a shortener, matching for ride-hailing), or follow the interviewer's lead. Compare options and justify a choice." },
      { question: "How should you discuss trade-offs?", answer: "Name at least two options, what each optimises for and what it costs (latency, consistency, complexity, cost), then pick one based on the stated requirements. 'It depends' is only useful when followed by what it depends on." },
      { question: "What makes a deep dive senior-level rather than junior-level?", answer: "Covering failure modes and edge cases (retries, idempotency, hot keys, partial failures), operational concerns (monitoring, migrations, rollout), quantitative reasoning, and knowing when a simpler design is enough." },
      { question: "How do you handle a requirement you don't know how to solve?", answer: "Say so, reason from first principles out loud, propose a simple approach that works, then discuss how to improve it. Interviewers value reasoning and honesty over bluffing." },
      { question: "What are common reasons candidates fail system design interviews?", answer: "Not clarifying scope, no numbers, a vague diagram with no data flow, no depth on any component, ignoring failures, no trade-offs, poor time management, and not engaging with the interviewer's hints." },
      { question: "How would you identify bottlenecks in your own design?", answer: "Trace each request path and check every component against the estimated load, look for single points of failure, shared resources (one DB, one hot key), synchronous chains, and ask what happens when each component is slow or down." },
    ],
    prerequisites: ["what-is-system-design", "back-of-the-envelope-estimation"],
    relatedTopics: ["back-of-the-envelope-estimation", "availability-and-slas", "scalability", "rest-apis", "databases", "caching", "unique-id-generation", "hot-keys-and-thundering-herd"],
    keywords: ["system design interview", "framework", "requirements", "functional requirements", "non-functional requirements", "high-level design", "deep dive", "trade-offs", "url shortener"],
  },
];
