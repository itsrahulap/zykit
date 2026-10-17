import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'In **Check records**, paste one or more TXT values, or a zone-file or `dig` snippet such as `_dmarc.example.com. IN TXT "v=DMARC1; p=none"`. Quoted pieces of a split record are joined for you.',
    'Each recognised record (SPF, DKIM, DMARC, MTA-STS, TLS-RPT, BIMI) gets a plain-English explanation of every tag or term, plus any errors, warnings and notes.',
    'To write a new record, use **Build DMARC** or **Build SPF**, set the options, and copy the result or the ready-made zone line.',
    'Publish the record as a TXT record at the name shown (for DMARC, `_dmarc.yourdomain.com`), then re-check the live value after it propagates.',
  ],
  howItWorks:
    'The text is split into records. Each one is classified by its version tag (`v=spf1`, `v=DKIM1`, `v=DMARC1`, `v=STSv1`, `v=TLSRPTv1`, `v=BIMI1`) or its owner name (`._domainkey.`, `_dmarc.`).\n\n' +
    'SPF terms are parsed into qualifiers, mechanisms and modifiers. The 10 DNS-lookup limit (RFC 7208) is counted statically from `include`, `a`, `mx`, `ptr`, `exists` and `redirect`.\n\n' +
    'DKIM `p=` is base64-decoded and its ASN.1 (DER) structure read to find the RSA modulus size or Ed25519 key; an empty `p=` is reported as a revoked key. DMARC tags are validated against RFC 7489 and report URIs are checked. Nothing is looked up in DNS.',
  limits: [
    'DNS is never queried. SPF `include` and `redirect` records are not followed, so the lookup count is a minimum, and DMARC external report authorisation records can\'t be verified.',
    'It can\'t check offline whether a DKIM key matches the signing server, or whether the MTA-STS policy file and BIMI logo/VMC are valid.',
    'Only the first 200,000 characters of input are read.',
    'DMARCbis tags (`np`, `psd`, `t`) are recognised but only lightly validated.',
    'Zone-file parsing handles single-line and parenthesised multi-line TXT records; other record types are ignored.',
  ],
  privacy:
    'Everything is parsed in your browser. No DNS lookups are made, and your text is not uploaded or stored. "Copy share link" puts the pasted text and builder options in the link\'s fragment, which is not sent to any server. Don\'t share the link if the records are sensitive.',
  faqs: [
    {
      question: 'Why does SPF fail with more than 10 DNS lookups?',
      answer:
        'RFC 7208 limits SPF evaluation to 10 lookups (include, a, mx, ptr, exists, redirect) to stop abusive records. Past that, receivers return a permanent error and SPF fails. To stay under it, replace includes with `ip4`/`ip6` ranges or flatten your providers.',
    },
    {
      question: 'Is p=none for DMARC bad?',
      answer: 'It is a good first step: it collects reports but doesn\'t stop spoofed mail. Review the reports, fix legitimate senders, then move to `quarantine` and `reject`.',
    },
    {
      question: 'What does an empty DKIM p= mean?',
      answer: 'It revokes the key: the selector remains published, but any message signed with it fails DKIM. Use it when retiring a selector.',
    },
    {
      question: 'Why can I have only one SPF record?',
      answer: 'If a domain publishes more than one `v=spf1` TXT record, receivers return a permanent error. Merge them into one record, with one `include` per provider.',
    },
  ],
};

export default docs;
