// Certification practice exams: a question bank per exam, used for timed mock tests and untimed
// practice. Text fields use the Learn light markup (**bold**, `code`, *italic*, "- " bullets).

export interface ExamDomain {
  id: string;
  title: string;
  /** Share of scored questions on the real exam, 0–1. Mock tests sample by these weights. */
  weight: number;
}

export interface ExamQuestion {
  /** Stable id, e.g. "cc-001"; stored in attempt history. */
  id: string;
  /** An ExamDomain id. */
  domain: string;
  question: string;
  /** 4 options for single answer; 5+ for "choose two/three". */
  options: string[];
  /** Indexes of the correct options. More than one means a multiple-response question. */
  answer: number[];
  /** Why the answer is right and why the other options are wrong. */
  explanation: string;
}

export interface Exam {
  id: string;
  /** e.g. "AWS Certified Cloud Practitioner" */
  title: string;
  /** e.g. "CLF-C02" */
  code: string;
  description: string;
  domains: ExamDomain[];
  /** Real exam format, used for full mock tests. */
  questionCount: number;
  minutes: number;
  /** Mock tests pass at this share correct. The real exam uses a scaled score (e.g. 700/1000). */
  passRatio: number;
  /** Facts shown on the exam page. */
  facts: string[];
  /** Recent changes older study material gets wrong; shown on the page and in its search page. */
  updates: string[];
}
