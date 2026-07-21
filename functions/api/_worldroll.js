// Shared world-roll logic for the /api/roll and /api/chosen endpoints.
//
// This mirrors the selection mechanics in skill/scripts/concept-seed.mjs
// exactly (same salts, same sha256 ranking, same rating weights), computed
// with Web Crypto because Workers have no sync hash. Same key + same pool
// revision therefore reproduces a roll bit-for-bit.
//
// Catalog data is bundled at deploy time from functions/api/_data/, refreshed
// by scripts/sync-api-data.mjs. The catalog never ships to clients in full:
// a roll exposes exactly the entries it deals.

import conceptCatalog from './_data/concept-ingredients.json';
import conceptReviews from './_data/concept-reviews.json';
import compositionCatalog from './_data/composition-ingredients.json';
import compositionReviews from './_data/composition-reviews.json';

export const WELL_TIERS = ['graphic', 'interaction', 'atmosphere'];
export const SEED_MODES = new Set(['persuade', 'operate', 'read', 'experience']);

const encoder = new TextEncoder();

async function sha256Hex(input) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function deterministicRank(items, input, idFor = item => item.id) {
  const scored = await Promise.all(items.map(async item => ({
    item,
    id: idFor(item),
    score: await sha256Hex(`${input}:${idFor(item)}`),
  })));
  scored.sort((a, b) => b.score.localeCompare(a.score) || a.id.localeCompare(b.id));
  return scored.map(entry => entry.item);
}

function mergeConcepts() {
  const reviews = conceptReviews.reviews || {};
  const wellsById = new Map((conceptCatalog.wells || []).map(well => [well.id, well]));
  const concepts = [];
  for (const family of conceptCatalog.families || []) {
    for (const concept of family.concepts || []) {
      concepts.push({
        ...concept,
        familyId: family.id,
        wellTier: wellsById.get(family.well)?.tier || null,
        status: reviews[concept.id]?.status || 'pending',
        review: reviews[concept.id] || null,
      });
    }
  }
  return concepts;
}

function mergeCompositions() {
  const reviews = compositionReviews.reviews || {};
  return (compositionCatalog.compositions || []).map(composition => ({
    ...composition,
    status: reviews[composition.id]?.status || 'pending',
  }));
}

export async function approvedPoolRevision(concepts) {
  const payload = concepts
    .filter(concept => concept.status === 'approved')
    .map(concept => `${concept.familyId}:${concept.id}:${concept.strength}:${concept.form}:${concept.spark}:${JSON.stringify(concept.system)}:${concept.webLeverage}`)
    .sort()
    .join('\n');
  return (await sha256Hex(payload)).slice(0, 12);
}

export async function selectApprovedChallengers({ scope, key, reroll = 0, concepts }) {
  const approved = concepts.filter(concept => concept.status === 'approved');
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
    throw new Error('every challenger tier needs at least one approved concept');
  }
  for (const [tier, pool] of approvedByTier) {
    const matching = pool.filter(concept => wanted.has(concept.strength));
    if (matching.length > 0) approvedByTier.set(tier, matching);
  }
  const ticketsFor = pool => pool.flatMap(concept => {
    const rating = concept.review?.rating;
    if (rating === 1) return [];
    return rating === 3
      ? [{ concept, ticket: 0 }, { concept, ticket: 1 }]
      : [{ concept, ticket: 0 }];
  });
  const pickRound = async (round, excluded) => {
    const salt = round === 0 ? '' : `:reroll-${round}`;
    const tierOrder = (await deterministicRank(
      WELL_TIERS.map(id => ({ id })),
      `${scope}:${key}:tiers${salt}`
    )).map(item => item.id);
    const picks = [];
    for (const [index, tier] of tierOrder.entries()) {
      let pool = approvedByTier.get(tier).filter(concept => !excluded.has(concept.id));
      if (pool.length === 0) pool = approvedByTier.get(tier);
      let tickets = ticketsFor(pool);
      if (tickets.length === 0) tickets = pool.map(concept => ({ concept, ticket: 0 }));
      const ranked = await deterministicRank(
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
      picks.push(...(second ? [first, second] : [first]));
    }
    return picks;
  };
  const excluded = new Set();
  let picks = await pickRound(0, excluded);
  for (let round = 1; round <= reroll; round += 1) {
    for (const pick of picks) excluded.add(pick.id);
    picks = await pickRound(round, excluded);
  }
  return { approved, picks };
}

export async function selectApprovedStaging({ scope, key, reroll = 0, mode = null, compositions }) {
  let approved = compositions.filter(composition => composition.status === 'approved');
  if (approved.length === 0) return null;
  if (mode) {
    const matching = approved.filter(composition => composition.surface === mode);
    if (matching.length === 0) return null;
    approved = matching;
  }
  const prior = new Set();
  let pick = (await deterministicRank(approved, `${scope}:${key}:staging`))[0];
  for (let round = 1; round <= reroll; round += 1) {
    prior.add(pick.id);
    const pool = approved.filter(composition => !prior.has(composition.id));
    pick = (await deterministicRank(
      pool.length > 0 ? pool : approved,
      `${scope}:${key}:staging:reroll-${round}`
    ))[0];
  }
  return pick;
}

const publicConcept = concept => ({
  id: concept.id,
  form: concept.form,
  spark: concept.spark,
  system: concept.system,
  webLeverage: concept.webLeverage,
  wellTier: concept.wellTier,
});

const publicComposition = composition => ({
  id: composition.id,
  form: composition.form,
  spark: composition.spark,
  grammar: composition.grammar,
  webLeverage: composition.webLeverage,
  surface: composition.surface,
});

export async function rollSeed({ scope, key, mode, reroll }) {
  const concepts = mergeConcepts();
  const compositions = mergeCompositions();
  const [poolRevision, { approved, picks }, staging] = await Promise.all([
    approvedPoolRevision(concepts),
    selectApprovedChallengers({ scope, key, reroll, concepts }),
    selectApprovedStaging({ scope, key, reroll, mode, compositions }),
  ]);
  return {
    key,
    scope,
    mode: mode || null,
    reroll,
    poolRevision,
    approvedCount: approved.length,
    catalogCount: concepts.length,
    challengers: picks.map(publicConcept),
    staging: staging ? publicComposition(staging) : null,
  };
}

// Impressions and choices land in Workers Analytics Engine when the binding
// exists; without it, logging is a silent no-op so the roll never fails.
export function logEvent(env, event, fields) {
  try {
    env.ROLL_ANALYTICS?.writeDataPoint({
      blobs: [
        event,
        fields.scope || '',
        fields.mode || '',
        fields.poolRevision || '',
        fields.chosenId || '',
        ...(fields.dealtIds || []),
      ],
      doubles: [fields.reroll || 0],
      indexes: [event],
    });
  } catch {
    // Telemetry must never break a roll.
  }
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
