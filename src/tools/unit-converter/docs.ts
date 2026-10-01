import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Category**: data size, data rate, length, area, volume, mass, temperature, time, speed, pressure, energy, power, angle, frequency or fuel economy.',
    'Type a value into any unit’s box. Every other unit in the category updates at once, and you can keep typing into whichever box you like.',
    'Use **Search units** to jump to a unit by name, symbol or alias (for example `KiB`, `psi` or `fahrenheit`) in any category.',
    'Choose a **Precision** from 3 to 20 significant digits. Values that had to be rounded for display are marked **≈ rounded**.',
    'Copy a value with its unit symbol using the copy button next to each box.',
  ],
  howItWorks:
    'Each unit is defined by its exact size in the category’s base unit (bits, metres, square metres, litres, kilograms, kelvin, seconds and so on), following SI, NIST and the 1959 international yard and pound: an inch is exactly `0.0254` m and a pound exactly `0.45359237` kg. Your value is parsed into an exact fraction of big integers, converted to the base unit and back, and only rounded when it is displayed, so `0.1` + `0.2` style floating-point errors never appear.\n\n' +
    'Temperatures have different zero points, so they are converted through kelvin with an offset: °C adds 273.15, and °F adds 459.67 and multiplies by 5/9. Fuel economy is inverse: L/100 km is 100 divided by km/L, so 0 L/100 km has no mpg equivalent and shows as undefined. Data sizes keep SI prefixes (kB, MB, GB, powers of 1000) and IEC prefixes (KiB, MiB, GiB, powers of 1024) apart.\n\n' +
    'Results are shown with the chosen number of significant digits, with trailing zeros removed, and in scientific notation below 1e-6 or from 1e21 up. Everything is calculated in your browser.',
  limits: [
    'Input is a decimal number with an optional sign, decimal point, exponent (`1e6`, up to four exponent digits) or a fraction like `1/3`. Spaces, underscores and comma thousands separators such as `1,234,567.8` are ignored; other formats, such as a decimal comma, aren’t accepted.',
    'Units involving π (radians, milliradians and parsecs) use π to 50 decimal places, and a few factors are published constants that are themselves rounded, such as the inch of mercury and mechanical horsepower.',
    'A month is an average Gregorian month (30.436875 days) and a year is 365.2425 days, so months and years aren’t calendar-exact.',
    'Volume units like cups, pints and gallons are US measures unless marked imperial. Temperatures below absolute zero are converted but flagged.',
    'Choosing a unit from **Search units** in the current category carries over its displayed, possibly rounded, value.',
  ],
  privacy:
    'All conversions run in your browser, and nothing is uploaded or saved; the site’s Content Security Policy blocks requests to other servers. **Copy share link** puts the category, the unit, the value and the precision in the link’s `#` fragment, which browsers don’t send to servers.',
  faqs: [
    {
      question: 'Why does my 1 TB drive show as 931 GB?',
      answer:
        'Drive makers use SI units, where 1 TB is 10^12 bytes. Windows divides by powers of 1024 but labels the result GB, so 10^12 bytes shows as about 931.32 GiB. Both values describe the same number of bytes.',
    },
    {
      question: 'How do I convert Mbps to MB/s?',
      answer:
        'Divide by 8, since there are 8 bits in a byte. In **Data rate**, typing `100` into Megabits per second shows 12.5 in Megabytes per second.',
    },
    {
      question: 'Are the conversions exact?',
      answer:
        'The arithmetic is exact: values are kept as fractions of big integers, not floating-point numbers. The display is rounded to the chosen **Precision**, and **≈ rounded** marks values that don’t fit exactly in that many digits.',
    },
    {
      question: 'Why can’t I just multiply to convert Celsius to Fahrenheit?',
      answer:
        'The scales start at different points. °F = °C × 9/5 + 32, so 100 °C is 212 °F and −40 is the same on both scales. The converter goes through kelvin to handle the offset.',
    },
    {
      question: 'Why does 0 L/100 km show as undefined in mpg?',
      answer:
        'Fuel economy units are inverses of each other. Zero litres per 100 km would mean infinite distance per litre, so there is no finite value to show.',
    },
    {
      question: 'Are cups and gallons US or imperial?',
      answer:
        'Teaspoon, tablespoon, fluid ounce, cup, pint, quart and gallon are US customary measures. Fluid ounce, pint and gallon also have separate imperial entries, labelled **imperial**.',
    },
  ],
};

export default docs;
