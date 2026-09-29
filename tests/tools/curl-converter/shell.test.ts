import { describe, expect, it } from 'vitest';
import { shellQuote, tokenizeShell } from '../../../src/tools/curl-converter/features/shell';

const words = (s: string, windows?: boolean) => {
  const r = tokenizeShell(s, windows === undefined ? {} : { windows });
  if (r.error) throw new Error(r.error);
  return r.words.map((w) => (w.operator ? `<${w.value}>` : w.value));
};

describe('tokenizeShell (POSIX)', () => {
  it('splits on whitespace', () => {
    expect(words('curl  -X\tPOST   https://a.b')).toEqual(['curl', '-X', 'POST', 'https://a.b']);
  });

  it('keeps single-quoted text literally', () => {
    expect(words(`echo 'a "b" \\n $x'`)).toEqual(['echo', 'a "b" \\n $x']);
  });

  it('handles escapes inside double quotes', () => {
    expect(words(`echo "a \\"b\\" \\\\ \\$x \\n"`)).toEqual(['echo', 'a "b" \\ $x \\n']);
  });

  it('joins adjacent quoted and unquoted parts', () => {
    expect(words(`a'b'"c"d`)).toEqual(['abcd']);
    expect(words(`'it'\\''s'`)).toEqual(["it's"]);
  });

  it('decodes $\'…\' ANSI-C strings', () => {
    expect(words(`$'a\\nb\\t\\'q\\' \\x41\\u00e9\\101\\\\'`)).toEqual(["a\nb\t'q' Aé" + 'A\\']);
    expect(words(`$'\\U0001F600'`)).toEqual(['😀']);
  });

  it('removes backslash-newline continuations', () => {
    expect(words('curl \\\n  -H a \\\r\n  url')).toEqual(['curl', '-H', 'a', 'url']);
  });

  it('treats an unquoted backslash as an escape', () => {
    expect(words('a\\ b c\\"d')).toEqual(['a b', 'c"d']);
  });

  it('keeps empty quoted arguments', () => {
    expect(words(`a '' ""`)).toEqual(['a', '', '']);
  });

  it('skips comments only at the start of a word', () => {
    expect(words('a # comment\nb c#d')).toEqual(['a', 'b', 'c#d']);
  });

  it('returns control operators separately', () => {
    expect(words('curl x | jq . && echo ok; y > f')).toEqual(['curl', 'x', '<|>', 'jq', '.', '<&&>', 'echo', 'ok', '<;>', 'y', '<>>', 'f']);
    expect(words("curl 'a|b;c'")).toEqual(['curl', 'a|b;c']);
  });

  it('reports unterminated quotes', () => {
    expect(tokenizeShell("curl 'abc").error).toMatch(/single quote/);
    expect(tokenizeShell('curl "abc').error).toMatch(/double quote/);
    expect(tokenizeShell("curl $'abc").error).toMatch(/\$'/);
  });

  it('keeps multi-line quoted values', () => {
    expect(words(`-d '{\n  "a": 1\n}'`)).toEqual(['-d', '{\n  "a": 1\n}']);
  });
});

describe('tokenizeShell (Windows cmd)', () => {
  it('auto-detects ^ continuations and ^" quoting (Chrome "Copy as cURL (cmd)")', () => {
    const cmd = 'curl ^"https://api.example.com/x?a=1^&b=2^" ^\n  -H ^"accept: */*^" ^\n  --data-raw ^"^{^\\^"a^\\^":1^}^"';
    expect(words(cmd)).toEqual(['curl', 'https://api.example.com/x?a=1&b=2', '-H', 'accept: */*', '--data-raw', '{"a":1}']);
  });

  it('treats single quotes literally and keeps ^ inside double quotes', () => {
    expect(words(`curl "a ^ b" 'c'`, true)).toEqual(['curl', 'a ^ b', "'c'"]);
  });

  it('handles \\" inside double quotes', () => {
    expect(words('curl -d "{\\"a\\": 1}" url', true)).toEqual(['curl', '-d', '{"a": 1}', 'url']);
  });
});

describe('shellQuote', () => {
  it('leaves safe words bare', () => {
    expect(shellQuote('https://a.b/c?d')).toBe("'https://a.b/c?d'");
    expect(shellQuote('https://a.b/c')).toBe('https://a.b/c');
    expect(shellQuote('POST')).toBe('POST');
  });

  it('single-quotes everything else and escapes single quotes', () => {
    expect(shellQuote('')).toBe("''");
    expect(shellQuote('a b')).toBe("'a b'");
    expect(shellQuote("it's")).toBe(`'it'\\''s'`);
    expect(shellQuote('$HOME `x` "y"')).toBe(`'$HOME \`x\` "y"'`);
  });

  it('round-trips through the tokenizer', () => {
    for (const s of ["it's", 'a\nb', '$x', '"q"', '\\', '{"a":[1,2]}', "''", 'a b  c', '#hash', '&&;|']) {
      expect(words(`x ${shellQuote(s)}`)).toEqual(['x', s]);
    }
  });
});
