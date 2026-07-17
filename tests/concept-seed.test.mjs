import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT, 'skill', 'scripts', 'concept-seed.mjs');

function run(scope) {
  return spawnSync(process.execPath, [SCRIPT, '--scope', scope, '--from', 'stable-test'], {
    cwd: ROOT,
    encoding: 'utf-8',
  });
}

describe('concept seed scopes', () => {
  it('keeps world and surface rolls reproducible but independent', () => {
    const worldA = run('world');
    const worldB = run('world');
    const surface = run('surface');
    assert.equal(worldA.status, 0);
    assert.equal(worldA.stdout, worldB.stdout);
    assert.notEqual(worldA.stdout, surface.stdout);
    assert.match(worldA.stdout, /WORLD CONCEPT SEED/);
    assert.match(worldA.stdout, /cross-surface system breadth/);
    assert.match(surface.stdout, /SURFACE CONCEPT SEED/);
    assert.match(surface.stdout, /committed visual identity/);
  });

  it('rejects unknown scopes', () => {
    const result = run('unknown');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /world or surface/);
  });
});
