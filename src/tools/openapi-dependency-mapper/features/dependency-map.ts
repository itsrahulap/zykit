// Builds the operation → component dependency map of an OpenAPI 3.x document. Parsing, $ref
// resolution and the unsupported-construct list come from the OpenAPI Designer's feature modules.

import {
  asObject,
  collectRefs,
  isLocalRef,
  isObject,
  pointerSegment,
  resolveRef,
  type HttpMethod,
  type JsonObject,
} from '../../openapi-designer/features/openapi';
import { listOperations } from '../../openapi-designer/features/editing';
import { deref } from '../../openapi-designer/features/examples';

/** Above these counts the rest is dropped (and reported), so a huge spec can't freeze the page. */
export const MAX_OPERATIONS = 2000;
export const MAX_COMPONENTS = 3000;

export interface ParameterInfo {
  name: string;
  in: string;
  required: boolean;
}

export interface OperationNode {
  /** "GET /pets": unique per document. */
  key: string;
  method: HttpMethod;
  path: string;
  operationId?: string;
  summary?: string;
  tags: string[];
  parameters: ParameterInfo[];
  /** Components referenced from the request body. */
  requestRefs: string[];
  /** Components referenced from each response, by status. */
  responseRefs: { status: string; refs: string[] }[];
  /** Components the operation references itself. */
  directRefs: string[];
  /** Everything reachable from directRefs. */
  allRefs: string[];
}

export interface ComponentNode {
  /** The local ref, e.g. "#/components/schemas/Pet". */
  key: string;
  name: string;
  /** "schemas", "parameters", "responses", … or "other" for refs outside components. */
  section: string;
  refs: string[];
  referencedBy: string[];
  usedBy: string[];
  /** Part of a reference cycle (e.g. a tree node pointing at itself). */
  cyclic: boolean;
}

export interface BrokenRef {
  ref: string;
  /** JSON Pointer where it appears. */
  at: string;
}

export interface DependencyMap {
  operations: OperationNode[];
  components: ComponentNode[];
  tags: string[];
  unresolved: BrokenRef[];
  remote: BrokenRef[];
  unsupported: string[];
  notices: string[];
}

function componentIdentity(ref: string): { name: string; section: string } {
  const parts = ref.slice(2).split('/');
  if (parts[0] === 'components' && parts.length === 3) return { section: parts[1], name: parts[2].replace(/~1/g, '/').replace(/~0/g, '~') };
  return { section: 'other', name: ref };
}

/** Parts of a document the map doesn't follow. */
function unmapped(doc: JsonObject): string[] {
  const out: string[] = [];
  const webhooks = Object.keys(asObject(doc.webhooks)).length;
  if (webhooks) out.push(`${webhooks} webhook${webhooks === 1 ? '' : 's'} (not mapped)`);
  for (const [path, item] of Object.entries(asObject(doc.paths)))
    if (isObject(item) && typeof item.$ref === 'string') out.push(`Path ${path} is a path-item $ref (not followed)`);
  return out;
}

export function buildDependencyMap(doc: JsonObject): DependencyMap {
  const notices: string[] = [];
  const unresolved: BrokenRef[] = [];
  const remote: BrokenRef[] = [];
  const components = new Map<string, ComponentNode>();
  const queue: string[] = [];

  // Records a component node for a resolvable local ref and returns its key, or null for a broken/remote one.
  const visitRef = ({ ref, at }: { ref: string; at: string }): string | null => {
    if (!isLocalRef(ref)) {
      remote.push({ ref, at });
      return null;
    }
    if (components.has(ref)) return ref;
    if (resolveRef(doc, ref) === undefined) {
      unresolved.push({ ref, at });
      return null;
    }
    if (components.size >= MAX_COMPONENTS) return null;
    components.set(ref, { key: ref, ...componentIdentity(ref), refs: [], referencedBy: [], usedBy: [], cyclic: false });
    queue.push(ref);
    return ref;
  };
  const refsIn = (value: unknown, at: string) => [...new Set(collectRefs(value, at).map(visitRef).filter((k): k is string => k !== null))];

  // Every declared component is a node, so unused ones show up too.
  for (const [section, entries] of Object.entries(asObject(asObject(doc.components))))
    for (const name of Object.keys(asObject(entries))) visitRef({ ref: `#/components/${pointerSegment(section)}/${pointerSegment(name)}`, at: '#/components' });

  const all = listOperations(doc);
  if (all.length > MAX_OPERATIONS) notices.push(`Only the first ${MAX_OPERATIONS} of ${all.length} operations are mapped.`);
  const operations: OperationNode[] = all.slice(0, MAX_OPERATIONS).map(({ path, method, operation }) => {
    const item = asObject(asObject(doc.paths)[path]);
    const at = `#/paths/${pointerSegment(path)}`;
    const params = [...(Array.isArray(item.parameters) ? item.parameters : []), ...(Array.isArray(operation.parameters) ? operation.parameters : [])];
    const responseRefs = Object.entries(asObject(operation.responses)).map(([status, r]) => ({ status, refs: refsIn(r, `${at}/${method}/responses/${pointerSegment(status)}`) }));
    return {
      key: `${method.toUpperCase()} ${path}`,
      method,
      path,
      ...(typeof operation.operationId === 'string' ? { operationId: operation.operationId } : {}),
      ...(typeof operation.summary === 'string' ? { summary: operation.summary } : {}),
      tags: Array.isArray(operation.tags) ? operation.tags.filter((t): t is string => typeof t === 'string') : [],
      parameters: params.map((p) => {
        const param = deref(doc, p);
        return { name: String(param.name ?? '?'), in: String(param.in ?? '?'), required: param.required === true };
      }),
      requestRefs: refsIn(operation.requestBody, `${at}/${method}/requestBody`),
      responseRefs,
      // Path-level parameters count for every operation under the path.
      directRefs: [...new Set([...refsIn(item.parameters, `${at}/parameters`), ...refsIn(operation, `${at}/${method}`)])],
      allRefs: [],
    };
  });

  // Walk component bodies breadth-first; visitRef appends newly found refs to the queue.
  for (let i = 0; i < queue.length; i++) {
    const node = components.get(queue[i])!;
    node.refs = refsIn(resolveRef(doc, node.key), node.key);
  }
  if (components.size >= MAX_COMPONENTS) notices.push(`Only the first ${MAX_COMPONENTS} components are mapped.`);
  for (const node of components.values()) for (const target of node.refs) components.get(target)?.referencedBy.push(node.key);

  const reach = (start: string[]): Set<string> => {
    const seen = new Set<string>();
    const stack = [...start];
    while (stack.length) {
      const k = stack.pop()!;
      if (seen.has(k)) continue;
      seen.add(k);
      for (const next of components.get(k)?.refs ?? []) stack.push(next);
    }
    return seen;
  };
  for (const node of components.values()) node.cyclic = reach(node.refs).has(node.key);
  for (const op of operations) {
    op.allRefs = [...reach(op.directRefs)];
    for (const k of op.allRefs) components.get(k)?.usedBy.push(op.key);
  }

  const declaredTags = Array.isArray(doc.tags) ? doc.tags.map((t) => asObject(t).name).filter((t): t is string => typeof t === 'string') : [];
  const tags = [...new Set([...declaredTags, ...operations.flatMap((o) => o.tags)])];
  // The same ref is seen again when a body is walked for both its own list and the operation's.
  const unique = (refs: BrokenRef[]) => [...new Map(refs.map((r) => [`${r.ref} ${r.at}`, r])).values()];
  return { operations, components: [...components.values()], tags, unresolved: unique(unresolved), remote: unique(remote), unsupported: unmapped(doc), notices };
}

// ---------- filtering ----------

export interface MapFilter {
  tag: string;
  method: string;
  path: string;
  schema: string;
}

export const EMPTY_FILTER: MapFilter = { tag: '', method: '', path: '', schema: '' };

/** Operations matching the filter, and the components they use (plus unused ones when nothing narrows it). */
export function filterMap(map: DependencyMap, filter: MapFilter): { operations: OperationNode[]; components: ComponentNode[] } {
  const path = filter.path.trim().toLowerCase();
  const schema = filter.schema.trim().toLowerCase();
  const byKey = new Map(map.components.map((c) => [c.key, c]));
  const schemaMatch = (c: ComponentNode | undefined) => !!c && c.name.toLowerCase().includes(schema);
  const operations = map.operations.filter(
    (o) =>
      (!filter.tag || o.tags.includes(filter.tag)) &&
      (!filter.method || o.method === filter.method) &&
      (!path || o.path.toLowerCase().includes(path) || (o.operationId ?? '').toLowerCase().includes(path)) &&
      (!schema || o.allRefs.some((k) => schemaMatch(byKey.get(k)))),
  );
  const narrowed = !!(filter.tag || filter.method || path);
  const used = new Set(operations.flatMap((o) => o.allRefs));
  const components = map.components.filter((c) => (used.has(c.key) || (!narrowed && c.usedBy.length === 0)) && (!schema || schemaMatch(c) || used.has(c.key)));
  return { operations, components };
}

// ---------- export ----------

const list = (items: string[]) => (items.length ? items.join(', ') : 'none');
const nameOf = (map: DependencyMap) => {
  const byKey = new Map(map.components.map((c) => [c.key, c.name]));
  return (k: string) => byKey.get(k) ?? k;
};
// Escapes Markdown table/inline syntax in untrusted names.
const md = (s: string) => s.replace(/[\\`*_[\]|<>]/g, '\\$&').replace(/\r?\n/g, ' ');

export function toMarkdown(map: DependencyMap, title = 'API'): string {
  const name = nameOf(map);
  const lines = [`# ${md(title)}: dependency map`, '', `${map.operations.length} operations, ${map.components.length} components.`, '', '## Operations', ''];
  lines.push('| Operation | operationId | Tags | Direct | All (transitive) |', '|---|---|---|---|---|');
  for (const o of map.operations)
    lines.push(`| ${md(o.key)} | ${md(o.operationId ?? '')} | ${md(o.tags.join(', '))} | ${md(list(o.directRefs.map(name)))} | ${md(list(o.allRefs.map(name)))} |`);
  lines.push('', '## Components', '', '| Component | Kind | References | Used by | Cycle |', '|---|---|---|---|---|');
  for (const c of map.components) lines.push(`| ${md(c.name)} | ${md(c.section)} | ${md(list(c.refs.map(name)))} | ${md(list(c.usedBy))} | ${c.cyclic ? 'yes' : ''} |`);
  const unused = map.components.filter((c) => c.usedBy.length === 0);
  if (unused.length) lines.push('', '## Unused components', '', ...unused.map((c) => `- ${md(c.name)}`));
  if (map.unresolved.length) lines.push('', '## Unresolved $refs', '', ...map.unresolved.map((r) => `- \`${r.ref.replace(/`/g, "'")}\` at \`${r.at.replace(/`/g, "'")}\``));
  if (map.remote.length) lines.push('', '## External $refs (not fetched)', '', ...map.remote.map((r) => `- \`${r.ref.replace(/`/g, "'")}\``));
  if (map.unsupported.length) lines.push('', '## Not mapped', '', ...map.unsupported.map((u) => `- ${md(u)}`));
  return `${lines.join('\n')}\n`;
}

export function toSummaryJson(map: DependencyMap): string {
  const name = nameOf(map);
  return JSON.stringify(
    {
      operations: map.operations.map((o) => ({
        method: o.method,
        path: o.path,
        operationId: o.operationId,
        tags: o.tags,
        parameters: o.parameters,
        requestBody: o.requestRefs.map(name),
        responses: Object.fromEntries(o.responseRefs.map((r) => [r.status, r.refs.map(name)])),
        uses: o.allRefs.map(name),
      })),
      components: map.components.map((c) => ({ name: c.name, kind: c.section, references: c.refs.map(name), usedBy: c.usedBy, cyclic: c.cyclic })),
      unresolvedRefs: map.unresolved,
      externalRefs: map.remote,
      unsupported: map.unsupported,
    },
    null,
    2,
  );
}

/** Kept here so the page needn't know about raw documents. */
export const documentTitle = (doc: JsonObject) => (isObject(doc.info) && typeof doc.info.title === 'string' ? doc.info.title : 'API');
