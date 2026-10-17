import type { Problem } from "../../types/problem";

export const bitManipulationProblems: Problem[] = [
  {
    id: "single-number",
    title: "Single Number",
    difficulty: "Easy",
    category: "bit-manipulation",
    description: `
Every number in a list appears exactly twice, except one that appears
once. Find that number.

Use a single pass and no extra data structures that grow with the input.
    `.trim(),
    examples: [
      { input: "nums = [2, 2, 1]", output: "1", explanation: "2 appears twice; 1 appears only once." },
      { input: "nums = [4, 1, 2, 1, 2]", output: "4", explanation: "1 and 2 each appear twice; 4 appears only once." },
      { input: "nums = [1]", output: "1" },
    ],
    constraints: ["1 <= nums.length <= 3 * 10^4", "-3 * 10^4 <= nums[i] <= 3 * 10^4", "Every element appears twice, except for exactly one which appears once."],
    hints: [
      "Counting each value with a hash map works. How much extra memory does it cost?",
      "`XOR` (the `^` operator) has a useful property: a number XORed with itself gives 0, and a number XORed with 0 gives itself back.",
      "XOR every number together. Each pair of duplicates cancels to 0, leaving only the number with no partner.",
    ],
    approachOverview: `
The direct way is to count each number with a hash map and return the one
with count 1. That needs extra memory for every distinct value.

\`XOR\` (bitwise exclusive-or, the \`^\` operator) needs no extra memory.
Bit by bit, XORing two equal bits gives 0, and XORing with 0 changes
nothing. So any number XORed with itself is 0, and any number XORed with
0 is itself.

XOR *every* number into one running total. Each pair of equal values
cancels to 0, in any order. Only the number without a partner is left.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Count With a Hash Map",
        explanation: "Count how many times each number appears using a hash map, then return the one whose count is exactly 1.",
        code: `function singleNumber(nums) {
  const counts = new Map();

  for (const num of nums) {
    counts.set(num, (counts.get(num) || 0) + 1);
  }

  for (const [num, count] of counts.entries()) {
    if (count === 1) return num;
  }
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal - XOR Everything Together",
        explanation: "XOR every number into a running result that starts at 0. Each pair of equal values cancels to 0 (in any order), so what's left is the number that appeared once.",
        code: `function singleNumber(nums) {
  let result = 0;

  for (const num of nums) {
    result ^= num;
  }

  return result;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let result = 0;", explanation: "Starts at 0, which changes nothing when XORed with the first number." },
          { code: "result ^= num;", explanation: "Folds each number into the result. When its duplicate also passes through (before or after), the two cancel to 0." },
          { code: "return result;", explanation: "All duplicates cancel, so only the number without a duplicate is left." },
        ],
      },
    ],
    relatedProblems: ["missing-number", "number-of-1-bits"],
    keywords: ["single number", "xor", "bit manipulation", "array"],
  },
  {
    id: "number-of-1-bits",
    title: "Number of 1 Bits",
    difficulty: "Easy",
    category: "bit-manipulation",
    description: `
Given an unsigned 32-bit integer, count how many 1s are in its binary
(base-2) form. This count is called the *Hamming weight*.

For example, 11 in binary is \`1011\`, which has three 1 bits.
    `.trim(),
    examples: [
      { input: "n = 11 (binary: 00000000000000000000000000001011)", output: "3", explanation: "The binary form has three 1 bits, at the positions worth 8, 2, and 1." },
      { input: "n = 128 (binary: 00000000000000000000000010000000)", output: "1", explanation: "128 is a power of two, so it has exactly one 1 bit." },
      { input: "n = 0", output: "0", explanation: "Zero has no 1 bits at all." },
    ],
    constraints: ["The input is an unsigned integer represented using 32 bits.", "0 <= n <= 2^32 - 1"],
    hints: [
      "To check one bit, shift the number right by that many positions and look at the last bit. Do this for all 32 positions and count the 1s.",
      "That checks all 32 positions, even the 0s. Can you jump straight from one 1 bit to the next?",
      "Trick: `n & (n - 1)` clears the *lowest* 1 bit in n and leaves the rest alone. Count how many times you can do this before n becomes 0.",
    ],
    approachOverview: `
The direct way checks all 32 positions: shift the number right by 0 to
31, look at the last bit each time, and count the 1s.

A faster way skips the 0 bits. For any \`n\`, \`n & (n - 1)\` clears
exactly its lowest 1 bit and leaves every other bit as it was.
Subtracting 1 flips the trailing 0s to 1s and the lowest 1 to a 0; the
AND keeps only the bits that agree.

Repeat this until n is 0 and count the steps. You do one step per 1 bit
instead of 32 checks every time.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Check Every Bit Position",
        explanation: "Shift the number right by 0 to 31 and check whether the last bit is 1. The unsigned shift means the sign never matters.",
        code: `function hammingWeight(n) {
  let count = 0;

  for (let i = 0; i < 32; i++) {
    if ((n >>> i) & 1) {
      count++;
    }
  }

  return count;
}`,
        timeComplexity: "O(1) - always exactly 32 checks",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal - Clear the Lowest Set Bit Repeatedly",
        explanation: "Replace n with n & (n - 1), which clears its lowest 1 bit, until n is 0. The number of steps is the number of 1 bits.",
        code: `function hammingWeight(n) {
  let count = 0;

  while (n !== 0) {
    n = n & (n - 1);
    count++;
  }

  return count;
}`,
        timeComplexity: "O(k), where k is the number of 1 bits in n (at most 32)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "while (n !== 0) {", explanation: "Runs until every 1 bit has been cleared." },
          { code: "n = n & (n - 1);", explanation: "Subtracting 1 turns the lowest 1 bit into 0 and the trailing 0s into 1s. ANDing with n keeps the higher bits, so only the lowest 1 bit is erased." },
          { code: "count++;", explanation: "Each pass clears one 1 bit, so the pass count equals the number of 1 bits." },
        ],
      },
    ],
    relatedProblems: ["counting-bits", "reverse-bits"],
    keywords: ["hamming weight", "number of 1 bits", "bit manipulation", "brian kernighan"],
  },
  {
    id: "counting-bits",
    title: "Counting Bits",
    difficulty: "Easy",
    category: "bit-manipulation",
    description: `
Given a non-negative number *n*, count the 1 bits in every number from 0
to *n*. Return the counts as a list, where position *i* holds the count
for *i*.
    `.trim(),
    examples: [
      { input: "n = 2", output: "[0, 1, 1]", explanation: "0 is 0b0 (zero 1 bits). 1 is 0b1 (one 1 bit). 2 is 0b10 (one 1 bit)." },
      {
        input: "n = 5",
        output: "[0, 1, 1, 2, 1, 2]",
        explanation: "0=0b0, 1=0b1, 2=0b10, 3=0b11 (two 1 bits), 4=0b100 (one 1 bit), 5=0b101 (two 1 bits).",
      },
    ],
    constraints: ["0 <= n <= 10^5"],
    hints: [
      "Counting the 1 bits of each number from 0 to n separately gives a correct answer.",
      "That recomputes everything, even though smaller numbers were already counted. Can you build each answer from a *smaller* number's answer?",
      "Dropping the last bit of i gives `i >> 1` (integer division by 2). How does i's 1-bit count relate to the count for `i >> 1`, plus the dropped bit?",
    ],
    approachOverview: `
The direct way counts the 1 bits of each number from 0 to n on its own.
It's correct, but it redoes work that was already done for smaller
numbers.

A cheaper way reuses earlier answers. \`i >> 1\` drops i's last bit and
equals \`Math.floor(i / 2)\`, a smaller number you've already counted.
So i's count is that number's count, plus 1 if the dropped bit
(\`i & 1\`) was 1.

This fills a table of answers in one pass, with no recomputing.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Count Each Number Independently",
        explanation: "For each number from 0 to n, count its 1 bits from scratch with a bit-by-bit check (or the 'clear the lowest set bit' trick).",
        code: `function countBits(n) {
  const result = new Array(n + 1).fill(0);

  for (let i = 0; i <= n; i++) {
    let num = i;
    let count = 0;
    while (num > 0) {
      count += num & 1;
      num = num >>> 1;
    }
    result[i] = count;
  }

  return result;
}`,
        timeComplexity: "O(n log n) - about O(log i) work for each of the n numbers",
        spaceComplexity: "O(n), for the output list",
      },
      {
        approach: "Optimal - Build Each Answer From a Smaller One",
        explanation: "The bit count of i equals the count for i >> 1 (i without its last bit, already computed) plus 1 if the dropped bit (i & 1) was 1.",
        code: `function countBits(n) {
  const result = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    result[i] = result[i >> 1] + (i & 1);
  }

  return result;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n), for the output list",
        walkthrough: [
          { code: "result[0] = 0;", explanation: "The array starts filled with zeros, which covers the base case: 0 has no 1 bits." },
          { code: "for (let i = 1; i <= n; i++) {", explanation: "Goes in increasing order, so `result[i >> 1]` is always ready when i needs it." },
          { code: "result[i] = result[i >> 1] + (i & 1);", explanation: "`i >> 1` is i without its last bit (i divided by 2, rounded down). Its count plus the removed bit (i & 1) gives i's count." },
        ],
      },
    ],
    relatedProblems: ["number-of-1-bits", "single-number"],
    keywords: ["counting bits", "dynamic programming", "hamming weight", "bit manipulation"],
  },
  {
    id: "reverse-bits",
    title: "Reverse Bits",
    difficulty: "Easy",
    category: "bit-manipulation",
    description: `
You're given an unsigned 32-bit integer (always exactly 32 binary
digits, padded with leading zeros). Reverse the order of its bits and
return the resulting number.

The first (most significant) bit moves to the last (least significant)
position, and so on, mirrored around the middle.
    `.trim(),
    examples: [
      {
        input: "n = 1 (binary: 00000000000000000000000000000001)",
        output: "2147483648 (binary: 10000000000000000000000000000000)",
        explanation: "The single 1 bit sits at the very last position; after reversing, it moves to the very first position, which is worth 2^31.",
      },
      {
        input: "n = 43261596 (binary: 00000010100101000001111010011100)",
        output: "964176192 (binary: 00111001011110000010100101000000)",
        explanation: "Reading the original 32 bits back to front produces this new bit pattern.",
      },
      { input: "n = 0", output: "0", explanation: "A number with no 1 bits reverses to itself." },
    ],
    constraints: ["The input is treated as an unsigned integer represented using 32 bits."],
    hints: [
      "One way: write the number as a 32-character binary string, reverse it, and parse it back.",
      "You can also build the reversed number from bits directly, with no string.",
      "Take n's last bit one at a time (`n & 1`) and add it to the result. Each new bit should land one position further left than the previous one.",
    ],
    approachOverview: `
One way uses text: write the number as a 32-character binary string
(padded with leading zeros), reverse it, and parse it back.

A more direct way builds the result bit by bit. Repeat 32 times:

- Take n's last bit with \`n & 1\`.
- Shift the result left by one and put the bit in the last spot with \`|\`.
- Shift n right by one so its next bit is ready.

After 32 steps, the result holds the bits in reverse order.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Reverse the Binary String",
        explanation: "Convert n to a 32-character binary string (padded with leading zeros), reverse it, and parse it back into a number.",
        code: `function reverseBits(n) {
  const binary = n.toString(2).padStart(32, "0");
  const reversed = binary.split("").reverse().join("");
  return parseInt(reversed, 2) >>> 0;
}`,
        timeComplexity: "O(1) - always exactly 32 characters",
        spaceComplexity: "O(1) - the 32-character string is a fixed size",
      },
      {
        approach: "Optimal - Build the Result Bit by Bit",
        explanation: "Loop 32 times. Take n's last bit, shift the result left by one, and OR the bit into the result's last position. Then shift n right by one.",
        code: `function reverseBits(n) {
  let result = 0;

  for (let i = 0; i < 32; i++) {
    const bit = n & 1;
    result = (result << 1) | bit;
    n = n >>> 1;
  }

  return result >>> 0;
}`,
        timeComplexity: "O(1) - always exactly 32 iterations",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "const bit = n & 1;", explanation: "Reads only n's last bit." },
          { code: "result = (result << 1) | bit;", explanation: "Shifts the result left to make room at the end, then puts the new bit there." },
          { code: "n = n >>> 1;", explanation: "Shifts n right so its next bit becomes the last bit. The unsigned shift stops a sign bit being copied in." },
          { code: "return result >>> 0;", explanation: "Reads the result as an unsigned 32-bit number, since JS bitwise operations use signed 32-bit arithmetic." },
        ],
      },
    ],
    relatedProblems: ["number-of-1-bits", "reverse-integer"],
    keywords: ["reverse bits", "bit manipulation", "32-bit", "unsigned integer"],
  },
  {
    id: "missing-number",
    title: "Missing Number",
    difficulty: "Easy",
    category: "bit-manipulation",
    description: `
A list holds *n* distinct numbers from the range 0 to *n* (inclusive).
That range has *n + 1* values, so exactly one is missing. Find it.
    `.trim(),
    examples: [
      { input: "nums = [3, 0, 1]", output: "2", explanation: "n = 3 (the list has 3 elements), so the full range is 0-3. Every value shows up except 2." },
      { input: "nums = [0, 1]", output: "2", explanation: "n = 2, full range is 0-2. 0 and 1 are present, so 2 is missing." },
      { input: "nums = [9, 6, 4, 2, 3, 5, 7, 0, 1]", output: "8", explanation: "n = 9, full range is 0-9. Every value is present except 8." },
    ],
    constraints: ["n == nums.length", "1 <= n <= 10^4", "0 <= nums[i] <= n", "All the numbers in nums are unique."],
    hints: [
      "Put the list into a hash set, then check each value from 0 to n. The one not found is the answer.",
      "That needs extra memory the size of the list. Could you combine every index and every value into one running total where matching numbers cancel out?",
      "A number XORed with itself gives 0. XOR every index from 0 to n with every value in the list. Each present number cancels with its matching index, leaving the missing one.",
    ],
    approachOverview: `
The direct way puts every value in a hash set, then checks each number
from 0 to n until one is missing.

XOR avoids the extra set. XOR together every index from 0 to n and
every value in the list. Include n itself: the list only has indexes 0
to n-1, but the *values* go up to n.

Each present value pairs with a matching index and cancels to 0, in any
order. Only the missing number has no partner, so it's what's left.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Hash Set of Present Values",
        explanation: "Put every value into a hash set. Check each number from 0 to n in order; the first one not in the set is missing.",
        code: `function missingNumber(nums) {
  const present = new Set(nums);
  const n = nums.length;

  for (let i = 0; i <= n; i++) {
    if (!present.has(i)) return i;
  }
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal - XOR Indexes and Values Together",
        explanation: "XOR every index and every value into one result. Start the result at n, because the loop's indexes only reach n-1. Each present value cancels with its index, leaving the missing number.",
        code: `function missingNumber(nums) {
  let result = nums.length; // accounts for index n, which has no array slot

  for (let i = 0; i < nums.length; i++) {
    result ^= i ^ nums[i];
  }

  return result;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let result = nums.length;", explanation: "Starts with n, because the loop only covers indexes 0 to n-1. This keeps index n in the XOR total." },
          { code: "result ^= i ^ nums[i];", explanation: "Folds in this index and the value at it. Each present value cancels with its matching index." },
          { code: "return result;", explanation: "Only the number with no matching index is left: the missing one." },
        ],
      },
    ],
    relatedProblems: ["single-number", "sum-of-two-integers"],
    keywords: ["missing number", "xor", "bit manipulation", "array"],
  },
  {
    id: "sum-of-two-integers",
    title: "Sum of Two Integers",
    difficulty: "Medium",
    category: "bit-manipulation",
    description: `
Add two integers together (either one may be negative) - without using
the \`+\` or \`-\` operators anywhere in your solution.
    `.trim(),
    examples: [
      { input: "a = 1, b = 2", output: "3" },
      { input: "a = 2, b = 3", output: "5" },
      { input: "a = -2, b = 3", output: "1" },
    ],
    constraints: ["-1000 <= a, b <= 1000"],
    hints: [
      "Without + or -, you could step one unit at a time with increment/decrement. It's slow, but it technically follows the rule.",
      "Adding two bits gives a digit (exactly what XOR gives) and maybe a carry into the next position (when both bits are 1, exactly what AND gives).",
      "XOR a and b for a 'sum without carries'. The carry is AND of a and b, shifted left one position. Add the carry back with the same process, and repeat until there's no carry.",
    ],
    approachOverview: `
Binary addition works like decimal addition: adding two bits gives a
digit and sometimes a carry into the next position.

- XOR gives the digit *without* the carry: 1+0 and 0+1 give 1; 0+0 and 1+1 give 0.
- AND is 1 only when both bits are 1, which is exactly when a carry happens.

So XOR a and b to get the sum *ignoring* carries. Compute the carries
with AND, shifted left one position, since a carry lands one bit
higher. Then add the carry back with the same XOR/AND steps, and repeat
until there's no carry left.

With at most 32 bits to carry through, this finishes quickly.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Step One Unit at a Time",
        explanation: "Increment a b times (or decrement it if b is negative). This avoids + and -, but the work grows with the size of b and misses the point of the problem.",
        code: `function getSum(a, b) {
  if (b >= 0) {
    for (let i = 0; i < b; i++) a++;
  } else {
    for (let i = 0; i < -b; i++) a--;
  }
  return a;
}`,
        timeComplexity: "O(|b|)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal - Bitwise XOR for Sum, AND for Carry",
        explanation: "Compute a 'carry-free sum' with XOR and the carry with AND shifted left by one. Feed the carry back in until it's 0. The running value is then the true sum.",
        code: `function getSum(a, b) {
  while (b !== 0) {
    const carry = (a & b) << 1;
    a = a ^ b;
    b = carry;
  }
  return a;
}`,
        timeComplexity: "O(1) - bounded by the fixed 32-bit width of the numbers",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "while (b !== 0) {", explanation: "Keeps adding carries until there are none left (b becomes 0)." },
          { code: "const carry = (a & b) << 1;", explanation: "AND finds the positions where both a and b have a 1, which is where a carry happens. The shift moves the carry one position higher." },
          { code: "a = a ^ b;", explanation: "XOR adds a and b at every bit position, ignoring carries." },
          { code: "b = carry;", explanation: "The carry becomes the new b to add on the next pass." },
        ],
      },
    ],
    relatedProblems: ["missing-number", "reverse-integer"],
    keywords: ["sum of two integers", "bitwise addition", "xor", "carry", "bit manipulation"],
  },
  {
    id: "reverse-integer",
    title: "Reverse Integer",
    difficulty: "Medium",
    category: "bit-manipulation",
    description: `
Given a signed 32-bit integer, reverse its decimal digits and keep its
sign.

If the result doesn't fit in a signed 32-bit integer (-2^31 to
2^31 - 1, the range of a 32-bit \`int\` in many languages), return 0.
    `.trim(),
    examples: [
      { input: "x = 123", output: "321" },
      { input: "x = -123", output: "-321", explanation: "The digits reverse the same way; the sign is kept as-is." },
      {
        input: "x = 1534236469",
        output: "0",
        explanation: "Reversed, this would be 9646324351, which is larger than the maximum signed 32-bit value (2147483647) - so 0 is returned instead.",
      },
    ],
    constraints: ["-2^31 <= x <= 2^31 - 1"],
    hints: [
      "Convert to a string, reverse it, and parse it back. Then check the result against the 32-bit range.",
      "Or use arithmetic: take x's last digit with % 10, append it to the result, and remove it from x with integer division by 10.",
      "The tricky part is overflow. Once you've multiplied past the limit, the number may already be wrong. Check *before* each multiply-and-add step, not after.",
    ],
    approachOverview: `
The direct way converts the number to a string (tracking the sign
separately), reverses it, parses it back, and checks the 32-bit range.

The careful way uses only arithmetic. Take x's last digit with \`% 10\`,
remove it with integer division by 10, and build the reversed result
one digit at a time.

The key detail is overflow. *Before* each multiply-and-add step, check
whether the next digit would push the result past the maximum or
minimum. If so, return 0 right away.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Reverse via String Conversion",
        explanation: "Convert |x| to a string, reverse it, parse it back, and reapply the sign. Then check that the result fits the signed 32-bit range.",
        code: `function reverse(x) {
  const sign = x < 0 ? -1 : 1;
  const reversed = Math.abs(x).toString().split("").reverse().join("");
  const result = sign * Number(reversed);

  const INT_MAX = 2 ** 31 - 1;
  const INT_MIN = -(2 ** 31);

  if (result > INT_MAX || result < INT_MIN) return 0;
  return result;
}`,
        timeComplexity: "O(d), where d is the number of digits in x",
        spaceComplexity: "O(d), for the string representation",
      },
      {
        approach: "Optimal - Build the Reversed Number Digit by Digit, Checking Overflow Early",
        explanation: "Take digits off x with % 10 and integer division by 10, and build the reversed result. Before adding each digit, check whether it would push the result past the signed 32-bit range, and return 0 if so, before any overflow happens.",
        code: `function reverse(x) {
  const INT_MAX = 2 ** 31 - 1;
  const INT_MIN = -(2 ** 31);

  let result = 0;
  while (x !== 0) {
    const digit = x % 10; // keeps the sign of x automatically in JS
    x = Math.trunc(x / 10);

    if (
      result > Math.trunc(INT_MAX / 10) ||
      (result === Math.trunc(INT_MAX / 10) && digit > 7)
    ) {
      return 0;
    }
    if (
      result < Math.trunc(INT_MIN / 10) ||
      (result === Math.trunc(INT_MIN / 10) && digit < -8)
    ) {
      return 0;
    }

    result = result * 10 + digit;
  }

  return result;
}`,
        timeComplexity: "O(d), where d is the number of digits in x",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "const digit = x % 10; x = Math.trunc(x / 10);", explanation: "Splits off x's last digit and removes it from x. JS's % keeps the sign of the dividend, so the digit keeps x's sign." },
          { code: "if (result > Math.trunc(INT_MAX / 10) || (result === ... && digit > 7)) return 0;", explanation: "Before multiplying, checks whether this digit would push the result above the 32-bit maximum. 2147483647 ends in 7, so at the truncated limit the digit must be 7 or less." },
          { code: "if (result < Math.trunc(INT_MIN / 10) || (result === ... && digit < -8)) return 0;", explanation: "The same check on the negative side, against -2147483648, which ends in -8." },
          { code: "result = result * 10 + digit;", explanation: "The digit is safe, so shift the result one decimal place and append it." },
        ],
      },
    ],
    relatedProblems: ["reverse-bits", "sum-of-two-integers"],
    keywords: ["reverse integer", "overflow", "32-bit", "digits"],
  },
];
