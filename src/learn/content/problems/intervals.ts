import type { Problem } from "../../types/problem";

export const intervalsProblems: Problem[] = [
  {
    id: "insert-interval",
    title: "Insert Interval",
    difficulty: "Medium",
    category: "intervals",
    description: `
You're given a list of intervals sorted by start time, where no two overlap
or touch. Insert one new interval in the right position.

If it overlaps any existing intervals, merge them all into one, so the list
stays sorted with no overlaps.
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
      "The list is already sorted, so don't re-sort. Think of three chunks: intervals before the new one, intervals that overlap it, and intervals after it.",
      "In the overlapping chunk, keep widening one running start/end pair instead of merging pairwise.",
      "An interval overlaps the new one if its start isn't past the new interval's current end.",
    ],
    approachOverview: `
The quick way: add the new interval, sort by start time, and merge
overlapping neighbors, as in Merge Intervals. It works, but it ignores that
the input was already sorted.

Since the list is sorted and non-overlapping, one left-to-right pass is
enough:

- Copy every interval that ends before the new one starts.
- Absorb every overlapping interval by widening the new interval to cover it.
- Copy everything left.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Sort and Merge",
        explanation: `
Treat it like Merge Intervals: add the new interval, sort by start time, then
walk through once, merging each interval into the last result whenever they
overlap.
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
The input is already sorted and non-overlapping, so skip sorting. Walk
through once:

- Copy every interval that ends before the new interval starts. It can't overlap.
- Absorb every interval whose start isn't past the new interval's current end, widening the new interval's start/end to cover it.
- Push the merged interval.
- Copy everything left. None of it can overlap.
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
            explanation: "Copies every interval that ends before the new one starts. No overlap is possible.",
          },
          {
            code: "while (i < n && intervals[i][0] <= end) { start = Math.min(...); end = Math.max(...); i++; }",
            explanation: "Absorbs every overlapping interval, widening the merged range to cover it.",
          },
          {
            code: "result.push([start, end]);",
            explanation: "Pushes the merged interval once no overlaps remain.",
          },
          {
            code: "while (i < n) { result.push(intervals[i]); i++; }",
            explanation: "Copies the rest. It all starts after the merged interval ends.",
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
You're given an unsorted list of intervals, each a *start* and *end* pair.
Some overlap: they share at least one point. Merge every group of overlapping
intervals into one interval that spans them all, and return the result.

Intervals that just touch (one ends where the other begins) count as
overlapping, since they share that point.
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
      "Comparing every pair works but is wasteful. Is there an order where overlaps only happen between neighbors?",
      "Sort by start time. Then each new interval can only merge with the last one you placed.",
      "Two sorted intervals overlap exactly when the next start is less than or equal to the current merged end.",
    ],
    approachOverview: `
The direct way: repeatedly find two overlapping intervals, merge them, and
start over, until nothing overlaps. It's correct but slow, because it keeps
re-checking pairs that will never overlap.

If you first **sort by start time**, an interval can only overlap the one
right before it. That makes it a single scan: keep a "current merged
interval." If the next interval starts inside it, stretch it to cover that
interval. Otherwise, close it and start a new one.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Repeated Pairwise Merging",
        explanation: `
Scan for any overlapping pair. Merge it into one interval, replacing the two
originals, and start scanning again from the top. Stop when a full pass finds
nothing to merge.
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
Sort by start, then walk left to right. If the next interval starts at or
before the last result's end, they overlap (or touch), so stretch the last
result's end to cover it. Otherwise it can't reach anything already merged,
so it starts a new entry.
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
            explanation: "After sorting by start, any overlap can only involve the most recently placed interval.",
          },
          {
            code: "if (current[0] <= last[1]) { last[1] = Math.max(last[1], current[1]); }",
            explanation: "The next interval starts inside (or at the edge of) the last one, so it stretches the last interval.",
          },
          {
            code: "else { result.push(current); }",
            explanation: "The next interval starts after everything merged so far, so it opens a new group.",
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
You're given a list of intervals, some overlapping. Return the fewest
intervals you must remove so the rest don't overlap.

Here, intervals that only touch (one ends where the other starts) do **not**
overlap. Both can stay.
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
      "Flip the question: what's the largest set of non-overlapping intervals you can keep? Remove the rest.",
      "Sort by *end time*. Then a greedy rule works: keep the interval that finishes earliest, because it leaves the most room for the rest.",
      "Once you keep an interval, any later one that starts before its end must go. It's the one causing the overlap.",
    ],
    approachOverview: `
One option is dynamic programming. Sort by start time, and for each interval
find the longest chain of non-overlapping intervals ending there, checking
every earlier interval that doesn't conflict. The answer is the total minus
the longest chain. It's correct but checks many pairs a better order would
skip.

The faster route is a classic greedy trick: **sort by end time**. Walk
through, tracking the end of the last interval you kept:

- If the next interval starts before that end, it overlaps, so remove it. Never remove the kept one: it ends earliest, so it's the safer one to keep.
- Otherwise, keep it and update the "last kept end" to its end.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — DP on Longest Non-overlapping Chain",
        explanation: `
Sort by start time. \`dp[i]\` is the longest chain of non-overlapping
intervals ending with interval i. To compute it, check every earlier interval
j that ends at or before i starts, since both can be kept.

The largest value in \`dp\` is the most you can keep, so remove the total
minus that maximum.
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
Sort by end time and walk left to right, tracking the end of the last kept
interval. Always keep the first one, since it ends earliest.

- If the next interval starts at or after the tracked end, keep it and update the end.
- If it starts before, it overlaps, so remove it. Leave the tracked end alone: the kept interval ends earlier and is the better anchor.
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
            explanation: "Sorting by end time puts the interval that frees up room soonest first.",
          },
          {
            code: "if (sorted[i][0] >= lastEnd) { keptCount++; lastEnd = sorted[i][1]; }",
            explanation: "The next interval starts after the last kept one ends, so keep it and move the tracked end.",
          },
          {
            code: "// else: overlap, leave lastEnd untouched",
            explanation: "The next interval overlaps, so it's removed. The kept end is still the best anchor.",
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
You're given one person's meeting times, each with a start and end. Return
whether they can attend every meeting, meaning no two meetings overlap.

Back-to-back meetings (one ends exactly when the next begins) don't count as
a conflict.
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
      "Comparing every pair of meetings works, but you can skip most of those comparisons.",
      "Sort by start time. Then a conflict can only appear between a meeting and the one right before it.",
      "Two sorted meetings conflict exactly when the next one starts before the previous one ends.",
    ],
    approachOverview: `
The direct approach compares every pair of meetings. If any pair overlaps,
the person can't attend everything.

Faster: sort **by start time** first. If there's any conflict at all, some
pair of neighbors in that order will conflict. So one pass comparing each
meeting to the one before it catches every conflict.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Compare Every Pair",
        explanation: `
Check every pair of meetings. Intervals [a, b] and [c, d] overlap (not just
touch) exactly when a < d and c < b. If any pair overlaps, return false.
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
Sort by start time, then check each meeting against the one before it. If a
meeting starts before the previous one ends, they conflict. If no neighbors
conflict, the whole schedule is fine.
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
            explanation: "After sorting by start time, any conflict shows up between adjacent meetings.",
          },
          {
            code: "if (sorted[i][0] < sorted[i - 1][1]) return false;",
            explanation: "The next meeting starts before the previous one ends, so not every meeting can be attended.",
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
You're given a list of meeting times, and you're booking rooms for all of
them. Overlapping meetings need separate rooms.

Return the minimum number of rooms so every meeting can happen, with no two
overlapping meetings in the same room.
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
      "At the busiest moment, how many meetings run at once? That's how many rooms you need.",
      "You could count active meetings at every start time and take the maximum, but that rescans the whole list each time.",
      "Think in events, not meetings: sort start times and end times separately, then sweep. Each start needs a room; each end frees one.",
    ],
    approachOverview: `
The direct way: at each meeting's start time t, count the meetings in
progress (start <= t < end). The largest count is the minimum number of
rooms.

Faster: put all **start times** and all **end times** in two sorted lists
and sweep them like a timeline. Before admitting each new meeting, check
whether an earlier meeting has already ended:

- If so, reuse its room.
- If not, open a new room.

Track the rooms in use and their peak. The peak is the answer, found in one
pass over the sorted events.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Count Active Meetings at Each Start Time",
        explanation: `
At each meeting's start time, count the meetings in progress (start at or
before it, end after it). The largest count is the busiest moment, and the
number of rooms needed.
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
Sort the start times and end times into two arrays, and walk each with its
own pointer. At each step, compare the current start with the earliest
remaining end:

- Start is before that end: a new room is needed (rooms in use + 1).
- Start is at or after that end: a meeting has finished, so its room is freed (rooms in use - 1, move to the next end).

The highest "rooms in use" seen is the answer.
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
            explanation: "Sorted starts and ends form a timeline of 'room needed' and 'room freed' events.",
          },
          {
            code: "if (starts[startPtr] < ends[endPtr]) { roomsInUse++; startPtr++; }",
            explanation: "A meeting starts before the earliest ongoing one ends, so it needs a new room.",
          },
          {
            code: "else { roomsInUse--; endPtr++; }",
            explanation: "An earlier meeting has ended, so its room is freed for reuse.",
          },
          {
            code: "maxRooms = Math.max(maxRooms, roomsInUse);",
            explanation: "Tracks the busiest moment. That peak is the minimum number of rooms.",
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
You're given intervals, each covering the integers from start to end
(inclusive), and a list of query points.

For each query, return the **size** of the smallest interval that contains
it. Size is end - start + 1, the number of integers covered. If no interval
contains the query, its answer is -1.
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
      "Checking every interval against every query works, but with up to 10^5 of each, it's too slow.",
      "Answer queries in sorted order. As the query value grows, intervals with a small enough start become relevant, and you only add them, never re-check from scratch.",
      "Keep 'available' intervals (started, maybe not ended) in a min-heap keyed by size, so the smallest is instant. Discard any whose end is before the current query.",
    ],
    approachOverview: `
The straightforward approach scans every interval for every query and keeps
the smallest one that contains it. It works, but repeats a full scan per
query.

Faster: process queries in **sorted order** (remembering their original
positions for the answers), with intervals sorted by start. For each query:

- Push every interval whose start is at or before the query into a **min-heap ordered by size**.
- Pop any interval whose end is before the query. It has expired and can't help this or any later query.
- The top of the heap is the smallest interval containing the query.
    `.trim(),
    solutions: [
      {
        approach: "Brute Force — Check Every Interval per Query",
        explanation: `
For each query, scan every interval and keep the smallest size among those
containing the query. If none contain it, the answer is -1.
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
Sort intervals by start, and sort queries by value, keeping each query's
original index so answers go back in the right slots.

For each sorted query:

- Push every interval whose start is at or before it into a min-heap keyed by size. Store the end too, so expired entries can be spotted. Tie order doesn't matter.
- Pop any top interval whose end is before the query. It can't help this or any larger query.
- The top of the heap, if any, is the smallest interval covering the query.
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
            explanation: "Answers queries in increasing order, keeping the original index so answers land in the right place.",
          },
          {
            code: "while (i < sortedIntervals.length && sortedIntervals[i][0] <= q) { heapPush([r - l + 1, r]); i++; }",
            explanation: "Every interval that has started by this query enters the min-heap, keyed by size.",
          },
          {
            code: "while (heap.length > 0 && heap[0][1] < q) { heapPop(); }",
            explanation: "Discards expired intervals that end before this query. They can't help any larger query either.",
          },
          {
            code: "if (heap.length > 0) { answer[originalIndex] = heap[0][0]; }",
            explanation: "The top of the heap is the smallest interval containing this query.",
          },
        ],
      },
    ],
    relatedProblems: ["meeting-rooms-ii"],
    keywords: ["min heap", "offline queries", "sweep line", "sort by start"],
  },
];
