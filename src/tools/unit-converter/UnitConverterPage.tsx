import { useMemo, useState } from 'react';
import unitConverter from './index';
import { belowAbsoluteZero, CATEGORIES, convertAll, findCategory, searchUnits } from './features/unit-converter';
import { formatRational, isExactWithin, parseDecimal } from './features/rational';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CopyButton } from '../../shared/ui/tool';
import { Select } from '../../shared/ui/Select';
import { Notices } from '../../shared/ui/convert';
import { Icon } from '../../shared/ui/ui';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';

const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
const PRECISIONS = [3, 4, 6, 8, 10, 12, 15, 20];
const DEFAULT_UNIT: Record<string, string> = { data: 'GB', rate: 'mbps', length: 'm', temperature: 'c', mass: 'kg', volume: 'l', time: 'h' };

const inputClass =
  'block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 aria-invalid:border-red-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

export default function UnitConverterPage() {
  const [categoryId, setCategoryId] = useState('data');
  const [unitId, setUnitId] = useState('GB');
  const [text, setText] = useState('1');
  const [precision, setPrecision] = useState(10);
  const [query, setQuery] = useState('');

  const category = findCategory(categoryId) ?? CATEGORIES[0];

  useShareState(
    { cat: categoryId, unit: unitId, value: text, precision },
    (s) => {
      const cat = s.cat ? findCategory(s.cat) : category;
      if (!cat) return;
      if (s.cat) setCategoryId(s.cat);
      if (s.unit && cat.units.some((x) => x.id === s.unit)) setUnitId(s.unit);
      else if (s.cat) setUnitId(DEFAULT_UNIT[cat.id] ?? cat.units[0].id);
      if (s.value !== undefined) setText(s.value);
      if (s.precision !== undefined && PRECISIONS.includes(s.precision)) setPrecision(s.precision);
    },
    { cat: CATEGORY_IDS },
  );

  const value = useMemo(() => (text.trim() ? parseDecimal(text) : null), [text]);
  const results = useMemo(() => (value ? convertAll(category, unitId, value) : []), [value, category, unitId]);
  const activeUnit = category.units.find((x) => x.id === unitId) ?? category.units[0];
  const fmt = (r: NonNullable<(typeof results)[number]['value']>) => formatRational(r, { precision });
  const hits = useMemo(() => searchUnits(query, 12), [query]);

  useToolShortcuts({
    getOutput: () => results.map((x) => (x.value ? `${fmt(x.value)} ${x.unit.symbol}` : '')).filter(Boolean).join('\n'),
  });

  const pickCategory = (id: string) => {
    const cat = findCategory(id)!;
    setCategoryId(id);
    setUnitId(DEFAULT_UNIT[id] ?? cat.units[0].id);
    setText('1');
  };

  const pickUnit = (catId: string, id: string) => {
    if (catId === categoryId) {
      const hit = results.find((x) => x.unit.id === id);
      if (hit?.value) setText(fmt(hit.value));
      setUnitId(id);
    } else {
      setCategoryId(catId);
      setUnitId(id);
      setText('1');
    }
    setQuery('');
    requestAnimationFrame(() => document.getElementById(`unit-${id}`)?.focus());
  };

  const invalid = !!text.trim() && !value;
  const notices: string[] = [];
  if (value && belowAbsoluteZero(category, unitId, value)) notices.push('That is below absolute zero (0 K), which isn’t physically possible.');

  const status = !text.trim()
    ? 'Type a value into any unit.'
    : invalid
      ? `“${text.trim()}” isn't a number. Use digits with an optional decimal point, exponent (1e6) or fraction (1/3).`
      : `${text.trim()} ${activeUnit.symbol} in ${category.units.length} ${category.name.toLowerCase()} units`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={unitConverter} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="unit">Convert any </Headline>
      </div>

      <StatusStrip status={status} tone={value ? 'good' : 'neutral'} />

      <section aria-label="Categories and search" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={c.id === categoryId}
              onClick={() => pickCategory(c.id)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium pointer-coarse:min-h-11 ${
                c.id === categoryId
                  ? 'bg-primary text-primary-ink ring-1 ring-inset ring-primary-edge'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="relative min-w-0 flex-1 basis-56">
            <label htmlFor="unit-search" className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
              Search units
            </label>
            <input
              id="unit-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="KiB, psi, fahrenheit…"
              autoComplete="off"
              className={inputClass}
            />
            {hits.length > 0 && (
              <ul aria-label="Matching units" className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                {hits.map((h) => (
                  <li key={`${h.category.id}-${h.unit.id}`}>
                    <button
                      type="button"
                      onClick={() => pickUnit(h.category.id, h.unit.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm pointer-coarse:min-h-11 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span className="min-w-0 text-slate-900 dark:text-slate-100">
                        {h.unit.name} <span className="text-slate-500">({h.unit.symbol})</span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{h.category.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Select label="Precision" options={PRECISIONS.map((p) => ({ value: p, label: `${p} digits` }))} value={precision} onChange={setPrecision} />
        </div>
      </section>

      {category.note && (
        <p className="flex gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0">{category.note}</span>
        </p>
      )}
      <Notices items={notices} />

      <section aria-label={`${category.name} units`} className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {category.units.map((unit) => {
            const active = unit.id === unitId;
            const res = results.find((x) => x.unit.id === unit.id);
            const shown = active ? text : res?.value ? fmt(res.value) : '';
            const approx = !active && res?.value && !isExactWithin(res.value, precision);
            return (
              <li key={unit.id} className="min-w-0">
                <label htmlFor={`unit-${unit.id}`} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-medium text-slate-800 dark:text-slate-200">
                    {unit.name} ({unit.symbol})
                  </span>
                  {approx && <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400" title="Rounded for display">≈ rounded</span>}
                </label>
                <div className="flex gap-1">
                  <input
                    id={`unit-${unit.id}`}
                    value={shown}
                    inputMode="decimal"
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={(active && invalid) || undefined}
                    placeholder={res && res.value === null ? 'undefined' : undefined}
                    onChange={(e) => {
                      setUnitId(unit.id);
                      setText(e.target.value);
                    }}
                    className={`${inputClass} ${active ? 'border-emerald-500 dark:border-emerald-700' : ''}`}
                  />
                  <CopyButton text={shown && !invalid ? `${shown} ${unit.symbol}` : ''} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Conversions use exact fractions, so there are no floating-point artefacts like 0.30000000000000004; results are only rounded for display.
        Definitions follow SI, NIST and the international yard and pound (1959).
      </p>
    </div>
  );
}
