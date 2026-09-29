// Placeholder: /learn/:subjectId
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';

export default function SubjectPage() {
  useDocumentMeta({ title: 'Subject' });
  return <h1 className="text-3xl font-bold">Subject</h1>;
}
