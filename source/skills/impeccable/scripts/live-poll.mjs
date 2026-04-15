/**
 * CLI client for the live variant mode poll/reply protocol.
 *
 * Usage:
 *   npx impeccable poll                         # Block until browser event, print JSON
 *   npx impeccable poll --timeout=60000         # Custom timeout (ms)
 *   npx impeccable poll --reply <id> done       # Reply "done" to event <id>
 *   npx impeccable poll --reply <id> error "msg" # Reply with error
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { Agent, setGlobalDispatcher } from 'undici';

// Disable undici's default 300s headersTimeout so long-polls can sit open
// indefinitely (until a browser event or the server's own timeout fires).
// Without this, fetch() throws a bare "fetch failed" at 5 minutes even
// though the server would have happily kept the connection alive.
setGlobalDispatcher(new Agent({ headersTimeout: 0, bodyTimeout: 0 }));

const LIVE_PID_FILE = path.join(process.cwd(), '.impeccable-live.json');

function readServerInfo() {
  try {
    return JSON.parse(fs.readFileSync(LIVE_PID_FILE, 'utf-8'));
  } catch {
    console.error('No running live server found. Start one with: npx impeccable live');
    process.exit(1);
  }
}

export async function pollCli() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: impeccable poll [options]

Wait for a browser event from the live variant server, or reply to one.

Modes:
  poll                             Block until a browser event arrives, print JSON
  poll --reply <id> done           Reply "done" to event <id>
  poll --reply <id> error "msg"    Reply with an error message

Options:
  --timeout=MS   Poll timeout in milliseconds (default: 120000)
  --help         Show this help message`);
    process.exit(0);
  }

  const info = readServerInfo();
  const base = `http://localhost:${info.port}`;

  // Reply mode: npx impeccable poll --reply <id> <status> [--file path] [message]
  const replyIdx = args.indexOf('--reply');
  if (replyIdx !== -1) {
    const id = args[replyIdx + 1];
    const status = args[replyIdx + 2] || 'done';
    const fileIdx = args.indexOf('--file');
    const filePath = fileIdx !== -1 && fileIdx + 1 < args.length ? args[fileIdx + 1] : undefined;
    // Message is any remaining positional arg that isn't a flag
    const message = args.find((a, i) => i > replyIdx + 2 && !a.startsWith('--') && i !== fileIdx + 1) || undefined;

    if (!id) {
      console.error('Usage: npx impeccable poll --reply <id> <status> [--file path] [message]');
      process.exit(1);
    }

    try {
      const res = await fetch(`${base}/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: info.token,
          id,
          type: status,
          message,
          file: filePath,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error(`Reply failed (${res.status}):`, body.error || res.statusText);
        process.exit(1);
      }

      // Success — silent exit (agent doesn't need output for replies)
    } catch (err) {
      if (err.cause?.code === 'ECONNREFUSED') {
        console.error('Live server not running. Start one with: npx impeccable live');
      } else {
        console.error('Reply failed:', err.message);
      }
      process.exit(1);
    }
    return;
  }

  // Poll mode: block until browser event. Default 10 min; undici's default
  // 5-min headers-timeout is disabled at import time so this can sit open
  // indefinitely without fetch errors.
  const timeoutArg = args.find(a => a.startsWith('--timeout='));
  const timeout = timeoutArg ? parseInt(timeoutArg.split('=')[1], 10) : 600000;

  try {
    const res = await fetch(`${base}/poll?token=${info.token}&timeout=${timeout}`);

    if (res.status === 401) {
      console.error('Authentication failed. The server token may have changed.');
      console.error('Try restarting: npx impeccable live stop && npx impeccable live');
      process.exit(1);
    }

    if (!res.ok) {
      console.error(`Poll failed: ${res.status} ${res.statusText}`);
      process.exit(1);
    }

    const event = await res.json();

    // Auto-handle accept/discard via deterministic script
    if (event.type === 'accept' || event.type === 'discard') {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const acceptScript = path.join(__dirname, 'live-accept.mjs');
      const scriptArgs = event.type === 'discard'
        ? ['--id', event.id, '--discard']
        : ['--id', event.id, '--variant', event.variantId];
      try {
        const out = execSync(
          `node "${acceptScript}" ${scriptArgs.join(' ')}`,
          { encoding: 'utf-8', cwd: process.cwd(), timeout: 30_000 }
        );
        event._acceptResult = JSON.parse(out.trim());
      } catch (err) {
        event._acceptResult = { handled: false, error: err.message };
      }
    }

    // Print the event as JSON — the agent reads this from stdout
    console.log(JSON.stringify(event));
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED') {
      console.error('Live server not running. Start one with: npx impeccable live');
    } else {
      console.error('Poll failed:', err.message);
    }
    process.exit(1);
  }
}

// Auto-execute when run directly
const _running = process.argv[1];
if (_running?.endsWith('live-poll.mjs') || _running?.endsWith('live-poll.mjs/')) {
  pollCli();
}
