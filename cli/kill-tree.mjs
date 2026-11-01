/* @layer tooling-scripts @kind logic */
import { spawnSync } from 'node:child_process';

/**
 * @param {number | undefined} pid
 */
const killTree = (pid) => {
  if (!pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    return;
  }
  try {
    process.kill(-pid, 'SIGKILL');
  } catch {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // the process is already gone
    }
  }
};

export { killTree };
