import type { ToolDefinition } from '../types';

const certificateInspector: ToolDefinition = {
  id: 'certificate-inspector',
  name: 'Certificate Inspector',
  tagline: 'Decode PEM certificates and keys',
  description:
    'Inspect X.509 certificates, CSRs and public keys: subject, issuer, validity, SANs, key type and fingerprints.',
  category: 'Security',
  icon: 'shield',
  tags: ['PEM', 'X.509', 'SSL', 'TLS'],
  status: 'available',
  load: () => import('./CertificateInspectorPage'),
};

export default certificateInspector;
