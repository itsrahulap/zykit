import { useState } from 'react';
import qrCodeGenerator from './index';
import { transform } from './features/qr-code-generator';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CodeArea, CodeBlock, CopyButton } from '../../shared/ui/tool';

export default function QrCodeGeneratorPage() {
  const [input, setInput] = useState('');
  const output = transform(input);

  return (
    <div className="space-y-8">
      <Breadcrumb tool={qrCodeGenerator} />
      <Headline accent="TODO">QR Code Generator </Headline>
      <StatusStrip status={input ? 'Done.' : 'Paste something to start.'} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CodeArea label="Input" value={input} onChange={(e) => setInput(e.target.value)} rows={12} />
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow text-slate-600 dark:text-slate-400">Output</h2>
            <CopyButton text={output} />
          </div>
          <CodeBlock>{output}</CodeBlock>
        </section>
      </div>
    </div>
  );
}
