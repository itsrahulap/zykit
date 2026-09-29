// Placeholder: /learn/:subjectId/:topicId
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';

export default function TopicPage() {
  useDocumentMeta({ title: 'Topic' });
  return <h1 className="text-3xl font-bold">Topic</h1>;
}
