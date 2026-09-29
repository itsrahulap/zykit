// TypeScript → JavaScript by stripping types with sucrase (loaded on first use only).
// Sucrase keeps every statement on its original line, so line numbers need no mapping.

export type CompileResult =
  | { ok: true; code: string }
  | { ok: false; message: string; line: number | null; column: number | null };

type Transform = typeof import('sucrase').transform;
let transformPromise: Promise<Transform> | null = null;

function loadSucrase(): Promise<Transform> {
  if (!transformPromise) {
    transformPromise = import('sucrase').then((m) => m.transform);
    transformPromise.catch(() => {
      transformPromise = null; // allow a retry after a failed chunk load
    });
  }
  return transformPromise;
}

export async function compileTypeScript(code: string): Promise<CompileResult> {
  const transform = await loadSucrase();
  try {
    const out = transform(code, { transforms: ['typescript'], disableESTransforms: true });
    return { ok: true, code: out.code };
  } catch (e) {
    const err = e as { message?: unknown; loc?: { line?: unknown; column?: unknown } };
    const raw = typeof err.message === 'string' ? err.message : String(e);
    const line = err.loc && typeof err.loc.line === 'number' ? err.loc.line : null;
    const column = err.loc && typeof err.loc.column === 'number' ? err.loc.column : null;
    return { ok: false, message: raw.replace(/\s*\(\d+:\d+\)\s*$/, ''), line, column };
  }
}

export function describeCompileError(r: Extract<CompileResult, { ok: false }>): string {
  const where = r.line !== null ? ' (line ' + r.line + (r.column !== null ? ':' + r.column : '') + ')' : '';
  return 'TypeScript syntax error: ' + r.message + where;
}
