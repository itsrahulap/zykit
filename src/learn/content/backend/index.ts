import type { Subject } from "../../types/content";
import { backendBeginnerTopics } from "./beginner";
import { backendIntermediateTopics } from "./intermediate";
import { backendAdvancedTopics } from "./advanced";

export const backendSubject: Subject = {
  id: "backend",
  title: "Backend",
  description: "Building the server side of an application: routing, middleware, APIs, and deployment.",
  topics: [
    ...backendBeginnerTopics,
    ...backendIntermediateTopics,
    ...backendAdvancedTopics,
  ],
};
