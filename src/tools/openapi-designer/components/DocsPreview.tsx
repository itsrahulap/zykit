// Per-endpoint documentation preview with an example curl request and example responses.
// Every value from the document is rendered as React text, never as HTML.

import { CodeBlock } from '../../../shared/ui/tool';
import { Badge } from '../../../shared/ui/ui';
import { listOperations } from '../features/editing';
import { deref, exampleCurl, exampleResponses } from '../features/examples';
import { asObject, type JsonObject } from '../features/openapi';

const MAX_ENDPOINTS = 100;

export function DocsPreview({ doc }: { doc: JsonObject }) {
  const info = asObject(doc.info);
  const operations = listOperations(doc);
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold break-words text-slate-900 dark:text-slate-100">
          {String(info.title ?? 'Untitled API')} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">v{String(info.version ?? '?')}</span>
        </h3>
        {typeof info.description === 'string' && <p className="mt-1 break-words text-slate-700 dark:text-slate-300">{info.description}</p>}
      </div>
      {operations.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-400">No endpoints yet. Add a path and an operation.</p>}
      {operations.length > MAX_ENDPOINTS && <p className="text-sm text-slate-600 dark:text-slate-400">Showing the first {MAX_ENDPOINTS} of {operations.length} endpoints.</p>}
      {operations.slice(0, MAX_ENDPOINTS).map(({ path, method, operation }) => {
        const item = asObject(asObject(doc.paths)[path]);
        const params = [...(Array.isArray(item.parameters) ? item.parameters : []), ...(Array.isArray(operation.parameters) ? operation.parameters : [])].map((p) => deref(doc, p));
        return (
          <details key={`${method} ${path}`} className="group min-w-0 rounded-2xl border border-slate-200 dark:border-slate-800">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3 pointer-coarse:min-h-11">
              <Badge tone={method === 'get' ? 'blue' : method === 'delete' ? 'red' : method === 'post' ? 'green' : 'amber'}>{method.toUpperCase()}</Badge>
              <span className="min-w-0 break-all font-mono text-sm text-slate-900 dark:text-slate-100">{path}</span>
              {typeof operation.summary === 'string' && <span className="min-w-0 break-words text-sm text-slate-600 dark:text-slate-400">{operation.summary}</span>}
            </summary>
            <div className="space-y-4 border-t border-slate-100 p-4 dark:border-slate-800">
              {typeof operation.description === 'string' && <p className="break-words text-sm text-slate-700 dark:text-slate-300">{operation.description}</p>}
              {params.length > 0 && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">Parameters</h4>
                  <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                    {params.map((p, i) => (
                      <li key={i} className="break-words">
                        <code className="font-mono">{String(p.name ?? '?')}</code> in {String(p.in ?? '?')}
                        {p.required === true ? ' (required)' : ''}
                        {typeof p.description === 'string' ? `: ${p.description}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h4 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">Example request</h4>
                <CodeBlock label={`Example request for ${method.toUpperCase()} ${path}`} className="whitespace-pre! break-normal!">
                  {exampleCurl(doc, path, method, item, operation)}
                </CodeBlock>
              </div>
              {exampleResponses(doc, operation).map((r) => (
                <div key={r.status}>
                  <h4 className="mb-1 text-sm font-semibold break-words text-slate-800 dark:text-slate-200">
                    Response {r.status}
                    {r.description ? `: ${r.description}` : ''}
                    {r.contentType ? ` (${r.contentType})` : ''}
                  </h4>
                  {r.body !== undefined && <CodeBlock label={`Example ${r.status} response for ${method.toUpperCase()} ${path}`}>{r.body}</CodeBlock>}
                </div>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
