/* @layer tooling-scripts @kind logic */
import { spawnSync } from 'node:child_process';

/**
 * @param {number | undefined} pid
 */
const sendKill = (target) => {
  try {
    return process.kill(target, 'SIGKILL');
  } catch {
    return false;
  }
};

const killTree = (pid) => {
  if (!pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    return;
  }
  if (!sendKill(-pid)) sendKill(pid);
};

export { killTree };
