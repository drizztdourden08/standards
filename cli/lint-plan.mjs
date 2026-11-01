/* @layer tooling-scripts @kind logic */
import { changedFiles } from './changed-files.mjs';
import { MAX_CHANGED_FILES, WHOLE_TREE_FILES } from './run.constants.mjs';

const label = 'standards lint';

const wholeTreeReason = (files) => {
  const config = files.find((file) => WHOLE_TREE_FILES.test(file));
  if (config) return `${config} can change every result`;
  return files.length > MAX_CHANGED_FILES ? `${files.length} changed files is more than ${MAX_CHANGED_FILES}` : null;
};

const all = (reason) => ({ mode: 'all', files: null, line: `${label}: all files (${reason})` });

/**
 * @param {{ cwd: string, all?: boolean, changed?: boolean, env?: NodeJS.ProcessEnv }} opts
 * @returns {{ mode: 'all' | 'changed', files: string[] | null, line: string }} changed is the default; --all lints everything
 */
const planLint = ({ cwd, all: wantAll = false, changed = false, env = process.env }) => {
  if (wantAll && changed) throw new Error('--all and --changed exclude each other');
  if (wantAll) return all('--all');
  const found = changedFiles(cwd, env);
  if ('failure' in found) return all(`changed files unknown: ${found.failure}`);
  const whole = wholeTreeReason(found.files);
  if (whole) return all(whole);
  const since = `since ${found.base} (merge base with ${found.ref})`;
  return { mode: 'changed', files: found.files, line: `${label}: changed mode, ${found.files.length} files changed ${since}` };
};

export { planLint };
