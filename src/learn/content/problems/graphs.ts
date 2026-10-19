import type { Problem } from "../../types/problem";

export const graphsProblems: Problem[] = [
  {
    id: "number-of-islands",
    title: "Number of Islands",
    difficulty: "Medium",
    category: "graphs",
    description: `
You're given a grid where each cell is "1" (land) or "0" (water). An
*island* is a group of land cells connected horizontally or vertically,
not diagonally. Land cells that touch only at a corner are separate
islands.

Count the islands in the grid.
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
      "Pick a land cell and 'spread out' to every land cell reachable from it (up, down, left, right, and so on). That traces one whole island.",
      "Once you've visited a cell, mark it as seen (or overwrite it) so you don't count the same island twice.",
      "Scan the grid. Each unvisited land cell starts a new island: spread out from it, mark it all visited, and add one to your count.",
    ],
    approachOverview: `
The key idea is *traversal*: start from one cell and visit every cell
connected to it. It's like flood-fill in a paint program: click one land
cell, and the fill reaches every land cell connected by up, down, left
or right steps.

Scan the grid in order. Each unvisited "1" is a new island: add one to
the count, then spread out and mark every connected land cell so it's
never counted again. Then keep scanning.

You can spread in two ways, with the same result:

- **Depth-first search (DFS)**: go as far as possible in one direction (recursively) before backtracking.
- **Breadth-first search (BFS)**: visit all direct neighbors first, using a queue, before moving further out.

They differ only in visiting order and in using the call stack (DFS) or
an explicit queue (BFS).
    `.trim(),
    solutions: [
      {
        approach: "DFS - Recursive Flood Fill",
        explanation: `
Scan every cell. An unvisited "1" is a new island: count it, then
recursively visit every connected land cell, turning each into water
("0") so it's never revisited. The recursion stops at water, grid edges
and visited cells.
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
          { code: 'if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== "1")', explanation: "Stops at grid edges, water and visited cells, so the flood fill ends." },
          { code: 'grid[r][c] = "0";', explanation: "Marks the cell visited by turning it into water, so later scans and calls skip it." },
          { code: "dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);", explanation: "Spreads to all four neighbors, so one call visits the whole island." },
          { code: 'if (grid[r][c] === "1") { count++; dfs(r, c); }', explanation: "Only an unvisited land cell starts a new island. Cells dfs() already reached were counted with an earlier island." },
        ],
      },
      {
        approach: "BFS - Iterative Flood Fill",
        explanation: `
Same idea with a queue instead of recursion. For a new island, mark its
cell visited and queue it. Then pop cells and mark and queue their
unvisited land neighbors until the queue is empty. This avoids deep
recursion on very large grids.
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
of 1s connected horizontally or vertically. Its *area* is its number of
land cells.

Return the largest island's area, or 0 if there's no land.
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
      "Use the same 'spread out to every connected land cell' idea as counting islands, but count the cells in each island.",
      "Have your traversal function return the size of the island it explored.",
      "Keep a running 'best area so far' and update it after each island.",
    ],
    approachOverview: `
This builds on counting islands: scan the grid, and from each unvisited
land cell, spread to every connected cell. This time, count the cells
you visit and compare to the largest area so far.

With DFS, have the function *return* 1 (for the current cell) plus the
counts from its neighbors' calls. With BFS, add one to a counter for
each cell popped off the queue.
    `.trim(),
    solutions: [
      {
        approach: "DFS - Recursive Area Count",
        explanation: `
For each unvisited land cell, explore its island recursively. Each call
returns 1 plus the areas from its four neighbors. Track the largest
area.
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
          { code: "if (... grid[r][c] !== 1) return 0;", explanation: "Water, out-of-bounds and visited cells add nothing to the area." },
          { code: "grid[r][c] = 0;", explanation: "Marks the cell visited so it's never counted twice." },
          { code: "return 1 + dfs(r + 1, c) + dfs(r - 1, c) + dfs(r, c + 1) + dfs(r, c - 1);", explanation: "This cell counts as 1, plus the area found from each neighbor. The recursion adds up the whole island." },
          { code: "maxArea = Math.max(maxArea, dfs(r, c));", explanation: "After each island, compare its size to the best so far." },
        ],
      },
      {
        approach: "BFS - Iterative Area Count",
        explanation: `
For each unvisited land cell, run a queue-based flood fill. The number of
cells popped off the queue is the island's area.
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
You're given a node in a *connected* undirected graph. Each node has a
value and a list of its neighbors.

Make a *deep copy* of the whole graph. Every node must be a new object,
but the copy must have the same values and the same connections.
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
      "The tricky part is never making two copies of the same node, especially since the graph can have cycles.",
      "Keep a map from 'original node' to 'its copy'. Check it before copying a node, and reuse the copy if it's there.",
      "Traverse the graph as usual (DFS or BFS). The map is what turns the traversal into a correct clone.",
    ],
    approachOverview: `
This is a graph traversal with a twist: instead of just marking a node
"visited," remember *its copy*. Other nodes' neighbor lists must point
to that same copy, and cycles mean you must never clone a node twice.

Use a hash map from original node to clone. Traverse from the given
node (DFS or BFS). The first time you see a node, create its clone and
store it in the map *before* visiting its neighbors. Then, if a neighbor
loops back to it, you find the clone in the map instead of cloning
again.

As you visit each node, link the clones of its neighbors into its
clone's neighbor list.
    `.trim(),
    solutions: [
      {
        approach: "DFS - Recursive with a Clone Map",
        explanation: `
Visit each node recursively. The first time you see a node, create its
clone and add it to the map. Then recurse into its neighbors and attach
each neighbor's clone (existing or new) to this clone's neighbor list.
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
          { code: "if (visited.has(original)) return visited.get(original);", explanation: "If this node is already cloned (for example, after looping around a cycle), reuse that clone." },
          { code: "const clone = { val: original.val, neighbors: [] }; visited.set(original, clone);", explanation: "Creates and registers the clone *before* visiting neighbors. This prevents infinite recursion on cycles." },
          { code: "for (const neighbor of original.neighbors) { clone.neighbors.push(dfs(neighbor)); }", explanation: "Clones each neighbor (or gets its existing clone) and links it into this clone's neighbor list." },
        ],
      },
      {
        approach: "BFS - Iterative with a Clone Map",
        explanation: `
Clone the starting node first, then use a queue to visit each original
node once. For each popped node, go through its neighbors: clone and
enqueue any new neighbor, then link the neighbor's clone into the
current node's clone.
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

Every minute, each fresh orange next to a rotten one (horizontally or
vertically) becomes rotten. This happens across the whole grid at the
same time.

Return the minimum minutes until no fresh orange is left. If some fresh
orange can never be reached, return -1.
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
      "Every rotten orange spreads at the same time, so start your traversal from *all* rotten oranges at once.",
      "It's the same 'visit a cell, then its unvisited neighbors' idea as counting islands, but each wave of spread is one minute.",
      "BFS visits cells in order of distance from the start. Start it from every rotten orange at once, and the step a fresh orange is visited is the minute it rots.",
    ],
    approachOverview: `
"Every rotten orange spreads at the same time" is the giveaway: use a
**multi-source breadth-first search**, a BFS that starts from every
rotten orange at once.

Put every rotten orange in the queue (minute 0). Then process the queue
in layers: pop each cell, rot its fresh neighbors, and push them for the
*next* layer. BFS works one ring of distance at a time, so each layer is
one minute. The number of layers needed is the answer.

If any fresh orange is left after the BFS, it was unreachable, so return
-1.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Simulate Minute by Minute",
        explanation: `
Scan the grid for rotten oranges, collect every fresh orange next to
one, and rot them all together (one minute). Repeat until no fresh
oranges remain, or a scan finds nothing new to rot (the rest are
unreachable).
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
Start the BFS queue with every rotten orange and count the fresh ones.
For each popped orange, rot its fresh neighbors, lower the fresh count,
and queue each neighbor with the minute it rotted.

The last minute assigned is the answer. If fresh oranges remain when
the queue is empty, return -1.
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
          { code: "if (grid[r][c] === 2) { queue.push([r, c, 0]); }", explanation: "Every rotten orange starts in the queue at minute 0. This is the 'multi-source' part." },
          { code: "let freshCount = ...", explanation: "Counts fresh oranges left, so at the end you know whether any were unreachable." },
          { code: "grid[nr][nc] = 2; freshCount--; minutes = time + 1;", explanation: "A neighbor rots one minute after the cell that rotted it, so the largest time assigned is the total minutes." },
          { code: "return freshCount === 0 ? minutes : -1;", explanation: "Oranges still fresh when the queue is empty were never reached by the rot, so it's impossible." },
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
You're given a grid of land heights. The **Pacific Ocean** touches the
top row and left column; the **Atlantic Ocean** touches the bottom row
and right column.

Water flows from a cell to a horizontal or vertical neighbor whose
height is *less than or equal to* its own (never uphill, but flat is
fine).

Return the coordinates of every cell whose water can reach **both**
oceans.
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
      "Tracing a path from each cell to both oceans works, but repeats a lot of work for every cell.",
      "Think backwards: start *from* the ocean's border cells and ask 'which cells could flow into me?' Now you step to a neighbor that is equal or *taller*, since water from a taller neighbor can flow down to you.",
      "Run that reversed search from every Pacific-border cell, and again from every Atlantic-border cell. Cells reached by both searches can reach both oceans.",
    ],
    approachOverview: `
Tracing every cell's path to both oceans works, but repeats the same
traversal over and over. It's much cheaper to run the traversal in
reverse, starting from the oceans.

Water flows to a neighbor of lower or equal height. So instead of
asking "can this cell reach the Pacific?", ask "starting from the
Pacific's border, which cells could flow *into* it?" In reverse, you
move to a neighbor whose height is *greater than or equal to* the
current one.

Run this reverse flood fill twice:

- From every Pacific-border cell, marking what it reaches as "reaches Pacific".
- From every Atlantic-border cell, marking what it reaches as "reaches Atlantic".

Cells marked by both can flow to both oceans.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Trace a Path From Every Cell",
        explanation: `
For each cell, run a DFS that only steps to equal-or-lower neighbors and
check whether it reaches a Pacific-border cell. Do the same for the
Atlantic. A cell is in the result only if both checks succeed.
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
Flood fill from every Pacific-border cell, stepping to neighbors whose
height is greater than or equal to the current cell's. This marks every
cell that can flow to the Pacific. Do the same from the Atlantic border.
Cells marked by both fills are the answer.
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
          { code: "heights[nr][nc] >= heights[r][c]", explanation: "The reversed flow rule: only step to a neighbor tall enough for water to flow down into the current cell." },
          { code: "for (let c = 0; c < cols; c++) { dfs(0, c, pacific); dfs(rows - 1, c, atlantic); }", explanation: "Starts the Pacific fill from the top row and the Atlantic fill from the bottom row." },
          { code: "for (let r = 0; r < rows; r++) { dfs(r, 0, pacific); dfs(r, cols - 1, atlantic); }", explanation: "Starts the Pacific fill from the left column and the Atlantic fill from the right column." },
          { code: "if (pacific[r][c] && atlantic[r][c]) { result.push([r, c]); }", explanation: "A cell is in the answer only if both fills reached it." },
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
You're given a grid of "X" and "O" characters. A group of connected "O"s
that doesn't touch the grid's border is *surrounded* by "X"s and gets
*captured*: flip every "O" in it to "X".

Groups that touch the border (even by one cell) are safe and stay "O".
Modify the grid in place.
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
      "Finding the 'safe' O's is easier than testing whether each group is surrounded. An O is safe if it has one path to a border cell.",
      "Start from every O on the border and spread inward through connected O's. Everything reached is safe; mark it so you can tell it apart later.",
      "Then make one pass over the grid: unmarked O's become X, and marked cells go back to O.",
    ],
    approachOverview: `
Testing each group directly for "surrounded" is awkward. Flip it: find
every *safe* O (connected to the border, directly or through other O's),
then capture the rest.

Start a traversal from every "O" on the border and spread inward through
connected "O"s. None of these can be captured. Mark each with a
placeholder (like "#") to tell it apart from unvisited "O"s.

Then make one final pass:

- A plain "O" was never reached from the border, so capture it (flip to "X").
- A placeholder was safe, so flip it back to "O".
    `.trim(),
    solutions: [
      {
        approach: "DFS - Recursive Border Flood Fill",
        explanation: `
Recursively spread from every border "O", marking each cell reached as
safe. Then sweep the grid: unmarked O's are captured, and marked cells
go back to O.
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
          { code: 'board[r][c] = "#";', explanation: "A placeholder meaning 'this O is safe', so it's distinct from O's not reached yet." },
          { code: "for (let r ...) { dfs(r, 0); dfs(r, cols - 1); } for (let c ...) { dfs(0, c); dfs(rows - 1, c); }", explanation: "Starts the flood fill from every cell on all four edges. Any O there is safe, and the fill spreads inward." },
          { code: 'if (board[r][c] === "O") board[r][c] = "X"; else if (board[r][c] === "#") board[r][c] = "O";', explanation: "Final pass: a plain O was never reached from the border, so it's captured; safe cells are restored." },
        ],
      },
      {
        approach: "BFS - Iterative Border Flood Fill",
        explanation: `
Same idea without recursion: queue every border "O" up front and expand
from all of them together.
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
You're given an undirected graph as an adjacency list: \`graph[i]\` lists
the nodes connected to node \`i\`.

A graph is *bipartite* if you can split its nodes into two groups so
that every edge connects the two groups, never two nodes in the same
group.

Return \`true\` if the graph can be split this way, and \`false\`
otherwise. The graph may be disconnected (several separate pieces).
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
      "Color nodes with two colors as you visit them, so every edge joins two *different* colors. If you never have to give both ends of an edge the same color, it's bipartite.",
      "Give an uncolored node a color; each neighbor must get the *other* color. A neighbor that already has the *same* color is a contradiction.",
      "The graph may be in several pieces. Restart the coloring from an unvisited node until every node is colored.",
    ],
    approachOverview: `
This is a traversal problem disguised as coloring. Walk the graph (DFS
or BFS), giving each node one of two colors when you first reach it.
Every neighbor must get the *opposite* color.

Before visiting a neighbor, check it:

- Uncolored: give it the opposite color and continue from it.
- Already colored the *same* as the current node: two connected nodes are in the same group, so return \`false\`.

The graph can be disconnected, so restart the coloring from every node
not yet visited. Each piece must pass the check.
    `.trim(),
    solutions: [
      {
        approach: "DFS - Two-Coloring",
        explanation: `
Color each node 1 or -1 when first visited. For each neighbor: if it has
the same color, the graph isn't bipartite; if it's uncolored, give it the
opposite color and recurse. Restart from any uncolored node to cover
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
          { code: "color[node] = c;", explanation: "Gives the current node its assigned color." },
          { code: "if (color[neighbor] === c) return false;", explanation: "A neighbor with the same color is a contradiction: two connected nodes can't be in the same group." },
          { code: "if (color[neighbor] === 0 && !dfs(neighbor, -c)) return false;", explanation: "An uncolored neighbor gets the opposite color and is explored. Any contradiction found deeper is passed back up." },
          { code: "for (let i = 0; i < n; i++) { if (color[i] === 0 && !dfs(i, 1)) return false; }", explanation: "Restarts from any node not yet reached, so every disconnected piece is checked." },
        ],
      },
      {
        approach: "BFS - Two-Coloring",
        explanation: `
Same coloring rule, layer by layer with a queue instead of recursion:
color a starting node, then pop nodes and check or color their
neighbors.
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
