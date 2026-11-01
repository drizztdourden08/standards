/* @layer tooling-scripts @kind logic */
import { runTimed } from './run-timed.mjs';
import { withHeapCeiling } from './heap-env.mjs';

const announce = (step, index, total) => {
  if (!step.batches) return `lint step ${step.id}`;
  const position = `batch ${index + 1} of ${total}`;
  console.log(`standards lint: ${step.id} ${position}`);
  return `lint step ${step.id} ${position}`;
};

/**
 * @param {{ bin: string, rootDir: string, step: Record<string, any>, env: NodeJS.ProcessEnv, timeoutMs: number }} job
 * @returns {Promise<{ failed: boolean, timedOut: boolean }>} batches run one after the other
 */
const runBatches = async ({ bin, rootDir, step, env, timeoutMs }) => {
  const batches = step.batches ?? [step.args];
  const stepEnv = step.heap ? withHeapCeiling(env) : env;
  const result = { failed: false, timedOut: false };
  for (const [index, args] of batches.entries()) {
    const label = announce(step, index, batches.length);
    const { code, timedOut } = await runTimed({ command: process.execPath, args: [bin, ...args], cwd: rootDir, env: stepEnv, timeoutMs, label });
    result.failed ||= code !== 0;
    result.timedOut ||= timedOut;
    if (timedOut) break;
  }
  return result;
};

export { runBatches };
