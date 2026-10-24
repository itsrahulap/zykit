import { describe, expect, it } from 'vitest';
import {
  MAX_DEPTH,
  MAX_SPEC_CHARS,
  collectRefs,
  findUnsupported,
  newDocument,
  parseSpec,
  resolveRef,
  toJsonText,
  toYamlText,
  validateSpec,
  type JsonObject,
} from '../../../src/tools/openapi-designer/features/openapi';
import { sampleDocument } from '../../../src/tools/openapi-designer/features/sample';

const parseOk = async (text: string) => {
  const r = await parseSpec(text);
  if (!r.ok) throw new Error(r.error.message);
  return r;
};
const errors = (doc: JsonObject) => validateSpec(doc).filter((i) => i.level === 'error').map((i) => i.message);

describe('parseSpec', () => {
  it('reads JSON and YAML into the same document', async () => {
    const json = await parseOk('{"openapi":"3.1.0","info":{"title":"T","version":"1"},"paths":{}}');
    const yaml = await parseOk('openapi: 3.1.0\ninfo:\n  title: T\n  version: "1"\npaths: {}\n');
    expect(json.format).toBe('json');
    expect(yaml.format).toBe('yaml');
    expect(yaml.doc).toEqual(json.doc);
  });

  it('locates JSON syntax errors', async () => {
    const r = await parseSpec('{\n  "openapi": "3.1.0",\n  "info": }');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.line).toBe(3);
  });

  it.each([
    ['[1, 2]', /top level must be an object/],
    ['{"swagger":"2.0"}', /Swagger 2\.0/],
    ['{"openapi":"4.0.0"}', /3\.0 or 3\.1/],
    ['info: {}', /"openapi" field/],
    ['   ', /empty/],
  ])('rejects %s', async (text, message) => {
    const r = await parseSpec(text);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(message);
  });

  it('refuses oversized and over-deep input', async () => {
    const big = await parseSpec(`{"openapi":"3.1.0","x":"${'a'.repeat(MAX_SPEC_CHARS)}"}`);
    expect(big.ok).toBe(false);
    const deep = `{"openapi":"3.1.0","x":${'['.repeat(MAX_DEPTH + 5)}${']'.repeat(MAX_DEPTH + 5)}}`;
    const r = await parseSpec(deep);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/nested deeper/);
  });

  it('stops YAML alias bombs', async () => {
    const lines = ['openapi: 3.1.0', 'a: &a [x, x, x, x, x, x, x, x, x]'];
    for (let i = 1; i < 9; i++) lines.push(`${'b'.repeat(i)}: &${'b'.repeat(i)} [${Array(9).fill(i === 1 ? '*a' : `*${'b'.repeat(i - 1)}`).join(', ')}]`);
    const r = await parseSpec(lines.join('\n'));
    expect(r.ok).toBe(false);
  });
});

describe('serialization', () => {
  it('round-trips the sample through JSON and YAML without loss', async () => {
    const doc = sampleDocument();
    expect((await parseOk(toJsonText(doc))).doc).toEqual(doc);
    const yaml = await toYamlText(doc);
    expect(yaml).toContain('openapi: 3.1.0');
    expect((await parseOk(yaml)).doc).toEqual(doc);
  });

  it('keeps fields the forms do not know about', async () => {
    const doc = { ...newDocument(), webhooks: { ping: { post: {} } }, 'x-owner': 'team-a', components: { securitySchemes: { key: { type: 'apiKey' } } } };
    expect((await parseOk(await toYamlText(doc))).doc).toEqual(doc);
    expect(findUnsupported(doc)).toEqual(['Top-level "webhooks"', 'components.securitySchemes', '1 x- extension field']);
  });

  it('quotes YAML strings that would otherwise change type', async () => {
    const doc = { ...newDocument(), info: { title: 'yes', version: '1.0' } };
    expect((await parseOk(await toYamlText(doc))).doc).toEqual(doc);
  });
});

describe('refs', () => {
  it('resolves local JSON Pointers with escapes and ignores remote ones', () => {
    const doc = { paths: { '/a/{id}': { get: 1 } }, components: { schemas: { 'A~B': 2 } }, list: [3] };
    expect(resolveRef(doc, '#/paths/~1a~1%7Bid%7D/get')).toBe(1);
    expect(resolveRef(doc, '#/components/schemas/A~0B')).toBe(2);
    expect(resolveRef(doc, '#/list/0')).toBe(3);
    expect(resolveRef(doc, '#/components/schemas/missing')).toBeUndefined();
    expect(resolveRef(doc, '#/components/constructor')).toBeUndefined();
    expect(resolveRef(doc, 'https://example.com/s.json#/x')).toBeUndefined();
  });

  it('collects every $ref with where it appears', () => {
    expect(collectRefs({ a: { $ref: '#/x' }, b: [{ $ref: '#/y' }] })).toEqual([
      { ref: '#/x', at: '#/a' },
      { ref: '#/y', at: '#/b/0' },
    ]);
  });
});

describe('validateSpec', () => {
  it('accepts the sample', () => {
    expect(validateSpec(sampleDocument())).toEqual([]);
  });

  it('requires info.title and info.version', () => {
    expect(errors({ openapi: '3.1.0', info: { title: ' ' } })).toEqual(['info.title is required.', 'info.version is required.']);
  });

  it('checks path parameters against the template', () => {
    const doc = {
      ...newDocument(),
      paths: { '/pets/{id}': { get: { parameters: [{ name: 'other', in: 'path', schema: { type: 'string' } }], responses: { '200': { description: 'ok' } } } } },
    };
    expect(errors(doc)).toEqual([
      'GET /pets/{id}: path parameter "other" must be required.',
      'GET /pets/{id}: path parameter "other" isn’t in the path.',
      'GET /pets/{id}: path parameter "id" isn’t declared.',
    ]);
  });

  it('flags responses without a description, bad status codes and duplicate operationIds', () => {
    const op = (id: string) => ({ operationId: id, responses: { '200': {}, abc: { description: 'x' } } });
    const doc = { ...newDocument(), paths: { '/a': { get: op('same') }, '/b': { get: op('same') } } };
    const list = errors(doc);
    expect(list).toContain('GET /a: response 200 needs a description.');
    expect(list).toContain('GET /a: "abc" isn’t a status code.');
    expect(list).toContain('operationId "same" is used by both GET /a and GET /b.');
  });

  it('requires responses in 3.0 but only warns in 3.1', () => {
    const doc = (openapi: string) => ({ openapi, info: { title: 'T', version: '1' }, paths: { '/a': { get: {} } } });
    expect(errors(doc('3.0.3'))).toEqual(['GET /a: responses are required in OpenAPI 3.0.']);
    expect(validateSpec(doc('3.1.0'))).toEqual([{ level: 'warning', at: '#/paths/~1a/get/responses', message: 'GET /a has no responses.' }]);
  });

  it('reports unresolved refs as errors and remote refs as warnings', () => {
    const doc = { ...newDocument(), components: { schemas: { A: { $ref: '#/components/schemas/Missing' }, B: { $ref: 'https://example.com/b.json' } } } };
    expect(validateSpec(doc)).toEqual([
      { level: 'error', at: '#/components/schemas/A', message: '$ref "#/components/schemas/Missing" doesn’t resolve.' },
      { level: 'warning', at: '#/components/schemas/B', message: 'External $ref "https://example.com/b.json" is kept but never fetched.' },
    ]);
  });
});
