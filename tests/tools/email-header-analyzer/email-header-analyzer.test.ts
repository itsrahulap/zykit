import { describe, expect, it } from 'vitest';
import {
  aligned,
  analyzeHeaders,
  buildHops,
  decodeEncodedWords,
  formatDelay,
  orgDomain,
  parseAddress,
  parseAuthResults,
  parseEmailDate,
  parseHeaders,
  parseReceived,
  parseReceivedSpf,
} from '../../../src/tools/email-header-analyzer/features/email-header-analyzer';
import { GMAIL_SAMPLE, OUTLOOK_SAMPLE, SPOOFED_SAMPLE } from '../../../src/tools/email-header-analyzer/features/samples';

const NOW = Date.UTC(2024, 9, 10);

describe('unfolding and encoded words', () => {
  it('joins folded lines, stops at the body and skips an mbox From line', () => {
    const { headers, skipped } = parseHeaders('From alice@x Mon Jan 1 00:00:00 2024\nSubject: one\n two\r\n\tthree\nX-A: b\n\nBody: not a header\n');
    expect(headers.map((h) => [h.name, h.value])).toEqual([
      ['Subject', 'one two three'],
      ['X-A', 'b'],
    ]);
    expect(skipped).toEqual([]);
  });

  it('decodes B and Q words, joins adjacent words and keeps plain text', () => {
    expect(decodeEncodedWords('=?UTF-8?B?WW91ciBvcmRlciAjMTA0MiBoYXMgc2hpcHBlZCDwn5qa?=')).toBe('Your order #1042 has shipped 🚚');
    expect(decodeEncodedWords('=?utf-8?Q?Caf=C3=A9_au_lait?= today')).toBe('Café au lait today');
    expect(decodeEncodedWords('=?UTF-8?Q?a?= =?UTF-8?Q?b?=')).toBe('ab');
    expect(decodeEncodedWords('=?iso-8859-1?q?p=EAche?=')).toBe('pêche');
    // A multi-byte character split across two words.
    expect(decodeEncodedWords('=?UTF-8?B?4oKs?= =?UTF-8?Q?=E2=82?= =?UTF-8?Q?=AC?=')).toBe('€€');
    expect(decodeEncodedWords('no words here =?')).toBe('no words here =?');
  });
});

describe('dates, addresses and domains', () => {
  it('parses RFC 5322 dates with zones, comments and obsolete forms', () => {
    expect(parseEmailDate('Tue, 1 Oct 2024 08:15:32 -0700 (PDT)')).toBe(Date.UTC(2024, 9, 1, 15, 15, 32));
    expect(parseEmailDate('Wed, 2 Oct\n 2024 14:03:11 +0000')).toBe(Date.UTC(2024, 9, 2, 14, 3, 11));
    expect(parseEmailDate('1 Oct 24 10:00 EST')).toBe(Date.UTC(2024, 9, 1, 15, 0));
    expect(parseEmailDate('nonsense')).toBeNull();
  });

  it('parses addresses, ignoring addresses inside quoted names', () => {
    expect(parseAddress('"Example Bank <security@examplebank.com>" <noreply@examplebank.com>')).toEqual({
      name: 'Example Bank <security@examplebank.com>',
      address: 'noreply@examplebank.com',
      domain: 'examplebank.com',
    });
    expect(parseAddress('bob@Example.ORG (Bob)')).toEqual({ name: 'Bob', address: 'bob@Example.ORG', domain: 'example.org' });
    expect(parseAddress('undisclosed-recipients:;')).toBeNull();
  });

  it('approximates organizational domains for relaxed alignment', () => {
    expect(orgDomain('mail.shop.example.com')).toBe('example.com');
    expect(orgDomain('a.b.example.co.uk')).toBe('example.co.uk');
    expect(aligned('bounce.example.com', 'example.com')).toBe(true);
    expect(aligned('example.net', 'example.com')).toBe(false);
  });
});

describe('Received headers', () => {
  it('parses from/by/with/id/for/date, comments and IPs', () => {
    const h = parseReceived(
      'from mail-out.shop.example.com (mail-out.shop.example.com. [203.0.113.45]) by mx.google.com with ESMTPS id abc.123 for <alice@gmail.com> (version=TLS1_3 cipher=TLS_AES_256_GCM_SHA384 bits=256/256); Tue, 01 Oct 2024 08:15:31 -0700 (PDT)',
    );
    expect(h.from).toBe('mail-out.shop.example.com (mail-out.shop.example.com. [203.0.113.45])');
    expect(h.by).toBe('mx.google.com');
    expect(h.with).toBe('ESMTPS');
    expect(h.id).toBe('abc.123');
    expect(h.for).toBe('<alice@gmail.com> (version=TLS1_3 cipher=TLS_AES_256_GCM_SHA384 bits=256/256)');
    expect(h.ip).toBe('203.0.113.45');
    expect(h.date).toBe(Date.UTC(2024, 9, 1, 15, 15, 31));
  });

  it('handles by-only, IPv6 and "via" variants', () => {
    expect(parseReceived('by 2002:a05:6a10:9e8c::4f1 with SMTP id hu12; Tue, 1 Oct 2024 08:15:32 -0700').from).toBeUndefined();
    const ms = parseReceived('from BN2PEPF000044A8.namprd04.prod.outlook.com (2603:10b6:408:111:cafe::4c) by x.outlook.com with Microsoft SMTP Server id 15.20 via Frontend Transport; Wed, 2 Oct 2024 14:03:11 +0000');
    expect(ms.ip).toBe('2603:10b6:408:111:cafe::4c');
    expect(ms.via).toBe('Frontend Transport');
    expect(ms.with).toBe('Microsoft SMTP Server');
  });

  it('orders hops bottom-up, computes delays and flags clock skew', () => {
    const { headers } = parseHeaders(
      'Received: from b by c; Mon, 1 Jan 2024 00:00:05 +0000\nReceived: from a by b; Mon, 1 Jan 2024 00:10:00 +0000\nReceived: from x by a; Mon, 1 Jan 2024 00:00:00 +0000\n',
    );
    const hops = buildHops(headers);
    expect(hops.map((h) => [h.number, h.from, h.delay, h.skew])).toEqual([
      [1, 'x', undefined, false],
      [2, 'a', 600, false],
      [3, 'b', -595, true],
    ]);
    expect(formatDelay(600)).toBe('10 min');
    expect(formatDelay(-595)).toBe('-9 min 55 s');
    expect(formatDelay(3725)).toBe('1 h 2 min');
  });
});

describe('authentication results', () => {
  it('parses Authentication-Results with comments and properties', () => {
    const r = parseAuthResults(
      'mx.google.com; dkim=pass header.i=@shop.example.com header.s=s2024; spf=pass (google.com: domain of a@shop.example.com designates 1.2.3.4 as permitted sender) smtp.mailfrom=a@shop.example.com; dmarc=pass (p=REJECT) header.from=shop.example.com',
    );
    expect(r.map((x) => [x.method, x.result, x.domain, x.authserv])).toEqual([
      ['dkim', 'pass', 'shop.example.com', 'mx.google.com'],
      ['spf', 'pass', 'shop.example.com', 'mx.google.com'],
      ['dmarc', 'pass', 'shop.example.com', 'mx.google.com'],
    ]);
    expect(r[0].props['header.s']).toBe('s2024');
    expect(r[2].comment).toBe('p=REJECT');
  });

  it('handles Microsoft 365 (no authserv-id), ARC instances and "none"', () => {
    const ms = parseAuthResults('spf=pass (sender IP is 198.51.100.25) smtp.mailfrom=mail.contoso.example; dkim=pass (signature was verified) header.d=contoso.example;dmarc=pass action=none header.from=contoso.example;compauth=pass reason=100');
    expect(ms.map((x) => [x.method, x.domain])).toEqual([
      ['spf', 'mail.contoso.example'],
      ['dkim', 'contoso.example'],
      ['dmarc', 'contoso.example'],
      ['compauth', undefined],
    ]);
    expect(ms[0].authserv).toBeUndefined();
    const arc = parseAuthResults('i=2; relay.example; arc=pass (i=1 spf=pass)', 'ARC-Authentication-Results');
    expect(arc[0].source).toBe('ARC-Authentication-Results i=2');
    expect(parseAuthResults('mx.example; none')).toEqual([]);
  });

  it('parses Received-SPF', () => {
    const r = parseReceivedSpf('Pass (protection.outlook.com: domain of mail.contoso.example designates 198.51.100.25 as permitted sender) receiver=protection.outlook.com; client-ip=198.51.100.25; helo=smtp.contoso.example;');
    expect([r?.result, r?.domain, r?.props['client-ip']]).toEqual(['pass', 'mail.contoso.example', '198.51.100.25']);
    expect(parseReceivedSpf('softfail client-ip=1.2.3.4; envelope-from="x@bad.example";')?.domain).toBe('bad.example');
  });
});

describe('full analysis', () => {
  it('Gmail sample: all pass, aligned, no serious flags', () => {
    const a = analyzeHeaders(GMAIL_SAMPLE, NOW);
    expect([a.spf.result, a.dkim.result, a.dmarc.result]).toEqual(['pass', 'pass', 'pass']);
    expect(a.dmarc.domain).toBe('shop.example.com');
    expect(a.alignment).toMatchObject({ spfAligned: true, dkimAligned: true, dkimDomains: ['shop.example.com'] });
    expect(a.from?.name).toBe('Example Shop — Orders');
    expect(a.subject).toBe('Your order #1042 has shipped 🚚');
    expect(a.hops).toHaveLength(3);
    expect(a.hops[0].ip).toBe('10.20.30.7');
    expect(a.hops[1].ip).toBe('203.0.113.45');
    expect(a.hops.map((h) => h.delay)).toEqual([undefined, 2, 1]);
    expect(a.totalDelay).toBe(3);
    expect(a.arc).toEqual([{ instance: 1, cv: 'none', sealDomain: 'google.com' }]);
    expect(a.flags.filter((f) => f.level !== 'low')).toEqual([]);
    expect(a.keyHeaders.find((k) => k.name === 'List-Unsubscribe')?.note).toMatch(/One-click/);
  });

  it('Outlook sample: parses Microsoft headers', () => {
    const a = analyzeHeaders(OUTLOOK_SAMPLE, NOW);
    expect([a.spf.result, a.dkim.result, a.dmarc.result]).toEqual(['pass', 'pass', 'pass']);
    expect(a.spf.domain).toBe('mail.contoso.example');
    expect(a.alignment.spfAligned).toBe(true);
    expect(a.alignment.dkimAligned).toBe(true);
    expect(a.hops).toHaveLength(4);
    expect(a.hops[0].ip).toBe('198.51.100.25');
    expect(a.hops.every((h) => !h.skew)).toBe(true);
    expect(a.keyHeaders.find((k) => k.name === 'X-Mailer')?.value).toBe('Microsoft Outlook 16.0');
    expect(a.flags.filter((f) => f.level === 'high')).toEqual([]);
  });

  it('spoofed sample: raises the expected red flags', () => {
    const a = analyzeHeaders(SPOOFED_SAMPLE, NOW);
    expect([a.spf.result, a.dkim.result, a.dmarc.result]).toEqual(['softfail', 'none', 'fail']);
    // The forged lower header claiming "pass" must not win over the receiving server's verdict.
    expect(a.dmarc.source).toBe('Authentication-Results');
    expect(a.alignment.spfAligned).toBe(false);
    expect(a.alignment.dkimAligned).toBe(false);
    const text = a.flags.map((f) => f.text).join('\n');
    expect(text).toMatch(/DMARC fail/);
    expect(text).toMatch(/SPF softfail/);
    expect(text).toMatch(/display name shows "security@examplebank.com"/);
    expect(text).toMatch(/Reply-To/);
    expect(text).toMatch(/Clock skew: hop 2/);
    expect(text).toMatch(/several servers/);
    expect(a.flags[0].level).toBe('high');
    expect(a.keyHeaders.find((k) => k.name === 'Reply-To')?.warn).toBe(true);
    expect(a.hops[1].skew).toBe(true);
  });

  it('copes with empty and header-less input', () => {
    expect(analyzeHeaders('', NOW).flags).toEqual([]);
    const a = analyzeHeaders('From: a@b.example\nSubject: hi\n', NOW);
    expect(a.flags.map((f) => f.text).join(' ')).toMatch(/No SPF, DKIM or DMARC/);
    expect(a.flags.map((f) => f.text).join(' ')).toMatch(/no Received headers/);
  });

  it('flags punycode domains and future dates', () => {
    const a = analyzeHeaders('From: x@xn--exmple-cua.com\nDate: Mon, 1 Jan 2035 00:00:00 +0000\nMessage-ID: <1@xn--exmple-cua.com>\n', NOW);
    const text = a.flags.map((f) => f.text).join(' ');
    expect(text).toMatch(/Punycode/);
    expect(text).toMatch(/in the future/);
  });
});
