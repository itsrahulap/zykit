// Learn topics ↔ Zykit tools: "Try it in a tool" on lessons and "Learn the concept" on tool
// pages. Keys are "subjectId/topicId" (see catalog.generated.ts); values are tool ids.

export const TOPIC_TOOLS: Record<string, string[]> = {
  'aws/vpc-networking': ['ip-cidr-calculator'],
  'aws/network-security': ['ip-cidr-calculator'],
  'aws/iam-basics': ['json-formatter', 'json-schema'],
  'aws/interacting-with-aws': ['yaml-json', 'curl-converter'],
  'aws/dns-and-cdn': ['http-headers'],
  'aws/block-file-object-storage': ['unit-converter'],
  'aws/migration-and-innovation': ['unit-converter'],
  'aws/monitoring-and-auditing': ['cron-builder'],
  'javascript/json': ['json-formatter', 'json-diff', 'json-to-typescript', 'yaml-json'],
  'javascript/string-methods': ['case-converter', 'find-replace', 'regex-tester', 'slug-generator'],
  'javascript/closures': ['js-runner'],
  'javascript/promises': ['js-runner'],
  'javascript/async-await': ['js-runner'],
  'javascript/event-loop': ['js-runner'],
  'javascript/array-methods': ['js-runner'],
  'javascript/js-gotchas': ['js-runner'],
  'javascript/this': ['js-runner'],
  'javascript/prototypes': ['js-runner'],
  'typescript/interfaces': ['json-to-typescript', 'js-runner'],
  'typescript/type-aliases': ['json-to-typescript', 'js-runner'],
  'typescript/basic-types': ['json-to-typescript', 'js-runner'],
  'typescript/generics': ['js-runner'],
  'dsa/strings': ['js-runner', 'regex-tester'],
  'dsa/hash-tables': ['hash-generator', 'js-runner'],
  'dsa/big-o': ['js-runner'],
  'dsa/sorting': ['js-runner'],
  'dsa/recursion': ['js-runner'],
  'web-fundamentals/how-the-web-works': ['http-headers', 'http-status', 'url-parser', 'curl-converter'],
  'web-fundamentals/cors': ['http-headers', 'curl-converter'],
  'web-fundamentals/web-security-basics': ['jwt-decoder', 'hash-generator', 'password-generator', 'certificate-inspector'],
  'web-fundamentals/html-basics': ['meta-tag-inspector', 'markdown-editor'],
  'web-fundamentals/browser-storage': ['json-formatter', 'uuid-generator'],
  'web-fundamentals/web-performance-basics': ['image-compressor', 'image-converter', 'svg-optimizer', 'image-resizer'],
  'web-fundamentals/progressive-web-apps': ['favicon-generator'],
  'backend/authentication-and-passwords': ['hash-generator', 'password-generator', 'jwt-generator', 'jwt-decoder'],
  'backend/background-jobs': ['cron-builder', 'timestamp-converter'],
  'backend/logging': ['timestamp-converter', 'json-formatter'],
  'backend/env-vars-and-config': ['yaml-json', 'random-string'],
  'backend/request-response-lifecycle': ['http-headers', 'http-status', 'curl-converter'],
  'backend/routing': ['url-parser', 'slug-generator'],
  'backend/validation-and-sanitization': ['regex-tester', 'text-cleaner'],
  'backend/file-uploads': ['mime-lookup', 'clean-image', 'image-compressor'],
  'backend/api-versioning': ['http-headers', 'curl-converter'],
  'databases/basic-sql-queries': ['sql-formatter', 'json-to-sql'],
  'databases/filtering-and-sorting': ['sql-formatter'],
  'databases/joins': ['sql-formatter'],
  'databases/aggregation': ['sql-formatter'],
  'databases/subqueries-and-ctes': ['sql-formatter'],
  'databases/window-functions': ['sql-formatter'],
  'databases/query-optimization': ['sql-formatter'],
  'databases/upsert-and-conflicts': ['json-to-sql', 'sql-formatter'],
  'databases/tables-rows-columns': ['csv-viewer', 'json-to-sql', 'csv-json'],
  'databases/primary-and-foreign-keys': ['uuid-generator', 'json-to-sql'],
  'databases/nosql-data-modeling': ['json-formatter', 'json-diff'],
  'system-design/http': ['http-status', 'http-headers', 'curl-converter', 'url-parser'],
  'system-design/rest-apis': ['curl-converter', 'http-status', 'json-formatter'],
  'system-design/authentication-and-sessions': ['jwt-decoder', 'jwt-generator'],
  'system-design/caching': ['http-headers'],
  'system-design/cdn': ['http-headers'],
  'system-design/rate-limiting': ['http-status', 'http-headers'],
  'system-design/idempotency': ['uuid-generator'],
  'system-design/consistent-hashing': ['hash-generator'],
};

export interface TopicRef {
  subjectId: string;
  topicId: string;
}

const split = (key: string): TopicRef => {
  const i = key.indexOf('/');
  return { subjectId: key.slice(0, i), topicId: key.slice(i + 1) };
};

/** Tool ids to try alongside a lesson. */
export const toolIdsForTopic = (subjectId: string, topicId: string): string[] => TOPIC_TOOLS[`${subjectId}/${topicId}`] ?? [];

/** Lessons that explain the concept behind a tool, in map order. */
export const topicsForTool = (toolId: string): TopicRef[] =>
  Object.entries(TOPIC_TOOLS)
    .filter(([, tools]) => tools.includes(toolId))
    .map(([key]) => split(key));
