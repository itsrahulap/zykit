import { useEffect, useMemo, useRef, useState } from 'react';
import textToSpeech from './index';
import { chunkText, groupVoices, languageLabel, wordAt, type Chunk } from './features/text-to-speech';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea } from '../../shared/ui/tool';
import { Icon } from '../../shared/ui/ui';
import { useShareState } from '../../shared/hooks/useShareState';

const card = 'space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const btn =
  'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium pointer-coarse:min-h-11 disabled:cursor-not-allowed disabled:opacity-50';
const secondary = `${btn} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`;
const MAX_CHARS = 30000;

const supported = () => typeof window !== 'undefined' && !!window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined';
type State = 'idle' | 'speaking' | 'paused';

export default function TextToSpeechPage() {
  const [text, setText] = useState('Hello! This text will be read aloud by a voice installed in your browser or system.');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [state, setState] = useState<State>('idle');
  const [hl, setHl] = useState<[number, number] | null>(null);
  const [error, setError] = useState('');
  const run = useRef(0);
  const ok = supported();

  useShareState({ text }, (s) => s.text !== undefined && setText(s.text.slice(0, MAX_CHARS)));

  useEffect(() => {
    if (!ok) return;
    const synth = window.speechSynthesis;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener('voiceschanged', load);
    return () => synth.removeEventListener('voiceschanged', load);
  }, [ok]);
  useEffect(() => () => {
    run.current++;
    if (supported()) window.speechSynthesis.cancel();
  }, []);

  const groups = useMemo(() => groupVoices(voices, languageLabel), [voices]);
  const voice = voices.find((v) => v.voiceURI === voiceURI);

  const stop = () => {
    run.current++;
    window.speechSynthesis.cancel();
    setState('idle');
    setHl(null);
  };

  const speak = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const id = ++run.current;
    const chunks: Chunk[] = chunkText(text);
    if (!chunks.length) return;
    setError('');
    setState('speaking');
    const next = (i: number) => {
      if (id !== run.current) return;
      if (i >= chunks.length) {
        setState('idle');
        setHl(null);
        return;
      }
      const c = chunks[i];
      const u = new SpeechSynthesisUtterance(c.text);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      u.rate = rate;
      u.pitch = pitch;
      u.volume = volume;
      u.onboundary = (e) => {
        if (id !== run.current || e.name !== 'word') return;
        const [a, b] = wordAt(c.text, e.charIndex, e.charLength);
        setHl([c.start + a, c.start + b]);
      };
      u.onend = () => next(i + 1);
      u.onerror = (e) => {
        if (id !== run.current) return;
        if (e.error !== 'canceled' && e.error !== 'interrupted') setError(`The voice failed (${e.error}). Try another voice.`);
        run.current++;
        setState('idle');
        setHl(null);
      };
      synth.speak(u);
    };
    next(0);
  };

  const status = !ok
    ? 'Speech synthesis is not available in this browser.'
    : !text.trim()
      ? 'Type or paste text to read aloud.'
      : state === 'speaking'
        ? 'Speaking…'
        : state === 'paused'
          ? 'Paused.'
          : voices.length
            ? `${voices.length} voices available.`
            : 'Waiting for the browser’s voice list…';

  const slider = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number) => (
    <label className="block min-w-0 text-sm text-slate-700 dark:text-slate-300">
      {label}: {v.toFixed(2)}
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} className="mt-2 block w-full accent-emerald-600 pointer-coarse:min-h-11" />
    </label>
  );

  return (
    <div className="space-y-8">
      <Breadcrumb tool={textToSpeech} />
      <Headline accent="aloud">Read text </Headline>
      <StatusStrip status={status} tone={state === 'speaking' ? 'busy' : 'neutral'} />

      {!ok && (
        <p role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          This browser doesn’t support the Web Speech API (speechSynthesis), so text can’t be read aloud here. Try a current version of Chrome, Edge, Safari or Firefox.
        </p>
      )}
      {error && <p role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</p>}

      <CodeArea label="Text" value={text} maxLength={MAX_CHARS} rows={8} onChange={(e) => setText(e.target.value)} className="font-sans" spellCheck />
      {hl && (
        <p aria-label="Now reading" className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed whitespace-pre-wrap break-words text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {text.slice(0, hl[0])}
          <mark className="rounded bg-amber-300 px-0.5 text-slate-900">{text.slice(hl[0], hl[1])}</mark>
          {text.slice(hl[1])}
        </p>
      )}

      <section aria-label="Voice and controls" className={card}>
        <div className="min-w-0">
          <label htmlFor="tts-voice" className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Voice</label>
          <select
            id="tts-voice"
            value={voiceURI}
            disabled={!ok}
            onChange={(e) => setVoiceURI(e.target.value)}
            className="block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="">Browser default</option>
            {groups.map((g) => (
              <optgroup key={g.lang} label={g.label}>
                {g.voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name}{v.localService ? ' (on this device)' : ' (online)'}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            “On this device” voices run locally. “Online” voices are not local: your browser or operating system may send the text to its vendor’s speech service.
            {voice && !voice.localService && <strong className="block text-amber-700 dark:text-amber-400">The selected voice is not local.</strong>}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {slider('Rate', rate, setRate, 0.5, 2, 0.05)}
          {slider('Pitch', pitch, setPitch, 0, 2, 0.05)}
          {slider('Volume', volume, setVolume, 0, 1, 0.05)}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Rate, pitch and volume apply from the next sentence while speaking. Long text is read one sentence-sized chunk at a time.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={!ok || !text.trim() || state !== 'idle'} onClick={speak} className={`${btn} bg-primary text-primary-ink ring-1 ring-inset ring-primary-edge`}>
            <Icon name="play" className="h-4 w-4" /> Play
          </button>
          <button type="button" disabled={state !== 'speaking'} onClick={() => { window.speechSynthesis.pause(); setState('paused'); }} className={secondary}>Pause</button>
          <button type="button" disabled={state !== 'paused'} onClick={() => { window.speechSynthesis.resume(); setState('speaking'); }} className={secondary}>Resume</button>
          <button type="button" disabled={state === 'idle'} onClick={stop} className={secondary}>
            <Icon name="stop" className="h-4 w-4" /> Stop
          </button>
        </div>
      </section>
    </div>
  );
}
