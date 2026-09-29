import type { CaseStudy } from "../../types/caseStudy";
import { urlShortenerCaseStudy } from "./url-shortener";
import { instagramCaseStudy } from "./instagram";
import { youtubeCaseStudy } from "./youtube";
import { netflixCaseStudy } from "./netflix";
import { whatsappCaseStudy } from "./whatsapp";
import { uberCaseStudy } from "./uber";
import { twitterCaseStudy } from "./twitter";
import { googleDriveCaseStudy } from "./google-drive";
import { ecommerceCaseStudy } from "./ecommerce";

/** All "Real System Designs" case studies, roughly simplest -> most involved. */
export const caseStudies: CaseStudy[] = [
  urlShortenerCaseStudy,
  instagramCaseStudy,
  twitterCaseStudy,
  whatsappCaseStudy,
  uberCaseStudy,
  youtubeCaseStudy,
  googleDriveCaseStudy,
  ecommerceCaseStudy,
  netflixCaseStudy,
];

export function getCaseStudy(id: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.id === id);
}

/** Case studies that reference a given System Design topic id, for cross-linking. */
export function getCaseStudiesForTopic(topicId: string): CaseStudy[] {
  return caseStudies.filter((c) => c.relatedTopics?.includes(topicId));
}
