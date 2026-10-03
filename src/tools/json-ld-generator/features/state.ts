// Shared-link state: strictly shaped, size-limited strings only.

export interface FormState {
  values: Record<string, string>;
  lists: Record<string, Record<string, string>[]>;
}

const KEY = /^[A-Za-z0-9_.@-]{1,60}$/;
const MAX_LEN = 5000;
const MAX_ITEMS = 50;

const clean = (o: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!o || typeof o !== 'object' || Array.isArray(o)) return out;
  for (const [k, v] of Object.entries(o)) if (KEY.test(k) && k !== '__proto__' && typeof v === 'string' && v.length <= MAX_LEN) out[k] = v;
  return out;
};

export function restoreForm(raw: unknown): FormState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const lists: FormState['lists'] = {};
  if (r.lists && typeof r.lists === 'object' && !Array.isArray(r.lists)) {
    for (const [k, v] of Object.entries(r.lists)) if (KEY.test(k) && k !== '__proto__' && Array.isArray(v)) lists[k] = v.slice(0, MAX_ITEMS).map(clean);
  }
  return { values: clean(r.values), lists };
}
