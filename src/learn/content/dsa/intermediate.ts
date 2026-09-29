import type { Topic } from "../../types/content";

export const dsaIntermediateTopics: Topic[] = [
  {
    id: "linked-lists",
    title: "Linked Lists",
    level: "intermediate",
    description: "A chain of items where each one points to the next, instead of sitting side by side in memory.",
    explanation: `
An array keeps its items packed tightly together in memory, which is fast
to read but expensive to insert into. A **linked list** takes a different
approach: each item (called a **node**) stores its value plus a pointer to
the *next* node. The items don't need to sit next to each other in memory
at all — they're connected purely through these pointers.

This trade-off is the opposite of an array's: inserting or removing a node
is fast (you just change a couple of pointers), but finding the 5th item
means walking through the first four nodes one by one — there's no
shortcut to "jump" straight to a position.
    `.trim(),
    analogy:
      "A linked list is like a scavenger hunt: each clue tells you where to find the next one. You can't jump straight to clue #5 — you have to follow the chain from the start. But inserting a brand-new clue into the middle is easy: just point the previous clue somewhere new.",
    examples: [
      {
        title: "A simple linked list in JavaScript",
        code: `class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

const first = new Node(10);
const second = new Node(20);
first.next = second; // 10 → 20

console.log(first.value);      // 10
console.log(first.next.value); // 20`,
        walkthrough: [
          { code: "class Node { constructor(value) {...} }", explanation: "Defines the basic building block: a value plus a pointer to the next node." },
          { code: "const first = new Node(10);", explanation: "Creates the first node, holding the value 10." },
          { code: "const second = new Node(20);", explanation: "Creates a second, separate node, holding 20." },
          { code: "first.next = second;", explanation: "Links them together — first now points to second." },
          { code: "first.next.value", explanation: "Follows the pointer from first to reach second's value." },
        ],
      },
    ],
    howItWorks: `
Each node holds a value and a reference to the next node (or \`null\` if
it's the last one). To read the item at position 5, you must start at the
first node and follow \`.next\` five times — there's no way to calculate its
memory location directly, unlike an array.
    `.trim(),
    diagram: `
[10] → [20] → [30] → null
 head

To reach 30: head → next → next
    `.trim(),
    whyItExists: `
Linked lists shine when your program does a lot of inserting and removing
(especially at the front or in the middle) and doesn't need fast random
access by position. They're also the foundation for other structures, like
stacks and queues.
    `.trim(),
    whenToUse: `
Reach for a linked list when your program does a lot of inserting and
removing — especially at the front or in the middle of a collection — and
doesn't need to jump to an arbitrary position by index.
    `.trim(),
    whenNotToUse: `
If you need frequent random access by index (get the 500th item), a
linked list is a poor fit — that's O(n) here, versus O(1) for an array. In
practice, plain arrays cover most everyday JavaScript needs; reach for a
linked list mainly when building another structure (a queue, a stack) or
solving a problem that specifically calls for one.
    `.trim(),
    commonMistakes: [
      "Forgetting to update the `next` pointer when inserting a node, accidentally breaking the chain.",
      "Losing the reference to the rest of the list by overwriting a `next` pointer before saving it elsewhere.",
      "Assuming linked lists have fast random access like arrays do — they don't.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Build a linked list of 3 nodes manually and print each value by following `.next`." },
      { difficulty: "Medium", prompt: "Write a function that returns the length of a linked list by traversing it." },
      { difficulty: "Hard", prompt: "Write a function that reverses a singly linked list in place, without creating a new list." },
    ],
    interviewQuestions: [
      { question: "What's the main trade-off between arrays and linked lists?", answer: "Arrays offer fast random access (O(1)) but slow insertion/removal in the middle (O(n)), since later elements must shift. Linked lists offer fast insertion/removal (O(1), given a reference to the node) but slow access by position (O(n)), since there's no way to jump directly to an index." },
      { question: "What is a node?", answer: "The basic unit of a linked list — an object holding a value and a pointer (or pointers) to neighboring nodes." },
      { question: "What's the difference between a singly and doubly linked list?", answer: "A singly linked list's nodes only point to the `next` node, so it can only be traversed forward. A doubly linked list's nodes also point to the `prev` node, allowing traversal in both directions at the cost of one extra pointer (and its upkeep) per node." },
      { question: "Why is inserting at the front of a linked list O(1), while inserting at the front of an array is O(n)?", answer: "Inserting at the front of a linked list just means creating a new node and pointing it at the old head — nothing else moves. Inserting at the front of an array requires shifting every existing element one slot to the right to make room, which touches all n elements." },
      { question: "Why is finding the nth element O(n) in a linked list but O(1) in an array?", answer: "An array can compute an element's memory address directly from its index (base address + index × element size). A linked list has no such formula — the only way to reach the nth node is to follow `next` pointers one at a time from the head." },
      { question: "What is a circular linked list, and what's it useful for?", answer: "A linked list where the last node's `next` points back to the first node instead of to `null`, forming a loop. It's useful for things that naturally cycle, like round-robin task scheduling or a repeating playlist, where you want to keep advancing without ever hitting an end." },
      { question: "What is Floyd's cycle detection algorithm, and how does it detect a cycle using O(1) extra space?", answer: "Also called the 'tortoise and hare': walk two pointers through the list, one (`slow`) moving one node at a time and the other (`fast`) moving two nodes at a time. If the list has a cycle, `fast` will eventually enter the loop and lap `slow`, and the two pointers will land on the same node. If the list has no cycle, `fast` simply reaches `null` first. Only two pointers are used, regardless of list length, so the space cost is O(1)." },
      { question: "Why must the fast and slow pointers eventually meet if there's a cycle, instead of just missing each other forever?", answer: "Once `slow` enters the cycle, both pointers are moving within a loop of fixed length. Each step, `fast` closes the distance to `slow` by exactly one node (it gains 2 but `slow` also advances 1). Since the gap shrinks by 1 every step and wraps around a finite loop, it must eventually hit 0 — they can't perpetually skip over each other." },
      { question: "Once Floyd's algorithm finds a meeting point, how do you find the exact node where the cycle begins?", answer: "Reset one pointer to the head of the list, leave the other at the meeting point, and advance both one node at a time. The two pointers will meet again exactly at the start of the cycle — this works because of the distance relationship between the head, the cycle's start, and the meeting point that falls out of the earlier steps." },
      { question: "Walk through reversing the list `1 -> 2 -> 3 -> null` iteratively using three pointers (`prev`, `current`, `next`).", answer: "Start with `prev = null`, `current = head` (node 1). Each iteration: save `next = current.next`, then point `current.next = prev` (reversing the link), then move both `prev = current` and `current = next` forward. After processing node 1: list is `1 -> null`, prev=1. After node 2: `2 -> 1 -> null`, prev=2. After node 3: `3 -> 2 -> 1 -> null`, prev=3, current=null — loop ends and `prev` is the new head." },
      { question: "How would you reverse a singly linked list recursively, and how does its complexity compare to the iterative version?", answer: "Recurse to the end of the list first, then, as each call returns, point the next node's `next` back at the current node and set the current node's `next` to `null`. Both approaches are O(n) time, but the recursive version uses O(n) extra space for the call stack, while the iterative version uses only O(1) extra space." },
      { question: "What's a common bug when reversing a linked list iteratively?", answer: "Overwriting `current.next` to point at `prev` before saving the original `current.next` somewhere first — once overwritten, there's no way to reach the rest of the original list, so the reversal silently truncates it." },
      { question: "What is a sentinel (dummy) head node, and why does it simplify list code?", answer: "A placeholder node kept permanently at the front of the list, before the real head, whose value is never used. It means the 'real' first node is always some node's `.next` rather than the list's own head reference, so inserting or removing at the front no longer needs special-cased logic separate from insertions/removals elsewhere in the list." },
      { question: "How would you find the middle node of a linked list in a single pass, without first counting its length?", answer: "Use slow and fast pointers starting at the head: advance `slow` one node per step and `fast` two nodes per step. When `fast` reaches the end (or `null`), `slow` is sitting on the middle node, because it has covered exactly half the distance `fast` has." },
      { question: "Why does a queue built on a singly linked list need both a `head` and a `tail` pointer to keep both operations O(1)?", answer: "Dequeuing from the front only ever needs `head`. But enqueuing at the back, without a `tail` pointer, would require traversing the entire list from `head` to find the last node — making enqueue O(n). Keeping a `tail` pointer lets a new node be attached directly, in O(1)." },
      { question: "What's a subtle bug when removing a node from the middle of a singly linked list?", answer: "You can't remove a node using only a reference to that node itself — you need a reference to the *previous* node, since removal means updating the previous node's `next` to skip over the one being removed. Forgetting to track the previous node while traversing is a common cause of broken removal logic." },
      { question: "There's a trick to 'delete' a node given only a reference to it (no access to the previous node): copy the next node's value into it, then skip over the next node. Why does this fail for the last node in the list?", answer: "The trick works by making the target node effectively become its successor, then removing the now-duplicated successor. But the last node has no successor to copy from or skip over — there's nothing after it to borrow a value from, so the trick has no next node to fall back on." },
      { question: "How would you find where two singly linked lists intersect (merge into a shared tail), in O(n + m) time and O(1) extra space?", answer: "Walk both lists to find their lengths, advance the pointer on the longer list by the length difference so both pointers have the same remaining distance to the end, then advance both together one node at a time — the node where they become equal (same reference) is the intersection point." },
      { question: "How would you remove the nth node from the end of a linked list in a single pass?", answer: "Advance a `fast` pointer n nodes ahead of a `slow` pointer (both starting at a dummy head before the real head), then move both forward together until `fast` reaches the end. At that point, `slow` is sitting right before the node to remove, so `slow.next = slow.next.next` removes it." },
      { question: "How would you merge two already-sorted linked lists into a single sorted list, and what's the time complexity?", answer: "Walk both lists with two pointers, repeatedly attaching whichever current node has the smaller value to the result and advancing that list's pointer; once one list runs out, attach the rest of the other directly. This is O(n + m) time, since each node from both lists is visited exactly once, and O(1) extra space if you re-link existing nodes rather than creating new ones." },
      { question: "How would you check whether a linked list is a palindrome, ideally using O(1) extra space?", answer: "Find the middle with slow/fast pointers, reverse the second half in place, then walk the first half and the reversed second half together comparing values. If they match all the way through, it's a palindrome. This avoids the O(n) space an array copy would cost, at the cost of temporarily mutating (and optionally restoring) the list." },
      { question: "What's the extra memory cost of a doubly linked list compared to a singly linked list, per node?", answer: "One additional pointer per node (`prev`), typically 8 bytes on a 64-bit system, plus the ongoing cost of keeping that pointer correctly updated on every insertion and removal." },
      { question: "Why do a doubly linked list and a hash map together form the backbone of a classic LRU cache implementation?", answer: "The hash map gives O(1) lookup from a key to its node. The doubly linked list keeps nodes ordered by recency and, because each node knows both its neighbors, supports O(1) removal from anywhere and O(1) re-insertion at the front — exactly what's needed to move a just-accessed item to the 'most recent' end without scanning the list." },
      { question: "Why does a linked list have worse cache locality than an array, even though both are O(n) to traverse?", answer: "Array elements sit in one contiguous block of memory, so reading them sequentially is cache-friendly — the CPU can prefetch ahead. Linked list nodes are typically scattered across separately-allocated heap memory, so following `next` pointers jumps unpredictably around memory, causing more cache misses despite the same Big-O traversal cost." },
      { question: "What memory overhead does a linked list carry per element compared to a plain array of the same values?", answer: "Each node needs at least one pointer (`next`, plus `prev` for doubly linked), on top of the value itself, and each node is typically its own separate heap allocation with its own allocator bookkeeping overhead — whereas an array stores values back-to-back with no per-element pointer cost." },
      { question: "What is a circular doubly linked list, and where is it used?", answer: "A doubly linked list where the last node's `next` points to the first node and the first node's `prev` points to the last, forming a loop traversable in either direction. It shows up in things like looping playlists and in some LRU cache implementations, where wrapping around without special-casing the ends simplifies the logic." },
      { question: "What happens if a traversal loop's condition is `while (node.next)` instead of `while (node)`?", answer: "The loop body runs for every node except the last one — it stops as soon as `node.next` is `null`, meaning the final node is checked as `node` but never processed as `node.next` inside the loop, so it gets skipped even though no null-pointer error occurs." },
      { question: "Scenario: you're designing an LRU cache needing O(1) `get` and O(1) `put`. Why is a hash map or array alone insufficient?", answer: "A hash map alone gives O(1) lookup but no way to track *order of recency* or cheaply evict the least-recently-used item without scanning. An array can track order but costs O(n) to move an accessed item to the front or to remove an arbitrary item. Combining a hash map (for O(1) key lookup) with a doubly linked list (for O(1) reordering and eviction at either end) gives both properties at once." },
      { question: "What's the time complexity of accessing the head, the tail, and an arbitrary middle element of a singly linked list with only a head pointer?", answer: "Head: O(1), since it's directly referenced. Tail: O(n), since you must walk the whole list without a separate tail pointer. Middle: O(n), since reaching any position requires following `next` pointers from the head." },
    ],
    prerequisites: ["arrays"],
    relatedTopics: ["arrays", "stack", "queue"],
    keywords: ["linked list", "node", "pointer", "traversal"],
  },
  {
    id: "stack",
    title: "Stack",
    level: "intermediate",
    description: "A structure where the last item added is always the first one removed.",
    explanation: `
Some problems naturally need to process things in reverse order of how
they arrived — undo history, nested function calls, matching brackets. A
**stack** is a structure built exactly for that: you can only add ("push")
or remove ("pop") from one end, called the top, and whatever was added
most recently is always the first thing to come back out.

This rule is called **LIFO** — Last In, First Out.
    `.trim(),
    analogy:
      "A stack is like a stack of plates. You add a new plate on top, and when you need one, you take the top plate off first — you'd never pull one from the bottom without disturbing everything above it.",
    examples: [
      {
        title: "Using an array as a stack",
        code: `const stack = [];

stack.push(1); // [1]
stack.push(2); // [1, 2]
stack.push(3); // [1, 2, 3]

console.log(stack.pop()); // 3 — removes and returns the top item
console.log(stack);       // [1, 2]`,
        explanation:
          "`push` and `pop` both operate on the end of the array, which is exactly how a stack behaves — no special data structure is required in JavaScript.",
        walkthrough: [
          { code: "const stack = [];", explanation: "An empty array, used here as a stack." },
          { code: "stack.push(1);", explanation: "Adds 1 to the top." },
          { code: "stack.push(2); stack.push(3);", explanation: "Adds 2, then 3 — 3 is now on top." },
          { code: "stack.pop();", explanation: "Removes and returns the top item, 3, leaving [1, 2]." },
        ],
      },
    ],
    howItWorks: `
A stack only exposes two main operations: \`push\` (add to the top) and
\`pop\` (remove from the top) — both O(1), since neither requires touching
any other item. There's no direct way to access an item in the middle
without first removing everything above it.
    `.trim(),
    diagram: `
push(1)   push(2)   push(3)     pop()
   ↓         ↓         ↓          ↓
  [1]      [1,2]    [1,2,3]    returns 3, leaves [1,2]
    `.trim(),
    whyItExists: `
Many real problems are naturally last-in-first-out: undo/redo history,
tracking function calls (the call stack!), and checking that brackets or
parentheses are balanced. A stack models that behavior directly and simply.
    `.trim(),
    whenToUse: `
Reach for a stack whenever the most recent thing needs to come out first
— undo history, matching brackets or parentheses, or tracking a path
while backtracking through a maze or a tree.
    `.trim(),
    whenNotToUse: `
If you need to process items in the order they arrived (not the
reverse), you want a queue, not a stack. And if you need to inspect or
remove an item from the middle regularly, a stack's "only touch the top"
rule will fight you.
    `.trim(),
    commonMistakes: [
      "Trying to access the middle of a stack directly instead of popping down to it.",
      "Popping from an empty stack without checking first, causing errors or `undefined`.",
      "Confusing a stack (LIFO) with a queue (FIFO) — they solve different problems.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Implement a `Stack` class with `push`, `pop`, and `peek` (view the top without removing it) methods." },
      { difficulty: "Medium", prompt: "Use a stack to check whether a string of parentheses like `\"(()())\"` is balanced." },
      { difficulty: "Hard", prompt: "Use a stack to reverse the words in a sentence without using built-in reverse methods." },
    ],
    interviewQuestions: [
      { question: "What does LIFO mean?", answer: "Last In, First Out — the most recently added item is always the first one removed." },
      { question: "What is a real-world use of a stack in programming?", answer: "The call stack itself, which tracks function calls; also undo/redo features, balanced-bracket checking, and browser back/forward-style history." },
      { question: "What's the time complexity of push and pop?", answer: "Both are O(1) — they only ever touch the top item, with no need to shift or scan anything else." },
      { question: "Compare an array-based stack to a linked-list-based one — what are the real tradeoffs?", answer: "An array-based stack stores elements contiguously, giving better cache locality, but a dynamic array occasionally needs to resize (an O(n) copy) as it grows. A linked-list-based stack gives a guaranteed O(1) per operation with no resizing, but pays extra memory for a pointer per node and has worse cache locality since nodes may be scattered across memory." },
      { question: "What does 'amortized O(1)' mean for pushing onto a dynamic array-based stack, given that resizing is O(n)?", answer: "When the backing array fills up, it's typically resized by doubling its capacity, which costs O(n) to copy existing elements. But doubling means that expensive resize happens exponentially less often as the stack grows — the total cost of all resizes across n pushes works out to O(n), which spreads to O(1) per push on average, even though any single resizing push briefly costs O(n)." },
      { question: "What happens if you try to push onto a fixed-capacity array-based stack that's already full?", answer: "In a truly fixed-size implementation, it overflows — typically by throwing an error or refusing the push. A dynamic implementation instead detects the full condition and triggers a resize to a larger backing array before completing the push." },
      { question: "Is a call stack overflow the same kind of thing as overflowing a fixed-size custom stack?", answer: "Conceptually yes — both mean exceeding the stack's available capacity. The call stack's limit comes from the fixed amount of memory the OS/engine reserves for stack frames (exceeded by recursing too deeply); a custom stack's limit is whatever capacity its backing storage was given." },
      { question: "How would you design a stack that supports `push`, `pop`, and `getMin()` (current minimum) all in O(1)?", answer: "Maintain a second, auxiliary stack alongside the main one that tracks the minimum at each point. On every push, also push the smaller of (new value, current auxiliary top) onto the auxiliary stack. On every pop, pop from both stacks together. `getMin()` just peeks the auxiliary stack's top — no scanning needed." },
      { question: "Trace a min-stack: push 5, push 3, push 7, push 3, pop, pop. What does `getMin()` return after each step?", answer: "push 5: main [5], min-stack [5], min=5. push 3: main [5,3], min-stack [5,3], min=3. push 7: main [5,3,7], min-stack [5,3,3] (7 isn't smaller than 3, so 3 repeats), min=3. push 3: main [5,3,7,3], min-stack [5,3,3,3], min=3. pop: removes 3 from both, main [5,3,7], min-stack [5,3,3], min=3. pop: removes 7 from both, main [5,3], min-stack [5,3], min=3. The repeated 3 in the min-stack is exactly what preserves the correct minimum after the top 3 was popped." },
      { question: "How would you evaluate the postfix expression `\"3 4 + 2 *\"` using a stack?", answer: "Scan left to right: push 3, push 4. On seeing `+`, pop two values (4, then 3), compute 3 + 4 = 7, push 7. On seeing 2, push 2. On seeing `*`, pop two values (2, then 7), compute 7 * 2 = 14, push 14. At the end, the stack holds only the result, 14." },
      { question: "Why does evaluating postfix notation require a stack instead of computing left to right immediately?", answer: "An operator can combine two operands that were themselves the results of earlier computations, not just the raw numbers seen so far. The stack holds every intermediate result until an operator arrives that needs it, so results computed several steps earlier remain available exactly when needed." },
      { question: "How would you check whether a string like `\"{[()]}\"` has properly balanced brackets, using a stack?", answer: "Scan the string; on an opening bracket, push it. On a closing bracket, pop the stack and check that it matches the corresponding opening bracket — if it doesn't match (or the stack is empty), the string is unbalanced. At the end, the string is balanced only if the stack is empty." },
      { question: "Why does checking `\"([)]\"` for balance require tracking order with a stack, rather than just counting each bracket type?", answer: "The counts of `(`, `)`, `[`, and `]` all match in `\"([)]\"`, but the nesting is invalid — the `)` closes before the `[` that opened after it has been closed. Only an order-sensitive structure like a stack catches this: when `)` arrives, the stack's top is `[`, which doesn't match, correctly flagging it as unbalanced." },
      { question: "How would you implement a queue using two stacks?", answer: "Keep an 'in' stack for enqueuing (just push) and an 'out' stack for dequeuing. To dequeue, if the 'out' stack is empty, pop everything off 'in' and push it onto 'out' — this reverses the order so the oldest enqueued item ends up on top of 'out' — then pop from 'out'. If 'out' isn't empty, just pop from it directly." },
      { question: "What's the amortized time complexity of dequeue in the two-stack queue, even though one dequeue can move every element between stacks?", answer: "Amortized O(1). Each element is pushed onto 'in' once and moved to 'out' at most once over its entire lifetime in the queue — so across any sequence of n operations, the total number of moves is bounded by roughly 2n, which averages out to O(1) work per operation even though a single dequeue can occasionally cost O(n)." },
      { question: "What is the 'next greater element' problem, and how does a stack solve it in O(n) instead of O(n²)?", answer: "For each element, find the first element to its right that's larger. The naive approach checks every pair, O(n²). A stack-based approach scans left to right, maintaining a stack of indices whose 'next greater' hasn't been found yet; whenever the current value is bigger than the stack's top, that top index's answer is the current value, so it's popped and resolved. Each index is pushed and popped at most once, making the total work O(n)." },
      { question: "How would you reverse a string (or a list's order) using a stack, and what's the space cost?", answer: "Push every character (or item) onto a stack, then pop them all off — since a stack reverses insertion order, popping everything back out yields the reverse. This costs O(n) extra space, since every element must be held on the stack simultaneously before any of them come back off." },
      { question: "Why should code check whether a stack is empty before calling `pop()` or `peek()`?", answer: "Popping or peeking an empty stack is undefined behavior in the sense that it has no top item to return — depending on the implementation, it may throw, return `undefined`, or (in a fixed-size array with an index counter) underflow the counter into an invalid state. Checking emptiness first avoids all of these failure modes." },
      { question: "How is the call stack itself an instance of the abstract stack data structure?", answer: "Each function call pushes a new stack frame holding that call's local variables, parameters, and a return address. When the function returns, its frame is popped and execution resumes in the caller at the saved return address — exactly LIFO behavior, since the most recently called (and not-yet-returned) function is always the next one to finish." },
      { question: "How would you convert a recursive function into an iterative one using an explicit stack, and why does this always work?", answer: "Maintain your own stack of 'pending work' (e.g. the arguments or state each recursive call would have used), and loop: pop a unit of work, process it, and push any further work it generates instead of recursing into it. This works in principle because recursion is itself implemented via the call stack — manually managing an equivalent stack lets you simulate the same call-and-return behavior without relying on the language's own call stack." },
      { question: "How does a browser's back/forward navigation map onto stack operations?", answer: "Visiting a new page pushes it onto a 'back' stack (and typically clears the 'forward' stack, since that history branch is no longer valid). Clicking back pops the current page off 'back' and pushes it onto 'forward'. Clicking forward does the reverse — pop from 'forward', push onto 'back'." },
      { question: "Why is peeking at a stack's top O(1), but checking whether a value exists anywhere in the stack O(n)?", answer: "Peek only ever reads the top element, a fixed single access regardless of size. Searching for an arbitrary value has no shortcut — since only the top is directly reachable, determining whether a value exists elsewhere requires inspecting (or popping) down through potentially every element." },
      { question: "What's the difference between a stack overflow and a stack underflow?", answer: "Overflow means exceeding capacity — pushing past a fixed-size stack's limit, or in the call stack, recursing so deeply that available stack memory runs out. Underflow means the opposite: attempting to pop or peek an already-empty stack, where there's nothing left to remove." },
      { question: "Scenario: you're building undo/redo. Why use two separate stacks instead of one?", answer: "Undoing an action needs to pop it off an undo stack, but that action must then be available to redo later — which means pushing it onto a *separate* redo stack. A single stack can't simultaneously represent 'actions waiting to be undone' and 'actions that were undone and could be reapplied' as two distinct, independently poppable sequences." },
      { question: "How would you sort a stack into ascending order using only one additional stack?", answer: "Repeatedly pop from the original stack; for each popped element, pop elements off the auxiliary (sorted) stack back onto the original stack until the auxiliary stack's top is not greater than the current element, then push the current element onto the auxiliary stack. Repeating until the original stack is empty leaves the auxiliary stack sorted, though at O(n²) time since each insertion can require re-shuffling much of the auxiliary stack." },
      { question: "Why is a stack the natural structure for validating that HTML/XML tags are properly nested and closed?", answer: "Each opening tag is pushed onto the stack. Each closing tag must match the most recently opened, still-unclosed tag — exactly the stack's top — so popping and comparing on every closing tag directly checks proper nesting, the same way bracket matching does." },
    ],
    prerequisites: ["linked-lists"],
    relatedTopics: ["queue", "recursion", "linked-lists"],
    keywords: ["stack", "LIFO", "push", "pop", "call stack"],
  },
  {
    id: "queue",
    title: "Queue",
    level: "intermediate",
    description: "A structure where the first item added is always the first one removed.",
    explanation: `
Some problems need to be processed in the exact order they arrived — a
printer processing print jobs, customer support tickets, tasks waiting to
run. A **queue** models this directly: items are added at the back and
removed from the front, so whatever arrived first leaves first.

This rule is called **FIFO** — First In, First Out.
    `.trim(),
    analogy:
      "A queue is like a line at a coffee shop. New people join at the back, and the person who's been waiting longest is always served next, from the front.",
    examples: [
      {
        title: "Using an array as a queue",
        code: `const queue = [];

queue.push("first");  // ["first"]
queue.push("second");  // ["first", "second"]

console.log(queue.shift()); // "first" — removes and returns the front item
console.log(queue);         // ["second"]`,
        explanation:
          "`push` adds to the back; `shift` removes from the front — together they behave like a queue. Note that `shift` is O(n) on a plain array since every remaining item shifts down.",
        walkthrough: [
          { code: "const queue = [];", explanation: "An empty array, used here as a queue." },
          { code: 'queue.push("first");', explanation: 'Adds "first" to the back.' },
          { code: 'queue.push("second");', explanation: 'Adds "second" to the back, behind "first".' },
          { code: "queue.shift();", explanation: 'Removes and returns the front item, "first", leaving ["second"].' },
        ],
      },
    ],
    howItWorks: `
A queue exposes two main operations: **enqueue** (add to the back) and
**dequeue** (remove from the front). Conceptually both should be O(1); in
JavaScript, using a plain array's \`.shift()\` is actually O(n) because
everything has to shift down, so real-world queues are often implemented
with a linked list to keep both ends O(1).
    `.trim(),
    diagram: `
enqueue("A")  enqueue("B")  dequeue()
     ↓             ↓            ↓
   [A]           [A,B]      returns "A", leaves [B]
    `.trim(),
    whyItExists: `
Queues naturally model anything processed in arrival order: task
scheduling, message processing, handling requests in the order they came
in, and breadth-first traversal of trees and graphs.
    `.trim(),
    whenToUse: `
Reach for a queue whenever things must be handled in the exact order
they arrived — a task queue, a message queue, print jobs, or breadth-first
traversal of a tree or graph.
    `.trim(),
    whenNotToUse: `
If the most recent item should be handled first instead of the oldest,
you want a stack, not a queue. And for a high-throughput queue in real
code, avoid a plain array's \`.shift()\` — reach for a linked-list-based
queue or a dedicated library instead.
    `.trim(),
    commonMistakes: [
      "Confusing a queue's FIFO order with a stack's LIFO order.",
      "Using `.shift()` on a large array in performance-sensitive code without realizing it's O(n), not O(1).",
      "Forgetting to check whether a queue is empty before dequeuing.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Implement a `Queue` class with `enqueue` and `dequeue` methods." },
      { difficulty: "Medium", prompt: "Use a queue to simulate people being served in a waiting line, printing the order they're served in." },
      { difficulty: "Hard", prompt: "Use a queue to implement a breadth-first traversal over a simple tree of nested objects." },
    ],
    interviewQuestions: [
      { question: "What does FIFO mean?", answer: "First In, First Out — the earliest added item is always the first one removed." },
      { question: "What's a real-world use of a queue in software?", answer: "Task/job scheduling, request handling, and breadth-first search over trees and graphs." },
      { question: "Why is `.shift()` on a JavaScript array not ideal for a high-performance queue?", answer: "Because it's O(n) — every remaining element has to move down by one index. A linked-list-based queue keeps both ends O(1)." },
      { question: "What is a circular buffer (ring buffer), and how does it give a queue O(1) enqueue and dequeue using a fixed-size array?", answer: "It reuses a fixed-size array by tracking a `head` index (where the next dequeue reads from) and a `tail` index (where the next enqueue writes to), both wrapping back to 0 via modulo once they reach the end of the array. Since neither operation shifts existing elements — they just read/write at the tracked index and advance it — both stay O(1)." },
      { question: "In a circular buffer, `head` and `tail` can both equal the same index whether the buffer is empty or completely full — how do implementations tell the two apart?", answer: "By keeping a separate `count` (or `size`) field alongside `head`/`tail` — comparing head/tail alone is ambiguous. Some implementations instead reserve one array slot as always-unused, so 'full' means `(tail + 1) % capacity === head`, distinct from 'empty' meaning `head === tail`." },
      { question: "Walk through enqueueing A, B, C and then dequeuing once, on an initially empty circular buffer of capacity 4. Where do `head` and `tail` end up?", answer: "Start: head=0, tail=0, count=0. enqueue(A): buffer[0]=A, tail becomes 1, count=1. enqueue(B): buffer[1]=B, tail becomes 2, count=2. enqueue(C): buffer[2]=C, tail becomes 3, count=3. dequeue(): returns buffer[head]=A, head becomes 1, count=2. Final state: head=1, tail=3, count=2, holding B and C." },
      { question: "Why must resizing a full circular buffer copy elements starting from `head`, rather than just copying the raw backing array index-by-index?", answer: "The logical order of items wraps around once `tail` has passed index 0, so raw array order (index 0, 1, 2, ...) no longer matches insertion order — copying it directly would scramble which item is oldest. Copying starting from `head` and wrapping around exactly `count` times reproduces the correct logical order in the new, larger array." },
      { question: "What is a deque (double-ended queue), and how does it differ from a plain queue?", answer: "A deque supports O(1) insertion and removal at *both* ends — front and back — rather than only enqueue-at-back and dequeue-at-front. A plain queue can be thought of as a deque restricted to just those two operations." },
      { question: "What is a priority queue, and what does it typically use for insert/extract, along with the complexity of those operations?", answer: "A priority queue always returns the highest- (or lowest-) priority item next, regardless of arrival order. It's typically implemented with a binary heap: insert is O(log n), extract-min/max is O(log n), and peeking at the top priority item is O(1)." },
      { question: "Why doesn't a plain unsorted list or a sorted array make a good priority queue?", answer: "An unsorted list needs an O(n) scan to find the highest-priority item on every extraction. A sorted array keeps extraction O(1) but every insertion costs O(n) to shift elements and keep it sorted. A binary heap instead gives O(log n) for both insert and extract, which balances much better when both operations happen repeatedly." },
      { question: "Building a binary heap from n elements one at a time (n inserts) costs O(n log n) — but there's a way to build one from an existing array in O(n). What is it, and why is it faster?", answer: "Bottom-up heapify: starting from the last non-leaf node and working backward to the root, sift each node down into place. Most nodes sit near the bottom of the tree and need very few swaps to settle, and the total work across all nodes — weighted by how many are near the bottom versus the top — sums to O(n), not O(n log n), unlike inserting one at a time into an initially empty heap." },
      { question: "What is a monotonic queue (or deque), and what classic problem does it solve in O(n) instead of O(n·k)?", answer: "The sliding window maximum problem. A monotonic deque keeps only indices whose values are in strictly decreasing order from front to back; before pushing a new index, any indices at the back with smaller values are popped off, since they can never be the max again once a larger, later value is in the window. The front always holds the current window's max, and since each index is pushed and popped at most once overall, the whole array is processed in O(n) instead of recomputing each window's max from scratch." },
      { question: "How does breadth-first search (BFS) use a queue, and what happens if you swap in a stack instead?", answer: "BFS enqueues a node's newly discovered neighbors and dequeues from the front, so nodes are explored in the order they were discovered — level by level. Swapping in a stack means the *most recently* discovered node gets explored next instead, which produces depth-first order — a genuinely different traversal, not just a slower BFS." },
      { question: "Why is a queue (not a stack) the structure behind a level-order tree traversal?", answer: "Level order requires visiting every node at depth d before any node at depth d+1. A queue's FIFO order guarantees that: nodes are dequeued (and their children enqueued) in the same order they were discovered, so an entire level drains before the next level's nodes — enqueued after them — are ever reached." },
      { question: "What's the amortized time complexity of dequeue in a queue implemented with two stacks (`in` and `out`), and why can a single call still cost O(n)?", answer: "Amortized O(1). A dequeue that finds `out` empty must pop every element off `in` and push it onto `out` — an O(n) operation that one time — but each element makes that in-to-out move at most once during its entire lifetime in the queue, so the total cost across n operations is bounded by O(n), spreading to O(1) per operation on average." },
      { question: "Why does a linked-list-based queue need a reference to both the head and the tail node, when a stack built the same way only needs one?", answer: "A stack only ever touches one end (the top), so a single pointer suffices. A queue touches both ends — dequeuing from the front, enqueuing at the back — so without a direct `tail` reference, enqueuing would require walking the entire list from `head` to find the last node, making it O(n) instead of O(1)." },
      { question: "What is a blocking queue, and where does it show up in concurrent programming?", answer: "A queue where dequeuing from an empty queue (or enqueuing to a full, bounded one) makes the calling thread wait instead of erroring immediately. It's the backbone of producer-consumer designs — like a thread pool's task queue — letting producers and consumers safely hand off work without busy-polling." },
      { question: "How does a JavaScript runtime's event loop use a queue?", answer: "Callbacks scheduled as macrotasks — like `setTimeout` callbacks or I/O completions — are placed on a task queue and executed one at a time, in the order they were queued (FIFO), interleaved with rendering and other work. It's a direct, real-world use of the queue data structure inside the language runtime itself." },
      { question: "What's the time and space complexity of enqueue/dequeue on a well-implemented queue (linked list or circular buffer), versus using `.shift()` on a plain array?", answer: "O(1) time and O(1) extra space per operation for both a linked-list-based queue (with head and tail pointers) and a circular buffer (until it needs to resize). `.shift()` on a plain array is O(n) time, since every remaining element must move down one index to fill the gap." },
      { question: "Scenario: a task scheduler must process tasks in submission order, and thousands are submitted per second. Why would `array.push()` + `array.shift()` become a bottleneck, and what's the fix?", answer: "`.shift()` is O(n), so draining n tasks costs O(n²) total as the queue empties — at high throughput this quickly dominates. A circular buffer or linked-list-based queue keeps both enqueue and dequeue O(1), so processing n tasks costs O(n) overall instead." },
      { question: "What's a common off-by-one bug when implementing a circular buffer's wraparound?", answer: "Forgetting the modulo operator when advancing `head`/`tail` — writing `tail = tail + 1` instead of `tail = (tail + 1) % capacity` — which lets the index walk straight past the end of the backing array instead of wrapping back to 0." },
      { question: "What happens if you call dequeue on an empty queue without checking first?", answer: "Depending on the implementation, it either throws, returns `undefined`/`null`, or — in a hand-rolled circular buffer that tracks raw indices without a count check — reads stale leftover data or corrupts the head/tail bookkeeping. Checking emptiness before dequeuing avoids all of these failure modes." },
      { question: "Compare a circular-buffer-based queue to a linked-list-based queue in terms of memory layout and cache behavior.", answer: "A circular buffer stores elements contiguously in one pre-allocated array, so sequential access is cache-friendly, though its capacity is fixed until an explicit O(n) resize. A linked-list-based queue never needs a bulk resize and grows one node at a time, but each node is typically a separate heap allocation, making traversal more likely to cause cache misses, plus a per-node pointer's extra memory cost." },
      { question: "Trace these operations on an initially empty queue: enqueue(1), enqueue(2), dequeue(), enqueue(3), dequeue(), dequeue(). What does each dequeue return, and what's left at the end?", answer: "enqueue(1) → [1]. enqueue(2) → [1,2]. dequeue() returns 1, leaving [2]. enqueue(3) → [2,3]. dequeue() returns 2, leaving [3]. dequeue() returns 3, leaving it empty — each dequeue removes from the front, in the same order items were enqueued." },
      { question: "Why would you choose a priority queue over a regular queue for a hospital ER's 'next patient' system?", answer: "A regular queue serves strictly in arrival order (FIFO), but an ER needs to serve the most urgent patient next, regardless of arrival time. A priority queue orders by an assigned priority (urgency) instead of arrival time, extracting the highest-priority patient in O(log n) via a heap, each time a slot opens up." },
      { question: "What single difference between a stack and a queue — which end each operation happens at — changes the order items come out in?", answer: "A stack adds and removes from the *same* end (the top): LIFO, most recently added comes out first. A queue adds at one end and removes from the *other*: FIFO, the oldest comes out first. The exact same sequence of insertions comes back out in opposite orders from the two structures." },
      { question: "What's the amortized time complexity of processing an entire n-element array through a monotonic queue (sliding window maximum), given that a single step can pop several elements at once?", answer: "O(n) amortized. A single new element can trigger popping several smaller elements from the back of the deque, but every element is pushed onto the deque exactly once and popped at most once across the whole run — so the total number of push/pop operations over all n steps is bounded by O(n), not O(n) per individual step." },
      { question: "Why is a queue the right structure (not a stack) for a print spooler shared by many users?", answer: "Fairness: the first job submitted should be the first one printed, regardless of who submitted it — exactly FIFO. A stack would print the most recently submitted job first, so an early job could be starved indefinitely by a steady stream of newer ones, the opposite of what a shared print queue needs." },
      { question: "What's the difference between a bounded queue and an unbounded queue, and what does 'bounded' change about enqueue?", answer: "An unbounded queue can grow to hold as many items as available memory allows. A bounded queue has a fixed maximum capacity, so an enqueue attempt while it's already full must either reject the new item, block until space frees up (as in a blocking queue), or evict something (like the oldest item) — rather than always succeeding immediately." },
    ],
    prerequisites: ["stack"],
    relatedTopics: ["stack", "linked-lists"],
    keywords: ["queue", "FIFO", "enqueue", "dequeue"],
  },
  {
    id: "hash-tables",
    title: "Hash Tables",
    level: "intermediate",
    description: "A structure that lets you look up a value almost instantly using a key, instead of searching through everything.",
    explanation: `
Searching an array for a value means checking items one at a time until
you find it — slow once there's a lot of data. A **hash table** solves
this by converting a key (like a name or an id) into a number using a
**hash function**, and using that number to jump directly to where the
value is stored. In JavaScript, plain objects and the \`Map\` class are both
backed by this idea.
    `.trim(),
    analogy:
      "A hash table is like a coat check at a theater. Instead of searching through every coat to find yours, you're handed a numbered ticket (the hash), and the attendant goes directly to that numbered spot to retrieve your coat.",
    examples: [
      {
        title: "Using an object (or Map) as a hash table",
        code: `const ages = {};

ages["amara"] = 28;
ages["diego"] = 34;

console.log(ages["amara"]); // 28 — near-instant lookup, not a search

const map = new Map();
map.set("amara", 28);
console.log(map.get("amara")); // 28`,
        walkthrough: [
          { code: "const ages = {};", explanation: "An empty object, used here as a hash table." },
          { code: 'ages["amara"] = 28;', explanation: 'Stores 28 under the key "amara".' },
          { code: 'ages["diego"] = 34;', explanation: "Stores 34 under a different key." },
          { code: 'ages["amara"]', explanation: 'Jumps directly to the slot for "amara" — no scanning required.' },
        ],
      },
    ],
    howItWorks: `
A hash function takes a key and converts it into a number (a "hash") that
maps to a specific storage slot. Looking up a key just means: hash the
key, jump to that slot, and read the value — no scanning required. When
two different keys happen to hash to the same slot (a "collision"), the
table has strategies (like storing a small list at that slot) to handle
it correctly.
    `.trim(),
    diagram: `
key "amara"
       ↓ hash function
    number: 42
       ↓
   slot 42 → 28
    `.trim(),
    whyItExists: `
Hash tables give near-instant lookups, insertions, and deletions on
average — O(1) — which makes them essential for counting frequencies,
caching results, deduplicating data, and implementing sets and dictionaries
efficiently.
    `.trim(),
    whenToUse: `
Reach for a hash table (object or Map) whenever you need to look
something up by a key quickly — counting occurrences, checking for
duplicates, caching results, or building a dictionary of any kind.
    `.trim(),
    whenNotToUse: `
If order matters and you need to process items in a specific sequence, a
hash table doesn't guarantee position the way an array does. And for a
small, fixed handful of values, just checking each one directly can beat
setting up a hash table at all.
    `.trim(),
    commonMistakes: [
      "Assuming object/array key order is always guaranteed in every situation — it mostly is in modern JavaScript for string keys, but it's a detail worth knowing rather than relying on blindly.",
      "Using an object when a `Map` would be safer, e.g. when keys aren't simple strings or when key order and size (`.size`) matter.",
      "Forgetting that average-case O(1) lookup can degrade if many keys collide (a rare but real edge case).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use an object to count how many times each word appears in a sentence." },
      { difficulty: "Medium", prompt: "Write a function that returns `true` if an array contains any duplicate values, using a hash table for O(n) performance." },
      { difficulty: "Hard", prompt: "Solve the 'two sum' problem (find two numbers in an array that add up to a target) in O(n) time using a hash table." },
    ],
    interviewQuestions: [
      { question: "What is a hash function?", answer: "A function that converts a key into a number used to determine where its value is stored, ideally spreading keys evenly across storage slots." },
      { question: "What is the average time complexity of a hash table lookup?", answer: "O(1) on average, since the hash function typically jumps directly to the right slot." },
      { question: "What is a hash collision, and how is it handled?", answer: "A collision happens when two different keys hash to the same slot. It's commonly handled by storing multiple entries at that slot (e.g. in a small list) and checking each one." },
      { question: "What three properties should a good hash function have?", answer: "It should be deterministic (the same key always produces the same hash), fast to compute (so it doesn't erase the O(1) benefit), and spread keys uniformly across the available slots to minimize collisions and keep chains/probe sequences short." },
      { question: "What is the load factor of a hash table, and why does it matter?", answer: "The ratio of stored entries to the number of slots (`n / capacity`). As load factor rises, more keys compete for the same slots, so collisions become more likely and chains (or probe sequences) get longer — pushing lookup/insert time away from O(1) and toward O(n) in the worst case. Implementations resize once load factor crosses a threshold to keep it bounded." },
      { question: "Why is resizing a hash table (rehashing) an O(n) operation, and why doesn't that ruin the 'O(1) average' claim for insertion?", answer: "Resizing allocates a larger backing array and reinserts every existing entry, since each entry's slot depends on `hash(key) % capacity` — a different capacity means a different slot for almost every key. This is O(n), but resizes happen exponentially less often as the table grows (typically when doubling capacity), so — exactly like a dynamic array — the cost amortizes to O(1) per insertion on average across a sequence of operations." },
      { question: "What is separate chaining, and what does it cost in the worst case if every key hashes to the same slot?", answer: "Each slot holds a small secondary structure (commonly a linked list, sometimes a balanced tree) of all entries that hashed there; looking up a key means hashing to find the slot, then scanning that slot's structure for a match. If every key collided into one slot, that structure would hold all n entries, degrading lookup to O(n) — the same as a linear scan." },
      { question: "What is open addressing, and how does linear probing resolve a collision under it?", answer: "Unlike chaining, open addressing stores every entry directly in the backing array itself with no secondary structure. On a collision, linear probing just checks the next slot (`(hash + 1) % capacity`), then the next, and so on, until an empty slot is found — insertion and lookup both follow the same probe sequence." },
      { question: "What is primary clustering in linear probing, and why does it make things worse as load factor rises?", answer: "Once several keys collide near each other, linear probing places them in one unbroken run of occupied slots. Any new key that hashes anywhere into that run has to probe through the whole cluster to find a free slot, and every insertion into the cluster makes it longer — so clusters tend to grow and merge, degrading average probe length well before load factor gets close to 1." },
      { question: "How does quadratic probing try to reduce clustering compared to linear probing, and what's the tradeoff?", answer: "Instead of checking the next slot, it checks slots at increasing squared offsets (`hash+1², hash+4, hash+9...`), scattering probes further from the original slot so keys colliding at the same start point don't pile into one contiguous run. The tradeoff is *secondary* clustering: keys that hash to the exact same original slot still follow the identical probe sequence as each other." },
      { question: "How does double hashing address both primary and secondary clustering?", answer: "It computes the probe step size from a *second* hash function of the key, so keys that collide at the same slot from the first hash almost always take different step sizes and follow different probe sequences — unlike linear probing (same fixed step for everyone) or quadratic probing (same fixed offsets for everyone colliding at that slot)." },
      { question: "Why can't you just delete an entry from an open-addressing hash table by clearing its slot to empty?", answer: "Probing relies on scanning a contiguous (or formulaic) sequence of occupied slots until it hits an *empty* one to know a key isn't present. If a slot in the middle of a probe sequence is cleared to empty after deletion, a later lookup for a different key that probed *past* that slot will stop early there and incorrectly conclude the key isn't present, even though it's stored further along." },
      { question: "How do open-addressing hash tables actually support deletion, given the problem with clearing a slot outright?", answer: "They mark the deleted slot with a special 'tombstone' marker instead of empty. Lookups treat a tombstone as 'occupied, keep probing past it,' while insertions treat it as available to reuse — preserving correct probing for existing keys while still letting the slot be reclaimed." },
      { question: "Why does average-case hash table lookup stay close to O(1) even though the worst case is O(n)?", answer: "With a good hash function and a load factor kept below some bound (via resizing), the *expected* number of entries sharing any slot stays close to a small constant, independent of n — the O(n) worst case only shows up in the pathological scenario where most or all keys collide into the same slot." },
      { question: "What is a 'hash flooding' attack, and how do some languages defend against it?", answer: "An attacker who knows (or can guess) a hash function crafts many keys that all collide into the same slot on purpose, driving that server's hash table operations toward O(n) each and causing a denial-of-service. Some languages/runtimes defend by seeding the hash function with a random value at process startup, so an attacker can't predict which keys will collide without knowing the runtime's secret seed." },
      { question: "What is the practical difference between using a plain JavaScript object and a `Map` as a hash table?", answer: "`Map` allows any value (including objects and functions) as a key with reference equality, reliably preserves insertion order, and reports its size directly via `.size`. A plain object effectively coerces non-symbol keys to strings, mixes in inherited properties from its prototype unless guarded against, and reorders integer-like keys numerically ahead of everything else." },
      { question: "Two different object instances with identical contents are used as keys in a JavaScript `Map` — are they treated as the same key?", answer: "No. `Map` key comparison for objects uses reference identity (are they literally the same object in memory), not structural/value equality — two distinct objects with identical properties are two distinct keys, even though both look like `{ a: 1 }`." },
      { question: "Why is `NaN` a usable `Map` key, given that `NaN !== NaN` in JavaScript?", answer: "`Map` uses the SameValueZero algorithm for key comparison, not strict equality (`===`). SameValueZero treats `NaN` as equal to itself — the one case where it differs from `===` — so `map.set(NaN, 1)` followed by `map.get(NaN)` reliably returns `1`." },
      { question: "What's the time complexity of checking whether an array contains any duplicate values, using a hash table versus not?", answer: "With a hash table (a `Set`), it's O(n) — one pass inserting each element and checking whether it's already present, each check O(1) average. Without one, comparing every pair is O(n²); sorting first and scanning for adjacent duplicates is O(n log n) — better than brute force but still worse than the hash-table approach." },
      { question: "How does the 'two sum' problem go from O(n²) to O(n) using a hash table?", answer: "Brute force checks every pair of numbers for one that sums to the target, O(n²). Instead, walk the array once, and for each number check whether `target - number` has already been seen (stored in a hash map from value to index); if so, the pair is found immediately. Since each lookup and insert is O(1) average, the whole pass is O(n)." },
      { question: "Why can't you efficiently binary-search or iterate a hash table in sorted key order the way you can an array?", answer: "A hash table's slot for a key is determined by that key's hash value, not by any relationship to other keys' order — similar keys can land in completely unrelated slots. There's no ordering to exploit, so finding a range or the minimum/maximum key requires scanning every entry, O(n), regardless of the O(1) average lookup for a *known* key." },
      { question: "What is a hash set, and how does it relate to a hash table?", answer: "A hash set stores only keys (no associated values), using the same hashing and collision-handling machinery as a hash table, to answer 'have I seen this value before?' in O(1) average time — it's a hash table with the value slot dropped, used purely for membership testing and deduplication." },
      { question: "Why do a hash map and a doubly linked list, used together, give an LRU cache O(1) `get` and `put`?", answer: "The hash map gives O(1) average lookup from key to the linked-list node holding that entry. The doubly linked list keeps entries ordered by recency and, since each node knows both neighbors, supports O(1) removal from anywhere and O(1) re-insertion at the front — together letting a cache find a key instantly *and* reorder/evict without scanning." },
      { question: "What is consistent hashing, and what problem does it solve that a plain `hash(key) % N` scheme doesn't?", answer: "In a plain `hash(key) % N` scheme, adding or removing one server (changing N) reshuffles almost every key to a different server, invalidating nearly the whole distributed cache at once. Consistent hashing maps both keys and servers onto a shared ring of hash values, assigning each key to the next server clockwise from it — adding or removing a server then only reassigns the keys between it and its neighbor, not the whole keyspace." },
      { question: "What is a Bloom filter, and how is it different from a hash set?", answer: "A Bloom filter is a probabilistic structure that answers 'definitely not present' or 'possibly present' using a fixed-size bit array and several hash functions, trading a small false-positive rate for huge space savings since it never stores the keys themselves. A hash set stores real keys and gives an exact, never-wrong membership answer, at the cost of memory proportional to the number of keys." },
      { question: "Why might a hash table implementation upgrade a slot's collision list into a balanced tree once it grows past a certain size (as Java's `HashMap` does)?", answer: "A plain linked-list bucket degrades to O(n) lookup within that bucket if enough keys collide there (from a hash-flooding attack or bad luck). Converting a sufficiently long bucket into a balanced tree (like a red-black tree) bounds worst-case lookup within that bucket to O(log n) instead of O(n), trading a bit of extra bookkeeping for a much better worst case." },
      { question: "What is perfect hashing, and why does it only apply to a fixed, known set of keys?", answer: "It constructs a hash function (often a two-level scheme) guaranteed to have zero collisions for a specific, predetermined set of keys, giving true O(1) worst-case lookup — not just average case. It requires knowing the full key set in advance to build that collision-free function, so it doesn't work for a table that must accept arbitrary future insertions." },
      { question: "What is cuckoo hashing, and what's its worst-case lookup guarantee?", answer: "Each key has two candidate slots (via two hash functions, often across two tables), and a lookup checks at most those two fixed slots — giving O(1) *worst-case* lookup, unlike chaining's O(n) worst case. Insertion can be more expensive: if both of a new key's slots are taken, it evicts whichever occupant is there and re-inserts that key into its own alternate slot, potentially triggering a chain of evictions or, rarely, a full rehash if a cycle is detected." },
      { question: "What's the time complexity of iterating over every entry in a hash table, and does table capacity affect it?", answer: "O(n + capacity) in general — every stored entry must be visited (O(n)), plus every slot must at least be checked for occupancy (O(capacity)) in a simple array-of-buckets implementation. Since capacity is normally kept proportional to n via resizing at a bounded load factor, this is usually just described as O(n)." },
      { question: "Why is using a mutable object as a dictionary key risky in languages where hashing is based on the object's *contents* (unlike JavaScript's `Map`, which hashes objects by reference)?", answer: "If the hash is computed from the object's current field values, mutating the object after insertion changes what its hash would now compute to, but the table doesn't know to move it. A later lookup with an object of the same, now-mutated contents hashes to a different slot than where the original entry actually lives, and the entry becomes silently unreachable." },
      { question: "Why does a hash table with a well-chosen hash function and controlled load factor still occasionally show a few lookups taking longer than others, even without an attack?", answer: "Even a well-distributed hash function will, by ordinary chance, sometimes place several keys in the same slot or nearby probe positions — the birthday-paradox effect means collisions among some pairs of keys are expected well before the table is anywhere near full, so a handful of lookups doing a few extra comparisons is normal, not a sign of a broken hash function." },
      { question: "How would you design a hash function for strings, at a high level, and why is a simple sum of character codes a poor choice?", answer: "A common, effective approach is a polynomial rolling hash — treat the string as digits of a number in some base p (`s[0]*p^(n-1) + s[1]*p^(n-2) + ... + s[n-1]`), then reduce modulo the table size. Simply summing character codes is poor because it ignores order entirely — anagrams like 'listen' and 'silent' would hash identically, causing far more collisions than necessary among unrelated-looking keys that happen to share the same letters." },
      { question: "Scenario: you're building a cache that must evict the least-recently-used entry once it hits a size limit, and needs O(1) `get`/`put`. Why is a hash table alone not enough?", answer: "A hash table alone gives O(1) lookup by key, but has no built-in notion of access recency and no cheap way to find and evict 'the oldest-touched entry' without scanning every entry, O(n). It needs to be paired with an ordering structure (a doubly linked list) that a hash table doesn't provide on its own." },
      { question: "What is the practical difference between a hash table's worst-case and average-case complexity, and why do interview answers usually default to quoting the average case?", answer: "Worst case (O(n)) only shows up when collisions are unusually bad — a poor hash function, adversarial input, or extreme bad luck. With a well-distributed hash function and a bounded load factor, the expected behavior across normal inputs is O(1), which is what's actually observed in practice for essentially all real-world usage — so O(1) average is the practically meaningful number, while O(n) worst case is the theoretical floor to be aware of." },
      { question: "What's the difference between a hash table's `capacity` and its `size`, and why does an implementation usually keep capacity a prime number or a power of two?", answer: "`size` is the number of entries actually stored; `capacity` is the number of slots in the backing array. Using a prime number of slots (with modulo-based hashing) or a power of two (with bitmask-based hashing) tends to spread hash values across slots more evenly for common hash functions, reducing the chance that a poorly-mixed hash accidentally lands many keys in a small subset of slots." },
      { question: "Compare a hash table to a balanced binary search tree (like a red-black tree) as a dictionary implementation — what does each give up?", answer: "A hash table gives O(1) average lookup/insert/delete but O(n) worst case, no ordering, and no efficient range queries or min/max. A balanced BST gives a steady O(log n) worst case for all three operations, keeps keys in sorted order, and supports range queries and ordered traversal — at the cost of being slower on average than a well-behaved hash table for a plain 'get by exact key' lookup." },
      { question: "Why would `for...in` over a plain JavaScript object used as a hash table be riskier than iterating a `Map`'s entries?", answer: "`for...in` walks enumerable properties up the prototype chain, not just the object's own inserted keys — if the object's prototype (or a library) has added enumerable properties, they'll show up mixed in with the actual data unless guarded with `hasOwnProperty` (or `Object.keys`/`entries` used instead). `Map`'s iteration only ever visits entries explicitly `set` on it, with no prototype-chain surprises." },
    ],
    prerequisites: ["arrays"],
    relatedTopics: ["arrays", "strings", "big-o"],
    keywords: ["hash table", "hash map", "hash function", "collision", "dictionary"],
  },
  {
    id: "recursion",
    title: "Recursion",
    level: "intermediate",
    description: "A function that solves a problem by calling itself on a smaller version of the same problem.",
    explanation: `
Some problems are naturally defined in terms of smaller versions of
themselves — finding the total of a list, exploring every folder inside a
folder, calculating a factorial. **Recursion** is when a function solves
such a problem by calling itself with a smaller input, until the input is
simple enough to answer directly (the **base case**).

Every recursive function needs two things: a base case that stops the
recursion, and a step that reduces the problem toward that base case.
    `.trim(),
    analogy:
      "Recursion is like a set of Russian nesting dolls. To find the smallest doll, you open one doll to reveal a smaller one inside, and repeat — until you reach the smallest doll that doesn't open any further. That smallest doll is the base case.",
    examples: [
      {
        title: "Factorial using recursion",
        code: `function factorial(n) {
  if (n <= 1) return 1;       // base case
  return n * factorial(n - 1); // recursive case
}

console.log(factorial(4)); // 4 * 3 * 2 * 1 = 24`,
        explanation:
          "Each call reduces `n` by 1 and calls itself again, until `n` reaches 1 — the base case — at which point the calls start returning back up the chain.",
        walkthrough: [
          { code: "function factorial(n) {", explanation: "Defines a function that will call itself." },
          { code: "if (n <= 1) return 1;", explanation: "The base case — stops the recursion once n is small enough." },
          { code: "return n * factorial(n - 1);", explanation: "The recursive case — multiplies n by the result of solving a smaller version of the same problem." },
        ],
      },
    ],
    howItWorks: `
Each call to a recursive function is placed on the call stack, waiting for
the call it made to finish and return a value. Once the base case is
reached, the calls resolve in reverse order — like unwinding a stack of
plates — each one multiplying or combining its result with what it gets
back, until the original call finally returns.
    `.trim(),
    diagram: `
factorial(4)
  → 4 * factorial(3)
       → 3 * factorial(2)
            → 2 * factorial(1)
                 → returns 1 (base case)
            → returns 2 * 1 = 2
       → returns 3 * 2 = 6
  → returns 4 * 6 = 24
    `.trim(),
    whyItExists: `
Some structures and problems (folders inside folders, trees, certain
mathematical definitions) are naturally recursive — describing them without
recursion often requires extra bookkeeping that a recursive function
handles automatically through the call stack.
    `.trim(),
    whenToUse: `
Reach for recursion when a problem is naturally defined in terms of a
smaller version of itself — traversing nested folders, walking a tree, or
classic divide-and-conquer algorithms like merge sort.
    `.trim(),
    whenNotToUse: `
For a problem that's really just "do this N times in a row" (like
summing a flat array), a loop is usually clearer and avoids the memory
cost of piling up function calls on the stack. Watch recursion depth on
very large inputs — too many nested calls can overflow the call stack.
    `.trim(),
    commonMistakes: [
      "Forgetting the base case, causing infinite recursion until the program crashes ('stack overflow').",
      "Writing a recursive case that doesn't actually move closer to the base case.",
      "Using recursion for a simple problem a loop would solve more efficiently and clearly.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a recursive function that sums all numbers from 1 to n." },
      { difficulty: "Medium", prompt: "Write a recursive function that reverses a string." },
      { difficulty: "Hard", prompt: "Write a recursive function that returns all subsets of a given array." },
    ],
    interviewQuestions: [
      { question: "What two things does every recursive function need?", answer: "A base case that stops the recursion, and a recursive step that moves the input closer to that base case." },
      { question: "What causes a 'stack overflow' in recursion?", answer: "Recursing too deeply (or infinitely, due to a missing/broken base case) fills up the call stack beyond its limit." },
      { question: "When would you prefer recursion over a loop?", answer: "When the problem is naturally recursive in structure — like traversing trees, nested data, or divide-and-conquer algorithms — where recursion reads more clearly than manual bookkeeping." },
      { question: "Trace `factorial(4)` step by step, showing both the 'calling down' and 'returning up' phases.", answer: "Calling down: `factorial(4)` calls `factorial(3)`, which calls `factorial(2)`, which calls `factorial(1)`, which hits the base case and returns 1 without calling further. Returning up: `factorial(2)` computes `2 * 1 = 2` and returns it; `factorial(3)` computes `3 * 2 = 6` and returns it; `factorial(4)` computes `4 * 6 = 24` and returns it as the final answer." },
      { question: "What is the time and space complexity of the recursive factorial function, and where does the space cost come from?", answer: "O(n) time, since there are exactly n calls before reaching the base case. O(n) space, but not for the values being computed — it's the call stack: each pending call stays on the stack until the calls beneath it return, so n frames are alive simultaneously at the deepest point." },
      { question: "Why does the iterative version of factorial only need O(1) extra space, while the recursive version needs O(n)?", answer: "The iterative version keeps a single running total and loop counter, updating them in place — no history of previous steps needs to be remembered. The recursive version has to keep every pending call's stack frame (with its own `n` and pending multiplication) alive until deeper calls resolve, so memory usage grows with recursion depth." },
      { question: "What is tail recursion, and does JavaScript automatically optimize it away like some other languages do?", answer: "A recursive call is in tail position when it's the very last thing the function does — no pending work (like a multiplication) is left to perform after it returns. Some languages/engines implement 'proper tail calls,' reusing the current stack frame instead of pushing a new one, turning tail recursion into O(1) stack space. The ECMAScript 2015 spec includes proper tail calls, but in practice most JavaScript engines — including V8 (Chrome/Node.js) — never shipped it; only Safari's JavaScriptCore does. So writing tail-recursive JavaScript does *not* reliably avoid stack growth the way it would in a language that guarantees the optimization." },
      { question: "Rewrite `factorial` to be tail-recursive using an accumulator parameter, and explain why the rewritten version qualifies as tail-recursive but the original doesn't.", answer: "`function factorial(n, acc = 1) { if (n <= 1) return acc; return factorial(n - 1, n * acc); }`. The original (`return n * factorial(n - 1)`) has a pending multiplication waiting on the recursive call to return, so the recursive call isn't the last action — the multiply happens after it. The rewrite passes the running product forward as `acc` and does nothing after the recursive call returns except hand its result straight back." },
      { question: "Given that most JavaScript engines don't implement proper tail calls, does making a function tail-recursive actually save it from stack overflow in Node.js?", answer: "No — without engine support, a tail-recursive call in Node.js/V8 still pushes a new stack frame just like any other recursive call, so a deep tail-recursive call can still overflow the stack. The rewrite is stylistically cleaner and would get the optimization on an engine that implements it (like Safari), but it isn't a guaranteed fix in most JavaScript runtimes." },
      { question: "What is trampolining, and how does it let you simulate tail-call optimization manually in a language without it?", answer: "Instead of calling itself directly, each recursive step returns a thunk (a zero-argument function representing the next step) rather than invoking it immediately. A driving loop (the 'trampoline') repeatedly calls whatever thunk it's handed until a real value, not a function, comes back. Because each step returns to the trampoline's loop instead of recursing, the call stack never grows with the number of steps — only one frame is ever on the stack at a time." },
      { question: "What is memoization, and how does it change the time complexity of computing the nth Fibonacci number recursively?", answer: "Memoization caches a call's result keyed by its input, so a repeated call with the same input returns the cached result instead of recomputing it. Naive recursive Fibonacci recomputes the same subproblems repeatedly (`fib(5)` calls `fib(3)` twice, `fib(2)` three times, and so on), growing exponentially — commonly cited as O(2^n), though the tighter bound is O(φⁿ) ≈ O(1.618ⁿ). With memoization, each distinct `fib(k)` from 0 to n is computed exactly once, dropping the time to O(n), at the cost of O(n) extra space for the cache." },
      { question: "Why is naive recursive Fibonacci exponential, when the function only ever calls itself twice per invocation?", answer: "Each call to `fib(n)` spawns two more calls, `fib(n-1)` and `fib(n-2)`, and both of those spawn two more, and so on — the number of calls roughly doubles with each additional level of depth, over roughly n levels, giving exponential growth (commonly bounded as O(2^n)). Critically, many of those calls compute the exact same subproblem repeatedly — e.g. `fib(n-2)` is reached both directly from `fib(n)` and indirectly via `fib(n-1)` — which is exactly the redundant work memoization eliminates." },
      { question: "What's the difference between 'linear recursion' (like factorial) and 'tree recursion' (like naive Fibonacci) in terms of the shape of the call graph, and how does that affect complexity?", answer: "Linear recursion makes exactly one recursive call per invocation, so the call graph is a single chain of depth n — time complexity is typically O(n). Tree recursion makes more than one recursive call per invocation, so the call graph branches into a tree — the total number of calls grows with the number of nodes in that tree, often exponential in the input size unless the subproblems overlap and get memoized." },
      { question: "What is the recurrence relation for merge sort's time complexity, and what does it evaluate to?", answer: "`T(n) = 2T(n/2) + O(n)` — each call splits the input into two halves (recursing on each) and then does O(n) work merging the results back together. By the Master Theorem, this resolves to O(n log n)." },
      { question: "What is the recurrence relation for a function like binary search's time complexity, and why does it resolve to O(log n) instead of O(n)?", answer: "`T(n) = T(n/2) + O(1)` — each call does a constant amount of work and recurses into only *one* half of the remaining input, discarding the other half entirely. Because the problem size shrinks by half each time but only one branch is explored (unlike merge sort's two), the number of times n can be halved before reaching 1 is log₂(n), giving O(log n) total." },
      { question: "What is divide-and-conquer, and how does recursion make it a natural fit?", answer: "Divide-and-conquer solves a problem by splitting it into smaller subproblems of the same shape, solving each one (usually recursively), and combining their results into the overall answer. Recursion maps directly onto this: the 'divide' step becomes the recursive calls on smaller inputs, and the base case is the smallest subproblem simple enough to solve directly — the call stack tracks pending subproblems automatically." },
      { question: "Why is recursion a natural fit for traversing a tree, but breadth-first traversal is conventionally written iteratively with an explicit queue instead?", answer: "A tree is itself a recursively-defined structure (a node plus subtrees, which are themselves nodes plus subtrees), so depth-first recursion — process this node, then recurse into each child — mirrors that definition directly, with the call stack tracking the path back up. Breadth-first traversal needs to visit nodes level by level across different branches, which doesn't correspond to a single call chain going deeper — it needs an explicit FIFO queue of discovered-but-not-yet-visited nodes, which recursion's LIFO call stack doesn't provide for free." },
      { question: "What is mutual (indirect) recursion? Give an example.", answer: "Two or more functions that call each other rather than themselves directly — function A calls function B, which calls function A again, and so on, until some base case stops the chain. A classic example: `isEven(n)` returns `true` if `n === 0`, else returns `isOdd(n - 1)`; `isOdd(n)` returns `false` if `n === 0`, else returns `isEven(n - 1)` — neither calls itself directly, but together they recurse." },
      { question: "What's the subtle bug in `function sum(arr) { if (arr.length === 0) return 0; sum(arr.slice(1)) + arr[0]; }`?", answer: "The recursive call's result is never returned — the line computes a value and discards it, since there's no `return` keyword. The function implicitly returns `undefined` in every case except the empty-array base case, so any call on a non-empty array returns `undefined` instead of the sum." },
      { question: "Roughly how many stack frames can a JavaScript call stack hold before overflowing, and what does that mean for recursion on very large inputs?", answer: "It varies by engine and available stack memory, but typically somewhere from a few thousand up to around ten-to-fifteen thousand frames for ordinary functions in Node.js/V8. This means naive recursion over a very large input — one recursive call per element of, say, a million-element array — will overflow the stack long before finishing, even though the same task would run fine as a simple loop." },
      { question: "Why is a loop generally preferred over recursion for a simple 'do this for every item' task, even though both can technically solve it?", answer: "A loop uses a fixed, constant amount of stack space regardless of item count (O(1) extra space), while recursion adds a new stack frame per call (O(n) extra space) and risks overflowing on large inputs. For a problem with no natural recursive substructure — it's just repetition, not 'a smaller version of the same problem' — recursion adds this cost without buying anything in return." },
      { question: "How would you convert an iterative loop that accumulates a total into a recursive function producing the same result?", answer: "Pass the running total (and current position) as parameters, updating them the way the loop body would, and recurse forward instead of looping: `function sumFrom(arr, i = 0, total = 0) { if (i === arr.length) return total; return sumFrom(arr, i + 1, total + arr[i]); }`. The base case is running off the end of the array, and each call carries the accumulated state forward as arguments instead of as loop-local variables." },
      { question: "What is backtracking, and how does it relate to plain recursion?", answer: "Backtracking is recursion with an added discipline: at each step, try a choice, recurse into the consequences of that choice, and if it doesn't lead to a valid solution, undo the choice and try the next one — pruning branches that can't possibly work rather than exploring the entire search tree unconditionally. It's used for problems like generating permutations, solving Sudoku, or N-Queens." },
      { question: "What's the time complexity of a recursive function that generates all subsets of an n-element array, and why?", answer: "O(2^n), because there are exactly 2^n possible subsets of an n-element set (each element is either included or excluded, independently), and any correct algorithm must at minimum produce all of them — the recursion branches into two calls (include / exclude the current element) at each of the n elements." },
      { question: "What's the time complexity of a recursive function that generates all permutations of an n-element array, and why is it worse than the subset-generation recursion?", answer: "O(n!), since there are n! distinct orderings of n elements, and generating each one requires the recursion to branch into a shrinking number of remaining choices at each of n levels rather than a fixed 2 — n! grows dramatically faster than 2^n as n increases, making permutation generation intractable for even moderately large n where subset generation might still be feasible." },
      { question: "Why does recursion make sense for traversing nested folders/JSON but not for looping over a flat array of numbers?", answer: "Nested folders are recursively self-similar — a folder contains files and other folders, which are themselves folders containing files and folders — so a function that processes 'this folder, then each subfolder the same way' matches the data's own shape, and the nesting depth isn't known in advance. A flat array has no such recursive substructure — it's just a fixed sequence to step through once — so a simple loop already matches its shape without needing the call stack's help." },
      { question: "Trace the call tree for `fib(4)` under naive (non-memoized) recursion, and count how many times `fib(1)` gets computed.", answer: "`fib(4)` calls `fib(3)` and `fib(2)`. `fib(3)` calls `fib(2)` and `fib(1)`. That first `fib(2)` calls `fib(1)` and `fib(0)`. The `fib(2)` called directly from `fib(4)` calls its own `fib(1)` and `fib(0)`. In total, `fib(1)` is computed 3 times and `fib(0)` 2 times across the tree — the same base-case subproblems recomputed repeatedly, exactly the redundant work memoization eliminates." },
      { question: "What's the extra space cost of the memoization cache itself in top-down (recursive) dynamic programming, on top of the call stack?", answer: "O(n) (or however many distinct subproblems exist), since the cache needs one entry per distinct input the recursion is ever called with — for Fibonacci, one entry per integer from 0 to n. This is in addition to, not instead of, the O(n) call stack depth the recursion still uses." },
      { question: "How would you decide whether a recursive solution should make one recursive call, two, or more, just from how the problem is worded?", answer: "Look at how many smaller subproblems the problem's own definition naturally splits into. If solving it requires combining the answer from exactly one smaller instance (like 'the sum of everything after the first element'), one recursive call suffices. If it requires combining results from multiple smaller instances (like Fibonacci's 'sum of the previous two,' or exploring 'include or exclude this item'), the number of calls should mirror the number of smaller subproblems the definition itself refers to." },
      { question: "Why can two functions that are both 'O(n) recursive calls deep' have very different actual running times?", answer: "Recursion depth only measures how many nested calls are pending at once — it says nothing about how much work happens at each level, or how many sibling calls happen at each level. A linear-recursive function doing O(1) work per call and a tree-recursive function branching into two calls per level can both have a deepest chain of n calls, yet the tree-recursive one does exponentially more total work because of the sibling branches at each level, not just the depth of one chain." },
      { question: "A recursive function meant to reduce the problem size still infinitely recurses even though the recursive call is present. What's usually wrong?", answer: "The argument passed to the recursive call doesn't actually get smaller (or closer to the base case) — e.g. calling `recurse(n)` again instead of `recurse(n - 1)`, or slicing the wrong end of an array — so every call sees the same input as its caller and the base case is never reached, no matter how many times it recurses." },
      { question: "Scenario: a recursive function correctly returns the right answer for small inputs during testing, but crashes in production. What are the two most likely explanations, in order of likelihood?", answer: "Most likely, the production input is simply much larger/deeper than anything tested, and the recursion depth exceeds the call stack limit (stack overflow) even though the logic is correct. Less commonly, there's an edge case in the untested input — an empty array, a negative number, a specific value that skips the base case — that the small test inputs never happened to exercise, causing infinite (or far deeper than expected) recursion." },
      { question: "What does it mean for a recursive algorithm to have 'overlapping subproblems,' and why is that specifically what makes memoization worthwhile?", answer: "It means the recursion calls itself with the *same* arguments more than once along different paths (like `fib(n-2)` being reached both directly and via `fib(n-1)`). Memoization only pays off when this happens — caching a result is wasted effort if every recursive call receives distinct arguments and is therefore only ever computed once anyway." },
      { question: "Why doesn't merge sort benefit from memoization the way naive Fibonacci does?", answer: "Merge sort's recursive calls each operate on a distinct, non-overlapping half of the array — `mergeSort(arr[0..n/2])` and `mergeSort(arr[n/2..n])` are never called again with the same input elsewhere in the recursion tree. Memoization only helps when subproblems recur; since merge sort's subproblems are all unique, there's nothing to cache and reuse." },
      { question: "Two recursive functions each solve an n-element problem: one recurses on `n - 1` (one smaller), the other recurses on `n / 2` (halved) — both making a single recursive call. Why is one typically O(n) and the other O(log n)?", answer: "Shrinking by a fixed amount (`n - 1`) means it takes n steps to reach the base case, giving O(n) calls. Shrinking by a fixed *fraction* (`n / 2`) means it only takes about log₂(n) halvings to reach the base case, giving O(log n) calls — the difference between subtracting and dividing compounds dramatically as n grows." },
    ],
    prerequisites: ["stack"],
    relatedTopics: ["stack", "binary-search"],
    keywords: ["recursion", "base case", "call stack", "stack overflow"],
  },
  {
    id: "binary-search",
    title: "Binary Search",
    level: "intermediate",
    description: "A fast way to find a value in a sorted list by repeatedly cutting the search area in half.",
    explanation: `
If you search a list one item at a time, finding a value in a million-item
list could take up to a million checks. But if the list is **sorted**,
there's a much faster way: check the middle item. If it's too big, the
answer must be in the left half; if it's too small, it must be in the
right half. Repeating this — always looking at the middle of whatever's
left — is called **binary search**, and it can find a value in a
million-item list in about 20 checks instead of a million.
    `.trim(),
    analogy:
      "It's how you'd find a word in a paper dictionary: you don't start at page 1. You open to the middle, see you've gone too far or not far enough, and jump to the middle of the correct half — repeating until you land on the word.",
    examples: [
      {
        title: "Binary search implementation",
        code: `function binarySearch(sortedArray, target) {
  let low = 0;
  let high = sortedArray.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    if (sortedArray[mid] === target) return mid;
    if (sortedArray[mid] < target) {
      low = mid + 1; // search the right half
    } else {
      high = mid - 1; // search the left half
    }
  }

  return -1; // not found
}`,
        walkthrough: [
          { code: "let low = 0; let high = sortedArray.length - 1;", explanation: "Marks the current search range — the whole array, to start." },
          { code: "const mid = Math.floor((low + high) / 2);", explanation: "Picks the middle index of the current range." },
          { code: "if (sortedArray[mid] === target) return mid;", explanation: "Found it — return immediately." },
          { code: "low = mid + 1; / high = mid - 1;", explanation: "Narrows the range to whichever half could still contain the target." },
        ],
      },
    ],
    howItWorks: `
Each check eliminates half of the remaining possibilities. Starting with
\`n\` items, after one check there are \`n/2\` left to consider, then \`n/4\`,
then \`n/8\` — this halving is what makes binary search take only about
\`log2(n)\` steps, dramatically fewer than checking every item.
    `.trim(),
    diagram: `
[1,3,5,7,9,11,13] — looking for 11
        ↓ check middle (7) → too small → search right half
   [9,11,13]
        ↓ check middle (11) → found!
    `.trim(),
    whyItExists: `
Binary search is one of the clearest demonstrations of why algorithm
choice matters: the same problem, solved with a smarter approach on sorted
data, goes from O(n) to O(log n) — a difference that becomes enormous as
data grows.
    `.trim(),
    whenToUse: `
Reach for binary search whenever you're repeatedly searching a large,
sorted collection — it turns an O(n) scan into an O(log n) lookup, which
matters a lot once the data gets big.
    `.trim(),
    whenNotToUse: `
If your data isn't sorted and can't easily be kept sorted, binary search
doesn't apply — sorting it first costs more than a single linear search
would. And for a very small list, the overhead of tracking low/high/mid
isn't worth it over just checking each item.
    `.trim(),
    commonMistakes: [
      "Using binary search on data that isn't sorted — it silently gives wrong answers instead of erroring.",
      "Getting the `low`/`high` update backwards, causing an infinite loop or skipped elements.",
      "Off-by-one errors in the midpoint calculation or the boundary updates.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Implement binary search for a sorted array of numbers, returning the index of a target value." },
      { difficulty: "Medium", prompt: "Modify binary search to return the index where a value *should* be inserted to keep the array sorted, even if it isn't found." },
      { difficulty: "Hard", prompt: "Use binary search to find the smallest number in a sorted array that has been rotated (e.g. `[4,5,6,1,2,3]`)." },
    ],
    interviewQuestions: [
      { question: "What is required for binary search to work?", answer: "The data must be sorted — binary search relies on being able to rule out half the remaining data based on a single comparison." },
      { question: "What is the time complexity of binary search?", answer: "O(log n), since each step cuts the remaining search space in half." },
      { question: "Why is O(log n) so much better than O(n) for large inputs?", answer: "Because logarithmic growth is extremely slow — doubling the input only adds one more step, whereas linear growth doubles the work." },
      { question: "Walk through why binary search takes O(log n) steps: starting with n items, how many remain after each comparison?", answer: "Each comparison eliminates one whole half of the remaining range, so after 1 step there are about n/2 items left, after 2 steps n/4, after k steps n/2^k. The search ends once that shrinks to about 1 item — n/2^k ≈ 1 — which means k ≈ log₂(n), so the number of steps grows logarithmically with n, not linearly." },
      { question: "What precondition does binary search require that makes it inapplicable to a linked list, even though a linked list can be sorted?", answer: "Binary search needs O(1) random access to jump straight to an arbitrary index — the middle of the current range. A linked list only supports sequential access — reaching the middle element requires walking from the head, O(n) — so 'jumping to the middle' costs as much as scanning the whole thing, eliminating the benefit binary search is supposed to provide." },
      { question: "In `const mid = Math.floor((low + high) / 2)`, why does this implementation need `while (low <= high)` rather than `while (low < high)`?", answer: "With `low <= high`, the loop still checks the case where `low === high` — the single remaining candidate element — before concluding the target isn't present. Using `low < high` instead would skip checking that last remaining element, incorrectly reporting 'not found' for a target that's actually the very last candidate." },
      { question: "What's the classic overflow bug with `mid = Math.floor((low + high) / 2)` in languages with fixed-width integers, and how do implementations avoid it?", answer: "If `low` and `high` are both large enough that their sum exceeds the maximum representable integer (32-bit signed overflow in Java/C++), `low + high` wraps to a negative or garbage value before the division happens, producing a nonsensical `mid`. The fix is `mid = low + Math.floor((high - low) / 2)`, which never sums the two directly. This specific overflow isn't a practical concern for ordinary array indices in JavaScript, since its numbers are IEEE-754 doubles representing integers exactly up to 2^53 — far beyond any realistic array length — but it's a real trap in fixed-width-integer languages." },
      { question: "How would you modify binary search to find the leftmost (first) occurrence of a target value that appears multiple times in a sorted array?", answer: "Instead of returning immediately on `arr[mid] === target`, record `mid` as a candidate answer and keep searching the *left* half (`high = mid - 1`) to see if an earlier occurrence exists, narrowing until `low > high`. The last recorded candidate is the leftmost occurrence — still O(log n), since it's one binary search with a modified 'found' branch." },
      { question: "Symmetrically, how would you find the rightmost (last) occurrence of a duplicated target?", answer: "On `arr[mid] === target`, record `mid` as a candidate and keep searching the *right* half (`low = mid + 1`) instead of stopping, to see whether a later occurrence exists. The last recorded candidate once `low > high` is the rightmost occurrence." },
      { question: "How would you find the index where a value should be inserted into a sorted array to keep it sorted, even if that exact value isn't present?", answer: "Run a binary search that narrows `low`/`high` as usual, but instead of returning -1 on failure, return `low` once the loop ends — at that point `low` has converged to exactly the first index whose value is `>=` the target, which is the correct insertion point to keep the array sorted." },
      { question: "How would you search for a target in a sorted array that's been rotated at an unknown pivot (e.g. `[4,5,6,7,0,1,2]`), while keeping O(log n) time?", answer: "At each step, compare `arr[low]` to `arr[mid]` to determine which half is the 'normally sorted' one. If `arr[low] <= arr[mid]`, the left half is sorted, so check whether the target falls within that sorted range — search there if it does, otherwise search the right half. If the right half is the sorted one instead, apply the symmetric logic. Either way, one comparison still discards half the remaining elements each step, preserving O(log n)." },
      { question: "In the rotated-array search, why does at least one half always have to be properly sorted, no matter where the pivot is?", answer: "Rotating a sorted array creates exactly one 'break point' where a smaller value follows a larger one. Any contiguous range that doesn't straddle that break point is still in ascending order. Splitting at `mid` means the break point can only fall within one of the two halves (or neither), so the other half is guaranteed fully sorted, giving a reliable way to decide where to search next." },
      { question: "For a rotated sorted array that may contain duplicate values (e.g. `[3,3,1,3]`), why can the 'which half is sorted' check fail, and what does that do to worst-case time complexity?", answer: "If `arr[low] === arr[mid] === arr[high]`, duplicates make it impossible to tell from that comparison alone which half is properly ordered. The standard fix is to shrink the range conservatively by one element (`low++` or `high--`) and try again, rather than eliminating a full half. In the worst case (an array of nearly all-identical values), this degrades the algorithm to O(n), since it may only discard one element at a time instead of half the range." },
      { question: "How would you find the minimum element in a rotated sorted array (no duplicates) using binary search?", answer: "Compare `arr[mid]` to `arr[high]`. If `arr[mid] > arr[high]`, the minimum must be to the right of `mid` (the rotation point is in the right half), so set `low = mid + 1`. Otherwise, the minimum is at `mid` or to its left, so set `high = mid` (not `mid - 1`, since `mid` itself could be the answer). This still converges in O(log n) since the search range keeps halving." },
      { question: "You have a fully sorted 2D matrix where every row is sorted left-to-right and the first element of each row is greater than the last element of the previous row. How would you binary search it in O(log(m·n))?", answer: "Treat the matrix as if flattened into one array of length m*n without copying it — for a candidate flat index i, map it back to `(row, col) = (Math.floor(i / cols), i % cols)`, compare `matrix[row][col]` to the target, and narrow `low`/`high` exactly like a normal 1D binary search. Since the total element count is m*n, the number of steps is O(log(mn))." },
      { question: "A different, more common kind of sorted 2D matrix has every row sorted left-to-right *and* every column sorted top-to-bottom, but rows aren't necessarily continuous with each other. Why doesn't the flattened-1D binary search work here, and what O(m+n) approach does?", answer: "Without the 'each row continues where the previous left off' guarantee, mapping a flat index to `(row, col)` no longer corresponds to a globally sorted sequence, so binary search's halving logic breaks. Instead, start at the top-right corner: move left if the current value is bigger than the target (eliminating that column), move down if smaller (eliminating that row), or stop if equal. Each step eliminates exactly one row or column, terminating in at most m + n steps — O(m+n), not O(log(mn)), but still much better than checking every cell." },
      { question: "What's the recursive-versus-iterative tradeoff for implementing binary search, in terms of space?", answer: "The iterative version uses a fixed handful of variables (`low`, `high`, `mid`) regardless of input size — O(1) extra space. The recursive version pushes a new stack frame for each halving, and since it halves the range about log₂(n) times before hitting a base case, it uses O(log n) extra space for the call stack." },
      { question: "How would you find the square root of a non-negative number to some precision using binary search, given that the input isn't a discrete sorted array?", answer: "Search over the *range of possible answers* rather than an array — set `low = 0` and `high = n` (or a known upper bound), repeatedly check whether `mid * mid` is less than, greater than, or close enough to `n`, and narrow the range accordingly, stopping once `high - low` is smaller than the desired precision. This is 'binary search on the answer': the sorted structure being searched is the space of candidate answers, not a literal array." },
      { question: "What is 'binary search on the answer,' and what property must the answer space have for it to apply, even with no literal sorted array to search?", answer: "It applies binary search's halving logic to a range of candidate answers to an optimization/feasibility problem, useful when you can cheaply check 'is this candidate answer feasible?' and that feasibility is monotonic — once a candidate value works, every candidate on one side of it also works. That monotonic yes/no boundary is exactly what lets you discard half the remaining candidates on each check, the same way a sorted array lets you discard half the remaining elements." },
      { question: "Give an example of a problem solved with 'binary search on the answer' that has nothing to do with searching an array.", answer: "'Find the minimum eating speed k such that a set of banana piles can all be eaten within h hours.' Instead of searching an array, binary search over possible values of k from 1 to the largest pile size — for each candidate k, check in O(n) whether eating at that speed finishes within h hours (a monotonic condition: if a given k works, every larger k also works), narrowing the range of candidate k values accordingly, giving O(n log(max pile size)) overall instead of testing every possible speed one by one." },
      { question: "What is exponential (galloping) search, and when is it more appropriate than plain binary search?", answer: "Used when the array's size is unknown or effectively unbounded — start by checking index 1, then double the index (2, 4, 8, 16...) until the value there is `>=` the target or you run past the end, then run ordinary binary search within the last-known bounding range. This finds a target at position p in O(log p) time, without needing to know the array's length upfront the way plain binary search does." },
      { question: "What is ternary search, and why doesn't it beat binary search for simply finding a value in a sorted array?", answer: "Ternary search splits the current range into three parts using two midpoints, discarding one third of the range per comparison instead of one half. While its recursion depth is O(log₃ n) — fewer levels than binary search's O(log₂ n) — each level does two comparisons instead of one, so the total comparisons end up roughly the same order (or slightly worse in practice); it doesn't provide an asymptotic improvement for plain element-search, and is mainly useful for finding the peak of a unimodal function instead." },
      { question: "Why does binary search silently give a wrong answer on unsorted data instead of erroring out?", answer: "Binary search's halving logic assumes that if the middle element is too small, everything to its left is also too small (and the reverse for too large) — a guarantee only sortedness provides. On unsorted data that assumption can be false, but the algorithm still runs to completion and returns some index or -1 with total confidence, with no way to detect the violated assumption — it may report 'not found' for a value that's present, or return the wrong index entirely." },
      { question: "Compare a hash table lookup to binary search for finding a value — when would you prefer O(log n) binary search over O(1) average hash table lookup?", answer: "Prefer binary search (over a sorted array) when you also need operations a hash table can't do efficiently — range queries, finding the minimum/maximum, or ordered iteration — since a hash table has no concept of key order. If all that's needed is an exact-value lookup with no ordering requirement, a hash table's O(1) average is strictly faster than binary search's O(log n)." },
      { question: "If you only need to perform a single search on data that isn't already sorted, is it worth sorting the array first to enable binary search?", answer: "No — sorting costs O(n log n), plus an additional O(log n) to binary search, for a total of O(n log n) — strictly worse than just scanning the unsorted array once for O(n). Sorting only pays off if the search (or many searches) will be performed repeatedly on the same data, since the sort cost then amortizes across all of them." },
      { question: "What's the time complexity of finding both the first and last position of a target value in a sorted array with duplicates, using two separate binary searches?", answer: "O(log n) total — each of the two searches (leftmost-occurrence and rightmost-occurrence) independently runs in O(log n), and doing two independent O(log n) searches is still O(log n) overall, since constants don't change the complexity class." },
      { question: "What is the relationship between binary search and a binary search tree (BST)?", answer: "A BST generalizes the same halving idea — go left if the target is smaller, right if larger — to a dynamic, linked structure instead of a static contiguous array. A balanced BST supports search *and* O(log n) insertion/deletion, whereas binary search on a plain sorted array is O(log n) for search alone but O(n) for insertion, since inserting in the middle requires shifting every later element to keep it sorted." },
      { question: "Trace a binary search for `target = 2` on `[1, 2, 4, 6, 8, 10]` (indices 0-5), reporting every `low`, `high`, and `mid` along the way.", answer: "low=0, high=5: mid=2, arr[2]=4 > 2, so high = 1. low=0, high=1: mid=0, arr[0]=1 < 2, so low = 1. low=1, high=1: mid=1, arr[1]=2 === target — found at index 1." },
      { question: "What happens if you accidentally write `high = mid` instead of `high = mid - 1` in the standard `while (low <= high)` template, when the target is smaller than `arr[mid]`?", answer: "Since `mid` has already been ruled out — it's not equal to the target — leaving it back in the range as the new `high` means it may be re-examined as a future `mid`. Depending on how `mid` is computed, this can produce an infinite loop once `low` and `high` become adjacent and `mid` keeps recomputing to the same index without changing. The fix is symmetric: exclude the just-checked `mid` from the next range on both sides." },
      { question: "What's the difference in `mid` calculation risk between `Math.floor((low + high) / 2)` and using bitwise `(low + high) >> 1` in JavaScript for very large arrays?", answer: "`Math.floor` operates on JavaScript's regular double-precision numbers, which represent integers exactly up to 2^53 — far beyond any realistic array length. The bitwise `>>` operator first coerces its operands to 32-bit signed integers, so for an array long enough that `low + high` exceeds about 2^31, the bitwise version would silently wrap around and compute the wrong midpoint — a real, if rare, trap the `Math.floor` version doesn't share." },
      { question: "How would you find a 'peak element' in an array (one greater than both its neighbors) using a binary-search-like approach, even though the array isn't sorted?", answer: "Compare `arr[mid]` to `arr[mid + 1]`. If `arr[mid] < arr[mid + 1]`, a peak must exist somewhere to the right (values are still climbing), so search the right half; otherwise, a peak exists at `mid` or to its left, so search the left half (inclusive of `mid`). This works without full sortedness because the comparison still reliably indicates which direction guarantees a peak, letting you discard half the array each step — O(log n)." },
      { question: "Why is it important that binary search's loop always makes forward progress, and what's a bug pattern that violates this?", answer: "If `low`/`high` don't strictly shrink on some iteration, the loop can spin forever without reaching its termination condition. A common bug: using `mid = Math.floor((low + high) / 2)` together with `low = mid` (instead of `mid + 1`) when narrowing to the right half — if `low` and `high` become adjacent (e.g. low=3, high=4), `mid` computes to 3, and setting `low = mid` leaves `low` unchanged, looping forever on the same range." },
      { question: "Scenario: you're building an autocomplete feature backed by a large sorted list of terms, and need 'all terms that start with prefix P.' How would binary search help, beyond just finding one exact match?", answer: "Binary search twice — once to find the leftmost position where a term is `>= P` (the start of the matching range), and once to find the leftmost position where a term is `>=` the 'next' prefix after P (e.g. incrementing P's last character), marking the end of the matching range. Everything between those two boundaries starts with P. Both searches are O(log n), so the whole range is found in O(log n) rather than scanning linearly." },
      { question: "What's the time complexity of binary search in terms of the number of comparisons, precisely, and how does that relate to the O(log n) Big-O statement?", answer: "Precisely, binary search takes at most ⌊log₂(n)⌋ + 1 comparisons in the worst case. The Big-O notation O(log n) captures the same growth rate but drops the exact constant and base, since changing the logarithm's base only scales it by a constant factor, which Big-O ignores." },
      { question: "Why does binary search's advantage over linear search grow more dramatic as the input size increases, rather than staying at a fixed multiple?", answer: "Linear search's cost scales directly with n — double the input, double the worst-case comparisons — while binary search's cost scales with log₂(n) — double the input, and comparisons only increase by one. So the ratio of linear-search cost to binary-search cost keeps growing as n grows — at 1,000 items it's roughly 1,000 vs. 10 comparisons, but at 1,000,000,000 items it's roughly 1,000,000,000 vs. 30, an enormously larger gap." },
      { question: "Does binary search still work correctly on an array sorted in descending order?", answer: "Not with the standard ascending-order comparison logic — the algorithm needs to know which direction 'smaller' values lie in to decide whether to keep the left or right half. It still runs in O(log n) once adapted, but the comparisons must be flipped (search left when `arr[mid]` is too small, right when too large — the reverse of the ascending version); using the unmodified ascending-order logic on descending data produces incorrect results, similar to running it on unsorted data." },
    ],
    prerequisites: ["arrays", "recursion"],
    relatedTopics: ["big-o", "arrays", "recursion"],
    keywords: ["binary search", "sorted array", "log n", "divide and conquer"],
  },
];
