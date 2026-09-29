import jsonFormatter from './index';
import { Breadcrumb } from '../../shared/ui/tool';

export default function JsonFormatterPage() {
  return <Breadcrumb tool={jsonFormatter} />;
}
