/* @layer tooling-scripts @kind logic */
import { spawn } from 'node:child_process';
import { killTree } from './kill-tree.mjs';

const TIMED_OUT_CODE = 124;

/**
 * @param {{ command: string, args?: string[], cwd: string, env?: NodeJS.ProcessEnv, timeoutMs: number, label: string, shell?: boolean }} job
 * @returns {Promise<{ code: number, timedOut: boolean }>}
 */
const runTimed = ({ command, args = [], cwd, env = process.env, timeoutMs, label, shell = false }) =>
  new Promise((resolveRun) => {
    const child = spawn(command, args, { cwd, env, stdio: 'inherit', shell, detached: process.platform !== 'win32', windowsHide: true });
    let timedOut = false;
    const onExit = () => killTree(child.pid);
    process.once('exit', onExit);
    const timer = setTimeout(() => {
      timedOut = true;
      console.error(`standards: ${label} timed out after ${Math.round(timeoutMs / 1000)}s, killing its process tree`);
      killTree(child.pid);
    }, timeoutMs);
    const finish = (code) => {
      clearTimeout(timer);
      process.removeListener('exit', onExit);
      resolveRun({ code: timedOut ? TIMED_OUT_CODE : code, timedOut });
    };
    child.once('error', (error) => {
      console.error(`standards: ${label} could not start: ${error.message}`);
      finish(1);
    });
    child.once('close', (code) => finish(code ?? 1));
  });

export { runTimed };
