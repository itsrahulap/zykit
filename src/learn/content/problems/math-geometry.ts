import type { Problem } from "../../types/problem";

export const mathGeometryProblems: Problem[] = [
  {
    id: "rotate-image",
    title: "Rotate Image",
    difficulty: "Medium",
    category: "math-geometry",
    description: `
You're given an n x n matrix representing an image. Rotate it 90 degrees
clockwise.

Do it **in place**: modify the given grid directly instead of returning
a new one.
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
      "With a second grid, you can place each cell in its rotated position and copy it back. That tells you where every cell must end up.",
      "Where does the cell at row r, column c land after a 90-degree clockwise rotation, in terms of r, c and n?",
      "Rotating 90 degrees clockwise is the same as flipping the grid across its main diagonal (swapping matrix[r][c] with matrix[c][r]), then reversing every row.",
    ],
    approachOverview: `
The easiest way is to work out where each cell lands after rotation and
place it there in a new grid. That's simple, but uses extra memory the
size of the whole grid.

To do it in place, split the rotation into two steps. First *transpose*
the matrix: flip it across its main diagonal, so \`matrix[r][c]\` and
\`matrix[c][r]\` swap. Then reverse every row. Together, in that order,
they equal a 90-degree clockwise rotation, with no extra grid.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Build a New Rotated Grid",
        explanation: "After a 90-degree clockwise rotation, the cell at row r, column c ends up at row c, column (n - 1 - r). Build a new grid by placing each cell there, then copy it back over the original.",
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
        explanation: "Transpose the grid in place by swapping matrix[r][c] with matrix[c][r] for every pair above the main diagonal. Then reverse each row. These two in-place steps give a 90-degree clockwise rotation with no extra grid.",
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
          { code: "for (let c = r + 1; c < n; c++) { [matrix[r][c], matrix[c][r]] = ... }", explanation: "Only swaps pairs above the diagonal (c > r), so each pair is swapped once and not swapped back." },
          { code: "matrix[r].reverse();", explanation: "After the transpose, reversing every row finishes the 90-degree clockwise rotation." },
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
Given a grid with *m* rows and *n* columns, return every number in
spiral order. Start at the top-left corner, go right along the top, down
the right side, left along the bottom, up the left side, then move
inward to the next ring until every cell is visited.
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
      "Trace the spiral as you would by hand: keep moving in one direction, and turn when the next step would leave the grid or hit a visited cell.",
      "That works, but you must track visited cells separately. Can you know where the *unvisited* region ends without checking each cell?",
      "Track four boundaries: top, bottom, left and right. After sweeping one edge (say, the top row), shrink that boundary inward (move 'top' down by one) so the next sweep stops in the right place.",
    ],
    approachOverview: `
The direct way walks one cell at a time in the current direction
(right, down, left or up). When the next step would leave the grid or
hit a visited cell, turn 90 degrees. This is how you'd trace it by hand,
but it needs a separate "visited" grid.

A cleaner approach tracks four shrinking boundaries: the top row, bottom
row, left column and right column of the region left to visit. Sweep
each edge in turn:

- Top row, left to right.
- Right column, top to bottom.
- Bottom row, right to left.
- Left column, bottom to top.

After each sweep, move that boundary inward by one. Stop when the
boundaries cross. Every cell is visited once, with no "visited" grid.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Simulate With a Visited Grid",
        explanation: "Walk one step at a time, starting to the right. When the next cell is off the grid or already visited, turn 90 degrees clockwise. A same-size grid of booleans records visited cells.",
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
        explanation: "Track the top, bottom, left and right edges of the unvisited region. Sweep the top row, right column, bottom row, then left column, shrinking each boundary right after its sweep. Stop when the boundaries cross.",
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
      left++;
    }
  }

  return result;
}`,
        timeComplexity: "O(m · n)",
        spaceComplexity: "O(1) extra space, beyond the output list",
        walkthrough: [
          { code: "for (let c = left; c <= right; c++) result.push(matrix[top][c]); top++;", explanation: "Sweeps the top row left to right, then moves the top boundary down." },
          { code: "for (let r = top; r <= bottom; r++) result.push(matrix[r][right]); right--;", explanation: "Sweeps the right column top to bottom, then moves the right boundary inward." },
          { code: "if (top <= bottom) { ...matrix[bottom][c]... bottom--; }", explanation: "Sweeps the bottom row right to left. The guard stops a single remaining row from being visited twice." },
          { code: "if (left <= right) { ...matrix[r][left]... left++; }", explanation: "Sweeps the left column bottom to top, similarly guarded for a single remaining column." },
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
You're given an *m x n* grid. If a cell is 0, set its entire row and
column to 0.

Modify the grid **in place**. Ideally, use only constant extra memory.
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
      "If you zero cells as soon as you find a 0, you create *new* zeros that wrongly trigger more rows and columns. Record which rows and columns need zeroing first, then apply it in a second pass.",
      "A set of 'rows to zero' and a set of 'columns to zero', built in one pass, is enough to zero everything in a second pass. It costs only O(m + n) extra memory.",
      "For O(1) extra space, where could you store which rows and columns need zeroing using space you already have? The grid's first row and first column can be the markers. Just remember separately whether they had a zero of their own.",
    ],
    approachOverview: `
The trap: zeroing cells as you scan creates new zeros that wrongly clear
more rows and columns. So first *record* which rows and columns to zero,
then apply it in a separate pass.

A simple way to record this is a set of row indexes and a set of column
indexes, built in one scan. A second scan zeroes any cell whose row or
column is in those sets.

To use only constant extra memory, use the grid's own first row and
first column as the markers instead of sets. You only need two booleans
to remember whether the first row and first column had a zero
originally, since they're about to be overwritten as markers.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Track Rows/Columns With Sets",
        explanation: "Scan the grid once, adding every row and column that contains a 0 to a set. Scan again, zeroing any cell whose row or column is in a set.",
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
        explanation: "Instead of sets, use matrix[r][0] and matrix[0][c] to mark 'row r needs zeroing' and 'column c needs zeroing'. This overwrites the first row and column, so first save in two booleans whether they had a zero, and handle them last.",
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
          { code: "let firstRowHasZero = ...; let firstColHasZero = ...;", explanation: "Saves whether the first row and column had a zero, before they're reused as markers." },
          { code: "if (matrix[r][c] === 0) { matrix[r][0] = 0; matrix[0][c] = 0; }", explanation: "Marks 'this row/column needs zeroing' in the grid's first row and first column." },
          { code: "if (matrix[r][0] === 0 || matrix[0][c] === 0) matrix[r][c] = 0;", explanation: "Applies the markers, zeroing any cell whose row or column marker is set." },
          { code: "if (firstRowHasZero) ...; if (firstColHasZero) ...;", explanation: "Finally zeroes the first row and column if the saved booleans say so." },
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
Take a positive number and keep replacing it with the sum of the squares
of its digits.

If you reach 1, the number is *happy*. If the numbers loop forever
without reaching 1, it's *not* happy.

Given a number, return whether it's happy.
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
      "Simulate the process and remember every number produced. If a number shows up twice, you're in a loop and it isn't happy.",
      "The process either reaches 1 or cycles. It can't grow forever, since summing squared digits keeps the result fairly small.",
      "This is like detecting a cycle in a linked list. Try two 'pointers', one taking one step at a time and one taking two, so you don't need to remember every value.",
    ],
    approachOverview: `
The direct way simulates the process, keeping a set of every number
produced. Reaching 1 means happy. Producing a number already in the set
means it's stuck in a loop, so it's not happy.

You can skip remembering every number. The sequence either reaches 1 or
loops, just like a linked list that ends or cycles. So the "fast and
slow pointer" trick works: one value takes one step at a time, another
takes two. If they land on the same number, the process is looping. The
number is happy only if that shared number is 1.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Hash Set of Seen Values",
        explanation: "Keep replacing the number with the sum of its squared digits, recording each value in a set. Return true if it becomes 1, or false if it repeats a value.",
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
        explanation: "Move one value ('slow') one step of the process at a time, and another ('fast') two steps. If the sequence loops, fast will land on the same number as slow. The number is happy only if fast reaches 1.",
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
          { code: "let slow = n; let fast = sumOfSquaredDigits(n);", explanation: "Starts slow at the original number and fast one step ahead." },
          { code: "while (fast !== 1 && slow !== fast) {", explanation: "Continues until fast reaches 1 or the pointers meet." },
          { code: "slow = sumOfSquaredDigits(slow);", explanation: "Moves slow forward one step." },
          { code: "fast = sumOfSquaredDigits(sumOfSquaredDigits(fast));", explanation: "Moves fast forward two steps, so it catches slow only if both are in the same loop." },
          { code: "return fast === 1;", explanation: "If fast reached 1, the number is happy. If the pointers met anywhere else, it's stuck in a cycle without 1." },
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
You're given a very large non-negative number as a list of its digits
(so \`[1, 2, 3]\` is 123). There are no leading zeros, except for the
number 0 itself.

Add one and return the new digits as a list, in the same order.
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
      "For a small number, you could join the digits, add one and split them again. That stops being safe once there are many digits.",
      "Add one by hand, right to left: if the last digit isn't 9, add one to it and you're done.",
      "You only carry when a digit is 9: it wraps to 0 and you move one position left. What happens if every digit is 9?",
    ],
    approachOverview: `
A tempting shortcut treats the digits as one big number: join them, add
one, and split the result. This only works because of a big-number
type. An ordinary floating-point number loses precision once the list
is long enough.

The robust way mirrors adding by hand. Start from the last digit. If it
isn't 9, add one and you're done. If it is 9, it wraps to 0 and you
carry the 1 to the digit on its left, repeating the check there. The
only special case is when *every* digit is 9 (like 999): the carry runs
off the front, so add a new leading 1.
    `.trim(),
    solutions: [
      {
        approach: "Convert to a Number",
        explanation: "Join the digits into a string, convert it to a big-number type so no precision is lost, add one, and split the result back into digits.",
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
        explanation: "Walk the digits right to left. When a digit is less than 9, add one and return. Otherwise it wraps to 0 and the carry moves left. If the carry passes the front, every digit was 9, so prepend a 1.",
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
          { code: "for (let i = digits.length - 1; i >= 0; i--) {", explanation: "Walks from the last (least significant) digit backward, as you'd add by hand." },
          { code: "if (digits[i] < 9) { digits[i]++; return digits; }", explanation: "When a digit can take the +1 without wrapping, the addition is done. Nothing to its left changes." },
          { code: "digits[i] = 0;", explanation: "A 9 wraps to 0, and the loop carries the 1 to the next digit left." },
          { code: "return [1, ...digits];", explanation: "If the loop never returned, every digit was 9 and is now 0, so add a leading 1 (e.g. 999 -> 1000)." },
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
Compute x^n (a number *x* raised to an integer power *n*) without a
built-in power function.

*n* can be negative, in which case x^n means 1 / x^(-n).
    `.trim(),
    examples: [
      { input: "x = 2.0, n = 10", output: "1024.0", explanation: "2 multiplied by itself 10 times." },
      { input: "x = 2.1, n = 3", output: "9.261", explanation: "2.1 * 2.1 * 2.1 = 9.261." },
      { input: "x = 2.0, n = -2", output: "0.25", explanation: "x^-2 means 1 / x^2 = 1 / 4 = 0.25." },
    ],
    constraints: ["-100 < x < 100", "-2^31 <= n <= 2^31 - 1", "x != 0, or n > 0", "n can be negative"],
    hints: [
      "Multiplying x by itself n times is correct, but slow for large n.",
      "If you know x^(n/2), can you get x^n with just one more multiplication?",
      "Handle a negative n first by flipping x to 1/x and making n positive. Then you only need the positive case.",
    ],
    approachOverview: `
The direct approach multiplies x by itself n times in a loop. That's n
multiplications, which is slow when n is large (say, in the billions).

A faster approach reuses work. If you know x^(n/2), square it to get x^n,
with one extra factor of x when n is odd. Repeating this halves the
exponent at each step instead of reducing it by one, so you need only
about log2(n) multiplications. Handle a negative n up front by using
1/x and a positive exponent.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Repeated Multiplication",
        explanation: "For a negative exponent, flip x to 1/x and make n positive. Then multiply x into a running result n times.",
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
        explanation: "Handle a negative exponent as before. Then recurse: find x^(n/2), square it, and multiply by one extra x if n is odd. Each call halves the exponent instead of reducing it by one.",
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
          { code: "if (n === 0) return 1;", explanation: "Anything to the power 0 is 1. This base case stops the recursion." },
          { code: "const half = fastPow(x, Math.floor(n / 2));", explanation: "Finds x to about half the exponent once, and reuses it instead of computing it twice." },
          { code: "const halfSquared = half * half;", explanation: "Squaring x^(n/2) gives x^n when n is even, since (x^(n/2))² = x^n." },
          { code: "return n % 2 === 0 ? halfSquared : halfSquared * x;", explanation: "When n is odd, halving drops one factor of x, so it's multiplied back in here." },
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
You're given two non-negative numbers as digit strings. They may be too
large for a normal numeric type. Return their product as a digit string.

You can't convert the strings to numbers and multiply, because the
numbers may be too big for that to work.
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
      "Use school long multiplication: multiply the first number by each digit of the second (right to left), shift each partial result to its place value, and add them up.",
      "Adding the partial results with string addition works, but a full string addition after every digit adds up.",
      "Each digit pair nums1[i] and nums2[j] affects exactly two positions in the answer. Can you add those contributions straight into a results array by position, instead of building partial-product strings?",
    ],
    approachOverview: `
This is grade-school multiplication on digit strings. One way: multiply
the first number by one digit of the second at a time, right to left.
Pad each partial product with trailing zeros for its place value, and
add it to a running total with string addition. It's correct, but each
addition redoes work on digits already settled.

A more direct approach skips the repeated additions. Multiplying digit
num1[i] by digit num2[j] always affects exactly two positions of the
answer (its own digit, plus a possible carry to the left), based only on
i + j. Adding every digit pair's contribution straight into a results
array by position builds the whole answer in one pass. Convert it to a
string once at the end.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Digit-by-Digit With String Addition",
        explanation: "For each digit of num2 (right to left), multiply it by all of num1 to get a partial product. Pad it with trailing zeros for its place value and add it to a running total with string addition.",
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
        explanation: "The product of num1[i] and num2[j] always lands on positions i+j (its carry) and i+j+1 (its ones digit). Add every digit pair's product into a results array at those positions, then join the array into the final string.",
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
          { code: "const digits = new Array(m + n).fill(0);", explanation: "An m-digit times n-digit product never needs more than m + n digits, so this array is always wide enough." },
          { code: "const product = Number(num1[i]) * Number(num2[j]);", explanation: "Multiplies this one pair of digits, as you would on paper." },
          { code: "const total = digits[sumPos] + product; digits[sumPos] = total % 10; digits[carryPos] += Math.floor(total / 10);", explanation: "Adds the pair's contribution at its position and carries any overflow one position left, so no separate addition pass is needed." },
          { code: "return digits.slice(start).join(\"\");", explanation: "The array now holds the final digits in order. Only a possible leading zero needs trimming." },
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
Design a data structure that stores points on a 2D plane and supports two
operations:

- **add(point)** - records a new point. The same point can be added more than once, and each addition counts separately.
- **count(point)** - counts how many *axis-aligned squares* have the query point as one corner and three previously added points as the other corners.

An axis-aligned square has horizontal and vertical sides (never tilted).
If a square can be formed in more than one way (for instance, because a
point was added several times), each way counts separately.
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
      "Three corners fix an axis-aligned square (there's only one valid fourth corner). So for a query point, you could check every pair of stored points to see if they complete a square.",
      "That's a lot of pairs. Can you narrow down which points are worth considering first?",
      "A point sharing the query's x-coordinate forms a vertical side with it. The side's length fixes the other two corners' exact coordinates, so you only need to check whether those points were added.",
    ],
    approachOverview: `
In an axis-aligned square, a known side or diagonal pins down the other
corners exactly. So one approach treats every stored point as a possible
diagonal partner of the query. If a point sits diagonally opposite
(same horizontal and vertical distance), the other two corners are
fixed, and you check whether those points were stored.

The faster approach narrows the search first. Only points with the
query's exact x-coordinate can form a vertical side with it. For each,
the side length is the difference in y-coordinates, which gives the
exact coordinates of the other two corners.

- A hash map of "how many times was this exact point added" checks those corners instantly.
- A second map grouping points by x-coordinate limits the search to points worth considering.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Check Every Point as a Diagonal Partner",
        explanation: "Store every added point in a list, duplicates included. For count(), scan the list for points diagonally opposite the query (same horizontal and vertical distance). Each one fixes the other two corners. Scan the list again to count how often each was added.",
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
        explanation: "Keep a hash map of exact point counts and a second map grouping points by x-coordinate. For count(), only look at points sharing the query's x-coordinate. Each fixes a side length and the other two corners, which are checked with instant hash map lookups.",
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
          { code: "const yCounts = this.pointsByX.get(x); if (!yCounts) return 0;", explanation: "Returns 0 right away if no stored point shares the query's x-coordinate, since none could form a vertical side with it." },
          { code: "const side = Math.abs(y2 - y);", explanation: "Each point (x, y2) in the query's column forms a vertical side of a candidate square with this length." },
          { code: "this.pointCounts.get((x + side) + \",\" + y) ...", explanation: "The side length fixes the two remaining corners. One hash lookup each checks whether they were added." },
          { code: "total += countY2 * cornerA * cornerB;", explanation: "Multiplies the counts so duplicate points correctly multiply the number of squares." },
        ],
      },
    ],
    relatedProblems: ["set-matrix-zeroes", "spiral-matrix"],
    keywords: ["detect squares", "design", "hash map", "geometry", "axis-aligned"],
  },
];
