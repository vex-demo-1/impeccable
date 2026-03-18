import { describe, test, expect } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {
  ANTIPATTERNS, checkElementBorders, checkElementMotion, checkElementGlow, isNeutralColor, isFullPage,
  detectText,
  walkDir, SCANNABLE_EXTENSIONS,
} from '../source/skills/critique/scripts/detect-antipatterns.mjs';

const FIXTURES = path.join(import.meta.dir, 'fixtures', 'antipatterns');
const SCRIPT = path.join(import.meta.dir, '..', 'source', 'skills', 'critique', 'scripts', 'detect-antipatterns.mjs');


// ---------------------------------------------------------------------------
// Core: checkElementBorders (computed style simulation)
// ---------------------------------------------------------------------------

describe('checkElementBorders', () => {
  function mockStyle(overrides) {
    return { borderTopWidth: '0', borderRightWidth: '0', borderBottomWidth: '0', borderLeftWidth: '0',
      borderTopColor: '', borderRightColor: '', borderBottomColor: '', borderLeftColor: '',
      borderRadius: '0', ...overrides };
  }

  test('detects side-tab with radius', () => {
    const f = checkElementBorders('div', mockStyle({
      borderLeftWidth: '4', borderLeftColor: 'rgb(59, 130, 246)', borderRadius: '12',
    }));
    expect(f.length).toBe(1);
    expect(f[0].id).toBe('side-tab');
  });

  test('detects side-tab without radius (thick)', () => {
    const f = checkElementBorders('div', mockStyle({
      borderLeftWidth: '4', borderLeftColor: 'rgb(59, 130, 246)',
    }));
    expect(f.length).toBe(1);
    expect(f[0].id).toBe('side-tab');
  });

  test('skips side border below threshold without radius', () => {
    const f = checkElementBorders('div', mockStyle({
      borderLeftWidth: '2', borderLeftColor: 'rgb(59, 130, 246)',
    }));
    expect(f).toHaveLength(0);
  });

  test('detects border-accent-on-rounded (top)', () => {
    const f = checkElementBorders('div', mockStyle({
      borderTopWidth: '3', borderTopColor: 'rgb(139, 92, 246)', borderRadius: '12',
    }));
    expect(f.length).toBe(1);
    expect(f[0].id).toBe('border-accent-on-rounded');
  });

  test('skips safe tags', () => {
    const f = checkElementBorders('blockquote', mockStyle({
      borderLeftWidth: '4', borderLeftColor: 'rgb(59, 130, 246)',
    }));
    expect(f).toHaveLength(0);
  });

  test('skips neutral colors', () => {
    const f = checkElementBorders('div', mockStyle({
      borderLeftWidth: '4', borderLeftColor: 'rgb(200, 200, 200)',
    }));
    expect(f).toHaveLength(0);
  });

  test('skips uniform borders (not accent)', () => {
    const f = checkElementBorders('div', mockStyle({
      borderTopWidth: '2', borderRightWidth: '2', borderBottomWidth: '2', borderLeftWidth: '2',
      borderTopColor: 'rgb(59, 130, 246)', borderRightColor: 'rgb(59, 130, 246)',
      borderBottomColor: 'rgb(59, 130, 246)', borderLeftColor: 'rgb(59, 130, 246)',
    }));
    expect(f).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// isNeutralColor
// ---------------------------------------------------------------------------

describe('isNeutralColor', () => {
  test('gray is neutral', () => expect(isNeutralColor('rgb(200, 200, 200)')).toBe(true));
  test('blue is not neutral', () => expect(isNeutralColor('rgb(59, 130, 246)')).toBe(false));
  test('transparent is neutral', () => expect(isNeutralColor('transparent')).toBe(true));
  test('null is neutral', () => expect(isNeutralColor(null)).toBe(true));
});

// ---------------------------------------------------------------------------
// Regex fallback (detectText)
// ---------------------------------------------------------------------------

describe('detectText — Tailwind side-tab', () => {
  test('detects border-l-4 (thick, no rounded needed)', () => {
    const f = detectText('<div class="border-l-4 border-blue-500">', 'test.html');
    expect(f.some(r => r.antipattern === 'side-tab')).toBe(true);
  });

  test('detects border-l-1 + rounded', () => {
    const f = detectText('<div class="border-l-1 border-blue-500 rounded-md">', 'test.html');
    expect(f.some(r => r.antipattern === 'side-tab')).toBe(true);
  });

  test('ignores border-l-1 without rounded', () => {
    const f = detectText('<div class="border-l-1 border-gray-300">', 'test.html');
    expect(f.filter(r => r.antipattern === 'side-tab')).toHaveLength(0);
  });

  test('ignores border-t without rounded', () => {
    const f = detectText('<div class="border-t-4 border-b-4">', 'test.html');
    expect(f.filter(r => r.antipattern === 'border-accent-on-rounded')).toHaveLength(0);
  });
});

describe('detectText — CSS borders', () => {
  test('detects border-left shorthand', () => {
    const f = detectText('.card { border-left: 4px solid #3b82f6; }', 'test.css');
    expect(f.some(r => r.antipattern === 'side-tab')).toBe(true);
  });

  test('ignores neutral border', () => {
    const f = detectText('.card { border-left: 4px solid #e5e7eb; }', 'test.css');
    expect(f.filter(r => r.antipattern === 'side-tab')).toHaveLength(0);
  });

  test('skips blockquote', () => {
    const f = detectText('<blockquote style="border-left: 4px solid #ccc;">', 'test.html');
    expect(f.filter(r => r.antipattern === 'side-tab')).toHaveLength(0);
  });
});

describe('detectText — overused fonts', () => {
  test('detects Inter', () => {
    const f = detectText("body { font-family: 'Inter', sans-serif; }", 'test.css');
    expect(f.some(r => r.antipattern === 'overused-font')).toBe(true);
  });

  test('does not flag distinctive fonts', () => {
    const f = detectText("body { font-family: 'Instrument Sans', sans-serif; }", 'test.css');
    expect(f.filter(r => r.antipattern === 'overused-font')).toHaveLength(0);
  });
});

describe('detectText — flat type hierarchy', () => {
  test('flags sizes too close together', () => {
    const page = '<!DOCTYPE html><html><style>h1{font-size:18px}h2{font-size:16px}h3{font-size:15px}p{font-size:14px}.s{font-size:13px}</style></html>';
    const f = detectText(page, 'test.html');
    expect(f.some(r => r.antipattern === 'flat-type-hierarchy')).toBe(true);
  });

  test('passes good hierarchy', () => {
    const page = '<!DOCTYPE html><html><style>h1{font-size:48px}h2{font-size:32px}p{font-size:16px}.s{font-size:12px}</style></html>';
    const f = detectText(page, 'test.html');
    expect(f.filter(r => r.antipattern === 'flat-type-hierarchy')).toHaveLength(0);
  });
});

// jsdom fixture tests moved to detect-antipatterns-fixtures.test.mjs (run via node --test)

// ---------------------------------------------------------------------------
// Full page vs partial detection
// ---------------------------------------------------------------------------

describe('isFullPage', () => {
  test('detects DOCTYPE', () => expect(isFullPage('<!DOCTYPE html><html>')).toBe(true));
  test('detects <html>', () => expect(isFullPage('<html><head></head>')).toBe(true));
  test('detects <head>', () => expect(isFullPage('<head><meta charset="UTF-8"></head>')).toBe(true));
  test('rejects component/partial', () => expect(isFullPage('<div class="card">content</div>')).toBe(false));
  test('rejects JSX', () => expect(isFullPage('export default function Card() { return <div>hi</div> }')).toBe(false));
});

describe('partials skip page-level checks', () => {
  test('regex: partial with flat hierarchy is not flagged', () => {
    const partial = '<div style="font-size: 14px">text</div>\n<div style="font-size: 16px">text</div>\n<div style="font-size: 15px">text</div>';
    const f = detectText(partial, 'card.tsx');
    expect(f.filter(r => r.antipattern === 'flat-type-hierarchy')).toHaveLength(0);
  });

  test('regex: partial with single overused font is not flagged for single-font', () => {
    const partial = `<div style="font-family: 'Inter', sans-serif; font-size: 14px">text</div>\n`.repeat(25);
    const f = detectText(partial, 'card.tsx');
    expect(f.filter(r => r.antipattern === 'single-font')).toHaveLength(0);
  });

  test('regex: partial still flags border anti-patterns', () => {
    const partial = '<div class="border-l-4 border-blue-500 rounded-lg">card</div>';
    const f = detectText(partial, 'card.tsx');
    expect(f.some(r => r.antipattern === 'side-tab')).toBe(true);
  });

  test('regex: full page with flat hierarchy IS flagged', () => {
    const page = '<!DOCTYPE html><html><head></head><body>\n' +
      '<h1 style="font-size: 18px">h1</h1>\n<h2 style="font-size: 16px">h2</h2>\n' +
      '<p style="font-size: 14px">p</p>\n<span style="font-size: 15px">s</span>\n' +
      '<small style="font-size: 13px">sm</small>\n</body></html>';
    const f = detectText(page, 'index.html');
    expect(f.some(r => r.antipattern === 'flat-type-hierarchy')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Layout anti-patterns
// ---------------------------------------------------------------------------

describe('detectHtml — layout', () => {
  test('detects monotonous spacing via regex', () => {
    // A page where every padding/margin is 16px
    const html = '<!DOCTYPE html><html><body>' +
      '<div style="padding: 16px; margin-bottom: 16px;"><p style="margin-bottom: 16px;">a</p></div>'.repeat(5) +
      '</body></html>';
    const f = detectText(html, 'test.html');
    expect(f.some(r => r.antipattern === 'monotonous-spacing')).toBe(true);
  });

  test('detects everything centered via regex', () => {
    const html = `<!DOCTYPE html><html><body>
<h1 style="text-align: center;">Title</h1>
<p style="text-align: center;">Paragraph one more text here</p>
<p style="text-align: center;">Paragraph two more text here</p>
<p style="text-align: center;">Paragraph three more text here</p>
<p style="text-align: center;">Paragraph four more text here</p>
<p style="text-align: center;">Paragraph five more text here</p>
<p style="text-align: center;">Paragraph six more text here</p>
</body></html>`;
    const f = detectText(html, 'test.html');
    expect(f.some(r => r.antipattern === 'everything-centered')).toBe(true);
  });

});

// ---------------------------------------------------------------------------
// Motion anti-patterns
// ---------------------------------------------------------------------------

describe('checkElementMotion', () => {
  function mockStyle(overrides) {
    return { transitionProperty: '', animationName: 'none', animationTimingFunction: '', transitionTimingFunction: '', ...overrides };
  }

  test('detects bounce animation name', () => {
    const f = checkElementMotion('div', mockStyle({ animationName: 'bounce' }));
    expect(f.some(r => r.id === 'bounce-easing')).toBe(true);
  });

  test('detects elastic animation name', () => {
    const f = checkElementMotion('div', mockStyle({ animationName: 'elastic-in' }));
    expect(f.some(r => r.id === 'bounce-easing')).toBe(true);
  });

  test('detects overshoot cubic-bezier in animation timing', () => {
    const f = checkElementMotion('div', mockStyle({
      animationTimingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    }));
    expect(f.some(r => r.id === 'bounce-easing')).toBe(true);
  });

  test('detects overshoot cubic-bezier in transition timing', () => {
    const f = checkElementMotion('div', mockStyle({
      transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    }));
    expect(f.some(r => r.id === 'bounce-easing')).toBe(true);
  });

  test('passes standard ease-out-quart', () => {
    const f = checkElementMotion('div', mockStyle({
      transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }));
    expect(f.filter(r => r.id === 'bounce-easing')).toHaveLength(0);
  });

  test('passes standard ease', () => {
    const f = checkElementMotion('div', mockStyle({
      transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
    }));
    expect(f.filter(r => r.id === 'bounce-easing')).toHaveLength(0);
  });

  test('detects width transition', () => {
    const f = checkElementMotion('div', mockStyle({ transitionProperty: 'width' }));
    expect(f.some(r => r.id === 'layout-transition')).toBe(true);
  });

  test('detects height transition', () => {
    const f = checkElementMotion('div', mockStyle({ transitionProperty: 'height' }));
    expect(f.some(r => r.id === 'layout-transition')).toBe(true);
  });

  test('detects padding transition', () => {
    const f = checkElementMotion('div', mockStyle({ transitionProperty: 'padding' }));
    expect(f.some(r => r.id === 'layout-transition')).toBe(true);
  });

  test('detects margin transition', () => {
    const f = checkElementMotion('div', mockStyle({ transitionProperty: 'margin' }));
    expect(f.some(r => r.id === 'layout-transition')).toBe(true);
  });

  test('detects max-height transition', () => {
    const f = checkElementMotion('div', mockStyle({ transitionProperty: 'max-height' }));
    expect(f.some(r => r.id === 'layout-transition')).toBe(true);
  });

  test('detects layout prop among mixed transitions', () => {
    const f = checkElementMotion('div', mockStyle({ transitionProperty: 'opacity, width, color' }));
    expect(f.some(r => r.id === 'layout-transition')).toBe(true);
  });

  test('passes transform transition', () => {
    const f = checkElementMotion('div', mockStyle({ transitionProperty: 'transform' }));
    expect(f.filter(r => r.id === 'layout-transition')).toHaveLength(0);
  });

  test('passes opacity transition', () => {
    const f = checkElementMotion('div', mockStyle({ transitionProperty: 'opacity' }));
    expect(f.filter(r => r.id === 'layout-transition')).toHaveLength(0);
  });

  test('skips transition: all', () => {
    const f = checkElementMotion('div', mockStyle({ transitionProperty: 'all' }));
    expect(f.filter(r => r.id === 'layout-transition')).toHaveLength(0);
  });

  test('skips safe tags', () => {
    const f = checkElementMotion('button', mockStyle({
      animationName: 'bounce', transitionProperty: 'width',
    }));
    expect(f).toHaveLength(0);
  });
});

describe('detectText — motion', () => {
  test('detects animate-bounce Tailwind class', () => {
    const f = detectText('<div class="animate-bounce">loading</div>', 'test.html');
    expect(f.some(r => r.antipattern === 'bounce-easing')).toBe(true);
  });

  test('detects animation: bounce CSS', () => {
    const f = detectText('.icon { animation: bounce 1s infinite; }', 'test.css');
    expect(f.some(r => r.antipattern === 'bounce-easing')).toBe(true);
  });

  test('detects animation-name: elastic', () => {
    const f = detectText('.card { animation-name: elastic; }', 'test.css');
    expect(f.some(r => r.antipattern === 'bounce-easing')).toBe(true);
  });

  test('detects overshoot cubic-bezier', () => {
    const f = detectText('.btn { transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }', 'test.css');
    expect(f.some(r => r.antipattern === 'bounce-easing')).toBe(true);
  });

  test('passes standard cubic-bezier', () => {
    const f = detectText('.btn { transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1); }', 'test.css');
    expect(f.filter(r => r.antipattern === 'bounce-easing')).toHaveLength(0);
  });

  test('detects transition: width', () => {
    const f = detectText('.sidebar { transition: width 0.3s ease; }', 'test.css');
    expect(f.some(r => r.antipattern === 'layout-transition')).toBe(true);
  });

  test('detects transition: height', () => {
    const f = detectText('.panel { transition: height 0.4s ease-out; }', 'test.css');
    expect(f.some(r => r.antipattern === 'layout-transition')).toBe(true);
  });

  test('detects transition: max-height', () => {
    const f = detectText('.accordion { transition: max-height 0.5s ease; }', 'test.css');
    expect(f.some(r => r.antipattern === 'layout-transition')).toBe(true);
  });

  test('detects transition-property: width', () => {
    const f = detectText('.box { transition-property: width; transition-duration: 0.3s; }', 'test.css');
    expect(f.some(r => r.antipattern === 'layout-transition')).toBe(true);
  });

  test('skips transition: all', () => {
    const f = detectText('.card { transition: all 0.3s ease; }', 'test.css');
    expect(f.filter(r => r.antipattern === 'layout-transition')).toHaveLength(0);
  });

  test('skips transition: transform', () => {
    const f = detectText('.card { transition: transform 0.3s ease; }', 'test.css');
    expect(f.filter(r => r.antipattern === 'layout-transition')).toHaveLength(0);
  });

  test('skips transition: opacity', () => {
    const f = detectText('.btn { transition: opacity 0.2s ease; }', 'test.css');
    expect(f.filter(r => r.antipattern === 'layout-transition')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Dark glow anti-pattern
// ---------------------------------------------------------------------------

describe('checkElementGlow', () => {
  function mockStyle(overrides) {
    return { boxShadow: 'none', backgroundColor: '', ...overrides };
  }

  // Dark bg = luminance < 0.1 (e.g. #111827 = gray-900)
  const darkBg = { r: 17, g: 24, b: 39 }; // #111827
  const lightBg = { r: 249, g: 250, b: 251 }; // #f9fafb
  const mediumBg = { r: 107, g: 114, b: 128 }; // #6b7280

  test('detects blue glow on dark background', () => {
    const f = checkElementGlow('div', mockStyle({
      boxShadow: 'rgba(59, 130, 246, 0.4) 0px 0px 20px 0px',
    }), darkBg);
    expect(f.some(r => r.id === 'dark-glow')).toBe(true);
  });

  test('detects purple glow on dark background', () => {
    const f = checkElementGlow('div', mockStyle({
      boxShadow: 'rgba(139, 92, 246, 0.35) 0px 0px 25px 0px',
    }), darkBg);
    expect(f.some(r => r.id === 'dark-glow')).toBe(true);
  });

  test('detects glow in multi-shadow', () => {
    const f = checkElementGlow('div', mockStyle({
      boxShadow: 'rgba(0, 0, 0, 0.3) 0px 4px 6px 0px, rgba(168, 85, 247, 0.3) 0px 0px 30px 0px',
    }), darkBg);
    expect(f.some(r => r.id === 'dark-glow')).toBe(true);
  });

  test('passes gray shadow on dark background', () => {
    const f = checkElementGlow('div', mockStyle({
      boxShadow: 'rgba(0, 0, 0, 0.4) 0px 4px 12px 0px',
    }), darkBg);
    expect(f.filter(r => r.id === 'dark-glow')).toHaveLength(0);
  });

  test('passes colored shadow on light background', () => {
    const f = checkElementGlow('div', mockStyle({
      boxShadow: 'rgba(59, 130, 246, 0.4) 0px 0px 20px 0px',
    }), lightBg);
    expect(f.filter(r => r.id === 'dark-glow')).toHaveLength(0);
  });

  test('passes colored shadow on medium gray background', () => {
    const f = checkElementGlow('div', mockStyle({
      boxShadow: 'rgba(59, 130, 246, 0.5) 0px 0px 20px 0px',
    }), mediumBg);
    expect(f.filter(r => r.id === 'dark-glow')).toHaveLength(0);
  });

  test('passes focus ring (spread only, no blur)', () => {
    const f = checkElementGlow('div', mockStyle({
      boxShadow: 'rgba(59, 130, 246, 0.5) 0px 0px 0px 3px',
    }), darkBg);
    expect(f.filter(r => r.id === 'dark-glow')).toHaveLength(0);
  });

  test('passes subtle shadow (blur < 5px)', () => {
    const f = checkElementGlow('div', mockStyle({
      boxShadow: 'rgba(59, 130, 246, 0.2) 0px 1px 3px 0px',
    }), darkBg);
    expect(f.filter(r => r.id === 'dark-glow')).toHaveLength(0);
  });

  test('passes no shadow', () => {
    const f = checkElementGlow('div', mockStyle({ boxShadow: 'none' }), darkBg);
    expect(f.filter(r => r.id === 'dark-glow')).toHaveLength(0);
  });

  test('detects glow on buttons (not skipped by safe tags)', () => {
    const f = checkElementGlow('button', mockStyle({
      boxShadow: 'rgba(59, 130, 246, 0.4) 0px 0px 20px 0px',
    }), darkBg);
    expect(f.some(r => r.id === 'dark-glow')).toBe(true);
  });
});

describe('detectText — dark glow', () => {
  test('detects colored box-shadow glow on dark background', () => {
    const html = '<!DOCTYPE html><html><body style="background: #111827;"><div style="box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);">glow</div></body></html>';
    const f = detectText(html, 'test.html');
    expect(f.some(r => r.antipattern === 'dark-glow')).toBe(true);
  });

  test('skips gray shadow on dark background', () => {
    const html = '<!DOCTYPE html><html><body style="background: #111827;"><div style="box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);">shadow</div></body></html>';
    const f = detectText(html, 'test.html');
    expect(f.filter(r => r.antipattern === 'dark-glow')).toHaveLength(0);
  });

  test('skips colored shadow on light page', () => {
    const html = '<!DOCTYPE html><html><body style="background: #f9fafb;"><div style="box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);">glow</div></body></html>';
    const f = detectText(html, 'test.html');
    expect(f.filter(r => r.antipattern === 'dark-glow')).toHaveLength(0);
  });
});


// ---------------------------------------------------------------------------
// ANTIPATTERNS registry
// ---------------------------------------------------------------------------

describe('ANTIPATTERNS registry', () => {
  test('has at least 5 entries', () => {
    expect(ANTIPATTERNS.length).toBeGreaterThanOrEqual(5);
  });

  test('each entry has required fields', () => {
    for (const ap of ANTIPATTERNS) {
      expect(ap.id).toBeTypeOf('string');
      expect(ap.name).toBeTypeOf('string');
      expect(ap.description).toBeTypeOf('string');
    }
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

  test('returns empty for nonexistent dir', () => {
    expect(walkDir('/nonexistent/path/12345')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// CLI integration
// ---------------------------------------------------------------------------

describe('CLI', () => {
  function run(...args) {
    const result = spawnSync('node', [SCRIPT, ...args], { encoding: 'utf-8', timeout: 15000 });
    return { stdout: result.stdout || '', stderr: result.stderr || '', code: result.status };
  }

  test('--help exits 0', () => {
    const { stdout, code } = run('--help');
    expect(code).toBe(0);
    expect(stdout).toContain('Usage:');
  });

  test('should-pass exits 0', () => {
    const { code } = run(path.join(FIXTURES, 'should-pass.html'));
    expect(code).toBe(0);
  });

  test('should-flag exits 2 with findings', () => {
    const { code, stderr } = run(path.join(FIXTURES, 'should-flag.html'));
    expect(code).toBe(2);
    expect(stderr).toContain('side-tab');
  });

  test('--json outputs valid JSON', () => {
    const { stderr, code } = run('--json', path.join(FIXTURES, 'should-flag.html'));
    expect(code).toBe(2);
    const parsed = JSON.parse(stderr.trim());
    expect(parsed).toBeArray();
    expect(parsed.length).toBeGreaterThan(0);
  });

  test('--json on clean file outputs empty array', () => {
    const { stdout, code } = run('--json', path.join(FIXTURES, 'should-pass.html'));
    expect(code).toBe(0);
    expect(JSON.parse(stdout.trim())).toEqual([]);
  });

  test('--fast mode works', () => {
    const { code } = run('--fast', path.join(FIXTURES, 'should-flag.html'));
    expect(code).toBe(2);
  });

  test('linked stylesheet detected (jsdom default)', () => {
    const { code, stderr } = run(path.join(FIXTURES, 'linked-stylesheet.html'));
    expect(code).toBe(2);
    expect(stderr).toContain('side-tab');
  });

  test('warns on nonexistent path', () => {
    const { stderr } = run('/nonexistent/file/xyz.html');
    expect(stderr).toContain('Warning');
  });
});
