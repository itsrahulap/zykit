import { describe, expect, it } from 'vitest';
import { classOf, searchStatuses, STATUSES } from '../../../src/tools/http-status/features/statuses';

describe('status data', () => {
  it('covers the IANA registry', () => {
    const codes = new Set(STATUSES.map((s) => s.code));
    expect(codes.size).toBe(STATUSES.length);
    const required = [
      100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 306, 307, 308, 400, 401, 402, 403,
      404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500, 501,
      502, 503, 504, 505, 506, 507, 508, 510, 511,
    ];
    for (const c of required) expect(codes.has(c), `missing ${c}`).toBe(true);
  });

  it('is sorted and complete', () => {
    const codes = STATUSES.map((s) => s.code);
    expect([...codes].sort((a, b) => a - b)).toEqual(codes);
    for (const s of STATUSES) {
      expect(s.name && s.meaning && s.usage && s.rfc).toBeTruthy();
    }
  });

  it('knows key headers', () => {
    const by = (c: number) => STATUSES.find((s) => s.code === c)!;
    expect(by(429).headers).toContain('Retry-After');
    expect(by(301).headers).toContain('Location');
    expect(by(401).headers).toContain('WWW-Authenticate');
    expect(by(405).headers).toContain('Allow');
    expect(by(404).cacheable).toBe(true);
    expect(by(503).retry).toBe('yes');
  });

  it('classifies', () => {
    expect(classOf(418)).toBe('4xx');
    expect(classOf(103)).toBe('1xx');
  });
});

describe('searchStatuses', () => {
  it('finds by code and code prefix', () => {
    expect(searchStatuses('404').map((s) => s.code)).toEqual([404]);
    expect(searchStatuses('50').map((s) => s.code)).toEqual([500, 501, 502, 503, 504, 505, 506, 507, 508]);
    expect(searchStatuses('3xx').every((s) => s.code >= 300 && s.code < 400)).toBe(true);
  });

  it('finds by name and words, name matches first', () => {
    expect(searchStatuses('teapot')[0].code).toBe(418);
    expect(searchStatuses('not found')[0].code).toBe(404);
    expect(searchStatuses('rate limit').map((s) => s.code)).toContain(429);
    expect(searchStatuses('captive portal').map((s) => s.code)).toEqual([511]);
    expect(searchStatuses('retry-after').map((s) => s.code)).toContain(503);
    expect(searchStatuses('zzzz')).toEqual([]);
  });
});
