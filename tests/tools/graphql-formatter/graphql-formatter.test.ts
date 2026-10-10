import { describe, expect, it } from 'vitest';
import { formatGraphql, minifyGraphql } from '../../../src/tools/graphql-formatter/features/graphql-formatter';

const fmt = (s: string, indent: 2 | 4 | 'tab' = 2) => {
  const r = formatGraphql(s, { indent });
  if (!r.ok) throw new Error(r.error.message);
  return r.text;
};
const err = (s: string) => {
  const r = formatGraphql(s);
  if (r.ok) throw new Error('expected error');
  return r.error;
};

describe('format executable documents', () => {
  it('operations, variables, directives, aliases, args', () => {
    const src = 'query Q($id:ID!=1 @d,$l:[Int!]!){me:user(id:$id,o:{a:[1,2.5e3],b:ENUM,c:null}) @include(if:true){...F ... on A{x} ...@skip(if:false){y} name}}';
    expect(fmt(src)).toBe(
      `query Q($id: ID! = 1 @d, $l: [Int!]!) {
  me: user(id: $id, o: {a: [1, 2.5e3], b: ENUM, c: null}) @include(if: true) {
    ...F
    ... on A {
      x
    }
    ... @skip(if: false) {
      y
    }
    name
  }
}
`,
    );
  });
  it('shorthand query, fragments, indent options', () => {
    expect(fmt('{a}\nfragment F on T @x {b}', 4)).toBe('{\n    a\n}\n\nfragment F on T @x {\n    b\n}\n');
    expect(fmt('{a{b}}', 'tab')).toBe('{\n\ta {\n\t\tb\n\t}\n}\n');
  });
  it('keeps comments before items and at the end of blocks', () => {
    expect(fmt('# top\n{\n # f\n a # trailing\n}\n# end')).toBe('# top\n{\n  # f\n  a\n  # trailing\n}\n\n# end\n');
  });
  it('reports comments it could not place', () => {
    const r = formatGraphql('{a(x: # c\n 1)}');
    expect(r.ok && r.dropped).toBe(1);
  });
  it('breaks long argument lists', () => {
    const out = fmt(`{f(${'aaaa: 1, '.repeat(10)}z: 2)}`);
    expect(out.split('\n')[1]).toBe('  f(');
    expect(out).toContain('    aaaa: 1\n');
  });
  it('strings and block strings in values are kept', () => {
    expect(fmt('{a(s:"x\\"y\\u00e9", b:"""raw\n  text""")}')).toContain('b: """raw\n  text"""');
  });
});

describe('format SDL', () => {
  const sdl = `"""Users
 of the app"""
type User implements Node&Entity @key(fields:"id"){id:ID! "name" name(upper:Boolean=false,"""locale""" l:String):String @deprecated(reason:"x")
 friends(first:Int):[User!]!}
extend type Query{me:User}
interface Node{id:ID!}
union Result=|A|B
enum Color{RED @deprecated GREEN}
input In{a:Int=1 b:[String!]}
scalar Date @spec(url:"u")
directive @auth(r:Role!) repeatable on FIELD_DEFINITION|OBJECT
schema{query:Query mutation:M}
extend schema @x`;
  it('prints definitions', () => {
    expect(fmt(sdl)).toBe(`"""
Users
of the app
"""
type User implements Node & Entity @key(fields: "id") {
  id: ID!

  "name"
  name(
    upper: Boolean = false
    """locale""" l: String
  ): String @deprecated(reason: "x")
  friends(first: Int): [User!]!
}

extend type Query {
  me: User
}

interface Node {
  id: ID!
}

union Result = A | B

enum Color {
  RED @deprecated
  GREEN
}

input In {
  a: Int = 1
  b: [String!]
}

scalar Date @spec(url: "u")

directive @auth(r: Role!) repeatable on FIELD_DEFINITION | OBJECT

schema {
  query: Query
  mutation: M
}

extend schema @x
`);
  });
  it('wraps long unions', () => {
    const out = fmt(`union U = ${Array.from({ length: 12 }, (_, i) => 'Member' + i).join(' | ')}`);
    expect(out.startsWith('union U =\n  | Member0\n')).toBe(true);
  });
  it('is idempotent and minifies to an equivalent document', () => {
    const once = fmt(sdl);
    expect(fmt(once)).toBe(once);
    const q = 'query Q($a:Int=1){x(a:$a){...F y}}fragment F on T{z}';
    const min = minifyGraphql(fmt(q));
    expect(min.ok && min.text).toBe(q);
    expect(fmt((min as { text: string }).text)).toBe(fmt(q));
  });
});

describe('minify', () => {
  it('drops comments and commas, keeps needed spaces', () => {
    const r = minifyGraphql('# c\nquery  A ( $a : Int , $b: Int ) { f ( a : 1 , b : "x" ) ... on T { g } }');
    expect(r.ok && r.text).toBe('query A($a:Int$b:Int){f(a:1 b:"x")...on T{g}}');
  });
  it('separates adjacent strings', () => {
    const r = minifyGraphql('{a(x:["a" "b"])}');
    expect(r.ok && r.text).toBe('{a(x:["a" "b"])}');
  });
});

describe('errors carry line and column', () => {
  it('unexpected token', () => {
    const e = err('query {\n  a(b: )\n}');
    expect(e).toMatchObject({ line: 2, column: 8 });
    expect(e.message).toMatch(/Unexpected "\)"/);
  });
  it('unterminated selection set', () => expect(err('{ a')).toMatchObject({ line: 1, column: 4, message: expect.stringContaining('<EOF>') }));
  it('lexer errors', () => {
    expect(err('{ a(b: "x) }').message).toMatch(/Unterminated string/);
    expect(err('{ a(b: """x) }').message).toMatch(/Unterminated block string/);
    expect(err('{ a(b: 01) }').message).toMatch(/leading zero/);
    expect(err('{ a(b: 1.) }').message).toMatch(/Invalid number/);
    expect(err('{ a(b: "\\q") }').message).toMatch(/escape/);
    expect(err('{ a ? }')).toMatchObject({ line: 1, column: 5 });
    expect(err('{ a .. }').message).toMatch(/\.\.\./);
  });
  it('grammar errors', () => {
    expect(err('').message).toMatch(/<EOF>/);
    expect(err('type {a:Int}').message).toMatch(/Expected Name/);
    expect(err('type A {}').message).toMatch(/Expected Name/);
    expect(err('fragment on on T {a}').message).toMatch(/"on"/);
    expect(err('extend type A').message).toMatch(/extension/);
    expect(err('"d" query {a}').message).toMatch(/Unexpected/);
    expect(err('query { a } }').line).toBe(1);
  });
});
