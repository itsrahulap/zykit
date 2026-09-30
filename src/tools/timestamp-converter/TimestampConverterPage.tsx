import { useEffect, useMemo, useState } from 'react';
import timestampConverter from './index';
import {
  calendarInfo,
  civilToMs,
  formatInZone,
  fromMs,
  isoInZone,
  localZone,
  parseTimestamp,
  relativeTime,
  rfc2822,
  timeZones,
  toDatetimeLocal,
  UNIT_LABELS,
  type Unit,
} from './features/timestamp';
import { useShareState } from '../../shared/hooks/useShareState';
import { DropZone } from '../../shared/ui/DropZone';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { DetailRows, Panel } from '../../shared/ui/Panel';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';

type UnitChoice = 'auto' | Unit;

const INPUT =
  'w-full min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-900 dark:text-slate-100 dark:[color-scheme:dark]';

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function Value({ text }: { text: string }) {
  return (
    <span className="inline-flex max-w-full flex-wrap items-center justify-end gap-1">
      <span className="break-all font-mono text-sm">{text}</span>
      <CopyButton text={text} />
    </span>
  );
}

export default function TimestampConverterPage() {
  const now = useNow();
  const zones = useMemo(() => timeZones(), []);
  const local = useMemo(() => localZone(), []);
  const zoneOptions = useMemo(() => {
    const list = zones.includes(local) ? zones : [local, ...zones];
    return list.map((z) => ({ value: z, label: z }));
  }, [zones, local]);

  const [input, setInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [unitChoice, setUnitChoice] = useState<UnitChoice>('auto');
  const [zone, setZone] = useState(local);

  const [civil, setCivil] = useState(() => toDatetimeLocal(Date.now(), local));
  const [civilZone, setCivilZone] = useState(local);

  const zoneIds = useMemo(() => zoneOptions.map((z) => z.value), [zoneOptions]);
  useShareState(
    { input, unitChoice, zone, civil, civilZone },
    (r) => {
      if (r.input !== undefined) setInput(r.input);
      if (r.unitChoice !== undefined) setUnitChoice(r.unitChoice);
      if (r.zone !== undefined) setZone(r.zone);
      if (r.civil !== undefined) setCivil(r.civil);
      if (r.civilZone !== undefined) setCivilZone(r.civilZone);
    },
    { unitChoice: ['auto', 's', 'ms', 'us', 'ns'] as const, zone: zoneIds, civilZone: zoneIds },
  );

  const parsed = useMemo(() => parseTimestamp(input, unitChoice === 'auto' ? undefined : unitChoice), [input, unitChoice]);
  const reverse = useMemo(() => (civil ? civilToMs(civil, civilZone) : null), [civil, civilZone]);

  const nowS = String(Math.floor(now / 1000));
  const nowMs = String(now);

  const status = !parsed.ok
    ? parsed.error
    : `Read as ${UNIT_LABELS[parsed.unit].toLowerCase()}${unitChoice === 'auto' ? ' (detected)' : ''} · ${isoInZone(parsed.ms, 'UTC')}`;

  const cal = parsed.ok ? calendarInfo(parsed.ms, zone) : null;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={timestampConverter} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="dates">Turn epochs into </Headline>
        <Button variant="secondary" onClick={() => setInput(nowS)}>
          <Icon name="clock" className="h-4 w-4" /> Use now
        </Button>
      </div>

      <StatusStrip status={status} tone={parsed.ok ? 'good' : 'neutral'} />

      <section
        aria-label="Current time"
        className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900"
      >
        {[
          ['Now · seconds', nowS],
          ['Now · milliseconds', nowMs],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="eyebrow text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2">
              <span className="break-all font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white" data-testid={label}>
                {value}
              </span>
              <CopyButton text={value} />
            </p>
          </div>
        ))}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel eyebrow="Timestamp to date" icon="clock" className="min-w-0">
          <div className="space-y-4">
            <DropZone onText={(t) => setInput(t.trim())}>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-600 dark:text-slate-400">Unix timestamp</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={!parsed.ok}
                  className={INPUT}
                />
              </label>
            </DropZone>
            <Segmented<UnitChoice>
              label="Unit"
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 's', label: 's' },
                { value: 'ms', label: 'ms' },
                { value: 'us', label: 'µs' },
                { value: 'ns', label: 'ns' },
              ]}
              value={unitChoice}
              onChange={setUnitChoice}
            />
            <div className="flex flex-wrap">
              <Select label="Time zone" options={zoneOptions} value={zone} onChange={setZone} />
            </div>
          </div>

          <div className="mt-6" aria-live="polite">
            {!parsed.ok ? (
              <p
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
              >
                {parsed.error}
              </p>
            ) : (
              <DetailRows
                rows={[
                  ['Local', <Value key="Local" text={formatInZone(parsed.ms, local)} />],
                  ['UTC', <Value key="UTC" text={formatInZone(parsed.ms, 'UTC')} />],
                  ['Selected zone', <Value key="Selected zone" text={formatInZone(parsed.ms, zone)} />],
                  ['ISO 8601', <Value key="ISO 8601" text={isoInZone(parsed.ms, 'UTC')} />],
                  ['ISO 8601 (zone)', <Value key="ISO 8601 (zone)" text={isoInZone(parsed.ms, zone)} />],
                  ['RFC 2822', <Value key="RFC 2822" text={rfc2822(parsed.ms, zone)} />],
                  ['Relative', relativeTime(parsed.ms, now)],
                  ['Day of week', cal!.dayOfWeek],
                  ['Day of year', String(cal!.dayOfYear)],
                  ['ISO week', `W${String(cal!.isoWeek).padStart(2, '0')} of ${cal!.isoWeekYear}`],
                  ['Unix seconds', <Value key="Unix seconds" text={fromMs(parsed.ms, 's')} />],
                  ['Unix milliseconds', <Value key="Unix milliseconds" text={fromMs(parsed.ms, 'ms')} />],
                ]}
              />
            )}
          </div>
        </Panel>

        <Panel eyebrow="Date to timestamp" icon="swap" className="min-w-0">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600 dark:text-slate-400">Date and time</span>
              <input type="datetime-local" step={1} value={civil} onChange={(e) => setCivil(e.target.value)} className={INPUT} />
            </label>
            <div className="flex flex-wrap">
              <Select label="In time zone" options={zoneOptions} value={civilZone} onChange={setCivilZone} />
            </div>
          </div>
          <div className="mt-6" aria-live="polite">
            {!reverse ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Pick a date and time.</p>
            ) : !reverse.ok ? (
              <p
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
              >
                {reverse.error}
              </p>
            ) : (
              <DetailRows
                rows={[
                  ['Unix seconds', <Value key="Unix seconds" text={fromMs(reverse.ms, 's')} />],
                  ['Unix milliseconds', <Value key="Unix milliseconds" text={fromMs(reverse.ms, 'ms')} />],
                  ['ISO 8601 (UTC)', <Value key="ISO 8601 (UTC)" text={isoInZone(reverse.ms, 'UTC')} />],
                ]}
              />
            )}
          </div>
        </Panel>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Units are guessed from the number of digits: up to 11 digits is seconds, up to 14 milliseconds, up to 17 microseconds, beyond that
        nanoseconds. Pick a unit to override. Time zone rules come from your browser.
      </p>
    </div>
  );
}
