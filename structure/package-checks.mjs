/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const exportTarget = (entry) => (typeof entry === 'string' ? entry : entry?.default ?? entry?.import);

const hasBarrel = (dir, pkg) => {
  const exportsField = pkg.exports;
  if (!exportsField) return { ok: false, reason: 'no exports; a package has one public barrel' };
  const entries = typeof exportsField === 'string' ? { '.': exportsField } : exportsField;
  const targets = Object.values(entries).map(exportTarget);
  if (!targets.length) return { ok: false, reason: 'exports is empty' };
  const missing = targets.filter((t) => typeof t === 'string' && !t.includes('*') && !existsSync(join(dir, t)));
  return missing.length ? { ok: false, reason: `exports points at ${missing[0]}, which does not exist` } : { ok: true };
};

/**
 * @param {string} dir
 * @param {string} label
 * @param {Record<string, any>} pkg
 * @param {string} scope
 * @returns {string[]}
 */
const packageProblems = (dir, label, pkg, scope) => {
  const problems = [];
  if (!pkg.name?.startsWith(`${scope}/`)) problems.push(`${label}: name "${pkg.name ?? ''}" is not "${scope}/<subject>"`);
  if (!pkg.bin) {
    const barrel = hasBarrel(dir, pkg);
    if (!barrel.ok) problems.push(`${label}: ${barrel.reason}`);
  }
  return problems;
};

/**
 * @param {Record<string, any>} pkg
 * @param {string} [explicit]
 * @returns {string} the npm scope, with its @
 */
const scopeOf = (pkg, explicit) => {
  if (explicit) return explicit.startsWith('@') ? explicit : `@${explicit}`;
  const name = pkg.name ?? '';
  return name.startsWith('@') ? name.split('/')[0] : `@${name.replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'app'}`;
};

const SCOPE_FILES = ['brock.scope', 'standards.scope'];

const scopeFromFile = (rootDir) => {
  const file = SCOPE_FILES.map((name) => join(rootDir, name)).find((path) => existsSync(path));
  return file ? readFileSync(file, 'utf8').trim() : undefined;
};

/**
 * @param {string} rootDir
 * @param {string} [explicit]
 * @returns {string}
 */
const resolveScope = (rootDir, explicit) => {
  const pkgFile = join(rootDir, 'package.json');
  const pkg = existsSync(pkgFile) ? JSON.parse(readFileSync(pkgFile, 'utf8')) : {};
  return scopeOf(pkg, explicit ?? scopeFromFile(rootDir));
};

export { packageProblems, scopeOf, resolveScope };
