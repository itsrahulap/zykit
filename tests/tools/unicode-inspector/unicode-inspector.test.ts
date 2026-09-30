import { describe, expect, it } from 'vitest';
import {
  analyze,
  blockOf,
  cleanText,
  describeCodePoint,
  escapes,
  generalCategory,
  graphemes,
  mixedScriptWords,
  scriptOf,
  skeleton,
  utf16Units,
  utf8Bytes,
} from '../../../src/tools/unicode-inspector/features/unicode-inspector';
import { charName } from '../../../src/tools/unicode-inspector/features/names';

describe('names', () => {
  it.each([
    [0x41, 'LATIN CAPITAL LETTER A'],
    [0x7a, 'LATIN SMALL LETTER Z'],
    [0x0a, 'LINE FEED (LF)'],
    [0x20, 'SPACE'],
    [0x2d, 'HYPHEN-MINUS'],
    [0x5f, 'LOW LINE'],
    [0xa0, 'NO-BREAK SPACE'],
    [0xbf, 'INVERTED QUESTION MARK'],
    [0xe9, 'LATIN SMALL LETTER E WITH ACUTE'],
    [0xc5, 'LATIN CAPITAL LETTER A WITH RING ABOVE'],
    [0xff, 'LATIN SMALL LETTER Y WITH DIAERESIS'],
    [0xdf, 'LATIN SMALL LETTER SHARP S'],
    [0x130, 'LATIN CAPITAL LETTER I WITH DOT ABOVE'],
    [0x15e, 'LATIN CAPITAL LETTER S WITH CEDILLA'],
    [0x17e, 'LATIN SMALL LETTER Z WITH CARON'],
    [0x142, 'LATIN SMALL LETTER L WITH STROKE'],
    [0x1a1, 'LATIN SMALL LETTER O WITH HORN'],
    [0x219, 'LATIN SMALL LETTER S WITH COMMA BELOW'],
    [0x1e0d, 'LATIN SMALL LETTER D WITH DOT BELOW'],
    [0x1e9b, 'LATIN SMALL LETTER LONG S WITH DOT ABOVE'],
    [0x200b, 'ZERO WIDTH SPACE'],
    [0x202e, 'RIGHT-TO-LEFT OVERRIDE'],
    [0x2069, 'POP DIRECTIONAL ISOLATE'],
    [0x2014, 'EM DASH'],
    [0x20ac, 'EURO SIGN'],
    [0x20bf, 'BITCOIN SIGN'],
    [0x2192, 'RIGHTWARDS ARROW'],
    [0x221e, 'INFINITY'],
    [0x2248, 'ALMOST EQUAL TO'],
    [0x2500, 'BOX DRAWINGS LIGHT HORIZONTAL'],
    [0x256c, 'BOX DRAWINGS DOUBLE VERTICAL AND HORIZONTAL'],
    [0x3a9, 'GREEK CAPITAL LETTER OMEGA'],
    [0x3c2, 'GREEK SMALL LETTER FINAL SIGMA'],
    [0x3bb, 'GREEK SMALL LETTER LAMDA'],
    [0x430, 'CYRILLIC SMALL LETTER A'],
    [0x42f, 'CYRILLIC CAPITAL LETTER YA'],
    [0x456, 'CYRILLIC SMALL LETTER BYELORUSSIAN-UKRAINIAN I'],
    [0x301, 'COMBINING ACUTE ACCENT'],
    [0xfe0f, 'VARIATION SELECTOR-16'],
    [0xe0100, 'VARIATION SELECTOR-17'],
    [0xe0041, 'TAG LATIN CAPITAL LETTER A'],
    [0x1f3fd, 'EMOJI MODIFIER FITZPATRICK TYPE-4'],
    [0x1f1fa, 'REGIONAL INDICATOR SYMBOL LETTER U'],
    [0xff21, 'FULLWIDTH LATIN CAPITAL LETTER A'],
    [0x4e2d, 'CJK UNIFIED IDEOGRAPH-4E2D'],
    [0xd55c, 'HANGUL SYLLABLE HAN'],
    [0xac00, 'HANGUL SYLLABLE GA'],
    [0x1f600, 'GRINNING FACE'],
  ])('U+%s', (cp, name) => {
    expect(charName(cp)).toBe(name);
  });

  it('returns null rather than guessing', () => {
    expect(charName(0x1ead)).toBeNull(); // two marks: real name order can't be derived
    expect(charName(0x212b)).toBe('ANGSTROM SIGN'); // singleton decomposition isn't treated as Å
    expect(charName(0x0e01)).toBeNull();
  });
});

describe('properties', () => {
  it('finds general category, script and block', () => {
    expect(generalCategory('A')).toEqual(['Lu', 'Uppercase letter']);
    expect(generalCategory('́')).toEqual(['Mn', 'Nonspacing mark']);
    expect(generalCategory('​')[0]).toBe('Cf');
    expect(generalCategory('€')[0]).toBe('Sc');
    expect(generalCategory('\ud800')[0]).toBe('Cs');
    expect(generalCategory('\u{E000}')[0]).toBe('Co');
    expect(generalCategory('͸')[0]).toBe('Cn');
    expect(scriptOf('a')).toBe('Latin');
    expect(scriptOf('а')).toBe('Cyrillic');
    expect(scriptOf('ο')).toBe('Greek');
    expect(scriptOf('中')).toBe('Han');
    expect(scriptOf('1')).toBe('Common');
    expect(scriptOf('́')).toBe('Inherited');
    expect(blockOf(0x41)).toBe('Basic Latin');
    expect(blockOf(0x1f600)).toBe('Emoticons');
    expect(blockOf(0x2500)).toBe('Box Drawing');
    expect(blockOf(0x10ffff)).toBe('Supplementary Private Use Area-B');
  });

  it('encodes UTF-8, UTF-16 and escapes', () => {
    expect(utf8Bytes(0x41)).toEqual([0x41]);
    expect(utf8Bytes(0xe9)).toEqual([0xc3, 0xa9]);
    expect(utf8Bytes(0x20ac)).toEqual([0xe2, 0x82, 0xac]);
    expect(utf8Bytes(0x1f600)).toEqual([0xf0, 0x9f, 0x98, 0x80]);
    expect(utf8Bytes(0xd800)).toEqual([]);
    for (const cp of [0x41, 0x7ff, 0x800, 0xffff, 0x10000, 0x10ffff]) expect(utf8Bytes(cp)).toEqual([...new TextEncoder().encode(String.fromCodePoint(cp))]);
    expect(utf16Units(0x1f600)).toEqual([0xd83d, 0xde00]);
    expect(escapes(0x1f600)).toEqual({ html: '&#x1F600;', js: '\\u{1F600}', css: '\\1F600', url: '%F0%9F%98%80' });
    expect(escapes(0x3c).html).toBe('&lt;');
    expect(escapes(0xe9).js).toBe('\\u00E9');
  });
});

describe('graphemes', () => {
  it('keeps emoji sequences and combining marks together', () => {
    const family = '👨‍👩‍👧';
    expect(graphemes(`é${family}🇺🇸👍🏽`)).toEqual(['é', family, '🇺🇸', '👍🏽']);
    const a = analyze(`é${family}`);
    expect(a.graphemeCount).toBe(2);
    expect(a.codePointCount).toBe(7);
    expect(a.utf16Length).toBe(10);
    expect(a.utf8Length).toBe(21);
  });
});

describe('suspicious characters', () => {
  it('flags Trojan Source bidi controls', () => {
    const a = analyze('access = "user‮ ⁦// admin⁩⁦"');
    expect(a.flagCounts.bidi).toBe(4);
    expect(a.rows.find((r) => r.cp === 0x202e)?.flags[0].severity).toBe('danger');
  });

  it('flags invisibles, odd spaces, tags and controls', () => {
    const a = analyze('pass​word x­y\u{E0041}\u0007\t\n');
    expect(a.flagCounts).toEqual({ invisible: 2, space: 1, tag: 1, control: 1 });
    expect(a.flagged).toBe(5);
    expect(describeCodePoint(0x200b).display).toBe('ZWSP');
    expect(describeCodePoint(0x0a).display).toBe('␊');
  });

  it('does not flag ZWJ and variation selectors inside emoji', () => {
    const a = analyze('❤️ 👨‍👩‍👧 🏴󠁧󠁢󠁳󠁣󠁴󠁿');
    expect(a.flagged).toBe(0);
    expect(analyze('a️').flagCounts.variation).toBe(1);
  });

  it('detects homoglyphs and mixed-script words', () => {
    const text = 'Log in to pаypal.com or Gооgle, not ｇoogle';
    const a = analyze(text);
    expect(a.flagCounts.confusable).toBe(4);
    const words = mixedScriptWords(text);
    expect(words.map((w) => w.word)).toEqual(['pаypal', 'Gооgle']);
    expect(words[0]).toEqual({ word: 'pаypal', scripts: ['Latin', 'Cyrillic'], skeleton: 'paypal' });
    expect(skeleton('Gооgle')).toBe('Google');
    expect(mixedScriptWords('Straße café naïve 東京')).toEqual([]);
  });

  it('compares normalization forms', () => {
    const a = analyze('Amélie ﬁ ①');
    const byForm = Object.fromEntries(a.normalization.map((n) => [n.form, n]));
    expect(byForm.NFC.text).toBe('Amélie ﬁ ①');
    expect(byForm.NFC.same).toBe(false);
    expect(byForm.NFD.same).toBe(true);
    expect(byForm.NFKC.text).toBe('Amélie fi 1');
    expect(byForm.NFKD.codePoints).toBe(12);
  });

  it('caps the detailed rows but still counts everything', () => {
    const a = analyze('x'.repeat(3000) + '​', 100);
    expect(a.rows).toHaveLength(100);
    expect(a.truncated).toBe(true);
    expect(a.codePointCount).toBe(3001);
    expect(a.flagCounts.invisible).toBe(1);
  });
});

describe('cleanText', () => {
  it('removes invisibles and bidi controls but keeps emoji and whitespace', () => {
    const r = cleanText('a​b‮c­d\u{E0061}e\u0000\tf\n❤️👨‍👩‍👧 g');
    expect(r.text).toBe('abcde\tf\n❤️👨‍👩‍👧 g');
    expect(r.removed).toBe(5);
    expect(r.replaced).toBe(1);
  });
  it('optionally keeps spaces and replaces confusables', () => {
    expect(cleanText('pаypal x', { normalizeSpaces: false, replaceConfusables: true }).text).toBe('paypal x');
  });
});
