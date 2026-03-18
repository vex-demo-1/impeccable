/**
 * Anti-Pattern Browser Detector for Impeccable
 * GENERATED — do not edit. Source: detect-antipatterns.mjs
 * Rebuild: node scripts/build-browser-detector.js
 *
 * Usage: <script src="detect-antipatterns-browser.js"></script>
 * Re-scan: window.impeccableScan()
 */
(function () {
if (typeof window === 'undefined') return;

/**
 * Anti-Pattern Detector for Impeccable
 *
 * Universal file — auto-detects environment (browser vs Node) and adapts.
 *
 * Node usage:
 *   node detect-antipatterns.mjs [file-or-dir...]   # jsdom for HTML, regex for rest
 *   node detect-antipatterns.mjs https://...         # Puppeteer (auto)
 *   node detect-antipatterns.mjs --fast [files...]   # regex-only (skip jsdom)
 *   node detect-antipatterns.mjs --json              # JSON output
 *
 * Browser usage:
 *   <script src="detect-antipatterns-browser.js"></script>
 *   Re-scan: window.impeccableScan()
 *
 * Exit codes: 0 = clean, 2 = findings
 */

// ─── Environment ────────────────────────────────────────────────────────────

const IS_BROWSER = true;
const IS_NODE = !IS_BROWSER;


// ─── Section 1: Constants ───────────────────────────────────────────────────

const SAFE_TAGS = new Set([
  'blockquote', 'nav', 'a', 'input', 'textarea', 'select',
  'pre', 'code', 'span', 'th', 'td', 'tr', 'li', 'label',
  'button', 'hr', 'html', 'head', 'body', 'script', 'style',
  'link', 'meta', 'title', 'br', 'img', 'svg', 'path', 'circle',
  'rect', 'line', 'polyline', 'polygon', 'g', 'defs', 'use',
]);

const OVERUSED_FONTS = new Set([
  'inter', 'roboto', 'open sans', 'lato', 'montserrat', 'arial', 'helvetica',
]);

const GENERIC_FONTS = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
  'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded',
  '-apple-system', 'blinkmacsystemfont', 'segoe ui',
  'inherit', 'initial', 'unset', 'revert',
]);

const ANTIPATTERNS = [
  {
    id: 'side-tab',
    name: 'Side-tab accent border',
    description:
      'Thick colored border on one side of a card — the most recognizable tell of AI-generated UIs. Use a subtler accent or remove it entirely.',
  },
  {
    id: 'border-accent-on-rounded',
    name: 'Border accent on rounded element',
    description:
      'Thick accent border on a rounded card — the border clashes with the rounded corners. Remove the border or the border-radius.',
  },
  {
    id: 'overused-font',
    name: 'Overused font',
    description:
      'Inter, Roboto, Open Sans, Lato, Montserrat, and Arial are used on millions of sites. Choose a distinctive font that gives your interface personality.',
  },
  {
    id: 'single-font',
    name: 'Single font for everything',
    description:
      'Only one font family is used for the entire page. Pair a distinctive display font with a refined body font to create typographic hierarchy.',
  },
  {
    id: 'flat-type-hierarchy',
    name: 'Flat type hierarchy',
    description:
      'Font sizes are too close together — no clear visual hierarchy. Use fewer sizes with more contrast (aim for at least a 1.25 ratio between steps).',
  },
  {
    id: 'pure-black-white',
    name: 'Pure black background',
    description:
      'Pure #000000 as a background color looks harsh and unnatural. Tint it slightly toward your brand hue (e.g., oklch(12% 0.01 250)) for a more refined feel.',
  },
  {
    id: 'gray-on-color',
    name: 'Gray text on colored background',
    description:
      'Gray text looks washed out on colored backgrounds. Use a darker shade of the background color instead, or white/near-white for contrast.',
  },
  {
    id: 'low-contrast',
    name: 'Low contrast text',
    description:
      'Text does not meet WCAG AA contrast requirements (4.5:1 for body, 3:1 for large text). Increase the contrast between text and background.',
  },
  {
    id: 'gradient-text',
    name: 'Gradient text',
    description:
      'Gradient text is decorative rather than meaningful — a common AI tell, especially on headings and metrics. Use solid colors for text.',
  },
  {
    id: 'ai-color-palette',
    name: 'AI color palette',
    description:
      'Purple/violet gradients and cyan-on-dark are the most recognizable tells of AI-generated UIs. Choose a distinctive, intentional palette.',
  },
  {
    id: 'nested-cards',
    name: 'Nested cards',
    description:
      'Cards inside cards create visual noise and excessive depth. Flatten the hierarchy — use spacing, typography, and dividers instead of nesting containers.',
  },
  {
    id: 'monotonous-spacing',
    name: 'Monotonous spacing',
    description:
      'The same spacing value used everywhere — no rhythm, no variation. Use tight groupings for related items and generous separations between sections.',
  },
  {
    id: 'everything-centered',
    name: 'Everything centered',
    description:
      'Every text element is center-aligned. Left-aligned text with asymmetric layouts feels more designed. Center only hero sections and CTAs.',
  },
];

// ─── Section 2: Color Utilities ─────────────────────────────────────────────

function isNeutralColor(color) {
  if (!color || color === 'transparent') return true;
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return true;
  return (Math.max(+m[1], +m[2], +m[3]) - Math.min(+m[1], +m[2], +m[3])) < 30;
}

function parseRgb(color) {
  if (!color || color === 'transparent') return null;
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
}

function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(c1, c2) {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function hasChroma(c, threshold = 30) {
  if (!c) return false;
  return (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)) >= threshold;
}

function getHue(c) {
  if (!c) return 0;
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return Math.round(h * 360);
}

function colorToHex(c) {
  if (!c) return '?';
  return '#' + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ─── Section 3: Pure Detection ──────────────────────────────────────────────

function checkBorders(tag, widths, colors, radius) {
  if (SAFE_TAGS.has(tag)) return [];
  const findings = [];
  const sides = ['Top', 'Right', 'Bottom', 'Left'];

  for (const side of sides) {
    const w = widths[side];
    if (w < 1 || isNeutralColor(colors[side])) continue;

    const otherSides = sides.filter(s => s !== side);
    const maxOther = Math.max(...otherSides.map(s => widths[s]));
    if (!(w >= 2 && (maxOther <= 1 || w >= maxOther * 2))) continue;

    const sn = side.toLowerCase();
    const isSide = side === 'Left' || side === 'Right';

    if (isSide) {
      if (radius > 0) findings.push({ id: 'side-tab', snippet: `border-${sn}: ${w}px + border-radius: ${radius}px` });
      else if (w >= 3) findings.push({ id: 'side-tab', snippet: `border-${sn}: ${w}px` });
    } else {
      if (radius > 0 && w >= 2) findings.push({ id: 'border-accent-on-rounded', snippet: `border-${sn}: ${w}px + border-radius: ${radius}px` });
    }
  }

  return findings;
}

function checkColors(opts) {
  const { tag, textColor, bgColor, effectiveBg, fontSize, fontWeight, hasDirectText, bgClip, bgImage, classList } = opts;
  if (SAFE_TAGS.has(tag)) return [];
  const findings = [];

  // Pure black background
  if (bgColor && bgColor.a > 0.1 && bgColor.r === 0 && bgColor.g === 0 && bgColor.b === 0) {
    findings.push({ id: 'pure-black-white', snippet: '#000000 background' });
  }

  if (hasDirectText && textColor) {
    // Gray on colored background
    const textLum = relativeLuminance(textColor);
    const isGray = !hasChroma(textColor, 20) && textLum > 0.05 && textLum < 0.85;
    if (isGray && hasChroma(effectiveBg, 40)) {
      findings.push({ id: 'gray-on-color', snippet: `text ${colorToHex(textColor)} on bg ${colorToHex(effectiveBg)}` });
    }

    // Low contrast (WCAG AA)
    const ratio = contrastRatio(textColor, effectiveBg);
    const isHeading = ['h1', 'h2', 'h3'].includes(tag);
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700) || isHeading;
    const threshold = isLargeText ? 3.0 : 4.5;
    if (ratio < threshold) {
      findings.push({ id: 'low-contrast', snippet: `${ratio.toFixed(1)}:1 (need ${threshold}:1) — text ${colorToHex(textColor)} on ${colorToHex(effectiveBg)}` });
    }

    // AI palette: purple/violet on headings
    if (hasChroma(textColor, 50)) {
      const hue = getHue(textColor);
      if (hue >= 260 && hue <= 310 && (['h1', 'h2', 'h3'].includes(tag) || fontSize >= 20)) {
        findings.push({ id: 'ai-color-palette', snippet: `Purple/violet text (${colorToHex(textColor)}) on heading` });
      }
    }
  }

  // Gradient text
  if (bgClip === 'text' && bgImage && bgImage.includes('gradient')) {
    findings.push({ id: 'gradient-text', snippet: 'background-clip: text + gradient' });
  }

  // Tailwind class checks
  if (classList) {
    if (/\bbg-black\b/.test(classList)) {
      findings.push({ id: 'pure-black-white', snippet: 'bg-black' });
    }

    const grayMatch = classList.match(/\btext-(?:gray|slate|zinc|neutral|stone)-\d+\b/);
    const colorBgMatch = classList.match(/\bbg-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+\b/);
    if (grayMatch && colorBgMatch) {
      findings.push({ id: 'gray-on-color', snippet: `${grayMatch[0]} on ${colorBgMatch[0]}` });
    }

    if (/\bbg-clip-text\b/.test(classList) && /\bbg-gradient-to-/.test(classList)) {
      findings.push({ id: 'gradient-text', snippet: 'bg-clip-text + bg-gradient (Tailwind)' });
    }

    const purpleText = classList.match(/\btext-(?:purple|violet|indigo)-\d+\b/);
    if (purpleText && (['h1', 'h2', 'h3'].includes(tag) || /\btext-(?:[2-9]xl)\b/.test(classList))) {
      findings.push({ id: 'ai-color-palette', snippet: `${purpleText[0]} on heading` });
    }

    if (/\bfrom-(?:purple|violet|indigo)-\d+\b/.test(classList) && /\bto-(?:purple|violet|indigo|blue|cyan|pink|fuchsia)-\d+\b/.test(classList)) {
      findings.push({ id: 'ai-color-palette', snippet: 'Purple/violet gradient (Tailwind)' });
    }
  }

  return findings;
}

function isCardLikeFromProps(hasShadow, hasBorder, hasRadius, hasBg) {
  if (!hasShadow && !hasBorder) return false;
  return hasRadius || hasBg;
}

// ─── Section 4: resolveBackground (unified) ─────────────────────────────────

function resolveBackground(el, win) {
  let current = el;
  while (current && current.nodeType === 1) {
    const style = IS_BROWSER ? getComputedStyle(current) : win.getComputedStyle(current);
    let bg = parseRgb(style.backgroundColor);
    if (!IS_BROWSER && (!bg || bg.a < 0.1)) {
      // jsdom doesn't decompose background shorthand — parse raw style attr
      const rawStyle = current.getAttribute?.('style') || '';
      const bgMatch = rawStyle.match(/background(?:-color)?\s*:\s*([^;]+)/i);
      const inlineBg = bgMatch ? bgMatch[1].trim() : '';
      bg = parseRgb(inlineBg);
      if (!bg && inlineBg) {
        const hexMatch = inlineBg.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i);
        if (hexMatch) {
          const h = hexMatch[1];
          if (h.length === 6) {
            bg = { r: parseInt(h.slice(0,2), 16), g: parseInt(h.slice(2,4), 16), b: parseInt(h.slice(4,6), 16), a: 1 };
          } else {
            bg = { r: parseInt(h[0]+h[0], 16), g: parseInt(h[1]+h[1], 16), b: parseInt(h[2]+h[2], 16), a: 1 };
          }
        }
      }
    }
    if (bg && bg.a > 0.1) {
      if (IS_BROWSER || bg.a >= 0.5) return bg;
    }
    current = current.parentElement;
  }
  return { r: 255, g: 255, b: 255 };
}

// ─── Section 5: Element Adapters ────────────────────────────────────────────

// Browser adapters — call getComputedStyle/getBoundingClientRect on live DOM

function checkElementBordersDOM(el) {
  const tag = el.tagName.toLowerCase();
  if (SAFE_TAGS.has(tag)) return [];
  const rect = el.getBoundingClientRect();
  if (rect.width < 20 || rect.height < 20) return [];
  const style = getComputedStyle(el);
  const sides = ['Top', 'Right', 'Bottom', 'Left'];
  const widths = {}, colors = {};
  for (const s of sides) {
    widths[s] = parseFloat(style[`border${s}Width`]) || 0;
    colors[s] = style[`border${s}Color`] || '';
  }
  return checkBorders(tag, widths, colors, parseFloat(style.borderRadius) || 0);
}

function checkElementColorsDOM(el) {
  const tag = el.tagName.toLowerCase();
  if (SAFE_TAGS.has(tag)) return [];
  const rect = el.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return [];
  const style = getComputedStyle(el);
  const hasDirectText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  return checkColors({
    tag,
    textColor: parseRgb(style.color),
    bgColor: parseRgb(style.backgroundColor),
    effectiveBg: resolveBackground(el),
    fontSize: parseFloat(style.fontSize) || 16,
    fontWeight: parseInt(style.fontWeight) || 400,
    hasDirectText,
    bgClip: style.webkitBackgroundClip || style.backgroundClip || '',
    bgImage: style.backgroundImage || '',
    classList: el.getAttribute('class') || '',
  });
}

// Node adapters — take pre-extracted jsdom computed style

function checkElementBorders(tag, style) {
  const sides = ['Top', 'Right', 'Bottom', 'Left'];
  const widths = {}, colors = {};
  for (const s of sides) {
    widths[s] = parseFloat(style[`border${s}Width`]) || 0;
    colors[s] = style[`border${s}Color`] || '';
  }
  return checkBorders(tag, widths, colors, parseFloat(style.borderRadius) || 0);
}

function checkElementColors(el, style, tag, window) {
  const hasText = el.textContent?.trim().length > 0;
  const hasDirectText = hasText && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());

  return checkColors({
    tag,
    textColor: parseRgb(style.color),
    bgColor: parseRgb(style.backgroundColor),
    effectiveBg: resolveBackground(el, window),
    fontSize: parseFloat(style.fontSize) || 16,
    fontWeight: parseInt(style.fontWeight) || 400,
    hasDirectText,
    bgClip: style.webkitBackgroundClip || style.backgroundClip || '',
    bgImage: style.backgroundImage || '',
    classList: el.getAttribute?.('class') || el.className || '',
  });
}

// ─── Section 6: Page-Level Checks ───────────────────────────────────────────

// Browser page-level checks — use document/getComputedStyle globals

function checkTypography() {
  const findings = [];
  const fonts = new Set();
  const overusedFound = new Set();

  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules || sheet.rules; } catch { continue; }
    if (!rules) continue;
    for (const rule of rules) {
      if (rule.type !== 1) continue;
      const ff = rule.style?.fontFamily;
      if (!ff) continue;
      const stack = ff.split(',').map(f => f.trim().replace(/^['"]|['"]$/g, '').toLowerCase());
      const primary = stack.find(f => f && !GENERIC_FONTS.has(f));
      if (primary) {
        fonts.add(primary);
        if (OVERUSED_FONTS.has(primary)) overusedFound.add(primary);
      }
    }
  }

  const html = document.documentElement.outerHTML;
  const gfRe = /fonts\.googleapis\.com\/css2?\?family=([^&"'\s]+)/gi;
  let m;
  while ((m = gfRe.exec(html)) !== null) {
    for (const f of m[1].split('|').map(f => f.split(':')[0].replace(/\+/g, ' ').toLowerCase())) {
      fonts.add(f);
      if (OVERUSED_FONTS.has(f)) overusedFound.add(f);
    }
  }

  for (const font of overusedFound) {
    findings.push({ type: 'overused-font', detail: `Primary font: ${font}` });
  }
  if (fonts.size === 1 && document.querySelectorAll('*').length >= 20) {
    findings.push({ type: 'single-font', detail: `Only font: ${[...fonts][0]}` });
  }

  const sizes = new Set();
  for (const el of document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li,td,th,label,button,div')) {
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs > 0 && fs < 200) sizes.add(Math.round(fs * 10) / 10);
  }
  if (sizes.size >= 3) {
    const sorted = [...sizes].sort((a, b) => a - b);
    const ratio = sorted[sorted.length - 1] / sorted[0];
    if (ratio < 2.0) {
      findings.push({ type: 'flat-type-hierarchy', detail: `Sizes: ${sorted.map(s => s + 'px').join(', ')} (ratio ${ratio.toFixed(1)}:1)` });
    }
  }

  return findings;
}

function isCardLikeDOM(el) {
  const tag = el.tagName.toLowerCase();
  if (SAFE_TAGS.has(tag) || ['input','select','textarea','img','video','canvas','picture'].includes(tag)) return false;
  const style = getComputedStyle(el);
  const cls = el.getAttribute('class') || '';
  const hasShadow = (style.boxShadow && style.boxShadow !== 'none') || /\bshadow(?:-sm|-md|-lg|-xl|-2xl)?\b/.test(cls);
  const hasBorder = /\bborder\b/.test(cls);
  const hasRadius = parseFloat(style.borderRadius) > 0 || /\brounded(?:-sm|-md|-lg|-xl|-2xl|-full)?\b/.test(cls);
  const hasBg = (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') || /\bbg-(?:white|gray-\d+|slate-\d+)\b/.test(cls);
  return isCardLikeFromProps(hasShadow, hasBorder, hasRadius, hasBg);
}

function checkLayout() {
  const findings = [];
  const flaggedEls = new Set();

  for (const el of document.querySelectorAll('*')) {
    if (!isCardLikeDOM(el) || flaggedEls.has(el)) continue;
    const cls = el.getAttribute('class') || '';
    const style = getComputedStyle(el);
    if (style.position === 'absolute' || style.position === 'fixed') continue;
    if (/\b(?:dropdown|popover|tooltip|menu|modal|dialog)\b/i.test(cls)) continue;
    if ((el.textContent?.trim().length || 0) < 10) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 30) continue;

    let parent = el.parentElement;
    while (parent) {
      if (isCardLikeDOM(parent)) { flaggedEls.add(el); break; }
      parent = parent.parentElement;
    }
  }

  for (const el of flaggedEls) {
    let isAncestor = false;
    for (const other of flaggedEls) {
      if (other !== el && el.contains(other)) { isAncestor = true; break; }
    }
    if (!isAncestor) findings.push({ type: 'nested-cards', detail: 'Card inside card', el });
  }

  return findings;
}

// Node page-level checks — take document/window as parameters

function checkPageTypography(doc, win) {
  const findings = [];

  const fonts = new Set();
  const overusedFound = new Set();

  for (const sheet of doc.styleSheets) {
    let rules;
    try { rules = sheet.cssRules || sheet.rules; } catch { continue; }
    if (!rules) continue;
    for (const rule of rules) {
      if (rule.type !== 1) continue;
      const ff = rule.style?.fontFamily;
      if (!ff) continue;
      const stack = ff.split(',').map(f => f.trim().replace(/^['"]|['"]$/g, '').toLowerCase());
      const primary = stack.find(f => f && !GENERIC_FONTS.has(f));
      if (primary) {
        fonts.add(primary);
        if (OVERUSED_FONTS.has(primary)) overusedFound.add(primary);
      }
    }
  }

  // Check Google Fonts links in HTML
  const html = doc.documentElement?.outerHTML || '';
  const gfRe = /fonts\.googleapis\.com\/css2?\?family=([^&"'\s]+)/gi;
  let m;
  while ((m = gfRe.exec(html)) !== null) {
    const families = m[1].split('|').map(f => f.split(':')[0].replace(/\+/g, ' ').toLowerCase());
    for (const f of families) {
      fonts.add(f);
      if (OVERUSED_FONTS.has(f)) overusedFound.add(f);
    }
  }

  // Also parse raw HTML/style content for font-family (jsdom may not expose all via CSSOM)
  const ffRe = /font-family\s*:\s*([^;}]+)/gi;
  let fm;
  while ((fm = ffRe.exec(html)) !== null) {
    for (const f of fm[1].split(',').map(f => f.trim().replace(/^['"]|['"]$/g, '').toLowerCase())) {
      if (f && !GENERIC_FONTS.has(f)) {
        fonts.add(f);
        if (OVERUSED_FONTS.has(f)) overusedFound.add(f);
      }
    }
  }

  for (const font of overusedFound) {
    findings.push({ id: 'overused-font', snippet: `Primary font: ${font}` });
  }

  // Single font
  if (fonts.size === 1) {
    const els = doc.querySelectorAll('*');
    if (els.length >= 20) {
      findings.push({ id: 'single-font', snippet: `Only font: ${[...fonts][0]}` });
    }
  }

  // Flat type hierarchy
  const sizes = new Set();
  const textEls = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, li, td, th, label, button, div');
  for (const el of textEls) {
    const fontSize = parseFloat(win.getComputedStyle(el).fontSize);
    // Filter out sub-8px values (jsdom doesn't resolve relative units properly)
    if (fontSize >= 8 && fontSize < 200) sizes.add(Math.round(fontSize * 10) / 10);
  }
  if (sizes.size >= 3) {
    const sorted = [...sizes].sort((a, b) => a - b);
    const ratio = sorted[sorted.length - 1] / sorted[0];
    if (ratio < 2.0) {
      findings.push({ id: 'flat-type-hierarchy', snippet: `Sizes: ${sorted.map(s => s + 'px').join(', ')} (ratio ${ratio.toFixed(1)}:1)` });
    }
  }

  // Pure black background (regex on raw HTML)
  const pureBlackBgRe = /background(?:-color)?\s*:\s*(?:#000000|#000|rgb\(\s*0,\s*0,\s*0\s*\))\b/gi;
  if (pureBlackBgRe.test(html)) {
    findings.push({ id: 'pure-black-white', snippet: 'Pure #000 background' });
  }

  // AI color palette: purple/violet in raw CSS
  const purpleHexRe = /#(?:7c3aed|8b5cf6|a855f7|9333ea|7e22ce|6d28d9|6366f1|764ba2|667eea)\b/gi;
  if (purpleHexRe.test(html)) {
    const purpleTextRe = /(?:(?:^|;)\s*color\s*:\s*(?:.*?)(?:#(?:7c3aed|8b5cf6|a855f7|9333ea|7e22ce|6d28d9))|gradient.*?#(?:7c3aed|8b5cf6|a855f7|764ba2|667eea))/gi;
    if (purpleTextRe.test(html)) {
      findings.push({ id: 'ai-color-palette', snippet: 'Purple/violet accent colors detected' });
    }
  }

  // Gradient text (regex on raw HTML — jsdom doesn't compute background-clip)
  const gradientRe = /(?:-webkit-)?background-clip\s*:\s*text/gi;
  let gm;
  while ((gm = gradientRe.exec(html)) !== null) {
    const start = Math.max(0, gm.index - 200);
    const context = html.substring(start, gm.index + gm[0].length + 200);
    if (/gradient/i.test(context)) {
      findings.push({ id: 'gradient-text', snippet: 'background-clip: text + gradient' });
      break;
    }
  }

  // Tailwind gradient text
  if (/\bbg-clip-text\b/.test(html) && /\bbg-gradient-to-/.test(html)) {
    findings.push({ id: 'gradient-text', snippet: 'bg-clip-text + bg-gradient (Tailwind)' });
  }

  return findings;
}

function isCardLike(el, win) {
  const tag = el.tagName.toLowerCase();
  if (SAFE_TAGS.has(tag) || ['input', 'select', 'textarea', 'img', 'video', 'canvas', 'picture'].includes(tag)) return false;

  const style = win.getComputedStyle(el);
  const rawStyle = el.getAttribute?.('style') || '';
  const cls = el.getAttribute?.('class') || '';

  const hasShadow = (style.boxShadow && style.boxShadow !== 'none') ||
    /\bshadow(?:-sm|-md|-lg|-xl|-2xl)?\b/.test(cls) || /box-shadow/i.test(rawStyle);
  const hasBorder = /\bborder\b/.test(cls);
  const hasRadius = (parseFloat(style.borderRadius) || 0) > 0 ||
    /\brounded(?:-sm|-md|-lg|-xl|-2xl|-full)?\b/.test(cls) || /border-radius/i.test(rawStyle);
  const hasBg = /\bbg-(?:white|gray-\d+|slate-\d+)\b/.test(cls) ||
    /background(?:-color)?\s*:\s*(?!transparent)/i.test(rawStyle);

  return isCardLikeFromProps(hasShadow, hasBorder, hasRadius, hasBg);
}

function checkPageLayout(doc, win) {
  const findings = [];

  // Nested cards
  const allEls = doc.querySelectorAll('*');
  const flaggedEls = new Set();
  for (const el of allEls) {
    if (!isCardLike(el, win)) continue;
    if (flaggedEls.has(el)) continue;

    const tag = el.tagName.toLowerCase();
    const cls = el.getAttribute?.('class') || '';
    const rawStyle = el.getAttribute?.('style') || '';

    if (['pre', 'code'].includes(tag)) continue;
    if (/\b(?:absolute|fixed)\b/.test(cls) || /position\s*:\s*(?:absolute|fixed)/i.test(rawStyle)) continue;
    if ((el.textContent?.trim().length || 0) < 10) continue;
    if (/\b(?:dropdown|popover|tooltip|menu|modal|dialog)\b/i.test(cls)) continue;

    // Walk up to find card-like ancestor
    let parent = el.parentElement;
    while (parent) {
      if (isCardLike(parent, win)) {
        flaggedEls.add(el);
        break;
      }
      parent = parent.parentElement;
    }
  }

  // Only report innermost nested cards
  for (const el of flaggedEls) {
    let isAncestorOfFlagged = false;
    for (const other of flaggedEls) {
      if (other !== el && el.contains(other)) {
        isAncestorOfFlagged = true;
        break;
      }
    }
    if (!isAncestorOfFlagged) {
      findings.push({ id: 'nested-cards', snippet: `Card inside card (${el.tagName.toLowerCase()})` });
    }
  }

  // Monotonous spacing (regex on raw HTML)
  const spacingValues = [];
  const html = doc.documentElement?.outerHTML || '';

  const spacingRe = /(?:padding|margin)(?:-(?:top|right|bottom|left))?\s*:\s*(\d+)px/gi;
  let sm;
  while ((sm = spacingRe.exec(html)) !== null) {
    const v = parseInt(sm[1], 10);
    if (v > 0 && v < 200) spacingValues.push(v);
  }
  const gapRe = /gap\s*:\s*(\d+)px/gi;
  while ((sm = gapRe.exec(html)) !== null) {
    spacingValues.push(parseInt(sm[1], 10));
  }
  const twSpaceRe = /\b(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap)-(\d+)\b/g;
  while ((sm = twSpaceRe.exec(html)) !== null) {
    spacingValues.push(parseInt(sm[1], 10) * 4);
  }
  const remSpacingRe = /(?:padding|margin)(?:-(?:top|right|bottom|left))?\s*:\s*([\d.]+)rem/gi;
  while ((sm = remSpacingRe.exec(html)) !== null) {
    const v = Math.round(parseFloat(sm[1]) * 16);
    if (v > 0 && v < 200) spacingValues.push(v);
  }

  const roundedSpacing = spacingValues.map(v => Math.round(v / 4) * 4);
  if (roundedSpacing.length >= 10) {
    const counts = {};
    for (const v of roundedSpacing) counts[v] = (counts[v] || 0) + 1;
    const maxCount = Math.max(...Object.values(counts));
    const dominantPct = maxCount / roundedSpacing.length;
    const unique = [...new Set(roundedSpacing)].filter(v => v > 0);
    if (dominantPct > 0.6 && unique.length <= 3) {
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      findings.push({
        id: 'monotonous-spacing',
        snippet: `~${dominant}px used ${maxCount}/${roundedSpacing.length} times (${Math.round(dominantPct * 100)}%)`,
      });
    }
  }

  // Everything centered
  const textEls = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, div, button');
  let centeredCount = 0;
  let totalText = 0;
  for (const el of textEls) {
    const hasDirectText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length >= 3);
    if (!hasDirectText) continue;
    totalText++;

    let cur = el;
    let isCentered = false;
    while (cur && cur.nodeType === 1) {
      const rawStyle = cur.getAttribute?.('style') || '';
      const cls = cur.getAttribute?.('class') || '';
      if (/text-align\s*:\s*center/i.test(rawStyle) || /\btext-center\b/.test(cls)) {
        isCentered = true;
        break;
      }
      if (cur.tagName === 'BODY') break;
      cur = cur.parentElement;
    }
    if (isCentered) centeredCount++;
  }

  if (totalText >= 5 && centeredCount / totalText > 0.7) {
    findings.push({
      id: 'everything-centered',
      snippet: `${centeredCount}/${totalText} text elements centered (${Math.round(centeredCount / totalText * 100)}%)`,
    });
  }

  return findings;
}

// ─── Section 7: Browser UI (IS_BROWSER only) ────────────────────────────────

if (IS_BROWSER) {
  const LABEL_BG = 'oklch(55% 0.25 350)';
  const OUTLINE_COLOR = 'oklch(60% 0.25 350)';

  const overlays = [];
  const TYPE_LABELS = {};
  for (const ap of ANTIPATTERNS) {
    TYPE_LABELS[ap.id] = ap.name.toLowerCase().substring(0, 20);
  }

  const highlight = function(el, findings) {
    const rect = el.getBoundingClientRect();
    const outline = document.createElement('div');
    outline.className = 'impeccable-overlay';
    Object.assign(outline.style, {
      position: 'absolute',
      top: `${rect.top + scrollY - 2}px`, left: `${rect.left + scrollX - 2}px`,
      width: `${rect.width + 4}px`, height: `${rect.height + 4}px`,
      border: `2px solid ${OUTLINE_COLOR}`, borderRadius: '4px',
      pointerEvents: 'none', zIndex: '99999', boxSizing: 'border-box',
    });

    const label = document.createElement('div');
    label.className = 'impeccable-label';
    label.textContent = findings.map(f => TYPE_LABELS[f.type || f.id] || f.type || f.id).join(', ');
    Object.assign(label.style, {
      position: 'absolute', top: '-20px', left: '0',
      background: LABEL_BG, color: 'white',
      fontSize: '11px', fontFamily: 'system-ui, sans-serif', fontWeight: '600',
      padding: '2px 8px', borderRadius: '3px', whiteSpace: 'nowrap',
      lineHeight: '16px', letterSpacing: '0.02em',
    });
    outline.appendChild(label);

    const tooltip = document.createElement('div');
    tooltip.className = 'impeccable-tooltip';
    tooltip.innerHTML = findings.map(f => f.detail || f.snippet).join('<br>');
    Object.assign(tooltip.style, {
      position: 'absolute', bottom: '-28px', left: '0',
      background: 'rgba(0,0,0,0.85)', color: '#e5e5e5',
      fontSize: '11px', fontFamily: 'ui-monospace, monospace',
      padding: '4px 8px', borderRadius: '3px', whiteSpace: 'nowrap',
      lineHeight: '16px', display: 'none', zIndex: '100000',
    });
    outline.appendChild(tooltip);

    outline.addEventListener('mouseenter', () => {
      outline.style.pointerEvents = 'auto';
      tooltip.style.display = 'block';
      outline.style.background = 'oklch(60% 0.25 350 / 0.08)';
    });
    outline.addEventListener('mouseleave', () => {
      outline.style.pointerEvents = 'none';
      tooltip.style.display = 'none';
      outline.style.background = 'none';
    });

    document.body.appendChild(outline);
    overlays.push(outline);
  };

  const showPageBanner = function(findings) {
    if (!findings.length) return;
    const banner = document.createElement('div');
    banner.className = 'impeccable-overlay';
    Object.assign(banner.style, {
      position: 'fixed', top: '0', left: '0', right: '0', zIndex: '100000',
      background: LABEL_BG, color: 'white',
      fontFamily: 'system-ui, sans-serif', fontSize: '13px',
      padding: '8px 16px', display: 'flex', flexWrap: 'wrap',
      gap: '12px', alignItems: 'center', pointerEvents: 'auto',
    });
    for (const f of findings) {
      const tag = document.createElement('span');
      tag.textContent = `${TYPE_LABELS[f.type] || f.type}: ${f.detail}`;
      Object.assign(tag.style, {
        background: 'rgba(255,255,255,0.15)', padding: '2px 8px',
        borderRadius: '3px', fontSize: '12px', fontFamily: 'ui-monospace, monospace',
      });
      banner.appendChild(tag);
    }
    const close = document.createElement('button');
    close.textContent = '\u00d7';
    Object.assign(close.style, {
      marginLeft: 'auto', background: 'none', border: 'none',
      color: 'white', fontSize: '18px', cursor: 'pointer', padding: '0 4px',
    });
    close.addEventListener('click', () => banner.remove());
    banner.appendChild(close);
    document.body.appendChild(banner);
    overlays.push(banner);
  };

  const printSummary = function(allFindings) {
    if (allFindings.length === 0) {
      console.log('%c[impeccable] No anti-patterns found.', 'color: #22c55e; font-weight: bold');
      return;
    }
    console.group(
      `%c[impeccable] ${allFindings.length} anti-pattern${allFindings.length === 1 ? '' : 's'} found`,
      'color: oklch(60% 0.25 350); font-weight: bold'
    );
    for (const { el, findings } of allFindings) {
      for (const f of findings) {
        console.log(`%c${f.type || f.id}%c ${f.detail || f.snippet}`,
          'color: oklch(55% 0.25 350); font-weight: bold', 'color: inherit', el);
      }
    }
    console.groupEnd();
  };

  const scan = function() {
    for (const o of overlays) o.remove();
    overlays.length = 0;
    const allFindings = [];

    for (const el of document.querySelectorAll('*')) {
      if (el.classList.contains('impeccable-overlay') ||
          el.classList.contains('impeccable-label') ||
          el.classList.contains('impeccable-tooltip')) continue;

      const findings = [
        ...checkElementBordersDOM(el).map(f => ({ type: f.id, detail: f.snippet })),
        ...checkElementColorsDOM(el).map(f => ({ type: f.id, detail: f.snippet })),
      ];

      if (findings.length > 0) {
        highlight(el, findings);
        allFindings.push({ el, findings });
      }
    }

    const typoFindings = checkTypography();
    if (typoFindings.length > 0) {
      showPageBanner(typoFindings);
      allFindings.push({ el: document.body, findings: typoFindings });
    }

    const layoutFindings = checkLayout();
    for (const f of layoutFindings) {
      const el = f.el || document.body;
      delete f.el;
      highlight(el, [f]);
      allFindings.push({ el, findings: [f] });
    }

    printSummary(allFindings);
    return allFindings;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(scan, 100));
  } else {
    setTimeout(scan, 100);
  }

  window.impeccableScan = scan;
}

// ─── Section 8: Node Engine ─────────────────────────────────────────────────

// ─── Section 9: Exports ─────────────────────────────────────────────────────

})();
