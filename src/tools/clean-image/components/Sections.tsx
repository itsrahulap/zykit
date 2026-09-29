import { Icon } from '../../../shared/ui/ui';

export function HowItWorks() {
  const items = [
    { title: 'Nothing leaves your device', body: 'Files are read and processed by your browser in a background worker. No uploads, no server, no analytics.' },
    { title: 'No quality loss', body: 'Metadata is cut out of the file. The compressed image data is copied byte for byte, never re-encoded.' },
    { title: 'Verified output', body: 'The cleaned file is re-read and checked for leftover metadata, dimensions and decodability before you download it.' },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((i) => (
        <div key={i.title} className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{i.title}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{i.body}</p>
        </div>
      ))}
    </div>
  );
}

export function DetectorNote() {
  return (
    <section
      aria-labelledby="detector-note"
      className="flex gap-3 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
    >
      <Icon name="info" className="h-5 w-5 shrink-0 text-emerald-600" />
      <div>
        <h2 id="detector-note" className="font-semibold text-slate-900 dark:text-slate-100">
          Why an AI detector may still flag this image
        </h2>
        <p className="mt-1">
          CleanImage removed the metadata and Content Credentials stored in the file. AI detectors don't rely on those: they
          analyze the pixels themselves, and some generators also embed invisible watermarks (such as Google's SynthID) in the
          image content. The pixels are unchanged here, so detector results will be the same as for the original.
        </p>
      </div>
    </section>
  );
}
