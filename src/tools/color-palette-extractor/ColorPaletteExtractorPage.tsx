import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import colorPaletteExtractor from './index';
import {
  contrastBadges,
  EXPORT_FORMATS,
  exportPalette,
  extractPalette,
  MAX_K,
  MIN_K,
  percent,
  swatchValues,
  type ExportFormat,
  type Method,
  type Swatch,
} from './features/color-palette-extractor';
import { samplePixels, type Sample } from './features/sample';
import { toolPath } from '../registry';
import colorConverter from '../color-converter';
import { cssColor } from '../color-converter/features/color-converter';
import { useObjectUrl, usePageFileIntake } from '../../shared/hooks/useImageBatch';
import { buildShareLink } from '../../shared/lib/share';
import { checkFileSize } from '../../shared/lib/image';
import { FilePickerButton, ImageDropZone, RangeField } from '../../shared/ui/ImageBatch';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { downloadText } from '../../shared/utils/dom.utils';

function CopyValue({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1200);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <button
      type="button"
      aria-label={`Copy ${label} ${value}`}
      onClick={() => navigator.clipboard.writeText(value).then(() => setDone(true), () => undefined)}
      className="flex w-full min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-left text-xs pointer-coarse:min-h-11 hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <span className="w-11 shrink-0 font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <span className="min-w-0 flex-1 truncate font-mono text-slate-900 dark:text-slate-100">{done ? 'Copied' : value}</span>
    </button>
  );
}

const levelTone = (level: string) =>
  level === 'Fail'
    ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
    : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';

function SwatchCard({ swatch, index, onOpen }: { swatch: Swatch; index: number; onOpen: (hex: string) => void }) {
  const badges = contrastBadges(swatch.color);
  const textOnSwatch = badges.white.level !== 'Fail' && parseFloat(badges.white.ratio) >= parseFloat(badges.black.ratio) ? '#ffffff' : '#000000';
  return (
    <li className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => onOpen(swatch.hex)}
        aria-label={`Open ${swatch.hex} in Color Converter`}
        title="Open in Color Converter"
        className="flex h-20 w-full items-end justify-between rounded-xl p-2 text-sm font-semibold ring-1 ring-inset ring-slate-900/10 pointer-coarse:min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:ring-white/10"
        style={{ backgroundColor: cssColor(swatch.color), color: textOnSwatch }}
      >
        <span>{percent(swatch.share)}</span>
        <span aria-hidden="true">Aa</span>
      </button>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Colour {index + 1} · {percent(swatch.share)} of the image
      </p>
      <div className="mt-1">
        {swatchValues(swatch.color).map((v) => (
          <CopyValue key={v.id} label={v.label} value={v.value} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5 text-xs" aria-label={`Contrast of ${swatch.hex}`}>
        {[badges.white, badges.black].map((b) => (
          <li key={b.label} className={`rounded-md px-2 py-1 ${levelTone(b.level)}`}>
            {b.label} {b.ratio} · {b.level}
          </li>
        ))}
      </ul>
    </li>
  );
}

export default function ColorPaletteExtractorPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [sample, setSample] = useState<Sample | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [k, setK] = useState(6);
  const [method, setMethod] = useState<Method>('kmeans');
  const [seed, setSeed] = useState(1);
  const [format, setFormat] = useState<ExportFormat>('css');
  const [name, setName] = useState('palette');
  const url = useObjectUrl(file);

  const load = (files: File[]) => {
    const f = files.find((x) => x.type.startsWith('image/') || /\.(avif|heic|heif|ico|svg|bmp|webp)$/i.test(x.name));
    if (!f) {
      if (files.length) setError('That file is not an image.');
      return;
    }
    setError(null);
    try {
      checkFileSize(f.size);
    } catch (e) {
      setError((e instanceof Error ? e.message : 'This image could not be read.'));
      return;
    }
    setFile(f);
    setSample(null);
    setBusy(true);
    samplePixels(f).then(
      (s) => {
        setSample(s);
        setBusy(false);
      },
      (e) => {
        setError((e instanceof Error ? e.message : 'This image could not be read.'));
        setFile(null);
        setBusy(false);
      },
    );
  };
  usePageFileIntake(load);

  const swatches = useMemo(() => (sample ? extractPalette(sample.data, { k, method, seed }) : []), [sample, k, method, seed]);
  const exported = useMemo(() => exportPalette(swatches, format, name), [swatches, format, name]);
  const fmt = EXPORT_FORMATS.find((f) => f.value === format)!;

  const openInConverter = async (hex: string) => {
    const link = await buildShareLink({ color: hex }, new URL(toolPath(colorConverter), window.location.origin).href);
    if (link.ok) {
      const u = new URL(link.url);
      navigate(`${u.pathname}${u.hash}`);
    }
  };

  const status = !file
    ? 'Ready when you are. Drop, paste or choose an image.'
    : busy
      ? 'Reading the image…'
      : swatches.length
        ? `Found ${swatches.length} dominant colours.`
        : 'No visible pixels found in this image.';

  return (
    <div className="space-y-8">
      <Breadcrumb tool={colorPaletteExtractor} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="palette">Extract a colour </Headline>
        <FilePickerButton onFiles={load} multiple={false} label={file ? 'Choose another image' : 'Choose an image'} />
      </div>
      <StatusStrip status={status} tone={busy ? 'busy' : swatches.length ? 'good' : 'neutral'} />
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <section
        aria-label="Palette settings"
        className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <Segmented<Method>
          label="Method"
          options={[
            { value: 'kmeans', label: 'k-means (OKLab)' },
            { value: 'mediancut', label: 'Median cut' },
          ]}
          value={method}
          onChange={setMethod}
        />
        <RangeField label="Colours" min={MIN_K} max={MAX_K} value={k} onChange={setK} />
        {method === 'kmeans' && (
          <Button variant="secondary" onClick={() => setSeed((s) => s + 1)} disabled={!sample}>
            <Icon name="dice" className="h-4 w-4" /> Try another seed
          </Button>
        )}
      </section>

      {!file ? (
        <ImageDropZone onFiles={load} multiple={false} hint="JPEG, PNG, WebP and more · up to 50 MB · or paste an image" />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="checkerboard overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
            {url && <img src={url} alt="Uploaded image" className="mx-auto block max-h-[28rem] w-auto max-w-full" />}
          </div>
          <div className="min-w-0 space-y-4">
            {swatches.length > 0 && (
              <div role="img" aria-label="Palette proportions" className="flex h-8 overflow-hidden rounded-xl ring-1 ring-inset ring-slate-900/10 dark:ring-white/10">
                {swatches.map((s) => (
                  <span key={s.hex} style={{ width: `${s.share * 100}%`, backgroundColor: cssColor(s.color) }} />
                ))}
              </div>
            )}
            <ul aria-label="Palette" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {swatches.map((s, i) => (
                <SwatchCard key={s.hex} swatch={s} index={i} onOpen={openInConverter} />
              ))}
            </ul>
          </div>
        </div>
      )}

      {swatches.length > 0 && (
        <section aria-label="Export palette" className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="code" className="h-4 w-4" /> Export
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Segmented<ExportFormat> label="Export format" options={EXPORT_FORMATS.map((f) => ({ value: f.value, label: f.label }))} value={format} onChange={setFormat} />
              <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  spellCheck={false}
                  className="w-28 min-w-0 rounded-xl border border-field-edge bg-white px-3 py-2 font-mono text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
              <CopyButton text={exported} />
              <Button variant="ghost" onClick={() => downloadText(exported, `palette.${fmt.ext}`, fmt.mime)}>
                <Icon name="download" className="h-4 w-4" /> Download .{fmt.ext}
              </Button>
            </div>
          </header>
          <div className="p-4">
            <CodeBlock label="Exported palette">{exported}</CodeBlock>
          </div>
        </section>
      )}

      <Panel eyebrow="How it works" icon="info">
        <ul className="list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
          <li>The image is shrunk to at most 128 pixels on its longest side, then similar pixels are grouped so extraction is instant.</li>
          <li>
            <strong>k-means (OKLab)</strong> clusters colours in a perceptual space, starting from seeded k-means++ points; <strong>Median cut</strong> repeatedly splits
            the busiest RGB box. Transparent pixels are ignored.
          </li>
          <li>Click a colour to open it in the Color Converter. Your image never leaves your device.</li>
        </ul>
      </Panel>
    </div>
  );
}
