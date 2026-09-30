// Runs JSONPath queries off the main thread; the page terminates this worker if a query takes too
// long (e.g. a backtracking regex in match()). Nothing in this worker performs network requests.

import { runQuery, type QueryResult } from '../features/jsonpath-query';

export interface JsonPathRequest {
  id: number;
  json: string;
  query: string;
}
export type JsonPathResponse = { id: number; result: QueryResult } | { id: number; crash: string };

interface WorkerScope {
  postMessage(message: JsonPathResponse): void;
  onmessage: ((event: MessageEvent<JsonPathRequest>) => void) | null;
}

const ctx = self as unknown as WorkerScope;

ctx.onmessage = (event: MessageEvent<JsonPathRequest>) => {
  const { id, json, query } = event.data;
  try {
    ctx.postMessage({ id, result: runQuery(json, query) });
  } catch (err) {
    ctx.postMessage({ id, crash: err instanceof Error ? err.message : 'The query failed.' });
  }
};
