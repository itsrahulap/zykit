import { describe, expect, it } from 'vitest';
import { buildJsonLd, extractJsonBlocks, SAMPLE_EXISTING, toJson, toScript, validateExisting } from '../../../src/tools/json-ld-generator/features/jsonld';
import { TYPES, TYPE_BY_ID, typeForName } from '../../../src/tools/json-ld-generator/features/schemas';
import { isIsoDate, isIsoDateTime, isIsoDuration, isPrice, isUrl, splitValues, validateValue } from '../../../src/tools/json-ld-generator/features/validate';

const build = (id: string, sub?: string, values: Record<string, string> = {}, lists: Record<string, Record<string, string>[]> = {}) => {
  const def = TYPE_BY_ID[id];
  return buildJsonLd(def, sub ?? def.subtypes[0], { values, lists });
};
const example = (id: string, sub?: string) => {
  const def = TYPE_BY_ID[id];
  return build(id, sub, def.example.values, def.example.lists ?? {});
};

describe('validators', () => {
  it('checks URLs', () => {
    expect(isUrl('https://example.com/a?b=1')).toBe(true);
    expect(isUrl('example.com')).toBe(false);
    expect(isUrl('javascript:alert(1)')).toBe(false);
    expect(isUrl('https://exa mple.com')).toBe(false);
  });
  it('checks ISO dates against the calendar', () => {
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('2023-02-29')).toBe(false);
    expect(isIsoDate('2025-13-01')).toBe(false);
    expect(isIsoDate('31/03/2025')).toBe(false);
    expect(isIsoDateTime('2025-03-31T09:00:00+01:00')).toBe(true);
    expect(isIsoDateTime('2025-03-31T09:00Z')).toBe(true);
    expect(isIsoDateTime('2025-03-31T25:00')).toBe(false);
    expect(isIsoDateTime('2025-03-31 09:00')).toBe(false);
  });
  it('checks ISO durations', () => {
    for (const ok of ['PT30M', 'PT1H30M', 'P1DT2H', 'P2W', 'PT0.5S']) expect(isIsoDuration(ok), ok).toBe(true);
    for (const bad of ['P', 'PT', '30 minutes', '1H', 'PT1H2', 'P1DT']) expect(isIsoDuration(bad), bad).toBe(false);
  });
  it('checks prices, currencies, times and days', () => {
    expect(isPrice('19.99')).toBe(true);
    expect(isPrice('$19.99')).toBe(false);
    expect(isPrice('1,299.00')).toBe(false);
    expect(validateValue('currency', 'usd')).toMatch(/3-letter/);
    expect(validateValue('currency', 'USD')).toBeNull();
    expect(validateValue('time', '9:00')).not.toBeNull();
    expect(validateValue('time', '09:00')).toBeNull();
    expect(validateValue('days', 'Funday')).not.toBeNull();
    expect(splitValues('days', 'Monday, Tuesday')).toEqual(['Monday', 'Tuesday']);
    expect(splitValues('urls', 'https://a.com\n\n https://b.com ')).toEqual(['https://a.com', 'https://b.com']);
  });
});

describe('every type', () => {
  it.each(TYPES.map((t) => [t.id]))('%s: the example builds clean JSON-LD', (id) => {
    const def = TYPE_BY_ID[id];
    const { data, report } = example(id);
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe(def.subtypes[0]);
    expect(report.invalid).toEqual([]);
    expect(report.missingRequired).toEqual([]);
    expect(Object.keys(data).length).toBeGreaterThan(2);
  });
  it.each(TYPES.map((t) => [t.id]))('%s: an empty form emits no empty values and only the defined requirements', (id) => {
    const def = TYPE_BY_ID[id];
    const { data, report } = build(id);
    expect(Object.keys(data)).toEqual(['@context', '@type']);
    const hasRequired = def.fields.some((f) => f.level === 'required' && !f.when) || def.lists.some((l) => l.level === 'required') || !!def.anyOf;
    expect(report.missingRequired.length > 0).toBe(hasRequired);
  });
  it('every definition has unique keys and consistent @type names', () => {
    for (const t of TYPES) {
      const keys = t.fields.map((f) => f.key);
      expect(new Set(keys).size, t.id).toBe(keys.length);
      expect(typeForName(t.subtypes[0])?.def.id).toBe(t.id);
    }
  });
});

describe('Article', () => {
  it('nests author and publisher and keeps one image as a string', () => {
    const { data } = build('article', 'BlogPosting', { headline: 'H', image: 'https://e.com/a.jpg', 'author.name': 'A', 'publisher.logo.url': 'https://e.com/l.png', 'mainEntityOfPage.@id': 'https://e.com/p' });
    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'H',
      image: 'https://e.com/a.jpg',
      author: { '@type': 'Person', name: 'A' },
      publisher: { '@type': 'Organization', logo: { '@type': 'ImageObject', url: 'https://e.com/l.png' } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://e.com/p' },
    });
  });
  it('turns several image lines into an array and flags bad dates', () => {
    const { data, report } = build('article', 'Article', { image: 'https://e.com/1.jpg\nhttps://e.com/2.jpg', datePublished: '31-03-2025', headline: '' });
    expect(data.image).toEqual(['https://e.com/1.jpg', 'https://e.com/2.jpg']);
    expect(report.invalid[0]).toMatch(/Date published/);
    expect(report.missingRecommended).toContain('Headline');
    expect(report.missingRequired).toEqual([]);
  });
});

describe('Product', () => {
  it('requires name and at least one of offers, rating or review', () => {
    const r = build('product').report;
    expect(r.missingRequired).toContain('Product name');
    expect(r.missingRequired.some((m) => /at least one of offers/.test(m))).toBe(true);
    expect(build('product', undefined, { name: 'X', 'offers.price': '1', 'offers.priceCurrency': 'EUR' }).report.missingRequired).toEqual([]);
  });
  it('requires price and currency only once an offer is started', () => {
    const r = build('product', undefined, { name: 'X', 'offers.url': 'https://e.com/x' }).report;
    expect(r.missingRequired).toEqual(expect.arrayContaining(['Price', 'Currency']));
    expect(build('product', undefined, { name: 'X', 'aggregateRating.ratingValue': '4', 'aggregateRating.reviewCount': '3' }).report.missingRequired).toEqual([]);
  });
  it('writes Offer, AggregateRating numbers and Review items', () => {
    const { data } = example('product');
    expect(data.offers).toMatchObject({ '@type': 'Offer', price: '89.99', priceCurrency: 'USD', availability: 'https://schema.org/InStock' });
    expect(data.aggregateRating).toMatchObject({ '@type': 'AggregateRating', ratingValue: 4.6, reviewCount: 128 });
    expect(data.review).toEqual([{ '@type': 'Review', author: { '@type': 'Person', name: 'Sam' }, reviewRating: { '@type': 'Rating', ratingValue: 5 }, reviewBody: 'Great grip.' }]);
  });
  it('rejects a price with a currency symbol and a lowercase currency', () => {
    const { report } = build('product', undefined, { name: 'X', 'offers.price': '$5', 'offers.priceCurrency': 'usd' });
    expect(report.invalid).toHaveLength(2);
  });
  it('reports incomplete reviews', () => {
    const { report } = build('product', undefined, { name: 'X', 'offers.price': '1', 'offers.priceCurrency': 'USD' }, { review: [{ 'author.name': 'Sam' }] });
    expect(report.missingRequired).toContain('Review 1: Rating');
  });
});

describe('FAQPage and HowTo', () => {
  it('requires a question and answer', () => {
    expect(build('faq').report.missingRequired).toEqual(['Questions']);
    const { report } = build('faq', undefined, {}, { mainEntity: [{ name: 'Q?', 'acceptedAnswer.text': '' }] });
    expect(report.missingRequired).toEqual(['Question 1: Answer']);
  });
  it('builds Question/Answer', () => {
    expect(example('faq').data.mainEntity).toEqual([
      { '@type': 'Question', name: 'Do you ship abroad?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, to 30 countries.' } },
      { '@type': 'Question', name: 'What is the return window?', acceptedAnswer: { '@type': 'Answer', text: '30 days.' } },
    ]);
  });
  it('builds HowToStep list and validates the total time', () => {
    const { data } = example('howto');
    expect((data.step as unknown[]).length).toBe(2);
    expect((data.step as Record<string, unknown>[])[0]['@type']).toBe('HowToStep');
    expect(build('howto', undefined, { name: 'x', totalTime: '20 minutes' }, { step: [{ text: 'a' }] }).report.invalid[0]).toMatch(/Total time/);
  });
});

describe('Organization / LocalBusiness', () => {
  it('has no required fields as an Organization', () => {
    expect(build('organization', 'Organization').report.missingRequired).toEqual([]);
  });
  it('requires name and address for a LocalBusiness', () => {
    const r = build('organization', 'Restaurant').report;
    expect(r.missingRequired).toEqual(expect.arrayContaining(['Name', 'Street address', 'City']));
    expect(r.missingRecommended).toEqual(expect.arrayContaining(['Latitude', 'Opening hours']));
  });
  it('builds address, geo and opening hours', () => {
    const { data } = build('organization', 'LocalBusiness', { name: 'N', 'geo.latitude': '37.42', 'geo.longitude': '-122.08', 'address.addressCountry': 'US' }, { openingHoursSpecification: [{ dayOfWeek: 'Monday, Friday', opens: '09:00', closes: '17:00' }] });
    expect(data.geo).toEqual({ '@type': 'GeoCoordinates', latitude: 37.42, longitude: -122.08 });
    expect(data.address).toEqual({ '@type': 'PostalAddress', addressCountry: 'US' });
    expect(data.openingHoursSpecification).toEqual([{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Friday'], opens: '09:00', closes: '17:00' }]);
  });
  it('flags bad hours', () => {
    const { report } = build('organization', 'Store', { name: 'N' }, { openingHoursSpecification: [{ dayOfWeek: 'Someday', opens: '9am', closes: '17:00' }] });
    expect(report.invalid).toHaveLength(2);
  });
});

describe('Person, Event, WebSite, Breadcrumb', () => {
  it('Person has no required fields', () => {
    expect(build('person').report.missingRequired).toEqual([]);
    expect(example('person').data.worksFor).toEqual({ '@type': 'Organization', name: 'Corner Roasters' });
  });
  it('Event needs name, start and a location', () => {
    expect(build('event').report.missingRequired).toEqual(['Event name', 'Start', 'Venue name']);
    const { data } = example('event');
    expect(data.location).toMatchObject({ '@type': 'Place', name: 'Corner Roasters', address: { '@type': 'PostalAddress', streetAddress: '1 Main St' } });
  });
  it('WebSite adds SearchAction query-input and checks the placeholder', () => {
    const { data, report } = example('website');
    expect(data.potentialAction).toEqual({
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: 'https://example.com/search?q={search_term_string}' },
      'query-input': 'required name=search_term_string',
    });
    expect(report.invalid).toEqual([]);
    expect(build('website', undefined, { name: 'n', url: 'https://e.com', 'potentialAction.target.urlTemplate': 'https://e.com/s?q=' }).report.invalid[0]).toMatch(/search_term_string/);
  });
  it('BreadcrumbList numbers items and allows a last crumb without URL', () => {
    const { data, report } = example('breadcrumb');
    expect((data.itemListElement as Record<string, unknown>[]).map((i) => i.position)).toEqual([1, 2, 3]);
    expect(report.missingRequired).toEqual([]);
    expect(build('breadcrumb', undefined, {}, { itemListElement: [{ name: 'Home', item: '' }, { name: 'Page', item: '' }] }).report.missingRequired).toEqual(['Crumb 1: URL']);
    expect(build('breadcrumb', undefined, {}, { itemListElement: [{ name: 'Home', item: 'https://e.com' }] }).report.missingRequired).toContain('Breadcrumb trail: at least 2 needed');
  });
});

describe('SoftwareApplication, Recipe, JobPosting, VideoObject', () => {
  it('SoftwareApplication takes price 0 and needs a rating or review', () => {
    expect(example('software', 'WebApplication').data['@type']).toBe('WebApplication');
    expect(example('software').data.offers).toMatchObject({ price: '0' });
    const r = build('software', undefined, { name: 'A', 'offers.price': '0', 'offers.priceCurrency': 'USD' }).report;
    expect(r.missingRequired).toHaveLength(1);
  });
  it('Recipe keeps ingredient lines as an array and instructions as HowToStep', () => {
    const { data } = example('recipe');
    expect(data.recipeIngredient).toEqual(['18 g espresso', '120 ml milk']);
    expect((data.recipeInstructions as Record<string, unknown>[])[0]).toEqual({ '@type': 'HowToStep', text: 'Pull the shot.' });
    expect(build('recipe', undefined, { name: 'R', image: 'https://e.com/r.jpg', cookTime: '45 min' }).report.invalid[0]).toMatch(/Cook time/);
    expect(build('recipe', undefined, { name: 'R', recipeIngredient: 'one' }).data.recipeIngredient).toEqual(['one']);
  });
  it('JobPosting nests salary and requires a location or remote requirement', () => {
    const { data } = example('job');
    expect(data.baseSalary).toEqual({ '@type': 'MonetaryAmount', currency: 'USD', value: { '@type': 'QuantitativeValue', value: 18, unitText: 'HOUR' } });
    expect((data.jobLocation as Record<string, unknown>)['@type']).toBe('Place');
    expect(build('job', undefined, { title: 'T', description: 'D', datePosted: '2025-01-01', 'hiringOrganization.name': 'O' }).report.missingRequired).toHaveLength(1);
    const remote = build('job', undefined, { title: 'T', description: 'D', datePosted: '2025-01-01', 'hiringOrganization.name': 'O', jobLocationType: 'TELECOMMUTE', 'applicantLocationRequirements.name': 'USA' });
    expect(remote.report.missingRequired).toEqual([]);
    expect(remote.data.applicantLocationRequirements).toEqual({ '@type': 'Country', name: 'USA' });
  });
  it('JobPosting writes directApply as a boolean', () => {
    expect(build('job', undefined, { directApply: 'true' }).data.directApply).toBe(true);
  });
  it('VideoObject needs name, thumbnail and upload date; adds WatchAction views', () => {
    expect(build('video').report.missingRequired).toEqual(['Title', 'Thumbnail URLs', 'Upload date']);
    const { data } = build('video', undefined, { name: 'n', 'interactionStatistic.userInteractionCount': '1200' });
    expect(data.interactionStatistic).toEqual({ '@type': 'InteractionCounter', userInteractionCount: 1200, interactionType: { '@type': 'WatchAction' } });
  });
});

describe('script output', () => {
  it('escapes < so the JSON cannot close the script element', () => {
    const { data } = build('article', 'Article', { headline: '</script><script>alert(1)</script> <!--' });
    const out = toScript(data);
    expect(out.startsWith('<script type="application/ld+json">\n')).toBe(true);
    expect(out.endsWith('\n</script>')).toBe(true);
    expect(out.slice(35, -9)).not.toContain('<');
    expect(toJson(data)).toContain('\\u003c/script>');
    expect(JSON.parse(toJson(data)).headline).toBe('</script><script>alert(1)</script> <!--');
  });
  it('pretty prints with two spaces', () => {
    expect(toJson({ a: 1 })).toBe('{\n  "a": 1\n}');
  });
});

describe('validate existing JSON-LD', () => {
  it('extracts script blocks or raw JSON', () => {
    expect(extractJsonBlocks('<p>x</p><script type="application/ld+json">{"a":1}</script><script type=\'application/ld+json\'>{"b":2}</script>')).toEqual(['{"a":1}', '{"b":2}']);
    expect(extractJsonBlocks(' {"a":1} ')).toEqual(['{"a":1}']);
    expect(extractJsonBlocks('  ')).toEqual([]);
  });
  it('reports JSON errors', () => {
    expect(validateExisting('{"a":').error).toMatch(/Not valid JSON/);
    expect(validateExisting('').error).toBeTruthy();
  });
  it('detects the type and lists missing and invalid fields', () => {
    const r = validateExisting(SAMPLE_EXISTING);
    expect(r.nodes).toHaveLength(1);
    expect(r.nodes[0].type).toBe('Product');
    expect(r.nodes[0].report.missingRequired).toEqual([]);
    expect(r.nodes[0].report.missingRecommended).toEqual(expect.arrayContaining(['Description', 'SKU']));
    expect(r.nodes[0].report.invalid).toHaveLength(2);
  });
  it('finds missing required fields in a nested, array-valued document', () => {
    const r = validateExisting(JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', offers: [{ '@type': 'Offer', priceCurrency: 'USD' }] }));
    expect(r.nodes[0].report.missingRequired).toEqual(expect.arrayContaining(['Product name', 'Price']));
  });
  it('follows @graph, accepts string authors and flags a missing @context', () => {
    const r = validateExisting(JSON.stringify({ '@graph': [{ '@type': 'NewsArticle', headline: 'H', author: 'Jo', image: { '@type': 'ImageObject', url: 'https://e.com/a.jpg' } }, { '@type': 'Thing' }] }));
    expect(r.nodes.map((n) => n.type)).toEqual(['NewsArticle', 'Thing']);
    expect(r.nodes[0].report.missingRecommended).not.toContain('Author name');
    expect(r.nodes[0].report.missingRecommended).not.toContain('Image URLs');
    expect(r.nodes[1].known).toBe(false);
    expect(r.notes.join()).toMatch(/@context/);
  });
  it('checks FAQ items and breadcrumb positions', () => {
    const faq = validateExisting(JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'Q' }] }));
    expect(faq.nodes[0].report.missingRequired).toEqual(['Question 1: Answer']);
    const bc = validateExisting(JSON.stringify({ '@context': 'https://schema.org/', '@type': 'BreadcrumbList', itemListElement: [{ name: 'A', item: 'https://e.com' }, { name: 'B' }] }));
    expect(bc.nodes[0].report.missingRequired).toEqual([]);
    expect(bc.notes).toEqual([]);
  });
  it('maps subtypes such as MusicEvent and Restaurant', () => {
    expect(typeForName('MusicEvent')?.def.id).toBe('event');
    const r = validateExisting(JSON.stringify({ '@context': 'https://schema.org', '@type': 'Restaurant', name: 'R' }));
    expect(r.nodes[0].report.missingRequired).toEqual(expect.arrayContaining(['Street address']));
  });
});
