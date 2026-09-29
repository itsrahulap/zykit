import type { Problem } from "../../types/problem";

export const graphsMoreProblems: Problem[] = [
  {
    id: "course-schedule",
    title: "Course Schedule",
    difficulty: "Medium",
    category: "graphs",
    description: `
There are \`numCourses\` courses, labeled from \`0\` to \`numCourses - 1\`.
Some courses have a prerequisite: you're given a list of pairs
\`[a, b]\`, each meaning "you must finish course \`b\` before you're
allowed to take course \`a\`."

Given \`numCourses\` and this list of prerequisite pairs, decide whether
it is possible to finish *all* of the courses.
    `.trim(),
    examples: [
      {
        input: "numCourses = 2, prerequisites = [[1, 0]]",
        output: "true",
        explanation: "Take course 0 first, then course 1. No conflict.",
      },
      {
        input: "numCourses = 2, prerequisites = [[1, 0], [0, 1]]",
        output: "false",
        explanation: "Course 1 needs course 0 first, but course 0 needs course 1 first - neither can ever go first.",
      },
      {
        input: "numCourses = 4, prerequisites = [[1, 0], [2, 0], [3, 1], [3, 2]]",
        output: "true",
        explanation: "One valid order is 0, 1, 2, 3 - course 0 has no prerequisites, and every later course's prerequisites come before it.",
      },
    ],
    constraints: [
      "1 <= numCourses <= 2000",
      "0 <= prerequisites.length <= 5000",
      "prerequisites[i].length == 2",
      "There are no duplicate prerequisite pairs.",
    ],
    hints: [
      "Model this as a directed graph: draw an edge from b to a whenever [a, b] says 'b before a'. Now the question is really about that graph's shape.",
      "It's impossible to finish all courses exactly when the graph has a cycle - a cycle means every course on it is waiting on another course on the same cycle, so none of them can ever go first.",
      "To detect a cycle with a graph traversal, you need more than a plain 'have I visited this node before' check. Track nodes that are 'currently on the path you're exploring right now' separately from nodes you've fully finished with - revisiting a node that's still on the current path is the cycle.",
    ],
    approachOverview: `
Build a directed graph where an edge from \`b\` to \`a\` means "\`b\` must
come before \`a\`." Now finishing all courses is possible exactly when
this graph has **no cycle** - if there were a cycle, every course on it
would be stuck waiting for another course on the very same cycle.

One way to check for a cycle is a DFS that tracks each node's state:
*unvisited*, *currently being explored* (on the active recursion path),
or *fully done* (already confirmed cycle-free). If the DFS ever walks
into a node that is "currently being explored," that's a back-edge into
the current path - a cycle - so the answer is false. If DFS finishes
exploring every node without ever doing that, there's no cycle and the
answer is true.

A different, non-recursive way to reach the same conclusion is
**Kahn's algorithm**: repeatedly peel off courses that currently have
no remaining prerequisites. If you can eventually peel off every
course this way, there's no cycle.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Try Every Ordering",
        explanation: `
Finishing all courses is possible exactly when *some* ordering of the
courses respects every prerequisite pair. The most naive way to check
that is to literally generate every possible ordering of the courses
and test each one against every prerequisite pair, stopping as soon as
one ordering works.
        `.trim(),
        code: `function canFinish(numCourses, prerequisites) {
  const courses = Array.from({ length: numCourses }, (_, i) => i);

  function isValidOrder(order) {
    const position = new Map();
    order.forEach((course, index) => position.set(course, index));

    for (const [a, b] of prerequisites) {
      if (position.get(b) > position.get(a)) return false; // b must come before a
    }
    return true;
  }

  function permute(start) {
    if (start === courses.length) {
      return isValidOrder(courses);
    }
    for (let i = start; i < courses.length; i++) {
      [courses[start], courses[i]] = [courses[i], courses[start]];
      if (permute(start + 1)) return true;
      [courses[start], courses[i]] = [courses[i], courses[start]];
    }
    return false;
  }

  return permute(0);
}`,
        timeComplexity: "O(n! × (n + p)) - n! orderings, each checked against p prerequisite pairs",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal - DFS Cycle Detection",
        explanation: `
Build an adjacency list from the prerequisites, then DFS from every
course, tagging each node as *visiting* (on the current recursion
path) or *done* (fully explored, no cycle found through it). If DFS
ever reaches a node already tagged *visiting*, that's a cycle, so
finishing is impossible.
        `.trim(),
        code: `function canFinish(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => []);
  for (const [a, b] of prerequisites) {
    graph[b].push(a); // b must be taken before a
  }

  const UNVISITED = 0, VISITING = 1, DONE = 2;
  const state = new Array(numCourses).fill(UNVISITED);

  function hasCycle(course) {
    if (state[course] === VISITING) return true; // back edge into current path
    if (state[course] === DONE) return false; // already confirmed safe

    state[course] = VISITING;
    for (const next of graph[course]) {
      if (hasCycle(next)) return true;
    }
    state[course] = DONE;
    return false;
  }

  for (let course = 0; course < numCourses; course++) {
    if (hasCycle(course)) return false;
  }
  return true;
}`,
        timeComplexity: "O(V + E) - every course and every prerequisite edge is visited once",
        spaceComplexity: "O(V + E) for the adjacency list, plus O(V) for the state array and recursion stack",
        walkthrough: [
          { code: "graph[b].push(a);", explanation: "Builds a directed edge b -> a: 'b unlocks a'." },
          { code: "if (state[course] === VISITING) return true;", explanation: "Reaching a node that's still on the current DFS path means we've looped back into it - a cycle." },
          { code: "state[course] = VISITING; ... state[course] = DONE;", explanation: "Marks the node as 'in progress' before recursing into its neighbors, then 'safe' once every neighbor comes back cycle-free." },
        ],
      },
    ],
    relatedProblems: ["course-schedule-ii", "graph-valid-tree"],
    keywords: ["course schedule", "cycle detection", "topological sort", "directed graph", "dfs"],
  },

  {
    id: "course-schedule-ii",
    title: "Course Schedule II",
    difficulty: "Medium",
    category: "graphs",
    description: `
There are \`numCourses\` courses, labeled from \`0\` to \`numCourses - 1\`,
and a list of prerequisite pairs \`[a, b]\`, each meaning "course \`b\`
must be finished before course \`a\`."

Return *one* valid order in which you could take all the courses. If
it's impossible to finish every course (because of a conflicting
requirement), return an empty array instead.
    `.trim(),
    examples: [
      {
        input: "numCourses = 2, prerequisites = [[1, 0]]",
        output: "[0, 1]",
        explanation: "Course 0 has no prerequisites, so it goes first; course 1 needs course 0 first.",
      },
      {
        input: "numCourses = 4, prerequisites = [[1, 0], [2, 0], [3, 1], [3, 2]]",
        output: "[0, 1, 2, 3]",
        explanation: "0 has no prerequisites, 1 and 2 only need 0, and 3 needs both 1 and 2. [0, 2, 1, 3] would also be accepted.",
      },
      {
        input: "numCourses = 1, prerequisites = []",
        output: "[0]",
        explanation: "A single course with no prerequisites can always be taken.",
      },
    ],
    constraints: [
      "1 <= numCourses <= 2000",
      "0 <= prerequisites.length <= numCourses × (numCourses - 1)",
      "There are no duplicate prerequisite pairs.",
    ],
    hints: [
      "This is the same underlying question as Course Schedule - is there a cycle? - but now you also need to actually produce a working order, not just a yes/no answer.",
      "A course can be taken as soon as every one of its prerequisites has already been taken. Track, for each course, how many prerequisites it's still waiting on (its 'in-degree').",
      "Start with every course that has zero remaining prerequisites. Every time you take a course, that unblocks its dependents - decrease their remaining-prerequisite counts, and any that drop to zero become takeable next.",
    ],
    approachOverview: `
Think of each course's **in-degree** as "how many prerequisites does it
still need before it's takeable." A course can be added to the order
the moment its in-degree hits zero.

Start by finding every course whose in-degree is already zero - those
can go first. As each course gets added to the order, "remove" it from
the graph by decreasing the in-degree of every course that depends on
it. Any course whose in-degree drops to zero is now takeable, so it
joins the pool of next candidates. Keep repeating this until no more
courses can be taken.

If every course eventually gets added, the resulting order is valid.
If some courses are left over with in-degree still above zero, they're
stuck in a cycle with each other - it's impossible, so return \`[]\`.
This peeling process is exactly **Kahn's algorithm** for topological
sorting, and it can be driven with a simple queue.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Round-by-Round Simulation",
        explanation: `
Repeatedly scan all not-yet-taken courses; in each pass, take every
course whose prerequisites have all already been taken. If a full pass
takes nothing new, the remaining courses are stuck in a cycle, so stop.
        `.trim(),
        code: `function findOrder(numCourses, prerequisites) {
  const taken = new Array(numCourses).fill(false);
  const order = [];

  const prereqsOf = Array.from({ length: numCourses }, () => []);
  for (const [a, b] of prerequisites) {
    prereqsOf[a].push(b);
  }

  while (order.length < numCourses) {
    let takenSomething = false;

    for (let course = 0; course < numCourses; course++) {
      if (taken[course]) continue;
      if (prereqsOf[course].every((p) => taken[p])) {
        taken[course] = true;
        order.push(course);
        takenSomething = true;
      }
    }

    if (!takenSomething) break; // remaining courses are stuck in a cycle
  }

  return order.length === numCourses ? order : [];
}`,
        timeComplexity: "O(V × (V + E)) - up to V passes, each scanning every course and its prerequisites",
        spaceComplexity: "O(V + E)",
      },
      {
        approach: "Optimal - BFS / Kahn's Algorithm",
        explanation: `
Compute each course's in-degree, seed a queue with every course that
already has in-degree zero, then repeatedly pop a course, append it to
the order, and decrease the in-degree of its dependents - pushing any
that reach zero. If the final order includes every course, it's valid.
        `.trim(),
        code: `function findOrder(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => []);
  const inDegree = new Array(numCourses).fill(0);

  for (const [a, b] of prerequisites) {
    graph[b].push(a); // b unlocks a
    inDegree[a]++;
  }

  const queue = [];
  for (let course = 0; course < numCourses; course++) {
    if (inDegree[course] === 0) queue.push(course);
  }

  const order = [];
  while (queue.length > 0) {
    const course = queue.shift();
    order.push(course);

    for (const next of graph[course]) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }

  return order.length === numCourses ? order : [];
}`,
        timeComplexity: "O(V + E) - every course is queued once and every edge is relaxed once",
        spaceComplexity: "O(V + E)",
        walkthrough: [
          { code: "inDegree[a]++;", explanation: "Counts how many prerequisites each course still has outstanding." },
          { code: "if (inDegree[course] === 0) queue.push(course);", explanation: "Any course with nothing left to wait for can be taken right away." },
          { code: "inDegree[next]--; if (inDegree[next] === 0) queue.push(next);", explanation: "Taking a course removes one blocker from its dependents; a dependent joins the queue the moment it has none left." },
          { code: "return order.length === numCourses ? order : [];", explanation: "If some courses never reached in-degree zero, they're stuck in a cycle with each other, so no valid order exists." },
        ],
      },
    ],
    relatedProblems: ["course-schedule", "graph-valid-tree"],
    keywords: ["course schedule ii", "topological sort", "kahn's algorithm", "in-degree", "bfs"],
  },

  {
    id: "redundant-connection",
    title: "Redundant Connection",
    difficulty: "Medium",
    category: "graphs",
    description: `
You start with a tree of \`n\` nodes labeled \`1\` to \`n\`, connected by
\`n - 1\` edges. One extra edge then got added on top of that tree,
which creates exactly one cycle somewhere in the graph.

You're given the final list of \`n\` edges, in the order they were
added. Find the one edge that can be removed so the graph becomes a
valid tree again. If more than one edge could be removed to break the
cycle, return the one that appears *last* in the input list.
    `.trim(),
    examples: [
      {
        input: "edges = [[1, 2], [1, 3], [2, 3]]",
        output: "[2, 3]",
        explanation: "1-2 and 1-3 already form a tree connecting all three nodes; adding 2-3 on top closes a cycle, and it's the last edge added.",
      },
      {
        input: "edges = [[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]",
        output: "[1, 4]",
        explanation: "1-2-3-4 is a path, and 1-4 closes it into a cycle. 1-5 is added afterward but doesn't touch the cycle.",
      },
    ],
    constraints: [
      "n == edges.length",
      "3 <= n <= 1000",
      "Each edges[i] = [ai, bi] with 1 <= ai, bi <= n and ai != bi",
      "No repeated edges appear in the input.",
    ],
    hints: [
      "Process the edges one at a time, in the order given, and keep track of which nodes are already connected to each other through edges seen so far.",
      "The very first edge you encounter that connects two nodes that were *already* connected to each other must be the one that closes the cycle.",
      "'Are these two nodes already connected?' and 'merge these two nodes' are exactly what a Union-Find (Disjoint Set Union) structure answers and does, both in close to constant time.",
    ],
    approachOverview: `
Process the edges in the order they were added, using a **Union-Find**
structure that starts with every node in its own separate group. For
each edge \`[a, b]\`: if \`a\` and \`b\` are already in the same group, then
this edge connects two nodes that could already reach each other -
adding it is exactly what creates the cycle, so it's the answer. Since
we're scanning in the original order and stop at the *first* such
edge, that's automatically the *last* edge (relative to the tree that
existed before it) that closes the loop.

If \`a\` and \`b\` are in different groups, merge those groups and move
on - this edge is a genuine tree edge.

A more brute-force alternative: for each edge in order, before adding
it, run a DFS/BFS over the edges added so far to check if its two
endpoints are already reachable from each other. This answers the same
question, just recomputed from scratch every time instead of
incrementally.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Reachability Check Per Edge",
        explanation: `
Build up the graph edge by edge. Before adding each new edge, run a DFS
to check whether its two endpoints can already reach each other using
only the edges added so far. The first edge where that's true is the
one that closes the cycle.
        `.trim(),
        code: `function findRedundantConnection(edges) {
  const n = edges.length;
  const graph = Array.from({ length: n + 1 }, () => []);

  function canReach(start, target, visited) {
    if (start === target) return true;
    visited.add(start);
    for (const neighbor of graph[start]) {
      if (!visited.has(neighbor) && canReach(neighbor, target, visited)) {
        return true;
      }
    }
    return false;
  }

  for (const [a, b] of edges) {
    if (graph[a].length > 0 || graph[b].length > 0) {
      if (canReach(a, b, new Set())) return [a, b];
    }
    graph[a].push(b);
    graph[b].push(a);
  }

  return [];
}`,
        timeComplexity: "O(n²) - up to n edges, each requiring an O(n) reachability search",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal - Union-Find",
        explanation: `
Keep every node in its own group at the start. For each edge, try to
union its two endpoints' groups. If they're already in the same
group, this edge is redundant - return it immediately.
        `.trim(),
        code: `function findRedundantConnection(edges) {
  const n = edges.length;
  const parent = Array.from({ length: n + 1 }, (_, i) => i);

  function find(x) {
    if (parent[x] !== x) {
      parent[x] = find(parent[x]); // path compression
    }
    return parent[x];
  }

  for (const [a, b] of edges) {
    const rootA = find(a);
    const rootB = find(b);

    if (rootA === rootB) return [a, b]; // already connected - this edge closes the cycle

    parent[rootA] = rootB; // union
  }

  return [];
}`,
        timeComplexity: "O(n × α(n)) - nearly O(n), where α is the inverse Ackermann function",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "const parent = Array.from({ length: n + 1 }, (_, i) => i);", explanation: "Every node starts as its own group, pointing to itself." },
          { code: "if (parent[x] !== x) parent[x] = find(parent[x]);", explanation: "Path compression - flattens the chain so future find() calls on these nodes are almost instant." },
          { code: "if (rootA === rootB) return [a, b];", explanation: "Same root means a and b were already connected through earlier edges - this new edge is what creates the cycle." },
          { code: "parent[rootA] = rootB;", explanation: "Merges the two groups together when the edge connects two previously separate components." },
        ],
      },
    ],
    relatedProblems: ["number-of-connected-components", "graph-valid-tree"],
    keywords: ["redundant connection", "union find", "disjoint set", "cycle detection"],
  },

  {
    id: "number-of-connected-components",
    title: "Number of Connected Components in an Undirected Graph",
    difficulty: "Medium",
    category: "graphs",
    description: `
You're given \`n\` nodes labeled \`0\` to \`n - 1\`, along with a list of
undirected edges connecting some of them. Count how many separate
**connected components** the graph has - that is, how many groups of
nodes there are such that every node can reach every other node in its
own group, but not any node outside it.
    `.trim(),
    examples: [
      {
        input: "n = 5, edges = [[0, 1], [1, 2], [3, 4]]",
        output: "2",
        explanation: "Nodes 0, 1, 2 are all connected to each other; nodes 3, 4 form a separate connected pair.",
      },
      {
        input: "n = 5, edges = [[0, 1], [1, 2], [2, 3], [3, 4]]",
        output: "1",
        explanation: "The edges form one continuous chain touching every node.",
      },
      {
        input: "n = 4, edges = []",
        output: "4",
        explanation: "With no edges at all, every node is its own isolated component.",
      },
    ],
    constraints: [
      "1 <= n <= 2000",
      "0 <= edges.length <= n × (n - 1) / 2",
      "There are no self-loops or duplicate edges.",
    ],
    hints: [
      "Build an adjacency list from the edges, then think about what happens if you start a traversal (DFS or BFS) from every node you haven't visited yet.",
      "Each time you have to start a *brand-new* traversal from an unvisited node, that's one more connected component - everything that traversal reaches belongs to the same component and won't need its own separate count.",
      "Union-Find offers a different angle: start with n separate groups, merge the two endpoints of every edge, and whatever number of distinct groups remains at the end is your answer.",
    ],
    approachOverview: `
A connected component is just "everything reachable from one starting
node, using the given edges." So one natural approach is: build an
adjacency list, then scan through the nodes; every time you hit a node
you haven't visited yet, that's a new component - run DFS or BFS from
it to mark every node in that component as visited, and increase your
count by one.

A cleaner and more scalable approach uses **Union-Find**: start with
every node in its own separate group, then merge the two endpoints of
each edge into the same group. Whatever nodes remain unmerged relative
to each other are in separate components, so counting the number of
distinct group roots left at the end gives the answer directly -
without ever building an explicit adjacency list or doing a traversal.
    `.trim(),
    solutions: [
      {
        approach: "DFS Traversal",
        explanation: `
Build an adjacency list from the edges. Scan every node; whenever an
unvisited node is found, that's a new component - run DFS from it to
mark its entire component as visited, then move on.
        `.trim(),
        code: `function countComponents(n, edges) {
  const graph = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);
  }

  const visited = new Array(n).fill(false);
  let count = 0;

  function dfs(node) {
    visited[node] = true;
    for (const neighbor of graph[node]) {
      if (!visited[neighbor]) dfs(neighbor);
    }
  }

  for (let node = 0; node < n; node++) {
    if (!visited[node]) {
      count++;
      dfs(node);
    }
  }

  return count;
}`,
        timeComplexity: "O(V + E)",
        spaceComplexity: "O(V + E)",
      },
      {
        approach: "Optimal - Union-Find",
        explanation: `
Start with n separate groups (one per node). Union the two endpoints
of every edge. At the end, count how many nodes are still their own
group's root - that count is the number of connected components.
        `.trim(),
        code: `function countComponents(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  let components = n;

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }

  function union(a, b) {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA === rootB) return;

    if (rank[rootA] < rank[rootB]) {
      parent[rootA] = rootB;
    } else if (rank[rootA] > rank[rootB]) {
      parent[rootB] = rootA;
    } else {
      parent[rootB] = rootA;
      rank[rootA]++;
    }
    components--; // merging two groups always reduces the total by one
  }

  for (const [a, b] of edges) {
    union(a, b);
  }

  return components;
}`,
        timeComplexity: "O((V + E) × α(V)) - nearly O(V + E)",
        spaceComplexity: "O(V)",
        walkthrough: [
          { code: "let components = n;", explanation: "Every node starts as its own isolated component." },
          { code: "if (rootA === rootB) return;", explanation: "Edges between two nodes already in the same group don't change the component count - they just add extra connectivity within it." },
          { code: "components--;", explanation: "Every time two previously separate groups get merged, the total number of components drops by exactly one." },
        ],
      },
    ],
    relatedProblems: ["redundant-connection", "graph-valid-tree"],
    keywords: ["connected components", "union find", "disjoint set", "dfs", "undirected graph"],
  },

  {
    id: "graph-valid-tree",
    title: "Graph Valid Tree",
    difficulty: "Medium",
    category: "graphs",
    description: `
You're given \`n\` nodes labeled \`0\` to \`n - 1\` and a list of
undirected edges. Determine whether these edges form a **valid tree** -
meaning every node is reachable from every other node, and there are
no cycles anywhere in the graph.
    `.trim(),
    examples: [
      {
        input: "n = 5, edges = [[0, 1], [0, 2], [0, 3], [1, 4]]",
        output: "true",
        explanation: "Every node is connected, with exactly one path between any two nodes and no cycles.",
      },
      {
        input: "n = 5, edges = [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]]",
        output: "false",
        explanation: "Nodes 1, 2, and 3 form a cycle (1-2, 2-3, 1-3), so this isn't a tree even though every node is reachable.",
      },
      {
        input: "n = 4, edges = [[0, 1], [2, 3]]",
        output: "false",
        explanation: "There's no cycle, but the graph is split into two disconnected pieces, so it isn't one single tree.",
      },
    ],
    constraints: [
      "1 <= n <= 2000",
      "0 <= edges.length <= 5000",
      "There are no self-loops or duplicate edges.",
    ],
    hints: [
      "A tree with n nodes always has exactly n - 1 edges. If the edge count doesn't match that, you can immediately answer false without checking anything else.",
      "Matching edge count isn't enough on its own, though - a graph could have exactly n - 1 edges while still containing a small cycle and some disconnected node elsewhere. You still need to confirm there's no cycle and that everything is reachable.",
      "Union-Find checks both conditions in one pass: try to union every edge's endpoints - if two nodes are already in the same group, that edge closes a cycle. If you finish with no cycle detected and exactly one group remains, it's a valid tree.",
    ],
    approachOverview: `
First, a quick shortcut: any tree with \`n\` nodes must have *exactly*
\`n - 1\` edges. If the given edge count is different, it's immediately
not a tree - no further checking needed.

If the edge count does match, that alone isn't proof - you could still
have a small cycle in one part of the graph and a disconnected node
elsewhere, which also happens to add up to \`n - 1\` edges overall. So
you still need to confirm two things: **no cycles**, and **fully
connected**.

Union-Find checks both at once. Start with every node in its own
group. For each edge, try to union its endpoints: if they're already
in the same group, this edge would create a cycle - stop and return
false. If you make it through every edge without that happening, and
the edge count was \`n - 1\`, everything must have merged into a single
group, so the graph is connected and acyclic: a valid tree.
    `.trim(),
    solutions: [
      {
        approach: "DFS Traversal",
        explanation: `
Check the edge count is n - 1 first. Then run one DFS from node 0,
being careful never to walk immediately back along the edge you just
came from (since edges are undirected). If the DFS reaches every node
without ever revisiting one another way, and it started with the
right edge count, it's a valid tree.
        `.trim(),
        code: `function validTree(n, edges) {
  if (edges.length !== n - 1) return false;

  const graph = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);
  }

  const visited = new Set();

  function dfs(node, parent) {
    if (visited.has(node)) return false; // revisiting means a cycle
    visited.add(node);

    for (const neighbor of graph[node]) {
      if (neighbor === parent) continue; // don't walk back along the edge we came from
      if (!dfs(neighbor, node)) return false;
    }
    return true;
  }

  return dfs(0, -1) && visited.size === n;
}`,
        timeComplexity: "O(V + E)",
        spaceComplexity: "O(V + E)",
      },
      {
        approach: "Optimal - Union-Find",
        explanation: `
After confirming the edge count is n - 1, union each edge's endpoints.
If any edge connects two nodes already in the same group, that's a
cycle, so it can't be a tree. If every edge unions cleanly, the graph
is both acyclic and (given the right edge count) fully connected.
        `.trim(),
        code: `function validTree(n, edges) {
  if (edges.length !== n - 1) return false;

  const parent = Array.from({ length: n }, (_, i) => i);

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }

  for (const [a, b] of edges) {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA === rootB) return false; // cycle

    parent[rootA] = rootB;
  }

  return true;
}`,
        timeComplexity: "O(n × α(n)) - nearly O(n)",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "if (edges.length !== n - 1) return false;", explanation: "A cheap early exit - no tree with n nodes can have any other number of edges." },
          { code: "if (rootA === rootB) return false;", explanation: "Both endpoints already being in the same group means a path between them already existed - this edge closes a cycle." },
          { code: "return true;", explanation: "Having exactly n - 1 edges and never detecting a cycle guarantees everything merged into one connected, cycle-free group." },
        ],
      },
    ],
    relatedProblems: ["number-of-connected-components", "redundant-connection", "course-schedule"],
    keywords: ["graph valid tree", "union find", "cycle detection", "connected graph"],
  },

  {
    id: "word-ladder",
    title: "Word Ladder",
    difficulty: "Hard",
    category: "graphs",
    description: `
You're given a \`beginWord\`, an \`endWord\`, and a dictionary of words
called \`wordList\`. A *transformation sequence* is a chain of words
starting at \`beginWord\` and ending at \`endWord\`, where:

- Each step changes exactly one letter to get from one word to the next.
- Every word in the chain (other than \`beginWord\` itself) must appear in \`wordList\`.

Return the length of the *shortest* such transformation sequence,
counting every word in the chain (including both \`beginWord\` and
\`endWord\`). If no such sequence exists, return 0.
    `.trim(),
    examples: [
      {
        input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]',
        output: "5",
        explanation: 'One shortest chain is hit -> hot -> dot -> dog -> cog, which has 5 words in it.',
      },
      {
        input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]',
        output: "0",
        explanation: "cog never appears in the word list, so there's no way to end the sequence on it.",
      },
      {
        input: 'beginWord = "a", endWord = "c", wordList = ["a","b","c"]',
        output: "3",
        explanation: 'a -> b -> c: two one-letter changes, three words total.',
      },
    ],
    constraints: [
      "1 <= beginWord.length <= 10",
      "endWord.length == beginWord.length",
      "All words consist of lowercase English letters and are the same length.",
      "wordList contains no duplicates, and beginWord != endWord.",
    ],
    hints: [
      "Picture each word as a node in a graph, with an edge between two words whenever they differ in exactly one letter position.",
      "You're asked for the *shortest* chain, and every edge in this graph is 'worth' the same one step - that's exactly the situation breadth-first search is built for. DFS could find *a* path, but not necessarily the shortest one.",
      "Rather than comparing a word against every other word in the list to find neighbors (slow), try substituting every letter of the alphabet into each position of the current word, and check whether the result is in the dictionary (fast, if the dictionary is a Set).",
    ],
    approachOverview: `
Picture every word as a node, with an edge connecting two words that
differ by exactly one letter. The question "what's the shortest chain
from beginWord to endWord" is then just "what's the shortest path
between two nodes in this graph" - and shortest path in an unweighted
graph is exactly what **BFS** is for.

Start a BFS from \`beginWord\`, expanding one "layer" (one letter change)
at a time, and stop the moment \`endWord\` is reached - the number of
steps taken to get there, plus one for the starting word, is the
answer. Mark each word as visited the moment it's *discovered* (not
when it's popped) so the same word is never queued twice.

The only real design choice is *how* you find a word's neighbors:

- **Brute force**: compare the current word against every remaining
  word in the list, checking whether they differ in exactly one
  position.
- **Optimal**: for the current word, try replacing each letter
  position with every other letter of the alphabet, and look up
  whether that new word exists in a \`Set\` built from \`wordList\` - each
  lookup is O(1), independent of how many words are left in the list.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Compare Against Remaining Words",
        explanation: `
Run a standard BFS, but to find each word's neighbors, scan through
every word still left in the dictionary and check whether it differs
from the current word in exactly one letter position.
        `.trim(),
        code: `function ladderLength(beginWord, endWord, wordList) {
  const remaining = new Set(wordList);
  if (!remaining.has(endWord)) return 0;

  function differsByOne(a, b) {
    let diffCount = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) diffCount++;
      if (diffCount > 1) return false;
    }
    return diffCount === 1;
  }

  const queue = [[beginWord, 1]];

  while (queue.length > 0) {
    const [word, steps] = queue.shift();
    if (word === endWord) return steps;

    for (const candidate of Array.from(remaining)) {
      if (differsByOne(word, candidate)) {
        remaining.delete(candidate);
        queue.push([candidate, steps + 1]);
      }
    }
  }

  return 0;
}`,
        timeComplexity: "O(N² × L) - each of N words may be compared against N others, each comparison scanning L letters",
        spaceComplexity: "O(N × L)",
      },
      {
        approach: "Optimal - BFS with Generated Neighbors",
        explanation: `
Put the whole word list into a Set for O(1) lookups. For each word
popped from the BFS queue, generate every possible one-letter
substitution (26 letters × word length candidates) and check each
against the Set - any hit is a real neighbor.
        `.trim(),
        code: `function ladderLength(beginWord, endWord, wordList) {
  const remaining = new Set(wordList);
  if (!remaining.has(endWord)) return 0;

  const queue = [[beginWord, 1]];
  const alphabet = "abcdefghijklmnopqrstuvwxyz";

  while (queue.length > 0) {
    const [word, steps] = queue.shift();
    if (word === endWord) return steps;

    for (let i = 0; i < word.length; i++) {
      for (const letter of alphabet) {
        if (letter === word[i]) continue;

        const candidate = word.slice(0, i) + letter + word.slice(i + 1);
        if (remaining.has(candidate)) {
          remaining.delete(candidate); // mark visited so it's never queued twice
          queue.push([candidate, steps + 1]);
        }
      }
    }
  }

  return 0;
}`,
        timeComplexity: "O(N × L × 26) - for each of N words, try 26 letters at each of L positions",
        spaceComplexity: "O(N × L)",
        walkthrough: [
          { code: "const remaining = new Set(wordList);", explanation: "A Set gives O(1) 'is this a real word' lookups instead of scanning the list." },
          { code: "if (!remaining.has(endWord)) return 0;", explanation: "If the target word was never in the dictionary, no valid sequence can end on it." },
          { code: "const candidate = word.slice(0, i) + letter + word.slice(i + 1);", explanation: "Builds every possible one-letter variation of the current word at position i." },
          { code: "if (remaining.has(candidate)) { remaining.delete(candidate); queue.push([candidate, steps + 1]); }", explanation: "A generated candidate that's actually in the dictionary is a genuine neighbor - queue it, and remove it so it can't be revisited." },
        ],
      },
    ],
    relatedProblems: [],
    keywords: ["word ladder", "bfs", "shortest path", "implicit graph"],
  },
];
