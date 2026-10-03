// docker run ↔ Compose. The `yaml` package is loaded on first use so it ships as its own chunk.

import { composeToRun, DEFAULT_RUN_OPTIONS, type ComposeToRunOptions } from './compose';
import { dockerRunToCompose, Quoted, type ComposeDoc } from './run';

export { composeToRun, DEFAULT_RUN_OPTIONS, dockerRunToCompose, type ComposeToRunOptions };

export type Direction = 'run-to-compose' | 'compose-to-run';

export interface Conversion {
  output: string;
  warnings: string[];
  notes: string[];
  /** Services in the result. */
  services: number;
  error?: string;
}

/** Looks at the first line: docker/podman/sudo commands are `docker run`, anything else is treated as YAML. */
export function detectDirection(input: string): Direction {
  return /^\s*(?:\$\s*)?(?:sudo\s+)?(?:docker|podman)\s/i.test(input) ? 'run-to-compose' : 'compose-to-run';
}

export async function composeYaml(doc: ComposeDoc): Promise<string> {
  const Y = await import('yaml');
  const materialize = (v: unknown): unknown => {
    if (v instanceof Quoted) {
      const s = new Y.Scalar(v.value);
      s.type = 'QUOTE_DOUBLE';
      return s;
    }
    if (Array.isArray(v)) return v.map(materialize);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, materialize(x)]));
    return v;
  };
  return new Y.Document(materialize(doc)).toString({ nullStr: '', lineWidth: 0 });
}

export async function convert(input: string, direction: Direction, runOptions: ComposeToRunOptions = DEFAULT_RUN_OPTIONS): Promise<Conversion> {
  if (direction === 'compose-to-run') {
    const r = await composeToRun(input, runOptions);
    return { output: r.commands, warnings: r.warnings, notes: r.notes, services: r.services, error: r.error };
  }
  const r = dockerRunToCompose(input);
  return {
    output: r.doc ? await composeYaml(r.doc) : '',
    warnings: r.warnings,
    notes: r.notes,
    services: r.doc ? Object.keys(r.doc.services).length : 0,
    error: r.error,
  };
}
