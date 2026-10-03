import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'In **Check records**, paste one or more TXT values, or a zone-file or `dig` snippet such as `_dmarc.example.com. IN TXT "v=DMARC1; p=none"`. Quoted pieces of a split record are joined for you.',
    'Each recognised record (SPF, DKIM, DMARC, MTA-STS, TLS-RPT, BIMI) gets a plain-English explanation of every tag or term, plus errors, warnings and notes.',
    'To write a record from scratch, use **Build DMARC** or **Build SPF**, set the options, and copy the result or the ready-made zone line.',
    'Publish the record as a TXT record at the name shown (for DMARC, `_dmarc.yourdomain.com`), then re-check the live value after it propagates.',
  ],
  howItWorks:
    'The text is split into records and each one is classified by its version tag (`v=spf1`, `v=DKIM1`, `v=DMARC1`, `v=STSv1`, `v=TLSRPTv1`, `v=BIMI1`) or its owner name (`._domainkey.`, `_dmarc.`). SPF terms are parsed into qualifiers, mechanisms and modifiers; the DNS-lookup limit of 10 (RFC 7208) is counted statically from `include`, `a`, `mx`, `ptr`, `exists` and `redirect`. DKIM `p=` is base64-decoded and its ASN.1 (DER) structure read to find the RSA modulus size or Ed25519 key; an empty `p=` is reported as a revoked key. DMARC tags are validated against RFC 7489 and report URIs checked. Nothing is looked up in DNS.',
  limits: [
    'DNS is never queried. SPF `include` and `redirect` records are not followed, so the lookup count is a minimum, and DMARC external report authorisation records can\'t be verified.',
    'Whether a DKIM key actually matches the signing server, or the MTA-STS policy file and BIMI logo/VMC are valid, can\'t be checked offline.',
    'Only the first 200,000 characters of input are read.',
    'DMARCbis tags (`np`, `psd`, `t`) are recognised but only lightly validated.',
    'Zone-file parsing handles single-line and parenthesised multi-line TXT records; other record types are ignored.',
  ],
  privacy:
    'Everything is parsed in your browser. No DNS lookups are made and the text you paste is not uploaded or stored. "Copy share link" puts the pasted text and builder options in the link\'s fragment, which is not sent to any server; do not share it if the records are sensitive.',
  faqs: [
    {
      question: 'Why does SPF fail with more than 10 DNS lookups?',
      answer:
        'RFC 7208 limits SPF evaluation to 10 lookups (include, a, mx, ptr, exists, redirect) to stop abusive records. Past that, receivers return a permanent error and SPF fails. Replace includes with `ip4`/`ip6` ranges or flatten your providers to stay under it.',
    },
    {
      question: 'Is p=none for DMARC bad?',
      answer: 'It is a good first step because it only collects reports, but it does not stop spoofed mail. Review the reports, fix legitimate senders, then move to `quarantine` and `reject`.',
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
