import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { describe, it } from 'node:test';
import { worldsReviewPlugin } from '../scripts/worlds-review-vite-plugin.mjs';

async function fixtureRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'impeccable-worlds-'));
  const scripts = path.join(root, 'skill', 'scripts');
  await mkdir(scripts, { recursive: true });
  await writeFile(path.join(scripts, 'concept-ingredients.json'), JSON.stringify({
    schemaVersion: 2,
    catalogVersion: 'test',
    families: [
      {
        id: 'editorial',
        label: 'Editorial',
        concepts: [{ id: 'editorial-field-guide', form: 'a field guide, with plates, keys, and indexes', lineage: 'reference publishing', tags: ['plates', 'keys', 'index'] }],
      },
      { id: 'mapping', label: 'Mapping', concepts: [] },
    ],
  }, null, 2));
  await writeFile(path.join(scripts, 'concept-reviews.json'), JSON.stringify({ schemaVersion: 1, reviews: {} }, null, 2));
  return root;
}

function handlerFor(root) {
  let route = '';
  let handler = null;
  worldsReviewPlugin({ root }).configureServer({
    middlewares: {
      use(pathname, middleware) {
        route = pathname;
        handler = middleware;
      },
    },
  });
  assert.equal(route, '/__impeccable/worlds');
  assert.equal(typeof handler, 'function');
  return handler;
}

function request(handler, body, headers = {}) {
  return new Promise(resolve => {
    const req = Readable.from([Buffer.from(JSON.stringify(body))]);
    req.method = 'POST';
    req.headers = {
      host: 'localhost:4321',
      origin: 'http://localhost:4321',
      'content-type': 'application/json',
      ...headers,
    };
    const responseHeaders = {};
    const res = {
      statusCode: 0,
      setHeader(name, value) { responseHeaders[name] = value; },
      end(value) {
        resolve({ status: this.statusCode, headers: responseHeaders, body: JSON.parse(value) });
      },
    };
    handler(req, res);
  });
}

describe('worlds review dev middleware', () => {
  it('writes and clears human review decisions', async () => {
    const root = await fixtureRoot();
    const handler = handlerFor(root);
    const approved = await request(handler, { action: 'review', id: 'editorial-field-guide', status: 'approved' });
    assert.equal(approved.status, 200);
    const reviewsPath = path.join(root, 'skill', 'scripts', 'concept-reviews.json');
    const reviews = JSON.parse(await readFile(reviewsPath, 'utf8'));
    assert.equal(reviews.reviews['editorial-field-guide'].status, 'approved');
    assert.equal(reviews.reviews['editorial-field-guide'].reviewedBy, 'pbakaus');

    const pending = await request(handler, { action: 'review', id: 'editorial-field-guide', status: 'pending' });
    assert.equal(pending.status, 200);
    const cleared = JSON.parse(await readFile(reviewsPath, 'utf8'));
    assert.equal(cleared.reviews['editorial-field-guide'], undefined);
  });

  it('updates concept content without changing its stable id', async () => {
    const root = await fixtureRoot();
    const handler = handlerFor(root);
    const response = await request(handler, {
      action: 'update',
      id: 'editorial-field-guide',
      form: 'an expanded field guide, with specimen plates, branching keys, and index tabs',
      familyId: 'mapping',
      lineage: 'field reference publishing',
      tags: ['specimen-plate', 'branching-key', 'index-tab'],
    });
    assert.equal(response.status, 200);
    const catalog = JSON.parse(await readFile(path.join(root, 'skill', 'scripts', 'concept-ingredients.json'), 'utf8'));
    assert.equal(catalog.families[0].concepts.length, 0);
    assert.equal(catalog.families[1].concepts[0].id, 'editorial-field-guide');
    assert.match(catalog.families[1].concepts[0].form, /expanded field guide/);
  });

  it('rejects cross-origin writes', async () => {
    const root = await fixtureRoot();
    const handler = handlerFor(root);
    const response = await request(
      handler,
      { action: 'review', id: 'editorial-field-guide', status: 'approved' },
      { origin: 'https://example.com' }
    );
    assert.equal(response.status, 403);
    assert.match(response.body.error, /Cross-origin/);
  });
});
