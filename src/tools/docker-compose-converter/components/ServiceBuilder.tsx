// Visual Docker Compose Service Builder component.
// Allows adding, configuring, and connecting services, applying common architecture templates,
// inspecting port/volume/dependency summaries and conflicts, and exporting live YAML and .env.example.

import { useEffect, useMemo, useState } from 'react';
import {
  analyzeCompose,
  createId,
  emptyService,
  generateEnvExample,
  isNamedVolume,
  serializeBuilderState,
  TEMPLATES,
  type ComposeBuilderState,
  type ServiceDef,
  type TemplateId,
} from '../features/service-builder';
import { Button, Icon } from '../../../shared/ui/ui';
import { CopyButton } from '../../../shared/ui/tool';
import { downloadText } from '../../../shared/utils/dom.utils';

export interface ServiceBuilderProps {
  state: ComposeBuilderState;
  onChange: (next: ComposeBuilderState) => void;
  onSendToConverter?: (yaml: string) => void;
}

export function ServiceBuilder({ state, onChange, onSendToConverter }: ServiceBuilderProps) {
  const [yamlText, setYamlText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | ''>('');
  const [expandedSummary, setExpandedSummary] = useState(false);

  // Live YAML serialization
  useEffect(() => {
    let active = true;
    void serializeBuilderState(state).then((yaml) => {
      if (active) setYamlText(yaml);
    });
    return () => {
      active = false;
    };
  }, [state]);

  const analysis = useMemo(() => analyzeCompose(state), [state]);
  const envExampleText = useMemo(() => generateEnvExample(state), [state]);

  // Actions on state
  const handleAddService = () => {
    const existing = new Set(state.services.map((s) => s.name));
    let base = 'app';
    let count = 1;
    while (existing.has(count === 1 ? base : `${base}${count}`)) {
      count++;
    }
    const name = count === 1 ? base : `${base}${count}`;
    onChange({
      ...state,
      services: [...state.services, emptyService(name)],
    });
  };

  const handleUpdateService = (id: string, patch: Partial<ServiceDef>) => {
    onChange({
      ...state,
      services: state.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const handleRemoveService = (id: string) => {
    onChange({
      ...state,
      services: state.services.filter((s) => s.id !== id),
    });
  };

  const handleDuplicateService = (id: string) => {
    const target = state.services.find((s) => s.id === id);
    if (!target) return;
    const copy: ServiceDef = {
      ...target,
      id: createId(),
      name: `${target.name}-copy`,
      containerName: target.containerName ? `${target.containerName}-copy` : undefined,
    };
    onChange({
      ...state,
      services: [...state.services, copy],
    });
  };

  const handleApplyTemplate = (tplId: TemplateId) => {
    const tpl = TEMPLATES[tplId];
    if (tpl) {
      onChange(tpl.state());
      setSelectedTemplate(tplId);
    }
  };

  const handleAutoDeclareVolumes = () => {
    const named = new Set(state.namedVolumes);
    for (const v of analysis.volumes) {
      if (v.type === 'named') {
        named.add(v.source);
      }
    }
    onChange({
      ...state,
      namedVolumes: [...named],
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Templates bar ── */}
      <section
        aria-label="Service templates"
        className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Starter Templates</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Load battle-tested multi-service architectures with health checks and placeholder credentials (local development only).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(TEMPLATES) as TemplateId[]).map((key) => {
              const t = TEMPLATES[key];
              const isSelected = selectedTemplate === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyTemplate(key)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Diagnostics / Warnings Banner ── */}
      {analysis.warnings.length > 0 && (
        <section
          aria-label="Configuration warnings"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/60"
        >
          <div className="flex items-start gap-3">
            <Icon name="warn" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 flex-1 space-y-2">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Configuration Warnings ({analysis.warnings.length})
              </h4>
              <ul className="list-inside list-disc space-y-1 text-xs text-amber-800 dark:text-amber-300">
                {analysis.warnings.map((w, idx) => (
                  <li key={idx} className="break-words">
                    {w}
                  </li>
                ))}
              </ul>
              {analysis.warnings.some((w) => w.includes('not declared in top-level volumes')) && (
                <Button variant="secondary" onClick={handleAutoDeclareVolumes} className="mt-2 text-xs">
                  Declare missing named volumes automatically
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Summary & Conflict Inspector ── */}
      <section
        aria-label="Summary inspector"
        className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="grid" className="h-5 w-5 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Architecture Overview ({state.services.length} services, {analysis.ports.length} port bindings, {analysis.volumes.length} volume mounts)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setExpandedSummary(!expandedSummary)}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            {expandedSummary ? 'Hide details ↑' : 'Show port & volume tables ↓'}
          </button>
        </div>

        {expandedSummary && (
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {/* Port bindings table */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Port Mappings
              </h4>
              {analysis.ports.length === 0 ? (
                <p className="text-xs text-slate-400">No published ports defined.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-slate-600 dark:text-slate-300">Service</th>
                        <th className="px-3 py-2 text-slate-600 dark:text-slate-300">Host Port</th>
                        <th className="px-3 py-2 text-slate-600 dark:text-slate-300">Container Port</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {analysis.ports.map((p, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 font-medium text-slate-900 dark:text-slate-100">{p.service}</td>
                          <td className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300">{p.hostPort}</td>
                          <td className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300">{p.containerPort}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Volume mounts table */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Volume Mounts
              </h4>
              {analysis.volumes.length === 0 ? (
                <p className="text-xs text-slate-400">No volumes mounted.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-slate-600 dark:text-slate-300">Service</th>
                        <th className="px-3 py-2 text-slate-600 dark:text-slate-300">Source</th>
                        <th className="px-3 py-2 text-slate-600 dark:text-slate-300">Target</th>
                        <th className="px-3 py-2 text-slate-600 dark:text-slate-300">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {analysis.volumes.map((v, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 font-medium text-slate-900 dark:text-slate-100">{v.service}</td>
                          <td className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300">{v.source}</td>
                          <td className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300">{v.target}</td>
                          <td className="px-3 py-1.5">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                v.type === 'named'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {v.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Services list ── */}
      <section aria-label="Services list" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Services</h3>
          <Button variant="secondary" onClick={handleAddService}>
            <Icon name="plus" className="h-4 w-4" /> Add Service
          </Button>
        </div>

        {state.services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No services in this Compose project. Click <strong>Add Service</strong> or select a template above.
          </div>
        ) : (
          <div className="space-y-4">
            {state.services.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                allServices={state.services}
                onUpdate={(patch) => handleUpdateService(svc.id, patch)}
                onRemove={() => handleRemoveService(svc.id)}
                onDuplicate={() => handleDuplicateService(svc.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Live Generated Artifacts: docker-compose.yml & .env.example ── */}
      <section aria-label="Generated outputs" className="grid items-start gap-6 lg:grid-cols-2">
        {/* YAML Output */}
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">docker-compose.yml</h4>
            <div className="flex flex-wrap items-center gap-2">
              {onSendToConverter && (
                <Button variant="ghost" onClick={() => onSendToConverter(yamlText)}>
                  <Icon name="arrow" className="h-4 w-4" /> Send to Converter
                </Button>
              )}
              <CopyButton text={yamlText} label="Copy YAML" />
              <Button
                variant="ghost"
                onClick={() => downloadText(yamlText, 'docker-compose.yml', 'application/yaml')}
                title="Download docker-compose.yml"
              >
                <Icon name="download" className="h-4 w-4" /> Download
              </Button>
            </div>
          </div>
          <pre
            tabIndex={0}
            role="region"
            aria-label="Generated docker-compose.yml"
            className="max-h-96 w-full max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-slate-100 dark:border-slate-800"
          >
            {yamlText || '# Generating compose YAML...'}
          </pre>
        </div>

        {/* .env.example Output */}
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">.env.example</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Never contains real credentials</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton text={envExampleText} label="Copy .env.example" />
              <Button
                variant="ghost"
                onClick={() => downloadText(envExampleText, '.env.example', 'text/plain')}
                title="Download .env.example"
              >
                <Icon name="download" className="h-4 w-4" /> Download
              </Button>
            </div>
          </div>
          <pre
            tabIndex={0}
            role="region"
            aria-label="Generated .env.example"
            className="max-h-96 w-full max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-slate-100 dark:border-slate-800"
          >
            {envExampleText}
          </pre>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Service Card Component

interface ServiceCardProps {
  service: ServiceDef;
  allServices: ServiceDef[];
  onUpdate: (patch: Partial<ServiceDef>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

function ServiceCard({ service, allServices, onUpdate, onRemove, onDuplicate }: ServiceCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showHealthcheck, setShowHealthcheck] = useState(!!service.healthcheck);
  const [newPort, setNewPort] = useState('');
  const [newVolume, setNewVolume] = useState('');
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');

  // Port management
  const handleAddPort = () => {
    if (!newPort.trim()) return;
    onUpdate({ ports: [...service.ports, newPort.trim()] });
    setNewPort('');
  };

  const handleRemovePort = (idx: number) => {
    onUpdate({ ports: service.ports.filter((_, i) => i !== idx) });
  };

  // Volume management
  const handleAddVolume = () => {
    if (!newVolume.trim()) return;
    onUpdate({ volumes: [...service.volumes, newVolume.trim()] });
    setNewVolume('');
  };

  const handleRemoveVolume = (idx: number) => {
    onUpdate({ volumes: service.volumes.filter((_, i) => i !== idx) });
  };

  // Env management
  const handleAddEnv = () => {
    if (!newEnvKey.trim()) return;
    onUpdate({ environment: [...service.environment, [newEnvKey.trim(), newEnvVal]] });
    setNewEnvKey('');
    setNewEnvVal('');
  };

  const handleRemoveEnv = (idx: number) => {
    onUpdate({ environment: service.environment.filter((_, i) => i !== idx) });
  };

  // Dependency management
  const otherServices = allServices.filter((s) => s.id !== service.id && s.name.trim());

  const handleToggleDep = (depName: string) => {
    const exists = service.dependsOn.find((d) => d.service === depName);
    if (exists) {
      onUpdate({ dependsOn: service.dependsOn.filter((d) => d.service !== depName) });
    } else {
      onUpdate({ dependsOn: [...service.dependsOn, { service: depName, condition: 'service_healthy' }] });
    }
  };

  const handleUpdateDepCondition = (
    depName: string,
    condition: 'service_started' | 'service_healthy' | 'service_completed_successfully',
  ) => {
    onUpdate({
      dependsOn: service.dependsOn.map((d) => (d.service === depName ? { ...d, condition } : d)),
    });
  };

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <Icon name="chevron-right" className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Service</span>
            <input
              type="text"
              value={service.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="service_name"
              className="max-w-[10rem] flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-sm font-semibold text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Duplicate service"
          >
            <Icon name="copy" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
            title="Remove service"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
      </header>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Main configuration grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Image */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Image (e.g. <code>postgres:16-alpine</code>)
              </label>
              <input
                type="text"
                value={service.image}
                onChange={(e) => onUpdate({ image: e.target.value })}
                placeholder="nginx:alpine"
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Build context */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Build Context (optional)
              </label>
              <input
                type="text"
                value={service.buildContext || ''}
                onChange={(e) => onUpdate({ buildContext: e.target.value || undefined })}
                placeholder="./backend"
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Restart policy */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Restart Policy
              </label>
              <select
                value={service.restart}
                onChange={(e) => onUpdate({ restart: e.target.value as ServiceDef['restart'] })}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="unless-stopped">unless-stopped</option>
                <option value="always">always</option>
                <option value="on-failure">on-failure</option>
                <option value="no">no</option>
              </select>
            </div>

            {/* Container Name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Container Name (optional)
              </label>
              <input
                type="text"
                value={service.containerName || ''}
                onChange={(e) => onUpdate({ containerName: e.target.value || undefined })}
                placeholder="my-app"
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Ports & Volumes */}
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {/* Ports */}
            <div className="min-w-0 space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ports ({service.ports.length})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {service.ports.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <span className="min-w-0 break-all">{p}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePort(idx)}
                      className="shrink-0 text-slate-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPort}
                  onChange={(e) => setNewPort(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPort())}
                  placeholder="8080:80"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <Button variant="ghost" onClick={handleAddPort} className="text-xs">
                  Add
                </Button>
              </div>
            </div>

            {/* Volumes */}
            <div className="min-w-0 space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Volumes ({service.volumes.length})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {service.volumes.map((v, idx) => {
                  const named = isNamedVolume(v.split(':')[0]);
                  return (
                    <span
                      key={idx}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <span
                        className={`shrink-0 text-[9px] font-semibold uppercase ${
                          named ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {named ? 'named' : 'bind'}
                      </span>
                      <span className="min-w-0 break-all">{v}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVolume(idx)}
                        className="shrink-0 text-slate-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newVolume}
                  onChange={(e) => setNewVolume(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVolume())}
                  placeholder="data:/var/lib/data or ./src:/app"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <Button variant="ghost" onClick={handleAddVolume} className="text-xs">
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Environment Variables ({service.environment.length})
            </label>
            {service.environment.length > 0 && (
              <div className="space-y-1.5">
                {service.environment.map(([k, v], idx) => (
                  <div key={idx} className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{k}</span>
                    <span className="text-slate-400">=</span>
                    <span className="flex-1 truncate text-slate-600 dark:text-slate-300">{v || '""'}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEnv(idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value)}
                placeholder="KEY (e.g. PORT)"
                className="w-28 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <input
                type="text"
                value={newEnvVal}
                onChange={(e) => setNewEnvVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEnv())}
                placeholder="VALUE (e.g. 8080)"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <Button variant="ghost" onClick={handleAddEnv} className="text-xs">
                Add
              </Button>
            </div>
          </div>

          {/* Dependencies (depends_on) */}
          {otherServices.length > 0 && (
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Dependencies (depends_on)
              </label>
              <div className="space-y-2">
                {otherServices.map((other) => {
                  const dep = service.dependsOn.find((d) => d.service === other.name);
                  const isChecked = !!dep;
                  return (
                    <div key={other.id} className="flex flex-wrap items-center gap-3 text-xs">
                      <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDep(other.name)}
                          className="h-3.5 w-3.5 rounded border-slate-300"
                        />
                        <span className="font-mono font-medium">{other.name}</span>
                      </label>
                      {isChecked && (
                        <select
                          value={dep?.condition || 'service_healthy'}
                          onChange={(e) =>
                            handleUpdateDepCondition(
                              other.name,
                              e.target.value as 'service_started' | 'service_healthy' | 'service_completed_successfully',
                            )
                          }
                          className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <option value="service_healthy">condition: service_healthy</option>
                          <option value="service_started">condition: service_started</option>
                          <option value="service_completed_successfully">condition: completed</option>
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Healthcheck Collapsible */}
          <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Health Check
              </label>
              <button
                type="button"
                onClick={() => {
                  if (showHealthcheck && service.healthcheck) {
                    onUpdate({ healthcheck: undefined });
                    setShowHealthcheck(false);
                  } else {
                    onUpdate({
                      healthcheck: {
                        test: 'curl -f http://localhost:80/ || exit 1',
                        interval: '30s',
                        timeout: '10s',
                        retries: 3,
                        startPeriod: '10s',
                      },
                    });
                    setShowHealthcheck(true);
                  }
                }}
                className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {showHealthcheck ? 'Remove healthcheck' : '+ Add healthcheck'}
              </button>
            </div>

            {showHealthcheck && service.healthcheck && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Test Command</label>
                  <input
                    type="text"
                    value={service.healthcheck.test}
                    onChange={(e) =>
                      onUpdate({
                        healthcheck: { ...service.healthcheck!, test: e.target.value },
                      })
                    }
                    placeholder="curl -f http://localhost:80/ || exit 1"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Interval</label>
                  <input
                    type="text"
                    value={service.healthcheck.interval || ''}
                    onChange={(e) =>
                      onUpdate({
                        healthcheck: { ...service.healthcheck!, interval: e.target.value },
                      })
                    }
                    placeholder="30s"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Timeout</label>
                  <input
                    type="text"
                    value={service.healthcheck.timeout || ''}
                    onChange={(e) =>
                      onUpdate({
                        healthcheck: { ...service.healthcheck!, timeout: e.target.value },
                      })
                    }
                    placeholder="10s"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Retries</label>
                  <input
                    type="number"
                    value={service.healthcheck.retries ?? 3}
                    onChange={(e) =>
                      onUpdate({
                        healthcheck: { ...service.healthcheck!, retries: parseInt(e.target.value, 10) || 1 },
                      })
                    }
                    placeholder="3"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Start Period</label>
                  <input
                    type="text"
                    value={service.healthcheck.startPeriod || ''}
                    onChange={(e) =>
                      onUpdate({
                        healthcheck: { ...service.healthcheck!, startPeriod: e.target.value },
                      })
                    }
                    placeholder="10s"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs text-slate-900 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
