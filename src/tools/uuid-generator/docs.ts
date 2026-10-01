import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Choose a **Version**: **v4 · random** or **v7 · time-ordered**. Switching version makes a new batch.',
    'Enter **How many** (1 to 1,000), then click **Generate** or press Enter.',
    'Format the list with **Uppercase**, **Hyphens** and **Braces**. This changes how the same UUIDs are shown; it doesn’t make new ones.',
    'Use **Copy all**, **Download .txt** or **Send to…** to take the list (one UUID per line) elsewhere.',
    'To check an existing UUID, paste it under **Inspect a UUID** to see its version, variant and, for v1, v6 and v7, when it was created.',
  ],
  howItWorks:
    'Version 4 UUIDs are 122 random bits with the version and variant bits set as in RFC 9562. They come from the browser’s `crypto.randomUUID()` where available, or from `crypto.getRandomValues` otherwise.\n\n' +
    'Version 7 UUIDs start with the current Unix time in milliseconds (48 bits), so they sort in creation order. The next 12 bits are a counter, seeded randomly each millisecond and incremented for every UUID made in the same millisecond, so a batch is strictly increasing (RFC 9562 section 6.2, method 1). If the counter runs out, or the clock goes backwards, the timestamp is moved forward by one millisecond instead. The remaining 62 bits are random from `crypto.getRandomValues`.\n\n' +
    'The inspector reads the version from the 13th hex digit and the variant from the 17th. For v7 it decodes the millisecond timestamp; for v1 and v6 it converts the 60-bit count of 100-nanosecond intervals since 15 October 1582 to a date. The nil UUID (all zeros) and max UUID (all `f`) are recognised by name.',
  limits: [
    'Only versions 4 and 7 can be generated; v1, v3, v5, v6 and v8 can be inspected but not created.',
    'Up to 1,000 UUIDs per batch. Values outside 1 to 1,000 are clamped, with a note.',
    'The inspector accepts 32 hex digits with or without hyphens, optionally wrapped in braces or prefixed with `urn:uuid:`. Hyphens must be in the standard 8-4-4-4-12 positions.',
    'Creation times are only shown for v1, v6 and v7, and are only as accurate as the clock of the machine that made the UUID.',
  ],
  privacy:
    'UUIDs are generated and inspected in your browser; nothing is uploaded or stored, and this tool doesn’t create share links. **Send to…** passes the list to the other tool through this tab’s session storage, where it is removed as soon as that tool reads it.',
  faqs: [
    {
      question: 'Should I use v4 or v7?',
      answer:
        'Use v7 for database keys and anything you sort or index, because new values are close together and in order. Use v4 when the ID shouldn’t reveal when it was created.',
    },
    {
      question: 'Does a v7 UUID reveal when it was made?',
      answer: 'Yes. Its first 48 bits are the creation time in milliseconds, which the inspector shows as a date. Anyone with the UUID can read it.',
    },
    {
      question: 'Can two generated UUIDs collide?',
      answer:
        'In practice, no. v4 has 122 random bits, and v7 has 62 random bits plus a randomly seeded counter within each millisecond, so a collision is astronomically unlikely.',
    },
    {
      question: 'Is a GUID the same as a UUID?',
      answer: 'Yes, GUID is Microsoft’s name for the same 128-bit format. Turn on **Uppercase** and **Braces** to get the `{XXXXXXXX-…}` style many Windows tools use.',
    },
  ],
};

export default docs;
