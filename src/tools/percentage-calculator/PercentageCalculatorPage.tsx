import { useState, type ReactNode } from 'react';
import percentageCalculator from './index';
import * as pc from './features/percentage-calculator';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';
import { useShareState } from '../../shared/hooks/useShareState';
import { Icon } from '../../shared/ui/ui';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark]';
const labelCls = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';
const DEFAULTS = {
  of_x: '15', of_y: '200',
  is_x: '30', is_y: '200',
  ch_a: '50', ch_b: '75',
  ad_y: '200', ad_x: '10', ad_dir: 'add',
  rv_f: '120', rv_x: '20', rv_dir: 'increase',
  di_p: '1000', di_d: '20, 10',
  mg_mode: 'cp', mg_c: '80', mg_v: '100',
  tx_a: '1000', tx_r: '18', tx_exc: 'exc', tx_split: 'no',
  pp_a: '10', pp_b: '12',
};
type Vals = typeof DEFAULTS;
const CHOICES = { ad_dir: ['add', 'sub'], rv_dir: ['increase', 'decrease'], mg_mode: ['cp', 'cm', 'ck'], tx_exc: ['exc', 'inc'], tx_split: ['no', 'yes'] } as const;
const RATES = ['5', '12', '18', '28'];

const f = (n: number | null, dp = 2) => (n === null ? '—' : pc.round(n, dp).toLocaleString('en-US', { maximumFractionDigits: dp }));
const pct = (n: number | null) => (n === null ? '—' : `${f(n, 2)}%`);

function Card({ label, formula, children, result }: { label: string; formula: string; children: ReactNode; result: ReactNode }) {
  return (
    <section aria-label={label} className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <Icon name="hash" className="h-4 w-4" /> {label}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
      <p className="rounded-2xl bg-primary p-4 text-base font-semibold break-words text-primary-ink sm:text-lg" aria-live="polite">
        {result}
      </p>
      <p className="text-xs break-words text-slate-600 dark:text-slate-400">
        Formula: <code>{formula}</code>
      </p>
    </section>
  );
}

export default function PercentageCalculatorPage() {
  const [v, setV] = useState<Vals>(DEFAULTS);
  useShareState({ v: JSON.stringify(v) }, (s) => {
    try {
      const d = JSON.parse(s.v ?? '') as Record<string, unknown>;
      setV((cur) => {
        const next = { ...cur };
        for (const k of Object.keys(cur) as (keyof Vals)[]) {
          const x = d[k];
          const allowed = (CHOICES as Record<string, readonly string[]>)[k];
          if (typeof x === 'string' && x.length <= 60 && (!allowed || allowed.includes(x))) next[k] = x;
        }
        return next;
      });
    } catch {
      /* ignore a malformed link */
    }
  });

  const set = (k: keyof Vals) => (val: string) => setV((cur) => ({ ...cur, [k]: val }));
  const N = (k: keyof Vals) => pc.parseNum(v[k]);
  const F = (k: keyof Vals, label: string, suffix = '') => (
    <label className="block min-w-0" key={k}>
      <span className={labelCls}>
        {label}
        {suffix}
      </span>
      <input inputMode="decimal" className={inputCls} value={v[k]} onChange={(e) => set(k)(e.target.value)} />
    </label>
  );
  const seg = <T extends string>(k: keyof Vals, label: string, options: { value: T; label: string }[]) => (
    <div className="sm:col-span-2">
      <Segmented<T> label={label} options={options} value={v[k] as T} onChange={set(k)} />
    </div>
  );
  const need = 'Enter valid numbers.';
  const ok = (x: number | null): x is number => x !== null;

  const [ofX, ofY, isX, isY, chA, chB, adY, adX, rvF, rvX, diP, mgC, mgV, txA, txR, ppA, ppB] = [
    N('of_x'), N('of_y'), N('is_x'), N('is_y'), N('ch_a'), N('ch_b'), N('ad_y'), N('ad_x'), N('rv_f'), N('rv_x'), N('di_p'), N('mg_c'), N('mg_v'), N('tx_a'), N('tx_r'), N('pp_a'), N('pp_b'),
  ];
  const discounts = v.di_d.split(/[,\s]+/).filter(Boolean).map(pc.parseNum);
  const change = (ok(chA) && ok(chB)) ? pc.percentChange(chA, chB) : null;
  const ad = (ok(adY) && ok(adX)) ? (v.ad_dir === 'add' ? pc.addPercent(adY, adX) : pc.subtractPercent(adY, adX)) : null;
  const rv = (ok(rvF) && ok(rvX)) ? pc.reversePercent(rvF, rvX, v.rv_dir as 'increase' | 'decrease') : null;
  const dis = (ok(diP)) && discounts.length > 0 && discounts.every((d) => d !== null) ? pc.discount(diP, discounts as number[]) : null;
  const mm = (ok(mgC) && ok(mgV)) ? pc.marginMarkup(mgC, mgV) : null;
  const mgPrice = (ok(mgC) && ok(mgV)) ? (v.mg_mode === 'cm' ? pc.priceFromMargin(mgC, mgV) : pc.priceFromMarkup(mgC, mgV)) : null;
  const tx = (ok(txA) && ok(txR)) ? pc.tax(txA, txR, v.tx_exc === 'exc') : null;
  const pp = (ok(ppA) && ok(ppB)) ? pc.pointsVsPercent(ppA, ppB) : null;

  const rateOpts = RATES.map((r) => ({ value: r, label: `${r}%` }));

  return (
    <div className="space-y-8">
      <Breadcrumb tool={percentageCalculator} />
      <Headline accent="percentages">Work out </Headline>
      <StatusStrip status="Type in any card; each result updates as you type." tone="good" />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card label="X% of Y" formula="Y × X ÷ 100" result={(ok(ofX) && ok(ofY)) ? `${f(ofX, 4)}% of ${f(ofY, 4)} = ${f(pc.percentOf(ofX, ofY), 4)}` : need}>
          {F('of_x', 'Percent X', ' (%)')}
          {F('of_y', 'Value Y')}
        </Card>
        <Card label="X is what % of Y" formula="X ÷ Y × 100" result={(ok(isX) && ok(isY)) ? `${f(isX, 4)} is ${pct(pc.whatPercent(isX, isY))} of ${f(isY, 4)}${isY === 0 ? ' (Y cannot be 0)' : ''}` : need}>
          {F('is_x', 'Value X')}
          {F('is_y', 'Value Y')}
        </Card>
        <Card
          label="Percentage change"
          formula="(B − A) ÷ |A| × 100"
          result={(ok(chA) && ok(chB)) ? (change ? `${f(chA, 4)} → ${f(chB, 4)}: ${change.direction === 'unchanged' ? 'no change' : `${pct(Math.abs(change.pct))} ${change.direction}`}` : 'A cannot be 0.') : need}
        >
          {F('ch_a', 'From A')}
          {F('ch_b', 'To B')}
        </Card>
        <Card label="Add or subtract X%" formula="Y × (1 ± X ÷ 100)" result={ad === null ? need : `${f(adY, 4)} ${v.ad_dir === 'add' ? '+' : '−'} ${f(adX, 4)}% = ${f(ad, 4)}`}>
          {seg('ad_dir', 'Operation', [{ value: 'add', label: 'Add' }, { value: 'sub', label: 'Subtract' }])}
          {F('ad_y', 'Value Y')}
          {F('ad_x', 'Percent X', ' (%)')}
        </Card>
        <Card
          label="Reverse percentage"
          formula="original = final ÷ (1 ± X ÷ 100)"
          result={(ok(rvF) && ok(rvX)) ? (rv === null ? 'A 100% decrease cannot be reversed.' : `Original value before the ${f(rvX, 4)}% ${v.rv_dir}: ${f(rv, 4)}`) : need}
        >
          {seg('rv_dir', 'Change applied', [{ value: 'increase', label: 'Increase' }, { value: 'decrease', label: 'Decrease' }])}
          {F('rv_f', 'Value after the change')}
          {F('rv_x', 'Percent X', ' (%)')}
        </Card>
        <Card
          label="Discount"
          formula="final = price × (1 − d1) × (1 − d2) …"
          result={dis ? `Final price ${f(dis.final)}, you save ${f(dis.savings)} (${pct(dis.effectivePercent)} off overall)` : need}
        >
          {F('di_p', 'Price')}
          {F('di_d', 'Discounts (%), comma-separated to stack')}
        </Card>
        <Card
          label="Margin vs markup"
          formula={v.mg_mode === 'cp' ? 'margin = (price − cost) ÷ price; markup = (price − cost) ÷ cost' : v.mg_mode === 'cm' ? 'price = cost ÷ (1 − margin)' : 'price = cost × (1 + markup)'}
          result={
            !(ok(mgC) && ok(mgV))
              ? need
              : v.mg_mode === 'cp'
                ? mm
                  ? `Profit ${f(mm.profit)}, margin ${pct(mm.margin)}, markup ${pct(mm.markup)}`
                  : need
                : mgPrice === null
                  ? 'A margin of 100% or more is impossible.'
                  : `Selling price ${f(mgPrice)}, profit ${f(mgPrice - mgC!)}`
          }
        >
          {seg('mg_mode', 'Calculate from', [{ value: 'cp', label: 'Cost and price' }, { value: 'cm', label: 'Cost and margin' }, { value: 'ck', label: 'Cost and markup' }])}
          {F('mg_c', 'Cost')}
          {F('mg_v', v.mg_mode === 'cp' ? 'Selling price' : v.mg_mode === 'cm' ? 'Margin (%)' : 'Markup (%)')}
        </Card>
        <Card
          label="GST / VAT"
          formula={v.tx_exc === 'exc' ? 'gross = net × (1 + rate)' : 'net = gross ÷ (1 + rate)'}
          result={
            tx
              ? `Net ${f(tx.net)} + tax ${f(tx.tax)} = gross ${f(tx.gross)}${v.tx_split === 'yes' ? ` (CGST ${f(tx.cgst)} + SGST ${f(tx.sgst)})` : ''}`
              : need
          }
        >
          {seg('tx_exc', 'Amount entered is', [{ value: 'exc', label: 'Excluding tax' }, { value: 'inc', label: 'Including tax' }])}
          {F('tx_a', 'Amount')}
          {F('tx_r', 'Rate', ' (%)')}
          <div className="sm:col-span-2">
            <Segmented<string> label="Rate preset" options={rateOpts} value={v.tx_r} onChange={set('tx_r')} />
          </div>
          {seg('tx_split', 'Show CGST/SGST halves', [{ value: 'no', label: 'Total tax' }, { value: 'yes', label: 'CGST + SGST' }])}
        </Card>
        <Card
          label="Percentage points vs percent"
          formula="points = B − A; percent = (B − A) ÷ A × 100"
          result={pp ? `${f(ppA, 4)}% → ${f(ppB, 4)}% is ${f(pp.points, 4)} percentage points, a ${pct(pp.relative)} relative change` : need}
        >
          {F('pp_a', 'From (%)')}
          {F('pp_b', 'To (%)')}
        </Card>
      </div>
      <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-400">
        Percentage points are the plain difference between two percentages (10% to 12% is 2 points). Percent change compares them as a ratio (the same move is a 20% increase). Margin is profit as a share of the selling price, markup is profit as a share of cost, so 25% markup equals 20% margin.
      </p>
    </div>
  );
}
