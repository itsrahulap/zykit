// Pure analysis of extracted page metadata: SEO checks, social tags, JSON-LD and previews.

import type { LinkTag, PageMeta } from './extract';

export type Level = 'error' | 'warning' | 'good' | 'info';
export interface Check {
  level: Level;
  area: string;
  message: string;
}

export interface LengthCheck {
  value: string | null;
  length: number;
  min: number;
  max: number;
  state: 'missing' | 'short' | 'long' | 'ok';
}

export interface JsonLdBlock {
  index: number;
  pretty: string | null;
  types: string[];
  error?: string;
}

export interface Analysis {
  title: LengthCheck;
  description: LengthCheck;
  canonical: string | null;
  robots: string | null;
  googlebot: string | null;
  viewport: string | null;
  charset: string | null;
  lang: string | null;
  hreflang: { lang: string; href: string }[];
  icons: { rel: string; href: string; sizes?: string }[];
  og: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd: JsonLdBlock[];
  headings: { level: number; text: string }[];
  h1Count: number;
  checks: Check[];
  /** Absolute page URL if known (canonical or og:url). */
  pageUrl: string | null;
  preview: {
    title: string;
    description: string;
    url: string;
    siteName: string;
    image: string | null;
    imageAlt: string | null;
    twitterCard: string;
    twitterImage: string | null;
  };
}

export const TITLE_RANGE = [30, 60] as const;
export const DESCRIPTION_RANGE = [70, 160] as const;

function lengthCheck(value: string | null, [min, max]: readonly [number, number]): LengthCheck {
  const v = value?.trim() || null;
  const length = v ? [...v].length : 0;
  return { value: v, length, min, max, state: !v ? 'missing' : length < min ? 'short' : length > max ? 'long' : 'ok' };
}

const isAbsolute = (u: string) => /^https?:\/\//i.test(u);

/** Resolves `href` against `base` when possible; otherwise returns it unchanged. */
export function resolveUrl(href: string, base: string | null): string {
  if (!href) return href;
  try {
    return base ? new URL(href, base).href : new URL(href).href;
  } catch {
    return href;
  }
}

function collectTypes(v: unknown, out: Set<string>, depth = 0) {
  if (depth > 20 || v === null || typeof v !== 'object') return;
  if (Array.isArray(v)) {
    for (const x of v) collectTypes(x, out, depth + 1);
    return;
  }
  const o = v as Record<string, unknown>;
  const t = o['@type'];
  if (typeof t === 'string') out.add(t);
  else if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && out.add(x));
  for (const [k, val] of Object.entries(o)) if (k !== '@context') collectTypes(val, out, depth + 1);
}

export function analyzeJsonLd(blocks: string[]): JsonLdBlock[] {
  return blocks.map((raw, index) => {
    try {
      const v: unknown = JSON.parse(raw);
      const types = new Set<string>();
      collectTypes(v, types);
      return { index, pretty: JSON.stringify(v, null, 2), types: [...types] };
    } catch (e) {
      return { index, pretty: null, types: [], error: (e as Error).message };
    }
  });
}

const HREFLANG = /^(x-default|[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|\d{3}))?)$/i;

export function analyze(meta: PageMeta): Analysis {
  const checks: Check[] = [];
  const add = (level: Level, area: string, message: string) => checks.push({ level, area, message });
  const metaBy = (key: 'name' | 'property', value: string) =>
    meta.metas.filter((m) => m[key]?.toLowerCase() === value.toLowerCase()).map((m) => m.content);
  const firstMeta = (name: string) => metaBy('name', name)[0] ?? null;

  // Title
  const title = lengthCheck(meta.titles[0] ?? null, TITLE_RANGE);
  if (title.state === 'missing') add('error', 'Title', 'No <title>. Search engines show it as the result headline.');
  else if (title.state === 'short') add('warning', 'Title', `Title is ${title.length} characters; ${TITLE_RANGE[0]}–${TITLE_RANGE[1]} usually works best.`);
  else if (title.state === 'long') add('warning', 'Title', `Title is ${title.length} characters; Google usually truncates after about ${TITLE_RANGE[1]}.`);
  else add('good', 'Title', `Title length ${title.length} is in range.`);
  if (meta.titles.length > 1) add('warning', 'Title', `${meta.titles.length} <title> elements; only the first is used.`);

  // Description
  const descs = metaBy('name', 'description');
  const description = lengthCheck(descs[0] ?? null, DESCRIPTION_RANGE);
  if (description.state === 'missing') add('warning', 'Description', 'No meta description. Search engines will pick text from the page instead.');
  else if (description.state === 'short') add('warning', 'Description', `Description is ${description.length} characters; aim for ${DESCRIPTION_RANGE[0]}–${DESCRIPTION_RANGE[1]}.`);
  else if (description.state === 'long') add('warning', 'Description', `Description is ${description.length} characters; it may be cut off after about ${DESCRIPTION_RANGE[1]}.`);
  else add('good', 'Description', `Description length ${description.length} is in range.`);
  if (descs.length > 1) add('warning', 'Description', `${descs.length} meta descriptions; keep one.`);

  // Canonical and page URL
  const canonicals = meta.links.filter((l) => l.rel.split(/\s+/).includes('canonical'));
  const canonicalRaw = canonicals[0]?.href ?? null;
  const ogUrl = metaBy('property', 'og:url')[0] ?? null;
  const base0 = [canonicalRaw, ogUrl].find((u) => u && isAbsolute(u)) ?? null;
  const base = meta.baseHref ? resolveUrl(meta.baseHref, base0) : base0;
  const pageUrl = base0;
  const canonical = canonicalRaw ? resolveUrl(canonicalRaw, base) : null;
  if (!canonicalRaw) add('info', 'Canonical', 'No canonical link. Add one if the page is reachable at several URLs.');
  else {
    if (canonicals.length > 1) add('error', 'Canonical', `${canonicals.length} canonical links; search engines may ignore them all.`);
    if (!isAbsolute(canonicalRaw)) add('warning', 'Canonical', 'The canonical URL is relative. Use an absolute URL.');
    else add('good', 'Canonical', 'Canonical URL is set.');
    if (ogUrl && isAbsolute(ogUrl) && isAbsolute(canonicalRaw) && resolveUrl(ogUrl, null) !== resolveUrl(canonicalRaw, null))
      add('info', 'Canonical', 'og:url differs from the canonical URL.');
  }

  // Robots
  const robots = firstMeta('robots');
  const googlebot = firstMeta('googlebot');
  const robotsAll = `${robots ?? ''},${googlebot ?? ''}`.toLowerCase();
  if (/\b(noindex|none)\b/.test(robotsAll)) add('error', 'Robots', 'The page asks search engines not to index it (noindex).');
  if (/\bnofollow\b/.test(robotsAll)) add('warning', 'Robots', 'nofollow: links on this page will not pass ranking signals.');
  const xRobots = meta.metas.find((m) => m.httpEquiv?.toLowerCase() === 'x-robots-tag');
  if (xRobots) add('info', 'Robots', 'X-Robots-Tag in a <meta http-equiv> is ignored; it only works as an HTTP header.');

  // Viewport, charset, lang
  const viewport = firstMeta('viewport');
  if (!viewport) add('warning', 'Mobile', 'No viewport meta tag: phones will render the page zoomed out.');
  else {
    if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(viewport)) add('warning', 'Mobile', 'The viewport blocks zooming, which hurts accessibility.');
    if (!/width\s*=\s*device-width/i.test(viewport)) add('info', 'Mobile', 'The viewport doesn\'t set width=device-width.');
  }
  const charsetMeta = meta.metas.find((m) => m.charset);
  const httpEquivCt = meta.metas.find((m) => m.httpEquiv?.toLowerCase() === 'content-type')?.content.match(/charset=([^;\s]+)/i)?.[1];
  const charset = charsetMeta?.charset ?? httpEquivCt ?? null;
  if (!charset) add('warning', 'Charset', 'No <meta charset>. Declare UTF-8 early in <head>.');
  else if (charset.toLowerCase().replace('_', '-') !== 'utf-8') add('info', 'Charset', `The charset is ${charset}; UTF-8 is recommended.`);
  const lang = meta.lang?.trim() || null;
  if (!lang) add('warning', 'Language', 'No lang attribute on <html>. It helps screen readers and translation.');

  // hreflang
  const hreflang = meta.links
    .filter((l) => l.rel.split(/\s+/).includes('alternate') && l.hreflang)
    .map((l) => ({ lang: l.hreflang!, href: resolveUrl(l.href, base) }));
  if (hreflang.length) {
    const bad = hreflang.filter((h) => !HREFLANG.test(h.lang));
    if (bad.length) add('warning', 'hreflang', `Invalid hreflang value${bad.length > 1 ? 's' : ''}: ${bad.map((b) => b.lang).join(', ')}.`);
    if (!hreflang.some((h) => h.lang.toLowerCase() === 'x-default')) add('info', 'hreflang', 'No x-default alternate for users whose language is not listed.');
    if (canonical && !hreflang.some((h) => h.href === canonical)) add('info', 'hreflang', 'The alternates don\'t include this page itself (hreflang should be self-referencing).');
  }

  // Icons
  const icons = meta.links
    .filter((l: LinkTag) => l.rel.split(/\s+/).some((r) => r === 'icon' || r === 'apple-touch-icon' || r === 'mask-icon'))
    .map((l) => ({ rel: l.rel, href: resolveUrl(l.href, base), sizes: l.sizes }));
  if (!icons.some((i) => i.rel.split(/\s+/).includes('icon'))) add('info', 'Icons', 'No <link rel="icon">; browsers will request /favicon.ico.');
  if (!icons.some((i) => i.rel.includes('apple-touch-icon'))) add('info', 'Icons', 'No apple-touch-icon for iOS home screens.');

  // Open Graph
  const og: Record<string, string> = {};
  for (const m of meta.metas) {
    const p = m.property?.toLowerCase();
    if (p?.startsWith('og:') && !(p in og)) og[p] = m.content;
  }
  for (const req of ['og:title', 'og:type', 'og:image', 'og:url']) if (!og[req]) add(req === 'og:image' ? 'warning' : 'info', 'Open Graph', `Missing ${req}.`);
  if (og['og:image'] && !isAbsolute(og['og:image'])) add('warning', 'Open Graph', 'og:image should be an absolute URL.');
  if (og['og:image'] && (!og['og:image:width'] || !og['og:image:height'])) add('info', 'Open Graph', 'Add og:image:width and og:image:height so the preview renders on first share.');
  const w = Number(og['og:image:width']);
  const hgt = Number(og['og:image:height']);
  if (w && hgt && (w < 600 || hgt < 315)) add('warning', 'Open Graph', `The image is ${w}×${hgt}; large cards need at least 1200×630 (600×315 minimum).`);
  if (og['og:title'] && og['og:image']) add('good', 'Open Graph', 'Title and image are set for link previews.');

  // Twitter / X
  const twitter: Record<string, string> = {};
  for (const m of meta.metas) {
    const k = (m.name ?? m.property)?.toLowerCase();
    if (k?.startsWith('twitter:') && !(k in twitter)) twitter[k] = m.content;
  }
  const card = twitter['twitter:card'];
  if (!card) add('info', 'X / Twitter', og['og:title'] ? 'No twitter:card; X falls back to Open Graph with a small summary card.' : 'No twitter:card tags.');
  else if (!['summary', 'summary_large_image', 'app', 'player'].includes(card)) add('warning', 'X / Twitter', `Unknown twitter:card "${card}".`);

  // JSON-LD
  const jsonLd = analyzeJsonLd(meta.jsonLd);
  for (const b of jsonLd) if (b.error) add('error', 'Structured data', `JSON-LD block ${b.index + 1} is not valid JSON: ${b.error}`);
  if (jsonLd.length && jsonLd.every((b) => !b.error)) add('good', 'Structured data', `${jsonLd.length} JSON-LD block${jsonLd.length === 1 ? '' : 's'} parsed.`);

  // Headings
  const h1Count = meta.headings.filter((h) => h.level === 1).length;
  if (h1Count === 0) add('warning', 'Headings', 'No <h1> heading.');
  else if (h1Count > 1) add('info', 'Headings', `${h1Count} <h1> headings. One main heading is clearer.`);
  for (let i = 1; i < meta.headings.length; i++) {
    if (meta.headings[i].level > meta.headings[i - 1].level + 1) {
      add('info', 'Headings', `Heading levels skip from h${meta.headings[i - 1].level} to h${meta.headings[i].level}.`);
      break;
    }
  }
  if (meta.imagesWithoutAlt) add('warning', 'Images', `${meta.imagesWithoutAlt} of ${meta.images} image${meta.images === 1 ? '' : 's'} lack an alt attribute.`);

  const host = (() => {
    try {
      return pageUrl ? new URL(pageUrl).host : '';
    } catch {
      return '';
    }
  })();
  const ogImage = og['og:image'] ? resolveUrl(og['og:image'], base) : null;
  const twImage = twitter['twitter:image'] ? resolveUrl(twitter['twitter:image'], base) : ogImage;

  return {
    title,
    description,
    canonical,
    robots,
    googlebot,
    viewport,
    charset,
    lang,
    hreflang,
    icons,
    og,
    twitter,
    jsonLd,
    headings: meta.headings,
    h1Count,
    checks,
    pageUrl,
    preview: {
      title: og['og:title'] || title.value || 'Untitled page',
      description: og['og:description'] || description.value || '',
      url: canonical ?? pageUrl ?? '',
      siteName: og['og:site_name'] || host,
      image: ogImage,
      imageAlt: og['og:image:alt'] ?? null,
      twitterCard: card || 'summary',
      twitterImage: twImage,
    },
  };
}

/** Google shows roughly this many characters. */
export const truncate = (s: string, n: number) => ([...s].length > n ? `${[...s].slice(0, n - 1).join('').trimEnd()}…` : s);

export const SAMPLE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Handmade Ceramic Mugs | Clay &amp; Co. Pottery Studio</title>
  <meta name="description" content="Wheel-thrown stoneware mugs, glazed by hand in small batches. Dishwasher safe, shipped plastic-free across Europe.">
  <link rel="canonical" href="https://clay.example/mugs">
  <link rel="alternate" hreflang="en" href="https://clay.example/mugs">
  <link rel="alternate" hreflang="de" href="https://clay.example/de/tassen">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Handmade Ceramic Mugs">
  <meta property="og:description" content="Wheel-thrown stoneware mugs, glazed by hand in small batches.">
  <meta property="og:image" content="https://clay.example/img/mugs-og.jpg">
  <meta property="og:url" content="https://clay.example/mugs">
  <meta property="og:site_name" content="Clay &amp; Co.">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Product","name":"Stoneware mug","offers":{"@type":"Offer","price":"28.00","priceCurrency":"EUR"}}
  </script>
</head>
<body>
  <h1>Ceramic mugs</h1>
  <h2>Glazes</h2>
  <h3>Speckled white</h3>
  <img src="/img/mug.jpg">
</body>
</html>`;
