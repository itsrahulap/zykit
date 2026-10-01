// Page metadata (title, description, canonical URL, structured data), shared by the running app
// (src/app/Layout.tsx) and the build step that writes a static HTML file per page (scripts/seo-plugin.ts).

import { plain } from '../tools/docsHtml';
import type { ToolDefinition, ToolDocs } from '../tools/types';
import { SITE } from './site';

export interface PageMeta {
  title: string;
  description: string;
  /** Absolute canonical URL. */
  url: string;
}

type ToolInfo = Pick<ToolDefinition, 'id' | 'name' | 'tagline' | 'description' | 'category' | 'tags'>;

export const toolUrl = (tool: Pick<ToolDefinition, 'id'>) => `${SITE.url}/tools/${tool.id}`;

export function homeMeta(): PageMeta {
  return { title: `${SITE.name} · ${SITE.tagline}`, description: SITE.description, url: `${SITE.url}/` };
}

const PRIVACY_NOTE = ' Runs in your browser; nothing is uploaded.';

export function toolMeta(tool: ToolInfo): PageMeta {
  // Search results show about 160 characters, so the privacy note is only added when it still fits.
  const withNote = `${tool.description}${PRIVACY_NOTE}`;
  return {
    title: `${tool.name}: ${tool.tagline} · ${SITE.name}`,
    description: withNote.length <= 160 ? withNote : tool.description,
    url: toolUrl(tool),
  };
}

/** schema.org JSON-LD for a tool page. */
export function toolStructuredData(tool: ToolInfo) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.description,
    url: toolUrl(tool),
    applicationCategory: ['Code', 'Data', 'Network & HTTP', 'DevOps & Config', 'Security', 'Converters'].includes(tool.category)
      ? 'DeveloperApplication'
      : 'UtilitiesApplication',
    operatingSystem: 'Any (runs in a web browser)',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    keywords: tool.tags.join(', '),
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: `${SITE.url}/` },
  };
}

/**
 * JSON-LD for a tool page: the WebApplication, a breadcrumb (Zykit › tool) and, when the tool has docs,
 * an FAQPage built from the FAQs that are visible on the page (ToolDocsSection) and in its static HTML,
 * so the markup always matches the content.
 */
export function toolPageStructuredData(tool: ToolInfo, docs?: ToolDocs) {
  const { '@context': context, ...appNode } = toolStructuredData(tool);
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE.name, item: `${SITE.url}/` },
      { '@type': 'ListItem', position: 2, name: tool.name, item: toolUrl(tool) },
    ],
  };
  const faq = docs?.faqs.length
    ? [
        {
          '@type': 'FAQPage',
          url: toolUrl(tool),
          mainEntity: docs.faqs.map((f) => ({
            '@type': 'Question',
            name: plain(f.question),
            acceptedAnswer: { '@type': 'Answer', text: plain(f.answer) },
          })),
        },
      ]
    : [];
  return { '@context': context, '@graph': [appNode, breadcrumb, ...faq] };
}

/** schema.org JSON-LD for the home page: the site plus the list of tools. */
export function homeStructuredData(tools: ToolInfo[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', name: SITE.name, url: `${SITE.url}/`, description: SITE.description },
      {
        '@type': 'ItemList',
        name: `${SITE.name} tools`,
        itemListElement: tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, url: toolUrl(t) })),
      },
    ],
  };
}
