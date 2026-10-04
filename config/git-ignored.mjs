/* @layer tooling-scripts @kind logic */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const GLOB_CHARS = /[*?[\]{}()!+@\\]/g;
const cache = new Map();

const escapeGlob = (path) => path.replace(GLOB_CHARS, '\\$&');

const globOfPath = (path) => (path.endsWith('/') ? `${escapeGlob(path)}**` : escapeGlob(path));

const fromGit = (rootDir) => {
  try {
    const out = execFileSync('git', ['ls-files', '--others', '--ignored', '--exclude-standard', '--directory', '-z'], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    });
    return out.split('\0').filter(Boolean).map(globOfPath);
  } catch {
    return null;
  }
};

const globsOfLine = (line) => {
  const dirOnly = line.endsWith('/');
  const body = line.replace(/^\//, '').replace(/\/$/, '');
  const anchored = line.startsWith('/') || body.includes('/');
  const glob = anchored ? body : `**/${body}`;
  return dirOnly ? [`${glob}/**`] : [glob, `${glob}/**`];
};

const fromGitignoreFile = (rootDir) => {
  const file = join(rootDir, '.gitignore');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('!'))
    .flatMap(globsOfLine);
};

/**
 * @param {string} rootDir
 * @returns {string[]} globs of git-ignored paths, from rootDir
 */
const gitIgnoredGlobs = (rootDir) => {
  const key = resolve(rootDir);
  if (!cache.has(key)) cache.set(key, fromGit(key) ?? fromGitignoreFile(key));
  return cache.get(key);
};

export { gitIgnoredGlobs };
