/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { workspaceDirs } from '../structure/workspace.mjs';

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies'];

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

/**
 * @param {string} fromDir
 * @param {string} name
 * @returns {string | null} the package.json of name, as node would find it
 */
const installedPackageJson = (fromDir, name) => {
  let dir = fromDir;
  for (;;) {
    const file = join(dir, 'node_modules', name, 'package.json');
    if (existsSync(file)) return file;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
};

/**
 * @param {string} packageJson
 * @returns {string | null} the absolute path of the declared extension module
 */
const declaredExtension = (packageJson) => {
  const entry = readJson(packageJson)?.standards?.extension;
  if (typeof entry !== 'string') return null;
  const file = resolve(dirname(packageJson), entry);
  return existsSync(file) ? realpathSync(file) : null;
};

const dependencyNames = (pkg) => [...new Set(DEPENDENCY_FIELDS.flatMap((field) => Object.keys(pkg?.[field] ?? {})))];

const extensionsOfDependencies = (dir) =>
  dependencyNames(readJson(join(dir, 'package.json')))
    .map((name) => installedPackageJson(dir, name))
    .filter(Boolean)
    .map(declaredExtension)
    .filter(Boolean);

/**
 * @param {string} rootDir
 * @returns {string[]} extension modules that dependencies declare
 */
const discoverExtensions = (rootDir) => {
  const dirs = [rootDir, ...workspaceDirs(rootDir).dirs];
  return [...new Set(dirs.flatMap(extensionsOfDependencies))];
};

export { discoverExtensions };
