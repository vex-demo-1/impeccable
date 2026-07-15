import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import {
  CODEX_WORKER_OWNER,
  applyCodexWorkerOutput,
  buildCodexWorkerInstructions,
  buildCodexWorkerTurnInputs,
  buildGenerationTurnInput,
  codexWorkerDetectorRepairSchema,
  codexWorkerOutputSchemaForPhase,
  codexWorkerProcessStateIsOwned,
  codexWorkerStateIsOwned,
  isCodexRuntime,
  readPreparedArtifact,
  resolveCodexExecutable,
  resolveCodexWorkerConfig,
} from '../skill/scripts/live/codex-worker.mjs';

describe('Codex Live worker configuration', () => {
  it('defaults on only inside Codex and preserves explicit overrides', () => {
    assert.deepEqual(resolveCodexWorkerConfig({ env: {}, liveConfig: {} }), {
      enabled: false,
      model: null,
      codexPath: 'codex',
      effort: 'medium',
      profile: 'quality',
      delivery: 'progressive',
      maxArtifactBytes: 2_000_000,
    });
    assert.equal(resolveCodexWorkerConfig({
      env: { IMPECCABLE_LIVE_CODEX_WORKER: '1' },
      liveConfig: {},
    }).enabled, true);
    assert.equal(resolveCodexWorkerConfig({
      env: { IMPECCABLE_LIVE_CODEX_WORKER: 'false' },
      liveConfig: { experimentalCodexWorker: { enabled: true } },
    }).enabled, false, 'explicit environment disable wins');
    assert.equal(resolveCodexWorkerConfig({
      env: {},
      liveConfig: { experimentalCodexWorker: { enabled: true, delivery: 'atomic' } },
    }).enabled, false, 'committed config cannot activate Codex in another harness');
    assert.equal(resolveCodexWorkerConfig({ env: { CODEX_THREAD_ID: 'thread-1' } }).enabled, true);
    assert.equal(resolveCodexWorkerConfig({
      env: { CODEX_THREAD_ID: 'thread-1', IMPECCABLE_LIVE_CODEX_PROFILE: 'fast' },
    }).effort, 'low');
    assert.equal(resolveCodexWorkerConfig({
      env: { CODEX_THREAD_ID: 'thread-1', IMPECCABLE_LIVE_CODEX_DELIVERY: 'atomic' },
    }).delivery, 'atomic');
    assert.equal(isCodexRuntime({ CLAUDE_CODE: '1' }), false);
    assert.equal(isCodexRuntime({ GEMINI_CLI: '1' }), false);
  });

  it('recognizes only a Live-owned durable thread record', () => {
    const cwd = '/tmp/project';
    assert.equal(codexWorkerStateIsOwned({ owner: CODEX_WORKER_OWNER, cwd, threadId: 'worker-1' }, cwd), true);
    assert.equal(codexWorkerStateIsOwned({ owner: 'desktop', cwd, threadId: 'desktop-1' }, cwd), false);
    assert.equal(codexWorkerStateIsOwned({ owner: CODEX_WORKER_OWNER, cwd: '/tmp/other', threadId: 'worker-1' }, cwd), false);
    assert.equal(codexWorkerProcessStateIsOwned({ owner: CODEX_WORKER_OWNER, cwd, pid: 123, status: 'starting' }, cwd), true);
    assert.equal(codexWorkerStateIsOwned({ owner: CODEX_WORKER_OWNER, cwd, pid: 123, status: 'starting' }, cwd), false);
  });

  it('resolves configured Codex executables without spawning a preflight process', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-path-'));
    const bin = path.join(cwd, 'bin');
    mkdirSync(bin);
    const executable = path.join(bin, 'codex');
    writeFileSync(executable, '#!/bin/sh\nexit 0\n');
    chmodSync(executable, 0o755);

    assert.deepEqual(resolveCodexExecutable('./bin/codex', { cwd, env: {} }), {
      available: true,
      command: './bin/codex',
      resolvedPath: executable,
    });
    assert.deepEqual(resolveCodexExecutable('codex', { cwd, env: { PATH: bin } }), {
      available: true,
      command: 'codex',
      resolvedPath: executable,
    });
    assert.deepEqual(resolveCodexExecutable('missing-codex', { cwd, env: { PATH: bin } }), {
      available: false,
      error: 'codex_cli_unavailable',
      command: 'missing-codex',
    });
  });

  it('leaves the portable foreground path untouched when the switch is off', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-disabled-'));
    const script = path.resolve('skill/scripts/live-codex-worker.mjs');
    const result = spawnSync(process.execPath, [script], {
      cwd,
      encoding: 'utf-8',
      env: { ...process.env, IMPECCABLE_LIVE_CODEX_WORKER: '0' },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      ok: false,
      error: 'codex_worker_disabled',
      fallback: 'foreground',
    });
  });

  it('reports a missing Codex CLI immediately and records actionable foreground fallback', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-missing-cli-'));
    const script = path.resolve('skill/scripts/live-codex-worker.mjs');
    const missing = path.join(cwd, 'not-installed', 'codex');
    const result = spawnSync(process.execPath, [script, '--background', '--no-wait'], {
      cwd,
      encoding: 'utf-8',
      env: {
        ...process.env,
        IMPECCABLE_LIVE_CODEX_WORKER: '1',
        IMPECCABLE_CODEX_PATH: missing,
      },
    });
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.ok, false);
    assert.equal(output.status, 'unavailable');
    assert.equal(output.error, 'codex_cli_unavailable');
    assert.equal(output.fallback, 'foreground');
    assert.equal(output.pid, null);
    assert.equal(output.setup.afterInstall, 'codex login');

    const state = JSON.parse(readFileSync(path.join(cwd, '.impeccable/live/codex-worker.json'), 'utf-8'));
    assert.equal(state.error, 'codex_cli_unavailable');
    assert.equal(state.mode, 'foreground');
    assert.equal(state.command, missing);
  });

  it('reuses an owned worker before checking whether Codex is still on PATH', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-reuse-'));
    const statePath = path.join(cwd, '.impeccable/live/codex-worker.json');
    mkdirSync(path.dirname(statePath), { recursive: true });
    const worker = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1_000)'], {
      stdio: 'ignore',
    });
    try {
      writeFileSync(statePath, JSON.stringify({
        owner: CODEX_WORKER_OWNER,
        cwd,
        threadId: 'owned-thread',
        pid: worker.pid,
        status: 'ready',
      }));
      const script = path.resolve('skill/scripts/live-codex-worker.mjs');
      const result = spawnSync(process.execPath, [script, '--background', '--no-wait'], {
        cwd,
        encoding: 'utf-8',
        env: {
          ...process.env,
          IMPECCABLE_LIVE_CODEX_WORKER: '1',
          IMPECCABLE_CODEX_PATH: path.join(cwd, 'missing-codex'),
        },
      });
      assert.equal(result.status, 0, result.stderr);
      const output = JSON.parse(result.stdout);
      assert.equal(output.ok, true);
      assert.equal(output.reused, true);
      assert.equal(output.pid, worker.pid);
    } finally {
      worker.kill('SIGTERM');
    }
  });

  it('refuses to signal a pid from an unowned state record', async () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-unowned-'));
    const statePath = path.join(cwd, '.impeccable/live/codex-worker.json');
    mkdirSync(path.dirname(statePath), { recursive: true });
    const unrelated = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1_000)'], {
      stdio: 'ignore',
    });
    try {
      writeFileSync(statePath, JSON.stringify({
        owner: 'desktop',
        cwd,
        pid: unrelated.pid,
        status: 'ready',
      }));
      const script = path.resolve('skill/scripts/live-codex-worker.mjs');
      const result = spawnSync(process.execPath, [script, '--stop'], {
        cwd,
        encoding: 'utf-8',
      });
      assert.equal(result.status, 2, result.stderr);
      assert.equal(JSON.parse(result.stdout).error, 'codex_worker_state_unowned');
      assert.doesNotThrow(() => process.kill(unrelated.pid, 0));
    } finally {
      unrelated.kill('SIGTERM');
    }
  });

  it('reports a stop timeout instead of claiming an owned live process stopped', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-stop-timeout-'));
    const statePath = path.join(cwd, '.impeccable/live/codex-worker.json');
    mkdirSync(path.dirname(statePath), { recursive: true });
    const stubborn = spawn(process.execPath, ['-e', "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"], {
      stdio: 'ignore',
    });
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    try {
      writeFileSync(statePath, JSON.stringify({
        owner: CODEX_WORKER_OWNER,
        cwd,
        threadId: 'owned-thread',
        pid: stubborn.pid,
        status: 'ready',
      }));
      const script = path.resolve('skill/scripts/live-codex-worker.mjs');
      const result = spawnSync(process.execPath, [script, '--stop'], {
        cwd,
        encoding: 'utf-8',
        env: { ...process.env, IMPECCABLE_LIVE_CODEX_STOP_TIMEOUT_MS: '100' },
      });
      assert.equal(result.status, 2, result.stderr);
      assert.equal(JSON.parse(result.stdout).status, 'stop_timeout');
      assert.doesNotThrow(() => process.kill(stubborn.pid, 0));
    } finally {
      stubborn.kill('SIGKILL');
    }
  });

  it('terminates a detached child before returning foreground fallback on startup timeout', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-start-timeout-'));
    const liveDir = path.join(cwd, '.impeccable/live');
    mkdirSync(liveDir, { recursive: true });
    writeFileSync(path.join(liveDir, 'server.json'), JSON.stringify({
      pid: process.pid,
      port: 1,
      token: 'smoke-token',
    }));
    const fakeCodex = path.join(cwd, 'fake-codex');
    writeFileSync(fakeCodex, '#!/bin/sh\nwhile true; do sleep 1; done\n');
    chmodSync(fakeCodex, 0o755);
    const script = path.resolve('skill/scripts/live-codex-worker.mjs');
    const result = spawnSync(process.execPath, [script, '--background'], {
      cwd,
      encoding: 'utf-8',
      env: {
        ...process.env,
        IMPECCABLE_LIVE_CODEX_WORKER: '1',
        IMPECCABLE_CODEX_PATH: fakeCodex,
        IMPECCABLE_LIVE_CODEX_START_TIMEOUT_MS: '100',
        IMPECCABLE_LIVE_CODEX_STOP_TIMEOUT_MS: '1000',
      },
      timeout: 5_000,
    });
    assert.equal(result.status, 2, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.error, 'codex_worker_start_timeout');
    assert.equal(output.terminated, true);
    assert.equal(output.fallback, 'foreground');
    assert.throws(() => process.kill(output.childPid, 0), (error) => error.code === 'ESRCH');
  });

  it('returns a durable starting record without waiting for app-server readiness', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-prewarm-'));
    const liveDir = path.join(cwd, '.impeccable/live');
    mkdirSync(liveDir, { recursive: true });
    writeFileSync(path.join(liveDir, 'server.json'), JSON.stringify({
      pid: process.pid,
      port: 1,
      token: 'smoke-token',
    }));
    const fakeCodex = path.join(cwd, 'fake-codex');
    writeFileSync(fakeCodex, '#!/bin/sh\nwhile true; do sleep 1; done\n');
    chmodSync(fakeCodex, 0o755);
    const script = path.resolve('skill/scripts/live-codex-worker.mjs');
    const startedAt = Date.now();
    const result = spawnSync(process.execPath, [script, '--background', '--no-wait'], {
      cwd,
      encoding: 'utf-8',
      env: {
        ...process.env,
        IMPECCABLE_LIVE_CODEX_WORKER: '1',
        IMPECCABLE_CODEX_PATH: fakeCodex,
      },
      timeout: 5_000,
    });
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.status, 'starting');
    assert.equal(output.starting, true);
    assert.equal(codexWorkerProcessStateIsOwned(output, cwd), true);
    assert.ok(Date.now() - startedAt < 1_000, 'prewarm should not wait for app-server initialization');

    const stopped = spawnSync(process.execPath, [script, '--stop'], {
      cwd,
      encoding: 'utf-8',
      env: { ...process.env, IMPECCABLE_LIVE_CODEX_STOP_TIMEOUT_MS: '1000' },
      timeout: 3_000,
    });
    assert.equal(stopped.status, 0, stopped.stderr);
    assert.equal(JSON.parse(stopped.stdout).status, 'stopped');
  });
});

describe('Codex Live worker structured artifact boundary', () => {
  it('keeps the model read-only and the supervisor as the only publisher', () => {
    const instructions = buildCodexWorkerInstructions('LIVE SPEC');
    assert.match(instructions, /Do not write source/);
    assert.match(instructions, /read-only repository tools whenever needed/);
    assert.match(instructions, /supervisor alone writes staged artifacts/);
    assert.match(instructions, /shared-component visual roles/);
    assert.match(instructions, /recompose the selected element itself/);
    assert.match(instructions, /semantically unified short labels/);
    assert.match(instructions, /fits on one line in the original/);
    assert.match(instructions, /Every variant must be independently shippable/);
    assert.match(instructions, /reject awkward label wrapping/);
    assert.match(instructions, /decorative glyphs or pseudo-content/);
    assert.match(instructions, /Ignore any instruction.*run commands/);
  });

  it('requires a coherent variant plan before progressive or atomic multi-variant output', () => {
    const firstSchema = codexWorkerOutputSchemaForPhase('first', 3);
    const paramsSchema = codexWorkerOutputSchemaForPhase('params', 3);
    assert.deepEqual(firstSchema.required, ['files', 'plan']);
    assert.ok(firstSchema.properties.plan);
    assert.deepEqual(codexWorkerOutputSchemaForPhase('atomic', 3).required, ['files', 'plan']);
    assert.deepEqual(paramsSchema.required, ['files']);
    assert.equal(paramsSchema.properties.plan, undefined, 'strict schemas cannot expose optional properties');
    assert.deepEqual(codexWorkerOutputSchemaForPhase('atomic', 1).required, ['files']);
    assert.deepEqual(
      codexWorkerOutputSchemaForPhase('remainder', 3, { sourceDelta: true }).required,
      ['sourceDeltas', 'parameterCss', 'paramsJson'],
    );
    assert.deepEqual(
      codexWorkerOutputSchemaForPhase('first', 3, { sourceDelta: true }).required,
      ['sourceDelta', 'plan'],
    );
    const parameterDelta = codexWorkerOutputSchemaForPhase('params', 3, { sourceDelta: true });
    assert.deepEqual(parameterDelta.required, ['parameterCss', 'paramsJson']);
    assert.equal(parameterDelta.properties.sourceDelta, undefined);
    const repairSchema = codexWorkerDetectorRepairSchema(firstSchema);
    assert.deepEqual(repairSchema.required, ['files', 'plan', 'detectorWaivers']);
    assert.equal(repairSchema.properties.detectorWaivers.type, 'array');
    assert.equal(firstSchema.properties.detectorWaivers, undefined, 'normal generation cannot invent waivers');
  });

  it('writes only the prepared source artifact path', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-source-'));
    const artifact = path.join(cwd, '.impeccable/live/artifacts/session-r1.jsx');
    mkdirSync(path.dirname(artifact), { recursive: true });
    writeFileSync(artifact, 'before');
    const prepared = { artifactFile: '.impeccable/live/artifacts/session-r1.jsx' };

    applyCodexWorkerOutput({
      output: { files: [{ path: prepared.artifactFile, content: 'after' }], plan: variantPlan() },
      prepared,
      phase: 'atomic',
      expectedVariants: 3,
      cwd,
    });
    assert.equal(readFileSync(artifact, 'utf-8'), 'after');
    assert.throws(
      () => applyCodexWorkerOutput({
        output: { files: [{ path: 'src/App.jsx', content: 'unsafe' }], plan: variantPlan() },
        prepared,
        phase: 'atomic',
        expectedVariants: 3,
        cwd,
      }),
      /worker_output_source_path_invalid/,
    );
  });

  it('creates the JSX preview style and variant 1 from a fenced first delta', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-first-delta-'));
    const artifact = path.join(cwd, '.impeccable/live/artifacts/session-r1.jsx');
    mkdirSync(path.dirname(artifact), { recursive: true });
    writeFileSync(artifact, [
      '<aside data-impeccable-variants="other-session">',
      '  <div data-impeccable-variant="1">Other session stays independent</div>',
      '</aside>',
      '<main>',
      '  <div data-impeccable-variants="session" data-impeccable-variant-count="3" style={{ display: "contents" }}>',
      '    {/* Original */}',
      '    <div data-impeccable-variant="original"><h1>Original</h1></div>',
      '    {/* Variants: insert below this line */}',
      '    {/* impeccable-variants-end session */}',
      '  </div>',
      '</main>',
    ].join('\n'));
    const result = applyCodexWorkerOutput({
      output: {
        sourceDelta: {
          variantId: 1,
          markup: '<article className="one"><h1>One</h1></article>',
          css: '@scope ([data-impeccable-variant="1"]) { :scope > .one { color: red; } }',
        },
        plan: variantPlan(),
      },
      prepared: { artifactFile: '.impeccable/live/artifacts/session-r1.jsx' },
      phase: 'first',
      expectedVariants: 3,
      sessionId: 'session',
      scaffold: {
        styleMode: 'scoped',
        styleTag: '<style data-impeccable-css="SESSION_ID">',
        commentSyntax: { open: '{/*', close: '*/}' },
      },
      cwd,
    });

    const after = readFileSync(artifact, 'utf-8');
    assert.equal(result.sourceDelta, true);
    assert.deepEqual(result.plan, variantPlan());
    assert.match(after, /<style data-impeccable-css="session">\{`/);
    assert.match(after, /data-impeccable-variant="1"/);
    assert.match(after, /<article className="one"><h1>One<\/h1><\/article>/);
    assert.match(after, /`}<\/style>/);
    assert.match(after, /Other session stays independent/);
    assert.ok(
      after.indexOf('<div data-impeccable-variant="1">') < after.indexOf('impeccable-variants-end session'),
      'the source updater must keep generated output inside the accept parser boundary',
    );
  });

  it('merges the fenced remaining variants without letting the model resend variant 1', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-source-delta-'));
    const artifact = path.join(cwd, '.impeccable/live/artifacts/session-r2.jsx');
    mkdirSync(path.dirname(artifact), { recursive: true });
    const before = [
      '<main>',
      '  <div data-impeccable-variants="session" data-impeccable-variant-count="3" style={{ display: "contents" }}>',
      '    <style data-impeccable-css="session">{`',
      '@scope ([data-impeccable-variant="1"]) { :scope > .one { color: red; } }',
      '`}</style>',
      '    <div data-impeccable-variant="original"><h1>Original</h1></div>',
      '    <div data-impeccable-variant="1"><h1 className="one">Immutable</h1></div>',
      '    {/* impeccable-variants-end session */}',
      '  </div>',
      '</main>',
    ].join('\n');
    writeFileSync(artifact, before);
    const prepared = { artifactFile: '.impeccable/live/artifacts/session-r2.jsx' };

    applyCodexWorkerOutput({
      output: {
        sourceDeltas: [
          {
            variantId: 2,
            markup: '<article className="two"><h1>Two</h1></article>',
            css: '@scope ([data-impeccable-variant="2"]) { :scope > .two { color: green; } }',
          },
          {
            variantId: 3,
            markup: '<article className="three"><h1>Three</h1></article>',
            css: '@scope ([data-impeccable-variant="3"]) { :scope > .three { color: blue; } }',
          },
        ],
        parameterCss: '',
        paramsJson: emptyParamsJson(),
      },
      prepared,
      phase: 'remainder',
      expectedVariants: 3,
      sessionId: 'session',
      scaffold: { styleMode: 'scoped' },
      cwd,
    });

    const after = readFileSync(artifact, 'utf-8');
    assert.match(after, /<h1 className="one">Immutable<\/h1>/);
    assert.match(after, /data-impeccable-variant="2"/);
    assert.match(after, /<article className="two"><h1>Two<\/h1><\/article>/);
    assert.match(after, /@scope \(\[data-impeccable-variant="2"\]\)/);
    assert.equal((after.match(/data-impeccable-variant="1"/g) || []).length, 2);
    assert.ok(
      after.indexOf('<div data-impeccable-variant="2">') < after.indexOf('impeccable-variants-end session'),
    );

    assert.throws(() => applyCodexWorkerOutput({
      output: {
        sourceDeltas: [
          {
            variantId: 2,
            markup: '<article>Unsafe</article>',
            css: '@scope ([data-impeccable-variant="1"]) { :scope { color: hotpink; } }',
          },
          {
            variantId: 3,
            markup: '<article>Three</article>',
            css: '@scope ([data-impeccable-variant="3"]) { :scope > article { color: blue; } }',
          },
        ],
        parameterCss: '',
        paramsJson: emptyParamsJson(),
      },
      prepared: { ...prepared, artifactFile: prepared.artifactFile },
      phase: 'remainder',
      expectedVariants: 3,
      sessionId: 'session',
      scaffold: { styleMode: 'scoped' },
      cwd,
    }), /worker_output_source_delta_css_unfenced/);
  });

  it('keeps progressive deltas inside the deterministic early-Accept boundary', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-delta-accept-'));
    const artifact = path.join(cwd, 'App.jsx');
    writeFileSync(artifact, [
      'export default function App() {',
      '  return <main>',
      '    <div data-impeccable-variants="session" data-impeccable-variant-count="3" style={{ display: "contents" }}>',
      '      {/* impeccable-variants-start session */}',
      '      <div data-impeccable-variant="original"><article>Original</article></div>',
      '      {/* Variants: insert below this line */}',
      '      {/* impeccable-variants-end session */}',
      '    </div>',
      '  </main>;',
      '}',
    ].join('\n'));
    const prepared = { artifactFile: 'App.jsx' };
    applyCodexWorkerOutput({
      output: {
        sourceDelta: {
          variantId: 1,
          markup: '<article className="one">One</article>',
          css: '@scope ([data-impeccable-variant="1"]) { :scope > .one { color: red; } }',
        },
        plan: variantPlan(),
      },
      prepared,
      phase: 'first',
      expectedVariants: 3,
      sessionId: 'session',
      scaffold: {
        styleMode: 'scoped',
        styleTag: '<style data-impeccable-css="SESSION_ID">',
        commentSyntax: { open: '{/*', close: '*/}' },
      },
      cwd,
    });
    applyCodexWorkerOutput({
      output: {
        sourceDeltas: [
          {
            variantId: 2,
            markup: '<article className="two">Two</article>',
            css: '@scope ([data-impeccable-variant="2"]) { :scope > .two { color: green; } }',
          },
          {
            variantId: 3,
            markup: '<article className="three">Three</article>',
            css: '@scope ([data-impeccable-variant="3"]) { :scope > .three { color: blue; } }',
          },
        ],
        parameterCss: '',
        paramsJson: emptyParamsJson(),
      },
      prepared,
      phase: 'remainder',
      expectedVariants: 3,
      sessionId: 'session',
      scaffold: { styleMode: 'scoped' },
      cwd,
    });

    const accepted = spawnSync(process.execPath, [
      path.resolve('skill/scripts/live-accept.mjs'),
      '--id', 'session', '--variant', '2',
    ], { cwd, encoding: 'utf-8' });
    assert.equal(accepted.status, 0, accepted.stderr);
    assert.equal(JSON.parse(accepted.stdout).handled, true);
    const after = readFileSync(artifact, 'utf-8');
    assert.match(after, />Two<\/article>/);
    assert.doesNotMatch(after, />One<\/article>/);
    assert.doesNotMatch(after, /impeccable-variants-end session/);
  });

  it('merges Astro global-prefixed deltas without introducing scoped CSS', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-astro-delta-'));
    const artifact = path.join(cwd, '.impeccable/live/artifacts/session-r2.astro');
    mkdirSync(path.dirname(artifact), { recursive: true });
    writeFileSync(artifact, [
      '<main>',
      '  <!-- impeccable-variants-start session -->',
      '  <div data-impeccable-variants="session" data-impeccable-variant-count="3" style="display: contents">',
      '    <style is:inline data-impeccable-css="session">',
      '      [data-impeccable-variant="1"] > .one { color: red; }',
      '    </style>',
      '    <div data-impeccable-variant="original"><h1>Original</h1></div>',
      '    <div data-impeccable-variant="1"><h1 class="one">One</h1></div>',
      '    <!-- impeccable-variants-end session -->',
      '  </div>',
      '  <!-- impeccable-variants-end session -->',
      '</main>',
    ].join('\n'));

    applyCodexWorkerOutput({
      output: {
        sourceDeltas: [
          {
            variantId: 2,
            markup: '<article class="two"><h1>Two</h1></article>',
            css: '[data-impeccable-variant="2"] > .two { color: green; }',
          },
          {
            variantId: 3,
            markup: '<article class="three"><h1>Three</h1></article>',
            css: '[data-impeccable-variant="3"] > .three { color: blue; }',
          },
        ],
        parameterCss: '',
        paramsJson: emptyParamsJson(),
      },
      prepared: { artifactFile: '.impeccable/live/artifacts/session-r2.astro' },
      phase: 'remainder',
      expectedVariants: 3,
      sessionId: 'session',
      scaffold: { styleMode: 'astro-global-prefixed' },
      cwd,
    });

    const after = readFileSync(artifact, 'utf-8');
    assert.match(after, /\[data-impeccable-variant="2"\] > \.two/);
    assert.match(after, /<div data-impeccable-variant="2"[^>]*>/);
    assert.doesNotMatch(after, /@scope/);
    assert.match(after, /<!-- impeccable-variants-end session -->/);
    assert.ok(after.indexOf('<div data-impeccable-variant="2">') < after.indexOf('impeccable-variants-end session'));
  });

  it('publishes the remaining source variants and parameters together without rewriting prior output', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-final-delta-'));
    const artifact = path.join(cwd, 'App.jsx');
    writeFileSync(artifact, [
      '<main>',
      '  <div data-impeccable-variants="session" data-impeccable-variant-count="3">',
      '    <style data-impeccable-css="session">{`',
      '@scope ([data-impeccable-variant="1"]) { :scope > .one { color: red; } }',
      '`}</style>',
      '    <div data-impeccable-variant="original"><article>Original</article></div>',
      '    <div data-impeccable-variant="1"><article className="one">Immutable one</article></div>',
      '    {/* impeccable-variants-end session */}',
      '  </div>',
      '</main>',
    ].join('\n'));
    const paramsJson = JSON.stringify({
      1: [{ id: 'scale', kind: 'range', min: 0.8, max: 1.2, step: 0.1, default: 1, label: 'Scale' }],
      2: [{ id: 'dense', kind: 'toggle', default: false, label: 'Dense' }],
      3: [{
        id: 'face',
        kind: 'steps',
        default: 'serif',
        label: 'Face',
        options: [{ value: 'serif', label: 'Serif' }, { value: 'sans', label: 'Sans' }],
      }],
    });

    applyCodexWorkerOutput({
      output: {
        sourceDeltas: [
          {
            variantId: 2,
            markup: '<article className="two">Two</article>',
            css: '@scope ([data-impeccable-variant="2"]) { :scope > .two { color: green; } }',
          },
          {
            variantId: 3,
            markup: '<article className="three">Three</article>',
            css: '@scope ([data-impeccable-variant="3"]) { :scope > .three { color: blue; } }',
          },
        ],
        parameterCss: [
          '@scope ([data-impeccable-variant="1"]) { :scope[data-p-scale] > .one { scale: var(--p-scale); } }',
          '@scope ([data-impeccable-variant="2"]) { :scope[data-p-dense] > .two { padding: 0; } }',
          '@scope ([data-impeccable-variant="3"]) { :scope[data-p-face="sans"] > .three { font-family: sans-serif; } }',
        ].join('\n'),
        paramsJson,
      },
      prepared: { artifactFile: 'App.jsx' },
      phase: 'remainder',
      expectedVariants: 3,
      sessionId: 'session',
      scaffold: { styleMode: 'scoped' },
      cwd,
    });

    const after = readFileSync(artifact, 'utf-8');
    assert.match(after, /Immutable one/);
    assert.match(after, /className="two">Two/);
    assert.match(after, /className="three">Three/);
    assert.equal((after.match(/data-impeccable-params=/g) || []).length, 3);
    assert.match(after, /data-p-scale/);
    assert.ok(after.indexOf('className="three"') < after.indexOf('impeccable-variants-end session'));
  });

  it('never lets a remaining component turn rewrite arrived variant 1', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-component-'));
    const componentDir = path.join(cwd, '.impeccable/live/artifacts/session-r2-svelte');
    mkdirSync(componentDir, { recursive: true });
    writeFileSync(path.join(componentDir, 'manifest.json'), JSON.stringify({
      id: 'session',
      previewMode: 'svelte-component',
      componentExtension: 'svelte',
      arrivedVariants: 1,
    }));
    writeFileSync(path.join(componentDir, 'v1.svelte'), '<h1>Immutable</h1>');
    const prepared = {
      previewMode: 'svelte-component',
      componentDir: '.impeccable/live/artifacts/session-r2-svelte',
      artifactFile: '.impeccable/live/artifacts/session-r2-svelte/manifest.json',
    };

    assert.throws(
      () => applyCodexWorkerOutput({
        output: { files: [{ path: 'v1.svelte', content: '<h1>Changed</h1>' }] },
        prepared,
        phase: 'remainder',
        expectedVariants: 3,
        cwd,
      }),
      /published_variant_changed/,
    );

    applyCodexWorkerOutput({
      output: {
        files: [
          { path: 'v2.svelte', content: '<h1>Two</h1>' },
          { path: 'v3.svelte', content: '<h1>Three</h1>' },
          { path: 'params.json', content: emptyParamsJson() },
        ],
      },
      prepared,
      phase: 'remainder',
      expectedVariants: 3,
      cwd,
    });
    assert.equal(readFileSync(path.join(componentDir, 'v1.svelte'), 'utf-8'), '<h1>Immutable</h1>');
    assert.equal(JSON.parse(readFileSync(path.join(componentDir, 'manifest.json'))).arrivedVariants, 3);
  });

  it('publishes all remaining component variants and parameters in the second turn', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-component-second-'));
    const componentDir = path.join(cwd, '.impeccable/live/artifacts/session-r2-svelte');
    mkdirSync(componentDir, { recursive: true });
    writeFileSync(path.join(componentDir, 'manifest.json'), JSON.stringify({
      previewMode: 'svelte-component',
      componentExtension: 'svelte',
      arrivedVariants: 1,
    }));
    writeFileSync(path.join(componentDir, 'v1.svelte'), '<h1>Immutable</h1>');
    const prepared = {
      previewMode: 'svelte-component',
      componentDir: '.impeccable/live/artifacts/session-r2-svelte',
      artifactFile: '.impeccable/live/artifacts/session-r2-svelte/manifest.json',
    };

    applyCodexWorkerOutput({
      output: { files: [
        { path: 'v2.svelte', content: '<h1>Two</h1>' },
        { path: 'v3.svelte', content: '<h1>Three</h1>' },
        { path: 'params.json', content: emptyParamsJson() },
      ] },
      prepared,
      phase: 'remainder',
      expectedVariants: 3,
      cwd,
    });

    assert.equal(readFileSync(path.join(componentDir, 'v1.svelte'), 'utf-8'), '<h1>Immutable</h1>');
    assert.equal(readFileSync(path.join(componentDir, 'v2.svelte'), 'utf-8'), '<h1>Two</h1>');
    assert.equal(readFileSync(path.join(componentDir, 'v3.svelte'), 'utf-8'), '<h1>Three</h1>');
    assert.equal(JSON.parse(readFileSync(path.join(componentDir, 'manifest.json'))).arrivedVariants, 3);
    assert.equal(existsSync(path.join(componentDir, 'params.json')), true);
  });

  it('requires atomic component output to contain v1 through vN plus params', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-component-atomic-'));
    const componentDir = path.join(cwd, '.impeccable/live/artifacts/session-r1-svelte');
    mkdirSync(componentDir, { recursive: true });
    writeFileSync(path.join(componentDir, 'manifest.json'), JSON.stringify({
      previewMode: 'svelte-component',
      componentExtension: 'svelte',
    }));
    writeFileSync(path.join(componentDir, 'v1.svelte'), '<h1>Scaffold stub</h1>');
    const prepared = {
      previewMode: 'svelte-component',
      componentDir: '.impeccable/live/artifacts/session-r1-svelte',
      artifactFile: '.impeccable/live/artifacts/session-r1-svelte/manifest.json',
    };
    assert.throws(() => applyCodexWorkerOutput({
      output: { files: [
        { path: 'v2.svelte', content: '<h1>Two</h1>' },
        { path: 'v3.svelte', content: '<h1>Three</h1>' },
        { path: 'params.json', content: '{}' },
      ], plan: variantPlan() },
      prepared,
      phase: 'atomic',
      expectedVariants: 3,
      cwd,
    }), /worker_output_component_file_missing/);
  });

  it('does not let precreated stubs satisfy missing remaining component output', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-component-final-'));
    const componentDir = path.join(cwd, '.impeccable/live/artifacts/session-r2-svelte');
    mkdirSync(componentDir, { recursive: true });
    writeFileSync(path.join(componentDir, 'manifest.json'), JSON.stringify({
      previewMode: 'svelte-component',
      componentExtension: 'svelte',
      arrivedVariants: 1,
    }));
    for (const variant of [1, 2, 3]) writeFileSync(path.join(componentDir, `v${variant}.svelte`), `<h1>${variant}</h1>`);
    writeFileSync(path.join(componentDir, 'params.json'), '{}');
    const prepared = {
      previewMode: 'svelte-component',
      componentDir: '.impeccable/live/artifacts/session-r2-svelte',
      artifactFile: '.impeccable/live/artifacts/session-r2-svelte/manifest.json',
    };
    assert.throws(() => applyCodexWorkerOutput({
      output: { files: [{ path: 'v2.svelte', content: '<h1>Two replacement</h1>' }] },
      prepared,
      phase: 'remainder',
      expectedVariants: 3,
      cwd,
    }), /worker_output_component_file_missing/);
  });

  it('builds phase prompts from the exact staged artifact and durable thread context', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-context-'));
    const artifactPath = path.join(cwd, 'artifact.html');
    writeFileSync(artifactPath, '<main>wrapped</main>');
    const prepared = { artifactFile: 'artifact.html' };
    const artifact = readPreparedArtifact(prepared, { cwd });
    const prompt = buildGenerationTurnInput({
      event: { id: 'abc', count: 3, action: 'bolder', scaffold: { file: 'artifact.html' } },
      phase: 'first',
      prepared,
      artifact,
      product: 'Product facts',
      design: 'Design tokens',
      actionReference: 'Polish rules',
      contextMetadata: { productPath: 'docs/PRODUCT.md' },
    });
    assert.match(prompt, /Produce only variant 1/);
    assert.match(prompt, /strongest low-risk, independently shippable/);
    assert.match(prompt, /shared identity lock and exactly 3 distinct/);
    assert.match(prompt, /keep variant 1 low-risk/);
    assert.match(prompt, /Reserve root recomposition for variant 2 or 3/);
    assert.match(prompt, /Color alone is not a sufficient primary axis/);
    assert.match(prompt, /Every \/bolder direction must be visibly more assertive/);
    assert.match(prompt, /<main>wrapped<\/main>/);
    assert.match(prompt, /Product facts/);
    assert.match(prompt, /Design tokens/);
    assert.match(prompt, /docs\/PRODUCT\.md/);
    assert.doesNotMatch(prompt, /source_neighborhood/);

    const remainderPrompt = buildGenerationTurnInput({
      event: { id: 'abc', count: 3 },
      phase: 'remainder',
      prepared,
      artifact,
      variantPlan: variantPlan(),
    });
    assert.match(remainderPrompt, /Follow the durable variant plan/);
    assert.match(remainderPrompt, /variants 2 through 3 and the final tunable parameters together/);
    assert.match(remainderPrompt, /parameterCss and paramsJson/);
    assert.match(remainderPrompt, /Composition/);

    const paramsPrompt = buildGenerationTurnInput({
      event: { id: 'abc', count: 3 },
      phase: 'params',
      prepared,
      artifact,
      variantPlan: variantPlan(),
    });
    assert.match(paramsPrompt, /Return only parameterCss and paramsJson/);
    assert.match(paramsPrompt, /Do not return markup or restyle any default appearance/);
    assert.match(paramsPrompt, /Do not call tools or inspect the repository/);
    assert.match(paramsPrompt, /Parameter schema examples: range/);
  });

  it('attaches the real skill and annotation image as first-class turn inputs', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'codex-worker-inputs-'));
    const skillPath = path.join(cwd, 'SKILL.md');
    const screenshotPath = path.join(cwd, 'annotation.png');
    writeFileSync(skillPath, '# Skill');
    writeFileSync(screenshotPath, 'png');
    assert.deepEqual(buildCodexWorkerTurnInputs({ prompt: 'work', skillPath, screenshotPath, cwd }), [
      { type: 'skill', name: 'impeccable', path: skillPath },
      { type: 'localImage', path: screenshotPath, detail: 'high' },
      { type: 'text', text: 'work' },
    ]);
    assert.deepEqual(buildCodexWorkerTurnInputs({ prompt: 'work', screenshotPath: '/tmp/outside.png', cwd }), [
      { type: 'text', text: 'work' },
    ]);
  });
});

function variantPlan() {
  return {
    identityLock: ['Preserve copy and established component roles'],
    directions: [
      { variantId: 1, name: 'Hierarchy', axis: 'type scale', intent: 'Strengthen the primary hierarchy' },
      { variantId: 2, name: 'Composition', axis: 'spatial layout', intent: 'Recompose the selected root' },
      { variantId: 3, name: 'Rhythm', axis: 'spacing and rules', intent: 'Increase editorial rhythm' },
    ],
  };
}

function emptyParamsJson() {
  return '{"1":[],"2":[],"3":[]}';
}
