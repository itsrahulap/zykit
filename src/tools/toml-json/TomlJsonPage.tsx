import { useDeferredValue, useMemo, useState } from 'react';
import tomlJson from './index';
import { jsonTextToToml, tomlToJson, type JsonIndent } from './features/toml';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { ErrorPanel, Notices, OpenFileButton, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';

type Direction = 't2j' | 'j2t';
type IndentChoice = '2' | '4' | 'tab' | 'min';

const MAX_INPUT_CHARS = 5_000_000;
const INPUT_ID = 'toml-json-input';

const SAMPLE_TOML = `# Service config
title = "Zykit"
port = 0x1F90
ratio = 1_000.5
launch = 1979-05-27T07:32:00Z
tags = ["web", "public"]

[server]
host = 'localhost'
limits = { cpu = 2, mem = "512Mi" }
site.name = "demo"

[[servers]]
name = "alpha"

[[servers]]
name = "beta"
`;
const SAMPLE_JSON = `{"title":"Zykit","port":8080,"tags":["web","public"],"server":{"host":"localhost","limits":{"cpu":2}},"servers":[{"name":"alpha"},{"name":"beta"}]}`;

export default function TomlJsonPage() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<Direction>('t2j');
  const [indentChoice, setIndentChoice] = useState<IndentChoice>('2');

  const text = useDeferredValue(input);
  const tooLarge = text.length > MAX_INPUT_CHARS;
  const active = text.trim() !== '' && !tooLarge;
  const indent: JsonIndent = indentChoice === 'tab' || indentChoice === 'min' ? indentChoice : indentChoice === '4' ? 4 : 2;
  const result = useMemo(() => (!active ? null : direction === 't2j' ? tomlToJson(text, indent) : jsonTextToToml(text)), [active, text, direction, indent]);

  const from = direction === 't2j' ? 'TOML' : 'JSON';
  const to = direction === 't2j' ? 'JSON' : 'TOML';
  const status = tooLarge
    ? 'This input is too large to process here (limit: about 5 MB).'
    : !result
      ? `Paste ${from} to convert it to ${to}.`
      : result.ok
        ? `Converted ${from} to ${to}`
        : `Invalid ${from}: ${result.error.message} (line ${result.error.line}, column ${result.error.column})`;

  const openText = (t: string, file: File) => {
    if (/\.toml$/i.test(file.name)) setDirection('t2j');
    else if (/\.json$/i.test(file.name)) setDirection('j2t');
    setInput(t);
  };
  useIncomingText(tomlJson.id, (t, h) => {
    if (h.kind === 'json') setDirection('j2t');
    setInput(t);
  });
  useShareState(
    { input, direction, indent: indentChoice },
    (s) => {
      if (s.input !== undefined) setInput(s.input);
      if (s.direction) setDirection(s.direction);
      if (s.indent) setIndentChoice(s.indent);
    },
    { direction: ['t2j', 'j2t'], indent: ['2', '4', 'tab', 'min'] },
  );

  const swap = () => {
    if (result?.ok) setInput(result.output);
    setDirection((d) => (d === 't2j' ? 'j2t' : 't2j'));
  };

  return (
    <div className="space-y-8">
      <Breadcrumb tool={tomlJson} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="both ways">TOML and JSON, </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(direction === 't2j' ? SAMPLE_TOML : SAMPLE_JSON)}>
            Try an example
          </Button>
          <OpenFileButton accept=".toml,.json,application/json,application/toml" onText={openText} />
          <Button variant="secondary" onClick={swap}>
            <Icon name="swap" className="h-4 w-4" /> Swap
          </Button>
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={result?.ok ? 'good' : 'neutral'} />

      <OptionsCard label="Conversion options">
        <Segmented<Direction>
          label="Direction"
          options={[
            { value: 't2j', label: 'TOML → JSON' },
            { value: 'j2t', label: 'JSON → TOML' },
          ]}
          value={direction}
          onChange={setDirection}
        />
        {direction === 't2j' && (
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
        )}
      </OptionsCard>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          id={INPUT_ID}
          label={`Input ${from}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={18}
          placeholder={direction === 't2j' ? 'name = "value"\n[table]\nkey = 1' : '{"paste": "your JSON here"}'}
          aria-invalid={result ? !result.ok : undefined}
          onFileText={openText}
        />
        <div className="min-w-0 space-y-6">
          {result && !result.ok && <ErrorPanel error={result.error} text={text} inputId={INPUT_ID} />}
          {result?.ok && (
            <>
              <Notices items={result.warnings} />
              <OutputPanel
                title={to}
                icon={direction === 't2j' ? 'braces' : 'code'}
                text={result.output}
                fileName={direction === 't2j' ? 'converted.json' : 'converted.toml'}
                mime={direction === 't2j' ? 'application/json' : 'application/toml'}
                kind={direction === 't2j' ? 'json' : undefined}
              />
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Conversion runs in your browser with a built-in TOML 1.0 parser; nothing is uploaded. TOML dates and times become strings in JSON, and
        JSON null has no TOML form, so it is left out.
      </p>
    </div>
  );
}
