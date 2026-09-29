import { describe, expect, it } from 'vitest';
import { jsonToYaml, yamlToJson, type ConvertResult } from '../../../src/tools/yaml-json/features/convert';

const y2j = { indent: 2 as const, allDocuments: true };
const j2y = { indent: 2 as const, lineWidth: 80, quote: 'plain' as const };

function ok(r: ConvertResult) {
  if (!r.ok) throw new Error(r.error.message);
  return r;
}

describe('yamlToJson', () => {
  it('converts maps, lists and scalars', async () => {
    const r = ok(await yamlToJson('name: Zykit\ncount: 3\non: true\nnothing: ~\ntags: [a, b]\n', y2j));
    expect(JSON.parse(r.output)).toEqual({ name: 'Zykit', count: 3, on: true, nothing: null, tags: ['a', 'b'] });
    expect(r.warnings).toEqual([]);
  });

  it('resolves anchors, aliases and merge keys', async () => {
    const r = ok(await yamlToJson('base: &b {x: 1}\ncopy: *b\nmerged:\n  <<: *b\n  y: 2\n', y2j));
    expect(JSON.parse(r.output)).toEqual({ base: { x: 1 }, copy: { x: 1 }, merged: { x: 1, y: 2 } });
    expect(r.aliases).toBe(2);
  });

  it('turns several documents into an array, or keeps the first', async () => {
    const text = 'a: 1\n---\nb: 2\n';
    expect(JSON.parse(ok(await yamlToJson(text, y2j)).output)).toEqual([{ a: 1 }, { b: 2 }]);
    const first = ok(await yamlToJson(text, { ...y2j, allDocuments: false }));
    expect(JSON.parse(first.output)).toEqual({ a: 1 });
    expect(first.warnings[0]).toMatch(/2 documents/);
  });

  it('honours the JSON indent', async () => {
    expect(ok(await yamlToJson('a: [1]', { ...y2j, indent: 'min' })).output).toBe('{"a":[1]}');
    expect(ok(await yamlToJson('a: 1', { ...y2j, indent: 'tab' })).output).toBe('{\n\t"a": 1\n}');
  });

  it('reports errors with a line and column', async () => {
    const r = await yamlToJson('a: 1\nb: [1, 2\nc: 3\n', y2j);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.line).toBeGreaterThan(1);
    const dup = await yamlToJson('a: 1\na: 2\n', y2j);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error).toMatchObject({ line: 2, column: 1 });
  });

  it('warns about features JSON cannot represent', async () => {
    const r = ok(await yamlToJson('200: ok\ntrue: yes\n? [a, b]\n: complex\nv: !custom thing\nbig: .inf\n', y2j));
    const w = r.warnings.join('\n');
    expect(w).toMatch(/2 non-string keys/);
    expect(w).toMatch(/map or list key/);
    expect(w).toMatch(/!custom/);
    expect(w).toMatch(/\.inf/);
    expect(JSON.parse(r.output)).toMatchObject({ '200': 'ok', true: 'yes', v: 'thing', big: null });
  });

  it('refuses a billion-laughs document', async () => {
    const lol = [
      'a: &a ["lol","lol","lol","lol","lol","lol","lol","lol","lol"]',
      'b: &b [*a,*a,*a,*a,*a,*a,*a,*a,*a]',
      'c: &c [*b,*b,*b,*b,*b,*b,*b,*b,*b]',
      'd: &d [*c,*c,*c,*c,*c,*c,*c,*c,*c]',
      'e: &e [*d,*d,*d,*d,*d,*d,*d,*d,*d]',
      'f: &f [*e,*e,*e,*e,*e,*e,*e,*e,*e]',
    ].join('\n');
    const r = await yamlToJson(lol, y2j);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/billion laughs/);
  });

  it('treats empty input as null', async () => {
    expect(ok(await yamlToJson('', y2j)).output).toBe('null');
  });
});

describe('jsonToYaml', () => {
  it('converts JSON to YAML', async () => {
    expect(ok(await jsonToYaml('{"a":1,"b":["x",{"c":null}],"s":"yes"}', j2y)).output).toBe('a: 1\nb:\n  - x\n  - c: null\ns: "yes"\n');
  });
  it('applies indent and quote style', async () => {
    expect(ok(await jsonToYaml('{"a":{"b":"x"}}', { ...j2y, indent: 4 })).output).toBe('a:\n    b: x\n');
    expect(ok(await jsonToYaml('{"a":"x"}', { ...j2y, quote: 'single' })).output).toBe("a: 'x'\n");
    expect(ok(await jsonToYaml('{"a":"x"}', { ...j2y, quote: 'double' })).output).toBe('a: "x"\n');
  });
  it('folds long strings only when a line width is set', async () => {
    const long = JSON.stringify({ t: 'word '.repeat(40).trim() });
    expect(ok(await jsonToYaml(long, j2y)).output.split('\n').length).toBeGreaterThan(2);
    expect(ok(await jsonToYaml(long, { ...j2y, lineWidth: 0 })).output.split('\n').length).toBe(2);
  });
  it('reports JSON errors with a position', async () => {
    const r = await jsonToYaml('{\n  "a": 1,\n}', j2y);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.line).toBe(3);
  });
  it('round-trips', async () => {
    const data = { name: 'x', list: [1, 2.5, true, null, 'multi\nline', '#not comment', '123'], nested: { 'key with: colon': [] } };
    const yaml = ok(await jsonToYaml(JSON.stringify(data), j2y)).output;
    expect(JSON.parse(ok(await yamlToJson(yaml, y2j)).output)).toEqual(data);
  });
});
