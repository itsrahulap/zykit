// Data tables for the User-Agent parser. Order matters: the first matching rule wins.
// Group 1 of each regex (when present) is the version.

export type BrowserKind = 'browser' | 'in-app' | 'webview' | 'headless';
export type BotCategory = 'search' | 'ai' | 'social' | 'seo' | 'monitoring' | 'library' | 'automation' | 'other';

export interface BrowserRule {
  name: string;
  re: RegExp;
  /** Separate version pattern when `re` has no capture group. */
  ver?: RegExp;
  kind?: BrowserKind;
}

export interface BotRule {
  name: string;
  re: RegExp;
  category: BotCategory;
  owner?: string;
}

export interface OsRule {
  name: string;
  re: RegExp;
  /** Maps the captured version to a display version/name (e.g. NT 6.1 → 7). */
  map?: (v: string) => string;
}

const bots = (category: BotCategory, owner: string | undefined, list: [string, RegExp][]): BotRule[] =>
  list.map(([name, re]) => ({ name, re, category, owner }));

export const BOT_RULES: BotRule[] = [
  // AI crawlers and assistants first: some also contain generic tokens.
  ...bots('ai', 'OpenAI', [
    ['GPTBot', /GPTBot\/?([\d.]*)/i],
    ['ChatGPT-User', /ChatGPT-User\/?([\d.]*)/i],
    ['OAI-SearchBot', /OAI-SearchBot\/?([\d.]*)/i],
  ]),
  ...bots('ai', 'Anthropic', [
    ['ClaudeBot', /ClaudeBot\/?([\d.]*)/i],
    ['Claude-User', /Claude-User\/?([\d.]*)/i],
    ['Claude-SearchBot', /Claude-SearchBot\/?([\d.]*)/i],
    ['Claude-Web', /Claude-Web\/?([\d.]*)/i],
    ['anthropic-ai', /anthropic-ai\/?([\d.]*)/i],
  ]),
  ...bots('ai', 'Perplexity', [
    ['PerplexityBot', /PerplexityBot\/?([\d.]*)/i],
    ['Perplexity-User', /Perplexity-User\/?([\d.]*)/i],
  ]),
  ...bots('ai', undefined, [
    ['CCBot (Common Crawl)', /CCBot\/?([\d.]*)/i],
    ['Bytespider (ByteDance)', /Bytespider/i],
    ['Amazonbot', /Amazonbot\/?([\d.]*)/i],
    ['meta-externalagent', /meta-externalagent\/?([\d.]*)/i],
    ['meta-externalfetcher', /meta-externalfetcher\/?([\d.]*)/i],
    ['FacebookBot', /FacebookBot\/?([\d.]*)/i],
    ['cohere-ai', /cohere-(?:ai|training-data-crawler)/i],
    ['Diffbot', /Diffbot\/?([\d.]*)/i],
    ['YouBot', /YouBot\/?([\d.]*)/i],
    ['AI2Bot', /AI2Bot/i],
    ['DuckAssistBot', /DuckAssistBot\/?([\d.]*)/i],
    ['MistralAI-User', /MistralAI-User\/?([\d.]*)/i],
    ['Timpibot', /Timpibot\/?([\d.]*)/i],
    ['ImagesiftBot', /ImagesiftBot/i],
    ['Applebot-Extended', /Applebot-Extended/i],
  ]),
  ...bots('search', 'Google', [
    ['Google-InspectionTool', /Google-InspectionTool\/?([\d.]*)/i],
    ['GoogleOther', /GoogleOther/i],
    ['AdsBot-Google', /AdsBot-Google(?:-Mobile)?/i],
    ['Mediapartners-Google', /Mediapartners-Google/i],
    ['Storebot-Google', /Storebot-Google\/?([\d.]*)/i],
    ['APIs-Google', /APIs-Google/i],
    ['FeedFetcher-Google', /FeedFetcher-Google/i],
    ['Googlebot', /Googlebot(?:-[A-Za-z]+)?\/?([\d.]*)/i],
  ]),
  ...bots('search', 'Microsoft', [
    ['Bingbot', /bingbot\/?([\d.]*)/i],
    ['BingPreview', /BingPreview\/?([\d.]*)/i],
    ['AdIdxBot', /adidxbot\/?([\d.]*)/i],
  ]),
  ...bots('search', undefined, [
    ['DuckDuckBot', /DuckDuckBot(?:-Https)?\/?([\d.]*)/i],
    ['YandexBot', /Yandex[A-Za-z]*Bot\/?([\d.]*)/i],
    ['Baiduspider', /Baiduspider(?:-[a-z]+)?\/?([\d.]*)/i],
    ['Applebot', /Applebot\/?([\d.]*)/i],
    ['Yahoo! Slurp', /Yahoo! Slurp/i],
    ['SeznamBot', /SeznamBot\/?([\d.]*)/i],
    ['PetalBot', /PetalBot/i],
    ['Sogou spider', /Sogou (?:web )?spider\/?([\d.]*)/i],
    ['Naver Yeti', /Yeti\/([\d.]+)/i],
    ['Qwantbot', /Qwantbot|Qwantify/i],
  ]),
  ...bots('social', undefined, [
    ['Facebook link preview', /facebookexternalhit\/?([\d.]*)|facebookcatalog/i],
    ['Twitterbot', /Twitterbot\/?([\d.]*)/i],
    ['LinkedInBot', /LinkedInBot\/?([\d.]*)/i],
    ['Slackbot', /Slackbot(?:-LinkExpanding)?\s?([\d.]*)/i],
    ['Discordbot', /Discordbot\/?([\d.]*)/i],
    ['TelegramBot', /TelegramBot/i],
    ['WhatsApp link preview', /^WhatsApp\/([\d.]+)/i],
    ['Pinterestbot', /Pinterest(?:bot)?\/([\d.]+).*\+http/i],
    ['redditbot', /redditbot\/?([\d.]*)/i],
    ['Skype link preview', /SkypeUriPreview/i],
    ['Embedly', /Embedly/i],
    ['Iframely', /Iframely\/?([\d.]*)/i],
    ['Mastodon', /Mastodon\/([\d.]+)/i],
  ]),
  ...bots('seo', undefined, [
    ['AhrefsBot', /AhrefsBot\/?([\d.]*)/i],
    ['SemrushBot', /SemrushBot(?:-[A-Za-z]+)?\/?([\d.]*)/i],
    ['MJ12bot (Majestic)', /MJ12bot\/?v?([\d.]*)/i],
    ['DotBot (Moz)', /DotBot\/?([\d.]*)/i],
    ['rogerbot (Moz)', /rogerbot\/?([\d.]*)/i],
    ['Screaming Frog', /Screaming Frog SEO Spider\/?([\d.]*)/i],
    ['DataForSeoBot', /DataForSeoBot\/?([\d.]*)/i],
    ['BLEXBot', /BLEXBot\/?([\d.]*)/i],
    ['serpstatbot', /serpstatbot\/?([\d.]*)/i],
  ]),
  ...bots('monitoring', undefined, [
    ['Lighthouse', /Chrome-Lighthouse/i],
    ['UptimeRobot', /UptimeRobot\/?([\d.]*)/i],
    ['Pingdom', /Pingdom/i],
    ['StatusCake', /StatusCake/i],
    ['Site24x7', /Site24x7/i],
    ['GTmetrix', /GTmetrix/i],
  ]),
  ...bots('library', undefined, [
    ['curl', /^curl\/([\d.]+)/i],
    ['Wget', /^Wget\/([\d.]+)/i],
    ['python-requests', /python-requests\/([\d.]+)/i],
    ['Python urllib', /Python-urllib\/([\d.]+)/i],
    ['aiohttp', /aiohttp\/([\d.]+)/i],
    ['HTTPX', /python-httpx\/([\d.]+)/i],
    ['Go net/http', /Go-http-client\/([\d.]+)/i],
    ['OkHttp', /okhttp\/([\d.]+)/i],
    ['axios', /axios\/([\d.]+)/i],
    ['node-fetch', /node-fetch\/?([\d.]*)/i],
    ['Node.js (undici)', /^(?:undici|node)$/i],
    ['Postman', /PostmanRuntime\/([\d.]+)/i],
    ['Insomnia', /insomnia\/([\d.]+)/i],
    ['HTTPie', /HTTPie\/([\d.]+)/i],
    ['Apache HttpClient', /Apache-HttpClient\/([\d.]+)/i],
    ['Java', /^Java\/([\d._]+)/i],
    ['libwww-perl', /libwww-perl\/([\d.]+)/i],
    ['Scrapy', /Scrapy\/([\d.]+)/i],
    ['Guzzle (PHP)', /GuzzleHttp\/([\d.]+)/i],
    ['Dart', /^Dart\/([\d.]+)/i],
    ['Deno', /^Deno\/([\d.]+)/i],
    ['Bun', /^Bun\/([\d.]+)/i],
  ]),
  ...bots('automation', undefined, [
    ['Headless Chrome', /HeadlessChrome\/([\d.]+)/],
    ['PhantomJS', /PhantomJS\/([\d.]+)/i],
  ]),
  // Anything else that calls itself a bot.
  { name: 'Unknown bot', re: /\b[\w-]*(?:bot|crawler|spider|crawling|scraper)\b/i, category: 'other' },
];

export const BROWSER_RULES: BrowserRule[] = [
  // In-app browsers (they embed a system WebView and add their own token).
  { name: 'Instagram', re: /Instagram ([\d.]+)/, kind: 'in-app' },
  { name: 'Messenger', re: /FBAN\/Messenger|MessengerForiOS|Orca-Android/, ver: /FBAV\/([\d.]+)/, kind: 'in-app' },
  { name: 'Facebook', re: /\bFB(?:AN|AV|_IAB|IOS)\b|\[FB/, ver: /FBAV\/([\d.]+)/, kind: 'in-app' },
  { name: 'TikTok', re: /musical_ly|BytedanceWebview|TikTok|trill_\d/, ver: /(?:app_version|TikTok)\/([\d.]+)/, kind: 'in-app' },
  { name: 'Snapchat', re: /Snapchat\/([\d.]+)/, kind: 'in-app' },
  { name: 'LinkedIn', re: /LinkedInApp\/?([\d.]*)/, kind: 'in-app' },
  { name: 'Pinterest', re: /\[Pinterest\/|Pinterest for (?:iOS|Android)/, kind: 'in-app' },
  { name: 'X (Twitter)', re: /Twitter for iPhone|TwitterAndroid/, kind: 'in-app' },
  { name: 'LINE', re: /\bLine\/([\d.]+)/, kind: 'in-app' },
  { name: 'WeChat', re: /MicroMessenger\/([\d.]+)/, kind: 'in-app' },
  { name: 'Google app', re: /\bGSA\/([\d.]+)/, kind: 'in-app' },
  // Browsers with their own token, before the Chrome / Safari they are built on.
  { name: 'Edge Legacy', re: /Edge\/([\d.]+)/ },
  { name: 'Microsoft Edge', re: /Edg(?:A|iOS)?\/([\d.]+)/ },
  { name: 'Opera Mini', re: /Opera Mini\/([\d.]+)/ },
  { name: 'Opera', re: /(?:OPR|OPT|OPiOS)\/([\d.]+)/ },
  { name: 'Opera', re: /^Opera\/.*Version\/([\d.]+)/ },
  { name: 'Samsung Internet', re: /SamsungBrowser\/([\d.]+)/ },
  { name: 'UC Browser', re: /UC ?Browser\/([\d.]+)|UCWEB/ },
  { name: 'Yandex Browser', re: /YaBrowser\/([\d.]+)|YaSearchBrowser\/([\d.]+)/ },
  { name: 'Vivaldi', re: /Vivaldi\/([\d.]+)/ },
  { name: 'Naver Whale', re: /Whale\/([\d.]+)/ },
  { name: 'DuckDuckGo', re: /(?:Ddg|DuckDuckGo)\/([\d.]+)/ },
  { name: 'Huawei Browser', re: /HuaweiBrowser\/([\d.]+)/ },
  { name: 'Mi Browser', re: /(?:XiaoMi\/)?MiuiBrowser\/([\d.]+)/ },
  { name: 'Amazon Silk', re: /Silk\/([\d.]+)/ },
  { name: 'Firefox Focus', re: /Focus\/([\d.]+).*Firefox|Klar\/([\d.]+)/ },
  { name: 'Firefox', re: /FxiOS\/([\d.]+)/ },
  { name: 'Chrome', re: /CriOS\/([\d.]+)/ },
  { name: 'Firefox', re: /Firefox\/([\d.]+)/ },
  { name: 'Headless Chrome', re: /HeadlessChrome\/([\d.]+)/, kind: 'headless' },
  { name: 'Android WebView', re: /; wv\).*Chrome\/([\d.]+)/, kind: 'webview' },
  { name: 'Chromium', re: /Chromium\/([\d.]+)/ },
  { name: 'Chrome', re: /Chrome\/([\d.]+)/ },
  { name: 'Internet Explorer', re: /MSIE ([\d.]+)/ },
  { name: 'Internet Explorer', re: /Trident\/.*rv:([\d.]+)/ },
  { name: 'Android Browser', re: /Android.*Version\/([\d.]+).*Safari/ },
  { name: 'Safari', re: /Version\/([\d.]+).*Safari\// },
  { name: 'iOS WebView', re: /(?:iPhone|iPad|iPod).*AppleWebKit(?!.*Safari)/, kind: 'webview' },
  { name: 'Safari', re: /AppleWebKit.*Safari\// },
];

const WINDOWS: Record<string, string> = {
  '10.0': '10 or 11',
  '6.3': '8.1',
  '6.2': '8',
  '6.1': '7',
  '6.0': 'Vista',
  '5.2': 'XP x64',
  '5.1': 'XP',
  '5.0': '2000',
};

const underscores = (v: string) => v.replace(/_/g, '.');

export const OS_RULES: OsRule[] = [
  { name: 'Windows Phone', re: /Windows Phone(?: OS)? ([\d.]+)/ },
  { name: 'Xbox', re: /Xbox(?: One| Series [XS])?/ },
  { name: 'Windows', re: /Windows NT ([\d.]+)/, map: (v) => WINDOWS[v] ?? `NT ${v}` },
  { name: 'HarmonyOS', re: /HarmonyOS[ /]?([\d.]*)/ },
  { name: 'KaiOS', re: /KAIOS\/([\d.]+)/i },
  { name: 'iPadOS', re: /iPad.*? OS ([\d_]+)/, map: underscores },
  { name: 'iOS', re: /(?:iPhone|iPod)(?:.*? OS ([\d_]+))?/, map: underscores },
  { name: 'tvOS', re: /AppleTV(?:.*? OS ([\d_.]+))?/, map: underscores },
  { name: 'macOS', re: /Mac OS X ?([\d_.]*)/, map: underscores },
  { name: 'ChromeOS', re: /CrOS \S+ ([\d.]+)/ },
  { name: 'PlayStation', re: /PlayStation (\d+|Vita|Portable)/ },
  { name: 'Nintendo', re: /Nintendo (Switch|WiiU|3DS|Wii)/ },
  { name: 'Tizen', re: /Tizen ?([\d.]*)/ },
  { name: 'webOS', re: /(?:Web0S|webOS|hpwOS)\/?([\d.]*)/i },
  { name: 'Fire OS', re: /Android.*\b(?:KF[A-Z]{2,4}|AFT[A-Z]+)\b/ },
  { name: 'Android', re: /Android[ -]?([\d.]*)/ },
  { name: 'Roku OS', re: /Roku/ },
  { name: 'Ubuntu', re: /Ubuntu/ },
  { name: 'Fedora', re: /Fedora/ },
  { name: 'FreeBSD', re: /FreeBSD/ },
  { name: 'OpenBSD', re: /OpenBSD/ },
  { name: 'Linux', re: /Linux|X11/ },
];

export const VENDOR_RULES: [RegExp, string][] = [
  [/^(?:SM-|GT-|SCH-|SGH-|SAMSUNG|Galaxy)/i, 'Samsung'],
  [/^(?:Pixel|Nexus)/, 'Google'],
  [/^(?:Redmi|M2\d{3}|Mi |MI |POCO|Xiaomi|\d{8}[A-Z]{1,3}$)/i, 'Xiaomi'],
  [/^ONEPLUS/i, 'OnePlus'],
  [/^(?:CPH|OPPO)/, 'OPPO'],
  [/^RMX/, 'realme'],
  [/^(?:moto|XT\d)/i, 'Motorola'],
  [/^(?:HUAWEI|ELE-|VOG-|LYA-|ANE-|MAR-|NOH-)/i, 'Huawei'],
  [/^(?:LM-|LG)/, 'LG'],
  [/^(?:KF[A-Z]{2,4}|AFT[A-Z]+)/, 'Amazon'],
  [/^Nokia/i, 'Nokia'],
  [/^(?:SO-|XQ-|Xperia|Sony)/i, 'Sony'],
  [/^(?:vivo|V\d{4})/i, 'vivo'],
  [/^(?:TECNO|Infinix|itel)/i, 'Transsion'],
];
