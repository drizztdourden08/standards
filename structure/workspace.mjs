/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_GLOBS = ['apps/*', 'packages/*', 'tooling/*'];

const unquote = (value) => value.trim().replace(/^['"]|['"]$/g, '');

/**
 * @param {string} rootDir
 * @returns {{ globs: string[], declared: boolean }}
 */
const workspaceGlobs = (rootDir) => {
  const file = join(rootDir, 'pnpm-workspace.yaml');
  if (!existsSync(file)) return { globs: DEFAULT_GLOBS, declared: false };
  const globs = [];
  let inPackages = false;
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trimEnd();
    const inline = line.match(/^packages:\s*\[(.*)\]\s*$/);
    if (inline) {
      globs.push(...inline[1].split(',').map(unquote).filter(Boolean));
      return { globs, declared: true };
    }
    if (/^packages:\s*$/.test(line)) { inPackages = true; continue; }
    if (inPackages && /^\s+-\s+/.test(line)) { globs.push(unquote(line.replace(/^\s+-\s+/, ''))); continue; }
    if (inPackages && /^\S/.test(line)) inPackages = false;
  }
  return { globs, declared: true };
};

const globBase = (glob) => glob.split('/*')[0];

/**
 * @param {string} rootDir
 * @param {string} glob
 * @param {Set<string>} bases
 * @returns {string[]}
 */
const expandGlob = (rootDir, glob, bases) => {
  const [base, tail] = glob.split('/*');
  if (tail === undefined) return existsSync(join(rootDir, glob)) ? [join(rootDir, glob)] : [];
  const dir = join(rootDir, base);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => !bases.has(`${base}/${n}`))
    .map((n) => join(dir, n))
    .filter((p) => statSync(p).isDirectory());
};

/**
 * @param {string} rootDir
 * @returns {{ dirs: string[], declared: boolean }}
 */
const workspaceDirs = (rootDir) => {
  const { globs, declared } = workspaceGlobs(rootDir);
  const bases = new Set(globs.map(globBase).filter((b) => b.includes('/')));
  const dirs = globs.flatMap((g) => expandGlob(rootDir, g, bases));
  return { dirs, declared };
};

export { workspaceGlobs, globBase, expandGlob, workspaceDirs };
