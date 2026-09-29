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
import jsonToTypescript from './json-to-typescript';
import jsonDiff from './json-diff';
import jsonToSql from './json-to-sql';
import yamlJson from './yaml-json';
import xmlJson from './xml-json';
import csvJson from './csv-json';
import csvViewer from './csv-viewer';
import sqlFormatter from './sql-formatter';
import curlConverter from './curl-converter';
import markdownEditor from './markdown-editor';
import textCleaner from './text-cleaner';
import findReplace from './find-replace';
import cronBuilder from './cron-builder';
import userAgentParser from './user-agent-parser';
import httpHeaders from './http-headers';
import jwtGenerator from './jwt-generator';
import certificateInspector from './certificate-inspector';
import metaTagInspector from './meta-tag-inspector';
import utmBuilder from './utm-builder';
import urlCleaner from './url-cleaner';
import robotsTxtGenerator from './robots-txt-generator';
import sitemapGenerator from './sitemap-generator';
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
  jsonToTypescript,
  jsonDiff,
  jsonToSql,
  yamlJson,
  xmlJson,
  csvJson,
  csvViewer,
  sqlFormatter,
  curlConverter,
  markdownEditor,
  textCleaner,
  findReplace,
  cronBuilder,
  userAgentParser,
  httpHeaders,
  jwtGenerator,
  certificateInspector,
  metaTagInspector,
  utmBuilder,
  urlCleaner,
  robotsTxtGenerator,
  sitemapGenerator,
];

export const toolPath = (tool: Pick<ToolDefinition, 'id'>) => `/tools/${tool.id}`;

export const getTool = (id: string) => TOOLS.find((t) => t.id === id);
