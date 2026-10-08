/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { workspaceDirs } from '../structure/workspace.mjs';

const readPackage = (dir) => {
  const file = join(dir, 'package.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
};

const workspacePackages = (rootDir) => workspaceDirs(rootDir).dirs.map(readPackage).filter((pkg) => pkg?.name && pkg.version);

/**
 * @param {string} rootDir the repo root
 * @param {string} [packageName] the package that names the release
 * @returns {string} the version the repo releases next, or released last
 */
const releaseVersionOf = (rootDir, packageName) => {
  const root = readPackage(rootDir);
  if (!root) throw new Error(`no package.json in ${rootDir}`);
  const packages = workspacePackages(rootDir);
  if (packageName) {
    const named = [root, ...packages].find((pkg) => pkg?.name === packageName);
    if (!named) throw new Error(`releaseNotes.package names ${packageName}, which is not in this repo`);
    return named.version;
  }
  if (!root.private && root.version) return root.version;
  const versions = [...new Set(packages.filter((pkg) => !pkg.private).map((pkg) => pkg.version))];
  if (versions.length > 1) throw new Error(`the published packages carry ${versions.join(', ')}; set options.releaseNotes.package in standards.config.mjs to the one that names the release`);
  return versions[0] ?? root.version;
};

/**
 * @param {string} rootDir
 * @returns {string} the root package name, as a product
 */
const productOf = (rootDir) => {
  const name = (readPackage(rootDir)?.name ?? 'Product').replace(/^@[^/]+\//, '').replace(/-/g, ' ');
  return `${name[0].toUpperCase()}${name.slice(1)}`;
};

const partsOf = (version) => {
  const [core, pre] = version.split('-', 2);
  return { numbers: core.split('.').map(Number), pre: pre ?? null };
};

/**
 * @param {string} a @param {string} b
 * @returns {number} negative when a is older
 */
const compareVersions = (a, b) => {
  const [x, y] = [partsOf(a), partsOf(b)];
  const diff = x.numbers.map((n, i) => n - y.numbers[i]).find((d) => d !== 0);
  if (diff) return diff;
  if (x.pre === y.pre) return 0;
  if (x.pre === null || y.pre === null) return x.pre === null ? 1 : -1;
  return x.pre.localeCompare(y.pre, 'en', { numeric: true });
};

export { releaseVersionOf, productOf, compareVersions };
