import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import nginxConfigGenerator from './index';
import { DEFAULT_OPTIONS, generate, type LbMethod, type NginxOptions, type Preset, type RedirectMode } from './features/nginx-config-generator';
import { Checkbox, Notices, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { useShareState } from '../../shared/hooks/useShareState';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';

const field =
  'w-full rounded-xl border border-field-edge bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 dark:bg-slate-900 dark:text-slate-100';

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'static', label: 'Static site' },
  { value: 'spa', label: 'SPA (try_files)' },
  { value: 'proxy', label: 'Reverse proxy' },
  { value: 'php', label: 'PHP-FPM' },
  { value: 'redirect', label: 'Redirect' },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block min-w-0 space-y-1 text-sm font-medium text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      {children}
      {hint && <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">{hint}</span>}
    </label>
  );
}

export default function NginxConfigGeneratorPage() {
  const [o, setO] = useState<NginxOptions>(DEFAULT_OPTIONS);
  const set = <K extends keyof NginxOptions>(k: K, v: NginxOptions[K]) => setO((p) => ({ ...p, [k]: v }));
  const { config, warnings } = useMemo(() => generate(o), [o]);

  useShareState(
    { ...o },
    (s) => setO((p) => ({ ...p, ...s })),
    { preset: PRESETS.map((p) => p.value), lbMethod: ['round-robin', 'least_conn', 'ip_hash'], redirectMode: ['https', 'to-www', 'from-www', 'domain'] },
  );

  const text = (k: 'serverName' | 'root' | 'certPath' | 'keyPath' | 'maxBody' | 'phpSocket' | 'redirectDomain', label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <input className={field} value={o[k]} onChange={(e) => set(k, e.target.value)} spellCheck={false} autoComplete="off" />
    </Field>
  );
  const box = (k: 'tls' | 'http2' | 'http3' | 'hsts' | 'gzip' | 'cache' | 'securityHeaders' | 'rateLimit' | 'websocket' | 'logs', label: string) => (
    <Checkbox label={label} checked={o[k]} onChange={(v) => set(k, v)} />
  );
  const needRoot = o.preset === 'static' || o.preset === 'spa' || o.preset === 'php';
  const isRedirect = o.preset === 'redirect';
  const tlsFields = o.tls && (!isRedirect || o.redirectMode !== 'https');

  return (
    <div className="space-y-8">
      <Breadcrumb tool={nginxConfigGenerator} />
      <div className="space-y-3">
        <Headline accent="config">nginx </Headline>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">
          Pick a preset, adjust the options and copy a ready-to-use server block. Nothing leaves your browser, and nginx itself is never run, so check the result with{' '}
          <code>nginx -t</code>.
        </p>
      </div>
      <StatusStrip status={warnings.length ? `Generated with ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.` : 'Config updates as you change options.'} tone="good" />

      <OptionsCard label="Preset">
        <Segmented<Preset> label="Preset" options={PRESETS} value={o.preset} onChange={(v) => set('preset', v)} />
      </OptionsCard>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <section aria-label="Site" className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:grid-cols-2 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            {text('serverName', 'server_name', 'Space-separated hostnames.')}
            {needRoot && text('root', 'Document root')}
            {o.preset === 'php' && text('phpSocket', 'PHP-FPM address', 'A socket (unix:/run/php/…) or host:port.')}
            {o.preset === 'proxy' && (
              <>
                <Field label="Upstreams" hint="One per line: host:port or unix:/path.">
                  <textarea className={`${field} font-mono`} rows={3} value={o.upstreams} onChange={(e) => set('upstreams', e.target.value)} spellCheck={false} />
                </Field>
                <Field label="Load balancing">
                  <select className={field} value={o.lbMethod} onChange={(e) => set('lbMethod', e.target.value as LbMethod)}>
                    <option value="round-robin">Round robin</option>
                    <option value="least_conn">Least connections</option>
                    <option value="ip_hash">IP hash (sticky)</option>
                  </select>
                </Field>
              </>
            )}
            {isRedirect && (
              <>
                <Field label="Redirect type">
                  <select className={field} value={o.redirectMode} onChange={(e) => set('redirectMode', e.target.value as RedirectMode)}>
                    <option value="https">HTTP to HTTPS</option>
                    <option value="to-www">Bare domain to www</option>
                    <option value="from-www">www to bare domain</option>
                    <option value="domain">To another domain</option>
                  </select>
                </Field>
                {o.redirectMode === 'domain' && text('redirectDomain', 'Target', 'For example https://new.example.com')}
              </>
            )}
            {!isRedirect && text('maxBody', 'client_max_body_size', 'For example 10m, or 0 for no limit.')}
          </section>

          <OptionsCard label="Options">
            {box('tls', 'HTTPS (TLS)')}
            {o.tls && !isRedirect && box('http2', 'HTTP/2')}
            {o.tls && !isRedirect && box('http3', 'HTTP/3 (QUIC)')}
            {o.tls && !isRedirect && box('hsts', 'HSTS')}
            {!isRedirect && box('gzip', 'gzip')}
            {!isRedirect && o.preset !== 'proxy' && box('cache', 'Cache static assets')}
            {!isRedirect && box('securityHeaders', 'Security headers')}
            {!isRedirect && box('rateLimit', 'Rate limiting')}
            {o.preset === 'proxy' && box('websocket', 'WebSocket headers')}
            {!isRedirect && box('logs', 'Access and error logs')}
          </OptionsCard>

          {o.rateLimit && !isRedirect && (
            <section aria-label="Rate limit" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <Field label="Requests per second per IP">
                <input className={field} type="number" min={1} value={o.rateLimitRate} onChange={(e) => set('rateLimitRate', Number(e.target.value) || 1)} />
              </Field>
            </section>
          )}
          {tlsFields && (
            <section aria-label="Certificate" className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:grid-cols-2 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              {text('certPath', 'ssl_certificate')}
              {text('keyPath', 'ssl_certificate_key')}
            </section>
          )}
          {o.securityHeaders && !isRedirect && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Adds the simple security headers. A Content-Security-Policy depends on your site; build one with the{' '}
              <Link to="/tools/csp-builder" className="font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400">
                CSP Builder
              </Link>
              .
            </p>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <OutputPanel title="nginx.conf" icon="server" text={config} fileName="nginx.conf" mime="text/plain" kind="code" />
          <Notices items={warnings} />
        </div>
      </div>
    </div>
  );
}
