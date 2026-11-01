/* @layer tooling-scripts @kind logic */
import { resolve } from 'node:path';
import { loadStandards, OWN_ROOT } from '../config/load.mjs';
import { withHeavyLock } from '../lock/with-lock.mjs';
import { binOf } from './bin-of.mjs';
import { changedFiles } from './changed-files.mjs';
import { runTimed } from './run-timed.mjs';
import { BASE_ENV, TEST_TIMEOUTS_MS } from './run.constants.mjs';
import { parseTestArgs } from './test-args.mjs';
import { testArgs } from './test-modes.mjs';

const runVitest = async (job, env) => {
  const { rootDir, mode, base, passthrough, timeoutMs } = job;
  const found = changedFiles(rootDir, base ? { ...env, [BASE_ENV]: base } : env);
  if ('failure' in found) {
    console.error(`standards test: cannot find the changed files: ${found.failure}`);
    return 1;
  }
  console.log(`standards test ${mode}: ${found.files.length} files changed since ${found.base} (merge base with ${found.ref})`);
  if (!found.files.length) return 0;
  const bin = binOf('vitest', [rootDir, OWN_ROOT]);
  if (!bin) {
    console.error('standards test: vitest is not installed');
    return 1;
  }
  const args = [bin, ...testArgs({ mode, files: found.files, passthrough })];
  return (await runTimed({ command: process.execPath, args, cwd: rootDir, env, timeoutMs, label: `test ${mode}` })).code;
};

/**
 * @param {{ rootDir: string, args?: string[] }} ctx
 * @returns {Promise<number>} exit code
 */
const runTest = async (ctx) => {
  const { mode, root, base, passthrough } = parseTestArgs(ctx.args ?? []);
  const rootDir = resolve(root ?? ctx.rootDir);
  const configured = loadStandards({ rootDir }).options.test ?? {};
  const timeoutMs = configured.timeouts?.[mode] ?? TEST_TIMEOUTS_MS[mode];
  return withHeavyLock({ root: rootDir, command: `standards test ${mode}` }, (env) => runVitest({ rootDir, mode, base, passthrough, timeoutMs }, env));
};

export { runTest };
