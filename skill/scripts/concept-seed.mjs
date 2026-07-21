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
 *   - CHALLENGERS (6): outside forms from concept-ingredients.json, two from
 *     each challenger tier (graphic system, instrument language, atmosphere
 *     world), weighed
 *     against the derived candidates on audience identification, product
 *     clarity, system leverage, and use of the medium. They win only when they beat the
 *     grounded list; measured behavior is that they lose to strong cultural
 *     material and win over thin categories, which is the intended shape.
 *   - RE-ROLL (--reroll <n>): round n of the same base key. The script
 *     recomputes what rounds 0..n-1 drew, excludes all of it, and rolls a
 *     fresh promoted index, challengers, and staging. One base key therefore
 *     reproduces the entire chain of rounds.
 *   - RATINGS: the reviewer's approval ratings weight the challenger draw
 *     (3-star doubles the odds, 1-star sits out); the approved pool itself
 *     is unchanged.
 *
 * Usage:
 *   node scripts/concept-seed.mjs --scope direction --mode persuade
 *   node scripts/concept-seed.mjs --scope surface --mode operate --from <key>
 *   node scripts/concept-seed.mjs --scope direction --mode persuade --from <key> --reroll 1
 *
 * --mode names the requested surface's mode (persuade, operate, read,
 * experience) so the appended staging matches its register of work; omitted,
 * the staging rolls from the full approved pool.
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
  validateConceptCatalog,
  WELL_TIERS,
} from './lib/concept-catalog.mjs';
import { readCompositionCatalog } from './lib/composition-catalog.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const catalogState = readConceptCatalog(
  join(here, 'concept-ingredients.json'),
  join(here, 'concept-reviews.json')
);
const catalogValidation = validateConceptCatalog(catalogState.catalog, catalogState.reviewData);
if (catalogValidation.errors.length > 0) {
  throw new Error(`concept-seed: invalid catalog: ${catalogValidation.errors.join('; ')}`);
}
const { concepts } = catalogState;
const compositionState = readCompositionCatalog(
  join(here, 'composition-ingredients.json'),
  join(here, 'composition-reviews.json')
);
const compositions = compositionState.compositions;

export function renderChallenger(concept, index) {
  const system = concept.system.map(rule => `       - ${rule}`).join('\n');
  return `  ${index + 1}. ${concept.form}
     CREATIVE SPARK: ${concept.spark}
     SYSTEM GRAMMAR:
${system}
     WEB LEVERAGE: ${concept.webLeverage}`;
}

export function renderStaging(composition) {
  const grammar = composition.grammar.map(rule => `       - ${rule}`).join('\n');
  return `  ${composition.form}
     SPARK: ${composition.spark}
     STAGING GRAMMAR:
${grammar}
     WEB LEVERAGE: ${composition.webLeverage}`;
}

// One approved staging from the composition catalog, rolled deterministically.
// Returns null while the composition pool has no approved entry for the
// requested mode. Cross-mode fallback would turn an absent staging into a
// misleading one. A re-roll excludes earlier stagings until the pool runs out.
export function selectApprovedStaging({ scope, key, reroll = 0, mode = null, sourceCompositions = compositions }) {
  let approved = sourceCompositions.filter(composition => composition.status === 'approved');
  if (approved.length === 0) return null;
  if (mode) {
    const matching = approved.filter(composition => composition.surface === mode);
    if (matching.length === 0) return null;
    approved = matching;
  }
  const prior = new Set();
  let pick = deterministicRank(approved, `${scope}:${key}:staging`)[0];
  for (let round = 1; round <= reroll; round += 1) {
    prior.add(pick.id);
    const pool = approved.filter(composition => !prior.has(composition.id));
    pick = deterministicRank(
      pool.length > 0 ? pool : approved,
      `${scope}:${key}:staging:reroll-${round}`
    )[0];
  }
  return pick;
}

export function selectApprovedChallengers({ scope, key, reroll = 0, sourceConcepts = concepts }) {
  const approved = sourceConcepts.filter(concept => concept.status === 'approved');
  // Direction chooses a durable identity, so it draws worlds; surface designs
  // one page inside a committed identity, so it draws stagings. Duals serve
  // both. A tier with no matching-strength approvals falls back to its full
  // approved pool rather than starving the roll.
  const wanted = scope === 'direction'
    ? new Set(['world', 'dual'])
    : new Set(['composition', 'dual']);
  const approvedByTier = new Map();
  for (const concept of approved) {
    const tier = approvedByTier.get(concept.wellTier) || [];
    tier.push(concept);
    approvedByTier.set(concept.wellTier, tier);
  }
  if (WELL_TIERS.some(tier => !(approvedByTier.get(tier) || []).length)) {
    throw new Error('concept-seed: every challenger tier needs at least one approved concept');
  }
  for (const [tier, pool] of approvedByTier) {
    const matching = pool.filter(concept => wanted.has(concept.strength));
    if (matching.length > 0) approvedByTier.set(tier, matching);
  }
  // Two challengers per tier, so every roll carries near-zero-translation
  // graphic systems beside instrument languages and atmosphere worlds, with
  // the second pick preferring a different family for diversity. Tier order
  // in the rendered list is rolled too, to avoid positional bias.
  // Approval ratings weight the draw: a 3-star world earns a second ticket
  // (roughly double odds), a 1-star keeps its approval for direct briefs but
  // leaves the challenger pool unless a tier has nothing else.
  const ticketsFor = pool => pool.flatMap(concept => {
    const rating = concept.review?.rating;
    if (rating === 1) return [];
    return rating === 3
      ? [{ concept, ticket: 0 }, { concept, ticket: 1 }]
      : [{ concept, ticket: 0 }];
  });
  const pickRound = (round, excluded) => {
    const salt = round === 0 ? '' : `:reroll-${round}`;
    const tierOrder = deterministicRank(
      WELL_TIERS.map(id => ({ id })),
      `${scope}:${key}:tiers${salt}`
    ).map(item => item.id);
    return tierOrder.flatMap((tier, index) => {
      let pool = approvedByTier.get(tier).filter(concept => !excluded.has(concept.id));
      // A tier exhausted by prior rounds falls back to reuse over starvation.
      if (pool.length === 0) pool = approvedByTier.get(tier);
      let tickets = ticketsFor(pool);
      if (tickets.length === 0) tickets = pool.map(concept => ({ concept, ticket: 0 }));
      const ranked = deterministicRank(
        tickets,
        `${scope}:${key}:challenger-${index}${salt}`,
        entry => `${entry.concept.id}#${entry.ticket}`
      );
      const order = [];
      const seen = new Set();
      for (const entry of ranked) {
        if (seen.has(entry.concept.id)) continue;
        seen.add(entry.concept.id);
        order.push(entry.concept);
      }
      const first = order[0];
      const second = order.find(concept => concept.familyId !== first.familyId)
        || order.find(concept => concept.id !== first.id);
      return second ? [first, second] : [first];
    });
  };
  // Round n of a re-roll chain excludes everything rounds 0..n-1 drew, so the
  // same base key reproduces the whole chain.
  const excluded = new Set();
  let picks = pickRound(0, excluded);
  for (let round = 1; round <= reroll; round += 1) {
    for (const pick of picks) excluded.add(pick.id);
    picks = pickRound(round, excluded);
  }
  return {
    approved,
    picks,
    poolRevision: approvedPoolRevision(sourceConcepts),
  };
}

const SEED_MODES = new Set(['persuade', 'operate', 'read', 'experience']);

export function renderConceptSeed({
  scope = 'surface',
  key = process.env.IMPECCABLE_CONCEPT_SEED || crypto.randomBytes(4).toString('hex'),
  reroll = 0,
  mode = null,
} = {}) {
  if (scope !== 'surface' && scope !== 'direction') {
    throw new Error('concept-seed: --scope must be direction or surface');
  }
  if (!Number.isInteger(reroll) || reroll < 0) {
    throw new Error('concept-seed: --reroll must be a non-negative integer');
  }
  if (mode !== null && !SEED_MODES.has(mode)) {
    throw new Error('concept-seed: --mode must be persuade, operate, read, or experience');
  }
  const unit = (salt) => {
    const h = crypto.createHash('sha256').update(`${scope}:${salt}:${key}`).digest();
    return h.readUInt32BE(0) / 0xffffffff;
  };
  const indexSalt = reroll === 0 ? 'index' : `index:reroll-${reroll}`;
  const buildIndex = 3 + Math.floor(unit(indexSalt) * 5); // 3..7
  const { approved, picks, poolRevision } = selectApprovedChallengers({ scope, key, reroll });

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
  run, use it when it survives audience identification, product clarity,
  system leverage, and use of the medium.`;

  const challengerInstruction = scope === 'direction'
    ? `Translate each challenger's organizing logic into reusable identity grammar
  and a strong first-surface structure before judging it. Noticeable form is
  allowed when the product stays clear. Compare audience identification,
  product clarity, system leverage, and use of the medium.`
  : `A challenger wins only when it beats the grounded list on audience
  identification, product clarity, system leverage, and use of the medium. It may change task topology or
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

  const richnessInstruction = `The CREATIVE SPARK is a visual world, artifact, or graphic tradition people
would genuinely choose to enter, study, or explore, and whose palette,
materials, type voice, and component grammar a designer could sketch on
sight, not decorative art direction. The challengers are drawn two from each
translation tier: graphic systems that map to interface almost directly,
instrument or display languages that carry interaction physics, and material
or performed worlds that need the largest translation step; judge
each in its own register and pay that translation cost honestly. Translate
its scale, material, spatial or compositional law, tension, rhythm, and
memorable human experience into product structure. Inherit a movement's or
artifact's rules, never just its name: grid, geometry, ornament logic,
material behavior, and information structure become the interface's. Preserve
the spark's imaginative distance: do not collapse a galaxy into a mission
dashboard, a forest into a taxonomy app, or a performance into a control
console. Use Three.js, generative motion, film language, typography, craft,
or another ambitious medium when it materially strengthens the task; keep
semantic structure and graceful fallbacks fully capable.`;

  const staging = selectApprovedStaging({ scope, key, reroll, mode });
  const stagingBlock = staging
    ? `\n${scope === 'direction' ? 'FIRST-SURFACE STAGING (identity-free; pair it with the chosen world and judge the pair as one decision):' : 'STAGING CHALLENGER (identity-free; dress it in the committed visual identity before judging):'}
${renderStaging(staging)}
A staging organizes attention, sequence, and manipulation; it never brings a
palette, typeface, or material. It competes on structure alone and loses to a
grounded structure that fits the product better.\n`
    : '';
  const rerollBlock = reroll > 0
    ? `RE-ROLL ROUND ${reroll}: every candidate presented in earlier rounds, grounded
  and challenger alike, is eliminated and may not return reworded. Derive
  genuinely new grounded candidates from unexplored angles before judging
  these fresh challengers.\n`
    : '';
  return `${scope.toUpperCase()} CONCEPT SEED (key: ${key}; mode: ${mode ?? 'unscoped'}; approved pool: ${poolRevision}; ${approved.length}/${concepts.length} human-approved; rerun with --scope ${scope}${mode ? ` --mode ${mode}` : ''} --from ${key}${reroll > 0 ? ` --reroll ${reroll}` : ''} to reproduce this roll against this catalog revision)
${rerollBlock}PROMOTED INDEX: ${buildIndex}
  ${promotedInstruction}
  The promotion exists to refuse the model's ranking rut, not to outrank the
  user or the brief. Never expose promotion metadata in choice labels or order.
CHALLENGERS:
${picks.map(renderChallenger).join('\n')}
${stagingBlock}${challengerInstruction}
${authorityInstruction}
${richnessInstruction}
A user- or brief-pinned decision beats the roll, always.
`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const fromIdx = args.indexOf('--from');
  const scopeIdx = args.indexOf('--scope');
  const rerollIdx = args.indexOf('--reroll');
  const modeIdx = args.indexOf('--mode');
  try {
    process.stdout.write(renderConceptSeed({
      scope: scopeIdx !== -1 ? args[scopeIdx + 1] : 'surface',
      key: fromIdx !== -1
        ? args[fromIdx + 1]
        : (process.env.IMPECCABLE_CONCEPT_SEED || crypto.randomBytes(4).toString('hex')),
      reroll: rerollIdx !== -1 ? Number(args[rerollIdx + 1]) : 0,
      mode: modeIdx !== -1 ? args[modeIdx + 1] : null,
    }));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
