// Finish alerts. WebAudio needs a user gesture to start, so `primeAudio` is called from the
// Start buttons; the beep itself may fire later, from a timer callback.

let ctx: AudioContext | null = null;

export function primeAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    // No WebAudio: alerts stay visual.
  }
}

export function beep() {
  if (!ctx || ctx.state !== 'running') return;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime + i * 0.3;
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  }
}

/** Shows a notification only if the user already granted permission; never asks by itself. */
export function notify(title: string) {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(title);
  } catch {
    // Some mobile browsers only allow notifications from a service worker.
  }
}
