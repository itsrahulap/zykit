// The list of tools on the site. To add a tool:
//   1. create src/tools/<tool-id>/ with an index.ts exporting a ToolDefinition
//   2. add it to TOOLS below
// Routing, the home page listing and page titles are derived from this list.

import cleanImage from './clean-image';
import jwtDecoder from './jwt-decoder';
import diffChecker from './diff-checker';
import jsRunner from './js-runner';
import jsonFormatter from './json-formatter';
import encodeDecode from './encode-decode';
import hashGenerator from './hash-generator';
import type { ToolDefinition } from './types';

export const TOOLS: ToolDefinition[] = [
  cleanImage,
  jwtDecoder,
  diffChecker,
  jsRunner,
  jsonFormatter,
  encodeDecode,
  hashGenerator,
];

export const toolPath = (tool: Pick<ToolDefinition, 'id'>) => `/tools/${tool.id}`;

export const getTool = (id: string) => TOOLS.find((t) => t.id === id);
