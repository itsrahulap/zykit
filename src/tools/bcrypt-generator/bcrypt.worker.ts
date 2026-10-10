// Runs bcrypt off the main thread so the page stays responsive at high cost.
import { bcryptHash, bcryptVerify, type Prefix } from './features/bcrypt';

export type Body = { op: 'hash'; password: string; cost: number; prefix: Prefix; salt: Uint8Array } | { op: 'verify'; password: string; hash: string };
export type Req = Body & { id: number };
export type Res = { id: number; ok: true; hash?: string; match?: boolean | null; ms: number } | { id: number; ok: false; error: string };

self.onmessage = (e: MessageEvent<Req>) => {
  const r = e.data;
  const t = performance.now();
  try {
    if (r.op === 'hash') self.postMessage({ id: r.id, ok: true, hash: bcryptHash(r.password, r.cost, r.salt, r.prefix), ms: performance.now() - t } satisfies Res);
    else self.postMessage({ id: r.id, ok: true, match: bcryptVerify(r.password, r.hash), ms: performance.now() - t } satisfies Res);
  } catch (err) {
    self.postMessage({ id: r.id, ok: false, error: err instanceof Error ? err.message : 'bcrypt failed' } satisfies Res);
  }
};
