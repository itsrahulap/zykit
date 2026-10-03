// Declarative definitions of the supported schema.org types and what Google's rich-result docs
// require or recommend for each. Field keys are dotted paths into the JSON-LD object.

import type { Kind } from './validate';

export type Level = 'required' | 'recommended' | 'optional';
export type Obj = Record<string, unknown>;

export interface Field {
  key: string;
  label: string;
  kind: Kind;
  level: Level;
  /** Level to use when the chosen type is a local business. */
  local?: Level;
  /** The field is only needed once any other field under this prefix is filled in. */
  when?: string;
  group?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
  /** Required for every list item except the last (breadcrumb "item"). */
  exceptLast?: boolean;
}

export interface ListDef {
  key: string;
  label: string;
  itemLabel: string;
  itemType: string;
  level: Level;
  local?: Level;
  min?: number;
  nested: Record<string, string>;
  fields: Field[];
  /** Adds "position": 1, 2, 3... to every item. */
  position?: boolean;
}

export interface Access {
  raw(f: Field): string[];
  lists(key: string): Access[];
  has(prefix: string): boolean;
}

export interface TypeDef {
  id: string;
  label: string;
  subtypes: string[];
  /** Other @type values that are checked as this type when validating pasted JSON-LD. */
  accepts?: string[];
  localSubtypes?: string[];
  note?: string;
  fields: Field[];
  lists: ListDef[];
  nested: Record<string, string>;
  anyOf?: { keys: string[]; message: string };
  post?: (o: Obj) => void;
  check?: (a: Access) => string[];
  example: { values: Record<string, string>; lists?: Record<string, Record<string, string>[]> };
}

const F = (key: string, label: string, kind: Kind = 'text', level: Level = 'optional', o: Partial<Field> = {}): Field => ({ key, label, kind, level, ...o });
const opts = (...v: string[]) => v.map((x) => ({ value: x, label: x }));
const S = 'https://schema.org/';

const AVAILABILITY = ['InStock', 'OutOfStock', 'PreOrder', 'BackOrder', 'SoldOut', 'LimitedAvailability', 'OnlineOnly', 'Discontinued'].map((x) => ({ value: S + x, label: x }));

const offerFields = (prefix: string, group: string, price: Level = 'required'): Field[] => [
  F(`${prefix}.price`, 'Price', 'price', price, { when: prefix, group, placeholder: '19.99', help: 'Digits and a dot only. Use 0 for free.' }),
  F(`${prefix}.priceCurrency`, 'Currency', 'currency', price, { when: prefix, group, placeholder: 'USD' }),
  F(`${prefix}.availability`, 'Availability', 'select', 'recommended', { group, options: AVAILABILITY }),
  F(`${prefix}.url`, 'Offer URL', 'url', 'recommended', { group }),
  F(`${prefix}.priceValidUntil`, 'Price valid until', 'date', 'optional', { group }),
];

const ratingFields = (group = 'Aggregate rating'): Field[] => [
  F('aggregateRating.ratingValue', 'Rating value', 'number', 'required', { when: 'aggregateRating', group, placeholder: '4.6' }),
  F('aggregateRating.reviewCount', 'Review count', 'number', 'required', { when: 'aggregateRating', group, placeholder: '128', help: 'Google accepts ratingCount or reviewCount.' }),
  F('aggregateRating.bestRating', 'Best rating', 'number', 'optional', { group, placeholder: '5' }),
  F('aggregateRating.worstRating', 'Worst rating', 'number', 'optional', { group, placeholder: '1' }),
];

const reviewList: ListDef = {
  key: 'review',
  label: 'Reviews',
  itemLabel: 'Review',
  itemType: 'Review',
  level: 'optional',
  nested: { author: 'Person', reviewRating: 'Rating' },
  fields: [
    F('author.name', 'Reviewer name', 'text', 'required'),
    F('reviewRating.ratingValue', 'Rating', 'number', 'required', { placeholder: '5' }),
    F('reviewBody', 'Review text', 'textarea', 'recommended'),
    F('datePublished', 'Date', 'date', 'recommended'),
  ],
};

const addressFields = (prefix: string, group: string, local?: Level): Field[] => [
  F(`${prefix}.streetAddress`, 'Street address', 'text', 'recommended', { group, local }),
  F(`${prefix}.addressLocality`, 'City', 'text', 'recommended', { group, local }),
  F(`${prefix}.addressRegion`, 'State / region', 'text', 'recommended', { group }),
  F(`${prefix}.postalCode`, 'Postal code', 'text', 'recommended', { group }),
  F(`${prefix}.addressCountry`, 'Country code', 'text', 'recommended', { group, placeholder: 'US' }),
];

const EVENT_STATUS = ['EventScheduled', 'EventCancelled', 'EventMovedOnline', 'EventPostponed', 'EventRescheduled'].map((x) => ({ value: S + x, label: x }));
const ATTENDANCE = ['OfflineEventAttendanceMode', 'OnlineEventAttendanceMode', 'MixedEventAttendanceMode'].map((x) => ({ value: S + x, label: x }));
const LOCAL = ['LocalBusiness', 'Restaurant', 'Store', 'Hotel', 'Dentist', 'ProfessionalService'];
const stepList = (key: string, label: string, level: Level): ListDef => ({
  key,
  label,
  itemLabel: 'Step',
  itemType: 'HowToStep',
  level,
  min: 1,
  nested: {},
  fields: [F('name', 'Step name', 'text', 'recommended'), F('text', 'Instruction', 'textarea', 'required'), F('image', 'Step image URL', 'url'), F('url', 'Step URL', 'url')],
});

export const TYPES: TypeDef[] = [
  {
    id: 'article',
    label: 'Article / BlogPosting / NewsArticle',
    subtypes: ['Article', 'BlogPosting', 'NewsArticle'],
    nested: { author: 'Person', publisher: 'Organization', 'publisher.logo': 'ImageObject', mainEntityOfPage: 'WebPage' },
    note: 'Google lists no required Article properties, but headline, image, author and dates are recommended.',
    fields: [
      F('headline', 'Headline', 'text', 'recommended', { help: 'Keep it under 110 characters.' }),
      F('image', 'Image URLs', 'urls', 'recommended', { help: 'One per line. Google suggests 16:9, 4:3 and 1:1 versions.' }),
      F('datePublished', 'Date published', 'datetime', 'recommended', { placeholder: '2025-03-31T09:00:00+00:00' }),
      F('dateModified', 'Date modified', 'datetime', 'recommended'),
      F('author.name', 'Author name', 'text', 'recommended', { group: 'Author' }),
      F('author.url', 'Author URL', 'url', 'recommended', { group: 'Author' }),
      F('publisher.name', 'Publisher name', 'text', 'optional', { group: 'Publisher' }),
      F('publisher.logo.url', 'Publisher logo URL', 'url', 'optional', { group: 'Publisher' }),
      F('mainEntityOfPage.@id', 'Page URL', 'url', 'optional'),
      F('articleSection', 'Section', 'text'),
      F('description', 'Description', 'textarea'),
    ],
    lists: [],
    example: {
      values: { headline: 'How to brew better coffee', image: 'https://example.com/coffee.jpg', datePublished: '2025-03-31T09:00:00+00:00', 'author.name': 'Ada Brewer', 'author.url': 'https://example.com/ada' },
    },
  },
  {
    id: 'product',
    label: 'Product (Offer, rating, reviews)',
    subtypes: ['Product'],
    nested: { brand: 'Brand', offers: 'Offer', aggregateRating: 'AggregateRating' },
    anyOf: { keys: ['offers', 'aggregateRating', 'review'], message: 'Google needs at least one of offers, aggregateRating or review for a product snippet' },
    fields: [
      F('name', 'Product name', 'text', 'required'),
      F('image', 'Image URLs', 'urls', 'recommended', { help: 'One per line.' }),
      F('description', 'Description', 'textarea', 'recommended'),
      F('sku', 'SKU', 'text', 'recommended'),
      F('gtin', 'GTIN / barcode', 'text', 'optional'),
      F('mpn', 'MPN', 'text', 'optional'),
      F('brand.name', 'Brand', 'text', 'recommended', { group: 'Brand' }),
      ...offerFields('offers', 'Offer'),
      F('offers.itemCondition', 'Condition', 'select', 'optional', { group: 'Offer', options: ['NewCondition', 'UsedCondition', 'RefurbishedCondition'].map((x) => ({ value: S + x, label: x })) }),
      ...ratingFields(),
    ],
    lists: [{ ...reviewList }],
    example: {
      values: { name: 'Trail Runner 2 shoes', image: 'https://example.com/shoe.jpg', description: 'Light, grippy trail shoes.', sku: 'TR2-42', 'brand.name': 'Acme', 'offers.price': '89.99', 'offers.priceCurrency': 'USD', 'offers.availability': S + 'InStock', 'offers.url': 'https://example.com/shoe', 'aggregateRating.ratingValue': '4.6', 'aggregateRating.reviewCount': '128' },
      lists: { review: [{ 'author.name': 'Sam', 'reviewRating.ratingValue': '5', reviewBody: 'Great grip.' }] },
    },
  },
  {
    id: 'faq',
    label: 'FAQPage',
    subtypes: ['FAQPage'],
    nested: {},
    note: 'Since 2023 Google shows FAQ rich results only for well-known government and health sites. The markup stays valid schema.org.',
    fields: [],
    lists: [
      {
        key: 'mainEntity',
        label: 'Questions',
        itemLabel: 'Question',
        itemType: 'Question',
        level: 'required',
        min: 1,
        nested: { acceptedAnswer: 'Answer' },
        fields: [F('name', 'Question', 'text', 'required'), F('acceptedAnswer.text', 'Answer', 'textarea', 'required', { help: 'Basic HTML (a, b, br, li, ul, ol, p) is allowed.' })],
      },
    ],
    example: { values: {}, lists: { mainEntity: [{ name: 'Do you ship abroad?', 'acceptedAnswer.text': 'Yes, to 30 countries.' }, { name: 'What is the return window?', 'acceptedAnswer.text': '30 days.' }] } },
  },
  {
    id: 'howto',
    label: 'HowTo',
    subtypes: ['HowTo'],
    nested: {},
    note: 'Google stopped showing HowTo rich results in 2023. The markup is still valid and understood by other consumers.',
    fields: [
      F('name', 'Title', 'text', 'required'),
      F('description', 'Description', 'textarea', 'recommended'),
      F('image', 'Image URL', 'url', 'recommended'),
      F('totalTime', 'Total time', 'duration', 'recommended', { placeholder: 'PT30M' }),
    ],
    lists: [stepList('step', 'Steps', 'required')],
    example: { values: { name: 'Change a bike tyre', totalTime: 'PT20M' }, lists: { step: [{ name: 'Remove the wheel', text: 'Open the quick release and lift the wheel out.' }, { name: 'Swap the tube', text: 'Pry off one tyre side and replace the inner tube.' }] } },
  },
  {
    id: 'organization',
    label: 'Organization / LocalBusiness',
    subtypes: ['Organization', 'Corporation', 'NGO', ...LOCAL],
    localSubtypes: LOCAL,
    nested: { address: 'PostalAddress', geo: 'GeoCoordinates', contactPoint: 'ContactPoint' },
    fields: [
      F('name', 'Name', 'text', 'recommended', { local: 'required' }),
      F('url', 'Website URL', 'url', 'recommended'),
      F('logo', 'Logo URL', 'url', 'recommended', { help: 'At least 112x112 px, in a format Google can index.' }),
      F('image', 'Image URLs', 'urls', 'optional', { local: 'recommended' }),
      F('description', 'Description', 'textarea'),
      F('telephone', 'Telephone', 'tel', 'recommended'),
      F('email', 'Email', 'email', 'optional'),
      F('priceRange', 'Price range', 'text', 'optional', { local: 'recommended', placeholder: '$$' }),
      F('foundingDate', 'Founding date', 'date'),
      F('sameAs', 'Profile URLs (sameAs)', 'urls', 'recommended', { help: 'One per line: social profiles, Wikipedia, etc.' }),
      ...addressFields('address', 'Address', 'required'),
      F('geo.latitude', 'Latitude', 'number', 'optional', { local: 'recommended', group: 'Geo', placeholder: '37.4224' }),
      F('geo.longitude', 'Longitude', 'number', 'optional', { local: 'recommended', group: 'Geo', placeholder: '-122.0842' }),
      F('contactPoint.telephone', 'Contact telephone', 'tel', 'optional', { group: 'Contact point' }),
      F('contactPoint.contactType', 'Contact type', 'text', 'optional', { group: 'Contact point', placeholder: 'customer service' }),
    ],
    lists: [
      {
        key: 'openingHoursSpecification',
        label: 'Opening hours',
        itemLabel: 'Hours',
        itemType: 'OpeningHoursSpecification',
        level: 'optional',
        local: 'recommended',
        nested: {},
        fields: [F('dayOfWeek', 'Days', 'days', 'required', { placeholder: 'Monday, Tuesday' }), F('opens', 'Opens', 'time', 'required', { placeholder: '09:00' }), F('closes', 'Closes', 'time', 'required', { placeholder: '17:00' })],
      },
    ],
    example: {
      values: { name: 'Corner Roasters', url: 'https://example.com', logo: 'https://example.com/logo.png', telephone: '+1-555-010-1234', sameAs: 'https://twitter.com/example', 'address.streetAddress': '1 Main St', 'address.addressLocality': 'Springfield', 'address.addressRegion': 'IL', 'address.postalCode': '62701', 'address.addressCountry': 'US' },
      lists: { openingHoursSpecification: [{ dayOfWeek: 'Monday, Tuesday, Wednesday', opens: '08:00', closes: '17:00' }] },
    },
  },
  {
    id: 'person',
    label: 'Person',
    subtypes: ['Person'],
    nested: { worksFor: 'Organization' },
    note: 'Google has no Person rich result; the markup helps search engines connect an author or profile page to one identity.',
    fields: [
      F('name', 'Name', 'text', 'recommended'),
      F('url', 'URL', 'url', 'recommended'),
      F('image', 'Image URL', 'url'),
      F('jobTitle', 'Job title'),
      F('worksFor.name', 'Works for', 'text', 'optional', { group: 'Employer' }),
      F('email', 'Email', 'email'),
      F('telephone', 'Telephone', 'tel'),
      F('birthDate', 'Birth date', 'date'),
      F('sameAs', 'Profile URLs (sameAs)', 'urls', 'recommended', { help: 'One per line.' }),
    ],
    lists: [],
    example: { values: { name: 'Ada Brewer', url: 'https://example.com/ada', jobTitle: 'Head roaster', 'worksFor.name': 'Corner Roasters', sameAs: 'https://github.com/ada' } },
  },
  {
    id: 'event',
    label: 'Event',
    subtypes: ['Event'],
    accepts: ['MusicEvent', 'BusinessEvent', 'EducationEvent', 'SportsEvent', 'TheaterEvent', 'Festival'],
    nested: { location: 'Place', 'location.address': 'PostalAddress', organizer: 'Organization', performer: 'Person', offers: 'Offer' },
    fields: [
      F('name', 'Event name', 'text', 'required'),
      F('startDate', 'Start', 'datetime', 'required', { placeholder: '2025-09-12T19:30:00-05:00' }),
      F('endDate', 'End', 'datetime', 'recommended'),
      F('eventStatus', 'Status', 'select', 'recommended', { options: EVENT_STATUS }),
      F('eventAttendanceMode', 'Attendance mode', 'select', 'recommended', { options: ATTENDANCE }),
      F('location.name', 'Venue name', 'text', 'required', { group: 'Location' }),
      ...addressFields('location.address', 'Location'),
      F('image', 'Image URLs', 'urls', 'recommended'),
      F('description', 'Description', 'textarea', 'recommended'),
      F('organizer.name', 'Organizer', 'text', 'optional', { group: 'Organizer' }),
      F('organizer.url', 'Organizer URL', 'url', 'optional', { group: 'Organizer' }),
      F('performer.name', 'Performer', 'text', 'optional', { group: 'Performer' }),
      ...offerFields('offers', 'Tickets', 'recommended').map((f) => (f.key === 'offers.priceValidUntil' ? F('offers.validFrom', 'On sale from', 'datetime', 'optional', { group: 'Tickets' }) : f)),
    ],
    lists: [],
    example: { values: { name: 'Latte Art Night', startDate: '2025-09-12T19:30:00-05:00', endDate: '2025-09-12T21:30:00-05:00', 'location.name': 'Corner Roasters', 'location.address.streetAddress': '1 Main St', 'location.address.addressLocality': 'Springfield', 'location.address.addressCountry': 'US', image: 'https://example.com/event.jpg' } },
  },
  {
    id: 'breadcrumb',
    label: 'BreadcrumbList',
    subtypes: ['BreadcrumbList'],
    nested: {},
    fields: [],
    lists: [
      {
        key: 'itemListElement',
        label: 'Breadcrumb trail',
        itemLabel: 'Crumb',
        itemType: 'ListItem',
        level: 'required',
        min: 2,
        position: true,
        nested: {},
        fields: [F('name', 'Name', 'text', 'required'), F('item', 'URL', 'url', 'required', { exceptLast: true, help: 'Optional on the last crumb (the current page).' })],
      },
    ],
    example: { values: {}, lists: { itemListElement: [{ name: 'Home', item: 'https://example.com/' }, { name: 'Coffee', item: 'https://example.com/coffee' }, { name: 'Beans', item: '' }] } },
  },
  {
    id: 'website',
    label: 'WebSite (+ SearchAction)',
    subtypes: ['WebSite'],
    nested: { potentialAction: 'SearchAction', 'potentialAction.target': 'EntryPoint' },
    note: 'Google retired the sitelinks search box in 2024, but SearchAction remains valid schema.org. Name and URL drive the site name in results.',
    fields: [
      F('name', 'Site name', 'text', 'required'),
      F('alternateName', 'Alternate name', 'text', 'recommended'),
      F('url', 'Site URL', 'url', 'required'),
      F('potentialAction.target.urlTemplate', 'Search URL template', 'text', 'optional', { group: 'Site search', placeholder: 'https://example.com/search?q={search_term_string}', help: 'Must contain {search_term_string}.' }),
    ],
    lists: [],
    post: (o) => {
      const pa = o.potentialAction as Obj | undefined;
      if (pa) pa['query-input'] = 'required name=search_term_string';
    },
    check: (a) => {
      const t = a.raw(F('potentialAction.target.urlTemplate', '', 'text'))[0];
      return t && !t.includes('{search_term_string}') ? ['Search URL template: must contain the {search_term_string} placeholder'] : [];
    },
    example: { values: { name: 'Corner Roasters', alternateName: 'CR', url: 'https://example.com/', 'potentialAction.target.urlTemplate': 'https://example.com/search?q={search_term_string}' } },
  },
  {
    id: 'software',
    label: 'SoftwareApplication',
    subtypes: ['SoftwareApplication', 'MobileApplication', 'WebApplication'],
    nested: { offers: 'Offer', aggregateRating: 'AggregateRating' },
    anyOf: { keys: ['aggregateRating', 'review'], message: 'Google needs aggregateRating or review for a software app snippet' },
    fields: [
      F('name', 'App name', 'text', 'required'),
      F('operatingSystem', 'Operating system', 'text', 'recommended', { placeholder: 'ANDROID, iOS, Windows' }),
      F('applicationCategory', 'Category', 'select', 'recommended', { options: opts('GameApplication', 'BusinessApplication', 'DeveloperApplication', 'EducationalApplication', 'FinanceApplication', 'HealthApplication', 'LifestyleApplication', 'MultimediaApplication', 'SecurityApplication', 'SocialNetworkingApplication', 'TravelApplication', 'UtilitiesApplication') }),
      F('description', 'Description', 'textarea'),
      F('image', 'Image URL', 'url'),
      F('offers.price', 'Price', 'price', 'required', { group: 'Offer', placeholder: '0', help: 'Use 0 for a free app.' }),
      F('offers.priceCurrency', 'Currency', 'currency', 'required', { group: 'Offer', when: 'offers', placeholder: 'USD' }),
      ...ratingFields(),
    ],
    lists: [{ ...reviewList }],
    example: { values: { name: 'Bean Tracker', operatingSystem: 'iOS', applicationCategory: 'LifestyleApplication', 'offers.price': '0', 'offers.priceCurrency': 'USD', 'aggregateRating.ratingValue': '4.7', 'aggregateRating.reviewCount': '2210' } },
  },
  {
    id: 'recipe',
    label: 'Recipe',
    subtypes: ['Recipe'],
    nested: { author: 'Person', nutrition: 'NutritionInformation', aggregateRating: 'AggregateRating' },
    fields: [
      F('name', 'Recipe name', 'text', 'required'),
      F('image', 'Image URLs', 'urls', 'required', { help: 'One per line.' }),
      F('description', 'Description', 'textarea', 'recommended'),
      F('author.name', 'Author', 'text', 'recommended', { group: 'Author' }),
      F('datePublished', 'Date published', 'date', 'recommended'),
      F('prepTime', 'Prep time', 'duration', 'recommended', { placeholder: 'PT15M' }),
      F('cookTime', 'Cook time', 'duration', 'recommended', { placeholder: 'PT45M' }),
      F('totalTime', 'Total time', 'duration', 'recommended', { placeholder: 'PT1H' }),
      F('recipeYield', 'Yield', 'text', 'recommended', { placeholder: '4 servings' }),
      F('recipeCategory', 'Category', 'text', 'recommended'),
      F('recipeCuisine', 'Cuisine', 'text', 'recommended'),
      F('keywords', 'Keywords', 'text'),
      F('nutrition.calories', 'Calories', 'text', 'recommended', { group: 'Nutrition', placeholder: '270 calories' }),
      F('recipeIngredient', 'Ingredients', 'lines', 'recommended', { help: 'One per line.' }),
      ...ratingFields(),
    ],
    lists: [stepList('recipeInstructions', 'Instructions', 'recommended')],
    example: { values: { name: 'Flat white', image: 'https://example.com/flat-white.jpg', 'author.name': 'Ada Brewer', prepTime: 'PT5M', totalTime: 'PT10M', recipeYield: '1 cup', recipeIngredient: '18 g espresso\n120 ml milk' }, lists: { recipeInstructions: [{ name: '', text: 'Pull the shot.' }, { name: '', text: 'Pour steamed milk.' }] } },
  },
  {
    id: 'job',
    label: 'JobPosting',
    subtypes: ['JobPosting'],
    nested: { hiringOrganization: 'Organization', jobLocation: 'Place', 'jobLocation.address': 'PostalAddress', applicantLocationRequirements: 'Country', baseSalary: 'MonetaryAmount', 'baseSalary.value': 'QuantitativeValue' },
    anyOf: { keys: ['jobLocation', 'applicantLocationRequirements'], message: 'Add a job location, or applicant location requirements for remote roles' },
    fields: [
      F('title', 'Job title', 'text', 'required'),
      F('description', 'Description', 'textarea', 'required', { help: 'HTML allowed. Include responsibilities and qualifications.' }),
      F('datePosted', 'Date posted', 'date', 'required'),
      F('validThrough', 'Valid through', 'datetime', 'recommended'),
      F('employmentType', 'Employment type', 'select', 'recommended', { options: opts('FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY', 'INTERN', 'VOLUNTEER', 'PER_DIEM', 'OTHER') }),
      F('hiringOrganization.name', 'Company name', 'text', 'required', { group: 'Employer' }),
      F('hiringOrganization.sameAs', 'Company URL', 'url', 'recommended', { group: 'Employer' }),
      F('hiringOrganization.logo', 'Company logo URL', 'url', 'recommended', { group: 'Employer' }),
      F('jobLocation.address.streetAddress', 'Street address', 'text', 'recommended', { group: 'Location' }),
      F('jobLocation.address.addressLocality', 'City', 'text', 'recommended', { group: 'Location' }),
      F('jobLocation.address.addressRegion', 'State / region', 'text', 'recommended', { group: 'Location' }),
      F('jobLocation.address.postalCode', 'Postal code', 'text', 'recommended', { group: 'Location' }),
      F('jobLocation.address.addressCountry', 'Country code', 'text', 'required', { group: 'Location', when: 'jobLocation', placeholder: 'US' }),
      F('jobLocationType', 'Remote', 'select', 'optional', { group: 'Location', options: [{ value: 'TELECOMMUTE', label: 'TELECOMMUTE (fully remote)' }] }),
      F('applicantLocationRequirements.name', 'Applicant country (remote)', 'text', 'optional', { group: 'Location', placeholder: 'USA' }),
      F('baseSalary.currency', 'Salary currency', 'currency', 'recommended', { group: 'Salary', placeholder: 'USD' }),
      F('baseSalary.value.value', 'Salary amount', 'number', 'recommended', { group: 'Salary', placeholder: '50' }),
      F('baseSalary.value.unitText', 'Salary unit', 'select', 'recommended', { group: 'Salary', options: opts('HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR') }),
      F('directApply', 'Direct apply', 'bool', 'optional', { options: opts('true', 'false') }),
    ],
    lists: [],
    example: { values: { title: 'Barista', description: '<p>Make great coffee.</p>', datePosted: '2025-03-01', validThrough: '2025-06-01T00:00', employmentType: 'FULL_TIME', 'hiringOrganization.name': 'Corner Roasters', 'jobLocation.address.addressLocality': 'Springfield', 'jobLocation.address.addressRegion': 'IL', 'jobLocation.address.addressCountry': 'US', 'baseSalary.currency': 'USD', 'baseSalary.value.value': '18', 'baseSalary.value.unitText': 'HOUR' } },
  },
  {
    id: 'video',
    label: 'VideoObject',
    subtypes: ['VideoObject'],
    nested: { interactionStatistic: 'InteractionCounter' },
    fields: [
      F('name', 'Title', 'text', 'required'),
      F('thumbnailUrl', 'Thumbnail URLs', 'urls', 'required', { help: 'One per line.' }),
      F('uploadDate', 'Upload date', 'datetime', 'required', { placeholder: '2025-03-31T08:00:00+00:00' }),
      F('description', 'Description', 'textarea', 'recommended'),
      F('contentUrl', 'Video file URL', 'url', 'recommended'),
      F('embedUrl', 'Embed URL', 'url', 'recommended'),
      F('duration', 'Duration', 'duration', 'recommended', { placeholder: 'PT1M54S' }),
      F('expires', 'Expires', 'datetime', 'optional'),
      F('interactionStatistic.userInteractionCount', 'View count', 'number', 'optional', { group: 'Views' }),
    ],
    lists: [],
    post: (o) => {
      const s = o.interactionStatistic as Obj | undefined;
      if (s) s.interactionType = { '@type': 'WatchAction' };
    },
    example: { values: { name: 'Pouring a rosetta', thumbnailUrl: 'https://example.com/thumb.jpg', uploadDate: '2025-03-31T08:00:00+00:00', description: 'A 2-minute latte art lesson.', contentUrl: 'https://example.com/rosetta.mp4', duration: 'PT2M5S' } },
  },
];

export const TYPE_BY_ID: Record<string, TypeDef> = Object.fromEntries(TYPES.map((t) => [t.id, t]));

/** Finds the definition for a schema.org @type value, or null. */
export function typeForName(name: string): { def: TypeDef; sub: string } | null {
  for (const def of TYPES) if (def.subtypes.includes(name) || def.accepts?.includes(name)) return { def, sub: def.subtypes.includes(name) ? name : def.subtypes[0] };
  return null;
}
