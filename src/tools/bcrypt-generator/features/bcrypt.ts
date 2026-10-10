// bcrypt (Provos & Mazières): EksBlowfishSetup + 64x encryption of "OrpheanBeholderScryDoubt".
// Pure and synchronous; the page runs it in a worker (bcrypt.worker.ts).

export const MIN_COST = 4;
export const MAX_COST = 15;
export const MAX_PASSWORD_BYTES = 72;
export type Prefix = '2a' | '2b' | '2y';

const B64 = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function b64Encode(b: Uint8Array): string {
  let out = '';
  for (let i = 0; i < b.length; i += 3) {
    const n = (b[i] << 16) | ((b[i + 1] ?? 0) << 8) | (b[i + 2] ?? 0);
    const chars = [n >> 18, (n >> 12) & 63, (n >> 6) & 63, n & 63];
    out += chars.slice(0, Math.min(4, b.length - i + 1)).map((c) => B64[c]).join('');
  }
  return out;
}

export function b64Decode(s: string, len: number): Uint8Array | null {
  const out = new Uint8Array(len);
  let acc = 0, bits = 0, o = 0;
  for (const ch of s) {
    const v = B64.indexOf(ch);
    if (v < 0) return null;
    acc = (acc << 6) | v;
    bits += 6;
    if (bits >= 8 && o < len) {
      bits -= 8;
      out[o++] = (acc >> bits) & 255;
    }
    acc &= 0xffff;
  }
  return o === len ? out : null;
}

/** Fractional hex digits of pi (Machin, BigInt) as 32-bit words: the Blowfish P-array then four S-boxes. */
let initial: Uint32Array | null = null;
function piWords(): Uint32Array {
  if (initial) return initial;
  const n = 1042, bits = n * 32 + 64;
  const one = 1n << BigInt(bits);
  const atanInv = (x: bigint) => {
    const x2 = x * x;
    let term = one / x, sum = term;
    for (let k = 3n, sign = -1n; term > 0n; k += 2n, sign = -sign) {
      term /= x2;
      sum += (sign * term) / k;
    }
    return sum;
  };
  const frac = 16n * atanInv(5n) - 4n * atanInv(239n) - 3n * one;
  const words = new Uint32Array(n);
  for (let i = 0; i < n; i++) words[i] = Number((frac >> BigInt(bits - 32 * (i + 1))) & 0xffffffffn);
  return (initial = words);
}

class Blowfish {
  P: Uint32Array;
  S: Uint32Array;
  constructor() {
    const w = piWords();
    this.P = w.slice(0, 18);
    this.S = w.slice(18);
  }
  private f(x: number) {
    const S = this.S;
    return ((((S[x >>> 24] + S[256 + ((x >>> 16) & 255)]) ^ S[512 + ((x >>> 8) & 255)]) + S[768 + (x & 255)]) >>> 0);
  }
  enc(l: number, r: number, out: Uint32Array, at: number) {
    const P = this.P;
    for (let i = 0; i < 16; i++) {
      l = (l ^ P[i]) >>> 0;
      r = (r ^ this.f(l)) >>> 0;
      const t = l; l = r; r = t;
    }
    out[at] = (r ^ P[17]) >>> 0; // undo the last swap
    out[at + 1] = (l ^ P[16]) >>> 0;
  }
  /** Standard Blowfish key schedule when salt is null; otherwise bcrypt's salted ExpandKey. */
  expand(key: Uint8Array, salt: Uint32Array | null) {
    let k = 0;
    for (let i = 0; i < 18; i++) {
      let w = 0;
      for (let j = 0; j < 4; j++, k = (k + 1) % key.length) w = (w << 8) | key[k];
      this.P[i] = (this.P[i] ^ w) >>> 0;
    }
    const o = new Uint32Array(2);
    let l = 0, r = 0, s = 0;
    const run = (arr: Uint32Array) => {
      for (let i = 0; i < arr.length; i += 2) {
        if (salt) { l = (l ^ salt[s]) >>> 0; r = (r ^ salt[s + 1]) >>> 0; s ^= 2; }
        this.enc(l, r, o, 0);
        [l, r] = [o[0], o[1]];
        arr[i] = l; arr[i + 1] = r;
      }
    };
    run(this.P);
    run(this.S);
  }
}

/** Password as bcrypt sees it: UTF-8 bytes + NUL terminator, cut at 72 bytes. */
export function passwordKey(password: string): Uint8Array {
  const b = new TextEncoder().encode(password);
  const key = new Uint8Array(b.length + 1);
  key.set(b);
  return key.slice(0, MAX_PASSWORD_BYTES);
}

export const passwordBytes = (password: string) => new TextEncoder().encode(password).length;

const words = (b: Uint8Array) => {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return Uint32Array.from({ length: b.length / 4 }, (_, i) => dv.getUint32(i * 4));
};

export function bcryptHash(password: string, cost: number, salt: Uint8Array, prefix: Prefix = '2b'): string {
  if (!Number.isInteger(cost) || cost < MIN_COST || cost > MAX_COST) throw new RangeError(`cost must be ${MIN_COST}-${MAX_COST}`);
  if (salt.length !== 16) throw new RangeError('salt must be 16 bytes');
  const key = passwordKey(password);
  const bf = new Blowfish();
  const sw = words(salt);
  bf.expand(key, sw);
  const saltKey = salt;
  for (let i = 0; i < 2 ** cost; i++) {
    bf.expand(key, null);
    bf.expand(saltKey, null);
  }
  const ct = words(new TextEncoder().encode('OrpheanBeholderScryDoubt'));
  for (let i = 0; i < 64; i++) for (let j = 0; j < 6; j += 2) bf.enc(ct[j], ct[j + 1], ct, j);
  const bytes = new Uint8Array(24);
  const dv = new DataView(bytes.buffer);
  ct.forEach((w, i) => dv.setUint32(i * 4, w));
  return `$${prefix}$${String(cost).padStart(2, '0')}$${b64Encode(salt)}${b64Encode(bytes.subarray(0, 23))}`;
}

export interface ParsedHash {
  prefix: Prefix;
  cost: number;
  salt: Uint8Array;
  saltText: string;
  hashText: string;
}

export function parseHash(hash: string): ParsedHash | null {
  const m = /^\$(2[aby])\$(\d\d)\$([./A-Za-z0-9]{22})([./A-Za-z0-9]{31})$/.exec(hash.trim());
  if (!m) return null;
  const cost = Number(m[2]);
  const salt = b64Decode(m[3], 16);
  if (!salt || cost < MIN_COST || cost > MAX_COST) return null;
  return { prefix: m[1] as Prefix, cost, salt, saltText: m[3], hashText: m[4] };
}

export function constantTimeEqual(a: string, b: string): boolean {
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

/** null when the hash isn't a valid bcrypt string. */
export function bcryptVerify(password: string, hash: string): boolean | null {
  const p = parseHash(hash);
  if (!p) return null;
  return constantTimeEqual(bcryptHash(password, p.cost, p.salt, p.prefix), hash.trim());
}

/** Rough time for `cost` given a measured time at another cost (work doubles per step). */
export const estimateMs = (cost: number, measuredCost: number, measuredMs: number) => measuredMs * 2 ** (cost - measuredCost);

export function formatMs(ms: number): string {
  return ms < 1000 ? `${Math.max(1, Math.round(ms))} ms` : ms < 60000 ? `${(ms / 1000).toFixed(1)} s` : `${(ms / 60000).toFixed(1)} min`;
}
