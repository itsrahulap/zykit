import type { Subject, SubjectId, Topic } from "../types/content";
import { javascriptSubject } from "./javascript";
import { typescriptSubject } from "./typescript";
import { dsaSubject } from "./dsa";
import { webFundamentalsSubject } from "./web-fundamentals";
import { backendSubject } from "./backend";
import { databasesSubject } from "./databases";
import { systemDesignSubject } from "./system-design";
import { softwareArchitectureSubject } from "./software-architecture";

export const subjects: Subject[] = [
  javascriptSubject,
  typescriptSubject,
  dsaSubject,
  webFundamentalsSubject,
  backendSubject,
  databasesSubject,
  systemDesignSubject,
  softwareArchitectureSubject,
];

const subjectsById: Record<SubjectId, Subject> = {
  javascript: javascriptSubject,
  typescript: typescriptSubject,
  dsa: dsaSubject,
  "web-fundamentals": webFundamentalsSubject,
  backend: backendSubject,
  databases: databasesSubject,
  "system-design": systemDesignSubject,
  "software-architecture": softwareArchitectureSubject,
};

export function getSubject(id: string): Subject | undefined {
  return subjectsById[id as SubjectId];
}

export function getTopic(subjectId: string, topicId: string): Topic | undefined {
  return getSubject(subjectId)?.topics.find((t) => t.id === topicId);
}

/** Find a topic across all subjects by id (used for related-topics links). */
export function findTopicAnywhere(
  topicId: string,
): { subject: Subject; topic: Topic } | undefined {
  for (const subject of subjects) {
    const topic = subject.topics.find((t) => t.id === topicId);
    if (topic) return { subject, topic };
  }
  return undefined;
}

/**
 * The topic immediately before/after the given one within its subject,
 * following the same beginner -> intermediate -> advanced order used by
 * TopicList. Used to power "Previous topic" / "Next topic" navigation on
 * the Topic page. Either end is undefined at the start/end of the list.
 */
export function getAdjacentTopics(
  subjectId: string,
  topicId: string,
): { prev?: Topic; next?: Topic } {
  const subject = getSubject(subjectId);
  if (!subject) return {};

  const index = subject.topics.findIndex((t) => t.id === topicId);
  if (index === -1) return {};

  return {
    prev: subject.topics[index - 1],
    next: subject.topics[index + 1],
  };
}

export {
  javascriptSubject,
  typescriptSubject,
  dsaSubject,
  webFundamentalsSubject,
  backendSubject,
  databasesSubject,
  systemDesignSubject,
  softwareArchitectureSubject,
};
