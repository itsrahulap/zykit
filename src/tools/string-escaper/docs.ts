import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose **Escape** or **Unescape** under **Direction** and pick a **Format**, such as **JSON string**, a JavaScript, Python, Java, C, C# or Go literal, SQL, **Regular expression**, shell or PowerShell, **CSV field**, XML / HTML, **URL component** or a Unicode escape style.',
    'Paste or drop your text into **Text** (or **Escaped text** when unescaping), or press **Try an example**. The result updates as you type, and the hint under the options says where the output goes.',
    'For language string formats, tick **Escape non-ASCII too** to turn every character outside ASCII into an escape sequence.',
    'Check the round-trip note under the output, which confirms that unescaping the result gives back your text exactly. Copy or download the output, or press **Use output as input** to reverse the direction.',
  ],
  howItWorks:
    'Each format has its own escaper and parser, written to that language’s literal rules. For string literals the output is the text that goes between the quotes: backslashes, the quote character and line breaks are escaped, other control characters use the language’s hex, octal or `\\u` escapes, and `U+2028`/`U+2029` are escaped where they would break a literal. The JavaScript template format also escapes `${`, Java avoids `\\u` for line breaks and quotes, and with **Escape non-ASCII too** C writes non-ASCII as UTF-8 octal bytes.\n\n' +
    'Shell and PowerShell output is a complete quoted word, quotes included. Standard SQL doubles single quotes and MySQL uses backslash escapes. A CSV field is quoted only when it contains a quote, comma, line break or leading or trailing space (RFC 4180). XML escapes `&`, `<` and `>`, plus quotes, tabs and line breaks in attributes, and the URL format uses `encodeURIComponent`.\n\n' +
    'Unescaping reads the sequences that language accepts, including `\\x`, octal, `\\u`, `\\u{…}`, `\\U` and surrogate pairs, decodes byte escapes as UTF-8, and points to the line and column of the first invalid escape. Everything runs in your browser.',
  limits: [
    'Escaping refuses text with a lone surrogate (half of an emoji) in every format except SQL, CSV, XML / HTML, shell and PowerShell.',
    'Unescaping expects the literal’s contents without the surrounding quotes, except for shell, PowerShell and CSV, which take the whole quoted word or field. Shell input must be one word: unquoted spaces are reported.',
    'Raw and verbatim strings (Python `r"…"`, C# `@"…"`, Go backticks) aren’t supported, and unescaping a shell `"…"` word refuses an unescaped `$` or backtick rather than expanding it.',
    'XML unescaping decodes numeric references and a fixed set of common named entities (such as `&amp;`, `&nbsp;`, `&copy;`, `&mdash;`); other named entities are left as written.',
    'Opened or dropped files must be text and at most 10 MB.',
  ],
  privacy:
    'Escaping and unescaping run entirely in your browser, and nothing is uploaded or saved; the site’s Content Security Policy blocks requests to other servers. **Copy share link** puts your text, the direction, the format and the non-ASCII option in the link’s `#` fragment, which browsers don’t send to servers, so anyone with the link can read the text. **Send to…** hands text between tools through this tab’s session storage and removes it as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Should I use this to build SQL queries?',
      answer:
        'Prefer query parameters (prepared statements), which keep data and SQL apart. Escaping by hand is for when you really need a literal, for example in a migration or a one-off script. Pick **SQL (MySQL backslash)** only if your MySQL server doesn’t use `NO_BACKSLASH_ESCAPES`.',
    },
    {
      question: 'Why does the shell output include quotes?',
      answer:
        'A shell value is only safe as a complete word. In single quotes nothing is expanded, so a single quote inside has to close the quote, add an escaped `\\\'` and reopen it: `it\'s` becomes `\'it\'\\\'\'s\'`.',
    },
    {
      question: 'What is the difference between JSON and JavaScript escaping?',
      answer:
        'JSON only allows `\\"`, `\\\\`, `\\/`, `\\b`, `\\f`, `\\n`, `\\r`, `\\t` and `\\uXXXX`, so with **Escape non-ASCII too** emoji become surrogate pairs. JavaScript also accepts `\\x`, `\\v`, `\\0`, `\\u{…}` and line continuations, and escapes whichever quote you picked.',
    },
    {
      question: 'Why does the C output turn é into two escapes?',
      answer:
        'With **Escape non-ASCII too**, C and C++ get each character as its UTF-8 bytes in octal, because a plain string literal is a sequence of bytes. `é` is the two bytes `\\303\\251`.',
    },
    {
      question: 'Which characters does the regex format escape?',
      answer:
        'The metacharacters `\\ ^ $ . * + ? ( ) [ ] { } |` and `/`, so the text matches literally inside `/…/` and also with the `u` flag, which rejects unnecessary escapes.',
    },
    {
      question: 'What does the round-trip check mean?',
      answer:
        'After escaping, the output is unescaped again and compared with your text. A green check means the escaped form reads back exactly; a warning means something wouldn’t survive the round trip.',
    },
  ],
};

export default docs;
