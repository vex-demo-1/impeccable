#!/usr/bin/env node
/**
 * Live variant mode server (self-contained, zero dependencies).
 *
 * Serves the browser script (/live.js), the detection overlay (/detect.js),
 * uses Server-Sent Events (SSE) for server→browser push, and HTTP POST for
 * browser→server events. Agent communicates via HTTP long-poll (/poll).
 *
 * Usage:
 *   node <scripts_path>/live-server.mjs          # start
 *   node <scripts_path>/live-server.mjs stop      # stop
 *   node <scripts_path>/live-server.mjs --help
 */

import http from 'node:http';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIVE_PID_FILE = path.join(os.tmpdir(), 'impeccable-live.json');
const DEFAULT_POLL_TIMEOUT = 120_000;

// ---------------------------------------------------------------------------
// Port detection
// ---------------------------------------------------------------------------

async function findOpenPort(start = 8400) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(start, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', () => resolve(findOpenPort(start + 1)));
  });
}

// ---------------------------------------------------------------------------
// Session state
// ---------------------------------------------------------------------------

const state = {
  token: null,
  port: null,
  sseClients: new Set(),   // SSE response objects (server→browser push)
  pendingEvents: [],        // browser events waiting for agent poll
  pendingPolls: [],         // agent poll callbacks waiting for browser events
  exitTimer: null,
};

function enqueueEvent(event) {
  if (state.pendingPolls.length > 0) {
    state.pendingPolls.shift()(event);
  } else {
    state.pendingEvents.push(event);
  }
}

/** Push a message to all connected SSE clients. */
function broadcast(msg) {
  const data = 'data: ' + JSON.stringify(msg) + '\n\n';
  for (const res of state.sseClients) {
    try { res.write(data); } catch { /* client gone */ }
  }
}

// ---------------------------------------------------------------------------
// Load scripts
// ---------------------------------------------------------------------------

function loadBrowserScripts() {
  // Detection script: look relative to the skill scripts dir, then fall back
  // to the npm package location (src/detect-antipatterns-browser.js)
  const detectPaths = [
    path.join(__dirname, '..', '..', '..', '..', 'src', 'detect-antipatterns-browser.js'),
    path.join(process.cwd(), 'node_modules', 'impeccable', 'src', 'detect-antipatterns-browser.js'),
  ];
  let detectScript = '';
  for (const p of detectPaths) {
    try { detectScript = fs.readFileSync(p, 'utf-8'); break; } catch { /* try next */ }
  }

  const livePath = path.join(__dirname, 'live-browser.js');
  let liveScript = '';
  try {
    liveScript = fs.readFileSync(livePath, 'utf-8');
  } catch {
    process.stderr.write('Error: live-browser.js not found at ' + livePath + '\n');
    process.exit(1);
  }

  return { detectScript, liveScript };
}

function hasProjectContext() {
  try {
    fs.accessSync(path.join(process.cwd(), '.impeccable.md'), fs.constants.R_OK);
    return true;
  } catch { return false; }
}

// ---------------------------------------------------------------------------
// Validation (inline — no external import needed for self-contained script)
// ---------------------------------------------------------------------------

const VISUAL_ACTIONS = [
  'impeccable', 'bolder', 'quieter', 'distill', 'polish', 'typeset',
  'colorize', 'layout', 'adapt', 'animate', 'delight', 'overdrive',
];

function validateEvent(msg) {
  if (!msg || typeof msg !== 'object' || !msg.type) return 'Missing or invalid message';
  switch (msg.type) {
    case 'generate':
      if (!msg.id || typeof msg.id !== 'string') return 'generate: missing id';
      if (!msg.action || !VISUAL_ACTIONS.includes(msg.action)) return 'generate: invalid action';
      if (!Number.isInteger(msg.count) || msg.count < 1 || msg.count > 8) return 'generate: count must be 1-8';
      if (!msg.element || !msg.element.outerHTML) return 'generate: missing element context';
      return null;
    case 'accept':
      if (!msg.id) return 'accept: missing id';
      if (!msg.variantId) return 'accept: missing variantId';
      return null;
    case 'discard':
      return msg.id ? null : 'discard: missing id';
    case 'exit':
      return null;
    default:
      return 'Unknown event type: ' + msg.type;
  }
}

// ---------------------------------------------------------------------------
// HTTP request handler
// ---------------------------------------------------------------------------

function createRequestHandler({ detectScript, liveScriptWithToken }) {
  return (req, res) => {
    const url = new URL(req.url, `http://localhost:${state.port}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const p = url.pathname;

    // --- Scripts ---
    if (p === '/live.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(liveScriptWithToken);
      return;
    }
    if (p === '/detect.js' || p === '/') {
      if (!detectScript) { res.writeHead(404); res.end('Not available'); return; }
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(detectScript);
      return;
    }

    // --- Health ---
    if (p === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok', port: state.port, mode: 'variant',
        hasProjectContext: hasProjectContext(),
        connectedClients: state.sseClients.size,
      }));
      return;
    }

    // --- Source file (no-HMR fallback) ---
    if (p === '/source') {
      const token = url.searchParams.get('token');
      if (token !== state.token) { res.writeHead(401); res.end('Unauthorized'); return; }
      const filePath = url.searchParams.get('path');
      if (!filePath || filePath.includes('..')) { res.writeHead(400); res.end('Bad path'); return; }
      const absPath = path.resolve(process.cwd(), filePath);
      if (!absPath.startsWith(process.cwd())) { res.writeHead(403); res.end('Forbidden'); return; }
      try {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync(absPath, 'utf-8'));
      } catch { res.writeHead(404); res.end('File not found'); }
      return;
    }

    // --- SSE: server→browser push (replaces WebSocket) ---
    if (p === '/events' && req.method === 'GET') {
      const token = url.searchParams.get('token');
      if (token !== state.token) { res.writeHead(401); res.end('Unauthorized'); return; }
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      res.write('data: ' + JSON.stringify({
        type: 'connected',
        hasProjectContext: hasProjectContext(),
      }) + '\n\n');

      state.sseClients.add(res);
      clearTimeout(state.exitTimer);

      req.on('close', () => {
        state.sseClients.delete(res);
        if (state.sseClients.size === 0) {
          clearTimeout(state.exitTimer);
          state.exitTimer = setTimeout(() => {
            if (state.sseClients.size === 0) enqueueEvent({ type: 'exit' });
          }, 8000);
        }
      });
      return;
    }

    // --- Browser→server events (replaces WebSocket messages) ---
    if (p === '/events' && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        let msg;
        try { msg = JSON.parse(body); } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }
        if (msg.token !== state.token) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }
        const error = validateEvent(msg);
        if (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error }));
          return;
        }
        enqueueEvent(msg);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }

    // --- Stop ---
    if (p === '/stop') {
      const token = url.searchParams.get('token');
      if (token !== state.token) { res.writeHead(401); res.end('Unauthorized'); return; }
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('stopping');
      shutdown();
      return;
    }

    // --- Agent poll ---
    if (p === '/poll' && req.method === 'GET') {
      handlePollGet(req, res, url);
      return;
    }
    if (p === '/poll' && req.method === 'POST') {
      handlePollPost(req, res);
      return;
    }

    res.writeHead(404); res.end('Not found');
  };
}

// ---------------------------------------------------------------------------
// Agent poll endpoints (unchanged from WS version)
// ---------------------------------------------------------------------------

function handlePollGet(req, res, url) {
  const token = url.searchParams.get('token');
  if (token !== state.token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }
  const timeout = parseInt(url.searchParams.get('timeout') || DEFAULT_POLL_TIMEOUT, 10);
  if (state.pendingEvents.length > 0) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state.pendingEvents.shift()));
    return;
  }
  const timer = setTimeout(() => {
    const idx = state.pendingPolls.indexOf(resolve);
    if (idx !== -1) state.pendingPolls.splice(idx, 1);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ type: 'timeout' }));
  }, timeout);
  function resolve(event) {
    clearTimeout(timer);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(event));
  }
  state.pendingPolls.push(resolve);
  req.on('close', () => {
    clearTimeout(timer);
    const idx = state.pendingPolls.indexOf(resolve);
    if (idx !== -1) state.pendingPolls.splice(idx, 1);
  });
}

function handlePollPost(req, res) {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    let msg;
    try { msg = JSON.parse(body); } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }
    if (msg.token !== state.token) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    // Forward the reply to the browser via SSE
    broadcast({ type: msg.type || 'done', id: msg.id, message: msg.message, file: msg.file, data: msg.data });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

let httpServer = null;

function shutdown() {
  try { fs.unlinkSync(LIVE_PID_FILE); } catch {}
  for (const res of state.sseClients) { try { res.end(); } catch {} }
  state.sseClients.clear();
  for (const resolve of state.pendingPolls) resolve({ type: 'exit' });
  state.pendingPolls.length = 0;
  if (httpServer) httpServer.close();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node live-server.mjs [options]

Start the live variant mode server (zero dependencies).

Commands:
  (default)     Start the server
  stop          Stop a running server

Options:
  --port=PORT   Use a specific port (default: auto-detect starting at 8400)
  --help        Show this help

Endpoints:
  /live.js      Browser script (element picker + variant cycling)
  /detect.js    Detection overlay (backwards compatible)
  /events       SSE stream (server→browser) + POST (browser→server)
  /poll          Long-poll for agent CLI
  /source       Raw source file reader (no-HMR fallback)
  /health       Health check`);
  process.exit(0);
}

if (args.includes('stop')) {
  try {
    const info = JSON.parse(fs.readFileSync(LIVE_PID_FILE, 'utf-8'));
    const res = await fetch(`http://localhost:${info.port}/stop?token=${info.token}`);
    if (res.ok) console.log(`Stopped live server on port ${info.port}.`);
  } catch { console.log('No running live server found.'); }
  process.exit(0);
}

// Check for existing session
try {
  const existing = JSON.parse(fs.readFileSync(LIVE_PID_FILE, 'utf-8'));
  try { process.kill(existing.pid, 0);
    console.error(`Live server already running on port ${existing.port} (pid ${existing.pid}).`);
    console.error('Stop it first with: node ' + path.basename(fileURLToPath(import.meta.url)) + ' stop');
    process.exit(1);
  } catch { fs.unlinkSync(LIVE_PID_FILE); }
} catch {}

state.token = randomUUID();
const portArg = args.find(a => a.startsWith('--port='));
state.port = portArg ? parseInt(portArg.split('=')[1], 10) : await findOpenPort();

const { detectScript, liveScript } = loadBrowserScripts();
const liveScriptWithToken =
  `window.__IMPECCABLE_TOKEN__ = '${state.token}';\n` +
  `window.__IMPECCABLE_PORT__ = ${state.port};\n` +
  liveScript;

httpServer = http.createServer(createRequestHandler({ detectScript, liveScriptWithToken }));

httpServer.listen(state.port, '127.0.0.1', () => {
  fs.writeFileSync(LIVE_PID_FILE, JSON.stringify({ pid: process.pid, port: state.port, token: state.token }));
  const url = `http://localhost:${state.port}`;
  console.log(`\nImpeccable live server running on ${url}`);
  console.log(`Token: ${state.token}\n`);
  console.log(`Inject: <script src="${url}/live.js"><\/script>`);
  console.log(`Stop:   node ${path.basename(fileURLToPath(import.meta.url))} stop`);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
