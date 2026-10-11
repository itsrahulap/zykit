import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  computeTotals,
  currencyDigits,
  emptyInvoice,
  formatMoney,
  lineTotals,
  minorToDecimal,
  newItem,
  parseDraft,
  parseScaled,
  pdfSafe,
  unsupportedChars,
  type Invoice,
  type LineItem,
} from '../../../src/tools/invoice-generator/features/invoice-generator';
import { buildInvoicePdf } from '../../../src/tools/invoice-generator/features/invoice-pdf';

const item = (o: Partial<LineItem>): LineItem => ({ ...newItem(1), ...o });
const inv = (items: LineItem[], currency = 'USD'): Invoice => ({ ...emptyInvoice('2025-01-01', '2025-01-15'), items, currency });

describe('Invoice Generator', () => {
  it('parses decimals exactly', () => {
    expect(parseScaled('19.99', 2)).toBe(1999);
    expect(parseScaled('5', 2)).toBe(500);
    expect(parseScaled('.5', 2)).toBe(50);
    expect(parseScaled('', 2)).toBe(0);
    expect(parseScaled('1.005', 2)).toBeNull();
    expect(parseScaled('-1', 2)).toBeNull();
    expect(parseScaled('abc', 2)).toBeNull();
    expect(parseScaled('.', 2)).toBeNull();
  });

  it('has exact minor-unit math where floats fail', () => {
    // 0.1 + 0.2 style trap: 3 x 0.10 = 0.30 exactly.
    expect(lineTotals(item({ qty: '3', unitPrice: '0.10' }), 2).net).toBe(30);
    expect(computeTotals(inv([item({ unitPrice: '0.10' }), item({ id: 2, unitPrice: '0.20' })])).total).toBe(30);
  });

  it('rounds half up for quantity, discount and tax', () => {
    expect(lineTotals(item({ qty: '1.5', unitPrice: '0.01' }), 2).gross).toBe(2); // 1.5 cents -> 2
    const l = lineTotals(item({ qty: '1', unitPrice: '10.05', discountPercent: '10', taxPercent: '7' }), 2);
    expect(l).toMatchObject({ gross: 1005, discount: 101, net: 904, tax: 63 }); // 100.5 -> 101, 63.28 -> 63
    expect(lineTotals(item({ unitPrice: '1.00', taxPercent: '8.25' }), 2).tax).toBe(8); // 8.25 cents
    expect(lineTotals(item({ unitPrice: '0.10', taxPercent: '5' }), 2).tax).toBe(1); // 0.5 -> 1
  });

  it('groups tax per rate and sums totals', () => {
    const t = computeTotals(inv([item({ qty: '2', unitPrice: '50', taxPercent: '20' }), item({ id: 2, unitPrice: '10', taxPercent: '5' }), item({ id: 3, unitPrice: '30', taxPercent: '20', discountPercent: '50' })]));
    expect(t.subtotal).toBe(14000);
    expect(t.discount).toBe(1500);
    expect(t.taxRows).toEqual([
      { rateBp: 500, base: 1000, tax: 50 },
      { rateBp: 2000, base: 11500, tax: 2300 },
    ]);
    expect(t.tax).toBe(2350);
    expect(t.total).toBe(12500 + 2350);
    expect(t.valid).toBe(true);
  });

  it('flags invalid lines and leaves them out of the totals', () => {
    const t = computeTotals(inv([item({ unitPrice: '1.234' }), item({ id: 2, unitPrice: '5', taxPercent: '101' }), item({ id: 3, unitPrice: '2' })]));
    expect(t.valid).toBe(false);
    expect(t.lines[0].error).toMatch(/at most 2 decimals/);
    expect(t.lines[1].error).toMatch(/Tax/);
    expect(t.total).toBe(200);
  });

  it('respects currency decimals', () => {
    expect(currencyDigits('JPY')).toBe(0);
    expect(currencyDigits('KWD')).toBe(3);
    expect(computeTotals(inv([item({ unitPrice: '1500', taxPercent: '10' })], 'JPY')).total).toBe(1650);
    expect(computeTotals(inv([item({ unitPrice: '1.234' })], 'KWD')).total).toBe(1234);
    expect(lineTotals(item({ unitPrice: '1.5' }), 0).valid).toBe(false);
  });

  it('formats money exactly', () => {
    expect(minorToDecimal(123456, 2)).toBe('1234.56');
    expect(minorToDecimal(5, 2)).toBe('0.05');
    expect(minorToDecimal(1650, 0)).toBe('1650');
    expect(formatMoney(123456, 'USD', false, 'en-US')).toBe('$1,234.56');
    expect(formatMoney(123456, 'EUR', true, 'en-US')).toMatch(/^EUR\s1,234\.56$/);
    expect(formatMoney(9007199254740991, 'USD', false, 'en-US')).toBe('$90,071,992,547,409.91');
  });

  it('finds characters the standard fonts cannot draw', () => {
    const i = inv([item({ description: 'Café € – naïve' })]);
    expect(unsupportedChars(i)).toEqual([]);
    i.client.name = 'Ωmega 日本';
    expect(unsupportedChars(i)).toEqual(['Ω', '日', '本']);
    expect(pdfSafe('a b Ω')).toBe('a b ?');
  });

  it('rebuilds drafts from untrusted JSON', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft({ items: 1 })).toBeNull();
    const d = parseDraft({ seller: { name: 'A' }, client: 5, items: [{ description: 'x', qty: 3 }], currency: 'xyz', logo: { kind: 'png', dataUrl: 'javascript:alert(1)' } })!;
    expect(d.seller.name).toBe('A');
    expect(d.client.name).toBe('');
    expect(d.items[0]).toMatchObject({ description: 'x', qty: '' });
    expect(d.currency).toBe('USD');
    expect(d.logo).toBeNull();
    expect(parseDraft(JSON.parse(JSON.stringify(inv([item({ unitPrice: '4' })]))))!.items[0].unitPrice).toBe('4');
  });

  it('writes a valid PDF, including unsupported characters, across pages', async () => {
    const items = Array.from({ length: 60 }, (_, i) => item({ id: i + 1, description: `Line ${i} Ω ${'long '.repeat(30)}`, unitPrice: '9.99', taxPercent: '20' }));
    const bytes = await buildInvoicePdf({ ...inv(items), notes: 'Thanks', payment: 'IBAN 123', terms: 'Net 14' });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(1);
  });
});
