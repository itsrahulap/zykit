import { useEffect, useRef, useState } from 'react';
import faviconGenerator from './index';
import { buildHtmlSnippet, buildManifest, PNG_FILES, type SiteInfo } from './features/favicon';
import { generateFavicons, type IconDesign, type Shape } from './utils/render';
import { AppError } from '../../shared/lib/errors';
import { decodeImage } from '../../shared/lib/image';
import { FilePickerButton, ImageDropZone, RangeField } from '../../shared/ui/ImageBatch';
import { usePageFileIntake } from '../../shared/hooks/useImageBatch';
import { downloadBlob, downloadZip } from '../../shared/lib/imageClient';
import { Checkbox, OptionsCard } from '../../shared/ui/convert';
import { ErrorAlert, Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { formatBytes } from '../../shared/utils/format.utils';

const DEFAULT_DESIGN: IconDesign = {
  source: 'text',
  text: 'Z',
  textColor: '#ffffff',
  font: 'sans',
  bold: true,
  background: '#059669',
  transparent: false,
  shape: 'rounded',
  padding: 12,
  fit: 'contain',
};

const inputClass =
  'min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

function ColorField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <label className={`inline-flex items-center gap-2 text-sm text-slate-600 pointer-coarse:min-h-11 dark:text-slate-400 ${disabled ? 'opacity-50' : ''}`}>
      {label}
      <input
        type="color"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
      />
    </label>
  );
}

function TextField({ label, value, onChange, className = 'w-40', maxLength }: { label: string; value: string; onChange: (v: string) => void; className?: string; maxLength?: number }) {
  return (
    <label className="inline-flex min-w-0 items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      <span className="shrink-0">{label}</span>
      <input type="text" value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} className={`${inputClass} ${className}`} />
    </label>
  );
}

type Generated = { name: string; blob: Blob; url: string; size?: number }[];

export default function FaviconGeneratorPage() {
  const [design, setDesign] = useState<IconDesign>(DEFAULT_DESIGN);
  const [site, setSite] = useState<SiteInfo>({ name: 'My site', shortName: '', themeColor: '#059669', backgroundColor: '#ffffff', basePath: '/' });
  const [image, setImage] = useState<{ name: string; bitmap: ImageBitmap } | null>(null);
  const [files, setFiles] = useState<Generated>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const filesRef = useRef<Generated>([]);
  const set = (p: Partial<IconDesign>) => setDesign((d) => ({ ...d, ...p }));

  const openImage = async (list: File[]) => {
    const file = list[0];
    if (!file) return;
    setError(null);
    try {
      const bitmap = await decodeImage(file);
      setImage((old) => {
        old?.bitmap.close();
        return { name: file.name, bitmap };
      });
      set({ source: 'image', transparent: true, padding: 0 });
    } catch (e) {
      setError(e instanceof AppError ? e.message : "This file couldn't be opened as an image.");
    }
  };
  usePageFileIntake(openImage);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const out = await generateFavicons(design, image?.bitmap ?? null);
        if (cancelled) return;
        const next = out.files.map((f) => ({ ...f, url: URL.createObjectURL(f.blob) }));
        for (const f of filesRef.current) URL.revokeObjectURL(f.url);
        filesRef.current = next;
        setFiles(next);
      } catch (e) {
        if (!cancelled) setError(e instanceof AppError ? e.message : 'Could not draw the icons in this browser.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [design, image]);
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  const manifest = buildManifest({ ...site, backgroundColor: design.transparent ? site.backgroundColor : design.background });
  const snippet = buildHtmlSnippet(site);
  const byName = (n: string) => files.find((f) => f.name === n);
  const tabIcon = byName('favicon-32x32.png')?.url;
  const appleIcon = byName('apple-touch-icon.png')?.url;
  const needsImage = design.source === 'image' && !image;

  const downloadAll = () =>
    downloadZip(
      [
        ...files.map((f) => ({ name: f.name, blob: f.blob })),
        { name: 'site.webmanifest', blob: new Blob([manifest], { type: 'application/manifest+json' }) },
        { name: 'favicon-tags.html', blob: new Blob([snippet + '\n'], { type: 'text/html' }) },
      ],
      'favicons.zip',
    );

  return (
    <div className="space-y-8">
      <Breadcrumb tool={faviconGenerator} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <Headline accent="favicon">Make every size of your </Headline>
        <Button onClick={downloadAll} disabled={!files.length || needsImage} className="pointer-coarse:min-h-11">
          <Icon name="download" className="h-4 w-4" /> Download all (ZIP)
        </Button>
      </div>
      <StatusStrip status={busy ? 'Drawing icons…' : needsImage ? 'Choose an image to start.' : `${files.length + 1} files ready.`} tone={busy ? 'busy' : 'good'} />
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <OptionsCard label="Icon design">
        <Segmented
          label="Source"
          options={[
            { value: 'text', label: 'Text or emoji' },
            { value: 'image', label: 'Image' },
          ]}
          value={design.source}
          onChange={(source) => set({ source })}
        />
        {design.source === 'text' ? (
          <>
            <TextField label="Text" value={design.text} onChange={(text) => set({ text })} className="w-24" maxLength={8} />
            <ColorField label="Text colour" value={design.textColor} onChange={(textColor) => set({ textColor })} />
            <Segmented
              label="Font"
              options={[
                { value: 'sans', label: 'Sans' },
                { value: 'serif', label: 'Serif' },
                { value: 'mono', label: 'Mono' },
              ]}
              value={design.font}
              onChange={(font) => set({ font })}
            />
            <Checkbox label="Bold" checked={design.bold} onChange={(bold) => set({ bold })} />
          </>
        ) : (
          <>
            <FilePickerButton onFiles={openImage} multiple={false} label={image ? 'Change image' : 'Choose image'} variant="secondary" />
            {image && <span className="min-w-0 truncate text-sm text-slate-600 dark:text-slate-400">{image.name}</span>}
            <Segmented
              label="Fit"
              options={[
                { value: 'contain', label: 'Fit' },
                { value: 'cover', label: 'Fill (crop)' },
              ]}
              value={design.fit}
              onChange={(fit) => set({ fit })}
            />
          </>
        )}
        <ColorField label="Background" value={design.background} disabled={design.transparent} onChange={(background) => set({ background })} />
        <Checkbox label="Transparent background" checked={design.transparent} onChange={(transparent) => set({ transparent })} />
        <Segmented<Shape>
          label="Shape"
          options={[
            { value: 'square', label: 'Square' },
            { value: 'rounded', label: 'Rounded' },
            { value: 'circle', label: 'Circle' },
          ]}
          value={design.shape}
          onChange={(shape) => set({ shape })}
        />
        <RangeField label="Padding" min={0} max={30} suffix="%" value={design.padding} onChange={(padding) => set({ padding })} />
      </OptionsCard>

      {needsImage ? (
        <ImageDropZone onFiles={openImage} multiple={false} hint="A square PNG or SVG of at least 512 px works best · or paste" />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Panel eyebrow="Preview" icon="globe">
            <div className="space-y-4">
              {(['light', 'dark'] as const).map((mode) => (
                <div
                  key={mode}
                  className={`overflow-hidden rounded-2xl ${mode === 'light' ? 'bg-slate-200 text-slate-800' : 'bg-slate-950 text-slate-200'}`}
                  aria-label={`Browser tab preview, ${mode}`}
                  role="img"
                >
                  <div className="flex items-end gap-1 px-2 pt-2">
                    <div className={`flex min-w-0 max-w-60 flex-1 items-center gap-2 rounded-t-xl px-3 py-2 text-sm ${mode === 'light' ? 'bg-white' : 'bg-slate-800'}`}>
                      {tabIcon && <img src={tabIcon} alt="" width={16} height={16} className="h-4 w-4 shrink-0" />}
                      <span className="truncate">{site.name || 'My site'}</span>
                      <Icon name="x" className="ml-auto h-3 w-3 shrink-0 opacity-60" />
                    </div>
                    <div className="truncate px-3 py-2 text-sm opacity-60">New tab</div>
                  </div>
                  <div className={`h-3 ${mode === 'light' ? 'bg-white' : 'bg-slate-800'}`} />
                </div>
              ))}
              <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 p-4">
                {appleIcon && <img src={appleIcon} alt="Home screen icon preview" className="h-16 w-16 rounded-[22%] shadow-lg" />}
                <span className="text-sm font-medium text-white drop-shadow">{(site.shortName || site.name || 'My site').slice(0, 14)}</span>
              </div>
            </div>
          </Panel>
          <Panel eyebrow="Files" icon="file">
            <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
              {files.map((f) => {
                const info = PNG_FILES.find((p) => p.name === f.name);
                return (
                  <li key={f.name} className="flex items-center gap-3 py-2.5">
                    <div className="checkerboard flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                      <img src={f.url} alt="" className="max-h-8 max-w-8" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">{f.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {info ? `${info.size}×${info.size} · ${info.purpose}` : '16, 32 and 48 px in one file'} · {formatBytes(f.blob.size)}
                      </p>
                    </div>
                    <a
                      href={f.url}
                      download={f.name}
                      aria-label={`Download ${f.name}`}
                      className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50 pointer-coarse:min-h-11 pointer-coarse:min-w-11 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                    >
                      <Icon name="download" className="h-4 w-4" />
                    </a>
                  </li>
                );
              })}
              <li className="flex items-center gap-3 py-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Icon name="braces" className="h-5 w-5 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">site.webmanifest</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Name, colours and Android icons</p>
                </div>
                <button
                  type="button"
                  aria-label="Download site.webmanifest"
                  onClick={() => downloadBlob(new Blob([manifest], { type: 'application/manifest+json' }), 'site.webmanifest')}
                  className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50 pointer-coarse:min-h-11 pointer-coarse:min-w-11 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                >
                  <Icon name="download" className="h-4 w-4" />
                </button>
              </li>
            </ul>
          </Panel>
        </div>
      )}

      <OptionsCard label="Site details">
        <TextField label="Site name" value={site.name} onChange={(name) => setSite((s) => ({ ...s, name }))} maxLength={60} />
        <TextField label="Short name" value={site.shortName} onChange={(shortName) => setSite((s) => ({ ...s, shortName }))} className="w-28" maxLength={30} />
        <ColorField label="Theme colour" value={site.themeColor} onChange={(themeColor) => setSite((s) => ({ ...s, themeColor }))} />
        <TextField label="Path" value={site.basePath} onChange={(basePath) => setSite((s) => ({ ...s, basePath }))} className="w-32" maxLength={100} />
      </OptionsCard>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-label="HTML" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="code" className="h-4 w-4" /> Add to your &lt;head&gt;
            </h2>
            <CopyButton text={snippet} />
          </div>
          <CodeBlock className="whitespace-pre! break-normal! overflow-x-auto">{snippet}</CodeBlock>
        </section>
        <section aria-label="Manifest" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="eyebrow flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Icon name="braces" className="h-4 w-4" /> site.webmanifest
            </h2>
            <CopyButton text={manifest} />
          </div>
          <CodeBlock className="whitespace-pre! break-normal! overflow-x-auto">{manifest}</CodeBlock>
        </section>
      </div>

      <Panel eyebrow="How it works" icon="info">
        <ul className="list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300">
          <li>favicon.ico holds 16, 32 and 48 px PNG images in one file, so old browsers and Windows pick the right size.</li>
          <li>The Apple touch icon always gets a solid square background: iOS rounds the corners itself and shows transparency as black.</li>
          <li>Upload the files to your site&rsquo;s root (or the path you set) and paste the tags into your page&rsquo;s &lt;head&gt;.</li>
          <li>Icons are drawn on your device with canvas. Nothing is uploaded.</li>
        </ul>
      </Panel>
    </div>
  );
}
