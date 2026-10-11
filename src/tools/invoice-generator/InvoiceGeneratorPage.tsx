import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import invoiceGenerator from './index';
import {
  computeTotals,
  CURRENCIES,
  emptyInvoice,
  fileName,
  formatMoney,
  formatPercent,
  MAX_ITEMS,
  MAX_LOGO_BYTES,
  newItem,
  parseDraft,
  parseScaled,
  STORAGE_KEY,
  unsupportedChars,
  type Invoice,
  type LineItem,
  type Party,
} from './features/invoice-generator';
import { buildInvoicePdf } from './features/invoice-pdf';
import { Notices } from '../../shared/ui/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { downloadBlob, downloadText } from '../../shared/utils/dom.utils';
import { formatBytes } from '../../shared/utils/format.utils';

const field =
  'w-full rounded-xl border border-field-edge bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 dark:bg-slate-900 dark:text-slate-100';
const card = 'min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900 print:hidden';

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function fresh(): Invoice {
  const now = new Date();
  return emptyInvoice(isoDate(now), isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14)));
}

function loadDraft(): Invoice {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return (raw && parseDraft(JSON.parse(raw))) || fresh();
  } catch {
    return fresh();
  }
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block min-w-0 space-y-1 text-sm font-medium text-slate-700 dark:text-slate-300 ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function InvoiceGeneratorPage() {
  const [inv, setInv] = useState<Invoice>(loadDraft);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(Math.max(0, ...inv.items.map((i) => i.id)) + 1);
  const importRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inv));
      } catch {
        // Storage can be blocked or full (a large logo); the draft just isn't kept.
      }
    }, 400);
    return () => clearTimeout(t);
  }, [inv]);

  const totals = useMemo(() => computeTotals(inv), [inv]);
  const odd = useMemo(() => unsupportedChars(inv), [inv]);
  const money = (n: number) => formatMoney(n, inv.currency);
  const set = <K extends keyof Invoice>(k: K, v: Invoice[K]) => setInv((p) => ({ ...p, [k]: v }));
  const setParty = (k: 'seller' | 'client', f: keyof Party, v: string) => setInv((p) => ({ ...p, [k]: { ...p[k], [f]: v } }));
  const setItem = (id: number, f: keyof LineItem, v: string) => setInv((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, [f]: v } : i)) }));

  const partyFields = (k: 'seller' | 'client', title: string) => (
    <section aria-label={title} className={card}>
      <h2 className="eyebrow text-slate-600 dark:text-slate-400">{title}</h2>
      <Field label="Name">
        <input className={field} value={inv[k].name} onChange={(e) => setParty(k, 'name', e.target.value)} autoComplete="off" />
      </Field>
      <Field label="Address">
        <textarea className={field} rows={3} value={inv[k].address} onChange={(e) => setParty(k, 'address', e.target.value)} />
      </Field>
      <Field label="Tax ID">
        <input className={field} value={inv[k].taxId} onChange={(e) => setParty(k, 'taxId', e.target.value)} autoComplete="off" />
      </Field>
      {k === 'seller' && (
        <div className="space-y-2">
          <input
            ref={logoRef}
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            data-testid="logo-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void addLogo(f);
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => logoRef.current?.click()}>
              <Icon name="image" className="h-4 w-4" /> {inv.logo ? 'Change logo' : 'Add logo'}
            </Button>
            {inv.logo && (
              <>
                <img src={inv.logo.dataUrl} alt="Your logo" className="h-10 max-w-[8rem] object-contain" />
                <Button variant="ghost" onClick={() => set('logo', null)}>
                  Remove logo
                </Button>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">PNG or JPEG, up to {formatBytes(MAX_LOGO_BYTES)}.</p>
        </div>
      )}
    </section>
  );

  const addLogo = async (f: File) => {
    setError(null);
    const head = new Uint8Array(await f.slice(0, 4).arrayBuffer());
    const png = head[0] === 0x89 && head[1] === 0x50;
    const jpg = head[0] === 0xff && head[1] === 0xd8;
    if (!png && !jpg) return setError(`${f.name} isn't a PNG or JPEG image.`);
    if (f.size > MAX_LOGO_BYTES) return setError(`${f.name} is ${formatBytes(f.size)}; the logo limit is ${formatBytes(MAX_LOGO_BYTES)}.`);
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(r.error);
      r.readAsDataURL(f);
    });
    set('logo', { name: f.name, kind: png ? 'png' : 'jpg', dataUrl: dataUrl.replace(/^data:[^;]*;/, `data:image/${png ? 'png' : 'jpeg'};`) });
  };

  const downloadPdf = async () => {
    setError(null);
    setMessage(null);
    if (!totals.valid) return setError('Fix the highlighted line items before creating the PDF.');
    setBusy(true);
    try {
      const bytes = await buildInvoicePdf(inv);
      downloadBlob(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }), fileName(inv));
      setMessage(`Saved ${fileName(inv)} (${formatBytes(bytes.length)}).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The PDF couldn't be created.");
    } finally {
      setBusy(false);
    }
  };

  const importJson = async (f: File) => {
    setError(null);
    try {
      if (f.size > 4 * 1024 * 1024) throw new Error('too large');
      const d = parseDraft(JSON.parse(await f.text()));
      if (!d) throw new Error('not a draft');
      nextId.current = d.items.length + 1;
      setInv(d);
      setMessage(`Loaded ${f.name}.`);
    } catch {
      setError(`${f.name} isn't an invoice draft exported from this tool.`);
    }
  };

  const status = busy ? 'Creating the PDF…' : message ?? (totals.valid ? `Total ${money(totals.total)}.` : 'Check the line items.');

  return (
    <div className="space-y-8">
      <Breadcrumb tool={invoiceGenerator} />
      <div className="space-y-3 print:hidden">
        <Headline accent="invoice">Create an </Headline>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">
          Fill in the form, check the live totals and download a PDF. Your draft is kept in this browser only; nothing is uploaded.
        </p>
      </div>
      <div className="print:hidden">
        <StatusStrip status={status} tone={busy ? 'busy' : message ? 'good' : 'neutral'} />
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 print:hidden dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          <Icon name="warn" className="h-5 w-5 shrink-0" />
          <p className="min-w-0 flex-1 break-words">{error}</p>
        </div>
      )}
      {odd.length > 0 && (
        <div className="print:hidden">
          <Notices
            items={[`The PDF uses standard fonts, which can't draw ${odd.map((c) => `"${c}"`).join(' ')}. Those characters will appear as "?". Non-Latin text needs an embedded font, which this tool doesn't include.`]}
          />
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {partyFields('seller', 'From (your business)')}
        {partyFields('client', 'Bill to (client)')}
      </div>

      <section aria-label="Invoice details" className={`${card} grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
        <Field label="Invoice number">
          <input className={field} value={inv.number} onChange={(e) => set('number', e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Invoice date">
          <input className={field} type="date" value={inv.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
        <Field label="Due date">
          <input className={field} type="date" value={inv.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
        </Field>
        <Field label="Currency">
          <select className={field} value={inv.currency} onChange={(e) => set('currency', e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </section>

      <section aria-label="Line items" className={card}>
        <h2 className="eyebrow text-slate-600 dark:text-slate-400">Line items</h2>
        <ul className="space-y-4">
          {inv.items.map((it, n) => {
            const lt = totals.lines[n];
            return (
              <li key={it.id} className="min-w-0 space-y-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                <Field label={`Description ${n + 1}`}>
                  <input className={field} value={it.description} onChange={(e) => setItem(it.id, 'description', e.target.value)} autoComplete="off" />
                </Field>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label={`Quantity ${n + 1}`}>
                    <input className={field} inputMode="decimal" value={it.qty} onChange={(e) => setItem(it.id, 'qty', e.target.value)} aria-invalid={!lt.valid || undefined} />
                  </Field>
                  <Field label={`Unit price ${n + 1}`}>
                    <input className={field} inputMode="decimal" value={it.unitPrice} onChange={(e) => setItem(it.id, 'unitPrice', e.target.value)} aria-invalid={!lt.valid || undefined} />
                  </Field>
                  <Field label={`Tax % ${n + 1}`}>
                    <input className={field} inputMode="decimal" value={it.taxPercent} onChange={(e) => setItem(it.id, 'taxPercent', e.target.value)} aria-invalid={!lt.valid || undefined} />
                  </Field>
                  <Field label={`Discount % ${n + 1}`}>
                    <input className={field} inputMode="decimal" value={it.discountPercent} onChange={(e) => setItem(it.id, 'discountPercent', e.target.value)} aria-invalid={!lt.valid || undefined} />
                  </Field>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {lt.valid ? (
                    <p className="text-sm text-slate-700 dark:text-slate-300">Amount: {money(lt.net)}</p>
                  ) : (
                    <p role="alert" className="min-w-0 break-words text-sm text-red-700 dark:text-red-400">
                      {lt.error}
                    </p>
                  )}
                  <Button variant="ghost" disabled={inv.items.length === 1} onClick={() => set('items', inv.items.filter((i) => i.id !== it.id))} aria-label={`Remove line ${n + 1}`}>
                    <Icon name="x" className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        <Button variant="secondary" disabled={inv.items.length >= MAX_ITEMS} onClick={() => set('items', [...inv.items, newItem(nextId.current++)])}>
          Add line
        </Button>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-label="Notes and payment" className={card}>
          <Field label="Payment details">
            <textarea className={field} rows={3} value={inv.payment} onChange={(e) => set('payment', e.target.value)} placeholder="Bank, IBAN, account number…" />
          </Field>
          <Field label="Notes">
            <textarea className={field} rows={3} value={inv.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
          <Field label="Terms">
            <textarea className={field} rows={3} value={inv.terms} onChange={(e) => set('terms', e.target.value)} />
          </Field>
        </section>

        <section aria-label="Totals" className={card}>
          <h2 className="eyebrow text-slate-600 dark:text-slate-400">Totals</h2>
          <dl className="space-y-2 text-sm">
            <Row k="Subtotal" v={money(totals.subtotal)} />
            {totals.discount > 0 && <Row k="Discount" v={`-${money(totals.discount)}`} />}
            {totals.taxRows.map((r) => (
              <Row key={r.rateBp} k={`Tax ${formatPercent(r.rateBp)} (on ${money(r.base)})`} v={money(r.tax)} />
            ))}
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-slate-200 pt-2 text-base font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
              <dt>Total</dt>
              <dd data-testid="grand-total">{money(totals.total)}</dd>
            </div>
          </dl>
          <p className="text-xs text-slate-500 dark:text-slate-400">Amounts are calculated in whole {inv.currency} minor units and rounded half up per line.</p>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Button onClick={() => void downloadPdf()} disabled={busy}>
          <Icon name="download" className="h-4 w-4" /> Download PDF
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          Print
        </Button>
        <Button variant="secondary" onClick={() => downloadText(JSON.stringify(inv, null, 2), 'invoice-draft.json', 'application/json')}>
          Export JSON
        </Button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="import-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void importJson(f);
          }}
        />
        <Button variant="secondary" onClick={() => importRef.current?.click()}>
          Import JSON
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            nextId.current = 2;
            setInv(fresh());
            setMessage('Started a new invoice.');
          }}
        >
          New invoice
        </Button>
      </div>

      <Preview inv={inv} money={money} totals={totals} />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 text-slate-700 dark:text-slate-300">
      <dt className="min-w-0 break-words">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function Preview({ inv, money, totals }: { inv: Invoice; money: (n: number) => string; totals: ReturnType<typeof computeTotals> }) {
  const pre = 'whitespace-pre-wrap break-words';
  return (
    <section aria-label="Print preview" className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-900 sm:p-8 print:border-0 print:p-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {inv.logo ? <img src={inv.logo.dataUrl} alt="" className="h-14 max-w-[10rem] object-contain" /> : <p className="break-words text-lg font-bold">{inv.seller.name}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-500">INVOICE</p>
          <p>{inv.number}</p>
          <p className="text-slate-500">
            {inv.date}
            {inv.dueDate && ` · due ${inv.dueDate}`}
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {([['From', inv.seller], ['Bill to', inv.client]] as const).map(([l, p]) => (
          <div key={l} className="min-w-0">
            <p className="eyebrow text-slate-500">{l}</p>
            <p className="font-semibold break-words">{p.name}</p>
            <p className={pre}>{p.address}</p>
            {p.taxId && <p className="break-words">Tax ID: {p.taxId}</p>}
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] text-left">
          <thead className="text-xs text-slate-500">
            <tr>
              {['Description', 'Qty', 'Unit price', 'Disc.', 'Tax', 'Amount'].map((h) => (
                <th key={h} className="py-1 pr-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => {
              const l = totals.lines[i];
              return (
                <tr key={it.id} className="border-t border-slate-200 align-top dark:border-slate-700">
                  <td className={`py-1 pr-2 ${pre}`}>{it.description}</td>
                  <td className="py-1 pr-2">{it.qty}</td>
                  <td className="py-1 pr-2">{l.valid ? money(parseScaled(it.unitPrice, totals.digits) ?? 0) : ''}</td>
                  <td className="py-1 pr-2">{l.valid && l.discount ? formatPercent(parseScaled(it.discountPercent, 2) ?? 0) : ''}</td>
                  <td className="py-1 pr-2">{l.valid ? formatPercent(l.taxBp) : ''}</td>
                  <td className="py-1">{l.valid ? money(l.net) : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-right font-semibold">Total: {money(totals.total)}</p>
      {([['Payment details', inv.payment], ['Notes', inv.notes], ['Terms', inv.terms]] as const).map(
        ([l, b]) =>
          b.trim() && (
            <div key={l}>
              <p className="eyebrow text-slate-500">{l}</p>
              <p className={pre}>{b}</p>
            </div>
          ),
      )}
    </section>
  );
}
