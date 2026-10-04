/* @layer tooling-scripts @kind test */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const roots = [];

/**
 * @param {Record<string, string | object>} files path to text, or to an object written as JSON
 * @returns {string} the temp root
 */
const tempTree = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'standards-'));
  roots.push(root);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`);
  }
  return root;
};

/**
 * @param {Record<string, string | object>} files
 * @returns {string} a temp git work tree with an empty global excludes file
 */
const gitTree = (files) => {
  const root = tempTree({ 'global-excludes': '', ...files });
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'core.excludesFile', join(root, 'global-excludes')], { cwd: root });
  return root;
};

const removeTempTrees = () => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
};

export { tempTree, gitTree, removeTempTrees };
