/**
 * Tests for the live-wrap CLI helper.
 * Run with: node --test tests/live-wrap.test.mjs
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

import {
  buildSearchQueries,
  findElement,
  findClosingLine,
  detectCommentSyntax,
} from '../source/skills/impeccable/scripts/live-wrap.mjs';

// ---------------------------------------------------------------------------
// Unit tests: pure functions
// ---------------------------------------------------------------------------

describe('detectCommentSyntax', () => {
  it('returns HTML comments for .html files', () => {
    const result = detectCommentSyntax('index.html');
    assert.equal(result.open, '<!--');
    assert.equal(result.close, '-->');
  });

  it('returns JSX comments for .jsx files', () => {
    const result = detectCommentSyntax('App.jsx');
    assert.equal(result.open, '{/*');
    assert.equal(result.close, '*/}');
  });

  it('returns JSX comments for .tsx files', () => {
    const result = detectCommentSyntax('component.tsx');
    assert.equal(result.open, '{/*');
    assert.equal(result.close, '*/}');
  });

  it('returns HTML comments for .vue files', () => {
    const result = detectCommentSyntax('App.vue');
    assert.equal(result.open, '<!--');
    assert.equal(result.close, '-->');
  });

  it('returns HTML comments for .svelte files', () => {
    const result = detectCommentSyntax('Page.svelte');
    assert.equal(result.open, '<!--');
    assert.equal(result.close, '-->');
  });
});

describe('buildSearchQueries', () => {
  it('prioritizes ID over classes', () => {
    const queries = buildSearchQueries('hero', 'hero-section,dark', 'section', null);
    assert.equal(queries[0], 'id="hero"');
  });

  it('includes full class match for multi-class elements', () => {
    const queries = buildSearchQueries(null, 'hero-section,dark-theme', 'div', null);
    assert.ok(queries.some(q => q === 'class="hero-section dark-theme"'));
  });

  it('includes the most distinctive single class (longest)', () => {
    const queries = buildSearchQueries(null, 'btn,hero-combined-left', null, null);
    assert.ok(queries.some(q => q === 'hero-combined-left'));
  });

  it('includes tag+class combo', () => {
    const queries = buildSearchQueries(null, 'hero-section', 'section', null);
    assert.ok(queries.some(q => q === '<section class="hero-section'));
  });

  it('includes raw fallback query', () => {
    const queries = buildSearchQueries(null, null, null, 'Welcome to our app');
    assert.deepEqual(queries, ['Welcome to our app']);
  });

  it('returns all query types when everything is provided', () => {
    const queries = buildSearchQueries('main', 'container,wide', 'div', 'fallback');
    assert.ok(queries.length >= 4);
    assert.equal(queries[0], 'id="main"');
    assert.ok(queries.includes('fallback'));
  });
});

describe('findElement', () => {
  it('finds an element by class name', () => {
    const lines = [
      '<html>',
      '<body>',
      '  <div class="hero">',
      '    <h1>Hello</h1>',
      '  </div>',
      '</body>',
      '</html>',
    ];
    const result = findElement(lines, 'hero');
    assert.ok(result);
    assert.equal(result.startLine, 2);
    assert.equal(result.endLine, 4);
  });

  it('finds an element by ID', () => {
    const lines = [
      '<section id="features">',
      '  <p>Content</p>',
      '</section>',
    ];
    const result = findElement(lines, 'id="features"');
    assert.ok(result);
    assert.equal(result.startLine, 0);
    assert.equal(result.endLine, 2);
  });

  it('returns null when element is not found', () => {
    const lines = ['<div>hello</div>'];
    const result = findElement(lines, 'nonexistent');
    assert.equal(result, null);
  });

  it('skips comments containing the query', () => {
    const lines = [
      '<!-- hero section -->',
      '<div class="hero">',
      '  <p>Content</p>',
      '</div>',
    ];
    const result = findElement(lines, 'hero');
    assert.ok(result);
    assert.equal(result.startLine, 1); // skips the comment on line 0
  });

  it('skips lines that contain data-impeccable-variant', () => {
    const lines = [
      '<div class="hero" data-impeccable-variant="original">Old</div>',
      '<div class="hero">Real</div>',
    ];
    const result = findElement(lines, 'hero');
    assert.ok(result);
    assert.equal(result.startLine, 1);
  });
});

describe('findClosingLine', () => {
  it('finds the closing tag on the same line', () => {
    const lines = ['<p>Hello</p>'];
    assert.equal(findClosingLine(lines, 0), 0);
  });

  it('finds the closing tag across multiple lines', () => {
    const lines = [
      '<div>',
      '  <p>Hello</p>',
      '</div>',
    ];
    assert.equal(findClosingLine(lines, 0), 2);
  });

  it('handles nested tags of the same type', () => {
    const lines = [
      '<div class="outer">',
      '  <div class="inner">',
      '    <p>Content</p>',
      '  </div>',
      '</div>',
    ];
    assert.equal(findClosingLine(lines, 0), 4);
  });

  it('handles deeply nested structures', () => {
    const lines = [
      '<section>',
      '  <div>',
      '    <div>',
      '      <span>text</span>',
      '    </div>',
      '  </div>',
      '</section>',
    ];
    assert.equal(findClosingLine(lines, 0), 6);
  });

  it('handles self-closing tags', () => {
    const lines = [
      '<div>',
      '  <img src="test.png" />',
      '  <br />',
      '</div>',
    ];
    assert.equal(findClosingLine(lines, 0), 3);
  });
});

// ---------------------------------------------------------------------------
// Integration tests: full wrap CLI on fixture files
// ---------------------------------------------------------------------------

describe('wrapCli integration', () => {
  let tmp;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'impeccable-wrap-test-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('wraps an HTML element by class name', () => {
    const html = `<!DOCTYPE html>
<html>
<body>
  <div class="hero-section">
    <h1>Hello World</h1>
    <p>Welcome to our site.</p>
  </div>
</body>
</html>`;
    writeFileSync(join(tmp, 'index.html'), html);

    const result = JSON.parse(execSync(
      `node source/skills/impeccable/scripts/live-wrap.mjs --id test123 --count 3 --classes "hero-section" --file "${join(tmp, 'index.html')}"`,
      { cwd: process.cwd(), encoding: 'utf-8' }
    ));

    // The file path is relative to cwd, so it may be a relative path to the tmp dir
    assert.ok(result.file.endsWith('index.html'));
    assert.ok(result.insertLine > 0);
    assert.equal(result.commentSyntax.open, '<!--');

    // Verify the file was modified correctly
    const modified = readFileSync(join(tmp, 'index.html'), 'utf-8');
    assert.ok(modified.includes('data-impeccable-variants="test123"'));
    assert.ok(modified.includes('data-impeccable-variant-count="3"'));
    assert.ok(modified.includes('data-impeccable-variant="original"'));
    assert.ok(modified.includes('display: contents'));
    assert.ok(modified.includes('impeccable-variants-start test123'));
    assert.ok(modified.includes('impeccable-variants-end test123'));
    // Original should NOT be hidden (stays visible until variants arrive)
    assert.ok(!modified.includes('data-impeccable-variant="original" style="display: none"'));
  });

  it('wraps a JSX element and uses JSX comment syntax', () => {
    const jsx = `export default function App() {
  return (
    <main>
      <section className="hero">
        <h1>Hello</h1>
      </section>
    </main>
  );
}`;
    writeFileSync(join(tmp, 'App.jsx'), jsx);

    const result = JSON.parse(execSync(
      `node source/skills/impeccable/scripts/live-wrap.mjs --id jsx123 --count 2 --classes "hero" --file "${join(tmp, 'App.jsx')}"`,
      { cwd: process.cwd(), encoding: 'utf-8' }
    ));

    assert.equal(result.commentSyntax.open, '{/*');
    assert.equal(result.commentSyntax.close, '*/}');

    const modified = readFileSync(join(tmp, 'App.jsx'), 'utf-8');
    assert.ok(modified.includes('{/* impeccable-variants-start jsx123'));
    assert.ok(modified.includes('data-impeccable-variant-count="2"'));
  });

  it('finds element by ID when --element-id is used', () => {
    const html = `<html><body>
<div id="pricing">
  <h2>Pricing</h2>
  <p>Plans start at $10/mo.</p>
</div>
</body></html>`;
    writeFileSync(join(tmp, 'page.html'), html);

    const result = JSON.parse(execSync(
      `node source/skills/impeccable/scripts/live-wrap.mjs --id id123 --count 2 --element-id "pricing" --file "${join(tmp, 'page.html')}"`,
      { cwd: process.cwd(), encoding: 'utf-8' }
    ));

    const modified = readFileSync(join(tmp, 'page.html'), 'utf-8');
    assert.ok(modified.includes('data-impeccable-variants="id123"'));
    // The original pricing div should be inside the wrapper
    assert.ok(modified.includes('id="pricing"'));
  });

  it('exits with error when element is not found', () => {
    writeFileSync(join(tmp, 'empty.html'), '<html><body><p>No match here</p></body></html>');

    try {
      execSync(
        `node source/skills/impeccable/scripts/live-wrap.mjs --id err123 --count 2 --classes "nonexistent" --file "${join(tmp, 'empty.html')}"`,
        { cwd: process.cwd(), encoding: 'utf-8', stdio: 'pipe' }
      );
      assert.fail('Should have exited with error');
    } catch (err) {
      assert.ok(err.status !== 0, 'Should exit with non-zero status');
      assert.ok(err.stderr.includes('error') || err.stderr.includes('Could not'), 'Should print error message');
    }
  });

  it('preserves surrounding content when wrapping', () => {
    const html = `<div class="before">Before</div>
<div class="target">
  <span>Target content</span>
</div>
<div class="after">After</div>`;
    writeFileSync(join(tmp, 'preserve.html'), html);

    execSync(
      `node source/skills/impeccable/scripts/live-wrap.mjs --id pres123 --count 2 --classes "target" --file "${join(tmp, 'preserve.html')}"`,
      { cwd: process.cwd(), encoding: 'utf-8' }
    );

    const modified = readFileSync(join(tmp, 'preserve.html'), 'utf-8');
    assert.ok(modified.includes('class="before"'));
    assert.ok(modified.includes('class="after"'));
    assert.ok(modified.includes('data-impeccable-variants="pres123"'));
  });
});
