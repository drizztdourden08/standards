/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OWN_ROOT } from '../config/load.mjs';
import { gitIgnoredGlobs } from '../config/git-ignored.mjs';
import { binOf } from './bin-of.mjs';
import { lintableFiles } from './lint-files.mjs';
import { batchesOf } from './lint-batches.mjs';
import { ESLINT_FILES, JSCPD_FILES } from './run.constants.mjs';

const STANDARDS_BIN = join(OWN_ROOT, 'bin', 'standards.mjs');

const stylelintPattern = (globs) => {
  const extensions = [...new Set(globs.map((glob) => glob.match(/\.(\w+)$/)?.[1]).filter(Boolean))];
  return new RegExp(`\\.(?:${extensions.join('|')})$`);
};

const stylelintArgs = (rootDir, targets) => [
  ...targets,
  '--allow-empty-input',
  ...(existsSync(join(rootDir, '.gitignore')) ? ['--ignore-path', '.gitignore'] : []),
];

const jscpdIgnores = (rootDir) => {
  const file = join(rootDir, '.jscpd.json');
  const own = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).ignore ?? [] : [];
  return [...own, ...gitIgnoredGlobs(rootDir)];
};

const jscpdArgs = (rootDir, targets) => {
  const ignores = jscpdIgnores(rootDir);
  return ignores.length ? [...targets, '--ignore', ignores.join(',')] : targets;
};

const tool = (id, name, from, args) => ({ id, name, from, args });
const standards = (id, args) => ({ id, bin: STANDARDS_BIN, args });

const eslintStep = (theirs, files) => {
  const batches = files ? batchesOf(files).map((batch) => [...batch, '--no-warn-ignored']) : [['.']];
  return batches.length && { ...tool('eslint', 'eslint', theirs, batches[0]), batches, heap: true };
};

const targetsOf = (plan, styleGlobs, rootDir) => {
  if (plan.mode !== 'changed') return { eslint: lintableFiles(rootDir), stylelint: styleGlobs, jscpd: ['.'] };
  const only = (pattern) => plan.files.filter((file) => pattern.test(file));
  return { eslint: only(ESLINT_FILES), stylelint: only(stylelintPattern(styleGlobs)), jscpd: only(JSCPD_FILES) };
};

/**
 * @param {{ rootDir: string, lint: Record<string, any>, plan: { mode: 'all' | 'changed', files: string[] | null } }} ctx
 * @returns {{ id: string, name?: string, from?: string[], bin?: string, args: string[] }[]}
 */
const lintSteps = ({ rootDir, lint, plan }) => {
  const theirs = [rootDir, OWN_ROOT];
  const changed = plan.mode === 'changed';
  const targets = targetsOf(plan, lint.stylelint ?? ['**/*.css'], rootDir);
  const steps = [
    existsSync(join(rootDir, 'tsconfig.json')) && tool('typecheck', 'typescript', theirs, ['--noEmit']),
    eslintStep(theirs, targets.eslint),
    targets.stylelint.length && tool('stylelint', 'stylelint', theirs, stylelintArgs(rootDir, targets.stylelint)),
    standards('prose', ['prose', '--root', rootDir]),
    !changed && standards('knip', ['knip']),
    targets.jscpd.length && tool('jscpd', 'jscpd', theirs, jscpdArgs(rootDir, targets.jscpd)),
  ];
  return steps.filter(Boolean).filter((step) => !(lint.skip ?? []).includes(step.id));
};

/**
 * @param {{ id: string, name?: string, from?: string[], bin?: string }} step
 * @returns {string | null}
 */
const stepBin = (step) => step.bin ?? binOf(step.name, step.from);

export { lintSteps, stepBin };
