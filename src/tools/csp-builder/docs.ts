import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Start from a **preset** (Strict nonce, Single-page app, Static site), **paste** an existing policy (header, meta tag, or an nginx/Apache line) and press **Load into builder**, or **Add a directive** yourself.',
    'For each directive, add **source chips**: keywords like `\'self\'` and `\'none\'`, schemes like `https:` and `data:`, hosts, nonces and hashes. Invalid sources are explained before they are added.',
    'Read the **Evaluation**: a grade plus findings by severity (High, Medium, Low, Syntax, Info), each with a suggested fix.',
    'Pick an **output** format (header, meta tag, nginx, Apache, Vercel or Netlify), optionally as Report-Only, and copy it. Use the **hash generator** for inline scripts and styles.',
  ],
  howItWorks:
    'The policy is held as an ordered list of directives. Pasted text is parsed with the same CSP parser used by the HTTP Headers tool (duplicates are dropped, as browsers use only the first). The evaluator follows Content-Security-Policy fallback rules (for example `script-src` to `default-src`, `worker-src` to `child-src` to `script-src`) and flags the problems Google\'s CSP Evaluator looks for: `\'unsafe-inline\'` without a nonce or hash, `\'unsafe-eval\'`, wildcards and broad schemes in `script-src`, plain-HTTP sources, missing `object-src`, `base-uri`, `frame-ancestors` and `form-action`, `\'strict-dynamic\'` without a nonce, short nonces, and a built-in list of hosts known to serve JSONP, AngularJS or user content that can bypass an allowlist. Hashes are computed with the Web Crypto API (SHA-256, SHA-384 or SHA-512) over the exact text you provide, and nonces come from `crypto.getRandomValues`.',
  limits: [
    'The evaluator is a static approximation: it does not fetch your scripts, test for real bypasses, or know your site. A good grade does not prove the policy is safe or that it won\'t break your pages.',
    'The list of bypass-prone hosts is small and may be out of date; it only inspects script sources.',
    'Meta tags ignore `frame-ancestors`, `report-uri`, `report-to` and `sandbox`, and cannot be Report-Only; the meta output leaves those directives out and lists them.',
    'A nonce generated here is only an example. A real nonce must be fresh and unpredictable on every response, which a static file or this page cannot provide.',
    'Hash sources must match the script text byte for byte, including whitespace and line endings.',
  ],
  privacy:
    'The policy, pasted text and hashed code are processed in your browser and never uploaded or stored. "Copy share link" puts the policy in the link\'s fragment, which is not sent to any server.',
  faqs: [
    {
      question: 'Why is \'unsafe-inline\' flagged when I have a nonce?',
      answer: 'It isn\'t, as a problem. Browsers that understand nonces or hashes ignore \'unsafe-inline\' when one is present, so it is reported as an info note about older browsers.',
    },
    {
      question: 'Should I use a host allowlist or a nonce?',
      answer: 'A nonce with \'strict-dynamic\' is the more robust choice. Allowlists are easy to bypass when an allowed host serves JSONP endpoints or user-controlled files, which many popular CDNs do.',
    },
    {
      question: 'How do I roll out a CSP safely?',
      answer: 'Deploy it as Content-Security-Policy-Report-Only with a report-to or report-uri endpoint, fix the violations, then switch to the enforcing header.',
    },
    {
      question: 'Why does the meta tag drop some directives?',
      answer: 'Browsers ignore frame-ancestors, report-uri, report-to and sandbox in a meta tag (the tag also can\'t be Report-Only), so they must be sent as an HTTP header.',
    },
  ],
};

export default docs;
