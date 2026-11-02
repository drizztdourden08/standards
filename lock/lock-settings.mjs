/* @layer tooling-scripts @kind logic */
import { DEFAULT_SLOTS, DEFAULT_WAIT_S, LOCK_SLOTS_ENV, LOCK_WAIT_ENV } from './lock.constants.mjs';

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {number} the slot count, 3 unless STANDARDS_LOCK_SLOTS is an integer of 1 or more
 */
const slotCount = (env = process.env) => {
  const raw = String(env[LOCK_SLOTS_ENV] ?? '').trim();
  const count = /^\d+$/.test(raw) ? Number(raw) : 0;
  return Number.isSafeInteger(count) && count >= 1 ? count : DEFAULT_SLOTS;
};

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {number} the wait limit in ms, 1800 s unless STANDARDS_LOCK_WAIT_S is a positive number
 */
const waitLimitMs = (env = process.env) => {
  const seconds = Number(env[LOCK_WAIT_ENV]);
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_WAIT_S) * 1000;
};

export { slotCount, waitLimitMs };
