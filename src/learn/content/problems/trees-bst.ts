import type { Problem } from "../../types/problem";

export const treesBstProblems: Problem[] = [
  {
    id: "lowest-common-ancestor-of-a-binary-search-tree",
    title: "Lowest Common Ancestor of a Binary Search Tree",
    difficulty: "Medium",
    category: "trees",
    description: `
You're given the root of a **binary search tree** (a tree where, at every
node, everything in the left subtree is smaller and everything in the right
subtree is larger), along with two nodes \`p\` and \`q\` that are guaranteed to
already exist somewhere in the tree.

Find their **lowest common ancestor** — the deepest node in the tree that has
both \`p\` and \`q\` as descendants. A node counts as a descendant of itself, so
if \`p\` happens to be an ancestor of \`q\`, then \`p\` itself is the answer.
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
      "In a general binary tree you'd have to search both subtrees blindly. What extra information does the BST ordering give you for free?",
      "At any node, compare both values to the node's value. If both are smaller, the answer must be in the left subtree. If both are larger, it must be in the right subtree.",
      "If the two values fall on different sides (or one equals the current node), you've found the split point — that node is the answer.",
    ],
    approachOverview: `
A solution that works on *any* binary tree has to recursively search the left
and right subtrees and see where \`p\` and \`q\` each turn up. That works here
too, but it ignores something powerful: this tree is sorted.

Because it's a BST, you can tell which subtree a value lives in just by
comparing it to the current node — no searching required. Walking down from
the root, the first node where \`p\` and \`q\` stop agreeing on "which side" is
exactly the split point, and therefore the lowest common ancestor.
    `.trim(),
    solutions: [
      {
        approach: "General Tree Approach — Recursive Search",
        explanation: `
This approach ignores the BST property entirely and treats the tree as an
arbitrary binary tree, which makes it correct everywhere but not the fastest
option available here.

At each node, recurse into the left and right subtrees looking for \`p\` and
\`q\`. If a node itself is \`p\` or \`q\`, or if the search comes back
"found something" from both children, then this node is the split point —
return it upward. Otherwise pass along whichever side actually found
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
Instead of searching both subtrees, use the fact that a BST tells you exactly
where a value belongs just from comparisons.

Start at the root. If both \`p.val\` and \`q.val\` are smaller than the
current node's value, the split point must be somewhere in the left
subtree, so move left. If both are larger, move right. The moment that's no
longer true — one value is smaller and the other isn't, or one of them
equals the current node — you're standing on the lowest common ancestor.
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
          { code: "if (p.val < node.val && q.val < node.val) node = node.left;", explanation: "Both targets are smaller than this node, so the split point (if any) is further left." },
          { code: "else if (p.val > node.val && q.val > node.val) node = node.right;", explanation: "Both targets are larger, so move right instead." },
          { code: "else return node;", explanation: "The targets disagree on direction (or one matches this node exactly) — this is the split point." },
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
You're given the root of a binary tree. A node is called **good** if, when
you look at the path from the root down to that node, no node along the way
has a value greater than the node itself. In other words, the node's value
must be greater than or equal to every value that came before it on the way
down (its own value counts, so the root is always good).

Count how many good nodes are in the tree.
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
      "You need to know the largest value seen so far on the current path — that's information from above, not below.",
      "Carry the running maximum down as you recurse, and compare each node against it before updating it.",
    ],
    approachOverview: `
This is a top-down problem: whether a node is good depends only on its
ancestors, not on anything below it. So as you walk down from the root,
carry along the maximum value seen so far on the current path. At each node,
compare its value to that running maximum — if it's greater than or equal,
it's good, and it also becomes the new running maximum for its children.
    `.trim(),
    solutions: [
      {
        approach: "Recursive DFS (Top-Down)",
        explanation: `
Do a depth-first traversal, passing the maximum value seen so far on the
path down to each recursive call. At each node, check if its value is
greater than or equal to that maximum — if so, count it as good, and use
its value as the new maximum for the children below it.
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
          { code: "function dfs(node, maxSoFar) {", explanation: "maxSoFar carries the largest value seen on the path from the root down to (but not including) this node." },
          { code: "if (node.val >= maxSoFar) { count = 1; maxSoFar = node.val; }", explanation: "This node is good if it beats everything above it — and if so, it raises the bar for its own children." },
          { code: "return count + dfs(node.left, maxSoFar) + dfs(node.right, maxSoFar);", explanation: "Add up good nodes found in this node plus both subtrees." },
        ],
      },
      {
        approach: "Optimal — Iterative BFS",
        explanation: `
The same idea works without recursion by using an explicit queue, where each
queue entry carries a node along with the running maximum for the path that
led to it. This avoids recursion-depth concerns on very deep, skewed trees.
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
You're given the root of a binary tree. Determine whether it's a valid
**binary search tree (BST)**: every node's value must be strictly greater
than *every* value in its left subtree and strictly less than *every* value
in its right subtree — not just its immediate children, but the entire
subtree beneath it.
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
      "Comparing each node only to its direct children isn't enough — a node far down the left branch could still be too large compared to some ancestor further up.",
      "Every node actually lives inside a valid range, set by its ancestors. What's the allowed range for the root? How does that range change as you move into the left or right child?",
      "Alternatively: an in-order traversal of a valid BST always visits values in strictly increasing order. Does that give you a shortcut?",
    ],
    approachOverview: `
The key mistake is checking a node only against its immediate children —
that misses violations that come from further up the tree. Instead, each
node must fall within a valid **range** determined by its ancestors: a left
child must be less than its parent *and* still within whatever upper bound
the parent inherited, and similarly for right children.

A different way to see the same idea: an in-order traversal (left, node,
right) of a valid BST visits values in strictly increasing order. So
checking that the in-order sequence never goes flat or backwards is an
equally valid test.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — In-Order Traversal into an Array",
        explanation: `
Collect every value via an in-order traversal (left, node, right). If the
tree really is a valid BST, this sequence must come out strictly
increasing. So after collecting it, just walk through and confirm each
value is bigger than the one before it.
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
Give every node a valid range \`(lower, upper)\` it must fall strictly
inside, inherited from its ancestors. The root's range is unbounded. When
you move into a left child, that child's upper bound tightens to the
parent's value (it must stay less than the parent). When you move into a
right child, its lower bound tightens to the parent's value instead. If any
node ever falls outside its inherited range, the tree is invalid.
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
          { code: "if (lower !== null && node.val <= lower) return false;", explanation: "This node must be strictly greater than every ancestor whose left subtree it's part of." },
          { code: "if (upper !== null && node.val >= upper) return false;", explanation: "It must also be strictly less than every ancestor whose right subtree it's part of." },
          { code: "validate(node.left, lower, node.val) && validate(node.right, node.val, upper)", explanation: "The left child inherits a tighter upper bound (this node's value); the right child inherits a tighter lower bound." },
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
You're given the root of a binary search tree and an integer \`k\`. Find the
\`k\`th smallest value stored in the tree (with \`k = 1\` meaning the very
smallest value).
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
      "An in-order traversal (left, node, right) of a BST visits every value in sorted order for free.",
      "You don't have to visit the whole tree — once you've counted off k values during the traversal, you can stop immediately.",
    ],
    approachOverview: `
The defining fact about a BST is that its in-order traversal (left, then
node, then right) produces values in strictly increasing order. So the
\`k\`th smallest value is simply the \`k\`th value produced by that
traversal — the only question is whether you collect everything first or
stop as soon as you've counted \`k\` values.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Collect All Values, Then Index",
        explanation: `
Run a full in-order traversal, collecting every value into an array in
sorted order. Once that's done, the answer is simply the value at index
\`k - 1\`.
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
Do the same in-order traversal, but iteratively with an explicit stack, and
stop the instant you've produced the \`k\`th value instead of visiting the
rest of the tree. This matters a lot when \`k\` is small relative to the
size of the tree.
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
          { code: "while (node !== null) { stack.push(node); node = node.left; }", explanation: "Push every node down the left spine — the smallest unvisited value is always at the top of the stack once this stops." },
          { code: "node = stack.pop(); k--;", explanation: "Popping visits the next value in sorted order. Each pop counts down toward k." },
          { code: "if (k === 0) return node.val;", explanation: "As soon as k reaches zero, this popped node is the k-th smallest — return immediately without visiting the rest of the tree." },
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
You're given two arrays describing the same binary tree: \`preorder\`, the
sequence of values visited by a preorder traversal (node, then left, then
right), and \`inorder\`, the sequence visited by an in-order traversal (left,
then node, then right). All values in the tree are unique.

Rebuild the original tree and return its root.
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
      "Preorder always visits the root first. So preorder[0] tells you the root's value immediately.",
      "Once you know the root's value, find it inside inorder — everything to its left in that array belongs to the left subtree, and everything to its right belongs to the right subtree.",
      "Recursing this way rebuilds the tree one root at a time. Can you avoid re-searching inorder from scratch on every call?",
    ],
    approachOverview: `
Preorder's first element is always the current subtree's root. Once you know
the root's value, look it up in the inorder array: everything to its left
in that array is the entire left subtree (in inorder order), and everything
to its right is the entire right subtree. Recursing on those two pieces
rebuilds the tree.

The direct version of this re-searches the inorder array and copies
sub-arrays on every call, which adds up. The optimized version precomputes
where every value sits in inorder, and tracks subtree boundaries with plain
indices instead of copying arrays.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Search and Slice",
        explanation: `
At each recursive call, take the first element of the current preorder
slice as the root, use \`indexOf\` to find that value's position in the
current inorder slice, and slice both arrays into "left part" and "right
part" for the recursive calls. Simple to follow, but repeatedly searching
and copying arrays adds real overhead.
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
First, build a map from value to its index in \`inorder\`, so finding the
root's split point is instant instead of a linear search. Then, instead of
slicing arrays, track the current subtree using just a range of indices
into \`inorder\`, and a single shared pointer into \`preorder\` that always
points at the next root to place (preorder never needs to be re-sliced,
since its values are consumed strictly in order as you recurse).
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
          { code: "inorder.forEach((val, idx) => indexOfInorder.set(val, idx));", explanation: "Precompute every value's position in inorder so the split point is a single lookup instead of a search." },
          { code: "const rootVal = preorder[preorderIndex]; preorderIndex++;", explanation: "Preorder values are consumed strictly left to right as subtrees are built, so a single shared pointer tracks 'the next root' across all recursive calls." },
          { code: "root.left = build(inorderLeft, mid - 1); root.right = build(mid + 1, inorderRight);", explanation: "Everything left of the root's inorder position is the left subtree's index range; everything right of it is the right subtree's." },
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
You're given the root of a binary tree, where node values can be negative.
A **path** is any sequence of nodes connected by edges where no node
appears more than once — it can start and end at any two nodes, and
crucially, it does **not** have to pass through the root at all.

Find the maximum possible sum of values along any path in the tree.
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
      "A path can 'bend' at exactly one node — the highest point it reaches — and go straight down into at most one child on each side from there.",
      "For any node, what's the most it can contribute if a path is only allowed to continue downward through it into one of its children (not both)?",
      "If a subtree's best downward contribution would be negative, it's better to leave that branch out of the path entirely — treat it as contributing 0.",
    ],
    approachOverview: `
Every possible path has exactly one highest point — the node where it stops
going up one side and starts going down the other (a path can also just go
straight down one side, which is the same idea with one side contributing
nothing).

For a candidate "highest point," the best path through it is: its own value,
plus the best downward-only sum from its left child, plus the best
downward-only sum from its right child (treating either side as 0 if going
into it would only hurt). The tricky part is that a node can only pass
*one* of those two downward sums up to its own parent, since a path can't
branch in two directions and still continue upward.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Recompute Downward Sums at Every Node",
        explanation: `
Write a helper \`maxDownward(node)\` that returns the best sum you can get
starting at \`node\` and going straight down through one child (clamped to
0, since it's always fine to skip a branch that would only subtract).

Then, for every node in the tree, treat it as the path's highest point:
its value plus \`maxDownward\` of its left child plus \`maxDownward\` of its
right child. Take the best value found over every node. This is correct,
but \`maxDownward\` gets recomputed from scratch for every node it's called
on, redoing a lot of work.
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
Do a single post-order traversal (children before parent). The recursive
function returns the best *downward-only* sum through a node — exactly what
a parent needs to extend a path upward. But while computing that, at every
node it also checks the best "bend here" path (value + both children's
downward sums) and updates one shared running maximum. That running maximum
is never returned to the caller — it only gets read at the very end — so
every node's contribution is computed exactly once.
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
          { code: "const leftGain = Math.max(0, maxDownward(node.left));", explanation: "The best a path can gain by dipping into the left child and continuing straight down — clamped to 0, since a negative branch is better left out entirely." },
          { code: "maxSum = Math.max(maxSum, node.val + leftGain + rightGain);", explanation: "Treats this node as the path's 'bend point', using both children at once, and updates the one shared answer if it's the best seen so far." },
          { code: "return node.val + Math.max(leftGain, rightGain);", explanation: "But only one side can be handed up to this node's own parent, since a path can't branch in two directions and keep going." },
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
Design a way to convert a binary tree into a single string (**serialize**),
and a matching way to rebuild the exact same tree structure and values back
from that string (**deserialize**). "Exact same" means the round trip has to
preserve the shape of the tree too, not just the set of values — so you
need some way to encode where the \`null\` children are, not just the
non-null ones.

There's no single required string format — any encoding works, as long as
\`deserialize(serialize(root))\` always reproduces an equivalent tree.
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
      "If you only record non-null values, you lose the shape of the tree — [1,2] and [1,null,2] would look identical. You need explicit markers for missing children.",
      "A traversal that records a marker for every null child (not just skipping them) can be replayed step by step to rebuild the same structure unambiguously.",
      "Preorder (node, then left, then right) works well for this because the very next unread value always tells you what to build next.",
    ],
    approachOverview: `
The core trick is encoding \`null\` children explicitly, as real entries in
the output, rather than just omitting them — that's what makes the shape of
the tree recoverable, not just its values.

Two traversal orders both work well for this: a level-order (BFS) traversal
that records a child slot even when it's empty, or a preorder (DFS)
traversal that does the same. Either one can be replayed in the same order
during deserialization to rebuild the identical structure, one node (or
"empty slot") at a time.
    `.trim(),
    solutions: [
      {
        approach: "Level-Order (BFS) with Null Markers",
        explanation: `
Serialize by doing a breadth-first walk with a queue: for every node
dequeued, record its value (or \`"null"\` if the slot is empty), and if it
wasn't empty, enqueue its two children (which may themselves be \`null\`).

Deserialize by reversing the process: read the first value as the root,
then walk through the rest of the string in order, using a queue of "nodes
still waiting for their two children" to know where each subsequent value
belongs.
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
Serialize with a preorder traversal (visit the node itself first, then
recurse left, then right), writing \`"null"\` whenever a child is missing.
Because null markers are written for *every* missing child, the resulting
sequence unambiguously describes the tree's shape.

Deserialize by reading that same sequence back in order with a single
shared position pointer: the next token is always either \`"null"\` (this
subtree is empty) or a value (build a node, then recursively read its left
subtree, then its right subtree from the tokens that follow). This is
equally efficient, and some find it a little more direct to reason about
than the BFS version, since serialize and deserialize mirror each other
line for line.
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
          { code: "if (node === null) { values.push(\"null\"); return; }", explanation: "Every missing child gets an explicit marker, not just a gap — this is what lets deserialize know exactly where each branch ends." },
          { code: "const val = values[index]; index++;", explanation: "A single shared pointer advances through the tokens in the same order serialize wrote them, so each call reads exactly the tokens meant for its subtree." },
          { code: "node.left = dfs(); node.right = dfs();", explanation: "Preorder means the left subtree's entire token sequence comes immediately next, followed by the right subtree's — recursing in this order rebuilds the same shape." },
        ],
      },
    ],
    relatedProblems: ["construct-binary-tree-from-preorder-and-inorder-traversal"],
    keywords: ["serialize", "deserialize", "binary tree", "preorder", "level order", "BFS", "DFS"],
  },
];
