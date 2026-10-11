// Pure logic for Loan / EMI Calculator: no DOM, so it's unit-testable in Node.
// All money is integer minor units (paise, cents). Each period's interest is rounded to a minor unit,
// and the final payment absorbs the leftover so the balance ends at exactly 0.

export type Frequency = 'monthly' | 'weekly' | 'fortnightly' | 'quarterly';
export const PERIODS_PER_YEAR: Record<Frequency, number> = { monthly: 12, weekly: 52, fortnightly: 26, quarterly: 4 };
export const MAX_PERIODS = 6000;

export interface LoanInput {
  principal: number; // minor units
  annualRate: number; // percent, e.g. 8.5
  periods: number; // total scheduled payments
  frequency: Frequency;
  start: string; // YYYY-MM-DD, the loan is drawn on this day
  oneOff?: { date: string; amount: number }; // minor units, paid with the first instalment on/after date
  extra?: number; // minor units added to every instalment
  prepay?: 'tenure' | 'emi'; // reduce the tenure (EMI stays) or recompute a lower EMI
}

export interface Row {
  n: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  extra: number;
  balance: number;
}

export interface Result {
  emi: number;
  rows: Row[];
  totalInterest: number;
  totalPaid: number;
}

export function periodsFor(years: number, months: number, frequency: Frequency): number {
  return Math.round(((years * 12 + months) * PERIODS_PER_YEAR[frequency]) / 12);
}

/** Level payment (unrounded) for `n` periods at per-period rate `r`; r = 0 divides evenly. */
export function pmt(principal: number, r: number, n: number): number {
  if (r === 0) return principal / n;
  const g = (1 + r) ** n;
  return (principal * r * g) / (g - 1);
}

export function addPeriods(start: string, frequency: Frequency, k: number): string {
  const [y, m, d] = start.split('-').map(Number);
  if (frequency === 'weekly' || frequency === 'fortnightly') {
    return new Date(Date.UTC(y, m - 1, d + k * (frequency === 'weekly' ? 7 : 14))).toISOString().slice(0, 10);
  }
  const t = m - 1 + k * (frequency === 'monthly' ? 1 : 3);
  const ty = y + Math.floor(t / 12);
  const tm = ((t % 12) + 12) % 12;
  const day = Math.min(d, new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate()); // 31 Jan + 1 month = end of Feb
  return new Date(Date.UTC(ty, tm, day)).toISOString().slice(0, 10);
}

export function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
}

export function amortise(input: LoanInput): Result {
  const { principal, annualRate, periods, frequency, start } = input;
  const r = annualRate / 100 / PERIODS_PER_YEAR[frequency];
  let emi = Math.round(pmt(principal, r, periods));
  let balance = principal;
  let oneOffLeft = input.oneOff && input.oneOff.amount > 0 ? input.oneOff : null;
  const rows: Row[] = [];
  let totalInterest = 0;
  let totalPaid = 0;

  for (let k = 1; balance > 0 && k <= periods; k++) {
    const date = addPeriods(start, frequency, k);
    const interest = Math.round(balance * r);
    let principalPart: number;
    let extra = 0;
    if (k >= periods || emi >= balance + interest) {
      principalPart = balance; // final payment absorbs rounding
    } else {
      principalPart = Math.max(emi - interest, 0);
      extra = input.extra ?? 0;
      if (oneOffLeft && date >= oneOffLeft.date) {
        extra += oneOffLeft.amount;
        oneOffLeft = null;
      }
      extra = Math.min(extra, balance - principalPart);
    }
    balance -= principalPart + extra;
    if (extra > 0 && balance > 0 && input.prepay === 'emi') emi = Math.round(pmt(balance, r, periods - k));
    const payment = principalPart + interest + extra;
    totalInterest += interest;
    totalPaid += payment;
    rows.push({ n: k, date, payment, principal: principalPart, interest, extra, balance });
  }
  return { emi: Math.round(pmt(principal, r, periods)), rows, totalInterest, totalPaid };
}

/** Interest and instalments saved by the prepayment options, against the same loan without them. */
export function savings(input: LoanInput, result: Result) {
  const base = amortise({ ...input, oneOff: undefined, extra: 0 });
  return { interestSaved: base.totalInterest - result.totalInterest, periodsSaved: base.rows.length - result.rows.length };
}

export interface YearSummary {
  year: number;
  principal: number;
  interest: number;
  extra: number;
  paid: number;
  balance: number;
}

/** Groups schedule rows into loan years (a year is one full cycle of payments per year). */
export function yearly(rows: Row[], frequency: Frequency): YearSummary[] {
  const out: YearSummary[] = [];
  for (const row of rows) {
    const year = Math.ceil(row.n / PERIODS_PER_YEAR[frequency]);
    let y = out[out.length - 1];
    if (!y || y.year !== year) out.push((y = { year, principal: 0, interest: 0, extra: 0, paid: 0, balance: 0 }));
    y.principal += row.principal;
    y.interest += row.interest;
    y.extra += row.extra;
    y.paid += row.payment;
    y.balance = row.balance;
  }
  return out;
}

/** Spreadsheet-safe CSV (a leading = + - @ in text is never emitted: all fields are numbers or ISO dates). */
export function toCsv(rows: Row[], digits: number): string {
  const m = (x: number) => (x / 10 ** digits).toFixed(digits);
  const head = 'Period,Date,Payment,Principal,Interest,Extra payment,Balance';
  return [head, ...rows.map((r) => [r.n, r.date, m(r.payment), m(r.principal), m(r.interest), m(r.extra), m(r.balance)].join(','))].join('\n') + '\n';
}
