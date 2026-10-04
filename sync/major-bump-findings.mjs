/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const MAJOR_LINE = /^\s*['"]?[^'":\s]+['"]?\s*:\s*major\s*$/m;

/**
 * @param {string} rootDir
 * @returns {string[]} one line per changeset that asks for a major bump
 */
const majorBumpFindings = (rootDir) => {
  const dir = join(rootDir, '.changeset');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .filter((name) => MAJOR_LINE.test(readFileSync(join(dir, name), 'utf8').split(/^---\s*$/m)[1] ?? ''))
    .map((name) => `.changeset/${name}: asks for a major bump; the family stays on 0.x, so use minor for a breaking change and patch for a fix`);
};

export { majorBumpFindings };
