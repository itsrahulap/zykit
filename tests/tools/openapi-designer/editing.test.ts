import { describe, expect, it } from 'vitest';
import { choiceToSchema, normalizePath, produce, schemaChoices, schemaToChoice } from '../../../src/tools/openapi-designer/features/editing';
import { exampleCurl, exampleFromSchema, exampleResponses } from '../../../src/tools/openapi-designer/features/examples';
import { sampleDocument } from '../../../src/tools/openapi-designer/features/sample';
import { asObject, type JsonObject } from '../../../src/tools/openapi-designer/features/openapi';

describe('schema picker', () => {
  it.each(['string', 'integer', 'object', 'ref:Pet', 'array:string', 'array:ref:Pet'])('round-trips %s', (choice) => {
    expect(schemaToChoice(choiceToSchema(choice))).toBe(choice);
  });

  it('treats richer schemas as custom and missing ones as none', () => {
    expect(schemaToChoice({ type: 'string', format: 'uuid' })).toBe('custom');
    expect(schemaToChoice({ $ref: '#/components/responses/X' })).toBe('custom');
    expect(schemaToChoice(undefined)).toBe('none');
    expect(choiceToSchema('none')).toBeUndefined();
  });

  it('offers the current choice even when it is not in the list', () => {
    expect(schemaChoices([], 'custom', false)[0]).toEqual({ value: 'custom', label: 'Custom (kept as imported)' });
    expect(schemaChoices([], 'ref:Gone', false)[0]).toEqual({ value: 'ref:Gone', label: '$ref Gone' });
  });
});

describe('editing helpers', () => {
  it('produce leaves the original untouched', () => {
    const doc: JsonObject = { info: { title: 'A' } };
    const next = produce(doc, (d) => {
      asObject(d.info).title = 'B';
    });
    expect(doc).toEqual({ info: { title: 'A' } });
    expect(next).toEqual({ info: { title: 'B' } });
  });

  it.each([
    ['pets', '/pets'],
    ['/pets/ ', '/pets'],
    ['/pets/{id}/', '/pets/{id}'],
    ['/', '/'],
    ['  ', ''],
  ])('normalizes path %j', (raw, expected) => {
    expect(normalizePath(raw)).toBe(expected);
  });
});

describe('examples', () => {
  const doc = sampleDocument();

  it('builds examples from refs, allOf, formats and examples', () => {
    expect(exampleFromSchema({ $ref: '#/components/schemas/Pet' }, doc)).toEqual({
      name: 'Rex',
      tag: 'string',
      category: { name: 'Dogs', parent: null },
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    });
  });

  it('terminates on self-referencing schemas', () => {
    const cyclic = { components: { schemas: { Node: { type: 'object', properties: { next: { $ref: '#/components/schemas/Node' } } } } } };
    expect(exampleFromSchema({ $ref: '#/components/schemas/Node' }, cyclic)).toEqual({ next: null });
  });

  it('writes a curl command with parameters and a body', () => {
    const paths = asObject(doc.paths);
    const curl = exampleCurl(doc, '/pets', 'post', asObject(paths['/pets']), asObject(asObject(paths['/pets']).post));
    expect(curl).toContain("curl -X POST 'https://api.example.com/v1/pets'");
    expect(curl).toContain("-H 'Content-Type: application/json'");
    expect(curl).toContain('"name": "Rex"');
    const get = exampleCurl(doc, '/pets/{petId}', 'get', asObject(paths['/pets/{petId}']), asObject(asObject(paths['/pets/{petId}']).get));
    expect(get).toBe("curl -X GET 'https://api.example.com/v1/pets/3fa85f64-5717-4562-b3fc-2c963f66afa6'");
  });

  it('shell-quotes single quotes in values', () => {
    const d = { servers: [{ url: "https://x.test/it's" }], paths: {} };
    expect(exampleCurl(d, '/a', 'get', {}, {})).toBe("curl -X GET 'https://x.test/it'\\''s/a'");
  });

  it('lists responses with example bodies', () => {
    const op = asObject(asObject(asObject(doc.paths)['/pets/{petId}']).get);
    const [ok, missing] = exampleResponses(doc, op);
    expect(ok.status).toBe('200');
    expect(JSON.parse(ok.body!)).toHaveProperty('name', 'Rex');
    expect(missing).toMatchObject({ status: '404', description: 'Unexpected error', contentType: 'application/json' });
  });
});
