import { describe, expect, it } from 'vitest';
import { escapeText, FORMAT_IDS, unescapeText, type FormatId } from '../../../src/tools/string-escaper/features/string-escaper';

const esc = (f: FormatId, s: string, ascii = false) => {
  const r = escapeText(f, s, { ascii });
  if (!r.ok) throw new Error(r.error);
  return r.value;
};
const unesc = (f: FormatId, s: string) => {
  const r = unescapeText(f, s);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

const CORPUS = [
  '',
  'plain text',
  `quotes ' " \` and backslash \\ end\\`,
  'lines\nand\r\nreturns\ttabs',
  'nul\0 then digit \x001 bell \x07 esc \x1b del \x7f vt \v ff \f bs \b sub \x1a',
  'template ${x} and $y and $',
  'unicode: café Zürich — “quotes” ‘single’ 日本語 😀 👩‍👩‍👧       \u0085',
  'regex .*+?^$()[]{}|/\\ - , : =',
  'shell: $(rm -rf /) `id` !history ~ * ? ; & | < >',
  'csv, "field"',
  '  leading and trailing  ',
  '<a href="x">&amp; &lt;</a>',
  '??= trigraph ??/',
  '% percent %41 + plus',
];

describe('round trips', () => {
  for (const format of FORMAT_IDS) {
    it(format, () => {
      for (const s of CORPUS) {
        expect(unesc(format, esc(format, s)), `${format}: ${JSON.stringify(s)}`).toBe(s);
        expect(unesc(format, esc(format, s, true)), `${format} ascii: ${JSON.stringify(s)}`).toBe(s);
      }
    });
  }
});

describe('escaping matches the real parsers', () => {
  it('JSON', () => {
    for (const s of CORPUS) {
      expect(JSON.parse(`"${esc('json', s)}"`)).toBe(s);
      expect(JSON.parse(`"${esc('json', s, true)}"`)).toBe(s);
    }
    expect(esc('json', 'a"b\\c\n\u0001é')).toBe('a\\"b\\\\c\\n\\u0001é');
    expect(esc('json', 'é😀', true)).toBe('\\u00E9\\uD83D\\uDE00');
  });

  it('regex (with and without the u flag)', () => {
    for (const s of CORPUS) {
      const e = esc('regex', s);
      expect(new RegExp(`^${e}$`, 'u').test(s), s).toBe(true);
      expect(new RegExp(`^${e}$`).test(s), s).toBe(true);
    }
    expect(esc('regex', 'a.b*c')).toBe('a\\.b\\*c');
  });

  it('URL component', () => {
    expect(esc('url', 'a b&c=d/é')).toBe('a%20b%26c%3Dd%2F%C3%A9');
    expect(unesc('url', '%E2%82%AC')).toBe('€');
  });
});

describe('specific outputs', () => {
  it('JavaScript', () => {
    expect(esc('js-single', `it's "ok"`)).toBe(`it\\'s "ok"`);
    expect(esc('js-double', `it's "ok"`)).toBe(`it's \\"ok\\"`);
    expect(esc('js-template', '`${a}` $b')).toBe('\\`\\${a}\\` $b');
    expect(esc('js-single', '\0' + '1')).toBe('\\x001');
    expect(esc('js-single', ' ')).toBe('\\u2028');
    expect(esc('js-single', '😀', true)).toBe('\\u{1F600}');
    expect(unesc('js-single', '\\x41\\u0042\\u{43}\\101\\q\\\nZ')).toBe('ABCAqZ');
  });

  it('Python, Java, C, C#, Go', () => {
    expect(esc('python', "a'b\"\x01", false)).toBe("a\\'b\\\"\\x01");
    expect(esc('python', 'é€😀', true)).toBe('\\xe9\\u20ac\\U0001f600');
    expect(unesc('python', '\\N{x} \\d')).toBe('\\N{x} \\d'); // unknown escapes are kept
    expect(esc('java', '\n\u0001é', true)).toBe('\\n\\001\\u00E9');
    expect(unesc('java', '\\uuu0041\\s\\101')).toBe('A A');
    expect(esc('c', '€', true)).toBe('\\342\\202\\254');
    expect(esc('c', '??=')).toBe('?\\?=');
    expect(unesc('c', '\\xe2\\x82\\xac')).toBe('€');
    expect(esc('csharp', '\0\u0001😀', true)).toBe('\\0\\u0001\\U0001F600');
    expect(unesc('csharp', '\\x41\\x0042')).toBe('AB');
    expect(esc('go', "'\x01", false)).toBe("'\\x01");
    expect(unesc('go', '\\xe2\\x82\\xac\\u00e9')).toBe('€é');
  });

  it('SQL', () => {
    expect(esc('sql', "O'Brien")).toBe("O''Brien");
    expect(esc('sql-mysql', "O'Brien\\\n")).toBe("O\\'Brien\\\\\\n");
    expect(unesc('sql-mysql', "O''Brien \\% \\_")).toBe("O'Brien \\% \\_");
  });

  it('shell and PowerShell', () => {
    expect(esc('shell-single', "it's $HOME")).toBe(`'it'\\''s $HOME'`);
    expect(esc('shell-double', 'say "$HOME" `id` \\')).toBe('"say \\"\\$HOME\\" \\`id\\` \\\\"');
    expect(unesc('shell-single', `'a'"b"\\ c$'\\n'`)).toBe('ab c\n');
    expect(esc('powershell-single', "it's")).toBe("'it''s'");
    expect(esc('powershell-double', 'a"$b`\n')).toBe('"a`"`$b```n"');
    expect(unescapeText('shell-single', 'two words').ok).toBe(false);
  });

  it('CSV and XML', () => {
    expect(esc('csv', 'plain')).toBe('plain');
    expect(esc('csv', 'a,"b"')).toBe('"a,""b"""');
    expect(esc('xml-text', '<a & "b">')).toBe('&lt;a &amp; "b"&gt;');
    expect(esc('xml-attr', `"it's"\n`)).toBe('&quot;it&#39;s&quot;&#10;');
    expect(unesc('xml-text', '&#x1F600;&#233;&eacute;&copy;')).toBe('😀é&eacute;©');
  });

  it('Unicode escapes', () => {
    expect(esc('unicode-u', 'aé😀\\')).toBe('a\\u00E9\\uD83D\\uDE00\\\\');
    expect(esc('unicode-braces', 'aé😀')).toBe('a\\u{E9}\\u{1F600}');
    expect(esc('unicode-x', 'aé')).toBe('a\\xC3\\xA9');
    expect(unesc('unicode-u', '\\u{1F600} \\xC3\\xA9 \\d')).toBe('😀 é \\d');
  });
});

describe('errors', () => {
  it('reports bad escapes with a position', () => {
    expect(unescapeText('json', 'ab\\q')).toEqual({ ok: false, error: 'Unknown escape sequence \\q.', offset: 2 });
    expect(unescapeText('json', 'x\\u12')).toMatchObject({ ok: false, offset: 1 });
    expect(unescapeText('json', 'end\\')).toMatchObject({ ok: false, error: 'The text ends with a lone backslash.' });
    expect(unescapeText('go', '\\xff')).toMatchObject({ ok: false, error: /UTF-8/ });
    expect(unescapeText('url', '%zz')).toMatchObject({ ok: false, offset: 0 });
    expect(unescapeText('csv', '"open')).toMatchObject({ ok: false });
    expect(unescapeText('regex', '\\d')).toMatchObject({ ok: false });
    expect(unescapeText('shell-double', '"$x"')).toMatchObject({ ok: false, offset: 1 });
  });

  it('refuses lone surrogates when escaping', () => {
    expect(escapeText('json', 'a\ud800b')).toMatchObject({ ok: false, offset: 1 });
    expect(escapeText('url', '\udc00')).toMatchObject({ ok: false });
  });
});
