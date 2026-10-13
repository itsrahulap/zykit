// Title, description, sample size and JSON-LD for an exam page, shared by ExamPage (useDocumentMeta)
// and the build step that writes its static search page (scripts/seo-plugin.ts).

import type { Exam, ExamQuestion } from './types';

export const SAMPLES_PER_DOMAIN = 8;

export const examMeta = (exam: Exam, bankSize?: number) => ({
  title: `${exam.title} (${exam.code}) Practice Exam: Free Questions and Mock Tests`,
  // "…practice exam: 483 questions with explanations…" once the bank size is known.
  description: bankSize ? exam.description.replace('questions with', `${bankSize} questions with`) : exam.description,
});

const plain = (t: string) => t.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\*([^*\s][^*]*)\*/g, '$1');

/** schema.org Quiz built from the sample questions visible on the page, plus a breadcrumb. */
export function examStructuredData(exam: Exam, samples: ExamQuestion[], url: string, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Quiz',
        name: `${exam.title} (${exam.code}) practice questions`,
        description: plain(exam.description),
        url,
        about: { '@type': 'Thing', name: `${exam.title} (${exam.code})` },
        educationalLevel: 'Beginner',
        isAccessibleForFree: true,
        hasPart: samples.map((q) => ({
          '@type': 'Question',
          eduQuestionType: q.answer.length > 1 ? 'Checkbox' : 'Multiple choice',
          text: plain(q.question),
          suggestedAnswer: q.options.map((o, i) => (q.answer.includes(i) ? null : { '@type': 'Answer', text: plain(o) })).filter(Boolean),
          acceptedAnswer: q.answer.map((i) => ({ '@type': 'Answer', text: plain(q.options[i]) })),
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Learn', item: `${siteUrl}/learn` },
          { '@type': 'ListItem', position: 2, name: `${exam.code} practice exam`, item: url },
        ],
      },
    ],
  };
}
