import { useEffect, useId, useMemo, useState } from 'react';
import passwordStrengthChecker from './index';
import { analyse, buildDicts, describeMatch, MAX_ANALYSED, parseCustomWords, type Dicts } from './features/password-strength-checker';
import { WORDS } from '../password-generator/features/words';
import { Notices } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb } from '../../shared/ui/tool';
import { Badge, Button } from '../../shared/ui/ui';

const card = 'min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-8 dark:border-slate-800 dark:bg-slate-900';
const field =
  'block w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-950 dark:text-slate-100';

const LEVELS = [
  { bar: 'bg-red-600', tone: 'red' as const },
  { bar: 'bg-orange-500', tone: 'amber' as const },
  { bar: 'bg-amber-500', tone: 'amber' as const },
  { bar: 'bg-emerald-500', tone: 'green' as const },
  { bar: 'bg-emerald-600', tone: 'green' as const },
];

function formatGuesses(g: number): string {
  if (!isFinite(g)) return 'more than 10^300';
  if (g < 1e6) return Math.round(g).toLocaleString('en');
  return `10^${Math.log10(g).toFixed(1)}`;
}

export default function PasswordStrengthCheckerPage() {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [own, setOwn] = useState('');
  const [dicts, setDicts] = useState<Dicts | null>(null);
  const passId = useId();
  const ownId = useId();
  const ownHint = useId();

  // The word lists are a separate chunk, fetched once from this site when the page opens.
  useEffect(() => {
    let live = true;
    void import('./features/data').then((d) => {
      if (live) setDicts(buildDicts({ passwords: d.COMMON_PASSWORDS, words: [...d.EXTRA_WORDS, ...WORDS], names: d.NAMES }));
    });
    return () => {
      live = false;
    };
  }, []);

  const custom = useMemo(() => parseCustomWords(own), [own]);
  const result = useMemo(() => (dicts && password ? analyse(password, dicts, custom) : null), [dicts, password, custom]);
  const level = result ? LEVELS[result.score] : null;

  const status = !dicts ? 'Loading word lists…' : !password ? 'Type a password to check it. It never leaves this page.' : `${result?.label}. Estimated ${formatGuesses(result?.guesses ?? 0)} guesses.`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={passwordStrengthChecker} />
      <Headline accent="password">How strong is your </Headline>
      <StatusStrip status={status} tone={result && result.score >= 3 ? 'good' : 'neutral'} />
      <Notices items={['Nothing you type is stored, logged or sent anywhere: the check runs entirely in this tab. Even so, avoid typing a password you use right now on any site; try a similar one instead.']} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card} aria-label="Password">
          <div>
            <label htmlFor={passId} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
              Password to check
            </label>
            <div className="flex gap-2">
              <input
                id={passId}
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                className={field}
              />
              <Button variant="secondary" className="!px-3 !py-2 !text-sm" aria-pressed={show} onClick={() => setShow((s) => !s)}>
                {show ? 'Hide' : 'Show'}
              </Button>
            </div>
            {result?.truncated && <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">Only the first {MAX_ANALYSED} characters are analysed.</p>}
          </div>
          <div>
            <label htmlFor={ownId} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
              Check against your own words (optional)
            </label>
            <input
              id={ownId}
              type="text"
              value={own}
              onChange={(e) => setOwn(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              aria-describedby={ownHint}
              placeholder="name, pet, town, birthday…"
              className={field}
            />
            <p id={ownHint} className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Words an attacker could learn about you, separated by commas or spaces. They are treated as the first guesses.
            </p>
          </div>
        </section>

        <section className={card} aria-label="Result" aria-live="polite">
          <h2 className="eyebrow text-slate-600 dark:text-slate-400">Result</h2>
          {!result && <p className="text-sm text-slate-500 dark:text-slate-400">The strength, crack times and advice appear here. Nothing is saved.</p>}
          {result && level && (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={level.tone}>
                    {result.label} ({result.score}/4)
                  </Badge>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    about {formatGuesses(result.guesses)} guesses, ~{Math.round(result.bits)} bits
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true">
                  <div className={`h-full ${level.bar}`} style={{ width: `${(result.score + 1) * 20}%` }} />
                </div>
              </div>

              {(result.feedback.warning || result.feedback.suggestions.length > 0) && (
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {result.feedback.warning && <p className="font-semibold text-slate-900 dark:text-slate-100">{result.feedback.warning}</p>}
                  {result.feedback.suggestions.length > 0 && (
                    <ul className="list-disc space-y-1 pl-5">
                      {result.feedback.suggestions.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div>
                <h3 className="eyebrow mb-2 text-slate-600 dark:text-slate-400">Time to crack</h3>
                <dl className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  {result.crackTimes.map((c) => (
                    <div key={c.scenario.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2">
                      <dt className="min-w-0">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{c.scenario.label}</span>
                        <span className="block text-slate-500 dark:text-slate-400">{c.scenario.note}</span>
                      </dt>
                      <dd className="font-semibold text-slate-900 dark:text-slate-100">{c.display}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </section>
      </div>

      {result && (
        <Panel eyebrow="How it was cracked">
          <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">The cheapest way found to build this password, piece by piece:</p>
          <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {result.sequence.map((m, idx) => (
              <li key={`${m.i}-${idx}`} className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                <code className="font-mono break-all rounded bg-slate-100 px-1.5 py-0.5 text-slate-900 dark:bg-slate-800 dark:text-slate-100">{show ? m.token : '•'.repeat(m.token.length)}</code>
                <span className="min-w-0">
                  {describeMatch(m)} · {formatGuesses(m.guesses)} guesses
                </span>
              </li>
            ))}
          </ol>
          {!show && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Press Show to see the pieces.</p>}
        </Panel>
      )}

      <Panel eyebrow="About the estimate">
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>Guesses are counted the way a smart attacker would try them: common passwords, words, names, l33t, keyboard walks, repeats, sequences, years and dates first.</li>
          <li>Crack times assume the attacker already knows your method. They are estimates, not guarantees, and the word lists here are compact rather than exhaustive.</li>
          <li>The best defence is a unique, long password (or several random words) per site, kept in a password manager.</li>
        </ul>
      </Panel>
    </div>
  );
}
