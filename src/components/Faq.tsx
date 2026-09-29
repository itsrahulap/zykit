const QUESTIONS: { q: string; a: string }[] = [
  {
    q: 'Why are some details missing?',
    a: "Only what the file actually contains can be shown. Messaging apps like WhatsApp, and most social networks, already strip EXIF, GPS and camera data when you send an image, so a forwarded photo often has little more than a basic JFIF header left.",
  },
  {
    q: 'Does this upload my file?',
    a: 'No. The file is read and processed by your browser in a background worker. Nothing is sent to a server, and the page keeps working if you go offline after it has loaded.',
  },
  {
    q: 'What gets removed when I clean an image?',
    a: 'EXIF (camera, GPS, dates, thumbnails), XMP, IPTC, comments, PNG text chunks, C2PA Content Credentials and data appended after the image. The compressed pixel data is copied unchanged, so there is no quality loss. By default the color profile is kept so colors look the same.',
  },
  {
    q: 'Can this remove AI watermarks?',
    a: "No. CleanImage removes AI and provenance information stored as metadata, such as Content Credentials, IPTC digital-source-type labels and generator parameters. Invisible watermarks like Google's SynthID are embedded in the pixels themselves, and AI detectors analyze pixels, so cleaning metadata does not change a detector's result. CleanImage does not alter image content.",
  },
  {
    q: 'Why is the cleaned file smaller?',
    a: 'Metadata takes up space. Embedded thumbnails, color profiles and editing history can add tens or hundreds of kilobytes. Only that data is removed; the image itself is untouched.',
  },
];

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="grid gap-10 border-t border-slate-200 pt-12 lg:grid-cols-2 dark:border-slate-800">
      <div>
        <p className="eyebrow text-slate-600 dark:text-slate-400">A little context</p>
        <h2 id="faq-title" className="mt-3 max-w-md text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          What&rsquo;s inside an image file?
        </h2>
        <p className="mt-4 max-w-lg text-slate-600 dark:text-slate-400">
          Besides pixels, images carry metadata: the camera and lens, when and where a photo was taken, the software that edited it,
          and sometimes how it was generated. What's there depends on the device, the app and every service the file has passed through.
        </p>
      </div>
      <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {QUESTIONS.map(({ q, a }) => (
          <details key={q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
              <span className="text-emerald-600 transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true">
                ▸
              </span>
              {q}
            </summary>
            <p className="mt-2 pl-5 text-slate-600 dark:text-slate-400">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
