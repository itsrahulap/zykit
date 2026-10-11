import { useState } from 'react';
import sipCalculator from './index';
import { inflationAdjusted, lumpSum, parseAmount, sip, type Timing } from './features/sip-calculator';
import { CURRENCIES } from '../../shared/lib/currency';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const labelCls = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';
const card = 'rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const COMPOUNDING = [
  { value: 1, label: 'Yearly' },
  { value: 2, label: 'Half-yearly' },
  { value: 4, label: 'Quarterly' },
  { value: 12, label: 'Monthly' },
  { value: 365, label: 'Daily' },
];

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className={labelCls}>{label}</span>
      <input inputMode="decimal" className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export default function SipCalculatorPage() {
  const [mode, setMode] = useState<'sip' | 'lump'>('sip');
  const [amount, setAmount] = useState('10000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('10');
  const [stepUp, setStepUp] = useState('0');
  const [timing, setTiming] = useState<Timing>('start');
  const [perYear, setPerYear] = useState(1);
  const [inflation, setInflation] = useState('0');
  const [cur, setCur] = useState('INR');

  const money = CURRENCIES.find((c) => c.id === cur) ?? CURRENCIES[0];
  const fmt = (n: number) => new Intl.NumberFormat(money.locale, { style: 'currency', currency: money.id, maximumFractionDigits: 0 }).format(n);
  const [A, R, Y, S, I] = [amount, rate, years, stepUp, inflation].map(parseAmount);
  const valid = A !== null && R !== null && Y !== null && Y >= 1 && Y <= 100 && Number.isInteger(Y) && S !== null && I !== null;
  const rows = valid ? (mode === 'sip' ? sip(A, R, Y, S, timing) : lumpSum(A, R, Y, perYear)) : [];
  const end = rows[rows.length - 1];

  return (
    <div className="space-y-8">
      <Breadcrumb tool={sipCalculator} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="grow">Watch your money </Headline>
        <Select label="Currency" options={CURRENCIES.map((c) => ({ value: c.id, label: c.label }))} value={cur} onChange={setCur} />
      </div>
      <StatusStrip status={valid ? 'Estimates only, not financial advice. Returns are assumed constant.' : 'Enter valid numbers (years: whole number 1–100).'} />

      <section aria-label="Inputs" className={`space-y-4 ${card}`}>
        <Segmented
          label="Investment type"
          options={[
            { value: 'sip', label: 'Monthly SIP' },
            { value: 'lump', label: 'Lump sum' },
          ]}
          value={mode}
          onChange={setMode}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={mode === 'sip' ? 'Monthly investment' : 'Investment amount'} value={amount} onChange={setAmount} />
          <Field label="Expected annual return (%)" value={rate} onChange={setRate} />
          <Field label="Years" value={years} onChange={setYears} />
          {mode === 'sip' ? (
            <>
              <Field label="Yearly step-up (%)" value={stepUp} onChange={setStepUp} />
              <Select
                label="Invest at"
                options={[
                  { value: 'start' as const, label: 'Start of each month' },
                  { value: 'end' as const, label: 'End of each month' },
                ]}
                value={timing}
                onChange={setTiming}
              />
            </>
          ) : (
            <Select label="Compounding" options={COMPOUNDING} value={perYear} onChange={setPerYear} />
          )}
          <Field label="Inflation for today's value (%)" value={inflation} onChange={setInflation} />
        </div>
      </section>

      {end && (
        <>
          <section aria-label="Result" aria-live="polite" className={`space-y-4 ${card}`}>
            <p className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">{fmt(end.value)}</p>
            <DetailRows
              rows={[
                ['Total invested', fmt(end.invested)],
                ['Estimated returns', fmt(end.value - end.invested)],
                ['Total value', fmt(end.value)],
                ...(I ? [[`In today's money (${I}% inflation)`, fmt(inflationAdjusted(end.value, I, end.year))] as [string, string]] : []),
              ]}
            />
          </section>
          <div tabIndex={0} role="region" aria-label="Year-by-year growth" className={`overflow-x-auto ${card}`}>
            <table className="w-full min-w-[28rem] text-right text-sm">
              <thead className="text-xs text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="py-2 text-left font-medium">Year</th>
                  <th className="py-2 font-medium">Invested</th>
                  <th className="py-2 font-medium">Returns</th>
                  <th className="py-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 dark:divide-slate-800 dark:text-slate-200">
                {rows.map((r) => (
                  <tr key={r.year}>
                    <td className="py-1.5 text-left">{r.year}</td>
                    <td>{fmt(r.invested)}</td>
                    <td>{fmt(r.value - r.invested)}</td>
                    <td className="font-medium">{fmt(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
