// Restores shared state defensively: only values with the same shape as the defaults are kept.

export function restore<T>(base: T, incoming: unknown): T {
  if (Array.isArray(base)) {
    if (!Array.isArray(incoming) || incoming.length > 20) return base;
    if (base.length === 0) return base;
    const tpl = base[0];
    const out = incoming.map((x) => restore(tpl, x));
    return (out.length ? out : base) as T;
  }
  if (base && typeof base === 'object') {
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return base;
    const src = incoming as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(base)) out[k] = k in src ? restore((base as Record<string, unknown>)[k], src[k]) : (base as Record<string, unknown>)[k];
    return out as T;
  }
  if (typeof incoming !== typeof base) return base;
  if (typeof base === 'number' && !Number.isFinite(incoming as number)) return base;
  if (typeof base === 'string' && (incoming as string).length > 200) return base;
  return incoming as T;
}
