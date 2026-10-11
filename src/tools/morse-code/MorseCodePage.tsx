import { useEffect, useMemo, useRef, useState } from 'react';
import morseCode from './index';
import { decode, DIGITS, encode, LETTERS, PROSIGNS, PUNCTUATION, timeline, totalMs, WPM_MAX, WPM_MIN, type Separator } from './features/morse-code';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CopyButton, Segmented } from '../../shared/ui/tool';
import { Icon } from '../../shared/ui/ui';
import { useShareState } from '../../shared/hooks/useShareState';

const card = 'space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const btn =
  'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium pointer-coarse:min-h-11 disabled:cursor-not-allowed disabled:opacity-50';
const MAX_PLAY_CHARS = 2000;

type Source = 'text' | 'morse';

export default function MorseCodePage() {
  const [source, setSource] = useState<Source>('text');
  const [value, setValue] = useState('SOS');
  const [sep, setSep] = useState<Separator>('space');
  const [wpm, setWpm] = useState(20);
  const [overall, setOverall] = useState(20);
  const [freq, setFreq] = useState(600);
  const [flash, setFlash] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [lit, setLit] = useState(false);
  const stopRef = useRef<() => void>(() => {});

  useShareState(
    { src: source, val: value, sep },
    (s) => {
      if (s.src === 'text' || s.src === 'morse') setSource(s.src);
      if (s.val !== undefined) setValue(s.val);
      if (s.sep === 'space' || s.sep === 'slash') setSep(s.sep);
    },
    { src: ['text', 'morse'], sep: ['space', 'slash'] },
  );
  useEffect(() => () => stopRef.current(), []);

  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const enc = useMemo(() => (source === 'text' ? encode(value, sep) : null), [source, value, sep]);
  const morse = enc ? enc.morse : value;
  const text = source === 'text' ? value : decode(value);
  const effOverall = Math.min(overall, wpm);
  const tl = useMemo(() => timeline(morse, wpm, effOverall), [morse, wpm, effOverall]);
  const dur = totalMs(tl);
  const tooLong = morse.length > MAX_PLAY_CHARS;

  const stop = () => stopRef.current();
  const play = () => {
    stop();
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC || !tl.length) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    const t0 = ctx.currentTime + 0.05;
    let t = t0;
    const timers: number[] = [];
    let at = 50;
    for (const e of tl) {
      if (e.tone) {
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.005);
        gain.gain.setValueAtTime(0.4, t + e.ms / 1000 - 0.005);
        gain.gain.linearRampToValueAtTime(0, t + e.ms / 1000);
        if (flash && !reduced) {
          timers.push(window.setTimeout(() => setLit(true), at), window.setTimeout(() => setLit(false), at + e.ms));
        }
      }
      t += e.ms / 1000;
      at += e.ms;
    }
    osc.start(t0);
    osc.stop(t + 0.05);
    const cleanup = () => {
      timers.forEach(clearTimeout);
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
      void ctx.close();
      setLit(false);
      setPlaying(false);
      stopRef.current = () => {};
    };
    timers.push(window.setTimeout(cleanup, at + 100));
    stopRef.current = cleanup;
    setPlaying(true);
  };

  const status = !value.trim()
    ? 'Type text, or paste Morse (dots and dashes).'
    : enc?.skipped.length
      ? `Skipped characters with no Morse code: ${enc.skipped.join(' ')}`
      : source === 'text'
        ? `${morse.split(/\s+/).filter((x) => x !== '/').length} Morse groups, about ${(dur / 1000).toFixed(1)} s at ${wpm} WPM`
        : text.includes('�')
          ? 'Some groups are not valid Morse and show as �.'
          : 'Decoded.';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={morseCode} />
      <Headline accent="Morse">Translate to and from </Headline>
      <StatusStrip status={status} tone={value.trim() && !enc?.skipped.length ? 'good' : 'neutral'} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-2">
          <div className="flex justify-end">
            <CopyButton text={text} />
          </div>
          <CodeArea label="Text" value={text} onChange={(e) => { setSource('text'); setValue(e.target.value); }} rows={8} />
        </section>
        <section className="space-y-2">
          <div className="flex justify-end">
            <CopyButton text={morse} />
          </div>
          <CodeArea label="Morse" value={morse} onChange={(e) => { setSource('morse'); setValue(e.target.value); }} rows={8} />
        </section>
      </div>

      <section aria-label="Playback" className={card}>
        <div className="flex flex-wrap items-center gap-4">
          <Segmented<Separator> label="Word separator" value={sep} onChange={setSep} options={[{ value: 'space', label: 'Space' }, { value: 'slash', label: 'Slash /' }]} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block min-w-0 text-sm text-slate-700 dark:text-slate-300">
            Speed: {wpm} WPM
            <input type="range" min={WPM_MIN} max={WPM_MAX} value={wpm} onChange={(e) => setWpm(Number(e.target.value))} className="mt-2 block w-full accent-emerald-600 pointer-coarse:min-h-11" />
          </label>
          <label className="block min-w-0 text-sm text-slate-700 dark:text-slate-300">
            Farnsworth overall: {effOverall} WPM
            <input type="range" min={WPM_MIN} max={WPM_MAX} value={effOverall} onChange={(e) => setOverall(Number(e.target.value))} className="mt-2 block w-full accent-emerald-600 pointer-coarse:min-h-11" />
          </label>
          <label className="block min-w-0 text-sm text-slate-700 dark:text-slate-300">
            Tone: {freq} Hz
            <input type="range" min={300} max={1200} step={10} value={freq} onChange={(e) => setFreq(Number(e.target.value))} className="mt-2 block w-full accent-emerald-600 pointer-coarse:min-h-11" />
          </label>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Lower the overall speed below the character speed to stretch the gaps between letters and words (Farnsworth timing).</p>
        <label className="flex items-center gap-2 text-sm text-slate-700 pointer-coarse:min-h-11 dark:text-slate-300">
          <input type="checkbox" checked={flash} disabled={reduced} onChange={(e) => setFlash(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
          Flash the light while playing{reduced && ' (off: your system asks to reduce motion)'}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={play} disabled={playing || !tl.length || tooLong} className={`${btn} bg-primary text-primary-ink ring-1 ring-inset ring-primary-edge`}>
            <Icon name="play" className="h-4 w-4" /> Play
          </button>
          <button type="button" onClick={stop} disabled={!playing} className={`${btn} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`}>
            <Icon name="stop" className="h-4 w-4" /> Stop
          </button>
          <span
            data-testid="indicator"
            role="status"
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${lit ? 'bg-amber-300 text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
          >
            {playing ? (flash && !reduced ? 'Playing, light on when sounding' : 'Playing…') : 'Stopped'}
          </span>
        </div>
        {tooLong && <p className="text-sm text-red-600 dark:text-red-400">Playback is limited to {MAX_PLAY_CHARS} Morse characters.</p>}
      </section>

      <section aria-label="Reference" className={card}>
        <h2 className="eyebrow text-slate-600 dark:text-slate-400">Reference</h2>
        {[
          ['Letters', LETTERS], ['Digits', DIGITS], ['Punctuation', PUNCTUATION],
          ['Prosigns (type as <AR>)', Object.fromEntries(Object.entries(PROSIGNS).map(([k, v]) => [`<${k}>`, v]))],
        ].map(([title, map]) => (
          <div key={title as string}>
            <h3 className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">{title as string}</h3>
            <dl className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-4 gap-y-1 font-mono text-sm">
              {Object.entries(map as Record<string, string>).map(([k, v]) => (
                <div key={k} className="flex min-w-0 justify-between gap-2">
                  <dt className="text-slate-900 dark:text-slate-100">{k}</dt>
                  <dd className="text-slate-600 dark:text-slate-400">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>
    </div>
  );
}
