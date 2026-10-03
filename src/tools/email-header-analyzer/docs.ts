import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Copy the raw headers of an email: in Gmail use **⋮ → Show original**, in Outlook **View → View message source** (or File → Properties → Internet headers).',
    'Paste them into **Raw headers**, drop a `.eml`/`.txt` file on it, or pick a **Sample** (Gmail, Outlook, or a spoofed phishing email).',
    'Read the **Authentication** verdicts (SPF, DKIM, DMARC) and whether they align with the From domain, then the **Red flags** list.',
    'Check **Key headers** for Reply-To or Return-Path mismatches, and **Hops** for the delivery path, per-hop delays and clock skew.',
  ],
  howItWorks:
    'The text is split into header fields, joining folded continuation lines (RFC 5322) and stopping at the first blank line, so a pasted body is ignored. Encoded words such as `=?UTF-8?B?…?=` and `=?iso-8859-1?Q?…?=` are decoded by the tool’s own RFC 2047 decoder.\n\n' +
    'Each `Received` header is cut into its `from`, `by`, `with`, `via`, `id` and `for` clauses, with the date after the last semicolon; hops are listed bottom-up (where the message started first), with the delay from the previous hop and a clock-skew flag when a hop is more than a minute earlier than the one before. `Authentication-Results` (RFC 8601), `ARC-Authentication-Results`, `ARC-Seal`, `Received-SPF` and `DKIM-Signature` are parsed for results and domains. Verdicts come from the topmost `Authentication-Results`, because lower ones may be forged by the sender, and DMARC-style relaxed alignment compares the From domain with the SPF and DKIM domains.',
  limits: [
    'Nothing is verified cryptographically or looked up in DNS: the tool reports what the receiving servers wrote, not its own SPF/DKIM checks.',
    'Alignment uses an approximate organizational domain (last two labels, or three for suffixes like `co.uk`), not the full Public Suffix List.',
    'Only the first address of From and Reply-To is analysed.',
    'Red flags are heuristics. A clean result doesn’t prove an email is safe, and some flags (such as a different Return-Path) are normal for newsletters.',
  ],
  privacy:
    'Headers are parsed in your browser. They are never uploaded or stored, and this tool doesn’t create share links, since headers contain email addresses and IP addresses.',
  faqs: [
    {
      question: 'What do SPF, DKIM and DMARC mean?',
      answer:
        'SPF checks that the sending server may send for the envelope sender’s domain. DKIM checks a signature added by the sending domain. DMARC passes when SPF or DKIM passes for a domain that matches the visible From address.',
    },
    {
      question: 'Why are there several Authentication-Results headers?',
      answer:
        'Each server that checks the message can add one. Only the topmost, added by your own mail provider, is trustworthy; a sender can insert fake ones lower down, so the tool flags results from multiple servers.',
    },
    {
      question: 'What does clock skew mean in the hops?',
      answer:
        'A hop is timestamped before the previous one. It usually means one server’s clock is wrong, but in a phishing email it can also mean Received headers were forged.',
    },
    {
      question: 'Why is Reply-To on a different domain a warning?',
      answer:
        'Replies would go to someone other than the apparent sender. It is a common phishing trick, though some legitimate services (help desks, mailing lists) do it too.',
    },
    {
      question: 'Can I paste the whole email?',
      answer: 'Yes. Everything after the first blank line is treated as the body and ignored.',
    },
  ],
};

export default docs;
