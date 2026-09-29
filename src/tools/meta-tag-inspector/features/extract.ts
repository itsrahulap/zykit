// Extracts the SEO-relevant parts of an HTML document into plain data.
// The document comes from DOMParser: it is inert (no scripts run, nothing loads) and is never
// attached to the page. Everything downstream works on the plain PageMeta structure.

export interface MetaTag {
  name?: string;
  property?: string;
  httpEquiv?: string;
  charset?: string;
  content: string;
}

export interface LinkTag {
  rel: string;
  href: string;
  hreflang?: string;
  sizes?: string;
  type?: string;
}

export interface PageMeta {
  titles: string[];
  lang: string | null;
  baseHref: string | null;
  metas: MetaTag[];
  links: LinkTag[];
  jsonLd: string[];
  headings: { level: number; text: string }[];
  /** Images without alt text, capped. */
  imagesWithoutAlt: number;
  images: number;
}

const MAX_ITEMS = 500;
const clip = (s: string, n = 300) => (s.length > n ? `${s.slice(0, n)}…` : s);
const text = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

export function extractMeta(doc: Document): PageMeta {
  const attr = (el: Element, n: string) => el.getAttribute(n) ?? undefined;
  const metas: MetaTag[] = [];
  for (const m of Array.from(doc.querySelectorAll('meta')).slice(0, MAX_ITEMS)) {
    metas.push({
      name: attr(m, 'name'),
      property: attr(m, 'property'),
      httpEquiv: attr(m, 'http-equiv'),
      charset: attr(m, 'charset'),
      content: clip(attr(m, 'content') ?? '', 2000),
    });
  }
  const links: LinkTag[] = [];
  for (const l of Array.from(doc.querySelectorAll('link[rel]')).slice(0, MAX_ITEMS)) {
    links.push({ rel: (attr(l, 'rel') ?? '').toLowerCase(), href: attr(l, 'href') ?? '', hreflang: attr(l, 'hreflang'), sizes: attr(l, 'sizes'), type: attr(l, 'type') });
  }
  const imgs = Array.from(doc.querySelectorAll('img'));
  return {
    titles: Array.from(doc.querySelectorAll('title')).map((t) => clip(text(t), 1000)),
    lang: doc.documentElement.getAttribute('lang'),
    baseHref: doc.querySelector('base[href]')?.getAttribute('href') ?? null,
    metas,
    links,
    jsonLd: Array.from(doc.querySelectorAll('script[type="application/ld+json" i]'))
      .slice(0, 50)
      .map((s) => (s.textContent ?? '').slice(0, 200_000)),
    headings: Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .slice(0, MAX_ITEMS)
      .map((h) => ({ level: Number(h.tagName[1]), text: clip(text(h), 200) })),
    images: imgs.length,
    imagesWithoutAlt: imgs.filter((i) => !i.hasAttribute('alt')).length,
  };
}

/** Parses HTML without running it. Browser only. */
export function parseHtml(html: string): PageMeta {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return extractMeta(doc);
}
