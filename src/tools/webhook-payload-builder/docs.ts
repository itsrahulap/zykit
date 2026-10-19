// User docs for Webhook Payload Builder, shown under the tool and in its SEO page.
import type { ToolDocs } from '../types';

const docs: ToolDocs = {
  howToUse: [
    'Pick a **Sample event** (user.created, payment.succeeded, order.updated or a custom one) and edit the **JSON body**. Mistakes are shown with their line and column.',
    'Set the method and **Endpoint URL** of your receiver, and add any extra headers.',
    'Choose a **Signature** style (GitHub, Stripe or generic) and enter a test secret, the same one your receiver uses in development.',
    'Copy the **cURL** or **fetch** command and run it in your terminal, or download the body as a fixture file for your tests.',
  ],
  howItWorks:
    'The signature is an HMAC-SHA256 of the body, computed with your browser’s built-in crypto. GitHub style sends `X-Hub-Signature-256: sha256=<hex>`; Stripe style signs the Unix timestamp, a dot and the body, and sends `Stripe-Signature: t=<time>,v1=<hex>`; the generic style sends `X-Signature: <hex>`. The page shows exactly which text was signed.\n\n' +
    'A signature only matches if the receiver checks the exact bytes that were sent. The cURL command sends the body with `--data-raw` in single quotes, and the fetch code sends it as a string, so nothing re-formats the JSON on the way. Content-Type, an event-name header and the signature header are added automatically.',
  limits: [
    'The page can’t send the request itself: its security policy blocks connections to other sites. Run the generated command instead.',
    'Signatures use HMAC-SHA256 only. Providers that sign other data (such as extra headers) or use public-key signatures need their own format.',
    'Sample data is made up and only shaped like real provider events; check your provider’s documentation for the exact fields.',
    'The cURL command is quoted for Bash and zsh, not Windows cmd.exe.',
  ],
  privacy:
    'Everything happens in your browser: the payload and secret are never uploaded, stored or put in a link. Still, use a test secret here, never a production one.',
  faqs: [
    {
      question: 'Why does my receiver say the signature is invalid?',
      answer:
        'Usually because it verifies a re-serialised body. Compute the HMAC over the raw request body before parsing the JSON, and use the same secret. For Stripe style, the timestamp must also be recent enough for your tolerance; press **Use current time**.',
    },
    {
      question: 'Can I send the webhook from this page?',
      answer: 'No. Zykit blocks connections to other sites for your privacy, so copy the cURL or fetch command and run it where your server is reachable.',
    },
    {
      question: 'Are the sample events real provider payloads?',
      answer: 'No. They are small, made-up events with example.com addresses and test ids, meant as a starting point you edit to match what your app expects.',
    },
  ],
};

export default docs;
