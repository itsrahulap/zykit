import type { Subject } from "../../types/content";
import { softwareArchitectureBeginnerTopics } from "./beginner";
import { softwareArchitectureIntermediateTopics } from "./intermediate";
import { softwareArchitectureAdvancedTopics } from "./advanced";

export const softwareArchitectureSubject: Subject = {
  id: "software-architecture",
  title: "Software Architecture",
  description: "Principles and patterns for structuring a codebase and a system as a whole.",
  topics: [
    ...softwareArchitectureBeginnerTopics,
    ...softwareArchitectureIntermediateTopics,
    ...softwareArchitectureAdvancedTopics,
  ],
};
