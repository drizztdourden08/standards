/* @layer tooling-scripts @kind logic */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { BASE_ENV, BASE_REFS } from './run.constants.mjs';

const git = (cwd, args) => {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true });
  return result.status === 0 ? result.stdout.trim() : null;
};

const lines = (text) => (text ? text.split(/\r?\n/).filter(Boolean) : []);

const knownRef = (cwd, ref) => Boolean(ref) && git(cwd, ['rev-parse', '--verify', '--quiet', ref]) !== null;

const baseRef = (cwd, env) => {
  if (env[BASE_ENV]) return knownRef(cwd, env[BASE_ENV]) ? env[BASE_ENV] : undefined;
  const remoteHead = git(cwd, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
  return [remoteHead, ...BASE_REFS].find((ref) => knownRef(cwd, ref));
};

/**
 * @param {string} cwd
 * @param {NodeJS.ProcessEnv} [env] STANDARDS_BASE names the branch to compare with
 * @returns {{ files: string[], base: string, ref: string } | { failure: string }}
 */
const changedFiles = (cwd, env = process.env) => {
  if (git(cwd, ['rev-parse', '--is-inside-work-tree']) !== 'true') return { failure: 'not a git work tree' };
  const ref = baseRef(cwd, env);
  if (!ref) return { failure: `no default branch found (${BASE_REFS.join(', ')})` };
  const base = git(cwd, ['merge-base', 'HEAD', ref]);
  if (!base) return { failure: `no merge base with ${ref}` };
  const tracked = lines(git(cwd, ['diff', '--name-only', '--diff-filter=ACMR', '--relative', base]));
  const untracked = lines(git(cwd, ['ls-files', '--others', '--exclude-standard']));
  const files = [...new Set([...tracked, ...untracked])].filter((file) => existsSync(join(cwd, file))).sort();
  return { files, base: base.slice(0, 8), ref };
};

export { changedFiles };
