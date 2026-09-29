// Deterministic classification of metadata fields.
// Classification is labelling, not detection: "Software = Photoshop" is
// generator-related, but it says nothing about whether an image is AI-generated.

import type { MetadataCategory, ProvenanceSignal, RawEntry } from './metadata.types';

export interface Classification {
  sensitive: boolean;
  generatorRelated: boolean;
  provenanceRelated: boolean;
}

const localName = (key: string) => key.slice(key.lastIndexOf(':') + 1);

const PRIVACY_KEY =
  /gps|latitude|longitude|altitude|location|^city$|country|province|state$|sub-?location|^make$|^model$|lens(make|model|serial)|serial|owner|^artist$|author|by-?line|^creator$|writer|contact|copyright|rights|usageterms|date|time|uniqueid|documentid|instanceid|hostcomputer|thumbnail|^xp(title|comment|author|keywords|subject)$|^(person|personinimage)|email|phone|address/i;

const GENERATOR_KEY =
  /^(software|creatortool|processingsoftware|originatingprogram|programversion|softwareagent|generator|parameters|prompt|negative_?prompt|workflow|sd-metadata|invokeai_metadata|invokeai_graph|dream|generation_data|aigc|claim_generator|xmptk|digitalsourcetype|ai_generated)$/i;

const PROVENANCE_KEY = /digitalsourcetype|history|derivedfrom|provenance|ingredients|documentid|instanceid|claim_generator|manifest/i;

/** Values that name well-known generative tools or generation parameters. */
export const AI_VALUE_PATTERN =
  /stable[\s_-]?diffusion|\bsdxl\b|midjourney|dall[\s·-]?e|\bopenai\b|chatgpt|gpt-image|firefly|\bimagen\b|gemini|comfyui|automatic1111|\ba1111\b|invokeai|novelai|leonardo\.?ai|ideogram|\bflux(\.1)?\b|runway(ml)?|dreamstudio|generative\s+(fill|expand|ai)|ai[\s-]generated|made with google ai|imagined with ai|\bmeta ai\b|edited with ai|created with ai|\bsynthid\b|nano[\s-]?banana|\bgrok\b|\bkling\b|hailuo|seedream|\bqwen[\s-]?image|playground\s?v\d|\bjob id:|trainedalgorithmicmedia|negative prompt|cfg scale|sampler:|\bsteps:\s*\d+/i;

export function classify(category: MetadataCategory, key: string, value: string): Classification {
  const name = localName(key);
  const aiValue = AI_VALUE_PATTERN.test(value);
  return {
    sensitive: PRIVACY_KEY.test(name),
    generatorRelated: GENERATOR_KEY.test(name) || aiValue,
    provenanceRelated: category === 'C2PA' || PROVENANCE_KEY.test(name),
  };
}

const DIGITAL_SOURCE_LABELS: Record<string, string> = {
  trainedAlgorithmicMedia: 'created by a trained AI model',
  compositeWithTrainedAlgorithmicMedia: 'a composite that includes AI-generated elements',
  algorithmicMedia: 'created algorithmically (not by a trained model)',
  compositeSynthetic: 'a composite of synthetic elements',
  digitalCapture: 'a digital capture (camera)',
  digitalArt: 'digital art made by a person',
  composite: 'a composite image',
};

/** Builds user-facing observations. Only explicit, standardized declarations are "declared". */
export function buildSignals(
  entries: RawEntry[],
  c2pa: { generator?: string; declaresAi: boolean } | undefined,
  hasC2paBlock: boolean,
): ProvenanceSignal[] {
  const signals: ProvenanceSignal[] = [];

  for (const e of entries) {
    if (localName(e.key).toLowerCase() !== 'digitalsourcetype') continue;
    const code = e.value.split('/').pop() ?? e.value;
    const label = DIGITAL_SOURCE_LABELS[code];
    if (label) {
      signals.push({
        level: code.includes('TrainedAlgorithmic') || code === 'trainedAlgorithmicMedia' ? 'declared' : 'present',
        title: 'Digital source type declared',
        detail: `The file states it is ${label} (IPTC "${code}"). This is a self-declared field and is not cryptographically verified.`,
      });
    }
  }

  if (hasC2paBlock) {
    signals.push({
      level: c2pa?.declaresAi ? 'declared' : 'present',
      title: 'Content Credentials (C2PA) present',
      detail: [
        c2pa?.generator ? `Claim generator: ${c2pa.generator}.` : null,
        c2pa?.declaresAi ? 'The manifest references AI-generated content.' : null,
        'Signatures are not verified by this app.',
      ]
        .filter(Boolean)
        .join(' '),
    });
  }

  const label = entries.find((e) => /made with google ai|imagined with ai|created with ai|edited with ai|ai[\s-]generated/i.test(e.value));
  if (label) {
    signals.push({
      level: 'declared',
      title: 'AI disclosure label found',
      detail: `The ${label.key} field reads "${label.value.slice(0, 120)}". Generators write labels like this to disclose AI use; they are self-declared and not verified.`,
    });
  }

  const genParams = entries.find(
    (e) => e.category === 'PNG_TEXT' && /^(parameters|prompt|workflow|sd-metadata|invokeai_metadata|dream)$/i.test(e.key),
  );
  if (genParams) {
    signals.push({
      level: 'hint',
      title: 'Image-generation parameters found',
      detail: `A PNG text field named "${genParams.key}" is commonly written by image-generation tools.`,
    });
  }

  const tools = new Set<string>();
  for (const e of entries) {
    const name = localName(e.key).toLowerCase();
    if (['software', 'creatortool', 'softwareagent', 'originatingprogram'].includes(name)) tools.add(e.value.slice(0, 120));
  }
  if (tools.size) {
    signals.push({
      level: 'hint',
      title: 'Generator-related fields detected',
      detail: `Software recorded in the file: ${[...tools].slice(0, 5).join(', ')}. This names the tool that wrote the file; it is not evidence of AI generation.`,
    });
  }

  return signals;
}
