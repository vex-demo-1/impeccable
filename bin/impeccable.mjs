#!/usr/bin/env bun

/**
 * Impeccable CLI
 *
 * Usage:
 *   npx impeccable detect [file-or-dir-or-url...]
 *   npx impeccable detect --fast --json src/
 *   npx impeccable --help
 */

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
  console.log(`Usage: impeccable <command> [options]

Commands:
  detect [file-or-dir-or-url...]   Scan for UI anti-patterns and design quality issues

Options:
  --help    Show this help message

Run 'impeccable detect --help' for detection-specific options.`);
  process.exit(0);
}

if (command === '--version' || command === '-v') {
  const pkg = await import('../package.json', { with: { type: 'json' } });
  console.log(pkg.default.version);
  process.exit(0);
}

if (command === 'detect') {
  // Remove 'detect' from argv so the detection script sees the right args
  process.argv = [process.argv[0], process.argv[1], ...args.slice(1)];
  const { detectCli } = await import('../source/skills/critique/scripts/detect-antipatterns.mjs');
  await detectCli();
} else {
  console.error(`Unknown command: ${command}`);
  console.error(`Run 'impeccable --help' for available commands.`);
  process.exit(1);
}
