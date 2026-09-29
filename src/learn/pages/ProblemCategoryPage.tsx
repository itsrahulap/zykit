// Placeholder: /learn/problems/:categoryId
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';

export default function ProblemCategoryPage() {
  useDocumentMeta({ title: 'Problem category' });
  return <h1 className="text-3xl font-bold">Problem category</h1>;
}
