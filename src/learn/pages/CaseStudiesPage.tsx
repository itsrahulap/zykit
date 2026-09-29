// Placeholder: /learn/case-studies
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';

export default function CaseStudiesPage() {
  useDocumentMeta({ title: 'Case studies' });
  return <h1 className="text-3xl font-bold">Case studies</h1>;
}
