import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste one or more PEM blocks into **PEM input**, such as a certificate, a whole chain, a CSR or a public key. Or click **Open file** (or drop a file) for a `.pem`, `.crt`, `.cer`, `.der`, `.csr`, `.key` or `.pub` file.',
    'Try it with **Load sample chain**, a test leaf, intermediate and root.',
    'Read each block’s card: for a certificate, the subject, issuer, validity, public key, signature algorithm, serial, extensions and SHA-256 / SHA-1 fingerprints.',
    'If you pasted several certificates, check the **Chain** panel for their leaf-to-root order, missing issuers and signature checks.',
    'Click **Copy** next to a fingerprint to copy it, or **Clear** to start again.',
  ],
  howItWorks:
    'The text is scanned for `-----BEGIN …-----` / `-----END …-----` blocks; each body is Base64-decoded to DER and read by a strict DER parser that rejects indefinite lengths, non-minimal encodings, truncated data and trailing bytes. The PEM label decides how a block is decoded. A file that starts with a DER `SEQUENCE` byte, or text that is bare Base64 without PEM lines, is decoded by recognising its structure.\n\n' +
    'Certificates are read as X.509: version, serial, issuer and subject names, validity, public key (RSA size and exponent, EC curve, Ed25519, Ed448, X25519, X448, DSA size) and signature algorithm, including RSA-PSS parameters. Decoded extensions include subject and issuer alternative names, key usage, extended key usage, basic constraints, subject and authority key identifiers, CRL distribution points, authority and subject information access, certificate policies, SCT counts, the precertificate flag and OCSP Must-Staple; others are listed by name. Fingerprints are SHA-256 and SHA-1 of the DER, from the Web Crypto API.\n\n' +
    'With several certificates, each one’s issuer name is matched against the others’ subject names, and key identifiers when both are present, to order the chain from leaf to root. Each signature is then checked with Web Crypto against the next certificate’s public key (or its own, for a self-signed root) for RSA PKCS#1 v1.5, ECDSA on P-256, P-384 and P-521, and Ed25519.\n\n' +
    'For private keys, only the format, key type and size are read; the key material is never shown.',
  limits: [
    'Files up to 5 MB, and up to 50 PEM blocks per input.',
    'The chain check doesn’t test trust in a root, revocation (CRL or OCSP) or hostnames, so a verified chain isn’t proof a browser would accept it.',
    'Signatures using RSA-PSS, DSA, Ed448 or curves other than P-256, P-384 and P-521 are shown as not checked. CSR signatures aren’t checked.',
    'Validity is measured against this device’s clock at the moment the page was opened.',
    'Encrypted private keys (`ENCRYPTED PRIVATE KEY`, or PEM with a `Proc-Type` header) and OpenSSH private keys are only identified, not decoded. PKCS#7 / PKCS#12 bundles and other PEM labels aren’t supported.',
  ],
  privacy:
    'Certificates, CSRs and keys are decoded only in your browser and never uploaded or stored; this tool has no share links. Private keys are recognised so you get a warning, but their contents aren’t shown. Even so, don’t paste real private keys into websites.',
  faqs: [
    {
      question: 'How do I get a website’s certificate chain to paste here?',
      answer: 'Run `openssl s_client -connect example.com:443 -showcerts </dev/null` and paste everything it prints. The tool picks out the certificate blocks.',
    },
    {
      question: 'Why does it say my chain is not in order?',
      answer:
        'The certificates weren’t pasted leaf first, then each issuer. Servers should send them in that order; the **Chain** panel shows the order it found.',
    },
    {
      question: 'What does “Issuer not included” mean?',
      answer:
        'No pasted certificate has a subject matching that certificate’s issuer. If the missing issuer is a root CA, that is normal: servers usually don’t send the root, because clients have roots built in. If it is an intermediate, add it.',
    },
    {
      question: 'Can I open a binary .der or .cer file?',
      answer: 'Yes. Use **Open file** or drop it on the input. Binary DER is detected automatically, and PEM files work the same way.',
    },
    {
      question: 'Which fingerprint should I compare?',
      answer: 'Prefer the SHA-256 fingerprint. SHA-1 is shown for older tools that still list it, but SHA-1 is no longer collision-resistant.',
    },
  ],
};

export default docs;
