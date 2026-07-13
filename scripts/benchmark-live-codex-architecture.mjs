#!/usr/bin/env node

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

import {
  CodexAppServerClient,
  selectQualityCodexModel,
} from '../skill/scripts/live/codex-app-server-client.mjs';
import {
  buildCodexWorkerInstructions,
  buildCodexWorkerTurnInputs,
} from '../skill/scripts/live/codex-worker.mjs';
import { runCodexExecBenchmark, summarizeArchitectureRuns } from './lib/codex-exec-benchmark.mjs';
import { loadBenchmarkEnv } from './lib/live-provider-benchmark.mjs';
import {
  CODEX_QUALITY_OUTPUT_SCHEMA,
  buildCodexQualityPrompt,
  buildJudgePrompt,
  createCodexQualityTasks,
  parseJudgeResult,
  scoreCodexQualityOutput,
} from './lib/live-codex-quality-benchmark.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2));
const iterations = positiveInteger(args.iterations, 2);
const timeoutMs = positiveInteger(args.timeout, 300_000);
const outputPath = args.output ? path.resolve(ROOT, String(args.output)) : null;
const profileIds = csv(args.profiles || 'direct-sol,cold-app-server,warm-app-server');
const taskIds = csv(args.tasks || 'editorial-bolder,operations-polish');
const judgeEnabled = args.judge !== false;
const loadedEnv = loadBenchmarkEnv({ repoRoot: ROOT, explicitPath: args.envFile && path.resolve(args.envFile) });
const skillPath = path.join(ROOT, '.agents', 'skills', 'impeccable', 'SKILL.md');
const referenceDir = path.join(ROOT, 'skill', 'reference');
const liveSpec = await readFile(path.join(referenceDir, 'live.md'), 'utf-8');
const tasks = createCodexQualityTasks({ repoRoot: ROOT }).filter((task) => taskIds.includes(task.id));
if (tasks.length !== taskIds.length) throw new Error('unknown task id in --tasks');
for (const profile of profileIds) {
  if (!['direct-sol', 'cold-app-server', 'warm-app-server'].includes(profile)) throw new Error(`unknown profile ${profile}`);
}
if (judgeEnabled && !process.env.ANTHROPIC_API_KEY && !args.dryRun) {
  throw new Error('ANTHROPIC_API_KEY is required unless --no-judge is passed');
}

let model = args.model || null;
if (!model && profileIds.some((profile) => profile.includes('app-server'))) {
  const discovery = new CodexAppServerClient({ cwd: ROOT });
  await discovery.connect();
  try {
    const selected = selectQualityCodexModel(await discovery.listModels());
    model = selected?.model || selected?.id || null;
  } finally {
    await discovery.close();
  }
}
model ||= 'gpt-5.6-sol';

if (args.dryRun) {
  await emit({
    schemaVersion: 1,
    mode: 'dry-run',
    profiles: profileIds,
    tasks: tasks.map((task) => task.id),
    iterations,
    model,
    effort: 'medium',
    judgeEnabled,
    judgeAvailable: Boolean(process.env.ANTHROPIC_API_KEY),
    envFilesLoaded: loadedEnv.length,
    plannedModelRuns: profileIds.length * tasks.length * iterations,
  });
  process.exit(0);
}

const scratch = await mkdtemp(path.join(os.tmpdir(), 'impeccable-codex-architecture-'));
const schemaPath = path.join(scratch, 'output-schema.json');
await writeFile(schemaPath, JSON.stringify(CODEX_QUALITY_OUTPUT_SCHEMA));
const runs = [];
try {
  for (const profile of profileIds) {
    if (profile === 'warm-app-server') {
      await runWarmProfile(profile);
      continue;
    }
    for (let iteration = 1; iteration <= iterations; iteration += 1) {
      for (const task of tasks) {
        process.stderr.write(`[codex-architecture] ${profile} ${task.id} ${iteration}/${iterations}\n`);
        runs.push(await (profile === 'direct-sol'
          ? runDirect({ profile, task, iteration })
          : runColdAppServer({ profile, task, iteration })));
      }
    }
  }
} finally {
  await rm(scratch, { recursive: true, force: true });
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: 'live',
  model,
  effort: 'medium',
  iterations,
  tasks: tasks.map((task) => ({ id: task.id, action: task.action, brief: task.brief })),
  profiles: profileIds.map((profile) => ({
    id: profile,
    summary: summarizeArchitectureRuns(runs.filter((run) => run.profile === profile)),
  })),
  judge: judgeEnabled ? { provider: 'anthropic', model: args.judgeModel || 'claude-sonnet-4-6' } : null,
  runs,
};
await emit(report);
process.exitCode = runs.every((run) => run.passed) ? 0 : 1;

async function runDirect({ profile, task, iteration }) {
  const outputFile = path.join(scratch, `${profile}-${task.id}-${iteration}.json`);
  const actionReference = await readFile(path.join(referenceDir, `${task.action}.md`), 'utf-8');
  const prompt = [
    '$impeccable',
    'Use the attached Impeccable skill. This automated benchmark already resolved Setup context below; do not rerun setup or edit files.',
    buildCodexQualityPrompt(task, { actionReference, fullContext: true }),
  ].join('\n\n');
  try {
    const result = await runCodexExecBenchmark({
      cwd: ROOT,
      timeoutMs,
      args: [
        'exec', '--ephemeral', '--ignore-user-config', '--dangerously-bypass-hook-trust',
        '-C', ROOT, '-s', 'read-only', '-m', model,
        '-c', 'model_reasoning_effort="medium"',
        '--output-schema', schemaPath,
        '--output-last-message', outputFile,
        '--json', prompt,
      ],
    });
    const output = JSON.parse(await readFile(outputFile, 'utf-8'));
    return finishRun({
      profile,
      task,
      iteration,
      output,
      startupMs: result.turnStartedMs,
      generationMs: result.firstAgentMessageMs == null || result.turnStartedMs == null
        ? result.durationMs
        : result.firstAgentMessageMs - result.turnStartedMs,
      totalMs: result.durationMs,
      usage: result.usage,
      transport: {
        threadStartedMs: round(result.threadStartedMs),
        turnStartedMs: round(result.turnStartedMs),
        firstAgentMessageMs: round(result.firstAgentMessageMs),
      },
    });
  } catch (error) {
    return failedRun({ profile, task, iteration, error });
  }
}

async function runColdAppServer({ profile, task, iteration }) {
  const startedAt = performance.now();
  const client = new CodexAppServerClient({ cwd: ROOT, turnTimeoutMs: timeoutMs });
  let thread = null;
  try {
    await client.connect();
    await client.listModels();
    thread = await client.startDedicatedThread(threadParams(profile));
    const startupMs = performance.now() - startedAt;
    const turn = await runAppServerTurn(client, thread, task);
    return finishRun({
      profile,
      task,
      iteration,
      output: turn.output,
      startupMs,
      generationMs: turn.durationMs,
      totalMs: performance.now() - startedAt,
      usage: normalizeAppServerUsage(turn.turn),
    });
  } catch (error) {
    return failedRun({ profile, task, iteration, error });
  } finally {
    if (thread) await client.archiveThread(thread.id).catch(() => {});
    await client.close().catch(() => {});
  }
}

async function runWarmProfile(profile) {
  const client = new CodexAppServerClient({ cwd: ROOT, turnTimeoutMs: timeoutMs });
  let thread = null;
  const startedAt = performance.now();
  try {
    await client.connect();
    await client.listModels();
    thread = await client.startDedicatedThread(threadParams(profile));
    const coldStartupMs = performance.now() - startedAt;
    for (let iteration = 1; iteration <= iterations; iteration += 1) {
      for (const task of tasks) {
        process.stderr.write(`[codex-architecture] ${profile} ${task.id} ${iteration}/${iterations}\n`);
        const turnStartedAt = performance.now();
        try {
          const turn = await runAppServerTurn(client, thread, task);
          runs.push(await finishRun({
            profile,
            task,
            iteration,
            output: turn.output,
            startupMs: iteration === 1 && task === tasks[0] ? coldStartupMs : 0,
            generationMs: turn.durationMs,
            totalMs: performance.now() - turnStartedAt + (iteration === 1 && task === tasks[0] ? coldStartupMs : 0),
            usage: normalizeAppServerUsage(turn.turn),
            transport: { persistentThread: true, coldStartupMs: round(coldStartupMs) },
          }));
        } catch (error) {
          runs.push(failedRun({ profile, task, iteration, error }));
        }
      }
    }
  } finally {
    if (thread) await client.archiveThread(thread.id).catch(() => {});
    await client.close().catch(() => {});
  }
}

function threadParams(profile) {
  return {
    model,
    cwd: ROOT,
    approvalPolicy: 'never',
    sandbox: 'read-only',
    ephemeral: profile === 'cold-app-server',
    serviceName: `impeccable_live_architecture_${profile}`,
    baseInstructions: buildCodexWorkerInstructions(liveSpec),
  };
}

async function runAppServerTurn(client, thread, task) {
  const actionReference = await readFile(path.join(referenceDir, `${task.action}.md`), 'utf-8');
  const prompt = buildCodexQualityPrompt(task, { actionReference, fullContext: true });
  const result = await client.startTurn({
    threadId: thread.id,
    input: buildCodexWorkerTurnInputs({ prompt, skillPath, screenshotPath: task.screenshotPath, cwd: ROOT }),
    cwd: ROOT,
    model,
    effort: 'medium',
    summary: 'none',
    approvalPolicy: 'never',
    sandboxPolicy: { type: 'readOnly' },
    outputSchema: CODEX_QUALITY_OUTPUT_SCHEMA,
  });
  return { output: JSON.parse(result.message), durationMs: result.durationMs, turn: result };
}

async function finishRun({ profile, task, iteration, output, startupMs, generationMs, totalMs, usage, transport = null }) {
  const deterministic = scoreCodexQualityOutput(task, output);
  const judge = judgeEnabled ? await judgeOutput(task, output) : null;
  return {
    profile,
    task: task.id,
    iteration,
    model,
    effort: 'medium',
    startupMs: round(startupMs),
    generationMs: round(generationMs),
    totalMs: round(totalMs),
    usage,
    transport,
    deterministic,
    judge,
    passed: deterministic.passed && (!judge || judge.passed),
    output,
  };
}

function failedRun({ profile, task, iteration, error }) {
  return {
    profile,
    task: task.id,
    iteration,
    model,
    effort: 'medium',
    error: String(error?.stack || error),
    passed: false,
  };
}

async function judgeOutput(task, output) {
  const response = await generateText({
    model: anthropic(args.judgeModel || 'claude-sonnet-4-6'),
    system: 'Be strict, concrete, and independent. Return the requested JSON object only.',
    prompt: buildJudgePrompt(task, output),
    maxOutputTokens: 800,
  });
  return parseJudgeResult(response.text);
}

function normalizeAppServerUsage(turn) {
  const usage = turn?.completed?.params?.turn?.usage || turn?.turn?.usage || null;
  if (!usage) return null;
  return {
    input_tokens: usage.inputTokens ?? usage.input_tokens ?? null,
    cached_input_tokens: usage.cachedInputTokens ?? usage.cached_input_tokens ?? null,
    output_tokens: usage.outputTokens ?? usage.output_tokens ?? null,
    reasoning_output_tokens: usage.reasoningOutputTokens ?? usage.reasoning_output_tokens ?? null,
  };
}

async function emit(report) {
  if (outputPath) {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n');
  }
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === '--dry-run') result.dryRun = true;
    else if (value === '--no-judge') result.judge = false;
    else if (value.startsWith('--')) {
      const [rawKey, inline] = value.slice(2).split('=', 2);
      const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      result[key] = inline ?? values[++index];
    }
  }
  return result;
}

function csv(value) {
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}
