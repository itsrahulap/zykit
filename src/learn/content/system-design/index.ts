import type { Subject } from "../../types/content";
import { systemDesignFundamentalsTopics } from "./fundamentals";
import { systemDesignIntermediateTopics } from "./intermediate";
import { systemDesignAdvancedTopics } from "./advanced";

export const systemDesignSubject: Subject = {
  id: "system-design",
  title: "System Design",
  description: "Understand how real-world software systems are designed.",
  topics: [
    ...systemDesignFundamentalsTopics,
    ...systemDesignIntermediateTopics,
    ...systemDesignAdvancedTopics,
  ],
};
