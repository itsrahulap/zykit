// Unbiased random numbers from the browser's CSPRNG (crypto.getRandomValues).
//
// `x % n` on a random 32-bit value favours small results whenever 2^32 is not a
// multiple of n ("modulo bias"). We avoid that with rejection sampling: values in the
// incomplete top slice of the 32-bit range are thrown away and redrawn.

/** Fills a Uint32Array with random values. Injectable so tests can supply a fake source. */
export type RandomFill = (buf: Uint32Array<ArrayBuffer>) => void;

/** getRandomValues refuses more than 65,536 bytes per call. */
const BATCH = 16_384;
const RANGE = 2 ** 32;

const cryptoFill: RandomFill = (buf) => {
  crypto.getRandomValues(buf);
};

export interface Sampler {
  /** Uniform integer in [0, max). `max` must be an integer between 1 and 2^32. */
  int(max: number): number;
}

/** Creates a sampler that draws random words in batches (much faster than one call per value). */
export function createSampler(fill: RandomFill = cryptoFill): Sampler {
  const buf = new Uint32Array(BATCH);
  let pos = BATCH;
  const next = () => {
    if (pos >= BATCH) {
      fill(buf);
      pos = 0;
    }
    return buf[pos++];
  };
  return {
    int(max) {
      if (!Number.isInteger(max) || max < 1 || max > RANGE) throw new RangeError(`max must be an integer in 1..2^32, got ${max}`);
      if (max === 1) return 0;
      // Largest multiple of max that fits in 2^32; anything at or above it is rejected.
      const limit = RANGE - (RANGE % max);
      for (;;) {
        const x = next();
        if (x < limit) return x % max;
      }
    },
  };
}

/** Picks `length` characters uniformly from `alphabet` (an array of single code points). */
export function randomFrom(alphabet: readonly string[], length: number, sampler: Sampler = createSampler()): string {
  if (alphabet.length === 0) throw new RangeError('alphabet is empty');
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[sampler.int(alphabet.length)];
  return out;
}

/** In-place Fisher–Yates shuffle using the unbiased sampler. */
export function shuffle<T>(items: T[], sampler: Sampler = createSampler()): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = sampler.int(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Entropy in bits of `length` independent uniform picks from `alphabetSize` symbols. */
export function entropyBits(alphabetSize: number, length: number): number {
  return alphabetSize > 1 && length > 0 ? length * Math.log2(alphabetSize) : 0;
}
