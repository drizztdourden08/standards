/* @layer tooling-scripts @kind logic */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { loadStandards, OWN_ROOT } from '../config/load.mjs';
import { runProse } from '../prose/index.mjs';

const binOf = (name, fromDirs) => {
  for (const dir of fromDirs) {
    try {
      const pkgFile = createRequire(join(dir, 'package.json')).resolve(`${name}/package.json`);
      const { bin } = JSON.parse(readFileSync(pkgFile, 'utf8'));
      const entry = typeof bin === 'string' ? bin : bin?.[name] ?? Object.values(bin ?? {})[0];
      if (entry) return resolve(dirname(pkgFile), entry);
    } catch {
      continue;
    }
  }
  return null;
};

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

const steps = (rootDir, lint) => {
  const theirs = [rootDir, OWN_ROOT];
  return [
    { id: 'typecheck', when: existsSync(join(rootDir, 'tsconfig.json')), name: 'typescript', from: theirs, args: ['--noEmit'] },
    { id: 'eslint', name: 'eslint', from: theirs, args: ['.'] },
    { id: 'stylelint', name: 'stylelint', from: theirs, args: stylelintArgs(rootDir, lint.stylelint ?? ['**/*.css']) },
    { id: 'prose', run: () => runProse({ rootDir }) },
    { id: 'knip', name: 'knip', from: theirs, args: [] },
    { id: 'jscpd', name: 'jscpd', from: theirs, args: ['.'] },
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
