/* @layer tooling-scripts @kind logic */
import { START_TOLERANCE_MS } from './lock.constants.mjs';
import { processStart } from './process-start.mjs';

const exists = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
};

/**
 * @param {number} pid
 * @param {number} [since] epoch ms the holder began
 * @returns {boolean} whether the pid is a live process begun by since
 */
const isAlive = (pid, since) => {
  if (!Number.isInteger(pid) || pid <= 0 || !exists(pid)) return false;
  if (!Number.isFinite(since)) return true;
  const start = processStart(pid);
  return start === undefined || start <= since + START_TOLERANCE_MS;
};

export { isAlive };
