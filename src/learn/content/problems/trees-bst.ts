import type { Problem } from "../../types/problem";

export const treesBstProblems: Problem[] = [
  {
    id: "lowest-common-ancestor-of-a-binary-search-tree",
    title: "Lowest Common Ancestor of a Binary Search Tree",
    difficulty: "Medium",
    category: "trees",
    description: `
You're given the root of a **binary search tree** (at every node, the
left subtree is smaller and the right subtree is larger) and two nodes
\`p\` and \`q\` that exist in the tree.

Find their **lowest common ancestor**: the deepest node that has both
\`p\` and \`q\` as descendants. A node counts as its own descendant, so if
\`p\` is an ancestor of \`q\`, the answer is \`p\`.
    `.trim(),
    examples: [
      {
        input: "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8",
        output: "6",
        explanation: "2 lives in the left subtree of 6 and 8 lives in the right subtree, so 6 is the deepest node that has both underneath it.",
      },
      {
        input: "root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4",
        output: "2",
        explanation: "4 is a descendant of 2, and a node is allowed to be its own ancestor, so 2 is the answer.",
      },
    ],
    constraints: [
      "The number of nodes is in the range [2, 10^5].",
      "All node values are unique.",
      "p and q both exist in the tree and p != q.",
    ],
    hints: [
      "In a general binary tree you'd search both subtrees blindly. What does the BST ordering tell you for free?",
      "At each node, compare both values to the node's value. Both smaller means the answer is on the left; both larger means it's on the right.",
      "If the values fall on different sides (or one equals the current node), that node is the split point and the answer.",
    ],
    approachOverview: `
A solution for *any* binary tree searches both subtrees to see where
\`p\` and \`q\` turn up. That works here too, but ignores that this tree
is sorted.

In a BST, comparing a value to the current node tells you which subtree
it's in, with no searching. Walking down from the root, the first node
where \`p\` and \`q\` go different ways is the split point: the lowest
common ancestor.
    `.trim(),
    solutions: [
      {
        approach: "General Tree Approach — Recursive Search",
        explanation: `
This ignores the BST property and treats the tree as any binary tree. It's
always correct, but not the fastest option here.

At each node, search the left and right subtrees for \`p\` and \`q\`. If
the node is \`p\` or \`q\`, or both children found something, this node is
the split point, so return it. Otherwise pass up whichever side found
something.
        `.trim(),
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function lowestCommonAncestor(root, p, q) {
  if (root === null || root === p || root === q) return root;

  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);

  if (left !== null && right !== null) return root;
  return left !== null ? left : right;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(h) — recursion stack, where h is the tree's height",
      },
      {
        approach: "Optimal — Use BST Ordering",
        explanation: `
A BST tells you where a value belongs from comparisons alone, so you don't
need to search both subtrees.

Start at the root. If both \`p.val\` and \`q.val\` are smaller than the
node's value, move left. If both are larger, move right. As soon as
neither is true (they split, or one equals the node), you're at the lowest
common ancestor.
        `.trim(),
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function lowestCommonAncestor(root, p, q) {
  let node = root;

  while (node !== null) {
    if (p.val < node.val && q.val < node.val) {
      node = node.left;
    } else if (p.val > node.val && q.val > node.val) {
      node = node.right;
    } else {
      return node;
    }
  }

  return null;
}`,
        timeComplexity: "O(h) — one pass down the tree, where h is its height",
        spaceComplexity: "O(1) — iterative, no recursion stack",
        walkthrough: [
          { code: "if (p.val < node.val && q.val < node.val) node = node.left;", explanation: "Both targets are smaller, so the split point is further left." },
          { code: "else if (p.val > node.val && q.val > node.val) node = node.right;", explanation: "Both targets are larger, so move right." },
          { code: "else return node;", explanation: "The targets go different ways (or one matches this node), so this is the split point." },
        ],
      },
    ],
    relatedProblems: ["validate-binary-search-tree", "kth-smallest-element-in-a-bst"],
    keywords: ["lowest common ancestor", "LCA", "binary search tree", "BST"],
  },

  {
    id: "count-good-nodes-in-binary-tree",
    title: "Count Good Nodes in Binary Tree",
    difficulty: "Medium",
    category: "trees",
    description: `
You're given the root of a binary tree. A node is **good** if no node on
the path from the root to it has a greater value. In other words, its
value is at least every value above it on that path. The root is always
good.

Count the good nodes in the tree.
    `.trim(),
    examples: [
      {
        input: "root = [3,1,4,3,null,1,5]",
        output: "4",
        explanation: "The good nodes are the root (3), the 3 under the left 1, the 4, and the 5 — each is at least as large as everything above it on its path.",
      },
      {
        input: "root = [3,3,null,4,2]",
        output: "3",
        explanation: "3 (root), 3 (its child), and 4 are good. 2 is not, because 4 appeared earlier on its path.",
      },
      {
        input: "root = [1]",
        output: "1",
        explanation: "A single node with no ancestors is trivially good.",
      },
    ],
    constraints: [
      "The number of nodes is in the range [1, 10^5].",
      "Each node's value is between -10^4 and 10^4.",
    ],
    hints: [
      "You need the largest value seen so far on the current path. That comes from above, not below.",
      "Carry the running maximum down as you recurse. Compare each node to it before updating it.",
    ],
    approachOverview: `
Whether a node is good depends only on its ancestors, so work top-down.
Walk down from the root, carrying the largest value seen on the current
path. If a node's value is greater than or equal to it, the node is good
and becomes the new maximum for its children.
    `.trim(),
    solutions: [
      {
        approach: "Recursive DFS (Top-Down)",
        explanation: `
Do a depth-first traversal, passing the path's maximum so far into each
call. If a node's value is greater than or equal to it, count the node as
good and pass its value down as the new maximum.
        `.trim(),
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function goodNodes(root) {
  function dfs(node, maxSoFar) {
    if (node === null) return 0;

    let count = 0;
    if (node.val >= maxSoFar) {
      count = 1;
      maxSoFar = node.val;
    }

    return count + dfs(node.left, maxSoFar) + dfs(node.right, maxSoFar);
  }

  return dfs(root, -Infinity);
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(h) — recursion stack, where h is the tree's height",
        walkthrough: [
          { code: "function dfs(node, maxSoFar) {", explanation: "maxSoFar is the largest value on the path from the root to this node (not including it)." },
          { code: "if (node.val >= maxSoFar) { count = 1; maxSoFar = node.val; }", explanation: "The node is good if it's at least everything above it. If so, it raises the bar for its children." },
          { code: "return count + dfs(node.left, maxSoFar) + dfs(node.right, maxSoFar);", explanation: "Adds this node's count to the good nodes in both subtrees." },
        ],
      },
      {
        approach: "Optimal — Iterative BFS",
        explanation: `
The same idea without recursion: use a queue where each entry holds a node
and the maximum on the path to it. This avoids recursion-depth problems on
very deep, skewed trees.
        `.trim(),
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function goodNodes(root) {
  if (root === null) return 0;

  let count = 0;
  const queue = [[root, root.val]];

  while (queue.length > 0) {
    const [node, maxSoFar] = queue.shift();
    if (node.val >= maxSoFar) count++;

    const newMax = Math.max(maxSoFar, node.val);
    if (node.left !== null) queue.push([node.left, newMax]);
    if (node.right !== null) queue.push([node.right, newMax]);
  }

  return count;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) — the queue can hold an entire level's worth of nodes",
      },
    ],
    relatedProblems: ["validate-binary-search-tree", "binary-tree-maximum-path-sum"],
    keywords: ["good nodes", "binary tree", "path maximum", "DFS", "BFS"],
  },

  {
    id: "validate-binary-search-tree",
    title: "Validate Binary Search Tree",
    difficulty: "Medium",
    category: "trees",
    description: `
Given the root of a binary tree, decide whether it's a valid **binary
search tree (BST)**. Each node's value must be strictly greater than
*every* value in its left subtree and strictly less than *every* value in
its right subtree, not just its direct children.
    `.trim(),
    examples: [
      {
        input: "root = [2,1,3]",
        output: "true",
        explanation: "1 < 2 < 3, and the property holds everywhere.",
      },
      {
        input: "root = [10,5,15,null,null,6,20]",
        output: "false",
        explanation: "6 sits in 10's right subtree (as the left child of 15), but 6 is less than 10. Comparing 6 only to its parent 15 would miss this — the whole right subtree must stay greater than 10.",
      },
      {
        input: "root = [5,4,6,null,null,3,7]",
        output: "false",
        explanation: "3 is in 5's right subtree (under 6), but 3 is less than 5.",
      },
    ],
    constraints: [
      "The number of nodes is in the range [1, 10^4].",
      "Node values are in the range [-2^31, 2^31 - 1].",
    ],
    hints: [
      "Comparing each node only to its children isn't enough. A node deep in the left branch could still be larger than an ancestor higher up.",
      "Each node must fall in a range set by its ancestors. What's the root's range? How does it change for the left or right child?",
      "Alternatively: an in-order traversal of a valid BST visits values in strictly increasing order. Is that a shortcut?",
    ],
    approachOverview: `
The common mistake is checking a node only against its children, which
misses violations from higher up. Instead, each node must fall in a
**range** set by its ancestors. A left child must be less than its parent
*and* within the parent's inherited upper bound; right children work the
same way.

Another view: an in-order traversal (left, node, right) of a valid BST
gives strictly increasing values. So checking that the sequence never
stays flat or goes backwards is an equally valid test.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — In-Order Traversal into an Array",
        explanation: `
Collect every value with an in-order traversal (left, node, right). In a
valid BST this sequence is strictly increasing, so check that each value
is bigger than the one before it.
        `.trim(),
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function isValidBST(root) {
  const values = [];

  function inorder(node) {
    if (node === null) return;
    inorder(node.left);
    values.push(node.val);
    inorder(node.right);
  }

  inorder(root);

  for (let i = 1; i < values.length; i++) {
    if (values[i] <= values[i - 1]) return false;
  }
  return true;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) — storing every value in an array",
      },
      {
        approach: "Optimal — Recursive Range Checking",
        explanation: `
Give each node a range \`(lower, upper)\` it must fall strictly inside,
inherited from its ancestors. The root's range is unbounded.

- A left child's upper bound becomes the parent's value.
- A right child's lower bound becomes the parent's value.

If any node falls outside its range, the tree is invalid.
        `.trim(),
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function isValidBST(root) {
  function validate(node, lower, upper) {
    if (node === null) return true;
    if (lower !== null && node.val <= lower) return false;
    if (upper !== null && node.val >= upper) return false;

    return validate(node.left, lower, node.val) && validate(node.right, node.val, upper);
  }

  return validate(root, null, null);
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(h) — recursion stack, where h is the tree's height",
        walkthrough: [
          { code: "function validate(node, lower, upper) {", explanation: "lower and upper are the strict bounds this node must fall inside, inherited from its ancestors." },
          { code: "if (lower !== null && node.val <= lower) return false;", explanation: "The node must be strictly greater than every ancestor whose right subtree it's in." },
          { code: "if (upper !== null && node.val >= upper) return false;", explanation: "It must be strictly less than every ancestor whose left subtree it's in." },
          { code: "validate(node.left, lower, node.val) && validate(node.right, node.val, upper)", explanation: "The left child gets this node's value as its upper bound; the right child gets it as its lower bound." },
        ],
      },
    ],
    relatedProblems: ["lowest-common-ancestor-of-a-binary-search-tree", "kth-smallest-element-in-a-bst"],
    keywords: ["validate BST", "binary search tree", "range check", "in-order traversal"],
  },

  {
    id: "kth-smallest-element-in-a-bst",
    title: "Kth Smallest Element in a BST",
    difficulty: "Medium",
    category: "trees",
    description: `
Given the root of a binary search tree and an integer \`k\`, find the
\`k\`th smallest value in the tree (\`k = 1\` is the smallest).
    `.trim(),
    examples: [
      {
        input: "root = [3,1,4,null,2], k = 1",
        output: "1",
        explanation: "The values in sorted order are 1, 2, 3, 4 — the 1st smallest is 1.",
      },
      {
        input: "root = [5,3,6,2,4,null,null,1], k = 3",
        output: "3",
        explanation: "The values in sorted order are 1, 2, 3, 4, 5, 6 — the 3rd smallest is 3.",
      },
    ],
    constraints: [
      "The number of nodes is in the range [1, 10^4].",
      "1 <= k <= number of nodes.",
    ],
    hints: [
      "An in-order traversal (left, node, right) of a BST visits values in sorted order.",
      "You don't have to visit the whole tree. Stop as soon as you've counted k values.",
    ],
    approachOverview: `
A BST's in-order traversal (left, node, right) gives values in strictly
increasing order. So the \`k\`th smallest value is the \`k\`th value it
produces. The only question is whether you collect everything first or
stop after \`k\` values.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Collect All Values, Then Index",
        explanation: `
Run a full in-order traversal to collect every value in sorted order. The
answer is the value at index \`k - 1\`.
        `.trim(),
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function kthSmallest(root, k) {
  const values = [];

  function inorder(node) {
    if (node === null) return;
    inorder(node.left);
    values.push(node.val);
    inorder(node.right);
  }

  inorder(root);
  return values[k - 1];
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) — storing every value even when k is small",
      },
      {
        approach: "Optimal — Iterative In-Order with Early Stop",
        explanation: `
Do the same in-order traversal with an explicit stack, and stop at the
\`k\`th value instead of visiting the rest of the tree. This matters most
when \`k\` is small compared to the tree.
        `.trim(),
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function kthSmallest(root, k) {
  const stack = [];
  let node = root;

  while (node !== null || stack.length > 0) {
    while (node !== null) {
      stack.push(node);
      node = node.left;
    }

    node = stack.pop();
    k--;
    if (k === 0) return node.val;

    node = node.right;
  }

  return -1;
}`,
        timeComplexity: "O(h + k) — descends to the leftmost node, then advances k times",
        spaceComplexity: "O(h) — the explicit stack, where h is the tree's height",
        walkthrough: [
          { code: "while (node !== null) { stack.push(node); node = node.left; }", explanation: "Pushes every node down the left spine. The smallest unvisited value is then on top of the stack." },
          { code: "node = stack.pop(); k--;", explanation: "Each pop visits the next value in sorted order and counts down k." },
          { code: "if (k === 0) return node.val;", explanation: "When k reaches zero, this node is the k-th smallest. Return without visiting the rest of the tree." },
        ],
      },
    ],
    relatedProblems: ["validate-binary-search-tree", "lowest-common-ancestor-of-a-binary-search-tree"],
    keywords: ["kth smallest", "binary search tree", "in-order traversal", "BST"],
  },

  {
    id: "construct-binary-tree-from-preorder-and-inorder-traversal",
    title: "Construct Binary Tree from Preorder and Inorder Traversal",
    difficulty: "Medium",
    category: "trees",
    description: `
You're given two traversals of the same binary tree: \`preorder\` (node,
left, right) and \`inorder\` (left, node, right). All values are unique.

Rebuild the tree and return its root.
    `.trim(),
    examples: [
      {
        input: "preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]",
        output: "[3,9,20,null,null,15,7]",
        explanation: "Preorder always starts with the root, so 3 is the root. In inorder, everything left of 3 (just [9]) is the left subtree, and everything right of it ([15,20,7]) is the right subtree.",
      },
      {
        input: "preorder = [-1], inorder = [-1]",
        output: "[-1]",
        explanation: "A single-node tree.",
      },
    ],
    constraints: [
      "1 <= preorder.length <= 3000",
      "inorder.length == preorder.length",
      "All values in preorder and inorder are unique, and every value in inorder also appears in preorder.",
    ],
    hints: [
      "Preorder visits the root first, so preorder[0] is the root's value.",
      "Find the root in inorder. Everything to its left is the left subtree; everything to its right is the right subtree.",
      "Recursing this way rebuilds the tree one root at a time. Can you avoid searching inorder from scratch on every call?",
    ],
    approachOverview: `
Preorder's first element is the current subtree's root. Find it in
inorder: everything left of it is the left subtree, and everything right
of it is the right subtree. Recurse on both pieces to rebuild the tree.

The direct version searches inorder and copies sub-arrays on every call,
which adds up. The optimized version precomputes each value's position
in inorder and tracks subtree boundaries with indices instead of copies.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Search and Slice",
        explanation: `
Take the first preorder element as the root, find it in inorder with
\`indexOf\`, and slice both arrays into left and right parts for the
recursive calls. Simple, but the repeated searching and copying adds real
overhead.
        `.trim(),
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function buildTree(preorder, inorder) {
  if (preorder.length === 0) return null;

  const rootVal = preorder[0];
  const root = new TreeNode(rootVal);

  const mid = inorder.indexOf(rootVal);
  root.left = buildTree(preorder.slice(1, mid + 1), inorder.slice(0, mid));
  root.right = buildTree(preorder.slice(mid + 1), inorder.slice(mid + 1));

  return root;
}`,
        timeComplexity: "O(n^2) — indexOf and slice each cost O(n), across O(n) calls",
        spaceComplexity: "O(n^2) — repeated array copies from slicing",
      },
      {
        approach: "Optimal — Index Map with Boundary Pointers",
        explanation: `
First, map each value to its index in \`inorder\`, so finding the split is
instant instead of a linear search.

Instead of slicing, track the current subtree with a range of indices
into \`inorder\`, plus one shared pointer into \`preorder\` for the next
root. Preorder never needs slicing, because its values are used strictly
in order as you recurse.
        `.trim(),
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function buildTree(preorder, inorder) {
  const indexOfInorder = new Map();
  inorder.forEach((val, idx) => indexOfInorder.set(val, idx));

  let preorderIndex = 0;

  function build(inorderLeft, inorderRight) {
    if (inorderLeft > inorderRight) return null;

    const rootVal = preorder[preorderIndex];
    preorderIndex++;

    const root = new TreeNode(rootVal);
    const mid = indexOfInorder.get(rootVal);

    root.left = build(inorderLeft, mid - 1);
    root.right = build(mid + 1, inorderRight);
    return root;
  }

  return build(0, inorder.length - 1);
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) — the index map, plus O(h) recursion stack",
        walkthrough: [
          { code: "inorder.forEach((val, idx) => indexOfInorder.set(val, idx));", explanation: "Precomputes each value's position in inorder, so the split point is one lookup." },
          { code: "const rootVal = preorder[preorderIndex]; preorderIndex++;", explanation: "Preorder values are used left to right as subtrees are built, so one shared pointer tracks the next root across all calls." },
          { code: "root.left = build(inorderLeft, mid - 1); root.right = build(mid + 1, inorderRight);", explanation: "Indexes left of the root's inorder position form the left subtree; indexes right of it form the right subtree." },
        ],
      },
    ],
    relatedProblems: ["serialize-and-deserialize-binary-tree"],
    keywords: ["construct binary tree", "preorder", "inorder", "traversal reconstruction"],
  },

  {
    id: "binary-tree-maximum-path-sum",
    title: "Binary Tree Maximum Path Sum",
    difficulty: "Hard",
    category: "trees",
    description: `
You're given the root of a binary tree; node values can be negative. A
**path** is a sequence of nodes connected by edges, with no node used
twice. It can start and end anywhere and does **not** have to pass
through the root.

Find the maximum sum of values along any path.
    `.trim(),
    examples: [
      {
        input: "root = [1,2,3]",
        output: "6",
        explanation: "The path 2 -> 1 -> 3 uses every node and sums to 6, which is the best available.",
      },
      {
        input: "root = [-10,9,20,null,null,15,7]",
        output: "42",
        explanation: "The best path is 15 -> 20 -> 7, entirely within the right side of the tree, summing to 42. It doesn't touch the root at all, since -10 would only drag the sum down.",
      },
    ],
    constraints: [
      "The number of nodes is in the range [1, 3 * 10^4].",
      "Node values are in the range [-1000, 1000].",
    ],
    hints: [
      "A path 'bends' at one node, its highest point, and goes down into at most one child on each side.",
      "What's the most a node can contribute if the path only continues down through it into one child (not both)?",
      "If a subtree's best downward sum is negative, leave that branch out and treat it as 0.",
    ],
    approachOverview: `
Every path has one highest point, where it stops going up one side and
starts down the other. (A path that goes straight down is the same idea,
with one side adding nothing.)

The best path through a highest point is its value plus the best
downward-only sum from each child, counting a side as 0 if it would only
hurt.

The tricky part: a node can pass only *one* of those downward sums up to
its parent, since a path can't branch two ways and still continue up.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recompute Downward Sums at Every Node",
        explanation: `
A helper \`maxDownward(node)\` returns the best sum starting at \`node\` and
going straight down through one child, clamped to 0 (you can always skip
a branch that would only subtract).

Treat every node as the path's highest point: its value plus
\`maxDownward\` of each child. Take the best over all nodes. This is
correct, but \`maxDownward\` is recomputed from scratch each time, redoing
a lot of work.
        `.trim(),
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function maxPathSum(root) {
  function maxDownward(node) {
    if (node === null) return 0;
    return Math.max(0, node.val + Math.max(maxDownward(node.left), maxDownward(node.right)));
  }

  function maxThroughNode(node) {
    if (node === null) return -Infinity;
    const throughThisNode = node.val + maxDownward(node.left) + maxDownward(node.right);
    return Math.max(throughThisNode, maxThroughNode(node.left), maxThroughNode(node.right));
  }

  return maxThroughNode(root);
}`,
        timeComplexity: "O(n^2) — maxDownward re-walks a subtree from every node above it",
        spaceComplexity: "O(h) — recursion stack, where h is the tree's height",
      },
      {
        approach: "Optimal — Single Pass with a Running Global Maximum",
        explanation: `
Do one post-order traversal (children before parent). The function
returns the best *downward-only* sum through a node, which is what a
parent needs to extend a path upward.

Along the way, at each node it also checks the best "bend here" path
(value plus both children's downward sums) and updates one shared
maximum. That maximum is only read at the end, so each node is computed
exactly once.
        `.trim(),
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function maxPathSum(root) {
  let maxSum = -Infinity;

  function maxDownward(node) {
    if (node === null) return 0;

    const leftGain = Math.max(0, maxDownward(node.left));
    const rightGain = Math.max(0, maxDownward(node.right));

    maxSum = Math.max(maxSum, node.val + leftGain + rightGain);

    return node.val + Math.max(leftGain, rightGain);
  }

  maxDownward(root);
  return maxSum;
}`,
        timeComplexity: "O(n) — every node is visited exactly once",
        spaceComplexity: "O(h) — recursion stack, where h is the tree's height",
        walkthrough: [
          { code: "const leftGain = Math.max(0, maxDownward(node.left));", explanation: "The best gain from going down into the left child, clamped to 0 because a negative branch is better left out." },
          { code: "maxSum = Math.max(maxSum, node.val + leftGain + rightGain);", explanation: "Treats this node as the path's bend point, using both children, and updates the shared answer if it's the best so far." },
          { code: "return node.val + Math.max(leftGain, rightGain);", explanation: "Only one side can be passed up to the parent, since a path can't branch two ways and keep going." },
        ],
      },
    ],
    relatedProblems: ["count-good-nodes-in-binary-tree"],
    keywords: ["maximum path sum", "binary tree", "post-order traversal", "DFS"],
  },

  {
    id: "serialize-and-deserialize-binary-tree",
    title: "Serialize and Deserialize Binary Tree",
    difficulty: "Hard",
    category: "trees",
    description: `
Design a way to turn a binary tree into a string (**serialize**) and to
rebuild the exact same tree from it (**deserialize**). The round trip must
keep the tree's shape, not just its values, so you need to encode where
the \`null\` children are.

Any string format works, as long as \`deserialize(serialize(root))\`
always gives an equivalent tree.
    `.trim(),
    examples: [
      {
        input: "root = [1,2,3,null,null,4,5]",
        output: "deserialize(serialize(root)) reproduces [1,2,3,null,null,4,5]",
        explanation: "The exact string format is up to you — what matters is that the shape and values survive the round trip.",
      },
      {
        input: "root = []",
        output: "deserialize(serialize(root)) reproduces []",
        explanation: "An empty tree must round-trip to an empty tree too.",
      },
    ],
    constraints: [
      "The number of nodes is in the range [0, 10^4].",
      "Node values are in the range [-1000, 1000].",
    ],
    hints: [
      "Recording only non-null values loses the shape: [1,2] and [1,null,2] would look the same. You need markers for missing children.",
      "A traversal that writes a marker for every null child can be replayed step by step to rebuild the same structure.",
      "Preorder (node, left, right) works well because the next unread value always tells you what to build next.",
    ],
    approachOverview: `
The key trick is writing \`null\` children as real entries instead of
leaving them out. That's what makes the shape recoverable.

Two traversals work: level-order (BFS) or preorder (DFS), each recording
empty child slots. Deserialize replays the same order to rebuild the
structure one node (or empty slot) at a time.
    `.trim(),
    solutions: [
      {
        approach: "Level-Order (BFS) with Null Markers",
        explanation: `
Serialize with a breadth-first walk using a queue. For each dequeued node,
record its value (or \`"null"\` for an empty slot). If it isn't empty,
enqueue both children (which may be \`null\`).

Deserialize in reverse: the first value is the root. Read the rest in
order, using a queue of nodes still waiting for their two children to
know where each value goes.
        `.trim(),
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function serialize(root) {
  if (root === null) return "null";

  const values = [];
  const queue = [root];

  while (queue.length > 0) {
    const node = queue.shift();
    if (node === null) {
      values.push("null");
    } else {
      values.push(String(node.val));
      queue.push(node.left);
      queue.push(node.right);
    }
  }

  return values.join(",");
}

function deserialize(data) {
  const values = data.split(",");
  if (values[0] === "null") return null;

  const root = new TreeNode(Number(values[0]));
  const queue = [root];
  let index = 1;

  while (queue.length > 0) {
    const node = queue.shift();

    const leftVal = values[index++];
    if (leftVal !== "null") {
      node.left = new TreeNode(Number(leftVal));
      queue.push(node.left);
    }

    const rightVal = values[index++];
    if (rightVal !== "null") {
      node.right = new TreeNode(Number(rightVal));
      queue.push(node.right);
    }
  }

  return root;
}`,
        timeComplexity: "O(n) for both serialize and deserialize",
        spaceComplexity: "O(n) — the output string and the queue",
      },
      {
        approach: "Preorder (DFS) with Null Markers",
        explanation: `
Serialize with a preorder traversal (node, then left, then right),
writing \`"null"\` for each missing child. Because *every* missing child
gets a marker, the sequence describes the shape exactly.

Deserialize by reading the sequence in order with one shared pointer. The
next token is either \`"null"\` (empty subtree) or a value: build a node,
then read its left subtree, then its right.

This is just as efficient as BFS, and some find it more direct, since
serialize and deserialize mirror each other line for line.
        `.trim(),
        code: `class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function serialize(root) {
  const values = [];

  function dfs(node) {
    if (node === null) {
      values.push("null");
      return;
    }
    values.push(String(node.val));
    dfs(node.left);
    dfs(node.right);
  }

  dfs(root);
  return values.join(",");
}

function deserialize(data) {
  const values = data.split(",");
  let index = 0;

  function dfs() {
    const val = values[index];
    index++;
    if (val === "null") return null;

    const node = new TreeNode(Number(val));
    node.left = dfs();
    node.right = dfs();
    return node;
  }

  return dfs();
}`,
        timeComplexity: "O(n) for both serialize and deserialize",
        spaceComplexity: "O(n) — the output string, plus O(h) recursion stack",
        walkthrough: [
          { code: "if (node === null) { values.push(\"null\"); return; }", explanation: "Each missing child gets a marker, so deserialize knows exactly where each branch ends." },
          { code: "const val = values[index]; index++;", explanation: "One shared pointer reads the tokens in the order serialize wrote them, so each call reads exactly its subtree's tokens." },
          { code: "node.left = dfs(); node.right = dfs();", explanation: "In preorder, the left subtree's tokens come next, then the right's. Recursing in this order rebuilds the same shape." },
        ],
      },
    ],
    relatedProblems: ["construct-binary-tree-from-preorder-and-inorder-traversal"],
    keywords: ["serialize", "deserialize", "binary tree", "preorder", "level order", "BFS", "DFS"],
  },
];
