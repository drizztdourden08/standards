/* @layer tooling-scripts @kind logic */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ESLINT_FILES } from './run.constants.mjs';

/**
 * @param {string} rootDir
 * @param {RegExp} [pattern] the files to keep
 * @returns {string[] | null} the files git lists, null without git
 */
const lintableFiles = (rootDir, pattern = ESLINT_FILES) => {
  const result = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: rootDir, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, windowsHide: true });
  if (result.status !== 0) return null;
  const files = result.stdout.split('\0').filter((file) => file && pattern.test(file) && existsSync(join(rootDir, file)));
  return [...new Set(files)].sort();
};

export { lintableFiles };
