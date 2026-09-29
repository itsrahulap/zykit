// Placeholder: /learn/case-studies/:caseStudyId
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';

export default function CaseStudyPage() {
  useDocumentMeta({ title: 'Case study' });
  return <h1 className="text-3xl font-bold">Case study</h1>;
}
