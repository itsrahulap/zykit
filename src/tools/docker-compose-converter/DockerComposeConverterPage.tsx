import { useEffect, useMemo, useState } from 'react';
import dockerComposeConverter from './index';
import { convert, DEFAULT_RUN_OPTIONS, detectDirection, type Conversion, type Direction } from './features/docker-compose-converter';
import { Checkbox, ErrorPanel, Notices, OpenFileButton, OutputPanel } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { pluralize } from '../../shared/utils/format.utils';

type Mode = 'auto' | Direction;

const MAX_INPUT_CHARS = 1_000_000;

const RUN_SAMPLE = `docker run -d --name web \\
  -p 8080:80 \\
  -e APP_ENV=production \\
  -v site:/usr/share/nginx/html \\
  --network frontend \\
  --restart unless-stopped \\
  --health-cmd "curl -f http://localhost/" --health-interval 30s \\
  --cpus 0.5 --memory 256m \\
  nginx:1.27-alpine`;

const COMPOSE_SAMPLE = `services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - pgdata:/var/lib/postgresql/data
  web:
    image: nginx:1.27-alpine
    ports: ["8080:80"]
    depends_on: [db]
    restart: unless-stopped
volumes:
  pgdata:
`;

export default function DockerComposeConverterPage() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('auto');
  const [detach, setDetach] = useState(DEFAULT_RUN_OPTIONS.detach);
  const [multiline, setMultiline] = useState(DEFAULT_RUN_OPTIONS.multiline);
  const [result, setResult] = useState<{ for: string; value: Conversion } | null>(null);

  const tooLarge = input.length > MAX_INPUT_CHARS;
  const direction: Direction = mode === 'auto' ? detectDirection(input) : mode;
  const key = `${direction}\u0000${detach}\u0000${multiline}\u0000${input}`;

  useEffect(() => {
    if (!input.trim() || tooLarge) return;
    let live = true;
    const timer = setTimeout(() => {
      void convert(input, direction, { detach, multiline }).then((value) => live && setResult({ for: key, value }));
    }, 150);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [input, direction, detach, multiline, key, tooLarge]);

  const current = useMemo(() => (result && result.for === key ? result.value : null), [result, key]);
  const stale = !!input.trim() && !tooLarge && !current;

  useIncomingText(dockerComposeConverter.id, (t, h) => {
    setInput(t);
    setMode(h.kind === 'yaml' ? 'compose-to-run' : 'auto');
  });
  useShareState(
    { input, mode, detach, multiline },
    (s) => {
      if (s.input !== undefined) setInput(s.input);
      if (s.mode) setMode(s.mode);
      if (s.detach !== undefined) setDetach(s.detach);
      if (s.multiline !== undefined) setMultiline(s.multiline);
    },
    { mode: ['auto', 'run-to-compose', 'compose-to-run'] },
  );

  const toCompose = direction === 'run-to-compose';
  const status = tooLarge
    ? 'This input is too large to convert here (limit: about 1 MB).'
    : !input.trim()
      ? 'Paste a docker run command or a Compose file.'
      : current?.error
        ? 'Could not convert this input.'
        : current
          ? `Converted ${pluralize(current.services, 'service')} to ${toCompose ? 'Compose YAML' : 'docker run'}.`
          : 'Converting…';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={dockerComposeConverter} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="Compose">Convert docker run to </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => (setInput(RUN_SAMPLE), setMode('auto'))}>
            docker run example
          </Button>
          <Button variant="secondary" onClick={() => (setInput(COMPOSE_SAMPLE), setMode('auto'))}>
            Compose example
          </Button>
          <OpenFileButton accept=".yml,.yaml,.sh,.txt,text/plain" onText={(t) => setInput(t)} />
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <StatusStrip status={status} tone={stale ? 'busy' : current && !current.error ? 'good' : 'neutral'} />

      <section
        aria-label="Conversion options"
        className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <Segmented<Mode>
          label="Direction"
          options={[
            { value: 'auto', label: 'Auto-detect' },
            { value: 'run-to-compose', label: 'docker run → Compose' },
            { value: 'compose-to-run', label: 'Compose → docker run' },
          ]}
          value={mode}
          onChange={setMode}
        />
        {!toCompose && (
          <>
            <Checkbox label="Add -d (detached)" checked={detach} onChange={setDetach} />
            <Checkbox label="One option per line" checked={multiline} onChange={setMultiline} />
          </>
        )}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          label={toCompose ? 'docker run command(s)' : 'Compose file'}
          hint={mode === 'auto' ? (toCompose ? 'detected: docker run' : 'detected: Compose YAML') : undefined}
          id="compose-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={18}
          placeholder={toCompose ? 'docker run -d -p 8080:80 nginx' : 'services:\n  web:\n    image: nginx'}
          aria-invalid={current?.error ? true : undefined}
          onFileText={(t) => setInput(t)}
        />

        <div className="min-w-0 space-y-6">
          {current?.error && (
            <ErrorPanel error={{ message: current.error, line: 1, column: 1, offset: 0 }} text={input} fieldId="compose-input" title="Couldn't convert" />
          )}
          {current && !current.error && current.output && (
            <OutputPanel
              title={toCompose ? 'docker-compose.yml' : 'docker run'}
              icon={toCompose ? 'braces' : 'code'}
              text={current.output}
              fileName={toCompose ? 'docker-compose.yml' : 'docker-run.sh'}
              mime={toCompose ? 'application/yaml' : 'text/x-shellscript'}
              kind={toCompose ? 'yaml' : 'code'}
            />
          )}
          {current && <Notices items={current.warnings} />}
          {current && current.notes.length > 0 && (
            <ul className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              {current.notes.map((n) => (
                <li key={n} className="flex gap-2 break-words">
                  <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Conversion runs in your browser; nothing is uploaded. Paste several docker run commands to get several services. Flags that Compose can&rsquo;t express are
        listed as warnings instead of being dropped silently.
      </p>
    </div>
  );
}
