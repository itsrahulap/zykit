import { useMemo, useState, type ReactNode } from 'react';
import dateCalculator from './index';
import {
  addBusinessDays,
  addDuration,
  businessDaysBetween,
  dayInfo,
  dayOf,
  describeDifference,
  difference,
  formatDay,
  parseDay,
  parseHolidays,
  WEEKENDS,
  ZERO_DURATION,
  type Duration,
  type WeekendPreset,
} from './features/date-calculator';
import { civilToMs, formatOffset, isoInZone, localZone, offsetMinutes, timeZones, toDatetimeLocal } from '../timestamp-converter/features/timestamp';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CopyButton, Segmented } from '../../shared/ui/tool';
import { Notices } from '../../shared/ui/convert';
import { useShareState } from '../../shared/hooks/useShareState';
import { Icon } from '../../shared/ui/ui';

type Mode = 'diff' | 'add' | 'business';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark]';
const labelCls = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';
const linkBtn = 'text-sm font-semibold text-emerald-700 underline-offset-4 pointer-coarse:min-h-11 hover:underline dark:text-emerald-400';
const DURATION_UNITS: [keyof Duration, string][] = [
  ['years', 'Years'],
  ['months', 'Months'],
  ['weeks', 'Weeks'],
  ['days', 'Days'],
  ['hours', 'Hours'],
  ['minutes', 'Minutes'],
  ['seconds', 'Seconds'],
];
const num = (n: number, max = 2) => n.toLocaleString('en-US', { maximumFractionDigits: max });

function Card({ label, icon, children }: { label: string; icon: Parameters<typeof Icon>[0]['name']; children: ReactNode }) {
  return (
    <section aria-label={label} className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <Icon name={icon} className="h-4 w-4" /> {label}
      </h2>
      {children}
    </section>
  );
}

function DateTimeField({ label, value, onChange, onNow, dateOnly }: { label: string; value: string; onChange: (v: string) => void; onNow: () => void; dateOnly?: boolean }) {
  return (
    <div className="min-w-0">
      <label className="block">
        <span className={labelCls}>{label}</span>
        <input type={dateOnly ? 'date' : 'datetime-local'} step={dateOnly ? undefined : 1} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
      <button type="button" className={`${linkBtn} mt-1`} onClick={onNow}>
        {dateOnly ? 'Today' : 'Now'}
      </button>
    </div>
  );
}

function Result({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <p data-testid={testId} className="rounded-2xl bg-primary p-4 text-lg font-semibold break-words text-primary-ink sm:text-xl" aria-live="polite">
      {children}
    </p>
  );
}

export default function DateCalculatorPage() {
  const zones = useMemo(() => timeZones(), []);
  const [zone, setZone] = useState(() => localZone());
  const [mode, setMode] = useState<Mode>('diff');
  const nowLocal = () => toDatetimeLocal(Date.now(), zone);
  const today = () => formatDay(dayOf(Date.now(), zone));
  const [start, setStart] = useState(() => toDatetimeLocal(Date.now(), localZone()));
  const [end, setEnd] = useState(() => toDatetimeLocal(Date.now() + 30 * 86_400_000, localZone()));
  const [sign, setSign] = useState<'add' | 'sub'>('add');
  const [dur, setDur] = useState<Record<keyof Duration, string>>({ years: '0', months: '1', weeks: '0', days: '0', hours: '0', minutes: '0', seconds: '0' });
  const [bStart, setBStart] = useState(() => formatDay(dayOf(Date.now(), localZone())));
  const [bEnd, setBEnd] = useState(() => formatDay(dayOf(Date.now() + 30 * 86_400_000, localZone())));
  const [bAdd, setBAdd] = useState('10');
  const [weekend, setWeekend] = useState<WeekendPreset>('sat-sun');
  const [holidayText, setHolidayText] = useState('');

  useShareState(
    { mode, zone, start, end, sign, dur: JSON.stringify(dur), bStart, bEnd, bAdd, weekend, holidays: holidayText },
    (s) => {
      if (s.mode) setMode(s.mode);
      if (s.zone && zones.includes(s.zone)) setZone(s.zone);
      if (s.start !== undefined) setStart(s.start);
      if (s.end !== undefined) setEnd(s.end);
      if (s.sign) setSign(s.sign);
      if (s.dur) {
        try {
          const d = JSON.parse(s.dur) as Record<string, unknown>;
          setDur((cur) => {
            const next = { ...cur };
            for (const [k] of DURATION_UNITS) if (typeof d[k] === 'string' && /^-?\d{0,6}$/.test(d[k] as string)) next[k] = d[k] as string;
            return next;
          });
        } catch {
          /* ignore a malformed link */
        }
      }
      if (s.bStart !== undefined) setBStart(s.bStart);
      if (s.bEnd !== undefined) setBEnd(s.bEnd);
      if (s.bAdd !== undefined) setBAdd(s.bAdd);
      if (s.weekend) setWeekend(s.weekend);
      if (s.holidays !== undefined) setHolidayText(s.holidays);
    },
    { mode: ['diff', 'add', 'business'], sign: ['add', 'sub'], weekend: ['sat-sun', 'fri-sat', 'sun', 'none'] },
  );

  const startMs = useMemo(() => civilToMs(start, zone), [start, zone]);
  const endMs = useMemo(() => civilToMs(end, zone), [end, zone]);

  const diff = startMs.ok && endMs.ok ? difference(startMs.ms, endMs.ms, zone) : null;

  const duration: Duration | null = useMemo(() => {
    const d = { ...ZERO_DURATION };
    for (const [k] of DURATION_UNITS) {
      const v = dur[k].trim() === '' ? 0 : Number(dur[k]);
      if (!Number.isInteger(v) || Math.abs(v) > 1_000_000) return null;
      d[k] = v;
    }
    return d;
  }, [dur]);
  const added = startMs.ok && duration ? addDuration(startMs.ms, zone, duration, sign === 'add' ? 1 : -1) : null;

  const holidays = useMemo(() => parseHolidays(holidayText), [holidayText]);
  const bOpts = useMemo(() => ({ weekend: WEEKENDS[weekend].days, holidays: holidays.days }), [weekend, holidays]);
  const bs = parseDay(bStart);
  const be = parseDay(bEnd);
  const bCount = bs !== null && be !== null ? businessDaysBetween(bs, be, bOpts) : null;
  const bN = Number(bAdd);
  const bResult = bs !== null && bAdd.trim() !== '' && Number.isInteger(bN) ? addBusinessDays(bs, bN, bOpts) : null;

  const infoRows = (ms: number): [string, string][] => {
    const i = dayInfo(dayOf(ms, zone));
    return [
      ['Weekday', i.weekday],
      ['ISO week', `W${String(i.isoWeek).padStart(2, '0')} of ${i.isoYear}`],
      ['Day of year', String(i.dayOfYear)],
      ['UTC offset', `UTC${formatOffset(offsetMinutes(ms, zone))}`],
    ];
  };

  const status =
    mode === 'business'
      ? bCount
        ? `${num(bCount.business)} business days between the dates (both included)`
        : 'Enter two dates.'
      : !startMs.ok
        ? `Start: ${startMs.error}`
        : mode === 'diff'
          ? !endMs.ok
            ? `End: ${endMs.error}`
            : describeDifference(diff!)
          : added?.ok
            ? isoInZone(added.ms, zone)
            : (added?.error ?? 'Enter whole numbers for the duration.');

  const totalRows = (ms: number): [string, string][] => [
    ['Total days', num(ms / 86_400_000, 4)],
    ['Total weeks', num(ms / (7 * 86_400_000), 4)],
    ['Total hours', num(ms / 3_600_000, 3)],
    ['Total minutes', num(ms / 60_000, 1)],
    ['Total seconds', num(ms / 1000, 0)],
  ];

  return (
    <div className="space-y-8">
      <Breadcrumb tool={dateCalculator} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="dates">Calculate with </Headline>
        <div className="w-full sm:w-72">
          <Select<string> label="Time zone" options={zones.map((z) => ({ value: z, label: z.replace(/_/g, ' ') }))} value={zone} onChange={setZone} />
        </div>
      </div>

      <StatusStrip status={status} tone={mode === 'business' ? (bCount ? 'good' : 'neutral') : (mode === 'diff' ? diff : added?.ok) ? 'good' : 'neutral'} />

      <Segmented<Mode>
        label="Calculation"
        options={[
          { value: 'diff', label: 'Difference' },
          { value: 'add', label: 'Add / subtract' },
          { value: 'business', label: 'Business days' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'diff' && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card label="Between" icon="clock">
            <div className="grid gap-4 sm:grid-cols-2">
              <DateTimeField label="Start" value={start} onChange={setStart} onNow={() => setStart(nowLocal())} />
              <DateTimeField label="End" value={end} onChange={setEnd} onNow={() => setEnd(nowLocal())} />
            </div>
            <button
              type="button"
              className={linkBtn}
              onClick={() => {
                setStart(end);
                setEnd(start);
              }}
            >
              Swap dates
            </button>
          </Card>
          {diff && startMs.ok && endMs.ok && (
            <div className="min-w-0 space-y-6">
              <Result testId="diff-result">{describeDifference(diff)}</Result>
              {diff.dstShiftMinutes !== 0 && (
                <Notices
                  items={[
                    `A daylight-saving change falls in this range: the wall clock moves ${Math.abs(diff.dstShiftMinutes)} minutes ${diff.dstShiftMinutes > 0 ? 'more' : 'less'} than the time that actually passes. The breakdown uses the wall clock; the totals are exact elapsed time.`,
                  ]}
                />
              )}
              <Panel eyebrow="Exact elapsed time" icon="chart">
                <DetailRows rows={totalRows(diff.totalMs)} />
              </Panel>
              <div className="grid gap-6 sm:grid-cols-2">
                <Panel eyebrow="Start" icon="info">
                  <DetailRows rows={infoRows(startMs.ms)} />
                </Panel>
                <Panel eyebrow="End" icon="info">
                  <DetailRows rows={infoRows(endMs.ms)} />
                </Panel>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'add' && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card label="Start and duration" icon="clock">
            <DateTimeField label="Start" value={start} onChange={setStart} onNow={() => setStart(nowLocal())} />
            <Segmented<'add' | 'sub'>
              label="Operation"
              options={[
                { value: 'add', label: 'Add' },
                { value: 'sub', label: 'Subtract' },
              ]}
              value={sign}
              onChange={setSign}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DURATION_UNITS.map(([k, l]) => (
                <label key={k} className="block min-w-0">
                  <span className={labelCls}>{l}</span>
                  <input type="number" step={1} className={inputCls} value={dur[k]} onChange={(e) => setDur({ ...dur, [k]: e.target.value })} />
                </label>
              ))}
            </div>
          </Card>
          <div className="min-w-0 space-y-6">
            {added?.ok ? (
              <>
                <Result testId="add-result">{isoInZone(added.ms, zone)}</Result>
                <div className="flex justify-end">
                  <CopyButton text={isoInZone(added.ms, zone)} />
                </div>
                <Notices
                  items={[
                    ...(added.clamp
                      ? [`${added.clamp.month} has no day ${added.clamp.from}, so the date was clamped to the last day of the month (the ${added.clamp.to}th). Calendars can't do anything else here, which is why adding 1 month then subtracting 1 month doesn't always return to the start.`]
                      : []),
                    ...(added.gapShiftMinutes ? [`That wall-clock time doesn't exist in ${zone} (the clocks jump forward for daylight saving), so it was moved ${added.gapShiftMinutes} minutes later.`] : []),
                  ]}
                />
                <Panel eyebrow="Result" icon="info">
                  <DetailRows rows={[...infoRows(added.ms), ['Unix time', String(Math.floor(added.ms / 1000))]]} />
                </Panel>
              </>
            ) : (
              <Panel eyebrow="Result" icon="warn">
                <p className="text-slate-700 dark:text-slate-300">{added?.error ?? (startMs.ok ? 'Enter whole numbers for the duration.' : startMs.error)}</p>
              </Panel>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Years and months move the calendar date, weeks and days keep the same clock time (even across daylight saving), and hours, minutes and
              seconds are exact elapsed time.
            </p>
          </div>
        </div>
      )}

      {mode === 'business' && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card label="Working days" icon="building">
            <div className="grid gap-4 sm:grid-cols-2">
              <DateTimeField dateOnly label="Start date" value={bStart} onChange={setBStart} onNow={() => setBStart(today())} />
              <DateTimeField dateOnly label="End date" value={bEnd} onChange={setBEnd} onNow={() => setBEnd(today())} />
            </div>
            <Segmented<WeekendPreset>
              label="Weekend"
              options={(Object.keys(WEEKENDS) as WeekendPreset[]).map((w) => ({ value: w, label: WEEKENDS[w].label }))}
              value={weekend}
              onChange={setWeekend}
            />
            <label className="block">
              <span className={labelCls}>Holidays (YYYY-MM-DD, one per line; text after the date is ignored)</span>
              <textarea
                className={`${inputCls} font-mono`}
                rows={5}
                value={holidayText}
                onChange={(e) => setHolidayText(e.target.value)}
                placeholder={'2025-12-25 Christmas\n2026-01-01 New Year'}
                spellCheck={false}
              />
            </label>
            {holidays.invalid.length > 0 && <Notices items={[`Not a valid date, ignored: ${holidays.invalid.slice(0, 5).join(', ')}${holidays.invalid.length > 5 ? '…' : ''}`]} />}
          </Card>
          <div className="min-w-0 space-y-6">
            {bCount ? (
              <>
                <Result testId="business-result">
                  {num(bCount.business)} business {Math.abs(bCount.business) === 1 ? 'day' : 'days'}
                </Result>
                <Panel eyebrow="Breakdown (both dates included)" icon="chart">
                  <DetailRows
                    rows={[
                      ['Calendar days', num(bCount.calendarDays)],
                      ['Weekend days', num(bCount.weekendDays)],
                      ['Holidays on working days', num(bCount.holidays)],
                      ['Business days', num(bCount.business)],
                    ]}
                  />
                </Panel>
              </>
            ) : (
              <Panel eyebrow="Business days" icon="warn">
                <p className="text-slate-700 dark:text-slate-300">{bs === null || be === null ? 'Enter a start and an end date.' : 'That range is too long.'}</p>
              </Panel>
            )}
            <Panel eyebrow="Add business days" icon="arrow">
              <label className="block">
                <span className={labelCls}>Working days after the start date (negative goes back)</span>
                <input type="number" step={1} className={`${inputCls} sm:w-40`} value={bAdd} onChange={(e) => setBAdd(e.target.value)} />
              </label>
              {bResult !== null ? (
                <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white" data-testid="workday-result">
                  {formatDay(bResult)} ({dayInfo(bResult).weekday})
                </p>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Enter a start date and a whole number.</p>
              )}
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">The start date itself doesn&rsquo;t count, like a spreadsheet&rsquo;s WORKDAY().</p>
            </Panel>
          </div>
        </div>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Times are read as wall-clock time in the selected zone, using your browser&rsquo;s time-zone database, so daylight-saving changes are handled
        correctly. ISO weeks start on Monday; week 1 contains the year&rsquo;s first Thursday.
      </p>
    </div>
  );
}
