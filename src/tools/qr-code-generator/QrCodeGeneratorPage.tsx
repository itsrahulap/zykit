import { useMemo, useRef, useState, type ReactNode } from 'react';
import qrCodeGenerator from './index';
import { encodeQr, type Ecc, type QrCode } from './features/qr';
import {
  colorWarnings,
  emailPayload,
  geoPayload,
  modulesPath,
  phonePayload,
  smsPayload,
  toSvg,
  vcardPayload,
  wifiPayload,
  type ContentType,
  type VCardInput,
  type WifiInput,
} from './features/qr-code-generator';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CopyButton, Segmented } from '../../shared/ui/tool';
import { Checkbox, Notices, OptionsCard } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';
import { Button, Icon } from '../../shared/ui/ui';
import { downloadBlob, downloadText } from '../../shared/utils/dom.utils';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const labelCls = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';
const toolbarBtn =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium pointer-coarse:min-h-11 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800';

const KINDS: { value: ContentType; label: string }[] = [
  { value: 'text', label: 'Text / URL' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS' },
  { value: 'vcard', label: 'Contact' },
  { value: 'geo', label: 'Location' },
];
const MAX_LOGO_BYTES = 1_000_000;
const LOGO_SCALE = 0.22;

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

function TextField({ label, value, onChange, type = 'text', wide, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; wide?: boolean; placeholder?: string }) {
  return (
    <Field label={label} wide={wide}>
      <input type={type} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" spellCheck={false} />
    </Field>
  );
}

const EMPTY_VCARD: VCardInput = { firstName: '', lastName: '', org: '', title: '', phone: '', email: '', url: '', street: '', city: '', postcode: '', country: '' };

/** Draws the symbol on a canvas (for PNG), with an optional centred logo. */
async function renderPng(qr: QrCode, o: { quiet: number; size: number; fg: string; bg: string; logo: string | null }): Promise<Blob | null> {
  const dim = qr.size + o.quiet * 2;
  const scale = Math.max(1, Math.floor(o.size / dim));
  const px = dim * scale;
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = o.bg;
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = o.fg;
  for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) if (qr.modules[y][x]) ctx.fillRect((x + o.quiet) * scale, (y + o.quiet) * scale, scale, scale);
  if (o.logo) {
    const img = new Image();
    img.src = o.logo;
    await img.decode().catch(() => undefined);
    const w = qr.size * LOGO_SCALE * scale;
    const p = (px - w) / 2;
    ctx.fillStyle = o.bg;
    ctx.fillRect(p - scale / 2, p - scale / 2, w + scale, w + scale);
    const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
    const dw = ratio >= 1 ? w : w * ratio;
    const dh = ratio >= 1 ? w / ratio : w;
    if (img.naturalWidth) ctx.drawImage(img, p + (w - dw) / 2, p + (w - dh) / 2, dw, dh);
  }
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

export default function QrCodeGeneratorPage() {
  const [kind, setKind] = useState<ContentType>('text');
  const [text, setText] = useState('https://example.com');
  const [wifi, setWifi] = useState<WifiInput>({ ssid: '', password: '', security: 'WPA', hidden: false });
  const [email, setEmail] = useState({ to: '', subject: '', body: '' });
  const [phone, setPhone] = useState('');
  const [sms, setSms] = useState({ number: '', message: '' });
  const [vcard, setVcard] = useState<VCardInput>(EMPTY_VCARD);
  const [geo, setGeo] = useState({ lat: '', lng: '' });
  const [ecc, setEcc] = useState<Ecc>('M');
  const [fg, setFg] = useState('#0f172a');
  const [bg, setBg] = useState('#ffffff');
  const [quiet, setQuiet] = useState(4);
  const [size, setSize] = useState(512);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useIncomingText(qrCodeGenerator.id, (t) => {
    setKind('text');
    setText(t);
  });
  // Wi-Fi passwords and contact details are deliberately left out of share links.
  useShareState(
    { kind, text, ssid: wifi.ssid, security: wifi.security, ecc, fg, bg, quiet, size },
    (s) => {
      if (s.kind) setKind(s.kind);
      if (s.text !== undefined) setText(s.text);
      if (s.ssid !== undefined || s.security) setWifi((w) => ({ ...w, ssid: s.ssid ?? w.ssid, security: s.security ?? w.security }));
      if (s.ecc) setEcc(s.ecc);
      if (s.fg && /^#[0-9a-f]{6}$/i.test(s.fg)) setFg(s.fg);
      if (s.bg && /^#[0-9a-f]{6}$/i.test(s.bg)) setBg(s.bg);
      if (s.quiet !== undefined) setQuiet(Math.max(0, Math.min(16, Math.floor(s.quiet))));
      if (s.size !== undefined) setSize(Math.max(64, Math.min(4096, Math.floor(s.size))));
    },
    { kind: KINDS.map((k) => k.value), ecc: ['L', 'M', 'Q', 'H'], security: ['WPA', 'WEP', 'nopass'] },
  );

  const payload = useMemo((): { ok: true; value: string } | { ok: false; error: string } => {
    switch (kind) {
      case 'text':
        return text ? { ok: true, value: text } : { ok: false, error: 'Enter text or a URL.' };
      case 'wifi':
        return wifi.ssid ? { ok: true, value: wifiPayload(wifi) } : { ok: false, error: 'Enter the network name (SSID).' };
      case 'email':
        return email.to.trim() ? { ok: true, value: emailPayload(email.to, email.subject, email.body) } : { ok: false, error: 'Enter an email address.' };
      case 'phone':
        return /\d/.test(phone) ? { ok: true, value: phonePayload(phone) } : { ok: false, error: 'Enter a phone number.' };
      case 'sms':
        return /\d/.test(sms.number) ? { ok: true, value: smsPayload(sms.number, sms.message) } : { ok: false, error: 'Enter a phone number.' };
      case 'vcard':
        return vcard.firstName || vcard.lastName || vcard.org ? { ok: true, value: vcardPayload(vcard) } : { ok: false, error: 'Enter a name or organisation.' };
      case 'geo': {
        const g = geoPayload(geo.lat, geo.lng);
        return g.ok ? { ok: true, value: g.payload } : g;
      }
    }
  }, [kind, text, wifi, email, phone, sms, vcard, geo]);

  // A logo hides the centre modules, so it needs the highest error correction.
  const level: Ecc = logo ? 'H' : ecc;
  const result = useMemo(() => {
    if (!payload.ok) return null;
    try {
      return { ok: true as const, qr: encodeQr(payload.value, { ecc: level }) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [payload, level]);
  const qr = result?.ok ? result.qr : null;

  const svg = useMemo(() => (qr ? toSvg(qr, { quiet, size, foreground: fg, background: bg, logo, logoScale: LOGO_SCALE }) : ''), [qr, quiet, size, fg, bg, logo]);
  const path = useMemo(() => (qr ? modulesPath(qr, quiet) : ''), [qr, quiet]);
  const warnings = useMemo(() => colorWarnings(fg, bg).concat(quiet < 2 ? ['A quiet zone under 2 modules makes the code hard to scan next to other content (4 is standard).'] : []), [fg, bg, quiet]);

  const downloadSvg = () => svg && downloadText(svg, 'qr-code.svg', 'image/svg+xml');
  const downloadPng = async () => {
    if (!qr) return;
    const blob = await renderPng(qr, { quiet, size, fg, bg, logo });
    if (blob) downloadBlob(blob, 'qr-code.png');
  };
  useToolShortcuts({ getOutput: () => svg, onDownload: () => void downloadPng() });

  const onLogo = (f: File) => {
    setLogoError(null);
    if (!/^image\/(png|jpeg|gif|webp|svg\+xml)$/.test(f.type)) return setLogoError('Choose a PNG, JPEG, GIF, WebP or SVG image.');
    if (f.size > MAX_LOGO_BYTES) return setLogoError('Logos must be under 1 MB.');
    const r = new FileReader();
    r.onload = () => typeof r.result === 'string' && setLogo(r.result);
    r.onerror = () => setLogoError(`Couldn't read ${f.name}.`);
    r.readAsDataURL(f);
  };

  const status = !payload.ok
    ? payload.error
    : !result?.ok
      ? (result?.error ?? '')
      : `Version ${result.qr.version} (${result.qr.size}×${result.qr.size}) · level ${level} · ${result.qr.mode} mode · mask ${result.qr.mask}`;

  const dim = qr ? qr.size + quiet * 2 : 1;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={qrCodeGenerator} />
      <Headline accent="codes">Make QR </Headline>
      <StatusStrip status={status} tone={qr ? 'good' : 'neutral'} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="min-w-0 space-y-6">
          <section aria-label="Content" className="space-y-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <Segmented<ContentType> label="Content type" options={KINDS} value={kind} onChange={setKind} />
            {kind === 'text' && (
              <Field label="Text or URL">
                <textarea className={`${inputCls} font-mono`} rows={4} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
              </Field>
            )}
            {kind === 'wifi' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Network name (SSID)" value={wifi.ssid} onChange={(ssid) => setWifi({ ...wifi, ssid })} />
                {wifi.security !== 'nopass' && <TextField label="Password" type="password" value={wifi.password} onChange={(password) => setWifi({ ...wifi, password })} />}
                <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                  <Segmented<WifiInput['security']>
                    label="Security"
                    options={[
                      { value: 'WPA', label: 'WPA/WPA2/WPA3' },
                      { value: 'WEP', label: 'WEP' },
                      { value: 'nopass', label: 'None' },
                    ]}
                    value={wifi.security}
                    onChange={(security) => setWifi({ ...wifi, security })}
                  />
                  <Checkbox label="Hidden network" checked={wifi.hidden} onChange={(hidden) => setWifi({ ...wifi, hidden })} />
                </div>
              </div>
            )}
            {kind === 'email' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="To" type="email" value={email.to} onChange={(to) => setEmail({ ...email, to })} placeholder="hello@example.com" />
                <TextField label="Subject" value={email.subject} onChange={(subject) => setEmail({ ...email, subject })} />
                <Field label="Message" wide>
                  <textarea className={inputCls} rows={3} value={email.body} onChange={(e) => setEmail({ ...email, body: e.target.value })} />
                </Field>
              </div>
            )}
            {kind === 'phone' && <TextField label="Phone number" type="tel" value={phone} onChange={setPhone} placeholder="+1 555 010 0123" />}
            {kind === 'sms' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Phone number" type="tel" value={sms.number} onChange={(number) => setSms({ ...sms, number })} />
                <Field label="Message" wide>
                  <textarea className={inputCls} rows={3} value={sms.message} onChange={(e) => setSms({ ...sms, message: e.target.value })} />
                </Field>
              </div>
            )}
            {kind === 'vcard' && (
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ['firstName', 'First name'],
                    ['lastName', 'Last name'],
                    ['org', 'Organisation'],
                    ['title', 'Job title'],
                    ['phone', 'Phone'],
                    ['email', 'Email'],
                    ['url', 'Website'],
                    ['street', 'Street'],
                    ['city', 'City'],
                    ['postcode', 'Postcode'],
                    ['country', 'Country'],
                  ] as [keyof VCardInput, string][]
                ).map(([k, l]) => (
                  <TextField key={k} label={l} value={vcard[k]} onChange={(v) => setVcard({ ...vcard, [k]: v })} />
                ))}
              </div>
            )}
            {kind === 'geo' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Latitude" value={geo.lat} onChange={(lat) => setGeo({ ...geo, lat })} placeholder="51.5007" />
                <TextField label="Longitude" value={geo.lng} onChange={(lng) => setGeo({ ...geo, lng })} placeholder="-0.1246" />
              </div>
            )}
          </section>

          <OptionsCard label="Appearance">
            <Segmented<Ecc>
              label="Error correction"
              options={[
                { value: 'L', label: 'L 7%' },
                { value: 'M', label: 'M 15%' },
                { value: 'Q', label: 'Q 25%' },
                { value: 'H', label: 'H 30%' },
              ]}
              value={level}
              onChange={setEcc}
            />
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white pointer-coarse:h-11 dark:border-slate-700 dark:bg-slate-950" />
              Foreground
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white pointer-coarse:h-11 dark:border-slate-700 dark:bg-slate-950" />
              Background
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              Quiet zone
              <input type="number" min={0} max={16} value={quiet} onChange={(e) => setQuiet(Math.max(0, Math.min(16, Math.floor(Number(e.target.value)) || 0)))} className={`${inputCls} w-20`} />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              Size (px)
              <input type="number" min={64} max={4096} step={32} value={size} onChange={(e) => setSize(Math.max(64, Math.min(4096, Math.floor(Number(e.target.value)) || 64)))} className={`${inputCls} w-24`} />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                data-testid="logo-input"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onLogo(f);
                  e.target.value = '';
                }}
              />
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                <Icon name="image" className="h-4 w-4" /> {logo ? 'Change logo' : 'Add logo'}
              </Button>
              {logo && (
                <Button variant="ghost" onClick={() => setLogo(null)}>
                  <Icon name="x" className="h-4 w-4" /> Remove logo
                </Button>
              )}
            </div>
            {logo && <p className="basis-full text-sm text-slate-500 dark:text-slate-400">A logo covers the centre, so error correction is fixed at H. Test-scan before printing.</p>}
            {logoError && (
              <p role="alert" className="basis-full text-sm text-red-700 dark:text-red-400">
                {logoError}
              </p>
            )}
          </OptionsCard>
          <Notices items={warnings} />
        </div>

        <section aria-label="QR code" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="grid" className="h-4 w-4" /> Preview
            </h2>
            <div className="flex flex-wrap items-center gap-1">
              <button type="button" className={toolbarBtn} disabled={!qr} onClick={() => void downloadPng()}>
                <Icon name="download" className="h-4 w-4" /> PNG
              </button>
              <button type="button" className={toolbarBtn} disabled={!qr} onClick={downloadSvg}>
                <Icon name="download" className="h-4 w-4" /> SVG
              </button>
              <CopyButton text={svg} label="Copy SVG" />
            </div>
          </header>
          <div className="p-4 sm:p-6">
            {qr ? (
              <svg
                viewBox={`0 0 ${dim} ${dim}`}
                role="img"
                aria-label={`QR code, version ${qr.version}`}
                data-testid="qr-preview"
                shapeRendering="crispEdges"
                className="mx-auto block aspect-square w-full max-w-80 rounded-xl"
              >
                <rect width={dim} height={dim} fill={bg} />
                <path fill={fg} d={path} />
                {logo && (
                  <>
                    <rect x={(dim - qr.size * LOGO_SCALE) / 2 - 0.5} y={(dim - qr.size * LOGO_SCALE) / 2 - 0.5} width={qr.size * LOGO_SCALE + 1} height={qr.size * LOGO_SCALE + 1} fill={bg} />
                    <image href={logo} x={(dim - qr.size * LOGO_SCALE) / 2} y={(dim - qr.size * LOGO_SCALE) / 2} width={qr.size * LOGO_SCALE} height={qr.size * LOGO_SCALE} />
                  </>
                )}
              </svg>
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-slate-100 p-6 text-center text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                {status}
              </div>
            )}
            {payload.ok && kind !== 'text' && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-slate-600 pointer-coarse:min-h-11 dark:text-slate-400">Encoded text</summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-slate-100 p-3 font-mono text-xs text-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  {kind === 'wifi' && wifi.password ? wifiPayload({ ...wifi, password: '••••••' }) : payload.value}
                </pre>
              </details>
            )}
          </div>
        </section>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        The QR code is encoded in your browser by our own ISO/IEC 18004 encoder, so links and Wi-Fi passwords never leave this page. Wi-Fi passwords and
        contact details are never included in share links.
      </p>
    </div>
  );
}
