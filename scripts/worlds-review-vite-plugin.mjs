import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API_PATH = '/__impeccable/worlds';
const MAX_BODY_BYTES = 64 * 1024;
const REVIEW_STATUSES = new Set(['pending', 'approved', 'rejected']);

function jsonResponse(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(`${JSON.stringify(payload)}\n`);
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('Request body is too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJsonAtomic(filePath, value) {
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, filePath);
}

function findConcept(catalog, id) {
  for (const family of catalog.families || []) {
    const index = family.concepts?.findIndex(concept => concept.id === id) ?? -1;
    if (index !== -1) return { family, index, concept: family.concepts[index] };
  }
  return null;
}

function validateTags(tags) {
  return Array.isArray(tags)
    && tags.length === 3
    && tags.every(tag => typeof tag === 'string' && tag.trim().length >= 2 && tag.trim().length <= 40);
}

export function worldsReviewPlugin({ root = process.cwd() } = {}) {
  const catalogPath = path.join(root, 'skill', 'scripts', 'concept-ingredients.json');
  const reviewsPath = path.join(root, 'skill', 'scripts', 'concept-reviews.json');
  let mutationQueue = Promise.resolve();

  async function mutate(body) {
    const catalog = await readJson(catalogPath);
    const reviewData = await readJson(reviewsPath);
    const match = findConcept(catalog, body.id);
    if (!match) throw new Error('Concept was not found');

    if (body.action === 'review') {
      if (!REVIEW_STATUSES.has(body.status)) throw new Error('Review status is invalid');
      if (body.status === 'pending') {
        delete reviewData.reviews[body.id];
      } else {
        reviewData.reviews[body.id] = {
          status: body.status,
          reviewedBy: 'pbakaus',
          reviewedAt: new Date().toISOString(),
        };
      }
      reviewData.reviews = Object.fromEntries(Object.entries(reviewData.reviews).sort(([a], [b]) => a.localeCompare(b)));
      await writeJsonAtomic(reviewsPath, reviewData);
      return { id: body.id, status: body.status, review: reviewData.reviews[body.id] || null };
    }

    if (body.action === 'update') {
      const form = typeof body.form === 'string' ? body.form.trim() : '';
      const lineage = typeof body.lineage === 'string' ? body.lineage.trim() : '';
      const targetFamily = catalog.families.find(family => family.id === body.familyId);
      if (form.length < 12 || form.length > 600 || !form.includes(',')) {
        throw new Error('Form must be 12–600 characters and include inherited structure after a comma');
      }
      if (lineage.length < 2 || lineage.length > 160) throw new Error('Lineage must be 2–160 characters');
      if (!validateTags(body.tags)) throw new Error('Exactly three structural tags are required');
      if (!targetFamily) throw new Error('Family was not found');

      const updated = {
        ...match.concept,
        form,
        lineage,
        tags: body.tags.map(tag => tag.trim()),
      };
      if (targetFamily.id === match.family.id) {
        match.family.concepts[match.index] = updated;
      } else {
        match.family.concepts.splice(match.index, 1);
        targetFamily.concepts.push(updated);
        targetFamily.concepts.sort((a, b) => a.id.localeCompare(b.id));
      }
      catalog.catalogVersion = new Date().toISOString();
      await writeJsonAtomic(catalogPath, catalog);
      return { id: body.id, concept: updated, familyId: targetFamily.id };
    }

    throw new Error('Action is invalid');
  }

  return {
    name: 'impeccable-worlds-review',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(API_PATH, async (req, res) => {
        if (req.method !== 'POST') {
          jsonResponse(res, 405, { error: 'Method not allowed' });
          return;
        }
        if (!sameOrigin(req)) {
          jsonResponse(res, 403, { error: 'Cross-origin writes are not allowed' });
          return;
        }
        if (!String(req.headers['content-type'] || '').startsWith('application/json')) {
          jsonResponse(res, 415, { error: 'Expected application/json' });
          return;
        }

        try {
          const body = await readJsonBody(req);
          const operation = mutationQueue.then(() => mutate(body));
          mutationQueue = operation.catch(() => {});
          jsonResponse(res, 200, { ok: true, result: await operation });
        } catch (error) {
          jsonResponse(res, 400, { error: error instanceof Error ? error.message : String(error) });
        }
      });
    },
  };
}
