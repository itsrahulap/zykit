import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildRequest, hasProblems, samplePayload, sign, toFetch, validate, type EventPreset } from '../../../src/tools/webhook-payload-builder/features/webhook-payload-builder';
import { toCurl } from '../../../src/tools/curl-converter/features/fetch';
import { tokenizeShell } from '../../../src/tools/curl-converter/features/shell';

const NOW = new Date('2026-01-02T03:04:05.678Z');

describe('sample payloads', () => {
  it('are valid JSON with the event type and fictional data', () => {
    for (const e of ['user.created', 'payment.succeeded', 'order.updated', 'custom'] as EventPreset[]) {
      const body = samplePayload(e, NOW, 'my.event');
      const json = JSON.parse(body);
      expect(json.type).toBe(e === 'custom' ? 'my.event' : e);
      expect(json.created).toBe('2026-01-02T03:04:05Z');
      expect(json.livemode).toBe(false);
      expect(body).not.toMatch(/@(?!example\.com)/);
    }
  });
});

describe('validate', () => {
  const ok = samplePayload('user.created', NOW);
  it('accepts a good request', () => {
    expect(hasProblems(validate('http://localhost:3000/hook', 'user.created', [['X-Test', '1']], ok))).toBe(false);
  });
  it('reports each problem', () => {
    const p = validate('ftp://x', 'bad event!', [['Bad Name', 'v'], ['X-Ok', 'a\r\nInjected: 1'], ['', '']], '{"a":1,}');
    expect(p.url).toMatch(/http/);
    expect(p.event).toBeTruthy();
    expect(p.headers).toHaveLength(2);
    expect(p.body?.line).toBe(1);
    expect(validate('not a url', 'e', [], ok).url).toMatch(/full URL/);
  });
});

describe('sign', () => {
  it('matches GitHub’s published test vector', async () => {
    // From GitHub’s “Validating webhook deliveries” docs.
    const s = await sign('github', "It's a Secret to Everybody", 'Hello, World!', 0);
    expect(s.header).toEqual(['X-Hub-Signature-256', 'sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17']);
    expect(s.signed).toBe('Hello, World!');
  });
  it('signs "<timestamp>.<body>" for Stripe style', async () => {
    const body = samplePayload('payment.succeeded', NOW);
    const s = await sign('stripe', 'whsec_test', body, 1700000000);
    const expected = createHmac('sha256', 'whsec_test').update(`1700000000.${body}`).digest('hex');
    expect(s.signed).toBe(`1700000000.${body}`);
    expect(s.header).toEqual(['Stripe-Signature', `t=1700000000,v1=${expected}`]);
  });
  it('signs the raw body for the generic style, including unicode', async () => {
    const body = '{"name":"Zoë ✓"}';
    const s = await sign('generic', 'k', body, 0);
    expect(s.header).toEqual(['X-Signature', createHmac('sha256', 'k').update(body, 'utf8').digest('hex')]);
  });
});

describe('request output', () => {
  const body = samplePayload('order.updated', NOW);
  const make = async () => {
    const signature = await sign('github', 's3cret', body, 0);
    return buildRequest({ method: 'POST', url: 'http://localhost:3000/hook', headers: [['X-Extra', "it's"], ['', '']], body, style: 'github', event: 'order.updated', signature });
  };
  it('adds content type, event and signature headers', async () => {
    const req = await make();
    expect(req.headers.map(([n]) => n)).toEqual(['Content-Type', 'X-GitHub-Event', 'X-Extra', 'X-Hub-Signature-256']);
  });
  it('cURL sends the exact signed bytes', async () => {
    const req = await make();
    const curl = toCurl(req);
    const words = tokenizeShell(curl.replace(/\\\n/g, ' ')).words.map((w) => w.value);
    expect(words[words.indexOf('--data-raw') + 1]).toBe(body);
  });
  it('fetch code sends the exact signed bytes', async () => {
    const req = await make();
    const code = toFetch(req);
    const literal = /body: (.*),\n\}\);/.exec(code)![1];
    expect(Function(`return ${literal}`)()).toBe(body);
    expect(code).toContain("'X-Hub-Signature-256': 'sha256=");
  });
});
