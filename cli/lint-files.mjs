/* @layer tooling-scripts @kind logic */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ESLINT_FILES } from './run.constants.mjs';

/**
 * @param {string} rootDir
 * @returns {string[] | null} the code files git lists, null without git
 */
const lintableFiles = (rootDir) => {
  const result = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: rootDir, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, windowsHide: true });
  if (result.status !== 0) return null;
  const files = result.stdout.split('\0').filter((file) => file && ESLINT_FILES.test(file) && existsSync(join(rootDir, file)));
  return [...new Set(files)].sort();
};

export { lintableFiles };
