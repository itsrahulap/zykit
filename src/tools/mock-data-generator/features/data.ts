// Small English-ish data lists for the mock data generator. Kept modest on purpose: variety
// comes from combining them, not from size.

export const FIRST_NAMES = (
  'James Mary Robert Patricia John Jennifer Michael Linda David Elizabeth William Barbara Richard Susan Joseph Jessica Thomas Sarah ' +
  'Charles Karen Daniel Lisa Matthew Nancy Anthony Betty Mark Sandra Steven Ashley Paul Emily Andrew Donna Joshua Michelle Kevin Carol ' +
  'Brian Amanda George Melissa Timothy Deborah Ryan Laura Jacob Rebecca Oliver Sophie Liam Emma Noah Ava Ethan Mia Lucas Chloe Aiden ' +
  'Grace Leo Zoe Samuel Hannah Isaac Nora Owen Ruby Priya Arjun Wei Mei Kenji Yuki Omar Layla Mateo Sofia Diego Lucia Kwame Amara'
).split(' ');

export const LAST_NAMES = (
  'Smith Johnson Williams Brown Jones Garcia Miller Davis Rodriguez Martinez Hernandez Lopez Gonzalez Wilson Anderson Thomas Taylor ' +
  'Moore Jackson Martin Lee Perez Thompson White Harris Sanchez Clark Ramirez Lewis Robinson Walker Young Allen King Wright Scott Torres ' +
  'Nguyen Hill Flores Green Adams Nelson Baker Hall Rivera Campbell Mitchell Carter Roberts Patel Shah Kim Chen Wang Tanaka Sato Okafor ' +
  'Mensah Novak Kowalski Muller Schmidt Rossi Bianchi Dubois Laurent Silva Santos Murphy Kelly Byrne Olsen Larsen Berg'
).split(' ');

export const CITIES: [city: string, country: string][] = [
  ['New York', 'United States'],
  ['Chicago', 'United States'],
  ['Austin', 'United States'],
  ['Seattle', 'United States'],
  ['Denver', 'United States'],
  ['Boston', 'United States'],
  ['Toronto', 'Canada'],
  ['Vancouver', 'Canada'],
  ['Montreal', 'Canada'],
  ['London', 'United Kingdom'],
  ['Manchester', 'United Kingdom'],
  ['Edinburgh', 'United Kingdom'],
  ['Dublin', 'Ireland'],
  ['Paris', 'France'],
  ['Lyon', 'France'],
  ['Berlin', 'Germany'],
  ['Munich', 'Germany'],
  ['Hamburg', 'Germany'],
  ['Amsterdam', 'Netherlands'],
  ['Brussels', 'Belgium'],
  ['Zurich', 'Switzerland'],
  ['Vienna', 'Austria'],
  ['Madrid', 'Spain'],
  ['Barcelona', 'Spain'],
  ['Lisbon', 'Portugal'],
  ['Rome', 'Italy'],
  ['Milan', 'Italy'],
  ['Stockholm', 'Sweden'],
  ['Oslo', 'Norway'],
  ['Copenhagen', 'Denmark'],
  ['Helsinki', 'Finland'],
  ['Warsaw', 'Poland'],
  ['Prague', 'Czechia'],
  ['Sydney', 'Australia'],
  ['Melbourne', 'Australia'],
  ['Auckland', 'New Zealand'],
  ['Tokyo', 'Japan'],
  ['Osaka', 'Japan'],
  ['Seoul', 'South Korea'],
  ['Singapore', 'Singapore'],
  ['Mumbai', 'India'],
  ['Bengaluru', 'India'],
  ['Cape Town', 'South Africa'],
  ['Nairobi', 'Kenya'],
  ['Lagos', 'Nigeria'],
  ['Mexico City', 'Mexico'],
  ['Sao Paulo', 'Brazil'],
  ['Buenos Aires', 'Argentina'],
];

export const COUNTRIES = [...new Set(CITIES.map(([, c]) => c))];

export const STREET_NAMES = (
  'Oak Maple Pine Cedar Elm Willow Birch Main High Church Park Mill River Lake Hill Station Bridge Market Queen King Victoria ' +
  'Washington Lincoln Jefferson Franklin Highland Sunset Meadow Spring Forest Garden Harbor Chestnut Walnut Cherry'
).split(' ');
export const STREET_SUFFIXES = ['Street', 'Avenue', 'Road', 'Lane', 'Drive', 'Court', 'Place', 'Way', 'Boulevard', 'Terrace'];

export const COMPANY_WORDS = (
  'Acme Globex Initech Umbrella Stark Wayne Vandelay Hooli Soylent Wonka Cyberdyne Tyrell Nimbus Vertex Summit Pioneer Horizon ' +
  'Northwind Contoso Fabrikam Blue Harbor Silver Oak Bright Path Clear Lake Red Rock Green Leaf Iron Peak Swift Quantum Apex Nova'
).split(' ');
export const COMPANY_SUFFIXES = ['Inc.', 'LLC', 'Ltd', 'Group', 'Labs', 'Systems', 'Partners', '& Co.', 'Technologies', 'Holdings'];

export const JOB_LEVELS = ['Junior', 'Senior', 'Lead', 'Principal', 'Chief', 'Associate', 'Staff', 'Head of'];
export const JOB_AREAS = ['Product', 'Marketing', 'Sales', 'Data', 'Security', 'Finance', 'Operations', 'Design', 'Engineering', 'Support', 'People', 'Legal'];
export const JOB_ROLES = ['Engineer', 'Manager', 'Analyst', 'Designer', 'Consultant', 'Specialist', 'Coordinator', 'Architect', 'Strategist', 'Officer'];

/** Reserved domains only (RFC 2606 / RFC 6761), so generated emails and URLs can never reach a real inbox or site. */
export const EMAIL_DOMAINS = ['example.com', 'example.org', 'example.net', 'mail.test', 'inbox.test'];
export const URL_DOMAINS = ['example.com', 'example.org', 'example.net', 'shop.test', 'app.test'];
export const URL_PATHS = ['about', 'blog', 'products', 'docs', 'account', 'pricing', 'help', 'news', 'search', 'profile'];
