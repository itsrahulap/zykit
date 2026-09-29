import hashGenerator from './index';
import { Breadcrumb } from '../../shared/ui/tool';

export default function HashGeneratorPage() {
  return <Breadcrumb tool={hashGenerator} />;
}
