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
import imageCompressor from './image-compressor';
import imageResizer from './image-resizer';
import imageConverter from './image-converter';
import imageBase64 from './image-base64';
import svgOptimizer from './svg-optimizer';
import faviconGenerator from './favicon-generator';
import colorConverter from './color-converter';
import numberBaseConverter from './number-base-converter';
import ipCidrCalculator from './ip-cidr-calculator';
import jsonpathQuery from './jsonpath-query';
import jsonSchema from './json-schema';
import semverChecker from './semver-checker';
import chmodCalculator from './chmod-calculator';
import envDiff from './env-diff';
import totpGenerator from './totp-generator';
import stringEscaper from './string-escaper';
import unicodeInspector from './unicode-inspector';
import mockDataGenerator from './mock-data-generator';
import qrCodeGenerator from './qr-code-generator';
import loremIpsum from './lorem-ipsum';
import dateCalculator from './date-calculator';
import unitConverter from './unit-converter';
import csvSql from './csv-sql';
import pdfTools from './pdf-tools';
import pdfMetadataCleaner from './pdf-metadata-cleaner';
import officeMetadataCleaner from './office-metadata-cleaner';
import imagesToPdf from './images-to-pdf';
import imageEditor from './image-editor';
import textEncryption from './text-encryption';
import sshKeyGenerator from './ssh-key-generator';
import emailHeaderAnalyzer from './email-header-analyzer';
import jsonToCode from './json-to-code';
import dockerComposeConverter from './docker-compose-converter';
import colorPaletteExtractor from './color-palette-extractor';
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
  imageCompressor,
  imageResizer,
  imageConverter,
  imageBase64,
  svgOptimizer,
  faviconGenerator,
  colorConverter,
  numberBaseConverter,
  ipCidrCalculator,
  jsonpathQuery,
  jsonSchema,
  semverChecker,
  chmodCalculator,
  envDiff,
  totpGenerator,
  stringEscaper,
  unicodeInspector,
  mockDataGenerator,
  qrCodeGenerator,
  loremIpsum,
  dateCalculator,
  unitConverter,
  csvSql,
  pdfTools,
  pdfMetadataCleaner,
  officeMetadataCleaner,
  imagesToPdf,
  imageEditor,
  textEncryption,
  sshKeyGenerator,
  emailHeaderAnalyzer,
  jsonToCode,
  dockerComposeConverter,
  colorPaletteExtractor,
];

export const toolPath = (tool: Pick<ToolDefinition, 'id'>) => `/tools/${tool.id}`;

export const getTool = (id: string) => TOOLS.find((t) => t.id === id);

/** Display order of categories (home page, footer, README). Unknown categories go last, alphabetically. */
export const CATEGORY_ORDER = ['Images', 'Data', 'Code', 'Converters', 'Network & HTTP', 'DevOps & Config', 'Security', 'Text', 'Web', 'Documents'];

export function toolCategories(tools: Pick<ToolDefinition, 'category'>[] = TOOLS): string[] {
  const rank = (c: string) => (CATEGORY_ORDER.includes(c) ? CATEGORY_ORDER.indexOf(c) : CATEGORY_ORDER.length);
  return [...new Set(tools.map((t) => t.category))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
