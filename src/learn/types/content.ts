// Core content types for the EngineeringWiki knowledge base.
// All learning content (JavaScript, DSA, System Design) is described
// using these shapes, so pages/components never hardcode subject content.

export type SubjectId =
  | "javascript"
  | "dsa"
  | "system-design"
  | "typescript"
  | "web-fundamentals"
  | "backend"
  | "databases"
  | "software-architecture";

export type TopicLevel = "beginner" | "intermediate" | "advanced";

export type ProgressStatus =
  | "not-started"
  | "learning"
  | "completed"
  | "needs-review";

/** One code line (or small chunk) paired with a plain-language explanation. */
export interface WalkthroughStep {
  code: string;
  explanation: string;
}

export interface CodeExample {
  /** Optional short caption shown above the code block. */
  title?: string;
  code: string;
  language?: string;
  /** Optional explanation shown below the code. */
  explanation?: string;
  /**
   * Optional line-by-line (or chunk-by-chunk) breakdown of this example,
   * rendered as a numbered walkthrough beneath the code block. Reserved
   * for the simplest example on a topic — not every example needs one.
   */
  walkthrough?: WalkthroughStep[];
}

export interface Exercise {
  difficulty: "Easy" | "Medium" | "Hard";
  prompt: string;
}

export interface InterviewQuestion {
  question: string;
  answer: string;
}

export interface Topic {
  id: string;
  title: string;
  level: TopicLevel;
  /** One-line summary used in topic lists and search. */
  description: string;
  /** Section: What is it? Plain language, assumes no prior knowledge. */
  explanation: string;
  /** Section: Explain Like I'm 10 — a short real-world analogy. */
  analogy: string;
  /** Section: Simple, beginner-friendly code example(s). */
  examples: CodeExample[];
  /** Section: How It Works — internals, optionally with a text diagram. */
  howItWorks: string;
  /** Optional plain-text diagram rendered in a monospace block. */
  diagram?: string;
  /** Section: Why Does This Exist? */
  whyItExists: string;
  /** Section: When developers actually reach for this. */
  whenToUse: string;
  /** Section: When this is the wrong tool, and what to use instead. */
  whenNotToUse: string;
  /** Section: Common beginner mistakes. */
  commonMistakes: string[];
  /** Section: Practice exercises. */
  exercises: Exercise[];
  /** Section: Interview questions, shown collapsed. */
  interviewQuestions: InterviewQuestion[];
  /**
   * What a reader should already understand before this topic (topic ids,
   * resolved within the same subject). Shown near the top of the page.
   * Omit or leave empty for a subject's true starting topics.
   */
  prerequisites?: string[];
  /** Section: Related topic ids (within the same subject unless prefixed). */
  relatedTopics: string[];
  /** Extra searchable keywords beyond the title/description. */
  keywords?: string[];
}

export interface Subject {
  id: SubjectId;
  title: string;
  description: string;
  topics: Topic[];
}
