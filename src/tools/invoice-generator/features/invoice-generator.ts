// Pure logic for Invoice Generator: draft model, exact decimal totals in minor units, formatting,
// character support for the PDF's standard fonts, and draft (de)serialisation. No DOM.

export const STORAGE_KEY = 'zykit-invoice';
export const MAX_ITEMS = 200;
export const MAX_LOGO_BYTES = 1024 * 1024;
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NOK', 'DKK', 'NZD', 'SGD', 'HKD', 'MXN', 'BRL', 'ZAR', 'AED', 'KWD'];

export interface Party {
  name: string;
  address: string;
  taxId: string;
}

export interface LineItem {
  id: number;
  description: string;
  /** Decimal strings, as typed. Quantity up to 3 decimals, tax and discount percent up to 2. */
  qty: string;
  unitPrice: string;
  taxPercent: string;
  discountPercent: string;
}

export interface Logo {
  name: string;
  kind: 'png' | 'jpg';
  dataUrl: string;
}

export interface Invoice {
  seller: Party;
  client: Party;
  logo: Logo | null;
  number: string;
  date: string;
  dueDate: string;
  currency: string;
  items: LineItem[];
  notes: string;
  terms: string;
  payment: string;
}

const emptyParty = (): Party => ({ name: '', address: '', taxId: '' });

export function newItem(id: number): LineItem {
  return { id, description: '', qty: '1', unitPrice: '', taxPercent: '0', discountPercent: '0' };
}

export function emptyInvoice(today: string, dueDate: string): Invoice {
  return {
    seller: emptyParty(),
    client: emptyParty(),
    logo: null,
    number: 'INV-0001',
    date: today,
    dueDate,
    currency: 'USD',
    items: [newItem(1)],
    notes: '',
    terms: '',
    payment: '',
  };
}

/** Number of minor-unit digits for a currency (2 for USD, 0 for JPY, 3 for KWD); 2 if the code is unknown. */
export function currencyDigits(currency: string): number {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** Parses a non-negative decimal string into an integer scaled by 10^scale; null if invalid or too precise. Empty is 0. */
export function parseScaled(text: string, scale: number): number | null {
  const t = text.trim();
  if (t === '') return 0;
  const m = /^(\d{0,12})(?:\.(\d*))?$/.exec(t);
  if (!m || (m[1] === '' && !m[2])) return null;
  const frac = m[2] ?? '';
  if (frac.length > scale) return null;
  return Number(m[1] + frac.padEnd(scale, '0'));
}

/** Integer division rounding half up (inputs are never negative). */
const divRound = (n: bigint, d: bigint) => (2n * n + d) / (2n * d);

export interface LineTotals {
  valid: boolean;
  error?: string;
  /** All amounts in minor units. gross = qty * price; net = gross - discount. */
  gross: number;
  discount: number;
  net: number;
  tax: number;
  taxBp: number;
}

export function lineTotals(item: LineItem, digits: number): LineTotals {
  const qty = parseScaled(item.qty, 3);
  const price = parseScaled(item.unitPrice, digits);
  const tax = parseScaled(item.taxPercent, 2);
  const disc = parseScaled(item.discountPercent, 2);
  const bad = (error: string): LineTotals => ({ valid: false, error, gross: 0, discount: 0, net: 0, tax: 0, taxBp: 0 });
  if (qty === null) return bad('Quantity must be a number with at most 3 decimals.');
  if (price === null) return bad(`Unit price must be a number with at most ${digits} decimals.`);
  if (tax === null || tax > 10000) return bad('Tax must be 0 to 100 with at most 2 decimals.');
  if (disc === null || disc > 10000) return bad('Discount must be 0 to 100 with at most 2 decimals.');
  const gross = divRound(BigInt(qty) * BigInt(price), 1000n);
  const discount = divRound(gross * BigInt(disc), 10000n);
  const net = gross - discount;
  const taxAmount = divRound(net * BigInt(tax), 10000n);
  const out = { gross: Number(gross), discount: Number(discount), net: Number(net), tax: Number(taxAmount) };
  if (Object.values(out).some((v) => !Number.isSafeInteger(v))) return bad('This amount is too large.');
  return { valid: true, ...out, taxBp: tax };
}

export interface TaxRow {
  /** Percent in basis points (2000 = 20%). */
  rateBp: number;
  base: number;
  tax: number;
}

export interface Totals {
  lines: LineTotals[];
  subtotal: number;
  discount: number;
  net: number;
  taxRows: TaxRow[];
  tax: number;
  total: number;
  digits: number;
  valid: boolean;
}

/** Totals in minor units. Rounding is half up per line; tax is the sum of the rounded per-line tax, grouped by rate. */
export function computeTotals(inv: Pick<Invoice, 'items' | 'currency'>): Totals {
  const digits = currencyDigits(inv.currency);
  const lines = inv.items.map((i) => lineTotals(i, digits));
  const rows = new Map<number, TaxRow>();
  let subtotal = 0;
  let discount = 0;
  let net = 0;
  let tax = 0;
  for (const l of lines) {
    if (!l.valid) continue;
    subtotal += l.gross;
    discount += l.discount;
    net += l.net;
    tax += l.tax;
    if (l.taxBp > 0) {
      const r = rows.get(l.taxBp) ?? { rateBp: l.taxBp, base: 0, tax: 0 };
      r.base += l.net;
      r.tax += l.tax;
      rows.set(l.taxBp, r);
    }
  }
  return { lines, subtotal, discount, net, taxRows: [...rows.values()].sort((a, b) => a.rateBp - b.rateBp), tax, total: net + tax, digits, valid: lines.every((l) => l.valid) };
}

export const formatPercent = (bp: number) => `${bp / 100}%`;

/** Minor units to an exact decimal string, e.g. (123456, 2) -> "1234.56". */
export function minorToDecimal(minor: number, digits: number): string {
  const s = String(Math.abs(minor)).padStart(digits + 1, '0');
  const body = digits ? `${s.slice(0, -digits)}.${s.slice(-digits)}` : s;
  return minor < 0 ? `-${body}` : body;
}

/** Formats minor units with Intl. `code` shows "USD 1,234.56" instead of a symbol (always encodable in the PDF). */
export function formatMoney(minor: number, currency: string, code = false, locale?: string): string {
  const dec = minorToDecimal(minor, currencyDigits(currency));
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: code ? 'code' : 'symbol' }).format(dec as unknown as number);
  } catch {
    return `${currency} ${dec}`;
  }
}

// Characters the PDF's standard fonts (WinAnsi / Windows-1252) can draw.
const CP1252_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');

export const isEncodable = (ch: string) => {
  const c = ch.codePointAt(0)!;
  return (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || CP1252_EXTRA.has(ch) || ch === '\n' || ch === '\r' || ch === '\t';
};

export function invoiceText(inv: Invoice): string {
  const p = (x: Party) => [x.name, x.address, x.taxId].join('\n');
  return [p(inv.seller), p(inv.client), inv.number, inv.notes, inv.terms, inv.payment, ...inv.items.map((i) => i.description)].join('\n');
}

/** Distinct characters in the invoice that standard PDF fonts can't draw (they are replaced with "?"). */
export function unsupportedChars(inv: Invoice): string[] {
  return [...new Set([...invoiceText(inv)].filter((c) => !isEncodable(c)))];
}

/** Text safe for the standard fonts: unsupported characters become "?", tabs become spaces, odd spaces are normalised. */
export function pdfSafe(text: string): string {
  return [...text.replace(/[   ]/g, ' ').replace(/\t/g, '    ')].map((c) => (c === '\n' || c === '\r' || isEncodable(c) ? c : '?')).join('');
}

export const fileName = (inv: Invoice) => `${inv.number.trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'invoice'}.pdf`;

const str = (v: unknown, max = 5000) => (typeof v === 'string' ? v.slice(0, max) : '');
const party = (v: unknown): Party => {
  const o = (typeof v === 'object' && v ? v : {}) as Record<string, unknown>;
  return { name: str(o.name, 200), address: str(o.address, 1000), taxId: str(o.taxId, 100) };
};

/** Rebuilds a draft from untrusted JSON (localStorage or an imported file); null when it isn't an invoice draft. */
export function parseDraft(raw: unknown): Invoice | null {
  if (typeof raw !== 'object' || !raw) return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.items) || typeof o.seller !== 'object') return null;
  const items = o.items.slice(0, MAX_ITEMS).map((x, i): LineItem => {
    const r = (typeof x === 'object' && x ? x : {}) as Record<string, unknown>;
    return { id: i + 1, description: str(r.description, 1000), qty: str(r.qty, 20), unitPrice: str(r.unitPrice, 20), taxPercent: str(r.taxPercent, 20), discountPercent: str(r.discountPercent, 20) };
  });
  const l = (typeof o.logo === 'object' && o.logo ? o.logo : null) as Record<string, unknown> | null;
  const logo: Logo | null =
    l && (l.kind === 'png' || l.kind === 'jpg') && typeof l.dataUrl === 'string' && l.dataUrl.startsWith(`data:image/${l.kind === 'png' ? 'png' : 'jpeg'};base64,`) && l.dataUrl.length < MAX_LOGO_BYTES * 1.4
      ? { name: str(l.name, 200), kind: l.kind, dataUrl: l.dataUrl }
      : null;
  const currency = str(o.currency, 3).toUpperCase();
  return {
    seller: party(o.seller),
    client: party(o.client),
    logo,
    number: str(o.number, 60),
    date: str(o.date, 10),
    dueDate: str(o.dueDate, 10),
    currency: CURRENCIES.includes(currency) ? currency : 'USD',
    items: items.length ? items : [newItem(1)],
    notes: str(o.notes),
    terms: str(o.terms),
    payment: str(o.payment),
  };
}
