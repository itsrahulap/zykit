import type { Problem } from "../../types/problem";

export const triesProblems: Problem[] = [
  {
    id: "implement-trie",
    title: "Implement Trie (Prefix Tree)",
    difficulty: "Medium",
    category: "tries",
    description: `
Design a data structure that stores a set of words and can quickly answer
two kinds of questions about them: "is this *exact* word in the set?" and
"does *any* word in the set start with this prefix?"

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
The key insight is that many words share prefixes ("app" and "apple" both
start with "a" -> "p" -> "p"). A **trie** (prefix tree) exploits this by
giving each *letter position* its own node, shared across every word that
agrees up to that point. Starting at a root node, each node holds links
to its possible next letters (its children) plus a boolean flag for
"a word ends here."

\`insert\` walks the word letter by letter, creating child nodes as needed,
and marks the final node as a word-ending. \`search\` walks the same way but
fails if any letter is missing, and requires the final node's flag to be
set. \`startsWith\` is identical to \`search\` except it doesn't check that
flag - just that the path exists.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Array of Words",
        explanation: "Keep every inserted word in a plain array. search() checks for an exact match; startsWith() checks whether any stored word begins with the given prefix. Simple, but every lookup scans the whole collection.",
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
        explanation: "Build an actual tree of letters. Each node has a map from letter to child node, plus a flag for whether a word ends there. Inserting, searching, and checking a prefix all just walk down the tree one letter at a time.",
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
          { code: "node.isWord = true;", explanation: "Marks the final letter of the inserted word so search() can tell 'app' the word apart from 'app' as just a prefix of 'apple'." },
          { code: "_walk(str) { ... }", explanation: "Both search and startsWith share this helper: follow the letters down the tree, failing fast if a needed child is missing." },
          { code: "return node !== null && node.isWord;", explanation: "search() additionally requires the walk to end on a marked word, not just any valid path." },
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
Design a data structure that stores words and can search for them, but with
a twist: a search query may contain \`.\` characters, and each \`.\` can match
*any single letter*.

Build a class with two operations:

- \`addWord(word)\` - adds a word to the structure.
- \`search(word)\` - returns true if there's a stored word that matches the query, where \`.\` in the query can stand in for any one letter. The query is always matched against stored words of the *same length*.
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
      "This is almost the same problem as a plain trie - the only new wrinkle is the wildcard in search.",
      "When you're walking the trie and you hit a '.', you don't know which child to follow - so try all of them.",
      "That 'try all children' step is naturally recursive/backtracking: if any one child's path leads to a full match, the whole search succeeds.",
    ],
    approachOverview: `
Store words in a trie exactly like the plain prefix-tree problem - each
node has children keyed by letter and a flag for word-endings. The only
change is in how \`search\` walks the tree: a regular letter still follows
exactly one child, but a \`.\` means "try every child this node has" and
succeed if *any* of them leads to a full match on the rest of the query.

That "try every possibility, succeed if one works" is a small
backtracking search layered on top of the trie structure, so \`search\`
becomes a recursive helper that takes the current trie node and how far
into the query string it's gotten.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Array of Words",
        explanation: "Keep every added word in a plain array. For search, compare the query against every stored word of the same length, treating '.' as a wildcard for that one position.",
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
        explanation: "Store words in a trie as usual. To search, recursively walk the query: a normal letter follows exactly one child; a '.' tries every child of the current node and succeeds if any of them lets the rest of the query match.",
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
          { code: "if (i === word.length) return node.isWord;", explanation: "Base case: the whole query has been consumed, so success depends on whether a word actually ends at this node." },
          { code: "if (ch === \".\") {\n        for (const child of node.children.values()) {\n          if (dfs(child, i + 1)) return true;\n        }\n        return false;\n      }", explanation: "A wildcard tries every possible next letter; the search succeeds if any single branch leads to a match." },
          { code: "return dfs(node.children.get(ch) ?? null, i + 1);", explanation: "A normal letter only ever has one valid branch to follow, same as a plain trie search." },
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
You're given a 2-D grid of letters and a list of words. Find every word
from the list that can be spelled out by tracing a path through the grid.

A path can start at any cell and move to any horizontally or vertically
adjacent cell (not diagonally), but it can never reuse the same cell
twice within one word's path. Return all words from the list that can be
found this way (in any order, with no duplicates).
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
      "You could search for each word individually using DFS/backtracking from every cell - but with many words, that repeats a lot of work.",
      "Many words share letter prefixes. What if you searched the grid once, using a structure that represents all the words at the same time?",
      "Build a trie out of the whole word list, then do one combined DFS over the grid, walking down the trie as you walk through the grid - whenever a trie node is marked as a complete word, you've found a match.",
    ],
    approachOverview: `
Searching the grid separately for each word (brute force) means redoing a
lot of the same exploration, since many words share prefixes. Instead,
build a single **trie** out of the entire word list first.

Then do one DFS from every cell in the grid. At each step, only continue
into a neighboring cell if the current trie node has a child for that
cell's letter - the trie prunes the search the moment the letters-so-far
stop being a prefix of *any* word. Whenever the trie node reached is
marked as a complete word, that word has been found. Cells already used
in the current path are temporarily marked so they aren't reused, then
unmarked ("backtracked") once that branch of exploration is done.

A couple of practical optimizations keep this fast: once a word is found,
remove it from consideration in the trie so it isn't rediscovered
repeatedly, and prune trie nodes that have no children left.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - DFS per Word",
        explanation: "For each word independently, try starting a DFS/backtracking search from every cell in the grid, checking whether that word's exact letter sequence can be traced out.",
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
        explanation: "Build one trie from all the words. Do a single DFS pass over the grid that walks down the trie in step with the grid path, so shared prefixes across words are explored only once. Mark a word as found the instant its trie node is reached.",
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
          { code: "node.word = word;", explanation: "Instead of a plain boolean flag, each trie node that completes a word stores the word itself, so a match can be reported directly." },
          { code: "if (ch === \"#\" || !node.children.has(ch)) return;", explanation: "Prunes immediately if the cell was already used in this path, or if no word in the trie continues with this letter." },
          { code: "if (next.word !== null) {\n      result.push(next.word);\n      next.word = null;\n    }", explanation: "Records a found word and clears the marker so the same word isn't added twice if the grid offers multiple paths to it." },
          { code: "board[r][c] = \"#\"; ... board[r][c] = ch;", explanation: "Marks the cell used for the duration of this branch's exploration, then restores it (backtracks) so other paths can use it." },
          { code: "if (next.children.size === 0) {\n      node.children.delete(ch);\n    }", explanation: "Once a trie branch has no more words left to find, deleting it keeps later DFS calls from wasting time re-checking it." },
        ],
      },
    ],
    relatedProblems: ["implement-trie", "design-add-and-search-words"],
    keywords: ["trie", "word search", "backtracking", "dfs", "grid", "prefix tree"],
  },
];
