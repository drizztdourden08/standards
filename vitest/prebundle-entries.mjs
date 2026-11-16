/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CODE_FILE = /\.(?:ts|tsx|mts|js|mjs)$/;

/**
 * @param {unknown} target an exports target: a string or a conditions object
 * @returns {string | undefined} the file path the target points at
 */
const targetPath = (target) => {
  if (typeof target === 'string') return target;
  if (target === null || typeof target !== 'object') return undefined;
  const picked = target.import ?? target.default ?? Object.values(target).find((value) => typeof value === 'string');
  return targetPath(picked);
};

/**
 * @param {string} pkgDir
 * @param {string} name
 * @param {string} key an exports key with one star
 * @param {string} target the matching target with one star
 * @returns {string[]} the specifiers whose substituted target file exists
 */
const expandStar = (pkgDir, name, key, target) => {
  const [targetHead, targetTail] = target.split('*');
  const dir = join(pkgDir, targetHead);
  if (!existsSync(dir)) return [];
  const [keyHead, keyTail] = key.split('*');
  return readdirSync(dir)
    .filter((entry) => existsSync(join(pkgDir, `${targetHead}${entry}${targetTail}`)))
    .map((entry) => `${name}/${keyHead.slice(2)}${entry}${keyTail}`);
};

/**
 * @param {string} pkgDir
 * @param {string} name
 * @param {string} key
 * @param {string} target
 * @returns {string[]}
 */
const entriesOf = (pkgDir, name, key, target) => {
  if (!CODE_FILE.test(target)) return [];
  if (key === '.') return [name];
  if (key.includes('*')) return target.includes('*') ? expandStar(pkgDir, name, key, target) : [];
  return [`${name}/${key.slice(2)}`];
};

/**
 * @param {string} pkgDir the package folder
 * @param {string} name the package name
 * @returns {string[]} the code entry specifiers, sorted, no duplicates
 */
const prebundleEntries = (pkgDir, name) => {
  const { exports: map } = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
  if (map === undefined || typeof map !== 'object') return [];
  const found = Object.entries(map).flatMap(([key, value]) => {
    const target = targetPath(value);
    return target === undefined || !key.startsWith('.') ? [] : entriesOf(pkgDir, name, key, target);
  });
  return [...new Set(found)].sort();
};

export { prebundleEntries };
