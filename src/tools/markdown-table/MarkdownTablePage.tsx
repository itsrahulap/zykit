import { useDeferredValue, useMemo, useState } from 'react';
import markdownTable from './index';
import { formatTable, parseMarkdownTable, rowsFromJson, type Align } from './features/markdown-table';
import { parseCsv } from '../../shared/lib/csv';
import { parseJsonText, textError, type TextError } from '../../shared/lib/textpos';
import { Checkbox, ErrorPanel, Notices, OpenFileButton, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

type Mode = 'csv' | 'json' | 'grid' | 'format';
const MODES: { value: Mode; label: string }[] = [
  { value: 'csv', label: 'CSV / TSV' },
  { value: 'json', label: 'JSON' },
  { value: 'grid', label: 'Grid' },
  { value: 'format', label: 'Format table' },
];
const ALIGNS: { value: Align; label: string }[] = [
  { value: 'none', label: 'Default' },
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];
const SAMPLES: Record<Exclude<Mode, 'grid'>, string> = {
  csv: 'Name,Qty,Note\nApple,3,fresh\nBanana,12,a|b\n日本語,1,wide',
  json: '[{"name":"Apple","qty":3},{"name":"Banana","qty":12}]',
  format: '|Name|Qty|\n|:--|--:|\n|Apple|3|\n|Banana|12|',
};
const MAX_CHARS = 5_000_000;
const MAX_ROWS = 20_000;

export default function MarkdownTablePage() {
  const [mode, setMode] = useState<Mode>('csv');
  const [input, setInput] = useState('');
  const [grid, setGrid] = useState<string[][]>([['Name', 'Qty'], ['Apple', '3'], ['', '']]);
  const [aligns, setAligns] = useState<(Align | null)[]>([]);
  const [padded, setPadded] = useState(true);
  const text = useDeferredValue(input);

  const parsed = useMemo((): { rows: string[][]; detected: Align[]; escaped: boolean; notices: string[]; error?: TextError; located?: boolean } => {
    const none = { rows: [], detected: [], escaped: false, notices: [] };
    const fail = (message: string) => ({ ...none, error: textError('', 0, message) });
    if (mode === 'grid') return { ...none, rows: grid };
    if (!text.trim()) return none;
    if (text.length > MAX_CHARS) return fail('This input is too large (limit: about 5 MB).');
    if (mode === 'csv') {
      const r = parseCsv(text, { maxRows: MAX_ROWS });
      return { ...none, rows: r.rows, notices: [...r.issues.slice(0, 3).map((i) => `Line ${i.line}: ${i.message}`), ...(r.truncated ? [`Only the first ${MAX_ROWS} rows are shown.`] : [])] };
    }
    if (mode === 'json') {
      const j = parseJsonText(text);
      if (!j.ok) return { ...none, error: j.error, located: true };
      const r = rowsFromJson(j.value);
      return 'error' in r ? fail(r.error) : { ...none, rows: r.rows };
    }
    const t = parseMarkdownTable(text);
    return t ? { ...none, rows: t.rows, detected: t.aligns, escaped: true } : fail('No Markdown table found. A table needs a header row and a delimiter row like |---|---|.');
  }, [mode, text, grid]);

  const cols = Math.max(0, ...parsed.rows.map((r) => r.length));
  const effective = Array.from({ length: cols }, (_, i): Align => aligns[i] ?? parsed.detected[i] ?? 'none');
  const output = parsed.rows.length && cols ? formatTable(parsed.rows, effective, { padded, escaped: parsed.escaped }) : '';
  const setAlign = (i: number, a: Align) => setAligns((p) => Object.assign([...p], { [i]: a }));

  const setCell = (r: number, c: number, v: string) => setGrid((g) => g.map((row, i) => (i === r ? Array.from({ length: gridCols }, (_, j) => (j === c ? v : (row[j] ?? ''))) : row)));
  const gridCols = Math.max(1, ...grid.map((r) => r.length));
  const resize = (n: number) => setGrid((g) => g.map((r) => Array.from({ length: n }, (_, i) => r[i] ?? '')));
  const toGrid = () => {
    if (!parsed.rows.length) return;
    setGrid(parsed.rows.map((r) => Array.from({ length: cols }, (_, i) => r[i] ?? '')));
    setMode('grid');
  };

  useIncomingText(markdownTable.id, (t) => {
    setInput(t);
    setMode(t.trimStart().startsWith('[') ? 'json' : 'csv');
  });
  useShareState(
    { mode, input, grid, aligns: aligns.map((a) => a ?? ''), padded },
    (s) => {
      if (s.mode) setMode(s.mode);
      if (s.input !== undefined) setInput(s.input);
      if (Array.isArray(s.grid) && s.grid.every((r) => Array.isArray(r) && r.every((c) => typeof c === 'string'))) setGrid(s.grid);
      if (Array.isArray(s.aligns)) setAligns(s.aligns.map((a) => (ALIGNS.some((x) => x.value === a) ? (a as Align) : null)));
      if (s.padded !== undefined) setPadded(s.padded);
    },
    { mode: MODES.map((m) => m.value) },
  );

  const status = parsed.error
    ? parsed.error.message
    : output
      ? `Table · ${pluralize(parsed.rows.length - 1, 'row')} · ${pluralize(cols, 'column')}`
      : mode === 'grid'
        ? 'Edit the grid to build a table.'
        : 'Paste data to build a table.';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={markdownTable} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="table">Make a Markdown </Headline>
        <div className="flex flex-wrap gap-3">
          {mode !== 'grid' && (
            <>
              <Button variant="secondary" onClick={() => setInput(SAMPLES[mode])}>
                Try an example
              </Button>
              <OpenFileButton accept=".csv,.tsv,.json,.md,.txt" onText={(t) => setInput(t)} />
            </>
          )}
          <Button variant="ghost" onClick={() => (mode === 'grid' ? setGrid([['', ''], ['', '']]) : setInput(''))}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>
      <StatusStrip status={status} tone={output ? 'good' : 'neutral'} />

      <OptionsCard label="Table options">
        <Segmented<Mode> label="Input" options={MODES} value={mode} onChange={setMode} />
        <Checkbox label="Pad columns to equal width" checked={padded} onChange={setPadded} />
        {mode !== 'grid' && (
          <Button variant="ghost" disabled={!parsed.rows.length} onClick={toGrid}>
            Edit in grid
          </Button>
        )}
      </OptionsCard>

      {cols > 0 && (
        <section aria-label="Column alignment" className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          {effective.map((a, i) => (
            <Select<Align> key={i} label={`Column ${i + 1}: ${parsed.rows[0]?.[i]?.trim().slice(0, 16) || 'empty'}`} options={ALIGNS} value={a} onChange={(v) => setAlign(i, v)} />
          ))}
        </section>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {mode === 'grid' ? (
          <section aria-label="Grid editor" className="min-w-0 space-y-3">
            <div className="max-h-[32rem] overflow-auto rounded-2xl border border-field-edge bg-white dark:bg-slate-900">
              <table className="border-collapse">
                <tbody>
                  {grid.map((row, r) => (
                    <tr key={r}>
                      {Array.from({ length: gridCols }, (_, c) => (
                        <td key={c} className="border border-slate-200 p-0 dark:border-slate-700">
                          <input
                            aria-label={`${r === 0 ? 'Header' : `Row ${r}`}, column ${c + 1}`}
                            value={row[c] ?? ''}
                            onChange={(e) => setCell(r, c, e.target.value)}
                            className={`block w-32 bg-transparent px-2 py-1.5 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500/60 dark:text-slate-100 ${r === 0 ? 'font-bold' : ''}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setGrid((g) => [...g, Array(gridCols).fill('')])}>Add row</Button>
              <Button variant="secondary" onClick={() => resize(gridCols + 1)}>Add column</Button>
              <Button variant="ghost" disabled={grid.length < 2} onClick={() => setGrid((g) => g.slice(0, -1))}>Remove last row</Button>
              <Button variant="ghost" disabled={gridCols < 2} onClick={() => resize(gridCols - 1)}>Remove last column</Button>
            </div>
          </section>
        ) : (
          <CodeArea
            id="mt-input"
            label={mode === 'csv' ? 'Input CSV or TSV' : mode === 'json' ? 'Input JSON' : 'Existing Markdown table'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={16}
            placeholder={mode === 'json' ? '[{"a":1}]' : mode === 'csv' ? 'Name,Qty\nApple,3' : '| a | b |\n|---|---|'}
            aria-invalid={parsed.error ? true : undefined}
            onFileText={(t) => setInput(t)}
          />
        )}
        <div className="min-w-0 space-y-6">
          {parsed.error && <ErrorPanel error={parsed.error} text={text} inputId={parsed.located ? 'mt-input' : undefined} fieldId="mt-input" title="Could not build a table" />}
          <Notices items={parsed.notices} />
          {output && <OutputPanel title="Markdown table" icon="layers" text={output} fileName="table.md" mime="text/markdown" kind="markdown" />}
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">Everything runs in your browser. Pipes in cells are escaped and line breaks become &lt;br&gt;.</p>
    </div>
  );
}
