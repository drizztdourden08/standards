/* @layer tooling-scripts @kind logic */
import { START_CACHE_MS } from './lock.constants.mjs';
import { posixStart } from './posix-start.mjs';
import { windowsStart } from './windows-start.mjs';

const seen = new Map();

/**
 * @param {number} pid
 * @returns {number | undefined} epoch ms the process began, if readable
 */
const processStart = (pid) => {
  const hit = seen.get(pid);
  if (hit && Date.now() - hit.at < START_CACHE_MS) return hit.start;
  const start = process.platform === 'win32' ? windowsStart(pid) : posixStart(pid);
  seen.set(pid, { at: Date.now(), start });
  return start;
};

export { processStart };
