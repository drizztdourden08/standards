/* @layer tooling-scripts @kind logic */
import { mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { LOCK_DIR_ENV, LOCK_FILE_NAME } from './lock.constants.mjs';

const lockDir = (env) => env[LOCK_DIR_ENV] ?? join(homedir(), '.coord', 'locks');

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @param {number} [slot] slot index, from 0
 * @returns {string} the file of one slot: heavy-check.<slot>.lock
 */
const lockPath = (env = process.env, slot = 0) => join(lockDir(env), `heavy-check.${slot}.lock`);

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string} the single heavy-check.lock of an older standards version
 */
const legacyLockPath = (env = process.env) => join(lockDir(env), LOCK_FILE_NAME);

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

export { lockPath, legacyLockPath, readLock, createLock, removeLock, unlinkLock, ageMs };
