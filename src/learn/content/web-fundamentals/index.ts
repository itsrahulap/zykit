import type { Subject } from "../../types/content";
import { webFundamentalsBeginnerTopics } from "./beginner";
import { webFundamentalsIntermediateTopics } from "./intermediate";
import { webFundamentalsAdvancedTopics } from "./advanced";

export const webFundamentalsSubject: Subject = {
  id: "web-fundamentals",
  title: "Web Fundamentals",
  description: "How browsers, HTML, CSS, and the web platform actually work.",
  topics: [
    ...webFundamentalsBeginnerTopics,
    ...webFundamentalsIntermediateTopics,
    ...webFundamentalsAdvancedTopics,
  ],
};
