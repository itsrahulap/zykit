import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import jwtGenerator from './index';
import { ColouredToken } from '../jwt-decoder/components/ColouredToken';
import {
  ALGORITHMS,
  algInfo,
  describeAlg,
  generateKeyPair,
  nowSeconds,
  parseJsonObject,
  randomJti,
  secondsFromNow,
  setClaims,
  signJwt,
  SignError,
  supportsEd25519,
  type Alg,
  type DurationUnit,
  type KeyPair,
} from './features/sign';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { sendText } from '../../shared/lib/handoff';
import { Checkbox, Notices } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { SendToMenu } from '../../shared/ui/SendToMenu';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';

const card = 'min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900';
const input =
  'block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
const smallBtn = 'pointer-coarse:min-h-11 !px-3 !py-2 !text-sm';

const initialPayload = () =>
  JSON.stringify({ sub: '1234567890', name: 'Test User', iat: nowSeconds(), exp: secondsFromNow(1, 'hours') }, null, 2);

type Output = { token: string; warnings: string[] } | { error: string } | null;

function KeyBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="eyebrow text-slate-600 dark:text-slate-400">{title}</h3>
        <CopyButton text={text} label="Copy" />
      </div>
      <CodeBlock className="max-h-48 overflow-y-auto text-xs">{text}</CodeBlock>
    </div>
  );
}

export default function JwtGeneratorPage() {
  const [alg, setAlg] = useState<Alg>('HS256');
  const [edOk, setEdOk] = useState(false);
  const [header, setHeader] = useState(() => JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2));
  const [payload, setPayload] = useState(initialPayload);
  const [secret, setSecret] = useState(() => randomJti() + randomJti());
  const [secretB64, setSecretB64] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [pair, setPair] = useState<(KeyPair & { alg: Alg }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Output>(null);
  const [claimError, setClaimError] = useState('');
  const [expAmount, setExpAmount] = useState('1');
  const [expUnit, setExpUnit] = useState<DurationUnit>('hours');
  const [iss, setIss] = useState('');
  const [aud, setAud] = useState('');

  const info = algInfo(alg);
  const isHmac = info.family === 'HS';

  useEffect(() => {
    supportsEd25519().then(setEdOk, () => setEdOk(false));
  }, []);

  // Sign whenever the inputs change.
  useEffect(() => {
    let live = true;
    const t = setTimeout(async () => {
      try {
        const h = parseJsonObject(header, 'Header');
        const p = parseJsonObject(payload, 'Payload');
        const r = await signJwt(h, p, alg, isHmac ? { kind: 'secret', secret, base64: secretB64 } : { kind: 'private', text: privateKey });
        if (live) setOut(r);
      } catch (e) {
        if (live) setOut({ error: e instanceof SignError ? e.message : 'The token could not be signed with this key.' });
      }
    }, 150);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [header, payload, alg, secret, secretB64, privateKey, isHmac]);

  const changeAlg = (a: Alg) => {
    setAlg(a);
    try {
      setHeader(JSON.stringify({ ...parseJsonObject(header, 'Header'), alg: a }, null, 2));
    } catch {
      /* leave an invalid header for the user to fix */
    }
    const prev = algInfo(alg);
    const next = algInfo(a);
    const sameKeyType = (prev.family === next.family || (['RS', 'PS'].includes(prev.family) && ['RS', 'PS'].includes(next.family))) && prev.curve === next.curve;
    if (!sameKeyType) {
      setPair(null);
      setPrivateKey('');
    }
  };

  const applyClaims = (claims: Record<string, unknown>) => {
    try {
      setPayload(setClaims(payload, claims));
      setClaimError('');
    } catch (e) {
      setClaimError((e as Error).message);
    }
  };

  const generate = async () => {
    setBusy(true);
    try {
      const kp = await generateKeyPair(alg);
      setPair({ ...kp, alg });
      setPrivateKey(kp.privatePem);
    } catch (e) {
      setOut({ error: e instanceof SignError ? e.message : 'Key generation failed.' });
    } finally {
      setBusy(false);
    }
  };

  const token = out && 'token' in out ? out.token : '';
  useToolShortcuts({ getOutput: () => token });
  const options = ALGORITHMS.filter((a) => a !== 'EdDSA' || edOk).map((a) => ({ value: a, label: `${a} · ${describeAlg(a)}` }));

  return (
    <div className="space-y-8">
      <Breadcrumb tool={jwtGenerator} />
      <Headline accent="token">Sign a test </Headline>
      <StatusStrip status={token ? `Signed ${alg} token, ${token.length} characters.` : out && 'error' in out ? 'Not signed yet: check the message below.' : 'Signing…'} tone={token ? 'good' : 'neutral'} />

      <section className={card}>
        <div className="max-w-md">
          <Select label="Algorithm" options={options} value={alg} onChange={changeAlg} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <CodeArea label="Header" rows={6} value={header} onChange={(e) => setHeader(e.target.value)} className="break-all" />
          <CodeArea label="Payload" rows={10} value={payload} onChange={(e) => setPayload(e.target.value)} className="break-all" />
        </div>

        <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
          <h2 className="eyebrow text-slate-600 dark:text-slate-400">Claim helpers</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" className={smallBtn} onClick={() => applyClaims({ iat: nowSeconds() })}>
              iat = now
            </Button>
            <Button variant="secondary" className={smallBtn} onClick={() => applyClaims({ nbf: nowSeconds() })}>
              nbf = now
            </Button>
            <Button variant="secondary" className={smallBtn} onClick={() => applyClaims({ jti: randomJti() })}>
              Random jti
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="w-24">
              <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Expires in</span>
              <input className={input} inputMode="decimal" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} aria-label="Expiry amount" />
            </label>
            <div className="w-36">
              <Select
                label="Unit"
                options={[
                  { value: 'minutes', label: 'minutes' },
                  { value: 'hours', label: 'hours' },
                  { value: 'days', label: 'days' },
                ]}
                value={expUnit}
                onChange={setExpUnit}
              />
            </div>
            <Button
              variant="secondary"
              className={smallBtn}
              onClick={() => {
                const n = Number(expAmount);
                if (!Number.isFinite(n) || n < 0) return setClaimError('Enter a positive number for the expiry.');
                applyClaims({ exp: secondsFromNow(n, expUnit) });
              }}
            >
              Set exp
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="min-w-0">
              <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Issuer (iss)</span>
              <input className={input} value={iss} onChange={(e) => setIss(e.target.value)} placeholder="https://auth.example.com" />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Audience (aud)</span>
              <input className={input} value={aud} onChange={(e) => setAud(e.target.value)} placeholder="my-api" />
            </label>
            <Button
              variant="secondary"
              className={smallBtn}
              disabled={!iss && !aud}
              onClick={() => applyClaims({ ...(iss ? { iss } : {}), ...(aud ? { aud } : {}) })}
            >
              Set iss / aud
            </Button>
          </div>
          {claimError && <p className="text-sm text-red-700 dark:text-red-300">{claimError}</p>}
        </div>
      </section>

      <section className={card} aria-label="Signing key">
        <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Icon name="key" className="h-4 w-4" /> {isHmac ? 'Secret' : 'Private key'}
        </h2>
        {isHmac ? (
          <>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Secret ({alg})</span>
              <input className={input} value={secret} onChange={(e) => setSecret(e.target.value)} autoComplete="off" spellCheck={false} />
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <Checkbox label="Secret is Base64" checked={secretB64} onChange={setSecretB64} />
              <Button
                variant="ghost"
                className={smallBtn}
                onClick={() => {
                  setSecretB64(false);
                  setSecret(randomJti() + randomJti() + (info.bytes > 32 ? randomJti() + randomJti() : ''));
                }}
              >
                Random secret
              </Button>
            </div>
          </>
        ) : (
          <>
            <CodeArea
              label={`Private key (${alg})`}
              hint="PKCS#8 PEM or JWK"
              rows={6}
              value={privateKey}
              onChange={(e) => {
                setPrivateKey(e.target.value);
                setPair(null);
              }}
              placeholder="-----BEGIN PRIVATE KEY-----"
              className="break-all"
            />
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" className="pointer-coarse:min-h-11" onClick={generate} disabled={busy}>
                {busy ? 'Generating…' : `Generate ${info.family === 'ES' ? info.curve : info.family === 'Ed' ? 'Ed25519' : 'RSA 2048'} key pair`}
              </Button>
            </div>
            {pair && pair.alg === alg && (
              <div className="space-y-4">
                <Notices items={['Generated in your browser. Treat it as a test key: anyone who sees the private key can sign tokens with it. It is not saved anywhere.']} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <KeyBlock title="Public key (PEM)" text={pair.publicPem} />
                  <KeyBlock title="Public key (JWK)" text={pair.publicJwk} />
                  <KeyBlock title="Private key (PEM, PKCS#8)" text={pair.privatePem} />
                  <KeyBlock title="Private key (JWK)" text={pair.privateJwk} />
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className={card} aria-label="Signed token" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="eyebrow text-slate-600 dark:text-slate-400">Signed token</h2>
          <div className="flex flex-wrap items-center gap-1">
            <CopyButton text={token} label="Copy token" />
            <SendToMenu text={token} kind="jwt" />
            {token && (
              <Link
                to="/tools/jwt-decoder"
                // Storage blocked: the decoder simply opens empty.
                onClick={() => sendText({ to: 'jwt-decoder', text: token, from: jwtGenerator.id, kind: 'jwt' })}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-emerald-700 pointer-coarse:min-h-11 hover:bg-slate-100 dark:text-emerald-400 dark:hover:bg-slate-800"
              >
                <Icon name="arrow" className="h-4 w-4" /> Open in JWT Decoder
              </Link>
            )}
          </div>
        </div>
        {out && 'error' in out && (
          <p role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
            <Icon name="warn" className="h-5 w-5 shrink-0" />
            <span className="min-w-0 break-words">{out.error}</span>
          </p>
        )}
        {token && <ColouredToken parts={token.split('.')} />}
        {out && 'warnings' in out && <Notices items={out.warnings} />}
      </section>

      <Panel eyebrow="About" icon="info">
        <p className="text-slate-600 dark:text-slate-400">
          Tokens are signed in your browser with WebCrypto. The header's <code className="font-mono">alg</code> always follows the algorithm
          you pick. For RSA and ECDSA, verify the result with the public key; for HMAC, with the same secret.
        </p>
      </Panel>
    </div>
  );
}
