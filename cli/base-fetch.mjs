/* @layer tooling-scripts @kind logic */
import { spawnSync } from 'node:child_process';
import { BASE_BRANCH_ENV, BASE_ENV, DEEPEN_STEP, DEFAULT_BASE_BRANCH, MAX_DEEPEN_ATTEMPTS } from './run.constants.mjs';

const attempt = (cwd, args) => {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  if (result.status === 0) return { ok: true, out: result.stdout.trim() };
  return { ok: false, out: result.stdout.trim(), reason: (result.stderr || result.error?.message || `git exited ${result.status}`).trim().split(/\r?\n/).pop() };
};

const baseBranch = (env) => (env[BASE_ENV] || env[BASE_BRANCH_ENV] || DEFAULT_BASE_BRANCH).replace(/^(?:refs\/heads\/|origin\/)/, '');

/**
 * @param {string} cwd
 * @param {NodeJS.ProcessEnv} env
 * @returns {string | undefined} why the fetch failed
 */
const fetchBase = (cwd, env) => {
  const name = baseBranch(env);
  return attempt(cwd, ['fetch', '--no-tags', '--quiet', 'origin', `+refs/heads/${name}:refs/remotes/origin/${name}`]).reason;
};

/**
 * @template T
 * @param {string} cwd
 * @param {() => T | null} probe
 * @returns {{ value: T | null, reason?: string }} the probe result and the last fetch failure
 */
const deepenUntil = (cwd, probe) => {
  const first = probe();
  if (first) return { value: first };
  if (attempt(cwd, ['rev-parse', '--is-shallow-repository']).out !== 'true') return { value: null };
  for (let tries = 0; tries < MAX_DEEPEN_ATTEMPTS; tries += 1) {
    const fetched = attempt(cwd, ['fetch', '--no-tags', '--quiet', `--deepen=${DEEPEN_STEP}`, 'origin']);
    if (!fetched.ok) return { value: null, reason: fetched.reason };
    const value = probe();
    if (value) return { value };
    if (attempt(cwd, ['rev-parse', '--is-shallow-repository']).out !== 'true') break;
  }
  return { value: null };
};

export { fetchBase, deepenUntil };
