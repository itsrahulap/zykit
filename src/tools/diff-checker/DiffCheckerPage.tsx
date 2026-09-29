import diffChecker from './index';
import { Breadcrumb } from '../../shared/ui/tool';

export default function DiffCheckerPage() {
  return <Breadcrumb tool={diffChecker} />;
}
