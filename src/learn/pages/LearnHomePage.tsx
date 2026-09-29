// Placeholder: /learn
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';

export default function LearnHomePage() {
  useDocumentMeta({ title: 'Learn home' });
  return <h1 className="text-3xl font-bold">Learn home</h1>;
}
