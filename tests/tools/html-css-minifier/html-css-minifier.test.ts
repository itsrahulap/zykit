import { describe, expect, it } from 'vitest';
import { beautifyCss, beautifyHtml, minifyCss, minifyHtml } from '../../../src/tools/html-css-minifier/features/html-css-minifier';

describe('minifyCss', () => {
  it('collapses whitespace and drops the last semicolon', () => {
    expect(minifyCss('a {\n  color : red;\n  margin: 0 auto;\n}\n\nb > c , d~e { top:0 }')).toBe('a{color :red;margin:0 auto}b>c,d~e{top:0}');
  });
  it('removes comments but keeps /*! */ ones', () => {
    expect(minifyCss('/*! license */ a{/* x */color:red}/* y */')).toBe('/*! license */ a{color:red}');
  });
  it('treats a removed comment as a token separator', () => {
    expect(minifyCss('a/**/b{margin:1px/**/2px}')).toBe('a b{margin:1px 2px}');
  });
  it('keeps comment-like text in strings and urls', () => {
    expect(minifyCss('a::after{content:"/* not a comment */  ;  }"}')).toBe('a::after{content:"/* not a comment */  ;  }"}');
    expect(minifyCss("a{background:url( 'x//y.png' ) no-repeat}")).toBe("a{background:url('x//y.png') no-repeat}");
    expect(minifyCss('a{background:url(  data:image/png;base64,AA/*B==  );color:red}')).toBe('a{background:url(data:image/png;base64,AA/*B==);color:red}');
  });
  it('keeps escaped quotes inside strings', () => {
    expect(minifyCss('a{content:"a\\"  b" ;  x:y}')).toBe('a{content:"a\\"  b";x:y}');
  });
  it('keeps spaces around operators inside calc() and other functions', () => {
    expect(minifyCss('a{width:calc( 100% - 2*  (1px + 3px) );margin:calc(-1 * var(--x))}')).toBe('a{width:calc(100% - 2* (1px + 3px));margin:calc(-1 * var(--x))}');
    expect(minifyCss('a{color:rgb(0 0 0 / 50%);b:rgba( 0 , 0 ,0 , .5 )}')).toBe('a{color:rgb(0 0 0 / 50%);b:rgba(0,0,0,.5)}');
  });
  it('keeps descendant and pseudo-class spacing', () => {
    expect(minifyCss('a :hover , a:hover   b{x:y}')).toBe('a :hover,a:hover b{x:y}');
    expect(minifyCss('@media (min-width: 600px) and (max-width : 900px){a{x:y}}')).toBe('@media (min-width:600px) and (max-width :900px){a{x:y}}');
  });
  it('removes the space before !important and handles nested blocks', () => {
    expect(minifyCss('a{color:red !important;&:hover{x:y;}}')).toBe('a{color:red!important;&:hover{x:y}}');
  });
  it('does not drop a semicolon that is part of an empty custom property', () => {
    expect(minifyCss('a{--x:;}')).toBe('a{--x:;}');
  });
  it('survives unterminated strings and comments', () => {
    expect(minifyCss('a{content:"abc')).toBe('a{content:"abc');
    expect(minifyCss('a{x:y}/* open')).toBe('a{x:y}');
  });
  it('is idempotent', () => {
    const once = minifyCss('a { b : c ; } @media screen { d , e > f { g: calc(1px + 2px) } }');
    expect(minifyCss(once)).toBe(once);
  });
});

describe('beautifyCss', () => {
  it('puts one declaration per line', () => {
    expect(beautifyCss('a,b>c{color:red;margin:0 auto}@media (min-width:600px){d{x:rgba(0,0,0,.5)!important}}')).toBe(
      'a,\nb > c {\n  color: red;\n  margin: 0 auto;\n}\n\n@media (min-width: 600px) {\n  d {\n    x: rgba(0, 0, 0, .5) !important;\n  }\n}',
    );
  });
  it('keeps strings, urls and comments', () => {
    const out = beautifyCss('/* hi */a{content:"a;b{c}";background:url(data:a;b,c)}');
    expect(out).toBe('/* hi */\na {\n  content: "a;b{c}";\n  background: url(data:a;b,c);\n}');
  });
  it('supports tabs', () => {
    expect(beautifyCss('a{b:c}', '\t')).toBe('a {\n\tb: c;\n}');
  });
});

describe('minifyHtml', () => {
  it('collapses whitespace between block tags', () => {
    expect(minifyHtml('<div>\n  <p>  Hello   world  </p>\n  <p>Bye</p>\n</div>\n')).toBe('<div><p>Hello world</p><p>Bye</p></div>');
  });
  it('keeps one space between inline tags', () => {
    expect(minifyHtml('<p><b>a</b>   <i>b</i> c</p>')).toBe('<p><b>a</b> <i>b</i> c</p>');
  });
  it('removes comments but keeps conditional ones', () => {
    expect(minifyHtml('<p>a</p><!-- gone --><p>b</p>')).toBe('<p>a</p><p>b</p>');
    const cc = '<!--[if IE]><p>IE</p><![endif]-->';
    expect(minifyHtml(`<head>\n${cc}\n<!--<![endif]-->\n</head>`)).toBe(`<head>${cc}<!--<![endif]--></head>`);
  });
  it('joins text split by a removed comment without doubling the space', () => {
    expect(minifyHtml('<p>a <!-- x --> b</p>')).toBe('<p>a b</p>');
  });
  it('leaves pre, textarea, script and style content exactly as written', () => {
    const pre = '<pre>  line 1\n\n    <b>line</b>   2  \n</pre>';
    expect(minifyHtml(`<div>\n${pre}\n</div>`)).toBe(`<div>${pre}</div>`);
    const ta = '<textarea>\n  a  b\n</textarea>';
    expect(minifyHtml(ta)).toBe(ta);
    const js = '<script>\n  if (a < b) {  x = "</p>";  }  // c\n</script>';
    expect(minifyHtml(`<body>\n${js}\n</body>`)).toBe(`<body>${js}</body>`);
    const css = '<style>\n  a  {  color : red  }\n</style>';
    expect(minifyHtml(css)).toBe(css);
  });
  it('matches the closing tag of raw elements case-insensitively', () => {
    expect(minifyHtml('<PRE>  a\n</PRE>  <p>  b  </p>')).toBe('<PRE>  a\n</PRE><p>b</p>');
  });
  it('does not treat comment-like or tag-like text in attributes as markup', () => {
    const html = '<a title="<!-- not a comment -->  x  >" href="/a  b">t</a>';
    expect(minifyHtml(html)).toBe(html);
  });
  it('tidies attribute spacing but not values', () => {
    expect(minifyHtml('<input   type = "text"   disabled   value=" a  b " />')).toBe('<input type="text" disabled value=" a  b "/>');
  });
  it('keeps attribute quotes by default and drops them on request', () => {
    expect(minifyHtml('<p class="a" id="x y" data-u="a/">t</p>')).toBe('<p class="a" id="x y" data-u="a/">t</p>');
    expect(minifyHtml('<p class="a" id="x y" data-u="a/" e="">t</p>', { unquote: true })).toBe('<p class=a id="x y" data-u="a/" e="">t</p>');
  });
  it('keeps the doctype and trims document edges', () => {
    expect(minifyHtml('<!DOCTYPE html>\n<html>\n<body>\n hi \n</body>\n</html>\n')).toBe('<!DOCTYPE html><html><body>hi</body></html>');
  });
  it('treats a stray < as text and survives unterminated markup', () => {
    expect(minifyHtml('<p>1 < 2  and  3 > 2</p>')).toBe('<p>1 < 2 and 3 > 2</p>');
    expect(minifyHtml('<p>a</p>  <div class="x')).toBe('<p>a</p><div class="x');
  });
  it('is idempotent', () => {
    const once = minifyHtml('<div>\n <pre> a </pre> <span> x </span>\n <!-- c -->\n</div>');
    expect(minifyHtml(once)).toBe(once);
  });
});

describe('beautifyHtml', () => {
  it('indents blocks and keeps simple blocks on one line', () => {
    expect(beautifyHtml('<div><p>Hello <b>you</b></p><ul><li>a</li><li>b</li></ul></div>')).toBe(
      '<div>\n  <p>Hello <b>you</b></p>\n  <ul>\n    <li>a</li>\n    <li>b</li>\n  </ul>\n</div>',
    );
  });
  it('keeps pre content and comments, and formats style content', () => {
    const out = beautifyHtml('<div><!-- c --><pre> a\n  b </pre><style>a{b:c}</style></div>');
    expect(out).toBe('<div>\n  <!-- c -->\n  <pre> a\n  b </pre>\n  <style>\n    a {\n      b: c;\n    }\n  </style>\n</div>');
  });
  it('does not nest unclosed list items', () => {
    expect(beautifyHtml('<ul><li>a<li>b</ul>')).toBe('<ul>\n  <li>a\n  <li>b\n</ul>');
  });
  it('puts void block tags on their own line', () => {
    expect(beautifyHtml('<head><meta charset="utf-8"><title>T</title></head>')).toBe('<head>\n  <meta charset="utf-8">\n  <title>T</title>\n</head>');
  });
});
