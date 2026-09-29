import { describe, expect, it } from 'vitest';
import { escapeAttr, jsonToXml, parseXml, xmlToJson, type XmlToJsonOptions } from '../../../src/tools/xml-json/features/xml';

const opts: XmlToJsonOptions = { alwaysArrays: false, trim: true, coerce: false, comments: false };

function convert(xml: string, o: Partial<XmlToJsonOptions> = {}) {
  const r = parseXml(xml);
  if (!r.ok) throw new Error(`${r.error.message} (${r.error.line}:${r.error.column})`);
  return xmlToJson(r.doc, { ...opts, ...o });
}

function fail(xml: string) {
  const r = parseXml(xml);
  if (r.ok) throw new Error('expected an error');
  return r.error;
}

describe('parseXml / xmlToJson', () => {
  it('maps elements, attributes, text and repeated siblings', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<catalog xmlns:dc="http://purl.org/dc">
  <book id="1" lang='en'><dc:title>One</dc:title><price>9.5</price></book>
  <book id="2"><dc:title>Two</dc:title><empty/></book>
  <note>Hello <b>world</b></note>
</catalog>`;
    expect(convert(xml)).toEqual({
      '?xml': { '@version': '1.0', '@encoding': 'UTF-8' },
      catalog: {
        '@xmlns:dc': 'http://purl.org/dc',
        book: [
          { '@id': '1', '@lang': 'en', 'dc:title': 'One', price: '9.5' },
          { '@id': '2', 'dc:title': 'Two', empty: '' },
        ],
        note: { '#text': 'Hello', b: 'world' },
      },
    });
  });

  it('decodes entities, CDATA and normalises attribute whitespace', () => {
    expect(convert('<a t="x&#10;y\tz &quot;q&apos;">&lt;&amp;&gt; &#x1F600; &#65;<![CDATA[<raw> & ]]></a>')).toEqual({
      a: { '@t': 'x\ny z "q\'', '#text': '<&> 😀 A<raw> &' },
    });
  });

  it('supports always-arrays, coercion, comments and no trimming', () => {
    expect(convert('<r><n>1</n><b>true</b><s>007</s></r>', { alwaysArrays: true, coerce: true })).toEqual({
      r: [{ n: [1], b: [true], s: ['007'] }],
    });
    expect(convert('<!--top--><r><!-- c --><x>1</x></r>', { comments: true })).toEqual({ '#comment': 'top', r: { '#comment': ' c ', x: '1' } });
    expect(convert('<r><!-- c --><x>1</x></r>')).toEqual({ r: { x: '1' } });
    expect(convert('<r>  padded  </r>', { trim: false })).toEqual({ r: '  padded  ' });
  });

  it('ignores a DOCTYPE and never expands declared entities', () => {
    const lol = `<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
]>
<lolz>&lol2;</lolz>`;
    const e = fail(lol);
    expect(e.message).toMatch(/Unknown entity &lol2;/);
    expect(e.line).toBe(6);
    const r = parseXml('<!DOCTYPE x SYSTEM "file:///etc/passwd"><x>ok</x>');
    expect(r.ok && r.doc.notices[0]).toMatch(/DOCTYPE was ignored/);
    const r2 = parseXml('<!DOCTYPE x [<!ENTITY a "b">]><x/>');
    expect(r2.ok && r2.doc.notices[0]).toMatch(/never expanded/);
  });

  it('reports errors with line and column', () => {
    expect(fail('<a>\n  <b></c>\n</a>')).toMatchObject({ line: 2, column: 6, message: 'Expected </b> but found </c>.' });
    expect(fail('<a>')).toMatchObject({ message: '<a> is never closed.' });
    expect(fail('<a x="1" x="2"/>').message).toMatch(/Duplicate attribute/);
    expect(fail('<a x=1/>').message).toMatch(/must be in quotes/);
    expect(fail('<a/><b/>').message).toMatch(/one root/);
    expect(fail('<a>AT&T</a>').message).toMatch(/entity/);
    expect(fail('<a>&#0;</a>').message).toMatch(/not a valid character/);
    expect(fail('hello').message).toMatch(/Text before/);
    expect(fail('').message).toMatch(/No root/);
    expect(fail(' <?xml version="1.0"?><a/>').message).toMatch(/very first/);
    expect(fail('<a><!-- x -- y --></a>').message).toMatch(/--/);
  });

  it('rejects absurd nesting without overflowing the stack', () => {
    expect(fail('<a>'.repeat(5000)).message).toMatch(/nested more than/);
  });
});

describe('jsonToXml', () => {
  const o = { indent: 2 as const, declaration: false };

  it('writes elements, attributes, text, arrays and escaping', () => {
    const { xml } = jsonToXml(
      { catalog: { '@xmlns:dc': 'u', book: [{ '@id': 1, 'dc:title': 'A & B' }, { '@id': 2, 'dc:title': '<two>' }], empty: null, note: { '@k': 'say "x"', '#text': 'hi' } } },
      o,
    );
    expect(xml).toBe(
      [
        '<catalog xmlns:dc="u">',
        '  <book id="1">',
        '    <dc:title>A &amp; B</dc:title>',
        '  </book>',
        '  <book id="2">',
        '    <dc:title>&lt;two&gt;</dc:title>',
        '  </book>',
        '  <empty/>',
        '  <note k="say &quot;x&quot;">hi</note>',
        '</catalog>',
        '',
      ].join('\n'),
    );
  });

  it('adds a declaration, wraps multiple roots and supports compact output', () => {
    const r = jsonToXml({ a: 1, b: 2 }, { indent: 'none', declaration: true });
    expect(r.xml).toBe('<?xml version="1.0" encoding="UTF-8"?><root><a>1</a><b>2</b></root>');
    expect(r.notices[0]).toMatch(/wrapped in <root>/);
    expect(jsonToXml([1, 2], { indent: 'none', declaration: false }).xml).toBe('<root><item>1</item><item>2</item></root>');
  });

  it('rejects invalid names', () => {
    expect(() => jsonToXml({ 'bad name': 1 }, o)).toThrow(/not a valid XML/);
    expect(() => jsonToXml({ a: { '1x': 1 } }, o)).toThrow(/a\.1x/);
  });

  it('escapes attributes and splits CDATA terminators', () => {
    expect(escapeAttr('a<b>&"\n')).toBe('a&lt;b&gt;&amp;&quot;&#10;');
    expect(jsonToXml({ a: { '#cdata': 'x]]>y' } }, { indent: 'none', declaration: false }).xml).toBe('<a><![CDATA[x]]]]><![CDATA[>y]]></a>');
  });

  it('round-trips with the same conventions', () => {
    const data = { '?xml': { '@version': '1.0' }, root: { '@a': 'x&y', item: ['1', '2'], nested: { '#text': 'txt', '@q': '"' }, '#comment': 'hi' } };
    const back = convert(jsonToXml(data, o).xml, { comments: true });
    expect(back).toEqual(data);
  });
});
