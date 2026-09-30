import { useEffect, useMemo, useState } from 'react';
import totpGenerator from './index';
import {
  ALGORITHMS,
  base32Decode,
  buildOtpauth,
  generateSecret,
  groupSecret,
  hotp,
  parseOtpauth,
  secondsRemaining,
  timeCounter,
  verifyCode,
  type Algorithm,
  type OtpType,
} from './features/totp-generator';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Notices } from '../../shared/ui/convert';
import { Button, Icon } from '../../shared/ui/ui';

/** "12345678901234567890", the RFC 4226 / 6238 test secret. */
const EXAMPLE = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const label = 'eyebrow mb-2 block text-slate-600 dark:text-slate-400';

const formatCode = (c: string) => (c.length === 6 ? `${c.slice(0, 3)} ${c.slice(3)}` : c.length === 8 ? `${c.slice(0, 4)} ${c.slice(4)}` : c);

function useNow(ms = 250) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

function Ring({ remaining, period }: { remaining: number; period: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const frac = remaining / period;
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 -rotate-90" role="img" aria-label={`${remaining} seconds left`}>
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-slate-200 dark:stroke-slate-800" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - frac)}
        className={remaining <= 5 ? 'stroke-amber-500' : 'stroke-emerald-500'}
      />
      <text x="32" y="32" transform="rotate(90 32 32)" textAnchor="middle" dominantBaseline="central" className="fill-slate-700 text-[18px] font-semibold dark:fill-slate-200">
        {remaining}
      </text>
    </svg>
  );
}

export default function TotpGeneratorPage() {
  const [raw, setRaw] = useState('');
  const [type, setType] = useState<OtpType>('totp');
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-1');
  const [digits, setDigits] = useState(6);
  const [period, setPeriod] = useState(30);
  const [counter, setCounter] = useState(0);
  const [issuer, setIssuer] = useState('');
  const [account, setAccount] = useState('');
  const [uriWarnings, setUriWarnings] = useState<string[]>([]);
  const [check, setCheck] = useState('');
  const [windowSize, setWindowSize] = useState(1);
  const now = useNow();

  // A pasted otpauth:// URI fills in every option; anything else is the Base32 secret itself.
  const isUri = /^\s*otpauth:/i.test(raw);
  const parsedUri = useMemo(() => (isUri ? parseOtpauth(raw) : null), [isUri, raw]);
  const secret = parsedUri?.ok ? parsedUri.value.secret : isUri ? '' : raw;

  const onRaw = (v: string) => {
    setRaw(v);
    const p = /^\s*otpauth:/i.test(v) ? parseOtpauth(v) : null;
    setUriWarnings(p?.ok ? p.warnings : []);
    if (p?.ok) {
      setType(p.value.type);
      setAlgorithm(p.value.algorithm);
      setDigits(p.value.digits);
      setPeriod(p.value.period);
      setCounter(p.value.counter);
      setIssuer(p.value.issuer);
      setAccount(p.value.account);
    }
  };

  const key = useMemo(() => {
    if (!secret.trim()) return null;
    try {
      const k = base32Decode(secret);
      return k.length ? { ok: true as const, key: k } : { ok: false as const, error: 'The secret is empty.' };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [secret]);

  const step = type === 'totp' ? timeCounter(now, period) : counter;
  const remaining = secondsRemaining(now, period);

  const [codes, setCodes] = useState<{ prev: string; cur: string; next: string } | null>(null);
  useEffect(() => {
    if (!key?.ok) {
      setCodes(null);
      return;
    }
    let live = true;
    const p = { algorithm, digits };
    void Promise.all([step > 0 ? hotp(key.key, step - 1, p) : Promise.resolve(''), hotp(key.key, step, p), hotp(key.key, step + 1, p)]).then(
      ([prev, cur, next]) => live && setCodes({ prev, cur, next }),
      () => live && setCodes(null),
    );
    return () => {
      live = false;
    };
  }, [key, step, algorithm, digits]);

  const [verdict, setVerdict] = useState<{ code: string; offset: number | null } | null>(null);
  useEffect(() => {
    const c = check.replace(/\s/g, '');
    if (!key?.ok || !c) {
      setVerdict(null);
      return;
    }
    let live = true;
    void verifyCode(key.key, c, step, windowSize, { algorithm, digits }).then((offset) => live && setVerdict({ code: c, offset }));
    return () => {
      live = false;
    };
  }, [key, check, step, windowSize, algorithm, digits]);

  const uri = key?.ok ? buildOtpauth({ type, secret, issuer, account, algorithm, digits, period, counter }) : '';
  const stepWord = type === 'totp' ? 'time step' : 'counter';

  const status = parsedUri && !parsedUri.ok
    ? parsedUri.error
    : !key
      ? 'Paste a Base32 secret or an otpauth:// URI, or generate a new secret.'
      : !key.ok
        ? `Invalid secret: ${key.error}`
        : type === 'totp'
          ? `TOTP · ${algorithm} · ${digits} digits · ${period}s period`
          : `HOTP · ${algorithm} · ${digits} digits · counter ${counter}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={totpGenerator} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="codes">Check your 2FA </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => onRaw(EXAMPLE)}>
            Try an example
          </Button>
          <Button variant="secondary" onClick={() => onRaw(generateSecret())}>
            <Icon name="key" className="h-4 w-4" /> New secret
          </Button>
          <Button variant="ghost" disabled={!raw} onClick={() => onRaw('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
        <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <strong>Secrets stay in this tab.</strong> Codes are computed with your browser&rsquo;s WebCrypto. Nothing is stored, sent or put in the URL, and
          reloading the page forgets the secret. Only use real account secrets on a device you trust.
        </p>
      </div>

      <StatusStrip status={status} tone={key?.ok ? 'good' : 'neutral'} />

      <section aria-label="Secret and options" className="space-y-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <label className="block">
          <span className={label}>Secret (Base32) or otpauth:// URI</span>
          <input
            className={input}
            value={raw}
            onChange={(e) => onRaw(e.target.value)}
            placeholder="JBSW Y3DP EHPK 3PXP"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-invalid={key ? !key.ok : undefined}
          />
        </label>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <Segmented<OtpType>
            label="Type"
            options={[
              { value: 'totp', label: 'TOTP (time)' },
              { value: 'hotp', label: 'HOTP (counter)' },
            ]}
            value={type}
            onChange={setType}
          />
          <div className="w-36">
            <Select<Algorithm> label="Algorithm" options={ALGORITHMS.map((a) => ({ value: a, label: a }))} value={algorithm} onChange={setAlgorithm} />
          </div>
          <Segmented<string>
            label="Digits"
            options={[
              { value: '6', label: '6 digits' },
              { value: '8', label: '8 digits' },
            ]}
            value={String(digits)}
            onChange={(v) => setDigits(Number(v))}
          />
          {type === 'totp' ? (
            <Segmented<string>
              label="Period"
              options={[
                { value: '30', label: '30 s' },
                { value: '60', label: '60 s' },
                ...(period !== 30 && period !== 60 ? [{ value: String(period), label: `${period} s` }] : []),
              ]}
              value={String(period)}
              onChange={(v) => setPeriod(Number(v))}
            />
          ) : (
            <label className="block">
              <span className={label}>Counter</span>
              <input
                type="number"
                min={0}
                className={`${input} w-36`}
                value={counter}
                onChange={(e) => setCounter(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
              />
            </label>
          )}
        </div>
        {type === 'totp' && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Most authenticator apps only support SHA-1, 6 digits and a 30-second period. Codes depend on this device&rsquo;s clock.
          </p>
        )}
      </section>

      <Notices items={uriWarnings} />

      {key?.ok && codes && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section aria-label="Current code" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="eyebrow mb-5 flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="clock" className="h-4 w-4" /> Current code
            </h2>
            <div className="flex flex-wrap items-center gap-5">
              {type === 'totp' && <Ring remaining={remaining} period={period} />}
              <output data-testid="current-code" aria-live="off" className="font-mono text-4xl font-bold tracking-wider text-slate-900 sm:text-5xl dark:text-white">
                {formatCode(codes.cur)}
              </output>
              <CopyButton text={codes.cur} />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Previous {stepWord}</dt>
                <dd className="font-mono text-lg text-slate-700 dark:text-slate-300">{codes.prev ? formatCode(codes.prev) : '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Next {stepWord}</dt>
                <dd className="font-mono text-lg text-slate-700 dark:text-slate-300">{formatCode(codes.next)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              {type === 'totp' ? `Time step ${step.toLocaleString('en-US')} · new code in ${remaining} s` : `Counter ${counter}`}
            </p>
            {type === 'hotp' && (
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setCounter((c) => c + 1)}>
                  Next counter
                </Button>
                <Button variant="ghost" disabled={counter === 0} onClick={() => setCounter((c) => Math.max(0, c - 1))}>
                  Previous
                </Button>
              </div>
            )}
          </section>

          <Panel eyebrow="Verify a code" icon="check">
            <div className="flex flex-wrap items-end gap-4">
              <label className="block min-w-0 flex-1">
                <span className={label}>Code to check</span>
                <input
                  className={`${input} text-lg tracking-widest`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={check}
                  maxLength={12}
                  onChange={(e) => setCheck(e.target.value)}
                  placeholder={'0'.repeat(digits)}
                />
              </label>
              <div className="w-40">
                <Select<number>
                  label="Accept window"
                  options={[0, 1, 2, 3, 5, 10].map((n) => ({ value: n, label: n === 0 ? 'Exact step only' : `± ${n} ${n === 1 ? 'step' : 'steps'}` }))}
                  value={windowSize}
                  onChange={setWindowSize}
                />
              </div>
            </div>
            {verdict && (
              <p
                role="status"
                className={`mt-4 flex items-start gap-2 rounded-2xl p-3 text-sm ${
                  verdict.offset === null
                    ? 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200'
                    : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                }`}
              >
                <Icon name={verdict.offset === null ? 'x' : 'check'} className="mt-0.5 h-4 w-4 shrink-0" />
                {verdict.code.length !== digits
                  ? `Enter ${digits} digits.`
                  : verdict.offset === null
                    ? `No match within ±${windowSize} ${windowSize === 1 ? 'step' : 'steps'}.`
                    : verdict.offset === 0
                      ? `Valid: matches the current ${stepWord}.`
                      : `Valid: matches ${Math.abs(verdict.offset)} ${Math.abs(verdict.offset) === 1 ? 'step' : 'steps'} ${verdict.offset < 0 ? 'behind' : 'ahead'}${type === 'totp' ? ` (${Math.abs(verdict.offset) * period} s of clock drift)` : ''}.`}
              </p>
            )}
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Servers usually accept ±1 step to allow for clock drift and typing time.</p>
          </Panel>
        </div>
      )}

      {key?.ok && (
        <Panel eyebrow="otpauth:// URI" icon="link">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Issuer</span>
              <input className={input} value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="ACME Co" autoComplete="off" />
            </label>
            <label className="block">
              <span className={label}>Account</span>
              <input className={input} value={account} onChange={(e) => setAccount(e.target.value)} placeholder="alice@example.com" autoComplete="off" />
            </label>
          </div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Secret: <span className="break-all font-mono text-slate-900 dark:text-slate-100">{groupSecret(secret)}</span> ({key.key.length * 8}-bit)
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <h3 className="eyebrow text-slate-600 dark:text-slate-400">URI for authenticator apps</h3>
            <CopyButton text={uri} />
          </div>
          <CodeBlock className="mt-2">{uri}</CodeBlock>
        </Panel>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Implements RFC 6238 (TOTP) and RFC 4226 (HOTP) with HMAC-SHA-1, SHA-256 or SHA-512. Use it to test a two-factor login you&rsquo;re building, or to
        check why codes don&rsquo;t match (wrong period, digits, algorithm or clock drift).
      </p>
    </div>
  );
}
