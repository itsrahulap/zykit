// /blog/<slug> — one post, with series contents and previous/next links.

import { Link, useParams } from 'react-router';
import { RichText } from '../../learn/components/RichText';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { Icon } from '../../shared/ui/ui';
import { PostBlocks, PostMetaLine } from '../components/PostBlocks';
import { BLOG_PATH, getPost, getSeries, postPath, seriesPosts } from '../registry';
import { postMeta } from '../seo';
import type { BlogPost, BlogSeries } from '../types';

const sectionId = (heading: string) => heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function SeriesNav({ series, current }: { series: BlogSeries; current: BlogPost }) {
  return (
    <nav aria-label="Series" className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="eyebrow text-slate-500">Series</p>
      <p className="mt-1 font-bold text-slate-900 dark:text-white">{series.title}</p>
      <ol className="mt-3 space-y-1.5 text-sm">
        {seriesPosts(series.id).map((p, i) => (
          <li key={p.slug} className="flex gap-2">
            <span className="w-4 shrink-0 text-right font-mono text-slate-500 dark:text-slate-400">{i + 1}</span>
            {p.slug === current.slug ? (
              <span aria-current="page" className="font-semibold text-emerald-700 dark:text-emerald-400">
                {p.title}
              </span>
            ) : (
              <Link to={postPath(p)} className="text-slate-600 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white">
                {p.title}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function PrevNext({ post }: { post: BlogPost }) {
  const list = post.series ? seriesPosts(post.series) : [];
  const i = list.findIndex((p) => p.slug === post.slug);
  const prev = list[i - 1];
  const next = list[i + 1];
  if (!prev && !next) return null;
  const linkClass = 'group flex flex-col gap-1 rounded-2xl border border-slate-200 p-4 hover:border-emerald-500 dark:border-slate-800';
  return (
    <nav aria-label="Previous and next posts" className="grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2 dark:border-slate-800">
      {prev ? (
        <Link to={postPath(prev)} className={linkClass}>
          <span className="eyebrow flex items-center gap-1 text-slate-500">
            <Icon name="chevron-left" className="h-4 w-4" /> Previous
          </span>
          <span className="font-semibold text-slate-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-400">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link to={postPath(next)} className={`${linkClass} sm:text-right`}>
          <span className="eyebrow flex items-center gap-1 text-slate-500 sm:justify-end">
            Next <Icon name="chevron-right" className="h-4 w-4" />
          </span>
          <span className="font-semibold text-slate-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-400">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}

function Post({ post }: { post: BlogPost }) {
  useDocumentMeta(postMeta(post));
  const series = getSeries(post.series);
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <article className="min-w-0 space-y-10">
        <header className="space-y-4">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
            <Link to={BLOG_PATH} className="hover:text-slate-900 hover:underline dark:hover:text-white">
              Blog
            </Link>
            {series && <span> / {series.title}</span>}
          </nav>
          <h1 className="text-3xl font-bold tracking-tight break-words text-slate-900 sm:text-4xl dark:text-white">{post.title}</h1>
          <PostMetaLine post={post} />
          <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
            {post.tags.map((t) => (
              <li key={t} className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {t}
              </li>
            ))}
          </ul>
          <RichText text={post.intro} className="text-lg" />
        </header>

        {post.sections.map((s) => {
          const id = sectionId(s.heading);
          return (
            <section key={s.heading} aria-labelledby={id} className="space-y-5">
              <h2 id={id} className="scroll-mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {s.heading}
              </h2>
              <PostBlocks blocks={s.blocks} />
            </section>
          );
        })}

        <PrevNext post={post} />
      </article>

      {series && (
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <SeriesNav series={series} current={post} />
        </aside>
      )}
    </div>
  );
}

function MissingPost() {
  useDocumentMeta({ title: 'Not found', noindex: true });
  return <NotFoundPage />;
}

export default function BlogPostPage() {
  const { slug = '' } = useParams();
  const post = getPost(slug);
  return post ? <Post post={post} /> : <MissingPost />;
}
