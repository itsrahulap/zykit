import type { Problem } from "../../types/problem";

export const treesProblems: Problem[] = [
  {
    id: "invert-binary-tree",
    title: "Invert Binary Tree",
    difficulty: "Easy",
    category: "trees",
    description: `
You're given the root of a binary tree. Flip the tree into its mirror
image - for every node, its left and right children should swap places,
all the way down the tree.

Return the root of the tree after the flip.
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
      "Think about just one node at a time: if you swap its left and right children, what still needs to happen to finish the job?",
      "Mirroring a tree means every node's children get swapped, not just the root's - so the swap has to happen at every level.",
      "Recursion fits naturally here: mirror the left subtree, mirror the right subtree, then swap the two results at the current node.",
    ],
    approachOverview: `
A tree is mirrored when every single node - not just the root - has its
left and right children swapped. That "do the same thing at every
level" phrasing is a strong hint to solve it recursively: invert the
left subtree, invert the right subtree, and then swap the two
(now-inverted) subtrees onto the current node.

The same idea also works iteratively with an explicit stack or queue:
visit each node once, swap its children, and push those children on to
be visited later. Both approaches touch every node exactly once.
    `.trim(),
    solutions: [
      {
        approach: "Recursive DFS",
        explanation: "Invert the left subtree and the right subtree first, then swap them onto the current node. The base case is an empty node, which is already its own mirror image.",
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
          { code: "const left = invertTree(root.left);", explanation: "Recursively mirrors the left subtree first." },
          { code: "const right = invertTree(root.right);", explanation: "Then recursively mirrors the right subtree." },
          { code: "root.left = right;\n  root.right = left;", explanation: "Swaps the two (already-mirrored) subtrees onto this node." },
        ],
      },
      {
        approach: "Iterative BFS",
        explanation: "Use a queue to visit every node level by level. At each node, swap its children, then push both children onto the queue so they get swapped too.",
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
You're given the root of a binary tree. Find its *maximum depth* - the
number of nodes along the longest path from the root down to the
farthest leaf.

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
      "The depth of a tree rooted at a node is 1 (for the node itself) plus the depth of whichever child subtree is deeper.",
      "You don't need to track a full path - just ask each subtree for its own depth and combine the two answers.",
      "This is naturally recursive: an empty tree has depth 0, and every other node's depth depends only on its children's depths.",
    ],
    approachOverview: `
The depth of a node is 1 (for itself) plus the larger of its left and
right subtree's depths. That's a recursive definition: an empty tree
has depth 0, and everything else is built up from its children's
depths.

You can compute this top-down with plain recursion, or bottom-up with
an iterative level-order traversal (BFS) that simply counts how many
levels it processes before the queue empties.
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
          { code: "const leftDepth = maxDepth(root.left);", explanation: "Recursively finds the depth of the left subtree." },
          { code: "const rightDepth = maxDepth(root.right);", explanation: "Recursively finds the depth of the right subtree." },
          { code: "return 1 + Math.max(leftDepth, rightDepth);", explanation: "Adds 1 for the current node and keeps whichever side is deeper." },
        ],
      },
      {
        approach: "Iterative BFS",
        explanation: "Process the tree level by level using a queue. Each full pass through the current level is one unit of depth; count how many passes happen before the queue is empty.",
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
You're given the root of a binary tree. Find the length of its
*diameter* - the number of edges on the longest path between any two
nodes in the tree. That path doesn't have to pass through the root.

Report the length in edges, not the count of nodes visited.
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
      "For any single node, the longest path that passes *through* it equals the height of its left subtree plus the height of its right subtree.",
      "The overall diameter is the largest of these 'through this node' values, taken over every node in the tree - not just the root.",
      "You can compute subtree heights and track the best diameter seen so far in the very same recursive pass, so you never have to walk the tree twice.",
    ],
    approachOverview: `
It's tempting to think the longest path must run through the root, but
it can be tucked entirely inside one subtree. The key realization is
that for *any* node, the longest path passing through it is exactly
its **left subtree height plus its right subtree height**. So the
answer is the maximum of that quantity over every node in the tree.

Rather than recomputing heights over and over (which would be slow),
compute each subtree's height with a single recursive pass, and update
a running "best diameter seen so far" value at every node along the
way, using the same height numbers you just calculated.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Height From Every Node",
        explanation: "For each node, compute the height of its left and right subtrees separately (each a full recursive call) and combine them. This recomputes heights repeatedly, which is wasteful.",
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
        explanation: "Write a helper that returns a subtree's height, but also updates a shared 'best diameter' value each time it's called, using the heights of the current node's two children.",
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
          { code: "let best = 0;", explanation: "Tracks the longest path (in edges) found so far, across every node visited." },
          { code: "const leftHeight = height(node.left);\n    const rightHeight = height(node.right);", explanation: "Gets both children's heights first, from the bottom up." },
          { code: "best = Math.max(best, leftHeight + rightHeight);", explanation: "The path through this node is leftHeight + rightHeight edges; keep it if it beats the best seen so far." },
          { code: "return 1 + Math.max(leftHeight, rightHeight);", explanation: "Still returns this node's own height, so the parent call can use it." },
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
You're given the root of a binary tree. Determine whether it's
*height-balanced* - meaning that for every single node in the tree, the
heights of its left and right subtrees differ by at most 1.

Return *true* if the tree is balanced everywhere, and *false* if you
can find even one node where the two sides differ by more than 1.
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
      "Balance is a property that has to hold at *every* node, not just the root - a tree can look fine at the top but be unbalanced deep inside.",
      "You already know how to compute a subtree's height recursively - the question is how to also check the balance condition without recomputing heights again and again.",
      "Have your height function return a signal (like -1) the moment it detects an imbalance anywhere below, so that signal can bubble all the way up and short-circuit the rest of the checks.",
    ],
    approachOverview: `
A naive approach checks the balance condition at the root, then
separately recomputes the height of every subtree to check balance
again inside them - that duplicated height work makes it slow.

The efficient approach folds both jobs into one recursive traversal: a
helper function computes a subtree's height, but if it ever finds an
imbalance in a child subtree, it immediately reports that upward using
a sentinel value (like -1) instead of a real height. Any parent call
that sees that sentinel knows to also report "unbalanced" without doing
any more work, so a single bottom-up pass is enough.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Height Recomputed at Every Node",
        explanation: "At each node, compute left and right subtree heights (each its own recursive call) and check they differ by at most 1, then recurse into both children to check the same condition there.",
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
        explanation: "Write a helper that returns a subtree's height, but returns -1 the instant it detects an imbalance anywhere below. Any call that receives -1 from a child immediately passes -1 up too, so the whole tree only needs one pass.",
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
          { code: "const leftHeight = height(node.left);\n    if (leftHeight === -1) return -1;", explanation: "If the left subtree was already found unbalanced, stop and pass that failure straight up." },
          { code: "const rightHeight = height(node.right);\n    if (rightHeight === -1) return -1;", explanation: "Same check on the right subtree." },
          { code: "if (Math.abs(leftHeight - rightHeight) > 1) return -1;", explanation: "This node itself is unbalanced if its two sides differ by more than 1." },
          { code: "return 1 + Math.max(leftHeight, rightHeight);", explanation: "Otherwise, everything checked out so far - return the real height for the parent to use." },
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
You're given the roots of two binary trees. Determine whether they're
*structurally identical* - meaning every node lines up in the same
position between the two trees, and every corresponding pair of nodes
holds the same value.

Return *true* if the trees are the same, and *false* otherwise.
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
      "Two trees are the same only if their roots match *and* both pairs of corresponding subtrees are also the same - that's a recursive condition.",
      "Handle the missing-node cases first: two empty trees match, but one empty and one non-empty never do.",
      "Compare the current pair of nodes' values, then recursively check left-with-left and right-with-right.",
    ],
    approachOverview: `
Two trees match exactly when: both roots are missing (both null - a
match), or both roots exist with equal values *and* their left
subtrees match each other *and* their right subtrees match each other.
That's a clean recursive definition - compare the current pair of
nodes, then recurse into the corresponding left and right children of
each tree.
    `.trim(),
    solutions: [
      {
        approach: "Recursive DFS",
        explanation: "Compare the two current nodes: if both are null, they match. If only one is null, or their values differ, they don't. Otherwise, recursively check that both left subtrees match and both right subtrees match.",
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
          { code: "if (p === null && q === null) return true;", explanation: "Two empty subtrees always match each other." },
          { code: "if (p === null || q === null) return false;", explanation: "One tree having a node where the other has none is an immediate mismatch." },
          { code: "if (p.val !== q.val) return false;", explanation: "Both nodes exist, so their values must be equal too." },
          { code: "return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);", explanation: "Finally, both left subtrees and both right subtrees must also match." },
        ],
      },
      {
        approach: "Iterative BFS",
        explanation: "Walk both trees in lockstep using a queue of paired nodes. At each step, pop one pair, compare them, and push their children pairs (left-with-left, right-with-right) to check later.",
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
You're given the roots of two binary trees, called *root* and
*subRoot*. Determine whether *subRoot* appears somewhere inside
*root* as an exact subtree - meaning there's some node in *root* such
that the tree hanging below it (that node plus everything beneath it)
is structurally identical, value for value, to *subRoot*.

Return *true* if such a node exists, and *false* otherwise.
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
      "You already have a way to check whether two whole trees are exactly identical - can you reuse that check at every node of the bigger tree?",
      "Walk through root node by node. At each one, ask: 'does the subtree starting here look exactly like subRoot?'",
      "If root has n nodes and subRoot has m nodes, checking one candidate position costs O(m), and there are O(n) positions to try.",
    ],
    approachOverview: `
This builds directly on the "are two trees identical" check: instead of
comparing exactly two trees, walk through every node of *root* and, at
each one, ask whether the subtree starting there is identical to
*subRoot*. As soon as one position matches, the answer is *true*; if no
position ever matches, the answer is *false*.
    `.trim(),
    solutions: [
      {
        approach: "DFS — Same-Tree Check at Every Node",
        explanation: "Reuse an identical-trees helper. Recursively visit every node of root; at each one, check if the subtree rooted there is identical to subRoot. If root itself runs out (null) before a match is found, there's nowhere left to check.",
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
          { code: "if (root === null) return false;", explanation: "Ran off the bottom of root without finding a match - subRoot can't be here." },
          { code: "if (isSameTree(root, subRoot)) return true;", explanation: "Checks whether the subtree starting exactly at this node matches subRoot." },
          { code: "return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);", explanation: "Otherwise, keeps looking further down in both the left and right subtrees." },
        ],
      },
      {
        approach: "Serialize and Search",
        explanation: "Convert both trees into unique string encodings (using sentinels for null children and separators so values never accidentally merge), then just check whether subRoot's encoding appears as a substring of root's encoding.",
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
You're given the root of a binary tree. Return the values of its nodes
grouped level by level, from top to bottom - all the values from the
root's level first, then all the values one level down, and so on.

Within each level, list the values left to right.
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
      "A traversal that naturally visits nodes level by level, rather than diving deep first, is exactly what you need here - that's breadth-first search.",
      "Use a queue. The key trick is knowing where one level ends and the next begins, so you can group the values correctly.",
      "Before processing a level, record how many nodes are currently in the queue - that count tells you exactly how many nodes belong to this level, before any of their children get added in.",
    ],
    approachOverview: `
Grouping values by level is exactly what breadth-first search (BFS)
gives you for free, as long as you know where each level ends. The
trick is: right before you start processing a level, check how many
nodes are currently sitting in the queue - that number is exactly how
many nodes belong to this level (since none of the next level's nodes
have been added yet). Process exactly that many, collecting their
values and queuing up their children, then move to the next level.
    `.trim(),
    solutions: [
      {
        approach: "Iterative BFS",
        explanation: "Use a queue starting with the root. At the start of each loop iteration, note the current queue size - that's how many nodes are in this level. Pop exactly that many, record their values, and enqueue their children for the next round.",
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
          { code: "const levelSize = queue.length;", explanation: "Captures exactly how many nodes belong to the current level, before any children are enqueued." },
          { code: "for (let i = 0; i < levelSize; i++) {", explanation: "Processes precisely that many nodes - no more, no less - so the next level's nodes don't leak into this one." },
          { code: "const node = queue.shift();\n      level.push(node.val);", explanation: "Removes the next node in line for this level and records its value." },
          { code: "if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);", explanation: "Queues up this node's children so they'll be processed as part of the next level." },
        ],
      },
      {
        approach: "Recursive DFS with Level Tracking",
        explanation: "Do a normal depth-first traversal, but pass along the current depth as an argument. Use that depth as an index into the result array, creating a new sub-array the first time a depth is reached.",
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
Imagine standing to the right of a binary tree and looking at it
straight on - from that vantage point, you'd only be able to see the
rightmost node at each level, since taller nodes on the right can block
the ones behind them.

Given the root of a binary tree, return the values of the nodes visible
from the right side, ordered from the top level down to the bottom.
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
      "The node you can see at each level is simply the last (rightmost) node visited on that level.",
      "A level-order traversal (BFS) naturally visits every node of a level together - the last one it visits in that level is the one that's visible from the right.",
      "You can also do this with DFS by always visiting the right child before the left child, and recording the first node your traversal reaches at each new depth.",
    ],
    approachOverview: `
The visible node at each level is just the rightmost node in that
level. A level-order (BFS) traversal already groups nodes by level, so
the last value processed in each level's group is the answer for that
level.

Alternatively, a depth-first traversal that always explores the right
child before the left child will reach the rightmost node of each depth
*first* - so recording the first value seen at each new depth (and
never overwriting it) gives the same result.
    `.trim(),
    solutions: [
      {
        approach: "Iterative BFS",
        explanation: "Traverse level by level with a queue, just like a normal level-order traversal, but only keep the value of the last node processed in each level.",
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
          { code: "const levelSize = queue.length;", explanation: "Notes how many nodes are in the current level before processing it." },
          { code: "if (i === levelSize - 1) {\n        result.push(node.val);\n      }", explanation: "Only the last node processed in this level - the rightmost one - gets recorded." },
          { code: "if (node.left) queue.push(node.left);\n      if (node.right) queue.push(node.right);", explanation: "Queues both children (left before right) so the next level is ready to process." },
        ],
      },
      {
        approach: "Recursive DFS (Right First)",
        explanation: "Do a depth-first traversal that visits the right child before the left child at every node. The first time the traversal reaches a given depth, that node is the rightmost one visible at that level, so record it and never overwrite it.",
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
