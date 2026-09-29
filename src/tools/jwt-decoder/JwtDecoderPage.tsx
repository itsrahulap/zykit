import jwtDecoder from './index';
import { Breadcrumb } from '../../shared/ui/tool';

export default function JwtDecoderPage() {
  return <Breadcrumb tool={jwtDecoder} />;
}
