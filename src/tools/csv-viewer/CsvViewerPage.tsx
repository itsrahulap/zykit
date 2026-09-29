import csvViewer from './index';
import { Breadcrumb } from '../../shared/ui/tool';

export default function CsvViewerPage() {
  return <Breadcrumb tool={csvViewer} />;
}
