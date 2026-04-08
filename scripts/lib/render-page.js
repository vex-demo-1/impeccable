/**
 * Page template wrapper for generated sub-pages.
 *
 * Reads the shared site header partial once and wraps content bodies with
 * a minimal HTML scaffold that imports tokens.css + sub-pages.css.
 *
 * Used by scripts/build-sub-pages.js (wired up in commit 3).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const HEADER_PARTIAL = path.join(ROOT_DIR, 'content', 'site', 'partials', 'header.html');

let cachedHeader = null;

/**
 * Read the shared site header partial.
 * Cached after first read.
 */
export function readHeaderPartial() {
  if (cachedHeader === null) {
    cachedHeader = fs.readFileSync(HEADER_PARTIAL, 'utf8').trim();
  }
  return cachedHeader;
}

/**
 * Mark a nav item as current by adding aria-current="page" and removing
 * the default nav href state. Matches on `data-nav="{activeNav}"`.
 *
 * @param {string} headerHtml
 * @param {string} activeNav - one of: home, skills, anti-patterns, tutorials, gallery, github
 * @returns {string}
 */
export function applyActiveNav(headerHtml, activeNav) {
  if (!activeNav) return headerHtml;
  return headerHtml.replace(
    new RegExp(`data-nav="${activeNav}"`, 'g'),
    `data-nav="${activeNav}" aria-current="page"`,
  );
}

/**
 * Wrap body HTML in a full page shell.
 *
 * @param {object} opts
 * @param {string}   opts.title         - <title> text
 * @param {string}   opts.description   - meta description
 * @param {string}   opts.bodyHtml      - main content HTML (will be placed inside <main>)
 * @param {string}   [opts.activeNav]   - which nav item to mark current
 * @param {string}   [opts.canonicalPath] - relative URL path for <link rel="canonical">
 * @param {string}   [opts.extraHead]   - raw HTML to inject into <head>
 * @param {string}   [opts.bodyClass]   - optional class on <body>
 * @param {number}   [opts.assetDepth]  - how many `..` to prepend for Bun's HTML loader to resolve on-disk paths. 1 = page is one dir deep under public/ (e.g. public/skills/polish.html). Defaults to 1.
 * @returns {string} full HTML document
 */
export function renderPage({
  title,
  description,
  bodyHtml,
  activeNav,
  canonicalPath,
  extraHead = '',
  bodyClass = 'sub-page',
  assetDepth = 1,
}) {
  const header = applyActiveNav(readHeaderPartial(), activeNav);
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeAttr(description || '');
  const canonical = canonicalPath
    ? `<link rel="canonical" href="https://impeccable.style${canonicalPath}">`
    : '';

  // Relative prefix for on-disk resolution by Bun's HTML loader.
  // Bun rewrites these to hashed absolute URLs at build time, so runtime
  // serving works regardless of the request path.
  const rel = assetDepth > 0 ? '../'.repeat(assetDepth) : './';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}">
  <meta name="theme-color" content="#fafafa">
  ${canonical}
  <link rel="icon" type="image/svg+xml" href="${rel}favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Instrument+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${rel}css/sub-pages.css">
  ${extraHead}
</head>
<body class="${bodyClass}">
  <a href="#main" class="skip-link">Skip to content</a>
  ${header}
  <main id="main">
${bodyHtml}
  </main>
  <script>
    // Copy buttons on rendered code blocks
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-copy]');
      if (!btn) return;
      const text = btn.getAttribute('data-copy');
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        btn.classList.add('is-copied');
        setTimeout(() => btn.classList.remove('is-copied'), 1500);
      }).catch(() => {});
    });
  </script>
</body>
</html>
`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return String(str || '').replace(/"/g, '&quot;');
}
