/**
 * jsdom fixture tests for anti-pattern detection.
 * Run via Node's built-in test runner (not bun) to avoid jsdom resource limits.
 *
 * Usage: node --test tests/detect-antipatterns-fixtures.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  detectHtml,
} from '../src/detect-antipatterns.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures', 'antipatterns');

describe('detectHtml — jsdom fixtures', () => {
  it('should-flag: catches border anti-patterns', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'should-flag.html'));
    assert.ok(f.some(r => r.antipattern === 'side-tab'));
    assert.ok(f.some(r => r.antipattern === 'border-accent-on-rounded'));
  });

  it('should-pass: zero border findings', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'should-pass.html'));
    assert.equal(f.filter(r => r.antipattern === 'side-tab' || r.antipattern === 'border-accent-on-rounded').length, 0);
  });

  it('linked-stylesheet: catches borders, no false positives', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'linked-stylesheet.html'));
    assert.ok(f.some(r => r.antipattern === 'side-tab'));
    assert.ok(f.some(r => r.antipattern === 'border-accent-on-rounded'));
    assert.equal(f.filter(r => r.snippet?.includes('clean')).length, 0);
  });

  it('partial-component: flags borders, skips page-level', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'partial-component.html'));
    assert.ok(f.some(r => r.antipattern === 'side-tab'));
    assert.equal(f.filter(r => r.antipattern === 'flat-type-hierarchy').length, 0);
  });

  it('color-should-flag: detects all five color issues', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'color-should-flag.html'));
    assert.ok(f.some(r => r.antipattern === 'pure-black-white'));
    assert.ok(f.some(r => r.antipattern === 'gray-on-color'));
    assert.ok(f.some(r => r.antipattern === 'low-contrast'));
    assert.ok(f.some(r => r.antipattern === 'gradient-text'));
    assert.ok(f.some(r => r.antipattern === 'ai-color-palette'));
  });

  it('color-should-pass: zero findings', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'color-should-pass.html'));
    assert.equal(f.length, 0);
  });

  it('legitimate-borders: minimal false positives', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'legitimate-borders.html'));
    const borderFindings = f.filter(r => r.antipattern === 'side-tab' || r.antipattern === 'border-accent-on-rounded');
    assert.ok(borderFindings.length <= 1);
  });

  it('typography-should-flag: detects all three issues', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'typography-should-flag.html'));
    assert.ok(f.some(r => r.antipattern === 'overused-font'));
    assert.ok(f.some(r => r.antipattern === 'single-font'));
    assert.ok(f.some(r => r.antipattern === 'flat-type-hierarchy'));
  });

  it('typography-should-pass: zero findings', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'typography-should-pass.html'));
    assert.equal(f.length, 0);
  });
});

describe('detectHtml — layout fixtures', () => {
  it('layout-should-flag: detects nested cards', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'layout-should-flag.html'));
    assert.ok(f.filter(r => r.antipattern === 'nested-cards').length >= 4);
  });

  it('layout-should-pass: no layout false positives', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'layout-should-pass.html'));
    assert.equal(f.filter(r => r.antipattern === 'nested-cards').length, 0);
    assert.equal(f.filter(r => r.antipattern === 'monotonous-spacing').length, 0);
    assert.equal(f.filter(r => r.antipattern === 'everything-centered').length, 0);
  });
});

describe('detectHtml — motion fixtures', () => {
  it('motion-should-flag: detects both motion issues', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'motion-should-flag.html'));
    assert.ok(f.some(r => r.antipattern === 'bounce-easing'));
    assert.ok(f.some(r => r.antipattern === 'layout-transition'));
  });

  it('motion-should-pass: no motion false positives', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'motion-should-pass.html'));
    assert.equal(f.filter(r => r.antipattern === 'bounce-easing').length, 0);
    assert.equal(f.filter(r => r.antipattern === 'layout-transition').length, 0);
  });
});

describe('detectHtml — dark glow fixtures', () => {
  it('glow-should-flag: detects dark-glow', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'glow-should-flag.html'));
    assert.ok(f.some(r => r.antipattern === 'dark-glow'));
  });

  it('glow-should-pass: no dark-glow false positives', async () => {
    const f = await detectHtml(path.join(FIXTURES, 'glow-should-pass.html'));
    assert.equal(f.filter(r => r.antipattern === 'dark-glow').length, 0);
  });
});
