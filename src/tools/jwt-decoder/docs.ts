import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste a JWT into the token box. A leading `Bearer ` and line breaks are removed automatically.',
    'Read the decoded header and payload, and the registered claims (`iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti`) explained with dates and relative times.',
    'Check the status badge: it says whether the token is expired or not yet valid, based on `exp` and `nbf` and your device clock.',
    'To verify the signature, enter the shared secret (HS algorithms) or paste the public key as PEM or JWK (RS, PS and ES algorithms).',
    'Use **Load example** to try it with a sample HS256 token and its secret.',
  ],
  howItWorks:
    'A JWT is three base64url segments separated by dots: header, payload and signature. The decoder base64url-decodes the first two, reads them as strict UTF-8 and parses them as JSON objects. The signature is decoded but not interpreted.\n\n' +
    'Verification uses the browser’s Web Crypto API (`crypto.subtle.verify`) over the exact `header.payload` text, with the algorithm named in the header’s `alg`: HMAC for HS256/384/512, RSASSA-PKCS1-v1_5 for RS256/384/512, RSA-PSS for PS256/384/512 and ECDSA (P-256, P-384, P-521) for ES256/384/512. Public keys are imported as SPKI PEM (`BEGIN PUBLIC KEY`), a JWK or a JWK Set, where the key matching the token’s `kid` is picked.',
  limits: [
    'Encrypted tokens (JWE, five segments) can’t be decoded; only signed tokens (JWS, three segments) are supported.',
    'Tokens signed with EdDSA or other algorithms outside HS, RS, PS and ES 256/384/512 can be decoded but not verified. Unsigned tokens (`"alg": "none"`) have nothing to verify and are flagged.',
    'PKCS#1 RSA keys (`BEGIN RSA PUBLIC KEY`), certificates and private PEM keys aren’t accepted for verification; use the SPKI public key. A private JWK works, because only its public fields are used.',
    'Critical header extensions (`crit`) are reported but not processed, and claims such as `iss` and `aud` are explained, not validated against expected values.',
    'Expiry is checked against your device clock, with no clock-skew allowance.',
  ],
  privacy:
    'Decoding and verification run entirely in your browser with built-in APIs. The token, secrets and keys are never uploaded or stored, and this tool doesn’t offer share links, so a token never ends up in a URL. If you use **Send to…** to open the token in another tool, it is handed over through this tab’s session storage and removed as soon as that tool reads it.',
  faqs: [
    {
      question: 'Is it safe to paste a production token here?',
      answer:
        'The token is processed only in your browser and never sent anywhere. Still, a valid token is a credential: anyone who has it can use it until it expires, so treat it like a password wherever you paste it.',
    },
    {
      question: 'Does decoding a JWT prove it is genuine?',
      answer:
        'No. Anyone can create a token with any header and payload. Only a successful signature check with the issuer’s secret or public key shows the token was issued by them and not changed.',
    },
    {
      question: 'Why does verification fail with my RSA key?',
      answer:
        'Check that the key matches the token’s `alg` and is the SPKI public key (`BEGIN PUBLIC KEY`). A PKCS#1 key (`BEGIN RSA PUBLIC KEY`) can be converted with `openssl rsa -RSAPublicKey_in -pubout`. Certificates aren’t accepted.',
    },
    {
      question: 'My secret is Base64. How do I use it?',
      answer: 'Turn on **Secret is Base64**. Standard and URL-safe Base64 are both accepted, with or without padding.',
    },
    {
      question: 'Why is the token shown as expired when the server accepts it?',
      answer:
        'Expiry is compared with your device clock without any leeway. If your clock is ahead, or the server allows clock skew, the two can disagree for tokens near their `exp` time.',
    },
    {
      question: 'Can it decode encrypted (JWE) tokens?',
      answer: 'No. A JWE’s payload is encrypted, so it can’t be read without the decryption key. The tool recognises five-segment tokens and tells you so.',
    },
  ],
};

export default docs;
