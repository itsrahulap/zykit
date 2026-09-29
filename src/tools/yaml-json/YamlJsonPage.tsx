import { useDeferredValue, useEffect, useState } from 'react';
import yamlJson from './index';
import { jsonToYaml, yamlToJson, type ConvertResult, type JsonIndent, type QuoteStyle } from './features/convert';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Select } from '../../shared/ui/Select';
import { Button, Icon } from '../../shared/ui/ui';
import { Checkbox, ErrorPanel, Notices, OpenFileButton, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { pluralize } from '../../shared/utils/format.utils';

type Direction = 'y2j' | 'j2y';
type IndentChoice = '2' | '4' | 'tab' | 'min';

const MAX_INPUT_CHARS = 20_000_000;
const INPUT_ID = 'yaml-json-input';

const SAMPLE_YAML = `# Service config
defaults: &defaults
  retries: 3
  timeout: 30s
services:
  - name: api
    <<: *defaults
    port: 8080
    tags: [web, public]
  - name: worker
    <<: *defaults
    retries: 5
    enabled: true
description: |
  Multi-line text
  stays intact.
---
second: document
`;

const SAMPLE_JSON = `{"name":"Zykit","version":"1.0.0","private":true,"answer":"yes","tools":[{"id":"yaml-json","tags":["YAML","JSON"]}],"nothing":null}`;

export default function YamlJsonPage() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<Direction>('y2j');
  const [indentChoice, setIndentChoice] = useState<IndentChoice>('2');
  const [allDocuments, setAllDocuments] = useState(true);
  const [yamlIndent, setYamlIndent] = useState<2 | 4>(2);
  const [lineWidth, setLineWidth] = useState(80);
  const [quote, setQuote] = useState<QuoteStyle>('plain');
  const [result, setResult] = useState<{ key: string; r: ConvertResult } | null>(null);

  const text = useDeferredValue(input);
  const tooLarge = text.length > MAX_INPUT_CHARS;
  const indent: JsonIndent = indentChoice === 'tab' || indentChoice === 'min' ? indentChoice : indentChoice === '4' ? 4 : 2;
  const key = JSON.stringify([text, direction, indent, allDocuments, yamlIndent, lineWidth, quote]);
  const active = text.trim() !== '' && !tooLarge;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const run = direction === 'y2j' ? yamlToJson(text, { indent, allDocuments }) : jsonToYaml(text, { indent: yamlIndent, lineWidth, quote });
    run.then(
      (r) => !cancelled && setResult({ key, r }),
      (err: unknown) =>
        !cancelled &&
        setResult({ key, r: { ok: false, error: { message: err instanceof Error ? err.message : 'Conversion failed', line: 1, column: 1, offset: 0 } } }),
    );
    return () => {
      cancelled = true;
    };
  }, [active, key, text, direction, indent, allDocuments, yamlIndent, lineWidth, quote]);

  const current = active && result ? result.r : null;
  const busy = active && result?.key !== key;
  const from = direction === 'y2j' ? 'YAML' : 'JSON';
  const to = direction === 'y2j' ? 'JSON' : 'YAML';

  const status = tooLarge
    ? 'This input is too large to process here (limit: about 20 MB).'
    : !active
      ? `Paste ${from} to convert it to ${to}.`
      : !current
        ? 'Converting…'
        : current.ok
          ? direction === 'y2j'
            ? `Converted ${pluralize(current.documents, 'document')} to JSON${current.aliases ? ` · ${pluralize(current.aliases, 'alias', 'aliases')} resolved` : ''}`
            : 'Converted JSON to YAML'
          : `Invalid ${from}: ${current.error.message} (line ${current.error.line}, column ${current.error.column})`;

  const openText = (t: string, file: File) => {
    if (/\.ya?ml$/i.test(file.name)) setDirection('y2j');
    else if (/\.json$/i.test(file.name)) setDirection('j2y');
    setInput(t);
  };

  useIncomingText(yamlJson.id, (t, h) => {
    if (h.kind === 'json') setDirection('j2y');
    else if (h.kind === 'yaml') setDirection('y2j');
    setInput(t);
  });
  useShareState(
    { input, direction, indent: indentChoice, allDocuments, yamlIndent, lineWidth, quote },
    (s) => {
      if (s.input !== undefined) setInput(s.input);
      if (s.direction) setDirection(s.direction);
      if (s.indent) setIndentChoice(s.indent);
      if (s.allDocuments !== undefined) setAllDocuments(s.allDocuments);
      if (s.yamlIndent !== undefined) setYamlIndent(s.yamlIndent);
      if (s.lineWidth !== undefined) setLineWidth(s.lineWidth);
      if (s.quote) setQuote(s.quote);
    },
    { direction: ['y2j', 'j2y'], indent: ['2', '4', 'tab', 'min'], yamlIndent: [2, 4], lineWidth: [80, 120, 0], quote: ['plain', 'single', 'double'] },
  );

  const swap = () => {
    if (current?.ok) setInput(current.output);
    setDirection((d) => (d === 'y2j' ? 'j2y' : 'y2j'));
  };

  return (
    <div className="space-y-8">
      <Breadcrumb tool={yamlJson} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="both ways">YAML and JSON, </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(direction === 'y2j' ? SAMPLE_YAML : SAMPLE_JSON)}>
            Try an example
          </Button>
          <OpenFileButton accept=".yaml,.yml,.json,application/json,application/yaml" onText={openText} />
          <Button variant="secondary" onClick={swap}>
            <Icon name="swap" className="h-4 w-4" /> Swap
          </Button>
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={busy ? 'busy' : current?.ok ? 'good' : 'neutral'} />

      <OptionsCard label="Conversion options">
        <Segmented<Direction>
          label="Direction"
          options={[
            { value: 'y2j', label: 'YAML → JSON' },
            { value: 'j2y', label: 'JSON → YAML' },
          ]}
          value={direction}
          onChange={setDirection}
        />
        {direction === 'y2j' ? (
          <>
            <Segmented<IndentChoice>
              label="JSON indent"
              options={[
                { value: '2', label: '2 spaces' },
                { value: '4', label: '4 spaces' },
                { value: 'tab', label: 'Tab' },
                { value: 'min', label: 'Minified' },
              ]}
              value={indentChoice}
              onChange={setIndentChoice}
            />
            <Checkbox label="All documents as an array" checked={allDocuments} onChange={setAllDocuments} />
          </>
        ) : (
          <>
            <Select<number>
              label="Indent"
              options={[
                { value: 2, label: '2 spaces' },
                { value: 4, label: '4 spaces' },
              ]}
              value={yamlIndent}
              onChange={(v) => setYamlIndent(v === 4 ? 4 : 2)}
            />
            <Select<number>
              label="Line width"
              options={[
                { value: 80, label: '80' },
                { value: 120, label: '120' },
                { value: 0, label: 'No wrapping' },
              ]}
              value={lineWidth}
              onChange={setLineWidth}
            />
            <Select<QuoteStyle>
              label="Strings"
              options={[
                { value: 'plain', label: 'Plain when safe' },
                { value: 'single', label: "'Single quoted'" },
                { value: 'double', label: '"Double quoted"' },
              ]}
              value={quote}
              onChange={setQuote}
            />
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
          placeholder={direction === 'y2j' ? 'key: value\nlist:\n  - one\n  - two' : '{"paste": "your JSON here"}'}
          aria-invalid={current ? !current.ok : undefined}
          onFileText={openText}
        />

        <div className="min-w-0 space-y-6">
          {current && !current.ok && <ErrorPanel error={current.error} text={text} inputId={INPUT_ID} />}
          {current?.ok && (
            <>
              <Notices items={current.warnings} />
              <OutputPanel
                title={to}
                icon={direction === 'y2j' ? 'braces' : 'code'}
                text={current.output}
                fileName={direction === 'y2j' ? 'converted.json' : 'converted.yaml'}
                mime={direction === 'y2j' ? 'application/json' : 'application/yaml'}
                busy={busy}
              />
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Conversion runs in your browser; nothing is uploaded. Anchors, aliases and merge keys (&lt;&lt;) are resolved, and alias expansion is capped
        to stop &ldquo;billion laughs&rdquo; documents. YAML comments can&rsquo;t be carried into JSON. YAML output quotes strings like
        &ldquo;yes&rdquo; and &ldquo;on&rdquo; so older YAML readers don&rsquo;t turn them into booleans.
      </p>
    </div>
  );
}
