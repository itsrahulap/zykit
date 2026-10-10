// The CLF-C02 question bank, loaded lazily by the exam page (it's large).
import type { ExamQuestion } from '../types';
import { billingSupportQuestions } from './questions/billing-support';
import { cloudConceptsQuestions } from './questions/cloud-concepts';
import { securityComplianceQuestions } from './questions/security-compliance';
import { technologyCoreQuestions } from './questions/technology-core';
import { technologyMoreQuestions } from './questions/technology-more';

export const questions: ExamQuestion[] = [
  ...cloudConceptsQuestions,
  ...securityComplianceQuestions,
  ...technologyCoreQuestions,
  ...technologyMoreQuestions,
  ...billingSupportQuestions,
];
