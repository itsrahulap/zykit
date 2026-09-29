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
import uuidGenerator from './uuid-generator';
import timestampConverter from './timestamp-converter';
import regexTester from './regex-tester';
import urlParser from './url-parser';
import httpStatus from './http-status';
import mimeLookup from './mime-lookup';
import passwordGenerator from './password-generator';
import randomString from './random-string';
import slugGenerator from './slug-generator';
import caseConverter from './case-converter';
import wordCounter from './word-counter';
import type { ToolDefinition } from './types';

export const TOOLS: ToolDefinition[] = [
  cleanImage,
  jwtDecoder,
  diffChecker,
  jsRunner,
  jsonFormatter,
  encodeDecode,
  hashGenerator,
  uuidGenerator,
  timestampConverter,
  regexTester,
  urlParser,
  httpStatus,
  mimeLookup,
  passwordGenerator,
  randomString,
  slugGenerator,
  caseConverter,
  wordCounter,
];

export const toolPath = (tool: Pick<ToolDefinition, 'id'>) => `/tools/${tool.id}`;

export const getTool = (id: string) => TOOLS.find((t) => t.id === id);
