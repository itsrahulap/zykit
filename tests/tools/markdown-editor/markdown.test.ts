import * as marked from 'marked';
import { describe, expect, it } from 'vitest';
import { applyEdit, insertTable, link, linePrefix, wrap } from '../../../src/tools/markdown-editor/features/editing';
import { countText, createMarkdownRenderer, documentTitle, previewHtml, slugify, standaloneHtml, stripInlineStyles } from '../../../src/tools/markdown-editor/features/markdown';
import { PURIFY_CONFIG } from '../../../src/tools/markdown-editor/features/sanitize';

const render = createMarkdownRenderer(marked);

describe('markdown → HTML (before sanitizing)', () => {
  it('adds prefixed, de-duplicated heading anchors', () => {
    const html = render('# Hello, *World*!\n\n## Hello World\n\n### Ünïcode 2');
    expect(html).toContain('<h1 id="md-hello-world">Hello, <em>World</em>!</h1>');
    expect(html).toContain('<h2 id="md-hello-world-1">Hello World</h2>');
    expect(html).toContain('<h3 id="md-ünïcode-2">');
    // A second render starts counting again.
    expect(render('# Hello World')).toContain('id="md-hello-world"');
  });
  it('renders GFM tables, task lists, strikethrough and autolinks', () => {
    const html = render('| a | b |\n|:-|-:|\n| 1 | 2 |\n\n- [x] done\n- [ ] todo\n\n~~old~~ www.example.com https://zykit.dev');
    expect(html).toMatch(/<table>[\s\S]*<th align="left">a<\/th>[\s\S]*<td align="right">2<\/td>/);
    expect(html).toMatch(/<input (checked="" )?disabled="" type="checkbox"[^>]*> done/);
    expect(html).toContain('<del>old</del>');
    expect(html).toContain('<a href="http://www.example.com">www.example.com</a>');
    expect(html).toContain('<a href="https://zykit.dev">https://zykit.dev</a>');
  });
  it('neutralises inline styles in raw HTML before sanitizing (avoids CSP violation noise)', () => {
    expect(stripInlineStyles('<div style="x" class=a>t</div><style>p{}</style><img/STYLE=y>')).toBe('<div data-style="x" class=a>t</div><img/data-style=y>');
    expect(render('<span style="color:red">x</span> and `style="kept in code"`')).toBe('<p><span data-style="color:red">x</span> and <code>style=&quot;kept in code&quot;</code></p>\n');
  });
  it('passes raw HTML through (so the sanitizer must run)', () => {
    expect(render('<img src=x onerror=alert(1)>')).toContain('onerror');
  });
});

describe('sanitizer config', () => {
  it('forbids scriptable and form elements and inline styles', () => {
    for (const tag of ['script', 'style', 'iframe', 'object', 'embed', 'form', 'svg', 'math']) expect(PURIFY_CONFIG.FORBID_TAGS).toContain(tag);
    expect(PURIFY_CONFIG.FORBID_ATTR).toContain('style');
    expect(PURIFY_CONFIG.USE_PROFILES).toEqual({ html: true });
  });
});

describe('helpers', () => {
  it('slugifies text', () => {
    expect(slugify('What&#39;s <code>new</code>?')).toBe('whats-new');
    expect(slugify('!!!')).toBe('section');
  });
  it('counts words and characters', () => {
    expect(countText("# Don't stop — it's 2026!\n\n- well-known")).toEqual({ words: 5, chars: 39 });
    expect(countText('😀')).toEqual({ words: 0, chars: 1 });
  });
  it('picks a document title and builds a standalone file', () => {
    expect(documentTitle('intro\n## **My** Doc ##\n')).toBe('My Doc');
    expect(documentTitle('no heading')).toBe('Document');
    const html = standaloneHtml('<A&B>', '<p>x</p>');
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain('<title>&#60;A&#38;B&#62;</title>');
    expect(html).toContain('<p>x</p>');
    expect(html).not.toMatch(/<script/i);
  });
});

describe('toolbar edits', () => {
  it('wraps and unwraps the selection', () => {
    const t = 'say hi';
    const e = wrap(t, 4, 6, '**', '**', 'bold');
    expect(applyEdit(t, e)).toBe('say **hi**');
    expect([e.selStart, e.selEnd]).toEqual([6, 8]);
    const t2 = applyEdit(t, e);
    expect(applyEdit(t2, wrap(t2, 6, 8, '**', '**', 'bold'))).toBe('say hi');
    expect(applyEdit('', wrap('', 0, 0, '_', '_', 'italic'))).toBe('_italic_');
  });
  it('inserts a link with the URL selected', () => {
    const e = link('see docs', 4, 8);
    expect(applyEdit('see docs', e)).toBe('see [docs](https://)');
    expect('see [docs](https://)'.slice(e.selStart, e.selEnd)).toBe('https://');
  });
  it('toggles line prefixes for lists, quotes and headings', () => {
    const t = 'a\nb\nc';
    expect(applyEdit(t, linePrefix(t, 0, 3, '- '))).toBe('- a\n- b\nc');
    expect(applyEdit('- a\n- b', linePrefix('- a\n- b', 0, 7, '- '))).toBe('a\nb');
    expect(applyEdit(t, linePrefix(t, 0, 5, '', true))).toBe('1. a\n2. b\n3. c');
    expect(applyEdit('> q', linePrefix('> q', 1, 1, '> '))).toBe('q');
    expect(applyEdit('# T', linePrefix('# T', 0, 0, '## '))).toBe('## T');
    expect(applyEdit('## T', linePrefix('## T', 0, 0, '## '))).toBe('T');
  });
  it('inserts a table on its own paragraph', () => {
    expect(applyEdit('text', insertTable('text', 4, 4))).toBe('text\n\n| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |\n');
  });
});

describe('previewHtml', () => {
  it('exposes document headings one level down, keeping tags and attributes', () => {
    expect(previewHtml('<h1 id="md-a">A</h1><h2>B</h2><h6>C</h6><header>x</header>')).toBe(
      '<h1 aria-level="2" id="md-a">A</h1><h2 aria-level="3">B</h2><h6 aria-level="6">C</h6><header>x</header>',
    );
  });
});
