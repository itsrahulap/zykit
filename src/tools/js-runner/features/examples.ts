export type Language = 'js' | 'ts';

export interface Example {
  id: string;
  label: string;
  language: Language;
  code: string;
}

export const EXAMPLES: Example[] = [
  {
    id: 'hello',
    label: 'Hello world',
    language: 'js',
    code: `// Press Ctrl/Cmd + Enter to run
const name = 'world';
console.log(\`Hello, \${name}!\`);
console.info('Numbers:', 42, -0, NaN, 10n);
console.warn('Objects are pretty-printed:', { id: 1, tags: ['a', 'b'], nested: { ok: true } });
console.table([
  { tool: 'JS Runner', local: true },
  { tool: 'JSON Formatter', local: true },
]);
`,
  },
  {
    id: 'async',
    label: 'Async/await with setTimeout',
    language: 'js',
    code: `const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.time('total');
for (let i = 1; i <= 3; i++) {
  await sleep(300);
  console.log(\`tick \${i}\`);
}
console.timeEnd('total');

// Timers that outlive the main code still print until they finish.
setTimeout(() => console.log('a late timer, 500 ms after the main code'), 500);
`,
  },
  {
    id: 'classes',
    label: 'Classes and Maps',
    language: 'js',
    code: `class Inventory {
  #items = new Map();

  add(name, qty = 1) {
    this.#items.set(name, (this.#items.get(name) ?? 0) + qty);
    return this;
  }

  get total() {
    return [...this.#items.values()].reduce((a, b) => a + b, 0);
  }

  toMap() {
    return new Map(this.#items);
  }
}

const inv = new Inventory().add('apples', 3).add('pears').add('apples', 2);
console.log(inv.toMap());
console.log('Total items:', inv.total);
console.log(new Set(['red', 'green', 'red']));
`,
  },
  {
    id: 'generics',
    label: 'TypeScript generics',
    language: 'ts',
    code: `interface Result<T> {
  ok: boolean;
  value?: T;
  error?: string;
}

function tryParse<T = unknown>(json: string): Result<T> {
  try {
    return { ok: true, value: JSON.parse(json) as T };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

type User = { name: string; roles: string[] };

const good = tryParse<User>('{"name":"Ada","roles":["admin"]}');
const bad = tryParse<User>('{oops}');

console.log(good);
console.log(bad);
`,
  },
  {
    id: 'error',
    label: 'Error with stack trace',
    language: 'js',
    code: `function parseAge(input) {
  const age = Number(input);
  if (!Number.isInteger(age)) {
    throw new TypeError(\`Not a whole number: \${input}\`);
  }
  return age;
}

function load(values) {
  return values.map(parseAge);
}

console.log(load(['12', '40']));
console.log(load(['7', 'seven']));
`,
  },
];
