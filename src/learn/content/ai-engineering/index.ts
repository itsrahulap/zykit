import type { Subject } from "../../types/content";
import { aiBeginnerTopics } from "./beginner";
import { aiRagTopics } from "./rag";
import { aiAgentTopics } from "./agents";
import { aiAdvancedTopics } from "./advanced";

export const aiEngineeringSubject: Subject = {
  id: "ai-engineering",
  title: "AI Engineering: LLMs, RAG and Agents",
  description:
    "From zero to production: how large language models work, prompting, embeddings, building complete RAG pipelines, and building AI agents from scratch.",
  topics: [...aiBeginnerTopics, ...aiRagTopics, ...aiAgentTopics, ...aiAdvancedTopics],
};
