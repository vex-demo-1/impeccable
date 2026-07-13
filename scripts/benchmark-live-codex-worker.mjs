#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

import { CodexAppServerClient } from '../skill/scripts/live/codex-app-server-client.mjs';
import { loadBenchmarkEnv } from './lib/live-provider-benchmark.mjs';
import {
  CODEX_QUALITY_OUTPUT_SCHEMA,
  buildCodexQualityPrompt,
  buildJudgePrompt,
  createCodexQualityTasks,
  parseJudgeResult,
  scoreCodexQualityOutput,
  summarizeCodexQualityRuns,
} from './lib/live-codex-quality-benchmark.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2));
const iterations = positiveInteger(args.iterations, 1);
const outputPath = args.output ? path.resolve(ROOT, String(args.output)) : null;
const selectedTaskIds = csv(args.tasks || 'editorial-bolder,operations-polish');
const selectedProfileIds = csv(args.profiles || 'spark-thin,sol-thin,sol-full');
const judgeEnabled = args.judge !== false;
const loadedEnv = loadBenchmarkEnv({ repoRoot: ROOT, explicitPath: args.envFile && path.resolve(args.envFile) });
const skillPath = path.join(ROOT, '.agents', 'skills', 'impeccable', 'SKILL.md');
const referenceDir = path.join(ROOT, 'skill', 'reference');
const tasks = createCodexQualityTasks({ repoRoot: ROOT }).filter((task) => selectedTaskIds.includes(task.id));

if (tasks.length !== selectedTaskIds.length) throw new Error('unknown task id in --tasks');

const client = new CodexAppServerClient({ cwd: ROOT, turnTimeoutMs: positiveInteger(args.timeout, 240_000) });
await client.connect();
const models = await client.listModels();
const profiles = resolveProfiles(selectedProfileIds, models);

if (args.dryRun) {
  const report = {
    schemaVersion: 1,
    mode: 'dry-run',
    iterations,
    tasks: tasks.map((task) => ({ id: task.id, action: task.action })),
    profiles: profiles.map(publicProfile),
    judgeEnabled,
    judgeAvailable: Boolean(process.env.ANTHROPIC_API_KEY),
    envFilesLoaded: loadedEnv.length,
  };
  await client.close();
  await emit(report);
  process.exit(0);
}

if (judgeEnabled && !process.env.ANTHROPIC_API_KEY) {
  await client.close();
  throw new Error('ANTHROPIC_API_KEY is required unless --no-judge is passed');
}

const runs = [];
try {
  for (const profile of profiles) {
    for (const task of tasks) {
      for (let iteration = 1; iteration <= iterations; iteration += 1) {
        process.stderr.write(`[codex-quality] ${profile.id} ${task.id} ${iteration}/${iterations}\n`);
        runs.push(await runOne({ client, profile, task, iteration }));
      }
    }
  }
} finally {
  await client.close().catch(() => {});
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: 'live',
  iterations,
  judge: judgeEnabled ? { provider: 'anthropic', model: args.judgeModel || 'claude-sonnet-4-6' } : null,
  tasks: tasks.map((task) => ({ id: task.id, action: task.action, brief: task.brief })),
  profiles: profiles.map((profile) => ({
    ...publicProfile(profile),
    summary: summarizeCodexQualityRuns(runs.filter((run) => run.profile === profile.id)),
  })),
  runs,
};
await emit(report);
process.exitCode = runs.every((run) => run.passed) ? 0 : 1;

async function runOne({ client: appServer, profile, task, iteration }) {
  let thread = null;
  try {
    const actionReference = await readFile(path.join(referenceDir, `${task.action}.md`), 'utf-8');
    thread = await appServer.startDedicatedThread({
      model: profile.model,
      cwd: ROOT,
      approvalPolicy: 'never',
      sandbox: 'read-only',
      ephemeral: true,
      serviceName: `impeccable_live_quality_${profile.id}`,
      baseInstructions: profile.fullContext
        ? 'You are a read-only Impeccable frontend implementation worker. The supervisor supplies resolved context and owns all writes. Return only schema-valid JSON.'
        : 'You are a dedicated Impeccable Live variant producer. Do not use tools or inspect files. Return only schema-valid JSON. Preserve copy, component contracts, accessibility, and supplied tokens.',
    });
    const prompt = buildCodexQualityPrompt(task, { actionReference, fullContext: profile.fullContext });
    const input = profile.fullContext
      ? [{ type: 'skill', name: 'impeccable', path: skillPath }, { type: 'text', text: prompt }]
      : [{ type: 'text', text: prompt }];
    const startedAt = performance.now();
    const result = await appServer.startTurn({
      threadId: thread.id,
      input,
      cwd: ROOT,
      model: profile.model,
      effort: profile.effort,
      summary: 'none',
      approvalPolicy: 'never',
      sandboxPolicy: { type: 'readOnly' },
      outputSchema: CODEX_QUALITY_OUTPUT_SCHEMA,
    });
    const durationMs = Math.round(performance.now() - startedAt);
    const output = JSON.parse(result.message);
    const deterministic = scoreCodexQualityOutput(task, output);
    const judge = judgeEnabled ? await judgeOutput(task, output) : null;
    return {
      profile: profile.id,
      task: task.id,
      iteration,
      model: profile.model,
      effort: profile.effort,
      fullContext: profile.fullContext,
      durationMs,
      deterministic,
      judge,
      passed: deterministic.passed && (!judge || judge.passed),
      output,
    };
  } catch (error) {
    return {
      profile: profile.id,
      task: task.id,
      iteration,
      model: profile.model,
      effort: profile.effort,
      fullContext: profile.fullContext,
      error: String(error?.stack || error),
      passed: false,
    };
  } finally {
    if (thread) await appServer.archiveThread(thread.id).catch(() => {});
  }
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

function resolveProfiles(ids, models) {
  const visible = models.filter((model) => model && !model.hidden);
  const find = (patterns) => visible.find((model) => patterns.every((pattern) => pattern.test(`${model.id || ''} ${model.model || ''}`)));
  const spark = find([/spark/i]);
  const sol = find([/5\.6/i, /sol/i]) || visible.find((model) => model.isDefault);
  const catalog = {
    'spark-thin': { id: 'spark-thin', model: spark?.model || spark?.id, effort: spark?.defaultReasoningEffort || 'high', fullContext: false },
    'sol-thin': { id: 'sol-thin', model: sol?.model || sol?.id, effort: 'medium', fullContext: false },
    'sol-full': { id: 'sol-full', model: sol?.model || sol?.id, effort: 'medium', fullContext: true },
  };
  return ids.map((id) => {
    const profile = catalog[id];
    if (!profile) throw new Error(`unknown profile ${id}`);
    if (!profile.model) throw new Error(`model unavailable for ${id}`);
    return profile;
  });
}

function publicProfile(profile) {
  return { id: profile.id, model: profile.model, effort: profile.effort, fullContext: profile.fullContext };
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
