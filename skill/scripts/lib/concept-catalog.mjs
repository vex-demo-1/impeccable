import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';

export const CONCEPT_STATUSES = new Set(['approved', 'rejected']);

export function normalizeConceptForm(value) {
  return String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function readConceptCatalog(catalogPath, reviewsPath) {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const reviewData = JSON.parse(readFileSync(reviewsPath, 'utf8'));
  const reviews = reviewData.reviews || {};
  const concepts = [];

  for (const family of catalog.families || []) {
    for (const concept of family.concepts || []) {
      concepts.push({
        ...concept,
        familyId: family.id,
        familyLabel: family.label,
        status: reviews[concept.id]?.status || 'pending',
        review: reviews[concept.id] || null,
      });
    }
  }

  return { catalog, reviewData, reviews, concepts };
}

export function validateConceptCatalog(catalog, reviewData, { expectedTotal, minimumTotal } = {}) {
  const errors = [];
  const warnings = [];
  const familyIds = new Set();
  const conceptIds = new Set();
  const normalizedForms = new Map();
  const concepts = [];

  if (!Number.isInteger(catalog?.schemaVersion) || catalog.schemaVersion < 1) {
    errors.push('catalog.schemaVersion must be a positive integer');
  }
  if (typeof catalog?.catalogVersion !== 'string' || !catalog.catalogVersion.trim()) {
    errors.push('catalog.catalogVersion must be a non-empty string');
  }
  if (!Array.isArray(catalog?.families) || catalog.families.length < 3) {
    errors.push('catalog.families must contain at least three families');
  }

  for (const family of catalog?.families || []) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(family.id || '')) {
      errors.push(`invalid family id: ${String(family.id)}`);
    } else if (familyIds.has(family.id)) {
      errors.push(`duplicate family id: ${family.id}`);
    }
    familyIds.add(family.id);
    if (typeof family.label !== 'string' || !family.label.trim()) {
      errors.push(`family ${family.id || '(unknown)'} needs a label`);
    }
    if (!Array.isArray(family.concepts) || family.concepts.length === 0) {
      errors.push(`family ${family.id || '(unknown)'} has no concepts`);
      continue;
    }

    for (const concept of family.concepts) {
      concepts.push(concept);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(concept.id || '')) {
        errors.push(`invalid concept id: ${String(concept.id)}`);
      } else if (conceptIds.has(concept.id)) {
        errors.push(`duplicate concept id: ${concept.id}`);
      }
      conceptIds.add(concept.id);

      const normalized = normalizeConceptForm(concept.form);
      if (!normalized) {
        errors.push(`concept ${concept.id || '(unknown)'} needs a form`);
      } else if (normalizedForms.has(normalized)) {
        errors.push(`duplicate concept form: ${concept.id} and ${normalizedForms.get(normalized)}`);
      }
      normalizedForms.set(normalized, concept.id);

      if (typeof concept.form !== 'string' || !concept.form.includes(',')) {
        errors.push(`concept ${concept.id || '(unknown)'} must name a form and inherited structure after a comma`);
      }
      if (typeof concept.lineage !== 'string' || !concept.lineage.trim()) {
        errors.push(`concept ${concept.id || '(unknown)'} needs lineage metadata`);
      }
      if (!Array.isArray(concept.tags) || concept.tags.length !== 3 || concept.tags.some(tag => typeof tag !== 'string' || !tag.trim())) {
        errors.push(`concept ${concept.id || '(unknown)'} must have exactly three structural tags`);
      }
      if (/\b(?:in the style of|styled like|copy of)\b/i.test(concept.form)) {
        errors.push(`concept ${concept.id || '(unknown)'} contains imitation language`);
      }
    }
  }

  if (expectedTotal !== undefined && concepts.length !== expectedTotal) {
    errors.push(`expected ${expectedTotal} concepts, found ${concepts.length}`);
  }
  if (minimumTotal !== undefined && concepts.length < minimumTotal) {
    errors.push(`expected at least ${minimumTotal} concepts, found ${concepts.length}`);
  }

  if (!Number.isInteger(reviewData?.schemaVersion) || reviewData.schemaVersion < 1) {
    errors.push('reviews.schemaVersion must be a positive integer');
  }
  for (const [id, review] of Object.entries(reviewData?.reviews || {})) {
    if (!conceptIds.has(id)) errors.push(`review references missing concept: ${id}`);
    if (!CONCEPT_STATUSES.has(review?.status)) errors.push(`invalid review status for ${id}: ${String(review?.status)}`);
    if (typeof review?.reviewedBy !== 'string' || !review.reviewedBy.trim()) {
      errors.push(`review ${id} needs reviewedBy`);
    }
    if (typeof review?.reviewedAt !== 'string' || Number.isNaN(Date.parse(review.reviewedAt))) {
      errors.push(`review ${id} needs an ISO reviewedAt timestamp`);
    }
  }

  const approved = concepts.filter(concept => reviewData?.reviews?.[concept.id]?.status === 'approved');
  const approvedFamilies = new Set(
    (catalog?.families || [])
      .filter(family => family.concepts?.some(concept => reviewData?.reviews?.[concept.id]?.status === 'approved'))
      .map(family => family.id)
  );
  if (approved.length < 3) errors.push('at least three concepts must be approved');
  if (approvedFamilies.size < 3) errors.push('approved concepts must span at least three families');

  return {
    errors,
    warnings,
    stats: {
      families: familyIds.size,
      concepts: concepts.length,
      approved: approved.length,
      pending: concepts.length - Object.keys(reviewData?.reviews || {}).length,
      rejected: Object.values(reviewData?.reviews || {}).filter(review => review?.status === 'rejected').length,
    },
  };
}

export function approvedPoolRevision(concepts) {
  const payload = concepts
    .filter(concept => concept.status === 'approved')
    .map(concept => `${concept.familyId}:${concept.id}:${concept.form}`)
    .sort()
    .join('\n');
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 12);
}

export function deterministicRank(items, input, idFor = item => item.id) {
  return [...items].sort((a, b) => {
    const scoreA = crypto.createHash('sha256').update(`${input}:${idFor(a)}`).digest('hex');
    const scoreB = crypto.createHash('sha256').update(`${input}:${idFor(b)}`).digest('hex');
    return scoreB.localeCompare(scoreA) || idFor(a).localeCompare(idFor(b));
  });
}
