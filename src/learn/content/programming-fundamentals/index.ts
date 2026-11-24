import type { Subject } from "../../types/content";
import { programmingFundamentalsBeginnerTopics } from "./beginner";
import { programmingFundamentalsIntermediateTopics } from "./intermediate";
import { programmingFundamentalsAdvancedTopics } from "./advanced";

export const programmingFundamentalsSubject: Subject = {
  id: "programming-fundamentals",
  title: "Programming Fundamentals",
  description: "The language-agnostic core every developer needs, from binary and variables to memory, concurrency and compilers.",
  topics: [
    ...programmingFundamentalsBeginnerTopics,
    ...programmingFundamentalsIntermediateTopics,
    ...programmingFundamentalsAdvancedTopics,
  ],
};
