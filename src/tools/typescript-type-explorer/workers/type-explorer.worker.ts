// Type-checks the user's code with the TypeScript compiler, off the main thread. The compiler (~9 MB) and
// its lib files load only here, on the first request. Code is never emitted or run, and nothing is fetched
// besides this worker's own same-origin chunks. The page terminates the worker if a check runs too long.

import es5 from 'typescript/lib/lib.es5.d.ts?raw';
import decorators from 'typescript/lib/lib.decorators.d.ts?raw';
import decoratorsLegacy from 'typescript/lib/lib.decorators.legacy.d.ts?raw';
import es2015 from 'typescript/lib/lib.es2015.d.ts?raw';
import es2015Core from 'typescript/lib/lib.es2015.core.d.ts?raw';
import es2015Collection from 'typescript/lib/lib.es2015.collection.d.ts?raw';
import es2015Generator from 'typescript/lib/lib.es2015.generator.d.ts?raw';
import es2015Iterable from 'typescript/lib/lib.es2015.iterable.d.ts?raw';
import es2015Promise from 'typescript/lib/lib.es2015.promise.d.ts?raw';
import es2015Proxy from 'typescript/lib/lib.es2015.proxy.d.ts?raw';
import es2015Reflect from 'typescript/lib/lib.es2015.reflect.d.ts?raw';
import es2015Symbol from 'typescript/lib/lib.es2015.symbol.d.ts?raw';
import es2015SymbolWellknown from 'typescript/lib/lib.es2015.symbol.wellknown.d.ts?raw';
import { createTypeAnalyzer, type Analysis } from '../features/typescript-type-explorer';
import type { TypeCheckRequest, TypeCheckResponse } from './type-explorer.protocol';

interface WorkerScope {
  postMessage(message: TypeCheckResponse): void;
  onmessage: ((event: MessageEvent<TypeCheckRequest>) => void) | null;
}

const ctx = self as unknown as WorkerScope;

// Keys must match LIB_FILE_NAMES; the unit tests check that list covers the whole reference chain.
const LIB_FILES = {
  'lib.es5.d.ts': es5,
  'lib.decorators.d.ts': decorators,
  'lib.decorators.legacy.d.ts': decoratorsLegacy,
  'lib.es2015.d.ts': es2015,
  'lib.es2015.core.d.ts': es2015Core,
  'lib.es2015.collection.d.ts': es2015Collection,
  'lib.es2015.generator.d.ts': es2015Generator,
  'lib.es2015.iterable.d.ts': es2015Iterable,
  'lib.es2015.promise.d.ts': es2015Promise,
  'lib.es2015.proxy.d.ts': es2015Proxy,
  'lib.es2015.reflect.d.ts': es2015Reflect,
  'lib.es2015.symbol.d.ts': es2015Symbol,
  'lib.es2015.symbol.wellknown.d.ts': es2015SymbolWellknown,
};

let analyzer: Promise<{ analyze: (code: string) => Analysis; version: string }> | undefined;

const loadAnalyzer = () =>
  (analyzer ??= import('typescript').then((module) => {
    const ts = module.default;
    return { analyze: createTypeAnalyzer(ts, LIB_FILES), version: ts.version };
  }, (err: unknown) => {
    analyzer = undefined; // let the next request retry the chunk download
    throw err;
  }));

ctx.onmessage = (event: MessageEvent<TypeCheckRequest>) => {
  const { id, code } = event.data;
  loadAnalyzer()
    .then(({ analyze, version }) => ctx.postMessage({ id, ok: true, analysis: analyze(code), version }))
    .catch((err: unknown) => {
      ctx.postMessage({ id, ok: false, error: err instanceof RangeError ? err.message : 'The TypeScript compiler failed on this code.' });
    });
};
