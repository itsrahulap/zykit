import type { Subject } from "../../types/content";
import { typescriptBeginnerTopics } from "./beginner";
import { typescriptIntermediateTopics } from "./intermediate";
import { typescriptAdvancedTopics } from "./advanced";

export const typescriptSubject: Subject = {
  id: "typescript",
  title: "TypeScript",
  description: "From basic types to advanced generics and utility types.",
  topics: [
    ...typescriptBeginnerTopics,
    ...typescriptIntermediateTopics,
    ...typescriptAdvancedTopics,
  ],
};
