import { useEffect, useId, useMemo, useState } from 'react';
import webhookPayloadBuilder from './index';
import { buildRequest, hasProblems, PRESETS, samplePayload, sign, validate, type EventPreset, type Signature, type Style } from './features/webhook-payload-builder';
import { toCurl } from '../curl-converter/features/fetch';
import { generate } from '../curl-converter/features/generate';
import { ErrorPanel } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { downloadText } from '../../shared/utils/dom.utils';

const card = 'rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const inputCls =
  'w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 aria-[invalid=true]:border-red-500 dark:bg-slate-950 dark:text-slate-100';
const BODY_ID = 'webhook-body';

function Input({ label, value, onChange, error, hint, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; type?: string }) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input id={id} type={type} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} autoComplete="off" aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-n` : undefined} />
      {(error || hint) && (
        <p id={`${id}-n`} className={`text-xs ${error ? 'text-red-700 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

function Code({ title, text }: { title: string; text: string }) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="eyebrow text-slate-600 dark:text-slate-400">{title}</h3>
        <CopyButton text={text} />
      </div>
      <CodeBlock label={title} className="max-h-72 overflow-y-auto">
        {text}
      </CodeBlock>
    </div>
  );
}

export default function WebhookPayloadBuilderPage() {
  const [preset, setPreset] = useState<EventPreset>('user.created');
  const [event, setEvent] = useState<string>('user.created');
  const [method, setMethod] = useState('POST');
  const [url, setUrl] = useState('http://localhost:3000/webhooks');
  const [headers, setHeaders] = useState<[string, string][]>([['User-Agent', 'Zykit-Webhook-Test/1.0']]);
  const [body, setBody] = useState(() => samplePayload('user.created', new Date()));
  const [style, setStyle] = useState<Style>('github');
  const [secret, setSecret] = useState('whsec_test_change_me');
  const [unix, setUnix] = useState(() => Math.floor(Date.now() / 1000));
  const [signature, setSignature] = useState<{ for: string; sig: Signature } | null>(null);

  const problems = useMemo(() => validate(url, event, headers, body), [url, event, headers, body]);
  const signKey = `${style}\u0000${secret}\u0000${body}\u0000${unix}`;
  useEffect(() => {
    if (style === 'none') return;
    let live = true;
    void sign(style, secret, body, unix).then((sig) => live && setSignature({ for: signKey, sig }));
    return () => {
      live = false;
    };
  }, [style, secret, body, unix, signKey]);
  const sig = style !== 'none' && signature?.for === signKey ? signature.sig : null;
  const ready = !hasProblems(problems) && (style === 'none' || sig !== null);
  const req = ready ? buildRequest({ method, url, headers, body, style, event, signature: sig }) : null;

  const choose = (p: EventPreset) => {
    setPreset(p);
    const name = p === 'custom' ? 'thing.happened' : p;
    setEvent(name);
    setBody(samplePayload(p, new Date(), name));
  };
  const setHeader = (i: number, k: 0 | 1, v: string) => setHeaders((h) => h.map((row, j) => (j === i ? ((k === 0 ? [v, row[1]] : [row[0], v]) as [string, string]) : row)));

  return (
    <div className="space-y-8">
      <Breadcrumb tool={webhookPayloadBuilder} />
      <div className="space-y-3">
        <Headline accent="webhook payloads">Build and sign test </Headline>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">Pick an event, edit the JSON, sign it like your provider does, and copy a cURL command to send it to your local server.</p>
      </div>
      <StatusStrip status={req ? `${method} ${url} · ${style === 'none' ? 'unsigned' : `signed (${style})`}` : 'Fix the highlighted fields to build the request.'} tone={req ? 'good' : 'neutral'} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <section aria-label="Event" className={`space-y-4 ${card}`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select<EventPreset> label="Sample event" options={PRESETS} value={preset} onChange={choose} />
              <Input label="Event name" value={event} onChange={setEvent} error={problems.event} />
            </div>
            <Segmented
              label="Method"
              options={['POST', 'PUT', 'PATCH'].map((m) => ({ value: m, label: m }))}
              value={method}
              onChange={setMethod}
            />
            <Input label="Endpoint URL" value={url} onChange={setUrl} error={problems.url} hint="Your receiver, for example a local dev server." />
          </section>

          <section aria-label="Headers" className={`space-y-3 ${card}`}>
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">Extra headers</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Content-Type, the event header and the signature header are added for you.</p>
            {headers.map(([n, v], i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input aria-label={`Header ${i + 1} name`} className={`${inputCls} flex-1 basis-32`} value={n} onChange={(e) => setHeader(i, 0, e.target.value)} placeholder="Name" spellCheck={false} />
                <input aria-label={`Header ${i + 1} value`} className={`${inputCls} flex-[2] basis-40`} value={v} onChange={(e) => setHeader(i, 1, e.target.value)} placeholder="Value" spellCheck={false} />
                <Button variant="ghost" aria-label={`Remove header ${i + 1}`} onClick={() => setHeaders((h) => h.filter((_, j) => j !== i))}>
                  <Icon name="x" className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {problems.headers.map((m) => (
              <p key={m} className="text-xs text-red-700 dark:text-red-400">
                {m}
              </p>
            ))}
            <Button variant="secondary" onClick={() => setHeaders((h) => [...h, ['', '']])}>
              Add header
            </Button>
          </section>

          <section aria-label="Signature" className={`space-y-4 ${card}`}>
            <Segmented<Style>
              label="Signature"
              options={[
                { value: 'github', label: 'GitHub style' },
                { value: 'stripe', label: 'Stripe style' },
                { value: 'generic', label: 'Generic' },
                { value: 'none', label: 'None' },
              ]}
              value={style}
              onChange={setStyle}
            />
            {style !== 'none' && (
              <>
                <Input label="Test secret" value={secret} onChange={setSecret} hint="Use a throwaway test secret, never a production one." />
                {style === 'stripe' && (
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span>
                      Timestamp: <code>{unix}</code>
                    </span>
                    <Button variant="secondary" onClick={() => setUnix(Math.floor(Date.now() / 1000))}>
                      Use current time
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <CodeArea id={BODY_ID} label="JSON body" value={body} onChange={(e) => setBody(e.target.value)} rows={16} aria-invalid={problems.body ? true : undefined} />
          {problems.body && <ErrorPanel error={problems.body} text={body} inputId={BODY_ID} fieldId={BODY_ID} title="JSON error" />}
        </div>
      </div>

      {req && (
        <section aria-label="Request" className={`space-y-6 ${card}`}>
          {sig && (
            <div className="space-y-3">
              <h2 className="eyebrow text-slate-600 dark:text-slate-400">Signature</h2>
              <p className="break-all font-mono text-sm text-slate-900 dark:text-slate-100">
                {sig.header[0]}: {sig.header[1]}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                HMAC-SHA256 with your test secret over {style === 'stripe' ? 'the timestamp, a dot and the raw body' : 'the raw body, byte for byte'}. Your receiver must verify the exact bytes it received, before parsing the JSON.
              </p>
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            <Code title="cURL" text={toCurl(req)} />
            <Code title="fetch (Node 18+)" text={generate(req, 'node').code} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => downloadText(body.endsWith('\n') ? body : `${body}\n`, `${event.replace(/[^\w.-]+/g, '_')}.json`, 'application/json')}>
              <Icon name="download" className="h-4 w-4" /> Download fixture JSON
            </Button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This page can’t send the request itself: its security policy blocks connections to other sites. Run the cURL command in your terminal instead.
          </p>
        </section>
      )}
    </div>
  );
}
