import userAgentParser from './index';
import { Breadcrumb } from '../../shared/ui/tool';

export default function UserAgentParserPage() {
  return <Breadcrumb tool={userAgentParser} />;
}
