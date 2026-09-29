// Placeholder — the Topic-page builder replaces this with the real component (code, runnable
// playground, explanation and walkthrough). Keep this exact API.
import type { CodeExample } from '../types/content';
import type { ProblemExample } from '../types/problem';
import { CodeBlock } from '../../shared/ui/tool';

export interface CodeExampleBlockProps {
  example: CodeExample;
  /** For DSA problem solutions: examples to auto-run against the solution's function. */
  testCases?: ProblemExample[];
}

export function CodeExampleBlock({ example }: CodeExampleBlockProps) {
  return <CodeBlock>{example.code}</CodeBlock>;
}
