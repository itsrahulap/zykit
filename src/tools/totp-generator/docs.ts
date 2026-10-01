import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Paste a Base32 secret or a whole `otpauth://` URI into **Secret (Base32) or otpauth:// URI**, or click **New secret** or **Try an example**. A URI fills in every option for you.',
    'Check the **Type** (**TOTP (time)** or **HOTP (counter)**), **Algorithm**, **Digits** and **Period** (or **Counter** for HOTP) match the service you are testing.',
    'Read the **Current code** with the seconds left, plus the codes for the previous and next step. For HOTP, step through with **Next counter** and **Previous**.',
    'To test a code, type it into **Code to check** and choose an **Accept window**. The result says whether it matches and how many steps ahead or behind it is.',
    'Fill in **Issuer** and **Account** to build an otpauth:// URI that authenticator apps can import, and copy it with the copy button next to **URI for authenticator apps**.',
  ],
  howItWorks:
    'The secret is decoded from Base32 (RFC 4648); spaces, hyphens, lowercase letters and trailing `=` padding are accepted. HOTP (RFC 4226) computes an HMAC of an 8-byte big-endian counter with the browser’s Web Crypto API (`crypto.subtle.sign`), using SHA-1, SHA-256 or SHA-512, then applies dynamic truncation and keeps the last 6, 7 or 8 decimal digits.\n\n' +
    'TOTP (RFC 6238) is HOTP with the counter set to the number of whole periods since the Unix epoch, taken from this device’s clock and refreshed four times a second. Verification tries the current step first, then each step outward up to the accept window, so the closest match is reported.\n\n' +
    'An otpauth:// URI is read in the Key Uri Format: the label gives issuer and account, and `secret`, `issuer`, `algorithm`, `digits`, `period` and `counter` set the options, defaulting to SHA-1, 6 digits and 30 seconds. **New secret** makes a 160-bit secret with `crypto.getRandomValues`, the length RFC 4226 recommends.',
  limits: [
    'Codes depend on this device’s clock; if it is wrong, TOTP codes will be too.',
    'The page offers 6 or 8 digits and a 30 or 60 second period. A URI can also set 7 digits or any whole period from 1 to 3,600 seconds.',
    'Only Base32 secrets are accepted; hex or raw-text secrets must be converted first.',
    'No QR code is made or read. Copy the otpauth:// URI instead.',
    'Many authenticator apps ignore `algorithm`, `digits` and `period` and always use SHA-1, 6 digits and 30 seconds; a warning appears when a URI asks for SHA-256 or SHA-512.',
  ],
  privacy:
    'Secrets and codes are processed only in this tab and are never uploaded, saved or put in the URL; reloading the page forgets them. This tool has no share links and no **Send to…**. Only use real account secrets on a device you trust.',
  faqs: [
    {
      question: 'Why don’t my codes match my authenticator app?',
      answer:
        'Check, in order: the device clocks, the period, the number of digits and the algorithm. Set **Accept window** to a few steps and paste the app’s code into **Code to check**; a match a step or two away means the clocks differ.',
    },
    {
      question: 'What is the difference between TOTP and HOTP?',
      answer: 'TOTP codes change with time, every period. HOTP codes change when the counter goes up, usually each time a code is used. Both use the same HMAC calculation.',
    },
    {
      question: 'How large should the accept window be on my server?',
      answer: 'Servers usually accept ±1 step, which allows for clock drift and typing time. A larger window accepts more codes and makes guessing easier.',
    },
    {
      question: 'Why does the example secret give different codes from the RFC 6238 SHA-256 vectors?',
      answer:
        'The example is the 20-byte RFC test key, which RFC 6238 uses for SHA-1. Its SHA-256 and SHA-512 vectors use longer 32- and 64-byte keys.',
    },
  ],
};

export default docs;
