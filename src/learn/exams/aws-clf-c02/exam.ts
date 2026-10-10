import type { Exam } from '../types';

// Format and domain weights from the CLF-C02 exam guide.
export const awsCloudPractitioner: Exam = {
  id: 'aws-cloud-practitioner',
  title: 'AWS Certified Cloud Practitioner',
  code: 'CLF-C02',
  description:
    'Practice questions and full-length mock tests for the AWS Certified Cloud Practitioner exam, with an explanation for every answer.',
  domains: [
    { id: 'cloud-concepts', title: 'Cloud Concepts', weight: 0.24 },
    { id: 'security-compliance', title: 'Security and Compliance', weight: 0.3 },
    { id: 'technology-services', title: 'Cloud Technology and Services', weight: 0.34 },
    { id: 'billing-support', title: 'Billing, Pricing, and Support', weight: 0.12 },
  ],
  questionCount: 65,
  minutes: 90,
  passRatio: 0.7,
  facts: [
    '65 questions in 90 minutes: 50 are scored and 15 are unscored, and you can’t tell which.',
    'Two question types: multiple choice (one correct answer out of four) and multiple response (two or more correct out of five or more).',
    'Scored from 100 to 1,000; you need **700** to pass. Unanswered questions count as wrong, so never leave one blank.',
    'Mock tests here use the same format and domain weights, and pass at 70% correct as a rough match for 700.',
    'AWS changed its Support plans in December 2025 (now Basic, Business Support+, Enterprise Support and Unified Operations). Questions here use the current plans and explain the older names, which the exam may still use.',
  ],
};
