import type { Problem } from "../../types/problem";

export const advancedGraphsProblems: Problem[] = [
  {
    id: "reconstruct-itinerary",
    title: "Reconstruct Itinerary",
    difficulty: "Hard",
    category: "advanced-graphs",
    description: `
You're given one traveler's airline tickets, each a pair \`[from, to]\` of
three-letter airport codes. The trip starts at \`"JFK"\` and uses every
ticket exactly once.

Return the itinerary as a list of airport codes, in visiting order. If
several itineraries work, return the one that comes first alphabetically,
compared stop by stop (visiting \`"ATL"\` beats visiting \`"SFO"\` at the
same stop). The input always has at least one valid itinerary.
    `.trim(),
    examples: [
      {
        input: 'tickets = [["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]',
        output: '["JFK","MUC","LHR","SFO","SJC"]',
        explanation: "There's only one way to use every ticket starting from JFK.",
      },
      {
        input: 'tickets = [["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],["ATL","JFK"],["ATL","SFO"]]',
        output: '["JFK","ATL","JFK","SFO","ATL","SFO"]',
        explanation: `
Two different itineraries use every ticket exactly once - this one, and
["JFK","SFO","ATL","JFK","ATL","SFO"]. Comparing them stop by stop, the
second stop is "ATL" vs "SFO", and "ATL" is alphabetically smaller, so
the itinerary starting "JFK","ATL",... is preferred.
        `.trim(),
      },
    ],
    constraints: [
      "1 <= tickets.length <= 300",
      "tickets[i].length == 2",
      "All airport codes are three uppercase English letters.",
      "You may assume every itinerary uses all the tickets and forms at least one valid route.",
    ],
    hints: [
      "Each ticket is a directed edge. The itinerary walks every edge exactly once - a classic graph-traversal problem.",
      "At each airport, try the alphabetically smallest destination first - that gives the lexically smallest itinerary.",
      "A greedy 'smallest first' DFS can hit a dead end and leave tickets unused. The fix (Hierholzer's algorithm): add an airport to the *front* of the route only when nothing is left to explore from it - that guarantees every ticket is used.",
    ],
    approachOverview: `
Each ticket is a directed edge, and using every ticket once means walking
every edge once - the classic **Eulerian path** problem. The input
guarantees such a path exists from \`"JFK"\`.

A naive greedy DFS (always fly to the smallest airport) aims for the
*lexically smallest* route, but can dead-end early: a ticket might strand
you where unused tickets are out of reach.

**Hierholzer's algorithm** fixes this. Run the same greedy DFS, but record
an airport only after all its outgoing tickets are used, and *prepend* it
to the result. A dead end is recorded right away. The airport that led
into it still has tickets to try; those are explored and prepended
afterward, so in the final order they come before the dead-end branch,
which ends up last. Tracing a few small examples by hand makes this
"record on exit, prepend" trick click.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Try Every Ticket Order",
        explanation: `
With at most a few hundred tickets, a naive approach picks tickets one at
a time. At each airport, try every unused ticket leaving it, in
alphabetical order of destination (so the first complete route found is
the lexically smallest). Recurse, and backtrack if a choice dead-ends
before every ticket is used. It returns as soon as one complete route is
found.
        `.trim(),
        code: `function findItinerary(tickets) {
  const routesFrom = new Map();
  for (const [from, to] of tickets) {
    if (!routesFrom.has(from)) routesFrom.set(from, []);
    routesFrom.get(from).push(to);
  }
  for (const destinations of routesFrom.values()) {
    destinations.sort();
  }

  const used = new Array(tickets.length).fill(false);
  const route = ["JFK"];

  function backtrack(current) {
    if (route.length === tickets.length + 1) return true;

    const destinations = routesFrom.get(current) || [];
    for (let i = 0; i < destinations.length; i++) {
      // Find some unused ticket from "current" to destinations[i] - this
      // re-scans the whole ticket list on every step, which is what
      // makes this the brute force version rather than the optimal one.
      let ticketIndex = -1;
      for (let j = 0; j < tickets.length; j++) {
        if (tickets[j][0] === current && tickets[j][1] === destinations[i] && !used[j]) {
          ticketIndex = j;
          break;
        }
      }
      if (ticketIndex === -1) continue;

      used[ticketIndex] = true;
      route.push(destinations[i]);

      if (backtrack(destinations[i])) return true;

      route.pop();
      used[ticketIndex] = false;
    }
    return false;
  }

  backtrack("JFK");
  return route;
}`,
        timeComplexity: "O(E^2) in the worst case, where E is the number of tickets, since each of the E steps may re-scan the ticket list",
        spaceComplexity: "O(E) for the recursion stack, the route, and the used-ticket tracking",
      },
      {
        approach: "Optimal - Hierholzer's Algorithm",
        explanation: `
Group tickets by departure airport and sort each airport's destinations so
the smallest is tried first. Run a DFS that, at each airport, removes and
follows the smallest remaining destination until none are left.

The key trick: push an airport onto the result only when its DFS call is
about to return (all its outgoing tickets are used). A dead end is pushed
immediately, while the airport that led into it explores its remaining
tickets and is pushed later - so after reversing, it appears *before* the
dead-end branch. Reversing the final list gives the route in forward
order.
        `.trim(),
        code: `function findItinerary(tickets) {
  const routesFrom = new Map();
  for (const [from, to] of tickets) {
    if (!routesFrom.has(from)) routesFrom.set(from, []);
    routesFrom.get(from).push(to);
  }
  for (const destinations of routesFrom.values()) {
    // Sort descending so the alphabetically smallest destination can
    // be removed cheaply from the end of the array.
    destinations.sort().reverse();
  }

  const route = [];

  function visit(airport) {
    const destinations = routesFrom.get(airport);
    while (destinations && destinations.length > 0) {
      const next = destinations.pop();
      visit(next);
    }
    route.push(airport);
  }

  visit("JFK");
  return route.reverse();
}`,
        timeComplexity: "O(E log E) for sorting each airport's destination list, then O(E) for the traversal itself, where E is the number of tickets",
        spaceComplexity: "O(E) to store the routes-by-airport map and the recursion stack",
        walkthrough: [
          { code: 'destinations.sort().reverse();', explanation: "Sorts destinations in descending order so .pop() removes the smallest one left." },
          { code: "const next = destinations.pop();", explanation: "Uses the smallest remaining ticket from this airport." },
          { code: "visit(next);", explanation: "Recurses into the destination before trying this airport's next ticket." },
          { code: "route.push(airport);", explanation: "Records the airport only after all its outgoing tickets are explored - a dead end is recorded right away." },
          { code: "return route.reverse();", explanation: "Airports were recorded in reverse order (dead ends first), so reversing gives the start-to-finish itinerary." },
        ],
      },
    ],
    relatedProblems: ["network-delay-time"],
    keywords: ["reconstruct itinerary", "eulerian path", "hierholzer's algorithm", "dfs", "graph traversal"],
  },
  {
    id: "min-cost-to-connect-all-points",
    title: "Min Cost to Connect All Points",
    difficulty: "Medium",
    category: "advanced-graphs",
    description: `
You're given points on a 2D plane, where \`points[i] = [xi, yi]\`.
Connecting two points costs their **Manhattan distance**:
\`|xi - xj| + |yi - yj|\`.

Find the minimum total cost to connect all the points, so there's *some*
path (possibly through other points) between every pair.
    `.trim(),
    examples: [
      {
        input: "points = [[0,0],[2,2],[3,10],[5,2],[7,0]]",
        output: "20",
        explanation: "One cheapest way connects the points in a tree using edges totaling 20, rather than paying for every possible pairwise connection.",
      },
      {
        input: "points = [[3,12],[-2,5],[-4,1]]",
        output: "18",
        explanation: "Connecting (-4,1)-(-2,5) costs 6, and (-2,5)-(3,12) costs 12, for a total of 18 - cheaper than any other way to link all three points.",
      },
      {
        input: "points = [[0,0],[1,1],[1,0],[0,1]]",
        output: "3",
        explanation: "These four points form a unit square where every side (but not the diagonals) costs 1 to connect; a spanning tree needs only 3 of those unit-cost sides, for a total of 3.",
      },
    ],
    constraints: [
      "1 <= points.length <= 1000",
      "-10^6 <= xi, yi <= 10^6",
      "All pairs of points are distinct.",
    ],
    hints: [
      "You need just enough connections to link all points, with none wasted. That's a Minimum Spanning Tree over a complete graph, with Manhattan distance as each edge's cost.",
      "Every pair is a potential edge, so Kruskal's full edge list takes O(n^2) space and time - fine for these limits, but worth noticing.",
      "Prim's algorithm skips the full edge list: grow one tree by adding the cheapest edge to a point outside it, tracking the best known cost for each outside point.",
    ],
    approachOverview: `
This asks for a **Minimum Spanning Tree (MST)**: the cheapest set of
connections linking every point into one group. For \`n\` points it uses
exactly \`n - 1\` connections (every cycle-free spanning tree does).

Every pair of points can connect directly, so it's an MST over a
*complete* graph with Manhattan distances as edge weights.

Two classic algorithms apply:

- **Kruskal's** builds all \`n * (n - 1) / 2\` edges, sorts them by cost, and adds each one unless it would form a cycle (checked with union-find), until all points connect.
- **Prim's** grows one tree from a start point, always adding the cheapest edge from the tree to a point outside it. It never builds the full edge list, which matters more as \`n\` grows.
    `.trim(),
    solutions: [
      {
        approach: "Kruskal's Algorithm - Sort Edges + Union-Find",
        explanation: `
Build every edge between pairs of points with its Manhattan cost, and sort
them from cheapest to most expensive. Add each edge to the tree *unless*
its endpoints are already connected (it would create a useless cycle). A
union-find (disjoint set) structure answers "already connected?" and
merges groups quickly. Stop after \`n - 1\` edges - the tree spans every
point.
        `.trim(),
        code: `function minCostConnectPoints(points) {
  const n = points.length;
  const edges = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const cost = Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]);
      edges.push([cost, i, j]);
    }
  }
  edges.sort((a, b) => a[0] - b[0]);

  const parent = Array.from({ length: n }, (_, i) => i);
  function find(x) {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }

  let totalCost = 0;
  let edgesUsed = 0;
  for (const [cost, i, j] of edges) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI === rootJ) continue;
    parent[rootI] = rootJ;
    totalCost += cost;
    edgesUsed++;
    if (edgesUsed === n - 1) break;
  }

  return totalCost;
}`,
        timeComplexity: "O(n^2 log n), dominated by sorting the O(n^2) candidate edges",
        spaceComplexity: "O(n^2) to store every candidate edge",
      },
      {
        approach: "Optimal - Prim's Algorithm",
        explanation: `
Start the tree with one point. An array \`minCost\` holds, for each point
outside the tree, the cheapest known cost to connect it to *some* point in
the tree (infinity at first, except the start point).

Repeatedly pick the outside point with the smallest \`minCost\`, add it to
the tree and its cost to the total, then update \`minCost\` for the
remaining points using their distance to the new point. After \`n\`
points, the total is the MST cost. The full \`O(n^2)\` edge list is never
built or sorted.
        `.trim(),
        code: `function minCostConnectPoints(points) {
  const n = points.length;
  const inTree = new Array(n).fill(false);
  const minCost = new Array(n).fill(Infinity);
  minCost[0] = 0;

  let totalCost = 0;

  for (let added = 0; added < n; added++) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!inTree[i] && (u === -1 || minCost[i] < minCost[u])) {
        u = i;
      }
    }

    inTree[u] = true;
    totalCost += minCost[u];

    for (let v = 0; v < n; v++) {
      if (inTree[v]) continue;
      const cost = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);
      if (cost < minCost[v]) {
        minCost[v] = cost;
      }
    }
  }

  return totalCost;
}`,
        timeComplexity: "O(n^2), since each of the n rounds scans all n points to pick the next one and to update costs",
        spaceComplexity: "O(n) for the minCost and inTree arrays",
        walkthrough: [
          { code: "minCost[0] = 0;", explanation: "Starts the tree at point 0, at zero cost." },
          { code: "if (!inTree[i] && (u === -1 || minCost[i] < minCost[u])) { u = i; }", explanation: "Finds the cheapest point outside the tree." },
          { code: "inTree[u] = true; totalCost += minCost[u];", explanation: "Adds that point, paying its connection cost." },
          { code: "const cost = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);", explanation: "Computes the Manhattan distance from the new point to each remaining point." },
          { code: "if (cost < minCost[v]) { minCost[v] = cost; }", explanation: "Lowers a remaining point's cost if the new point is closer." },
        ],
      },
    ],
    relatedProblems: ["network-delay-time"],
    keywords: ["minimum spanning tree", "mst", "prim's algorithm", "kruskal's algorithm", "union find", "manhattan distance"],
  },
  {
    id: "network-delay-time",
    title: "Network Delay Time",
    difficulty: "Medium",
    category: "advanced-graphs",
    description: `
A network has \`n\` nodes labeled \`1\` to \`n\`, and directed, weighted edges
\`times[i] = [ui, vi, wi]\`: a signal from \`ui\` reaches \`vi\` after \`wi\`
units of time.

A signal is sent from node \`k\`. Return the minimum time for *every* node
to receive it, or \`-1\` if some node never can.
    `.trim(),
    examples: [
      {
        input: "times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2",
        output: "2",
        explanation: "From node 2, nodes 1 and 3 are reached at time 1, and node 3 forwards to node 4 at time 2 - so all nodes are reached by time 2.",
      },
      {
        input: "times = [[1,2,1]], n = 2, k = 1",
        output: "1",
        explanation: "Node 2 receives the signal from node 1 after 1 unit of time.",
      },
      {
        input: "times = [[1,2,1]], n = 2, k = 2",
        output: "-1",
        explanation: "There's no edge leaving node 2, so node 1 can never receive the signal.",
      },
    ],
    constraints: [
      "1 <= n <= 100",
      "1 <= times.length <= 6000",
      "1 <= ui, vi <= n",
      "ui != vi",
      "0 <= wi <= 100",
      "There are no duplicate edges and no self-loops.",
    ],
    hints: [
      "Find the shortest time from k to every node; the answer is the largest of those - the last node reached decides when the whole network has the signal.",
      "All edge weights are non-negative - exactly what Dijkstra's algorithm needs for efficient single-source shortest paths.",
      "Use a min-heap keyed on 'time reached so far' to always expand the closest unvisited node next, and never revisit a node once its time is final.",
    ],
    approachOverview: `
This is single-source shortest path: find the shortest time from \`k\` to
every node. The answer is the *maximum* of those times, since the network
isn't informed until the farthest node is. If any node is unreachable,
return \`-1\`.

All times are non-negative, so **Dijkstra's algorithm** applies: pick the
unfinalized node with the smallest known distance, finalize it, and relax
(try to improve) its neighbors' distances. A min-heap makes picking that
node efficient.

A simpler, slower alternative is **Bellman-Ford**-style relaxation: loop
over every edge, relaxing distances, for up to \`n - 1\` rounds. It works
for any weights (even negative), but doesn't exploit non-negative weights
the way Dijkstra's does.
    `.trim(),
    solutions: [
      {
        approach: "Bellman-Ford Style Relaxation",
        explanation: `
Set the distance to \`k\` to 0 and all others to infinity. Up to \`n - 1\`
times, go through every edge \`[u, v, w]\` and, if the distance to \`u\`
plus \`w\` beats the distance to \`v\`, update it. A shortest path uses at
most \`n - 1\` edges, so that's enough rounds. The answer is the largest
distance, or \`-1\` if any node is still unreachable.
        `.trim(),
        code: `function networkDelayTime(times, n, k) {
  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;

  for (let round = 0; round < n - 1; round++) {
    let updated = false;
    for (const [u, v, w] of times) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        updated = true;
      }
    }
    if (!updated) break;
  }

  let maxDist = 0;
  for (let node = 1; node <= n; node++) {
    if (dist[node] === Infinity) return -1;
    maxDist = Math.max(maxDist, dist[node]);
  }
  return maxDist;
}`,
        timeComplexity: "O(n * E), where E is the number of edges, from up to n - 1 rounds each scanning every edge",
        spaceComplexity: "O(n) for the distance array",
      },
      {
        approach: "Optimal - Dijkstra's Algorithm",
        explanation: `
Build an adjacency list. Use a min-heap of \`[distance, node]\` pairs,
starting with \`[0, k]\`. Pop the smallest entry; if that node isn't
finalized yet, finalize it and push \`[newDistance, neighbor]\` for every
neighbor whose distance improves.

The heap always gives the closest unfinalized node next, so a finalized
distance can never improve - that's why Dijkstra beats relaxing every
edge again and again.
        `.trim(),
        code: `function networkDelayTime(times, n, k) {
  const graph = new Map();
  for (const [u, v, w] of times) {
    if (!graph.has(u)) graph.set(u, []);
    graph.get(u).push([v, w]);
  }

  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;

  // Simple binary min-heap keyed on distance.
  const heap = [[0, k]];
  function push(item) {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent][0] <= heap[i][0]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  }
  function pop() {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      while (true) {
        let smallest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < heap.length && heap[left][0] < heap[smallest][0]) smallest = left;
        if (right < heap.length && heap[right][0] < heap[smallest][0]) smallest = right;
        if (smallest === i) break;
        [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
        i = smallest;
      }
    }
    return top;
  }

  const visited = new Array(n + 1).fill(false);
  while (heap.length > 0) {
    const [d, node] = pop();
    if (visited[node]) continue;
    visited[node] = true;

    const neighbors = graph.get(node) || [];
    for (const [next, weight] of neighbors) {
      if (d + weight < dist[next]) {
        dist[next] = d + weight;
        push([dist[next], next]);
      }
    }
  }

  let maxDist = 0;
  for (let node = 1; node <= n; node++) {
    if (dist[node] === Infinity) return -1;
    maxDist = Math.max(maxDist, dist[node]);
  }
  return maxDist;
}`,
        timeComplexity: "O(E log E), where E is the number of edges, from each edge potentially pushing one heap entry",
        spaceComplexity: "O(n + E) for the adjacency list, distance array, and heap",
        walkthrough: [
          { code: "const heap = [[0, k]];", explanation: "Starts from k, at distance 0." },
          { code: "const [d, node] = pop();", explanation: "Processes the unfinalized node currently closest to k." },
          { code: "if (visited[node]) continue;", explanation: "Skips an already-finalized node - its later, larger heap entries are stale." },
          { code: "if (d + weight < dist[next]) { dist[next] = d + weight; push([dist[next], next]); }", explanation: "Relaxes a neighbor and, if its distance improved, queues it at the new distance." },
        ],
      },
    ],
    relatedProblems: ["cheapest-flights-within-k-stops", "swim-in-rising-water"],
    keywords: ["network delay time", "dijkstra's algorithm", "shortest path", "bellman-ford", "priority queue", "min heap"],
  },
  {
    id: "swim-in-rising-water",
    title: "Swim in Rising Water",
    difficulty: "Hard",
    category: "advanced-graphs",
    description: `
In an \`n x n\` grid, \`grid[r][c]\` is the elevation of cell \`(r, c)\`. Rain
starts at time \`0\`, and at time \`t\` the water level everywhere is \`t\`.

You start at \`(0, 0)\` and want to reach \`(n - 1, n - 1)\`. You can move
up, down, left or right, but only if *both* cells have elevation no
greater than the current water level (you can't climb out of the water).

Return the minimum time at which you can swim from the top-left to the
bottom-right cell.
    `.trim(),
    examples: [
      {
        input: "grid = [[0,2],[1,3]]",
        output: "3",
        explanation: "At time 3, every cell's elevation (0, 2, 1, 3) is at most 3, so all cells (and thus a path between the corners) become usable. No smaller time makes all needed cells usable.",
      },
      {
        input: "grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]",
        output: "16",
        explanation: "There's a path along which the highest elevation you must cross is 16, and no path avoids needing to cross at least elevation 16.",
      },
    ],
    constraints: [
      "n == grid.length == grid[i].length",
      "1 <= n <= 50",
      "0 <= grid[i][j] < n^2",
      "Every value in grid is unique.",
    ],
    hints: [
      "A path becomes usable at the highest elevation along it. You want the path that minimizes that maximum.",
      "It's a shortest-path problem where 'cost so far' is the highest elevation seen, not a sum. Dijkstra's algorithm works if you swap addition for max.",
      "Or binary search on the time T: for a fixed T, a plain BFS/DFS over cells with elevation <= T tells you if the destination is reachable. Find the smallest such T.",
    ],
    approachOverview: `
Define a path's "cost" as the *highest elevation* along it. The answer is
the minimum cost over all paths from top-left to bottom-right - the
earliest time the water is high enough for a swimmable path.

This is a shortest-path problem where combining path segments takes the
*max* of their costs instead of the sum. So Dijkstra works: always expand
the reachable cell with the smallest "highest elevation so far", using
\`Math.max\` instead of \`+\`.

Another valid strategy is **binary search on the answer**: guess a time
\`T\` and check with BFS/DFS (only cells with elevation \`<= T\`) whether
the destination is reachable. Reachability only improves as \`T\` grows,
so binary search for the smallest \`T\` that works.
    `.trim(),
    solutions: [
      {
        approach: "Binary Search + BFS",
        explanation: `
Reachability (using only cells with elevation \`<= T\`) is monotonic: once
the destination is reachable at \`T\`, it stays reachable for every larger
\`T\`, since more cells become usable. That's what binary search needs.

Binary search over times from \`0\` to \`n * n - 1\` (the largest possible
elevation). For each \`T\`, run a BFS/DFS from \`(0, 0)\` over cells with
elevation \`<= T\` and check whether \`(n - 1, n - 1)\` is reached. Find the
smallest \`T\` that works.
        `.trim(),
        code: `function swimInWater(grid) {
  const n = grid.length;

  function canReachBy(T) {
    if (grid[0][0] > T) return false;
    const visited = Array.from({ length: n }, () => new Array(n).fill(false));
    const stack = [[0, 0]];
    visited[0][0] = true;

    while (stack.length > 0) {
      const [r, c] = stack.pop();
      if (r === n - 1 && c === n - 1) return true;

      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 && nr < n && nc >= 0 && nc < n &&
          !visited[nr][nc] && grid[nr][nc] <= T
        ) {
          visited[nr][nc] = true;
          stack.push([nr, nc]);
        }
      }
    }
    return visited[n - 1][n - 1];
  }

  let low = Math.max(grid[0][0], grid[n - 1][n - 1]);
  let high = n * n - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (canReachBy(mid)) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low;
}`,
        timeComplexity: "O(n^2 log(n^2)) - each of the O(log(n^2)) binary search steps runs an O(n^2) grid traversal",
        spaceComplexity: "O(n^2) for the visited grid and traversal stack",
      },
      {
        approach: "Optimal - Dijkstra-Style Search",
        explanation: `
Treat each cell as a graph node connected to its four neighbors. A path's
"distance" is the highest elevation along it, so stepping onto a new cell
costs \`Math.max(costSoFar, newCell's elevation)\` instead of a sum.

Run Dijkstra with that rule: a min-heap keyed on "highest elevation so
far", always expanding the cheapest unfinalized cell. Stop when the
bottom-right cell is finalized - its cost is the answer.
        `.trim(),
        code: `function swimInWater(grid) {
  const n = grid.length;
  const best = Array.from({ length: n }, () => new Array(n).fill(Infinity));
  best[0][0] = grid[0][0];

  const heap = [[grid[0][0], 0, 0]];
  function push(item) {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent][0] <= heap[i][0]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  }
  function pop() {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      while (true) {
        let smallest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < heap.length && heap[left][0] < heap[smallest][0]) smallest = left;
        if (right < heap.length && heap[right][0] < heap[smallest][0]) smallest = right;
        if (smallest === i) break;
        [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
        i = smallest;
      }
    }
    return top;
  }

  const visited = Array.from({ length: n }, () => new Array(n).fill(false));

  while (heap.length > 0) {
    const [cost, r, c] = pop();
    if (visited[r][c]) continue;
    visited[r][c] = true;
    if (r === n - 1 && c === n - 1) return cost;

    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n || visited[nr][nc]) continue;

      const newCost = Math.max(cost, grid[nr][nc]);
      if (newCost < best[nr][nc]) {
        best[nr][nc] = newCost;
        push([newCost, nr, nc]);
      }
    }
  }

  return best[n - 1][n - 1];
}`,
        timeComplexity: "O(n^2 log n), since each of the n^2 cells can be pushed onto the heap a constant number of times",
        spaceComplexity: "O(n^2) for the best-cost grid, visited grid, and heap",
        walkthrough: [
          { code: "best[0][0] = grid[0][0];", explanation: "The start cell's elevation is the minimum water level needed to stand there." },
          { code: "const [cost, r, c] = pop();", explanation: "Expands the unfinalized cell with the smallest 'highest elevation so far.'" },
          { code: "if (r === n - 1 && c === n - 1) return cost;", explanation: "When the bottom-right cell is finalized, its cost is the minimum swim time - Dijkstra's ordering guarantees nothing cheaper exists." },
          { code: "const newCost = Math.max(cost, grid[nr][nc]);", explanation: "A step only raises the cost if the neighbor is higher than everything seen so far." },
        ],
      },
    ],
    relatedProblems: ["network-delay-time", "cheapest-flights-within-k-stops"],
    keywords: ["swim in rising water", "dijkstra's algorithm", "binary search", "bfs", "grid graph", "minimax path"],
  },
  {
    id: "alien-dictionary",
    title: "Alien Dictionary",
    difficulty: "Hard",
    category: "advanced-graphs",
    description: `
An alien language uses English letters, possibly in a *different order*.
You're given a list of its words, sorted by the alien alphabet's
(unknown) order - the way an English dictionary is sorted a to z.

Return one valid ordering of the alien alphabet as a string, each letter
once. If no ordering fits the word list, return an empty string. If
several fit, return any of them.
    `.trim(),
    examples: [
      {
        input: 'words = ["wrt","wrf","er","ett","rftt"]',
        output: '"wertf"',
        explanation: "Comparing consecutive words: wrt/wrf gives t before f, wrf/er gives w before e, er/ett gives r before t, ett/rftt gives e before r. Together these force the order w, e, r, t, f.",
      },
      {
        input: 'words = ["z","x"]',
        output: '"zx"',
        explanation: "The first word starts with z, the second with x, so z must come before x in this alphabet.",
      },
      {
        input: 'words = ["z","x","z"]',
        output: '""',
        explanation: "z before x (from words 1-2) and x before z (from words 2-3) can't both be true, so no valid ordering exists.",
      },
    ],
    constraints: [
      "1 <= words.length <= 100",
      "1 <= words[i].length <= 100",
      "words[i] consists only of lowercase English letters.",
    ],
    hints: [
      "For each pair of consecutive words, find the first position where the letters differ - that pair tells you 'this letter comes before that one'. Ignore everything after it.",
      "Special case: if a word is a prefix of the previous word ('abc' right before 'ab'), that's a contradiction - a word can't sort after its own extension. Return empty.",
      "The 'before' clues form a directed graph over letters, and any topological sort of it is a valid alphabet. A cycle means no valid ordering exists.",
    ],
    approachOverview: `
Each pair of consecutive words gives one clue: at the *first* position
where they differ, the earlier word's letter comes before the later
word's. If there's no difference because one word is a prefix of the
other, the shorter word must come first; otherwise it's a contradiction,
since a word can never sort before its own prefix.

These clues form a directed graph where \`a -> b\` means "\`a\` comes before
\`b\`." Any valid alphabet is a **topological sort** of it, found by
repeatedly removing in-degree-zero nodes (Kahn's algorithm) or by a DFS
that also detects cycles. A cycle means no valid ordering, so return an
empty string. Letters that appear in the words but have no edges must
still appear in the output.
    `.trim(),
    solutions: [
      {
        approach: "Build Graph + Kahn's Algorithm (BFS Topological Sort)",
        explanation: `
Collect every letter in the word list, and build a directed graph
(adjacency list plus in-degree counts) from the clues between consecutive
words.

Then run Kahn's algorithm. Queue every letter with in-degree zero (nothing
known to come before it). Pop a letter, append it to the result, and
decrement the in-degree of each letter it points to, queueing any that
reach zero. If the result is missing letters, the graph had a cycle (or
an unresolved tie), so return an empty string.
        `.trim(),
        code: `function alienOrder(words) {
  const allLetters = new Set();
  for (const word of words) {
    for (const ch of word) allLetters.add(ch);
  }

  const graph = new Map();
  const inDegree = new Map();
  for (const ch of allLetters) {
    graph.set(ch, new Set());
    inDegree.set(ch, 0);
  }

  for (let i = 0; i < words.length - 1; i++) {
    const first = words[i];
    const second = words[i + 1];
    const minLen = Math.min(first.length, second.length);

    let foundDifference = false;
    for (let j = 0; j < minLen; j++) {
      if (first[j] !== second[j]) {
        if (!graph.get(first[j]).has(second[j])) {
          graph.get(first[j]).add(second[j]);
          inDegree.set(second[j], inDegree.get(second[j]) + 1);
        }
        foundDifference = true;
        break;
      }
    }

    // "abc" before "ab" can never be valid - a word can't sort before its own prefix.
    if (!foundDifference && first.length > second.length) {
      return "";
    }
  }

  const queue = [];
  for (const ch of allLetters) {
    if (inDegree.get(ch) === 0) queue.push(ch);
  }

  const order = [];
  while (queue.length > 0) {
    const ch = queue.shift();
    order.push(ch);
    for (const next of graph.get(ch)) {
      inDegree.set(next, inDegree.get(next) - 1);
      if (inDegree.get(next) === 0) queue.push(next);
    }
  }

  return order.length === allLetters.size ? order.join("") : "";
}`,
        timeComplexity: "O(C) where C is the total number of characters across all words: building the graph scans each word once, and the sort visits every letter and edge once",
        spaceComplexity: "O(1) for the graph and in-degree map, since there are at most 26 letters, plus O(C) used while scanning the words",
        walkthrough: [
          { code: "for (let j = 0; j < minLen; j++) { if (first[j] !== second[j]) { ... break; } }", explanation: "Finds the first differing position between two consecutive words - only that difference is a clue." },
          { code: 'if (!foundDifference && first.length > second.length) { return ""; }', explanation: "Catches a longer word appearing before its own prefix, which no ordering can fix." },
          { code: "for (const ch of allLetters) { if (inDegree.get(ch) === 0) queue.push(ch); }", explanation: "Starts the sort from every letter with nothing required before it." },
          { code: "return order.length === allLetters.size ? order.join(\"\") : \"\";", explanation: "Missing letters were stuck in a cycle, so there's no valid ordering." },
        ],
      },
      {
        approach: "DFS-Based Topological Sort with Cycle Detection",
        explanation: `
Build the same graph. Run a DFS from every letter, tracking each letter
as *unvisited*, *on the active path* (\`visiting\`), or *done*
(\`visited\`).

Append a letter to the result after all its outgoing edges are explored,
so letters with nothing after them come first. Reaching a \`visiting\`
letter means a cycle, so return an empty string. Reversing the append
order gives a valid topological ordering.
        `.trim(),
        code: `function alienOrder(words) {
  const allLetters = new Set();
  for (const word of words) {
    for (const ch of word) allLetters.add(ch);
  }

  const graph = new Map();
  for (const ch of allLetters) graph.set(ch, new Set());

  for (let i = 0; i < words.length - 1; i++) {
    const first = words[i];
    const second = words[i + 1];
    const minLen = Math.min(first.length, second.length);

    let foundDifference = false;
    for (let j = 0; j < minLen; j++) {
      if (first[j] !== second[j]) {
        graph.get(first[j]).add(second[j]);
        foundDifference = true;
        break;
      }
    }
    if (!foundDifference && first.length > second.length) {
      return "";
    }
  }

  const state = new Map(); // "visiting" | "visited"
  const order = [];
  let hasCycle = false;

  function dfs(ch) {
    if (hasCycle) return;
    if (state.get(ch) === "visiting") {
      hasCycle = true;
      return;
    }
    if (state.get(ch) === "visited") return;

    state.set(ch, "visiting");
    for (const next of graph.get(ch)) {
      dfs(next);
    }
    state.set(ch, "visited");
    order.push(ch);
  }

  for (const ch of allLetters) {
    if (state.get(ch) === undefined) dfs(ch);
  }

  if (hasCycle) return "";
  return order.reverse().join("");
}`,
        timeComplexity: "O(C) where C is the total number of characters across all words, for the same reasons as the BFS version",
        spaceComplexity: "O(1) for the graph and state map, since there are at most 26 letters, plus O(C) used while scanning the words",
        walkthrough: [
          { code: 'if (state.get(ch) === "visiting") { hasCycle = true; return; }', explanation: "Reaching a letter still on the current path means a cycle - no valid ordering." },
          { code: 'state.set(ch, "visiting");', explanation: "Marks the letter as active, so revisiting it before it's done is caught as a cycle." },
          { code: "for (const next of graph.get(ch)) { dfs(next); }", explanation: "Explores every letter that must come after this one before recording it." },
          { code: "state.set(ch, \"visited\"); order.push(ch);", explanation: "Records a letter only after everything after it is explored, so letters are appended in reverse topological order." },
        ],
      },
    ],
    relatedProblems: [],
    keywords: ["alien dictionary", "topological sort", "kahn's algorithm", "dfs", "directed graph", "cycle detection"],
  },
  {
    id: "cheapest-flights-within-k-stops",
    title: "Cheapest Flights Within K Stops",
    difficulty: "Medium",
    category: "advanced-graphs",
    description: `
There are \`n\` cities labeled \`0\` to \`n - 1\`, and \`flights[i] = [from, to,
price]\` is a direct flight from \`from\` to \`to\` costing \`price\`.

Given \`src\`, \`dst\` and \`k\`, find the cheapest price from \`src\` to \`dst\`
with **at most \`k\` stops** (layovers) - at most \`k + 1\` flights. If no
such route exists, return \`-1\`.
    `.trim(),
    examples: [
      {
        input: "n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src = 0, dst = 3, k = 1",
        output: "700",
        explanation: "With at most 1 stop, the cheapest route is 0 -> 1 -> 3, costing 100 + 600 = 700. The route 0 -> 1 -> 2 -> 3 is cheaper (300) but uses 2 stops, more than k allows.",
      },
      {
        input: "n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 1",
        output: "200",
        explanation: "With at most 1 stop, 0 -> 1 -> 2 costs 100 + 100 = 200, cheaper than the direct flight 0 -> 2 at 500.",
      },
      {
        input: "n = 3, flights = [[0,1,100],[1,2,100],[0,2,500]], src = 0, dst = 2, k = 0",
        output: "500",
        explanation: "With 0 stops allowed, only the direct flight 0 -> 2 is usable, costing 500.",
      },
    ],
    constraints: [
      "1 <= n <= 100",
      "0 <= flights.length <= (n * (n - 1) / 2)",
      "flights[i] = [from, to, price] with from != to and 1 <= price <= 10^4",
      "0 <= src, dst, k < n",
      "There are no duplicate flights.",
    ],
    hints: [
      "It's shortest path with a twist: a path is valid only with at most k + 1 flights (edges), even if a cheaper, longer one exists.",
      "Plain Dijkstra doesn't track edges used, so it can lock in a cheap-but-too-long path. The stop limit must be part of each state, not checked afterward.",
      "Bellman-Ford adapts well: relax every flight in exactly k + 1 rounds, reading *last round's* prices each time - otherwise one round could chain more than one extra flight.",
    ],
    approachOverview: `
This is shortest path with a hard limit on the *number of edges*, which
plain Dijkstra doesn't track. It would lock in a cheap path with too many
stops and never revisit that city with a costlier path within the limit.

The clean fix is **Bellman-Ford style relaxation** for exactly \`k + 1\`
rounds (at most \`k\` stops = at most \`k + 1\` flights). Each round, relax
every flight using the source's price *from the end of the previous
round*. Using last round's snapshot, instead of letting updates chain
within a round, limits each round to exactly one more flight.

A related alternative is a modified Dijkstra / BFS where each queue entry
tracks a city and the flights used to reach it, expanding stop by stop (a
"leveled" BFS) rather than strictly cheapest first.
    `.trim(),
    solutions: [
      {
        approach: "Optimal - Bellman-Ford Style Relaxation",
        explanation: `
Track the cheapest price to each city: 0 for \`src\`, infinity elsewhere.
Run exactly \`k + 1\` rounds. Each round, copy the current prices. For every
flight \`[from, to, price]\`, check whether last round's price at \`from\`
plus this price improves the *copy's* price at \`to\`. Then replace the
prices with the copy.

The fresh copy means each round adds exactly one more flight to any path,
which keeps the stop count bounded by the number of rounds.
        `.trim(),
        code: `function findCheapestPrice(n, flights, src, dst, k) {
  let prices = new Array(n).fill(Infinity);
  prices[src] = 0;

  for (let round = 0; round < k + 1; round++) {
    const nextPrices = prices.slice();

    for (const [from, to, price] of flights) {
      if (prices[from] === Infinity) continue;
      const candidate = prices[from] + price;
      if (candidate < nextPrices[to]) {
        nextPrices[to] = candidate;
      }
    }

    prices = nextPrices;
  }

  return prices[dst] === Infinity ? -1 : prices[dst];
}`,
        timeComplexity: "O(k * E), where E is the number of flights, since each of the k + 1 rounds relaxes every flight once",
        spaceComplexity: "O(n) for the two price arrays",
        walkthrough: [
          { code: "prices[src] = 0;", explanation: "Being at the start city costs nothing." },
          { code: "const nextPrices = prices.slice();", explanation: "Snapshots the prices so updates during this round don't chain within it." },
          { code: "if (prices[from] === Infinity) continue;", explanation: "Skips flights from cities not reachable yet." },
          { code: "if (candidate < nextPrices[to]) { nextPrices[to] = candidate; }", explanation: "Improves the price to 'to' using one more flight than last round's prices." },
          { code: "prices = nextPrices;", explanation: "Commits this round's improvements so the next round can add one more flight." },
        ],
      },
      {
        approach: "Modified Dijkstra with Stops Tracked in State",
        explanation: `
Use a min-heap of \`[cost, city, stopsUsed]\`, starting with \`[0, src, 0]\`.
Pop the cheapest entry. If it's the destination, its cost is the answer
(Dijkstra's ordering still guarantees it's the cheapest so far).
Otherwise, if \`stopsUsed <= k\`, push an entry for every outgoing flight
with one more stop.

To avoid wasted work, skip a city already reached with equal or fewer
stops at equal or lower cost. Never prune on cost alone like plain
Dijkstra: a costlier route with more stops left can still matter.
        `.trim(),
        code: `function findCheapestPrice(n, flights, src, dst, k) {
  const graph = new Map();
  for (const [from, to, price] of flights) {
    if (!graph.has(from)) graph.set(from, []);
    graph.get(from).push([to, price]);
  }

  // Best stops used to reach a city at-or-below a given cost; used only
  // to skip strictly-dominated states, never to prune by cost alone.
  const bestStopsAtCity = new Array(n).fill(Infinity);

  const heap = [[0, src, 0]];
  function push(item) {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent][0] <= heap[i][0]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  }
  function pop() {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      while (true) {
        let smallest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < heap.length && heap[left][0] < heap[smallest][0]) smallest = left;
        if (right < heap.length && heap[right][0] < heap[smallest][0]) smallest = right;
        if (smallest === i) break;
        [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
        i = smallest;
      }
    }
    return top;
  }

  while (heap.length > 0) {
    const [cost, city, stopsUsed] = pop();
    if (city === dst) return cost;
    if (stopsUsed > k || stopsUsed >= bestStopsAtCity[city]) continue;
    bestStopsAtCity[city] = stopsUsed;

    const neighbors = graph.get(city) || [];
    for (const [next, price] of neighbors) {
      push([cost + price, next, stopsUsed + 1]);
    }
  }

  return -1;
}`,
        timeComplexity: "O(E * k * log(E * k)) in the worst case, since a city can be re-expanded up to k times and each push/pop is logarithmic in heap size",
        spaceComplexity: "O(n + E * k) for the graph and the heap, which can hold multiple entries per city",
        walkthrough: [
          { code: "const heap = [[0, src, 0]];", explanation: "Starts at src with zero cost and zero stops used." },
          { code: "if (city === dst) return cost;", explanation: "The first time dst is popped, it's at the cheapest cost among valid states, so that's the answer." },
          { code: "if (stopsUsed > k || stopsUsed >= bestStopsAtCity[city]) continue;", explanation: "Skips a state over the stop budget, or no better (same or more stops) than an earlier visit - never pruning on cost alone, since a costlier state may have stops to spare." },
          { code: "push([cost + price, next, stopsUsed + 1]);", explanation: "Queues the flight to the next city, one stop deeper." },
        ],
      },
    ],
    relatedProblems: ["network-delay-time", "swim-in-rising-water"],
    keywords: ["cheapest flights within k stops", "bellman-ford", "dijkstra's algorithm", "shortest path", "priority queue", "constrained shortest path"],
  },
];
