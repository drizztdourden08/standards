/* @layer tooling-scripts @kind logic */
import { execFileSync } from 'node:child_process';
import { START_READ_TIMEOUT_MS } from './lock.constants.mjs';

const ETIME = /^(?:(?:(\d+)-)?(\d+):)?(\d+):(\d+)$/;

const etimeSeconds = (text) => {
  const found = ETIME.exec(text.trim());
  if (!found) return undefined;
  const [days, hours, minutes, seconds] = found.slice(1).map((part) => Number(part ?? 0));
  return ((days * 24 + hours) * 60 + minutes) * 60 + seconds;
};

/**
 * @param {number} pid
 * @returns {number | undefined} epoch ms the process began, if readable
 */
const posixStart = (pid) => {
  const asked = Date.now();
  try {
    const text = execFileSync('ps', ['-o', 'etime=', '-p', String(pid)], { encoding: 'utf8', timeout: START_READ_TIMEOUT_MS, stdio: ['ignore', 'pipe', 'ignore'] });
    const seconds = etimeSeconds(text);
    return seconds === undefined ? undefined : asked - seconds * 1000;
  } catch {
    return undefined;
  }
};

export { posixStart };
