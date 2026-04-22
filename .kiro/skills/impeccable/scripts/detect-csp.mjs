/**
 * Scan a project tree for Content-Security-Policy signals and classify the
 * shape so the agent knows which patch template to propose.
 *
 * Used at first-time `live.mjs` setup. Mechanical (grep-based) — no network,
 * no dev server, no JS evaluation. The classification drives a user-facing
 * consent prompt; the agent does the actual patch writing.
 *
 * Shape taxonomy:
 *   - "shared-helper":  monorepo with a `createBaseNextConfig`-style helper
 *                       that accepts `additionalScriptSrc`/`additionalConnectSrc`
 *                       arrays. Patch the app's config to append a dev-only
 *                       localhost entry to those arrays.
 *   - "inline-headers": Content-Security-Policy built inline in a Next/Nuxt/
 *                       SvelteKit config's headers() function with a literal
 *                       value string. Patch the CSP string in place.
 *   - "middleware":     CSP set in middleware.{ts,js}. Detected but not
 *                       auto-patched in v1.
 *   - "meta-tag":       <meta http-equiv="Content-Security-Policy"> in layout
 *                       files. Detected but not auto-patched in v1.
 *   - null:             no CSP signals found; no patch needed.
 */

import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  '.svelte-kit',
  '.nuxt',
  '.astro',
  'dist',
  'build',
  'out',
  '.vercel',
]);

const SCAN_EXTS = new Set(['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.tsx', '.jsx']);
const LAYOUT_EXTS = new Set(['.tsx', '.jsx', '.astro', '.vue', '.svelte', '.html']);
const MAX_DEPTH = 6;
const MAX_READ_BYTES = 64 * 1024;

const SHARED_HELPER_SIGNALS = [
  /\bbuildCSPConfig\b/,
  /\bbuildSecurityHeaders\b/,
  /\badditionalScriptSrc\b/,
  /\badditionalConnectSrc\b/,
  /\bcreateBaseNextConfig\b/,
];

const INLINE_HEADER_SIGNALS = [
  /["']Content-Security-Policy["']/i,
  /\bscript-src\b/,
  /\bconnect-src\b/,
];

const MIDDLEWARE_HINT = /headers\.set\(\s*["']Content-Security-Policy["']/i;
const META_TAG_HINT = /http-equiv\s*=\s*["']Content-Security-Policy["']/i;

/**
 * @param {string} cwd Project root.
 * @returns {{ shape: string|null, signals: string[] }}
 */
export function detectCsp(cwd = process.cwd()) {
  const hits = { sharedHelper: [], inlineHeader: [], middleware: [], metaTag: [] };

  walk(cwd, cwd, 0, (absPath, relPath, body) => {
    const ext = path.extname(absPath);
    const base = path.basename(absPath).toLowerCase();

    // Shared helper: package exports, config factory
    if (SCAN_EXTS.has(ext)) {
      const matched = SHARED_HELPER_SIGNALS.some((re) => re.test(body));
      const looksShared = /packages\/[^/]+\/src\/.*(config|next-config|security)/.test(relPath);
      if (matched && looksShared) {
        hits.sharedHelper.push(relPath);
      }
    }

    // Inline headers: Next/Nuxt/SvelteKit/Astro/Vite config files
    if (SCAN_EXTS.has(ext) && /(^|\/)(next|nuxt|vite|astro|svelte)\.config\./.test(relPath)) {
      const allInlineMatch = INLINE_HEADER_SIGNALS.every((re) => re.test(body));
      if (allInlineMatch) {
        hits.inlineHeader.push(relPath);
      }
    }

    // Middleware CSP: middleware.{ts,js} at project root or app/
    if ((base === 'middleware.ts' || base === 'middleware.js' || base === 'middleware.mjs') &&
        MIDDLEWARE_HINT.test(body)) {
      hits.middleware.push(relPath);
    }

    // Meta tag CSP: layouts / HTML files
    if (LAYOUT_EXTS.has(ext) && META_TAG_HINT.test(body)) {
      hits.metaTag.push(relPath);
    }
  });

  // Classification priority: shared-helper > inline-headers > middleware > meta-tag.
  // A monorepo with a shared helper is always that shape, even if an individual
  // app file also happens to contain a CSP literal.
  if (hits.sharedHelper.length > 0) {
    return {
      shape: 'shared-helper',
      signals: hits.sharedHelper,
    };
  }
  if (hits.inlineHeader.length > 0) {
    return {
      shape: 'inline-headers',
      signals: hits.inlineHeader,
    };
  }
  if (hits.middleware.length > 0) {
    return {
      shape: 'middleware',
      signals: hits.middleware,
    };
  }
  if (hits.metaTag.length > 0) {
    return {
      shape: 'meta-tag',
      signals: hits.metaTag,
    };
  }
  return { shape: null, signals: [] };
}

function walk(root, dir, depth, visit) {
  if (depth > MAX_DEPTH) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(root, abs, depth + 1, visit);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (!SCAN_EXTS.has(ext) && !LAYOUT_EXTS.has(ext)) continue;
    let body;
    try {
      const fd = fs.openSync(abs, 'r');
      try {
        const buf = Buffer.alloc(MAX_READ_BYTES);
        const n = fs.readSync(fd, buf, 0, MAX_READ_BYTES, 0);
        body = buf.slice(0, n).toString('utf-8');
      } finally { fs.closeSync(fd); }
    } catch { continue; }
    visit(abs, path.relative(root, abs), body);
  }
}

// CLI mode
const _running = process.argv[1];
if (_running?.endsWith('detect-csp.mjs') || _running?.endsWith('detect-csp.mjs/')) {
  const result = detectCsp(process.cwd());
  console.log(JSON.stringify(result, null, 2));
}
