import { describe, expect, it } from 'vitest';
import { EMPTY_FILTER, buildDependencyMap, filterMap, toMarkdown, toSummaryJson } from '../../../src/tools/openapi-dependency-mapper/features/dependency-map';
import { parseSpec, type JsonObject } from '../../../src/tools/openapi-designer/features/openapi';
import { sampleDocument } from '../../../src/tools/openapi-designer/features/sample';

const S = (name: string) => `#/components/schemas/${name}`;
const names = (map: ReturnType<typeof buildDependencyMap>, keys: string[]) => keys.map((k) => map.components.find((c) => c.key === k)!.name).sort();

describe('buildDependencyMap', () => {
  const map = buildDependencyMap(sampleDocument());
  const op = (key: string) => map.operations.find((o) => o.key === key)!;

  it('extracts operations with ids, tags and parameters', () => {
    expect(map.operations.map((o) => o.key)).toEqual(['GET /pets', 'POST /pets', 'GET /pets/{petId}', 'POST /orders']);
    expect(op('GET /pets')).toMatchObject({ operationId: 'listPets', tags: ['pets'], parameters: [{ name: 'limit', in: 'query', required: false }] });
    expect(map.tags).toEqual(['pets', 'orders']);
  });

  it('separates request and response refs and resolves nested refs transitively', () => {
    const post = op('POST /pets');
    expect(post.requestRefs).toEqual([S('NewPet')]);
    expect(post.responseRefs).toEqual([
      { status: '201', refs: [S('Pet')] },
      { status: 'default', refs: [S('Error')] },
    ]);
    expect(names(map, post.allRefs)).toEqual(['Category', 'Error', 'NewPet', 'Pet']);
    expect(names(map, op('POST /orders').allRefs)).toEqual(['Category', 'Error', 'NewPet', 'Order', 'Pet']);
  });

  it('records shared schemas with every operation that uses them', () => {
    const error = map.components.find((c) => c.name === 'Error')!;
    expect(error.usedBy).toEqual(['GET /pets', 'POST /pets', 'GET /pets/{petId}', 'POST /orders']);
    const pet = map.components.find((c) => c.name === 'Pet')!;
    expect(pet.refs).toEqual([S('NewPet')]);
    expect(pet.referencedBy).toEqual([S('Order')]);
  });

  it('marks cycles and terminates on them', () => {
    expect(map.components.filter((c) => c.cyclic).map((c) => c.name)).toEqual(['Category']);
    const mutual = buildDependencyMap({
      openapi: '3.1.0',
      paths: { '/a': { get: { responses: { '200': { description: 'x', content: { 'application/json': { schema: { $ref: S('A') } } } } } } } },
      components: { schemas: { A: { properties: { b: { $ref: S('B') } } }, B: { items: { $ref: S('A') } } } },
    });
    expect(mutual.components.map((c) => [c.name, c.cyclic])).toEqual([
      ['A', true],
      ['B', true],
    ]);
    expect(names(mutual, mutual.operations[0].allRefs)).toEqual(['A', 'B']);
  });

  it('reports missing and remote refs once each, without fetching', () => {
    const doc: JsonObject = {
      openapi: '3.1.0',
      paths: {
        '/a': {
          post: {
            requestBody: { content: { 'application/json': { schema: { $ref: S('Missing') } } } },
            responses: { '200': { $ref: 'https://example.com/r.yaml#/Ok' } },
          },
        },
      },
      components: { schemas: { Deep: { $ref: S('AlsoMissing') } } },
    };
    const m = buildDependencyMap(doc);
    expect(m.unresolved).toEqual([
      { ref: S('Missing'), at: '#/paths/~1a/post/requestBody/content/application~1json/schema' },
      { ref: S('AlsoMissing'), at: S('Deep') },
    ]);
    expect(m.remote).toEqual([{ ref: 'https://example.com/r.yaml#/Ok', at: '#/paths/~1a/post/responses/200' }]);
  });

  it('follows refs through components.parameters and path-level parameters', () => {
    const doc: JsonObject = {
      openapi: '3.1.0',
      paths: { '/items/{id}': { parameters: [{ $ref: '#/components/parameters/Id' }], get: { responses: {} } } },
      components: { parameters: { Id: { name: 'id', in: 'path', required: true, schema: { $ref: S('Id') } } }, schemas: { Id: { type: 'string' } } },
    };
    const m = buildDependencyMap(doc);
    expect(m.operations[0].parameters).toEqual([{ name: 'id', in: 'path', required: true }]);
    expect(m.operations[0].allRefs.sort()).toEqual(['#/components/parameters/Id', S('Id')]);
  });

  it('lists unused components and constructs it does not map', () => {
    const m = buildDependencyMap({ openapi: '3.1.0', webhooks: { ping: {} }, paths: { '/x': { $ref: '#/components/pathItems/X' } }, components: { schemas: { Orphan: {} } } });
    expect(m.components.map((c) => [c.name, c.usedBy])).toEqual([['Orphan', []]]);
    expect(m.unsupported).toEqual(['1 webhook (not mapped)', 'Path /x is a path-item $ref (not followed)']);
  });

  it('works on documents parsed from YAML', async () => {
    const r = await parseSpec('openapi: 3.0.3\ninfo: {title: T, version: "1"}\npaths:\n  /a:\n    get:\n      responses:\n        "200":\n          description: ok\n          content:\n            application/json:\n              schema: {$ref: "#/components/schemas/A"}\ncomponents:\n  schemas:\n    A: {type: object}\n');
    if (!r.ok) throw new Error(r.error.message);
    expect(buildDependencyMap(r.doc).operations[0].allRefs).toEqual([S('A')]);
  });

  it('rejects invalid input through the shared parser', async () => {
    expect((await parseSpec('not: [valid')).ok).toBe(false);
    expect((await parseSpec('{"swagger":"2.0"}')).ok).toBe(false);
  });
});

describe('filterMap', () => {
  const map = buildDependencyMap({ ...sampleDocument(), components: { schemas: { ...(sampleDocument().components as { schemas: JsonObject }).schemas, Unused: {} } } });
  const keys = (f: Partial<typeof EMPTY_FILTER>) => filterMap(map, { ...EMPTY_FILTER, ...f });

  it('shows unused components only when nothing narrows the view', () => {
    expect(keys({}).components.map((c) => c.name)).toContain('Unused');
    expect(keys({ tag: 'pets' }).components.map((c) => c.name)).not.toContain('Unused');
  });

  it('filters by tag, method, path and schema', () => {
    expect(keys({ tag: 'orders' }).operations.map((o) => o.key)).toEqual(['POST /orders']);
    expect(keys({ method: 'get' }).operations.map((o) => o.key)).toEqual(['GET /pets', 'GET /pets/{petId}']);
    expect(keys({ path: 'petid' }).operations.map((o) => o.key)).toEqual(['GET /pets/{petId}']);
    expect(keys({ path: 'placeOrder' }).operations.map((o) => o.key)).toEqual(['POST /orders']);
    expect(keys({ schema: 'order' }).operations.map((o) => o.key)).toEqual(['POST /orders']);
  });
});

describe('export', () => {
  const map = buildDependencyMap(sampleDocument());

  it('writes a Markdown summary with escaped names', () => {
    const md = toMarkdown(map, 'Pet *Store*');
    expect(md).toContain('# Pet \\*Store\\*: dependency map');
    expect(md).toContain('| POST /pets | createPet | pets | NewPet, Pet, Error | ');
    expect(md).toContain('| Category | schemas | Category | GET /pets, POST /pets, GET /pets/{petId}, POST /orders | yes |');
  });

  it('writes a JSON summary', () => {
    const json = JSON.parse(toSummaryJson(map));
    expect(json.operations[1]).toMatchObject({ method: 'post', path: '/pets', requestBody: ['NewPet'], responses: { '201': ['Pet'], default: ['Error'] } });
    expect(json.components.find((c: { name: string }) => c.name === 'Order')).toEqual({ name: 'Order', kind: 'schemas', references: ['Pet'], usedBy: ['POST /orders'], cyclic: false });
  });
});
