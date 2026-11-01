/* @layer tooling-scripts @kind logic */
import { spawnSync } from 'node:child_process';

/**
 * Kills a process this run started, and everything it started, by its own pid. Never by image name.
 * @param {number | undefined} pid the child pid; on POSIX the child leads its own process group
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
      return;
    }
  }
};

export { killTree };
