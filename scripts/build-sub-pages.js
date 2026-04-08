/**
 * Generate static HTML files for /skills, /anti-patterns, /tutorials.
 *
 * Called from both scripts/build.js (before buildStaticSite) and
 * server/index.js (at module load), so dev and prod share the same
 * code path and output shape.
 *
 * Output lives under public/skills/, public/anti-patterns/,
 * public/tutorials/, all gitignored. Bun's HTML loader picks them up
 * the same way it picks up the hand-authored pages.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  buildSubPageData,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
} from './lib/sub-pages-data.js';
import { renderMarkdown, slugify } from './lib/render-markdown.js';
import { renderPage } from './lib/render-page.js';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render one skill detail page HTML body (without the site shell).
 */
function renderSkillDetail(skill, knownSkillIds) {
  const bodyHtml = renderMarkdown(skill.body, {
    knownSkillIds,
    currentSkillId: skill.id,
  });

  const editorialHtml = skill.editorial
    ? renderMarkdown(skill.editorial.body, { knownSkillIds, currentSkillId: skill.id })
    : '';

  const tagline = skill.editorial?.frontmatter?.tagline || skill.description;
  const categoryLabel = CATEGORY_LABELS[skill.category] || skill.category;

  // Reference files as collapsible <details> blocks
  let referencesHtml = '';
  if (skill.references && skill.references.length > 0) {
    const refs = skill.references
      .map((ref) => {
        const slug = slugify(ref.name);
        const refBody = renderMarkdown(ref.content, {
          knownSkillIds,
          currentSkillId: skill.id,
        });
        const title = ref.name
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        return `
<details class="skill-reference" id="reference-${slug}">
  <summary><span class="skill-reference-label">Reference</span><span class="skill-reference-title">${escapeHtml(title)}</span></summary>
  <div class="prose skill-reference-body">
${refBody}
  </div>
</details>`;
      })
      .join('\n');
    referencesHtml = `
<section class="skill-references" aria-label="Reference material">
  <h2 class="skill-references-heading">Deeper reference</h2>
  ${refs}
</section>`;
  }

  const metaStrip = `
<div class="skill-meta-strip">
  <span class="skill-meta-chip skill-meta-category" data-category="${skill.category}">${escapeHtml(categoryLabel)}</span>
  <span class="skill-meta-chip">User-invocable</span>
  ${skill.argumentHint ? `<span class="skill-meta-chip skill-meta-args">${escapeHtml(skill.argumentHint)}</span>` : ''}
</div>`;

  return `
<article class="skill-detail">
  <header class="skill-detail-header">
    <p class="skill-detail-eyebrow"><a href="/skills">Skills</a> / ${escapeHtml(categoryLabel)}</p>
    <h1 class="skill-detail-title">/${escapeHtml(skill.id)}</h1>
    <p class="skill-detail-tagline">${escapeHtml(tagline)}</p>
    ${metaStrip}
  </header>

  ${editorialHtml ? `<section class="skill-detail-editorial prose">\n${editorialHtml}\n</section>` : ''}

  <div class="skill-detail-divider">
    <span>The skill itself</span>
  </div>

  <section class="skill-detail-body prose">
${bodyHtml}
  </section>

  ${referencesHtml}
</article>
`;
}

/**
 * Render the /skills index page body.
 */
function renderSkillsIndex(skillsByCategory) {
  let html = `
<article class="sub-page-content">
  <header class="sub-page-header">
    <p class="sub-page-eyebrow">22 commands</p>
    <h1 class="sub-page-title">Skills</h1>
    <p class="sub-page-lede">One skill (/impeccable) teaches your AI design. Twenty-one commands steer the result. Each one is a small, opinionated tool that knows how to fix one specific thing.</p>
  </header>
`;

  for (const category of CATEGORY_ORDER) {
    const list = skillsByCategory[category] || [];
    if (list.length === 0) continue;
    html += `
  <section class="skills-category" data-category="${category}">
    <div class="skills-category-header">
      <h2 class="skills-category-title">${escapeHtml(CATEGORY_LABELS[category])}</h2>
      <p class="skills-category-desc">${escapeHtml(CATEGORY_DESCRIPTIONS[category])}</p>
    </div>
    <ul class="skills-category-list">
${list
  .map(
    (s) => `      <li class="skills-category-item">
        <a href="/skills/${s.id}" class="skills-category-link">
          <span class="skills-category-name">/${escapeHtml(s.id)}</span>
          <span class="skills-category-desc-text">${escapeHtml(s.description)}</span>
        </a>
      </li>`,
  )
  .join('\n')}
    </ul>
  </section>
`;
  }

  html += `</article>`;
  return html;
}

/**
 * Entry point. Generates all sub-page HTML files.
 *
 * @param {string} rootDir
 * @returns {Promise<{ files: string[] }>} list of generated file paths (absolute)
 */
export async function generateSubPages(rootDir) {
  const data = buildSubPageData(rootDir);
  const outDirs = {
    skills: path.join(rootDir, 'public/skills'),
    antiPatterns: path.join(rootDir, 'public/anti-patterns'),
    tutorials: path.join(rootDir, 'public/tutorials'),
  };

  // Fresh output dirs each time so stale files don't linger.
  for (const dir of Object.values(outDirs)) {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
  }

  const generated = [];

  // Skills index
  {
    const html = renderPage({
      title: 'Skills — Impeccable',
      description:
        '22 commands that teach your AI harness how to design. Browse by category: create, evaluate, refine, simplify, harden, system.',
      bodyHtml: renderSkillsIndex(data.skillsByCategory),
      activeNav: 'skills',
      canonicalPath: '/skills',
    });
    const out = path.join(outDirs.skills, 'index.html');
    fs.writeFileSync(out, html, 'utf-8');
    generated.push(out);
  }

  // Skills detail pages
  for (const skill of data.skills) {
    const bodyHtml = renderSkillDetail(skill, data.knownSkillIds);
    const title = `/${skill.id} — Impeccable skill`;
    const description = skill.editorial?.frontmatter?.tagline || skill.description;
    const html = renderPage({
      title,
      description,
      bodyHtml,
      activeNav: 'skills',
      canonicalPath: `/skills/${skill.id}`,
    });
    const out = path.join(outDirs.skills, `${skill.id}.html`);
    fs.writeFileSync(out, html, 'utf-8');
    generated.push(out);
  }

  return { files: generated };
}
