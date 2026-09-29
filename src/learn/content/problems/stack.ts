import type { Problem } from "../../types/problem";

export const stackProblems: Problem[] = [
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    category: "stack",
    description: `
You're given a string made up only of the bracket characters
\`(\`, \`)\`, \`[\`, \`]\`, \`{\`, and \`}\`. Figure out whether the brackets
are "balanced" — every opening bracket has a matching closing bracket of
the same type, and they close in the right order (the most recently
opened bracket must be the next one to close).
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
      "At any point while reading the string, which bracket needs to be closed next — always the one opened most recently, or could it be an older one?",
      "A stack is built exactly for 'the most recent thing that isn't finished yet' — push every opening bracket, and check closing brackets against whatever is on top.",
      "Don't forget the ending condition: if there are leftover unclosed brackets when you reach the end of the string, it isn't valid either — the stack must end up completely empty.",
    ],
    approachOverview: `
Because a closing bracket always has to match the *most recently opened*
bracket that hasn't been closed yet, this is naturally a last-in,
first-out problem — which is exactly what a stack is for.

Walk through the string one character at a time. Every time you see an
opening bracket, push it onto the stack. Every time you see a closing
bracket, check it against whatever is on top of the stack: if it matches
the type of bracket, pop it off and keep going; if it doesn't match (or
the stack is empty when you needed something to match), the string is
invalid. At the very end, the string is only valid if the stack is
completely empty — otherwise something opened but never closed.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Repeatedly Remove Matched Pairs",
        explanation:
          "Repeatedly find and remove any immediately-adjacent matched pair like \"()\", \"[]\", or \"{}\" from the string. If the string collapses all the way down to empty, it was valid. This mimics collapsing the innermost matched pairs one at a time, but it re-scans the string over and over.",
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
          "Push opening brackets onto a stack. When a closing bracket appears, pop the stack and check that it's the matching opening bracket. If it isn't (or there's nothing to pop), the string is invalid right away.",
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
          { code: "if (char === '(' || char === '[' || char === '{') { stack.push(char); }", explanation: "Opening brackets are pushed, waiting to be matched later." },
          { code: "if (stack.pop() !== pairs[char]) { return false; }", explanation: "A closing bracket must match whatever was most recently opened — the top of the stack." },
          { code: "return stack.length === 0;", explanation: "Anything still left on the stack means an opening bracket was never closed." },
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
Design a stack data structure that, in addition to the usual push, pop,
and "look at the top" operations, can also tell you the smallest value
currently in the stack — and all four of these operations need to run in
constant time, no matter how big the stack gets.
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
      "Tracking the overall minimum in one single variable falls apart the moment you pop that exact value off — what would you replace it with?",
      "What if, every time you pushed a value, you also remembered what the minimum of the stack was at that exact moment?",
      "Keep a second stack that tracks 'the minimum so far', growing and shrinking in lockstep with the main stack, so popping the main stack automatically 'restores' the previous minimum.",
    ],
    approachOverview: `
The tricky part isn't tracking the minimum while pushing — that's easy,
just compare against a running minimum. The hard part is popping: if you
pop the element that happens to be the current minimum, you need to know
what the minimum was *before* that element was pushed, and a single
variable can't tell you that.

The fix is to keep a second, parallel stack — call it the min-stack —
where each entry records "what was the minimum value in the stack at the
moment this element was pushed". Every push adds one entry to both
stacks, and every pop removes one entry from both. That way, the top of
the min-stack is always the correct current minimum, automatically kept
in sync with whatever's actually left in the main stack.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Scan for the Minimum",
        explanation:
          "Keep a single plain array as the stack. push, pop, and top are trivial O(1) array operations, but getMin() has to scan the entire stack every single time it's called.",
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
          "Maintain a second stack alongside the main one, where each entry is 'the minimum value in the stack right after this push'. Popping either stack always leaves the correct minimum on top of the min-stack.",
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
          { code: "const currentMin = this.minStack.length === 0 ? val : Math.min(val, this.minStack[this.minStack.length - 1]);", explanation: "Works out the minimum including the value being pushed right now." },
          { code: "this.minStack.push(currentMin);", explanation: "Records that minimum alongside the pushed value, one entry per push." },
          { code: "pop() { this.stack.pop(); this.minStack.pop(); }", explanation: "Popping removes from both stacks together, so the min-stack's new top is automatically the correct minimum for what's left." },
          { code: "getMin() { return this.minStack[this.minStack.length - 1]; }", explanation: "The current minimum is always sitting right on top — no scanning needed." },
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
You're given an arithmetic expression written in *postfix* notation
(also called Reverse Polish Notation), as a list of tokens. In postfix
notation, each operator comes right after the two numbers it applies to,
instead of sitting between them — so \`3 4 +\` means "3 plus 4", and
there's never any need for parentheses.

Evaluate the expression and return its value. The only operators you'll
see are \`+\`, \`-\`, \`*\`, and \`/\`, and division should truncate toward
zero (so \`13 / 5\` is \`2\`, not \`2.6\` or \`3\`).
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
      "Every time you hit an operator, which two numbers does it apply to — the two numbers you saw right before it, or something further back in the expression?",
      "A stack naturally holds 'the numbers I haven't used yet, most recent on top' — which happens to be exactly the two operands an operator needs.",
      "When you see an operator, pop the top two numbers off the stack, apply the operation (watch the order for `-` and `/`, since they're not symmetric), and push the result back on.",
    ],
    approachOverview: `
Postfix notation exists precisely because it can be evaluated with a
single left-to-right pass and a stack, with no need to think about
operator precedence or parentheses at all.

Walk through the tokens one at a time. Whenever you see a number, push
it onto the stack. Whenever you see an operator, pop the top two numbers
off — the second-to-last one popped is the left-hand operand, the last
one popped is the right-hand operand — apply the operator, and push the
result back onto the stack. By the time you reach the end of the tokens,
exactly one number is left on the stack: the answer.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Repeatedly Collapse the First Operator Found",
        explanation:
          "Simulate the evaluation directly on a copy of the token list: repeatedly scan for the first operator, apply it to the two numbers right before it, splice the result back into the list, and repeat until only one token remains.",
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
          "Push numbers onto a stack as they appear. When an operator appears, pop the top two numbers (in the right order), apply the operator, and push the result. One pass through the tokens, and no re-scanning.",
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
          { code: "if (token === '+' || ... ) {", explanation: "Checks whether the current token is an operator or a plain number." },
          { code: "const b = stack.pop(); const a = stack.pop();", explanation: "The two most recently pushed numbers are exactly this operator's operands — `b` is the right-hand one, popped first." },
          { code: "case '-': result = a - b; break;", explanation: "Order matters here: it's `a - b`, not `b - a`, since `a` was pushed (and appears in the expression) first." },
          { code: "stack.push(result);", explanation: "The computed result goes back on the stack, ready to be used by a later operator." },
          { code: "return stack.pop();", explanation: "After processing every token, exactly one value remains — the final answer." },
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
Given a number \`n\`, generate every distinct way to arrange \`n\` pairs of
parentheses so that the result is validly matched and nested — meaning
every opening bracket has a corresponding closing bracket, and they
never close in the wrong order.
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
      "At every step while building a string, you're choosing to add either an opening or a closing bracket — but not every choice keeps things on track toward a valid result.",
      "You can add an opening bracket as long as you haven't already used all `n` of them.",
      "You can only add a closing bracket if, so far, you've placed more opening brackets than closing ones — build the string up one character at a time, backing out of choices (backtracking) that can't lead anywhere valid.",
    ],
    approachOverview: `
One way to solve this is to generate every possible sequence of \`2n\`
opening and closing brackets, and then filter down to the ones that
happen to be valid. This works, but the vast majority of sequences it
builds turn out to be invalid, so a lot of the work is wasted.

A much better way is to only ever build sequences that *could* still
turn out valid, using backtracking. At each step, track how many opening
brackets and how many closing brackets have been placed so far. You're
allowed to add another opening bracket as long as you haven't used all
\`n\` yet, and you're only allowed to add a closing bracket if there are
currently more opening brackets placed than closing ones (otherwise
you'd be closing something that was never opened). Once the string
reaches length \`2n\`, it's guaranteed to be one of the valid results.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Generate All, Then Filter",
        explanation:
          "Build every possible sequence of length 2n using just '(' and ')', and check each one for validity afterward, keeping only the valid ones.",
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
          "Build the string one character at a time, but only add an opening bracket if fewer than n have been used, and only add a closing bracket if it wouldn't outnumber the opening brackets placed so far. Every complete string this produces is automatically valid.",
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
          { code: "if (current.length === 2 * n) { result.push(current); return; }", explanation: "Once the string reaches its full length, it's a complete, valid combination." },
          { code: "if (openCount < n) { backtrack(current + '(', openCount + 1, closeCount); }", explanation: "Only adds an opening bracket if there are still unused ones left." },
          { code: "if (closeCount < openCount) { backtrack(current + ')', openCount, closeCount + 1); }", explanation: "Only adds a closing bracket if doing so wouldn't outnumber the opening brackets placed so far, keeping the string always validly balanced as it grows." },
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
You're given a list of daily temperatures. For each day, figure out how
many days you'd have to wait to see a warmer temperature. If no future
day is ever warmer, put 0 for that day instead.
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
      "The obvious approach checks, for each day, every day after it until a warmer one shows up — but that repeats a lot of scanning.",
      "Think about which days are still 'waiting' to find a warmer day — could you keep track of just those, instead of re-scanning from scratch each time?",
      "Keep a stack of day-indexes that haven't found their warmer day yet. Whenever today's temperature beats the temperature at the top of the stack, that day's wait is now known — pop it and record the gap.",
    ],
    approachOverview: `
The direct approach checks, for every day, each day that follows it until
finding one that's warmer — correct, but it means re-scanning forward
from every single day.

A better approach keeps a stack of day-indexes whose warmer day hasn't
been found yet. Walk through the temperatures once. Whenever the current
day's temperature is higher than the temperature at the index sitting on
top of the stack, that top day has just found its answer: pop it and
record how many days it waited. Keep doing that as long as the top of
the stack is beatable, then push today's index — it's now waiting for
its own warmer day. Every index is pushed once and popped at most once,
so this finishes in a single pass.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Scan Forward From Every Day",
        explanation: "For each day, look forward day by day until a warmer temperature shows up, and record the gap.",
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
          "Keep a stack of day-indexes that are still waiting for a warmer day. Whenever the current temperature beats the temperature at the index on top of the stack, that day's wait is now resolved.",
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
          { code: "const stack = [];", explanation: "Holds indexes of days that haven't yet seen a warmer day." },
          {
            code: "while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {",
            explanation: "Keeps resolving days from the stack as long as today is warmer than what they were waiting on.",
          },
          { code: "const dayIndex = stack.pop(); answer[dayIndex] = i - dayIndex;", explanation: "That day's wait is now known — it's exactly the gap between the two indexes." },
          { code: "stack.push(i);", explanation: "Today's index goes on the stack, now waiting for its own future warmer day." },
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
A group of cars is driving toward the same destination along a single
lane, all heading the same direction, and none of them can ever pass the
car in front of them. You're given each car's starting position and its
speed.

If a car catches up to the car ahead of it before reaching the
destination, it has to slow down and match that car's speed — from then
on, they travel together as one "fleet". Given the destination, figure
out how many separate fleets will eventually arrive.
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
      "A faster car can never actually pass the car ahead of it — it can only catch up and then match that car's speed, joining its fleet.",
      "For each car, work out how long it would take to reach the destination completely on its own, as if no one else were on the road — that number tells you a lot about who ends up catching whom.",
      "Process the cars starting from whichever is closest to the destination and moving backward. Keep track of the arrival time of the most recently formed fleet — any car behind it that would arrive at or before that time is guaranteed to catch up and merge into it.",
    ],
    approachOverview: `
Since cars can never pass each other, a car either reaches the
destination entirely on its own, or it catches up to the car (or group of
cars) ahead of it and permanently joins that fleet, slowing to match its
pace. The key insight is that this only ever depends on the car
*directly* ahead by position — if a car doesn't catch that one, it can't
possibly catch anything further ahead either, since the car in front of
it is equally blocked.

So: compute, for every car, how long it would take to reach the
destination if it were driving completely alone. Then process the cars
in order from closest to the destination to farthest. Keep track of the
arrival time of the fleet formed most recently. If the next car (further
back) would arrive at or before that time on its own, it's guaranteed to
catch up and merge into that fleet — it doesn't start a new one. If it
would arrive later, it can never catch up, so it becomes the leader of a
brand new fleet. The final count of fleets formed this way is the
answer.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Repeatedly Merge Adjacent Cars",
        explanation:
          "Sort cars by position. Repeatedly scan through them and merge any adjacent pair where the car behind would arrive at or before the car ahead of it (meaning it's caught up), replacing the pair with a single merged group that behaves like the front car from then on. Keep re-scanning until a full pass produces no more merges.",
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
          "Compute each car's solo arrival time, then process cars from closest to the destination to farthest, keeping a stack of fleet arrival times. A car merges into the fleet ahead if its own time is less than or equal to the time on top of the stack; otherwise it leads a brand new fleet.",
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
          { code: "cars.sort((a, b) => b[0] - a[0]);", explanation: "Processes cars starting from whichever is closest to the destination." },
          { code: "const time = (target - pos) / spd;", explanation: "Computes how long this car would take to reach the destination if driving alone." },
          {
            code: "if (stack.length === 0 || time > stack[stack.length - 1]) { stack.push(time); }",
            explanation: "If this car would arrive later than the most recently formed fleet ahead of it, it can never catch up — it becomes a new fleet leader.",
          },
          { code: "// otherwise ... it merges instead of forming a new fleet", explanation: "If its solo time is at or before that, it's guaranteed to catch up and join that fleet instead." },
          { code: "return stack.length;", explanation: "Each entry left on the stack represents one distinct fleet that formed." },
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
You're given the heights of a row of bars in a histogram, where each bar
has width 1 and they all stand right next to each other with no gaps.
Find the area of the single largest rectangle that can be drawn using
only the space inside this histogram's outline.
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
      "For any one bar, if you assume it's the *shortest* bar used in the rectangle, how far left and how far right could that rectangle stretch before hitting something even shorter?",
      "Checking, for every bar, how far it can stretch in both directions works, but it means a lot of re-scanning — could you track 'bars that haven't found their right boundary yet' as you go instead?",
      "Keep a stack of bar indexes with increasing heights (bottom to top). When you hit a bar shorter than the one on top of the stack, that top bar has just found its right boundary — pop it and compute the rectangle it could form.",
    ],
    approachOverview: `
For any bar, treating it as the shortest bar in some rectangle, that
rectangle can stretch left and right until it hits a bar that's shorter.
A direct approach checks this by expanding outward from every single bar
until it hits something shorter on each side — correct, but slow, since
it re-scans a lot of the same ground repeatedly.

A better approach keeps a stack of bar indexes with strictly increasing
heights as you scan left to right. Whenever the current bar is shorter
than the bar on top of the stack, that means the bar on top has just
found its right boundary (the current position), and whatever is now
below it on the stack — the next bar down — is its left boundary. Pop it,
compute the rectangle it forms, and repeat until the stack's top is
shorter than (or equal to) the current bar, then push the current bar's
index. Adding one final "zero-height" bar at the very end forces
anything left on the stack to be resolved too.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Expand Outward From Every Bar",
        explanation:
          "For each bar, treat it as the shortest bar in the rectangle, and expand left and right as far as possible while every bar in that range is at least as tall.",
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
          "Scan left to right, keeping a stack of bar indexes with strictly increasing heights. When the current bar is shorter than the bar on top of the stack, that top bar's rectangle is now fully determined — pop it and compute its area, using the current index as the right boundary and the new stack top as the left boundary.",
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
          { code: "const currentHeight = i === n ? 0 : heights[i];", explanation: "A fake zero-height bar past the end forces every remaining bar on the stack to be resolved." },
          {
            code: "while (stack.length > 0 && heights[stack[stack.length - 1]] > currentHeight) {",
            explanation: "As long as the current bar is shorter than the one on top of the stack, that top bar's rectangle can't grow any further right.",
          },
          { code: "const height = heights[stack.pop()];", explanation: "Pops the bar whose rectangle just got fully determined." },
          {
            code: "const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;",
            explanation: "The rectangle spans from just after the new stack top (its left boundary) to just before the current index (its right boundary).",
          },
          { code: "stack.push(i);", explanation: "The current bar still needs to be resolved later, so it goes on the stack." },
        ],
      },
    ],
    relatedProblems: ["daily-temperatures", "car-fleet"],
    keywords: ["largest rectangle in histogram", "monotonic stack", "array"],
  },
];
