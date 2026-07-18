import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readConceptCatalog, validateConceptCatalog } from '../skill/scripts/lib/concept-catalog.mjs';
import { selectApprovedChallengers } from '../skill/scripts/concept-seed.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT, 'skill', 'scripts', 'concept-seed.mjs');

function run(scope) {
  return spawnSync(process.execPath, [SCRIPT, '--scope', scope, '--from', 'stable-test'], {
    cwd: ROOT,
    encoding: 'utf-8',
  });
}

describe('concept seed scopes', () => {
  it('keeps coupled-direction and established-world surface rolls reproducible but independent', () => {
    const directionA = run('direction');
    const directionB = run('direction');
    const surface = run('surface');
    assert.equal(directionA.status, 0);
    assert.equal(directionA.stdout, directionB.stdout);
    assert.notEqual(directionA.stdout, surface.stdout);
    assert.match(directionA.stdout, /DIRECTION CONCEPT SEED/);
    assert.match(directionA.stdout, /selected\s+independently/);
    assert.match(directionA.stdout, /substantially different future surface/);
    assert.match(directionA.stdout, /Never expose promotion metadata/);
    assert.match(surface.stdout, /SURFACE CONCEPT SEED/);
    assert.match(surface.stdout, /committed visual identity/);
  });

  it('rejects unknown scopes', () => {
    const result = run('unknown');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /direction or surface/);
  });

  it('validates the expanded catalog and human review gate', () => {
    const catalogPath = path.join(ROOT, 'skill', 'scripts', 'concept-ingredients.json');
    const reviewsPath = path.join(ROOT, 'skill', 'scripts', 'concept-reviews.json');
    const { catalog, reviewData, concepts } = readConceptCatalog(catalogPath, reviewsPath);
    const result = validateConceptCatalog(catalog, reviewData, { minimumTotal: 2304 });

    assert.deepEqual(result.errors, []);
    assert.equal(result.stats.families, 36);
    assert.equal(result.stats.concepts >= 2304, true);
    assert.equal(result.stats.approved >= 3, true);
    assert.equal(result.stats.pending + result.stats.approved + result.stats.rejected, result.stats.concepts);
    assert.equal(fs.statSync(catalogPath).size > 500_000, true);
    assert.equal(
      concepts.filter(concept => concept.status === 'approved').length,
      result.stats.approved
    );
  });

  it('selects three approved challengers from distinct families', () => {
    for (let index = 0; index < 200; index += 1) {
      const { picks } = selectApprovedChallengers({ scope: 'surface', key: `coverage-${index}` });
      assert.equal(picks.length, 3);
      assert.equal(new Set(picks.map(pick => pick.familyId)).size, 3);
      assert.equal(picks.every(pick => pick.status === 'approved'), true);
    }
  });
});
