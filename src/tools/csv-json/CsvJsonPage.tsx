import { useDeferredValue, useMemo, useState } from 'react';
import csvJson from './index';
import { jsonToRows, JsonShapeError, rowsToJson } from './features/convert';
import { DELIMITER_LABELS, parseCsv, writeCsv, type CsvDelimiter, type CsvIssue } from '../../shared/lib/csv';
import { parseJsonText, type TextError } from '../../shared/lib/textpos';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Select } from '../../shared/ui/Select';
import { Button, Icon } from '../../shared/ui/ui';
import { Checkbox, ErrorPanel, Notices, OpenFileButton, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { pluralize } from '../../shared/utils/format.utils';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';

type Direction = 'c2j' | 'j2c';
type Shape = 'objects' | 'arrays';
type Indent = '2' | '4' | 'min';

const MAX_INPUT_CHARS = 25_000_000;
const INPUT_ID = 'csv-json-input';

const SAMPLE_CSV = `id,name,email,active,score,notes
1,Ann Lee,ann@example.com,true,92.5,"Likes ""quotes"", commas"
2,Bob Smith,bob@example.com,false,,
3,Cara Diaz,cara@example.com,true,78,"Line one
line two"`;

const SAMPLE_JSON = `[{"id":1,"name":"Ann","address":{"city":"Lisbon","zip":"1000"},"tags":["a","b"]},{"id":2,"name":"Bob, Jr.","address":{"city":"Porto"},"active":false}]`;

const DELIM_KEYS = Object.keys(DELIMITER_LABELS) as CsvDelimiter[];
const DELIMS: { value: CsvDelimiter; label: string }[] = DELIM_KEYS.map((d) => ({
  value: d,
  label: DELIMITER_LABELS[d],
}));

type Outcome =
  | { ok: true; output: string; summary: string; notices: string[] }
  | { ok: false; error: TextError; located: boolean };

function issueNotices(issues: CsvIssue[]): string[] {
  const shown = issues.slice(0, 3).map((i) => `Line ${i.line}: ${i.message}`);
  if (issues.length > 3) shown.push(`…and ${issues.length - 3} more problems.`);
  return shown;
}

export default function CsvJsonPage() {
  const [input, setInput] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction>('c2j');
  const [delimiter, setDelimiter] = useState<CsvDelimiter | 'auto'>('auto');
  const [outDelimiter, setOutDelimiter] = useState<CsvDelimiter>(',');
  const [header, setHeader] = useState(true);
  const [trim, setTrim] = useState(false);
  const [skipEmpty, setSkipEmpty] = useState(true);
  const [shape, setShape] = useState<Shape>('objects');
  const [inferTypes, setInferTypes] = useState(true);
  const [emptyAsNull, setEmptyAsNull] = useState(false);
  const [indent, setIndent] = useState<Indent>('2');
  const [flatten, setFlatten] = useState(true);
  const [quoteAll, setQuoteAll] = useState(false);
  const [crlf, setCrlf] = useState(false);

  const text = useDeferredValue(input);
  const stale = text !== input;
  const tooLarge = text.length > MAX_INPUT_CHARS;

  const result = useMemo<Outcome | null>(() => {
    if (!text.trim() || tooLarge) return null;
    if (direction === 'c2j') {
      const parsed = parseCsv(text, { delimiter, trim, skipEmptyLines: skipEmpty });
      const { value, columns, raggedRows } = rowsToJson(parsed.rows, { header, shape, inferTypes, emptyAsNull });
      const notices = issueNotices(parsed.issues);
      if (raggedRows) notices.push(`${pluralize(raggedRows, 'row has', 'rows have')} a different number of fields than the header.`);
      const space = indent === 'min' ? undefined : Number(indent);
      const count = shape === 'arrays' && header ? value.length - 1 : value.length;
      return {
        ok: true,
        output: JSON.stringify(value, null, space),
        summary: `${pluralize(Math.max(0, count), 'row')} · ${pluralize(columns.length, 'column')} · ${DELIMITER_LABELS[parsed.delimiter].toLowerCase()}-separated`,
        notices,
      };
    }
    const parsed = parseJsonText(text);
    if (!parsed.ok) return { ok: false, error: parsed.error, located: true };
    try {
      const rows = jsonToRows(parsed.value, { flatten, header });
      const output = writeCsv(rows, { delimiter: outDelimiter, quoteAll, newline: crlf ? '\r\n' : '\n' });
      const dataRows = header && rows.length ? rows.length - 1 : rows.length;
      return { ok: true, output, summary: `${pluralize(dataRows, 'row')} · ${pluralize(rows[0]?.length ?? 0, 'column')}`, notices: [] };
    } catch (err) {
      if (err instanceof JsonShapeError) return { ok: false, error: { message: err.message, line: 1, column: 1, offset: 0 }, located: false };
      throw err;
    }
  }, [text, tooLarge, direction, delimiter, trim, skipEmpty, header, shape, inferTypes, emptyAsNull, indent, flatten, outDelimiter, quoteAll, crlf]);

  const from = direction === 'c2j' ? 'CSV' : 'JSON';
  const to = direction === 'c2j' ? 'JSON' : 'CSV';
  const status = tooLarge
    ? 'This input is too large to process here (limit: about 25 MB).'
    : !result
      ? `Paste or open ${from} to convert it to ${to}.`
      : result.ok
        ? `${to} ready · ${result.summary}`
        : result.located
          ? `Invalid JSON: ${result.error.message} (line ${result.error.line}, column ${result.error.column})`
          : result.error.message;

  const openText = (t: string, file: File) => {
    setFileName(file.name);
    setDirection(/\.json$/i.test(file.name) || /^\s*[[{]/.test(t.slice(0, 100)) ? 'j2c' : 'c2j');
    setInput(t);
  };

  useIncomingText(csvJson.id, (t, h) => {
    setFileName(null);
    if (h.kind === 'json') setDirection('j2c');
    else if (h.kind === 'csv') setDirection('c2j');
    setInput(t);
  });
  useShareState(
    { input, direction, delimiter, outDelimiter, header, trim, skipEmpty, shape, inferTypes, emptyAsNull, indent, flatten, quoteAll, crlf },
    (s) => {
      if (s.input !== undefined) {
        setInput(s.input);
        setFileName(null);
      }
      if (s.direction) setDirection(s.direction);
      if (s.delimiter) setDelimiter(s.delimiter);
      if (s.outDelimiter) setOutDelimiter(s.outDelimiter);
      if (s.header !== undefined) setHeader(s.header);
      if (s.trim !== undefined) setTrim(s.trim);
      if (s.skipEmpty !== undefined) setSkipEmpty(s.skipEmpty);
      if (s.shape) setShape(s.shape);
      if (s.inferTypes !== undefined) setInferTypes(s.inferTypes);
      if (s.emptyAsNull !== undefined) setEmptyAsNull(s.emptyAsNull);
      if (s.indent) setIndent(s.indent);
      if (s.flatten !== undefined) setFlatten(s.flatten);
      if (s.quoteAll !== undefined) setQuoteAll(s.quoteAll);
      if (s.crlf !== undefined) setCrlf(s.crlf);
    },
    {
      direction: ['c2j', 'j2c'],
      delimiter: ['auto', ...DELIM_KEYS],
      outDelimiter: DELIM_KEYS,
      shape: ['objects', 'arrays'],
      indent: ['2', '4', 'min'],
    },
  );

  const swap = () => {
    if (result?.ok) setInput(result.output);
    setDirection((d) => (d === 'c2j' ? 'j2c' : 'c2j'));
  };

  const baseName = (fileName ?? 'converted').replace(/\.[^.]+$/, '');
  const outExt = direction === 'c2j' ? 'json' : outDelimiter === '\t' ? 'tsv' : 'csv';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={csvJson} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="JSON">Turn spreadsheets into </Headline>
        <div className="flex flex-wrap gap-3">
          <OpenFileButton accept=".csv,.tsv,.txt,.json,text/csv,application/json" onText={openText} />
          <Button
            variant="secondary"
            onClick={() => {
              setFileName(null);
              setInput(direction === 'c2j' ? SAMPLE_CSV : SAMPLE_JSON);
            }}
          >
            Try an example
          </Button>
          <Button variant="secondary" onClick={swap}>
            <Icon name="swap" className="h-4 w-4" /> Swap
          </Button>
          <Button
            variant="ghost"
            disabled={!input}
            onClick={() => {
              setInput('');
              setFileName(null);
            }}
          >
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={stale ? 'busy' : result?.ok ? 'good' : 'neutral'} />

      <OptionsCard label="Conversion options">
        <Segmented<Direction>
          label="Direction"
          options={[
            { value: 'c2j', label: 'CSV → JSON' },
            { value: 'j2c', label: 'JSON → CSV' },
          ]}
          value={direction}
          onChange={setDirection}
        />
        {direction === 'c2j' ? (
          <>
            <Select<CsvDelimiter | 'auto'>
              label="Delimiter"
              options={[{ value: 'auto', label: 'Detect' }, ...DELIMS]}
              value={delimiter}
              onChange={setDelimiter}
            />
            <Segmented<Shape>
              label="Output"
              options={[
                { value: 'objects', label: 'Objects' },
                { value: 'arrays', label: 'Arrays' },
              ]}
              value={shape}
              onChange={setShape}
            />
            <Segmented<Indent>
              label="JSON indent"
              options={[
                { value: '2', label: '2 spaces' },
                { value: '4', label: '4 spaces' },
                { value: 'min', label: 'Minified' },
              ]}
              value={indent}
              onChange={setIndent}
            />
            <Checkbox label="First row is a header" checked={header} onChange={setHeader} />
            <Checkbox label="Detect numbers and booleans" checked={inferTypes} onChange={setInferTypes} />
            <Checkbox label="Empty cells as null" checked={emptyAsNull} onChange={setEmptyAsNull} />
            <Checkbox label="Trim values" checked={trim} onChange={setTrim} />
            <Checkbox label="Skip empty lines" checked={skipEmpty} onChange={setSkipEmpty} />
          </>
        ) : (
          <>
            <Select<CsvDelimiter> label="Delimiter" options={DELIMS} value={outDelimiter} onChange={setOutDelimiter} />
            <Checkbox label="Header row" checked={header} onChange={setHeader} />
            <Checkbox label="Flatten nested objects (a.b)" checked={flatten} onChange={setFlatten} />
            <Checkbox label="Quote every field" checked={quoteAll} onChange={setQuoteAll} />
            <Checkbox label="Windows line endings (CRLF)" checked={crlf} onChange={setCrlf} />
          </>
        )}
      </OptionsCard>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          id={INPUT_ID}
          label={`Input ${from}`}
          hint={fileName ?? undefined}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={18}
          placeholder={direction === 'c2j' ? 'name,age\nAnn,30' : '[{"name": "Ann", "age": 30}]'}
          aria-invalid={result ? !result.ok : undefined}
          onFileText={openText}
        />
        <div className="min-w-0 space-y-6">
          {result && !result.ok && (
            <ErrorPanel
              error={result.error}
              text={text}
              inputId={result.located ? INPUT_ID : undefined}
              title={result.located ? 'Syntax error' : 'Cannot convert'}
            />
          )}
          {result?.ok && (
            <>
              <Notices items={result.notices} />
              <OutputPanel
                title={to}
                icon={direction === 'c2j' ? 'braces' : 'grid'}
                text={result.output}
                fileName={`${baseName}.${outExt}`}
                mime={direction === 'c2j' ? 'application/json' : outExt === 'tsv' ? 'text/tab-separated-values' : 'text/csv'}
              />
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Files are read and converted in your browser; nothing is uploaded. Quoted fields, escaped quotes and line breaks inside quotes follow RFC 4180.
        Long numbers such as IDs stay strings so they aren&rsquo;t rounded, and repeated column names get a suffix (<code>name_2</code>).
      </p>
    </div>
  );
}
