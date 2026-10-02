/* @layer tooling-scripts @kind logic */
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { workspaceDirs } from '../structure/workspace.mjs';

const SCOPE = '@drizztdourden08';
const NAME = 'standards';

const copyUnder = (dir) => {
  const path = join(dir, 'node_modules', SCOPE, NAME);
  return existsSync(path) ? realpathSync(path) : null;
};

const storeDirs = (rootDir) => {
  const store = join(rootDir, 'node_modules', '.pnpm');
  if (!existsSync(store)) return [];
  return readdirSync(store).filter((name) => name !== 'node_modules' && !name.startsWith('.')).map((name) => join(store, name));
};

/**
 * @param {string} rootDir
 * @returns {string[]} the real folders of each copy
 */
const standardsCopies = (rootDir) => {
  const dirs = [rootDir, ...workspaceDirs(rootDir).dirs, ...storeDirs(rootDir)];
  return [...new Set(dirs.map(copyUnder).filter(Boolean))];
};

/**
 * @param {string} rootDir
 * @returns {string[]}
 */
const copyFindings = (rootDir) => {
  const copies = standardsCopies(rootDir);
  if (copies.length < 2) return [];
  return [
    `${copies.length} copies of ${SCOPE}/${NAME} resolve in this install. ESLint meets the "local" plugin once per copy and fails with "Cannot redefine plugin". Keep one version range everywhere, or pin it with a pnpm override:`,
    ...copies.map((copy) => `  ${copy.replace(/\\/g, '/')}`),
  ];
};

export { copyFindings, standardsCopies };
