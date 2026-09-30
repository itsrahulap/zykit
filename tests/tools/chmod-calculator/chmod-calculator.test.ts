import { describe, expect, it } from 'vitest';
import {
  applyChmod,
  applyUmask,
  describeMode,
  lsString,
  parseOctal,
  parseSymbolic,
  toChmodSymbolic,
  toOctal,
  toSymbolic,
  warnings,
} from '../../../src/tools/chmod-calculator/features/chmod-calculator';

const apply = (start: number, expr: string, opts = {}) => {
  const r = applyChmod(start, expr, opts);
  if (!r.ok) throw new Error(r.error);
  return toOctal(r.value, 4);
};

describe('octal and symbolic', () => {
  it('converts both ways', () => {
    expect(toSymbolic(0o755)).toBe('rwxr-xr-x');
    expect(toSymbolic(0o644)).toBe('rw-r--r--');
    expect(toSymbolic(0o4755)).toBe('rwsr-xr-x');
    expect(toSymbolic(0o4644)).toBe('rwSr--r--');
    expect(toSymbolic(0o2755)).toBe('rwxr-sr-x');
    expect(toSymbolic(0o1777)).toBe('rwxrwxrwt');
    expect(toSymbolic(0o1776)).toBe('rwxrwxrwT');
    expect(toSymbolic(0o2754 | 0o1000)).toBe('rwxr-sr-T');
    expect(toOctal(0o755)).toBe('755');
    expect(toOctal(0o4755)).toBe('4755');
    expect(toOctal(0o755, 4)).toBe('0755');
    expect(lsString(0o755, true)).toBe('drwxr-xr-x');
  });

  it('parses octal', () => {
    expect(parseOctal('755')).toEqual({ ok: true, value: 0o755 });
    expect(parseOctal('0755')).toEqual({ ok: true, value: 0o755 });
    expect(parseOctal('4755')).toEqual({ ok: true, value: 0o4755 });
    expect(parseOctal('0o644')).toEqual({ ok: true, value: 0o644 });
    expect(parseOctal('789').ok).toBe(false);
    expect(parseOctal('77777').ok).toBe(false);
  });

  it('parses symbolic and ls -l strings', () => {
    expect(parseSymbolic('rwxr-sr-t')).toEqual({ ok: true, value: { mode: 0o3755 } });
    expect(parseSymbolic('-rwSr--r--')).toEqual({ ok: true, value: { mode: 0o4644, type: '-' } });
    expect(parseSymbolic('drwxrwxrwt')).toEqual({ ok: true, value: { mode: 0o1777, type: 'd' } });
    expect(parseSymbolic('-rw-r--r--.').ok).toBe(true);
    expect(parseSymbolic('rwxr-xr-')).toMatchObject({ ok: false });
    expect(parseSymbolic('rwxr-xr-s')).toMatchObject({ ok: false });
    expect(parseSymbolic('qrwxr-xr-x')).toMatchObject({ ok: false });
    for (let m = 0; m <= 0o7777; m += 0o111) expect(parseSymbolic(toSymbolic(m))).toEqual({ ok: true, value: { mode: m } });
  });
});

describe('applyChmod', () => {
  it('adds, removes and sets', () => {
    expect(apply(0o644, 'u+x')).toBe('0744');
    expect(apply(0o777, 'g-w,o-w')).toBe('0755');
    expect(apply(0o777, 'go-w')).toBe('0755');
    expect(apply(0o755, 'o=r')).toBe('0754');
    expect(apply(0o755, 'u+x,g-w,o=r')).toBe('0754');
    expect(apply(0o000, 'a+r')).toBe('0444');
    expect(apply(0o644, 'a=rw,o-w')).toBe('0664');
    expect(apply(0o600, 'u=rwx,go=u-w')).toBe('0755');
    expect(apply(0o640, 'o=g')).toBe('0644');
    expect(apply(0o754, 'u-x+s')).toBe('4654');
    expect(apply(0o755, '644')).toBe('0644');
  });

  it('handles X, s and t', () => {
    expect(apply(0o644, 'a+X')).toBe('0644');
    expect(apply(0o744, 'a+X')).toBe('0755');
    expect(apply(0o644, 'a+X', { isDir: true })).toBe('0755');
    expect(apply(0o755, 'u+s')).toBe('4755');
    expect(apply(0o755, 'g+s')).toBe('2755');
    expect(apply(0o755, 'ug+s')).toBe('6755');
    expect(apply(0o777, '+t')).toBe('1777');
    expect(apply(0o777, 'o+t')).toBe('1777');
    expect(apply(0o777, 'u+t')).toBe('0777'); // t only applies to others / all
    expect(apply(0o4755, 'u=rwx')).toBe('0755');
    expect(apply(0o2755, 'g=rx', { isDir: true })).toBe('2755');
  });

  it('masks who-less clauses with the umask', () => {
    expect(apply(0o000, '+rwx', { umask: 0o022 })).toBe('0755');
    expect(apply(0o000, 'a+rwx', { umask: 0o022 })).toBe('0777');
    expect(apply(0o777, '=r', { umask: 0o022 })).toBe('0444');
  });

  it('rejects bad expressions', () => {
    expect(applyChmod(0, 'z+x').ok).toBe(false);
    expect(applyChmod(0, 'u+q').ok).toBe(false);
    expect(applyChmod(0, 'u+gx').ok).toBe(false);
    expect(applyChmod(0, '').ok).toBe(false);
    expect(applyChmod(0, 'u+x,,g+w').ok).toBe(false);
  });
});

describe('helpers', () => {
  it('builds symbolic chmod arguments', () => {
    expect(toChmodSymbolic(0o755)).toBe('u=rwx,go=rx');
    expect(toChmodSymbolic(0o777)).toBe('a=rwx');
    expect(toChmodSymbolic(0o640)).toBe('u=rw,g=r,o=');
    expect(toChmodSymbolic(0o4755)).toBe('u=rwxs,go=rx');
    expect(toChmodSymbolic(0o1777)).toBe('u=rwx,g=rwx,o=rwxt');
  });

  it('applies a umask', () => {
    expect(applyUmask(0o022)).toEqual({ file: 0o644, dir: 0o755 });
    expect(applyUmask(0o077)).toEqual({ file: 0o600, dir: 0o700 });
    expect(applyUmask(0o002)).toEqual({ file: 0o664, dir: 0o775 });
  });

  it('warns and describes', () => {
    expect(warnings(0o777)[0]).toMatch(/777/);
    expect(warnings(0o646)[0]).toMatch(/Others can write/);
    expect(warnings(0o4644).some((w) => /capital S/.test(w))).toBe(true);
    expect(warnings(0o644)).toEqual([]);
    expect(describeMode(0o750)).toEqual(['Owner: read, write, execute', 'Group: read, execute', 'Others: no access']);
  });
});
