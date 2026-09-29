import { it } from 'vitest';
import { diffTexts } from '../../../../src/tools/diff-checker/features/diff';
it('bench', () => {
  let s = 1; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const out: unknown[] = [];
  const a = Array.from({ length: 50000 }, () => 'line ' + Math.floor(r() * 5000));
  const b = [...a]; for (let e = 0; e < 3000; e++) { const p = Math.floor(r() * b.length); if (r() < .5) b.splice(p, 1); else b.splice(p, 0, 'x' + e); }
  let t = performance.now(); const x = diffTexts(a.join('\n'), b.join('\n')); out.push(['edits', Math.round(performance.now() - t), x.exact]);
  const c = Array.from({ length: 50000 }, () => 'line ' + Math.floor(r() * 5000));
  t = performance.now(); const y = diffTexts(a.join('\n'), c.join('\n')); out.push(['different', Math.round(performance.now() - t), y.exact]);
  const d = Array.from({ length: 50000 }, () => 'other ' + Math.floor(r() * 5000));
  t = performance.now(); const z = diffTexts(a.join('\n'), d.join('\n')); out.push(['disjoint', Math.round(performance.now() - t), z.exact]);
  throw new Error(JSON.stringify(out));
}, 60000);
