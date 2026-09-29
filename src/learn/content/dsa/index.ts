import type { Subject } from "../../types/content";
import { dsaBeginnerTopics } from "./beginner";
import { dsaIntermediateTopics } from "./intermediate";
import { dsaAdvancedTopics } from "./advanced";

export const dsaSubject: Subject = {
  id: "dsa",
  title: "DSA",
  description: "Data structures and algorithms using JavaScript.",
  topics: [
    ...dsaBeginnerTopics,
    ...dsaIntermediateTopics,
    ...dsaAdvancedTopics,
  ],
};
