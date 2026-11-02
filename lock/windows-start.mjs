/* @layer tooling-scripts @kind logic */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { START_READ_TIMEOUT_MS } from './lock.constants.mjs';

const SCRIPT = fileURLToPath(new URL('./creation-date.wsf', import.meta.url));
const CREATION_DATE = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.(\d+)([+-]\d+)$/;

const creationMs = (text) => {
  const found = CREATION_DATE.exec(text.trim());
  if (!found) return undefined;
  const [year, month, day, hour, minute, second, micro, offset] = found.slice(1).map(Number);
  return Date.UTC(year, month - 1, day, hour, minute, second, Math.floor(micro / 1000)) - offset * 60000;
};

/**
 * @param {number} pid
 * @returns {number | undefined} epoch ms the process began, if readable
 */
const windowsStart = (pid) => {
  try {
    const text = execFileSync('cscript', ['//nologo', SCRIPT, String(pid)], { encoding: 'utf8', windowsHide: true, timeout: START_READ_TIMEOUT_MS, stdio: ['ignore', 'pipe', 'ignore'] });
    return creationMs(text);
  } catch {
    return undefined;
  }
};

export { windowsStart };
