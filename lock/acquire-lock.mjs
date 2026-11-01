/* @layer tooling-scripts @kind logic */
import { unlinkSync } from 'node:fs';
import { isAlive } from './is-alive.mjs';
import { ageMs, createLock, lockPath, readLock, removeLock } from './lock-file.mjs';
import { POLL_MS, UNREADABLE_GRACE_MS } from './lock.constants.mjs';

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

const isStale = (file, holder, alive) => (holder === undefined ? ageMs(file) > UNREADABLE_GRACE_MS : !alive(holder.pid));

const dropStale = (file, seen) => {
  const again = readLock(file);
  if (again === null || again?.pid !== seen?.pid) return;
  try {
    unlinkSync(file);
  } catch {
    return;
  }
};

/**
 * Takes the machine-wide heavy check lock. Waits for a live holder, takes over a lock whose pid is dead.
 * @param {{ root: string, command: string, env?: NodeJS.ProcessEnv, pollMs?: number, alive?: (pid: number) => boolean, log?: (line: string) => void }} job
 * @returns {Promise<() => void>} release
 */
const acquireLock = async ({ root, command, env = process.env, pollMs = POLL_MS, alive = isAlive, log = console.error }) => {
  const file = lockPath(env);
  const holder = { pid: process.pid, root, command, startedAt: new Date().toISOString() };
  const started = Date.now();
  let announced = false;
  for (;;) {
    if (createLock(file, holder)) break;
    const current = readLock(file);
    if (current !== null && isStale(file, current, alive)) {
      dropStale(file, current);
      continue;
    }
    if (current !== null && !announced) {
      log(`standards: waiting for the heavy check lock held by pid ${current.pid} (${current.command} in ${current.root})`);
      announced = true;
    }
    await sleep(pollMs);
  }
  if (announced) log(`standards: heavy check lock acquired after ${Math.round((Date.now() - started) / 1000)}s`);
  return () => removeLock(file, process.pid);
};

export { acquireLock };
