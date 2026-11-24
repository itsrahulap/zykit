import type { Subject } from "../../types/content";
import { systemDesignFundamentalsTopics } from "./fundamentals";
import { systemDesignFoundationsTopics } from "./foundations";
import { systemDesignIntermediateTopics } from "./intermediate";
import { systemDesignIntermediatePatternsTopics } from "./intermediate-patterns";
import { systemDesignDataSyncTopics } from "./data-sync";
import { systemDesignAdvancedTopics } from "./advanced";
import { systemDesignDistributedTopics } from "./distributed-systems";
import { systemDesignProductionTopics } from "./production-scale";

export const systemDesignSubject: Subject = {
  id: "system-design",
  title: "System Design",
  description: "Design real-world systems, from networking and DNS basics to consensus, streaming and multi-region architecture.",
  topics: [
    ...systemDesignFundamentalsTopics,
    ...systemDesignFoundationsTopics,
    ...systemDesignIntermediateTopics,
    ...systemDesignIntermediatePatternsTopics,
    ...systemDesignDataSyncTopics,
    ...systemDesignAdvancedTopics,
    ...systemDesignDistributedTopics,
    ...systemDesignProductionTopics,
  ],
};
