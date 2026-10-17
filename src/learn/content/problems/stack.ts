import type { Problem } from "../../types/problem";

export const stackProblems: Problem[] = [
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    category: "stack",
    description: `
You're given a string of the bracket characters \`(\`, \`)\`, \`[\`, \`]\`,
\`{\`, and \`}\`. Return whether the brackets are balanced.

Balanced means every opening bracket has a closing bracket of the same
type, and they close in the right order: the most recently opened bracket
must close first.
    `.trim(),
    examples: [
      {
        input: `s = "()[]{}"`,
        output: "true",
        explanation: "Each pair opens and closes cleanly, and none of the pairs overlap improperly.",
      },
      {
        input: `s = "(]"`,
        output: "false",
        explanation: "The opening '(' ends up closed by ']', which is the wrong type of bracket.",
      },
      {
        input: `s = "([)]"`,
        output: "false",
        explanation: "'(' opens, then '[' opens — but ')' shows up before '[' has been closed, closing things out of order.",
      },
    ],
    constraints: ["1 <= s.length <= 10^4", "s consists only of the characters '(', ')', '[', ']', '{', and '}'."],
    hints: [
      "While reading the string, which bracket must close next: the one opened most recently, or an older one?",
      "A stack holds 'the most recent unfinished thing'. Push every opening bracket, and check each closing bracket against the top.",
      "Check the end too: if unclosed brackets are left over, the string isn't valid. The stack must end up empty.",
    ],
    approachOverview: `
A closing bracket must match the *most recently opened* bracket that is
still open. That's last-in, first-out, which is what a stack is for.

Walk through the string:

- Opening bracket: push it.
- Closing bracket: pop the top. If it's the wrong type, or the stack is empty, the string is invalid.

At the end, the string is valid only if the stack is empty. Anything left
was opened but never closed.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Repeatedly Remove Matched Pairs",
        explanation:
          "Keep removing adjacent matched pairs like \"()\", \"[]\", or \"{}\" from the string. If it shrinks to empty, it was valid. This works, but it re-scans the string over and over.",
        code: `function isValid(s) {
  let previous;
  do {
    previous = s;
    s = s.replace("()", "").replace("[]", "").replace("{}", "");
  } while (s !== previous);

  return s.length === 0;
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal — Stack",
        explanation:
          "Push opening brackets onto a stack. For each closing bracket, pop the stack and check it's the matching opening bracket. If it isn't, or the stack is empty, the string is invalid.",
        code: `function isValid(s) {
  const stack = [];
  const pairs = { ")": "(", "]": "[", "}": "{" };

  for (const char of s) {
    if (char === "(" || char === "[" || char === "{") {
      stack.push(char);
    } else {
      if (stack.pop() !== pairs[char]) {
        return false;
      }
    }
  }

  return stack.length === 0;
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "const pairs = { ')': '(', ']': '[', '}': '{' };", explanation: "Maps each closing bracket to the opening bracket it should match." },
          { code: "if (char === '(' || char === '[' || char === '{') { stack.push(char); }", explanation: "Pushes opening brackets so they can be matched later." },
          { code: "if (stack.pop() !== pairs[char]) { return false; }", explanation: "A closing bracket must match the most recently opened one: the top of the stack." },
          { code: "return stack.length === 0;", explanation: "Anything left on the stack is an opening bracket that never closed." },
        ],
      },
    ],
    relatedProblems: ["generate-parentheses"],
    keywords: ["valid parentheses", "stack", "brackets", "matching"],
  },
  {
    id: "min-stack",
    title: "Min Stack",
    difficulty: "Medium",
    category: "stack",
    description: `
Design a stack that supports push, pop, top, and getMin (the smallest
value in the stack). All four operations must run in constant time, no
matter how big the stack gets.
    `.trim(),
    examples: [
      {
        input: "push(-2), push(0), push(-3), getMin(), pop(), top(), getMin()",
        output: "getMin() -> -3, then after pop() the stack holds -2, 0; top() -> 0, getMin() -> -2",
        explanation:
          "After the three pushes, the stack holds -2, 0, -3 (bottom to top), so the minimum is -3. Popping removes -3; now the top is 0, and the smallest of what remains (-2 and 0) is -2.",
      },
      {
        input: "push(1), push(2), getMin(), pop(), getMin()",
        output: "getMin() -> 1, then after pop() removes 2, getMin() -> 1",
        explanation: "1 stays the minimum throughout, since 2 gets popped off without ever having been the smallest.",
      },
    ],
    constraints: [
      "pop, top, and getMin are only ever called when the stack is non-empty.",
      "At most 3 * 10^4 calls total will be made to push/pop/top/getMin.",
    ],
    hints: [
      "A single minimum variable breaks when you pop that exact value. What would you replace it with?",
      "What if each push also remembered the stack's minimum at that moment?",
      "Keep a second stack of 'minimum so far' that grows and shrinks with the main stack. Popping both restores the previous minimum automatically.",
    ],
    approachOverview: `
Tracking the minimum on push is easy: compare against a running minimum.
Popping is the hard part. If you pop the current minimum, you need the
minimum from *before* it was pushed, and a single variable can't tell you.

Keep a second stack, the min-stack. Each entry records the minimum at the
moment that element was pushed. Every push and pop touches both stacks,
so the top of the min-stack is always the current minimum.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Scan for the Minimum",
        explanation:
          "Use a plain array as the stack. push, pop, and top are O(1), but getMin() scans the whole stack on every call.",
        code: `class MinStack {
  constructor() {
    this.stack = [];
  }

  push(val) {
    this.stack.push(val);
  }

  pop() {
    this.stack.pop();
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  getMin() {
    return Math.min(...this.stack);
  }
}`,
        timeComplexity: "push/pop/top: O(1), getMin: O(n)",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal — Auxiliary Min Stack",
        explanation:
          "Keep a second stack where each entry is the minimum right after that push. Popping both stacks together leaves the correct minimum on top of the min-stack.",
        code: `class MinStack {
  constructor() {
    this.stack = [];
    this.minStack = [];
  }

  push(val) {
    this.stack.push(val);
    const currentMin =
      this.minStack.length === 0
        ? val
        : Math.min(val, this.minStack[this.minStack.length - 1]);
    this.minStack.push(currentMin);
  }

  pop() {
    this.stack.pop();
    this.minStack.pop();
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  getMin() {
    return this.minStack[this.minStack.length - 1];
  }
}`,
        timeComplexity: "O(1) for push, pop, top, and getMin",
        spaceComplexity: "O(n), for the extra min-tracking stack",
        walkthrough: [
          { code: "const currentMin = this.minStack.length === 0 ? val : Math.min(val, this.minStack[this.minStack.length - 1]);", explanation: "Works out the minimum, including the value being pushed." },
          { code: "this.minStack.push(currentMin);", explanation: "Records that minimum, one entry per push." },
          { code: "pop() { this.stack.pop(); this.minStack.pop(); }", explanation: "Pops both stacks together, so the min-stack's new top is the minimum of what's left." },
          { code: "getMin() { return this.minStack[this.minStack.length - 1]; }", explanation: "The current minimum is always on top. No scanning needed." },
        ],
      },
    ],
    relatedProblems: ["valid-parentheses"],
    keywords: ["min stack", "design", "stack", "auxiliary stack"],
  },
  {
    id: "evaluate-reverse-polish-notation",
    title: "Evaluate Reverse Polish Notation",
    difficulty: "Medium",
    category: "stack",
    description: `
You're given an arithmetic expression in *postfix* notation (also called
Reverse Polish Notation), as a list of tokens. Each operator comes right
after the two numbers it applies to, so \`3 4 +\` means "3 plus 4". No
parentheses are ever needed.

Evaluate the expression and return its value. The operators are \`+\`,
\`-\`, \`*\`, and \`/\`. Division truncates toward zero (\`13 / 5\` is \`2\`,
not \`2.6\` or \`3\`).
    `.trim(),
    examples: [
      {
        input: `tokens = ["2", "1", "+", "3", "*"]`,
        output: "9",
        explanation: "Reading left to right: 2 and 1 combine with + to make 3, then that 3 and the next 3 combine with * to make 9 — this is the postfix form of (2 + 1) * 3.",
      },
      {
        input: `tokens = ["4", "13", "5", "/", "+"]`,
        output: "6",
        explanation: "13 / 5 truncates to 2, then 4 + 2 = 6.",
      },
      {
        input: `tokens = ["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]`,
        output: "22",
      },
    ],
    constraints: [
      "1 <= tokens.length <= 10^4",
      "Each token is either an operator (+, -, *, /) or an integer.",
      "Division always truncates toward zero, and the input never divides by zero.",
    ],
    hints: [
      "When you hit an operator, which two numbers does it apply to: the two right before it, or something further back?",
      "A stack holds 'unused numbers, most recent on top', which is exactly the two operands an operator needs.",
      "On an operator, pop the top two numbers, apply it (watch the order for `-` and `/`), and push the result back.",
    ],
    approachOverview: `
Postfix notation can be evaluated in one left-to-right pass with a stack.
You never need to think about operator precedence or parentheses.

Walk through the tokens:

- Number: push it.
- Operator: pop two numbers. The first one popped is the right-hand operand, the second is the left-hand operand. Apply the operator and push the result.

At the end, exactly one number is left on the stack: the answer.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Repeatedly Collapse the First Operator Found",
        explanation:
          "Work on a copy of the tokens. Find the first operator, apply it to the two numbers before it, and splice the result back in. Repeat until one token remains.",
        code: `function evalRPN(tokens) {
  const ops = new Set(["+", "-", "*", "/"]);
  const arr = [...tokens];

  while (arr.length > 1) {
    const opIndex = arr.findIndex((t) => ops.has(t));
    const b = Number(arr[opIndex - 1]);
    const a = Number(arr[opIndex - 2]);
    let result;
    switch (arr[opIndex]) {
      case "+": result = a + b; break;
      case "-": result = a - b; break;
      case "*": result = a * b; break;
      case "/": result = Math.trunc(a / b); break;
    }
    arr.splice(opIndex - 2, 3, String(result));
  }

  return Number(arr[0]);
}`,
        timeComplexity: "O(n²), since each pass re-scans and splices the array",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal — Stack",
        explanation:
          "Push numbers onto a stack. On an operator, pop the top two numbers (in the right order), apply it, and push the result. One pass, no re-scanning.",
        code: `function evalRPN(tokens) {
  const stack = [];

  for (const token of tokens) {
    if (token === "+" || token === "-" || token === "*" || token === "/") {
      const b = stack.pop();
      const a = stack.pop();
      let result;
      switch (token) {
        case "+": result = a + b; break;
        case "-": result = a - b; break;
        case "*": result = a * b; break;
        case "/": result = Math.trunc(a / b); break;
      }
      stack.push(result);
    } else {
      stack.push(Number(token));
    }
  }

  return stack.pop();
}`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "if (token === '+' || ... ) {", explanation: "Checks whether the token is an operator or a number." },
          { code: "const b = stack.pop(); const a = stack.pop();", explanation: "The two most recent numbers are this operator's operands. `b`, popped first, is the right-hand one." },
          { code: "case '-': result = a - b; break;", explanation: "Order matters: it's `a - b`, not `b - a`, because `a` came first in the expression." },
          { code: "stack.push(result);", explanation: "Pushes the result so a later operator can use it." },
          { code: "return stack.pop();", explanation: "After the last token, one value remains: the answer." },
        ],
      },
    ],
    relatedProblems: ["min-stack"],
    keywords: ["reverse polish notation", "postfix", "stack", "arithmetic expression"],
  },
  {
    id: "generate-parentheses",
    title: "Generate Parentheses",
    difficulty: "Medium",
    category: "stack",
    description: `
Given a number \`n\`, generate every distinct arrangement of \`n\` pairs of
parentheses that is validly matched: every opening bracket has a closing
bracket, and they never close in the wrong order.
    `.trim(),
    examples: [
      {
        input: "n = 3",
        output: `["((()))", "(()())", "(())()", "()(())", "()()()"]`,
        explanation: "These are all 5 distinct ways to arrange 3 pairs of parentheses so that every opening bracket is properly matched and nested.",
      },
      { input: "n = 1", output: `["()"]` },
      { input: "n = 2", output: `["(())", "()()"]` },
    ],
    constraints: ["1 <= n <= 8"],
    hints: [
      "At each step you add an opening or a closing bracket, but not every choice can lead to a valid result.",
      "You can add an opening bracket as long as you haven't used all `n` of them.",
      "You can add a closing bracket only if you've placed more opening brackets than closing ones so far. Build one character at a time, backing out of choices that can't work (backtracking).",
    ],
    approachOverview: `
You could generate every sequence of \`2n\` brackets and keep the valid
ones. But most sequences are invalid, so most of the work is wasted.

Instead, use backtracking to build only sequences that *could* still be
valid. Track how many opening and closing brackets you've placed:

- Add an opening bracket if you've used fewer than \`n\`.
- Add a closing bracket only if there are more opening brackets than closing ones. Otherwise you'd close something never opened.

Once the string reaches length \`2n\`, it's guaranteed to be valid.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Generate All, Then Filter",
        explanation:
          "Build every sequence of length 2n from '(' and ')', then keep only the valid ones.",
        code: `function generateParenthesis(n) {
  const result = [];
  const total = 2 * n;

  function isValid(str) {
    let balance = 0;
    for (const char of str) {
      balance += char === "(" ? 1 : -1;
      if (balance < 0) return false;
    }
    return balance === 0;
  }

  function build(current) {
    if (current.length === total) {
      if (isValid(current)) result.push(current);
      return;
    }
    build(current + "(");
    build(current + ")");
  }

  build("");
  return result;
}`,
        timeComplexity: "O(2^(2n) * n) — every one of the 2^(2n) sequences is generated, and each is validated in O(n)",
        spaceComplexity: "O(n) recursion depth, plus the space to store the output",
      },
      {
        approach: "Optimal — Backtracking (Only Build Valid Prefixes)",
        explanation:
          "Build the string one character at a time. Add an opening bracket only if fewer than n are used, and a closing bracket only if it won't outnumber the opening ones. Every complete string is valid.",
        code: `function generateParenthesis(n) {
  const result = [];

  function backtrack(current, openCount, closeCount) {
    if (current.length === 2 * n) {
      result.push(current);
      return;
    }
    if (openCount < n) {
      backtrack(current + "(", openCount + 1, closeCount);
    }
    if (closeCount < openCount) {
      backtrack(current + ")", openCount, closeCount + 1);
    }
  }

  backtrack("", 0, 0);
  return result;
}`,
        timeComplexity: "O(4^n / sqrt(n)) — the number of valid combinations (the nth Catalan number), each built in O(n)",
        spaceComplexity: "O(n) recursion depth, plus the space to store the output",
        walkthrough: [
          { code: "if (current.length === 2 * n) { result.push(current); return; }", explanation: "At full length, the string is a complete, valid combination." },
          { code: "if (openCount < n) { backtrack(current + '(', openCount + 1, closeCount); }", explanation: "Adds an opening bracket only if some are still unused." },
          { code: "if (closeCount < openCount) { backtrack(current + ')', openCount, closeCount + 1); }", explanation: "Adds a closing bracket only if it won't outnumber the opening ones, so the string stays balanced as it grows." },
        ],
      },
    ],
    relatedProblems: ["valid-parentheses"],
    keywords: ["generate parentheses", "backtracking", "recursion", "catalan number"],
  },
  {
    id: "daily-temperatures",
    title: "Daily Temperatures",
    difficulty: "Medium",
    category: "stack",
    description: `
You're given a list of daily temperatures. For each day, return how many
days you'd wait for a warmer temperature. If no later day is warmer, use 0.
    `.trim(),
    examples: [
      {
        input: "temperatures = [73, 74, 75, 71, 69, 72, 76, 73]",
        output: "[1, 1, 4, 2, 1, 1, 0, 0]",
        explanation:
          "On day 0 (73°), the very next day (74°) is already warmer, so wait 1 day. On day 2 (75°), the next warmer day is day 6 (76°), 4 days later. The last two days never see anything warmer, so they get 0.",
      },
      {
        input: "temperatures = [30, 40, 50, 60]",
        output: "[1, 1, 1, 0]",
        explanation: "Temperatures keep rising, so every day just waits for the very next one — except the last day, which has nothing after it.",
      },
      { input: "temperatures = [30, 60, 90]", output: "[1, 1, 0]" },
    ],
    constraints: ["1 <= temperatures.length <= 10^5", "30 <= temperatures[i] <= 100"],
    hints: [
      "The obvious approach checks every later day until a warmer one shows up, which repeats a lot of scanning.",
      "Which days are still 'waiting' for a warmer day? Could you track just those instead of re-scanning?",
      "Keep a stack of day indexes still waiting. When today beats the temperature at the top of the stack, that day's wait is known: pop it and record the gap.",
    ],
    approachOverview: `
The direct approach scans forward from every day until it finds a warmer
one. It's correct, but it re-scans the same days many times.

Instead, keep a stack of day indexes still waiting for a warmer day, and
walk the temperatures once:

- While today is warmer than the day on top of the stack, pop that day and record how long it waited.
- Then push today's index. It now waits for its own warmer day.

Each index is pushed once and popped at most once, so this is a single
pass.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Scan Forward From Every Day",
        explanation: "For each day, look ahead until a warmer day shows up, and record the gap.",
        code: `function dailyTemperatures(temperatures) {
  const n = temperatures.length;
  const answer = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (temperatures[j] > temperatures[i]) {
        answer[i] = j - i;
        break;
      }
    }
  }

  return answer;
}`,
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1) extra, not counting the output",
      },
      {
        approach: "Optimal — Monotonic Stack",
        explanation:
          "Keep a stack of day indexes still waiting for a warmer day. When the current temperature beats the day on top of the stack, that day's wait is resolved.",
        code: `function dailyTemperatures(temperatures) {
  const n = temperatures.length;
  const answer = new Array(n).fill(0);
  const stack = []; // indexes of days still waiting for a warmer day

  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      const dayIndex = stack.pop();
      answer[dayIndex] = i - dayIndex;
    }
    stack.push(i);
  }

  return answer;
}`,
        timeComplexity: "O(n), since each index is pushed and popped at most once",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "const stack = [];", explanation: "Holds indexes of days that haven't seen a warmer day yet." },
          {
            code: "while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {",
            explanation: "Resolves days from the stack while today is warmer than they are.",
          },
          { code: "const dayIndex = stack.pop(); answer[dayIndex] = i - dayIndex;", explanation: "That day's wait is the gap between the two indexes." },
          { code: "stack.push(i);", explanation: "Today's index now waits for its own warmer day." },
        ],
      },
    ],
    relatedProblems: ["car-fleet", "largest-rectangle-in-histogram"],
    keywords: ["daily temperatures", "monotonic stack", "array"],
  },
  {
    id: "car-fleet",
    title: "Car Fleet",
    difficulty: "Medium",
    category: "stack",
    description: `
Cars drive in one lane toward the same destination, and no car can pass
the car in front. You're given each car's starting position and speed.

If a car catches up to the car ahead before the destination, it slows to
match that car's speed, and they travel on as one "fleet". Given the
destination, return how many separate fleets arrive.
    `.trim(),
    examples: [
      {
        input: "target = 12, position = [10, 8, 0, 5, 3], speed = [2, 4, 1, 1, 3]",
        output: "3",
        explanation:
          "The car at 10 reaches the destination on its own. The car at 8 is fast enough to catch up to it first, and they arrive together as one fleet. The car at 5 travels alone at first, but the car at 3 (which is faster) catches up to it, forming a second fleet. The car at 0 never catches anyone, forming a third fleet by itself. That's 3 fleets in total.",
      },
      {
        input: "target = 10, position = [3], speed = [3]",
        output: "1",
        explanation: "With only one car on the road, it's automatically its own fleet.",
      },
      {
        input: "target = 100, position = [0, 2, 4], speed = [4, 2, 1]",
        output: "1",
        explanation:
          "The car at 0 is the fastest and catches up to the car at 2, and that combined group in turn catches up to the slowest car, at 4. Everyone ends up traveling together as a single fleet.",
      },
    ],
    constraints: [
      "n == position.length == speed.length",
      "1 <= n <= 10^5",
      "0 < target <= 10^6",
      "0 <= position[i] < target",
      "Every value in position is unique.",
      "0 < speed[i] <= 10^6",
    ],
    hints: [
      "A faster car can't pass the car ahead. It can only catch up, match its speed, and join its fleet.",
      "For each car, work out how long it would take to reach the destination alone. That time tells you who catches whom.",
      "Process cars from closest to the destination backward. Track the arrival time of the latest fleet. Any car behind that would arrive at or before that time catches up and merges into it.",
    ],
    approachOverview: `
Cars can't pass, so each car either arrives alone or catches the car (or
group) ahead and joins that fleet. This depends only on the car
*directly* ahead: if a car can't catch that one, it can't catch anything
further ahead either.

So:

- Compute each car's solo arrival time: how long it would take driving alone.
- Process cars from closest to the destination to farthest, tracking the arrival time of the latest fleet.
- If a car would arrive at or before that time, it catches up and merges into that fleet.
- If it would arrive later, it can never catch up, so it leads a new fleet.

The number of fleets formed is the answer.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Repeatedly Merge Adjacent Cars",
        explanation:
          "Sort cars by position. Scan and merge any adjacent pair where the rear car would arrive at or before the car ahead (it caught up). The merged group behaves like the front car. Repeat until a full pass makes no merges.",
        code: `function carFleet(target, position, speed) {
  let groups = position.map((p, i) => ({ pos: p, time: (target - p) / speed[i] }));
  groups.sort((a, b) => a.pos - b.pos); // farthest from target (rear-most) first

  let merged = true;
  while (merged) {
    merged = false;
    const next = [];
    let i = 0;
    while (i < groups.length) {
      if (i + 1 < groups.length && groups[i].time <= groups[i + 1].time) {
        // the rear group catches the group ahead of it; they become one fleet
        next.push({ pos: groups[i + 1].pos, time: groups[i + 1].time });
        i += 2;
        merged = true;
      } else {
        next.push(groups[i]);
        i += 1;
      }
    }
    groups = next;
  }

  return groups.length;
}`,
        timeComplexity: "O(n²) in the worst case, on top of the initial O(n log n) sort",
        spaceComplexity: "O(n)",
      },
      {
        approach: "Optimal — Sort + Monotonic Stack",
        explanation:
          "Compute each car's solo arrival time. Process cars from closest to the destination to farthest, keeping a stack of fleet arrival times. A car merges into the fleet ahead if its time is less than or equal to the top of the stack; otherwise it leads a new fleet.",
        code: `function carFleet(target, position, speed) {
  const cars = position
    .map((p, i) => [p, speed[i]])
    .sort((a, b) => b[0] - a[0]); // closest to target first

  const stack = [];
  for (const [pos, spd] of cars) {
    const time = (target - pos) / spd;
    if (stack.length === 0 || time > stack[stack.length - 1]) {
      stack.push(time);
    }
    // otherwise this car catches up to the fleet ahead before the target,
    // so it merges instead of forming a new fleet
  }

  return stack.length;
}`,
        timeComplexity: "O(n log n), dominated by the sort",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "cars.sort((a, b) => b[0] - a[0]);", explanation: "Processes cars starting from the one closest to the destination." },
          { code: "const time = (target - pos) / spd;", explanation: "How long this car would take to arrive driving alone." },
          {
            code: "if (stack.length === 0 || time > stack[stack.length - 1]) { stack.push(time); }",
            explanation: "If this car would arrive later than the latest fleet ahead, it can never catch up, so it leads a new fleet.",
          },
          { code: "// otherwise ... it merges instead of forming a new fleet", explanation: "If its solo time is at or before that, it catches up and joins that fleet." },
          { code: "return stack.length;", explanation: "Each entry on the stack is one fleet." },
        ],
      },
    ],
    relatedProblems: ["daily-temperatures", "largest-rectangle-in-histogram"],
    keywords: ["car fleet", "monotonic stack", "greedy", "sorting"],
  },
  {
    id: "largest-rectangle-in-histogram",
    title: "Largest Rectangle in Histogram",
    difficulty: "Hard",
    category: "stack",
    description: `
You're given the heights of the bars in a histogram. Each bar has width 1,
and the bars stand side by side with no gaps. Return the area of the
largest rectangle that fits inside the histogram's outline.
    `.trim(),
    examples: [
      {
        input: "heights = [2, 1, 5, 6, 2, 3]",
        output: "10",
        explanation: "The largest rectangle uses the bars of height 5 and 6 (indexes 2 and 3): width 2, height min(5, 6) = 5, for an area of 10.",
      },
      {
        input: "heights = [2, 4]",
        output: "4",
        explanation: "Using just the bar of height 4 alone gives width 1 * height 4 = 4; using both bars gives width 2 * height 2 = 4. Either way, the best is 4.",
      },
      {
        input: "heights = [1, 1, 1, 1]",
        output: "4",
        explanation: "Using all four bars, limited to their shared height of 1, gives width 4 * height 1 = 4, better than using any smaller slice.",
      },
    ],
    constraints: ["1 <= heights.length <= 10^5", "0 <= heights[i] <= 10^4"],
    hints: [
      "If a bar is the *shortest* one in the rectangle, how far left and right can the rectangle stretch before hitting something shorter?",
      "Checking both directions for every bar works but re-scans a lot. Could you track 'bars that haven't found their right boundary yet' as you go?",
      "Keep a stack of bar indexes with increasing heights (bottom to top). When a bar is shorter than the top of the stack, the top bar has found its right boundary: pop it and compute its rectangle.",
    ],
    approachOverview: `
If a bar is the shortest in a rectangle, that rectangle stretches left
and right until it hits a shorter bar. Expanding outward from every bar
is correct but slow, because it re-scans the same bars repeatedly.

Instead, scan left to right with a stack of bar indexes whose heights
strictly increase. When the current bar is shorter than the top of the
stack:

- The top bar's right boundary is the current position.
- Its left boundary is the bar now below it on the stack.
- Pop it, compute its rectangle, and repeat while the top is taller than the current bar.

Then push the current index. A final zero-height bar at the end forces
every remaining bar on the stack to be resolved.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Expand Outward From Every Bar",
        explanation:
          "Treat each bar as the shortest in the rectangle, and expand left and right while the neighbors are at least as tall.",
        code: `function largestRectangleArea(heights) {
  let best = 0;
  const n = heights.length;

  for (let i = 0; i < n; i++) {
    let left = i;
    while (left > 0 && heights[left - 1] >= heights[i]) left--;

    let right = i;
    while (right < n - 1 && heights[right + 1] >= heights[i]) right++;

    const width = right - left + 1;
    best = Math.max(best, width * heights[i]);
  }

  return best;
}`,
        timeComplexity: "O(n²) in the worst case (e.g. when all bars are the same height)",
        spaceComplexity: "O(1)",
      },
      {
        approach: "Optimal — Monotonic Increasing Stack",
        explanation:
          "Scan left to right with a stack of bar indexes whose heights strictly increase. When the current bar is shorter than the top bar, the top bar's rectangle is fully known. Pop it and compute its area: the current index is the right boundary, and the new stack top is the left boundary.",
        code: `function largestRectangleArea(heights) {
  const stack = []; // indexes with strictly increasing heights, bottom to top
  let best = 0;
  const n = heights.length;

  for (let i = 0; i <= n; i++) {
    const currentHeight = i === n ? 0 : heights[i];

    while (stack.length > 0 && heights[stack[stack.length - 1]] > currentHeight) {
      const height = heights[stack.pop()];
      const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
      best = Math.max(best, height * width);
    }

    stack.push(i);
  }

  return best;
}`,
        timeComplexity: "O(n), since each index is pushed and popped at most once",
        spaceComplexity: "O(n)",
        walkthrough: [
          { code: "const currentHeight = i === n ? 0 : heights[i];", explanation: "A fake zero-height bar past the end forces every remaining bar to be resolved." },
          {
            code: "while (stack.length > 0 && heights[stack[stack.length - 1]] > currentHeight) {",
            explanation: "While the current bar is shorter than the top bar, the top bar's rectangle can't grow further right.",
          },
          { code: "const height = heights[stack.pop()];", explanation: "Pops the bar whose rectangle is now fully known." },
          {
            code: "const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;",
            explanation: "The rectangle spans from just after the new stack top (left boundary) to just before the current index (right boundary).",
          },
          { code: "stack.push(i);", explanation: "The current bar is resolved later, so it goes on the stack." },
        ],
      },
    ],
    relatedProblems: ["daily-temperatures", "car-fleet"],
    keywords: ["largest rectangle in histogram", "monotonic stack", "array"],
  },
];
