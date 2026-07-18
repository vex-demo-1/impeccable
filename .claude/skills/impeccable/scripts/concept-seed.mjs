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
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pool = JSON.parse(readFileSync(join(here, 'concept-ingredients.json'), 'utf8'));

const args = process.argv.slice(2);
const fromIdx = args.indexOf('--from');
const scopeIdx = args.indexOf('--scope');
const scope = scopeIdx !== -1 ? args[scopeIdx + 1] : 'surface';
if (scope !== 'surface' && scope !== 'direction') {
  process.stderr.write('concept-seed: --scope must be direction or surface\n');
  process.exit(1);
}
// When no key is supplied, generate one and print it: a user reporting a
// bad outcome can hand us the key and we replay the exact roll.
const key = fromIdx !== -1
  ? args[fromIdx + 1]
  : (process.env.IMPECCABLE_CONCEPT_SEED || crypto.randomBytes(4).toString('hex'));

function hashUnit(k, salt) {
  const h = crypto.createHash('sha256').update(`${scope}:${salt}:${k}`).digest();
  return h.readUInt32BE(0) / 0xffffffff;
}
const unit = (salt) => hashUnit(key, salt);

const buildIndex = 3 + Math.floor(unit('index') * 5); // 3..7

const entries = Object.entries(pool)
  .filter(([k]) => !k.startsWith('_'))
  .flatMap(([, list]) => list);
const picks = [];
const taken = new Set();
for (let i = 0; picks.length < 3 && i < 60; i++) {
  const idx = Math.floor(unit(`challenger-${i}`) * entries.length) % entries.length;
  if (!taken.has(idx)) {
    taken.add(idx);
    picks.push(entries[idx]);
  }
}

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
  ? `A challenger enters only when it can supply both reusable identity grammar
  and a strong first-surface structure, not a one-page costume or a style pasted
  onto an unrelated layout. Weigh audience identification, product clarity,
  current-surface force, and cross-surface system breadth.`
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

process.stdout.write(`${scope.toUpperCase()} CONCEPT SEED (key: ${key}; rerun with --scope ${scope} --from ${key} to reproduce this roll)
PROMOTED INDEX: ${buildIndex}
  ${promotedInstruction}
  The promotion exists to refuse the model's ranking rut, not to outrank the
  user or the brief.
CHALLENGERS:
  1. ${picks[0]}
  2. ${picks[1]}
  3. ${picks[2]}
${challengerInstruction}
${authorityInstruction}
A user- or brief-pinned decision beats the roll, always.
`);
