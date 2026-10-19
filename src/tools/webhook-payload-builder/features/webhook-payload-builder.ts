// Webhook test payloads: sample events, request validation, HMAC signatures in common styles, and
// the request in the cURL converter's shape so its cURL / fetch generators can be reused.

import type { HttpRequest } from '../../curl-converter/features/curl';
import { hmac } from '../../hash-generator/features/hash-generator';
import { parseJsonText, type TextError } from '../../../shared/lib/textpos';
import { bytesToHex } from '../../../shared/lib/bytes';

export type Style = 'none' | 'github' | 'stripe' | 'generic';
export type EventPreset = 'user.created' | 'payment.succeeded' | 'order.updated' | 'custom';

export const PRESETS: { value: EventPreset; label: string }[] = [
  { value: 'user.created', label: 'user.created' },
  { value: 'payment.succeeded', label: 'payment.succeeded' },
  { value: 'order.updated', label: 'order.updated' },
  { value: 'custom', label: 'Custom event' },
];

/** A sample body for an event. All data is made up (example.com addresses, test ids). */
export function samplePayload(event: EventPreset, now: Date, custom = 'thing.happened'): string {
  const at = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const id = `evt_test_${now.getTime().toString(36)}`;
  const data: Record<EventPreset, unknown> = {
    'user.created': { id: 'usr_test_1042', email: 'ada@example.com', name: 'Ada Lovelace', plan: 'free', created_at: at },
    'payment.succeeded': { id: 'pay_test_88f1', amount: 4999, currency: 'usd', customer: 'cus_test_31', description: 'Pro plan, monthly', paid_at: at },
    'order.updated': { id: 'ord_test_5521', status: 'shipped', previous_status: 'paid', items: [{ sku: 'TSHIRT-M', quantity: 2, price: 1500 }], tracking: { carrier: 'Example Post', number: 'EX123456789' }, updated_at: at },
    custom: { message: 'Replace this with your own fields' },
  };
  return JSON.stringify({ id, type: event === 'custom' ? custom : event, created: at, livemode: false, data: data[event] }, null, 2);
}

export interface Problems {
  url?: string;
  event?: string;
  headers: string[];
  body?: TextError;
}

const TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

export function validate(url: string, event: string, headers: [string, string][], body: string): Problems {
  const p: Problems = { headers: [] };
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') p.url = 'Use an http:// or https:// URL.';
  } catch {
    p.url = 'Enter a full URL, such as https://example.com/webhooks.';
  }
  if (!/^[\w.:/-]{1,100}$/.test(event)) p.event = 'Letters, digits and . _ : / - only.';
  headers.forEach(([n, v], i) => {
    if (!n && !v) return;
    if (!TOKEN.test(n)) p.headers.push(`Header ${i + 1}: “${n}” isn’t a valid header name.`);
    if (/[\r\n]/.test(v)) p.headers.push(`Header ${i + 1}: values can’t contain line breaks.`);
  });
  const parsed = parseJsonText(body);
  if (!parsed.ok) p.body = parsed.error;
  return p;
}

export const hasProblems = (p: Problems) => !!(p.url || p.event || p.body || p.headers.length);

export interface Signature {
  /** Exactly the text that was signed. */
  signed: string;
  header: [string, string];
}

const enc = new TextEncoder();

/**
 * Signs `body` with HMAC-SHA256 in the chosen style:
 * - GitHub: `X-Hub-Signature-256: sha256=<hex of HMAC(body)>`
 * - Stripe: `Stripe-Signature: t=<unix>,v1=<hex of HMAC("<unix>.<body>")>`
 * - Generic: `X-Signature: <hex of HMAC(body)>`
 */
export async function sign(style: Exclude<Style, 'none'>, secret: string, body: string, unixTime: number): Promise<Signature> {
  const signed = style === 'stripe' ? `${unixTime}.${body}` : body;
  const hex = bytesToHex(await hmac('SHA-256', enc.encode(secret), enc.encode(signed)));
  if (style === 'github') return { signed, header: ['X-Hub-Signature-256', `sha256=${hex}`] };
  if (style === 'stripe') return { signed, header: ['Stripe-Signature', `t=${unixTime},v1=${hex}`] };
  return { signed, header: ['X-Signature', hex] };
}

/** The event-name header each style's receivers usually read. */
export function eventHeader(style: Style, event: string): [string, string] {
  if (style === 'github') return ['X-GitHub-Event', event];
  return ['X-Webhook-Event', event];
}

export function buildRequest(o: { method: string; url: string; headers: [string, string][]; body: string; style: Style; event: string; signature: Signature | null }): HttpRequest {
  const headers: [string, string][] = [['Content-Type', 'application/json'], eventHeader(o.style, o.event), ...o.headers.filter(([n]) => n)];
  if (o.signature) headers.push(o.signature.header);
  return { method: o.method, url: o.url, headers, body: { kind: 'text', text: o.body } };
}
