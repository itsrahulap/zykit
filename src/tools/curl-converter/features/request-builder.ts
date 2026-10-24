// Request builder state, URL/query parsing, auth compilation, and conversion to/from HttpRequest.

import { tryBase64ToBytes } from '../../../shared/lib/base64';
import { getHeader, type FormPart, type HttpRequest, type RequestBody } from './curl';

export type AuthType = 'none' | 'bearer' | 'basic' | 'apiKey';
export type BodyType = 'none' | 'json' | 'text' | 'form' | 'multipart';

export interface KeyValueParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface MultipartPart {
  id: string;
  name: string;
  type: 'text' | 'file';
  value: string;
  contentType?: string;
  enabled: boolean;
}

export interface RequestBuilderState {
  method: string;
  url: string;
  queryParams: KeyValueParam[];
  headers: KeyValueParam[];
  authType: AuthType;
  bearerToken: string;
  basicUser: string;
  basicPassword: string;
  apiKeyName: string;
  apiKeyValue: string;
  apiKeyPlacement: 'header' | 'query';
  bodyType: BodyType;
  jsonBody: string;
  textBody: string;
  formBody: KeyValueParam[];
  multipartBody: MultipartPart[];
  followRedirects: boolean;
  insecure: boolean;
  compressed: boolean;
}

let paramCounter = 1;
export function createId(): string {
  return `rb_${Date.now()}_${paramCounter++}`;
}

export function emptyBuilderState(): RequestBuilderState {
  return {
    method: 'GET',
    url: 'https://api.example.com/v1/resource',
    queryParams: [],
    headers: [],
    authType: 'none',
    bearerToken: '',
    basicUser: '',
    basicPassword: '',
    apiKeyName: 'X-API-Key',
    apiKeyValue: '',
    apiKeyPlacement: 'header',
    bodyType: 'none',
    jsonBody: '{\n  "key": "value"\n}',
    textBody: '',
    formBody: [],
    multipartBody: [],
    followRedirects: true,
    insecure: false,
    compressed: false,
  };
}

// ---------------------------------------------------------------------------
// URL & Query Parsing / Serialization

export function parseUrlToQuery(fullUrl: string): { baseUrl: string; queryParams: KeyValueParam[] } {
  const qIndex = fullUrl.indexOf('?');
  if (qIndex === -1) {
    return { baseUrl: fullUrl, queryParams: [] };
  }

  const baseUrl = fullUrl.slice(0, qIndex);
  const search = fullUrl.slice(qIndex + 1);
  if (!search) {
    return { baseUrl, queryParams: [] };
  }

  const queryParams: KeyValueParam[] = [];
  const parts = search.split('&');
  for (const part of parts) {
    if (!part) continue;
    const eq = part.indexOf('=');
    if (eq === -1) {
      queryParams.push({
        id: createId(),
        key: decodeSafe(part),
        value: '',
        enabled: true,
      });
    } else {
      queryParams.push({
        id: createId(),
        key: decodeSafe(part.slice(0, eq)),
        value: decodeSafe(part.slice(eq + 1)),
        enabled: true,
      });
    }
  }

  return { baseUrl, queryParams };
}

function decodeSafe(val: string): string {
  try {
    return decodeURIComponent(val.replace(/\+/g, ' '));
  } catch {
    return val;
  }
}

export function buildFullUrl(
  baseUrl: string,
  queryParams: KeyValueParam[],
  apiKey?: { name: string; value: string; placement: 'query'; enabled: boolean },
): string {
  const cleanBase = baseUrl.trim();
  if (!cleanBase) return '';

  const activeParams = queryParams.filter((p) => p.enabled && p.key.trim());
  const searchPairs: string[] = [];

  for (const p of activeParams) {
    searchPairs.push(`${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value)}`);
  }

  if (apiKey && apiKey.placement === 'query' && apiKey.enabled && apiKey.name.trim() && apiKey.value.trim()) {
    searchPairs.push(`${encodeURIComponent(apiKey.name.trim())}=${encodeURIComponent(apiKey.value.trim())}`);
  }

  if (searchPairs.length === 0) return cleanBase;
  const separator = cleanBase.includes('?') ? '&' : '?';
  return `${cleanBase}${separator}${searchPairs.join('&')}`;
}

// ---------------------------------------------------------------------------
// Body serialization

function serializeUrlEncoded(params: KeyValueParam[]): string {
  return params
    .filter((p) => p.enabled && p.key.trim())
    .map((p) => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value)}`)
    .join('&');
}

function parseUrlEncoded(text: string): KeyValueParam[] {
  return text
    .split('&')
    .filter(Boolean)
    .map((part) => {
      const eq = part.indexOf('=');
      return { id: createId(), key: decodeSafe(eq === -1 ? part : part.slice(0, eq)), value: eq === -1 ? '' : decodeSafe(part.slice(eq + 1)), enabled: true };
    });
}

// ---------------------------------------------------------------------------
// BuilderState → HttpRequest

export function builderStateToRequest(state: RequestBuilderState): HttpRequest {
  const method = state.method.trim().toUpperCase() || 'GET';

  const fullUrl = buildFullUrl(
    state.url,
    state.queryParams,
    state.authType === 'apiKey' && state.apiKeyPlacement === 'query'
      ? { name: state.apiKeyName, value: state.apiKeyValue, placement: 'query', enabled: true }
      : undefined,
  );

  const headers: [string, string][] = [];

  // User-defined headers
  for (const h of state.headers) {
    if (h.enabled && h.key.trim()) {
      headers.push([h.key.trim(), h.value]);
    }
  }

  // Auth headers
  let basicAuth: HttpRequest['basicAuth'];

  if (state.authType === 'bearer' && state.bearerToken.trim()) {
    // Avoid duplicate Authorization header if user manually added one
    if (!headers.some(([k]) => k.toLowerCase() === 'authorization')) {
      headers.push(['Authorization', `Bearer ${state.bearerToken.trim()}`]);
    }
  } else if (state.authType === 'basic' && (state.basicUser || state.basicPassword)) {
    basicAuth = {
      user: state.basicUser,
      password: state.basicPassword,
    };
  } else if (
    state.authType === 'apiKey' &&
    state.apiKeyPlacement === 'header' &&
    state.apiKeyName.trim() &&
    state.apiKeyValue.trim()
  ) {
    headers.push([state.apiKeyName.trim(), state.apiKeyValue.trim()]);
  }

  // Body
  let body: RequestBody | undefined;

  if (['GET', 'HEAD'].includes(method) && state.bodyType === 'none') {
    // No body
  } else if (state.bodyType === 'json') {
    body = { kind: 'text', text: state.jsonBody };
    if (!headers.some(([k]) => k.toLowerCase() === 'content-type')) {
      headers.push(['Content-Type', 'application/json']);
    }
  } else if (state.bodyType === 'text') {
    body = { kind: 'text', text: state.textBody };
    if (!headers.some(([k]) => k.toLowerCase() === 'content-type')) {
      headers.push(['Content-Type', 'text/plain']);
    }
  } else if (state.bodyType === 'form') {
    const encoded = serializeUrlEncoded(state.formBody);
    body = { kind: 'text', text: encoded };
    if (!headers.some(([k]) => k.toLowerCase() === 'content-type')) {
      headers.push(['Content-Type', 'application/x-www-form-urlencoded']);
    }
  } else if (state.bodyType === 'multipart') {
    const parts: FormPart[] = [];
    for (const p of state.multipartBody) {
      if (!p.enabled || !p.name.trim()) continue;
      if (p.type === 'file') {
        parts.push({
          name: p.name.trim(),
          file: p.value.trim() || 'file.bin',
          type: p.contentType?.trim() || undefined,
        });
      } else {
        parts.push({
          name: p.name.trim(),
          value: p.value,
        });
      }
    }
    body = { kind: 'multipart', parts };
  }

  return {
    method,
    url: fullUrl || 'https://api.example.com',
    headers,
    body,
    basicAuth,
    followRedirects: state.followRedirects,
    insecure: state.insecure,
    compressed: state.compressed,
  };
}

// ---------------------------------------------------------------------------
// HttpRequest → BuilderState (Import / Two-Way Sync)

export function requestToBuilderState(req: HttpRequest): RequestBuilderState {
  const { baseUrl, queryParams } = parseUrlToQuery(req.url);

  let authType: AuthType = 'none';
  let bearerToken = '';
  let basicUser = '';
  let basicPassword = '';
  let apiKeyName = 'X-API-Key';
  let apiKeyValue = '';
  let apiKeyPlacement: 'header' | 'query' = 'header';

  const headers: KeyValueParam[] = [];

  // Check basicAuth field
  if (req.basicAuth) {
    authType = 'basic';
    basicUser = req.basicAuth.user;
    basicPassword = req.basicAuth.password;
  }

  for (const [k, v] of req.headers) {
    const lower = k.toLowerCase();
    if (lower === 'authorization') {
      if (v.startsWith('Bearer ')) {
        authType = 'bearer';
        bearerToken = v.slice(7).trim();
        continue;
      } else if (v.startsWith('Basic ')) {
        const bytes = tryBase64ToBytes(v.slice(6).trim());
        const decoded = bytes ? new TextDecoder().decode(bytes) : '';
        const colon = decoded.indexOf(':');
        // Only take it apart if it really is user:password; otherwise keep the header as written.
        if (colon !== -1) {
          authType = 'basic';
          basicUser = decoded.slice(0, colon);
          basicPassword = decoded.slice(colon + 1);
          continue;
        }
      }
    } else if (lower === 'x-api-key' || lower === 'apikey') {
      authType = 'apiKey';
      apiKeyName = k;
      apiKeyValue = v;
      apiKeyPlacement = 'header';
      continue;
    }

    headers.push({
      id: createId(),
      key: k,
      value: v,
      enabled: true,
    });
  }

  // Detect body type
  let bodyType: BodyType = 'none';
  let jsonBody = '{\n  "key": "value"\n}';
  let textBody = '';
  const formBody: KeyValueParam[] = [];
  const multipartBody: MultipartPart[] = [];

  const cType = getHeader(req.headers, 'content-type')?.toLowerCase() || '';

  if (req.body?.kind === 'multipart') {
    bodyType = 'multipart';
    for (const p of req.body.parts) {
      multipartBody.push({
        id: createId(),
        name: p.name,
        type: p.file !== undefined ? 'file' : 'text',
        value: p.file !== undefined ? p.file : p.value ?? '',
        contentType: p.type,
        enabled: true,
      });
    }
  } else if (req.body?.kind === 'text') {
    const rawText = req.body.text;
    // Without a Content-Type, a body that parses as JSON is treated as JSON. The text is kept as is,
    // so converting back to cURL sends the same bytes.
    if (cType.includes('json') || (!cType && isJsonValid(rawText))) {
      bodyType = 'json';
      jsonBody = rawText;
    } else if (cType.includes('application/x-www-form-urlencoded') && serializeUrlEncoded(parseUrlEncoded(rawText)) === rawText) {
      // Only when re-encoding gives the same bytes: curl labels any --data as form-encoded, even JSON.
      bodyType = 'form';
      formBody.push(...parseUrlEncoded(rawText));
    } else {
      bodyType = 'text';
      textBody = rawText;
    }
  }

  return {
    method: req.method || 'GET',
    url: baseUrl,
    queryParams,
    headers,
    authType,
    bearerToken,
    basicUser,
    basicPassword,
    apiKeyName,
    apiKeyValue,
    apiKeyPlacement,
    bodyType,
    jsonBody,
    textBody,
    formBody,
    multipartBody,
    followRedirects: req.followRedirects ?? false,
    insecure: req.insecure ?? false,
    compressed: req.compressed ?? false,
  };
}

export function isJsonValid(str: string): boolean {
  if (!str.trim()) return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}
