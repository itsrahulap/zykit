import type { Problem } from "../../types/problem";

export const graphsMoreProblems: Problem[] = [
  {
    id: "course-schedule",
    title: "Course Schedule",
    difficulty: "Medium",
    category: "graphs",
    description: `
There are \`numCourses\` courses, labeled \`0\` to \`numCourses - 1\`. You're
given prerequisite pairs \`[a, b]\`, each meaning "finish course \`b\`
before taking course \`a\`."

Return whether you can finish *all* the courses.
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
      "Model it as a directed graph: an edge from b to a for each [a, b] ('b before a'). The question is about that graph's shape.",
      "You can't finish exactly when the graph has a cycle. Every course on a cycle waits on another course on it, so none can go first.",
      "A plain 'visited' check isn't enough to find a cycle. Track nodes on the path you're exploring right now separately from nodes you've finished. Reaching a node still on the current path means a cycle.",
    ],
    approachOverview: `
Build a directed graph with an edge from \`b\` to \`a\` ("\`b\` before
\`a\`"). You can finish all courses exactly when the graph has **no
cycle**. On a cycle, every course waits for another course on the same
cycle.

To find a cycle, run a DFS that tracks each node's state:

- *unvisited*
- *visiting*: on the current recursion path
- *done*: confirmed cycle-free

If the DFS reaches a *visiting* node, that's a back-edge into the
current path: a cycle, so return false. If it explores every node
without that happening, return true.

A non-recursive alternative is **Kahn's algorithm**: repeatedly remove
courses with no remaining prerequisites. If every course gets removed,
there's no cycle.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Try Every Ordering",
        explanation: `
You can finish exactly when *some* ordering respects every prerequisite.
The naive check generates every ordering and tests it against every
pair, stopping at the first one that works.
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
Build an adjacency list, then DFS from every course. Tag each node
*visiting* (on the current path) or *done* (fully explored, no cycle).
Reaching a *visiting* node means a cycle, so finishing is impossible.
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
          { code: "if (state[course] === VISITING) return true;", explanation: "Reaching a node still on the current DFS path means we looped back: a cycle." },
          { code: "state[course] = VISITING; ... state[course] = DONE;", explanation: "Marks the node 'in progress' before visiting its neighbors, then 'safe' once they're all cycle-free." },
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
There are \`numCourses\` courses, labeled \`0\` to \`numCourses - 1\`, and
prerequisite pairs \`[a, b]\`, each meaning "finish course \`b\` before
course \`a\`."

Return *one* valid order to take all the courses. If that's impossible,
return an empty array.
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
      "It's the same question as Course Schedule (is there a cycle?), but now you must produce an actual order.",
      "A course can be taken once all its prerequisites are taken. Track how many each course is still waiting on (its 'in-degree').",
      "Start with courses that have zero prerequisites left. Taking a course lowers its dependents' counts; any that reach zero can be taken next.",
    ],
    approachOverview: `
A course's **in-degree** is how many prerequisites it still needs. A
course can join the order once its in-degree is zero.

Start with every course whose in-degree is already zero. Each time you
add a course to the order, lower the in-degree of every course that
depends on it. Any course that reaches zero joins the next candidates.
Repeat until no more courses can be taken.

If every course was added, the order is valid. If some are left with
in-degree above zero, they're stuck in a cycle, so return \`[]\`. This
is **Kahn's algorithm** for topological sorting, driven by a queue.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Round-by-Round Simulation",
        explanation: `
Repeatedly scan the courses not yet taken, and take every one whose
prerequisites are all taken. If a pass takes nothing new, the rest are
stuck in a cycle, so stop.
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
Compute each course's in-degree and queue every course at zero. Pop a
course, add it to the order, and lower its dependents' in-degrees,
queueing any that reach zero. If the order includes every course, it's
valid.
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
          { code: "inDegree[a]++;", explanation: "Counts each course's outstanding prerequisites." },
          { code: "if (inDegree[course] === 0) queue.push(course);", explanation: "A course with nothing to wait for can be taken right away." },
          { code: "inDegree[next]--; if (inDegree[next] === 0) queue.push(next);", explanation: "Taking a course removes one blocker from each dependent. A dependent with none left joins the queue." },
          { code: "return order.length === numCourses ? order : [];", explanation: "Courses that never reached zero are stuck in a cycle, so no valid order exists." },
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
You start with a tree of \`n\` nodes labeled \`1\` to \`n\`, joined by
\`n - 1\` edges. One extra edge is added, creating exactly one cycle.

You're given all \`n\` edges in the order they were added. Return an edge
you can remove to make the graph a tree again. If several edges would
work, return the one that appears *last* in the input.
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
      "Process edges in the given order, tracking which nodes are already connected by the edges seen so far.",
      "The first edge that joins two nodes that were *already* connected is the one that closes the cycle.",
      "'Are these two nodes connected?' and 'merge them' are exactly what Union-Find (Disjoint Set Union) does, both in near-constant time.",
    ],
    approachOverview: `
Process edges in order with a **Union-Find** structure, where every
node starts in its own group. For each edge \`[a, b]\`:

- If \`a\` and \`b\` are already in the same group, they could already reach each other. This edge creates the cycle, so return it.
- Otherwise, merge their groups. It's a real tree edge.

The first edge that closes the cycle is the cycle edge that appears last
in the input, which is what the problem asks for.

A brute-force alternative: before adding each edge, run a DFS/BFS over
the edges so far to check whether its endpoints are already connected.
Same question, but recomputed from scratch each time.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Reachability Check Per Edge",
        explanation: `
Build the graph edge by edge. Before adding each edge, run a DFS to
check whether its endpoints are already connected. The first edge where
they are closes the cycle.
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
Start with every node in its own group. For each edge, union its
endpoints' groups. If they're already in the same group, the edge is
redundant, so return it.
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
          { code: "if (parent[x] !== x) parent[x] = find(parent[x]);", explanation: "Path compression flattens the chain, so later find() calls are almost instant." },
          { code: "if (rootA === rootB) return [a, b];", explanation: "Same root means a and b were already connected, so this edge creates the cycle." },
          { code: "parent[rootA] = rootB;", explanation: "Merges the two separate groups." },
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
You're given \`n\` nodes labeled \`0\` to \`n - 1\` and a list of undirected
edges. Return the number of **connected components**: groups where every
node can reach every other node in its group, but none outside it.
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
      "Build an adjacency list, then think about starting a traversal (DFS or BFS) from each node you haven't visited yet.",
      "Each *new* traversal from an unvisited node is one more component. Everything it reaches belongs to that component.",
      "Union-Find is another angle: start with n groups, merge the endpoints of every edge, and count the groups left.",
    ],
    approachOverview: `
A connected component is everything reachable from one node. So build
an adjacency list and scan the nodes. Each unvisited node starts a new
component: add 1 to the count and run DFS or BFS from it to mark the
whole component visited.

**Union-Find** is cleaner and scales better. Start with every node in
its own group and merge the endpoints of each edge. The number of
distinct groups left is the answer, with no adjacency list or traversal
needed.
    `.trim(),
    solutions: [
      {
        approach: "DFS Traversal",
        explanation: `
Build an adjacency list and scan every node. Each unvisited node is a
new component: run DFS from it to mark the whole component visited.
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
Start with n groups, one per node, and union the endpoints of every
edge. Each successful merge lowers the group count by one; the final
count is the number of components.
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
          { code: "let components = n;", explanation: "Every node starts as its own component." },
          { code: "if (rootA === rootB) return;", explanation: "An edge inside one group doesn't change the component count." },
          { code: "components--;", explanation: "Merging two separate groups lowers the count by exactly one." },
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
You're given \`n\` nodes labeled \`0\` to \`n - 1\` and a list of undirected
edges. Return whether they form a **valid tree**: every node reachable
from every other, with no cycles.
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
      "A tree with n nodes has exactly n - 1 edges. If the count differs, return false right away.",
      "The right edge count isn't enough. A graph with n - 1 edges can still have a cycle in one place and a disconnected node in another. You still need to check for cycles and connectivity.",
      "Union-Find checks both in one pass: union every edge's endpoints. If two nodes are already in the same group, that edge closes a cycle. No cycle and one group left means a valid tree.",
    ],
    approachOverview: `
Shortcut first: a tree with \`n\` nodes has *exactly* \`n - 1\` edges. Any
other count means it's not a tree.

A matching count isn't proof on its own. A small cycle in one place plus
a disconnected node elsewhere can also add up to \`n - 1\` edges. So
confirm **no cycles** and **fully connected**.

Union-Find checks both. Start with every node in its own group and union
each edge's endpoints. If they're already in the same group, the edge
creates a cycle, so return false. If every edge merges cleanly and there
were \`n - 1\` edges, everything ended up in one group: connected and
acyclic, a valid tree.
    `.trim(),
    solutions: [
      {
        approach: "DFS Traversal",
        explanation: `
Check the edge count is n - 1. Then run one DFS from node 0, never
walking straight back along the edge you came from (edges are
undirected). If the DFS reaches every node without revisiting any, it's
a valid tree.
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
After checking the edge count is n - 1, union each edge's endpoints. An
edge between two nodes already in the same group is a cycle, so it's not
a tree. If every edge merges cleanly, the graph is acyclic and (with
that edge count) fully connected.
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
          { code: "if (edges.length !== n - 1) return false;", explanation: "A cheap early exit: a tree with n nodes can't have any other number of edges." },
          { code: "if (rootA === rootB) return false;", explanation: "Both endpoints in the same group means a path already existed, so this edge closes a cycle." },
          { code: "return true;", explanation: "Exactly n - 1 edges and no cycle means everything merged into one connected, cycle-free group." },
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
You're given a \`beginWord\`, an \`endWord\`, and a dictionary \`wordList\`. A
*transformation sequence* is a chain of words from \`beginWord\` to
\`endWord\` where:

- Each step changes exactly one letter.
- Every word except \`beginWord\` is in \`wordList\`.

Return the number of words in the *shortest* sequence, counting both
\`beginWord\` and \`endWord\`. If none exists, return 0.
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
      "Picture each word as a node, with an edge between words that differ in exactly one letter.",
      "You want the *shortest* chain, and every edge costs one step. That's what breadth-first search is for. DFS finds *a* path, not necessarily the shortest.",
      "Instead of comparing a word against every other word (slow), try every letter of the alphabet at each position and check whether the result is in the dictionary (fast, if it's a Set).",
    ],
    approachOverview: `
Make every word a node, with an edge between words that differ by one
letter. The shortest chain is then the shortest path between two nodes,
and in an unweighted graph that's what **BFS** finds.

Run BFS from \`beginWord\`, one layer (one letter change) at a time, and
stop when you reach \`endWord\`. The steps taken, plus one for the
starting word, is the answer. Mark each word visited when it's
*discovered*, not when it's popped, so it's never queued twice.

The main choice is how to find a word's neighbors:

- **Brute force**: compare the word against every remaining word, checking for exactly one differing position.
- **Optimal**: replace each position with every other letter and look the result up in a \`Set\` built from \`wordList\`. Each lookup is O(1), however many words are left.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Compare Against Remaining Words",
        explanation: `
Run a standard BFS. To find a word's neighbors, scan every word left in
the dictionary for one that differs in exactly one position.
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
Put the word list in a Set for O(1) lookups. For each word popped from
the queue, generate every one-letter change (26 letters × word length)
and check it against the Set. Any hit is a neighbor.
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
          { code: "const remaining = new Set(wordList);", explanation: "A Set gives O(1) 'is this a word' lookups instead of scanning the list." },
          { code: "if (!remaining.has(endWord)) return 0;", explanation: "If the end word isn't in the dictionary, no sequence can end on it." },
          { code: "const candidate = word.slice(0, i) + letter + word.slice(i + 1);", explanation: "Builds a one-letter variation of the word at position i." },
          { code: "if (remaining.has(candidate)) { remaining.delete(candidate); queue.push([candidate, steps + 1]); }", explanation: "A candidate in the dictionary is a neighbor. Queue it and remove it so it isn't revisited." },
        ],
      },
    ],
    relatedProblems: [],
    keywords: ["word ladder", "bfs", "shortest path", "implicit graph"],
  },
];
