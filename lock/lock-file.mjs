/* @layer tooling-scripts @kind logic */
import { mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { LOCK_DIR_ENV, LOCK_FILE_NAME } from './lock.constants.mjs';

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string} the lock file path, under ~/.coord/locks unless STANDARDS_LOCK_DIR names another folder
 */
const lockPath = (env = process.env) => join(env[LOCK_DIR_ENV] ?? join(homedir(), '.coord', 'locks'), LOCK_FILE_NAME);

/**
 * @param {string} file
 * @returns {{ pid: number, root: string, command: string, startedAt: string } | null | undefined} the holder, null when the file is missing, undefined when it is unreadable
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
 * @returns {boolean} whether this call created the file; false when another run already holds it
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
const removeLock = (file, pid) => {
  const current = readLock(file);
  if (current === null || (current && current.pid !== pid)) return;
  try {
    unlinkSync(file);
  } catch {
    return;
  }
};

const ageMs = (file) => {
  try {
    return Date.now() - statSync(file).mtimeMs;
  } catch {
    return 0;
  }
};

export { lockPath, readLock, createLock, removeLock, ageMs };
