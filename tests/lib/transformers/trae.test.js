import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { transformTrae } from '../../../scripts/lib/transformers/trae.js';

const TEST_DIR = path.join(process.cwd(), 'test-tmp-trae');

describe('transformTrae', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test('should create correct directory structure for both variants', () => {
    transformTrae([], TEST_DIR);

    expect(fs.existsSync(path.join(TEST_DIR, 'trae/.trae-cn/skills'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIR, 'trae/.trae/skills'))).toBe(true);
  });

  test('should create skill with frontmatter and body', () => {
    const skills = [
      {
        name: 'test-skill',
        description: 'A test skill',
        license: 'MIT',
        userInvokable: true,
        body: 'Skill instructions here.'
      }
    ];

    transformTrae(skills, TEST_DIR);

    const chinaPath = path.join(TEST_DIR, 'trae/.trae-cn/skills/test-skill/SKILL.md');
    const intlPath = path.join(TEST_DIR, 'trae/.trae/skills/test-skill/SKILL.md');
    expect(fs.existsSync(chinaPath)).toBe(true);
    expect(fs.existsSync(intlPath)).toBe(true);

    const content = fs.readFileSync(chinaPath, 'utf-8');
    expect(content).toContain('---');
    expect(content).toContain('name: test-skill');
    expect(content).toContain('description: A test skill');
    expect(content).toContain('license: MIT');
    expect(content).toContain('user-invocable: true');
    expect(content).toContain('Skill instructions here.');
  });

  test('should copy reference files', () => {
    const skills = [
      {
        name: 'frontend-design',
        description: 'Design skill',
        license: 'MIT',
        body: 'Design instructions.',
        references: [
          { name: 'typography', content: 'Typography reference', filePath: '/fake/path/typography.md' }
        ]
      }
    ];

    transformTrae(skills, TEST_DIR);

    expect(fs.existsSync(path.join(TEST_DIR, 'trae/.trae-cn/skills/frontend-design/reference/typography.md'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIR, 'trae/.trae/skills/frontend-design/reference/typography.md'))).toBe(true);
  });

  test('should support prefix option', () => {
    const skills = [
      { name: 'audit', description: 'Audit', license: '', body: 'Audit body' }
    ];

    transformTrae(skills, TEST_DIR, null, { prefix: 'i-', outputSuffix: '-prefixed' });

    expect(fs.existsSync(path.join(TEST_DIR, 'trae-prefixed/.trae-cn/skills/i-audit/SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIR, 'trae-prefixed/.trae/skills/i-audit/SKILL.md'))).toBe(true);
  });

  test('should log correct summary', () => {
    const consoleMock = mock(() => {});
    const originalLog = console.log;
    console.log = consoleMock;

    const skills = [
      { name: 'skill1', description: '', license: '', userInvokable: true, body: 'body1' },
      { name: 'skill2', description: '', license: '', userInvokable: false, body: 'body2' }
    ];

    transformTrae(skills, TEST_DIR);

    console.log = originalLog;

    expect(consoleMock).toHaveBeenCalledWith(expect.stringContaining('✓ Trae:'));
    expect(consoleMock).toHaveBeenCalledWith(expect.stringContaining('2 skills'));
    expect(consoleMock).toHaveBeenCalledWith(expect.stringContaining('1 user-invocable'));
  });
});
