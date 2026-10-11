import { useCallback, useEffect, useRef, useState } from 'react';
import stopwatchTimer from './index';
import { beep, notify, primeAudio } from './features/alert';
import {
  addLap,
  clampInt,
  elapsedMs,
  formatCountdown,
  formatStopwatch,
  hmsToMs,
  lapExtremes,
  lapsToText,
  nextPhase,
  PHASE_LABEL,
  type Lap,
  type Phase,
} from './features/time';
import { useMediaQuery } from '../../shared/hooks/useMediaQuery';
import { useShareState } from '../../shared/hooks/useShareState';
import { Checkbox } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';

type Tab = 'stopwatch' | 'timer' | 'pomodoro';
type Cfg = {
  work: number;
  short: number;
  long: number;
  cycles: number;
  auto: boolean;
  h: number;
  m: number;
  s: number;
};
interface Alerts {
  sound: boolean;
  announce: (msg: string) => void;
}

const DEFAULTS: Cfg = { work: 25, short: 5, long: 15, cycles: 4, auto: false, h: 0, m: 5, s: 0 };
const card = 'rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const inputClass =
  'w-full rounded-xl border border-field-edge bg-white px-3 py-2 text-center font-mono text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 pointer-coarse:min-h-11 dark:bg-slate-950 dark:text-slate-100';
const bigClock = 'text-center font-mono text-4xl font-semibold tabular-nums text-slate-900 sm:text-6xl dark:text-slate-100';
const PRESETS = [
  { label: '1 min', s: 60 },
  { label: '5 min', s: 300 },
  { label: '10 min', s: 600 },
  { label: '25 min', s: 1500 },
  { label: '1 hour', s: 3600 },
];

/** Re-renders every `ms` while active. The shown time is always recomputed from timestamps. */
function useNow(active: boolean, ms: number) {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(performance.now()), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return now;
}

/** Space start/stop, L lap, R reset: for the visible tab, never while typing in a field. */
function useHotkeys(active: boolean, h: { toggle: () => void; reset: () => void; lap?: () => void }) {
  const ref = useRef(h);
  useEffect(() => {
    ref.current = h;
  });
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest('input,textarea,select,[contenteditable]')) return;
      // Space on a focused button would also click it.
      if (e.key === ' ' && t?.closest('button,a,summary')) return;
      const k = e.key.toLowerCase();
      if (k === ' ') ref.current.toggle();
      else if (k === 'r') ref.current.reset();
      else if (k === 'l' && ref.current.lap) ref.current.lap();
      else return;
      e.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);
}

function Keys({ children }: { children: string }) {
  return <p className="text-center text-sm text-slate-500 dark:text-slate-400">{children}</p>;
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="block min-w-0">
      <span className="eyebrow mb-1 block text-slate-600 dark:text-slate-400">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clampInt(e.target.value === '' ? 0 : Number(e.target.value), min, max))}
        className={inputClass}
      />
    </label>
  );
}

function Stopwatch({ active, reduced }: { active: boolean; reduced: boolean }) {
  const [banked, setBanked] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [laps, setLaps] = useState<Lap[]>([]);
  const running = startedAt !== null;
  const now = useNow(running, reduced ? 1000 : 50);
  const total = elapsedMs(banked, startedAt, now);
  const { fastest, slowest } = lapExtremes(laps);

  const toggle = () => {
    const t = performance.now();
    if (running) setBanked(elapsedMs(banked, startedAt, t));
    // oxlint-disable-next-line react/set-state-in-effect -- reacts to the wall clock, an external system
    setStartedAt(running ? null : t);
  };
  const lap = () => running && setLaps(addLap(laps, elapsedMs(banked, startedAt, performance.now())));
  const reset = () => {
    setBanked(0);
    setStartedAt(null);
    setLaps([]);
  };
  useHotkeys(active, { toggle, reset, lap });

  return (
    <div className="space-y-6">
      <div className={card}>
        <p className={bigClock} role="timer" aria-label="Elapsed time" aria-live="off" data-testid="stopwatch-time">
          {formatStopwatch(total, !(reduced && running))}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={toggle}>
            <Icon name={running ? 'stop' : 'play'} className="h-4 w-4" /> {running ? 'Stop' : total > 0 ? 'Resume' : 'Start'}
          </Button>
          <Button variant="secondary" onClick={lap} disabled={!running}>
            Lap
          </Button>
          <Button variant="secondary" onClick={reset} disabled={total === 0 && !running}>
            Reset
          </Button>
        </div>
        <div className="mt-4">
          <Keys>Keys: Space start/stop, L lap, R reset</Keys>
        </div>
      </div>
      {laps.length > 0 && (
        <section aria-label="Laps" className={`${card} min-w-0 space-y-3`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">Laps</h2>
            <CopyButton text={lapsToText(laps)} label="Copy laps" />
          </div>
          <table className="w-full text-left font-mono text-sm tabular-nums">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-1 pr-2 font-medium">#</th>
                <th className="py-1 pr-2 font-medium">Lap</th>
                <th className="py-1 font-medium">Split</th>
              </tr>
            </thead>
            <tbody>
              {[...laps].reverse().map((l) => (
                <tr key={l.n} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1.5 pr-2">{l.n}</td>
                  <td className="py-1.5 pr-2">
                    {formatStopwatch(l.lap)}
                    {l.n === fastest && <span className="ml-1 text-emerald-700 dark:text-emerald-400"> fastest</span>}
                    {l.n === slowest && <span className="ml-1 text-amber-700 dark:text-amber-400"> slowest</span>}
                  </td>
                  <td className="py-1.5">{formatStopwatch(l.split)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

interface TimerItem {
  id: number;
  label: string;
  total: number;
  /** performance.now() time it finishes, while running. */
  endAt: number | null;
  /** Time left while paused or finished. */
  left: number;
}
const timeLeft = (t: TimerItem, now: number) => (t.endAt === null ? t.left : Math.max(0, t.endAt - now));

function Timers({ active, cfg, setCfg, alerts, onTitle }: { active: boolean; cfg: Cfg; setCfg: (c: Cfg) => void; alerts: Alerts; onTitle: (t: string | null) => void }) {
  const [timers, setTimers] = useState<TimerItem[]>([]);
  const nextId = useRef(1);
  const anyRunning = timers.some((t) => t.endAt !== null);
  const now = useNow(anyRunning, 250);
  const formMs = hmsToMs(cfg.h, cfg.m, cfg.s);

  const add = (ms: number) => {
    if (ms <= 0) return;
    primeAudio();
    const id = nextId.current++;
    setTimers((l) => [...l, { id, label: `Timer ${id}`, total: ms, endAt: performance.now() + ms, left: ms }]);
  };
  const patch = (id: number, f: (t: TimerItem, at: number) => TimerItem) => setTimers((l) => l.map((t) => (t.id === id ? f(t, performance.now()) : t)));
  const pause = (t: TimerItem, at: number): TimerItem => ({ ...t, endAt: null, left: timeLeft(t, at) });
  const resume = (t: TimerItem, at: number): TimerItem => (t.left > 0 ? { ...t, endAt: at + t.left } : t);
  const reset = (t: TimerItem): TimerItem => ({ ...t, endAt: null, left: t.total });

  // Finish timers whose end has passed (also catches up after a throttled background tab).
  useEffect(() => {
    const done = timers.filter((t) => t.endAt !== null && t.endAt <= now);
    if (!done.length) return;
    // oxlint-disable-next-line react/set-state-in-effect -- reacts to the wall clock, an external system
    setTimers((l) => l.map((t) => (done.includes(t) ? { ...t, endAt: null, left: 0 } : t)));
    for (const t of done) {
      alerts.announce(`${t.label} finished.`);
      if (alerts.sound) beep();
      notify(`${t.label} finished`);
    }
  }, [now, timers, alerts]);

  const running = timers.filter((t) => t.endAt !== null);
  useEffect(() => {
    onTitle(running.length ? formatCountdown(Math.min(...running.map((t) => timeLeft(t, now)))) : null);
  });
  useEffect(() => () => onTitle(null), [onTitle]);

  useHotkeys(active, {
    toggle: () => {
      if (!timers.length) return add(formMs);
      primeAudio();
      setTimers((l) => l.map((t) => (anyRunning ? (t.endAt === null ? t : pause(t, performance.now())) : resume(t, performance.now()))));
    },
    reset: () => setTimers((l) => l.map(reset)),
  });

  return (
    <div className="space-y-6">
      <section aria-label="New timer" className={`${card} space-y-4`}>
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Hours" value={cfg.h} min={0} max={99} onChange={(h) => setCfg({ ...cfg, h })} />
          <NumberField label="Minutes" value={cfg.m} min={0} max={59} onChange={(m) => setCfg({ ...cfg, m })} />
          <NumberField label="Seconds" value={cfg.s} min={0} max={59} onChange={(s) => setCfg({ ...cfg, s })} />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Presets">
          {PRESETS.map((p) => (
            <Button key={p.label} variant="secondary" className="!px-3 !py-1.5 !text-sm" onClick={() => setCfg({ ...cfg, h: Math.floor(p.s / 3600), m: Math.floor(p.s / 60) % 60, s: p.s % 60 })}>
              {p.label}
            </Button>
          ))}
        </div>
        <Button onClick={() => add(formMs)} disabled={formMs <= 0}>
          <Icon name="play" className="h-4 w-4" /> Start timer
        </Button>
        <Keys>Keys: Space start / pause all, R reset all. Start several timers to run them side by side.</Keys>
      </section>
      {timers.length > 0 && (
        <section aria-label="Timers" className="space-y-3">
          {timers.map((t) => {
            const left = timeLeft(t, now);
            const finished = t.endAt === null && t.left === 0;
            return (
              <div key={t.id} className={`${card} space-y-3`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="eyebrow text-slate-600 dark:text-slate-400">{t.label}</h2>
                  <span className="text-sm text-slate-500 dark:text-slate-400">of {formatCountdown(t.total)}</span>
                </div>
                <p className={`${bigClock} ${finished ? 'text-emerald-700 dark:text-emerald-400' : ''}`} role="timer" aria-label={`${t.label} remaining`} aria-live="off" data-testid="timer-time">
                  {formatCountdown(left)}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {finished ? (
                    <p className="py-2 font-semibold text-emerald-700 dark:text-emerald-400">Finished</p>
                  ) : (
                    <Button
                      onClick={() => {
                        primeAudio();
                        patch(t.id, (x, at) => (x.endAt === null ? resume(x, at) : pause(x, at)));
                      }}
                    >
                      {t.endAt === null ? 'Resume' : 'Pause'}
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => patch(t.id, reset)}>
                    Reset
                  </Button>
                  <Button variant="ghost" aria-label={`Remove ${t.label}`} onClick={() => setTimers((l) => l.filter((x) => x.id !== t.id))}>
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

interface PomoState {
  phase: Phase;
  sessions: number;
  endAt: number | null;
  /** Time left while paused; null means a full phase. */
  left: number | null;
}

function Pomodoro({ active, cfg, setCfg, alerts, onTitle }: { active: boolean; cfg: Cfg; setCfg: (c: Cfg) => void; alerts: Alerts; onTitle: (t: string | null) => void }) {
  const [st, setSt] = useState<PomoState>({ phase: 'work', sessions: 0, endAt: null, left: null });
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const now = useNow(st.endAt !== null, 250);
  const phaseMs = (p: Phase) => cfg[p] * 60_000;
  const full = phaseMs(st.phase);
  const left = st.endAt !== null ? Math.max(0, st.endAt - now) : (st.left ?? full);
  const running = st.endAt !== null;

  const toggle = () => {
    primeAudio();
    const at = performance.now();
    setSt(running ? { ...st, endAt: null, left } : { ...st, endAt: at + left, left: null });
  };
  const reset = () => setSt({ phase: 'work', sessions: 0, endAt: null, left: null });
  const skip = () => {
    const n = nextPhase(st.phase, st.sessions, cfg.cycles);
    setSt({ ...n, endAt: running ? performance.now() + phaseMs(n.phase) : null, left: null });
  };

  useEffect(() => {
    if (st.endAt === null || st.endAt > now) return;
    const n = nextPhase(st.phase, st.sessions, cfg.cycles);
    const nextMs = phaseMs(n.phase);
    // Chain from the exact end time so a throttled tab doesn't accumulate drift.
    const start = Math.max(st.endAt, now - nextMs);
    setSt({ ...n, endAt: cfg.auto ? start + nextMs : null, left: null });
    alerts.announce(st.phase === 'work' ? `Focus session ${n.sessions} complete. Time for a ${PHASE_LABEL[n.phase].toLowerCase()}.` : 'Break over. Time to focus.');
    if (alerts.sound) beep();
    notify(st.phase === 'work' ? 'Focus session complete' : 'Break over');
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- runs on each tick; settings are read fresh
  }, [now, st]);

  useEffect(() => {
    onTitle(running ? `${formatCountdown(left)} ${PHASE_LABEL[st.phase]}` : null);
  });
  useEffect(() => () => onTitle(null), [onTitle]);
  useHotkeys(active, { toggle, reset });

  const pct = full > 0 ? Math.round((1 - left / full) * 100) : 0;
  const set = (k: 'work' | 'short' | 'long', max: number) => (v: number) => setCfg({ ...cfg, [k]: clampInt(v, 1, max) });
  return (
    <div className="space-y-6">
      <div className={`${card} space-y-4`}>
        <p className="text-center text-lg font-semibold text-emerald-700 dark:text-emerald-400" data-testid="pomodoro-phase">
          {PHASE_LABEL[st.phase]}
        </p>
        <p className={bigClock} role="timer" aria-label="Time left in this session" aria-live="off" data-testid="pomodoro-time">
          {formatCountdown(left)}
        </p>
        <div role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className={`h-full bg-emerald-600 ${reduced ? '' : 'transition-[width] duration-300'}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400" data-testid="pomodoro-sessions">
          Focus sessions completed: {st.sessions}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={toggle}>
            <Icon name={running ? 'stop' : 'play'} className="h-4 w-4" /> {running ? 'Pause' : 'Start'}
          </Button>
          <Button variant="secondary" onClick={skip}>
            Skip
          </Button>
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
        </div>
        <Keys>Keys: Space start/pause, R reset</Keys>
      </div>
      <section aria-label="Pomodoro settings" className={`${card} space-y-4`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumberField label="Focus (min)" value={cfg.work} min={1} max={180} onChange={set('work', 180)} />
          <NumberField label="Short break (min)" value={cfg.short} min={1} max={60} onChange={set('short', 60)} />
          <NumberField label="Long break (min)" value={cfg.long} min={1} max={120} onChange={set('long', 120)} />
          <NumberField label="Sessions before long break" value={cfg.cycles} min={1} max={12} onChange={(v) => setCfg({ ...cfg, cycles: clampInt(v, 1, 12) })} />
        </div>
        <Checkbox label="Start the next session automatically" checked={cfg.auto} onChange={(auto) => setCfg({ ...cfg, auto })} />
      </section>
    </div>
  );
}

export default function StopwatchTimerPage() {
  const [tab, setTab] = useState<Tab>('stopwatch');
  const [cfg, setCfg] = useState<Cfg>(DEFAULTS);
  const [sound, setSound] = useState(true);
  const [notifyOn, setNotifyOn] = useState(false);
  const [message, setMessage] = useState('');
  const [titles, setTitles] = useState<{ timer: string | null; pomodoro: string | null }>({ timer: null, pomodoro: null });
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const baseTitle = useRef('');

  useShareState(cfg, (r) => setCfg((c) => clampCfg({ ...c, ...r })));

  const onTimerTitle = useCallback((t: string | null) => setTitles((s) => (s.timer === t ? s : { ...s, timer: t })), []);
  const onPomoTitle = useCallback((t: string | null) => setTitles((s) => (s.pomodoro === t ? s : { ...s, pomodoro: t })), []);
  const title = titles.timer ?? titles.pomodoro;
  useEffect(() => {
    baseTitle.current ||= document.title;
    document.title = title ? `${title} · ${baseTitle.current}` : baseTitle.current;
  }, [title]);
  useEffect(() => () => void (document.title = baseTitle.current || document.title), []);

  const alerts: Alerts = { sound, announce: setMessage };
  const askNotify = async (on: boolean) => {
    if (!on) return setNotifyOn(false);
    if (typeof Notification === 'undefined') return setMessage('This browser does not support notifications.');
    const p = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    setNotifyOn(p === 'granted');
    if (p !== 'granted') setMessage('Notifications are blocked. Allow them in the browser to get alerts.');
  };

  return (
    <div className="space-y-8">
      <Breadcrumb tool={stopwatchTimer} />
      <Headline accent="timer">Stopwatch, countdown and </Headline>
      <StatusStrip status={message || 'Pick a tab and press Start.'} tone={message ? 'good' : 'neutral'} />
      <div className="mx-auto max-w-2xl space-y-6">
        <Segmented<Tab>
          label="Mode"
          options={[
            { value: 'stopwatch', label: 'Stopwatch' },
            { value: 'timer', label: 'Timer' },
            { value: 'pomodoro', label: 'Pomodoro' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div hidden={tab !== 'stopwatch'}>
          <Stopwatch active={tab === 'stopwatch'} reduced={reduced} />
        </div>
        <div hidden={tab !== 'timer'}>
          <Timers active={tab === 'timer'} cfg={cfg} setCfg={setCfg} alerts={alerts} onTitle={onTimerTitle} />
        </div>
        <div hidden={tab !== 'pomodoro'}>
          <Pomodoro active={tab === 'pomodoro'} cfg={cfg} setCfg={setCfg} alerts={alerts} onTitle={onPomoTitle} />
        </div>
        {tab !== 'stopwatch' && (
          <fieldset className="space-y-1">
            <legend className="eyebrow mb-1 text-slate-600 dark:text-slate-400">When time is up</legend>
            <Checkbox label="Play a beep" checked={sound} onChange={setSound} />
            <Checkbox label="Show a browser notification" checked={notifyOn} onChange={(v) => void askNotify(v)} />
          </fieldset>
        )}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Times are measured from the system clock, so they stay correct while this tab is in the background. Nothing leaves your browser.
        </p>
      </div>
    </div>
  );
}

function clampCfg(c: Cfg): Cfg {
  return {
    work: clampInt(c.work, 1, 180),
    short: clampInt(c.short, 1, 60),
    long: clampInt(c.long, 1, 120),
    cycles: clampInt(c.cycles, 1, 12),
    auto: c.auto,
    h: clampInt(c.h, 0, 99),
    m: clampInt(c.m, 0, 59),
    s: clampInt(c.s, 0, 59),
  };
}
