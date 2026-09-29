import type { Problem } from "../../types/problem";

export const linkedListProblems: Problem[] = [
  {
    id: "reverse-linked-list",
    title: "Reverse Linked List",
    difficulty: "Easy",
    category: "linked-list",
    description: `
You're given the head of a singly linked list, where every node points
only to the node after it. Flip the direction of the whole list so that
the last node becomes the first, and the first becomes the last, then
return the new head.

You can't just relabel the values — you actually need to rewire each
node's pointer to point at the node that used to come before it.
    `.trim(),
    examples: [
      { input: "head = [1, 2, 3, 4, 5]", output: "[5, 4, 3, 2, 1]" },
      { input: "head = [1, 2]", output: "[2, 1]" },
      { input: "head = []", output: "[]", explanation: "An empty list reversed is still empty." },
    ],
    constraints: ["The number of nodes is between 0 and 5000.", "-5000 <= Node.val <= 5000"],
    hints: [
      "Picture standing at one node with a piece of string tied to the node before it. If you move forward before tying the string, you lose the node behind you forever — so save 'next' before you overwrite it.",
      "You only ever need to remember two things as you walk the list: the node you just finished rewiring, and the node you're currently rewiring.",
      "The very last node to be visited becomes the new head, since it's the only one that never gets a forward pointer reassigned to it from a later node.",
    ],
    approachOverview: `
Walking through the list and flipping one pointer at a time works, but
you have to be careful about order: once you overwrite a node's next
pointer, you can't get to what used to come after it unless you saved
that reference first.

The clean way is to carry three references as you walk: the node before
the current one (initially nothing), the current node, and (temporarily)
the node after it. At each step you point the current node backward,
then shift all three references one step forward. The same idea can also
be expressed recursively, reversing the rest of the list first and then
fixing up the one link at the very front.
    `.trim(),
    solutions: [
      {
        approach: "Recursive Reversal",
        explanation: `
Trust that reversing everything after the current node already works
(that's the recursive leap of faith), and just fix up the link between
the current node and the rest.

Once the rest of the list is reversed, the node right after the current
one is now the *last* node of that reversed piece. So you make that
node point back at the current node, and cut the current node's own
forward pointer.

This is elegant to read, but each recursive call sits on the call stack
until the whole list has been walked, so it uses memory proportional to
the length of the list.
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
Walk the list exactly once, keeping a running "previous" pointer that
starts at null. At each node, save its next pointer before touching
anything, then point the current node back at "previous", then slide
both "previous" and "current" one step forward.

When "current" finally runs off the end of the list, "previous" is
sitting on the old last node — which is exactly the new head.
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
          { code: "let prev = null;", explanation: "Nothing comes before the first node once it's reversed, so it will eventually point at null." },
          { code: "const next = curr.next;", explanation: "Grabs a copy of what comes next before that link gets overwritten." },
          { code: "curr.next = prev;", explanation: "Flips the current node's pointer to point backward instead of forward." },
          { code: "prev = curr; curr = next;", explanation: "Slides the whole window one step forward using the saved reference." },
          { code: "return prev;", explanation: "Once curr falls off the list, prev is resting on the last node visited — the new head." },
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
You're given the heads of two linked lists, and each one is already
sorted in increasing order. Combine them into a single sorted linked
list and return its head.

You should reuse the existing nodes from both lists rather than
creating brand-new ones — you're just re-threading the pointers so the
values come out in order.
    `.trim(),
    examples: [
      { input: "list1 = [1, 2, 4], list2 = [1, 3, 4]", output: "[1, 1, 2, 3, 4, 4]" },
      { input: "list1 = [], list2 = []", output: "[]" },
      { input: "list1 = [], list2 = [0]", output: "[0]" },
    ],
    constraints: ["The number of nodes in each list is between 0 and 50.", "-100 <= Node.val <= 100", "Both lists are sorted in non-decreasing order."],
    hints: [
      "Since both lists are already sorted, at any moment the smallest value left anywhere has to be sitting at the front of one of the two lists.",
      "A throwaway 'dummy' node before the real head lets you build the result without special-casing what happens on the very first comparison.",
      "Once one list runs out, whatever is left of the other list is already sorted — you can attach it wholesale instead of comparing node by node.",
    ],
    approachOverview: `
One way to think about this: dump every value from both lists into one
big collection, sort that collection, then rebuild a list from it. That
works, but it throws away the fact that the lists were already sorted —
you're paying for a full sort you don't actually need.

Since both lists arrive pre-sorted, you can instead walk them side by
side with two pointers. At each step, whichever list currently has the
smaller front value gets attached next to the result, and only that
pointer advances. Repeating this until one list is exhausted, then
tacking on the remainder of the other list, produces the merged list in
a single pass.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Collect, Sort, Rebuild",
        explanation: `
Read every value out of both lists into a plain array, sort that array,
and build a fresh list from the sorted values. This ignores the fact
that each input list was already sorted, so it does more comparison
work than necessary.
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
Keep one pointer on each list. Compare their front values, splice the
smaller node onto the end of the result, and advance only the pointer
that lost the comparison. A dummy node at the front of the result gives
you a stable place to hang the very first real node without any special
casing. When one list runs dry, the remainder of the other list is
already sorted, so it can be attached in one step.
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
          { code: "const dummy = new ListNode(0);", explanation: "A throwaway node so the real result never needs special-case handling for its first element." },
          { code: "if (list1.val <= list2.val) { ... } else { ... }", explanation: "Picks whichever list currently has the smaller front value." },
          { code: "curr.next = list1; list1 = list1.next;", explanation: "Attaches the winning node to the result and advances only that list's pointer." },
          { code: "curr.next = list1 !== null ? list1 : list2;", explanation: "Once one list is empty, the other is already sorted, so the rest attaches in a single step." },
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
You're given the head of a linked list. Somewhere in the list, a later
node's pointer might loop back around to an earlier node instead of
eventually reaching null — creating a cycle. Determine whether the list
has a cycle anywhere in it.

You just need a yes/no answer; you don't need to say where the cycle
starts or how long it is.
    `.trim(),
    examples: [
      { input: "head = [3, 2, 0, -4], the last node connects back to the node with value 2", output: "true" },
      { input: "head = [1, 2], the last node connects back to the first node", output: "true" },
      { input: "head = [1]", output: "false", explanation: "A single node whose pointer is null has nowhere to loop back to." },
    ],
    constraints: ["The number of nodes is between 0 and 10^4.", "-10^5 <= Node.val <= 10^5"],
    hints: [
      "If you keep a record of every node you've already visited, revisiting one tells you there's a cycle — but that record costs extra memory.",
      "Imagine two runners on the same track, one moving twice as fast as the other. If the track is a loop, the faster runner eventually laps the slower one.",
      "If the faster pointer ever reaches the end of the list (hits null), there was no loop to run around in the first place.",
    ],
    approachOverview: `
The straightforward approach is to remember every node you've visited
in a set. If you ever land on a node that's already in the set, you've
looped back around, so there's a cycle. If you instead run off the end
of the list (reach null), there wasn't one. This works, but it spends
extra memory tracking every node.

A cleverer approach uses two pointers moving at different speeds — a
slow one that moves one node at a time, and a fast one that moves two
nodes at a time. If there's no cycle, the fast pointer simply reaches
the end first. If there is a cycle, the fast pointer eventually enters
the loop and, lap by lap, closes the gap on the slow pointer until they
land on the same node. This needs no extra memory at all.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Track Visited Nodes",
        explanation: `
Walk the list one node at a time, remembering every node reference
you've seen in a set. If the current node is already in the set,
you've come back around to it, so there's a cycle. If you reach null
before that happens, there's no cycle.
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
Use two pointers starting at the head: a slow one that advances one
node per step, and a fast one that advances two nodes per step. If the
fast pointer (or its next node) ever hits null, the list ends cleanly
and there's no cycle. If instead the two pointers ever land on the
exact same node, the fast one has lapped the slow one inside a loop,
which can only happen if a cycle exists.
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
          { code: "while (fast !== null && fast.next !== null)", explanation: "Stops safely the moment the fast runner would fall off the end — meaning no cycle." },
          { code: "slow = slow.next; fast = fast.next.next;", explanation: "The fast runner covers ground twice as quickly as the slow one." },
          { code: "if (slow === fast) return true;", explanation: "If a loop exists, the fast runner eventually catches back up to the slow one from behind." },
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
You're given the head of a singly linked list with nodes, in order,
holding values L0, L1, L2, ..., Ln. Rearrange the nodes in place (without
just copying the values into a new structure) so the list instead reads
L0, Ln, L1, Ln-1, L2, Ln-2, and so on — alternating one node from the
front of the original order with one from the back, working inward.

You're changing the pointers between the existing nodes, not swapping
the values stored inside them.
    `.trim(),
    examples: [
      { input: "head = [1, 2, 3, 4]", output: "[1, 4, 2, 3]" },
      { input: "head = [1, 2, 3, 4, 5]", output: "[1, 5, 2, 4, 3]" },
      { input: "head = [1]", output: "[1]", explanation: "A single node has nothing to interleave with." },
    ],
    constraints: ["The number of nodes is between 1 and 5 * 10^4.", "1 <= Node.val <= 1000"],
    hints: [
      "If you had random access to every node (say, in an array), you could just read off the pattern with one pointer starting at the front and one at the back.",
      "To do it without extra memory, notice that the second half of the list, reversed, is exactly the sequence of nodes you need to interleave with the first half.",
      "Splitting the list at its middle is itself a fast/slow pointer problem — the same trick used to find a list's midpoint.",
    ],
    approachOverview: `
A direct approach: drop every node reference into an array (this gives
you random access), then use two indices, one starting at the front and
one at the back, stitching the list back together by alternating
between them.

The more memory-efficient approach avoids the array entirely. First,
find the middle of the list using a fast/slow pointer. Then reverse the
second half in place, so its nodes now come out in exactly the
back-to-front order you need. Finally, zipper the first half and the
reversed second half together one node at a time, which produces the
required order without ever needing random access.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Random Access via Array",
        explanation: `
Collect every node reference into an array, in order. Then use two
indices — one starting at the front, one at the back — and rewire each
node's next pointer to alternate between them, moving the indices
toward each other until they meet.
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
First, locate the middle of the list with a slow pointer (one step at a
time) and a fast pointer (two steps at a time) — when the fast pointer
runs out of room, the slow pointer sits at the middle. Cut the list
there into two halves.

Reverse the second half in place, so walking it front to back now
yields the original list's values back to front.

Finally, weave the first half and the reversed second half together:
take one node from the first half, then one from the reversed second
half, and repeat, re-pointing next as you go.
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
          { code: "while (fast.next && fast.next.next) { slow = slow.next; fast = fast.next.next; }", explanation: "The classic fast/slow scan — when fast runs out of room, slow is resting on the middle node." },
          { code: "let second = slow.next; slow.next = null;", explanation: "Physically splits the list into a front half and a back half." },
          { code: "second.next = prev; ...", explanation: "Reverses the back half in place, so it now reads in the exact back-to-front order needed." },
          { code: "first.next = second; second.next = firstNext;", explanation: "Zippers one node from the front half with one from the reversed back half, alternating until the shorter half runs out." },
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
You're given the head of a linked list and a number n. Remove the node
that sits n positions from the *end* of the list (so n = 1 means remove
the very last node), then return the head of the resulting list.

Try to do it by walking the list only once.
    `.trim(),
    examples: [
      { input: "head = [1, 2, 3, 4, 5], n = 2", output: "[1, 2, 3, 5]", explanation: "The 2nd node from the end is the one with value 4." },
      { input: "head = [1], n = 1", output: "[]" },
      { input: "head = [1, 2], n = 1", output: "[1]" },
    ],
    constraints: ["The number of nodes is between 1 and 30.", "0 <= Node.val <= 100", "1 <= n <= number of nodes in the list"],
    hints: [
      "If you knew the total length of the list up front, 'the nth node from the end' converts directly into a fixed position counted from the front.",
      "You don't actually need to know the length beforehand — you can discover it implicitly by starting one pointer n steps ahead of the other.",
      "To remove a node cleanly, you need a hold on the node just *before* it, not the node itself. A dummy node in front of the head helps handle removing the very first real node.",
    ],
    approachOverview: `
If you first walk the whole list once just to count its length, then
"n from the end" becomes a plain, fixed position counted from the
front — you can walk to just before that position and unlink the node
after it. That's correct, but it takes two full passes.

You can fold both passes into one: start two pointers together, but
advance one of them (the "fast" pointer) n steps ahead before moving
the other pointer at all. From then on, move both pointers one step at
a time. When the fast pointer reaches the end of the list, the gap
you built in means the slow pointer is sitting exactly one node before
the one that needs to be removed.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Two Passes (Count, Then Remove)",
        explanation: `
Walk the list once just to count how many nodes it has. That count
tells you exactly how many steps in from the front the target node
sits. Walk the list a second time to that position and unlink the
node there. A dummy node placed before the head makes removing the
very first node no different from removing any other.
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
Attach a dummy node in front of the head so removing the real head node
needs no special case. Advance a "fast" pointer n steps ahead of a
"slow" pointer, both starting at the dummy node. Then move both
pointers forward together, one step at a time, until fast reaches the
last node. Because of the n-node gap you built in, slow is now sitting
exactly one node before the one to remove, so you can unlink it
directly.
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
          { code: "const dummy = new ListNode(0, head);", explanation: "Gives slow a valid starting point even when the node to remove is the original head." },
          { code: "for (let i = 0; i < n; i++) { fast = fast.next; }", explanation: "Builds a fixed n-node gap between fast and slow before either one really starts walking." },
          { code: "while (fast.next) { fast = fast.next; slow = slow.next; }", explanation: "Both pointers move together, preserving the gap, until fast is on the last real node." },
          { code: "slow.next = slow.next.next;", explanation: "Slow is now sitting one node before the target, so this single line skips over and removes it." },
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
You're given a linked list where every node has two pointers: the usual
"next" pointer to the following node, and an extra "random" pointer
that can point to *any* node in the list (including itself), or to
nothing at all.

Produce a completely independent deep copy of this list: same values in
the same order, with each copied node's "random" pointer aimed at the
*corresponding copy*, not at a node from the original list. None of the
new nodes should be shared with the original list.
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
      "If you make a copy of each node before wiring up any random pointers, you'll need some way to translate 'this original node' into 'its matching copy' — a hash map from original node to copy node does exactly that.",
      "You can avoid the hash map's extra memory by splicing each copy directly into the original list, right after the node it's copying — that turns 'find the copy of X' into 'just look at X.next'.",
      "Once every random pointer is wired up using that trick, you still need one more pass to separate the interleaved original and copied nodes back into two independent lists.",
    ],
    approachOverview: `
The direct approach is to first create a plain copy of every node (with
no pointers set yet), and use a hash map to remember which copy
corresponds to which original node. Then, in a second pass, use that
map to wire up every copy's "next" and "random" pointers by looking up
the copies of the original's neighbors. This is simple and correct, but
the hash map costs memory proportional to the list's length.

The more elegant approach skips the hash map by temporarily interleaving
the copied nodes directly into the original list — each original node
gets its copy inserted immediately after it. With that arrangement,
"the copy of node X" is always just X.next, so random pointers can be
wired up without any lookup structure at all. A final pass then splits
the doubled-up list back into the original list and the standalone copy.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Hash Map from Original to Copy",
        explanation: `
First pass: walk the original list and create a bare copy of each node
(value only), storing "original node -> copy node" in a map. Second
pass: walk the original list again, and for each original node, use the
map to set its copy's next and random pointers to the copies of the
original's own next and random targets.
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
Step 1: for every original node, create its copy and splice it in
immediately afterward, so the list temporarily reads
original1 -> copy1 -> original2 -> copy2 -> ...

Step 2: now that "the copy of any node X" is always just X.next, walk
the interleaved list and set each copy's random pointer to
(original's random node).next — which is exactly that random node's
copy.

Step 3: walk the interleaved list once more, unhooking the copy nodes
from the originals to restore the original list and produce the
standalone copied list.
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
          { code: "const copy = new Node(curr.val, curr.next); curr.next = copy;", explanation: "Splices a fresh copy right after its original, so original.next now always leads to that original's own copy." },
          { code: "curr.next.random = curr.random.next;", explanation: "curr.random is some original node, and that node's own copy is just one step past it — no lookup needed." },
          { code: "curr.next = copy.next; copyCurr.next = copy;", explanation: "Peels the copy back out of the interleaved chain, restoring the original list while building the standalone copy in parallel." },
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
Two non-negative integers are stored as linked lists, one digit per
node, with the *least significant digit first* (so the list
[2, 4, 3] represents the number 342). Add the two numbers together and
return the sum, also as a linked list of digits in the same
least-significant-first order.

Neither input list has leading zero digits, except that the number 0
itself is represented as a single node holding 0.
    `.trim(),
    examples: [
      { input: "l1 = [2, 4, 3], l2 = [5, 6, 4]", output: "[7, 0, 8]", explanation: "342 + 465 = 807, and 807 written least-significant-digit-first is [7, 0, 8]." },
      { input: "l1 = [0], l2 = [0]", output: "[0]" },
      { input: "l1 = [9, 9], l2 = [1]", output: "[0, 0, 1]", explanation: "99 + 1 = 100, and the carry has to ripple through two extra digits." },
    ],
    constraints: ["Each list has between 1 and 100 nodes.", "0 <= Node.val <= 9", "Neither list has a leading zero, except the number 0 itself."],
    hints: [
      "Because digits are stored least-significant first, this lines up perfectly with how you'd add numbers by hand starting from the ones place — no reversing needed.",
      "At each position, add the two digits (if both lists still have one) plus whatever carry came from the previous position; the new digit is that sum mod 10, and the new carry is that sum divided by 10.",
      "Don't stop as soon as one list runs out — the shorter list contributes 0 at each remaining position, and a leftover carry after both lists end still needs one more digit.",
    ],
    approachOverview: `
Since each list already represents its number with the smallest digit
first, one option is to convert each list into an actual (possibly very
large) number, add the two numbers normally, and then turn the result
back into a list of digits. This works, but it means building up large
number representations and converting between formats, which is more
work than the problem actually requires.

The direct approach mirrors how you add numbers by hand: walk both
lists at the same time, one digit position at a time, adding the two
digits plus any carry left over from the previous position, and writing
down the ones digit of that sum while carrying the rest forward. Once
both lists are exhausted, if there's still a carry left, it becomes one
final extra digit.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Convert to Numbers and Back",
        explanation: `
Read each list into a big integer (using an arbitrary-precision type so
very long lists don't lose precision), add the two integers directly,
then split the sum's digits back out into a new list, remembering to
lay them down least-significant-digit first again.
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
Walk both lists at once, one node per position. At each step, add
whatever digits are available (treating a list that's already run out
as contributing 0) plus the carry from the previous step. The new
node's value is that sum modulo 10, and the carry going forward is that
sum divided by 10 (rounded down). Keep going as long as either list
still has nodes, or there's a leftover carry to place.
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
          { code: "while (l1 !== null || l2 !== null || carry !== 0)", explanation: "Keeps going as long as either list has digits left, or there's still a carry to write down." },
          { code: "const digit1 = l1 ? l1.val : 0;", explanation: "A list that's already ended simply contributes 0 at this position, same as adding by hand with a shorter number." },
          { code: "carry = Math.floor(sum / 10);", explanation: "Anything past the ones place rolls forward into the next position's addition." },
          { code: "curr.next = new ListNode(sum % 10);", explanation: "Only the ones digit of this position's sum becomes part of the answer." },
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
You're given an array of n + 1 integers, where every value is between 1
and n (inclusive). Exactly one value appears more than once — it might
appear two times or more — while every other value appears exactly
once. Find that repeated value.

You're not allowed to modify the array, and you should use only a
constant amount of extra memory (so sorting a copy or using a
hash set doesn't count as satisfying the full challenge, even though
either would give you a correct answer).
    `.trim(),
    examples: [
      { input: "nums = [1, 3, 4, 2, 2]", output: "2" },
      { input: "nums = [3, 1, 3, 4, 2]", output: "3" },
      { input: "nums = [1, 1]", output: "1" },
    ],
    constraints: ["1 <= n <= 10^5", "nums.length == n + 1", "1 <= nums[i] <= n", "Exactly one value in nums repeats (one or more extra times)."],
    hints: [
      "Values only range from 1 to n but there are n + 1 of them, so by the pigeonhole principle at least one value has to repeat — you can't avoid it.",
      "Binary search doesn't need to search the array's positions — it can search over the range of *possible values* instead, using a count of 'how many numbers are <= this candidate' to decide which half holds the duplicate.",
      "If you treat each array value as an arrow pointing from its index to the index it names (index i points at index nums[i]), the fact that two different indices point at the same value creates a loop — which is exactly the shape a cycle-detection algorithm is built to find.",
    ],
    approachOverview: `
The most direct approach doesn't worry about the space limit at all:
remember every value you've seen in a set as you scan the array, and
the first value you encounter a second time is the answer.

A better approach uses binary search over the *range of possible
values* rather than over the array's positions. For a candidate
midpoint value m, count how many entries in the array are less than or
equal to m. If that count exceeds m, the duplicate must be somewhere in
the lower half of the range; otherwise it's in the upper half.

The approach that satisfies every constraint at once treats the array
as if it encoded a linked list: think of position i as a node whose
"next" pointer is nums[i]. Because two different positions inevitably
point at the same value, this structure always contains a cycle, and
the entry point of that cycle is exactly the duplicated value — which
Floyd's tortoise-and-hare cycle detection can find using no extra
memory and without changing the array.
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
