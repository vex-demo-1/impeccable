#!/usr/bin/env node
/**
 * Visual question server: present a decision to the user as a themed page
 * instead of a plain-text prompt, then block until they answer.
 *
 * The script IS the wait: run it via the shell, it serves the page, prints
 * the URL (and tries to open the default browser), and does not exit until
 * the user chooses. The answer lands on stdout as one line:
 *
 *   ANSWER: {"optionId":"...","steer":"..."}
 *
 * Exit codes: 0 answered · 2 timed out or closed without answering.
 *
 * Payload (JSON file via --payload, or stdin):
 * {
 *   "title": "Choose the visual world",
 *   "question": "The roll assigned Fillmore Handbill. Keep it, take an alternate, or re-roll.",
 *   "options": [
 *     {
 *       "id": "assigned",                  // returned verbatim
 *       "label": "Fillmore Handbill",
 *       "kicker": "THE ROLL",              // optional badge; the assigned option leads
 *       "lineage": "1966-71 Fillmore ...", // optional
 *       "body": "why it fits, first viewport, risk ...",  // optional, plain text
 *       "hero": "https://... or /abs/path.webp",   // optional image
 *       "board": "https://... or /abs/path.webp"   // optional secondary image
 *     }, ...
 *   ],
 *   "reroll": true,          // adds a re-roll action (returns {"optionId":"reroll"})
 *   "steer": true            // adds a free-text steer field returned with any answer
 * }
 *
 * Options render as large cards: hero render first when present (the dealt
 * catalog worlds already have cards; grounded directions may present text-only
 * or a freshly generated mock). Local image paths are served by this server;
 * nothing is uploaded anywhere.
 *
 * Modes:
 *   (default)  block until answered; ANSWER on stdout; exit 0.
 *   --schema   print the canonical payload example and exit.
 *   --start    for harnesses that cannot leave a shell blocked: daemonize the
 *              server, print QUESTION URL + QUESTION KEY, exit immediately.
 *              Never auto-opens a browser: the agent routes the URL to the
 *              best surface it has (in-app browser first, then the system
 *              opener); pass --open to force the system browser instead.
 *   --wait --key K [--poll 60]   poll for the answer: exit 0 + ANSWER line,
 *              exit 3 WAITING (run --wait again), exit 2 server gone.
 *   --stop --key K               kill a daemonized question.
 *
 *   node serve-question.mjs --payload question.json [--timeout 900] [--no-open] [--port 0]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : fallback;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

const payloadPath = arg('payload');
const timeoutSec = Number(arg('timeout', '900'));
const portArg = Number(arg('port', '0'));
const QUESTION_DIR = path.join(process.cwd(), '.impeccable', 'questions');
const stateFile = (key) => path.join(QUESTION_DIR, `${key}.state.json`);
const answerFile = (key) => path.join(QUESTION_DIR, `${key}.answer.json`);

if (hasFlag('schema')) {
  console.log(JSON.stringify({
    title: 'Choose the visual world',
    question: 'The roll assigned Fillmore Handbill. Keep it, take an alternate, or re-roll.',
    options: [
      { id: 'assigned', label: 'Fillmore Handbill', kicker: 'THE ROLL', lineage: '1966-71 Fillmore psychedelic handbills', body: 'Why it fits, the first viewport, the honest risk.', hero: 'https://impeccable.style/worlds/cards/fillmore-handbill-hero.webp', board: 'https://impeccable.style/worlds/cards/fillmore-handbill.webp' },
      { id: 'challenger-teletext', label: 'Teletext Service', lineage: 'broadcast teletext magazines', body: 'Fused alternate.', hero: 'https://impeccable.style/worlds/cards/broadcast-programming-teletext-service-hero.webp' },
    ],
    reroll: true,
    steer: true,
  }, null, 2));
  console.log('\nOption ids return verbatim in ANSWER; "reroll" is reserved. hero/board accept URLs or local paths.');
  process.exit(0);
}

if (hasFlag('wait')) {
  const key = arg('key');
  if (!key) { console.error('serve-question: --wait needs --key'); process.exit(1); }
  const pollSec = Number(arg('poll', '60'));
  const deadline = Date.now() + pollSec * 1000;
  const answered = () => fs.existsSync(answerFile(key));
  const alive = () => {
    try { process.kill(JSON.parse(fs.readFileSync(stateFile(key), 'utf8')).pid, 0); return true; }
    catch { return false; }
  };
  while (Date.now() < deadline) {
    if (answered()) break;
    if (!alive()) {
      console.log('serve-question: the question server is gone with no answer');
      process.exit(2);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!answered()) { console.log(`WAITING: no answer yet after ${pollSec}s; run --wait --key ${key} again`); process.exit(3); }
  console.log(`ANSWER: ${fs.readFileSync(answerFile(key), 'utf8').trim()}`);
  try { fs.rmSync(answerFile(key)); fs.rmSync(stateFile(key)); } catch { /* already cleaned */ }
  process.exit(0);
}

if (hasFlag('stop')) {
  const key = arg('key');
  if (!key) { console.error('serve-question: --stop needs --key'); process.exit(1); }
  try { process.kill(JSON.parse(fs.readFileSync(stateFile(key), 'utf8')).pid); } catch { /* dead already */ }
  try { fs.rmSync(answerFile(key)); } catch {}
  try { fs.rmSync(stateFile(key)); } catch {}
  console.log('stopped');
  process.exit(0);
}

if (hasFlag('start')) {
  if (!payloadPath) { console.error('serve-question: --start needs --payload <file>'); process.exit(1); }
  JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
  fs.mkdirSync(QUESTION_DIR, { recursive: true });
  const key = arg('key') || Math.random().toString(16).slice(2, 10);
  // In start mode the agent is alive and owns browser routing; the server
  // only opens the system browser itself when --open forces it.
  const child = spawn(process.execPath, [
    fileURLToPath(import.meta.url), '--payload', payloadPath, '--detached-serve', '--key', key,
    '--timeout', String(timeoutSec), ...(hasFlag('open') ? [] : ['--no-open']),
  ], { detached: true, stdio: 'ignore' });
  child.unref();
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline && !fs.existsSync(stateFile(key))) await new Promise((r) => setTimeout(r, 100));
  if (!fs.existsSync(stateFile(key))) { console.error('serve-question: server failed to start'); process.exit(1); }
  const state = JSON.parse(fs.readFileSync(stateFile(key), 'utf8'));
  console.log(`QUESTION URL: ${state.url}`);
  console.log(`QUESTION KEY: ${key}`);
  console.log('Open the URL for the user now: in-app browser when the harness has one, otherwise the system opener (macOS `open`, Linux `xdg-open`), otherwise show the URL.');
  console.log(`Then collect the answer with: node ${fileURLToPath(import.meta.url)} --wait --key ${key}`);
  process.exit(0);
}

let raw;
if (payloadPath) raw = fs.readFileSync(payloadPath, 'utf8');
else raw = fs.readFileSync(0, 'utf8');
const payload = JSON.parse(raw);
if (!payload || !Array.isArray(payload.options) || payload.options.length === 0) {
  console.error('serve-question: payload needs an options array');
  process.exit(1);
}

// Local images are served through /img/<index>/<kind>; remote URLs pass through.
const localImages = [];
function imageSrc(value) {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  const abs = path.resolve(value);
  if (!fs.existsSync(abs)) return null;
  localImages.push(abs);
  return `/img/${localImages.length - 1}`;
}
const options = payload.options.map((option) => ({
  ...option,
  heroSrc: imageSrc(option.hero),
  boardSrc: imageSrc(option.board),
}));

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function page() {
  const cards = options.map((option, index) => `
    <article class="card${index === 0 ? ' lead' : ''}" data-id="${esc(option.id)}">
      ${option.kicker ? `<span class="kicker">${esc(option.kicker)}</span>` : ''}
      ${option.heroSrc ? `<img class="hero" src="${esc(option.heroSrc)}" alt="">` : '<div class="hero hero-blank"></div>'}
      <div class="body">
        <h2>${esc(option.label)}</h2>
        ${option.lineage ? `<p class="lineage">${esc(option.lineage)}</p>` : ''}
        ${option.body ? `<p class="detail">${esc(option.body)}</p>` : ''}
        ${option.boardSrc ? `<details><summary>design-system board</summary><img src="${esc(option.boardSrc)}" alt=""></details>` : ''}
        <button class="choose" data-id="${esc(option.id)}">Build this</button>
      </div>
    </article>`).join('\n');
  return `<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(payload.title || 'impeccable · decision')}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; }
  body { background: #0c0b09; color: #efe9dc; font: 15px/1.55 ui-sans-serif, system-ui, sans-serif; padding: 3rem clamp(1rem, 5vw, 4rem); }
  header { max-width: 68rem; margin: 0 auto 2.5rem; }
  header .mark { color: #c8a24a; font-weight: 700; letter-spacing: .18em; font-size: .72rem; text-transform: uppercase; }
  h1 { font-size: clamp(1.5rem, 3vw, 2.2rem); line-height: 1.15; margin-top: .6rem; }
  .question { color: #b7ad99; margin-top: .7rem; max-width: 48rem; }
  .grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(min(24rem, 100%), 1fr)); max-width: 90rem; margin: 0 auto; }
  .card { background: #14120e; border: 1px solid #2a261e; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; }
  .card.lead { border-color: #c8a24a; box-shadow: 0 1px 0 #c8a24a inset; }
  .kicker { position: absolute; margin: .8rem; background: #c8a24a; color: #14120e; font-size: .68rem; font-weight: 700; letter-spacing: .14em; padding: .25rem .6rem; border-radius: 3px; }
  .card { position: relative; }
  img.hero { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; background: #1b1812; }
  .hero-blank { width: 100%; aspect-ratio: 16/9; background: repeating-linear-gradient(135deg, #17140f 0 14px, #14120e 14px 28px); }
  .body { padding: 1.1rem 1.2rem 1.3rem; display: flex; flex-direction: column; gap: .55rem; flex: 1; }
  h2 { font-size: 1.12rem; }
  .lineage { color: #c8a24a; font-size: .8rem; letter-spacing: .04em; }
  .detail { color: #b7ad99; font-size: .88rem; white-space: pre-wrap; }
  details { font-size: .8rem; color: #b7ad99; } details img { width: 100%; margin-top: .5rem; border-radius: 6px; }
  button.choose { margin-top: auto; align-self: start; background: #efe9dc; color: #14120e; border: 0; font: inherit; font-weight: 650; padding: .55rem 1.1rem; border-radius: 6px; cursor: pointer; }
  button.choose:hover { background: #c8a24a; }
  footer { max-width: 68rem; margin: 2.2rem auto 0; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
  #steer { flex: 1; min-width: 16rem; background: #14120e; color: #efe9dc; border: 1px solid #2a261e; border-radius: 6px; padding: .55rem .8rem; font: inherit; }
  #reroll { background: none; border: 1px solid #2a261e; color: #b7ad99; font: inherit; padding: .55rem 1.1rem; border-radius: 6px; cursor: pointer; }
  #reroll:hover { border-color: #c8a24a; color: #c8a24a; }
  .done { text-align: center; padding: 6rem 1rem; font-size: 1.2rem; }
</style>
<header>
  <div class="mark">impeccable</div>
  <h1>${esc(payload.title || 'Choose a direction')}</h1>
  ${payload.question ? `<p class="question">${esc(payload.question)}</p>` : ''}
</header>
<main class="grid">${cards}</main>
<footer>
  ${payload.steer ? '<input id="steer" placeholder="Optional steer: what should be different or kept?">' : ''}
  ${payload.reroll ? '<button id="reroll">Re-roll: none of these</button>' : ''}
</footer>
<script>
  const steer = () => document.getElementById('steer')?.value || '';
  async function answer(optionId) {
    await fetch('/answer', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ optionId, steer: steer() }) });
    document.body.innerHTML = '<div class="done">Choice recorded. You can close this tab; the agent is resuming.</div>';
  }
  document.querySelectorAll('button.choose').forEach(b => b.addEventListener('click', () => answer(b.dataset.id)));
  document.getElementById('reroll')?.addEventListener('click', () => answer('reroll'));
</script>`;
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page());
    return;
  }
  const imageMatch = req.method === 'GET' && req.url?.match(/^\/img\/(\d+)$/);
  if (imageMatch) {
    const abs = localImages[Number(imageMatch[1])];
    if (!abs) { res.writeHead(404); res.end(); return; }
    const type = abs.endsWith('.webp') ? 'image/webp' : abs.endsWith('.png') ? 'image/png' : 'image/jpeg';
    res.writeHead(200, { 'content-type': type });
    fs.createReadStream(abs).pipe(res);
    return;
  }
  if (req.method === 'POST' && req.url === '/answer') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{"ok":true}');
      let parsed = {};
      try { parsed = JSON.parse(body); } catch { /* empty steer */ }
      const answer = JSON.stringify({ optionId: parsed.optionId ?? null, steer: parsed.steer ?? '' });
      const detachedKey = hasFlag('detached-serve') ? arg('key') : null;
      if (detachedKey) {
        fs.mkdirSync(QUESTION_DIR, { recursive: true });
        fs.writeFileSync(answerFile(detachedKey), answer + '\n');
      } else {
        console.log(`ANSWER: ${answer}`);
      }
      setTimeout(() => process.exit(0), 150);
    });
    return;
  }
  res.writeHead(404); res.end();
});

server.listen(portArg, '127.0.0.1', () => {
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/`;
  if (hasFlag('detached-serve')) {
    fs.mkdirSync(QUESTION_DIR, { recursive: true });
    fs.writeFileSync(stateFile(arg('key')), JSON.stringify({ pid: process.pid, port, url }));
  } else {
    console.log(`QUESTION URL: ${url}`);
    console.log('Waiting for the user to choose in the browser (Ctrl-C aborts)...');
  }
  if (!hasFlag('no-open')) {
    const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    try { spawn(opener, [url], { stdio: 'ignore', detached: true }).unref(); } catch { /* URL printed anyway */ }
  }
  if (timeoutSec > 0) {
    setTimeout(() => {
      console.log('serve-question: timed out with no answer');
      process.exit(2);
    }, timeoutSec * 1000).unref?.();
  }
});
