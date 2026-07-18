#!/usr/bin/env node
/**
 * External concept seed: the dice half of new-work's coupled-direction and
 * established-world surface procedures.
 *
 * The model derives a grounded shortlist of candidate FORMS from the
 * audience's world and the subject's cultural home (see
 * reference/new-work.md). Left alone, it then always builds its #1 —
 * and a single model's resonance ranking is deterministic, so every run
 * in a category ships the same one or two concepts. Measured: 30/35
 * identical concepts across 16 prompt framings; the model cannot roll
 * its own dice.
 *
 * This script rolls them from outside, the same trick that made the
 * palette seed work:
 *   - PROMOTED INDEX: which entry of the model's own resonance-ordered
 *     shortlist must be taken seriously beside its favorites. The dice never
 *     choose an ungrounded ingredient; they only refuse the argmax rut.
 *   - CHALLENGERS (3): outside forms from concept-ingredients.json, weighed
 *     against the derived candidates on exactly two axes — audience
 *     identification and product clarity. They win only when they beat the
 *     grounded list; measured behavior is that they lose to strong cultural
 *     material and win over thin categories, which is the intended shape.
 *
 * Usage:
 *   node scripts/concept-seed.mjs --scope direction
 *   node scripts/concept-seed.mjs --scope surface --from <key>
 *
 * Env vars:
 *   IMPECCABLE_CONCEPT_SEED — same as --from; for reproducible eval runs.
 */

import crypto from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  approvedPoolRevision,
  deterministicRank,
  readConceptCatalog,
} from './lib/concept-catalog.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const { concepts } = readConceptCatalog(
  join(here, 'concept-ingredients.json'),
  join(here, 'concept-reviews.json')
);

export function selectApprovedChallengers({ scope, key, sourceConcepts = concepts }) {
  const approved = sourceConcepts.filter(concept => concept.status === 'approved');
  const approvedByFamily = new Map();
  for (const concept of approved) {
    const family = approvedByFamily.get(concept.familyId) || [];
    family.push(concept);
    approvedByFamily.set(concept.familyId, family);
  }
  if (approvedByFamily.size < 3) {
    throw new Error('concept-seed: at least three families need approved concepts');
  }
  const familyIds = deterministicRank(
    [...approvedByFamily.keys()].map(id => ({ id })),
    `${scope}:${key}:families`
  ).slice(0, 3).map(item => item.id);
  const picks = familyIds.map((familyId, index) => deterministicRank(
    approvedByFamily.get(familyId),
    `${scope}:${key}:challenger-${index}`
  )[0]);
  return {
    approved,
    picks,
    poolRevision: approvedPoolRevision(sourceConcepts),
  };
}

export function renderConceptSeed({
  scope = 'surface',
  key = process.env.IMPECCABLE_CONCEPT_SEED || crypto.randomBytes(4).toString('hex'),
} = {}) {
  if (scope !== 'surface' && scope !== 'direction') {
    throw new Error('concept-seed: --scope must be direction or surface');
  }
  const unit = (salt) => {
    const h = crypto.createHash('sha256').update(`${scope}:${salt}:${key}`).digest();
    return h.readUInt32BE(0) / 0xffffffff;
  };
  const buildIndex = 3 + Math.floor(unit('index') * 5); // 3..7
  const { approved, picks, poolRevision } = selectApprovedChallengers({ scope, key });

  const promotedInstruction = scope === 'direction'
    ? `After ordering the grounded coupled directions by product fit, promote
  candidate ${buildIndex} into the serious shortlist. Each candidate must join
  a durable visual system to a concrete expression for the requested first
  surface; select or revise that pair as one decision. It must survive the
  current task plus navigation, quiet and dense content, interaction and state,
  and a substantially different future surface.`
  : `After ordering the task's grounded structural candidates by resonance,
  promote candidate ${buildIndex} into the serious shortlist. In an attended
  run, present it beside the strongest materially different candidates and
  let the user select or revise the surface concept. In a truly unattended
  run, use it when it survives audience identification and product clarity.`;

  const challengerInstruction = scope === 'direction'
    ? `Translate each challenger's organizing logic into reusable identity grammar
  and a strong first-surface structure before judging it. Noticeable form is
  allowed when the product stays clear. Compare only audience identification
  and product clarity.`
  : `A challenger wins only when it beats the grounded list on both audience
  identification and product clarity. It may change task topology or
  interaction, but never the committed visual identity.`;

  const authorityInstruction = scope === 'direction'
    ? `PRODUCT.md and explicit incumbent brand commitments constrain every coupled
direction. The seed never chooses exact colors, fonts, tokens, or a user
preference, and it never permits the world and first surface to be selected
independently.`
  : `PRODUCT.md and DESIGN.md constrain every surface candidate's identity
vocabulary; they do not cancel task-level composition. The seed never
authorizes a new palette, type system, material world, or unfamiliar control
behavior.`;

  return `${scope.toUpperCase()} CONCEPT SEED (key: ${key}; approved pool: ${poolRevision}; ${approved.length}/${concepts.length} human-approved; rerun with --scope ${scope} --from ${key} to reproduce this roll against this catalog revision)
PROMOTED INDEX: ${buildIndex}
  ${promotedInstruction}
  The promotion exists to refuse the model's ranking rut, not to outrank the
  user or the brief. Never expose promotion metadata in choice labels or order.
CHALLENGERS:
  1. ${picks[0].form}
  2. ${picks[1].form}
  3. ${picks[2].form}
${challengerInstruction}
${authorityInstruction}
A user- or brief-pinned decision beats the roll, always.
`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const fromIdx = args.indexOf('--from');
  const scopeIdx = args.indexOf('--scope');
  try {
    process.stdout.write(renderConceptSeed({
      scope: scopeIdx !== -1 ? args[scopeIdx + 1] : 'surface',
      key: fromIdx !== -1
        ? args[fromIdx + 1]
        : (process.env.IMPECCABLE_CONCEPT_SEED || crypto.randomBytes(4).toString('hex')),
    }));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
