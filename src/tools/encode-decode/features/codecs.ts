// Text codecs. Everything works on UTF-8 bytes, so any Unicode text round-trips.

export type CodecId = 'base64' | 'base64url' | 'url-component' | 'url' | 'html' | 'hex';
export type Direction = 'encode' | 'decode';

export interface CodecOptions {
  /** HTML encode: also escape every non-ASCII character as &#x..; */
  htmlAllNonAscii?: boolean;
}

export class CodecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodecError';
  }
}

export const CODECS: { id: CodecId; label: string; hint: string }[] = [
  { id: 'base64', label: 'Base64', hint: 'Standard alphabet with = padding (RFC 4648).' },
  { id: 'base64url', label: 'Base64URL', hint: 'URL-safe alphabet (- and _), no padding. Used in JWTs.' },
  { id: 'url-component', label: 'URL component', hint: 'encodeURIComponent: escapes everything except A–Z a–z 0–9 - _ . ! ~ * \' ( ).' },
  { id: 'url', label: 'Full URL', hint: 'encodeURI: keeps URL structure such as : / ? # & = intact.' },
  { id: 'html', label: 'HTML entities', hint: 'Escapes & < > " \' for safe use in HTML.' },
  { id: 'hex', label: 'Hex', hint: 'UTF-8 bytes as hexadecimal. Decoding ignores spaces, colons and 0x prefixes.' },
];

const encoder = new TextEncoder();
const strictUtf8 = new TextDecoder('utf-8', { fatal: true });

export function utf8Decode(bytes: Uint8Array): string {
  try {
    return strictUtf8.decode(bytes);
  } catch {
    throw new CodecError('The decoded bytes are not valid UTF-8 text.');
  }
}

// ---- Base64 / Base64URL

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function bytesToBase64(bytes: Uint8Array, url = false): string {
  const abc = url ? B64URL : B64;
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += abc[n >> 18] + abc[(n >> 12) & 63] + abc[(n >> 6) & 63] + abc[n & 63];
  }
  const rest = bytes.length - i;
  if (rest === 1) {
    const n = bytes[i] << 16;
    out += abc[n >> 18] + abc[(n >> 12) & 63] + (url ? '' : '==');
  } else if (rest === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += abc[n >> 18] + abc[(n >> 12) & 63] + abc[(n >> 6) & 63] + (url ? '' : '=');
  }
  return out;
}

/** Strict decoder. Whitespace is ignored; padding is optional for Base64URL and, if present, must be correct. */
export function base64ToBytes(input: string, url = false): Uint8Array {
  const abc = url ? B64URL : B64;
  const s = input.replace(/\s+/g, '');
  const pad = s.match(/=*$/)![0].length;
  const body = s.slice(0, s.length - pad);
  for (let i = 0; i < body.length; i++) {
    if (abc.indexOf(body[i]) < 0) {
      const other = url ? B64 : B64URL;
      const tip = other.includes(body[i])
        ? ` That character belongs to ${url ? 'standard Base64' : 'Base64URL'} — try that codec instead.`
        : '';
      throw new CodecError(`Invalid ${url ? 'Base64URL' : 'Base64'} character "${body[i]}" at position ${i + 1}.${tip}`);
    }
  }
  if (pad > 2 || (pad > 0 && s.length % 4 !== 0)) throw new CodecError('Invalid Base64 padding.');
  if (body.length % 4 === 1) throw new CodecError('Invalid Base64 length: the input is truncated or has an extra character.');

  const out = new Uint8Array(Math.floor((body.length * 3) / 4));
  let o = 0;
  let buf = 0;
  let bits = 0;
  for (let i = 0; i < body.length; i++) {
    buf = (buf << 6) | abc.indexOf(body[i]);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (buf >> bits) & 0xff;
    }
  }
  return out;
}

// ---- URL

function uriDecode(input: string, fn: (s: string) => string): string {
  try {
    return fn(input);
  } catch {
    throw new CodecError('Malformed percent-encoding: every % must be followed by two hex digits forming valid UTF-8.');
  }
}

function uriEncode(input: string, fn: (s: string) => string): string {
  try {
    return fn(input);
  } catch {
    throw new CodecError('The text contains an unpaired surrogate character that cannot be URL-encoded.');
  }
}

// ---- HTML entities

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  copy: '©', reg: '®', trade: '™', hellip: '…', mdash: '—', ndash: '–',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', bull: '•', middot: '·',
  deg: '°', plusmn: '±', times: '×', divide: '÷', micro: 'µ', para: '¶', sect: '§',
  cent: '¢', pound: '£', euro: '€', yen: '¥', curren: '¤',
  iexcl: '¡', iquest: '¿', shy: '­', ensp: ' ', emsp: ' ', thinsp: ' ',
  larr: '←', rarr: '→', uarr: '↑', darr: '↓', harr: '↔', hearts: '♥',
  frac12: '½', frac14: '¼', frac34: '¾', sup1: '¹', sup2: '²', sup3: '³',
  agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã', auml: 'ä', aring: 'å', aelig: 'æ', ccedil: 'ç',
  egrave: 'è', eacute: 'é', ecirc: 'ê', euml: 'ë', igrave: 'ì', iacute: 'í', icirc: 'î', iuml: 'ï',
  ntilde: 'ñ', ograve: 'ò', oacute: 'ó', ocirc: 'ô', otilde: 'õ', ouml: 'ö', oslash: 'ø',
  ugrave: 'ù', uacute: 'ú', ucirc: 'û', uuml: 'ü', yacute: 'ý', yuml: 'ÿ', szlig: 'ß',
  Agrave: 'À', Aacute: 'Á', Acirc: 'Â', Atilde: 'Ã', Auml: 'Ä', Aring: 'Å', AElig: 'Æ', Ccedil: 'Ç',
  Egrave: 'È', Eacute: 'É', Ecirc: 'Ê', Euml: 'Ë', Ntilde: 'Ñ', Ouml: 'Ö', Oslash: 'Ø', Uuml: 'Ü',
};

export function htmlEncode(input: string, allNonAscii = false): string {
  let out = '';
  for (const ch of input) {
    switch (ch) {
      case '&': out += '&amp;'; break;
      case '<': out += '&lt;'; break;
      case '>': out += '&gt;'; break;
      case '"': out += '&quot;'; break;
      case "'": out += '&#39;'; break;
      default: {
        const cp = ch.codePointAt(0)!;
        out += allNonAscii && cp > 0x7e ? `&#x${cp.toString(16).toUpperCase()};` : ch;
      }
    }
  }
  return out;
}

/** Decodes named (common set) and numeric entities without touching the DOM. Unknown entities are left as-is. */
export function htmlDecode(input: string): string {
  return input.replace(/&(#[xX][0-9a-fA-F]+|#[0-9]+|[A-Za-z][A-Za-z0-9]*);/g, (m, body: string) => {
    if (body[0] === '#') {
      const cp = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      // Out of range, surrogates and NUL become the replacement character, as browsers do.
      if (!Number.isFinite(cp) || cp === 0 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return '�';
      return String.fromCodePoint(cp);
    }
    return Object.hasOwn(NAMED, body) ? NAMED[body] : m;
  });
}

// ---- Hex

export function bytesToHex(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

export function hexToBytes(input: string): Uint8Array {
  const s = input.replace(/0x/gi, '').replace(/[\s:,-]+/g, '');
  const bad = s.search(/[^0-9a-fA-F]/);
  if (bad >= 0) throw new CodecError(`Invalid hex character "${s[bad]}".`);
  if (s.length % 2) throw new CodecError(`Hex input has an odd number of digits (${s.length}); each byte needs two.`);
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.substr(i * 2, 2), 16);
  return out;
}

// ---- Entry point

export function transform(codec: CodecId, direction: Direction, input: string, opts: CodecOptions = {}): string {
  const enc = direction === 'encode';
  switch (codec) {
    case 'base64':
    case 'base64url': {
      const url = codec === 'base64url';
      return enc ? bytesToBase64(encoder.encode(input), url) : utf8Decode(base64ToBytes(input, url));
    }
    case 'url-component':
      return enc ? uriEncode(input, encodeURIComponent) : uriDecode(input, decodeURIComponent);
    case 'url':
      return enc ? uriEncode(input, encodeURI) : uriDecode(input, decodeURI);
    case 'html':
      return enc ? htmlEncode(input, opts.htmlAllNonAscii) : htmlDecode(input);
    case 'hex':
      return enc ? bytesToHex(encoder.encode(input)) : utf8Decode(hexToBytes(input));
  }
}
