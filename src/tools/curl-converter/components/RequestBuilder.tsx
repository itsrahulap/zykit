// Form-based request builder: method, URL, query params, headers, auth and body, with live cURL /
// fetch / axios / Python output. Built requests are never sent (connect-src 'self').

import { useId, useMemo, useState } from 'react';
import { builderStateToRequest, createId, isJsonValid, type AuthType, type BodyType, type KeyValueParam, type MultipartPart, type RequestBuilderState } from '../features/request-builder';
import { toCurl } from '../features/fetch';
import { credentialHeaders, generate, type Target } from '../features/generate';
import { Checkbox } from '../../../shared/ui/convert';
import { Select } from '../../../shared/ui/Select';
import { Tabs } from '../../../shared/ui/Tabs';
import { CodeArea, CodeBlock, CopyButton, Segmented } from '../../../shared/ui/tool';
import { Button, Icon } from '../../../shared/ui/ui';

type SubTab = 'query' | 'headers' | 'auth' | 'body' | 'settings';
type Output = 'curl' | Target;

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((m) => ({ value: m, label: m }));
const OUTPUTS: { value: Output; label: string }[] = [
  { value: 'curl', label: 'cURL' },
  { value: 'fetch', label: 'fetch' },
  { value: 'node', label: 'Node.js' },
  { value: 'axios', label: 'axios' },
  { value: 'python', label: 'Python' },
];
const card = 'min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const field =
  'min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-950 dark:text-slate-100';
const label = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';
const hint = 'text-xs text-slate-500 dark:text-slate-400';

/** Editable key/value rows with an on/off switch, used for query params, headers and form fields. */
function PairRows({ noun, rows, onChange }: { noun: string; rows: KeyValueParam[]; onChange: (rows: KeyValueParam[]) => void }) {
  const patch = (id: string, p: Partial<KeyValueParam>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...p } : r)));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.id} className="flex flex-wrap items-center gap-2">
          <input type="checkbox" aria-label={`Include ${noun} ${i + 1}`} checked={r.enabled} onChange={(e) => patch(r.id, { enabled: e.target.checked })} className="h-4 w-4 accent-emerald-600" />
          <input aria-label={`${noun} ${i + 1} name`} value={r.key} onChange={(e) => patch(r.id, { key: e.target.value })} placeholder="name" spellCheck={false} className={`${field} w-32 sm:w-44`} />
          <input aria-label={`${noun} ${i + 1} value`} value={r.value} onChange={(e) => patch(r.id, { value: e.target.value })} placeholder="value" spellCheck={false} className={`${field} flex-1 basis-40`} />
          <Button variant="ghost" aria-label={`Remove ${noun} ${i + 1}`} onClick={() => onChange(rows.filter((x) => x.id !== r.id))}>
            <Icon name="x" className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...rows, { id: createId(), key: '', value: '', enabled: true }])}>
        <Icon name="plus" className="h-4 w-4" /> Add {noun}
      </Button>
    </div>
  );
}

/** A password-style input with a Reveal toggle; secrets are hidden until asked. */
function Secret({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) {
  const [shown, setShown] = useState(false);
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={label}>
        {name}
      </label>
      <div className="flex items-center gap-2">
        <input id={id} type={shown ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" spellCheck={false} className={`${field} flex-1`} />
        <Button variant="ghost" aria-pressed={shown} aria-label={`${shown ? 'Hide' : 'Reveal'} ${name.toLowerCase()}`} onClick={() => setShown(!shown)}>
          {shown ? 'Hide' : 'Reveal'}
        </Button>
      </div>
    </div>
  );
}

function TextInput({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className={label}>
      {name}
      <input value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} autoComplete="off" className={`${field} mt-1 w-full`} />
    </label>
  );
}

export function RequestBuilder({ state, onChange, onSendToConverter }: { state: RequestBuilderState; onChange: (next: RequestBuilderState) => void; onSendToConverter?: (curl: string) => void }) {
  const [tab, setTab] = useState<SubTab>('query');
  const [output, setOutput] = useState<Output>('curl');
  const update = (patch: Partial<RequestBuilderState>) => onChange({ ...state, ...patch });

  const req = useMemo(() => builderStateToRequest(state), [state]);
  const code = useMemo(() => (output === 'curl' ? toCurl(req) : generate(req, output).code), [req, output]);
  const secrets = credentialHeaders(req);
  const jsonValid = isJsonValid(state.jsonBody);
  const setPart = (id: string, p: Partial<MultipartPart>) => update({ multipartBody: state.multipartBody.map((x) => (x.id === id ? { ...x, ...p } : x)) });

  const tabs: { id: SubTab; label: string }[] = [
    { id: 'query', label: `Query (${state.queryParams.length})` },
    { id: 'headers', label: `Headers (${state.headers.length})` },
    { id: 'auth', label: 'Auth' },
    { id: 'body', label: 'Body' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-6">
      <section aria-label="Method and URL" className={card}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-36">
            <Select label="Method" options={METHODS} value={state.method} onChange={(method) => update({ method })} />
          </div>
          <label className={`${label} min-w-0 flex-1`}>
            URL
            <input value={state.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://api.example.com/v1/items" spellCheck={false} autoComplete="off" className={`${field} mt-1 w-full`} />
          </label>
        </div>
        {req.url !== state.url && (
          <p className="mt-2 break-all font-mono text-xs text-slate-600 dark:text-slate-400">
            <span className="font-sans font-semibold">Full URL:</span> {req.url}
          </p>
        )}
      </section>

      <section aria-label="Request parts" className={`${card} space-y-4`}>
        <Tabs tabs={tabs} active={tab} onChange={setTab} label="Request parts" />
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="space-y-4">
          {tab === 'query' && (
            <>
              <p className={hint}>Parameters are URL-encoded and appended to the URL.</p>
              <PairRows noun="parameter" rows={state.queryParams} onChange={(queryParams) => update({ queryParams })} />
            </>
          )}
          {tab === 'headers' && (
            <>
              <p className={hint}>Authorization and Content-Type are added from the Auth and Body tabs unless you set them here.</p>
              <PairRows noun="header" rows={state.headers} onChange={(headers) => update({ headers })} />
            </>
          )}
          {tab === 'auth' && (
            <>
              <Segmented<AuthType>
                label="Auth type"
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'bearer', label: 'Bearer' },
                  { value: 'basic', label: 'Basic' },
                  { value: 'apiKey', label: 'API key' },
                ]}
                value={state.authType}
                onChange={(authType) => update({ authType })}
              />
              {state.authType === 'bearer' && <Secret name="Token" value={state.bearerToken} onChange={(bearerToken) => update({ bearerToken })} />}
              {state.authType === 'basic' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput name="Username" value={state.basicUser} onChange={(basicUser) => update({ basicUser })} />
                  <Secret name="Password" value={state.basicPassword} onChange={(basicPassword) => update({ basicPassword })} />
                </div>
              )}
              {state.authType === 'apiKey' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput name="Key name" value={state.apiKeyName} onChange={(apiKeyName) => update({ apiKeyName })} />
                  <Secret name="Key value" value={state.apiKeyValue} onChange={(apiKeyValue) => update({ apiKeyValue })} />
                  <Segmented<'header' | 'query'>
                    label="Send key in"
                    options={[
                      { value: 'header', label: 'Header' },
                      { value: 'query', label: 'Query string' },
                    ]}
                    value={state.apiKeyPlacement}
                    onChange={(apiKeyPlacement) => update({ apiKeyPlacement })}
                  />
                </div>
              )}
            </>
          )}
          {tab === 'body' && (
            <>
              <Segmented<BodyType>
                label="Body type"
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'json', label: 'JSON' },
                  { value: 'text', label: 'Text' },
                  { value: 'form', label: 'Form' },
                  { value: 'multipart', label: 'Multipart' },
                ]}
                value={state.bodyType}
                onChange={(bodyType) => update({ bodyType })}
              />
              {state.bodyType === 'json' && (
                <>
                  <CodeArea label="JSON body" hint={jsonValid ? 'valid JSON' : 'not valid JSON yet'} value={state.jsonBody} onChange={(e) => update({ jsonBody: e.target.value })} rows={8} aria-invalid={jsonValid ? undefined : true} />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" disabled={!jsonValid} onClick={() => update({ jsonBody: JSON.stringify(JSON.parse(state.jsonBody), null, 2) })}>
                      Format
                    </Button>
                    <Button variant="secondary" disabled={!jsonValid} onClick={() => update({ jsonBody: JSON.stringify(JSON.parse(state.jsonBody)) })}>
                      Minify
                    </Button>
                  </div>
                </>
              )}
              {state.bodyType === 'text' && <CodeArea label="Text body" value={state.textBody} onChange={(e) => update({ textBody: e.target.value })} rows={8} />}
              {state.bodyType === 'form' && <PairRows noun="field" rows={state.formBody} onChange={(formBody) => update({ formBody })} />}
              {state.bodyType === 'multipart' && (
                <div className="space-y-2">
                  <p className={hint}>File parts are placeholders: the command refers to the file path, nothing is read here.</p>
                  {state.multipartBody.map((p, i) => (
                    <div key={p.id} className="flex flex-wrap items-end gap-2">
                      <input type="checkbox" aria-label={`Include part ${i + 1}`} checked={p.enabled} onChange={(e) => setPart(p.id, { enabled: e.target.checked })} className="mb-3 h-4 w-4 accent-emerald-600" />
                      <div className="w-28">
                        <Select<'text' | 'file'>
                          label={`Part ${i + 1} type`}
                          options={[
                            { value: 'text', label: 'Text' },
                            { value: 'file', label: 'File' },
                          ]}
                          value={p.type}
                          onChange={(type) => setPart(p.id, { type })}
                        />
                      </div>
                      <input aria-label={`Part ${i + 1} name`} value={p.name} onChange={(e) => setPart(p.id, { name: e.target.value })} placeholder="name" spellCheck={false} className={`${field} w-32`} />
                      <input aria-label={`Part ${i + 1} ${p.type === 'file' ? 'file path' : 'value'}`} value={p.value} onChange={(e) => setPart(p.id, { value: e.target.value })} placeholder={p.type === 'file' ? 'photo.jpg' : 'value'} spellCheck={false} className={`${field} flex-1 basis-40`} />
                      <Button variant="ghost" aria-label={`Remove part ${i + 1}`} onClick={() => update({ multipartBody: state.multipartBody.filter((x) => x.id !== p.id) })}>
                        <Icon name="x" className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="secondary" onClick={() => update({ multipartBody: [...state.multipartBody, { id: createId(), name: '', type: 'text', value: '', enabled: true }] })}>
                    <Icon name="plus" className="h-4 w-4" /> Add part
                  </Button>
                </div>
              )}
            </>
          )}
          {tab === 'settings' && (
            <div className="flex flex-col gap-1">
              <Checkbox label="Follow redirects (-L)" checked={state.followRedirects} onChange={(followRedirects) => update({ followRedirects })} />
              <Checkbox label="Allow insecure TLS certificates (-k)" checked={state.insecure} onChange={(insecure) => update({ insecure })} />
              <Checkbox label="Ask for a compressed response (--compressed)" checked={state.compressed} onChange={(compressed) => update({ compressed })} />
            </div>
          )}
        </div>
      </section>

      <section aria-label="Generated request" className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented<Output> label="Output" options={OUTPUTS} value={output} onChange={setOutput} />
          <div className="flex flex-wrap items-center gap-2">
            {onSendToConverter && (
              <Button variant="ghost" onClick={() => onSendToConverter(toCurl(req))}>
                <Icon name="arrow" className="h-4 w-4" /> Open in converter
              </Button>
            )}
            <CopyButton text={code} />
          </div>
        </div>
        {secrets.length > 0 && (
          <p className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
            <Icon name="key" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Contains credentials ({secrets.join(', ')}). Remove or rotate them before sharing this code.</span>
          </p>
        )}
        <CodeBlock label="Generated code" className="max-h-[32rem] overflow-y-auto">
          {code}
        </CodeBlock>
        <p className={hint}>Nothing is sent from this page: its security policy blocks connections to other sites. Run the code or command where the API is reachable.</p>
      </section>
    </div>
  );
}
