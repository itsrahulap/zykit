import { useMemo, useState, type ReactNode } from 'react';
import loanCalculator from './index';
import {
  MAX_PERIODS,
  amortise,
  isValidDate,
  periodsFor,
  savings,
  toCsv,
  yearly,
  type Frequency,
  type LoanInput,
  type Result,
} from './features/loan-calculator';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';
import { useShareState } from '../../shared/hooks/useShareState';
import { downloadText } from '../../shared/utils/dom.utils';
import { Icon } from '../../shared/ui/ui';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark]';
const labelCls = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';
const btnCls =
  'rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 pointer-coarse:min-h-11 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800';
const thCls = 'px-3 py-2 text-right font-semibold first:text-left';
const tdCls = 'px-3 py-1.5 text-right tabular-nums first:text-left whitespace-nowrap';

const CURRENCIES = [
  { id: 'INR', locale: 'en-IN', label: 'INR (en-IN, lakh grouping)' },
  { id: 'USD', locale: 'en-US', label: 'USD (en-US)' },
  { id: 'EUR', locale: 'de-DE', label: 'EUR (de-DE)' },
  { id: 'GBP', locale: 'en-GB', label: 'GBP (en-GB)' },
  { id: 'JPY', locale: 'ja-JP', label: 'JPY (ja-JP, no decimals)' },
];
const FREQS: Frequency[] = ['monthly', 'weekly', 'fortnightly', 'quarterly'];
const PAGE = 24;

interface LoanState {
  principal: string;
  rate: string;
  years: string;
  months: string;
  freq: Frequency;
  start: string;
  ooDate: string;
  ooAmt: string;
  extra: string;
  prepay: 'tenure' | 'emi';
}
const today = () => new Date().toISOString().slice(0, 10);
const loanA = (): LoanState => ({ principal: '1000000', rate: '8.5', years: '20', months: '0', freq: 'monthly', start: today(), ooDate: '', ooAmt: '', extra: '', prepay: 'tenure' });
const loanB = (): LoanState => ({ ...loanA(), rate: '9.25', years: '15' });

const dec = (s: string) => (/^\d*\.?\d*$/.test(s.trim()) && s.trim() !== '' && s.trim() !== '.' ? Number(s) : null);

function parseLoan(s: LoanState, digits: number): { error: string } | { input: LoanInput } {
  const p = dec(s.principal);
  const rate = dec(s.rate);
  const y = dec(s.years || '0');
  const m = dec(s.months || '0');
  if (p === null || p <= 0 || p > 1e12) return { error: 'Principal must be a positive amount.' };
  if (rate === null || rate > 100) return { error: 'Annual rate must be between 0 and 100.' };
  if (y === null || m === null || !Number.isInteger(y) || !Number.isInteger(m)) return { error: 'Tenure must be whole years and months.' };
  const periods = periodsFor(y, m, s.freq);
  if (periods < 1 || periods > MAX_PERIODS) return { error: `Tenure must be between 1 and ${MAX_PERIODS} payments.` };
  if (!isValidDate(s.start)) return { error: 'Choose a valid start date.' };
  const f = 10 ** digits;
  const extra = s.extra.trim() === '' ? 0 : dec(s.extra);
  const oo = s.ooAmt.trim() === '' ? 0 : dec(s.ooAmt);
  if (extra === null || oo === null) return { error: 'Prepayment amounts must be positive numbers.' };
  if (oo > 0 && !isValidDate(s.ooDate)) return { error: 'Choose a date for the one-off prepayment.' };
  return {
    input: {
      principal: Math.round(p * f),
      annualRate: rate,
      periods,
      frequency: s.freq,
      start: s.start,
      oneOff: oo > 0 ? { date: s.ooDate, amount: Math.round(oo * f) } : undefined,
      extra: Math.round(extra * f),
      prepay: s.prepay,
    },
  };
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block min-w-0">
      <span className={labelCls}>{label}</span>
      <input type={type} inputMode={type === 'text' ? 'decimal' : undefined} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function LoanForm({ title, s, set }: { title: string; s: LoanState; set: (s: LoanState) => void }) {
  const up = (k: keyof LoanState) => (v: string) => set({ ...s, [k]: v });
  return (
    <section aria-label={title} className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <Icon name="chart" className="h-4 w-4" /> {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Loan amount" value={s.principal} onChange={up('principal')} />
        <Field label="Annual interest rate (%)" value={s.rate} onChange={up('rate')} />
        <Field label="Tenure (years)" value={s.years} onChange={up('years')} />
        <Field label="Tenure (extra months)" value={s.months} onChange={up('months')} />
        <Select
          label="Payment frequency"
          options={FREQS.map((f) => ({ value: f, label: f[0].toUpperCase() + f.slice(1) }))}
          value={s.freq}
          onChange={(freq: Frequency) => set({ ...s, freq })}
        />
        <Field label="Start date" type="date" value={s.start} onChange={up('start')} />
      </div>
      <fieldset className="space-y-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
        <legend className="px-1 text-sm font-medium text-slate-700 dark:text-slate-300">Prepayments (optional)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="One-off prepayment amount" value={s.ooAmt} onChange={up('ooAmt')} />
          <Field label="One-off prepayment date" type="date" value={s.ooDate} onChange={up('ooDate')} />
          <Field label="Extra amount with every payment" value={s.extra} onChange={up('extra')} />
          <Select
            label="Use prepayments to"
            options={[
              { value: 'tenure' as const, label: 'Reduce tenure (keep EMI)' },
              { value: 'emi' as const, label: 'Reduce EMI (keep tenure)' },
            ]}
            value={s.prepay}
            onChange={(prepay) => set({ ...s, prepay })}
          />
        </div>
      </fieldset>
    </section>
  );
}

interface Calc {
  input: LoanInput;
  result: Result;
  saved: { interestSaved: number; periodsSaved: number };
}

function Chart({ calc, fmt }: { calc: Calc; fmt: (m: number) => string; }) {
  const { rows } = calc.result;
  const { principal } = calc.input;
  const W = 300;
  const H = 110;
  const pts = [[0, principal], ...rows.map((r, i) => [i + 1, r.balance])].map(([x, b]) => `${((x / rows.length) * W).toFixed(1)},${(H - (b / principal) * H).toFixed(1)}`);
  const total = calc.result.totalPaid || 1;
  const pPct = Math.round((principal / total) * 100);
  const desc = `Of ${fmt(calc.result.totalPaid)} paid, ${fmt(principal)} (${pPct}%) is principal and ${fmt(calc.result.totalInterest)} (${100 - pPct}%) is interest. The balance falls from ${fmt(principal)} to ${fmt(0)} over ${rows.length} payments.`;
  return (
    <div className="space-y-4" role="img" aria-label={desc}>
      <div aria-hidden="true">
        <div className="flex h-6 overflow-hidden rounded-full">
          <div className="bg-emerald-600" style={{ width: `${pPct}%` }} />
          <div className="bg-amber-500" style={{ width: `${100 - pPct}%` }} />
        </div>
        <p className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-600 dark:text-slate-400">
          <span>Principal {pPct}%</span>
          <span>Interest {100 - pPct}%</span>
        </p>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-3 h-32 w-full rounded-xl bg-slate-50 dark:bg-slate-950">
          <polygon points={`0,${H} ${pts.join(' ')} ${W},${H}`} className="fill-emerald-500/25" />
          <polyline points={pts.join(' ')} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" className="stroke-emerald-600" />
        </svg>
        <p className="text-xs text-slate-600 dark:text-slate-400">Remaining balance over the life of the loan</p>
      </div>
      <p className="sr-only">{desc}</p>
    </div>
  );
}

function Table({ caption, head, children }: { caption: string; head: string[]; children: ReactNode }) {
  return (
    <div className="max-h-96 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800" tabIndex={0} role="region" aria-label={caption}>
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className={thCls}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-800 dark:divide-slate-800 dark:text-slate-200">{children}</tbody>
      </table>
    </div>
  );
}

export default function LoanCalculatorPage() {
  const [cur, setCur] = useState('INR');
  const [a, setA] = useState(loanA);
  const [b, setB] = useState(loanB);
  const [compare, setCompare] = useState(false);
  const [view, setView] = useState<'a' | 'b'>('a');
  const [page, setPage] = useState(0);

  useShareState(
    { cur, a: JSON.stringify(a), b: JSON.stringify(b), compare: compare ? 'yes' : 'no' },
    (s) => {
      if (s.cur) setCur(s.cur);
      if (s.compare) setCompare(s.compare === 'yes');
      const load = (raw: string | undefined, base: LoanState, put: (l: LoanState) => void) => {
        try {
          const d = JSON.parse(raw ?? '') as Record<string, unknown>;
          const next = { ...base };
          for (const k of Object.keys(base) as (keyof LoanState)[]) {
            const v = d[k];
            if (typeof v !== 'string' || v.length > 24) continue;
            if (k === 'freq' && !FREQS.includes(v as Frequency)) continue;
            if (k === 'prepay' && v !== 'tenure' && v !== 'emi') continue;
            (next as Record<string, string>)[k] = v;
          }
          put(next);
        } catch {
          /* ignore a malformed link */
        }
      };
      load(s.a, loanA(), setA);
      load(s.b, loanB(), setB);
    },
    { cur: CURRENCIES.map((c) => c.id), compare: ['yes', 'no'] },
  );

  const money = CURRENCIES.find((c) => c.id === cur) ?? CURRENCIES[0];
  const nf = useMemo(() => new Intl.NumberFormat(money.locale, { style: 'currency', currency: money.id }), [money]);
  const digits = nf.resolvedOptions().maximumFractionDigits ?? 2;
  const fmt = (m: number) => nf.format(m / 10 ** digits);

  const run = (s: LoanState): { error: string } | Calc => {
    const p = parseLoan(s, digits);
    if ('error' in p) return p;
    const result = amortise(p.input);
    return { input: p.input, result, saved: savings(p.input, result) };
  };
  const ra = run(a);
  const rb = compare ? run(b) : null;
  const shown = compare && view === 'b' ? rb : ra;
  const detail = shown && !('error' in shown) ? shown : null;
  const rows = detail?.result.rows ?? [];
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const pg = Math.min(page, pages - 1);
  const err = (r: typeof ra | null) => (r && 'error' in r ? r.error : null);

  const summary = (c: Calc): [string, ReactNode][] => {
    const rowsOut: [string, ReactNode][] = [
      ['EMI (per payment)', <strong key="e">{fmt(c.result.emi)}</strong>],
      ['Total interest', fmt(c.result.totalInterest)],
      ['Total paid', fmt(c.result.totalPaid)],
      ['Payments', `${c.result.rows.length} (last on ${c.result.rows[c.result.rows.length - 1].date})`],
    ];
    if (c.saved.interestSaved > 0) rowsOut.push(['Interest saved by prepayments', `${fmt(c.saved.interestSaved)}${c.saved.periodsSaved > 0 ? `, ${c.saved.periodsSaved} payments earlier` : ''}`]);
    return rowsOut;
  };

  const status = err(ra) ?? err(rb) ?? (compare ? 'Comparing two loans.' : `EMI ${fmt((ra as Calc).result.emi)} for ${(ra as Calc).result.rows.length} payments.`);
  const both = !err(ra) && rb && !err(rb) ? [ra as Calc, rb as Calc] : null;
  const diff = (x: number, y: number) => `${y - x >= 0 ? '+' : '−'}${fmt(Math.abs(y - x))}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={loanCalculator} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="your loan">Plan </Headline>
        <Select label="Currency and number format" options={CURRENCIES.map((c) => ({ value: c.id, label: c.label }))} value={cur} onChange={setCur} />
      </div>
      <StatusStrip status={status} tone={err(ra) || err(rb) ? 'neutral' : 'good'} />
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 pointer-coarse:min-h-11 dark:text-slate-300">
        <input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
        Compare with a second loan
      </label>

      <div className={`grid grid-cols-1 items-start gap-6 ${compare ? 'lg:grid-cols-2' : ''}`}>
        <div className="min-w-0 space-y-4">
          <LoanForm title={compare ? 'Loan A' : 'Loan'} s={a} set={setA} />
          <div aria-live="polite" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            {err(ra) ? <p>{err(ra)}</p> : <DetailRows rows={summary(ra as Calc)} />}
          </div>
        </div>
        {compare && (
          <div className="min-w-0 space-y-4">
            <LoanForm title="Loan B" s={b} set={setB} />
            <div aria-live="polite" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              {err(rb) ? <p>{err(rb)}</p> : rb && <DetailRows rows={summary(rb as Calc)} />}
            </div>
          </div>
        )}
      </div>

      {both && (
        <section aria-label="Loan comparison" className="space-y-3">
          <h2 className="eyebrow text-slate-600 dark:text-slate-400">Comparison (B minus A)</h2>
          <Table caption="Loan A against Loan B" head={['Measure', 'Loan A', 'Loan B', 'Difference']}>
            {(
              [
                ['EMI', both[0].result.emi, both[1].result.emi],
                ['Total interest', both[0].result.totalInterest, both[1].result.totalInterest],
                ['Total paid', both[0].result.totalPaid, both[1].result.totalPaid],
              ] as const
            ).map(([l, x, y]) => (
              <tr key={l}>
                <td className={tdCls}>{l}</td>
                <td className={tdCls}>{fmt(x)}</td>
                <td className={tdCls}>{fmt(y)}</td>
                <td className={tdCls}>{diff(x, y)}</td>
              </tr>
            ))}
          </Table>
        </section>
      )}

      {detail && (
        <>
          {compare && (
            <Segmented<'a' | 'b'> label="Loan to show below" options={[{ value: 'a', label: 'Details: Loan A' }, { value: 'b', label: 'Details: Loan B' }]} value={view} onChange={(v) => { setView(v); setPage(0); }} />
          )}
          <section aria-label="Principal and interest chart" className="min-w-0 space-y-3 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">Where the money goes</h2>
            <Chart calc={detail} fmt={fmt} />
          </section>

          <section aria-label="Yearly summary" className="space-y-3">
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">Yearly summary</h2>
            <Table caption="Yearly summary of payments" head={['Year', 'Principal', 'Interest', 'Extra', 'Paid', 'Balance']}>
              {yearly(rows, detail.input.frequency).map((y) => (
                <tr key={y.year}>
                  <td className={tdCls}>{y.year}</td>
                  <td className={tdCls}>{fmt(y.principal)}</td>
                  <td className={tdCls}>{fmt(y.interest)}</td>
                  <td className={tdCls}>{fmt(y.extra)}</td>
                  <td className={tdCls}>{fmt(y.paid)}</td>
                  <td className={tdCls}>{fmt(y.balance)}</td>
                </tr>
              ))}
            </Table>
          </section>

          <section aria-label="Amortisation schedule" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="eyebrow text-slate-600 dark:text-slate-400">Amortisation schedule</h2>
              <button type="button" className={btnCls} onClick={() => downloadText(toCsv(rows, digits), 'loan-schedule.csv', 'text/csv')}>
                Download CSV
              </button>
            </div>
            <Table caption="Payment-by-payment schedule" head={['#', 'Date', 'Payment', 'Principal', 'Interest', 'Extra', 'Balance']}>
              {rows.slice(pg * PAGE, pg * PAGE + PAGE).map((r) => (
                <tr key={r.n}>
                  <td className={tdCls}>{r.n}</td>
                  <td className={tdCls}>{r.date}</td>
                  <td className={tdCls}>{fmt(r.payment)}</td>
                  <td className={tdCls}>{fmt(r.principal)}</td>
                  <td className={tdCls}>{fmt(r.interest)}</td>
                  <td className={tdCls}>{fmt(r.extra)}</td>
                  <td className={tdCls}>{fmt(r.balance)}</td>
                </tr>
              ))}
            </Table>
            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
              <button type="button" className={btnCls} disabled={pg === 0} onClick={() => setPage(pg - 1)}>
                Previous
              </button>
              <span aria-live="polite">
                Page {pg + 1} of {pages}
              </span>
              <button type="button" className={btnCls} disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>
                Next
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
