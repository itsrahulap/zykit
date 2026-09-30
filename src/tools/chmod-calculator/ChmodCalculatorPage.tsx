import { useState } from 'react';
import chmodCalculator from './index';
import {
  applyChmod,
  applyUmask,
  bitFor,
  describeMode,
  lsString,
  parseOctal,
  parseSymbolic,
  PERMS,
  PRESETS,
  SETGID,
  SETUID,
  STICKY,
  toChmodSymbolic,
  toOctal,
  toSymbolic,
  warnings,
  WHO,
} from './features/chmod-calculator';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CopyButton } from '../../shared/ui/tool';
import { Checkbox, Notices } from '../../shared/ui/convert';
import { Button } from '../../shared/ui/ui';
import { useShareState } from '../../shared/hooks/useShareState';
import { useToolShortcuts } from '../../shared/hooks/useToolShortcuts';

const inputClass =
  'block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 aria-invalid:border-red-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
const box = 'h-5 w-5 rounded border-slate-300 accent-emerald-600 dark:border-slate-600';

const WHO_LABEL = { u: 'Owner', g: 'Group', o: 'Others' } as const;
const PERM_LABEL = { r: 'Read', w: 'Write', x: 'Execute' } as const;
const SPECIALS = [
  { bit: SETUID, label: 'setuid', hint: 'run as owner' },
  { bit: SETGID, label: 'setgid', hint: 'run as group / inherit group' },
  { bit: STICKY, label: 'sticky', hint: 'only owners delete (dirs)' },
];

function Field({ id, label, value, onChange, error, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="eyebrow mb-2 block text-slate-600 dark:text-slate-400">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass}
      />
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function CommandRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
      <span className="w-28 shrink-0 text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <code className="min-w-0 flex-1 break-all font-mono text-sm text-slate-900 dark:text-slate-100" data-testid={`row-${label}`}>
        {value}
      </code>
      <CopyButton text={value} />
    </li>
  );
}

export default function ChmodCalculatorPage() {
  const [mode, setModeState] = useState(0o755);
  const [octalText, setOctalText] = useState('755');
  const [symText, setSymText] = useState('rwxr-xr-x');
  const [isDir, setIsDir] = useState(false);
  const [expr, setExpr] = useState('u+x,g-w,o=r');
  const [umaskText, setUmaskText] = useState('022');

  /** Sets the mode and refreshes the text fields that didn't cause the change. */
  const setMode = (m: number, from?: 'octal' | 'symbolic') => {
    setModeState(m);
    if (from !== 'octal') setOctalText(toOctal(m));
    if (from !== 'symbolic') setSymText(toSymbolic(m));
  };

  useShareState(
    { mode: toOctal(mode, 4), dir: isDir, expr, umask: umaskText },
    (s) => {
      if (s.mode !== undefined) {
        const r = parseOctal(s.mode);
        if (r.ok) setMode(r.value);
      }
      if (s.dir !== undefined) setIsDir(s.dir);
      if (s.expr !== undefined) setExpr(s.expr);
      if (s.umask !== undefined) setUmaskText(s.umask);
    },
  );
  useToolShortcuts({ getOutput: () => toOctal(mode) });

  const octalParsed = parseOctal(octalText);
  const symParsed = parseSymbolic(symText);
  const exprResult = applyChmod(mode, expr, { isDir });
  const umaskParsed = parseOctal(umaskText);
  const umask = umaskParsed.ok ? applyUmask(umaskParsed.value) : null;

  const toggle = (bit: number, on: boolean) => setMode(on ? mode | bit : mode & ~bit);
  const octal = toOctal(mode);
  const target = isDir ? 'directory' : 'file';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={chmodCalculator} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="permissions">Calculate file </Headline>
      </div>

      <StatusStrip status={`${octal} · ${lsString(mode, isDir)} · ${describeMode(mode).join(' · ')}`} tone="good" />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-label="Permission bits" className="min-w-0 space-y-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full table-fixed text-sm">
            <caption className="sr-only">Read, write and execute permissions</caption>
            <thead>
              <tr className="text-slate-600 dark:text-slate-400">
                <th scope="col" className="w-1/4 pb-2 text-left font-medium" />
                {PERMS.map((p) => (
                  <th key={p} scope="col" className="pb-2 font-medium">
                    {PERM_LABEL[p]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {WHO.map((w) => (
                <tr key={w}>
                  <th scope="row" className="py-2 text-left font-medium text-slate-800 dark:text-slate-200">
                    {WHO_LABEL[w]}
                  </th>
                  {PERMS.map((p) => (
                    <td key={p} className="text-center">
                      <label className="inline-flex h-11 w-11 cursor-pointer items-center justify-center">
                        <input
                          type="checkbox"
                          className={box}
                          aria-label={`${WHO_LABEL[w]} ${PERM_LABEL[p].toLowerCase()}`}
                          checked={!!(mode & bitFor(w, p))}
                          onChange={(e) => toggle(bitFor(w, p), e.target.checked)}
                        />
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <fieldset className="space-y-1">
            <legend className="eyebrow mb-1 text-slate-600 dark:text-slate-400">Special bits</legend>
            <div className="flex flex-wrap gap-x-6">
              {SPECIALS.map((s) => (
                <Checkbox
                  key={s.label}
                  label={
                    <span>
                      {s.label} <span className="text-slate-500 dark:text-slate-400">({s.hint})</span>
                    </span>
                  }
                  checked={!!(mode & s.bit)}
                  onChange={(on) => toggle(s.bit, on)}
                />
              ))}
            </div>
          </fieldset>
          <Checkbox label="It's a directory (affects X and the ls -l type)" checked={isDir} onChange={setIsDir} />
        </section>

        <section aria-label="Mode" className="min-w-0 space-y-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="octal-input"
              label="Octal"
              value={octalText}
              onChange={(v) => {
                setOctalText(v);
                const r = parseOctal(v);
                if (r.ok) setMode(r.value, 'octal');
              }}
              error={octalText.trim() && !octalParsed.ok ? octalParsed.error : undefined}
            />
            <Field
              id="symbolic-input"
              label="Symbolic"
              value={symText}
              onChange={(v) => {
                setSymText(v);
                const r = parseSymbolic(v);
                if (r.ok) {
                  setMode(r.value.mode, 'symbolic');
                  if (r.value.type) setIsDir(r.value.type === 'd');
                }
              }}
              error={symText.trim() && !symParsed.ok ? symParsed.error : undefined}
            />
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            <CommandRow label="ls -l" value={lsString(mode, isDir)} />
            <CommandRow label="chmod" value={`chmod ${octal} ${isDir ? 'dir' : 'file'}`} />
            <CommandRow label="chmod (symbolic)" value={`chmod ${toChmodSymbolic(mode)} ${isDir ? 'dir' : 'file'}`} />
            <CommandRow label="4-digit octal" value={toOctal(mode, 4)} />
          </ul>
          <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {describeMode(mode).map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <Notices items={warnings(mode)} />
        </section>
      </div>

      <Panel eyebrow="Presets" icon="bookmark">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setMode(p.mode)}
              aria-pressed={mode === p.mode}
              className={`rounded-2xl border p-3 text-left transition-colors pointer-coarse:min-h-11 ${
                mode === p.mode
                  ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
              }`}
            >
              <span className="block font-mono font-semibold text-slate-900 dark:text-white">
                {p.label} <span className="font-normal text-slate-500 dark:text-slate-400">{toSymbolic(p.mode)}</span>
                {p.mode === 0o777 && <span className="ml-2 text-amber-700 dark:text-amber-400">⚠</span>}
              </span>
              <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">{p.use}</span>
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel eyebrow="Apply a symbolic mode" icon="code">
          <Field
            id="expr-input"
            label={`Expression, applied to ${octal}`}
            value={expr}
            onChange={setExpr}
            placeholder="u+x,g-w,o=r"
            error={!exprResult.ok ? exprResult.error : undefined}
          />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Clauses like <code>u+x</code>, <code>go-w</code>, <code>a=rX</code>, <code>o=g</code> or <code>+t</code>, separated by commas.
          </p>
          {exprResult.ok && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-100 p-4 dark:bg-slate-950">
              <span className="font-mono text-slate-900 dark:text-slate-100" data-testid="expr-result">
                {toOctal(exprResult.value)} · {lsString(exprResult.value, isDir)}
              </span>
              <Button variant="secondary" onClick={() => setMode(exprResult.value)} disabled={exprResult.value === mode}>
                Use this mode
              </Button>
            </div>
          )}
        </Panel>

        <Panel eyebrow="umask calculator" icon="lock">
          <Field id="umask-input" label="umask" value={umaskText} onChange={setUmaskText} error={!umaskParsed.ok ? umaskParsed.error : undefined} />
          {umask && (
            <ul className="mt-4 space-y-3">
              {(
                [
                  ['New files', umask.file, false],
                  ['New directories', umask.dir, true],
                ] as const
              ).map(([label, m, dir]) => (
                <li key={label} className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {label}: <code className="font-mono text-slate-900 dark:text-slate-100" data-testid={`umask-${dir ? 'dir' : 'file'}`}>{toOctal(m)} {lsString(m, dir)}</code>
                  </span>
                  <Button
                    variant="ghost"
                    className="pointer-coarse:min-h-11"
                    onClick={() => {
                      setMode(m);
                      setIsDir(dir);
                    }}
                  >
                    Use
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Files start at 666 and directories at 777; bits set in the umask are removed. Common values: 022, 002, 077.
          </p>
        </Panel>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Calculated in your browser, following POSIX chmod rules for a {target}.
      </p>
    </div>
  );
}
