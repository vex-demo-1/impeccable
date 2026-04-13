/**
 * CLI helper: insert/remove the live variant mode script tag in the project's
 * main HTML entry point.
 *
 * On first live run, the agent generates `config.json` in this script's
 * directory with the project's insertion target (framework-specific). On
 * every subsequent run, this script handles insert/remove deterministically
 * with zero LLM involvement.
 *
 * Usage:
 *   node live-inject.mjs --port PORT   # Insert the live script tag
 *   node live-inject.mjs --remove      # Remove the live script tag
 *   node live-inject.mjs --check       # Check whether config.json exists
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, 'config.json');
const MARKER_OPEN_TEXT = 'impeccable-live-start';
const MARKER_CLOSE_TEXT = 'impeccable-live-end';

export async function injectCli() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: node live-inject.mjs [options]

Insert or remove the live mode script tag in the project's HTML entry point.
Reads configuration from config.json (in this same directory).

Modes:
  --port PORT   Insert script tag pointing at http://localhost:PORT/live.js
  --remove      Remove the script tag (if present)
  --check       Print whether config.json exists and its content

Output (JSON):
  { ok, file, inserted|removed, config? }`);
    process.exit(0);
  }

  if (args.includes('--check')) {
    if (!fs.existsSync(CONFIG_PATH)) {
      console.log(JSON.stringify({ ok: false, error: 'config_missing', path: CONFIG_PATH }));
      process.exit(0);
    }
    try {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      console.log(JSON.stringify({ ok: true, config: cfg, path: CONFIG_PATH }));
    } catch (err) {
      console.log(JSON.stringify({ ok: false, error: 'config_invalid', message: err.message }));
    }
    return;
  }

  // Load config
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(JSON.stringify({ ok: false, error: 'config_missing', path: CONFIG_PATH }));
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  validateConfig(config);

  const absFile = path.resolve(process.cwd(), config.file);
  if (!fs.existsSync(absFile)) {
    console.error(JSON.stringify({ ok: false, error: 'file_not_found', file: config.file }));
    process.exit(1);
  }

  const content = fs.readFileSync(absFile, 'utf-8');

  if (args.includes('--remove')) {
    const updated = removeTag(content, config.commentSyntax);
    if (updated === content) {
      console.log(JSON.stringify({ ok: true, file: config.file, removed: false, note: 'no tag present' }));
      return;
    }
    fs.writeFileSync(absFile, updated, 'utf-8');
    console.log(JSON.stringify({ ok: true, file: config.file, removed: true }));
    return;
  }

  // Insert mode — need --port
  const portIdx = args.indexOf('--port');
  const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : NaN;
  if (!Number.isFinite(port)) {
    console.error(JSON.stringify({ ok: false, error: 'missing_port' }));
    process.exit(1);
  }

  // Already inserted? Replace to refresh the port.
  const withoutOld = removeTag(content, config.commentSyntax);
  const updated = insertTag(withoutOld, config, port);
  if (updated === withoutOld) {
    console.error(JSON.stringify({ ok: false, error: 'insertion_point_not_found', anchor: config.insertBefore }));
    process.exit(1);
  }
  fs.writeFileSync(absFile, updated, 'utf-8');
  console.log(JSON.stringify({ ok: true, file: config.file, inserted: true, port }));
}

// ---------------------------------------------------------------------------
// Core operations
// ---------------------------------------------------------------------------

function validateConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') throw new Error('config.json must be an object');
  if (typeof cfg.file !== 'string') throw new Error('config.file (string) required');
  if (typeof cfg.insertBefore !== 'string' && typeof cfg.insertAfter !== 'string') {
    throw new Error('config.insertBefore or config.insertAfter (string) required');
  }
  if (cfg.commentSyntax !== 'html' && cfg.commentSyntax !== 'jsx') {
    throw new Error("config.commentSyntax must be 'html' or 'jsx'");
  }
}

function commentOpen(syntax) { return syntax === 'jsx' ? '{/*' : '<!--'; }
function commentClose(syntax) { return syntax === 'jsx' ? '*/}' : '-->'; }

function buildTagBlock(syntax, port) {
  const open = commentOpen(syntax);
  const close = commentClose(syntax);
  return (
    open + ' ' + MARKER_OPEN_TEXT + ' ' + close + '\n' +
    '<script src="http://localhost:' + port + '/live.js"></script>\n' +
    open + ' ' + MARKER_CLOSE_TEXT + ' ' + close + '\n'
  );
}

function insertTag(content, config, port) {
  const block = buildTagBlock(config.commentSyntax, port);
  if (config.insertBefore) {
    const idx = content.indexOf(config.insertBefore);
    if (idx === -1) return content;
    return content.slice(0, idx) + block + content.slice(idx);
  }
  // insertAfter
  const idx = content.indexOf(config.insertAfter);
  if (idx === -1) return content;
  const after = idx + config.insertAfter.length;
  // Preserve a single trailing newline if the anchor didn't end with one
  const prefix = content[after] === '\n' ? content.slice(0, after + 1) : content.slice(0, after) + '\n';
  return prefix + block + content.slice(prefix.length);
}

/**
 * Remove the live script block. Matches either HTML or JSX comment markers
 * regardless of config (so stale tags from a wrong config can still be cleaned).
 */
function removeTag(content, _syntax) {
  // Two patterns: HTML comment markers or JSX comment markers, with any content between.
  const patterns = [
    /\n?<!--\s*impeccable-live-start\s*-->[\s\S]*?<!--\s*impeccable-live-end\s*-->\n?/,
    /\n?\{\/\*\s*impeccable-live-start\s*\*\/\}[\s\S]*?\{\/\*\s*impeccable-live-end\s*\*\/\}\n?/,
  ];
  for (const pat of patterns) {
    const next = content.replace(pat, '\n');
    if (next !== content) return next;
  }
  return content;
}

// ---------------------------------------------------------------------------
// Auto-execute
// ---------------------------------------------------------------------------

const _running = process.argv[1];
if (_running?.endsWith('live-inject.mjs') || _running?.endsWith('live-inject.mjs/')) {
  injectCli();
}

export { insertTag, removeTag, validateConfig, buildTagBlock };
