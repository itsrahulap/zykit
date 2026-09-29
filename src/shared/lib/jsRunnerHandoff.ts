// Hands code to the JS Runner (/tools/js-runner) from elsewhere on the site, e.g. a DSA
// solution from Learn. Stored in sessionStorage so it survives the navigation but not the tab.

export const HANDOFF_KEY = 'zykit-js-runner-handoff';
export const JS_RUNNER_PATH = '/tools/js-runner';

export interface Handoff {
  code: string;
  language: 'js' | 'ts';
}

export function writeHandoff(handoff: Handoff): boolean {
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff));
    return true;
  } catch {
    return false;
  }
}

/** Parses a stored handoff; anything malformed gives null. */
export function parseHandoff(raw: string | null): Handoff | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<Handoff>;
    if (typeof v.code !== 'string' || !v.code) return null;
    return { code: v.code, language: v.language === 'ts' ? 'ts' : 'js' };
  } catch {
    return null;
  }
}

export function readHandoff(): Handoff | null {
  try {
    return parseHandoff(sessionStorage.getItem(HANDOFF_KEY));
  } catch {
    return null;
  }
}

export function clearHandoff() {
  try {
    sessionStorage.removeItem(HANDOFF_KEY);
  } catch {
    /* ignore */
  }
}
