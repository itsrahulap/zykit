import { describe, expect, it } from 'vitest';
import {
  binarySplit,
  cidrInfo,
  classify,
  compressIPv6,
  contains,
  expandIPv6,
  formatIPv4,
  ipv4Class,
  parseAddress,
  parseCidr,
  parseIPv6,
  rangeToCidrs,
  reverseDns,
  splitByPrefix,
  splitInto,
  summarise,
  toBinary,
  type Cidr,
} from '../../../src/tools/ip-cidr-calculator/features/ip-cidr-calculator';

const cidr = (s: string): Cidr => {
  const r = parseCidr(s);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};
const info = (s: string) => cidrInfo(cidr(s));
const v4 = formatIPv4;

describe('parsing', () => {
  it('reads IPv4 CIDR, netmask and bare IP', () => {
    expect(cidr('192.168.1.10/24')).toEqual({ version: 4, address: 0xc0a8010an, prefix: 24 });
    expect(cidr('192.168.1.10 255.255.255.0').prefix).toBe(24);
    expect(cidr('192.168.1.10/255.255.254.0').prefix).toBe(23);
    expect(cidr('10.0.0.1').prefix).toBe(32);
    expect(cidr(' 10.0.0.0 / 8 ').prefix).toBe(8);
  });

  it('explains bad input', () => {
    const bad = (s: string) => {
      const r = parseCidr(s);
      return r.ok ? '' : r.error;
    };
    expect(bad('256.0.0.1/8')).toMatch(/isn't a valid/);
    expect(bad('10.0.0.0/33')).toMatch(/0–32/);
    expect(bad('10.0.0.0/255.0.255.0')).toMatch(/contiguous/);
    expect(bad('10.0.0.0 0.0.0.255')).toMatch(/wildcard mask; the netmask is 255.255.255.0 \(\/24\)/);
    expect(bad('')).toMatch(/Enter/);
    expect(bad('::1/129')).toMatch(/0–128/);
  });

  it('reads IPv6 in every notation', () => {
    expect(parseIPv6('::')).toBe(0n);
    expect(parseIPv6('::1')).toBe(1n);
    expect(parseIPv6('2001:db8::1')).toBe(0x20010db8000000000000000000000001n);
    expect(parseIPv6('2001:0DB8:0000:0000:0000:0000:0000:0001')).toBe(0x20010db8000000000000000000000001n);
    expect(parseIPv6('::ffff:192.0.2.1')).toBe(0xffffc0000201n);
    expect(parseIPv6('::192.0.2.1')).toBe(0xc0000201n);
    expect(parseIPv6('64:ff9b::192.0.2.1')).toBe(0x0064ff9b0000000000000000c0000201n);
    expect(parseIPv6('fe80::1%eth0')).toBe(0xfe800000000000000000000000000001n);
    expect(parseIPv6('[::1]')).toBe(1n);
    expect(parseIPv6('1::2::3')).toBeNull();
    expect(parseIPv6('1:2:3:4:5:6:7:8:9')).toBeNull();
    expect(parseIPv6('1:2:3:4:5:6:7')).toBeNull();
    expect(parseIPv6('12345::')).toBeNull();
    expect(parseIPv6('g::')).toBeNull();
    expect(parseAddress('1.2.3')).toBeNull();
  });
});

describe('IPv6 formatting', () => {
  it('compresses per RFC 5952', () => {
    expect(compressIPv6(parseIPv6('2001:db8:0:0:0:0:2:1')!)).toBe('2001:db8::2:1');
    expect(compressIPv6(parseIPv6('2001:db8:0:1:1:1:1:1')!)).toBe('2001:db8:0:1:1:1:1:1'); // single 0 not compressed
    expect(compressIPv6(parseIPv6('2001:0:0:1:0:0:0:1')!)).toBe('2001:0:0:1::1'); // longest run
    expect(compressIPv6(parseIPv6('2001:db8:0:0:1:0:0:1')!)).toBe('2001:db8::1:0:0:1'); // first of equal runs
    expect(compressIPv6(0n)).toBe('::');
    expect(compressIPv6(1n)).toBe('::1');
    expect(compressIPv6(parseIPv6('fe80::')!)).toBe('fe80::');
    expect(compressIPv6(parseIPv6('::ffff:1.2.3.4')!)).toBe('::ffff:1.2.3.4');
  });
  it('expands', () => {
    expect(expandIPv6(1n)).toBe('0000:0000:0000:0000:0000:0000:0000:0001');
  });
});

describe('cidrInfo', () => {
  it('calculates an IPv4 network', () => {
    const i = info('192.168.1.10/24');
    expect(v4(i.network)).toBe('192.168.1.0');
    expect(v4(i.broadcast)).toBe('192.168.1.255');
    expect(v4(i.firstHost)).toBe('192.168.1.1');
    expect(v4(i.lastHost)).toBe('192.168.1.254');
    expect(i.total).toBe(256n);
    expect(i.usable).toBe(254n);
    expect(v4(i.netmask)).toBe('255.255.255.0');
    expect(v4(i.wildcard)).toBe('0.0.0.255');
    expect(i.hostBitsSet).toBe(true);
    expect(i.classification.name).toBe('Private network');
    expect(i.classification.rfc).toBe('RFC 1918');
  });

  it('handles /31, /32 and /0', () => {
    expect(info('10.0.0.0/31').usable).toBe(2n);
    expect(v4(info('10.0.0.0/31').firstHost)).toBe('10.0.0.0');
    expect(info('10.0.0.5/32').usable).toBe(1n);
    expect(info('0.0.0.0/0').total).toBe(4294967296n);
    expect(info('0.0.0.0/0').usable).toBe(4294967294n);
  });

  it('calculates IPv6 with BigInt', () => {
    const i = info('2001:db8:abcd::1/48');
    expect(compressIPv6(i.network)).toBe('2001:db8:abcd::');
    expect(compressIPv6(i.lastHost)).toBe('2001:db8:abcd:ffff:ffff:ffff:ffff:ffff');
    expect(i.total).toBe(1n << 80n);
    expect(i.classification.name).toBe('Documentation');
    expect(info('::/0').total).toBe(1n << 128n);
  });

  it('shows binary with the prefix split', () => {
    expect(toBinary(0xc0a80100n, 4)).toBe('11000000.10101000.00000001.00000000');
    expect(binarySplit(0xc0a80100n, 4, 24)).toEqual(['11000000.10101000.00000001', '.00000000']);
    expect(binarySplit(0xc0a80100n, 4, 20)).toEqual(['11000000.10101000.0000', '0001.00000000']);
    expect(binarySplit(0n, 4, 0)[0]).toBe('');
    expect(binarySplit(0n, 4, 32)[1]).toBe('');
  });

  it('gives class and reverse DNS', () => {
    expect(ipv4Class(0x0a000000n)).toBe('A');
    expect(ipv4Class(0xc0000000n)).toBe('C');
    expect(ipv4Class(0xe0000000n)).toMatch(/^D/);
    expect(reverseDns({ version: 4, value: 0xc0000201n })).toBe('1.2.0.192.in-addr.arpa');
    expect(reverseDns({ version: 6, value: 1n })).toMatch(/^1\.0\.0\..*\.ip6\.arpa$/);
  });
});

describe('classify', () => {
  const name = (s: string) => {
    const a = parseAddress(s)!;
    return classify(a).name;
  };
  it('recognises special-purpose ranges', () => {
    expect(name('10.1.2.3')).toBe('Private network');
    expect(name('172.31.255.255')).toBe('Private network');
    expect(name('172.32.0.0')).toBe('Public (global unicast)');
    expect(name('100.64.0.1')).toMatch(/Carrier-grade NAT/);
    expect(name('127.0.0.1')).toBe('Loopback');
    expect(name('169.254.1.1')).toBe('Link-local');
    expect(name('224.0.0.251')).toBe('Multicast');
    expect(name('198.51.100.7')).toMatch(/TEST-NET-2/);
    expect(name('255.255.255.255')).toBe('Limited broadcast');
    expect(name('0.0.0.0')).toBe('Unspecified address');
    expect(name('8.8.8.8')).toBe('Public (global unicast)');
    expect(name('::1')).toBe('Loopback');
    expect(name('fd12:3456::1')).toMatch(/ULA/);
    expect(name('fe80::1')).toBe('Link-local');
    expect(name('ff02::1')).toBe('Multicast');
    expect(name('2606:4700::1111')).toBe('Global unicast');
    expect(name('::ffff:10.0.0.1')).toBe('IPv4-mapped address');
  });
  it('flags blocks that mix ranges', () => {
    expect(cidrInfo(cidr('192.0.0.0/8')).classification.name).toMatch(/^Mixed: contains 192.0.0.0\/24/);
  });
});

describe('contains, split and summarise', () => {
  it('checks membership', () => {
    expect(contains(cidr('10.0.0.0/8'), cidr('10.255.1.1'))).toBe(true);
    expect(contains(cidr('10.0.0.0/8'), cidr('11.0.0.1'))).toBe(false);
    expect(contains(cidr('10.0.0.0/8'), cidr('10.1.0.0/16'))).toBe(true);
    expect(contains(cidr('10.1.0.0/16'), cidr('10.0.0.0/8'))).toBe(false);
    expect(contains(cidr('10.0.0.0/8'), cidr('::1'))).toBe(false);
    expect(contains(cidr('2001:db8::/32'), cidr('2001:db8:1::5'))).toBe(true);
  });

  it('splits by prefix or count', () => {
    const r = splitByPrefix(cidr('192.168.0.0/24'), 26);
    expect(r.ok && r.value.subnets.map(v4)).toEqual(['192.168.0.0', '192.168.0.64', '192.168.0.128', '192.168.0.192']);
    const n = splitInto(cidr('192.168.0.0/24'), 3);
    expect(n.ok && n.value.prefix).toBe(26);
    expect(splitInto(cidr('192.168.0.0/24'), 1).ok && splitInto(cidr('192.168.0.0/24'), 1)).toMatchObject({ value: { prefix: 24 } });
    expect(splitByPrefix(cidr('10.0.0.0/8'), 4).ok).toBe(false);
    expect(splitInto(cidr('10.0.0.0/31'), 4).ok).toBe(false);
    const big = splitByPrefix(cidr('2001:db8::/32'), 64);
    expect(big.ok && big.value.truncated).toBe(true);
    expect(big.ok && big.value.count).toBe(1n << 32n);
    expect(big.ok && big.value.subnets.length).toBe(4096);
  });

  it('turns ranges into CIDRs', () => {
    const r = rangeToCidrs(0x0a000001n, 0x0a000006n, 4).map((b) => `${v4(b.network)}/${b.prefix}`);
    expect(r).toEqual(['10.0.0.1/32', '10.0.0.2/31', '10.0.0.4/31', '10.0.0.6/32']);
    expect(rangeToCidrs(0n, (1n << 32n) - 1n, 4)).toEqual([{ network: 0n, prefix: 0 }]);
  });

  it('summarises a list', () => {
    const s = summarise('192.168.0.0/24\n192.168.1.0/24\n192.168.1.5\n10.0.0.0/8, 10.1.0.0/16\n2001:db8::/33\n2001:db8:8000::/33\nnope # comment');
    expect(s.cidrs).toEqual(['10.0.0.0/8', '192.168.0.0/23', '2001:db8::/32']);
    expect(s.errors).toHaveLength(1);
    expect(summarise('192.168.0.0/24\n192.168.2.0/24').cidrs).toEqual(['192.168.0.0/24', '192.168.2.0/24']);
  });
});
