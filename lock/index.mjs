/* @layer tooling-scripts @kind barrel */
export { acquireLock } from './acquire-lock.mjs';
export { withHeavyLock } from './with-lock.mjs';
export { runLocked } from './run-locked.mjs';
export { isAlive } from './is-alive.mjs';
export { lockPath, legacyLockPath } from './lock-file.mjs';
export { slotCount, waitLimitMs } from './lock-settings.mjs';
export { LOCK_HOLDER_ENV, LOCK_DIR_ENV, LOCK_FILE_NAME, LOCK_SLOTS_ENV, LOCK_WAIT_ENV } from './lock.constants.mjs';
