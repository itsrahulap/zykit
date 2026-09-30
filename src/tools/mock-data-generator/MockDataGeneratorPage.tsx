import { useDeferredValue, useMemo, useState } from 'react';
import mockDataGenerator from './index';
import {
  DEFAULT_FIELDS,
  DEFAULT_SCHEMA,
  FIELD_TYPES,
  formatData,
  generateData,
  MAX_ROWS,
  validateSchema,
  type Field,
  type FieldType,
  type OutputFormat,
} from './features/mock-data-generator';
import { DIALECTS, type Dialect } from '../json-to-sql/features/sql';
import { randomSeed } from '../lorem-ipsum/features/lorem-ipsum';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, Segmented } from '../../shared/ui/tool';
import { Notices, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { useShareState } from '../../shared/hooks/useShareState';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const smallLabel = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400';
const iconBtn =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 pointer-coarse:h-11 pointer-coarse:w-11 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800';

const FORMATS: { value: OutputFormat; label: string; ext: string; mime: string }[] = [
  { value: 'json', label: 'JSON', ext: 'json', mime: 'application/json' },
  { value: 'jsonl', label: 'JSON Lines', ext: 'jsonl', mime: 'application/x-ndjson' },
  { value: 'csv', label: 'CSV', ext: 'csv', mime: 'text/csv' },
  { value: 'sql', label: 'SQL', ext: 'sql', mime: 'application/sql' },
];
const TYPE_IDS = new Set(FIELD_TYPES.map((t) => t.value));

/** Rebuilds a schema from untrusted JSON (share links), keeping only known keys and types. */
function parseSchema(json: string): Field[] | null {
  try {
    const raw: unknown = JSON.parse(json);
    if (!Array.isArray(raw) || raw.length > 100) return null;
    const out: Field[] = [];
    for (const r of raw as Record<string, unknown>[]) {
      if (typeof r !== 'object' || !r || typeof r.name !== 'string' || !TYPE_IDS.has(r.type as FieldType)) return null;
      const f: Field = { name: r.name.slice(0, 100), type: r.type as FieldType };
      for (const k of ['min', 'max', 'decimals', 'step'] as const) if (typeof r[k] === 'number') f[k] = r[k] as number;
      for (const k of ['from', 'to', 'values', 'pattern'] as const) if (typeof r[k] === 'string') f[k] = (r[k] as string).slice(0, 2000);
      out.push(f);
    }
    return out;
  } catch {
    return null;
  }
}

function NumberInput({ label, value, onChange, step }: { label: string; value: number | undefined; onChange: (v: number) => void; step?: string }) {
  return (
    <label className="block w-28">
      <span className={smallLabel}>{label}</span>
      <input type="number" step={step ?? 'any'} className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))} />
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder, wide, mono }: { label: string; value: string | undefined; onChange: (v: string) => void; placeholder?: string; wide?: boolean; mono?: boolean }) {
  return (
    <label className={`block ${wide ? 'min-w-0 flex-1 basis-48' : 'w-36'}`}>
      <span className={smallLabel}>{label}</span>
      <input className={`${inputCls} ${mono ? 'font-mono' : ''}`} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} spellCheck={false} autoComplete="off" />
    </label>
  );
}

function FieldOptions({ f, set }: { f: Field; set: (patch: Partial<Field>) => void }) {
  switch (f.type) {
    case 'integer':
    case 'float':
      return (
        <>
          <NumberInput label="Min" value={f.min} onChange={(min) => set({ min })} />
          <NumberInput label="Max" value={f.max} onChange={(max) => set({ max })} />
          {f.type === 'float' && <NumberInput label="Decimals" step="1" value={f.decimals} onChange={(decimals) => set({ decimals })} />}
        </>
      );
    case 'sequence':
      return (
        <>
          <NumberInput label="Start" step="1" value={f.min} onChange={(min) => set({ min })} />
          <NumberInput label="Step" step="1" value={f.step} onChange={(step) => set({ step })} />
        </>
      );
    case 'date':
    case 'datetime':
      return (
        <>
          <TextInput label="From" value={f.from} onChange={(from) => set({ from })} placeholder="YYYY-MM-DD" mono />
          <TextInput label="To" value={f.to} onChange={(to) => set({ to })} placeholder="YYYY-MM-DD" mono />
        </>
      );
    case 'enum':
      return <TextInput wide label="Values (comma separated)" value={f.values} onChange={(values) => set({ values })} placeholder="red, green, blue" />;
    case 'pattern':
      return <TextInput wide mono label="Pattern (# digit, ? letter, * either, \ escape)" value={f.pattern} onChange={(pattern) => set({ pattern })} placeholder="ORD-####-??" />;
    default:
      return null;
  }
}

export default function MockDataGeneratorPage() {
  const [fields, setFields] = useState<Field[]>(DEFAULT_SCHEMA);
  const [rowsText, setRowsText] = useState('100');
  const [seed, setSeed] = useState(() => randomSeed());
  const [format, setFormat] = useState<OutputFormat>('json');
  const [dialect, setDialect] = useState<Dialect>('postgres');
  const [table, setTable] = useState('mock_data');

  useShareState(
    { schema: JSON.stringify(fields), rows: rowsText, seed, format, dialect, table },
    (s) => {
      const schema = s.schema !== undefined ? parseSchema(s.schema) : null;
      if (schema) setFields(schema);
      if (s.rows !== undefined) setRowsText(s.rows);
      if (s.seed !== undefined) setSeed(s.seed);
      if (s.format) setFormat(s.format);
      if (s.dialect) setDialect(s.dialect);
      if (s.table !== undefined) setTable(s.table);
    },
    { format: ['json', 'jsonl', 'csv', 'sql'], dialect: DIALECTS.map((d) => d.value) },
  );

  const rows = Math.max(1, Math.min(MAX_ROWS, Math.floor(Number(rowsText)) || 1));
  const problems = useMemo(() => validateSchema(fields), [fields]);

  const input = useDeferredValue(useMemo(() => ({ fields, rows, seed, format, dialect, table }), [fields, rows, seed, format, dialect, table]));
  const stale = input.fields !== fields || input.rows !== rows || input.seed !== seed || input.format !== format;
  const output = useMemo(() => {
    if (validateSchema(input.fields).length) return '';
    return formatData(generateData(input.fields, input.rows, input.seed), input.format, { dialect: input.dialect, table: input.table });
  }, [input]);

  const update = (i: number, patch: Partial<Field>) => setFields((fs) => fs.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const changeType = (i: number, type: FieldType) => setFields((fs) => fs.map((f, j) => (j === i ? { name: f.name, type, ...DEFAULT_FIELDS[type] } : f)));
  const move = (i: number, d: number) =>
    setFields((fs) => {
      const next = [...fs];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  const addField = () => setFields((fs) => [...fs, { name: `field_${fs.length + 1}`, type: 'fullName' }]);
  const fmt = FORMATS.find((f) => f.value === format)!;

  const status = problems.length
    ? 'Fix the schema to generate data.'
    : `${pluralize(rows, 'row')} × ${pluralize(fields.length, 'field')} · seed ${seed || '(empty)'}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={mockDataGenerator} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="data">Realistic fake </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setSeed(randomSeed())}>
            <Icon name="dice" className="h-4 w-4" /> New seed
          </Button>
          <Button variant="ghost" onClick={() => setFields(DEFAULT_SCHEMA)}>
            Reset schema
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={stale ? 'busy' : problems.length ? 'neutral' : 'good'} />

      <section aria-label="Schema" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
          <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Icon name="layers" className="h-4 w-4" /> Schema
          </h2>
          <Button variant="secondary" onClick={addField}>
            <Icon name="sparkle" className="h-4 w-4" /> Add field
          </Button>
        </header>
        <ol className="divide-y divide-slate-100 dark:divide-slate-800">
          {fields.map((f, i) => (
            <li key={i} className="flex flex-wrap items-end gap-3 px-4 py-4 sm:px-6">
              <label className="block min-w-0 flex-1 basis-36 sm:max-w-48">
                <span className={smallLabel}>Field {i + 1} name</span>
                <input className={`${inputCls} font-mono`} value={f.name} onChange={(e) => update(i, { name: e.target.value })} spellCheck={false} autoComplete="off" />
              </label>
              <div className="min-w-0 flex-1 basis-44 sm:max-w-56">
                <Select<FieldType> label={`Field ${i + 1} type`} options={FIELD_TYPES} value={f.type} onChange={(t) => changeType(i, t)} />
              </div>
              <FieldOptions f={f} set={(p) => update(i, p)} />
              <div className="ml-auto flex items-center">
                <button type="button" className={iconBtn} aria-label={`Move field ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <Icon name="chevron-left" className="h-4 w-4 rotate-90" />
                </button>
                <button type="button" className={iconBtn} aria-label={`Move field ${i + 1} down`} disabled={i === fields.length - 1} onClick={() => move(i, 1)}>
                  <Icon name="chevron-right" className="h-4 w-4 rotate-90" />
                </button>
                <button type="button" className={iconBtn} aria-label={`Remove field ${i + 1}`} onClick={() => setFields((fs) => fs.filter((_, j) => j !== i))}>
                  <Icon name="x" className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Notices items={problems} />

      <OptionsCard label="Output options">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span>Rows</span>
          <input type="number" min={1} max={MAX_ROWS} value={rowsText} onChange={(e) => setRowsText(e.target.value)} className={`${inputCls} w-28`} />
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span>Seed</span>
          <input value={seed} onChange={(e) => setSeed(e.target.value)} className={`${inputCls} w-32 font-mono`} spellCheck={false} autoComplete="off" />
        </label>
        <Segmented<OutputFormat> label="Format" options={FORMATS} value={format} onChange={setFormat} />
        {format === 'sql' && (
          <>
            <div className="w-40">
              <Select<Dialect> label="SQL dialect" options={DIALECTS} value={dialect} onChange={setDialect} />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <span>Table</span>
              <input value={table} onChange={(e) => setTable(e.target.value)} className={`${inputCls} w-36 font-mono`} spellCheck={false} autoComplete="off" />
            </label>
          </>
        )}
        {Number(rowsText) > MAX_ROWS && <p className="basis-full text-sm text-amber-700 dark:text-amber-400">Limited to {MAX_ROWS.toLocaleString('en-US')} rows.</p>}
      </OptionsCard>

      {output && (
        <OutputPanel
          title={`${fmt.label} · ${pluralize(input.rows, 'row')}`}
          icon={format === 'sql' ? 'database' : 'braces'}
          text={output}
          fileName={`mock-data.${fmt.ext}`}
          mime={fmt.mime}
          busy={stale}
          kind={format === 'sql' ? 'sql' : format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'text'}
        />
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        The same schema, row count and seed always give the same data, so a share link reproduces it exactly. Emails and URLs only use reserved
        domains (example.com, .test), phone numbers use the fictional 555-01xx range and IPv6 uses the documentation prefix 2001:db8::/32.
      </p>
    </div>
  );
}
