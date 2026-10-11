// Builds the invoice PDF with pdf-lib and its standard fonts (loaded lazily). Characters the
// fonts can't draw become "?" (the page warns first); nothing here touches the network.

import { computeTotals, formatMoney, formatPercent, parseScaled, pdfSafe, type Invoice } from './invoice-generator';

const A4: [number, number] = [595.28, 841.89];
const M = 48;

export async function buildInvoicePdf(inv: Invoice): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setTitle(pdfSafe(`Invoice ${inv.number}`));
  doc.setCreator('Zykit Invoice Generator');
  const ink = rgb(0.1, 0.12, 0.16);
  const grey = rgb(0.42, 0.45, 0.5);
  const line = rgb(0.85, 0.87, 0.9);
  const money = (n: number) => pdfSafe(formatMoney(n, inv.currency, true, 'en-US'));
  const t = computeTotals(inv);

  let page = doc.addPage(A4);
  let y = A4[1] - M;
  const right = A4[0] - M;
  const width = (s: string, size: number, f = font) => f.widthOfTextAtSize(s, size);

  /** Greedy word wrap that also breaks words longer than the line. */
  const wrap = (text: string, size: number, max: number, f = font): string[] => {
    const out: string[] = [];
    for (const para of pdfSafe(text).split(/\r?\n/)) {
      let cur = '';
      for (const word of para.split(' ')) {
        let w = word;
        while (width(w, size, f) > max) {
          let n = w.length - 1;
          while (n > 1 && width(w.slice(0, n), size, f) > max) n--;
          if (cur) out.push(cur);
          cur = '';
          out.push(w.slice(0, n));
          w = w.slice(n);
        }
        const next = cur ? `${cur} ${w}` : w;
        if (width(next, size, f) > max && cur) {
          out.push(cur);
          cur = w;
        } else cur = next;
      }
      out.push(cur);
    }
    return out;
  };
  const text = (s: string, x: number, yy: number, size = 10, f = font, color = ink) => page.drawText(pdfSafe(s), { x, y: yy, size, font: f, color });
  const textRight = (s: string, xr: number, yy: number, size = 10, f = font, color = ink) => text(s, xr - width(pdfSafe(s), size, f), yy, size, f, color);
  const block = (s: string, x: number, max: number, size = 10, f = font, color = ink, gap = 14) => {
    for (const l of wrap(s, size, max, f)) {
      if (y < M + 20) newPage();
      text(l, x, y, size, f, color);
      y -= gap;
    }
  };
  const newPage = () => {
    page = doc.addPage(A4);
    y = A4[1] - M;
  };
  const ensure = (h: number) => {
    if (y - h >= M) return false;
    newPage();
    return true;
  };

  // Header: logo or seller name on the left, invoice title on the right.
  let headerBottom = y;
  if (inv.logo) {
    try {
      const bytes = Uint8Array.from(atob(inv.logo.dataUrl.split(',')[1] ?? ''), (c) => c.charCodeAt(0));
      const img = inv.logo.kind === 'png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      const s = Math.min(150 / img.width, 60 / img.height, 1);
      page.drawImage(img, { x: M, y: y - img.height * s, width: img.width * s, height: img.height * s });
      headerBottom = y - img.height * s;
    } catch {
      // A corrupt logo is left out rather than failing the whole invoice.
    }
  }
  if (headerBottom === y && inv.seller.name) {
    text(inv.seller.name.split('\n')[0], M, y - 18, 18, bold);
    headerBottom = y - 24;
  }
  textRight('INVOICE', right, y - 18, 22, bold, grey);
  let ry = y - 38;
  for (const [k, v] of [['Invoice no.', inv.number], ['Date', inv.date], ['Due date', inv.dueDate]] as const) {
    if (!v) continue;
    textRight(v, right, ry, 10, bold);
    textRight(`${k}  `, right - width(pdfSafe(v), 10, bold), ry, 10, font, grey);
    ry -= 14;
  }
  y = Math.min(headerBottom, ry) - 24;

  // Parties.
  const colW = (A4[0] - 2 * M - 24) / 2;
  const parties = [
    ['FROM', inv.seller],
    ['BILL TO', inv.client],
  ] as const;
  const top = y;
  let low = y;
  parties.forEach(([label, p], i) => {
    const x = M + i * (colW + 24);
    let py = top;
    text(label, x, py, 8, bold, grey);
    py -= 14;
    const lines = [...(p.name ? wrap(p.name, 11, colW, bold).map((l) => [l, true] as const) : []), ...(p.address ? wrap(p.address, 10, colW).map((l) => [l, false] as const) : []), ...(p.taxId ? wrap(`Tax ID: ${p.taxId}`, 10, colW).map((l) => [l, false] as const) : [])];
    for (const [l, b] of lines) {
      text(l, x, py, b ? 11 : 10, b ? bold : font);
      py -= 14;
    }
    low = Math.min(low, py);
  });
  y = low - 18;

  // Items table.
  const cols = { qty: right - 250, price: right - 175, disc: right - 110, tax: right - 62, amt: right };
  const descW = cols.qty - 52 - M - 6;
  const header = () => {
    page.drawRectangle({ x: M, y: y - 6, width: right - M, height: 20, color: rgb(0.95, 0.96, 0.97) });
    text('DESCRIPTION', M + 6, y, 8, bold, grey);
    for (const [k, l] of [['qty', 'QTY'], ['price', 'UNIT PRICE'], ['disc', 'DISC.'], ['tax', 'TAX'], ['amt', 'AMOUNT']] as const) textRight(l, cols[k], y, 8, bold, grey);
    y -= 22;
  };
  header();
  inv.items.forEach((it, i) => {
    const lt = t.lines[i];
    const desc = wrap(it.description || '-', 10, descW);
    if (ensure(desc.length * 13 + 10)) header();
    const first = y;
    desc.forEach((l, k) => text(l, M + 6, first - k * 13));
    if (lt.valid) {
      textRight(it.qty.trim() || '0', cols.qty, first);
      textRight(money(parseScaled(it.unitPrice, t.digits) ?? 0), cols.price, first);
      textRight(lt.discount ? formatPercent(parseScaled(it.discountPercent, 2) ?? 0) : '', cols.disc, first);
      textRight(formatPercent(lt.taxBp), cols.tax, first);
      textRight(money(lt.net), cols.amt, first);
    }
    y -= desc.length * 13 + 4;
    page.drawLine({ start: { x: M, y: y + 2 }, end: { x: right, y: y + 2 }, thickness: 0.5, color: line });
    y -= 8;
  });

  // Totals.
  const rows: [string, string, boolean][] = [['Subtotal', money(t.subtotal), false]];
  if (t.discount) rows.push(['Discount', `-${money(t.discount)}`, false]);
  for (const r of t.taxRows) rows.push([`Tax ${formatPercent(r.rateBp)}`, money(r.tax), false]);
  rows.push(['Total', money(t.total), true]);
  ensure(rows.length * 18 + 20);
  y -= 8;
  for (const [k, v, strong] of rows) {
    if (strong) page.drawLine({ start: { x: right - 200, y: y + 12 }, end: { x: right, y: y + 12 }, thickness: 1, color: ink });
    text(k, right - 200, y, strong ? 12 : 10, strong ? bold : font, strong ? ink : grey);
    textRight(v, right, y, strong ? 12 : 10, strong ? bold : font);
    y -= 18;
  }
  y -= 14;

  for (const [label, body] of [['PAYMENT DETAILS', inv.payment], ['NOTES', inv.notes], ['TERMS', inv.terms]] as const) {
    if (!body.trim()) continue;
    ensure(40);
    text(label, M, y, 8, bold, grey);
    y -= 14;
    block(body, M, right - M);
    y -= 10;
  }
  return doc.save();
}
