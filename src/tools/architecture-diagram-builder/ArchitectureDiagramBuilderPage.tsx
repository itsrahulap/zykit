import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import architectureDiagramBuilder from './index';
import { DiagramCanvas } from './components/DiagramCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import {
  DiagramLimitError,
  addEdge,
  addGroup,
  addNode,
  commit,
  createHistory,
  deleteItem,
  freeSpot,
  preview,
  redo,
  undo,
  updateEdge,
  updateGroup,
  updateNode,
  type History,
  type Selection,
} from './features/diagram';
import { toMermaid } from './features/mermaid';
import { EMPTY_DIAGRAM, KIND_LABELS, NODE_KINDS, clampZoom, fitView, zoomAt, type Diagram, type NodeKind, type View } from './features/model';
import { SAMPLES } from './features/samples';
import { importDiagram, MAX_IMPORT_BYTES, parseDiagram, serializeDiagram, toFile } from './features/serialize';
import { toSvg } from './features/svgExport';
import { svgToPng } from './utils/png';
import { AppError } from '../../shared/lib/errors';
import { createStore } from '../../shared/lib/store';
import { OpenFileButton } from '../../shared/ui/convert';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Select } from '../../shared/ui/Select';
import { Breadcrumb, CodeBlock, CopyButton } from '../../shared/ui/tool';
import { Button, Icon, type IconName } from '../../shared/ui/ui';
import { downloadBlob, downloadText } from '../../shared/utils/dom.utils';

const store = createStore<unknown>('zykit-architecture-diagram', null);

/** The saved diagram, validated like an import (localStorage is user-editable), or the first sample. */
function loadSaved(): { diagram: Diagram; notice: string | null } {
  const saved = store.get();
  if (saved === null) return { diagram: SAMPLES[0].diagram, notice: null };
  try {
    return { diagram: parseDiagram(saved), notice: null };
  } catch (err) {
    const reason = err instanceof AppError ? err.message : 'it is not a diagram';
    return { diagram: SAMPLES[0].diagram, notice: `The saved diagram couldn’t be loaded (${reason}), so a sample was opened.` };
  }
}

const isEditable = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest('input, textarea, select, [contenteditable="true"]');

function IconButton({ icon, label, onClick, disabled, pressed }: { icon: IconName; label: string; onClick: () => void; disabled?: boolean; pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl text-slate-700 ring-1 ring-inset ring-field-edge hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 pointer-coarse:min-h-11 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <Icon name={icon} className="h-4 w-4" />
    </button>
  );
}

export default function ArchitectureDiagramBuilderPage() {
  const [initial] = useState(loadSaved);
  const [history, setHistory] = useState<History>(() => createHistory(initial.diagram));
  const [selection, setSelection] = useState<Selection>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, zoom: 1 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [status, setStatus] = useState(initial.notice ?? 'Drag nodes to arrange them, or use the keyboard.');
  const [error, setError] = useState<string | null>(null);
  const fitPending = useRef(true);
  // Consecutive edits of the same field (typing a label) share one undo step.
  const lastEditKey = useRef<string | null>(null);
  const diagram = history.present;

  useEffect(() => {
    store.set(toFile(diagram));
  }, [diagram]);

  useEffect(() => {
    if (!fitPending.current || !size.width) return;
    fitPending.current = false;
    setView(fitView(diagram, size.width, size.height));
  }, [diagram, size]);

  const onSizeChange = useCallback((width: number, height: number) => setSize({ width, height }), []);

  const apply = (next: Diagram, message: string, editKey: string | null = null) => {
    const coalesce = editKey !== null && editKey === lastEditKey.current;
    lastEditKey.current = editKey;
    setHistory((h) => (coalesce ? preview(h, next) : commit(h, next)));
    setStatus(message);
  };

  const guarded = (action: () => void) => {
    try {
      action();
    } catch (err) {
      if (!(err instanceof DiagramLimitError)) throw err;
      setError(err.message);
    }
  };

  const replaceDiagram = (next: Diagram, message: string) => {
    apply(next, message);
    setSelection(null);
    setConnectFrom(null);
    fitPending.current = true;
    if (size.width) {
      fitPending.current = false;
      setView(fitView(next, size.width, size.height));
    }
  };

  const doUndo = () => {
    lastEditKey.current = null;
    setHistory(undo);
    setStatus(history.past.length ? 'Undone.' : 'Nothing to undo.');
  };
  const doRedo = () => {
    lastEditKey.current = null;
    setHistory(redo);
    setStatus(history.future.length ? 'Redone.' : 'Nothing to redo.');
  };

  // Ctrl/⌘+Z undoes, Shift+Ctrl/⌘+Z or Ctrl+Y redoes; text fields keep their own undo.
  const keyHandlers = useRef({ doUndo, doRedo });
  useEffect(() => {
    keyHandlers.current = { doUndo, doRedo };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || isEditable(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) keyHandlers.current.doUndo();
      else if ((key === 'z' && e.shiftKey) || key === 'y') keyHandlers.current.doRedo();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const nodeName = (id: string) => diagram.nodes.find((n) => n.id === id)?.label || id;

  const connect = (from: string, to: string) =>
    guarded(() => {
      const result = addEdge(diagram, from, to);
      if (!result) {
        setStatus(from === to ? 'A node can’t connect to itself.' : 'Those nodes are already connected.');
        return;
      }
      apply(result.diagram, `Connected ${nodeName(from)} → ${nodeName(to)}.`);
      setSelection({ type: 'edge', id: result.id });
    });

  const pick = (s: Selection) => {
    if (connectMode && s?.type === 'node') {
      if (!connectFrom) {
        setConnectFrom(s.id);
        setSelection(s);
        setStatus(`Connecting from ${nodeName(s.id)}. Now pick the target node.`);
      } else {
        connect(connectFrom, s.id);
        setConnectFrom(null);
      }
      return;
    }
    setSelection(s);
  };

  const add = (kind: NodeKind) =>
    guarded(() => {
      // Place new nodes in the visible part of the canvas when possible.
      const centre = size.width ? { x: (size.width / 2 - view.x) / view.zoom - 75, y: (size.height / 2 - view.y) / view.zoom - 32 } : freeSpot(diagram);
      const taken = diagram.nodes.some((n) => Math.abs(n.x - centre.x) < 20 && Math.abs(n.y - centre.y) < 20);
      const spot = taken ? { x: centre.x + 24 * (diagram.nodes.length % 8), y: centre.y + 24 * (diagram.nodes.length % 8) } : centre;
      const label = `New ${KIND_LABELS[kind].toLowerCase()}`;
      const result = addNode(diagram, kind, label, spot.x, spot.y);
      apply(result.diagram, `Added ${label}.`);
      setSelection({ type: 'node', id: result.id });
    });

  const addBoundary = () =>
    guarded(() => {
      const x = size.width ? (size.width / 2 - view.x) / view.zoom - 180 : 0;
      const y = size.height ? (size.height / 2 - view.y) / view.zoom - 110 : 0;
      const result = addGroup(diagram, 'New group', x, y);
      apply(result.diagram, 'Added a group. Nodes inside it move with it.');
      setSelection({ type: 'group', id: result.id });
    });

  const remove = (s: NonNullable<Selection>) => {
    const what = s.type === 'node' ? `node ${nodeName(s.id)} and its edges` : s.type;
    apply(deleteItem(diagram, s), `Deleted ${what}.`);
    setSelection(null);
    if (connectFrom === s.id) setConnectFrom(null);
  };

  const zoomBy = (factor: number) => setView(zoomAt(view, factor, size.width / 2, size.height / 2));

  const mermaid = useMemo(() => toMermaid(diagram), [diagram]);

  const downloadPng = () => {
    const { svg, width, height } = toSvg(diagram);
    svgToPng(svg, width, height).then(
      (blob) => {
        downloadBlob(blob, 'architecture-diagram.png');
        setStatus('PNG downloaded.');
      },
      (err: unknown) => setError(err instanceof AppError ? err.message : 'Couldn’t create the PNG.'),
    );
  };

  const importText = (text: string) => {
    try {
      replaceDiagram(importDiagram(text), 'Diagram imported.');
    } catch (err) {
      if (!(err instanceof AppError)) throw err;
      setError(`Couldn’t import: ${err.message}`);
    }
  };

  const toolbarGroup = 'flex flex-wrap items-center gap-2';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={architectureDiagramBuilder} />
      <Headline accent="diagrams">Architecture </Headline>
      <StatusStrip status={status} />
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <section aria-label="Diagram toolbar" className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className={toolbarGroup}>
          <Select label="Add node" placeholder="Choose a kind…" options={NODE_KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))} onChange={add} />
          <Button variant="secondary" onClick={addBoundary}>
            <Icon name="grid" className="h-4 w-4" /> Add group
          </Button>
          <Button
            variant="secondary"
            aria-pressed={connectMode}
            onClick={() => {
              setConnectMode(!connectMode);
              setConnectFrom(null);
              setStatus(connectMode ? 'Connect mode off.' : 'Connect mode on: pick the source node, then the target.');
            }}
            className={connectMode ? 'ring-2 ring-emerald-500' : ''}
          >
            <Icon name="link" className="h-4 w-4" /> Connect
          </Button>
        </div>
        <div className={toolbarGroup}>
          <IconButton icon="chevron-left" label="Undo" onClick={doUndo} disabled={!history.past.length} />
          <IconButton icon="chevron-right" label="Redo" onClick={doRedo} disabled={!history.future.length} />
          <IconButton icon="minus" label="Zoom out" onClick={() => zoomBy(1 / 1.25)} disabled={view.zoom <= clampZoom(0)} />
          <IconButton icon="plus" label="Zoom in" onClick={() => zoomBy(1.25)} disabled={view.zoom >= clampZoom(Infinity)} />
          <IconButton icon="search" label="Fit to view" onClick={() => setView(fitView(diagram, size.width, size.height))} />
          <span className="text-sm tabular-nums text-slate-600 dark:text-slate-400">{Math.round(view.zoom * 100)}%</span>
        </div>
        <div className={toolbarGroup}>
          <Select
            label="Samples"
            placeholder="Load a sample…"
            options={SAMPLES.map((s) => ({ value: s.id, label: s.name }))}
            onChange={(id) => {
              const sample = SAMPLES.find((s) => s.id === id)!;
              replaceDiagram(sample.diagram, `Loaded the “${sample.name}” sample.`);
            }}
          />
          <Button variant="ghost" onClick={() => replaceDiagram(EMPTY_DIAGRAM, 'Started a new, empty diagram. Undo brings the old one back.')}>
            New
          </Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-2">
          <DiagramCanvas
            diagram={diagram}
            view={view}
            selection={selection}
            connectFrom={connectFrom}
            onViewChange={setView}
            onSizeChange={onSizeChange}
            onSelect={setSelection}
            onPick={pick}
            onMove={(base, next, done) => {
              lastEditKey.current = null;
              setHistory((h) => (done ? commit(h, next, base) : preview(h, next)));
              if (done) setStatus('Moved.');
            }}
            onResize={(base, id, width, height, done) => {
              const next = updateGroup(base, id, { width, height });
              setHistory((h) => (done ? commit(h, next, base) : preview(h, next)));
              if (done) setStatus('Resized the group.');
            }}
            onDelete={remove}
          />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {diagram.nodes.length} nodes · {diagram.edges.length} edges · {diagram.groups.length} groups. Drag the background to pan; Ctrl/⌘ + scroll zooms. Saved in this browser.
          </p>
        </div>
        <PropertiesPanel
          diagram={diagram}
          selection={selection}
          onSelect={setSelection}
          onNodeChange={(id, patch) =>
            apply(updateNode(diagram, id, patch), patch.kind ? `Changed kind to ${KIND_LABELS[patch.kind]}.` : 'Label updated.', patch.label !== undefined ? `node-label:${id}` : null)
          }
          onEdgeChange={(id, label) => apply(updateEdge(diagram, id, { label }), 'Edge label updated.', `edge-label:${id}`)}
          onGroupChange={(id, patch) => apply(updateGroup(diagram, id, patch), 'Group updated.', patch.label !== undefined ? `group-label:${id}` : null)}
          onConnect={connect}
          onDelete={remove}
        />
      </div>

      <section aria-label="Export" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="eyebrow text-slate-600 dark:text-slate-400">Mermaid flowchart</h2>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={mermaid} label="Copy Mermaid" />
            <Button variant="ghost" onClick={() => downloadText(mermaid, 'architecture-diagram.mmd', 'text/plain')}>
              <Icon name="download" className="h-4 w-4" /> .mmd
            </Button>
          </div>
        </div>
        <CodeBlock label="Mermaid flowchart" className="max-h-80">
          {mermaid}
        </CodeBlock>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => downloadText(toSvg(diagram).svg, 'architecture-diagram.svg', 'image/svg+xml')}>
            <Icon name="download" className="h-4 w-4" /> SVG
          </Button>
          <Button variant="secondary" onClick={downloadPng}>
            <Icon name="download" className="h-4 w-4" /> PNG
          </Button>
          <Button variant="secondary" onClick={() => downloadText(serializeDiagram(diagram), 'architecture-diagram.json', 'application/json')}>
            <Icon name="download" className="h-4 w-4" /> JSON
          </Button>
          <OpenFileButton accept=".json,application/json" maxBytes={MAX_IMPORT_BYTES} label="Import JSON" onText={importText} />
        </div>
      </section>
    </div>
  );
}
