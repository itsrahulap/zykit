import type { Exam } from '../types';

// Format and domain weights from the CLF-C02 exam guide.
export const awsCloudPractitioner: Exam = {
  id: 'aws-cloud-practitioner',
  title: 'AWS Certified Cloud Practitioner',
  code: 'CLF-C02',
  description:
    'Free AWS Certified Cloud Practitioner (CLF-C02) practice exam: questions with explanations, timed 65-question mock tests and practice by domain, updated for 2026 AWS changes.',
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
    'Two question types: multiple choice (one correct out of four) and multiple response (two or more correct out of five or more).',
    'Scored from 100 to 1,000; you need **700** to pass. Unanswered questions count as wrong, so never leave one blank.',
    'Mock tests here use the same format and domain weights, and pass at 70% correct as a rough match for 700.',
    'Questions here use the Support plans AWS introduced in December 2025 and explain the older names, which the exam may still use.',
  ],
  updates: [
    '**Support plans** changed in December 2025: Basic, Business Support+, Enterprise Support and Unified Operations. Developer and Business Support closed to new customers and Enterprise On-Ramp is being retired. Older questions may still use the old names.',
    'Changing your **Support plan** no longer requires the root user; an IAM user with the right permissions can do it.',
    '**AWS KMS** now uses FIPS 140-3 **Level 3** validated HSMs, so "KMS is Level 2, CloudHSM is Level 3" is outdated. CloudHSM’s real difference is single-tenant HSMs you control.',
    '**Amazon S3** objects can now be up to **50 TB** (previously 5 TB).',
    'The original **Security Hub** is now **AWS Security Hub CSPM**; a new AWS Security Hub correlates findings from CSPM, GuardDuty, Inspector and Macie.',
    'New accounts since July 15, 2025 get **Free Tier credits** on a Free or Paid plan instead of the old 12-month free tier.',
    '**Retired or closed to new customers:** Snowball Edge (use DataSync or AWS Data Transfer Terminal), AWS IQ, Cloud9, CodeCommit and QLDB.',
    '**Renamed:** QuickSight → Amazon Quick, CodeWhisperer → Amazon Q Developer, CloudEndure → AWS Elastic Disaster Recovery, Elasticsearch Service → OpenSearch Service.',
  ],
};
