// /blog — every post, newest first, with series highlighted.

import { Link } from 'react-router';
import { useDocumentMeta } from '../../shared/hooks/useDocumentMeta';
import { Headline } from '../../shared/ui/page';
import { Icon } from '../../shared/ui/ui';
import { PostCard, card } from '../components/PostBlocks';
import { POSTS, SERIES, postPath, postsByDate, seriesPosts } from '../registry';
import { blogHomeMeta } from '../seo';

export default function BlogHomePage() {
  useDocumentMeta(blogHomeMeta());
  return (
    <div className="space-y-14">
      <section className="space-y-5">
        <p className="eyebrow flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <Icon name="book" className="h-4 w-4" /> Blog
        </p>
        <Headline accent="developers">Practical guides for </Headline>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Hands-on write-ups of tools and workflows we use to build this site. {POSTS.length} posts so far.
        </p>
      </section>

      {SERIES.map((s) => {
        const posts = seriesPosts(s.id);
        return (
          <section key={s.id} aria-labelledby={`series-${s.id}`} className={`${card} sm:p-8`}>
            <p className="eyebrow text-slate-500">Series · {posts.length} posts</p>
            <h2 id={`series-${s.id}`} className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {s.title}
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">{s.description}</p>
            <ol className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {posts.map((p, i) => (
                <li key={p.slug} className="flex gap-3">
                  <span className="w-6 shrink-0 text-right font-mono text-sm text-slate-400">{i + 1}</span>
                  <Link to={postPath(p)} className="text-slate-800 hover:text-emerald-700 hover:underline dark:text-slate-200 dark:hover:text-emerald-400">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      <section aria-labelledby="all-posts">
        <h2 id="all-posts" className="eyebrow mb-5 border-b border-slate-200 pb-3 text-slate-600 dark:border-slate-800 dark:text-slate-400">
          All posts
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {postsByDate().map((p) => (
            <li key={p.slug}>
              <PostCard post={p} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
