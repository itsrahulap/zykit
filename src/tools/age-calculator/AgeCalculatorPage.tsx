import { useState } from 'react';
import ageCalculator from './index';
import { age, parseDate, todayISO } from './features/age-calculator';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows } from '../../shared/ui/Panel';
import { Breadcrumb } from '../../shared/ui/tool';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark]';
const labelCls = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';
const card = 'rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const n = (x: number) => x.toLocaleString('en-US');
const plural = (x: number, w: string) => `${n(x)} ${w}${x === 1 ? '' : 's'}`;

export default function AgeCalculatorPage() {
  const [birth, setBirth] = useState('');
  const [at, setAt] = useState(todayISO);
  const b = parseDate(birth);
  const t = parseDate(at);
  const a = b && t ? age(b, t) : null;
  const status = !birth ? 'Enter a date of birth.' : !b || !t ? 'Enter valid dates.' : !a ? 'The date of birth is after the "age at" date.' : `${plural(a.years, 'year')} old.`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={ageCalculator} />
      <Headline accent="age">Your exact </Headline>
      <StatusStrip status={status} tone={a ? 'good' : 'neutral'} />

      <section aria-label="Dates" className={`grid gap-4 sm:grid-cols-2 ${card}`}>
        <label className="block min-w-0">
          <span className={labelCls}>Date of birth</span>
          <input type="date" className={inputCls} value={birth} max={at || undefined} onChange={(e) => setBirth(e.target.value)} />
        </label>
        <label className="block min-w-0">
          <span className={labelCls}>Age at</span>
          <input type="date" className={inputCls} value={at} onChange={(e) => setAt(e.target.value)} />
        </label>
      </section>

      {a && (
        <div className="grid gap-6 lg:grid-cols-2" aria-live="polite">
          <section aria-label="Age" className={`space-y-4 ${card}`}>
            <p className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
              {plural(a.years, 'year')}, {plural(a.months, 'month')}, {plural(a.days, 'day')}
            </p>
            <DetailRows
              rows={[
                ['Born on a', a.bornOn],
                ['Total months', n(a.totalMonths)],
                ['Total weeks', n(a.totalWeeks)],
                ['Total days', n(a.totalDays)],
                ['Total hours', n(a.totalHours)],
              ]}
            />
          </section>
          <section aria-label="Next birthday" className={`space-y-4 ${card}`}>
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">Next birthday</h2>
            <p className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
              {a.nextBirthday.daysUntil === 0 ? 'Today! 🎂' : `In ${plural(a.nextBirthday.daysUntil, 'day')}`}
            </p>
            <DetailRows
              rows={[
                ['Date', a.nextBirthday.date],
                ['Turning', String(a.nextBirthday.turning)],
              ]}
            />
          </section>
        </div>
      )}
    </div>
  );
}
