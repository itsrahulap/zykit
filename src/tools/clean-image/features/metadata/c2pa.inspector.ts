// Lightweight C2PA / Content Credentials detector.
//
// This does NOT validate manifests or signatures. It only looks for well-known
// strings inside the embedded JUMBF/CBOR payload so we can tell the user that
// provenance data is present and what it claims.

import { latin1 } from '../../../../shared/lib/bytes';

export interface C2paInspection {
  generator?: string;
  declaresAi: boolean;
}

const MAX_SCAN = 4 * 1024 * 1024;
const utf8 = new TextDecoder('utf-8');

/** Reads a CBOR text string (major type 3) starting at `o`. */
function readCborText(b: Uint8Array, o: number): string | undefined {
  if (o >= b.length) return undefined;
  const h = b[o];
  if (h >> 5 !== 3) return undefined;
  const ai = h & 0x1f;
  let len: number;
  let start: number;
  if (ai < 24) {
    len = ai;
    start = o + 1;
  } else if (ai === 24) {
    len = b[o + 1];
    start = o + 2;
  } else if (ai === 25) {
    len = (b[o + 1] << 8) | b[o + 2];
    start = o + 3;
  } else return undefined;
  if (start + len > b.length) return undefined;
  return utf8.decode(b.subarray(start, start + Math.min(len, 300)));
}

export function inspectC2pa(payload: Uint8Array): C2paInspection {
  const b = payload.length > MAX_SCAN ? payload.subarray(0, MAX_SCAN) : payload;
  const text = latin1(b);
  let generator: string | undefined;

  // C2PA 1.x: "claim_generator": "<text>"
  const KEY = 'claim_generator';
  let idx = text.indexOf(KEY);
  while (idx >= 0 && !generator) {
    const after = idx + KEY.length;
    if (text[after] === '_') {
      // C2PA 2.x: "claim_generator_info": [{ "name": "<text>", ... }]
      const nameIdx = text.indexOf('name', after);
      if (nameIdx >= 0 && nameIdx - after < 64) generator = readCborText(b, nameIdx + 4);
    } else {
      generator = readCborText(b, after);
    }
    idx = text.indexOf(KEY, after);
  }

  const declaresAi = /trainedAlgorithmicMedia|compositeWithTrainedAlgorithmicMedia/.test(text);
  return { generator: generator?.trim() || undefined, declaresAi };
}
