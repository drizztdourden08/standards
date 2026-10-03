/* @layer tooling-scripts @kind logic */
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { workspaceDirs } from '../structure/workspace.mjs';

const SCOPE = '@drizztdourden08';
const NAME = 'standards';

const scopeEntries = (modulesDir) => {
  const scopeDir = join(modulesDir, SCOPE);
  return existsSync(scopeDir) ? readdirSync(scopeDir).map((name) => ({ name, path: join(scopeDir, name) })) : [];
};

const modulesOf = (packageDir) =>
  basename(dirname(packageDir)) === SCOPE && basename(dirname(dirname(packageDir))) === 'node_modules'
    ? dirname(dirname(packageDir))
    : join(packageDir, 'node_modules');

/**
 * @param {string} rootDir
 * @returns {string[]} the real folder of each reachable copy
 */
const standardsCopies = (rootDir) => {
  const copies = new Set();
  const seen = new Set();
  const queue = [rootDir, ...workspaceDirs(rootDir).dirs].map((dir) => join(dir, 'node_modules'));
  while (queue.length > 0) {
    const modulesDir = queue.shift();
    if (seen.has(modulesDir)) continue;
    seen.add(modulesDir);
    for (const { name, path } of scopeEntries(modulesDir)) {
      const real = realpathSync(path);
      if (name === NAME) copies.add(real);
      else queue.push(modulesOf(real));
    }
  }
  return [...copies];
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
