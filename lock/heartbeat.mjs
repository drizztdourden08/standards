/* @layer tooling-scripts @kind logic */
import { utimesSync } from 'node:fs';
import { HEARTBEAT_MS } from './lock.constants.mjs';

const touch = (file) => {
  try {
    const now = new Date();
    utimesSync(file, now, now);
  } catch {
    return;
  }
};

/**
 * @param {string} file the lock file to keep fresh
 * @returns {() => void} stops the beat
 */
const startHeartbeat = (file) => {
  const timer = setInterval(() => touch(file), HEARTBEAT_MS);
  timer.unref();
  return () => clearInterval(timer);
};

export { startHeartbeat };
