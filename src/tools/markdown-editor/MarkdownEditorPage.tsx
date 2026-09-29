import markdownEditor from './index';
import { Breadcrumb } from '../../shared/ui/tool';

export default function MarkdownEditorPage() {
  return <Breadcrumb tool={markdownEditor} />;
}
