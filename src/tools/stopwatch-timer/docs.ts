import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'On **Stopwatch**, press **Start**, then **Lap** to record laps and **Stop** to pause. **Resume** carries on where you stopped, and **Reset** clears everything.',
    'On **Timer**, set hours, minutes and seconds (or pick a preset) and press **Start timer**. Start more than one to run several timers side by side.',
    'On **Pomodoro**, set the focus, short-break and long-break lengths and how many focus sessions come before a long break, then press **Start**. Turn on **Start the next session automatically** to roll from one session into the next.',
    'Under Timer and Pomodoro, choose how to be told when time is up: a beep, a browser notification, or both. The text bar at the top always announces it too.',
    'Keyboard: **Space** starts or stops, **L** records a lap, **R** resets. They are ignored while you are typing in a field.',
  ],
  howItWorks:
    'Every clock stores timestamps from `performance.now()`, the browser’s monotonic clock, and subtracts them to get the time shown. The screen refreshes on a short interval, but only for drawing: if the tab sleeps or is throttled in the background, the next refresh still shows the exact time.\n\n' +
    'The stopwatch updates about 20 times a second and shows centiseconds. With reduced motion turned on in your system, it updates once a second and hides centiseconds while running. Lap time is the time since the previous lap, split is the total at that lap, and the fastest and slowest laps are marked once there are two or more. Countdowns are rounded up, so `00:01` stays until the last instant.\n\n' +
    'When a timer or Pomodoro phase ends, the page announces it in a polite live region, plays three short beeps with the Web Audio API, and shows a notification only if you have already granted permission. While a timer or Pomodoro runs, the countdown also appears in the tab title. Everything runs in your browser.',
  limits: [
    'A timer can be up to 99 hours 59 minutes 59 seconds. Pomodoro focus can be 1–180 minutes, short break 1–60, long break 1–120, and 1–12 focus sessions before a long break.',
    'Timers, laps and sessions live in the page only, so reloading or closing the tab resets them. Only your Timer and Pomodoro settings can go in a share link.',
    'Browsers may not play sound or allow notifications until you have clicked something on the page, and some mobile browsers block page notifications entirely. The on-screen announcement always works.',
    'A sleeping computer or a heavily throttled tab can only alert once it wakes up, though the time shown is then correct.',
    'Time comes from your browser’s system clock source. It is accurate to about a millisecond but is not an official timing instrument.',
  ],
  privacy:
    'Nothing is sent anywhere or stored on your device. **Copy share link** puts only your Timer and Pomodoro settings (lengths and options) in the link’s `#` fragment, which browsers do not send to servers. Laps and running timers are never included.',
  faqs: [
    {
      question: 'Does the stopwatch keep time if I switch tabs?',
      answer: 'Yes. Time is calculated from timestamps, not by counting refreshes, so background throttling doesn’t make it run slow.',
    },
    {
      question: 'Why did I not hear the beep?',
      answer: 'Browsers only allow sound after you have interacted with the page, and there is no beep if **Play a beep** is unticked. Clicking Start counts as interaction.',
    },
    {
      question: 'How do I get notifications?',
      answer: 'Tick **Show a browser notification** and allow the permission prompt. The page never asks on its own; if you decline, only the notification is lost.',
    },
    {
      question: 'What is the difference between lap and split?',
      answer: 'Lap is how long that lap took. Split is the total elapsed time when you pressed Lap.',
    },
    {
      question: 'How does the Pomodoro cycle work?',
      answer: 'Focus, then a short break, repeating. After every set number of focus sessions (4 by default), the break is the long one. **Skip** jumps to the next phase.',
    },
  ],
};

export default docs;
