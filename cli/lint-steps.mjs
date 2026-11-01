/* @layer tooling-scripts @kind logic */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OWN_ROOT } from '../config/load.mjs';
import { gitIgnoredGlobs } from '../config/git-ignored.mjs';
import { binOf } from './bin-of.mjs';
import { ESLINT_FILES, JSCPD_FILES } from './run.constants.mjs';

const STANDARDS_BIN = join(OWN_ROOT, 'bin', 'standards.mjs');

const stylelintPattern = (globs) => {
  const extensions = [...new Set(globs.map((glob) => glob.match(/\.(\w+)$/)?.[1]).filter(Boolean))];
  return new RegExp(`\.(?:${extensions.join('|')})$`);
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

/**
 * @param {{ rootDir: string, lint: Record<string, any>, plan: { mode: 'all' | 'changed', files: string[] | null } }} ctx
 * @returns {{ id: string, name?: string, from?: string[], bin?: string, args: string[] }[]} the steps to run, each a child process
 */
const lintSteps = ({ rootDir, lint, plan }) => {
  const theirs = [rootDir, OWN_ROOT];
  const changed = plan.mode === 'changed';
  const styleGlobs = lint.stylelint ?? ['**/*.css'];
  const only = (pattern) => plan.files.filter((file) => pattern.test(file));
  const eslintTargets = changed ? only(ESLINT_FILES) : ['.'];
  const styleTargets = changed ? only(stylelintPattern(styleGlobs)) : styleGlobs;
  const jscpdTargets = changed ? only(JSCPD_FILES) : ['.'];
  const steps = [
    existsSync(join(rootDir, 'tsconfig.json')) && tool('typecheck', 'typescript', theirs, ['--noEmit']),
    eslintTargets.length && tool('eslint', 'eslint', theirs, [...eslintTargets, ...(changed ? ['--no-warn-ignored'] : [])]),
    styleTargets.length && tool('stylelint', 'stylelint', theirs, stylelintArgs(rootDir, styleTargets)),
    standards('prose', ['prose', '--root', rootDir]),
    !changed && standards('knip', ['knip']),
    jscpdTargets.length && tool('jscpd', 'jscpd', theirs, jscpdArgs(rootDir, jscpdTargets)),
  ];
  return steps.filter(Boolean).filter((step) => !(lint.skip ?? []).includes(step.id));
};

/**
 * @param {{ id: string, name?: string, from?: string[], bin?: string }} step
 * @returns {string | null} the script node runs for the step, or null when the tool is not installed
 */
const stepBin = (step) => step.bin ?? binOf(step.name, step.from);

export { lintSteps, stepBin };
