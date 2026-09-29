// User-Agent parser driven by the tables in ./rules. Pure, no DOM.

import { BOT_RULES, BROWSER_RULES, OS_RULES, VENDOR_RULES, type BotCategory, type BrowserKind } from './rules';

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'tv' | 'console' | 'bot' | 'unknown';

export interface UaResult {
  ua: string;
  browser: { name: string; version?: string; major?: string; kind: BrowserKind | 'unknown' };
  engine: { name: string; version?: string };
  os: { name: string; version?: string };
  device: { type: DeviceType; vendor?: string; model?: string };
  bot: { name: string; category: BotCategory; owner?: string; version?: string } | null;
  notes: string[];
}

export const BOT_CATEGORY_LABELS: Record<BotCategory, string> = {
  search: 'Search engine crawler',
  ai: 'AI crawler / assistant',
  social: 'Link preview',
  seo: 'SEO crawler',
  monitoring: 'Monitoring / performance',
  library: 'HTTP library or CLI',
  automation: 'Browser automation',
  other: 'Bot',
};

const firstGroup = (m: RegExpExecArray | null): string | undefined => m?.slice(1).find((g) => !!g);

function detectBot(ua: string): UaResult['bot'] {
  for (const r of BOT_RULES) {
    const m = r.re.exec(ua);
    if (m) return { name: r.name, category: r.category, owner: r.owner, version: firstGroup(m) };
  }
  return null;
}

function detectBrowser(ua: string): UaResult['browser'] {
  for (const r of BROWSER_RULES) {
    const m = r.re.exec(ua);
    if (!m) continue;
    const version = firstGroup(m) ?? (r.ver ? firstGroup(r.ver.exec(ua)) : undefined);
    return { name: r.name, version, major: version?.split('.')[0], kind: r.kind ?? 'browser' };
  }
  return { name: 'Unknown', kind: 'unknown' };
}

function detectOs(ua: string): UaResult['os'] {
  for (const r of OS_RULES) {
    const m = r.re.exec(ua);
    if (!m) continue;
    const raw = firstGroup(m);
    if (r.name === 'Fire OS') {
      const android = /Android ([\d.]+)/.exec(ua)?.[1];
      return { name: 'Fire OS', version: android ? `(Android ${android})` : undefined };
    }
    return { name: r.name, version: raw ? (r.map ? r.map(raw) : raw) : undefined };
  }
  return { name: 'Unknown' };
}

function detectEngine(ua: string, os: string, browser: string): UaResult['engine'] {
  if (browser === 'Edge Legacy') return { name: 'EdgeHTML', version: /Edge\/([\d.]+)/.exec(ua)?.[1] };
  const trident = /Trident\/([\d.]+)/.exec(ua);
  if (trident || browser === 'Internet Explorer') return { name: 'Trident', version: trident?.[1] };
  const presto = /Presto\/([\d.]+)/.exec(ua);
  if (presto) return { name: 'Presto', version: presto[1] };
  const webkit = /AppleWebKit\/([\d.]+)/.exec(ua)?.[1];
  if (os === 'iOS' || os === 'iPadOS') return { name: 'WebKit', version: webkit };
  const gecko = /rv:([\d.]+)\) Gecko\/\d/.exec(ua);
  if (gecko && !/like Gecko/.test(ua)) return { name: 'Gecko', version: gecko[1] };
  const chrome = /(?:Chrome|Chromium|HeadlessChrome)\/(\d+)/.exec(ua);
  if (chrome && webkit) return Number(chrome[1]) >= 28 ? { name: 'Blink', version: chrome[1] } : { name: 'WebKit', version: webkit };
  if (webkit) return { name: 'WebKit', version: webkit };
  if (/Gecko\/\d/.test(ua)) return { name: 'Gecko', version: /rv:([\d.]+)/.exec(ua)?.[1] };
  return { name: 'Unknown' };
}

function androidModel(ua: string): string | undefined {
  const m = /Android[ -]?[\d.]*;(?: [a-z]{2}[-_][a-zA-Z]{2};)?(?: U;)? ([^;)]+?)(?: Build\/[^;)]*)?(?:;|\))/.exec(ua);
  const model = m?.[1]?.trim();
  if (!model || /^(?:wv|Mobile|Tablet|Linux|U|arm|x86)$/i.test(model)) return undefined;
  return model;
}

function detectDevice(ua: string, os: string, bot: boolean): UaResult['device'] {
  let vendor: string | undefined;
  let model: string | undefined;
  if (/iPhone/.test(ua)) [vendor, model] = ['Apple', 'iPhone'];
  else if (/iPad/.test(ua)) [vendor, model] = ['Apple', 'iPad'];
  else if (/iPod/.test(ua)) [vendor, model] = ['Apple', 'iPod touch'];
  else if (/AppleTV/.test(ua)) [vendor, model] = ['Apple', 'Apple TV'];
  else if (/Macintosh/.test(ua)) [vendor, model] = ['Apple', 'Mac'];
  else if (/Xbox/.test(ua)) [vendor, model] = ['Microsoft', /Xbox Series [XS]|Xbox One/.exec(ua)?.[0] ?? 'Xbox'];
  else if (/PlayStation/.test(ua)) [vendor, model] = ['Sony', /PlayStation (?:\d+|Vita|Portable)/.exec(ua)?.[0] ?? 'PlayStation'];
  else if (/Nintendo/.test(ua)) [vendor, model] = ['Nintendo', /Nintendo \w+/.exec(ua)?.[0]];
  else if (/CrKey/.test(ua)) [vendor, model] = ['Google', 'Chromecast'];
  else if (/Android|HarmonyOS/.test(ua)) {
    model = androidModel(ua);
    if (model) vendor = VENDOR_RULES.find(([re]) => re.test(model!))?.[1];
    if (model === 'K') model = undefined;
  }

  let type: DeviceType;
  if (bot) type = 'bot';
  else if (/PlayStation|Xbox|Nintendo/.test(ua)) type = 'console';
  else if (/SmartTV|SMART-TV|Smart-TV|SmartHub|HbbTV|NetCast|Web0S|webOS.*TV|Tizen.*TV|AppleTV|CrKey|Roku|\bAFT[A-Z]+\b|BRAVIA|GoogleTV|Android TV|AndroidTV|\bTV\b/i.test(ua)) type = 'tv';
  else if (/iPad|Tablet|PlayBook|Kindle|\bKF[A-Z]{2,4}\b/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua) && os !== 'Unknown')) type = 'tablet';
  else if (/Mobi|iPhone|iPod|Windows Phone|KAIOS|BlackBerry|BB10|Opera Mini/i.test(ua)) type = 'mobile';
  else if (/Windows NT|Macintosh|Mac OS X|CrOS|X11|Linux|FreeBSD|OpenBSD/.test(ua)) type = 'desktop';
  else type = 'unknown';
  return { type, vendor, model };
}

export function parseUserAgent(input: string): UaResult {
  const ua = input.trim();
  const bot = detectBot(ua);
  const browser = detectBrowser(ua);
  const os = detectOs(ua);
  const engine = detectEngine(ua, os.name, browser.name);
  const device = detectDevice(ua, os.name, !!bot);
  const notes: string[] = [];

  if (os.name === 'Windows' && os.version === '10 or 11')
    notes.push('Windows 10 and 11 both send "Windows NT 10.0". Only Client Hints (platformVersion 13 or higher) reveal Windows 11.');
  if (os.name === 'macOS' && /^10[._]15(?:[._]7)?$/.test(os.version ?? ''))
    notes.push('Browsers freeze the macOS version at 10.15.7 (Firefox: 10.15), so the real version is probably newer.');
  if (os.name === 'macOS' && browser.name === 'Safari' && !/Mobile\//.test(ua))
    notes.push('iPads on iPadOS 13+ send this same desktop Safari user agent by default, so this could also be an iPad.');
  if (/Android 10; K\)/.test(ua)) notes.push('This is Chrome’s reduced user agent: "Android 10; K" hides the real Android version and device model.');
  if (/Chrome\/\d+\.0\.0\.0/.test(ua)) notes.push('Chrome reports only its major version (minor numbers are 0.0.0) since the User-Agent reduction.');
  if (browser.name === 'Chrome' && os.name !== 'iOS' && os.name !== 'iPadOS')
    notes.push('Brave, Arc and several other Chromium browsers send exactly the same user agent as Chrome, so they can’t be told apart here.');
  if ((os.name === 'iOS' || os.name === 'iPadOS') && browser.name !== 'Safari')
    notes.push('On iOS and iPadOS every browser is built on Apple’s WebKit engine, whatever its name.');
  if (browser.kind === 'in-app') notes.push(`${browser.name} opened this link in its built-in browser (an embedded WebView), not in the user’s default browser.`);
  if (bot && bot.category !== 'library' && bot.category !== 'automation')
    notes.push('Anyone can send any user agent. Verify real crawlers with a reverse DNS lookup or the operator’s published IP ranges.');

  return { ua, browser, engine, os, device, bot, notes };
}

export interface Sample {
  label: string;
  ua: string;
}

export const SAMPLES: Sample[] = [
  { label: 'Chrome on Windows', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36' },
  { label: 'Safari on macOS', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15' },
  { label: 'Safari on iPhone', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1' },
  { label: 'Firefox on Linux', ua: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0' },
  { label: 'Samsung Internet', ua: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36' },
  { label: 'Instagram in-app', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 339.0.3.12.91 (iPhone15,3; iOS 17_5; en_US; en; scale=3.00; 1290x2796; 614224264)' },
  { label: 'Googlebot smartphone', ua: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.70 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
  { label: 'GPTBot', ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot' },
  { label: 'curl', ua: 'curl/8.7.1' },
  { label: 'PlayStation 5', ua: 'Mozilla/5.0 (PlayStation; PlayStation 5/2.26) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Safari/605.1.15' },
];
