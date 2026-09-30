// Unit definitions and exact conversion (rational arithmetic, so 0.1 + 0.2 stays 0.3).
// Pure logic, no DOM, so it's unit-testable in Node.

import { add, div, isZero, mul, parseDecimal, sub, type Rational } from './rational';

export interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  /** Size of one unit in the category's base unit (a decimal or fraction string). */
  factor: string;
  /** Affine units (temperature): base = (value + offset) × factor. */
  offset?: string;
  /** Inverse units (fuel consumption): base = factor ÷ value. */
  inverse?: boolean;
  aliases?: string[];
}

export interface Category {
  id: string;
  name: string;
  base: string;
  note?: string;
  units: UnitDef[];
}

const PI = '3.14159265358979323846264338327950288419716939937510';
const u = (id: string, name: string, symbol: string, factor: string, extra: Partial<UnitDef> = {}): UnitDef => ({ id, name, symbol, factor, ...extra });

export const CATEGORIES: Category[] = [
  {
    id: 'data',
    name: 'Data size',
    base: 'bit',
    note: 'SI prefixes (kB, MB, GB) are powers of 1000; IEC prefixes (KiB, MiB, GiB) are powers of 1024. Drive makers use SI, Windows shows IEC values with SI names, so a “1 TB” drive appears as about 931 GB.',
    units: [
      u('bit', 'Bit', 'bit', '1', { aliases: ['b'] }),
      u('nibble', 'Nibble', 'nibble', '4'),
      u('byte', 'Byte', 'B', '8', { aliases: ['octet'] }),
      u('kbit', 'Kilobit', 'kbit', '1000', { aliases: ['kb'] }),
      u('mbit', 'Megabit', 'Mbit', '1e6', { aliases: ['mb'] }),
      u('gbit', 'Gigabit', 'Gbit', '1e9'),
      u('kB', 'Kilobyte', 'kB', '8e3', { aliases: ['KB'] }),
      u('MB', 'Megabyte', 'MB', '8e6'),
      u('GB', 'Gigabyte', 'GB', '8e9'),
      u('TB', 'Terabyte', 'TB', '8e12'),
      u('PB', 'Petabyte', 'PB', '8e15'),
      u('EB', 'Exabyte', 'EB', '8e18'),
      u('kibit', 'Kibibit', 'Kibit', '1024'),
      u('mibit', 'Mebibit', 'Mibit', '1048576'),
      u('KiB', 'Kibibyte', 'KiB', '8192'),
      u('MiB', 'Mebibyte', 'MiB', '8388608'),
      u('GiB', 'Gibibyte', 'GiB', '8589934592'),
      u('TiB', 'Tebibyte', 'TiB', '8796093022208'),
      u('PiB', 'Pebibyte', 'PiB', '9007199254740992'),
      u('EiB', 'Exbibyte', 'EiB', '9223372036854775808'),
    ],
  },
  {
    id: 'rate',
    name: 'Data rate',
    base: 'bit/s',
    note: 'Network speeds are quoted in bits per second (Mbps); download managers usually show bytes per second (MB/s). Divide by 8.',
    units: [
      u('bps', 'Bits per second', 'bit/s', '1', { aliases: ['bps'] }),
      u('kbps', 'Kilobits per second', 'kbit/s', '1e3', { aliases: ['kbps'] }),
      u('mbps', 'Megabits per second', 'Mbit/s', '1e6', { aliases: ['mbps'] }),
      u('gbps', 'Gigabits per second', 'Gbit/s', '1e9', { aliases: ['gbps'] }),
      u('tbps', 'Terabits per second', 'Tbit/s', '1e12'),
      u('Bps', 'Bytes per second', 'B/s', '8'),
      u('kBps', 'Kilobytes per second', 'kB/s', '8e3'),
      u('MBps', 'Megabytes per second', 'MB/s', '8e6'),
      u('GBps', 'Gigabytes per second', 'GB/s', '8e9'),
      u('KiBps', 'Kibibytes per second', 'KiB/s', '8192'),
      u('MiBps', 'Mebibytes per second', 'MiB/s', '8388608'),
      u('GiBps', 'Gibibytes per second', 'GiB/s', '8589934592'),
    ],
  },
  {
    id: 'length',
    name: 'Length',
    base: 'm',
    units: [
      u('nm', 'Nanometre', 'nm', '1e-9', { aliases: ['nanometer'] }),
      u('um', 'Micrometre', 'µm', '1e-6', { aliases: ['micron', 'micrometer', 'um'] }),
      u('mm', 'Millimetre', 'mm', '0.001', { aliases: ['millimeter'] }),
      u('cm', 'Centimetre', 'cm', '0.01', { aliases: ['centimeter'] }),
      u('m', 'Metre', 'm', '1', { aliases: ['meter'] }),
      u('km', 'Kilometre', 'km', '1000', { aliases: ['kilometer'] }),
      u('thou', 'Thou (mil)', 'mil', '0.0000254'),
      u('in', 'Inch', 'in', '0.0254', { aliases: ['"'] }),
      u('ft', 'Foot', 'ft', '0.3048', { aliases: ['feet', "'"] }),
      u('yd', 'Yard', 'yd', '0.9144'),
      u('mi', 'Mile', 'mi', '1609.344'),
      u('nmi', 'Nautical mile', 'nmi', '1852'),
      u('angstrom', 'Ångström', 'Å', '1e-10', { aliases: ['angstrom'] }),
      u('au', 'Astronomical unit', 'au', '149597870700'),
      u('ly', 'Light-year', 'ly', '9460730472580800'),
      u('pc', 'Parsec', 'pc', `149597870700*648000/${PI}`),
    ],
  },
  {
    id: 'area',
    name: 'Area',
    base: 'm²',
    units: [
      u('mm2', 'Square millimetre', 'mm²', '1e-6'),
      u('cm2', 'Square centimetre', 'cm²', '1e-4'),
      u('m2', 'Square metre', 'm²', '1'),
      u('ha', 'Hectare', 'ha', '1e4'),
      u('km2', 'Square kilometre', 'km²', '1e6'),
      u('in2', 'Square inch', 'in²', '0.00064516'),
      u('ft2', 'Square foot', 'ft²', '0.09290304'),
      u('yd2', 'Square yard', 'yd²', '0.83612736'),
      u('acre', 'Acre', 'ac', '4046.8564224'),
      u('mi2', 'Square mile', 'mi²', '2589988.110336'),
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    base: 'L',
    units: [
      u('ml', 'Millilitre', 'mL', '0.001', { aliases: ['milliliter', 'cc'] }),
      u('cl', 'Centilitre', 'cL', '0.01'),
      u('dl', 'Decilitre', 'dL', '0.1'),
      u('l', 'Litre', 'L', '1', { aliases: ['liter'] }),
      u('m3', 'Cubic metre', 'm³', '1000'),
      u('cm3', 'Cubic centimetre', 'cm³', '0.001'),
      u('in3', 'Cubic inch', 'in³', '0.016387064'),
      u('ft3', 'Cubic foot', 'ft³', '28.316846592'),
      u('tsp', 'Teaspoon (US)', 'tsp', '0.00492892159375'),
      u('tbsp', 'Tablespoon (US)', 'tbsp', '0.01478676478125'),
      u('floz', 'Fluid ounce (US)', 'fl oz', '0.0295735295625'),
      u('cup', 'Cup (US)', 'cup', '0.2365882365'),
      u('pt', 'Pint (US)', 'pt', '0.473176473'),
      u('qt', 'Quart (US)', 'qt', '0.946352946'),
      u('gal', 'Gallon (US)', 'gal', '3.785411784'),
      u('impfloz', 'Fluid ounce (imperial)', 'imp fl oz', '0.0284130625'),
      u('imppt', 'Pint (imperial)', 'imp pt', '0.56826125'),
      u('impgal', 'Gallon (imperial)', 'imp gal', '4.54609'),
    ],
  },
  {
    id: 'mass',
    name: 'Mass',
    base: 'kg',
    units: [
      u('ug', 'Microgram', 'µg', '1e-9'),
      u('mg', 'Milligram', 'mg', '1e-6'),
      u('g', 'Gram', 'g', '0.001'),
      u('kg', 'Kilogram', 'kg', '1'),
      u('t', 'Tonne', 't', '1000', { aliases: ['metric ton'] }),
      u('ct', 'Carat', 'ct', '0.0002'),
      u('gr', 'Grain', 'gr', '0.00006479891'),
      u('oz', 'Ounce', 'oz', '0.028349523125'),
      u('lb', 'Pound', 'lb', '0.45359237', { aliases: ['lbs'] }),
      u('st', 'Stone', 'st', '6.35029318'),
      u('uston', 'Short ton (US)', 'ton', '907.18474'),
      u('ukton', 'Long ton (UK)', 'long ton', '1016.0469088'),
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    base: 'K',
    note: 'Temperature scales have different zero points, so converting isn’t just multiplying: °F = °C × 9/5 + 32.',
    units: [
      u('c', 'Celsius', '°C', '1', { offset: '273.15', aliases: ['c', 'celsius', 'centigrade'] }),
      u('f', 'Fahrenheit', '°F', '5/9', { offset: '459.67', aliases: ['f'] }),
      u('k', 'Kelvin', 'K', '1'),
      u('r', 'Rankine', '°R', '5/9'),
    ],
  },
  {
    id: 'time',
    name: 'Time',
    base: 's',
    note: 'A month is an average Gregorian month (30.436875 days) and a year is 365.2425 days.',
    units: [
      u('ns', 'Nanosecond', 'ns', '1e-9'),
      u('us', 'Microsecond', 'µs', '1e-6'),
      u('ms', 'Millisecond', 'ms', '0.001'),
      u('s', 'Second', 's', '1', { aliases: ['sec'] }),
      u('min', 'Minute', 'min', '60'),
      u('h', 'Hour', 'h', '3600', { aliases: ['hr'] }),
      u('d', 'Day', 'd', '86400'),
      u('wk', 'Week', 'wk', '604800'),
      u('mo', 'Month (average)', 'mo', '2629746'),
      u('yr', 'Year (average)', 'yr', '31556952'),
      u('decade', 'Decade', 'decade', '315569520'),
      u('century', 'Century', 'century', '3155695200'),
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    base: 'm/s',
    units: [
      u('mps', 'Metres per second', 'm/s', '1'),
      u('kph', 'Kilometres per hour', 'km/h', '1000/3600', { aliases: ['kph', 'kmh'] }),
      u('mph', 'Miles per hour', 'mph', '0.44704'),
      u('fps', 'Feet per second', 'ft/s', '0.3048'),
      u('kn', 'Knot', 'kn', '1852/3600', { aliases: ['knots'] }),
      u('c', 'Speed of light', 'c', '299792458'),
    ],
  },
  {
    id: 'pressure',
    name: 'Pressure',
    base: 'Pa',
    units: [
      u('pa', 'Pascal', 'Pa', '1'),
      u('hpa', 'Hectopascal', 'hPa', '100'),
      u('kpa', 'Kilopascal', 'kPa', '1000'),
      u('mpa', 'Megapascal', 'MPa', '1e6'),
      u('mbar', 'Millibar', 'mbar', '100'),
      u('bar', 'Bar', 'bar', '1e5'),
      u('atm', 'Standard atmosphere', 'atm', '101325'),
      u('psi', 'Pound per square inch', 'psi', '4.4482216152605/0.00064516'),
      u('torr', 'Torr', 'Torr', '101325/760'),
      u('mmhg', 'Millimetre of mercury', 'mmHg', '133.322387415'),
      u('inhg', 'Inch of mercury', 'inHg', '3386.389'),
    ],
  },
  {
    id: 'energy',
    name: 'Energy',
    base: 'J',
    units: [
      u('j', 'Joule', 'J', '1'),
      u('kj', 'Kilojoule', 'kJ', '1000'),
      u('mj', 'Megajoule', 'MJ', '1e6'),
      u('cal', 'Calorie', 'cal', '4.184'),
      u('kcal', 'Kilocalorie (food Calorie)', 'kcal', '4184', { aliases: ['Cal'] }),
      u('wh', 'Watt-hour', 'Wh', '3600'),
      u('kwh', 'Kilowatt-hour', 'kWh', '3.6e6'),
      u('ev', 'Electronvolt', 'eV', '1.602176634e-19'),
      u('btu', 'British thermal unit', 'BTU', '1055.05585262'),
      u('ftlb', 'Foot-pound', 'ft·lbf', '1.3558179483314004'),
      u('erg', 'Erg', 'erg', '1e-7'),
    ],
  },
  {
    id: 'power',
    name: 'Power',
    base: 'W',
    units: [
      u('mw', 'Milliwatt', 'mW', '0.001'),
      u('w', 'Watt', 'W', '1'),
      u('kw', 'Kilowatt', 'kW', '1000'),
      u('MW', 'Megawatt', 'MW', '1e6'),
      u('gw', 'Gigawatt', 'GW', '1e9'),
      u('hp', 'Horsepower (mechanical)', 'hp', '745.69987158227022'),
      u('ps', 'Horsepower (metric)', 'PS', '735.49875'),
      u('btuh', 'BTU per hour', 'BTU/h', '1055.05585262/3600'),
      u('kcalh', 'Kilocalorie per hour', 'kcal/h', '4184/3600'),
    ],
  },
  {
    id: 'angle',
    name: 'Angle',
    base: '°',
    units: [
      u('deg', 'Degree', '°', '1', { aliases: ['deg'] }),
      u('rad', 'Radian', 'rad', `180/${PI}`),
      u('mrad', 'Milliradian', 'mrad', `0.18/${PI}`),
      u('grad', 'Gradian', 'gon', '0.9', { aliases: ['grad'] }),
      u('turn', 'Turn', 'tr', '360', { aliases: ['revolution'] }),
      u('arcmin', 'Arcminute', '′', '1/60'),
      u('arcsec', 'Arcsecond', '″', '1/3600'),
    ],
  },
  {
    id: 'frequency',
    name: 'Frequency',
    base: 'Hz',
    units: [
      u('hz', 'Hertz', 'Hz', '1'),
      u('khz', 'Kilohertz', 'kHz', '1e3'),
      u('mhz', 'Megahertz', 'MHz', '1e6'),
      u('ghz', 'Gigahertz', 'GHz', '1e9'),
      u('thz', 'Terahertz', 'THz', '1e12'),
      u('rpm', 'Revolutions per minute', 'rpm', '1/60'),
      u('bpm', 'Beats per minute', 'bpm', '1/60'),
    ],
  },
  {
    id: 'fuel',
    name: 'Fuel economy',
    base: 'km/L',
    note: 'L/100 km measures consumption (lower is better); mpg and km/L measure distance per fuel (higher is better), so they convert inversely.',
    units: [
      u('kml', 'Kilometres per litre', 'km/L', '1'),
      u('l100km', 'Litres per 100 km', 'L/100 km', '100', { inverse: true }),
      u('mpgus', 'Miles per gallon (US)', 'mpg (US)', '1.609344/3.785411784'),
      u('mpguk', 'Miles per gallon (UK)', 'mpg (UK)', '1.609344/4.54609'),
      u('mil', 'Miles per litre', 'mi/L', '1.609344'),
    ],
  },
];

const cache = new Map<string, Rational>();
/** Parses a factor like "1e-9", "5/9" or "149597870700*648000/3.14…". */
function r(expr: string): Rational {
  let v = cache.get(expr);
  if (!v) {
    const [numPart, den] = expr.split('/');
    const num = numPart.split('*').reduce((acc, x) => mul(acc, parseDecimal(x)!), parseDecimal('1')!);
    v = den ? div(num, parseDecimal(den)!) : num;
    cache.set(expr, v);
  }
  return v;
}

export function findCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function toBase(value: Rational, unit: UnitDef): Rational | null {
  if (unit.inverse) return isZero(value) ? null : div(r(unit.factor), value);
  return mul(unit.offset ? add(value, r(unit.offset)) : value, r(unit.factor));
}

export function fromBase(base: Rational, unit: UnitDef): Rational | null {
  if (unit.inverse) return isZero(base) ? null : div(r(unit.factor), base);
  const v = div(base, r(unit.factor));
  return unit.offset ? sub(v, r(unit.offset)) : v;
}

export type Converted = { unit: UnitDef; value: Rational | null }[];

/** Converts `value` in `from` to every unit of the category. null means undefined (e.g. 0 L/100 km in mpg). */
export function convertAll(category: Category, fromId: string, value: Rational): Converted {
  const from = category.units.find((x) => x.id === fromId);
  if (!from) return [];
  const base = toBase(value, from);
  return category.units.map((unit) => ({ unit, value: unit.id === fromId ? value : base === null ? null : fromBase(base, unit) }));
}

export function convert(categoryId: string, fromId: string, toId: string, value: Rational): Rational | null {
  const cat = findCategory(categoryId);
  const to = cat?.units.find((x) => x.id === toId);
  if (!cat || !to) return null;
  return convertAll(cat, fromId, value).find((x) => x.unit.id === toId)?.value ?? null;
}

/** Below absolute zero? (Only for temperatures.) */
export function belowAbsoluteZero(category: Category, fromId: string, value: Rational): boolean {
  if (category.id !== 'temperature') return false;
  const from = category.units.find((x) => x.id === fromId);
  const k = from && toBase(value, from);
  return !!k && k.n < 0n;
}

export interface SearchHit {
  category: Category;
  unit: UnitDef;
}

/** Finds units by name, symbol or alias across every category. */
export function searchUnits(query: string, limit = 20): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const exact: SearchHit[] = [];
  const prefix: SearchHit[] = [];
  const partial: SearchHit[] = [];
  for (const category of CATEGORIES)
    for (const unit of category.units) {
      const keys = [unit.name, unit.symbol, unit.id, ...(unit.aliases ?? [])].map((k) => k.toLowerCase());
      if (keys.includes(q)) exact.push({ category, unit });
      else if (keys.some((k) => k.startsWith(q))) prefix.push({ category, unit });
      else if (keys.some((k) => k.includes(q)) || category.name.toLowerCase().includes(q)) partial.push({ category, unit });
    }
  return [...exact, ...prefix, ...partial].slice(0, limit);
}

