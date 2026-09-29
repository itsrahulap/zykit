import { describe, expect, it } from 'vitest';
import { parseUserAgent, SAMPLES, type DeviceType } from '../../../src/tools/user-agent-parser/features/ua';

interface Case {
  ua: string;
  browser?: string;
  version?: string;
  engine?: string;
  os?: string;
  osVersion?: string;
  device?: DeviceType;
  vendor?: string;
  model?: string;
  bot?: string;
  kind?: string;
}

const CASES: Case[] = [
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36', browser: 'Chrome', version: '129.0.0.0', engine: 'Blink', os: 'Windows', osVersion: '10 or 11', device: 'desktop' },
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0', browser: 'Microsoft Edge', engine: 'Blink', os: 'Windows' },
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0', browser: 'Firefox', version: '131.0', engine: 'Gecko', os: 'Windows', device: 'desktop' },
  { ua: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36', browser: 'Chrome', os: 'Windows', osVersion: '7' },
  { ua: 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko', browser: 'Internet Explorer', version: '11.0', engine: 'Trident', os: 'Windows', osVersion: '8.1' },
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19582', browser: 'Edge Legacy', engine: 'EdgeHTML' },
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 OPR/114.0.0.0', browser: 'Opera', version: '114.0.0.0', engine: 'Blink' },
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Vivaldi/6.9.3447.51', browser: 'Vivaldi', version: '6.9.3447.51' },
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 YaBrowser/24.7.0.0 Safari/537.36', browser: 'Yandex Browser', version: '24.7.0.0' },
  { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', browser: 'Safari', version: '18.0', engine: 'WebKit', os: 'macOS', osVersion: '10.15.7', device: 'desktop', vendor: 'Apple' },
  { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36', browser: 'Chrome', engine: 'Blink', os: 'macOS' },
  { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0', browser: 'Firefox', engine: 'Gecko', os: 'macOS', osVersion: '10.15' },
  { ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36', browser: 'Chrome', os: 'Linux', device: 'desktop' },
  { ua: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0', browser: 'Firefox', os: 'Ubuntu', device: 'desktop' },
  { ua: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36', browser: 'Chrome', os: 'ChromeOS', osVersion: '14541.0.0', device: 'desktop' },
  { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1', browser: 'Safari', engine: 'WebKit', os: 'iOS', osVersion: '17.6.1', device: 'mobile', vendor: 'Apple', model: 'iPhone' },
  { ua: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', browser: 'Safari', os: 'iPadOS', osVersion: '17.5', device: 'tablet', model: 'iPad' },
  { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.6668.46 Mobile/15E148 Safari/604.1', browser: 'Chrome', version: '129.0.6668.46', engine: 'WebKit', os: 'iOS', device: 'mobile' },
  { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/130.0 Mobile/15E148 Safari/605.1.15', browser: 'Firefox', engine: 'WebKit', os: 'iOS' },
  { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148', browser: 'iOS WebView', kind: 'webview', os: 'iOS' },
  { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 339.0.3.12.91 (iPhone15,3; iOS 17_5; en_US; en; scale=3.00; 1290x2796; 614224264)', browser: 'Instagram', version: '339.0.3.12.91', kind: 'in-app', os: 'iOS' },
  { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.40.99;FBBV/613834478;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]', browser: 'Facebook', version: '470.0.0.40.99', kind: 'in-app' },
  { ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A.240805.005; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.127 Mobile Safari/537.36 musical_ly_2023605030 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/musical_ly app_version/36.5.3 ByteLocale/en', browser: 'TikTok', version: '36.5.3', kind: 'in-app', os: 'Android', vendor: 'Google', model: 'Pixel 8' },
  { ua: 'Mozilla/5.0 (Linux; Android 13; SM-G991B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.127 Mobile Safari/537.36', browser: 'Android WebView', kind: 'webview', os: 'Android', osVersion: '13', device: 'mobile', vendor: 'Samsung', model: 'SM-G991B' },
  { ua: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36', browser: 'Chrome', engine: 'Blink', os: 'Android', osVersion: '10', device: 'mobile', model: undefined },
  { ua: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36', browser: 'Samsung Internet', version: '25.0', os: 'Android', device: 'mobile', vendor: 'Samsung' },
  { ua: 'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36', browser: 'Chrome', os: 'Android', device: 'tablet', vendor: 'Samsung' },
  { ua: 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0', browser: 'Firefox', engine: 'Gecko', os: 'Android', device: 'mobile' },
  { ua: 'Mozilla/5.0 (Linux; U; Android 10; en-US; RMX2030 Build/QKQ1.200209.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/78.0.3904.108 UCBrowser/13.4.0.1306 Mobile Safari/537.36', browser: 'UC Browser', version: '13.4.0.1306', vendor: 'realme' },
  { ua: 'Mozilla/5.0 (Linux; Android 9; KFTRWI) AppleWebKit/537.36 (KHTML, like Gecko) Silk/126.4.1 like Chrome/126.0.6478.231 Safari/537.36', browser: 'Amazon Silk', os: 'Fire OS', device: 'tablet', vendor: 'Amazon' },
  { ua: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) 94.0.4606.31/7.0 TV Safari/537.36', os: 'Tizen', osVersion: '7.0', device: 'tv' },
  { ua: 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36 WebAppManager', os: 'webOS', device: 'tv' },
  { ua: 'Mozilla/5.0 (PlayStation; PlayStation 5/2.26) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Safari/605.1.15', os: 'PlayStation', osVersion: '5', device: 'console', vendor: 'Sony' },
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; Xbox; Xbox Series X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.82 Safari/537.36 Edge/20.02', os: 'Xbox', device: 'console', vendor: 'Microsoft' },
  { ua: 'Mozilla/5.0 (Nintendo Switch; WifiWebAuthApplet) AppleWebKit/606.4 (KHTML, like Gecko) NF/6.0.1.15.4 NintendoBrowser/5.1.0.20393', os: 'Nintendo', device: 'console' },
  { ua: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.70 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', bot: 'Googlebot', device: 'bot', os: 'Android' },
  { ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', bot: 'Googlebot', device: 'bot' },
  { ua: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)', bot: 'Bingbot', device: 'bot' },
  { ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot', bot: 'GPTBot' },
  { ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)', bot: 'ClaudeBot' },
  { ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)', bot: 'PerplexityBot' },
  { ua: 'CCBot/2.0 (https://commoncrawl.org/faq/)', bot: 'CCBot (Common Crawl)' },
  { ua: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', bot: 'Facebook link preview' },
  { ua: 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)', bot: 'AhrefsBot' },
  { ua: 'curl/8.7.1', bot: 'curl', device: 'bot' },
  { ua: 'python-requests/2.32.3', bot: 'python-requests' },
  { ua: 'PostmanRuntime/7.42.0', bot: 'Postman' },
  { ua: 'Go-http-client/2.0', bot: 'Go net/http' },
  { ua: 'Wget/1.21.4', bot: 'Wget' },
  { ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/129.0.6668.29 Safari/537.36', bot: 'Headless Chrome', browser: 'Headless Chrome', kind: 'headless' },
  { ua: 'Opera/9.80 (Windows NT 6.1; WOW64) Presto/2.12.388 Version/12.18', browser: 'Opera', version: '12.18', engine: 'Presto' },
];

describe('parseUserAgent', () => {
  it('has at least 30 real-world cases', () => {
    expect(CASES.length).toBeGreaterThanOrEqual(30);
  });

  for (const c of CASES) {
    it(c.ua.slice(0, 90), () => {
      const r = parseUserAgent(c.ua);
      if (c.browser) expect(r.browser.name).toBe(c.browser);
      if (c.version) expect(r.browser.version).toBe(c.version);
      if (c.kind) expect(r.browser.kind).toBe(c.kind);
      if (c.engine) expect(r.engine.name).toBe(c.engine);
      if (c.os) expect(r.os.name).toBe(c.os);
      if (c.osVersion) expect(r.os.version).toBe(c.osVersion);
      if (c.device) expect(r.device.type).toBe(c.device);
      if (c.vendor) expect(r.device.vendor).toBe(c.vendor);
      if ('model' in c) expect(r.device.model).toBe(c.model);
      if (c.bot) expect(r.bot?.name).toBe(c.bot);
      else expect(r.bot).toBeNull();
    });
  }

  it('adds the ambiguity notes', () => {
    expect(parseUserAgent(CASES[0].ua).notes.join(' ')).toMatch(/Windows 10 and 11/);
    expect(parseUserAgent(CASES[0].ua).notes.join(' ')).toMatch(/Brave/);
    const safariMac = parseUserAgent(CASES[9].ua).notes.join(' ');
    expect(safariMac).toMatch(/10\.15\.7/);
    expect(safariMac).toMatch(/iPad/);
    expect(parseUserAgent('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36').notes.join(' ')).toMatch(/reduced/);
    expect(parseUserAgent(CASES[17].ua).notes.join(' ')).toMatch(/WebKit/);
    expect(parseUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)').bot?.category).toBe('search');
    expect(parseUserAgent('SomeRandomCrawler/1.0').bot?.name).toBe('Unknown bot');
  });

  it('handles empty and unknown input', () => {
    const r = parseUserAgent('');
    expect(r.browser.name).toBe('Unknown');
    expect(r.device.type).toBe('unknown');
  });

  it('parses every sample', () => {
    for (const s of SAMPLES) expect(parseUserAgent(s.ua).browser.name !== 'Unknown' || parseUserAgent(s.ua).bot).toBeTruthy();
  });
});
