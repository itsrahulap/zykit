import type { Problem } from "../../types/problem";

export const advancedGraphsProblems: Problem[] = [
  {
    id: "reconstruct-itinerary",
    title: "Reconstruct Itinerary",
    difficulty: "Hard",
    category: "advanced-graphs",
    description: `
You're given a list of airline tickets, each written as a pair
\`[from, to]\` of three-letter airport codes. All the tickets belong to
one traveler, and using every single ticket exactly once, they must be
able to fly a complete route.

The trip always starts at \`"JFK"\`. Reconstruct the itinerary - the
order of airports visited - as a list of airport codes. If more than
one valid itinerary uses every ticket exactly once, return the one
that comes first alphabetically when you compare it stop by stop (for
example, an itinerary that visits \`"ATL"\` before \`"SFO"\` at some point
is preferred over one that visits \`"SFO"\` before \`"ATL"\` at that same
point). You may assume the input always has at least one valid
itinerary that uses every ticket.
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
      "Think of each ticket as a directed edge between two airports. Reconstructing the itinerary means walking every edge in the graph exactly once - that's a classic graph-traversal problem in disguise.",
      "At each airport, when you have a choice of several outgoing tickets, always try the alphabetically smallest destination first - that's how you get the lexically smallest itinerary among valid options.",
      "A greedy 'always take the smallest option' DFS can get stuck in a dead end partway through, using up some tickets while leaving others unreachable. The fix is to only add an airport to the *front* of your route once you're certain there's nothing left to explore from it (Hierholzer's algorithm) - that guarantees every ticket really does get used.",
    ],
    approachOverview: `
Every ticket is a directed edge from one airport to another, and using
each ticket exactly once means walking every edge in this graph exactly
once - the classic **Eulerian path** problem. The input guarantees such
a path exists starting from \`"JFK"\`.

A naive greedy DFS - always fly to the alphabetically smallest reachable
airport - produces the *lexically smallest* route among valid options,
but can dead-end early: you might use up a ticket that strands you at
an airport with unused tickets you can no longer reach.

The reliable fix is **Hierholzer's algorithm**: do the same greedy DFS,
but instead of recording an airport the moment you visit it, only
record it once you've fully explored (used up) all of its outgoing
tickets, and *prepend* it to the result. Any airport that turns out to
be a dead end simply gets recorded (prepended) immediately, and the
route naturally reroutes around it once you unwind the recursion -
because the airport that led into that dead end still has other
tickets left to try, and those get explored (and prepended) afterward,
ending up later in the final order than the dead-end branch. Working
through a few small examples by hand makes this "record on exit,
prepend" trick click.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Try Every Ticket Order",
        explanation: `
Since there are at most a few hundred tickets, one very naive approach
is to treat this as choosing a permutation of the tickets to use one at
a time: at each airport, try every unused ticket departing from it (in
alphabetical order of destination, so the first complete route you
find is already the lexically smallest one), recurse, and backtrack if
a choice leads to a dead end before every ticket is used. This
explores the same search space as a real DFS/backtracking solution but
makes the backtracking explicit and returns as soon as one complete
route is found.
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
        timeComplexity: "O(E^2) in the worst case, where E is the number of tickets, since each of the E steps may re-scan and backtrack across the ticket list",
        spaceComplexity: "O(E) for the recursion stack, the route, and the used-ticket tracking",
      },
      {
        approach: "Optimal - Hierholzer's Algorithm",
        explanation: `
Group tickets by departure airport, sorting each airport's destinations
alphabetically so the smallest option is tried first. Then run a DFS
that, at each airport, repeatedly removes and follows the smallest
remaining destination until that airport has no destinations left.

The key trick: only push an airport onto the result once its DFS call
is about to return (meaning every outgoing ticket from it has been
used). Because destinations are removed from the front of a sorted
list as they're used, an airport that turns out to be a dead end gets
pushed immediately, while the airport that led into it keeps exploring
its remaining tickets and gets pushed only afterward - later in
recursion, so it ends up appearing *before* the dead-end branch once
you reverse the pushes at the end. Reversing the final list gives the
route in the correct forward order.
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
          { code: 'destinations.sort().reverse();', explanation: "Puts each airport's destinations in descending order so .pop() always removes the alphabetically smallest one that's left." },
          { code: "const next = destinations.pop();", explanation: "Follows and consumes the smallest remaining ticket out of the current airport." },
          { code: "visit(next);", explanation: "Recurses into the destination before trying the current airport's next-smallest ticket." },
          { code: "route.push(airport);", explanation: "Only records this airport once every one of its outgoing tickets has been fully explored - a dead end gets recorded right away." },
          { code: "return route.reverse();", explanation: "Airports were recorded in reverse visiting order (dead ends first), so reversing restores the correct start-to-finish itinerary." },
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
You're given the coordinates of several points on a 2D plane, as a list
\`points\` where \`points[i] = [xi, yi]\`.

The cost of directly connecting any two points is the **Manhattan
distance** between them: \`|xi - xj| + |yi - yj|\`.

Find the minimum total cost of a set of connections that links all the
points together, so that there is *some* path (possibly through other
points) between every pair of points.
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
      "You don't need every possible connection - just enough to link all the points, with no wasted extra connections. That's a Minimum Spanning Tree over a complete graph where every pair of points is connected with a cost equal to their Manhattan distance.",
      "Because every pair of points is a potential edge, building the full edge list for Kruskal's algorithm takes O(n^2) space and time - fine for the given limits, but worth noticing.",
      "Prim's algorithm avoids building the full edge list up front: grow one tree by always adding the cheapest edge from the tree to any point not yet in it, tracking the best known connecting cost per outside point as you go.",
    ],
    approachOverview: `
This is asking for a **Minimum Spanning Tree (MST)**: pick a subset of
connections, of minimum total cost, that links every point into one
connected group, using exactly \`n - 1\` connections for \`n\` points (any
spanning tree with a valid cycle-free structure has exactly that many
edges).

Since every pair of points can be directly connected, this is really an
MST over a *complete* graph, where the edge weight between any two
points is their Manhattan distance.

Two classic MST algorithms apply. **Kruskal's algorithm** builds the
full list of \`n * (n - 1) / 2\` possible edges, sorts them by cost, and
greedily adds each edge (using a union-find structure to skip edges
that would form a cycle) until all points are connected. **Prim's
algorithm** instead grows a single tree from one starting point,
repeatedly adding the cheapest edge connecting the current tree to any
point outside of it - this avoids ever materializing the full edge
list, which matters more as \`n\` grows.
    `.trim(),
    solutions: [
      {
        approach: "Kruskal's Algorithm - Sort Edges + Union-Find",
        explanation: `
Build every possible edge between pairs of points along with its
Manhattan-distance cost, then sort all edges from cheapest to most
expensive. Walk through the sorted edges and greedily add each one to
the growing spanning tree, *unless* its two endpoints are already
connected (adding it would create a useless cycle). A union-find
(disjoint set) structure answers "are these two points already
connected?" and merges groups quickly. Stop once \`n - 1\` edges have
been added - the tree now spans every point.
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
Start a tree with just one point. Keep an array \`minCost\` recording,
for every point not yet in the tree, the cheapest cost seen so far to
connect it directly to *some* point already in the tree (initialized
to infinity, except the starting point). Repeatedly pick the
not-yet-included point with the smallest \`minCost\`, add it to the
tree, add its cost to the running total, and then update \`minCost\` for
every remaining point based on its distance to the point that was just
added. After \`n\` points have been added this way, every point is
connected and the running total is the MST cost. This never needs to
build or sort the full \`O(n^2)\` edge list.
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
          { code: "minCost[0] = 0;", explanation: "Starts the tree at point 0 with zero cost to include it." },
          { code: "if (!inTree[i] && (u === -1 || minCost[i] < minCost[u])) { u = i; }", explanation: "Finds the cheapest point not yet in the tree to add next." },
          { code: "inTree[u] = true; totalCost += minCost[u];", explanation: "Commits to adding that point, paying its recorded connection cost." },
          { code: "const cost = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);", explanation: "Computes the Manhattan distance from the newly added point to each remaining point." },
          { code: "if (cost < minCost[v]) { minCost[v] = cost; }", explanation: "Updates the cheapest-known connection cost for a remaining point if the new point offers a better one." },
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
A network has \`n\` nodes, labeled from \`1\` to \`n\`. You're given a list
of directed, weighted edges \`times[i] = [ui, vi, wi]\`, meaning a signal
sent from node \`ui\` reaches node \`vi\` after \`wi\` units of time.

A signal is sent out from a starting node \`k\`. Return the minimum time
it takes for *every* node in the network to receive the signal. If
some node can never receive the signal, return \`-1\`.
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
      "You need the shortest time from k to every other node, then the answer is just the largest of those shortest times - the last node reached determines when the whole network has heard the signal.",
      "All edge weights are non-negative, which is exactly the condition Dijkstra's algorithm needs to find shortest paths efficiently from a single source.",
      "Use a min-priority-queue (min-heap) keyed on 'time reached so far' so you always expand the currently-closest unvisited node next, and never revisit a node once its shortest time is finalized.",
    ],
    approachOverview: `
This is a single-source shortest path problem: find the shortest time
from \`k\` to every other node, then the answer is the *maximum* of
those shortest times (since the whole network isn't informed until the
farthest node gets the signal). If any node is unreachable, the answer
is \`-1\`.

Because all travel times are non-negative, **Dijkstra's algorithm**
applies directly: repeatedly pick the not-yet-finalized node with the
smallest known distance, finalize it, and relax (try to improve) the
distances of its neighbors. A min-heap keeps picking that "smallest
known distance" node efficient.

A simpler but slower alternative is **Bellman-Ford**-style relaxation:
repeatedly loop over every edge, relaxing distances, for up to \`n - 1\`
rounds - correct for any edge weights (even negative ones), just
slower here since it doesn't take advantage of the non-negative
weights the way Dijkstra's does.
    `.trim(),
    solutions: [
      {
        approach: "Bellman-Ford Style Relaxation",
        explanation: `
Start with the distance to \`k\` at 0 and every other node at infinity.
Repeat, up to \`n - 1\` times: go through every edge \`[u, v, w]\`, and if
the known distance to \`u\` plus \`w\` is smaller than the currently known
distance to \`v\`, update it. After enough rounds, every shortest
distance is finalized (a shortest path uses at most \`n - 1\` edges).
The answer is the largest finite distance, or \`-1\` if any node is still
unreachable.
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
Build an adjacency list from the edges. Use a min-heap of
\`[distance, node]\` pairs, starting with \`[0, k]\`. Repeatedly pop the
smallest-distance entry; if that node's shortest distance isn't
already finalized, finalize it and push \`[newDistance, neighbor]\` for
every neighbor whose distance improves. Because the heap always
surfaces the closest not-yet-finalized node next, once a node is
popped and finalized its distance can never improve again - this is
what makes Dijkstra faster than blindly relaxing every edge repeatedly.
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
          { code: "const heap = [[0, k]];", explanation: "Starts the search from k, which is at distance 0 from itself." },
          { code: "const [d, node] = pop();", explanation: "Always processes the not-yet-finalized node currently believed closest to k." },
          { code: "if (visited[node]) continue;", explanation: "Skips a node whose shortest distance is already finalized - later, larger entries for it in the heap are stale." },
          { code: "if (d + weight < dist[next]) { dist[next] = d + weight; push([dist[next], next]); }", explanation: "Relaxes a neighbor's distance and, if it improved, queues it for future processing at its new distance." },
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
You're given an \`n x n\` grid where \`grid[r][c]\` is the elevation at
cell \`(r, c)\`. It starts raining at time \`0\`, and by time \`t\` the water
level everywhere is exactly \`t\`.

You start at the top-left cell \`(0, 0)\` and want to reach the
bottom-right cell \`(n - 1, n - 1)\`. At any point you may move between
four-directionally adjacent cells, but only if *both* cells you're
moving between have elevation no greater than the current water level
(otherwise one of them is still "dry land" sticking up above the
water, or you'd have to climb it, which isn't allowed).

Return the minimum time at which it becomes possible to swim from the
top-left cell to the bottom-right cell.
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
      "The 'time' at which a path becomes usable is really the highest elevation you're forced to step on anywhere along that path. You want the path that minimizes that maximum-elevation-stepped-on.",
      "This is the same shape as a shortest-path problem, except 'cost so far' along a path means 'the highest elevation seen so far on it,' not a sum. Dijkstra's algorithm generalizes directly if you swap addition for a max.",
      "Alternatively, binary search directly on the answer time T: for a fixed T, a plain BFS/DFS using only cells with elevation <= T tells you whether the destination is reachable at that T. Search for the smallest T where it is.",
    ],
    approachOverview: `
Reframe the question: for any path from the top-left to the bottom-right,
define its "cost" as the *highest single elevation* you must step on
along that path. The answer is the minimum such cost over all possible
paths - because that's exactly the earliest time at which the water
level is high enough for a fully swimmable path to exist.

That reframing turns this into a shortest-path problem where "combining"
two path segments takes the *max* of their costs instead of the sum -
so a Dijkstra-style approach works: always expand the reachable cell
with the smallest "highest elevation so far," and finalize cells in
that order, exactly like normal Dijkstra but comparing/combining with
\`Math.max\` instead of \`+\`.

A different, equally valid strategy is **binary search on the answer**:
guess a time \`T\`, and check with a simple BFS/DFS (only stepping on
cells with elevation \`<= T\`) whether the destination is reachable.
Since reachability only ever improves as \`T\` grows, binary search for
the smallest \`T\` that works.
    `.trim(),
    solutions: [
      {
        approach: "Binary Search + BFS",
        explanation: `
The set of times \`T\` for which the destination is reachable (using only
cells with elevation \`<= T\`) is "monotonic": once reachable at some
\`T\`, it stays reachable for every larger \`T\` too (more cells only ever
become usable as \`T\` grows, never fewer). That monotonicity is exactly
what binary search needs. Binary search over candidate times from
\`0\` to \`n * n - 1\` (the largest possible elevation), and for each
candidate \`T\` run a BFS/DFS from \`(0, 0)\` that may only step on cells
with elevation \`<= T\`, checking whether \`(n - 1, n - 1)\` is reached.
Find the smallest \`T\` for which it is.
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
Treat each grid cell as a graph node, connected to its four neighbors.
The "distance" to reach a cell along a given path is the highest
elevation stepped on anywhere along that path, and combining a step
onto a new cell takes \`Math.max(costSoFar, newCell's elevation)\` rather
than a sum. Run Dijkstra's algorithm with that modified combining rule:
use a min-heap keyed on this "highest elevation so far" cost, always
expand the cheapest not-yet-finalized cell, and stop as soon as the
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
          { code: "best[0][0] = grid[0][0];", explanation: "The starting cell's own elevation is the minimum water level needed just to be standing there." },
          { code: "const [cost, r, c] = pop();", explanation: "Always expands the not-yet-finalized cell reachable via the smallest possible 'highest elevation so far.'" },
          { code: "if (r === n - 1 && c === n - 1) return cost;", explanation: "The first time the bottom-right cell is finalized, its cost is the true minimum swim time - Dijkstra's ordering guarantees no cheaper way to reach it exists." },
          { code: "const newCost = Math.max(cost, grid[nr][nc]);", explanation: "Stepping onto a neighbor only raises the path's cost if that neighbor's own elevation exceeds everything seen so far." },
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
There's an alien language that uses the same English alphabet letters,
but possibly in a *different order*. You're given a list of words from
this language's dictionary, and this list is sorted according to the
alien language's (unknown) rules for alphabetical order - the same way
an English dictionary is sorted according to English's a-through-z
order.

From this sorted word list, work out one valid ordering of the letters
of the alien alphabet, and return it as a string with each letter
appearing once. If the given word list is inconsistent with *any*
possible letter ordering, return an empty string. If more than one
ordering is consistent with the word list, return any one of them.
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
      "Compare each pair of consecutive words and find the first position where their letters differ - that single letter pair tells you 'this letter comes before that letter' in the alien alphabet. Ignore everything after that first difference.",
      "One special case: if a word is a prefix of the previous word (e.g. 'abc' appears right before 'ab'), that's a contradiction - no ordering can make a longer word sort before its own prefix. Return empty in that case.",
      "Once you've turned every consecutive pair into a 'this letter before that letter' edge, you have a directed graph over letters, and a valid alphabet ordering is any topological sort of it. If the graph has a cycle, no valid ordering exists.",
    ],
    approachOverview: `
Every consecutive pair of words in the list gives one clue: scan both
words left to right for the *first* position where their letters
differ - the letter from the earlier word must come before the letter
from the later word in the alien alphabet. (If no differing position
is found because one word is a prefix of the other, the *only* valid
case is the shorter word coming first; if the longer word comes first,
that's an immediate contradiction, since a word can never sort before
its own prefix.)

Collecting these clues from every consecutive pair builds a directed
graph where an edge \`a -> b\` means "\`a\` comes before \`b\`." Any valid
alphabet ordering is then just a **topological sort** of this graph -
found either with repeated removal of in-degree-zero nodes (Kahn's
algorithm) or with a DFS-based ordering that also detects cycles. If
the graph has a cycle, no valid ordering exists and the answer is an
empty string. Any letters that appear in the words but never get an
edge still need to appear somewhere in the output.
    `.trim(),
    solutions: [
      {
        approach: "Build Graph + Kahn's Algorithm (BFS Topological Sort)",
        explanation: `
First collect every letter that appears anywhere in the word list, and
build a directed graph (adjacency list plus in-degree counts) from the
ordering clues found between each pair of consecutive words. Then run
Kahn's algorithm: start a queue with every letter that has in-degree
zero (no letter is known to come before it), repeatedly pop a letter,
append it to the result, and decrement the in-degree of everything it
points to, adding any letter whose in-degree drops to zero. If the
final result doesn't include every letter, the graph had a cycle (or
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
        timeComplexity: "O(C) where C is the total number of characters across all words, since building the graph scans each word once and the topological sort visits every letter and edge once",
        spaceComplexity: "O(1) for the graph and in-degree map, since there are at most 26 letters, plus O(C) used while scanning the words",
        walkthrough: [
          { code: "for (let j = 0; j < minLen; j++) { if (first[j] !== second[j]) { ... break; } }", explanation: "Finds the first differing letter position between two consecutive words - only that first difference carries an ordering clue." },
          { code: 'if (!foundDifference && first.length > second.length) { return ""; }', explanation: "Catches the contradiction where a longer word appears before its own prefix, which no letter ordering can fix." },
          { code: "for (const ch of allLetters) { if (inDegree.get(ch) === 0) queue.push(ch); }", explanation: "Starts the topological sort from every letter that has no known letter required before it." },
          { code: "return order.length === allLetters.size ? order.join(\"\") : \"\";", explanation: "If not every letter made it into the order, some letters were stuck in a cycle - so there is no valid ordering." },
        ],
      },
      {
        approach: "DFS-Based Topological Sort with Cycle Detection",
        explanation: `
Build the same directed graph of ordering clues. Then run a DFS from
every letter, tracking each letter's state as *unvisited*, *currently
on the active path* (\`visiting\`), or *fully processed* (\`visited\`).
After fully exploring all of a letter's outgoing edges, append that
letter to the result - so letters that depend on nothing further get
appended first. If the DFS ever reaches a letter that is currently
\`visiting\` (still on the active path), that's a cycle, so return an
empty string. Reversing the final append order gives a valid topological
ordering.
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
          { code: 'if (state.get(ch) === "visiting") { hasCycle = true; return; }', explanation: "Reaching a letter that's still on the current DFS path means there's a cycle - no valid ordering exists." },
          { code: 'state.set(ch, "visiting");', explanation: "Marks this letter as being actively explored, so a later revisit while still active is caught as a cycle." },
          { code: "for (const next of graph.get(ch)) { dfs(next); }", explanation: "Explores every letter that must come after this one before this one gets recorded." },
          { code: "state.set(ch, \"visited\"); order.push(ch);", explanation: "Only records a letter once everything after it has been fully explored, so letters end up appended in reverse topological order." },
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
There are \`n\` cities, labeled \`0\` through \`n - 1\`, connected by some
flights. You're given \`flights[i] = [from, to, price]\`, meaning there's
a direct flight from \`from\` to \`to\` costing \`price\`.

Given a starting city \`src\`, a destination city \`dst\`, and an integer
\`k\`, find the cheapest total price to fly from \`src\` to \`dst\` using
**at most \`k\` stops** (layovers) along the way - meaning at most
\`k + 1\` flights total. If there's no valid route within that many
stops, return \`-1\`.
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
      "This is a shortest-path problem with an extra twist: a path is only valid if it uses at most k + 1 flights (edges) total, even if a cheaper path exists using more flights.",
      "Plain Dijkstra's algorithm doesn't track 'how many edges used so far,' so it can lock in a cheap-but-too-long path and never reconsider - the stop limit needs to be tracked as part of each state, not applied after the fact.",
      "Bellman-Ford's edge-relaxation idea adapts naturally: relax every flight, but do it in exactly k + 1 rounds, and within each round make sure every relaxation reads from *last round's* prices, not ones already updated this round - otherwise you'd accidentally let a single round chain together more than one extra flight.",
    ],
    approachOverview: `
This looks like a shortest-path problem, but with a hard limit on the
*number of edges* used, which plain Dijkstra's algorithm doesn't
naturally track (it would happily lock in a cheap path that uses too
many stops, and never revisit that city with a more-expensive-but-
within-limit path).

The clean fix is a **Bellman-Ford style relaxation**, run for exactly
\`k + 1\` rounds (since at most \`k\` stops means at most \`k + 1\` flights).
In each round, relax every flight - try updating the destination's
price using the source's price *from the end of the previous round*.
Using last round's snapshot (rather than letting updates chain within
the same round) is what correctly limits each round to adding exactly
one more flight to any path.

A closely related alternative is a modified Dijkstra / BFS where each
queue entry tracks both a city and how many flights have been used to
reach it so far, expanding stop-by-stop (a "leveled" BFS) rather than
strictly by cheapest-cost-first.
    `.trim(),
    solutions: [
      {
        approach: "Optimal - Bellman-Ford Style Relaxation",
        explanation: `
Track the cheapest known price to reach every city, starting at 0 for
\`src\` and infinity elsewhere. Run exactly \`k + 1\` rounds. In each
round, take a fresh copy of the current prices, and for every flight
\`[from, to, price]\`, check whether last round's price at \`from\` plus
this flight's price improves the *new* copy's price at \`to\`. After the
round, replace the working prices with the new copy. Using a fresh
copy each round guarantees a round only ever adds exactly one more
flight to any path, which is exactly what keeps the stop count bounded
by the number of rounds.
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
          { code: "prices[src] = 0;", explanation: "The starting city costs nothing to be at, before any flights are taken." },
          { code: "const nextPrices = prices.slice();", explanation: "Snapshots this round's starting prices so updates made during the round don't leak into and chain within the same round." },
          { code: "if (prices[from] === Infinity) continue;", explanation: "Skips a flight whose origin isn't reachable yet - relaxing from an unreachable city would be meaningless." },
          { code: "if (candidate < nextPrices[to]) { nextPrices[to] = candidate; }", explanation: "Improves the price to reach 'to' using exactly one more flight than was reflected in last round's prices." },
          { code: "prices = nextPrices;", explanation: "Commits this round's improvements, now allowing the next round to build one more flight on top of them." },
        ],
      },
      {
        approach: "Modified Dijkstra with Stops Tracked in State",
        explanation: `
Use a min-heap of \`[cost, city, stopsUsed]\`, starting from
\`[0, src, 0]\`. Repeatedly pop the cheapest entry; if it's the
destination, that cost is the answer (Dijkstra's ordering still
guarantees it's cheapest among states popped so far). Otherwise, if
\`stopsUsed <= k\`, push a new entry for every outgoing flight, with one
more stop used. To avoid wasted work, skip expanding a city again once
it's been reached with an equal-or-fewer stop count at an equal-or-
lower cost previously - but never prune purely on cost the way plain
Dijkstra would, since a more expensive route with more remaining stops
budget can still turn out to matter.
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
          { code: "if (city === dst) return cost;", explanation: "The first time dst is popped, it's popped at the cheapest possible cost among all valid states explored so far, so that's the answer." },
          { code: "if (stopsUsed > k || stopsUsed >= bestStopsAtCity[city]) continue;", explanation: "Skips a state that either exceeds the stop budget or is no better (same or more stops) than a way this city was already reached - without pruning purely on cost, since a costlier state can still have a stops-budget advantage worth keeping." },
          { code: "push([cost + price, next, stopsUsed + 1]);", explanation: "Queues flying onward to the next city, one stop deeper." },
        ],
      },
    ],
    relatedProblems: ["network-delay-time", "swim-in-rising-water"],
    keywords: ["cheapest flights within k stops", "bellman-ford", "dijkstra's algorithm", "shortest path", "priority queue", "constrained shortest path"],
  },
];
