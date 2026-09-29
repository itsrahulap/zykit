// Which sections a case study has, in page order. Drives both the headings and the TOC.

import type { CaseStudy } from '../../types/caseStudy';

export interface CaseStudySection {
  id: string;
  label: string;
}

export function caseStudySections(cs: CaseStudy, hasRelatedTopics = (cs.relatedTopics?.length ?? 0) > 0): CaseStudySection[] {
  const all: [string, string, boolean][] = [
    ['problem', 'The problem', Boolean(cs.problemStatement)],
    ['requirements', 'Requirements', cs.requirements.functional.length + cs.requirements.nonFunctional.length > 0],
    ['capacity', 'Capacity estimation', cs.capacityEstimation.length > 0 || Boolean(cs.capacityNotes)],
    ['api', 'API design', (cs.apiDesign?.length ?? 0) > 0],
    ['data-model', 'Data model', Boolean(cs.dataModel)],
    ['high-level-design', 'High-level design', Boolean(cs.highLevelDesign || cs.highLevelDiagram)],
    ['deep-dives', 'Deep dives', cs.deepDives.length > 0],
    ['scaling', 'Bottlenecks & scaling', Boolean(cs.bottlenecksAndScaling)],
    ['trade-offs', 'Trade-offs', cs.tradeOffs.length > 0],
    ['interview-tips', 'Interview tips', (cs.interviewTips?.length ?? 0) > 0],
    ['related', 'Related concepts', hasRelatedTopics],
  ];
  return all.filter(([, , present]) => present).map(([id, label]) => ({ id, label }));
}

/** HTTP method → badge tone. */
export function methodTone(method: string): 'green' | 'blue' | 'amber' | 'red' | 'violet' | 'neutral' {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'blue';
    case 'POST':
      return 'green';
    case 'PUT':
    case 'PATCH':
      return 'amber';
    case 'DELETE':
      return 'red';
    case 'WS':
    case 'WEBSOCKET':
      return 'violet';
    default:
      return 'neutral';
  }
}
