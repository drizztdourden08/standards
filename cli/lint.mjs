/* @layer tooling-scripts @kind logic */
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { loadStandards } from '../config/load.mjs';
import { withHeavyLock } from '../lock/with-lock.mjs';
import { lintSteps, stepBin } from './lint-steps.mjs';
import { planLint } from './lint-plan.mjs';
import { runTimed } from './run-timed.mjs';
import { BASE_ENV, LINT_TIMEOUTS_MS } from './run.constants.mjs';

const OPTIONS = { root: { type: 'string' }, all: { type: 'boolean' }, changed: { type: 'boolean' }, base: { type: 'string' } };

const runStep = async (rootDir, step, lint, env) => {
  const bin = stepBin(step);
  if (!bin) {
    console.error(`standards lint: ${step.name} is not installed`);
    return { id: step.id, failed: true, timedOut: false };
  }
  const timeoutMs = lint.timeouts?.[step.id] ?? LINT_TIMEOUTS_MS[step.id];
  const { code, timedOut } = await runTimed({ command: process.execPath, args: [bin, ...step.args], cwd: rootDir, env, timeoutMs, label: `lint step ${step.id}` });
  return { id: step.id, failed: code !== 0, timedOut };
};

const runSteps = async (rootDir, lint, env, options) => {
  const plan = planLint({ cwd: rootDir, all: options.all, changed: options.changed, env: options.base ? { ...env, [BASE_ENV]: options.base } : env });
  console.log(plan.line);
  const results = [];
  for (const step of lintSteps({ rootDir, lint, plan })) results.push(await runStep(rootDir, step, lint, env));
  return results.filter((result) => result.failed);
};

/**
 * `standards lint [--all | --changed] [--root <dir>]`. Changed files by default; typecheck is always project-wide.
 * @param {{ rootDir: string, args?: string[] }} ctx
 * @returns {Promise<number>} exit code
 */
const runLint = async (ctx) => {
  const { values } = parseArgs({ args: ctx.args ?? [], options: OPTIONS });
  const rootDir = resolve(values.root ?? ctx.rootDir);
  const lint = loadStandards({ rootDir }).options.lint ?? {};
  const failed = await withHeavyLock({ root: rootDir, command: 'standards lint' }, (env) => runSteps(rootDir, lint, env, values));
  if (!failed.length) return 0;
  const timedOut = failed.filter((result) => result.timedOut).map((result) => result.id);
  if (timedOut.length) console.error(`standards lint: timed out: ${timedOut.join(', ')}`);
  console.error(`standards lint: ${failed.length} step(s) failed: ${failed.map((result) => result.id).join(', ')}`);
  return 1;
};

export { runLint };
