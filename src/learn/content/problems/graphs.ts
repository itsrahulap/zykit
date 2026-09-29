import type { Problem } from "../../types/problem";

export const graphsProblems: Problem[] = [
  {
    id: "number-of-islands",
    title: "Number of Islands",
    difficulty: "Medium",
    category: "graphs",
    description: `
You're given a grid of characters, where each cell is either "1" (land)
or "0" (water). An *island* is a group of land cells that are connected
to each other horizontally or vertically - not diagonally. Land cells
that touch only at a corner belong to separate islands.

Count how many islands are in the grid.
    `.trim(),
    examples: [
      {
        input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        output: "3",
        explanation: "The top-left block of four 1s is one island, the single 1 in the middle is a second island, and the two 1s in the bottom-right corner (connected to each other) form a third.",
      },
      {
        input: 'grid = [["1","1","1"],["0","1","0"],["1","1","1"]]',
        output: "1",
        explanation: "Every land cell is reachable from every other land cell through horizontal/vertical neighbors, so it's all one island.",
      },
      { input: 'grid = [["0","0"],["0","0"]]', output: "0", explanation: "There's no land at all." },
    ],
    constraints: [
      "1 <= rows, cols <= 300",
      "grid[i][j] is either \"0\" or \"1\"",
    ],
    hints: [
      "If you pick any land cell and 'spread out' to every land cell reachable from it (up, down, left, right, and their neighbors' neighbors, and so on), you've just traced out one whole island.",
      "Once you've visited a cell, you never need to count it again - mark it as seen (or overwrite it) so you don't loop back into the same island twice.",
      "Scan the grid cell by cell. Every time you find an unvisited land cell, that's the start of a brand-new island - spread out from it, mark everything in it as visited, and increase your count by one.",
    ],
    approachOverview: `
The key idea behind this whole problem is *traversal*: starting from one
cell and visiting every cell connected to it before moving on. Think of
it like flood-filling a region in a paint program - you click one land
cell, and the "spread" touches every land cell reachable from it through
up/down/left/right steps.

Scan the grid in order. Whenever you land on an unvisited "1", you've
found a new island: increase your count by one, then spread out from
that cell to visit (and mark) every connected land cell so you never
count it again. Once the spread finishes, keep scanning for the next
unvisited "1".

The spreading step can be done two ways, and both give the same
correct answer:

- **Depth-first search (DFS)** - dive down one direction as far as
  possible (recursively visiting a neighbor's neighbor's neighbor...)
  before backtracking to try other directions.
- **Breadth-first search (BFS)** - visit all of a cell's direct
  neighbors first, using a queue, before moving one step further out.

Either one correctly visits "every land cell connected to this one" -
they just differ in the order they visit cells and in whether you use
the call stack (DFS) or an explicit queue (BFS).
    `.trim(),
    solutions: [
      {
        approach: "DFS - Recursive Flood Fill",
        explanation: `
Scan every cell. When an unvisited "1" is found, that's a new island -
count it, then recursively visit every land cell reachable from it,
marking each one as water ("0") the moment it's visited so it's never
revisited. The recursion naturally stops at water cells, grid edges,
and already-visited cells.
        `.trim(),
        code: `function numIslands(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  function dfs(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== "1") {
      return;
    }

    grid[r][c] = "0"; // mark this land cell as visited

    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "1") {
        count++;
        dfs(r, c);
      }
    }
  }

  return count;
}`,
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols)",
        walkthrough: [
          { code: 'if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== "1")', explanation: "Stops the recursion at grid edges, water cells, and cells already visited - this is what makes the flood fill terminate." },
          { code: 'grid[r][c] = "0";', explanation: "Marks the cell as visited by turning it into water, so later scans and later recursive calls skip right over it." },
          { code: "dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);", explanation: "Spreads out to all four neighbors, which is how one call ends up visiting an entire connected island." },
          { code: 'if (grid[r][c] === "1") { count++; dfs(r, c); }', explanation: "Only an unvisited land cell starts a brand-new island - every cell dfs() already reached was already folded into a previous count." },
        ],
      },
      {
        approach: "BFS - Iterative Flood Fill",
        explanation: `
Same idea, but instead of recursion, use a queue: when a new island is
found, push its cell onto a queue, then repeatedly pop a cell, mark it
visited, and push its unvisited land neighbors, until the queue is
empty. This avoids deep recursion on very large grids.
        `.trim(),
        code: `function numIslands(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== "1") continue;

      count++;
      grid[r][c] = "0";
      const queue = [[r, c]];

      while (queue.length > 0) {
        const [row, col] = queue.shift();
        const neighbors = [[row + 1, col], [row - 1, col], [row, col + 1], [row, col - 1]];

        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === "1") {
            grid[nr][nc] = "0";
            queue.push([nr, nc]);
          }
        }
      }
    }
  }

  return count;
}`,
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols)",
      },
    ],
    relatedProblems: ["max-area-of-island", "rotting-oranges", "surrounded-regions"],
    keywords: ["number of islands", "grid dfs", "grid bfs", "flood fill", "connected components"],
  },

  {
    id: "max-area-of-island",
    title: "Max Area of Island",
    difficulty: "Medium",
    category: "graphs",
    description: `
You're given a grid of 0s (water) and 1s (land). An *island* is a group
of 1s connected horizontally or vertically, and its *area* is the number
of land cells it contains.

Return the area of the largest island in the grid. If there's no land
at all, return 0.
    `.trim(),
    examples: [
      {
        input: "grid = [[0,0,1,0,0],[0,0,1,1,1],[0,1,1,0,0],[0,0,0,0,0]]",
        output: "6",
        explanation: "The 1s at (0,2), (1,2), (1,3), (1,4), (2,1), and (2,2) are all connected into one island of 6 cells - that's the biggest (and only) island here.",
      },
      { input: "grid = [[0,0,0,0]]", output: "0", explanation: "There's no land, so the largest island has area 0." },
      { input: "grid = [[1,0],[0,1]]", output: "1", explanation: "The two 1s only touch diagonally, not horizontally/vertically, so they're two separate islands, each of area 1." },
    ],
    constraints: ["1 <= rows, cols <= 50", "grid[i][j] is either 0 or 1"],
    hints: [
      "This is the same 'spread out and visit every connected land cell' idea as counting islands - except now, instead of just noticing that an island exists, you need to count how many cells it's made of.",
      "Have your traversal function return the size of the island it just explored, rather than a boolean or nothing.",
      "As you scan the grid, keep a running 'best area seen so far' and update it every time you finish exploring an island.",
    ],
    approachOverview: `
This builds directly on the island-counting idea: scan the grid, and
whenever you find an unvisited land cell, spread out to every cell
connected to it. The only difference here is what you do with that
spread - instead of just marking "an island exists," you count the
cells you visit along the way and compare that count against the
largest area you've found so far.

With DFS, the natural way to count is to have the function *return* a
number: 1 (for the current cell) plus however many cells each of its
neighbors' recursive calls found. With BFS, you can just increment a
counter once per cell popped off the queue.
    `.trim(),
    solutions: [
      {
        approach: "DFS - Recursive Area Count",
        explanation: `
For each unvisited land cell, recursively explore its island and have
each call return 1 (for itself) plus the areas returned by its four
neighbors. Track the largest area returned across all islands found.
        `.trim(),
        code: `function maxAreaOfIsland(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  let maxArea = 0;

  function dfs(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== 1) {
      return 0;
    }

    grid[r][c] = 0; // mark visited

    return 1 + dfs(r + 1, c) + dfs(r - 1, c) + dfs(r, c + 1) + dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        maxArea = Math.max(maxArea, dfs(r, c));
      }
    }
  }

  return maxArea;
}`,
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols)",
        walkthrough: [
          { code: "if (... grid[r][c] !== 1) return 0;", explanation: "Water, out-of-bounds cells, and already-visited cells contribute nothing to the area." },
          { code: "grid[r][c] = 0;", explanation: "Marks the cell visited so it's never counted twice." },
          { code: "return 1 + dfs(r + 1, c) + dfs(r - 1, c) + dfs(r, c + 1) + dfs(r, c - 1);", explanation: "This cell counts as 1, plus whatever area each of the four neighboring explorations turns up - the recursion adds up the whole island's size." },
          { code: "maxArea = Math.max(maxArea, dfs(r, c));", explanation: "Every time a new island's exploration finishes, compare its total size against the best one seen so far." },
        ],
      },
      {
        approach: "BFS - Iterative Area Count",
        explanation: `
For each unvisited land cell, run a queue-based flood fill and count
how many cells get popped off the queue during that one island's
exploration - that count is the island's area.
        `.trim(),
        code: `function maxAreaOfIsland(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  let maxArea = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== 1) continue;

      let area = 0;
      grid[r][c] = 0;
      const queue = [[r, c]];

      while (queue.length > 0) {
        const [row, col] = queue.shift();
        area++;
        const neighbors = [[row + 1, col], [row - 1, col], [row, col + 1], [row, col - 1]];

        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
            grid[nr][nc] = 0;
            queue.push([nr, nc]);
          }
        }
      }

      maxArea = Math.max(maxArea, area);
    }
  }

  return maxArea;
}`,
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols)",
      },
    ],
    relatedProblems: ["number-of-islands"],
    keywords: ["max area of island", "grid dfs", "grid bfs", "flood fill", "connected components"],
  },

  {
    id: "clone-graph",
    title: "Clone Graph",
    difficulty: "Medium",
    category: "graphs",
    description: `
You're given a reference to a node inside a *connected* undirected
graph. Each node has a value and a list of neighbor nodes it's directly
connected to.

Produce a *deep copy* of the entire graph: every node must be a brand
new object (not the same one from the original graph), but the copied
graph must have exactly the same structure - the same values, and the
same connections between corresponding nodes.
    `.trim(),
    examples: [
      {
        input: "adjacency list = [[2,4],[1,3],[2,4],[1,3]] (node 1 connects to 2 and 4, node 2 connects to 1 and 3, etc.)",
        output: "[[2,4],[1,3],[2,4],[1,3]]",
        explanation: "The copy has the same four nodes with the same connections, but every node object is a new one, distinct from the original.",
      },
      { input: "adjacency list = [[]]", output: "[[]]", explanation: "A single node with no neighbors - the copy is a single new node, also with no neighbors." },
      { input: "adjacency list = []", output: "[]", explanation: "An empty graph copies to an empty graph." },
    ],
    hints: [
      "The tricky part isn't visiting every node - it's making sure you never create two different copies of the same original node, especially since the graph can contain cycles.",
      "Keep a map from 'original node' to 'its copy'. Before creating a new copy for a node, check the map first - if it's already there, reuse it instead of making a duplicate.",
      "Visit the graph the same way you'd visit any other graph (DFS or BFS) - the map is what turns that ordinary traversal into a correct clone.",
    ],
    approachOverview: `
This is a graph traversal with one twist: instead of just marking a
node "visited," you need to remember *what its copy is*, because other
nodes' neighbor lists will need to point to that same copy later (and
because the graph can have cycles, so you must avoid cloning any node
twice).

The fix is a hash map from original node to cloned node. Traverse the
graph (DFS or BFS, both work) starting from the given node. The first
time you see a node, create its clone immediately and store it in the
map *before* recursing into its neighbors - that way, if a neighbor
loops back to a node you're already in the middle of cloning, you find
its clone in the map instead of trying to clone it again. Once every
node has been visited, walk through each original node's neighbor list
and hook up the corresponding clones.
    `.trim(),
    solutions: [
      {
        approach: "DFS - Recursive with a Clone Map",
        explanation: `
Recursively visit each node. The first time a node is seen, create its
clone and record it in the map right away, then recurse into its
neighbors and attach each neighbor's clone (found or freshly created)
to the current clone's neighbor list.
        `.trim(),
        code: `function cloneGraph(node) {
  if (!node) return null;

  const visited = new Map(); // original node -> cloned node

  function dfs(original) {
    if (visited.has(original)) {
      return visited.get(original);
    }

    const clone = { val: original.val, neighbors: [] };
    visited.set(original, clone);

    for (const neighbor of original.neighbors) {
      clone.neighbors.push(dfs(neighbor));
    }

    return clone;
  }

  return dfs(node);
}`,
        timeComplexity: "O(V + E)",
        spaceComplexity: "O(V)",
        walkthrough: [
          { code: "if (visited.has(original)) return visited.get(original);", explanation: "If this original node has already been cloned (including when we've looped back around a cycle), reuse that clone instead of making a new one." },
          { code: "const clone = { val: original.val, neighbors: [] }; visited.set(original, clone);", explanation: "Creates the clone and registers it *before* visiting neighbors - this is what prevents infinite recursion on cyclic graphs." },
          { code: "for (const neighbor of original.neighbors) { clone.neighbors.push(dfs(neighbor)); }", explanation: "Recursively clones each neighbor (or fetches its existing clone) and links it into this node's copied neighbor list." },
        ],
      },
      {
        approach: "BFS - Iterative with a Clone Map",
        explanation: `
Create the clone of the starting node up front, then use a queue to
visit every original node exactly once. For each original node popped
from the queue, walk its neighbor list: clone any neighbor not seen
yet (and enqueue it), then link that neighbor's clone into the current
node's clone.
        `.trim(),
        code: `function cloneGraph(node) {
  if (!node) return null;

  const visited = new Map();
  visited.set(node, { val: node.val, neighbors: [] });
  const queue = [node];

  while (queue.length > 0) {
    const current = queue.shift();

    for (const neighbor of current.neighbors) {
      if (!visited.has(neighbor)) {
        visited.set(neighbor, { val: neighbor.val, neighbors: [] });
        queue.push(neighbor);
      }
      visited.get(current).neighbors.push(visited.get(neighbor));
    }
  }

  return visited.get(node);
}`,
        timeComplexity: "O(V + E)",
        spaceComplexity: "O(V)",
      },
    ],
    relatedProblems: ["is-graph-bipartite"],
    keywords: ["clone graph", "deep copy", "graph dfs", "graph bfs", "hash map"],
  },

  {
    id: "rotting-oranges",
    title: "Rotting Oranges",
    difficulty: "Medium",
    category: "graphs",
    description: `
You're given a grid where each cell is one of:

- \`0\` - an empty cell
- \`1\` - a fresh orange
- \`2\` - a rotten orange

Every minute, any fresh orange that is horizontally or vertically
adjacent to a rotten orange becomes rotten too. This happens
simultaneously across the whole grid, minute by minute.

Return the minimum number of minutes that must pass until no cell has
a fresh orange left. If that's impossible - some fresh orange can never
be reached - return -1.
    `.trim(),
    examples: [
      {
        input: "grid = [[2,1,1],[1,1,0],[0,1,1]]",
        output: "4",
        explanation: "Rot spreads outward from the single rotten orange in the top-left, reaching the farthest fresh orange after 4 minutes.",
      },
      {
        input: "grid = [[2,1,1],[0,1,1],[1,0,1]]",
        output: "-1",
        explanation: "The fresh orange in the bottom-left corner is boxed in by 0s on every side it could rot from, so it can never turn rotten.",
      },
      { input: "grid = [[0,2]]", output: "0", explanation: "There are no fresh oranges to begin with, so 0 minutes are needed." },
    ],
    constraints: ["1 <= rows, cols <= 10", "grid[i][j] is 0, 1, or 2"],
    hints: [
      "Rot doesn't spread from just one place - every rotten orange on the grid spreads at the same time. That's a sign you should start your traversal from *all* the rotten oranges at once, not just one.",
      "This is the same 'visit a cell, then visit its unvisited neighbors' idea as counting islands, but this time each 'wave' of the spread corresponds to one full minute passing.",
      "Breadth-first search naturally processes cells in order of distance from where the search started - so if you start it from every rotten orange simultaneously, the minute a fresh orange gets visited is exactly the minute it rots.",
    ],
    approachOverview: `
The phrase "every rotten orange spreads to its neighbors at the same
time" is the giveaway: this calls for a **multi-source breadth-first
search** - a BFS that starts from every rotten orange at once instead
of just one starting point.

Load every rotten orange into a queue to begin with (this represents
minute 0). Then repeatedly process the queue in layers: pop each cell
currently in the queue, rot any fresh neighbor it has, and push those
newly-rotten cells on for the *next* layer. Because BFS naturally
processes cells one "ring" of distance at a time, each full layer you
process corresponds to exactly one minute passing - so the number of
layers it takes to rot everything reachable is the answer.

After the BFS finishes, if any fresh orange is still left, it was
never reachable, so the answer is -1.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Simulate Minute by Minute",
        explanation: `
Repeatedly scan the whole grid looking for rotten oranges, collect every
fresh orange adjacent to one, then rot all of them together (this
represents one minute passing). Keep going until either no fresh
oranges remain, or a full scan finds nothing new to rot (meaning
whatever fresh oranges are left are unreachable).
        `.trim(),
        code: `function orangesRotting(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  let minutes = 0;

  function hasFreshOrange() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 1) return true;
      }
    }
    return false;
  }

  while (hasFreshOrange()) {
    const toRot = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== 2) continue;

        const neighbors = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]];
        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
            toRot.push([nr, nc]);
          }
        }
      }
    }

    if (toRot.length === 0) {
      return -1; // fresh oranges remain, but nothing new rotted this minute
    }

    for (const [r, c] of toRot) {
      grid[r][c] = 2;
    }
    minutes++;
  }

  return minutes;
}`,
        timeComplexity: "O((rows × cols)²) in the worst case",
        spaceComplexity: "O(rows × cols)",
      },
      {
        approach: "Optimal - Multi-Source BFS",
        explanation: `
Start a BFS queue loaded with every rotten orange at once, and track how
many fresh oranges exist. Process the queue: for each rotten orange
popped, rot any fresh neighbor, decrement the fresh count, and push that
neighbor onto the queue tagged with the minute it rotted. The last
minute assigned this way is the answer - unless fresh oranges remain
once the queue empties, in which case it's -1.
        `.trim(),
        code: `function orangesRotting(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue = [];
  let freshCount = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) {
        queue.push([r, c, 0]);
      } else if (grid[r][c] === 1) {
        freshCount++;
      }
    }
  }

  if (freshCount === 0) return 0;

  let minutes = 0;

  while (queue.length > 0) {
    const [r, c, time] = queue.shift();
    const neighbors = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]];

    for (const [nr, nc] of neighbors) {
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
        grid[nr][nc] = 2;
        freshCount--;
        minutes = time + 1;
        queue.push([nr, nc, time + 1]);
      }
    }
  }

  return freshCount === 0 ? minutes : -1;
}`,
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols)",
        walkthrough: [
          { code: "if (grid[r][c] === 2) { queue.push([r, c, 0]); }", explanation: "Every rotten orange starts in the queue already, at minute 0 - this is the 'multi-source' part." },
          { code: "let freshCount = ...", explanation: "Tracks how many fresh oranges are left to rot, so we know at the end whether any were unreachable." },
          { code: "grid[nr][nc] = 2; freshCount--; minutes = time + 1;", explanation: "Rotting a neighbor happens at exactly one minute later than the cell that rotted it - so the largest 'time' value ever assigned is the total minutes elapsed." },
          { code: "return freshCount === 0 ? minutes : -1;", explanation: "If oranges are still fresh once the queue runs dry, they were never adjacent to any path of rot, so it's impossible." },
        ],
      },
    ],
    relatedProblems: ["number-of-islands"],
    keywords: ["rotting oranges", "multi-source bfs", "grid bfs", "minimum steps"],
  },

  {
    id: "pacific-atlantic-water-flow",
    title: "Pacific Atlantic Water Flow",
    difficulty: "Medium",
    category: "graphs",
    description: `
You're given a grid of heights representing a piece of land. The
**Pacific Ocean** touches the top row and the left column of the grid;
the **Atlantic Ocean** touches the bottom row and the right column.

Water can flow from a cell to any horizontally or vertically adjacent
cell whose height is *less than or equal to* its own (water never flows
uphill, but flat ground is fine).

Find every cell from which water is able to reach **both** oceans, and
return their coordinates.
    `.trim(),
    examples: [
      {
        input: "heights = [[1,2,3],[4,5,6],[7,8,9]]",
        output: "[[0,2],[1,2],[2,0],[2,1],[2,2]]",
        explanation: "Heights strictly increase toward the bottom-right, so every cell can always step up-or-left to lower ground and reach the Pacific. But the only cells that can reach the Atlantic are the ones already sitting on its border, since moving toward the bottom/right edges only ever goes uphill.",
      },
      {
        input: "heights = [[3,3],[3,3]]",
        output: "[[0,0],[0,1],[1,0],[1,1]]",
        explanation: "The whole grid is flat, and flowing across equal height is allowed, so every cell can reach both oceans.",
      },
    ],
    constraints: ["1 <= rows, cols <= 200", "0 <= heights[i][j] <= 10^5"],
    hints: [
      "Checking, for each cell, whether it can flow all the way out to both oceans by tracing a path forward works, but re-tracing a path from scratch for every single cell is a lot of repeated work.",
      "Try thinking about it backwards: instead of asking 'can this cell reach the ocean,' start *from* the ocean's border cells and ask 'which cells could have flowed into me?' That reverses the height comparison: from a cell, you can step to a neighbor that is equal or *taller* (since if I can receive flow from a taller neighbor, that neighbor's water was allowed to flow down to me).",
      "Run that reversed search once starting from every Pacific-border cell, and once starting from every Atlantic-border cell. Any cell reachable in both searches is a cell that water from it can reach both oceans.",
    ],
    approachOverview: `
Trying every cell's path out to both oceans one at a time works, but it
redoes a lot of the same traversal over and over. There's a much
cheaper way to get the same answer: run the traversal in reverse,
starting from the oceans themselves.

Water flows from a higher (or equal) cell to a lower (or equal)
neighbor. So instead of asking "starting at this cell, can I reach the
Pacific?", flip the question around: "starting at the Pacific's border
cells, which cells could have flowed *into* them?" A cell can flow into
its neighbor if the neighbor's height is less than or equal to its own
- so walking in reverse, you move from a cell to a neighbor whenever
that neighbor's height is *greater than or equal to* the current one.

Do this reverse flood-fill twice: once starting from every cell on the
Pacific's two border edges, marking everything reachable as
"reaches Pacific," and once starting from every cell on the Atlantic's
two border edges, marking everything reachable as "reaches Atlantic."
A cell that ends up marked by both searches is exactly a cell that can
flow to both oceans.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Trace a Path From Every Cell",
        explanation: `
For each cell, run a DFS that only steps to equal-or-lower neighbors,
and see whether that DFS ever reaches a Pacific-border cell; separately
check the same way for the Atlantic. A cell only makes it into the
result if both checks succeed.
        `.trim(),
        code: `function pacificAtlantic(heights) {
  const rows = heights.length;
  const cols = heights[0].length;
  const result = [];

  function canReach(startR, startC, isBorder) {
    const seen = new Set();

    function dfs(r, c) {
      const key = r + "," + c;
      if (seen.has(key)) return false;
      seen.add(key);

      if (isBorder(r, c)) return true;

      const neighbors = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]];
      for (const [nr, nc] of neighbors) {
        if (
          nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
          heights[nr][nc] <= heights[r][c] &&
          dfs(nr, nc)
        ) {
          return true;
        }
      }

      return false;
    }

    return dfs(startR, startC);
  }

  const touchesPacific = (r, c) => r === 0 || c === 0;
  const touchesAtlantic = (r, c) => r === rows - 1 || c === cols - 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (canReach(r, c, touchesPacific) && canReach(r, c, touchesAtlantic)) {
        result.push([r, c]);
      }
    }
  }

  return result;
}`,
        timeComplexity: "O((rows × cols)²)",
        spaceComplexity: "O(rows × cols)",
      },
      {
        approach: "Optimal - Reverse Multi-Source Flood Fill",
        explanation: `
Run a flood fill from every Pacific-border cell at once, stepping to a
neighbor whenever its height is greater than or equal to the current
cell's - this marks every cell that can flow to the Pacific. Do the
same from every Atlantic-border cell. A cell marked reachable in both
flood fills belongs in the answer.
        `.trim(),
        code: `function pacificAtlantic(heights) {
  const rows = heights.length;
  const cols = heights[0].length;

  const pacific = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const atlantic = Array.from({ length: rows }, () => new Array(cols).fill(false));

  function dfs(r, c, visited) {
    visited[r][c] = true;

    const neighbors = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]];
    for (const [nr, nc] of neighbors) {
      if (
        nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
        !visited[nr][nc] &&
        heights[nr][nc] >= heights[r][c]
      ) {
        dfs(nr, nc, visited);
      }
    }
  }

  for (let c = 0; c < cols; c++) {
    dfs(0, c, pacific);
    dfs(rows - 1, c, atlantic);
  }
  for (let r = 0; r < rows; r++) {
    dfs(r, 0, pacific);
    dfs(r, cols - 1, atlantic);
  }

  const result = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pacific[r][c] && atlantic[r][c]) {
        result.push([r, c]);
      }
    }
  }

  return result;
}`,
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols)",
        walkthrough: [
          { code: "heights[nr][nc] >= heights[r][c]", explanation: "This is the reversed flow rule: we only step to a neighbor that is tall enough to have actually let water flow down into the current cell." },
          { code: "for (let c = 0; c < cols; c++) { dfs(0, c, pacific); dfs(rows - 1, c, atlantic); }", explanation: "Starts the Pacific flood fill from every cell in the top row, and the Atlantic flood fill from every cell in the bottom row, all in the same pass." },
          { code: "for (let r = 0; r < rows; r++) { dfs(r, 0, pacific); dfs(r, cols - 1, atlantic); }", explanation: "Starts the Pacific flood fill from every cell in the left column, and the Atlantic flood fill from every cell in the right column." },
          { code: "if (pacific[r][c] && atlantic[r][c]) { result.push([r, c]); }", explanation: "A cell only belongs in the answer if both independent flood fills reached it." },
        ],
      },
    ],
    relatedProblems: ["surrounded-regions"],
    keywords: ["pacific atlantic water flow", "multi-source dfs", "grid dfs", "reverse traversal", "flood fill"],
  },

  {
    id: "surrounded-regions",
    title: "Surrounded Regions",
    difficulty: "Medium",
    category: "graphs",
    description: `
You're given a grid of "X" and "O" characters. Any group of "O"s that is
completely *surrounded* by "X"s - meaning none of the "O"s in that group
touch the border of the grid, directly or through other connected "O"s
- gets *captured*: flip every "O" in that group to "X".

Groups of "O"s that do touch the border (even by a single cell) are
safe and stay as "O". Modify the grid in place to reflect the result.
    `.trim(),
    examples: [
      {
        input: 'board = [["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]]',
        output: 'board = [["X","X","X","X"],["X","X","X","X"],["X","X","X","X"],["X","O","X","X"]]',
        explanation: "The connected group of three O's in the middle never touches a border cell, so it's captured. The lone O in the bottom row is itself on the border, so it survives.",
      },
      { input: 'board = [["X"]]', output: 'board = [["X"]]', explanation: "There are no O's, so nothing changes." },
    ],
    constraints: ["1 <= rows, cols <= 200"],
    hints: [
      "It's much easier to find the 'safe' O's than to directly test whether each O's group is 'surrounded' - an O only needs one path back to any border cell to be safe.",
      "Start your traversal from every O sitting on the border, and spread inward through connected O's - everything that traversal reaches is safe. Mark those safe cells somehow so they're distinguishable afterward.",
      "Once you've marked every safe O, do one final pass over the whole grid: any O that never got marked safe gets flipped to X, and any cell you marked safe gets flipped back to O.",
    ],
    approachOverview: `
Testing "is this group of O's surrounded" directly, group by group, is
awkward. It's much simpler to flip the question around: find every O
that's *safe* (connected, directly or indirectly, to a border cell),
and then capture everything that's left over.

Start a traversal from every "O" sitting on the grid's border, and
spread inward through every "O" connected to it. Since these are all
reachable from the border, none of them can be captured - mark each
one visited with a temporary placeholder (like "#") so it's easy to
tell apart from an unvisited "O" later.

Once every border-connected "O" has been marked, make one final pass
over the grid: any "O" that's still a plain "O" was never reachable
from the border, so it gets captured (flipped to "X"); any cell marked
with the placeholder gets flipped back to "O", since it was safe all
along.
    `.trim(),
    solutions: [
      {
        approach: "DFS - Recursive Border Flood Fill",
        explanation: `
Recursively spread out from every border "O", marking each one reached
as safe. Then sweep the grid once: unmarked O's are captured, marked
cells are restored to O.
        `.trim(),
        code: `function solve(board) {
  const rows = board.length;
  const cols = board[0].length;

  function dfs(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== "O") {
      return;
    }

    board[r][c] = "#"; // mark safe

    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    dfs(r, 0);
    dfs(r, cols - 1);
  }
  for (let c = 0; c < cols; c++) {
    dfs(0, c);
    dfs(rows - 1, c);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === "O") {
        board[r][c] = "X";
      } else if (board[r][c] === "#") {
        board[r][c] = "O";
      }
    }
  }

  return board;
}`,
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols)",
        walkthrough: [
          { code: 'board[r][c] = "#";', explanation: "Uses a placeholder character to mean 'this O is safe' - keeping it distinguishable from O's we haven't reached yet." },
          { code: "for (let r ...) { dfs(r, 0); dfs(r, cols - 1); } for (let c ...) { dfs(0, c); dfs(rows - 1, c); }", explanation: "Starts the flood fill from every cell on all four edges of the grid - any O here is automatically safe, and the fill spreads inward from it." },
          { code: 'if (board[r][c] === "O") board[r][c] = "X"; else if (board[r][c] === "#") board[r][c] = "O";', explanation: "The final cleanup pass: anything still a plain O was never reached from the border, so it's captured; anything marked safe is restored." },
        ],
      },
      {
        approach: "BFS - Iterative Border Flood Fill",
        explanation: `
Same idea, but push every border "O" into a queue up front and expand
outward from all of them together, instead of using recursion.
        `.trim(),
        code: `function solve(board) {
  const rows = board.length;
  const cols = board[0].length;
  const queue = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const onBorder = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
      if (onBorder && board[r][c] === "O") {
        board[r][c] = "#";
        queue.push([r, c]);
      }
    }
  }

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const neighbors = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]];

    for (const [nr, nc] of neighbors) {
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === "O") {
        board[nr][nc] = "#";
        queue.push([nr, nc]);
      }
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === "O") {
        board[r][c] = "X";
      } else if (board[r][c] === "#") {
        board[r][c] = "O";
      }
    }
  }

  return board;
}`,
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols)",
      },
    ],
    relatedProblems: ["number-of-islands", "pacific-atlantic-water-flow"],
    keywords: ["surrounded regions", "grid dfs", "grid bfs", "border flood fill", "connected components"],
  },

  {
    id: "is-graph-bipartite",
    title: "Is Graph Bipartite?",
    difficulty: "Medium",
    category: "graphs",
    description: `
You're given an undirected graph as an adjacency list: \`graph[i]\` is
the list of nodes that node \`i\` is directly connected to.

A graph is *bipartite* if you can split every node into exactly two
groups such that every edge connects a node in one group to a node in
the other group - never two nodes from the same group.

Return \`true\` if the graph can be split this way, and \`false\`
otherwise. The graph may be disconnected (made of several separate
pieces).
    `.trim(),
    examples: [
      {
        input: "graph = [[1,3],[0,2],[1,3],[0,2]]",
        output: "true",
        explanation: "This graph is a simple cycle 0-1-2-3-0. Put nodes 0 and 2 in group A, and nodes 1 and 3 in group B - every edge connects an A to a B.",
      },
      {
        input: "graph = [[1,2,3],[0,2],[0,1,3],[0,2]]",
        output: "false",
        explanation: "Nodes 0, 1, and 2 are all directly connected to each other (a triangle). In any two-group split, at least two of those three nodes must land in the same group, which breaks the rule.",
      },
      { input: "graph = [[],[]]", output: "true", explanation: "No edges at all means the rule is never violated, no matter how you split the nodes." },
    ],
    constraints: ["1 <= graph.length <= 100", "The graph has no self-loops and no repeated edges."],
    hints: [
      "Imagine you're coloring nodes with two colors as you visit them, such that every edge connects two *different* colors. If you can color the whole graph that way without ever being forced to put the same color on both ends of an edge, it's bipartite.",
      "Pick any uncolored node, give it a color, and then every neighbor you visit from it must get the *other* color. If a neighbor already has a color and it's the *same* as the current node's, you've found a contradiction.",
      "The graph might not be all one connected piece - make sure you restart the coloring process from a fresh, unvisited node until every node has been colored.",
    ],
    approachOverview: `
This is a traversal problem in disguise as a coloring problem. Walk the
graph (DFS or BFS both work), assigning each node one of two colors as
you first reach it. The rule is simple: every neighbor of a node must
get the *opposite* color from that node.

Whenever you're about to visit a neighbor, check first: if it's
unvisited, color it the opposite of the current node and keep
traversing from it. If it's already been colored, it had better be the
*opposite* color of the current node - if it's the *same* color, two
directly connected nodes ended up in the same group, which means the
graph can't be split this way, so the answer is \`false\`.

Since the graph can be disconnected, make sure to restart the coloring
from every node that hasn't been visited yet - each disconnected piece
has to pass the same check independently.
    `.trim(),
    solutions: [
      {
        approach: "DFS - Two-Coloring",
        explanation: `
Color each node 1 or -1 as it's first visited. Recurse into every
neighbor: if a neighbor is already the same color as the current node,
the graph isn't bipartite; if it's uncolored, color it the opposite and
keep going. Restart from any node not yet colored, to cover
disconnected pieces.
        `.trim(),
        code: `function isBipartite(graph) {
  const n = graph.length;
  const color = new Array(n).fill(0); // 0 = uncolored, otherwise 1 or -1

  function dfs(node, c) {
    color[node] = c;

    for (const neighbor of graph[node]) {
      if (color[neighbor] === c) {
        return false;
      }
      if (color[neighbor] === 0 && !dfs(neighbor, -c)) {
        return false;
      }
    }

    return true;
  }

  for (let i = 0; i < n; i++) {
    if (color[i] === 0 && !dfs(i, 1)) {
      return false;
    }
  }

  return true;
}`,
        timeComplexity: "O(V + E)",
        spaceComplexity: "O(V)",
        walkthrough: [
          { code: "color[node] = c;", explanation: "Colors the current node with whichever of the two colors it was assigned." },
          { code: "if (color[neighbor] === c) return false;", explanation: "A neighbor sharing the same color as the current node is a direct contradiction - those two connected nodes can't both be in the same group." },
          { code: "if (color[neighbor] === 0 && !dfs(neighbor, -c)) return false;", explanation: "An uncolored neighbor gets colored with the opposite color and explored further; if that deeper exploration ever finds a contradiction, it propagates back up." },
          { code: "for (let i = 0; i < n; i++) { if (color[i] === 0 && !dfs(i, 1)) return false; }", explanation: "Restarts the coloring from any node not yet reached, so disconnected pieces of the graph are all checked." },
        ],
      },
      {
        approach: "BFS - Two-Coloring",
        explanation: `
Same coloring rule, but processed layer by layer with a queue instead
of recursion: color a starting node, then repeatedly pop a node and
check/color its neighbors.
        `.trim(),
        code: `function isBipartite(graph) {
  const n = graph.length;
  const color = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    if (color[i] !== 0) continue;

    color[i] = 1;
    const queue = [i];

    while (queue.length > 0) {
      const node = queue.shift();

      for (const neighbor of graph[node]) {
        if (color[neighbor] === color[node]) {
          return false;
        }
        if (color[neighbor] === 0) {
          color[neighbor] = -color[node];
          queue.push(neighbor);
        }
      }
    }
  }

  return true;
}`,
        timeComplexity: "O(V + E)",
        spaceComplexity: "O(V)",
      },
    ],
    relatedProblems: ["clone-graph"],
    keywords: ["is graph bipartite", "two coloring", "graph dfs", "graph bfs", "disconnected graph"],
  },
];
