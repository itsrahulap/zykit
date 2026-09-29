import { afterEach, describe, expect, it } from 'vitest';
import { FAKE_URL, runInFakeWorker } from './fakeWorker';
import { mapLocations } from '../../../src/tools/js-runner/features/source';

let active: ReturnType<typeof runInFakeWorker>[] = [];
function run(code: string, opts?: Parameters<typeof runInFakeWorker>[1]) {
  const w = runInFakeWorker(code, opts);
  active.push(w);
  return w;
}
afterEach(() => {
  active.forEach((w) => w.dispose());
  active = [];
});

describe('worker runtime (serialised)', () => {
  it('forwards console levels as structured messages and reports done + idle', async () => {
    const w = run(`console.log('hi', 1, {a: 1});\nconsole.info('i');\nconsole.warn('w');\nconsole.error('e');\nconsole.debug('d');`);
    expect(w.syntaxError).toBeNull();
    await w.waitFor('idle');
    expect(w.logs().map((m) => [m.level, m.text])).toEqual([
      ['log', 'hi 1 { a: 1 }'],
      ['info', 'i'],
      ['warn', 'w'],
      ['error', 'e'],
      ['debug', 'd'],
    ]);
    const done = w.messages.find((m) => m.t === 'done');
    expect(done).toMatchObject({ t: 'done', ok: true });
    // done comes before idle
    expect(w.messages.findIndex((m) => m.t === 'done')).toBeLessThan(w.messages.findIndex((m) => m.t === 'idle'));
  });

  it('supports top-level await', async () => {
    const w = run(`const v = await new Promise((r) => setTimeout(() => r(7), 10));\nconsole.log('value', v);`);
    await w.waitFor('idle');
    expect(w.texts()).toEqual(['value 7']);
  });

  it('waits for pending timers before reporting idle, but reports done first', async () => {
    const w = run(`setTimeout(() => console.log('late'), 60);\nconsole.log('main');`);
    await w.waitFor('done');
    expect(w.messages.some((m) => m.t === 'idle')).toBe(false);
    await w.waitFor('idle');
    expect(w.texts()).toEqual(['main', 'late']);
    const idx = (t: string) => w.messages.findIndex((m) => (m.t === 'log' ? m.text === t : m.t === t));
    expect(idx('late')).toBeLessThan(idx('idle'));
  });

  it('treats cleared timers as finished, and intervals keep the run alive until cleared', async () => {
    const w = run(`const t = setTimeout(() => console.log('never'), 10000);\nclearTimeout(t);\nlet n = 0;\nconst i = setInterval(() => { if (++n === 3) { clearInterval(i); console.log('stopped at', n); } }, 5);`);
    await w.waitFor('idle');
    expect(w.texts()).toEqual(['stopped at 3']);
  });

  it('reports a rejected main body as an uncaught error with the user line', async () => {
    const w = run(`const x = 1;\nfunction boom() {\n  throw new RangeError('too big');\n}\nboom();`);
    await w.waitFor('idle');
    const done = w.messages.find((m) => m.t === 'done');
    expect(done).toMatchObject({ ok: false });
    const err = w.logs().find((m) => m.level === 'error')!;
    expect(err.text).toMatch(/^Uncaught RangeError: too big/);
    const mapped = mapLocations(err.text, FAKE_URL, w.built.lineOffset, w.built.userLines);
    expect(mapped).toContain('line 3:9');
    expect(mapped).toContain('line 5:1');
    expect(mapped).not.toContain(FAKE_URL);
  });

  it('reports errors thrown inside timers through the error event', async () => {
    const w = run(`setTimeout(() => { throw new Error('in timer'); }, 5);`);
    await w.waitFor('idle');
    expect(w.logs().find((m) => m.level === 'error')?.text).toMatch(/^Uncaught Error: in timer/);
  });

  it('reports unhandled rejections', async () => {
    const w = run(`console.log('x');`);
    await w.waitFor('idle');
    w.dispatch('unhandledrejection', { reason: new Error('nope'), preventDefault() {} });
    expect(w.texts().at(-1)).toMatch(/^Uncaught \(in promise\) Error: nope/);
  });

  it('implements count, time, assert, group, dir, clear and trace', async () => {
    const w = run(
      [
        "console.count(); console.count(); console.count('x'); console.countReset(); console.count();",
        "console.assert(1 === 1, 'fine'); console.assert(false, 'bad %s', 'thing');",
        "console.group('G'); console.log('inside'); console.group(); console.log('deeper'); console.groupEnd(); console.groupEnd(); console.log('out');",
        "console.dir('quoted');",
        "console.time('t'); console.timeEnd('t'); console.timeEnd('missing');",
        "console.trace('here');",
      ].join('\n'),
    );
    await w.waitFor('idle');
    const logs = w.logs();
    const t = logs.map((m) => m.text);
    expect(t.slice(0, 4)).toEqual(['default: 1', 'default: 2', 'x: 1', 'default: 1']);
    expect(logs[4]).toMatchObject({ level: 'error', text: 'Assertion failed: bad thing' });
    expect(logs.slice(5, 9).map((m) => [m.text, m.depth])).toEqual([
      ['G', 0],
      ['inside', 1],
      ['deeper', 2],
      ['out', 0],
    ]);
    expect(t[9]).toBe("'quoted'");
    expect(t[10]).toMatch(/^t: \d+\.\d+ ms$/);
    expect(logs[11]).toMatchObject({ level: 'warn', text: "Timer 'missing' does not exist" });
    expect(t[12]).toMatch(/^Trace: here\n/);
    expect(mapLocations(t[12], FAKE_URL, w.built.lineOffset, w.built.userLines)).toContain('line 6');

    const c = run(`console.log('a');\nconsole.clear();\nconsole.log('b');`);
    await c.waitFor('idle');
    expect(c.messages.filter((m) => m.t !== 'done' && m.t !== 'idle').map((m) => m.t)).toEqual(['log', 'clear', 'log']);
  });

  it('renders console.table as a text table', async () => {
    const w = run(`console.table([{ a: 1, b: 'x' }, { a: 2 }]);\nconsole.table(5);`);
    await w.waitFor('idle');
    const [table, plain] = w.texts();
    expect(table.split('\n')).toEqual([
      '┌─────────┬───┬─────┐',
      '│ (index) │ a │ b   │',
      '├─────────┼───┼─────┤',
      "│ 0       │ 1 │ 'x' │",
      '│ 1       │ 2 │     │',
      '└─────────┴───┴─────┘',
    ]);
    expect(plain).toBe('5');
  });

  it('caps the number of entries', async () => {
    const w = run(`for (let i = 0; i < 100; i++) console.log(i);`, { maxEntries: 10 });
    await w.waitFor('idle');
    expect(w.logs()).toHaveLength(10);
    expect(w.messages.filter((m) => m.t === 'truncated')).toHaveLength(1);
  });

  it('caps the total output size', async () => {
    const w = run(`console.log('x'.repeat(600));\nconsole.log('y'.repeat(600));\nconsole.log('z');`, { maxChars: 1000 });
    await w.waitFor('idle');
    const texts = w.texts();
    expect(texts).toHaveLength(2);
    expect(texts[1].length).toBeLessThanOrEqual(401);
    expect(w.messages.some((m) => m.t === 'truncated')).toBe(true);
  });

  it('keeps timestamps relative to the run start', async () => {
    const w = run(`console.log('a');`);
    await w.waitFor('idle');
    const at = w.logs()[0].at;
    expect(at).toBeGreaterThanOrEqual(0);
    expect(at).toBeLessThan(1000);
  });
});
