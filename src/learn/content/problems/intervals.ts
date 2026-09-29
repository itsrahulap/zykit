import type { Problem } from "../../types/problem";

export const intervalsProblems: Problem[] = [
  {
    id: "insert-interval",
    title: "Insert Interval",
    difficulty: "Medium",
    category: "intervals",
    description: `
You're given a list of intervals that's already sorted by start time, and no
two of them overlap or touch. Someone now hands you one more interval to add
to the list.

Add it in the correct position. If the new interval overlaps with one or more
existing intervals, merge all of them into a single combined interval so the
final list is still sorted and still has no overlaps.
    `.trim(),
    examples: [
      {
        input: "intervals = [[1,3],[6,9]], newInterval = [2,5]",
        output: "[[1,5],[6,9]]",
        explanation: "[2,5] overlaps [1,3], so they merge into [1,5]. [6,9] is untouched.",
      },
      {
        input: "intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]",
        output: "[[1,2],[3,10],[12,16]]",
        explanation: "[4,8] overlaps [3,5], [6,7], and [8,10], so all four intervals merge into [3,10].",
      },
      {
        input: "intervals = [], newInterval = [5,7]",
        output: "[[5,7]]",
        explanation: "With no existing intervals, the new one is simply inserted on its own.",
      },
    ],
    constraints: [
      "0 <= intervals.length <= 10^4",
      "intervals is sorted by start time and has no overlaps",
      "0 <= start <= end <= 10^5",
    ],
    hints: [
      "The list is already sorted, so you never need to re-sort the whole thing — think of the result as three chunks: intervals entirely before the new one, intervals that overlap it, and intervals entirely after it.",
      "While you're inside the 'overlapping' chunk, keep expanding a running start/end pair instead of merging pairwise.",
      "An interval overlaps the new one as long as its start is not past the new interval's current end.",
    ],
    approachOverview: `
A quick way to solve this is to just add the new interval to the pile, sort
everything by start time, and then merge overlapping neighbors — the same
technique you'd use for a generic "merge all overlapping intervals" problem.
It works, but it throws away the fact that the input was already sorted.

Since the list is already ordered and non-overlapping, you can do it in a
single left-to-right pass: copy over every interval that ends before the new
interval begins (they can't possibly overlap it), then absorb every interval
that does overlap by growing the new interval's start and end to cover them,
and finally copy over everything that's left.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Sort and Merge",
        explanation: `
Treat this exactly like the general "merge overlapping intervals" problem:
drop the new interval into the list, sort everything by start time, then walk
through once, merging any interval into the last one in your result whenever
they overlap.
        `.trim(),
        code: `function insert(intervals, newInterval) {
  const merged = [...intervals, newInterval];
  merged.sort((a, b) => a[0] - b[0]);

  const result = [];
  for (const interval of merged) {
    const last = result[result.length - 1];
    if (!last || last[1] < interval[0]) {
      result.push(interval);
    } else {
      last[1] = Math.max(last[1], interval[1]);
    }
  }
  return result;
}`,
        timeComplexity: "O(n log n) — dominated by the sort",
        spaceComplexity: "O(n) for the merged array and result",
      },
      {
        approach: "Optimal — Single Pass (Before / Overlap / After)",
        explanation: `
Because the input is already sorted and non-overlapping, you can skip sorting
entirely. Walk through the intervals once:

- First, copy across any interval that ends before the new interval even
  starts — it can't overlap, so it goes straight into the answer.
- Next, for every interval whose start is not past the new interval's current
  end, absorb it: shrink or grow the new interval's start/end to cover it.
  Keep doing this as long as intervals keep overlapping.
- Once that stops, push the now-fully-merged new interval into the answer.
- Finally, copy across everything that's left — none of it can overlap the
  new interval anymore.
        `.trim(),
        code: `function insert(intervals, newInterval) {
  const result = [];
  const n = intervals.length;
  let i = 0;
  let [start, end] = newInterval;

  while (i < n && intervals[i][1] < start) {
    result.push(intervals[i]);
    i++;
  }

  while (i < n && intervals[i][0] <= end) {
    start = Math.min(start, intervals[i][0]);
    end = Math.max(end, intervals[i][1]);
    i++;
  }
  result.push([start, end]);

  while (i < n) {
    result.push(intervals[i]);
    i++;
  }

  return result;
}`,
        timeComplexity: "O(n) — one linear pass, no sorting needed",
        spaceComplexity: "O(n) for the result",
        walkthrough: [
          {
            code: "while (i < n && intervals[i][1] < start) { result.push(intervals[i]); i++; }",
            explanation: "Copies over every interval that ends before the new interval starts — untouched, no overlap possible.",
          },
          {
            code: "while (i < n && intervals[i][0] <= end) { start = Math.min(...); end = Math.max(...); i++; }",
            explanation: "Absorbs every interval whose start falls within reach, growing the merged range to cover all of them.",
          },
          {
            code: "result.push([start, end]);",
            explanation: "Pushes the fully-merged interval once no more overlaps remain.",
          },
          {
            code: "while (i < n) { result.push(intervals[i]); i++; }",
            explanation: "Copies over whatever is left — all of it starts after the merged interval ends.",
          },
        ],
      },
    ],
    relatedProblems: ["merge-intervals", "non-overlapping-intervals"],
    keywords: ["insert interval", "merge intervals", "sorted intervals", "sweep"],
  },

  {
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "Medium",
    category: "intervals",
    description: `
You're given a list of intervals, in no particular order, where each interval
is a *start* and *end* pair. Some of them overlap — meaning they share at
least one point in time. Combine every group of overlapping intervals into a
single interval that spans all of them, and return the resulting list.

Two intervals that merely touch (one ends exactly where the other begins) are
treated as overlapping here, since that shared point belongs to both.
    `.trim(),
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "[1,3] and [2,6] share the range 2-3, so they merge into [1,6]. The other two don't touch anything.",
      },
      {
        input: "intervals = [[1,4],[4,5]]",
        output: "[[1,5]]",
        explanation: "[1,4] and [4,5] touch at the point 4, so they merge into [1,5].",
      },
      {
        input: "intervals = [[1,4],[2,3]]",
        output: "[[1,4]]",
        explanation: "[2,3] is completely contained inside [1,4], so it disappears into it.",
      },
    ],
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= start <= end <= 10^4",
    ],
    hints: [
      "Comparing every interval against every other interval to look for overlaps works, but it's wasteful — is there an order that guarantees overlaps only ever happen between neighbors?",
      "If you sort by start time, once you place an interval into your answer, the only interval it could still merge with is the very last one you placed.",
      "Two sorted intervals overlap exactly when the next one's start is less than or equal to the current merged interval's end.",
    ],
    approachOverview: `
A direct way to solve this is to repeatedly scan the list for any two
intervals that overlap and merge them, starting over each time you find a
merge, until nothing overlaps anymore. It's correct, but slow, because you
keep re-checking pairs that were never going to overlap in the first place.

The key realization is that if you first **sort the intervals by start
time**, an overlap can only ever happen between an interval and the one right
before it in that sorted order — nothing further back needs to be
reconsidered. That turns the problem into a single scan: keep a "current
merged interval," and every time the next interval's start creeps back into
it, stretch it to cover that interval too; otherwise, close it out and start
a new one.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Repeated Pairwise Merging",
        explanation: `
Keep scanning the list for any pair of intervals that overlap. Whenever you
find one, merge it into a single interval, remove the two originals, and
start scanning again from the top. Stop once a full pass finds nothing left
to merge.
        `.trim(),
        code: `function merge(intervals) {
  const result = intervals.map((iv) => [...iv]);
  let mergedSomething = true;

  while (mergedSomething) {
    mergedSomething = false;
    for (let i = 0; i < result.length && !mergedSomething; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const overlaps = result[i][0] <= result[j][1] && result[j][0] <= result[i][1];
        if (overlaps) {
          result[i][0] = Math.min(result[i][0], result[j][0]);
          result[i][1] = Math.max(result[i][1], result[j][1]);
          result.splice(j, 1);
          mergedSomething = true;
          break;
        }
      }
    }
  }

  return result;
}`,
        timeComplexity: "O(n^3) in the worst case — each of up to n merge passes rescans all O(n^2) pairs",
        spaceComplexity: "O(n) for the working copy",
      },
      {
        approach: "Optimal — Sort by Start, Then Scan",
        explanation: `
Sort the intervals by their start value. Now walk through them left to right,
keeping the last interval you've added to the answer. If the next interval's
start is at or before that last interval's end, they overlap (or touch), so
stretch the last interval's end to cover it. Otherwise, the next interval
can't reach back to anything already merged, so it starts a fresh entry in
the answer.
        `.trim(),
        code: `function merge(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const result = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = result[result.length - 1];
    const current = sorted[i];

    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      result.push(current);
    }
  }

  return result;
}`,
        timeComplexity: "O(n log n) — dominated by the sort, the scan itself is O(n)",
        spaceComplexity: "O(n) for the sorted copy and result",
        walkthrough: [
          {
            code: "const sorted = [...intervals].sort((a, b) => a[0] - b[0]);",
            explanation: "Sorting by start guarantees any overlap can only involve the most recently placed interval.",
          },
          {
            code: "if (current[0] <= last[1]) { last[1] = Math.max(last[1], current[1]); }",
            explanation: "The next interval starts inside (or right at the edge of) the last one, so it stretches the last interval instead of becoming a new one.",
          },
          {
            code: "else { result.push(current); }",
            explanation: "The next interval starts after everything merged so far ends, so it opens a brand-new group.",
          },
        ],
      },
    ],
    relatedProblems: ["insert-interval", "non-overlapping-intervals"],
    keywords: ["merge intervals", "sort by start", "overlap", "sweep line"],
  },

  {
    id: "non-overlapping-intervals",
    title: "Non-overlapping Intervals",
    difficulty: "Medium",
    category: "intervals",
    description: `
You're given a list of intervals, and some of them overlap with each other.
Find the smallest number of intervals you'd need to remove so that none of
the remaining intervals overlap.

Here, two intervals that only touch at a single point (one ends exactly where
the other starts) are **not** considered overlapping — they can both stay.
    `.trim(),
    examples: [
      {
        input: "intervals = [[1,2],[2,3],[3,4],[1,3]]",
        output: "1",
        explanation: "Removing [1,3] leaves [[1,2],[2,3],[3,4]], which only touch at shared endpoints, so nothing overlaps.",
      },
      {
        input: "intervals = [[1,2],[1,2],[1,2]]",
        output: "2",
        explanation: "All three intervals are identical and fully overlap, so two of the three must go, keeping just one.",
      },
      {
        input: "intervals = [[1,2],[2,3]]",
        output: "0",
        explanation: "These only touch at the point 2, which doesn't count as overlapping, so nothing needs to be removed.",
      },
    ],
    constraints: [
      "1 <= intervals.length <= 10^5",
      "intervals[i].length == 2",
      "-5 * 10^4 <= start < end <= 5 * 10^4",
    ],
    hints: [
      "This is really the same as asking: what is the largest group of intervals you can keep with none overlapping? Whatever's left over is what you remove.",
      "If you sort by *end time* instead of start time, a simple greedy rule works: always keep the interval that finishes earliest, because it leaves the most room for everything after it.",
      "Once you've kept an interval, any later interval that starts before that interval's end has to be thrown away — it's the one causing the overlap.",
    ],
    approachOverview: `
One way to attack this is with dynamic programming: sort by start time, and
for each interval work out the longest chain of non-overlapping intervals
that could end there, by checking every earlier interval that doesn't
conflict with it. The answer is then the total count minus the longest such
chain. It's correct, but it's checking a lot of pairs that a smarter order
would let you skip.

The faster route is a classic greedy trick: **sort by end time**. Then walk
through the intervals keeping track of the end time of the last interval you
decided to keep. Whenever the next interval starts before that end time, it
overlaps, so it's the one you remove (never the one you already kept — it
had the earliest possible end, so it's always the safer one to hang onto).
Every time you don't need to remove one, update your "last kept end" to the
new interval's end.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — DP on Longest Non-overlapping Chain",
        explanation: `
Sort intervals by start time. For each interval i, look at every earlier
interval j that ends at or before interval i starts — those two could both
be kept together. \`dp[i]\` stores the length of the longest chain of
mutually non-overlapping intervals that ends with interval i. The largest
value in \`dp\` is the most intervals you can keep overall, so the number to
remove is the total count minus that maximum.
        `.trim(),
        code: `function eraseOverlapIntervals(intervals) {
  const n = intervals.length;
  if (n === 0) return 0;

  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const dp = new Array(n).fill(1);
  let maxKept = 1;

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (sorted[j][1] <= sorted[i][0]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    maxKept = Math.max(maxKept, dp[i]);
  }

  return n - maxKept;
}`,
        timeComplexity: "O(n^2) — for each interval, scan every earlier interval",
        spaceComplexity: "O(n) for the dp array",
      },
      {
        approach: "Optimal — Greedy, Sort by End Time",
        explanation: `
Sort the intervals by their end time. Walk through them left to right,
tracking the end time of the last interval you've decided to keep (start with
the first interval always kept, since it has the earliest possible end).

For each next interval, if its start is at or after that tracked end time, it
doesn't overlap what you've kept — keep it too, and update the tracked end.
If its start is before that end time, it overlaps, so it must be removed;
count it, but leave the tracked end alone, since the interval you already
kept still ends earlier and stays the better anchor.
        `.trim(),
        code: `function eraseOverlapIntervals(intervals) {
  if (intervals.length === 0) return 0;

  const sorted = [...intervals].sort((a, b) => a[1] - b[1]);
  let lastEnd = sorted[0][1];
  let keptCount = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i][0] >= lastEnd) {
      keptCount++;
      lastEnd = sorted[i][1];
    }
  }

  return sorted.length - keptCount;
}`,
        timeComplexity: "O(n log n) — dominated by the sort",
        spaceComplexity: "O(n) for the sorted copy",
        walkthrough: [
          {
            code: "const sorted = [...intervals].sort((a, b) => a[1] - b[1]);",
            explanation: "Sorting by end time means the interval that frees up room soonest always comes first.",
          },
          {
            code: "if (sorted[i][0] >= lastEnd) { keptCount++; lastEnd = sorted[i][1]; }",
            explanation: "The next interval starts after the last kept one ends, so it's safe to keep — extend the tracked end.",
          },
          {
            code: "// else: overlap, leave lastEnd untouched",
            explanation: "The next interval overlaps what's already kept, so it's the one that must be removed; the previously kept end is still the best anchor.",
          },
        ],
      },
    ],
    relatedProblems: ["merge-intervals", "meeting-rooms"],
    keywords: ["greedy", "sort by end time", "activity selection", "interval scheduling"],
  },

  {
    id: "meeting-rooms",
    title: "Meeting Rooms",
    difficulty: "Easy",
    category: "intervals",
    description: `
You're given a list of meeting time intervals for one person's calendar,
each with a start and end time. Determine whether this person could
realistically attend every single meeting — that is, whether any two
meetings overlap.

Meetings that just touch (one ends exactly when the next begins) are fine —
back-to-back meetings don't count as a conflict.
    `.trim(),
    examples: [
      {
        input: "intervals = [[0,30],[5,10],[15,20]]",
        output: "false",
        explanation: "The meeting [0,30] overlaps both [5,10] and [15,20], so this person can't attend all of them.",
      },
      {
        input: "intervals = [[7,10],[2,4]]",
        output: "true",
        explanation: "[2,4] finishes before [7,10] starts, so there's no conflict.",
      },
      {
        input: "intervals = [[1,5],[5,8]]",
        output: "true",
        explanation: "These meetings touch at time 5 but don't overlap, so back-to-back is fine.",
      },
    ],
    constraints: [
      "0 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= start < end <= 10^6",
    ],
    hints: [
      "Comparing every meeting against every other meeting for a conflict will work, but you can avoid most of those comparisons.",
      "If you sort the meetings by start time, a conflict can only ever appear between a meeting and the one immediately before it.",
      "Two sorted meetings conflict exactly when the next one starts before the previous one ends.",
    ],
    approachOverview: `
The direct approach is to compare every pair of meetings and check if they
overlap in time — if any pair does, the person can't attend everything.

A faster approach sorts the meetings **by start time** first. Once sorted, if
any two meetings are going to conflict, they must be neighbors in that sorted
order — a meeting can't skip over another one to conflict with something
further away. So a single pass comparing each meeting to the one right before
it is enough to catch every possible conflict.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Compare Every Pair",
        explanation: `
For every pair of meetings, check whether they overlap. Two intervals
[a, b] and [c, d] overlap (not just touch) exactly when a < d and c < b. If
any pair overlaps, the person can't make every meeting.
        `.trim(),
        code: `function canAttendMeetings(intervals) {
  for (let i = 0; i < intervals.length; i++) {
    for (let j = i + 1; j < intervals.length; j++) {
      const overlaps = intervals[i][0] < intervals[j][1] && intervals[j][0] < intervals[i][1];
      if (overlaps) {
        return false;
      }
    }
  }
  return true;
}`,
        timeComplexity: "O(n^2) — every pair of meetings is checked",
        spaceComplexity: "O(1) extra space",
      },
      {
        approach: "Optimal — Sort by Start, Check Neighbors",
        explanation: `
Sort the meetings by start time. Then check each meeting against the one
right before it — if the current meeting starts before the previous one
ends, they conflict, so the person can't attend both. If every neighboring
pair is conflict-free, the whole schedule is conflict-free.
        `.trim(),
        code: `function canAttendMeetings(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i][0] < sorted[i - 1][1]) {
      return false;
    }
  }

  return true;
}`,
        timeComplexity: "O(n log n) — dominated by the sort",
        spaceComplexity: "O(n) for the sorted copy",
        walkthrough: [
          {
            code: "const sorted = [...intervals].sort((a, b) => a[0] - b[0]);",
            explanation: "Sorting by start time means any conflict must show up between adjacent meetings.",
          },
          {
            code: "if (sorted[i][0] < sorted[i - 1][1]) return false;",
            explanation: "If the next meeting starts before the previous one finishes, the schedule is impossible to attend in full.",
          },
        ],
      },
    ],
    relatedProblems: ["meeting-rooms-ii", "non-overlapping-intervals"],
    keywords: ["meeting rooms", "sort by start", "overlap check", "calendar conflict"],
  },

  {
    id: "meeting-rooms-ii",
    title: "Meeting Rooms II",
    difficulty: "Medium",
    category: "intervals",
    description: `
You're given a list of meeting time intervals. This time, instead of one
person's calendar, imagine you're scheduling rooms for all these meetings at
once. Some of them overlap in time and would need separate rooms running
simultaneously.

Find the minimum number of rooms needed so that every meeting can happen,
with no two overlapping meetings sharing the same room.
    `.trim(),
    examples: [
      {
        input: "intervals = [[0,30],[5,10],[15,20]]",
        output: "2",
        explanation: "[0,30] overlaps both [5,10] and [15,20], but [5,10] and [15,20] don't overlap each other, so 2 rooms are enough.",
      },
      {
        input: "intervals = [[7,10],[2,4]]",
        output: "1",
        explanation: "These meetings never overlap, so they can share a single room.",
      },
      {
        input: "intervals = [[1,5],[8,9],[8,9]]",
        output: "2",
        explanation: "The two [8,9] meetings happen at the exact same time, so they each need their own room.",
      },
    ],
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= start < end <= 10^6",
    ],
    hints: [
      "The answer is really: at the single busiest moment in time, how many meetings are happening at once? That's how many rooms you need.",
      "You can check 'how many meetings are active' at every meeting's start time and take the maximum — but that means rescanning the whole list each time.",
      "Instead of thinking meeting by meeting, think event by event: sort all the start times and all the end times separately, then sweep through — every start needs a room, every end frees one up.",
    ],
    approachOverview: `
A direct way to find the busiest moment is: for every meeting's start time,
count how many meetings are actually in progress right then (start <= t <
end), and keep the largest count you see across all of them. That's the
minimum number of rooms.

The faster approach separates all the **start times** and all the **end
times** into two sorted lists, and sweeps through them like a timeline of
events. Walk the start times in order; each time you're about to admit a
new meeting, first check whether an earlier meeting has already ended by
then — if so, that room is free and can be reused, so no new room is
needed. Otherwise, you need to open a new room. Tracking the running count
of rooms in use (and its peak) as you sweep gives you the answer in one pass
over the sorted events.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Count Active Meetings at Each Start Time",
        explanation: `
For every meeting's start time, scan the whole list and count how many
meetings are actually in progress at that moment (their start is at or
before it, and their end is after it). The largest count found across all
start times is the number of rooms needed, since that's the busiest instant.
        `.trim(),
        code: `function minMeetingRooms(intervals) {
  let maxRooms = 0;

  for (let i = 0; i < intervals.length; i++) {
    const t = intervals[i][0];
    let count = 0;
    for (let j = 0; j < intervals.length; j++) {
      if (intervals[j][0] <= t && t < intervals[j][1]) {
        count++;
      }
    }
    maxRooms = Math.max(maxRooms, count);
  }

  return maxRooms;
}`,
        timeComplexity: "O(n^2) — for every meeting, rescan all meetings",
        spaceComplexity: "O(1) extra space",
      },
      {
        approach: "Optimal — Sweep Sorted Starts and Ends",
        explanation: `
Split the meetings into two separate sorted arrays: all the start times and
all the end times. Now walk through the start times in order with one
pointer, and the end times in order with another pointer.

At each step, compare the current start against the earliest end still
outstanding. If the start comes before that end, a brand-new room is needed
right now (increment rooms in use). If the start is at or after that end,
some earlier meeting has already finished, so that room can be reused
instead (decrement rooms in use, and move to the next end). Track the
highest "rooms in use" value seen — that peak is the answer.
        `.trim(),
        code: `function minMeetingRooms(intervals) {
  const n = intervals.length;
  if (n === 0) return 0;

  const starts = intervals.map((iv) => iv[0]).sort((a, b) => a - b);
  const ends = intervals.map((iv) => iv[1]).sort((a, b) => a - b);

  let roomsInUse = 0;
  let maxRooms = 0;
  let startPtr = 0;
  let endPtr = 0;

  while (startPtr < n) {
    if (starts[startPtr] < ends[endPtr]) {
      roomsInUse++;
      startPtr++;
    } else {
      roomsInUse--;
      endPtr++;
    }
    maxRooms = Math.max(maxRooms, roomsInUse);
  }

  return maxRooms;
}`,
        timeComplexity: "O(n log n) — dominated by sorting the starts and ends",
        spaceComplexity: "O(n) for the two sorted arrays",
        walkthrough: [
          {
            code: "const starts = ...sort(...); const ends = ...sort(...);",
            explanation: "Separating and sorting starts and ends turns the schedule into a clean timeline of 'room needed' and 'room freed' events.",
          },
          {
            code: "if (starts[startPtr] < ends[endPtr]) { roomsInUse++; startPtr++; }",
            explanation: "A new meeting begins before the earliest ongoing one finishes, so a new room is required right now.",
          },
          {
            code: "else { roomsInUse--; endPtr++; }",
            explanation: "An earlier meeting has already ended by this point, so its room is free to be reused instead of opening a new one.",
          },
          {
            code: "maxRooms = Math.max(maxRooms, roomsInUse);",
            explanation: "Tracks the busiest moment across the whole sweep — that peak is the minimum number of rooms required.",
          },
        ],
      },
    ],
    relatedProblems: ["meeting-rooms", "minimum-interval-to-include-each-query"],
    keywords: ["meeting rooms", "sweep line", "two pointers", "min heap", "resource scheduling"],
  },

  {
    id: "minimum-interval-to-include-each-query",
    title: "Minimum Interval to Include Each Query",
    difficulty: "Hard",
    category: "intervals",
    description: `
You're given a list of intervals, where each interval covers a range of
integers from its start to its end (inclusive), and a list of query points.

For each query, look at every interval that contains that point, and find the
**size** of the smallest one among them (size meaning end - start + 1, i.e.
how many integers it covers). If no interval contains the query point at all,
the answer for that query is -1.
    `.trim(),
    examples: [
      {
        input: "intervals = [[1,4],[2,4],[3,6],[4,4]], queries = [2,3,4,5]",
        output: "[3,3,1,4]",
        explanation: "For query 4, intervals [1,4] (size 4), [2,4] (size 3), [3,6] (size 4), and [4,4] (size 1) all contain it — the smallest is [4,4], size 1.",
      },
      {
        input: "intervals = [[2,3],[2,5],[1,8],[20,25]], queries = [2,19,5,22]",
        output: "[2,-1,4,6]",
        explanation: "No interval contains 19, so that answer is -1. Query 22 is only inside [20,25], size 6.",
      },
    ],
    constraints: [
      "1 <= intervals.length <= 10^5",
      "1 <= queries.length <= 10^5",
      "intervals[i].length == 2",
      "1 <= start <= end <= 10^7",
      "1 <= query <= 10^7",
    ],
    hints: [
      "Checking every interval against every query directly works, but with up to 10^5 of each, that's too slow.",
      "Try answering the queries in sorted order instead of the order they were given — as the query value grows, only intervals with a small enough start ever need to be considered, and you only ever add them, never remove and re-check from scratch.",
      "Keep the currently 'available' intervals (ones that have started but might not have ended yet) in a structure that can hand you the smallest one instantly — a min-heap keyed by size, discarding any interval whose end has already passed the current query.",
    ],
    approachOverview: `
The straightforward approach checks, for every single query, every interval
to see if it contains that point and keeps the smallest one that does. That
works but redoes a full scan for every query.

The faster approach processes queries in **sorted order** (remembering their
original positions so the answers can be placed back correctly) alongside
intervals sorted by start time. As the query value increases, sweep forward
through the intervals: any interval whose start is at or before the current
query becomes "available" and goes into a **min-heap ordered by size**.
Before answering each query, pop off any available interval whose end is
already behind the current query — it's expired and can never help this or
any later query. Whatever remains at the top of the heap is the smallest
interval currently containing the query — exactly the answer needed.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Interval per Query",
        explanation: `
For each query, scan every interval. If the interval contains the query
point, compute its size and keep track of the smallest one seen. If nothing
contains the query, its answer is -1.
        `.trim(),
        code: `function minInterval(intervals, queries) {
  const result = [];

  for (const q of queries) {
    let best = -1;
    for (const [l, r] of intervals) {
      if (l <= q && q <= r) {
        const size = r - l + 1;
        if (best === -1 || size < best) {
          best = size;
        }
      }
    }
    result.push(best);
  }

  return result;
}`,
        timeComplexity: "O(n * q) — every query scans every interval",
        spaceComplexity: "O(1) extra space, besides the output array",
      },
      {
        approach: "Optimal — Sort + Min-Heap Sweep",
        explanation: `
Sort the intervals by start time, and sort the queries by value while
remembering each query's original index (so the final answers can be placed
back in the right slots).

Sweep through the sorted queries. For each one: first, push every interval
whose start is at or before this query into a min-heap keyed by interval
size (breaking ties doesn't matter, but the end is stored too so expired
entries can be recognized). Then, pop off any interval at the top of the
heap whose end has already fallen behind the current query — it's no longer
relevant to this or any future (larger) query. Whatever's left on top of the
heap, if anything, is the smallest interval still covering this query.
        `.trim(),
        code: `function minInterval(intervals, queries) {
  const sortedIntervals = [...intervals].sort((a, b) => a[0] - b[0]);
  const sortedQueries = queries
    .map((q, index) => [q, index])
    .sort((a, b) => a[0] - b[0]);

  const answer = new Array(queries.length).fill(-1);
  const heap = []; // entries: [size, end]
  let i = 0;

  const heapPush = (item) => {
    heap.push(item);
    let idx = heap.length - 1;
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (heap[parent][0] <= heap[idx][0]) break;
      [heap[parent], heap[idx]] = [heap[idx], heap[parent]];
      idx = parent;
    }
  };

  const heapPop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let idx = 0;
      while (true) {
        const left = idx * 2 + 1;
        const right = idx * 2 + 2;
        let smallest = idx;
        if (left < heap.length && heap[left][0] < heap[smallest][0]) smallest = left;
        if (right < heap.length && heap[right][0] < heap[smallest][0]) smallest = right;
        if (smallest === idx) break;
        [heap[smallest], heap[idx]] = [heap[idx], heap[smallest]];
        idx = smallest;
      }
    }
    return top;
  };

  for (const [q, originalIndex] of sortedQueries) {
    while (i < sortedIntervals.length && sortedIntervals[i][0] <= q) {
      const [l, r] = sortedIntervals[i];
      heapPush([r - l + 1, r]);
      i++;
    }

    while (heap.length > 0 && heap[0][1] < q) {
      heapPop();
    }

    if (heap.length > 0) {
      answer[originalIndex] = heap[0][0];
    }
  }

  return answer;
}`,
        timeComplexity: "O((n + q) log n) — sorting plus heap operations for each interval and query",
        spaceComplexity: "O(n + q) for the heap, sorted queries, and answer array",
        walkthrough: [
          {
            code: "const sortedQueries = queries.map((q, index) => [q, index]).sort(...);",
            explanation: "Queries are answered in increasing order, but the original index is kept so answers land back in the right place.",
          },
          {
            code: "while (i < sortedIntervals.length && sortedIntervals[i][0] <= q) { heapPush([r - l + 1, r]); i++; }",
            explanation: "Every interval that has 'started' by the current query value becomes available and enters the min-heap, keyed by its size.",
          },
          {
            code: "while (heap.length > 0 && heap[0][1] < q) { heapPop(); }",
            explanation: "Any available interval whose end is already behind the current query has expired and is discarded — it can't help this or any larger query.",
          },
          {
            code: "if (heap.length > 0) { answer[originalIndex] = heap[0][0]; }",
            explanation: "Whatever remains on top of the heap is the smallest interval that still contains this query point.",
          },
        ],
      },
    ],
    relatedProblems: ["meeting-rooms-ii"],
    keywords: ["min heap", "offline queries", "sweep line", "sort by start"],
  },
];
