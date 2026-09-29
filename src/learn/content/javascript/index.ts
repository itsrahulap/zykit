import type { Subject } from "../../types/content";
import { javascriptBeginnerTopics } from "./beginner";
import { javascriptIntermediateTopics } from "./intermediate";
import { javascriptAdvancedTopics } from "./advanced";

export const javascriptSubject: Subject = {
  id: "javascript",
  title: "JavaScript",
  description: "From absolute beginner to advanced JavaScript.",
  topics: [
    ...javascriptBeginnerTopics,
    ...javascriptIntermediateTopics,
    ...javascriptAdvancedTopics,
  ],
};
