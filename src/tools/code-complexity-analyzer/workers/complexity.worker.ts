// Parses with the TypeScript compiler off the main thread. The compiler is imported here only, so
// it's a separate lazy chunk that never reaches the main bundle. Nothing here makes network requests
// beyond loading that same-origin chunk; the page terminates the worker if it runs too long.

import type * as TS from 'typescript';
import { analyze } from '../features/code-complexity-analyzer';
import type { ComplexityRequest, ComplexityResponse } from './complexity.protocol';

interface WorkerScope {
  postMessage(message: ComplexityResponse): void;
  onmessage: ((event: MessageEvent<ComplexityRequest>) => void) | null;
}

const ctx = self as unknown as WorkerScope;
let compiler: Promise<typeof TS> | undefined;
// typescript is CommonJS: depending on interop the API is on the namespace or on `default`.
const loadCompiler = () => (compiler ??= import('typescript').then((m) => ('createSourceFile' in m ? m : (m as { default: typeof TS }).default)));

ctx.onmessage = async (event: MessageEvent<ComplexityRequest>) => {
  const { id, code, language } = event.data;
  let ts: typeof TS;
  try {
    ts = await loadCompiler();
  } catch (err) {
    compiler = undefined; // let the next run retry the download
    ctx.postMessage({ id, type: 'error', error: `Couldn't load the TypeScript parser${err instanceof Error ? `: ${err.message}` : '.'}` });
    return;
  }
  try {
    ctx.postMessage({ id, type: 'started' });
    ctx.postMessage({ id, type: 'done', analysis: analyze(ts, code, language) });
  } catch (err) {
    ctx.postMessage({ id, type: 'error', error: err instanceof RangeError ? 'The code is nested too deeply to analyze.' : 'The analyzer failed on this input.' });
  }
};
