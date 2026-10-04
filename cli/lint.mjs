/* @layer tooling-scripts @kind logic */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadStandards, OWN_ROOT } from '../config/load.mjs';
import { gitIgnoredGlobs } from '../config/git-ignored.mjs';
import { runProse } from '../prose/index.mjs';
import { binOf } from './bin-of.mjs';
import { runKnip } from './knip.mjs';

const runTool = (rootDir, { name, from, args }) => {
  const bin = binOf(name, from);
  if (!bin) {
    console.error(`standards lint: ${name} is not installed`);
    return 1;
  }
  return spawnSync(process.execPath, [bin, ...args], { cwd: rootDir, stdio: 'inherit' }).status ?? 1;
};

const stylelintArgs = (rootDir, globs) => [
  ...globs,
  '--allow-empty-input',
  ...(existsSync(join(rootDir, '.gitignore')) ? ['--ignore-path', '.gitignore'] : []),
];

const jscpdIgnores = (rootDir) => {
  const file = join(rootDir, '.jscpd.json');
  const own = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).ignore ?? [] : [];
  return [...own, ...gitIgnoredGlobs(rootDir)];
};

const jscpdArgs = (rootDir) => {
  const ignores = jscpdIgnores(rootDir);
  return ignores.length ? ['.', '--ignore', ignores.join(',')] : ['.'];
};

const steps = (rootDir, lint) => {
  const theirs = [rootDir, OWN_ROOT];
  return [
    { id: 'typecheck', when: existsSync(join(rootDir, 'tsconfig.json')), name: 'typescript', from: theirs, args: ['--noEmit'] },
    { id: 'eslint', name: 'eslint', from: theirs, args: ['.'] },
    { id: 'stylelint', name: 'stylelint', from: theirs, args: stylelintArgs(rootDir, lint.stylelint ?? ['**/*.css']) },
    { id: 'prose', run: () => runProse({ rootDir }) },
    { id: 'knip', run: () => runKnip({ rootDir }) },
    { id: 'jscpd', name: 'jscpd', from: theirs, args: jscpdArgs(rootDir) },
  ].filter((step) => step.when !== false && !(lint.skip ?? []).includes(step.id));
};

/**
 * @param {{ rootDir: string }} ctx
 * @returns {number} exit code
 */
const runLint = ({ rootDir }) => {
  const lint = loadStandards({ rootDir }).options.lint ?? {};
  const failed = steps(rootDir, lint).filter((step) => (step.run ? step.run() : runTool(rootDir, step)) !== 0).map((step) => step.id);
  if (!failed.length) return 0;
  console.error(`standards lint: ${failed.length} step(s) failed: ${failed.join(', ')}`);
  return 1;
};

export { runLint };
