/**
 * Puppeteer-backed fixture tests for browser-only detection rules.
 *
 * Some detection rules (cramped-padding, line-length, tight-leading,
 * skipped-heading, justified-text, tiny-text, all-caps-body, wide-tracking,
 * small-target) need real browser layout — they read getBoundingClientRect
 * and getComputedStyle results that jsdom can't compute. Those rules can't
 * be tested with the jsdom suite in detect-antipatterns-fixtures.test.mjs.
 *
 * This file uses detectUrl() (Puppeteer) to load fixtures in headless Chrome
 * via a temporary static HTTP server, so the fixtures can use absolute
 * <script src="/js/..."> paths just like in development.
 *
 * Run via Node's built-in test runner:
 *   node --test tests/detect-antipatterns-browser.test.mjs
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectUrl } from '../src/detect-antipatterns.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = 8765;
const BASE = `http://localhost:${PORT}`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

let server;

before(async () => {
  // Static server: maps /fixtures/* to tests/fixtures/* and /js/* to public/js/*
  // (mirrors the routes in server/index.js so fixtures can use absolute paths)
  server = http.createServer((req, res) => {
    let filePath;
    if (req.url.startsWith('/fixtures/')) {
      filePath = path.join(ROOT, 'tests', req.url);
    } else if (req.url === '/js/detect-antipatterns-browser.js') {
      filePath = path.join(ROOT, 'src/detect-antipatterns-browser.js');
    } else {
      res.writeHead(404).end();
      return;
    }
    try {
      const body = fs.readFileSync(filePath);
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(PORT, resolve));
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('detectUrl — browser-only fixtures', () => {
  // Only two rules genuinely need real browser layout (getBoundingClientRect):
  //   line-length    → reads rect.width to compute chars-per-line
  //   cramped-padding → reads rect.width/height to filter small badges
  // Everything else in the quality.html fixture runs in jsdom and is asserted
  // by tests/detect-antipatterns-fixtures.test.mjs.

  it('cramped-padding: flag column triggers, small-pill case is currently a known false positive', async () => {
    const f = await detectUrl(`${BASE}/fixtures/antipatterns/cramped-padding.html`);
    const cramped = f.filter(r => r.antipattern === 'cramped-padding');
    // Flag column: 2 obvious cramped containers (4px and 2px padding).
    // Pass column: 1 finding from the .detection-cmd-style small pill —
    // currently a false positive that the user is deciding what to do with.
    // Total = 3. When the rule is relaxed for small inline pills, expect 2.
    assert.equal(cramped.length, 3, `expected 3 cramped-padding findings (2 flag + 1 disputed pill), got ${cramped.length}`);
  });

  it('line-length: flag column triggers, pass column adds none', async () => {
    const f = await detectUrl(`${BASE}/fixtures/antipatterns/quality.html`);
    assert.equal(f.filter(r => r.antipattern === 'line-length').length, 1);
  });
});
