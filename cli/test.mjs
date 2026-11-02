/* @layer tooling-scripts @kind logic */
import { resolve } from 'node:path';
import { loadStandards, OWN_ROOT } from '../config/load.mjs';
import { withHeavyLock } from '../lock/with-lock.mjs';
import { binOf } from './bin-of.mjs';
import { changedFiles } from './changed-files.mjs';
import { relatedTests } from './related-tests.mjs';
import { runTimed } from './run-timed.mjs';
import { BASE_ENV, TEST_TIMEOUTS_MS, TEST_USAGE } from './run.constants.mjs';
import { givenFiles, parseTestArgs } from './test-args.mjs';
import { testArgs, testBatches } from './test-modes.mjs';

const sourceFiles = (job, env) => {
  const { rootDir, mode, base, given } = job;
  if (given.length) {
    console.log(`standards test ${mode}: ${given.length} files given`);
    return { files: given };
  }
  const found = changedFiles(rootDir, base ? { ...env, [BASE_ENV]: base } : env);
  if ('failure' in found) return { failure: `cannot find the changed files: ${found.failure}` };
  console.log(`standards test ${mode}: ${found.files.length} files changed since ${found.base} (merge base with ${found.ref})`);
  return found;
};

const runBatches = async (job, env, tests) => {
  const { rootDir, mode, passthrough, timeoutMs } = job;
  const batches = testBatches(tests);
  let code = 0;
  for (const [index, files] of batches.entries()) {
    const label = batches.length > 1 ? `test ${mode} batch ${index + 1} of ${batches.length}` : `test ${mode}`;
    if (batches.length > 1) console.log(`standards ${label}`);
    const args = [job.bin, ...testArgs({ mode, files, passthrough })];
    const result = await runTimed({ command: process.execPath, args, cwd: rootDir, env, timeoutMs, label });
    code ||= result.code;
  }
  return code;
};

const runVitest = async (job, env) => {
  const { rootDir, mode, timeoutMs } = job;
  const found = sourceFiles(job, env);
  if ('failure' in found) {
    console.error(`standards test: ${found.failure}`);
    return 1;
  }
  if (!found.files.length) return 0;
  const bin = binOf('vitest', [rootDir, OWN_ROOT]);
  if (!bin) {
    console.error('standards test: vitest is not installed');
    return 1;
  }
  const related = await relatedTests({ bin, rootDir, files: found.files, env, timeoutMs });
  if ('failure' in related) {
    console.error(`standards test: cannot find the related tests: ${related.failure}`);
    return 1;
  }
  console.log(`standards test ${mode}: ${related.tests.length} test files related to ${found.files.length} files`);
  if (!related.tests.length) return 0;
  return runBatches({ ...job, bin }, env, related.tests);
};

/**
 * @param {{ rootDir: string, args?: string[] }} ctx
 * @returns {Promise<number>} exit code
 */
const runTest = async (ctx) => {
  const { mode, root, base, files, help, passthrough } = parseTestArgs(ctx.args ?? []);
  if (help) {
    console.log(TEST_USAGE);
    return 0;
  }
  const rootDir = resolve(root ?? ctx.rootDir);
  const given = givenFiles({ files, cwd: process.cwd(), rootDir });
  if ('missing' in given) {
    console.error(`standards test: no such file: ${given.missing.join(', ')}`);
    return 1;
  }
  const configured = loadStandards({ rootDir }).options.test ?? {};
  const timeoutMs = configured.timeouts?.[mode] ?? TEST_TIMEOUTS_MS[mode];
  const job = { rootDir, mode, base, given: given.files, passthrough, timeoutMs };
  return withHeavyLock({ root: rootDir, command: `standards test ${mode}` }, (env) => runVitest(job, env));
};

export { runTest };
