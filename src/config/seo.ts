// Page metadata (title, description, canonical URL, structured data), shared by the running app
// (src/app/Layout.tsx) and the build step that writes a static HTML file per page (scripts/seo-plugin.ts).

import type { ToolDefinition } from '../tools/types';
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

export function toolMeta(tool: ToolInfo): PageMeta {
  return {
    title: `${tool.name}: ${tool.tagline} · ${SITE.name}`,
    description: `${tool.description} Runs in your browser; nothing is uploaded.`,
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
    applicationCategory: tool.category === 'Developer' ? 'DeveloperApplication' : 'UtilitiesApplication',
    operatingSystem: 'Any (runs in a web browser)',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    keywords: tool.tags.join(', '),
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: `${SITE.url}/` },
  };
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
