/* @layer tooling-scripts @kind logic */
import { mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { LOCK_DIR_ENV, LOCK_FILE_NAME } from './lock.constants.mjs';

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string}
 */
const lockPath = (env = process.env) => join(env[LOCK_DIR_ENV] ?? join(homedir(), '.coord', 'locks'), LOCK_FILE_NAME);

/**
 * @param {string} file
 * @returns {{ pid: number, root: string, command: string, startedAt: string } | null | undefined}
 */
const readLock = (file) => {
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    return Number.isInteger(data?.pid) ? data : undefined;
  } catch (error) {
    return error.code === 'ENOENT' ? null : undefined;
  }
};

/**
 * @param {string} file
 * @param {Record<string, unknown>} holder
 * @returns {boolean}
 */
const createLock = (file, holder) => {
  mkdirSync(join(file, '..'), { recursive: true });
  try {
    writeFileSync(file, `${JSON.stringify(holder)}\n`, { flag: 'wx' });
    return true;
  } catch (error) {
    if (error.code === 'EEXIST') return false;
    throw error;
  }
};

/**
 * @param {string} file
 * @param {number} pid remove the file only while this pid still owns it
 */
const unlinkLock = (file) => {
  try {
    unlinkSync(file);
    return true;
  } catch {
    return false;
  }
};

const removeLock = (file, pid) => {
  const current = readLock(file);
  if (current === null || (current && current.pid !== pid)) return;
  unlinkLock(file);
};

const ageMs = (file) => {
  try {
    return Date.now() - statSync(file).mtimeMs;
  } catch {
    return 0;
  }
};

export { lockPath, readLock, createLock, removeLock, unlinkLock, ageMs };
