import { useDeferredValue, useId, useMemo, useState } from 'react';
import xmlFormatter from './index';
import { formatXml, MAX_XPATH_ITEMS, parseNamespaces, runXPath, type XmlIndent } from './features/xml-formatter';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { Checkbox, ErrorPanel, Notices, OpenFileButton, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { Panel } from '../../shared/ui/Panel';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { utf8Length } from '../json-formatter/features/json';
import { formatBytes } from '../../shared/utils/format.utils';

type Mode = 'format' | 'minify' | 'validate';
type Indent = '2' | '4' | 'tab';

const MAX_INPUT_CHARS = 20_000_000;
const MAX_XPATH_CHARS = 5_000_000;
const INPUT_ID = 'xml-formatter-input';

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?><catalog xmlns:dc="http://purl.org/dc/elements/1.1/"><!-- Two books --><book id="1"><dc:title>XML &amp; You</dc:title><price currency="EUR">12.50</price></book><book id="2"><dc:title>Learning XPath</dc:title><price currency="EUR">8</price></book></catalog>`;

const fieldClass =
  'block w-full rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-900 dark:text-slate-100';

export default function XmlFormatterPage() {
  const uid = useId();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('format');
  const [indent, setIndent] = useState<Indent>('2');
  const [comments, setComments] = useState(true);
  const [xpath, setXpath] = useState('');
  const [nsText, setNsText] = useState('');

  const text = useDeferredValue(input);
  const stale = text !== input;
  const tooLarge = text.length > MAX_INPUT_CHARS;
  const xp = useDeferredValue(xpath);

  const result = useMemo(() => {
    if (!text.trim() || tooLarge) return null;
    const ind: XmlIndent = indent === 'tab' ? 'tab' : indent === '4' ? 4 : 2;
    return formatXml(text, { mode: mode === 'minify' ? 'minify' : 'format', indent: ind, comments });
  }, [text, tooLarge, mode, indent, comments]);

  const xpathResult = useMemo(() => {
    if (!xp.trim() || !text.trim() || tooLarge) return null;
    if (text.length > MAX_XPATH_CHARS) return { ok: false as const, message: 'The XPath tester handles XML up to about 5 MB.' };
    const ns = parseNamespaces(nsText);
    if (ns.error) return { ok: false as const, message: ns.error };
    return runXPath(text, xp, ns.map);
  }, [text, tooLarge, xp, nsText]);

  const openText = (t: string) => setInput(t);
  useIncomingText(xmlFormatter.id, (t) => setInput(t));
  useShareState(
    { input, mode, indent, comments, xpath, nsText },
    (s) => {
      if (s.input !== undefined) setInput(s.input);
      if (s.mode) setMode(s.mode);
      if (s.indent) setIndent(s.indent);
      if (s.comments !== undefined) setComments(s.comments);
      if (s.xpath !== undefined) setXpath(s.xpath);
      if (s.nsText !== undefined) setNsText(s.nsText);
    },
    { mode: ['format', 'minify', 'validate'], indent: ['2', '4', 'tab'] },
  );

  const status = tooLarge
    ? 'This input is too large to process here (limit: about 20 MB).'
    : !result
      ? 'Paste XML to format, minify or validate it.'
      : result.ok
        ? mode === 'validate'
          ? `Valid XML: ${result.elements.toLocaleString()} element${result.elements === 1 ? '' : 's'}.`
          : `${mode === 'format' ? 'Formatted' : 'Minified'}: ${formatBytes(utf8Length(text))} to ${formatBytes(utf8Length(result.output))}.`
        : `Invalid XML: ${result.error.message} (line ${result.error.line}, column ${result.error.column})`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={xmlFormatter} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="validate, query">Format, </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Try an example
          </Button>
          <OpenFileButton accept=".xml,.svg,.xhtml,.rss,.atom,.plist,.xsd,.xsl,.kml,.gpx,application/xml,text/xml" onText={openText} />
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={stale ? 'busy' : result?.ok ? 'good' : 'neutral'} />

      <OptionsCard label="Formatting options">
        <Segmented<Mode>
          label="Action"
          options={[
            { value: 'format', label: 'Format' },
            { value: 'minify', label: 'Minify' },
            { value: 'validate', label: 'Validate' },
          ]}
          value={mode}
          onChange={setMode}
        />
        {mode === 'format' && (
          <Segmented<Indent>
            label="Indent"
            options={[
              { value: '2', label: '2 spaces' },
              { value: '4', label: '4 spaces' },
              { value: 'tab', label: 'Tab' },
            ]}
            value={indent}
            onChange={setIndent}
          />
        )}
        {mode !== 'validate' && <Checkbox label="Keep comments" checked={comments} onChange={setComments} />}
      </OptionsCard>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          id={INPUT_ID}
          label="Input XML"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={18}
          placeholder="<root><item id=&quot;1&quot;>Hello</item></root>"
          aria-invalid={result ? !result.ok : undefined}
          onFileText={openText}
        />
        <div className="min-w-0 space-y-6">
          {result && !result.ok && <ErrorPanel error={result.error} text={text} inputId={INPUT_ID} title="XML error" />}
          {result?.ok && (
            <>
              <Notices items={result.notices.map((n) => n + ' It is left out of the output.')} />
              {mode !== 'validate' && (
                <OutputPanel title="XML" icon="code" text={result.output} fileName={mode === 'minify' ? 'minified.xml' : 'formatted.xml'} mime="application/xml" kind="xml" />
              )}
            </>
          )}
        </div>
      </div>

      <section aria-labelledby={`${uid}-xp`} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 id={`${uid}-xp`} className="eyebrow text-slate-600 dark:text-slate-400">
          XPath tester
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-expr`} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
              XPath expression
            </label>
            <input
              id={`${uid}-expr`}
              type="text"
              value={xpath}
              onChange={(e) => setXpath(e.target.value)}
              placeholder="//book[price > 10]/@id"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-ns`} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
              Namespace prefixes (prefix=uri, one per line)
            </label>
            <textarea
              id={`${uid}-ns`}
              rows={2}
              value={nsText}
              onChange={(e) => setNsText(e.target.value)}
              placeholder="dc=http://purl.org/dc/elements/1.1/"
              spellCheck={false}
              autoCapitalize="off"
              className={fieldClass}
            />
          </div>
        </div>
        <div role="status" aria-live="polite" className="text-sm text-slate-700 dark:text-slate-300">
          {!xp.trim()
            ? 'Enter an expression to query the XML above. Prefixes declared in the document work without a mapping; map a default namespace to a prefix of your choice.'
            : !xpathResult
              ? ''
              : !xpathResult.ok
                ? <span className="break-words text-red-700 dark:text-red-300">{xpathResult.message}</span>
                : xpathResult.kind === 'value'
                  ? <>Result ({xpathResult.type}): <code className="break-all">{xpathResult.value}</code></>
                  : `${xpathResult.total.toLocaleString()} match${xpathResult.total === 1 ? '' : 'es'}${xpathResult.total > MAX_XPATH_ITEMS ? `, showing the first ${MAX_XPATH_ITEMS.toLocaleString()}` : ''}`}
        </div>
        {xpathResult?.ok && xpathResult.kind === 'nodes' && xpathResult.items.length > 0 && (
          <Panel eyebrow="Matches">
            <ol aria-label="XPath matches" className="max-h-96 space-y-3 overflow-y-auto">
              {xpathResult.items.map((it, i) => (
                <li key={i} className="min-w-0 rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-950">
                  <p className="break-all font-mono text-xs text-emerald-800 dark:text-emerald-300">
                    {it.path} <span className="text-slate-500 dark:text-slate-400">({it.kind})</span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words font-mono text-slate-800 dark:text-slate-200">{it.text || '(empty)'}</p>
                </li>
              ))}
            </ol>
          </Panel>
        )}
      </section>
    </div>
  );
}
