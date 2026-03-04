import path from 'path';
import { cleanDir, ensureDir, writeFile, generateYamlFrontmatter, replacePlaceholders } from '../utils.js';

/**
 * Google Antigravity Transformer (Skills Only)
 *
 * All skills output to .agent/skills/{name}/SKILL.md
 * Frontmatter: name, description (truncated to 200 chars)
 *
 * @param {Array} skills - All skills (including user-invokable ones)
 * @param {string} distDir - Distribution output directory
 * @param {Object} patterns - Design patterns data (unused)
 * @param {Object} options - Optional settings
 * @param {string} options.prefix - Prefix to add to user-invokable skill names (e.g., 'i-')
 * @param {string} options.outputSuffix - Suffix for output directory (e.g., '-prefixed')
 */
export function transformAntigravity(skills, distDir, patterns = null, options = {}) {
  const { prefix = '', outputSuffix = '' } = options;
  const antigravityDir = path.join(distDir, `antigravity${outputSuffix}`);
  const skillsDir = path.join(antigravityDir, '.agent/skills');

  cleanDir(antigravityDir);
  ensureDir(skillsDir);

  let refCount = 0;
  for (const skill of skills) {
    const skillName = skill.userInvokable ? `${prefix}${skill.name}` : skill.name;
    const skillDir = path.join(skillsDir, skillName);

    // Truncate description to 200 chars
    const description = skill.description.length > 200
      ? skill.description.slice(0, 197) + '...'
      : skill.description;

    const frontmatter = generateYamlFrontmatter({
      name: skillName,
      description,
    });

    const skillBody = replacePlaceholders(skill.body, 'antigravity');
    const content = `${frontmatter}\n\n${skillBody}`;
    const outputPath = path.join(skillDir, 'SKILL.md');
    writeFile(outputPath, content);

    // Copy reference files if they exist
    if (skill.references && skill.references.length > 0) {
      const refDir = path.join(skillDir, 'reference');
      ensureDir(refDir);
      for (const ref of skill.references) {
        const refOutputPath = path.join(refDir, `${ref.name}.md`);
        const refContent = replacePlaceholders(ref.content, 'antigravity');
        writeFile(refOutputPath, refContent);
        refCount++;
      }
    }
  }

  const userInvokableCount = skills.filter(s => s.userInvokable).length;
  const refInfo = refCount > 0 ? ` (${refCount} reference files)` : '';
  const prefixInfo = prefix ? ` [${prefix}prefixed]` : '';
  console.log(`✓ Antigravity${prefixInfo}: ${skills.length} skills (${userInvokableCount} user-invokable)${refInfo}`);
}
