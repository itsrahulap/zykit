// Types for the System Design "Real System Designs" bank — full worked
// design walkthroughs (URL Shortener, Instagram, YouTube, ...), distinct
// from the concept-teaching Topic model in content.ts. A Topic teaches one
// idea (e.g. "sharding"); a CaseStudy combines many ideas into a full
// design for one real product, the way a system design interview would.

export type CaseStudyDifficulty = "Easy" | "Medium" | "Hard";

export interface CaseStudyRequirements {
  /** What the system must do, from a user's point of view. */
  functional: string[];
  /** Qualities the system must have: scale, latency, availability, consistency, etc. */
  nonFunctional: string[];
}

/** One back-of-the-envelope number, with the reasoning that produced it. */
export interface CapacityEstimate {
  /** e.g. "Daily active users", "Writes per second", "Storage per year". */
  label: string;
  value: string;
  /** How this number was derived, in plain language. */
  note?: string;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
}

/** One tricky sub-problem, pulled out of the high-level design for a closer look. */
export interface DeepDive {
  title: string;
  /** RichText-compatible markup: blank line = paragraph, "- " lines = bullets, bold/code/italic inline markup supported. */
  explanation: string;
  /** Optional plain-text diagram rendered in a monospace block. */
  diagram?: string;
}

/** One design decision, the option chosen, and why — including what was given up. */
export interface TradeOff {
  /** e.g. "SQL vs NoSQL for the URL mapping table". */
  decision: string;
  /** RichText markup: state the options, the choice, and the reasoning. */
  explanation: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  difficulty: CaseStudyDifficulty;
  /** One-sentence summary shown on the case studies list page. */
  summary: string;
  /** RichText markup: what we're designing and what makes it non-trivial. */
  problemStatement: string;
  requirements: CaseStudyRequirements;
  capacityEstimation: CapacityEstimate[];
  /** RichText paragraph tying the capacity numbers together into a conclusion. */
  capacityNotes?: string;
  apiDesign?: ApiEndpoint[];
  /** RichText markup describing the core tables/documents and their fields. */
  dataModel?: string;
  /** RichText markup: the high-level architecture narrative. */
  highLevelDesign: string;
  /** Optional plain-text diagram of the high-level architecture. */
  highLevelDiagram?: string;
  /** At least 3-4 close looks at the hardest parts of the design. */
  deepDives: DeepDive[];
  /** RichText markup: where this design breaks first, and how it scales further. */
  bottlenecksAndScaling: string;
  /** At least 2-3 explicit decision points with reasoning. */
  tradeOffs: TradeOff[];
  /** Short, concrete things to raise if asked this in an interview. */
  interviewTips?: string[];
  /** Related System Design topic ids (resolved against the system-design subject). */
  relatedTopics?: string[];
  keywords?: string[];
}
