import { describe, expect, it } from 'vitest';
import { formatXml, parseNamespaces } from '../../../src/tools/xml-formatter/features/xml-formatter';

const ok = (xml: string, o: Parameters<typeof formatXml>[1]) => {
  const r = formatXml(xml, o);
  if (!r.ok) throw new Error(r.error.message);
  return r;
};

describe('formatXml', () => {
  it('indents element-only content', () => {
    const r = ok('<?xml version="1.0"?><a x="1"><b><c/></b><d>text</d></a>', { mode: 'format', indent: 2 });
    expect(r.output).toBe('<?xml version="1.0"?>\n<a x="1">\n  <b>\n    <c/>\n  </b>\n  <d>text</d>\n</a>');
    expect(r.elements).toBe(4);
  });
  it('supports 4 spaces and tabs', () => {
    expect(ok('<a><b/></a>', { mode: 'format', indent: 4 }).output).toBe('<a>\n    <b/>\n</a>');
    expect(ok('<a><b/></a>', { mode: 'format', indent: 'tab' }).output).toBe('<a>\n\t<b/>\n</a>');
  });
  it('leaves mixed content and xml:space="preserve" alone', () => {
    expect(ok('<p>Hello <b>big</b>  world</p>', { mode: 'format' }).output).toBe('<p>Hello <b>big</b>  world</p>');
    expect(ok('<a xml:space="preserve"><b/>  <c/></a>', { mode: 'format' }).output).toBe('<a xml:space="preserve"><b/>  <c/></a>');
  });
  it('keeps CDATA, escapes text and attributes, and re-expands nothing', () => {
    const r = ok('<a t="&quot;x&quot; &amp; &lt;"><![CDATA[<b> & ]]><c>1 &lt; 2</c></a>', { mode: 'minify' });
    expect(r.output).toBe('<a t="&quot;x&quot; &amp; &lt;"><![CDATA[<b> & ]]><c>1 &lt; 2</c></a>');
  });
  it('minifies whitespace between elements and can drop comments', () => {
    const xml = '<?xml version="1.0"?>\n<a>\n  <!-- c -->\n  <b>\n    <c/>\n  </b>\n</a>\n';
    expect(ok(xml, { mode: 'minify' }).output).toBe('<?xml version="1.0"?><a><!-- c --><b><c/></b></a>');
    expect(ok(xml, { mode: 'minify', comments: false }).output).toBe('<?xml version="1.0"?><a><b><c/></b></a>');
    expect(ok(xml, { mode: 'format', comments: false }).output).toBe('<?xml version="1.0"?>\n<a>\n  <b>\n    <c/>\n  </b>\n</a>');
  });
  it('keeps comments and processing instructions around the root', () => {
    expect(ok('<!--top--><?pi data?><a/><!--end-->', { mode: 'format' }).output).toBe('<!--top-->\n<?pi data?>\n<a/>\n<!--end-->');
  });
  it('is idempotent', () => {
    const once = ok('<a><b x="1"> t </b><c><d/></c></a>', { mode: 'format' }).output;
    expect(ok(once, { mode: 'format' }).output).toBe(once);
  });
});

describe('validation and safety', () => {
  it('reports line and column', () => {
    const r = formatXml('<a>\n  <b>\n</a>', { mode: 'format' });
    expect(r).toMatchObject({ ok: false, error: { line: 3, column: 1 } });
  });
  it.each([
    ['unclosed tag', '<a><b></a>'],
    ['two roots', '<a/><b/>'],
    ['bad entity', '<a>&nbsp;</a>'],
    ['unquoted attribute', '<a x=1/>'],
    ['empty', ''],
  ])('rejects %s', (_n, xml) => {
    expect(formatXml(xml, { mode: 'format' }).ok).toBe(false);
  });
  it('drops the DOCTYPE and never expands entities', () => {
    const xml = '<?xml version="1.0"?><!DOCTYPE a [<!ENTITY x "boom">]><a>&x;</a>';
    expect(formatXml(xml, { mode: 'format' }).ok).toBe(false); // &x; is an unknown entity
    const r = ok('<!DOCTYPE a [<!ENTITY x "boom">]><a>y</a>', { mode: 'format' });
    expect(r.output).toBe('<a>y</a>');
    expect(r.notices[0]).toMatch(/DOCTYPE/);
  });
});

describe('parseNamespaces', () => {
  it('reads prefix=uri lines', () => {
    const { map, error } = parseNamespaces('a=http://x/a\n\n b = urn:b?c=d \n');
    expect(error).toBeUndefined();
    expect([...map]).toEqual([
      ['a', 'http://x/a'],
      ['b', 'urn:b?c=d'],
    ]);
  });
  it('reports the bad line', () => {
    expect(parseNamespaces('a=1\nnonsense').error).toMatch(/line 2/);
    expect(parseNamespaces('=uri').error).toBeDefined();
    expect(parseNamespaces('1a=uri').error).toBeDefined();
  });
});
