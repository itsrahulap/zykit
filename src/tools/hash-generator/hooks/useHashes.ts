import { useEffect, useState } from 'react';
import { computeAll, type HashAlg, type HashRequest } from '../features/hash';

type Outcome = { for: HashRequest; values: Partial<Record<HashAlg, Uint8Array>>; error?: undefined } | { for: HashRequest; values?: undefined; error: string };

/**
 * Hashes `req` after `delay` ms. Each result is tagged with the request it belongs to,
 * so a slow, stale computation can never replace a newer one.
 */
export function useHashes(req: HashRequest | null, delay: number) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  useEffect(() => {
    if (!req) return;
    let cancelled = false;
    const t = setTimeout(() => {
      computeAll(req).then(
        (values) => !cancelled && setOutcome({ for: req, values }),
        () => !cancelled && setOutcome({ for: req, error: 'Hashing failed in this browser.' }),
      );
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [req, delay]);

  const current = req && outcome?.for === req ? outcome : null;
  return {
    busy: !!req && !current,
    // Keep showing the last values while the next ones compute, to avoid flicker.
    values: req ? (current?.values ?? outcome?.values ?? null) : null,
    error: current?.error ?? null,
  };
}
