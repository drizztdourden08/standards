/* @layer tooling-scripts @kind logic */
import { fork } from 'node:child_process';
import { join } from 'node:path';
import { killTree } from './kill-tree.mjs';

const CHILD = join(import.meta.dirname, 'related-tests-child.mjs');

/**
 * @param {{ bin: string, rootDir: string, files: string[], env: NodeJS.ProcessEnv, timeoutMs: number }} job
 * @returns {Promise<{ tests: string[] } | { failure: string }>} absolute test file paths
 */
const relatedTests = ({ bin, rootDir, files, env, timeoutMs }) =>
  new Promise((done) => {
    let result = { failure: 'the resolver ended without an answer' };
    const child = fork(CHILD, [], { cwd: rootDir, env, windowsHide: true });
    const timer = setTimeout(() => {
      result = { failure: `timed out after ${Math.round(timeoutMs / 1000)}s` };
      killTree(child.pid);
    }, timeoutMs);
    child.once('message', (message) => {
      result = message;
    });
    child.once('error', (error) => {
      result = { failure: error.message };
    });
    child.once('close', () => {
      clearTimeout(timer);
      done(result);
    });
    child.send({ bin, root: rootDir, files });
  });

export { relatedTests };
