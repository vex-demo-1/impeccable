#!/usr/bin/env node

/**
 * Anti-Pattern Detector for Impeccable
 *
 * Scans files/directories for known UI anti-patterns (starting with "side-tab").
 * Used by the critique skill and as a future hook.
 *
 * Usage:
 *   node detect-antipatterns.mjs [file-or-dir...]   # scan files/dirs
 *   node detect-antipatterns.mjs                     # scan cwd
 *   node detect-antipatterns.mjs --json              # JSON output
 *   echo '{"tool_input":{"file_path":"f.html"}}' | node detect-antipatterns.mjs  # stdin
 *
 * Exit codes: 0 = clean, 2 = findings
 */

import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Line-level context helpers
// ---------------------------------------------------------------------------

/** Check if Tailwind `rounded-*` appears on the same line */
const hasRounded = (line) => /\brounded(?:-\w+)?\b/.test(line);

/** Check if CSS `border-radius` appears on the same line (inline styles) */
const hasBorderRadius = (line) => /border-radius/i.test(line);

/** Check if line contains an HTML element that legitimately uses side borders */
const SAFE_ELEMENTS = /<(?:blockquote|nav[\s>]|pre[\s>]|code[\s>]|a\s|input[\s>]|span[\s>])/i;
const isSafeElement = (line) => SAFE_ELEMENTS.test(line);

/** Check if the border color in a CSS declaration looks neutral (gray/structural) */
function isNeutralBorderColor(matchStr) {
  const colorMatch = matchStr.match(/solid\s+(#[0-9a-f]{3,8}|rgba?\([^)]+\)|\w+)/i);
  if (!colorMatch) return false;
  const c = colorMatch[1].toLowerCase();
  if (['gray', 'grey', 'silver', 'white', 'black', 'transparent', 'currentcolor'].includes(c)) return true;
  const hex = c.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/);
  if (hex) {
    const [r, g, b] = [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
    return (Math.max(r, g, b) - Math.min(r, g, b)) < 30;
  }
  const shex = c.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (shex) {
    const [r, g, b] = [parseInt(shex[1] + shex[1], 16), parseInt(shex[2] + shex[2], 16), parseInt(shex[3] + shex[3], 16)];
    return (Math.max(r, g, b) - Math.min(r, g, b)) < 30;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Anti-pattern definitions
// ---------------------------------------------------------------------------

const ANTIPATTERNS = [
  {
    id: 'side-tab',
    name: 'Side-tab accent border',
    description:
      'Thick colored border on one side of a card — the most recognizable tell of AI-generated UIs. Use a subtler accent or remove it entirely.',
    matchers: [
      // Tailwind: border-[lrse]-N — threshold depends on context
      //   With rounded: any N >= 1 (even thin borders look wrong on rounded cards)
      //   Without rounded: N >= 4 (thick enough to always be suspicious)
      {
        regex: /\bborder-[lrse]-(\d+)\b/g,
        test: (match, line) => {
          const n = parseInt(match[1], 10);
          if (hasRounded(line)) return n >= 1;
          return n >= 4;
        },
        format: (match) => match[0],
      },
      // CSS shorthand: border-left/right: Npx solid [color]
      {
        regex: /border-(?:left|right)\s*:\s*(\d+)px\s+solid[^;]*/gi,
        test: (match, line) => {
          if (isSafeElement(line)) return false;
          if (isNeutralBorderColor(match[0])) return false;
          const n = parseInt(match[1], 10);
          if (hasBorderRadius(line)) return n >= 1;
          return n >= 3;
        },
        format: (match) => match[0].replace(/\s*;?\s*$/, ''),
      },
      // CSS longhand: border-left/right-width: Npx
      {
        regex: /border-(?:left|right)-width\s*:\s*(\d+)px/gi,
        test: (match, line) => {
          if (isSafeElement(line)) return false;
          const n = parseInt(match[1], 10);
          return n >= 3;
        },
        format: (match) => match[0],
      },
      // CSS logical: border-inline-start/end: Npx solid
      {
        regex: /border-inline-(?:start|end)\s*:\s*(\d+)px\s+solid/gi,
        test: (match, line) => {
          if (isSafeElement(line)) return false;
          const n = parseInt(match[1], 10);
          return n >= 3;
        },
        format: (match) => match[0],
      },
      // CSS logical longhand: border-inline-start/end-width: Npx
      {
        regex: /border-inline-(?:start|end)-width\s*:\s*(\d+)px/gi,
        test: (match, line) => {
          if (isSafeElement(line)) return false;
          const n = parseInt(match[1], 10);
          return n >= 3;
        },
        format: (match) => match[0],
      },
      // JSX inline: borderLeft/borderRight with thickness
      {
        regex: /border(?:Left|Right)\s*[:=]\s*["'`](\d+)px\s+solid/g,
        test: (match) => parseInt(match[1], 10) >= 3,
        format: (match) => match[0],
      },
    ],
  },
  {
    id: 'border-accent-on-rounded',
    name: 'Border accent on rounded element',
    description:
      'Thick accent border on a rounded card — the border clashes with the rounded corners. Remove the border or the border-radius.',
    matchers: [
      // Tailwind: border-[tb]-N + rounded-* on same line
      {
        regex: /\bborder-[tb]-(\d+)\b/g,
        test: (match, line) => {
          const n = parseInt(match[1], 10);
          return hasRounded(line) && n >= 1;
        },
        format: (match) => match[0],
      },
      // CSS: border-top/bottom with border-radius on same line (inline styles)
      {
        regex: /border-(?:top|bottom)\s*:\s*(\d+)px\s+solid/gi,
        test: (match, line) => {
          const n = parseInt(match[1], 10);
          return n >= 3 && hasBorderRadius(line);
        },
        format: (match) => match[0],
      },
    ],
  },
  // -------------------------------------------------------------------------
  // Typography anti-patterns
  // -------------------------------------------------------------------------
  {
    id: 'overused-font',
    name: 'Overused font',
    description:
      'Inter, Roboto, Open Sans, Lato, Montserrat, and Arial are used on millions of sites. Choose a distinctive font that gives your interface personality.',
    matchers: [
      // CSS font-family: 'Inter' as primary (first) font
      {
        regex: /font-family\s*:\s*['"]?(Inter|Roboto|Open Sans|Lato|Montserrat|Arial|Helvetica)\b/gi,
        test: () => true,
        format: (match) => match[0],
      },
      // Google Fonts import/link
      {
        regex: /fonts\.googleapis\.com\/css2?\?family=(Inter|Roboto|Open\+Sans|Lato|Montserrat)\b/gi,
        test: () => true,
        format: (match) => `Google Fonts: ${match[1].replace(/\+/g, ' ')}`,
      },
    ],
  },
  {
    id: 'single-font',
    name: 'Single font for everything',
    description:
      'Only one font family is used for the entire page. Pair a distinctive display font with a refined body font to create typographic hierarchy.',
    analyzers: [
      (content, filePath) => {
        // Extract all font names from font-family declarations
        const fontFamilyRe = /font-family\s*:\s*([^;}]+)/gi;
        const GENERIC = new Set([
          'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
          'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded',
          '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'inherit', 'initial', 'unset',
        ]);
        const fonts = new Set();
        let m;
        while ((m = fontFamilyRe.exec(content)) !== null) {
          // Extract individual font names from the stack
          const stack = m[1].split(',').map(f => f.trim().replace(/^['"]|['"]$/g, '').toLowerCase());
          for (const f of stack) {
            if (f && !GENERIC.has(f)) fonts.add(f);
          }
        }

        // Also extract from Google Fonts imports
        const gfRe = /fonts\.googleapis\.com\/css2?\?family=([^&"'\s]+)/gi;
        while ((m = gfRe.exec(content)) !== null) {
          const families = m[1].split('|').map(f => f.split(':')[0].replace(/\+/g, ' ').toLowerCase());
          for (const f of families) fonts.add(f);
        }

        // Only flag if the file has meaningful content and exactly 1 font
        if (fonts.size !== 1) return [];
        // Don't flag tiny files (likely components)
        const lineCount = content.split('\n').length;
        if (lineCount < 20) return [];

        const fontName = [...fonts][0];
        // Find the first line where this font appears for reporting
        const lines = content.split('\n');
        let reportLine = 1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(fontName)) {
            reportLine = i + 1;
            break;
          }
        }

        return [{
          antipattern: 'single-font',
          name: 'Single font for everything',
          description: 'Only one font family is used for the entire page. Pair a distinctive display font with a refined body font to create typographic hierarchy.',
          file: filePath,
          line: reportLine,
          snippet: `Only font: ${fontName}`,
        }];
      },
    ],
  },
  {
    id: 'flat-type-hierarchy',
    name: 'Flat type hierarchy',
    description:
      'Font sizes are too close together — no clear visual hierarchy. Use fewer sizes with more contrast (aim for at least a 1.25 ratio between steps).',
    analyzers: [
      (content, filePath) => {
        // Collect all font-size values and convert to px
        const sizes = new Set();
        const REM_BASE = 16;
        const lines = content.split('\n');

        // CSS font-size declarations
        const sizeRe = /font-size\s*:\s*([\d.]+)(px|rem|em)\b/gi;
        let m;
        while ((m = sizeRe.exec(content)) !== null) {
          const val = parseFloat(m[1]);
          const unit = m[2].toLowerCase();
          const px = unit === 'px' ? val : val * REM_BASE;
          if (px > 0 && px < 200) sizes.add(Math.round(px * 10) / 10);
        }

        // clamp() — extract min and max
        const clampRe = /font-size\s*:\s*clamp\(\s*([\d.]+)(px|rem|em)\s*,\s*[^,]+,\s*([\d.]+)(px|rem|em)\s*\)/gi;
        while ((m = clampRe.exec(content)) !== null) {
          const minVal = parseFloat(m[1]);
          const minUnit = m[2].toLowerCase();
          const maxVal = parseFloat(m[3]);
          const maxUnit = m[4].toLowerCase();
          sizes.add(Math.round((minUnit === 'px' ? minVal : minVal * REM_BASE) * 10) / 10);
          sizes.add(Math.round((maxUnit === 'px' ? maxVal : maxVal * REM_BASE) * 10) / 10);
        }

        // Tailwind text-* classes → approximate px values
        const TW_SIZES = {
          'text-xs': 12, 'text-sm': 14, 'text-base': 16, 'text-lg': 18,
          'text-xl': 20, 'text-2xl': 24, 'text-3xl': 30, 'text-4xl': 36,
          'text-5xl': 48, 'text-6xl': 60, 'text-7xl': 72, 'text-8xl': 96, 'text-9xl': 128,
        };
        for (const [cls, px] of Object.entries(TW_SIZES)) {
          const twRe = new RegExp(`\\b${cls}\\b`);
          if (twRe.test(content)) sizes.add(px);
        }

        // Need at least 3 distinct sizes to evaluate hierarchy
        if (sizes.size < 3) return [];

        const sorted = [...sizes].sort((a, b) => a - b);
        const ratio = sorted[sorted.length - 1] / sorted[0];

        // A healthy hierarchy has at least 2x range (e.g., 14px body to 36px heading)
        if (ratio >= 2.0) return [];

        // Find line to report on (first font-size declaration)
        let reportLine = 1;
        for (let i = 0; i < lines.length; i++) {
          if (/font-size/i.test(lines[i]) || /\btext-(?:xs|sm|base|lg|xl|\d)/i.test(lines[i])) {
            reportLine = i + 1;
            break;
          }
        }

        return [{
          antipattern: 'flat-type-hierarchy',
          name: 'Flat type hierarchy',
          description: 'Font sizes are too close together — no clear visual hierarchy. Use fewer sizes with more contrast (aim for at least a 1.25 ratio between steps).',
          file: filePath,
          line: reportLine,
          snippet: `Sizes: ${sorted.map(s => s + 'px').join(', ')} (ratio ${ratio.toFixed(1)}:1)`,
        }];
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Detection engine
// ---------------------------------------------------------------------------

/**
 * Scan content for anti-patterns.
 * @param {string} content  File content
 * @param {string} filePath File path (for reporting)
 * @returns {Array<{antipattern: string, name: string, description: string, file: string, line: number, snippet: string}>}
 */
function detectAntiPatterns(content, filePath) {
  const findings = [];
  const lines = content.split('\n');

  for (const ap of ANTIPATTERNS) {
    // Line-level matchers
    if (ap.matchers) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const matcher of ap.matchers) {
          // Reset regex state for each line
          matcher.regex.lastIndex = 0;
          let m;
          while ((m = matcher.regex.exec(line)) !== null) {
            if (matcher.test(m, line)) {
              findings.push({
                antipattern: ap.id,
                name: ap.name,
                description: ap.description,
                file: filePath,
                line: i + 1,
                snippet: matcher.format(m),
              });
            }
          }
        }
      }
    }

    // File-level analyzers
    if (ap.analyzers) {
      for (const analyzer of ap.analyzers) {
        findings.push(...analyzer(content, filePath));
      }
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Deep detection (jsdom / Puppeteer — computed styles)
// ---------------------------------------------------------------------------

const SAFE_TAGS_DEEP = new Set([
  'blockquote', 'nav', 'a', 'input', 'textarea', 'select',
  'pre', 'code', 'span', 'th', 'td', 'tr', 'li', 'label',
  'button', 'hr', 'html', 'head', 'body', 'script', 'style',
  'link', 'meta', 'title', 'br', 'img', 'svg', 'path',
]);

/**
 * Analyze a single DOM element using computed styles.
 * Works with both jsdom window and Puppeteer page.
 */
function analyzeElementDeep(el, computedStyle, filePath) {
  const findings = [];
  const tag = el.tagName.toLowerCase();
  if (SAFE_TAGS_DEEP.has(tag)) return findings;

  const sides = ['Top', 'Right', 'Bottom', 'Left'];
  const widths = {};
  const colors = {};
  for (const s of sides) {
    widths[s] = parseFloat(computedStyle[`border${s}Width`]) || 0;
    colors[s] = computedStyle[`border${s}Color`] || '';
  }
  const radius = parseFloat(computedStyle.borderRadius) || 0;
  const fontSize = parseFloat(computedStyle.fontSize) || 0;
  const fontFamily = computedStyle.fontFamily || '';

  // --- Border accent detection ---
  for (const side of sides) {
    const w = widths[side];
    if (w < 1) continue;

    // Check if border color is transparent
    const color = colors[side];
    if (!color || color === 'transparent' || /rgba\([^)]*,\s*0\)/.test(color)) continue;

    // Check if neutral (gray)
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [r, g, b] = [+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]];
      if (Math.max(r, g, b) - Math.min(r, g, b) < 30) continue;
    }

    const otherSides = sides.filter(s => s !== side);
    const maxOther = Math.max(...otherSides.map(s => widths[s]));
    const isAccent = w >= 2 && (maxOther <= 1 || w >= maxOther * 2);
    if (!isAccent) continue;

    const isSide = side === 'Left' || side === 'Right';
    const sideName = side.toLowerCase();

    if (isSide) {
      if (radius > 0) {
        findings.push({ antipattern: 'side-tab', name: 'Side-tab accent border', description: ANTIPATTERNS[0].description, file: filePath, line: 0, snippet: `border-${sideName}: ${w}px + border-radius: ${radius}px` });
      } else if (w >= 3) {
        findings.push({ antipattern: 'side-tab', name: 'Side-tab accent border', description: ANTIPATTERNS[0].description, file: filePath, line: 0, snippet: `border-${sideName}: ${w}px` });
      }
    } else {
      if (radius > 0 && w >= 2) {
        findings.push({ antipattern: 'border-accent-on-rounded', name: 'Border accent on rounded element', description: ANTIPATTERNS[1].description, file: filePath, line: 0, snippet: `border-${sideName}: ${w}px + border-radius: ${radius}px` });
      }
    }
  }

  return findings;
}

/**
 * Deep scan using jsdom — resolves linked stylesheets, computes styles.
 * @param {string} filePath  Path to an HTML file
 * @returns {Promise<Array>} findings
 */
async function detectAntiPatternsDeep(filePath) {
  let JSDOM;
  try {
    ({ JSDOM } = await import('jsdom'));
  } catch {
    throw new Error('jsdom is required for --deep mode. Install it: npm install jsdom');
  }

  const html = fs.readFileSync(filePath, 'utf-8');
  const resolvedPath = path.resolve(filePath);
  const fileDir = path.dirname(resolvedPath);

  // Resolve linked stylesheets and inline them
  let processedHtml = html;
  const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  const linkRe2 = /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi;
  for (const re of [linkRe, linkRe2]) {
    let m;
    while ((m = re.exec(html)) !== null) {
      const href = m[1];
      // Only resolve local files, not URLs
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) continue;
      const cssPath = path.resolve(fileDir, href);
      try {
        const cssContent = fs.readFileSync(cssPath, 'utf-8');
        processedHtml = processedHtml.replace(m[0], `<style>/* from ${href} */\n${cssContent}\n</style>`);
      } catch {
        // Can't read stylesheet, skip
      }
    }
  }

  const dom = new JSDOM(processedHtml, {
    url: `file://${resolvedPath}`,
    resources: 'usable',
    pretendToBeVisual: true,
  });

  const { window } = dom;
  const { document } = window;

  // Wait for styles to apply
  await new Promise(r => setTimeout(r, 100));

  const findings = [];
  const elements = document.querySelectorAll('*');

  for (const el of elements) {
    const style = window.getComputedStyle(el);
    findings.push(...analyzeElementDeep(el, style, filePath));
  }

  // Also run file-level analyzers (overused fonts, single font, flat hierarchy)
  // These work on the raw content which is fine
  for (const ap of ANTIPATTERNS) {
    if (ap.analyzers) {
      for (const analyzer of ap.analyzers) {
        findings.push(...analyzer(html, filePath));
      }
    }
  }

  window.close();
  return findings;
}

/**
 * Deep scan using Puppeteer — full browser rendering for URLs.
 * @param {string} url  URL to scan
 * @returns {Promise<Array>} findings
 */
async function detectAntiPatternsUrl(url) {
  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
  } catch {
    throw new Error('puppeteer is required for URL scanning. Install it: npm install puppeteer');
  }

  const browser = await puppeteer.default.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  // Run detection in the browser context
  const findings = await page.evaluate((safeTags) => {
    const results = [];
    const safe = new Set(safeTags);
    const sides = ['Top', 'Right', 'Bottom', 'Left'];
    const elements = document.querySelectorAll('*');

    for (const el of elements) {
      const tag = el.tagName.toLowerCase();
      if (safe.has(tag)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) continue;

      const style = getComputedStyle(el);
      const widths = {};
      const colors = {};
      for (const s of sides) {
        widths[s] = parseFloat(style[`border${s}Width`]) || 0;
        colors[s] = style[`border${s}Color`] || '';
      }
      const radius = parseFloat(style.borderRadius) || 0;

      for (const side of sides) {
        const w = widths[side];
        if (w < 1) continue;
        const color = colors[side];
        if (!color || color === 'transparent' || /rgba\([^)]*,\s*0\)/.test(color)) continue;
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const [r, g, b] = [+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]];
          if (Math.max(r, g, b) - Math.min(r, g, b) < 30) continue;
        }

        const otherSides = sides.filter(s => s !== side);
        const maxOther = Math.max(...otherSides.map(s => widths[s]));
        const isAccent = w >= 2 && (maxOther <= 1 || w >= maxOther * 2);
        if (!isAccent) continue;

        const isSide = side === 'Left' || side === 'Right';
        const sideName = side.toLowerCase();

        if (isSide) {
          if (radius > 0) {
            results.push({ antipattern: 'side-tab', snippet: `border-${sideName}: ${w}px + border-radius: ${radius}px` });
          } else if (w >= 3) {
            results.push({ antipattern: 'side-tab', snippet: `border-${sideName}: ${w}px` });
          }
        } else {
          if (radius > 0 && w >= 2) {
            results.push({ antipattern: 'border-accent-on-rounded', snippet: `border-${sideName}: ${w}px + border-radius: ${radius}px` });
          }
        }
      }
    }

    return results;
  }, [...SAFE_TAGS_DEEP]);

  // Enrich findings with metadata
  const enriched = findings.map(f => ({
    ...f,
    name: f.antipattern === 'side-tab' ? 'Side-tab accent border' : 'Border accent on rounded element',
    description: ANTIPATTERNS.find(a => a.id === f.antipattern)?.description || '',
    file: url,
    line: 0,
  }));

  // Also get the page HTML for file-level analyzers
  const html = await page.content();
  for (const ap of ANTIPATTERNS) {
    if (ap.analyzers) {
      for (const analyzer of ap.analyzers) {
        enriched.push(...analyzer(html, url));
      }
    }
  }

  await browser.close();
  return enriched;
}

// ---------------------------------------------------------------------------
// File walker
// ---------------------------------------------------------------------------

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.output',
  '.svelte-kit', '__pycache__', '.turbo', '.vercel',
]);

const SCANNABLE_EXTENSIONS = new Set([
  '.html', '.htm', '.css', '.scss', '.less',
  '.jsx', '.tsx', '.js', '.ts',
  '.vue', '.svelte', '.astro',
]);

function walkDir(dir) {
  const files = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && SKIP_DIRS.has(entry.name)) continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full));
    } else if (SCANNABLE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

function formatFindings(findings, jsonMode) {
  if (jsonMode) {
    return JSON.stringify(findings, null, 2);
  }

  const grouped = {};
  for (const f of findings) {
    if (!grouped[f.file]) grouped[f.file] = [];
    grouped[f.file].push(f);
  }

  const lines = [];
  for (const [file, items] of Object.entries(grouped)) {
    lines.push(`\n${file}`);
    for (const item of items) {
      lines.push(`  line ${item.line}: [${item.antipattern}] ${item.snippet}`);
      lines.push(`    → ${item.description}`);
    }
  }

  const count = findings.length;
  lines.push(`\n${count} anti-pattern${count === 1 ? '' : 's'} found.`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Stdin handling (for future hook use)
// ---------------------------------------------------------------------------

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function handleStdin() {
  const input = await readStdin();
  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch {
    // Not JSON — treat as raw content
    return detectAntiPatterns(input, '<stdin>');
  }

  // Hook format: { tool_input: { file_path: "..." } }
  const filePath = parsed?.tool_input?.file_path;
  if (filePath && fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return detectAntiPatterns(content, filePath);
  }

  // Fallback: scan the raw JSON as content
  return detectAntiPatterns(input, '<stdin>');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printUsage() {
  console.log(`Usage: node detect-antipatterns.mjs [options] [file-or-dir-or-url...]

Scan files or URLs for known UI anti-patterns.

Options:
  --deep    Use jsdom for computed style analysis (catches linked stylesheets)
  --json    Output results as JSON
  --help    Show this help message

Modes:
  file/dir          Fast regex scan (default)
  file + --deep     jsdom computed styles (resolves local CSS)
  https://...       Puppeteer full browser (auto, resolves everything)

Examples:
  node detect-antipatterns.mjs src/
  node detect-antipatterns.mjs --deep index.html
  node detect-antipatterns.mjs https://example.com
  node detect-antipatterns.mjs --json .`);
}

function isUrl(str) {
  return /^https?:\/\//i.test(str);
}

async function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const helpMode = args.includes('--help');
  const deepMode = args.includes('--deep');
  const targets = args.filter((a) => !a.startsWith('--'));

  if (helpMode) {
    printUsage();
    process.exit(0);
  }

  let allFindings = [];

  // Check if stdin is piped
  if (!process.stdin.isTTY && targets.length === 0) {
    allFindings = await handleStdin();
  } else {
    // Default to cwd if no targets
    const paths = targets.length > 0 ? targets : [process.cwd()];

    for (const target of paths) {
      // URL → Puppeteer
      if (isUrl(target)) {
        try {
          const findings = await detectAntiPatternsUrl(target);
          allFindings.push(...findings);
        } catch (e) {
          process.stderr.write(`Error scanning URL ${target}: ${e.message}\n`);
        }
        continue;
      }

      const resolved = path.resolve(target);
      let stat;
      try {
        stat = fs.statSync(resolved);
      } catch {
        process.stderr.write(`Warning: cannot access ${target}\n`);
        continue;
      }

      if (stat.isDirectory()) {
        for (const file of walkDir(resolved)) {
          if (deepMode && file.endsWith('.html')) {
            allFindings.push(...await detectAntiPatternsDeep(file));
          } else {
            const content = fs.readFileSync(file, 'utf-8');
            allFindings.push(...detectAntiPatterns(content, file));
          }
        }
      } else if (stat.isFile()) {
        if (deepMode && resolved.endsWith('.html')) {
          allFindings.push(...await detectAntiPatternsDeep(resolved));
        } else {
          const content = fs.readFileSync(resolved, 'utf-8');
          allFindings.push(...detectAntiPatterns(content, resolved));
        }
      }
    }
  }

  if (allFindings.length > 0) {
    const output = formatFindings(allFindings, jsonMode);
    process.stderr.write(output + '\n');
    process.exit(2);
  }

  if (jsonMode) {
    process.stdout.write('[]\n');
  }
  process.exit(0);
}

// Run CLI when executed directly; export for testing when imported
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('detect-antipatterns.mjs') ||
  process.argv[1].endsWith('detect-antipatterns.mjs/')
);

if (isMainModule) {
  main();
}

export { ANTIPATTERNS, detectAntiPatterns, detectAntiPatternsDeep, detectAntiPatternsUrl, walkDir, formatFindings, SCANNABLE_EXTENSIONS, SKIP_DIRS };
