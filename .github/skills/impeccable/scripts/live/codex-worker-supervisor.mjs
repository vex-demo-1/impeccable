import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import {
  selectLowestReasoningEffort,
  selectQualityCodexModel,
} from './codex-app-server-client.mjs';
import { loadContext } from '../context.mjs';
import { reconcilePublishedSourceVariants } from './generation-publisher.mjs';

import {
  CODEX_WORKER_OWNER,
  applyCodexWorkerOutput,
  buildCodexWorkerInstructions,
  buildCodexWorkerTurnInputs,
  buildGenerationTurnInput,
  codexWorkerDetectorRepairSchema,
  codexWorkerOutputSchemaForPhase,
  codexWorkerStateIsOwned,
  generationIsCanceled,
  isCodexComponentPreviewMode,
  prepareCodexWorkerPhase,
  publishCodexWorkerPhase,
  readPreparedArtifact,
  resolveCodexWorkerSkillPath,
} from './codex-worker.mjs';
import {
  augmentEventWithAcceptHandling,
  completeAcceptHandling,
  fetchNextEvent,
  postReply,
  requiresAgentReply,
} from '../live-poll.mjs';
import { createLiveSessionStore } from './session-store.mjs';

export const CODEX_WORKER_EVENT_TYPES = Object.freeze(['generate', 'accept', 'discard', 'prefetch']);
export const CODEX_WORKER_EVENT_LEASE_MS = 15_000;
const LOCAL_SCRIPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export class CodexLiveWorkerSupervisor {
  constructor({
    cwd,
    base,
    token,
    client,
    config,
    statePath,
    scriptsDir,
    fetchEvent = fetchNextEvent,
    handleAccept = augmentEventWithAcceptHandling,
    completeAccept = completeAcceptHandling,
    reply = postReply,
    publishCheckpoint = postVariantCheckpoint,
    publishPhase = postAgentPhase,
    postCleanup = postCarbonizeCleanup,
    detectCandidate = detectPreparedArtifact,
    sessionStore = null,
    log = () => {},
  }) {
    this.cwd = path.resolve(cwd);
    this.base = base;
    this.token = token;
    this.client = client;
    this.config = config;
    this.statePath = statePath;
    this.scriptsDir = scriptsDir;
    this.fetchEvent = fetchEvent;
    this.handleAccept = handleAccept;
    this.completeAccept = completeAccept;
    this.reply = reply;
    this.publishCheckpoint = publishCheckpoint;
    this.publishPhase = publishPhase;
    this.postCleanup = postCleanup;
    this.detectCandidate = detectCandidate;
    this.sessionStore = sessionStore || createLiveSessionStore({ cwd: this.cwd });
    this.log = log;
    this.running = false;
    this.queue = Promise.resolve();
    this.active = null;
    this.canceled = new Set();
    this.queuedGenerationIds = new Set();
    this.pollAbortController = null;
    this.activePoll = null;
    this.failure = null;
    this.thread = null;
    this.threadReady = Promise.resolve(null);
    this.model = null;
    this.liveSpec = '';
    this.threadPrimed = false;
  }

  async initialize() {
    this.liveSpec = readOptional(path.join(this.scriptsDir, '..', 'reference', 'live-generation.md'));
    await this.client.connect();
    const models = await this.client.listModels();
    this.model = this.config.model
      ? models.find((model) => model.id === this.config.model || model.model === this.config.model)
      : this.config.profile === 'fast'
        ? selectFastCodexModel(models)
        : selectQualityCodexModel(models);
    if (!this.model) throw supervisorError('codex_worker_model_unavailable');

    const prior = readJson(this.statePath);
    if (codexWorkerStateIsOwned(prior, this.cwd) && prior.status !== 'archived') {
      try {
        this.thread = await this.client.resumeDedicatedThread(prior.threadId, {
          model: this.model.model || this.model.id,
          cwd: this.cwd,
          approvalPolicy: 'never',
          sandbox: 'read-only',
          baseInstructions: buildCodexWorkerInstructions(this.liveSpec),
        });
        this.threadPrimed = prior.threadPrimed === true;
      } catch (error) {
        this.log(`resume failed; creating replacement worker thread: ${error.message}`);
      }
    }
    if (!this.thread) {
      this.thread = await this.startWorkerThread();
    }
    this.threadReady = Promise.resolve(this.thread);
    this.writeState('ready');
    return this.status();
  }

  async run() {
    if (!this.thread) await this.initialize();
    this.running = true;
    this.pollAbortController = new AbortController();
    while (this.running) {
      let event;
      try {
        const poll = this.fetchEvent(this.base, this.token, {
          types: CODEX_WORKER_EVENT_TYPES,
          leaseMs: CODEX_WORKER_EVENT_LEASE_MS,
          signal: this.pollAbortController.signal,
        });
        this.activePoll = poll;
        event = await poll;
      } catch (error) {
        if (!this.running && (error?.name === 'AbortError' || this.pollAbortController.signal.aborted)) break;
        throw error;
      } finally {
        this.activePoll = null;
      }
      if (!this.running) break;
      if (!event || event.type === 'timeout') continue;
      if (event.type === 'exit') {
        await this.cancelActive('live_exit');
        this.running = false;
        break;
      }
      if (event.type === 'accept' || event.type === 'discard') {
        this.canceled.add(event.id);
        const replaceBusyThread = this.active?.eventId === event.id;
        // Cancellation fences publication synchronously. Do not make the
        // deterministic Accept/Discard path wait on a slow app-server
        // interrupt round trip before it can update source and reply.
        void this.cancelActive(event.type, event.id);
        if (replaceBusyThread) this.rotateWorkerThread(event.type);
        const handled = await this.handleAccept(event, this.base, this.token, {
          deferReply: event.type === 'accept',
        });
        if (handled?._acceptResult?.handled !== true) {
          this.log(`${event.type} ${event.id} source update failed: ${handled?._acceptResult?.error || 'unhandled'}`);
        }
        if (event.type === 'accept' && handled?._acceptResult?.carbonize === true) {
          await this.postCleanup(this.base, this.token, {
            id: event.id,
            sessionId: event.id,
            file: handled._acceptResult.file,
            variantId: event.variantId,
            acceptResult: handled._acceptResult,
          });
        }
        if (handled?._completionAck?.deferred === true) {
          await this.completeAccept(handled, this.base, this.token);
        }
        continue;
      }
      if (event.type === 'generate') {
        if (this.queuedGenerationIds.has(event.id)) continue;
        this.queuedGenerationIds.add(event.id);
        this.queue = this.queue
          .then(() => this.processGeneration(event))
          .catch((error) => this.handleGenerationFailure(event, error))
          .finally(() => this.queuedGenerationIds.delete(event.id));
        continue;
      }
      if (event.type === 'prefetch') continue;
      if (requiresAgentReply(event)) {
        await this.reply(this.base, this.token, {
          id: event.id,
          type: 'error',
          sourceEventType: event.type,
          message: `Dedicated Codex worker does not handle ${event.type}; disable IMPECCABLE_LIVE_CODEX_WORKER for the portable foreground path.`,
        });
      }
    }
    await this.queue.catch(() => {});
    await this.shutdown({ archive: !this.failure });
  }

  async processGeneration(event) {
    if (this.isCanceled(event.id)) return;
    await this.threadReady;
    if (this.isCanceled(event.id)) return;
    if (!event.scaffold?.file) event.scaffold = runDeterministicScaffold(event, {
      cwd: this.cwd,
      scriptsDir: this.scriptsDir,
    });
    this.active = { eventId: event.id, turnId: null, threadId: this.thread.id };
    this.writeState('working', { eventId: event.id });
    try {
      const expectedVariants = Number(event.count || 1);
      const snapshot = this.sessionStore.getSnapshot(event.id, { includeCompleted: true });
      const sameEpoch = Number(snapshot?.generationEpoch || 1) === Number(event.generationEpoch || 1);
      let arrivedVariants = sameEpoch ? Number(snapshot?.arrivedVariants || 0) : 0;
      let completedRemainder = false;
      if (this.config.delivery === 'progressive' && expectedVariants > 1) {
        if (arrivedVariants < 1) {
          await this.runGenerationPhase(event, 'first', 1);
          arrivedVariants = 1;
        }
        if (this.isCanceled(event.id)) return;
        if (arrivedVariants < expectedVariants) {
          await this.runGenerationPhase(event, 'remainder', expectedVariants);
          arrivedVariants = expectedVariants;
          completedRemainder = true;
        }
        if (this.isCanceled(event.id)) return;
        const latest = this.sessionStore.getSnapshot(event.id, { includeCompleted: true });
        if (!completedRemainder && arrivedVariants >= expectedVariants && latest?.paramsPublished !== true) {
          await this.runGenerationPhase(event, 'params', expectedVariants);
        }
      } else if (arrivedVariants < expectedVariants) {
        await this.runGenerationPhase(event, 'atomic', expectedVariants);
      }
      if (this.isCanceled(event.id)) return;
      await this.reply(this.base, this.token, {
        id: event.id,
        type: 'done',
        sourceEventType: event.type,
        file: event.scaffold.file,
      });
    } finally {
      if (this.active?.eventId === event.id) {
        this.active = null;
        this.writeState('ready');
      }
    }
  }

  startWorkerThread() {
    this.threadPrimed = false;
    return this.client.startDedicatedThread({
      model: this.model.model || this.model.id,
      cwd: this.cwd,
      approvalPolicy: 'never',
      sandbox: 'read-only',
      ephemeral: false,
      serviceName: 'impeccable_live_codex_worker',
      baseInstructions: buildCodexWorkerInstructions(this.liveSpec),
    });
  }

  rotateWorkerThread(reason) {
    const priorThread = this.thread;
    const drainingQueue = this.queue;
    this.queue = Promise.resolve();
    this.thread = null;
    this.threadReady = this.startWorkerThread().then((thread) => {
      this.thread = thread;
      this.writeState('ready', {
        rotatedAt: new Date().toISOString(),
        rotationReason: reason,
      });
      return thread;
    });
    void this.threadReady.catch((error) => {
      this.writeState('error', { error: error.message, rotationReason: reason });
      this.log(`replacement worker thread failed: ${error.message}`);
    });
    if (priorThread) {
      void drainingQueue.finally(async () => {
        await this.client.archiveThread(priorThread.id).catch((error) => {
          this.log(`retired worker thread archive failed: ${error.message}`);
        });
      });
    }
    return this.threadReady;
  }

  async runGenerationPhase(event, phase, arrivedVariants) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.runGenerationPhaseOnce(event, phase, arrivedVariants);
      } catch (error) {
        const sourceChangedDuringGeneration = error?.code === 'publish_source_hash_mismatch';
        if (!sourceChangedDuringGeneration || attempt > 0 || this.isCanceled(event.id)) throw error;
        this.log(`source changed during ${event.id} ${phase}; re-preparing once before publication`);
      }
    }
  }

  async runGenerationPhaseOnce(event, phase, arrivedVariants) {
    if (this.isCanceled(event.id)) return;
    const phaseStartedAt = Date.now();
    await this.publishPhase(this.base, this.token, {
      eventId: event.id,
      phase: generationPhaseName(phase, 'generating'),
    });
    const prepared = prepareCodexWorkerPhase({
      id: event.id,
      sourceFile: event.scaffold.file,
      cwd: this.cwd,
    });
    const artifact = readPreparedArtifact(prepared, {
      cwd: this.cwd,
      maxBytes: this.config.maxArtifactBytes,
    });
    const contexts = readGenerationContexts(this.cwd, this.scriptsDir, event, {
      includeStable: !this.threadPrimed,
    });
    const prompt = buildGenerationTurnInput({
      event,
      phase,
      prepared,
      artifact,
      variantPlan: this.sessionStore.getSnapshot(event.id, { includeCompleted: true })?.variantPlan || null,
      ...contexts,
    });
    const input = buildCodexWorkerTurnInputs({
      prompt,
      skillPath: this.threadPrimed ? null : resolveCodexWorkerSkillPath(this.scriptsDir),
      screenshotPath: event.screenshotPath,
      cwd: this.cwd,
    });
    if (this.isCanceled(event.id)) return;
    const outputSchema = codexWorkerOutputSchemaForPhase(
      phase,
      Number(event.count || arrivedVariants),
      { sourceDelta: (phase === 'first' || phase === 'remainder' || phase === 'params') && !isCodexComponentPreviewMode(prepared.previewMode) },
    );
    let result = await this.runTurnWithReconnect({
      input,
      outputSchema,
      eventId: event.id,
      effort: phase === 'params' ? 'low' : undefined,
    });
    this.threadPrimed = true;
    this.writeState('working', { eventId: event.id });
    if (this.isCanceled(event.id)) return;
    await this.publishPhase(this.base, this.token, {
      eventId: event.id,
      phase: generationPhaseName(phase, 'validating'),
      durationMs: Date.now() - phaseStartedAt,
    });

    const baselineFindings = this.detectCandidate(prepared, {
      cwd: this.cwd,
      scriptsDir: this.scriptsDir,
    });
    let applied;
    let newFindings;
    let acceptedDetectorWaivers = [];
    for (let repairAttempt = 0; repairAttempt <= 1; repairAttempt += 1) {
      restorePreparedArtifact(prepared, artifact, { cwd: this.cwd });
      applied = applyCodexWorkerOutput({
        output: result.answer,
        prepared,
        phase,
        expectedVariants: Number(event.count || arrivedVariants),
        sessionId: event.id,
        scaffold: event.scaffold,
        cwd: this.cwd,
        maxBytes: this.config.maxArtifactBytes,
      });
      reconcileCandidateIfNeeded({
        applied,
        artifact,
        prepared,
        phase,
        arrivedVariants,
        cwd: this.cwd,
      });
      newFindings = diffDetectorFindings(
        baselineFindings,
        this.detectCandidate(prepared, { cwd: this.cwd, scriptsDir: this.scriptsDir }),
      );
      const waiverResolution = resolveDetectorFindingWaivers(
        newFindings,
        extractDetectorWaivers(result.answer),
      );
      newFindings = waiverResolution.unresolved;
      acceptedDetectorWaivers = waiverResolution.accepted;
      if (newFindings.length === 0) break;
      if (repairAttempt === 1) {
        const error = supervisorError('worker_output_detector_findings');
        error.findings = newFindings;
        throw error;
      }
      restorePreparedArtifact(prepared, artifact, { cwd: this.cwd });
      result = await this.runTurnWithReconnect({
        input: buildCodexWorkerTurnInputs({
          prompt: buildDetectorRepairPrompt(phase, newFindings),
          cwd: this.cwd,
        }),
        outputSchema: codexWorkerDetectorRepairSchema(outputSchema),
        eventId: event.id,
      });
      if (this.isCanceled(event.id)) return;
    }

    if (applied.plan) {
      this.sessionStore.appendEvent({
        type: 'variant_plan',
        id: event.id,
        plan: applied.plan,
      });
    }
    if (acceptedDetectorWaivers.length > 0) {
      this.sessionStore.appendEvent({
        type: 'detector_waivers',
        id: event.id,
        phase,
        waivers: acceptedDetectorWaivers.map(({ waiver }) => waiver),
      });
    }
    if (this.isCanceled(event.id)) return;
    const published = publishCodexWorkerPhase({ event, prepared, arrivedVariants, phase, cwd: this.cwd });
    let checkpointError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await this.publishCheckpoint(this.base, this.token, {
          event,
          published,
          scaffold: event.scaffold,
          arrivedVariants,
        });
        checkpointError = null;
        break;
      } catch (error) {
        checkpointError = error;
      }
    }
    if (checkpointError) throw checkpointError;
    if (['remainder', 'params', 'atomic'].includes(phase)) {
      await this.publishPhase(this.base, this.token, {
        eventId: event.id,
        phase: 'parameters_ready',
        durationMs: Date.now() - phaseStartedAt,
      });
    }
  }

  async runTurnWithReconnect({
    input,
    outputSchema,
    onAgentMessage,
    eventId = this.active?.eventId,
    effort,
  }) {
    let firstError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const threadId = this.thread.id;
        if (this.active?.eventId === eventId) this.active.threadId = threadId;
        const turn = await this.client.startTurn({
          threadId,
          input,
          cwd: this.cwd,
          model: this.model.model || this.model.id,
          effort: preferredEffort(this.model, effort || this.config.effort),
          summary: 'none',
          approvalPolicy: 'never',
          sandboxPolicy: { type: 'readOnly' },
          outputSchema,
          onAgentMessage,
          onStarted: (turnId) => {
            if (this.active?.eventId === eventId) this.active.turnId = turnId;
            if (eventId && this.isCanceled(eventId)) {
              this.client.interruptTurn(threadId, turnId).catch(() => {});
            }
          },
        });
        return { ...turn, answer: turn.message };
      } catch (error) {
        if (!firstError) firstError = error;
        if (eventId && this.isCanceled(eventId)) throw error;
        if (attempt > 0 || error.code === 'TURN_INTERRUPTED') throw error;
        this.log(`app-server turn failed; reconnecting once: ${error.message}`);
        await this.reconnect();
      }
    }
    throw firstError;
  }

  async reconnect() {
    this.thread = await this.reconnectThread(this.thread, this.model);
    this.writeState('ready', { reconnectedAt: new Date().toISOString() });
  }

  async reconnectThread(thread, model = this.model) {
    const resumed = await this.client.reconnect({
      threadId: thread.id,
      resumeParams: {
        model: model.model || model.id,
        cwd: this.cwd,
        approvalPolicy: 'never',
        sandbox: 'read-only',
        baseInstructions: buildCodexWorkerInstructions(this.liveSpec),
      },
    });
    if (thread === this.thread) {
      this.thread = resumed;
      this.writeState('ready', { reconnectedAt: new Date().toISOString() });
    }
    return resumed;
  }

  async cancelActive(reason, eventId = null) {
    if (!this.active) return;
    if (eventId && this.active.eventId !== eventId) return;
    this.canceled.add(this.active.eventId);
    const threadId = this.active.threadId || this.thread?.id;
    if (threadId && this.active.turnId) {
      await this.client.interruptTurn(threadId, this.active.turnId).catch(() => {});
    }
    this.log(`interrupted ${this.active.eventId}: ${reason}`);
  }

  async handleGenerationFailure(event, error) {
    if (this.isCanceled(event.id) || error.code === 'TURN_INTERRUPTED') return;
    this.log(`generation ${event.id} failed: ${error.stack || error.message}`);
    this.failure = {
      eventId: event.id,
      error: error.message,
      failedAt: new Date().toISOString(),
    };
    this.running = false;
    this.pollAbortController?.abort();
    if (this.activePoll) {
      await Promise.race([
        this.activePoll.catch(() => null),
        new Promise((resolve) => {
          const timer = setTimeout(resolve, 250);
          timer.unref?.();
        }),
      ]);
    }
    await this.reply(this.base, this.token, {
      id: event.id,
      type: 'retry',
      sourceEventType: event.type,
    }).catch(() => {});
    this.writeState('failed', this.failure);
  }

  isCanceled(eventId) {
    return this.canceled.has(eventId) || generationIsCanceled(eventId, { cwd: this.cwd });
  }

  async shutdown({ archive = false } = {}) {
    this.running = false;
    await this.cancelActive('shutdown');
    await Promise.race([
      this.threadReady.catch(() => null),
      new Promise((resolve) => {
        const timer = setTimeout(resolve, 1_000);
        timer.unref?.();
      }),
    ]);
    let archived = false;
    if (archive && this.thread) {
      try {
        await this.client.archiveThread(this.thread.id);
        archived = true;
      } catch (error) {
        if (/no rollout found/i.test(String(error?.message || ''))) {
          archived = true;
          this.log('empty worker thread had no persisted rollout; treating it as archived');
        } else {
          this.log(`thread archive failed: ${error.message}`);
        }
      }
    }
    await this.client.close().catch(() => {});
    this.writeState(
      this.failure ? 'failed' : archived ? 'archived' : 'stopped',
      { archived, ...(this.failure || {}) },
    );
  }

  status() {
    return {
      ok: true,
      owner: CODEX_WORKER_OWNER,
      cwd: this.cwd,
      pid: process.pid,
      status: this.active ? 'working' : 'ready',
      threadId: this.thread?.id || null,
      model: this.model?.model || this.model?.id || null,
      effort: this.model ? preferredEffort(this.model, this.config.effort) : this.config.effort,
      profile: this.config.profile,
      delivery: this.config.delivery,
      threadPrimed: this.threadPrimed,
      eventId: this.active?.eventId || null,
    };
  }

  writeState(status, extra = {}) {
    const state = {
      ...this.status(),
      ...extra,
      status,
      updatedAt: new Date().toISOString(),
    };
    atomicWriteJson(this.statePath, state);
    return state;
  }
}

function generationPhaseName(phase, state) {
  if (phase === 'first') return `first_variant_${state}`;
  if (phase === 'params') return `variant_parameters_${state}`;
  return `remaining_variants_${state}`;
}

function preferredEffort(model, requested) {
  const supported = (model?.supportedReasoningEfforts || [])
    .map((option) => typeof option === 'string' ? option : option?.reasoningEffort)
    .filter(Boolean);
  if (requested && supported.includes(requested)) return requested;
  return selectLowestReasoningEffort(model);
}

export async function postVariantCheckpoint(base, token, {
  event,
  published,
  scaffold,
  arrivedVariants,
}) {
  const response = await fetch(`${base}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      type: 'checkpoint',
      id: event.id,
      revision: published.revision,
      revisionDomain: 'publication',
      phase: 'cycling',
      reason: 'variants_progress',
      arrivedVariants,
      expectedVariants: event.count,
      sourceFile: scaffold.sourceFile || scaffold.file,
      previewFile: scaffold.file,
      previewMode: scaffold.previewMode || 'source',
      publicationKind: published.publicationKind || 'variants',
    }),
  });
  if (!response.ok) throw supervisorError(`checkpoint_${response.status}`);
}

export async function postAgentPhase(base, token, {
  eventId,
  phase,
  durationMs,
}) {
  const response = await fetch(`${base}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      type: 'agent_phase',
      id: eventId,
      phase,
      owner: CODEX_WORKER_OWNER,
      ...(Number.isFinite(durationMs) ? { durationMs } : {}),
    }),
  });
  if (!response.ok) throw supervisorError(`agent_phase_${response.status}`);
}

export async function postCarbonizeCleanup(base, token, {
  sessionId,
  file,
  variantId,
  acceptResult,
  id = randomBytes(4).toString('hex'),
}) {
  const response = await fetch(`${base}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      type: 'carbonize_cleanup',
      id,
      sessionId,
      file,
      variantId,
      acceptResult,
    }),
  });
  if (!response.ok) throw supervisorError(`carbonize_cleanup_${response.status}`);
  return { id, ...(await response.json()) };
}

export function buildDeterministicScaffoldCommand(event, scriptsDir) {
  const insert = event.mode === 'insert';
  const script = path.join(scriptsDir, insert ? 'live-insert.mjs' : 'live-wrap.mjs');
  const args = ['--id', String(event.id), '--count', String(event.count || 3)];
  const target = insert ? event.insert?.anchor || {} : event.element || {};
  if (!insert) args.push('--isolated');
  if (insert) args.push('--position', String(event.insert?.position || 'after'));
  if (target.id) args.push('--element-id', String(target.id));
  const classes = Array.isArray(target.classes) ? target.classes.join(',') : target.className;
  if (classes) args.push('--classes', String(classes));
  if (target.tagName || target.tag) args.push('--tag', String(target.tagName || target.tag).toLowerCase());
  const text = String(target.textContent || target.text || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  if (!target.id && !classes && text) args.push('--query', text);
  if (text) args.push('--text', text);
  return { script, args };
}

export function runDeterministicScaffold(event, {
  cwd = process.cwd(),
  scriptsDir,
  exec = execFileSync,
} = {}) {
  const command = buildDeterministicScaffoldCommand(event, scriptsDir);
  let output;
  try {
    output = exec(process.execPath, [command.script, ...command.args], {
      cwd,
      encoding: 'utf-8',
      timeout: 30_000,
    });
  } catch (error) {
    throw supervisorError(`codex_worker_scaffold_failed:${error.stderr || error.message}`);
  }
  let scaffold;
  try { scaffold = JSON.parse(String(output).trim()); } catch { throw supervisorError('codex_worker_scaffold_invalid'); }
  if (!scaffold?.file || scaffold.error) {
    throw supervisorError(`codex_worker_scaffold_${scaffold?.error || 'missing_file'}`);
  }
  return scaffold;
}

function restorePreparedArtifact(prepared, artifact, { cwd }) {
  if (!isCodexComponentPreviewMode(prepared.previewMode)) {
    fs.writeFileSync(path.resolve(cwd, prepared.artifactFile), artifact.content, 'utf-8');
    return;
  }
  const componentDir = path.resolve(cwd, prepared.componentDir);
  fs.mkdirSync(componentDir, { recursive: true });
  for (const name of fs.readdirSync(componentDir)) {
    if (/^(?:v\d+\.(?:svelte|vue)|params\.json)$/.test(name)) {
      fs.unlinkSync(path.join(componentDir, name));
    }
  }
  for (const [name, content] of Object.entries(artifact.files || {})) {
    fs.writeFileSync(path.join(componentDir, name), content, 'utf-8');
  }
  fs.writeFileSync(
    path.resolve(cwd, prepared.artifactFile),
    JSON.stringify(artifact.manifest, null, 2) + '\n',
    'utf-8',
  );
}

function reconcileCandidateIfNeeded({ applied, artifact, prepared, phase, arrivedVariants, cwd }) {
  if (isCodexComponentPreviewMode(prepared.previewMode) || applied.sourceDelta || phase !== 'remainder') return;
  const candidatePath = path.resolve(cwd, prepared.artifactFile);
  const reconciled = reconcilePublishedSourceVariants({
    current: artifact.content,
    candidate: fs.readFileSync(candidatePath, 'utf-8'),
    priorArrived: Math.max(1, arrivedVariants - 1),
  });
  if (!reconciled.ok) throw supervisorError(`reconcile_${reconciled.error}`);
  fs.writeFileSync(candidatePath, reconciled.content, 'utf-8');
}

export function detectPreparedArtifact(prepared, {
  cwd = process.cwd(),
  scriptsDir = LOCAL_SCRIPTS_DIR,
  spawn = spawnSync,
} = {}) {
  const targets = detectorTargets(prepared, cwd);
  if (targets.length === 0) return [];
  const detectorScript = [
    path.join(scriptsDir, 'detect.mjs'),
    path.join(LOCAL_SCRIPTS_DIR, 'detect.mjs'),
  ].find((candidate) => fs.existsSync(candidate));
  if (!detectorScript) throw supervisorError('codex_worker_detector_unavailable');
  const result = spawn(process.execPath, [detectorScript, '--json', ...targets], {
    cwd,
    encoding: 'utf-8',
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error) throw supervisorError(`codex_worker_detector_failed:${result.error.message}`);
  try {
    const findings = JSON.parse(String(result.stdout || '[]'));
    if (!Array.isArray(findings)) throw new Error('expected findings array');
    return findings;
  } catch (error) {
    throw supervisorError(`codex_worker_detector_invalid:${error.message}`);
  }
}

function detectorTargets(prepared, cwd) {
  if (!isCodexComponentPreviewMode(prepared.previewMode)) {
    return [path.resolve(cwd, prepared.artifactFile)];
  }
  const componentDir = path.resolve(cwd, prepared.componentDir);
  try {
    return fs.readdirSync(componentDir)
      .filter((name) => /\.(?:vue|svelte)$/.test(name))
      .map((name) => path.join(componentDir, name));
  } catch {
    return [];
  }
}

export function diffDetectorFindings(before, after) {
  const remaining = new Map();
  for (const finding of before || []) {
    const key = detectorFindingKey(finding);
    remaining.set(key, (remaining.get(key) || 0) + 1);
  }
  const added = [];
  for (const finding of after || []) {
    const key = detectorFindingKey(finding);
    const count = remaining.get(key) || 0;
    if (count > 0) remaining.set(key, count - 1);
    else added.push(finding);
  }
  return added;
}

function detectorFindingKey(finding) {
  return [
    path.basename(String(finding?.file || '')),
    finding?.antipattern || finding?.id || '',
    finding?.snippet || '',
    finding?.ignoreValue || '',
  ].join('\u0000');
}

export function buildDetectorRepairPrompt(phase, findings) {
  return [
    `The candidate for Live phase ${phase} has new Impeccable detector findings.`,
    'Use design judgment on every finding. Fix real defects. If a finding is contextually intentional or a detector false positive, leave that design intact and add one narrow detectorWaivers entry copied from the finding with a concrete reason. Return detectorWaivers as an empty array when every finding was fixed. Every finding must either disappear on the next scan or match an explicit waiver; unresolved findings still block publication.',
    'Return the complete replacement JSON for the same phase and schema. Do not explain, call tools, persist project detector config, add inline ignore comments, or alter immutable variants.',
    '<detector_findings>',
    JSON.stringify((findings || []).slice(0, 40).map((finding) => ({
      rule: finding.antipattern || finding.id,
      name: finding.name,
      description: finding.description,
      severity: finding.severity,
      snippet: finding.snippet,
      file: path.basename(String(finding.file || '')),
      ignoreValue: finding.ignoreValue || '',
    })), null, 2),
    '</detector_findings>',
  ].join('\n');
}

export function resolveDetectorFindingWaivers(findings, waivers) {
  const candidates = (Array.isArray(waivers) ? waivers : [])
    .map(normalizeDetectorWaiver)
    .filter(Boolean);
  const accepted = [];
  const unresolved = [];
  for (const finding of findings || []) {
    const waiver = candidates.find((candidate) => detectorWaiverMatches(candidate, finding));
    if (waiver) accepted.push({ finding, waiver });
    else unresolved.push(finding);
  }
  return { accepted, unresolved };
}

function extractDetectorWaivers(output) {
  try {
    const parsed = typeof output === 'string' ? JSON.parse(output) : output;
    return Array.isArray(parsed?.detectorWaivers) ? parsed.detectorWaivers : [];
  } catch {
    return [];
  }
}

function normalizeDetectorWaiver(waiver) {
  if (!waiver || typeof waiver !== 'object') return null;
  const normalized = {
    rule: String(waiver.rule || '').trim().toLowerCase(),
    file: path.basename(String(waiver.file || '').trim()),
    snippet: String(waiver.snippet || '').trim(),
    ignoreValue: String(waiver.ignoreValue || '').trim(),
    reason: String(waiver.reason || '').trim(),
  };
  return normalized.rule && normalized.reason && (normalized.snippet || normalized.ignoreValue)
    ? normalized
    : null;
}

function detectorWaiverMatches(waiver, finding) {
  const rule = String(finding?.antipattern || finding?.id || '').trim().toLowerCase();
  const file = path.basename(String(finding?.file || '').trim());
  const snippet = String(finding?.snippet || '').trim();
  const ignoreValue = String(finding?.ignoreValue || '').trim();
  if (waiver.rule !== rule) return false;
  if (waiver.file && waiver.file !== file) return false;
  if (waiver.ignoreValue) return waiver.ignoreValue === ignoreValue;
  return Boolean(waiver.snippet && waiver.snippet === snippet);
}

function readGenerationContexts(cwd, scriptsDir, event, { includeStable = true } = {}) {
  const context = loadContext(cwd);
  const action = event?.action;
  const safeAction = typeof action === 'string' && /^[a-z-]+$/.test(action) && action !== 'impeccable'
    ? action
    : null;
  return {
    product: includeStable ? context.product || '' : '',
    design: includeStable ? context.design || '' : '',
    actionReference: safeAction
      ? readOptional(path.join(scriptsDir, '..', 'reference', `${safeAction}.md`))
      : '',
    contextMetadata: includeStable ? {
      productPath: context.productPath,
      designPath: context.designPath,
      projectRoot: context.projectRoot,
      repoRoot: context.repoRoot,
      isMonorepo: context.isMonorepo,
    } : {},
  };
}

function readOptional(file) {
  try { return fs.readFileSync(file, 'utf-8'); } catch { return ''; }
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return null; }
}

function atomicWriteJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', 'utf-8');
  fs.renameSync(temporary, file);
}

function supervisorError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}
