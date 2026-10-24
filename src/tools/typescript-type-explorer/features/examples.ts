// Guided examples. Each one compiles with zero diagnostics; tests pin the resolved types the explanation promises.

export interface TypeExample {
  id: string;
  title: string;
  explanation: string;
  /** Names whose resolved types the explanation talks about. */
  lookAt: string[];
  code: string;
}

export const EXAMPLES: TypeExample[] = [
  {
    id: 'keyof',
    title: 'keyof',
    explanation: '`keyof T` is the union of T’s property names as literal types. Use it to accept only keys that exist.',
    lookAt: ['UserKey', 'name'],
    code: `interface User {
  id: number;
  name: string;
  email: string;
}

type UserKey = keyof User;

function get<K extends keyof User>(user: User, key: K) {
  return user[key];
}

declare const user: User;
const name = get(user, 'name');
`,
  },
  {
    id: 'typeof',
    title: 'typeof',
    explanation: 'In a type position, `typeof value` turns a value into its type. `as const` keeps literal types and makes everything readonly.',
    lookAt: ['Config', 'FrozenConfig'],
    code: `const config = { port: 8080, host: 'localhost' };
type Config = typeof config;

const frozen = { port: 8080, host: 'localhost' } as const;
type FrozenConfig = typeof frozen;
`,
  },
  {
    id: 'indexed-access',
    title: 'Indexed access',
    explanation: '`T[K]` looks up the type of a property. Index with a union to get several at once, or with `number` to get an array’s element type.',
    lookAt: ['Id', 'IdOrName', 'Role'],
    code: `interface User {
  id: number;
  name: string;
  roles: ('admin' | 'editor')[];
}

type Id = User['id'];
type IdOrName = User['id' | 'name'];
type Role = User['roles'][number];
`,
  },
  {
    id: 'unions-intersections',
    title: 'Unions & intersections',
    explanation: 'A union `A | B` is either; an intersection `A & B` has the members of both. Intersecting incompatible primitives gives `never`.',
    lookAt: ['Status', 'BothKeys', 'Impossible'],
    code: `type Status = 'idle' | 'loading' | 'done';

type Named = { name: string };
type Aged = { age: number };
type Both = Named & Aged;
type BothKeys = keyof Both;

const person: Both = { name: 'Ada', age: 36 };

type Impossible = string & number;
`,
  },
  {
    id: 'narrowing',
    title: 'Narrowing',
    explanation: 'Checks like `typeof`, `in` and a shared literal field narrow a union inside each branch. A `never` default proves every case is handled.',
    lookAt: ['area'],
    code: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2; // shape is the circle member here
    case 'square':
      return shape.size ** 2;
    default: {
      const unreachable: never = shape;
      return unreachable;
    }
  }
}

function describe(value: string | number) {
  if (typeof value === 'string') return value.toUpperCase();
  return value.toFixed(2);
}
`,
  },
  {
    id: 'generics',
    title: 'Generics with constraints',
    explanation: 'A type parameter is inferred from the call. `extends` constrains what it may be, so the body can rely on those members.',
    lookAt: ['longest', 'picked', 'firstId'],
    code: `function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

const picked = longest('hello', 'hi');

function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}

const firstId = first([1, 2, 3]);
`,
  },
  {
    id: 'conditional',
    title: 'Conditional types & infer',
    explanation:
      '`T extends U ? X : Y` picks a branch. On a naked type parameter it distributes over a union; wrap it in `[T]` to stop that. `infer` captures part of a matched type.',
    lookAt: ['Distributed', 'NotDistributed', 'Item', 'Unwrapped'],
    code: `type IsString<T> = T extends string ? 'yes' : 'no';
type Distributed = IsString<string | number>;

type IsStringWhole<T> = [T] extends [string] ? 'yes' : 'no';
type NotDistributed = IsStringWhole<string | number>;

type ElementOf<T> = T extends readonly (infer E)[] ? E : never;
type Item = ElementOf<string[]>;

type Unwrap<T> = T extends Promise<infer V> ? V : T;
type Unwrapped = Unwrap<Promise<boolean>>;
`,
  },
  {
    id: 'mapped',
    title: 'Mapped types',
    explanation:
      '`{ [K in keyof T]: … }` rebuilds a type key by key. `?`/`readonly` add modifiers, `-?`/`-readonly` remove them, and `as` remaps or filters keys.',
    lookAt: ['Flags', 'Mutable', 'Getters', 'OnlyStrings'],
    code: `interface Todo {
  readonly id: number;
  title: string;
  done?: boolean;
}

type Flags = { [K in keyof Todo]: boolean };
type Mutable = { -readonly [K in keyof Todo]-?: Todo[K] };
type Getters = { [K in keyof Todo as \`get\${Capitalize<K>}\`]: () => Todo[K] };
type OnlyStrings = { [K in keyof Todo as Todo[K] extends string ? K : never]: Todo[K] };
`,
  },
  {
    id: 'template-literal',
    title: 'Template literal types',
    explanation: 'Template literal types build string types. With unions they produce every combination; intrinsic helpers change case.',
    lookAt: ['Event', 'Size', 'Shout'],
    code: `type Entity = 'user' | 'post';
type Action = 'created' | 'deleted';
type Event = \`\${Entity}:\${Action}\`;

type Size = \`\${number}px\`;
const width: Size = '120px';

type Shout = Uppercase<'hello'>;
`,
  },
  {
    id: 'utility-shape',
    title: 'Partial, Required, Readonly, Pick, Omit, Record',
    explanation: 'Built-in mapped types that reshape an object type: make keys optional, required or readonly, keep or drop keys, or build one from a key union.',
    lookAt: ['Draft', 'Complete', 'Frozen', 'Preview', 'WithoutEmail', 'Scores'],
    code: `interface User {
  id: number;
  name: string;
  email?: string;
}

type Draft = Partial<User>;
type Complete = Required<User>;
type Frozen = Readonly<User>;
type Preview = Pick<User, 'id' | 'name'>;
type WithoutEmail = Omit<User, 'email'>;
type Scores = Record<'math' | 'art', number>;
`,
  },
  {
    id: 'utility-union',
    title: 'Exclude, Extract, NonNullable',
    explanation: 'Distributive conditional types that filter a union: drop members, keep members, or drop `null` and `undefined`.',
    lookAt: ['WithoutA', 'OnlyFns', 'Present'],
    code: `type Letters = 'a' | 'b' | 'c';
type WithoutA = Exclude<Letters, 'a'>;

type Mixed = string | number | (() => void);
type OnlyFns = Extract<Mixed, Function>;

type Present = NonNullable<string | null | undefined>;
`,
  },
  {
    id: 'utility-function',
    title: 'ReturnType, Parameters, Awaited, InstanceType',
    explanation: 'Utilities built on `infer`: read a function’s return and parameter types, unwrap promises recursively, or get what `new` produces.',
    lookAt: ['Result', 'Args', 'Loaded', 'Instance'],
    code: `function makeUser(name: string, age: number) {
  return { name, age };
}

type Result = ReturnType<typeof makeUser>;
type Args = Parameters<typeof makeUser>;

type Loaded = Awaited<Promise<Promise<number>>>;

class Point {
  x = 0;
  y = 0;
}
type Instance = InstanceType<typeof Point>;
`,
  },
  {
    id: 'error',
    title: 'Reading an error',
    explanation: 'The compiler reports where a type does not fit, as line:column. Fix the value (or the type) and the error disappears.',
    lookAt: ['user'],
    code: `interface User {
  id: number;
  name: string;
}

const user: User = { id: 1, name: 42 };
`,
  },
];
