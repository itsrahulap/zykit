// Renders a post's typed blocks. Text uses the Learn light markup (RichText), so nothing is parsed as HTML.

import { useState } from 'react';
import { Link } from 'react-router';
import { InlineText, RichText } from '../../learn/components/RichText';
import { CodeBlock, CopyButton, Segmented } from '../../shared/ui/tool';
import { Icon } from '../../shared/ui/ui';
import { formatDate, getPost, postPath, readingMinutes } from '../registry';
import type { BlogPost, PostBlock } from '../types';

export const card = 'rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900';

export function PostMetaLine({ post }: { post: BlogPost }) {
  return (
    <p className="text-sm text-slate-500 dark:text-slate-400">
      <time dateTime={post.date}>{formatDate(post.date)}</time> · {readingMinutes(post)} min read
    </p>
  );
}

export function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={postPath(post)}
      className={`${card} group flex h-full flex-col transition-colors hover:border-emerald-500 dark:hover:border-emerald-500`}
    >
      <PostMetaLine post={post} />
      <span className="mt-2 text-lg font-semibold text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-400">
        {post.title}
      </span>
      <span className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{post.summary}</span>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
        Read <Icon name="arrow" className="h-4 w-4" />
      </span>
    </Link>
  );
}

function Commands({ chat, shell }: { chat: string[]; shell: string[] }) {
  const [where, setWhere] = useState<'chat' | 'shell'>('chat');
  const text = (where === 'chat' ? chat : shell).join('\n');
  return (
    <div className={card}>
      <Segmented
        label="Where you run the commands"
        value={where}
        onChange={setWhere}
        options={[
          { value: 'chat', label: 'In Claude Code' },
          { value: 'shell', label: 'In a shell' },
        ]}
      />
      <CodeBlock className="mt-4">{text}</CodeBlock>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {where === 'chat' ? 'Type in the Claude Code chat, one line at a time.' : 'Run in a terminal with the claude CLI installed.'}
        </p>
        <CopyButton text={text} />
      </div>
    </div>
  );
}

function Block({ block }: { block: PostBlock }) {
  switch (block.type) {
    case 'text':
      return <RichText text={block.text} />;
    case 'code':
      return (
        <figure>
          {block.caption && <figcaption className="mb-2 text-sm text-slate-500 dark:text-slate-400">{block.caption}</figcaption>}
          <div className="relative">
            <CodeBlock className="!whitespace-pre !break-normal">{block.code}</CodeBlock>
            <div className="absolute right-2 top-2">
              <CopyButton text={block.code} />
            </div>
          </div>
        </figure>
      );
    case 'commands':
      return <Commands chat={block.chat} shell={block.shell} />;
    case 'prompts':
      return (
        <div>
          <p className="eyebrow mb-2 text-slate-500">Try saying</p>
          <ul className="space-y-2">
            {block.items.map((p) => (
              <li key={p} className="rounded-xl bg-primary-soft px-4 py-2.5 text-primary-ink dark:bg-slate-800 dark:text-slate-200">
                “<InlineText text={p} />”
              </li>
            ))}
          </ul>
        </div>
      );
    case 'callout': {
      const warn = block.tone === 'warn';
      return (
        <aside
          className={`flex gap-3 rounded-2xl p-4 ${warn ? 'bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100' : 'bg-primary-soft text-primary-ink dark:bg-slate-800 dark:text-slate-200'}`}
        >
          <Icon name={warn ? 'warn' : 'info'} className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            {block.title && <p className="font-semibold">{block.title}</p>}
            <p>
              <InlineText text={block.text} />
            </p>
          </div>
        </aside>
      );
    }
    case 'cards':
      return (
        <ul className="grid gap-4 sm:grid-cols-2">
          {block.items.map((c) => (
            <li key={c.title} className={card}>
              <p className="font-bold text-slate-900 dark:text-white">{c.title}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                <InlineText text={c.text} />
              </p>
            </li>
          ))}
        </ul>
      );
    case 'steps':
      return (
        <ol className="space-y-3">
          {block.items.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-ink">{i + 1}</span>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{s.title}</p>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  <InlineText text={s.text} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      );
    case 'posts':
      return (
        <ul className="grid gap-4 sm:grid-cols-2">
          {block.slugs.map((slug) => {
            const post = getPost(slug);
            return (
              post && (
                <li key={slug}>
                  <PostCard post={post} />
                </li>
              )
            );
          })}
        </ul>
      );
  }
}

export function PostBlocks({ blocks }: { blocks: PostBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </div>
  );
}
