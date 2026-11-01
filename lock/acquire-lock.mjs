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

const attempt = (file, holder, alive) => {
  if (createLock(file, holder)) return { taken: true };
  const current = readLock(file);
  if (current === null) return { retry: true };
  if (!isStale(file, current, alive)) return { waitingOn: current };
  dropStale(file, current);
  return { retry: true };
};

/**
 * @param {{ root: string, command: string, env?: NodeJS.ProcessEnv, pollMs?: number, alive?: (pid: number) => boolean, log?: (line: string) => void }} job
 * @returns {Promise<() => void>}
 */
const acquireLock = async ({ root, command, env = process.env, pollMs = POLL_MS, alive = isAlive, log = console.error }) => {
  const file = lockPath(env);
  const holder = { pid: process.pid, root, command, startedAt: new Date().toISOString() };
  const started = Date.now();
  let announced = false;
  for (;;) {
    const result = attempt(file, holder, alive);
    if (result.taken) break;
    if (result.retry) continue;
    if (!announced) log(`standards: waiting for the heavy check lock held by pid ${result.waitingOn.pid} (${result.waitingOn.command} in ${result.waitingOn.root})`);
    announced = true;
    await sleep(pollMs);
  }
  if (announced) log(`standards: heavy check lock acquired after ${Math.round((Date.now() - started) / 1000)}s`);
  return () => removeLock(file, process.pid);
};

export { acquireLock };
