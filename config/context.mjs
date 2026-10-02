/* @layer tooling-scripts @kind logic */
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

const inside = (dir, rootDir) => {
  const path = relative(rootDir, dir);
  return path !== '' && !path.startsWith('..') && !isAbsolute(path);
};

const nearestPackage = (fromDir, rootDir) => {
  let dir = resolve(fromDir);
  while (inside(dir, rootDir)) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    dir = dirname(dir);
  }
  return undefined;
};

/**
 * @param {string} rootDir the repo root the run resolves against
 * @param {{ packageDir?: string }} [input]
 * @returns {{ rootDir: string, packageDir?: string }} the context of an options function
 */
const optionsContext = (rootDir, input = {}) => {
  const packageDir = input.packageDir ? resolve(input.packageDir) : nearestPackage(process.cwd(), rootDir);
  return packageDir ? { rootDir, packageDir } : { rootDir };
};

export { optionsContext };
