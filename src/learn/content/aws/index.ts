import type { Subject } from "../../types/content";
import { awsBeginnerTopics } from "./beginner";
import { awsIntermediateTopics } from "./intermediate";
import { awsAdvancedTopics } from "./advanced";

export const awsSubject: Subject = {
  id: "aws",
  title: "AWS Cloud",
  description: "Cloud fundamentals and the core Amazon Web Services, from first principles to the AWS Certified Cloud Practitioner (CLF-C02) exam.",
  topics: [...awsBeginnerTopics, ...awsIntermediateTopics, ...awsAdvancedTopics],
};
