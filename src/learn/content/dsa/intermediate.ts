import type { Topic } from "../../types/content";

export const dsaIntermediateTopics: Topic[] = [
  {
    id: "linked-lists",
    title: "Linked Lists",
    level: "intermediate",
    description: "A chain of items where each one points to the next, instead of sitting side by side in memory.",
    explanation: `
An array packs items together in memory: fast to read, slow to insert
into. In a **linked list**, each item (a **node**) stores its value plus a
pointer to the *next* node. Nodes can sit anywhere in memory; the pointers
connect them.

The trade-off is the opposite of an array's. Inserting or removing a node
is fast (change a couple of pointers). But finding the 5th item means
walking through the first four; you can't jump to a position.
    `.trim(),
    analogy:
      "A linked list is like a scavenger hunt: each clue tells you where the next one is. You can't jump to clue #5; you follow the chain from the start. But adding a new clue in the middle is easy: point the previous clue somewhere new.",
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
          { code: "class Node { constructor(value) {...} }", explanation: "The building block: a value plus a pointer to the next node." },
          { code: "const first = new Node(10);", explanation: "Creates the first node, holding 10." },
          { code: "const second = new Node(20);", explanation: "Creates a separate node, holding 20." },
          { code: "first.next = second;", explanation: "Links them: first now points to second." },
          { code: "first.next.value", explanation: "Follows the pointer from first to read second's value." },
        ],
      },
    ],
    howItWorks: `
Each node holds a value and a reference to the next node (\`null\` for the
last one). To read position 5, start at the first node and follow \`.next\`
five times. Unlike an array, you can't calculate the memory location
directly.
    `.trim(),
    diagram: `
[10] → [20] → [30] → null
 head

To reach 30: head → next → next
    `.trim(),
    whyItExists: `
Linked lists suit programs that insert and remove a lot (especially at the
front or middle) and don't need fast access by position. They're also the
foundation for structures like stacks and queues.
    `.trim(),
    whenToUse: `
Use a linked list when you insert and remove often, especially at the
front or middle, and never need to jump to a position by index.
    `.trim(),
    whenNotToUse: `
Avoid it if you need frequent access by index (get the 500th item): that's
O(n) here versus O(1) in an array. Plain arrays cover most everyday
JavaScript needs. Use a linked list mainly to build another structure (a
queue, a stack) or when a problem calls for one.
    `.trim(),
    commonMistakes: [
      "Forgetting to update the `next` pointer when inserting a node, which breaks the chain.",
      "Overwriting a `next` pointer before saving it, which loses the rest of the list.",
      "Assuming linked lists have fast random access like arrays. They don't.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Build a linked list of 3 nodes by hand and print each value by following `.next`." },
      { difficulty: "Medium", prompt: "Write a function that returns the length of a linked list by traversing it." },
      { difficulty: "Hard", prompt: "Write a function that reverses a singly linked list in place, without creating a new list." },
    ],
    interviewQuestions: [
      { question: "What's the main trade-off between arrays and linked lists?", answer: "Arrays give O(1) access by index but O(n) insertion/removal in the middle, since later elements shift. Linked lists give O(1) insertion/removal (given a reference to the node) but O(n) access by position, since you can't jump to an index." },
      { question: "What is a node?", answer: "The basic unit of a linked list: an object holding a value and a pointer (or pointers) to neighboring nodes." },
      { question: "What's the difference between a singly and doubly linked list?", answer: "Singly linked nodes point only to `next`, so you can only go forward. Doubly linked nodes also point to `prev`, so you can go both ways, at the cost of one extra pointer (and its upkeep) per node." },
      { question: "Why is inserting at the front of a linked list O(1), while inserting at the front of an array is O(n)?", answer: "For a linked list, create a node and point it at the old head; nothing else moves. For an array, every element shifts one slot right, touching all n elements." },
      { question: "Why is finding the nth element O(n) in a linked list but O(1) in an array?", answer: "An array computes the address from the index (base address + index × element size). A linked list has no formula; you follow `next` pointers one at a time from the head." },
      { question: "What is a circular linked list, and what's it useful for?", answer: "A list whose last node's `next` points back to the first instead of `null`, forming a loop. It suits things that cycle, like round-robin scheduling or a repeating playlist, where you keep advancing without hitting an end." },
      { question: "What is Floyd's cycle detection algorithm, and how does it detect a cycle using O(1) extra space?", answer: "Also called 'tortoise and hare'. Move `slow` one node at a time and `fast` two at a time. If there's a cycle, `fast` laps `slow` and they land on the same node. If not, `fast` reaches `null` first. It uses only two pointers, so O(1) space." },
      { question: "Why must the fast and slow pointers eventually meet if there's a cycle, instead of just missing each other forever?", answer: "Once both are in the loop, `fast` closes the gap by exactly one node per step (it moves 2, `slow` moves 1). A gap shrinking by 1 each step in a finite loop must reach 0, so they can't skip past each other." },
      { question: "Once Floyd's algorithm finds a meeting point, how do you find the exact node where the cycle begins?", answer: "Reset one pointer to the head, leave the other at the meeting point, and advance both one node at a time. They meet again at the start of the cycle. This follows from the distances between the head, the cycle start and the meeting point." },
      { question: "Walk through reversing the list `1 -> 2 -> 3 -> null` iteratively using three pointers (`prev`, `current`, `next`).", answer: "Start with `prev = null`, `current = head` (node 1). Each iteration: save `next = current.next`, set `current.next = prev` (reverse the link), then `prev = current` and `current = next`. After node 1: `1 -> null`, prev=1. After node 2: `2 -> 1 -> null`, prev=2. After node 3: `3 -> 2 -> 1 -> null`, prev=3, current=null. The loop ends and `prev` is the new head." },
      { question: "How would you reverse a singly linked list recursively, and how does its complexity compare to the iterative version?", answer: "Recurse to the end first. As each call returns, point the next node's `next` back at the current node and set the current node's `next` to `null`. Both are O(n) time, but recursion uses O(n) stack space versus O(1) for the iterative version." },
      { question: "What's a common bug when reversing a linked list iteratively?", answer: "Setting `current.next = prev` before saving the original `current.next`. The rest of the list becomes unreachable, so the reversal silently truncates it." },
      { question: "What is a sentinel (dummy) head node, and why does it simplify list code?", answer: "A placeholder node kept before the real head; its value is never used. The real first node is then always some node's `.next`, so inserting or removing at the front needs no special case." },
      { question: "How would you find the middle node of a linked list in a single pass, without first counting its length?", answer: "Start slow and fast pointers at the head. Move `slow` one node and `fast` two nodes per step. When `fast` reaches the end (or `null`), `slow` is on the middle node, having covered half the distance." },
      { question: "Why does a queue built on a singly linked list need both a `head` and a `tail` pointer to keep both operations O(1)?", answer: "Dequeue only needs `head`. Without `tail`, enqueue must walk the whole list to find the last node: O(n). A `tail` pointer lets you attach the new node in O(1)." },
      { question: "What's a subtle bug when removing a node from the middle of a singly linked list?", answer: "You need the *previous* node, not just the node itself, because removal updates the previous node's `next` to skip it. Forgetting to track the previous node is a common cause of broken removal." },
      { question: "There's a trick to 'delete' a node given only a reference to it (no access to the previous node): copy the next node's value into it, then skip over the next node. Why does this fail for the last node in the list?", answer: "The trick turns the target into a copy of its successor, then removes the successor. The last node has no successor to copy from or skip, so the trick can't work." },
      { question: "How would you find where two singly linked lists intersect (merge into a shared tail), in O(n + m) time and O(1) extra space?", answer: "Find both lengths. Advance the pointer on the longer list by the difference, so both are the same distance from the end. Then move both one node at a time; the first node where they're the same reference is the intersection." },
      { question: "How would you remove the nth node from the end of a linked list in a single pass?", answer: "Start `fast` and `slow` at a dummy head before the real head, and move `fast` n nodes ahead. Then move both together until `fast` reaches the end. `slow` is now just before the target, so `slow.next = slow.next.next` removes it." },
      { question: "How would you merge two already-sorted linked lists into a single sorted list, and what's the time complexity?", answer: "Walk both lists with two pointers, attaching the smaller current node to the result and advancing that list. When one runs out, attach the rest of the other. O(n + m) time, since each node is visited once, and O(1) extra space if you re-link existing nodes." },
      { question: "How would you check whether a linked list is a palindrome, ideally using O(1) extra space?", answer: "Find the middle with slow/fast pointers, reverse the second half in place, then compare the first half with the reversed second half. All matching means it's a palindrome. This avoids an O(n) array copy but temporarily changes the list (you can restore it afterwards)." },
      { question: "What's the extra memory cost of a doubly linked list compared to a singly linked list, per node?", answer: "One extra pointer per node (`prev`), typically 8 bytes on a 64-bit system, plus the work of keeping it correct on every insert and remove." },
      { question: "Why do a doubly linked list and a hash map together form the backbone of a classic LRU cache implementation?", answer: "The hash map finds a key's node in O(1). The doubly linked list keeps nodes in recency order, and since each node knows both neighbors, it can remove a node from anywhere and re-insert it at the front in O(1). That moves a just-used item to the 'most recent' end without scanning." },
      { question: "Why does a linked list have worse cache locality than an array, even though both are O(n) to traverse?", answer: "Array elements are contiguous, so the CPU can prefetch ahead. Linked list nodes are usually scattered across separate heap allocations, so following `next` jumps around memory and causes more cache misses, despite the same Big O." },
      { question: "What memory overhead does a linked list carry per element compared to a plain array of the same values?", answer: "Each node needs at least one pointer (`next`, plus `prev` if doubly linked) on top of the value, and is usually its own heap allocation with allocator bookkeeping. An array stores values back to back with no per-element pointer." },
      { question: "What is a circular doubly linked list, and where is it used?", answer: "A doubly linked list where the last node's `next` points to the first and the first node's `prev` points to the last, forming a loop you can walk either way. It's used in looping playlists and some LRU caches, where wrapping around avoids special cases at the ends." },
      { question: "What happens if a traversal loop's condition is `while (node.next)` instead of `while (node)`?", answer: "The loop stops as soon as `node.next` is `null`, so the body never runs for the last node. It's silently skipped, with no null-pointer error." },
      { question: "Scenario: you're designing an LRU cache needing O(1) `get` and O(1) `put`. Why is a hash map or array alone insufficient?", answer: "A hash map gives O(1) lookup but can't track *recency order* or evict the least-recently-used item without scanning. An array tracks order but costs O(n) to move an item to the front or remove one from the middle. A hash map (O(1) lookup) plus a doubly linked list (O(1) reordering and eviction at either end) gives both." },
      { question: "What's the time complexity of accessing the head, the tail, and an arbitrary middle element of a singly linked list with only a head pointer?", answer: "Head: O(1), it's referenced directly. Tail: O(n), you walk the whole list. Middle: O(n), you follow `next` pointers from the head." },
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
Some problems process things in reverse order of arrival: undo history,
nested function calls, matching brackets. A **stack** handles this. You
can only add ("push") or remove ("pop") at one end, the top, so the most
recent item always comes out first.

This rule is called **LIFO**: Last In, First Out.
    `.trim(),
    analogy:
      "A stack is like a pile of plates. You add a plate on top and take the top one off first. You'd never pull one from the bottom.",
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
          "`push` and `pop` both work on the end of the array, which is exactly how a stack behaves. JavaScript needs no special structure.",
        walkthrough: [
          { code: "const stack = [];", explanation: "An empty array, used as a stack." },
          { code: "stack.push(1);", explanation: "Adds 1 to the top." },
          { code: "stack.push(2); stack.push(3);", explanation: "Adds 2, then 3. 3 is now on top." },
          { code: "stack.pop();", explanation: "Removes and returns the top item, 3, leaving [1, 2]." },
        ],
      },
    ],
    howItWorks: `
A stack has two main operations: \`push\` (add to the top) and \`pop\`
(remove from the top). Both are O(1), since no other item is touched. To
reach an item in the middle, you must first remove everything above it.
    `.trim(),
    diagram: `
push(1)   push(2)   push(3)     pop()
   ↓         ↓         ↓          ↓
  [1]      [1,2]    [1,2,3]    returns 3, leaves [1,2]
    `.trim(),
    whyItExists: `
Many real problems are last-in-first-out: undo/redo history, tracking
function calls (the call stack!), and checking that brackets are
balanced. A stack models that directly.
    `.trim(),
    whenToUse: `
Use a stack when the most recent item must come out first: undo history,
matching brackets, or tracking a path while backtracking through a maze
or tree.
    `.trim(),
    whenNotToUse: `
To process items in arrival order, use a queue instead. And if you often
need to inspect or remove items in the middle, the "only touch the top"
rule will fight you.
    `.trim(),
    commonMistakes: [
      "Trying to reach the middle of a stack directly instead of popping down to it.",
      "Popping an empty stack without checking first, which causes errors or `undefined`.",
      "Confusing a stack (LIFO) with a queue (FIFO). They solve different problems.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Implement a `Stack` class with `push`, `pop` and `peek` (view the top without removing it) methods." },
      { difficulty: "Medium", prompt: "Use a stack to check whether a string of parentheses like `\"(()())\"` is balanced." },
      { difficulty: "Hard", prompt: "Use a stack to reverse the words in a sentence without using built-in reverse methods." },
    ],
    interviewQuestions: [
      { question: "What does LIFO mean?", answer: "Last In, First Out: the most recently added item is always the first one removed." },
      { question: "What is a real-world use of a stack in programming?", answer: "The call stack, which tracks function calls. Also undo/redo, balanced-bracket checking, and browser back/forward-style history." },
      { question: "What's the time complexity of push and pop?", answer: "Both O(1). They only touch the top item; nothing shifts or gets scanned." },
      { question: "Compare an array-based stack to a linked-list-based one — what are the real tradeoffs?", answer: "An array-based stack is contiguous, so it has better cache locality, but a dynamic array sometimes resizes (an O(n) copy). A linked-list stack guarantees O(1) per operation with no resizing, but uses extra memory for a pointer per node and has worse cache locality." },
      { question: "What does 'amortized O(1)' mean for pushing onto a dynamic array-based stack, given that resizing is O(n)?", answer: "When the backing array fills, it usually doubles in capacity, an O(n) copy. Doubling makes resizes rarer as the stack grows, so all resizes across n pushes cost O(n) in total. That's O(1) per push on average, though a single resizing push costs O(n)." },
      { question: "What happens if you try to push onto a fixed-capacity array-based stack that's already full?", answer: "A fixed-size stack overflows, usually by throwing an error or refusing the push. A dynamic one resizes to a larger backing array first, then completes the push." },
      { question: "Is a call stack overflow the same kind of thing as overflowing a fixed-size custom stack?", answer: "Conceptually yes: both exceed the available capacity. The call stack's limit is the memory the OS/engine reserves for stack frames (exceeded by recursing too deeply). A custom stack's limit is whatever capacity its storage was given." },
      { question: "How would you design a stack that supports `push`, `pop`, and `getMin()` (current minimum) all in O(1)?", answer: "Keep a second stack that tracks the minimum at each point. On push, also push the smaller of (new value, current top of the min stack) onto it. On pop, pop both stacks. `getMin()` peeks the min stack's top, no scanning needed." },
      { question: "Trace a min-stack: push 5, push 3, push 7, push 3, pop, pop. What does `getMin()` return after each step?", answer: "push 5: main [5], min-stack [5], min=5. push 3: main [5,3], min-stack [5,3], min=3. push 7: main [5,3,7], min-stack [5,3,3] (7 isn't smaller than 3, so 3 repeats), min=3. push 3: main [5,3,7,3], min-stack [5,3,3,3], min=3. pop: removes 3 from both, main [5,3,7], min-stack [5,3,3], min=3. pop: removes 7 from both, main [5,3], min-stack [5,3], min=3. The repeated 3 is what keeps the minimum correct after the top 3 is popped." },
      { question: "How would you evaluate the postfix expression `\"3 4 + 2 *\"` using a stack?", answer: "Scan left to right: push 3, push 4. On `+`, pop 4 then 3, compute 3 + 4 = 7, push 7. Push 2. On `*`, pop 2 then 7, compute 7 * 2 = 14, push 14. The stack ends holding only the result, 14." },
      { question: "Why does evaluating postfix notation require a stack instead of computing left to right immediately?", answer: "An operator's operands may be results of earlier computations, not just raw numbers. The stack holds every intermediate result until an operator needs it." },
      { question: "How would you check whether a string like `\"{[()]}\"` has properly balanced brackets, using a stack?", answer: "Push each opening bracket. On a closing bracket, pop and check it matches; if it doesn't (or the stack is empty), the string is unbalanced. At the end, it's balanced only if the stack is empty." },
      { question: "Why does checking `\"([)]\"` for balance require tracking order with a stack, rather than just counting each bracket type?", answer: "In `\"([)]\"` the counts of `(`, `)`, `[` and `]` all match, but the nesting is wrong: `)` arrives before the inner `[` is closed. A stack catches this: when `)` arrives, the top is `[`, which doesn't match." },
      { question: "How would you implement a queue using two stacks?", answer: "Push to an 'in' stack to enqueue. To dequeue, if the 'out' stack is empty, pop everything from 'in' onto 'out'. This reverses the order, putting the oldest item on top of 'out'. Then pop from 'out'. If 'out' isn't empty, pop from it directly." },
      { question: "What's the amortized time complexity of dequeue in the two-stack queue, even though one dequeue can move every element between stacks?", answer: "Amortized O(1). Each element is pushed onto 'in' once and moved to 'out' at most once, so n operations make at most about 2n moves. That averages O(1) per operation, though one dequeue can occasionally cost O(n)." },
      { question: "What is the 'next greater element' problem, and how does a stack solve it in O(n) instead of O(n²)?", answer: "For each element, find the first larger element to its right. Checking every pair is O(n²). Instead, scan left to right with a stack of indices still waiting for an answer. While the current value is bigger than the top's value, pop that index and record the current value as its answer. Each index is pushed and popped at most once: O(n)." },
      { question: "How would you reverse a string (or a list's order) using a stack, and what's the space cost?", answer: "Push every item, then pop them all; a stack reverses insertion order. It costs O(n) extra space, since every element sits on the stack at once." },
      { question: "Why should code check whether a stack is empty before calling `pop()` or `peek()`?", answer: "An empty stack has no top item. Depending on the implementation, it may throw, return `undefined`, or (in a fixed-size array with an index counter) underflow the counter into an invalid state. Checking first avoids all of these." },
      { question: "How is the call stack itself an instance of the abstract stack data structure?", answer: "Each function call pushes a frame with its local variables, parameters and return address. On return, the frame is popped and the caller resumes at that address. The most recently called, unfinished function always finishes next: LIFO." },
      { question: "How would you convert a recursive function into an iterative one using an explicit stack, and why does this always work?", answer: "Keep your own stack of pending work (the arguments or state each recursive call would use). Loop: pop a unit of work, process it, and push any new work instead of recursing. It works because recursion itself runs on the call stack, so your own stack can simulate the same call-and-return behavior." },
      { question: "How does a browser's back/forward navigation map onto stack operations?", answer: "Visiting a new page pushes it onto a 'back' stack and usually clears the 'forward' stack, since that branch of history is no longer valid. Back pops from 'back' and pushes onto 'forward'. Forward does the reverse." },
      { question: "Why is peeking at a stack's top O(1), but checking whether a value exists anywhere in the stack O(n)?", answer: "Peek reads one element, the top, whatever the size. Only the top is reachable, so finding any other value may mean inspecting (or popping) every element." },
      { question: "What's the difference between a stack overflow and a stack underflow?", answer: "Overflow is exceeding capacity: pushing past a fixed-size stack's limit, or recursing until the call stack runs out of memory. Underflow is popping or peeking an empty stack." },
      { question: "Scenario: you're building undo/redo. Why use two separate stacks instead of one?", answer: "Undo pops an action off the undo stack, but that action must stay available to redo, so it's pushed onto a *separate* redo stack. One stack can't hold both 'actions to undo' and 'undone actions to reapply' as two independent sequences." },
      { question: "How would you sort a stack into ascending order using only one additional stack?", answer: "Pop each element from the original stack. Move elements from the sorted stack back onto the original until the sorted stack's top is not greater than the current element, then push the element onto the sorted stack. When the original is empty, the other stack is sorted. It's O(n²), since each insertion may reshuffle much of the sorted stack." },
      { question: "Why is a stack the natural structure for validating that HTML/XML tags are properly nested and closed?", answer: "Push each opening tag. Each closing tag must match the most recent unclosed tag, which is the stack's top. Popping and comparing on every closing tag checks nesting, just like bracket matching." },
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
Some work must be handled in arrival order: print jobs, support tickets,
tasks waiting to run. A **queue** adds items at the back and removes them
from the front, so whatever arrived first leaves first.

This rule is called **FIFO**: First In, First Out.
    `.trim(),
    analogy:
      "A queue is like a line at a coffee shop. New people join at the back, and whoever has waited longest is served next, from the front.",
    examples: [
      {
        title: "Using an array as a queue",
        code: `const queue = [];

queue.push("first");  // ["first"]
queue.push("second");  // ["first", "second"]

console.log(queue.shift()); // "first" — removes and returns the front item
console.log(queue);         // ["second"]`,
        explanation:
          "`push` adds to the back and `shift` removes from the front, so together they act like a queue. Note: `shift` is O(n) on a plain array, since every remaining item shifts down.",
        walkthrough: [
          { code: "const queue = [];", explanation: "An empty array, used as a queue." },
          { code: 'queue.push("first");', explanation: 'Adds "first" to the back.' },
          { code: 'queue.push("second");', explanation: 'Adds "second" behind "first".' },
          { code: "queue.shift();", explanation: 'Removes and returns the front item, "first", leaving ["second"].' },
        ],
      },
    ],
    howItWorks: `
A queue has two main operations: **enqueue** (add to the back) and
**dequeue** (remove from the front). Ideally both are O(1).

In JavaScript, a plain array's \`.shift()\` is O(n) because everything
shifts down. Real-world queues often use a linked list to keep both ends
O(1).
    `.trim(),
    diagram: `
enqueue("A")  enqueue("B")  dequeue()
     ↓             ↓            ↓
   [A]           [A,B]      returns "A", leaves [B]
    `.trim(),
    whyItExists: `
Queues model anything handled in arrival order: task scheduling, message
processing, serving requests, and breadth-first traversal of trees and
graphs.
    `.trim(),
    whenToUse: `
Use a queue when things must be handled in the order they arrived: a task
queue, a message queue, print jobs, or breadth-first traversal of a tree
or graph.
    `.trim(),
    whenNotToUse: `
If the newest item should go first, use a stack. For a high-throughput
queue in real code, avoid a plain array's \`.shift()\`; use a
linked-list-based queue or a dedicated library.
    `.trim(),
    commonMistakes: [
      "Confusing a queue's FIFO order with a stack's LIFO order.",
      "Using `.shift()` on a large array in performance-sensitive code without realizing it's O(n), not O(1).",
      "Not checking whether a queue is empty before dequeuing.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Implement a `Queue` class with `enqueue` and `dequeue` methods." },
      { difficulty: "Medium", prompt: "Use a queue to simulate a waiting line, printing the order people are served in." },
      { difficulty: "Hard", prompt: "Use a queue to do a breadth-first traversal of a simple tree of nested objects." },
    ],
    interviewQuestions: [
      { question: "What does FIFO mean?", answer: "First In, First Out: the earliest added item is always the first one removed." },
      { question: "What's a real-world use of a queue in software?", answer: "Task/job scheduling, request handling, and breadth-first search over trees and graphs." },
      { question: "Why is `.shift()` on a JavaScript array not ideal for a high-performance queue?", answer: "It's O(n): every remaining element moves down one index. A linked-list-based queue keeps both ends O(1)." },
      { question: "What is a circular buffer (ring buffer), and how does it give a queue O(1) enqueue and dequeue using a fixed-size array?", answer: "It reuses a fixed-size array with a `head` index (where the next dequeue reads) and a `tail` index (where the next enqueue writes). Both wrap back to 0 with modulo at the end of the array. Nothing shifts; each operation reads or writes at an index and advances it, so both are O(1)." },
      { question: "In a circular buffer, `head` and `tail` can both equal the same index whether the buffer is empty or completely full — how do implementations tell the two apart?", answer: "Most keep a separate `count` (or `size`) field, since head/tail alone is ambiguous. Others leave one slot always unused, so 'full' is `(tail + 1) % capacity === head` and 'empty' is `head === tail`." },
      { question: "Walk through enqueueing A, B, C and then dequeuing once, on an initially empty circular buffer of capacity 4. Where do `head` and `tail` end up?", answer: "Start: head=0, tail=0, count=0. enqueue(A): buffer[0]=A, tail becomes 1, count=1. enqueue(B): buffer[1]=B, tail becomes 2, count=2. enqueue(C): buffer[2]=C, tail becomes 3, count=3. dequeue(): returns buffer[head]=A, head becomes 1, count=2. Final state: head=1, tail=3, count=2, holding B and C." },
      { question: "Why must resizing a full circular buffer copy elements starting from `head`, rather than just copying the raw backing array index-by-index?", answer: "Once `tail` wraps past index 0, raw array order (0, 1, 2, ...) no longer matches insertion order, so a straight copy scrambles which item is oldest. Copying from `head` and wrapping exactly `count` times keeps the correct order in the new array." },
      { question: "What is a deque (double-ended queue), and how does it differ from a plain queue?", answer: "A deque supports O(1) insertion and removal at *both* ends. A plain queue is a deque limited to enqueue-at-back and dequeue-at-front." },
      { question: "What is a priority queue, and what does it typically use for insert/extract, along with the complexity of those operations?", answer: "It always returns the highest- (or lowest-) priority item next, whatever the arrival order. It's usually a binary heap: insert O(log n), extract-min/max O(log n), peek at the top O(1)." },
      { question: "Why doesn't a plain unsorted list or a sorted array make a good priority queue?", answer: "An unsorted list needs an O(n) scan on every extraction. A sorted array extracts in O(1) but each insertion is O(n) to shift elements. A binary heap does both in O(log n), which is far better when both happen often." },
      { question: "Building a binary heap from n elements one at a time (n inserts) costs O(n log n) — but there's a way to build one from an existing array in O(n). What is it, and why is it faster?", answer: "Bottom-up heapify: from the last non-leaf node back to the root, sift each node down into place. Most nodes are near the bottom and need very few swaps, so the total work sums to O(n), not O(n log n) as with one-at-a-time inserts." },
      { question: "What is a monotonic queue (or deque), and what classic problem does it solve in O(n) instead of O(n·k)?", answer: "It solves sliding window maximum. The deque keeps indices whose values strictly decrease from front to back. Before pushing a new index, pop any smaller values from the back; they can never be the max while a larger, later value is in the window. The front is always the window's max. Each index is pushed and popped at most once, so the whole array takes O(n) instead of recomputing each window's max." },
      { question: "How does breadth-first search (BFS) use a queue, and what happens if you swap in a stack instead?", answer: "BFS enqueues newly discovered neighbors and dequeues from the front, so nodes are explored in discovery order, level by level. With a stack, the *most recent* node is explored next, giving depth-first order: a different traversal, not a slower BFS." },
      { question: "Why is a queue (not a stack) the structure behind a level-order tree traversal?", answer: "Level order visits every node at depth d before any at depth d+1. FIFO guarantees this: nodes come out in discovery order, so a whole level drains before the next level's nodes (enqueued after them) are reached." },
      { question: "What's the amortized time complexity of dequeue in a queue implemented with two stacks (`in` and `out`), and why can a single call still cost O(n)?", answer: "Amortized O(1). When `out` is empty, a dequeue moves every element from `in` to `out`: O(n) that time. But each element moves at most once in its lifetime, so n operations cost O(n) in total, O(1) on average." },
      { question: "Why does a linked-list-based queue need a reference to both the head and the tail node, when a stack built the same way only needs one?", answer: "A stack only touches the top, so one pointer is enough. A queue dequeues at the front and enqueues at the back. Without `tail`, enqueue walks the whole list to find the last node: O(n) instead of O(1)." },
      { question: "What is a blocking queue, and where does it show up in concurrent programming?", answer: "A queue where dequeuing when empty (or enqueuing when a bounded queue is full) makes the thread wait instead of failing. It's the backbone of producer-consumer designs, like a thread pool's task queue, letting threads hand off work without busy-polling." },
      { question: "How does a JavaScript runtime's event loop use a queue?", answer: "Macrotask callbacks, like `setTimeout` callbacks or I/O completions, go on a task queue and run one at a time in the order queued (FIFO), interleaved with rendering and other work." },
      { question: "What's the time and space complexity of enqueue/dequeue on a well-implemented queue (linked list or circular buffer), versus using `.shift()` on a plain array?", answer: "O(1) time and O(1) extra space per operation for a linked-list queue (with head and tail pointers) and for a circular buffer (until it resizes). `.shift()` on a plain array is O(n) time, since every remaining element moves down one index." },
      { question: "Scenario: a task scheduler must process tasks in submission order, and thousands are submitted per second. Why would `array.push()` + `array.shift()` become a bottleneck, and what's the fix?", answer: "`.shift()` is O(n), so draining n tasks costs O(n²) in total, which dominates at high throughput. A circular buffer or linked-list queue keeps enqueue and dequeue O(1), so n tasks cost O(n)." },
      { question: "What's a common off-by-one bug when implementing a circular buffer's wraparound?", answer: "Forgetting the modulo when advancing `head`/`tail`: writing `tail = tail + 1` instead of `tail = (tail + 1) % capacity`. The index runs past the end of the array instead of wrapping to 0." },
      { question: "What happens if you call dequeue on an empty queue without checking first?", answer: "Depending on the implementation, it throws, returns `undefined`/`null`, or (in a hand-rolled circular buffer with no count check) reads stale data or corrupts the head/tail bookkeeping. Check for empty first." },
      { question: "Compare a circular-buffer-based queue to a linked-list-based queue in terms of memory layout and cache behavior.", answer: "A circular buffer is one contiguous pre-allocated array, so it's cache-friendly, but its capacity is fixed until an explicit O(n) resize. A linked-list queue grows one node at a time with no bulk resize, but nodes are usually separate heap allocations, causing more cache misses, plus an extra pointer per node." },
      { question: "Trace these operations on an initially empty queue: enqueue(1), enqueue(2), dequeue(), enqueue(3), dequeue(), dequeue(). What does each dequeue return, and what's left at the end?", answer: "enqueue(1) → [1]. enqueue(2) → [1,2]. dequeue() returns 1, leaving [2]. enqueue(3) → [2,3]. dequeue() returns 2, leaving [3]. dequeue() returns 3, leaving it empty. Items leave from the front in the order they were enqueued." },
      { question: "Why would you choose a priority queue over a regular queue for a hospital ER's 'next patient' system?", answer: "A regular queue serves in arrival order, but an ER must serve the most urgent patient first. A priority queue orders by urgency and extracts the top patient in O(log n) with a heap each time a slot opens." },
      { question: "What single difference between a stack and a queue — which end each operation happens at — changes the order items come out in?", answer: "A stack adds and removes at the *same* end: LIFO, newest out first. A queue adds at one end and removes at the *other*: FIFO, oldest out first. The same insertions come out in opposite orders." },
      { question: "What's the amortized time complexity of processing an entire n-element array through a monotonic queue (sliding window maximum), given that a single step can pop several elements at once?", answer: "O(n) amortized. One step can pop several smaller elements, but every element is pushed exactly once and popped at most once over the whole run, so total pushes and pops are O(n), not O(n) per step." },
      { question: "Why is a queue the right structure (not a stack) for a print spooler shared by many users?", answer: "Fairness: the first job submitted should print first, whoever sent it (FIFO). A stack prints the newest job first, so an early job could be starved forever by a stream of newer ones." },
      { question: "What's the difference between a bounded queue and an unbounded queue, and what does 'bounded' change about enqueue?", answer: "An unbounded queue grows as far as memory allows. A bounded queue has a fixed capacity, so enqueueing when full must reject the item, block until space frees up (a blocking queue), or evict something (like the oldest item)." },
    ],
    prerequisites: ["stack"],
    relatedTopics: ["stack", "linked-lists"],
    keywords: ["queue", "FIFO", "enqueue", "dequeue"],
  },
  {
    id: "hash-tables",
    title: "Hash Tables",
    level: "intermediate",
    description: "A structure that finds a value almost instantly by its key, without searching everything.",
    explanation: `
Searching an array means checking items one at a time, which gets slow
with lots of data. A **hash table** turns a key (like a name or an id)
into a number with a **hash function**, then uses that number to jump
straight to where the value is stored.

In JavaScript, plain objects and the \`Map\` class both build on this idea.
    `.trim(),
    analogy:
      "A hash table is like a theater coat check. Instead of searching every coat, you get a numbered ticket (the hash), and the attendant goes straight to that spot for your coat.",
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
          { code: "const ages = {};", explanation: "An empty object, used as a hash table." },
          { code: 'ages["amara"] = 28;', explanation: 'Stores 28 under the key "amara".' },
          { code: 'ages["diego"] = 34;', explanation: "Stores 34 under a different key." },
          { code: 'ages["amara"]', explanation: 'Jumps straight to the slot for "amara", no scanning.' },
        ],
      },
    ],
    howItWorks: `
A hash function turns a key into a number (a "hash") that maps to a
storage slot. A lookup hashes the key, jumps to that slot and reads the
value, with no scanning.

Sometimes two keys hash to the same slot (a "collision"). The table
handles this, for example by storing a small list at that slot.
    `.trim(),
    diagram: `
key "amara"
       ↓ hash function
    number: 42
       ↓
   slot 42 → 28
    `.trim(),
    whyItExists: `
Hash tables give O(1) average lookups, insertions and deletions. That
makes them essential for counting frequencies, caching results, removing
duplicates, and building sets and dictionaries.
    `.trim(),
    whenToUse: `
Use a hash table (object or Map) when you need fast lookup by key:
counting occurrences, checking for duplicates, caching results, or any
kind of dictionary.
    `.trim(),
    whenNotToUse: `
If you need items in a specific sequence, a hash table doesn't guarantee
position the way an array does. For a small, fixed handful of values,
checking each one directly can be faster.
    `.trim(),
    commonMistakes: [
      "Relying blindly on object key order. Modern JavaScript mostly preserves it for string keys, but know the rules rather than assume.",
      "Using an object when a `Map` would be safer, e.g. when keys aren't simple strings or when key order and size (`.size`) matter.",
      "Forgetting that average O(1) lookup can degrade if many keys collide (rare, but real).",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Use an object to count how many times each word appears in a sentence." },
      { difficulty: "Medium", prompt: "Write a function that returns `true` if an array has any duplicate values, using a hash table for O(n) performance." },
      { difficulty: "Hard", prompt: "Solve the 'two sum' problem (find two numbers in an array that add up to a target) in O(n) time using a hash table." },
    ],
    interviewQuestions: [
      { question: "What is a hash function?", answer: "A function that turns a key into a number that decides where its value is stored, ideally spreading keys evenly across slots." },
      { question: "What is the average time complexity of a hash table lookup?", answer: "O(1) on average, since the hash usually leads straight to the right slot." },
      { question: "What is a hash collision, and how is it handled?", answer: "Two different keys hash to the same slot. A common fix is to store several entries at that slot (e.g. in a small list) and check each one." },
      { question: "What three properties should a good hash function have?", answer: "Deterministic (the same key always gives the same hash), fast (so it doesn't cancel the O(1) benefit), and uniform (keys spread evenly across slots, keeping collisions, chains and probe sequences short)." },
      { question: "What is the load factor of a hash table, and why does it matter?", answer: "Stored entries divided by slots (`n / capacity`). As it rises, more keys share slots, so collisions grow and chains (or probe sequences) get longer, pushing lookups from O(1) toward O(n) in the worst case. Implementations resize when it crosses a threshold." },
      { question: "Why is resizing a hash table (rehashing) an O(n) operation, and why doesn't that ruin the 'O(1) average' claim for insertion?", answer: "Each entry's slot depends on `hash(key) % capacity`, so a new capacity moves almost every key. Resizing reinserts every entry into a bigger array: O(n). But resizes (usually doubling) get rarer as the table grows, so, like a dynamic array, the cost amortizes to O(1) per insertion." },
      { question: "What is separate chaining, and what does it cost in the worst case if every key hashes to the same slot?", answer: "Each slot holds a small structure (usually a linked list, sometimes a balanced tree) of the entries that hashed there. A lookup hashes to the slot, then scans that structure. If every key landed in one slot, it would hold all n entries and lookup becomes O(n), like a linear scan." },
      { question: "What is open addressing, and how does linear probing resolve a collision under it?", answer: "Open addressing stores every entry directly in the array, with no secondary structure. On a collision, linear probing checks the next slot (`(hash + 1) % capacity`), then the next, until it finds an empty one. Insert and lookup follow the same probe sequence." },
      { question: "What is primary clustering in linear probing, and why does it make things worse as load factor rises?", answer: "Colliding keys fill one unbroken run of occupied slots. Any new key hashing into that run probes through the whole cluster, and each insertion makes it longer. Clusters grow and merge, hurting average probe length well before the load factor nears 1." },
      { question: "How does quadratic probing try to reduce clustering compared to linear probing, and what's the tradeoff?", answer: "It checks slots at growing squared offsets (`hash+1², hash+4, hash+9...`), spreading probes out so collisions don't pile into one run. The tradeoff is *secondary* clustering: keys with the same starting slot still follow the same probe sequence." },
      { question: "How does double hashing address both primary and secondary clustering?", answer: "The probe step comes from a *second* hash of the key, so keys colliding at the same slot almost always take different steps and sequences. Linear probing uses one fixed step for everyone; quadratic probing uses the same offsets for every key colliding at a slot." },
      { question: "Why can't you just delete an entry from an open-addressing hash table by clearing its slot to empty?", answer: "A lookup probes until it hits an *empty* slot, then concludes the key is absent. If a slot in the middle of a probe sequence is cleared, a lookup for a key stored further along stops there early and wrongly reports it missing." },
      { question: "How do open-addressing hash tables actually support deletion, given the problem with clearing a slot outright?", answer: "They mark the slot with a 'tombstone' instead of clearing it. Lookups treat a tombstone as 'occupied, keep probing', while inserts can reuse it. Probing stays correct and the slot can still be reclaimed." },
      { question: "Why does average-case hash table lookup stay close to O(1) even though the worst case is O(n)?", answer: "With a good hash function and a bounded load factor (kept by resizing), the *expected* number of entries per slot stays a small constant, whatever n is. O(n) only happens when most or all keys collide into one slot." },
      { question: "What is a 'hash flooding' attack, and how do some languages defend against it?", answer: "An attacker who knows or guesses the hash function sends many keys that deliberately collide, pushing each operation toward O(n) and causing a denial of service. Some languages/runtimes defend by seeding the hash function with a random value at startup, so collisions can't be predicted without the secret seed." },
      { question: "What is the practical difference between using a plain JavaScript object and a `Map` as a hash table?", answer: "`Map` accepts any value as a key (including objects and functions, compared by reference), reliably keeps insertion order, and reports `.size`. A plain object coerces non-symbol keys to strings, inherits prototype properties unless guarded, and orders integer-like keys numerically before all others." },
      { question: "Two different object instances with identical contents are used as keys in a JavaScript `Map` — are they treated as the same key?", answer: "No. `Map` compares object keys by reference (the same object in memory), not by contents. Two separate objects that both look like `{ a: 1 }` are two keys." },
      { question: "Why is `NaN` a usable `Map` key, given that `NaN !== NaN` in JavaScript?", answer: "`Map` compares keys with SameValueZero, not `===`. SameValueZero treats `NaN` as equal to itself (its one difference from `===`), so `map.set(NaN, 1)` then `map.get(NaN)` returns `1`." },
      { question: "What's the time complexity of checking whether an array contains any duplicate values, using a hash table versus not?", answer: "With a hash table (a `Set`): O(n), one pass with an O(1) average check per element. Without one: comparing every pair is O(n²); sorting then scanning adjacent items is O(n log n), better but still slower than the hash table." },
      { question: "How does the 'two sum' problem go from O(n²) to O(n) using a hash table?", answer: "Brute force checks every pair: O(n²). Instead, walk the array once and check whether `target - number` is already in a hash map (value to index); if so, you've found the pair. Each lookup and insert is O(1) average, so the pass is O(n)." },
      { question: "Why can't you efficiently binary-search or iterate a hash table in sorted key order the way you can an array?", answer: "A key's slot depends on its hash, not on other keys' order, so similar keys land in unrelated slots. With no order to exploit, finding a range or the min/max key means scanning every entry, O(n), even though looking up a *known* key is O(1) average." },
      { question: "What is a hash set, and how does it relate to a hash table?", answer: "A hash table that stores only keys, no values. It uses the same hashing and collision handling to answer 'have I seen this before?' in O(1) average time, for membership tests and removing duplicates." },
      { question: "Why do a hash map and a doubly linked list, used together, give an LRU cache O(1) `get` and `put`?", answer: "The hash map finds a key's list node in O(1) average. The doubly linked list keeps entries in recency order, and since each node knows both neighbors, it removes from anywhere and re-inserts at the front in O(1). Together the cache can find, reorder and evict without scanning." },
      { question: "What is consistent hashing, and what problem does it solve that a plain `hash(key) % N` scheme doesn't?", answer: "With `hash(key) % N`, adding or removing one server (changing N) moves almost every key, invalidating nearly the whole distributed cache. Consistent hashing puts keys and servers on a shared ring of hash values and assigns each key to the next server clockwise. Adding or removing a server only moves the keys between it and its neighbor." },
      { question: "What is a Bloom filter, and how is it different from a hash set?", answer: "A Bloom filter is a probabilistic structure using a fixed-size bit array and several hash functions. It answers 'definitely not present' or 'possibly present', accepting a small false-positive rate in exchange for big space savings, since it never stores the keys. A hash set stores the real keys and is always exact, but its memory grows with the number of keys." },
      { question: "Why might a hash table implementation upgrade a slot's collision list into a balanced tree once it grows past a certain size (as Java's `HashMap` does)?", answer: "A linked-list bucket degrades to O(n) lookup if many keys collide there (from hash flooding or bad luck). Turning a long bucket into a balanced tree (like a red-black tree) caps worst-case lookup in that bucket at O(log n), for a little extra bookkeeping." },
      { question: "What is perfect hashing, and why does it only apply to a fixed, known set of keys?", answer: "It builds a hash function (often two-level) with zero collisions for a specific, known set of keys, giving true O(1) worst-case lookup. Building it needs the full key set in advance, so it can't handle arbitrary future insertions." },
      { question: "What is cuckoo hashing, and what's its worst-case lookup guarantee?", answer: "Each key has two candidate slots (from two hash functions, often across two tables), and lookup checks only those two: O(1) *worst case*, unlike chaining's O(n). Insertion costs more: if both slots are taken, it evicts an occupant and re-inserts that key into its alternate slot. That can cascade into a chain of evictions or, rarely, a full rehash if a cycle is detected." },
      { question: "What's the time complexity of iterating over every entry in a hash table, and does table capacity affect it?", answer: "In general O(n + capacity): visit every entry (O(n)) and check every slot (O(capacity)) in a simple array-of-buckets table. Capacity is usually kept proportional to n by resizing, so this is normally just called O(n)." },
      { question: "Why is using a mutable object as a dictionary key risky in languages where hashing is based on the object's *contents* (unlike JavaScript's `Map`, which hashes objects by reference)?", answer: "If the hash comes from the object's fields, changing the object after insertion changes its hash, but the table doesn't move it. A later lookup hashes to a different slot than where the entry lives, so the entry becomes silently unreachable." },
      { question: "Why does a hash table with a well-chosen hash function and controlled load factor still occasionally show a few lookups taking longer than others, even without an attack?", answer: "By chance, even a good hash function puts some keys in the same slot or nearby probe positions. The birthday paradox means some collisions are expected long before the table is full, so a few lookups doing extra comparisons is normal." },
      { question: "How would you design a hash function for strings, at a high level, and why is a simple sum of character codes a poor choice?", answer: "A common approach is a polynomial rolling hash: treat the string as digits in some base p (`s[0]*p^(n-1) + s[1]*p^(n-2) + ... + s[n-1]`), then take it modulo the table size. Summing character codes ignores order, so anagrams like 'listen' and 'silent' hash the same, causing many needless collisions." },
      { question: "Scenario: you're building a cache that must evict the least-recently-used entry once it hits a size limit, and needs O(1) `get`/`put`. Why is a hash table alone not enough?", answer: "A hash table gives O(1) lookup by key but knows nothing about recency, so finding the least-recently-used entry means scanning everything: O(n). It needs an ordering structure alongside it, a doubly linked list." },
      { question: "What is the practical difference between a hash table's worst-case and average-case complexity, and why do interview answers usually default to quoting the average case?", answer: "The O(n) worst case needs unusually bad collisions: a poor hash function, adversarial input or extreme bad luck. With a good hash function and a bounded load factor, normal inputs behave as O(1), which is what you see in practice. So O(1) average is the useful number; O(n) worst case is the limit to be aware of." },
      { question: "What's the difference between a hash table's `capacity` and its `size`, and why does an implementation usually keep capacity a prime number or a power of two?", answer: "`size` is the number of stored entries; `capacity` is the number of slots. A prime capacity (with modulo hashing) or a power of two (with bitmask hashing) tends to spread common hash values more evenly, so a poorly mixed hash is less likely to crowd keys into a few slots." },
      { question: "Compare a hash table to a balanced binary search tree (like a red-black tree) as a dictionary implementation — what does each give up?", answer: "A hash table gives O(1) average lookup/insert/delete but O(n) worst case, no ordering, and no efficient range queries or min/max. A balanced BST gives O(log n) worst case for all three, keeps keys sorted, and supports range queries and ordered traversal, but is slower on average for a plain exact-key lookup." },
      { question: "Why would `for...in` over a plain JavaScript object used as a hash table be riskier than iterating a `Map`'s entries?", answer: "`for...in` also walks enumerable properties inherited through the prototype chain. If a prototype (or a library) added any, they mix in with your data unless you guard with `hasOwnProperty` or use `Object.keys`/`entries`. A `Map` only iterates entries you `set`." },
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
Some problems are defined by smaller versions of themselves: the total of
a list, every folder inside a folder, a factorial. With **recursion**, a
function calls itself on a smaller input until the input is simple enough
to answer directly (the **base case**).

Every recursive function needs:

- a base case that stops the recursion
- a step that moves the problem toward that base case
    `.trim(),
    analogy:
      "Recursion is like Russian nesting dolls. You open each doll to find a smaller one inside, until you reach the smallest doll, which doesn't open. That smallest doll is the base case.",
    examples: [
      {
        title: "Factorial using recursion",
        code: `function factorial(n) {
  if (n <= 1) return 1;       // base case
  return n * factorial(n - 1); // recursive case
}

console.log(factorial(4)); // 4 * 3 * 2 * 1 = 24`,
        explanation:
          "Each call reduces `n` by 1 and calls itself, until `n` reaches 1 (the base case). Then the calls return back up the chain.",
        walkthrough: [
          { code: "function factorial(n) {", explanation: "Defines a function that calls itself." },
          { code: "if (n <= 1) return 1;", explanation: "The base case: stops the recursion once n is small enough." },
          { code: "return n * factorial(n - 1);", explanation: "The recursive case: multiplies n by the answer to a smaller version of the problem." },
        ],
      },
    ],
    howItWorks: `
Each recursive call goes on the call stack and waits for the call it made
to return. Once the base case is reached, the calls finish in reverse
order. Each one combines its result with what it got back, until the
original call returns.
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
Some structures and problems are naturally recursive: folders inside
folders, trees, some math definitions. Without recursion you need extra
bookkeeping that the call stack otherwise handles for you.
    `.trim(),
    whenToUse: `
Use recursion when a problem is defined by a smaller version of itself:
walking nested folders or a tree, or divide-and-conquer algorithms like
merge sort.
    `.trim(),
    whenNotToUse: `
For plain repetition (like summing a flat array), a loop is clearer and
avoids piling calls on the stack. On very large inputs, too many nested
calls can overflow the call stack.
    `.trim(),
    commonMistakes: [
      "Forgetting the base case, so the recursion never stops and the program crashes ('stack overflow').",
      "Writing a recursive case that doesn't move closer to the base case.",
      "Using recursion where a simple loop would be clearer and more efficient.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Write a recursive function that sums all numbers from 1 to n." },
      { difficulty: "Medium", prompt: "Write a recursive function that reverses a string." },
      { difficulty: "Hard", prompt: "Write a recursive function that returns all subsets of a given array." },
    ],
    interviewQuestions: [
      { question: "What two things does every recursive function need?", answer: "A base case that stops the recursion, and a recursive step that moves the input toward that base case." },
      { question: "What causes a 'stack overflow' in recursion?", answer: "Recursing too deeply (or forever, because of a missing or broken base case) fills the call stack past its limit." },
      { question: "When would you prefer recursion over a loop?", answer: "When the problem is recursive in shape, like trees, nested data or divide-and-conquer algorithms, where recursion reads more clearly than manual bookkeeping." },
      { question: "Trace `factorial(4)` step by step, showing both the 'calling down' and 'returning up' phases.", answer: "Calling down: `factorial(4)` calls `factorial(3)`, which calls `factorial(2)`, which calls `factorial(1)`. That hits the base case and returns 1. Returning up: `factorial(2)` returns `2 * 1 = 2`, `factorial(3)` returns `3 * 2 = 6`, and `factorial(4)` returns `4 * 6 = 24`." },
      { question: "What is the time and space complexity of the recursive factorial function, and where does the space cost come from?", answer: "O(n) time: n calls before the base case. O(n) space, from the call stack, not the values: each pending call waits on the stack, so n frames are alive at the deepest point." },
      { question: "Why does the iterative version of factorial only need O(1) extra space, while the recursive version needs O(n)?", answer: "The loop updates one running total and one counter in place. The recursive version keeps every pending frame (with its own `n` and pending multiplication) until deeper calls return, so memory grows with depth." },
      { question: "What is tail recursion, and does JavaScript automatically optimize it away like some other languages do?", answer: "A call is in tail position when it's the last thing the function does, with no work (like a multiplication) left afterwards. Engines with 'proper tail calls' reuse the current frame, making tail recursion O(1) stack space. ECMAScript 2015 includes proper tail calls, but most engines, including V8 (Chrome/Node.js), never shipped them; only Safari's JavaScriptCore does. So tail-recursive JavaScript does *not* reliably avoid stack growth." },
      { question: "Rewrite `factorial` to be tail-recursive using an accumulator parameter, and explain why the rewritten version qualifies as tail-recursive but the original doesn't.", answer: "`function factorial(n, acc = 1) { if (n <= 1) return acc; return factorial(n - 1, n * acc); }`. In the original (`return n * factorial(n - 1)`), the multiplication happens after the recursive call returns, so the call isn't the last action. The rewrite carries the product forward in `acc` and just returns the recursive call's result." },
      { question: "Given that most JavaScript engines don't implement proper tail calls, does making a function tail-recursive actually save it from stack overflow in Node.js?", answer: "No. In Node.js/V8 a tail call still pushes a new frame, so deep tail recursion can still overflow. The rewrite is cleaner and would be optimized on an engine that supports it (like Safari), but it's not a reliable fix in most JavaScript runtimes." },
      { question: "What is trampolining, and how does it let you simulate tail-call optimization manually in a language without it?", answer: "Each step returns a thunk (a zero-argument function for the next step) instead of calling itself. A driver loop (the 'trampoline') keeps calling the thunk it gets back until it receives a real value. Each step returns to the loop instead of recursing, so only one frame is ever on the stack." },
      { question: "What is memoization, and how does it change the time complexity of computing the nth Fibonacci number recursively?", answer: "Memoization caches each result by its input, so repeated calls return the cached value. Naive recursive Fibonacci recomputes the same subproblems (`fib(5)` calls `fib(3)` twice, `fib(2)` three times, and so on) and grows exponentially: usually quoted as O(2^n), with a tighter bound of O(φⁿ) ≈ O(1.618ⁿ). With memoization each `fib(k)` from 0 to n is computed once: O(n) time, plus O(n) space for the cache." },
      { question: "Why is naive recursive Fibonacci exponential, when the function only ever calls itself twice per invocation?", answer: "Each `fib(n)` calls `fib(n-1)` and `fib(n-2)`, and each of those calls two more. The number of calls roughly doubles per level over about n levels: exponential (usually bounded as O(2^n)). Many calls repeat the same subproblem; `fib(n-2)` is reached directly from `fib(n)` and again via `fib(n-1)`. That repeated work is what memoization removes." },
      { question: "What's the difference between 'linear recursion' (like factorial) and 'tree recursion' (like naive Fibonacci) in terms of the shape of the call graph, and how does that affect complexity?", answer: "Linear recursion makes one call per invocation, so the calls form a single chain of depth n, typically O(n) time. Tree recursion makes several calls per invocation, so the calls form a tree. The total grows with the tree's size, often exponentially, unless overlapping subproblems are memoized." },
      { question: "What is the recurrence relation for merge sort's time complexity, and what does it evaluate to?", answer: "`T(n) = 2T(n/2) + O(n)`: recurse on two halves, then do O(n) work merging. By the Master Theorem, that's O(n log n)." },
      { question: "What is the recurrence relation for a function like binary search's time complexity, and why does it resolve to O(log n) instead of O(n)?", answer: "`T(n) = T(n/2) + O(1)`: constant work, then recurse into only *one* half and discard the other. n can be halved log₂(n) times before reaching 1, so it's O(log n). Merge sort recurses into both halves." },
      { question: "What is divide-and-conquer, and how does recursion make it a natural fit?", answer: "Split a problem into smaller subproblems of the same shape, solve each (usually recursively), and combine the results. The 'divide' step becomes recursive calls on smaller inputs, the base case is the smallest subproblem, and the call stack tracks pending work automatically." },
      { question: "Why is recursion a natural fit for traversing a tree, but breadth-first traversal is conventionally written iteratively with an explicit queue instead?", answer: "A tree is defined recursively (a node plus subtrees), so depth-first recursion (process this node, then each child) mirrors it, and the call stack tracks the path back up. Breadth-first visits nodes level by level across branches, not down one chain. It needs a FIFO queue of discovered nodes, which the LIFO call stack doesn't give you." },
      { question: "What is mutual (indirect) recursion? Give an example.", answer: "Two or more functions that call each other instead of themselves, until a base case stops the chain. Example: `isEven(n)` returns `true` if `n === 0`, else `isOdd(n - 1)`; `isOdd(n)` returns `false` if `n === 0`, else `isEven(n - 1)`." },
      { question: "What's the subtle bug in `function sum(arr) { if (arr.length === 0) return 0; sum(arr.slice(1)) + arr[0]; }`?", answer: "There's no `return` on the recursive line, so its value is computed and thrown away. For any non-empty array, the function returns `undefined` instead of the sum." },
      { question: "Roughly how many stack frames can a JavaScript call stack hold before overflowing, and what does that mean for recursion on very large inputs?", answer: "It varies by engine and stack memory, typically from a few thousand up to about ten-to-fifteen thousand frames for ordinary functions in Node.js/V8. Recursing once per element of, say, a million-element array overflows long before finishing, though a simple loop would handle it fine." },
      { question: "Why is a loop generally preferred over recursion for a simple 'do this for every item' task, even though both can technically solve it?", answer: "A loop uses O(1) extra stack space; recursion adds a frame per call (O(n)) and can overflow on large inputs. When the task is plain repetition, not 'a smaller version of the same problem', recursion adds that cost for no benefit." },
      { question: "How would you convert an iterative loop that accumulates a total into a recursive function producing the same result?", answer: "Pass the running total and current position as parameters and recurse forward: `function sumFrom(arr, i = 0, total = 0) { if (i === arr.length) return total; return sumFrom(arr, i + 1, total + arr[i]); }`. The base case is reaching the end of the array; the state travels as arguments instead of loop variables." },
      { question: "What is backtracking, and how does it relate to plain recursion?", answer: "Recursion with a rule: try a choice, recurse, and if it doesn't lead to a valid solution, undo it and try the next. It prunes branches that can't work instead of exploring the whole search tree. It's used for permutations, Sudoku and N-Queens." },
      { question: "What's the time complexity of a recursive function that generates all subsets of an n-element array, and why?", answer: "O(2^n). Each element is either in or out, so there are 2^n subsets, and you must produce them all. The recursion branches in two (include / exclude) at each of the n elements." },
      { question: "What's the time complexity of a recursive function that generates all permutations of an n-element array, and why is it worse than the subset-generation recursion?", answer: "O(n!), since there are n! orderings. At each of n levels the recursion branches into the remaining choices, not a fixed 2. n! grows far faster than 2^n, so permutations become intractable at sizes where subsets may still be feasible." },
      { question: "Why does recursion make sense for traversing nested folders/JSON but not for looping over a flat array of numbers?", answer: "Nested folders are self-similar: a folder holds files and more folders. Processing 'this folder, then each subfolder the same way' matches that shape, and the depth isn't known in advance. A flat array is just a sequence to step through once, so a loop already fits." },
      { question: "Trace the call tree for `fib(4)` under naive (non-memoized) recursion, and count how many times `fib(1)` gets computed.", answer: "`fib(4)` calls `fib(3)` and `fib(2)`. `fib(3)` calls `fib(2)` and `fib(1)`. That `fib(2)` calls `fib(1)` and `fib(0)`. The `fib(2)` called directly from `fib(4)` also calls `fib(1)` and `fib(0)`. So `fib(1)` is computed 3 times and `fib(0)` 2 times: repeated work that memoization removes." },
      { question: "What's the extra space cost of the memoization cache itself in top-down (recursive) dynamic programming, on top of the call stack?", answer: "O(n), or however many distinct subproblems there are: one cache entry per distinct input (for Fibonacci, each integer from 0 to n). This is on top of the O(n) call stack depth." },
      { question: "How would you decide whether a recursive solution should make one recursive call, two, or more, just from how the problem is worded?", answer: "Count how many smaller subproblems the definition refers to. One smaller instance (like 'the sum of everything after the first element') means one call. Several (like Fibonacci's 'sum of the previous two', or 'include or exclude this item') means one call per subproblem." },
      { question: "Why can two functions that are both 'O(n) recursive calls deep' have very different actual running times?", answer: "Depth only counts how many calls are pending at once. It says nothing about the work per call or how many sibling calls each level makes. A linear function doing O(1) per call and a tree-recursive one branching in two can both reach depth n, but the tree-recursive one does exponentially more total work." },
      { question: "A recursive function meant to reduce the problem size still infinitely recurses even though the recursive call is present. What's usually wrong?", answer: "The argument doesn't actually get smaller, e.g. calling `recurse(n)` instead of `recurse(n - 1)`, or slicing the wrong end of an array. Each call sees the same input, so the base case is never reached." },
      { question: "Scenario: a recursive function correctly returns the right answer for small inputs during testing, but crashes in production. What are the two most likely explanations, in order of likelihood?", answer: "Most likely, production input is much larger or deeper than the tests, and the recursion exceeds the call stack limit even though the logic is right. Less often, an untested edge case (an empty array, a negative number, a value that skips the base case) causes infinite or far deeper recursion." },
      { question: "What does it mean for a recursive algorithm to have 'overlapping subproblems,' and why is that specifically what makes memoization worthwhile?", answer: "The recursion calls itself with the *same* arguments more than once along different paths (like `fib(n-2)` reached directly and via `fib(n-1)`). Memoization only pays off then; if every call has distinct arguments, there's nothing to reuse." },
      { question: "Why doesn't merge sort benefit from memoization the way naive Fibonacci does?", answer: "Each call works on a distinct, non-overlapping part of the array; `mergeSort(arr[0..n/2])` and `mergeSort(arr[n/2..n])` never recur with the same input. With no repeated subproblems, there's nothing to cache." },
      { question: "Two recursive functions each solve an n-element problem: one recurses on `n - 1` (one smaller), the other recurses on `n / 2` (halved) — both making a single recursive call. Why is one typically O(n) and the other O(log n)?", answer: "Subtracting 1 each time takes n steps to reach the base case: O(n). Halving each time takes about log₂(n) steps: O(log n). The gap grows dramatically as n grows." },
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
Checking items one at a time could take a million checks in a
million-item list. If the list is **sorted**, there's a faster way.

Check the middle item. If it's too big, the answer is in the left half;
if too small, the right half. Repeat on whatever is left. This is
**binary search**, and it finds a value among a million items in about
20 checks.
    `.trim(),
    analogy:
      "It's how you find a word in a paper dictionary. You don't start at page 1. You open to the middle, see whether you've gone too far, and jump to the middle of the correct half, repeating until you find the word.",
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
          { code: "let low = 0; let high = sortedArray.length - 1;", explanation: "Marks the search range: the whole array, to start." },
          { code: "const mid = Math.floor((low + high) / 2);", explanation: "Picks the middle index of the range." },
          { code: "if (sortedArray[mid] === target) return mid;", explanation: "Found it: return right away." },
          { code: "low = mid + 1; / high = mid - 1;", explanation: "Narrows the range to the half that could still hold the target." },
        ],
      },
    ],
    howItWorks: `
Each check rules out half of what's left. From \`n\` items you go to
\`n/2\`, then \`n/4\`, then \`n/8\`. That halving means only about
\`log2(n)\` steps, far fewer than checking every item.
    `.trim(),
    diagram: `
[1,3,5,7,9,11,13] — looking for 11
        ↓ check middle (7) → too small → search right half
   [9,11,13]
        ↓ check middle (11) → found!
    `.trim(),
    whyItExists: `
Binary search clearly shows why algorithm choice matters. On sorted data,
the same problem goes from O(n) to O(log n), a gap that becomes enormous
as data grows.
    `.trim(),
    whenToUse: `
Use binary search when you repeatedly search a large, sorted collection.
It turns an O(n) scan into an O(log n) lookup.
    `.trim(),
    whenNotToUse: `
If the data isn't sorted and can't easily stay sorted, sorting first costs
more than one linear search. For a very small list, just check each item.
    `.trim(),
    commonMistakes: [
      "Using binary search on unsorted data. It silently gives wrong answers instead of failing.",
      "Getting the `low`/`high` update backwards, causing an infinite loop or skipped elements.",
      "Off-by-one errors in the midpoint or the boundary updates.",
    ],
    exercises: [
      { difficulty: "Easy", prompt: "Implement binary search on a sorted array of numbers, returning the target's index." },
      { difficulty: "Medium", prompt: "Change binary search to return the index where a value *should* be inserted to keep the array sorted, even if it isn't found." },
      { difficulty: "Hard", prompt: "Use binary search to find the smallest number in a sorted array that has been rotated (e.g. `[4,5,6,1,2,3]`)." },
    ],
    interviewQuestions: [
      { question: "What is required for binary search to work?", answer: "The data must be sorted. Binary search relies on ruling out half the remaining data with one comparison." },
      { question: "What is the time complexity of binary search?", answer: "O(log n), since each step halves the remaining search space." },
      { question: "Why is O(log n) so much better than O(n) for large inputs?", answer: "Logarithmic growth is very slow: doubling the input adds just one step, while linear growth doubles the work." },
      { question: "Walk through why binary search takes O(log n) steps: starting with n items, how many remain after each comparison?", answer: "Each comparison removes half the range: about n/2 left after 1 step, n/4 after 2, n/2^k after k. The search ends near 1 item, when n/2^k ≈ 1, so k ≈ log₂(n). Steps grow logarithmically, not linearly." },
      { question: "What precondition does binary search require that makes it inapplicable to a linked list, even though a linked list can be sorted?", answer: "O(1) random access, to jump straight to the middle of the range. A linked list must walk from the head to reach the middle, O(n), so 'jumping to the middle' costs as much as a full scan and the benefit disappears." },
      { question: "In `const mid = Math.floor((low + high) / 2)`, why does this implementation need `while (low <= high)` rather than `while (low < high)`?", answer: "`low <= high` still checks the case `low === high`, the last remaining candidate. With `low < high`, that element is skipped and a target sitting there is wrongly reported 'not found'." },
      { question: "What's the classic overflow bug with `mid = Math.floor((low + high) / 2)` in languages with fixed-width integers, and how do implementations avoid it?", answer: "If `low + high` exceeds the maximum integer (32-bit signed overflow in Java/C++), it wraps to a negative or garbage value and `mid` is nonsense. The fix is `mid = low + Math.floor((high - low) / 2)`, which never adds the two. It's not a practical concern for array indices in JavaScript, whose numbers are IEEE-754 doubles that represent integers exactly up to 2^53, but it's a real trap in fixed-width-integer languages." },
      { question: "How would you modify binary search to find the leftmost (first) occurrence of a target value that appears multiple times in a sorted array?", answer: "On `arr[mid] === target`, don't return. Record `mid` as a candidate and keep searching the *left* half (`high = mid - 1`) until `low > high`. The last candidate recorded is the leftmost occurrence. Still O(log n)." },
      { question: "Symmetrically, how would you find the rightmost (last) occurrence of a duplicated target?", answer: "On `arr[mid] === target`, record `mid` and keep searching the *right* half (`low = mid + 1`). The last candidate recorded when `low > high` is the rightmost occurrence." },
      { question: "How would you find the index where a value should be inserted into a sorted array to keep it sorted, even if that exact value isn't present?", answer: "Run a normal binary search, but return `low` instead of -1 when the loop ends. By then `low` is the first index whose value is `>=` the target, which is the correct insertion point." },
      { question: "How would you search for a target in a sorted array that's been rotated at an unknown pivot (e.g. `[4,5,6,7,0,1,2]`), while keeping O(log n) time?", answer: "Each step, compare `arr[low]` with `arr[mid]` to find the normally sorted half. If `arr[low] <= arr[mid]`, the left half is sorted: search it if the target falls in its range, otherwise search the right half. If the right half is the sorted one, do the mirror image. One half is still discarded per step, so it stays O(log n)." },
      { question: "In the rotated-array search, why does at least one half always have to be properly sorted, no matter where the pivot is?", answer: "Rotation creates exactly one 'break point' where a smaller value follows a larger one. Any range that doesn't cross it is in ascending order. The break point can fall in at most one half, so the other half is always fully sorted." },
      { question: "For a rotated sorted array that may contain duplicate values (e.g. `[3,3,1,3]`), why can the 'which half is sorted' check fail, and what does that do to worst-case time complexity?", answer: "If `arr[low] === arr[mid] === arr[high]`, you can't tell which half is ordered. The usual fix is to shrink the range by one (`low++` or `high--`) and try again. With nearly all-identical values, this degrades to O(n), since it may discard only one element per step." },
      { question: "How would you find the minimum element in a rotated sorted array (no duplicates) using binary search?", answer: "Compare `arr[mid]` with `arr[high]`. If `arr[mid] > arr[high]`, the rotation point (and the minimum) is to the right, so `low = mid + 1`. Otherwise the minimum is at `mid` or to its left, so `high = mid` (not `mid - 1`, since `mid` could be the answer). The range keeps halving: O(log n)." },
      { question: "You have a fully sorted 2D matrix where every row is sorted left-to-right and the first element of each row is greater than the last element of the previous row. How would you binary search it in O(log(m·n))?", answer: "Treat it as one flattened array of length m*n, without copying. Map a flat index i to `(row, col) = (Math.floor(i / cols), i % cols)`, compare `matrix[row][col]` with the target, and narrow `low`/`high` as in 1D binary search. With m*n elements, that's O(log(mn)) steps." },
      { question: "A different, more common kind of sorted 2D matrix has every row sorted left-to-right *and* every column sorted top-to-bottom, but rows aren't necessarily continuous with each other. Why doesn't the flattened-1D binary search work here, and what O(m+n) approach does?", answer: "Rows don't continue where the previous one ended, so the flattened order isn't globally sorted and halving breaks. Instead, start at the top-right corner: move left if the value is bigger than the target (dropping that column), move down if smaller (dropping that row), stop if equal. Each step drops a row or column, so at most m + n steps: O(m+n), much better than checking every cell." },
      { question: "What's the recursive-versus-iterative tradeoff for implementing binary search, in terms of space?", answer: "Iterative uses a few fixed variables (`low`, `high`, `mid`): O(1) extra space. Recursive adds a stack frame per halving, about log₂(n) of them: O(log n) extra space." },
      { question: "How would you find the square root of a non-negative number to some precision using binary search, given that the input isn't a discrete sorted array?", answer: "Search the *range of possible answers*. Set `low = 0` and `high = n` (or a known upper bound), check whether `mid * mid` is below, above or close enough to `n`, and narrow the range. Stop when `high - low` is below the desired precision. This is 'binary search on the answer'." },
      { question: "What is 'binary search on the answer,' and what property must the answer space have for it to apply, even with no literal sorted array to search?", answer: "It applies halving to a range of candidate answers. You need a cheap check for 'is this candidate feasible?', and feasibility must be monotonic: once a value works, every value on one side of it works too. That yes/no boundary lets you discard half the candidates per check, like a sorted array." },
      { question: "Give an example of a problem solved with 'binary search on the answer' that has nothing to do with searching an array.", answer: "'Find the minimum eating speed k to finish all banana piles within h hours.' Binary search k from 1 to the largest pile. For each candidate, check in O(n) whether that speed finishes in time; this is monotonic, since if k works, every larger k works. Total: O(n log(max pile size)), instead of trying every speed." },
      { question: "What is exponential (galloping) search, and when is it more appropriate than plain binary search?", answer: "Use it when the array's size is unknown or effectively unbounded. Check index 1, then double (2, 4, 8, 16...) until the value is `>=` the target or you pass the end. Then binary search inside that last range. It finds a target at position p in O(log p), without knowing the length upfront." },
      { question: "What is ternary search, and why doesn't it beat binary search for simply finding a value in a sorted array?", answer: "It splits the range into three parts with two midpoints, discarding a third per step. Its depth is O(log₃ n), fewer levels than O(log₂ n), but each level makes two comparisons instead of one. Total comparisons are about the same order (often slightly worse), so it gives no asymptotic gain for plain search. It's mainly used to find the peak of a unimodal function." },
      { question: "Why does binary search silently give a wrong answer on unsorted data instead of erroring out?", answer: "It assumes that if the middle is too small, everything to its left is too (and the reverse), which only sorting guarantees. On unsorted data it still runs and returns an index or -1 with no way to detect the problem. It may report 'not found' for a present value, or return the wrong index." },
      { question: "Compare a hash table lookup to binary search for finding a value — when would you prefer O(log n) binary search over O(1) average hash table lookup?", answer: "Prefer binary search on a sorted array when you also need range queries, min/max or ordered iteration, which a hash table can't do efficiently. For exact lookups only, the hash table's O(1) average beats O(log n)." },
      { question: "If you only need to perform a single search on data that isn't already sorted, is it worth sorting the array first to enable binary search?", answer: "No. Sorting is O(n log n) plus O(log n) for the search, worse than one O(n) scan. Sorting only pays off when you search the same data many times." },
      { question: "What's the time complexity of finding both the first and last position of a target value in a sorted array with duplicates, using two separate binary searches?", answer: "O(log n). Each search (leftmost and rightmost) is O(log n), and two of them is still O(log n)." },
      { question: "What is the relationship between binary search and a binary search tree (BST)?", answer: "A BST applies the same halving idea (left if smaller, right if larger) to a dynamic linked structure. A balanced BST gives O(log n) search *and* insertion/deletion. A sorted array gives O(log n) search but O(n) insertion, since later elements must shift." },
      { question: "Trace a binary search for `target = 2` on `[1, 2, 4, 6, 8, 10]` (indices 0-5), reporting every `low`, `high`, and `mid` along the way.", answer: "low=0, high=5: mid=2, arr[2]=4 > 2, so high = 1. low=0, high=1: mid=0, arr[0]=1 < 2, so low = 1. low=1, high=1: mid=1, arr[1]=2 === target. Found at index 1." },
      { question: "What happens if you accidentally write `high = mid` instead of `high = mid - 1` in the standard `while (low <= high)` template, when the target is smaller than `arr[mid]`?", answer: "`mid` was already ruled out, but it stays in the range and can be checked again. Once `low` and `high` are adjacent or equal, `mid` can keep landing on the same index and the loop never ends. Exclude the checked `mid` on both sides." },
      { question: "What's the difference in `mid` calculation risk between `Math.floor((low + high) / 2)` and using bitwise `(low + high) >> 1` in JavaScript for very large arrays?", answer: "`Math.floor` works on regular doubles, exact for integers up to 2^53, far beyond any realistic array. `>>` first converts to 32-bit signed integers, so if `low + high` exceeds about 2^31 it silently wraps and gives the wrong midpoint. Rare, but a real trap." },
      { question: "How would you find a 'peak element' in an array (one greater than both its neighbors) using a binary-search-like approach, even though the array isn't sorted?", answer: "Compare `arr[mid]` with `arr[mid + 1]`. If `arr[mid] < arr[mid + 1]`, values are still climbing, so a peak exists to the right; search the right half. Otherwise a peak is at `mid` or to its left; search the left half including `mid`. Each comparison shows which side must contain a peak, so you discard half per step: O(log n)." },
      { question: "Why is it important that binary search's loop always makes forward progress, and what's a bug pattern that violates this?", answer: "If `low`/`high` don't shrink on some pass, the loop can run forever. A common bug: `mid = Math.floor((low + high) / 2)` with `low = mid` (instead of `mid + 1`). With low=3, high=4, `mid` is 3, so `low = mid` changes nothing and the loop repeats forever." },
      { question: "Scenario: you're building an autocomplete feature backed by a large sorted list of terms, and need 'all terms that start with prefix P.' How would binary search help, beyond just finding one exact match?", answer: "Run two binary searches: one for the leftmost term `>= P` (start of the range), and one for the leftmost term `>=` the next prefix after P (e.g. P with its last character incremented), the end of the range. Everything in between starts with P. Both are O(log n), so the range is found without a linear scan." },
      { question: "What's the time complexity of binary search in terms of the number of comparisons, precisely, and how does that relate to the O(log n) Big-O statement?", answer: "At most ⌊log₂(n)⌋ + 1 comparisons in the worst case. O(log n) is the same growth rate without the exact constant and base; changing a logarithm's base only scales it by a constant, which Big O ignores." },
      { question: "Why does binary search's advantage over linear search grow more dramatic as the input size increases, rather than staying at a fixed multiple?", answer: "Doubling the input doubles linear search's worst case but adds only one comparison to binary search. So the ratio keeps growing: about 1,000 vs. 10 comparisons at 1,000 items, but about 1,000,000,000 vs. 30 at 1,000,000,000 items." },
      { question: "Does binary search still work correctly on an array sorted in descending order?", answer: "Not with the standard ascending logic, which needs to know which side holds smaller values. Flip the comparisons (go left when `arr[mid]` is too small, right when too large) and it works in O(log n). Unmodified ascending logic on descending data gives wrong results, like running it on unsorted data." },
    ],
    prerequisites: ["arrays", "recursion"],
    relatedTopics: ["big-o", "arrays", "recursion"],
    keywords: ["binary search", "sorted array", "log n", "divide and conquer"],
  },
];
