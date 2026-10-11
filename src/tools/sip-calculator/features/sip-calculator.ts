// SIP and lump-sum compound growth. Monthly SIP uses rate/12 per month (the usual mutual-fund calculator convention).

export interface YearRow {
  year: number;
  invested: number;
  value: number;
}

export type Timing = 'start' | 'end';

/** Monthly SIP; the instalment grows by stepUpPct after every 12 payments. */
export function sip(monthly: number, annualPct: number, years: number, stepUpPct = 0, timing: Timing = 'start'): YearRow[] {
  const r = annualPct / 100 / 12;
  const rows: YearRow[] = [];
  let value = 0;
  let invested = 0;
  let pay = monthly;
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      value = timing === 'start' ? (value + pay) * (1 + r) : value * (1 + r) + pay;
      invested += pay;
    }
    rows.push({ year: y, invested, value });
    pay *= 1 + stepUpPct / 100;
  }
  return rows;
}

/** One-off investment compounded `perYear` times a year. */
export function lumpSum(principal: number, annualPct: number, years: number, perYear: number): YearRow[] {
  const rows: YearRow[] = [];
  for (let y = 1; y <= years; y++) rows.push({ year: y, invested: principal, value: principal * (1 + annualPct / 100 / perYear) ** (perYear * y) });
  return rows;
}

/** Today's money equivalent of a future amount after `years` of inflation. */
export const inflationAdjusted = (value: number, inflationPct: number, years: number) => value / (1 + inflationPct / 100) ** years;

/** Parses a non-negative number, allowing thousands separators; returns null if invalid. */
export function parseAmount(s: string): number | null {
  const n = Number(s.replace(/[,\s_]/g, ''));
  return s.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null;
}
