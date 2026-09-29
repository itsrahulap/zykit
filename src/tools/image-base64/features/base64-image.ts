// Image ⇄ Base64 / data URI. Pure: bytes in, strings out (and back), with strict validation.

import { base64ToBytes, Base64Error, bytesToBase64 } from '../../../shared/lib/base64';
import { MIME_EXT, sniffImageType, type SniffedType } from '../../../shared/lib/image';

/** Largest image we encode (the text would be a third bigger). */
export const MAX_ENCODE_BYTES = 10 * 1024 * 1024;
/** Largest image we decode. */
export const MAX_DECODE_BYTES = 20 * 1024 * 1024;
const MAX_INPUT_CHARS = Math.ceil((MAX_DECODE_BYTES * 4) / 3) * 1.1 + 1024;

export type SnippetKind = 'data-uri' | 'base64' | 'css' | 'html';

export interface Encoded {
  base64: string;
  dataUri: string;
  /** Extra size of the Base64 text over the binary, as a fraction (≈ 0.33). */
  overhead: number;
}

export function encodeImage(bytes: Uint8Array, mime: string): Encoded {
  if (bytes.length > MAX_ENCODE_BYTES) throw new Base64Error(`Images up to ${MAX_ENCODE_BYTES / 1024 / 1024} MB can be encoded; data URIs that big are rarely a good idea anyway.`);
  const base64 = bytesToBase64(bytes);
  const dataUri = `data:${mime};base64,${base64}`;
  return { base64, dataUri, overhead: bytes.length ? base64.length / bytes.length - 1 : 0 };
}

export function snippet(kind: SnippetKind, e: Encoded, alt = ''): string {
  switch (kind) {
    case 'data-uri':
      return e.dataUri;
    case 'base64':
      return e.base64;
    case 'css':
      return `background-image: url("${e.dataUri}");`;
    case 'html':
      return `<img src="${e.dataUri}" alt="${alt.replace(/[&"<>]/g, (c) => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[c]!)}">`;
  }
}

export interface Decoded {
  bytes: Uint8Array;
  /** MIME type from the data URI, if there was one. */
  declared: string | null;
  /** Type identified from the bytes; null if it isn't a known image format. */
  detected: SniffedType | null;
  warnings: string[];
}

const DATA_URI = /^data:([^,]*?),([\s\S]*)$/i;

/**
 * Decode pasted text: a data URI (also inside CSS url(…) or an <img src>), or raw Base64 / Base64URL.
 * Throws Base64Error with a readable message.
 */
export function decodeInput(text: string): Decoded {
  if (text.length > MAX_INPUT_CHARS) throw new Base64Error(`That's more than ${MAX_DECODE_BYTES / 1024 / 1024} MB of image data, which is the limit here.`);
  let s = text.trim();
  // Pull a data URI out of CSS, HTML or JSON wrappers.
  const at = s.search(/data:/i);
  if (at > 0) s = s.slice(at).split(/["')>]/)[0].replace(/;\s*$/, '').trim();
  s = s.replace(/^["']|["']$/g, '');
  if (!s) throw new Base64Error('Paste a Base64 string or a data URI.');

  let declared: string | null = null;
  let bytes: Uint8Array;
  const warnings: string[] = [];
  const m = DATA_URI.exec(s);
  if (m) {
    const params = m[1].split(';').map((p) => p.trim());
    declared = params[0].toLowerCase() || 'text/plain';
    const isBase64 = params.slice(1).some((p) => p.toLowerCase() === 'base64');
    if (isBase64) bytes = decodeBase64(m[2]);
    else {
      try {
        bytes = new TextEncoder().encode(decodeURIComponent(m[2]));
      } catch {
        throw new Base64Error('This data URI has invalid percent-encoding (a % not followed by two hex digits).');
      }
    }
  } else {
    if (/^data:/i.test(s)) throw new Base64Error('This data URI has no comma separating the type from the data.');
    bytes = decodeBase64(s);
  }
  if (!bytes.length) throw new Base64Error('The data is empty.');
  if (bytes.length > MAX_DECODE_BYTES) throw new Base64Error(`That's more than ${MAX_DECODE_BYTES / 1024 / 1024} MB of image data, which is the limit here.`);

  const detected = sniffImageType(bytes);
  if (!detected) warnings.push("These bytes don't match any known image format, so there's no preview. You can still download them.");
  else if (declared && declared !== detected.mime && !(declared === 'image/jpg' && detected.mime === 'image/jpeg') && !(declared === 'image/vnd.microsoft.icon' && detected.mime === 'image/x-icon'))
    warnings.push(`The data URI says ${declared}, but the bytes are ${detected.label}. The detected type is used.`);
  return { bytes, declared, detected, warnings };
}

function decodeBase64(raw: string): Uint8Array {
  const s = raw.replace(/\s+/g, '');
  // Base64URL uses - and _ instead of + and /.
  const url = /[-_]/.test(s) && !/[+/]/.test(s);
  try {
    return base64ToBytes(s, url);
  } catch (e) {
    if (e instanceof Base64Error) throw e;
    throw new Base64Error('This is not valid Base64.');
  }
}

export const downloadName = (d: Decoded) => `image.${d.detected?.ext ?? (d.declared && MIME_EXT[d.declared]) ?? 'bin'}`;
