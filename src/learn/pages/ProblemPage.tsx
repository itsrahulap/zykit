// Placeholder: /learn/problems/:categoryId/:problemId
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';

export default function ProblemPage() {
  useDocumentMeta({ title: 'Problem' });
  return <h1 className="text-3xl font-bold">Problem</h1>;
}
