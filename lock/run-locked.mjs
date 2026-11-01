/* @layer tooling-scripts @kind logic */
import { runTimed } from '../cli/run-timed.mjs';
import { withHeavyLock } from './with-lock.mjs';

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;

const quote = (arg) => (/^[\w./:=@%+-]+$/.test(arg) ? arg : `"${arg.replace(/"/g, '\\"')}"`);

/**
 * `standards run-locked -- <cmd...>`: runs a command under the heavy check lock with a hard timeout.
 * @param {{ rootDir: string, args: string[], timeoutMs?: number }} ctx
 * @returns {Promise<number>} the command exit code
 */
const runLocked = async ({ rootDir, args, timeoutMs = DEFAULT_TIMEOUT_MS }) => {
  const command = args[0] === '--' ? args.slice(1) : args;
  if (!command.length) {
    console.error('standards run-locked: give a command after --');
    return 1;
  }
  const label = command.join(' ');
  return withHeavyLock({ root: rootDir, command: label }, async (env) => {
    const windows = process.platform === 'win32';
    const { code } = await runTimed({
      command: windows ? command.map(quote).join(' ') : command[0],
      args: windows ? [] : command.slice(1),
      cwd: rootDir,
      env,
      timeoutMs,
      label,
      shell: windows,
    });
    return code;
  });
};

export { runLocked };
