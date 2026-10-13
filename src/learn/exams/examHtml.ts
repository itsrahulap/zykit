// An exam's static search page body (scripts/seo-plugin.ts), matching what ExamHome shows: facts,
// domains, recent AWS changes and the same sample questions. All text is escaped.

import { escapeHtml as esc, richTextToHtml } from '../features/richTextHtml';
import type { Exam, ExamQuestion } from './types';

const inline = (t: string) => richTextToHtml(t).replace(/^<p>|<\/p>$/g, '');
const li = (items: string[]) => `<ul>${items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;

export function examHtml(exam: Exam, bankSize: number, samples: ExamQuestion[], title: string): string {
  const domains = exam.domains.map((d) => `<li>${esc(d.title)}: ${Math.round(d.weight * 100)}% of the exam</li>`).join('');
  const qs = exam.domains
    .map((d) => {
      const items = samples
        .filter((q) => q.domain === d.id)
        .map(
          (q) =>
            `<li>${inline(q.question)}<ol type="A">${q.options.map((o, i) => `<li>${inline(o)}${q.answer.includes(i) ? ' (correct)' : ''}</li>`).join('')}</ol>${richTextToHtml(q.explanation)}</li>`,
        )
        .join('');
      return `<h3>${esc(d.title)}</h3><ol>${items}</ol>`;
    })
    .join('');
  return (
    `<main class="px-4 py-8 sm:px-6 lg:px-10"><nav aria-label="Breadcrumb"><a href="/learn">Learn</a> / ${esc(exam.code)}</nav>` +
    `<h1>${esc(title)}</h1><p>${inline(exam.description.replace('questions with', `${bankSize} questions with`))}</p>` +
    `<h2>Exam format</h2>${li(exam.facts)}<h2>Domains</h2><ul>${domains}</ul>` +
    `<h2>Full mock test</h2><p>${exam.questionCount} questions in ${exam.minutes} minutes, drawn by domain weight, with a score per domain and an explanation for every answer.</p>` +
    `<h2>What changed since most study guides were written</h2>${li(exam.updates)}` +
    `<h2>Sample questions with answers</h2>${qs}` +
    `<h2>Study the topics</h2><p><a href="/learn/aws">AWS Cloud lessons</a> · <a href="/learn/aws/cloud-practitioner-exam">CLF-C02 exam guide and study path</a></p></main>`
  );
}
