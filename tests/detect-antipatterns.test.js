import { describe, test, expect } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { detectAntiPatterns, ANTIPATTERNS, walkDir, SCANNABLE_EXTENSIONS } from '../source/skills/critique/scripts/detect-antipatterns.mjs';

const FIXTURES = path.join(import.meta.dir, 'fixtures', 'antipatterns');
const SCRIPT = path.join(import.meta.dir, '..', 'source', 'skills', 'critique', 'scripts', 'detect-antipatterns.mjs');

// ---------------------------------------------------------------------------
// Core detection: Tailwind side-tab
// ---------------------------------------------------------------------------

describe('detectAntiPatterns — Tailwind side-tab', () => {
  test('detects border-l-4 (always, thick enough)', () => {
    const findings = detectAntiPatterns('<div class="border-l-4 border-blue-500">', 'test.html');
    expect(findings).toHaveLength(1);
    expect(findings[0].antipattern).toBe('side-tab');
    expect(findings[0].snippet).toBe('border-l-4');
  });

  test('detects border-e-8 (always, thick enough)', () => {
    const findings = detectAntiPatterns('<div class="border-e-8 border-red-500">', 'test.html');
    expect(findings).toHaveLength(1);
    expect(findings[0].snippet).toBe('border-e-8');
  });

  test('ignores border-r-2 without rounded (below threshold)', () => {
    const findings = detectAntiPatterns('<div class="border-r-2 border-red-400">', 'test.html');
    expect(findings).toHaveLength(0);
  });

  test('detects border-r-2 WITH rounded (context-aware)', () => {
    const findings = detectAntiPatterns('<div class="border-r-2 border-red-400 rounded-lg">', 'test.html');
    expect(findings).toHaveLength(1);
    expect(findings[0].snippet).toBe('border-r-2');
  });

  test('detects border-l-1 with rounded (even thin borders)', () => {
    const findings = detectAntiPatterns('<div class="border-l-1 border-blue-500 rounded-md">', 'test.html');
    expect(findings).toHaveLength(1);
  });

  test('ignores border-l-1 without rounded', () => {
    const findings = detectAntiPatterns('<div class="border-l-1 border-gray-300">', 'test.html');
    expect(findings).toHaveLength(0);
  });

  test('ignores border-l-0', () => {
    const findings = detectAntiPatterns('<div class="border-l-0">', 'test.html');
    expect(findings).toHaveLength(0);
  });

  test('detects multiple on same line', () => {
    const findings = detectAntiPatterns('<div class="border-l-4 border-r-4">', 'test.html');
    expect(findings).toHaveLength(2);
  });

  test('does not flag border-t or border-b without rounded', () => {
    const findings = detectAntiPatterns('<div class="border-t-4 border-b-4">', 'test.html');
    expect(findings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Context-aware detection: rounded corners
// ---------------------------------------------------------------------------

describe('detectAntiPatterns — rounded context', () => {
  test('border-s-2 + rounded-xl triggers', () => {
    const findings = detectAntiPatterns('<div class="border-s-2 border-amber-500 rounded-xl">', 'test.html');
    expect(findings).toHaveLength(1);
  });

  test('border-l-3 + rounded triggers', () => {
    const findings = detectAntiPatterns('<div class="border-l-3 rounded bg-white">', 'test.html');
    expect(findings).toHaveLength(1);
  });

  test('border-l-3 without rounded does not trigger', () => {
    const findings = detectAntiPatterns('<div class="border-l-3 bg-white">', 'test.html');
    expect(findings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Safe element exclusions
// ---------------------------------------------------------------------------

describe('detectAntiPatterns — safe elements', () => {
  test('skips blockquote', () => {
    const findings = detectAntiPatterns('<blockquote style="border-left: 4px solid #ccc;">', 'test.html');
    expect(findings).toHaveLength(0);
  });

  test('skips nav link', () => {
    const findings = detectAntiPatterns('<a href="#" style="border-left: 3px solid blue;">', 'test.html');
    expect(findings).toHaveLength(0);
  });

  test('skips input', () => {
    const findings = detectAntiPatterns('<input style="border-left: 3px solid red; border-radius: 6px;">', 'test.html');
    expect(findings).toHaveLength(0);
  });

  test('skips code/pre', () => {
    const findings = detectAntiPatterns('<code style="border-left: 3px solid green;">', 'test.html');
    expect(findings).toHaveLength(0);
  });

  test('skips span (code diff lines)', () => {
    const findings = detectAntiPatterns('<span style="border-left: 3px solid #ef4444;">', 'test.html');
    expect(findings).toHaveLength(0);
  });

  test('does NOT skip div (still flags)', () => {
    const findings = detectAntiPatterns('<div style="border-left: 4px solid blue;">', 'test.html');
    expect(findings).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Core detection: CSS shorthand
// ---------------------------------------------------------------------------

describe('detectAntiPatterns — CSS shorthand', () => {
  test('detects border-left: Npx solid', () => {
    const findings = detectAntiPatterns('.card { border-left: 4px solid #3b82f6; }', 'test.css');
    expect(findings).toHaveLength(1);
    expect(findings[0].snippet).toContain('border-left');
  });

  test('detects border-right: Npx solid', () => {
    const findings = detectAntiPatterns('.card { border-right: 5px solid purple; }', 'test.css');
    expect(findings).toHaveLength(1);
  });

  test('ignores border-left: 2px solid (below threshold)', () => {
    const findings = detectAntiPatterns('.card { border-left: 2px solid blue; }', 'test.css');
    expect(findings).toHaveLength(0);
  });

  test('ignores border-top: 4px solid', () => {
    const findings = detectAntiPatterns('.card { border-top: 4px solid blue; }', 'test.css');
    expect(findings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Core detection: CSS longhand
// ---------------------------------------------------------------------------

describe('detectAntiPatterns — CSS longhand', () => {
  test('detects border-left-width: Npx', () => {
    const findings = detectAntiPatterns('.card { border-left-width: 3px; }', 'test.css');
    expect(findings).toHaveLength(1);
  });

  test('detects border-right-width: Npx', () => {
    const findings = detectAntiPatterns('.card { border-right-width: 6px; }', 'test.css');
    expect(findings).toHaveLength(1);
  });

  test('ignores border-left-width: 2px', () => {
    const findings = detectAntiPatterns('.card { border-left-width: 2px; }', 'test.css');
    expect(findings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Core detection: CSS logical properties
// ---------------------------------------------------------------------------

describe('detectAntiPatterns — CSS logical properties', () => {
  test('detects border-inline-start: Npx solid', () => {
    const findings = detectAntiPatterns('.card { border-inline-start: 4px solid gold; }', 'test.css');
    expect(findings).toHaveLength(1);
  });

  test('detects border-inline-end: Npx solid', () => {
    const findings = detectAntiPatterns('.card { border-inline-end: 3px solid pink; }', 'test.css');
    expect(findings).toHaveLength(1);
  });

  test('detects border-inline-start-width: Npx', () => {
    const findings = detectAntiPatterns('.card { border-inline-start-width: 5px; }', 'test.css');
    expect(findings).toHaveLength(1);
  });

  test('detects border-inline-end-width: Npx', () => {
    const findings = detectAntiPatterns('.card { border-inline-end-width: 4px; }', 'test.css');
    expect(findings).toHaveLength(1);
  });

  test('ignores border-inline-start: 2px solid', () => {
    const findings = detectAntiPatterns('.card { border-inline-start: 2px solid blue; }', 'test.css');
    expect(findings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Core detection: JSX inline styles
// ---------------------------------------------------------------------------

describe('detectAntiPatterns — JSX inline styles', () => {
  test('detects borderLeft with px value', () => {
    const findings = detectAntiPatterns('borderLeft: "4px solid #3b82f6"', 'test.jsx');
    expect(findings).toHaveLength(1);
  });

  test('detects borderRight with px value', () => {
    const findings = detectAntiPatterns("borderRight: '5px solid purple'", 'test.tsx');
    expect(findings).toHaveLength(1);
  });

  test('ignores borderLeft: 2px (below threshold)', () => {
    const findings = detectAntiPatterns('borderLeft: "2px solid blue"', 'test.jsx');
    expect(findings).toHaveLength(0);
  });

  test('ignores borderTop', () => {
    const findings = detectAntiPatterns('borderTop: "4px solid blue"', 'test.jsx');
    expect(findings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Top/bottom + rounded detection
// ---------------------------------------------------------------------------

describe('detectAntiPatterns — border accent on rounded', () => {
  test('border-t-4 + rounded-lg triggers', () => {
    const findings = detectAntiPatterns('<div class="border-t-4 border-blue-500 rounded-lg">', 'test.html');
    expect(findings).toHaveLength(1);
    expect(findings[0].antipattern).toBe('border-accent-on-rounded');
  });

  test('border-b-2 + rounded-xl triggers', () => {
    const findings = detectAntiPatterns('<div class="border-b-2 border-purple-500 rounded-xl">', 'test.html');
    expect(findings).toHaveLength(1);
  });

  test('border-t-1 + rounded triggers (even thin)', () => {
    const findings = detectAntiPatterns('<div class="border-t-1 border-emerald-500 rounded-md">', 'test.html');
    expect(findings).toHaveLength(1);
  });

  test('border-t-4 WITHOUT rounded does not trigger', () => {
    const findings = detectAntiPatterns('<div class="border-t-4 border-blue-500">', 'test.html');
    expect(findings).toHaveLength(0);
  });

  test('border-b-4 WITHOUT rounded does not trigger', () => {
    const findings = detectAntiPatterns('<div class="border-b-4 border-purple-500">', 'test.html');
    expect(findings).toHaveLength(0);
  });

  test('CSS border-top + border-radius on same line triggers', () => {
    const findings = detectAntiPatterns('<div style="border-top: 4px solid blue; border-radius: 12px;">', 'test.html');
    expect(findings).toHaveLength(1);
    expect(findings[0].antipattern).toBe('border-accent-on-rounded');
  });

  test('CSS border-bottom + border-radius on same line triggers', () => {
    const findings = detectAntiPatterns('<div style="border-bottom: 3px solid purple; border-radius: 8px;">', 'test.html');
    expect(findings).toHaveLength(1);
  });

  test('CSS border-top WITHOUT border-radius does not trigger', () => {
    const findings = detectAntiPatterns('.section { border-top: 4px solid blue; }', 'test.css');
    expect(findings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Typography: overused fonts
// ---------------------------------------------------------------------------

describe('detectAntiPatterns — overused fonts', () => {
  test('detects Inter as primary font', () => {
    const findings = detectAntiPatterns("body { font-family: 'Inter', sans-serif; }", 'test.css');
    expect(findings).toHaveLength(1);
    expect(findings[0].antipattern).toBe('overused-font');
  });

  test('detects Roboto as primary font', () => {
    const findings = detectAntiPatterns('body { font-family: Roboto, sans-serif; }', 'test.css');
    expect(findings).toHaveLength(1);
  });

  test('detects Open Sans', () => {
    const findings = detectAntiPatterns("body { font-family: 'Open Sans', sans-serif; }", 'test.css');
    expect(findings).toHaveLength(1);
  });

  test('detects Google Fonts import for Inter', () => {
    const findings = detectAntiPatterns('<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700" rel="stylesheet">', 'test.html');
    expect(findings).toHaveLength(1);
    expect(findings[0].snippet).toContain('Inter');
  });

  test('does not flag distinctive fonts', () => {
    const findings = detectAntiPatterns("body { font-family: 'Instrument Sans', sans-serif; }", 'test.css');
    expect(findings).toHaveLength(0);
  });

  test('does not flag Inter as fallback (not primary)', () => {
    const findings = detectAntiPatterns("body { font-family: 'Fraunces', 'Inter', sans-serif; }", 'test.css');
    expect(findings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Typography: single font
// ---------------------------------------------------------------------------

describe('detectAntiPatterns — single font', () => {
  test('flags file with only one font', () => {
    const content = `<html><head><style>
body { font-family: 'Poppins', sans-serif; }
h1 { font-size: 2rem; }
h2 { font-size: 1.5rem; }
p { font-size: 1rem; }
.card { padding: 1rem; }
.hero { padding: 2rem; }
.footer { padding: 1rem; }
.nav { display: flex; }
.sidebar { width: 200px; }
.main { flex: 1; }
.btn { padding: 0.5rem 1rem; }
.input { border: 1px solid #ccc; }
.label { font-weight: 500; }
.icon { width: 24px; }
.grid { display: grid; }
.flex { display: flex; }
.hidden { display: none; }
.visible { display: block; }
.text { color: #333; }
</style></head><body></body></html>`;
    const findings = content.split('\n').length >= 20 ?
      detectAntiPatterns(content, 'test.html').filter(f => f.antipattern === 'single-font') : [];
    expect(findings).toHaveLength(1);
    expect(findings[0].snippet).toContain('poppins');
  });

  test('does not flag file with two fonts', () => {
    const content = `<html><head><style>
body { font-family: 'Instrument Sans', sans-serif; }
h1 { font-family: 'Fraunces', serif; font-size: 2rem; }
h2 { font-size: 1.5rem; }
p { font-size: 1rem; }
.card { padding: 1rem; }
.hero { padding: 2rem; }
.footer { padding: 1rem; }
.nav { display: flex; }
.sidebar { width: 200px; }
.main { flex: 1; }
.btn { padding: 0.5rem 1rem; }
.input { border: 1px solid #ccc; }
.label { font-weight: 500; }
.icon { width: 24px; }
.grid { display: grid; }
.flex { display: flex; }
.hidden { display: none; }
.visible { display: block; }
.text { color: #333; }
</style></head><body></body></html>`;
    const findings = detectAntiPatterns(content, 'test.html').filter(f => f.antipattern === 'single-font');
    expect(findings).toHaveLength(0);
  });

  test('does not flag small files', () => {
    const findings = detectAntiPatterns("body { font-family: 'Poppins', sans-serif; }", 'test.css');
    const singleFont = findings.filter(f => f.antipattern === 'single-font');
    expect(singleFont).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Typography: flat type hierarchy
// ---------------------------------------------------------------------------

describe('detectAntiPatterns — flat type hierarchy', () => {
  test('flags sizes that are too close together', () => {
    const content = `<style>
h1 { font-size: 18px; }
h2 { font-size: 16px; }
h3 { font-size: 15px; }
p { font-size: 14px; }
.small { font-size: 13px; }
</style>`;
    const findings = detectAntiPatterns(content, 'test.html').filter(f => f.antipattern === 'flat-type-hierarchy');
    expect(findings).toHaveLength(1);
    expect(findings[0].snippet).toContain('ratio');
  });

  test('passes good hierarchy', () => {
    const content = `<style>
h1 { font-size: 48px; }
h2 { font-size: 32px; }
h3 { font-size: 24px; }
p { font-size: 16px; }
.small { font-size: 12px; }
</style>`;
    const findings = detectAntiPatterns(content, 'test.html').filter(f => f.antipattern === 'flat-type-hierarchy');
    expect(findings).toHaveLength(0);
  });

  test('handles rem units', () => {
    const content = `<style>
h1 { font-size: 1.125rem; }
h2 { font-size: 1rem; }
p { font-size: 0.875rem; }
</style>`;
    const findings = detectAntiPatterns(content, 'test.html').filter(f => f.antipattern === 'flat-type-hierarchy');
    expect(findings).toHaveLength(1);
  });

  test('handles Tailwind text-* classes', () => {
    const content = '<div class="text-sm">small</div>\n<div class="text-base">base</div>\n<div class="text-lg">large</div>';
    const findings = detectAntiPatterns(content, 'test.html').filter(f => f.antipattern === 'flat-type-hierarchy');
    // 14px, 16px, 18px → ratio 1.3:1 → should flag
    expect(findings).toHaveLength(1);
  });

  test('passes Tailwind with wide range', () => {
    const content = '<div class="text-sm">small</div>\n<div class="text-base">base</div>\n<div class="text-4xl">heading</div>';
    const findings = detectAntiPatterns(content, 'test.html').filter(f => f.antipattern === 'flat-type-hierarchy');
    // 14px, 16px, 36px → ratio 2.6:1 → should pass
    expect(findings).toHaveLength(0);
  });

  test('ignores files with fewer than 3 sizes', () => {
    const content = '<style>\nh1 { font-size: 18px; }\np { font-size: 16px; }\n</style>';
    const findings = detectAntiPatterns(content, 'test.html').filter(f => f.antipattern === 'flat-type-hierarchy');
    expect(findings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Fixture files
// ---------------------------------------------------------------------------

describe('fixture file scanning', () => {
  test('should-flag.html detects side-tabs and accent borders', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'should-flag.html'), 'utf-8');
    const findings = detectAntiPatterns(content, 'should-flag.html');
    // Tailwind (5) + CSS (7) + top/bottom Tailwind (3) + top/bottom CSS (2)
    expect(findings.length).toBeGreaterThanOrEqual(13);
    expect(findings.some(f => f.antipattern === 'side-tab')).toBe(true);
    expect(findings.some(f => f.antipattern === 'border-accent-on-rounded')).toBe(true);
  });

  test('should-pass.html has zero findings', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'should-pass.html'), 'utf-8');
    const findings = detectAntiPatterns(content, 'should-pass.html');
    expect(findings).toHaveLength(0);
  });

  test('typography-should-flag.html detects all three font issues', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'typography-should-flag.html'), 'utf-8');
    const findings = detectAntiPatterns(content, 'typography-should-flag.html');
    expect(findings.some(f => f.antipattern === 'overused-font')).toBe(true);
    expect(findings.some(f => f.antipattern === 'single-font')).toBe(true);
    expect(findings.some(f => f.antipattern === 'flat-type-hierarchy')).toBe(true);
  });

  test('typography-should-pass.html has zero findings', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'typography-should-pass.html'), 'utf-8');
    const findings = detectAntiPatterns(content, 'typography-should-pass.html');
    expect(findings).toHaveLength(0);
  });

  test('legitimate-borders.html has minimal false positives', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'legitimate-borders.html'), 'utf-8');
    const findings = detectAntiPatterns(content, 'legitimate-borders.html');
    // Alert banner (colored left border on div) is an acceptable true positive
    // Blockquotes, nav, inputs, code spans, timeline (gray) should be skipped
    expect(findings.length).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Finding structure
// ---------------------------------------------------------------------------

describe('finding structure', () => {
  test('finding has all required fields', () => {
    const findings = detectAntiPatterns('<div class="border-l-4 border-blue-500">', 'app.html');
    expect(findings).toHaveLength(1);
    const f = findings[0];
    expect(f.antipattern).toBe('side-tab');
    expect(f.name).toBe('Side-tab accent border');
    expect(f.description).toBeTypeOf('string');
    expect(f.file).toBe('app.html');
    expect(f.line).toBe(1);
    expect(f.snippet).toBe('border-l-4');
  });

  test('reports correct line numbers', () => {
    const content = 'line 1\nline 2\n<div class="border-l-4">\nline 4';
    const findings = detectAntiPatterns(content, 'test.html');
    expect(findings).toHaveLength(1);
    expect(findings[0].line).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// ANTIPATTERNS registry
// ---------------------------------------------------------------------------

describe('ANTIPATTERNS registry', () => {
  test('has at least two entries', () => {
    expect(ANTIPATTERNS.length).toBeGreaterThanOrEqual(2);
  });

  test('each entry has required fields', () => {
    for (const ap of ANTIPATTERNS) {
      expect(ap.id).toBeTypeOf('string');
      expect(ap.name).toBeTypeOf('string');
      expect(ap.description).toBeTypeOf('string');
      const hasMatchers = ap.matchers && ap.matchers.length > 0;
      const hasAnalyzers = ap.analyzers && ap.analyzers.length > 0;
      expect(hasMatchers || hasAnalyzers).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Linked stylesheet detection (--deep mode)
// ---------------------------------------------------------------------------

describe('linked stylesheet detection', () => {
  test('regex mode MISSES anti-patterns from linked stylesheets', () => {
    const content = fs.readFileSync(path.join(FIXTURES, 'linked-stylesheet.html'), 'utf-8');
    const findings = detectAntiPatterns(content, path.join(FIXTURES, 'linked-stylesheet.html'));
    // Regex can't see into external-styles.css — finds nothing border-related
    const borderFindings = findings.filter(f => f.antipattern === 'side-tab' || f.antipattern === 'border-accent-on-rounded');
    expect(borderFindings).toHaveLength(0);
  });

  // These tests require jsdom — skip if not available
  const hasJsdom = (() => { try { require('jsdom'); return true; } catch { return false; } })();
  const jsdomTest = hasJsdom ? test : test.skip;

  jsdomTest('deep mode CATCHES side-tab from linked stylesheet', async () => {
    const { detectAntiPatternsDeep } = await import('../source/skills/critique/scripts/detect-antipatterns.mjs');
    const filePath = path.join(FIXTURES, 'linked-stylesheet.html');
    const findings = await detectAntiPatternsDeep(filePath);
    const sideTabs = findings.filter(f => f.antipattern === 'side-tab');
    expect(sideTabs.length).toBeGreaterThanOrEqual(1);
  });

  jsdomTest('deep mode CATCHES top accent from linked stylesheet', async () => {
    const { detectAntiPatternsDeep } = await import('../source/skills/critique/scripts/detect-antipatterns.mjs');
    const filePath = path.join(FIXTURES, 'linked-stylesheet.html');
    const findings = await detectAntiPatternsDeep(filePath);
    const accents = findings.filter(f => f.antipattern === 'border-accent-on-rounded');
    expect(accents.length).toBeGreaterThanOrEqual(1);
  });

  jsdomTest('deep mode does NOT flag clean card from linked stylesheet', async () => {
    const { detectAntiPatternsDeep } = await import('../source/skills/critique/scripts/detect-antipatterns.mjs');
    const filePath = path.join(FIXTURES, 'linked-stylesheet.html');
    const findings = await detectAntiPatternsDeep(filePath);
    // Should not flag the .external-clean card
    const cleanFindings = findings.filter(f => f.snippet && f.snippet.includes('clean'));
    expect(cleanFindings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// walkDir
// ---------------------------------------------------------------------------

describe('walkDir', () => {
  test('finds scannable files', () => {
    const files = walkDir(FIXTURES);
    expect(files.length).toBeGreaterThanOrEqual(3);
    expect(files.every(f => SCANNABLE_EXTENSIONS.has(path.extname(f)))).toBe(true);
  });

  test('returns empty array for nonexistent dir', () => {
    const files = walkDir('/nonexistent/path/12345');
    expect(files).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// CLI integration
// ---------------------------------------------------------------------------

describe('CLI', () => {
  function run(...args) {
    const result = spawnSync('node', [SCRIPT, ...args], {
      encoding: 'utf-8',
      timeout: 10000,
    });
    return { stdout: result.stdout || '', stderr: result.stderr || '', code: result.status };
  }

  test('--help exits 0 and shows usage', () => {
    const { stdout, code } = run('--help');
    expect(code).toBe(0);
    expect(stdout).toContain('Usage:');
  });

  test('clean file exits 0', () => {
    const { code } = run(path.join(FIXTURES, 'should-pass.html'));
    expect(code).toBe(0);
  });

  test('file with anti-patterns exits 2', () => {
    const { code, stderr } = run(path.join(FIXTURES, 'should-flag.html'));
    expect(code).toBe(2);
    expect(stderr).toContain('side-tab');
  });

  test('--json outputs valid JSON array', () => {
    const { stderr, code } = run('--json', path.join(FIXTURES, 'should-flag.html'));
    expect(code).toBe(2);
    const parsed = JSON.parse(stderr.trim());
    expect(parsed).toBeArray();
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0].antipattern).toBe('side-tab');
  });

  test('--json on clean file outputs empty array on stdout', () => {
    const { stdout, code } = run('--json', path.join(FIXTURES, 'should-pass.html'));
    expect(code).toBe(0);
    expect(JSON.parse(stdout.trim())).toEqual([]);
  });

  test('scans directory recursively', () => {
    const { code, stderr } = run(FIXTURES);
    expect(code).toBe(2);
    expect(stderr).toContain('anti-pattern');
  });

  test('warns on nonexistent path', () => {
    const { stderr } = run('/nonexistent/file/xyz.html');
    expect(stderr).toContain('Warning');
  });
});
