import type { Problem } from "../../types/problem";

export const bitManipulationProblems: Problem[] = [
  {
    id: "single-number",
    title: "Single Number",
    difficulty: "Easy",
    category: "bit-manipulation",
    description: `
You're given a list of numbers where every value appears exactly twice,
except for one value that appears only once. Find that one value.

Your solution should run in a single pass through the list, and use no
extra data structures whose size grows with the input.
    `.trim(),
    examples: [
      { input: "nums = [2, 2, 1]", output: "1", explanation: "2 appears twice; 1 appears only once." },
      { input: "nums = [4, 1, 2, 1, 2]", output: "4", explanation: "1 and 2 each appear twice; 4 appears only once." },
      { input: "nums = [1]", output: "1" },
    ],
    constraints: ["1 <= nums.length <= 3 * 10^4", "-3 * 10^4 <= nums[i] <= 3 * 10^4", "Every element appears twice, except for exactly one which appears once."],
    hints: [
      "Counting how often each value appears with a hash map will get you the answer directly - what would it cost in extra memory?",
      "`XOR` (the `^` operator) has a useful property: any number XORed with itself gives 0, and any number XORed with 0 gives itself back.",
      "If you XOR every number in the list together, every pair of duplicates will cancel each other out to 0, leaving only the one number that never had a partner to cancel with.",
    ],
    approachOverview: `
The direct way to solve this is to count how many times each number
occurs, using a hash map, and return the one whose count is 1. That
works, but it needs extra memory proportional to the number of distinct
values in the list.

\`XOR\` (bitwise exclusive-or, the \`^\` operator) offers a way to do this
with no extra memory at all. Think about what XOR does bit by bit: a
bit XORed with an identical bit gives 0, and a bit XORed with 0 stays
unchanged. That means XORing any number with itself always gives 0, and
XORing a number with 0 always gives that number back. If you XOR *every*
number in the list together in one running total, every pair of
identical values cancels itself out to 0, no matter what order they
appear in - leaving only the single number that had no partner to
cancel with.
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
        explanation: "XOR every number in the list into a single running result, starting from 0. Every pair of identical values cancels itself out to 0 along the way (in any order), so whatever value is left over at the end is the one number that appeared just once.",
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
          { code: "result ^= num;", explanation: "Folds each number into the running result - if its duplicate has already passed through (or will later), the two cancel each other out to 0 between them." },
          { code: "return result;", explanation: "Every pair of duplicates cancels regardless of order, so only the number with no duplicate survives in the final result." },
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
Every whole number has a binary (base-2) representation, made up of 0s
and 1s. Given an unsigned 32-bit integer, count how many of those bits
are 1s. This count is sometimes called the *Hamming weight*.

For example, the number 11 is written in binary as \`1011\` - it has
three 1 bits.
    `.trim(),
    examples: [
      { input: "n = 11 (binary: 00000000000000000000000000001011)", output: "3", explanation: "The binary form has three 1 bits, at the positions worth 8, 2, and 1." },
      { input: "n = 128 (binary: 00000000000000000000000010000000)", output: "1", explanation: "128 is a power of two, so it has exactly one 1 bit." },
      { input: "n = 0", output: "0", explanation: "Zero has no 1 bits at all." },
    ],
    constraints: ["The input is an unsigned integer represented using 32 bits.", "0 <= n <= 2^32 - 1"],
    hints: [
      "You can check any single bit's value by shifting the number right by that many positions and looking at just the last bit - do that for all 32 positions and add up how many were 1.",
      "That checks every one of the 32 positions, even when most of them are 0. Is there a way to jump straight from one 1 bit to the next, skipping over the 0s entirely?",
      "Here's a neat trick: for any number n, `n & (n - 1)` always clears out the *lowest* 1 bit in n and leaves every other bit untouched. Counting how many times you can do that before n becomes 0 tells you exactly how many 1 bits it had.",
    ],
    approachOverview: `
A number's binary form has 32 fixed positions (for an unsigned 32-bit
integer), each either a 0 or a 1. The direct way to count the 1s is to
check every single one of those 32 positions - shift the number right by
each amount from 0 to 31, look at just the last bit each time, and add
up how many were 1.

A faster approach skips straight past the 0 bits instead of checking
every position. It relies on a small trick: for any number \`n\`,
computing \`n & (n - 1)\` always clears out exactly its lowest 1 bit,
leaving every other bit exactly as it was (subtracting 1 flips all the
trailing 0s to 1s and the lowest 1 to a 0, and ANDing with the original
number keeps only the bits that agree). Repeating that operation and
counting how many times it takes to reach 0 gives the number of 1 bits
directly - doing exactly as much work as there are 1 bits, rather than
32 checks every time.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Check Every Bit Position",
        explanation: "Shift the number right by each amount from 0 to 31 (using an unsigned shift, so the sign of the underlying value never matters), and check whether the last bit at that shifted position is a 1.",
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
        explanation: "Repeatedly replace n with n & (n - 1), which always clears out exactly its lowest 1 bit. Count how many times this can be done before n reaches 0 - that count is exactly the number of 1 bits n started with.",
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
          { code: "while (n !== 0) {", explanation: "Keeps going until every 1 bit has been cleared out, one at a time." },
          { code: "n = n & (n - 1);", explanation: "Subtracting 1 turns the lowest 1 bit into a 0 and every trailing 0 into a 1; ANDing with the original n then keeps only the higher bits unchanged, effectively erasing just the lowest 1 bit." },
          { code: "count++;", explanation: "Each pass through the loop clears exactly one 1 bit, so the number of passes equals the number of 1 bits n had." },
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
You're given a non-negative number *n*. For every number from 0 up to
and including *n*, count how many 1 bits appear in its binary
representation, and return all of those counts together as a list
(where position *i* of the list holds the count for the number *i*).
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
      "You already know how to count the 1 bits of a single number on its own - doing that separately for every number from 0 to n will get you a correct answer.",
      "That recomputes everything from scratch for every number, even though smaller numbers' bit counts were already figured out earlier. Can the answer for a number be built directly from the answer for a *smaller*, already-computed number?",
      "Every number i, when you drop its very last bit, becomes exactly the number `i >> 1` (integer division by 2). How does the 1-bit count of i relate to the 1-bit count of `i >> 1`, plus whatever that last dropped bit was?",
    ],
    approachOverview: `
The direct way is to count the 1 bits of each number from 0 to n
completely independently, using the same bit-clearing trick you'd use
to count the bits of just one number. That's correct, but it redoes a
lot of work, since smaller numbers' answers were already computed
earlier and thrown away.

A much cheaper approach builds every answer directly from a smaller,
already-computed one. Shifting any number i right by one bit
(\`i >> 1\`) simply drops its last bit and is exactly equal to
\`Math.floor(i / 2)\` - a smaller number whose 1-bit count was already
found earlier in the same pass. The number of 1 bits in i is then just
that smaller number's count, plus 1 more if the bit that got dropped
(\`i & 1\`) was itself a 1. That turns the whole problem into a single
pass building up a table of answers, each one reusing an earlier
result instead of recomputing anything from scratch.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Count Each Number Independently",
        explanation: "For every number from 0 to n, count its 1 bits from scratch, using the 'clear the lowest set bit' trick (or an equivalent bit-by-bit check).",
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
        explanation: "For each number i, its bit count equals the bit count of i >> 1 (i with its last bit dropped, already computed earlier in the same pass) plus 1 if that dropped bit (i & 1) was itself a 1.",
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
          { code: "result[0] = 0;", explanation: "The array starts filled with zeros, which already gives the correct base case: 0 has zero 1 bits." },
          { code: "for (let i = 1; i <= n; i++) {", explanation: "Builds every other answer in increasing order, so `result[i >> 1]` is always already computed by the time i needs it." },
          { code: "result[i] = result[i >> 1] + (i & 1);", explanation: "`i >> 1` is i with its last bit removed (equivalent to i divided by 2, rounding down); its bit count, plus whatever that removed last bit (i & 1) was worth, gives i's own bit count." },
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
You're given a number, treated as an unsigned 32-bit integer (so it's
always thought of as exactly 32 binary digits, padded with leading
zeros if needed). Reverse the order of its bits, and return the number
that those reversed bits represent.

In other words, the bit that was in the very first (most significant)
position moves to the very last (least significant) position, and vice
versa, and every bit in between mirrors around the middle the same way.
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
      "Writing the number out as a 32-character binary string, reversing that string, and reading it back as a number is a direct (if slightly indirect) way to get the answer.",
      "You can build the reversed number directly out of bits instead, without ever converting to a string.",
      "Peel off the last bit of n one at a time (using `n & 1`), and place each one into the result, building the result from its own last position outward as you go - each new bit needs to land one position further from where the previous one landed.",
    ],
    approachOverview: `
One way to reverse the bits is to lean on their text representation:
write the number out as a 32-character binary string (padding with
leading zeros so it's always exactly 32 characters), reverse that
string, and parse the reversed string back into a number.

A more direct approach builds the reversed number bit by bit, without
ever converting to a string. Walk through all 32 bit positions of n,
from its last bit to its first. At each step, pull off n's current last
bit (using \`n & 1\`), shift the result being built one position to the
left to make room, and drop that bit into the newly opened last
position (using \`|\`). Then shift n itself one position to the right, so
its next bit becomes available to pull off next. By the time all 32
bits have been moved over this way, the result holds them in exactly
reversed order.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Reverse the Binary String",
        explanation: "Convert n to a 32-character binary string (padded with leading zeros), reverse the string, and parse the reversed string back into a number.",
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
        explanation: "Loop 32 times. Each time, pull the current last bit off n, shift the result left by one to make room, and OR that bit into the result's new last position. Then shift n right by one so its next bit is ready to be pulled off.",
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
          { code: "const bit = n & 1;", explanation: "Reads n's current last bit in isolation, ignoring every other bit." },
          { code: "result = (result << 1) | bit;", explanation: "Shifts everything already placed in result one position further left (making room at the end), then drops the newly read bit into that freshly opened last position." },
          { code: "n = n >>> 1;", explanation: "Shifts n right by one (using an unsigned shift so no sign bit gets copied in), so the bit that comes right after the one just used becomes n's new last bit." },
          { code: "return result >>> 0;", explanation: "Ensures the final bit pattern is read back as an unsigned 32-bit number, since the bitwise operations above work in signed 32-bit arithmetic internally." },
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
You're given a list containing *n* distinct numbers, all drawn from the
range 0 to *n* (inclusive) - which is *n + 1* possible values squeezed
into a list of only *n* numbers. Exactly one number from that range is
missing from the list. Find it.
    `.trim(),
    examples: [
      { input: "nums = [3, 0, 1]", output: "2", explanation: "n = 3 (the list has 3 elements), so the full range is 0-3. Every value shows up except 2." },
      { input: "nums = [0, 1]", output: "2", explanation: "n = 2, full range is 0-2. 0 and 1 are present, so 2 is missing." },
      { input: "nums = [9, 6, 4, 2, 3, 5, 7, 0, 1]", output: "8", explanation: "n = 9, full range is 0-9. Every value is present except 8." },
    ],
    constraints: ["n == nums.length", "1 <= n <= 10^4", "0 <= nums[i] <= n", "All the numbers in nums are unique."],
    hints: [
      "Put every number from the list into a hash set, then check each value from 0 to n against that set - the one not found is your answer.",
      "That works, but needs extra memory the size of the list. What if you combined every index (0 to n-1) and every value in the list into one running total, in a way where matching numbers cancel out?",
      "XOR has a useful property: XORing a number with itself always gives 0. If you XOR together every index from 0 to n, and every value actually in the list, every number that's present pairs up with its matching index and cancels out, leaving only the missing one.",
    ],
    approachOverview: `
A direct way to find the missing number is to record every value that's
actually present in a hash set, then check each number from 0 to n
against that set until you find the one that's missing.

A cleverer approach uses XOR to avoid needing that extra set at all.
Since the list is *supposed* to contain every number from 0 to n except
one, imagine XORing together two things: every index from 0 to n
(including the extra index n, since the list only has n indices from
0 to n-1 but the *values* range up to n), and every value actually
present in the list. Every value that *is* present ends up paired with
one of those indices and cancels itself out to 0 via XOR, no matter
what order everything is combined in - leaving only the one number that
never got a partner to cancel with: the missing one.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Hash Set of Present Values",
        explanation: "Put every value from the list into a hash set. Then check each number from 0 to n in order - the first one not found in the set is the missing number.",
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
        explanation: "XOR together every index from 0 to n, and every value actually in the list, into one running result (starting from n, to account for the extra index the list's length doesn't otherwise cover). Every present value cancels out with a matching index, leaving only the missing number.",
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
          { code: "let result = nums.length;", explanation: "Seeds the running result with n itself - since the loop below only walks indexes 0 to n-1, this makes sure the index n is still included in the XOR total." },
          { code: "result ^= i ^ nums[i];", explanation: "Folds in both this position's index and the value actually sitting there. Across the whole list, every value that's genuinely present pairs up with its matching index and cancels to 0." },
          { code: "return result;", explanation: "Only the one number from 0 to n that never found a matching index to cancel with survives - that's the missing number." },
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
      "You're not allowed + or -, but nothing stops you from getting to the same result by stepping one unit at a time using increment/decrement - it's slow, but it sidesteps the restriction technically.",
      "Adding two numbers in binary, digit by digit, produces two things at each bit position: the digit itself (which is exactly what XOR of the two bits gives you) and a possible carry into the next position (which happens exactly when both bits are 1 - exactly what AND gives you).",
      "If you XOR a and b to get a 'sum without any carries', and separately compute the carry bits (AND of a and b, shifted one position left, since a carry always affects the next-higher bit), you can add the carry back in using the exact same process again, repeating until there's no carry left.",
    ],
    approachOverview: `
Every bit position in binary addition works the same way ordinary
decimal addition does: adding two bits produces a result digit, and
sometimes a carry into the next position over. XOR of two bits happens
to match exactly the digit you'd get from adding them *without* any
carry (1+0 or 0+1 gives 1, 0+0 and 1+1 both give 0 - which is exactly
what a carry-free addition would look like at that position). AND of
two bits is 1 exactly when both bits are 1, which is exactly when a
real addition would carry into the next position.

That gives a way to add two numbers using no + or - at all: XOR a and b
to get their sum *ignoring* every carry, and separately compute where
the carries need to go (AND of a and b, shifted one position to the
left, since a carry always lands one bit higher). Then add that carry
back in - using the exact same XOR/AND process again on the partial sum
and the carry - and keep repeating until there's no carry left to add.
Because there are only 32 bits to carry through at most, this always
finishes quickly.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Step One Unit at a Time",
        explanation: "Increment a, one unit at a time, b times (or decrement it, if b is negative). This technically avoids the + and - operators, but it does as much work as the size of b, and doesn't reflect how addition is actually meant to be done here.",
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
        explanation: "Repeatedly compute a 'carry-free sum' with XOR, and the carry itself with AND shifted left by one bit. Feed the carry back in and repeat until there's no carry left - at that point, the running value is the true sum.",
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
          { code: "while (b !== 0) {", explanation: "Keeps folding in carries until there's nothing left to carry - at which point b itself becomes 0." },
          { code: "const carry = (a & b) << 1;", explanation: "AND finds every bit position where both a and b have a 1 - exactly where a real addition would carry - and shifts that carry one position higher, where it needs to be added in." },
          { code: "a = a ^ b;", explanation: "XOR gives the sum of a and b at every bit position, as if no carries existed at all." },
          { code: "b = carry;", explanation: "The carry computed this round becomes the new 'b' to add in on the next pass, repeating the same process until it's fully absorbed." },
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
You're given a signed 32-bit integer. Reverse the order of its decimal
digits, keeping its original sign.

If reversing the digits would produce a number too large or too small
to fit in a signed 32-bit integer (the same range a 32-bit \`int\` can
hold in many languages: from -2^31 to 2^31 - 1), return 0 instead of the
reversed value.
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
      "Turning the number into a string, reversing the string, and parsing it back is a direct way to reverse the digits - you'd just need to check the result against the 32-bit range afterward.",
      "You can reverse the digits purely with arithmetic instead: repeatedly take the last digit off x (using % 10) and append it to a running result, while removing that digit from x (using integer division by 10).",
      "The tricky part is the overflow check - by the time you've already multiplied past the limit, the number itself may already be wrong. Compare against the limit *before* each multiply-and-add step, not after.",
    ],
    approachOverview: `
The direct way to reverse the digits is to convert the number to a
string (keeping track of its sign separately), reverse the string, and
parse the reversed string back into a number - then compare that result
against the signed 32-bit range to decide whether to return 0.

The more careful approach reverses the digits with pure arithmetic
instead of ever touching a string: repeatedly peel the last digit off
x using \`% 10\`, and remove it from x using integer division by 10,
building up the reversed result one digit at a time. The one detail
that needs real care is the overflow check - instead of waiting until
after the number might have already overflowed, this approach checks,
*before* every multiply-and-add step, whether adding the next digit
would push the result past the maximum or minimum allowed value, and
bails out to 0 immediately if it would.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force - Reverse via String Conversion",
        explanation: "Convert the absolute value of x to a string, reverse the string, parse it back into a number, and reapply the original sign. Then check whether the result fits inside the signed 32-bit range.",
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
        explanation: "Peel digits off x one at a time using % 10 and integer division by 10, building the reversed result with ordinary arithmetic. Before adding each new digit, check whether doing so would push the result past the signed 32-bit range, and return 0 immediately if it would - rather than letting it overflow first.",
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
          { code: "const digit = x % 10; x = Math.trunc(x / 10);", explanation: "Splits off x's last digit (keeping its sign automatically, since JS's % keeps the sign of the dividend) and removes that digit from x for the next round." },
          { code: "if (result > Math.trunc(INT_MAX / 10) || (result === ... && digit > 7)) return 0;", explanation: "Checks, before multiplying, whether appending this next digit would push the result above the maximum allowed 32-bit value - 2147483647 ends in 7, so equalling the truncated limit is only still safe if the new digit is 7 or less." },
          { code: "if (result < Math.trunc(INT_MIN / 10) || (result === ... && digit < -8)) return 0;", explanation: "Mirrors the same check on the negative side, against the minimum allowed value, -2147483648, which ends in -8." },
          { code: "result = result * 10 + digit;", explanation: "Once it's confirmed this digit is safe to add, shifts the existing result one decimal place over and appends the new digit." },
        ],
      },
    ],
    relatedProblems: ["reverse-bits", "sum-of-two-integers"],
    keywords: ["reverse integer", "overflow", "32-bit", "digits"],
  },
];
