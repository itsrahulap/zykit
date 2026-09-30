import { useDeferredValue, useMemo, useState } from 'react';
import xmlJson from './index';
import { jsonToXml, JsonToXmlError, parseXml, xmlToJson, type JsonToXmlOptions } from './features/xml';
import { parseJsonText, type TextError } from '../../shared/lib/textpos';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { Checkbox, ErrorPanel, Notices, OpenFileButton, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';

type Direction = 'x2j' | 'j2x';
type JsonIndent = '2' | '4' | 'min';
type XmlIndent = '2' | '4' | 'tab' | 'none';

const MAX_INPUT_CHARS = 20_000_000;
const INPUT_ID = 'xml-json-input';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog xmlns:dc="http://purl.org/dc/elements/1.1/">
  <!-- Two books -->
  <book id="1" available="true">
    <dc:title>XML &amp; You</dc:title>
    <price currency="EUR">12.50</price>
  </book>
  <book id="2" available="false">
    <dc:title><![CDATA[<Tags> & Things]]></dc:title>
    <price currency="EUR">8</price>
  </book>
</catalog>`;

const SAMPLE_JSON = `{"catalog":{"@xmlns:dc":"http://purl.org/dc/elements/1.1/","book":[{"@id":1,"dc:title":"XML & You","price":{"@currency":"EUR","#text":12.5}},{"@id":2,"dc:title":"<Tags>","empty":null}]}}`;

type Outcome = { ok: true; output: string; notices: string[]; title: string } | { ok: false; error: TextError; title: string };

export default function XmlJsonPage() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<Direction>('x2j');
  const [alwaysArrays, setAlwaysArrays] = useState(false);
  const [trim, setTrim] = useState(true);
  const [coerce, setCoerce] = useState(false);
  const [comments, setComments] = useState(false);
  const [jsonIndent, setJsonIndent] = useState<JsonIndent>('2');
  const [xmlIndent, setXmlIndent] = useState<XmlIndent>('2');
  const [declaration, setDeclaration] = useState(true);

  const text = useDeferredValue(input);
  const stale = text !== input;
  const tooLarge = text.length > MAX_INPUT_CHARS;

  const result = useMemo<Outcome | null>(() => {
    if (!text.trim() || tooLarge) return null;
    if (direction === 'x2j') {
      const parsed = parseXml(text);
      if (!parsed.ok) return { ok: false, error: parsed.error, title: 'XML error' };
      const value = xmlToJson(parsed.doc, { alwaysArrays, trim, coerce, comments });
      const space = jsonIndent === 'min' ? undefined : Number(jsonIndent);
      return { ok: true, output: JSON.stringify(value, null, space), notices: parsed.doc.notices, title: 'JSON' };
    }
    const parsed = parseJsonText(text);
    if (!parsed.ok) return { ok: false, error: parsed.error, title: 'JSON error' };
    try {
      const indent: JsonToXmlOptions['indent'] = xmlIndent === 'tab' || xmlIndent === 'none' ? xmlIndent : xmlIndent === '4' ? 4 : 2;
      const { xml, notices } = jsonToXml(parsed.value, { indent, declaration });
      return { ok: true, output: xml, notices, title: 'XML' };
    } catch (err) {
      if (err instanceof JsonToXmlError) return { ok: false, error: { message: err.message, line: 1, column: 1, offset: 0 }, title: 'Cannot convert' };
      throw err;
    }
  }, [text, tooLarge, direction, alwaysArrays, trim, coerce, comments, jsonIndent, xmlIndent, declaration]);

  const from = direction === 'x2j' ? 'XML' : 'JSON';
  const to = direction === 'x2j' ? 'JSON' : 'XML';
  const status = tooLarge
    ? 'This input is too large to process here (limit: about 20 MB).'
    : !result
      ? `Paste ${from} to convert it to ${to}.`
      : result.ok
        ? `Converted ${from} to ${to}`
        : result.title === 'Cannot convert'
          ? result.error.message
          : `Invalid ${from}: ${result.error.message} (line ${result.error.line}, column ${result.error.column})`;

  const openText = (t: string, file: File) => {
    if (/\.json$/i.test(file.name)) setDirection('j2x');
    else if (/\.(xml|svg|xhtml|rss|atom|plist|xsd|xsl|kml|gpx)$/i.test(file.name)) setDirection('x2j');
    setInput(t);
  };

  useIncomingText(xmlJson.id, (t, h) => {
    if (h.kind === 'json') setDirection('j2x');
    else if (h.kind === 'xml') setDirection('x2j');
    setInput(t);
  });
  useShareState(
    { input, direction, alwaysArrays, trim, coerce, comments, jsonIndent, xmlIndent, declaration },
    (s) => {
      if (s.input !== undefined) setInput(s.input);
      if (s.direction) setDirection(s.direction);
      if (s.alwaysArrays !== undefined) setAlwaysArrays(s.alwaysArrays);
      if (s.trim !== undefined) setTrim(s.trim);
      if (s.coerce !== undefined) setCoerce(s.coerce);
      if (s.comments !== undefined) setComments(s.comments);
      if (s.jsonIndent) setJsonIndent(s.jsonIndent);
      if (s.xmlIndent) setXmlIndent(s.xmlIndent);
      if (s.declaration !== undefined) setDeclaration(s.declaration);
    },
    { direction: ['x2j', 'j2x'], jsonIndent: ['2', '4', 'min'], xmlIndent: ['2', '4', 'tab', 'none'] },
  );

  const swap = () => {
    if (result?.ok) setInput(result.output);
    setDirection((d) => (d === 'x2j' ? 'j2x' : 'x2j'));
  };

  return (
    <div className="space-y-8">
      <Breadcrumb tool={xmlJson} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="predictably">Turn XML into JSON, </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(direction === 'x2j' ? SAMPLE_XML : SAMPLE_JSON)}>
            Try an example
          </Button>
          <OpenFileButton accept=".xml,.json,application/xml,text/xml,application/json" onText={openText} />
          <Button variant="secondary" onClick={swap}>
            <Icon name="swap" className="h-4 w-4" /> Swap
          </Button>
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={stale ? 'busy' : result?.ok ? 'good' : 'neutral'} />

      <OptionsCard label="Conversion options">
        <Segmented<Direction>
          label="Direction"
          options={[
            { value: 'x2j', label: 'XML → JSON' },
            { value: 'j2x', label: 'JSON → XML' },
          ]}
          value={direction}
          onChange={setDirection}
        />
        {direction === 'x2j' ? (
          <>
            <Segmented<JsonIndent>
              label="JSON indent"
              options={[
                { value: '2', label: '2 spaces' },
                { value: '4', label: '4 spaces' },
                { value: 'min', label: 'Minified' },
              ]}
              value={jsonIndent}
              onChange={setJsonIndent}
            />
            <Checkbox label="Always use arrays" checked={alwaysArrays} onChange={setAlwaysArrays} />
            <Checkbox label="Trim text" checked={trim} onChange={setTrim} />
            <Checkbox label="Numbers and booleans" checked={coerce} onChange={setCoerce} />
            <Checkbox label="Keep comments" checked={comments} onChange={setComments} />
          </>
        ) : (
          <>
            <Segmented<XmlIndent>
              label="XML indent"
              options={[
                { value: '2', label: '2 spaces' },
                { value: '4', label: '4 spaces' },
                { value: 'tab', label: 'Tab' },
                { value: 'none', label: 'Compact' },
              ]}
              value={xmlIndent}
              onChange={setXmlIndent}
            />
            <Checkbox label="XML declaration" checked={declaration} onChange={setDeclaration} />
          </>
        )}
      </OptionsCard>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          id={INPUT_ID}
          label={`Input ${from}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={18}
          placeholder={direction === 'x2j' ? '<root><item id="1">Hello</item></root>' : '{"root": {"item": {"@id": 1, "#text": "Hello"}}}'}
          aria-invalid={result ? !result.ok : undefined}
          onFileText={openText}
        />
        <div className="min-w-0 space-y-6">
          {result && !result.ok && (
            <ErrorPanel error={result.error} text={text} inputId={result.title === 'Cannot convert' ? undefined : INPUT_ID} fieldId={INPUT_ID} title={result.title} />
          )}
          {result?.ok && (
            <>
              <Notices items={result.notices} />
              <OutputPanel
                title={to}
                icon={direction === 'x2j' ? 'braces' : 'code'}
                text={result.output}
                fileName={direction === 'x2j' ? 'converted.json' : 'converted.xml'}
                mime={direction === 'x2j' ? 'application/json' : 'application/xml'}
              />
            </>
          )}
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <h2 className="eyebrow mb-3 text-slate-600 dark:text-slate-400">Conventions</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Attributes become keys starting with <code>@</code>; text next to attributes or child elements is <code>#text</code>; comments are{' '}
            <code>#comment</code>.
          </li>
          <li>Repeated sibling elements become an array. Namespace prefixes stay part of the name (<code>dc:title</code>).</li>
          <li>
            The XML declaration is kept as <code>?xml</code>. DOCTYPEs are ignored and their entities are never expanded, so XXE and &ldquo;billion
            laughs&rdquo; files are harmless.
          </li>
        </ul>
      </section>
    </div>
  );
}
