import { useEffect, useMemo, useState } from 'react';
import { JwtError, type DecodedJwt } from '../features/jwt';
import { keyKindFor, verifyJwt, type VerifyKey } from '../features/verify';
import { Panel } from '../../../shared/ui/Panel';
import { CodeArea } from '../../../shared/ui/tool';
import { Icon } from '../../../shared/ui/ui';

type Outcome = { for: string; result: 'valid' | 'invalid' | 'error'; message?: string };

const inputClass =
  'block w-full rounded-2xl border border-field-edge bg-white px-4 py-3 font-mono text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-900 dark:text-slate-100';

export function VerifyPanel({ jwt, exampleSecret }: { jwt: DecodedJwt; exampleSecret?: string }) {
  const [secret, setSecret] = useState('');
  const [base64, setBase64] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const kind = keyKindFor(jwt.alg);
  const key = useMemo<VerifyKey | null>(
    () => (kind === 'secret' ? { kind, secret, base64 } : kind === 'public' ? { kind, text: publicKey } : null),
    [kind, secret, base64, publicKey],
  );
  const hasKey = kind === 'secret' ? !!secret : !!publicKey.trim();
  const id = key && hasKey ? JSON.stringify([jwt.signingInput, jwt.parts[2], key]) : null;

  // Verify as the key is typed; each result is tagged so stale ones are ignored.
  useEffect(() => {
    if (!id || !key) return;
    let cancelled = false;
    const t = setTimeout(() => {
      verifyJwt(jwt, key).then(
        (ok) => !cancelled && setOutcome({ for: id, result: ok ? 'valid' : 'invalid' }),
        (e) => !cancelled && setOutcome({ for: id, result: 'error', message: e instanceof JwtError ? e.message : 'Verification failed in this browser.' }),
      );
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [id, jwt, key]);

  const current = outcome && outcome.for === id ? outcome : null;

  return (
    <Panel eyebrow="Verify signature" icon="shield">
      <p className="mb-5 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0" />
        Verification runs locally with the Web Crypto API. Your key never leaves this device.
      </p>

      {!kind ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {jwt.alg?.toLowerCase() === 'none'
            ? 'This token is unsigned, so there is nothing to verify.'
            : `Algorithm "${jwt.alg ?? 'missing'}" isn't supported. Supported: HS, RS, PS and ES with 256, 384 or 512.`}
        </p>
      ) : kind === 'secret' ? (
        <div className="space-y-3">
          <label className="block">
            <span className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Secret ({jwt.alg})</span>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              placeholder="Shared secret"
              className={inputClass}
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm pointer-coarse:min-h-11 text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={base64} onChange={(e) => setBase64(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
              Secret is Base64
            </label>
            {exampleSecret && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Example secret: <code className="font-mono text-slate-700 dark:text-slate-300">{exampleSecret}</code>{' '}
                <button
                  type="button"
                  onClick={() => {
                    setSecret(exampleSecret);
                    setBase64(false);
                  }}
                  className="font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
                >
                  Use it
                </button>
              </p>
            )}
          </div>
        </div>
      ) : (
        <CodeArea
          label={`Public key (${jwt.alg})`}
          hint="PEM (BEGIN PUBLIC KEY) or JWK"
          rows={6}
          value={publicKey}
          onChange={(e) => setPublicKey(e.target.value)}
          placeholder={'-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----'}
        />
      )}

      <div aria-live="polite" className="mt-5">
        {current?.result === 'valid' && (
          <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Icon name="check" className="h-5 w-5 shrink-0" /> Signature verified
          </p>
        )}
        {current?.result === 'invalid' && (
          <p className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800 dark:bg-red-950/50 dark:text-red-300">
            <Icon name="x" className="h-5 w-5 shrink-0" /> Invalid signature
          </p>
        )}
        {current?.result === 'error' && (
          <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <Icon name="warn" className="h-5 w-5 shrink-0" /> <span className="min-w-0 break-words">{current.message}</span>
          </p>
        )}
      </div>
    </Panel>
  );
}
