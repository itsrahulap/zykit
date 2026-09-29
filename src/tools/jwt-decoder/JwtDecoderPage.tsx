import { useEffect, useMemo, useState } from 'react';
import jwtDecoder from './index';
import { ClaimsPanel } from './components/ClaimsPanel';
import { ColouredToken } from './components/ColouredToken';
import { VerifyPanel } from './components/VerifyPanel';
import { relativeTime, tokenStatus } from './features/claims';
import { cleanToken, decodeJwt, EXAMPLE_SECRET, EXAMPLE_TOKEN, JwtError, type DecodedJwt } from './features/jwt';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';

type Decoded = { ok: true; jwt: DecodedJwt } | { ok: false; error: string };

function decode(input: string): Decoded | null {
  if (!input.trim()) return null;
  try {
    return { ok: true, jwt: decodeJwt(input) };
  } catch (e) {
    return { ok: false, error: e instanceof JwtError ? e.message : 'This token could not be decoded.' };
  }
}

function JsonPanel({ title, value, colour }: { title: string; value: object; colour: string }) {
  const json = JSON.stringify(value, null, 2);
  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={`eyebrow ${colour}`}>{title}</h2>
        <CopyButton text={json} label={`Copy ${title.toLowerCase()}`} />
      </div>
      <CodeBlock>{json}</CodeBlock>
    </section>
  );
}

/** Re-renders every 30 s so relative times and the status stay current. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function JwtDecoderPage() {
  const [input, setInput] = useState('');
  const now = useNow();
  const decoded = useMemo(() => decode(input), [input]);
  const jwt = decoded?.ok ? decoded.jwt : null;
  const isExample = cleanToken(input) === EXAMPLE_TOKEN;

  let status = 'Paste a JSON Web Token to decode it.';
  let tone: 'neutral' | 'good' = 'neutral';
  if (decoded && !decoded.ok) status = "Couldn't decode this token.";
  if (jwt) {
    const s = tokenStatus(jwt.payload, now);
    const exp = typeof jwt.payload.exp === 'number' ? relativeTime(jwt.payload.exp * 1000, now) : null;
    status = `Decoded ${jwt.alg ?? 'unknown-algorithm'} token. ${
      s === 'expired' ? `Expired ${exp}.` : s === 'not-yet-valid' ? 'Not valid yet.' : exp ? `Valid, expires ${exp}.` : 'No expiry.'
    }`;
    tone = s === 'valid' ? 'good' : 'neutral';
  }

  return (
    <div className="space-y-8">
      <Breadcrumb tool={jwtDecoder} />
      <Headline accent="token">Look inside your </Headline>
      <StatusStrip status={status} tone={tone} />

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <CodeArea
          label="Encoded token"
          hint="A “Bearer ” prefix is fine"
          rows={5}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="eyJhbGciOi…"
          aria-invalid={decoded ? !decoded.ok : undefined}
          aria-describedby={decoded && !decoded.ok ? 'jwt-error' : undefined}
          className="break-all"
        />
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(EXAMPLE_TOKEN)}>
            Load example
          </Button>
          <Button variant="ghost" onClick={() => setInput('')} disabled={!input}>
            Clear
          </Button>
        </div>
        {input.trim() && <ColouredToken parts={cleanToken(input).split('.')} />}
        <div aria-live="polite">
          {decoded && !decoded.ok && (
            <p id="jwt-error" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
              <Icon name="warn" className="h-5 w-5 shrink-0" />
              <span className="min-w-0 break-words">{decoded.error}</span>
            </p>
          )}
        </div>
      </section>

      {jwt && (
        <>
          {jwt.warnings.length > 0 && (
            <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <ul className="space-y-1">
                {jwt.warnings.map((w) => (
                  <li key={w} className="flex items-start gap-2">
                    <Icon name="warn" className="h-4 w-4 shrink-0" /> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            <JsonPanel title="Header" value={jwt.header} colour="text-rose-600 dark:text-rose-400" />
            <JsonPanel title="Payload" value={jwt.payload} colour="text-violet-600 dark:text-violet-400" />
          </div>
          <ClaimsPanel payload={jwt.payload} now={now} />
          {/* Remount when the algorithm changes; the key is kept while editing the same kind of token. */}
          <VerifyPanel key={jwt.alg ?? ''} jwt={jwt} exampleSecret={isExample ? EXAMPLE_SECRET : undefined} />
        </>
      )}

      {!input.trim() && (
        <Panel eyebrow="About JWTs" icon="info">
          <p className="text-slate-600 dark:text-slate-400">
            A JSON Web Token is three Base64URL segments: a header, a payload of claims and a signature. Anyone can read the first two,
            so decoding proves nothing. Only a valid signature shows the token came from someone holding the key. Try{' '}
            <strong className="font-semibold text-slate-800 dark:text-slate-200">Load example</strong>; its secret is{' '}
            <code className="font-mono">{EXAMPLE_SECRET}</code>.
          </p>
        </Panel>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Tokens and keys are processed in your browser and never uploaded. Still, treat production tokens like passwords.
      </p>
    </div>
  );
}
