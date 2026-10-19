import type { Problem } from "../../types/problem";

export const treesProblems: Problem[] = [
  {
    id: "invert-binary-tree",
    title: "Invert Binary Tree",
    difficulty: "Easy",
    category: "trees",
    description: `
You're given the root of a binary tree. Flip it into its mirror image:
swap the left and right children of every node, all the way down.

Return the root of the flipped tree.
    `.trim(),
    examples: [
      {
        input: "root = [4,2,7,1,3,6,9]",
        output: "[4,7,2,9,6,3,1]",
        explanation: "At every node, the left and right subtrees swap. The 2-subtree and 7-subtree swap places under the root, and the same swap happens one level down.",
      },
      {
        input: "root = [2,1,3]",
        output: "[2,3,1]",
        explanation: "The root's two children, 1 and 3, swap sides.",
      },
      {
        input: "root = []",
        output: "[]",
        explanation: "An empty tree, mirrored, is still empty.",
      },
    ],
    constraints: ["The number of nodes in the tree is in the range [0, 100].", "-100 <= Node.val <= 100"],
    hints: [
      "Think about one node: if you swap its children, what's left to do?",
      "Every node's children get swapped, not just the root's, so the swap happens at every level.",
      "Recursion fits: mirror the left subtree, mirror the right subtree, then swap the two at the current node.",
    ],
    approachOverview: `
Mirroring means swapping the children of every node, not just the root.
"Do the same thing at every level" suggests recursion: invert the left
subtree, invert the right subtree, then swap them at the current node.

It also works iteratively with a stack or queue: visit each node, swap
its children, and queue the children for later. Both approaches visit
every node exactly once.
    `.trim(),
    solutions: [
      {
        approach: "Recursive DFS",
        explanation: "Invert both subtrees, then swap them at the current node. The base case is an empty node, which is already its own mirror.",
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function invertTree(root) {
  if (root === null) return null;

  const left = invertTree(root.left);
  const right = invertTree(root.right);

  root.left = right;
  root.right = left;

  return root;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(h) — recursion stack depth, where h is the tree's height (O(n) worst case for a skewed tree)",
        walkthrough: [
          { code: "if (root === null) return null;", explanation: "An empty subtree has nothing to mirror." },
          { code: "const left = invertTree(root.left);", explanation: "Mirrors the left subtree." },
          { code: "const right = invertTree(root.right);", explanation: "Mirrors the right subtree." },
          { code: "root.left = right;\n  root.right = left;", explanation: "Swaps the two mirrored subtrees at this node." },
        ],
      },
      {
        approach: "Iterative BFS",
        explanation: "Visit nodes level by level with a queue. Swap each node's children, then queue both children so they get swapped too.",
        code: `function invertTree(root) {
  if (root === null) return null;

  const queue = [root];

  while (queue.length > 0) {
    const node = queue.shift();

    [node.left, node.right] = [node.right, node.left];

    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }

  return root;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) — the queue can hold up to a whole level of nodes",
      },
    ],
    relatedProblems: ["maximum-depth-of-binary-tree", "same-tree"],
    keywords: ["invert binary tree", "mirror tree", "dfs", "bfs", "tree"],
  },
  {
    id: "maximum-depth-of-binary-tree",
    title: "Maximum Depth of Binary Tree",
    difficulty: "Easy",
    category: "trees",
    description: `
You're given the root of a binary tree. Return its *maximum depth*: the
number of nodes on the longest path from the root down to a leaf.

A leaf is a node with no children. The depth of an empty tree is 0.
    `.trim(),
    examples: [
      {
        input: "root = [3,9,20,null,null,15,7]",
        output: "3",
        explanation: "The longest path is 3 -> 20 -> 15 (or 3 -> 20 -> 7), which visits 3 nodes.",
      },
      {
        input: "root = [1,null,2]",
        output: "2",
        explanation: "The path 1 -> 2 visits 2 nodes; there's no longer path.",
      },
      {
        input: "root = []",
        output: "0",
        explanation: "An empty tree has no nodes, so its depth is 0.",
      },
    ],
    constraints: ["The number of nodes in the tree is in the range [0, 10^4].", "-100 <= Node.val <= 100"],
    hints: [
      "A node's depth is 1 (for itself) plus the depth of its deeper child subtree.",
      "You don't need to track paths. Ask each subtree for its depth and combine the answers.",
      "It's naturally recursive: an empty tree has depth 0, and every other node depends only on its children.",
    ],
    approachOverview: `
A node's depth is 1 plus the larger of its two subtree depths. An empty
tree has depth 0. That's a recursive definition.

You can compute it with plain recursion, or with a level-order traversal
(BFS) that counts how many levels it processes before the queue empties.
    `.trim(),
    solutions: [
      {
        approach: "Recursive DFS",
        explanation: "The depth of an empty node is 0. Otherwise, it's 1 plus the deeper of the left and right subtree depths.",
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function maxDepth(root) {
  if (root === null) return 0;

  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);

  return 1 + Math.max(leftDepth, rightDepth);
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(h) — recursion stack depth, where h is the tree's height (O(n) worst case)",
        walkthrough: [
          { code: "if (root === null) return 0;", explanation: "An empty subtree contributes no depth." },
          { code: "const leftDepth = maxDepth(root.left);", explanation: "Finds the depth of the left subtree." },
          { code: "const rightDepth = maxDepth(root.right);", explanation: "Finds the depth of the right subtree." },
          { code: "return 1 + Math.max(leftDepth, rightDepth);", explanation: "Adds 1 for this node to the deeper side." },
        ],
      },
      {
        approach: "Iterative BFS",
        explanation: "Process the tree level by level with a queue. Each level adds 1 to the depth; count levels until the queue is empty.",
        code: `function maxDepth(root) {
  if (root === null) return 0;

  let depth = 0;
  let queue = [root];

  while (queue.length > 0) {
    const nextLevel = [];

    for (const node of queue) {
      if (node.left) nextLevel.push(node.left);
      if (node.right) nextLevel.push(node.right);
    }

    queue = nextLevel;
    depth++;
  }

  return depth;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) — the queue can hold up to a whole level of nodes",
      },
    ],
    relatedProblems: ["invert-binary-tree", "balanced-binary-tree", "diameter-of-binary-tree"],
    keywords: ["maximum depth", "binary tree", "dfs", "bfs", "height"],
  },
  {
    id: "diameter-of-binary-tree",
    title: "Diameter of Binary Tree",
    difficulty: "Easy",
    category: "trees",
    description: `
You're given the root of a binary tree. Return its *diameter*: the number
of edges on the longest path between any two nodes. The path doesn't
have to pass through the root.

Count edges, not nodes.
    `.trim(),
    examples: [
      {
        input: "root = [1,2,3,4,5]",
        output: "3",
        explanation: "The longest path is 4 -> 2 -> 1 -> 3 (or 5 -> 2 -> 1 -> 3), which has 3 edges.",
      },
      {
        input: "root = [1,2]",
        output: "1",
        explanation: "The only path is 1 -> 2, a single edge.",
      },
      {
        input: "root = [1]",
        output: "0",
        explanation: "A single node has no path at all.",
      },
    ],
    constraints: ["The number of nodes in the tree is in the range [1, 10^4].", "-100 <= Node.val <= 100"],
    hints: [
      "For any node, the longest path *through* it is its left subtree height plus its right subtree height.",
      "The diameter is the largest of these values over every node, not just the root.",
      "Compute heights and track the best diameter in the same recursive pass, so you walk the tree only once.",
    ],
    approachOverview: `
The longest path doesn't have to run through the root; it can sit
entirely inside one subtree. For *any* node, the longest path through it
is its **left subtree height plus its right subtree height**. The answer
is the maximum of that over every node.

Don't recompute heights over and over. Compute them in one recursive
pass, and update a running "best diameter" at each node using the
heights you just calculated.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Height From Every Node",
        explanation: "For each node, compute both subtree heights with separate recursive calls and add them. This recomputes the same heights many times.",
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function height(node) {
  if (node === null) return 0;
  return 1 + Math.max(height(node.left), height(node.right));
}

function diameterOfBinaryTree(root) {
  if (root === null) return 0;

  const throughRoot = height(root.left) + height(root.right);
  const bestInLeft = diameterOfBinaryTree(root.left);
  const bestInRight = diameterOfBinaryTree(root.right);

  return Math.max(throughRoot, bestInLeft, bestInRight);
}`,
        timeComplexity: "O(n²) — height() is called on overlapping subtrees repeatedly",
        spaceComplexity: "O(h) — recursion stack depth",
      },
      {
        approach: "Optimal — Height + Diameter in One Pass",
        explanation: "A helper returns a subtree's height and, along the way, updates a shared 'best diameter' using the current node's two child heights.",
        code: `function diameterOfBinaryTree(root) {
  let best = 0;

  function height(node) {
    if (node === null) return 0;

    const leftHeight = height(node.left);
    const rightHeight = height(node.right);

    best = Math.max(best, leftHeight + rightHeight);

    return 1 + Math.max(leftHeight, rightHeight);
  }

  height(root);
  return best;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(h) — recursion stack depth, where h is the tree's height (O(n) worst case)",
        walkthrough: [
          { code: "let best = 0;", explanation: "Tracks the longest path (in edges) found so far." },
          { code: "const leftHeight = height(node.left);\n    const rightHeight = height(node.right);", explanation: "Gets both children's heights first, bottom up." },
          { code: "best = Math.max(best, leftHeight + rightHeight);", explanation: "The path through this node has leftHeight + rightHeight edges. Keep it if it's the best so far." },
          { code: "return 1 + Math.max(leftHeight, rightHeight);", explanation: "Returns this node's height for the parent to use." },
        ],
      },
    ],
    relatedProblems: ["maximum-depth-of-binary-tree", "balanced-binary-tree"],
    keywords: ["diameter of binary tree", "tree height", "dfs", "longest path"],
  },
  {
    id: "balanced-binary-tree",
    title: "Balanced Binary Tree",
    difficulty: "Easy",
    category: "trees",
    description: `
You're given the root of a binary tree. Return *true* if it's
*height-balanced*: at every node, the heights of the left and right
subtrees differ by at most 1. Return *false* if any node breaks this.
    `.trim(),
    examples: [
      {
        input: "root = [3,9,20,null,null,15,7]",
        output: "true",
        explanation: "Checking every node, the left and right subtree heights never differ by more than 1.",
      },
      {
        input: "root = [1,2,2,3,3,null,null,4,4]",
        output: "false",
        explanation: "The subtree rooted at the first '2' has a left height of 2 and a right height of 0 - a difference of 2, which breaks the balance rule.",
      },
      {
        input: "root = []",
        output: "true",
        explanation: "An empty tree is trivially balanced - there are no nodes to violate the rule.",
      },
    ],
    constraints: ["The number of nodes in the tree is in the range [0, 5000].", "-10^4 <= Node.val <= 10^4"],
    hints: [
      "Balance must hold at *every* node. A tree can look fine at the top but be unbalanced deep inside.",
      "You can compute heights recursively. How can you check balance at the same time, without recomputing heights?",
      "Have the height function return a signal (like -1) as soon as it finds an imbalance, so it bubbles up and skips the remaining checks.",
    ],
    approachOverview: `
A naive approach checks balance at the root, then recomputes heights to
check every subtree again. The repeated height work makes it slow.

Instead, do both in one recursive pass. A helper computes a subtree's
height, but if it finds an imbalance below, it returns a sentinel (like
-1) instead of a real height. Any parent that sees the sentinel passes it
straight up, so one bottom-up pass is enough.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Height Recomputed at Every Node",
        explanation: "At each node, compute both subtree heights with separate recursive calls and check they differ by at most 1. Then check both children the same way.",
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function height(node) {
  if (node === null) return 0;
  return 1 + Math.max(height(node.left), height(node.right));
}

function isBalanced(root) {
  if (root === null) return true;

  const diff = Math.abs(height(root.left) - height(root.right));

  if (diff > 1) return false;

  return isBalanced(root.left) && isBalanced(root.right);
}`,
        timeComplexity: "O(n²) — height() recomputes overlapping subtree heights at every node",
        spaceComplexity: "O(h) — recursion stack depth",
      },
      {
        approach: "Optimal — Height + Balance Check in One Pass",
        explanation: "A helper returns a subtree's height, or -1 as soon as it finds an imbalance below. Any call that gets -1 from a child passes it up, so one pass covers the whole tree.",
        code: `function isBalanced(root) {
  function height(node) {
    if (node === null) return 0;

    const leftHeight = height(node.left);
    if (leftHeight === -1) return -1;

    const rightHeight = height(node.right);
    if (rightHeight === -1) return -1;

    if (Math.abs(leftHeight - rightHeight) > 1) return -1;

    return 1 + Math.max(leftHeight, rightHeight);
  }

  return height(root) !== -1;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(h) — recursion stack depth, where h is the tree's height (O(n) worst case)",
        walkthrough: [
          { code: "const leftHeight = height(node.left);\n    if (leftHeight === -1) return -1;", explanation: "If the left subtree is unbalanced, stop and pass the failure up." },
          { code: "const rightHeight = height(node.right);\n    if (rightHeight === -1) return -1;", explanation: "Same check on the right subtree." },
          { code: "if (Math.abs(leftHeight - rightHeight) > 1) return -1;", explanation: "This node is unbalanced if its sides differ by more than 1." },
          { code: "return 1 + Math.max(leftHeight, rightHeight);", explanation: "Otherwise, return the real height for the parent to use." },
        ],
      },
    ],
    relatedProblems: ["maximum-depth-of-binary-tree", "diameter-of-binary-tree"],
    keywords: ["balanced binary tree", "height-balanced", "dfs", "tree height"],
  },
  {
    id: "same-tree",
    title: "Same Tree",
    difficulty: "Easy",
    category: "trees",
    description: `
You're given the roots of two binary trees. Return *true* if they're
identical: the same shape, with the same value at every matching node.
Otherwise return *false*.
    `.trim(),
    examples: [
      {
        input: "p = [1,2,3], q = [1,2,3]",
        output: "true",
        explanation: "Every node in the same position holds the same value.",
      },
      {
        input: "p = [1,2], q = [1,null,2]",
        output: "false",
        explanation: "Both trees have a node valued 2, but in p it's a left child while in q it's a right child - the structures don't match.",
      },
      {
        input: "p = [1,2,1], q = [1,1,2]",
        output: "false",
        explanation: "The structures match, but the values at the second and third positions are swapped between the two trees.",
      },
    ],
    constraints: ["The number of nodes in both trees is in the range [0, 100].", "-10^4 <= Node.val <= 10^4"],
    hints: [
      "Two trees are the same only if their roots match *and* both pairs of subtrees match. That's recursive.",
      "Handle missing nodes first: two empty trees match, but one empty and one non-empty never do.",
      "Compare the two nodes' values, then recursively check left-with-left and right-with-right.",
    ],
    approachOverview: `
Two trees match when either:

- both roots are null, or
- both roots exist with equal values, *and* their left subtrees match, *and* their right subtrees match.

So compare the current pair of nodes, then recurse into the matching
left and right children.
    `.trim(),
    solutions: [
      {
        approach: "Recursive DFS",
        explanation: "If both nodes are null, they match. If only one is null, or the values differ, they don't. Otherwise, check that both left subtrees and both right subtrees match.",
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function isSameTree(p, q) {
  if (p === null && q === null) return true;
  if (p === null || q === null) return false;
  if (p.val !== q.val) return false;

  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}`,
        timeComplexity: "O(n) — where n is the number of nodes in the smaller tree",
        spaceComplexity: "O(h) — recursion stack depth, where h is the shorter tree's height",
        walkthrough: [
          { code: "if (p === null && q === null) return true;", explanation: "Two empty subtrees match." },
          { code: "if (p === null || q === null) return false;", explanation: "A node in one tree with no node in the other is a mismatch." },
          { code: "if (p.val !== q.val) return false;", explanation: "Both nodes exist, so their values must be equal." },
          { code: "return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);", explanation: "Both left subtrees and both right subtrees must also match." },
        ],
      },
      {
        approach: "Iterative BFS",
        explanation: "Walk both trees together with a queue of node pairs. Pop a pair, compare it, and queue its child pairs (left-with-left, right-with-right).",
        code: `function isSameTree(p, q) {
  const queue = [[p, q]];

  while (queue.length > 0) {
    const [nodeP, nodeQ] = queue.shift();

    if (nodeP === null && nodeQ === null) continue;
    if (nodeP === null || nodeQ === null) return false;
    if (nodeP.val !== nodeQ.val) return false;

    queue.push([nodeP.left, nodeQ.left]);
    queue.push([nodeP.right, nodeQ.right]);
  }

  return true;
}`,
        timeComplexity: "O(n) — where n is the number of nodes in the smaller tree",
        spaceComplexity: "O(n) — the queue can hold up to a whole level of node pairs",
      },
    ],
    relatedProblems: ["invert-binary-tree", "subtree-of-another-tree"],
    keywords: ["same tree", "identical trees", "dfs", "bfs"],
  },
  {
    id: "subtree-of-another-tree",
    title: "Subtree of Another Tree",
    difficulty: "Easy",
    category: "trees",
    description: `
You're given the roots of two binary trees, *root* and *subRoot*. Return
*true* if *subRoot* appears inside *root* as an exact subtree, and
*false* otherwise.

An exact subtree means some node in *root*, plus everything beneath it,
is identical to *subRoot* in shape and values.
    `.trim(),
    examples: [
      {
        input: "root = [3,4,5,1,2], subRoot = [4,1,2]",
        output: "true",
        explanation: "The subtree hanging below the node valued 4 (with children 1 and 2) matches subRoot exactly.",
      },
      {
        input: "root = [3,4,5,1,2,null,null,null,null,0], subRoot = [4,1,2]",
        output: "false",
        explanation: "The node valued 4 now has an extra node (0) hanging further below it, so its subtree no longer matches subRoot exactly.",
      },
      {
        input: "root = [1,1], subRoot = [1]",
        output: "true",
        explanation: "The second node valued 1 (a leaf) by itself matches subRoot, which is just a single node valued 1.",
      },
    ],
    constraints: [
      "The number of nodes in root is in the range [1, 2000].",
      "The number of nodes in subRoot is in the range [1, 1000].",
      "-10^4 <= Node.val <= 10^4",
    ],
    hints: [
      "You can already check whether two trees are identical. Can you reuse that check at every node of the bigger tree?",
      "Walk root node by node. At each one, ask: 'is the subtree starting here identical to subRoot?'",
      "If root has n nodes and subRoot has m, each check costs O(m), and there are O(n) positions to try.",
    ],
    approachOverview: `
This builds on the "are two trees identical" check. Walk every node of
*root* and check whether the subtree starting there is identical to
*subRoot*. Return *true* on the first match, or *false* if none match.
    `.trim(),
    solutions: [
      {
        approach: "DFS — Same-Tree Check at Every Node",
        explanation: "Reuse an identical-trees helper. Visit every node of root and check whether the subtree there is identical to subRoot. Reaching null without a match means there's nowhere left to look.",
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function isSameTree(a, b) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  if (a.val !== b.val) return false;

  return isSameTree(a.left, b.left) && isSameTree(a.right, b.right);
}

function isSubtree(root, subRoot) {
  if (root === null) return false;
  if (isSameTree(root, subRoot)) return true;

  return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}`,
        timeComplexity: "O(n * m) — where n is the number of nodes in root and m is the number of nodes in subRoot, since up to n positions are each checked in O(m)",
        spaceComplexity: "O(h) — recursion stack depth, where h is the height of root",
        walkthrough: [
          { code: "if (root === null) return false;", explanation: "Reached the bottom of root without a match, so subRoot isn't here." },
          { code: "if (isSameTree(root, subRoot)) return true;", explanation: "Checks whether the subtree starting at this node matches subRoot." },
          { code: "return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);", explanation: "Otherwise, keeps looking in the left and right subtrees." },
        ],
      },
      {
        approach: "Serialize and Search",
        explanation: "Turn both trees into unique strings, using a marker for null children and separators so values never run together. Then check whether subRoot's string appears inside root's string.",
        code: `function serialize(node, out) {
  if (node === null) {
    out.push("#");
    return;
  }
  out.push("^" + node.val);
  serialize(node.left, out);
  serialize(node.right, out);
}

function isSubtree(root, subRoot) {
  const rootParts = [];
  const subParts = [];

  serialize(root, rootParts);
  serialize(subRoot, subParts);

  return rootParts.join(",").includes(subParts.join(","));
}`,
        timeComplexity: "O(n + m) for building the strings, plus the cost of the substring search (typically O(n + m) with a good algorithm, O(n * m) naively)",
        spaceComplexity: "O(n + m) — for the serialized strings",
      },
    ],
    relatedProblems: ["same-tree", "invert-binary-tree"],
    keywords: ["subtree of another tree", "same tree", "dfs", "serialization"],
  },
  {
    id: "binary-tree-level-order-traversal",
    title: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    category: "trees",
    description: `
You're given the root of a binary tree. Return its node values grouped by
level, from top to bottom. Within each level, list values left to right.
    `.trim(),
    examples: [
      {
        input: "root = [3,9,20,null,null,15,7]",
        output: "[[3],[9,20],[15,7]]",
        explanation: "Level 0 has just the root (3). Level 1 has its two children (9, 20). Level 2 has 20's two children (15, 7).",
      },
      {
        input: "root = [1]",
        output: "[[1]]",
        explanation: "A single node is its own entire level.",
      },
      {
        input: "root = []",
        output: "[]",
        explanation: "There are no nodes, so there are no levels at all.",
      },
    ],
    constraints: ["The number of nodes in the tree is in the range [0, 2000].", "-1000 <= Node.val <= 1000"],
    hints: [
      "You need a traversal that visits nodes level by level instead of diving deep first. That's breadth-first search.",
      "Use a queue. The trick is knowing where one level ends and the next begins.",
      "Before processing a level, record the queue's size. That's exactly how many nodes belong to this level, before their children are added.",
    ],
    approachOverview: `
Breadth-first search (BFS) visits nodes level by level. You just need to
know where each level ends.

Before processing a level, check the queue's size. That's exactly how
many nodes are in this level, since none of the next level's nodes have
been added yet. Process that many nodes, collect their values, queue
their children, and move on.
    `.trim(),
    solutions: [
      {
        approach: "Iterative BFS",
        explanation: "Start a queue with the root. Each round, note the queue size: that's this level's node count. Pop that many, record their values, and enqueue their children.",
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function levelOrder(root) {
  if (root === null) return [];

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;
    const level = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      level.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(level);
  }

  return result;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) — the queue and the result both hold every node's value",
        walkthrough: [
          { code: "const levelSize = queue.length;", explanation: "Records how many nodes are in this level, before any children are enqueued." },
          { code: "for (let i = 0; i < levelSize; i++) {", explanation: "Processes exactly that many nodes, so the next level's nodes don't leak in." },
          { code: "const node = queue.shift();\n      level.push(node.val);", explanation: "Takes the next node in this level and records its value." },
          { code: "if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);", explanation: "Queues the node's children for the next level." },
        ],
      },
      {
        approach: "Recursive DFS with Level Tracking",
        explanation: "Do a depth-first traversal that passes the current depth along. Use the depth as an index into the result, adding a new sub-array the first time a depth is reached.",
        code: `function levelOrder(root) {
  const result = [];

  function dfs(node, depth) {
    if (node === null) return;

    if (result.length === depth) {
      result.push([]);
    }

    result[depth].push(node.val);

    dfs(node.left, depth + 1);
    dfs(node.right, depth + 1);
  }

  dfs(root, 0);
  return result;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(h) — recursion stack depth, plus O(n) for the result array itself",
      },
    ],
    relatedProblems: ["binary-tree-right-side-view", "maximum-depth-of-binary-tree"],
    keywords: ["level order traversal", "bfs", "binary tree", "queue"],
  },
  {
    id: "binary-tree-right-side-view",
    title: "Binary Tree Right Side View",
    difficulty: "Medium",
    category: "trees",
    description: `
Imagine standing to the right of a binary tree. You'd see only the
rightmost node at each level; it hides the nodes behind it.

Given the root of a binary tree, return the values you can see from the
right side, from the top level to the bottom.
    `.trim(),
    examples: [
      {
        input: "root = [1,2,3,null,5,null,4]",
        output: "[1,3,4]",
        explanation: "Level 0 shows 1. Level 1 shows 3 (2 is hidden behind it). Level 2 shows 4 (5 is hidden behind it).",
      },
      {
        input: "root = [1,null,3]",
        output: "[1,3]",
        explanation: "Every level here has only one node, so both are visible.",
      },
      {
        input: "root = []",
        output: "[]",
        explanation: "An empty tree has nothing to view.",
      },
    ],
    constraints: ["The number of nodes in the tree is in the range [0, 100].", "-100 <= Node.val <= 100"],
    hints: [
      "The visible node at each level is the last (rightmost) node on that level.",
      "A level-order traversal (BFS) visits each level's nodes together. The last one in each level is the visible one.",
      "With DFS, visit the right child before the left, and record the first node you reach at each new depth.",
    ],
    approachOverview: `
The visible node at each level is the rightmost one. A level-order (BFS)
traversal already groups nodes by level, so take the last value in each
level.

Or use a depth-first traversal that visits the right child first. It
reaches the rightmost node of each depth *first*, so record the first
value seen at each new depth and never overwrite it.
    `.trim(),
    solutions: [
      {
        approach: "Iterative BFS",
        explanation: "Do a normal level-order traversal with a queue, but keep only the last node's value in each level.",
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function rightSideView(root) {
  if (root === null) return [];

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();

      if (i === levelSize - 1) {
        result.push(node.val);
      }

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }

  return result;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) — the queue can hold up to a whole level of nodes",
        walkthrough: [
          { code: "const levelSize = queue.length;", explanation: "Notes how many nodes are in this level." },
          { code: "if (i === levelSize - 1) {\n        result.push(node.val);\n      }", explanation: "Records only the last (rightmost) node in this level." },
          { code: "if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);", explanation: "Queues both children, left before right, for the next level." },
        ],
      },
      {
        approach: "Recursive DFS (Right First)",
        explanation: "Do a depth-first traversal that visits the right child before the left. The first node reached at each depth is the rightmost one, so record it and never overwrite it.",
        code: `function rightSideView(root) {
  const result = [];

  function dfs(node, depth) {
    if (node === null) return;

    if (depth === result.length) {
      result.push(node.val);
    }

    dfs(node.right, depth + 1);
    dfs(node.left, depth + 1);
  }

  dfs(root, 0);
  return result;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(h) — recursion stack depth, plus O(h) for the result array",
      },
    ],
    relatedProblems: ["binary-tree-level-order-traversal", "maximum-depth-of-binary-tree"],
    keywords: ["right side view", "binary tree", "bfs", "dfs", "level order"],
  },
];
