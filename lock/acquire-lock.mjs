/* @layer tooling-scripts @kind logic */
import { isAlive } from './is-alive.mjs';
import { ageMs, createLock, lockPath, readLock, removeLock, unlinkLock } from './lock-file.mjs';
import { DEFAULT_WAIT_S, LOCK_WAIT_ENV, POLL_MS, REMIND_MS, UNREADABLE_GRACE_MS } from './lock.constants.mjs';

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

const isStale = (file, holder, alive) => (holder === undefined ? ageMs(file) > UNREADABLE_GRACE_MS : !alive(holder.pid));

const dropStale = (file, seen) => {
  const again = readLock(file);
  if (again === null || again?.pid !== seen?.pid) return;
  unlinkLock(file);
};

const attempt = (file, holder, alive) => {
  if (createLock(file, holder)) return { taken: true };
  const current = readLock(file);
  if (current === null) return { retry: true };
  if (!isStale(file, current, alive)) return { waitingOn: current };
  dropStale(file, current);
  return { retry: true };
};

const waitLimitMs = (env) => {
  const seconds = Number(env[LOCK_WAIT_ENV]);
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_WAIT_S) * 1000;
};

const heldFor = (holder) => {
  const since = Date.parse(holder.startedAt);
  return Number.isNaN(since) ? '' : `, held for ${Math.round((Date.now() - since) / 1000)}s`;
};

const holderText = (holder) => `pid ${holder.pid} (${holder.command} in ${holder.root}${heldFor(holder)})`;

const waitStep = (wait, current) => {
  const waited = Date.now() - wait.started;
  if (waited > wait.limitMs) throw new Error(`gave up after ${Math.round(waited / 1000)}s waiting for the heavy check lock held by ${holderText(current)}. Set ${LOCK_WAIT_ENV} to wait longer.`);
  if (wait.lastLine && Date.now() - wait.lastLine < REMIND_MS) return;
  wait.log(`standards: waiting for the heavy check lock held by ${holderText(current)}`);
  wait.lastLine = Date.now();
};

/**
 * @param {{ root: string, command: string, env?: NodeJS.ProcessEnv, pollMs?: number, waitMs?: number, alive?: (pid: number) => boolean, log?: (line: string) => void }} job
 * @returns {Promise<() => void>} rejects once the wait passes waitMs
 */
const acquireLock = async ({ root, command, env = process.env, pollMs = POLL_MS, alive = isAlive, log = console.error, waitMs = waitLimitMs(env) }) => {
  const file = lockPath(env);
  const holder = { pid: process.pid, root, command, startedAt: new Date().toISOString() };
  const wait = { started: Date.now(), limitMs: waitMs, lastLine: 0, log };
  for (;;) {
    const result = attempt(file, holder, alive);
    if (result.taken) break;
    if (result.retry) continue;
    waitStep(wait, result.waitingOn);
    await sleep(pollMs);
  }
  if (wait.lastLine) log(`standards: heavy check lock acquired after ${Math.round((Date.now() - wait.started) / 1000)}s`);
  return () => removeLock(file, process.pid);
};

export { acquireLock };
