import type { Problem } from "../../types/problem";

export const mathGeometryProblems: Problem[] = [
  {
    id: "rotate-image",
    title: "Rotate Image",
    difficulty: "Medium",
    category: "math-geometry",
    description: `
You're given a square grid of numbers (an n x n matrix), representing an
image. Rotate the image 90 degrees clockwise.

You have to do this **in place** - modify the given grid directly,
without building and returning a brand new grid of your own.
    `.trim(),
    examples: [
      {
        input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
        output: "[[7,4,1],[8,5,2],[9,6,3]]",
        explanation: "The first column, read bottom to top (7, 4, 1), becomes the new first row. The second column, read bottom to top (8, 5, 2), becomes the new second row, and so on.",
      },
      {
        input: "matrix = [[1,2],[3,4]]",
        output: "[[3,1],[4,2]]",
      },
      {
        input: "matrix = [[5]]",
        output: "[[5]]",
        explanation: "A single cell has nothing to rotate around.",
      },
    ],
    constraints: ["n == matrix.length == matrix[i].length", "1 <= n <= 20", "-1000 <= matrix[i][j] <= 1000"],
    hints: [
      "If you're allowed a second grid, you can place each cell directly into its final rotated position and copy it back - that already tells you exactly where every cell needs to end up.",
      "For a cell at row r, column c, where does it land after a 90-degree clockwise rotation, in terms of r, c, and n?",
      "Rotating 90 degrees clockwise is the same as first flipping the grid across its main diagonal (swapping matrix[r][c] with matrix[c][r]), and then reversing every row.",
    ],
    approachOverview: `
The easiest way to think about this is to figure out, for every cell,
exactly where it lands after the rotation, and place it there directly.
Building a brand new grid for that is straightforward, but it costs
extra memory equal to the whole grid.

To do it in place with no extra grid, break the rotation into two
simpler, well-known steps: first *transpose* the matrix (flip it across
its main diagonal, so \`matrix[r][c]\` and \`matrix[c][r]\` swap places).
Then reverse every row. Doing both, in that order, produces exactly the
same result as a single 90-degree clockwise rotation, using no extra
grid at all.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Build a New Rotated Grid",
        explanation: "For a 90-degree clockwise rotation, the cell at row r, column c in the original grid ends up at row c, column (n - 1 - r) in the rotated grid. Build a fresh grid by placing every cell directly into that final position, then copy the result back over the original.",
        code: `function rotate(matrix) {
  const n = matrix.length;
  const rotated = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      rotated[c][n - 1 - r] = matrix[r][c];
    }
  }

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      matrix[r][c] = rotated[r][c];
    }
  }
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(n²)",
      },
      {
        approach: "Optimal - Transpose, Then Reverse Rows",
        explanation: "First transpose the grid in place: swap matrix[r][c] with matrix[c][r] for every pair above the main diagonal, which flips the grid across that diagonal. Then reverse each row. Together, these two in-place steps produce exactly a 90-degree clockwise rotation, with no extra grid needed.",
        code: `function rotate(matrix) {
  const n = matrix.length;

  // Transpose: flip across the main diagonal
  for (let r = 0; r < n; r++) {
    for (let c = r + 1; c < n; c++) {
      [matrix[r][c], matrix[c][r]] = [matrix[c][r], matrix[r][c]];
    }
  }

  // Reverse each row
  for (let r = 0; r < n; r++) {
    matrix[r].reverse();
  }
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1) extra space",
        walkthrough: [
          { code: "for (let c = r + 1; c < n; c++) { [matrix[r][c], matrix[c][r]] = ... }", explanation: "Only swaps pairs above the diagonal (c > r), so each pair is swapped exactly once instead of swapped back again." },
          { code: "matrix[r].reverse();", explanation: "After the transpose, reversing every row finishes the rotation - together the two steps are equivalent to rotating 90 degrees clockwise." },
        ],
      },
    ],
    relatedProblems: ["spiral-matrix", "set-matrix-zeroes"],
    keywords: ["rotate image", "matrix", "in place", "transpose"],
  },
  {
    id: "spiral-matrix",
    title: "Spiral Matrix",
    difficulty: "Medium",
    category: "math-geometry",
    description: `
You're given a grid of numbers with *m* rows and *n* columns. Return
every number in the grid, in the order you'd visit them if you started
at the top-left corner and walked in a spiral - right along the top,
down the right side, left along the bottom, up the left side, then
inward to the next ring, and so on until every cell has been visited.
    `.trim(),
    examples: [
      {
        input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
        output: "[1, 2, 3, 6, 9, 8, 7, 4, 5]",
        explanation: "Across the top (1,2,3), down the right side (6,9), across the bottom right-to-left (8,7), up the left side (4), then the single cell left in the middle (5).",
      },
      {
        input: "matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]",
        output: "[1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]",
      },
      {
        input: "matrix = [[1]]",
        output: "[1]",
      },
    ],
    constraints: ["1 <= m, n <= 10", "-100 <= matrix[i][j] <= 100"],
    hints: [
      "You could walk the grid the way you'd physically trace a spiral by hand: keep moving in the current direction, and the moment the next step would go off the grid or land on a cell you've already visited, turn.",
      "That works, but needing to check 'have I already visited this cell' means tracking visited cells separately. Is there a way to know you've reached the edge of the *unvisited* region without checking every cell?",
      "Track four boundaries - top, bottom, left, right row/column indexes. After finishing a full sweep along one edge (say, the top row), shrink that boundary inward (move 'top' down by one) so the next sweep naturally stops at the right place.",
    ],
    approachOverview: `
A direct way to simulate the spiral is to walk the grid one cell at a
time, always moving in the current direction (right, down, left, or up)
until the next step would go off the grid or onto an already-visited
cell - at which point you turn 90 degrees and keep going. This mirrors
exactly how you'd trace a spiral by hand, but it needs a separate
"visited" grid to know when to turn.

A cleaner approach tracks four shrinking boundaries instead - the
current top row, bottom row, left column, and right column of the
region still left to visit. Sweep along each edge of that region in
turn (top row left-to-right, right column top-to-bottom, bottom row
right-to-left, left column bottom-to-top), and after each full sweep,
shrink the corresponding boundary inward by one. Repeat until the
boundaries cross, and every cell has been visited exactly once, with no
extra "visited" grid required.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Simulate With a Visited Grid",
        explanation: "Walk the grid one step at a time in the current direction (starting by moving right). Whenever the next cell would be off the grid or already visited, turn 90 degrees clockwise instead. Keep a same-size grid of booleans to know which cells have already been recorded.",
        code: `function spiralOrder(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // right, down, left, up
  const result = [];

  let r = 0, c = 0, dir = 0;

  for (let i = 0; i < rows * cols; i++) {
    result.push(matrix[r][c]);
    visited[r][c] = true;

    const [dr, dc] = directions[dir];
    let nr = r + dr;
    let nc = c + dc;

    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || visited[nr][nc]) {
      dir = (dir + 1) % 4;
      nr = r + directions[dir][0];
      nc = c + directions[dir][1];
    }

    r = nr;
    c = nc;
  }

  return result;
}`,
        timeComplexity: "O(m · n)",
        spaceComplexity: "O(m · n), for the visited grid",
      },
      {
        approach: "Optimal - Four Shrinking Boundaries",
        explanation: "Track the top, bottom, left, and right edges of the region still left to visit. Sweep along the top row, then the right column, then the bottom row, then the left column - shrinking each boundary inward right after its sweep - and stop once the boundaries cross.",
        code: `function spiralOrder(matrix) {
  const result = [];
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;

  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) result.push(matrix[top][c]);
    top++;

    for (let r = top; r <= bottom; r++) result.push(matrix[r][right]);
    right--;

    if (top <= bottom) {
      for (let c = right; c >= left; c--) result.push(matrix[bottom][c]);
      bottom--;
    }

    if (left <= right) {
      for (let r = bottom; r >= top; r--) result.push(matrix[r][left]);
      left--;
    }
  }

  return result;
}`,
        timeComplexity: "O(m · n)",
        spaceComplexity: "O(1) extra space, beyond the output list",
        walkthrough: [
          { code: "for (let c = left; c <= right; c++) result.push(matrix[top][c]); top++;", explanation: "Sweeps the current top row left to right, then shrinks the region by moving the top boundary down." },
          { code: "for (let r = top; r <= bottom; r++) result.push(matrix[r][right]); right--;", explanation: "Sweeps the current right column top to bottom, then shrinks the right boundary inward." },
          { code: "if (top <= bottom) { ...matrix[bottom][c]... bottom--; }", explanation: "Sweeps the bottom row right to left - guarded so a single remaining row isn't re-visited after the top-row sweep already covered it." },
          { code: "if (left <= right) { ...matrix[r][left]... left--; }", explanation: "Sweeps the left column bottom to top, similarly guarded for a single remaining column." },
        ],
      },
    ],
    relatedProblems: ["rotate-image", "set-matrix-zeroes"],
    keywords: ["spiral matrix", "matrix traversal", "boundaries", "simulation"],
  },
  {
    id: "set-matrix-zeroes",
    title: "Set Matrix Zeroes",
    difficulty: "Medium",
    category: "math-geometry",
    description: `
You're given an *m x n* grid of numbers. Whenever a cell in the grid
holds the value 0, every other cell in that cell's entire row and
entire column must also be set to 0.

Modify the grid **in place** to reflect this. The ideal solution does
it using only a constant amount of extra memory, beyond the grid
itself.
    `.trim(),
    examples: [
      {
        input: "matrix = [[1,1,1],[1,0,1],[1,1,1]]",
        output: "[[1,0,1],[0,0,0],[1,0,1]]",
        explanation: "The single 0 sits at row 1, column 1, so all of row 1 and all of column 1 become 0.",
      },
      {
        input: "matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]",
        output: "[[0,0,0,0],[0,4,5,0],[0,3,1,0]]",
        explanation: "Two zeros exist - at (0,0) and (0,3) - so rows 0 gets fully zeroed, and columns 0 and 3 get zeroed everywhere.",
      },
    ],
    constraints: ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 200", "-2^31 <= matrix[i][j] <= 2^31 - 1"],
    hints: [
      "The tricky part is that if you zero out cells as soon as you find a 0, you'll create *new* zeros that trigger even more rows and columns to be zeroed, which isn't what you want. Try recording which rows/columns need zeroing first, then applying it all in a second pass.",
      "A set of 'rows to zero' and a set of 'columns to zero', built in one pass over the grid, is enough information to correctly zero everything in a second pass - and it only costs O(m + n) extra memory instead of a whole second grid.",
      "To get to O(1) extra space, where could you 'store' whether row r or column c needs zeroing, using space you already have? The first row and first column of the grid itself can serve as those markers - you just need to remember, separately, whether the first row and first column originally had a zero of their own.",
    ],
    approachOverview: `
The key trap in this problem is that zeroing cells out as you scan
would create brand-new zeros that then incorrectly trigger even more
rows and columns to be cleared. So any approach needs to first
*record* which rows and columns must be zeroed, and only apply that in
a separate pass.

A straightforward way to record that is with a set of row indexes and a
set of column indexes, built in one scan of the grid. A second scan then
zeroes out any cell whose row or column appears in those sets.

To bring the extra memory down to a constant amount, reuse the grid's
own first row and first column as the "which rows/columns need
zeroing" markers, instead of separate sets. The only extra bookkeeping
needed is remembering, with two single booleans, whether the first row
and first column themselves originally contained a zero - since they're
about to be reused as markers.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Track Rows/Columns With Sets",
        explanation: "Scan the whole grid once, recording in a set of rows and a set of columns every row and column that contains at least one 0. Then scan again, zeroing out any cell whose row or column is in one of those sets.",
        code: `function setZeroes(matrix) {
  const rows = new Set();
  const cols = new Set();
  const m = matrix.length, n = matrix[0].length;

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c] === 0) {
        rows.add(r);
        cols.add(c);
      }
    }
  }

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (rows.has(r) || cols.has(c)) {
        matrix[r][c] = 0;
      }
    }
  }
}`,
        timeComplexity: "O(m · n)",
        spaceComplexity: "O(m + n), for the row and column sets",
      },
      {
        approach: "Optimal - Use the First Row and Column as Markers",
        explanation: "Instead of separate sets, use matrix[r][0] and matrix[0][c] themselves to mark 'row r needs zeroing' and 'column c needs zeroing'. Since that overwrites the first row/column's own values, first remember (in two booleans) whether the first row and first column originally contained a zero, then apply their markers last.",
        code: `function setZeroes(matrix) {
  const m = matrix.length, n = matrix[0].length;
  let firstRowHasZero = false;
  let firstColHasZero = false;

  for (let c = 0; c < n; c++) if (matrix[0][c] === 0) firstRowHasZero = true;
  for (let r = 0; r < m; r++) if (matrix[r][0] === 0) firstColHasZero = true;

  // Use row 0 and column 0 as marker space for every other row/column
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0;
        matrix[0][c] = 0;
      }
    }
  }

  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      if (matrix[r][0] === 0 || matrix[0][c] === 0) {
        matrix[r][c] = 0;
      }
    }
  }

  if (firstRowHasZero) for (let c = 0; c < n; c++) matrix[0][c] = 0;
  if (firstColHasZero) for (let r = 0; r < m; r++) matrix[r][0] = 0;
}`,
        timeComplexity: "O(m · n)",
        spaceComplexity: "O(1) extra space",
        walkthrough: [
          { code: "let firstRowHasZero = ...; let firstColHasZero = ...;", explanation: "Saves whether the first row/column originally had a zero of their own, before they get reused as marker space." },
          { code: "if (matrix[r][c] === 0) { matrix[r][0] = 0; matrix[0][c] = 0; }", explanation: "For every other cell, records 'this row/column needs zeroing' directly inside the grid's own first row and first column." },
          { code: "if (matrix[r][0] === 0 || matrix[0][c] === 0) matrix[r][c] = 0;", explanation: "Applies the markers - zeroing any cell whose row-marker or column-marker was set." },
          { code: "if (firstRowHasZero) ...; if (firstColHasZero) ...;", explanation: "Finally handles the first row and first column themselves, using the booleans saved at the very start." },
        ],
      },
    ],
    relatedProblems: ["rotate-image", "spiral-matrix"],
    keywords: ["set matrix zeroes", "matrix", "in place", "constant space"],
  },
  {
    id: "happy-number",
    title: "Happy Number",
    difficulty: "Easy",
    category: "math-geometry",
    description: `
Take a positive number and repeat this process: replace it with the sum
of the squares of its digits. Keep repeating.

If you eventually reach 1, the number is called *happy*, and the
process stops there. If instead the numbers start repeating in a loop
that never includes 1, the number is *not* happy, and the process would
otherwise go on forever.

Given a number, determine whether it's happy.
    `.trim(),
    examples: [
      {
        input: "n = 19",
        output: "true",
        explanation: "19 -> 1²+9² = 82 -> 8²+2² = 68 -> 6²+8² = 100 -> 1²+0²+0² = 1. It reaches 1, so it's happy.",
      },
      {
        input: "n = 2",
        output: "false",
        explanation: "2 -> 4 -> 16 -> 37 -> 58 -> 89 -> 145 -> 42 -> 20 -> 4 - it loops back to a number already seen (4) without ever reaching 1.",
      },
      { input: "n = 1", output: "true", explanation: "It's already 1." },
    ],
    constraints: ["1 <= n <= 2^31 - 1"],
    hints: [
      "Simulate the process directly, remembering every number you've produced so far - if the same number ever shows up twice, you're stuck in a loop and the number isn't happy.",
      "This process either reaches 1, or it eventually cycles - it can never grow forever, since squaring a number's digits keeps the result relatively small.",
      "This looks a lot like detecting a cycle in a linked list. What if you ran the process with two 'pointers' - one taking one step at a time, and one taking two - the way you'd detect a cycle without needing to remember every value seen?",
    ],
    approachOverview: `
The direct way to check this is to simulate the digit-squaring process
step by step, keeping a set of every number produced so far. If the
process ever reaches 1, the number is happy. If it ever produces a
number that's already in the set, it's stuck in a loop, and the number
is not happy.

There's a way to do the same check without remembering every number
seen. Since the sequence of numbers this process produces either
reaches 1 or falls into a repeating loop, it behaves exactly like a
linked list that either ends or cycles. That means the classic
"fast and slow pointer" trick works here too: keep one value that
takes one step of the process at a time, and another that takes two
steps at a time. If they ever land on the same number, the process is
looping - the number is happy only if that shared number happens to be 1.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Hash Set of Seen Values",
        explanation: "Repeatedly replace the number with the sum of the squares of its digits, recording every value seen in a set. Stop and return true if the number becomes 1, or false if it repeats a value already seen.",
        code: `function isHappy(n) {
  const seen = new Set();

  while (n !== 1 && !seen.has(n)) {
    seen.add(n);
    n = sumOfSquaredDigits(n);
  }

  return n === 1;
}

function sumOfSquaredDigits(n) {
  let sum = 0;
  while (n > 0) {
    const digit = n % 10;
    sum += digit * digit;
    n = Math.floor(n / 10);
  }
  return sum;
}`,
        timeComplexity: "O(log n) per step to compute digit squares, over a bounded number of steps before a repeat occurs",
        spaceComplexity: "O(k), where k is the number of distinct values produced before the sequence reaches 1 or repeats",
      },
      {
        approach: "Optimal - Fast and Slow Pointers (Cycle Detection)",
        explanation: "Advance one value ('slow') by a single step of the digit-squaring process, and another ('fast') by two steps at a time. If the sequence loops, the faster-moving value is guaranteed to eventually land on the same number as the slower one. When that happens, the original number is happy only if that shared value is 1.",
        code: `function isHappy(n) {
  let slow = n;
  let fast = sumOfSquaredDigits(n);

  while (fast !== 1 && slow !== fast) {
    slow = sumOfSquaredDigits(slow);
    fast = sumOfSquaredDigits(sumOfSquaredDigits(fast));
  }

  return fast === 1;
}

function sumOfSquaredDigits(n) {
  let sum = 0;
  while (n > 0) {
    const digit = n % 10;
    sum += digit * digit;
    n = Math.floor(n / 10);
  }
  return sum;
}`,
        timeComplexity: "O(log n) per step, over a bounded number of steps",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let slow = n; let fast = sumOfSquaredDigits(n);", explanation: "Starts the two pointers one step apart - slow at the original number, fast one step ahead of it." },
          { code: "while (fast !== 1 && slow !== fast) {", explanation: "Keeps going as long as neither pointer has reached 1 and they haven't collided yet." },
          { code: "slow = sumOfSquaredDigits(slow);", explanation: "Moves the slow pointer forward by exactly one step of the process." },
          { code: "fast = sumOfSquaredDigits(sumOfSquaredDigits(fast));", explanation: "Moves the fast pointer forward by two steps, so it catches up to slow if - and only if - they're both stuck circling the same loop." },
          { code: "return fast === 1;", explanation: "If the loop ends because fast reached 1, the number is happy; if it ends because slow and fast collided anywhere else, the number is stuck in a non-1 cycle." },
        ],
      },
    ],
    relatedProblems: ["plus-one", "pow-x-n"],
    keywords: ["happy number", "cycle detection", "fast and slow pointers", "digits"],
  },
  {
    id: "plus-one",
    title: "Plus One",
    difficulty: "Easy",
    category: "math-geometry",
    description: `
You're given a very large, non-negative number, represented as a list of
its digits in order (so \`[1, 2, 3]\` represents the number 123). The
list has no leading zeros, except for the number 0 itself.

Add one to this number, and return the new digits as a list, in the
same order.
    `.trim(),
    examples: [
      { input: "digits = [1, 2, 3]", output: "[1, 2, 4]", explanation: "123 + 1 = 124." },
      {
        input: "digits = [9, 9, 9]",
        output: "[1, 0, 0, 0]",
        explanation: "999 + 1 = 1000 - the extra digit means the result has one more digit than the input.",
      },
      { input: "digits = [0]", output: "[1]" },
    ],
    constraints: ["1 <= digits.length <= 100", "0 <= digits[i] <= 9", "digits does not contain any leading zeros, except for the number 0 itself."],
    hints: [
      "If the number were small enough to fit safely in a normal numeric type, you could just join the digits, add one, and split them back apart - but that stops being safe once the number of digits gets large.",
      "Think about adding one to a number by hand, right to left: if the last digit isn't 9, you just add one to it and you're done immediately.",
      "The only case that needs to 'carry' into the next digit is when the current digit is a 9 - it wraps to 0, and you move one position to the left and try again. What happens if every single digit was a 9?",
    ],
    approachOverview: `
A tempting shortcut is to treat the whole digit list as one big number:
join the digits into a string, add one to it, and split the result back
into digits. That works, but leans on being able to represent
arbitrarily large numbers accurately - something that's only safe here
because of a big-number type; it wouldn't hold up with an ordinary
floating-point number once the digit list gets long enough to lose
precision.

The more robust way mirrors how you'd add one by hand: start from the
last digit. If it isn't a 9, just add one to it and you're done -
nothing else changes. If it is a 9, it wraps around to 0 and you have
to carry the 1 into the digit to its left, repeating the same check
there. The only special case is when *every* digit was a 9 (like 999),
which means the carry runs off the front of the number entirely and a
new leading 1 has to be added.
    `.trim(),
    solutions: [
      {
        approach: "Convert to a Number",
        explanation: "Join the digits into a string, convert it to a big-number type so precision isn't lost, add one, and split the result back into individual digits.",
        code: `function plusOne(digits) {
  const num = BigInt(digits.join(""));
  const incremented = (num + 1n).toString();
  return incremented.split("").map(Number);
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal - Digit by Digit With Carry",
        explanation: "Walk the digits from right to left. As soon as a digit is less than 9, adding one to it is enough - return immediately. Otherwise, that digit wraps to 0 and the carry moves one position further left. If the carry makes it all the way past the front, every digit was a 9, so prepend a new leading 1.",
        code: `function plusOne(digits) {
  for (let i = digits.length - 1; i >= 0; i--) {
    if (digits[i] < 9) {
      digits[i]++;
      return digits;
    }
    digits[i] = 0;
  }

  // Every digit was a 9 (e.g. 999 -> 1000): prepend a new leading 1
  return [1, ...digits];
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1) extra space, aside from the rare case that adds a new leading digit",
        walkthrough: [
          { code: "for (let i = digits.length - 1; i >= 0; i--) {", explanation: "Walks the digits from the last (least significant) one backward, the same direction you'd add by hand." },
          { code: "if (digits[i] < 9) { digits[i]++; return digits; }", explanation: "The moment a digit can absorb the +1 without wrapping around, the whole addition is finished - nothing to the left of it needs to change." },
          { code: "digits[i] = 0;", explanation: "A 9 wraps to 0, and the loop continues to the next digit to the left to carry the 1 forward." },
          { code: "return [1, ...digits];", explanation: "If the loop finishes without ever returning, every digit was a 9 and is now 0 - so one new leading digit, 1, is needed (e.g. 999 -> 1000)." },
        ],
      },
    ],
    relatedProblems: ["happy-number", "multiply-strings"],
    keywords: ["plus one", "digits", "carry", "array"],
  },
  {
    id: "pow-x-n",
    title: "Pow(x, n)",
    difficulty: "Medium",
    category: "math-geometry",
    description: `
Implement a function that raises a number *x* to an integer power *n* -
that is, computes x^n - without relying on a built-in power function.

*n* can be negative, in which case x^n means 1 / x^(-n).
    `.trim(),
    examples: [
      { input: "x = 2.0, n = 10", output: "1024.0", explanation: "2 multiplied by itself 10 times." },
      { input: "x = 2.1, n = 3", output: "9.261", explanation: "2.1 * 2.1 * 2.1 = 9.261." },
      { input: "x = 2.0, n = -2", output: "0.25", explanation: "x^-2 means 1 / x^2 = 1 / 4 = 0.25." },
    ],
    constraints: ["-100 < x < 100", "-2^31 <= n <= 2^31 - 1", "x != 0, or n > 0", "n can be negative"],
    hints: [
      "Multiplying x by itself, n times, gives the correct answer - it's just slower than it needs to be for large n.",
      "If you already know x^(n/2), can you get x^n using just one more multiplication, instead of doubling the number of multiplications you do?",
      "Handle a negative n by flipping x to 1/x and n to positive n first - after that, you only ever need to solve the positive-exponent case.",
    ],
    approachOverview: `
The most direct approach multiplies x by itself n times in a loop. It's
easy to reason about, but it does n multiplications, which is
noticeably slow once n is large (say, in the billions).

A much faster approach notices that you don't need to redo all the
multiplications for each power - if you already know x raised to
n/2, you can square that single result to get x raised to n (adjusting
by one extra factor of x when n is odd). Repeating that halving
idea, the exponent shrinks by half at every step instead of by just
one, cutting the number of multiplications down to roughly log2(n). A
negative n is handled up front, by computing with 1/x and a positive
exponent instead.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Repeated Multiplication",
        explanation: "For a negative exponent, first flip x to 1/x and make n positive. Then multiply x into a running result, once for every unit of n.",
        code: `function myPow(x, n) {
  if (n < 0) {
    x = 1 / x;
    n = -n;
  }

  let result = 1;
  for (let i = 0; i < n; i++) {
    result *= x;
  }

  return result;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal - Fast (Binary) Exponentiation",
        explanation: "For a negative exponent, first flip x to 1/x and make n positive, same as before. Then compute the power recursively: find x^(n/2), square it, and multiply in one extra factor of x if n was odd. Each recursive call halves the exponent, instead of only reducing it by one.",
        code: `function myPow(x, n) {
  if (n < 0) {
    x = 1 / x;
    n = -n;
  }

  return fastPow(x, n);
}

function fastPow(x, n) {
  if (n === 0) return 1;

  const half = fastPow(x, Math.floor(n / 2));
  const halfSquared = half * half;

  return n % 2 === 0 ? halfSquared : halfSquared * x;
}`,
        timeComplexity: "O(log n)",
        spaceComplexity: "O(log n), for the recursion stack",
        walkthrough: [
          { code: "if (n === 0) return 1;", explanation: "Anything raised to the power 0 is 1 - the base case that stops the recursion." },
          { code: "const half = fastPow(x, Math.floor(n / 2));", explanation: "Recursively finds x raised to about half the exponent, reusing that single result instead of redoing the work twice." },
          { code: "const halfSquared = half * half;", explanation: "Squaring x^(n/2) gives x^n when n is even, since (x^(n/2))² = x^n." },
          { code: "return n % 2 === 0 ? halfSquared : halfSquared * x;", explanation: "When n is odd, halving it drops a remainder of one extra factor of x, which gets multiplied back in here." },
        ],
      },
    ],
    relatedProblems: ["multiply-strings", "happy-number"],
    keywords: ["pow", "exponentiation", "fast power", "recursion", "divide and conquer"],
  },
  {
    id: "multiply-strings",
    title: "Multiply Strings",
    difficulty: "Medium",
    category: "math-geometry",
    description: `
You're given two non-negative numbers, each written out as a string of
digits (they can be far too large to fit in a normal numeric type).
Multiply them and return the product, also as a string of digits.

You can't just convert the strings to numbers and multiply directly -
the whole point is that these numbers may be too big for that to work
correctly.
    `.trim(),
    examples: [
      { input: 'num1 = "2", num2 = "3"', output: '"6"' },
      { input: 'num1 = "123", num2 = "456"', output: '"56088"', explanation: "123 * 456 = 56088, computed digit by digit without ever converting the full strings to numbers." },
      { input: 'num1 = "0", num2 = "12"', output: '"0"' },
    ],
    constraints: [
      "1 <= num1.length, num2.length <= 200",
      "num1 and num2 consist of digits only.",
      "Neither num1 nor num2 has leading zeros, except num1 and num2 themselves being exactly \"0\".",
    ],
    hints: [
      "This is exactly the same multiplication you learned by hand in school: multiply the first number by each digit of the second number (one digit at a time, right to left), shift each of those partial results into its correct place value, and add them all up.",
      "Adding those partial results together with ordinary string addition works, but redoing a full string addition after every single digit adds up.",
      "Every digit pair nums1[i] and nums2[j] contributes to exactly two positions in the final answer - can you accumulate all those contributions directly into a results array, indexed by position, instead of building and adding whole partial-product strings?",
    ],
    approachOverview: `
This is the grade-school multiplication algorithm, just done on digit
strings instead of numbers you already know how to multiply directly.
One way to do it: multiply the first number by a single digit of the
second number at a time, right to left, padding each of those partial
products with the right number of trailing zeros for its place value,
and add every partial product into a running total using ordinary
string addition. It's correct, but each of those additions redoes work
across digits that were already settled by earlier additions.

A more direct approach skips the repeated string additions entirely.
Multiplying digit num1[i] by digit num2[j] always contributes to
exactly two positions of the final answer (its own digit, plus a
possible carry into the position to its left) - based only on i + j.
Accumulating every digit-pair's contribution straight into a results
array, indexed by position, produces the entire answer in a single
pass, with only one conversion back to a string at the very end.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Digit-by-Digit With String Addition",
        explanation: "For each digit of num2 (right to left), multiply it against the entire num1 to get a partial product, pad it with trailing zeros for its place value, and add it into a running total using ordinary string addition.",
        code: `function multiply(num1, num2) {
  if (num1 === "0" || num2 === "0") return "0";

  let result = "0";

  for (let i = num2.length - 1; i >= 0; i--) {
    const digit = Number(num2[i]);
    let carry = 0;
    let partial = "";

    for (let j = num1.length - 1; j >= 0; j--) {
      const product = Number(num1[j]) * digit + carry;
      partial = (product % 10) + partial;
      carry = Math.floor(product / 10);
    }
    if (carry > 0) partial = carry + partial;

    // Shift this partial product left by its place value
    partial += "0".repeat(num2.length - 1 - i);

    result = addStrings(result, partial);
  }

  return result;
}

function addStrings(a, b) {
  let result = "";
  let carry = 0;
  let i = a.length - 1;
  let j = b.length - 1;

  while (i >= 0 || j >= 0 || carry > 0) {
    const digitA = i >= 0 ? Number(a[i]) : 0;
    const digitB = j >= 0 ? Number(b[j]) : 0;
    const sum = digitA + digitB + carry;
    result = (sum % 10) + result;
    carry = Math.floor(sum / 10);
    i--;
    j--;
  }

  return result;
}`,
        timeComplexity: "O(m · n · max(m, n)) - m·n for the digit multiplications, plus a string addition of length up to m+n after each of the n digits",
        spaceComplexity: "O(m + n)",
      },
      {
        approach: "Optimal - Accumulate Into a Positions Array",
        explanation: "Multiplying num1[i] by num2[j] always lands on positions i+j (its carry) and i+j+1 (its ones digit) of the final answer, regardless of the other digits. Accumulate every digit pair's product directly into a results array at those two positions, then read the array off as the final digit string.",
        code: `function multiply(num1, num2) {
  if (num1 === "0" || num2 === "0") return "0";

  const m = num1.length, n = num2.length;
  const digits = new Array(m + n).fill(0);

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const product = Number(num1[i]) * Number(num2[j]);
      const sumPos = i + j + 1; // ones place of this product
      const carryPos = i + j;   // tens place of this product

      const total = digits[sumPos] + product;
      digits[sumPos] = total % 10;
      digits[carryPos] += Math.floor(total / 10);
    }
  }

  // Skip a single leading zero, if the result didn't need the full width
  let start = 0;
  while (start < digits.length - 1 && digits[start] === 0) {
    start++;
  }

  return digits.slice(start).join("");
}`,
        timeComplexity: "O(m · n)",
        spaceComplexity: "O(m + n)",
        walkthrough: [
          { code: "const digits = new Array(m + n).fill(0);", explanation: "The product of an m-digit and n-digit number can never need more than m + n digits, so this array is always wide enough." },
          { code: "const product = Number(num1[i]) * Number(num2[j]);", explanation: "Multiplies just this one pair of digits, exactly as you would on paper." },
          { code: "const total = digits[sumPos] + product; digits[sumPos] = total % 10; digits[carryPos] += Math.floor(total / 10);", explanation: "Adds this digit pair's contribution into its position, and folds any overflow straight into the next position to the left - so no separate addition pass is ever needed." },
          { code: "return digits.slice(start).join(\"\");", explanation: "Once every digit pair has contributed, the array already holds the final digits in order - only a possible leading zero needs trimming." },
        ],
      },
    ],
    relatedProblems: ["plus-one", "pow-x-n"],
    keywords: ["multiply strings", "grade school multiplication", "big numbers", "string"],
  },
  {
    id: "detect-squares",
    title: "Detect Squares",
    difficulty: "Medium",
    category: "math-geometry",
    description: `
Design a data structure that stores points on a 2D plane and can answer
queries about them. It needs to support two operations:

- **add(point)** - records a new point. The same point can be added more than once, and each addition counts separately.
- **count(point)** - given a query point, counts how many *axis-aligned squares* can be formed using this query point as one corner and three other previously added points as the remaining corners.

An axis-aligned square is one whose sides run straight horizontally and
vertically (never tilted). If the same three other points could form a
square with the query point in more than one way (for instance, because
a point was added multiple times), each way counts separately.
    `.trim(),
    examples: [
      {
        input: 'add([3,10]); add([11,2]); add([3,2]); count([11,10])',
        output: "1",
        explanation: "The four points (3,10), (11,2), (3,2), and (11,10) form one axis-aligned square (an 8x8 square), and (11,10) is the query point completing it.",
      },
      {
        input: "count([14,8]) on the same data",
        output: "0",
        explanation: "No combination of the stored points, together with (14,8), forms an axis-aligned square.",
      },
      {
        input: "add([11,2]) again, then count([11,10])",
        output: "2",
        explanation: "With (11,2) now stored twice, the same square can be completed in two distinct ways - once using each copy of (11,2) - so the count doubles.",
      },
    ],
    constraints: ["point.length == 2", "0 <= x, y <= 1000", "At most 3000 calls total to add and count combined."],
    hints: [
      "Three points determine an axis-aligned square uniquely (there's only one valid fourth corner) - so for a query point, you could look at every pair of previously stored points and check whether, together with the query, they'd complete a square.",
      "That means comparing the query against every pair of stored points, which is a lot of pairs. Can you narrow down which points are even worth considering, before comparing anything?",
      "For an axis-aligned square, any point that shares the query's x-coordinate must be one of the two corners forming a vertical side with it. Once you know that side's length, the other two corners' exact coordinates are fully determined - you just need to check whether those exact points were ever added.",
    ],
    approachOverview: `
Any three points of an axis-aligned square, once you know two of them
form one full side or one full diagonal, pin down the fourth corner
exactly - there's no ambiguity. That means one workable approach is: for
the query point, look at every other stored point as a potential
diagonal partner. If a point really sits diagonally opposite the query
(matching horizontal and vertical distance), the other two corners are
fully determined, and you just need to check whether those exact points
exist among the stored ones.

The faster approach narrows the search before it even starts: only
points that share the query's exact x-coordinate can possibly form a
vertical side with it. For each such point, the side length is just the
difference in y-coordinates, which immediately tells you the exact (x,
y) coordinates the other two corners would need to have. Keeping a hash
map of "how many times has this exact point been added" turns checking
whether those two corners exist into an instant lookup, and a second
map grouping points by x-coordinate keeps the search itself limited to
only the points worth considering.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Check Every Point as a Diagonal Partner",
        explanation: "Store every added point in a plain list (duplicates included). For count(), scan the whole list for a point that's diagonally opposite the query (matching horizontal and vertical distance). For each candidate, the other two corners' coordinates are fixed - check how many times each of those was added by scanning the list again.",
        code: `class DetectSquares {
  constructor() {
    this.points = []; // every added point, duplicates included
  }

  add(point) {
    this.points.push(point);
  }

  count(point) {
    const [x, y] = point;
    let total = 0;

    for (const [x2, y2] of this.points) {
      const side = Math.abs(x2 - x);

      // A genuine diagonal partner is exactly "side" away in both
      // directions, and isn't the query point's own position.
      if (side === 0 || Math.abs(y2 - y) !== side) continue;

      const otherCornerA = this.countOccurrences(x, y2);
      const otherCornerB = this.countOccurrences(x2, y);

      total += otherCornerA * otherCornerB;
    }

    return total;
  }

  countOccurrences(x, y) {
    let count = 0;
    for (const [px, py] of this.points) {
      if (px === x && py === y) count++;
    }
    return count;
  }
}`,
        timeComplexity: "add: O(1). count: O(n²), where n is the number of stored points",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal - Group Points by x-Coordinate, Hash Map Lookups",
        explanation: "Keep a hash map of exact point counts, plus a second map grouping points by x-coordinate. For count(), only look at points sharing the query's x-coordinate - each one fixes a potential side length, and the other two corners' exact coordinates, checked with instant hash map lookups instead of scanning everything.",
        code: `class DetectSquares {
  constructor() {
    this.pointCounts = new Map();  // "x,y" -> how many times added
    this.pointsByX = new Map();    // x -> Map(y -> count)
  }

  add(point) {
    const [x, y] = point;
    const key = x + "," + y;
    this.pointCounts.set(key, (this.pointCounts.get(key) || 0) + 1);

    if (!this.pointsByX.has(x)) {
      this.pointsByX.set(x, new Map());
    }
    const yCounts = this.pointsByX.get(x);
    yCounts.set(y, (yCounts.get(y) || 0) + 1);
  }

  count(point) {
    const [x, y] = point;
    const yCounts = this.pointsByX.get(x);
    if (!yCounts) return 0;

    let total = 0;

    for (const [y2, countY2] of yCounts.entries()) {
      if (y2 === y) continue;

      const side = Math.abs(y2 - y);

      // The square can sit to the right of this vertical edge...
      total += countY2
        * (this.pointCounts.get((x + side) + "," + y) || 0)
        * (this.pointCounts.get((x + side) + "," + y2) || 0);

      // ...or to the left of it.
      total += countY2
        * (this.pointCounts.get((x - side) + "," + y) || 0)
        * (this.pointCounts.get((x - side) + "," + y2) || 0);
    }

    return total;
  }
}`,
        timeComplexity: "add: O(1). count: O(k), where k is the number of stored points sharing the query's x-coordinate",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "const yCounts = this.pointsByX.get(x); if (!yCounts) return 0;", explanation: "Immediately rules out the query if no stored point even shares its x-coordinate - none of them could form a vertical side with it." },
          { code: "const side = Math.abs(y2 - y);", explanation: "Every point (x, y2) sharing the query's column defines one vertical side of a candidate square, with this exact length." },
          { code: "this.pointCounts.get((x + side) + \",\" + y) ...", explanation: "Given the side length, the coordinates of the two remaining corners are fully determined - this checks, in one hash lookup, whether each of them was ever actually added." },
          { code: "total += countY2 * cornerA * cornerB;", explanation: "Multiplies the counts together so that duplicate points (added more than once) correctly multiply the number of distinct squares, rather than just adding one per combination." },
        ],
      },
    ],
    relatedProblems: ["set-matrix-zeroes", "spiral-matrix"],
    keywords: ["detect squares", "design", "hash map", "geometry", "axis-aligned"],
  },
];
