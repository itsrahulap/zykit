import type { Topic } from "../../types/content";

export const dsaBeginnerTopics: Topic[] = [
  {
    id: "big-o",
    title: "Big O",
    level: "beginner",
    description: "A way to describe how much slower or bigger a program gets as its input grows.",
    explanation: `
Two solutions to the same problem can both "work," but behave very
differently once the amount of data grows. One might stay fast with a
million items; another might crawl to a halt. **Big O notation** is a way
to describe that growth pattern — how the time (or memory) a program needs
scales as the input gets bigger — without depending on the exact hardware
it runs on.

You'll see it written like \`O(1)\`, \`O(n)\`, or \`O(n²)\`, where \`n\` represents
the size of the input.
    `.trim(),
    analogy:
      "Imagine looking up a word in a dictionary versus checking every page one by one. Both find the word eventually, but one gets dramatically slower as the dictionary grows, and the other barely changes. Big O is how we describe that difference.",
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
          "`getFirst` always does exactly one step. `findValue` might need to check every single item, so its worst-case work grows directly with the array's size.",
        walkthrough: [
          { code: "return arr[0];", explanation: "Always does exactly one step, no matter how big arr is — O(1)." },
          { code: "for (let i = 0; i < arr.length; i++) {", explanation: "In the worst case, this runs once for every item in arr." },
          { code: "if (arr[i] === target) return i;", explanation: "Checks one item per pass, so total work grows directly with arr's size — O(n)." },
        ],
      },
    ],
    howItWorks: `
Big O describes the *shape* of growth, ignoring constant factors and small
details. \`O(1)\` means the work stays the same regardless of input size.
\`O(n)\` means the work grows in direct proportion to the input. \`O(n²)\` means
the work grows by the square of the input — often caused by a loop nested
inside another loop over the same data.
    `.trim(),
    diagram: `
Input size (n) grows →

O(1)   ▬▬▬▬▬▬▬▬▬▬  (flat — stays fast)
O(n)   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  (grows steadily)
O(n²)  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  (grows steeply)
    `.trim(),
    whyItExists: `
As soon as data gets large — thousands or millions of items — the
difference between an efficient and inefficient approach becomes the
difference between an app that feels instant and one that visibly freezes.
Big O gives engineers a common language to compare approaches before
writing (or after debugging) real code.
    `.trim(),
    whenToUse: `
Reach for Big O whenever you're choosing between two different approaches
to the same problem and need a fast way to compare how they'll scale, or
when you're explaining — in an interview or a code review — why one
solution is better than another.
    `.trim(),
    whenNotToUse: `
For truly tiny, fixed-size inputs that will never grow, the difference
between O(n) and O(n²) may not matter in practice — don't let Big O turn
into premature optimization for code that never runs on real-sized data.
    `.trim(),
    commonMistakes: [
      "Assuming code that works fine on a small test array will work fine at real scale.",
      "Confusing best-case performance with worst-case — Big O usually describes the worst case.",
      "Ignoring nested loops over the same data, which is one of the most common causes of O(n²) code.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Identify the Big O of a function that returns `array.length`." },
      { difficulty: "Medium", prompt: "Identify the Big O of a function with one loop that checks every item in an array, and explain why." },
      { difficulty: "Hard", prompt: "Identify the Big O of a function with a loop inside a loop, both running over the same array, and explain what causes the extra cost." },
    ],
    interviewQuestions: [
      { question: "What does Big O notation measure?", answer: "How the running time or memory usage of an algorithm grows as the input size increases, independent of the specific hardware." },
      { question: "What's the difference between O(n) and O(n²)?", answer: "O(n) work grows directly with input size; O(n²) work grows with the square of it — usually from a loop nested inside another loop over the same input." },
      { question: "Is Big O about the best case or the worst case?", answer: "Usually the worst case, since that's the guarantee you can rely on — though best-case and average-case notations exist too." },
      { question: "Why is `O(2n)` simply written as `O(n)` in Big O notation?", answer: "Because Big O describes the *shape* of an algorithm's growth as input size increases, not its exact runtime — multiplying by a constant (like 2) scales the line up or down but doesn't change whether it's flat, linear, quadratic, etc. Constant factors are dropped so Big O reflects the scaling behavior, not machine-specific speed." },
      { question: "Why is `O(n² + n)` simplified to just `O(n²)`?", answer: "Because as `n` gets large, the `n²` term grows so much faster than the `n` term that the `n` term becomes negligible by comparison — Big O keeps only the dominant (fastest-growing) term and drops lower-order ones, since they don't affect the long-term growth trend." },
      { question: "What is `O(log n)`, and what kind of code produces it?", answer: "Logarithmic time: the work needed grows very slowly as `n` increases, because each step eliminates a large fraction (often half) of the remaining input rather than processing it one item at a time. Doubling the input size only adds roughly one extra step, instead of doubling the work." },
      { question: "Why is binary search `O(log n)`?", answer: "Each comparison against the middle element eliminates half of the remaining search space, so after `k` comparisons only `n / 2^k` elements remain; solving for when that shrinks to 1 element gives `k = log2(n)` — the number of comparisons needed grows logarithmically, not linearly, with `n`." },
      { question: "What is `O(n log n)`, and where does it typically show up?", answer: "It's the complexity of efficient comparison-based sorting algorithms, like merge sort (always) and quicksort (on average): the data is repeatedly split in half (`log n` levels of splitting), and at each level roughly `n` total work is done merging or partitioning — multiplying `n` work per level by `log n` levels gives `O(n log n)` overall." },
      { question: "What causes an algorithm to be `O(2ⁿ)`, and what's a classic example?", answer: "Exponential time typically comes from a recursive function where each call branches into multiple further calls that each explore a large portion of the problem again, without reusing prior work. The classic example is naive recursive Fibonacci: each call to `fib(n)` makes two more calls, `fib(n-1)` and `fib(n-2)`, and this branching roughly doubles the number of calls made at each level." },
      { question: "What is `O(n!)`, and when does it come up?", answer: "Factorial time — the number of operations grows by the factorial of the input size, which is even faster-growing than exponential. It shows up in problems that must consider every possible ordering (permutation) of `n` items, since there are `n!` distinct permutations to generate or check." },
      { question: "What's the difference between time complexity and space complexity?", answer: "Time complexity describes how an algorithm's running time grows as input size increases; space complexity describes how much extra memory it needs as input grows. An algorithm can be fast but memory-hungry, or slow but memory-efficient — they're measured independently." },
      { question: "When an interviewer asks for an algorithm's space complexity, does that include the input itself?", answer: "Usually not — interviewers typically mean *auxiliary space*: the extra memory an algorithm allocates beyond the input it was given (like temporary variables, new data structures, or recursion stack frames), not the space the input already occupies." },
      { question: "What does `O(1)` space mean, and what's an example?", answer: "It means the amount of *extra* memory used stays constant no matter how large the input grows. Swapping two variables using a temporary variable, or a loop that only tracks a running total and an index, both use a fixed, small number of variables regardless of input size." },
      { question: "Why can a recursive function have hidden space costs even if it doesn't create any new arrays or objects?", answer: "Every recursive call adds a new frame to the call stack to track its local variables and where to resume after the call returns. If a function recurses to a depth of `n`, that's `n` stacked frames sitting in memory at once — so recursion depth alone can make an algorithm O(n) space, even with no explicit data structure involved." },
      { question: "A recursive factorial function and an iterative loop-based one are both `O(n)` time — are they equal in space complexity too?", answer: "No. The iterative version uses `O(1)` extra space — just a counter and a running result. The recursive version uses `O(n)` extra space, because each of the `n` recursive calls stays on the call stack until the base case returns and the calls unwind — same time complexity, different space complexity." },
      { question: "What is the time complexity of `for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { total++; } }`?", answer: "O(n²) — the inner loop runs n times for every one of the n iterations of the outer loop, so the total number of iterations is n × n = n², regardless of what work happens inside." },
      { question: "What is the time complexity of running two separate, non-nested loops back to back, each looping from `0` to `n`?", answer: "O(n) — even though there are two loops, neither is nested inside the other, so the total work is n + n = 2n; Big O drops the constant factor, leaving O(n), not O(n²)." },
      { question: "Is `array.push()` always `O(1)`? What's happening when it occasionally seems slower?", answer: "It's *amortized* O(1). Most pushes just write to the next open slot and increment length — truly O(1). But when the array's underlying allocated capacity is full, the engine must allocate a larger block of memory and copy every existing element into it, which is O(n) for that one push. Because capacity typically grows by doubling, these expensive resizes become exponentially rarer, so averaged over many pushes, the cost per push still works out to O(1)." },
      { question: "If a loop runs `n` times, and each iteration calls `array.includes()` (itself O(n)) on an array of size n, what's the overall time complexity — and why is it not just O(n)?", answer: "O(n²) — describing only the outer loop as \"O(n) because it runs n times\" ignores the cost of what happens *inside* each iteration; here each of the n iterations does O(n) work, so the total is n × n = O(n²)." },
      { question: "If an outer loop runs `n` times but its nested inner loop always runs exactly 5 times regardless of `n`, what's the overall time complexity?", answer: "O(n) — the inner loop's iteration count doesn't depend on `n` at all, so it's a constant factor (5×) that gets dropped; only the outer loop's n iterations affect the growth rate." },
      { question: "For a nested loop where the inner loop is `for (let j = i; j < n; j++)` inside an outer `for (let i = 0; i < n; i++)`, what's the time complexity, even though the inner loop gets shorter each pass?", answer: "Still O(n²) — the total number of inner-loop iterations across all outer passes is n + (n-1) + (n-2) + ... + 1, which sums to n(n+1)/2; that's a quadratic expression, and Big O keeps only the dominant n² term, dropping the rest." },
      { question: "Why is a hash table lookup typically `O(1)` while searching an array for a value is `O(n)`?", answer: "An array search has no way to know where a value is, so it must check elements one by one in the worst case. A hash table computes a numeric index directly from the key using a hash function, then jumps straight to that slot — turning a search into a direct calculation instead of a scan, trading extra memory (for the hash table's internal storage) for that speed." },
      { question: "Is a hash table lookup guaranteed to be `O(1)`?", answer: "Only on average, assuming a good hash function spreads keys evenly. In the worst case — many keys hashing to the same bucket (a collision-heavy scenario) — a hash table can degrade toward `O(n)`, since it has to scan through all the colliding entries in that bucket, similar to a linked list search." },
      { question: "If most everyday programs run on fast hardware, why do interviewers care so much about Big O?", answer: "Real systems often operate on large datasets — thousands to billions of records — where the difference between, say, O(n log n) and O(n²) is the difference between a query returning in milliseconds versus taking hours on the exact same hardware. Big O predicts which approach will hold up as data grows, which is exactly the scenario where performance problems actually surface in production." },
      { question: "What does it mean for Big O to be \"asymptotic\"?", answer: "It describes how an algorithm behaves as the input size grows arbitrarily large (approaches infinity), deliberately ignoring constant startup costs and behavior on tiny inputs. Two algorithms can perform almost identically on a 5-element input yet diverge enormously at a million elements — Big O is about that long-term trend, not any one specific input size." },
      { question: "Can two algorithms with the same Big O complexity have very different real-world speeds?", answer: "Yes. Big O hides constant factors: an O(n) algorithm doing 1 operation per element and another O(n) algorithm doing 100 operations per element are both \"O(n)\", but the second will run roughly 100x slower in practice. Big O compares how work scales, not the actual wall-clock time for a given input." },
      { question: "What's the difference between Big O, Big Omega, and Big Theta?", answer: "Big O describes an upper bound on growth (it won't get worse than this); Big Omega describes a lower bound (it won't do better than this); Big Theta describes a tight bound, where the upper and lower bounds match. In everyday interview usage, \"Big O\" is often used loosely to mean the typical/tight bound, but formally it's specifically an upper bound." },
      { question: "Insertion sort is often described as O(n²) — is that always true?", answer: "That's its worst case (e.g. a reverse-sorted array), where each new element must shift past every previously sorted element. Its best case is O(n): if the array is already sorted, each element only needs one comparison against its neighbor and no shifting, so the algorithm makes a single pass." },
      { question: "Why is reading `array.length` in JavaScript O(1) instead of counting every element?", answer: "JavaScript arrays maintain `length` as a property that's automatically kept up to date whenever elements are added or removed (via `push`, `pop`, direct assignment, etc.), so reading it is just a direct property access — not a recount of the elements." },
      { question: "Could an algorithm with worse Big O complexity actually run faster than a better one in practice? When?", answer: "Yes, for small enough input sizes. Big O ignores constant factors, and an algorithm with better asymptotic complexity (like O(n log n)) can have more overhead per operation than a simpler O(n²) approach; for small `n`, that overhead can outweigh the asymptotic advantage. This is why some real sorting implementations switch to simple insertion sort for small sub-arrays even inside an overall O(n log n) algorithm." },
    ],
    relatedTopics: ["arrays", "sorting", "binary-search"],
    keywords: ["complexity", "time complexity", "space complexity", "growth rate"],
  },
  {
    id: "arrays",
    title: "Arrays",
    level: "beginner",
    description: "The most fundamental way to store an ordered list of items in memory.",
    explanation: `
Imagine a row of numbered storage slots sitting right next to each other,
so that knowing a slot's number lets you jump straight to it without
checking any of the others first. That's the idea behind an **array**: a
way to store a group of values right next to each other in memory, in
order, so you can find any item instantly if you know its position (its
index). It's one of the most basic building blocks for almost every other
data structure.

Because array items sit next to each other in memory, reading any item by
its index is extremely fast — but inserting or removing an item in the
middle can be slow, since everything after it may need to shift.
    `.trim(),
    analogy:
      "An array is like a row of parking spaces, each numbered. If you know the space number, you can walk straight to that car. But if you need to add a car in the middle of a full row, every car after it has to shift over one space.",
    examples: [
      {
        title: "Reading vs inserting",
        code: `const arr = [10, 20, 30, 40];

console.log(arr[2]); // 30 — instant, O(1)

arr.splice(1, 0, 15); // insert 15 at index 1
// arr is now [10, 15, 20, 30, 40] — everything after index 1 had to shift`,
        walkthrough: [
          { code: "const arr = [10, 20, 30, 40];", explanation: "Creates an array of 4 numbers, stored in order." },
          { code: "arr[2]", explanation: "Jumps directly to position 2 — O(1), regardless of the array's size." },
          { code: "arr.splice(1, 0, 15);", explanation: "Inserts 15 at index 1, shifting every item after it over by one — O(n)." },
        ],
      },
    ],
    howItWorks: `
Because array elements are stored in one continuous block of memory,
accessing \`arr[i]\` is a direct calculation ("jump to this exact spot") —
constant time, or O(1). Inserting or deleting somewhere other than the end
requires shifting every following element over by one, which takes time
proportional to the array's size, or O(n).
    `.trim(),
    whyItExists: `
Fast, predictable access by position is essential for countless problems —
searching, sorting, storing sequences of steps or events. Arrays are the
default choice whenever order matters and you mostly need to read items
rather than insert them in the middle.
    `.trim(),
    whenToUse: `
Reach for an array when you need fast, predictable access to items by
their position, and you mostly read data rather than insert into the
middle — a leaderboard, a list of recent events, a lookup table by index.
    `.trim(),
    whenNotToUse: `
If your program frequently inserts or removes items from the front or
middle of a large collection, an array's O(n) shifting cost adds up — a
linked list (or a different structure entirely) may be a better fit.
    `.trim(),
    commonMistakes: [
      "Repeatedly inserting or removing items from the front of a large array, which is slower than it looks.",
      "Assuming array search by value is instant — finding a value (not an index) still requires checking items one by one, O(n).",
      "Forgetting that in JavaScript, arrays can hold mixed types, which is convenient but easy to misuse.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a function that returns the largest number in an array." },
      { difficulty: "Medium", prompt: "Write a function that reverses an array without using the built-in `.reverse()` method." },
      { difficulty: "Hard", prompt: "Write a function that removes duplicate values from an array while preserving the original order." },
    ],
    interviewQuestions: [
      { question: "Why is accessing an array by index O(1)?", answer: "Because array elements sit in contiguous memory, so the position of any index can be calculated directly, without searching." },
      { question: "Why is inserting into the middle of an array O(n)?", answer: "Because every element after the insertion point has to shift over by one position to make room." },
      { question: "When would you choose an array over a linked list?", answer: "When you need fast, random access to elements by index and don't need to frequently insert or remove items from the middle." },
      { question: "Why is `array.push()` described as *amortized* O(1) rather than plain O(1)?", answer: "Most calls to `push` just place the new element in the next available slot — O(1). But a JavaScript array's underlying storage has a fixed capacity at any moment; when it fills up, the engine allocates a new, larger block of memory and copies every existing element into it, which costs O(n) for that single push. Because capacity typically doubles on each resize, these expensive copies happen exponentially less often as the array grows, so the *average* cost per push, spread over many pushes, still comes out to O(1)." },
      { question: "Why is `array.pop()` O(1) but `array.shift()` (removing the first element) is O(n)?", answer: "`pop()` only touches the last element — it reads it and decrements the length, and nothing else needs to move. `shift()` removes the first element, which leaves a gap at index 0, so every remaining element must shift one position to the left to close that gap and keep indices contiguous — that shifting is proportional to the array's size." },
      { question: "Why is `array.unshift()` O(n)?", answer: "Inserting a new element at index 0 requires first shifting every existing element one position to the right to make room for it at the front, before the new element can be written in — that shift touches every element currently in the array." },
      { question: "What does `[10, 20, 30, 40, 50].slice(1, 3)` return, and what's the time complexity of `slice`?", answer: "It returns `[20, 30]` — elements starting at index 1 up to, but not including, index 3. Its time complexity is O(k), where k is the number of elements copied into the new array (up to O(n) if slicing the whole array), since each included element must be copied." },
      { question: "What's the key difference between `.slice()` and `.splice()`?", answer: "`.slice()` returns a new array containing a shallow copy of a portion of the original, without modifying it. `.splice()` mutates the original array directly — removing and/or inserting elements at a given position — and returns any removed elements." },
      { question: "Why is copying an array with `[...arr]` called a *shallow* copy?", answer: "It creates a new top-level array and copies each element's value into it — but if an element is itself an object or array, only the *reference* to that nested object is copied, not a separate duplicate of it. So the original and the copy still both point to the same nested object, and mutating that nested object through either one affects both." },
      { question: "Why can't you reliably use `===` to check if two arrays contain the same values?", answer: "`===` on arrays checks reference equality — whether both sides point to the exact same object in memory — not whether their contents match. Two separately-created arrays with identical elements are still different objects, so `[1,2] === [1,2]` is `false`; you'd need to compare their contents element by element (or use a helper) instead." },
      { question: "What is the time complexity of `Array.prototype.sort()` in modern JavaScript engines?", answer: "O(n log n) in the average and worst case — modern engines (e.g. V8) use hybrid algorithms like Timsort, which is comparison-based sorting, and any comparison-based sort requires at least O(n log n) comparisons to guarantee a fully ordered result in the general case." },
      { question: "Why is binary search O(log n) while a plain search through an unsorted array is O(n) — and what does binary search require that the other doesn't?", answer: "Linear search has no information about where a value might be, so in the worst case it checks every element. Binary search compares the target to the middle element and, based on that, discards half of the remaining elements each step — but this only works because the array is sorted, which is what guarantees the target must be entirely in one particular half." },
      { question: "If you only need to search an array once, is it worth sorting it first so you can binary search?", answer: "No — sorting costs O(n log n) up front, which is already more expensive than a single O(n) linear scan. Sorting-then-binary-search only pays off when you'll search the *same* array many times, since the one-time sorting cost gets amortized across many fast O(log n) searches afterward." },
      { question: "What's the time and space complexity of reversing an array in place with two pointers (one at each end, swapping and moving inward)?", answer: "O(n) time — each element is visited once as the pointers move toward the middle — and O(1) extra space, since the swaps happen directly within the existing array instead of allocating a new one." },
      { question: "What's wrong with this loop meant to print every element of an array — `for (let i = 0; i <= arr.length; i++) { console.log(arr[i]); }`?", answer: "It's an off-by-one bug: using `<=` lets `i` reach `arr.length`, which is one index past the last valid element (valid indices only go up to `arr.length - 1`), so the final iteration logs `undefined`. The condition should be `i < arr.length`." },
      { question: "Why does `delete arr[2]` behave differently from `arr.splice(2, 1)`?", answer: "`delete` removes the value stored at that index but leaves a hole there (the slot becomes empty/`undefined`) without shifting later elements or updating `.length`. `splice` actually removes the element, shifts every subsequent element left by one, and correctly shrinks `.length` by one." },
      { question: "What's the time complexity of merging two arrays with `.concat()` or the spread operator?", answer: "O(n + m), where n and m are the lengths of the two arrays, since a brand-new array is created and every element from both source arrays must be copied into it." },
      { question: "What's the time complexity of finding the maximum value in an unsorted array versus in an array already sorted ascending?", answer: "Unsorted: O(n) — every element must be checked, since any one of them could be the maximum. Sorted ascending: O(1) — the maximum is guaranteed to be the last element, so no search is needed at all." },
      { question: "If you need to repeatedly check whether values exist in a collection, why might converting the array to a `Set` first be worth it?", answer: "`array.includes()` is O(n) per check, since it may scan the whole array. Converting to a `Set` costs O(n) once, but afterward each lookup is O(1) on average, since a Set uses hashing to jump directly to where a value would be. If you're going to do many lookups, the one-time conversion cost is easily paid back." },
      { question: "For the classic \"two sum\" problem (find two numbers in an array that add up to a target), what's the time and space complexity of a brute-force approach versus a hash-map approach?", answer: "Brute force checks every pair with nested loops: O(n²) time, O(1) extra space. The hash-map approach makes a single pass, and for each number checks whether `target - number` was already seen (stored in the map): O(n) time, O(n) space — trading memory for a large speed-up." },
      { question: "For a 2D array (an array of arrays) representing a grid, what's the time complexity of accessing `grid[i][j]`?", answer: "O(1) — `grid[i]` jumps directly to the i-th row in constant time, and then `[j]` jumps directly to that row's j-th element in constant time; two O(1) operations combined are still O(1), independent of the grid's size." },
      { question: "What's the space complexity of a 2D array with n rows and m columns?", answer: "O(n × m) — one storage slot is needed for every combination of row and column, so total space scales with the product of the two dimensions, not just their sum." },
      { question: "A `for` loop and `.forEach()` are both O(n) to iterate an array — so why might the plain loop run measurably faster?", answer: "Big O only measures how work scales with input size, not the actual constant-factor cost per operation. `.forEach()` invokes a callback function on every single iteration, which carries extra overhead compared to a plain loop body — both are O(n), but with different constant factors, which Big O deliberately ignores." },
      { question: "Are `Array.isArray()` and reading `.length` ever more expensive than O(1)?", answer: "No — both are O(1) in JavaScript. `.length` is a property maintained automatically as elements are added or removed, not recalculated by counting; `Array.isArray()` just checks the object's internal type tag, not its contents." },
      { question: "Both arrays and linked lists take O(n) to fully traverse — so why do arrays tend to iterate faster in practice?", answer: "Array elements sit in one contiguous block of memory, so iterating them benefits from CPU cache locality — the processor can pre-fetch nearby memory it's likely to need next. A linked list's nodes can be scattered anywhere in memory, so each step may require a slower, uncached memory access — same Big O, different real-world constant factor." },
      { question: "What's the time complexity of rotating an array left by one position by removing the first element and pushing it to the end?", answer: "O(n) overall — `shift()` to remove the first element costs O(n), since every remaining element shifts left by one, and `push()` to add it at the end costs amortized O(1); the shift dominates, so the whole operation is O(n)." },
      { question: "Finding duplicate values in an unsorted array with nested loops is O(n²) — how does using a hash set reduce that to O(n)?", answer: "The nested-loop approach compares every element to every other element, doing roughly n² comparisons. With a hash set, you make one pass through the array, checking whether each element is already in the set (O(1) average) before adding it — reducing the total work to O(n) time, at the cost of O(n) extra space for the set." },
      { question: "What's the worst-case time complexity of `array.indexOf()`, and when does that worst case happen?", answer: "O(n) — the worst case is when the target value is the very last element or isn't in the array at all, forcing every element to be checked before the search can conclude." },
      { question: "Pushing n elements one at a time versus preallocating an array of size n and assigning by index — do they have different time complexity?", answer: "No, both are O(n) overall: pushing is amortized O(1) per call, so n pushes total O(n); assigning to a preallocated slot by index is also O(1) per assignment, so n assignments total O(n). Preallocating can avoid some of the occasional O(n) resize-and-copy operations that array growth triggers, which may lower the constant factor, but it doesn't change the asymptotic complexity." },
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
