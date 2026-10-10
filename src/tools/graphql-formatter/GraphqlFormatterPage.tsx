import { useDeferredValue, useMemo, useState } from 'react';
import graphqlFormatter from './index';
import { formatGraphql, minifyGraphql } from './features/graphql-formatter';
import { ErrorPanel, Notices, OpenFileButton, OptionsCard, OutputPanel } from '../../shared/ui/convert';
import { useIncomingText } from '../../shared/hooks/useIncomingText';
import { useShareState } from '../../shared/hooks/useShareState';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { formatBytes, pluralize } from '../../shared/utils/format.utils';

type Action = 'format' | 'minify';
type IndentChoice = '2' | '4' | 'tab';

const INPUT_ID = 'gql-input';
const MAX_CHARS = 5_000_000;
const SAMPLE = `# Fetch a user
query User($id: ID!, $first: Int = 10) { user(id: $id) { name, ...Info, friends(first: $first) @include(if: true) { edges { node { name } } } } }
fragment Info on User { email }

"""A person"""
type User implements Node { id: ID! name(upper: Boolean = false): String @deprecated(reason: "use fullName") }
union Result = User | Error
enum Role { ADMIN USER }`;

export default function GraphqlFormatterPage() {
  const [input, setInput] = useState('');
  const [action, setAction] = useState<Action>('format');
  const [indent, setIndent] = useState<IndentChoice>('2');
  const text = useDeferredValue(input);
  const tooLarge = text.length > MAX_CHARS;

  const result = useMemo(() => {
    if (!text.trim() || tooLarge) return null;
    return action === 'minify' ? minifyGraphql(text) : formatGraphql(text, { indent: indent === 'tab' ? 'tab' : Number(indent) });
  }, [text, tooLarge, action, indent]);

  const output = result?.ok ? result.text : '';
  const error = result && !result.ok ? result.error : null;
  const dropped = result?.ok ? result.dropped : 0;

  useIncomingText(graphqlFormatter.id, (t) => setInput(t));
  useShareState(
    { input, action, indent },
    (s) => {
      if (s.input !== undefined) setInput(s.input);
      if (s.action) setAction(s.action);
      if (s.indent) setIndent(s.indent);
    },
    { action: ['format', 'minify'], indent: ['2', '4', 'tab'] },
  );

  const status = tooLarge
    ? 'This input is too large to format here (limit: about 5 MB).'
    : !text.trim()
      ? 'Paste a GraphQL query or schema to format or minify it.'
      : error
        ? `Syntax error at line ${error.line}, column ${error.column}: ${error.message}`
        : `${action === 'minify' ? 'Minified' : 'Formatted'} · ${pluralize(output.split('\n').filter(Boolean).length, 'line')} · ${formatBytes(new TextEncoder().encode(output).length)}`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={graphqlFormatter} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="readable">Make GraphQL </Headline>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setInput(SAMPLE)}>
            Try an example
          </Button>
          <OpenFileButton accept=".graphql,.gql,.graphqls,.txt" onText={(t) => setInput(t)} />
          <Button variant="ghost" disabled={!input} onClick={() => setInput('')}>
            <Icon name="x" className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>
      <StatusStrip status={status} tone={output ? 'good' : 'neutral'} />

      <OptionsCard label="Formatting options">
        <Segmented<Action>
          label="Action"
          options={[
            { value: 'format', label: 'Format' },
            { value: 'minify', label: 'Minify' },
          ]}
          value={action}
          onChange={setAction}
        />
        {action === 'format' && (
          <Segmented<IndentChoice>
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
      </OptionsCard>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CodeArea
          id={INPUT_ID}
          label="Input GraphQL"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={18}
          placeholder="{ viewer { name } }"
          aria-invalid={error ? true : undefined}
          onFileText={(t) => setInput(t)}
        />
        <div className="min-w-0 space-y-6">
          {error && <ErrorPanel error={error} text={text} inputId={INPUT_ID} />}
          {dropped > 0 && <Notices items={[`${pluralize(dropped, 'comment')} in positions this formatter can't keep (for example inside argument lists) ${dropped === 1 ? 'was' : 'were'} removed.`]} />}
          {output && <OutputPanel title={action === 'minify' ? 'Minified' : 'Formatted'} icon="braces" text={output} fileName={action === 'minify' ? 'minified.graphql' : 'formatted.graphql'} mime="text/plain" kind="code" />}
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">Your GraphQL is parsed in your browser and never uploaded. Queries, fragments and schema definitions are all supported.</p>
    </div>
  );
}
