import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { SITE } from '../../config/site';

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.append(el);
  }
  el.setAttribute('content', value);
}

/**
 * Sets title, description, canonical and social tags for pages whose metadata comes from
 * their content (e.g. a lesson). Their routes set `handle.pageMeta` so the site layout
 * (usePageMeta in Layout.tsx) leaves the tags alone. `title` excludes the site name.
 */
export function useDocumentMeta({ title, description, noindex }: { title: string; description?: string; noindex?: boolean }) {
  const { pathname } = useLocation();
  useEffect(() => {
    const full = `${title} · ${SITE.name}`;
    const url = new URL(pathname, SITE.url).href;
    const desc = description ?? SITE.description;
    document.title = full;
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', url);
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', url);
    setMeta('name', 'robots', noindex ? 'noindex' : 'index, follow');
  }, [title, description, noindex, pathname]);
}
