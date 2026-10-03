// The <meta> tags that go with the image, and their small checks.

import type { SizeDef } from './layout';

export const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export interface MetaInput {
  title: string;
  description: string;
  pageUrl: string;
  imageUrl: string;
  siteName: string;
  alt: string;
  size: SizeDef;
}

export const isAbsoluteHttpUrl = (s: string) => {
  try {
    const u = new URL(s);
    return (u.protocol === 'https:' || u.protocol === 'http:') && !!u.hostname && !/\s/.test(s);
  } catch {
    return false;
  }
};

export function ogMetaTags(i: MetaInput): string {
  const tag = (attr: 'property' | 'name', key: string, value: string | number) => (String(value).trim() === '' ? '' : `<meta ${attr}="${key}" content="${escapeAttr(String(value))}">`);
  return [
    tag('property', 'og:type', 'website'),
    tag('property', 'og:title', i.title),
    tag('property', 'og:description', i.description),
    tag('property', 'og:url', i.pageUrl),
    tag('property', 'og:site_name', i.siteName),
    tag('property', 'og:image', i.imageUrl),
    tag('property', 'og:image:width', i.size.w),
    tag('property', 'og:image:height', i.size.h),
    tag('property', 'og:image:alt', i.alt),
    tag('name', 'twitter:card', i.size.card),
    tag('name', 'twitter:title', i.title),
    tag('name', 'twitter:description', i.description),
    tag('name', 'twitter:image', i.imageUrl),
    tag('name', 'twitter:image:alt', i.alt),
  ]
    .filter(Boolean)
    .join('\n');
}

/** Hostname for the preview cards, or "example.com". */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '') || 'example.com';
  } catch {
    return 'example.com';
  }
}

export const fileName = (s: SizeDef, ext: 'png' | 'jpg') => `og-image-${s.w}x${s.h}.${ext}`;
