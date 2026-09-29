import encodeDecode from './index';
import { Breadcrumb } from '../../shared/ui/tool';

export default function EncodeDecodePage() {
  return <Breadcrumb tool={encodeDecode} />;
}
