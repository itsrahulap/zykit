import type { Subject } from "../../types/content";
import { databasesBeginnerTopics } from "./beginner";
import { databasesIntermediateTopics } from "./intermediate";
import { databasesAdvancedTopics } from "./advanced";

export const databasesSubject: Subject = {
  id: "databases",
  title: "Databases",
  description: "Hands-on database skills: SQL, schema design, indexing, and working with an ORM.",
  topics: [
    ...databasesBeginnerTopics,
    ...databasesIntermediateTopics,
    ...databasesAdvancedTopics,
  ],
};
