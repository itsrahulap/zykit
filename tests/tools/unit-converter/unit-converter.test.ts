import { describe, expect, it } from 'vitest';
import { add, formatRational, isExactWithin, parseDecimal, rat } from '../../../src/tools/unit-converter/features/rational';
import { belowAbsoluteZero, CATEGORIES, convert, convertAll, findCategory, searchUnits } from '../../../src/tools/unit-converter/features/unit-converter';

const d = (s: string) => parseDecimal(s)!;
const conv = (cat: string, from: string, to: string, value: string, precision = 12) => {
  const r = convert(cat, from, to, d(value));
  return r === null ? null : formatRational(r, { precision });
};

describe('rational', () => {
  it('parses decimals exactly', () => {
    expect(parseDecimal('0.1')).toEqual(rat(1n, 10n));
    expect(parseDecimal('-2.5e3')).toEqual(rat(-2500n));
    expect(parseDecimal('.5')).toEqual(rat(1n, 2n));
    expect(parseDecimal('5.')).toEqual(rat(5n));
    expect(parseDecimal('1,234,567.5')).toEqual(rat(2469135n, 2n));
    expect(parseDecimal('1 000')).toEqual(rat(1000n));
    expect(parseDecimal('5/9')).toEqual(rat(5n, 9n));
    expect(parseDecimal('1e-3')).toEqual(rat(1n, 1000n));
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('.')).toBeNull();
    expect(parseDecimal('1/0')).toBeNull();
    expect(parseDecimal('1,5')).toBeNull();
  });

  it('adds without floating-point error', () => {
    expect(formatRational(add(d('0.1'), d('0.2')))).toBe('0.3');
  });

  it('formats to significant digits', () => {
    expect(formatRational(rat(1n, 3n), { precision: 5 })).toBe('0.33333');
    expect(formatRational(rat(2n, 3n), { precision: 3 })).toBe('0.667');
    expect(formatRational(d('999.96'), { precision: 4 })).toBe('1000');
    expect(formatRational(d('123456'), { precision: 3 })).toBe('123000');
    expect(formatRational(d('-0.000123456'), { precision: 3 })).toBe('-0.000123');
    expect(formatRational(d('1e-7'))).toBe('1e-7');
    expect(formatRational(d('1.5e25'))).toBe('1.5e+25');
    expect(formatRational(d('1.5e25'), { scientific: false })).toBe('15000000000000000000000000');
    expect(formatRational(d('0'))).toBe('0');
    expect(formatRational(d('0.5'), { precision: 1 })).toBe('0.5');
    expect(formatRational(d('2.5'), { precision: 1 })).toBe('3'); // half away from zero
  });

  it('knows when a value is shown exactly', () => {
    expect(isExactWithin(d('0.125'), 10)).toBe(true);
    expect(isExactWithin(rat(1n, 3n), 10)).toBe(false);
  });
});

describe('conversions', () => {
  it('converts data sizes (SI vs IEC)', () => {
    expect(conv('data', 'TB', 'GiB', '1')).toBe('931.322574615');
    expect(conv('data', 'GiB', 'MB', '1')).toBe('1073.741824');
    expect(conv('data', 'byte', 'bit', '1')).toBe('8');
    expect(conv('data', 'KiB', 'byte', '1')).toBe('1024');
    expect(conv('data', 'kB', 'byte', '1')).toBe('1000');
  });

  it('converts data rates', () => {
    expect(conv('rate', 'mbps', 'MBps', '100')).toBe('12.5');
  });

  it('converts lengths exactly', () => {
    expect(conv('length', 'in', 'cm', '1')).toBe('2.54');
    expect(conv('length', 'mi', 'km', '1')).toBe('1.609344');
    expect(conv('length', 'ft', 'in', '1')).toBe('12');
    expect(conv('length', 'm', 'ft', '0.3')).toBe('0.984251968504');
    expect(conv('length', 'pc', 'ly', '1', 6)).toBe('3.26156');
  });

  it('converts temperatures (affine)', () => {
    expect(conv('temperature', 'c', 'f', '100')).toBe('212');
    expect(conv('temperature', 'f', 'c', '32')).toBe('0');
    expect(conv('temperature', 'c', 'k', '0')).toBe('273.15');
    expect(conv('temperature', 'f', 'c', '-40')).toBe('-40');
    expect(conv('temperature', 'k', 'r', '100')).toBe('180');
    expect(conv('temperature', 'c', 'f', '37')).toBe('98.6');
    const t = findCategory('temperature')!;
    expect(belowAbsoluteZero(t, 'c', d('-300'))).toBe(true);
    expect(belowAbsoluteZero(t, 'k', d('0'))).toBe(false);
  });

  it('converts fuel economy inversely', () => {
    expect(conv('fuel', 'l100km', 'kml', '5')).toBe('20');
    expect(conv('fuel', 'mpgus', 'l100km', '30', 6)).toBe('7.84049');
    expect(conv('fuel', 'l100km', 'mpgus', '0')).toBeNull();
  });

  it('converts the other categories', () => {
    expect(conv('volume', 'gal', 'l', '1')).toBe('3.785411784');
    expect(conv('mass', 'lb', 'kg', '1')).toBe('0.45359237');
    expect(conv('mass', 'st', 'lb', '1')).toBe('14');
    expect(conv('area', 'acre', 'ft2', '1')).toBe('43560');
    expect(conv('time', 'd', 'h', '1')).toBe('24');
    expect(conv('time', 'yr', 'd', '1')).toBe('365.2425');
    expect(conv('speed', 'kph', 'mps', '36')).toBe('10');
    expect(conv('speed', 'kn', 'kph', '1')).toBe('1.852');
    expect(conv('pressure', 'atm', 'psi', '1', 6)).toBe('14.6959');
    expect(conv('pressure', 'atm', 'torr', '1')).toBe('760');
    expect(conv('energy', 'kwh', 'j', '1')).toBe('3600000');
    expect(conv('energy', 'kcal', 'kj', '1')).toBe('4.184');
    expect(conv('power', 'hp', 'w', '1', 6)).toBe('745.7');
    expect(conv('angle', 'turn', 'rad', '1', 10)).toBe('6.283185307');
    expect(conv('angle', 'rad', 'deg', '1', 10)).toBe('57.29577951');
    expect(conv('frequency', 'rpm', 'hz', '120')).toBe('2');
  });

  it('round-trips every unit exactly', () => {
    for (const cat of CATEGORIES)
      for (const unit of cat.units) {
        const all = convertAll(cat, unit.id, d('1.5'));
        for (const x of all) {
          if (!x.value) continue;
          const back = convertAll(cat, x.unit.id, x.value).find((y) => y.unit.id === unit.id)!.value!;
          expect(formatRational(back), `${cat.id}: ${unit.id} → ${x.unit.id}`).toBe('1.5');
        }
      }
  });

  it('has unique unit ids per category', () => {
    for (const cat of CATEGORIES) expect(new Set(cat.units.map((x) => x.id)).size).toBe(cat.units.length);
  });
});

describe('searchUnits', () => {
  it('finds units by symbol, name and alias', () => {
    expect(searchUnits('KiB')[0].unit.id).toBe('KiB');
    expect(searchUnits('fahren')[0].unit.id).toBe('f');
    expect(searchUnits('mph')[0].unit.id).toBe('mph');
    expect(searchUnits('meter').some((h) => h.unit.id === 'm')).toBe(true);
    expect(searchUnits('')).toEqual([]);
    expect(searchUnits('zzzz')).toEqual([]);
  });
});
