import { describe, expect, it } from 'vitest';
import {
  exportProject,
  fixtureFiles,
  importProject,
  jsonServerDb,
  openApiDocument,
  openApiPath,
  pathError,
  pathParams,
  SAMPLES,
  validateProject,
  type Endpoint,
  type Project,
} from '../../../src/tools/mock-api-generator/features/mock-api-generator';

const ep = (over: Partial<Endpoint>): Endpoint => ({ id: Math.random().toString(36), method: 'GET', path: '/x', status: 200, description: '', body: '{}', ...over });
const project = (...endpoints: Endpoint[]): Project => ({ name: 'Test', endpoints });

describe('paths', () => {
  it('accepts plain and parameterised paths', () => {
    for (const p of ['/', '/users', '/users/:id', '/users/{id}/posts/:postId', '/v1.2/a_b-c~d']) expect(pathError(p), p).toBeNull();
  });
  it('rejects malformed paths', () => {
    for (const p of ['users', '/users/', '//a', '/a b', '/a?q=1', '/:1x', '/{id', '/:id/:id']) expect(pathError(p), p).not.toBeNull();
  });
  it('reads parameters and converts to OpenAPI style', () => {
    expect(pathParams('/users/:id/posts/{postId}')).toEqual(['id', 'postId']);
    expect(openApiPath('/users/:id/posts/{postId}')).toBe('/users/{id}/posts/{postId}');
  });
});

describe('validateProject', () => {
  it('passes every sample', () => {
    for (const s of Object.values(SAMPLES)) expect(validateProject(s()).size).toBe(0);
  });
  it('flags bad JSON with a position, bad status and duplicate routes', () => {
    const a = ep({ path: '/users/:id' });
    const b = ep({ path: '/users/{userId}' });
    const c = ep({ method: 'POST', path: '/users/:id' });
    const bad = ep({ path: '/bad', body: '{"a":}', status: 99 });
    const p = validateProject(project(a, b, c, bad));
    expect(p.has(a.id)).toBe(false);
    expect(p.get(b.id)?.duplicate).toMatch(/Same route/);
    expect(p.has(c.id)).toBe(false);
    expect(p.get(bad.id)?.status).toBeTruthy();
    expect(p.get(bad.id)?.body).toMatchObject({ line: 1 });
  });
  it('allows an empty body', () => {
    expect(validateProject(project(ep({ method: 'DELETE', status: 204, body: '' }))).size).toBe(0);
  });
});

describe('exports', () => {
  const users = SAMPLES.users();

  it('writes one fixture per endpoint with unique, readable names', () => {
    const files = fixtureFiles(users);
    expect(files.map((f) => f.name)).toEqual(['get_users_200.json', 'get_users_id_200.json', 'post_users_201.json', 'delete_users_id_204.json', 'get_users_id_missing_404.json']);
    expect(JSON.parse(files[0].text)).toHaveLength(2);
    expect(files[3].text).toBe('null\n');
  });

  it('builds a json-server db.json from collection endpoints only', () => {
    const db = jsonServerDb(users);
    expect(db.collections).toEqual(['users']);
    expect(JSON.parse(db.text).users[0].email).toBe('ada@example.com');
    expect(db.skipped).toBe(4);
  });

  it('builds a structurally valid OpenAPI 3.1 document', () => {
    const doc = openApiDocument(users) as { openapi: string; info: { title: string }; paths: Record<string, Record<string, unknown>> };
    expect(doc.openapi).toBe('3.1.0');
    expect(doc.info.title).toBe('Users API');
    expect(Object.keys(doc.paths)).toEqual(['/users', '/users/{id}', '/users/{id}/missing']);
    const item = doc.paths['/users/{id}'] as { parameters: unknown[]; get: { responses: Record<string, { content?: unknown }> }; delete: { responses: Record<string, { content?: unknown }> } };
    expect(item.parameters).toEqual([{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]);
    expect(item.get.responses['200'].content).toEqual({ 'application/json': { example: users.endpoints[1].body && JSON.parse(users.endpoints[1].body) } });
    expect(item.delete.responses['204'].content).toBeUndefined();
    // Every templated path declares each of its parameters.
    for (const [path, ops] of Object.entries(doc.paths)) {
      const names = [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      const declared = ((ops.parameters as { name: string }[]) ?? []).map((p) => p.name);
      expect(declared, path).toEqual(names);
    }
  });
});

describe('project files', () => {
  it('round-trips through export and import', () => {
    const p = SAMPLES.tasks();
    const back = importProject(exportProject(p));
    expect(back.name).toBe(p.name);
    expect(back.endpoints.map(({ id: _id, ...rest }) => rest)).toEqual(p.endpoints.map(({ id: _id, ...rest }) => rest));
  });
  it('rejects files that aren’t project files or have bad endpoints', () => {
    expect(() => importProject('nope')).toThrow(/Not valid JSON/);
    expect(() => importProject('{"format":"other"}')).toThrow(/isn’t a Mock API/);
    expect(() => importProject('{"format":"zykit-mock-api","version":2,"endpoints":[]}')).toThrow(/version/);
    expect(() => importProject('{"format":"zykit-mock-api","version":1,"endpoints":[{"method":"TRACE","path":"/","status":200}]}')).toThrow(/Endpoint 1/);
    expect(() => importProject(`{"format":"zykit-mock-api","version":1,"endpoints":${JSON.stringify(Array(501).fill({ method: 'GET', path: '/', status: 200 }))}}`)).toThrow(/At most/);
  });
});
