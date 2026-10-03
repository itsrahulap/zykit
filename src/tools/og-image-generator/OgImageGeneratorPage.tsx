import { cloneElement, useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ReactElement } from 'react';
import ogImageGenerator from './index';
import { FacebookCard, LinkedInCard, SlackCard, XCard } from './components/Cards';
import { applyTheme, clipEmoji, DEFAULT_DESIGN, FONTS, THEMES, type BgKind, type Design, type FontId, type PatternId } from './features/design';
import { safeArea, SIZES, sizeById, squareCrop, type Align, type SizeId } from './features/layout';
import { fileName, isAbsoluteHttpUrl, ogMetaTags } from './features/meta';
import { renderOg } from './features/render';
import { AppError } from '../../shared/lib/errors';
import { decodeImage } from '../../shared/lib/image';
import { Checkbox, Notices } from '../../shared/ui/convert';
import { FilePickerButton, RangeField } from '../../shared/ui/ImageBatch';
import { Headline, StatusStrip } from '../../shared/ui/page';
import { Panel } from '../../shared/ui/Panel';
import { Breadcrumb, CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Button, Icon } from '../../shared/ui/ui';
import { downloadBlob } from '../../shared/utils/dom.utils';

const INPUT =
  'block w-full rounded-xl border border-field-edge bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 pointer-coarse:min-h-11 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-slate-900 dark:text-slate-100';

function Field({ label, children }: { label: string; children: ReactElement<{ id?: string }> }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200">
        {label}
      </label>
      {cloneElement(children, { id })}
    </div>
  );
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
      {label}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-field-edge bg-white p-0.5 pointer-coarse:h-11 dark:bg-slate-900" />
    </label>
  );
}

const toBlob = (c: HTMLCanvasElement, type: string, q?: number) => new Promise<Blob | null>((r) => c.toBlob(r, type, q));

export default function OgImageGeneratorPage() {
  const [d, setD] = useState<Design>(DEFAULT_DESIGN);
  const [logo, setLogo] = useState<ImageBitmap | null>(null);
  const [logoName, setLogoName] = useState('');
  const [error, setError] = useState('');
  const [guides, setGuides] = useState(true);
  const [pageUrl, setPageUrl] = useState('https://example.com/');
  const [imageUrl, setImageUrl] = useState('https://example.com/og-image.png');
  const [description, setDescription] = useState('');
  const [alt, setAlt] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const dd = useDeferredValue(d);
  const size = sizeById(d.size);
  const set = <K extends keyof Design>(k: K, v: Design[K]) => setD((p) => ({ ...p, [k]: v, ...(['bgKind', 'c1', 'c2', 'angle', 'pattern', 'textColor', 'accent'].includes(k) ? { theme: 'custom' } : {}) }));

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const s = sizeById(dd.size);
    c.width = s.w;
    c.height = s.h;
    renderOg(ctx, dd, logo);
    let live = true;
    let url = '';
    const t = setTimeout(() => {
      void toBlob(c, 'image/png').then((b) => {
        if (!live || !b) return;
        url = URL.createObjectURL(b);
        setPreviewUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
      });
    }, 150);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [dd, logo]);
  useEffect(() => () => setPreviewUrl((old) => (old && URL.revokeObjectURL(old), '')), []);

  const onLogo = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError('');
    try {
      const bmp = await decodeImage(f);
      setLogo((old) => (old?.close(), bmp));
      setLogoName(f.name);
    } catch (e) {
      setError(e instanceof AppError || e instanceof Error ? e.message : 'That file could not be read as an image.');
    }
  };

  const save = async (kind: 'png' | 'jpg') => {
    const c = canvas.current;
    if (!c) return;
    const b = await toBlob(c, kind === 'png' ? 'image/png' : 'image/jpeg', 0.92);
    if (b) downloadBlob(b, fileName(size, kind));
    else setError('Your browser could not encode the image.');
  };

  const desc = description.trim() || d.subtitle;
  const metaAlt = alt.trim() || d.title;
  const meta = useMemo(() => ogMetaTags({ title: d.title, description: desc, pageUrl: pageUrl.trim(), imageUrl: imageUrl.trim(), siteName: d.siteName, alt: metaAlt, size }), [d.title, desc, pageUrl, imageUrl, d.siteName, metaAlt, size]);
  const safe = safeArea(size);
  const crop = squareCrop(size);
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const card = { src: previewUrl, title: d.title, description: desc, url: pageUrl, siteName: d.siteName, size };
  const urlBad = (u: string) => u.trim() !== '' && !isAbsoluteHttpUrl(u.trim());

  return (
    <div className="space-y-8">
      <Breadcrumb tool={ogImageGenerator} />
      <Headline accent="image">Design a social </Headline>
      <StatusStrip status={`Canvas ${size.w} × ${size.h}. Edit on the left, download when it looks right.`} />
      {error && <Notices items={[error]} />}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-label="Design" className="min-w-0 space-y-5 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <Segmented<SizeId> label="Image size" value={d.size} onChange={(v) => set('size', v)} options={SIZES.map((s) => ({ value: s.id, label: s.short }))} />
          <Field label="Title">
            <textarea rows={2} maxLength={200} value={d.title} onChange={(e) => set('title', e.target.value)} className={`${INPUT} resize-y`} />
          </Field>
          <Field label="Subtitle">
            <input maxLength={300} value={d.subtitle} onChange={(e) => set('subtitle', e.target.value)} className={INPUT} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Eyebrow">
              <input maxLength={60} value={d.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} className={INPUT} />
            </Field>
            <Field label="Site name">
              <input maxLength={60} value={d.siteName} onChange={(e) => set('siteName', e.target.value)} className={INPUT} />
            </Field>
            <Field label="Emoji">
              <input value={d.emoji} onChange={(e) => set('emoji', clipEmoji(e.target.value))} placeholder="🚀" className={INPUT} />
            </Field>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-800 dark:text-slate-200">Theme</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={d.theme === t.id}
                  onClick={() => setD((p) => applyTheme(p, t.id))}
                  className={`flex items-center gap-2 rounded-xl border p-2 text-left text-sm pointer-coarse:min-h-11 ${d.theme === t.id ? 'border-emerald-600 ring-2 ring-emerald-600/40' : 'border-slate-200 dark:border-slate-700'} text-slate-800 dark:text-slate-200`}
                >
                  <span
                    aria-hidden="true"
                    className="h-6 w-6 shrink-0 rounded-md border border-slate-300"
                    style={{ background: t.bgKind === 'gradient' ? `linear-gradient(135deg, ${t.c1}, ${t.c2})` : t.c1, boxShadow: `inset 0 -6px 0 ${t.accent}` }}
                  />
                  <span className="min-w-0 truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-3">
            <Segmented<BgKind> label="Background" value={d.bgKind} onChange={(v) => set('bgKind', v)} options={[{ value: 'solid', label: 'Solid' }, { value: 'gradient', label: 'Gradient' }, { value: 'pattern', label: 'Pattern' }]} />
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Color label={d.bgKind === 'pattern' ? 'Base' : 'Colour 1'} value={d.c1} onChange={(v) => set('c1', v)} />
              {d.bgKind !== 'solid' && <Color label={d.bgKind === 'pattern' ? 'Pattern' : 'Colour 2'} value={d.c2} onChange={(v) => set('c2', v)} />}
              <Color label="Text" value={d.textColor} onChange={(v) => set('textColor', v)} />
              <Color label="Accent" value={d.accent} onChange={(v) => set('accent', v)} />
            </div>
            {d.bgKind === 'gradient' && <RangeField label="Angle" value={d.angle} min={0} max={360} suffix="°" onChange={(v) => set('angle', v)} />}
            {d.bgKind === 'pattern' && <Segmented<PatternId> label="Pattern" value={d.pattern} onChange={(v) => set('pattern', v)} options={[{ value: 'dots', label: 'Dots' }, { value: 'grid', label: 'Grid' }, { value: 'stripes', label: 'Stripes' }]} />}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Segmented<Align> label="Text alignment" value={d.align} onChange={(v) => set('align', v)} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }]} />
            <Segmented<FontId> label="Font" value={d.font} onChange={(v) => set('font', v)} options={FONTS.map((f) => ({ value: f.id, label: f.label }))} />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">Fonts are the system fonts of your device, so the exported image uses whatever your device has for each style.</p>

          <div className="flex flex-wrap items-center gap-3">
            <FilePickerButton multiple={false} variant="secondary" label={logo ? 'Replace logo' : 'Upload logo or image'} onFiles={onLogo} />
            {logo && (
              <Button variant="ghost" onClick={() => (setLogo((old) => (old?.close(), null)), setLogoName(''))}>
                <Icon name="x" className="h-4 w-4" /> Remove {logoName ? `“${logoName}”` : 'logo'}
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">The logo is drawn on your device and never uploaded. An emoji replaces the logo.</p>
        </section>

        <div className="min-w-0 space-y-4 lg:sticky lg:top-4">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <canvas ref={canvas} width={size.w} height={size.h} role="img" aria-label={`Preview of the ${size.w} by ${size.h} image`} className="block h-auto w-full" />
            {guides && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute border-2 border-dashed border-fuchsia-500" style={{ left: pct(safe.x, size.w), top: pct(safe.y, size.h), width: pct(safe.w, size.w), height: pct(safe.h, size.h) }} />
                {crop && <div className="absolute border-2 border-dotted border-sky-400" style={{ left: pct(crop.x, size.w), top: 0, width: pct(crop.w, size.w), height: '100%' }} />}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void save('png')}>
              <Icon name="download" className="h-4 w-4" /> Download PNG
            </Button>
            <Button variant="secondary" onClick={() => void save('jpg')}>
              <Icon name="download" className="h-4 w-4" /> Download JPEG
            </Button>
            <Checkbox label="Safe-area guides" checked={guides} onChange={setGuides} />
          </div>
          {guides && (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Pink dashed: keep text inside. {crop && 'Blue dotted: the centre square some apps crop to. '}Guides are not part of the download.
            </p>
          )}
        </div>
      </div>

      <Panel eyebrow="Link previews" icon="image">
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">Approximate layouts: each platform changes its cards from time to time and crops the image to its own ratio.</p>
        <div className="grid gap-6 md:grid-cols-2">
          {previewUrl ? (
            <>
              <figure className="min-w-0 space-y-2">
                <figcaption className="eyebrow text-slate-600 dark:text-slate-400">Facebook</figcaption>
                <FacebookCard {...card} />
              </figure>
              <figure className="min-w-0 space-y-2">
                <figcaption className="eyebrow text-slate-600 dark:text-slate-400">X / Twitter</figcaption>
                <XCard {...card} />
              </figure>
              <figure className="min-w-0 space-y-2">
                <figcaption className="eyebrow text-slate-600 dark:text-slate-400">LinkedIn</figcaption>
                <LinkedInCard {...card} />
              </figure>
              <figure className="min-w-0 space-y-2">
                <figcaption className="eyebrow text-slate-600 dark:text-slate-400">Slack</figcaption>
                <SlackCard {...card} />
              </figure>
            </>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">Rendering previews…</p>
          )}
        </div>
      </Panel>

      <Panel eyebrow="Meta tags" icon="code">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Page URL">
            <input value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} aria-invalid={urlBad(pageUrl)} className={INPUT} />
          </Field>
          <Field label="Image URL (where you will host it)">
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} aria-invalid={urlBad(imageUrl)} className={INPUT} />
          </Field>
          <Field label="Description (defaults to the subtitle)">
            <input maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} className={INPUT} />
          </Field>
          <Field label="Image alt text (defaults to the title)">
            <input maxLength={200} value={alt} onChange={(e) => setAlt(e.target.value)} className={INPUT} />
          </Field>
        </div>
        {(urlBad(pageUrl) || urlBad(imageUrl)) && <p className="mt-3 text-sm text-red-700 dark:text-red-400">Use full http(s) URLs: crawlers ignore relative image paths.</p>}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="eyebrow text-slate-600 dark:text-slate-400">HTML</h3>
            <CopyButton text={meta} label="Copy tags" />
          </div>
          <CodeBlock label="Meta tags">{meta}</CodeBlock>
        </div>
      </Panel>
    </div>
  );
}
