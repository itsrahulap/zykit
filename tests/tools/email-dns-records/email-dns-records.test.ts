import { describe, expect, it } from 'vitest';
import {
  analyse,
  buildDmarc,
  buildSpf,
  DMARC_DEFAULTS,
  extractRecords,
  inspectPublicKey,
  isIPv4,
  isIPv6,
  SPF_DEFAULTS,
  toZoneTxt,
  type Analysis,
} from '../../../src/tools/email-dns-records/features/email-dns-records';

const messages = (a: Analysis, level?: string) => [...a.records.flatMap((r) => r.issues), ...a.issues].filter((i) => !level || i.level === level).map((i) => i.message);
const has = (a: Analysis, re: RegExp, level?: string) => messages(a, level).some((m) => re.test(m));

// A real-format 2048-bit RSA SubjectPublicKeyInfo (modulus 0xFF…FF, e = 65537), built for the tests.
function rsaSpki(bits: number): string {
  const nLen = bits / 8 + 1; // leading zero byte
  const len = (n: number) => (n < 128 ? [n] : n < 256 ? [0x81, n] : [0x82, n >> 8, n & 255]);
  const n = [0x02, ...len(nLen), 0, ...new Array(nLen - 1).fill(0xff)];
  const e = [0x02, 0x03, 1, 0, 1];
  const seqBody = [...n, ...e];
  const rsaKey = [0x30, ...len(seqBody.length), ...seqBody];
  const bit = [0x03, ...len(rsaKey.length + 1), 0, ...rsaKey];
  const alg = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
  const body = [...alg, ...bit];
  const all = [0x30, ...len(body.length), ...body];
  return btoa(String.fromCharCode(...all));
}

describe('extractRecords', () => {
  it('reads plain, quoted, zone-file and dig style input', () => {
    const r = extractRecords(
      [
        'v=spf1 -all',
        '"v=DMARC1; p=none"',
        '_dmarc.example.com. 3600 IN TXT "v=DMARC1; p=reject; " "rua=mailto:a@example.com"',
        '@ IN TXT "v=spf1 mx ~all"',
        '; comment',
        'example.com.\t300\tIN\tTXT\t"v=spf1" " include:x.test -all"',
      ].join('\n'),
    );
    expect(r.map((x) => x.owner)).toEqual(['', '', '_dmarc.example.com', '', 'example.com']);
    expect(r[2].value).toBe('v=DMARC1; p=reject; rua=mailto:a@example.com');
    expect(r[4].value).toBe('v=spf1 include:x.test -all');
    expect(r[2].chunks).toHaveLength(2);
  });

  it('joins parenthesised multi-line records', () => {
    const r = extractRecords('sel._domainkey IN TXT ( "v=DKIM1; k=rsa; "\n  "p=ABCD" )');
    expect(r).toHaveLength(1);
    expect(r[0].value).toBe('v=DKIM1; k=rsa; p=ABCD');
  });
});

describe('SPF', () => {
  it('explains a healthy record', () => {
    const a = analyse('v=spf1 ip4:192.0.2.0/24 include:_spf.google.com mx -all');
    const rec = a.records[0];
    expect(rec.kind).toBe('spf');
    expect(rec.meta.lookups).toBe(2);
    expect(rec.items.some((i) => /Fail/.test(i.meaning))).toBe(true);
    expect(messages(a, 'error')).toEqual([]);
    expect(has(a, /can't be resolved offline/, 'info')).toBe(true);
  });

  it('counts DNS lookups and flags the limit of 10', () => {
    const terms = Array.from({ length: 11 }, (_, i) => `include:s${i}.example.com`).join(' ');
    const a = analyse(`v=spf1 ${terms} -all`);
    expect(a.records[0].meta.lookups).toBe(11);
    expect(has(a, /11 DNS lookups.*limit is 10/, 'error')).toBe(true);
    const near = analyse('v=spf1 a mx ptr exists:x.test redirect=y.test include:a.test include:b.test include:c.test');
    expect(near.records[0].meta.lookups).toBe(8);
    expect(has(near, /8 of 10/, 'warning')).toBe(true);
    expect(analyse('v=spf1 ip4:1.2.3.4 ip6:2001:db8::/32 all').records[0].meta.lookups).toBe(0);
  });

  it('warns about +all, ?all and missing all', () => {
    expect(has(analyse('v=spf1 +all'), /authorises every server/, 'error')).toBe(true);
    expect(has(analyse('v=spf1 all'), /authorises every server/, 'error')).toBe(true);
    expect(has(analyse('v=spf1 mx ?all'), /Neutral and gives no protection/, 'warning')).toBe(true);
    expect(has(analyse('v=spf1 mx'), /no "all" or "redirect"/, 'warning')).toBe(true);
    expect(has(analyse('v=spf1 mx ~all'), /SoftFail/, 'info')).toBe(true);
  });

  it('handles redirect, exp, ptr and misordered terms', () => {
    expect(analyse('v=spf1 redirect=_spf.example.com').records[0].meta.lookups).toBe(1);
    expect(has(analyse('v=spf1 redirect=_spf.example.com -all'), /ignored when the record contains "all"/, 'warning')).toBe(true);
    expect(has(analyse('v=spf1 ptr -all'), /deprecated/, 'warning')).toBe(true);
    expect(has(analyse('v=spf1 -all mx'), /after "all" are never evaluated/, 'warning')).toBe(true);
    const exp = analyse('v=spf1 mx -all exp=why.example.com');
    expect(exp.records[0].items.some((i) => /explanation text/.test(i.meaning))).toBe(true);
    expect(has(analyse('v=spf1 -all exp=a.test exp=b.test'), /"exp" may appear only once/, 'error')).toBe(true);
  });

  it('validates mechanisms and addresses', () => {
    expect(has(analyse('v=spf1 ip4:999.1.1.1 -all'), /not a valid IPv4/, 'error')).toBe(true);
    expect(has(analyse('v=spf1 ip4:10.0.0.0/33 -all'), /not a valid IPv4/, 'error')).toBe(true);
    expect(has(analyse('v=spf1 ip6:nothex -all'), /not a valid IPv6/, 'error')).toBe(true);
    expect(has(analyse('v=spf1 include -all'), /needs a domain/, 'error')).toBe(true);
    expect(has(analyse('v=spf1 foo:bar -all'), /Unknown mechanism "foo"/, 'error')).toBe(true);
    expect(has(analyse('v=spf1 a:mail.example.com/24 mx/24//64 -all'), /not a valid/, 'error')).toBe(false);
    expect(has(analyse('spf1 -all\nv=spf1 mx -all'), /must start with "v=spf1"/, 'error')).toBe(false);
  });

  it('errors on multiple SPF records for the same name', () => {
    const a = analyse('example.com. IN TXT "v=spf1 mx -all"\nexample.com. IN TXT "v=spf1 a -all"');
    expect(has(a, /2 SPF records at example\.com/, 'error')).toBe(true);
    const different = analyse('a.example.com. IN TXT "v=spf1 mx -all"\nb.example.com. IN TXT "v=spf1 a -all"');
    expect(has(different, /SPF records at/, 'error')).toBe(false);
  });

  it('checks record and string length', () => {
    const long = 'v=spf1 ' + Array.from({ length: 40 }, (_, i) => `ip4:10.0.${i}.1`).join(' ') + ' -all';
    expect(has(analyse(long), /at most 255/, 'warning')).toBe(true);
    expect(has(analyse(long), /about 450/, 'warning')).toBe(true);
    expect(has(analyse(`example.com. IN TXT "${'v=spf1 '.padEnd(300, 'x')}"`), /longer than 255/, 'error')).toBe(true);
  });
});

describe('DKIM', () => {
  it('reads RSA key sizes from p=', () => {
    expect(inspectPublicKey(Uint8Array.from(atob(rsaSpki(2048)), (c) => c.charCodeAt(0)))).toEqual({ type: 'rsa', bits: 2048 });
    for (const bits of [1024, 2048, 4096]) {
      const a = analyse(`s1._domainkey.example.com. IN TXT "v=DKIM1; k=rsa; p=${rsaSpki(bits)}"`);
      expect(a.records[0].meta.keyBits).toBe(bits);
    }
    expect(messages(analyse(`v=DKIM1; k=rsa; p=${rsaSpki(2048)}`), 'error')).toEqual([]);
  });

  it('warns about weak keys and testing mode', () => {
    expect(has(analyse(`v=DKIM1; k=rsa; p=${rsaSpki(1024)}`), /1024 bits/, 'warning')).toBe(true);
    expect(has(analyse(`v=DKIM1; p=${rsaSpki(512)}`), /too weak/, 'error')).toBe(true);
    expect(has(analyse(`v=DKIM1; t=y; p=${rsaSpki(2048)}`), /testing mode/, 'warning')).toBe(true);
    expect(has(analyse(`v=DKIM1; h=sha1; p=${rsaSpki(2048)}`), /SHA-1 is deprecated/, 'warning')).toBe(true);
    expect(has(analyse(`v=DKIM1; p=${rsaSpki(4096)}`), /split the p= value/, 'info')).toBe(true);
  });

  it('treats an empty p= as revoked and flags missing or broken keys', () => {
    const revoked = analyse('v=DKIM1; k=rsa; p=');
    expect(revoked.records[0].meta.revoked).toBe(true);
    expect(has(revoked, /revoked/, 'info')).toBe(true);
    expect(messages(revoked, 'error')).toEqual([]);
    expect(has(analyse('v=DKIM1; k=rsa'), /"p=" tag.*missing/, 'error')).toBe(true);
    expect(has(analyse('v=DKIM1; p=!!!!'), /not valid base64/, 'error')).toBe(true);
    expect(has(analyse('v=DKIM1; p=QUJDRA=='), /couldn't be read/, 'warning')).toBe(true);
    expect(has(analyse('v=DKIM1; k=dsa; p=QUJD'), /Unknown key type/, 'error')).toBe(true);
  });

  it('recognises Ed25519 and detects DKIM from the owner name', () => {
    const raw32 = btoa(String.fromCharCode(...new Array(32).fill(7)));
    const a = analyse(`sel._domainkey.example.com. IN TXT "v=DKIM1; k=ed25519; p=${raw32}"`);
    expect(a.records[0].meta).toMatchObject({ keyType: 'ed25519', keyBits: 256 });
    expect(analyse(`sel._domainkey.example.com. IN TXT "k=rsa; p=${rsaSpki(2048)}"`).records[0].kind).toBe('dkim');
    expect(has(analyse(`dkim.example.com. IN TXT "v=DKIM1; p=${rsaSpki(2048)}"`), /_domainkey/, 'warning')).toBe(true);
  });
});

describe('DMARC', () => {
  it('explains tags and warns for monitoring-only', () => {
    const a = analyse('_dmarc.example.com. IN TXT "v=DMARC1; p=none; rua=mailto:r@example.com; adkim=s; fo=1; ri=3600"');
    const rec = a.records[0];
    expect(rec.kind).toBe('dmarc');
    expect(rec.items.map((i) => i.label)).toEqual(['v', 'p', 'rua', 'adkim', 'fo', 'ri']);
    expect(rec.items.find((i) => i.label === 'adkim')?.meaning).toMatch(/strict/);
    expect(has(a, /monitoring only/, 'warning')).toBe(true);
    expect(messages(a, 'error')).toEqual([]);
  });

  it('is clean for an enforcing record with reports', () => {
    const a = analyse('v=DMARC1; p=reject; rua=mailto:r@example.com');
    expect(messages(a, 'error')).toEqual([]);
    expect(messages(a, 'warning')).toEqual([]);
    expect(a.records[0].summary).toMatch(/reject/);
  });

  it('flags structural and value errors', () => {
    expect(has(analyse('p=reject; v=DMARC1'), /must be the first tag/, 'error')).toBe(true);
    expect(has(analyse('v=DMARC1; rua=mailto:a@b.test'), /"p=" policy tag is missing/, 'error')).toBe(true);
    expect(has(analyse('v=DMARC1; p=block'), /p=block is not valid/, 'error')).toBe(true);
    expect(has(analyse('v=DMARC1; p=reject; pct=150'), /pct=150/, 'error')).toBe(true);
    expect(has(analyse('v=DMARC1; p=reject; aspf=x'), /aspf=x/, 'error')).toBe(true);
    expect(has(analyse('v=DMARC1; p=reject; fo=2'), /fo=2/, 'error')).toBe(true);
    expect(has(analyse('v=DMARC1; p=reject; rua=admin@example.com'), /not a valid report URI/, 'error')).toBe(true);
    expect(has(analyse('v=DMARC1; p=reject; foo=1'), /Unknown DMARC tag/, 'warning')).toBe(true);
    expect(has(analyse('v=dmarc1; p=reject'), /capitals/, 'warning')).toBe(true);
  });

  it('warns about partial enforcement, sp=none, missing rua and wrong host', () => {
    expect(has(analyse('v=DMARC1; p=quarantine; pct=25; rua=mailto:a@b.test'), /only 25%/, 'warning')).toBe(true);
    expect(has(analyse('v=DMARC1; p=reject; sp=none; rua=mailto:a@b.test'), /sp=none leaves subdomains/, 'warning')).toBe(true);
    expect(has(analyse('v=DMARC1; p=reject'), /No "rua="/, 'warning')).toBe(true);
    expect(has(analyse('example.com. IN TXT "v=DMARC1; p=reject; rua=mailto:a@example.com"'), /_dmarc\./, 'warning')).toBe(true);
  });

  it('notes external report destinations and errors on duplicates', () => {
    const a = analyse('_dmarc.example.com. IN TXT "v=DMARC1; p=reject; rua=mailto:r@vendor.test"');
    expect(has(a, /example\.com\._report\._dmarc\.vendor\.test/, 'info')).toBe(true);
    const dup = analyse('_dmarc.example.com. IN TXT "v=DMARC1; p=none"\n_dmarc.example.com. IN TXT "v=DMARC1; p=reject"');
    expect(has(dup, /2 DMARC records at _dmarc\.example\.com/, 'error')).toBe(true);
  });
});

describe('MTA-STS, TLS-RPT and BIMI', () => {
  it('validates MTA-STS', () => {
    expect(messages(analyse('_mta-sts.example.com. IN TXT "v=STSv1; id=20240101T000000"'), 'error')).toEqual([]);
    expect(has(analyse('v=STSv1'), /"id=" tag is missing/, 'error')).toBe(true);
    expect(has(analyse('v=STSv1; id=a-b'), /id= must be/, 'error')).toBe(true);
  });

  it('validates TLS-RPT', () => {
    expect(messages(analyse('_smtp._tls.example.com. IN TXT "v=TLSRPTv1; rua=mailto:t@example.com,https://rpt.example.com/x"'), 'error')).toEqual([]);
    expect(has(analyse('v=TLSRPTv1'), /"rua=" tag is missing/, 'error')).toBe(true);
    expect(has(analyse('v=TLSRPTv1; rua=http://x.test'), /must be "mailto/, 'error')).toBe(true);
  });

  it('validates BIMI and relates it to DMARC', () => {
    expect(messages(analyse('default._bimi.example.com. IN TXT "v=BIMI1; l=https://example.com/logo.svg; a=https://example.com/vmc.pem"'), 'error')).toEqual([]);
    expect(has(analyse('v=BIMI1; l=http://example.com/logo.svg'), /must be an https/, 'error')).toBe(true);
    expect(has(analyse('v=BIMI1; l=https://example.com/logo.png'), /SVG/, 'warning')).toBe(true);
    expect(has(analyse('v=BIMI1; l='), /declines BIMI/, 'info')).toBe(true);
    expect(has(analyse('v=BIMI1; a=https://x.test/v.pem'), /"l=" tag/, 'error')).toBe(true);
    const mixed = analyse('v=BIMI1; l=https://x.test/l.svg\n_dmarc.x.test. IN TXT "v=DMARC1; p=none"');
    expect(has(mixed, /DMARC policy is not quarantine or reject/, 'warning')).toBe(true);
  });
});

describe('general', () => {
  it('skips unrelated records and handles empty input', () => {
    const a = analyse('example.com. IN TXT "google-site-verification=abc"');
    expect(a.records[0].kind).toBe('unknown');
    expect(analyse('').records).toEqual([]);
    expect(has(analyse('hello'), /No TXT records found/, 'warning')).toBe(true);
    expect(has(analyse('example.com. IN A 1.2.3.4'), /No TXT records found/, 'warning')).toBe(true);
  });

  it('validates IP addresses', () => {
    expect(isIPv4('192.0.2.1')).toBe(true);
    expect(isIPv4('192.0.2')).toBe(false);
    expect(isIPv6('2001:db8::1')).toBe(true);
    expect(isIPv6('::1')).toBe(true);
    expect(isIPv6('::ffff:192.0.2.1')).toBe(true);
    expect(isIPv6('1:2:3:4:5:6:7:8:9')).toBe(false);
    expect(isIPv6('1::2::3')).toBe(false);
  });
});

describe('builders', () => {
  it('builds a DMARC record omitting defaults', () => {
    expect(buildDmarc(DMARC_DEFAULTS)).toBe('v=DMARC1; p=none');
    expect(
      buildDmarc({ ...DMARC_DEFAULTS, policy: 'quarantine', subdomainPolicy: 'reject', pct: 50, rua: 'a@example.com, mailto:b@example.com', ruf: 'f@example.com', adkim: 's', aspf: 's', fo: '1', ri: 3600 }),
    ).toBe('v=DMARC1; p=quarantine; sp=reject; pct=50; rua=mailto:a@example.com,mailto:b@example.com; ruf=mailto:f@example.com; adkim=s; aspf=s; fo=1; ri=3600');
    expect(buildDmarc({ ...DMARC_DEFAULTS, policy: 'reject', subdomainPolicy: 'reject' })).toBe('v=DMARC1; p=reject');
    expect(buildDmarc({ ...DMARC_DEFAULTS, pct: 500 })).toBe('v=DMARC1; p=none');
  });

  it('builds SPF records that analyse cleanly', () => {
    const spf = buildSpf({ ...SPF_DEFAULTS, mx: true, a: true, ip4: '192.0.2.0/24', ip6: '2001:db8::/32', includes: '_spf.google.com spf.protection.outlook.com', all: '-all' });
    expect(spf).toBe('v=spf1 a mx ip4:192.0.2.0/24 ip6:2001:db8::/32 include:_spf.google.com include:spf.protection.outlook.com -all');
    const a = analyse(spf);
    expect(a.records[0].meta.lookups).toBe(4);
    expect(messages(a, 'error')).toEqual([]);
    expect(buildSpf({ ...SPF_DEFAULTS, redirect: '_spf.example.com' })).toBe('v=spf1 redirect=_spf.example.com');
    expect(buildSpf(SPF_DEFAULTS)).toBe('v=spf1 ~all');
  });

  it('round-trips builder output through the analyser', () => {
    const rec = buildDmarc({ ...DMARC_DEFAULTS, policy: 'reject', rua: 'r@example.com' });
    const a = analyse(rec);
    expect(messages(a, 'error')).toEqual([]);
    expect(a.records[0].meta.policy).toBe('reject');
  });

  it('splits long values into 255-character quoted strings', () => {
    expect(toZoneTxt('abc')).toBe('"abc"');
    const parts = toZoneTxt('x'.repeat(600)).split('" "');
    expect(parts).toHaveLength(3);
    expect(parts[0].length).toBe(256);
  });
});
