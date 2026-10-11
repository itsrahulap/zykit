import { useEffect, useMemo, useRef, useState } from 'react';
import randomPicker from './index';
import {
  coinStats,
  flipCoin,
  makeTeams,
  parseDice,
  parseList,
  pickWinners,
  randomInRange,
  rollDice,
  shuffled,
  type Side,
} from './features/picker';
import { useMediaQuery } from '../../shared/hooks/useMediaQuery';
import { useShareState } from '../../shared/hooks/useShareState';
import { createSampler } from '../../shared/lib/random';
import { Checkbox } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

type Mode = 'winners' | 'shuffle' | 'teams' | 'coin' | 'dice' | 'number';
type TeamBy = 'teams' | 'size';
interface Result {
  /** Short sentence for the live status line. */
  status: string;
  /** Lines shown and copied. */
  lines: string[];
}

const card = 'rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const inputClass =
  'w-full rounded-xl border border-field-edge bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 pointer-coarse:min-h-11 dark:bg-slate-950 dark:text-slate-100';
const SPIN_MS = 700;
const LIST_MODES: Mode[] = ['winners', 'shuffle', 'teams'];
const SIDE_NAME: Record<Side, string> = { H: 'Heads', T: 'Tails' };

function NumberField({ label, value, onChange, min = 1, max = 100000 }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <label className="block min-w-0">
      <span className="eyebrow mb-1 block text-slate-600 dark:text-slate-400">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? NaN : Math.round(Number(e.target.value)))}
        className={`${inputClass} font-mono`}
      />
    </label>
  );
}

export default function RandomPickerPage() {
  const [list, setList] = useState('');
  const [dedupe, setDedupe] = useState(false);
  const [weights, setWeights] = useState(false);
  const [mode, setMode] = useState<Mode>('winners');
  const [count, setCount] = useState(1);
  const [teamBy, setTeamBy] = useState<TeamBy>('teams');
  const [teamValue, setTeamValue] = useState(2);
  const [dice, setDice] = useState('2d6+3');
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coin, setCoin] = useState<Side[]>([]);
  const [spinName, setSpinName] = useState<string | null>(null);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const sampler = useMemo(() => createSampler(), []);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const spinner = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Only the list goes in a share link, never results.
  useShareState({ list }, (r) => typeof r.list === 'string' && setList(r.list.slice(0, 200_000)));

  const parsed = useMemo(() => parseList(list, { dedupe, weights }), [list, dedupe, weights]);
  const stats = coinStats(coin);
  const stopSpin = () => {
    clearTimeout(timer.current);
    clearInterval(spinner.current);
    setSpinName(null);
  };
  useEffect(() => stopSpin, []);
  const pickMode = (m: Mode) => {
    stopSpin();
    setMode(m);
    setResult(null);
    setError(null);
  };

  const run = () => {
    stopSpin();
    setError(null);
    const names = parsed.entries;
    if (LIST_MODES.includes(mode) && !names.length) return setError('Add at least one name, one per line.');

    if (mode === 'winners') {
      const n = Math.min(Math.max(1, count || 1), names.length);
      const won = pickWinners(names, n, sampler).map((e) => e.name);
      const show = () => {
        setSpinName(null);
        setResult({ status: `${won.length === 1 ? 'Winner' : 'Winners'}: ${won.join(', ')}`, lines: won.map((w, i) => (won.length > 1 ? `${i + 1}. ${w}` : w)) });
      };
      setResult(null);
      if (reduced || names.length < 2) return show();
      spinner.current = setInterval(() => setSpinName(names[sampler.int(names.length)].name), 70);
      timer.current = setTimeout(() => {
        clearInterval(spinner.current);
        show();
      }, SPIN_MS);
    } else if (mode === 'shuffle') {
      const order = shuffled(names, sampler).map((e) => e.name);
      setResult({ status: `Shuffled ${pluralize(order.length, 'name')}.`, lines: order.map((s, i) => `${i + 1}. ${s}`) });
    } else if (mode === 'teams') {
      if (!(teamValue >= 1)) return setError(teamBy === 'teams' ? 'Enter how many teams you want.' : 'Enter how many people per team.');
      const teams = makeTeams(names.map((e) => e.name), teamBy === 'teams' ? { teams: teamValue } : { size: teamValue }, sampler);
      setResult({ status: `Made ${pluralize(teams.length, 'team')}.`, lines: teams.map((t, i) => `Team ${i + 1}: ${t.join(', ')}`) });
    } else if (mode === 'coin') {
      const side = flipCoin(sampler);
      setCoin((h) => [...h, side].slice(-1000));
      setResult({ status: `${SIDE_NAME[side]}.`, lines: [SIDE_NAME[side]] });
    } else if (mode === 'dice') {
      const p = parseDice(dice);
      if (!p.ok) return setError(p.error);
      const r = rollDice(p.spec, sampler);
      const mod = p.spec.modifier ? ` ${p.spec.modifier > 0 ? '+' : '-'} ${Math.abs(p.spec.modifier)}` : '';
      setResult({ status: `You rolled ${r.total}.`, lines: [`${dice.trim()}: ${r.rolls.join(' + ')}${mod} = ${r.total}`] });
    } else {
      const n = randomInRange(min, max, sampler);
      if (n === null) return setError('Enter whole numbers with the minimum no larger than the maximum.');
      setResult({ status: `Your number is ${n}.`, lines: [String(n)] });
    }
  };

  const showList = LIST_MODES.includes(mode);
  const info = [pluralize(parsed.entries.length, 'entry', 'entries'), parsed.duplicates ? `${pluralize(parsed.duplicates, 'duplicate')} removed` : '', parsed.truncated ? 'extra lines ignored' : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="space-y-8">
      <Breadcrumb tool={randomPicker} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="pick">Let chance </Headline>
        <Button onClick={run}>
          <Icon name="dice" className="h-4 w-4" /> {{ winners: 'Pick', shuffle: 'Shuffle', teams: 'Make teams', coin: 'Flip', dice: 'Roll', number: 'Generate' }[mode]}
        </Button>
      </div>
      <StatusStrip status={error ?? (spinName ? 'Picking…' : (result?.status ?? 'Choose a mode and press the button.'))} tone={result && !error ? 'good' : 'neutral'} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <section aria-label="Options" className={`${card} min-w-0 space-y-5`}>
          <Segmented<Mode>
            label="Mode"
            options={[
              { value: 'winners', label: 'Pick winners' },
              { value: 'shuffle', label: 'Shuffle' },
              { value: 'teams', label: 'Teams' },
              { value: 'coin', label: 'Coin' },
              { value: 'dice', label: 'Dice' },
              { value: 'number', label: 'Number' },
            ]}
            value={mode}
            onChange={pickMode}
          />
          {showList && (
            <>
              <CodeArea label="Names (one per line)" value={list} onChange={(e) => setList(e.target.value)} rows={10} placeholder={weights ? 'Ana*3\nBen\nChloe' : 'Ana\nBen\nChloe'} />
              <p className="text-sm text-slate-500 dark:text-slate-400">{info}</p>
              <div className="space-y-1">
                <Checkbox label="Remove duplicates (ignores case)" checked={dedupe} onChange={setDedupe} />
                <Checkbox label="Weights: name*3 is three times as likely" checked={weights} onChange={setWeights} />
              </div>
            </>
          )}
          {mode === 'winners' && <NumberField label="How many winners" value={count} onChange={setCount} />}
          {mode === 'teams' && (
            <div className="space-y-3">
              <Segmented<TeamBy> label="Split by" options={[{ value: 'teams', label: 'Number of teams' }, { value: 'size', label: 'Team size' }]} value={teamBy} onChange={setTeamBy} />
              <NumberField label={teamBy === 'teams' ? 'Number of teams' : 'People per team'} value={teamValue} onChange={setTeamValue} />
            </div>
          )}
          {mode === 'dice' && (
            <label className="block">
              <span className="eyebrow mb-1 block text-slate-600 dark:text-slate-400">Dice (like 2d6+3)</span>
              <input type="text" value={dice} onChange={(e) => setDice(e.target.value)} spellCheck={false} autoComplete="off" onKeyDown={(e) => e.key === 'Enter' && run()} className={`${inputClass} font-mono`} />
            </label>
          )}
          {mode === 'number' && (
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Minimum" value={min} onChange={setMin} min={-1e9} max={1e9} />
              <NumberField label="Maximum" value={max} onChange={setMax} min={-1e9} max={1e9} />
            </div>
          )}
        </section>

        <section aria-label="Result" className={`${card} min-w-0 space-y-4`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">Result</h2>
            <CopyButton text={result?.lines.join('\n') ?? ''} label="Copy result" disabled={!result} />
          </div>
          {spinName && (
            <p aria-hidden="true" className="truncate text-center text-3xl font-semibold text-emerald-700 motion-reduce:hidden dark:text-emerald-400">
              {spinName}
            </p>
          )}
          {result ? (
            <ul className="space-y-1 text-lg text-slate-900 dark:text-slate-100" data-testid="result">
              {result.lines.map((l, i) => (
                <li key={i} className="break-words">
                  {l}
                </li>
              ))}
            </ul>
          ) : (
            !spinName && <p className="text-slate-500 dark:text-slate-400">Nothing yet.</p>
          )}
          {mode === 'coin' && (
            <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800" data-testid="coin-stats">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Heads {stats.heads} · Tails {stats.tails} · Current streak {stats.current.length ? `${stats.current.length} ${SIDE_NAME[stats.current.side!]}` : 'none'} · Longest streak {stats.longest}
              </p>
              {coin.length > 0 && (
                <p className="break-words font-mono text-sm text-slate-600 dark:text-slate-400" aria-label={`Last flips: ${coin.slice(-30).map((s) => SIDE_NAME[s]).join(', ')}`}>
                  {coin.slice(-30).join(' ')}
                </p>
              )}
              <Button
                variant="ghost"
                disabled={!coin.length}
                onClick={() => {
                  setCoin([]);
                  setResult(null);
                }}
              >
                Clear history
              </Button>
            </div>
          )}
        </section>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">Randomness comes from your browser’s secure random generator. Nothing leaves your browser.</p>
    </div>
  );
}
