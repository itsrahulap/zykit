import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose an **Input type**: **One URL per line**, or **Find links in text** to clean every link inside an email, chat message or document while leaving the rest of the text as it is.',
    'Paste into **URLs** (or **Text with links**), drop a text file, use **Open file**, or click **Try an example**.',
    'Under **Remove**, tick the parameter groups to strip and choose whether to **Unwrap redirect links**. Add your own names to **Also remove**, and names that must survive to **Always keep** (comma or space separated; end a name with `*` to match a prefix).',
    'Copy the result with **Copy all** or pass it on with **Send to…**. **What was removed** lists, for each link, the parameters that were stripped and the redirects that were unwrapped.',
  ],
  howItWorks:
    'Each link must be an absolute `http` or `https` URL. If unwrapping is on, known redirect wrappers are opened up first, up to five levels deep: Google `/url`, Facebook and Messenger `l.php`, `l.instagram.com`, `out.reddit.com`, YouTube `/redirect`, LinkedIn `/redir/`, `slack-redir.net`, Steam `linkfilter`, VK `away.php` and `href.li`. The destination is read from the wrapper’s own query parameter, so nothing is requested.\n\n' +
    'The query string is then split into its `name=value` pairs, and each name is compared, ignoring case, against the enabled groups: **UTM campaign tags** (every `utm_*`), **Ad click IDs** (such as `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, `yclid`, `twclid`, `ttclid`, `li_fat_id`), **Analytics & cross-domain** (such as `_ga`, `_gl`, `s_cid`, `spm`, `trk`), **Email marketing** (such as `mc_eid`, `mc_cid`, `_hsenc`, `_hsmi`, `mkt_tok`, `oly_*`, `vero_*`), **Social share IDs** and **Shop referral junk**. Ambiguous names are only removed on the sites that use them: `si` on YouTube and Spotify, `s` and `t` on X/Twitter, `ref` and `qid` on Amazon, and so on. **Always keep** wins over everything, then **Also remove**, then the groups.\n\n' +
    'Pairs that are kept are copied exactly as written, in their original order, and the fragment (`#…`) is left alone. If nothing remains, the `?` is dropped too. In text mode, links are found by their `http://` or `https://` prefix, and trailing punctuation such as a full stop or an unmatched closing bracket is left outside the link.',
  limits: [
    'Shortened links such as `t.co`, `bit.ly`, `lnkd.in`, `tinyurl.com` or `amzn.to` can’t be expanded: only the shortener’s server knows the destination, and the site can’t make requests to other servers. These links get a note instead.',
    'Only parameters in the built-in lists, or ones you add, are removed. Tracking IDs placed in the path (such as Amazon’s `/ref=…`) or under unknown names are not detected.',
    'Amazon parameters are only stripped on 10 Amazon domains (`.com`, `.co.uk`, `.de`, `.fr`, `.in`, `.ca`, `.es`, `.it`, `.co.jp`, `.com.au`).',
    'Lines or links that aren’t valid `http(s)` URLs are passed through unchanged and marked as invalid. Text mode only finds links that start with `http://` or `https://`.',
    'The **What was removed** list shows the first 500 links; **Copy all** always includes every link.',
  ],
  privacy:
    'Links are cleaned entirely in your browser and are never opened or requested, and the site’s Content Security Policy blocks requests to other servers. Nothing is stored, and there is no share link. If you use **Send to…**, the result is handed over through this tab’s session storage and removed as soon as the receiving tool reads it.',
  faqs: [
    {
      question: 'Will removing these parameters break the link?',
      answer:
        'Usually not: tracking parameters only tell analytics or ad systems where the click came from. Some sites do use a listed name for something real; if a cleaned link stops working, add that name to **Always keep** or untick its group.',
    },
    {
      question: 'Why was si removed from a YouTube link but not from another site?',
      answer:
        'Short names such as `si`, `s`, `t`, `ref` or `feature` are only treated as tracking on the sites known to use them that way. On other sites they may be real parameters, so they are kept.',
    },
    {
      question: 'Can it expand a bit.ly or t.co link?',
      answer:
        'No. Expanding a short link means asking the shortener’s server where it points, and this site never contacts other servers. Open the link once in a browser, copy the final address and clean that.',
    },
    {
      question: 'What does unwrapping a redirect link do?',
      answer:
        'Links copied from Google results, Facebook, Instagram, Reddit, YouTube, LinkedIn and some other sites often point to a redirect page that carries the real destination in a parameter. Unwrapping replaces the link with that destination and then cleans it too.',
    },
  ],
};

export default docs;
