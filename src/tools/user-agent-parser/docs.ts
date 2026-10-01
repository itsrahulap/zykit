import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'The **User-Agent** box starts with your own browser’s user agent. Paste another one, for example from a server log or a request header, or drop a text file on the box.',
    'Pick one from **Samples** to see typical browsers, an in-app browser, crawlers and tools, or click **Use my browser** to go back to your own.',
    'Read the **Parsed** panel: browser and version, engine, operating system, device type and, where the string reveals it, the device vendor and model. Bots and crawlers get their own panel with their category and operator.',
    'Check the **Notes** for what the string can’t tell you, and the **Client Hints (this browser)** panel for the extra details your own browser exposes.',
  ],
  howItWorks:
    'The string is matched against built-in tables of regular expressions, and the first matching rule wins. Bots are checked first: close to 100 named crawlers, link preview bots, SEO and monitoring tools, HTTP libraries and automation tools, grouped by category (search engine, AI crawler or assistant, link preview, SEO, monitoring, HTTP library or CLI, browser automation), plus a fallback for anything calling itself a bot, crawler or spider. Browsers are matched with in-app browsers (Instagram, Facebook, TikTok, WeChat and others) and browsers with their own token (Edge, Opera, Samsung Internet, Vivaldi and others) ahead of the Chrome and Safari they are built on.\n\n' +
    'The operating system comes from tokens such as `Windows NT 10.0`, `iPhone OS 17_6` or `Android 14`, mapped to familiar names. The engine (Blink, WebKit, Gecko, EdgeHTML, Trident or Presto) is worked out from the browser and platform: every iOS and iPadOS browser is WebKit. The device type is guessed from tokens such as `Mobi`, `iPad`, `Tablet`, TV and console names; Android phone models are read from the string and matched to a vendor by their model prefix (for example `SM-` for Samsung).\n\n' +
    'Notes explain the known blind spots of the User-Agent string: Windows 10 and 11 both send `Windows NT 10.0`, macOS is frozen at 10.15.7, iPads can send a desktop Safari user agent, and Chrome’s User-Agent reduction hides minor versions and, on Android, the real version and model. The Client Hints panel reads your own browser’s `navigator.userAgentData`, including high-entropy values such as platform version, architecture and model where the browser allows it.',
  limits: [
    'A user agent is self-reported and easy to fake, so the result is a hint, not proof. Genuine crawlers can only be verified with a reverse DNS lookup or the operator’s published IP ranges, which this tool doesn’t do.',
    'Brave, Arc and other Chromium browsers that send Chrome’s exact user agent are reported as Chrome.',
    'Reduced user agents hide details: Windows 11 looks like Windows 10, macOS versions after 10.15.7 aren’t visible, and Chrome on Android sends `Android 10; K` with no model.',
    'Client Hints are shown for your own browser only, not for pasted strings, and only in browsers that support `navigator.userAgentData` (Firefox and Safari don’t).',
    'Unknown or new browsers, bots and device models fall back to the closest rule or “Unknown”; the rule tables are fixed and don’t update themselves.',
  ],
  privacy:
    'Parsing runs entirely in your browser with built-in rule tables; nothing is sent anywhere, and the site’s Content Security Policy blocks requests to other servers. Your own user agent and Client Hints are read from the browser only to fill the page. Nothing is stored, and there is no share link.',
  faqs: [
    {
      question: 'Why does it say Windows 10 or 11?',
      answer:
        'Both versions send `Windows NT 10.0` in the user agent. Only User-Agent Client Hints reveal Windows 11 (a platform version of 13 or higher); the **Client Hints (this browser)** panel shows this for your own browser.',
    },
    {
      question: 'Why does my Mac show macOS 10.15.7?',
      answer:
        'Browsers freeze the macOS version in the user agent at 10.15.7 (Firefox uses 10.15) for privacy and compatibility, so the real version is probably newer.',
    },
    {
      question: 'Can I trust that a request really came from Googlebot?',
      answer:
        'Not from the user agent alone, because anyone can send any user agent. Check it with a reverse DNS lookup of the IP address, or against the IP ranges the operator publishes.',
    },
    {
      question: 'Why is my iPad shown as a Mac?',
      answer:
        'Since iPadOS 13, Safari on iPad requests desktop sites by default and sends the same user agent as Safari on macOS. When you parse your own browser, the Client Hints panel points out a Mac user agent on a touch screen as a likely iPad.',
    },
    {
      question: 'What is an in-app browser?',
      answer:
        'When you open a link inside an app such as Instagram, Facebook or TikTok, it often loads in the app’s built-in WebView rather than your default browser. The app adds its own token to the user agent, so the tool shows the app’s name with an **in-app** badge.',
    },
  ],
};

export default docs;
