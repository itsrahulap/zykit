import type { Topic } from "../../types/content";

export const dsaBeginnerTopics: Topic[] = [
  {
    id: "big-o",
    title: "Big O",
    level: "beginner",
    description: "A way to describe how much slower or bigger a program gets as its input grows.",
    explanation: `
Two solutions can both "work" but behave very differently as data grows.
One stays fast with a million items; another grinds to a halt.

**Big O notation** describes that growth: how the time (or memory) a
program needs scales as the input gets bigger, regardless of hardware.

You'll see it written like \`O(1)\`, \`O(n)\`, or \`O(n²)\`, where \`n\` is the
size of the input.
    `.trim(),
    analogy:
      "Looking up a word in a dictionary is fast, even in a huge dictionary. Checking every page one by one gets much slower as the dictionary grows. Big O describes that difference.",
    examples: [
      {
        title: "O(1) vs O(n)",
        code: `// O(1) — constant time: same speed no matter the array size
function getFirst(arr) {
  return arr[0];
}

// O(n) — linear time: gets slower as the array grows
function findValue(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}`,
        explanation:
          "`getFirst` always does one step. `findValue` may check every item, so its worst-case work grows with the array's size.",
        walkthrough: [
          { code: "return arr[0];", explanation: "One step, no matter how big arr is: O(1)." },
          { code: "for (let i = 0; i < arr.length; i++) {", explanation: "In the worst case, runs once for every item in arr." },
          { code: "if (arr[i] === target) return i;", explanation: "Checks one item per pass, so work grows with arr's size: O(n)." },
        ],
      },
    ],
    howItWorks: `
Big O describes the *shape* of growth and ignores constant factors.

- \`O(1)\`: the work stays the same whatever the input size.
- \`O(n)\`: the work grows in step with the input.
- \`O(n²)\`: the work grows with the square of the input, often from a loop nested inside another loop over the same data.
    `.trim(),
    diagram: `
Input size (n) grows →

O(1)   ▬▬▬▬▬▬▬▬▬▬  (flat — stays fast)
O(n)   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  (grows steadily)
O(n²)  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  (grows steeply)
    `.trim(),
    whyItExists: `
With thousands or millions of items, an efficient approach is the
difference between an app that feels instant and one that freezes. Big O
gives engineers a shared way to compare approaches before writing code, or
while debugging it.
    `.trim(),
    whenToUse: `
Use Big O to compare how two approaches will scale, or to explain in an
interview or code review why one solution is better.
    `.trim(),
    whenNotToUse: `
For tiny, fixed-size inputs that never grow, O(n) versus O(n²) may not
matter. Don't let Big O become premature optimization.
    `.trim(),
    commonMistakes: [
      "Assuming code that works on a small test array will work at real scale.",
      "Confusing best case with worst case. Big O usually describes the worst case.",
      "Missing nested loops over the same data, one of the most common causes of O(n²) code.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "What is the Big O of a function that returns `array.length`?" },
      { difficulty: "Medium", prompt: "What is the Big O of a function with one loop that checks every item in an array? Explain why." },
      { difficulty: "Hard", prompt: "What is the Big O of a function with a loop inside a loop, both over the same array? Explain what causes the extra cost." },
    ],
    interviewQuestions: [
      { question: "What does Big O notation measure?", answer: "How an algorithm's running time or memory use grows as the input grows, regardless of hardware." },
      { question: "What's the difference between O(n) and O(n²)?", answer: "O(n) work grows in step with input size. O(n²) work grows with its square, usually from a loop nested inside another loop over the same input." },
      { question: "Is Big O about the best case or the worst case?", answer: "Usually the worst case, since that's the guarantee you can rely on. Best-case and average-case notations exist too." },
      { question: "Why is `O(2n)` simply written as `O(n)` in Big O notation?", answer: "Big O describes the *shape* of growth, not exact runtime. Multiplying by a constant like 2 doesn't change whether growth is flat, linear or quadratic, so constants are dropped." },
      { question: "Why is `O(n² + n)` simplified to just `O(n²)`?", answer: "As `n` gets large, `n²` grows so much faster than `n` that the `n` term becomes negligible. Big O keeps only the dominant (fastest-growing) term." },
      { question: "What is `O(log n)`, and what kind of code produces it?", answer: "Logarithmic time: work grows very slowly with `n`, because each step eliminates a large fraction (often half) of the remaining input. Doubling the input adds only about one extra step." },
      { question: "Why is binary search `O(log n)`?", answer: "Each comparison with the middle element eliminates half the remaining search space. After `k` comparisons, `n / 2^k` elements remain. That reaches 1 when `k = log2(n)`." },
      { question: "What is `O(n log n)`, and where does it typically show up?", answer: "It's the cost of efficient comparison-based sorts like merge sort (always) and quicksort (on average). The data is split in half `log n` times, and each level does about `n` work merging or partitioning: `n` × `log n`." },
      { question: "What causes an algorithm to be `O(2ⁿ)`, and what's a classic example?", answer: "Usually a recursive function where each call branches into several more calls that redo work instead of reusing it. The classic example is naive recursive Fibonacci: `fib(n)` calls `fib(n-1)` and `fib(n-2)`, roughly doubling the calls at each level." },
      { question: "What is `O(n!)`, and when does it come up?", answer: "Factorial time, which grows even faster than exponential. It shows up when you must consider every possible ordering (permutation) of `n` items, since there are `n!` of them." },
      { question: "What's the difference between time complexity and space complexity?", answer: "Time complexity is how running time grows with input size. Space complexity is how much extra memory is needed as input grows. They're measured independently: an algorithm can be fast but memory-hungry, or slow but memory-efficient." },
      { question: "When an interviewer asks for an algorithm's space complexity, does that include the input itself?", answer: "Usually not. Interviewers typically mean *auxiliary space*: extra memory beyond the input, such as temporary variables, new data structures or recursion stack frames." },
      { question: "What does `O(1)` space mean, and what's an example?", answer: "The *extra* memory used stays constant however large the input grows. Swapping two variables with a temporary, or a loop that tracks only a running total and an index, are both O(1) space." },
      { question: "Why can a recursive function have hidden space costs even if it doesn't create any new arrays or objects?", answer: "Each recursive call adds a frame to the call stack. Recursing to depth `n` means `n` frames in memory at once, so recursion depth alone can make an algorithm O(n) space." },
      { question: "A recursive factorial function and an iterative loop-based one are both `O(n)` time — are they equal in space complexity too?", answer: "No. The iterative version uses `O(1)` extra space: a counter and a running result. The recursive version uses `O(n)`, because all `n` calls stay on the call stack until the base case returns." },
      { question: "What is the time complexity of `for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { total++; } }`?", answer: "O(n²). The inner loop runs n times for each of the n outer iterations: n × n = n²." },
      { question: "What is the time complexity of running two separate, non-nested loops back to back, each looping from `0` to `n`?", answer: "O(n). The loops aren't nested, so the total is n + n = 2n, and Big O drops the constant. It's not O(n²)." },
      { question: "Is `array.push()` always `O(1)`? What's happening when it occasionally seems slower?", answer: "It's *amortized* O(1). Most pushes write to the next open slot: O(1). When the underlying capacity is full, the engine allocates a bigger block and copies every element: O(n) for that push. Capacity usually doubles, so resizes get rarer and the average cost per push stays O(1)." },
      { question: "If a loop runs `n` times, and each iteration calls `array.includes()` (itself O(n)) on an array of size n, what's the overall time complexity — and why is it not just O(n)?", answer: "O(n²). Counting only the outer loop ignores the work *inside* each iteration. Each of the n iterations does O(n) work: n × n = O(n²)." },
      { question: "If an outer loop runs `n` times but its nested inner loop always runs exactly 5 times regardless of `n`, what's the overall time complexity?", answer: "O(n). The inner loop doesn't depend on `n`, so it's a constant factor (5×) that gets dropped." },
      { question: "For a nested loop where the inner loop is `for (let j = i; j < n; j++)` inside an outer `for (let i = 0; i < n; i++)`, what's the time complexity, even though the inner loop gets shorter each pass?", answer: "Still O(n²). The inner loop runs n + (n-1) + ... + 1 = n(n+1)/2 times in total. That's quadratic, and Big O keeps only the n² term." },
      { question: "Why is a hash table lookup typically `O(1)` while searching an array for a value is `O(n)`?", answer: "An array search doesn't know where a value is, so it may check every element. A hash table computes an index from the key with a hash function and jumps straight to that slot. It trades extra memory for that speed." },
      { question: "Is a hash table lookup guaranteed to be `O(1)`?", answer: "Only on average, with a good hash function that spreads keys evenly. If many keys land in the same bucket (lots of collisions), lookup degrades toward `O(n)`, since it must scan every entry in that bucket." },
      { question: "If most everyday programs run on fast hardware, why do interviewers care so much about Big O?", answer: "Real systems often handle thousands to billions of records. There, O(n log n) versus O(n²) can mean milliseconds versus hours on the same hardware. Big O predicts which approach holds up as data grows, which is where production performance problems appear." },
      { question: "What does it mean for Big O to be \"asymptotic\"?", answer: "It describes behavior as input grows arbitrarily large, ignoring startup costs and tiny inputs. Two algorithms can be nearly identical on 5 elements and wildly different at a million. Big O is about that long-term trend." },
      { question: "Can two algorithms with the same Big O complexity have very different real-world speeds?", answer: "Yes. Big O hides constant factors. An O(n) algorithm doing 1 operation per element and one doing 100 are both O(n), but the second runs about 100x slower." },
      { question: "What's the difference between Big O, Big Omega, and Big Theta?", answer: "Big O is an upper bound (no worse than this). Big Omega is a lower bound (no better than this). Big Theta is a tight bound, where both match. In interviews \"Big O\" is often used loosely for the tight bound, but formally it's an upper bound." },
      { question: "Insertion sort is often described as O(n²) — is that always true?", answer: "That's the worst case, such as a reverse-sorted array, where each element shifts past every sorted element. The best case is O(n): on an already sorted array, each element needs one comparison and no shifting." },
      { question: "Why is reading `array.length` in JavaScript O(1) instead of counting every element?", answer: "JavaScript keeps `length` as a property that updates automatically when elements are added or removed (`push`, `pop`, assignment, etc.). Reading it is a property access, not a recount." },
      { question: "Could an algorithm with worse Big O complexity actually run faster than a better one in practice? When?", answer: "Yes, for small inputs. An O(n log n) algorithm can have more overhead per operation than a simple O(n²) one, and for small `n` that overhead wins. That's why some real sorts switch to insertion sort for small sub-arrays inside an overall O(n log n) algorithm." },
    ],
    relatedTopics: ["arrays", "sorting", "binary-search"],
    keywords: ["complexity", "time complexity", "space complexity", "growth rate"],
  },
  {
    id: "arrays",
    title: "Arrays",
    level: "beginner",
    description: "The most basic way to store an ordered list of items in memory.",
    explanation: `
An **array** stores values side by side in memory, in order. If you know
an item's position (its index), you can jump straight to it. Arrays are a
building block for almost every other data structure.

Reading any item by index is very fast. Inserting or removing an item in
the middle can be slow, because everything after it may need to shift.
    `.trim(),
    analogy:
      "An array is like a row of numbered parking spaces. Know the number and you walk straight to the car. But to add a car in the middle of a full row, every car after it must shift over one space.",
    examples: [
      {
        title: "Reading vs inserting",
        code: `const arr = [10, 20, 30, 40];

console.log(arr[2]); // 30 — instant, O(1)

arr.splice(1, 0, 15); // insert 15 at index 1
// arr is now [10, 15, 20, 30, 40] — everything after index 1 had to shift`,
        walkthrough: [
          { code: "const arr = [10, 20, 30, 40];", explanation: "Creates an array of 4 numbers, stored in order." },
          { code: "arr[2]", explanation: "Jumps straight to position 2: O(1), whatever the array's size." },
          { code: "arr.splice(1, 0, 15);", explanation: "Inserts 15 at index 1 and shifts every later item over by one: O(n)." },
        ],
      },
    ],
    howItWorks: `
Array elements sit in one continuous block of memory, so \`arr[i]\` is a
direct calculation ("jump to this spot"): O(1).

Inserting or deleting anywhere but the end shifts every later element by
one, which takes time proportional to the array's size: O(n).
    `.trim(),
    whyItExists: `
Fast access by position matters for countless problems: searching,
sorting, storing sequences of steps or events. Arrays are the default when
order matters and you mostly read items rather than insert in the middle.
    `.trim(),
    whenToUse: `
Use an array when you need fast access by position and mostly read data:
a leaderboard, a list of recent events, a lookup table by index.
    `.trim(),
    whenNotToUse: `
If you often insert or remove items at the front or middle of a large
collection, the O(n) shifting adds up. A linked list or another structure
may fit better.
    `.trim(),
    commonMistakes: [
      "Repeatedly inserting or removing items at the front of a large array, which is slower than it looks.",
      "Assuming search by value is instant. Finding a value (not an index) still checks items one by one: O(n).",
      "Forgetting that JavaScript arrays can hold mixed types, which is convenient but easy to misuse.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a function that returns the largest number in an array." },
      { difficulty: "Medium", prompt: "Write a function that reverses an array without using the built-in `.reverse()` method." },
      { difficulty: "Hard", prompt: "Write a function that removes duplicate values from an array while preserving the original order." },
    ],
    interviewQuestions: [
      { question: "Why is accessing an array by index O(1)?", answer: "Elements sit in contiguous memory, so any index's position is calculated directly, with no searching." },
      { question: "Why is inserting into the middle of an array O(n)?", answer: "Every element after the insertion point must shift over by one to make room." },
      { question: "When would you choose an array over a linked list?", answer: "When you need fast random access by index and rarely insert or remove items in the middle." },
      { question: "Why is `array.push()` described as *amortized* O(1) rather than plain O(1)?", answer: "Most pushes place the element in the next free slot: O(1). But the underlying storage has a fixed capacity. When it fills, the engine allocates a bigger block and copies every element: O(n) for that push. Capacity usually doubles, so copies get rarer and the *average* cost per push stays O(1)." },
      { question: "Why is `array.pop()` O(1) but `array.shift()` (removing the first element) is O(n)?", answer: "`pop()` reads the last element and decrements the length; nothing moves. `shift()` leaves a gap at index 0, so every remaining element shifts one place left. That shifting grows with the array's size." },
      { question: "Why is `array.unshift()` O(n)?", answer: "To put a new element at index 0, every existing element must first shift one place right." },
      { question: "What does `[10, 20, 30, 40, 50].slice(1, 3)` return, and what's the time complexity of `slice`?", answer: "`[20, 30]`: from index 1 up to, but not including, index 3. It's O(k), where k is the number of elements copied (up to O(n) for the whole array)." },
      { question: "What's the key difference between `.slice()` and `.splice()`?", answer: "`.slice()` returns a shallow copy of part of the array and leaves the original alone. `.splice()` changes the original in place, removing and/or inserting elements, and returns any removed elements." },
      { question: "Why is copying an array with `[...arr]` called a *shallow* copy?", answer: "It makes a new top-level array, but nested objects or arrays are copied by *reference*, not duplicated. The original and the copy share those nested objects, so changing one through either array affects both." },
      { question: "Why can't you reliably use `===` to check if two arrays contain the same values?", answer: "`===` checks whether both sides are the same object in memory, not whether their contents match. So `[1,2] === [1,2]` is `false`. Compare element by element (or use a helper) instead." },
      { question: "What is the time complexity of `Array.prototype.sort()` in modern JavaScript engines?", answer: "O(n log n) in the average and worst case. Modern engines (e.g. V8) use hybrid comparison sorts like Timsort, and any comparison-based sort needs at least O(n log n) comparisons in the general case." },
      { question: "Why is binary search O(log n) while a plain search through an unsorted array is O(n) — and what does binary search require that the other doesn't?", answer: "Linear search doesn't know where the value is, so it may check every element. Binary search compares with the middle element and discards half the rest each step. That only works on a sorted array, which guarantees the target is in one particular half." },
      { question: "If you only need to search an array once, is it worth sorting it first so you can binary search?", answer: "No. Sorting costs O(n log n), more than one O(n) linear scan. It only pays off when you search the *same* array many times, spreading the sort cost across many O(log n) searches." },
      { question: "What's the time and space complexity of reversing an array in place with two pointers (one at each end, swapping and moving inward)?", answer: "O(n) time, since each element is visited once. O(1) extra space, since swaps happen inside the existing array." },
      { question: "What's wrong with this loop meant to print every element of an array — `for (let i = 0; i <= arr.length; i++) { console.log(arr[i]); }`?", answer: "It's an off-by-one bug. With `<=`, `i` reaches `arr.length`, one past the last valid index (`arr.length - 1`), so the last pass logs `undefined`. Use `i < arr.length`." },
      { question: "Why does `delete arr[2]` behave differently from `arr.splice(2, 1)`?", answer: "`delete` removes the value but leaves an empty hole (reads as `undefined`), without shifting later elements or changing `.length`. `splice` removes the element, shifts later elements left and shrinks `.length` by one." },
      { question: "What's the time complexity of merging two arrays with `.concat()` or the spread operator?", answer: "O(n + m), where n and m are the two lengths. A new array is built and every element from both is copied in." },
      { question: "What's the time complexity of finding the maximum value in an unsorted array versus in an array already sorted ascending?", answer: "Unsorted: O(n), since any element could be the maximum. Sorted ascending: O(1), since the maximum is the last element." },
      { question: "If you need to repeatedly check whether values exist in a collection, why might converting the array to a `Set` first be worth it?", answer: "`array.includes()` is O(n) per check. Building a `Set` costs O(n) once, then each lookup is O(1) on average thanks to hashing. With many lookups, the one-time cost quickly pays off." },
      { question: "For the classic \"two sum\" problem (find two numbers in an array that add up to a target), what's the time and space complexity of a brute-force approach versus a hash-map approach?", answer: "Brute force checks every pair with nested loops: O(n²) time, O(1) extra space. The hash-map approach makes one pass, checking whether `target - number` was already seen: O(n) time, O(n) space. It trades memory for speed." },
      { question: "For a 2D array (an array of arrays) representing a grid, what's the time complexity of accessing `grid[i][j]`?", answer: "O(1). `grid[i]` jumps to the row and `[j]` jumps to the element. Two O(1) steps are still O(1), whatever the grid's size." },
      { question: "What's the space complexity of a 2D array with n rows and m columns?", answer: "O(n × m): one slot for every row-column pair, so space grows with the product of the dimensions, not their sum." },
      { question: "A `for` loop and `.forEach()` are both O(n) to iterate an array — so why might the plain loop run measurably faster?", answer: "Big O ignores the constant cost per step. `.forEach()` calls a callback on every iteration, which adds overhead a plain loop doesn't have. Both are O(n) with different constant factors." },
      { question: "Are `Array.isArray()` and reading `.length` ever more expensive than O(1)?", answer: "No, both are O(1). `.length` is kept up to date automatically rather than recounted, and `Array.isArray()` checks the object's internal type tag, not its contents." },
      { question: "Both arrays and linked lists take O(n) to fully traverse — so why do arrays tend to iterate faster in practice?", answer: "Array elements sit in one contiguous block, so the CPU cache can pre-fetch what comes next. Linked list nodes can be scattered across memory, so each step may be a slower, uncached access. Same Big O, different constant factor." },
      { question: "What's the time complexity of rotating an array left by one position by removing the first element and pushing it to the end?", answer: "O(n). `shift()` is O(n) because every element moves left, and `push()` is amortized O(1). The shift dominates." },
      { question: "Finding duplicate values in an unsorted array with nested loops is O(n²) — how does using a hash set reduce that to O(n)?", answer: "Nested loops compare every element with every other, about n² comparisons. With a hash set, you make one pass and check whether each element is already in the set (O(1) average) before adding it. That's O(n) time, at the cost of O(n) extra space." },
      { question: "What's the worst-case time complexity of `array.indexOf()`, and when does that worst case happen?", answer: "O(n), when the target is the last element or isn't in the array, so every element is checked." },
      { question: "Pushing n elements one at a time versus preallocating an array of size n and assigning by index — do they have different time complexity?", answer: "No, both are O(n). Each push is amortized O(1), and each indexed assignment is O(1). Preallocating can avoid some occasional O(n) resize-and-copy steps, which may lower the constant factor, but the complexity is the same." },
    ],
    prerequisites: ["big-o"],
    relatedTopics: ["big-o", "strings", "linked-lists"],
    keywords: ["array", "index", "contiguous memory", "insertion", "access time"],
  },
  {
    id: "strings",
    title: "Strings",
    level: "beginner",
    description: "A sequence of characters, and the special rules for working with them efficiently.",
    explanation: `
You need a way to store and work with text — a username, a message, a file
of content. That's what a **string** is: a sequence of characters, like
"hello". At first glance it looks like a simple value, but from a
data-structures perspective, a string behaves a lot like an array of
characters, and many classic coding problems are really about processing
strings efficiently: reversing them, searching within them, checking if
two strings are related in some way.
    `.trim(),
    analogy:
      "A string is like a train of connected train cars, each one carrying a single letter. You can look at any car by its position, but the whole train has to be considered when you want to know if it 'matches' another train — and just like you can't repaint one car without effectively building a new train, a string can't be changed in place: any 'edit' actually builds a brand new train car-by-car.",
    examples: [
      {
        title: "Treating a string like an array of characters",
        code: `const word = "hello";

console.log(word[0]);        // "h"
console.log(word.length);    // 5

const reversed = word.split("").reverse().join("");
console.log(reversed);       // "olleh"`,
        explanation:
          "`split(\"\")` breaks the string into an array of characters, `.reverse()` flips their order, and `.join(\"\")` glues them back into a string.",
        walkthrough: [
          { code: 'const word = "hello";', explanation: "Creates a string, five characters long." },
          { code: "word[0]", explanation: "Reads the character at index 0, just like accessing an array." },
          { code: 'word.split("")', explanation: "Breaks the string into an array of individual characters." },
          { code: ".reverse()", explanation: "Reverses the order of that array of characters." },
          { code: '.join("")', explanation: "Glues the reversed characters back into a single string." },
        ],
      },
    ],
    howItWorks: `
In JavaScript, strings are immutable — once created, a string's contents
never change. Any operation that seems to "modify" a string (like
\`.toUpperCase()\` or concatenation) actually creates and returns a brand new
string, leaving the original untouched.
    `.trim(),
    whyItExists: `
Text is everywhere — usernames, messages, file contents, search queries.
Efficient string handling underpins search engines, spell checkers, text
editors, and virtually every user-facing application.
    `.trim(),
    whenToUse: `
You reach for string-specific thinking — immutability, character-by-
character processing — whenever you're validating text, searching within
it, or comparing two pieces of text for a relationship like being
anagrams or palindromes.
    `.trim(),
    whenNotToUse: `
For very large, frequently-modified text — building up a huge string
piece by piece in a loop — repeated concatenation can be slow. Building
an array of pieces and joining it once at the end is usually faster.
    `.trim(),
    commonMistakes: [
      "Trying to change a character in a string directly (e.g. `str[0] = \"H\"`) — this silently does nothing, since strings are immutable.",
      "Repeatedly concatenating strings in a large loop, which can be slower than building an array and joining it once at the end.",
      "Forgetting that string comparison (`===`) is case-sensitive by default.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a function that checks if a given string is a palindrome (reads the same forwards and backwards)." },
      { difficulty: "Medium", prompt: "Write a function that counts how many times each character appears in a string." },
      { difficulty: "Hard", prompt: "Write a function that checks if two strings are anagrams of each other (contain exactly the same letters, in any order)." },
    ],
    interviewQuestions: [
      { question: "Are strings mutable in JavaScript?", answer: "No — strings are immutable. Any method that appears to transform a string actually returns a brand-new string." },
      { question: "How would you check if a string is a palindrome?", answer: "Compare it to its own reverse, or use two pointers moving from both ends toward the middle, checking that characters match at each step." },
      { question: "What's an efficient way to count character frequency in a string?", answer: "Use a hash table (or plain object) mapping each character to a running count, built in a single pass through the string." },
      { question: "Why is building up a large string with `+=` inside a loop inefficient?", answer: "Strings are immutable, so each `+=` doesn't modify the existing string — it creates an entirely new string by copying all the characters from both the old string and the new piece. If the string grows by one piece each iteration, the total copying work across n iterations is roughly `1 + 2 + ... + n`, which is O(n²), not O(n)." },
      { question: "What's a more efficient way to build a large string piece by piece, and why?", answer: "Push each piece into an array, then call `.join(\"\")` once at the end. Pushing into an array is amortized O(1) per piece, so filling the array is O(n) total, and `.join` does a single O(n) pass to concatenate everything — avoiding the repeated full-string copying that happens with `+=` inside a loop." },
      { question: "What's the time complexity of reading a character by index, like `str[3]`?", answer: "O(1) — like an array, a specific character position within a string can be located with a direct calculation from the string's starting position in memory, without scanning any preceding characters." },
      { question: "What's the time complexity of comparing two strings for equality with `===`, and why?", answer: "O(n) in the worst case, where n is the length of the strings — in general, the characters must be compared one by one until either a mismatch is found or the end is reached, so two strings that are identical (or that only differ in their very last character) require checking nearly every character." },
      { question: "If string equality is O(n) worst case, why does comparing two very different strings often feel instant in practice?", answer: "Character-by-character comparison can stop as soon as it hits the first mismatch — if two strings differ at position 2, only 3 comparisons are needed before concluding they're unequal, regardless of how long the strings are. The O(n) worst case only applies when strings are identical or differ near the very end." },
      { question: "What's the time complexity of a naive substring search, like `str.includes(sub)`?", answer: "O(n × m) in the worst case, where n is the length of the main string and m is the length of the substring: for each of the roughly n possible starting positions in the string, up to m characters may need to be compared before that position can be ruled out." },
      { question: "How does a two-pointer approach check whether a string is a palindrome, and what's its time and space complexity?", answer: "One pointer starts at the beginning, another at the end; they compare characters and move toward each other, stopping immediately if a mismatch is found. It's O(n) time (at most n/2 comparisons) and O(1) extra space, since it only needs two index variables rather than building any new string." },
      { question: "Both reversing a string and using two pointers can check for a palindrome in O(n) time — which uses less memory, and why?", answer: "The two-pointer approach uses O(1) extra space, tracking only two indices. Reversing the string first (e.g. `str.split(\"\").reverse().join(\"\")`) builds an entirely new string, using O(n) extra space — same time complexity, but the two-pointer method is more memory-efficient." },
      { question: "What are two ways to check if two strings are anagrams, and what's the time complexity of each?", answer: "Sort both strings' characters and compare the results: O(n log n), dominated by the sort. Or count each character's frequency in a hash map for both strings and compare the counts: O(n), a single pass through each string. The counting approach is asymptotically faster, though sorting is often simpler to write." },
      { question: "Why is checking that two strings have equal length a useful first step before checking if they're anagrams?", answer: "Two strings with different lengths can never contain the exact same multiset of characters, so comparing lengths is an O(1) check that can immediately rule out a huge number of non-anagram pairs before doing any more expensive character counting or sorting." },
      { question: "What does `\"abc\".repeat(3)` return, and what's the time complexity of `.repeat(k)`?", answer: "It returns `\"abcabcabc\"`. The time complexity is O(n × k), where n is the original string's length, since the engine copies the original n characters k times to build the result." },
      { question: "What does `\"hello\".slice(-3)` return?", answer: "`\"llo\"` — a negative argument to `slice` counts backward from the end of the string, so `-3` starts 3 characters before the end, and with no end argument it slices through to the end of the string." },
      { question: "Does `.length` always give the correct number of visible characters in a string?", answer: "Not always. JavaScript's `.length` counts UTF-16 *code units*, not visible characters. Many emoji and other Unicode characters outside the Basic Multilingual Plane are represented as a *surrogate pair* — two code units — so a string containing a single emoji can report `.length === 2`, which can silently break code that assumes one unit equals one character." },
      { question: "Why can `str.split(\"\").reverse().join(\"\")` corrupt a string that contains certain emoji?", answer: "`split(\"\")` splits the string by raw UTF-16 code unit, which can cut a surrogate-pair emoji into its two separate halves. Reversing the resulting array then puts those two halves in the wrong order relative to each other, producing garbled or invalid characters instead of a correctly reversed emoji." },
      { question: "Why does `\"Hello\" === \"hello\"` evaluate to `false`, and how would you compare them case-insensitively?", answer: "String comparison is case-sensitive by default — uppercase and lowercase letters have different underlying character codes, so they're simply not equal as values. Calling `.toLowerCase()` (or `.toUpperCase()`) on both sides before comparing normalizes the case, at the cost of an extra O(n) pass to build each normalized copy." },
      { question: "If you need to check thousands of words against a large, fixed dictionary, why convert the dictionary array to a `Set` first?", answer: "Checking `dictionaryArray.includes(word)` is O(n) per check, where n is the dictionary's size, since it may scan the whole array (and each string comparison inside that costs up to O(m), the word's length). Converting the dictionary to a `Set` once costs O(n), but afterward each lookup is O(m) average case — independent of dictionary size — which is a large win when doing many lookups." },
      { question: "What's the time complexity of finding the longest substring without repeating characters, using brute force versus a sliding window?", answer: "Brute force checks every possible substring for uniqueness, and since there are O(n²) substrings to consider, this approach costs at least O(n²) (or worse, depending on how uniqueness is checked). A sliding window that tracks characters currently in view with a hash set achieves O(n): each character is added to the window and later removed from it at most once, as the window's two ends each move forward through the string at most n times total." },
      { question: "Why do string algorithms often favor tracking positions with pointers/indices rather than building new strings inside a loop?", answer: "Because strings are immutable, any operation that looks like it modifies a string actually allocates a new one and copies data into it. Repeatedly slicing or concatenating inside a loop repeats that copying work on every iteration; tracking positions with index variables into the original string avoids any extra allocation until a final result actually needs to be built." },
      { question: "What's the time complexity of converting a number to a string, or a string to a number?", answer: "O(d), where d is the number of digits/characters involved, since each digit generally needs to be read or written individually to build the result. For numbers of a fixed, bounded size this is sometimes treated as O(1) in practice, but formally it scales with the digit count." },
      { question: "A candidate writes `str[0] = \"H\"` expecting to capitalize the first letter, but the string doesn't change. Why?", answer: "Strings are immutable in JavaScript, so assigning to an index silently does nothing (it doesn't throw an error, it just has no effect) — the original string is left untouched. To get a capitalized version, you'd need to build a new string, e.g. `\"H\" + str.slice(1)`." },
      { question: "Checking a palindrome with two pointers versus with recursion (comparing outer characters and recursing inward) are both O(n) time — do they use the same space?", answer: "No. The two-pointer iterative version uses O(1) extra space, just two indices. The recursive version uses O(n) extra space, because each recursive call adds a frame to the call stack, and the recursion goes roughly n/2 calls deep before reaching the base case — same time complexity, but recursion trades memory for shorter code." },
      { question: "Why is even just listing every substring of a string an O(n²) operation, before doing any work on them?", answer: "A string of length n has n(n+1)/2 possible contiguous substrings, since each is defined by a choice of start and end position — that count itself grows quadratically with n, so enumerating all of them is already O(n²), independent of whatever processing happens per substring." },
      { question: "When counting character frequency with a hash map, is the space complexity always proportional to the string's length?", answer: "No — it's O(k), where k is the number of *distinct* characters that actually appear, not the string's total length. For strings limited to a small fixed alphabet (like lowercase English letters, at most 26 distinct values), that space is effectively bounded by a constant, even though a long string was scanned to build it." },
      { question: "Why might you convert a string into an array of characters before doing heavy processing on it, rather than working with the string directly?", answer: "Since strings are immutable, repeatedly slicing or rebuilding a string inside a loop reallocates and copies memory every time. Converting to a mutable array once (O(n)) lets you freely read and overwrite elements in place afterward, then `.join(\"\")` back into a string just once at the end (O(n)), avoiding repeated copying in between." },
      { question: "`Array.from(str)` and `str.split(\"\")` both convert a string to an array of characters — do they behave the same way on strings containing emoji?", answer: "Not necessarily, even though both are O(n) time and space. `Array.from` (and the spread operator `[...str]`) iterate the string by Unicode code point, correctly keeping a surrogate-pair emoji together as one array entry. `split(\"\")` splits by raw UTF-16 code unit instead, which can break a surrogate-pair emoji into two separate, invalid entries — so the two methods can produce arrays of different lengths for the exact same string." },
      { question: "Why is `str.trim()` O(n) rather than O(1), even when it only removes a couple of whitespace characters?", answer: "Trimming has to scan inward from both ends to find where the whitespace stops, which in the worst case (a string with no leading/trailing whitespace) touches every character. It then must build an entirely new string — since strings are immutable — copying over just the remaining substring; both the scan and the copy scale with the string's length." },
    ],
    prerequisites: ["arrays"],
    relatedTopics: ["arrays", "hash-tables"],
    keywords: ["string", "immutable", "palindrome", "anagram", "character"],
  },
];
