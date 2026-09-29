// Placeholder: /learn/bookmarks
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';

export default function BookmarksPage() {
  useDocumentMeta({ title: 'Bookmarks' });
  return <h1 className="text-3xl font-bold">Bookmarks</h1>;
}
