import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick an **Algorithm**: HMAC (HS), RSA (RS and PS), ECDSA (ES) or, if your browser supports it, EdDSA.',
    'Edit the **Header** and **Payload** JSON, or use the **Claim helpers** (**iat = now**, **nbf = now**, **Random jti**, **Set exp**, **Set iss / aud**) to add standard claims.',
    'For HS algorithms, keep the random **Secret**, type your own, or turn on **Secret is Base64**. For the others, paste a private key or click **Generate … key pair**.',
    'The **Signed token** updates as you edit. Copy it with **Copy token**, or check it with **Open in JWT Decoder**.',
  ],
  howItWorks:
    'The header and payload are parsed as JSON objects, serialised compactly, and Base64URL-encoded; the header’s `alg` is always set to the selected algorithm. The text `header.payload` is then signed with the browser’s Web Crypto API (`crypto.subtle.sign`) and the signature is appended as the third Base64URL segment (RFC 7515).\n\n' +
    'HS256/384/512 use HMAC with SHA-256/384/512. RS algorithms use RSASSA-PKCS1-v1_5, PS algorithms RSA-PSS with a salt as long as the hash, ES256/384/512 ECDSA on P-256, P-384 and P-521, and EdDSA uses Ed25519. Private keys are accepted as PKCS#8 PEM (`BEGIN PRIVATE KEY`) or as a JWK with its private `d` part.\n\n' +
    'Generated key pairs come from `crypto.subtle.generateKey`: RSA 2048-bit with exponent 65537 for RS and PS, the matching curve for ES, or Ed25519. You get the public and private keys as PEM and JWK. The default and **Random secret** values are made from `crypto.getRandomValues`.',
  limits: [
    'Only signed tokens (JWS) are produced; encrypted tokens (JWE) and unsigned `"alg": "none"` tokens are not.',
    'PKCS#1 (`BEGIN RSA PRIVATE KEY`), SEC1 (`BEGIN EC PRIVATE KEY`) and encrypted PEM keys are rejected; convert them to unencrypted PKCS#8 first (the error message shows an `openssl` command).',
    'A JWK must have the key type for the algorithm (`RSA`, `EC`, `OKP`) and, if it has an `alg`, the same one as selected.',
    'HMAC secrets shorter than the hash size (32, 48 or 64 bytes) are still used, with a warning citing RFC 7518.',
    'The JSON is re-serialised before signing, so formatting is dropped, duplicate keys collapse to the last one, and integers beyond JavaScript’s safe range lose precision.',
  ],
  privacy:
    'Signing and key generation happen in your browser. Secrets, private keys and tokens are never uploaded or stored, and this tool doesn’t create share links. **Open in JWT Decoder** and **Send to…** pass the token to the other tool through this tab’s session storage, where it is removed as soon as that tool reads it.',
  faqs: [
    {
      question: 'Can I use the generated keys in production?',
      answer:
        'Treat them as test keys. They are generated securely in your browser, but they have been shown on screen and in your clipboard. Generate production keys with your own key management tools.',
    },
    {
      question: 'How do I verify a token made here?',
      answer:
        'For HS algorithms, use the same secret. For RS, PS, ES and EdDSA, use the public key shown after **Generate … key pair**, or the public half of your own key. **Open in JWT Decoder** lets you check it straight away.',
    },
    {
      question: 'Why was the `alg` in my header changed?',
      answer: 'The header’s `alg` always follows the selected **Algorithm**, so the token can be verified. A warning tells you when a different value was replaced.',
    },
    {
      question: 'Why is EdDSA missing from the list?',
      answer: 'It only appears when your browser’s Web Crypto API supports Ed25519. Older browsers don’t.',
    },
    {
      question: 'My key starts with “BEGIN RSA PRIVATE KEY”. What do I do?',
      answer: 'That is a PKCS#1 key. Convert it to PKCS#8 with `openssl pkcs8 -topk8 -nocrypt -in key.pem` and paste the result.',
    },
  ],
};

export default docs;
