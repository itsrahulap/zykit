import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose an **Input source**: **Text** to type or paste, or **File** to pick or drop any file.',
    'Read the MD5, SHA-1, SHA-256, SHA-384 and SHA-512 values under **Hash results**. They update shortly after you stop typing.',
    'Switch the **Output format** between lowercase `hex`, uppercase `HEX` and `Base64`.',
    'For a keyed hash, turn on **HMAC mode (keyed hash)** and enter the **HMAC key**.',
    'Use the copy button next to a value to copy just that one.',
  ],
  howItWorks:
    'Text is encoded as UTF-8 and hashed as those bytes; a file is read into memory and hashed exactly as stored. SHA-1, SHA-256, SHA-384 and SHA-512 come from the browser’s Web Crypto API (`crypto.subtle.digest`). Web Crypto has no MD5, so MD5 is computed with a small built-in JavaScript implementation.\n\n' +
    'In HMAC mode, the key is encoded as UTF-8 and imported as a raw HMAC key, and the HMACs are computed with `crypto.subtle.sign` for SHA-1, SHA-256, SHA-384 and SHA-512 (RFC 2104). All algorithms run together on each change, so you always see every result for the same input.',
  limits: [
    'Files up to 200 MB; the whole file is held in memory while hashing. Text files dropped on the text box are limited to 10 MB.',
    'HMAC-MD5 is not supported, because Web Crypto doesn’t offer it.',
    'The HMAC key is always taken as UTF-8 text; hex or Base64 keys are not decoded first. An empty key isn’t accepted.',
    'Text in the box uses `\\n` line endings, so text copied from a Windows file may hash differently from the file itself. Use **File** to hash exact bytes.',
    'MD5 and SHA-1 are broken for security purposes: fine for checksums and compatibility, not for signatures or passwords.',
  ],
  privacy:
    'Text, files and HMAC keys are processed only in your browser and never uploaded or stored. Text received through **Send to…** from another tool is passed via this tab’s session storage and removed as soon as this tool reads it.',
  faqs: [
    {
      question: 'Why doesn’t my hash match the one from the command line?',
      answer:
        'Usually the input differs by invisible bytes: a trailing newline (`echo` adds one unless you use `echo -n`), Windows line endings, or a different text encoding. Hash the file itself with **File** to compare exact bytes.',
    },
    {
      question: 'Can I use this to hash passwords for storage?',
      answer:
        'No. Plain MD5 and SHA hashes are far too fast for password storage. Use a dedicated password hashing scheme such as Argon2, scrypt or bcrypt on your server.',
    },
    {
      question: 'What is the difference between a hash and an HMAC?',
      answer:
        'A hash depends only on the data, so anyone can compute it. An HMAC also mixes in a secret key, so only someone with the key can produce or check it. It is used to sign webhooks and API requests.',
    },
    {
      question: 'Why is there no HMAC-MD5?',
      answer: 'The browser’s Web Crypto API, which computes the HMACs here, doesn’t support MD5.',
    },
  ],
};

export default docs;
