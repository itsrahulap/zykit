import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type an integer into **Number**, or press **Try an example**. With **Input base** on **Auto**, `0x`, `0b` and `0o` prefixes pick hex, binary or octal and anything else is decimal. Choose **Bin**, **Oct**, **Dec**, **Hex** or **Other** (bases 2–36) to force a base.',
    'Read the value in binary, octal, decimal and hex, plus any base from 2 to 36 in the **As** row. **Group digits** and **Uppercase** change how the output is written.',
    'Check **Two’s complement** for the 8, 16, 32 and 64-bit signed and unsigned forms, and whether the number fits each width.',
    'Under **IEEE-754 floating point**, enter a decimal value (or `inf`, `NaN`) or switch **Float input** to **Hex bits** to decode raw bits, and pick **float32** or **float64** to see the sign, exponent, mantissa and exact stored value.',
    'Use the **Bitwise calculator** to combine **A** and **B** with AND, OR, XOR, NAND, NOR, NOT, shifts and rotations at a chosen **Width**, and **Characters and codes** to turn text into code points and UTF-8 bytes or codes back into text.',
  ],
  howItWorks:
    'Integers are parsed digit by digit into JavaScript `BigInt`, so there is no size limit and large values are never rounded. Spaces, underscores, commas and apostrophes are ignored as group separators, a leading `+` or `-` sets the sign, and in **Hex** mode a leading `#` is also accepted. Invalid digits are reported with their position.\n\n' +
    'Two’s complement uses `BigInt.asIntN` and `BigInt.asUintN` to wrap the value to each width. A number “fits” if it is within the signed minimum and the unsigned maximum of that width. The bitwise calculator wraps both operands to the selected width the same way, so the result is always shown as both unsigned and signed.\n\n' +
    'Float bits are read and written with a `DataView`, exactly as the computer stores them. The stored value is expanded to its full exact decimal, which shows, for example, that `0.1` is really `0.1000000000000000055511151231257827021181583404541015625` in float64. Characters are read as Unicode code points and encoded with `TextEncoder` for the UTF-8 bytes.',
  limits: [
    'Only integers are converted between bases; fractions aren’t supported there. Use the IEEE-754 section for fractional values.',
    'Two’s complement is shown for 8, 16, 32 and 64 bits. The bitwise calculator offers 8, 16, 32, 64 and 128 bits, and shift and rotate amounts must be between 0 and 100,000.',
    'In **Hex bits** mode the value must fit the chosen width: up to 8 hex digits for float32 and 16 for float64.',
    '**Text → codes** lists the first 500 characters. **Codes → text** accepts decimal, `0x…` or `…h` hex, `U+…`, `\\u…` and `0b…`, separated by spaces, commas or semicolons; values outside 0–0x10FFFF and lone surrogates are rejected.',
  ],
  privacy:
    'Everything runs in your browser with built-in JavaScript. Nothing you enter is uploaded or saved. **Copy share link** puts your inputs and settings from every section in the link’s `#` fragment, which browsers don’t send to servers, so anyone you give the link to can see them.',
  faqs: [
    {
      question: 'Is there a limit on how big a number can be?',
      answer:
        'No fixed limit. Numbers are handled as arbitrary-precision integers (`BigInt`), so a 100-digit decimal converts exactly. Very long inputs just take longer to display.',
    },
    {
      question: 'How do I enter a negative number in hex or binary?',
      answer:
        'Put a minus sign in front, for example `-0xff`. The conversions show it with a minus sign, and the two’s complement section shows the bit pattern a computer would store, such as `0xFF01` for 16 bits.',
    },
    {
      question: 'Why is 0.1 not exactly 0.1?',
      answer:
        'Binary floating point can’t represent most decimal fractions exactly, so the nearest representable value is stored. The **Stored value** row shows that value in full.',
    },
    {
      question: 'What does “overflows, wrapped” mean?',
      answer:
        'The number doesn’t fit in that many bits, signed or unsigned. The bits shown are the lowest ones, which is what a fixed-width integer would keep after overflowing.',
    },
    {
      question: 'What is the difference between `>>>` and `>>`?',
      answer:
        '**A >>> B (logical)** shifts in zeros from the left. **A >> B (arithmetic)** copies the sign bit, so negative numbers stay negative. Both work within the selected **Width**.',
    },
  ],
};

export default docs;
