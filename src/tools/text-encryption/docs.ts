import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose **Encrypt** or **Decrypt**, and **Text** or **File**.',
    'Type a **Passphrase**. When encrypting, the strength hint estimates how hard it is to guess; aim for four or more random words.',
    'Paste the text (or the `zykit:v1:…` string), or **Choose file** (a `.zyk` file to decrypt), then press **Encrypt** or **Decrypt**.',
    'Copy the result, or download the `.zyk` or decrypted file. Send the passphrase to the recipient through a different channel.',
  ],
  howItWorks:
    'Your passphrase is stretched with PBKDF2-SHA-256 (600,000 iterations by default, up to 2,000,000) and a random 16-byte salt. HKDF-SHA-256 then splits the result into a 256-bit AES key and a separate 8-byte check value. The data is encrypted with AES-256-GCM using a random 12-byte IV; the header (iterations, salt, IV, check value) is authenticated as GCM additional data, so it can’t be edited unnoticed. Everything runs with your browser’s Web Crypto API.\n\n' +
    'Text output is `zykit:v1:` followed by Base64URL of the header and ciphertext. Files are saved as `name.zyk`, which holds the same envelope plus the original file name. On decryption, the check value tells a wrong passphrase apart from data that was modified, and the GCM tag catches any change to the ciphertext.',
  limits: [
    'Files up to 100 MB. The whole file is held in memory while it is encrypted or decrypted.',
    'Not OpenSSL-compatible: `openssl enc` can’t read the `zykit:v1` format, and OpenSSL `Salted__` output can’t be decrypted here.',
    'A forgotten passphrase can’t be recovered. There is no back door.',
    'The strength hint is an estimate from length and character types, not a guarantee.',
    'Decryption accepts iteration counts from 100,000 to 10,000,000; anything else is treated as corrupted.',
  ],
  privacy:
    'Encryption and decryption happen in your browser. The passphrase, text and files are never uploaded or stored, and this tool doesn’t create share links. Reloading or closing the tab forgets everything.',
  faqs: [
    {
      question: 'How secure is this?',
      answer:
        'AES-256-GCM is a strong, standard cipher, so security comes down to your passphrase. Anyone with the encrypted text can try passphrases offline; PBKDF2 slows each guess, but a short or common passphrase will still fall. Use a long, random one.',
    },
    {
      question: 'Can I decrypt this with OpenSSL or another tool?',
      answer:
        'No. The format is specific to this tool (versioned as `zykit:v1`). The parameters are standard (PBKDF2-SHA-256, HKDF-SHA-256, AES-256-GCM), so it can be reimplemented, but there is no ready-made command-line equivalent.',
    },
    {
      question: 'How does it know whether the passphrase is wrong or the data is damaged?',
      answer:
        'A small check value derived from the passphrase is stored next to the ciphertext. If it doesn’t match, the passphrase is wrong. If it matches but the AES-GCM tag fails, the data was modified or truncated.',
    },
    {
      question: 'Why does the same text encrypt differently every time?',
      answer: 'A new random salt and IV are used for every encryption, so identical inputs never produce identical output. That is intended.',
    },
    {
      question: 'Is anything saved?',
      answer: 'No. Nothing is written to storage or sent anywhere, so keep the output and the passphrase yourself.',
    },
  ],
};

export default docs;
