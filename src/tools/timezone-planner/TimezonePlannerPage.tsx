import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import timezonePlanner from './index';
import {
  buildGrid,
  buildIcs,
  cleanPlace,
  defaultPlaces,
  describeOverlap,
  formatClock,
  makePlace,
  MAX_PLACES,
  momentLines,
  momentText,
  searchPlaces,
  todayIn,
  validDate,
  type Place,
} from './features/timezone-planner';
import { localZone, formatOffset } from '../timestamp-converter/features/timestamp';
import { useShareState } from '../../shared/hooks/useShareState';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CopyButton, Segmented } from '../../shared/ui/tool';
import { Badge, Button, Icon } from '../../shared/ui/ui';
import { downloadText } from '../../shared/utils/dom.utils';

const card = 'rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const field =
  'block w-full rounded-xl border border-field-edge bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-900 dark:text-slate-100';
const small = 'rounded-lg border border-field-edge bg-white px-2 py-1.5 text-sm text-slate-900 pointer-coarse:min-h-11 dark:bg-slate-900 dark:text-slate-100';
const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function TimezonePlannerPage() {
  const [places, setPlaces] = useState<Place[]>(() => defaultPlaces());
  const [date, setDate] = useState(() => todayIn(localZone()));
  const [hour12, setHour12] = useState(false);
  const [selected, setSelected] = useState(0);
  const [title, setTitle] = useState('Meeting');
  const [duration, setDuration] = useState(60);
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState<[number, number]>([0, 0]);
  const gridRef = useRef<HTMLTableElement>(null);
  const ids = { date: useId(), search: useId(), title: useId(), dur: useId() };

  useShareState({ places, date, hour12, selected, title, duration }, (s) => {
    if (s.places) {
      const list = s.places.map(cleanPlace).filter((p): p is Place => !!p).slice(0, MAX_PLACES);
      if (list.length) setPlaces(list);
    }
    if (typeof s.date === 'string' && validDate(s.date)) setDate(s.date);
    if (s.hour12 !== undefined) setHour12(s.hour12);
    if (typeof s.selected === 'number' && Number.isFinite(s.selected)) setSelected(s.selected);
    if (typeof s.title === 'string') setTitle(s.title.slice(0, 120));
    if (typeof s.duration === 'number' && s.duration >= 1 && s.duration <= 1440) setDuration(Math.round(s.duration));
  });

  const grid = useMemo(() => buildGrid(places, validDate(date) ? date : todayIn(localZone())), [places, date]);
  const hits = useMemo(() => searchPlaces(query), [query]);
  const lines = useMemo(() => (selected ? momentLines(selected, places, hour12) : []), [selected, places, hour12]);
  const text = selected ? momentText(selected, places, hour12) : '';
  const overlap = grid ? describeOverlap(grid, hour12) : null;
  const selectedIndex = grid ? grid.slots.indexOf(selected) : -1;

  const update = (i: number, patch: Partial<Place>) => setPlaces((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const add = (zone: string, label: string) => {
    if (places.length >= MAX_PLACES) return;
    setPlaces((ps) => [...ps, makePlace(zone, label)]);
    setQuery('');
  };
  const toTop = (i: number) => setPlaces((ps) => [ps[i], ...ps.filter((_, j) => j !== i)]);

  const focusCell = (r: number, c: number) => {
    setFocus([r, c]);
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${r}-${c}"]`)?.focus());
  };
  const onKey = (e: KeyboardEvent, r: number, c: number) => {
    if (!grid) return;
    const rows = grid.rows.length;
    const cols = grid.slots.length;
    const move: Record<string, [number, number]> = {
      ArrowRight: [r, Math.min(cols - 1, c + 1)],
      ArrowLeft: [r, Math.max(0, c - 1)],
      ArrowDown: [Math.min(rows - 1, r + 1), c],
      ArrowUp: [Math.max(0, r - 1), c],
      Home: [r, 0],
      End: [r, cols - 1],
    };
    const to = move[e.key];
    if (!to) return;
    e.preventDefault();
    focusCell(to[0], to[1]);
  };

  const download = () => selected && downloadText(buildIcs({ startMs: selected, durationMin: duration, title, places, hour12 }), 'meeting.ics', 'text/calendar');

  const status = !grid
    ? 'Add a city to start.'
    : overlap
      ? `Everyone is working ${overlap}.`
      : places.length > 1
        ? 'No time when everyone is inside working hours on this day.'
        : 'Add more cities to compare.';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={timezonePlanner} />
      <Headline accent="meeting time">Find a </Headline>
      <StatusStrip status={status} tone={overlap ? 'good' : 'neutral'} />

      <section aria-label="Cities and date" className={`${card} space-y-5`}>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="relative min-w-0">
            <label htmlFor={ids.search} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
              Add a city or time zone
            </label>
            <input id={ids.search} type="search" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tokyo, Berlin, America/Chicago…" className={field} />
            {hits.length > 0 && (
              <ul aria-label="Search results" className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {hits.map((h) => (
                  <li key={`${h.zone}-${h.label}`}>
                    <button type="button" onClick={() => add(h.zone, h.label)} disabled={places.length >= MAX_PLACES} className="flex w-full min-w-0 flex-col px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50 pointer-coarse:min-h-11 dark:hover:bg-slate-800">
                      <span className="break-words font-medium text-slate-900 dark:text-slate-100">Add {h.label}</span>
                      <span className="break-all text-xs text-slate-600 dark:text-slate-400">{h.detail}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label htmlFor={ids.date} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
              Date{grid ? ` in ${places[0].label}` : ''}
            </label>
            <input id={ids.date} type="date" value={date} onChange={(e) => validDate(e.target.value) && setDate(e.target.value)} className={field} />
          </div>
          <Segmented<'24' | '12'> label="Clock" options={[{ value: '24', label: '24-hour' }, { value: '12', label: '12-hour' }]} value={hour12 ? '12' : '24'} onChange={(v) => setHour12(v === '12')} />
        </div>

        <ul aria-label="Cities" className="space-y-2">
          {places.map((p, i) => (
            <li key={`${p.zone}-${i}`} className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
              <div className="min-w-0 flex-1 basis-40">
                <p className="break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {p.label} {i === 0 && <Badge tone="green">base</Badge>}
                </p>
                <p className="break-all text-xs text-slate-600 dark:text-slate-400">{p.zone}</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                Works from
                <select className={small} value={p.start} onChange={(e) => update(i, { start: +e.target.value })} aria-label={`${p.label} working hours start`}>
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{formatClock(h, 0, hour12)}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                to
                <select className={small} value={p.end} onChange={(e) => update(i, { end: +e.target.value })} aria-label={`${p.label} working hours end`}>
                  {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => (
                    <option key={h} value={h}>{h === 24 ? (hour12 ? '12:00 AM (end of day)' : '24:00') : formatClock(h, 0, hour12)}</option>
                  ))}
                </select>
              </label>
              <div className="flex gap-1">
                {i > 0 && (
                  <Button variant="ghost" className="!px-3 !py-1.5 !text-sm" onClick={() => toTop(i)} aria-label={`Make ${p.label} the base`}>
                    Make base
                  </Button>
                )}
                <Button variant="ghost" className="!px-3 !py-1.5 !text-sm" onClick={() => setPlaces((ps) => ps.filter((_, j) => j !== i))} aria-label={`Remove ${p.label}`}>
                  <Icon name="x" className="h-4 w-4" /> Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {grid && (
        <section aria-label="Time grid" className={`${card} space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">
              Day planner{grid.hours !== 24 ? ` (${grid.hours}-hour day in ${places[0].label})` : ''}
            </h2>
            <p className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-200 dark:bg-emerald-800" /> working hours</span>
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-200 dark:bg-slate-700" /> outside</span>
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded ring-2 ring-emerald-600" /> everyone free</span>
            </p>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">Pick a slot. Arrow keys move between slots; Enter or Space selects.</p>
          <div role="region" aria-label="Time grid scroll area" tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table ref={gridRef} className="border-separate border-spacing-0 text-center text-xs">
              <caption className="sr-only">Hourly slots for {date} aligned to {places[0].label}, one row per city</caption>
              <tbody>
                {grid.rows.map((row, r) => (
                  <tr key={`${row.place.zone}-${r}`}>
                    <th scope="row" className="sticky left-0 z-10 min-w-[8.5rem] max-w-[8.5rem] border-b border-slate-100 bg-white p-2 text-left align-middle font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                      <span className="block truncate">{row.place.label}</span>
                      <span className="block text-[11px] font-normal text-slate-600 dark:text-slate-400">
                        UTC{formatOffset(row.offsetStart)}
                        {row.offsetEnd !== row.offsetStart ? ` → ${formatOffset(row.offsetEnd)}` : ''}
                      </span>
                      {row.offsetEnd !== row.offsetStart && <span className="block text-[11px] font-normal text-amber-700 dark:text-amber-400">clocks change</span>}
                    </th>
                    {row.cells.map((c, i) => {
                      const every = grid.overlap.includes(i);
                      const sel = c.ms === selected;
                      const label = `${row.place.label}, ${c.dayLabel} ${formatClock(c.hour, c.minute, hour12)}, ${c.working ? 'working hours' : 'outside working hours'}${every ? ', everyone is available' : ''}`;
                      return (
                        <td key={c.ms} className={`border-b border-slate-100 p-0 dark:border-slate-800 ${every ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''}`}>
                          <button
                            type="button"
                            data-cell={`${r}-${i}`}
                            tabIndex={focus[0] === r && focus[1] === i ? 0 : -1}
                            aria-label={label}
                            aria-pressed={sel}
                            onFocus={() => setFocus([r, i])}
                            onKeyDown={(e) => onKey(e, r, i)}
                            onClick={() => (setSelected(c.ms), setFocus([r, i]))}
                            className={`block h-12 w-11 rounded-md px-0.5 py-1 leading-tight pointer-coarse:min-h-11 ${
                              c.working ? 'bg-emerald-200 font-semibold text-emerald-950 dark:bg-emerald-800 dark:text-emerald-50' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            } ${every ? 'ring-2 ring-inset ring-emerald-600' : ''} ${sel ? 'outline outline-2 outline-offset-[-2px] outline-slate-900 dark:outline-white' : ''}`}
                          >
                            <span className="block text-sm">{hour12 ? formatClock(c.hour, 0, true).replace(':00 ', '') : pad(c.hour)}</span>
                            <span className="block text-[10px] font-normal">{c.minute ? `:${pad(c.minute)}` : c.hour === 0 || i === 0 ? c.dayLabel : ' '}</span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section aria-label="Selected time" className={`${card} space-y-4`}>
        <h2 className="eyebrow text-slate-600 dark:text-slate-400">Selected time</h2>
        {!selected || !lines.length ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">Click a slot in the grid to see that moment in every city.</p>
        ) : (
          <>
            <ul aria-label="Selected time in each city" className="grid gap-2 sm:grid-cols-2">
              {lines.map((l, i) => (
                <li key={`${l.place.zone}-${i}`} className="min-w-0 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="break-words font-semibold text-slate-900 dark:text-slate-100">{l.place.label}</span>
                    <Badge tone={l.working ? 'green' : 'neutral'}>{l.working ? 'working hours' : 'outside hours'}</Badge>
                  </p>
                  <p className="text-slate-800 dark:text-slate-200">
                    {l.weekday} {l.date}, {l.clock} <span className="text-xs text-slate-600 dark:text-slate-400">({l.offset})</span>
                  </p>
                </li>
              ))}
            </ul>
            <div className="rounded-xl bg-slate-100 p-3 font-mono text-sm break-words text-slate-800 dark:bg-slate-950 dark:text-slate-300" aria-label="Text to share">{text}</div>
            <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
              <div>
                <label htmlFor={ids.title} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Event title</label>
                <input id={ids.title} className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
              </div>
              <div>
                <label htmlFor={ids.dur} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">Length</label>
                <select id={ids.dur} className={`${field}`} value={duration} onChange={(e) => setDuration(+e.target.value)}>
                  {(DURATIONS.includes(duration) ? DURATIONS : [...DURATIONS, duration].sort((a, b) => a - b)).map((d) => (
                    <option key={d} value={d}>{d} minutes</option>
                  ))}
                </select>
              </div>
              <CopyButton text={text} label="Copy text" />
              <Button onClick={download}>
                <Icon name="download" className="h-4 w-4" /> Download .ics
              </Button>
            </div>
            {selectedIndex === -1 && <p className="text-xs text-slate-600 dark:text-slate-400">This slot is on a different day than the grid above; change the date to see it highlighted.</p>}
          </>
        )}
      </section>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Conversions use your browser&rsquo;s time zone data, including daylight saving changes. Nothing is uploaded; the .ics file is made in your browser.
      </p>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
