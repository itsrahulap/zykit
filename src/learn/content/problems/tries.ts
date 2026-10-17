import type { Problem } from "../../types/problem";

export const triesProblems: Problem[] = [
  {
    id: "implement-trie",
    title: "Implement Trie (Prefix Tree)",
    difficulty: "Medium",
    category: "tries",
    description: `
Design a data structure that stores words and quickly answers two questions:
"is this *exact* word stored?" and "does *any* stored word start with this prefix?"

Build a class with three operations:

- \`insert(word)\` - adds a word to the structure.
- \`search(word)\` - returns true only if that exact word was previously inserted.
- \`startsWith(prefix)\` - returns true if any inserted word begins with that prefix (the prefix itself doesn't need to have been inserted as a whole word).
    `.trim(),
    examples: [
      {
        input: 'insert("apple"); search("apple"); search("app"); startsWith("app"); insert("app"); search("app")',
        output: "undefined, true, false, true, undefined, true",
        explanation: '"apple" is inserted, so search("apple") is true. search("app") is false because "app" was never inserted on its own - but startsWith("app") is true because "apple" starts with "app". After inserting "app" directly, search("app") becomes true too.',
      },
      {
        input: 'insert("cat"); search("car"); startsWith("ca")',
        output: "undefined, false, true",
        explanation: '"car" was never inserted, so search returns false, even though "cat" shares the prefix "ca".',
      },
    ],
    constraints: [
      "1 <= word.length, prefix.length <= 2000",
      "word and prefix consist only of lowercase English letters",
      "At most 3 * 10^4 calls total to insert, search, and startsWith",
    ],
    hints: [
      "A hash set of full words can answer search() but not startsWith() efficiently - you'd have to check every stored word.",
      "What if each node in a tree represented one letter, and a path from the root spelled out a prefix?",
      "Each node needs a way to reach its children by letter, plus a flag marking 'a complete word ends exactly here'.",
    ],
    approachOverview: `
Many words share prefixes ("app" and "apple" both start with "a" -> "p" -> "p").
A **trie** (prefix tree) uses this: each letter position gets its own node,
shared by every word that matches up to that point. Each node links to its
next letters (its children) and has a flag for "a word ends here."

- \`insert\` walks the word letter by letter, creating missing nodes, and flags the last one.
- \`search\` walks the same way, fails if a letter is missing, and needs the last node's flag set.
- \`startsWith\` is the same as \`search\` but skips the flag check - the path just has to exist.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Array of Words",
        explanation: "Keep every word in a plain array. search() looks for an exact match; startsWith() checks if any word begins with the prefix. Simple, but every lookup scans the whole array.",
        code: `class Trie {
  constructor() {
    this.words = [];
  }

  insert(word) {
    this.words.push(word);
  }

  search(word) {
    return this.words.includes(word);
  }

  startsWith(prefix) {
    return this.words.some((w) => w.startsWith(prefix));
  }
}`,
        timeComplexity: "O(L) for insert, O(n * L) for search/startsWith, where n is the number of stored words and L is average word length",
        spaceComplexity: "O(n * L) to store all the words",
      },
      {
        approach: "Optimal - Trie Node Tree",
        explanation: "Build a tree of letters. Each node maps letters to child nodes and has a flag for whether a word ends there. All three operations walk down the tree one letter at a time.",
        code: `class TrieNode {
  constructor() {
    this.children = new Map();
    this.isWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) {
        node.children.set(ch, new TrieNode());
      }
      node = node.children.get(ch);
    }
    node.isWord = true;
  }

  // Walks the given string letter by letter; returns the node at the end
  // of the path, or null if the path doesn't fully exist.
  _walk(str) {
    let node = this.root;
    for (const ch of str) {
      if (!node.children.has(ch)) return null;
      node = node.children.get(ch);
    }
    return node;
  }

  search(word) {
    const node = this._walk(word);
    return node !== null && node.isWord;
  }

  startsWith(prefix) {
    return this._walk(prefix) !== null;
  }
}`,
        timeComplexity: "O(L) for every operation, where L is the length of the word/prefix involved",
        spaceComplexity: "O(N) total across all nodes, where N is the total number of letters inserted (shared prefixes reuse nodes)",
        walkthrough: [
          { code: "this.children = new Map();\n  this.isWord = false;", explanation: "Each node tracks its possible next letters and whether a word ends exactly here." },
          { code: "if (!node.children.has(ch)) {\n        node.children.set(ch, new TrieNode());\n      }", explanation: "Creates a child node for a letter only the first time it's needed - shared prefixes reuse existing nodes." },
          { code: "node.isWord = true;", explanation: "Flags the word's last letter so search() can tell the word 'app' apart from 'app' as a prefix of 'apple'." },
          { code: "_walk(str) { ... }", explanation: "Shared by search and startsWith: follow the letters down the tree and stop early if a child is missing." },
          { code: "return node !== null && node.isWord;", explanation: "search() also needs the walk to end on a flagged node, not just any valid path." },
        ],
      },
    ],
    relatedProblems: ["design-add-and-search-words", "word-search-ii"],
    keywords: ["trie", "prefix tree", "design", "startsWith", "insert search"],
  },
  {
    id: "design-add-and-search-words",
    title: "Design Add and Search Words Data Structure",
    difficulty: "Medium",
    category: "tries",
    description: `
Design a data structure that stores and searches words. The twist: a search
query may contain \`.\` characters, and each \`.\` matches *any single letter*.

Build a class with two operations:

- \`addWord(word)\` - adds a word to the structure.
- \`search(word)\` - returns true if a stored word matches the query, with each \`.\` standing in for any one letter. Only stored words of the *same length* can match.
    `.trim(),
    examples: [
      {
        input: 'addWord("bad"); addWord("dad"); addWord("mad"); search("pad"); search("bad"); search(".ad"); search("b..")',
        output: "false, true, true, true",
        explanation: '"pad" was never added, so it fails. "bad" matches exactly. ".ad" matches "bad", "dad", or "mad" since "." covers the first letter. "b.." matches "bad" - "." covers the 2nd and 3rd letters.',
      },
      {
        input: 'addWord("a"); search(".")',
        output: "true",
        explanation: 'A single "." matches any single-letter word, including "a".',
      },
    ],
    constraints: [
      "1 <= word.length <= 25",
      "word in addWord consists of lowercase English letters",
      "word in search consists of lowercase English letters and/or '.'",
      "At most 2 * 10^4 calls total to addWord and search",
    ],
    hints: [
      "This is almost a plain trie - the only new part is the wildcard in search.",
      "When you hit a '.' while walking the trie, you don't know which child to follow - so try all of them.",
      "Trying all children is naturally recursive (backtracking): if any child's path leads to a full match, the search succeeds.",
    ],
    approachOverview: `
Store words in a trie, just like the plain prefix-tree problem: each node
has children keyed by letter and a word-ending flag.

Only \`search\` changes. A regular letter follows exactly one child, but a
\`.\` tries every child and succeeds if *any* of them matches the rest of the
query. This is a small backtracking search on top of the trie, so \`search\`
becomes a recursive helper that takes the current node and the position in
the query.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Array of Words",
        explanation: "Keep every word in a plain array. To search, compare the query with every stored word of the same length, treating '.' as matching any letter.",
        code: `class WordDictionary {
  constructor() {
    this.words = [];
  }

  addWord(word) {
    this.words.push(word);
  }

  search(word) {
    for (const stored of this.words) {
      if (stored.length !== word.length) continue;
      let matches = true;
      for (let i = 0; i < word.length; i++) {
        if (word[i] !== "." && word[i] !== stored[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
    return false;
  }
}`,
        timeComplexity: "O(1) for addWord; O(n * L) for search, where n is stored word count and L is word length",
        spaceComplexity: "O(n * L) to store all words",
      },
      {
        approach: "Optimal - Trie with Wildcard Backtracking",
        explanation: "Store words in a trie. To search, walk the query recursively: a letter follows one child; a '.' tries every child and succeeds if any of them matches the rest of the query.",
        code: `class TrieNode {
  constructor() {
    this.children = new Map();
    this.isWord = false;
  }
}

class WordDictionary {
  constructor() {
    this.root = new TrieNode();
  }

  addWord(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) {
        node.children.set(ch, new TrieNode());
      }
      node = node.children.get(ch);
    }
    node.isWord = true;
  }

  search(word) {
    // Recursively tries to match word[i..] starting at trie node \`node\`.
    const dfs = (node, i) => {
      if (node === null) return false;
      if (i === word.length) return node.isWord;

      const ch = word[i];
      if (ch === ".") {
        for (const child of node.children.values()) {
          if (dfs(child, i + 1)) return true;
        }
        return false;
      }

      return dfs(node.children.get(ch) ?? null, i + 1);
    };

    return dfs(this.root, 0);
  }
}`,
        timeComplexity: "O(L) for addWord. For search, O(L) in the average case, worst case O(26^L) when the query is all dots and every node is fully branching",
        spaceComplexity: "O(N) total for the trie's stored letters, plus O(L) recursion depth per search",
        walkthrough: [
          { code: "if (i === word.length) return node.isWord;", explanation: "Base case: the whole query is used up, so it matches only if a word ends at this node." },
          { code: "if (ch === \".\") {\n        for (const child of node.children.values()) {\n          if (dfs(child, i + 1)) return true;\n        }\n        return false;\n      }", explanation: "A wildcard tries every next letter; the search succeeds if any branch matches." },
          { code: "return dfs(node.children.get(ch) ?? null, i + 1);", explanation: "A normal letter has only one branch to follow, as in a plain trie search." },
        ],
      },
    ],
    relatedProblems: ["implement-trie", "word-search-ii"],
    keywords: ["trie", "wildcard search", "backtracking", "design", "dfs"],
  },
  {
    id: "word-search-ii",
    title: "Word Search II",
    difficulty: "Hard",
    category: "tries",
    description: `
Given a 2-D grid of letters and a list of words, find every word that can
be spelled by tracing a path through the grid.

A path can start at any cell and move up, down, left or right (not
diagonally). It can't use the same cell twice in one word. Return the
found words in any order, with no duplicates.
    `.trim(),
    examples: [
      {
        input: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]',
        output: '["eat","oath"]',
        explanation: '"oath" traces down the first column then right along row 2 (o-a-t-h). "eat" traces e-a-t using cells from rows 1-2. "pea" and "rain" can\'t be traced through any adjacent path in this grid.',
      },
      {
        input: 'board = [["a","b"],["c","d"]], words = ["abcb"]',
        output: "[]",
        explanation: '"abcb" would need to revisit the "b" cell, which isn\'t allowed within a single word\'s path.',
      },
    ],
    constraints: [
      "1 <= board rows, columns <= 12",
      "board[i][j] is a lowercase English letter",
      "1 <= words.length <= 3 * 10^4",
      "1 <= words[i].length <= 10",
      "All words are unique",
    ],
    hints: [
      "You could run a DFS/backtracking search for each word from every cell - but with many words, that repeats a lot of work.",
      "Many words share prefixes. What if you searched the grid once, with a structure that holds all the words at once?",
      "Build a trie from the word list, then run one DFS over the grid, moving down the trie as you move through the grid. When you reach a trie node marked as a complete word, you've found a match.",
    ],
    approachOverview: `
Searching the grid once per word repeats a lot of work, since many words
share prefixes. Instead, first build one **trie** from the whole word list.

Then run a DFS from every cell. Only step into a neighbor if the current
trie node has a child for that cell's letter, so the search stops as soon
as the letters so far aren't a prefix of *any* word. Reaching a node marked
as a complete word means that word is found. Cells in the current path are
marked so they aren't reused, then unmarked (backtracked) when that branch
is done.

Two optimizations keep it fast:

- Once a word is found, remove it from the trie so it isn't found again.
- Prune trie nodes that have no children left.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - DFS per Word",
        explanation: "For each word, start a DFS/backtracking search from every cell and check whether its letters can be traced out.",
        code: `function findWords(board, words) {
  const rows = board.length;
  const cols = board[0].length;
  const found = [];

  function dfs(r, c, word, i) {
    if (i === word.length) return true;
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    if (board[r][c] !== word[i]) return false;

    const temp = board[r][c];
    board[r][c] = "#"; // mark as visited for this path

    const result =
      dfs(r + 1, c, word, i + 1) ||
      dfs(r - 1, c, word, i + 1) ||
      dfs(r, c + 1, word, i + 1) ||
      dfs(r, c - 1, word, i + 1);

    board[r][c] = temp; // backtrack
    return result;
  }

  for (const word of words) {
    let ok = false;
    for (let r = 0; r < rows && !ok; r++) {
      for (let c = 0; c < cols && !ok; c++) {
        if (dfs(r, c, word, 0)) ok = true;
      }
    }
    if (ok) found.push(word);
  }

  return found;
}`,
        timeComplexity: "O(W * rows * cols * 4^L), where W is the number of words and L is the max word length - each word triggers its own full grid search",
        spaceComplexity: "O(L) recursion depth per search",
      },
      {
        approach: "Optimal - Trie + Combined DFS",
        explanation: "Build one trie from all the words. Run a single DFS over the grid that moves down the trie in step with the path, so shared prefixes are explored only once. A word is found as soon as its trie node is reached.",
        code: `class TrieNode {
  constructor() {
    this.children = new Map();
    this.word = null; // stores the full word when this node completes one
  }
}

function findWords(board, words) {
  const root = new TrieNode();

  // Build the trie from every word in the list.
  for (const word of words) {
    let node = root;
    for (const ch of word) {
      if (!node.children.has(ch)) {
        node.children.set(ch, new TrieNode());
      }
      node = node.children.get(ch);
    }
    node.word = word;
  }

  const rows = board.length;
  const cols = board[0].length;
  const result = [];

  function dfs(r, c, node) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;

    const ch = board[r][c];
    if (ch === "#" || !node.children.has(ch)) return;

    const next = node.children.get(ch);
    if (next.word !== null) {
      result.push(next.word);
      next.word = null; // avoid pushing the same word again
    }

    board[r][c] = "#"; // mark visited for this path

    dfs(r + 1, c, next);
    dfs(r - 1, c, next);
    dfs(r, c + 1, next);
    dfs(r, c - 1, next);

    board[r][c] = ch; // backtrack

    // Prune dead trie branches so future searches skip them faster.
    if (next.children.size === 0) {
      node.children.delete(ch);
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dfs(r, c, root);
    }
  }

  return result;
}`,
        timeComplexity: "O(rows * cols * 4 * 3^(L-1)) roughly - one combined DFS over the grid guided by the trie, where L is the max word length, versus a separate search per word",
        spaceComplexity: "O(N) for the trie (N = total letters across all words), plus O(L) recursion depth",
        walkthrough: [
          { code: "node.word = word;", explanation: "Instead of a boolean flag, a node that completes a word stores the word itself, so a match can be reported directly." },
          { code: "if (ch === \"#\" || !node.children.has(ch)) return;", explanation: "Stops if the cell is already in this path, or if no word continues with this letter." },
          { code: "if (next.word !== null) {\n      result.push(next.word);\n      next.word = null;\n    }", explanation: "Records the word and clears it so it isn't added twice when the grid has several paths to it." },
          { code: "board[r][c] = \"#\"; ... board[r][c] = ch;", explanation: "Marks the cell as used while this branch is explored, then restores it (backtracks) so other paths can use it." },
          { code: "if (next.children.size === 0) {\n      node.children.delete(ch);\n    }", explanation: "Deletes a trie branch with no words left to find, so later DFS calls don't re-check it." },
        ],
      },
    ],
    relatedProblems: ["implement-trie", "design-add-and-search-words"],
    keywords: ["trie", "word search", "backtracking", "dfs", "grid", "prefix tree"],
  },
];
