// Placeholder: /learn/progress
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';

export default function ProgressPage() {
  useDocumentMeta({ title: 'Progress' });
  return <h1 className="text-3xl font-bold">Progress</h1>;
}
