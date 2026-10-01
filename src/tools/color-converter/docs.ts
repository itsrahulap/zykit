import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Type a colour in the **Colour** field in any supported CSS notation, or use the colour picker next to it.',
    'Read it under **Formats** in HEX, RGB, HSL, HWB, CIE Lab and LCH, OKLab, OKLCH and Display P3, and copy the one you need.',
    'In the **Contrast checker (WCAG 2.1)**, set a **Text colour** and **Background colour** (or use **Use colour as text** / **Use colour as background**) to see the ratio and pass or fail for each level.',
    'If a pair fails, pick one of the **Nearest passing colours** to fix it with the smallest change.',
    'Browse tints, shades and a **Harmony** palette, and check them in the **Colour-blindness preview**. Click any swatch to use it.',
  ],
  howItWorks:
    'The input is parsed as a CSS colour: hex with 3, 4, 6 or 8 digits, the 148 CSS named colours plus `transparent`, and `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()` and `color()` in modern (space and `/`) or legacy (comma) syntax. Hues accept `deg`, `rad`, `grad` and `turn`. Conversions use the matrices and transfer functions from CSS Color 4: sRGB to linear light, then to CIE XYZ (D65), with Bradford adaptation to D50 for Lab and LCH, and the OKLab LMS matrices for OKLab and OKLCH.\n\n' +
    'Colours outside sRGB (for example from Display P3 or a high-chroma OKLCH value) are kept exactly in Lab, LCH, OKLab, OKLCH and P3. HEX, RGB, HSL and HWB show the nearest sRGB colour, found by lowering OKLCH chroma while keeping lightness and hue.\n\n' +
    'Contrast uses the WCAG 2.1 relative-luminance formula. Translucent text is composited over the background first, and the ratio is shown truncated to two decimals but compared unrounded against 4.5:1, 7:1 and 3:1. An APCA Lc value is shown for information. Nearest passing colours keep the OKLCH hue and chroma and move lightness as little as possible. Tints and shades are mixes with white and black, harmonies rotate the HSL hue, and colour-blindness previews use the Machado, Oliveira and Fernandes (2009) model at full severity. Everything runs on the page as you type.',
  limits: [
    '`color()` accepts the `srgb`, `srgb-linear`, `display-p3`, `xyz` / `xyz-d65` and `xyz-d50` spaces only; `a98-rgb`, `prophoto-rgb` and `rec2020` are not supported.',
    'Relative colour syntax, `calc()`, `color-mix()`, `currentColor` and system colours are not recognised. The `none` keyword is read as 0.',
    'Out-of-range values are clamped: rgb() channels and alpha to 0–1 (0–255), HSL saturation and lightness to 0–100%, and negative Lab or OKLab lightness and LCH chroma to 0.',
    'The contrast checker treats the background as fully opaque; only the text colour’s alpha is used.',
    'HEX output adds an alpha byte (8 digits) only when the colour is translucent. A name is shown only when the colour exactly matches a CSS named colour.',
  ],
  privacy:
    'All parsing, conversion and contrast maths run in your browser; nothing is sent to a server or saved to browser storage. **Copy share link** puts the colour, the contrast text and background colours and the harmony choice in the link’s `#` fragment, which browsers don’t send to servers.',
  faqs: [
    {
      question: 'Why does the HEX value differ from my OKLCH or P3 colour?',
      answer:
        'HEX, RGB, HSL and HWB can only describe sRGB. When a colour is outside sRGB, the tool shows the nearest sRGB colour (chroma reduced, lightness and hue kept) and a notice tells you; the Lab, LCH, OKLab, OKLCH and P3 values stay exact.',
    },
    {
      question: 'Why does a ratio of 4.49:1 fail AA?',
      answer:
        'WCAG compares the exact ratio with 4.5:1, without rounding up. The tool also shows the ratio truncated rather than rounded, so a colour displayed as 4.49:1 really is below the threshold.',
    },
    {
      question: 'What is the APCA Lc value?',
      answer:
        'APCA is a newer contrast method that accounts for text polarity: positive values mean dark text on a light background, negative values the reverse. It is shown for information only; the pass and fail badges use WCAG 2.1.',
    },
    {
      question: 'How are the nearest passing colours chosen?',
      answer:
        'The tool keeps the colour’s OKLCH hue and chroma and searches lighter and darker for the closest lightness that reaches the target ratio, then checks that the rounded HEX value still passes.',
    },
    {
      question: 'Which colour-blindness types are simulated?',
      answer:
        'Protanopia, deuteranopia and tritanopia using the Machado (2009) matrices at full severity, plus achromatopsia (no colour vision) as greyscale by luminance. Milder forms such as protanomaly are not simulated separately.',
    },
  ],
};

export default docs;
