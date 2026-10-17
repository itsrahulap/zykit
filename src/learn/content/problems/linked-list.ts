import type { Problem } from "../../types/problem";

export const linkedListProblems: Problem[] = [
  {
    id: "reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: "Easy",
    category: "linked-list",
    description: `
Given the head of a singly linked list (each node points only to the next
one), reverse the list and return the new head.

Don't just relabel the values — rewire each node's pointer to point at the
node that came before it.
    `.trim(),
    examples: [
      { input: "head = [1, 2, 3, 4, 5]", output: "[5, 4, 3, 2, 1]" },
      { input: "head = [1, 2]", output: "[2, 1]" },
      { input: "head = []", output: "[]", explanation: "An empty list reversed is still empty." },
    ],
    constraints: ["The number of nodes is between 0 and 5000.", "-5000 <= Node.val <= 5000"],
    hints: [
      "Once you overwrite a node's next pointer, you lose the rest of the list — so save 'next' first.",
      "As you walk the list, you only need two things: the node you just rewired and the node you're rewiring now.",
      "The last node you visit becomes the new head.",
    ],
    approachOverview: `
Flip one pointer at a time as you walk the list. Order matters: once you
overwrite a node's next pointer, you can't reach the rest of the list
unless you saved that reference first.

Carry three references: the previous node (initially null), the current
node, and (briefly) the next node. At each step, point the current node
backward, then move all three one step forward.

You can also do it recursively: reverse the rest of the list first, then
fix the one link at the front.
    `.trim(),
    solutions: [
      {
        approach: "Recursive Reversal",
        explanation: `
Trust that the recursive call reverses everything after the current node,
then fix the link between the current node and the rest.

After the rest is reversed, the node right after the current one is the
*last* node of that reversed piece. Point it back at the current node, and
clear the current node's forward pointer.

It reads nicely, but every call stays on the stack until the end of the
list, so it uses memory proportional to the list's length.
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function reverseList(head) {
  if (head === null || head.next === null) {
    return head;
  }

  const newHead = reverseList(head.next);

  // head.next is currently the last node of the already-reversed rest.
  // Make it point back at head, then clear head's old forward link.
  head.next.next = head;
  head.next = null;

  return newHead;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) — call stack depth equals list length",
      },
      {
        approach: "Optimal — Iterative Pointer Rewiring",
        explanation: `
Walk the list once with a "previous" pointer that starts at null. At each
node, save its next pointer, point the node back at "previous", then move
"previous" and "current" one step forward.

When "current" runs off the end, "previous" is on the old last node — the
new head.
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr !== null) {
    const next = curr.next; // save before we overwrite curr.next
    curr.next = prev;       // flip the pointer
    prev = curr;            // advance prev
    curr = next;            // advance curr
  }

  return prev; // prev now points at the old tail — the new head
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let prev = null;", explanation: "The first node becomes the last, so it ends up pointing at null." },
          { code: "const next = curr.next;", explanation: "Saves the next node before that link is overwritten." },
          { code: "curr.next = prev;", explanation: "Points the current node backward instead of forward." },
          { code: "prev = curr; curr = next;", explanation: "Moves both pointers one step forward using the saved reference." },
          { code: "return prev;", explanation: "When curr falls off the list, prev is on the last node visited — the new head." },
        ],
      },
    ],
    relatedProblems: ["merge-two-sorted-lists", "reorder-list"],
    keywords: ["reverse linked list", "pointer rewiring", "recursion"],
  },
  {
    id: "merge-two-sorted-lists",
    title: "Merge Two Sorted Lists",
    difficulty: "Easy",
    category: "linked-list",
    description: `
Given the heads of two linked lists, each sorted in increasing order,
merge them into one sorted list and return its head.

Reuse the existing nodes instead of creating new ones — just re-link the
pointers so the values come out in order.
    `.trim(),
    examples: [
      { input: "list1 = [1, 2, 4], list2 = [1, 3, 4]", output: "[1, 1, 2, 3, 4, 4]" },
      { input: "list1 = [], list2 = []", output: "[]" },
      { input: "list1 = [], list2 = [0]", output: "[0]" },
    ],
    constraints: ["The number of nodes in each list is between 0 and 50.", "-100 <= Node.val <= 100", "Both lists are sorted in non-decreasing order."],
    hints: [
      "Both lists are sorted, so the smallest remaining value is always at the front of one of them.",
      "A throwaway 'dummy' node before the real head means the first comparison needs no special case.",
      "When one list runs out, the rest of the other is already sorted — attach it all at once.",
    ],
    approachOverview: `
You could put every value in one collection, sort it, and rebuild a list.
That works, but it ignores that the lists are already sorted, so you pay
for a sort you don't need.

Instead, walk both lists side by side with two pointers. At each step,
attach the smaller front node to the result and advance only that
pointer. When one list runs out, attach the rest of the other. This merges
the lists in one pass.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Collect, Sort, Rebuild",
        explanation: `
Copy every value from both lists into an array, sort it, and build a new
list from it. This ignores that the inputs are already sorted, so it does
more comparisons than needed.
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function mergeTwoLists(list1, list2) {
  const values = [];

  let node = list1;
  while (node) {
    values.push(node.val);
    node = node.next;
  }
  node = list2;
  while (node) {
    values.push(node.val);
    node = node.next;
  }

  values.sort((a, b) => a - b);

  const dummy = new ListNode(0);
  let curr = dummy;
  for (const value of values) {
    curr.next = new ListNode(value);
    curr = curr.next;
  }

  return dummy.next;
}`,
        timeComplexity: "O((n + m) log(n + m))",
        spaceComplexity: "O(n + m)",
      },
      {
        approach: "Optimal — Two-Pointer Merge",
        explanation: `
Keep one pointer on each list. Compare the front values, attach the
smaller node to the result, and advance only that pointer.

A dummy node at the front gives the first real node somewhere to attach
without a special case. When one list runs out, the rest of the other is
already sorted, so attach it in one step.
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function mergeTwoLists(list1, list2) {
  const dummy = new ListNode(0);
  let curr = dummy;

  while (list1 !== null && list2 !== null) {
    if (list1.val <= list2.val) {
      curr.next = list1;
      list1 = list1.next;
    } else {
      curr.next = list2;
      list2 = list2.next;
    }
    curr = curr.next;
  }

  // At most one of these still has nodes left, and they're already sorted.
  curr.next = list1 !== null ? list1 : list2;

  return dummy.next;
}`,
        timeComplexity: "O(n + m)",
        spaceComplexity: "O(1) — reuses existing nodes",
        walkthrough: [
          { code: "const dummy = new ListNode(0);", explanation: "A throwaway node so the first real node needs no special case." },
          { code: "if (list1.val <= list2.val) { ... } else { ... }", explanation: "Picks the list with the smaller front value." },
          { code: "curr.next = list1; list1 = list1.next;", explanation: "Attaches that node to the result and advances only its list." },
          { code: "curr.next = list1 !== null ? list1 : list2;", explanation: "Once one list is empty, the rest of the other is already sorted, so it attaches in one step." },
        ],
      },
    ],
    relatedProblems: ["reverse-linked-list", "merge-k-sorted-lists"],
    keywords: ["merge sorted lists", "two pointers", "dummy node"],
  },
  {
    id: "linked-list-cycle",
    title: "Linked List Cycle",
    difficulty: "Easy",
    category: "linked-list",
    description: `
Given the head of a linked list, decide whether it has a cycle: a node
whose pointer loops back to an earlier node instead of eventually
reaching null.

Return only true or false — you don't need to find where the cycle starts
or how long it is.
    `.trim(),
    examples: [
      { input: "head = [3, 2, 0, -4], the last node connects back to the node with value 2", output: "true" },
      { input: "head = [1, 2], the last node connects back to the first node", output: "true" },
      { input: "head = [1]", output: "false", explanation: "A single node whose pointer is null has nowhere to loop back to." },
    ],
    constraints: ["The number of nodes is between 0 and 10^4.", "-10^5 <= Node.val <= 10^5"],
    hints: [
      "Recording every visited node works — revisiting one means a cycle — but costs extra memory.",
      "Picture two runners, one twice as fast. On a loop track, the faster one eventually laps the slower one.",
      "If the fast pointer reaches the end of the list (null), there's no loop.",
    ],
    approachOverview: `
The simple approach stores every visited node in a set. Landing on a node
already in the set means there's a cycle; reaching null means there isn't.
This costs extra memory for every node.

A better approach uses two pointers: a slow one that moves one node at a
time and a fast one that moves two. With no cycle, the fast pointer reaches
the end. With a cycle, the fast pointer enters the loop and closes the gap
on the slow one until they meet on the same node. This needs no extra
memory.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Track Visited Nodes",
        explanation: `
Walk the list and store every node you see in a set. If the current node
is already in the set, there's a cycle. If you reach null first, there
isn't.
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function hasCycle(head) {
  const visited = new Set();
  let node = head;

  while (node !== null) {
    if (visited.has(node)) return true;
    visited.add(node);
    node = node.next;
  }

  return false;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal — Floyd's Tortoise and Hare",
        explanation: `
Start two pointers at the head: slow moves one node per step, fast moves
two. If fast (or its next node) hits null, the list ends and there's no
cycle. If the two pointers land on the same node, fast has lapped slow
inside a loop, which only happens when a cycle exists.
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function hasCycle(head) {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }

  return false;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "let slow = head; let fast = head;", explanation: "Both runners start at the same place." },
          { code: "while (fast !== null && fast.next !== null)", explanation: "Stops as soon as the fast runner would fall off the end — meaning no cycle." },
          { code: "slow = slow.next; fast = fast.next.next;", explanation: "The fast runner moves twice as fast as the slow one." },
          { code: "if (slow === fast) return true;", explanation: "If there's a loop, the fast runner eventually catches the slow one from behind." },
        ],
      },
    ],
    relatedProblems: ["find-the-duplicate-number", "reorder-list"],
    keywords: ["cycle detection", "floyd's algorithm", "tortoise and hare", "fast slow pointers"],
  },
  {
    id: "reorder-list",
    title: "Reorder List",
    difficulty: "Medium",
    category: "linked-list",
    description: `
Given the head of a singly linked list L0, L1, L2, ..., Ln, rearrange it
in place to read L0, Ln, L1, Ln-1, L2, Ln-2, and so on — alternating one
node from the front and one from the back, working inward.

Change the pointers between existing nodes; don't copy or swap the values.
    `.trim(),
    examples: [
      { input: "head = [1, 2, 3, 4]", output: "[1, 4, 2, 3]" },
      { input: "head = [1, 2, 3, 4, 5]", output: "[1, 5, 2, 4, 3]" },
      { input: "head = [1]", output: "[1]", explanation: "A single node has nothing to interleave with." },
    ],
    constraints: ["The number of nodes is between 1 and 5 * 10^4.", "1 <= Node.val <= 1000"],
    hints: [
      "With every node in an array, you could read off the pattern with one pointer at the front and one at the back.",
      "Without extra memory: the second half, reversed, is exactly the sequence you need to interleave with the first half.",
      "Finding the middle to split the list is a fast/slow pointer problem.",
    ],
    approachOverview: `
The direct approach puts every node in an array for random access, then
uses one index from the front and one from the back, re-linking the list
by alternating between them.

The memory-efficient approach skips the array:

- Find the middle with fast/slow pointers.
- Reverse the second half in place, so its nodes come out back to front.
- Zip the first half and the reversed second half together, one node at a time.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Random Access via Array",
        explanation: `
Put every node in an array, in order. With one index at the front and one
at the back, rewire next pointers to alternate between them, moving the
indices inward until they meet.
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function reorderList(head) {
  if (!head) return;

  const nodes = [];
  let curr = head;
  while (curr) {
    nodes.push(curr);
    curr = curr.next;
  }

  let i = 0;
  let j = nodes.length - 1;

  while (i < j) {
    nodes[i].next = nodes[j];
    i++;
    if (i === j) break;
    nodes[j].next = nodes[i];
    j--;
  }

  nodes[i].next = null; // whichever node ends up last must terminate the list
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal — Split, Reverse Second Half, Merge",
        explanation: `
Find the middle with a slow pointer (one step) and a fast pointer (two
steps): when fast runs out of room, slow is at the middle. Cut the list
there.

Reverse the second half in place, so it now runs back to front.

Then weave the halves together: one node from the first half, one from the
reversed second half, and repeat, updating next as you go.
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function reorderList(head) {
  if (!head || !head.next) return;

  // 1. Find the middle.
  let slow = head;
  let fast = head;
  while (fast.next && fast.next.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // 2. Split and reverse the second half.
  let second = slow.next;
  slow.next = null;
  let prev = null;
  while (second) {
    const next = second.next;
    second.next = prev;
    prev = second;
    second = next;
  }

  // 3. Merge the first half with the reversed second half.
  let first = head;
  second = prev;
  while (second) {
    const firstNext = first.next;
    const secondNext = second.next;
    first.next = second;
    second.next = firstNext;
    first = firstNext;
    second = secondNext;
  }
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "while (fast.next && fast.next.next) { slow = slow.next; fast = fast.next.next; }", explanation: "Fast/slow scan — when fast runs out of room, slow is on the middle node." },
          { code: "let second = slow.next; slow.next = null;", explanation: "Splits the list into a front half and a back half." },
          { code: "second.next = prev; ...", explanation: "Reverses the back half in place, so it runs back to front." },
          { code: "first.next = second; second.next = firstNext;", explanation: "Alternates one node from each half until the shorter half runs out." },
        ],
      },
    ],
    relatedProblems: ["reverse-linked-list", "linked-list-cycle", "remove-nth-node-from-end-of-list"],
    keywords: ["reorder list", "fast slow pointers", "reverse", "merge"],
  },
  {
    id: "remove-nth-node-from-end-of-list",
    title: "Remove Nth Node From End of List",
    difficulty: "Medium",
    category: "linked-list",
    description: `
Given the head of a linked list and a number n, remove the nth node from
the *end* (n = 1 means the last node) and return the head.

Try to do it in one pass.
    `.trim(),
    examples: [
      { input: "head = [1, 2, 3, 4, 5], n = 2", output: "[1, 2, 3, 5]", explanation: "The 2nd node from the end is the one with value 4." },
      { input: "head = [1], n = 1", output: "[]" },
      { input: "head = [1, 2], n = 1", output: "[1]" },
    ],
    constraints: ["The number of nodes is between 1 and 30.", "0 <= Node.val <= 100", "1 <= n <= number of nodes in the list"],
    hints: [
      "If you knew the list's length, 'nth from the end' would become a fixed position from the front.",
      "You don't need the length up front — start one pointer n steps ahead of the other.",
      "To remove a node, you need the node just *before* it. A dummy node in front of the head handles removing the first real node.",
    ],
    approachOverview: `
If you first count the list's length, "n from the end" becomes a fixed
position from the front: walk to just before it and unlink the next node.
That works, but takes two passes.

To do it in one pass, move a "fast" pointer n steps ahead, then move both
pointers one step at a time. When fast reaches the end, the gap leaves
the slow pointer exactly one node before the one to remove.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Two Passes (Count, Then Remove)",
        explanation: `
Walk the list once to count its nodes, which tells you how far from the
front the target is. Walk again to that position and unlink the node. A
dummy node before the head means removing the first node needs no special
case.
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function removeNthFromEnd(head, n) {
  let length = 0;
  let curr = head;
  while (curr) {
    length++;
    curr = curr.next;
  }

  const dummy = new ListNode(0, head);
  let prev = dummy;
  for (let i = 0; i < length - n; i++) {
    prev = prev.next;
  }

  prev.next = prev.next.next;
  return dummy.next;
}`,
        timeComplexity: "O(n) — two passes over the list",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal — One Pass with a Gap",
        explanation: `
Put a dummy node in front of the head so removing the head needs no
special case. Start "fast" and "slow" at the dummy, and move fast n steps
ahead. Then move both together until fast reaches the last node. Thanks to
the n-node gap, slow is now one node before the target, so unlink it.
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy;
  let slow = dummy;

  for (let i = 0; i < n; i++) {
    fast = fast.next;
  }

  while (fast.next) {
    fast = fast.next;
    slow = slow.next;
  }

  slow.next = slow.next.next;
  return dummy.next;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "const dummy = new ListNode(0, head);", explanation: "Gives slow a valid start even when the node to remove is the head." },
          { code: "for (let i = 0; i < n; i++) { fast = fast.next; }", explanation: "Creates an n-node gap between fast and slow." },
          { code: "while (fast.next) { fast = fast.next; slow = slow.next; }", explanation: "Moves both together, keeping the gap, until fast is on the last node." },
          { code: "slow.next = slow.next.next;", explanation: "Slow is one node before the target, so this skips over and removes it." },
        ],
      },
    ],
    relatedProblems: ["reverse-linked-list", "reorder-list", "linked-list-cycle"],
    keywords: ["remove nth node", "two pointers", "dummy node", "one pass"],
  },
  {
    id: "copy-list-with-random-pointer",
    title: "Copy List with Random Pointer",
    difficulty: "Medium",
    category: "linked-list",
    description: `
Each node in this linked list has two pointers: the usual "next", and a
"random" pointer that can point to *any* node in the list (including
itself) or to null.

Make a fully independent deep copy: same values in the same order, with
each copy's "random" pointer aimed at the *matching copy*, not the
original node. The copy must not share any nodes with the original.
    `.trim(),
    examples: [
      {
        input: "A 3-node list with values [1, 2, 3]. random: node0 -> node2, node1 -> node0, node2 -> node1.",
        output: "A separate copy with values [1, 2, 3] where copy0.random -> copy2, copy1.random -> copy0, copy2.random -> copy1.",
        explanation: "Every random link in the copy points at a node inside the copy, mirroring the pattern of the original.",
      },
      {
        input: "A 2-node list with values [1, 2]. random: node0 -> null, node1 -> node1 (points at itself).",
        output: "A separate copy with values [1, 2] where copy0.random -> null and copy1.random -> copy1.",
      },
      { input: "head = null (empty list)", output: "null" },
    ],
    constraints: ["The number of nodes is between 0 and 1000.", "-10^4 <= Node.val <= 10^4", "random is null or points at a node in the same list."],
    hints: [
      "If you copy every node before wiring random pointers, you need to map each original to its copy — a hash map does that.",
      "To skip the hash map, splice each copy into the original list right after its original. Then 'the copy of X' is just X.next.",
      "After wiring the random pointers, one more pass separates the interleaved nodes into two independent lists.",
    ],
    approachOverview: `
The direct approach copies every node (no pointers yet) and uses a hash
map from each original to its copy. A second pass uses the map to set
each copy's "next" and "random" pointers. It's simple, but the map uses
memory proportional to the list's length.

The neater approach skips the map by inserting each copy right after its
original in the list. Then "the copy of X" is always X.next, so random
pointers can be wired with no lookup. A final pass splits the list back
into the original and the copy.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Hash Map from Original to Copy",
        explanation: `
First pass: copy each node's value and store "original -> copy" in a map.
Second pass: for each original, use the map to point its copy's next and
random at the copies of the original's next and random targets.
        `.trim(),
        code: `class Node {
  constructor(val, next = null, random = null) {
    this.val = val;
    this.next = next;
    this.random = random;
  }
}

function copyRandomList(head) {
  if (!head) return null;

  const copyOf = new Map(); // original node -> its copy

  let curr = head;
  while (curr) {
    copyOf.set(curr, new Node(curr.val));
    curr = curr.next;
  }

  curr = head;
  while (curr) {
    const copy = copyOf.get(curr);
    copy.next = curr.next ? copyOf.get(curr.next) : null;
    copy.random = curr.random ? copyOf.get(curr.random) : null;
    curr = curr.next;
  }

  return copyOf.get(head);
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) — the hash map",
      },
      {
        approach: "Optimal — Interleave Copies In Place",
        explanation: `
Step 1: create each node's copy and splice it in right after the
original, so the list reads original1 -> copy1 -> original2 -> copy2 -> ...

Step 2: "the copy of X" is now X.next, so set each copy's random pointer
to (original's random node).next — that random node's copy.

Step 3: walk the list again and unhook the copies, restoring the original
list and producing the standalone copy.
        `.trim(),
        code: `class Node {
  constructor(val, next = null, random = null) {
    this.val = val;
    this.next = next;
    this.random = random;
  }
}

function copyRandomList(head) {
  if (!head) return null;

  // Step 1: interleave a copy after every original node.
  let curr = head;
  while (curr) {
    const copy = new Node(curr.val, curr.next);
    curr.next = copy;
    curr = copy.next;
  }

  // Step 2: wire up random pointers using the interleaving.
  curr = head;
  while (curr) {
    if (curr.random) {
      curr.next.random = curr.random.next;
    }
    curr = curr.next.next;
  }

  // Step 3: split the interleaved list back into two separate lists.
  const dummy = new Node(0);
  let copyCurr = dummy;
  curr = head;
  while (curr) {
    const copy = curr.next;
    curr.next = copy.next; // restore original list's next pointer
    copyCurr.next = copy;
    copyCurr = copy;
    curr = curr.next;
  }

  return dummy.next;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1) extra — aside from the copied nodes themselves",
        walkthrough: [
          { code: "const copy = new Node(curr.val, curr.next); curr.next = copy;", explanation: "Splices a new copy right after its original, so original.next is always its copy." },
          { code: "curr.next.random = curr.random.next;", explanation: "curr.random is an original node, and its copy is one step past it — no lookup needed." },
          { code: "curr.next = copy.next; copyCurr.next = copy;", explanation: "Unhooks the copy, restoring the original list while building the standalone copy." },
        ],
      },
    ],
    relatedProblems: ["merge-two-sorted-lists", "reverse-linked-list"],
    keywords: ["deep copy", "random pointer", "hash map", "interleaving"],
  },
  {
    id: "add-two-numbers",
    title: "Add Two Numbers",
    difficulty: "Medium",
    category: "linked-list",
    description: `
Two non-negative integers are stored as linked lists, one digit per node,
*least significant digit first* (so [2, 4, 3] is 342). Add them and return
the sum as a linked list in the same order.

Neither list has leading zeros, except the number 0 itself, which is a
single node holding 0.
    `.trim(),
    examples: [
      { input: "l1 = [2, 4, 3], l2 = [5, 6, 4]", output: "[7, 0, 8]", explanation: "342 + 465 = 807, and 807 written least-significant-digit-first is [7, 0, 8]." },
      { input: "l1 = [0], l2 = [0]", output: "[0]" },
      { input: "l1 = [9, 9], l2 = [1]", output: "[0, 0, 1]", explanation: "99 + 1 = 100, and the carry has to ripple through two extra digits." },
    ],
    constraints: ["Each list has between 1 and 100 nodes.", "0 <= Node.val <= 9", "Neither list has a leading zero, except the number 0 itself."],
    hints: [
      "Digits are stored least-significant first, just like adding by hand from the ones place — no reversing needed.",
      "At each position, add the available digits plus the carry. The new digit is sum mod 10; the new carry is sum divided by 10.",
      "Don't stop when one list runs out — it counts as 0 from then on. A leftover carry at the end needs one more digit.",
    ],
    approachOverview: `
You could convert each list into a (possibly very large) number, add them,
and turn the result back into a list. That works, but the conversions are
more work than needed.

The direct approach adds the way you do by hand. Walk both lists together,
one digit at a time. Add the two digits plus the carry, write down the
ones digit, and carry the rest. If a carry is left after both lists end,
it becomes one final digit.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Convert to Numbers and Back",
        explanation: `
Read each list into a BigInt (so long lists don't lose precision), add
them, then split the sum into a new list, least significant digit first.
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function addTwoNumbers(l1, l2) {
  function listToBigInt(node) {
    let digits = "";
    while (node) {
      digits = String(node.val) + digits; // most significant digit ends up first
      node = node.next;
    }
    return BigInt(digits);
  }

  const sum = listToBigInt(l1) + listToBigInt(l2);
  const digits = sum.toString().split("").reverse(); // back to least-significant-first

  const dummy = new ListNode(0);
  let curr = dummy;
  for (const digit of digits) {
    curr.next = new ListNode(Number(digit));
    curr = curr.next;
  }

  return dummy.next;
}`,
        timeComplexity: "O(n + m) — but with extra overhead building and parsing big-integer strings",
        spaceComplexity: "O(n + m)",
      },
      {
        approach: "Optimal — Digit-by-Digit Simulation",
        explanation: `
Walk both lists together. At each step, add the available digits (a
finished list counts as 0) plus the carry. The new node's value is sum
mod 10, and the new carry is sum divided by 10, rounded down. Continue
while either list has nodes or a carry is left.
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function addTwoNumbers(l1, l2) {
  const dummy = new ListNode(0);
  let curr = dummy;
  let carry = 0;

  while (l1 !== null || l2 !== null || carry !== 0) {
    const digit1 = l1 ? l1.val : 0;
    const digit2 = l2 ? l2.val : 0;

    const sum = digit1 + digit2 + carry;
    carry = Math.floor(sum / 10);

    curr.next = new ListNode(sum % 10);
    curr = curr.next;

    if (l1) l1 = l1.next;
    if (l2) l2 = l2.next;
  }

  return dummy.next;
}`,
        timeComplexity: "O(max(n, m))",
        spaceComplexity: "O(1) extra, not counting the output list",
        walkthrough: [
          { code: "while (l1 !== null || l2 !== null || carry !== 0)", explanation: "Continues while either list has digits or a carry is left." },
          { code: "const digit1 = l1 ? l1.val : 0;", explanation: "A finished list counts as 0, like adding a shorter number by hand." },
          { code: "carry = Math.floor(sum / 10);", explanation: "Anything past the ones place carries into the next position." },
          { code: "curr.next = new ListNode(sum % 10);", explanation: "Only the ones digit goes into the answer." },
        ],
      },
    ],
    relatedProblems: ["merge-two-sorted-lists", "reverse-linked-list"],
    keywords: ["add two numbers", "carry", "digit simulation", "linked list arithmetic"],
  },
  {
    id: "find-the-duplicate-number",
    title: "Find the Duplicate Number",
    difficulty: "Medium",
    category: "linked-list",
    description: `
Given an array of n + 1 integers, each between 1 and n (inclusive),
exactly one value repeats (two or more times). Find it.

Don't modify the array, and use only constant extra memory. Sorting a copy
or using a hash set gives a correct answer but doesn't meet the full
challenge.
    `.trim(),
    examples: [
      { input: "nums = [1, 3, 4, 2, 2]", output: "2" },
      { input: "nums = [3, 1, 3, 4, 2]", output: "3" },
      { input: "nums = [1, 1]", output: "1" },
    ],
    constraints: ["1 <= n <= 10^5", "nums.length == n + 1", "1 <= nums[i] <= n", "Exactly one value in nums repeats (one or more extra times)."],
    hints: [
      "There are n + 1 values from 1 to n, so by the pigeonhole principle at least one must repeat.",
      "Binary search can run over the range of *possible values* instead of positions: count how many numbers are <= the candidate to decide which half holds the duplicate.",
      "Treat each value as an arrow from its index to the index it names (i points at nums[i]). Two indices pointing at the same value create a loop — exactly what cycle detection finds.",
    ],
    approachOverview: `
The simplest approach ignores the space limit: store each value in a set
as you scan, and the first value seen twice is the answer.

A better approach binary searches the *range of possible values*. For a
midpoint m, count the entries <= m. If the count exceeds m, the duplicate
is in the lower half; otherwise it's in the upper half.

The approach that meets every constraint treats the array as a linked
list: position i is a node whose "next" is nums[i]. Two positions always
point at the same value, so there's always a cycle, and its entry point
is the duplicate. Floyd's tortoise-and-hare finds it with no extra memory
and without changing the array.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Track Seen Values",
        explanation: `
Scan the array once, remembering every value already seen in a set. The
first value that turns up a second time is the duplicate. Simple and
fast, but it uses memory proportional to the array's size, which the
strict version of this problem doesn't allow.
        `.trim(),
        code: `function findDuplicate(nums) {
  const seen = new Set();

  for (const num of nums) {
    if (seen.has(num)) return num;
    seen.add(num);
  }

  return -1; // unreachable given the problem's guarantees
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Binary Search on the Value Range",
        explanation: `
Search over candidate values from 1 to n rather than over array
positions. For a midpoint value m, count how many numbers in the whole
array are <= m. If more than m numbers satisfy that, the duplicate has
to be one of the values from 1 to m (there are "too many" small
values for that to be a coincidence); otherwise it's above m. Narrowing
this range in half repeatedly homes in on the exact duplicate.
        `.trim(),
        code: `function findDuplicate(nums) {
  let low = 1;
  let high = nums.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    let countLessOrEqual = 0;
    for (const num of nums) {
      if (num <= mid) countLessOrEqual++;
    }

    if (countLessOrEqual > mid) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  return low;
}`,
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal — Cycle Detection (Floyd's Tortoise and Hare)",
        explanation: `
Treat the array as a linked list where the "next" node after position i
is position nums[i]. Because there are n + 1 positions but only n
possible values to point at, at least two positions must point at the
same value — which means this implicit list always loops back on
itself, forming a cycle, and the value where the cycle begins is
exactly the duplicated number.

First, run slow/fast pointers (slow moves one step, fast moves two)
starting from index 0 until they meet somewhere inside the cycle. Then
reset one pointer back to the start while leaving the other where it
met, and advance both one step at a time — the node where they meet
this second time is the entry point of the cycle, which is the
duplicate value.
        `.trim(),
        code: `function findDuplicate(nums) {
  // Phase 1: find a meeting point inside the cycle.
  let slow = nums[0];
  let fast = nums[0];

  do {
    slow = nums[slow];
    fast = nums[nums[fast]];
  } while (slow !== fast);

  // Phase 2: find the entrance to the cycle, which is the duplicate.
  slow = nums[0];
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];
  }

  return slow;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        walkthrough: [
          { code: "slow = nums[slow]; fast = nums[nums[fast]];", explanation: "Treats each array value as a pointer to the next position, so slow takes one hop and fast takes two, exactly like cycle detection in a real linked list." },
          { code: "} while (slow !== fast);", explanation: "Because a duplicate value forces two positions to point the same way, this implicit list is guaranteed to loop, so the two pointers must eventually meet." },
          { code: "slow = nums[0];", explanation: "Resets one pointer to the start while keeping the other at the meeting point — a property of cycle detection guarantees they'll now meet again exactly at the cycle's entrance." },
          { code: "while (slow !== fast) { slow = nums[slow]; fast = nums[fast]; }", explanation: "Advancing both one step at a time from here, the meeting point is the duplicated value." },
        ],
      },
    ],
    relatedProblems: ["linked-list-cycle"],
    keywords: ["duplicate number", "cycle detection", "floyd's algorithm", "binary search on answer"],
  },
  {
    id: "lru-cache",
    title: "LRU Cache",
    difficulty: "Medium",
    category: "linked-list",
    description: `
Design a small cache that holds a fixed number of key-value pairs. It
needs two operations:

- `.trim() + "`get(key)`" + `: return the value stored for that key, or -1 if
the key isn't in the cache. This should also mark the key as
"recently used."
- `.trim() + "`put(key, value)`" + `: insert or update the value for that key,
also marking it as "recently used." If adding a new key would push
the cache past its capacity, first evict whichever key was used
*least* recently.

Both operations need to run in constant time on average, no matter how
many items the cache is holding.
    `.trim(),
    examples: [
      {
        input: "capacity = 2; put(1,1); put(2,2); get(1); put(3,3); get(2); put(4,4); get(1); get(3); get(4)",
        output: "-, -, 1, -, -1, -, -1, 3, 4",
        explanation: "put(3,3) evicts key 2 (2 was the least recently used at that point, since key 1 had just been touched by get(1)). put(4,4) then evicts key 1 for the same reason.",
      },
      {
        input: "capacity = 1; put(1,1); get(1); put(2,2); get(1); get(2)",
        output: "-, 1, -, -1, 2",
        explanation: "With capacity 1, inserting key 2 always evicts whatever key was there before.",
      },
    ],
    constraints: ["1 <= capacity <= 3000", "0 <= key, value <= 10^4", "At most 2 * 10^5 total calls to get and put."],
    hints: [
      "A plain array or object gets you correctness immediately, but finding 'the least recently used key' or reordering entries in one tends to cost time proportional to how many entries are stored.",
      "A hash map alone gives you fast lookups by key, but it doesn't naturally track *usage order* — you need a second structure just for that ordering.",
      "A doubly linked list lets you remove any node and reinsert it at one end in O(1) time (as long as you already have a direct reference to that node) — pair that with a hash map from key to that exact node reference.",
    ],
    approachOverview: `
A simple first attempt: keep the cache as a plain list of key-value
pairs. On get, scan the list for the key (moving it to the "most
recent" end if found); on put, scan the list similarly, and if the
cache is full, drop the entry at the "least recent" end. This is
correct, but scanning and reordering the list costs time proportional
to how many entries are currently cached.

The constant-time version pairs two structures: a hash map from key to
a node, and a doubly linked list threading all the nodes together in
usage order (most recently used at one end, least recently used at the
other). The hash map gives instant access to any node by key; the
doubly linked list lets you unlink that exact node and reinsert it at
the "most recent" end in O(1), since removing or inserting next to a
node you already hold a reference to never requires scanning anything.
Eviction is then just "remove whatever sits at the least-recent end."
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Array of Pairs",
        explanation: `
Keep the cache as an array of {key, value} pairs, ordered from least
recently used (front) to most recently used (back). Both get and put
search the array for the key linearly; a hit is spliced out and pushed
onto the back to mark it as freshly used. When capacity is exceeded,
the pair at the front (the least recently used one) is dropped.
        `.trim(),
        code: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.items = []; // ordered least-recently-used (front) to most-recently-used (back)
  }

  get(key) {
    const index = this.items.findIndex((item) => item.key === key);
    if (index === -1) return -1;

    const [item] = this.items.splice(index, 1);
    this.items.push(item); // now the most recently used
    return item.value;
  }

  put(key, value) {
    const index = this.items.findIndex((item) => item.key === key);
    if (index !== -1) {
      this.items.splice(index, 1);
    } else if (this.items.length === this.capacity) {
      this.items.shift(); // evict the least recently used
    }
    this.items.push({ key, value });
  }
}`,
        timeComplexity: "O(n) per get/put, where n is the number of entries currently cached",
        spaceComplexity: "O(capacity)",
      },
      {
        approach: "Optimal — Doubly Linked List + Hash Map",
        explanation: `
Maintain a doubly linked list of nodes ordered by recency, with a
permanent dummy head (the most-recently-used side) and a permanent
dummy tail (the least-recently-used side), plus a hash map from key to
its node in that list.

get: look the node up directly in the map. If found, unlink it from
wherever it currently sits and reinsert it right after the dummy head
(marking it freshly used), then return its value.

put: if the key already has a node, update its value and move it to
the front the same way. Otherwise, if the cache is full, remove the
node right before the dummy tail (the true least-recently-used entry)
and delete it from the map; then create a new node for the key and
insert it at the front.

Every step here — lookup, unlink, and insert-at-front — takes constant
time, because the map gives a direct node reference and the doubly
linked list never needs to scan to remove or insert next to a node it
already holds.
        `.trim(),
        code: `class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // key -> Node

    // Dummy sentinels: head.next is most recently used, tail.prev is least recently used.
    this.head = new Node(0, 0);
    this.tail = new Node(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _insertAtFront(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  get(key) {
    if (!this.map.has(key)) return -1;

    const node = this.map.get(key);
    this._remove(node);
    this._insertAtFront(node);
    return node.value;
  }

  put(key, value) {
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.value = value;
      this._remove(node);
      this._insertAtFront(node);
      return;
    }

    if (this.map.size === this.capacity) {
      const leastRecentlyUsed = this.tail.prev;
      this._remove(leastRecentlyUsed);
      this.map.delete(leastRecentlyUsed.key);
    }

    const node = new Node(key, value);
    this.map.set(key, node);
    this._insertAtFront(node);
  }
}`,
        timeComplexity: "O(1) for both get and put",
        spaceComplexity: "O(capacity)",
        walkthrough: [
          { code: "this.head.next = this.tail; this.tail.prev = this.head;", explanation: "Two permanent sentinel nodes remove every edge case around inserting into or removing from an empty list." },
          { code: "const node = this.map.get(key);", explanation: "The hash map turns 'find this key' from a scan into a single direct lookup." },
          { code: "this._remove(node); this._insertAtFront(node);", explanation: "Unlinking and reinserting a node you already hold a reference to costs a fixed handful of pointer updates, never a scan." },
          { code: "const leastRecentlyUsed = this.tail.prev;", explanation: "The node just before the tail sentinel is, by construction, always the least recently used entry — no searching required." },
        ],
      },
    ],
    relatedProblems: ["reverse-linked-list", "merge-two-sorted-lists"],
    keywords: ["lru cache", "doubly linked list", "hash map", "design", "o(1) operations"],
  },
  {
    id: "merge-k-sorted-lists",
    title: "Merge K Sorted Lists",
    difficulty: "Hard",
    category: "linked-list",
    description: `
You're given an array containing the heads of k linked lists, and each
one of those lists is already sorted in increasing order. Merge all of
them into a single sorted linked list and return its head.
    `.trim(),
    examples: [
      { input: "lists = [[1, 4, 5], [1, 3, 4], [2, 6]]", output: "[1, 1, 2, 3, 4, 4, 5, 6]" },
      { input: "lists = []", output: "[]" },
      { input: "lists = [[]]", output: "[]", explanation: "The array contains one list, and that list happens to be empty." },
    ],
    constraints: ["0 <= k <= 10^4", "0 <= length of each list <= 500", "The total number of nodes across all lists is at most 10^4.", "Each individual list is sorted in non-decreasing order."],
    hints: [
      "You already know how to merge two sorted lists in one pass — the question is how to extend that to k lists without redoing too much work.",
      "Merging the lists one at a time into a running result works, but each merge has to re-scan an ever-growing result list, so the total work adds up faster than you'd like.",
      "Instead of merging sequentially, merge lists in pairs: combine list 1 with list 2, list 3 with list 4, and so on, then repeat that pairing process on the (half as many) results. This finishes in far fewer rounds.",
    ],
    approachOverview: `
The most direct approach ignores that the lists are already sorted:
dump every value from every list into one array, sort that array, then
rebuild a single list from it.

A better approach reuses the two-list merge you'd use for merging just
two sorted lists: merge the first list with the second, merge that
result with the third, then with the fourth, and so on. This is simple
and avoids a full sort, but the growing "result so far" list gets
re-scanned by every subsequent merge, so the total work scales with
both the number of lists and the total number of nodes.

The efficient approach merges the lists in pairs instead of one at a
time: round 1 merges list 1 with list 2, list 3 with list 4, and so on,
roughly halving the number of lists. Repeating this pairwise merging
process on the results, round after round, brings the number of lists
down to one in only about log2(k) rounds, and every node is only ever
part of a two-list merge at each round, rather than being re-scanned by
every single merge along the way.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Collect All Values, Sort, Rebuild",
        explanation: `
Walk every list, pushing every value into one flat array. Sort that
array, then build a brand-new list from the sorted values. This works
regardless of how the input lists were ordered, but it pays for a full
sort even though most of the ordering information was already there
for free.
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function mergeKLists(lists) {
  const values = [];

  for (const list of lists) {
    let node = list;
    while (node) {
      values.push(node.val);
      node = node.next;
    }
  }

  values.sort((a, b) => a - b);

  const dummy = new ListNode(0);
  let curr = dummy;
  for (const value of values) {
    curr.next = new ListNode(value);
    curr = curr.next;
  }

  return dummy.next;
}`,
        timeComplexity: "O(N log N), where N is the total number of nodes across all lists",
        spaceComplexity: "O(N)",
      },
      {
        approach: "Sequential Merge — Fold Lists One at a Time",
        explanation: `
Reuse a standard two-list merge as a building block. Start with an
empty running result, then merge in each list one after another: merge
the result with list 1, then merge that with list 2, then with list 3,
and so on until every list has been folded in.
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function mergeTwoLists(a, b) {
  const dummy = new ListNode(0);
  let curr = dummy;

  while (a !== null && b !== null) {
    if (a.val <= b.val) {
      curr.next = a;
      a = a.next;
    } else {
      curr.next = b;
      b = b.next;
    }
    curr = curr.next;
  }

  curr.next = a !== null ? a : b;
  return dummy.next;
}

function mergeKLists(lists) {
  let result = null;
  for (const list of lists) {
    result = mergeTwoLists(result, list);
  }
  return result;
}`,
        timeComplexity: "O(k * N), where k is the number of lists and N is the total number of nodes",
        spaceComplexity: "O(1) extra, reusing existing nodes",
      },
      {
        approach: "Optimal — Pairwise (Divide and Conquer) Merge",
        explanation: `
Reuse the same two-list merge, but instead of folding lists in one at a
time, merge them in pairs each round: list 1 with list 2, list 3 with
list 4, and so on, producing roughly half as many lists as before.
Repeat this pairing process on the new, smaller collection of lists,
again and again, until only one list remains.

Because the number of lists roughly halves every round, it only takes
about log2(k) rounds to finish, and each round does a total of O(N)
work across all its merges (every node is touched exactly once per
round), giving O(N log k) overall instead of O(N * k).
        `.trim(),
        code: `class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function mergeTwoLists(a, b) {
  const dummy = new ListNode(0);
  let curr = dummy;

  while (a !== null && b !== null) {
    if (a.val <= b.val) {
      curr.next = a;
      a = a.next;
    } else {
      curr.next = b;
      b = b.next;
    }
    curr = curr.next;
  }

  curr.next = a !== null ? a : b;
  return dummy.next;
}

function mergeKLists(lists) {
  if (lists.length === 0) return null;

  let remaining = lists;
  while (remaining.length > 1) {
    const merged = [];

    for (let i = 0; i < remaining.length; i += 2) {
      const first = remaining[i];
      const second = i + 1 < remaining.length ? remaining[i + 1] : null;
      merged.push(mergeTwoLists(first, second));
    }

    remaining = merged;
  }

  return remaining[0];
}`,
        timeComplexity: "O(N log k), where N is the total number of nodes and k is the number of lists",
        spaceComplexity: "O(k) for the array of intermediate list heads (O(1) beyond that, reusing existing nodes)",
        walkthrough: [
          { code: "while (remaining.length > 1)", explanation: "Keeps pairing off lists, round after round, until only a single merged list is left." },
          { code: "for (let i = 0; i < remaining.length; i += 2)", explanation: "Walks the current round's lists two at a time, so every list is paired with its neighbor." },
          { code: "merged.push(mergeTwoLists(first, second));", explanation: "Merges each pair using the familiar two-list merge, roughly halving the number of lists still left to combine." },
          { code: "remaining = merged;", explanation: "The smaller collection of merged lists becomes the input to the next round, until just one list remains." },
        ],
      },
    ],
    relatedProblems: ["merge-two-sorted-lists", "reverse-linked-list"],
    keywords: ["merge k sorted lists", "divide and conquer", "pairwise merge", "priority queue alternative"],
  },
];
