import { useMemo, useState } from 'react';
import barcodeGenerator from './index';
import { BarcodeError, FONT, TYPES, drawToCanvas, encode, isHexColor, layout, toSvg, type BarcodeType, type Code128Set } from './features/barcode-generator';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Breadcrumb, CopyButton, Segmented } from '../../shared/ui/tool';
import { Checkbox, OptionsCard } from '../../shared/ui/convert';
import { useShareState } from '../../shared/hooks/useShareState';
import { Icon } from '../../shared/ui/ui';
import { downloadBlob, downloadText } from '../../shared/utils/dom.utils';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const toolbarBtn =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium pointer-coarse:min-h-11 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800';
const colorCls = 'h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white pointer-coarse:h-11 dark:border-slate-700 dark:bg-slate-950';
const SAMPLES: Record<BarcodeType, string> = { code128: 'Toolstack-123', code39: 'TOOLSTACK', ean13: '590123412345', ean8: '9638507', upca: '03600029145', itf14: '0001234560001' };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.floor(v) || lo));

export default function BarcodeGeneratorPage() {
  const [type, setType] = useState<BarcodeType>('code128');
  const [text, setText] = useState(SAMPLES.code128);
  const [code128Set, setCode128Set] = useState<Code128Set>('auto');
  const [code39Check, setCode39Check] = useState(false);
  const [moduleWidth, setModuleWidth] = useState(2);
  const [height, setHeight] = useState(100);
  const [quiet, setQuiet] = useState(10);
  const [showText, setShowText] = useState(true);
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');

  useShareState(
    { type, text, code128Set, code39Check, moduleWidth, height, quiet, showText, fg, bg },
    (s) => {
      if (s.type) setType(s.type);
      if (s.text !== undefined) setText(s.text.slice(0, 200));
      if (s.code128Set) setCode128Set(s.code128Set);
      if (s.code39Check !== undefined) setCode39Check(s.code39Check);
      if (s.moduleWidth !== undefined) setModuleWidth(clamp(s.moduleWidth, 1, 10));
      if (s.height !== undefined) setHeight(clamp(s.height, 20, 400));
      if (s.quiet !== undefined) setQuiet(clamp(s.quiet, 0, 20));
      if (s.showText !== undefined) setShowText(s.showText);
      if (s.fg && isHexColor(s.fg)) setFg(s.fg);
      if (s.bg && isHexColor(s.bg)) setBg(s.bg);
    },
    { type: TYPES.map((t) => t.value), code128Set: ['auto', 'A', 'B', 'C'] },
  );

  const fontSize = Math.max(10, moduleWidth * 6);
  const result = useMemo(() => {
    try {
      const enc = encode(type, text, { code128Set, code39Check });
      const l = layout(enc, { moduleWidth, height, quiet, showText, fontSize, fg, bg });
      return { ok: true as const, enc, l };
    } catch (e) {
      if (e instanceof BarcodeError) return { ok: false as const, error: e.message };
      throw e;
    }
  }, [type, text, code128Set, code39Check, moduleWidth, height, quiet, showText, fontSize, fg, bg]);

  const svg = result.ok ? toSvg(result.l, { fg, bg, fontSize }) : '';
  const hint = TYPES.find((t) => t.value === type)?.hint ?? '';
  const fileName = `${type}-${(result.ok ? result.enc.data : 'barcode').replace(/[^\w-]+/g, '_').slice(0, 40)}`;

  const downloadPng = () => {
    if (!result.ok) return;
    const canvas = document.createElement('canvas');
    canvas.width = result.l.width;
    canvas.height = result.l.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawToCanvas(ctx, result.l, { fg, bg, fontSize });
    canvas.toBlob((b) => b && downloadBlob(b, `${fileName}.png`), 'image/png');
  };

  const status = !result.ok
    ? result.error
    : `${TYPES.find((t) => t.value === type)?.label} · ${result.enc.data}${result.enc.checkDigit ? ` · check ${type === 'code128' ? 'symbol' : 'digit'} ${result.enc.checkDigit}` : ''} · ${result.l.width}×${result.l.height} px`;

  return (
    <div className="space-y-8">
      <Breadcrumb tool={barcodeGenerator} />
      <Headline accent="barcodes">Make </Headline>
      <StatusStrip status={status} tone={result.ok ? 'good' : 'neutral'} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <div className="min-w-0 space-y-6">
          <section aria-label="Content" className="space-y-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <Segmented<BarcodeType>
              label="Barcode type"
              options={TYPES.map((t) => ({ value: t.value, label: t.label }))}
              value={type}
              onChange={(t) => {
                setType(t);
                setText(SAMPLES[t]);
              }}
            />
            <label className="block min-w-0">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Text or number</span>
              <input
                className={`${inputCls} font-mono`}
                value={text}
                maxLength={200}
                onChange={(e) => setText(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                aria-describedby="barcode-hint"
                aria-invalid={!result.ok}
              />
            </label>
            <p id="barcode-hint" className="text-sm text-slate-500 dark:text-slate-400">
              {hint}
            </p>
            {type === 'code128' && (
              <Segmented<Code128Set>
                label="Code set"
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'A', label: 'A' },
                  { value: 'B', label: 'B' },
                  { value: 'C', label: 'C' },
                ]}
                value={code128Set}
                onChange={setCode128Set}
              />
            )}
            {type === 'code39' && <Checkbox label="Add mod-43 check character" checked={code39Check} onChange={setCode39Check} />}
            {!result.ok && (
              <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                {result.error}
              </p>
            )}
          </section>

          <OptionsCard label="Appearance">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              Bar width (px)
              <input type="number" min={1} max={10} value={moduleWidth} onChange={(e) => setModuleWidth(clamp(Number(e.target.value), 1, 10))} className={`${inputCls} w-20`} />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              Height (px)
              <input type="number" min={20} max={400} step={10} value={height} onChange={(e) => setHeight(clamp(Number(e.target.value), 20, 400))} className={`${inputCls} w-24`} />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              Quiet zone (modules)
              <input type="number" min={0} max={20} value={quiet} onChange={(e) => setQuiet(clamp(Number(e.target.value), 0, 20))} className={`${inputCls} w-20`} />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className={colorCls} />
              Bars
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className={colorCls} />
              Background
            </label>
            <Checkbox label="Show text under the bars" checked={showText} onChange={setShowText} />
            {quiet < 10 && <p className="basis-full text-sm text-amber-800 dark:text-amber-300">Scanners expect a quiet zone of at least 10 modules on each side (EAN/UPC: 9 and 7).</p>}
          </OptionsCard>
        </div>

        <section aria-label="Barcode" className="min-w-0 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="grid" className="h-4 w-4" /> Preview
            </h2>
            <div className="flex flex-wrap items-center gap-1">
              <button type="button" className={toolbarBtn} disabled={!result.ok} onClick={downloadPng}>
                <Icon name="download" className="h-4 w-4" /> PNG
              </button>
              <button type="button" className={toolbarBtn} disabled={!result.ok} onClick={() => downloadText(svg, `${fileName}.svg`, 'image/svg+xml')}>
                <Icon name="download" className="h-4 w-4" /> SVG
              </button>
              <CopyButton text={svg} label="Copy SVG" disabled={!result.ok} />
            </div>
          </header>
          <div className="p-4 sm:p-6">
            {result.ok ? (
              <svg
                viewBox={`0 0 ${result.l.width} ${result.l.height}`}
                role="img"
                aria-label={`${type} barcode for ${result.enc.data}`}
                data-testid="barcode-preview"
                className="mx-auto block h-auto w-full max-w-full rounded-lg border border-slate-200 dark:border-slate-700"
                style={{ maxWidth: result.l.width }}
              >
                <rect width={result.l.width} height={result.l.height} fill={bg} />
                {result.l.bars.map((b) => (
                  <rect key={b.x} x={b.x} y={0} width={b.w} height={result.l.barHeight} fill={fg} shapeRendering="crispEdges" />
                ))}
                {result.l.texts.map((t) => (
                  <text key={`${t.x}-${t.text}`} x={t.x} y={t.y} textAnchor={t.anchor} fontFamily={FONT} fontSize={fontSize} fill={fg}>
                    {t.text}
                  </text>
                ))}
              </svg>
            ) : (
              <div className="flex min-h-32 items-center justify-center rounded-xl bg-slate-100 p-6 text-center text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">{status}</div>
            )}
          </div>
        </section>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">Barcodes are encoded in your browser by our own encoders; the text you enter is never uploaded. Test-scan before printing.</p>
    </div>
  );
}
